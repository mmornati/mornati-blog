---
title: "Cinq ans de circuits inversés : un après-midi avec Claude pour remettre ma pompe à chaleur à l'endroit"
categories:
- smart-home
tags:
- home-assistant
- hitachi
- heat-pump
- csnet
- underfloor-heating
- claude
- ai
- mcp
date: '2026-11-11T18:30:00.000000+00:00'
draft: false
slug: cinq-ans-de-circuits-inverses-ma-pompe-a-chaleur-relue-par-claude
translationKey: heat-pump-swapped-circuits
cover: cover.jpg
showHero: true
keyfigure: '5 ans avec les circuits 1 et 2 inversés'
description: "En refaisant les tableaux de bord de ma pompe à chaleur Hitachi dans Home Assistant, Claude a remarqué que le circulateur tournait à 100 % en permanence. En tirant ce fil, avec quelques photos, quelques tests et les données lues en direct par mon intégration CSNet, on a fini par confirmer un doute que j'avais depuis l'installation, il y a cinq ans : le plancher chauffant et les radiateurs de l'étage étaient configurés sur le mauvais circuit, et la vanne trois voies « qui ne marchait pas en auto » obéissait au thermostat de l'étage."
summary: "Un circulateur réglé en vitesse fixe à 100 % depuis le premier jour, une vanne mélangeuse bloquée à 100 %, une sonde posée sur du plastique, et surtout deux circuits inversés dans la télécommande. Comment on l'a prouvé avec deux interrupteurs et l'historique de Home Assistant, ce qu'on a changé (lois d'eau, limite du plancher, identifiants des thermostats radio), ce que ça a donné, et les trois corrections que l'intégration Home Assistant a reçues au passage."
projects:
- hitachi-csnet
---

Ça a commencé par une histoire de style. Je refaisais les tableaux de bord de Home Assistant, et en particulier la vue de la pompe à chaleur, avec Claude qui lisait les vraies valeurs pour remplir les cartes. Au milieu des couleurs et des icônes, il s'arrête sur une ligne : **la vitesse du circulateur est à 100 %, et elle n'a jamais bougé**. Pas une fois, sur tout l'historique disponible. Il ajoute que le débit est de 3,9 m³/h et que l'écart entre l'eau qui part et celle qui revient ne dépasse pas 1 ou 2 °C, et que tout ça ressemble beaucoup à un circulateur qui tourne trop vite, tout le temps.

Je ne me doutais pas que ce fil allait me ramener cinq ans en arrière.

## Un peu de contexte : une PAC découverte chez moi

Ma pompe à chaleur est une Hitachi Yutaki. Elle alimente deux circuits : un **plancher chauffant au rez-de-chaussée**, et des **radiateurs à l'étage**. Je ne nommerai pas l'entreprise qui l'a installée. Je dirai seulement que les techniciens m'avaient avoué, pendant l'installation, que c'était **la première PAC Hitachi qu'ils posaient**, qu'ils n'avaient pas été formés dessus, et qu'ils étaient en train de la découvrir chez moi. Ça se voyait un peu.

À l'époque, j'avais déjà un doute. La vanne trois voies du plancher ne fonctionnait pas en automatique : dès qu'on la passait en auto, elle se fermait et le plancher ne faisait plus que faire tourner son eau en boucle, sans jamais chauffer. Je l'avais signalé. On m'avait répondu, je cite à peu près, que **« ce n'est pas très grave, c'est un plus »**. Pas de commentaire. La vanne est donc restée en manuel, et j'ai passé cinq ans avec une maison qui chauffait, mais où il était étrangement difficile de trouver le bon réglage : jamais vraiment trop chaud, jamais vraiment trop froid, jamais vraiment bien non plus.

Depuis, j'ai écrit et je maintiens une [intégration Home Assistant pour les PAC Hitachi qui passent par le cloud CSNet](https://github.com/mmornati/home-assistant-csnet-home) (j'en ai parlé [ici](/fr/seamlessly-automate-your-home-with-hitachi-devices-a-custom-home-assistant-integration/) et [là](/fr/reverse-engineering-hitachis-cloud-api-with-ai-from-browser-devtools-to-a-full-home-assistant-integration/)). C'est elle qui a rendu cet après-midi possible : Claude pouvait lire en direct ce que la PAC pensait faire, et comparer avec ce que je voyais dans la chaufferie.

## Premier fil : le circulateur à 100 %

Avant de toucher à quoi que ce soit, il fallait savoir si la valeur était vraie. L'intégration ne transforme pas ce champ, CSNet lui-même dit 100 %. Restait à vérifier à la source : sur la télécommande de la PAC, menu *Informations*, je lis **débit 3,90 m³/h, vitesse du circulateur 100 %**. Au chiffre près.

Dans le menu installateur (sur ma télécommande, on y entre en gardant **OK** et **retour** appuyés trois secondes, puis le code fléché du manuel), l'écran *Configuration pompe à eau* donne la réponse en une ligne : **Mode de fonctionnement : Fixe, Vitesse chauffage : 100 %**. Le circulateur n'a jamais modulé depuis l'installation.

Claude m'a expliqué pourquoi les installateurs laissent souvent ce réglage : à 100 %, le débit minimum de l'échangeur est garanti en toutes circonstances, y compris pendant les dégivrages, et personne ne rappelle pour une alarme de débit. C'est le choix de la **simplicité de réglage contre la consommation**. Pas une erreur grave, mais pas gratuit non plus :

*   un circulateur de ce type consomme environ 60 à 90 W à fond, contre 15 à 40 W en modulation, soit **0,5 à 1,5 kWh par jour**, quelques dizaines d'euros par saison de chauffe ;
*   avec un débit trop élevé, l'écart départ/retour s'écrase (1 à 2 °C au lieu des 5 °C pour lesquels Hitachi dimensionne), ce qui n'aide pas le rendement ;
*   et surtout, à mon avis, **l'usure** : un moteur qui tourne à fond, en continu, pendant des années, vieillit plus vite. Ça ne se voit pas sur une facture, mais ça se paie le jour où il faut le changer.

Le changement tient en une ligne : **Fixe → ΔT**. Quelques minutes plus tard, Home Assistant affichait 97 %, puis 82 %, puis 70 %, avec un débit qui commençait à baisser et un écart départ/retour qui s'élargissait à 3 °C. Ce soir, le circulateur tourne autour de **50 %** pour **2,4 m³/h**.

Mais en regardant ces données, Claude avait aussi noté deux autres valeurs suspectes : la **position de la vanne mélangeuse, bloquée à 100 %** exactement comme le circulateur, et une pression d'eau de 4,48 bar qui ne bougeait jamais. C'est la vanne qui m'a fait repenser à mon vieux doute.

## Deuxième fil : la vanne et sa sonde

J'ai pris deux photos du groupe du plancher : la vanne trois voies motorisée en bas, le circulateur Wilo au-dessus, le départ plancher avec son thermomètre rouge, le retour avec son thermomètre bleu. Et la sonde de température du circuit, **simplement serrée par un collier sur le tube multicouche blanc**.

Claude l'a repéré tout de suite : le multicouche (PEX-alu-PEX) isole, la sonde ne touche le tube qu'en un point, rien ne la protège de l'air ambiant. Elle mesure un mélange d'eau et d'air, avec plusieurs minutes de retard, de quoi faire osciller n'importe quelle régulation. La solution, sans passer à une sonde à immersion : la déplacer **sur le corps en laiton de la vanne à poignée rouge**, qui est en contact direct avec l'eau, avec un peu de pâte thermique (j'avais de l'Arctic MX-6 dans un tiroir), du ruban aluminium, le collier par-dessus, et la coque isolante du kit refermée dessus.

Mais en regardant mes photos des **lois d'eau**, Claude a soulevé quelque chose de bien plus important que la sonde.

## Le vrai problème : les deux circuits sont inversés

Chez Hitachi, les deux circuits n'ont pas le même rôle. Le **circuit 1 est un circuit direct** : la PAC produit son eau pour lui. Le **circuit 2 est le seul qui peut avoir une vanne mélangeuse** : le manuel du régulateur le dit noir sur blanc, la régulation de la seconde température d'eau est « *only for circuit 2* ». La vanne ne sait que refroidir l'eau de la PAC en la mélangeant avec le retour. Logiquement, c'est donc le circuit le plus froid, le plancher, qui doit être en C2.

Chez moi, la télécommande disait l'inverse :

| | Circuit | Loi d'eau | Consigne par 8 °C dehors |
|---|---|---|---|
| Plancher (rez-de-chaussée) | **C1** (direct) | Par courbe : 44 °C à −20 °C, pente 0,6 | ≈ 27 °C |
| Radiateurs (étage) | **C2** (mélangé) | Par points : 60 °C à −10 °C, 21 °C à 20 °C | ≈ 37 °C |

Or il n'y a qu'**un seul groupe avec vanne mélangeuse, et il est sur le plancher**. Les radiateurs de l'étage ont leur propre circulateur, sans vanne. Physiquement, l'installation était câblée comme Hitachi le prévoit. C'est la configuration qui était à l'envers.

### Le prouver avec deux interrupteurs

Une hypothèse, c'est bien. Mais je voulais la voir. Claude a proposé un test simple : éteindre un circuit à la fois depuis l'application, et regarder ce que fait la PAC dans Home Assistant.

**J'éteins l'étage.** Une minute plus tard, `mix_valve_position` passe de **100 % à 0 %**, pour la première fois de tout l'historique. La vanne montée sur le plancher obéit donc au thermostat de l'étage.

**J'éteins le rez-de-chaussée, je rallume l'étage.** La consigne d'eau de la PAC passe de **23-24 °C à 38 °C**, la vanne remonte à 100 %, et l'eau en sortie de PAC grimpe de 25 à 38 °C.

| Ce qui est allumé | Consigne d'eau PAC | Vanne du plancher | Départ PAC |
|---|---|---|---|
| Rez-de-chaussée (C1) seul | 23-24 °C | 0 % | 23-25 °C |
| Étage (C2) seul | **38 °C** | 100 % | 25 → **38 °C** |
| Les deux (la situation de ces cinq ans) | 23-28 °C | 100 % | 23-28 °C |

Tout s'explique d'un coup :

*   **La PAC produisait l'eau pour la loi d'eau du C1, celle du plancher.** Les radiateurs de l'étage recevaient donc de l'eau à 23-28 °C au lieu des 35-40 °C prévus. L'étage chauffait mal, et je compensais en montant les consignes.
*   **La vanne du plancher visait la consigne des radiateurs, environ 37 °C**, qu'elle ne pouvait jamais atteindre avec de l'eau à 28 °C. Elle restait donc ouverte à fond tant que l'étage demandait de la chaleur, et se fermait complètement dès que l'étage était satisfait, **même si le rez-de-chaussée avait froid**.
*   C'est exactement le comportement que j'avais signalé il y a cinq ans : en auto, la vanne fermait et le plancher ne chauffait plus. Elle ne « marchait pas en automatique » parce qu'**elle était commandée par le mauvais circuit**. Le « c'est un plus » était donc, en fait, le cœur de la régulation.

Un dernier contrôle a fini de me convaincre plus tard dans la soirée : une fois la configuration corrigée, quand le C2 était éteint, **le Wilo du plancher s'est arrêté**. Le circulateur, la vanne et la sonde du plancher sont bien tous câblés sur le C2.

### La correction : rien à recâbler

Puisque le câblage était bon, tout se faisait dans la télécommande. Claude m'a fait prendre une photo de chaque écran avant toute modification (pour pouvoir revenir en arrière en cinq minutes), puis :

1.  **Limite haute du C2 : 60 °C → 45 °C**, en premier. La PAC allait maintenant produire de l'eau plus chaude pour l'étage, c'est cette limite qui protège le plancher.
2.  **Lois d'eau échangées** : C1 par points (radiateurs), C2 par courbe (plancher).
3.  **Thermostats** : les deux thermostats d'ambiance sont radio. Plutôt que de les échanger physiquement, j'ai inversé les valeurs 1 et 2 dans *Identif. circuit télé-cde radio*. Test : je change la consigne sur le thermostat de l'étage, c'est bien le C1 qui réagit.
4.  Les réglages de la vanne (bande proportionnelle, temps de course) n'ont pas bougé : ce sont ceux d'usine.

Quelques minutes plus tard :

| | Avant | Après |
|---|---|---|
| Consigne d'eau PAC | 23-28 °C | **41 °C** |
| Départ / retour PAC | ~24 / 23 °C | **38 / 34 °C** |
| Vanne du plancher | suit le thermostat de l'étage | suit le thermostat du rez-de-chaussée |
| Départ plancher | dépend de ma main sur la poignée | **27 °C**, mesuré par la sonde remontée sur le laiton |

L'étage reçoit enfin de l'eau à 40 °C. Le plancher reçoit de l'eau mélangée autour de 27 °C, ce que demande sa loi d'eau.

## Ce qu'il reste à régler

Je préfère être honnête : tout n'est pas encore parfait. Quand on a remis la vanne en auto, on a vu que **la position affichée par la PAC et la position réelle de la vanne ne correspondaient pas**. Pendant des années, CSNet disait « 100 % » alors que la vanne, en auto, allait se coller à sa butée fermée. Le servomoteur est un modèle « trois points » : la PAC lui dit « ouvre » ou « ferme » pendant un certain temps, sans jamais lire sa position. La piste la plus probable est un **servomoteur qui tourne à l'envers** (les deux fils ouverture et fermeture inversés, ou un sélecteur de sens mal positionné), avec en plus une échelle rouge/bleu mal calée sur la poignée.

C'est un réglage de cinq minutes, hors tension, une fois le modèle exact identifié. En attendant, la vanne est réglée pour que le plancher tourne autour de 27 °C, et la nouvelle sonde me permet de le vérifier dans Home Assistant au lieu de descendre regarder le thermomètre.

## L'intégration en a profité aussi

Cet après-midi a aussi fait avancer l'[intégration CSNet](https://github.com/mmornati/home-assistant-csnet-home), avec deux nouvelles versions publiées dans la foulée :

*   **Renommer une pièce ne casse plus les entités.** Une fois les circuits remis à l'endroit, j'ai renommé les zones dans CSNet (« Salon » et « Bibliothèque » ne voulaient plus rien dire). L'intégration identifiait chaque zone par son nom : toutes les entités sont devenues indisponibles. Elles sont maintenant identifiées par l'identifiant stable de CSNet, avec une migration automatique du registre qui garde les `entity_id` et l'historique.
*   **La pression était doublée.** Les 4,48 bar affichés étaient physiquement impossibles sur un circuit protégé par une soupape à 3 bar. Mon manomètre indiquait environ 1,9 bar. En comparant la valeur brute de CSNet (224) avec une ancienne issue d'un autre utilisateur qui avait exactement le même facteur 2, la conclusion était claire : la valeur est en centièmes de bar. L'intégration affiche maintenant 2,24 bar.
*   **Un nouveau capteur : la température d'eau du circuit 2.** CSNet la remontait déjà (`waterOutlet2Temp`), l'intégration ne l'utilisait pas. C'est la sonde que je venais de remonter sur le laiton, et c'est elle qui me dit que le plancher est à 27 °C.

La version 2.11.0 a été publiée, installée via HACS et vérifiée sur ma propre instance dans la même session, et une 2.11.1 a suivi pour un avertissement de dépréciation repéré dans les logs après le redémarrage.

## Ce que je retiens

Je ne suis pas chauffagiste. Il y a cinq ans, j'avais un doute, mais aucun moyen de le défendre face à des techniciens qui me disaient que ce n'était pas grave. Je ne savais pas que, chez Hitachi, la vanne mélangeuse appartient forcément au circuit 2, je ne savais pas lire une loi d'eau, et je n'aurais jamais pensé à éteindre un circuit à la fois en regardant la consigne d'eau pour savoir qui commande quoi.

Cet après-midi, j'avais les données (grâce à une intégration que je maintiens depuis des années sans imaginer qu'elle servirait un jour à ça), un téléphone pour prendre des photos, et un modèle capable de relier un manuel Hitachi, une photo de tuyaux, un écran de télécommande et une série temporelle dans Home Assistant. Les modèles progressent vite, et c'est dans ce genre de situation que ça se voit le plus : **avec les bonnes informations, une IA ne se contente pas de répondre, elle vous rend capable de faire des choses que vous n'auriez pas su faire seul**. Même sur un sujet que vous ne connaissez pas du tout.

Cinq ans après l'installation, ma pompe à chaleur est enfin configurée comme elle a été câblée. Il était temps.

## Comment ça a été fait

Deux sessions Claude Code avec Opus 5.5, dans le dépôt de l'intégration CSNet, sur un après-midi. La première est partie de la vue de la PAC dans Home Assistant : Claude a lu l'historique du circulateur dans OpenObserve (le MCP de Home Assistant n'expose pas ce capteur), confirmé qu'il était lu correctement, trouvé le chemin du menu installateur et validé le passage en ΔT. La seconde a repris ce contexte, analysé mes photos (le groupe du plancher, les lois d'eau, les circulateurs, les écrans de la télécommande, le servomoteur), cherché le rôle des circuits dans les manuels Hitachi, proposé et lu en direct les tests d'arrêt de circuit, puis guidé l'échange de configuration écran par écran. Elle a aussi écrit les corrections de l'intégration, avec leurs tests, ouvert et fusionné les PR une fois la CI verte, publié les versions, les a installées via HACS dans le navigateur intégré une fois que je m'étais connecté, et a remis les identifiants des entités en ordre pour qu'aucun tableau de bord ne casse. Ma part : les photos, les mains dans la chaufferie, les boutons de la télécommande, et les questions. Cet article a été écrit dans une autre session, à partir de ces deux transcriptions.
