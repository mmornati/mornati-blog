---
title: 'Laya su un N100: sostituire Jev con un modello locale in Home Assistant, e insegnargli la mia casa'
categories:
- smart-home
tags:
- home-assistant
- smart-home
- automation
- ai
- jev
- laya
- fine-tuning
- distillation
- docker
- self-hosting
date: '2026-10-27T18:00:00.000000+00:00'
draft: false
slug: laya-su-un-n100-sostituire-jev-in-home-assistant-e-fare-il-fine-tuning
translationKey: laya-n100-home-assistant
cover: cover.jpg
showHero: true
description: Laya parla la stessa API di Jev, quindi l'ho messo in un container Docker sul mio mini PC N100 e ho collegato Home Assistant. Funziona, è lento ma abbastanza veloce, e le sue risposte così com'è sono inutili per la mia casa. Poi, come esperimento locale, ne ho fatto il fine-tuning sul mio MacBook con due settimane di richieste reali di Home Assistant. Come funziona l'addestramento, come servire il nuovo checkpoint, i numeri sui giorni tenuti da parte, e perché resta un esperimento.
summary: Un modello compatibile con Jev che gira su un mini PC a 4 core, senza che nessun dato dei miei sensori esca di casa. Così com'è, diceva "sì" quasi a tutto. Dopo un'ora di addestramento sul mio MacBook è d'accordo con Jev nel 93% dei casi, su giorni che non aveva mai visto. Abbastanza per la modalità shadow, non per gestire la casa, e con una questione di termini di servizio che non posso ignorare.
projects:
- ha-decision-models
---

Da un mese, il mio Home Assistant chiede a **Jev** le cose a cui le mie regole YAML non sanno rispondere bene: *conviene spingere la ventilazione adesso? Vanno abbassate queste tapparelle? Questo flusso d'acqua è normale?* Ho descritto il setup nel [primo articolo](/it/jev-home-assistant-un-modello-decisionale-per-le-mie-automazioni/) e lo storico e il ciclo di feedback nel [secondo](/it/jev-home-assistant-storico-feedback-e-la-questione-del-modello-locale/). Jev è il modello "System One" ospitato di TypeSafe: gli mandi uno stato JSON e delle domande tipizzate, lui restituisce probabilità calibrate, per una frazione di centesimo al giorno.

**Laya**, di Convai Innovations, è l'alternativa open weights che seguo dal [benchmark del router](/it/system-one-router-scegliere-llm-giusto-per-ogni-prompt/), passando per [un fine-tuning sulle mie etichette](/it/laya-vs-jev-dieci-giorni-dopo-fine-tuning-su-un-macbook/) e [la verifica della 0.4.2](/it/laya-0-4-2-e-vegaml-un-modello-decisionale-a-motore-fisico-su-un-macbook/). Parla la stessa API di Jev. E c'è un argomento a suo favore che nessun benchmark misura: se gira in casa, **nessun dato della mia casa va da nessuna parte**. L'umidità dei miei bagni, quando si muovono le tapparelle e se c'è qualcuno in casa sono esattamente il tipo di dati che preferisco tenere sulla mia rete.

Nel secondo articolo avevo spiegato perché non ero passato al locale sul mio mini PC N100. Questa volta ho smesso di discutere e l'ho installato. Questo articolo tratta:

1.  far girare Laya in Docker su un N100 e collegarlo a Home Assistant;
2.  cosa è successo quando ci ho rigiocato due settimane di richieste **reali** a Jev;
3.  un esperimento locale: **il fine-tuning di Laya su quelle richieste**, come funziona, come servire il risultato, e i numeri;
4.  se ne è valsa la pena.

## Laya in un container su un N100

L'hardware è un piccolo box Intel N100: 4 core, 16 GB di RAM, nessuna GPU, e già occupato da altri container. Lo gestisco con Coolify, ma va bene qualsiasi host Docker. Laya ha un suo server, `laya-serve`, che espone `POST /v1/systemone` con la stessa forma di richiesta e risposta di Jev.

La mia prima versione installava tutto all'avvio del container:

```yaml
services:
  laya-api:
    image: python:3.13-slim
    restart: unless-stopped
    command: >
      sh -c "pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu &&
             pip install --no-cache-dir 'laya[serve]' &&
             laya-serve"
    environment:
      - LAYA_HOST=0.0.0.0
      - LAYA_PORT=8000
      - LAYA_SERVER_PRELOAD=multilingual
      - OMP_NUM_THREADS=4
      - PYTHONUNBUFFERED=1
    volumes:
      - laya_model_cache:/root/.cache/huggingface
    ports:
      - "8180:8000"
    healthcheck:
      test: ["CMD", "python3", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 30s
      start_period: 120s

volumes:
  laya_model_cache:
```

Funziona, ed è un buon modo per provare Laya in cinque minuti. Qualche nota se decidete di tenerlo:

*   **Usate la wheel di PyTorch solo CPU.** Quella di default si porta dietro librerie CUDA che su un N100 non servono e pesa gigabyte in più.
*   **Tenete la cache di Hugging Face in un volume**, altrimenti a ogni riavvio il checkpoint viene scaricato di nuovo.
*   **`OMP_NUM_THREADS=4`** corrisponde ai quattro core dell'N100. Aggiungere worker o repliche non aiuta: ogni richiesta usa già tutti e quattro i core.
*   **Fissate le versioni.** Questo `command:` reinstalla un `laya[serve]` senza versione fissata a ogni riavvio, quindi un riavvio può portare in silenzio una nuova versione che risponde in modo diverso, dopo diversi minuti di installazione. Quando sapete di volerlo tenere, mettetelo in un'immagine:

```dockerfile
FROM python:3.13-slim
RUN pip install --no-cache-dir torch==2.14.1 --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir "laya[serve]==0.4.15"
ENV LAYA_HOST=0.0.0.0 LAYA_PORT=8000 OMP_NUM_THREADS=4 PYTHONUNBUFFERED=1
CMD ["laya-serve"]
```

Precarico il checkpoint **multilingue**: legge 1.024 token, contro i 512 di quello inglese, e le mie richieste sono lunghe.

### Collegarlo a Home Assistant

L'[integrazione HA-Jev](https://github.com/AboveColin/HA-Jev) che uso accetta già un indirizzo personalizzato. Quindi il passaggio è una modifica di configurazione, non di codice: una seconda voce con l'URL `http://<your-laya-host>:8180`, il modello `multilingual` e nessuna API key (l'integrazione avvisa che si usa HTTP in chiaro, il che su una LAN è accettabile). Gli script che interrogano Jev accettano un `config_entry`, quindi ogni decisione può essere indirizzata all'uno o all'altro.

Questa era la parte facile. Quello che è venuto dopo è stato meno divertente.

## Primi risultati: funziona, lentamente, e le risposte sono sbagliate

### Laya taglia la richiesta, e Home Assistant non se ne accorge

Il mio primo test è stato una richiesta reale per la VMC (la ventilazione), quella in cui Jev decide se attivare la rumorosa velocità 2. Laya ha risposto 0,9954, "boost", dove Jev aveva detto 0,49. Laya sembrava deciso. Poi ho letto il resto della risposta:

```json
"usage": {"input_tokens": 1024, "state_tokens": 960,
          "state_tokens_dropped": 196, "truncated": true}
```

Il checkpoint multilingue legge 1.024 token in tutto, e 256 sono riservati alla domanda e alle sue opzioni. Il mio stato della VMC è di circa 1.150 token, perché il [secondo articolo](/it/jev-home-assistant-storico-feedback-e-la-questione-del-modello-locale/) ha dato a Jev una memoria: tre ore di umidità per stanza, gli eventi recenti, ogni stanza confrontata con la propria mediana giornaliera. Laya semplicemente butta via la fine.

Due esperimenti hanno mostrato esattamente cosa si perde. Ho messo un fatto decisivo ("porta del garage aperta/chiusa") dopo 1.500 token di riempitivo: entrambe le versioni hanno restituito esattamente 0,7307, quindi Laya non l'ha mai visto. Poi, sulla richiesta reale, mettere `away` e `sleeping` a on, o cambiare le soglie alla fine del background della domanda, ha restituito **esattamente** 0,9954 ogni volta. Laya taglia la **fine dello stato**, cioè proprio dove stavano i miei `away`, `sleeping`, i dati esterni e gli avvisi sui sensori inaffidabili. Limita anche la domanda a 256 token e taglia la fine di un background lungo senza segnalarlo.

E l'integrazione non te lo dice mai: il client legge le risposte e il conteggio dei token, non il flag `truncated`. In Home Assistant una risposta troncata sembra una risposta come le altre.

### Accorciare le richieste: solo se le risposte di Jev non cambiano

La soluzione ovvia è una richiesta più corta. Una versione compatta dello stato della VMC, con i fatti decisivi in testa e un blocco per stanza, è passata da 1.221 a 471 token. Ma tutti quei dati li avevo aggiunti *perché* a Jev servivano per decidere bene, quindi mi sono dato una regola: **un accorciamento entra solo se le risposte di Jev non si muovono più del rumore di Jev stesso**.

Claude Code ha prima misurato quel rumore: la stessa richiesta reale mandata due volte a Jev si sposta in media di 0,013 per la VMC e di 0,007 per le tapparelle. Poi ha tolto un campo alla volta su 50 situazioni reali, e infine ha testato le regole combinate su altre 200 (circa 1.400 chiamate a Jev, 0,10 $):

| Modifica alla VMC | Risparmio | Variazione media / max della risposta di Jev | Verdetto |
| --- | --- | --- | --- |
| Rimuovere le voci vuote | 126 B | 0,013 / 0,05 | rumore |
| Lista breve dei sensori inaffidabili | 76 B | 0,009 / 0,03 | rumore |
| Togliere le righe della pompa dagli eventi | 154 B | 0,039 / 0,14 | **Jev le usa** |
| Togliere umidità assoluta e guadagno della ventilazione | 104 B | 0,041 / 0,18 | **usati** |
| Togliere la serie di 3 ore | 741 B | 0,058 / 0,26 | **usata** |
| Togliere il testo di background | 1.079 B | 0,096 / 0,42 | **usato** |

Anche le regole "sicure", tutte insieme, hanno spostato le risposte sulla VMC il doppio del rumore e ribaltato quattro decisioni su 120. Sono passate solo le tapparelle: tenere i valori della serie senza i riepiloghi min/max fa risparmiare il 15% dei token senza alcun cambiamento, ed è finito nella mia configurazione. **La richiesta della VMC resta com'è.** Non entra in Laya, e farcela entrare peggiorerebbe Jev.

### È abbastanza veloce?

Per dimensionarlo, ho contato due settimane di chiamate reali a Jev: **1.416 chiamate, 101 al giorno, 4,2 all'ora** in media. Il minuto più affollato ne ha avute 4, ai :00 e ai :30, quando le domande programmate si allineano. Sull'N100, senza nient'altro che interroga:

| Richiesta | Tempo |
| --- | --- |
| Richiesta VMC completa (1.024 token, troncata) | **4,9 s** (7,8 s per la prima chiamata) |
| Richiesta VMC compatta (325 token) | **1,0 s** |
| 4 richieste contemporanee | 5,3 / 10,2 / 15,1 / **19,9 s** |

`laya-serve` gestisce **una richiesta alla volta**, quindi un picco finisce in coda. Con 4 insieme, l'ultima risposta arriva dopo 20 secondi, dentro il timeout di 30 secondi dell'integrazione ma senza molto margine. Il costo cresce più in fretta della lunghezza, quindi la vera accelerazione è una richiesta più corta, più di qualsiasi impostazione della CPU. Sull'arco della giornata, però, sono circa 8 minuti di lavoro della CPU. **Per una casa, lento va bene.** Aspetterei volentieri 5 secondi per una decisione sulla ventilazione, se significa che i miei dati restano a casa.

### Il vero test: due settimane di richieste reali

Fino a quel momento avevo una sola richiesta reale. Ma il logging dei prompt era attivo sul mio account OpenRouter, quindi le richieste reali c'erano tutte. Claude Code le ha lette nel browser, dopo che mi ero autenticato io: **1.416 richieste dall'11 al 25 ottobre, ognuna con il JSON esatto mandato da Home Assistant e la risposta di Jev**. Questi log mostrano quando c'è qualcuno in casa, quindi sono rimasti sul mio portatile, fuori da qualsiasi repository.

Ogni richiesta è andata a Laya senza modifiche. Dopo 396 il quadro era chiaro:

| Domanda | Laya base | Jev |
| --- | --- | --- |
| Boost della VMC | troncata ogni volta; "sì" a 0,994–0,999 ogni volta | "sì" nel 18% dei casi |
| Tapparelle | "abbassale" nel 99% dei casi | una volta |
| Irrigazione del giardino | "sì" nel 100% dei casi | mai |
| Quale luce accendere | stessa scelta di Jev nel 27% dei casi | |

Il troncamento non è il problema principale. Con lo stato completo visibile, su un esempio fatto a mano, una doccia in corso (90,8%, +16 punti in 15 minuti), una doccia di un'ora prima, un'umidità piatta e "tutti dormono" hanno ottenuto tutti tra 0,980 e 0,992. Gli ho dato i fatti come numeri, come parole ("in rapida salita, vapore fresco") e come un semplice flag `fresh_steam: true`: niente ha spostato la risposta nella direzione giusta. Sulla VMC, il suo ordinamento delle situazioni era appena migliore del caso (AUC 0,60 rispetto alle decisioni di Jev).

Questo corrisponde alla documentazione stessa di Laya: è un encoder da 322M parametri (mmBERT-base) pre-addestrato su compiti decisionali generici, le sue risposte sì/no possono seguire la formulazione delle opzioni più che lo stato, e gli autori dicono di considerarlo una base da specializzare. Una temperatura o una soglia non possono rimediare: riscalano i punteggi ma ne mantengono l'ordine, e qui è l'ordine a essere sbagliato.

Quindi, nella sua forma base, Laya non può sostituire Jev in casa mia. Il che mi porta alla parte che in [un articolo precedente](/it/laya-vs-jev-dieci-giorni-dopo-fine-tuning-su-un-macbook/) avevo detto che non avrei fatto.

## Un esperimento locale: insegnare a Laya partendo da Jev

### Prima di tutto, l'elefante nella stanza

Avevo 1.416 richieste reali, ognuna con le probabilità di Jev. Addestrare un modello a riprodurre quelle probabilità è **distillazione**: Jev è l'insegnante, Laya lo studente. Tre settimane fa avevo abbandonato proprio questo piano, perché il [contratto cliente](https://typesafe.ai/legal/mca) di TypeSafe (§2.3(b)) dice che non si possono usare il servizio o il suo output "to perform model distillation" né per "train a model to imitate the output of the Services" (cioè per fare distillazione o addestrare un modello che imiti l'output del servizio). Non prevede eccezioni per l'uso personale o non commerciale.

L'ho fatto comunque, come esperimento circoscritto, e voglio essere chiaro su cosa significa:

*   **È un test locale per casa mia.** È girato sul mio MacBook, sulle mie richieste, per la mia domotica. Niente è andato su Kaggle o su una GPU in cloud: i dati mostrano chi è in casa e quando.
*   **Non viene pubblicato niente.** Né il dataset, né i pesi, né gli script come prodotto. Da questo articolo non c'è nessun modello da scaricare, e non ci sarà. I pesi codificano comunque le abitudini della mia famiglia, il che è un secondo motivo per tenerli privati.
*   **Lo scopo era capire fin dove può arrivare Laya** con dati reali di una casa, e come funziona il suo addestramento, non costruire un sostituto di Jev per qualcuno.

Non pretendo che questo lo renda accettabile rispetto ai termini di TypeSafe: la clausola non guarda né alla scala né all'intenzione. Vi dico cosa ho fatto e cosa dicono i termini, così potete decidere da soli. E chiaramente non sono l'unico curioso. Su GitHub, [Mini-Jev](https://github.com/Shauryagulati/mini-jev) distilla Jev in Qwen3-1.7B e confronta supervised fine-tuning, distillazione con soft label e RL, e avverte i lettori di controllare i termini di TypeSafe prima di riusare i pesi. Su Hugging Face, [jev-distill-corpus-v3](https://huggingface.co/datasets/SargeDev/jev-distill-corpus-v3) pubblica circa mezzo milione di righe etichettate da Jev 1.13. Molti altri progetti "simili a Jev" ([Kev](https://github.com/jaredpalmer/kev), [system-one-open](https://github.com/mithalouni/system-one-open), [Von](https://huggingface.co/wfzyx/von)...) si addestrano invece su dataset pubblici o su etichette sintetiche proprie, ed è quella la strada pulita. Ci torno alla fine.

### Cos'è davvero Laya, e cosa cambia l'addestramento

Laya non è un modello di chat e non scrive mai testo. Per ogni domanda costruisce **una sequenza**:

```text
[CLS] <question type> instructions [SEP] [MASK] option 1 option 2 ... [SEP] state JSON [SEP]
```

Un encoder la legge tutta in una volta, e una piccola testa in cima la trasforma in probabilità sulle opzioni: `noul: 0.12`, oppure una probabilità per ogni scelta. Un solo forward pass, nessun passo di ragionamento, ed è per questo che un modello da 322M risponde in circa un secondo sulla CPU di un mini PC.

Il fine-tuning cambia i pesi, non il programma. Per ogni esempio di addestramento, Laya fa una previsione, la previsione viene confrontata con l'obiettivo, e tutti i pesi si spostano un po' verso di esso. Fatelo qualche centinaio di volte con un learning rate piccolo, e il modello si adatta alle *vostre* domande senza dimenticare il resto. Con le probabilità di Jev come obiettivi, impara anche l'incertezza di Jev: uno 0,55 insegna "al limite", non "sì".

Laya ha il suo codice di addestramento, `laya.train`, che è stato meglio che fare reverse engineering del notebook Kaggle linkato dalla model card.

### Passo 1: costruire il dataset

Ogni riga di addestramento è una richiesta più un obiettivo:

```json
{"state": {...},
 "questions": {"answer": {"type": "noul", "instructions": {...}, "criteria": {...}}},
 "gold": {"answer": {"probabilities": {"false": 0.34, "true": 0.66}}}}
```

Le scelte importanti sono state:

*   **Dividere per tempo, non a caso.** Addestramento sull'11–21 ottobre (1.004 richieste), test sul 22–25 ottobre (409 richieste che il modello non vede mai). Una divisione casuale metterebbe richieste VMC consecutive quasi identiche da entrambe le parti, e il punteggio sembrerebbe molto migliore di quanto sia.
*   **Non tagliare mai niente.** Dato che qui Jev non è coinvolto, potevo usare uno stato compatto specifico per Laya: le regole di compattazione testate sopra, i fatti decisivi in testa e un background breve per la VMC. Ogni riga è stata verificata con il `build_sequence` di Laya: se anche un solo token dello stato venisse scartato, una regola di ripiego accorcia le serie, poi toglie gli eventi più vecchi uno alla volta. Risultato finale: **ogni input entra in 1.024 token con 0 token scartati**, cosa che ho verificato anche sul server dell'N100.
*   **Le probabilità di Jev come soft target**, convertite nel formato di Laya per ogni tipo di domanda (`noul`, `choice`, `score`).

I dati sono molto sbilanciati: 587 richieste VMC e 358 per le tapparelle nel set di addestramento, e qualche decina per tutto il resto (irrigazione, bucato, scaldabagno, presenza).

### Passo 2: addestramento sul MacBook

Lo script di addestramento è corto, perché il lavoro lo fa `laya.train`:

```python
from laya.train import TrainConfig, finetune

cfg = TrainConfig(
    epochs=6,
    micro_batch=2, grad_accum=8,   # effective batch of 16
    encoder_lr=2.5e-5,
    loss="soft-ce",                # match Jev's probabilities, not just yes/no
    gradient_checkpointing=True,   # 1,024-token inputs in 16 GB
    seed=0,
)
finetune(data="train.jsonl", model_dir="laya/multilingual",
         output_dir="ckpt/jev-ft", config=cfg, device="mps")
```

Tre impostazioni da spiegare:

*   **6 epoche, batch effettivo di 16**, circa 340 aggiornamenti dell'ottimizzatore. I valori di default ne avrebbero dati solo 60, e il codice stesso di Laya avverte che troppo pochi aggiornamenti possono far collassare il modello su una risposta costante, proprio il problema che cercavo di risolvere.
*   **Loss `soft-ce`** al posto del default `rlcd`: la soft cross-entropy è l'obiettivo naturale quando il target è una distribuzione di probabilità, e le note stesse di Laya dicono che il termine RL qui non dava alcun guadagno.
*   **Gradient checkpointing**: senza, le sequenze da 1.024 token non entrano nei 16 GB di memoria dell'M4. Non è esposto dalla CLI, ed è per questo che ho chiamato `finetune()` da Python.

L'esecuzione ha richiesto **66 minuti** sulla GPU dell'M4 (MPS), niente è uscito dal portatile, e la loss ha smesso di scendere intorno a 0,5. È normale: quando l'obiettivo stesso è 0,3/0,7, la loss non può arrivare a zero. Sono i giorni tenuti da parte a dire se ha funzionato.

### Passo 3: i risultati su giorni mai visti

Ogni risposta viene trasformata in una decisione alla soglia che la mia automazione usa davvero, e confrontata con quella di Jev:

| 22–25 ottobre, tenuti da parte | Laya base | **Laya con fine-tuning** | Rumore di Jev stesso |
| --- | --- | --- | --- |
| **VMC**: stessa decisione di Jev (244 richieste) | 14% | **93%** | |
| VMC: ordinamento rispetto alle decisioni di Jev (AUC) | 0,56 | **0,94** | |
| VMC: correlazione di rango con Jev (Spearman) | −0,02 | **0,84** | |
| VMC: scarto medio dalla probabilità di Jev | 0,71 | 0,087 | 0,013 |
| VMC: boost (Jev: 34) | 244 | 18 | |
| **Tapparelle**: stessa decisione di Jev (145) | 0% | 100% | |
| Tapparelle: scarto medio dalla probabilità di Jev | 0,82 | 0,018 | 0,007 |

Da "sì a tutto" al 93% di accordo su giorni mai visti, in un'ora su un portatile. Onestamente non me lo aspettavo così alto.

Ora le clausole in piccolo, perché contano più del titolo:

*   **Perde metà dei boost di Jev.** Delle 34 decisioni di boost di Jev, Laya con fine-tuning è d'accordo su 17 e ne perde 17 (e ne aggiunge 1). Ogni mancato boost è vicino alla soglia: Jev tra 0,60 e 0,67, Laya tra 0,30 e 0,50. Contando per episodi, si unisce almeno una volta a 5 dei 6 episodi di boost di Jev e perde del tutto una doccia del sabato sera. Spostare la soglia non aiuta: il miglior scostamento, stimato sui giorni di addestramento, è +0,01.
*   **Ha in parte memorizzato i giorni di addestramento.** 98,5% di accordo su quelli, 92,6% sui giorni nuovi. Più dati, o meno epoche con early stopping, dovrebbero ridurre il divario.
*   **Le tapparelle non dimostrano niente.** È autunno: né nei giorni di addestramento né in quelli di test Jev ha mai detto "abbassale". Il modello ha imparato solo "tienile su". Ricontrollerò in primavera.
*   **Ha imparato la mia casa, non a ragionare.** Su sei stati di test generici, la coppia ovvia sull'umidità va ancora nel verso sbagliato: un salto dal 68,8% al 90,8% ottiene 0,38, un'umidità piatta 0,44. Fategli domani una domanda nuova e siete di nuovo al modello base.
*   **Le domande rare sono troppo poche per giudicare**: scaldabagno sul fotovoltaico 5/5, irrigazione 3/3, bucato 2/2, presenza 2/4...

E un promemoria sul tetto: uno studente addestrato su Jev può al massimo eguagliare Jev. Il guadagno non sono decisioni migliori; sono le stesse decisioni, in locale, gratis, con i miei dati a casa.

### Passo 4: servire il checkpoint con fine-tuning

La buona notizia: **è lo stesso programma e la stessa immagine**. `laya-serve` carica checkpoint aggiuntivi dalla variabile `LAYA_EXTRA_MODELS`, da una cartella locale o da un repository Hugging Face. La cartella del checkpoint pesa circa 650 MB (`model.safetensors`, `rl_agent_config.json`, `questions.json`, `encoder/`, `tokenizer/`; lo stato dell'ottimizzatore non serve).

Per una prova non toccherei il container in produzione. Basta un secondo servizio accanto:

```yaml
services:
  laya-shadow:
    build: .                      # the Dockerfile above
    restart: unless-stopped
    environment:
      LAYA_EXTRA_MODELS: '{"jev-ft": "/models/jev-ft"}'
      LAYA_MODELS: jev-ft
      LAYA_DEFAULT_MODEL: jev-ft
      OMP_NUM_THREADS: "4"
    volumes:
      - ./jev-ft:/models/jev-ft:ro
    ports:
      - "8181:8000"
```

Con `LAYA_DEFAULT_MODEL`, Home Assistant non deve nemmeno indicare il modello; altrimenti manda `"model": "jev-ft"`. L'ho verificato in locale: servito così, il checkpoint dà esattamente le risposte della valutazione, senza scartare niente. Funziona anche un repository Hugging Face privato con un `HF_TOKEN`, ma una cartella locale è più semplice e tiene i pesi sulla vostra rete. Attenzione alla RAM: il modello in sé richiede circa 1,3 GB, e `docker stats` mostra il mio attuale container Laya a circa 5 GB, page cache inclusa, su un box da 16 GB che fa girare anche altro. La velocità non cambia, dato che il modello ha la stessa dimensione: circa 1 secondo per una richiesta corta, 5 per una lunga.

Resta una modifica vera lato Home Assistant, e non è facoltativa: **deve mandare lo stato compatto su cui il modello è stato addestrato**. La richiesta completa per Jev verrebbe di nuovo tagliata a 1.024 token, e il modello vedrebbe qualcosa su cui non è mai stato addestrato.

## Ne è valsa la pena?

Come esperimento, sì, chiaramente. Qualche cosa che mi porto a casa:

*   **L'installazione è la parte facile.** Un'API compatibile con Jev significa un container Docker e un URL in Home Assistant. Ed è davvero comodo.
*   **Controllate `truncated` prima di tutto il resto.** Un modello che taglia in silenzio la fine della vostra richiesta sembrerà sicuro di sé e sbaglierà, e Home Assistant non ve lo dirà.
*   **Un N100 basta per una casa**, con circa 100 decisioni al giorno. Qui la lentezza non è un problema; i picchi sì, e le richieste più corte li risolvono meglio dell'hardware.
*   **Laya base non è un motore decisionale per stati numerici di una casa**, e lo dicono i suoi autori. Con il fine-tuning diventa sorprendentemente bravo sulle *mie* domande, dopo un'ora di addestramento su un portatile.
*   **Misurate rispetto al rumore dell'insegnante, su giorni tenuti da parte.** 93% suona benissimo finché non vedete che lo scarto medio è 7 volte il rumore di Jev stesso e che metà dei boost viene persa.
*   **La casa gira ancora su Jev.** Il modello con fine-tuning è abbastanza buono da provare in **modalità shadow sulla VMC**: Home Assistant interroga entrambi, agisce secondo Jev e registra Laya accanto. Non è abbastanza buono per decidere.

La lezione più grande riguarda i dati. Questo esperimento ha dimostrato che Laya può imparare la mia casa da circa 1.000 esempi. Non aveva bisogno di impararla da Jev. Il mio [scoreboard](/it/jev-home-assistant-storico-feedback-e-la-questione-del-modello-locale/) raccoglie già le mie risposte a "chi aveva ragione?", e le verifiche dei risultati registrano cosa è successo davvero dopo ogni decisione: la doccia che c'è stata davvero, la pompa che si è fermata davvero. Quelle etichette sono **mie**, sono permesse, e potrebbero persino insegnare a un modello dove sbaglia Jev stesso. Raccoglierne mille richiede più tempo, ma è la versione di questo modello che mi sentirei davvero tranquillo a far girare. Fino ad allora, il checkpoint con fine-tuning resta sul mio portatile, e la casa resta su Jev.

Se fate girare Laya, o un qualsiasi modello compatibile con Jev, a casa, mi piacerebbe molto sapere come gestite la finestra di contesto e su cosa lo addestrate. I commenti sono aperti.

## Come è stato realizzato

Due sessioni di Claude Code con Opus 5.5. La prima è partita dal mio "sostituiamo Jev con Laya", ha capito come l'integrazione parla con Jev, ha trovato il troncamento, ha misurato l'N100, ha letto i log dei prompt di OpenRouter nel browser (l'autenticazione l'ho fatta io), li ha rigiocati attraverso Laya, e ha testato ogni accorciamento rispetto al rumore di Jev prima di cambiare un solo template. Quando ha concluso che solo il fine-tuning poteva aiutare, lo ha proposto come sessione separata, che ha costruito il dataset, addestrato il checkpoint sul mio MacBook, l'ha valutato e ha verificato come servirlo. Una terza sessione ha letto entrambe le trascrizioni e ha scritto la bozza di questo articolo. La mia parte è stata decidere cosa testare, insistere che le risposte di Jev non dovessero cambiare, e decidere cosa tenere, compreso se pubblicare o meno la parte sulla distillazione.
