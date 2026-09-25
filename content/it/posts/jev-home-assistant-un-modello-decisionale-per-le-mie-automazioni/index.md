---
title: 'Jev in Home Assistant: lascio a un modello decisionale le scelte di buon senso'
categories:
- smart-home
tags:
- home-assistant
- smart-home
- automation
- ai
- llm
- jev
- laya
- openrouter
date: '2026-09-25T18:00:00.000000+00:00'
draft: false
slug: jev-home-assistant-un-modello-decisionale-per-le-mie-automazioni
translationKey: jev-home-assistant
cover: cover.jpg
showHero: true
description: Come ho collegato Jev, il modello decisionale di TypeSafe, a Home Assistant per rispondere alle domande che le mie regole YAML non sapevano gestire ("è normale?"), senza mai lasciargli prendere il loro posto. Le integrazioni disponibili, lo schema della modalità shadow, sei automazioni reali, quanto costa al giorno e cosa aspettarsi da Laya in locale.
summary: Le mie automazioni sono brave con le soglie e negate con il contesto. Jev risponde a domande tipizzate con una probabilità calibrata, per circa due millesimi di centesimo a domanda. Ecco come l'ho collegato a Home Assistant tenendo le vecchie regole come rete di sicurezza, e quanto costa davvero.
---

Tutte le installazioni di Home Assistant che conosco finiscono con lo stesso tipo di automazione: *"se il valore supera X per Y minuti, manda una notifica"*. Funziona, finché non funziona più. La pompa di sollevamento gira per due minuti dopo una notte di temporale: allarme. Qualcuno si fa una doccia lunga: allarme "possibile perdita". La lavatrice si ferma per l'ammollo: notifica "ciclo terminato", con venti minuti di anticipo. Dopo un po' le notifiche non le leggi più, che per un allarme è il risultato peggiore possibile.

Il problema non è la soglia. Il problema è che la regola non ha la minima idea del **contesto**: stanotte sono caduti 14 mm di pioggia, sono le 7 di un giorno feriale, finora la lavatrice ha consumato solo 0,3 kWh. Una persona guarderebbe questi dati e direbbe "è normale". Una soglia no.

Nel mio [articolo precedente](/it/system-one-router-scegliere-llm-giusto-per-ogni-prompt/) ho usato **Jev**, un modello decisionale "System One", per smistare i prompt tra diversi LLM. Mentre ci lavoravo continuavo a pensare: *è esattamente la domanda che la mia casa si fa tutto il giorno*. Così ho passato una serata con Claude Code sulla mia configurazione di Home Assistant e ho affidato a Jev le decisioni di buon senso. Questo articolo racconta cosa ne è venuto fuori.

## Jev in due minuti

[Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev) è un modello di **TypeSafe** che non scrive testo. Gli passi uno *state* (qualche riga che descrive la situazione) e una domanda *tipizzata*, e lui risponde con una probabilità:

*   **`noul`**: sì o no, con la probabilità del "sì";
*   **`choice`**: una tra N opzioni che descrivi tu, con l'intera distribuzione;
*   **`score`**: un livello su una scala di cui descrivi tu ogni gradino.

La versione attuale è la 1.13. Si usa direttamente da TypeSafe oppure [tramite OpenRouter](https://openrouter.ai/typesafe/jev-1.13) a **0,042 $ per milione di token in input, output gratis**, con una finestra di 32k token. I riferimenti ufficiali sono la [guida di OpenRouter](https://openrouter.ai/docs/guides/community/jev) e la [documentazione di TypeSafe](https://docs.typesafe.ai) (c'è perfino una [demo per la smart home](https://docs.typesafe.ai/demos/smart-home)).

Perché è interessante per una casa: nel [benchmark del router](/it/system-one-router-scegliere-llm-giusto-per-ogni-prompt/), Jev era sicuro di sé sull'82% delle risposte, e il 95% di quelle era giusto. **La confidenza è reale.** Ed è proprio questo che permette di metterlo in un'automazione senza patemi: quando non è sicuro lo dice, e si può ripiegare su qualcos'altro.

## Quale integrazione per Home Assistant?

Jev ha solo poche settimane e l'ecosistema cambia di giorno in giorno, quindi ho dato un'occhiata a tutto quello che esiste oggi (fine settembre 2026). In breve: **è tutto fatto dalla community, niente è ufficiale e niente è ancora nella lista predefinita di HACS.** Si installa aggiungendo un repository personalizzato in HACS.

| Progetto | Cosa offre | Note |
| --- | --- | --- |
| [**AboveColin/HA-Jev**](https://github.com/AboveColin/HA-Jev) | Azioni `jev.noul`, `jev.choice`, `jev.score`, `jev.ask`, `jev.calibrate`; sensori "domanda" creati dall'interfaccia; un `ai_task` e un agente di conversazione; sensori di token, costo e budget giornaliero | **Quella che uso io** (la 1.16 sul mio server). La più completa e molto attiva: esce una nuova release quasi ogni settimana. Dominio `jev`. |
| [AtHeartEngineer/HA-SystemOne](https://github.com/AtHeartEngineer/HA-SystemOne) | Le stesse azioni, sensori in YAML, un router per Assist, sensori di utilizzo; documenta i server `/v1/systemone` self-hosted | **Usa anche lei il dominio `jev`**: installatene una o l'altra, mai tutte e due. |
| [JanOstrowka/typesafe-assist](https://github.com/JanOstrowka/typesafe-assist) | Solo un agente di conversazione, con un agente di fallback | Solo in inglese. |
| [minuteman3](https://github.com/minuteman3/home-assistant-typesafe) / [allenporter](https://github.com/allenporter/home-assistant-typesafe) home-assistant-typesafe | Un agente di conversazione con soglie di confidenza, può puntare a un server locale | Ancora acerba (0.1). |
| [ayali/node-red-contrib-jev](https://github.com/ayali/node-red-contrib-jev) | Un nodo `jev` per Node-RED | Se le vostre automazioni stanno in Node-RED. |

Una nota sulle "integrazioni OpenRouter": quelle generiche per Home Assistant parlano *chat completions*. Jev ha la sua API decisionale (`/v1/systemone`), quindi non possono usarlo. Serve per forza uno dei progetti qui sopra.

### Installare HA-Jev

1.  **HACS → ⋮ → Repository personalizzati**, aggiungete `https://github.com/AboveColin/HA-Jev` come **Integrazione**.
2.  Cercate **Jev**, scaricatelo, riavviate Home Assistant.
3.  **Impostazioni → Dispositivi e servizi → Aggiungi integrazione → Jev (TypeSafe)**.
4.  Incollate una chiave API. Con una chiave TypeSafe avete finito. Io avevo già una chiave **OpenRouter** dal progetto del router, quindi ho aperto la sezione *Avanzate* e ho impostato:
    *   Indirizzo API: `https://openrouter.ai/api` (non `/api/v1`: `/v1/systemone` lo aggiunge l'integrazione da sola);
    *   Modello: `~typesafe/jev-latest` (la `~` fa parte dell'id).

La chiave viene verificata con una richiesta vera prima di creare la voce. Poi, nelle opzioni, impostate un **budget giornaliero di token in input**: di default è 0 (nessun limite). Quando il budget è esaurito, l'integrazione smette di chiamare Jev e `binary_sensor.jev_daily_budget_exceeded` passa a on. Questo sensore lo uso più avanti.

Dall'interfaccia si possono creare delle "domande" (un sensore che richiede a Jev ogni pochi minuti), ma io non l'ho fatto. **Volevo Jev dentro le automazioni che ho già, non di fianco.**

## Lo schema: Jev consiglia, la regola resta

È la parte di cui vado più fiero, e quella che copierei se fossi in voi. Jev non è mai l'unica cosa che separa una perdita d'acqua da una notifica. Ogni automazione che chiede qualcosa a Jev calcola anche **cosa avrebbe risposto la vecchia regola**, e lo passa come `fallback`. Poi un unico `input_select.jev_mode` decide chi vince:

*   **`shadow`** (il default, una specie di modalità "ombra"): Jev viene interrogato e la sua risposta finisce nel registro, ma si usa quella della regola. In casa non cambia niente.
*   **`active`**: si usa la risposta di Jev, *a meno che* la chiamata fallisca, il budget giornaliero sia finito, l'integrazione non sia caricata o (per le scelte) la confidenza sia sotto un minimo. In quei casi vince la regola.
*   **`off`**: Jev non viene proprio chiamato.

```mermaid
flowchart TD
    T(["Trigger: pompa · acqua · umidità · lavatrice"]) --> R["La vecchia regola calcola la sua risposta<br/>(il fallback)"]
    R --> M{"jev_mode su off?<br/>budget finito?"}
    M -->|sì| U["Usa la risposta della regola"]
    M -->|no| J["Chiedi a Jev (noul / choice)"]
    J -->|"shadow, errore<br/>o confidenza bassa"| U
    J -->|"active e sicuro"| V["Usa la risposta di Jev"]
    U --> L[("Registro: jev=… rule=… → scelta")]
    V --> L
```

Tutto passa da due script condivisi, `script.jev_yes_no` e `script.jev_choice`, in un file `packages/jev.yaml`. Ogni decisione scrive una riga nel registro (il logbook) tipo `jev=True (p=0.93) rule=False -> False [rule, shadow]`. È quel registro che leggo prima di passare `jev_mode` su `active` (è un solo interruttore per tutta la casa): le righe in cui Jev e la regola non sono d'accordo sono esattamente i casi da guardare. È andato tutto in produzione in modalità `shadow`, e mentre scrivo è ancora lì. Il piano: una o due settimane in shadow, un giro sui disaccordi, e solo dopo `active`.

Ecco il cuore dello script sì/no (accorciato):

```yaml
script:
  jev_yes_no:
    mode: parallel
    fields:
      decision: {required: true}      # short name for the logbook
      facts: {required: true}         # the situation, one fact per line
      instructions: {required: true}  # the yes/no question
      background: {}                  # standing facts about the house
      threshold: {default: 0.5}
      fallback: {required: true}      # what the old rule answers
    sequence:
    - variables:
        mode: "{{ states('input_select.jev_mode') }}"
        rule_result: {answer: "{{ fallback | bool }}", source: rule}
    # Jev off, not loaded or over budget: the rule answers, full stop.
    - if: "{{ mode not in ['shadow', 'active'] or not is_state('binary_sensor.jev_daily_budget_exceeded', 'off') }}"
      then:
      - stop: Jev not available
        response_variable: rule_result
    - action: jev.noul
      continue_on_error: true         # a Jev error must never break the automation
      response_variable: jev
      data:
        state: "{{ facts }}"
        instructions: "{{ instructions }}"
        background: "{{ background }}"
        threshold: "{{ threshold }}"
    - variables:
        ok: "{{ jev is defined and jev.noul is defined }}"
        use_jev: "{{ ok and mode == 'active' }}"
        result:
          answer: "{{ jev.is_true if use_jev else fallback | bool }}"
          source: "{{ 'jev' if use_jev else 'rule' }}"
    - action: logbook.log
      data:
        name: "Jev · {{ decision }}"
        entity_id: input_select.jev_mode
        message: >-
          {% if ok %}jev={{ jev.is_true }} (p={{ jev.noul | round(2) }}){% else %}jev=error{% endif %}
          rule={{ fallback }} -> {{ result.answer }} [{{ result.source }}, {{ mode }}]
    - stop: Decision taken
      response_variable: result
```

Due dettagli piccoli ma importanti:

*   `continue_on_error: true` sulla chiamata a Jev, e `verdict is not defined or not verdict.answer` nelle automazioni: **qualsiasi errore finisce dalla parte della notifica.** Jev può solo *togliere* un allarme quando è sicuro, mai zittire la casa per sbaglio.
*   Le domande sono sempre formulate come **"è normale?"**, con una soglia alta (0,8, o 0,9 per una possibile perdita). Per stare zitto, Jev deve essere *sicuro* che sia tutto normale.

Sopra i due script generici c'è un piccolo script per ogni *tipo* di decisione (pompa, acqua, calo di temperatura, tapparelle, bucato). Ognuno contiene il prompt e raccoglie i dati, così alle automazioni basta dire *cosa è appena successo*.

### Cosa riceve davvero Jev

Lo "state" è testo semplice. Ecco cosa ha mandato la decisione della VMC un venerdì sera, generato dai miei sensori reali (ho tolto le due righe su chi è in casa e chi sta dormendo):

```text
Now: Friday 19:38
Current speed: Vitesse 1 (changed 33 minutes ago)
Upstairs bathroom humidity: 63.47 %
Parents' bathroom humidity: 65.16 %
Kitchen humidity: 75.49 %
Highest living-room humidity: 0.0 %
House average humidity: 69.5 %
Wet-room humidity trend: Falling Fast
Usual shower time: yes
Outdoor: unavailable °C, humidity 81 %
```

Insieme a questo partono la domanda, le tre opzioni con la loro descrizione e il background. L'azione `jev.choice` risponde con l'opzione scelta, la sua confidenza, l'intera distribuzione e qualche dato di servizio:

```yaml
choice: Vitesse 1          # one of the options, never free text
confidence: …              # 0 to 1
probabilities:             # the whole distribution
  "Off": …
  Vitesse 1: …
  Vitesse 2: …
model: …                   # the version that answered
latency_ms: …
usage: {input_tokens: …, output_tokens: …}
```

`jev.noul` è ancora più semplice: `noul` (la probabilità del "sì"), `is_true` (quella probabilità confrontata con la *vostra* soglia) e la soglia stessa. Gli autori dell'integrazione lo dicono chiaramente: un valore intorno a 0,5 significa *"non lo so"*, non *"vero a metà"*. Ecco perché la soglia la decide l'automazione, non il modello.

Adesso riguardate quello state. **L'umidità del soggiorno a 0% e la temperatura esterna `unavailable` sono vere.** Quando ho tirato fuori questi valori per l'articolo, i due sensori template che calcolano l'umidità massima per zona erano bloccati a 0, anche se tutte le stanze segnano tra il 55 e il 75%. E pure il modulo esterno Netatmo era offline. La vecchia regola della VMC legge gli stessi sensori, quindi era tornata in silenzio su *"mantieni la velocità attuale"*. Jev, almeno, riceve anche i valori grezzi stanza per stanza e vede che la cucina è al 75%.

Ed è il secondo motivo per cui mi piace la modalità shadow. **Scrivere i dati per Jev mi ha costretto a leggerli, e alcuni erano sbagliati.** Un modello non può essere migliore dei suoi input, e nemmeno una soglia. Solo che gli input di una soglia non li guardi mai, finché qualcosa non va storto. Prossimo passo nella mia lista: registrare i dati accanto a ogni decisione, non solo le due risposte.

## Sei automazioni diventate più furbe

Esistevano già tutte, e quasi tutte hanno un articolo dedicato su questo blog. Qui sotto racconto cosa ci aggiunge Jev. (I nomi delle entità sono semplificati, e ho lasciato fuori tutto quello che riguarda chi vive qui o quando la casa è vuota.)

### 1. La pompa di sollevamento: "sta piovendo, o il galleggiante è bloccato?"

Il [monitoraggio della pompa di sollevamento](/it/monitoring-the-sump-pump-with-home-assistant/) manda un avviso quando la pompa gira per 2 minuti di fila, un allarme a 10 minuti, e un altro ancora quando non parte da 48 ore. Tutti e tre hanno senso *in una giornata asciutta*, e tutti e tre sono rumore dopo un bel temporale (cicli lunghi) o in una settimana d'estate senza una goccia (nessun ciclo).

Adesso ogni allarme prima chiede a Jev:

```yaml
- action: script.jev_pompe_cave_normale
  continue_on_error: true
  response_variable: verdict
  data:
    situation: The pump has been running for 2 minutes without stopping
- condition: template
  value_template: "{{ verdict is not defined or not verdict.answer }}"
- action: notify.persistent_notification
  # ... unchanged
```

Lo script manda il tempo di funzionamento attuale, quello di oggi e della settimana, l'ultimo avvio e l'ultimo arresto, i tentativi di riavvio, il pluviometro, il meteo, la temperatura esterna e l'umidità della cantina. Il background spiega a Jev come si comporta questa pompa ("un ciclo normale dura meno di 2 minuti; dopo una pioggia forte può partire molte volte al giorno; nei periodi secchi può restare ferma per giorni; il pluviometro a volte non è disponibile, in quel caso basati sul meteo"). La domanda: *"Questo comportamento della pompa si spiega con un funzionamento normale piuttosto che con un guasto?"*, soglia 0,8.

Quell'ultima indicazione sul pluviometro è proprio il genere di cosa che in una soglia non puoi mettere, ed è esattamente quello che direi a qualcuno che mi tiene d'occhio la casa. E non è teoria: il giorno del deploy la batteria del pluviometro era al 6% e il sensore risultava non disponibile.

### 2. Acqua: una doccia lunga non è una perdita

Il sensore sul contatore generale dell'acqua misura la portata in L/min, e alimenta cinque allarmi: portata elevata (sopra 10 L/min per 2 minuti), possibile perdita (flusso continuo per 2 ore), consumo giornaliero eccessivo, e due per l'acqua che scorre mentre siamo in vacanza. Adesso ognuno chiede *"Questo consumo d'acqua si spiega con una normale attività domestica piuttosto che con una perdita o un rubinetto rimasto aperto?"*, passando la portata, il consumo di oggi rispetto a un giorno normale, lo stato della lavatrice, l'**umidità più alta tra bagni e cucina** (una doccia lì si vede nel giro di pochi minuti!), il meteo e la pioggia (per l'irrigazione del giardino) e se la casa è in modalità vacanza.

Il trucco dell'umidità è il mio preferito: il contatore non sa *dove* va l'acqua, ma i sensori di umidità delle stanze "umide" sì. (Come avete visto sopra, funziona solo se quel sensore di umidità non racconta balle.)

### 3. Cali di temperatura: finestra aperta o ciclo della pompa di calore?

Un allarme di "calo rapido di temperatura" per ogni camera (−3,6 °C in 30 minuti quando fuori ci sono meno di 15 °C) è il classico rilevatore di *qualcuno ha lasciato la finestra aperta*. Jev riceve la temperatura della stanza, il calo, la temperatura esterna, lo stato e il setpoint dei termostati della stanza, i sensori delle finestre *quando la stanza ne ha uno* e la velocità della ventilazione.

Collegare questa mi ha regalato una sorpresa. Per passare i sensori di tendenza a Jev, l'agente ha dovuto leggerli, e ha scoperto che **quattro su cinque puntavano a entità che non esistono** (mancava un suffisso `_2`). Quattro dei miei cinque allarmi di calo di temperatura erano fermi su `unknown` e semplicemente non potevano mai scattare. Ora che sono sistemati torneranno a scattare, e sarà Jev a evitare che diventino rumore. Stessa storia per la pompa: la riattivazione dopo 24 ore in seguito a uno spegnimento forzato sottraeva un numero da una data, andava in errore ogni volta e non partiva mai. Chiedere a un agente di collegare un modello nuovo a vecchie automazioni è anche un ottimo modo per fargliele rileggere.

### 4. Tapparelle contro il caldo

L'[automazione delle tapparelle](/homeassistant-close-cover-to-control-the-home-temperature-v2/) (in inglese) le abbassa al 40% quando il sole scalda le stanze. La regola confronta la temperatura della facciata con quella interna, ma i sensori della facciata stanno al sole, quindi in una mattina fredda e soleggiata segnano diversi gradi in più del dovuto.

Ora Jev riceve la temperatura interna, quella *all'ombra* della stazione meteo, i sensori delle facciate al sole (avvisandolo che sovrastimano), la massima prevista per oggi, la copertura nuvolosa, l'indice UV, l'elevazione e l'azimut del sole e le posizioni attuali. La domanda: *"Queste tapparelle vanno abbassate adesso per tenere fuori il calore del sole?"*, con il background: *"Nella stagione calda tenere fuori il caldo conta più della luce; nella stagione fredda il calore del sole è benvenuto."*

Una correzione di passaggio: il blocco "una volta al giorno" usava il `last_triggered` dell'automazione, che adesso cambia ogni 10 minuti, anche quando Jev dice "lasciale aperte". Ora usa un `input_datetime` scritto solo quando le tapparelle si muovono davvero, così la riapertura serale continua a funzionare.

### 5. VMC: un `choice` al posto di quattro automazioni

La [VMC smart](/smart-vmc-mechanical-ventilation-system/) (in inglese) era fatta di quattro automazioni a regole, con soglie e isteresi. Adesso c'è anche un'automazione `vmc_jev_decision` che fa un **`choice`** ogni 5 minuti (e subito, quando l'umidità sale in fretta):

```yaml
- action: script.jev_choice
  data:
    decision: VMC
    fallback: "{{ rule_speed }}"     # the four old automations, condensed in one template
    instructions: Which ventilation speed should the VMC run at right now?
    options:
      "Off": The air is dry enough everywhere, no ventilation needed
      Vitesse 1: Background ventilation for moderate humidity or stale air
      Vitesse 2: Extract steam fast after a shower, a bath or cooking (noisy)
    background: >-
      A wet room above about 70 % humidity usually means a shower or cooking.
      Speed 2 is noisy: avoid it at night or when the house is empty unless
      humidity is really high.
```

"La velocità 2 è rumorosa, evitala di notte a meno che non serva davvero": per Jev è una frase. Con le regole era una condizione in ogni automazione. In modalità `active` le quattro vecchie automazioni si mettono da parte, le loro soglie diventano il fallback, e una scelta con confidenza sotto 0,6 viene ignorata.

### 6. Bucato: pausa o fine del programma?

Il mio [rilevamento della fine del ciclo della lavatrice](/homeassistant-detect-washing-machine-cycle-completion/) (in inglese) si basa sulla potenza: sotto i 10 W per 2 minuti vuol dire finito. Peccato che alcuni programmi facciano l'ammollo, tengano l'acqua del risciacquo o facciano giri antipiega a pochi watt per 5-30 minuti.

Adesso, quando la potenza scende, Jev riceve il tempo trascorso, l'energia consumata dall'inizio, la potenza attuale e da quanto tempo la macchina è ferma, più un background che spiega come assorbono corrente una lavatrice e un'asciugatrice. Se Jev è **sicuro almeno al 75% che sia una pausa**, l'automazione aspetta fino a 30 minuti che la macchina riparta. Se riparte, niente notifica, e il ciclo non viene azzerato (così l'ora di inizio e l'energia continuano a contare dal vero inizio). Se Jev va in errore o in timeout: notifica, come prima.

## Quanto costa?

Era la parte che mi incuriosiva di più. Ecco il log delle attività di OpenRouter per Jev, in una sera qualsiasi:

![Log delle attività di OpenRouter: una chiamata a Jev 1.13 ogni 5 minuti, 565 token in input, 50 in output, 0,0000237 $ ciascuna](openrouter-activity.webp "Una chiamata a Jev ogni 5 minuti: la decisione della VMC. 565 token in input, 50 in output (gratis), 0,0000237 $ a chiamata.")

Ogni riga è il `choice` della VMC, uno ogni 5 minuti: **565 token in input, 50 in output, 0,0000237 $ a chiamata**. Il conto è presto fatto:

| | Chiamate | Costo |
| --- | --- | --- |
| Decisione VMC, ogni 5 minuti | 288 / giorno | ~0,0068 $ / giorno |
| Tapparelle, ogni 10 minuti nella loro fascia oraria, finché non si chiudono | fino a ~110 / giorno | ~0,003 $ / giorno |
| Pompa, acqua, temperatura, bucato (solo su eventi) | qualcuna / giorno | trascurabile |
| **Totale** | | **< 0,01 $ / giorno, circa 3 $ / anno** |

HA-Jev tiene il suo conteggio, quindi non devo fidarmi dei miei calcoli. Il primo giorno completo in produzione, alle 19:40, i sensori dell'integrazione segnavano:

*   `sensor.jev_calls_today`: **133**
*   `sensor.jev_input_tokens_today`: **75.201** (esattamente 565 a chiamata)
*   `sensor.jev_estimated_cost_today`: **0,0032 $**

Siamo in linea con circa mezzo centesimo per la giornata, come da tabella.

E la vista mensile, tutti i modelli insieme sul mio account:

![Costo mensile per modello su OpenRouter: Jev 1.13 a 0,02 $ per tutto il mese](openrouter-month.webp "Tutto il mese sul mio account OpenRouter. Jev fa 0,02 $ in totale, compreso il benchmark del router dell'articolo precedente.")

Due centesimi in un mese, *compreso* il benchmark da 80 prompt dell'articolo precedente e i test dell'integrazione. Jev lavora per la casa solo da pochi giorni, quindi un mese intero di decisioni domestiche dovrebbe stare intorno ai 20 centesimi.

Qualche considerazione onesta:

*   **La VMC fa il 90% delle chiamate, ed è colpa mia, non di Jev.** Chiedere ogni 5 minuti quando non è cambiato niente è pigrizia. Un trigger sulle variazioni di umidità, o saltare la chiamata quando i dati sono identici a quelli dell'ultima volta, dividerebbe il conto per cinque. A 3 $ l'anno non mi ci sono ancora messo, ma in una casa più grande sarebbe la prima cosa da sistemare.
*   **Circa metà di ogni chiamata è un costo fisso.** HA-Jev ha misurato circa 250 token fatturati a richiesta, qualunque sia la sua dimensione. Mandare 10 dati o 15 cambia pochissimo il prezzo, quindi non lasciate Jev a corto di contesto per risparmiare token.
*   **Un LLM economico potrebbe farlo allo stesso prezzo?** Sulla carta sì: Qwen 3.7 flash costa più o meno uguale a chiamata, *se* non si mette a ragionare. Nell'articolo sul router ha speso 1.800 token di ragionamento per dire "ciao", il che lo rende dieci volte più caro. Sonnet 5 starebbe sui 0,0016 $ a chiamata, cioè ~14 $ al mese solo per la VMC. Ma il punto non è il prezzo. Il punto è che Jev restituisce una **risposta tipizzata con una probabilità calibrata**: niente JSON da parsare, niente "Certo! Ecco la mia risposta", e un numero da confrontare con una soglia.
*   **Impostate comunque il budget.** Un trigger che fa su e giù in `mode: parallel` potrebbe andare in loop. Il budget giornaliero di token di HA-Jev lo trasforma in un `binary_sensor` che gli script controllano prima di ogni chiamata. Con ~170k token al giorno, un budget di 500k lascia margine in abbondanza.

### E la privacy?

È la parte a cui pensare prima di copiare. I dati che mando includono se la casa è in modalità "fuori casa" o "vacanza" e se stiamo dormendo. È un contesto utile ("acqua che scorre mentre non c'è nessuno" è sospetto), ma vuol dire che un servizio esterno riceve, ogni 5 minuti, una piccola descrizione di chi c'è in casa mia. TypeSafe e OpenRouter hanno le loro policy sui dati: leggetele, e decidete voi quali dati vale la pena mandare. Il che mi porta a Laya.

## Laya potrebbe farlo in locale?

Nell'articolo sul router ho confrontato Jev con [**Laya**](https://huggingface.co/convaiinnovations/laya), un modello open weights di Convai Innovations che risponde alle stesse domande `choice` / `score` / `noul` e gira su un portatile. Per una casa, "in locale" non è un dettaglio: toglie di mezzo sia il problema della privacy sia la dipendenza da internet.

**Come collegarlo.** HA-Jev e HA-SystemOne accettano un indirizzo API personalizzato senza chiave, e chiamano `<indirizzo>/v1/systemone`. Quindi qualsiasi server locale che parla l'API di Jev può prenderne il posto:

*   il [sidecar Laya di system-one-router](https://github.com/mmornati/system-one-router/tree/main/sidecar) parla già il formato di richiesta di Jev. Oggi risponde su `/decisions`, quindi per usarlo da Home Assistant gli serve una route in più (`/v1/systemone`): una modifica di una riga;
*   esistono server della community come [stuntd](https://github.com/bladedevoff/stuntd) (prima Laya, Jev quando non è sicuro), ma non li ho provati;
*   [allenporter/home-assistant-laya](https://github.com/allenporter/home-assistant-laya) fa girare Laya *dentro* Home Assistant, ma solo come agente di conversazione, non per le azioni `noul` / `choice` che usano i miei script.

**Cosa aspettarsi, in base al benchmark.** Attenzione: il benchmark misurava *prompt da smistare*, non sensori di casa, quindi questa è un'estrapolazione.

| | Jev 1.13 | Laya inglese (zero-shot) |
| --- | --- | --- |
| Accuratezza | 89% | 59% |
| Risposte sicure (≥ 0,8) | 82%, di cui il 95% giuste | **12%**, ma 10 su 10 giuste |
| Errore di calibrazione (più basso è meglio) | 0,080 | 0,171 |
| Finestra di contesto | 32k token | 512 token (1.024 multilingue) |
| Latenza | ~300-500 ms (rete; 0,46 s per la prima chiamata da casa mia) | 30-70 ms su GPU M4, ~0,5 s su CPU |
| Costo | ~3 $ / anno qui | 0 $ |

Cosa significa con i *miei* script:

*   **Laya non farebbe danni, ma così com'è servirebbe a poco.** La sua bassa confidenza finisce dritta nei miei fallback: sotto 0,8 nessun allarme viene soppresso, e sotto 0,6 la VMC tiene la velocità della regola. Quindi Laya zero-shot vi darebbe… più o meno le vostre vecchie regole, più qualche correzione di cui è sicuro. Nessun danno, poco guadagno. È la stessa lezione del router: *un modello decisionale insicuro è una macchina da fallback.*
*   **Quando è sicuro, ci azzecca.** È la proprietà che conta prima di un fine-tuning, e il registro della modalità shadow è l'inizio di un dataset: ogni riga contiene la risposta di Jev e quella della regola, e registrando anche i dati accanto diventa materiale di addestramento su misura per la casa.
*   **Occhio alla finestra.** Le mie richieste stanno intorno ai 300 token di testo reale, che entrano nei 512, ma i prompt della pompa e delle tapparelle sono i più lunghi. Userei il checkpoint multilingue (1.024 token), che tra l'altro capisce meglio i nomi in francese delle mie entità.
*   **Occhio all'hardware.** Su una GPU Apple, Laya risponde più in fretta di Jev. Su una CPU tipo Raspberry, mettete in conto qualche secondo (il README di home-assistant-laya stima 1,5-3 s per comando). Per allarmi che aspettano già 2 minuti va benissimo. Per la VMC ogni 5 minuti, pure. Solo, non fatelo girare sulla stessa scatoletta di Home Assistant.

Il piano che seguirei: far girare Laya **in shadow accanto a Jev** (una terza colonna nel registro), raccogliere qualche settimana di decisioni e fare il fine-tuning sui dati della casa. A quel punto i dati sensibili per la privacy (fuori casa, vacanze, sonno) potrebbero andare solo a Laya, e il resto a Jev. È esattamente l'idea di `provider: auto` del router, applicata a una casa.

## Come è stato costruito

Come nei miei ultimi articoli: è stata un'unica sessione di Claude Code sul repository della configurazione di Home Assistant. Ho chiesto quali automazioni fossero "questioni di buon senso" più che regole, l'agente ha proposto lo schema shadow/active e gli script condivisi, ha scritto i prompt per ogni ambito e li ha collegati. Il mio lavoro è stato decidere quali decisioni meritano Jev (non tutte: una luce che segue un sensore di movimento non ha bisogno di un modello), controllare i prompt con quello che so della casa e rivedere il diff. I due bug trovati per strada sono stati un bel regalo.

Prima che qualcosa arrivasse in casa, l'agente ha tirato su Home Assistant 2026.9.3 in Docker con un'integrazione `jev` finta, e ha fatto passare gli script per tutti i percorsi: modalità shadow, active e off, budget superato, Jev che va in errore, confidenza bassa, scelta non valida e, per il bucato, una pausa, una ripresa e una fine vera. Il lavoro è arrivato come due pull request sul repository della configurazione (prima lo strato decisionale, poi il bucato), entrambe mergiate in modalità shadow.

### "Mergiato" non vuol dire "in produzione"

Poi è arrivata la parte che nessun test aveva coperto. La mia configurazione arriva sul server tramite un add-on GitOps che fa il pull di `main` ogni qualche ora. Dopo il merge ho chiesto all'agente di controllare che Jev stesse girando, e non ha trovato… niente: nessun `input_select.jev_mode`, zero chiamate a Jev quel giorno.

Salta fuori che l'add-on non faceva un pull **dal 18 agosto**. Quel giorno una modifica fatta direttamente sul server e una PR mergiata avevano toccato entrambe `automations.yaml`, il `git pull --rebase` si era fermato su un conflitto, e da allora ogni esecuzione falliva senza dire una parola. Home Assistant continuava a girare tranquillo sui vecchi file, quindi niente sembrava rotto. Cinque settimane di PR mergiate non erano semplicemente mai arrivate in casa.

Sistemare la cosa ha richiesto più attenzione del lavoro su Jev. Via SSH, all'inizio in sola lettura, l'agente ha confrontato il server con `main` file per file. Alcune modifiche esistevano solo sul server e un banale `git reset --hard` le avrebbe cancellate: qualche sensore che avevo ricollegato per la macchina, la configurazione live di Zigbee2MQTT con quattro dispositivi riassociati e settimane di aggiornamenti HACS. Ha trovato anche una copia di `secrets.yaml` con un nome che il `.gitignore` non copriva, e che l'add-on avrebbe allegramente pushato su GitHub al backup successivo. Quindi, in ordine:

1.  un backup completo del Supervisor (5,2 GB, verificato aprendolo);
2.  una PR che riportava in `main` tutto quello che esisteva solo sul server, più una regola nel `.gitignore` per qualsiasi file `secrets.yaml*`;
3.  una volta mergiata, un reset del server su `main`, un controllo della configurazione con il container di produzione, un riavvio e il riavvio dell'add-on.

Qualche minuto dopo è partita la prima decisione della VMC, con risposta in **0,46 s**. Jev era d'accordo con la regola, quindi nel registro non è finito niente. Il periodo in shadow è cominciato davvero quel giorno, il 25 settembre. Se usate un add-on GitOps, andate a controllare quand'è stato l'ultimo pull. Il mio falliva in silenzio da cinque settimane.

## Lezioni imparate

1.  **Usa un modello per la domanda "è normale?", tieni le regole per il resto.** Le soglie sono ottime per accorgersi *che* succede qualcosa; un modello decisionale è bravo a giudicare *se conta davvero*.
2.  **Non lasciare mai che il modello sia l'ultima linea di difesa.** La risposta della regola viene sempre calcolata, è sempre il fallback, e ogni errore finisce dalla parte della notifica.
3.  **Parti in modalità shadow e leggi i disaccordi.** Sono le uniche righe interessanti del registro.
4.  **Scrivi il background come se stessi spiegando la casa a chi te la guarda mentre sei via.** "Il pluviometro a volte non è disponibile, in quel caso basati sul meteo" vale più di qualsiasi ritocco alle soglie.
5.  **È il trigger a decidere quanto spendi.** Una decisione ogni 5 minuti costa 3 $ l'anno; resta comunque l'unica voce che valga la pena ottimizzare.
6.  **Pensa a cosa esce di casa.** Chi c'è e chi non c'è in casa è un dato personale. I modelli locali come Laya sono il modo per tenerlo tra le mura di casa, quando saranno abbastanza sicuri di sé.
7.  **Leggi i dati che mandi.** Un'umidità del soggiorno a 0% frega una soglia tanto quanto un modello. Scrivere il prompt è un controllo gratuito dei tuoi sensori.
8.  **Verifica che "mergiato" voglia dire "in esecuzione".** Cerca la nuova entità in produzione, non la spunta verde sulla PR.

Se avete collegato Jev (o Laya) alla vostra casa, mi piacerebbe molto sapere quali decisioni gli avete affidato, e quali vi siete ripresi. Raccontatemelo nei commenti!
