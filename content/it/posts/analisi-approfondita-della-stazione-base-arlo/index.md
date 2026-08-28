---
title: 'Analisi approfondita della stazione base Arlo: consumo batteria, pacchetti sniffati e configurazione del router'
categories:
- smart-home
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
description: 'Un''analisi bonus e approfondita della stazione base Arlo: misurazioni reali del consumo della batteria con telecamere armate e disarmate, dati dei pacchetti sniffati che mostrano come la stazione base mantiene le telecamere in sleep, e il limite dell''intervallo beacon dell''RBR760 che impedisce una replica fai-da-te completa.'
cover: cover.jpg
showHero: true
---

Questo è un quinto articolo non previsto nella serie Arlo — un'analisi bonus e approfondita dei dati che ho raccolto prima e durante i quattro post della serie. Se mi avete seguito fin qui, sapete che lo stack a livello di rete funziona per la registrazione e lo streaming. Quello che la serie non aveva previsto è *quanto* il comportamento WiFi della stazione base influenzi l'autonomia della batteria, e cosa ho scoperto quando ho messo un packet sniffer tra le telecamere e la vera stazione base Arlo.

> Tutti i valori in questo post derivano da misurazioni reali effettuate su due telecamere VMC4040P (JARDIN1, PORTAIL), una VMC4040P che è rimasta offline per più di 24 ore (ENTREE), e un RBR760 in produzione con firmware V6.3.8.5. I numeri di serie delle telecamere sono mascherati con `XXXXXXXXXXXX`. Il gateway `172.14.1.1` è la costante del protocollo wire Arlo ed è lasciato in chiaro.

## Parte 1 — Test sul Consumo della Batteria

La serie di quattro articoli si è conclusa con le correzioni a livello WiFi — timeout di inattività e lease DHCP — ma le misurazioni del consumo della batteria che hanno motivato l'intera indagine meritano un post dedicato. Ecco esattamente cosa ho misurato, telecamera per telecamera.

### Metodologia

Quattro telecamere sullo stesso WiFi guest del RBR760, tutte con il firmware Arlo originale. Configurazione del test:

- **Periodo di baseline** (24 ore): tutte le telecamere disarmate, nessun evento di movimento, nessuno streaming RTSP.
- **Periodo armed** (variabile): telecamere armate in una scena con rilevamento del movimento attivo ma senza eventi di movimento registrati.
- **Test sull'intervallo beacon** (per telecamera): intervallo beacon di `arlo-cam-api` impostato a 100 secondi (il valore predefinito nel codice originale) contro 3600 secondi (il valore che ho introdotto nelle PR del Post 2).

Lo strumento di misura era uno script di polling che interrogava l'endpoint `/device/<serial>` di `arlo-cam-api` ogni 60 secondi e registrava il campo `BatPercent` — lo stesso campo mostrato dalla dashboard di Home Assistant.

> **Una nota sul "beacon interval" in questa parte.** In questo contesto, il termine indica il probe *a livello applicativo* che `arlo-cam-api` invia a ciascuna telecamera, misurato in **secondi**. È una cosa diversa dall'intervallo del *frame* beacon 802.11 discusso nelle Parti 2 e 3, che è misurato in **TU** (1 TU = 1.024 ms, quindi 31 TU ≈ 31 ms e 100 TU ≈ 102 ms). Sono due parametri indipendenti: il primo è la cadenza di keepalive della stazione base emulata, il secondo è la cadenza di broadcast della radio.

### Baseline — Tutte le Telecamere Disarmate

Con tutte e quattro le telecamere disarmate, nessun probe beacon, nessun RTSP, nessun evento di movimento:

| Telecamera | SOC iniziale | SOC finale (24h) | Tasso di consumo |
|------------|--------------|-------------------|------------------|
| J1 (JARDIN1) | 77% | 76% | ~0.04%/h |
| J2 (JARDIN2) | 65% | 64% | ~0.04%/h |
| PORTAIL | 42% | 41% | ~0.04%/h |
| ENTREE | 31% | 31% | ~0.00%/h |

Tutte le telecamere hanno perso praticamente zero carica. Il calo dell'1% sulle tre telecamere attive rientra nel rumore di misura dell'ADC del sensore della batteria. ENTREE, che ha trascorso l'intero periodo di 24 ore offline (non associata a nessun AP), ha mostrato una linea piatta — a dimostrazione che il controller della batteria ha di per sé un'autoscarica trascurabile quando la telecamera è davvero in sleep.

**Conclusione:** quando una telecamera è in deep sleep (nessuna associazione WiFi, nessun risveglio PIR, nessun beacon), il consumo della batteria è di fatto zero. Ogni punto percentuale di consumo osservato è causato da qualcosa che impedisce il deep sleep.

### Armed — Il Problema del Beacon a 100 Secondi

Le stesse telecamere, ora armate in una scena con rilevamento del movimento attivo. Nessun evento di movimento è stato registrato durante il test — le telecamere erano puntate su scene statiche.

| Telecamera | Intervallo | SOC iniziale | Durata | SOC finale | Tasso di consumo |
|------------|------------|--------------|--------|------------|-------------------|
| J1 | Beacon 100s | 77% | ~8h (notte) | 2% | ~9.4%/h |
| PORTAIL | Beacon 100s | 42% | 10h | ~3% | ~3.9%/h |
| PORTAIL | Beacon 3600s | 41% | 30h | ~21% | ~0.67%/h |
| ENTREE | offline | 31% | 24h+ | 31% | ~0.00%/h |

J1 è stato il caso peggiore perché si trovava su una VAP satellite con segnale debole — è entrato in un boot loop al 2% e ci è rimasto finché non l'ho resettato fisicamente. PORTAIL a 100 secondi ha perso il 3.9%/h — cioè 25.5 ore per scaricarsi del tutto. A 3600 secondi (un'ora), il consumo è sceso allo 0.67%/h — un miglioramento di 5.8x, che garantisce oltre 6 giorni di autonomia anche *armata*.

Il meccanismo è semplice:

> Ogni volta che il beacon interroga la telecamera, questa si risveglia dal deep sleep, elabora la risposta al probe, stabilisce che non c'è movimento da segnalare e torna in sleep. L'intervallo di 100 secondi teneva la telecamera in un ciclo di light sleep e wake che consumava circa 3.5 mA in media. L'intervallo di 3600 secondi permetteva alla telecamera di restare nello stato di deep sleep a circa 0.2 mA per la maggior parte dell'ora.

### La Soglia del Deep Sleep

La scoperta cruciale è stata una soglia rigida nel firmware della telecamera. Quando l'intervallo del beacon superava circa 200 secondi, la telecamera entrava in una modalità di sleep qualitativamente diversa:

- **Intervallo < 200s:** la telecamera si sveglia a ogni probe, la radio WiFi resta in uno stato di power-save attivo (modalità PM2 nei log del firmware), il sensore PIR resta acceso e la CPU resta in uno stato di light idle. Consumo: 3–10%/h a seconda dell'intensità del segnale.
- **Intervallo > 200s:** la telecamera entra in deep sleep pieno. La radio WiFi passa a uno stato di solo ascolto con risveglio basato sul DTIM, il sensore PIR viene campionato solo a ogni intervallo DTIM e la CPU entra in uno stato power-gated. Consumo: 0.5–1%/h o meno.

La soglia di 200 secondi non è documentata da nessuna parte nella knowledge base Arlo né nei repo della community. È stata scoperta in modo empirico, aumentando l'intervallo del beacon a passi di 50 secondi e osservando il delta di `BatPercent` per ora su PORTAIL.

L'analisi successiva dei log del firmware della telecamera ha confermato i due stati di sleep:

```
no dtimskip setting
set PM2 mode, ret 0        # <--- light sleep, radio semi-attiva
glacial_timer 3600, ret 0  # <--- timer deep sleep impostato a 3600s
clear event, ret 0
enter sleep mode success
```

La modalità `PM2` è la modalità power-save 2 di Qualcomm Atheros (risveglio periodico basato sul DTIM). Il `glacial_timer` impostato a 3600 secondi è il timer interno della telecamera che determina per quanto tempo può restare in deep sleep prima di doversi risvegliare per un controllo completo dello stato — anche in assenza di un probe beacon. Quel valore di 3600 secondi combacia esattamente con l'intervallo beacon di 3600 secondi come impostazione ottimale: il controllo interno della telecamera si attiva con la stessa frequenza con cui la stazione base la interroga.

### Il Punto Chiave

L'ottimizzazione della batteria con il maggiore impatto per le telecamere Arlo su uno stack self-hosted è: **impostare l'intervallo del beacon a 3600 secondi e mantenerlo lì.** Il valore predefinito di 100 secondi nel codice originale di `arlo-cam-api` era stato ricavato per reverse engineering dal probe di *rilevamento del movimento* della vera stazione base, non dal probe di *gestione della batteria*. La vera stazione base usa due intervalli di probe diversi a seconda dello stato della telecamera, e quello dedicato al risparmio energetico è molto più lungo di 100 secondi.

## Parte 2 — Dati Sniffati dalla Vera Stazione Base

Prima di sostituire la stazione base, ho eseguito una packet capture sulla vera stazione base Arlo VMB4000 per capire cosa si dicono effettivamente le telecamere e la stazione base. Il riassunto: molto poco. Il protocollo wire Arlo è quasi silenzioso tra un evento di registrazione e l'altro.

### La Sequenza di Boot

Quando una telecamera VMC4040P si accende e si connette al WiFi della stazione base, la sequenza completa dal boot al sleep è la seguente:

```
WLAN autenticata
Lease DHCP acquisito (IP: 192.168.2.103, GW: 172.14.1.1)
TCP SYN → 172.14.1.1:4000  (telecamera → stazione base, canale di controllo registerSet)
Payload JSON di registrazione (comando registerSet)
Ack dalla stazione base
sm_enter_idle_state          → la telecamera entra in command-parse, poi idle
Shutdown JSON server         → la telecamera spegne il suo command listener
dtimskip disable
set PM2 mode                 → power-save WiFi
glacial_timer 3600           → timer deep sleep
enter sleep mode success     → la telecamera è ora in sleep
```

L'intero ciclo, dal boot al deep sleep, dura circa 3–5 secondi. Il payload JSON di registrazione è un messaggio `registerSet` che include il numero di serie della telecamera, la versione del firmware e il SOC corrente della batteria.

Ecco il pacchetto TCP SYN grezzo tratto dalla cattura, annotato:

```
0000: a4 11 62 85 c8 1e  |  dst MAC (WiFi telecamera)
      94 18 65 69 c9 81  |  src MAC (stazione base, lato telecamera)
      08 00               |  EtherType IPv4
0010: 45 00 00 3c         |  header IPv4
      50 c5 40 00         |
      3e 06 7b d8         |
      ac 0e 01 01         |  IP sorgente: 172.14.1.1 (stazione base)
      c0 a8 02 67         |  IP destinazione: 192.168.2.103 (telecamera)
0020: c3 ea               |  porta sorgente: 50154 (stazione base)
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

Nota bene la direzione: è la stazione base ad aprire la sessione RTSP verso la telecamera. La telecamera espone il proprio live stream sulla porta 554 (`/live`) e una seconda terminazione RTSP sulla porta 555 (`/live_sec`). La telecamera stessa apre solo il canale di controllo sulla porta 4000 (`registerSet`), quello mostrato nella sequenza di boot qui sopra.

### Cosa Trasmette la Stazione Base (Quando Trasmette Qualcosa)

Tra un evento di registrazione e l'altro, la stazione base è di fatto silenziosa. L'unica trasmissione periodica è il frame beacon 802.11. Un beacon standard della Arlo VMB4000:

- **Intervallo beacon:** 31 TU (31 ms) — l'intervallo serrato che il firmware della telecamera richiede per mantenere la sincronizzazione del deep sleep. Non è configurabile sull'hardware Arlo.
- **Vendor IE (Information Element specifico del vendor):** il beacon include un Information Element proprietario che elenca i numeri di serie delle telecamere associate. È il meccanismo con cui la stazione base comunica alle telecamere in sleep "sono ancora qui e la vostra associazione è valida" senza richiedere che le telecamere inviino acknowledgement.
- **Periodo DTIM:** annunciato come DTIM 1 (ogni beacon porta un DTIM), che indica alle telecamere in sleep quando risvegliarsi per il traffico broadcast bufferizzato.

Il vendor IE è documentato nei brevetti USA 11722963, 20240147057 e 12413852 — tutti assegnati a Netgear / Arlo Technologies. Il formato dell'IE è:

```
Element ID: 221 (Vendor Specific)
Length: variabile
  OUI: 00:0a:52 (Netgear)
  Type: 0x01 (informazioni stazione base Arlo)
  Data: [elenco_numeri_serie_telecamere]
```

I brevetti descrivono questo meccanismo come un "indicatore di presenza della stazione" che permette all'AP di mantenere l'associazione con le stazioni in sleep senza che queste debbano risvegliarsi e inviare un keepalive. È la caratteristica brevettata che rende le telecamere Arlo efficienti dal punto di vista energetico sulla vera stazione base — ed è completamente assente negli AP WiFi consumer.

### Perché gli AP Consumer Uccidono le Batterie

Un AP WiFi consumer (o l'RBR760 *senza* la configurazione della Parte 3) gestisce le stazioni in sleep in modo molto diverso:

1. **L'AP invia un Null-Function Poll** alla telecamera dopo il timeout di inattività (300s di default sull'RBR760).
2. **La telecamera è in deep sleep e non risponde.**
3. **L'AP la disassocia e deautentica.**
4. **La telecamera si sveglia, non trova alcuna associazione ed esegue l'intero ciclo dal boot al deep sleep** — consumando circa 10 secondi di radio e CPU attive a ~350 mA invece dei ~3 µA che consumerebbe dormendo.
5. **La telecamera ottiene un nuovo lease DHCP** (ogni 30 minuti con il lease originale).
6. **La telecamera si ri-registra** presso `arlo-cam-api`.

La vera stazione base non fa nulla di tutto ciò. Non disassocia mai una telecamera in sleep. Il vendor IE nel beacon dice alla telecamera "la tua associazione è ancora valida, resta in sleep". La telecamera non deve mai svegliarsi per un probe di keepalive. L'AP non deve mai interrogare la telecamera per verificare che sia viva.

Il vendor IE brevettato non è replicabile con i tool standard `hostapd` o `cfg80211tool` sull'RBR760 — non supportano l'inserimento di IE vendor-specific arbitrari nei frame beacon. Possiamo però avvicinarci al comportamento con la giusta combinazione di parametri 802.11 standard, che è esattamente l'argomento della Parte 3.

## Parte 3 — Nuova Configurazione del Router Netgear per Replicare il Comportamento della Stazione Base

La stazione base Arlo standard fa alcune cose che mantengono le telecamere in sleep:

1. **Intervallo beacon:** 31 TU (31 ms) — beacon molto rapidi per tenere le telecamere strettamente sincronizzate.
2. **Timeout di inattività:** di fatto infinito — le telecamere non vengono mai disassociate. Lo replichiamo con `inact=65535` (dal Post 4).
3. **Lease DHCP:** sufficientemente lungo da evitare che la telecamera debba rinnovarlo durante il deep sleep. Usiamo 86400 secondi (24 ore).
4. **Vendor IE:** non replicabile con i tool standard.

Ma replicare i parametri *esatti* del beacon della stazione base sull'RBR760 non è affatto banale. L'architettura Qualcomm QCA full-offload di questo router genera i frame beacon nel firmware, non in `hostapd`. Alcuni parametri che `hostapd_cli` dichiara di accettare vengono silenziosamente ignorati dall'hardware. Ecco cosa ho scoperto mettendo uno sniffer WiFi sulle VAP guest reali.

### La Scoperta sull'Intervallo Beacon

La vera stazione base Arlo VMB4000 usa un intervallo beacon di **31 TU** (31 ms). L'ho catturato durante una sessione live di packet sniffing prima che la stazione base venisse dismessa. Quando ho provato a replicarlo sulle VAP guest dell'RBR760, ogni tentativo è fallito:

| Metodo | Comando | Risultato |
|--------|---------|-----------|
| `hostapd_cli SET beacon_int 31` | Restituisce OK | Beacon ancora a ~100 TU — ignorato dal firmware |
| `cfg80211tool ath02 beacon_int` | Comando non trovato | Non supportato su QCA full-offload |
| `iwpriv ath02 set_beacon` | Comando non trovato | Non supportato |

Il firmware Qualcomm QCA full-offload sull'RBR760 genera i beacon in autonomia. `hostapd` invia la configurazione all'avvio, ma poi è il firmware a gestire la generazione dei beacon in hardware. Cambiare l'intervallo beacon a runtime tramite `hostapd_cli` restituisce un codice OK — il layer software lo accetta — ma il firmware non riceve mai l'aggiornamento. La cattura live con Nexmon ha confermato gli intervalli beacon effettivamente trasmessi:

| VAP | BSSID | Intervallo beacon catturato | Impostato via hostapd_cli |
|-----|-------|------------------------------|---------------------------|
| Guest 2.4 GHz (ath02) | RBR760 | ~102–104 TU | 31 (ignorato) |
| Guest 2.4 GHz (satellite) | 9e:18:65:69:c9:81 | ~100 TU | N/A |
| Main 2.4 GHz (ath01) | 9e:18:65:6c:f6:38 | ~104 TU | Non modificato |

L'intervallo beacon guest predefinito di ~100 TU è integrato nel firmware e non può essere abbassato fino ai 31 TU della stazione base Arlo. È una **limitazione hardware** del chipset Qualcomm QCA full-offload.

### L'Anomalia del Periodo DTIM

Il periodo DTIM (Delivery Traffic Indication Map) indica alle stazioni in sleep ogni quanto risvegliarsi per il traffico broadcast bufferizzato. DTIM=1 significa che ogni beacon porta un DTIM — le stazioni si risvegliano ogni ~100 ms. DTIM=3 significa un beacon ogni tre — le stazioni si risvegliano ogni ~300 ms.

Ho provato `cfg80211tool ath02 dtim_period 33` — un valore alto che avrebbe permesso alle telecamere di dormire per 33 intervalli beacon (~3.3 secondi) tra un risveglio DTIM e l'altro. I risultati sono stati contrastanti:

| VAP | BSSID | Risultato DTIM |
|-----|-------|----------------|
| Guest 2.4 GHz (satellite) | 9e:18:65:69:c9:81 | **DTIM=33 confermato** |
| Guest 2.4 GHz (RBR760) | 9e:18:65:6c:f6:38 | DTIM=3 (non aggiornato) |
| Main 2.4 GHz (RBR760) | 9e:18:65:6c:f5:1c | DTIM=3 (non aggiornato) |

La modifica del DTIM è stata accettata sulla VAP guest del satellite ma non sulle VAP del router stesso. Un'altra manifestazione dell'anomalia del QCA full-offload.

### Cosa Funziona Davvero: `inact=65535` e Lease DHCP

Dopo tutti gli esperimenti con intervallo beacon e DTIM, i parametri che funzionano restano quelli del Post 4:

```bash
cfg80211tool ath02 inact 65535
cfg80211tool ath21 inact 65535

cfg80211tool ath02 get_inact
# inact = 65535
cfg80211tool ath21 get_inact
# inact = 65535
```

Questi parametri agiscono a livello firmware — la radio Qualcomm li accetta perché sono parametri cfg80211 standard (a differenza di `beacon_int`, che è gestito nello spazio di `hostapd`).

Anche la correzione del lease DHCP guest del Post 4 (`option lease 86400`) è essenziale — senza di essa, le telecamere rinnovano il DHCP ogni 30 minuti.

### La Verifica Notturna: Le Telecamere si Disconnettono a 100 TU

La configurazione appena descritta è necessaria ma non sufficiente. Nella notte tra il 19 e il 20 agosto 2026, ho eseguito un test completo con l'RBR760 come unico AP per le telecamere (la stazione base originale era spenta). Il risultato è stato una disconnessione completa:

- **Conteggio stazioni sulle VAP guest:** `num_sta[0]=0` su entrambe le VAP guest — zero telecamere associate.
- **Lease DHCP guest:** zero lease attivi sulla rete guest.
- **Registrazioni delle telecamere:** zero eventi di registrazione nei log di `arlo-cam-api` durante la notte.
- **Dati batteria:** statici o in cache dalle 22:22 — le telecamere hanno smesso di inviarli.
- **Ultimo BSSID noto:** l'API delle telecamere riportava `9E:18:65:6C:F6:38` (una VAP guest satellite) — le telecamere si sono connesse brevemente, poi si sono disconnesse senza più riassociarsi.

La cattura live con Nexmon ha confermato la causa: l'RBR760 trasmette beacon a ~100 TU nonostante `hostapd_cli SET beacon_int 31` restituisca OK. Le telecamere richiedono un intervallo beacon di 31 TU per mantenere la sincronizzazione del deep sleep con l'AP. A 100 TU, la differenza di intervallo beacon fa perdere la sincronizzazione alle telecamere, che lasciano cadere l'associazione. Il valore di 31 TU non è una semplice preferenza prestazionale — è un **requisito hardware del firmware della telecamera**.

I dati di consumo della batteria della Parte 1 sono stati raccolti mentre le telecamere erano collegate a una vera stazione base Arlo VMB4000. La misurazione di circa 8 giorni / 0.52%/h deriva da quella configurazione. Sull'RBR760, con i beacon di default a 100 TU, le telecamere non restano collegate abbastanza a lungo da consentire di misurare un consumo a regime.

### Stato Verificato Dopo la Configurazione

| Parametro | Comando | Atteso | Stato |
|-----------|---------|--------|--------|
| Timeout di inattività | `cfg80211tool ath02 get_inact` | `inact = 65535` | Confermato |
| Timeout di inattività (5 GHz guest) | `cfg80211tool ath21 get_inact` | `inact = 65535` | Confermato |
| Intervallo beacon | Cattura live Nexmon | ~100 TU (default) | Confermato — non modificabile |
| Periodo DTIM | Frame beacon catturato | 3 (router) / 33 (satellite) | Parzialmente modificabile |
| Lease DHCP guest | `grep lease /tmp/dni_udhcpd_guest.conf` | `option lease 86400` | Confermato |
| Associazione telecamere | `num_sta[0]` sulle VAP guest | Zero | **Non collegate** |
| Registrazione telecamere | `curl http://192.168.1.48:5000/device` | Nessuna telecamera registrata | **Non registrate** |

### Realtà Misurata

| Configurazione | Comportamento effettivo |
|----------------|------------------------|
| Vera stazione base Arlo VMB4000 | Telecamere collegate. Consumo ~0.52%/h quando armate. |
| WiFi guest RBR760 (inact=65535, lease=86400) | Le telecamere si associano per un breve periodo, poi si disconnettono. Nessuna connettività stabile. |
| WiFi guest RBR760 (configurazione di default) | Stesso comportamento — l'intervallo beacon resta 100 TU. |

Le correzioni di `inact` e del lease DHCP del Post 4 restano valide per qualsiasi AP che *sia in grado di* replicare l'intervallo beacon di 31 TU, ma sull'RBR760 in particolare la limitazione hardware le rende inefficaci — le telecamere non restano mai collegate abbastanza a lungo per trarne beneficio.

## Cosa Resta

L'unico parametro non replicabile è l'**intervallo beacon di 31 TU**. Tutto il resto — timeout di inattività, lease DHCP, periodo DTIM — è configurabile o irrilevante. Il chipset Qualcomm QCA full-offload sull'RBR760 non può essere forzato a trasmettere beacon a 31 TU. L'interfaccia `hostapd_cli` accetta il comando, ma il firmware lo ignora. Non è un bug software; è un limite architetturale dell'hardware.

In più, il **vendor IE** (brevetti USA 11722963, 20240147057, 12413852), che trasporta i numeri di serie delle telecamere nel beacon, non è ancora replicato. Questo IE dice alle telecamere in sleep "la tua associazione è ancora valida, resta in sleep" — senza di esso e senza il corrispondente intervallo beacon, le telecamere non hanno motivo di fidarsi di un AP fai-da-te.

## Opzioni per Andare Avanti

Confermata la limitazione hardware, ecco le opzioni realistiche:

1. **Usare la vera stazione base Arlo per il WiFi e instradare Ethernet verso il server.** La stazione base Arlo gestisce il livello WiFi (beacon a 31 TU, vendor IE, mai disassocia) mentre il server `arlo-cam-api` gestisce il livello applicativo. Collegate la porta Ethernet della stazione base al vostro switch LAN e il server comunicherà con le telecamere attraverso il bridge di rete della stazione base. L'autonomia della batteria torna ai valori delle specifiche originali.

2. **Usare telecamere alimentate via USB.** Se le telecamere hanno un'alimentazione costante (cavo USB, pannello solare o cavo di ricarica Arlo), il limite sull'intervallo beacon è irrilevante — la telecamera si riconnette a ogni risveglio e non c'è una batteria da scaricare. Il WiFi guest dell'RBR760 funziona perfettamente per streaming e registrazione quando la telecamera è alimentata.

3. **Accettare il consumo della batteria usando il WiFi della stazione base originale.** Se tenete le telecamere sul WiFi della stazione base Arlo ma usate `arlo-cam-api` su un server per il livello applicativo (senza abbonamento cloud), l'autonomia è quella originale: 3–6 mesi disarmate / ~8 giorni armate. È il "meglio di entrambi i mondi": nessuna dipendenza dal cloud, autonomia originale.

4. **Accettare l'instabilità di connessione sull'RBR760.** Le telecamere si riassociano periodicamente (ogni ~30 minuti quando si risvegliano per il glacial timer), quindi lo streaming on-demand funziona. Il compromesso è una latenza di ~3–5 minuti sugli eventi di movimento e letture della batteria inaffidabili.

Per il mio impianto di produzione ho scelto l'opzione 1: la stazione base Arlo è nell'armadio di rete, la sua Ethernet è collegata allo stesso switch del mio mini PC e `arlo-cam-api` comunica con le telecamere attraverso il bridge della stazione base. L'RBR760 gestisce tutto il resto del WiFi di casa. Questo permette di avere lo stack self-hosted senza la penalizzazione della batteria.

---

*Questo è un quinto post bonus nella serie Arlo. Lo stack completo:*

- *[Post 1](/it/sostituire-la-stazione-base-arlo-con-un-router-netgear-orbi/) — livello di rete: sostituzione del gateway, DHCP, DNAT*
- *[Post 2](/it/auto-ospitare-arlo-cam-api-correzioni-e-miglioramenti/) — livello applicativo: self-hosting di arlo-cam-api*
- *[Post 3](/it/integrare-arlo-auto-ospitato-con-home-assistant/) — livello di automazione: integrazione con Home Assistant*
- *[Post 4](/it/correggere-la-durata-della-batteria-delle-telecamere-arlo-a-livello-wifi/) — livello WiFi: timeout di inattività e lease DHCP*
- *Questo post — misurazioni del consumo della batteria, dati sniffati dalla stazione base e limitazione dell'intervallo beacon*

*Il repository di accompagnamento su [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station) contiene tutti i file di configurazione citati nella serie.*
