import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 overflow-hidden bg-zinc-950">
      {/* RPG Embers Animation Overlay */}
      <div className="rpg-embers-container">
        <div className="rpg-ember" style={{ left: '10%', animationDelay: '0s', animationDuration: '14s' }} />
        <div className="rpg-ember" style={{ left: '25%', animationDelay: '2s', animationDuration: '18s' }} />
        <div className="rpg-ember" style={{ left: '45%', animationDelay: '5s', animationDuration: '16s' }} />
        <div className="rpg-ember" style={{ left: '65%', animationDelay: '1s', animationDuration: '22s' }} />
        <div className="rpg-ember" style={{ left: '80%', animationDelay: '7s', animationDuration: '15s' }} />
        <div className="rpg-ember" style={{ left: '90%', animationDelay: '3s', animationDuration: '20s' }} />
      </div>

      {/* Decorative Vignette Shadow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(0,0,0,0.85)_100%)] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Ornate Fantasy Crest Logo */}
        <Link href="/" className="flex flex-col items-center gap-2 mb-8 group select-none">
          <img
            src="/assets/branding/aegis-crest-full.png"
            alt="Aegis Kingdoms Crest"
            className="h-28 w-auto object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] group-hover:drop-shadow-[0_0_15px_rgba(229,193,88,0.3)] transition-all duration-350"
          />
          <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-sans">
            Closed Alpha Terminal
          </span>
        </Link>

        {/* Ornate Wood Frame Container */}
        <div className="w-full rpg-panel-wood p-8 shadow-2xl relative">
          {/* Corner Rivets */}
          <div className="rpg-rivet top-1.5 left-1.5" />
          <div className="rpg-rivet top-1.5 right-1.5" />
          <div className="rpg-rivet bottom-1.5 left-1.5" />
          <div className="rpg-rivet bottom-1.5 right-1.5" />

          {/* Children container */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

