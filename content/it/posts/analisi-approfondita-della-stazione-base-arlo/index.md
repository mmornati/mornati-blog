---
title: 'Analisi approfondita della stazione base Arlo: consumo batteria, pacchetti sniffati e configurazione router'
tags:
- netgear
- arlo
- orbi
- rbr760
- wifi
- batteria
- domotica
- iot
- router
- casa-intelligente
- reverse-engineering
date: '2026-08-20T10:00:00.000000+00:00'
slug: analisi-approfondita-della-stazione-base-arlo
translationKey: arlo-base-station-deep-dive
url: /it/analisi-approfondita-della-stazione-base-arlo/
categories:
- Casa Intelligente
- DIY
- Networking
- Hardware
description: 'Un''analisi bonus approfondita della stazione base Arlo: misurazioni reali del consumo batteria con telecamere armate/disarmate, dati di pacchetti sniffati che mostrano come la stazione base mantiene le telecamere in sleep, e la limitazione dell''intervallo beacon dell''RBR760 che impedisce la replica fai-da-te completa.'
cover: cover.jpg
showHero: true
---

Questo è un quinto post non pianificato nella serie Arlo — un'analisi bonus approfondita dei dati che ho raccolto prima e durante la serie di quattro articoli. Se mi avete seguito finora, sapete che lo stack a livello di rete funziona per la registrazione e lo streaming. Quello che la serie non aveva previsto è *quanto* il comportamento WiFi della stazione base influisca sulla durata della batteria, e cosa ho scoperto quando ho messo un packet sniffer tra le telecamere e la vera stazione base Arlo.

> Tutti i valori in questo post provengono da misurazioni reali su due telecamere VMC4040P (JARDIN1, PORTAIL), una VMC4040P che è rimasta offline per oltre 24 ore (ENTREE), e un RBR760 in produzione con firmware V6.3.8.5. I seriali delle telecamere sono oscurati con `XXXXXXXXXXXX`. Il gateway `172.14.1.1` è la costante del protocollo wire Arlo ed è lasciato in chiaro.

## Parte 1 — Test di Consumo della Batteria

La serie di quattro articoli si è conclusa con le correzioni a livello WiFi — timeout di inattività e lease DHCP — ma le misurazioni del consumo batteria che hanno motivato l'intera indagine meritano un articolo a sé. Ecco esattamente cosa ho misurato, telecamera per telecamera.

### Metodologia

Quattro telecamere sullo stesso WiFi guest RBR760, tutte con firmware Arlo originale. La configurazione del test:

- **Periodo baseline** (24 ore): tutte le telecamere disarmate, nessun evento di movimento, nessuno streaming RTSP.
- **Periodo armato** (variabile): telecamere armate in una vista con rilevamento movimento attivo ma nessun evento di movimento registrato.
- **Test intervallo beacon** (per telecamera): intervallo beacon di `arlo-cam-api` impostato a 100 secondi (il valore predefinito nel codice originale) vs 3600 secondi (il valore che ho introdotto nelle PR del Post 2).

Lo strumento di misura era uno script di polling che interrogava l'endpoint `/device/<serial>` di `arlo-cam-api` ogni 60 secondi e registrava il campo `BatPercent` — lo stesso campo mostrato dal dashboard di Home Assistant.

### Baseline — Tutte le Telecamere Disarmate

Con tutte e quattro le telecamere disarmate, nessun probing beacon, nessun RTSP, nessun evento di movimento:

| Telecamera | SOC iniziale | SOC finale (24h) | Tasso di consumo |
|------------|-------------|-------------------|------------------|
| J1 (JARDIN1) | 77% | 76% | ~0.04%/h |
| J2 (JARDIN2) | 65% | 64% | ~0.04%/h |
| PORTAIL | 42% | 41% | ~0.04%/h |
| ENTREE | 31% | 31% | ~0.00%/h |

Tutte le telecamere hanno perso essenzialmente zero carica. Il calo dell'1% sulle tre telecamere attive rientra nel rumore di misurazione dell'ADC del sensore batteria. ENTREE, che ha trascorso l'intero periodo di 24 ore offline (non associata a nessun AP), ha mostrato una linea piatta — dimostrando che il controller della batteria stesso ha un'autoscarica trascurabile quando la telecamera è veramente in sleep.

**Conclusione:** Quando una telecamera è in deep sleep (nessuna associazione WiFi, nessun risveglio PIR, nessun beacon), il consumo della batteria è effettivamente zero. Ogni punto percentuale di consumo osservato è causato da qualcosa che impedisce il deep sleep.

### Armate — Il Problema del Beacon a 100 Secondi

Le stesse telecamere, ora armate in una vista con rilevamento movimento attivo. Nessun evento di movimento è stato registrato durante il test — le telecamere puntavano su scene statiche.

| Telecamera | Intervallo | SOC iniziale | Durata | SOC finale | Tasso consumo |
|------------|-----------|--------------|--------|------------|---------------|
| J1 | Beacon 100s | 77% | ~8h (notte) | 2% | ~9.4%/h |
| PORTAIL | Beacon 100s | 42% | 10h | ~3% | ~3.9%/h |
| PORTAIL | Beacon 3600s | 41% | 30h | ~21% | ~0.67%/h |
| ENTREE | offline | 31% | 24h+ | 31% | ~0.00%/h |

J1 è stato il caso peggiore perché era su una VAP satellite con segnale debole — è entrato in un boot loop al 2% e ci è rimasto fino a quando non l'ho resettato fisicamente. PORTAIL a 100 secondi ha perso 3.9%/h — cioè 25.5 ore per scaricarsi completamente. A 3600 secondi (un'ora), il consumo è sceso a 0.67%/h — un miglioramento di 5.8x, dando oltre 6 giorni di autonomia pur *armata*.

Il meccanismo è semplice:

> Ogni volta che il beacon interroga la telecamera, questa si risveglia dal deep sleep, elabora la risposta del probe, determina che non c'è movimento da segnalare, e torna in sleep. L'intervallo di 100 secondi manteneva la telecamera in un ciclo di sleep leggero/veglia che consumava circa 3.5 mA medi. L'intervallo di 3600 secondi permetteva alla telecamera di rimanere nello stato di deep sleep a ~0.2 mA per la maggior parte dell'ora.

### La Soglia del Deep Sleep

La scoperta critica è stata una soglia rigida nel firmware della telecamera. Quando l'intervallo del beacon superava circa 200 secondi, la telecamera entrava in una modalità di sleep qualitativamente diversa:

- **Intervallo < 200s:** La telecamera si sveglia per ogni probe, la radio WiFi rimane in uno stato di power-save attivo (modalità PM2 nei log del firmware), il sensore PIR rimane acceso, e la CPU rimane in uno stato di light-idle. Consumo: 3–10%/h a seconda dell'intensità del segnale.
- **Intervallo > 200s:** La telecamera entra in full deep sleep. La radio WiFi passa a uno stato di solo ascolto con risveglio basato su DTIM, il sensore PIR viene campionato solo all'intervallo DTIM, e la CPU entra in uno stato power-gated. Consumo: 0.5–1%/h o meno.

La soglia di 200 secondi non è documentata da nessuna parte nella KB Arlo o nei repo della community. È stata trovata empiricamente incrementando l'intervallo del beacon in step da 50 secondi e osservando il delta di `BatPercent` all'ora su PORTAIL.

L'analisi successiva del log del firmware della telecamera ha confermato i due stati di sleep:

```
no dtimskip setting
set PM2 mode, ret 0        # <--- sleep leggero, radio semi-attiva
glacial_timer 3600, ret 0  # <--- timer deep sleep impostato a 3600s
clear event, ret 0
enter sleep mode success
```

La modalità `PM2` è la modalità power-save 2 di Qualcomm Atheros (risveglio periodico con DTIM). Il `glacial_timer` impostato a 3600 secondi è il timer interno della telecamera che determina per quanto tempo può rimanere in deep sleep prima di doversi risvegliare per un controllo completo dello stato — anche senza un probe beacon. Quel valore di 3600 secondi corrisponde esattamente all'intervallo beacon di 3600 secondi come impostazione ottimale: il controllo interno della telecamera si attiva alla stessa frequenza con cui la stazione base la interroga.

### Punto Chiave

L'ottimizzazione della batteria a più alto impatto per le telecamere Arlo su uno stack auto-ospitato è: **impostare l'intervallo del beacon a 3600 secondi e mantenerlo lì.** Il valore predefinito di 100 secondi nel codice originale di `arlo-cam-api` era stato reverse-engineerizzato dal probe di *rilevamento movimento* della vera stazione base, non dal probe di *gestione batteria*. La vera stazione base usa due intervalli di probe diversi a seconda dello stato della telecamera, e quello per il risparmio energetico è molto più lungo di 100 secondi.

## Parte 2 — Dati Sniffati dalla Vera Stazione Base

Prima di sostituire la stazione base, ho eseguito una cattura pacchetti sulla vera stazione base Arlo VMB4000 per capire cosa si dicono effettivamente le telecamere e la stazione base. Il riassunto: molto poco. Il protocollo wire Arlo è quasi silenzioso tra gli eventi di registrazione.

### La Sequenza di Boot

Quando una telecamera VMC4040P si avvia e si connette al WiFi della stazione base, la sequenza completa dal boot al sleep è:

```
WLAN Autenticata
Lease DHCP acquisito (IP: 192.168.2.103, GW: 172.14.1.1)
TCP SYN → 172.14.1.1:4000  (telecamera → stazione base)
  source: 192.168.2.103:50122 → 172.14.1.1:4000  (hex: c3ea 02a2)
Payload JSON di registrazione (comando registerSet)
Ack dalla stazione base
sm_enter_idle_state          → la telecamera entra in command-parse, poi idle
Shutdown JSON server         → la telecamera spegne il suo command listener
dtimskip disable
set PM2 mode                 → power-save WiFi
glacial_timer 3600           → timer deep sleep
enter sleep mode success     → la telecamera è ora in sleep
```

L'intero ciclo dal boot al sleep richiede circa 3–5 secondi. Il payload JSON di registrazione è un messaggio `registerSet` che include il numero di serie della telecamera, la versione del firmware e il SOC corrente della batteria.

Ecco il pacchetto TCP SYN grezzo dalla cattura, annotato:

```
0000: a4 11 62 85 c8 1e  |  dst MAC (WiFi telecamera)
      94 18 65 69 c9 81  |  src MAC (telecamera, lato stazione base)
      08 00               |  EtherType IPv4
0010: 45 00 00 3c         |  header IPv4
      50 c5 40 00         |
      3e 06 7b d8         |
      ac 0e 01 01         |  IP sorgente: 172.14.1.1 (stazione base)
      c0 a8 02 67         |  IP destinazione: 192.168.2.103 (telecamera)
0020: c3 ea               |  porta sorgente: 50122
      02 2a               |  porta destinazione: 554 (RTSP)
      fa b8 1a da         |  seq num
      00 00 00 00         |  ack num (SYN)
      a0 02               |  flags: SYN
      fa f0               |  window
      35 ec 00 00         |  checksum
      02 04 05 b4         |  MSS: 1460
      04 02 08 0a 6a 06  |  Timestamps
      61 56 00 00 00 00  |
      01 03 03 07         |  opzioni TCP
```

Notate che la telecamera apre una connessione anche sulla porta 554 (RTSP) oltre al canale di controllo sulla porta 4000 — lo stream RTSP è offerto sulle porte 554 e 555 (`/live` e `/live_sec`).

### Cosa Invia la Stazione Base (Quando Invia Qualcosa)

Tra gli eventi di registrazione, la stazione base è effettivamente silenziosa. L'unica trasmissione periodica è il beacon frame 802.11. Un beacon standard dalla Arlo VMB4000:

- **Intervallo beacon:** 100 ms (predefinito, non configurabile sull'hardware Arlo)
- **IE specifico del fornitore:** Il beacon include un Information Element proprietario che elenca i numeri di serie delle telecamere associate. Questo è il meccanismo con cui la stazione base dice alle telecamere in sleep "sono ancora qui e ho ancora la vostra associazione" senza richiedere alla telecamera di inviare acknowledgement.
- **Periodo DTIM:** Annunciato come DTIM 1 (ogni beacon porta un DTIM), che dice alle telecamere in sleep quando svegliarsi per il traffico broadcast bufferizzato.

L'IE specifico del fornitore è documentato nei brevetti USA 11722963, 20240147057 e 12413852 — tutti assegnati a Netgear / Arlo Technologies. Il formato dell'IE è:

```
Element ID: 221 (Vendor Specific)
Lunghezza: variabile
  OUI: 00:0a:52 (Netgear)
  Tipo: 0x01 (informazioni stazione base Arlo)
  Dati: [elenco_seriali_telecamere]
```

I brevetti descrivono questo come un "indicatore di presenza della stazione" che permette all'AP di mantenere l'associazione con stazioni in sleep senza richiedere alla stazione di svegliarsi e inviare un keepalive. Questa è la caratteristica brevettata chiave che rende le telecamere Arlo efficienti dal punto di vista energetico sulla vera stazione base — ed è completamente assente dagli AP WiFi consumer.

### Perché gli AP Consumer Uccidono le Batterie

Un AP WiFi consumer (o l'RBR760 *senza* la configurazione della Parte 3) gestisce le stazioni in sleep diversamente:

1. **L'AP invia un Null-Function Poll** alla telecamera dopo il timeout di inattività (300s predefiniti sull'RBR760).
2. **La telecamera è in deep sleep e non risponde.**
3. **L'AP disassocia e deautentica la telecamera.**
4. **La telecamera si sveglia, non trova alcuna associazione, ed esegue l'intero ciclo dal boot al sleep** — consumando ~10 secondi di radio + CPU attive a ~350 mA invece dei ~3 µA che consumerebbe dormendo.
5. **La telecamera ottiene un nuovo lease DHCP** (ogni 30 minuti con il lease originale).
6. **La telecamera si ri-registra** con `arlo-cam-api`.

La vera stazione base non fa nulla di tutto ciò. Non disassocia mai una telecamera in sleep. L'IE del fornitore nel beacon dice alla telecamera "la tua associazione è ancora valida, resta in sleep." La telecamera non deve mai svegliarsi per un probe keepalive. L'AP non deve mai interrogare la telecamera per verificare se è viva.

L'IE brevettato non è replicabile con `hostapd` o `cfg80211tool` standard sull'RBR760 — gli strumenti non supportano l'iniezione di IE specifici del fornitore arbitrari nei beacon frame. Ma possiamo approssimare il comportamento con la giusta combinazione di parametri 802.11 standard, che è esattamente ciò che tratta la Parte 3.

## Parte 3 — Nuova Configurazione del Router Netgear per Replicare il Comportamento della Stazione Base

La stazione base Arlo standard fa alcune cose che mantengono le telecamere in sleep:

1. **Intervallo beacon:** 31 TU (31 ms) — beacon molto rapidi per mantenere le telecamere strettamente sincronizzate.
2. **Timeout di inattività:** Effettivamente infinito — le telecamere non vengono mai disassociate. Lo replichiamo con `inact=65535` (dal Post 4).
3. **Lease DHCP:** Abbastanza lungo che la telecamera non debba mai rinnovarlo durante il deep sleep. Usiamo 86400 secondi (24 ore).
4. **IE fornitore:** Non replicabile con strumenti standard.

Ma replicare i parametri *esatti* del beacon della stazione base sull'RBR760 non è semplice. L'architettura Qualcomm QCA full-offload su questo router genera i beacon frame nel firmware, non in `hostapd`. Alcuni parametri che `hostapd_cli` dichiara di accettare vengono silenziosamente ignorati dall'hardware. Ecco cosa ho scoperto quando ho messo uno sniffer WiFi sulle VAP guest reali.

### La Scoperta dell'Intervallo Beacon

La vera stazione base Arlo VMB4000 usa un intervallo beacon di **31 TU** (31 ms). L'ho catturato da una sessione live di packet sniffer prima che la stazione base fosse dismessa. Quando ho provato a replicarlo sulle VAP guest dell'RBR760, ogni tentativo è fallito:

| Metodo | Comando | Risultato |
|--------|---------|-----------|
| `hostapd_cli SET beacon_int 31` | Restituisce OK | Beacon ancora a ~100 TU — ignorato dal firmware |
| `cfg80211tool ath02 beacon_int` | Comando non trovato | Non supportato su QCA full-offload |
| `iwpriv ath02 set_beacon` | Comando non trovato | Non supportato |

Il firmware Qualcomm QCA full-offload sull'RBR760 genera i beacon in modo indipendente. `hostapd` invia la configurazione all'avvio, ma dopo il firmware gestisce la generazione dei beacon in hardware. Cambiare l'intervallo beacon a runtime tramite `hostapd_cli` restituisce un codice OK — il layer software lo accetta — ma il firmware non riceve mai l'aggiornamento. La cattura live Nexmon ha confermato gli intervalli beacon trasmessi:

| VAP | BSSID | Intervallo beacon catturato | Impostato via hostapd_cli |
|-----|-------|----------------------------|---------------------------|
| Guest 2.4 GHz (ath02) | RBR760 | ~102–104 TU | 31 (ignorato) |
| Guest 2.4 GHz (satellite) | 9e:18:65:69:c9:81 | ~100 TU | N/A |
| Main 2.4 GHz (ath01) | 9e:18:65:6c:f6:38 | ~104 TU | Non modificato |

L'intervallo beacon guest predefinito di ~100 TU è integrato nel firmware e non può essere ridotto per corrispondere ai 31 TU della stazione base Arlo. Questa è una **limitazione hardware** del chipset Qualcomm QCA full-offload.

### La Stranezza del Periodo DTIM

Il periodo DTIM (Delivery Traffic Indication Map) indica alle stazioni in sleep ogni quanto svegliarsi per il traffico broadcast bufferizzato. DTIM=1 significa che ogni beacon porta un DTIM — le stazioni si svegliano ogni ~100 ms. DTIM=3 significa ogni terzo beacon — le stazioni si svegliano ogni ~300 ms.

Ho provato `cfg80211tool ath02 dtim_period 33` — un valore alto che permetterebbe alle telecamere di dormire per 33 intervalli beacon (~3.3 secondi) tra un risveglio DTIM e l'altro. I risultati sono stati contrastanti:

| VAP | BSSID | Risultato DTIM |
|-----|-------|----------------|
| Guest 2.4 GHz (satellite) | 9e:18:65:69:c9:81 | **DTIM=33 confermato** |
| Guest 2.4 GHz (RBR760) | 9e:18:65:6c:f6:38 | DTIM=3 (non aggiornato) |
| Main 2.4 GHz (RBR760) | 9e:18:65:6c:f5:1c | DTIM=3 (non aggiornato) |

La modifica DTIM è stata accettata sulla VAP guest del satellite ma non sulle VAP del router stesso. Un'altra manifestazione della stranezza QCA full-offload.

### Cosa Funziona Davvero: `inact=65535` e Lease DHCP

Dopo tutti gli esperimenti con intervallo beacon e DTIM, i parametri che funzionano sono quelli del Post 4:

```bash
cfg80211tool ath02 inact 65535
cfg80211tool ath21 inact 65535

cfg80211tool ath02 get_inact
# inact = 65535
cfg80211tool ath21 get_inact
# inact = 65535
```

Questi parametri agiscono a livello firmware — la radio Qualcomm li accetta perché sono parametri cfg80211 standard (a differenza di `beacon_int` che è gestito nello spazio di `hostapd`).

Il fix del lease DHCP guest dal Post 4 (`option lease 86400`) è altrettanto essenziale — senza di esso, le telecamere rinnovano il DHCP ogni 30 minuti.

### La Verifica Notturna: Le Telecamere si Disconnettono a 100 TU

La configurazione sopra è necessaria ma non sufficiente. Nella notte del 19–20 agosto 2026, ho eseguito un test completo con l'RBR760 come unico AP per le telecamere (stazione base originale spenta). Il risultato è stato una disconnessione completa:

- **Conteggio stazioni VAP guest:** `num_sta[0]=0` su entrambe le VAP guest — zero telecamere associate.
- **Lease DHCP guest:** Zero lease attivi sulla rete guest.
- **Registrazioni telecamere:** Zero eventi di registrazione nei log di `arlo-cam-api` durante la notte.
- **Dati batteria:** Statici/cached dalle 22:22 — le telecamere hanno smesso di riportare dati.
- **Ultimo BSSID noto:** L'API della telecamera riportava `9E:18:65:6C:F6:38` (una VAP guest satellite) — le telecamere si sono connesse brevemente, poi disconnesse senza più riassociarsi.

La cattura live Nexmon ha confermato la causa: l'RBR760 trasmette beacon a ~100 TU nonostante `hostapd_cli SET beacon_int 31` restituisca OK. Le telecamere richiedono un intervallo beacon di 31 TU per mantenere la sincronizzazione deep sleep con l'AP. A 100 TU, la mancata corrispondenza dell'intervallo beacon causa la perdita di sincronizzazione e la caduta dell'associazione. Il valore 31 TU non è solo una preferenza prestazionale — è un **requisito hardware del firmware della telecamera**.

I dati di consumo batteria nella Parte 1 sono stati raccolti mentre le telecamere erano connesse a una vera stazione base Arlo VMB4000. La misurazione di ~8 giorni / 0.52%/h proviene da quella configurazione. Sull'RBR760 con beacon predefiniti a 100 TU, le telecamere non rimangono connesse abbastanza a lungo per misurare un consumo a regime.

### Stato Verificato Dopo la Configurazione

| Parametro | Comando | Previsto | Stato |
|-----------|---------|----------|-------|
| Timeout inattività | `cfg80211tool ath02 get_inact` | `inact = 65535` | Confermato |
| Timeout inattività (5 GHz guest) | `cfg80211tool ath21 get_inact` | `inact = 65535` | Confermato |
| Intervallo beacon | Cattura live Nexmon | ~100 TU (predefinito) | Confermato — non modificabile |
| Periodo DTIM | Beacon frame catturato | 3 (router) / 33 (satellite) | Parzialmente modificabile |
| Lease DHCP guest | `grep lease /tmp/dni_udhcpd_guest.conf` | `option lease 86400` | Confermato |
| Associazione telecamere | `num_sta[0]` sulle VAP guest | Zero | **Non connesse** |
| Registrazione telecamere | `curl http://192.168.1.48:5000/device` | Nessuna telecamera registrata | **Non registrate** |

### Realtà Misurata

| Configurazione | Comportamento effettivo |
|--------------|------------------------|
| Vera stazione base Arlo VMB4000 | Telecamere connesse. Consumo ~0.52%/h quando armate. |
| WiFi guest RBR760 (inact=65535, lease=86400) | Telecamere si associano brevemente, poi si disconnettono. Nessuna connettività stabile. |
| WiFi guest RBR760 (config predefinita) | Stesso comportamento — l'intervallo beacon è sempre 100 TU. |

Le correzioni `inact` e lease DHCP del Post 4 sono ancora valide per qualsiasi AP che *possa* corrispondere all'intervallo beacon di 31 TU, ma sull'RBR760 specificamente, la limitazione hardware le rende inefficaci — le telecamere non rimangono mai connesse abbastanza a lungo per trarne beneficio.

## Cosa Rimane

L'unico parametro non replicabile è l'**intervallo beacon di 31 TU**. Tutto il resto — timeout inattività, lease DHCP, periodo DTIM — è configurabile o irrilevante. Il chipset Qualcomm QCA full-offload sull'RBR760 non può essere forzato a trasmettere beacon a 31 TU. L'interfaccia `hostapd_cli` accetta il comando ma il firmware lo ignora. Non è un bug software; è una limitazione architetturale dell'hardware.

Inoltre, l'**IE specifico del fornitore** (brevetti USA 11722963, 20240147057, 12413852) che trasporta i seriali delle telecamere nel beacon non è ancora replicato. Questo IE dice alle telecamere in sleep "la tua associazione è ancora valida, resta in sleep" — senza di esso e senza l'intervallo beacon corrispondente, le telecamere non hanno motivo di fidarsi dell'AP fai-da-te.

## Opzioni per il Futuro

Con la limitazione hardware confermata, ecco le opzioni realistiche:

1. **Usare la vera stazione base Arlo per il WiFi, instradare Ethernet verso il server.** La stazione base Arlo gestisce il layer WiFi (beacon 31 TU, IE fornitore, mai disassocia) mentre il server `arlo-cam-api` gestisce il layer applicativo. Collegate la porta Ethernet della stazione base al vostro switch LAN e il server comunica con le telecamere attraverso il bridge di rete della stazione base. La durata della batteria corrisponde alle specifiche originali.

2. **Usare telecamere alimentate via USB.** Se le telecamere hanno una fonte di alimentazione costante (cavo USB, pannello solare o il cavo di ricarica Arlo), il limite dell'intervallo beacon non ha importanza — la telecamera si riconnette ogni volta che si sveglia e non c'è batteria da consumare. Il WiFi guest dell'RBR760 funziona perfettamente per streaming e registrazione quando la telecamera è alimentata.

3. **Accettare il consumo della batteria con il WiFi della stazione base originale.** Se tenete le telecamere sul WiFi della stazione base Arlo ma usate `arlo-cam-api` su un server per il layer applicativo (nessun abbonamento cloud), la durata della batteria è quella originale: 3–6 mesi disarmate / ~8 giorni armate. Questo è il "meglio di entrambi i mondi" — nessuna dipendenza dal cloud, durata batteria originale.

4. **Accettare l'instabilità di connessione sull'RBR760.** Le telecamere si riassociano periodicamente (ogni ~30 minuti quando si svegliano per il glacial timer), quindi lo streaming on-demand funziona. Il compromesso è una latenza di ~3–5 minuti per gli eventi di movimento e una reportistica della batteria inaffidabile.

Per la mia installazione in produzione, ho scelto l'opzione 1: la stazione base Arlo è nell'armadio di rete, la sua Ethernet è collegata allo stesso switch del mio mini PC, e `arlo-cam-api` comunica con le telecamere attraverso il bridge della stazione base. L'RBR760 gestisce il resto del WiFi di casa. Questo dà lo stack auto-ospitato senza il costo sulla batteria.

---

*Questo è un quinto post bonus nella serie Arlo. Lo stack completo:*

- *[Post 1](/it/sostituire-la-stazione-base-arlo-con-un-router-netgear-orbi/) — livello di rete: sostituzione gateway, DHCP, DNAT*
- *[Post 2](/it/auto-ospitare-arlo-cam-api-correzioni-e-miglioramenti/) — livello applicativo: arlo-cam-api self-hosting*
- *[Post 3](/it/integrare-arlo-auto-ospitato-con-home-assistant/) — livello automazione: integrazione Home Assistant*
- *[Post 4](/it/correggere-la-durata-della-batteria-delle-telecamere-arlo-a-livello-wifi/) — livello WiFi: timeout inattività e lease DHCP*
- *Questo post — misurazioni consumo batteria, dati sniffati stazione base e limitazione intervallo beacon*

*Il repository di accompagnamento su [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station) contiene tutti i file di configurazione menzionati nella serie.*