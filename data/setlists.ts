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
};

export type Setlist = {
  /** URL에 쓰이는 고유 id (영문/숫자/하이픈 권장) */
  id: string;
  /** 콘티 제목, 예: "9월 첫째주 예배" */
  title: string;
  /** 날짜, YYYY-MM-DD */
  date: string;
  /** 이번 예배 말씀 본문 (선택) */
  verse?: Verse;
  /** 순서대로 정리한 곡 목록 */
  songs: Song[];
};

// 새 콘티를 추가하려면 이 배열에 객체를 하나 더 넣고 git push 하면 됩니다.
// 자세한 방법은 README.md 참고.
export const setlists: Setlist[] = [
  {
    id: "2026-09-06",
    title: "9월 6일 콘티",
    date: "2026-09-06",
    verse: {
      reference: "요한복음 15:9",
      text: "아버지께서 나를 사랑하신 것 같이 나도 너희를 사랑하였으니 나의 사랑 안에 거하라.",
    },
    songs: [
      { title: "손잡고 함께가세", url: "https://youtu.be/MB83DFD4XW0" },
      { title: "주 사랑이 내게 들어와", url: "https://youtu.be/HgiNfcAWmhI" },
      { title: "나 주님을 모른다하여도", url: "https://youtu.be/VeuP0yejeYM" },
    ],
  },
  {
    id: "2026-09-13",
    title: "9월 13일 콘티",
    date: "2026-09-13",
    songs: [
      { title: "주를 찾는 모든 자들이", url: "https://youtu.be/Fi2waeWY18g" },
      { title: "춤추는 세대", url: "https://youtu.be/i_DL8AjxGCQ" },
      { title: "나 주님을 모른다 하여도", url: "https://youtu.be/VeuP0yejeYM" },
    ],
  },
  {
    id: "2026-09-20",
    title: "9월 20일 콘티",
    date: "2026-09-20",
    songs: [
      { title: "입례", url: "https://youtu.be/6Xdy8I6aGpg" },
      { title: "우리 주 안에서 노래하며", url: "https://youtu.be/oAUnC6BQ8QY" },
      { title: "나 주님을 모른다 하여도", url: "https://youtu.be/VeuP0yejeYM" },
    ],
  },
  {
    id: "2026-10-04",
    title: "10월 4일 콘티",
    date: "2026-10-04",
    songs: [
      { title: "선하신 목자", url: "https://youtu.be/2O4geYCjsnw" },
      { title: "모든 이름 위에 뛰어난 이름", url: "https://youtu.be/RM7RiBIHvKY" },
      { title: "내 이름 아시죠", url: "https://youtu.be/LOqNAXUO6bU" },
    ],
  },
];
