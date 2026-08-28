---
date: '2022-10-08T13:47:48+00:00'
slug: quando-e-bizzarra-internet
title: Quando é bizzarra internet?
categories:
- programming
url: /it/quando-e-bizzarra-internet/
aliases:
- /quando-e-bizzarra-internet
---

## Quando é bizzarra internet?

Giusto una di quelle cose che vedi e tici "ma come é possibile che facciano dei giri cosi per raggiungere il PC che ho qui di fianco?"

<strong>Per i non addetti ai lavori
</strong>Stavo cercando di capire perché avessi problemi a raggiungere il PC di casa (che sta a 10km massimo da dove sono io ora). E nella lista dei nodi che passo per raggiungere il PC  c'é un "London" ?!?
Come dire che l'algoritmo del commesso viaggiatore applicato al network non funziona molto bene! ;)

Speriamo che i GPS non diventino cosi nel calcolare le rotte!
<pre><code> traceroute jenkins.home
traceroute to jenkins.home (86.198.208.123), 30 hops max, 60 byte packets
 1  WRT54GL (192.168.23.1)  1.425 ms  3.124 ms  3.785 ms
 2  reverse.completel.net (92.103.32.129)  4.936 ms *  5.518 ms
 3  * * *
 4  * * *
 5  reverse.completel.net (213.244.0.234)  12.481 ms  12.706 ms  13.794 ms
 6  reverse.completel.net (213.244.0.242)  14.228 ms  6.411 ms  6.855 ms
 7  prs-b6-link.telia.net (213.248.93.41)  7.556 ms  8.472 ms  9.322 ms
 8  prs-bb2-link.telia.net (80.91.246.56)  9.602 ms  10.427 ms prs-bb1-link.telia.net (80.91.246.54)  11.963 ms
 9  prs-b7-link.telia.net (80.91.252.146)  12.514 ms  13.125 ms  8.086 ms
10  tengige1-8-0-5.pastr1.Paris.opentransit.net (193.251.251.105)  8.415 ms tengige1-13-0-7.pastr1.Paris.opentransit.net (193.251.250.221)  8.483 ms tengige1-13-0-5.pastr1.Paris.opentransit.net (193.251.254.153)  8.450 ms
11  pos0-1-4-0.lontr1.London.opentransit.net (193.251.242.18)  20.516 ms  20.060 ms  18.805 ms
12  * * *
13  * * *
14  * * *
15  * * *
16  * * *
17  * * *
18  * * *
19  * * *
20  * * *
21  * * *
22  * * *
23  * * *
24  * * *
25  * * *
26  * * *
27  * * *
28  * * *
29  * * *
30  * * *</code></pre>
