import React, { useState } from 'react';
import { AgencyState, Club, Player, NewsItem } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { soundEngine } from '../utils/soundEffects';
import { 
  Play, 
  PlusCircle, 
  Briefcase, 
  Crown, 
  Globe, 
  Shield, 
  Users, 
  DollarSign, 
  Sparkles, 
  Building2, 
  Trophy, 
  CheckCircle2, 
  FolderOpen, 
  Save, 
  RotateCcw,
  Flame,
  ArrowRight,
  TrendingUp,
  Volume2,
  VolumeX,
  Layers,
  ChevronRight
} from 'lucide-react';

export interface NewGameOptions {
  role: 'agent' | 'club_owner' | 'fa_president';
  characterName: string;
  organizationName: string;
  startingBudget: number;
  targetClubId?: string;
  federationZone?: string;
  backgroundStyle: string;
}

export interface GameLauncherScreenProps {
  currentAgency: AgencyState;
  clubs: Club[];
  players?: Player[];
  hasExistingSave?: boolean;
  hasExistingGame?: boolean;
  onResumeGame: () => void;
  onStartNewGame: (options: NewGameOptions) => void;
  onOpenSaveManager: () => void;
}

export const GameLauncherScreen: React.FC<GameLauncherScreenProps> = ({
  currentAgency,
  clubs,
  players = [],
  hasExistingSave,
  hasExistingGame,
  onResumeGame,
  onStartNewGame,
  onOpenSaveManager
}) => {
  const [activeScreen, setActiveScreen] = useState<'launcher' | 'role_select' | 'career_setup'>('launcher');
  const [selectedRole, setSelectedRole] = useState<'agent' | 'club_owner' | 'fa_president'>('agent');
  const [agentName, setAgentName] = useState(currentAgency.agentName || 'Marcus Vance');
  const [agencyName, setAgencyName] = useState(currentAgency.agencyName || 'Vance Sports Global');
  const [agentTier, setAgentTier] = useState<'grassroots' | 'established'>('grassroots');
  const [selectedClubId, setSelectedClubId] = useState<string>(clubs[0]?.id || 'c1');
  const [federationZone, setFederationZone] = useState<'Europe' | 'South America' | 'Global (FIFA)'>('Europe');
  const [soundOn, setSoundOn] = useState<boolean>(currentAgency.soundEnabled ?? true);

  const clientCount = players.filter(p => p.isMyClient).length;
  const currentRole = currentAgency.activeRoles?.currentRole || (currentAgency.presidency?.role === 'Club President' ? 'club_owner' : 'agent');

  const handleRoleCardClick = (role: 'agent' | 'club_owner' | 'fa_president') => {
    soundEngine.playClick();
    setSelectedRole(role);
    if (role === 'club_owner' && !agencyName.includes('FC') && !agencyName.includes('Club')) {
      const c = clubs.find(cl => cl.id === selectedClubId);
      setAgencyName(c ? `${c.name} Ownership Group` : 'Apex Football Holdings');
    } else if (role === 'fa_president') {
      setAgencyName('European Football Federation Board');
    }
    setActiveScreen('career_setup');
  };

  const handleLaunchCareer = () => {
    soundEngine.playGavel();
    let funds = 500000;
    if (selectedRole === 'agent') {
      funds = agentTier === 'grassroots' ? 500000 : 2500000;
    } else if (selectedRole === 'club_owner') {
      funds = 100000000; // €100M Tycoon War Chest
    } else if (selectedRole === 'fa_president') {
      funds = 25000000; // €25M Federation Treasury
    }

    onStartNewGame({
      role: selectedRole,
      characterName: agentName.trim() || 'Marcus Vance',
      organizationName: agencyName.trim() || 'Vance Sports Global',
      startingBudget: funds,
      targetClubId: selectedRole === 'club_owner' ? selectedClubId : undefined,
      federationZone: selectedRole === 'fa_president' ? federationZone : undefined,
      backgroundStyle: selectedRole === 'agent' ? agentTier : 'executive'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden font-sans select-none">
      {/* Dynamic Background Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>SOCCER AGENT</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                PRO 2026
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Global Football Empire & Governance Simulator</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              soundEngine.setSoundEnabled(next);
            }}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition cursor-pointer"
            title="Toggle Sound Effects"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={onOpenSaveManager}
            className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Save className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Save / Load Slots</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto w-full my-auto py-8 z-10">
        {activeScreen === 'launcher' && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Hero Banner */}
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 text-xs font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                Next-Gen Football Career Mode
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Control the Pitch from the <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">Shadows</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 font-normal">
                Choose your destiny: negotiate blockbuster transfers as a licensed Agent, command an empire as Club President, or reshape the laws of global football as FA President.
              </p>
            </div>

            {/* Main Action Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Resume Game Card */}
              {hasExistingGame ? (
                <div className="bg-slate-900/90 border-2 border-emerald-500/40 hover:border-emerald-400 rounded-3xl p-6 sm:p-7 shadow-xl shadow-emerald-950/30 flex flex-col justify-between space-y-6 transition group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition" />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30 flex items-center gap-1.5">
                        <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                        ACTIVE CAREER READY
                      </span>
                      <span className="text-xs text-slate-400 font-bold">
                        Season {currentAgency.currentSeason} • Wk {currentAgency.currentWeek}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-black text-white group-hover:text-emerald-300 transition">
                        {currentAgency.agencyName || 'Vance Sports Global'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>Lead: <strong className="text-slate-200">{currentAgency.agentName}</strong></span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold capitalize">
                          {currentRole === 'club_owner' ? 'Club President' : currentRole === 'fa_president' ? 'FA President' : 'Football Agent'}
                        </span>
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-950/70 border border-slate-800 p-3 rounded-2xl">
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Treasury</div>
                        <div className="text-sm font-black text-emerald-400 mt-0.5">{formatMoney(currentAgency.balance)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Reputation</div>
                        <div className="text-sm font-black text-amber-400 mt-0.5">{currentAgency.reputation}/100</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Clients</div>
                        <div className="text-sm font-black text-indigo-400 mt-0.5">{clientCount} Players</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      soundEngine.playSuccess();
                      onResumeGame();
                    }}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98]"
                  >
                    <span>RESUME CAREER</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              ) : (
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-7 flex flex-col items-center justify-center text-center space-y-3 opacity-60">
                  <Briefcase className="w-10 h-10 text-slate-600" />
                  <h4 className="text-base font-bold text-slate-400">No Active Career Found</h4>
                  <p className="text-xs text-slate-500 max-w-xs">Start a brand new career below to begin your journey in football executive management.</p>
                </div>
              )}

              {/* Start New Game Card */}
              <div className="bg-slate-900/90 border-2 border-indigo-500/40 hover:border-indigo-400 rounded-3xl p-6 sm:p-7 shadow-xl shadow-indigo-950/30 flex flex-col justify-between space-y-6 transition group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition" />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black border border-indigo-500/30 flex items-center gap-1.5">
                      <PlusCircle className="w-3 h-3 text-indigo-400" />
                      NEW CAMPAIGN
                    </span>
                    <span className="text-xs text-indigo-400 font-bold">3 Distinct Roles</span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-white group-hover:text-indigo-300 transition">
                      Start Brand New Career
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Choose your starting career role: Licensed Football Agent, Billionaire Club Owner, or FA Federation Chief.
                    </p>
                  </div>

                  <div className="space-y-2 bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Role exclusivity & realistic career progression paths</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>Buy club shares & win shareholder proxy elections</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Tougher board & player contract negotiations</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveScreen('role_select');
                  }}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-black text-sm tracking-wide shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98]"
                >
                  <span>SELECT ROLE & START</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Screen 2: Role Selection Grid */}
        {activeScreen === 'role_select' && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Select Your Starting Career Role
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                Each role grants specific starting funds, distinct responsibilities, and strict mutual exclusivity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Role 1: Football Agent */}
              <div 
                onClick={() => handleRoleCardClick('agent')}
                className="bg-slate-900/90 hover:bg-slate-850 border-2 border-emerald-500/40 hover:border-emerald-400 rounded-3xl p-6 flex flex-col justify-between space-y-5 cursor-pointer transition group shadow-xl hover:shadow-emerald-950/40 relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 group-hover:scale-110 transition">
                    <Briefcase className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition">Football Agent</h3>
                      <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        €500K - €2.5M
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Scout wonderkids, represent top players, negotiate blockbuster transfers, poach rival clients, and build a lucrative agency empire.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-1.5 text-[11px] text-slate-300">
                    <div className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">Career Rules:</div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-500">•</span>
                      <span>Cannot hold Club or FA Presidency simultaneously.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-500">•</span>
                      <span>Buy &gt;50% club shares to become President, or win elections with &lt;50%.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-500">•</span>
                      <span>Earn FA Presidency after 85+ Rep &amp; €50M Net Worth.</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-black text-emerald-400 group-hover:translate-x-1 transition">
                  <span>SELECT AGENT CAREER</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Role 2: Club President / Owner */}
              <div 
                onClick={() => handleRoleCardClick('club_owner')}
                className="bg-slate-900/90 hover:bg-slate-850 border-2 border-indigo-500/40 hover:border-indigo-400 rounded-3xl p-6 flex flex-col justify-between space-y-5 cursor-pointer transition group shadow-xl hover:shadow-indigo-950/40 relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/40 group-hover:scale-110 transition">
                    <Crown className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-white group-hover:text-indigo-300 transition">Club President &amp; Owner</h3>
                      <span className="text-[11px] font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                        €100,000,000
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Take 100% controlling ownership of a world-class club. Direct stadium upgrades, hire tactical managers, expand multi-club networks, and veto transfers.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-1.5 text-[11px] text-slate-300">
                    <div className="font-bold text-indigo-400 uppercase tracking-wider text-[10px]">Career Rules:</div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-500">•</span>
                      <span>Starts with 100% majority equity in chosen club.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-500">•</span>
                      <span>Full access to Presidential Directives &amp; multi-club group.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-500">•</span>
                      <span>Cannot represent rival club players as external agent.</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-black text-indigo-400 group-hover:translate-x-1 transition">
                  <span>SELECT PRESIDENT CAREER</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Role 3: FA President */}
              <div 
                onClick={() => handleRoleCardClick('fa_president')}
                className="bg-slate-900/90 hover:bg-slate-850 border-2 border-amber-500/40 hover:border-amber-400 rounded-3xl p-6 flex flex-col justify-between space-y-5 cursor-pointer transition group shadow-xl hover:shadow-amber-950/40 relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 group-hover:scale-110 transition">
                    <Globe className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition">FA / Federation President</h3>
                      <span className="text-[11px] font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                        €25,000,000
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Reign over continental football governance. Enforce FFP financial fair play, set agent commission caps, dictate VAR strictness, and award World Cup hosting bids.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-1.5 text-[11px] text-slate-300">
                    <div className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Career Rules:</div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-500">•</span>
                      <span>Direct control of European/Global Federation policies.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-500">•</span>
                      <span>Pass legislative decrees (1 decree/week limit).</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-500">•</span>
                      <span>Must manage ethics committee scandal meter.</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-black text-amber-400 group-hover:translate-x-1 transition">
                  <span>SELECT FA CHIEF CAREER</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setActiveScreen('launcher')}
                className="text-xs text-slate-400 hover:text-white font-bold underline cursor-pointer"
              >
                Back to Launcher Main Menu
              </button>
            </div>
          </div>
        )}

        {/* Screen 3: Career Setup Form */}
        {activeScreen === 'career_setup' && (
          <div className="max-w-2xl mx-auto bg-slate-900/95 border-2 border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Step 2 of 2: Profile &amp; Customization</span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  Configure Your {selectedRole === 'agent' ? 'Football Agency' : selectedRole === 'club_owner' ? 'Club Ownership' : 'Federation Presidency'}
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                {selectedRole === 'agent' && <Briefcase className="w-6 h-6 text-emerald-400" />}
                {selectedRole === 'club_owner' && <Crown className="w-6 h-6 text-indigo-400" />}
                {selectedRole === 'fa_president' && <Globe className="w-6 h-6 text-amber-400" />}
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1.5">
                    {selectedRole === 'agent' ? 'Agent Name' : selectedRole === 'club_owner' ? 'President Name' : 'Executive Chief Name'}
                  </label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={e => setAgentName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:border-emerald-400 focus:outline-none"
                    placeholder="Marcus Vance"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1.5">
                    {selectedRole === 'agent' ? 'Agency Firm Name' : selectedRole === 'club_owner' ? 'Ownership Group Name' : 'Governance Council'}
                  </label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={e => setAgencyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:border-emerald-400 focus:outline-none"
                    placeholder="Vance Sports Global"
                  />
                </div>
              </div>

              {/* Role Specific Tier / Options */}
              {selectedRole === 'agent' && (
                <div>
                  <label className="block text-slate-400 font-bold mb-2">Starting Agency Background &amp; Treasury</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setAgentTier('grassroots')}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                        agentTier === 'grassroots'
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">Grassroots Hustler</span>
                        <span className="text-xs font-black text-emerald-400">€500,000</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Start from raw grassroots scouting. Earn every Euro through transfer commissions and player breakthroughs.
                      </p>
                    </div>

                    <div
                      onClick={() => setAgentTier('established')}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                        agentTier === 'established'
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">Established Super-Agent</span>
                        <span className="text-xs font-black text-emerald-400">€2,500,000</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Begin with prime capital backing, level 2 office, and scouting capabilities across Europe.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedRole === 'club_owner' && (
                <div>
                  <label className="block text-slate-400 font-bold mb-1.5">Choose Club to Acquire (100% Majority Ownership)</label>
                  <select
                    value={selectedClubId}
                    onChange={e => setSelectedClubId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:border-indigo-400 focus:outline-none"
                  >
                    {clubs.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.league}) • Budget: {formatMoney(c.transferBudget)} • Stadium: {c.stadiumCapacity ? c.stadiumCapacity.toLocaleString() : '50,000'} seats
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    You will receive <strong>€100,000,000</strong> in personal tycoon treasury alongside total boardroom control of {clubs.find(c => c.id === selectedClubId)?.name}.
                  </p>
                </div>
              )}

              {selectedRole === 'fa_president' && (
                <div>
                  <label className="block text-slate-400 font-bold mb-1.5">Select Confederation Jurisdiction</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Europe', 'South America', 'Global (FIFA)'] as const).map(zone => (
                      <button
                        key={zone}
                        type="button"
                        onClick={() => setFederationZone(zone)}
                        className={`p-3 rounded-xl border text-center transition font-bold ${
                          federationZone === zone
                            ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {zone}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    You will start with <strong>€25,000,000</strong> in federation reserves and sweeping legislative powers over {federationZone}.
                  </p>
                </div>
              )}
            </div>

            {/* Launch Buttons */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveScreen('role_select')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Back to Roles
              </button>

              <button
                type="button"
                onClick={handleLaunchCareer}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer transition active:scale-95"
              >
                <span>CONFIRM &amp; COMMENCE CAREER</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer System Info */}
      <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 border-t border-slate-800/80 pt-4 z-10">
        <div>
          <span>SOCCER AGENT PRO v4.8 • Multi-Role Career &amp; Governance Engine</span>
        </div>
        <div className="flex items-center gap-4">
          <span>High-Capacity Storage Enabled</span>
          <span>•</span>
          <span>FIFA &amp; UEFA Regulations Compliant</span>
        </div>
      </div>
    </div>
  );
};
