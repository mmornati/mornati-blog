---
title: 'Le chauffe-eau, 4 ans plus tard : orchestration solaire + heures creuses (v2)'
date: '2026-08-24T09:00:00.000000+00:00'
slug: smart-water-heater-orchestration-solar-off-peak-v2
translationKey: smart-water-heater-orchestration-solar-off-peak-v2
categories:
- Home Assistant
- Maison Connectée
- DIY
tags:
- home-assistant
- domotique
- energie
- solaire
- automatisation
- chauffe-eau
description: 'Quatre ans après ma première automatisation de chauffe-eau à base de Shelly, voici ce qui a changé : détection de fin de chauffe par thermostat, chauffe d''appoint en heures pleines pilotée par le solaire, et cycle de nuit intelligent plafonné.'
summary: 'Deux cumulus sur un tarif Heures Creuses, 12 panneaux et pas de batterie - la v2 de mon orchestration de chauffe-eau, avec le YAML réel et les vrais chiffres.'
cover: cover.jpg
showHero: true
---

Il y a quatre ans, je [remplaçais les minuteries d'heures creuses de mes deux chauffe-eau par un Shelly Plus 1 et Home Assistant](/smart-water-heater-with-home-assistant-and-shelly-device/). Une première étape solide : allumer les cumulus quand la fenêtre heures creuses (HC) s'ouvre, et les sauter quand la maison est vide. Quand les panneaux solaires sont arrivés, j'ai décrit toute la danse de la fenêtre de midi dans [l'article sur les deux ans de solaire](/two-years-of-solar-the-real-numbers-and-roi/).

Depuis, le système a évolué silencieusement. Pas une réécriture - une orchestration. Cet article est la **v2, quatre ans après** : ce que j'ai changé, le YAML réel, et les vrais chiffres.

> **Note de déploiement, honnêtement.** La logique v2 ci-dessous est dans ma config et en cours de déploiement. Mon instance live tourne encore sur les automatisations v1 à base de flags - je l'ai vérifié avant d'écrire, et je vous dirai précisément ce qui est branché maintenant et ce qui est en route.

**Avertissement :** je ne suis ni installateur ni électricien. Un chauffe-eau et l'électricité peuvent être dangereux ; c'est le carnet de bord de ma maison, pas des instructions pour la vôtre.

## TL;DR - ce qui change vs. la version 2022

| Capacité | v1 (2022) | v2 (maintenant) |
|---|---|---|
| Détection de fin de chauffe | Devinée à 14:09 (« toujours en train de tirer du courant ? ») | Détection thermostat : puissance à 0 -> cycle terminé |
| Comportement en heures pleines (HP) | Toujours éteint en HP | Solaire d'abord : relance en HP seulement si le surplus couvre le cumulus |
| Cycle de nuit | Autocontrôle fixe de 2 h | Nuit intelligente avec plafond (minutes plafondées) |
| Forcer une pleine nuit | Toggle vacances seul | Toggle `force_cumulus_hc` + automation `force_cumulus_nigh` |
| Notifications | Basique | Fin de cycle, relance/arrêt HP solaire, rapports de nuit |

---

## Contexte : deux cumulus, la tarification, le solaire

- **Deux chauffe-eau électriques (cumulus)** : un dans la cave (ballon plus grand), un dans le garage (plus petit). Chacun est commuté par son propre relais **Shelly Plus 1** et mesuré via un **Shelly EM**, chaque cumulus sur son propre canal de pince ampèremétrique (`sensor.energy_meter_cumulus_cave_power`, `sensor.energy_meter_cumulus_garage_power`).
- **Tarif HC (EDF, nord de la France)** : une fenêtre de midi (12:09 à 14:09) et une fenêtre de nuit. L'électricité y est moins chère — c'est là que les cumulus doivent chauffer.
- **Solaire** : 12 panneaux, 3 micro-onduleurs APS DS3, **pas de batterie**. Les cumulus sont la seule charge élastique assez grosse pour absorber le surplus.
- **La tension** : la fenêtre HC de midi (12:00-14:00) est le seul moment où HC et solaire se recouvrent. Tout le reste est planification plus surveillance.

---

## Récap v1 (la version courte)

La version 2022 était simple et efficace :
1. **Planification** — `automation.cumulus_cave_actives_en_hc` allume les cumulus à l'ouverture de la fenêtre HC (12:09 cave, 13:00 garage, toujours live aujourd'hui).
2. **Détection de vacances** — on ne chauffe pas quand le toggle `input_boolean.vacation` est activé.
3. **Complément de nuit** — un cycle fixe de 2 h le soir si la fenêtre du jour « n'a probablement pas suffi ».

La faiblesse, c'était l'étape 3 : « probablement » est un pari. Les anciennes automatisations `set_heating_incomplete_flag_cave` / `set_heating_incomplete_flag_garage` se déclenchaient à 14:09 et mettaient le flag `water_heating_incomplete_*` à on dès que le cumulus tirait encore du courant à cet instant. Ça ne dit rien de l'état réel du ballon — un cumulus peut être presque fini ou à peine démarré, le comportement est le même. Cette approximation a été acceptable 4 ans, mais une fois le solaire en jeu, elle a commencé à coûter de l'argent. Alors cet été j'ai remplacé les devinettes par le thermostat du ballon lui-même.

---

## Nouveau en v2 — 1. Détection de fin de chauffe par thermostat

Le changement le plus important. Au lieu de deviner à 14:09, les automatisations **surveillent la puissance consommée** et laissent le thermostat du cumulus déclarer la fin du cycle : quand le ballon atteint sa température cible, la puissance retombe à zéro.

Voici `cumulus_cave_thermostat_complete` (la jumelle du garage, `cumulus_garage_thermostat_complete`, est identique à part les entity_id) :

```yaml
- id: cumulus_cave_thermostat_complete
  alias: "Cumulus Cave - Detection thermostatique fin de chauffe"
  mode: parallel
  max_exceeded: silent
  triggers:
  - trigger: numeric_state
    entity_id: sensor.energy_meter_cumulus_cave_power
    below: 50
    for: 00:05:00
  - trigger: state
    entity_id: sensor.energy_meter_cumulus_cave_power
    to: 'unavailable'
    for: 00:10:00
  conditions: []
  actions:
  - action: switch.turn_off
    target:
      entity_id: switch.shellyplus1_a8032abcd060_switch_0
  - action: input_boolean.turn_off
    target:
      entity_id: input_boolean.water_heating_incomplete_cave
  - action: input_boolean.turn_off
    target:
      entity_id: input_boolean.water_heating_solar_extend_cave
  - action: notify.notify
    data:
      title: "Chauffe Eau Cave"
      message: "Cycle termine (thermostat). ON cumule aujourd'hui: {{ states('sensor.cumulus_cave_daily_on_time') }}h"
```

Ce que fait chaque trigger :

- **`power < 50 W` pendant 5 minutes** — le thermostat a coupé. Le relais est ouvert, le flag « incomplet » et le flag « prolongation solaire » sont effacés, et une notification confirme que le cycle est réellement terminé.
- **`power` devient `unavailable` pendant 10 minutes** — la pince ne remonte plus de données. Il s'agit d'une soupape de sécurité : on termine proprement au lieu d'attendre toute la nuit.

Les anciennes automatisations heuristiques sont maintenant **désactivées dans la config**, avec une note explicite dans leur alias :

```yaml
- id: set_heating_incomplete_flag_cave
  alias: "Set Heating Incomplete Flag - Cave [DISABLED - replaced by thermostat detection]"
  mode: single
  enabled: false
  triggers:
  - trigger: time
    at: '14:09:00'
  conditions:
  - condition: numeric_state
    entity_id: sensor.energy_meter_cumulus_cave_power
    above: 100
  actions:
  - action: input_boolean.turn_on
    target:
      entity_id: input_boolean.water_heating_incomplete_cave
```

![Puissance qui retombe à 0 W en fin de cycle de chauffe](/images/smart-water-heater-orchestration-solar-off-peak-v2/01-thermostat-detection.png)

---

## Nouveau en v2 — 2. Chauffe d'appoint en HP pilotée par le solaire

À 14:09, la fenêtre HC de midi se ferme et on bascule en **Heures Pleines (HP)** — le tarif le plus cher. Normalement les cumulus doivent rester éteints en HP. Mais quand le soleil est là et que la maison ne consomme pas grand-chose, chauffer avec l'électricité solaire en HP coûte moins cher que d'importer du réseau la nuit.

J'ai donc ajouté une deuxième paire d'automatisations cet été : un **interrupteur** qui lance un cycle HP quand il y a du surplus, et une **vigie** qui l'arrête dès que le soleil baisse ou que la maison surconsomme.

### L'interrupteur — `cumulus_cave_hp_solar_switch`

```yaml
- id: cumulus_cave_hp_solar_switch
  alias: "Cumulus Cave - Bascule HP solaire si incomplet"
  mode: single
  triggers:
  - trigger: time
    at: '14:09:00'
  conditions:
  - condition: state
    entity_id: input_boolean.water_heating_incomplete_cave
    state: 'on'
  - condition: state
    entity_id: input_boolean.vacation
    state: 'off'
  - condition: state
    entity_id: binary_sensor.solar_hi_production
    state: 'on'
  - condition: numeric_state
    entity_id: sensor.evse_10_0_0_120_house_power
    below: 1500
  - condition: template
    value_template: >
      {% set solar = states('sensor.ecu_current_power') | float(0) %}
      {% set house = states('sensor.evse_10_0_0_120_house_power') | float(0) %}
      {{ (solar - house) >= (2900 * 1.1) }}
  actions:
  - action: switch.turn_on
    target:
      entity_id: switch.shellyplus1_a8032abcd060_switch_0
  - action: input_boolean.turn_on
    target:
      entity_id: input_boolean.water_heating_solar_extend_cave
  - action: notify.notify
    data:
      title: "Chauffe Eau Cave"
      message: >-
        Reprise chauffe en HP solaire.
        Surplus: {{ ((states('sensor.ecu_current_power')|float(0) -
        states('sensor.evse_10_0_0_120_house_power')|float(0))) | round(0) }}W
```

Les conditions résument toute la stratégie :

- **`water_heating_incomplete_cave` sur on** — la fenêtre HC de midi n'a pas suffi (on ne prolonge que si nécessaire).
- **`solar_hi_production` sur on et la maison consomme moins de 1500 W** — il y a du soleil, et le reste de la maison ne le mange pas.
- **La règle de surplus** : `solar − house ≥ 2900 × 1.1`. Le cumulus de la cave tire environ 2,9 kW ; le facteur ×1.1 est ma marge de sécurité pour ne jamais importer d'électricité au tarif HP tout en prétendant utiliser du solaire. Celui du garage, ~1,1 kW, utilise `1100 * 1.1`.

Quand ces conditions sont réunies, le cumulus s'allume et le flag `water_heating_solar_extend_cave` est levé pour dire au reste du système « un cycle HP solaire est en cours ».

![Courbe de production solaire avec le cycle HP de 14:09 visible](/images/smart-water-heater-orchestration-solar-off-peak-v2/02-solar-surplus.png)

### La vigie — `cumulus_cave_hp_solar_watch`

Pendant qu'un cycle HP solaire est en cours, `cumulus_cave_hp_solar_watch` monte la garde et tranche entre deux issues : terminer proprement, ou s'arrêter et laisser le cycle de nuit prendre le relais.

```yaml
- id: cumulus_cave_hp_solar_watch
  alias: "Cumulus Cave - Veille solaire HP"
  mode: single
  max_exceeded: silent
  triggers:
  - trigger: state
    entity_id: binary_sensor.solar_hi_production
    from: 'on'
    to: 'off'
  - trigger: numeric_state
    entity_id: sensor.evse_10_0_0_120_house_power
    above: 1500
    for: 00:02:00
  - trigger: numeric_state
    entity_id: sensor.energy_meter_cumulus_cave_power
    below: 50
    for: 00:05:00
  conditions:
  - condition: state
    entity_id: input_boolean.water_heating_solar_extend_cave
    state: 'on'
  actions:
  - choose:
    - conditions:
      - condition: numeric_state
        entity_id: sensor.energy_meter_cumulus_cave_power
        below: 50
      sequence:
      - action: input_boolean.turn_off
        target:
          entity_id: input_boolean.water_heating_solar_extend_cave
      - action: input_boolean.turn_off
        target:
          entity_id: input_boolean.water_heating_incomplete_cave
      - action: switch.turn_off
        target:
          entity_id: switch.shellyplus1_a8032abcd060_switch_0
      - action: notify.notify
        data:
          title: "Chauffe Eau Cave"
          message: "Cycle HP solaire termine (thermostat)."
    sequence:
    - action: switch.turn_off
      target:
        entity_id: switch.shellyplus1_a8032abcd060_switch_0
    - action: input_boolean.turn_off
      target:
        entity_id: input_boolean.water_heating_solar_extend_cave
    - action: notify.notify
      data:
        title: "Chauffe Eau Cave"
        message: "Arret HP solaire (soleil ou maison). Cycle de nuit prevu si incomplet."
```

Trois triggers, un garde-fou :

- **Le soleil disparaît** (`solar_hi_production` on → off) — le surplus est terminé. On stoppe le cycle HP et on laisse le cycle de nuit gérer la suite.
- **Maison au-dessus de 1500 W pendant 2 minutes** — un pic (four, bouilloire). On s'arrête plutôt que d'importer au tarif HP pour chauffer l'eau.
- **Puissance sous 50 W pendant 5 minutes** — le thermostat a fini le ballon. La branche `choose` prend alors la *première* ramification : les flags sont effacés (« Cycle HP solaire terminé (thermostat) »).

Sinon (cas 1 ou 2), elle prend la seconde branche : relais ouvert, flag `solar_extend` effacé — mais, point crucial, **`incomplete` reste à on**, pour que le cycle de nuit intelligent de 02:00 sache que le travail n'est pas fini.

Le garde-fou `condition: water_heating_solar_extend_cave on` garantit que cette vigie n'intervient jamais dans un cycle HC normal ou un cycle de nuit — elle ne gère que les cycles HP solaires.

![Le garde-fou qui interrompt un cycle HP solaire quand la maison fait un pic](/images/smart-water-heater-orchestration-solar-off-peak-v2/03-watch.jpg)

---

## Nouveau en v2 — 3. Le « cycle de nuit intelligent » avec plafond

L'ancien complément de nuit faisait un cycle fixe de 2 h. Le nouveau est un cycle discipliné par `wait_for_trigger` avec un plafond dur sur les minutes :

```yaml
- id: cumulus_cave_smart_night
  alias: "Cumulus Cave - Cycle de nuit intelligent"
  mode: single
  triggers:
  - trigger: time
    at: '02:00:00'
  conditions:
  - condition: state
    entity_id: input_boolean.water_heating_incomplete_cave
    state: 'on'
  - condition: state
    entity_id: input_boolean.vacation
    state: 'off'
  - condition: state
    entity_id: input_boolean.water_heating_solar_extend_cave
    state: 'off'
  variables:
    cap_min: "{{ states('sensor.cumulus_cave_typical_heat_min') | int(90) }}"
  actions:
  - action: notify.notify
    data:
      title: "Chauffe Eau Cave"
      message: "Cycle de nuit (max {{ cap_min }}min, thermostat prioritaire)."
  - action: switch.turn_on
    target:
      entity_id: switch.shellyplus1_a8032abcd060_switch_0
  - wait_for_trigger:
    - trigger: numeric_state
      entity_id: sensor.energy_meter_cumulus_cave_power
      below: 50
      for: 00:05:00
    - trigger: state
      entity_id: sensor.energy_meter_cumulus_cave_power
      to: 'unavailable'
    timeout:
      minutes: "{{ cap_min }}"
    continue_on_timeout: true
  - action: switch.turn_off
    target:
      entity_id: switch.shellyplus1_a8032abcd060_switch_0
  - action: input_boolean.turn_off
    target:
      entity_id: input_boolean.water_heating_incomplete_cave
  - action: notify.notify
    data:
      title: "Chauffe Eau Cave"
      message: "Cycle de nuit termine (cap {{ cap_min }}min atteint ou thermostat)."
```

Le thermostat coupe le cumulus quand le ballon est prêt, donc l'automatisation attend simplement cet événement — mais elle ne laisse jamais chauffer plus que le plafond configurable. `cap_min` vient du capteur template `sensor.cumulus_cave_typical_heat_min` et de l'`input_number` correspondant (90 min cave, 60 min garage) pour régler le plafond depuis le tableau de bord sans toucher au YAML :

```yaml
# components/input_number.yaml
cumulus_cave_max_night_heat_min:
  name: Cumulus Cave - Max Night Heat (min)
  min: 30
  max: 180
  step: 5
  initial: 90
  unit_of_measurement: "min"
  icon: mdi:timer-sand
  mode: slider

# templates/sensors.yaml
- sensor:
    - unique_id: cumulus_cave_typical_heat_min
      unit_of_measurement: min
      name: "Cumulus Cave Typical Heat Duration"
      icon: mdi:timer-sand
      state: >
        {% set raw = states('input_number.cumulus_cave_max_night_heat_min') | float(90) %}
        {{ [120, [45, raw] | max] | min | round(0) }}
```

Et si des invités sont là (ou si l'on veut simplement un plein complet non bridé), la commande manuelle existe toujours : `input_boolean.force_cumulus_hc` plus l'automation `force_cumulus_nigh`, qui allume les deux cumulus à 01:24 sans tenir compte des plafonds.

```yaml
- id: force_cumulus_nigh
  alias: Forcer Cumulus la nuit
  mode: parallel
  triggers:
  - trigger: time
    at: 01:24:00
  conditions:
  - condition: and
    conditions:
    - condition: state
      entity_id: input_boolean.vacation
      state: 'off'
    - condition: state
      entity_id: input_boolean.force_cumulus_hc
      state: 'on'
  actions:
  - action: switch.turn_on
    entity_id: switch.shellyplus1_7c87ce637064_switch_0
  - action: switch.turn_on
    entity_id: switch.shellyplus1_a8032abcd060_switch_0
```

---

## Les vrais chiffres (depuis mon instance live)

Plutôt qu'un tableau marketing, voici les vraies valeurs de cet été :

| Métrique | Cave | Garage |
|---|---|---|
| Temps de chauffe sur 7 jours (moyenne) | 1,28 h/jour | 0,59 h/jour |
| Temps de chauffe sur 7 jours (médiane) | 1,15 h | 0,58 h |
| Énergie ce jour-là | 5,93 kWh | 2,33 kWh |
| Énergie totale depuis l'installation | 1181,74 kWh | 447,72 kWh |
| `typical_heat_min` (entrée) | 90 min | 60 min |

Les max sur 7 jours étaient cave 4,0 h et garage 3,15 h — les jours où le matin n'avait pas suffi et où la vigie du soir tirait long.

J'ai sorti ces chiffres de l'API des statistiques en soirée, une fois les panneaux déjà éteints (`solar_hi_production` off, `ecu_current_power` 0 W) — les valeurs « ce jour-là » décrivent donc la journée complète, pas un état en cours.

---

## Ce qui n'a pas changé

- **Le relais Shelly Plus 1 + la mesure Shelly EM** de l'[article de 2022](/smart-water-heater-with-home-assistant-and-shelly-device/) — toujours la base physique.
- **Le toggle vacances** et la **planification de la fenêtre HC** — toujours la porte d'entrée de la maison.
- **Le garage est le jumeau de la cave** : chaque automatisation décrite ici existe aussi en version `cumulus_garage_*` (`cumulus_garage_thermostat_complete`, `cumulus_garage_hp_solar_switch`, `cumulus_garage_hp_solar_watch`, `cumulus_garage_smart_night`) avec ses propres entity_id, ses seuils (le garage utilise `1100 * 1.1`) et un plafond nocturne de 60 minutes.
- **La configuration interne du chauffe-eau** (consigne de température, mode ECO du ballon) — intacte ; la couche d'automatisation ne fait que commuter le relais.

---

## Note honnête de mise en production (rappel)

Comme dit en tête : toutes les automatisations v2 de ce post sont **dans ma config et en cours de déploiement**. J'ai vérifié par API avant d'écrire que mon instance live tourne encore sur le système v1 — `automation.cumulus_cave_actives_en_hc` (déclenché aujourd'hui à 12:09), `automation.comulus_desactives_en_hp` (14:09), `automation.cumulus_garage_actives_en_hc` (13:00), plus l'ancien `set_heating_incomplete_flag_cave` qui tire encore. Les entrées `enabled: false` ci-dessus décrivent l'état de la config dans le dépôt ; le passage en production se fera une fois la paire v2 validée sur quelques jours ensoleillés et couverts. Config d'abord, live ensuite — c'est le déploiement d'une vraie maison.

---

## Avertissements

- **C'est spécifique à la France (Heures Creuses / Heures Pleines).** Une tarification avec une seule fenêtre midi + nuit n'existe pas partout ; la marge de 1,1× et le seuil 1500 W sont mes constantes, pas les vôtres.
- **Je ne suis pas électricien.** Le câblage du chauffe-eau (différentiel 30 mA, câble surdimensionné, terre) est fait par un installateur certifié ; je décris la logique Home Assistant, pas le câblage.
- **Pas encore de batterie.** S'il y en avait une, le calcul serait différent.
- **La borne VE est un projet séparé** (le capteur `house_power` est le compteur côté maison de la borne V2C, pas la consommation propre de la voiture).
- **Un gros chauffe-eau est une charge élastique clé** — traitez le chauffe-eau comme un consommateur de premier plan.

Si je devais tout refaire de zéro, la paire que je garderais à l'identique est : détection par thermostat + la logique « avorter ou finir » de la vigie. C'est ce qui a transformé une approximation oscillante en un système marginal fiable.