---
title: "Cinque anni di circuiti invertiti: un pomeriggio con Claude per rimettere a posto la mia pompa di calore"
categories:
- smart-home
tags:
- home-assistant
- hitachi
- heat-pump
- csnet
- underfloor-heating
- claude
- ai
- mcp
date: '2026-11-11T18:30:00.000000+00:00'
draft: false
slug: cinque-anni-di-circuiti-invertiti-la-mia-pompa-di-calore-rivista-con-claude
translationKey: heat-pump-swapped-circuits
cover: cover.jpg
showHero: true
keyfigure: '5 anni con i circuiti 1 e 2 invertiti'
description: "Mentre rifacevo le dashboard della mia pompa di calore Hitachi in Home Assistant, Claude ha notato che il circolatore girava al 100% da sempre. Tirando quel filo, con qualche foto, qualche test e i dati letti in diretta dalla mia integrazione CSNet, abbiamo finito per confermare un dubbio che avevo dall'installazione, cinque anni fa: il riscaldamento a pavimento e i radiatori del piano di sopra erano configurati sul circuito sbagliato, e la valvola a tre vie che \"non funzionava in automatico\" obbediva al termostato del piano di sopra."
summary: "Un circolatore impostato a velocità fissa al 100% dal primo giorno, una valvola miscelatrice bloccata al 100%, una sonda appoggiata sulla plastica e, soprattutto, due circuiti invertiti nel comando. Come lo abbiamo dimostrato con due interruttori e lo storico di Home Assistant, cosa abbiamo cambiato (curve climatiche, limite del pavimento, identificativi dei termostati radio), cosa ha dato, e le tre correzioni che l'integrazione Home Assistant ha ricevuto strada facendo."
projects:
- hitachi-csnet
---

È cominciato tutto con una questione di stile. Stavo rifacendo le dashboard di Home Assistant, in particolare la vista della pompa di calore, con Claude che leggeva i valori reali per riempire le card. Tra colori e icone si ferma su una riga: **la velocità del circolatore è al 100%, e non si è mai mossa**. Nemmeno una volta, su tutto lo storico disponibile. Aggiunge che la portata è di 3,9 m³/h, che la differenza tra l'acqua in mandata e quella di ritorno non supera 1 o 2 °C, e che tutto questo assomiglia parecchio a un circolatore che gira troppo veloce, sempre.

Non immaginavo che quel filo mi avrebbe riportato indietro di cinque anni.

## Un po' di contesto: una pompa di calore scoperta a casa mia

La mia pompa di calore è una Hitachi Yutaki. Alimenta due circuiti: un **riscaldamento a pavimento al piano terra** e dei **radiatori al piano di sopra**. Non farò il nome dell'azienda che l'ha installata. Dirò solo che, durante l'installazione, i tecnici mi avevano confessato che era **la prima pompa di calore Hitachi che installavano**, che non erano stati formati e che la stavano scoprendo a casa mia. Un po' si vedeva.

Già allora avevo un dubbio. La valvola a tre vie del pavimento non funzionava in automatico: appena la si metteva in auto, si chiudeva e il pavimento faceva solo girare la sua acqua in circolo, senza mai scaldare. L'avevo segnalato. Mi era stato risposto, più o meno, che **"non è grave, è un di più"**. Senza commento. La valvola è quindi rimasta in manuale, e ho passato cinque anni con una casa che scaldava, ma in cui era stranamente difficile trovare la regolazione giusta: mai davvero troppo caldo, mai davvero troppo freddo, mai davvero bene.

Da allora ho scritto, e mantengo, un'[integrazione Home Assistant per le pompe di calore Hitachi che passano dal cloud CSNet](https://github.com/mmornati/home-assistant-csnet-home) (ne ho parlato [qui](/seamlessly-automate-your-home-with-hitachi-devices-a-custom-home-assistant-integration/) e [qui](/reverse-engineering-hitachis-cloud-api-with-ai-from-browser-devtools-to-a-full-home-assistant-integration/), in inglese). È lei che ha reso possibile questo pomeriggio: Claude poteva leggere in diretta quello che la pompa di calore pensava di fare, e confrontarlo con quello che vedevo io in locale tecnico.

## Primo filo: il circolatore al 100%

Prima di toccare qualsiasi cosa bisognava sapere se il valore era vero. L'integrazione non trasforma quel campo, quindi era CSNet stesso a dire 100%. Restava da verificare alla fonte: sul comando della pompa di calore, menu *Informazioni*, leggo **portata 3,90 m³/h, velocità circolatore 100%**. Identico.

Nel menu installatore (sul mio comando ci si entra tenendo premuti **OK** e **indietro** per tre secondi, poi il codice a frecce del manuale), la schermata di configurazione della pompa dell'acqua risponde in una riga: **modalità di funzionamento: Fissa, velocità riscaldamento: 100%**. Il circolatore non ha mai modulato dall'installazione.

Claude mi ha spiegato perché gli installatori lasciano spesso questa impostazione: al 100% la portata minima dello scambiatore è garantita in ogni situazione, sbrinamenti compresi, e nessuno richiama per un allarme di portata. È la scelta della **semplicità di messa in servizio contro il consumo**. Non un errore grave, ma nemmeno gratis:

*   un circolatore di questo tipo consuma circa 60-90 W al massimo, contro 15-40 W in modulazione, cioè **da 0,5 a 1,5 kWh al giorno**, qualche decina di euro per stagione di riscaldamento;
*   con una portata troppo alta la differenza mandata/ritorno crolla (1-2 °C invece dei 5 °C per cui Hitachi dimensiona), il che non aiuta il rendimento;
*   e soprattutto, secondo me, **l'usura**: un motore che gira al massimo, in continuo, per anni, invecchia più in fretta. Non si vede in bolletta, ma si paga il giorno in cui bisogna cambiarlo.

La modifica sta in una riga: **Fissa → ΔT**. Pochi minuti dopo Home Assistant mostrava 97%, poi 82%, poi 70%, con la portata che cominciava a scendere e la differenza mandata/ritorno che si allargava a 3 °C. Stasera il circolatore gira intorno al **50%** per **2,4 m³/h**.

Guardando quei dati, però, Claude aveva segnalato anche altri due valori sospetti: la **posizione della valvola miscelatrice, bloccata al 100%** esattamente come il circolatore, e una pressione dell'acqua di 4,48 bar che non si muoveva mai. È stata la valvola a farmi ripensare al mio vecchio dubbio.

## Secondo filo: la valvola e la sua sonda

Ho fatto due foto del gruppo del pavimento: la valvola a tre vie motorizzata in basso, il circolatore Wilo sopra, la mandata del pavimento con il termometro rosso, il ritorno con quello blu. E la sonda di temperatura del circuito, **semplicemente stretta con una fascetta sul tubo multistrato bianco**.

Claude l'ha notato subito: il multistrato (PEX-alu-PEX) isola, la sonda tocca il tubo in un solo punto e niente la protegge dall'aria della stanza. Misura un misto di acqua e aria, con minuti di ritardo, abbastanza per far oscillare qualunque regolazione. La soluzione, senza passare a una sonda a immersione: spostarla **sul corpo in ottone della valvola con la maniglia rossa**, che è a contatto diretto con l'acqua, con un po' di pasta termica (avevo dell'Arctic MX-6 in un cassetto), nastro di alluminio, la fascetta sopra e il guscio isolante del kit richiuso.

Ma guardando le mie foto delle **curve climatiche**, Claude ha sollevato qualcosa di molto più importante della sonda.

## Il vero problema: i due circuiti sono invertiti

Su una Hitachi i due circuiti non hanno lo stesso ruolo. Il **circuito 1 è un circuito diretto**: la pompa di calore produce l'acqua per lui. Il **circuito 2 è l'unico che può avere una valvola miscelatrice**: il manuale del regolatore lo dice chiaramente, la regolazione della seconda temperatura dell'acqua è "*only for circuit 2*". La valvola sa solo raffreddare l'acqua della pompa di calore miscelandola con il ritorno. Logicamente, quindi, il circuito più freddo, il pavimento, dovrebbe essere su C2.

A casa mia il comando diceva il contrario:

| | Circuito | Curva climatica | Set point con 8 °C fuori |
|---|---|---|---|
| Pavimento (piano terra) | **C1** (diretto) | Curva: 44 °C a −20 °C, pendenza 0,6 | ≈ 27 °C |
| Radiatori (piano di sopra) | **C2** (miscelato) | Per punti: 60 °C a −10 °C, 21 °C a 20 °C | ≈ 37 °C |

Eppure c'è **un solo gruppo con valvola miscelatrice, ed è sul pavimento**. I radiatori del piano di sopra hanno il loro circolatore, senza valvola. Fisicamente l'impianto era cablato come prevede Hitachi. Era la configurazione a essere al contrario.

### Dimostrarlo con due interruttori

Un'ipotesi va bene, ma volevo vederla. Claude ha proposto un test semplice: spegnere un circuito alla volta dall'app e guardare cosa fa la pompa di calore in Home Assistant.

**Spengo il piano di sopra.** Un minuto dopo `mix_valve_position` passa da **100% a 0%**, per la prima volta in tutto lo storico. La valvola montata sul pavimento obbedisce quindi al termostato del piano di sopra.

**Spengo il piano terra e riaccendo il piano di sopra.** Il set point dell'acqua della pompa di calore passa da **23-24 °C a 38 °C**, la valvola torna al 100% e l'acqua in uscita dalla pompa di calore sale da 25 a 38 °C.

| Cosa è acceso | Set point acqua PdC | Valvola pavimento | Mandata PdC |
|---|---|---|---|
| Solo piano terra (C1) | 23-24 °C | 0% | 23-25 °C |
| Solo piano di sopra (C2) | **38 °C** | 100% | 25 → **38 °C** |
| Entrambi (la situazione di questi cinque anni) | 23-28 °C | 100% | 23-28 °C |

Di colpo tutto tornava:

*   **La pompa di calore produceva l'acqua per la curva del C1, quella del pavimento.** I radiatori del piano di sopra ricevevano acqua a 23-28 °C invece dei 35-40 °C previsti. Il piano di sopra scaldava male, e io compensavo alzando i set point.
*   **La valvola del pavimento puntava al set point dei radiatori, circa 37 °C**, che non poteva mai raggiungere con acqua a 28 °C. Restava quindi tutta aperta finché il piano di sopra chiedeva calore, e si chiudeva del tutto appena il piano di sopra era soddisfatto, **anche se il piano terra aveva freddo**.
*   È esattamente il comportamento che avevo segnalato cinque anni fa: in auto la valvola chiudeva e il pavimento smetteva di scaldare. "Non funzionava in automatico" perché **era comandata dal circuito sbagliato**. Il "di più" era in realtà il cuore della regolazione.

Un ultimo controllo mi ha convinto definitivamente più tardi in serata: una volta corretta la configurazione, con il C2 spento, **il Wilo del pavimento si è fermato**. Circolatore, valvola e sonda del pavimento sono tutti cablati sul C2.

### La correzione: niente da ricablare

Visto che il cablaggio era giusto, tutto si faceva nel comando. Claude mi ha fatto fotografare ogni schermata prima di cambiare qualsiasi cosa (per poter tornare indietro in cinque minuti), poi:

1.  **Temperatura massima dell'acqua del C2: 60 °C → 45 °C**, per prima. La pompa di calore stava per produrre acqua più calda per il piano di sopra, ed è questo limite a proteggere il pavimento.
2.  **Curve climatiche scambiate**: C1 per punti (radiatori), C2 per curva (pavimento).
3.  **Termostati**: i due termostati ambiente sono radio. Invece di scambiarli fisicamente, ho invertito i valori 1 e 2 nell'impostazione dell'identificativo circuito del comando radio. Test: cambio il set point sul termostato del piano di sopra, ed è il C1 a reagire.
4.  Le impostazioni della valvola (banda proporzionale, tempo di corsa) non sono cambiate: sono quelle di fabbrica.

Pochi minuti dopo:

| | Prima | Dopo |
|---|---|---|
| Set point acqua PdC | 23-28 °C | **41 °C** |
| Mandata / ritorno PdC | ~24 / 23 °C | **38 / 34 °C** |
| Valvola pavimento | segue il termostato del piano di sopra | segue il termostato del piano terra |
| Mandata pavimento | dipende dalla mia mano sulla maniglia | **27 °C**, misurati dalla sonda spostata sull'ottone |

Il piano di sopra riceve finalmente acqua a 40 °C. Il pavimento riceve acqua miscelata intorno ai 27 °C, quello che chiede la sua curva.

## Cosa resta da sistemare

Preferisco essere onesto: non è ancora tutto perfetto. Quando abbiamo rimesso la valvola in auto, abbiamo visto che **la posizione indicata dalla pompa di calore e quella reale della valvola non corrispondevano**. Per anni CSNet ha detto "100%" mentre la valvola, in auto, andava a fermarsi sul finecorsa chiuso. L'attuatore è di tipo "a tre punti": la pompa di calore gli dice "apri" o "chiudi" per un certo tempo, senza mai leggerne la posizione. La pista più probabile è un **attuatore che gira al contrario** (i fili di apertura e chiusura invertiti, o un selettore del senso di rotazione sbagliato), con in più una scala rosso/blu mal posizionata sulla maniglia.

È un lavoro di cinque minuti, a corrente staccata, una volta identificato il modello esatto. Nel frattempo la valvola è regolata perché il pavimento giri intorno ai 27 °C, e la nuova sonda mi permette di verificarlo in Home Assistant invece di scendere a guardare il termometro.

## Ne ha approfittato anche l'integrazione

Il pomeriggio ha fatto avanzare anche l'[integrazione CSNet](https://github.com/mmornati/home-assistant-csnet-home), con due nuove versioni pubblicate al volo:

*   **Rinominare una stanza non rompe più le entità.** Una volta rimessi a posto i circuiti, ho rinominato le zone in CSNet ("Salon" e "Bibliothèque" non volevano più dire niente). L'integrazione identificava ogni zona dal nome: tutte le entità sono diventate non disponibili. Ora sono identificate dall'ID stabile di CSNet, con una migrazione automatica del registro che conserva gli `entity_id` e il loro storico.
*   **La pressione era raddoppiata.** I 4,48 bar mostrati erano fisicamente impossibili su un circuito protetto da una valvola di sicurezza a 3 bar. Il mio manometro segnava circa 1,9 bar. Confrontando il valore grezzo di CSNet (224) con una vecchia issue di un altro utente che aveva esattamente lo stesso fattore 2, la conclusione era chiara: il valore è in centesimi di bar. L'integrazione ora mostra 2,24 bar.
*   **Un nuovo sensore: la temperatura dell'acqua del circuito 2.** CSNet la mandava già (`waterOutlet2Temp`), l'integrazione semplicemente non la usava. È la sonda che avevo appena spostato sull'ottone, ed è lei a dirmi che il pavimento è a 27 °C.

La versione 2.11.0 è stata pubblicata, installata tramite HACS e verificata sulla mia istanza nella stessa sessione, e una 2.11.1 è seguita per un avviso di deprecazione trovato nei log dopo il riavvio.

## Cosa mi porto a casa

Non sono un termotecnico. Cinque anni fa avevo un dubbio, ma nessun modo di difenderlo davanti a tecnici che mi dicevano che non era grave. Non sapevo che su una Hitachi la valvola miscelatrice appartiene per forza al circuito 2, non sapevo leggere una curva climatica, e non avrei mai pensato di spegnere un circuito alla volta guardando il set point dell'acqua per capire chi comanda cosa.

Questo pomeriggio avevo i dati (grazie a un'integrazione che mantengo da anni senza immaginare che un giorno sarebbe servita a questo), un telefono per fare le foto, e un modello capace di collegare un manuale Hitachi, una foto di tubi, una schermata del comando e una serie temporale in Home Assistant. I modelli migliorano in fretta, ed è in situazioni come questa che si vede di più: **con le informazioni giuste, un'IA non si limita a rispondere, ti rende capace di fare cose che da solo non avresti saputo fare**. Anche su un argomento di cui non sai nulla.

Cinque anni dopo l'installazione, la mia pompa di calore è finalmente configurata come è stata cablata. Era ora.

## Come è stato fatto

Due sessioni Claude Code con Opus 5.5, nel repository dell'integrazione CSNet, in un pomeriggio. La prima è partita dalla vista della pompa di calore in Home Assistant: Claude ha letto lo storico del circolatore in OpenObserve (l'MCP di Home Assistant non espone quel sensore), ha confermato che era letto correttamente, ha trovato il percorso del menu installatore e ha validato il passaggio a ΔT. La seconda ha ripreso quel contesto, analizzato le mie foto (il gruppo del pavimento, le curve climatiche, i circolatori, le schermate del comando, l'attuatore), cercato il ruolo dei circuiti nei manuali Hitachi, proposto e letto in diretta i test di spegnimento dei circuiti, poi guidato lo scambio di configurazione schermata per schermata. Ha anche scritto le correzioni dell'integrazione con i loro test, aperto e fatto il merge delle PR una volta verde la CI, pubblicato le versioni, le ha installate tramite HACS nel browser integrato dopo che avevo fatto il login, e ha rimesso in ordine gli ID delle entità perché nessuna dashboard si rompesse. La mia parte: le foto, le mani in locale tecnico, i pulsanti del comando e le domande. Questo articolo è stato scritto in un'altra sessione, a partire da quelle due trascrizioni.
