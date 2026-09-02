export type Song = {
  /** 곡 제목 */
  title: string;
  /** 유튜브 링크 (watch, youtu.be, shorts 링크 모두 지원) */
  url: string;
};

export type Setlist = {
  /** URL에 쓰이는 고유 id (영문/숫자/하이픈 권장) */
  id: string;
  /** 콘티 제목, 예: "9월 첫째주 예배" */
  title: string;
  /** 날짜, YYYY-MM-DD */
  date: string;
  /** 순서대로 정리한 곡 목록 */
  songs: Song[];
};

// 새 콘티를 추가하려면 이 배열에 객체를 하나 더 넣고 git push 하면 됩니다.
// 자세한 방법은 README.md 참고.
export const setlists: Setlist[] = [];
