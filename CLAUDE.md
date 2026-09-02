@AGENTS.md

# 프로젝트: 콘티 모음 (요셉피아 중등부)

광천교회 요셉피아 중등부용 사이트. 매주 예배 콘티(찬양 순서)에 쓰이는 유튜브
링크를 곡 제목 + 순서와 함께 모아보고, 이어서 자동 재생할 수 있게 한다.
한 명(담당자)이 콘티를 등록하고, 나머지는 조회/재생만 하는 구조 — 로그인,
멀티유저 편집, 백엔드/DB는 없다.

## 스택

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4. 데이터는 DB 없이
`data/setlists.ts` 안의 배열로 관리한다 (콘티 추가 = 이 파일 수정 + git push).

## 콘티(곡 목록) 추가하는 법

`data/setlists.ts`의 `setlists` 배열에 객체를 하나 추가한다. 형식과 예시는
`README.md`에 있음. 요약:

```ts
{
  id: "2026-09-13",       // URL slug, 안 겹치면 아무거나 (보통 날짜)
  title: "9월 13일 콘티",
  date: "2026-09-13",     // YYYY-MM-DD
  verse: { reference: "...", text: "..." }, // 선택
  songs: [
    { title: "곡 제목", url: "유튜브 링크(watch/youtu.be/shorts 다 지원)" },
  ],
}
```

곡은 배열 순서대로 표시/재생됨. 추가 후 `npm run build && npm run lint`로
확인하고 커밋/푸시하면 끝.

## 배포 (중요 — 안 지키면 사이트 안 바뀜)

- GitHub: `jinhyeokAn/Worship_Setlist_M`. **개발/작업 브랜치이자 저장소의
  default 브랜치는 `claude/konti-youtube-link-aggregator-f9jt4w`.**
  `main` 브랜치는 PR #1을 열기 위해 만든 빈 시작점(orphan commit)일 뿐,
  실제 코드는 없다. `main`에 작업하지 말 것.
- Vercel: 프로젝트명 `worship-setlist` (팀 `cluade`), 실제 접속 주소는
  **https://josephia-worship.vercel.app** — Settings → Environments →
  Production 의 Branch Tracking이 `claude/konti-youtube-link-aggregator-f9jt4w`
  로 설정되어 있어야 push할 때마다 이 주소로 자동 배포된다. (한번 이 설정이
  `main`으로 잘못 잡혀서 프로덕션이 안 갱신된 적 있었음 — Environments 탭에서
  확인.)
  - 같은 팀에 `worship-setlist-m`이라는 프로젝트가 하나 더 있는데, 이건 예전에
    Vercel MCP 도구로 파일 직접 업로드해서 만든 GitHub 미연결 잔재물이다.
    무시하거나 지워도 됨 — 실제로 쓰는 건 `worship-setlist` 하나뿐.
  - 이 세션에서 연결된 Vercel MCP 통합은 권한이 불안정해서(preview/production
    배포, 프로젝트 조회 다 간헐적으로 403/404 남) 신뢰하지 말 것. 배포는
    git push → Vercel의 GitHub 연동이 자동으로 처리하는 방식에 의존한다.

## 디자인

다크 테마 고정(라이트모드 없음), 포인트 컬러는 라임그린
(`app/globals.css`의 `--accent`). 멜론/스포티파이 같은 음원차트 앱 톤 —
`components/SetlistPlayer.tsx`(재생 컨트롤: 셔플/이전/재생/다음/반복/볼륨,
전부 유튜브 IFrame API에 실제 연결됨), 홈 화면은 최근 콘티 캐러셀 +
차트 스타일 리스트(`app/page.tsx`). 헤더 로고는 `public/logo.png`
(요셉피아 중등부 실제 로고, `components/SiteHeader.tsx`에서 사용).

검색창(홈)은 콘티 제목과 곡 제목 둘 다 매칭한다.

## 알려진 이슈 대응

전체화면 상태에서 유튜브 IFrame API의 종료(ENDED) 이벤트가 일부 모바일
브라우저에서 씹히는 문제가 있어서, `SetlistPlayer.tsx`에 재생 위치를
0.5초마다 폴링해서 곡 종료를 보조 감지하는 로직이 들어가 있다
(`handleEnded` / `endHandledRef` 참고). 이 부분 건드릴 때 유의.

## 로컬 실행 / 검증

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 커밋 전 항상 확인
npm run lint
```
