---
title: "Cloud Red Team H1 2026 retrospective"
date: 2026-02-28
tags: [retrospective, cloud-security, red-team, reflection]
description: "2026년 상반기 클라우드 레드팀 활동 회고 — 주요 발견, 반복 패턴, 다음 방향"
---

H1 2026을 돌아보면 공격 경로보다 방어 가정의 붕괴가 더 자주 나타났다. "이건 당연히 막혀 있겠지"라는 전제가 위협 모델에서 빠졌을 때 생기는 공백이 반복적으로 관찰됐다.

## 반복된 패턴

**과도한 IAM 권한**: 대부분의 환경에서 최소 권한 원칙이 배포 편의를 위해 희생되어 있었다. `iam:PassRole`과 `lambda:*`의 조합, `sts:AssumeRole`의 무조건적 허용이 가장 자주 발견된 구성이었다.

**메타데이터 서비스**: IMDSv2 전환이 완료되었다고 선언된 환경에서도 hop_limit 미설정으로 컨테이너 경유 우회가 가능한 경우가 있었다. 전환의 완료 기준이 `HttpTokens=required`만으로 설정되어 있어 발생한 갭이다.

**로깅과 탐지의 불일치**: CloudTrail이 활성화되어 있어도 Organization Trail이 없는 다중 계정 환경에서는 교차 계정 AssumeRole 체인을 상관 분석할 수 없었다. 가시성이 있다는 것과 탐지할 수 있다는 것은 다른 문제다.

## 다음 방향

H2에는 탐지 회피보다 탐지 자체를 연구 대상으로 전환할 계획이다. 공격 경로를 알면 탐지 규칙의 사각지대도 보인다. CloudTrail + GuardDuty의 탐지 한계를 공격자 관점에서 매핑하는 것이 다음 시리즈의 출발점이 될 것이다.
