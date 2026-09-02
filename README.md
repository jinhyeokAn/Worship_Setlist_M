# 콘티 모음

찬양 콘티(예배 순서)에 쓰이는 유튜브 링크를 곡 제목 + 순서와 함께 한 페이지에서
모아 보고, 순서대로 이어서 재생할 수 있는 사이트입니다.

## 콘티 추가하는 법

`data/setlists.ts` 파일의 `setlists` 배열에 아래 형태로 하나 추가하고 커밋/푸시하면
자동으로 사이트에 반영됩니다 (Vercel 배포 시 push 즉시 재배포).

```ts
export const setlists: Setlist[] = [
  {
    id: "2026-09-06",           // URL에 쓰이는 고유 id
    title: "9월 첫째주 예배",     // 콘티 제목
    date: "2026-09-06",         // YYYY-MM-DD
    songs: [
      { title: "은혜", url: "https://www.youtube.com/watch?v=xxxxxxxxxxx" },
      { title: "주 은혜임을", url: "https://youtu.be/xxxxxxxxxxx" },
    ],
  },
];
```

- `id`는 다른 콘티와 겹치지 않게만 정하면 됩니다 (날짜를 그대로 써도 됨).
- `url`은 일반 유튜브 링크(`watch?v=`), 단축 링크(`youtu.be/`), Shorts 링크 모두 지원합니다.
- 곡은 배열 순서대로 콘티 화면에 표시/재생됩니다.

## 로컬에서 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 배포

Vercel에 이 저장소를 연결하면 `main` 브랜치에 푸시할 때마다 자동으로 배포됩니다.
