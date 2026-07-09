'use client';

import React, { useState } from 'react';
import { useGameContext } from '../layout';
import { 
  Users, UserPlus, UserMinus, ShieldAlert, Award, Coins, 
  MessageSquare, PlusCircle, CheckCircle, XCircle, Flag
} from 'lucide-react';

export default function CommunityPage() {
  const {
    profile, currencies, guilds, myGuild, guildMembers, guildApplications, guildInvitations,
    coalitions, friendships, recruitmentPosts, createGuild, applyToGuild,
    respondToGuildApplication, manageGuildMember, withdrawGuildVault,
    sendFriendRequest, respondToFriendRequest, actionLoading, refreshData
  } = useGameContext();

  const [activeTab, setActiveTab] = useState<'guild' | 'friends' | 'recruitment'>('guild');

  const [createGuildOpen, setCreateGuildOpen] = useState(false);
  const [guildName, setGuildName] = useState('');
  const [guildTag, setGuildTag] = useState('');
  const [guildDesc, setGuildDesc] = useState('');

  const [applyGuildId, setApplyGuildId] = useState<number | null>(null);
  const [applyMsg, setApplyMsg] = useState('');

  const [friendSearchName, setFriendSearchName] = useState('');
  const [friendStatusMsg, setFriendStatusMsg] = useState('');

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [withdrawIsGold, setWithdrawIsGold] = useState(false);

  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const showStatus = (text: string, ok: boolean) => { setStatusMsg({ text, ok }); setTimeout(() => setStatusMsg(null), 3000); };

  const handleCreateGuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guildName || !guildTag) return;
    const res = await createGuild(guildName, guildTag, guildDesc);
    if (res.success) { setCreateGuildOpen(false); setGuildName(''); setGuildTag(''); setGuildDesc(''); refreshData(); }
    else showStatus(res.error || 'Failed to create guild', false);
  };

  const handleApplyGuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyGuildId) return;
    const res = await applyToGuild(applyGuildId, applyMsg);
    if (res.success) { setApplyGuildId(null); setApplyMsg(''); showStatus('Application submitted!', true); }
    else showStatus(res.error || 'Failed to apply to guild', false);
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendSearchName) return;
    setFriendStatusMsg('Sending request...');
    const res = await sendFriendRequest(friendSearchName);
    if (res.success) { setFriendStatusMsg('Friend request sent!'); setFriendSearchName(''); }
    else setFriendStatusMsg(res.error || 'Player not found.');
  };

  const handleWithdrawFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myGuild || withdrawAmount <= 0) return;
    const res = await withdrawGuildVault(myGuild.id, withdrawAmount, withdrawIsGold);
    if (res.success) { setWithdrawOpen(false); setWithdrawAmount(0); showStatus('Funds withdrawn!', true); }
    else showStatus(res.error || 'Failed to withdraw funds.', false);
  };

  const tabs = [
    { id: 'guild', label: 'Guilds & Coalitions', icon: Users },
    { id: 'friends', label: 'Diplomats & Friends', icon: UserPlus },
    { id: 'recruitment', label: 'Recruitment Board', icon: Flag },
  ] as const;

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
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
              Community & Diplomacy
            </h1>
            <p className="text-zinc-500 text-xs font-serif mt-0.5">Build coalitions, recruit citizens, command guilds, and manage friendships.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 relative z-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rpg-button flex items-center gap-2 px-3 py-2 text-[9px] tracking-widest ${activeTab === tab.id ? 'border-game-gold text-game-gold' : 'opacity-60'}`}
              >
                <Icon className="h-3.5 w-3.5" /> {tab.label}
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

        {/* Left / Main Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* ─── GUILD TAB ─── */}
          {activeTab === 'guild' && (
            <>
              {myGuild ? (
                <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-5 shadow-lg relative">
                  <div className="rpg-rivet top-1 left-1" />
                  <div className="rpg-rivet top-1 right-1" />
                  <div className="rpg-rivet bottom-1 left-1" />
                  <div className="rpg-rivet bottom-1 right-1" />

                  <div className="flex justify-between items-start border-b-2 border-game-gold/15 pb-4 relative z-10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="border border-game-gold/30 bg-game-gold/10 text-game-gold px-2 py-0.5 text-[9px] font-bold font-pixel">[{myGuild.tag}]</span>
                        <h2 className="text-lg font-bold font-display text-zinc-200">{myGuild.name}</h2>
                      </div>
                      <p className="text-zinc-500 text-xs font-serif mt-1">{myGuild.description || 'No description provided.'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-zinc-500 font-display uppercase tracking-widest">Guild Leader</p>
                      <p className="text-sm font-bold font-display text-zinc-300 mt-0.5">{myGuild.leader_name || 'Owner'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 relative z-10">
                    {[
                      { icon: Coins, color: 'text-game-gold', label: 'Treasury', value: `$${myGuild.treasury_local.toLocaleString()}` },
                      { icon: Award, color: 'text-amber-400', label: 'Gold Reserve', value: `${myGuild.treasury_gold.toLocaleString()} G` },
                      { icon: Users, color: 'text-blue-400', label: 'Members', value: String(myGuild.members_count || 1) },
                    ].map((s, i) => (
                      <div key={i} className="bg-zinc-950 border border-zinc-800 p-3 text-center">
                        <s.icon className={`h-5 w-5 ${s.color} mx-auto mb-1`} />
                        <p className="text-[8px] text-zinc-500 uppercase font-display tracking-widest">{s.label}</p>
                        <p className={`text-sm font-bold font-pixel ${s.color} mt-1`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 relative z-10">
                    <button onClick={() => setWithdrawOpen(true)} className="rpg-button flex-1 py-2 text-[9px] tracking-widest">
                      Request Treasury Payout
                    </button>
                  </div>

                  {withdrawOpen && (
                    <form onSubmit={handleWithdrawFunds} className="bg-zinc-950 border border-game-gold/15 p-4 flex flex-col gap-3 relative z-10">
                      <h4 className="text-[9px] uppercase font-bold font-display text-game-gold tracking-widest">Treasury Vault Withdrawal</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(Number(e.target.value))} placeholder="Amount" className="rpg-input px-3 py-1.5 text-xs" />
                        <select value={withdrawIsGold ? 'gold' : 'local'} onChange={(e) => setWithdrawIsGold(e.target.value === 'gold')} className="rpg-input px-3 py-1.5 text-xs">
                          <option value="local">Local Currency</option>
                          <option value="gold">Gold</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setWithdrawOpen(false)} className="rpg-button px-3 py-1.5 text-[9px] tracking-widest opacity-60">Cancel</button>
                        <button type="submit" className="rpg-button rpg-button-emerald px-4 py-1.5 text-[9px] tracking-widest">Withdraw</button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <div className="rpg-panel-stone p-8 rounded-none flex flex-col items-center gap-5 text-center shadow-lg relative">
                  <div className="rpg-rivet top-1 left-1" />
                  <div className="rpg-rivet top-1 right-1" />
                  <div className="rpg-rivet bottom-1 left-1" />
                  <div className="rpg-rivet bottom-1 right-1" />
                  <ShieldAlert className="h-12 w-12 text-zinc-600 relative z-10" />
                  <div className="relative z-10">
                    <h3 className="text-sm font-bold font-display text-zinc-300">You are not in a Guild</h3>
                    <p className="text-xs text-zinc-500 font-serif mt-1 max-w-md">
                      Guilds allow players to coordinate production, share materials, construct coalitions, and gain diplomatic influence.
                    </p>
                  </div>
                  <button onClick={() => setCreateGuildOpen(true)} className="rpg-button rpg-button-emerald px-4 py-2.5 text-[9px] tracking-widest relative z-10">
                    Form a New Guild
                  </button>

                  {createGuildOpen && (
                    <form onSubmit={handleCreateGuild} className="w-full max-w-md text-left bg-zinc-950 border border-game-gold/15 p-5 flex flex-col gap-3 relative z-10">
                      <h4 className="text-[9px] uppercase font-bold font-display text-game-gold tracking-widest">Guild Registration Board</h4>
                      {[
                        { label: 'Guild Name', val: guildName, set: setGuildName, ph: 'e.g. Iron Shields' },
                        { label: 'Guild Tag (Max 5)', val: guildTag, set: setGuildTag, ph: 'e.g. SHLD', max: 5 },
                      ].map((f, i) => (
                        <div key={i} className="flex flex-col gap-1">
                          <label className="text-[9px] text-zinc-500 font-display uppercase tracking-widest">{f.label}</label>
                          <input type="text" required value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph} maxLength={f.max} className="rpg-input px-3 py-2 text-xs w-full" />
                        </div>
                      ))}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-zinc-500 font-display uppercase tracking-widest">Description</label>
                        <textarea value={guildDesc} onChange={(e) => setGuildDesc(e.target.value)} placeholder="Our mission statement..." className="rpg-input px-3 py-2 text-xs w-full h-20 resize-none" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setCreateGuildOpen(false)} className="rpg-button px-3 py-1.5 text-[9px] tracking-widest opacity-60">Cancel</button>
                        <button type="submit" disabled={actionLoading} className="rpg-button rpg-button-emerald px-4 py-1.5 text-[9px] tracking-widest">Register Guild</button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Guild Roster */}
              {myGuild && (
                <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
                  <div className="rpg-rivet top-1 left-1" />
                  <div className="rpg-rivet top-1 right-1" />
                  <div className="rpg-rivet bottom-1 left-1" />
                  <div className="rpg-rivet bottom-1 right-1" />
                  <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3 relative z-10">Guild Roster</h3>
                  <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b-2 border-game-gold/10 text-zinc-500">
                          {['Player', 'Rank', 'Joined At', 'Actions'].map((h) => <th key={h} className="pb-2 pr-3 text-[9px] uppercase font-display tracking-widest font-bold">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {guildMembers.map((m) => (
                          <tr key={m.profile_id} className="text-zinc-300">
                            <td className="py-2.5 pr-3 font-bold font-display">{m.username || m.profile_id}</td>
                            <td className="py-2.5 pr-3">
                              <span className={`px-2 py-0.5 border text-[9px] font-bold font-display uppercase tracking-widest ${
                                m.role_name === 'Leader' ? 'border-game-gold/30 bg-game-gold/10 text-game-gold' : 'border-zinc-700 bg-zinc-900 text-zinc-400'
                              }`}>
                                {m.role_name || 'Member'}
                              </span>
                            </td>
                            <td className="py-2.5 pr-3 text-zinc-500 font-serif text-[10px]">{new Date(m.joined_at).toLocaleDateString()}</td>
                            <td className="py-2.5 flex gap-1 justify-end">
                              {profile?.id === myGuild.leader_id && m.profile_id !== profile?.id && (
                                <>
                                  <button onClick={() => manageGuildMember(myGuild.id, m.profile_id, 'promote')} className="rpg-button rpg-button-emerald px-2 py-1 text-[8px] tracking-widest">Promote</button>
                                  <button onClick={() => manageGuildMember(myGuild.id, m.profile_id, 'kick')} className="rpg-button rpg-button-crimson px-2 py-1 text-[8px] tracking-widest">Kick</button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Coalitions */}
              <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-md relative">
                <div className="rpg-rivet top-1 left-1" />
                <div className="rpg-rivet top-1 right-1" />
                <div className="rpg-rivet bottom-1 left-1" />
                <div className="rpg-rivet bottom-1 right-1" />

                <div className="flex justify-between items-center relative z-10">
                  <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest">Active Coalitions</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
                  {coalitions.map((c) => (
                    <div key={c.id} className="bg-zinc-950 border border-zinc-800 p-4 flex flex-col gap-1.5 hover:border-zinc-700 transition">
                      <h4 className="text-xs font-bold font-display text-zinc-200">{c.name}</h4>
                      <p className="text-[10px] text-zinc-500 font-serif">{c.description || 'No description.'}</p>
                      <div className="flex justify-between items-center text-[9px] text-zinc-600 border-t border-zinc-800 pt-2 mt-1 font-pixel">
                        <span>Created: {new Date(c.created_at).toLocaleDateString()}</span>
                        <span className="border border-game-gold/20 bg-game-gold/10 text-game-gold px-1.5 py-0.5 font-bold">Allied</span>
                      </div>
                    </div>
                  ))}
                  {coalitions.length === 0 && <p className="text-zinc-600 text-xs font-serif">No active coalitions formed.</p>}
                </div>
              </div>
            </>
          )}

          {/* ─── FRIENDS TAB ─── */}
          {activeTab === 'friends' && (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-5 shadow-lg relative">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <div className="flex justify-between items-center border-b-2 border-game-gold/15 pb-3 relative z-10">
                <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest">My Friends</h3>
                <span className="text-[9px] text-zinc-500 font-pixel">{friendships.filter(f => f.status === 'accepted').length} Friends</span>
              </div>

              {/* Add Friend */}
              <form onSubmit={handleAddFriend} className="flex gap-2 relative z-10">
                <input type="text" required value={friendSearchName} onChange={(e) => setFriendSearchName(e.target.value)} placeholder="Enter Player Profile UUID..." className="rpg-input flex-1 px-3 py-2 text-xs" />
                <button type="submit" className="rpg-button rpg-button-emerald px-4 py-2 text-[9px] tracking-widest flex items-center gap-1">
                  <UserPlus className="h-4 w-4" /> Send
                </button>
              </form>
              {friendStatusMsg && <p className="text-xs text-game-gold font-serif relative z-10">{friendStatusMsg}</p>}

              {/* Pending Requests */}
              {friendships.filter(f => f.status === 'pending').length > 0 && (
                <div className="flex flex-col gap-2 relative z-10">
                  <h4 className="text-[9px] uppercase font-bold font-display text-game-gold tracking-widest">Pending Requests</h4>
                  <div className="border border-zinc-800 bg-zinc-950 divide-y divide-zinc-900">
                    {friendships.filter(f => f.status === 'pending').map((f) => (
                      <div key={f.id} className="flex justify-between items-center p-3">
                        <div>
                          <p className="text-xs font-bold font-display text-zinc-300">{f.friend_name || `Player ${f.friend_id?.slice(0, 8)}`}</p>
                          <p className="text-[9px] text-zinc-600 font-serif">Sent: {new Date(f.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => respondToFriendRequest(f.id, true)} className="rpg-button rpg-button-emerald px-2.5 py-1 text-[9px] tracking-widest">Accept</button>
                          <button onClick={() => respondToFriendRequest(f.id, false)} className="rpg-button px-2.5 py-1 text-[9px] tracking-widest opacity-60">Decline</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Friends */}
              <div className="flex flex-col gap-2 relative z-10">
                <h4 className="text-[9px] uppercase font-bold font-display text-zinc-500 tracking-widest">All Friends</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {friendships.filter(f => f.status === 'accepted').map((f) => (
                    <div key={f.id} className="bg-zinc-950 border border-zinc-800 p-3 flex justify-between items-center hover:border-zinc-700 transition">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="h-8 w-8 border border-zinc-700 bg-zinc-900 flex items-center justify-center text-xs font-bold font-display text-zinc-400">
                            {f.friend_name?.slice(0, 2).toUpperCase() || 'P'}
                          </div>
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-zinc-950" />
                        </div>
                        <div>
                          <p className="text-xs font-bold font-display text-zinc-200">{f.friend_name}</p>
                          <p className="text-[9px] text-zinc-500 font-serif">Online</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button className="border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 p-1.5 text-zinc-400 transition">
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => respondToFriendRequest(f.id, false)} className="border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 p-1.5 text-red-400/80 transition">
                          <UserMinus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {friendships.filter(f => f.status === 'accepted').length === 0 && (
                    <p className="text-zinc-600 text-xs font-serif py-4 col-span-2">Your friends list is currently empty.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── RECRUITMENT TAB ─── */}
          {activeTab === 'recruitment' && (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-5 shadow-lg relative">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <div className="flex justify-between items-center border-b-2 border-game-gold/15 pb-3 relative z-10">
                <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest">Recruitment Postings</h3>
              </div>

              <div className="flex flex-col gap-4 relative z-10">
                {recruitmentPosts.map((post) => (
                  <div key={post.id} className="bg-zinc-950 border border-zinc-800 p-5 flex flex-col gap-3 hover:border-zinc-700 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`px-2 py-0.5 border text-[9px] font-bold font-display uppercase tracking-widest ${
                          post.target_type === 'guild' ? 'border-game-gold/30 bg-game-gold/10 text-game-gold' : 'border-game-emerald/30 bg-emerald-950/20 text-emerald-400'
                        }`}>
                          {post.target_type} recruitment
                        </span>
                        <h4 className="text-sm font-bold font-display text-zinc-200 mt-1.5">{post.title}</h4>
                      </div>
                      <span className="text-[9px] text-zinc-500 font-pixel">{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-zinc-500 font-serif leading-relaxed">{post.description}</p>
                    <div className="flex justify-between items-center border-t border-zinc-800 pt-3">
                      <div className="text-[9px] text-zinc-600 font-serif">
                        Posted by: <span className="text-zinc-400 font-bold">{post.creator_name || 'Admin'}</span>
                      </div>
                      <button
                        onClick={() => { if (post.target_type === 'guild' && post.target_id) setApplyGuildId(post.target_id); }}
                        className="rpg-button px-3 py-1.5 text-[9px] tracking-widest"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))}
                {recruitmentPosts.length === 0 && (
                  <p className="text-zinc-600 text-xs font-serif py-6 text-center">No recruitment posts published.</p>
                )}
              </div>

              {/* Apply Form */}
              {applyGuildId !== null && (
                <form onSubmit={handleApplyGuild} className="bg-zinc-950 border border-game-gold/15 p-5 flex flex-col gap-3 relative z-10">
                  <h4 className="text-[9px] uppercase font-bold font-display text-game-gold tracking-widest">Submit Guild Application</h4>
                  <textarea required value={applyMsg} onChange={(e) => setApplyMsg(e.target.value)} placeholder="Write a message to the leaders about why you want to join..." className="rpg-input px-3 py-2 text-xs w-full h-20 resize-none" />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setApplyGuildId(null)} className="rpg-button px-3 py-1.5 text-[9px] tracking-widest opacity-60">Cancel</button>
                    <button type="submit" className="rpg-button rpg-button-emerald px-4 py-1.5 text-[9px] tracking-widest">Submit Application</button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">

          {/* Guild Directory */}
          <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-md relative">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-3 relative z-10">Guild Directory</h3>
            <div className="flex flex-col gap-2 relative z-10">
              {guilds.map((g) => (
                <div key={g.id} className="bg-zinc-950 border border-zinc-800 p-3 flex justify-between items-center hover:border-zinc-700 transition">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-game-gold font-pixel border border-game-gold/30 bg-game-gold/10 px-1.5 py-0.5">[{g.tag}]</span>
                      <p className="text-xs font-bold font-display text-zinc-200">{g.name}</p>
                    </div>
                    <p className="text-[9px] text-zinc-500 font-serif mt-0.5">{g.members_count || 1} members</p>
                  </div>
                  {(!myGuild || myGuild.id !== g.id) && (
                    <button onClick={() => setApplyGuildId(g.id)} className="rpg-button px-2.5 py-1 text-[8px] tracking-widest">
                      Apply
                    </button>
                  )}
                </div>
              ))}
              {guilds.length === 0 && <p className="text-zinc-600 text-xs font-serif">No guilds registered.</p>}
            </div>
          </div>

          {/* Pending Applications (for guild leaders) */}
          {myGuild && profile?.id === myGuild.leader_id && guildApplications.length > 0 && (
            <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-md relative border border-game-gold/20">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest flex items-center gap-2 border-b border-game-gold/15 pb-3 relative z-10">
                <ShieldAlert className="h-4 w-4" /> Pending Applications
              </h3>
              <div className="flex flex-col gap-2 relative z-10">
                {guildApplications.map((app) => (
                  <div key={app.id} className="bg-zinc-950 border border-zinc-800 p-3 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold font-display text-zinc-300">{app.username}</span>
                      <span className="text-[9px] text-zinc-600 font-pixel">{new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                    {app.message && <p className="text-[10px] text-zinc-400 font-serif italic bg-zinc-900 border border-zinc-800 p-2">"{app.message}"</p>}
                    <div className="flex justify-end gap-1.5">
                      <button onClick={async () => { const res = await respondToGuildApplication(app.id, false); if (res.success) showStatus('Application rejected.', false); }} className="rpg-button px-3 py-1 text-[9px] tracking-widest opacity-60">Decline</button>
                      <button onClick={async () => { const res = await respondToGuildApplication(app.id, true); if (res.success) { showStatus('Application approved!', true); refreshData(); } }} className="rpg-button rpg-button-emerald px-3 py-1 text-[9px] tracking-widest">Approve</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Reputation */}
          <div className="rpg-panel-parchment p-6 rounded-none flex flex-col gap-4">
            <h3 className="text-xs font-bold font-display text-amber-950 uppercase tracking-widest border-b border-amber-950/20 pb-3">My Reputation</h3>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Trading Reputation', value: 75, color: 'text-amber-700' },
                { label: 'Military Strength', value: 120, color: 'text-red-700' },
                { label: 'Political Influence', value: 45, color: 'text-blue-700' },
                { label: 'Industrial Output', value: 160, color: 'text-emerald-700' },
              ].map((r, i) => (
                <div key={i} className="flex justify-between items-center bg-amber-950/10 border border-amber-950/10 p-2.5">
                  <span className="text-[10px] text-amber-950/70 font-serif">{r.label}</span>
                  <span className={`text-sm font-bold font-pixel ${r.color}`}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
