---
title: "STS AssumeRole 체인 · 신뢰 관계를 통한 계정 간 권한 이동"
date: 2026-05-05
tags: [aws, sts, assume-role, cross-account, privilege-escalation, research]
series: "AWS Attack Research"
part: 2
total: 3
hypothesis: "STS AssumeRole 신뢰 정책이 과도하게 구성된 경우(Principal: *, 또는 외부 계정 전체 허용), 공격자가 초기 자격 증명 하나로 신뢰 체인을 따라 여러 계정의 역할을 연속적으로 가정하여 목표 권한에 도달할 수 있다."
finding: "신뢰 정책에 MFA 또는 ExternalId 조건이 없는 교차 계정 역할은 초기 계정의 자격 증명만으로 즉시 AssumeRole이 가능했다. 3단계 체인(계정 A → B → C)을 통해 최종 관리자 권한 역할 가정에 성공했다."
reflection: "AssumeRole 체인의 탐지는 CloudTrail의 userIdentity.sessionContext를 추적해야 하는데, 다중 계정 환경에서 체인 이전 계정의 로그를 중앙화하지 않으면 탐지가 불가능하다. ExternalId는 제3자 액세스 통제에 필수다."
description: "STS AssumeRole 체인 실험 — 교차 계정 신뢰 관계를 통한 권한 이동 경로와 탐지 한계"
---

## Hypothesis

AWS STS의 `AssumeRole`은 교차 계정 접근을 위한 표준 메커니즘이지만, 신뢰 정책의 Principal 범위와 Condition 조건이 느슨하게 구성된 경우 공격자가 체인 형태로 여러 계정을 횡단하는 경로가 된다.

## Experiment

3개 AWS 계정 환경 구성:
- 계정 A: 초기 침해된 IAM 사용자 (제한된 권한)
- 계정 B: 계정 A를 Principal로 허용하는 역할 (ExternalId 없음)
- 계정 C: 계정 B 역할을 Principal로 허용하는 관리자 역할

```bash
# Step 1 — 계정 A에서 계정 B 역할 가정
aws sts assume-role \
  --role-arn arn:aws:iam::ACCOUNT_B:role/CrossAccountRole \
  --role-session-name recon

# Step 2 — 계정 B 자격 증명으로 계정 C 역할 가정
AWS_ACCESS_KEY_ID=... aws sts assume-role \
  --role-arn arn:aws:iam::ACCOUNT_C:role/AdminRole \
  --role-session-name pivot
```

## Result

- ExternalId 없는 교차 계정 역할: 체인 가정 성공 (계정 A → B → C)
- ExternalId 조건 적용 역할: 값 없이는 AssumeRole 거부
- 조건 `aws:MultiFactorAuthPresent: true`: IAM 사용자 자격 증명에서는 MFA 세션 토큰 없이 거부

## Reflection

중앙화된 CloudTrail (AWS Organizations의 Organization Trail)이 없으면 체인의 각 단계가 서로 다른 계정 로그에 분산되어 상관 분석이 불가능하다. ExternalId는 혼동 대리인(Confused Deputy) 공격의 핵심 완화책이다.
