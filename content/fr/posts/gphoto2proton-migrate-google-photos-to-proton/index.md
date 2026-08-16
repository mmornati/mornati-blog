---
title: 'Comment j'ai créé gphoto2proton pour migrer 354 Go de Google Photos vers Proton'
tags:
- migration
- auto-hébergé
- open-source
- google-photos
- proton
categories: [Développement, Open Source, Migration]
date: '2026-08-01T18:04:49.167000+00:00'
slug: gphoto2proton-migrate-google-photos-to-proton
description: Comment j'ai créé un script pour migrer 354 Go de Google Photos vers Proton. Pourquoi
  Drive et Photos sont des API différentes, et les deux outils dont j'avais besoin pour les relier
---
Si vous lisez ceci, vous êtes probablement dans la même situation que moi : un abonné Proton satisfait qui souhaite quitter Google Photos, mais qui ne trouve pas de chemin de migration simple, surtout si vous n'êtes pas sur Windows.

Les applications de bureau Proton gèrent nativement le téléchargement de photos sur Windows, mais sur macOS et Linux, vous êtes laissé avec l'CLI `proton-drive` et une documentation qui ne vous dit pas la moitié de ce que vous devez savoir. Après avoir passé des jours à explorer des voies sans issue, j'ai créé [gphoto2proton](https://github.com/mmornati/gphoto2proton) (avec l'aide de Claude), et j'ai appris quelques leçons difficiles sur l'architecture de Proton en cours de route.

## Le problème

Google Takeout vous fournit vos photos sous forme d'un ensemble d'archives `.tgz` de plusieurs gigaoctets. Chaque archive contient vos fichiers médias ainsi que des fichiers JSON sidecar avec les métadonnées (date de capture, localisation GPS, description) et des fichiers `album.json` décrivant la structure de vos albums.

Si vous êtes sur Windows, l'application de bureau Proton Drive fonctionne simplement : elle télécharge vers Drive et Photos. Mais sur les autres plateformes, vous manquez de fonctionnalités. La création d'albums, en particulier, n'a pas d'API officielle ni d'outils. L'CLI `proton-drive` (v0.7.0, publiée le 31 juillet 2026) possède des sous-commandes `photo upload` et `album create` dans son code source, mais ni le README de l'CLI ni la page de support officielle de Proton ne les mentionnent. Ils apparaissent dans `proton-drive --help`, mais il faudrait savoir qu'il faut chercher.

## Le problème d'architecture : Drive ≠ Photos

Voici la première chose que personne ne vous dit : **Proton Drive et Proton Photos ne sont pas la même chose**.

Ils partagent un backend (vos fichiers finissent dans le même stockage chiffré, bien que d'après ce que je peux voir via l'API Drive, même le stockage chiffré est différent entre les deux services), mais ils sont accessibles via des API complètement différentes :

*   **Proton Drive** utilise l'API Drive standard : les fichiers vont dans "Mes fichiers", gérables via le SDK, les commandes `filesystem` de l'CLI, ou des ponts tiers comme rclone.
    
*   **Proton Photos** a une API séparée sur `photos-api.proton.me` (non documentée) : la chronologie des photos et les albums vivent dans un volume protégé que les appels réguliers à l'API Drive ne peuvent pas toucher.
    

Cette distinction est importante car télécharger une photo dans votre dossier Drive ne la fait **pas** apparaître dans votre chronologie Photos. Deux opérations complètement différentes.

## Approche 1 : Le binaire Go - Multiplateforme mais avec des compromis

Ma première tentative était un binaire CLI Go qui pouvait fonctionner sur macOS, Linux et Windows. Il utilisait la bibliothèque [rclone/Proton-API-Bridge](https://github.com/rclone/Proton-API-Bridge) : un SDK tiers qui enveloppe l'API Drive de Proton avec le chiffrement et l'authentification nécessaires.

L'approche était élégante sur le papier :

1.  **Lecteur en streaming** : lire les archives `.tgz` directement sans extraire sur le disque (économisant 80 Go+ d'espace temporaire par archive)
    
2.  **Restauration EXIF** : passer chaque fichier via `exiftool` pour incorporer l'horodatage original `photoTakenTime.timestamp` du sidecar JSON de Google
    
3.  **Téléchargement vers Drive** : via le SDK Proton-API-Bridge, les fichiers atterrissent dans un dossier `gphoto2proton` sous Mes fichiers
    
4.  **Création d'albums** : via des appels HTTP directs vers le point de terminaison non documenté `photos-api.proton.me/photos/v1/albums`
    

Le binaire Go fonctionne bien et reste la meilleure option si vous avez besoin d'un support multiplateforme. Mais il a une limitation fondamentale : les photos finissent dans votre dossier Drive, pas dans la chronologie Photos. Vous pouvez les voir dans l'application web Photos (Proton analyse Drive pour les photos), mais elles ne bénéficient pas du traitement complet de la chronologie, des dates correctes, de l'association aux albums, etc.

La création d'albums via l'API Photos non documentée est également fragile. Elle a été rétro-engineerée à partir du trafic web, il n'y a pas de contrat ni de journal des modifications, et elle pourrait casser à n'importe quelle mise à jour de Proton.

## Approche 2 : Le script Bash - Bien faire les choses

Après avoir lutté avec l'approche Go, j'ai découvert que l'CLI officiel `proton-drive` (de [ProtonDriveApps/sdk](https://github.com/ProtonDriveApps/sdk)) possède des sous-commandes non documentées `photo` et `album` qui communiquent directement avec l'API Photos via le propre code de Proton.

Cela a conduit à une deuxième approche, complètement différente : un script bash qui enveloppe l'CLI et gère le pipeline complet :

1.  **Extraire** : `tar xzf` une archive à la fois
    
2.  **Appliquer les dates de capture** : pour les vidéos, l'CLI retombe sur le mtime du système de fichiers, donc le script lit `photoTakenTime.timestamp` du sidecar JSON et le définit via `touch -t`
    
3.  **Télécharger** : `proton-drive photo upload -c skip` télécharge directement dans la chronologie Photos (déduplication par hash de contenu)
    
4.  **Vérifier** : relancer le téléchargement (devrait transférer 0) + vérifier que chaque SHA1 est dans la chronologie
    
5.  **Albums** : `proton-drive album create` + `album add-photo` recrée les albums avec les photos par lots de 200
    
6.  **Valider** : confirmer que chaque photo attendue existe dans chaque album sur le serveur
    
7.  **Nettoyer** : supprimer les fichiers extraits, marquer l'archive comme terminée
    

Cette approche place les photos exactement où elles devraient être : dans la chronologie Photos avec des albums fonctionnels. Les inconvénients :

*   **Linux uniquement** - le script utilise `flock`, `stat` GNU, et suppose `pass` pour les identifiants
    
*   **Disque intensif** - extrait chaque archive de 50 Go vers ~80 Go sur le disque avant le téléchargement
    
*   **Plus lent** - pas de streaming ; cycle extraction-attente-téléchargement-attente-nettoyage par archive
    

## Pourquoi deux approches ?

Parce que l'architecture de Proton m'y a forcé. Le binaire Go est le bon outil si :

*   Vous êtes sur macOS ou Windows
    
*   Vous voulez le streaming (pas d'extraction sur disque)
    
*   Vous acceptez les photos dans Drive (pas la chronologie Photos)
    

Le script bash l'emporte si :

*   Vous êtes sur Linux (ou pouvez spin-up une machine Linux)
    
*   Vous voulez les photos dans la chronologie Photos avec des albums fonctionnels
    
*   Vous avez assez d'espace disque pour l'extraction temporaire
    

J'utilise les deux : le binaire Go pour une option multiplateforme rapide, le script bash pour l'import "proper" vers Photos.

## L'outil

Le projet est [gphoto2proton](https://github.com/mmornati/gphoto2proton), open-source (MIT). Il comprend :

*   Un binaire CLI Go avec lecture d'archives en streaming, restauration EXIF, sécurité de reprise basée sur SQLite, et 126 tests qui passent
    
*   Un script bash pour l'import complet dans la chronologie Photos via l'CLI `proton-drive`
    
*   Documentation complète sur [gphoto2proton.mornati.net](https://mmornati.github.io/gphoto2proton/)
    
*   Formule Homebrew pour une installation facile sur macOS/Linux (`brew install gphoto2proton`)
    

La migration n'est pas triviale — ~354 Go à travers 9 archives — mais le résultat en vaut la peine : toutes les photos dans Proton Photos avec les albums intacts, les dates correctes, et sans compte Google nécessaire.

## Exemple d'exécution du script

Si vous suivez la documentation, vous serez prêt en quelques minutes. Je mets ici la sortie du script bash pour vous montrer ce qu'il permet de faire. Je pense que cela m'a fait gagner des jours (semaines ?) d'opérations manuelles.

```bash
TAKEOUT_DIR=/media/12tb/photos ~/gphoto2proton/gphoto2proton-import.sh
[19:26:09] gphoto2proton-import: takeout=/media/12tb/photos work=/home/mmornati/gphoto2proton/work logs=/home/mmornati/gphoto2proton/logs state=/home/mmornati/gphoto2proton/state
[19:26:09] CLI=proton-drive credentials_store=pass
[19:26:10] authentication OK (store: pass)
[19:26:10] disk space OK: avail=309352MB, need~=104448MB
[19:26:10] skipping takeout-20260729T191209Z-001.tgz (already done)
[19:26:10]
[19:26:10] ==== takeout-20260729T191210Z-1-001.tgz (1/8) ====
[19:26:10] extraction exists, resuming ...
[19:26:10] stripping macOS metadata junk (._*, .DS_Store) ...
[19:26:10] applying original capture dates from sidecar JSON ...
[19:28:35] applied capture dates from sidecar JSON to 16562 files
[19:28:35] building manifest (sha1sum of all media files) ...
[19:28:39]   sha1sum progress: 500 files hashed
total 26956
drwxr-xr-x  6 mmornati mmornati     4096 août   1 09:26 ./
[19:28:39]   sha1sum progress: 500 files hashed
[19:28:44]   sha1sum progress: 1000 files hashed
[19:28:49]   sha1sum progress: 1500 files hashed
[19:28:54]   sha1sum progress: 2000 files hashed
[19:28:57]   sha1sum progress: 2500 files hashed
[19:29:02]   sha1sum progress: 3000 files hashed
[19:29:08]   sha1sum progress: 3500 files hashed
[19:29:13]   sha1sum progress: 4000 files hashed
[19:29:18]   sha1sum progress: 4500 files hashed
[19:29:32]   sha1sum progress: 5000 files hashed
[19:29:36]   sha1sum progress: 5500 files hashed
[19:29:41]   sha1sum progress: 6000 files hashed
[19:29:46]   sha1sum progress: 6500 files hashed
[19:29:52]   sha1sum progress: 7000 files hashed
[19:29:57]   sha1sum progress: 7500 files hashed
[19:30:02]   sha1sum progress: 8000 files hashed
[19:30:07]   sha1sum progress: 8500 files hashed
[19:30:17]   sha1sum progress: 9000 files hashed
[19:30:22]   sha1sum progress: 9500 files hashed
[19:30:28]   sha1sum progress: 10000 files hashed
[19:30:32]   sha1sum progress: 10500 files hashed
[19:30:39]   sha1sum progress: 11000 files hashed
[19:30:44]   sha1sum progress: 11500 files hashed
[19:30:50]   sha1sum progress: 12000 files hashed
[19:30:57]   sha1sum progress: 12500 files hashed
[19:31:03]   sha1sum progress: 13000 files hashed
[19:31:08]   sha1sum progress: 13500 files hashed
[19:31:13]   sha1sum progress: 14000 files hashed
[19:31:18]   sha1sum progress: 14500 files hashed
[19:31:23]   sha1sum progress: 15000 files hashed
[19:31:29]   sha1sum progress: 15500 files hashed
[19:31:34]   sha1sum progress: 16000 files hashed
[19:31:40]   sha1sum progress: 16500 files hashed
[19:31:45]   sha1sum progress: 17000 files hashed
[19:31:47]   sha1sum complete: 17236 files
[19:31:47] expected media: 17236 files (17197 unique)
[19:31:47] uploading (conflict strategy: skip) ...
```

## Leçons apprises

1.  **La surface d'API de Proton est fragmentée** : Drive et Photos sont des systèmes différents avec des API différentes. Ne supposez pas que télécharger vers l'un vous donne l'autre.
    
2.  **L'CLI a des fonctionnalités non documentées** : le README de l'CLI `proton-drive` et la page de support officielle de Proton ne documentent que les commandes `filesystem`, mais `proton-drive --help` révèle un support complet pour `photo upload`, `photo timeline`, `album create` et `album add-photo`. Ils ne sont simplement pas encore documentés dans les docs écrites.
    
3.  **Windows a la meilleure histoire de migration** : l'application officielle Windows de Proton gère tout, de la sauvegarde à la création d'albums. Sur les autres plateformes, vous avez besoin d'outils personnalisés.
    
4.  **Les API non documentées sont un piège** : ma première approche reposait sur le rétro-engineering de `photos-api.proton.me`, qui fonctionne aujourd'hui mais n'a aucune garantie de stabilité. L'approche par l'CLI est plus durable car c'est le propre code de Proton.
    

Le code est sur [github.com/mmornati/gphoto2proton](https://github.com/mmornati/gphoto2proton). Si vous êtes assis sur une export Google Takeout en vous demandant comment l'importer dans Proton, j'espère que cela vous fera gagner du temps.
