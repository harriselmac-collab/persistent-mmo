'use client';

import React, { useState } from 'react';
import { useGameContext } from '../layout';
import { 
  Inbox, Send, Coins, Award, Box, ArrowLeft, MailOpen, Mail, Feather
} from 'lucide-react';

export default function MailboxPage() {
  const { profile, inventory, itemTemplates, playerMail, sendMail, claimMailAttachments, refreshData } = useGameContext();

  const [activeMailId, setActiveMailId] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);

  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachCurrency, setAttachCurrency] = useState(0);
  const [attachGold, setAttachGold] = useState(0);
  const [attachItemId, setAttachItemId] = useState<number | null>(null);
  const [attachQty, setAttachQty] = useState(0);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const activeMail = playerMail.find(m => m.id === activeMailId);

  const showStatus = (text: string, ok: boolean) => { setStatusMsg({ text, ok }); setTimeout(() => setStatusMsg(null), 3000); };

  const handleComposeMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId || !subject || !body) return;
    const res = await sendMail(recipientId, subject, body, attachCurrency, attachGold, attachItemId || undefined, attachQty);
    if (res.success) {
      setComposing(false);
      setRecipientId(''); setSubject(''); setBody('');
      setAttachCurrency(0); setAttachGold(0); setAttachItemId(null); setAttachQty(0);
      showStatus('Mail dispatched successfully!', true);
      refreshData();
    } else {
      showStatus(res.error || 'Failed to send mail.', false);
    }
  };

  const handleClaim = async (mailId: number) => {
    const res = await claimMailAttachments(mailId);
    if (res.success) { showStatus('Attachments claimed successfully!', true); refreshData(); }
    else showStatus(res.error || 'Failed to claim attachments.', false);
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="rpg-panel-stone p-6 rounded-none relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 border-2 border-game-gold/30 bg-zinc-950 text-game-gold">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
              Aegis Mailbox
            </h1>
            <p className="text-zinc-500 text-xs font-serif mt-0.5">Dispatched letters, government notices, and item transfers.</p>
          </div>
        </div>

        <button
          onClick={() => { setComposing(!composing); setActiveMailId(null); }}
          className="rpg-button rpg-button-emerald px-4 py-2.5 text-[9px] tracking-widest flex items-center gap-2 relative z-10"
        >
          {composing ? (
            <><Inbox className="h-4 w-4" /> Back to Inbox</>
          ) : (
            <><Feather className="h-4 w-4" /> Write Letter</>
          )}
        </button>
      </div>

      {/* Status Banner */}
      {statusMsg && (
        <div className={`px-4 py-3 border-l-4 text-xs font-bold font-display uppercase tracking-widest flex items-center gap-2 ${
          statusMsg.ok ? 'border-game-emerald bg-emerald-950/30 text-emerald-400' : 'border-red-600 bg-red-950/30 text-red-400'
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Main Pane (2 cols) */}
        <div className="md:col-span-2">
          {composing ? (
            <form onSubmit={handleComposeMail} className="rpg-panel-stone p-6 rounded-none flex flex-col gap-5 shadow-lg relative">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <h2 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3 flex items-center gap-2 relative z-10">
                <Send className="h-4 w-4" /> Dispatch New Letter
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Recipient Player UUID</label>
                  <input type="text" required value={recipientId} onChange={(e) => setRecipientId(e.target.value)} placeholder="Recipient's UUID..." className="rpg-input px-3 py-2 text-xs w-full" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Subject</label>
                  <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject title..." className="rpg-input px-3 py-2 text-xs w-full" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 relative z-10">
                <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Letter Body</label>
                <textarea required value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message..." className="rpg-input px-3 py-2 text-xs w-full h-32 resize-none" />
              </div>

              {/* Attachments */}
              <div className="bg-zinc-950 border border-game-gold/15 p-4 flex flex-col gap-3 relative z-10">
                <h3 className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Attached Cargo (Optional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { icon: Coins, label: 'Currency ($)', val: attachCurrency, set: setAttachCurrency },
                    { icon: Award, label: 'Gold (G)', val: attachGold, set: setAttachGold },
                  ].map((f, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <label className="text-[9px] text-zinc-500 flex items-center gap-1 font-display">
                        <f.icon className="h-3.5 w-3.5 text-game-gold" /> {f.label}
                      </label>
                      <input type="number" min={0} value={f.val} onChange={(e) => f.set(Number(e.target.value))} className="rpg-input px-2 py-1.5 text-xs w-full" />
                    </div>
                  ))}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-zinc-500 flex items-center gap-1 font-display">
                      <Box className="h-3.5 w-3.5 text-game-gold" /> Item
                    </label>
                    <select value={attachItemId || ''} onChange={(e) => setAttachItemId(e.target.value ? Number(e.target.value) : null)} className="rpg-input px-2 py-1.5 text-xs w-full">
                      <option value="">No item</option>
                      {itemTemplates.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                </div>
                {attachItemId && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-zinc-500 font-display tracking-widest">Attachment Quantity</label>
                    <input type="number" min={1} value={attachQty} onChange={(e) => setAttachQty(Number(e.target.value))} className="rpg-input px-2 py-1.5 text-xs w-24" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 relative z-10">
                <button type="button" onClick={() => setComposing(false)} className="rpg-button px-4 py-2 text-[9px] tracking-widest opacity-60">Cancel</button>
                <button type="submit" className="rpg-button rpg-button-emerald px-6 py-2 text-[9px] tracking-widest">Dispatch Mail</button>
              </div>
            </form>
          ) : activeMail ? (
            <div className="rpg-panel-parchment p-6 rounded-none flex flex-col gap-5 shadow-lg relative">
              <button onClick={() => setActiveMailId(null)} className="text-xs text-amber-900/70 hover:text-amber-950 flex items-center gap-1 font-serif">
                <ArrowLeft className="h-4 w-4" /> Back to Inbox
              </button>

              <div className="border-b border-amber-950/20 pb-4">
                <h2 className="text-xl font-bold font-display text-amber-950">{activeMail.subject}</h2>
                <div className="flex justify-between items-center text-xs text-amber-950/60 font-serif mt-2">
                  <span>From: <span className="font-bold text-amber-950">{activeMail.sender_name || 'System'}</span></span>
                  <span>{new Date(activeMail.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="text-amber-950/80 text-xs font-serif leading-relaxed whitespace-pre-line bg-amber-950/5 p-4 border border-amber-950/10 h-48 overflow-y-auto">
                {activeMail.body}
              </div>

              {(activeMail.attached_currency > 0 || activeMail.attached_gold > 0 || activeMail.attached_item_template_id) && (
                <div className="border border-amber-950/20 bg-amber-950/10 p-4 flex flex-col gap-3">
                  <h4 className="text-[9px] uppercase font-bold font-display text-amber-950 tracking-widest">Attachments Package</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {activeMail.attached_currency > 0 && (
                      <div className="bg-amber-950/10 border border-amber-950/15 p-2.5 flex items-center gap-2">
                        <Coins className="h-4 w-4 text-amber-800" />
                        <div><p className="text-[9px] text-amber-900/70 font-serif">Currency</p><p className="text-xs font-bold text-amber-950">${activeMail.attached_currency}</p></div>
                      </div>
                    )}
                    {activeMail.attached_gold > 0 && (
                      <div className="bg-amber-950/10 border border-amber-950/15 p-2.5 flex items-center gap-2">
                        <Award className="h-4 w-4 text-amber-700" />
                        <div><p className="text-[9px] text-amber-900/70 font-serif">Gold</p><p className="text-xs font-bold text-amber-800">{activeMail.attached_gold} G</p></div>
                      </div>
                    )}
                    {activeMail.attached_item_template_id && (
                      <div className="bg-amber-950/10 border border-amber-950/15 p-2.5 flex items-center gap-2">
                        <Box className="h-4 w-4 text-amber-800" />
                        <div><p className="text-[9px] text-amber-900/70 font-serif">{activeMail.item_name || 'Item'}</p><p className="text-xs font-bold text-amber-950">Qty: {activeMail.attached_item_qty}</p></div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleClaim(activeMail.id)}
                      disabled={activeMail.is_claimed}
                      className={`rpg-button px-4 py-2 text-[9px] tracking-widest ${activeMail.is_claimed ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {activeMail.is_claimed ? 'Attachments Claimed' : 'Claim Items'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rpg-panel-stone p-12 rounded-none flex flex-col justify-center items-center gap-4 text-center shadow-lg relative h-[400px]">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />
              <Inbox className="h-12 w-12 text-zinc-700 relative z-10" />
              <div className="relative z-10">
                <h4 className="font-bold font-display text-zinc-400">Select a Letter</h4>
                <p className="text-xs text-zinc-600 font-serif mt-1 max-w-[280px]">
                  Click any incoming mail to view detailed contents, notices, and attachments.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Inbox List */}
        <div className="rpg-panel-stone p-4 rounded-none flex flex-col gap-3 shadow-lg relative">
          <div className="rpg-rivet top-1 left-1" />
          <div className="rpg-rivet top-1 right-1" />
          <div className="rpg-rivet bottom-1 left-1" />
          <div className="rpg-rivet bottom-1 right-1" />

          <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3 relative z-10">Inbox</h3>
          <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1 relative z-10">
            {playerMail.map((mail) => {
              const isSelected = mail.id === activeMailId;
              const hasAttachment = mail.attached_currency > 0 || mail.attached_gold > 0 || mail.attached_item_template_id;
              return (
                <div
                  key={mail.id}
                  onClick={() => { setActiveMailId(mail.id); setComposing(false); }}
                  className={`p-3 border cursor-pointer transition-all text-left flex flex-col gap-1.5 ${
                    isSelected
                      ? 'border-game-gold/50 bg-game-gold/5'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      {mail.is_read ? (
                        <MailOpen className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                      ) : (
                        <Mail className="h-3.5 w-3.5 text-game-gold shrink-0" />
                      )}
                      <p className={`text-xs font-bold font-display truncate max-w-[120px] ${mail.is_read ? 'text-zinc-500' : 'text-zinc-200'}`}>
                        {mail.subject}
                      </p>
                    </div>
                    <span className="text-[9px] text-zinc-600 font-pixel shrink-0">{new Date(mail.created_at).toLocaleDateString()}</span>
                  </div>

                  <p className="text-[9px] text-zinc-600 font-serif truncate">{mail.body}</p>

                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-zinc-600 font-serif">By: {mail.sender_name || 'System'}</span>
                    {hasAttachment && (
                      <span className={`px-1.5 py-0.5 border font-display font-bold uppercase tracking-widest text-[8px] ${
                        mail.is_claimed ? 'border-zinc-700 text-zinc-600' : 'border-game-gold/30 text-game-gold bg-game-gold/10'
                      }`}>Cargo</span>
                    )}
                  </div>
                </div>
              );
            })}
            {playerMail.length === 0 && (
              <p className="text-zinc-600 text-xs py-8 text-center font-serif">Inbox is empty.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
