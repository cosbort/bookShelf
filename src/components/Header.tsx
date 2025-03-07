'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, Sun, Moon, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Evita errori di hydration aspettando il montaggio del componente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-[hsl(var(--primary))]" />
            <span className="font-bold text-lg">BookShelf</span>
          </Link>
        </div>

        {/* Menu desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/books" 
            className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
          >
            Libri
          </Link>
          <Link 
            href="/categories" 
            className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
          >
            Categorie
          </Link>
          <Link 
            href="/authors" 
            className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
          >
            Autori
          </Link>
          
          {/* Theme toggle */}
          {isMounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full hover:bg-[hsl(var(--primary))]/10"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-[#F9D71C]" />
              ) : (
                <Moon className="h-5 w-5 text-[hsl(var(--primary))]" />
              )}
              <span className="sr-only">Cambia tema</span>
            </Button>
          )}
        </nav>

        {/* Menu mobile */}
        <div className="md:hidden flex items-center">
          {isMounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full mr-2 hover:bg-[hsl(var(--primary))]/10"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-[#F9D71C]" />
              ) : (
                <Moon className="h-5 w-5 text-[hsl(var(--primary))]" />
              )}
              <span className="sr-only">Cambia tema</span>
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMenu}
            className="rounded-full"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
            <span className="sr-only">Menu</span>
          </Button>
        </div>
      </div>

      {/* Menu mobile dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]"
          >
            <div className="container px-4 py-4 flex flex-col space-y-4">
              <Link 
                href="/books" 
                className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Libri
              </Link>
              <Link 
                href="/categories" 
                className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Categorie
              </Link>
              <Link 
                href="/authors" 
                className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Autori
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
