---
title: 'ai-running-coach, nove giorni dopo: una dashboard, una ventina di metriche e il coach in tasca'
categories:
- ai-coding-agents
tags:
- ai
- agenti
- trail
- running
- garmin
- mcp
- claude-code
- dashboard
date: '2026-09-28T04:50:00.000000+00:00'
draft: false
slug: ai-running-coach-novita-dashboard-metriche-coach-in-tasca
translationKey: ai-running-coach-whats-new
cover: cover.jpg
showHero: true
description: Dall'articolo sull'ultra-trail, ai-running-coach ha ricevuto più di 120 pull request. Ci sono una dashboard locale, metriche pensate per il trail ricavate dai file FIT, controlli deterministici e un registro delle decisioni, ritmi gara calcolati con il mio modello pendenza → passo, i primi contributi esterni, e un coach con cui parlo dal telefono grazie a Claude Code Remote Control su una macchina Linux, aggiornato da un semplice cron.
summary: Una dashboard, un bel po' di metriche nuove, dei controlli capaci di dire di no, e un coach che gira su una macchina Linux a casa e mi risponde dal telefono. Ecco cosa è cambiato in ai-running-coach dopo l'ultra, e perché la sincronizzazione automatica usa cron e non una routine di Claude.
---

Il 19 settembre ho pubblicato [Preparare un ultra-trail con ai-running-coach](/it/preparare-un-ultra-trail-con-ai-running-coach/). Raccontavo l'Ultra 110 km del Trail Côte d'Opale e come una squadra di agenti IA, che lavorano su semplici file Markdown, mi avesse accompagnato fino al traguardo.

Sono passati appena nove giorni, ma il progetto nel frattempo è cambiato parecchio. Tra il **19 e il 27 settembre**, [il repository](https://github.com/mmornati/ai-running-coach) è passato dalla PR #1 alla **PR #122**. Sono arrivati una dashboard web, una ventina di metriche nuove, un motore di regole che può mettere il veto al coach, comandi pensati per il telefono, una seconda fonte dati e i primi contributi esterni. Anche la [documentazione](https://mmornati.github.io/ai-running-coach/) è stata rifatta, e tutti gli screenshot di questo articolo vengono da lì. Sono catture vere del mio workspace, tre giorni prima della gara.

Facciamo un giro tra le novità e, soprattutto, vediamo a cosa servono.

## 1. Una dashboard per vedere quello che il coach sa

La prima versione aveva un limite evidente: stava tutto nei file Markdown. Perfetto per il versionamento e per gli agenti, molto meno quando alle 6:30 del mattino vuoi solo sapere se oggi si corre o no.

Così ho aggiunto una **dashboard locale, in sola lettura** ([doc](https://mmornati.github.io/ai-running-coach/dashboard/)). È un piccolo server in Python puro (solo libreria standard) con una pagina HTML/CSS/JS. Niente npm, niente build. Si lancia con `scripts/dashboard.sh` e si apre su `http://127.0.0.1:8765/`.

![La vista "Oggi": ultimo verdetto del coach, check mattutino rispetto ai miei riferimenti, seduta del giorno e forma](/images/ai-running-coach-quoi-de-neuf/aujourdhui.webp)

*La vista "Oggi" il 10 settembre, a tre giorni dalla gara. Mostra l'ultimo verdetto del coach, il check mattutino (HRV notturna, FC a riposo, debito di sonno, readiness, sonno) rispetto ai miei riferimenti personali, la seduta prevista con la finestra meteo, e un riassunto della forma.*

Per far funzionare tutto questo, ogni file scritto dagli agenti ora si apre con un piccolo **blocco JSON ` ```arc `**. È un contratto dati, con chiavi in inglese e unità SI, e una misura che manca semplicemente non c'è. Da questi blocchi si costruisce un indice SQLite **derivato**. È usa e getta, si ricostruisce dai file, e si aggiorna entro 30 secondi ogni volta che un agente scrive qualcosa. Il Markdown resta la fonte di verità, la dashboard lo impagina e basta.

Ogni vista risponde a una domanda:

| Vista | La domanda |
|:------|:-----------|
| **Oggi** | Corro, vado piano o riposo? |
| **Forma & carico** | Come sta andando la mia forma? |
| **Analisi** | Tecnica e tenuta stanno migliorando? |
| **Salute** | Come sta reagendo il corpo? |
| **Settimana** | Cosa era previsto, cosa ho fatto? |
| **Sedute** | Com'è andata? (split, FC, analisi del coach) |
| **Performance** | A cosa posso puntare? |
| **Trail Shape** | Sono pronto per l'obiettivo? |
| **Decisioni** | Perché questa seduta è cambiata? |
| **Calendario / Report / Nutrizione** | Costanza, conclusioni del coach, alimentazione |

![Forma & carico: condizione, fatica e forma su sei mesi, rapporto carico acuto/cronico e volume settimanale](/images/ai-running-coach-quoi-de-neuf/forme.webp)

*Forma & carico su sei mesi. Condizione (42 gg), fatica (7 gg) e forma, il rapporto acuto/cronico con la fascia di riferimento 0,8-1,3, e le ore di allenamento a settimana con il dislivello cumulato.*

![Salute: HRV notturna con la fascia Garmin e un riferimento personale, FC a riposo, readiness e verdetti del coach giorno per giorno](/images/ai-running-coach-quoi-de-neuf/sante.webp)

*La vista Salute. La HRV ha due riferimenti: la fascia Garmin sul valore grezzo della notte, e il mio riferimento personale sulla media a 7 giorni. Sotto, una striscia mostra il verdetto del coach per ogni giorno (mantenere / alleggerire / riposo).*

![Vista Settimana: il piano del coach a confronto con quanto fatto, giorno per giorno, con meteo e aderenza](/images/ai-running-coach-quoi-de-neuf/semaine.webp)

*La settimana della gara: il piano a confronto con quanto fatto, giorno per giorno, con la categoria meteo e il riepilogo dell'aderenza al piano.*

Qualche dettaglio pratico a cui tengo:

- **Si legge bene sul telefono** e ha il tema scuro.
- Può girare su una macchina remota ed essere consultata **tramite un tunnel SSH**, oppure stare **in un container Docker dietro un reverse proxy** con single sign-on (Traefik + Authentik/Authelia).
- Le metriche hanno **nomi generici** (condizione / fatica / forma invece di CTL/ATL/TSB), e una pagina [Marchi e metriche](https://mmornati.github.io/ai-running-coach/marques/) riporta la formula pubblicata dietro ogni modello. Il progetto è indipendente e non affiliato a Garmin o TrainingPeaks, quindi volevo che fosse tutto in regola.

## 2. Metriche che parlano davvero la lingua del trail

Il secondo grosso lavoro è stato **l'ingestione dei file FIT**. Dopo ogni sincronizzazione, il coach scarica il FIT grezzo di ogni nuova uscita di corsa o trail. Lo normalizza (campioni a 5 secondi, mai versionati, ricostruibili in qualsiasi momento) e ne ricava metriche che di solito si trovano solo sulle piattaforme a pagamento:

- **Zone cardio, tempo in zona e polarizzazione 80/20** (modello a tre zone di Seiler), con il metodo di calcolo delle zone scelto (Karvonen, % della soglia o % della FC max).
- **Passo corretto per la pendenza (GAP)**, basato sul modello del costo energetico di Minetti.
- **Disaccoppiamento aerobico ed efficiency factor**: quanto la FC deriva rispetto al passo tra la prima e la seconda metà di un'uscita.
- **VAM** sulle salite individuate automaticamente, ed **efficienza in discesa** per classe di pendenza.
- **Tenuta (durability)**: quanto cala il GAP nei lunghi. In un ultra è la metrica che conta davvero.
- **Progressi sulla stessa salita**: ogni volta che passi su un tratto già noto, viene riconosciuto e confrontato con i passaggi precedenti.

I FIT servono per la seduta in sé. Per il resto, il coach usa i dati del workspace:

- **Aderenza al piano**: sedute, durata e dislivello fatti rispetto a quelli previsti.
- **Riferimento HRV personale** (media a 7 giorni di ln(HRV) contro 60 giorni ± 0,5 deviazioni standard), in aggiunta alla fascia Garmin.
- **Km-sforzo ITRA** (distanza + D+/100) per confrontare settimane di trail.
- **Andamento del peso** e **debito di sonno**.
- **Acclimatazione al caldo** (sedute ≥ 25 °C negli ultimi 14 giorni).
- **Chilometri delle scarpe**.
- **Carboidrati all'ora e tasso di sudorazione** nei lunghi.

Il dettaglio di una seduta mostra il grafico degli split, con passo e FC giro per giro. Ecco l'ultra:

![Split della gara da 110 km: passo e FC media per ciascuno dei 110 giri](/images/ai-running-coach-quoi-de-neuf/seance-ultra.webp)

*110 split, 15h26 di gara. La FC resta tra 110 e 140 bpm per tutta la giornata, e si vedono bene i tratti camminati in salita e gli ultimi chilometri tra le dune.*

## 3. I controlli di sicurezza: un coach che sa dire di no

La critica più comune ai coach IA è una **progressione troppo aggressiva**, e con strumenti simili sono stati segnalati anche infortuni. Un LLM ragiona benissimo sulla tua settimana, ma non è una calcolatrice affidabile per il rapporto tra carico acuto e cronico.

Ora c'è quindi un **motore di regole deterministico** ([doc](https://mmornati.github.io/ai-running-coach/guardrails/)). È Python puro, completamente testato, e il coach è **obbligato** a consultarlo prima di scrivere una settimana e prima di caricare le sedute sul calendario Garmin. Sette regole:

| Regola | Cosa controlla |
|:-------|:---------------|
| R1 | ACWR previsto sulla settimana proposta |
| R2 | Aumento del volume settimanale |
| R3 | Aumento del dislivello settimanale (trail) |
| R4 | Monotonia di Foster prevista |
| R5 | Seduta di qualità lo stesso giorno o il giorno dopo un verdetto di salute **rosso** (**bloccante**) |
| R6 | Peso del lungo sul volume della settimana |
| R7 | Due sedute di qualità in due giorni consecutivi |

Il motore sa anche quando **non** applicarsi: storico troppo corto, settimana di gara, troppe poche sedute nella settimana. È un secondo parere, non un lucchetto che blocca tutto. Tutte le soglie sono configurabili, e la documentazione spiega i limiti scientifici (l'ACWR di default è `warn`, non `block`).

L'altra metà del lavoro riguarda la **trasparenza**. Ogni volta che il coach modifica una seduta (check mattutino, controllo di sicurezza, infortunio, meteo o una mia richiesta), scrive un file `decision` con il motivo, i dati che l'hanno giustificata e il prima/dopo. Di conseguenza:

- la dashboard mostra un riquadro **"Perché oggi?"** e un **registro delle decisioni** filtrabile;
- il comando `/why` spiega l'ultima decisione **citando il registro, senza mai inventarsi un motivo**;
- la quinta riga della notifica push diventa `Perché:` quando qualcosa è stato modificato.

C'è anche un **segnale di rischio infortunio** composito. Scatta quando più indicatori peggiorano insieme, e segue un dolore segnalato fino al consiglio di farsi vedere da un medico.

## 4. Dall'allenamento alla gara, e ritorno

Diverse novità coprono la parte della preparazione che per l'ultra avevo fatto a mano:

- **Un modello personale pendenza → passo**, imparato dalle tue uscite.
- **Ritmi gara tratto per tratto**: lo stratega di gara divide il GPX in segmenti e stima ognuno con il *tuo* modello. Per gli ultra usa un Riegel a tratti e un calo additivo oltre le 6 ore.
- **Obiettivi personali** in ogni seduta (zone, GAP, dislivello in salita) invece di passi generici.
- **Piani su più settimane**, mostrati settimana per settimana nella dashboard.
- **Trail Shape**, un punteggio da 0 a 100 che confronta le ultime 8 settimane con quello che la gara richiede.
- **Il debriefing post-gara**: previsto contro reale per segmento, scarto di passo e deriva cumulata, calo, carboidrati all'ora, meteo.
- **Gli indici di performance ITRA e UTMB**, con il loro storico.

![Trail Shape: punteggio di preparazione di 75/100 tre giorni prima dell'ultra da 110 km, componente per componente](/images/ai-running-coach-quoi-de-neuf/trail-shape.webp)

*Trail Shape a tre giorni dalla gara: 75/100. Km-sforzo settimanali al 70 % dell'obiettivo, uscita più lunga (38,5 km) al 64 %, dislivello massimo in una seduta ben oltre l'obiettivo. La tenuta resta fuori perché non c'era nessun lungo valido nella finestra, e il suo peso viene ridistribuito. È un indicatore, mai un verdetto: un buon scarico può abbassare il punteggio, e la pagina lo dice chiaramente.*

Quel debriefing mi sarebbe piaciuto moltissimo averlo il giorno dopo la gara. Adesso basta un comando.

## 5. Più facile da installare, più comodo da usare

- **La lingua dei documenti è configurabile**: il francese resta quella di default, ma si può cambiare.
- **Un coach su misura**: scegli lo staff (con o senza l'agente medico), lo sport (trail/strada), lo stile di coaching e quanto deve essere severo, e il livello del check di salute mattutino (`full`, `minimal`, `off`).
- **`/coach-setup`**: un'intervista iniziale che **precompila FC max, FC a riposo, soglia e VO2max da Garmin**, ognuna con la sua fonte, da confermare.
- **Preset di installazione**: `./install.sh --preset laptop | coach-server | docker`.
- **Un workspace privato** separato dal motore (`--workspace ~/mio-workspace`), con commit e push automatici dopo ogni sincronizzazione, se li vuoi.
- **`/coach-doctor`**: una diagnosi con un solo comando (età dei token Garmin, raggiungibilità del server MCP, configurazione, profilo, freschezza dell'indice, pianificazione della sincronizzazione, notifiche).
- **Un avviso push prima della scadenza dei token Garmin** (a 14 giorni, poi a 3), con il comando per rinnovarli.
- **Intervals.icu come fonte dati principale** (`--source intervals`), con una tabella di corrispondenza strumento per strumento. Quello che Intervals.icu non fornisce (readiness di Garmin, download FIT, HRR) viene **dichiarato non disponibile, mai simulato**.
- Una [guida all'aggiornamento](https://mmornati.github.io/ai-running-coach/update/) per il motore, il workspace e la macchina del coach.

Dietro le quinte, buona parte del lavoro è finita nei **test**: campioni FIT sintetici, un server MCP finto programmabile, test "golden" sull'API della dashboard, valutazioni LLM pianificate, e un controllo che la documentazione non si allontani dal codice. Un agente che ti scrive il piano di allenamento merita lo stesso rigore di qualsiasi altro software.

## 6. I primi contributi della community

Questa è forse la parte che mi ha fatto più piacere. Pochi giorni dopo il primo articolo, **Giovanni Clément ([@gclem](https://github.com/gclem))** ha aperto le prime pull request esterne:

- **Il supporto a GitHub Copilot** (agenti, skill, MCP, istruzioni): ora il progetto gira anche in Copilot CLI, in Copilot dentro VS Code e con l'agente cloud di Copilot.
- **Il check mattutino**: HRV + FC a riposo (con un nuovo strumento `get_rhr_day`) + readiness prima di ogni decisione sulla seduta. È diventato la base della vista Oggi e dei verdetti di salute. Poi ha aggiunto una correzione perché la FC a riposo faccia da filtro e non da metrica di carico.
- Una correzione a `install.sh --dry-run`, che si fermava al primo passaggio, e la normalizzazione dei fine riga con `.gitattributes`.

Grazie Giovanni! 🙏

## 7. Il coach in tasca: Claude Code Remote Control su una macchina Linux

È così che uso il progetto tutti i giorni, quindi vale la pena entrare un po' nel dettaglio ([doc](https://mmornati.github.io/ai-running-coach/mobile/)).

### Il vincolo: tenersi l'abbonamento

Volevo parlare con il coach dal telefono, ma **senza pagare a token con una chiave API**. Un'interfaccia mobile fatta in casa (bot Telegram, PWA, app con l'Agent SDK…) non può usare un abbonamento Claude Pro/Max, perché Anthropic blocca l'autenticazione con abbonamento per gli strumenti di terze parti. L'unica strada sono le **interfacce remote ufficiali**.

### La configurazione: una "macchina del coach" a casa

Ho una **macchina Linux** sempre accesa a casa. Ci girano:

- il motore e il mio **workspace privato** (un repository git);
- i token Garmin e il server `garmin-mcp`;
- **Claude Code**, collegato con il mio account claude.ai (niente chiave API);
- `claude remote-control`, installato come **servizio systemd utente** (`./install.sh --remote-control`, con `loginctl enable-linger` per non farlo morire alla chiusura della sessione SSH);
- la dashboard, così la posso guardare da dove voglio.

Dal telefono apro l'**app Claude, scheda Code**, e trovo la sessione "AI Running Coach". Gira **sulla macchina Linux**, con l'agente `coach`, le skill, il server MCP di Garmin e i miei file. Le conferme degli strumenti (per esempio quando va caricata una seduta sul calendario Garmin) arrivano sul telefono. Il servizio parte in modalità `acceptEdits`: i file Markdown vengono scritti in automatico, ma gli strumenti Garmin che scrivono mi chiedono sempre il permesso.

Dal telefono scrivo soprattutto cose brevi:

```text
/today
/why
/week
/race
/log 2 gel + 500 ml al km 15, ginocchio sinistro 3/10, RPE 7
"Sposta la seduta di giovedì a venerdì e caricala su Garmin"
```

I cinque comandi brevi sono stati pensati **per il telefono**: una domanda, una risposta. `/log` è quello che uso di più appena torno da un'uscita. Il modello estrae le informazioni, poi uno script deterministico fa i conti (carboidrati presi dal mio catalogo prodotti, conversione dei liquidi) e unisce tutto nei file del giorno. Prodotto sconosciuto? Te lo chiede, e non si inventa mai un valore nutrizionale. Dolore da 7/10 in su? Ti consiglia di andare dal medico.

![La dashboard sul telefono: la vista Oggi con il check mattutino](/images/ai-running-coach-quoi-de-neuf/mobile-aujourdhui.webp)

*La stessa vista Oggi, sul telefono.*

### La sincronizzazione automatica: perché cron e non una routine di Claude?

L'altra metà della configurazione è la **sincronizzazione automatica**. Ogni mattina, prima ancora che apra l'app, i dati Garmin (notte, HRV, readiness, uscita del giorno prima) devono essere già scritti nel workspace, con un riassunto di 5 righe mandato sul telefono tramite [ntfy](https://ntfy.sh):

```text
🏃 Sync Garmin
Séances : 1 nouvelle — trail 12,3 km / 480 m D+ / FC moy 148 / HRR 28 bpm
Sommeil : 7 h 42, score 81
HRV : 62 ms — équilibré (baseline 58-66)
Readiness : 74
Alerte : aucune
```

*(sì, il coach mi scrive in francese: è la lingua di default del progetto, ma si può cambiare.)*

La domanda viene da sé: Claude Code sa già pianificare dei task, quindi perché usare `cron`? Prima di scrivere questo articolo ho ricontrollato la documentazione aggiornata, per essere sicuro che la risposta valga ancora:

| Opzione | Dove gira | Perché non va bene per una macchina Linux senza schermo |
|:--------|:----------|:--------------------------------------------------------|
| **Routine cloud** (`/schedule`) | Nel cloud di Anthropic, su un clone nuovo del repository | [Nessun accesso ai file locali](https://code.claude.com/docs/en/scheduled-tasks#compare-scheduling-options): niente `garmin-mcp` locale, niente token in `~/.garminconnect`. Intervallo minimo di un'ora, e un limite di esecuzioni al giorno. |
| **Task pianificati dell'app desktop** | Sulla tua macchina | [Partono solo se l'app è aperta e il computer è acceso e sveglio](https://code.claude.com/docs/en/desktop-scheduled-tasks#how-scheduled-tasks-run). Su Linux l'app desktop è una beta grafica, poco adatta a una macchina senza schermo. |
| **`/loop` e cron di sessione** | Dentro una sessione aperta | [Legati alla sessione](https://code.claude.com/docs/en/scheduled-tasks#limitations): si fermano quando finisce, e i task ricorrenti scadono dopo 7 giorni. |
| **Ambienti self-hosted** | Sui tuoi runner | [Beta pubblica solo per i piani Team ed Enterprise](https://code.claude.com/docs/en/self-hosted-environments#availability-and-limitations), non per Pro/Max. |

La documentazione stessa indica l'altra strada: per far girare Claude Code sulla propria macchina sempre accesa e controllarla da altri dispositivi si usa **Remote Control**, che è esattamente la parte interattiva della mia configurazione. Per la parte automatica, su una macchina senza schermo il sistema più affidabile resta **il cron di sistema**, che lancia la **CLI ufficiale in modalità headless**:

```bash
./install.sh --daily-sync          # installa la voce di cron
# che lancia, di default due volte al giorno (07:15 e 14:15):
scripts/daily-sync.sh              # → claude -p "/garmin-daily-sync"
```

`claude -p` usa lo stesso abbonamento delle sessioni interattive. Lo script fa anche un pull del workspace prima di lanciare il coach, poi commit e push alla fine, così il portatile e la macchina del coach restano allineati. Gestisce anche un lock, la notifica e i log. Volendo si può usare `codex exec` al suo posto.

### La modalità "watch": il LLM parte solo se Garmin ha novità

Gli orari fissi hanno un difetto: il sabato mi alzo tardi, o corro la sera, e la sincronizzazione delle 7:15 non trova niente. Garmin non offre webhook ai privati (il suo programma per sviluppatori è riservato alle aziende). Così l'ultima novità (PR #121, mergiata ieri) è un **watcher**. `scripts/garmin_watch.py` gira in cron ogni 15 minuti, **senza nessun LLM**:

1. **Una sola chiamata** chiede l'ora dell'ultimo caricamento dell'orologio. Niente di nuovo? Si ferma lì, zero token.
2. Nuovo caricamento? Controlla se nel workspace manca l'attività o il file del sonno del giorno. Continua a controllare per 90 minuti, perché Garmin calcola il punteggio del sonno qualche minuto *dopo* il caricamento.
3. Novità? Aspetta 10 minuti che i dati si assestino e lancia `daily-sync.sh`. Almeno 30 minuti tra un run e l'altro, massimo 6 al giorno, attese sempre più lunghe in caso di HTTP 429, e un run completo di riserva alle 21:30 se in giornata non è partito niente.

```toml
# config/workspace.user.toml
[sync]
mode = "watch"
```

Risultato: il LLM gira **solo quando c'è davvero qualcosa da fare**, pochi minuti dopo che ho fermato l'orologio. Il tempo di una doccia e la notifica è sul telefono, la dashboard è aggiornata, e posso chiedere "allora, com'è andata?" dal divano.

## E adesso?

L'ultra è alle spalle, e il recupero è stato seguito giorno per giorno. I prossimi obiettivi li preparerò con tutto questo fin dal primo giorno: un punteggio Trail Shape da tenere d'occhio, un vero debriefing dopo la gara, e un coach raggiungibile ovunque.

Per provarlo:

```bash
git clone https://github.com/mmornati/ai-running-coach.git
cd ai-running-coach
./install.sh                              # oppure --preset coach-server
```

- 📖 Documentazione: [mmornati.github.io/ai-running-coach](https://mmornati.github.io/ai-running-coach/)
- 💻 GitHub: [github.com/mmornati/ai-running-coach](https://github.com/mmornati/ai-running-coach)

Issue, idee e pull request sono benvenute: Giovanni ha aperto la strada! E come sempre, è uno strumento per aiutarti a prepararti: non sostituisce il parere di un medico.
