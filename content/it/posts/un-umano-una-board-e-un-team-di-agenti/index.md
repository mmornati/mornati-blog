---
title: "Un umano, una board e un team di agenti: come sviluppo software oggi (e perché la mia stima era sbagliata)"
categories:
- ai-coding-agents
tags:
- ai
- claude-code
- multi-agent
- github-projects
- software-engineering
- sdlc
- estimation
- productivity
- team-topology
date: '2026-10-31T17:00:00.000000+00:00'
draft: false
slug: un-umano-una-board-e-un-team-di-agenti
translationKey: human-agents-board
cover: cover.jpg
showHero: true
description: "Un esperimento per ridisegnare il ciclo di sviluppo intorno a una board di GitHub Project condivisa da un umano e da un team di agenti IA. Ticket scritti con Claude e validati da me, una sola istruzione (\"segui la board\"), tre agenti per story (costruire, review indipendente, correggere) e un protocollo semplice per quando serve un umano. La stima diceva che un umano con degli agenti sarebbe stato più lento di tre sviluppatori. Dopo 36 story, le prime tre milestone, pianificate su 23 settimane, erano unite in meno di due giorni. Cosa dicono i numeri, cosa succede quando la quota di utilizzo ferma tutto, e come un secondo progetto, Angelia, cambia l'organizzazione."
summary: "La stima diceva che un umano con quattro agenti avrebbe impiegato 76 settimane dove tre sviluppatori ne impiegano 22. Dopo 36 story, il lavoro degli agenti ha richiesto circa un terzo del tempo stimato, nessun umano è dovuto subentrare, e le prime tre milestone, pianificate su 23 settimane, erano unite in meno di due giorni. Il collo di bottiglia resta l'umano, ma non dove lo metteva il modello. In più: cosa insegnano gli stop per quota, e una seconda board, Angelia."
projects:
- horae
- angelia
---

Da qualche settimana sto verificando fino a che punto può cambiare il ciclo di sviluppo del software quando umani e agenti lavorano **sulla stessa board**. Non "un'IA che scrive il codice al posto mio", ma uno spazio di lavoro condiviso: il backlog, le colonne, le pull request e le decisioni vivono tutti in un GitHub Project, e sia gli umani sia gli agenti lo leggono e lo aggiornano.

Il primo vero test è **Horae**, un progetto personale che sto costruendo soprattutto con agenti. Prima di scrivere una sola riga di codice ho chiesto a Claude di stimarlo in due modi: in **giorni umani**, se lo costruisse un team di sviluppatori, e in **giorni IA**, se lo costruisse un team di agenti con me a supervisionare. La risposta era chiara, e un po' deludente: **un umano con quattro agenti sarebbe stato più lento di tre sviluppatori**. 76 settimane contro 22, perché la mia supervisione sarebbe stata il collo di bottiglia.

Non ero convinto. Così ho organizzato il progetto in modo che fosse la board stessa a darmi la risposta: ogni story porta la sua stima, e ogni story riceve i suoi numeri reali quando è finita. Poi ho dato agli agenti una sola istruzione: *segui la board*.

Questo post racconta come funziona giorno per giorno (la board, gli agenti, i momenti in cui servo io), cosa dicono 36 story finite rispetto alla stima, cosa succede quando la quota di utilizzo ferma tutto a metà strada, come un secondo progetto, **Angelia**, cambia l'organizzazione, e cosa cambia quando il tuo "team" è una persona con qualche agente invece di un team da due pizze.

## 0. Prima il risultato

Ecco tutto il ciclo in un centinaio di secondi. Come [i miei video precedenti](/it/video-narrati-senza-file-video-canvas-javascript/), non è un file video: ogni fotogramma è disegnato in JavaScript, sopra una voce sintetica.

<div style="container-type:inline-size;margin:1.5rem 0">
<iframe src="/videos/human-agents-board/?embed=1&lang=it" title="Un umano, una board, un team di agenti" loading="lazy" allow="fullscreen; autoplay" allowfullscreen style="display:block;width:100%;height:calc(56.25cqw + 40px);border:0;border-radius:8px;background:#f7f9fc"></iframe>
</div>

*Premi Play (con l'audio). Cambia lingua nella barra dei controlli o attiva i sottotitoli. [Aprilo a pagina intera](/videos/human-agents-board/?lang=it) per avere l'elenco dei capitoli.*

## 1. Il progetto: Horae

[**Horae**](https://github.com/horae-dev/horae) è un agente personale prevedibile e self-hosted: pipeline fisse invece di un loop di agenti, al massimo un passo LLM limitato, plugin con permessi dichiarati installati da git. Il brief del mattino, i promemoria, qualche integrazione con le mie note e la mia posta. Un prodotto vero con vincoli veri: input non affidabili, segreti, plugin che non ho scritto io.

È anche il primo progetto che ho deciso di costruire **soprattutto con agenti fin dal primo giorno**, con me come maintainer part-time: circa 15 ore a settimana, sere e weekend.

## 2. Prima i ticket, e li valida l'umano

Niente di quello che segue funziona senza questo passo, ed è quello che mi ha preso più tempo.

In qualche sessione, Claude e io abbiamo scritto il piano (`PLAN.md`), le decisioni di architettura da prendere e il backlog. Poi ho chiesto a Claude di mettere tutto su GitHub: un'organizzazione, 15 repository e un progetto pubblico, la [Horae Roadmap](https://github.com/orgs/horae-dev/projects/1). Ha creato **130 issue**: 23 epic, 90 story, 7 task solo umani e 10 rischi (i "burning points"), usando i tipi di issue (Epic, Story, Risk), le sub-issue e i link "bloccato da".

Ho letto e validato i ticket prima che esistesse una sola riga di codice. È la parte che non delegherei mai: decidere cosa vuol dire "fatto".

Ogni story ha la stessa forma: un riassunto, i **criteri di accettazione**, una tabella di stima, le istruzioni per gli agenti e una sezione **Actuals** vuota da compilare alla fine.

![La tabella di stima della story #13: taglia, stima umana in giorni ideali, esecutore, classe di rischio, successo atteso di un agente al primo tentativo, durata attesa dell'agente e supervisione umana attesa](/images/one-human-a-board-and-a-team-of-agents/issue-estimate.webp)

Il progetto ha dei campi personalizzati che rendono la board leggibile sia dagli umani sia dagli agenti:

| Campo | Valori | Perché |
|---|---|---|
| **Executor** | Agent · Agent + human check · Human-led · Human-only | chi fa il lavoro, così gli agenti sanno cosa saltare |
| Size | XS · S · M · L | per la stima |
| Risk class | Normal · Docs/CI · Core contract · Security · Integration · External API · Design/prompt | sicurezza e API esterne richiedono molta più supervisione |
| Human days, Agent hours, Supervision hours, First-pass % | numeri | le due stime, per story e per epic |

![La vista "Backlog by milestone": ogni epic con la sua milestone, la data obiettivo, i giorni umani, le ore degli agenti e le ore di supervisione](/images/one-human-a-board-and-a-team-of-agents/estimates-by-epic.webp)

Ogni repository ha anche un `AGENTS.md` (setup, comandi, convenzioni, definizione di "fatto") e una policy `graft.yaml` che dice quali percorsi richiedono la mia review, così le regole vivono nel repository, non in un prompt.

## 3. La board è l'interfaccia

La vista board ha sei colonne. Le loro descrizioni contano, perché sono il contratto tra me e gli agenti:

| Colonna | Significato |
|---|---|
| **Backlog** | non ancora pronta |
| **Ready** | specifica completa, si può iniziare |
| **In progress** | un agente o un umano ci sta lavorando |
| **In review** | PR aperta, review di Graft e/o del maintainer |
| **Human needed** | bloccata sul maintainer |
| **Done** | unita e accettata |

![La board di Horae il 31 ottobre: 69 elementi in Backlog, 1 in Ready, 10 in corso, 1 in attesa dell'umano e 40 finiti, tra cui le epic delle prime tre milestone al 100%](/images/one-human-a-board-and-a-team-of-agents/board.webp)

Intorno ci sono altre cinque viste: **Roadmap**, **Backlog by milestone** (con le stime), **Agent-ready** (filtro `label:agent-ready status:Ready`: quello che un agente può prendere adesso), **Human work** (gli elementi Human-led e Human-only, il vero collo di bottiglia) e **Burning points** (i rischi).

![La vista "Human work": ogni elemento Human-led e Human-only con le sue ore di supervisione, da 8 a 28 ore ciascuno](/images/one-human-a-board-and-a-team-of-agents/human-work.webp)

Quest'ultima è la schermata che guardo di più. Mi dice dove andranno le mie serate.

## 4. Una sola istruzione: segui la board

Poi ho scritto questo (in inglese, errori compresi):

> Following the project on github https://github.com/orgs/horae-dev/projects/1/views/3 Start in the right order the epics/issues ready for agents dev.
> Use the proper workflow with subagents when needed assigning the proper model based on the complexity, make a full review with another agent and fix then all the findings with a third agent.
> Create the PR referencing the issue, wait for the CI to be green, merge and move on.

E un secondo messaggio un minuto dopo: *"be sure to assign each task before to start to be able to track the time"*.

Da lì, la sessione principale di Claude Code ha guidato la board. Per ogni story in Ready, nell'ordine delle dipendenze:

1. **Assegnare** la issue a me e spostarla in **In progress** (il timestamp fa partire il cronometro).
2. **Costruire**: un sotto-agente la implementa su un branch `story/<n>-<slug>`. L'agente principale sceglie il modello in base alla complessità: Sonnet per lo scaffold, la CI e il workflow degli agenti; Opus per i JSON Schema, la validazione degli intent, gli ADR e tutto ciò che tocca la sicurezza.
3. **Review**: un agente separato rivede il lavoro rispetto ai criteri di accettazione, a `PLAN.md` e alle story che ne dipendono. Non modifica nulla: riproduce i problemi in un clone usa e getta e scrive i suoi rilievi. Le story di sicurezza hanno un revisore specializzato in sicurezza.
4. **Correggere**: un terzo agente corregge *tutti* i problemi trovati.
5. Aprire la PR che riferisce la issue, **aspettare che la CI sia verde**, fare il merge.
6. Pubblicare gli **Actuals** sulla issue e spostare la card in **Done**.

![La story #13 nella cronologia della issue: spostata in Ready, assegnata, spostata in In progress, chiusa dalla PR unita, poi il commento Actuals: 1 implementazione, 1 review con 20 problemi (8 gravi), 1 passata di correzione, circa 32 minuti di agente, nessun intervento umano](/images/one-human-a-board-and-a-team-of-agents/issue-actuals.webp)

Le card con Executor **Human-led** vengono saltate finché non ho preso le decisioni. Quando ci sono story indipendenti in Ready, l'agente principale le avvia **in parallelo**, ognuna nel suo worktree git: tre o quattro alla volta è la norma.

Dopo la prima serata, le mie istruzioni sono diventate ancora più brevi, e sempre **una milestone alla volta**: *"Start M2"*, poi *"Can you proceed with the next user stories ready to dev?"*. Non ho mai chiesto tutto il backlog in un colpo solo. Si è rivelato importante (sezione 8).

### Cosa hanno trovato i revisori

È la parte che mi ha convinto che il ciclo funziona. L'implementatore diceva sempre "tutti i controlli passano". Il revisore trovava sempre qualcosa di reale, e spesso di serio. Su 36 story, gli Actuals elencano **più di 360 problemi trovati in review**, tutti corretti prima del merge. Qualche esempio:

- **#15 workflow degli agenti**: l'hook di commit usava il primo `python3` nel PATH. Con il Python 3.9 di default di macOS andava in crash e **bloccava ogni commit**, compresi i miei.
- **#13 schema** (20 problemi, di cui 8 gravi): il percorso di una nota poteva uscire dal vault di Obsidian verso `.obsidian/plugins` (esecuzione di codice sul mio portatile), `notify.push` accettava link `javascript:`, e il lockfile accettava URL git `ext::`.
- **#18 store SQLite**: le chiavi esterne erano attive prima delle migrazioni, quindi una futura ricostruzione di tabella avrebbe cancellato in silenzio tutte le voci del journal. Il revisore ha riprodotto la perdita di dati.
- **#19 ciclo di vita delle esecuzioni**: per capire se un'esecuzione era ancora viva si guardavano hostname e ID del processo, cosa che non funziona nei container. La correzione è diventata un lock di file a livello di kernel per ogni pipeline.
- **#32 cache**: dopo aver annullato un'esecuzione, la successiva esecuzione identica avrebbe riapplicato gli stessi intent dalla cache, gratis, per un massimo di 7 giorni, compresi intent nati da una prompt injection.
- **#30 backend locali**: una risposta gzip di 305 KB si espandeva a 300 MiB e veniva accettata.

E uno che i revisori non potevano trovare: il backend claude-cli (#29) passava tutti i test con i mock, ma la prima esecuzione reale con il mio token ha fatto fallire quattro test. La vera CLI avvolge il JSON in blocchi di codice, ragiona prima di rispondere e ritenta in silenzio le risposte troncate fino a tre volte, quindi una chiamata limitata a 64 token ne fatturava 256. I mock confermano le tue ipotesi; la realtà no.

## 5. Quando serve un umano

Alcune story sono mie per scelta: il threat model, il plugin host, tutto ciò in cui un default sbagliato diventa una falla. Per queste l'agente non tira a indovinare. Scrive una **nota di design** in una PR in bozza, con domande numerate e una raccomandazione per ciascuna, e la card passa in **Human needed**.

Il protocollo sta in due passi:

1. **Rispondere sulla PR**, mantenendo i numeri delle domande. Bastano risposte brevi; anche "tutto come proposto" va bene.
2. **Rimettere la card in Ready.** È il segnale. La prossima volta che un agente la prende, legge i miei commenti, trasforma la nota nel vero deliverable e riparte con il solito ciclo costruire → review → correggere → merge.

![La pull request #85, la nota di design del plugin host: dieci domande numerate per il maintainer, e sotto le mie risposte, una riga ciascuna](/images/one-human-a-board-and-a-team-of-agents/pr-questions-answers.webp)

Dieci domande, dieci risposte di una riga, una card rimessa in Ready. È tutta l'interfaccia. Finora l'ho fatto sei volte: il plugin host, il backend claude-cli, la de-identificazione, l'action guard, l'oscuramento dei segreti e i link di azione firmati. La mia risposta più lunga è di dieci righe.

Lo stesso schema torna per le decisioni più piccole. Quando `PLAN.md` era ambiguo, gli agenti **hanno scelto l'opzione più restrittiva** (allentare una regola dopo non rompe niente, stringerla sì), l'hanno segnata come provvisoria e me l'hanno elencata: alla fine di M3 c'erano più di 50 decisioni numerate in `schemas/README.md`. Gli ADR e il formato delle skill ("Agent + human check") sono rimasti senza merge finché non ho scritto "Accept and merge".

Gli agenti mi hanno anche detto chiaramente cosa *non potevano* fare: installare una GitHub App privata sull'organizzazione, rendere pubblica l'immagine del container, attivare l'impostazione "Template repository" o lanciare il test reale con il mio token. Questi compiti sono miei, e sono elencati in ogni report.

## 6. La stima, e perché ne dubitavo

Ecco cosa diceva il modello, nel caso probabile:

| | Team umano | Un umano + 4 agenti |
|---|---|---|
| Sforzo | 218 giorni-persona | 325 ore di agenti + **1.134 h della mia supervisione** |
| Calendario | **22 settimane** con 3 sviluppatori · 67 settimane da solo | **76 settimane** a 15 h/settimana · 38 settimane a tempo pieno |

Il modello era accurato e le sue fonti erano buone: gli [orizzonti temporali di METR](https://metr.org/blog/2026-1-29-time-horizon-1-1/), lo [studio METR del 2025](https://metr.org/blog/2026-02-24-uplift-update/) in cui sviluppatori esperti erano il 19% *più lenti* con l'IA, i report di [CodeRabbit](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report) e [Veracode](https://www.veracode.com/wp-content/uploads/2026-GenAI-Report-Infographic.pdf) sui difetti del codice scritto dall'IA. Le sue ipotesi principali:

- Il **successo al primo tentativo** di un agente scende in fretta con la taglia e il rischio: 85% per una story S, 30% per una L, dimezzato ancora per la sicurezza.
- Ogni tentativo fallito costa una **review umana** pari a circa il 15% dello sforzo umano, il doppio per la sicurezza.
- Dopo tre fallimenti, **subentra un umano** al 60% dello sforzo umano.
- Durata di un agente: 0,75 h per una story S, 2 h per una M, 5 h per una L.

Quindi gran parte delle 1.134 ore ero io, a rivedere diff e a salvare agenti. E la roadmap costruita su questa stima collocava le prime tre milestone (le fondamenta, il walking skeleton, il passo LLM) in **23 settimane**, dal 2 novembre 2026 al 12 aprile 2027.

## 7. Cosa dice la board dopo 36 story

La prima versione di questo post aveva sei story. Due giorni dopo la board ne aveva 36, quindi ecco un quadro più completo. Il "tempo agente misurato" è la somma delle durate dei tre agenti (costruire, review, correggere) come riportata su ogni issue; non comprende l'attesa della CI.

| Milestone | Story | Tempo agente stimato | **Tempo agente misurato** | Supervisione stimata | Calendario previsto | **Calendario reale** |
|---|---|---|---|---|---|---|
| M0 Foundations | 6 | 14,3 h | **1,1 h**¹ | 36 h | 4,4 settimane | la prima serata + una review |
| M1 Walking skeleton | 11 | 36,6 h | **9,4 h** | 88 h | 9,0 settimane | **un giorno** (28 ott., 08:48 → 15:18) |
| M2 LLM step | 12² | 36,7 h | **17,9 h** | 101 h | 9,8 settimane | **18 ore** (28 ott. 15:32 → 29 ott. 09:22) |
| M3 Dogfood (in corso) | 7 finora | 15,8 h | **5,8 h** | 28 h | 18,4 settimane | una serata finora |
| **Totale** | **36** | **103 h** | **34 h** | **252 h** | | **0 interventi umani** |

¹ Il threat model (#14) l'ho rivisto io e non è cronometrato. ² Comprende la #113, la correzione emersa dal test reale che non era nel backlog originale, e la #29, le cui 3 h 40 min includono l'attesa dei merge paralleli.

M0, M1 e M2 erano pianificate su **23 settimane di calendario** e sono state completate **in meno di due giorni**, prima ancora della data di inizio prevista. Anche il team di tre sviluppatori della stima avrebbe avuto bisogno di circa 7 settimane.

Tre cose saltano all'occhio:

1. **Il tempo degli agenti è stato circa 3 volte inferiore alla stima, non 9.** Le prime sei story suggerivano 9 volte, ma erano le più facili. Le story successive avevano revisori di sicurezza, secondi giri di review e merge tra branch paralleli: una story M ha richiesto in media **65 minuti** contro 3,6 ore stimate, una story S **48 minuti** contro 1,1 ore (vicino alla stima), e le story di sicurezza Human-led hanno richiesto circa metà del tempo agente stimato. Comunque il tempo degli agenti non è mai stato il collo di bottiglia.
2. **Nessun intervento umano, su 36 story.** Il modello si aspettava che le story M fallissero il primo tentativo la maggior parte delle volte e ricadessero su di me. Non sono ricadute su di me: il revisore ha trovato i problemi e il correttore li ha corretti. Un primo tentativo fallito è diventato un'iterazione interna economica, non un salvataggio umano.
3. **La mia supervisione non è sparita, si è spostata.** La stima metteva **252 ore** di supervisione su queste 36 story, soprattutto per rivedere diff. Non ho rivisto nessun diff. Quello che ho fatto davvero in quei due giorni: una dozzina di messaggi in chat, le risposte a sei note di design, la review di un threat model, due "Accept and merge" e un test reale con il mio token. Non l'ho cronometrato, ma è stato compatibile con una normale giornata di lavoro. Il resto del mio tempo è andato *a monte*, nelle sessioni di pianificazione e nella validazione di 130 ticket.

### Perché il modello sbagliava

Il modello non era fatto male. Era **costruito su numeri del 2025, e metteva l'umano nel posto sbagliato**.

- **I dati sono invecchiati in fretta.** L'aggiornamento di METR mette il tempo di raddoppio della lunghezza dei compiti che i modelli di frontiera sanno portare a termine a [circa 89 giorni per i modelli dal 2024](https://metr.org/blog/2026-1-29-time-horizon-1-1/), e Anthropic parla di un raddoppio ["circa ogni quattro mesi, contro i sette mesi di prima"](https://www.anthropic.com/institute/recursive-self-improvement). Una stima fatta a ottobre su studi di inizio 2025 è calibrata su modelli indietro di due o tre raddoppi.
- **Presumeva che un umano rivedesse ogni tentativo.** In questo workflow la review la fa un agente indipendente, e io rivedo le decisioni. È anche la direzione in cui vanno i grandi team: Anthropic scrive che ["la code review umana è diventata un nuovo collo di bottiglia"](https://www.anthropic.com/institute/recursive-self-improvement), con oltre l'80% del suo codice unito ormai scritto da Claude. Anche il team .NET di Microsoft, dopo dieci mesi con il coding agent di Copilot, [indica la review come collo di bottiglia](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/).
- **Il "successo al primo tentativo" era l'unità sbagliata.** Misura se il primo diff è pronto per il merge. Con un revisore e un correttore nel ciclo, conta se il *ciclo* converge senza un umano. 36 su 36 l'hanno fatto.

### Cosa dice ancora di giusto il modello

Non voglio sostituire un numero sbagliato con un altro, quindi ecco i limiti onesti:

- **Niente è ancora in produzione.** "Unito con la CI verde dopo una review indipendente" non vuol dire "corretto". M3 è la milestone di dogfooding, ed è la prima volta che Horae girerà sulle mie note reali. L'action guard (#35) ha ancora bisogno di una sessione manuale di red team che la review automatica non poteva fare.
- **Le parti più difficili non sono ancora iniziate.** L'isolamento dei plugin, il marketplace e le API esterne non ufficiali sono in milestone successive.
- **I difetti non spariscono.** Gli studi trovano ancora più problemi nelle PR scritte dall'IA ([1,7 volte più problemi gravi per CodeRabbit](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report), [il 44% dei compiti con una vulnerabilità a rischio per Veracode](https://www.veracode.com/wp-content/uploads/2026-GenAI-Report-Infographic.pdf), più instabilità per DORA). I miei 360 problemi dicono la stessa cosa: la prima bozza è spesso sbagliata. È cambiato chi se ne accorge.
- **Il tempo a monte è reale.** Scrivere e validare 130 buoni ticket mi ha richiesto più tempo di quanto ne abbiano impiegato gli agenti per consegnare tre milestone. Il team .NET ha visto la stessa cosa: il tasso di successo del loro agente è passato dal 38% al 69% dopo istruzioni migliori, e la loro conclusione è che ["la preparazione conta più del modello"](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/).

Quindi la stima aveva ragione: **il collo di bottiglia sono io**. Sbagliava sul *tipo* di lavoro che avrei fatto. Mi contava come revisore di codice. Lavoro come product owner e come architetto che risponde a domande.

## 8. Gli stop fanno parte del workflow

Ecco una cosa che nessuna stima menziona: il lavoro **si ferma**. Non perché qualcosa si rompe, ma perché l'umano non c'è, o perché la quota di utilizzo finisce. Horae non è finito, e in questo momento è fermo: la mia quota settimanale è quasi esaurita.

Questa è la cronologia di Horae finora (ora di Parigi):

| Pausa | Perché | Cosa l'ha fatto ripartire |
|---|---|---|
| 27 ott. 23:22 → 28 ott. 07:58 | notte; gli ADR aspettavano la mia accettazione | *"Accept and merge"* |
| 28 ott. 22:12 → 22:50 | limite di utilizzo raggiunto | *"continue"* |
| 29 ott. 01:25 → 08:15 | M2 finita tranne una story in attesa del mio test reale | *"Merge #29 without it"*, poi l'esecuzione reale |
| 29 ott. 09:22 → 18:24 | la mia giornata di lavoro; niente più in Ready | *"Can you proceed with the next user stories ready to dev?"* |
| 29 ott. 22:16 → adesso | limite di sessione, poi la quota settimanale | non ancora |

In circa 48 ore di calendario, gli agenti hanno effettivamente lavorato per circa 23. Il resto era attesa: di me, o della quota.

Cosa ho imparato dagli stop:

- **La board è il salvataggio.** Quando tutto si ferma, non si perde niente: ogni card dice a che punto è, ogni PR contiene le sue domande, ogni story finita ha i suoi Actuals. La sessione successiva, o la persona successiva, comincia leggendo la board, non una cronologia di chat.
- **Chiedere una milestone alla volta è ciò che rende gli stop economici.** Siccome ho chiesto M1, poi M2, poi "le prossime story", ogni stop è arrivato tra due blocchi di lavoro o dentro un blocco piccolo. Se avessi chiesto tutto il backlog, la quota avrebbe tagliato a metà un blocco molto più grande.
- **Uno stop a metà di una story ha un costo.** All'ultimo limite, quattro story di plugin erano In progress: una aveva una PR, le altre solo un branch o un worktree. Quando è arrivato il primo limite di utilizzo, l'agente principale ha fermato di proposito i suoi due agenti in esecuzione invece di bruciare l'ultimo margine disponibile, e ha annotato a che punto era ciascuno (branch, percorso del worktree, cosa restava da fare). È quella nota che rende possibile ripartire. Ora ne farei una regola: **prima di fermarsi, ogni card In progress riceve un commento di checkpoint.**
- **Il protocollo umano funziona attraverso gli stop, ma solo se l'agente principale rilegge la board.** Il 29 ottobre alle 19:18 ho risposto alle dieci domande sulla nota dei link di azione firmati e ho rimesso la #38 in Ready. Tre ore dopo, il report dell'agente principale elencava ancora la #38 come "in attesa delle tue risposte": lavorava sui propri appunti, non sulla board. La card è ancora in Ready oggi. La correzione è semplice: rileggere la board tra una story e l'altra, non solo all'inizio.
- **La quota si comporta come un limite di WIP.** Limita quanto lavoro può essere in corso, e come ogni limite di WIP premia i blocchi piccoli e il finire prima di cominciare.

Quindi il vero ciclo non è "gli agenti lavorano all'infinito". È **gli agenti eseguono un blocco, l'umano decide e fa ripartire**. L'umano è anche lo scheduler.

## 9. Una seconda board: Angelia

Il 30 ottobre ho iniziato un secondo progetto, [**Angelia**](https://github.com/angelia-dev/angelia): un bus di eventi di release self-hosted che osserva PyPI, npm, crates.io, le release di GitHub e i registry OCI, e consegna un CloudEvent firmato per ogni nuova versione a CI, chat e agenti IA. Questa volta scritto in Go.

Ho chiesto a Claude di copiare quello che avevamo fatto su horae-dev e di costruire "a full board agent + human development oriented to work together", in cui **sono gli agenti a decidere quando serve un umano**, e in cui **il modello viene scelto in base alla complessità**. In circa 45 minuti ha creato cinque repository e **129 issue** sulla [Angelia Roadmap](https://github.com/orgs/angelia-dev/projects/1).

![La board di Angelia: 87 elementi in Backlog, 6 in Ready, 1 in corso e 1 in review. Ogni card mostra il suo esecutore, il suo modello e la sua taglia, e le prime card sono task solo umani](/images/one-human-a-board-and-a-team-of-agents/angelia-board.webp)

È simile, ma non uguale. Ecco cosa è cambiato, soprattutto grazie a quello che mi ha insegnato Horae:

| | Horae | Angelia |
|---|---|---|
| Repository | 15 | 5 |
| Issue | 130 | 129 |
| **Scelta del modello** | la sceglie l'agente principale per ogni story | un campo **Complexity** determina un campo **Model** su ogni card: Low → Haiku, Medium → Sonnet, High e Very high → Opus; posso cambiarlo io |
| **Quando chiedere a un umano** | il campo Executor, più il giudizio dell'agente | trigger espliciti in `AGENTS.md`: un contratto pubblico, una scelta di sicurezza, una nuova dipendenza, una specifica ambigua, o lo stesso controllo della CI che fallisce tre volte |
| **Escalation** | niente di scritto | tre fallimenti della CI o il doppio del tempo stimato → un nuovo tentativo con il modello superiore → poi un umano |
| **Livello di dettaglio delle specifiche** | ogni story dettagliata fin dall'inizio | Fasi 0 e 1 dettagliate (`agent-ready`); le Fasi 2 e 3 sono **27 abbozzi** (`needs-spec`), dettagliate poco prima che inizino |
| **Prima fase** | le fondamenta | uno **spike** con sei benchmark e un go/no-go umano sulle scelte di linguaggio e di plugin |
| **Review** | Graft rimandato | installare Graft è una delle prime card |
| **Viste** | 6 | 8, con l'aggiunta di una board **Human needed** e di un **Model planner** |

![La vista "Model planner": le story aperte con il loro stato, il modello suggerito, la fase, la complessità, la taglia, l'esecutore e le ore degli agenti](/images/one-human-a-board-and-a-team-of-agents/angelia-model-planner.webp)

Due di questi cambiamenti rispondono a problemi che ho avuto su Horae:

- **Specifiche just-in-time.** Su Horae ho validato 130 ticket dettagliati prima di qualsiasi riga di codice. È stato il passo umano più costoso, e i ticket più lontani saranno superati quando gli agenti ci arriveranno. Su Angelia sono dettagliate solo le due fasi successive; il resto aspetta che lo spike abbia risposto alle grandi domande.
- **Il modello è sulla card.** Su Horae l'agente principale sceglieva il modello strada facendo, e funzionava, ma era invisibile. Su Angelia la scelta è visibile, verificabile e modificabile prima dell'esecuzione, e gli Actuals diranno se Haiku è bastato per le story "Low".

Su Angelia non è ancora stato unito niente, e guardate cosa c'è in testa alla board: **task solo umani**. Installare l'app di review, configurare il runtime degli agenti e i limiti di spesa, riservare i nomi, preparare l'ambiente dei benchmark. L'umano viene per primo.

La stima di Angelia usa ancora la stessa griglia di Horae (una story M = 3,5 ore di agenti), per un totale di **220 giorni umani, 294 ore di agenti e 431 ore di supervisione**. La sua Fase 0 sarà un secondo test dello stesso modello, su un linguaggio diverso e su un tipo di progetto diverso.

## 10. Team da due pizze o team da un panino?

La stima confrontava "un umano + agenti" con "tre sviluppatori". Penso che il confronto più interessante riguardi la forma del team.

Il **team da due pizze** di Amazon (abbastanza piccolo da essere sfamato con due pizze, quindi da sei a dieci persone) è stato pensato per limitare la coordinazione. Anche così, otto persone hanno **28 canali di comunicazione** tra loro (n(n−1)/2). Matt Ström-Awn scrive che l'idea [si è trasformata in "team da due panini"](https://mattstromawn.com/writing/high-agency-strategy/), "lo stesso principio, ma con un team di due persone". A luglio [Business Insider ha raccolto lo stesso segnale da diversi leader del settore](https://finance.yahoo.com/technology/ai/articles/2-pizza-days-over-heres-095501046.html): il field CTO di Cursor dice che "due pizze sono troppa pizza", il CEO di Coinbase parla di "team di una persona".

Una board come questa è un **hub**, non una rete. Un umano parla con un agente principale, l'agente principale parla con gli agenti operativi, e questi non parlano mai tra loro. Con quattro agenti sono quattro canali, non 28. Non è un dettaglio: la ricerca sulla cooperazione tra agenti trova che agenti che si coordinano tra loro [fanno nettamente peggio di un agente da solo](https://www.mintlify.com/cooperbench/CooperBench/results/findings), quindi l'hub è la forma giusta anche per gli agenti.

Cosa ne ricavo:

- **L'unità di throughput ora sono le decisioni al giorno, non le righe di codice al giorno.** La capacità decisionale di una persona è il tetto. Le mie 15 ore a settimana sono il vero vincolo, come diceva il modello, solo spese in un altro modo. E ora c'è un secondo tetto: la quota di utilizzo.
- **Un team da un panino, due persone, è probabilmente il punto di equilibrio.** Due persone raddoppiano la capacità decisionale con un solo canale in più, e la board continua a muoversi quando una delle due è occupata. Su Horae la divisione ovvia sarebbe prodotto e architettura da una parte, sicurezza e story Human-led dall'altra.
- **Un team da due pizze diventa più team da un panino**, ognuno responsabile di un prodotto o di un repository con la propria board, invece di otto persone su un unico backlog. È letteralmente quello che sto facendo con Horae e Angelia: due board, un umano, ognuna con i propri agenti. La coordinazione che resta è tra board, e può essere esplicita: link "bloccato da", contratti in `schemas/`, ADR.
- **I team da due pizze vincono ancora** dove il lavoro è irriducibilmente umano e parallelo: review di sicurezza, reperibilità, conoscenza del dominio, il rapporto con gli utenti, e il bus factor. Un team da un panino con agenti ha un bus factor di uno o due.

Lo studio sul campo di Microsoft su Claude Code e Copilot CLI ha misurato [circa il 24% di PR unite in più](https://arxiv.org/abs/2607.01418) tra chi li ha adottati, in un'organizzazione che ha mantenuto la forma dei propri team. È un guadagno reale, ma niente a che vedere con quello che si vede quando il processo viene ricostruito intorno agli agenti. Sospetto che gran parte della differenza stia nella forma del team e nel processo, non nel modello.

## 11. Come provarlo a casa tua

Se vuoi provarci sul tuo progetto, questo è il minimo che l'ha fatto funzionare, con quello che ha aggiunto Angelia:

1. **Scrivi il backlog con l'agente, validalo tu.** Criteri di accettazione su ogni story. Ma dettaglia solo la fase successiva, o le due successive; lascia il resto come abbozzo.
2. **Aggiungi un campo Executor** (Agent, Agent + human check, Human-led, Human-only) e una **vista Agent-ready**. Gli agenti devono sapere cosa saltare.
3. **Metti il modello sulla card**: un campo Complexity e un Model suggerito che puoi cambiare.
4. **Descrivi le colonne.** "Ready = specifica completa", "Human needed = bloccata sul maintainer". Le descrizioni sono il protocollo.
5. **Scrivi quando un agente deve fermarsi e chiedere**: contratti pubblici, scelte di sicurezza, nuove dipendenze, specifiche ambigue, fallimenti ripetuti della CI.
6. **Metti una stima e una sezione Actuals vuota in ogni story.** Chiedi all'agente di compilare gli Actuals alla fine. Dopo 15 story avrai la tua calibrazione invece dello studio di qualcun altro.
7. **Separa i ruoli**: costruttore, revisore indipendente, correttore. Chi scrive non approva mai.
8. **Fai della CI il cancello**: un controllo aggregato "CI OK", e merge solo sul verde.
9. **Concorda il protocollo Human needed**: domande numerate nella PR, risposte sulla PR, card di nuovo in Ready. E fai in modo che l'agente principale **rilegga la board tra una story e l'altra**.
10. **Chiedi una milestone alla volta**, e fai in modo che ogni card In progress abbia un checkpoint prima di uno stop.

Quello che non ho ancora fatto, e dovrei: una protezione del branch che *richieda* "CI OK" (oggi è solo una convenzione), [Graft](/it/sei-settimane-in-una-notte-costruire-un-prodotto-nellera-degli-agenti/) su Horae per registrare quale agente e quale modello hanno scritto ogni PR, e la misura del costo in token per story, ora che la quota ha dimostrato di essere un vincolo reale.

## 12. Per chiudere

La stima diceva che sarei stato io il collo di bottiglia, e lo sono. Ma le ore che ci passo non sono nei diff. Sono nei ticket, prima che il codice esista, nelle domande a cui gli agenti non possono, e non devono, rispondere, e nel decidere quando premere "continue". Tutto quello che succede tra questi momenti ora richiede minuti, o qualche ora per un'intera milestone.

Scrivete bene i ticket. Lasciate guidare la board. Tenete umane le decisioni.

## Link

- 🗂️ [Horae Roadmap](https://github.com/orgs/horae-dev/projects/1): la board pubblica, con tutte le sue viste
- 📦 [horae-dev/horae](https://github.com/horae-dev/horae): il codice, `docs/ESTIMATION.md` e `docs/ROADMAP.md`
- 🗂️ [Angelia Roadmap](https://github.com/orgs/angelia-dev/projects/1) e [angelia-dev/angelia](https://github.com/angelia-dev/angelia): la seconda board, con `docs/ESTIMATION.md` e `AGENTS.md`
- 🎬 [Il video a pagina intera](/videos/human-agents-board/?lang=it), fatto con [canvas-video-skill](https://github.com/mmornati/canvas-video-skill)
- 📖 [Sei settimane in una notte](/it/sei-settimane-in-una-notte-costruire-un-prodotto-nellera-degli-agenti/): l'esperimento precedente, con Graft

**Fonti:** [METR, Time Horizon 1.1](https://metr.org/blog/2026-1-29-time-horizon-1-1/) (gen. 2026) · [METR, uplift update](https://metr.org/blog/2026-02-24-uplift-update/) (feb. 2026) · [Anthropic, When AI builds itself](https://www.anthropic.com/institute/recursive-self-improvement) (aggiornato a set. 2026) · [Murphy-Hill, Butler e Savelieva, gli agenti di coding da riga di comando in Microsoft](https://arxiv.org/abs/2607.01418) (lug. 2026) · [Team .NET, dieci mesi con il coding agent di Copilot](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/) (mar. 2026) · [CodeRabbit, codice IA contro codice umano](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report) (dic. 2025) · [Report GenAI 2026 di Veracode](https://www.veracode.com/wp-content/uploads/2026-GenAI-Report-Infographic.pdf) · [Matt Ström-Awn, High-agency strategy](https://mattstromawn.com/writing/high-agency-strategy/) · [Business Insider, i giorni delle due pizze sono finiti](https://finance.yahoo.com/technology/ai/articles/2-pizza-days-over-heres-095501046.html) (lug. 2026) · [Risultati di CooperBench](https://www.mintlify.com/cooperbench/CooperBench/results/findings)
