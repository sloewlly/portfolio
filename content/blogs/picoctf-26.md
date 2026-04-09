---
title: "picoCTF '26 - web exploitation write-ups!"
slug: picoctf-26
description: Detailed solutions and methodologies for the picoCTF 2026 web exploitation challenges.
longDescription: This article breaks down the vulnerabilities and step-by-step solutions for the picoCTF 2026 web challenges to help you better understand web application security.
cardImage: "https://sloewlly.github.io/portfolio/pixel-art.webp"
tags: ["capture the flag", "cybersecurity", "picoctf", "web-exploitation"]
readTime: 30
featured: true
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

## Medium: No FA

This challenge initially presents itself as a straightforward exercise, but it quickly evolves into a fantastic case study on the dangers of exposing sensitive data and misunderstanding session management. My main takeaway from this exercise is how alarmingly easy it can be to decode improperly handled session variables. 

The investigation kicked off when I was provided with a `user.db` file. Upon inspecting the database, it became immediately clear that the `admin` account was the only one with Two-Factor Authentication (2FA) enabled. Alongside this discovery, I was able to extract the administrator's password, which was stored as a cryptographic hash. 

How did I know the specific hashing algorithm? Fortunately, picoCTF provided the application's source code. A quick review of the authentication logic revealed the following snippet:

```python
if user and hashlib.sha256(password.encode()).hexdigest() == user['password']:
```

This confirmed the hash was generated using SHA-256. The hash in question was:

```text
c20fa16907343eef642d10f0bdb81bf629e6aaf6c906f26eabda079ca9e5ab67
```

Because hashing is a one-way mathematical function rather than two-way encryption, you cannot simply "decode" a hash back into plaintext. After a few unsuccessful attempts using online lookup tables, I pivoted to a more robust local approach: dictionary attacks. I fired up John the Ripper and ran it against the infamous `rockyou.txt` wordlist. The tool swiftly identified the collision, revealing the plaintext password:

```text
apple@123
```

With the SHA-256 hash cracked, the next logical move was logging in with the admin account. However, this is where the 2FA kicked in. To bypass this, I needed to understand how the OTP (One-Time Password) was being generated. Returning to the source code, I found this logic:

```python
# Generate OTP
otp = str(random.randint(1000, 9999))
session['otp_secret'] = otp
session['otp_timestamp'] = time.time()
session['username'] = username
session['logged'] = 'false'
# send OTP to mail ---
return redirect(url_for('two_fa'))
```

From a security standpoint, this is a highly flawed approach to OTP generation. Because the code relies on a simple 4-digit integer (`9*10**3`), there are only 9,000 possible combinations. Mathematically, it is entirely feasible to write a script to brute-force the OTP within the session window. While I recognized that a brute-force script would eventually yield the flag, it felt a bit like overkill for what seemed to be a logic-based challenge. I began questioning if there was a more elegant bypass.

That is when I noticed the session cookie:
```text
.eJwty0EKgCAQAMC_7FlCM7P8TEhuIrgqaqfo73noOjAPxOw9OjBw2dgQGORejoZnxT5QKy1_64GwdUsFjNBaLZvkQk18X6VUM4O7YU2WcCTrKCR4P0ZiHF4.adO4hw.WHsKdg1NinRX02UDmDbXDE5fum4
```

The structure of this cookie—three base64-encoded segments separated by periods—looked incredibly familiar. At first glance, it resembles a JSON Web Token (JWT). However, a bit of research confirmed it is actually a default Flask session cookie.

Here is where the critical vulnerability lies: by default, Flask session cookies are cryptographically signed to prevent tampering, but they are not encrypted. This means that while users cannot modify the cookie without invalidating the signature, anyone can decode the payload to read its contents.

A quick base64 decode of the payload segment revealed the following JSON structure:

```json
{
    "logged": "false",
    "otp_secret": "7573",
    "otp_timestamp": 1775483015.0963352,
    "username": "admin"
}
```
The solution was brilliantly simple. The application was storing the otp_secret directly inside the client-side session cookie. By simply reading the decoded cookie, I extracted the OTP (`7573`), inputted it into the 2FA prompt, and successfully captured the flag.

The initial thought upon seeing this might be to just "add another layer of encryption," but the true moral of the story requires a slight correction in perspective. The real lesson here is about state management: never store sensitive backend secrets (like OTPs) in client-side storage, encrypted or not. Sensitive state should be maintained server-side, with the client only holding an opaque session identifier.

<details>
  <summary><strong>Click to reveal flag</strong></summary>
  
  ```text
  picoCTF{n0_r4t3_n0_4uth_9617ed73}
  ```
</details>

## Medium: Hashgate

Let's be real for a second: `Hashgate` is not exactly the crown jewel of web challenges. In fact, it’s actually kind of annoying! Not because it requires some elite, genius hacking skills, but because you have to use your brain to brute-force a frustratingly simple, almost illogical guessing game. Honestly, without the hints, you'd just be shooting in the dark. Let me walk you through my chaotic thought process on this one.

Naturally, seeing a login prompt, my hacker brain immediately screamed, "SQL Injection!" I confidently typed in the classic `' or 1=1--` payload, expecting to bypass the authentication and hack the mainframe. Spoiler alert: absolutely nothing happened.

Feeling a bit defeated, I retreated to Web Exploitation 101: right-clicking the page and hitting "Inspect Element." Lo and behold, sitting right there in the open source code was a leftover, hardcoded developer comment:

```html
<!-- Email: guest@picoctf.org Password: guest -->
```

Well, there goes five minutes of my life I’ll never get back! Lol. I logged in using those dummy credentials, and the site redirected me to a very interesting URL:

```
http://crystal-peak.picoctf.net:xxxx/profile/user/e93028bdc1aacdfb3687181f2031765d
```

Wait a minute... a lightbulb just went off in my head. That massive string of gibberish (`e93028bdc1aacdfb3687181f2031765d`) looks suspiciously like an MD5 hash. For those who might not know, MD5 is a cryptographic algorithm that turns any input into a fixed 32-character string. Web developers sometimes use it to "hide" predictable data, but it's a terrible security practice because simple inputs can be easily reversed.

I tossed that hash into an online MD5 cracker (which basically looks up the hash in a giant, pre-computed dictionary called a "rainbow table") and boom: it reversed perfectly back to the number `3000`. This aligned exactly with what the web page was screaming at me:

```text
Access level: Guest (ID: 3000). Insufficient privileges to view classified data. Only top-tier users can access the flag.
```

Here is where the brain pain truly begins. Sure, I know how to encode an ID into MD5 now. But how on earth am I supposed to know what the Admin's ID is?! I started guessing blindly. Is it 1? Is it 1000? Nope and nope. Of course, none of those worked. I had to cave and look at the hint:

> There are about 20 employees in this organisation.

Okay, time to do some deductive reasoning. If the guest account is ID `3000`, the actual employees are probably numbered right around there. My two best theories were: either the employee pool is sequentially assigned right after the guest account (`3001` to `3020`), or it’s some massive range like `1000` to `20000`, and `3000` just happens to be a high-end guest ID.

I originally built a script to aggressively sniff the massive `1000` - `20000` range, but that gave me absolutely zilch. So, I pivoted to the simpler theory: `3001`-`3020`. Bingo! The magical admin ID turned out to be `3016`, and the site graciously handed over the flag.

Here is the Python script I threw together to automate the dirty work. It systematically generates the MD5 hash for each number, appends it to the URL, and asks the server if the page exists:

```python
import requests
import hashlib

# Configuration
base_url = "http://crystal-peak.picoctf.net:xxxx/profile/user/"
# Based on the "20 employees" hint, IDs 1-3000 covers all possibilities
start_id = 3001
end_id = 3020

print(f"Starting scan for IDs {start_id} to {end_id}...")

for i in range(start_id, end_id + 1):
    # 1. Create the MD5 hash of the current ID (as a string)
    id_string = str(i).encode('utf-8')
    md5_hash = hashlib.md5(id_string).hexdigest()
    
    # 2. Construct the full URL
    target_url = f"{base_url}{md5_hash}"
    
    try:
        # 3. Send the request
        response = requests.get(target_url)
        
        # 4. Check if the page exists (ignores 404s)
        if response.status_code == 200:
            print(f"\n[+] Match Found! ID: {i}")
            print(f"URL: {target_url}")
            print("-" * 40)
            print(response.text) # Prints the HTML content/flag
            print("-" * 40)
            
            # Optional: Stop after finding the first valid profile (the admin)
            # break 

    except requests.exceptions.RequestException as e:
        print(f"Error connecting at ID {i}: {e}")
        break

print("\nScan complete.")
```
The core flaw of this entire web app is a textbook vulnerability known as **IDOR** (Insecure Direct Object Reference). The developers mistakenly believed that wrapping a sequential ID in an MD5 hash made it "secure" and unguessable. But security through obscurity isn't real security. Because the server completely failed to verify if my specific logged-in session actually had the correct authorization to view user `3016`'s data, it just blindly handed the classified page over to anyone who knew the URL.

<details>
  <summary><strong>Click to reveal flag</strong></summary>
  
  ```text
  picoCTF{id0r_unl0ck_c642ae68}
  ```
</details>