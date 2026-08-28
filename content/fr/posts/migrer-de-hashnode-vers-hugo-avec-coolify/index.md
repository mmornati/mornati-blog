---
title: 'Migrer mon blog de Hashnode vers Hugo auto-hébergé sur Coolify'
categories:
- web-dev-blogging
- devops
tags:
- hashnode
- hugo
- blowfish
- coolify
- ovh
- vps
- auto-hebergement
- migration
- cloudinary
- remark42
- umami
- docker
- github-actions
date: '2026-08-16T12:00:00.000000+00:00'
slug: migrer-de-hashnode-vers-hugo-avec-coolify
translationKey: migrating-from-hashnode-to-hugo-with-coolify
description: Comment j'ai déplacé 195 articles de Hashnode vers un blog Hugo + Blowfish
  auto-hébergé sur un VPS OVH derrière Coolify — en préservant chaque URL, en synchronisant
  les images sur Cloudinary, et en faisant tourner toute la stack pour 60 €/an.
cover: cover.jpg
showHero: true
---

Après sept ans d'écriture sur Hashnode, la plateforme qui hébergeait mon
blog depuis 2019 a fini par ressembler à une cage plutôt qu'à un confort.
J'avais dépassé le plan gratuit, le plan Pro me coûtait un abonnement
récurrent pour des fonctionnalités que je n'utilisais pas, et chaque fois
que je voulais faire quelque chose de différent — analytics personnalisés,
commentaires auto-hébergés, propriété pleine de mes images — je tombais
sur un paywall ou un « feature not available on your plan ». Pire : mes
anciens commentaires et réactions étaient derrière une API GraphQL
réservée au Pro. Je ne possédais rien.

Cet article est le récit de la migration que je viens d'expédier :
**195 articles** déplacés de Hashnode vers un site
[Hugo](https://gohugo.io) avec le thème
[Blowfish](https://blowfish.page), déployé via [Coolify](https://coolify.io)
sur un [VPS OVH](https://www.ovhcloud.com/fr/vps/), avec commentaires
auto-hébergés ([Remark42](https://remark42.com)), analytics auto-hébergés
([Umami](https://umami.is)), et un CDN [Cloudinary](https://cloudinary.com)
pour les images dans les articles — **le tout pour environ 60 € / an**,
moins cher qu'une seule année de Hashnode Pro.

Si vous hésitez à faire le même saut, voici tout ce que j'ai appris, y
compris les parties où j'ai dû chercher un peu.

## Les exigences strictes notées avant d'écrire la moindre ligne de code

Je suis ingénieur. Je ne migre pas pour le plaisir. Avant de supprimer
quoi que ce soit sur Hashnode, j'ai épinglé les non-négociables sur un
carnet :

1. **Je possède les données.** Sources Markdown, images, commentaires,
   analytics — tout sous mon contrôle, en fichiers plats, dans git ou
   une base de données auto-hébergée.
2. **Aucun URL cassé.** Sept ans de liens entrants, de classement dans
   les moteurs de recherche et de trafic depuis Reddit / Hacker News
   dépendent du fait que `/<slug>/` résolve vers le bon article. En,
   IT et FR compris.
3. **Trois langues, un seul dépôt.** Anglais à la racine, italien sous
   `/it/`, français sous `/fr/`, tout dans le même repository.
4. **Pas d'abonnement mensuel pour la plateforme.** Cloudinary et un nom
   de domaine, oui ; un SaaS de CMS, non.
5. **Commentaires et analytics auto-hébergés.** Aucun tracking tiers,
   aucune publicité Disqus.
6. **Un seul VPS, basé sur Docker.** Je loue déjà un VPS OVH pour
   d'autres choses — le blog doit vivre à côté, derrière le même reverse
   proxy.
7. **Déployer avec `git push`.** Pas de FTP, pas de SSH manuel, pas de
   copier-coller de fichiers HTML.

Ces sept lignes se sont révélées l'artefact le plus utile de tout le
projet : chaque décision ultérieure les satisfaisait, ou bien était
écartée.

## La stack finale

| Préoccupation         | Technologie                                                       |
|-----------------------|-------------------------------------------------------------------|
| Site statique         | Hugo `0.164.0` (extended) + thème Blowfish (sous-module git)      |
| CDN d'images          | Cloudinary (URL servies avec `f_auto,q_auto`)                     |
| Commentaires          | Remark42 (un seul conteneur, BoltDB sur un volume Coolify)        |
| Analytics             | Umami + PostgreSQL (deux ressources Coolify)                      |
| Reverse proxy / TLS   | Traefik (intégré à Coolify, Let's Encrypt)                        |
| CI / CD               | GitHub Actions (build Hugo + `peaceiris/actions-gh-pages@v4`)     |
| Cible du déploiement  | Ressource Coolify « Static » pointant sur une branche `deploy`    |
| Serveur               | VPS OVH (plan legacy, 60 € TTC / an)                              |

Tout ce qui figure sous ce tableau est open-source et auto-hébergé. Le
seul coût récurrent est le VPS plus quelques dollars de transformations
Cloudinary par mois.

## Pourquoi Hugo + Blowfish

J'avais deux finalistes : Hugo et Astro. Hugo l'a emporté pour trois
raisons :

* **Vitesse de build.** Deux cents articles multilingues, avec
  traitement d'images, qui se compilent en moins de trois secondes sur
  mon laptop. Astro est rapide aussi, mais le binaire statique unique
  d'Hugo est plus simple à embarquer dans une image Docker.
* **Multilinguisme natif.** Hugo traite les langues comme un concept de
  première classe avec `defaultContentLanguage`, des menus et taxonomies
  spécifiques à chaque langue, et plusieurs formats de sortie. Astro
  demande plus de boilerplate pour faire la même chose.
* **Blowfish.** Un thème qui fournit déjà les boutons de copie de code,
  la recherche Fuse.js (`Ctrl+K`), une grille de cartes, les articles
  liés, les images héros, les métadonnées Open Graph, le mode sombre et
  une mise en page de lecture très propre. J'aurais dû assembler tout ça
  à la main sur Astro.

Un petit changement cassant à connaître : **Blowfish v2.105 a supprimé le
bloc de configuration historique `[params.comments] provider = "remark42"`.**
Les commentaires viennent désormais d'un partial fourni par l'utilisateur
dans `layouts/partials/comments.html` plus le booléen
`[article] showComments = true`. Le partial que je livre est court — il
lit `site.Params.remark42.host` et injecte le script d'embed. Avec un
`host` vide, le partial n'affiche rien, donc les aperçus locaux restent
propres.

## Pourquoi Coolify sur OVH

Coolify est la réponse open-source et auto-hébergée à Heroku / Vercel /
Render. C'est un orchestrateur Docker Compose avec une UI web : chaque
« ressource » est un conteneur (ou un site statique), Traefik est devant
tout, les certificats Let's Encrypt sont émis automatiquement, et l'UI
gère les sauvegardes planifiées. J'ai une seule instance Coolify et un
seul VPS — tout ce que je déploie atterrit sur le même reverse proxy,
avec le même domaine, derrière le même certificat.

L'angle VPS OVH, c'est juste le coût. Ma facture actuelle est de
**60 € TTC / an**, sur un plan legacy que je renouvelle depuis des années.
Pour référence, les prix publiés aujourd'hui sur `ovhcloud.com/fr/vps/`
pour la nouvelle gamme **VPS 2027** :

| Tier       | vCores | RAM   | SSD      | Bande passante    | HT / mois | **TTC / mois** | ~ / an   |
|------------|--------|-------|----------|-------------------|-----------|----------------|----------|
| VPS-1      | 2      | 4 Go  | 40 Go    | 500 Mbit/s        | 3,81 €    | **4,57 €**     | ~ 55 €   |
| **VPS-2**  | **4**  | **8 Go** | **75 Go** | **1 Gbit/s**     | **7,21 €**| **8,65 €**     | **~ 104 €** |
| VPS-3      | 6      | 12 Go | 100 Go   | 2 Gbit/s          | 10,40 €   | 12,48 €        | ~ 150 €  |
| VPS-4      | 8      | 24 Go | 200 Go   | 3 Gbit/s          | 19,96 €   | 23,95 €        | ~ 287 €  |

Tous les tiers incluent l'anti-DDoS et une sauvegarde quotidienne
automatisée ; le trafic est illimité. **Le VPS-2 est le point
d'équilibre** pour un blog + Remark42 + Umami + Postgres. Mon ancien
plan est encore moins cher parce qu'il précède la gamme 2027 — preuve
qu'OVH fidélise ses clients qui restent.

Bilan : **toute la stack coûte environ 5 € par mois**, moins qu'une
seule année de Hashnode Pro, avec la pleine propriété de chaque octet.

## Le script de migration : ce que `scripts/migrate.py` fait réellement

La pièce la plus utile de tout ce projet est un script Python qui
transforme un export GitHub de Hashnode en arborescence de contenu
multilingue Hugo. Hashnode a une fonction « Backup Posts » dans le
dashboard qui produit un dépôt Git avec chaque article en `.md` et son
front matter YAML. Je l'ai cloné dans `_raw/blog-posts/` (gitignoré,
read-only) et lancé :

```bash
python3 scripts/migrate.py --workers 24
```

Ce qu'il fait, étape par étape :

1. **Parse le front matter YAML**, avec un fallback tolérant pour les
   cas où Hashnode écrit des guillemets non échappés
   (`title: "foo "bar""`, qui n'est pas du YAML valide).
2. **Détecte la langue** de chaque article avec un scorer de tokens
   réglé à la main (les mots-outils italiens ont un poids plus élevé
   que les français, qui ont un poids plus élevé que les anglais). Il
   échantillonne le titre plus les 1500 premiers et derniers caractères
   du corps et déclare un gagnant quand l'écart de score est suffisant ;
   sinon l'article reste en anglais par défaut. Ré-exécutable : chaque
   couple `(lang, slug)` déjà écrit est suivi en mémoire et sauté.
3. **Télécharge chaque image du corps et chaque cover** en parallèle
   avec un `ThreadPoolExecutor` (24 workers). Le cache
   thread-safe URL → chemin local signifie qu'une même image référencée
   depuis trois articles n'est téléchargée qu'une fois. Les fichiers
   atterrissent sous `static/images/<slug>/NN-name.ext`, où `NN` est
   l'ordre d'apparition dans le Markdown.
4. **Réécrit les URLs distantes en chemins locaux** dans le Markdown —
   à la fois la forme `![alt](https://cdn.hashnode.com/...)` et les
   balises `<img>` brutes (nettoyées en Markdown pour que le
   téléchargeur puisse les voir). En cas d'échec de téléchargement,
   l'URL d'origine est conservée pour que l'article ne soit jamais
   cassé.
5. **Écrit les page bundles Hugo** à
   `content/{en,it,fr}/posts/<slug>/index.md` avec la cover enregistrée à
   côté comme page resource Hugo :

   ```text
   content/fr/posts/<slug>/index.md
   content/fr/posts/<slug>/cover.jpg
   ```

   Pour les articles non-anglais, il ajoute aussi `url: /<lang>/<slug>/`
   et `aliases: [/<slug>]` au front matter, pour que Hugo puisse câbler
   les redirections.

Une exécution sur mes 195 articles a pris 22 secondes — l'essentiel du
temps passé à attendre que le `cdn.hashnode.com` de Hashnode serve les
images. Le script émet `build/migration-report.json` et
`build/failures-images.log` pour savoir exactement quels articles et
quelles images ont posé problème.

## Rétrocompatibilité : aucun URL cassé

C'était la partie que je craignais le plus, et celle où j'ai mis le plus
de soin. Hashnode servait chaque article à
`https://blog.mornati.net/<slug>/`. Sept ans de backlinks, des dizaines
de threads Reddit et Hacker News, quelques podcasts qui pointaient vers
des articles précis — tous ces URLs devaient continuer à fonctionner.

### Articles anglais : rien à faire

La config permalinks de Hugo garde les articles anglais à la racine du
blog :

```toml
# config/_default/hugo.toml
[permalinks]
  posts = "/:slug"
```

Chaque article sous `content/en/posts/<slug>/index.md` vit donc à
`https://blog.mornati.net/<slug>/` — exactement l'URL utilisée par
Hashnode. **Zéro redirection, zéro perte SEO.**

### Articles italiens et français : aliases + générateur de redirections

Les articles italiens et français devaient migrer sous `/it/` et `/fr/`
parce que le mode multilingue de Hugo scope les URLs de page sous le
préfixe de langue. Le front matter d'un article traduit ressemble à ça :

```yaml
---
title: 'Migrating My Blog from Hashnode to Self-Hosted Hugo on Coolify'
slug: migrating-from-hashnode-to-hugo-with-coolify
translationKey: migrating-from-hashnode-to-hugo-with-coolify
url: /fr/migrer-de-hashnode-vers-hugo-avec-coolify/
aliases:
  - /migrer-de-hashnode-vers-hugo-avec-coolify
---
```

Voici le piège : **Hugo applique les `aliases` sous le préfixe de langue
de la page**, donc pour une page française un alias
`/migrer-de-hashnode-vers-hugo-avec-coolify` est rendu à
`/fr/migrer-de-hashnode-vers-hugo-avec-coolify/`, jamais à la racine.
Pour moi c'est un problème — l'ancien URL Hashnode était à la racine.

La solution est un script Python de 150 lignes qui tourne *après* `hugo` :

```bash
hugo --minify --gc
python3 scripts/generate_redirects.py
```

Il parcourt chaque article italien et français, lit ses `url` et
`aliases`, et écrit un petit stub HTML meta-refresh à
`public/<old-slug>/index.html` qui pointe vers le canonique
`/it/<slug>/` :

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=/fr/migrer-de-hashnode-vers-hugo-avec-coolify/">
<link rel="canonical" href="/fr/migrer-de-hashnode-vers-hugo-avec-coolify/">
<title>Redirection…</title>
</head>
<body><p>Déplacé. <a href="/fr/migrer-de-hashnode-vers-hugo-avec-coolify/">Aller à /fr/migrer-de-hashnode-vers-hugo-avec-coolify/</a>.</p></body>
</html>
```

Le même script gère aussi un renommage de pages tags auquel je ne
m'attendais pas : Hashnode utilisait `/tag/<name>`, Blowfish utilise
`/tags/<name>`. Pour chaque tag du site il génère
`public/tag/<name>/index.html` qui redirige vers `/tags/<name>/`. Le CI
vérifie que les deux types de stubs existent :

```yaml
# .github/workflows/ci.yml
- test -f public/blog-da-iphone/index.html
- test -f public/tag/docker/index.html
```

### RSS : conserver l'ancien chemin

Hashnode servait le flux à `/rss.xml`. La sortie RSS par défaut de Hugo
est `/index.xml`, ce qui aurait cassé l'URL de tous les abonnés
podcasts. Deux lignes dans `config/_default/hugo.toml` corrigent ça :

```toml
[outputFormats]
  [outputFormats.RSS]
    mediatype = "application/rss+xml"
    baseName = "rss"

[outputs]
  home = ["HTML", "RSS", "JSON"]
```

Résultat : le flux est à `/rss.xml`, là où les abonnés l'attendent.

### Bilan

Chacun des 195 anciens URLs résout en 200 OK, dans la bonne langue, sur
la bonne page. Le CI le prouve pour les multilingues ; les EN n'ont
même pas besoin de preuve, les permalinks de Hugo ont fait le travail.
Les moteurs de recherche suivront le meta-refresh et le canonical vers
le nouvel URL, et la fenêtre de grâce de 30 jours sur Hashnode me sert
de filet de sécurité pendant le cutover.

## Images : Cloudinary avec un fallback local gracieux

J'ai **des années** de captures d'écran, schémas et photos dans les
articles. Le CDN de Hashnode était généreux mais propriétaire ;
ramener tous ces octets sur mon VPS aurait signifié servir des
gigaoctets de fichiers statiques depuis un unique lien à 1 Gbit/s. J'ai
scindé le problème en deux :

* **Les covers** restent sur le VPS. Elles vivent comme page resources
  Hugo (`content/<lang>/posts/<slug>/cover.{jpg,png}`) et sont servies
  directement par Traefik. Elles sont petites, sur le chemin critique
  de chaque page de listing, et bénéficient du `sendfile` + gzip de
  nginx.
* **Les images du corps** sont stockées dans git sous
  `static/images/<slug>/`, mais au moment du build leurs références
  `/images/foo/bar.jpg` dans le HTML généré sont réécrites en
  `https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto/blog/foo/bar.jpg`.
  Le `f_auto` de Cloudinary sert de l'AVIF/WebP aux navigateurs qui le
  supportent, et le `q_auto` trouve une qualité raisonnable par image —
  un gain mesurable sur les pages avec beaucoup d'images inline.

Le script de sync est `scripts/cloudinary_sync.py`. C'est du git-ops :
il parcourt `static/images/`, calcule un `sha256` pour chaque fichier,
n'upload que les fichiers dont le digest a changé (état persisté dans
`build/cloudinary.synced.json`, gitignoré en local et restauré dans le CI
via `actions/cache@v4` keyed sur l'arborescence d'images plus le
script), puis réécrit le HTML construit pour échanger les URLs locales
contre les URLs de livraison Cloudinary.

### Rétrocompatibilité sans aucun secret Cloudinary

Le workflow de déploiement protège l'étape Cloudinary avec un `if` :

```yaml
# .github/workflows/deploy.yml
- name: Sync images to Cloudinary + rewrite HTML
  if: env.CLOUDINARY_CLOUD_NAME != ''
  env:
    CLOUDINARY_CLOUD_NAME: ${{ secrets.CLOUDINARY_CLOUD_NAME }}
    CLOUDINARY_API_KEY:    ${{ secrets.CLOUDINARY_API_KEY }}
    CLOUDINARY_API_SECRET: ${{ secrets.CLOUDINARY_API_SECRET }}
  run: python3 scripts/cloudinary_sync.py
```

Si les trois secrets `CLOUDINARY_*` sont absents, l'étape est sautée
entièrement et les URLs locaux `/images/...` arrivent en production
inchangés. **Le site fonctionne toujours sur le VPS seul.** C'est ce
qui a permis de déployer la migration en tranches : d'abord le code, en
vérifiant que chaque article se charge encore via l'ancien chemin
local, puis activation de Cloudinary une fois la réécriture validée.

### Artefacts de liens morts, ignorés proprement

Certaines des anciennes URLs du CDN Hashnode renvoient maintenant des
pages d'erreur HTML enregistrées avec une extension d'image. Le script
refuse de les uploader — il inspecte les 12 premiers octets de chaque
fichier et ne le traite comme une image que s'il voit une magic header
PNG / JPEG / GIF / WEBP / AVIF / SVG. Les non-images sont marquées
définitivement `dead: true` dans l'état de sync pour ne jamais être
réessayées.

## CI / CD : `git push` résume toute l'histoire

Le pipeline de déploiement est `.github/workflows/deploy.yml`. Il tourne
sur chaque push vers `main` (filtré sur content, config, layouts,
assets, static et le sous-module du thème) et sur `workflow_dispatch`.
Étapes :

1. **Checkout** avec sous-modules.
2. **Setup Hugo** en `0.164.0` extended via `peaceiris/actions-hugo@v3`.
3. **Build** du site, puis exécution de
   `python3 scripts/generate_redirects.py` pour écrire les stubs
   meta-refresh.
4. **Cache** de `build/cloudinary.synced.json` entre exécutions (clef sur
   l'arborescence d'images + le script).
5. **Sync des images vers Cloudinary** si les secrets sont présents.
6. **Publication** du `./public` résultant sur une branche `deploy`
   avec `peaceiris/actions-gh-pages@v4`, en utilisant `force_orphan: true`
   pour que la branche reflète exactement le dernier build.

Coolify est configuré (une seule fois, via l'UI web) comme une ressource
**Static** pointant sur le dépôt public, branche `deploy`, build pack
**None**, publish directory `/`. Chaque push vers `main` rebuild le
site, force-push `public/` vers `deploy`, et Coolify redéploie
automatiquement sur le nouveau commit. Le VPS ne fait pas tourner
Hugo, n'a pas Go installé, et ne build rien.

Un second workflow, `.github/workflows/ci.yml`, tourne sur les PRs et
sur push vers `main` et valide le build :

```yaml
- test -f public/index.html
- test -f public/index.json
- test -d public/it/posts
- test -d public/fr/posts
- POSTS=$(find public -path '*/posts/*' -name index.html | wc -l)
- test -f public/blog-da-iphone/index.html
- test -f public/tag/docker/index.html
```

Si l'une de ces assertions échoue, la PR est bloquée.

## Coolify : une ressource par service

Toute la configuration côté serveur est documentée dans `DEPLOYMENT.md`
du dépôt. Depuis le dashboard Coolify je crée **quatre** ressources :

### 1. Site statique (le blog lui-même)

* **Source :** dépôt public — `https://github.com/mmornati/mornati-blog`.
* **Branche :** `deploy` (auto-poussée par le workflow de déploiement).
* **Build pack :** None.
* **Publish directory :** `/`.
* **Domaine :** `blog.mornati.net` avec HTTPS via Traefik / Let's
  Encrypt.

### 2. Remark42 (commentaires)

Un seul conteneur `umputun/remark42:latest` — un binaire Go unique, un
seul fichier BoltDB, ~80 Mo de RAM. Variables d'environnement :

```env
REMARK_URL=https://blog.mornati.net
SITE=blog.mornati.net
SECRET=<aléatoire 32+ caractères>    # signe les tokens d'auth — à garder secret
AUTH_GITHUB_CID=<client id GitHub OAuth App>
AUTH_GITHUB_CSEC=<secret GitHub OAuth App>
ADMIN_PASSWD=<mot de passe basic-auth pour /web admin>
```

Volume persistant : `remark-data:/srv/var`. Traefik route `/web`,
`/script.js`, `/remark` et `/api` vers ce conteneur.

### 3. Umami + PostgreSQL

⚠️ **L'image `ghcr.io/umami-software/umami:postgresql-latest` n'embarque
PAS Postgres** — c'est un build Next.js qui attend un Postgres joignable
via `DATABASE_URL`. J'y ai perdu une heure avant d'inspecter l'image et
de réaliser que `scripts/start-docker.sh` exécute un `check-db.js` de
migration sans aucun binaire Postgres à l'intérieur. Donc il vous faut
**deux** ressources Coolify :

* Une base Postgres (Coolify → Database → Postgres), utilisateur
  `umami`, base `umami`, mot de passe passé en `UMAMI_DB_PASSWORD`.
* L'app Umami, avec
  `DATABASE_URL=postgresql://umami:<pass>@<host>:5432/umami`,
  `DATABASE_TYPE=postgresql`, `HASH_SALT=<aléatoire>`,
  `APP_SECRET=<aléatoire>`, `TRACKER_SCRIPT_NAME=script.js`. Port
  interne 3000, route Traefik
  `Host(\`blog.mornati.net\`) && PathPrefix(\`/umami\`)` → umami:3000.

Les données Postgres vivent sur le volume de la ressource base (le
vrai chemin est `/var/lib/postgresql/data`, pas `/app/db-data` comme
disent certains vieux tutoriels).

### 4. Câblage côté site (déjà dans le dépôt)

* `layouts/partials/comments.html` injecte le script d'embed Remark42.
* `config/_default/params.toml` positionne `showComments = true` sous
  `[article]` et `[remark42] siteId = "blog.mornati.net"`.
* Positionner `host = "https://blog.mornati.net/web"` sous `[remark42]`
  active les commentaires. Laissez-le vide (la valeur par défaut dans
  `params.toml`) tant que vous n'êtes pas prêt — le partial n'affiche
  rien en local.

## Cutover DNS & rollback

Le cutover est le moment de vérité. L'ordre compte :

1. **Déployer le code** sur Coolify pendant que Hashnode est encore
   actif — le nouveau site tourne sur une origine différente donc rien
   n'entre en conflit.
2. **Tout vérifier** : HTTPS, `/rss.xml`, le raccourci recherche
   (`Ctrl+K`), un commentaire de test, le tracking Umami, le rendu
   mobile.
3. **Pointer `blog.mornati.net`** (A ou CNAME) vers l'IP du VPS.
4. **Surveiller les logs** pendant 24 heures : tout 404 dans le log
   d'accès est un stub de redirection que j'ai oublié de générer.
5. **Garder Hashnode actif** pendant 30 jours comme filet de sécurité.
   Si quelque chose tourne mal, re-pointez le DNS. Après 30 jours,
   passez le blog Hashnode en privé.

Comme les articles EN conservent leurs URLs racine et que les articles
IT/FR ont des stubs meta-refresh, le cutover est invisible pour les
visiteurs et pour les moteurs de recherche.

## Ajouter un nouvel article depuis zéro

Une fois la plateforme en place, écrire un nouvel article est la partie
la plus simple de tout le projet :

1. Créez `content/fr/posts/<slug>/index.md` (ou `en` / `it`) avec le
   front matter Hugo habituel et le même `translationKey` que les autres
   traductions.
2. Déposez un `cover.{jpg,png}` à côté de `index.md` — Blowfish
   l'utilise comme image héros sur la page de l'article et comme image
   de carte dans les listings.
3. Déposez les images inline sous `static/images/<slug>/NN-name.ext` et
   référencez-les comme `/images/<slug>/NN-name.ext` dans le Markdown.
4. `git add . && git commit -m "Nouvel article : <titre>" && git push`
5. GitHub Actions build, synchronise les images, force-push la branche
   `deploy` ; Coolify redéploie automatiquement. **Aucune action humaine
   sur le serveur.**

Voilà le quotidien. Le terminal sert à git ; le serveur est invisible.

## Développement local

J'édite directement sur `main`. Pour preview un changement avant de
pousser :

```bash
make serve        # docker compose up --build -> http://localhost:8080
make build        # Hugo en docker, sortie dans ./public
make migrate      # ré-exécute la migration P1 depuis _raw/blog-posts
make cloudinary   # upload des images locales + réécriture HTML
```

Le `docker-compose.yml` local build le même `Dockerfile` multi-stage
que le CI : un builder `hugomods/hugo:0.164.0`, un post-processeur
`python:3.12-alpine` (réécriture Cloudinary + redirections racine), et
un serveur final `nginx:1.27-alpine`. `make serve` reflète donc
exactement la stack de production — y compris la transformation
d'image `f_auto,q_auto` quand le build arg `CLOUDINARY_CLOUD_NAME` est
positionné.

## Coûts & verdict

Voici la facture pour la nouvelle plateforme, telle qu'elle sort de mon
compte :

* **VPS OVH** : 60 € TTC / an (plan legacy, bien en dessous du tier
  VPS-1 actuel à 4,57 € TTC / mois).
* **Cloudinary** : le tier gratuit couvre le blog pour l'instant ; je
  ne paie que quelques dollars par mois si un article viral génère
  beaucoup de transformations.
* **Nom de domaine** : ~12 € / an. (Sans rapport avec la migration.)
* **Hugo, Blowfish, Remark42, Umami, PostgreSQL, Coolify, Traefik,
  Let's Encrypt** : 0 €.

Comparé à l'abonnement récurrent Hashnode Pro dont je n'avais plus
besoin, **je suis gagnant dès le premier jour**. Le vrai gain n'est
toutefois pas l'économie — c'est de posséder chaque octet, chaque URL,
chaque déploiement, chaque commentaire. Si Hashnode disparaissait
demain, mon blog ne sourcillerait même pas.

## Ressources

* Dépôt : <https://github.com/mmornati/mornati-blog>
* Runbook de déploiement : `DEPLOYMENT.md` dans le même dépôt
* Script de migration : `scripts/migrate.py` (ré-exécutable, idempotent)
* Sync Cloudinary : `scripts/cloudinary_sync.py`
* Générateur de redirections : `scripts/generate_redirects.py`
* [Hugo](https://gohugo.io/) · [Thème Blowfish](https://blowfish.page)
* [Coolify](https://coolify.io/) · [Traefik](https://traefik.io/)
* [OVH VPS](https://www.ovhcloud.com/fr/vps/) · [Cloudinary](https://cloudinary.com/)
* [Remark42](https://remark42.com/) · [Umami](https://umami.is/)

Si vous êtes sur le point de faire le même saut : épinglez vos
exigences, écrivez le script de migration d'abord, traitez la
préservation des URLs comme non-négociable, et laissez Cloudinary être
une optimisation débrayable. Tout le reste n'est que détails — des
details agréables, mais des détails.