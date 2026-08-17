---
title: 'Sostituire la Stazione Base Arlo con un Router Netgear Orbi'
tags:
- netgear
- arlo
- orbi
- rbr760
- stazione-base
- domotica
- iot
- router
- wifi-mesh
- casa-intelligente
date: '2026-08-18T10:00:00.000000+00:00'
slug: sostituire-la-stazione-base-arlo-con-un-router-netgear-orbi
translationKey: arlo-base-station-replacement
url: /it/sostituire-la-stazione-base-arlo-con-un-router-netgear-orbi/
aliases:
- /sostituire-la-stazione-base-arlo-con-un-router-netgear-orbi
categories:
- Casa Intelligente
- DIY
- Networking
- Hardware
description: 'Come ho sostituito la stazione base Arlo proprietaria con un router mesh Netgear Orbi RBR760 rootato via telnet, in modo che le mie telecamere potessero usare il WiFi mesh esistente.'
cover: cover.jpg
showHero: true
---

Nel 2020, quando mi sono trasferito nella casa attuale, ho acquistato un sistema di sicurezza Arlo: una stazione base singola e tre telecamere Pro 4 sparse nel giardino. La casa è piuttosto grande e con una sola stazione base non è facile mantenere tutte le telecamere perfettamente funzionanti. Ogni tanto una telecamera a caso perdeva la connessione, e la più lontana sembrava scaricare la batteria molto più velocemente delle altre — spendeva troppa energia lottando con il segnale WiFi debole proveniente dalla stazione nello studio al piano di sopra. Così ho deciso di provare il mesh Netgear Orbi che già possedevo, un router e due satelliti, per migliorare la copertura WiFi delle telecamere. Vi suona familiare?

Questo articolo è il primo di una serie di tre in cui documento cosa ho fatto al riguardo. Coprirò qui solo il **livello di rete**: come fare in modo che un Netgear Orbi RBR760 (il router mesh che già possedevo) si spacci per la stazione base Arlo abbastanza bene da permettere alle telecamere di connettersi, registrarsi e fare streaming — senza il cloud Arlo e senza il dubbio adattatore WiFi USB che il resto di internet raccomanda. Il repository di accompagnamento su [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station) contiene tutti i file di configurazione menzionati qui.

> **Una nota sulla redazione.** In tutto questo articolo, le password admin del router, i veri numeri di serie delle telecamere, gli indirizzi MAC, e alcuni IP LAN di produzione sono stati sostituiti da placeholder come `<vostra_password_router>`, `XXXXXXXXXXXX`, `XX:XX:XX:XX:XX:XX`, e `192.168.1.x`. L'unico valore "magico" che lascio intenzionalmente in chiaro è `172.14.1.1` — quel valore fa parte del protocollo Arlo stesso ed è integrato nel firmware di ogni telecamera. Se foste stati un ingegnere Arlo nel 2014, lo riconoscereste a colpo d'occhio.

## Il Problema

Le telecamere Arlo si collegano esclusivamente alla rete WiFi della stazione base Arlo — **non** si collegano al vostro WiFi domestico. La stazione base crea una rete 2.4 GHz dedicata (SSID del tipo `NETGEAR99` o `ARLO_VMB_XXXXXXXXX`) che le telecamere usano per tutta la comunicazione. È una scelta di design: Arlo possiede il firmware da entrambi i lati e la stazione base è un sottile convertitore di protocollo che finge di essere "il cloud" sulla vostra rete locale.

Se avete una singola stazione base Arlo in un angolo della casa, le telecamere dall'altra parte ricevono un segnale scarso e perdono la connessione. Il vostro mesh Orbi (router + 2 satelliti) copre tutta la casa magnificamente, ma le telecamere non possono usarlo — vedono solo l'SSID Arlo, e parleranno solo con la scatola che lo trasmette.

La risposta del fornitore a questo è "comprate una seconda stazione base". La risposta open-source è "sostituite sia il WiFi che la scatola di protocollo con cose che già possedete". Il resto di questo articolo è la risposta open-source, con tutta la tubatura LAN dettagliata.

## Il Trucco

Questo non è davvero un hack — è una particolarità documentata di come Arlo ha progettato le sue telecamere per trovare una stazione base. Quando una telecamera Arlo si avvia e si unisce al suo SSID WiFi noto, non riceve un nome DNS e non fa ARP per un host chiamato `basestation`. Fa qualcosa di molto più semplice:

> **L'opzione DHCP 3 le dice qual è l'IP del gateway, e lei apre una connessione TCP raw verso quell'IP sulla porta 4000.** Niente DNS, niente mDNS, nessuna negoziazione di protocollo.

Se quella connessione riesce, la telecamera presume che il gateway *sia* la stazione base. Una volta che la stazione base risponde nel formato wire corretto, la registrazione è completa e la telecamera va in sleep aspettando gli eventi.

Il valore esatto del gateway non importa — ciò che importa è *che il valore che il server DHCP fornisce sia anche un IP che la telecamera può raggiungere*. In una configurazione Arlo predefinita la stazione base è il gateway della sua piccola sottorete (di solito `192.168.1.1` per le scatole più vecchie o sottoreti RFC1918 per le più nuove), quindi tutto funziona per caso. Il valore ben noto `172.14.1.1` è la scelta "quello che usiamo" di Arlo; la mia configurazione lo riproduce perché le telecamere erano state originariamente accoppiate con una stazione base che lo usava, e cambiarlo in volo provocherebbe tutta una serie di disiscrizione/re-iscrizione.

Una volta che accettate questa unica premessa, il resto è solo ordinaria idraulica di router Linux:

1. Trasmettete un SSID che le telecamere già conoscono.
2. Fornite l'IP del gateway che si aspettano via opzione DHCP 3.
3. Sul router, fate DNAT di quel gateway IP:4000 verso una piccola scatola Linux che esegue l'emulatore di stazione base.
4. Fatelo sopravvivere a un reboot.

Tutto ciò che segue è uno di questi quattro passi più l'inevitabile debugging.

> **Fonti per il trucco.** Il reverse-engineering è il lavoro di [Meatballs1/arlo-cam-api](https://github.com/Meatballs1/arlo-cam-api) (l'originale), [brianschrameck/arlo-cam-api](https://github.com/brianschrameck/arlo-cam-api) (un fork mantenuto con packaging corretto), e [frandallfarmer/arlo-open-base-station](https://github.com/frandallfarmer/arlo-open-base-station) (una stazione base DIY completa con una UI web costruita sopra lo stesso nucleo di protocollo). Il metodo di abilitazione telnet viene da [bkerler/netgear_telnet](https://github.com/bkerler/netgear_telnet). La discussione della community che alla fine mi ha fatto provare l'opzione DHCP 3 è sul subreddit [r/frigate_nvr](https://www.reddit.com/r/frigate_nvr/), e l'articolo ufficiale Arlo KB sul protocollo è [qui](https://kb.arlo.com/). Cito tutti questi link di nuovo sotto man mano che la sezione rilevante arriva.

## Cosa Tenete / Cosa Perdete

Un sistema Arlo del 2014 fa molto: registrazione cloud, zone di attività, rilevamento persona/animale/veicolo, E911, geofencing, scheduling, audio bidirezionale, notifiche push, app mobile. Uno stack self-hosted del 2026 costruito su un router generico e un Raspberry Pi mantiene il sottoinsieme *utile* e scarta il resto. Il confronto dettagliato viene direttamente dalle mie note di deploy:

| Caratteristica | Cloud Arlo | Questo stack |
|----------------|-----------|-------------|
| Stream RTSP live | No (relay attraverso server Arlo) | Sì (porta 554 diretta) |
| Registrazione su movimento | Sì (clip 5, 10, 30 s) | Sì (durata variabile) |
| Storage locale | No | Sì (sul server) |
| Registrazione cloud (CVR) | Sì (a pagamento) | No (sostituito da NVR a scelta) |
| Zone di attività | Sì (a pagamento) | No (usate Frigate o NVR esterno) |
| IA persona/animale/veicolo | Sì (a pagamento) | No (usate Frigate con un Coral) |
| Audio bidirezionale | Sì | Parziale (sperimentale, non in questo articolo) |
| Chiamata di emergenza E911 | Sì | No |
| Geofencing | Sì | No (da scriptare da Home Assistant) |
| Scheduling arm/disarm | Sì | Sì (cron Home Assistant) |
| Notifiche push | Sì (app Arlo) | Sì (Home Assistant Companion + ntfy) |
| App mobile | Sì | No (usate Home Assistant Companion) |
| Monitoraggio batteria | Sì | Sì (API REST) |
| Viewer web | Sì | Sì (`arlo-viewer` da open-base-station) |
| HomeKit / HomeKit Secure Video | Sì | Sì (via Scrypted, vedi Post 3) |
| Nessun abbonamento | No | Sì (gratis per sempre) |

In altre parole: ogni funzionalità che potete replicare localmente è replicata localmente. Quelle che hanno bisogno di un cloud — CVR, IA, E911, polish dell'app mobile — sono eliminate, e questo è il punto.

La prossima sezione è quella su cui tutti fanno domande prima di iniziare.

## Analisi del Consumo Batteria

Se cercate su internet "Arlo Raspberry Pi base station", la prima cosa che leggete è "non fatelo, le batterie muoiono in pochi giorni". Questo è vero *e* non ha quasi nulla a che fare con la scelta del router. Ci sono due cause completamente indipendenti di consumo batteria, e confonderle è il motivo per cui il 90% dei post del forum su questo argomento finisce con qualcuno che compra una telecamera PoE.

### Causa 1 — Polling RTSP continuo (il vero killer)

Le telecamere Arlo a batteria sono progettate per dormire il 99% del tempo e svegliarsi solo per eventi di movimento. Il loro consumo medio è nell'ordine di microampere a cifra singola, motivo per cui una cella da 2440 mAh dura 3-6 mesi.

Lo streaming RTSP continuo mantiene la radio WiFi, l'encoder video, il sensore PIR e la CPU principale svegli 24/7. Il calcolo:

- Funzionamento normale: la telecamera dorme 2-5 ore, si sveglia 5-10 s per evento
- RTSP continuo: la batteria si scarica in giorni/settimane invece di mesi

Se avete bisogno di registrazione 24/7, le telecamere Arlo a batteria sono l'hardware sbagliato. Comprate una telecamera PoE (Reolink, Dahua, Hikvision, Amcrest) per quello. Le telecamere Arlo sono progettate solo per la registrazione event-based. Mischiare le due strategie è la causa n°1 di "ho fatto funzionare questa cosa e le batterie sono morte in 48 ore".

### Causa 2 — Hardware WiFi sbagliato

La seconda causa è indipendente da qualsiasi server RTSP ed è quella che è correggibile: la scelta dell'AP WiFi. Specificamente, l'approccio popolare "usate un adattatore WiFi USB sul vostro Raspberry Pi".

Se usavate un adattatore WiFi USB consumer (soprattutto chipset RTL8812AU come l'Alfa AWUS036ACH) sul Raspberry Pi, il WiFi stesso stava disconnettendo le telecamere ogni ~30 minuti. Ogni riconnessione scarica significativamente la batteria.

| Hardware WiFi | Intervallo di registrazione telecamera | Impatto batteria |
|---------------|----------------------------------------|------------------|
| WiFi USB (RTL8812AU) | Ogni 30 minuti | Drain elevato |
| TP-Link Omada EAP225 | Ogni 2-5 ore | Normale |
| Netgear Orbi RBR760 | **Atteso: 2-5 ore** | **Normale** |

### Perché l'Orbi RBR760 è diverso

L'Orbi RBR760 è un sistema WiFi mesh di qualità enterprise, non un adattatore USB consumer:

- Supporta 802.11ax (WiFi 6) con corretta negoziazione power-save
- Ha le caratteristiche ShortPreamble, STBC, RIFS e AMPDU corrette
- Gestisce correttamente il power management 802.11 per client a batteria
- Mantiene connessioni WiFi stabili durante il deep sleep della telecamera

L'implementazione WiFi dell'Orbi è equivalente o migliore di quella della stazione base Arlo. L'autonomia della batteria dovrebbe essere comparabile alla configurazione Arlo originale.

### Autonomia batteria attesa

| Modello telecamera | Con stazione base Arlo | Con WiFi guest Orbi |
|--------------------|-----------------------|----------------------|
| Arlo Pro 2 | 3-6 mesi | 3-6 mesi (atteso) |
| Arlo Pro 3 | 3-6 mesi | 3-6 mesi (atteso) |
| Arlo Pro 4 | 3-6 mesi | 3-6 mesi (atteso) |
| Arlo Ultra 2 | 2-4 mesi | 2-4 mesi (atteso) |

### Come usare le telecamere senza scaricare la batteria

| Approccio | Impatto batteria | Note |
|-----------|------------------|------|
| Registrazione event-based (arlo-cam-api) | Normale | La telecamera si sveglia su movimento, registra, dorme |
| Snapshot manuale via API | Basso | Uno snapshot alla volta |
| Streaming RTSP (occasionale) | Medio | Stream 30-60 s, poi disconnessione |
| Streaming RTSP (continuo) | **Molto alto** | Scarica la batteria in giorni — *non fatelo mai* |
| Registrazione continua Frigate | **Molto alto** | Scarica la batteria in giorni — *non fatelo mai* |
| Frigate + `go2rtc` (on-demand only) | Normale | Usate `go2rtc` con config `on_demand` |

La configurazione MediaMTX che introduco nel Post 2 è configurata per `sourceOnDemand: yes` con `sourceOnDemandCloseAfter: 1s` — la porta RTSP della telecamera è aperta solo per i pochi secondi in cui Home Assistant sta renderizzando la picture-glance, poi chiusa di nuovo. Questo mantiene il consumo medio vicino alla riga "normale".

## Prerequisiti

Prima di iniziare, confermate cosa avete e quale firmware state eseguendo.

### Hardware

| Componente | Richiesto | Raccomandato |
|------------|-----------|--------------|
| Netgear Orbi RBR760 | Sì | Firmware V6.3.1.0 – V6.3.8.5 |
| Satelliti Orbi (RBS760) | Opzionale | Per copertura estesa |
| Server Linux | Sì | Raspberry Pi 4 (2 GB+) o mini-PC N100 |
| Storage USB | Opzionale | Per le registrazioni (se storage locale) |
| Cavo di rete | Sì | Per collegare il server alla porta LAN Orbi |

### Software

| Software | Scopo |
|----------|-------|
| [bkerler/netgear_telnet](https://github.com/bkerler/netgear_telnet) | Abilita telnet su RBR760 |
| [Meatballs1/arlo-cam-api](https://github.com/Meatballs1/arlo-cam-api) o [brianschrameck/arlo-cam-api](https://github.com/brianschrameck/arlo-cam-api) | Emulatore stazione base |
| Python 3.7+ | Runtime per arlo-cam-api |
| ffmpeg | Grabber per snapshot (Post 2) |
| nmap (opzionale) | Testare quali porte sono aperte |
| Client telnet | Qualsiasi cosa parli RFC 854 |

### Range firmware testato

Tutto questo write-up è stato sviluppato contro **RBR760 V6.3.8.5 (Chaos Calmer, `rtm-6.3.8.5+r49254`)**. Il metodo di abilitazione telnet funziona da V6.3.1.0 a V6.3.8.5 inclusi; al di fuori di quel range i cifrari in `bkerler/netgear_telnet` avranno probabilmente bisogno di patch. **Non aggiornate a V7** — il protocollo è cambiato e non ho visto nessuno riottenere telnet su V7.

### Informazioni di rete da raccogliere

Prima di iniziare, annotate:

- **SSID stazione base Arlo** (es. `ARLO_VMB_XXXXXXXXX` o `NETGEAR99`)
- **IP gateway stazione base Arlo** (tipicamente `172.14.1.1` o `192.168.1.1`)
- **IP del vostro RBR760** (predefinito: `<router-ip>`)
- **Indirizzo MAC del vostro server** (per lease DHCP statico)
- **Indirizzo MAC del vostro RBR760** (Advanced > Advanced Home > Router Information > MAC Address)

Tutti questi valori saranno incollati in vari posti nelle prossime sezioni.

## Passo 1 — Abilitare Telnet su RBR760

Questo è l'unico passo "hack" ed è semplice. L'Orbi esegue un OpenWrt customizzato sotto una UI web Netgear, e il firmware *include* un daemon telnet — ma il daemon non è avviato di default, e lo scambio di password che il daemon usa per autenticare è cifrato con una chiave per router che la GUI pubblica non espone mai.

[bkerler/netgear_telnet](https://github.com/bkerler/netgear_telnet) implementa quello scambio. Usa un attacco known-plaintext contro il flusso di auth del router che è stato pubblicato anni fa e funziona ancora per il firmware attuale.

### 1.1 Clonare il tool

```bash
git clone https://github.com/bkerler/netgear_telnet.git
cd netgear_telnet
pip3 install pycryptodome
```

Il tool ha bisogno di `pycryptodome` perché implementa lo scambio AES per router localmente invece di chiedere al router di rivelare la chiave.

### 1.2 Abilitare telnet

Ottenete il MAC br0 del router dalla GUI: **Advanced > Advanced Home > Router Information > MAC Address**. Poi eseguite:

```bash
python3 telnet-enable.py <router-ip> XX:XX:XX:XX:XX:XX admin 'vostra_password_router'
```

Dovreste ottenere un messaggio di successo in pochi secondi. Se ottenete `auth failed`, ricontrollate il MAC e la password — la password è la password admin del router, non la PSK WiFi.

### 1.3 Disabilitare gli aggiornamenti automatici (critico!)

Collegatevi in telnet **adesso** e disabilitate gli aggiornamenti auto del firmware. Un aggiornamento cancellerà l'accesso telnet e tutte le vostre customizzazioni, e non le recupererete senza rieseguire il tool sopra — che può o non può funzionare contro il nuovo firmware.

```bash
telnet <router-ip>
# login: admin / vostra_password_router

nvram set orbi_auto_upgrade=0
nvram set auto_check_for_upgrade=0
nvram set auto_update=0
nvram commit

# Verifica
nvram show | grep auto_
# orbi_auto_upgrade=0
# auto_check_for_upgrade=0
# auto_update=0
```

Questo committa sulla NVRAM e sopravvive ai reboot. Lo stesso set `nvram` è menzionato in [gist.github.com/joshkitt](https://gist.github.com/joshkitt/a8dd1b7dcf6d66a2cf58a5ce117a1547) che è il riferimento della community più citato per questo trucco.

### 1.4 Verificare l'accesso telnet

```bash
telnet <router-ip>
# Dovreste vedere un prompt di shell root (#)
```

Il prompt che ottenete è **root**, non `admin`. Il router esegue telnetd come root, il che spiega in parte perché "non eseguire `passwd`" è una regola ferrea (vedi Troubleshooting). Se mai eseguite `passwd` sull'RBR760, la password viene resettata a qualcosa che il tool telnet-enable non può calcolare, e l'unico fix è un factory reset tramite il pulsante posteriore.

> **Un'altra cosa:** telnet non sopravvive a un reboot del router. Dopo ogni ciclo di alimentazione dovete rieseguire `telnet-enable.py` prima di potervi ricollegare in telnet. Il Post 3 vi mostrerà un job cron `@reboot` sul server che fa esattamente quello.

## Passo 2 — Catturare SSID e PSK Arlo

Dovete conoscere l'SSID *esatto* e la WPA-PSK che le telecamere stanno attualmente usando. Il modo più pulito è chiederlo a loro — le stazioni base Arlo parlano WPS, e lo stesso protocollo WPS può essere indotto a rivelare la PSK fingendosi un'altra scatola Arlo.

### Metodo A — Cattura WPS sulla stazione base Arlo originale (raccomandato)

Su una macchina Linux con una scheda WiFi (es. il vostro Raspberry Pi):

```bash
# Costruire una config wpa_supplicant che dichiara di essere un enrollee WPS Arlo
cat > /tmp/wpa.conf << 'EOF'
ctrl_interface=/var/run/wpa_supplicant
ctrl_interface_group=0
update_config=1
device_name=NTGRDEV
manufacturer=broadcom
EOF

# Fermare NetworkManager così non combatte per la radio
sudo systemctl stop NetworkManager

# Connettersi all'SSID della stazione base Arlo con quel profilo enrollee
sudo wpa_supplicant -t -Dwext -i wlan0 -c /tmp/wpa.conf

# In un altro terminale:
sudo iwconfig wlan0 essid ARLO_VMB_XXXXXXXXX
sudo wpa_cli -i wlan0 wps_pbc
# Ora premere il pulsante Sync sulla stazione base Arlo
```

Se ha successo, la WPA-PSK appare in `/tmp/wpa.conf` dopo pochi secondi. Le righe `device_name=NTGRDEV` e `manufacturer=broadcom` non sono a caso — le stazioni base Arlo si identificano come Netgear (NTGRDEV è il nome device enrollee WPS Netgear) e usano internamente WPS Broadcom. Spoofare entrambi è ciò che rende la scatola Arlo disposta a parlarci.

### Metodo B — Leggere l'etichetta sulla stazione base Arlo

Se avete accesso fisico alla stazione base Arlo, SSID e password sono stampati sull'etichetta bianca sul fondo. Assomigliano a:

```
SSID:     ARLO_VMB_XXXXXXXXX
Password: a-bunch-of-random-chars
```

### Metodo C — Annotare l'SSID dall'app Arlo

Se l'app Arlo funziona ancora, l'SSID è in **Settings > My Devices > [base station] > WiFi Settings**. Il PSK può essere esportato su alcune revisioni firmware ma non tutte, quindi il Metodo A è l'unico approccio universalmente affidabile.

### Cosa vi serve alla fine

Annotate questi esattamente — case-sensitive, nessuno spazio iniziale/finale:

```bash
ARLO_SSID="ARLO_VMB_XXXXXXXXX"   # <- esatto, case-sensitive
ARLO_PASSWORD="<come stampato>"  # <- esatto, case-sensitive
```

Le telecamere rifiuteranno il roaming se uno dei valori differisce da quello che avevano memorizzato. L'ho imparato a mie spese dopo un typo su un carattere che mi è costato un'ora sprecata di "perché la telecamera vede ancora il vecchio SSID nella sua scan list?".

## Passo 3 — Configurare la Rete Guest dell'Orbi

Ora inizia il bello. Cloneremo l'SSID Arlo sul WiFi guest dell'Orbi così che le telecamere vedano due reti con lo stesso nome e (speriamo) preferiscano la nostra.

La rete guest dell'Orbi è speciale: ha un suo bridge (`br-guest`), una sua sottorete (`192.168.2.0/24` di default), un suo server DHCP (`dni_guest_udhcpd`, non dnsmasq), e una sua zona firewall con `forward=REJECT`. Tutti questi vincoli esistono per ragioni di sicurezza nel firmware residenziale, e li affronteremo uno per uno nelle prossime sezioni.

### 3.1 Collegarsi in telnet al router

```bash
telnet <router-ip>
# login: admin / vostra_password_router
```

Dovreste essere a una shell root. Se non riuscite ad entrare, tornate al Passo 1.

### 3.2 Leggere gli SSID guest attuali

```bash
uci get wireless.Guest2.ssid
uci get wireless.Guest5.ssid
```

`Guest2` è il VAP guest 2.4 GHz, `Guest5` è il VAP guest 5 GHz. (Nota: `Guest5` in realtà non esiste come VAP sul firmware RBR760 — è referenziato in UCI ma solo il 2.4 GHz viene trasmesso. Le telecamere Arlo sono solo 2.4 GHz quindi va bene, ma spiega perché alcuni post del forum vi dicono di impostare entrambe le chiavi.)

### 3.3 Farli corrispondere alla stazione base Arlo

```bash
uci set wireless.Guest2.ssid='ARLO_VMB_XXXXXXXXX'
uci set wireless.Guest5.ssid='ARLO_VMB_XXXXXXXXX'

# Impostare la stessa password della stazione base Arlo
uci set wireless.Guest2.key='vostra_password_arlo'
uci set wireless.Guest5.key='vostra_password_arlo'

uci commit wireless
wifi
```

Il reload `wifi` alla fine fa salire il nuovo SSID. Dovreste vedere `ath02` riapparire nell'output di `iw dev` in pochi secondi.

### 3.4 Verificare che la rete guest stia trasmettendo

```bash
iw dev ath02 info  # Interfaccia guest 2.4GHz (ath02)
iw dev ath21 info  # Interfaccia guest 5GHz (ath21, potrebbe non esistere)
```

Output atteso per `ath02`:

```
Interface ath02
    ifindex 14
    wdev 0x...
    addr XX:XX:XX:XX:XX:XX
    type monitor
    wiphy 1
    channel 1 (2412 MHz), width: 40 MHz
    SSID: ARLO_VMB_XXXXXXXXX
```

Anche un telefono o laptop dovrebbe vedere `ARLO_VMB_XXXXXXXXX` nella lista WiFi adesso (senza il suffisso "Guest", perché l'SSID è esattamente quello Arlo).

### 3.5 Trovare il bridge della rete guest

```bash
brctl show
ip addr show br-guest
```

Sull'RBR760 il bridge guest è `br-guest`, e il suo IP è `192.168.2.1/24` di default. Quell'IP è quello che il server DHCP guest dell'Orbi fornisce — e *non* è il valore che le telecamere finiranno per usare, come spiega la prossima sezione.

## Passo 4 — DHCP e DNAT su RBR760

Se il resto di questo articolo fosse un normale tutorial OpenWrt, questa sezione sarebbe un singolo `uci set` e un `/etc/init.d/dnsmasq restart`. Non lo è. Tre cose rendono il firmware Orbi diverso dall'OpenWrt stock, e ognuna di esse può silenziosamente rompere la registrazione delle telecamere se non sapete dove guardare.

### 4.1 Il daemon proprietario `dni_guest_udhcpd` (UCI è ignorato)

Sull'OpenWrt stock, la rete guest è solo un'altra interfaccia con una sezione `dhcp` in `/etc/config/dhcp`. Sull'RBR760 il DHCP guest **non** è servito da `dnsmasq`. È servito da un daemon userspace proprietario Netgear chiamato `dni_guest_udhcpd`, e quel daemon legge la sua config da `/tmp/dni_udhcpd_guest.conf` (non da UCI).

La conseguenza pratica è drammatica ed è la singola più grande fonte di lamentele "ho seguito la guida e le telecamere non si registrano" sul subreddit Orbi:

> **Qualsiasi cosa mettiate in `uci set dhcp.lan.dhcp_option='3,...'` o `uci set dhcp.guest.dhcp_option='3,...'` viene silenziosamente ignorata per la rete guest.** UCI e `dnsmasq` sono disaccoppiati dal percorso DHCP guest interamente.

Il workaround ufficiale è scrivere l'opzione direttamente nel file di config del daemon proprietario e riavviarlo. Mostrerò lo script completo in §4.5 — l'estratto rilevante è:

```bash
# La config DHCP guest NON È /etc/config/dhcp — è /tmp/dni_udhcpd_guest.conf
# che viene letto da /sbin/dni_guest_udhcpd (un daemon proprietario Netgear).
# Modificare UCI qui è futile; dovete riscrivere il file di config.

cat /tmp/dni_udhcpd_guest.conf
# Contenuto predefinito:
#   interface br-guest
#   start 192.168.2.100
#   end 192.168.2.254
#   option router 192.168.2.1   <-- deve cambiare in 172.14.1.1
#   option dns 192.168.2.1      <-- deve cambiare in 1.1.1.1
#   option lease 86400
#   ...
```

> **Una nota sulla persistenza.** `/tmp/dni_udhcpd_guest.conf` vive in `tmpfs`, quindi viene rigenerato a ogni boot. Il trucco in §4.5 è di sovrascriverlo da uno script di avvio che viene eseguito *dopo* lo script init Netgear che lo rigenera. Per questo il nostro script si chiama `S99arlo` (ordine di avvio 99) e non `S40arlo` (l'ordine 40 correrebbe in gara con l'init Netgear).

Potete anche dire a livello UCI di smettere di provare a gestire il DHCP guest:

```bash
uci set dhcp.guest=dhcp
uci set dhcp.guest.ignore='1'
uci commit
```

Questo è cintura e bretelle — UCI stava già ignorando il pool guest, ma questo ferma UCI dal loggare warning ogni volta che dnsmasq viene ricaricato.

### 4.2 Il trucco del gateway virtuale `172.14.1.1/24` (conta solo l'opzione DHCP 3)

La telecamera Arlo non si cura realmente di cosa "vale" l'IP del gateway — si cura che l'IP che ha ricevuto tramite l'opzione DHCP 3 sia un IP a cui può aprire una connessione TCP sulla porta 4000. Sembra facile, ma sul firmware Orbi il bridge guest ha un suo IP (`192.168.2.1`) e non potete semplicemente cambiarlo: cambiare l'IP del bridge cambierebbe anche l'indirizzo che appare nella riga `option router` del server DHCP guest (sempre il daemon sbagliato, ma il valore conta ancora), e romperebbe ogni altro client guest che ha già appreso il vecchio gateway via ARP.

Il trucco è aggiungere un **secondo IP** al bridge guest come alias, e dire al server DHCP che il secondo IP è il gateway:

```bash
# 1. Aggiungere l'IP gateway virtuale al bridge guest
ip addr add 172.14.1.1/24 dev br-guest
```

Poi riscrivere la config del daemon per fornire l'IP alias invece dell'IP del bridge:

```bash
# 2. Riscrivere option router a 172.14.1.1
sed -i "s/option router .*/option router 172.14.1.1/" /tmp/dni_udhcpd_guest.conf

# 3. Riscrivere option dns verso un vero DNS pubblico
sed -i "s/option dns .*/option dns 1.1.1.1/" /tmp/dni_udhcpd_guest.conf

# 4. Aggiungere un DNS secondario se non già presente
grep -q "1.0.0.1" /tmp/dni_udhcpd_guest.conf || \
    echo "option dns 1.0.0.1" >> /tmp/dni_udhcpd_guest.conf

# 5. Riavviare il daemon proprietario
kill -9 $(cat /var/run/dni_guest_udhcpd.pid 2>/dev/null) 2>/dev/null
/sbin/dni_guest_udhcpd /tmp/dni_udhcpd_guest.conf
```

> **Perché l'alias sul bridge.** Quando una telecamera ottiene un lease dal daemon e riceve `option router 172.14.1.1`, la telecamera fa ARP per `172.14.1.1` sul bridge guest. Poiché `172.14.1.1/24` è configurato come alias su `br-guest`, il bridge risponde all'ARP con il MAC del router stesso — il frame della telecamera viene consegnato al router, dove il nostro DNAT (prossima sezione) lo cattura. La telecamera non ha bisogno (e non verifica) che `172.14.1.1` sia anche un host reale raggiungibile su internet. Ha solo bisogno di un IP che risponda al SYN che invia sulla porta 4000.

Il risultato è che il frame di registrazione della telecamera viene consegnato all'Orbi, l'Orbi riscrive la destinazione verso il server, il server risponde, e la connessione è stabilita. Dal punto di vista della telecamera il gateway è "la stazione base" — che è esattamente quello che vuole.

### 4.3 La particolarità del firewall ODM (`-I FORWARD 1`)

Su un OpenWrt stock la catena `FORWARD` è la sola cosa che fa da gate al traffico inter-zone, e un paio di `iptables -A FORWARD -j ACCEPT` è tutto ciò che serve. L'RBR760 ha un secondo strato firewall davanti: le catene proprietarie Netgear ODM (`ODM_FORWARD`, `ODM_FORWARD_TOP`, ecc.) vengono inserite *sopra* la catena `FORWARD` utente al boot, e implementano un isolamento stretto guest-verso-LAN (`forward=REJECT`) che sopravvive anche ai cambiamenti di regole UCI.

Se fate questo — che è la cosa naturale da fare:

```bash
# SBAGLIATO: la regola finisce in fondo a FORWARD, dopo ODM_FORWARD
iptables -A FORWARD -i br-guest -d 192.168.1.X -j ACCEPT
```

la regola viene aggiunta in fondo a `FORWARD`, il che significa che la regola ODM `REJECT` sopra di lei viene eseguita per prima e droppa il frame. La connessione va in timeout, la telecamera va in sleep, e passate la prossima ora a chiedervi perché il vostro test DNAT con `wget` funziona ma la telecamera non si connette mai.

Il fix è inserire la regola utente *sopra* la catena ODM, alla posizione 1 della catena FORWARD:

```bash
# CORRETTO: inserito in cima, prima che qualsiasi catena ODM venga eseguita
iptables -I FORWARD 1 -i br-guest -d 192.168.1.X -j ACCEPT
iptables -I FORWARD 1 -i br-lan -o br-guest -s 192.168.1.X -j ACCEPT
iptables -I FORWARD 1 -i br-lan -o br-guest -d 192.168.2.0/24 -j ACCEPT
```

Verificate con `iptables -L FORWARD -n -v --line-numbers` — le regole utente devono essere alle righe 1-3. Su questo firmware le catene ODM potrebbero non essere referenziate affatto in una catena `FORWARD` appena avviata (vengono cablate solo dopo certi eventi UCI/guest-zone); ciò che conta è che le vostre regole siano i primi ACCEPT nella catena. Se l'ordine è invertito, la telecamera non si registrerà.

### 4.4 NON usare SNAT sul percorso telecamera → server (loop hairpin)

Questo è il secondo errore più comune nei write-up della community. L'istinto viene da tutorial generici "telecamera dietro un router" dove l'autore aggiunge sia DNAT che SNAT per simmetria. Per Arlo quell'istinto è esattamente al contrario.

Considerate cosa succede se aggiungete ingenuamente SNAT al traffico telecamera → server:

```bash
# NON FATELO
iptables -t nat -A POSTROUTING -s 192.168.2.0/24 -d 192.168.1.X \
    -p tcp --dport 4000 -j SNAT --to-source 172.14.1.1
```

La telecamera invia un SYN da `192.168.2.4` verso `172.14.1.1:4000`. Il DNAT riscrive la destinazione verso il server (`192.168.1.X:4000`). Il frame raggiunge `POSTROUTING` e lo SNAT riscrive la sorgente in `172.14.1.1` (un IP locale del router). Il server riceve un SYN che *sembra* venire da `172.14.1.1:porta-casuale`. Lo stack TCP del server invia il SYN-ACK verso `172.14.1.1:porta-casuale` — che è l'**IP del router stesso**. Il router accetta il SYN-ACK localmente come un pacchetto destinato a sé stesso, non lo instrada mai verso l'esterno, e la connessione resta semplicemente in `SYN_RECV` finché la telecamera non si arrende.

Il sintomo è inequivocabile:

```bash
cat /proc/net/nf_conntrack | grep 4000
# SYN_RECV src=192.168.2.2 dst=192.168.1.X sport=CASUALE dport=4000
```

Quella singola riga è ciò che tutti quelli che inseguono "le telecamere si connettono al WiFi ma non si registrano mai" vedono nella tabella conntrack. Il fix è:

```bash
# Rimuovere la regola sbagliata
iptables -t nat -D POSTROUTING -s 192.168.2.0/24 -d 192.168.1.X \
    -p tcp --dport 4000 -j SNAT --to-source 172.14.1.1

# Flush delle voci conntrack scadute
conntrack -D -p tcp --dport 4000
```

> **L'asimmetria:** C'è *una* direzione dove lo SNAT **è** richiesto, ed è il percorso di ritorno: server → telecamera (es. chiamate REST `arm` e `pirled`). Le telecamere Arlo hanno un firewall interno che accetta connessioni solo dall'IP del gateway, quindi senza SNAT quegli endpoint restituiscono sempre `{"result": false}`. Lo script S99 (prossima sezione) gestisce questo — ma il percorso telecamera → server **non deve mai** essere SNATtato.

### 4.5 Lo script completo `S99arlo` (link + estratto)

Lo script di avvio completo, idempotente, che gestisce le particolarità Netgear è a [`rbr760/S99arlo`](https://github.com/mmornati/arlo-base-station/blob/main/rbr760/S99arlo) nel repository di accompagnamento. Sono 92 righe, commenti inclusi. L'estratto qui sotto è una versione semplificata per illustrazione; i tre bit non ovvi sono evidenziati.

```bash
#!/bin/sh /etc/rc.common
START=99   # viene eseguito DOPO tutti gli script init Netgear che toccano dni_guest_udhcpd

start() {
    GUEST_BR="br-guest"
    SERVER="192.168.1.X"        # l'IP LAN del vostro server
    GATEWAY="172.14.1.1"        # costante wire-protocol Arlo — NON cambiare

    # 1. Aggiunta IP alias idempotente (già presente? skip silenziosamente)
    ip addr add ${GATEWAY}/24 dev ${GUEST_BR} 2>/dev/null || true

    # 2. Riscrivere la config del daemon proprietario (NON UCI — vedi §4.1)
    sed -i "s/option router .*/option router ${GATEWAY}/" \
        /tmp/dni_udhcpd_guest.conf 2>/dev/null
    sed -i "s/option dns .*/option dns 1.1.1.1/" \
        /tmp/dni_udhcpd_guest.conf 2>/dev/null
    grep -q "1.0.0.1" /tmp/dni_udhcpd_guest.conf \
        || echo "option dns 1.0.0.1" >> /tmp/dni_udhcpd_guest.conf

    # 3. Riavviare dni_guest_udhcpd (leggerà la nuova config adesso)
    if [ -f /var/run/dni_guest_udhcpd.pid ]; then
        kill -9 $(cat /var/run/dni_guest_udhcpd.pid) 2>/dev/null
    fi
    /sbin/dni_guest_udhcpd /tmp/dni_udhcpd_guest.conf

    # 4. DNAT — telecamera → server (l'unico NAT di cui abbiamo bisogno su questo percorso)
    iptables -t nat -A PREROUTING -i ${GUEST_BR} -p tcp --dport 4000 \
        -j DNAT --to-destination ${SERVER}:4000
    iptables -t nat -A PREROUTING -i ${GUEST_BR} -p tcp --dport 4100 \
        -j DNAT --to-destination ${SERVER}:4100

    # 5. SNAT — server → telecamere (così le telecamere accettano arm/pirled
    #    dall'IP "gateway").
    #    NOTA: questa è la direzione OPPOSTA al loop hairpin sopra.
    #    Senza questo, le telecamere restituiscono {"result": false} su /arm e /pirled.
    iptables -t nat -A POSTROUTING -s ${SERVER} -d 192.168.2.0/24 \
        -j SNAT --to-source ${GATEWAY}

    # 6. Regole FORWARD — INSERIRE alla posizione 1, PRIMA delle catene ODM (§4.3)
    iptables -I FORWARD 1 -i ${GUEST_BR} -d ${SERVER} -j ACCEPT
    iptables -I FORWARD 1 -i br-lan -o ${GUEST_BR} -s ${SERVER} -j ACCEPT
    iptables -I FORWARD 1 -i br-lan -o ${GUEST_BR} -d 192.168.2.0/24 -j ACCEPT
}

stop() {
    :
}
```

Lo script va in `/etc/rc.d/S99arlo` e viene invocato a ogni boot. Per renderlo eseguibile e lanciarlo una volta:

```bash
chmod +x /etc/rc.d/S99arlo
/etc/rc.d/S99arlo start
```

Una spiegazione completa riga per riga vive a [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station); il file dello script è la fonte canonica.

### 4.6 Verificare le regole

```bash
# DNAT deve mostrare 2 righe (una per porta)
iptables -t nat -L PREROUTING -n -v | grep -E "4000|4100"

# Le regole FORWARD devono essere alle righe 1-3 (PRIMA delle catene ODM)
iptables -L FORWARD -n -v --line-numbers | head -10

# L'IP virtuale deve essere presente su br-guest
ip addr show br-guest | grep 172.14

# Il DHCP guest deve avere option router = 172.14.1.1
cat /tmp/dni_udhcpd_guest.conf | grep -E "router|dns"

# POSTROUTING deve avere ESATTAMENTE UNA regola SNAT (server → telecamere)
iptables -t nat -L POSTROUTING -n -v
```

Se le regole FORWARD non sono alle righe 1-3, rilanciate con `iptables -I FORWARD 1 ...` (non `-A`). Se lo SNAT manca o ha `-d ${SERVER}` invece di `-d 192.168.2.0/24`, le vostre chiamate REST arm/pirled restituiranno `false`.

## Passo 5 — Installare arlo-cam-api sul Server

Lo strato di rete è il focus di *questo* articolo. L'installazione di `arlo-cam-api` è il focus del *Post 2* — per contesto mostrerò il minimo che deve essere in esecuzione prima che le telecamere possano registrarsi.

Le dipendenze dei pacchetti Debian sul server:

```bash
sudo apt update
sudo apt install -y python3-pip python3-venv git ffmpeg
```

Poi clonare e installare:

```bash
git clone https://github.com/brianschrameck/arlo-cam-api.git
cd arlo-cam-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

`requirements.txt` minimo:

```text
Flask==1.1.4
pycryptodome
requests
```

Poi lanciarlo:

```bash
python server.py
# * Running on http://0.0.0.0:4000
# * REST API on http://0.0.0.0:5000
```

Per farlo sopravvivere ai reboot usiamo una unit systemd:

```ini
# /etc/systemd/system/arlo-cam-api.service
[Unit]
Description=Arlo Camera API Server
After=network.target

[Service]
Type=simple
User=arlo
WorkingDirectory=/home/arlo/arlo-cam-api
ExecStart=/home/arlo/arlo-cam-api/venv/bin/python server.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Abilitare e avviare:

```bash
sudo systemctl enable arlo-cam-api
sudo systemctl start arlo-cam-api
sudo systemctl status arlo-cam-api
```

Il Post 2 completo copre: `server.py` patchato per correggere il bug auto-register-on-restart, il handler di movimento `arlo-snapshot` a due endpoint, e il layout Docker Compose. Per questo articolo l'importante è che:

- La porta 4000 è bind e in ascolto sull'IP LAN del server
- Il server può raggiungere la sottorete telecamere (192.168.2.0/24) tramite le regole FORWARD dell'Orbi
- Il server restituisce un ack di registrazione Arlo valido a qualsiasi SYN sulla porta 4000

Se volete testare il percorso end-to-end prima di toccare le telecamere, fate questo dal server:

```bash
# Confermare che arlo-cam-api è attivo
curl http://192.168.1.X:5000/device

# Confermare che il DNAT è raggiungibile dal router stesso
ssh root@<router-ip> 'curl http://192.168.1.X:5000/status'

# Confermare una richiesta a forma di telecamera da un telefono sul WiFi guest
# (dopo che almeno una telecamera si è registrata)
curl -X POST http://192.168.1.X:5000/device/XXXXXXXXXXXX/arm \
     -H "Content-Type: application/json" \
     -d '{"arm": true}'
```

Se `device` restituisce `[]` non siete ancora registrati. Procedete al Passo 6.

## Passo 6 — Accoppiare le Telecamere

> **Gotcha Orbi critico — WPS non funziona sui VAP guest.**
>
> Il firmware RBR760 è un OpenWrt customizzato che esegue l'`hostapd` proprietario Netgear e il firewall ODM. **WPS Push Button Configuration (PBC) NON funziona sui VAP guest (`ath02`/`ath21`)** — il comando `wps_pbc` restituisce `FAIL`. WPS funziona solo sui VAP principali (`ath0`/`ath1`/`ath2`). Questo significa che il workflow "premere WPS sull'Orbi e sulla telecamera" che funziona per i router normali qui andrà silenziosamente in no-op.

Il workaround è usare la stazione base Arlo originale per l'accoppiamento WPS, poi spegnerla e lasciare che le telecamere si riconnettano alla rete guest Orbi (che ha lo *stesso* SSID e PSK).

### 6.1 Accoppiare con la stazione base Arlo originale (richiesto)

Per ogni telecamera:

1. **Accendere** la vostra stazione base Arlo originale
2. **Factory reset** di ogni telecamera (tenere premuto il pulsante Sync per 10-15 s finché il LED non lampeggia in arancione, poi rilasciare). Il lampeggio arancione significa che la telecamera è in modalità accoppiamento.
3. Premere **Sync sulla stazione base** (entro 2 minuti).
4. La telecamera si accoppia, il LED diventa blu brevemente, poi lampeggia.
5. La telecamera si associa all'SSID della stazione base (`ARLO_VMB_XXXXXXXXX`) e PSK.
6. **Spegnere** la stazione base originale (scollegarla).

### 6.2 Le telecamere si riconnettono alla rete guest Orbi

Dopo che la stazione base è spenta, le telecamere:

1. Perderanno la connessione entro 30-60 s.
2. Scansioneranno le reti WiFi con SSID `ARLO_VMB_XXXXXXXXX`.
3. Troveranno la rete guest Orbi che trasmette quell'SSID (stesso nome, stessa PSK).
4. Si assoceranno automaticamente.
5. Otterranno un IP via DHCP da `dni_guest_udhcpd` (es. `192.168.2.2`, `192.168.2.3`).
6. Riceveranno `option router 172.14.1.1` tramite l'opzione DHCP 3.
7. Apriranno una connessione TCP verso `172.14.1.1:4000`.
8. La regola DNAT riscrive la destinazione verso `192.168.1.X:4000`.
9. `arlo-cam-api` risponde nel protocollo Arlo e la registrazione è completata.

Questo processo richiede 1-5 minuti per telecamera. Tutte e tre le mie sono tornate online entro due minuti — nessuna ha avuto bisogno di un secondo tentativo WPS una volta che la stazione base è stata scollegata.

### 6.3 Verificare la connessione

Sull'RBR760:

```bash
# Controllare il file dei lease DHCP — gli IP delle telecamere appariranno qui
cat /tmp/dni_udhcpd_guest.leases
# 192.168.2.2 XX:XX:XX:XX:XX:XX XXXXXXXXXXXX *
# 192.168.2.3 XX:XX:XX:XX:XX:XX XXXXXXXXXXXX *
# 192.168.2.4 XX:XX:XX:XX:XX:XX XXXXXXXXXXXX *

# O controllare ARP sul bridge guest
arp -n -i br-guest
```

Sul server, confermare che `arlo-cam-api` le ha registrate:

```bash
curl http://localhost:5000/device | python -m json.tool
```

Output atteso:

```json
[
  {
    "friendly_name": "XXXXXXXXXXXX",
    "hostname": "VMC4040P-XXXXX",
    "ip": "192.168.2.2",
    "serial_number": "XXXXXXXXXXXX"
  },
  ...
]
```

Se `device` restituisce `[]` dopo 5 minuti, la causa più probabile è il bug SNAT-from-camera-direction di §4.4. Controllate `conntrack` per `SYN_RECV` e fate pulizia.

## Passo 7 — Rendere Tutto Persistente

> **Un gotcha universale.** I cambiamenti UCI (`uci commit`) sopravvivono ai reboot (sono memorizzati nell'overlay scrivibile). I cambiamenti NVRAM (`nvram commit`) sopravvivono ai reboot. Gli script `/etc/rc.d/` sopravvivono ai reboot. **Ma telnet no** — viene cancellato a ogni reboot, e dovete rieseguire `telnet-enable.py` per recuperarlo. Non c'è modo di aggirare questo senza re-flashare il router.

La checklist di persistenza:

| Elemento | Metodo | Sopravvive al reboot? |
|----------|--------|----------------------|
| Accesso telnet | Rieseguire `telnet-enable.py` | No |
| SSID guest | UCI commit (`uci commit wireless`) | Sì |
| Override DHCP guest | `/etc/rc.d/S99arlo` (`START=99`) | Sì (idempotente su tmpfs) |
| IP gateway virtuale | `/etc/rc.d/S99arlo` | Sì |
| iptables DNAT/SNAT | `/etc/rc.d/S99arlo` | Sì |
| Aggiornamento auto disabilitato | NVRAM commit (`nvram commit`) | Sì |
| `arlo-cam-api` lato server | servizio systemd (`arlo-cam-api.service`) | Sì |
| Registrazioni su disco | Mount persistente | Sì |

### 7.1 Creare uno script di riabilitazione telnet sul server

```bash
#!/bin/bash
# /home/arlo/re-enable-telnet.sh
# Da lanciare DOPO ogni reboot dell'RBR760.

cd /home/arlo/netgear_telnet
python3 telnet-enable.py <router-ip> XX:XX:XX:XX:XX:XX admin 'vostra_password_router'
```

Collegatelo al cron:

```bash
crontab -e
# Aggiungere questa riga:
@reboot sleep 30 && /home/arlo/re-enable-telnet.sh >> /tmp/arlo-telnet.log 2>&1
```

Lo sleep di 30 secondi è perché l'Orbi ci mette un po' a risalire dopo un reboot; lo script riproverà indefinitamente.

### 7.2 Verificare lo script S99 sul router

Dopo ogni reboot, una volta rientrati in telnet:

```bash
ls -la /etc/rc.d/S99arlo
# -rwxr-xr-x 1 root root 1234 Jul 17 10:00 S99arlo

# Controllare che non abbia errori di sintassi
sh -n /etc/rc.d/S99arlo

# Lanciarlo manualmente per essere sicuri
/etc/rc.d/S99arlo start

# Ri-verificare lo stato di iptables + IP + DHCP risultante
iptables -t nat -L PREROUTING -n -v | grep -E "4000|4100"
ip addr show br-guest | grep 172.14
```

Se le regole mancano dopo un reboot ma `S99arlo` è in `/etc/rc.d/`, allora sta gareggiando con l'init Netgear. Aumentate il numero di avvio (es. `S99arlo` → `S98arlo` è la direzione sbagliata; lo volete dopo gli script Netgear, provate quindi `S99arlo` poi `S991arlo`).

### 7.3 Cosa si perde con un aggiornamento firmware (tutto)

Vale la pena ripeterlo: **un aggiornamento firmware Netgear cancella tutto ciò che abbiamo fatto**. L'SSID torna al suo valore originale, il daemon DHCP si resetta, le catene iptables si svuotano, i commit NVRAM restano (bene) ma la chiave SSID guest viene resettata al default Netgear.

Dopo qualsiasi aggiornamento firmware:

1. Riabilitare telnet (potrebbe non funzionare contro il nuovo firmware).
2. Rilanciare tutti i comandi del Passo 3.
3. Riposizionare `/etc/rc.d/S99arlo` e fare `chmod +x`.
4. Rilanciare `/etc/rc.d/S99arlo start`.

Se il nuovo firmware è V7, siete bloccati — il tool telnet-enable non è noto per funzionare contro V7 e i post del forum del 2024 non hanno un metodo funzionante. Restate su V6.3.x.

## Passo 8 — Tweaks Telnet Opzionali

Una volta che avete telecamere funzionanti probabilmente vorrete fare tweak su alcune altre impostazioni sull'RBR760 che la GUI non espone. La lista completa vive nel mio repository di accompagnamento a [arlo-base-station/docs/lessons-learned.md](https://github.com/mmornati/arlo-base-station/blob/main/docs/lessons-learned.md); le tre che uso di più:

### 8.1 Disabilitare il DNS hijack

L'RBR760 è hardcoded per fornire il proprio IP (<router-ip>) come DNS via DHCP sulla *LAN principale*. Questo rompe il DNS split-horizon e rende Pi-hole impossibile. Fissare tramite la manopola UCI non documentata:

```bash
uci get network.globals.dns_hijack_enable
uci set network.globals.dns_hijack_enable='0'
uci commit
```

### 8.2 Forzare DNS reali tramite opzione DHCP 6 (LAN, non guest)

```bash
uci delete dhcp.@dnsmasq[0].dhcp_option 2>/dev/null
uci add_list dhcp.@dnsmasq[0].dhcp_option='6,1.1.1.1'
uci add_list dhcp.@dnsmasq[0].dhcp_option='6,1.0.0.1'
uci commit
/etc/init.d/dnsmasq restart
cat /tmp/etc/dnsmasq.conf | grep dhcp-option
```

Questo influenza solo la LAN principale — il DHCP guest resta `dni_guest_udhcpd` e ha il suo trattamento in `S99arlo`.

### 8.3 Aggiungere un lease DHCP statico per il server

```bash
uci add dhcp host
uci set dhcp.@host[-1].name='ARLO-SERVER'
uci set dhcp.@host[-1].mac='XX:XX:XX:XX:XX:XX'  # MAC server
uci set dhcp.@host[-1].ip='192.168.1.X'
uci commit
/etc/init.d/dnsmasq restart
```

Anche se il server è su una connessione cablata e il lease non è tecnicamente richiesto, avere un IP server stabile fa sì che le regole iptables DNAT sopravvivano alle rotazioni di MAC (es. sostituite il Pi con un N100).

## Troubleshooting

Lo strato di rete ha il suo catalogo di sette sapori di dolore. Il Post 3 raccoglierà tutto attraverso i tre articoli della serie; quelli specifici della rete sono sotto.

### 1. Le telecamere si connettono al WiFi ma non si registrano mai (SYN_RECV)

```bash
cat /proc/net/nf_conntrack | grep 4000
# SYN_RECV src=192.168.2.2 dst=192.168.1.X sport=CASUALE dport=4000
```

**Causa A — Lo SNAT nella direzione sbagliata sta causando un loop hairpin.** Rimuovete la regola sbagliata:

```bash
iptables -t nat -D POSTROUTING -d 192.168.1.X -p tcp --dport 4000 \
    -j SNAT --to-source 172.14.1.1 2>/dev/null
conntrack -D -p tcp --dport 4000
```

**Causa B — Le regole FORWARD sono in fondo alla catena, dopo ODM.** Re-inserire:

```bash
iptables -I FORWARD 1 -i br-guest -d 192.168.1.X -j ACCEPT
iptables -I FORWARD 1 -i br-lan -o br-guest -s 192.168.1.X -j ACCEPT
iptables -I FORWARD 1 -i br-lan -o br-guest -d 192.168.2.0/24 -j ACCEPT
```

### 2. L'accoppiamento WPS fallisce sul VAP guest

`hostapd_cli wps_pbc` su `ath02` restituisce `FAIL`. È voluto sul firmware RBR760. Usate la stazione base Arlo originale per l'accoppiamento (Passo 6) poi spegnetela.

### 3. La rete guest è stata disabilitata nella GUI

Questo a volte succede dopo gli aggiornamenti firmware. Riabilitare:

```bash
uci set wireless.Guest2.disabled='0'
uci set wireless.Guest5.disabled='0'
uci commit wireless
wifi
```

### 4. Regole iptables perse dopo reboot

Verificate che lo script sia nel posto giusto e sia eseguibile:

```bash
ls -la /etc/rc.d/S99arlo
sh -n /etc/rc.d/S99arlo
# Nessun output = OK
```

Se lo script viene eseguito manualmente ma non viene preso al boot, sta gareggiando con l'init Netgear. Rinominatelo con un numero di avvio più alto:

```bash
mv /etc/rc.d/S99arlo /etc/rc.d/S991arlo
```

`S991` è un numero di avvio più alto rispetto agli script Netgear della gamma `S99` e si esegue affidabilmente per ultimo.

### 5. Il DHCP guest non sta fornendo 172.14.1.1 come gateway

```bash
cat /tmp/dni_udhcpd_guest.conf | grep -E "router|dns"
```

Se `option router` è ancora `192.168.2.1`, lo script o non è stato eseguito o è stato eseguito prima che il daemon rigenerasse la config:

```bash
# Forzare la rigenerazione e il riavvio
kill -9 $(cat /var/run/dni_guest_udhcpd.pid)
/sbin/dni_guest_udhcpd /tmp/dni_udhcpd_guest.conf
```

Poi rilanciare `/etc/rc.d/S99arlo start`. Se il daemon rigenera immediatamente la config con `192.168.2.1`, dovete fare il `sed` dentro lo script `S99` *dopo* che il daemon rigenera — è esattamente quello che fa l'estratto in §4.5.

### 6. Il comando "passwd" su telnet ha disabilitato il mio accesso

Non eseguite `passwd` sull'RBR760 — blocca telnet permanentemente su V6.3.6.x e superiori. L'unico fix è un factory reset tramite il pulsante posteriore (graffetta per 10 s a router acceso). Perderete tutte le altre configurazioni che avete mai fatto sul router.

### 7. Telnet ha smesso di funzionare ma il router è acceso

```bash
# Forse il vostro job cron lato server non è ancora stato eseguito (dopo un reboot del router)
/home/arlo/re-enable-telnet.sh

# Forse un firmware Netgear è stato inviato automaticamente (avete dimenticato di disabilitare gli aggiornamenti?)
nvram show | grep auto_
# Se uno di questi è 1 siete stati morsi
```

Se `auto_check_for_upgrade` è `1`, rimettetelo a `0` e controllate sotto quale versione siete ora:

```bash
nvram get orbi_fw_version
# Se è V7 siete bloccati
```

Questo è il set di debugging a sette pattern. La matrice di troubleshooting completa (incluse le particolarità lato device che elenco nel Post 2) è nella [sezione troubleshooting del repository di accompagnamento](https://github.com/mmornati/arlo-base-station/blob/main/docs/troubleshooting.md).

## Cosa Viene Dopo

Questo articolo ha coperto la parte che ha la peggiore curva "se non lo sai, non puoi Googlare": fare in modo che il router assomigli a una stazione base. Gli strati restanti sono più convenzionali:

- **Post 2** — lo stack services sul server. `arlo-cam-api`, il `server.py` patchato per il bug auto-register-on-restart, l'handler di movimento `arlo-snapshot`, MediaMTX come relay RTSP on-demand, e le tre patch che ho inviato upstream come PR #1 a `brianschrameck/arlo-cam-api`.
- **Post 3** — Integrazione Home Assistant tramite sensori REST, entità Generic Camera (still + stream), il dashboard Lovelace usando `camera_view: auto`, Tailscale per l'accesso remoto, e Scrypted se volete HomeKit.

> **Una nota sullo staging.** Il codice e le configurazioni completi sono a [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station). La PR per il primo batch di file (incluso `rbr760/S99arlo` da §4.5) è aperta al momento della scrittura.

---

*Questo è l'articolo 1 di 3 nella serie Arlo. Il Post 2 copre lo stack services + le PR upstream. Il Post 3 copre l'integrazione Home Assistant.*

*Continua a leggere → [Post 2 — Services & PR upstream](/it/auto-ospitare-arlo-cam-api-correzioni-e-miglioramenti/) e [Post 3 — Integrazione Home Assistant](/it/integrare-arlo-auto-ospitato-con-home-assistant/).*
