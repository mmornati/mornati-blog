---
title: 'Surveiller le Niveau de Sel de Votre Adoucisseur avec Home Assistant'
categories:
- smart-home
tags:
- maison-intelligente
- home-assistant
- zigbee
- zigbee2mqtt
- adoucisseur
- iot
date: '2026-08-16T10:00:00.000000+00:00'
slug: monitoring-water-softener-salt-level-with-home-assistant
translationKey: monitoring-water-softener-salt-level-with-home-assistant
description: Comment surveiller le niveau de sel de votre adoucisseur d'eau en utilisant un capteur de fuite d'eau Zigbee waterproof et une automatisation Home Assistant.
cover: cover.png
showHero: true
---

Si vous avez un adoucisseur d'eau à la maison, vous savez combien il est important de maintenir le réservoir de sel rempli. Manquer de sel signifie que de l'eau dure circule dans votre maison, ce qui peut endommager les appareils, laisser des dépôts de tartre et assécher votre peau. Mais comment savoir quand il est temps de remplir avant qu'il ne soit trop tard ?

## La Solution Intelligente

Au lieu de vérifier manuellement le niveau de sel (ou d'oublier de vérifier jusqu'à ce qu'il soit trop tard), vous pouvez mettre en place un système de surveillance intelligent utilisant un **capteur de fuite d'eau** placé directement dans le réservoir de sel. Le concept est ingénieusement simple :

> **Quand le niveau de sel descend suffisamment bas pour que l'eau atteigne le capteur, il est temps de remplir.**

Cette approche fonctionne car dans un adoucisseur d'eau, la saumure se trouve au fond du réservoir. Pendant que le sel se dissout, le niveau d'eau reste stable, mais quand le sel est presque épuisé, le capteur (placé à un point stratégique bas) se mouille - déclenchant une alerte.

## L'Appareil Recommandé : Capteur de Fuite d'Eau Aqara

J'utilise le **Capteur de Fuite d'Eau Aqara (modèle SJCGQ11LM)** pour cet usage, et je le recommande pour plusieurs raisons :

| Caractéristique | Détails |
|-----------------|---------|
| **Étanchéité** | **IP67** - Entièrement antipoussière et waterproof |
| **Connectivité** | Zigbee (nécessite un hub compatible ou Zigbee2MQTT) |
| **Autonomie** | Plus de 2 ans sur une pile CR2032 |
| **Taille** | Compact : 50mm de diamètre, s'intègre facilement dans les réservoirs |
| **Compatibilité** | Fonctionne avec Home Assistant via Zigbee2MQTT, ZHA, ou Aqara Hub |

La **certification IP67** est cruciale ici - le capteur sera immergé dans l'eau (ou la saumure) régulièrement, et cette certification garantit qu'il peut supporter d'être dans l'eau sans dommage. Le capteur détecte l'eau à seulement 0,5mm de profondeur, ce qui le rend parfait pour une détection précoce.

**Où l'acheter :**
- [Boutique Officielle Aqara](https://www.aqara.com/en/product/water-sensor.html)
- [Amazon](https://www.amazon.com/dp/B07D39MSZS)
- [AliExpress](https://www.aliexpress.com/item/4000071259351.html)
- [Domadoo (UE)](https://www.domadoo.fr/en/peripheriques/4519-aqara-capteur-d-eau-zigbee-6970504210257.html)

## Implémentation

### 1. Configuration Zigbee2MQTT

D'abord, assure-toi que ton capteur est appairé avec ton réseau Zigbee. Dans ton `zigbee2mqtt/configuration.yaml`, ajoute un nom convivial :

```yaml
'0x00158d00044f1bd4':
  friendly_name: water_sensor_softner
```

### 2. L'Automatisation

Cette automatisation se déclenche quand le capteur détecte de l'eau (ce qui signifie que le sel est bas) :

```yaml
- id: '1761499181494'
  alias: 'Water: Low Salt in Softener'
  description: Alert when water softener salt is low (sensor sits in salt tank; water reaching it means low salt).
  triggers:
  - entity_id: binary_sensor.water_sensor_softner_water_leak
    from: 'off'
    to: 'on'
    trigger: state
  conditions: []
  actions:
  - action: notify.notify
    data:
      message: '⚠️ Manque de sel dans l''adoucisseur ! Action requise : remplir le réservoir de sel.'
  mode: single
```

### Comment Ça Marche

1. Le capteur repose au fond du réservoir de sel, suspendu au-dessus de la saumure
2. Tant qu'il y a assez de sel, le capteur reste sec
3. Quand les niveaux de sel descendent kritiquement bas, l'eau touche les sondes du capteur
4. Le capteur envoie un signal `water_leak: true` via Zigbee
5. Home Assistant détecte le changement d'état et déclenche l'automatisation
6. Tu reçois une notification pour remplir le sel

## Options de Personnalisation

Tu peux améliorer cette installation avec :

- **Notifications multiples** : Ajoute des actions pour email, Telegram ou annonces vocales
- **Intégration dashboard** : Ajoute le capteur à ton dashboard Home Assistant
- **Suivi historique** : Surveille la fréquence des déclenchements pour optimiser ton calendrier de remplissage
- **Vannes intelligentes** : Coupe automatiquement l'eau si combiné avec une électrovanne (avancé)

## Conclusion

Cette solution DIY simple mais efficace transforme ton adoucisseur en appareil intelligent. Plus de devinettes ou de jours d'eau dure inattendus. Le coût total est inférieur à 30€ pour le capteur, et la tranquillité d'esprit n'a pas de prix.

---

**Articles connexes :**
- [Intégrer le Compteur d'Eau Intelligent Everblue avec Home Assistant](/integrating-the-everblue-smart-water-meter-with-home-assistant/)
- [Home Assistant : Utiliser des Boutons ZigBee pour Contrôler des Appareils sur Différents Protocoles](/home-assistant-use-zigbee-buttons-to-control-other-protocol-devices/)
- [Home Assistant : Contrôle des Volets selon la Température](/homeassistant-close-cover-to-control-the-home-temperature-v2/)
