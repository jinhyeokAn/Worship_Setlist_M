const STORAGE_KEY = "admin_auth";

export type AdminAuth = { id: string; password: string };

/** 브라우저에 저장된 관리자 인증 정보를 읽습니다. 저장된 게 없으면 null (= 관리자 모드 꺼짐). */
export function getAdminAuth(): AdminAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.id === "string" && typeof parsed?.password === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/** 로그인 성공 시 호출 — 관리자 모드를 켭니다. */
export function setAdminAuth(auth: AdminAuth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

/** 관리자 모드를 끕니다. */
export function clearAdminAuth() {
  localStorage.removeItem(STORAGE_KEY);
}
