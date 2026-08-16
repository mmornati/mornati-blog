---
title: From Data Leak to Phishing Campaign
tags:
- security
- phishing
- leak
- simplelogin
- proton
- email-alias-management
date: '2026-07-26T21:12:10.371000+00:00'
slug: from-data-leak-to-phishing-campaign
description: How Cultura & FFT data breaches fed targeted phishing via SendGrid —
  and why one alias per website is your best defense.
---



## Introduction

In recent months/years, two French organizations suffered significant data breaches: Cultura (September 2024) and the Fédération Française de Tennis (January 2026). Months later, the leaked data is actively being used in targeted phishing campaigns.

This post traces the full chain — from the initial breach to the phishing email landing in an inbox — using real email headers as evidence. But more importantly, it's a **training exercise**: it shows how a simple practice — one email address per website — transforms you from a passive victim into someone who can instantly identify the source of a leak, contain the damage in one click, and move on.

Let's see how.

* * *

## The Two Breaches

### Cultura (September 2024)

| Detail | Info |
| --- | --- |
| **Date** | September 2024 |
| **Attack vector** | Compromised external IT service provider (Octave) |
| **Records exposed** | ~1.5M unique email addresses |
| **Data types** | Names, email addresses, phone numbers, physical addresses, order history |
| **HIBP added** | September 25, 2025 |
| **Source** | [Have I Been Pwned](https://haveibeenpwned.com/Breach/Cultura), [The Record](https://therecord.media/france-retailers-hacked-confirm-cyberattack) |

Cultura is a major French retailer of cultural products (books, music, games, instruments). The breach was attributed to an attack on Octave, their IT service provider. The data was later posted on BreachForums by a user named `TanaDeMerde`, exposing over 2.1 million lines of customer data.

### FFT — French Tennis Federation (January 2026)

| Detail | Info |
| --- | --- |
| **Date** | January 12, 2026 |
| **Attack vector** | Cyberattack on a platform used by affiliated clubs |
| **Records exposed** | ~1.2M licensees |
| **Data types** | Names, email addresses, phone numbers, postal addresses, license numbers |
| **Official statement** | [FFT communiqué](https://www.fft.fr/actualites/communique-cyber-malveillance-fft-2026) |
| **Coverage** | [Le Figaro](https://www.lefigaro.fr/sports/tennis/tennis-la-fft-touchee-par-un-acte-de-cybermalveillance-20260112), [01net](https://www.01net.com/actualites/la-federation-francaise-de-tennis-fft-victime-dun-cyberattaque-les-donnees-de-milliers-de-licencies-sont-dans-la-nature.html), [Sud-Ouest](https://www.sudouest.fr/economie/cybersecurite/la-federation-francaise-de-tennis-victime-d-une-cyberattaque-certaines-donnees-des-licencies-ont-fuite-27392032.php) |

The FFT is France's second-largest sports federation. The attackers gained access to a club management platform, exfiltrating personal data of over a million licensees.

* * *

## The Attack Chain

```plaintext
Data breaches (Cultura / FFT)
       ↓
Email lists sold or published on dark web
       ↓
Phishing operator acquires the data, including aliases
       ↓
Operator uses compromised SendGrid accounts to send emails via API
       ↓
SendGrid processes the emails through geopod-ismtpd infrastructure
       ↓
SimpleLogin receives the email and forwards it to the real mailbox
       ↓
Phishing email lands in the user's inbox (or spam)
```

Both phishing campaigns observed follow the same pattern:

*   **Spoofed sender identity:** Fake health insurance / payment reminder services
    
*   **Subject lines in French:** Targeting French users specifically
    
*   **SendGrid infrastructure:** Emails pass SPF, DKIM, and DMARC because they originate from legitimate SendGrid servers
    
*   **SendGrid API sent:** The `X-SG-*` headers and `geopod-ismtpd` hostname confirm API submission, not SMTP
    

* * *

## The Alias as a Sensor: One Address Per Website Changes Everything

Before diving into the headers, let's establish the core concept that made this analysis possible.

### The Principle

Instead of giving every website your real email address, you give each one a **unique alias**:

```plaintext
cultura@yourdomain.simplelogin.com    →  for Cultura
fft@yourdomain.simplelogin.com        →  for FFT
newsletter@yourdomain.simplelogin.com →  for newsletters
bank@yourdomain.simplelogin.com       →  for your bank
```

Every alias forwards to the same real mailbox. To the outside world, each alias looks like a different email address. To you, they all arrive in one inbox.

### Why This is a Superpower

The moment spam or a phishing email arrives on one of these aliases, you know **exactly** what happened:

| You receive spam on → | You immediately know → |
| --- | --- |
| `cultura@yourdomain.simplelogin.com` | Cultura's data was leaked or sold |
| `fft@yourdomain.simplelogin.com` | FFT's data was leaked or sold |
| `bank@yourdomain.simplelogin.com` | Your bank has a problem (or their partner sold data) |

**No guesswork. No "did I use my Gmail or Outlook here?" No hunting through password managers to check which email you used on which site.**

### The Disposal Lifecycle

When an alias is compromised, the fix is trivial:

```plaintext
1. DELETE the compromised alias in SimpleLogin (or disable it)
2. CREATE a new alias for that service (e.g. cultura2@...)
3. UPDATE the account with the new alias
4. DONE — any future email to the old alias is silently dropped
```

That's it. You don't change your real email address. You don't update 50 other accounts. You don't worry about the old alias being used for password resets or impersonation.

Once deleted, SimpleLogin **does not forward** any emails sent to that alias. They are discarded at the server level. The phisher can keep sending — the emails vanish into a black hole.

### Without Aliases

If you used your real email everywhere and one service leaks it:

```plaintext
1. Your email is now in the hands of spammers, phishers, and data brokers
2. You cannot "un-leak" it
3. Every phishing email that arrives looks legitimate (it's your real address)
4. You cannot tell which service leaked it
5. Your only option is to abandon the address and notify everyone you know
```

This is the old world. Aliases are the new world.

Now let's see how all of this played out in practice with the Cultura and FFT leaks.

* * *

## Email Header Analysis

Below is a real email header captured from one of these phishing emails. Personal details have been replaced with sample data.

### Raw Headers (Anonymized)

```plaintext
Return-Path: <sl.lmycyibrgq2tqmrwgyztonrmeazdgnrxgy2tsxi.XXXX@simplelogin.co>
X-Original-To: user@protonmail.com
Delivered-To: user@protonmail.com
Received: from mail-200161.simplelogin.co (mail-200161.simplelogin.co [176.119.200.161])
 (using TLSv1.3 with cipher TLS_AES_256_GCM_SHA384 (256/256 bits)
  key-exchange X25519 server-signature RSA-PSS (4096 bits) server-digest SHA512)
 by mailin.protonmail.ch (Postfix) with ESMTPS id XXXXX
 for <user@protonmail.com>; Fri, 03 Jul 2026 04:59:35 +0000 (UTC)
Authentication-Results: mail.protonmail.ch; dmarc=pass (p=quarantine dis=none)
 header.from=simplelogin.co
Authentication-Results: mail.protonmail.ch; spf=pass smtp.mailfrom=simplelogin.co
Authentication-Results: mail.protonmail.ch; dkim=pass (1024-bit key)
 header.d=simplelogin.co header.i=@simplelogin.co
Arc-Seal: i=1; a=rsa-sha256; d=simplelogin.co; s=arc-20230626; ...
Arc-Message-Signature: i=1; a=rsa-sha256; d=simplelogin.co; s=arc-20230626; ...
Dkim-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=simplelogin.co; s=dkim; ...
Date: Fri, 03 Jul 2026 04:59:32 +0000
Message-Id: <XXXXXXXXXX@geopod-ismtpd-15>
Subject: Rappel de votre versement
X-Simplelogin-Type: Forward
X-Simplelogin-Emaillog-Id: XXXXXXXXXX
X-Simplelogin-Envelope-To: shopping@user.simplelogin.com
From: "Spoofed Company - noreply at fake-domain.com"
 <noreply_at_fake-domain_com_random@simplelogin.co>
To: shopping@user.simplelogin.com
List-Unsubscribe: <mailto:unsubscribe@simplelogin.co?subject=un.XXX>
```

### Key Findings from the Headers

#### 1\. SimpleLogin's Alias Protection

The email was sent to `shopping@user.simplelogin.com` — an alias created for Cultura. SimpleLogin forwarded it to the real mailbox `user@protonmail.com`. The original sender never sees the real address.

**However**, because the alias was used on Cultura's website and Cultura was breached, the alias itself ended up in the leaked dataset. The phisher now knows exactly which alias to target.

#### 2\. The Original Sender is Encoded, Not Hidden

SimpleLogin rewrites the `From:` header, but the original claimed sender leaks through:

```plaintext
From: "Spoofed Company - noreply at fake-domain.com"
     <noreply_at_fake-domain_com_random@simplelogin.co>
```

The display name preserves the original claimed identity. The email local part uses the convention: `originaluser_at_originaldomain_random@simplelogin.co`. By reversing the `_at_` substitution, you can extract the claimed sender: `noreply@fake-domain.com`.

**This is a phishing indicator**, not a real trace — the domain is spoofed.

#### 3\. The Sending Infrastructure: SendGrid's geopod-ismtpd

The `Message-Id` domain is `geopod-ismtpd-15`. This is a well-documented SendGrid internal hostname.

Fortra (October 2024) documented this exact indicator:

> "The received field also commonly contains 'geopod-ismtpd,' which has been classified by SendGrid abuse reports as being associated with phishing, spam, and spoofing."

The raw Received header from SendGrid would show `by geopod-ismtpd-15 (SG) with ESMTP id`, but SimpleLogin strips the intermediate SendGrid Received headers during forwarding. Only the `Message-Id` suffix remains as evidence.

Kaseya/INKY (January 2026) confirmed in their analysis of a separate SendGrid phishing campaign:

> "One hop reads: 'Received from ... by geopod-ismtpd-15 (SG) with HTTP id ...', indicating that SendGrid's geopod-ismtpd servers generated the message. The presence of 'geopod-ismtpd' and '(unknown)' in Received headers is a common indicator that the email originated from SendGrid."

#### 4\. SPF/DKIM/DMARC All Pass — Because It's Legitimate Infrastructure

The email passes all three authentication checks because it was sent through SendGrid's authorized servers. A receiving mail server sees:

*   `spf=pass` — SendGrid's IPs are authorized by simplelogin.co's SPF record
    
*   `dkim=pass` — SimpleLogin's DKIM signature is valid
    
*   `dmarc=pass` — Alignment is maintained
    

To the receiving server, this looks like a legitimate email from SimpleLogin, not a phishing attempt. The authentication layer cannot distinguish between a legitimate forwarded email and a phishing email sent through a compromised sender's account upstream.

* * *

## The Two Phishing Emails Received

### Email 1: Cultura Alias Targeted

| Field | Value |
| --- | --- |
| **Alias used** | `shopping@user.simplelogin.com` |
| **Claimed sender** | `noreply@idx.inc` |
| **Subject** | Rappel de votre versement |
| **Theme** | Fake payment reminder / health insurance refund |
| **Message-ID** | `geopod-ismtpd-15` |
| **Date** | July 3, 2026 |

![](/images/from-data-leak-to-phishing-campaign/00-d9b912ac-1b65-4b92-b22c-8b247fe267d1.png)

### Email 2: FFT Alias Targeted

| Field | Value |
| --- | --- |
| **Alias used** | `sports@user.simplelogin.com` |
| **Claimed sender** | `noreply@appsys.co.uk` |
| **Subject** | Rappel: Mettez à jour votre dossier assurance |
| **Theme** | Fake health insurance document update |
| **Message-ID** | `geopod-ismtpd-1` |
| **Date** | July 1, 2026 |

![](/images/from-data-leak-to-phishing-campaign/01-6e55c4c0-a8ad-4abd-ab0b-ba725ff9de03.png)

Both emails share identical patterns:

*   Claim to be from a French health insurance / payment service
    
*   Urge the recipient to take action (update dossier, confirm payment)
    
*   Use French language exclusively
    
*   Sent via SendGrid infrastructure
    
*   Arrived within days of each other, suggesting the same operator running both lists
    

* * *

## The Disposal Lifecycle in Practice

Let's walk through exactly what happens when you delete a compromised alias.

### Before Deletion

The alias exists in SimpleLogin's system. Any email sent to it is forwarded to your real mailbox:

```plaintext
phishing@fake.com → shopping@user.simplelogin.com → user@protonmail.com ✓
```

### After Deletion

The alias no longer exists. SimpleLogin receives the email and **drops it immediately**. No bounce, no forward, no notification to the sender:

```plaintext
phishing@fake.com → (alias does not exist) → ✗ discarded silently
```

The phisher has no way to know the alias is gone. Their emails keep being sent into the void.

### What About the Account on the Leaked Website?

You can log into the breached service and update your email to a fresh alias. The attacker cannot follow you because they only have the old alias.

**This is the key insight that most people miss:** your relationship with a service is tied to an alias, not to your real identity. When that alias is burned, you replace it. The service keeps working. The phisher loses access to you.

### Real Example: What I Did

When I received the phishing emails:

1.  I checked the `X-Simplelogin-Envelope-To` header to confirm which alias was targeted
    
2.  I logged into SimpleLogin and **deleted** both the Cultura and FFT aliases
    
3.  I created fresh aliases for both services
    
4.  I updated my accounts with the new aliases
    
5.  Total time: about 2 minutes
    

The phisher can keep my old aliases forever. They're useless now.

* * *

## How to Protect Yourself: The Alias Mindset

This section is the core of the article. If you remember only one thing, remember this process.

### The Golden Rule

> **One alias per website. Never reuse. Never share.**

If you follow this rule, you turn every alias into a sensor. You will always know which service leaked your data. You can always cut the link with one click.

### The Lifecycle (Memorize This)

```plaintext
Create  →  Use on one site  →  Breach happens  →  Spam arrives
                                                  ↓
                                         Identify source (alias name)
                                                  ↓
                                         Delete alias (silent drop)
                                                  ↓
                                         Create fresh alias
                                                  ↓
                                         Update the account
                                                  ↓
                                         Done. The attacker is locked out.
```

### Checklist for Everyone

#### 1\. Start Using Aliases Today

*   Sign up for [SimpleLogin](https://simplelogin.io) (free tier: 15 aliases)
    
*   Or use [addy.io](https://addy.io), [Firefox Relay](https://relay.firefox.com), ... (all offer alias features)
    
*   Create a naming convention: `servicename@yourdomain.simplelogin.com`
    
*   Use the browser extension for one-click alias creation
    

#### 2\. When You Receive Unexpected Email

1.  **Do not click anything** — not even "Unsubscribe"
    
2.  **Check the alias** it was sent to (in SimpleLogin, look at `X-Simplelogin-Envelope-To`)
    
3.  **Identify the source** — which website did you use that alias on?
    
4.  **Delete the alias** in SimpleLogin immediately
    
5.  **Report the phishing** to `abuse@sendgrid.com` if SendGrid infrastructure is involved
    
6.  **Create a new alias** for the service you need to keep using
    

#### 3\. If You Were Affected by These Breaches Specifically

1.  **Delete** the aliases you used on Cultura and FFT
    
2.  **Create new aliases** and update your account profiles on those sites
    
3.  **Monitor** SimpleLogin's activity log for any other aliases receiving unexpected mail
    
4.  **Report** the phishing emails to SendGrid at `abuse@sendgrid.com` with full headers
    

#### 4\. General Hygiene

*   Use a **password manager** and never reuse passwords (aliases protect your email, passwords protect your accounts — you need both)
    
*   Enable **PGP encryption** on SimpleLogin so forwarded email content is encrypted
    
*   Check [Have I Been Pwned](https://haveibeenpwned.com) regularly
    
*   Set up SimpleLogin's **browser extension** for one-click alias creation
    
*   Use **subdomains** in SimpleLogin to keep aliases organized by category (shopping, finance, social, etc.)
    

* * *

## Conclusion

The Cultura and FFT breaches demonstrate a complete lifecycle: data is stolen, sold on the dark web, acquired by phishing operators, and weaponized via legitimate email infrastructure like SendGrid. The use of compromised SendGrid accounts means these emails pass all authentication checks, making them difficult to block at the gateway level.

**But the story doesn't end with "they have my email."** Because of aliases, the story ends with: "I know exactly where this came from, I deleted the alias in 30 seconds, and the attacker is now sending emails into a black hole."

This is the mindset shift that aliases enable:

| Old mindset | Alias mindset |
| --- | --- |
| "My email was leaked, I'm helpless" | "My alias was leaked, I know the source" |
| "I have to change my email everywhere" | "I delete one alias, done" |
| "I don't know which site sold my data" | "The alias name tells me immediately" |
| "Spam keeps arriving forever" | "The alias is gone, spam is dropped" |

Data breaches are inevitable. Companies will continue to be hacked. But you can design your digital identity so that a breach at one service is **contained** — it affects exactly one alias and nothing else.

The `geopod-ismtpd` hostname remains a reliable indicator of SendGrid abuse. If you see it in unexpected emails, report it. And if you haven't started using email aliases yet, today is the day to begin.

**One website. One alias. No exceptions.**

* * *

## References

*   [Cultura breach on Have I Been Pwned](https://haveibeenpwned.com/Breach/Cultura)
    
*   [FFT official communiqué (January 12, 2026)](https://www.fft.fr/actualites/communique-cyber-malveillance-fft-2026)
    
*   [Fortra blog: Active Phishing Campaign — Twilio SendGrid Abuse (Oct 2024)](https://www.fortra.com/blog/active-phishing-campaign-twilio-sendgrid-abuse)
    
*   [Kaseya/INKY: OpenAI invoice scam driven by SendGrid abuse (Jan 2026)](https://www.kaseya.com/blog/how-threat-actors-use-sendgrid-and-callback-phishing-for-openai-scam)
    
*   [AbuseIPDB reports for geopod-ismtpd](https://www.abuseipdb.com/check/167.89.118.83)
    
*   [SimpleLogin API documentation](https://github.com/simple-login/app/blob/master/docs/api.md)
    
*   [The Record: France retailers hacked](https://therecord.media/france-retailers-hacked-confirm-cyberattack)
