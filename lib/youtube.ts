export function getYoutubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return u.pathname.slice(1).split("/")[0] || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] ?? null;
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] ?? null;
      if (u.pathname.startsWith("/live/")) return u.pathname.split("/")[2] ?? null;
    }

    return null;
  } catch {
    return null;
  }
}

export function getYoutubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
