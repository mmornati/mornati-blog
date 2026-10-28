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
- estimation
- productivity
- team-topology
date: '2026-10-28T17:00:00.000000+00:00'
draft: false
slug: un-umano-una-board-e-un-team-di-agenti
translationKey: human-agents-board
cover: cover.jpg
showHero: true
description: "Come costruisco Horae con un team di agenti IA e una sola board di GitHub Project: ticket scritti con Claude e validati da me, una sola istruzione (\"segui la board\"), tre agenti per story (costruire, review indipendente, correggere) e un protocollo semplice per quando serve un umano. La stima iniziale diceva che un umano con degli agenti sarebbe stato più lento di tre sviluppatori. Le prime sei story hanno richiesto da 7 a 32 minuti di lavoro degli agenti ciascuna, contro ore nella stima. Perché il modello sbagliava, cosa dice ancora di giusto, e cosa cambia tra il team da due pizze e il team da un panino."
summary: "La stima diceva che un umano con quattro agenti avrebbe impiegato 76 settimane dove tre sviluppatori ne impiegano 22. Poi la board ha cominciato a muoversi: sei story, da 7 a 32 minuti di lavoro degli agenti ciascuna, 97 problemi della review corretti prima del merge, nessun intervento umano. Il collo di bottiglia resta l'umano, ma non dove lo metteva il modello."
projects:
- horae
---

Ieri ho chiesto a Claude di stimare un progetto in due modi: in **giorni umani**, se lo costruisse un team di sviluppatori, e in **giorni IA**, se lo costruisse un team di agenti con me a supervisionare. La risposta era chiara, e un po' deludente: **un umano con quattro agenti sarebbe stato più lento di tre sviluppatori**. 76 settimane contro 22, perché la mia supervisione sarebbe stata il collo di bottiglia.

Non ero convinto. Così ho organizzato il progetto in modo che fosse la board stessa a darmi la risposta: ogni story porta la sua stima, e ogni story riceve i suoi numeri reali quando è finita. Poi ho dato agli agenti una sola istruzione: *segui la board*.

Questo post racconta come funziona giorno per giorno (la board, gli agenti, i momenti in cui servo io), cosa dicono i primi numeri rispetto alla stima, e cosa cambia quando il tuo "team" è una persona con qualche agente invece di un team da due pizze.

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

Ogni repository ha anche un `AGENTS.md` (setup, comandi, convenzioni, definizione di "fatto") e una policy `graft.yaml` che dice quali percorsi richiedono la mia review. Le regole vivono nel repository, non in un prompt.

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

![La board di Horae stamattina: 106 elementi in Backlog, 3 in Ready, 5 in corso e 6 finiti, ogni card finita collegata alla sua pull request unita](/images/one-human-a-board-and-a-team-of-agents/board.webp)

Intorno ci sono altre cinque viste: **Roadmap**, **Backlog by milestone** (con le stime), **Agent-ready** (filtro `label:agent-ready status:Ready`: quello che un agente può prendere adesso), **Human work** (gli elementi Human-led e Human-only, il vero collo di bottiglia) e **Burning points** (i rischi).

![La vista "Human work": ogni elemento Human-led e Human-only con le sue ore di supervisione, da 8 a 28 ore ciascuno](/images/one-human-a-board-and-a-team-of-agents/human-work.webp)

Quest'ultima è la schermata che guardo di più. Mi dice dove andranno le mie serate.

## 4. Una sola istruzione: segui la board

Poi ho scritto questo (in inglese, errori compresi):

> Following the project on github https://github.com/orgs/horae-dev/projects/1/views/3 Start in the right order the epics/issues ready for agents dev.
> Use the proper workflow with subagents when needed assigning the proper model based on the complexity, make a full review with another agent and fix then all the findings with a third agent.
> Create the PR referencing the issue, wait for the CI to be green, merge and move on.

In sostanza: segui il progetto, avvia nell'ordine giusto quello che è pronto per gli agenti, scegli il modello in base alla complessità, fai fare la review a un altro agente e fai correggere tutti i problemi a un terzo, apri la PR che riferisce la issue, aspetta che la CI sia verde, fai il merge e vai avanti. Un minuto dopo, un secondo messaggio: *assegna ogni task prima di iniziare, così posso tracciare il tempo*.

Da lì, la sessione principale di Claude Code ha guidato la board. Per ogni story in Ready, nell'ordine delle dipendenze:

1. **Assegnare** la issue (a me) e spostarla in **In progress**: il timestamp fa partire il cronometro.
2. **Costruire**: un sotto-agente la implementa su un branch `story/<n>-<slug>`. L'agente principale sceglie il modello in base alla complessità: Sonnet per lo scaffold, la CI e il workflow degli agenti; Opus per i JSON Schema, la validazione degli intent e gli ADR.
3. **Review**: un agente Opus separato rivede il lavoro rispetto ai criteri di accettazione, a `PLAN.md` e alle story che ne dipendono. Non modifica nulla: riproduce i problemi in un clone usa e getta e scrive i suoi rilievi.
4. **Correggere**: un terzo agente corregge *tutti* i problemi trovati.
5. Aprire la PR che riferisce la issue, **aspettare che la CI sia verde**, fare il merge.
6. Pubblicare gli **Actuals** sulla issue e spostare la card in **Done**.

![La story #13 nella cronologia della issue: spostata in Ready, assegnata, spostata in In progress, chiusa dalla PR unita, poi il commento Actuals: 1 implementazione, 1 review con 20 problemi (8 gravi), 1 passata di correzione, circa 32 minuti di agente, nessun intervento umano](/images/one-human-a-board-and-a-team-of-agents/issue-actuals.webp)

Le card con Executor **Human-led** vengono saltate: aspettano me. La mattina dopo, visto che restavano story indipendenti, l'agente principale le ha avviate **in parallelo**, ognuna nel suo worktree git: una nota sul threat model, una nota sul plugin host, lo store SQLite, il caricatore della configurazione e la validazione degli intent, mentre le precedenti erano ancora in review.

### Cosa hanno trovato i revisori

È la parte che mi ha convinto che il ciclo funziona. L'implementatore diceva sempre "tutti i controlli passano". Il revisore trovava sempre qualcosa di reale, e spesso di serio:

- **#10 scaffold** (16 problemi): gitleaks ignorava in silenzio un'intera cartella, e Renovate non avrebbe mai aggiornato gli hook di pre-commit.
- **#15 workflow degli agenti** (13): l'hook di commit usava il primo `python3` nel PATH. Con il Python 3.9 di default di macOS andava in crash e **bloccava ogni commit**, compresi i miei.
- **#13 schema** (20, di cui 8 gravi): il percorso di una nota poteva uscire dal vault di Obsidian verso `.obsidian/plugins` (esecuzione di codice sul mio portatile), `notify.push` accettava link `javascript:`, gli URL di `http.post` potevano aggirare la lista degli host autorizzati, e il lockfile accettava URL git `ext::`.
- **#18 store SQLite**: le chiavi esterne erano attive prima delle migrazioni, quindi una futura ricostruzione di tabella avrebbe cancellato in silenzio tutto il journal. Il revisore ha riprodotto la perdita di dati.
- **#16 caricatore della configurazione**: 400 `[` annidate mandavano in crash `horae doctor`, e un segreto poteva uscire dal contesto delle eccezioni di Python.

In più, un hook di Semgrep ha bloccato la sessione due volte su SQL costruito con le f-string, e l'agente principale ha fatto riscrivere all'agente dello store ogni query come stringa fissa. Niente di tutto questo ha avuto bisogno di me.

## 5. Quando serve un umano

Alcune story sono mie per scelta: il threat model, il plugin host, tutto ciò in cui un default sbagliato diventa una falla. Per queste l'agente non tira a indovinare. Scrive una **nota di design** in una PR in bozza, con domande numerate, e la card passa in **Human needed**.

Il protocollo sta in due passi:

1. **Rispondere sulla PR**, mantenendo i numeri delle domande. Bastano risposte brevi; anche "tutto come proposto" va bene.
2. **Rimettere la card in Ready.** È il segnale. La prossima volta che un agente la prende, legge i miei commenti, trasforma la nota nel vero deliverable e riparte con il solito ciclo costruire → review → correggere → merge.

![La pull request #85, la nota di design del plugin host: dieci domande numerate per il maintainer, e sotto le mie risposte, una riga ciascuna](/images/one-human-a-board-and-a-team-of-agents/pr-questions-answers.webp)

Dieci domande, dieci risposte di una riga, una card rimessa in Ready. È tutta l'interfaccia.

Lo stesso schema torna per le decisioni più piccole. Quando `PLAN.md` era ambiguo, gli agenti **hanno scelto l'opzione più restrittiva** (allentare una regola dopo non rompe niente, stringerla sì), l'hanno segnata come provvisoria e me l'hanno elencata: 21 decisioni di contratto in `schemas/README.md`, che ho confermato con un solo messaggio la mattina dopo. Gli ADR (story #12, "Agent + human check") sono rimasti senza merge finché non li ho letti e ho scritto "Accept and merge".

Gli agenti mi hanno anche detto chiaramente cosa *non potevano* fare: installare una GitHub App privata sull'organizzazione, o configurare i campi data della vista Roadmap, che l'API non espone. Questi compiti sono finiti nell'epic "Human operations".

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

Quindi gran parte delle 1.134 ore ero io, a rivedere diff e a salvare agenti.

## 7. Cosa dice la board dopo sei story

Il progetto prevede di "ricalibrare dopo circa 15 story", quindi questa è una prima lettura, non un verdetto. Ma la differenza è abbastanza grande da meritare di essere mostrata:

| Story | Taglia · rischio | Tempo agente stimato | Supervisione stimata | **Tempo agente misurato** | Problemi trovati in review | Esito |
|---|---|---|---|---|---|---|
| #10 scaffold uv | S · Docs/CI | 0,9 h | 2,0 h | **7 min** | 16 | merge, [#78](https://github.com/horae-dev/horae/pull/78) |
| #11 pipeline CI | S · Docs/CI | 0,9 h | 2,0 h | **7 min** | 10 (1 bloccante) | merge, [#79](https://github.com/horae-dev/horae/pull/79) |
| #15 workflow degli agenti | XS · Docs/CI | 0,3 h | 1,0 h | **12 min** | 13 (1 bloccante) | merge, [#80](https://github.com/horae-dev/horae/pull/80) |
| #13 JSON Schema | M · Core contract | 3,7 h | 7,7 h | **32 min** | 20 (8 gravi) | merge, [#81](https://github.com/horae-dev/horae/pull/81) |
| #12 ADR | M · Design | 4,2 h | 7,5 h | **11 min** | 25 (8 gravi) | accettata da me, [#82](https://github.com/horae-dev/horae/pull/82) |
| #20 validazione degli intent | M · Core contract | 3,7 h | 7,7 h | **20 min** | 13 (4 medi) | merge, [#87](https://github.com/horae-dev/horae/pull/87) |
| **Totale** | | **13,7 h** | **27,9 h** | **89 min** | **97** | 6 finite, 0 interventi |

Il "tempo agente misurato" è la somma delle durate dei tre agenti (costruire, review, correggere) come riportata su ogni issue. Non comprende l'attesa della CI, che aggiungeva qualche minuto per story. Le prime cinque sono state fatte in una serata, dal primo messaggio alle 21:03 all'ultima PR pronta alle 22:22.

Tre cose saltano all'occhio:

1. **Il tempo degli agenti era sovrastimato di circa 9 volte.** 89 minuti dove il modello se ne aspettava quasi 14 ore. È la parte che conta meno, perché il tempo degli agenti non è mai stato il collo di bottiglia.
2. **Nessun intervento umano.** Il modello si aspettava che le story M fallissero il primo tentativo la maggior parte delle volte (30-50% di successo) e ricadessero su di me. Non sono ricadute su di me: il revisore ha trovato i problemi e il correttore li ha corretti. Un primo tentativo fallito è diventato un'iterazione interna economica, non un salvataggio umano.
3. **La mia supervisione non è sparita, si è spostata.** La stima metteva circa 28 ore di supervisione su queste sei story, soprattutto per rivedere diff. Non ho rivisto nessun diff. Il mio tempo è andato *a monte* (le sessioni di pianificazione e la validazione di 130 ticket, qualche serata) e *di lato* (rispondere alle domande di design, confermare 21 decisioni provvisorie, accettare sei ADR).

### Perché il modello sbagliava

Il modello non era fatto male. Era **costruito su numeri del 2025, e metteva l'umano nel posto sbagliato**.

- **I dati sono invecchiati in fretta.** L'aggiornamento di METR mette il tempo di raddoppio della lunghezza dei compiti che i modelli di frontiera sanno portare a termine a [circa 89 giorni per i modelli dal 2024](https://metr.org/blog/2026-1-29-time-horizon-1-1/), e Anthropic parla di un raddoppio ["circa ogni quattro mesi, contro i sette mesi di prima"](https://www.anthropic.com/institute/recursive-self-improvement). Una stima fatta a ottobre su studi di inizio 2025 è calibrata su modelli indietro di due o tre raddoppi.
- **Presumeva che un umano rivedesse ogni tentativo.** In questo workflow la review la fa un agente indipendente, e io rivedo le decisioni. È anche la direzione in cui vanno i grandi team: Anthropic scrive che ["la code review umana è diventata un nuovo collo di bottiglia"](https://www.anthropic.com/institute/recursive-self-improvement), con oltre l'80% del suo codice unito ormai scritto da Claude. Anche il team .NET di Microsoft, dopo dieci mesi con il coding agent di Copilot, [indica la review come collo di bottiglia](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/).
- **Il "successo al primo tentativo" era l'unità sbagliata.** Misura se il primo diff è pronto per il merge. Con un revisore e un correttore nel ciclo, conta se il *ciclo* converge senza un umano. Sei su sei l'hanno fatto.

### Cosa dice ancora di giusto il modello

Non voglio sostituire un numero sbagliato con un altro, quindi ecco i limiti onesti:

- **Erano le story più facili.** Le fondamenta: scaffold, CI, schema, documentazione. Il modello stesso dice che gli agenti sono quasi gratis sul lavoro Docs/CI. La parte difficile (sicurezza, sandbox dei plugin, API esterne non ufficiali) è marcata Human-led e non è ancora iniziata.
- **Sei story sono un campione minuscolo**, e niente è ancora in produzione. "Unito con la CI verde dopo una review indipendente" non vuol dire "corretto".
- **I difetti non spariscono.** Gli studi trovano ancora più problemi nelle PR scritte dall'IA ([1,7 volte più problemi gravi per CodeRabbit](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report), [il 44% dei compiti con una vulnerabilità a rischio per Veracode](https://www.veracode.com/wp-content/uploads/2026-GenAI-Report-Infographic.pdf), più instabilità per DORA). I miei 97 problemi dicono la stessa cosa: la prima bozza è spesso sbagliata. È cambiato chi se ne accorge.
- **Il tempo a monte è reale.** Scrivere e validare 130 buoni ticket mi ha richiesto più tempo di quanto ne abbiano impiegato gli agenti per consegnarne sei. Il team .NET ha visto la stessa cosa: il tasso di successo del loro agente è passato dal 38% al 69% dopo istruzioni migliori, e la loro conclusione è che ["la preparazione conta più del modello"](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/).

Quindi la stima aveva ragione: **il collo di bottiglia sono io**. Sbagliava sul *tipo* di lavoro che avrei fatto. Mi contava come revisore di codice. Lavoro come product owner e come architetto che risponde a domande.

## 8. Team da due pizze o team da un panino?

La stima confrontava "un umano + agenti" con "tre sviluppatori". Penso che il confronto più interessante riguardi la forma del team.

Il **team da due pizze** di Amazon (abbastanza piccolo da essere sfamato con due pizze, quindi da sei a dieci persone) è stato pensato per limitare la coordinazione. Anche così, otto persone hanno **28 canali di comunicazione** tra loro (n(n−1)/2). Matt Ström-Awn scrive che l'idea [si è trasformata in "team da due panini"](https://mattstromawn.com/writing/high-agency-strategy/): lo stesso principio, ma con un team di due persone. A luglio [Business Insider ha raccolto lo stesso segnale da diversi leader del settore](https://finance.yahoo.com/technology/ai/articles/2-pizza-days-over-heres-095501046.html): il field CTO di Cursor dice che "due pizze sono troppa pizza", il CEO di Coinbase parla di "team di una persona".

Una board come questa è un **hub**, non una rete. Un umano parla con un agente principale, l'agente principale parla con gli agenti operativi, e questi non parlano mai tra loro. Con quattro agenti sono quattro canali, non 28. Non è un dettaglio: la ricerca sulla cooperazione tra agenti trova che agenti che si coordinano tra loro [fanno nettamente peggio di un agente da solo](https://www.mintlify.com/cooperbench/CooperBench/results/findings). L'hub è quindi la forma giusta anche per gli agenti.

Cosa ne ricavo:

- **L'unità di throughput ora sono le decisioni al giorno, non le righe di codice al giorno.** La capacità decisionale di una persona è il tetto. Le mie 15 ore a settimana sono il vero vincolo, come diceva il modello, solo spese in un altro modo.
- **Un team da un panino, due persone, è probabilmente il punto di equilibrio.** Due persone raddoppiano la capacità decisionale con un solo canale in più. Su Horae la divisione ovvia sarebbe prodotto e architettura da una parte, sicurezza e story Human-led dall'altra.
- **Un team da due pizze diventa più team da un panino**, ognuno responsabile di un epic o di un repository con la propria board, invece di otto persone su un unico backlog. La coordinazione che resta è tra board, e può essere esplicita: link "bloccato da", contratti in `schemas/`, ADR.
- **I team da due pizze vincono ancora** dove il lavoro è irriducibilmente umano e parallelo: review di sicurezza, reperibilità, conoscenza del dominio, il rapporto con gli utenti, e il bus factor. Un team da un panino con agenti ha un bus factor di uno o due.

Lo studio sul campo di Microsoft su Claude Code e Copilot CLI ha misurato [circa il 24% di PR unite in più](https://arxiv.org/abs/2607.01418) tra chi li ha adottati, in un'organizzazione che ha mantenuto la forma dei propri team. È un guadagno reale, ma niente a che vedere con quello che si vede quando il processo viene ricostruito intorno agli agenti. Sospetto che gran parte della differenza stia nella forma del team e nel processo, non nel modello.

## 9. Come provarlo a casa tua

Se vuoi provarci sul tuo progetto, questo è il minimo che l'ha fatto funzionare:

1. **Scrivi il backlog con l'agente, validalo tu.** Criteri di accettazione su ogni story. È il lavoro umano che ripaga tutto il resto.
2. **Aggiungi un campo Executor** (Agent, Agent + human check, Human-led, Human-only) e una **vista Agent-ready**. Gli agenti devono sapere cosa saltare.
3. **Descrivi le colonne.** "Ready = specifica completa", "Human needed = bloccata sul maintainer". Le descrizioni sono il protocollo.
4. **Metti una stima e una sezione Actuals vuota in ogni story.** Chiedi all'agente di compilare gli Actuals alla fine. Dopo 15 story avrai la tua calibrazione invece dello studio di qualcun altro.
5. **Separa i ruoli**: costruttore, revisore indipendente, correttore. Chi scrive non approva mai.
6. **Fai della CI il cancello**: un controllo aggregato "CI OK", e merge solo sul verde.
7. **Concorda il protocollo Human needed**: domande numerate nella PR, risposte sulla PR, card di nuovo in Ready.
8. **Dai una sola istruzione**: segui la board, nell'ordine, assegna prima di iniziare, merge sul verde, pubblica gli Actuals.

Quello che non ho ancora fatto, e dovrei: una protezione del branch che *richieda* "CI OK" (oggi è solo una convenzione), [Graft](/it/sei-settimane-in-una-notte-costruire-un-prodotto-nellera-degli-agenti/) sull'organizzazione per registrare quale agente e quale modello hanno scritto ogni PR, e la misura del costo in token per story.

## 10. Per chiudere

La stima diceva che sarei stato io il collo di bottiglia, e lo sono. Ma le ore che ci passo non sono nei diff. Sono nei ticket, prima che il codice esista, e nelle domande a cui gli agenti non possono, e non devono, rispondere. Tutto quello che succede tra questi due momenti ora richiede minuti.

Scrivete bene i ticket. Lasciate guidare la board. Tenete umane le decisioni.

## Link

- 🗂️ [Horae Roadmap](https://github.com/orgs/horae-dev/projects/1): la board pubblica, con tutte le sue viste
- 📦 [horae-dev/horae](https://github.com/horae-dev/horae): il codice, `docs/ESTIMATION.md` e `docs/ROADMAP.md`
- 🎬 [Il video a pagina intera](/videos/human-agents-board/?lang=it), fatto con [canvas-video-skill](https://github.com/mmornati/canvas-video-skill)
- 📖 [Sei settimane in una notte](/it/sei-settimane-in-una-notte-costruire-un-prodotto-nellera-degli-agenti/): l'esperimento precedente, con Graft

**Fonti:** [METR, Time Horizon 1.1](https://metr.org/blog/2026-1-29-time-horizon-1-1/) (gen. 2026) · [METR, uplift update](https://metr.org/blog/2026-02-24-uplift-update/) (feb. 2026) · [Anthropic, When AI builds itself](https://www.anthropic.com/institute/recursive-self-improvement) (aggiornato a set. 2026) · [Murphy-Hill, Butler e Savelieva, gli agenti di coding da riga di comando in Microsoft](https://arxiv.org/abs/2607.01418) (lug. 2026) · [Team .NET, dieci mesi con il coding agent di Copilot](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/) (mar. 2026) · [CodeRabbit, codice IA contro codice umano](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report) (dic. 2025) · [Report GenAI 2026 di Veracode](https://www.veracode.com/wp-content/uploads/2026-GenAI-Report-Infographic.pdf) · [Matt Ström-Awn, High-agency strategy](https://mattstromawn.com/writing/high-agency-strategy/) · [Business Insider, i giorni delle due pizze sono finiti](https://finance.yahoo.com/technology/ai/articles/2-pizza-days-over-heres-095501046.html) (lug. 2026) · [Risultati di CooperBench](https://www.mintlify.com/cooperbench/CooperBench/results/findings)
