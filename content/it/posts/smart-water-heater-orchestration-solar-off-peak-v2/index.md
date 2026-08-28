---
title: 'Lo scaldabagno, 4 anni dopo: orchestrazione solare + fasce orarie (v2)'
categories:
- smart-home
- solar-energy
date: '2026-08-24T09:00:00.000000+00:00'
slug: smart-water-heater-orchestration-solar-off-peak-v2
translationKey: smart-water-heater-orchestration-solar-off-peak-v2
tags:
- home-assistant
- domotica
- energia
- solare
- automazione
- scaldabagno
description: 'Quattro anni dopo la mia prima automazione dello scaldabagno basata su Shelly, ecco cosa è cambiato: rilevamento fine ciclo tramite termostato, riscaldamento in fascia piena pilotato dal solare e ciclo notturno intelligente con tetto massimo.'
summary: 'Due scaldabagni su tariffa Heures Creuses, 12 pannelli e nessuna batteria - la v2 della mia orchestrazione degli scaldabagni, con YAML reale e numeri reali.'
cover: cover.jpg
showHero: true
---

Quattro anni fa [ho sostituito i timer notturni dei miei due scaldabagni con un Shelly Plus 1 e Home Assistant](/smart-water-heater-with-home-assistant-and-shelly-device/). Un primo passo solido: accendere gli scaldabagni quando si apre la finestra di tariffa ridotta (le francesi "Heures Creuses", HC) e saltarla quando siamo via. Quando sono arrivati i pannelli solari, ho descritto la danza della finestra di mezzogiorno nell'[articolo sui due anni di solare](/two-years-of-solar-the-real-numbers-and-roi/).

Da allora il sistema si è evoluto in silenzio. Non una riscrittura, un'orchestrazione. Questo articolo è la **v2, quattro anni dopo**: cosa ho cambiato, lo YAML reale e i numeri veri.

> **Nota sul rollout, in tutta onestà.** La logica v2 qui sotto è nella mia configurazione ed è in corso di attivazione. La mia istanza live gira ancora sulle automazioni v1 basate su flag - l'ho verificato prima di scrivere, e ti dirò esattamente cosa è attivo ora e cosa sta arrivando.

**Disclaimer:** non sono né installatore né elettricista. Uno scaldabagno e l'impianto elettrico possono essere pericolosi; queste sono note di campo di casa mia, non istruzioni per la tua.

## TL;DR - cosa cambia rispetto alla versione 2022

| Capacità | v1 (2022) | v2 (ora) |
|---|---|---|
| Rilevamento fine ciclo | Indovinato alle 14:09 ("sta ancora assorbendo?") | Rilevamento termostatico: potenza a 0 -> ciclo completato |
| Fasce piene / HP | Sempre spento in HP | Solare prima di tutto: ripartenza in HP solo se il surplus copre lo scaldabagno |
| Ciclo notturno | Completamento fisso di 2 h | Notte intelligente con tetto (minuti limitati) |
| Ultimo rifornimento pieno | Solo boolean vacanze | Toggle `force_cumulus_hc` + automazione `force_cumulus_nigh` |
| Notifiche | Base | Fine ciclo, ripresa/stop HP solare, report notturni |

---

## Contesto: due scaldabagni, la tariffa, il solare

- **Due scaldabagni elettrici (cumulus)**: uno in cantina (serbatoio più grande), uno in garage (più piccolo). Ognuno è commutato dal proprio relè **Shelly Plus 1** e misurato tramite un **Shelly EM**, ogni scaldabagno sul proprio canale CT (`sensor.energy_meter_cumulus_cave_power`, `sensor.energy_meter_cumulus_garage_power`).
- **Tariffa HC (EDF, nord della Francia)**: una finestra a metà giornata (12:09 - 14:09) e una notturna. L'elettricità è più economica in HC - è lì che gli scaldabagni devono scaldare.
- **Solare**: 12 pannelli, 3 micro-inverter APS DS3, **nessuna batteria**. Gli scaldabagni sono l'unico carico elastico abbastanza grande da assorbire il surplus.
- **La tensione**: la finestra HC di mezzogiorno (12:00-14:00) è l'unico momento in cui HC e solare si sovrappongono. Tutto il resto è pianificazione più sorveglianza.

---

## Riepilogo v1 (versione breve)

La versione 2022 faceva tre cose:
1. **Pianificazione** — `automation.cumulus_cave_actives_en_hc` accende gli scaldabagni all'apertura della finestra HC (cave 12:09, garage 13:00, ancora live oggi).
2. **Rilevamento vacanze** — nessun riscaldamento quando il toggle `input_boolean.vacation` è attivo.
3. **Completamento notturno** — un ciclo notturno fisso di 2 h se la finestra diurna "probabilmente" non bastava.

Il punto debole era il passo 3: "probabilmente" è una congettura. Le ex automazioni `set_heating_incomplete_flag_cave` / `set_heating_incomplete_flag_garage` scattavano alle 14:09 e impostavano il flag `water_heating_incomplete_*` a on ogni volta che lo scaldabagno stesse ancora assorbendo corrente in quel momento. Non dice nulla dello stato reale del serbatoio - uno scaldabagno può essere quasi a fine ciclo o appena partito, il comportamento è lo stesso. Questa approssimazione è stata accettabile per 4 anni, ma una volta entrato in gioco il solare le congetture hanno iniziato a costare denaro. Quindi quest'estate ho sostituito le congetture col termostato del serbatoio stesso.

---

## Novità v2 - 1. Rilevamento fine ciclo tramite termostato

Il cambiamento più importante. Invece di indovinare alle 14:09, le automazioni **monitorano la potenza assorbita** e lasciano che sia il termostato dello scaldabagno a dichiarare la fine del ciclo: quando il serbatoio raggiunge la temperatura target, la potenza cade a zero.

Ecco `cumulus_cave_thermostat_complete` (la gemella del garage, `cumulus_garage_thermostat_complete`, è identica tranne che per gli entity_id):

```yaml
- id: cumulus_cave_thermostat_complete
  alias: "Cumulus Cave - Detection thermostatique fin de chauffe"
  mode: parallel
  max_exceeded: silent
  triggers:
  - trigger: numeric_state
    entity_id: sensor.energy_meter_cumulus_cave_power
    below: 50
    for: 00:05:00
  - trigger: state
    entity_id: sensor.energy_meter_cumulus_cave_power
    to: 'unavailable'
    for: 00:10:00
  conditions: []
  actions:
  - action: switch.turn_off
    target:
      entity_id: switch.shellyplus1_a8032abcd060_switch_0
  - action: input_boolean.turn_off
    target:
      entity_id: input_boolean.water_heating_incomplete_cave
  - action: input_boolean.turn_off
    target:
      entity_id: input_boolean.water_heating_solar_extend_cave
  - action: notify.notify
    data:
      title: "Chauffe Eau Cave"
      message: "Cycle termine (thermostat). ON cumule aujourd'hui: {{ states('sensor.cumulus_cave_daily_on_time') }}h"
```

Cosa fa ogni trigger:

- **`power < 50 W` per 5 minuti** — il termostato ha spento. Il relè si apre, il flag "incompleto" e il flag "prolungamento solare" vengono cancellati, e una notifica conferma che il ciclo è davvero terminato.
- **`power` diventa `unavailable` per 10 minuti** — la pinza non invia più dati. È una valvola di sicurezza: si chiude in modo pulito invece di aspettare tutta la notte.

Le vecchie automazioni euristiche sono ora **disabilitate nella configurazione**, con una nota esplicita nell'alias:

```yaml
- id: set_heating_incomplete_flag_cave
  alias: "Set Heating Incomplete Flag - Cave [DISABLED - replaced by thermostat detection]"
  mode: single
  enabled: false
  triggers:
  - trigger: time
    at: '14:09:00'
  conditions:
  - condition: numeric_state
    entity_id: sensor.energy_meter_cumulus_cave_power
    above: 100
  actions:
  - action: input_boolean.turn_on
    target:
      entity_id: input_boolean.water_heating_incomplete_cave
```

![Caduta della potenza a 0 W a fine ciclo](/images/smart-water-heater-orchestration-solar-off-peak-v2/01-thermostat-detection.png)

---

## Novità v2 - 2. Riscaldamento in fascia piena (HP) pilotato dal solare

Alle 14:09 la finestra HC di mezzogiorno si chiude e si passa alle **Heures Pleines (HP)** - la tariffa più cara. Normalmente gli scaldabagni devono restare spenti in HP. Ma quando il sole c'è e la casa consuma poco, scaldare con l'elettricità solare in HP costa meno che importare dalla rete di notte.

Così quest'estate ho aggiunto una seconda coppia di automazioni: un **interruttore** che lancia un ciclo HP quando c'è surplus, e una **sentinella** che lo ferma appena il sole cala o la casa assorbe troppo.

### L'interruttore — `cumulus_cave_hp_solar_switch`

```yaml
- id: cumulus_cave_hp_solar_switch
  alias: "Cumulus Cave - Bascule HP solaire si incomplet"
  mode: single
  triggers:
  - trigger: time
    at: '14:09:00'
  conditions:
  - condition: state
    entity_id: input_boolean.water_heating_incomplete_cave
    state: 'on'
  - condition: state
    entity_id: input_boolean.vacation
    state: 'off'
  - condition: state
    entity_id: binary_sensor.solar_hi_production
    state: 'on'
  - condition: numeric_state
    entity_id: sensor.evse_10_0_0_120_house_power
    below: 1500
  - condition: template
    value_template: >
      {% set solar = states('sensor.ecu_current_power') | float(0) %}
      {% set house = states('sensor.evse_10_0_0_120_house_power') | float(0) %}
      {{ (solar - house) >= (2900 * 1.1) }}
  actions:
  - action: switch.turn_on
    target:
      entity_id: switch.shellyplus1_a8032abcd060_switch_0
  - action: input_boolean.turn_on
    target:
      entity_id: input_boolean.water_heating_solar_extend_cave
  - action: notify.notify
    data:
      title: "Chauffe Eau Cave"
      message: >-
        Reprise chauffe en HP solaire.
        Surplus: {{ ((states('sensor.ecu_current_power')|float(0) -
        states('sensor.evse_10_0_0_120_house_power')|float(0))) | round(0) }}W
```

Le condizioni riassumono tutta la strategia:

- **`water_heating_incomplete_cave` su on** — la finestra HC di mezzogiorno non è bastata (si prolunga solo se necessario).
- **`solar_hi_production` su on e casa sotto i 1500 W** — c'è sole e il resto della casa non lo consuma.
- **La regola del surplus**: `solar - house >= 2900 * 1.1`. Lo scaldabagno della cantina assorbe circa 2,9 kW; il fattore ×1.1 è il mio margine di sicurezza per non importare mai elettricità in tariffa HP fingendo di usare il solare. Quello del garage, ~1,1 kW, usa `1100 * 1.1`.

Quando le condizioni sono verificate, lo scaldabagno si accende e il flag `water_heating_solar_extend_cave` viene alzato per dire al resto del sistema "c'è un ciclo HP solare in corso".

![Curva di produzione solare con il ciclo HP delle 14:09 visibile](/images/smart-water-heater-orchestration-solar-off-peak-v2/02-solar-surplus.png)

### La sentinella — `cumulus_cave_hp_solar_watch`

Durante un ciclo HP solare, `cumulus_cave_hp_solar_watch` fa la guardia e sceglie tra due esiti: chiudere in modo pulito, oppure fermarsi e lasciare che sia il ciclo notturno a finire il lavoro.

```yaml
- id: cumulus_cave_hp_solar_watch
  alias: "Cumulus Cave - Veille solaire HP"
  mode: single
  max_exceeded: silent
  triggers:
  - trigger: state
    entity_id: binary_sensor.solar_hi_production
    from: 'on'
    to: 'off'
  - trigger: numeric_state
    entity_id: sensor.evse_10_0_0_120_house_power
    above: 1500
    for: 00:02:00
  - trigger: numeric_state
    entity_id: sensor.energy_meter_cumulus_cave_power
    below: 50
    for: 00:05:00
  conditions:
  - condition: state
    entity_id: input_boolean.water_heating_solar_extend_cave
    state: 'on'
  actions:
  - choose:
    - conditions:
      - condition: numeric_state
        entity_id: sensor.energy_meter_cumulus_cave_power
        below: 50
      sequence:
      - action: input_boolean.turn_off
        target:
          entity_id: input_boolean.water_heating_solar_extend_cave
      - action: input_boolean.turn_off
        target:
          entity_id: input_boolean.water_heating_incomplete_cave
      - action: switch.turn_off
        target:
          entity_id: switch.shellyplus1_a8032abcd060_switch_0
      - action: notify.notify
        data:
          title: "Chauffe Eau Cave"
          message: "Cycle HP solaire termine (thermostat)."
    sequence:
    - action: switch.turn_off
      target:
        entity_id: switch.shellyplus1_a8032abcd060_switch_0
    - action: input_boolean.turn_off
      target:
        entity_id: input_boolean.water_heating_solar_extend_cave
    - action: notify.notify
      data:
        title: "Chauffe Eau Cave"
        message: "Arret HP solaire (soleil ou maison). Cycle de nuit prevu si incomplet."
```

Tre trigger, una rete di sicurezza:

- **Il sole sparisce** (`solar_hi_production` on → off) — il surplus è finito. Si ferma il ciclo HP e si lascia che sia il ciclo notturno a gestire il resto.
- **Casa sopra i 1500 W per 2 minuti** — un picco (forno, bollitore). Ci si ferma piuttosto che importare in tariffa HP per scaldare l'acqua.
- **Potenza sotto i 50 W per 5 minuti** — il termostato ha finito il serbatoio. Il ramo `choose` prende allora la *prima* alternativa: i flag vengono cancellati ("Cycle HP solaire termine (thermostat).").

Altrimenti (casi 1 o 2) prende la seconda alternativa: relè aperto, flag `solar_extend` cancellato — ma, punto cruciale, **`incomplete` resta su on**, così il ciclo notturno intelligente delle 02:00 sa che il lavoro non è finito.

Il guardiano `condition: water_heating_solar_extend_cave on` garantisce che la sentinella non intervenga mai in un ciclo HC normale o notturno - gestisce solo i cicli HP solari.

![La sentinella che interrompe un ciclo HP solare quando la casa fa un picco](/images/smart-water-heater-orchestration-solar-off-peak-v2/03-watch.jpg)

---

## Novità v2 - 3. Il "ciclo notturno intelligente" con tetto

Il vecchio completamento notturno faceva un ciclo fisso di 2 ore. Il nuovo è un ciclo disciplinato da `wait_for_trigger` con un tetto duro sui minuti:

```yaml
- id: cumulus_cave_smart_night
  alias: "Cumulus Cave - Cycle de nuit intelligent"
  mode: single
  triggers:
  - trigger: time
    at: '02:00:00'
  conditions:
  - condition: state
    entity_id: input_boolean.water_heating_incomplete_cave
    state: 'on'
  - condition: state
    entity_id: input_boolean.vacation
    state: 'off'
  - condition: state
    entity_id: input_boolean.water_heating_solar_extend_cave
    state: 'off'
  variables:
    cap_min: "{{ states('sensor.cumulus_cave_typical_heat_min') | int(90) }}"
  actions:
  - action: notify.notify
    data:
      title: "Chauffe Eau Cave"
      message: "Cycle de nuit (max {{ cap_min }}min, thermostat prioritaire)."
  - action: switch.turn_on
    target:
      entity_id: switch.shellyplus1_a8032abcd060_switch_0
  - wait_for_trigger:
    - trigger: numeric_state
      entity_id: sensor.energy_meter_cumulus_cave_power
      below: 50
      for: 00:05:00
    - trigger: state
      entity_id: sensor.energy_meter_cumulus_cave_power
      to: 'unavailable'
    timeout:
      minutes: "{{ cap_min }}"
    continue_on_timeout: true
  - action: switch.turn_off
    target:
      entity_id: switch.shellyplus1_a8032abcd060_switch_0
  - action: input_boolean.turn_off
    target:
      entity_id: input_boolean.water_heating_incomplete_cave
  - action: notify.notify
    data:
      title: "Chauffe Eau Cave"
      message: "Cycle de nuit termine (cap {{ cap_min }}min atteint ou thermostat)."
```

Il termostato spegne lo scaldabagno quando il serbatoio è pronto, quindi l'automazione si limita ad attendere quell'evento - ma non lascia mai scaldare oltre il tetto configurabile. `cap_min` arriva dal template sensor `sensor.cumulus_cave_typical_heat_min` e dall'`input_number` corrispondente (90 min cantina, 60 min garage) per regolare il tetto dal cruscotto senza toccare lo YAML:

```yaml
# components/input_number.yaml
cumulus_cave_max_night_heat_min:
  name: Cumulus Cave - Max Night Heat (min)
  min: 30
  max: 180
  step: 5
  initial: 90
  unit_of_measurement: "min"
  icon: mdi:timer-sand
  mode: slider

# templates/sensors.yaml
- sensor:
    - unique_id: cumulus_cave_typical_heat_min
      unit_of_measurement: min
      name: "Cumulus Cave Typical Heat Duration"
      icon: mdi:timer-sand
      state: >
        {% set raw = states('input_number.cumulus_cave_max_night_heat_min') | float(90) %}
        {{ [120, [45, raw] | max] | min | round(0) }}
```

E se ci sono ospiti (o si vuole semplicemente un pieno completo senza limiti), il comando manuale esiste ancora: `input_boolean.force_cumulus_hc` più l'automazione `force_cumulus_nigh`, che accende entrambi gli scaldabagni alle 01:24 senza considerare i tetti.

```yaml
- id: force_cumulus_nigh
  alias: Forcer Cumulus la nuit
  mode: parallel
  triggers:
  - trigger: time
    at: 01:24:00
  conditions:
  - condition: and
    conditions:
    - condition: state
      entity_id: input_boolean.vacation
      state: 'off'
    - condition: state
      entity_id: input_boolean.force_cumulus_hc
      state: 'on'
  actions:
  - action: switch.turn_on
    entity_id: switch.shellyplus1_7c87ce637064_switch_0
  - action: switch.turn_on
    entity_id: switch.shellyplus1_a8032abcd060_switch_0
```

---

## I numeri veri (dalla mia istanza live)

Piuttosto che una tabella da marketing, ecco i valori reali di questa estate:

| Metrica | Cantina | Garage |
|---|---|---|
| Tempo ON ultimi 7 giorni (media) | 1,28 h/giorno | 0,59 h/giorno |
| Tempo ON ultimi 7 giorni (mediana) | 1,15 h | 0,58 h |
| Energia quel giorno | 5,93 kWh | 2,33 kWh |
| Energia totale dall'installazione | 1181,74 kWh | 447,72 kWh |
| `typical_heat_min` (input) | 90 min | 60 min |

I massimi sui 7 giorni sono stati cantina 4,0 h e garage 3,15 h — i giorni in cui il mattino non era bastato e la sentinella della sera tirava a lungo.

Ho estratto questi dati dall'API delle statistiche in serata, quando i pannelli erano già spenti (`solar_hi_production` off, `ecu_current_power` 0 W) — quindi i valori "quel giorno" descrivono la giornata completa, non uno stato in corso.

---

## Cosa non è cambiato

- **Il relè Shelly Plus 1 + la misura Shelly EM** dell'[articolo del 2022](/smart-water-heater-with-home-assistant-and-shelly-device/) — ancora la base fisica.
- **Il toggle vacanze** e la **pianificazione della finestra HC** — ancora la porta d'ingresso della casa.
- **Il garage è il gemello della cantina**: ogni automazione descritta qui esiste anche in versione `cumulus_garage_*` (`cumulus_garage_thermostat_complete`, `cumulus_garage_hp_solar_switch`, `cumulus_garage_hp_solar_watch`, `cumulus_garage_smart_night`) con i propri entity_id, le proprie soglie (il garage usa `1100 * 1.1`) e un tetto notturno di 60 minuti.
- **La configurazione interna dello scaldabagno** (setpoint di temperatura, modalità ECO del serbatoio) — intatta; lo strato di automazione fa solo da interruttore sul relè.

---

## Nota onesta sul rollout (promemoria)

Come detto all'inizio: tutte le automazioni v2 di questo post sono **nella mia configurazione e in fase di attivazione**. Ho verificato via API prima di scrivere che la mia istanza live gira ancora sul sistema v1 - `automation.cumulus_cave_actives_en_hc` (scattata oggi alle 12:09), `automation.comulus_desactives_en_hp` (14:09), `automation.cumulus_garage_actives_en_hc` (13:00), più la vecchia `set_heating_incomplete_flag_cave` che tira ancora. Le voci `enabled: false` sopra descrivono lo stato della configurazione nel repository; il passaggio in produzione avverrà dopo aver validato la coppia v2 su alcuni giorni di sole e di cielo coperto. Config prima, live poi - è il rollout di una casa vera.

---

## Avvertenze

- **È specifico della Francia (Heures Creuses / Heures Pleines).** Una tariffa con una sola finestra diurna + notturna non esiste ovunque; il margine 1,1× e la soglia 1500 W sono le mie costanti, non le vostre.
- **Non sono un elettricista.** Il cablaggio dello scaldabagno (differenziale 30 mA, cavo sovradimensionato, terra) è fatto da un installatore certificato; descrivo la logica di Home Assistant, non il cablaggio.
- **Nessuna batteria, per ora.** Se ci fosse, il calcolo sarebbe diverso.
- **La colonnina di ricarica è un progetto separato** (il sensore `house_power` è il contatore lato casa della colonnina V2C, non il consumo proprio dell'auto).
- **Uno scaldabagno grande è un carico elastico chiave** — trattate lo scaldabagno come un consumatore di primo piano.

Se dovessi rifare tutto da zero, la coppia che manterrei identica è: rilevamento tramite termostato + la logica «interrompi o termina» della sentinella. È ciò che ha trasformato un'approssimazione oscillante in un sistema marginale affidabile.