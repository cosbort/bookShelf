import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { fontSans } from "@/lib/fonts";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="dark">
      <body className={cn("min-h-screen bg-slate-950 font-sans antialiased", fontSans.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative min-h-screen">
            <Navbar />
            {children}
          </div>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
