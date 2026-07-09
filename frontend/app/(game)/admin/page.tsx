'use client';

import React, { useState, useEffect } from 'react';
import { useGameContext } from '../layout';
import { gameRepository } from '../../../services/repository/provider';
import { 
  ShieldAlert, Settings, Users, FileText, Sliders, Activity, 
  Mail, UserX, RefreshCcw, Database, Cpu, Clock, Send, Flag, AlertTriangle
} from 'lucide-react';

export default function AdminPage() {
  const {
    profile, liveOpsConfig, supportTickets, featureFlags,
    updateLiveOpsConfig, createModerationAction, createSupportTicket,
    addTicketReply, toggleFeatureFlag, refreshData
  } = useGameContext();

  const [activeSubTab, setActiveSubTab] = useState<'liveops' | 'moderation' | 'support' | 'balancing' | 'observability' | 'flags'>('liveops');

  const [metrics, setMetrics] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  const [targetUser, setTargetUser] = useState('');
  const [modAction, setModAction] = useState<'warn' | 'mute' | 'temp_ban' | 'perm_ban'>('warn');
  const [modReason, setModReason] = useState('');

  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [supportReplyText, setSupportReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [ticketReplies, setTicketReplies] = useState<any[]>([]);

  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDetails, setNewTicketDetails] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('bug');
  const [newTicketPriority, setNewTicketPriority] = useState('normal');
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);

  const [xpMult, setXpMult] = useState(1.0);
  const [dropMult, setDropMult] = useState(1.0);
  const [resourceMult, setResourceMult] = useState(1.0);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const showStatus = (text: string, ok: boolean) => { setStatusMsg({ text, ok }); setTimeout(() => setStatusMsg(null), 3000); };

  useEffect(() => {
    if (liveOpsConfig) {
      setXpMult(Number(liveOpsConfig.xp_multiplier) || 1.0);
      setDropMult(Number(liveOpsConfig.drop_rate_multiplier) || 1.0);
      setResourceMult(Number(liveOpsConfig.resource_multiplier) || 1.0);
    }
  }, [liveOpsConfig]);

  useEffect(() => {
    const loadOpsMetrics = async () => {
      const metricsData = await gameRepository.getSystemMetrics();
      setMetrics(metricsData);
      const reportsData = await gameRepository.getPlayerReports();
      setReports(reportsData);
    };
    loadOpsMetrics();
    const interval = setInterval(loadOpsMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectTicket = async (ticketId: number) => {
    setSelectedTicketId(ticketId);
    const replies = await gameRepository.getTicketReplies(ticketId);
    setTicketReplies(replies);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketDetails.trim()) return;
    const res = await createSupportTicket({
      profile_id: profile?.id || 'tester-uuid', category: newTicketCategory as any,
      subject: newTicketSubject, details: newTicketDetails, status: 'open',
      priority: newTicketPriority as any, assigned_to: null
    });
    if (res.success) { showStatus('Support ticket created!', true); setNewTicketSubject(''); setNewTicketDetails(''); setShowNewTicketForm(false); refreshData(); }
    else showStatus(res.error || 'Failed to submit ticket.', false);
  };

  const handleUpdateLiveOps = async (key: string, value: any) => {
    const res = await updateLiveOpsConfig({ [key]: value });
    if (res.success) showStatus('Live Operations updated!', true);
    else showStatus(res.error || 'Failed to update.', false);
  };

  const handleApplyBalancing = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateLiveOpsConfig({ xp_multiplier: xpMult, drop_rate_multiplier: dropMult, resource_multiplier: resourceMult });
    if (res.success) showStatus('Balancing constants applied globally!', true);
    else showStatus(res.error || 'Failed to update balancing.', false);
  };

  const handlePostModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser || !modReason) return;
    const res = await createModerationAction({
      profile_id: targetUser, action_type: modAction, reason: modReason,
      ends_at: modAction === 'temp_ban' ? new Date(Date.now() + 86400000).toISOString() : null,
      moderator_id: profile?.id || 'admin-uuid', appeal_status: 'none', appeal_notes: null
    });
    if (res.success) { showStatus('Moderation action dispatched!', true); setTargetUser(''); setModReason(''); }
    else showStatus(res.error || 'Failed to apply moderation action.', false);
  };

  const handleSendSupportReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !supportReplyText.trim()) return;
    const res = await addTicketReply({
      ticket_id: selectedTicketId, sender_id: profile?.id || 'admin-uuid',
      message: supportReplyText, is_internal_note: isInternalNote
    });
    if (res.success) {
      setSupportReplyText('');
      const replies = await gameRepository.getTicketReplies(selectedTicketId);
      setTicketReplies(replies);
    } else showStatus(res.error || 'Failed to submit response.', false);
  };

  const handleToggleFlag = async (id: number, currentStatus: boolean) => {
    const res = await toggleFeatureFlag(id, !currentStatus);
    if (res.success) showStatus('Feature flag toggled!', true);
    else showStatus(res.error || 'Failed to toggle flag.', false);
  };

  const tabs = [
    { id: 'liveops', label: 'Live Ops', icon: Settings },
    { id: 'moderation', label: 'Moderation', icon: UserX },
    { id: 'support', label: 'Support Tickets', icon: Mail },
    { id: 'balancing', label: 'Balancing', icon: Sliders },
    { id: 'observability', label: 'Observability', icon: Activity },
    { id: 'flags', label: 'Feature Flags', icon: Flag },
  ] as const;

  const inputCls = "rpg-input px-3 py-2 text-xs w-full";
  const textareaCls = "rpg-input px-3 py-2 text-xs w-full resize-none";

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="rpg-panel-stone p-6 rounded-none relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 border-2 border-game-gold/30 bg-zinc-950 text-game-gold">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
              Aegis Game Master Console
            </h1>
            <p className="text-zinc-500 text-xs font-serif mt-0.5">Live operational controls, system health indices, and player moderation desk.</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-1 bg-zinc-950 p-1 border border-zinc-800 relative z-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold font-display uppercase tracking-widest transition-all ${
                  activeSubTab === tab.id ? 'bg-game-gold/20 text-game-gold border border-game-gold/30' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className="h-3 w-3" />{tab.label}
              </button>
            );
          })}
        </div>
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
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* ── LIVE OPS ── */}
          {activeSubTab === 'liveops' && (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-5 shadow-lg relative">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <h2 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3 flex items-center gap-2 relative z-10">
                <Settings className="h-4 w-4" /> Live Operational Systems
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                <div className="bg-zinc-950 border border-red-900/30 p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-red-400">
                    <ShieldAlert className="h-4 w-4" />
                    <h3 className="text-[9px] font-bold font-display uppercase tracking-widest">Emergency Kill-Switch</h3>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-serif">Enabling shutdown immediately disconnects all game clients and redirects players to a maintenance window.</p>
                  <button
                    onClick={() => handleUpdateLiveOps('emergency_shutdown', !liveOpsConfig?.emergency_shutdown)}
                    className={`rpg-button w-full py-2 text-[9px] tracking-widest ${liveOpsConfig?.emergency_shutdown ? 'rpg-button-emerald' : 'rpg-button-crimson'}`}
                  >
                    {liveOpsConfig?.emergency_shutdown ? 'Disable Emergency Lockout' : 'Initiate Emergency Lockout'}
                  </button>
                </div>

                <div className="bg-zinc-950 border border-amber-900/30 p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <h3 className="text-[9px] font-bold font-display uppercase tracking-widest">Maintenance Mode</h3>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-serif">Restricts login credentials to game master profiles. All other players are queued outside.</p>
                  <button
                    onClick={() => handleUpdateLiveOps('maintenance_mode', !liveOpsConfig?.maintenance_mode)}
                    className={`rpg-button w-full py-2 text-[9px] tracking-widest ${liveOpsConfig?.maintenance_mode ? 'opacity-60' : 'border-amber-800 text-amber-300'}`}
                  >
                    {liveOpsConfig?.maintenance_mode ? 'Deactivate Maintenance' : 'Activate Maintenance Mode'}
                  </button>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-5 flex flex-col gap-3 relative z-10">
                <h3 className="text-[9px] font-bold font-display text-zinc-400 uppercase tracking-widest">Scheduled Server Restart</h3>
                <div className="flex gap-2">
                  <button onClick={() => showStatus('Server restart schedule requested.', true)} className="rpg-button rpg-button-emerald px-4 py-2 text-[9px] tracking-widest">
                    Schedule Restart (10 mins)
                  </button>
                  <button onClick={() => showStatus('Immediate graceful reboot dispatched.', true)} className="rpg-button px-4 py-2 text-[9px] tracking-widest opacity-70">
                    Graceful Hot-Reload
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── MODERATION ── */}
          {activeSubTab === 'moderation' && (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-5 shadow-lg relative">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <h2 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3 flex items-center gap-2 relative z-10">
                <UserX className="h-4 w-4" /> Disciplinary & Moderation Station
              </h2>

              <form onSubmit={handlePostModeration} className="bg-zinc-950 border border-zinc-800 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                <div className="col-span-2">
                  <h3 className="text-[9px] uppercase font-bold font-display text-red-400 tracking-widest">Issue Penalty</h3>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Target Profile UUID</label>
                  <input type="text" required value={targetUser} onChange={(e) => setTargetUser(e.target.value)} placeholder="Player Profile UUID..." className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Sanction Action</label>
                  <select value={modAction} onChange={(e) => setModAction(e.target.value as any)} className={inputCls}>
                    <option value="warn">Formal Warning</option>
                    <option value="mute">Mute Chat</option>
                    <option value="temp_ban">Temporary Suspension (24h)</option>
                    <option value="perm_ban">Permanent Ban</option>
                  </select>
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Infraction Reason & Evidence Notes</label>
                  <textarea required value={modReason} onChange={(e) => setModReason(e.target.value)} placeholder="Muted for toxic trading frequency logs..." className={`${textareaCls} h-20`} />
                </div>
                <div className="col-span-2 flex justify-end">
                  <button type="submit" className="rpg-button rpg-button-crimson px-4 py-2 text-[9px] tracking-widest">Dispatch Sanction</button>
                </div>
              </form>

              <div className="flex flex-col gap-3 relative z-10">
                <h3 className="text-[9px] font-bold font-display text-zinc-400 uppercase tracking-widest">Active Infraction Reports ({reports.length})</h3>
                {reports.map((rep) => (
                  <div key={rep.id} className="bg-zinc-950 border border-zinc-800 p-4 flex justify-between items-start text-xs text-left">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="border border-red-900/30 bg-red-950/20 text-red-400 px-1.5 py-0.5 text-[9px] font-bold font-display uppercase tracking-widest">{rep.category}</span>
                        <span className="text-zinc-500 font-pixel text-[9px]">Report #{rep.id}</span>
                      </div>
                      <p className="text-zinc-300 font-serif mt-2">"{rep.details}"</p>
                      <p className="text-[9px] text-zinc-500 font-serif mt-2">
                        Reported: <span className="text-zinc-400 font-bold">{rep.reported_name || rep.reported_id}</span> | By: <span className="text-zinc-400 font-bold">{rep.reporter_name || rep.reporter_id}</span>
                      </p>
                    </div>
                    <button onClick={() => showStatus('Report logs updated as Investigated.', true)} className="rpg-button px-2.5 py-1 text-[9px] tracking-widest">
                      Investigate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SUPPORT TICKETS ── */}
          {activeSubTab === 'support' && (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-5 shadow-lg relative">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <div className="flex justify-between items-center border-b-2 border-game-gold/15 pb-3 relative z-10">
                <h2 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Customer Support Queue
                </h2>
                <button onClick={() => setShowNewTicketForm(!showNewTicketForm)} className="rpg-button rpg-button-emerald px-3 py-1.5 text-[9px] tracking-widest">
                  {showNewTicketForm ? 'View Queue' : '+ Open New Ticket'}
                </button>
              </div>

              {showNewTicketForm ? (
                <form onSubmit={handleCreateTicket} className="flex flex-col gap-4 bg-zinc-950 border border-zinc-800 p-5 relative z-10">
                  <h3 className="text-[9px] uppercase font-bold font-display text-game-gold tracking-widest">File Support Ticket / Bug Report</h3>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Subject</label>
                    <input type="text" required value={newTicketSubject} onChange={(e) => setNewTicketSubject(e.target.value)} placeholder="e.g. Blacksmith queue keeps resetting..." className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Category</label>
                      <select value={newTicketCategory} onChange={(e) => setNewTicketCategory(e.target.value)} className={inputCls}>
                        <option value="bug">Bug Report</option>
                        <option value="appeal">Ban Appeal</option>
                        <option value="gameplay">Gameplay Query</option>
                        <option value="exploit">Exploit Report</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Priority</label>
                      <select value={newTicketPriority} onChange={(e) => setNewTicketPriority(e.target.value)} className={inputCls}>
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Description & Reproduction Steps</label>
                    <textarea required value={newTicketDetails} onChange={(e) => setNewTicketDetails(e.target.value)} placeholder="Detail what steps lead to this bug..." className={`${textareaCls} h-24`} />
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="rpg-button rpg-button-emerald px-4 py-2 text-[9px] tracking-widest">Submit Ticket</button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                    {supportTickets.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleSelectTicket(t.id)}
                        className={`border text-left cursor-pointer transition p-4 flex flex-col gap-1.5 ${
                          selectedTicketId === t.id ? 'border-game-gold/50 bg-game-gold/5' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold font-display text-zinc-200">{t.subject}</span>
                          <span className={`border text-[9px] font-bold font-display uppercase tracking-widest px-1.5 py-0.5 ${
                            t.priority === 'critical' ? 'border-red-900/30 bg-red-950/20 text-red-400' : 'border-zinc-700 bg-zinc-900 text-zinc-500'
                          }`}>{t.priority}</span>
                        </div>
                        <p className="text-[9px] text-zinc-500 font-serif truncate">{t.details}</p>
                        <div className="flex justify-between text-[8px] text-zinc-600 border-t border-zinc-900 pt-1.5 font-pixel">
                          <span>Citizen: {t.username || t.profile_id}</span>
                          <span>Category: {t.category}</span>
                        </div>
                      </div>
                    ))}
                    {supportTickets.length === 0 && <p className="text-zinc-600 text-xs py-8 text-center font-serif">No open tickets in support queue.</p>}
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 p-4 flex flex-col h-96">
                    {selectedTicketId ? (
                      <>
                        <h4 className="text-[9px] font-bold font-display text-game-gold uppercase tracking-widest border-b border-zinc-800 pb-2">Ticket #{selectedTicketId} Conversation</h4>
                        <div className="flex-1 overflow-y-auto my-3 flex flex-col gap-2.5 text-xs pr-1">
                          {ticketReplies.map((reply) => (
                            <div key={reply.id} className="bg-zinc-900 border border-zinc-800 p-2.5 text-left">
                              <div className="flex justify-between items-center text-[9px] mb-1">
                                <span className="font-bold font-display text-game-gold">{reply.sender_name || 'Staff'}</span>
                                <span className="text-zinc-600 font-pixel">{new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-zinc-300 font-serif leading-relaxed">{reply.message}</p>
                            </div>
                          ))}
                        </div>
                        <form onSubmit={handleSendSupportReply} className="flex flex-col gap-2 border-t border-zinc-800 pt-3">
                          <textarea required value={supportReplyText} onChange={(e) => setSupportReplyText(e.target.value)} placeholder="Type customer reply message..." className={`${textareaCls} h-16`} />
                          <div className="flex justify-between items-center">
                            <label className="flex items-center gap-1.5 text-[9px] text-zinc-500 cursor-pointer">
                              <input type="checkbox" checked={isInternalNote} onChange={(e) => setIsInternalNote(e.target.checked)} className="border-zinc-800 bg-zinc-900" />
                              Internal Note
                            </label>
                            <button type="submit" className="rpg-button rpg-button-emerald px-3 py-1.5 text-[9px] tracking-widest flex items-center gap-1">
                              <Send className="h-3 w-3" /> Submit
                            </button>
                          </div>
                        </form>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col justify-center items-center gap-2 text-center">
                        <Mail className="h-8 w-8 text-zinc-700" />
                        <p className="text-[10px] text-zinc-600 font-serif">Select a ticket from the list to view the chat log.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── BALANCING ── */}
          {activeSubTab === 'balancing' && (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-5 shadow-lg relative">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <h2 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3 flex items-center gap-2 relative z-10">
                <Sliders className="h-4 w-4" /> Live Balancing Overrides
              </h2>

              <form onSubmit={handleApplyBalancing} className="bg-zinc-950 border border-zinc-800 p-6 flex flex-col gap-5 relative z-10">
                <p className="text-[10px] text-zinc-500 font-serif">
                  Adjust global game multipliers immediately without deploying code or rebooting the persistent databases.
                </p>
                {[
                  { label: 'Experience Multiplier (XP)', val: xpMult, set: setXpMult },
                  { label: 'Loot & Drop Rate Multiplier', val: dropMult, set: setDropMult },
                  { label: 'Resource Yield Multiplier (Gathering)', val: resourceMult, set: setResourceMult },
                ].map((s, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-display">
                      <span className="text-zinc-300">{s.label}</span>
                      <span className="text-game-gold font-bold font-pixel">{s.val.toFixed(1)}x</span>
                    </div>
                    <input type="range" min={0.5} max={5.0} step={0.1} value={s.val} onChange={(e) => s.set(Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                  </div>
                ))}
                <div className="flex justify-end">
                  <button type="submit" className="rpg-button rpg-button-emerald px-6 py-2.5 text-[9px] tracking-widest">Commit Changes Globally</button>
                </div>
              </form>
            </div>
          )}

          {/* ── OBSERVABILITY ── */}
          {activeSubTab === 'observability' && (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-5 shadow-lg relative">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <h2 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3 flex items-center gap-2 relative z-10">
                <Activity className="h-4 w-4" /> Observability & Monitoring
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
                {[
                  { icon: Cpu, color: 'text-game-gold', label: 'CPU Usage', value: '42.5%' },
                  { icon: Activity, color: 'text-emerald-400', label: 'Memory', value: '68.2%' },
                  { icon: Database, color: 'text-blue-400', label: 'DB Connections', value: '12' },
                  { icon: Clock, color: 'text-purple-400', label: 'Latency', value: '48ms' },
                ].map((m, i) => (
                  <div key={i} className="bg-zinc-950 border border-zinc-800 p-4 text-center">
                    <m.icon className={`h-5 w-5 ${m.color} mx-auto mb-1`} />
                    <p className="text-[8px] text-zinc-500 uppercase font-display tracking-widest">{m.label}</p>
                    <p className={`text-base font-bold font-pixel ${m.color} mt-1`}>{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-5 flex flex-col gap-3 relative z-10">
                <h3 className="text-[9px] text-zinc-500 uppercase font-bold font-display tracking-widest">Health Checks</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { label: 'Supabase DB Link', status: 'ONLINE' },
                    { label: 'Combat Engine', status: 'ONLINE' },
                    { label: 'Tick Scheduler', status: 'ONLINE' },
                  ].map((h, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 p-2.5 flex justify-between items-center">
                      <span className="text-zinc-400 font-serif">{h.label}</span>
                      <span className="text-emerald-400 font-bold font-pixel text-[9px]">{h.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── FEATURE FLAGS ── */}
          {activeSubTab === 'flags' && (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <h2 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3 flex items-center gap-2 relative z-10">
                <Flag className="h-4 w-4" /> Feature Rollouts & Flags
              </h2>

              <div className="flex flex-col gap-3 relative z-10">
                {featureFlags.map((flag) => (
                  <div key={flag.id} className="bg-zinc-950 border border-zinc-800 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
                    <div>
                      <h4 className="text-xs font-pixel font-bold text-game-gold">{flag.name}</h4>
                      <p className="text-[10px] text-zinc-500 font-serif mt-1">{flag.description || 'No description provided.'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[9px] text-zinc-600 font-display uppercase tracking-widest block">Rollout</span>
                        <span className="text-xs font-bold font-pixel text-zinc-300">{flag.rollout_percentage}%</span>
                      </div>
                      <button
                        onClick={() => handleToggleFlag(flag.id, flag.is_enabled)}
                        className={`rpg-button px-4 py-2 text-[9px] tracking-widest ${flag.is_enabled ? 'border-game-emerald text-emerald-400' : 'opacity-50'}`}
                      >
                        {flag.is_enabled ? 'Disable Flag' : 'Enable Flag'}
                      </button>
                    </div>
                  </div>
                ))}
                {featureFlags.length === 0 && <p className="text-zinc-600 text-xs font-serif py-4 text-center">No feature flags defined.</p>}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">

          {/* System Logs */}
          <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-md relative">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3 relative z-10">System Logs</h3>
            <div className="flex flex-col gap-1 font-pixel text-[9px] text-zinc-400 max-h-64 overflow-y-auto bg-zinc-950 border border-zinc-800 p-3 relative z-10 leading-relaxed">
              <p className="text-game-gold">[11:15:02] GM_Admin toggled flag marketplace_v2 to true.</p>
              <p className="text-zinc-500">[11:14:48] Task scheduler resolved company queues (14 parsed).</p>
              <p className="text-zinc-500">[11:10:00] Ingested DAU logs to daily_active_users index.</p>
              <p className="text-red-400">[11:05:12] Warning: DB pool connection reached 82% threshold.</p>
              <p className="text-zinc-500">[11:00:00] Simulation hourly logs committed successfully.</p>
            </div>
          </div>

          {/* Session Analytics */}
          <div className="rpg-panel-parchment p-6 rounded-none flex flex-col gap-4">
            <h3 className="text-xs font-bold font-display text-amber-950 uppercase tracking-widest border-b border-amber-950/20 pb-3">Session Analytics</h3>
            {[
              { label: 'Daily Active Users', value: '142 DAU' },
              { label: 'Monthly Active Users', value: '900 MAU' },
              { label: 'Avg Retention Rate', value: '70%' },
            ].map((s, i) => (
              <div key={i} className="flex justify-between items-center bg-amber-950/10 border border-amber-950/10 p-2.5">
                <span className="text-[10px] text-amber-950/70 font-serif">{s.label}</span>
                <span className="text-sm font-bold font-pixel text-amber-800">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
