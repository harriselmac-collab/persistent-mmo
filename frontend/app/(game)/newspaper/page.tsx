'use client';

import React, { useState } from 'react';
import { useGameContext } from '../layout';
import { gameRepository } from '../../../services/repository/provider';
import { 
  BookOpen, FileText, PlusCircle, MessageSquare, 
  Globe, Bookmark, Calendar
} from 'lucide-react';

export default function NewspaperPage() {
  const { profile, newspapers, articles, createNewspaper, publishArticle, commentOnArticle, refreshData } = useGameContext();

  const [activeArticleId, setActiveArticleId] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [creatingPaper, setCreatingPaper] = useState(false);

  const [paperName, setPaperName] = useState('');
  const [paperDesc, setPaperDesc] = useState('');

  const [selectedPaperId, setSelectedPaperId] = useState<number | null>(null);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articleCategory, setArticleCategory] = useState<'news' | 'opinion' | 'government' | 'developer'>('news');

  const [commentInput, setCommentInput] = useState('');
  const [articleComments, setArticleComments] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const showStatus = (text: string, ok: boolean) => { setStatusMsg({ text, ok }); setTimeout(() => setStatusMsg(null), 3000); };

  const handleCreateNewspaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paperName) return;
    const res = await createNewspaper(paperName, paperDesc);
    if (res.success) { setCreatingPaper(false); setPaperName(''); setPaperDesc(''); showStatus('Newspaper press license registered!', true); refreshData(); }
    else showStatus(res.error || 'Failed to register newspaper.', false);
  };

  const handlePublishArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaperId || !articleTitle || !articleContent) return;
    const res = await publishArticle(selectedPaperId, articleTitle, articleContent, articleCategory);
    if (res.success) { setPublishing(false); setArticleTitle(''); setArticleContent(''); showStatus('Article published!', true); refreshData(); }
    else showStatus(res.error || 'Failed to publish article.', false);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeArticleId || !commentInput.trim()) return;
    const res = await commentOnArticle(activeArticleId, commentInput);
    if (res.success) {
      const text = commentInput;
      setCommentInput('');
      setArticleComments(prev => [...prev, { id: Date.now(), article_id: activeArticleId, commenter_id: profile?.id || 'you', comment: text, created_at: new Date().toISOString(), commenter_name: 'You' }]);
    } else showStatus(res.error || 'Failed to post comment.', false);
  };

  const handleOpenArticle = async (id: number) => {
    setActiveArticleId(id);
    setPublishing(false);
    const commentsData = await gameRepository.getArticleComments(id);
    setArticleComments(commentsData);
  };

  const activeArticle = articles.find(a => a.id === activeArticleId);
  const myPapers = newspapers.filter(p => p.owner_id === profile?.id);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'government': return 'border-game-gold/30 bg-game-gold/10 text-game-gold';
      case 'opinion': return 'border-blue-800/30 bg-blue-950/20 text-blue-400';
      case 'developer': return 'border-purple-800/30 bg-purple-950/20 text-purple-400';
      default: return 'border-red-900/30 bg-red-950/20 text-red-400';
    }
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
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-game-gold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
              Aegis Press Center
            </h1>
            <p className="text-zinc-500 text-xs font-serif mt-0.5">Read regional news, developer logs, and political opinions.</p>
          </div>
        </div>

        <div className="flex gap-2 relative z-10">
          {myPapers.length > 0 ? (
            <button
              onClick={() => { setPublishing(!publishing); setActiveArticleId(null); setCreatingPaper(false); if (myPapers.length > 0 && selectedPaperId === null) setSelectedPaperId(myPapers[0].id); }}
              className="rpg-button rpg-button-crimson px-4 py-2 text-[9px] tracking-widest"
            >
              {publishing ? 'Read Feed' : 'Write Article'}
            </button>
          ) : (
            <button
              onClick={() => { setCreatingPaper(!creatingPaper); setActiveArticleId(null); setPublishing(false); }}
              className="rpg-button px-4 py-2 text-[9px] tracking-widest"
            >
              Register Newspaper
            </button>
          )}
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

        {/* Main Feed Pane (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Register Newspaper */}
          {creatingPaper && (
            <form onSubmit={handleCreateNewspaper} className="rpg-panel-parchment p-6 rounded-none flex flex-col gap-4">
              <h2 className="text-sm font-bold font-display text-amber-950 border-b border-amber-950/20 pb-2">Register Newspaper License</h2>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-amber-900/70 uppercase font-display tracking-widest">Newspaper Name</label>
                <input type="text" required value={paperName} onChange={(e) => setPaperName(e.target.value)} placeholder="e.g. The Capital Vanguard" className="rpg-input px-3 py-2 text-xs w-full" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-amber-900/70 uppercase font-display tracking-widest">Tagline / Description</label>
                <textarea value={paperDesc} onChange={(e) => setPaperDesc(e.target.value)} placeholder="Daily stories of economy and war..." className="rpg-input px-3 py-2 text-xs w-full h-20 resize-none" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setCreatingPaper(false)} className="rpg-button px-4 py-2 text-[9px] tracking-widest opacity-60">Cancel</button>
                <button type="submit" className="rpg-button px-6 py-2 text-[9px] tracking-widest">Register Agency</button>
              </div>
            </form>
          )}

          {/* Publish Article */}
          {publishing && (
            <form onSubmit={handlePublishArticle} className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
              <div className="rpg-rivet top-1 left-1" />
              <div className="rpg-rivet top-1 right-1" />
              <div className="rpg-rivet bottom-1 left-1" />
              <div className="rpg-rivet bottom-1 right-1" />

              <h2 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest border-b border-game-gold/15 pb-2 flex items-center gap-2 relative z-10">
                <FileText className="h-4 w-4" /> Publish Article
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Select Newspaper</label>
                  <select value={selectedPaperId || ''} onChange={(e) => setSelectedPaperId(Number(e.target.value))} className="rpg-input px-3 py-2 text-xs w-full">
                    {myPapers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Category</label>
                  <select value={articleCategory} onChange={(e) => setArticleCategory(e.target.value as any)} className="rpg-input px-3 py-2 text-xs w-full">
                    <option value="news">News</option>
                    <option value="opinion">Opinion</option>
                    <option value="government">Government Notice</option>
                    <option value="developer">Developer Log</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 relative z-10">
                <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Headline Title</label>
                <input type="text" required value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} placeholder="The major border expansion..." className="rpg-input px-3 py-2 text-xs w-full" />
              </div>
              <div className="flex flex-col gap-1.5 relative z-10">
                <label className="text-[9px] text-zinc-500 uppercase font-display tracking-widest">Content Body</label>
                <textarea required value={articleContent} onChange={(e) => setArticleContent(e.target.value)} placeholder="Write the full report here..." className="rpg-input px-3 py-2 text-xs w-full h-40 resize-none" />
              </div>
              <div className="flex justify-end gap-2 relative z-10">
                <button type="button" onClick={() => setPublishing(false)} className="rpg-button px-4 py-2 text-[9px] tracking-widest opacity-60">Cancel</button>
                <button type="submit" className="rpg-button rpg-button-crimson px-6 py-2 text-[9px] tracking-widest">Publish Release</button>
              </div>
            </form>
          )}

          {/* Reading View */}
          {activeArticle ? (
            <div className="rpg-panel-parchment p-6 rounded-none flex flex-col gap-5 shadow-lg">
              <button onClick={() => setActiveArticleId(null)} className="text-xs text-amber-900/70 hover:text-amber-950 flex items-center gap-1 font-serif">
                ← Back to News Feed
              </button>

              <div className="border-b border-amber-950/20 pb-4 flex flex-col gap-2">
                <span className={`px-2 py-0.5 border text-[9px] uppercase font-bold font-display tracking-widest w-fit ${getCategoryBadge(activeArticle.category)}`}>
                  {activeArticle.category}
                </span>
                <h2 className="text-2xl font-bold font-display text-amber-950 leading-snug">{activeArticle.title}</h2>
                <div className="flex justify-between items-center text-xs text-amber-950/60 font-serif">
                  <span>By: <span className="font-bold text-amber-950">{activeArticle.author_name || 'Journalist'}</span></span>
                  <span>Published: {new Date(activeArticle.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="text-amber-950/80 text-xs font-serif leading-relaxed whitespace-pre-line bg-amber-950/5 border border-amber-950/10 p-4 h-64 overflow-y-auto">
                {activeArticle.content}
              </div>

              {/* Comments */}
              <div className="border-t border-amber-950/20 pt-5 flex flex-col gap-3">
                <h3 className="text-xs font-bold font-display text-amber-950 uppercase flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" /> Discussion ({articleComments.length})
                </h3>
                <form onSubmit={handleComment} className="flex gap-2">
                  <input type="text" required value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Join the discussion..." className="rpg-input flex-1 px-3 py-1.5 text-xs" />
                  <button type="submit" className="rpg-button px-4 py-1.5 text-[9px] tracking-widest">Comment</button>
                </form>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {articleComments.map((com) => (
                    <div key={com.id} className="bg-amber-950/10 border border-amber-950/10 p-3 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold font-display text-amber-950">{com.commenter_name || 'Citizen'}</span>
                        <span className="text-[8px] text-amber-900/50 font-pixel">{new Date(com.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] text-amber-950/80 font-serif">{com.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* News Feed Listing */
            !publishing && !creatingPaper && (
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest">Articles Feed</h3>
                {articles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => handleOpenArticle(art.id)}
                    className="rpg-panel-stone p-5 rounded-none flex flex-col gap-3 cursor-pointer hover:outline hover:outline-1 hover:outline-game-gold/30 shadow-md transition-all relative"
                  >
                    <div className="rpg-rivet top-0.5 left-0.5" />
                    <div className="rpg-rivet top-0.5 right-0.5" />
                    <div className="flex justify-between items-center relative z-10">
                      <span className={`px-2 py-0.5 border text-[9px] uppercase font-bold font-display tracking-widest ${getCategoryBadge(art.category)}`}>
                        {art.category}
                      </span>
                      <span className="text-[9px] text-zinc-500 flex items-center gap-1 font-pixel">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(art.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold font-display text-zinc-200 leading-snug relative z-10">{art.title}</h4>
                    <p className="text-xs text-zinc-500 font-serif line-clamp-2 leading-relaxed relative z-10">{art.content}</p>
                    <div className="flex justify-between items-center text-[9px] text-zinc-600 border-t border-game-gold/10 pt-2 font-serif relative z-10">
                      <span>Newspaper: <span className="text-zinc-400 font-bold">{art.newspaper_name || 'Press Agency'}</span></span>
                      <span>Author: <span className="text-zinc-400 font-bold">{art.author_name || 'Journalist'}</span></span>
                    </div>
                  </div>
                ))}
                {articles.length === 0 && (
                  <div className="rpg-panel-stone p-8 rounded-none flex flex-col items-center gap-3 text-zinc-600 relative shadow-md">
                    <div className="rpg-rivet top-1 left-1" />
                    <div className="rpg-rivet top-1 right-1" />
                    <Globe className="h-8 w-8 relative z-10" />
                    <p className="text-xs font-serif relative z-10">No articles published yet.</p>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Right: Press Agencies Directory */}
        <div className="flex flex-col gap-6">
          <div className="rpg-panel-stone p-6 rounded-none flex flex-col gap-4 shadow-lg relative">
            <div className="rpg-rivet top-1 left-1" />
            <div className="rpg-rivet top-1 right-1" />
            <div className="rpg-rivet bottom-1 left-1" />
            <div className="rpg-rivet bottom-1 right-1" />

            <h3 className="text-xs font-bold font-display text-game-gold uppercase tracking-widest flex items-center gap-2 border-b border-game-gold/15 pb-3 relative z-10">
              <Bookmark className="h-4 w-4" /> Press Agencies
            </h3>
            <div className="flex flex-col gap-3 relative z-10">
              {newspapers.map((p) => (
                <div key={p.id} className="bg-zinc-950 border border-zinc-800 p-3.5 flex flex-col gap-1.5">
                  <h4 className="text-xs font-bold font-display text-zinc-200">{p.name}</h4>
                  <p className="text-[9px] text-zinc-500 font-serif">{p.description || 'No description tagline.'}</p>
                  <div className="flex justify-between items-center text-[8px] text-zinc-600 font-pixel border-t border-zinc-800 pt-2">
                    <span>Owner: {p.owner_name}</span>
                    <span>ID #{p.id}</span>
                  </div>
                </div>
              ))}
              {newspapers.length === 0 && (
                <p className="text-zinc-600 text-xs font-serif py-4 text-center">No press agencies licensed.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
