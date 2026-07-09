'use client';

import React, { useState } from 'react';
import { useGameContext } from '../layout';
import { 
  FileText, PlusCircle, Coins, Award, Clock, ShieldCheck, XCircle, CheckCircle, AlertCircle
} from 'lucide-react';

export default function ContractsPage() {
  const { profile, contracts, createContract, acceptContract, completeContract, actionLoading, refreshData } = useGameContext();

  const [creating, setCreating] = useState(false);
  const [contractType, setContractType] = useState('supply');
  const [termsInput, setTermsInput] = useState('');
  const [escrowLocal, setEscrowLocal] = useState(0);
  const [escrowGold, setEscrowGold] = useState(0);
  const [daysDeadline, setDaysDeadline] = useState(3);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const showStatus = (text: string, ok: boolean) => { setStatusMsg({ text, ok }); setTimeout(() => setStatusMsg(null), 3000); };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    let terms = {};
    try { terms = termsInput ? JSON.parse(termsInput) : { description: 'Custom player agreement terms' }; }
    catch { terms = { description: termsInput || 'Custom player agreement terms' }; }
    const deadlineDate = new Date(Date.now() + 86400000 * daysDeadline).toISOString();
    const res = await createContract(contractType, terms, escrowLocal, escrowGold, deadlineDate);
    if (res.success) { setCreating(false); setTermsInput(''); setEscrowLocal(0); setEscrowGold(0); setDaysDeadline(3); showStatus('Contract created and listed!', true); refreshData(); }
    else showStatus(res.error || 'Failed to register contract.', false);
  };

  const handleAccept = async (id: number) => {
    const res = await acceptContract(id);
    if (res.success) { showStatus('Contract accepted! You are now bound by the terms.', true); refreshData(); }
    else showStatus(res.error || 'Failed to accept contract.', false);
  };

  const handleComplete = async (id: number) => {
    const res = await completeContract(id);
    if (res.success) { showStatus('Contract completed. Escrow released!', true); refreshData(); }
    else showStatus(res.error || 'Failed to complete contract.', false);
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
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
              Legal & Contracts Console
            </h1>
            <p className="text-zinc-500 text-xs font-serif mt-0.5">Bind agreements with players under automated escrow parameters.</p>
          </div>
        </div>

        <button
          onClick={() => setCreating(!creating)}
          className="rpg-button rpg-button-emerald px-4 py-2.5 text-[9px] tracking-widest flex items-center gap-2 relative z-10"
        >
          {creating ? <><AlertCircle className="h-4 w-4" /> Back to Dashboard</> : <><PlusCircle className="h-4 w-4" /> Create Contract Proposal</>}
        </button>
      </div>

      {/* Status Banner */}
      {statusMsg && (
        <div className={`px-4 py-3 border-l-4 text-xs font-bold font-display uppercase tracking-widest ${
          statusMsg.ok ? 'border-game-emerald bg-emerald-950/30 text-emerald-400' : 'border-red-600 bg-red-950/30 text-red-400'
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Pane */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {creating ? (
            <form onSubmit={handleCreateContract} className="rpg-panel-stone p-6 rounded-none flex flex-col gap-5 shadow-lg relative">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <h2 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3 flex items-center gap-2 relative z-10">
                <PlusCircle className="h-4 w-4" /> Draft New Escrow Contract
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Contract Category</label>
                  <select value={contractType} onChange={(e) => setContractType(e.target.value)} className="rpg-input px-3 py-2 text-xs w-full">
                    <option value="employment">Employment Contract</option>
                    <option value="supply">Material Supply Contract</option>
                    <option value="manufacturing">Manufacturing Deal</option>
                    <option value="military">Military Service Agreement</option>
                    <option value="transportation">Logistics/Transportation</option>
                    <option value="custom">Custom Deal</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Deadline Duration (Days)</label>
                  <input type="number" min={1} required value={daysDeadline} onChange={(e) => setDaysDeadline(Number(e.target.value))} className="rpg-input px-3 py-2 text-xs w-full" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 relative z-10">
                <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Terms (Plain text or JSON)</label>
                <textarea required value={termsInput} onChange={(e) => setTermsInput(e.target.value)} placeholder="Describe deliverables, specifications, or quotas..." className="rpg-input px-3 py-2 text-xs w-full h-28 resize-none" />
              </div>

              {/* Escrow */}
              <div className="bg-zinc-950 border border-game-gold/15 p-4 flex flex-col gap-3 relative z-10">
                <h4 className="text-[9px] uppercase font-bold font-display text-game-gold tracking-widest">Escrow Deposit Locks</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-zinc-500 flex items-center gap-1 font-display"><Coins className="h-3.5 w-3.5 text-game-gold" /> Escrow Currency ($)</label>
                    <input type="number" min={0} value={escrowLocal} onChange={(e) => setEscrowLocal(Number(e.target.value))} className="rpg-input px-3 py-2 text-xs w-full" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-zinc-500 flex items-center gap-1 font-display"><Award className="h-3.5 w-3.5 text-game-gold" /> Escrow Gold (G)</label>
                    <input type="number" min={0} value={escrowGold} onChange={(e) => setEscrowGold(Number(e.target.value))} className="rpg-input px-3 py-2 text-xs w-full" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 relative z-10">
                <button type="button" onClick={() => setCreating(false)} className="rpg-button px-4 py-2 text-[9px] tracking-widest opacity-60">Cancel</button>
                <button type="submit" className="rpg-button rpg-button-emerald px-6 py-2 text-[9px] tracking-widest">Disburse Proposal</button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest">Active Proposals & Contracts</h3>
              {contracts.map((contract) => {
                const isCreator = contract.creator_id === profile?.id;
                const isAcceptor = contract.acceptor_id === profile?.id;
                return (
                  <div key={contract.id} className="rpg-panel-stone p-5 rounded-none flex flex-col gap-4 shadow-md relative">
                    <div className="rpg-rivet top-1 left-1" />
                    <div className="rpg-rivet top-1 right-1" />
                    <div className="rpg-rivet bottom-1 left-1" />
                    <div className="rpg-rivet bottom-1 right-1" />

                    <div className="flex justify-between items-start border-b-2 border-game-gold/10 pb-3 relative z-10">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="border border-game-emerald/30 bg-emerald-950/20 text-emerald-400 px-2 py-0.5 text-[9px] font-bold font-display uppercase tracking-widest">
                            {contract.type}
                          </span>
                          <h4 className="text-sm font-bold font-display text-zinc-200">Contract #{contract.id}</h4>
                        </div>
                        <p className="text-[9px] text-zinc-500 font-serif mt-1">Disbursed by: {contract.creator_name || contract.creator_id}</p>
                      </div>
                      <span className={`px-2 py-0.5 border text-[9px] font-bold font-display uppercase tracking-widest ${
                        contract.status === 'completed' ? 'border-game-emerald/30 bg-emerald-950/20 text-emerald-400' :
                        contract.status === 'active' ? 'border-blue-800/30 bg-blue-950/20 text-blue-400' :
                        'border-zinc-700 bg-zinc-900 text-zinc-500'
                      }`}>{contract.status}</span>
                    </div>

                    {/* Terms */}
                    <div className="text-xs text-zinc-400 bg-zinc-950 border border-zinc-800 p-3 relative z-10">
                      <p className="font-bold font-display text-zinc-300 text-[9px] uppercase tracking-widest mb-1">Terms / Conditions:</p>
                      <p className="leading-relaxed font-serif text-[11px]">{JSON.stringify(contract.terms_json)}</p>
                    </div>

                    {/* Escrow Details */}
                    <div className="grid grid-cols-3 gap-3 relative z-10">
                      <div className="bg-zinc-950 border border-zinc-800 p-3 text-center">
                        <span className="text-[8px] text-zinc-500 uppercase font-display tracking-widest block">Escrow $</span>
                        <span className="text-sm font-bold font-pixel text-zinc-200 mt-1 block">{contract.escrow_local.toLocaleString()}</span>
                      </div>
                      <div className="bg-zinc-950 border border-game-gold/20 p-3 text-center">
                        <span className="text-[8px] text-zinc-500 uppercase font-display tracking-widest block">Escrow Gold</span>
                        <span className="text-sm font-bold font-pixel text-game-gold mt-1 block">{contract.escrow_gold.toLocaleString()} G</span>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800 p-3 text-center">
                        <span className="text-[8px] text-zinc-500 uppercase font-display tracking-widest block">Deadline</span>
                        <span className="text-xs font-bold font-pixel text-zinc-300 mt-1 flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3 text-zinc-500" />
                          {contract.deadline ? new Date(contract.deadline).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-game-gold/10 relative z-10">
                      {contract.status === 'offered' && !isCreator && (
                        <button onClick={() => handleAccept(contract.id)} className="rpg-button rpg-button-emerald px-4 py-1.5 text-[9px] tracking-widest flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Accept Offer
                        </button>
                      )}
                      {contract.status === 'active' && isCreator && (
                        <button onClick={() => handleComplete(contract.id)} className="rpg-button rpg-button-emerald px-4 py-1.5 text-[9px] tracking-widest flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Confirm Completion
                        </button>
                      )}
                      {contract.status === 'active' && isAcceptor && (
                        <span className="text-[9px] text-zinc-500 italic font-serif py-1">Bound by contract. Submit materials to creator.</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {contracts.length === 0 && (
                <div className="rpg-panel-stone p-8 rounded-none flex flex-col items-center gap-3 text-zinc-600 relative shadow-md">
                  <div className="rpg-rivet top-1 left-1" />
                  <div className="rpg-rivet top-1 right-1" />
                  <AlertCircle className="h-8 w-8 relative z-10" />
                  <p className="text-xs font-serif relative z-10">No active contracts available.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Info Panels */}
        <div className="flex flex-col gap-6">
          <div className="rpg-panel-parchment p-6 rounded-none flex flex-col gap-4">
            <h3 className="text-xs font-bold font-display text-amber-950 uppercase tracking-widest border-b border-amber-950/20 pb-3">Legal Agreement Info</h3>
            <div className="flex flex-col gap-3 text-[11px] text-amber-950/80 font-serif leading-relaxed">
              <div className="flex gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                <p><strong>Automated Escrow</strong>: Funds locked immediately upon posting. Cannot be returned unless canceled or completed.</p>
              </div>
              <div className="flex gap-2">
                <Clock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <p><strong>Deadlines</strong>: Contracts have calendar deadlines. Expiring before completion marks them as failed.</p>
              </div>
              <div className="flex gap-2">
                <XCircle className="h-4 w-4 text-red-800 shrink-0 mt-0.5" />
                <p><strong>Escrow Penalties</strong>: Breach triggers automated contract auditing and possible penalties.</p>
              </div>
            </div>
          </div>

          <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-md relative">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest relative z-10">JSON Term Guidelines</h3>
            <p className="text-[10px] text-zinc-500 font-serif leading-relaxed relative z-10">
              For supply/manufacturing agreements, use JSON keys to trigger automated conditions:
            </p>
            <pre className="bg-zinc-950 border border-game-gold/10 p-3 text-[9px] text-zinc-400 overflow-x-auto font-pixel relative z-10 leading-relaxed">
{`{
  "item_template_id": 1,
  "required_quantity": 100,
  "unit_price_local": 50,
  "penalties": {
    "late_fee_gold": 10
  }
}`}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}
