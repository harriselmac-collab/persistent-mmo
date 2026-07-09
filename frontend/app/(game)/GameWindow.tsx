'use client';

import React, { useEffect, useRef } from 'react';
import { X, Minus, Square, Shield } from 'lucide-react';

interface GameWindowProps {
  title: string;
  pathname: string;
  children: React.ReactNode;
  isActive: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  maximized: boolean;
  zIndex: number;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onUpdateLayout: (layout: { x?: number; y?: number; width?: number; height?: number }) => void;
}

export default function GameWindow({
  title,
  pathname,
  children,
  isActive,
  position,
  size,
  maximized,
  zIndex,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onUpdateLayout,
}: GameWindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Dragging logic - restricted to the central clear channel between left and right HUD columns
  useEffect(() => {
    const header = headerRef.current;
    if (!header || maximized) return;

    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;

      startX = e.clientX;
      startY = e.clientY;
      initialX = position.x;
      initialY = position.y;

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      onFocus();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      // Clamp coordinates to center clear area: left 350px, right 350px, top 80px, bottom 110px
      const minX = 350;
      const maxX = Math.max(350, window.innerWidth - size.width - 350);
      const minY = 80;
      const maxY = Math.max(80, window.innerHeight - size.height - 110);

      const newX = Math.max(minX, Math.min(maxX, initialX + dx));
      const newY = Math.max(minY, Math.min(maxY, initialY + dy));
      
      onUpdateLayout({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    header.addEventListener('mousedown', handleMouseDown);
    return () => {
      header.removeEventListener('mousedown', handleMouseDown);
    };
  }, [position, size, maximized, onFocus, onUpdateLayout]);

  // Resizing logic - restricted to the central channel width and height constraints
  useEffect(() => {
    const el = windowRef.current;
    if (!el || maximized) return;

    const resizeObserver = new ResizeObserver(() => {
      const currentWidth = el.offsetWidth;
      const currentHeight = el.offsetHeight;
      
      const maxWidth = Math.max(500, window.innerWidth - 700);
      const maxHeight = Math.max(350, window.innerHeight - 200);

      // Constraints
      const boundedWidth = Math.max(500, Math.min(maxWidth, currentWidth));
      const boundedHeight = Math.max(350, Math.min(maxHeight, currentHeight));

      if (boundedWidth !== size.width || boundedHeight !== size.height) {
        onUpdateLayout({ width: boundedWidth, height: boundedHeight });
      }
    });

    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, [maximized, size.width, size.height, onUpdateLayout]);

  const getStyle = (): React.CSSProperties => {
    if (maximized) {
      return {
        top: '80px',
        left: '350px',
        width: 'calc(100vw - 700px)',
        height: 'calc(100vh - 190px)',
        zIndex: zIndex,
      };
    }

    return {
      top: `${position.y}px`,
      left: `${position.x}px`,
      width: `${size.width}px`,
      height: `${size.height}px`,
      zIndex: zIndex,
      resize: 'both',
      overflow: 'hidden',
    };
  };

  return (
    <div
      ref={windowRef}
      style={getStyle()}
      className={`game-window ${isActive ? 'game-window-active' : ''} border-3 rounded-none`}
      onClick={onFocus}
    >
      {/* Corner rivets */}
      <div className="absolute w-1.5 h-1.5 bg-game-gold rounded-full top-0.5 left-0.5" />
      <div className="absolute w-1.5 h-1.5 bg-game-gold rounded-full top-0.5 right-0.5" />
      <div className="absolute w-1.5 h-1.5 bg-game-gold rounded-full bottom-0.5 left-0.5" />
      <div className="absolute w-1.5 h-1.5 bg-game-gold rounded-full bottom-0.5 right-0.5" />

      {/* Header */}
      <div
        ref={headerRef}
        className="game-window-header h-11 flex items-center justify-between px-5 select-none relative z-10 border-b-2"
      >
        <div className="flex items-center gap-2">
          <Shield className="h-4.5 w-4.5 text-game-gold animate-pulse" />
          <span className="text-xs font-bold font-display text-game-gold tracking-widest uppercase filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onMinimize}
            title="Minimize to dock"
            className="p-1 border border-zinc-800 hover:border-game-gold bg-zinc-950 text-zinc-400 hover:text-white cursor-pointer transition-colors"
          >
            <Minus className="h-3 w-3" />
          </button>
          <button
            onClick={onMaximize}
            title={maximized ? 'Restore window' : 'Maximize window'}
            className="p-1 border border-zinc-800 hover:border-game-gold bg-zinc-950 text-zinc-400 hover:text-white cursor-pointer transition-colors"
          >
            <Square className="h-3 w-3" />
          </button>
          <button
            onClick={onClose}
            title="Close window"
            className="p-1 border border-zinc-800 hover:border-red-500 bg-zinc-950 text-zinc-400 hover:text-red-500 cursor-pointer transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Window Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/95 relative z-0 shadow-inner">
        {children}
      </div>
    </div>
  );
}
