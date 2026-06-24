---
title: "vpc_peering_overexposed · 1차 분석 + 2차 분석"
date: 2026-05-10
tags: [cloudgoat, aws, vpc, network-security, lateral-movement]
series: "CloudGoat Walkthrough"
part: 1
total: 4
hypothesis: "VPC peering 구성에서 과도하게 개방된 라우팅 테이블과 보안 그룹은 공격자가 피어링된 계정 경계를 횡이동하는 진입점이 된다."
finding: "라우팅 테이블이 0.0.0.0/0을 허용하고 보안 그룹이 피어링 CIDR 전체를 허용할 경우, 피어링은 격리 경계가 아닌 확장된 공격 표면으로 작동했다."
reflection: "위협 모델이 VPC 경계를 신뢰 경계로 가정하면 피어링을 통한 횡이동은 탐지 사각지대가 된다. 피어링 트래픽에 대한 별도 로깅 정책이 필요하다."
description: "CloudGoat vpc_peering_overexposed 시나리오 — 과도하게 개방된 VPC 피어링 구성의 공격 경로 분석"
---

CloudGoat의 `vpc_peering_overexposed` 시나리오는 VPC 피어링 자체의 취약점이 아니라, 피어링 이후 라우팅 정책과 보안 그룹 구성의 방임이 어떻게 계정 간 횡이동 경로를 여는지를 보여준다.

## 환경 구성

시나리오는 두 개의 VPC (공격자 접근 가능 VPC A, 타겟 VPC B)와 양방향 피어링으로 구성된다. VPC A에는 공개 접근 가능한 EC2 인스턴스가 존재하며, VPC B에는 내부 서비스와 IAM 역할이 부착된 인스턴스가 있다.

## 1차 분석 — 라우팅 테이블 검토

VPC A의 라우팅 테이블을 확인했을 때 피어링 대상(VPC B CIDR)으로의 명시적 라우트와 함께 보안 그룹 인바운드 규칙이 피어링 CIDR 전체(`10.0.0.0/16`)를 허용하고 있었다. 최소 권한 원칙이 네트워크 레이어에 적용되지 않은 상태다.

## 2차 분석 — 횡이동 실행

VPC A의 공개 인스턴스에서 VPC B 내부 서비스 포트로의 직접 접근이 성공했다. 피어링 트래픽은 VPC Flow Logs에 기록되지만, 경보 규칙이 피어링 소스 IP를 내부 신뢰 트래픽으로 간주하도록 구성된 경우 탐지가 우회된다.

## 결과

피어링은 네트워크 격리를 제공하지 않는다. 피어링이 존재하는 순간 두 VPC는 동일한 보안 영역으로 취급되어야 하며, 각 방향의 트래픽에 독립적인 보안 그룹 규칙과 로깅 정책이 필요하다.
