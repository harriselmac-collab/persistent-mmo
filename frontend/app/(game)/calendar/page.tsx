'use client';

import React from 'react';
import { useGameContext } from '../layout';
import { 
  Calendar, 
  Clock, 
  Vote, 
  Swords, 
  Factory, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

export default function CalendarPage() {
  const { calendarEvents } = useGameContext();

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'election': return <Vote className="h-5 w-5 text-game-gold" />;
      case 'war': return <Swords className="h-5 w-5 text-red-400" />;
      case 'production': return <Factory className="h-5 w-5 text-emerald-400" />;
      case 'maintenance': return <AlertCircle className="h-5 w-5 text-amber-400" />;
      default: return <Calendar className="h-5 w-5 text-game-gold" />;
    }
  };

  const getEventBorderColor = (type: string) => {
    switch (type) {
      case 'election': return 'border-game-gold/40';
      case 'war': return 'border-red-900/40';
      case 'production': return 'border-emerald-900/40';
      case 'maintenance': return 'border-amber-800/40';
      default: return 'border-zinc-800';
    }
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'election': return 'border-game-gold/30 text-game-gold bg-game-gold/10';
      case 'war': return 'border-red-900/30 text-red-400 bg-red-950/20';
      case 'production': return 'border-emerald-900/30 text-emerald-400 bg-emerald-950/20';
      case 'maintenance': return 'border-amber-800/30 text-amber-400 bg-amber-950/20';
      default: return 'border-zinc-700/30 text-zinc-400 bg-zinc-950';
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Header Panel */}
      <div className="rpg-panel-stone p-6 rounded-none relative overflow-hidden flex items-center gap-4 shadow-xl">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />

        <div className="p-3 border-2 border-game-gold/30 bg-zinc-950 text-game-gold relative z-10">
          <Calendar className="h-6 w-6" />
        </div>
        <div className="relative z-10">
          <h1 className="text-xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
            Kingdom Chronicles Calendar
          </h1>
          <p className="text-zinc-500 text-xs font-serif mt-0.5">
            Timeline of congressional elections, active military wars, and production windows.
          </p>
        </div>
      </div>

      {/* Timeline Layout */}
      <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-6 shadow-lg relative">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />

        <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3 relative z-10">
          Scheduled Events
        </h3>

        {/* Timeline */}
        <div className="relative border-l-2 border-game-gold/20 ml-4 pl-8 flex flex-col gap-8 relative z-10">
          {calendarEvents.map((evt) => (
            <div key={evt.id} className="relative">
              {/* Event node */}
              <span className="absolute -left-12 top-0.5 bg-zinc-950 border-2 border-game-gold/40 h-8 w-8 flex items-center justify-center shadow-lg">
                {getEventIcon(evt.type)}
              </span>

              {/* Event Card */}
              <div className={`bg-zinc-950 p-5 border-l-2 ${getEventBorderColor(evt.type)} hover:border-l-game-gold/60 transition-colors`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 border text-[9px] uppercase font-bold font-display tracking-widest ${getEventBadge(evt.type)}`}>
                      {evt.type}
                    </span>
                    <h4 className="text-sm font-bold font-display text-zinc-200">{evt.title}</h4>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-pixel">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(evt.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {evt.description && (
                  <p className="text-xs text-zinc-500 font-serif leading-relaxed mb-3">{evt.description}</p>
                )}

                <div className="flex justify-between items-center text-[9px] text-zinc-600 border-t border-zinc-900 pt-2 font-pixel">
                  <span>Starts: {new Date(evt.starts_at).toLocaleDateString()}</span>
                  {evt.ends_at && (
                    <span>Ends: {new Date(evt.ends_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {calendarEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Sparkles className="h-8 w-8 text-zinc-700" />
              <p className="text-zinc-600 text-xs font-serif">No events scheduled on the chronicles list.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
