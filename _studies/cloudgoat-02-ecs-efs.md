---
title: "ecs_efs_attack · ECS 태스크에서 EFS 마운트 탈취"
date: 2026-05-17
tags: [cloudgoat, aws, ecs, efs, container-security, data-exfil]
series: "CloudGoat Walkthrough"
part: 2
total: 4
hypothesis: "ECS 태스크에 과도한 권한이 부여된 경우, 태스크 역할을 통해 동일 계정의 EFS 파일 시스템에 접근하고 민감한 데이터를 탈취할 수 있다."
finding: "태스크 역할이 elasticfilesystem:* 전체를 허용하고 EFS 마운트 타겟이 보안 그룹 규칙으로만 보호될 때, 역할 탈취 이후 파일 시스템 내용 전체를 읽어낼 수 있었다."
reflection: "EFS 접근 제어는 IAM 정책과 POSIX 권한의 조합이어야 한다. IAM만으로 방어하는 경우 역할 탈취 하나로 파일 시스템 전체가 노출된다."
description: "CloudGoat ecs_efs_attack 시나리오 — 과도한 ECS 태스크 역할을 통한 EFS 데이터 탈취 경로 분석"
---

`ecs_efs_attack` 시나리오는 컨테이너 워크로드에 대한 최소 권한 원칙 미적용이 어떻게 데이터 레이어까지 공격을 확장시키는지를 보여준다.

## 환경 구성

ECS Fargate 클러스터에 배포된 태스크와 동일 VPC에 마운트된 EFS 파일 시스템. 태스크 역할에는 `elasticfilesystem:*`이 허용되어 있고, EFS 마운트 정책은 별도로 구성되지 않았다.

## 공격 경로

1. ECS 태스크 내부에서 메타데이터 엔드포인트를 통해 태스크 IAM 자격 증명 획득
2. 획득한 자격 증명으로 계정 내 EFS 파일 시스템 목록 조회
3. EFS 마운트 타겟 IP를 확인하고 NFS 프로토콜로 직접 마운트
4. 파일 시스템 내 데이터베이스 백업 파일과 환경 설정 파일 탈취

## 방어 적용 포인트

EFS 리소스 정책에서 `aws:PrincipalArn`을 특정 태스크 역할로 제한하고, EFS 액세스 포인트를 사용해 POSIX UID/GID 강제 적용을 추가하면 역할 탈취 이후에도 파일 레벨 격리가 유지된다.
