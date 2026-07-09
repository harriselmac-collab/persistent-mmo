'use client';

import React, { useState } from 'react';
import { useGameContext } from '../layout';
import { 
  Smartphone, Bell, Scale, Mail, MessageSquare, Factory, ShieldAlert,
  Battery, Wifi, ArrowLeft, ChevronRight, Eye
} from 'lucide-react';

export default function MobileCompanionPage() {
  const {
    profile, resources, itemTemplates, marketListings,
    playerMail, conversationThreads, myCompanies, battles
  } = useGameContext();

  const [activeScreen, setActiveScreen] = useState<'home' | 'notifications' | 'market' | 'mail' | 'chat' | 'production' | 'combat'>('home');
  const [selectedCombatLog, setSelectedCombatLog] = useState<any | null>(null);
  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="rpg-panel-stone p-6 rounded-none relative overflow-hidden flex flex-col items-center gap-2 shadow-xl">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-3 border-2 border-game-gold/30 bg-zinc-950 text-game-gold">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
              Aegis Mobile Companion Simulator
            </h1>
            <p className="text-zinc-500 text-xs font-serif mt-0.5">Simulated smartphone viewport of the Aegis Kingdoms companion app. Track queues, check chats, and trade on the go.</p>
          </div>
        </div>
      </div>

      {/* Phone Frame */}
      <div className="flex justify-center py-4">
        <div className="w-[310px] h-[610px] rounded-[36px] bg-zinc-950 border-[6px] border-zinc-800 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden select-none">
          
          {/* Speaker Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-28 bg-zinc-800 rounded-b-xl z-20 flex items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-900 mr-2" />
            <span className="h-1 w-10 bg-zinc-900 rounded" />
          </div>

          {/* Status Bar */}
          <div className="h-9 pt-2.5 px-6 flex justify-between items-center text-[10px] text-zinc-400 z-10 bg-zinc-950 select-none">
            <span className="font-semibold">{timeString}</span>
            <div className="flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              <Battery className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Screen Content */}
          <div className="flex-1 bg-zinc-900 text-zinc-100 flex flex-col relative overflow-hidden font-sans">
            
            {activeScreen !== 'home' && (
              <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-850 flex items-center gap-2">
                <button onClick={() => { if (selectedCombatLog) setSelectedCombatLog(null); else setActiveScreen('home'); }} className="text-zinc-400 hover:text-zinc-200">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  {selectedCombatLog ? 'Combat Log' : `${activeScreen} Screen`}
                </h3>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 text-xs">

              {/* HOME */}
              {activeScreen === 'home' && (
                <div className="space-y-6 pt-2">
                  <div className="text-center space-y-1">
                    <div className="h-12 w-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto text-sm font-bold text-zinc-400">
                      {profile?.username?.slice(0, 2).toUpperCase() || 'AE'}
                    </div>
                    <h2 className="text-sm font-bold text-zinc-200">{profile?.username || 'Aegis Citizen'}</h2>
                    <p className="text-[10px] text-zinc-500">Connected Frequency</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    {[
                      { screen: 'notifications', icon: Bell, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/25', label: 'Alerts' },
                      { screen: 'market', icon: Scale, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/25', label: 'Market' },
                      { screen: 'mail', icon: Mail, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/25', label: 'Mail' },
                      { screen: 'chat', icon: MessageSquare, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/25', label: 'Guild Chat' },
                      { screen: 'production', icon: Factory, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25', label: 'Queues' },
                      { screen: 'combat', icon: ShieldAlert, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/25', label: 'Combat Feed' },
                    ].map((app) => (
                      <div key={app.screen} onClick={() => setActiveScreen(app.screen as any)} className="cursor-pointer space-y-1 hover:opacity-80 transition-opacity">
                        <div className={`h-12 w-12 rounded-xl ${app.bg} border flex items-center justify-center mx-auto ${app.color}`}>
                          <app.icon className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] text-zinc-400 font-semibold block">{app.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS */}
              {activeScreen === 'notifications' && (
                <div className="space-y-2 text-left">
                  {[
                    { title: 'Territory Attack Warning', body: 'Region #4 Vanguard is contested by Allied Army Units!' },
                    { title: 'Market Order Filled', body: 'Your buy order for Tool Steel has been completed successfully.' },
                  ].map((n, i) => (
                    <div key={i} className="bg-zinc-950 p-3 rounded border border-zinc-850 space-y-1">
                      <p className="font-semibold text-zinc-300">{n.title}</p>
                      <p className="text-[10px] text-zinc-500">{n.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* MARKET */}
              {activeScreen === 'market' && (
                <div className="space-y-3 text-left">
                  <h4 className="text-xs font-bold text-zinc-400 border-b border-zinc-850 pb-1.5">Exchange Summary</h4>
                  <div className="space-y-2">
                    {marketListings.slice(0, 4).map((listing) => {
                      const res = resources.find((r) => r.id === listing.resource_id);
                      return (
                        <div key={listing.id} className="bg-zinc-950 p-2.5 rounded border border-zinc-850 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-zinc-300">{res?.name || `Listing #${listing.id}`}</p>
                            <p className="text-[9px] text-zinc-500">Qty: {listing.quantity}</p>
                          </div>
                          <span className="text-xs font-bold text-amber-400 font-mono">${listing.price_per_unit}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MAIL */}
              {activeScreen === 'mail' && (
                <div className="space-y-2 text-left">
                  {playerMail.slice(0, 5).map((mail) => (
                    <div key={mail.id} className="bg-zinc-950 p-3 rounded border border-zinc-850 space-y-1 hover:border-zinc-800 transition">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-zinc-300">{mail.subject}</span>
                        <span className="text-[8px] text-zinc-600">{new Date(mail.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate">{mail.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* CHAT */}
              {activeScreen === 'chat' && (
                <div className="space-y-2 text-left">
                  {conversationThreads.slice(0, 4).map((thread) => (
                    <div key={thread.id} className="bg-zinc-950 p-3 rounded border border-zinc-850 flex justify-between items-center hover:border-zinc-800 transition">
                      <div>
                        <p className="font-semibold text-zinc-300">{thread.title}</p>
                        <p className="text-[9px] text-zinc-500 truncate max-w-[150px]">{thread.last_message || 'Frequency idle.'}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-600" />
                    </div>
                  ))}
                </div>
              )}

              {/* PRODUCTION */}
              {activeScreen === 'production' && (
                <div className="space-y-3 text-left">
                  <h4 className="text-xs font-bold text-zinc-400 border-b border-zinc-850 pb-1.5">My Companies</h4>
                  <div className="space-y-2">
                    {myCompanies.slice(0, 3).map((comp) => {
                      const itemTemp = itemTemplates.find(it => it.id === comp.item_template_id);
                      return (
                        <div key={comp.id} className="bg-zinc-950 p-3 rounded border border-zinc-850 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-zinc-300">{comp.name}</span>
                            <span className="text-[9px] text-zinc-500 uppercase">{itemTemp?.name || 'Production'}</span>
                          </div>
                          <div className="bg-zinc-900 p-2 rounded text-[10px] text-zinc-500 border border-zinc-850 flex justify-between items-center">
                            <span>Shift queue status</span>
                            <span className="text-emerald-400 font-semibold font-mono">IDLE</span>
                          </div>
                        </div>
                      );
                    })}
                    {myCompanies.length === 0 && (
                      <p className="text-zinc-600 text-[10px] text-center">No companies found.</p>
                    )}
                  </div>
                </div>
              )}

              {/* COMBAT */}
              {activeScreen === 'combat' && (
                <div className="space-y-2 text-left">
                  {selectedCombatLog ? (
                    <div className="bg-zinc-950 p-3 rounded border border-zinc-850 space-y-3">
                      <button onClick={() => setSelectedCombatLog(null)} className="text-[10px] text-zinc-500 flex items-center gap-1">
                        ← Back to lists
                      </button>
                      <h4 className="font-bold text-zinc-200 border-b border-zinc-900 pb-1.5">Battle for {selectedCombatLog.region_name} Report</h4>
                      <p className="text-[10px] text-zinc-400">Battle resolved at regional borders. Rewards parsed to backpack.</p>
                      <div className="space-y-1 text-[9px] font-mono text-zinc-500">
                        <p>Round 1: Player inflicted 45 dmg.</p>
                        <p>Round 2: Monster inflicted 12 dmg.</p>
                        <p>Battle Success! Loot item steel ore generated.</p>
                      </div>
                    </div>
                  ) : (
                    battles.slice(0, 5).map((bat) => (
                      <div
                        key={bat.id}
                        onClick={() => setSelectedCombatLog(bat)}
                        className="bg-zinc-950 p-3 rounded border border-zinc-850 flex justify-between items-center hover:border-zinc-800 transition cursor-pointer"
                      >
                        <div>
                          <p className="font-semibold text-zinc-300">Battle for {bat.region_name}</p>
                          <p className="text-[9px] text-zinc-500 capitalize">Status: {bat.status}</p>
                        </div>
                        <Eye className="h-3.5 w-3.5 text-zinc-500" />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Nav Bar */}
            <div className="h-11 bg-zinc-950 border-t border-zinc-900 flex justify-center items-center">
              <button
                onClick={() => { setSelectedCombatLog(null); setActiveScreen('home'); }}
                className="h-10 w-10 rounded-full flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 transition border border-zinc-850 text-zinc-400"
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
