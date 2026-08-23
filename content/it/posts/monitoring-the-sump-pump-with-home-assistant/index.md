---
title: 'La pompa di sentina sotto i riflettori: monitorare infrastrutture invisibili con Home Assistant'
date: '2026-08-25T09:00:00.000000+00:00'
slug: monitoring-the-sump-pump-with-home-assistant
translationKey: monitoring-the-sump-pump-with-home-assistant
categories:
- Home Assistant
- Casa Intelligente
- DIY
tags:
- home-assistant
- domotica
- automazione
- acqua
- diy
- avvisi
description: 'La pompa di scarico della cantina drena le acque sotterranee che nessuno vede - finché la cantina non si allaga. Ecco come Home Assistant ha trasformato la mia in un dispositivo monitorato: rilevamento dei cicli, rilevamento anomalie, riattivazione forzata, avvisi e report settimanale, con YAML reale e numeri reali.'
summary: 'Una presa Zigbee con misuratore di energia, nove automazioni e una pompa invisibile che salva la casa dall''allagamento - il modello dell''«apparecchio invisibile», monitorato con Home Assistant.'
cover: cover.jpg
showHero: true
---

La mia cantina ha una pompa che salva la casa, e fino a qualche mese fa l'unico modo per sapere che funzionava ancora era tendere l'orecchio. Una pompa di scarico (pompe de relevage) sta in un pozzetto in cantina, raccoglie le acque sotterranee che filtrano e le spinge verso lo scarico. Quando funziona, nessuno la nota. Quando si guasta — galleggiante bloccato, motore bruciato, magnetotermico scattato — l'acqua sale piano finché la cantina non si allaga.

Questa è la definizione di infrastruttura invisibile: invisibile, critica e silenziosa finché non diventa costosa. Questo articolo racconta come l'ho messa sotto i riflettori con Home Assistant — cosa monitoro, lo YAML reale e i numeri reali della mia istanza live.

> **Nota onesta sul deploy.** Ogni automazione di questo articolo è **attiva nella mia configurazione, adesso**. Ho estratto lo YAML direttamente da `automations.yaml` e verificato lo stato live tramite l'API prima di scrivere: le nove automazioni sono abilitate, e l'ultimo spegnimento forzato risale a ottobre 2025. Quello che vedete qui sotto è ciò che gira oggi.

**Avvertenza:** non sono né un idraulico né un elettricista. Una pompa di scarico e il drenaggio di una cantina sono appunti di campo di una casa nel nord della Francia, non consigli d'installazione per la vostra. Una pompa che gira a secco o una cantina allagata possono causare danni; monitorate, ma non sostituite mai la manutenzione fisica.

## TL;DR — cosa può guastarsi, cosa fa HA

| Modalità di guasto | Cosa fa Home Assistant |
|---|---|
| Pompa che gira troppo a lungo (galleggiante bloccato, scarico ostruito) | Avviso a 2 min, avviso di anomalia a 5 min |
| La pompa riparte senza ripararsi da sola | 3 tentativi, poi **spegnimento forzato** + blocco 24 h |
| La pompa non riparte più dopo lo spegnimento forzato | Riattivazione automatica dopo 24 h |
| La pompa non è partita da 48 h (galleggiante bloccato, guasto) | Avviso «non avviata» ogni 6 h |
| Qualunque avvio | Tracciamento completo: timestamp start/stop, durata, energia |
| Settimana trascorsa | Report del lunedì: durata, energia, ultimo start/stop |

L'hardware è volutamente banale: **una presa Zigbee con misuratore di energia** (`friendly_name` zigbee2mqtt `pompe_cave`) a cui è collegata la pompa. Niente sensore del galleggiante, niente sonda di livello: tutto è dedotto dal consumo elettrico. La pompa ci dice tutto ciò che serve semplicemente dall'elettricità che consuma.

---

## Perché monitorare infrastrutture invisibili

Il modello dell'«apparecchio invisibile» è ovunque: la pompa di scarico, la pompa di circolazione del riscaldamento, il congelatore in garage, il gruppo di continuità sotto la scrivania. Ci pensiamo solo quando si fermano, e a quel punto il danno è già fatto.

Per una pompa di scarico la posta in gioco è concreta. L'acqua sale; la pompa cicla; se smette di ciclare, la cantina si allaga in poche ore. Un livello di monitoraggio non aggiusta la pompa — aggiusta la *sorpresa*. Si viene a sapere alle 14:00 tramite una notifica invece che alle 19:00 con l'acqua alle caviglie.

C'è una ragione più sottile: **le pompe si degradano lentamente.** Un galleggiante che si irrigidisce, una girante che si ostruisce — i sintomi compaiono come *cambiamenti del ciclo* molto prima di un guasto franco. Tracciare il ciclo è il modo per coglierli in anticipo.

---

## L'hardware: come HA vede la pompa

La pompa è alimentata da una presa Zigbee con misuratore di energia. In Home Assistant questo si presenta come un gruppo di entità:

| Entità | Cosa riporta |
|---|---|
| `sensor.pompe_cave_power_2` | Potenza istantanea in W (0 W = a riposo) |
| `sensor.pompe_cave_energy_2` | Contatore energia della presa in kWh |
| `switch.pompe_cave_2` | La presa stessa (off = la pompa non ha corrente) |
| `binary_sensor.pompe_cave` | Template: potenza > 5 W → `on` (la pompa gira) |
| `sensor.pompe_cave_on_today` / `on_weekly` | `history_stats` tempo di marcia oggi / 7 giorni |

Il binary sensor è il cuore di tutto. Trasforma una lettura di potenza continua in un segnale on/off pulito, su cui si attivano tutte le automazioni qui sotto:

```yaml
# templates/sensors.yaml
- binary_sensor:
    - unique_id: pompe_cave_running
      name: "Pompe Cave Running"
      icon: mdi:pump
      device_class: running
      state: >
        {% set power = states('sensor.pompe_cave_power_2') %}
        {% if power in ['unavailable', 'unknown', 'none'] or power == '' %}
          {{ 'off' }}
        {% else %}
          {{ 'on' if power | float > 5.0 else 'off' }}
        {% endif %}
```

La soglia `> 5.0 W` conta: filtra il consumo a riposo della presa e il rumore di misura, così solo un *vero* avvio della pompa vale come `on`.

Due sensori template completano il quadro. Uno converte i timestamp tracciati in ore dall'ultimo avvio (999 quando mai avviata), l'altro calcola la durata del ciclo in corso in minuti:

```yaml
- sensor:
    - unique_id: pompe_cave_hours_since_last_start
      name: "Pompe Cave Hours Since Last Start"
      unit_of_measurement: h
      icon: mdi:clock-outline
      state: >
        {% set last = states('input_datetime.pompe_cave_last_started') %}
        {% if last in ['unavailable', 'unknown', 'none', ''] %}
          {{ 999 }}
        {% else %}
          {{ ((now() - as_datetime(last)) / 3600) | round(1) }}
        {% endif %}
```

---

## Le automazioni, una per una

### A. Tracciamento di avvio/arresto

Due automazioni registrano ogni ciclo osservando il binary sensor. Quando la pompa parte, timbriamo `input_datetime.pompe_cave_last_started`; quando si ferma, `input_datetime.pompe_cave_last_stopped`:

```yaml
- id: pompe_cave_track_start
  alias: "Pompe Cave - Suivi demarrage"
  mode: single
  triggers:
  - trigger: state
    entity_id: binary_sensor.pompe_cave
    from: 'off'
    to: 'on'
  conditions: []
  actions:
  - action: input_datetime.set_datetime
    target:
      entity_id: input_datetime.pompe_cave_last_started
    data:
      datetime: "{{ now() }}"

- id: pompe_cave_track_stop
  alias: "Pompe Cave - Suivi arret"
  mode: single
  triggers:
  - trigger: state
    entity_id: binary_sensor.pompe_cave
    from: 'on'
    to: 'off'
  conditions: []
  actions:
  - action: input_datetime.set_datetime
    target:
      entity_id: input_datetime.pompe_cave_last_stopped
    data:
      datetime: "{{ now() }}"
```

Questi due timestamp sono la spina dorsale di tutte le altre automazioni — la durata di marcia, l'avviso «non avviata» e il report settimanale li leggono tutti.

### B. Rilevamento anomalie (con tentativi e blocco)

La pompa lavora a raffiche di circa un minuto. Se gira **5 minuti di fila**, qualcosa non va — scarico ostruito, galleggiante bloccato, pompa che lotta contro un'acqua che non riesce a spostare. È il cuore del sistema, quindi è l'automazione più difensiva:

```yaml
- id: pompe_cave_anomalie_detection
  alias: "Pompe Cave - Detection d'anomalie"
  mode: single
  max_exceeded: silent
  triggers:
  - trigger: numeric_state
    entity_id: sensor.pompe_cave_power_2
    above: 0
    for: 00:05:00
  conditions:
  - condition: state
    entity_id: switch.pompe_cave_2
    state: 'on'
  - condition: state
    entity_id: input_boolean.pompe_cave_force_disable
    state: 'off'
  actions:
  - action: notify.notify
    data:
      title: "Pompe Cave"
      message: "Pompe cave - Detection d'anomalie (5 min)."
  - action: switch.turn_off
    target:
      entity_id: switch.pompe_cave_2
  - action: input_number.increment
    target:
      entity_id: input_number.pompe_cave_retry_count
  - action: delay
    delay: 00:02:00
  - action: switch.turn_on
    target:
      entity_id: switch.pompe_cave_2
  - action: delay
    delay: 00:01:00
  - choose:
    - conditions:
      - condition: numeric_state
        entity_id: sensor.pompe_cave_power_2
        above: 0
      - condition: numeric_state
        entity_id: input_number.pompe_cave_retry_count
        above: 2
      sequence:
      - action: notify.notify
        data:
          title: "Pompe Cave"
          message: "Pompe cave - Desactivation forcee (apres 3 essais)."
      - action: switch.turn_off
        target:
          entity_id: switch.pompe_cave_2
      - action: input_boolean.turn_on
        target:
          entity_id: input_boolean.pompe_cave_force_disable
      - action: input_datetime.set_datetime
        target:
          entity_id: input_datetime.pompe_cave_last_forced_off
        data:
          datetime: "{{ now() }}"
```

La logica è una scala di tentativi: alimentato per 5 min → spegni, avvisa, conta un tentativo; attendi 2 minuti; riaccendi; attendi 1 minuto; se **consuma ancora e siamo al 3° tentativo** → molla. La pompa viene spenta forzatamente, il blocco `pompe_cave_force_disable` viene alzato perché nulla la riaccenda automaticamente, e l'ora dello spegnimento forzato viene timbrata. Dopo tre tentativi e una marcia continua di 5 minuti, lasciarla accesa è più rischioso che lasciarla spenta.

Questo è il momento «i monitor falliscono in modo diverso dagli umani»: una persona prima o poi noterebbe che la pompa non si ferma più. Home Assistant se ne accorge dopo 5 minuti, reagisce e ce lo segnala — senza che nessuno debba essere vicino alla cantina.

### C. Riattivazione forzata dopo 24 h

Una pompa spenta forzatamente è protetta dal bruciarsi — ma una pompa disabilitata è anche una *cantina allagata* in preparazione. Quindi il blocco scade da solo dopo 24 ore:

```yaml
- id: pompe_cave_restart_once_a_day
  alias: "Pompe Cave - Reactivation forcee apres 24h"
  mode: single
  triggers:
  - trigger: time_pattern
    hours: '/1'
  conditions:
  - condition: state
    entity_id: input_boolean.pompe_cave_force_disable
    state: 'on'
  - condition: template
    value_template: >
      {% set last_off = as_timestamp(states('input_datetime.pompe_cave_last_forced_off')) %}
      {% set since = (now().timestamp() - last_off) | int %}
      {{ since > 86400 }}
  actions:
  - action: input_boolean.turn_off
    target:
      entity_id: input_boolean.pompe_cave_force_disable
  - action: input_number.set_value
    target:
      entity_id: input_number.pompe_cave_retry_count
    data:
      value: 0
  - action: switch.turn_on
    target:
      entity_id: switch.pompe_cave_2
```

Ogni ora controlla: il blocco è attivo, e sono passate più di 24 h dallo spegnimento forzato? Se sì, azzera i contatori e ridà corrente alla pompa. La pompa ha diritto a una seconda chance — e se il problema c'è ancora, il rilevamento anomalie la riprende. Se il galleggiante è fisicamente bloccato, questo singolo test funziona anche come **ciclo di prova manuale**: alimenta la pompa per un istante e, se l'acqua nel frattempo si è drenata, il ciclo si conclude in modo pulito.

### D. Avvisi «non avviata» e «in funzione da troppo tempo»

Due avvisi coprono il guasto opposto: la pompa che *avrebbe dovuto* girare e non l'ha fatto.

```yaml
- id: pompe_cave_alert_not_started
  alias: "Pompe Cave - Pas demarree depuis longtemps"
  mode: single
  triggers:
  - trigger: time_pattern
    hours: '/6'
  conditions:
  - condition: template
    value_template: >
      {% set last = states('input_datetime.pompe_cave_last_started') %}
      {{ last != '' and states('sensor.pompe_cave_hours_since_last_start') | float > 48 }}
  - condition: state
    entity_id: input_boolean.pompe_cave_force_disable
    state: 'off'
  actions:
  - action: notify.notify
    data:
      title: "Pompe Cave"
      message: >-
        Pompe cave pas demarree depuis longtemps.
        Dernier demarrage: {{ states('input_datetime.pompe_cave_last_started') }}.
        Heures depuis: {{ states('sensor.pompe_cave_hours_since_last_start') }}h
```

Ogni 6 ore, se la pompa non è partita da più di 48 h, una notifica ce lo ricorda. In stagione secca può scattare legittimamente (la mia pompa è appena girata durante l'estate), quindi il messaggio porta il valore reale «ore trascorse» — è un promemoria, non un allarme.

L'avviso gemello scatta quando un ciclo *c'è* stato ma si rifiuta di finire:

```yaml
- id: pompe_cave_alert_running_too_long
  alias: "Pompe Cave - Fonctionnement prolonge"
  mode: single
  max_exceeded: silent
  triggers:
  - trigger: numeric_state
    entity_id: sensor.pompe_cave_power_2
    above: 0
    for: 00:10:00
  conditions:
  - condition: state
    entity_id: binary_sensor.pompe_cave
    state: 'on'
  - condition: state
    entity_id: input_boolean.pompe_cave_force_disable
    state: 'off'
  actions:
  - action: notify.notify
    data:
      title: "Pompe Cave"
      message: >-
        Pompe cave - Fonctionnement prolonge (10 min).
        Puissance: {{ states('sensor.pompe_cave_power_2') }}W.
        Duree: {{ states('sensor.pompe_cave_current_runtime_minutes') }}min
```

Una marcia continua di 10 minuti supera qualsiasi bisogno di una pompa sana — l'avviso è l'ultima parola prima (o in parallelo) della scala di anomalie, e include la potenza live per distinguere una pompa a pieno carico da una in difficoltà.

C'è anche un primo stadio più dolce, `notify_pompe_cave_problem`, che alza un avviso alla soglia dei 2 minuti — un segnale che la pompa gira a lungo, prima che l'escalation a 5 minuti prenda il sopravvento.

### E. Il report settimanale

Ogni lunedì alle 08:00, una notifica riassume la settimana — durata di marcia, energia, ultima attività:

```yaml
- id: pompe_cave_weekly_report
  alias: "Pompe Cave - Rapport Hebdomadaire"
  mode: single
  triggers:
  - trigger: time
    at: '08:00:00'
  conditions:
  - condition: time
    weekday:
    - mon
  actions:
  - action: notify.notify
    data:
      title: "Pompe Cave"
      message: >-
        Rapport hebdomadaire pompe cave.
        ON cette semaine: {{ states('sensor.pompe_cave_on_weekly') }}h.
        ON aujourd'hui: {{ states('sensor.pompe_cave_on_today') }}h.
        Energie: {{ states('sensor.pompe_cave_energy_2') }} kWh.
        Dernier demarrage: {{ states('input_datetime.pompe_cave_last_started') }}.
        Dernier arret: {{ states('input_datetime.pompe_cave_last_stopped') }}.
        Heures depuis demarrage: {{ states('sensor.pompe_cave_hours_since_last_start') }}h
```

Il report è dove il «monitorare il modello» ripaga: le settimane con un tempo di marcia improvvisamente maggiore, o un ciclo che non si ferma mai, saltano all'occhio con un solo sguardo. Un galleggiante che si irrigidisce lentamente appare come una tendenza settimanale prima di diventare un vero guasto.

### Il supporto: gli input

Diversi helper `input_*` sostengono queste automazioni. Il più importante è il toggle di blocco:

```yaml
# components/input_boolean.yaml
pompe_cave_force_disable:
  name: "Pompe Cave Forcee Off"
  icon: mdi:power-off
  initial: false

# components/input_number.yaml
pompe_cave_retry_count:
  name: "Pompe Cave Retry Count"
  min: 0
  max: 5
  step: 1
  initial: 0
```

Più tre helper `input_datetime` (`pompe_cave_last_started`, `pompe_cave_last_stopped`, `pompe_cave_last_forced_off`) che le automazioni di tracciamento e di avviso leggono e scrivono.

---

## Numeri reali (dalla mia istanza live)

Li ho presi direttamente dall'API delle statistiche mentre scrivevo questo articolo — un giorno d'estate secco, quindi il valore di oggi è il tipo di zero interessante:

| Metrica | Valore |
|---|---|
| Tempo di marcia oggi | 0,0 h (giornata estiva secca) |
| Tempo di marcia ultimi 7 giorni | 0,55 h in totale |
| Marcia/giorno, ultimi 90 giorni (media) | ~0,13 h (~8 min/giorno) |
| Marcia/giorno, ultimi 90 giorni (mediana) | 0,135 h |
| Marcia/giorno, ultimi 90 giorni (max) | 0,28 h |
| Marcia/settimana, ultimi 90 giorni (media) | 0,35 h |
| Energia totale, contatore della presa | 67,78 kWh |
| Ultimo ciclo | 2026-08-22 18:20:55 → 18:21:05 (~10 s) |
| Ore dall'ultimo avvio | 3,2 h |
| Ultimo spegnimento forzato | 2025-10-14 18:46:48 |

Due cose spiccano. Primo, **i cicli tipici sono brevi** — il 2026-08-16 il logbook mostra cicli di 1 min 06 s, 8 s e 1 min 15 s: la pompa lavora a micro-raffiche man mano che l'acqua filtra. È esattamente il motivo per cui la soglia di anomalia a 5 minuti funziona: un ciclo sano non ci si avvicina mai. Secondo, **le estati secche sono tranquille** — ~8 minuti di pompa al giorno in media su 90 giorni, e praticamente zero in un giorno d'estate. L'avviso «non avviata da 48 h» deve tollerarlo, ed è per questo che riporta le ore trascorse invece di limitarsi ad allarmare.

Lo spegnimento forzato dell'ottobre 2025 merita una menzione: è la scala di anomalie che fa il suo lavoro, una volta, durante un periodo invernale umido — e il sistema si è auto-ripristinato tramite la riattivazione delle 24 h.

---

## Lezioni e compromessi

- **I falsi positivi sono il vero rischio.** Ogni soglia scelta (5 W, 2 min, 5 min, 48 h) è stata calibrata per stare molto al di sopra del ciclo normale, così gli avvisi sono rari e significativi. Il periodo calmo dell'estate ha quasi garantito che l'avviso «non avviata» suonasse in modo innocuo — per questo porta contesto invece di gridare al lupo.
- **I tempi di raffreddamento contano.** I ritardi di 2 minuti/1 minuto nella scala di anomalie esistono perché la pompa non venga sballottata on/off dalle automazioni stesse. Senza di loro, il monitor *creerebbe* i guasti che sorveglia.
- **Servono aspettative diverse tra periodi secchi e umidi.** In un periodo secco la pompa può restare ferma per giorni — normale. In un periodo umido gira in continuazione — normale anche quello. Solo i *cambiamenti* rispetto al modello consolidato sono sospetti.
- **La presa è il sensore economico.** Una presa Zigbee con misuratore di energia costa poche decine di euro e non richiede alcun lavoro idraulico. Il galleggiante e il motore esistono già — stiamo solo ascoltando l'unico segnale che producono già.

---

## Generalizzare: un modello per qualsiasi apparecchio nascosto

Niente qui è specifico della pompa. Lo stesso scheletro — un consumo elettrico, un binary sensor on/off che ne deriva, tracciamento start/stop, una scala di anomalie con blocco, un avviso «non ha girato» e un report periodico — si applica direttamente a:

- **Pompa di scarico / sollevamento** — stessa logica, più o meno le stesse soglie.
- **Pompa di circolazione del riscaldamento** — traccia la durata, avvisa sull'assenza di cicli in inverno.
- **Congelatore / frigorifero** — avvisa se il compressore non ha ciclato da ore.
- **Gruppo di continuità (UPS)** — avvisa su età della batteria, eventi su batteria o un carico che cambia.
- **Qualsiasi apparecchio che noti solo quando si ferma.**

La ricetta riutilizzabile: *deriva un binary sensor «sta facendo il suo lavoro» dalla potenza, traccia i timestamp start/stop, costruisci una scala di tentativi con blocco per «gira ma non ripara», avvisa su «avrebbe dovuto girare e non ha girato», e riassumi ogni settimana.* Copre la stragrande maggioranza dei guasti delle infrastrutture nascoste.

---

## Avvertenze

- **Appunti di campo, non consigli.** Queste sono le mie soglie, per la mia pompa, nella mia cantina, nel nord della Francia. La vostra pompa, la vostra falda, il vostro impianto elettrico sono diversi.
- **Non sono né un idraulico né un elettricista.** Il lato fisico — la pompa, il pozzetto, la linea di scarico — è installato e manutenuto da professionisti; io descrivo il livello di monitoraggio, non l'impianto idraulico.
- **Monitorare non è fare manutenzione.** Nessuna automazione sostituisce il controllo annuale, il test del galleggiante o la pulizia del pozzetto. Ciò che HA vi compra è *tempo*: rilevamento precoce invece della sorpresa.
- **Zigbee è una rete mesh, e le mesh perdono nodi.** Il mio logbook mostra un passaggio `unavailable` sulla presa il 2026-08-16 (un singhiozzo Zigbee, non un guasto della pompa). Gli avvisi vanno progettati attorno a un sensore temporaneamente cieco, non solo attorno ai guasti della pompa.

Se dovessi ricostruire tutto da zero, terrei lo stesso nucleo: una presa con misuratore di energia, un binary sensor derivato e la scala di tentativi con blocco. Quel trio ha trasformato una pompa invisibile in un dispositivo con un battito — e una cantina a cui non devo pensare finché qualcosa non merita davvero di esserci pensato.