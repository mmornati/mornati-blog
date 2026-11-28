---
title: "Tapparelle Velux solari e gelo: mai forzare, chiudere prima, aprire dopo"
categories:
- smart-home
tags:
- home-assistant
- velux
- cover
- frost
- automation
- homekit
- ai
- prompt
date: '2026-12-03T06:00:00.000000+00:00'
draft: false
slug: velux-solari-e-gelo-mai-forzare-e-verificarlo-nei-dati
translationKey: velux-solar-shutters-and-frost
cover: cover.jpg
showHero: true
keyfigure: '17 chiusure senza blocchi in 4 sere di gelo'
description: "Una sera di novembre, tre delle mie tapparelle Velux solari si sono rifiutate di chiudersi: le guide erano gelate. Velux dice di non forzare mai. Home Assistant non vede il blocco, quindi gli ho insegnato a riconoscerlo, a chiudere prima del gelo e ad aprire dopo. Cinque giorni di dati veri, cosa funziona, cosa non funziona ancora, e una ricetta da dare al vostro assistente IA per fare la stessa cosa a casa vostra."
summary: "Tre regole per le tapparelle solari da tetto in inverno: chiudere una sola volta al calare della notte quando arriva il gelo, rimandare l'apertura del mattino, non rilanciare mai una tapparella che si è rifiutata. I numeri dal 23 al 28 novembre: 17 chiusure senza un solo rifiuto, 14 aperture rimandate riuscite, 3 rifiuti, tutti sulla falda nord. E perché non pubblico più il mio YAML, ma una ricetta per l'IA."
---

La sera del 23 novembre, alle 20:42, la casa ha chiuso le tapparelle delle camere come ogni sera. Sul tetto c'erano −1,2 °C. **Una tapparella si è chiusa. Le altre tre hanno fatto venticinque secondi di rumore, poi sono tornate esattamente dov'erano: tutte aperte.**

Ho fatto quello che fanno tutti. Ho riprovato. Quattro volte, tra le 20:44 e le 21:00. Altri quattro rifiuti.

Era la cosa peggiore da fare.

## Cosa dice Velux

Le mie cinque finestre da tetto hanno tapparelle solari Velux (la gamma SSL): un piccolo pannello, una batteria, un motore, nessun filo. Sono comandate dal gateway VELUX ACTIVE, che Home Assistant vede attraverso HomeKit.

Sul gelo il costruttore è chiaro, e il suo manuale pure:

*   dopo un periodo umido (pioggia, nebbia, o semplicemente l'aria di una camera che si arieggia), **la condensa si deposita sulle guide e sulle lamelle, poi gela**;
*   il motore ha una **protezione da sovraccarico**: se sente una resistenza anomala, si ferma per non rovinare il meccanismo ([manuale della tapparella SSL](https://www.bauhaus.ch/product-documents/velux_ssl_fr.pdf), in francese);
*   non bisogna **mai forzare**, e bisogna aspettare il disgelo. L'assistenza Velux consiglia al massimo di socchiudere la finestra, così il calore della stanza aiuta un po'.

Il ghiaccio può essere nelle guide e nel cassonetto senza che si veda da fuori. E secondo la scheda di un rivenditore, il motore resta bloccato una decina di minuti dopo un rifiuto: i miei quattro tentativi non avevano nessuna possibilità, hanno solo affaticato il meccanismo.

La batteria non c'entrava niente. Le tapparelle si erano mosse normalmente dopo diversi giorni grigi, e si sono rifiutate tutte proprio la prima sera di gelo.

## Cosa Home Assistant non vede

L'app Velux mostra «bloccato». Home Assistant, invece, non riceve niente. Ho verificato cosa pubblica il gateway in HomeKit per ogni tapparella: la posizione richiesta, la posizione attuale e lo stato del movimento. Nessun guasto, nessun ostacolo rilevato.

Ma il rifiuto lascia una **firma molto netta** nello storico:

| | Chiusura vera | Rifiuto |
|---|---|---|
| Stato | `closing` → `closed` | `closing` → `open` |
| Posizione | 100 → 34 → 0 | 100 → 100 |
| Durata | 13 secondi | da 20 a 60 secondi |

Una tapparella che parte, poi torna dov'era senza essersi mossa di più del 10 %, è una tapparella bloccata. Il rilevatore è tutto qui. Rieseguito su dieci giorni di storico, ha ritrovato i 7 rifiuti del 23 novembre senza un solo falso allarme sugli altri 55 movimenti.

## Tre regole

**1. Chiudere prima del gelo, una sola volta.** Appena fuori è buio (non si perde nessuna luce), se il gelo sta arrivando: 2 °C o meno, oppure 5 °C o meno con una minima prevista a 0 °C nella notte. Un comando, una volta per sera, e poi basta.

**2. Rimandare l'apertura del mattino.** Alle 7:15, nei giorni di scuola, gela ancora. L'apertura non viene inviata, viene messa in attesa. Parte una sola volta, più tardi, quando ci sono più di 1 °C, oppure già a 0 °C se è uscito il sole. Alle 15:00, se non è stato possibile fare niente, l'attesa viene abbandonata e ricevo un messaggio: le tapparelle restano chiuse.

**3. Non rilanciare mai.** Ogni movimento viene osservato. Un rifiuto fa scattare un avviso («gelo probabile, non riprovare»), e la tapparella viene segnata come bloccata per 12 ore: nessuna automazione le manderà un comando. Se qualcuno la rilancia a mano entro dieci minuti, un secondo messaggio ricorda perché è meglio aspettare.

E l'umidità? Fisicamente conta: senza acqua, niente ghiaccio. Ma da me, a novembre, è tra l'85 e il 96 % **tutte le sere**, comprese quelle in cui tutto si chiude senza problemi. Non distingue niente. Viene quindi annotata a ogni movimento, insieme al punto di rugiada, ma non fa parte della regola. A decidere è la temperatura.

## Cinque giorni di dati veri

{{< chart >}}
type: 'line',
data: {
  labels: ["23 11h", "23 12h", "23 13h", "23 14h", "23 15h", "23 16h", "23 17h", "23 18h", "23 19h", "23 20h", "23 21h", "23 22h", "23 23h", "24 00h", "24 01h", "24 02h", "24 03h", "24 04h", "24 05h", "24 06h", "24 07h", "24 08h", "24 09h", "24 10h", "24 11h", "24 12h", "24 13h", "24 14h", "24 15h", "24 16h", "24 17h", "24 18h", "24 19h", "24 20h", "24 21h", "24 22h", "24 23h", "25 00h", "25 01h", "25 02h", "25 03h", "25 04h", "25 05h", "25 06h", "25 07h", "25 08h", "25 09h", "25 10h", "25 11h", "25 12h", "25 13h", "25 14h", "25 15h", "25 16h", "25 17h", "25 18h", "25 19h", "25 20h", "25 21h", "25 22h", "25 23h", "26 00h", "26 01h", "26 02h", "26 03h", "26 04h", "26 05h", "26 06h", "26 07h", "26 08h", "26 09h", "26 10h", "26 11h", "26 12h", "26 13h", "26 14h", "26 15h", "26 16h", "26 17h", "26 18h", "26 19h", "26 20h", "26 21h", "26 22h", "26 23h", "27 00h", "27 01h", "27 02h", "27 03h", "27 04h", "27 05h", "27 06h", "27 07h", "27 08h", "27 09h", "27 10h", "27 11h", "27 12h", "27 13h", "27 14h", "27 15h", "27 16h", "27 17h", "27 18h", "27 19h", "27 20h", "27 21h", "27 22h", "27 23h", "28 00h", "28 01h", "28 02h", "28 03h", "28 04h", "28 05h", "28 06h", "28 07h", "28 08h", "28 09h"],
  datasets: [
    { label: "Temperatura esterna (°C)", data: [2.8, 4.1, 5.0, 5.8, 4.6, 3.0, 1.4, 0.2, -0.5, -1.2, -1.5, -1.8, -1.9, -2.4, -2.6, -2.7, -2.9, -2.9, -3.1, -3.1, -2.9, -2.9, -2.5, -0.9, 0.8, 2.4, 3.9, 5.2, 4.3, 2.9, 1.7, 1.0, 0.5, 0.1, -0.3, -0.7, -0.9, -1.0, -1.1, -1.1, -1.2, -1.5, -1.8, -1.7, -1.8, -1.6, -1.6, -0.5, 1.4, 1.9, 1.6, 1.4, 1.5, 1.3, 1.1, 1.1, 1.1, 1.4, 1.3, 1.4, 1.3, 1.2, 1.0, 0.8, 0.6, -0.3, -1.1, -1.6, -1.9, -2.2, -2.3, -1.1, 0.2, 1.3, 2.3, 3.0, 1.9, 0.3, -0.9, -1.4, -1.7, -2.2, -2.7, -3.1, -2.6, -1.8, -1.2, -1.0, -0.9, -0.9, -2.3, -3.2, -3.7, -4.0, -4.0, -1.8, 0.7, 2.6, 3.8, 4.5, 3.3, 1.6, 0.0, -1.4, -1.6, -1.8, -2.2, -2.9, -3.1, -2.6, -2.2, -2.1, -2.3, -2.4, -3.2, -3.2, -3.0, -2.8, -2.4], borderColor: '#2b46d6', backgroundColor: '#2b46d6', pointRadius: 0, borderWidth: 2, tension: 0.3 },
    { label: "Chiusura riuscita", data: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 2.0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 1.2, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, -0.5, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.9, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], showLine: false, pointStyle: 'triangle', rotation: 180, pointRadius: 8, borderColor: '#15171c', backgroundColor: '#7fe3cf' },
    { label: "Apertura riuscita", data: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.4, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.1, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.1, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, -2.5], showLine: false, pointStyle: 'triangle', pointRadius: 8, borderColor: '#15171c', backgroundColor: '#ffe14a' },
    { label: "Rifiuto (tapparella bloccata)", data: [null, null, null, null, null, null, null, null, null, -1.2, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.1, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.1, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, -2.5], showLine: false, pointStyle: 'crossRot', pointRadius: 9, borderWidth: 3, borderColor: '#e4002b', backgroundColor: '#e4002b' }
  ]
},
options: {
  scales: { x: { ticks: { maxTicksLimit: 12 } }, y: { suggestedMin: -5, suggestedMax: 6 } },
  plugins: { legend: { labels: { usePointStyle: true } } }
}
{{< /chart >}}

| | Quando | Fuori | Risultato |
|---|---|---|---|
| 23 nov., chiusura abituale | 20:42 | −1,2 °C | **3 tapparelle su 4 si rifiutano**, poi 4 tentativi rifiutati |
| Dal 24 al 27 nov., chiusura prima del gelo | dalle 16:50 alle 17:10 | da −0,5 a 2,0 °C | **17 chiusure, 0 rifiuti** |
| Dal 24 al 27 nov., apertura rimandata | dalle 11:00 alle 11:20 | da 0,0 a 0,4 °C | 14 aperture, **2 rifiuti** |
| 28 nov., apertura a mano | 9:23 | −2,5 °C | 4 aperture, **1 rifiuto** |

La sera il problema è sparito. Eppure le notti sono scese fino a −4,5 °C, ma le tapparelle erano già giù da ore.

Il mattino è meno netto, ed è la parte interessante.

## La mattina del 28 novembre

Sabato, niente scuola, niente apertura automatica alle 7:15. Alle 9:23 qualcuno apre le cinque tapparelle a mano. Ci sono −2,5 °C. Secondo la mia regola, è troppo presto di tre gradi e mezzo.

**Quattro tapparelle si aprono senza fare storie. La quinta si rifiuta.** L'avviso arriva entro un minuto, nessuno la rilancia, è rimasta chiusa.

Messo accanto ai due rifiuti della settimana, comincia a delinearsi qualcosa:

*   le due aperture rifiutate all'automazione sono avvenute a **0,1 °C**, appena sopra la mia soglia «sole»;
*   i **tre rifiuti in apertura vengono dalle stesse due tapparelle**, quelle della falda nord-nord-est, dal lato opposto ai pannelli solari. Al mattino non vedono il sole;
*   le tapparelle della falda soleggiata, invece, si sono aperte a −2,5 °C.

La mia regola tratta le cinque tapparelle allo stesso modo, con un sensore di luce messo dal lato del sole. Per la falda nord non dice niente. La temperatura dell'aria non basta: quello che conta è cosa ha ricevuto il tetto.

## La data che dice dove cercare

La cosa che preferisco di questa automazione non è la regola. È il registro.

Ogni movimento di una tapparella produce un evento datato: quale tapparella, in che verso, riuscito o rifiutato, la temperatura, l'umidità, il punto di rugiada. **Quando una tapparella si blocca, non ho un vago ricordo («mi pare che si sia inceppata questa settimana»), ho una data e un'ora.** E con una data si sa esattamente dove andare a guardare nello storico: la luce in quel momento, la temperatura un'ora prima, cosa hanno fatto le altre tapparelle nello stesso secondo.

È così che sono venuti fuori i tre punti del paragrafo precedente: non ragionandoci sopra, ma rileggendo cinque giorni di eventi. Ed è questo che permette di correggere gli script sulla base dei fatti. Le prossime modifiche sono già in corso: una soglia di apertura più prudente, una condizione diversa per la falda nord, e una domanda su cui non ho ancora deciso (serve un secondo tentativo, uno solo, molto più tardi, per una tapparella rimasta chiusa?).

Questo registro serve anche a [Jev, il modello decisionale](/it/jev-home-assistant-un-modello-decisionale-per-le-mie-automazioni/) che interrogo in parallelo alle mie regole. Per ora osserva soltanto: con una sola sera di incidente in memoria, non può saperne più della regola. Ne riparleremo a fine inverno.

## Perché non pubblico più il mio YAML

Per anni ho incollato il codice delle mie automazioni negli articoli, [come per le tapparelle e il caldo](/homeassistant-close-cover-to-control-the-home-temperature-v2/) (in inglese). Non lo faccio più, e questa automazione mostra bene perché: 470 righe, piene di nomi di entità che esistono solo a casa mia, di soglie regolate per il mio tetto, di un sensore di luce che guarda la mia terrazza. Copiarvele non vi farebbe fare un passo avanti. Bisognerebbe riscrivere tutto.

Quello che si porta da una casa all'altra non è il codice. Sono **l'intenzione, le regole, i paletti e i casi andati male**. E oggi un assistente IA sa scrivere molto bene un'automazione Home Assistant partendo da lì, soprattutto se può guardare i vostri dispositivi.

Ecco quindi la ricetta di questo articolo. Datela al vostro assistente (Claude, ChatGPT, quello che usate), meglio se collegato al vostro Home Assistant. Gli chiede di partire dalle vostre tapparelle e dai vostri sensori, non dai miei, e contiene i miei casi reali come test.

{{< ai-prompt >}}

Due consigli. Lasciate che l'assistente vi faccia le sue domande prima di scrivere qualsiasi cosa: è lì che il vostro impianto entra nell'automazione. E tenete il registro: sarà lui a dirvi, tra tre settimane, quale soglia era sbagliata.

## Come è stato fatto

L'automazione è stata progettata la sera stessa del 23 novembre, in una sessione Claude Code sul repository della mia configurazione Home Assistant: lettura dello storico dei dieci giorni precedenti, ricerca di cosa dice Velux, un piano con quattro domande per me, poi il codice e un test che riesegue gli stati reali. Questo articolo è stato scritto cinque giorni dopo, in un'altra sessione, che ha riletto lo storico di produzione (gli eventi di ogni movimento, le temperature ora per ora) per ricavarne i numeri qui sopra. È questa rilettura che ha fatto emergere la falda nord, e una terza sessione sta ora correggendo le regole. La mia parte: i tentativi inutili della prima sera, le risposte alle domande e l'orientamento del tetto.
