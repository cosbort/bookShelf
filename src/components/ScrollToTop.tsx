'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.pageYOffset > 300) {
        setShow(true);
      } else {
        setShow(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Pulisci l'event listener quando il componente viene smontato
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Button
      variant="default"
      size="icon"
      className={cn(
        'fixed bottom-8 right-8 z-50 h-10 w-10 rounded-full transition-all duration-300',
        'bg-emerald-600 hover:bg-emerald-700 shadow-lg',
        show ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
      )}
      onClick={handleClick}
      aria-label="Torna in cima"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}
