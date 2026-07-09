'use client';

import { useGameContext } from '../layout';
import { useState } from 'react';
import { 
  Landmark, Award, Users, FileText, PlusCircle, CheckCircle, XCircle, 
  AlertCircle, Sparkles, TrendingUp, DollarSign, Hammer 
} from 'lucide-react';

export default function PoliticsPage() {
  const {
    profile, stats, countries, politicalParties, activeElections, candidates,
    bills, nationalProjects, createParty, joinParty, runForOffice, voteCandidate,
    proposeBill, voteBill, actionLoading, refreshData
  } = useGameContext();

  const [activeTab, setActiveTab] = useState<'countries' | 'elections' | 'congress' | 'parties'>('countries');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyDesc, setNewPartyDesc] = useState('');
  const [billTitle, setBillTitle] = useState('');
  const [billDesc, setBillDesc] = useState('');
  const [billType, setBillType] = useState<'tax_change' | 'budget_transfer' | 'national_project'>('tax_change');
  const [billParamVal, setBillParamVal] = useState('');

  const citizenCountryId = profile?.citizenship_country_id || 1;
  const citizenCountry = countries.find(c => c.id === citizenCountryId) || countries[0];

  const showErr = (msg: string) => { setError(msg); setSuccessMsg(null); };
  const showOk = (msg: string) => { setSuccessMsg(msg); setError(null); };

  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyName || !newPartyDesc) { showErr('Please provide a party name and description.'); return; }
    const res = await createParty(newPartyName, newPartyDesc);
    if (res.success) { showOk(`Successfully formed the ${newPartyName} political party!`); setNewPartyName(''); setNewPartyDesc(''); refreshData(); }
    else showErr(res.error || 'Failed to form party.');
  };

  const handleJoinParty = async (partyId: number, partyName: string) => {
    const res = await joinParty(partyId);
    if (res.success) { showOk(`You joined the ${partyName} political party.`); refreshData(); }
    else showErr(res.error || 'Failed to join party.');
  };

  const handleRegisterAsCandidate = async (electionId: number) => {
    const res = await runForOffice(electionId);
    if (res.success) { showOk('You successfully registered as a presidential candidate!'); refreshData(); }
    else showErr(res.error || 'Failed to register.');
  };

  const handleVoteCandidate = async (electionId: number, candidateId: string, name: string) => {
    const res = await voteCandidate(electionId, candidateId);
    if (res.success) { showOk(`Vote cast for ${name}.`); refreshData(); }
    else showErr(res.error || 'Failed to vote.');
  };

  const handleProposeBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billTitle || !billDesc) { showErr('Title and description are required.'); return; }
    let params: Record<string, any> = {};
    if (billType === 'tax_change') {
      const taxRate = parseFloat(billParamVal);
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) { showErr('Tax rate must be 0–100%.'); return; }
      params = { vat_rate: taxRate, income_tax_rate: taxRate };
    } else if (billType === 'budget_transfer') {
      const amount = parseFloat(billParamVal);
      if (isNaN(amount) || amount <= 0) { showErr('Transfer amount must be positive.'); return; }
      params = { amount };
    } else {
      const cost = parseFloat(billParamVal);
      if (isNaN(cost) || cost <= 0) { showErr('Project cost must be positive.'); return; }
      params = { cost_local: cost, bonuses_json: { gathering_bonus: 5 } };
    }
    const res = await proposeBill(billTitle, billDesc, billType, params);
    if (res.success) { showOk(`Proposed: "${billTitle}" is now up for voting.`); setBillTitle(''); setBillDesc(''); setBillParamVal(''); refreshData(); }
    else showErr(res.error || 'Failed to propose bill.');
  };

  const handleVoteBill = async (billId: number, vote: 'yes' | 'no') => {
    const res = await voteBill(billId, vote);
    if (res.success) { showOk(`Casted ${vote.toUpperCase()} vote on bill.`); refreshData(); }
    else showErr(res.error || 'Failed to cast vote.');
  };

  const tabs = [
    { id: 'countries', label: 'National Registry', icon: Landmark },
    { id: 'elections', label: 'Elections Center', icon: Award },
    { id: 'congress', label: 'Congress Chamber', icon: FileText },
    { id: 'parties', label: 'Political Parties', icon: Users }
  ] as const;

  return (
    <div className="flex flex-col gap-6 text-left">

      {/* Header Panel */}
      <div className="rpg-panel-stone p-6 rounded-none relative overflow-hidden flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shadow-xl">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 border-2 border-game-gold/30 bg-zinc-950 text-game-gold">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Nations & Governments</span>
            <h2 className="text-xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)] mt-0.5">
              Country Registry
            </h2>
          </div>
        </div>

        {citizenCountry && (
          <div className="flex gap-3 relative z-10">
            <div className="px-3 py-2 border border-game-gold/20 bg-zinc-950 text-xs">
              <span className="text-zinc-500 font-display uppercase tracking-widest text-[9px] block">Citizenship</span>
              <span className="font-bold font-display text-zinc-200 mt-0.5 block">{citizenCountry.name}</span>
            </div>
            <div className="px-3 py-2 border border-game-gold/20 bg-zinc-950 text-xs">
              <span className="text-zinc-500 font-display uppercase tracking-widest text-[9px] block">VAT Rate</span>
              <span className="font-bold font-pixel text-game-gold mt-0.5 block">{citizenCountry.vat_rate}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="px-4 py-3 border-l-4 border-red-600 bg-red-950/30 text-red-400 text-xs font-bold font-display uppercase tracking-widest flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="px-4 py-3 border-l-4 border-game-emerald bg-emerald-950/30 text-emerald-400 text-xs font-bold font-display uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError(null); setSuccessMsg(null); }}
              className={`rpg-button flex items-center gap-2 px-4 py-2 text-[9px] tracking-widest ${
                activeTab === tab.id ? 'border-game-gold text-game-gold' : 'opacity-60'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── COUNTRIES ── */}
      {activeTab === 'countries' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {countries.map((c) => (
              <div key={c.id} className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <div className="flex justify-between items-center border-b-2 border-game-gold/15 pb-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏳️</span>
                    <h3 className="text-sm font-bold font-display text-zinc-200">{c.name}</h3>
                  </div>
                  <span className="text-[9px] text-zinc-500 font-pixel">ID #{c.id}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
                  {[
                    { icon: DollarSign, color: 'text-game-gold', label: 'Treasury', value: (c.local_currency_reserve || 0).toLocaleString() },
                    { icon: Award, color: 'text-blue-400', label: 'Gold Reserve', value: `${(c.gold_reserve || 0).toLocaleString()} Oz` },
                    { icon: TrendingUp, color: 'text-emerald-400', label: 'VAT Rate', value: `${c.vat_rate || 10}%` },
                    { icon: Users, color: 'text-red-400', label: 'Income Tax', value: `${c.income_tax_rate || 10}%` },
                  ].map((stat, i) => (
                    <div key={i} className="bg-zinc-950 border border-zinc-800 p-3 flex flex-col gap-1">
                      <span className="text-[8px] text-zinc-500 uppercase font-display tracking-widest flex items-center gap-1">
                        <stat.icon className={`h-3 w-3 ${stat.color}`} /> {stat.label}
                      </span>
                      <span className="text-sm font-bold font-pixel text-zinc-200 mt-0.5">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* National Projects */}
          <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest flex items-center gap-2 border-b border-game-gold/15 pb-3 relative z-10">
              <Hammer className="h-4 w-4" /> National Projects
            </h3>
            <div className="flex flex-col gap-3 relative z-10">
              {nationalProjects.length === 0 ? (
                <p className="text-xs text-zinc-600 italic font-serif">No public works currently underway.</p>
              ) : nationalProjects.map((p) => (
                <div key={p.id} className="bg-zinc-950 border border-zinc-800 p-3.5 flex flex-col gap-2">
                  <span className="text-xs font-bold font-display text-zinc-200">{p.name}</span>
                  <p className="text-[10px] text-zinc-500 font-serif">{p.description}</p>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[9px] font-pixel text-zinc-500">
                      <span>Funding</span><span>{p.progress_percent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900 border border-zinc-800">
                      <div className="bg-game-gold h-full" style={{ width: `${p.progress_percent}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ELECTIONS ── */}
      {activeTab === 'elections' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {activeElections.map((election) => {
              const electionCountry = countries.find(c => c.id === election.country_id) || countries[0];
              const isCitizen = profile?.citizenship_country_id === election.country_id;
              return (
                <div key={election.id} className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
                  <div className="rpg-rivet top-1 left-1" />
                  <div className="rpg-rivet top-1 right-1" />
                  <div className="rpg-rivet bottom-1 left-1" />
                  <div className="rpg-rivet bottom-1 right-1" />

                  <div className="flex justify-between items-start border-b-2 border-game-gold/15 pb-3 relative z-10">
                    <div>
                      <span className="text-[9px] text-game-gold font-bold font-display uppercase">Country: {electionCountry?.name}</span>
                      <h3 className="text-sm font-bold font-display text-zinc-200 mt-1">Presidential Election (Term #{election.term_number})</h3>
                    </div>
                    <span className={`px-2 py-0.5 border text-[9px] font-bold font-display uppercase tracking-widest ${
                      election.status === 'campaign' ? 'border-amber-800/30 bg-amber-950/20 text-amber-400' :
                      election.status === 'voting' ? 'border-game-gold/30 bg-game-gold/10 text-game-gold' :
                      'border-zinc-700 bg-zinc-900 text-zinc-500'
                    }`}>{election.status}</span>
                  </div>

                  <div className="relative z-10">
                    <span className="text-[9px] text-zinc-500 font-display uppercase tracking-widest">Candidates Ballot Box</span>
                    <div className="flex flex-col gap-2 mt-2">
                      {candidates.filter(c => c.election_id === election.id).length === 0 ? (
                        <p className="text-xs text-zinc-600 italic font-serif">No candidates registered yet.</p>
                      ) : candidates.filter(c => c.election_id === election.id).map((cand) => (
                        <div key={cand.candidate_id} className="bg-zinc-950 border border-zinc-800 p-3 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold font-display text-zinc-200">{cand.username}</span>
                            <span className="text-[9px] text-zinc-500 font-serif block mt-0.5">Party: {cand.party_name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-zinc-400 font-pixel">{cand.votes_received} votes</span>
                            <button
                              onClick={() => handleVoteCandidate(election.id, cand.candidate_id, cand.username || 'Candidate')}
                              disabled={actionLoading || !isCitizen}
                              className="rpg-button px-3 py-1.5 text-[9px] tracking-widest"
                            >Vote</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {election.status === 'campaign' && isCitizen && (
                    <button
                      onClick={() => handleRegisterAsCandidate(election.id)}
                      disabled={actionLoading}
                      className="rpg-button w-full flex items-center justify-center gap-1.5 py-2.5 text-[9px] tracking-widest relative z-10"
                    >
                      <PlusCircle className="h-4 w-4" /> Run for President
                    </button>
                  )}
                </div>
              );
            })}
            {activeElections.length === 0 && (
              <div className="rpg-panel-stone p-8 rounded-none flex flex-col items-center gap-3 text-zinc-600 relative shadow-md">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <AlertCircle className="h-8 w-8 relative z-10" />
                <p className="text-xs font-serif relative z-10">No active elections at this time.</p>
              </div>
            )}
          </div>

          {/* Election Rules */}
          <div className="rpg-panel-parchment p-6 rounded-none flex flex-col gap-4">
            <h3 className="text-xs font-bold font-display text-amber-950 uppercase tracking-widest flex items-center gap-2 border-b border-amber-950/20 pb-3">
              <Award className="h-4 w-4" /> Election Rules
            </h3>
            <div className="flex flex-col gap-2 text-xs text-amber-950/80 font-serif leading-relaxed">
              <p>• Only citizens of the respective country can vote or run as candidates.</p>
              <p>• Registration takes place during the Campaign period.</p>
              <p>• Cast your ballot securely. Votes are tallied immediately.</p>
              <p>• The winner transitions to President at the start of the next term.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── CONGRESS ── */}
      {activeTab === 'congress' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bill Proposer */}
          <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3 relative z-10">Propose Legislation</h3>

            <form onSubmit={handleProposeBill} className="flex flex-col gap-4 relative z-10">
              {[
                { label: 'Bill Title', value: billTitle, setter: setBillTitle, type: 'text', placeholder: 'e.g. VAT Tax Reduction' },
              ].map((f, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">{f.label}</label>
                  <input type={f.type} value={f.value} onChange={(e) => f.setter(e.target.value)} placeholder={f.placeholder} className="rpg-input px-3 py-2 text-xs w-full" />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Description</label>
                <textarea value={billDesc} onChange={(e) => setBillDesc(e.target.value)} className="rpg-input px-3 py-2 text-xs w-full h-20 resize-none" placeholder="Summarize the legislative intent..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Bill Type</label>
                <select value={billType} onChange={(e) => setBillType(e.target.value as any)} className="rpg-input px-3 py-2 text-xs w-full">
                  <option value="tax_change">Tax Alteration (VAT/Income)</option>
                  <option value="budget_transfer">Treasury Transfer</option>
                  <option value="national_project">Infrastructure Project</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Value / Parameter</label>
                <input type="text" value={billParamVal} onChange={(e) => setBillParamVal(e.target.value)} className="rpg-input px-3 py-2 text-xs w-full" placeholder="Tax % or Transfer Amount" />
              </div>
              <button type="submit" disabled={actionLoading} className="rpg-button rpg-button-emerald w-full py-2.5 text-[9px] tracking-widest">
                Propose Bill
              </button>
            </form>
          </div>

          {/* Bills Browser */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest flex items-center gap-2">
              <FileText className="h-4 w-4" /> Congressional Bills Browser
            </h3>
            {bills.length === 0 ? (
              <div className="rpg-panel-stone p-8 rounded-none flex flex-col items-center gap-3 text-zinc-600 relative shadow-md">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <AlertCircle className="h-8 w-8 relative z-10" />
                <p className="text-xs font-serif relative z-10">No bills are currently up for vote.</p>
              </div>
            ) : bills.map((bill) => {
              const isCitizen = profile?.citizenship_country_id === bill.country_id;
              return (
                <div key={bill.id} className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
                  <div className="rpg-rivet top-1 left-1" />
                  <div className="rpg-rivet top-1 right-1" />
                  <div className="rpg-rivet bottom-1 left-1" />
                  <div className="rpg-rivet bottom-1 right-1" />

                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <span className="text-[9px] text-zinc-500 font-display uppercase tracking-widest">Bill #{bill.id} • {bill.creator_name}</span>
                      <h4 className="text-sm font-bold font-display text-zinc-200 mt-1">{bill.title}</h4>
                    </div>
                    <span className={`px-2 py-0.5 border text-[9px] font-bold font-display uppercase tracking-widest shrink-0 ${
                      bill.status === 'passed' ? 'border-game-emerald/30 bg-emerald-950/20 text-emerald-400' :
                      bill.status === 'rejected' ? 'border-red-900/30 bg-red-950/20 text-red-400' :
                      'border-zinc-700 bg-zinc-900 text-zinc-500'
                    }`}>{bill.status}</span>
                  </div>

                  <p className="text-xs text-zinc-500 font-serif leading-relaxed border-t border-game-gold/10 pt-3 relative z-10">{bill.description}</p>

                  <div className="grid grid-cols-3 gap-2 relative z-10">
                    <div className="bg-zinc-950 border border-zinc-800 p-2 text-center">
                      <span className="text-[8px] text-zinc-500 uppercase font-display tracking-widest block">Type</span>
                      <span className="text-[10px] font-bold font-display text-zinc-300 mt-1 block">{bill.type.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <div className="bg-zinc-950 border border-game-emerald/20 p-2 text-center">
                      <span className="text-[8px] text-zinc-500 uppercase font-display tracking-widest block">Yes Votes</span>
                      <span className="text-sm font-bold font-pixel text-emerald-400 mt-1 block">{bill.yes_votes}</span>
                    </div>
                    <div className="bg-zinc-950 border border-red-900/20 p-2 text-center">
                      <span className="text-[8px] text-zinc-500 uppercase font-display tracking-widest block">No Votes</span>
                      <span className="text-sm font-bold font-pixel text-red-400 mt-1 block">{bill.no_votes}</span>
                    </div>
                  </div>

                  {bill.status === 'voting' && isCitizen && (
                    <div className="flex gap-2 relative z-10">
                      <button onClick={() => handleVoteBill(bill.id, 'yes')} disabled={actionLoading} className="rpg-button rpg-button-emerald flex-1 flex items-center justify-center gap-1.5 py-2 text-[9px] tracking-widest">
                        <CheckCircle className="h-4 w-4" /> Vote Yes
                      </button>
                      <button onClick={() => handleVoteBill(bill.id, 'no')} disabled={actionLoading} className="rpg-button rpg-button-crimson flex-1 flex items-center justify-center gap-1.5 py-2 text-[9px] tracking-widest">
                        <XCircle className="h-4 w-4" /> Vote No
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PARTIES ── */}
      {activeTab === 'parties' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Party Creator */}
          <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3 relative z-10">Form Political Party</h3>

            <form onSubmit={handleCreateParty} className="flex flex-col gap-4 relative z-10">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Party Name</label>
                <input type="text" value={newPartyName} onChange={(e) => setNewPartyName(e.target.value)} className="rpg-input px-3 py-2 text-xs w-full" placeholder="e.g. Free Trade Coalition" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Platform Description</label>
                <textarea value={newPartyDesc} onChange={(e) => setNewPartyDesc(e.target.value)} className="rpg-input px-3 py-2 text-xs w-full h-28 resize-none" placeholder="Outline your platform values and objectives..." />
              </div>
              <button type="submit" disabled={actionLoading} className="rpg-button rpg-button-emerald w-full py-2.5 text-[9px] tracking-widest">
                Establish Party
              </button>
            </form>
          </div>

          {/* Parties List */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest flex items-center gap-2">
              <Users className="h-4 w-4" /> Political Parties Directory
            </h3>
            {politicalParties.length === 0 ? (
              <div className="rpg-panel-stone p-8 rounded-none flex flex-col items-center gap-3 text-zinc-600 relative shadow-md">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <AlertCircle className="h-8 w-8 relative z-10" />
                <p className="text-xs font-serif relative z-10">No registered political parties.</p>
              </div>
            ) : politicalParties.map((party) => {
              const isCitizen = profile?.citizenship_country_id === party.country_id;
              return (
                <div key={party.id} className="rpg-panel-stone p-5 rounded-none flex flex-col gap-3 shadow-md relative">
                  <div className="rpg-rivet top-1 left-1" />
                  <div className="rpg-rivet top-1 right-1" />
                  <div className="rpg-rivet bottom-1 left-1" />
                  <div className="rpg-rivet bottom-1 right-1" />

                  <div className="flex justify-between items-start border-b border-game-gold/15 pb-2.5 relative z-10">
                    <div>
                      <span className="text-[9px] text-zinc-500 font-display uppercase tracking-widest">Party #{party.id}</span>
                      <h4 className="text-sm font-bold font-display text-zinc-200 mt-0.5">{party.name}</h4>
                    </div>
                    <span className="text-xs text-zinc-400 font-serif">Leader: {party.leader_name}</span>
                  </div>

                  <p className="text-xs text-zinc-500 font-serif leading-relaxed relative z-10">{party.description}</p>

                  <div className="flex justify-between items-center relative z-10">
                    <span className="text-[9px] text-zinc-600 font-pixel">Members: {party.members_count || 1}</span>
                    <button
                      onClick={() => handleJoinParty(party.id, party.name)}
                      disabled={actionLoading || !isCitizen}
                      className="rpg-button px-3.5 py-1.5 text-[9px] tracking-widest"
                    >Join Party</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
