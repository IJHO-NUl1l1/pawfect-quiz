# scripts/

데이터 파이프라인 스크립트 디렉토리 (로드맵 1단계).

여기의 스크립트는 **재실행 가능**해야 한다:

1. 소스 fetch (The Dog API, dogbreeds, open-dog-registry, akcdata 등)
2. name/breed_id 기준 병합
3. 변별력 분석 (특징별 분포/분산 확인)
4. 특징 세트 확정 → 정제된 `public/data/breeds.json` 생성

아직 구현 전. 사용자 지시에 따라 단계별로 추가한다.
