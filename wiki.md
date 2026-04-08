# Smart10 Web (Locale iPad) - Wiki Progetto

## Obiettivo

Realizzare una web app locale ispirata a Smart10, pensata per essere usata su un singolo iPad passato tra i giocatori al tavolo (hot-seat), senza backend e senza database remoto.

## Scope (MVP)

- Applicazione solo frontend.
- Utilizzo su singolo dispositivo.
- Nessun multiplayer online.
- Nessun account/login.
- Nessuna persistenza server-side.
- Interfaccia ottimizzata per iPad in landscape.

## Regole di gioco definite

- Giocatori supportati: da 2 a 4.
- Soglia vittoria selezionabile: 10, 20 o 30 punti.
- Rotazione primo giocatore a ogni round: si, obbligatoria.
- Se un giocatore passa: esce immediatamente dal round corrente.
- Se un giocatore sbaglia: perde i punti accumulati nel round corrente.
- Fine round:
  - quando tutti i giocatori hanno passato o sbagliato, oppure
  - quando tutte le opzioni della domanda sono esaurite.
- Parita a fine partita: spareggio.
- Modalita team: non prevista.

## Tipi di domanda supportati

Tipi ufficiali confermati:

- `true_false`
- `number`
- `order`
- `century_decade`
- `color`
- `open`

Modalita di validazione:

- `true_false`: validazione automatica da parte del sistema.
- tutti gli altri tipi: validazione manuale (il giocatore risponde a voce, poi conferma `corretto` o `errato` dopo aver visto la soluzione).

Nota di prodotto: per domande manuali, e il giocatore stesso a confermare correttezza/errore.

## Categorie

Una sola categoria per domanda (`category`).

Elenco categorie disponibili:

- `geografia`
- `storia`
- `scienza`
- `natura`
- `arte-e-letteratura`
- `cinema-e-tv`
- `musica`
- `sport`
- `cultura-generale`
- `cibo-e-tradizioni`

### Filtro categorie in avvio partita

In setup partita l'utente puo deselezionare categorie da escludere.

Solo le domande delle categorie selezionate sono candidate durante la partita.

## Regola di varieta categorie (category cycle)

Obiettivo: evitare ripetizioni ravvicinate della stessa categoria e favorire copertura di tutte le categorie attive.

Comportamento richiesto:

- Dopo una domanda di una categoria, la stessa categoria non dovrebbe ricomparire finche non e stata mostrata almeno una domanda per ogni altra categoria attiva.
- Regola "se possibile": se una categoria non ha domande disponibili (esaurite o escluse), il sistema continua con le categorie rimanenti.

Implementazione suggerita:

- Mantenere `pendingCategories` (categorie attive ancora da servire nel ciclo).
- Quando esce una domanda di categoria `X`, rimuovere `X` da `pendingCategories`.
- Se `pendingCategories` diventa vuoto, iniziare un nuovo ciclo con tutte le categorie attive che hanno ancora domande disponibili.
- Se la categoria richiesta non ha candidati, saltarla senza bloccare la partita.

## Politica di visualizzazione domande

Vincolo Smart10:

- ogni domanda deve avere **sempre 10 slot** (`A`..`J`).

Regole di rotazione domande:

- Una domanda mostrata non deve essere riproposta finche non sono state mostrate tutte le altre domande disponibili.
- Se tutte le domande disponibili sono gia state mostrate, si resetta il set "mostrate" e si ricomincia.

## Voto domanda e skip

Prima di passare alla domanda successiva, l'utente deve poter:

- votare positivo (`up`)
- votare negativo (`down`)
- saltare (`skip`)

Regole:

- Voto `down`: la domanda non deve piu essere mostrata in futuro.
- `skip`: trattato come `down`.
- Voto `up`: nessuna esclusione.

## Persistenza locale

Scelta funzionale:

- Stato partita (turno, round, punti correnti): in memoria volatile.
- Persistenza locale (consigliata via `localStorage`) per:
  - domande gia mostrate,
  - voti domanda,
  - domande escluse (`down/skip`).

Chiavi consigliate:

- `smart10.shownQuestionIds`
- `smart10.questionVotes`
- `smart10.excludedQuestionIds`
- `smart10.categoryCycle`

## Stack tecnico approvato

- React
- TypeScript
- Vite
- stato locale con `useReducer` o Zustand

### Motivazione stack

- React: UI a schermate e componenti touch-friendly.
- TypeScript: sicurezza sul modello dati e sui 6 tipi domanda.
- Vite: build veloce e setup leggero per app statica.
- Store locale: separazione netta tra motore regole e UI.

## Deploy su GitHub Pages

Compatibile con stack scelto.

Note operative:

- Nessun server a pagamento necessario.
- Impostare `base` in `vite.config` per project pages:
  - esempio repo `smart10-web` -> `base: "/smart10-web/"`.
- Se si usa routing, preferire `HashRouter` per evitare problemi di refresh.
- `localStorage` disponibile su GitHub Pages (HTTPS).

## Modello dati JSON (deck)

Struttura top-level:

```json
{
  "schemaVersion": "1.1",
  "deckId": "smart10-it-core",
  "language": "it",
  "categories": [
    "geografia",
    "storia",
    "scienza",
    "natura",
    "arte-e-letteratura",
    "cinema-e-tv",
    "musica",
    "sport",
    "cultura-generale",
    "cibo-e-tradizioni"
  ],
  "questions": []
}
```

Struttura domanda:

```json
{
  "id": "q001",
  "type": "true_false",
  "category": "geografia",
  "prompt": "Testo domanda",
  "slots": [
    { "key": "A", "label": "..." },
    { "key": "B", "label": "..." },
    { "key": "C", "label": "..." },
    { "key": "D", "label": "..." },
    { "key": "E", "label": "..." },
    { "key": "F", "label": "..." },
    { "key": "G", "label": "..." },
    { "key": "H", "label": "..." },
    { "key": "I", "label": "..." },
    { "key": "J", "label": "..." }
  ],
  "payload": {}
}
```

Vincoli:

- `slots.length` deve essere sempre `10`.
- `key` consigliate: `A`..`J`.
- `type` determina il formato di `payload`.

### Payload per tipo

`true_false`

```json
{
  "truthBySlot": {
    "A": true,
    "B": false
  }
}
```

`number`

```json
{
  "exactBySlot": {
    "A": 1969,
    "B": 1989
  },
  "unit": "anno"
}
```

`order`

```json
{
  "rankBySlot": {
    "A": 1,
    "B": 3
  },
  "orderLabel": "1 = piu antico"
}
```

`century_decade`

```json
{
  "mode": "century",
  "valueBySlot": {
    "A": "XIX",
    "B": "1990s"
  }
}
```

`color`

```json
{
  "colorBySlot": {
    "A": "rosso",
    "B": "blu"
  }
}
```

`open`

```json
{
  "acceptedBySlot": {
    "A": ["risposta 1", "variante 1"],
    "B": ["risposta 2"]
  }
}
```

Nota: anche nei tipi a validazione manuale, mantenere le soluzioni nel payload e utile per mostrare la risposta corretta prima della conferma utente.

## Flusso UX (alto livello)

1. Setup partita:
   - numero giocatori (2-4),
   - nomi giocatori,
   - target punti (10/20/30),
   - selezione categorie.
2. Inizio round:
   - visualizzazione domanda corrente (10 slot).
3. Turno giocatore:
   - seleziona slot o passa.
   - se `true_false`, risposta + verifica automatica.
   - se altro tipo, risposta orale + mostra soluzione + conferma manuale corretto/errato.
4. Fine round:
   - aggiornamento punteggi consolidati.
5. Vote step domanda:
   - `up` / `down` / `skip` (skip = down).
6. Prossima domanda:
   - selezione con regola category cycle + esclusioni + non ripetizione.
7. Fine partita:
   - al raggiungimento target punti,
   - spareggio in caso di parita.

## Spareggio (definizione consigliata)

Se due o piu giocatori sono pari al punteggio massimo al trigger di fine partita:

- giocano un round extra solo i giocatori in parita,
- vince chi ottiene il punteggio migliore in quel round,
- se permane parita, si ripete un altro round di spareggio.

## Requisiti UI iPad

- layout landscape-first.
- pulsanti grandi e facilmente cliccabili.
- alto contrasto e tipografia leggibile a distanza tavolo.
- interazioni minime per turno (pochi tap).
- feedback chiaro su corretto/errato/punti persi.

## Direzione grafica e stile visivo

Obiettivo estetico:

- look and feel app-like, giocoso, familiare.
- forte ispirazione al dispositivo fisico Smart10 (plancia, fori/slot, pedine, colori).
- interfaccia "da tavolo": elementi grandi, chiari, immediati.

Linee guida visive:

- palette calda ispirata al gioco fisico:
  - arancione principale,
  - verde scuro per elementi risposta,
  - neutri chiari per contrasto del testo.
- forme morbide e arrotondate (card, pulsanti, pannelli).
- ombre leggere e layering per dare profondita "oggetto fisico".
- micro-animazioni brevi (tap, conferma risposta, passaggio turno).

Componenti UI chiave da disegnare in stile "board game":

- `QuestionBoard`:
  - area centrale con testo domanda,
  - 10 slot sempre visibili disposti in modo circolare o semi-circolare,
  - stato slot (disponibile, scelto, risolto, bloccato).
- `PlayerBar`:
  - giocatore attivo molto evidente,
  - punteggio consolidato e punti round.
- `TurnActions`:
  - CTA principali grandi: `Rispondi`, `Passa`, `Mostra soluzione`, `Corretto`, `Errato`.
- `VotePanel`:
  - azioni chiare: `Pollice su`, `Pollice giu`, `Salta`.

Vincoli UX legati allo stile:

- priorita alla leggibilita rispetto al dettaglio grafico.
- contrasto minimo adeguato per uso in ambiente domestico.
- target touch generosi (almeno 44x44 px, consigliato superiore su iPad).
- evitare interazioni nascoste o gesture complesse.

Riferimento visual:

- usare l'immagine del gioco fisico come baseline per mood, colori e disposizione dei 10 slot.
- non replicare in modo rigido l'hardware: mantenere coerenza funzionale con i pattern di una web app moderna.

## Criteri di accettazione (MVP)

- Avvio partita completo con 2-4 giocatori e target selezionabile.
- Gestione turni/round conforme alle regole definite.
- Supporto dei 6 tipi domanda.
- Validazione ibrida funzionante:
  - auto su `true_false`,
  - manuale sugli altri.
- Ogni domanda ha 10 slot obbligatori.
- Filtro categorie in setup funzionante.
- Category cycle applicato "se possibile".
- Domande `down`/`skip` mai piu riproposte.
- Domande non ripetute finche non esaurito pool disponibile.
- Deploy statico funzionante su GitHub Pages.

## Note finali

- Il file deck puo essere mantenuto in repo (`public/decks/*.json`) e aggiornato senza backend.
- Per robustezza, consigliato introdurre una validazione schema JSON in fase di caricamento deck.
- Il file di esempio con 10 domande (`smart10-it-demo-10x10`) puo essere usato come seed iniziale.
