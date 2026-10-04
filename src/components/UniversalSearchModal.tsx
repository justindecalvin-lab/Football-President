import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Player, Club, RivalAgent, NewsItem } from '../types';
import { Search, X, User, Shield, Briefcase, Newspaper, Sparkles, ArrowRight } from 'lucide-react';
import { formatMoney } from '../utils/gameEngine';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  clubs: Club[];
  rivalAgents?: RivalAgent[];
  news?: NewsItem[];
  onSelectPlayer?: (player: Player) => void;
  onSelectClub?: (club: Club) => void;
  onNavigateTab?: (tab: string) => void;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
  players,
  clubs,
  rivalAgents = [],
  news = [],
  onSelectPlayer,
  onSelectClub,
  onNavigateTab
}) => {
  const [query, setQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'players' | 'clubs' | 'agents' | 'news'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    const results: Array<{
      id: string;
      category: 'players' | 'clubs' | 'agents' | 'news';
      title: string;
      subtitle: string;
      tag: string;
      tagColor: string;
      data: any;
    }> = [];

    // Search Players with early-exit loop (stops after 10 matches instead of scanning all 10,000 players)
    if (filterCategory === 'all' || filterCategory === 'players') {
      let foundCount = 0;
      for (let i = 0; i < players.length; i++) {
        const p = players[i];
        if (
          p.name.toLowerCase().includes(q) || 
          (p.clubName && p.clubName.toLowerCase().includes(q)) || 
          p.position.toLowerCase().includes(q) || 
          (p.nationality && p.nationality.toLowerCase().includes(q))
        ) {
          results.push({
            id: `p_${p.id}`,
            category: 'players',
            title: `${p.name} (${p.position} · ${p.rating} OVR)`,
            subtitle: `${p.clubName || 'Free Agent'} · Age ${p.age} · €${formatMoney(p.value)} · ${p.isMyClient ? '⭐ Your Client' : 'Market Prospect'}`,
            tag: p.isMyClient ? 'CLIENT' : 'PLAYER',
            tagColor: p.isMyClient ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-blue-500/20 text-blue-300 border-blue-500/40',
            data: p
          });
          foundCount++;
          if (foundCount >= 10) break;
        }
      }
    }

    // Search Clubs with early-exit loop
    if (filterCategory === 'all' || filterCategory === 'clubs') {
      let foundClubs = 0;
      for (let i = 0; i < clubs.length; i++) {
        const c = clubs[i];
        if (
          c.name.toLowerCase().includes(q) || 
          c.league.toLowerCase().includes(q) || 
          (c.country && c.country.toLowerCase().includes(q))
        ) {
          results.push({
            id: `c_${c.id}`,
            category: 'clubs',
            title: c.name,
            subtitle: `${c.league} · Rep ${c.reputation}/100 · Transfer Budget: €${formatMoney(c.transferBudget)}`,
            tag: 'CLUB',
            tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
            data: c
          });
          foundClubs++;
          if (foundClubs >= 8) break;
        }
      }
    }

    // Search Rival Agents
    if (filterCategory === 'all' || filterCategory === 'agents') {
      rivalAgents
        .filter(a => a.name.toLowerCase().includes(q) || a.agencyName.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach(a => {
          results.push({
            id: `a_${a.id}`,
            category: 'agents',
            title: `${a.name} (${a.agencyName})`,
            subtitle: `Influence: ${a.influence}% · Strategy: ${a.strategy} · Relationship: ${a.relationship > 0 ? '+' : ''}${a.relationship}`,
            tag: 'AGENT',
            tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
            data: a
          });
        });
    }

    // Search News
    if (filterCategory === 'all' || filterCategory === 'news') {
      news
        .filter(n => n.headline.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach(n => {
          results.push({
            id: `n_${n.id}`,
            category: 'news',
            title: n.headline,
            subtitle: `Week ${n.week} · Season ${n.season} · ${n.category.toUpperCase()}`,
            tag: 'NEWS',
            tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
            data: n
          });
        });
    }

    return results;
  }, [query, filterCategory, players, clubs, rivalAgents, news]);

  // Handle Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, searchResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + searchResults.length) % Math.max(1, searchResults.length));
    } else if (e.key === 'Enter' && searchResults[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(searchResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelectResult = (result: (typeof searchResults)[0]) => {
    if (result.category === 'players') {
      if (result.data.isMyClient) {
        onNavigateTab?.('my_players');
      } else {
        onNavigateTab?.('transfer_market');
      }
      onSelectPlayer?.(result.data);
    } else if (result.category === 'clubs') {
      onSelectClub?.(result.data);
    } else if (result.category === 'agents') {
      onNavigateTab?.('rival_agents');
    } else if (result.category === 'news') {
      onNavigateTab?.('news_awards');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
          <Search className="w-5 h-5 text-amber-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search players, wonderkids, clubs, rival agents, news... (Press ⌘K or Ctrl+K)"
            className="flex-1 bg-transparent text-white text-base focus:outline-none placeholder-slate-500 font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 font-mono">
            ESC to close
          </span>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-950/30 border-b border-slate-800/80 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'All Results' },
            { id: 'players', label: 'Players' },
            { id: 'clubs', label: 'Clubs' },
            { id: 'agents', label: 'Rival Agents' },
            { id: 'news', label: 'News Archive' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setFilterCategory(tab.id as any);
                setSelectedIndex(0);
              }}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition whitespace-nowrap ${
                filterCategory === tab.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-amber-400/50 mb-2" />
              <p className="text-sm font-bold text-slate-400">Universal Intelligence Finder</p>
              <p className="text-xs">Type a player name, club, nationality, or agent to search across the entire football ecosystem.</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-1">
              <p className="text-sm font-bold text-slate-400">No matching records found for "{query}"</p>
              <p className="text-xs">Try searching by position (e.g., "ST", "CAM") or league name.</p>
            </div>
          ) : (
            searchResults.map((res, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={res.id}
                  onClick={() => handleSelectResult(res)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl cursor-pointer transition flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-amber-500/10 border border-amber-500/30' : 'hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                      {res.category === 'players' && <User className="w-4 h-4 text-blue-400" />}
                      {res.category === 'clubs' && <Shield className="w-4 h-4 text-emerald-400" />}
                      {res.category === 'agents' && <Briefcase className="w-4 h-4 text-purple-400" />}
                      {res.category === 'news' && <Newspaper className="w-4 h-4 text-rose-400" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-extrabold text-white truncate">{res.title}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-black ${res.tagColor}`}>
                          {res.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{res.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-500">
                    {isSelected && <ArrowRight className="w-4 h-4 text-amber-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 px-4">
          <div className="flex items-center gap-3">
            <span>Use <kbd className="bg-slate-800 text-slate-300 px-1 py-0.5 rounded font-mono">↑</kbd> <kbd className="bg-slate-800 text-slate-300 px-1 py-0.5 rounded font-mono">↓</kbd> to navigate</span>
            <span><kbd className="bg-slate-800 text-slate-300 px-1 py-0.5 rounded font-mono">Enter</kbd> to select</span>
          </div>
          <span className="text-amber-400/80 font-semibold">{searchResults.length} results</span>
        </div>
      </div>
    </div>
  );
};
