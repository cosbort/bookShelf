# Documentazione API - Libreria Personale

## Panoramica

Questa documentazione descrive tutte le API pubbliche, funzioni e componenti disponibili nell'applicazione **Libreria Personale**. L'applicazione è costruita con Next.js 15, React 19, TypeScript e utilizza Prisma come ORM per la gestione del database.

## Indice

1. [API REST](#api-rest)
2. [Hook Personalizzati](#hook-personalizzati)
3. [Componenti React](#componenti-react)
4. [Componenti UI](#componenti-ui)
5. [Utilità](#utilità)
6. [Tipi TypeScript](#tipi-typescript)

---

## API REST

### Endpoint Libri

#### `GET /api/books`
Recupera l'elenco completo di tutti i libri nella libreria.

**Risposta:**
```json
[
  {
    "id": "string",
    "title": "string",
    "author": "string",
    "isbn": "string",
    "status": "To Read" | "Reading" | "Read" | "Completed" | "Dropped",
    "genre": "string",
    "coverUrl": "string",
    "description": "string",
    "publishedDate": "string",
    "publisher": "string",
    "pageCount": number,
    "rating": number,
    "location": "string",
    "wishList": boolean,
    "previouslyOwned": boolean,
    "upNext": boolean,
    "language": "string",
    "notes": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

**Esempio di utilizzo:**
```typescript
const response = await fetch('/api/books');
const libri = await response.json();
```

#### `POST /api/books`
Aggiunge un nuovo libro alla libreria.

**Payload richiesto:**
```json
{
  "title": "string (obbligatorio)",
  "author": "string (obbligatorio)",
  "isbn": "string (opzionale)",
  "status": "To Read" | "Reading" | "Read" | "Completed" | "Dropped",
  "genre": "string (opzionale)",
  "coverUrl": "string (opzionale)",
  "description": "string (opzionale)",
  "publishedDate": "string (opzionale)",
  "publisher": "string (opzionale)",
  "pageCount": number,
  "rating": number,
  "location": "string (opzionale)",
  "wishList": boolean,
  "previouslyOwned": boolean,
  "upNext": boolean,
  "language": "string (default: 'it')",
  "notes": "string (opzionale)"
}
```

**Esempio di utilizzo:**
```typescript
const nuovoLibro = {
  title: "Il Nome della Rosa",
  author: "Umberto Eco",
  status: "To Read",
  language: "it"
};

const response = await fetch('/api/books', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(nuovoLibro),
});
const libroCreato = await response.json();
```

#### `GET /api/books/[id]`
Recupera i dettagli di un libro specifico tramite ID.

**Parametri:**
- `id`: ID univoco del libro

**Esempio di utilizzo:**
```typescript
const response = await fetch('/api/books/123');
const libro = await response.json();
```

#### `PUT /api/books/[id]`
Aggiorna completamente un libro esistente.

**Parametri:**
- `id`: ID univoco del libro

**Esempio di utilizzo:**
```typescript
const libroAggiornato = {
  title: "Il Nome della Rosa - Edizione Speciale",
  author: "Umberto Eco",
  status: "Read",
  rating: 5
};

const response = await fetch('/api/books/123', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(libroAggiornato),
});
```

#### `DELETE /api/books/[id]`
Elimina un libro dalla libreria.

**Parametri:**
- `id`: ID univoco del libro

**Esempio di utilizzo:**
```typescript
const response = await fetch('/api/books/123', {
  method: 'DELETE',
});
const risultato = await response.json(); // { success: true }
```

### Endpoint CSV

#### `GET /api/csv`
Esporta tutti i libri in formato CSV.

**Risposta:** File CSV scaricabile

**Esempio di utilizzo:**
```typescript
const response = await fetch('/api/csv');
const csvContent = await response.text();
```

#### `POST /api/books/import`
Importa libri da file CSV con ricerca automatica delle copertine.

**Payload richiesto:**
- File CSV con formato supportato

**Esempio di utilizzo:**
```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/books/import', {
  method: 'POST',
  body: formData,
});
```

#### `POST /api/books/export`
Esporta libri selezionati in formato CSV.

**Payload richiesto:**
```json
{
  "bookIds": ["id1", "id2", "id3"]
}
```

---

## Hook Personalizzati

### `useBooks()`
Hook principale per la gestione dei libri.

**Ritorna:**
```typescript
{
  books: Book[],           // Array dei libri
  isLoading: boolean,      // Stato di caricamento
  error: Error | null,     // Eventuali errori
  deleteBook: (id: string) => Promise<void>,
  updateBook: (id: string, data: Partial<Book>) => Promise<Book>,
  addBook: (data: Omit<Book, 'id'>) => Promise<Book>,
  refetch: () => Promise<void>  // Ricarica i dati
}
```

**Esempio di utilizzo:**
```typescript
import { useBooks } from '@/hooks/useBooks';

function ComponenteLibreria() {
  const { books, isLoading, addBook, deleteBook } = useBooks();

  const aggiungiNuovoLibro = async () => {
    await addBook({
      title: "Nuovo Libro",
      author: "Autore",
      status: "To Read",
      language: "it",
      createdAt: new Date(),
      updatedAt: new Date(),
      wishList: false,
      previouslyOwned: false,
      upNext: false
    });
  };

  if (isLoading) return <div>Caricamento...</div>;

  return (
    <div>
      {books.map(libro => (
        <div key={libro.id}>
          <h3>{libro.title}</h3>
          <button onClick={() => deleteBook(libro.id)}>
            Elimina
          </button>
        </div>
      ))}
    </div>
  );
}
```

### `useBookSearch()`
Hook per la ricerca di libri tramite API esterne (Google Books, OpenLibrary).

**Ritorna:**
```typescript
{
  searchByTitle: (title: string) => Promise<SearchBookResult[]>,
  searchByIsbn: (isbn: string) => Promise<Partial<Book> | null>,
  isLoading: boolean,
  error: string | null
}
```

**Esempio di utilizzo:**
```typescript
import { useBookSearch } from '@/hooks/useBookSearch';

function ComponenteRicerca() {
  const { searchByTitle, searchByIsbn, isLoading } = useBookSearch();

  const cercaPerTitolo = async (titolo: string) => {
    const risultati = await searchByTitle(titolo);
    console.log('Libri trovati:', risultati);
  };

  const cercaPerISBN = async (isbn: string) => {
    const libro = await searchByIsbn(isbn);
    if (libro) {
      console.log('Libro trovato:', libro);
    }
  };

  return (
    <div>
      <button onClick={() => cercaPerTitolo("Harry Potter")}>
        Cerca per titolo
      </button>
      <button onClick={() => cercaPerISBN("9780747532699")}>
        Cerca per ISBN
      </button>
      {isLoading && <p>Ricerca in corso...</p>}
    </div>
  );
}
```

### `useBookStatus()`
Hook per la gestione e visualizzazione degli stati di lettura.

**Ritorna:**
```typescript
{
  getStatusColor: (status: ReadingStatus) => {
    bg: string,      // Colore di sfondo
    text: string,    // Colore del testo
    border: string   // Colore del bordo
  }
}
```

**Esempio di utilizzo:**
```typescript
import { useBookStatus } from '@/hooks/useBookStatus';

function BadgeStato({ status }: { status: ReadingStatus }) {
  const { getStatusColor } = useBookStatus();
  const colors = getStatusColor(status);

  return (
    <span
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border
      }}
      className="px-2 py-1 rounded border"
    >
      {status}
    </span>
  );
}
```

### `useDebounce(value, delay)`
Hook di utilità per il debouncing degli input.

**Parametri:**
- `value`: Valore da fare il debounce
- `delay`: Ritardo in millisecondi

**Esempio di utilizzo:**
```typescript
import { useDebounce } from '@/hooks/useDebounce';

function ComponenteRicerca() {
  const [inputValue, setInputValue] = useState('');
  const debouncedValue = useDebounce(inputValue, 500);

  useEffect(() => {
    if (debouncedValue) {
      // Esegui la ricerca solo dopo 500ms di inattività
      eseguiRicerca(debouncedValue);
    }
  }, [debouncedValue]);

  return (
    <input
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder="Cerca libri..."
    />
  );
}
```

---

## Componenti React

### `<BookForm>`
Componente principale per aggiungere e modificare libri.

**Props:**
```typescript
interface BookFormProps {
  onSubmit: (book: Omit<Book, 'id'>) => void;
  initialBook?: Book;  // Per la modalità modifica
}
```

**Funzionalità:**
- Ricerca automatica tramite titolo o ISBN
- Integrazione con Google Books e OpenLibrary
- Caricamento automatico copertine
- Validazione dei campi
- Supporto per tutti i campi del libro

**Esempio di utilizzo:**
```typescript
import { BookForm } from '@/components/BookForm';

function PaginaAggiungiLibro() {
  const { addBook } = useBooks();

  const handleSubmit = async (libroData: Omit<Book, 'id'>) => {
    await addBook(libroData);
    // Reindirizza o mostra messaggio di successo
  };

  return (
    <div>
      <h1>Aggiungi Nuovo Libro</h1>
      <BookForm onSubmit={handleSubmit} />
    </div>
  );
}

// Per modificare un libro esistente
function PaginaModificaLibro({ libro }: { libro: Book }) {
  const { updateBook } = useBooks();

  const handleSubmit = async (libroData: Omit<Book, 'id'>) => {
    await updateBook(libro.id, libroData);
  };

  return (
    <BookForm 
      onSubmit={handleSubmit} 
      initialBook={libro} 
    />
  );
}
```

### `<BookList>`
Componente per visualizzare l'elenco dei libri con funzionalità avanzate.

**Props:**
```typescript
interface BookListProps {
  searchQuery?: string;  // Query di ricerca opzionale
}
```

**Funzionalità:**
- Visualizzazione griglia responsiva
- Filtri per stato di lettura
- Ordinamento multiplo (titolo, autore, valutazione, anno)
- Ricerca in tempo reale
- Raggruppamento alfabetico
- Navigazione alfabetica laterale
- Caricamento lazy delle copertine

**Esempio di utilizzo:**
```typescript
import { BookList } from '@/components/BookList';

function PaginaLibreria() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Cerca nella libreria..."
      />
      <BookList searchQuery={searchQuery} />
    </div>
  );
}
```

### `<BookCard>`
Componente per visualizzare singola scheda libro.

**Props:**
```typescript
interface BookCardProps {
  book: Book;
}
```

**Funzionalità:**
- Copertina responsive
- Badge di stato colorato
- Informazioni essenziali
- Link alla pagina dettaglio
- Animazioni hover

**Esempio di utilizzo:**
```typescript
import { BookCard } from '@/components/BookList';

function GrigliaLibri({ libri }: { libri: Book[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {libri.map(libro => (
        <BookCard key={libro.id} book={libro} />
      ))}
    </div>
  );
}
```

### `<BookImportModal>`
Componente modale per l'importazione CSV.

**Props:**
```typescript
interface BookImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}
```

**Funzionalità:**
- Upload file CSV
- Anteprima dati
- Barra di progresso
- Gestione errori
- Ricerca automatica copertine

**Esempio di utilizzo:**
```typescript
import { BookImportModal } from '@/components/BookImportModal';

function ComponenteImport() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImportComplete = () => {
    setIsModalOpen(false);
    // Aggiorna la lista libri
  };

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Importa Libri
      </button>
      <BookImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </>
  );
}
```

### `<BookExportModal>`
Componente modale per l'esportazione CSV.

**Props:**
```typescript
interface BookExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
}
```

**Funzionalità:**
- Selezione libri da esportare
- Anteprima CSV
- Download diretto
- Opzioni di formattazione

**Esempio di utilizzo:**
```typescript
import { BookExportModal } from '@/components/BookExportModal';

function ComponenteExport() {
  const { books } = useBooks();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Esporta Libreria
      </button>
      <BookExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        books={books}
      />
    </>
  );
}
```

---

## Componenti UI

### `<Button>`
Componente bottone con varianti multiple basato su Radix UI.

**Props:**
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}
```

**Esempio di utilizzo:**
```typescript
import { Button } from '@/components/ui/button';

function EsempiBottoni() {
  return (
    <div className="space-x-2">
      <Button variant="default">Predefinito</Button>
      <Button variant="outline">Contorno</Button>
      <Button variant="destructive">Elimina</Button>
      <Button variant="ghost" size="sm">Piccolo</Button>
      <Button size="icon">
        <StarIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

### `<Input>`
Componente input stilizzato.

**Props:**
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
```

**Esempio di utilizzo:**
```typescript
import { Input } from '@/components/ui/input';

function FormEsempio() {
  return (
    <div className="space-y-4">
      <Input type="text" placeholder="Titolo libro" />
      <Input type="email" placeholder="Email" />
      <Input type="number" placeholder="Numero pagine" />
    </div>
  );
}
```

### `<Select>`
Componente select con menu dropdown basato su Radix UI.

**Componenti principali:**
- `<Select>`: Container principale
- `<SelectTrigger>`: Trigger del menu
- `<SelectContent>`: Contenuto del menu
- `<SelectItem>`: Singolo elemento

**Esempio di utilizzo:**
```typescript
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

function SelettoreStato() {
  const [status, setStatus] = useState<ReadingStatus>('To Read');

  return (
    <Select value={status} onValueChange={setStatus}>
      <SelectTrigger>
        <SelectValue placeholder="Seleziona stato" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="To Read">Da Leggere</SelectItem>
        <SelectItem value="Reading">In Lettura</SelectItem>
        <SelectItem value="Read">Letto</SelectItem>
        <SelectItem value="Completed">Completato</SelectItem>
        <SelectItem value="Dropped">Abbandonato</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

### `<Dialog>`
Componente modale basato su Radix UI.

**Componenti principali:**
- `<Dialog>`: Container principale
- `<DialogTrigger>`: Elemento che apre il modale
- `<DialogContent>`: Contenuto del modale
- `<DialogHeader>`: Header del modale
- `<DialogTitle>`: Titolo del modale

**Esempio di utilizzo:**
```typescript
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';

function EsempioModale() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Apri Modale</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Titolo del Modale</DialogTitle>
        </DialogHeader>
        <div>
          <p>Contenuto del modale qui...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### `<Badge>`
Componente per etichette e tag.

**Props:**
```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}
```

**Esempio di utilizzo:**
```typescript
import { Badge } from '@/components/ui/badge';

function EsempiBadge() {
  return (
    <div className="space-x-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondario</Badge>
      <Badge variant="outline">Contorno</Badge>
      <Badge variant="destructive">Distruttivo</Badge>
    </div>
  );
}
```

### `<Card>`
Componenti per creare carte e pannelli.

**Componenti principali:**
- `<Card>`: Container principale
- `<CardHeader>`: Header della carta
- `<CardTitle>`: Titolo della carta
- `<CardContent>`: Contenuto della carta

**Esempio di utilizzo:**
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function CartaLibro({ libro }: { libro: Book }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{libro.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p><strong>Autore:</strong> {libro.author}</p>
        <p><strong>Genere:</strong> {libro.genre}</p>
        <p><strong>Stato:</strong> {libro.status}</p>
      </CardContent>
    </Card>
  );
}
```

---

## Utilità

### `bookCsvUtils.ts`
Funzioni per l'import/export CSV.

#### `importBooksFromCsv(filePath, writer)`
Importa libri da file CSV con ricerca automatica copertine.

**Parametri:**
- `filePath`: Percorso del file CSV
- `writer`: WritableStreamDefaultWriter per gli aggiornamenti di progresso

**Ritorna:**
```typescript
Promise<{
  success: number;
  errors: number;
  errorDetails: string[];
  logs: string[];
}>
```

#### `exportBooksToCsv(filePath, onProgress?)`
Esporta libri in formato CSV.

**Parametri:**
- `filePath`: Percorso di destinazione
- `onProgress`: Callback per aggiornamenti progresso

#### `parseCSVToBooks(csvContent, onProgress?)`
Converte contenuto CSV in array di libri.

**Parametri:**
- `csvContent`: Contenuto CSV come stringa
- `onProgress`: Callback per aggiornamenti progresso

### `dateFormat.ts`
Funzioni per la formattazione delle date.

#### `formatDate(date)`
Formatta una data in formato italiano.

**Esempio di utilizzo:**
```typescript
import { formatDate } from '@/utils/dateFormat';

const dataFormattata = formatDate(new Date()); // "15 marzo 2024"
```

### `badgeColors.ts`
Funzioni per la gestione dei colori dei badge di stato.

#### `getBadgeColors(status)`
Restituisce i colori appropriati per un dato stato.

**Esempio di utilizzo:**
```typescript
import { getBadgeColors } from '@/utils/badgeColors';

const colors = getBadgeColors('Reading');
// Restituisce: { bg: '#color', text: '#color', border: '#color' }
```

---

## Tipi TypeScript

### `Book`
Interfaccia principale per i libri.

```typescript
interface Book {
  id: string;
  isbn?: string;
  title: string;
  originalTitle?: string;
  subtitle?: string;
  author: string;
  authorLastFirst?: string;
  translator?: string;
  publisher?: string;
  genre?: string;
  status: ReadingStatus;
  coverUrl?: string;
  coverWidth?: number;
  coverHeight?: number;
  description?: string;
  publishedDate?: string;
  yearPublished?: number;
  language: string;
  pageCount?: number;
  rating?: number;
  location?: string;
  dateStarted?: Date;
  dateFinished?: Date;
  currentPage?: number;
  notes?: string;
  category?: string;
  wishList: boolean;
  previouslyOwned: boolean;
  upNext: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### `ReadingStatus`
Tipo per gli stati di lettura.

```typescript
type ReadingStatus = 'To Read' | 'Reading' | 'Read' | 'Completed' | 'Dropped';
```

### `SearchBookResult`
Interfaccia per i risultati di ricerca.

```typescript
interface SearchBookResult {
  title: string;
  author: string;
  isbn?: string;
  coverUrl?: string;
  description?: string;
  publishedDate?: string;
  publisher?: string;
  pageCount?: number;
  genre?: string;
  coverWidth?: number;
  coverHeight?: number;
}
```

---

## Esempi Completi

### Creare un Nuovo Libro
```typescript
import { useBooks } from '@/hooks/useBooks';
import { BookForm } from '@/components/BookForm';

function AggiungiLibro() {
  const { addBook } = useBooks();

  const handleSubmit = async (datiLibro: Omit<Book, 'id'>) => {
    try {
      await addBook(datiLibro);
      toast.success('Libro aggiunto con successo!');
      // Reindirizza alla libreria
    } catch (error) {
      toast.error('Errore durante l\'aggiunta del libro');
    }
  };

  return (
    <div>
      <h1>Aggiungi Nuovo Libro</h1>
      <BookForm onSubmit={handleSubmit} />
    </div>
  );
}
```

### Ricerca e Filtri
```typescript
import { useState } from 'react';
import { BookList } from '@/components/BookList';
import { Input } from '@/components/ui/input';

function Libreria() {
  const [ricerca, setRicerca] = useState('');

  return (
    <div>
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Cerca per titolo, autore, ISBN o posizione..."
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
        />
      </div>
      <BookList searchQuery={ricerca} />
    </div>
  );
}
```

### Import/Export CSV
```typescript
import { useState } from 'react';
import { BookImportModal } from '@/components/BookImportModal';
import { BookExportModal } from '@/components/BookExportModal';
import { useBooks } from '@/hooks/useBooks';

function GestioneLibreria() {
  const { books, refetch } = useBooks();
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);

  return (
    <div>
      <div className="space-x-4 mb-6">
        <Button onClick={() => setShowImport(true)}>
          Importa da CSV
        </Button>
        <Button onClick={() => setShowExport(true)}>
          Esporta in CSV
        </Button>
      </div>

      <BookImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImportComplete={() => {
          setShowImport(false);
          refetch();
        }}
      />

      <BookExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        books={books}
      />
    </div>
  );
}
```

---

## Note Tecniche

### Configurazione API
- **Google Books API**: Richiede chiave API configurata in `GOOGLE_BOOKS_API_KEY`
- **OpenLibrary**: Usata come fallback, non richiede autenticazione
- **Rate Limiting**: Implementato per rispettare i limiti delle API esterne

### Performance
- **Caching**: Cache in memoria per le ricerche API
- **Debouncing**: Implementato per gli input di ricerca
- **Lazy Loading**: Caricamento progressivo delle immagini
- **Paginazione**: Virtualizzazione per grandi collezioni

### Sicurezza
- **Validazione**: Tutti gli input sono validati lato client e server
- **Sanitizzazione**: Contenuti HTML sanitizzati
- **CORS**: Configurato per sicurezza API

Questa documentazione copre tutte le funzionalità pubbliche dell'applicazione. Per ulteriori dettagli implementativi, consultare il codice sorgente nei rispettivi file.