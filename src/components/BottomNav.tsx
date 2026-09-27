import React from 'react';
import { 
  Home, 
  Users, 
  ShoppingBag, 
  Crown, 
  Building2, 
  Globe, 
  ShieldAlert, 
  Play, 
  DollarSign, 
  Trophy, 
  Shield,
  Layers
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unrestCount: number;
  isTransferWindow: boolean;
  activeRole: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  unrestCount,
  isTransferWindow,
  activeRole
}) => {
  // 1. FA PRESIDENT NAVIGATION CONFIGURATION
  if (activeRole === 'fa_president') {
    const cabinetTabs = ['governance'];
    const tribunalTabs = ['dark_arts'];
    const leaguesTabs = ['league_inspector'];
    const fixturesTabs = ['matches'];
    const treasuryTabs = ['analytics', 'news_awards', 'hall_of_fame', 'system_menu'];

    const isCabinetActive = cabinetTabs.includes(activeTab);
    const isTribunalActive = tribunalTabs.includes(activeTab) || activeTab === 'disciplinary';
    const isLeaguesActive = leaguesTabs.includes(activeTab);
    const isFixturesActive = fixturesTabs.includes(activeTab);
    const isTreasuryActive = treasuryTabs.includes(activeTab);

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-2xl px-2 py-1.5 min-h-[64px]">
        <div className="max-w-xl mx-auto grid grid-cols-5 gap-1 items-center">
          {/* Tab 1: Cabinet */}
          <button
            onClick={() => setActiveTab('governance')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer active:scale-95 ${
              isCabinetActive
                ? 'text-amber-400 bg-amber-500/10 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className={`w-5 h-5 ${isCabinetActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Cabinet</span>
          </button>

          {/* Tab 2: Tribunal & Compliance */}
          <button
            onClick={() => setActiveTab('dark_arts')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer active:scale-95 ${
              isTribunalActive
                ? 'text-amber-400 bg-amber-500/10 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className={`w-5 h-5 ${isTribunalActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Tribunal</span>
          </button>

          {/* Tab 3: Member Leagues */}
          <button
            onClick={() => setActiveTab('league_inspector')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer active:scale-95 ${
              isLeaguesActive
                ? 'text-amber-400 bg-amber-500/10 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className={`w-5 h-5 ${isLeaguesActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Leagues</span>
          </button>

          {/* Tab 4: Tournaments & Fixtures */}
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer active:scale-95 ${
              isFixturesActive
                ? 'text-amber-400 bg-amber-500/10 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className={`w-5 h-5 ${isFixturesActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Fixtures</span>
          </button>

          {/* Tab 5: Solidarity Treasury */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer active:scale-95 ${
              isTreasuryActive
                ? 'text-amber-400 bg-amber-500/10 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className={`w-5 h-5 ${isTreasuryActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Treasury</span>
          </button>
        </div>
      </nav>
    );
  }

  // 2. CLUB PRESIDENT / OWNER NAVIGATION CONFIGURATION
  if (activeRole === 'club_owner') {
    const suiteTabs = ['club_president'];
    const squadTabs = ['my_players'];
    const transferTabs = ['transfer_market', 'scouting'];
    const facilitiesTabs = ['tycoon'];
    const matchTabs = ['matches', 'news_awards', 'analytics', 'hall_of_fame', 'system_menu'];

    const isSuiteActive = suiteTabs.includes(activeTab);
    const isSquadActive = squadTabs.includes(activeTab);
    const isTransferActive = transferTabs.includes(activeTab);
    const isFacilitiesActive = facilitiesTabs.includes(activeTab);
    const isMatchActive = matchTabs.includes(activeTab);

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-2xl px-2 py-1.5 min-h-[64px]">
        <div className="max-w-xl mx-auto grid grid-cols-5 gap-1 items-center">
          {/* Tab 1: Suite */}
          <button
            onClick={() => setActiveTab('club_president')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer active:scale-95 ${
              isSuiteActive
                ? 'text-indigo-400 bg-indigo-500/10 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className={`w-5 h-5 ${isSuiteActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Suite</span>
          </button>

          {/* Tab 2: 25-Man Squad */}
          <button
            onClick={() => setActiveTab('my_players')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer active:scale-95 ${
              isSquadActive
                ? 'text-indigo-400 bg-indigo-500/10 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className={`w-5 h-5 ${isSquadActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Squad</span>
          </button>

          {/* Tab 3: Transfers */}
          <button
            onClick={() => setActiveTab('transfer_market')}
            className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer active:scale-95 ${
              isTransferActive
                ? 'text-indigo-400 bg-indigo-500/10 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isTransferWindow && (
              <span className="absolute -top-1 right-2 w-2 h-2 bg-indigo-400 rounded-full animate-ping" />
            )}
            <ShoppingBag className={`w-5 h-5 ${isTransferActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Transfers</span>
          </button>

          {/* Tab 4: Facilities & Stadium */}
          <button
            onClick={() => setActiveTab('tycoon')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer active:scale-95 ${
              isFacilitiesActive
                ? 'text-indigo-400 bg-indigo-500/10 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className={`w-5 h-5 ${isFacilitiesActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Facilities</span>
          </button>

          {/* Tab 5: Fixtures & Matches */}
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer active:scale-95 ${
              isMatchActive
                ? 'text-indigo-400 bg-indigo-500/10 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className={`w-5 h-5 ${isMatchActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Fixtures</span>
          </button>
        </div>
      </nav>
    );
  }

  // 3. FOOTBALL AGENT (DEFAULT) NAVIGATION CONFIGURATION
  const homeTabs = ['dashboard', 'news_awards', 'matches'];
  const rosterTabs = ['my_players', 'unrest_hotline', 'loan_management'];
  const marketTabs = ['transfer_market', 'scouting'];
  const rivalsTabs = ['rivals'];
  const officeTabs = ['analytics', 'tycoon', 'league_inspector', 'dark_arts', 'hall_of_fame', 'system_menu'];

  const isHomeActive = homeTabs.includes(activeTab);
  const isRosterActive = rosterTabs.includes(activeTab);
  const isMarketActive = marketTabs.includes(activeTab);
  const isRivalsActive = rivalsTabs.includes(activeTab);
  const isOfficeActive = officeTabs.includes(activeTab);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-2xl px-2 py-1.5 min-h-[64px]">
      <div className="max-w-xl mx-auto grid grid-cols-5 gap-1 items-center">
        {/* Tab 1: Home */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer active:scale-95 ${
            isHomeActive
              ? 'text-emerald-400 bg-emerald-500/10 font-black'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className={`w-5 h-5 ${isHomeActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] font-bold mt-0.5 tracking-tight">Home</span>
        </button>

        {/* Tab 2: Roster */}
        <button
          onClick={() => setActiveTab('my_players')}
          className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer active:scale-95 ${
            isRosterActive
              ? 'text-emerald-400 bg-emerald-500/10 font-black'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {unrestCount > 0 && (
            <span className="absolute -top-1 right-2 w-4 h-4 bg-red-500 text-white font-black text-[9px] rounded-full flex items-center justify-center animate-bounce shadow-md">
              {unrestCount}
            </span>
          )}
          <Users className={`w-5 h-5 ${isRosterActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] font-bold mt-0.5 tracking-tight">Roster</span>
        </button>

        {/* Tab 3: Market */}
        <button
          onClick={() => setActiveTab('transfer_market')}
          className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer active:scale-95 ${
            isMarketActive
              ? 'text-emerald-400 bg-emerald-500/10 font-black'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {isTransferWindow && (
            <span className="absolute -top-1 right-2 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          )}
          <ShoppingBag className={`w-5 h-5 ${isMarketActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] font-bold mt-0.5 tracking-tight">Market</span>
        </button>

        {/* Tab 4: Rivals */}
        <button
          onClick={() => setActiveTab('rivals')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer active:scale-95 ${
            isRivalsActive
              ? 'text-emerald-400 bg-emerald-500/10 font-black'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className={`w-5 h-5 ${isRivalsActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] font-bold mt-0.5 tracking-tight">Rivals</span>
        </button>

        {/* Tab 5: Office */}
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer active:scale-95 ${
            isOfficeActive
              ? 'text-emerald-400 bg-emerald-500/10 font-black'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className={`w-5 h-5 ${isOfficeActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] font-bold mt-0.5 tracking-tight">Office</span>
        </button>
      </div>
    </nav>
  );
};

