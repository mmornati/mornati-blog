---
title: "Volets Velux solaires et gel : ne jamais forcer, fermer avant, ouvrir après"
categories:
- smart-home
tags:
- home-assistant
- velux
- cover
- frost
- automation
- homekit
- ai
- prompt
date: '2026-12-03T06:00:00.000000+00:00'
draft: false
slug: velux-solaires-et-gel-ne-jamais-forcer-et-le-verifier-dans-les-donnees
translationKey: velux-solar-shutters-and-frost
cover: cover.jpg
showHero: true
keyfigure: '17 fermetures sans blocage en 4 soirs de gel'
description: "Un soir de novembre, trois de mes volets roulants Velux solaires ont refusé de se fermer : les coulisses étaient gelées. Velux dit de ne jamais forcer. Home Assistant ne voit pas le blocage, alors je lui ai appris à le reconnaître, à fermer avant le gel et à ouvrir après. Cinq jours de vraies données, ce qui marche, ce qui ne marche pas encore, et une recette à donner à votre assistant IA pour faire la même chose chez vous."
summary: "Trois règles pour des volets de toit solaires en hiver : fermer une seule fois à la tombée de la nuit quand le gel arrive, reporter l'ouverture du matin, ne jamais relancer un volet qui a refusé. Les chiffres du 23 au 28 novembre : 17 fermetures sans un seul refus, 14 ouvertures reportées réussies, 3 refus, tous sur le versant nord. Et pourquoi je ne publie plus mon YAML, mais une recette pour l'IA."
---

Le soir du 23 novembre, à 20h42, la maison a fermé les volets des chambres comme tous les soirs. Sur le toit, il faisait −1,2 °C. **Un volet s'est fermé. Les trois autres ont fait vingt-cinq secondes de bruit, puis sont revenus exactement où ils étaient : grands ouverts.**

J'ai fait ce que tout le monde fait. J'ai réessayé. Quatre fois, entre 20h44 et 21h00. Quatre refus de plus.

C'était la pire chose à faire.

## Ce que dit Velux

Mes cinq fenêtres de toit ont des volets roulants solaires Velux (la gamme SSL) : un petit panneau, une batterie, un moteur, aucun fil. Ils sont pilotés par la passerelle VELUX ACTIVE, que Home Assistant voit à travers HomeKit.

Sur le gel, le constructeur est clair, et sa notice aussi :

*   après une période humide (pluie, brouillard, ou simplement l'air d'une chambre qu'on aère), **de la condensation se dépose sur les coulisses et les lames, puis gèle** ;
*   le moteur a une **protection de surcharge** : s'il sent une résistance anormale, il s'arrête pour ne pas abîmer le mécanisme ([notice du volet SSL](https://www.bauhaus.ch/product-documents/velux_ssl_fr.pdf)) ;
*   il ne faut **jamais forcer**, et attendre le dégel. Le support Velux conseille au mieux d'entrouvrir la fenêtre pour que la chaleur de la pièce aide un peu.

La glace peut être dans les coulisses et dans le coffre sans se voir de l'extérieur. Et d'après une fiche revendeur, le moteur reste verrouillé une dizaine de minutes après un refus : mes quatre relances n'avaient aucune chance, elles ont seulement fatigué le mécanisme.

La batterie n'y était pour rien. Les volets avaient bougé normalement après plusieurs jours gris, et ils ont tous refusé exactement le premier soir de gel.

## Ce que Home Assistant ne voit pas

L'application Velux affiche « bloqué ». Home Assistant, lui, ne reçoit rien. J'ai vérifié ce que la passerelle publie en HomeKit pour chaque volet : la position demandée, la position actuelle, et l'état du mouvement. Pas de défaut, pas d'obstacle détecté.

Mais le refus laisse une **signature très nette** dans l'historique :

| | Vraie fermeture | Refus |
|---|---|---|
| État | `closing` → `closed` | `closing` → `open` |
| Position | 100 → 34 → 0 | 100 → 100 |
| Durée | 13 secondes | 20 à 60 secondes |

Un volet qui part, puis revient où il était sans avoir bougé de plus de 10 %, est un volet bloqué. C'est tout le détecteur. Rejoué sur dix jours d'historique, il a retrouvé les 7 refus du 23 novembre sans une seule fausse alerte sur les 55 autres mouvements.

## Trois règles

**1. Fermer avant le gel, une seule fois.** Dès qu'il fait nuit dehors (aucune lumière n'est perdue), si le gel arrive : 2 °C ou moins, ou bien 5 °C ou moins avec un minimum prévu à 0 °C dans la nuit. Une commande, une fois par soir, et plus rien.

**2. Reporter l'ouverture du matin.** À 7h15, les jours d'école, il gèle encore. L'ouverture n'est pas envoyée, elle est mise en attente. Elle part une seule fois, plus tard, quand il fait plus de 1 °C, ou dès 0 °C si le soleil est sorti. À 15h00, si rien n'a été possible, l'attente est abandonnée et je reçois un message : les volets restent fermés.

**3. Ne jamais relancer.** Chaque mouvement est observé. Un refus déclenche une alerte (« gel probable, ne pas réessayer »), et le volet est marqué bloqué pendant 12 heures : aucune automatisation ne lui enverra d'ordre. Si quelqu'un le relance à la main dans les dix minutes, un second message rappelle pourquoi il vaut mieux attendre.

Et l'humidité ? Physiquement, elle compte : sans eau, pas de glace. Mais chez moi, en novembre, elle est entre 85 et 96 % **tous les soirs**, y compris ceux où tout se ferme sans problème. Elle ne distingue rien. Elle est donc notée à chaque mouvement, avec le point de rosée, mais elle ne fait pas partie de la règle. C'est la température qui décide.

## Cinq jours de vraies données

{{< chart >}}
type: 'line',
data: {
  labels: ["23 11h", "23 12h", "23 13h", "23 14h", "23 15h", "23 16h", "23 17h", "23 18h", "23 19h", "23 20h", "23 21h", "23 22h", "23 23h", "24 00h", "24 01h", "24 02h", "24 03h", "24 04h", "24 05h", "24 06h", "24 07h", "24 08h", "24 09h", "24 10h", "24 11h", "24 12h", "24 13h", "24 14h", "24 15h", "24 16h", "24 17h", "24 18h", "24 19h", "24 20h", "24 21h", "24 22h", "24 23h", "25 00h", "25 01h", "25 02h", "25 03h", "25 04h", "25 05h", "25 06h", "25 07h", "25 08h", "25 09h", "25 10h", "25 11h", "25 12h", "25 13h", "25 14h", "25 15h", "25 16h", "25 17h", "25 18h", "25 19h", "25 20h", "25 21h", "25 22h", "25 23h", "26 00h", "26 01h", "26 02h", "26 03h", "26 04h", "26 05h", "26 06h", "26 07h", "26 08h", "26 09h", "26 10h", "26 11h", "26 12h", "26 13h", "26 14h", "26 15h", "26 16h", "26 17h", "26 18h", "26 19h", "26 20h", "26 21h", "26 22h", "26 23h", "27 00h", "27 01h", "27 02h", "27 03h", "27 04h", "27 05h", "27 06h", "27 07h", "27 08h", "27 09h", "27 10h", "27 11h", "27 12h", "27 13h", "27 14h", "27 15h", "27 16h", "27 17h", "27 18h", "27 19h", "27 20h", "27 21h", "27 22h", "27 23h", "28 00h", "28 01h", "28 02h", "28 03h", "28 04h", "28 05h", "28 06h", "28 07h", "28 08h", "28 09h"],
  datasets: [
    { label: "Température extérieure (°C)", data: [2.8, 4.1, 5.0, 5.8, 4.6, 3.0, 1.4, 0.2, -0.5, -1.2, -1.5, -1.8, -1.9, -2.4, -2.6, -2.7, -2.9, -2.9, -3.1, -3.1, -2.9, -2.9, -2.5, -0.9, 0.8, 2.4, 3.9, 5.2, 4.3, 2.9, 1.7, 1.0, 0.5, 0.1, -0.3, -0.7, -0.9, -1.0, -1.1, -1.1, -1.2, -1.5, -1.8, -1.7, -1.8, -1.6, -1.6, -0.5, 1.4, 1.9, 1.6, 1.4, 1.5, 1.3, 1.1, 1.1, 1.1, 1.4, 1.3, 1.4, 1.3, 1.2, 1.0, 0.8, 0.6, -0.3, -1.1, -1.6, -1.9, -2.2, -2.3, -1.1, 0.2, 1.3, 2.3, 3.0, 1.9, 0.3, -0.9, -1.4, -1.7, -2.2, -2.7, -3.1, -2.6, -1.8, -1.2, -1.0, -0.9, -0.9, -2.3, -3.2, -3.7, -4.0, -4.0, -1.8, 0.7, 2.6, 3.8, 4.5, 3.3, 1.6, 0.0, -1.4, -1.6, -1.8, -2.2, -2.9, -3.1, -2.6, -2.2, -2.1, -2.3, -2.4, -3.2, -3.2, -3.0, -2.8, -2.4], borderColor: '#2b46d6', backgroundColor: '#2b46d6', pointRadius: 0, borderWidth: 2, tension: 0.3 },
    { label: "Fermeture réussie", data: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 2.0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 1.2, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, -0.5, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.9, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], showLine: false, pointStyle: 'triangle', rotation: 180, pointRadius: 8, borderColor: '#15171c', backgroundColor: '#7fe3cf' },
    { label: "Ouverture réussie", data: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.4, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.1, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.1, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, -2.5], showLine: false, pointStyle: 'triangle', pointRadius: 8, borderColor: '#15171c', backgroundColor: '#ffe14a' },
    { label: "Refus (volet bloqué)", data: [null, null, null, null, null, null, null, null, null, -1.2, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.1, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.1, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, -2.5], showLine: false, pointStyle: 'crossRot', pointRadius: 9, borderWidth: 3, borderColor: '#e4002b', backgroundColor: '#e4002b' }
  ]
},
options: {
  scales: { x: { ticks: { maxTicksLimit: 12 } }, y: { suggestedMin: -5, suggestedMax: 6 } },
  plugins: { legend: { labels: { usePointStyle: true } } }
}
{{< /chart >}}

| | Quand | Dehors | Résultat |
|---|---|---|---|
| 23 nov., fermeture habituelle | 20h42 | −1,2 °C | **3 volets sur 4 refusent**, puis 4 relances refusées |
| 24 au 27 nov., fermeture avant le gel | 16h50 à 17h10 | −0,5 à 2,0 °C | **17 fermetures, 0 refus** |
| 24 au 27 nov., ouverture reportée | 11h00 à 11h20 | 0,0 à 0,4 °C | 14 ouvertures, **2 refus** |
| 28 nov., ouverture à la main | 9h23 | −2,5 °C | 4 ouvertures, **1 refus** |

Le soir, le problème a disparu. Les nuits sont pourtant descendues jusqu'à −4,5 °C, mais les volets étaient déjà en bas depuis des heures.

Le matin, c'est moins net, et c'est la partie intéressante.

## Le matin du 28 novembre

Samedi, pas d'école, pas d'ouverture automatique à 7h15. À 9h23, quelqu'un ouvre les cinq volets à la main. Il fait −2,5 °C. D'après ma règle, c'est trop tôt de trois degrés et demi.

**Quatre volets s'ouvrent sans broncher. Le cinquième refuse.** L'alerte arrive dans la minute, personne ne le relance, il est resté fermé.

Mis à côté des deux refus de la semaine, ça dessine quelque chose :

*   les deux ouvertures refusées par l'automatisation l'ont été à **0,1 °C**, juste au-dessus de mon seuil « soleil » ;
*   les **trois refus à l'ouverture viennent des deux mêmes volets**, ceux du versant nord-nord-est, à l'opposé des panneaux solaires. Le matin, ils ne voient pas le soleil ;
*   les volets du versant ensoleillé, eux, se sont ouverts à −2,5 °C.

Ma règle traite les cinq volets de la même façon, avec un capteur de lumière posé du côté du soleil. Pour le versant nord, il ne dit rien. La température de l'air ne suffit pas : ce qui compte, c'est ce que le toit a reçu.

## La date qui dit où chercher

Ce que je préfère dans cette automatisation, ce n'est pas la règle. C'est le journal.

Chaque mouvement d'un volet produit un événement daté : quel volet, dans quel sens, réussi ou refusé, la température, l'humidité, le point de rosée. **Quand un volet bloque, je n'ai pas un vague souvenir (« il me semble que ça a coincé cette semaine »), j'ai une date et une heure.** Et avec une date, on sait exactement où aller regarder dans l'historique : la lumière à ce moment-là, la température une heure avant, ce que les autres volets ont fait à la même seconde.

C'est comme ça que les trois points du paragraphe précédent sont sortis : pas en réfléchissant, en relisant cinq jours d'événements. Et c'est ce qui permet de corriger les scripts sur des faits. Les prochaines modifications sont déjà en cours : un seuil d'ouverture plus prudent, une condition différente pour le versant nord, et une question que je n'ai pas encore tranchée (faut-il une seconde tentative, une seule, bien plus tard, pour un volet resté fermé ?).

Ce journal sert aussi à [Jev, le modèle de décision](/fr/jev-home-assistant-un-modele-de-decision-pour-mes-automatisations/) que j'interroge en parallèle de mes règles. Pour l'instant il observe seulement : avec un seul soir d'incident en mémoire, il ne peut pas en savoir plus que la règle. On en reparlera à la fin de l'hiver.

## Pourquoi je ne publie plus mon YAML

Pendant des années, j'ai collé le code de mes automatisations dans mes articles, [comme pour les volets et la chaleur](/fr/homeassistant-close-cover-to-control-the-home-temperature-v2/). Je ne le fais plus, et celle-ci montre bien pourquoi : 470 lignes, pleines de noms d'entités qui n'existent que chez moi, de seuils réglés pour mon toit, d'un capteur de lumière qui regarde ma terrasse. Vous copier ça ne vous avancerait pas. Il faudrait tout réécrire.

Ce qui se transporte d'une maison à l'autre, ce n'est pas le code. C'est **l'intention, les règles, les garde-fous, et les cas qui ont mal tourné**. Et aujourd'hui, un assistant IA sait très bien écrire une automatisation Home Assistant à partir de ça, surtout s'il peut regarder vos appareils.

Voici donc la recette de cet article. Donnez-la à votre assistant (Claude, ChatGPT, celui que vous utilisez), idéalement connecté à votre Home Assistant. Elle lui demande de commencer par vos volets et vos capteurs, pas par les miens, et elle contient mes cas réels comme tests.

{{< ai-prompt >}}

Deux conseils. Laissez l'assistant vous poser ses questions avant d'écrire quoi que ce soit, c'est là que votre installation entre dans l'automatisation. Et gardez le journal : c'est lui qui vous dira, dans trois semaines, quel seuil était faux.

## Comment ça a été fait

L'automatisation a été conçue le soir même du 23 novembre, dans une session Claude Code sur le dépôt de ma configuration Home Assistant : lecture de l'historique des dix jours précédents, recherche de ce que dit Velux, un plan avec quatre questions pour moi, puis le code et un test qui rejoue les états réels. Cet article a été écrit cinq jours plus tard, dans une autre session, qui a relu l'historique de production (les événements de chaque mouvement, les températures heure par heure) pour en tirer les chiffres ci-dessus. C'est cette relecture qui a fait apparaître le versant nord, et une troisième session corrige maintenant les règles. Ma part : les relances inutiles du premier soir, les réponses aux questions, et l'orientation du toit.
