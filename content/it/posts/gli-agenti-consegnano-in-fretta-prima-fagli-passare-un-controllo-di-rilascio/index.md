---
title: "Gli agenti consegnano in fretta. Prima fagli passare un controllo di rilascio"
categories:
- ai-coding-agents
tags:
- ai
- claude-code
- ai-agent
- privacy
- security
- release-engineering
- ci
- git
date: '2026-10-20T16:00:00.000000+00:00'
draft: false
slug: gli-agenti-consegnano-in-fretta-prima-fagli-passare-un-controllo-di-rilascio
translationKey: release-gate
cover: cover.jpg
showHero: true
description: Gli agenti di programmazione scrivono per te codice, test, fixture e documentazione, spesso con i tuoi dati reali nel loro contesto. Senza un controllo che sappia cosa vuol dire "personale" per te, una parte di quei dati finisce in un repository pubblico. Come ai-finance-coach trasforma ogni verifica obbligatoria prima di un rilascio in un solo comando, tiene la lista dei termini privati fuori dal repository e ci fa passare agenti, CI e workflow di rilascio.
summary: Prima di taggare ai-finance-coach 1.0.0, un solo comando ha trovato il mio nome in un test, un datore di lavoro in un id di test e una delle mie cifre nei dati demo, in un repository con la CI verde. Cosa trapela quando gli agenti lavorano con dati reali, perché né la CI né gli scanner di segreti lo vedono, e la ricetta generica che uso adesso - un controllo di rilascio scriptato, un file di termini locale che non entra mai nel repository, e quattro punti che obbligano tutti, agenti compresi, a passarlo.
projects:
- ai-finance-coach
---

Ormai gli agenti fanno buona parte del mio lavoro. Aprono pull request mentre dormo, scrivono i test, aggiornano la documentazione, sistemano la CI. Il più delle volte il risultato è buono. Ma "il più delle volte" non basta per un repository pubblico costruito sopra i miei conti in banca.

Questo fine settimana, prima di taggare [ai-finance-coach](https://github.com/mmornati/ai-finance-coach) 1.0.0, ho lanciato un comando:

```bash
uv run coach dev release-check
```

Ha risposto **NOT READY**, con 142 risultati nella scansione dei dati personali. La maggior parte era rumore (ci torno più avanti), ma non tutti. In un repository con la CI verde su ogni pull request mergiata, ha trovato:

- **il mio nome** nei test SSO, in un test di un form web e in due documenti;
- **il nome di un datore di lavoro** in un id di test;
- **una delle mie cifre** nel test sulla fiscalità degli affitti, e un'altra nei dati sintetici della demo.

Nessuno li ha messi lì apposta. Ed è proprio questo il problema. Questo articolo parla del controllo che li ha trovati e, più in generale, di come obbligare gli agenti a passare lo stesso controllo ogni volta che consegnano qualcosa.

## 1. Da dove arrivano le fughe

ai-finance-coach sincronizza i conti bancari della famiglia tramite PSD2 e tiene tutto in un database locale cifrato ([l'ho presentato qui](/it/nuova-settimana-un-altro-coach-ia-ai-finance-coach/)). Per capire se una modifica rompe qualcosa, i test sintetici non bastano: le vere descrizioni delle mie banche sono più disordinate di qualsiasi cosa io possa inventare. Per questo valido spesso una pull request sui dati reali, su una copia usa e getta del database (`coach backup`, poi `coach restore` in una cartella temporanea).

È una buona pratica per il codice. È una cattiva pratica per il repository, perché adesso i dati reali sono nel contesto dell'agente. E un agente che scrive un test prende l'esempio più concreto che ha visto. In un progetto che gira sui tuoi dati bancari, l'esempio più concreto è il tuo: il nome nella risposta SSO, il negozio che ha rotto il parser, l'importo esatto della rata del mutuo.

E non si ferma ai test. I posti dove ne ho trovati, o che ho dovuto proteggere:

- **test e fixture**: un valore "realistico" copiato da un'esecuzione vera;
- **documentazione e changelog**: un esempio un po' troppo vero;
- **dati demo**: un generatore dove una cifra inventata coincideva per caso con una reale;
- **file degli strumenti**: `.claude/settings.json` contiene percorsi assoluti con la tua cartella home;
- **lo spazio di lavoro degli agenti**: Claude Code tiene i suoi worktree in `.claude/worktrees/`, copie complete del repository con i loro file di configurazione.

## 2. Perché la CI non lo vede

La CI era verde su ognuna di quelle pull request. Non aveva motivo di non esserlo:

- **La CI non sa cosa è personale.** Uno scanner di segreti trova una chiave API o un blocco di chiave privata. Non sa che "Quenby" è la città dove vivi, né che 1.357,91 è la rata del tuo mutuo.
- **Alla CI non puoi dare la lista.** La lista di ciò che identifica la tua famiglia è il file più sensibile che hai. Non puoi committarla, e un hash non aiuta: l'hash di un nome si ritrova con un dizionario in pochi secondi.
- **Nemmeno chi fa la review lo vede.** Un nome in una fixture di test sembra un nome di test come un altro. Quando rileggi centinaia di pull request di agenti, leggi la logica, non i valori d'esempio.

Quindi il controllo deve girare dove sta la lista: sulla mia macchina. E deve girare ogni volta, il che vuol dire che non posso affidarmi alla memoria.

## 3. Un solo comando per tutte le verifiche obbligatorie

La prima decisione è stata smettere di avere una checklist in testa. Tutto ciò che deve essere vero prima di un rilascio è uno script, con un solo exit code: `coach dev release-check` ([`src/coach/release.py`](https://github.com/mmornati/ai-finance-coach/blob/main/src/coach/release.py), documentato in [`docs/release.md`](https://github.com/mmornati/ai-finance-coach/blob/main/docs/release.md)).

```text
coach dev release-check (coach 0.2.0, ~/Projects/ai-finance-coach)
  [ok  ] LICENSE file              LICENSE
  [ok  ] Owner placeholders        no licence / contact / repository placeholder left
  [ok  ] Version                   0.2.0, changelog dated 2026-10-06
  [ok  ] Web app build             built (5 asset reference(s) present)
  [FAIL] Personal data scan        142 hit(s) in 885 files (publishable + sdist): .github/CODEOWNERS:2  [real-data:machine#1163]; CODE_OF_CONDUCT.md:17  [real-data:machine#1163]; ...
  [ok  ] Real-data terms           the local term file was used (1163 terms)
  [ok  ] Package metadata          ai-finance-coach 0.2.0, python >=3.11
  [ok  ] Wheel contents            the built web app, the configuration example and the import profiles are packaged
  [ok  ] Shipped templates         memory skeleton present
  [ok  ] Project URLs              set
  [ok  ] Documentation             9 required documents present
  [ok  ] .gitignore                personal-data paths are ignored
  [ok  ] Docker files (static)     Dockerfile, docker-compose.yml and .dockerignore pass the policy (not built here)
  [ok  ] CI workflow               runs pytest, the web tests, ruff and release-check
  [FAIL] Python tests              exit 1: FAILED tests/test_hygiene.py::test_with_the_owners_local_term_file_the_repository_is_clean_too
  [ok  ] Lint (ruff)               passed
  [ok  ] Web tests (vitest)        passed
  [ok  ] Web type check            passed

NOT READY: 2 check(s) failed. See docs/release.md.
```

È l'output reale dell'esecuzione di cui parlavo all'inizio. Le correzioni sono finite nella pull request della 1.0.0, ed è questo stesso comando che deve stampare READY prima di un tag.

Tre regole lo rendono utile invece che decorativo:

1. **Ogni verifica è `ok`, `fail` o `skip`, e uno skip non è mai un successo.** `--skip-tests` esiste per andare più veloci, ma l'esecuzione dice allora che non vale per un rilascio. Un file di termini mancante è un **fallimento**, non un via libera silenzioso: una scansione senza la lista non dimostra niente sulla tua famiglia.
2. **Controlla anche le cose noiose.** Versione in `pyproject.toml` = versione nel codice = prima sezione datata del changelog. Nessun segnaposto `TODO(license)` rimasto. L'app web compilata e non più vecchia dei sorgenti. Le verifiche noiose sono quelle che un agente salta quando ha "quasi finito".
3. **Non invia niente da nessuna parte.** Lancia solo strumenti locali, quindi si può lanciare senza pensieri sulla macchina che contiene i dati.

## 4. La scansione dei dati personali, in due livelli

La verifica interessante è la scansione dei dati personali ([`src/coach/hygiene.py`](https://github.com/mmornati/ai-finance-coach/blob/main/src/coach/hygiene.py)). Ha due livelli.

**Regole strutturali, nel repository.** Non contengono niente su nessuno, quindi possono essere pubbliche e girare ovunque, CI compresa: un blocco di chiave privata, una chiave API, un percorso di cartella home (`/Users/<name>/`) che non è un evidente segnaposto, un IBAN **con un codice di controllo valido** (esempi e test usano IBAN non validi), un indirizzo e-mail fuori dai domini d'esempio riservati.

**Termini reali, fuori dal repository.** Tutto ciò che identifica la mia famiglia vive in un file locale, `~/.ai-finance-coach/hygiene-terms.txt`, costruito dal mio database e dalla mia memoria:

```text
$ uv run coach dev hygiene --build-terms
wrote 1163 term(s) to ~/.ai-finance-coach/hygiene-terms.txt (mode 0600; never commit or share it). Terms per category:
  name         20
  employer     3
  place        19
  school       1
  account      14
  id           22
  counterparty 19
  merchant     955
  amount       108
  machine      2
```

Nomi, datori di lavoro, città, scuole, etichette dei conti, frammenti di IBAN, le persone a cui mando soldi, i negozi riconoscibili, gli importi ricorrenti esatti, le cifre dei mutui, e il nome utente e il nome host della macchina. I dettagli che rendono accettabile un file del genere:

- viene scritto **con permessi 0600 dal primo byte** ed è ignorato da git;
- la scansione **rifiuta un file di termini dentro il repository**, quindi non si può committare per sbaglio;
- il comando **stampa dei conteggi, mai un termine**;
- un risultato **non stampa mai il testo trovato**, solo `file:riga` con la categoria e il numero del termine, come `CODE_OF_CONDUCT.md:17 [real-data:machine#1163]` qui sopra. Il report stesso si può incollare in una issue o far leggere a un agente;
- il confronto ignora maiuscole, accenti, punteggiatura e spazi, e trova un importo scritto `1234.56`, `1 234,56` o `1234,56`.

I negozi generici (una catena di supermercati, un'etichetta bancaria) sono esclusi apposta: sono pubblici, e segnalarli farebbe solo rumore.

## 5. Scansionare quello che viene davvero pubblicato

La prima esecuzione completa sulla mia macchina è fallita per un motivo che non mi aspettavo: la scansione è entrata in `.claude/worktrees/`, dove Claude Code tiene una copia del repository per ogni sessione. Ogni copia aveva il suo `docs/release.md` con i segnaposto e il suo `.claude/settings.json` con la mia cartella home. 4.211 file scansionati, tre verifiche rosse, tutto per colpa dello spazio di lavoro degli agenti.

Quei file non vengono pubblicati: sono ignorati da git, o appartengono a un altro checkout. La correzione è stata definire con precisione cosa è "pubblicabile":

- **quello che git pubblicherebbe**: la scansione applica da sola `.gitignore` (vince l'ultima regola, negazioni, cartelle padre escluse), quindi la regola è la stessa che la cartella sia un repository o no;
- **mai un altro checkout**: una cartella sotto la radice con il suo `.git` è un worktree, un clone annidato o un submodule, e viene saltata;
- **più quello che consegni davvero**: l'elenco dei file del sdist, e il contenuto di wheel e sdist in `dist/` quando ci sono. Un file può essere ignorato da git e finire comunque in un pacchetto.

Dopo la correzione, 885 file. È la superficie reale, e il controllo la guarda tutta.

## 6. Obbligare tutti a passare il controllo, agenti compresi

Un controllo che dipende dalla memoria di qualcuno è un suggerimento. ai-finance-coach lo mette in quattro punti, dal più economico al più rigido.

**1. Le istruzioni dell'agente.** `CLAUDE.md` dice quali varianti un agente può lanciare da solo senza rischi (`coach dev hygiene --ci`, `coach dev release-check --skip-tests --skip-web --ci`), e cosa non deve mai fare: costruire i termini dal database reale, oppure leggere, stampare, spostare o cercare nel file dei termini. Il modello dei permessi lo rafforza con regole di divieto (`Read(**/hygiene-terms*)`, `Bash(*hygiene-terms*)`), e un test fallisce se una delle due sparisce.

**2. La suite di test.** La scansione è un test pytest (`tests/test_hygiene.py`). Gli agenti lanciano la suite di test prima di aprire una pull request (la checklist per i contributi lo chiede), quindi lanciano la scansione senza che nessuno glielo chieda. Le regole strutturali girano ovunque; sulla mia macchina, dove il file dei termini esiste, gira anche la regola dei dati reali. I test stessi usano solo valori inventati (la famiglia di test è la famiglia Zorbax, che vive a Quenby-sur-Loze), e le stringhe da rilevare sono costruite a runtime, così il file di test non contiene mai quello che cerca.

**3. La CI.** Un job `release-check` lancia `release-check --ci` dopo i job dei test. `--ci` salta la regola dei dati reali, perché la CI non ha la lista, e lo dice nell'output invece di fare finta di niente.

**4. Il workflow di rilascio.** I tag non si pushano a mano. Il workflow **Tag a release** prende un solo input, una casella da spuntare: *"I ran `uv run coach dev release-check` (no --ci, no skips) on this commit and it printed READY"*. Poi verifica che le tre versioni coincidano, che il tag non esista e che ogni job di CI sia verde su quel preciso commit. Solo allora pusha il tag e costruisce il rilascio, che rilancia il controllo sugli archivi costruiti.

La casella è una dichiarazione umana, non una prova, e va bene così. È l'unico passo che ha bisogno della lista privata, quindi è l'unico passo che resta a me.

Se vuoi una versione più rigida del punto 1, gli hook di Claude Code possono trasformare l'istruzione in un blocco vero. Oggi non è in ai-finance-coach, ma la ricetta generica è breve. Un hook `PreToolUse` su `Bash` che rifiuta un push, un tag o un rilascio finché il controllo non è verde:

```bash
#!/usr/bin/env bash
# .claude/hooks/release-gate.sh: no push, tag or release while the gate is red
cmd=$(jq -r '.tool_input.command // ""')
case "$cmd" in
  *"git push"*|*"git tag"*|*"gh release"*)
    if ! uv run coach dev release-check --skip-tests --skip-web > "${TMPDIR:-/tmp}/release-check.log" 2>&1; then
      echo "release-check is NOT READY: read $TMPDIR/release-check.log and fix it before delivering." >&2
      exit 2   # exit 2 blocks the tool call and sends the message back to the agent
    fi ;;
esac
exit 0
```

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [ { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/release-gate.sh" } ] }
    ]
  }
}
```

A quel punto l'agente non può più consegnare senza passare il controllo, e il messaggio gli spiega perché. Un hook git `pre-push` fa la stessa cosa per gli umani.

## 7. Anche il controllo è codice, e sbaglia

Torniamo ai 142 risultati. Quasi tutti venivano da un solo termine: il mio nome utente, che è anche il mio handle GitHub. Corrispondeva a ogni URL del repository, a `CODEOWNERS`, alla `LICENSE` e al README. La correzione: `--build-terms` adesso esclude un nome macchina che corrisponde al proprietario del repository negli URL del progetto. Quel nome è pubblico per mia scelta.

Poi un colore CSS (`#0d1422`) e uno slug (`housing-5050`) corrispondevano a due dei miei importi reali. La correzione: un numero attaccato a una parola fa parte di un identificativo, non è un importo.

E quella correzione era troppo larga. Una review di sicurezza automatica sul commit ha fatto notare che `17.43EUR` o `EUR17.43`, un importo con la valuta attaccata, adesso veniva saltato. Un falso negativo in uno scanner di fughe di dati è il peggior tipo di bug: niente fallisce, e i dati escono. Una valuta accanto a un numero conta di nuovo come importo, con i test per entrambe le forme.

Tre lezioni da quella serata:

- **Testa il controllo come qualsiasi altro codice**, con dati inventati che coprano ogni regola, ogni falso positivo corretto e ogni falso negativo che potresti introdurre.
- **Un controllo rumoroso viene ignorato.** 142 risultati, quasi tutti per un solo falso positivo: è così che si impara a saltare una verifica. Correggi il rumore in fretta.
- **Fai rileggere chi rilegge.** Il falso negativo l'ha trovato un secondo passaggio automatico, non io.

## 8. Quello che la scansione non può sapere

La lista dei termini conosce nomi, luoghi e importi. Non conosce una situazione che non sta in nessun termine: quanti figli hai, un problema di salute citato di sfuggita nel backlog, il lavoro che non hai mai dichiarato nell'app. Per questo il passo 6 della procedura di rilascio resta umano: rileggere ancora una volta il diff del README e del backlog, cercando qualsiasi cosa personale che nessuna lista può intercettare.

Il controllo toglie la parte meccanica, così la parte umana riceve l'attenzione che merita.

## 9. La ricetta, senza la finanza

Niente di tutto questo è specifico dei dati bancari. Se i tuoi agenti lavorano con dati reali, dati di clienti, nomi interni della tua azienda, i tuoi dati di salute o di allenamento, vale la stessa ricetta:

1. **Metti ogni verifica obbligatoria in un solo comando**, con un solo exit code. `ok`, `fail`, `skip`; uno skip non è un successo.
2. **Dividi la scansione in due**: le regole generiche nel repository, la lista dei termini privati in un file locale che il repository rifiuta di contenere.
3. **Non stampare mai quello che hai trovato**, solo dove e di che categoria. Il report può allora girare senza rischi, verso un agente, una issue, un log di CI.
4. **Scansiona quello che consegni**: quello che git pubblica più i tuoi pacchetti, e mai i worktree degli agenti.
5. **Metti il controllo ovunque**: nelle istruzioni e nei permessi dell'agente, nella suite di test, nella CI, e come passo obbligatorio del workflow di rilascio. Un hook se vuoi un blocco vero.
6. **Tieni un passo umano** per la parte che ha bisogno della lista privata, o di giudizio.
7. **Testa il controllo**, e correggi il suo rumore prima che la gente impari a ignorarlo.

Gli agenti hanno reso economico produrre codice. Non hanno reso economico togliere dati già pubblicati: una volta in una storia git pubblica, sono in ogni clone e in ogni mirror. Qualche centinaio di righe di verifiche, lanciate ogni volta, costano molto meno.

Il codice è nel [repository di ai-finance-coach](https://github.com/mmornati/ai-finance-coach) (MIT): `src/coach/release.py`, `src/coach/hygiene.py` e `docs/release.md` sono un buon punto di partenza se vuoi riprendere l'idea.
