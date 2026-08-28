---
title: Une batterie solaire est-elle rentable en 2026 ?
categories:
- solar-energy
- smart-home
tags:
- home-assistant
- solar-panels
- solar-energy
date: '2026-03-22T16:26:00.678000+00:00'
slug: une-batterie-solaire-est-elle-rentable-en-2026
description: Comment simuler la rentabilité d'une batterie solaire ? Analyse technique
  utilisant VictoriaMetrics et Home Assistant sur une installation de 6kWp
url: /fr/une-batterie-solaire-est-elle-rentable-en-2026/
aliases:
- /une-batterie-solaire-est-elle-rentable-en-2026
---



En ce début d'année 2026, la question pour tout propriétaire de panneaux solaires a évolué. Il ne s'agit plus seulement de savoir combien de panneaux on peut installer sur son toit, mais quelle quantité de cette énergie on peut réellement conserver pour soi. Avec des prix de l'électricité en France qui continuent de grimper, j'ai décidé d'analyser les chiffres de ma propre installation de **6 kWc** pour voir si une batterie domestique est enfin un investissement rationnel.

Vivant dans le **Nord de la France**, le défi pour moi est double : un ensoleillement plus faible que dans le sud, et un chauffage hivernal (via pompe à chaleur) très énergivore.

Dans cet article, je partage les résultats d'une analyse de 1,5 an de production et je détaille la simulation réalisée en intégrant les données réelles de ma dernière facture EDF OA : **le manque à gagner sur la revente.**

* * *

## Le paysage énergétique en 2026 : Le poids du contrat

Les tarifs de revente ont beaucoup évolué. Pour mon installation, les conditions sont excellentes, ce qui change paradoxalement la rentabilité d'une batterie :

*   **Coût d'achat (Réseau) :** ~0,208 €/kWh (HP) / ~0,164 €/kWh (HC)
    
*   **Tarif de Revente (Mon contrat) :** **13,01 c€/kWh** (jusqu'à un plafond de 9 600 kWh/an).
    
*   **Tarif de Revente (Nouveaux contrats 2026) :** **4,00 c€/kWh**.
    

Le calcul de rentabilité repose sur l'économie nette : si je stocke 1 kWh pour ne pas l'acheter 0,20 €, mais que j'aurais pu le vendre 0,13 €, mon **gain réel n'est que de 0,07 €**.

* * *

## Pourquoi les moyennes journalières sont trompeuses

Beaucoup de simulateurs en ligne utilisent des "moyennes quotidiennes". **C'est une erreur.** Pour comprendre le ROI d'une batterie, il faut des **données horaires**. Une moyenne peut indiquer que vous avez produit 15 kWh et consommé 15 kWh, mais si la production est à midi et la consommation à minuit, sans batterie, vous achetez 100 % de votre énergie nocturne.

### Mon profil de consommation (Données réelles)
 
Pour comprendre l'intérêt d'une batterie, il faut d'abord isoler la consommation "talon" de la maison des gros postes de dépense énergétique. Dans mon cas, deux éléments dominent :
la **Pompe à Chaleur (PAC)** en hiver et la recharge du **Véhicule Électrique (VE)**.

L'analyse de mes données sur une année complète révèle une disparité saisonnière massive, exacerbée par le chauffage :

| Saison | Consommation Nuit (23h-7h) | Consommation Jour (7h-23h) | Total Quotidien |
| :--- | :--- | :--- | :--- |
| **Hiver (avec PAC)** | **18,7 kWh** | ~12,3 kWh | **~31 kWh** |
| **Été** | **7,9 kWh** | ~4,1 kWh | **~12 kWh** |

#### L'impact du Véhicule Électrique (VE)
C'est ici que les moyennes deviennent piégeuses. Sur l'année, j'ai effectué **132 sessions de recharge**, consommant un total de **2 454 kWh**. Une recharge typique peut monter jusqu'à **60 kWh** en une seule nuit.

Si l'on inclut ces recharges dans la moyenne nocturne, on obtient un chiffre de **17,1 kWh/nuit**. Mais en réalité :
*   **70% des nuits** (sans recharge VE), ma consommation est modérée.
*   **30% des nuits**, la consommation explose pour charger la voiture.

Ce point est crucial : charger une voiture électrique la nuit se fait déjà au tarif **Heures Creuses (0,1637 €)**. Utiliser une batterie pour charger un VE reviendrait à stocker de l'électricité (avec 10% de perte) pour l'utiliser au même tarif... une opération financièrement nulle.

Le constat global reste sans appel : dans le Nord, **l'hiver est une opération blanche**. Ma pompe à chaleur consomme tout. Par contre, en **été**, l'excédent est massif. Sur ma dernière facture, j'ai injecté **2 431 kWh** sur le réseau, générant **316,27 €** de revenus (hors prime).

* * *

## Analyse du ROI : L'impact du tarif de revente

Voici la simulation comparative entre mon contrat actuel et un contrat signé aujourd'hui.

### Scénario A : Mon contrat (Revente à 13,01 c€/kWh)

Ici, chaque kWh stocké est un kWh "perdu" pour la revente à un prix élevé.

| Taille Batterie | Coût Total | Économie Réseau | Manque à gagner revente | **Économie Nette** | **Amortissement** |
| --- | --- | --- | --- | --- | --- |
| 5 kWh | 3 400 € | 282 € | 176 € | **106 €** | 32 ans |
| 10 kWh | 4 800 € | 564 € | 352 € | **212 €** | 23 ans |
| 15 kWh | 6 200 € | 845 € | 528 € | **317 €** | **20 ans** |

**Verdict :** Avec un tarif de revente aussi élevé (13,01 c€), la batterie n'est **absolument pas rentable** financièrement. Elle mettrait 20 ans à s'amortir, soit bien au-delà de sa durée de vie probable.

### Scénario B : Nouvelle installation 2026 (Revente à 4,00 c€/kWh)

Pour un nouvel acquéreur, la faible rémunération du surplus change la donne.

| Taille Batterie | Coût Total | Économie Réseau | Manque à gagner revente | **Économie Nette** | **Amortissement** |
| --- | --- | --- | --- | --- | --- |
| 5 kWh | 3 400 € | 282 € | 54 € | **228 €** | 15 ans |
| 10 kWh | 4 800 € | 564 € | 109 € | **455 €** | **10 ans** |
| 15 kWh | 6 200 € | 845 € | 164 € | **681 €** | **9 ans** |

**Verdict :** Pour un nouveau contrat, **la batterie de 10-15 kWh devient rentable** en 9 à 10 ans, ce qui correspond à la durée de garantie des constructeurs.

* * *

## Focus Technique : Comment j'ai validé ces chiffres

J'ai construit un pipeline d'analyse pour "rejouer" les 1,5 dernières années en simulant l'ajout d'une batterie.

1.  **Stockage long terme :** J'utilise **VictoriaMetrics** pour stocker les données de mon ECU APSystems et de mon Linky.
    
2.  **Extraction :** Un script Python (`collect_data.py`) récupère les données par "chunks" de 31 jours pour éviter les timeouts.
    
3.  **Simulation :** Le script `battery_simulator.py` calcule l'état de charge (**SoC**) heure par heure, en appliquant une efficacité de 90%.
    

```python
# Extrait de la logique de simulation
for hour in data:
    net_power = production - consommation
    if net_power > 0:
        # On charge la batterie avec l'excédent (perte de revente à 13.01c)
        current_soc += min(net_power, capacity - current_soc) * 0.90
    else:
        # On décharge pour éviter l'achat réseau à 20.8c
        current_soc -= min(abs(net_power), current_soc)
```

* * *

## Conclusion : Faut-il sauter le pas ?

L'analyse est sans appel :

1.  **Si vous avez un ancien contrat (type 13 c€/kWh) :** Financièrement, **ne le faites pas**. Vendre votre surplus est plus rentable que de l'utiliser via une batterie coûteuse.
    
2.  **Si vous démarrez aujourd'hui (4 c€/kWh) :** La batterie est **indispensable** pour maximiser votre investissement.
    
3.  **L'aspect Prime :** N'oubliez pas que l'autoconsommation avec vente de surplus donne droit à une prime (dans mon cas **1 380 €**), ce qui aide à financer l'installation initiale, mais ne change pas la logique de cycle de la batterie.
    

Le choix de la batterie en 2026 est donc devenu une question de **contrat** autant que de technologie.

Retrouvez les scripts et les données sur mon GitHub : [ha-energy-analysis](https://github.com/mmornati/ha-energy-analysis).
