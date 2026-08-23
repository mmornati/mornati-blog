---
title: 'La pompe de relevage sous les projecteurs : surveiller une infrastructure invisible avec Home Assistant'
date: '2026-08-25T09:00:00.000000+00:00'
slug: monitoring-the-sump-pump-with-home-assistant
translationKey: monitoring-the-sump-pump-with-home-assistant
categories:
- Home Assistant
- Maison Connectée
- DIY
tags:
- home-assistant
- domotique
- automatisation
- eau
- diy
- alertes
description: 'La pompe de relevage évacue les eaux souterraines que personne ne voit - jusqu''à ce que la cave soit inondée. Voici comment Home Assistant a transformé la mienne en équipement surveillé : suivi des démarrages, détection d''anomalie, réactivation forcée, alertes et rapport hebdomadaire, avec le vrai YAML et les vrais chiffres.'
summary: 'Une prise Zigbee à compteur d''énergie, neuf automatisations et une pompe invisible qui protège la maison de l''inondation - le motif de l''« appareil invisible », surveillé avec Home Assistant.'
cover: cover.jpg
showHero: true
---

Ma cave a une pompe qui sauve la maison, et jusqu'à il y a quelques mois, le seul moyen de savoir qu'elle marchait encore était de tendre l'oreille. Une pompe de relevage repose dans un puisard, collecte les eaux souterraines qui s'infiltrent, et les refoule vers l'évacuation. Quand elle fonctionne, personne n'y pense. Quand elle tombe en panne — flotteur bloqué, moteur grillé, disjoncteur déclenché — l'eau monte doucement jusqu'à inonder la cave.

C'est la définition même de l'infrastructure invisible : invisible, critique, et silencieuse jusqu'à ce que ça coûte cher. Cet article raconte comment je l'ai mise sous les projecteurs avec Home Assistant — ce que je surveille, le YAML réel, et les vrais chiffres de mon instance live.

> **Note de déploiement, honnêtement.** Chaque automatisation de cet article est **branchée dans ma config, en ce moment**. J'ai extrait le YAML directement de `automations.yaml` et vérifié l'état live via l'API avant d'écrire : les neuf automatisations sont activées, et le dernier arrêt forcé date d'octobre 2025. Ce que vous voyez ci-dessous, c'est ce qui tourne aujourd'hui.

**Avertissement :** je ne suis ni plombier ni électricien. Une pompe de relevage et le drainage d'une cave, ce sont les notes de terrain d'une maison du nord de la France, pas des conseils d'installation pour la vôtre. Une pompe qui tourne à sec ou une cave inondée peut faire des dégâts ; surveillez, mais ne remplacez jamais la maintenance physique.

## TL;DR — ce qui peut casser, ce que HA fait

| Mode de panne | Ce que fait Home Assistant |
|---|---|
| Pompe qui tourne trop longtemps (flotteur coincé, refoulement obstrué) | Alerte à 2 min, alerte d'anomalie à 5 min |
| La pompe redémarre sans se réparer elle-même | 3 essais, puis **arrêt forcé** + verrouillage 24 h |
| La pompe ne redémarre plus après un arrêt forcé | Réactivation automatique après 24 h |
| La pompe n'a pas démarré depuis 48 h (flotteur coincé, panne) | Alerte « pas démarrée » toutes les 6 h |
| N'importe quel démarrage | Suivi complet : horodatages start/stop, durée, énergie |
| Semaine écoulée | Rapport du lundi : durée, énergie, dernier start/stop |

Le matériel est volontairement banal : **une prise Zigbee avec compteur d'énergie** (`friendly_name` zigbee2mqtt `pompe_cave`) sur laquelle la pompe est branchée. Pas de capteur de flotteur, pas de sonde de niveau : tout est déduit de la consommation. La pompe nous dit tout ce qu'il faut simplement par l'électricité qu'elle consomme.

---

## Pourquoi surveiller une infrastructure invisible

Le motif de « l'appareil invisible » est partout : la pompe de relevage, la pompe de circulation de votre chauffage, le congélateur du garage, l'onduleur sous le bureau. On n'y pense que quand ils s'arrêtent, et à ce moment-là le mal est déjà fait.

Pour une pompe de relevage, l'enjeu est concret. L'eau monte ; la pompe cycle ; si elle arrête de cycler, la cave est inondée en quelques heures. Une couche de surveillance ne répare pas la pompe — elle répare la *surprise*. On apprend à 14 h par une notification au lieu de 19 h les pieds dans l'eau.

Il y a une raison plus subtile : **les pompes se dégradent lentement.** Un flotteur qui devient rigide, une roue qui se cale — les symptômes apparaissent comme des *changements de cycle* bien avant une panne franche. Surveiller le cycle, c'est les attraper tôt.

---

## Le matériel : comment HA voit la pompe

La pompe est alimentée par une prise Zigbee avec compteur d'énergie. Dans Home Assistant, cela donne une grappe d'entités :

| Entité | Ce qu'elle rapporte |
|---|---|
| `sensor.pompe_cave_power_2` | Puissance instantanée en W (0 W = au repos) |
| `sensor.pompe_cave_energy_2` | Compteur d'énergie de la prise en kWh |
| `switch.pompe_cave_2` | La prise elle-même (off = la pompe n'a plus de courant) |
| `binary_sensor.pompe_cave` | Template : puissance > 5 W → `on` (la pompe tourne) |
| `sensor.pompe_cave_on_today` / `on_weekly` | `history_stats` durée de marche aujourd'hui / 7 jours |

Le binary sensor est le cœur de tout. Il transforme une lecture de puissance continue en signal on/off propre, sur lequel toutes les automatisations ci-dessous se déclenchent :

```yaml
# templates/sensors.yaml
- binary_sensor:
    - unique_id: pompe_cave_running
      name: "Pompe Cave Running"
      icon: mdi:pump
      device_class: running
      state: >
        {% set power = states('sensor.pompe_cave_power_2') %}
        {% if power in ['unavailable', 'unknown', 'none'] or power == '' %}
          {{ 'off' }}
        {% else %}
          {{ 'on' if power | float > 5.0 else 'off' }}
        {% endif %}
```

Le seuil `> 5.0 W` compte : il filtre la consommation au repos de la prise et le bruit de mesure, pour que seul un *vrai* démarrage de pompe compte comme `on`.

Deux capteurs template complètent le tableau. L'un convertit les horodatages suivis en heures depuis le dernier démarrage (999 quand jamais démarrée), l'autre calcule la durée de fonctionnement en cours en minutes :

```yaml
- sensor:
    - unique_id: pompe_cave_hours_since_last_start
      name: "Pompe Cave Hours Since Last Start"
      unit_of_measurement: h
      icon: mdi:clock-outline
      state: >
        {% set last = states('input_datetime.pompe_cave_last_started') %}
        {% if last in ['unavailable', 'unknown', 'none', ''] %}
          {{ 999 }}
        {% else %}
          {{ ((now() - as_datetime(last)) / 3600) | round(1) }}
        {% endif %}
```

---

## Les automatisations, une par une

### A. Suivi des démarrages / arrêts

Deux automatisations enregistrent chaque cycle en observant le binary sensor. Quand la pompe démarre, on estampille `input_datetime.pompe_cave_last_started` ; quand elle s'arrête, `input_datetime.pompe_cave_last_stopped` :

```yaml
- id: pompe_cave_track_start
  alias: "Pompe Cave - Suivi demarrage"
  mode: single
  triggers:
  - trigger: state
    entity_id: binary_sensor.pompe_cave
    from: 'off'
    to: 'on'
  conditions: []
  actions:
  - action: input_datetime.set_datetime
    target:
      entity_id: input_datetime.pompe_cave_last_started
    data:
      datetime: "{{ now() }}"

- id: pompe_cave_track_stop
  alias: "Pompe Cave - Suivi arret"
  mode: single
  triggers:
  - trigger: state
    entity_id: binary_sensor.pompe_cave
    from: 'on'
    to: 'off'
  conditions: []
  actions:
  - action: input_datetime.set_datetime
    target:
      entity_id: input_datetime.pompe_cave_last_stopped
    data:
      datetime: "{{ now() }}"
```

Ces deux horodatages sont la colonne vertébrale de toutes les autres automatisations — la durée de marche, l'alerte « pas démarrée » et le rapport hebdomadaire les lisent tous.

### B. Détection d'anomalie (avec essais et verrouillage)

La pompe fonctionne par salves d'environ une minute. Si elle tourne **5 minutes d'affilée**, quelque chose cloche — refoulement bouché, flotteur coincé, pompe qui lutte contre une eau qu'elle ne peut pas déplacer. C'est le cœur du système, donc l'automatisation la plus défensive :

```yaml
- id: pompe_cave_anomalie_detection
  alias: "Pompe Cave - Detection d'anomalie"
  mode: single
  max_exceeded: silent
  triggers:
  - trigger: numeric_state
    entity_id: sensor.pompe_cave_power_2
    above: 0
    for: 00:05:00
  conditions:
  - condition: state
    entity_id: switch.pompe_cave_2
    state: 'on'
  - condition: state
    entity_id: input_boolean.pompe_cave_force_disable
    state: 'off'
  actions:
  - action: notify.notify
    data:
      title: "Pompe Cave"
      message: "Pompe cave - Detection d'anomalie (5 min)."
  - action: switch.turn_off
    target:
      entity_id: switch.pompe_cave_2
  - action: input_number.increment
    target:
      entity_id: input_number.pompe_cave_retry_count
  - action: delay
    delay: 00:02:00
  - action: switch.turn_on
    target:
      entity_id: switch.pompe_cave_2
  - action: delay
    delay: 00:01:00
  - choose:
    - conditions:
      - condition: numeric_state
        entity_id: sensor.pompe_cave_power_2
        above: 0
      - condition: numeric_state
        entity_id: input_number.pompe_cave_retry_count
        above: 2
      sequence:
      - action: notify.notify
        data:
          title: "Pompe Cave"
          message: "Pompe cave - Desactivation forcee (apres 3 essais)."
      - action: switch.turn_off
        target:
          entity_id: switch.pompe_cave_2
      - action: input_boolean.turn_on
        target:
          entity_id: input_boolean.pompe_cave_force_disable
      - action: input_datetime.set_datetime
        target:
          entity_id: input_datetime.pompe_cave_last_forced_off
        data:
          datetime: "{{ now() }}"
```

La logique est une échelle de tentatives : alimenté 5 min → couper, alerter, compter un essai ; attendre 2 minutes ; réalimenter ; attendre 1 minute ; si ça **consomme encore et qu'on en est à 3 essais** → abandonner. La pompe est coupée de force, le verrouillage `pompe_cave_force_disable` est levé pour que rien ne la relance automatiquement, et l'heure de l'arrêt forcé est estampillée. Après trois essais et une marche continue de 5 minutes, la laisser tourner est plus risqué que la laisser éteinte.

C'est le moment « les moniteurs échouent différemment des humains » : une personne finirait par remarquer que la pompe ne s'arrête plus. Home Assistant s'en aperçoit au bout de 5 minutes, réagit, et nous le signale — sans qu'on soit à proximité de la cave.

### C. Réactivation forcée après 24 h

Une pompe coupée de force est protégée du surchauffe — mais une pompe désactivée, c'est aussi une *cave inondée* en préparation. Le verrouillage s'auto-expire donc après 24 heures :

```yaml
- id: pompe_cave_restart_once_a_day
  alias: "Pompe Cave - Reactivation forcee apres 24h"
  mode: single
  triggers:
  - trigger: time_pattern
    hours: '/1'
  conditions:
  - condition: state
    entity_id: input_boolean.pompe_cave_force_disable
    state: 'on'
  - condition: template
    value_template: >
      {% set last_off = as_timestamp(states('input_datetime.pompe_cave_last_forced_off')) %}
      {% set since = (now().timestamp() - last_off) | int %}
      {{ since > 86400 }}
  actions:
  - action: input_boolean.turn_off
    target:
      entity_id: input_boolean.pompe_cave_force_disable
  - action: input_number.set_value
    target:
      entity_id: input_number.pompe_cave_retry_count
    data:
      value: 0
  - action: switch.turn_on
    target:
      entity_id: switch.pompe_cave_2
```

Chaque heure, elle vérifie : le verrouillage est-il actif, et plus de 24 h se sont-elles écoulées depuis l'arrêt forcé ? Si oui, on remet les compteurs à zéro et on redonne du courant à la pompe. La pompe a droit à une seconde chance — et si le problème persiste, la détection d'anomalie la rattrape. Si le flotteur est physiquement coincé, ce test unique fait aussi office de **cycle de test manuel** : il alimente la pompe un instant, et si l'eau s'est évacuée entre-temps, le cycle se termine proprement.

### D. Alertes « pas démarrée » et « fonctionnement trop long »

Deux alertes couvrent la panne inverse : la pompe qui *aurait dû* tourner et ne l'a pas fait.

```yaml
- id: pompe_cave_alert_not_started
  alias: "Pompe Cave - Pas demarree depuis longtemps"
  mode: single
  triggers:
  - trigger: time_pattern
    hours: '/6'
  conditions:
  - condition: template
    value_template: >
      {% set last = states('input_datetime.pompe_cave_last_started') %}
      {{ last != '' and states('sensor.pompe_cave_hours_since_last_start') | float > 48 }}
  - condition: state
    entity_id: input_boolean.pompe_cave_force_disable
    state: 'off'
  actions:
  - action: notify.notify
    data:
      title: "Pompe Cave"
      message: >-
        Pompe cave pas demarree depuis longtemps.
        Dernier demarrage: {{ states('input_datetime.pompe_cave_last_started') }}.
        Heures depuis: {{ states('sensor.pompe_cave_hours_since_last_start') }}h
```

Toutes les 6 heures, si la pompe n'a pas démarré depuis plus de 48 h, une notification nous le rappelle. En saison sèche, elle peut se déclencher légitimement (ma pompe a à peine tourné pendant l'été), donc le message porte la valeur réelle « heures depuis » — c'est un rappel, pas une panique.

L'alerte jumelle se déclenche quand un cycle a *bien* lieu mais refuse de se terminer :

```yaml
- id: pompe_cave_alert_running_too_long
  alias: "Pompe Cave - Fonctionnement prolonge"
  mode: single
  max_exceeded: silent
  triggers:
  - trigger: numeric_state
    entity_id: sensor.pompe_cave_power_2
    above: 0
    for: 00:10:00
  conditions:
  - condition: state
    entity_id: binary_sensor.pompe_cave
    state: 'on'
  - condition: state
    entity_id: input_boolean.pompe_cave_force_disable
    state: 'off'
  actions:
  - action: notify.notify
    data:
      title: "Pompe Cave"
      message: >-
        Pompe cave - Fonctionnement prolonge (10 min).
        Puissance: {{ states('sensor.pompe_cave_power_2') }}W.
        Duree: {{ states('sensor.pompe_cave_current_runtime_minutes') }}min
```

Une marche continue de 10 minutes dépasse tout ce dont une pompe saine a besoin — l'alerte est le dernier mot avant (ou en parallèle de) l'échelle d'anomalie, et elle inclut la puissance live pour distinguer une pompe à pleine charge d'une pompe en difficulté.

Il y a aussi un premier étage plus doux, `notify_pompe_cave_problem`, qui lève un avertissement à la barre des 2 minutes — un signal que la pompe tourne longtemps, avant que l'escalade à 5 minutes ne prenne le relais.

### E. Le rapport hebdomadaire

Chaque lundi à 08:00, une notification résume la semaine — durée de marche, énergie, dernière activité :

```yaml
- id: pompe_cave_weekly_report
  alias: "Pompe Cave - Rapport Hebdomadaire"
  mode: single
  triggers:
  - trigger: time
    at: '08:00:00'
  conditions:
  - condition: time
    weekday:
    - mon
  actions:
  - action: notify.notify
    data:
      title: "Pompe Cave"
      message: >-
        Rapport hebdomadaire pompe cave.
        ON cette semaine: {{ states('sensor.pompe_cave_on_weekly') }}h.
        ON aujourd'hui: {{ states('sensor.pompe_cave_on_today') }}h.
        Energie: {{ states('sensor.pompe_cave_energy_2') }} kWh.
        Dernier demarrage: {{ states('input_datetime.pompe_cave_last_started') }}.
        Dernier arret: {{ states('input_datetime.pompe_cave_last_stopped') }}.
        Heures depuis demarrage: {{ states('sensor.pompe_cave_hours_since_last_start') }}h
```

Le rapport, c'est là que le « surveiller le motif » prend tout son sens : les semaines où la durée de marche augmente soudain, ou un cycle qui ne s'arrête jamais, sautent aux yeux en un coup d'œil. Un flotteur qui se rigidifie lentement apparaît comme une tendance hebdomadaire avant de devenir une vraie panne.

### Le soutien : les entrées

Plusieurs helpers `input_*` soutiennent ces automatisations. Le plus important est le toggle de verrouillage :

```yaml
# components/input_boolean.yaml
pompe_cave_force_disable:
  name: "Pompe Cave Forcee Off"
  icon: mdi:power-off
  initial: false

# components/input_number.yaml
pompe_cave_retry_count:
  name: "Pompe Cave Retry Count"
  min: 0
  max: 5
  step: 1
  initial: 0
```

Plus trois helpers `input_datetime` (`pompe_cave_last_started`, `pompe_cave_last_stopped`, `pompe_cave_last_forced_off`) que les automatisations de suivi et d'alerte lisent et écrivent.

---

## Les vrais chiffres (de mon instance live)

Je les ai tirés directement de l'API de statistiques en écrivant cet article — un jour d'été sec, donc la valeur d'aujourd'hui est le genre de zéro intéressant :

| Métrique | Valeur |
|---|---|
| Temps de marche aujourd'hui | 0,0 h (journée d'été sèche) |
| Temps de marche 7 derniers jours | 0,55 h au total |
| Marche/jour, 90 derniers jours (moyenne) | ~0,13 h (~8 min/jour) |
| Marche/jour, 90 derniers jours (médiane) | 0,135 h |
| Marche/jour, 90 derniers jours (max) | 0,28 h |
| Marche/semaine, 90 derniers jours (moyenne) | 0,35 h |
| Énergie totale, compteur de la prise | 67,78 kWh |
| Dernier cycle | 2026-08-22 18:20:55 → 18:21:05 (~10 s) |
| Heures depuis le dernier démarrage | 3,2 h |
| Dernier arrêt forcé | 2025-10-14 18:46:48 |

Deux choses ressortent. D'abord, **les cycles types sont courts** — le 2026-08-16, le logbook montre des cycles de 1 min 06 s, 8 s et 1 min 15 s : la pompe travaille par micro-salves au fil des infiltrations. C'est exactement pourquoi le seuil d'anomalie à 5 minutes marche : un cycle sain ne s'en approche jamais. Ensuite, **les étés secs sont calmes** — ~8 minutes de pompe par jour en moyenne sur 90 jours, et quasi zéro un jour d'été. L'alerte « pas démarrée en 48 h » doit tolérer ça, ce qui explique pourquoi elle rapporte les heures écoulées au lieu de simplement alarmer.

L'arrêt forcé d'octobre 2025 mérite une mention : c'est l'échelle d'anomalie qui fait son travail, une fois, pendant une période hivernale humide — et le système s'est auto-rétabli via la réactivation des 24 h.

---

## Leçons et compromis

- **Les faux positifs sont le vrai risque.** Chaque seuil choisi (5 W, 2 min, 5 min, 48 h) l'a été pour se situer bien au-dessus du cycle normal, pour que les alertes soient rares et signifiantes. La période calme de l'été a presque garanti que l'alerte « pas démarrée » sonne innocemment — elle porte donc du contexte au lieu de crier au loup.
- **Les temps de refroidissement comptent.** Les délais de 2 minutes/1 minute de l'échelle d'anomalie existent pour que la pompe ne soit pas secouée on/off par les automatisations elles-mêmes. Sans eux, le moniteur *créerait* les pannes qu'il surveille.
- **Il faut des attentes différentes selon les périodes sèches et humides.** En période sèche, la pompe peut ne pas tourner pendant des jours — normal. En période humide, elle tourne en continu — normal aussi. Seuls les *changements* par rapport au motif établi sont suspects.
- **La prise est le capteur pas cher.** Une prise Zigbee à compteur d'énergie coûte quelques dizaines d'euros et ne demande aucun travail de plomberie. Le flotteur et le moteur existent déjà — on écoute simplement le seul signal qu'ils produisent déjà.

---

## Généraliser : un modèle pour tout appareil caché

Rien ici n'est spécifique à la pompe. Le même squelette — une consommation, un binary sensor on/off qui en découle, un suivi start/stop, une échelle d'anomalie avec verrouillage, une alerte « n'a pas tourné », et un rapport périodique — s'applique directement à :

- **Pompe de relevage / de levage** — même logique, à peu près les mêmes seuils.
- **Pompe de circulation de chauffage** — suivre la durée, alerter sur l'absence de cycles en hiver.
- **Congélateur / réfrigérateur** — alerter si le compresseur n'a pas cyclé depuis des heures.
- **Onduleur (UPS)** — alerter sur l'âge de la batterie, les passages sur batterie, ou une charge qui change.
- **Tout appareil qu'on ne remarque que quand il s'arrête.**

La recette réutilisable : *dériver un binary sensor « fait-il son travail » de la puissance, suivre les horodatages start/stop, construire une échelle d'essais avec verrouillage pour « tourne mais ne répare pas », alerter sur « aurait dû tourner et n'a pas tourné », et résumer chaque semaine.* Cela couvre la grande majorité des pannes d'infrastructure cachée.

---

## Avertissements

- **Notes de terrain, pas conseils.** Ce sont mes seuils, pour ma pompe, dans ma cave, dans le nord de la France. Votre pompe, votre nappe phréatique, votre installation électrique sont différentes.
- **Je ne suis ni plombier ni électricien.** Le côté physique — la pompe, le puisard, la ligne de refoulement — est installé et entretenu par des professionnels ; je décris la couche de surveillance, pas la plomberie.
- **Surveiller n'est pas entretenir.** Aucune automatisation ne remplace le contrôle annuel, le test du flotteur ou le nettoyage du puisard. Ce que HA vous achète, c'est du *temps* : la détection précoce au lieu de la surprise.
- **Zigbee est un maillage, et les maillages perdent des nœuds.** Mon logbook montre un passage `unavailable` sur la prise le 2026-08-16 (un hoquet Zigbee, pas une panne de pompe). Les alertes doivent être conçues autour d'un capteur temporairement aveugle, pas seulement autour des pannes de pompe.

Si je devais reconstruire tout ça de zéro, je garderais le même noyau : une prise à compteur d'énergie, un binary sensor dérivé, et l'échelle d'essais avec verrouillage. Ce trio a transformé une pompe invisible en un appareil qui a un pouls — et une cave à laquelle je n'ai pas à penser tant que quelque chose ne mérite vraiment d'y penser.