---
title: 'Home Assistant : Contrôle des Volets selon la Température - 3 Ans Après'
tags:
- automatisation
- météo
- home-assistant
- cover
- maison-intelligente
date: '2026-08-16T09:00:00.000000+00:00'
slug: homeassistant-close-cover-to-control-the-home-temperature-v2
categories:
- Maison Intelligente
- DIY
- Home Assistant
description: Comment j'ai fait évoluer mon automatisation de volets basée sur la température en un système multi-zones avec capteurs moyennés et réouverture automatique.
cover: cover.jpg
---

Il y a trois ans, j'avais publié une [automatisation simple](/homeassistant-close-cover-to-control-the-home-temperature/) pour fermer mes volets en fonction des relevés de température. Ça fonctionnait bien, mais après plus de 3 ans d'utilisation, j'ai considérablement amélioré le système. Laissez-moi vous montrer ce qui a changé et pourquoi.

## Quoi de Neuf ?

La version originale avait une seule automatisation contrôlant 5 volets l'après-midi. Le nouveau système :

- **3 zones** au lieu de 1 (rez-de-chaussée, bureau, premier étage)
- **Capteurs de température moyennés** au lieu de relevés uniques
- **Réouverture automatique** le soir
- **Exécution optimisée** (10 minutes au lieu de 5)
- **6 automatisations** au total (3 fermetures + 3 ouvertures)

## Les Capteurs de Température

L'amélioration clé est l'utilisation de capteurs moyennés au lieu de s'appuyer sur des relevés de température uniques. J'utilise la plateforme `min_max` de Home Assistant avec le type `mean` :

```yaml
# components/sensors.yaml
- platform: min_max
  name: average_temperature_external
  type: mean
  round_digits: 1
  entity_ids:
    - sensor.motion_externe_patio_temperature
    - sensor.motion_externe_salon_temperature
    - sensor.motion_externe_chambre_temperature
    - sensor.motion_externe_entree_temperature_2
    - sensor.motion_externe_bureau_temperature_2
    - sensor.netatmo_external_temperature

- platform: min_max
  name: average_temperature_ground_floor
  type: mean
  round_digits: 1
  entity_ids:
    - sensor.temperature_sensor_salon_temperature_2
    - sensor.temperature_sensor_salle_manger_temperature_2
    - sensor.temperature_sensor_cuisine_temperature_2
    - sensor.temperature_sensor_bureau_temperature_2
    - sensor.netatmo_weather_station_temperature
    - sensor.temperature_sensor_salle_bain_parents_temperature_2

- platform: min_max
  name: average_temperature_first_floor
  type: mean
  round_digits: 1
  entity_ids:
    - sensor.temperature_sensor_chambre_gaia_temperature_2
    - sensor.temperature_sensor_chambre_bastien_temperature_2
    - sensor.temperature_sensor_bibliotheque_temperature_2
    - sensor.temperature_sensor_salle_bain_etage_temperature_2
```

Cette approche est plus robuste car :
- Les pannes de capteurs uniques ne cassent pas l'automatisation
- Les variations de température entre les pièces sont moyennées
- Une représentation plus précise des conditions réelles

## Zone 1 : Volets du Rez-de-Chaussée

### Automatisation de Fermeture

```yaml
- id: cover_closes_weather
  alias: Close cover based on afternoon temperature
  triggers:
  - trigger: time_pattern
    minutes: /10
  conditions:
  - condition: time
    alias: Time 12~18
    after: '12:00:00'
    before: '18:00:00'
  - condition: or
    conditions:
    - condition: template
      value_template: '{{ states.automation.close_cover_based_on_afternoon_temperature.attributes.last_triggered == none }}'
    - condition: template
      value_template: '{{ ( as_timestamp(now()) - as_timestamp(state_attr(''automation.close_cover_based_on_afternoon_temperature'', ''last_triggered'')) |int(0)) > 28800 }}'
  - condition: template
    value_template: '{{ states.sensor.average_temperature_external.state|float > states.sensor.average_temperature_ground_floor.state|float + 2 }}'
  - condition: numeric_state
    entity_id: sensor.temperature_sensor_salon_temperature_2
    above: 20
  actions:
  - action: cover.set_cover_position
    data:
      entity_id:
      - cover.salon_n1
      - cover.salon_n2
      - cover.salon_n3
      - cover.salon_n4
      - cover.chambre_jardin
      position: 40
```

**Points clés :**
- Exécution toutes les 10 minutes (était 5)
- Fenêtre horaire : 12h00-18h00 (était 12h30-18h00)
- La température externe doit être 2°C plus chaude que l'interne
- La température interne doit être supérieure à 20°C
- Volets à 40% (pas complètement fermés)

### Automatisation d'Ouverture

```yaml
- id: open_cover_when_weather_closed
  alias: Open cover when automatically closed
  triggers:
  - trigger: time_pattern
    minutes: /10
  conditions:
  - condition: time
    alias: Time 19h00~20
    after: '19:00:00'
    before: '20:00:00'
  - condition: or
    conditions:
    - condition: template
      value_template: '{{ states.automation.open_cover_when_automatically_closed.attributes.last_triggered == none }}'
    - condition: template
      value_template: '{{ ( as_timestamp(now()) - as_timestamp(state_attr(''automation.open_cover_when_automatically_closed'', ''last_triggered'')) |int(0)) > 28800 }}'
  - condition: template
    value_template: '{{ ( as_timestamp(now()) - as_timestamp(state_attr(''automation.close_cover_based_on_afternoon_temperature'', ''last_triggered'')) |int(0)) < 28800 }}'
  actions:
  - action: cover.open_cover
    data:
      entity_id:
      - cover.salon_n1
      - cover.salon_n2
      - cover.salon_n3
      - cover.salon_n4
      - cover.chambre_jardin
```

Cette automatisation rouvre les volets le soir (19h00-20h00) s'ils ont été fermés par l'automatisation de température pendant la journée.

## Zone 2 : Volets du Bureau

### Automatisation de Fermeture

```yaml
- id: cover_bureau_closes_weather
  alias: Close Bureau Cover based on temperature
  triggers:
  - trigger: time_pattern
    minutes: /10
  conditions:
  - condition: time
    alias: Time 8~13
    after: 08:00:00
    before: '13:00:00'
  - condition: or
    conditions:
    - condition: template
      value_template: '{{ states.automation.close_bureau_cover_based_on_temperature.attributes.last_triggered == none }}'
    - condition: template
      value_template: '{{ ( as_timestamp(now()) - as_timestamp(state_attr(''automation.close_bureau_cover_based_on_temperature'', ''last_triggered'')) |int(0)) > 28800 }}'
  - condition: template
    value_template: '{{ (states.sensor.motion_externe_entree_temperature_2.state|float + states.sensor.motion_externe_bureau_temperature_2.state|float)/2 > states.sensor.temperature_sensor_bureau_temperature_2.state|float }}'
  - condition: numeric_state
    entity_id: sensor.temperature_sensor_bureau_temperature_2
    above: 20
  actions:
  - action: cover.set_cover_position
    data:
      entity_id:
      - cover.bureau_jardin
      position: 40
```

**Différences clés avec le rez-de-chaussée :**
- Fenêtre horaire : 08h00-13h00 (exposition matinale)
- Moyenne de 2 capteurs externes au lieu de 6
- Pas de différentiel de 2°C nécessaire (juste externe > interne)

### Automatisation d'Ouverture

```yaml
- id: open_bureau_cover_when_weather_closed
  alias: Open Bureau cover when automatically closed
  triggers:
  - trigger: time_pattern
    minutes: /5
  conditions:
  - condition: time
    alias: Time 14h00~14h30
    after: '14:00:00'
    before: '14:30:00'
  - condition: or
    conditions:
    - condition: template
      value_template: '{{ states.automation.open_bureau_cover_when_automatically_closed.attributes.last_triggered == none }}'
    - condition: template
      value_template: '{{ ( as_timestamp(now()) - as_timestamp(state_attr(''automation.open_bureau_cover_when_automatically_closed'', ''last_triggered'')) |int(0)) > 28800 }}'
  - condition: template
    value_template: '{{ ( as_timestamp(now()) - as_timestamp(state_attr(''automation.close_bureau_cover_based_on_temperature'', ''last_triggered'')) |int(0)) < 28800 }}'
  actions:
  - action: cover.open_cover
    data:
      entity_id:
      - cover.bureau_jardin
```

Le volet du bureau s'ouvre brièvement à 14h00-14h30 car le soleil s'est éloigné de cette fenêtre.

## Zone 3 : Volets Velux du Premier Étage

### Automatisation de Fermeture

```yaml
- id: cover_floor_weather
  alias: Close first floor covers based on afternoon temperature
  triggers:
  - trigger: time_pattern
    minutes: /10
  conditions:
  - condition: time
    alias: Time 12~18
    after: '11:00:00'
    before: '18:00:00'
  - condition: or
    conditions:
    - condition: template
      value_template: '{{ states.automation.close_first_floor_covers_based_on_afternoon_temperature.attributes.last_triggered == none }}'
    - condition: template
      value_template: '{{ ( as_timestamp(now()) - as_timestamp(state_attr(''automation.close_first_floor_covers_based_on_afternoon_temperature'', ''last_triggered'')) |int(0)) > 28800 }}'
  - condition: template
    value_template: '{{ states.sensor.average_temperature_external.state|float > states.sensor.average_temperature_first_floor.state|float }}'
  actions:
  - action: cover.close_cover
    data:
      entity_id:
      - cover.velux_gaia_jardin_roller_shutter
      - cover.velux_bastien_jardin_roller_shutter
      - cover.velux_biblioteque_roller_shutter
```

**Différences clés :**
- Fenêtre horaire : 11h00-18h00 (commence plus tôt à cause de l'expositiontoiture)
- Pas de différentiel de 2°C (les fenêtres de toit chauffent plus vite)
- Volets complètement fermés (pas 40%)
- Contrôle des fenêtres de toit Velux

### Automatisation d'Ouverture

```yaml
- id: open_floor_when_weather_closed
  alias: Open first floor covers when automatically closed
  triggers:
  - trigger: time_pattern
    minutes: /10
  conditions:
  - condition: time
    alias: Time 19h00~20
    after: '19:00:00'
    before: '20:00:00'
  - condition: or
    conditions:
    - condition: template
      value_template: '{{ states.automation.open_first_floor_covers_when_automatically_closed.attributes.last_triggered == none }}'
    - condition: template
      value_template: '{{ ( as_timestamp(now()) - as_timestamp(state_attr(''automation.open_first_floor_covers_when_automatically_closed'', ''last_triggered'')) |int(0)) > 28800 }}'
  - condition: template
    value_template: '{{ ( as_timestamp(now()) - as_timestamp(state_attr(''automation.close_first_floor_covers_based_on_afternoon_temperature'', ''last_triggered'')) |int(0)) < 28800 }}'
  actions:
  - action: cover.open_cover
    data:
      entity_id:
      - cover.velux_gaia_jardin_roller_shutter
      - cover.velux_bastien_jardin_roller_shutter
      - cover.velux_biblioteque_roller_shutter
```

## La Condition "Déjà Exécuté"

Toutes les automatisations utilisent ce pattern pour éviter les exécutions multiples par jour :

```yaml
- condition: or
  conditions:
  - condition: template
    value_template: '{{ states.automation.VOTRE_AUTOMATISATION_ID.attributes.last_triggered == none }}'
  - condition: template
    value_template: '{{ ( as_timestamp(now()) - as_timestamp(state_attr(''automation.VOTRE_AUTOMATISATION_ID'', ''last_triggered'')) |int(0)) > 28800 }}'
```

Cela vérifie si :
1. L'automatisation n'a jamais été déclenchée (première exécution), OU
2. Le dernier déclenchement date de plus de 8 heures (28800 secondes)

Pourquoi 8 heures ? Ça empêche la ré-exécution dans la même plage horaire tout en permettant l'exécution le lendemain.

## Leçons Apprises Après 3 Ans

1. **Les capteurs moyennés sont plus fiables** - Les pannes de capteurs uniques ne cassent pas le système
2. **Les zones multiples sont importantes** - Différentes expositions需要不同的计时
3. **La réouverture automatique est essentielle** - Les volets ne doivent pas rester fermés toute la nuit
4. **Les intervalles de 10 minutes suffisent** - 5 minutes était excessif
5. **Le différentiel de 2°C fonctionne bien** - Prévient les déclenchements par temps nuageux
6. **Les Velux ont besoin d'un traitement spécial** - Les fenêtres de toit chauffent plus vite et nécessitent une fermeture complète

## Et Ensuite ?

Le post original mentionnait l'ajout de capteurs d'intensité lumineuse (lux) pour empêcher la fermeture des volets quand il fait nuageux mais chaud. J'ai implémenté ceci dans mes automatisations d'éclairage externe et prévois de l'intégrer ici aussi.

Restez à l'écoute pour la prochaine mise à jour !

---

**Articles connexes :**
- [Article original (2023)](/homeassistant-close-cover-to-control-the-home-temperature/)
- [Home Assistant : Capteur de Mouvement Couplé à un Interrupteur](/home-assistant-motion-sensor-coupled-with-a-switch/)
- [Automatisez Votre Maison en Continu avec les Appareils Hitachi](/seamlessly-automate-your-home-with-hitachi-devices-a-custom-home-assistant-integration/)
