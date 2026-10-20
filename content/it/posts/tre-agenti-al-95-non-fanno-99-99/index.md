---
title: "Tre agenti al 95% non fanno il 99,99%: la matematica del chiedere due volte"
categories:
- ai-coding-agents
tags:
- ai
- ai-agent
- code-review
- llm
- statistics
- software-engineering
date: '2026-10-22T16:00:00.000000+00:00'
draft: false
slug: tre-agenti-al-95-non-fanno-99-99
translationKey: shared-blind-spots
description: Far girare lo stesso compito su più esecuzioni di un LLM, su più modelli o su un generatore più un revisore dà davvero codice migliore di una sola esecuzione. Ma non di quell'1 - 0,05³ che promette ogni presentazione multi-agente. Cosa dice davvero la probabilità, cosa hanno misurato 40 anni di programmazione N-version e due repliche del 2026, e come si confrontano i tassi di difetti umani con i modelli di un anno fa e di oggi.
summary: Tre agenti al 95% ciascuno dovrebbero dare il 99,9875%, se sbagliano in modo indipendente e se sai riconoscere la risposta giusta. Nessuna delle due cose è vera. Con un voto e una difficoltà realistica dei compiti, gli stessi tre agenti arrivano intorno al 96%. Perché, cosa dicono i dati sul mescolare famiglie di modelli e revisori, e cosa sappiamo davvero dei tassi di difetti umani dagli anni '80 a confronto con i modelli di ottobre 2025 e ottobre 2026.
---

Qualche settimana fa ho fatto a un chatbot una domanda semplice: se un agente di programmazione porta a termine un compito correttamente il 95% delle volte, quanto spesso ci riescono tre agenti? La risposta è arrivata in una riga, con molta sicurezza:

```text
1 - 0.05 × 0.05 × 0.05 = 99.9875%
```

È il numero dietro ogni presentazione del tipo "usa più agenti", ed è il numero che avevo in testa quando ho cominciato a usare un secondo modello per fare la review delle pull request del primo. Volevo trasformarlo in un progetto, con benchmark, chiamate API e un budget. Prima di spendere i soldi, ho controllato cosa c'è già online. E la maggior parte della risposta c'è già: in un rapporto della NASA del 1985, in un famoso esperimento del 1986 e in due paper pubblicati quest'estate.

Questo articolo è quella risposta. In breve: **sì, più esecuzioni, più modelli e un controllo indipendente aiutano tutti, e la matematica spiega perché. Ma aiutano molto meno di quanto dica la formula ingenua, e il motivo è lo stesso che si era trovato con i programmatori umani quarant'anni fa.**

## 1. La formula è giusta, è la domanda a essere sbagliata

`1 - 0.05³` è la probabilità che **almeno uno** dei tre agenti abbia ragione. Per trasformarla in un risultato servono due cose:

1. **Gli agenti sbagliano in modo indipendente.** La probabilità che l'agente B sbagli non dipende dal fatto che l'agente A abbia sbagliato.
2. **Sai riconoscere qual è la risposta giusta.** Qualcuno, una suite di test completa o un oracolo, sceglie l'output corretto ogni volta che ce n'è uno.

La seconda ipotesi è quella che tutti dimenticano. In pratica un oracolo lo hai di rado; se lo avessi, non ti servirebbero tre agenti. Quindi **voti**: tieni la risposta su cui sono d'accordo almeno due dei tre. Con agenti indipendenti al 95%, il voto a maggioranza dà:

```text
P(majority right) = 3p²(1 - p) + p³ = 99.275%
```

Sempre notevole, ma l'errore residuo è passato dallo 0,0125% allo 0,725%, **58 volte di più**, solo perché nessuno sa qual è la risposta corretta. Questo scarto tra "almeno uno ha ragione" (quello che i paper chiamano pass@k) e "il voto ha ragione" è la prima cosa da tenere a mente. Il paper [Large Language Monkeys](https://scalingintelligence.stanford.edu/blogs/monkeys) l'ha misurato sul codice: la copertura continua a crescere con più campioni, ma senza un verificatore il voto e i reward model arrivano a un plateau.

## 2. La difficoltà è correlazione

La prima ipotesi è messa peggio, e non serve nessun misterioso argomento del tipo "i modelli pensano tutti allo stesso modo". I compiti semplicemente non sono tutti difficili allo stesso modo.

Prendiamo due mondi in cui gli agenti hanno esattamente la stessa accuratezza media del 95%:

- **Mondo A**: ogni compito fallisce il 5% delle volte.
- **Mondo B**: il 90% dei compiti è facile e fallisce l'1% delle volte; il 10% è difficile e fallisce il 41% delle volte. In media fa sempre il 5%.

Un solo agente non distingue i due mondi. Tre agenti sì:

| 3 agenti, accuratezza media del 95% | Mondo A (indipendenti) | Mondo B (compiti facili + difficili) |
| --- | --- | --- |
| Almeno uno giusto (oracolo) | 99,9875% | 99,31% |
| Voto a maggioranza giusto | 99,275% | **96,31%** |

Nel mondo B, i tre agenti sbagliano tutti insieme **55 volte più spesso** di quanto preveda l'indipendenza. Nessuno ha copiato nessuno. Sono semplicemente tutti scarsi sugli stessi compiti difficili. E aggiungere agenti aiuta appena: con il voto a maggioranza, il mondo B passa dal 96,3% con 3 agenti al 96,7% con 5 e al 97,1% con 9. Se i compiti difficili falliscono più della metà delle volte, il voto addirittura li peggiora, ed è quello che hanno trovato [Chen et al.](https://arxiv.org/abs/2403.02419v1): più chiamate all'LLM aiutano sulle domande facili e peggiorano quelle difficili.

Non è un'idea nuova. È il modello di Eckhardt-Lee, scritto per la NASA nel [1985](https://ntrs.nasa.gov/citations/19850015006) per il software di volo ridondante, e raffinato da [Littlewood e Miller](https://ntrs.nasa.gov/citations/19900036555). Se θ(x) è la probabilità che una versione scelta a caso fallisca sull'input x, allora:

```text
P(all n versions fail) = E[θ(x)ⁿ]  ≥  (E[θ(x)])ⁿ
```

Tutta la storia sta in quella disuguaglianza: appena la difficoltà varia da un input all'altro, il fallimento congiunto è più probabile di quanto preveda l'indipendenza. L'unica via d'uscita è rendere le versioni *diverse apposta*, in modo che i loro θ(x) non abbiano il picco sugli stessi input.

Puoi riprodurre entrambe le tabelle in poche righe:

```python
from math import comb

def vote_fails(theta, n):
    return sum(comb(n, k) * theta**k * (1 - theta)**(n - k)
               for k in range(n // 2 + 1, n + 1))

worlds = {"A": [(1.0, 0.05)], "B": [(0.9, 0.01), (0.1, 0.41)]}
for name, tasks in worlds.items():
    for n in (1, 3, 5, 9):
        oracle = 1 - sum(w * t**n for w, t in tasks)
        vote = 1 - sum(w * vote_fails(t, n) for w, t in tasks)
        print(f"world {name}, n={n}: oracle {oracle:.4%}, vote {vote:.4%}")
```

## 3. Cosa è stato misurato: umani nel 1986, agenti nel 2026

Nel 1986, John Knight e Nancy Leveson [hanno fatto l'esperimento](https://libraopen.lib.virginia.edu/public_view/jd472w463): 27 studenti di due università hanno scritto versioni indipendenti dello stesso programma a partire dalla stessa specifica, e ogni versione è stata eseguita su un milione di input casuali. Sotto l'ipotesi di indipendenza si aspettavano circa 127 fallimenti coincidenti. Ne hanno osservati 1.255, [circa dieci volte di più](https://shape-of-code.com/2026/06/21/reliability-via-n-version-programming/). L'indipendenza è stata rifiutata con una confidenza del 99%, e i fallimenti si concentravano sulle parti difficili della specifica.

Questo giugno, Ron, Baudry e Monperrus [l'hanno rifatto con gli agenti di programmazione](https://www.emergentmind.com/papers/2606.20158): 69 versioni da 5 harness di agenti e 23 modelli, lo stesso tipo di specifica, un milione di test. I risultati:

- Prese una per una, le versioni degli agenti sono buone: 27 delle 48 che hanno passato l'accettazione hanno avuto **zero** fallimenti sul milione di input, e la media era di 387 fallimenti per versione (circa lo 0,04%).
- Le terne con voto a maggioranza riducono i fallimenti medi **di circa due terzi** (da 387 a 131).
- Ma l'indipendenza viene di nuovo rifiutata: 429 fallimenti coincidenti osservati contro 115 attesi, **3,7 volte** di più. I fallimenti si concentrano sulle ambiguità della specifica, esattamente come con gli studenti.

Un secondo studio del 2026, [Nogueira et al.](https://arxiv.org/abs/2607.02808), ha fatto girare 12 modelli su 224 problemi in 5 linguaggi e ha trovato che i guadagni del voto a maggioranza restano **sotto la metà** di quanto preveda l'indipendenza, e che nessun ensemble ha battuto il miglior modello singolo. La scelta del modello contava più di tutto; lo stile del prompt quasi per niente.

Quindi il riassunto onesto è: **l'ensemble aiuta, di circa un fattore tre sui fallimenti, non di un fattore quattrocento.**

## 4. Modelli diversi? Meglio, ma meno di quanto speri

Se il problema è che le versioni condividono gli stessi punti ciechi, la mossa ovvia è scegliere versioni che non li condividono: famiglie di modelli diverse. Aiuta, ma c'è un però.

[Kim et al.](https://arxiv.org/abs/2506.07962v1) (ICML 2025) hanno guardato più di 350 modelli. Quando due modelli sbagliano entrambi, scelgono **la stessa risposta sbagliata circa il 60% delle volte** su una delle classifiche. E più i modelli sono accurati, più i loro errori sono correlati, anche tra fornitori diversi. [Goel et al.](https://arxiv.org/abs/2502.04313) hanno trovato la stessa cosa: man mano che le capacità crescono, gli errori si somigliano di più. I grandi modelli sono addestrati sullo stesso internet, sullo stesso GitHub e sempre di più sugli stessi dati sintetici. I loro θ(x) hanno il picco sugli stessi input.

Quello che decorrela davvero gli errori non è il logo sul modello, è quello che cambi intorno:

- **un input diverso**: una specifica riscritta o chiarita, una scomposizione diversa del compito;
- **un metodo diverso**: una versione scritta partendo dai test, una generata a partire da esempi;
- **un tipo di controllo diverso**: test che eseguono il codice, non un altro modello che lo legge.

Quest'ultimo punto è quello che uso tutti i giorni.

## 5. Generare e rivedere: il controllo che cambia la formula

La maggior parte di noi non fa girare tre agenti per poi votare. Facciamo girare un agente che scrive il codice e un altro, o lo stesso in un contesto pulito, che ne fa la review. La formula cambia:

```text
P(bug ships) = P(generator wrong) × P(reviewer misses it)
```

Con un generatore al 95% e un revisore che trova l'80% dei bug, l'indipendenza prevede che il 5% × 20% = **1%** delle modifiche arrivi in produzione con un bug. Vale lo stesso problema di correlazione: il revisore ha più probabilità di lasciarsi sfuggire proprio i bug che erano difficili da evitare fin dall'inizio. E c'è un secondo rischio, quello dell'auto-review. [Goel et al.](https://arxiv.org/abs/2502.04313) mostrano che gli LLM usati come giudici favoriscono gli output di modelli simili a loro, e [diversi](https://arxiv.org/pdf/2603.12123) [studi](https://arxiv.org/abs/2504.03846v3) trovano che i modelli non vedono nel proprio output errori che invece trovano quando lo stesso testo arriva da fuori. Le prove sono contrastanti: un [test verificabile](https://arxiv.org/abs/2606.20093) non ha trovato nessuna preferenza per sé misurabile. Ma nessuno ha ancora misurato, su codice con una verità di riferimento eseguibile, quanto più spesso un bug scritto dal modello A viene approvato da A rispetto a un revisore di un'altra famiglia. È l'esperimento che volevo fare, ed è ancora aperto.

Cosa sostengono già i numeri:

- **Un revisore vale più di un terzo generatore.** Perché un voto fallisca servono due risposte sbagliate su tre che coincidano; una review moltiplica per il tasso di errori sfuggiti, e un revisore che legge la specifica e il diff è un metodo diverso, non una terza copia dello stesso.
- **Preferisci un revisore di un'altra famiglia**, in un contesto pulito, con la specifica ma senza il ragionamento del generatore.
- **Preferisci un controllo che esegue.** Test, un type checker, un fuzzer. I loro errori non sono per niente correlati con quelli del modello, ed è esattamente la proprietà che chiede la matematica. È anche il motivo per cui ho costruito [Graft](/it/non-serve-scion-graft-review-delle-pull-request-degli-agenti/) e il [controllo di rilascio](/it/gli-agenti-consegnano-in-fretta-prima-fagli-passare-un-controllo-di-rilascio/) attorno a verifiche scriptate, e non attorno a un secondo parere.

## 6. E gli umani? Quarant'anni di dati sui difetti

La seconda domanda che avevo: come si confronta tutto questo con noi? Qual è la probabilità che una modifica scritta da un umano sia sbagliata, e come si confronta con un modello di un anno fa e con uno di oggi?

La prima risposta onesta è che **le metriche non coincidono**. I dati sugli umani si contano in difetti per riga o per function point su un intero progetto. I dati sui modelli si contano in compiti superati su un benchmark. Con questa avvertenza, ecco quello che abbiamo.

### Umani, dal 1975 a oggi

| Fonte | Periodo | Cosa misura | Numero |
| --- | --- | --- | --- |
| [Watts Humphrey, SEI](https://www.sei.cmu.edu/documents/125/2009_019_001_29092.pdf) | Anni '90 | Difetti *introdotti* da ingegneri esperti, prima di qualsiasi review o test | 80-125 per KLOC |
| [Ray Panko, dati di ispezione](http://panko.com/HumanErr/Software.html) | 1986-2006 | Difetti per riga trovati durante l'ispezione del codice | 1,9%-3,7% delle righe |
| [Panko, difetti residui](http://panko.com/HumanErr/Software.html) (Putnam & Myers, 1.486 progetti) | 1975-1996 | Difetti rimasti *dopo* la consegna | ~0,1%-0,3% delle righe (1-3 per KLOC) |
| [Capers Jones](https://www.sqgne.org/presentations/2010-11/Jones-Nov-2010.pdf) | ~2010 | Media USA dei difetti creati per function point, quota rimossa prima del rilascio | 5,1 per FP, 86,7% rimossi, 0,68 consegnati |
| Capers Jones, stessi dati | ~2010 | Team che usano TSP/PSP | 4,0 per FP, 97% rimossi, 0,12 consegnati |
| [Coverity Scan](https://news.synopsys.com/2015-07-29-Coverity-Scan-Open-Source-Report-Shows-Commercial-Code-Is-More-Compliant-to-Security-Standards-than-Open-Source-Code) | 2013-2014 | Difetti trovati dall'analisi statica su ~10 miliardi di righe | 0,61-0,77 per KLOC |
| [Software di bordo dello Shuttle NASA](https://www1.udel.edu/CIS/106h/16F/resources/theyWriteTheRightStuffNasa.html) | Anni '90 | Errori in ciascuna delle ultime tre release da 420.000 righe | 1 per release |

Saltano all'occhio tre cose.

- **Gli umani fanno tanti errori e ne trovano la maggior parte.** Entrano circa 100 difetti ogni mille righe; ne escono da uno a tre. Quasi tutta la qualità viene dalle fasi di review, ispezione e test, non dalla prima stesura.
- **Il tasso di errori quasi non si è mosso in quarant'anni.** Il potenziale di difetti di Jones sembra piatto in tutti i suoi scritti, e la sua efficienza di rimozione si è mossa appena, da circa l'85% (2007-2012) a poco più del 90% (2015). Prima di allora non ho trovato nessuna serie affidabile decennio per decennio. Quello che cambia il risultato di un fattore da cinque a dieci è il *processo*: confronta gli 0,68 difetti consegnati per function point della media USA con gli 0,12 dei team TSP/PSP, oppure il gruppo dello Shuttle, che è arrivato a un errore ogni 420.000 righe con 260 persone e 35 milioni di dollari all'anno.
- **I controlli umani sono l'ensemble originale.** Ispezione più test più una persona diversa che rilegge è esattamente il "controllo indipendente" della sezione 5, e ha lo stesso limite: [Knight e Leveson](https://libraopen.lib.virginia.edu/public_view/jd472w463) hanno dimostrato che anche gli umani condividono gli stessi punti ciechi.

Per confrontare con i modelli mi serve la stessa unità. Il meglio che riesco a fare è **la probabilità che una modifica tipica arrivi in produzione con almeno un difetto**. Prendiamo una modifica di 50 righe e i numeri di Panko. Prima della review, con circa il 3% di difetti per riga, la probabilità di almeno un difetto è 1 - 0,97⁵⁰ ≈ **78%**. Dopo la solita review e i soliti test, con circa lo 0,3% di difetti residui per riga, è 1 - 0,997⁵⁰ ≈ **14%**. Prendile come stime fatte sul retro di una busta, non come misure.

### Modelli, ottobre 2025 e ottobre 2026

| Benchmark | Ottobre 2025 | Ottobre 2026 |
| --- | --- | --- |
| [SWE-bench Verified](https://llm-stats.com/benchmarks/swe-bench-verified) (500 issue reali di GitHub, test nascosti) | [Claude Sonnet 4.5: 77,2%](https://www.anthropic.com/news/claude-sonnet-4-5), GPT-5: 74,9% | [95-97% in cima alla classifica](https://www.vals.ai/benchmarks/swebench), ora archiviato perché saturo |
| [SWE-Bench Pro](https://labs.scale.com/leaderboard/swe_bench_pro) (più difficile, resistente alla contaminazione) | ~23% al lancio (GPT-5, Opus 4.1) | ~60% sul set originale; [90-98% sulla V2 ripulita](https://labs.scale.com/leaderboard/swe_bench_pro_public_v2) |
| [Orizzonte temporale METR](https://metr.org/blog/2026-1-29-time-horizon-1-1/) (durata dei compiti con il 50% di successo) | ~3,5 h (GPT-5), ~5 h (Opus 4.5, misurato a gennaio 2026) | [≥16 h](https://metr.org/time-horizons/) (Claude Mythos Preview, maggio 2026) |
| [Tasso di successo sulla sicurezza di Veracode](https://www.veracode.com/blog/2026-genai-code-security-report-ai-risk/) (compiti sensibili per la sicurezza) | [55%](https://www.veracode.com/press-release/ai-generated-code-poses-major-security-risks-in-nearly-half-of-all-development-tasks-veracode-research-reveals/) (45% dei compiti vulnerabili) | 56% in media, il miglior modello al 68% |

I tassi di successo dei benchmark sovrastimano la correttezza, perché i test nascosti sono deboli. [SWE-ABS](https://arxiv.org/abs/2603.00520) ha ricontrollato le patch "risolte" dai 30 migliori agenti e ne ha trovate **circa una su cinque semanticamente sbagliata**. Se applico quello sconto, la probabilità che un compito venga fatto giusto è:

- **Ottobre 2025**: circa 0,77 × 0,80 ≈ **60-65%** su SWE-bench Verified, e meno del 25% su SWE-Bench Pro. Quindi **il 35-40% dei compiti falliva**, più del doppio del 14% di una modifica umana rivista, e vicino a una non rivista.
- **Ottobre 2026**: 95% o più su un benchmark saturo. Anche con lo stesso sconto del 20%, che è pessimistico per modelli più forti, i fallimenti scendono più o meno al **5-25%**. È la fascia di una modifica umana rivista.

L'unico confronto alla pari è l'esperimento N-version: stesso tipo di specifica, un milione di test. Le versioni degli agenti del 2026 falliscono in media su circa lo 0,04% degli input, e più della metà non fallisce mai. [Shape of Code](https://shape-of-code.com/2026/06/21/reliability-via-n-version-programming/) fa notare che sembra molto più basso delle versioni degli studenti del 1986. Tieni presente che quelli erano studenti, non team professionali.

E c'è un numero che non si è mosso: **la sicurezza**. Il tasso di successo di Veracode sui compiti sensibili per la sicurezza è rimasto tra il 45% e il 55% dal 2023, mentre i benchmark funzionali sono passati dal 75% al 95%. Java è al 29%, XSS e log injection al 13-15%. Il modello scrive codice che funziona molto più spesso di un anno fa. Non scrive codice *sicuro* molto più spesso.

Ci sono anche dati da repository reali, e sono meno drammatici di quanto dicano entrambi gli schieramenti. [Mao et al.](https://arxiv.org/html/2603.27130v3) hanno abbinato 36.855 unità di codice probabilmente scritte da IA con 65.391 scritte da umani negli stessi repository: 10,0 avvisi di analisi statica per KLOC per l'IA contro 13,6 per gli umani, lo stesso tasso di avvisi ad alto rischio, e un po' più di correzioni successive per il codice IA. Effetti "piuttosto piccoli", per usare le loro parole. Dall'altra parte, [CodeRabbit](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report) ha contato 1,7 volte più osservazioni di review sulle pull request assistite dall'IA alla fine del 2025, su un campione piccolo e da parte di un'azienda che vende review fatte dall'IA. Non ho trovato **nessuno studio del 2026 che misuri gli incidenti in produzione** del codice scritto dall'IA rispetto a quello scritto da umani. È il numero che tutti vorrebbero, e nessuno ce l'ha ancora.

## 7. Cosa ne ricavo

La matematica e i dati dicono la stessa cosa, per gli umani e per i modelli:

1. **Una singola esecuzione è una bozza.** Gli umani introducono circa 100 difetti ogni mille righe; i modelli falliscono una quota di compiti passata in un anno da circa il 40% a qualcosa tra il 5% e il 25%. Nessuno dei due è pronto per essere consegnato così com'è.
2. **La ripetizione aiuta meno della diversità.** Chiedere tre volte allo stesso modello vuol dire soprattutto campionare gli stessi punti ciechi. Tre famiglie di modelli fanno meglio, ma i modelli migliori sono sempre più d'accordo tra loro, anche sugli errori.
3. **Il controllo che rende di più è quello i cui errori non sono correlati con quelli dell'autore.** Per gli umani erano ispezione più test più processo, e hanno ridotto i difetti consegnati di un fattore da cinque a dieci. Per gli agenti è un revisore di un'altra famiglia con la specifica in mano, e soprattutto controlli che *eseguono*: test, tipi, fuzzing, un controllo di rilascio.
4. **Sistema la specifica prima di aggiungere agenti.** Nel 1986 come nel 2026, i fallimenti comuni si concentrano sulle specifiche ambigue. Nessun ensemble aggiusta una domanda posta male.
5. **La sicurezza è l'eccezione.** I modelli sono diventati molto più bravi a scrivere codice che funziona, non codice sicuro. È un punto in cui un controllo dedicato, uno scanner o una review di sicurezza, non è facoltativo.

Quindi non costruisco il grande progetto di benchmark, almeno per ora. La maggior parte di quello che avrebbe misurato è già stata misurata. La domanda aperta, cioè se un modello approva i propri bug più spesso di un revisore di un'altra famiglia, è abbastanza circoscritta da poterla testare in un fine settimana con una manciata di compiti con buoni test nascosti. Se lo faccio, i risultati saranno qui.

## Fonti

- [Knight & Leveson, An Experimental Evaluation of the Assumption of Independence in Multi-Version Programming (1986)](https://libraopen.lib.virginia.edu/public_view/jd472w463)
- [Eckhardt & Lee, A theoretical basis for the analysis of redundant software subject to coincident errors (NASA, 1985)](https://ntrs.nasa.gov/citations/19850015006)
- [Littlewood & Miller, Conceptual modeling of coincident failures in multiversion software](https://ntrs.nasa.gov/citations/19900036555)
- [Ron, Baudry, Monperrus, N-Version Programming with Coding Agents (2026)](https://arxiv.org/html/2606.20158v1)
- [Shape of Code, Reliability via N-version programming (2026)](https://shape-of-code.com/2026/06/21/reliability-via-n-version-programming/)
- [Nogueira et al., Evaluating Failure Independence in LLM-Generated Code (2026)](https://arxiv.org/abs/2607.02808)
- [Kim et al., Correlated Errors in Large Language Models (ICML 2025)](https://arxiv.org/abs/2506.07962v1)
- [Goel et al., Great Models Think Alike and this Undermines AI Oversight (ICML 2025)](https://arxiv.org/abs/2502.04313)
- [Chen et al., Are More LLM Calls All You Need? (2024)](https://arxiv.org/abs/2403.02419v1)
- [Brown et al., Large Language Monkeys (2024)](https://scalingintelligence.stanford.edu/blogs/monkeys)
- [Watts Humphrey, The Software Quality Profile (SEI)](https://www.sei.cmu.edu/documents/125/2009_019_001_29092.pdf)
- [Ray Panko, Human Error in Software](http://panko.com/HumanErr/Software.html)
- [Capers Jones, Software Quality in 2010](https://www.sqgne.org/presentations/2010-11/Jones-Nov-2010.pdf)
- [Coverity Scan Open Source Report 2014](https://news.synopsys.com/2015-07-29-Coverity-Scan-Open-Source-Report-Shows-Commercial-Code-Is-More-Compliant-to-Security-Standards-than-Open-Source-Code)
- [They Write the Right Stuff (Fast Company, 1996)](https://www1.udel.edu/CIS/106h/16F/resources/theyWriteTheRightStuffNasa.html)
- [Anthropic, Introducing Claude Sonnet 4.5 (2025)](https://www.anthropic.com/news/claude-sonnet-4-5)
- [Classifica SWE-bench Verified (llm-stats)](https://llm-stats.com/benchmarks/swe-bench-verified) e [Vals.ai](https://www.vals.ai/benchmarks/swebench)
- [Scale, SWE-Bench Pro](https://labs.scale.com/leaderboard/swe_bench_pro) e [SWE-Bench Pro V2](https://labs.scale.com/leaderboard/swe_bench_pro_public_v2)
- [SWE-ABS: patch "risolte" ma semanticamente sbagliate (2026)](https://arxiv.org/abs/2603.00520)
- [METR, Time Horizon 1.1 (2026)](https://metr.org/blog/2026-1-29-time-horizon-1-1/) e [orizzonti temporali METR](https://metr.org/time-horizons/)
- [Veracode, 2025 GenAI Code Security Report](https://www.veracode.com/press-release/ai-generated-code-poses-major-security-risks-in-nearly-half-of-all-development-tasks-veracode-research-reveals/) e [rapporto 2026](https://www.veracode.com/blog/2026-genai-code-security-report-ai-risk/)
- [Mao et al., codice generato dall'IA e codice umano in repository reali (2026)](https://arxiv.org/html/2603.27130v3)
- [CodeRabbit, State of AI vs Human Code Generation (2025)](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report)
- [Cross-Context Review (2026)](https://arxiv.org/pdf/2603.12123), [Do LLM Evaluators Prefer Themselves for a Reason?](https://arxiv.org/abs/2504.03846v3), [Self-Preference Is Weak or Absent in Verifiable Revision (2026)](https://arxiv.org/abs/2606.20093)
