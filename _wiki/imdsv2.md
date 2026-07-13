---
title: "IMDSv2"
category: "cloud"
tags: [aws, metadata, security]
---

**Instance Metadata Service version 2** is AWS's token-authenticated replacement for IMDSv1. It requires a PUT-issued session token before any metadata request, closing the SSRF-to-credentials pipeline that IMDSv1 left wide open.

## Why it exists

Container escapes, misconfigured proxies, and application-level SSRF used to hand out `iam/security-credentials/` on GET. IMDSv2 breaks that by requiring:

- A `PUT /latest/api/token` with a `X-aws-ec2-metadata-token-ttl-seconds` header
- The returned token echoed as `X-aws-ec2-metadata-token` on every subsequent request

A misbehaving HTTP client that only does GET can no longer reach credentials at all.

## Hop limit

By default the token response has `HttpPutResponseHopLimit: 1`. Set it to `2` only if a legitimate service (like a sidecar) needs to relay. Anything higher is almost always a smell.

## Related

- [[imdsv1]]
- [[ssrf]]
- [[iam-condition-keys]]
