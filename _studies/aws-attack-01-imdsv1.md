---
title: "IMDSv1 risk revisited"
series: "AWS Attack Research"
part: 1
total: 3
date: 2026-06-24
hypothesis: "Legacy IMDSv1 endpoints remain reachable when `hop_limit` was never enforced."
finding: "Observed metadata access from an unprivileged Kubernetes pod."
reflection: "Defence-in-depth wins here — enforce IMDSv2, then also apply SCP + IAM condition keys as separate belts."
tags: [aws, imds, metadata, defence-in-depth]
---

A small internal cluster. Three EKS nodes. Everything looked reasonable — IMDSv2 was documented as the default, `aws:SecureTransport` was pinned, and the SRE team ran their onboarding checklist religiously.

But when I peeked at the launch template, `HttpTokens: optional` was still there. Legacy field, legacy default. Nobody noticed because *nothing broke*.

That's the recurring shape of this class of bug: **it doesn't fail loudly. It fails quietly, and only when someone thinks to check.**

## What I actually did

I dropped a small pod with `hostNetwork: false` and no unusual privileges, then reached out to the instance metadata service like it was 2018:

```bash
$ curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/
node-instance-role

$ curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/node-instance-role
{
  "AccessKeyId": "ASIA...",
  "SecretAccessKey": "...",
  "Token": "..."
}
```

Yes — those are node role credentials, from an unprivileged pod, with no exploit.

## Why the "default" wasn't the default

The AWS Console defaults changed. Terraform module defaults, however, did not. The team's launch template was authored in 2020 and carried forward through five refactors, each preserving the original values verbatim.

The lesson is not "always use IMDSv2." Everyone already agrees with that. The lesson is: **enforcement lives in the template, not in the culture around it.**

## Defence-in-depth

Applied three separate controls in production:

| Layer | Control |
|-------|---------|
| Node | `HttpTokens: required`, `HttpPutResponseHopLimit: 1` |
| Cluster | Network policy blocking `169.254.169.254` from pod CIDR |
| Account | SCP denying any principal without `aws:EC2InstanceMetadataTags` |

Each one is redundant. That's the point.

## Related

- Follow-up: [[aws-attack-02-scp-condition-keys]]
- Reference: [[imdsv2]]
