import React, { useState, useMemo } from 'react';
import { AgencyState, Player, NewsItem, PlayerDilemma, Club } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { DailyNewsDigest } from './DailyNewsDigest';
import { TransferNegotiationModal } from './TransferNegotiationModal';
import { ExecutiveInbox } from './ExecutiveInbox';
import { 
  Flame, 
  Mail, 
  MailOpen, 
  AlertCircle, 
  ShieldAlert, 
  ChevronRight, 
  DollarSign, 
  Clock, 
  Send, 
  CheckCircle2, 
  Building2, 
  User, 
  Briefcase, 
  Globe, 
  Zap, 
  Search, 
  Filter, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  FileText,
  X,
  AlertTriangle,
  Megaphone,
  Trophy,
  Award,
  Mic,
  Star,
  Crown,
  Medal,
  Landmark
} from 'lucide-react';

interface DashboardViewProps {
  agency: AgencyState;
  players: Player[];
  clubs?: Club[];
  news: NewsItem[];
  activeDilemma: PlayerDilemma | null;
  onResolveDilemma: (dilemma: PlayerDilemma, option: 'A' | 'B') => void;
  onOpenTab: (tab: string) => void;
  onOpenPlayerModal: (player: Player) => void;
  onUpdateAgency: (agency: AgencyState) => void;
  onUpdatePlayer?: (player: Player) => void;
  onUpdateClubs?: (clubs: Club[]) => void;
  onAddPlayer: (player: Player) => void;
  addToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  onOpenPressInterview?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  agency,
  players,
  clubs = [],
  news,
  activeDilemma,
  onResolveDilemma,
  onOpenTab,
  onOpenPlayerModal,
  onUpdateAgency,
  onUpdatePlayer,
  onUpdateClubs,
  addToast,
  onOpenPressInterview
}) => {
  const [negotiatingPlayer, setNegotiatingPlayer] = useState<Player | null>(null);
  const [achievementCategory, setAchievementCategory] = useState<'all' | 'transfers' | 'awards' | 'wealth' | 'governance' | 'reputation'>('all');
  const [showWidgetCustomizer, setShowWidgetCustomizer] = useState(false);

  const activeWidgets = useMemo(() => {
    return agency.dashboardWidgets && agency.dashboardWidgets.length > 0
      ? agency.dashboardWidgets
      : ['urgent_attention', 'quick_actions', 'executive_inbox', 'trophies', 'news_digest'];
  }, [agency.dashboardWidgets]);

  const toggleWidget = (widgetKey: string) => {
    let updated: string[];
    if (activeWidgets.includes(widgetKey)) {
      if (activeWidgets.length <= 1) {
        if (addToast) addToast('At least one widget must remain enabled!', 'info');
        return;
      }
      updated = activeWidgets.filter(w => w !== widgetKey);
    } else {
      updated = [...activeWidgets, widgetKey];
    }
    onUpdateAgency({
      ...agency,
      dashboardWidgets: updated
    });
    if (addToast) addToast(`Dashboard widget preferences updated!`, 'success');
  };

  const isWidgetActive = (key: string) => activeWidgets.includes(key);

  const currentRole = (agency.activeRoles?.currentRole || 'agent') as 'agent' | 'club_owner' | 'fa_president';
  const myClients = useMemo(() => players.filter(p => p.isMyClient), [players]);
  const discontentClients = useMemo(() => myClients.filter(p => p.unrest && p.unrest.status !== 'content'), [myClients]);
  const pendingInterviews = useMemo(() => agency.pressInterviews?.filter(i => !i.answered) || [], [agency.pressInterviews]);

  const achievementsList = useMemo(() => agency.achievements || [], [agency.achievements]);
  const unlockedAchievementsCount = useMemo(() => achievementsList.filter(a => a.unlocked).length, [achievementsList]);
  const filteredAchievements = useMemo(() => {
    if (achievementCategory === 'all') return achievementsList;
    return achievementsList.filter(a => a.category === achievementCategory);
  }, [achievementsList, achievementCategory]);

  // Transfer Window Calculations
  const currentWeek = agency.currentWeek || 1;
  const isTransferWindowOpen = (currentWeek >= 1 && currentWeek <= 8) || (currentWeek >= 20 && currentWeek <= 24);
  const weeksRemainingInWindow = isTransferWindowOpen
    ? (currentWeek <= 8 ? 8 - currentWeek + 1 : 24 - currentWeek + 1)
    : (currentWeek < 20 ? 20 - currentWeek : 52 - currentWeek + 1);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar: Transfer Window Watch, Urgent Alert Counters & Widget Customizer */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-5 rounded-3xl shadow-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border animate-pulse ${
              isTransferWindowOpen
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {isTransferWindowOpen ? '🔥 TRANSFER WINDOW OPEN' : '🔒 TRANSFER WINDOW CLOSED'}
            </span>
            <span className="text-xs text-slate-400 font-bold">
              Week {currentWeek} (Season {agency.currentSeason})
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>Executive Command Hub: Operations & Live Media</span>
            </h2>
            <button
              onClick={() => setShowWidgetCustomizer(prev => !prev)}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition active:scale-95"
              title="Customize visible dashboard widgets"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{showWidgetCustomizer ? 'Close Widgets' : 'Customize Widgets'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isTransferWindowOpen
              ? `Deadline day approaching! ${weeksRemainingInWindow} week(s) left to negotiate transfer deals & client extensions.`
              : `Transfer market closed. Next transfer window re-opens in ${weeksRemainingInWindow} week(s).`}
          </p>
        </div>

        {/* Quick Summary Pill Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div className="bg-slate-800/80 border border-slate-700/80 p-2.5 rounded-2xl text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Urgent Dilemma</p>
            <p className={`text-base font-black ${activeDilemma ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`}>
              {activeDilemma ? '1 ACTIVE' : 'NONE'}
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-2.5 rounded-2xl text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Client Unrest</p>
            <p className={`text-base font-black ${discontentClients.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {discontentClients.length} ALERTS
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-2.5 rounded-2xl text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Press Q&A</p>
            <p className={`text-base font-black ${pendingInterviews.length > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>
              {pendingInterviews.length > 0 ? `${pendingInterviews.length} LIVE` : 'CLEAR'}
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-2.5 rounded-2xl text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Trophies</p>
            <p className="text-base font-black text-amber-400">
              {unlockedAchievementsCount}/{achievementsList.length}
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-2.5 rounded-2xl text-center col-span-2 sm:col-span-1">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Active Role</p>
            <p className="text-xs font-black text-sky-400 uppercase mt-1">
              {currentRole === 'fa_president' ? 'FA President' : currentRole === 'club_owner' ? 'Club President' : 'Agent'}
            </p>
          </div>
        </div>
      </div>

      {/* WIDGET CUSTOMIZER DRAWER */}
      {showWidgetCustomizer && (
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-3xl p-5 shadow-2xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-extrabold text-white">Custom Dashboard Layout & Widget Controls</h4>
            </div>
            <span className="text-[11px] text-slate-400">Toggle modules to streamline your executive screen</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
            {[
              { id: 'urgent_attention', label: 'Urgent Center', icon: '🚨', desc: 'Dilemmas & Unrest' },
              { id: 'quick_actions', label: 'Quick Desk', icon: '⚡', desc: 'Direct Navigation' },
              { id: 'executive_inbox', label: 'Executive Inbox', icon: '📬', desc: 'Bids & Board News' },
              { id: 'trophies', label: 'Career Trophies', icon: '🏆', desc: 'Badges & Bounties' },
              { id: 'news_digest', label: 'Media Stream', icon: '📰', desc: 'Press & Gossip' }
            ].map(widget => {
              const active = isWidgetActive(widget.id);
              return (
                <button
                  key={widget.id}
                  onClick={() => toggleWidget(widget.id)}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                    active
                      ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{widget.icon}</span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      active ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {active ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold">{widget.label}</p>
                    <p className="text-[10px] text-slate-400">{widget.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 1A: Pending Live Press Conference Banner */}
      {pendingInterviews.length > 0 && onOpenPressInterview && (
        <div className="bg-gradient-to-r from-rose-950/90 via-indigo-950/80 to-slate-900 border-2 border-rose-500/60 rounded-3xl p-5 shadow-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse-subtle">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/30 border border-rose-400/40 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
              <Mic className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-rose-500 text-slate-950 rounded-full">
                  LIVE INTERVIEW PENDING
                </span>
                <span className="text-xs text-rose-300 font-bold">
                  {pendingInterviews.length} Journalist Question{pendingInterviews.length > 1 ? 's' : ''} Awaiting
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                {pendingInterviews[0].topicTitle || 'Media Desk Demanding Clarification on Client Rumors'}
              </h3>
              <p className="text-xs text-slate-300">
                Choose your response tone (Aggressive, Diplomatic, Humorous) to shape player morale and board trust.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenPressInterview}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-rose-600/40 flex items-center justify-center space-x-2 shrink-0 transition-all transform active:scale-95 cursor-pointer"
          >
            <span>Enter Press Conference Room</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 1: URGENT ATTENTION CENTER */}
      {isWidgetActive('urgent_attention') && (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Urgent Attention Center</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-semibold">
            Action items requiring immediate agent decisions
          </span>
        </div>

        {/* 1A: Active Moral Dilemma if present */}
        {activeDilemma && (
          <div className="bg-gradient-to-r from-amber-950/90 via-red-950/80 to-slate-900 border-2 border-amber-500/60 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden animate-pulse-subtle">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> High Urgency Dilemma
                  </span>
                  <span className="text-xs text-amber-300 font-bold">Requires Decision</span>
                </div>
                <h2 className="text-xl font-black text-white">{activeDilemma.title}</h2>
                <p className="text-xs text-slate-300 leading-relaxed">{activeDilemma.description}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                <button
                  onClick={() => onResolveDilemma(activeDilemma, 'A')}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs flex flex-col items-center justify-center transition active:scale-95 shadow-lg cursor-pointer"
                >
                  <span>{activeDilemma.optionA.label}</span>
                  <span className="text-[10px] text-amber-950 font-extrabold">{activeDilemma.optionA.moraleChange >= 0 ? '+' : ''}{activeDilemma.optionA.moraleChange} Morale</span>
                </button>

                <button
                  onClick={() => onResolveDilemma(activeDilemma, 'B')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 font-black px-5 py-3 rounded-2xl text-xs flex flex-col items-center justify-center transition active:scale-95 cursor-pointer"
                >
                  <span>{activeDilemma.optionB.label}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{activeDilemma.optionB.moraleChange >= 0 ? '+' : ''}{activeDilemma.optionB.moraleChange} Morale</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 1B: Client Unrest & Discontent Hotline Alerts */}
        {discontentClients.length > 0 ? (
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
                <div>
                  <h4 className="font-extrabold text-sm text-white">Client Discontent & Transfer Demands ({discontentClients.length})</h4>
                  <p className="text-xs text-slate-400">Players currently expressing discontent or demanding transfer listings</p>
                </div>
              </div>
              <button
                onClick={() => onOpenTab('unrest_hotline')}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition"
              >
                <span>Open Unrest Hotline</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {discontentClients.map(client => (
                <div key={client.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{client.flag}</span>
                      <div>
                        <h5 className="font-extrabold text-xs text-white">{client.name}</h5>
                        <p className="text-[10px] text-slate-400">{client.position} • {client.clubName}</p>
                      </div>
                    </div>
                    <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      {client.unrest?.status?.replace('_', ' ') || 'Discontent'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Reason: <strong className="text-amber-300">{client.unrest?.reasonLabel || 'Wage Dispute'}</strong></span>
                      <span className="text-red-400 font-extrabold">{client.unrest?.discontentLevel || 70}% Level</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${client.unrest?.discontentLevel || 70}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenTab('unrest_hotline')}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-1.5 rounded-xl text-xs border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>Intervene & Resolve Unrest</span>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : !activeDilemma && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="font-bold text-slate-200">No Urgent Client Disputes or Moral Crisis Pending!</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Your agency roster is currently satisfied and operating smoothly.</p>
          </div>
        )}
      </div>
      )}

      {/* SECTION 2: EXECUTIVE INBOX & ROLE-TAILORED ALERTS */}
      {isWidgetActive('executive_inbox') && (
        <ExecutiveInbox
          agency={agency}
          players={players}
          onOpenTab={onOpenTab}
          onStartNegotiation={(player) => setNegotiatingPlayer(player)}
        />
      )}

      {/* SECTION 3: CAREER TROPHIES & AGENCY ACHIEVEMENTS */}
      {isWidgetActive('trophies') && (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Career Trophies & Agency Milestones
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {unlockedAchievementsCount} / {achievementsList.length} UNLOCKED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Historic super-agent badges, galactico transfers, and prestige milestone rewards
              </p>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'All Trophies' },
              { id: 'transfers', label: 'Transfers' },
              { id: 'awards', label: 'Client Honors' },
              { id: 'wealth', label: 'Tycoon' },
              { id: 'governance', label: 'Governance' },
              { id: 'reputation', label: 'Prestige' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setAchievementCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                  achievementCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trophies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAchievements.map((ach) => {
            const isUnlocked = ach.unlocked;
            const progressPercent = Math.min(100, Math.round(((ach.progress || 0) / (ach.target || 1)) * 100));

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border-amber-500/50 shadow-lg shadow-amber-950/30'
                    : 'bg-slate-900/60 border-slate-800/80 opacity-75 hover:opacity-100 hover:border-slate-700'
                }`}
              >
                {isUnlocked && (
                  <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-12 h-12 bg-amber-500/10 rounded-full blur-lg pointer-events-none" />
                )}

                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        isUnlocked
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}>
                        {ach.icon || (isUnlocked ? '🏆' : '🔒')}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className={`text-xs font-bold ${isUnlocked ? 'text-white' : 'text-slate-300'}`}>
                            {ach.title}
                          </h4>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                          ach.badgeTier === 'Diamond' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                          ach.badgeTier === 'Platinum' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                          ach.badgeTier === 'Gold' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          ach.badgeTier === 'Silver' ? 'bg-slate-400/20 text-slate-300 border-slate-400/30' :
                          'bg-amber-800/20 text-amber-500 border-amber-800/30'
                        }`}>
                          {ach.badgeTier} Tier
                        </span>
                      </div>
                    </div>

                    {isUnlocked ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        CLAIMED
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">
                        {progressPercent}%
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {ach.description}
                  </p>
                </div>

                {/* Progress bar & Rewards */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2">
                  {!isUnlocked ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Progress</span>
                        <span>{typeof ach.progress === 'number' && ach.target >= 1000000 ? formatMoney(ach.progress) : (ach.progress || 0)} / {ach.target >= 1000000 ? formatMoney(ach.target) : ach.target}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-amber-400/90 font-mono flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>Unlocked Season {ach.unlockedAtSeason || agency.currentSeason}, Wk {ach.unlockedAtWeek || agency.currentWeek}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 font-medium">Bounty:</span>
                    <div className="flex items-center space-x-2 text-[10px]">
                      {ach.rewardCash > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          +{formatMoney(ach.rewardCash)}
                        </span>
                      )}
                      {ach.rewardReputation > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                          +{ach.rewardReputation} Rep
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* SECTION 4: DAILY NEWS DIGEST & PRESS HEADLINES STREAM */}
      {isWidgetActive('news_digest') && (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500" />
            <span>Transfer News & Press Media Stream</span>
          </h3>
          <button
            onClick={() => onOpenTab('news_awards')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Open Full Media Desk</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Embedded Daily News Digest Component */}
        <DailyNewsDigest
          news={news}
          agency={agency}
          players={players}
          onOpenTab={onOpenTab}
          onOpenPlayerModal={onOpenPlayerModal}
        />
      </div>
      )}

      {/* TRANSFER NEGOTIATION MODAL */}
      {negotiatingPlayer && (
        <TransferNegotiationModal
          player={negotiatingPlayer}
          buyingClubName={negotiatingPlayer.ongoingTransferNegotiation?.buyingClubName || 'Manchester City'}
          directorName={negotiatingPlayer.ongoingTransferNegotiation?.buyingClubDirector || 'Txiki Begiristain'}
          directorRole={negotiatingPlayer.ongoingTransferNegotiation?.buyingClubRole || 'Sporting Director'}
          initialOfferedFee={negotiatingPlayer.ongoingTransferNegotiation?.offeredFee || Math.round((negotiatingPlayer.value || 10000000) * 1.25)}
          initialOfferedWage={negotiatingPlayer.ongoingTransferNegotiation?.offeredWage || Math.round((negotiatingPlayer.wage || 50000) * 1.35)}
          initialOfferedCommission={negotiatingPlayer.ongoingTransferNegotiation?.offeredCommission || 15}
          agency={agency}
          clubs={clubs}
          onClose={() => setNegotiatingPlayer(null)}
          onUpdatePlayer={(p) => {
            if (onUpdatePlayer) onUpdatePlayer(p);
          }}
          onUpdateAgency={onUpdateAgency}
          onUpdateClubs={onUpdateClubs}
          addToast={addToast}
        />
      )}
    </div>
  );
};
