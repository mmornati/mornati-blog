---
title: 'iOS: Contatti persi dopo update alla 5'
date: '2011-10-18T22:00:00+00:00'
slug: ios-contatti-persi-dopo-update-alla-5
url: /it/ios-contatti-persi-dopo-update-alla-5/
aliases:
- /ios-contatti-persi-dopo-update-alla-5
---



<strong>Premessa</strong>: il problema l'ho riscontrato solo su un iPhone 4 (su 2) e non so dire se sia successo qualcosa di anomalo durante la procedura d'update (niente di evidente almeno).

Dopo aver aggiornato l'update (in realtà alla prima necessità dell'agenda, quindi dopo un paio di giorni dall'update :)) mi sono accorto che stranamente i contatti non erano stati risoncronizzati con il telefono (<strong>NB</strong> i contatti non erano realmente sincronizzati né attraverso iTunes né usando Exchange/Google, quindi erano solo all'interno dei backup). La cosa molto strana é che in realtà nelle chiamate perse e nei preferiti, sebbene la rubrica fosse vuota, si vedevano i nomi dei contatti.

Dopo aver giochicchiato un po' con le impostazioni ho scoperto che il problema era solo legato ad iCloud (<em>baco??</em>): avevo scelto di non effettuare il backup su iCloud.

<a href="http://blog.mornati.net/wp-content/uploads/2011/10/foto-1.png">![](http://blog.mornati.net/wp-content/uploads/2011/10/foto-1-200x300.png)</a>

Nelle impostazioni risultavano però selezionati alcuni dei servizi di cui effettuare il backup (fra cui i contatti). In pratica"l'interruttore" generale per andare su iCloud era spento ma tutto il resto no.

<a href="http://blog.mornati.net/wp-content/uploads/2011/10/foto-2.png">![](http://blog.mornati.net/wp-content/uploads/2011/10/foto-2-200x300.png)</a>

Apparentemente questo ha perturbato un po' la rubrica.
Per far tornare visibili tutti i contatti ho disattivato temporaneamente, nel menu iCloud, la sincronizzazione contatti, per poi riattivarla subito dopo e... magia, ecco ancora tutti i miei contatti (che ripeto erano solo nascosti).

[gallery link="file" columns="4"]
