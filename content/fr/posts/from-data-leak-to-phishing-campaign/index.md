---
title: De la fuite de données à la campagne de phishing
tags:
- securite
- phishing
- fuite
- simplelogin
- proton
- gestion-alias-email
categories: [Sécurité, IA, Développement]
date: '2026-07-26T21:12:10.371000+00:00'
slug: from-data-leak-to-phishing-campaign
description: Comment les fuites de données de Cultura et FFT ont alimenté un phishing ciblé via SendGrid — et pourquoi un alias par site web est votre meilleure défense.
---
## Introduction

Ces dernières années, deux organisations françaises ont subi des violations de données significatives : Cultura (septembre 2024) et la Fédération Française de Tennis (janvier 2026). Des mois plus tard, les données fuite sont activement utilisées dans des campagnes de phishing ciblées.

Cet article retrace la chaîne complète — de la violation initiale jusqu'à l'email de phishing arrivant dans une boîte de réception — en utilisant de véritables en-têtes d'email comme preuve. Mais plus important encore, c'est un **exercice de formation** : il montre comment une pratique simple — une adresse email par site web — vous transforme de victime passive en quelqu'un qui peut instantanément identifier la source d'une fuite, contenir les dégâts en un clic, et passer à autre chose.

Voyons comment.

* * *

## Les deux violations

### Cultura (septembre 2024)

| Détail | Info |
| --- | --- |
| **Date** | Septembre 2024 |
| **Vecteur d'attaque** | Fournisseur de services IT externe compromis (Octave) |
| **Enregistrements exposés** | ~1,5M d'adresses email uniques |
| **Types de données** | Noms, adresses email, numéros de téléphone, adresses physiques, historique de commandes |
| **Ajouté à HIBP** | 25 septembre 2025 |
| **Source** | [Have I Been Pwned](https://haveibeenpwned.com/Breach/Cultura), [The Record](https://therecord.media/france-retailers-hacked-confirm-cyberattack) |

Cultura est un grand détaillant français de produits culturels (livres, musique, jeux, instruments). La violation a été attribuée à une attaque sur Octave, leur fournisseur de services IT. Les données ont ensuite été publiées sur BreachForums par un utilisateur nommé `TanaDeMerde`, exposant plus de 2,1 millions de lignes de données clients.

### FFT — Fédération Française de Tennis (janvier 2026)

| Détail | Info |
| --- | --- |
| **Date** | 12 janvier 2026 |
| **Vecteur d'attaque** | Cyberattaque sur une plateforme utilisée par les clubs affiliés |
| **Enregistrements exposés** | ~1,2 million de licenciés |
| **Types de données** | Noms, adresses email, numéros de téléphone, adresses postales, numéros de licence |
| **Communiqué officiel** | [communiqué FFT](https://www.fft.fr/actualites/communique-cyber-malveillance-fft-2026) |
| **Couverture** | [Le Figaro](https://www.lefigaro.fr/sports/tennis/tennis-la-fft-touchee-par-un-acte-de-cybermalveillance-20260112), [01net](https://www.01net.com/actualites/la-federation-francaise-de-tennis-fft-victime-dun-cyberattaque-les-donnees-de-milliers-de-licencies-sont-dans-la-nature.html), [Sud-Ouest](https://www.sudouest.fr/economie/cybersecurite/la-federation-francaise-de-tennis-victime-d-une-cyberattaque-certaines-donnees-des-licencies-ont-fuite-27392032.php) |

La FFT est la deuxième plus grande fédération sportive de France. Les attaquants ont obtenu l'accès à une plateforme de gestion des clubs, exfiltrant les données personnelles de plus d'un million de licenciés.

* * *

## La chaîne d'attaque

```plaintext
Violations de données (Cultura / FFT)
       ↓
Listes email vendues ou publiées sur le dark web
       ↓
L'opérateur de phishing acquiert les données, y compris les alias
       ↓
L'opérateur utilise des comptes SendGrid compromis pour envoyer des emails via API
       ↓
SendGrid traite les emails via l'infrastructure geopod-ismtpd
       ↓
SimpleLogin reçoit l'email et le transmet à la vraie boîte aux lettres
       ↓
L'email de phishing arrive dans la boîte de réception de l'utilisateur (ou spam)
```

Les deux campagnes de phishing observées suivent le même schéma :

* **Identité de l'expéditeur usurpée :** Faux services d'assurance maladie / rappels de paiement

* **Lignes d'objet en français :** Ciblant spécifiquement les utilisateurs français

* **Infrastructure SendGrid :** Les emails passent SPF, DKIM et DMARC parce qu'ils originate de serveurs SendGrid légitimes

* **Envoyé via API SendGrid :** Les en-têtes `X-SG-*` et le nom d'hôte `geopod-ismtpd` confirment la soumission par API, pas SMTP


* * *

## L'alias comme capteur : Une adresse par site web change tout

Avant de plonger dans les en-têtes, établissons le concept central qui a rendu cette analyse possible.

### Le principe

Au lieu de donner à chaque site web votre véritable adresse email, vous donnez à chacun un **alias unique** :

```plaintext
cultura@votredomaine.simplelogin.com    →  pour Cultura
fft@votredomaine.simplelogin.com        →  pour la FFT
newsletter@votredomaine.simplelogin.com →  pour les newsletters
banque@votredomaine.simplelogin.com     →  pour votre banque
```

Chaque alias transmet à la même vraie boîte aux lettres. Pour le monde extérieur, chaque alias ressemble à une adresse email différente. Pour vous, ils arrivent tous dans une seule boîte de réception.

### Pourquoi c'est un superpouvoir

Le moment où du spam ou un email de phishing arrive sur l'un de ces alias, vous savez **exactement** ce qui s'est passé :

| Vous recevez du spam sur → | Vous savez immédiatement → |
| --- | --- |
| `cultura@votredomaine.simplelogin.com` | Les données de Cultura ont été fuiteées ou vendues |
| `fft@votredomaine.simplelogin.com` | Les données de la FFT ont été fuiteées ou vendues |
| `banque@votredomaine.simplelogin.com` | Votre banque a un problème (ou leur partenaire a vendu des données) |

**Pas de devinette. Pas de « est-ce que j'ai utilisé mon Gmail ou Outlook ici ? » Pas de recherche dans le gestionnaire de mots de passe pour vérifier quelle adresse email vous avez utilisée sur quel site.**

### Le cycle de vie de l'élimination

Quand un alias est compromis, la solution est triviale :

```plaintext
1. SUPPRIMEZ l'alias compromis dans SimpleLogin (ou désactivez-le)
2. CRÉEZ un nouvel alias pour ce service (par ex. cultura2@...)
3. METTEZ À JOUR le compte avec le nouvel alias
4. TERMINÉ — tout email futur vers l'ancien alias est silencieusement abandonné
```

C'est tout. Vous ne changez pas votre vraie adresse email. Vous ne mettez pas à jour 50 autres comptes. Vous ne vous inquiétez pas de l'ancien alias utilisé pour les réinitialisations de mot de passe ou l'usurpation d'identité.

Une fois supprimé, SimpleLogin **ne transmet pas** les emails envoyés à cet alias. Ils sont discarded au niveau du serveur. Le phisher peut continuer à envoyer — les emails disparaissent dans un trou noir.

### Sans alias

Si vous avez utilisé votre vraie email partout et qu'un service la fuite :

```plaintext
1. Votre email est maintenant entre les mains de spammeurs, phishers et courtiers en données
2. Vous ne pouvez pas « défuir » votre email
3. Chaque email de phishing qui arrive semble légitime (c'est votre vraie adresse)
4. Vous ne pouvez pas dire quel service l'a fuiteée
5. Votre seule option est d'abandonner l'adresse et de notifier tout le monde que vous connaissez
```

C'est l'ancien monde. Les alias sont le nouveau monde.

Maintenant, voyons comment tout cela s'est joué en pratique avec les fuites Cultura et FFT.

* * *

## Analyse des en-têtes d'email

Ci-dessous se trouve un véritable en-tête d'email capturé depuis l'un de ces emails de phishing. Les détails personnels ont été remplacés par des données d'exemple.

### En-têtes bruts (anonymisés)

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

### Principales découvertes des en-têtes

#### 1. La protection d'alias de SimpleLogin

L'email a été envoyé à `shopping@user.simplelogin.com` — un alias créé pour Cultura. SimpleLogin l'a transmis à la vraie boîte aux lettres `user@protonmail.com`. L'expéditeur original ne voit jamais l'adresse réelle.

**Cependant**, parce que l'alias a été utilisé sur le site de Cultura et que Cultura a été violé, l'alias lui-même s'est retrouvé dans les données fuiteées. Le phisher sait maintenant exactement quel alias cibler.

#### 2. L'expéditeur original est encodé, pas caché

SimpleLogin réécrit l'en-tête `From:`, mais l'expéditeur revendiqué original fuite à travers :

```plaintext
From: "Spoofed Company - noreply at fake-domain.com"
     <noreply_at_fake-domain_com_random@simplelogin.co>
```

Le nom d'affichage préserve l'identité réclamée originale. La partie locale de l'email utilise la convention : `originaluser_at_originaldomain_random@simplelogin.co`. En inversant la substitution `_at_`, vous pouvez extraire l'expéditeur réclamé : `noreply@fake-domain.com`.

**C'est un indicateur de phishing**, pas une vraie trace — le domaine est usurpée.

#### 3. L'infrastructure d'envoi : geopod-ismtpd de SendGrid

Le domaine du `Message-Id` est `geopod-ismtpd-15`. C'est un nom d'hôte interne SendGrid bien documenté.

Fortra (octobre 2024) a documenté cet indicateur exact :

> « Le champ reçu contient aussi communément 'geopod-ismtpd,' qui a été classé par les rapports d'abus SendGrid comme étant associé au phishing, spam et usurpation. »

L'en-tête Received brut de SendGrid montrerait `by geopod-ismtpd-15 (SG) with ESMTP id`, mais SimpleLogin supprime les en-têtes Received SendGrid intermédiaires pendant la transmission. Seul le suffixe du `Message-Id` reste comme preuve.

Kaseya/INKY (janvier 2026) a confirmé dans leur analyse d'une campagne de phishing SendGrid séparée :

> « Un saut lit : 'Received from ... by geopod-ismtpd-15 (SG) with HTTP id ...', indiquant que les serveurs geopod-ismtpd de SendGrid ont généré le message. La présence de 'geopod-ismtpd' et '(unknown)' dans les en-têtes Received est un indicateur commun que l'email a originates de SendGrid. »

#### 4. SPF/DKIM/DMARC passent tous — Parce que c'est une infrastructure légitime

L'email passe les trois vérifications d'authentification parce qu'il a été envoyé via les serveurs autorisés de SendGrid. Un serveur de réception voit :

* `spf=pass` — Les IPs de SendGrid sont autorisées par l'enregistrement SPF de simplelogin.co

* `dkim=pass` — La signature DKIM de SimpleLogin est valide

* `dmarc=pass` — L'alignement est maintenu

Pour le serveur de réception, cela ressemble à un email légitime de SimpleLogin, pas une tentative de phishing. La couche d'authentification ne peut pas distinguer entre un email transmis légitime et un email de phishing envoyé via un compte expéditeur compromis en amont.

* * *

## Les deux emails de phishing reçus

### Email 1 : Alias Cultura ciblé

| Champ | Valeur |
| --- | --- |
| **Alias utilisé** | `shopping@user.simplelogin.com` |
| **Expéditeur réclamé** | `noreply@idx.inc` |
| **Objet** | Rappel de votre versement |
| **Thème** | Faux rappel de paiement / remboursement d'assurance maladie |
| **Message-ID** | `geopod-ismtpd-15` |
| **Date** | 3 juillet 2026 |

![](/images/from-data-leak-to-phishing-campaign/00-d9b912ac-1b65-4b92-b22c-8b247fe267d1.png)

### Email 2 : Alias FFT ciblé

| Champ | Valeur |
| --- | --- |
| **Alias utilisé** | `sports@user.simplelogin.com` |
| **Expéditeur réclamé** | `noreply@appsys.co.uk` |
| **Objet** | Rappel : Mettez à jour votre dossier assurance |
| **Thème** | Fausse mise à jour de document d'assurance maladie |
| **Message-ID** | `geopod-ismtpd-1` |
| **Date** | 1er juillet 2026 |

![](/images/from-data-leak-to-phishing-campaign/01-6e55c4c0-a8ad-4abd-ab0b-ba725ff9de03.png)

Les deux emails partagent des modèles identiques :

* Prétendent être d'un service français d'assurance maladie / paiement

* Pressent le destinataire à agir (mettre à jour le dossier, confirmer le paiement)

* Utilisent exclusivement la langue française

* Envoyés via l'infrastructure SendGrid

* Arrivés à quelques jours d'intervalle, suggérant le même opérateur exécutant les deux listes


* * *

## Le cycle de vie de l'élimination en pratique

Parcourons exactement ce qui se passe lorsque vous supprimez un alias compromis.

### Avant suppression

L'alias existe dans le système SimpleLogin. Tout email envoyé est transmis à votre vraie boîte aux lettres :

```plaintext
phishing@fake.com → shopping@user.simplelogin.com → user@protonmail.com ✓
```

### Après suppression

L'alias n'existe plus. SimpleLogin reçoit l'email et **le supprime immédiatement**. Pas de rebond, pas de transmission, pas de notification à l'expéditeur :

```plaintext
phishing@fake.com → (l'alias n'existe pas) → ✗ abandonné silencieusement
```

Le phisher n'a aucun moyen de savoir que l'alias est parti. Leurs emails continuent d'être envoyés dans le vide.

### Et le compte sur le site web fuiteé ?

Vous pouvez vous connecter au service violé et mettre à jour votre email vers un nouvel alias. L'attaquant ne peut pas vous suivre parce qu'il n'a que l'ancien alias.

**C'est la perception clé que la plupart des gens manquent :** votre relation avec un service est liée à un alias, pas à votre identité réelle. Quand cet alias est brûlé, vous le remplacez. Le service continue de fonctionner. Le phisher perd l'accès à vous.

### Exemple réel : Ce que j'ai fait

Quand j'ai reçu les emails de phishing :

1. J'ai vérifié l'en-tête `X-Simplelogin-Envelope-To` pour confirmer quel alias était ciblé

2. Je me suis connecté à SimpleLogin et j'ai **supprimé** les alias Cultura et FFT

3. J'ai créé de nouveaux alias pour les deux services

4. J'ai mis à jour mes comptes avec les nouveaux alias

5. Temps total : environ 2 minutes

Le phisher peut garder mes anciens alias pour toujours. Ils sont inutiles maintenant.

* * *

## Comment vous protéger : L'état d'esprit des alias

Cette section est le cœur de l'article. Si vous ne devez retenir qu'une chose, retenez ce processus.

### La règle d'or

> **Un alias par site web. Ne jamais réutiliser. Ne jamais partager.**

Si vous suivez cette règle, vous transformez chaque alias en capteur. Vous saurez toujours quel service a fuite vos données. Vous pouvez toujours couper le lien en un clic.

### Le cycle de vie (Mémorisez ceci)

```plaintext
Créer  →  Utiliser sur un site  →  La violation se produit  →  Le spam arrive
                                                  ↓
                                         Identifier la source (nom de l'alias)
                                                  ↓
                                         Supprimer l'alias (abandon silencieux)
                                                  ↓
                                         Créer un nouvel alias
                                                  ↓
                                         Mettre à jour le compte
                                                  ↓
                                         Terminé. L'attaquant est bloqué.
```

### Checklist pour tous

#### 1. Commencez à utiliser des alias aujourd'hui

* Inscrivez-vous à [SimpleLogin](https://simplelogin.io) (tiers gratuit : 15 alias)

* Ou utilisez [addy.io](https://addy.io), [Firefox Relay](https://relay.firefox.com), ... (tous offrent des fonctionnalités d'alias)

* Créez une convention de nommage : `nomservice@votredomaine.simplelogin.com`

* Utilisez l'extension navigateur pour la création d'alias en un clic


#### 2. Quand vous recevez un email inattendu

1. **Ne cliquez sur rien** — pas même « Se désinscrire »

2. **Vérifiez l'alias** auquel il a été envoyé (dans SimpleLogin, regardez `X-Simplelogin-Envelope-To`)

3. **Identifiez la source** — sur quel site web avez-vous utilisé cet alias ?

4. **Supprimez l'alias** dans SimpleLogin immédiatement

5. **Signalez le phishing** à `abuse@sendgrid.com` si l'infrastructure SendGrid est impliquée

6. **Créez un nouvel alias** pour le service que vous devez continuer à utiliser


#### 3. Si vous avez été affecté par ces violations spécifiquement

1. **Supprimez** les alias que vous avez utilisés sur Cultura et FFT

2. **Créez de nouveaux alias** et mettez à jour vos profils de compte sur ces sites

3. **Surveillez** le journal d'activité de SimpleLogin pour tout autre alias recevant des emails inattendus

4. **Signalez** les emails de phishing à SendGrid à `abuse@sendgrid.com` avec les en-têtes complets


#### 4. Hygiène générale

* Utilisez un **gestionnaire de mots de passe** et ne réutilisez jamais les mots de passe (les alias protègent votre email, les mots de passe protègent vos comptes — vous avez besoin des deux)

* Activez le **chiffrement PGP** sur SimpleLogin pour que le contenu des emails transmis soit chiffré

* Vérifiez régulièrement [Have I Been Pwned](https://haveibeenpwned.com)

* Configurez l'**extension navigateur** de SimpleLogin pour la création d'alias en un clic

* Utilisez des **sous-domaines** dans SimpleLogin pour organiser les alias par catégorie (courses, finances, social, etc.)


* * *

## Conclusion

Les violations Cultura et FFT démontrent un cycle complet : les données sont volées, vendues sur le dark web, acquises par les opérateurs de phishing, et transformées en armes via une infrastructure email légitime comme SendGrid. L'utilisation de comptes SendGrid compromis signifie que ces emails passent toutes les vérifications d'authentification, les rendant difficiles à bloquer au niveau de la passerelle.

**Mais l'histoire ne s'arrête pas à « ils ont mon email. »** À cause des alias, l'histoire se termine par : « Je sais exactement d'où cela vient, j'ai supprimé l'alias en 30 secondes, et l'attaquant envoie maintenant des emails dans un trou noir. »

C'est le changement d'état d'esprit que les alias permettent :

| Ancien état d'esprit | État d'esprit alias |
| --- | --- |
| « Mon email a été fuite, je suis impuissant » | « Mon alias a été fuite, je sais la source » |
| « Je dois changer mon email partout » | « Je supprime un alias, c'est fait » |
| « Je ne sais pas quel site a vendu mes données » | « Le nom de l'alias me le dit immédiatement » |
| « Le spam continue d'arriver pour toujours » | « L'alias est parti, le spam est abandonné » |

Les violations de données sont inevitables. Les entreprises continueront d'être piratées. Mais vous pouvez concevoir votre identité numérique pour qu'une violation chez un service soit **contenue** — elle affecte exactement un alias et rien d'autre.

Le nom d'hôte `geopod-ismtpd` reste un indicateur fiable de l'abus de SendGrid. Si vous le voyez dans des emails inattendus, signalez-le. Et si vous n'avez pas encore commencé à utiliser des alias email, aujourd'hui est le jour de commencer.

**Un site web. Un alias. Pas d'exception.**

* * *

## Références

* [Violation de données Cultura sur Have I Been Pwned](https://haveibeenpwned.com/Breach/Cultura)

* [Communiqué officiel FFT (12 janvier 2026)](https://www.fft.fr/actualites/communique-cyber-malveillance-fft-2026)

* [Blog Fortra : Campagne de phishing active — Abus de Twilio SendGrid (oct. 2024)](https://www.fortra.com/blog/active-phishing-campaign-twilio-sendgrid-abuse)

* [Kaseya/INKY : Arnaque à la facture OpenAI motivée par l'abus de SendGrid (jan. 2026)](https://www.kaseya.com/blog/how-threat-actors-use-sendgrid-and-callback-phishing-for-openai-scam)

* [Rapports AbuseIPDB pour geopod-ismtpd](https://www.abuseipdb.com/check/167.89.118.83)

* [Documentation API SimpleLogin](https://github.com/simple-login/app/blob/master/docs/api.md)

* [The Record : Détaillants français piratés](https://therecord.media/france-retailers-hacked-confirm-cyberattack)
