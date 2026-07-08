# 퀴즈 문항 초안 v1 (2026-07-08)

- 12문항, 문항당 선택지 4개. 점수 매핑은 다음 과제 — 여기서는 문장만 확정한다.
- 주제 구조는 IAMS Breed Selector(14문항)·AKC Breed Selector의 검증된 커버리지를 따르고, 문장 톤은 한국 바이럴 테스트처럼 일상 문장으로.
- 각 문항의 `참고`는 주제 출처, `feature`는 이 문항이 신호를 줄 것으로 의도한 특징(방향 설계는 다음 과제).
- CLAUDE.md 문항 구성 원칙 준수: 질문 간 비중복(12개 문항 = 12개의 서로 다른 생활 장면), 선택지 간 상반성.

---

## Q1. 지금 살고 있는 집은 어떤 곳인가요?

1. 마당까지 있는 단독주택이에요 — 뛰어놀 공간은 충분!
2. 방이 여러 개인 널찍한 아파트예요
3. 나 하나로도 꽉 차는 아늑한 원룸이에요
4. 벽이 얇아서 층간소음에 늘 신경 쓰며 살아요

> 참고: IAMS Q1·Q2(주거+야외공간) / feature: apartment_friendly, size, barking

## Q2. 평일 낮, 우리 집 풍경은?

1. 재택근무라 거의 항상 집에 있어요
2. 반나절 정도만 비우고 금방 돌아와요
3. 아침에 나가면 저녁에야 돌아와요
4. 야근에 약속에… 집은 잠만 자는 곳일 때도 많아요

> 참고: IAMS Q9(혼자 있는 시간) / feature: tolerates_alone

## Q3. 주말 아침, 눈 뜨자마자 하고 싶은 건?

1. 러닝화 신고 한강 10km — 몸이 근질근질해요
2. 동네 카페까지 슬렁슬렁 산책
3. 이불 속에서 밀린 드라마 정주행
4. 친구들이랑 브런치 약속 — 주말도 스케줄이 꽉꽉

> 참고: IAMS Q8(활동), AKC(에너지/함께할 시간) / feature: energy_level, tolerates_alone, stranger_friendly

## Q4. 어떤 성격의 강아지와 함께하고 싶나요?

1. 용맹하고 든든한 경찰견 or 보디가드 강아지
2. 모든 사람들의 사랑을 독차지 하고 싶어하는 사람 좋아 강아지
3. 겁이 많고 소심하지만 주인만 바라보는 주인만 봐 강아지
4. 하루 10km 달리기도 거뜬한 어질리티 천재 운동 천재 강아지

> 참고: 사용자 원안 그대로 (2026-07-08), IAMS Q6(성격 선호) / feature: protective, stranger_friendly, energy_level, trainability

## Q5. 강아지를 품에 안는 상상을 해보세요. 어떤 느낌이 좋아요?

1. 한 손에 쏙 들어오는 콩알만 한 아기
2. 무릎 위에 딱 맞는 사이즈
3. 안으면 팔이 꽉 차는 든든한 중형견
4. 오히려 걔가 날 안아줄 것 같은 대형견

> 참고: IAMS Q11(크기 선호) / feature: size

## Q6. 강아지 털에 대한 솔직한 마음은?

1. 복슬복슬 인형 같은 장모가 최고 — 빗질도 힐링이죠
2. 짧고 단정한 털이 깔끔해서 좋아요
3. 어떤 털이든 좋은데, 옷에 붙는 건 좀 곤란해요
4. 미용실 단골 될 각오 됐어요 — 스타일링 해주고 싶거든요

> 참고: IAMS Q12·Q13(그루밍+털빠짐), AKC(그루밍) / feature: coat_length, shedding, grooming_ease

## Q7. 강아지 교육, 어떻게 시킬 생각이에요?

1. '앉아'부터 하이파이브까지 — 같이 배우는 게 재밌을 것 같아요
2. 배변이랑 기본 예절만 되면 충분해요
3. 필요하면 훈련사님 도움도 받을 생각이에요
4. 순한 아이 만나서 자연스럽게 지내고 싶어요

> 참고: IAMS Q10(훈련 정도) / feature: trainability, novice_friendly

## Q8. 강아지와 살아본 적 있나요?

1. 어릴 때부터 쭉 — 강아지 없는 집을 상상 못 해요
2. 한 번 키워봐서 어느 정도는 알아요
3. 처음이지만 영상 보면서 공부 많이 했어요
4. 완전 처음이라 설렘 반 걱정 반이에요

> 참고: IAMS Q4(소유 경험) / feature: novice_friendly

## Q9. 지금 집에는 누구누구 살아요?

1. 나 혼자 — 강아지가 첫 식구가 될 거예요
2. 아이가 있어요 — 아이랑 뒹굴며 클 친구였으면
3. 고양이(또는 햄스터·새)가 먼저 자리 잡고 있어요
4. 이미 강아지가 한 마리 — 둘째 계획 중이에요

> 참고: IAMS Q3·Q5(아이+다른 반려동물) / feature: kid_friendly, prey_drive, dog_friendly, tolerates_alone

## Q10. 현관 벨이 울렸어요. 강아지가 어떻게 반응하면 좋겠어요?

1. 누가 왔는지 우렁차게 알려주는 믿음직한 알람이 됐으면
2. 꼬리 흔들며 손님을 제일 먼저 반기는 인싸견이었으면
3. 무심하게 내 옆에 딱 붙어 있기 — 세상 조용하게
4. 짖는 건 곤란해요, 우리 집은 방음이 약하거든요

> 참고: IAMS Q6·Q7(보호 성향+짖음), 노트펫(소음 문항) / feature: protective, stranger_friendly, barking

## Q11. 산책은 어떤 스타일이 될 것 같아요?

1. 한겨울 눈밭이든 비 오는 날이든 — 매일 나가요
2. 아침저녁으로 꼬박꼬박, 루틴대로
3. 날씨 좋은 날 골라서 기분 좋게
4. 산책보단 집 안 놀이로 에너지를 풀어주고 싶어요

> 참고: AKC(운동/날씨), IAMS Q8 / feature: cold_tolerance, energy_level

## Q12. 간식 달라고 눈망울 공격이 들어왔다!

1. 단호하게 정해진 양만 — 건강이 우선이니까요
2. 그 눈빛을 어떻게 이겨요… 하나만 더 주죠
3. 간식은 훈련 성공했을 때 보상으로만
4. 아예 수제 간식 만들어주는 정성파가 될래요

> 참고: 자체 문항 (weight_gain 커버용) / feature: weight_gain, trainability

---

## 커버리지 체크 (17 feature 전부 최소 1문항)

| feature | 문항 |
|---|---|
| apartment_friendly | Q1 |
| size | Q1, Q5 |
| energy_level | Q3, Q4, Q11 |
| tolerates_alone | Q2, Q3, Q9 |
| shedding | Q6 |
| grooming_ease | Q6 |
| trainability | Q4, Q7, Q12 |
| barking | Q1, Q10 |
| kid_friendly | Q9 |
| dog_friendly | Q9 |
| stranger_friendly | Q3, Q4, Q10 |
| prey_drive | Q9 |
| novice_friendly | Q7, Q8 |
| protective | Q4, Q10 |
| coat_length | Q6 |
| weight_gain | Q12 |
| cold_tolerance | Q11 |
