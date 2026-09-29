import raw from "./setlists.json";

export type Song = {
  /** 곡 제목 */
  title: string;
  /** 유튜브 링크 (watch, youtu.be, shorts 링크 모두 지원) */
  url: string;
};

export type Verse = {
  /** 성경 본문 위치, 예: "요한복음 3:16" */
  reference: string;
  /** 본문 내용 */
  text: string;
  /** 전체 본문을 볼 수 있는 외부 링크 (선택) */
  link?: string;
};

export type Setlist = {
  /** URL에 쓰이는 고유 id (영문/숫자/하이픈 권장) */
  id: string;
  /** 콘티 제목, 예: "9월 첫째주 콘티" */
  title: string;
  /** 날짜, YYYY-MM-DD */
  date: string;
  /** 이번 예배 말씀 본문 (선택) */
  verse?: Verse;
  /** 순서대로 정리한 곡 목록 */
  songs: Song[];
};

// 콘티 데이터는 data/setlists.json에 있습니다. 이 배열에 직접 객체를 추가해서
// git push 하거나, 사이트의 숨은 관리자 화면(/admin)에서 등록해도 됩니다.
// 자세한 방법은 README.md 참고.
export const setlists: Setlist[] = raw as Setlist[];
