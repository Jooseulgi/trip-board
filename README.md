# 🧳 트립보드

친구랑 같이 모으는 여행 위시리스트.
인스타·지도에서 **캡쳐한 사진을 ⌘V로 붙여넣으면** 카드가 만들어지고,
거기에 코멘트를 달면서 어디 갈지 같이 고르는 보드예요.

## 할 수 있는 것

- **캡쳐 붙여넣기** — 페이지 어디서든 ⌘V. 드래그&드롭, 파일 선택도 됩니다.
  올리기 전에 브라우저에서 1600px / WebP로 줄여서 보내기 때문에 업로드가 빠릅니다.
- **여러 장 한꺼번에** — 일정표·맛집 리스트처럼 캡쳐가 여러 장인 경우 한 글에 최대 10장.
  피드에서는 장수에 맞춰 콜라주로 묶이고(4장이 넘으면 `+N`), 상세에서는 전체 폭으로 쌓아
  글씨가 빽빽한 캡쳐도 그대로 읽힙니다. 한 장씩 눌러 원본을 새 탭에서 확대할 수 있어요.
- **사진은 선택** — 링크만 저장해두거나 메모만 남기는 것도 됩니다. 사진 없는 글은 텍스트 카드로 보여요.
- **링크** — 인스타·블로그·지도 주소를 붙여넣으면 카드에 도메인 칩으로 붙습니다.
  `instagram.com/p/...`처럼 `https://` 없이 넣어도 알아서 붙여줘요.
- **카테고리 태그** — 디저트 / 카페 / 식당 / 명소 / 쇼핑 / 숙소 / 기타. 상단 칩으로 필터링.
- **가고 싶어요** — 누가 찜했는지 이름이 카드에 뜹니다. `내가 찜한 곳`으로 모아보기.
- **이모지 반응** — ❤️ 😍 🤤 👏 😂
- **다녀왔어요 체크** — `아직 안 간 곳` 필터로 남은 곳만 보기.
- **코멘트** — 글마다 대화. ⌘+Enter로 등록.

## 시작하기

이 프로젝트는 **Postgres(Neon) + Vercel Blob**을 씁니다. 로컬에서도 같은 DB를 바라봅니다.

```bash
npm install
vercel link          # 배포한 프로젝트와 연결 (처음 한 번)
vercel env pull .env # DATABASE_URL, BLOB_READ_WRITE_TOKEN 받아오기
npm run dev
```

`vercel env pull` 대신 `.env`에 직접 값을 채워도 됩니다. `.env.example`을 참고하세요.

스키마를 바꿨다면:

```bash
npm run db:migrate   # 마이그레이션 생성 + 로컬 적용
```

> `BLOB_READ_WRITE_TOKEN`을 비워두면 이미지는 `public/uploads/`에 저장됩니다.
> 로컬에서 토큰 없이 굴려보기 위한 길이고, **배포 환경에서는 동작하지 않습니다.**

## Vercel에 배포하기

### 1. 프로젝트 만들기

[vercel.com/new](https://vercel.com/new)에서 이 GitHub 저장소를 import 합니다.
첫 배포는 `DATABASE_URL`이 없어 **빌드가 실패하는 게 정상**입니다. 아래를 붙이고 다시 배포하세요.

### 2. Neon Postgres 붙이기

프로젝트 → **Storage** → **Create Database** → **Neon (Serverless Postgres)**.
만들면 `DATABASE_URL`을 포함한 환경변수가 프로젝트에 자동으로 주입됩니다.

### 3. Vercel Blob 붙이기

같은 **Storage** 탭 → **Create** → **Blob**.
`BLOB_READ_WRITE_TOKEN`이 자동으로 주입됩니다. 이미지는 여기에 올라갑니다.

### 4. 다시 배포

Deployments 탭에서 **Redeploy**. 빌드 스크립트가 `prisma migrate deploy`를 먼저 돌려
테이블을 만든 뒤 앱을 빌드합니다. 이후 스키마를 바꿔 push하면 배포할 때 자동으로 반영돼요.

### 왜 SQLite로는 안 되나

Vercel은 요청마다 컨테이너가 새로 뜨고 사라져서 **파일에 무언가를 남길 수 없습니다.**
DB 파일(SQLite)도, 업로드한 이미지(`public/uploads`)도 저장되지 않거나 즉시 사라집니다.
그래서 DB와 이미지를 모두 바깥 서비스로 뺐습니다.

## 친구를 초대하려면

배포한 주소를 그대로 보내주면 됩니다. 로그인이 없어서 이름만 정하면 바로 쓸 수 있어요.

로컬에서만 잠깐 같이 보려면 같은 와이파이에서 `npm run dev -- -H 0.0.0.0` 후
`http://<내-아이피>:3000` 을 공유하는 방법도 있습니다.

## 구조

```
app/
  actions.ts            서버 액션 — 글/코멘트/반응/찜 저장, 이미지 업로드
  page.tsx              보드(피드) — 필터 + 작성창 + 카드 목록
  posts/[id]/page.tsx   상세 — 큰 사진, 반응, 코멘트
components/
  Composer.tsx          작성창 — 여러 장 붙여넣기(⌘V) / 드래그 / 파일 선택, 링크 입력
  PostCard.tsx          피드 카드
  WishButton.tsx        가고 싶어요 (낙관적 업데이트)
  ReactionBar.tsx       이모지 반응
  VisitedToggle.tsx     다녀왔어요
  CommentForm.tsx       코멘트 입력
lib/
  storage.ts            이미지 저장 — Vercel Blob (로컬은 public/uploads)
  posts.ts              조회 쿼리 + 화면용 데이터 변환
  process-image.ts      브라우저에서 이미지 리사이즈/WebP 변환
  session.ts            쿠키 기반 이름
  categories.ts         카테고리 / 반응 정의
  ImageCollage.tsx      피드 카드 사진 배치 (1 / 2 / 3 / 4+장)
prisma/schema.prisma    Post · PostImage · Comment · Reaction · Wish
```

## 명령어

| | |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run typecheck` | 타입 체크 |
| `npm run lint` | 린트 |
| `npm run db:migrate` | 스키마 변경 후 마이그레이션 생성·적용 |
| `npm run db:deploy` | 기존 마이그레이션만 적용 (배포 때 자동 실행) |
| `npm run db:studio` | DB를 브라우저로 열어보기 |

## 알아두면 좋은 것

- **로그인이 없습니다.** 주소를 아는 사람은 누구나 이름을 정하고 글을 쓸 수 있어요.
  친구끼리 쓰는 보드라 일부러 단순하게 뒀습니다. 공개된 곳에 올린다면 인증을 먼저 붙이세요.
- 글과 코멘트는 **쓴 사람만** 지울 수 있습니다 (이름 기준).
- `다녀왔어요`는 개인이 아니라 **보드 전체 상태**입니다. 한 명이 체크하면 모두에게 표시돼요.
- 사진 **순서는 올린 순서**로 고정입니다. 아직 끌어서 바꾸는 기능은 없어요.
- 올린 뒤 **수정은 안 됩니다.** 고치려면 지우고 다시 올려야 해요.
