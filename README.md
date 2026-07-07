# Pawfect Quiz 🐶

나에게 맞는 강아지 찾기 — 퀴즈로 라이프스타일에 맞는 견종 Top 3를 추천하고, 예쁜 결과 카드를 공유하는 앱.

프로젝트 상세 기획과 작업 원칙은 [CLAUDE.md](./CLAUDE.md) 참고.

## 기술 스택

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Framer Motion
- Supabase
- Vercel 배포

## 시작하기

```bash
npm install
cp .env.example .env.local   # 실제 키 값 입력
npm run dev
```

http://localhost:3000 에서 확인.

## 디렉토리 구조

```
scripts/        데이터 파이프라인 (fetch → 병합 → 변별력 분석 → breeds.json 생성)
public/data/    정제된 breeds.json 산출물
src/app/        Next.js App Router 페이지
src/components/ UI 컴포넌트 (shadcn/ui 포함)
src/lib/        매칭 로직, 유틸
```
