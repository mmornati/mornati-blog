---
title: 'Correggere la durata della batteria delle telecamere Arlo a livello WiFi'
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
date: '2026-08-19T13:00:00.000000+00:00'
slug: correggere-la-durata-della-batteria-delle-telecamere-arlo-a-livello-wifi
translationKey: arlo-wifi-layer-battery-fix
url: /it/correggere-la-durata-della-batteria-delle-telecamere-arlo-a-livello-wifi/
aliases:
- /it/correggere-la-durata-della-batteria-delle-telecamere-arlo-a-livello-wifi.html
categories:
- Casa intelligente
- DIY
- Networking
- Hardware
description: 'La correzione WiFi che mancava: aumentare il timeout di inattività del WiFi ospite e la durata del lease DHCP su un Netgear Orbi RBR760 affinché le telecamere VMC4040P smettano di ri-associarsi ogni 30 minuti e di scaricare la batteria durante la notte.'
cover: cover.jpg
showHero: true
---

Dopo la fusione dei tre post di questa serie, ho continuato a monitorare i livelli di batteria delle telecamere. Il Post 1 mi aveva detto che l'hardware WiFi era la seconda causa più probabile di consumo. I Post 2 e 3 mi avevano mostrato come il beacon e la politica di armamento delle telecamere interagiscono. Ma le telecamere continuavano a ri-associarsi alla rete ospite circa ogni trenta minuti, e la batteria continuava a scendere anche su telecamere armate in viste senza movimento. La causa restante non era affatto nel livello applicativo — era nel livello WiFi stesso.

> **Aggiornamento (20 agosto 2026).** Le correzioni `inact=65535` e lease DHCP=86400 in questo post sono corrette e agiscono a livello firmware. Tuttavia, test successivi nel post bonus di approfondimento hanno rivelato che il chipset QCA full-offload dell'RBR760 non può replicare l'intervallo beacon di 31 TU della stazione base Arlo — un requisito fondamentale per la sincronizzazione in deep sleep delle telecamere. Le telecamere si disconnettono ripetutamente con l'intervallo beacon predefinito di 100 TU, rendendo le correzioni di timeout e lease insufficienti da sole. L'indagine completa è nel [post bonus di approfondimento](/it/analisi-approfondita-della-stazione-base-arlo/).

Questo post è il quarto della serie e chiude il cerchio. È breve, chirurgico, e interamente dedicato al Netgear Orbi RBR760 e alla sua pila WiFi ospite proprietaria. Due valori, due file di configurazione, un reload — e una regressione che dovete conoscere prima di eseguire il reload.

> Tutti i valori di questo post sono presi da un RBR760 in produzione con firmware V6.3.8.5 (Chaos Calmer, rtm-6.3.8.5+r49254). Gli indirizzi IP reali, i MAC WiFi, i numeri di serie delle telecamere e la passphrase WPA sono stati rimossi; il SSID pubblicato è `ARLO_VMB_XXXXXXXXXX` e la LAN pubblicata è `192.168.1.x`.

## TL;DR

Due modifiche, entrambe solo per il WiFi ospite, entrambe persistenti:

1. **Timeout di inattività del WiFi ospite** portato dal valore predefinito del firmware di `300` secondi al massimo accettato di `65535` secondi (circa 18,2 ore) su entrambe le VAP ospiti (`Guest2` su `ath02` 2,4 GHz e `Guest5` su `ath21` 5 GHz-basso).
2. **Lease DHCP ospite** portato dal valore originale di `1800` secondi (30 minuti) a `86400` secondi (24 ore) in `/etc/rc.d/S99arlo` e nella configurazione live di `dni_guest_udhcpd`.

Dopo la modifica, le telecamere dormono tutta la notte invece di far ruotare la tabella di associazione WiFi ogni trenta minuti. Il WiFi principale non è toccato. Lo script è riavviabile — `/etc/rc.d/S99arlo restart` avvia un'istanza pulita del demone DHCP.

## La Scoperta

Alla fine del Post 3 avevo una stack funzionante e un dashboard operativo. Le telecamere erano raggiungibili, il WiFi era stabile, il beacon le manteneva attaccate. Allora perché la batteria continuava a scendere?

Ho iniziato a raccogliere i contatori di registrazione delle telecamere da `arlo-cam-api`. Lo schema era inequivocabile:

> `[beacon] Probing XXXXXXXXXXXX` ... `[register] XXXXXXXXXXXX registered, BAT=42%` ... `[beacon] Probing XXXXXXXXXXXX` ... `[register] XXXXXXXXXXXX registered, BAT=42%`

Le stesse telecamere si re-registravano ancora e ancora. Non perché il beacon fallisse — il beacon faceva esattamente ciò che gli avevo detto di fare — ma perché le telecamere *non erano la stessa istanza* ogni volta. Si ri-associavano all'AP, ottenevano un nuovo lease DHCP, e si re-registravano da zero. Circa ogni trenta minuti.

Mentre tutto questo accadeva, una telecamera era connessa senza interruzioni da oltre trenta ore. Quello era l'indizio. La differenza non stava nella telecamera, né nel firmware, né nel livello applicativo. Stava nella rete WiFi a cui la telecamera era collegata.

Un controllo rapido sulle VAP ospiti:

```
cfg80211tool ath02 get_inact
inact = 300
```

Trecento secondi. Cinque minuti. La vera Arlo base station, al contrario, non dissocia mai una telecamera in standby — le mantiene in 802.11 power-save con il handshake DTIM/PS-Poll e una IE proprietaria nei frame beacon che elenca le telecamere associate. L'hardware lato telecamera è progettato per fare affidamento su quella connessione. Quando il timeout di inattività del gateway scatta, l'AP invia un null-function poll; la telecamera addormentata non risponde (la sua radio è spenta); l'AP la dissocia e la de-autentica. La telecamera si sveglia più tardi, non trova nessuna associazione, e rifà l'intero ciclo register-DHCP-reregister.

La vera Arlo base station è un punto di accesso 2,4 GHz proprietario che non dissocia mai le telecamere in standby. La sua gestione del power-save, le IE beacon e la politica di dissociazione sono documentate nei brevetti US11722963, US20240147057 e US12413852. Il progetto di reverse-engineering comunitario `arlo-open-base-station` documenta lo stesso comportamento in `WIFI-HARDWARE.md`: gli AP USB economici perdono i client ogni ~30 minuti; il TP-Link Omada EAP225 permette standbys di 2–5 ore. La conclusione è la stessa: il problema è il livello WiFi che molla i client in standby, non il protocollo Arlo.

L'analisi della batteria del Post 1 l'aveva identificata come la seconda causa di consumo. Questo post è la correzione.

## Correzione A — Timeout di Inattività

Il WiFi ospite ha due interfacce, una per banda radio:

- `ath02` sulla radio `wifi0` (2,4 GHz), legata alla sezione UCI `wireless.Guest2`
- `ath21` sulla radio `wifi2` (5 GHz-basso), legata alla sezione UCI `wireless.Guest5`

Il timeout di inattività è l'opzione `inact` su ciascuna rete WiFi ospite. Il valore predefinito è `300` secondi. Il firmware accetta un valore a 16 bit, quindi il massimo è `65535` secondi (~18,2 ore). L'obiettivo è replicare la politica di fatto della Arlo base station « non dissocia mai una telecamera in standby ». Una telecamera che lascia davvero la rete si de-autentica da sola — l'AP smette semplicemente di essere la parte che inizia la dissociazione.

Applicatelo via UCI e fate il commit:

```
uci set wireless.Guest2.inact='65535'
uci set wireless.Guest5.inact='65535'
uci commit wireless
```

È persistente attraverso i reboot. Lo script del vendor interessato, `/lib/wifi/qcawificfg80211.sh` (intorno alla linea 4069), passa nativamente il valore `inact` a `cfg80211tool` ad ogni restart del WiFi, quindi non serve alcuna patch dello script.

Applicatelo anche a caldo sulle interfacce in esecuzione, così la modifica ha effetto immediato senza un `wifi reload`:

```
cfg80211tool ath02 inact 65535
cfg80211tool ath21 inact 65535
```

Verificate:

```
cfg80211tool ath02 get_inact
inact = 65535
cfg80211tool ath21 get_inact
inact = 65535
uci get wireless.Guest2.inact
65535
uci get wireless.Guest5.inact
65535
```

Non c'è letteralmente « mai » — il campo a 16 bit è limitato a ~18,2 ore — ma in pratica una telecamera che si sveglia per qualsiasi motivo (evento PIR, probe beacon, pulsante sync, ciclo firmware) si ri-assocerà ben prima che questo timer scatti.

## Correzione B — Lease DHCP Ospite

Il demone DHCP ospite è il `dni_guest_udhcpd` proprietario (non `dnsmasq`). La configurazione è un heredoc scritto da `/etc/rc.d/S99arlo` in `/tmp/dni_udhcpd_guest.conf`. Il lease originale era di `1800` secondi (30 minuti). Un lease di 30 minuti è ragionevole per una rete ospite di un bar, ma è troppo corto per un dispositivo IoT in standby — ogni rinnovo del lease rischia una breve dissociazione che, combinata con il timeout di inattività, innesca l'intero ciclo di re-registrazione.

La correzione è un solo numero in due file. In `/etc/rc.d/S99arlo` (lo script init persistente), cambiate:

```
option lease 1800
```

in:

```
option lease 86400
```

Nella config live `/tmp/dni_udhcpd_guest.conf`, fate lo stesso cambiamento. Poi riavviate il demone:

```
/etc/rc.d/S99arlo restart
```

Lo script esegue un `killall -9 dni_guest_udhcpd` (o il percorso `stop()`) e avvia un'istanza fresca. Verificate:

```
ps w | grep dni_guest_udhcpd | grep -v grep
<single pid> /sbin/dni_guest_udhcpd /tmp/dni_udhcpd_guest.conf
```

Il demone DHCP della LAN principale (`dni_udhcpd` che serve `192.168.1.x`) è un processo separato e non viene toccato. Il cambio di lease è riservato all'ospite.

> Una nota sul demone DHCP del vendor: il RBR760 fornisce un servizio DHCP ospite nativo (`/etc/init.d/guest_dhcpd.init`) che usa `procd` per riavviare automaticamente `dni_guest_udhcpd`. Se lo lasciate girare, finite con due istanze dello stesso demone, che è un vero problema. La correzione nello script S99 del Post 1 (`/etc/rc.d/S99arlo`) gestisce già questo eliminando l'istanza gestita da procd. Se state applicando questa correzione a un router nuovo, seguite prima il Passo 5 del Post 1; lo script S99 che vi si trova è il fondamento su cui questo post si basa.

## Verifica

Dopo aver applicato entrambe le correzioni, lo stato live deve corrispondere a:

| Controllo | Comando | Atteso |
|---|---|---|
| Inattività `ath02` | `cfg80211tool ath02 get_inact` | `inact = 65535` |
| Inattività `ath21` | `cfg80211tool ath21 get_inact` | `inact = 65535` |
| Valore UCI `Guest2` | `uci get wireless.Guest2.inact` | `65535` |
| Valore UCI `Guest5` | `uci get wireless.Guest5.inact` | `65535` |
| Lease DHCP ospite | `grep lease /tmp/dni_udhcpd_guest.conf` | `option lease 86400` |
| Processo DHCP ospite | `ps w | grep dni_guest_udhcpd | grep -v grep` | una riga, in esecuzione |
| WiFi principale | `iwinfo ath01 info` (oppure `ath2`) | SSID di casa up, stazioni attaccate |
| Ospite 2,4 | `iwinfo ath02 info` | `ARLO_VMB_XXXXXXXXXX` up |
| Ospite 5-basso | `iwinfo ath21 info` | `ARLO_VMB_XXXXXXXXXX` up |
| Registrazione telecamera | `curl http://192.168.1.48:5000/refresh` (oppure HA) | 4 telecamere, senza churn |

Una telecamera che ha dormito profondamente per ore non risponde a un ping ICMP — è atteso, non è un problema. Il proxy per « ancora associata » è la presenza della telecamera nella lista station di `hostapd`, e l'assenza di churn di registrazione nel log di `S99arlo`.

## Cosa Può Andare Male — La Race Condition wifi2 del Mesh

La correzione sopra richiede un `wifi reload` per spingere il commit UCI nella pila wireless in esecuzione — a meno che non impostiate anche i valori a caldo via `cfg80211tool`, cosa che abbiamo fatto. Se innescate comunque un `wifi reload`, o qualsiasi ciclo `wifi up` / `wifi down`, potreste incappare in una regressione che mette la rete mesh in uno stato piantato.

### Sintomo

Dopo `wifi reload`, `wifi restart`, o qualsiasi altro restart wireless pilotato da UCI:

- L'interfaccia web Orbi mostra entrambi i satellite come **disconnessi**.
- `ping 192.168.1.82` e `ping 192.168.1.101` (gli IP dei satellite) spesso continuano a rispondere.
- Il `hostapd` del router principale dichiara i satellite come associati sulla radio backhaul.
- `iwconfig ath2` e `iwconfig ath21` possono mostrare `ESSID:""` (SSID vuoto) e `Encryption: off`.

Le radio wireless sono fisicamente ok. Il piano di controllo mesh è semplicemente cieco.

### Causa Principale

Il RBR760 esegue un demone mesh chiamato `hyd` in due istanze:

- `hyd -d -C /tmp/hyd-lan.conf -P 7777 -cfg80211` — demone mesh lato LAN, che fa bridging di `br-lan` sopra le VLAN backhaul (`ath0.4094`, `ath1.4094`).
- `hyd -d -C /tmp/hyd-guest.conf -P 8888 -cfg80211` — demone mesh lato ospite.

Quando `wifi2` torna su dopo il reload, le VAP su `ath2` (principale 5 GHz-basso) e `ath21` (ospite 5 GHz-basso) si inizializzano con SSID vuoti se la re-init della radio si è bloccata. L'`hyd` LAN cerca quindi di leggere l'SSID da `ath2`, fallisce con:

```
HYDR wlanif ERR: wlanifBSteerControlCmnStoreSSID: invalid ESSID length 0, ifName: ath2
Failed to initialize wlanif/wlb/modules
```

…ed esce. Senza il demone mesh LAN, il router non può tracciare lo stato mesh dei satellite, quindi l'interfaccia web li mostra come disconnessi anche se il link backhaul è su.

### Diagnostica

Eseguite questi comandi per confermare la regressione:

```
iwconfig ath2
# Se ESSID:"" → la race wifi2 si è attivata
iwconfig ath21
# Se ESSID:"" → la race wifi2 copre anche la VAP ospite 5-basso
ps w | grep 'hyd '
# Aspettatevi DUE processi hyd: 7777 LAN + 8888 ospite. Se ce n'è solo uno (o nessuno), è la regressione.
hostapd_cli -i ath1 -p /var/run/hostapd-wifi1 list_sta
# Deve mostrare i satellite come associati sul backhaul
ping -c 2 192.168.1.82
ping -c 2 192.168.1.101
# Entrambi devono rispondere
```

### Recupero

La correzione è una re-init pulita di `wifi2` e un restart di `hyd`:

```
wifi down wifi2
wifi up wifi2
# Aspettare ~10–30 s che le VAP tornino su con i loro SSID UCI

# Verificare che gli SSID non siano più vuoti
iwconfig ath2 | grep ESSID
iwconfig ath21 | grep ESSID

# Riavviare il demone mesh
/etc/init.d/hyd restart

# Verificare che entrambe le istanze hyd siano in esecuzione
ps w | grep 'hyd '
```

Dopo questo, i satellite ricompaiono nell'interfaccia web come connessi entro un minuto o due. La correzione della batteria è intatta — il valore `inact` su `Guest2` e `Guest5` è preservato attraverso il `wifi up wifi2` perché UCI è la fonte di verità e `qcawificfg80211.sh` lo riapplica.

### Avvertenza di Interazione

Le modifiche al WiFi ospite si trovano su `ath02` (su `wifi0`) e `ath21` (su `wifi2`). Il `wifi reload` che applica un `commit wireless` UCI può attivare la race `wifi2` anche se la modifica stessa riguardava `wifi0`. Verificate sempre dopo qualsiasi cambio di configurazione wireless:

```
ps w | grep 'hyd '           # aspettatevi DUE istanze hyd
iwconfig ath2 | grep ESSID   # aspettatevi un SSID reale
iwconfig ath21 | grep ESSID  # aspettatevi un SSID reale
```

Se uno qualsiasi di questi è sbagliato, eseguite la sequenza di recupero sopra.

## Rollback

Entrambe le correzioni sono reversibili.

**Timeout di inattività:**

```
uci delete wireless.Guest2.inact
uci delete wireless.Guest5.inact
uci commit wireless
cfg80211tool ath02 inact 300
cfg80211tool ath21 inact 300
```

**Lease DHCP:**

```
sed -i 's/option lease 86400/option lease 1800/' /etc/rc.d/S99arlo
sed -i 's/option lease 86400/option lease 1800/' /tmp/dni_udhcpd_guest.conf
/etc/rc.d/S99arlo restart
```

**Avvertenze:**

- **Non eseguite mai `passwd` su un router Netgear Orbi.** Riscrive `/etc/passwd` in un modo che rompe l'accesso telnet. Se dovete cambiare la password admin, fatelo tramite l'interfaccia web.
- **Non impostate mai `skip_inactivity_poll=1`.** Sembra utile, ma rende le stazioni inattive *più* probabilmente disconnesse, non meno. Il parametro giusto è `inact`.
- **Il valore `inact` è a 16 bit.** È impossibile impostare letteralmente « mai ». Il massimo è `65535` (~18,2 ore). In pratica, una telecamera che si sveglia per qualsiasi motivo si ri-assocerà ben prima che questo timer scatti.

## Limitazioni Note

**Le VAP ospite dei satellite non sono verificabili direttamente.** I satellite RBS760 (a `192.168.1.82`, `192.168.1.101`, e altri) non espongono un servizio telnet su TCP/23. L'impostazione UCI vive sul router; i satellite ricevono la configurazione tramite la sync di config Orbi (`common_update_uci` / `wsplcd`) sopra la VLAN backhaul ospite `4094`. Se le telecamere satellite (JARDIN1, JARDIN2, PORTAIL in questo deployment) continuano a scaricarsi dopo la correzione sul router principale, la causa più probabile è che le VAP ospite dei satellite non hanno recuperato il valore `inact`. Verificatelo nell'interfaccia web Orbi, avvicinando fisicamente le telecamere al router principale, o sostituendo il satellite con un AP dedicato (la raccomandazione della community è un TP-Link Omada EAP225).

**`arlo-cam-api` è la fonte di verità dell'inventario delle telecamere.** L'endpoint `/device` restituisce il mapping live serial→IP. Il dizionario `known_devices` del router è popolato da queste registrazioni.

**`inact` non sostituisce `BeaconIntervalSeconds`.** I due settaggi sono indipendenti. `inact` controlla il timer di dissociazione lato AP; `BeaconIntervalSeconds` (in `arlo-cam-api`) controlla il keepalive applicativo. Entrambi sono necessari per una flotta a basso consumo; nessuno dei due sostituisce l'altro. Vedere i Post 2 e 3 per il lato applicativo.

## Piano di Monitoraggio

Dopo la correzione, il proxy per « funziona ancora » è l'assenza di churn di re-registrazione. Monitorate:

- **Intervalli di registrazione delle telecamere.** Il log di `S99arlo` deve mostrare un singolo evento `[register]` per telecamera alla prima connessione, poi niente per ore. Se vedete lo stesso `XXXXXXXXXXXX` re-registrarsi ogni 30 minuti, la regressione è tornata.
- **% di batteria su più giorni.** Una telecamera che perdeva ~3%/h prima della correzione ora dovrebbe mantenere la carica per giorni. La telecamera JARDIN1 nel deployment dietro a questo post è passata dal 42% → 1% in una notte a una linea piatta nelle 48 ore successive.
- **`inact` dopo un reboot.** Dopo `reboot`, verificate che `cfg80211tool ath02 get_inact` restituisca `65535`. Il settaggio è in UCI, quindi dovrebbe persistere, ma verificarlo è poco costoso.
- **`inact` dopo un `wifi reload`.** Come sopra — lo script `qcawificfg80211.sh` lo riapplica, ma una regressione è più facile da individuare che da correggere.
- **Telecamere satellite.** Se JARDIN1, JARDIN2 o PORTAIL continuano a scaricarsi, la VAP ospite del satellite potrebbe non aver ricevuto il nuovo valore `inact`. Controllate nell'interfaccia web Orbi, sotto Attached Devices, le impostazioni AP della VAP ospite del satellite.

### Proteggete la Vostra Configurazione: Disattivate gli Aggiornamenti Automatici

Un aggiornamento del firmware Netgear Orbi cancella il servizio telnet e tutte le personalizzazioni che avete fatto. Il modo raccomandato dalla community per proteggere la vostra configurazione è disattivare l'auto-updater:

```
nvram set orbi_auto_upgrade=0
nvram set auto_check_for_upgrade=0
nvram set auto_update=0
nvram commit
```

Questa è la singola modifica più rilevante che possiate fare per proteggere il lavoro di questa serie. Se non lo fate, un push firmware di Netgear alle 3 di mattina trasformerà silenziosamente il vostro RBR760 in un router consumer stock e dovrete ricominciare da capo la danza dell'abilitazione telnet.

## Cosa Viene Dopo

Questo post chiude la serie in quattro parti. La stack completa è ora:

- **Post 1** — livello di rete: sostituzione del gateway, DHCP, DNAT, S99arlo, telnet.
- **Post 2** — livello applicativo: self-hosting di arlo-cam-api, le tre PR upstream, le patch di produzione.
- **Post 3** — livello automazione: integrazione Home Assistant, sensori REST, la macchina di wake, i valori misurati di consumo.
- **Post 4** (questo post) — livello WiFi: timeout di inattività e lease DHCP.

Per il lato rete, vedi il [Post 1 di questa serie](/it/sostituire-la-stazione-base-arlo-con-un-router-netgear-orbi/). Il livello applicativo è coperto nel [Post 2](/it/auto-ospitare-arlo-cam-api-correzioni-e-miglioramenti/) (arlo-cam-api, le tre PR upstream). Il lato automazione è coperto nel [Post 3](/it/integrare-arlo-auto-ospitato-con-home-assistant/) (integrazione Home Assistant, sensori REST, macchina di wake).

Il repository companion su [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station) contiene tutti i file di configurazione menzionati nella serie.
