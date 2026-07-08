# scripts/ — 데이터 파이프라인

`npm run data:all` 하나로 전체 재실행 가능. 개별 실행:

| 명령 | 스크립트 | 산출물 |
|---|---|---|
| `npm run data:fetch` | 1-fetch.mts | `data/raw/*.json` (캐시됨, `--force`로 갱신) |
| `npm run data:merge` | 2-merge.mts | `data/merged.json` + 미매칭 리포트 |
| `npm run data:analyze` | 3-analyze.mts | `data/analysis.md` (변별력 리포트) |
| `npm run data:build` | 4-build.mts | **`public/data/breeds.json`** (최종본, 커밋 대상) |

- 소스: DogTime 평점(매칭 핵심) + open-dog-registry(이미지·메타) + The Dog API(설명 보강, `DOG_API_KEY` 필요)
- 견종 풀: registry ∩ DogTime = 199종. 이름 불일치는 `aliases.mts`에서 보정 (merge의 미매칭 리포트 보고 추가)
- 특징 세트(12개)는 `4-build.mts`의 `FEATURES`에 정의. 변경 시 반드시 `data/analysis.md`의 변별력 근거를 확인할 것 (CLAUDE.md 변별력 원칙)
- 한글 견종명: `name-ko.mts`
