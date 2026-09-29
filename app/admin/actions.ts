"use server";

import { getYoutubeVideoId } from "@/lib/youtube";
import type { Setlist } from "@/data/setlists";

const OWNER = "jinhyeokAn";
const REPO = "Worship_Setlist_M";
const BRANCH = "claude/konti-youtube-link-aggregator-f9jt4w";
const FILE_PATH = "data/setlists.json";

export type SubmitSetlistInput = {
  adminId: string;
  adminPassword: string;
  setlist: Setlist;
};

export type UpdateSetlistInput = {
  adminId: string;
  adminPassword: string;
  originalId: string;
  setlist: Setlist;
};

export type DeleteSetlistInput = {
  adminId: string;
  adminPassword: string;
  id: string;
};

export type SubmitSetlistResult = { ok: true } | { ok: false; error: string };
export type ListSetlistsResult =
  | { ok: true; setlists: Setlist[] }
  | { ok: false; error: string };

export type YoutubeSuggestion = {
  videoId: string;
  title: string;
  url: string;
  thumbnail: string;
};
export type SearchYoutubeResult =
  | { ok: true; results: YoutubeSuggestion[] }
  | { ok: false; error: string };

function checkCredentials(adminId: string, adminPassword: string): string | null {
  const expectedId = process.env.ADMIN_ID;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const token = process.env.GITHUB_TOKEN;

  if (!expectedId || !expectedPassword || !token) {
    return "관리자 기능이 아직 설정되지 않았습니다 (ADMIN_ID / ADMIN_PASSWORD / GITHUB_TOKEN 환경변수 필요).";
  }
  if (adminId !== expectedId || adminPassword !== expectedPassword) {
    return "아이디 또는 비밀번호가 올바르지 않습니다.";
  }
  return null;
}

function validateSetlist(setlist: Setlist): string | null {
  if (!setlist.title.trim()) return "콘티 제목을 입력하세요.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(setlist.date)) return "날짜 형식이 올바르지 않습니다.";
  if (setlist.songs.length === 0) return "곡을 하나 이상 추가하세요.";
  for (const song of setlist.songs) {
    if (!song.title.trim()) return "곡 제목이 비어있는 항목이 있습니다.";
    if (!getYoutubeVideoId(song.url)) {
      return `유튜브 링크를 확인해주세요: ${song.url}`;
    }
  }
  return null;
}

const contentsUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;

function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };
}

async function fetchCurrent(
  token: string,
): Promise<{ ok: true; setlists: Setlist[]; sha: string } | { ok: false; error: string }> {
  const getRes = await fetch(contentsUrl, { headers: githubHeaders(token), cache: "no-store" });
  if (!getRes.ok) {
    return { ok: false, error: `GitHub에서 기존 콘티를 불러오지 못했습니다 (${getRes.status}).` };
  }
  const getData = (await getRes.json()) as { content: string; sha: string };
  const setlists = JSON.parse(
    Buffer.from(getData.content, "base64").toString("utf-8"),
  ) as Setlist[];
  return { ok: true, setlists, sha: getData.sha };
}

async function commitSetlists(
  token: string,
  sha: string,
  setlists: Setlist[],
  message: string,
): Promise<SubmitSetlistResult> {
  const newContent = Buffer.from(
    JSON.stringify(setlists, null, 2) + "\n",
    "utf-8",
  ).toString("base64");

  const putRes = await fetch(contentsUrl.split("?")[0], {
    method: "PUT",
    headers: { ...githubHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ message, content: newContent, sha, branch: BRANCH }),
  });

  if (!putRes.ok) {
    const body = await putRes.text();
    return { ok: false, error: `GitHub 저장에 실패했습니다 (${putRes.status}): ${body}` };
  }
  return { ok: true };
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

type YoutubeSearchApiResponse = {
  items?: {
    id: { videoId: string };
    snippet: { title: string; thumbnails?: { default?: { url: string } } };
  }[];
};

export async function searchYoutube(
  adminId: string,
  adminPassword: string,
  query: string,
): Promise<SearchYoutubeResult> {
  const credError = checkCredentials(adminId, adminPassword);
  if (credError) return { ok: false, error: credError };

  if (!query.trim()) return { ok: true, results: [] };

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "YOUTUBE_API_KEY 환경변수가 설정되지 않았습니다." };
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(query)}&key=${apiKey}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: `유튜브 검색에 실패했습니다 (${res.status}): ${body.slice(0, 200)}` };
  }
  const data = (await res.json()) as YoutubeSearchApiResponse;
  const results: YoutubeSuggestion[] = (data.items ?? []).map((item) => ({
    videoId: item.id.videoId,
    title: decodeHtmlEntities(item.snippet.title),
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    thumbnail: item.snippet.thumbnails?.default?.url ?? "",
  }));
  return { ok: true, results };
}

export async function verifyAdmin(
  adminId: string,
  adminPassword: string,
): Promise<SubmitSetlistResult> {
  const error = checkCredentials(adminId, adminPassword);
  if (error) return { ok: false, error };
  return { ok: true };
}

export async function listSetlists(
  adminId: string,
  adminPassword: string,
): Promise<ListSetlistsResult> {
  const error = checkCredentials(adminId, adminPassword);
  if (error) return { ok: false, error };

  const token = process.env.GITHUB_TOKEN!;
  const current = await fetchCurrent(token);
  if (!current.ok) return current;
  return { ok: true, setlists: current.setlists };
}

export async function submitSetlist({
  adminId,
  adminPassword,
  setlist,
}: SubmitSetlistInput): Promise<SubmitSetlistResult> {
  const credError = checkCredentials(adminId, adminPassword);
  if (credError) return { ok: false, error: credError };

  const validationError = validateSetlist(setlist);
  if (validationError) return { ok: false, error: validationError };

  const token = process.env.GITHUB_TOKEN!;
  const current = await fetchCurrent(token);
  if (!current.ok) return current;

  if (current.setlists.some((s) => s.id === setlist.id)) {
    return { ok: false, error: "같은 날짜의 콘티가 이미 등록되어 있습니다." };
  }

  const updated = [...current.setlists, setlist];
  return commitSetlists(token, current.sha, updated, `콘티 추가: ${setlist.title}`);
}

export async function updateSetlist({
  adminId,
  adminPassword,
  originalId,
  setlist,
}: UpdateSetlistInput): Promise<SubmitSetlistResult> {
  const credError = checkCredentials(adminId, adminPassword);
  if (credError) return { ok: false, error: credError };

  const validationError = validateSetlist(setlist);
  if (validationError) return { ok: false, error: validationError };

  const token = process.env.GITHUB_TOKEN!;
  const current = await fetchCurrent(token);
  if (!current.ok) return current;

  const index = current.setlists.findIndex((s) => s.id === originalId);
  if (index === -1) return { ok: false, error: "수정하려는 콘티를 찾을 수 없습니다." };

  if (setlist.id !== originalId && current.setlists.some((s) => s.id === setlist.id)) {
    return { ok: false, error: "같은 날짜의 콘티가 이미 등록되어 있습니다." };
  }

  const updated = [...current.setlists];
  updated[index] = setlist;
  return commitSetlists(token, current.sha, updated, `콘티 수정: ${setlist.title}`);
}

export async function deleteSetlist({
  adminId,
  adminPassword,
  id,
}: DeleteSetlistInput): Promise<SubmitSetlistResult> {
  const credError = checkCredentials(adminId, adminPassword);
  if (credError) return { ok: false, error: credError };

  const token = process.env.GITHUB_TOKEN!;
  const current = await fetchCurrent(token);
  if (!current.ok) return current;

  const updated = current.setlists.filter((s) => s.id !== id);
  if (updated.length === current.setlists.length) {
    return { ok: false, error: "삭제하려는 콘티를 찾을 수 없습니다." };
  }

  const removed = current.setlists.find((s) => s.id === id);
  return commitSetlists(token, current.sha, updated, `콘티 삭제: ${removed?.title ?? id}`);
}
