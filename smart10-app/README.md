# Smart10 Web (Locale iPad)

Web app locale ispirata a Smart10, ottimizzata per uso hot-seat su iPad.

## Stack

- React + TypeScript
- Vite
- Vitest
- localStorage per stato domande/voti

## Avvio locale

```bash
npm install
npm run dev
```

## Build e test

```bash
npm run test
npm run build
```

## Deploy su GitHub Pages

Questa app usa `HashRouter`, quindi e compatibile con GitHub Pages senza rewrite server.

1. Imposta il base path prima del build:

```bash
export GH_PAGES_BASE="/NOME_REPO/"
```

1. Esegui deploy:

```bash
npm run deploy
```

Se pubblichi su dominio root, usa:

```bash
export GH_PAGES_BASE="/"
```

## Deck domande

Deck demo disponibile in `public/decks/demo.json`.

Vincoli principali:

- una domanda ha sempre 10 slot (`A..J`)
- una sola categoria per domanda
- supporto ai 6 tipi ufficiali

