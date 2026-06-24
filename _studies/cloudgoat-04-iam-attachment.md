---
title: "iam_privesc_by_attachment · 정책 직접 부착을 통한 권한 상승"
date: 2026-05-31
tags: [cloudgoat, aws, iam, privilege-escalation, policy-attachment]
series: "CloudGoat Walkthrough"
part: 4
total: 4
hypothesis: "iam:AttachUserPolicy 또는 iam:AttachRolePolicy 권한이 Resource 제한 없이 부여된 경우, 공격자가 자신의 계정 또는 임의 역할에 고권한 정책을 직접 부착하는 방식으로 권한을 상승시킬 수 있다."
finding: "iam:AttachUserPolicy 권한이 Resource '*'로 부여된 사용자는 자신에게 AdministratorAccess 정책을 직접 부착하여 즉각적인 계정 전체 접근을 획득할 수 있었다."
reflection: "정책 부착 권한은 사실상 관리자 권한과 동등하다. Condition 키로 부착 가능한 정책 ARN을 화이트리스트로 제한하지 않으면 이 권한 하나가 계정 전체 탈취로 이어진다."
description: "CloudGoat iam_privesc_by_attachment 시나리오 — 정책 직접 부착을 통한 권한 상승 경로 분석"
---

CloudGoat 시리즈의 마지막 시나리오는 IAM 정책 부착 권한의 과도한 범위가 어떻게 즉각적인 계정 탈취 벡터가 되는지를 보여준다.

## 환경 구성

제한된 IAM 사용자에게 `iam:AttachUserPolicy`가 Resource `*`로 부여되어 있다. 계정에는 `AdministratorAccess` 정책이 존재한다.

## 공격 실행

```
aws iam attach-user-policy \
  --user-name current-user \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

한 줄의 명령으로 권한 상승이 완료된다. 추가적인 서비스 호출이나 코드 배포가 필요 없다.

## 권한 상승 경로 목록 (IAM 전체)

Rhino Security Labs의 연구에 따르면 AWS IAM에는 21개 이상의 권한 상승 경로가 존재한다. 정책 부착은 그 중 가장 직접적인 경로다. CloudGoat 시리즈를 통해 4개 경로를 직접 실습했으며, PassRole+Lambda, ECS 역할 탈취, 네트워크 피어링 횡이동이 실제 환경에서 자주 관찰되는 패턴이다.

## 완화

`iam:AttachUserPolicy` Condition에 `iam:PolicyARN` 조건 키를 추가하여 허용 정책 ARN을 화이트리스트로 제한한다.
