---
title: 'Preparare un ultra-trail con ai-running-coach: dalla pianificazione al traguardo'
categories:
- ai-coding-agents
tags:
- ai
- agenti
- trail
- running
- garmin
- mcp
- ultra-trail
date: '2026-09-19T07:41:00.000000+00:00'
slug: preparare-un-ultra-trail-con-ai-running-coach
description: Come ho preparato l'Ultra 110 km Trail Côte d'Opale con ai-running-coach, un progetto open-source di agenti IA collegati a Garmin — pianificazione per periodi, nutrizione, analisi dei dati e strategia di gara.
---

Il 13 settembre 2026, alle 02h00 di notte, mi sono messo in fila sulla linea di partenza dell'**Ultra 110 km Trail Côte d'Opale** a Wimereux. 15h26 più tardi, tagliavo il traguardo. Tra questi due momenti non c'è stato solo allenamento: ci sono stati mesi di **pianificazione, analisi e aggiustamenti** — e una buona parte di questo lavoro è stata fatta con l'aiuto di agenti IA.

Non voglio raccontarvi la mia gara né i miei allenamenti: voglio usare tutti questi dati per mostrarvi come una **pianificazione basata su dati analizzati dall'IA** possa aiutare a preparare bene una gara, qualunque essa sia.

In questo articolo vi racconto come ho usato [ai-running-coach](https://github.com/mmornati/ai-running-coach), un progetto open-source che ho creato, per preparare questo obiettivo: il piano di allenamento per periodi, la nutrizione, l'analisi dei miei dati Garmin e la strategia di gara fino al giorno X.

## Il progetto: agenti IA specializzati, collegati a Garmin

[ai-running-coach](https://github.com/mmornati/ai-running-coach) è un progetto **100% in francese** che fornisce agenti IA e skill per aiutare i runner a preparare un obiettivo (gara, trail, ultra) direttamente nel loro IDE preferito (Claude Code, OpenCode, Gemini CLI, Cursor, Windsurf).

Il progetto si basa su **4 agenti specializzati**:

| Agente | Ruolo |
|:-------|:------|
| 🧠 **coach** | Pianifica l'allenamento per periodi, aggiusta in base ai vincoli (meteo, salute, vita privata) |
| 🗺️ **course-strategist** | Analizza i percorsi (GPX), definisce i ritmi e la strategia di gara |
| 🩺 **medical** | Analizza i dati di salute (HRV, FC a riposo, sonno, readiness) e il meteo |
| 🥗 **nutritionist** | Costruisce i piani nutrizionali per allenamento e gara |

E **8 skill**: analisi GPX, confronto percorsi, pianificazione Garmin, meteo, analisi delle sessioni, ecc. L'accesso a **Garmin Connect** avviene tramite `garmin-mcp`, con una lista bianca di strumenti.

L'installazione avviene con un solo comando:

```bash
git clone https://github.com/mmornati/ai-running-coach.git
cd ai-running-coach
./install.sh
```

Lo script configura automaticamente l'accesso a Garmin, le cartelle di lavoro (`activities/`, `medical/`, `nutrition/`, `planning/`, `rapports/`, `resources/`) e l'integrazione con il vostro IDE.

Tutto il lavoro si svolge in **markdown, in francese**, in uno spazio di lavoro strutturato. Ogni sessione, ogni report, ogni piano è un file che si può rileggere, versionare e condividere. È esattamente quello che ho fatto per 8 mesi.

## L'obiettivo: l'Ultra 110 km Trail Côte d'Opale

Il mio obiettivo era chiaro: **109,8 km, +1768 m di dislivello, partenza alle 02h00, sul litorale della Côte d'Opale** (sabbia, dune, scogliere, vento). Un percorso impegnativo, con barriere orarie da rispettare:

| Punto | Km | Barriera |
|:------|:---|:---------|
| Châtelet | 42,4 | 09h00 |
| Hervelinghen | 77,6 | 14h30 |
| Cap Gris-Nez | 94,1 | 17h00 |
| Arrivo | 109,8 | 19h35 |

Con il coach abbiamo definito un **obiettivo realistico di 15h00** (ritmo medio 8:12/km), uno scenario ambizioso a 12h49 e uno scenario di sicurezza a 16h00. La regola cardiaca era semplice: **mai sopra i 140 bpm**, con un target di 116-133 bpm (Z2).

## Il piano di allenamento per periodi

Il piano è stato costruito **per periodi**, dall'inizio dell'anno fino al giorno X, con aggiustamenti permanenti basati sui miei vincoli personali, sul meteo e sul mio stato di salute.

### Le fasi finali (S1 → S5)

Le ultime 5 settimane illustrano bene la logica:

| Fase | Periodo | Contenuto | Volume |
|:-----|:--------|:----------|:-------|
| **S1** | 10-16/08 | Uscita lunga 48 km (Vicere-Mara-Sanprimo) | ~55 km |
| **S2** | 17-23/08 | Volume massimo, uscite sulle dune | ~72 km |
| **S3** | 24-30/08 | Vacanze estive + **PICCO 30-40 km** (test nutrizione) | ~58 km |
| **S4** | 31/08-06/09 | Taper -40% | ~42 km |
| **S5** | 07-13/09 | Taper -60/-70% + gara | ~30 km |

![Volume settimanale per fase](/images/preparer-un-ultra-trail-avec-ai-running-coach/07-volume-entrainement.png)

### Gli aggiustamenti in corso d'opera

Ciò che fa la differenza è la capacità di **aggiustare**. Alcuni esempi concreti:

- **Malattia a metà giugno**: 14 giorni senza allenamento. Il piano è stato riequilibrato, senza panico, spostando i picchi.
- **Vacanze estive (S3)**: il coach ha integrato il caldo come vincolo, con uscite più corte al mattino e camminate nel pomeriggio.
- **Meteo**: ogni uscita lunga era preceduta da un'analisi meteo (tramite la skill dedicata), con finestre di partenza aggiustate.
- **L'uscita da 48 km tagliata a 38 km**: il 10/08, l'uscita lunga prevista a 48 km è stata ridotta a 38,5 km. Perché? L'analisi del recupero (readiness, HRV) mostrava che il corpo non era pronto. Risultato: un'uscita di 38,5 km / +1849 m in 6h09 a FC 133 — **9 bpm in meno rispetto alla stessa uscita del 2024**. La prova che ascoltare i dati paga.

### Non solo corsa

Il piano non era solo running. I dati Garmin mostrano una vera varietà:

- **Trail**: le uscite lunghe (38,5 km Albavilla, 30,9 km Tournai, 30,5 km Tournai PICCO)
- **Escursionismo**: le Cinque Terre in vacanza (10,4 km, 3h30) — volume in scioltezza
- **Camminata**: in vacanza, recupero attivo
- **Ciclismo indoor**: 2 sessioni a giugno-luglio
- **Rinforzo**: circuito forza fase 3, forza leggera in taper

Questa varietà è un vero plus per un ultra: mantiene il volume senza martellare le articolazioni.

## La nutrizione: testata, poi pianificata al grammo

La nutrizione è stata un asse fondamentale. L'approccio: **testare durante l'allenamento, poi pianificare con precisione per il giorno X**.

### Il test del 30/08 (uscita picco)

Il 30/08, durante l'uscita picco di 30,5 km, ho testato il protocollo nutrizionale completo: prodotti, rotazioni, timing. È ciò che ha permesso di validare il piano per la gara.

![Riepilogo Garmin dell'uscita del 30/08](/images/preparer-un-ultra-trail-avec-ai-running-coach/08-garmin-sortie-30-08.png)

*Riepilogo Garmin dell'uscita picco: 30,53 km, 3h46, 1150 m di dislivello, FC media 129 bpm, 2340 kcal — il protocollo nutrizionale completo testato in condizioni reali.*

### Il piano del giorno X

Il piano nutrizionale finale (v3) era di una precisione notevole:

| Parametro | Valore |
|:----------|:-------|
| **Dispendio stimato** | ~8.500-9.500 kcal |
| **Assunzione prevista** | ~4.300-4.800 kcal (290-320 kcal/h) |
| **Carboidrati** | 70-80 g/h (doppio trasportatore: glucosio + fruttosio) |
| **Idratazione** | 500-750 ml/h, ~8,5-10 L in totale |
| **Sodio** | 500-700 mg/L (Aptonia Electrolytes) |
| **Costo totale** | ~81 € |

I prodotti erano scelti con precisione: **gel Baouw** (fruttosio), **paste di frutta Aptonia** (glucosio), **puree salate Baouw** (sodio + anti-nausea), **barrette crunchy** a fine gara. Il tutto per ~1,9 kg di cibo nello zaino.

Un punto importante: il protocollo è stato adattato per **minimizzare l'apporto di potassio** durante la gara (protocollo low-K), con scelte precise: elettroliti Aptonia al limone, composte pera-mela-menta, banane e datteri banditi dai ristori, sostituiti da arance. Questo genere di dettaglio è esattamente ciò che un agente nutrizionista può seguire e verificare.

![Piano nutrizionale del giorno X](/images/preparer-un-ultra-trail-avec-ai-running-coach/09-plan-nutrition-jour-j.png)

*Il piano nutrizionale ora per ora: prodotto, carboidrati, cumulativo e azione a ogni ristoro — con i promemoria per riempire le borracce e il protocollo low-K (arancia al posto di banana/dattero).*

## L'analisi del mio stato tramite la sync Garmin

Ogni mattina, l'agente **medical** analizzava i miei dati Garmin: HRV, FC a riposo, sonno, readiness, ACWR, VO2max. Questi report guidavano le decisioni di allenamento.

### La tendenza VO2max

![Tendenza VO2max](/images/preparer-un-ultra-trail-avec-ai-running-coach/05-vo2max-tendance.png)

Il VO2max è passato da 51 a 53 ml/kg/min in agosto, poi si è stabilizzato a 52 — una bella progressione nel periodo.

### Zone cardiache ricalcolate, non quelle di Garmin

Un punto interessante: le zone usate per guidare l'allenamento **non erano quelle di Garmin/Strava**. In aprile, l'agente coach ha ricalcolato le mie zone a partire dai miei dati (FCmax 177, FC a riposo 40-45) con il **metodo di Karvonen** (basato sulla riserva cardiaca), diverso dal metodo per percentuale di FCmax usato di default.

| Zona | Garmin/Strava (% FCmax) | Karvonen (% riserva) |
|:-----|:------------------------|:---------------------|
| **Z1** | <115 | 109-122 |
| **Z2** | 116-143 | **122-136** |
| **Z3** | 144-158 | 136-150 |
| **Z4** | 159-172 | 150-163 |
| **Z5** | >173 | 163-177 |

La differenza è sottile ma importante per un ultra: il metodo Karvonen integra la FC a riposo, quindi le zone sono **più personalizzate** della semplice percentuale di FCmax. Concretamente, il limite alto della Z2 passava da 143 bpm (Garmin) a **133-136 bpm** — ed è questo valore più severo che ha guidato i miei footing lunghi e la regola «mai sopra i 140 bpm» il giorno X. Il risultato parla da solo: 74,8% del tempo in Z1+Z2 durante la gara.

> 💡 **Perché è diverso, e quale è meglio?** Il metodo % FCmax è semplice e universale, ma ignora la FC a riposo: due runner con la stessa FCmax ma FC a riposo molto diverse avranno le stesse zone, anche se la loro fisiologia differisce. Il metodo Karvonen (FC riserva = FCmax − FC a riposo) è più preciso per gli atleti allenati, la cui FC a riposo è bassa (40-45 qui) — è per questo che le zone Karvonen sono più basse e più severe. L'interesse di rifare questo calcolo: è **gratuito, basato sui tuoi dati**, ed evita di allenarsi troppo duramente in Z2 «apparente» quando si è già in Z3 fisiologica. Il limite: resta una stima — un test di soglia lattica (o un test sul campo tipo 30 min) affinerebbe ancora i valori.

### Il giorno X: un cardio controllato

Il giorno della gara, l'analisi dei dati ha confermato una **gestione cardiaca impeccabile**:

![Frequenza cardiaca sulla gara del 13/09](/images/preparer-un-ultra-trail-avec-ai-running-coach/10-fc-course-13-09.png)

*La traccia cardiaca delle 15h26 di gara: un plateau globalmente stabile tra 115 e 135 bpm, qualche picco isolato sopra i 140 bpm (salite ripide, rilanci), e soprattutto nessuna deriva al rialzo nel tempo — il segno che il ritmo era sostenibile.*

![Ripartizione per zone cardiache](/images/preparer-un-ultra-trail-avec-ai-running-coach/04-zones-cardiaques.png)

- **74,8% del tempo in Z1+Z2** (≤133 bpm), 63% sotto i 130 bpm
- **FC media: 125 bpm** su 15h26
- **Nessuna deriva cardiaca**: la FC media scende nel corso dei blocchi (126 → 115 bpm), segno di una gestione sana

![FC media per blocco di 10 km](/images/preparer-un-ultra-trail-avec-ai-running-coach/01-fc-par-10km.png)

## La pianificazione della gara

### L'analisi GPX

Per ogni percorso importante, l'agente **course-strategist** analizzava il GPX: distanza, dislivello, profilo, pendenze, terreno. Un esempio: la valutazione del percorso Mont-de-l'Enclus per l'uscita picco del 30/08 — 35,6 km analizzati, verdetto «troppo lungo», **taglio consigliato a 30-32 km**, con il punto di taglio esatto (km 30,1) e il ritorno su strada. È questo livello di dettaglio che rende lo strumento utile.

### Il piano ritmi e ristori (J-1)

La vigilia, il piano finale era pronto: una tabella per segmento con ritmi target, passaggi realistici e barriere, più un'**autovalutazione a ogni ristoro** («dove dovrei essere?»).

| Segmento | Km | Ritmo target | Passaggio realistico | Barriera |
|:---------|:---|:-------------|:---------------------|:---------|
| Partenza → Ausques | 26,7 | 7:52/km | 05:30 | — |
| Ausques → Châtelet | 15,7 | 7:58/km | 07:35 | 09h00 |
| Châtelet → Sangatte | 14,8 | 7:46/km | 09:30 | — |
| Sangatte → Hervelinghen | 20,4 | 8:05/km | 12:15 | 14h30 |
| Hervelinghen → Cap Gris-Nez | 16,5 | 8:11/km | 14:30 | 17h00 |
| Cap Gris-Nez → Arrivo | 15,7 | 9:33/km | 17:00 | 19h35 |

### Il meteo, fino alla vigilia

Il meteo è stato seguito da J-7 a J-1, con rivalidazioni successive: J-3 (Open-Meteo, 🟠 pioggia 12,8 mm) → J-2 (wttr.in, 🟡) → **vigilia (🟡 confermato: partenza asciutta, picco di pioggia 0,5 mm alle 09h, raffiche 43-44 km/h in mattinata)**. La decisione finale: giacca impermeabile leggera, frontale obbligatoria (luna al 4%), ziploc impermeabili per la nutrizione.

### Il materiale: 2 zaini, un drop bag

Il piano materiale prevedeva un **drop bag a Hervelinghen** (km 77,6) con il rifornimento della seconda metà, e una capacità d'acqua portata di **2,5 L** (2 borracce da 500 ml + 1 borraccia da 1,5 L) — il tutto con il materiale esistente, senza acquisti.

## Il giorno X: previsto vs reale

Il bilancio è raccontato dal confronto previsione vs realtà:

![Riepilogo Garmin della gara del 13/09: 109,71 km, 15:26:51, 8:27/km, D+ 1.992 m](/images/preparer-un-ultra-trail-avec-ai-running-coach/11-resume-course-13-09.png)

*Il riepilogo ufficiale della gara: 109,71 km, 15h26:51, ritmo medio 8:27/km, D+ 1.992 m, 7.955 calorie — con il tracciato del percorso sulla Côte d'Opale, da Wimereux fino a sud di Boulogne-sur-Mer e ritorno, colorato dal più lento (blu) al più veloce (rosso).*

![Tempi di passaggio: piano vs reale](/images/preparer-un-ultra-trail-avec-ai-running-coach/06-prevision-vs-reel.png)

| | Tempo | Arrivo | Ritmo |
|:--|:--|:--|:--|
| 🚀 Ambizioso | 12h49 | ~14h49 | 7:00/km |
| 🟡 **Piano realistico** | **15h00** | ~17:00 | 8:12/km |
| 📍 **REALE** | **15h26** | **17:26** | 8:27/km |
| 🟢 Sicuro | 16h00 | ~18:00 | 8:44/km |

**+26 minuti rispetto al target (+3%)** — un'esecuzione giudicata molto solida. Perché questo scarto?

1. **Il percorso era più duro del previsto**: dislivello reale di **1992 m vs 1768 m** (+13%), circa 10-15 min.
2. **Camminata forzata nelle salite** (km 50-51, 61, 74, 77).
3. **Un episodio gastrointestinale isolato** al km 48,6 (~3 min).
4. **Pioggia e raffiche verso le 09h** sul segmento Châtelet → Sangatte.

Ma soprattutto: **tutte le barriere sono state superate con margini molto ampi** (fino a +2h09 all'arrivo), il cardio è rimasto impeccabile, e il **finale è stato solido**: ultimo segmento a -10 min rispetto al piano, nonostante gli ultimi 3 km di dune in camminata forzata.

![Ritmo per blocco di 10 km](/images/preparer-un-ultra-trail-avec-ai-running-coach/02-allure-par-10km.png)

## Il recupero, seguito giorno per giorno

Dopo la gara, l'agente medical ha continuato a seguire il recupero:

![HRV: crollo e risalita post-gara](/images/preparer-un-ultra-trail-avec-ai-running-coach/03-hrv-recuperation.png)

- **J+1**: readiness 1/100, tempo di recupero stimato a 96h, HRV crollata (30 ms), sonno 5,1h (score 28) — il corpo ha dato tutto.
- **J+3**: ancora in recupero, HRV che risale progressivamente.
- **J+5**: readiness 61/100, sonno 7,25h (score 86), HRV 69 ms — **primo footing facile confermato**.

L'HRR (heart rate recovery) di 7 bpm a fine gara era il segnale atteso di uno sforzo massimale — normale dopo 15h26 di sforzo.

## Cosa mi porto a casa

Preparare un ultra-trail è un lavoro di **pianificazione, ascolto e aggiustamento permanente**. Cosa mi ha dato ai-running-coach:

1. **Una struttura**: ogni decisione documentata, ogni piano versionato, in markdown.
2. **Una disciplina di analisi**: i dati Garmin (HRV, readiness, FC, VO2max) trasformati in decisioni concrete.
3. **Una precisione chirurgica**: dal punto di taglio di un GPX al grammo di carboidrati all'ora.
4. **Una serenità il giorno X**: quando tutto è pianificato e testato, resta solo da eseguire.

Il risultato: **15h26 per 109,7 km e +1992 m**, un cardio controllato, nessuna barriera minacciata, e un recupero seguito e controllato. Non posso garantire che l'IA vi faccia diventare finisher di un ultra — ma può sicuramente aiutarvi ad arrivarci.

Il progetto è open-source e disponibile su [GitHub](https://github.com/mmornati/ai-running-coach), con la [documentazione](https://mmornati.github.io/ai-running-coach/) e uno script di installazione in un solo comando. Se state preparando un obiettivo trail o ultra, non esitate a provarlo — e a contribuire!