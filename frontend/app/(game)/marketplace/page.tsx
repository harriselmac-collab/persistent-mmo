'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MarketplacePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard?tab=economy');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="animate-pulse text-xs text-game-gold font-serif">Relocating coordinates to Regional Trade Market...</div>
    </div>
  );
}
