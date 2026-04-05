---
title: "picoCTF '26 - web exploitation write-ups!"
slug: picoctf-26
description: Detailed solutions and methodologies for the picoCTF 2026 web exploitation challenges.
longDescription: This article breaks down the vulnerabilities and step-by-step solutions for the picoCTF 2026 web challenges to help you better understand web application security.
cardImage: "https://sloewlly.github.io/portfolio/pixel-art.webp"
tags: ["capture the flag", "cybersecurity", "picoctf", "web-exploitation"]
readTime: 30
featured: false
timestamp: 2026-04-01T01:00:00+00:00
---

picoCTF is a free, gamified cybersecurity education platform. Tailored for students, beginners, and professionals alike, it provides hands-on "Capture the Flag" (CTF) challenges across domains such as cryptography, forensics, and web exploitation in a secure, online environment. In addition to offering 24/7 practice through the picoGym, it hosts the world's largest hacking competition for high schoolers.

# What's up?
This year, picoCTF introduced ten new web exploitation challenges, structured across three difficulty tiers: one easy, seven medium, and two hard. During the competition, I successfully solved seven out of the ten challenges, completing the introductory problem and navigating through six of the medium-tier scenarios. 

This write-up documents my methodologies and the technical concepts required to bypass these vulnerabilities, serving as a guide for those looking to improve their web exploitation skills.

## Easy: Old Session

The "Old Session" challenge serves as a straightforward introduction to session management vulnerabilities and information disclosure. 

After spinning up the challenge instance, registering an account, and logging in, you are greeted by the primary application interface. Upon reviewing the site's content, a comment from a user named **mary_jones_8992** provides a critical hint:

> Hey I found a strange page at /sessions

Navigating to the `/sessions` endpoint exposes a list of active session cookies and their associated user roles:

```text
session:-TmSZhtVFaERd3brjPkPg0UBV1vuuwONmRKf10E6Zyg, {'_permanent': True, 'key': 'admin'}
session:otult6D1ELaEUwnvkvBVbOZQi0Z7UV6x1aLQU6IluvQ, {'_permanent': True, 'key': 'test'}
```

This constitutes a severe security flaw, as sensitive session tokens are being leaked in plain text. To exploit this, we can perform a session hijacking attack. By copying the administrator's session cookie and replacing our current session cookie in the browser's developer tools (under the Storage or Application tab), we can elevate our privileges to that of the admin.

Refreshing the main page with the newly assigned admin cookie grants full access to the dashboard and reveals the flag.

<details>
  <summary><strong>Click to reveal flag</strong></summary>
  
  ```text
  picoCTF{s3t_s3ss10n_3xp1rat10n5_53a328ed}
  ```
</details>

## Medium: North-South

The "North-South" challenge introduces network-level restrictions, specifically an Nginx geolocation routing configuration designed to only allow access from Icelandic IP addresses. 

Analyzing the provided Nginx configuration file reveals the core routing logic:

```nginx
server {
    listen 80;

    location / {
        if ($geoip2_data_country_code = IS) {
            proxy_pass http://south;
        }

        proxy_pass http://north;
    }
}
```

This configuration explicitly dictates that any connection not geolocated in Iceland (`IS`) will be forcefully routed to the `http://north` backend. 

My initial methodology involved standard HTTP header manipulation. I intercepted the request using [**Burp Suite**](https://portswigger.net/burp/communitydownload) and attempted to spoof my location by injecting a known Icelandic IP address:

```http
X-Forwarded-For: 217.151.160.0
```

However, the server still redirected me to `http://north`. This failure actually provided valuable insight into the server's architecture: it indicated that the Nginx GeoIP2 module was likely configured to read the actual TCP connection IP (`$remote_addr`) rather than trusting user-controllable HTTP headers like `X-Forwarded-For` or `X-Real-IP`.

Realizing that header spoofing was insufficient, I pivoted to a network-layer bypass. I utilized [**OnionFruit Connect**](https://dragonfruit.network/onionfruit) to route my traffic through the Tor network, specifically forcing an Icelandic exit node. 

By physically originating the TCP connection from an Icelandic IP, the Nginx server natively resolved the `$geoip2_data_country_code` to `IS`. This flawlessly bypassed the restriction, proxying my connection to the `http://south` backend where the flag was waiting. While it might feel like a brute-force approach compared to header injection, understanding when to shift from application-layer manipulation to infrastructure-layer routing is a critical takeaway from this challenge.

<details>
  <summary><strong>Click to reveal flag</strong></summary>
  
  ```text
  picoCTF{g30_b453d_r0u71n9_6030bc08}
  ```
</details>
