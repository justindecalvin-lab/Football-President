import React from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  Newspaper, 
  Play, 
  Users, 
  Flame, 
  Repeat, 
  ShoppingBag, 
  Search, 
  Shield, 
  Crown, 
  Globe, 
  BarChart3, 
  Building, 
  ShieldAlert, 
  Award, 
  Wrench,
  Layers,
  DollarSign,
  Trophy,
  Lock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { getSquadRegistrationStatus } from '../utils/registrationEngine';

interface SubNavHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unrestCount: number;
  isTransferWindow: boolean;
  activeRole?: string;
  clubName?: string;
  currentWeek?: number;
  currentSeason?: number;
}

export const SubNavHeader: React.FC<SubNavHeaderProps> = ({
  activeTab,
  setActiveTab,
  unrestCount,
  isTransferWindow,
  activeRole = 'agent',
  clubName,
  currentWeek = 1,
  currentSeason = 2026
}) => {
  const regStatus = getSquadRegistrationStatus(currentWeek, currentSeason);
  // 1. FA PRESIDENT SUB-NAVIGATION
  if (activeRole === 'fa_president') {
    const parentDefaultTab = 'governance';
    const isSubFrame = activeTab !== parentDefaultTab;

    return (
      <div className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-[68px] z-30 px-3 py-2">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-none text-xs">
          {/* Back Button if navigating away from Governance */}
          {isSubFrame && (
            <button
              onClick={() => setActiveTab('governance')}
              className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0 transition border border-slate-700 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Cabinet</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={() => setActiveTab('governance')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'governance'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>🏛️ Presidential Cabinet</span>
            </button>
            <button
              onClick={() => setActiveTab('dark_arts')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'dark_arts'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>⚖️ Disciplinary Tribunal</span>
            </button>
            <button
              onClick={() => setActiveTab('league_inspector')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'league_inspector'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>🌐 Member Leagues</span>
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'matches'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>🏆 Fixtures & Tables</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>💰 Solidarity Treasury</span>
            </button>
            <button
              onClick={() => setActiveTab('news_awards')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'news_awards'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>⭐ News & Gala</span>
            </button>
            <button
              onClick={() => setActiveTab('system_menu')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'system_menu'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>⚙️ System</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. CLUB PRESIDENT SUB-NAVIGATION
  if (activeRole === 'club_owner') {
    const parentDefaultTab = 'club_president';
    const isSubFrame = activeTab !== parentDefaultTab;

    return (
      <div className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-[68px] z-30 px-3 py-2">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-none text-xs">
          {/* Back Button if navigating away from Suite */}
          {isSubFrame && (
            <button
              onClick={() => setActiveTab('club_president')}
              className="bg-slate-800 hover:bg-slate-700 text-indigo-400 font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0 transition border border-slate-700 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Suite</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={() => setActiveTab('club_president')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'club_president'
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>👑 Presidential Suite</span>
            </button>
            <button
              onClick={() => setActiveTab('my_players')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'my_players'
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>👥 Senior Squad (25)</span>
            </button>
            <button
              onClick={() => setActiveTab('transfer_market')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'transfer_market'
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>💼 Club Transfers {isTransferWindow ? '🔥' : ''}</span>
            </button>
            <button
              onClick={() => setActiveTab('tycoon')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'tycoon'
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>🏟️ Stadium & Facilities</span>
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'matches'
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>⚽ Club Fixtures</span>
            </button>
            <button
              onClick={() => setActiveTab('news_awards')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'news_awards'
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>⭐ Press & Trophy Cabinet</span>
            </button>
            <button
              onClick={() => setActiveTab('system_menu')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'system_menu'
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>⚙️ System</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. FOOTBALL AGENT SUB-NAVIGATION (DEFAULT)
  const homeTabs = ['dashboard', 'news_awards', 'matches'];
  const rosterTabs = ['my_players', 'unrest_hotline', 'loan_management'];
  const marketTabs = ['transfer_market', 'scouting'];
  const rivalsTabs = ['rivals'];
  const officeTabs = ['analytics', 'tycoon', 'league_inspector', 'dark_arts', 'hall_of_fame', 'system_menu'];

  let activeGroup = 'home';
  let parentDefaultTab = 'dashboard';
  let parentTitle = 'Dashboard';

  if (rosterTabs.includes(activeTab)) {
    activeGroup = 'roster';
    parentDefaultTab = 'my_players';
    parentTitle = 'Client Hub';
  } else if (marketTabs.includes(activeTab)) {
    activeGroup = 'market';
    parentDefaultTab = 'transfer_market';
    parentTitle = 'Transfer Market';
  } else if (rivalsTabs.includes(activeTab)) {
    activeGroup = 'rivals';
    parentDefaultTab = 'rivals';
    parentTitle = 'Rival Agencies';
  } else if (officeTabs.includes(activeTab)) {
    activeGroup = 'office';
    parentDefaultTab = 'analytics';
    parentTitle = 'Agency Office';
  }

  const isSubFrame = activeTab !== parentDefaultTab;

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-[68px] z-30 px-3 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1 py-0.5">
        {/* Back Button if in Sub-Frame */}
        {isSubFrame && (
          <button
            onClick={() => setActiveTab(parentDefaultTab)}
            className="bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0 transition border border-slate-700 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {parentTitle}</span>
          </button>
        )}

        {/* Home Sub-Pills */}
        {activeGroup === 'home' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('news_awards')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'news_awards'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>News Digest</span>
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'matches'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Live Matches</span>
            </button>
          </div>
        )}

        {/* Roster Sub-Pills */}
        {activeGroup === 'roster' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('my_players')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'my_players'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Client Directory</span>
            </button>
            <button
              onClick={() => setActiveTab('unrest_hotline')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'unrest_hotline'
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                  : 'bg-slate-800/80 text-red-400 hover:bg-slate-700'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span>Unrest Hotline {unrestCount > 0 ? `(${unrestCount})` : ''}</span>
            </button>
            <button
              onClick={() => setActiveTab('loan_management')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'loan_management'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Loan Hub</span>
            </button>
          </div>
        )}

        {/* Market Sub-Pills */}
        {activeGroup === 'market' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('transfer_market')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'transfer_market'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Transfer Market {isTransferWindow ? '🔥' : ''}</span>
            </button>
            <button
              onClick={() => setActiveTab('scouting')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'scouting'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Scouting & Wonderkids</span>
            </button>
          </div>
        )}

        {/* Rivals Sub-Pills */}
        {activeGroup === 'rivals' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('rivals')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'rivals'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Rival Agencies</span>
            </button>
          </div>
        )}

        {/* Office Sub-Pills */}
        {activeGroup === 'office' && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Financials</span>
            </button>
            <button
              onClick={() => setActiveTab('tycoon')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'tycoon'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Tycoon Assets</span>
            </button>
            <button
              onClick={() => setActiveTab('dark_arts')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'dark_arts'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Dark Arts Ops</span>
            </button>
            <button
              onClick={() => setActiveTab('hall_of_fame')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'hall_of_fame'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Hall of Fame</span>
            </button>
            <button
              onClick={() => setActiveTab('system_menu')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'system_menu'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Game System</span>
            </button>
          </div>
        )}
        </div>

        {/* Squad Registration Window Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0 pl-2 border-l border-slate-800">
          <div 
            title={regStatus.description}
            className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 text-[11px] ${
              regStatus.isDeadlineWeek
                ? 'bg-red-500/15 border-red-500/40 text-red-300 animate-pulse'
                : regStatus.isOpen
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-400'
            }`}
          >
            {regStatus.isDeadlineWeek ? (
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            ) : regStatus.isOpen ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{regStatus.periodLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

