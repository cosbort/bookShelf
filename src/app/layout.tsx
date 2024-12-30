import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BookShelf - La tua libreria personale",
  description: "Gestisci la tua collezione di libri con stile",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="dark">
      <body className={`${inter.className} bg-library min-h-screen`}>
        <div className="mx-auto max-w-7xl px-4 py-8">
          <header className="mb-8">
            <div className="glass-effect rounded-lg p-6 text-center">
              <h1 className="text-4xl font-bold text-white">BookShelf</h1>
              <p className="mt-2 text-gray-200">La tua libreria personale</p>
            </div>
          </header>
          <main className="glass-effect rounded-lg p-6">
            <div className="page-transition">{children}</div>
          </main>
        </div>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
