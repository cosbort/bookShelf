import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'BookShelf',
  description: 'Your personal book collection manager',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body 
        className={cn(
          inter.className,
          "min-h-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800",
          "flex flex-col antialiased"
        )}
      >
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
