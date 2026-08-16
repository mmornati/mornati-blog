---
title: 'Home Assistant : Capteur de mouvement couplé à un interrupteur'
tags:
- automation
- home-assistant
- motion-sensor
date: '2023-01-02T07:00:42.411000+00:00'
slug: home-assistant-motion-sensor-coupled-with-a-switch
categories:
- Smart Home
- DIY
- Home Assistant
description: Utilisez un capteur de mouvement et un input boolean pour empêcher les lumières extérieures de s'éteindre lorsqu'elles sont allumées manuellement.
---

Vous êtes-vous déjà agité les bras devant un capteur de mouvement pour allumer votre lumière extérieure pendant que vous dîniez sur la terrasse ? Cela m'arrivait tout le temps et c'était vraiment frustrant... alors j'ai créé une automatisation pour résoudre ce problème ! 😎

**De quoi avez-vous besoin ?**

* Une ampoule connectée (ou équivalent pour contrôler une ampoule)
    
* Un capteur de mouvement intelligent
    
* Un `input_boolean` pour vérifier la façon dont la lumière est alimentée
    

## **Input Boolean**

Rien de spécial ici, vous avez juste besoin de le mettre dans votre fichier `input_boolean.yaml` ou directement dans `configuration.yaml`, selon comment vous gérez votre configuration HassIO.  
Pour simplifier, je l'ai mis dans mon fichier de configuration global : `input_boolean: !include components/input_boolean.yaml`

```yaml
input_boolean: !include components/input_boolean.yaml
```

Cela vous permet de garder toutes les configurations booléennes dans un seul fichier.

Une autre approche, que j'utilise pour les automatisations, est d'utiliser un dossier et de laisser Home Assistant tout fusionner : `automation: !include_dir_merge_list automations/`

```yaml
automation: !include_dir_merge_list automations/
```

Cela vous permet de mettre un YAML par automatisation, gardant les choses organisées.

Revenons à notre boolean. Que mettre dans le fichier :

```yaml
terrasse_salon_auto_on:
  name: Terrasse Salon Motion ON
  icon: mdi:lightbulb
```

Cela créera un `input_boolean` nommé `terrasse_salon_auto_on` que nous utiliserons plus tard dans notre automatisation.

## **L'automatisation**

Nous avons deux automatisations : une pour l'allumage, une pour l'extinction.

```yaml
- alias: Terrasse Salon ON
  id: terrasse_salon_on
  trigger:
    platform: state
    entity_id: binary_sensor.motion_salon_occupancy
    to: "on"
  condition:
    - condition: state
      entity_id: light.terrasse_salon
      state: "off"
    - condition: numeric_state
      entity_id: sensor.motion_salon_illuminance_lux
      below: 50
    - condition: state
      entity_id: input_boolean.terrasse_motion_sensor_enabled
      state: "on"
  action:
    - service: light.turn_on
      entity_id: light.terrasse_salon
    - service: input_boolean.turn_on
      entity_id: input_boolean.terrasse_salon_auto_on

- alias: Terrasse Salon OFF
  id: terrasse_salon_off
  trigger:
    platform: state
    entity_id: binary_sensor.motion_salon_occupancy
    to: "off"
    for:
      minutes: 2
  condition:
    - condition: state
      entity_id: light.terrasse_salon
      state: "on"
    - condition: or
      conditions:
        - condition: state
          entity_id: input_boolean.terrasse_salon_auto_on
          state: "on"
        - condition: state
          entity_id: input_boolean.ignore_light_manual_on
          state: "on"
  action:
    - service: light.turn_off
      entity_id: light.terrasse_salon
    - service: input_boolean.turn_off
      entity_id: input_boolean.terrasse_salon_auto_on
```

Passons en revue chaque partie pour comprendre comment cela fonctionne.

### **Le déclencheur**

Nous voulons contrôler la lumière basée sur la détection de mouvement, donc nous utilisons un déclencheur d'état sur le capteur de mouvement.

```yaml
trigger:
    platform: state
    entity_id: binary_sensor.motion_salon_occupancy
    to: "on"
```

Lorsque le capteur d'occupation s'allume, l'automatisation se déclenche.

Pour le déclencheur d'extinction, nous l'avons légèrement amélioré pour éviter les scintillements lorsque le mouvement n'est pas constant.

```yaml
trigger:
    platform: state
    entity_id: binary_sensor.motion_salon_occupancy
    to: "off"
    for:
      minutes: 2
```

Le `for: minutes` gère cela : si l'occupation est désactivée pendant 2 minutes, l'action se déclenche.

### **Les conditions**

Lorsqu'il y a du mouvement, quand la lumière doit-elle s'allumer ? Quand il fait sombre et que la lumière est éteinte, bien sûr.

```yaml
condition:
    - condition: state
      entity_id: light.terrasse_salon
      state: "off"
    - condition: numeric_state
      entity_id: sensor.motion_salon_illuminance_lux
      below: 50
    - condition: state
      entity_id: input_boolean.terrasse_motion_sensor_enabled
      state: "on"
```

* La partie `state` vérifie si la lumière est éteinte
    
* `numeric_state` vérifie la valeur d'illuminance du capteur de mouvement. Quelle valeur utiliser ? J'ai fait quelques tests. 0 fonctionnerait (pas de lumière), mais je l'ai légèrement augmentée pour également déclencher en faible luminosité.
    
* Le dernier `state` est un autre `input_boolean` qui peut désactiver complètement la lumière. Je l'utilise la nuit : si l'alarme est activée, personne ne sera dehors, donc le mouvement ne devrait pas allumer la lumière.
    

L'automatisation d'extinction est similaire, mais c'est ici que la magie opère avec notre `input_boolean`.

```yaml
  condition:
    - condition: state
      entity_id: light.terrasse_salon
      state: "on"
    - condition: or
      conditions:
        - condition: state
          entity_id: input_boolean.terrasse_salon_auto_on
          state: "on"
        - condition: state
          entity_id: input_boolean.ignore_light_manual_on
          state: "on"
```

* La lumière doit être allumée.
    
* Le `input_boolean` que nous avons configuré. La lumière s'éteint uniquement si elle a été allumée par l'automatisation. Si nous l'avons allumée manuellement, le flag reste à false et la lumière ne s'éteindra pas automatiquement.
    
* Il y a aussi une condition `or` avec un second booléen qui écrase ceci : il force l'extinction de la lumière indépendamment de la façon dont elle a été allumée.
    

### **L'action**

Si les conditions sont remplies, la lumière s'allume ou s'éteint — et nous contrôlons également le `input_boolean`.

```yaml
  action:
    - service: light.turn_on
      entity_id: light.terrasse_salon
    - service: input_boolean.turn_on
      entity_id: input_boolean.terrasse_salon_auto_on
```

Le script d'allumage exécute deux services : un pour la lumière, un pour mettre le boolean à `true`. Cela marque que la lumière a été allumée par l'automatisation.  
C'est la méthode la plus simple que j'ai trouvée, mais il y a d'autres approches.

L'extinction fait le contraire : elle remet le flag à false.

```yaml
  action:
    - service: light.turn_off
      entity_id: light.terrasse_salon
    - service: input_boolean.turn_off
      entity_id: input_boolean.terrasse_salon_auto_on
```
