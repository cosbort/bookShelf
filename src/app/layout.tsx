import "./globals.css";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";
import { Providers } from "./providers";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "BookShelf - La tua libreria personale",
  description: "Gestisci la tua collezione personale di libri",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-[hsl(var(--background))] font-sans antialiased selection:bg-[hsl(var(--primary))] selection:text-[hsl(var(--primary-foreground))]",
          fontSans.variable
        )}
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col bg-[hsl(var(--background))]">
            <Header />
            <main className="flex-1 w-full container mx-auto px-4 py-6">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
