---
title: "ECS 태스크 역할 탈취 · 컨테이너 내부에서 계정 레벨로"
date: 2026-06-07
tags: [aws, ecs, task-role, container-security, lateral-movement, research]
series: "AWS Attack Research"
part: 3
total: 3
hypothesis: "ECS 태스크 내부에서 컨테이너 자격 증명 엔드포인트(169.254.170.2)에 접근하면 태스크 IAM 역할의 임시 자격 증명을 획득할 수 있으며, 이후 해당 역할의 권한 범위만큼 계정 리소스에 접근 가능하다."
finding: "ECS_CONTAINER_METADATA_URI 환경 변수와 AWS_CONTAINER_CREDENTIALS_RELATIVE_URI를 통해 태스크 역할 자격 증명을 획득하는 데 두 번의 HTTP 요청으로 충분했다. 역할에 iam:ListRoles가 포함된 경우 이후 권한 상승 경로 열거까지 자동화 가능했다."
reflection: "태스크 역할의 권한 범위가 컨테이너 탈취의 폭발 반경을 결정한다. 최소 권한 태스크 역할 + 컨테이너 런타임 수준의 네트워크 격리가 함께 적용되어야 피해 반경을 제한할 수 있다."
description: "ECS 태스크 역할 자격 증명 탈취 실험 — 컨테이너 내부 접근에서 계정 레벨 권한까지의 경로"
---

## Hypothesis

ECS Fargate와 EC2 런치 타입 모두 태스크 역할 자격 증명을 컨테이너 내부의 링크-로컬 엔드포인트를 통해 제공한다. 컨테이너 런타임 취약점이나 애플리케이션 RCE가 발생한 경우, 공격자는 이 엔드포인트를 통해 태스크 역할의 권한 전체를 획득한다.

## Experiment

환경: ECS Fargate 태스크, 애플리케이션 레벨 명령 실행 가능 상태 (RCE 시뮬레이션).

```bash
# Step 1 — 자격 증명 상대 경로 확인
echo $AWS_CONTAINER_CREDENTIALS_RELATIVE_URI

# Step 2 — 태스크 역할 자격 증명 획득
curl http://169.254.170.2$AWS_CONTAINER_CREDENTIALS_RELATIVE_URI
```

반환: `AccessKeyId`, `SecretAccessKey`, `Token`. 이후 IAM 역할에 `iam:ListRoles`가 있을 경우 권한 상승 경로 열거가 즉시 가능하다.

## Result

태스크 역할 자격 증명 탈취: 2회 HTTP 요청으로 성공. IMDSv1과 달리 ECS 컨테이너 자격 증명 엔드포인트는 별도의 인증 메커니즘 없이 동작하므로, 컨테이너 내부 코드 실행 가능 상태에서는 항상 탈취 가능하다.

## Reflection

방어의 핵심은 역할 권한 최소화다. 태스크가 필요로 하는 특정 리소스 ARN과 작업만 허용하고, 범위 없는 와일드카드 정책(`*`)을 제거하는 것이 폭발 반경을 제한하는 유일한 방법이다. 컨테이너 이탈이 불가능하더라도 역할 권한이 넓으면 계정 레벨 피해가 발생한다.
