'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameContext } from '../layout';
import { gameRepository } from '../../../services/repository/provider';
import { 
  Send, 
  MessageSquare, 
  Users, 
  Globe, 
  Radio, 
  Search, 
  Volume2,
  Plus,
  AlertCircle
} from 'lucide-react';

export default function MessengerPage() {
  const {
    profile,
    conversationThreads,
    sendDirectMessage,
    createConversationThread
  } = useGameContext();

  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [createThreadOpen, setCreateThreadOpen] = useState(false);
  const [targetUserUuid, setTargetUserUuid] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeThreadId === null) { setMessages([]); return; }
    const loadMessages = async () => {
      const data = await gameRepository.getDirectMessages(activeThreadId);
      setMessages(data);
    };
    loadMessages();
    const timer = setInterval(loadMessages, 3000);
    return () => clearInterval(timer);
  }, [activeThreadId]);

  useEffect(() => {
    if (conversationThreads.length > 0 && activeThreadId === null) {
      setActiveThreadId(conversationThreads[0].id);
    }
  }, [conversationThreads, activeThreadId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThreadId || !typedMessage.trim()) return;
    const msgContent = typedMessage;
    setTypedMessage('');
    setMessages(prev => [...prev, {
      id: Date.now(), thread_id: activeThreadId,
      sender_id: profile?.id || 'current-user',
      content: msgContent, created_at: new Date().toISOString(),
      read_by_json: [], sender_name: 'You'
    }]);
    await sendDirectMessage(activeThreadId, msgContent);
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserUuid) return;
    const res = await createConversationThread('private', [profile?.id || '', targetUserUuid]);
    if (res.success && res.threadId) {
      setActiveThreadId(res.threadId);
      setCreateThreadOpen(false);
      setTargetUserUuid('');
    }
  };

  const getThreadIcon = (type: string) => {
    switch (type) {
      case 'private': return <MessageSquare className="h-4 w-4 text-game-gold" />;
      case 'guild': return <Users className="h-4 w-4 text-emerald-400" />;
      case 'country': return <Globe className="h-4 w-4 text-blue-400" />;
      case 'trade': return <Volume2 className="h-4 w-4 text-amber-400" />;
      default: return <Radio className="h-4 w-4 text-purple-400" />;
    }
  };

  const activeThread = conversationThreads.find(t => t.id === activeThreadId);
  const filteredThreads = conversationThreads.filter(t =>
    t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-200px)] min-h-[600px]">

      {/* Header */}
      <div className="rpg-panel-stone p-4 rounded-none relative shadow-lg shrink-0">
        <div className="rpg-rivet top-1 left-1" />
        <div className="rpg-rivet top-1 right-1" />
        <div className="rpg-rivet bottom-1 left-1" />
        <div className="rpg-rivet bottom-1 right-1" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2.5 border-2 border-game-gold/30 bg-zinc-950 text-game-gold">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-game-gold tracking-wide">Aegis Messenger</h1>
            <p className="text-zinc-500 text-xs font-serif">Real-time encrypted communication frequencies across Aegis networks.</p>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex gap-0 min-h-0 overflow-hidden rpg-panel-stone rounded-none shadow-xl relative">
        <div className="rpg-rivet top-1 left-1 z-20" />
        <div className="rpg-rivet top-1 right-1 z-20" />
        <div className="rpg-rivet bottom-1 left-1 z-20" />
        <div className="rpg-rivet bottom-1 right-1 z-20" />

        {/* Thread Sidebar */}
        <div className="w-72 flex flex-col border-r-2 border-game-gold/15 bg-zinc-950/30 shrink-0 relative z-10">
          <div className="p-3 border-b-2 border-game-gold/15 flex flex-col gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rpg-input w-full pl-8 pr-3 py-1.5 text-xs"
              />
            </div>
            <button
              onClick={() => setCreateThreadOpen(!createThreadOpen)}
              className="rpg-button w-full py-1.5 text-[9px] tracking-widest flex items-center justify-center gap-1"
            >
              <Plus className="h-3 w-3" /> New Direct Message
            </button>
          </div>

          {/* New Thread Form */}
          {createThreadOpen && (
            <form onSubmit={handleCreateThread} className="p-3 border-b border-zinc-800 bg-zinc-950 flex flex-col gap-2">
              <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-display font-bold">Recipient Player UUID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={targetUserUuid}
                  onChange={(e) => setTargetUserUuid(e.target.value)}
                  placeholder="e.g. 9999-9999-..."
                  className="rpg-input flex-1 px-2 py-1 text-xs"
                />
                <button type="submit" className="rpg-button rpg-button-emerald px-3 py-1 text-[9px] tracking-widest">Start</button>
              </div>
            </form>
          )}

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
            {filteredThreads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              return (
                <div
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-game-gold/8 border-l-2 border-game-gold'
                      : 'border-l-2 border-transparent hover:bg-zinc-900/50 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 border border-zinc-800 bg-zinc-950 flex items-center justify-center">
                      {getThreadIcon(thread.type)}
                    </div>
                    <div>
                      <p className={`text-xs font-bold font-display ${isActive ? 'text-game-gold' : 'text-zinc-200'}`}>
                        {thread.title}
                      </p>
                      <p className="text-[9px] text-zinc-500 font-serif truncate max-w-[140px] mt-0.5">
                        {thread.last_message || 'No messages.'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] text-zinc-600 font-pixel shrink-0">
                    {thread.last_message_at ? new Date(thread.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              );
            })}
            {filteredThreads.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-zinc-600">
                <AlertCircle className="h-6 w-6" />
                <p className="text-[10px] font-serif">No frequencies matching search.</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-zinc-950/20 relative z-10">
          {activeThread ? (
            <>
              {/* Thread Info Bar */}
              <div className="p-3 border-b-2 border-game-gold/15 flex justify-between items-center bg-zinc-950/30">
                <div className="flex items-center gap-2">
                  {getThreadIcon(activeThread.type)}
                  <div>
                    <h3 className="text-sm font-bold font-display text-zinc-200">{activeThread.title}</h3>
                    <p className="text-[9px] text-zinc-500 capitalize font-serif">{activeThread.type} frequency</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] text-zinc-500 font-pixel">Connected</span>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === profile?.id || msg.sender_name === 'You';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold font-display text-zinc-400">
                          {isMe ? 'You' : msg.sender_name || 'Sender'}
                        </span>
                        <span className="text-[8px] text-zinc-600 font-pixel">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`px-3 py-2 text-xs leading-relaxed max-w-[70%] border ${
                        isMe
                          ? 'bg-game-gold/10 border-game-gold/30 text-zinc-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Send Input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t-2 border-game-gold/15 flex gap-2">
                <input
                  type="text"
                  required
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  placeholder={`Send to ${activeThread.title}...`}
                  className="rpg-input flex-1 px-3 py-2 text-xs"
                />
                <button type="submit" className="rpg-button px-3 py-2">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-8 gap-4">
              <MessageSquare className="h-12 w-12 text-zinc-700" />
              <div>
                <h4 className="font-bold font-display text-zinc-400">Select a Frequency</h4>
                <p className="text-xs text-zinc-600 font-serif mt-1 max-w-[280px]">
                  Connect to a conversation thread in the left sidebar to start transmission.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
