---
title: "왜 IMDSv1이 위험한가 · hypothesis → experiment → result → reflection"
date: 2026-04-12
tags: [aws, imds, ssrf, metadata, cloud-security, research]
series: "AWS Attack Research"
part: 1
total: 3
hypothesis: "IMDSv1은 HTTP GET 요청만으로 IAM 자격 증명을 반환하기 때문에, SSRF 취약점이 있는 애플리케이션이 EC2에서 실행 중일 경우 외부 공격자가 인스턴스 역할의 임시 자격 증명을 탈취할 수 있다."
finding: "SSRF 벡터를 통해 169.254.169.254 메타데이터 엔드포인트에 도달하는 데 평균 2회의 HTTP 요청으로 충분했다. hop_limit=1 제한이 없는 환경에서 컨테이너 내부에서도 동일하게 동작했다."
reflection: "IMDSv2의 PUT 사전 요청(TTL 제한 포함) 강제 적용이 핵심 완화책이지만, hop_limit을 1로 설정하지 않으면 컨테이너 환경에서 우회 가능하다. EC2 런치 템플릿 수준에서 IMDSv2 전용 + hop_limit=1을 기본값으로 강제하는 것이 유일한 완전한 방어다."
description: "IMDSv1 SSRF 공격 경로 실험 — HTTP 요청 흐름부터 자격 증명 탈취 및 방어 완화책까지"
---

## Hypothesis

IMDSv1은 인스턴스 메타데이터 서비스의 첫 번째 버전으로, 인증 없이 HTTP GET 요청만으로 IAM 자격 증명을 반환한다. 이 설계는 SSRF(서버 사이드 요청 위조) 취약점과 결합될 때 외부 공격자가 인스턴스 역할의 권한 전체를 획득하는 경로가 된다는 것이 이 실험의 출발 가설이다.

## Experiment

테스트 환경: EC2 인스턴스(IMDSv1 활성화) + SSRF 취약한 웹 애플리케이션 (URL fetch 기능).

```
# Step 1 — 인스턴스 역할 이름 확인
GET http://169.254.169.254/latest/meta-data/iam/security-credentials/

# Step 2 — 역할 자격 증명 탈취
GET http://169.254.169.254/latest/meta-data/iam/security-credentials/<role-name>
```

반환 결과: `AccessKeyId`, `SecretAccessKey`, `Token`, `Expiration`. 총 2회의 HTTP 요청으로 완료된다.

컨테이너 환경(Docker, ECS) 테스트: 기본 TTL=128로 구성된 경우 hop_limit 제한 없이 컨테이너 내부에서도 동일하게 동작했다.

## Result

- IMDSv1 활성화 + SSRF 존재 환경: 2회 요청으로 역할 자격 증명 탈취 성공
- IMDSv2 전용 + hop_limit=1: SSRF 경로로 PUT pre-token 요청 불가 — 탈취 실패
- IMDSv2 전용 + hop_limit=2 이상: 컨테이너 경유 hop 우회 가능 — 탈취 성공

## Reflection

hop_limit 설정이 IMDSv2 방어의 실질적 핵심이다. EC2 런치 템플릿과 AMI 기본값에서 `--metadata-options HttpTokens=required,HttpPutResponseHopLimit=1`을 강제하지 않으면 컨테이너 환경에서 IMDSv2도 우회된다.
