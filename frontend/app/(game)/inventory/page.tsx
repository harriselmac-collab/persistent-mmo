'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InventoryPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard?tab=inventory');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="animate-pulse text-xs text-game-gold font-serif">Relocating coordinates to Cargo Bay...</div>
    </div>
  );
}
