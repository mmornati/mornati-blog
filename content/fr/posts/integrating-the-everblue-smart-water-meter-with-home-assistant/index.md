---
title: Intégration du compteur d'eau intelligent Everblue avec Home Assistant
categories:
- smart-home
canonical: https://github.com/hallard/everblu-meters-pi
tags:
- smart-home
- home-assistant
- water-meter
date: '2024-04-30T09:23:58.877000+00:00'
slug: integrating-the-everblue-smart-water-meter-with-home-assistant
description: Suivez votre consommation d'eau efficacement en intégrant le compteur intelligent Everblue avec Home Assistant. Guide étape par étape pour une surveillance et un contrôle minutieux.
---

Bienvenue dans ce guide détaillé où je partage mon expérience avec l'un des projets les plus difficiles que j'ai réalisé avec Home Assistant : l'intégration du compteur d'eau intelligent Everblue. Ce guide vous guidera à travers tout le processus, étape par étape.

### **Introduction**

En France, de nombreuses maisons sont maintenant équipées du [compteur d'eau Everblue](https://www.itron.com/fr/solutions/product-catalog/everblu-cyble-enhanced). Les compagnies des eaux favorisent ces appareils car ils facilitent les relevés à distance, évitant le besoin d'accès physique aux propriétés, ce qui peut être difficile si les propriétaires ne sont pas disponibles. Ce qui rend l'Everblue particulièrement intéressant, c'est sa fonctionnalité de connectivité, qui permet aux techniciens d'accéder aux données de consommation d'eau sans fil, évitant les facturations incorrectes dues à des relevés manqués. Cependant, il faut noter que en raison des limites réglementaires sur les transmissions sans fil, ces appareils ne fonctionnent que pendant les heures de travail en semaine.

### **Pourquoi intégrer Everblue avec Home Assistant ?**

En tant que personne qui aime automatiser chaque aspect possible de ma maison, intégrer Everblue avec Home Assistant me permet de surveiller et contrôler l'utilisation de l'eau de manière minutieuse. Cette configuration permet de répondre à des questions comme "Combien d'eau utilise une douche ?" ou "Quelle est la consommation lors du fonctionnement de la machine à laver ?". En incorporant Everblue dans le dashboard énergie de Home Assistant, vous pouvez suivre ces métriques au fil du temps, optimisant votre utilisation de l'eau et comprennant vos habitudes de consommation. Pour ce projet, vous aurez besoin de :

* Un Raspberry Pi (n'importe quel modèle conviendra ; j'ai utilisé un ancien RPi Rev B)
    
* Un module sans fil CC1101, qui fonctionne à la fréquence 433Mhz — couramment utilisée dans divers appareils ménagers
    

Ce voyage a commencé par le décryptage du protocole de communication du compteur Everblue, grâce à un groupe d'enthousiastes français qui ont posé les bases. Vous pouvez explorer leur recherche originale [ici](https://github.com/neutrinus/everblu-meters). Plusieurs projets ultérieurs se sont appuyés sur cela, utilisant des plateformes comme Raspberry Pi, ESP8266 et ESP32.

### **Processus d'intégration étape par étape**

Après avoir expérimenté différentes versions, je me suis arrêté sur un fork basé sur Raspberry Pi qui correspondait le mieux à mes objectifs. Le processus est simple si vous suivez les instructions détaillées dans le [readme du projet GitHub](https://github.com/hallard/everblu-meters-pi)[:](https://github.com/hallard/everblu-meters-pi)

1. Activez SPI via `raspi-config`.
    
2. Installez WiringPi et libmosquitto-dev.
    
3. Configurez les paramètres du compteur et MQTT dans le code.
    
4. Compilez et exécutez le code pour commencer à recevoir des données.
    
5. Configurez un crontab pour automatiser le relevé une fois par jour.
    

Assurez-vous d'ajuster la fréquence de l'appareil si nécessaire, car des écarts légers par rapport au 433Mhz standard sont possibles. Si l'appareil n'est pas détecté initialement, vous devrez peut-être effectuer plusieurs scans.

```bash
./everblu_meters 0
```

Si le scan rapporte une fréquence 0, l'appareil n'a pas été trouvé. Vous devrez peut-être essayer plusieurs fois avant de trouver la fréquence de fonctionnement. Quand cela fonctionne, vous verrez un message comme ceci :

```json
{ 
	"date":"Sat Jul 15 13:06:04 2023", 
	"frequency":"433.8000", 
	"min":"433.7900", 
	"max":"433.8100"
}
```

Une fois configuré, planifiez le compteur Everblue pour qu'il lise une fois par jour pour économiser la batterie, et rappelez-vous : heures de travail uniquement !

J'ai créé un simple crontab :

```bash
crontab -e
```

Avec le contenu suivant :

```bash
0 10 * * 1-5 /home/mmornati/everblu-meters-pi/everblu_meters 433.7560 >> /tmp/everblu.log 2>&1
```

Cela s'exécute chaque jour de semaine à 10h, et écrire les logs dans `/tmp/everblu.log` me permet de vérifier que tout fonctionne.

Le contenu du fichier

```bash
CC1101 Verion : 0x0014
CC1101 found OK!
Base MQTT topic is now everblu/cyble-23-0199454-pi
Connected to MQTT broker (almost)
Trying to query Cyble at 433.7560MHz
Reading data...MQTT : Subscribed OK (mid: 1): 2
Consommation   : 222583 Litres
Battery left  : 166 Mois
Read counter  : 160 fois
Working hours : de 06H à 18H
Local Time    : Ven Avr 26 10:00:09 2024
RSSI  /  LQI  : -48dBm  /  -128
CC1101 Verion : 0x0014
CC1101 found OK!
Base MQTT topic is now everblu/cyble-23-0199454-pi
Connected to MQTT broker (almost)
Trying to query Cyble at 433.7560MHz
Reading data...MQTT : Subscribed OK (mid: 1): 2
Consommation   : 223486 Litres
Battery left  : 166 Mois
Read counter  : 161 fois
Working hours : de 06H à 18H
Local Time    : Lun Avr 29 10:00:09 2024
RSSI  /  LQI  : -48dBm  /  -128
```

**La chose intéressante** dans les informations retournées par le compteur Everblue est les heures de fonctionnement de l'appareil, qui aident pour la planification `de 06H à 18H`.

### **Afficher les informations dans Home Assistant**

L'étape finale implique la création de capteurs dans Home Assistant pour afficher les données des topics MQTT :

```yaml
sensor:
  - name: "water_meter_consumption"
    state_topic: "everblu/cyble-23-0199454-pi/json"
    unique_id: "water_meter_consumption"
    value_template: "{{ value_json.liters }}"
    unit_of_measurement: "L"
    device_class: water
    state_class: total_increasing
  - name: "water_meter_last_read"
    state_topic: "everblu/cyble-23-0199454-pi/json"
    unique_id: "water_meter_last_read"
    value_template: "{{ value_json.ts }}"
    device_class: timestamp
```

Ces capteurs apparaîtront maintenant dans votre Energy Dashboard, vous permettant de surveiller efficacement l'utilisation de l'eau.

![](/images/integrating-the-everblue-smart-water-meter-with-home-assistant/00-9dfd9559-95cf-4b7c-8e55-075ae0d3dc49.png)

  

### **Problèmes courants**

Occasionnellement, le script peut échouer à détecter le compteur Everblue. J'ai modifié le script pour réessayer plusieurs fois avant d'abandonner, ce qui résout le problème la plupart du temps. Si les problèmes persistent, ils sont généralement résolus le jour suivant.

![](/images/integrating-the-everblue-smart-water-meter-with-home-assistant/01-126ac512-d8a4-43e4-9ac5-33243213165f.png)

Remplacez la ligne 323 par le code suivant :

```cpp
int i=0; 
do { 
    printf("Reading data..."); 
    meter_data = get_meter_data(); 
    i++; 
    sleep(5); 
} while (i<10 && !meter_data.ok);
```

### **Conclusion**

Bien que le voyage pour intégrer le compteur Everblue avec Home Assistant ait été semé d'embûches, particulièrement avec les tentatives initiales sur ESP32, la configuration finale utilisant un Raspberry Pi s'est avérée réussie. Cette intégration améliore non seulement ma compréhension de la consommation d'eau domestique mais démontre également le pouvoir de la domotique dans la gestion efficace des ressources.

J'espère que ce guide vous aide à optimiser votre propre intégration de compteur d'eau intelligent. Si vous rencontrez des problèmes ou avez des questions, n'hésitez pas à me contacter ou à commenter ci-dessous.
