import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Book, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useBooks } from "@/hooks/useBooks";
import { formatDate } from "@/utils/dateFormat";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function BookList() {
  const { books } = useBooks();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBooks = books?.filter((book) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      book.title.toLowerCase().includes(searchTermLower) ||
      book.author.toLowerCase().includes(searchTermLower) ||
      book.isbn?.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Cerca per titolo, autore o ISBN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-hover pl-10 bg-white/10 text-white placeholder:text-gray-400"
        />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5"
      >
        {filteredBooks?.map((book) => (
          <motion.div key={book.id} variants={item}>
            <Link href={`/books/${book.id}`}>
              <div className="book-card">
                <div className="relative aspect-[2/3] max-h-[300px] overflow-hidden rounded-lg">
                  {book.coverUrl ? (
                    <Image
                      src={book.coverUrl}
                      alt={book.title}
                      fill
                      className="book-image object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://via.placeholder.com/300x450?text=No+Cover";
                        target.classList.add("opacity-50");
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-800">
                      <Book className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  <div className="book-info">
                    <h3 className="text-lg font-semibold line-clamp-2">{book.title}</h3>
                    <p className="mt-1 text-sm text-gray-300">{book.author}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {book.status && (
                        <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-200">
                          {book.status}
                        </span>
                      )}
                      {book.genre && (
                        <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-200">
                          {book.genre}
                        </span>
                      )}
                    </div>
                    {(book.publisher || book.publishedDate || book.pageCount) && (
                      <div className="mt-2 space-y-1 text-xs text-gray-300">
                        {book.publisher && <p>{book.publisher}</p>}
                        <div className="flex gap-3">
                          {book.publishedDate && <p>{formatDate(book.publishedDate)}</p>}
                          {book.pageCount > 0 && <p>{book.pageCount} pagine</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {filteredBooks?.length === 0 && (
        <div className="text-center py-12">
          <Book className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-white">Nessun libro trovato</h3>
          <p className="mt-2 text-gray-400">
            Prova a modificare i criteri di ricerca o aggiungi nuovi libri
          </p>
        </div>
      )}
    </div>
  );
}
