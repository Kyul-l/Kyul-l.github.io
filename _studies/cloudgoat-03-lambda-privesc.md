---
title: "lambda_privesc · Lambda 실행 역할을 통한 권한 상승"
date: 2026-05-24
tags: [cloudgoat, aws, lambda, iam, privilege-escalation]
series: "CloudGoat Walkthrough"
part: 3
total: 4
hypothesis: "iam:PassRole 권한과 Lambda 배포 권한의 조합은 공격자가 임의 IAM 역할을 Lambda 함수에 부착하여 해당 역할의 권한을 실행할 수 있는 권한 상승 경로가 된다."
finding: "제한된 IAM 사용자가 iam:PassRole 대상 범위 없이 lambda:CreateFunction과 lambda:InvokeFunction을 보유할 때, 고권한 역할(AdministratorAccess)을 새 함수에 부착하고 실행하는 방식으로 권한 상승에 성공했다."
reflection: "iam:PassRole은 단독으로 위험하지 않지만 Lambda 배포 권한과 결합되는 순간 실질적인 관리자 권한 상승 벡터가 된다. PassRole의 Resource 범위를 최소화하는 것이 핵심 완화책이다."
description: "CloudGoat lambda_privesc 시나리오 — iam:PassRole + Lambda 조합을 통한 권한 상승 경로 분석"
---

`lambda_privesc` 시나리오는 AWS IAM 권한 상승 경로 중 가장 자주 관찰되는 패턴 중 하나를 다룬다. 개별 권한은 무해해 보이지만 조합이 관리자 접근을 허용한다.

## 환경 구성

제한된 권한을 가진 IAM 사용자에게 `lambda:CreateFunction`, `lambda:InvokeFunction`, `iam:PassRole`이 부여되어 있다. PassRole에는 Resource 제한이 없다.

## 권한 상승 단계

1. 현재 사용자의 권한 목록 확인 — IAM 정책 열거
2. 계정 내 역할 목록 조회 — 고권한 역할 식별 (AdministratorAccess 부착)
3. 새 Lambda 함수 생성 시 식별한 고권한 역할을 실행 역할로 지정 (iam:PassRole 사용)
4. 함수 코드에 자격 증명 외부 유출 또는 백도어 IAM 사용자 생성 로직 삽입
5. 함수 실행 — 관리자 권한으로 작동

## 완화

`iam:PassRole` 권한의 Resource를 특정 역할 ARN 패턴으로 제한하고, 최소 권한 경계(Permission Boundary)를 역할에 적용하면 이 경로가 차단된다.
