/**
 * 소스 간 견종 이름 불일치 보정 테이블.
 * key: registry.dog의 견종 이름 (원문 그대로)
 * value: 대상 소스에서의 이름 (원문 그대로)
 *
 * 2-merge.ts의 미매칭 리포트를 보고 항목을 추가한 뒤 재실행한다.
 *
 * ⚠️ 항목 추가 전 CLAUDE.md의 "추측 절대 금지 원칙" 필독.
 * 동일 품종 이름 차이 / AKC·FCI 공식 변형만 허용, 별개 품종 점수 차용 금지.
 */

/** registry 이름 → DogTime breed 이름 */
export const toDogtime: Record<string, string> = {
  "Miniature Poodle": "Poodle",
  "Standard Poodle": "Poodle",
  "Toy Poodle": "Poodle",
  // registry의 "King Charles Spaniel"은 id가 cavalier-king-charles-spaniel — 실제로는 카발리에
  "King Charles Spaniel": "Cavalier King Charles Spaniel",
  "Russell Terrier": "Jack Russell Terrier",
  Toller: "Nova Scotia Duck Tolling Retriever",
  "St. Bernard": "Saint Bernard",
  AmStaff: "American Staffordshire Terrier",
  "Mexican hairless dog": "Xoloitzcuintli",
  "Petit Basset Griffon": "Petit Basset Griffon Vendeen",
  "Plott Hound": "Plott",
  "Standard Manchester Terrier": "Manchester Terrier",
  "Toy Manchester Terrier": "Manchester Terrier",
};

/** registry 이름 → The Dog API name */
export const toDogapi: Record<string, string> = {};
