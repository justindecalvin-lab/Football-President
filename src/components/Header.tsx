import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AgencyState, NewsItem, NewsTargetRole } from '../types';
import { formatMoney, getReputationBadge, calculateWeeklyFinances, filterNewsForActiveRole } from '../utils/gameEngine';
import { 
  Building2, 
  Trophy, 
  TrendingUp, 
  ShieldAlert, 
  Play, 
  FastForward, 
  Crown, 
  DollarSign, 
  Users, 
  Briefcase, 
  Globe, 
  Save, 
  RotateCcw, 
  PlusCircle, 
  Download, 
  ChevronDown, 
  Gamepad2, 
  Wrench, 
  HardDrive, 
  Repeat,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Filter,
  Flame,
  ArrowRight,
  Radio,
  ExternalLink,
  Sparkles,
  Mic,
  X
} from 'lucide-react';

interface HeaderProps {
  agency: AgencyState;
  playersCount: number;
  news?: NewsItem[];
  setNews?: React.Dispatch<React.SetStateAction<NewsItem[]>>;
  onAdvanceWeek: () => void;
  onFastForward4Weeks: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onStartNewGame: () => void;
  onRestartGame: () => void;
  onSaveGame: () => void;
  onLoadGame: () => void;
  onOpenEditor: () => void;
  onOpenSaveManager?: () => void;
  onOpenLauncher?: () => void;
  onShowRoleRequirement?: (role: 'club_owner' | 'fa_president') => void;
  onUpdateAgency?: (agency: AgencyState) => void;
  onOpenUniversalSearch?: () => void;
  onOpenPressInterview?: () => void;
  addToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const Header: React.FC<HeaderProps> = ({
  agency,
  playersCount,
  news = [],
  setNews,
  onAdvanceWeek,
  onFastForward4Weeks,
  activeTab,
  setActiveTab,
  onStartNewGame,
  onRestartGame,
  onSaveGame,
  onLoadGame,
  onOpenEditor,
  onOpenSaveManager,
  onOpenLauncher,
  onShowRoleRequirement,
  onUpdateAgency,
  onOpenUniversalSearch,
  onOpenPressInterview,
  addToast
}) => {
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationChannelFilter, setNotificationChannelFilter] = useState<'current' | 'all' | 'agent' | 'club_owner' | 'fa_president'>('current');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'agent' | 'club_owner' | 'fa_president'>('all');
  
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsGameMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeRoles = agency.activeRoles || {
    agent: true,
    club_owner: false,
    fa_president: false,
    currentRole: 'agent',
    startingRole: 'agent'
  };

  const currentRole = (activeRoles.currentRole || 'agent') as 'agent' | 'club_owner' | 'fa_president';

  // Role notification counts & filtering
  const unreadCountForActiveRole = useMemo(() => {
    const roleNews = filterNewsForActiveRole(news, currentRole);
    return roleNews.filter(n => !n.read).length;
  }, [news, currentRole]);

  const displayedNotifications = useMemo(() => {
    if (notificationChannelFilter === 'current') {
      return filterNewsForActiveRole(news, currentRole);
    }
    if (notificationChannelFilter === 'all') {
      return news;
    }
    return news.filter(n => {
      if (!n.targetRole || n.targetRole === 'all') return true;
      if (n.targetRoles && n.targetRoles.includes(notificationChannelFilter)) return true;
      return n.targetRole === notificationChannelFilter;
    });
  }, [news, notificationChannelFilter, currentRole]);

  const handleMarkAllRead = () => {
    if (!setNews) return;
    setNews(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleToggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!setNews) return;
    setNews(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const handleNotificationAction = (item: NewsItem) => {
    if (setNews) {
      setNews(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    }
    setIsNotificationOpen(false);
    if (item.actionTab) {
      setActiveTab(item.actionTab);
    } else {
      setActiveTab('news_awards');
    }
  };

  const repBadge = getReputationBadge(agency.reputation);
  const isTransferWindow = (agency.currentWeek >= 1 && agency.currentWeek <= 8) || (agency.currentWeek >= 20 && agency.currentWeek <= 24);

  const activeLoanCount = (agency.loanDeals || []).filter(d => d.status === 'active').length;

  // Check if roles are legally unlocked according to career rules
  const hasUnlockedClubPresident = 
    activeRoles.startingRole === 'club_owner' ||
    agency.presidency?.role === 'Club President' ||
    (agency.clubShares || []).some(s => s.sharePercent > 50 || s.lastElectionWon);

  const hasUnlockedFaPresident = 
    activeRoles.startingRole === 'fa_president' ||
    activeRoles.faAchievementEligibility ||
    agency.presidency?.role === 'FIFA Global President' ||
    agency.presidency?.role === 'Continental President' ||
    agency.presidency?.role === 'Federation Director' ||
    (agency.reputation >= 85 && agency.balance >= 50000000 && (agency.trophiesWon?.length || 0) >= 2 && (agency.darkArtsScore || 0) <= 25);

  const handleSwitchActiveRole = (roleKey: 'agent' | 'club_owner' | 'fa_president') => {
    // Role Exclusivity & Eligibility Check
    if (roleKey === 'club_owner' && !hasUnlockedClubPresident) {
      if (onShowRoleRequirement) {
        onShowRoleRequirement('club_owner');
      } else if (addToast) {
        addToast('🔒 Role Locked: To become Club President, acquire >50% shares in Tycoon or win a shareholder proxy election!', 'error');
      }
      return;
    }

    if (roleKey === 'fa_president' && !hasUnlockedFaPresident) {
      if (onShowRoleRequirement) {
        onShowRoleRequirement('fa_president');
      } else if (addToast) {
        addToast('🔒 Role Locked: To become FA President, achieve ≥85 Reputation, €50M Treasury, and 2+ Major Trophies!', 'error');
      }
      return;
    }

    if (!onUpdateAgency) return;

    let updatedPresidency = { ...agency.presidency };

    if (roleKey === 'club_owner' && (updatedPresidency.role === 'None' || !updatedPresidency.role)) {
      const bestShare = (agency.clubShares || []).find(s => s.sharePercent > 50 || s.lastElectionWon);
      updatedPresidency.role = 'Club President';
      updatedPresidency.clubId = bestShare?.clubId || activeRoles.presidentClubId || 'c1';
    }

    if (roleKey === 'fa_president' && (updatedPresidency.role !== 'FIFA Global President' && updatedPresidency.role !== 'Federation Director' && updatedPresidency.role !== 'Continental President')) {
      updatedPresidency.role = 'FIFA Global President';
    }

    onUpdateAgency({
      ...agency,
      presidency: updatedPresidency,
      activeRoles: {
        ...activeRoles,
        agent: roleKey === 'agent',
        club_owner: roleKey === 'club_owner',
        fa_president: roleKey === 'fa_president',
        currentRole: roleKey
      }
    });

    if (roleKey === 'agent') setActiveTab('dashboard');
    else if (roleKey === 'club_owner') setActiveTab('club_president');
    else if (roleKey === 'fa_president') setActiveTab('governance');
  };

  // Role-Specific Navigation Tabs
  const getTabsForRole = () => {
    if (activeRoles.currentRole === 'fa_president') {
      return [
        { id: 'governance', label: 'FIFA & Governance', icon: Globe, highlight: true, role: 'fa_president', roleIcon: '🏛️' },
        { id: 'dark_arts', label: 'Tribunal & Ethics', icon: ShieldAlert, role: 'fa_president', roleIcon: '⚖️' },
        { id: 'league_inspector', label: 'Member Leagues', icon: Globe, role: 'fa_president', roleIcon: '🌐' },
        { id: 'matches', label: 'Tournaments & Fixtures', icon: Play, role: 'fa_president', roleIcon: '🏆' },
        { id: 'analytics', label: 'Solidarity Treasury', icon: TrendingUp, role: 'fa_president', roleIcon: '💰' },
        { id: 'news_awards', label: 'News & Gala', icon: Trophy, role: 'fa_president', roleIcon: '⭐' },
        { id: 'hall_of_fame', label: 'Hall of Fame', icon: Crown, role: 'fa_president', roleIcon: '📜' },
        { id: 'system_menu', label: 'System', icon: Wrench, role: 'fa_president', roleIcon: '⚙️' },
      ];
    }

    if (activeRoles.currentRole === 'club_owner') {
      return [
        { id: 'club_president', label: 'President Suite', icon: Crown, highlight: true, role: 'club_owner', roleIcon: '👑' },
        { id: 'my_players', label: 'Senior Squad (25)', icon: Users, role: 'club_owner', roleIcon: '👥' },
        { id: 'transfer_market', label: 'Club Transfers', icon: DollarSign, highlight: isTransferWindow, role: 'club_owner', roleIcon: '💼' },
        { id: 'tycoon', label: 'Stadium & Tycoon', icon: Building2, role: 'club_owner', roleIcon: '🏟️' },
        { id: 'matches', label: 'Club Fixtures', icon: Play, role: 'club_owner', roleIcon: '⚽' },
        { id: 'news_awards', label: 'News & Gala', icon: Trophy, role: 'club_owner', roleIcon: '⭐' },
        { id: 'hall_of_fame', label: 'Hall of Fame', icon: Crown, role: 'club_owner', roleIcon: '🏆' },
        { id: 'system_menu', label: 'System', icon: Wrench, role: 'club_owner', roleIcon: '⚙️' },
      ];
    }

    // Default: Football Agent
    return [
      { id: 'dashboard', label: 'Dashboard', icon: TrendingUp, role: 'agent', roleIcon: '💼' },
      { id: 'my_players', label: 'My Clients', icon: Trophy, badge: playersCount, role: 'agent', roleIcon: '💼' },
      { id: 'transfer_market', label: 'Transfer Market', icon: DollarSign, highlight: isTransferWindow, role: 'agent', roleIcon: '💼' },
      { id: 'loan_management', label: 'Loans & Buy-Backs', icon: Repeat, badge: activeLoanCount, role: 'agent', roleIcon: '💼' },
      { id: 'scouting', label: 'Scouts & Youth', icon: Building2, role: 'agent', roleIcon: '💼' },
      { id: 'rivals', label: 'Rival Agents', icon: Users, role: 'agent', roleIcon: '💼' },
      { id: 'analytics', label: 'Financials', icon: TrendingUp, role: 'agent', roleIcon: '💼' },
      { id: 'tycoon', label: 'Tycoon Empire', icon: Crown, role: 'agent', roleIcon: '💼' },
      { id: 'dark_arts', label: 'Dark Arts Ops', icon: ShieldAlert, role: 'agent', roleIcon: '💼' },
      { id: 'news_awards', label: 'News & Gala', icon: Trophy, role: 'agent', roleIcon: '⭐' },
      { id: 'hall_of_fame', label: 'Hall of Fame', icon: Crown, role: 'agent', roleIcon: '⭐' },
      { id: 'system_menu', label: 'System', icon: Wrench, role: 'agent', roleIcon: '⚙️' },
    ];
  };

  const visibleTabs = getTabsForRole();

  // Role details
  const isFA = activeRoles.currentRole === 'fa_president';
  const isOwner = activeRoles.currentRole === 'club_owner';

  const roleTitle = isFA 
    ? 'European Football Federation Board'
    : isOwner 
      ? `${agency.presidency?.clubName || 'Club'} Board of Directors`
      : agency.agencyName;

  const roleBadgeLabel = isFA 
    ? '🏛️ FEDERATION PRESIDENT' 
    : isOwner 
      ? '👑 CLUB PRESIDENT' 
      : repBadge.title;

  const roleBadgeColor = isFA
    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
    : isOwner
      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
      : repBadge.color;

  const roleSubtitle = isFA
    ? `President: ${agency.agentName} • Wk ${agency.currentWeek} / 38 (${agency.currentSeason}) • Global Mandate`
    : isOwner
      ? `President: ${agency.agentName} • Wk ${agency.currentWeek} / 38 (${agency.currentSeason}) • Controlling Stake (65%)`
      : `Agent: ${agency.agentName} • Wk ${agency.currentWeek} / 38 (${agency.currentSeason})`;

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl">
        {/* Top Banner Bar */}
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Role Title */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-lg border ${
              isFA
                ? 'bg-gradient-to-br from-amber-500 to-yellow-700 border-amber-400/40'
                : isOwner
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-700 border-indigo-400/40'
                  : 'bg-gradient-to-br from-emerald-500 to-teal-700 border-emerald-400/30'
            }`}>
              {isFA ? '🏛️' : isOwner ? '👑' : '⚽'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg leading-tight tracking-wide text-slate-100">{roleTitle}</h1>
                <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${roleBadgeColor}`}>
                  {roleBadgeLabel}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-2">
                <span>{roleSubtitle}</span>
                {!isFA && isTransferWindow && (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] px-1.5 py-0.2 rounded font-semibold animate-pulse hidden sm:inline">
                    🔥 Transfer Window
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Stats Summary Chips */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1">
            {/* Active Role Selector Pill */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-1.5 flex items-center gap-2 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Role:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleSwitchActiveRole('agent')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                    activeRoles.currentRole === 'agent'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-900/60'
                  }`}
                  title="Play as Football Agent"
                >
                  <span>💼</span>
                  <span>Agent</span>
                </button>
                <button
                  onClick={() => handleSwitchActiveRole('club_owner')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                    activeRoles.currentRole === 'club_owner'
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : hasUnlockedClubPresident
                        ? 'text-indigo-300 hover:text-white bg-slate-900/60'
                        : 'text-slate-500 bg-slate-950/60 opacity-70'
                  }`}
                  title={hasUnlockedClubPresident ? 'Play as Club President' : 'Locked: Requires >50% club equity or winning an election'}
                >
                  <span>👑</span>
                  <span>President</span>
                  {!hasUnlockedClubPresident && <span className="text-[8px]">🔒</span>}
                </button>
                <button
                  onClick={() => handleSwitchActiveRole('fa_president')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                    activeRoles.currentRole === 'fa_president'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : hasUnlockedFaPresident
                        ? 'text-amber-300 hover:text-white bg-slate-900/60'
                        : 'text-slate-500 bg-slate-950/60 opacity-70'
                  }`}
                  title={hasUnlockedFaPresident ? 'Play as FA / Governance President' : 'Locked: Requires high reputation, treasury, and honours'}
                >
                  <span>🏛️</span>
                  <span>FA</span>
                  {!hasUnlockedFaPresident && <span className="text-[8px]">🔒</span>}
                </button>
              </div>
            </div>

            {/* Stat Chip 1: Balance / Treasury */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-2.5 py-1.5 flex items-center gap-2">
              <div className={`p-1 rounded-lg ${isFA ? 'bg-amber-500/10 text-amber-400' : isOwner ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-semibold">
                  {isFA ? 'Treasury' : isOwner ? 'Club Budget' : 'Balance'}
                </p>
                <p className={`text-xs sm:text-sm font-extrabold ${isFA ? 'text-amber-400' : isOwner ? 'text-indigo-300' : 'text-emerald-400'}`}>
                  {formatMoney(agency.balance)}
                </p>
              </div>
            </div>

            {/* Stat Chip 2: Influence / Squad / Clients */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-2.5 py-1.5 flex items-center gap-2">
              <div className={`p-1 rounded-lg ${isFA ? 'bg-amber-500/10 text-amber-400' : isOwner ? 'bg-indigo-500/10 text-indigo-400' : 'bg-blue-500/10 text-blue-400'}`}>
                {isFA ? <Globe className="w-3.5 h-3.5" /> : isOwner ? <Crown className="w-3.5 h-3.5" /> : <Trophy className="w-3.5 h-3.5" />}
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-semibold">
                  {isFA ? 'Influence' : isOwner ? 'Board Rating' : 'Clients'}
                </p>
                <p className="text-xs sm:text-sm font-bold text-slate-100">
                  {isFA ? `${agency.presidency?.politicalInfluence || 75}% Approval` : isOwner ? '85% Confidence' : `${playersCount} Players`}
                </p>
              </div>
            </div>

            {/* Stat Chip 3: Nations / Stadium / HQ */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-2.5 py-1.5 flex items-center gap-2 hidden md:flex">
              <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-semibold">
                  {isFA ? 'Members' : isOwner ? 'Squad Size' : 'HQ Level'}
                </p>
                <p className="text-xs sm:text-sm font-bold text-amber-300">
                  {isFA ? '54 Associations' : isOwner ? '24/25 Squad' : `Lvl ${agency.officeLevel}`}
                </p>
              </div>
            </div>
          </div>

          {/* Action Advance Buttons, Role Intelligence Bell & Game Menu Dropdown */}
          <div className="flex items-center gap-2">
            {/* Universal Intelligence Search (⌘K) */}
            <button
              onClick={onOpenUniversalSearch}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer min-h-[44px]"
              title="Universal Search (Press ⌘K or Ctrl+K)"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden md:inline bg-slate-900 text-slate-400 text-[10px] px-1.5 py-0.5 rounded border border-slate-700 font-mono ml-0.5">
                ⌘K
              </kbd>
            </button>

            {/* Live Press Conference Direct Button */}
            {agency.pressInterviews && agency.pressInterviews.some(i => !i.answered) && onOpenPressInterview && (
              <button
                onClick={onOpenPressInterview}
                className="bg-rose-600 hover:bg-rose-500 text-white border border-rose-400/50 px-3 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-rose-900/40 active:scale-95 transition cursor-pointer min-h-[44px] animate-pulse"
                title="Live Press Conference Pending"
              >
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline">Press Q&A</span>
                <span className="bg-white text-rose-700 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {agency.pressInterviews.filter(i => !i.answered).length}
                </span>
              </button>
            )}

            {/* Role Intelligence & Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen(prev => !prev)}
                className={`relative px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer min-h-[44px] border ${
                  unreadCountForActiveRole > 0
                    ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Role Intelligence, Breaking Alerts & Direct Actions"
              >
                <div className="relative">
                  {unreadCountForActiveRole > 0 ? (
                    <BellRing className="w-4 h-4 text-amber-400 animate-bounce" />
                  ) : (
                    <Bell className="w-4 h-4 text-slate-400" />
                  )}
                  {unreadCountForActiveRole > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                      {unreadCountForActiveRole > 9 ? '9+' : unreadCountForActiveRole}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline">Intel</span>
              </button>

              {/* Notification Popover Drawer */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-3 space-y-3 divide-y divide-slate-800/80 text-xs">
                  {/* Popover Header */}
                  <div className="flex items-center justify-between gap-2 pb-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                        <Radio className="w-4 h-4 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                          <span>Role Intelligence</span>
                          {unreadCountForActiveRole > 0 && (
                            <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                              {unreadCountForActiveRole} new
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          Tailored for {currentRole === 'club_owner' ? '👑 Club President' : currentRole === 'fa_president' ? '🏛️ FA President' : '💼 Agent'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {unreadCountForActiveRole > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
                          title="Mark all as read"
                        >
                          <CheckCheck className="w-3 h-3" />
                          <span className="hidden sm:inline">Read All</span>
                        </button>
                      )}
                      <button
                        onClick={() => setIsNotificationOpen(false)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Channel Filter Pills */}
                  <div className="pt-2 flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
                    {[
                      { id: 'current', label: `🎯 My Role (${filterNewsForActiveRole(news, currentRole).length})` },
                      { id: 'all', label: `All (${news.length})` },
                      { id: 'agent', label: '💼 Agent' },
                      { id: 'club_owner', label: '👑 Club' },
                      { id: 'fa_president', label: '🏛️ FA' },
                    ].map(ch => (
                      <button
                        key={ch.id}
                        onClick={() => setNotificationChannelFilter(ch.id as any)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer ${
                          notificationChannelFilter === ch.id
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>

                  {/* Notifications Feed List */}
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1 pt-2">
                    {displayedNotifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="font-semibold text-xs text-slate-400">No role dispatches currently</p>
                        <p className="text-[10px] mt-1">Advance weeks to receive new match, contract, and presidential intelligence.</p>
                      </div>
                    ) : (
                      displayedNotifications.slice(0, 10).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationAction(item)}
                          className={`p-2.5 rounded-xl border transition cursor-pointer group ${
                            !item.read
                              ? 'bg-slate-800/90 border-amber-500/30 hover:border-amber-500/60 shadow-sm'
                              : 'bg-slate-950/60 border-slate-800/60 hover:border-slate-700 opacity-80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {item.roleBadge ? (
                                <span className="bg-slate-800 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-slate-700">
                                  {item.roleBadge}
                                </span>
                              ) : (
                                <span className="bg-slate-800 text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase">
                                  {item.category}
                                </span>
                              )}

                              {item.urgency === 'breaking' ? (
                                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-black px-1.5 py-0.2 rounded-md animate-pulse">
                                  BREAKING
                                </span>
                              ) : item.urgency === 'hot' ? (
                                <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                                  HOT
                                </span>
                              ) : null}

                              {!item.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-slate-500 font-mono">
                                W{item.week}
                              </span>
                              <button
                                onClick={(e) => handleToggleRead(item.id, e)}
                                className="text-slate-500 hover:text-emerald-400 p-0.5 rounded transition"
                                title={item.read ? 'Mark as unread' : 'Mark as read'}
                              >
                                {item.read ? <Check className="w-3 h-3 text-slate-600" /> : <Check className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>

                          <h5 className="font-bold text-slate-100 text-xs mt-1.5 group-hover:text-amber-300 transition line-clamp-2 leading-tight">
                            {item.headline}
                          </h5>

                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {item.content}
                          </p>

                          {item.actionLabel && (
                            <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                              <span className="text-amber-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                                <span>{item.actionLabel}</span>
                                <ArrowRight className="w-3 h-3" />
                              </span>
                              <span className="text-slate-500">Jump to Desk</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Popover Footer */}
                  <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Showing {displayedNotifications.length} items</span>
                    <button
                      onClick={() => {
                        setIsNotificationOpen(false);
                        setActiveTab('news_awards');
                      }}
                      className="text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Full Newsroom</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Offline Save & Resume Manager Button */}
            <button
              onClick={onOpenSaveManager}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer min-h-[44px]"
              title="Open Offline Save & Resume Manager"
            >
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Offline Saves</span>
            </button>

            {/* Quick In-Game Editor Button */}
            <button
              onClick={onOpenEditor}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer min-h-[44px]"
              title="Open In-Game Editor & Funds/Stats Cheats"
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Editor</span>
            </button>

            {/* Start New Game Dropdown Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsGameMenuOpen(prev => !prev)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer min-h-[44px]"
              >
                <Gamepad2 className="w-4 h-4 text-emerald-400" />
                <span>Game Menu</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isGameMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 space-y-1 divide-y divide-slate-800/60 text-xs">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsGameMenuOpen(false);
                        if (onOpenSaveManager) onOpenSaveManager();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-emerald-300 hover:bg-emerald-500/10 font-bold flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <HardDrive className="w-4 h-4 text-emerald-400" />
                      <span>Offline Save / Resume Hub</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsGameMenuOpen(false);
                        if (onOpenLauncher) onOpenLauncher();
                        else onStartNewGame();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-emerald-400 hover:bg-emerald-500/10 font-bold flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-400" />
                      <span>New Game & Role Setup</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsGameMenuOpen(false);
                        onRestartGame();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-amber-300 hover:bg-amber-500/10 font-bold flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-amber-400" />
                      <span>Restart Career</span>
                    </button>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setIsGameMenuOpen(false);
                        onOpenEditor();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-amber-400 hover:bg-amber-500/10 font-bold flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Wrench className="w-4 h-4 text-amber-400" />
                      <span>In-Game Editor (Cheats)</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsGameMenuOpen(false);
                        onSaveGame();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-sky-300 hover:bg-sky-500/10 font-bold flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Save className="w-4 h-4 text-sky-400" />
                      <span>Quick Save Game</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsGameMenuOpen(false);
                        onLoadGame();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-purple-300 hover:bg-purple-500/10 font-bold flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-purple-400" />
                      <span>Load Game</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onAdvanceWeek}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-95 transition cursor-pointer min-h-[44px]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Next Week</span>
            </button>

            <button
              onClick={onFastForward4Weeks}
              title="Fast Forward 4 Weeks"
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 active:scale-95 transition cursor-pointer min-h-[44px]"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+1 Month</span>
            </button>
          </div>
        </div>

        {/* Desktop Primary Navigation Tabs with Role Badges & Role Filter Selector */}
        <div className="bg-slate-950/90 border-t border-slate-800/80 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto py-1 scrollbar-none text-xs">
            <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer min-h-[38px] ${
                      isActive
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="text-[11px]">{tab.roleIcon}</span>
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span className="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                        {tab.badge}
                      </span>
                    )}
                    {tab.highlight && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Role View Filter Pills */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl shrink-0">
              {[
                { id: 'all', label: 'All Tabs' },
                { id: 'agent', label: '💼 Agent' },
                { id: 'club_owner', label: '👑 Owner' },
                { id: 'fa_president', label: '🏛️ FA' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedRoleFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    selectedRoleFilter === f.id
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

