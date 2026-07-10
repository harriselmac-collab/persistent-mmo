'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QuestsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard?tab=quests');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="animate-pulse text-xs text-game-gold font-serif">Relocating coordinates to Storyline Chronicles...</div>
    </div>
  );
}
