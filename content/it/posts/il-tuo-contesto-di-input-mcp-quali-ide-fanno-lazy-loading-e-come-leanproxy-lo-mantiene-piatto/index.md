---
title: 'Il tuo contesto di input MCP: quali IDE fanno lazy loading e come LeanProxy lo mantiene piatto'
categories:
- ai-coding-agents
tags:
- ai
- mcp
- model-context-protocol
- claude-code
- cursor
- token-optimization
- leanproxy
- ai-coding-agents
date: '2026-08-23T09:00:00.000000+00:00'
slug: il-tuo-contesto-di-input-mcp-quali-ide-fanno-lazy-loading-e-come-leanproxy-lo-mantiene-piatto
translationKey: mcp-input-context-ides-lazy-loading
url: /it/il-tuo-contesto-di-input-mcp-quali-ide-fanno-lazy-loading-e-come-leanproxy-lo-mantiene-piatto/
aliases:
- /il-tuo-contesto-di-input-mcp-quali-ide-fanno-lazy-loading-e-come-leanproxy-lo-mantiene-piatto
description: Ogni server MCP che tieni abilitato paga un pedaggio sul contesto di input
  a ogni richiesta. Ma non tutti gli IDE caricano i tool allo stesso modo. Ecco chi fa
  lazy loading, chi no, e come LeanProxy mantiene piatte le dimensioni del tuo contesto
  qualunque cosa tu tenga configurato e attivo.
---



Ogni volta che leggo qualcosa sui server MCP, la conversazione ruota quasi sempre attorno alle funzionalità: *"Collega questo, collega quello, il modello ora può fare X, Y e Z."*

Quello che nessuno ti dice è ciò che succede davvero al tuo **contesto di input** nel momento esatto in cui abiliti un server.

Ogni tool MCP che aggiungi porta con sé uno schema: nome, descrizione e un blueprint JSON dei parametri. Nella maggior parte degli IDE, questi schemi viaggiano con **ogni singola richiesta** verso il modello, che il tool venga usato o meno. Vivono nella parte del tuo input che non vedi, consumano token che il tuo provider ti addebita e divorano lo stesso budget che si dividono il tuo codice, la tua conversazione e le tue istruzioni.

Il risultato? Attiva tre server, per lo sport o per lo sviluppo, e una buona fetta della finestra di contesto sta lì senza fare nulla di utile. La parte interessante, però, è che **non tutti gli IDE si comportano allo stesso modo**. Vediamo cosa succede davvero, in questo momento.

## Se non lo usi, paghi comunque l'affitto

Uno schema di tool è un piccolo documento JSON: nome del tool, descrizione leggibile e lo schema JSON dei parametri. Un server MCP come quello di GitHub ne espone decine; Garmin arriva a un centinaio.

Quando un IDE lavora in modalità *eager* — la modalità predefinita per la maggior parte degli strumenti — l'intero elenco dei tool di ogni server abilitato viene iniettato nel system prompt o nella richiesta. Il modello non può scambiarli, perché fanno parte dell'input, turno dopo turno.

Il totale sale in fretta. Della stessa "tassa sugli schemi" ho già parlato in un [post](/the-hidden-tax-on-every-ai-request-how-mcp-servers-are-draining-your-token-budget/) precedente: solo per avere disponibili Garmin, GitHub e Intervals.icu, nel mio ambiente il costo è di circa 16.000-17.000 token per richiesta.

Ma aspetta, devo fare una distinzione: non tutti gli IDE caricano le definizioni dei tool in modalità eager. Ed è qui che la storia si fa interessante.

* * *

## Il quadro del 2026: chi fa il lazy loading dei tool MCP?

Ho letto la documentazione attuale e i tracker delle issue dei principali client, per vedere come ciascuno carica i tool MCP nel contesto di input. I risultati sono più variegati di quanto immagini:

| Client | Strategia di caricamento (ago 2026) | Lazy / on-demand | Documentazione e limiti |
|:---|:---|:---|:---|
| **Claude Code** | **Lazy (default)** — "MCP Tool Search" | Sì; recupera on demand fino a pochi tool | Richiede modelli Claude 4.5+; in alcuni setup ricade su eager (`docs.claude.com`) |
| **VS Code / Copilot** | Ibrido — lazy per i modelli in allowlist | Parziale (tool search per GPT-5.x e Claude 4.5+) | Limite rigido di 128 tool; raggruppamento virtuale a 64 tool (`code.visualstudio.com/docs`) |
| **Cursor** | Eager | No | Tutti i tool abilitati caricati a ogni richiesta; nessun limite documentato (`docs.cursor.com`) |
| **Windsurf / Devin Desktop (Cascade)** | Eager | No | Limite rigido di 100 tool (`docs.devin.ai`) |
| **Cline** | Eager | No | Tutte le definizioni iniettate nel system prompt in un colpo solo (`docs.cline.bot`) |
| **Gemini CLI** | Eager | No | Registry di avvio, namespace `mcp_<server>_<tool>` (`geminicli.com/docs`) |
| **JetBrains AI Assistant** | Eager (presunto) | No | I tool "diventano disponibili" e vengono richiamati in automatico; nessuna ricerca documentata |
| **opencode** | Eager | No | I documenti avvisano che i server MCP "add to the context" (`opencode.ai/docs`) |
| **Roo Code (QuillBot)** | Eager | No | Rimozione legata alla "riduzione dell'uso dei token"; archiviato a maggio 2026 |
| **Continue** | Solo agent, non verificato | — | Probabile eager; nessun effetto sui token documentato |
| **Aider** | N/D | — | Nessun supporto client MCP nativo |

Quindi, in pratica: **solo Claude Code fa lazy loading di default**, VS Code/Copilot lo fa solo in parte a seconda del modello, e **tutti gli altri sono eager** — gli schemi dei tool vanno al modello a ogni turno.

* * *

## Claude Code: il default lazy

Claude Code è l'eccezione alla regola. Da quando esiste la "MCP Tool Search", i tool non vengono più iniettati tutti insieme in eager. Al contrario, il client invia un riepilogo del tool disponibile e un meccanismo dedicato, chiamato `ToolSearch`, che va a recuperare on demand gli schemi più pertinenti: storicamente, fino a **pochi tool per richiesta**, in base alle esigenze della task. I tool trovati in un turno restano disponibili nei turni seguenti. Nella documentazione ufficiale di Claude, `ENABLE_TOOL_SEARCH` può essere `true`, `auto:5` (recupera fino a 5 tool) o `false`: con **`false`** si torna al vecchio comportamento, con tutte le definizioni dei tool di nuovo nel contesto a ogni turno.

Questa modalità "lazy di default", però, richiede modelli Claude recenti (Sonnet 4.5+ / Haiku 4.5+ / Opus 4.5+). Se lo si instrada tramite `ANTHROPIC_BASE_URL` verso un gateway, o verso qualunque altro provider non-first-party, Claude Code ripiega all'eager. La stessa cosa capita con Microsoft Foundry su Azure o con Google Cloud Agent Platform: tutto dentro.

C'è poi l'altra funzione, meno conosciuta: la **cache di discovery MCP** (`MCP_DISCOVERY_CACHE`) — Claude Code ora salva in cache anche i server remoti HTTP/SSE. Un server che mostra `cached 2h ago · connects on first use · 5 tools`, se la cache è ancora fresca, nemmeno parte: la connessione arriva solo quando usi davvero il primo tool. Qui il lazy loading non si limita allo schema: è davvero il server a essere caricato, on demand.

## Cursor, Windsurf, Cline, Copilot, JetBrains, opencode — la folla eager

Ogni altro client che ho verificato continua a trattare tutti i tool MCP abilitati come se fossero sempre accesi. Siamo precisi, perché il comportamento esatto conta:

- **Cursor** — riporto il testo della documentazione: "Cursor automatically uses MCP tools listed under Available Tools when relevant". La sezione "Available Tools" fa parte della ripartizione del contesto che Cursor ora mostra, e se ne sta lì nel tuo budget già dal primo messaggio.
- **Windsurf (Devin Desktop)** — Cascade riceve tutti i tool abilitati dei server MCP collegati, senza alcun caricamento on-demand. Esiste un tetto documentato: "Cascade has a limit of **100 tools** at its disposal". Superato quel numero, tocca a te scegliere quali escludere.
- **Cline** — inietta le definizioni di tutti i tool disponibili nel system prompt in un colpo solo. C'è una discussione aperta per un "defer loading"/ricerca dei tool, ma non è mai stato distribuito.
- **VS Code / Copilot** — l'agente locale e l'host dell'agente Copilot caricano per default tutti i tool selezionati nella richiesta. Per una piccola allowlist di modelli si attiva la tool search lato client; per tutti gli altri, eager completo. E c'è un tetto rigido di **128 tool per ogni richiesta**.
- **JetBrains AI Assistant** — i tool "diventano disponibili" e vengono richiamati automaticamente, oppure tramite il tool picker; nessun lazy loading documentato.
- **opencode** — l'ho letto, candidamente, nei documenti stessi di opencode: ["When you use an MCP server, it adds to the context. This can quickly add up... MCP servers add to your context, so you want to be careful with which ones you enable."](https://opencode.ai/docs/mcp-servers/) — ed è proprio per questo che consigliano di spegnere i server.

Quindi, nella maggior parte degli IDE, aggiungere un server (anche uno che usi di rado) **allarga direttamente il contesto**: perdi spazio per il codice, per i file, per le istruzioni e per la conversazione.

## Il costo reale: i numeri non sono simbolici

Ho misurato la dimensione del "tool namespace" nel mio ambiente di lavoro, usando LeanProxy e la stima canonica `pkg/reporter.Estimator` (1 token ≈ 4 caratteri, envelope JSON-RPC incluso). Ho confrontato la lista dei tool MCP nativa, senza alcuno sconto di cache, con il router LeanProxy: 3 tool, circa 158 token.

| Configurazione | MCP nativo (grezzo) | LeanProxy (router) | Risparmio |
|:---|:---|:---|:---|
| 1 server — Intervals.icu (10 tool) | 1.129 token | 158 token | **86,0%** |
| 1 server — GitHub (41 tool) | 4.570 token | 158 token | **96,5%** |
| 1 server — Garmin (100 tool) | 11.130 token | 158 token | **98,6%** |
| 3 server — 151 tool | 16.830 token | 158 token | **99,1%** |

Replay delle sessioni con uno sconto prudente sul cache-read (i cache hit NON sono gratis; oggi gli sconti veri sono circa 0,1x — vedi sotto):

| Scenario | MCP nativo | LeanProxy | Risparmio |
|:---|:---|:---|:---|
| Sport al mattino (2 server, 4 prompt) | ~12.260 | ~740 | **94,0%** |
| Workflow di sviluppo (2 server, 5 prompt) | ~7.120 | ~925 | **87,0%** |
| Giornata piena (3 server, 7 prompt) | ~29.450 | ~1.295 | **95,6%** |

Metodologia completa e tabelle dettagliate sono nei [risultati dei benchmark di LeanProxy](https://github.com/mmornati/leanproxy-mcp/blob/main/docs/benchmark-results.md) (nella cartella `docs/` del repository).

* * *

## Ma aspetta — la cache lo rende più economico, vero?

Ecco l'argomento che sento più spesso: *"Il contesto può essere enorme a causa dei miei server MCP, ma pago il prezzo pieno solo una volta — dopo, il provider serve lo stesso prefisso dalla sua prompt cache a ogni turno."*

È vero solo a metà, e quella metà vera è una trappola. Controlliamo i numeri attuali.

Ora, ogni provider importante suddivide il prezzo dell'input in tre categorie:

| Provider | Modello | Input fresco | Cache **write** | Cache **read** |
|:---|:---|:---|:---|:---|
| Anthropic | [Sonnet 5](https://claude.com/pricing) | $2.00 | **$2.50 (1,25x)** | $0.20 (0,10x) |
| Anthropic | [Sonnet 4.6](https://claude.com/pricing) | $3.00 | **$3.75 (1,25x)** | $0.30 (0,10x) |
| Anthropic | [Opus 5](https://claude.com/pricing) | $5.00 | **$6.25 (1,25x)** | $0.50 (0,10x) |
| OpenAI | [gpt-5.6-sol](https://platform.openai.com/docs/pricing) | $4.00 | **$5.00 (1,25x)** | $0.40 (0,10x) |
| OpenAI | [gpt-5.5](https://platform.openai.com/docs/pricing) | $5.00 | —(fatturato come input) | $0.50 (0,10x) |
| OpenAI | [gpt-5-mini](https://platform.openai.com/docs/pricing) | $0.25 | —(fatturato come input) | $0.025 (0,10x) |
| Google | [Gemini 3.5 Flash](https://cloud.google.com/vertex-ai/generative-ai/pricing) | $1.50 | —(nessun sovrapprezzo per la write) | $0.15 (0,10x) |
| Google | [Gemini 3.1 Pro](https://cloud.google.com/vertex-ai/generative-ai/pricing) | $2.00 | —(nessun sovrapprezzo per la write) | $0.20 (0,10x) |

*USD per 1 milione di token, prezzi di listino attuali (agosto 2026). "Cache write" è ciò che paghi quando un prefisso entra in cache; "cache read" è ogni volta successiva in cui lo stesso prefisso viene rinviato. Google e alcuni modelli OpenAI fatturano la prima write come input normale, invece di applicare un sovrapprezzo per la scrittura.*

Quindi la realtà dei prezzi è esattamente quella che hai descritto:

1. **La write non è "una volta a prezzo pieno" — è 1,25x.** La prima volta che il tuo enorme system prompt pieno di MCP entra in cache, paghi un *premio* rispetto all'input normale.
2. **La read è economica, ma non è mai zero.** 0,10x dei 16.830 token totali sono comunque ~1.700 token-equivalenti *per turno*, per token che non userai mai.
3. **Il TTL della cache azzera l'orologio.** La cache standard di Anthropic ha un TTL di 5 minuti. In una sessione di coding lunga — o in una da cui ti allontani — la cache scade e la richiesta successiva innesca di nuovo una write *fresca* a 1,25x dell'intero contesto. Le sessioni multi-turno che si trascinano la ripagano più e più volte.
4. **La cache non rimpicciolisce mai la finestra di contesto.** I 16.830 token continuano a occupare gli stessi slot nel contesto del modello a ogni singolo turno, in cache o no. La cache è uno sconto sulla *fatturazione*, non sulla *capacità*: ti fa risparmiare denaro, ma non ti restituisce lo spazio che potrebbe contenere il tuo codice, i tuoi file o le tue istruzioni.

Facciamo i conti. Una tipica sessione di sviluppo da 20 turni, con 3 server MCP abilitati (16.830 token di schemi) sopra un payload reale di ~20k token (~36.830 token di input), su Claude Sonnet 5 (`$2.00` input / `$2.50` write / `$0.20` read):

| | Solo tassa sugli schemi (16.830 token) | Prompt completo (36.830 token) |
|:---|---:|---:|
| Turno #1 — cache **write** | ~$0.042 (a 1,25x) | ~$0.092 |
| Turni #2–20 — cache **read** (19 hit) | 19 x ~$0.0034 | 19 x ~$0.0074 |
| **Totale sessione, solo schemi** | **~$0.106** | ~$0.232 |

Ora la stessa sessione attraverso LeanProxy (3 tool del router, ~158 token):

| | Solo router (158 token) | Prompt completo (20.158 token) |
|:---|---:|---:|
| Turno #1 — cache **write** | ~$0.0004 | ~$0.050 |
| Turni #2–20 — cache **read** | 19 x ~$0.00003 | 19 x ~$0.0040 |
| **Totale sessione** | **~$0.0014** | **~$0.126** |

Anche nel caso migliore — con l'intero prefisso in cache e niente che viene espulso — **portarsi dietro gli schemi MCP ti costa ben meno di un centesimo a turno, per sempre, sessione dopo sessione**. L'affermazione "pago solo una volta" è vera solo se una sessione dura meno del TTL di 5 minuti, non scrive mai di nuovo, e se ignori la read a 0,10x che paghi su ogni turno successivo.

La parte interessante: il caching e LeanProxy sono *additivi*. Il prompt caching abbassa il *dollaro* per token; LeanProxy abbassa il *numero di token*. Rispondono a domande diverse — e LeanProxy aiuta sia che la cache faccia hit sia che faccia miss:

* Se la cache fa **hit**: paghi 0,10x di 158 token invece di 0,10x di 16.830.
* Se la cache fa **miss** o scade (TTL di 5 minuti): paghi 1,25x di 158 token invece di 1,25x di 16.830 — ed è proprio il caso più costoso, quello che LeanProxy protegge.

* * *

## Come LeanProxy mantiene piatto il tuo contesto

Il modo in cui LeanProxy risolve il problema è concettualmente assurdo: ma è proprio per questo che funziona.

**LeanProxy si presenta al tuo IDE come un singolo server MCP.** Non quattro, non dodici: **uno**, con esattamente **tre tool** — `list_servers`, `list_tools`, `invoke_tool` — circa **158 token** in totale.

Quei tre tool sono tutto ciò che il client vede e tutto ciò che il contesto consuma. Quando il modello ha davvero bisogno dell'API di GitHub, chiama `invoke_tool("github", ...)`; a quel punto LeanProxy carica il server, lo schema JIT e instrada la richiesta. Gli stub dei tool vengono risolti al primo uso (~26 token per stub) e poi finiscono in cache.

Così, la dimensione del contesto è **fissa**: identica, qualunque sia il numero di server MCP che tieni configurati dietro LeanProxy. Aggiungi Garmin, Intervals.icu, HASS per Home Assistant, Stitch, GitHub: il contesto resta a tre tool. Tre. L'IDE non vedrà mai gli "altri" 100 tool.

Anche per gli IDE che *fanno* lazy loading (Claude Code con la tool search) questo conta: il client ha sempre soltanto una manciata di tool, quindi la discovery è più veloce, il riepilogo è minimo, ogni cache hit evita il continuo ricambio degli schemi e — se un giorno disattivassi la tool search tornando all'eager — pagheresti comunque 158 token, invece di 16.000.

* * *

## Quello che puoi tenere, e quello che paghi

Ecco la chiave: **puoi tenere TUTTI i server MCP configurati e attivi** — GitHub per il codice, Garmin e Intervals.icu per lo sport, Home Assistant per la domotica — e il contesto di input resta esattamente lo stesso. L'IDE, insomma, non spreca più il budget di token sugli schemi.

Basta acrobazie. Basta con i toggle del tipo *"quale dei 4 server mi serve per questa sessione?"*, quelli che dimentichi e che poi paghi per tutto il giorno. LeanProxy risolve tutto in background, e l'esplosione dei tool diventa invisibile.

Se la cosa ti suona familiare, il progetto è su GitHub: [mmornati/leanproxy-mcp](https://github.com/mmornati/leanproxy-mcp). E prima di integrarlo, puoi vedere in anteprima quanto risparmieresti senza toccare le richieste live:

```
# anteprima di quanti token ti farebbe risparmiare LeanProxy
leanproxy-mcp report --dry-run
```

* * *

**La verità scomoda**: nella maggior parte degli IDE attuali, le integrazioni MCP ti mettono in conto anche i tool che non hai mai chiamato, a ogni singolo turno — il lazy loading è ancora l'eccezione, non la regola. È per questo che tenere un proxy come LeanProxy davanti ai tuoi server MCP è l'unico modo per mantenere TUTTI quei server configurati e attivi, senza vedere il tuo contesto di input crescere con ogni server che aggiungi.

Keep the capability, lose the tax.