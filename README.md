# Libreria Personale 📚

## Descrizione
Un'applicazione web moderna per catalogare e gestire la tua collezione di libri personale. Costruita con React, TypeScript e Tailwind CSS, offre un'interfaccia utente elegante e reattiva completamente in italiano.

## Funzionalità
- Gestione completa dei libri (aggiunta, modifica, eliminazione)
- Interfaccia utente moderna con Tailwind CSS e Shadcn UI
- Supporto per caricamento copertine
- Sistema di valutazione e stato di lettura
- Importazione libri da file CSV
- Completamente in italiano

## Tech Stack
- React 18
- TypeScript
- Next.js 14
- Tailwind CSS
- Shadcn UI
- Radix UI
- Express.js

## Struttura del Progetto
```
server/
├── src/
    ├── components/     # Componenti React condivisi
    ├── hooks/         # Custom React hooks
    ├── utils/         # Funzioni di utilità
    ├── types/         # TypeScript types
    └── lib/           # Librerie condivise

extension/
├── src/
    ├── background/    # Script service worker
    ├── content/       # Script di contenuto
    ├── popup/         # UI del popup dell'estensione
    ├── options/       # Pagina opzioni dell'estensione
    ├── components/    # Componenti React condivisi
    ├── hooks/         # Custom React hooks
    ├── utils/         # Funzioni di utilità
    ├── lib/           # Librerie condivise
    ├── types/         # TypeScript types
    └── storage/       # Utilità per Chrome storage

shared/
├── src/
    ├── types/         # Types condivisi
    └── utils/         # Funzioni condivise
```

## Installazione
1. Clona il repository
```bash
git clone [repository-url]
```

2. Installa le dipendenze
```bash
npm install
```

3. Avvia il server di sviluppo
```bash
npm run dev
```

## Convenzioni di Sviluppo

### TypeScript
- Utilizzo di TypeScript per tutti i file
- Preferenza per interfaces rispetto ai types
- Return types espliciti per tutte le funzioni
- Import assoluti usando @/...

### Stile del Codice
- Programmazione funzionale e dichiarativa
- Componenti React funzionali con TypeScript
- Naming in PascalCase per i componenti (es. VisualForm.tsx)
- Naming in camelCase per le utility (es. formValidator.ts)

### Gestione degli Errori
- Implementazione di error boundaries
- Logging appropriato per il debugging
- Messaggi di errore user-friendly
- Gestione graceful dei fallimenti di rete

### Sicurezza
- Content Security Policy implementata
- Sanitizzazione degli input utente
- Gestione appropriata dei dati sensibili
- Best practices per la sicurezza delle estensioni Chrome

### Git
Prefissi per i commit:
- "fix:" per correzioni di bug
- "feat:" per nuove funzionalità
- "perf:" per miglioramenti delle performance
- "docs:" per modifiche alla documentazione
- "style:" per modifiche al formatting
- "refactor:" per refactoring del codice
- "test:" per aggiunta di test
- "chore:" per task di manutenzione

## Licenza
GNU General Public License v3.0 - vedi il file [LICENSE](LICENSE) per i dettagli.
