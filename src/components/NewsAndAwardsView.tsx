import React, { useState } from 'react';
import { NewsItem, Player, AgencyState } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { QuestsPanel } from './QuestsPanel';
import { CareerJourneyTimeline } from './CareerJourneyTimeline';
import { 
  Trophy, 
  Flame, 
  Sparkles, 
  Award, 
  Star, 
  Crown,
  Medal,
  CheckCircle2,
  Megaphone,
  Search,
  Zap,
  Radio,
  Send,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Filter,
  Target,
  Milestone,
  Check,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface NewsAndAwardsViewProps {
  news: NewsItem[];
  players: Player[];
  agency: AgencyState;
  setNews: React.Dispatch<React.SetStateAction<NewsItem[]>>;
  setAgency: React.Dispatch<React.SetStateAction<AgencyState>>;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  onAdvanceWeek: () => void;
  onTriggerRandomEvent: () => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenTab?: (tab: string) => void;
}

export const NewsAndAwardsView: React.FC<NewsAndAwardsViewProps> = ({
  news,
  players,
  agency,
  setNews,
  setAgency,
  setPlayers,
  onAdvanceWeek,
  onTriggerRandomEvent,
  addToast,
  onOpenTab
}) => {
  const [activeTab, setActiveTab] = useState<'news_feed' | 'interviews' | 'press_desk' | 'golden_ball' | 'quests' | 'timeline'>('news_feed');
  const [selectedRoleChannel, setSelectedRoleChannel] = useState<'ALL' | 'MY_ROLE' | 'AGENT' | 'CLUB_OWNER' | 'FA_PRESIDENT'>('MY_ROLE');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentRole = (agency.activeRoles?.currentRole || 'agent') as 'agent' | 'club_owner' | 'fa_president';
  const pressInterviews = agency.pressInterviews || [];
  const pendingInterviews = pressInterviews.filter(i => !i.answered);

  // Press Desk Draft State
  const [customHeadline, setCustomHeadline] = useState<string>('');
  const [customContent, setCustomContent] = useState<string>('');
  const [customTargetPlayerId, setCustomTargetPlayerId] = useState<string>(players.filter(p => p.isMyClient)[0]?.id || '');
  const [customType, setCustomType] = useState<'contract_demand' | 'loyalty_pledge' | 'defend_client' | 'transfer_rumor'>('contract_demand');
  const [customAudience, setCustomAudience] = useState<'all' | 'agent' | 'club_owner' | 'fa_president'>('all');

  // Filtered News items
  const filteredNews = news.filter(item => {
    // Role filter
    if (selectedRoleChannel === 'MY_ROLE') {
      const matchRole = !item.targetRole || item.targetRole === 'all' || item.targetRole === currentRole || (item.targetRoles && item.targetRoles.includes(currentRole));
      if (!matchRole) return false;
    } else if (selectedRoleChannel !== 'ALL') {
      const targetRoleKey = selectedRoleChannel.toLowerCase();
      const matchRole = !item.targetRole || item.targetRole === 'all' || item.targetRole === targetRoleKey || (item.targetRoles && item.targetRoles.includes(targetRoleKey as any));
      if (!matchRole) return false;
    }

    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory.toLowerCase();
    const matchesUrgency = selectedUrgency === 'ALL' || item.urgency === selectedUrgency.toLowerCase();
    const matchesSearch = item.headline.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesUrgency && matchesSearch;
  });

  const handleToggleReadItem = (id: string) => {
    setNews(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const handleMarkAllChannelRead = () => {
    setNews(prev => prev.map(n => ({ ...n, read: true })));
    addToast('All news items marked as read.', 'info');
  };

  // Top candidates for awards
  const goldenBallCandidates = [...players].sort((a, b) => b.rating - a.rating).slice(0, 3);
  const goldenBoyCandidates = [...players].filter(p => p.age <= 20).sort((a, b) => b.potential - a.potential).slice(0, 3);

  // Interactive News Actions
  const handleIssueStatement = (item: NewsItem) => {
    if (agency.balance < 20000) {
      addToast('Need €20,000 to issue official press statement.', 'error');
      return;
    }
    setAgency(prev => ({ ...prev, balance: prev.balance - 20000 }));
    // Reduce scandal or boost morale
    setPlayers(prev => prev.map(p => p.isMyClient ? { ...p, morale: Math.min(100, p.morale + 5) } : p));
    addToast(`📢 Official Agency Press Statement Issued! (-€20,000)`, 'success');
  };

  const handlePrCrisisTeam = (item: NewsItem) => {
    if (agency.balance < 50000) {
      addToast('Need €50,000 to hire PR Crisis Specialists.', 'error');
      return;
    }
    setAgency(prev => ({
      ...prev,
      balance: prev.balance - 50000,
      presidency: {
        ...prev.presidency,
        conflictScandalLevel: Math.max(0, (prev.presidency?.conflictScandalLevel || 0) - 15)
      }
    }));
    addToast(`🛡️ PR Crisis Team Suppressed Scandal! (-15% Scandal Level)`, 'success');
  };

  const handleLeakToTabloid = (item: NewsItem) => {
    if (agency.balance < 10000) {
      addToast('Need €10,000 to leak confidential tips to tabloids.', 'error');
      return;
    }
    setAgency(prev => ({ ...prev, balance: prev.balance - 10000, darkArtsScore: prev.darkArtsScore + 2 }));
    addToast(`📰 Confidential Tip Leaked to Daily Mail! (+2 Dark Arts Score)`, 'info');
  };

  // Publish Custom Press Statement
  const handlePublishCustomPress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customHeadline.trim() || !customContent.trim()) {
      addToast('Please enter both headline and content for press release.', 'error');
      return;
    }

    if (agency.balance < 25000) {
      addToast('Need €25,000 to publish official press distribution.', 'error');
      return;
    }

    const targetRoleBadge = customAudience === 'agent' 
      ? '💼 Agency Statement' 
      : customAudience === 'club_owner' 
      ? '👑 Presidential Directive' 
      : customAudience === 'fa_president' 
      ? '🏛️ Governance Circular' 
      : '🌐 Press Statement';

    const newArticle: NewsItem = {
      id: `custom_press_${Date.now()}`,
      week: agency.currentWeek,
      season: agency.currentSeason,
      headline: `OFFICIAL STATEMENT: ${customHeadline}`,
      content: customContent,
      category: customAudience === 'fa_president' ? 'governance' : 'agency',
      urgency: 'hot',
      read: false,
      targetRole: customAudience,
      roleBadge: targetRoleBadge,
      actionTab: 'news_awards',
      actionLabel: 'View Bulletin'
    };

    setNews(prev => [newArticle, ...prev]);
    setAgency(prev => ({ 
      ...prev, 
      balance: prev.balance - 25000, 
      reputation: Math.min(100, prev.reputation + 2),
      presidency: customAudience === 'fa_president' && prev.presidency ? {
        ...prev.presidency,
        politicalInfluence: Math.min(100, (prev.presidency.politicalInfluence || 50) + 3)
      } : prev.presidency
    }));

    // Apply morale / market value effects to targeted client
    if (customTargetPlayerId) {
      setPlayers(prev => prev.map(p => {
        if (p.id === customTargetPlayerId) {
          if (customType === 'contract_demand') {
            return { ...p, wage: Math.round(p.wage * 1.1), morale: Math.min(100, p.morale + 10) };
          } else if (customType === 'loyalty_pledge') {
            return { ...p, morale: Math.min(100, p.morale + 15), loyalty: Math.min(100, p.loyalty + 10) };
          } else if (customType === 'transfer_rumor') {
            return { ...p, value: Math.round(p.value * 1.15) };
          }
        }
        return p;
      }));
    }

    confetti({ particleCount: 50, spread: 60 });
    addToast('🗞️ Press Statement Published Across Global Media Network!', 'success');
    setCustomHeadline('');
    setCustomContent('');
    setActiveTab('news_feed');
  };

  // Handle Press Interview Option Selection
  const handleAnswerInterview = (interviewId: string, optionId: string) => {
    const targetInterview = pressInterviews.find(i => i.id === interviewId);
    if (!targetInterview) return;

    const selectedOpt = targetInterview.options.find(o => o.id === optionId);
    if (!selectedOpt) return;

    setAgency(prev => {
      const updatedInterviews = (prev.pressInterviews || []).map(i => {
        if (i.id === interviewId) {
          return { ...i, answered: true, selectedOptionId: optionId };
        }
        return i;
      });

      return {
        ...prev,
        reputation: Math.max(0, Math.min(100, prev.reputation + (selectedOpt.reputationDelta || 0))),
        darkArtsScore: Math.max(0, prev.darkArtsScore + (selectedOpt.darkArtsDelta || 0)),
        pressInterviews: updatedInterviews
      };
    });

    if (targetInterview.playerId) {
      setPlayers(prev => prev.map(p => {
        if (p.id === targetInterview.playerId) {
          const newMorale = Math.max(10, Math.min(100, p.morale + (selectedOpt.moraleDelta || 0)));
          let updatedUnrest = p.unrest;

          if (selectedOpt.unrestDelta && p.unrest) {
            const newLevel = Math.max(0, Math.min(100, (p.unrest.discontentLevel || 0) + selectedOpt.unrestDelta));
            updatedUnrest = {
              ...p.unrest,
              discontentLevel: newLevel,
              status: newLevel === 0 ? 'content' : (newLevel > 80 ? 'transfer_requested' : 'discontent')
            };
          }

          return {
            ...p,
            morale: newMorale,
            unrest: updatedUnrest
          };
        }
        return p;
      }));
    }

    addToast(`🎙️ ${selectedOpt.mediaReaction}`, 'info');
  };

  return (
    <div className="space-y-6">
      
      {/* Animated Live News Ticker */}
      <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-3 flex items-center gap-3 overflow-hidden shadow-lg">
        <div className="bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg flex items-center gap-1.5 shrink-0 animate-pulse">
          <Radio className="w-3.5 h-3.5" />
          <span>Live Ticker</span>
        </div>

        <div className="overflow-hidden whitespace-nowrap text-xs text-amber-200/90 font-mono font-medium flex-1">
          <div className="inline-block animate-marquee space-x-8">
            {news.slice(0, 5).map((n, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                <span className="text-red-400 font-bold">[{n.category.toUpperCase()}]</span>
                <span>{n.headline}</span>
                <span className="text-slate-500">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Header Banner & Tab Controls */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Global Football Press & News Center</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track breaking transfer sagas, publish agency press releases, handle scandals, and trigger random events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Trigger Random Event Button */}
          <button
            onClick={onTriggerRandomEvent}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Trigger Random Event</span>
          </button>
        </div>
      </div>

      {/* Tab Selection */}
      <div className="flex border-b border-slate-800 gap-2 pb-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'news_feed', label: `Live Press Stream (${filteredNews.length})`, icon: Flame },
          { id: 'interviews', label: `Media Interviews (${pendingInterviews.length})`, icon: Radio },
          { id: 'press_desk', label: 'Agency Press Desk (Publish)', icon: FileText },
          { id: 'golden_ball', label: 'Golden Ball & Awards', icon: Trophy },
          { id: 'quests', label: 'Campaign Quests', icon: Target },
          { id: 'timeline', label: 'Career Journey', icon: Milestone },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.id === 'interviews' && pendingInterviews.length > 0 && (
                <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                  {pendingInterviews.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: NEWS STREAM */}
      {activeTab === 'news_feed' && (
        <div className="space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
            {/* Role Channel Selector Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                <span className="text-slate-400 text-[11px] font-bold uppercase shrink-0">Channel:</span>
                {[
                  { id: 'MY_ROLE', label: `🎯 My Role Feed (${news.filter(n => !n.targetRole || n.targetRole === 'all' || n.targetRole === currentRole || (n.targetRoles && n.targetRoles.includes(currentRole))).length})` },
                  { id: 'ALL', label: `All Broadcasts (${news.length})` },
                  { id: 'AGENT', label: `💼 Agent (${news.filter(n => n.targetRole === 'agent' || (n.targetRoles && n.targetRoles.includes('agent'))).length})` },
                  { id: 'CLUB_OWNER', label: `👑 Club Owner (${news.filter(n => n.targetRole === 'club_owner' || (n.targetRoles && n.targetRoles.includes('club_owner'))).length})` },
                  { id: 'FA_PRESIDENT', label: `🏛️ FA President (${news.filter(n => n.targetRole === 'fa_president' || (n.targetRoles && n.targetRoles.includes('fa_president'))).length})` },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedRoleChannel(ch.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedRoleChannel === ch.id
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleMarkAllChannelRead}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mark All Read</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 flex items-center gap-2 w-full">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search headlines, players, clubs, scandals, regulations..."
                  className="bg-transparent text-xs text-white focus:outline-none w-full"
                />
              </div>

              {/* Urgency Filter */}
              <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
                <span className="text-slate-400 text-[11px] font-bold uppercase">Urgency:</span>
                {['ALL', 'BREAKING', 'HOT', 'NORMAL'].map((urg) => (
                  <button
                    key={urg}
                    onClick={() => setSelectedUrgency(urg)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer ${
                      selectedUrgency === urg
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {urg}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
              {['ALL', 'TRANSFER', 'SCANDAL', 'GOVERNANCE', 'AGENCY', 'MATCH', 'AWARD'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* News Cards List */}
          <div className="space-y-3">
            {filteredNews.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 italic text-xs">
                No matching news articles found in selected role channel or search filters.
              </div>
            ) : (
              filteredNews.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-2xl p-5 space-y-3 transition shadow-lg ${
                    !item.read ? 'ring-1 ring-amber-500/40' : ''
                  } ${
                    item.category === 'governance'
                      ? 'bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border-blue-500/40 hover:border-blue-400'
                      : item.category === 'scandal'
                      ? 'bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border-red-500/40 hover:border-red-400'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.roleBadge && (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {item.roleBadge}
                        </span>
                      )}

                      <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded ${
                        item.urgency === 'breaking' ? 'bg-red-600 text-white animate-pulse shadow-lg' :
                        item.urgency === 'hot' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {item.category} • {item.urgency}
                      </span>

                      <span className="text-xs text-slate-400 font-medium">Week {item.week} (S{item.season})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleReadItem(item.id)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                          item.read
                            ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>{item.read ? 'Read' : 'Mark Read'}</span>
                      </button>
                      <span className="text-[11px] text-slate-500 font-mono">ID: {item.id.slice(0, 8)}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-100">{item.headline}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1.5">{item.content}</p>
                  </div>

                  {/* Interactive Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleIssueStatement(item)}
                        className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                        <span>Issue Statement (€20k)</span>
                      </button>

                      {item.category === 'scandal' && (
                        <button
                          onClick={() => handlePrCrisisTeam(item)}
                          className="bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-500/40 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                          <span>Hire PR Crisis Team (€50k)</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleLeakToTabloid(item)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-sky-400" />
                        <span>Leak to Tabloids (€10k)</span>
                      </button>
                    </div>

                    {/* Direct Action Link if available */}
                    {item.actionTab && onOpenTab && (
                      <button
                        onClick={() => onOpenTab(item.actionTab!)}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
                      >
                        <span>{item.actionLabel || 'Jump to Module'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRESS CONFERENCES & MEDIA INTERVIEWS */}
      {activeTab === 'interviews' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-400" />
              <span>Press Conferences & Media Interviews</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Reporters from Sky Sports, BBC Sport, Gazzetta, and L'Equipe are demanding answers regarding your clients. Your statements directly impact player morale, board relations, and agency reputation!
            </p>
          </div>

          {pressInterviews.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 italic text-xs">
              No press interviews on your media desk at the moment. Advance weekly fixtures to receive new press conference summons.
            </div>
          ) : (
            <div className="space-y-4">
              {pressInterviews.map((interview) => {
                const targetPlayer = players.find(p => p.id === interview.playerId);
                const isAnswered = interview.answered;

                return (
                  <div 
                    key={interview.id} 
                    className={`bg-slate-900 border ${isAnswered ? 'border-slate-800 opacity-80' : 'border-amber-500/40 shadow-xl'} rounded-2xl p-5 space-y-4`}
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl p-2 bg-slate-950 rounded-xl border border-slate-800">
                          {interview.journalistAvatar || '🎙️'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-amber-400">{interview.journalistName}</span>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-bold">
                              {interview.mediaOutlet}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Target: <strong className="text-white">{interview.playerName}</strong> ({targetPlayer?.clubName || 'Client'}) • Wk {interview.week}, {interview.season}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${isAnswered ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'}`}>
                        {isAnswered ? 'INTERVIEW COMPLETED' : 'RESPONSE REQUIRED'}
                      </span>
                    </div>

                    {/* Question */}
                    <blockquote className="bg-slate-950 border-l-4 border-amber-500 p-3.5 rounded-r-xl text-xs text-slate-200 italic font-serif leading-relaxed">
                      "{interview.question}"
                    </blockquote>

                    {/* Options or Selected Choice */}
                    {!isAnswered ? (
                      <div className="space-y-2 pt-1">
                        <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                          Choose Your Statement to the Press:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {interview.options.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => handleAnswerInterview(interview.id, option.id)}
                              className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 p-3 rounded-xl text-left transition cursor-pointer space-y-1 group active:scale-98"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-extrabold text-xs text-amber-300 group-hover:text-amber-200">
                                  {option.label}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                  {option.moraleDelta !== 0 && (
                                    <span className={option.moraleDelta > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                      {option.moraleDelta > 0 ? `+${option.moraleDelta}` : option.moraleDelta} Morale
                                    </span>
                                  )}
                                  {option.reputationDelta !== 0 && (
                                    <span className={option.reputationDelta > 0 ? 'text-purple-400' : 'text-slate-400'}>
                                      {option.reputationDelta > 0 ? `+${option.reputationDelta}` : option.reputationDelta} Rep
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-300 italic">"{option.text}"</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-1">
                        <p className="text-[10px] font-bold uppercase text-slate-500">Your Statement to the Press:</p>
                        <p className="text-xs text-emerald-300 font-semibold italic">
                          "{interview.options.find(o => o.id === interview.selectedOptionId)?.text}"
                        </p>
                        <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                          Media Reaction: {interview.options.find(o => o.id === interview.selectedOptionId)?.mediaReaction}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AGENCY PRESS DESK */}
      {activeTab === 'press_desk' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-400" />
              <span>Agency Media Distribution Desk</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Draft and issue official press releases to global football media to alter player morale, demand contract raises, or build transfer hype.
            </p>
          </div>

          <form onSubmit={handlePublishCustomPress} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Target Client</label>
                <select
                  value={customTargetPlayerId}
                  onChange={(e) => setCustomTargetPlayerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 text-xs font-bold"
                >
                  {players.filter(p => p.isMyClient).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.position}, OVR {p.rating}) - {p.clubName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Target Broadcast Audience</label>
                <select
                  value={customAudience}
                  onChange={(e) => setCustomAudience(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 text-xs font-bold"
                >
                  <option value="all">🌐 Entire Global Football Press</option>
                  <option value="agent">💼 Agency & Transfer Representation Wire</option>
                  <option value="club_owner">👑 Club Presidents & Board of Directors</option>
                  <option value="fa_president">🏛️ Federation Council & FIFA Delegates</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Press Release Objective</label>
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 text-xs font-bold"
                >
                  <option value="contract_demand">Demand Wage Renewal (+10% Salary & Morale)</option>
                  <option value="loyalty_pledge">Pledge Long-Term Loyalty (+15 Morale & Loyalty)</option>
                  <option value="transfer_rumor">Fuel European Transfer Hype (+15% Market Value)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Headline</label>
              <input
                type="text"
                value={customHeadline}
                onChange={(e) => setCustomHeadline(e.target.value)}
                placeholder="e.g., Agency Demands Champions League Football for Star Client!"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Press Content & Directives</label>
              <textarea
                rows={3}
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                placeholder="Specify official agency position for press release distribution..."
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black p-3.5 rounded-xl text-xs transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4 fill-current" />
              <span>Publish Official Press Statement (€25,000)</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: GOLDEN BALL GALA */}
      {activeTab === 'golden_ball' && (
        <div className="bg-gradient-to-br from-amber-950/80 via-slate-900 to-amber-950/90 border-2 border-amber-500/50 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Annual World Football Gala</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-wide">The Golden Ball & Agent of the Year Awards</h2>
            <p className="text-xs text-amber-200/80">Recognizing the world's finest players and super-agents.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {/* Golden Ball Winner */}
            <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-6 space-y-3 shadow-xl transform hover:-translate-y-1 transition">
              <Trophy className="w-10 h-10 text-amber-400 mx-auto animate-bounce-slow" />
              <h3 className="font-bold text-amber-300 text-sm">Golden Ball (Player of the Year)</h3>
              <div className="pt-2">
                <p className="font-extrabold text-lg text-white">{goldenBallCandidates[0]?.name || 'Kylian Mbappe'}</p>
                <p className="text-xs text-slate-400">{goldenBallCandidates[0]?.clubName} • OVR {goldenBallCandidates[0]?.rating}</p>
              </div>
            </div>

            {/* Golden Boy Winner */}
            <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-6 space-y-3 shadow-xl transform hover:-translate-y-1 transition">
              <Medal className="w-10 h-10 text-blue-400 mx-auto" />
              <h3 className="font-bold text-blue-300 text-sm">Golden Boy (Best Wonderkid)</h3>
              <div className="pt-2">
                <p className="font-extrabold text-lg text-white">{goldenBoyCandidates[0]?.name || 'Lamine Yamal'}</p>
                <p className="text-xs text-slate-400">{goldenBoyCandidates[0]?.clubName} • POT {goldenBoyCandidates[0]?.potential}</p>
              </div>
            </div>

            {/* Agent of the Year */}
            <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-6 space-y-3 shadow-xl transform hover:-translate-y-1 transition">
              <Crown className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-emerald-300 text-sm">Super-Agent of the Year</h3>
              <div className="pt-2">
                <p className="font-extrabold text-lg text-white">{agency.agencyName}</p>
                <p className="text-xs text-slate-400">Reputation: {agency.reputation} / 100 • {agency.agentName}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: QUESTS */}
      {activeTab === 'quests' && (
        <QuestsPanel agency={agency} onUpdateAgency={(up) => setAgency(up)} />
      )}

      {/* TAB 5: TIMELINE */}
      {activeTab === 'timeline' && (
        <CareerJourneyTimeline agency={agency} onOpenTab={onOpenTab || (() => {})} />
      )}

    </div>
  );
};
