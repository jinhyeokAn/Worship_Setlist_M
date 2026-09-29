# 콘티 모음

찬양 콘티(예배 순서)에 쓰이는 유튜브 링크를 곡 제목 + 순서와 함께 한 페이지에서
모아 보고, 순서대로 이어서 재생할 수 있는 사이트입니다.

## 콘티 추가하는 법

두 가지 방법이 있습니다.

### 1. 관리자 화면에서 등록 (코딩 몰라도 됨)

사이트 맨 아래 "Soli Deo Gloria" 문구를 3번 연속 탭하면 숨겨진 `/admin` 화면으로
이동합니다. 로그인하면 관리자 모드가 이 브라우저에 계속 유지되고(끄려면 같은
자리에 생기는 "관리자 모드 끄기" 링크 사용), 폼을 채워 등록하면 GitHub에 자동으로
커밋되고 Vercel이 재배포하면서 잠시 후 사이트에 반영됩니다. 기존 콘티 수정·삭제는
그 콘티 상세 페이지에서 관리자 모드일 때 뜨는 버튼으로 합니다.

이 기능을 쓰려면 Vercel 프로젝트(`worship-setlist`) Settings → Environment
Variables에 아래 값을 등록해야 합니다.

- `ADMIN_ID`, `ADMIN_PASSWORD` — 관리자 화면 로그인에 쓸 아이디/비밀번호 (원하는 값으로)
- `GITHUB_TOKEN` — 이 저장소에 콘텐츠 읽기/쓰기 권한을 가진 GitHub Personal Access
  Token. github.com → Settings → Developer settings → Fine-grained tokens에서
  이 저장소(`jinhyeokAn/Worship_Setlist_M`) 하나만 골라서 만들고, Repository
  permissions의 **Contents: Read and write**만 켜면 됩니다. 유출되면 저장소에
  마음대로 커밋할 수 있는 값이니 절대 코드/커밋에 남기지 말고 환경변수로만 관리하세요.
- `YOUTUBE_API_KEY` (선택) — 곡 등록 폼에서 제목 입력하면 유튜브 검색 결과가
  떠서 클릭으로 링크를 채울 수 있게 해주는 기능에 씁니다. 없어도 나머지 관리자
  기능은 정상 동작하고, 검색창엔 안내 에러만 뜹니다.

위 필수 값(ADMIN_ID/ADMIN_PASSWORD/GITHUB_TOKEN)이 하나라도 없으면 관리자
화면은 등록 시도 시 "관리자 기능이 아직 설정되지 않았습니다" 에러를 보여줍니다.

청년부 자매 사이트(`jinhyeokAn/Worship_Setlist`)와 별개 저장소이므로, 이 환경
변수들은 이 프로젝트의 Vercel 프로젝트에 따로 설정해야 합니다 (값은 같아도 되고
달라도 됩니다).

### 2. 파일 직접 수정 (기존 방식)

`data/setlists.json` 파일의 배열에 아래 형태로 하나 추가하고 커밋/푸시하면
자동으로 사이트에 반영됩니다. `data/setlists.ts`는 이 JSON 파일을 그대로
불러오기만 하므로 직접 수정할 필요는 없습니다.

```json
[
  {
    "id": "2026-09-06",
    "title": "9월 첫째주 콘티",
    "date": "2026-09-06",
    "verse": {
      "reference": "요한복음 3:16",
      "text": "하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니..."
    },
    "songs": [
      { "title": "은혜", "url": "https://www.youtube.com/watch?v=xxxxxxxxxxx" },
      { "title": "주 은혜임을", "url": "https://youtu.be/xxxxxxxxxxx" }
    ]
  }
]
```

- `id`는 다른 콘티와 겹치지 않게만 정하면 됩니다 (날짜를 그대로 써도 됨).
- `verse`는 선택 항목이라 없으면 통째로 생략해도 됩니다. `verse.link`(선택)로
  본문 전체를 볼 수 있는 외부 링크를 추가할 수 있습니다.
- `url`은 일반 유튜브 링크(`watch?v=`), 단축 링크(`youtu.be/`), Shorts 링크 모두 지원합니다.
- 곡은 배열 순서대로 콘티 화면에 표시/재생됩니다.

## 로컬에서 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 배포

GitHub 기본/개발 브랜치는 `claude/konti-youtube-link-aggregator-f9jt4w`이며,
Vercel에서 이 브랜치를 Production으로 추적하도록 연결되어 있습니다 (`main`은
쓰지 않는 빈 브랜치). 이 브랜치에 푸시할 때마다 자동으로 배포됩니다.
