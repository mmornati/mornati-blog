---
title: 'HomeAssistant : Fermer les volets pour contrôler la température intérieure'
tags:
- automation
- weather
- home-assistant
- cover
date: '2023-01-01T09:00:42.310000+00:00'
slug: homeassistant-close-cover-to-control-the-home-temperature
categories:
- Smart Home
- DIY
- Home Assistant
description: Améliorez l'efficacité énergétique en fermant automatiquement les volets en fonction des températures intérieure et extérieure.
---

Aujourd'hui, je vais vous montrer un script simple pour améliorer l'efficacité énergétique de votre maison en régulant la température intérieure en fonction des valeurs extérieures.  
C'est la première version simple basée sur un seul point de température. J'ai une nouvelle version prête à tester, mais je dois attendre des jours plus chauds 😅

**De quoi avez-vous besoin ?**  
\* Des volets automatiques / contrôlés par Home Assistant  
\* Un (ou plusieurs) capteurs de température  
\* et bien sûr, une ou plusieurs fenêtres exposées au soleil 😉

### **Le déclencheur**

Comme pour le script de simulation de présence, j'utilise un déclencheur `time_pattern` car je veux vérifier constamment les conditions pendant une période donnée.  
Une alternative pour réduire les exécutions est un [multi-déclencheur](https://www.home-assistant.io/docs/automation/trigger/#multiple-triggers) : lorsque l'un des déclencheurs est validé, l'automatisation démarre. Je couvrirai cela à la fin.

```yaml
trigger:
  - platform: time_pattern
    minutes: "/5"
```

L'automatisation s'exécute toutes les 5 minutes.

### **Les conditions**

Voici les conditions pour s'assurer que nous fermons les volets au bon moment.

```yaml
condition:
    - condition: time
      alias: "Time 13~20"
      after: "12:30:00"
      before: "18:00:00"
    - condition: or
      conditions:
        - condition: template
          # If automation was never triggered
          value_template: "{{ states.automation.close_cover_based_on_afternoon_temperature.attributes.last_triggered == none }}"
        - condition: template
          # If automation not played in the last 8 hours (means played only the day before)
          value_template: "{{ ( as_timestamp(now()) - as_timestamp(state_attr('automation.close_cover_based_on_afternoon_temperature', 'last_triggered')) |int(0)) > 28800 }}"
    - condition: template
      value_template: "{{ states.sensor.netatmo_maison_willems_indoor_namodule1_temperature.state|float > states.sensor.capteur_mouvement_salon_temperature.state|float + 2 }}"
    - condition: numeric_state
      entity_id: sensor.capteur_mouvement_salon_temperature
      above: 20
```

**Temps**  
Les volets que je veux contrôler sont orientés au sud, donc je n'exécute l'automatisation que l'après-midi lorsque le soleil est directement face aux fenêtres : `after: "12:30:00" before: "18:00:00"`

**Pas déjà exécuté**

```yaml
- condition: or
      conditions:
        - condition: template
          # If automation was never triggered
          value_template: "{{ states.automation.close_cover_based_on_afternoon_temperature.attributes.last_triggered == none }}"
        - condition: template
          # If automation not played in the last 8 hours (means played only the day before)
          value_template: "{{ ( as_timestamp(now()) - as_timestamp(state_attr('automation.close_cover_based_on_afternoon_temperature', 'last_triggered')) |int(0)) > 28800 }}"
```

Cette partie — je sais qu'elle semble complexe — vérifie si l'automatisation s'est déjà déclenchée (jusqu'à cette exécution) **ou** n'a jamais été exécutée (nécessaire pour la première exécution ou lorsque la dernière exécution remonte à si longtemps que les données historiques ont été supprimées).  
Nous utilisons la propriété `last_triggered`, en vérifiant si elle est `none` ou si la dernière exécution date de plus de **8 heures**. Pourquoi 8 heures ? Il suffit simplement d'empêcher une ré-exécution dans la même plage horaire (12h30-18h00) tout en permettant son exécution le lendemain (18h00-12h30). 8 heures couvre les deux : plus de 6,5 heures (18h00-12h30) et moins de 18,5 heures (12h30-18h00).

**Température**

```yaml
    - condition: template
      value_template: "{{ states.sensor.netatmo_maison_willems_indoor_namodule1_temperature.state|float > states.sensor.capteur_mouvement_salon_temperature.state|float + 2 }}"
    - condition: numeric_state
      entity_id: sensor.capteur_mouvement_salon_temperature
      above: 20
```

Les deux autres conditions vérifient la température intérieure et extérieure.  
La deuxième condition vérifie la température dans la pièce avec les volets — elle doit être **supérieure** à 20°C.  
La condition suivante vérifie la différence : l'extérieur doit être au moins 2°C plus chaud que l'intérieur.  
\* `states.sensor.netatmo_maison_willems_indoor_namodule1_temperature.state|float` module extérieur  
\* `states.sensor.capteur_mouvement_salon_temperature.state|float + 2` module intérieur + 2 degrés.

### L'action

Si toutes les conditions sont remplies, les volets se ferment.

```yaml
  action:
    - service: cover.set_cover_position
      data:
        entity_id:
          - cover.salon_n1_6
          - cover.salon_n2
          - cover.salon_n3_12
          - cover.salon_n4_14
          - cover.chambre_jardin_3
        position: 40
```

Tous les volets que je veux contrôler sont réglés à 40%. Pas complètement fermés, mais suffisamment pour réduire la lumière du soleil entrant dans la pièce.  
J'ai ajouté un autre volet d'une autre pièce sans créer d'action séparée — l'exposition est la même.

Si nous rassemblons tout, le script est le suivant :

```yaml
- id: cover_closes_weather
  alias: "Close cover based on afternoon temperature"
  trigger:
    - platform: time_pattern
      minutes: "/5"
  condition:
    - condition: time
      alias: "Time 13~20"
      after: "12:30:00"
      before: "18:00:00"
    - condition: or
      conditions:
        - condition: template
          # If automation was never triggered
          value_template: "{{ states.automation.close_cover_based_on_afternoon_temperature.attributes.last_triggered == none }}"
        - condition: template
          # If automation not played in the last 8 hours (means played only the day before)
          value_template: "{{ ( as_timestamp(now()) - as_timestamp(state_attr('automation.close_cover_based_on_afternoon_temperature', 'last_triggered')) |int(0)) > 28800 }}"
    - condition: template
      value_template: "{{ states.sensor.netatmo_maison_willems_indoor_namodule1_temperature.state|float > states.sensor.capteur_mouvement_salon_temperature.state|float + 2 }}"
    - condition: numeric_state
      entity_id: sensor.capteur_mouvement_salon_temperature
      above: 20
  action:
    - service: cover.set_cover_position
      data:
        entity_id:
          - cover.salon_n1_6
          - cover.salon_n2
          - cover.salon_n3_12
          - cover.salon_n4_14
          - cover.chambre_jardin_3
        position: 40
```

Je l'utilise depuis 2 ans et cela fait une grande différence dans la façon dont la température se ressent. C'est un game changer pour moi.

### **Différents déclencheurs pour réduire le nombre d'exécutions**

Comme je l'ai dit précédemment, nous pouvons utiliser un déclencheur différent au lieu de `time_pattern` pour réduire les exécutions. Même sans déclencher l'action, la vérification des conditions utilise un peu de CPU.

En regardant notre automatisation, le vrai déclencheur est la température : l'extérieur est supérieur de plus de 2 degrés à l'intérieur et l'intérieur est supérieur à 20 degrés.  
Un exemple de ce que nous pouvons changer :

```yaml
automation:
  trigger:
    - platform: template
      value_template: "{{ states.sensor.netatmo_maison_willems_indoor_namodule1_temperature.state|float > states.sensor.capteur_mouvement_salon_temperature.state|float + 2 }}"
      for:
        minutes: 5
```

Ceci se déclenche en fonction de la condition extérieur vs intérieur, et nous vérifions si la valeur reste vraie pendant au moins 5 minutes.  
Nous pourrions ajouter un deuxième déclencheur pour la température intérieure, mais les déclencheurs utilisent la logique **OR** : si l'un est vrai, l'action s'exécute (bien que les conditions puissent l'empêcher).

```yaml
    - platform: numeric_state
      entity_id: sensor.capteur_mouvement_salon_temperature
      above: 20
```

C'est à vous de décider du meilleur déclencheur et du nombre de fausses exécutions que vous êtes prêt à accepter.

### Amélioration future

C'est la version que j'ai utilisée jusqu'à présent, mais elle s'est parfois déclenchée incorrectement. Comme elle est basée sur la température, les conditions estivales peuvent être réunies même lorsqu'il pleut dehors. Dans ces conditions, la température intérieure ne monte pas parce que le soleil ne passe pas par les fenêtres.  
À la fin de l'été, j'ai installé des détecteurs de mouvement externes pour ajouter un nouveau paramètre : *l'intensité lumineuse.*

![](/images/homeassistant-close-cover-to-control-the-home-temperature/00-cdc0b1d4-5e15-42de-8b35-c96978aba0a0.png)

J'ai ajouté un test pour le paramètre *lux*, que j'utilise déjà pour les lumières extérieures.  
Mais c'est une autre histoire 😎
