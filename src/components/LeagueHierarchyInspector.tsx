import React, { useState } from 'react';
import { Club, Player, AgencyState } from '../types';
import { formatMoney, calculateDynamicValuation } from '../utils/gameEngine';
import { getClubFfpDetails, executeClubSanctions, restructureClientContract } from '../utils/ffpEngine';
import { CONTINENTAL_LEAGUES } from '../utils/proceduralGenerator';
import { soundEngine } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import { PlayerPitchNegotiationModal } from './PlayerPitchNegotiationModal';
import {
  executeNationalSquadCallUp,
  executeWorkPermitFastTrack,
  executeAntiDopingAudit,
  executeDisciplinaryCitation,
  executePresidentialMeritMedal,
  executeGrassrootsAmbassador,
  executeClubContractRenewal,
  executeAwardCaptaincy,
  executeBoardroomPepTalk,
  executePresidentialFine,
  executeSwissMedicalClinic,
  executeInviteRivalChairman,
  executeDemandWageRenegotiation,
  executeTabloidLeak,
  executeCommercialBootDeal,
  executeTapUpEntourage,
  InteractionOutcome
} from '../utils/roleInteractionsEngine';
import { 
  Globe, 
  Building2, 
  Users, 
  Trophy, 
  DollarSign, 
  ChevronRight, 
  Search, 
  ShieldAlert, 
  Sparkles, 
  ArrowLeft,
  Crown,
  UserCheck,
  Zap,
  Activity,
  Award,
  AlertTriangle,
  Scale,
  Ban,
  TrendingDown,
  TrendingUp,
  Landmark,
  Coins,
  Shield,
  FileSpreadsheet,
  CheckCircle2,
  FileText,
  Handshake,
  HeartHandshake,
  Stethoscope,
  Send,
  Flag,
  FileBadge,
  Sparkle,
  Megaphone,
  Briefcase
} from 'lucide-react';

interface LeagueHierarchyInspectorProps {
  clubs: Club[];
  players: Player[];
  agency: AgencyState;
  onUpdatePlayer: (player: Player) => void;
  onUpdateAgency: (agency: AgencyState) => void;
  onOpenTransferModal: (player: Player) => void;
  onOpenClubModal?: (club: Club) => void;
  onUpdateClub?: (club: Club) => void;
  addToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const LeagueHierarchyInspector: React.FC<LeagueHierarchyInspectorProps> = ({
  clubs,
  players,
  agency,
  onUpdatePlayer,
  onUpdateAgency,
  onOpenTransferModal,
  onOpenClubModal,
  onUpdateClub,
  addToast
}) => {
  const [selectedContinent, setSelectedContinent] = useState<string>('Europe');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('eng_pl');
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [pitchingPlayer, setPitchingPlayer] = useState<Player | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clubViewMode, setClubViewMode] = useState<'roster' | 'ffp_finances'>('ffp_finances');

  // Role detection
  const currentRole = agency.activeRoles?.currentRole || (agency.presidency?.role === 'Club President' ? 'club_owner' : agency.presidency?.role && agency.presidency?.role !== 'None' ? 'fa_president' : 'agent');
  const isFA = currentRole === 'fa_president';
  const isOwner = currentRole === 'club_owner';
  const isAgent = currentRole === 'agent';
  const ownedClub = clubs.find(c => c.id === agency.presidency?.clubId || c.name === agency.presidency?.clubName);

  // Get active leagues in selected continent
  const continentLeagues = CONTINENTAL_LEAGUES.filter(l => l.continent === selectedContinent);
  const activeLeagueDef = CONTINENTAL_LEAGUES.find(l => l.id === selectedLeagueId) || continentLeagues[0] || CONTINENTAL_LEAGUES[0];

  // Get clubs in selected league
  const leagueClubs = clubs
    .filter(c => c.league === activeLeagueDef.name)
    .sort((a, b) => b.points - a.points || b.reputation - a.reputation);

  // Selected Club
  const activeClub = selectedClubId ? clubs.find(c => c.id === selectedClubId) || leagueClubs[0] : leagueClubs[0];

  // Players in selected club
  const clubPlayers = activeClub 
    ? players.filter(p => p.clubId === activeClub.id)
    : [];

  const myClientsInClub = clubPlayers.filter(p => p.isMyClient);

  const filteredPlayers = clubPlayers.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Active Club FFP Details
  const activeClubFfp = activeClub ? getClubFfpDetails(activeClub, players, agency.currentWeek) : null;

  // Handle Governance Action on Club
  const handleExecuteSanction = (sanctionType: 'fine' | 'points_deduction' | 'transfer_ban' | 'forensic_audit' | 'wage_slash_order') => {
    if (!activeClub) return;
    try {
      const { updatedClub, updatedAgency, summaryMessage } = executeClubSanctions(activeClub, sanctionType, agency);
      if (onUpdateClub) onUpdateClub(updatedClub);
      onUpdateAgency(updatedAgency);
      if (agency.soundEnabled) soundEngine.playCashSound();
      if (addToast) {
        addToast(summaryMessage, sanctionType === 'fine' ? 'success' : 'info');
      } else {
        alert(summaryMessage);
      }
    } catch (err: any) {
      if (addToast) addToast(err.message, 'error');
      else alert(err.message);
    }
  };

  // Handle Client Restructuring Advice
  const handleAdviseRestructuring = (client: Player) => {
    if (!activeClub) return;
    const { updatedPlayer, updatedClub, updatedAgency, savingsAnnual, bonusEarned } = restructureClientContract(client, activeClub, agency);
    onUpdatePlayer(updatedPlayer);
    if (onUpdateClub) onUpdateClub(updatedClub);
    onUpdateAgency(updatedAgency);
    if (agency.soundEnabled) soundEngine.playCashSound();
    confetti({ particleCount: 70, spread: 80 });
    const msg = `🤝 Contract Restructured: ${client.name} accepted wage restructuring, reducing ${activeClub.name}'s debt by ${formatMoney(savingsAnnual)}/yr! +${formatMoney(bonusEarned)} Advisory Commission Earned!`;
    if (addToast) {
      addToast(msg, 'success');
    } else {
      alert(msg);
    }
  };

  // Rebuild loyalty handler
  const handleRebuildLoyalty = (p: Player) => {
    if (agency.balance < 20000) {
      alert(`Need €20,000 for client loyalty dinner!`);
      return;
    }
    const newLoyalty = Math.min(100, (p.loyalty ?? 80) + 25);
    const updated: Player = { ...p, loyalty: newLoyalty };
    onUpdatePlayer(updated);
    if (selectedPlayer?.id === p.id) setSelectedPlayer(updated);
    onUpdateAgency({ ...agency, balance: agency.balance - 20000 });
    alert(`Client trust restored! ${p.name}'s Loyalty is now ${newLoyalty}%.`);
  };

  // Sign / Poach Player Handler
  const handlePoachOrRepresentPlayer = (p: Player) => {
    if (p.isMyClient) return;
    setPitchingPlayer(p);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-emerald-400" />
            <span>Global League & Multi-Tier Club Inspector</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Deep-link entity navigation: League Table → Club Profile → Roster → Player Card → Contextual Actions.
          </p>
        </div>

        {/* Continent Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {['Europe', 'South America', 'North America', 'Asia', 'Africa'].map(cont => (
            <button
              key={cont}
              onClick={() => {
                setSelectedContinent(cont);
                const firstLg = CONTINENTAL_LEAGUES.find(l => l.continent === cont);
                if (firstLg) setSelectedLeagueId(firstLg.id);
                setSelectedClubId(null);
                setSelectedPlayer(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                selectedContinent === cont 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cont}
            </button>
          ))}
        </div>
      </div>

      {/* League Selection Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {continentLeagues.map(lg => (
          <button
            key={lg.id}
            onClick={() => {
              setSelectedLeagueId(lg.id);
              setSelectedClubId(null);
              setSelectedPlayer(null);
            }}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer border whitespace-nowrap ${
              selectedLeagueId === lg.id
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-400/50 shadow-md'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span>{lg.flag}</span>
            <span>{lg.name}</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${lg.tier === 1 ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'}`}>
              Tier {lg.tier}
            </span>
          </button>
        ))}
      </div>

      {/* Drill-down Breadcrumb Path */}
      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
        <span className="font-bold text-emerald-400">{selectedContinent}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="font-bold text-white">{activeLeagueDef.flag} {activeLeagueDef.name}</span>
        {activeClub && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-bold text-amber-400">{activeClub.name}</span>
          </>
        )}
        {selectedPlayer && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-bold text-sky-400">{selectedPlayer.name} ({selectedPlayer.position})</span>
          </>
        )}
      </div>

      {/* 3-Column Drill-Down Grid: League Clubs (Col 1) -> Club Details & Roster (Col 2) -> Player Deep Inspector (Col 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Col 1: League Clubs Standings List (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-white text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>{activeLeagueDef.name} Standings</span>
            </h3>
            <span className="text-[10px] text-slate-400">{leagueClubs.length} Clubs</span>
          </div>

          <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
            {leagueClubs.map((club, idx) => {
              const isSelected = activeClub?.id === club.id;
              const ffp = getClubFfpDetails(club, players, agency.currentWeek);

              let ffpBadge = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
              let ffpLabel = 'FFP OK';
              if (ffp.status === 'In FFP Breach') {
                ffpBadge = 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
                ffpLabel = 'FFP BREACH';
              } else if (ffp.status === 'At Risk') {
                ffpBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                ffpLabel = 'FFP RISK';
              }

              return (
                <div
                  key={club.id}
                  onClick={() => {
                    setSelectedClubId(club.id);
                    setSelectedPlayer(null);
                  }}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected 
                      ? 'bg-slate-800 border-emerald-500/60 text-white shadow-md' 
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-black text-slate-500 w-4">{idx + 1}</span>
                    <span className={`w-3 h-3 rounded-full ${club.logoColor}`} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs leading-snug">{club.name}</p>
                        <span className={`text-[8px] font-black px-1.5 py-0.2 rounded border ${ffpBadge}`}>
                          {ffpLabel}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">Rep: {club.reputation} • {club.played} GP • Spent: {formatMoney(ffp.spending)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm text-emerald-400">{club.points} pts</p>
                    <p className="text-[9px] text-slate-400 font-mono">Debt: {ffp.debtRatio}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Col 2: Active Club Roster & Details (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          {activeClub && activeClubFfp ? (
            <>
              {/* Club Header Info */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full ${activeClub.logoColor}`} />
                    <h3 className="font-extrabold text-base text-white">{activeClub.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {onOpenClubModal && (
                      <button
                        onClick={() => onOpenClubModal(activeClub)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 shadow"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Inspect Club Pop-Up</span>
                      </button>
                    )}
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Reputation {activeClub.reputation}/100
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Manager</span>
                    <strong className="text-white truncate block">{activeClub.managerName || 'Head Coach'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Transfer Budget</span>
                    <strong className="text-emerald-400">{formatMoney(activeClub.transferBudget)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Total Season Spent</span>
                    <strong className="text-amber-300 font-mono">{formatMoney(activeClubFfp.spending)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">FFP Status</span>
                    <strong className={activeClubFfp.status === 'Compliant' ? 'text-emerald-400' : activeClubFfp.status === 'At Risk' ? 'text-amber-400' : 'text-red-400'}>
                      {activeClubFfp.status}
                    </strong>
                  </div>
                </div>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setClubViewMode('ffp_finances')}
                  className={`flex-1 py-1.5 rounded-lg font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    clubViewMode === 'ffp_finances'
                      ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>FFP & Spending Actions</span>
                </button>

                <button
                  onClick={() => setClubViewMode('roster')}
                  className={`flex-1 py-1.5 rounded-lg font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    clubViewMode === 'roster'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Active Roster ({clubPlayers.length})</span>
                </button>
              </div>

              {/* VIEW 1: FFP, SPENDING & GOVERNANCE ACTIONS */}
              {clubViewMode === 'ffp_finances' && (
                <div className="space-y-3.5">
                  {/* FFP Alert Banner for Non-Compliant Clubs */}
                  {!activeClubFfp.isWithinFfp ? (
                    <div className="bg-red-950/50 border-2 border-red-500/70 p-3.5 rounded-xl space-y-2 shadow-lg animate-pulse">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-black text-red-200 uppercase tracking-wide">
                            FFP NON-COMPLIANCE ALERT: {activeClub.name}
                          </h4>
                          <p className="text-xs text-red-300/90 mt-0.5 leading-relaxed">
                            {activeClubFfp.alertMessage || `${activeClub.name} is in violation of Financial Fair Play rules with a Debt Ratio of ${activeClubFfp.debtRatio}%.`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-950/30 border border-emerald-500/40 p-3 rounded-xl flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <h4 className="text-xs font-black text-emerald-300">
                          FFP COMPLIANT: Within Allowable Spending Limits
                        </h4>
                        <p className="text-[11px] text-emerald-400/80">
                          {activeClub.name} has maintained sustainable finances (Debt Ratio: {activeClubFfp.debtRatio}%).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 4 Core Financial Fair Play (FFP) Determinant Factors Card */}
                  {activeClubFfp.factors && (
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-indigo-500/30 space-y-2.5 shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Scale className="w-4 h-4 text-indigo-400" />
                          <h4 className="text-xs font-black text-white uppercase tracking-wide">
                            4 Core FFP Factors Breakdown
                          </h4>
                        </div>
                        <span className={`text-[11px] font-black font-mono px-2 py-0.5 rounded ${
                          activeClubFfp.factors.overallHealthScore >= 70 ? 'text-emerald-400 bg-emerald-950/70 border border-emerald-500/30' :
                          activeClubFfp.factors.overallHealthScore >= 45 ? 'text-amber-300 bg-amber-950/70 border border-amber-500/30' : 'text-red-400 bg-red-950/70 border border-red-500/30'
                        }`}>
                          Health Score: {activeClubFfp.factors.overallHealthScore}/100
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                              <Coins className="w-3 h-3 text-amber-400" /> Market Dealing
                            </span>
                            <span className="text-[10px] font-bold text-amber-300">
                              {activeClubFfp.factors.marketDealing.strategy}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate" title={activeClubFfp.factors.marketDealing.description}>
                            {activeClubFfp.factors.marketDealing.description}
                          </p>
                        </div>

                        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                              <Landmark className="w-3 h-3 text-blue-400" /> Management
                            </span>
                            <span className="text-[10px] font-bold text-blue-300">
                              {activeClubFfp.factors.management.governanceStyle}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate" title={activeClubFfp.factors.management.description}>
                            {activeClubFfp.factors.management.description}
                          </p>
                        </div>

                        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-emerald-400" /> Income Stream
                            </span>
                            <span className="text-[10px] font-bold text-emerald-300">
                              {activeClubFfp.factors.income.score}/100 Rating
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate" title={activeClubFfp.factors.income.commercialTier}>
                            {activeClubFfp.factors.income.commercialTier}
                          </p>
                        </div>

                        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                              <FileSpreadsheet className="w-3 h-3 text-purple-400" /> Book Balancing
                            </span>
                            <span className="text-[10px] font-bold text-purple-300">
                              {activeClubFfp.factors.bookBalancing.score}/100 Score
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate" title={activeClubFfp.factors.bookBalancing.description}>
                            {activeClubFfp.factors.bookBalancing.isBalanced ? 'Solvent Balance Sheet' : 'Deficit / Debt Drag'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Financial Spending Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Season Spending</span>
                      <strong className="text-white text-sm font-black font-mono">{formatMoney(activeClubFfp.spending)}</strong>
                      <span className="text-[9px] text-slate-500 block">Transfers + Wages</span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">FFP Allowable Cap</span>
                      <strong className="text-emerald-400 text-sm font-black font-mono">{formatMoney(activeClubFfp.allowableCap)}</strong>
                      <span className="text-[9px] text-slate-500 block">Annual Revenue Limit</span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Debt Ratio</span>
                      <strong className={`text-sm font-black font-mono ${activeClubFfp.debtRatio > 90 ? 'text-red-400' : activeClubFfp.debtRatio > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {activeClubFfp.debtRatio}%
                      </strong>
                      <span className="text-[9px] text-slate-500 block">Debt vs Revenue</span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Weekly Squad Wage Bill</span>
                      <strong className="text-slate-200 font-bold">{formatMoney(activeClubFfp.weeklyWageBill)}/wk</strong>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Annual Wage Outlay</span>
                      <strong className="text-slate-200 font-bold">{formatMoney(activeClubFfp.annualWageBill)}/yr</strong>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Club Debt</span>
                      <strong className="text-red-300 font-bold">{formatMoney(activeClubFfp.debtLevel)}</strong>
                    </div>
                  </div>

                  {/* Visual Debt Progress Bar */}
                  <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-300">Spending vs Allowable Cap</span>
                      <span className={activeClubFfp.debtRatio > 90 ? 'text-red-400' : activeClubFfp.debtRatio > 70 ? 'text-amber-400' : 'text-emerald-400'}>
                        {formatMoney(activeClubFfp.spending)} / {formatMoney(activeClubFfp.allowableCap)} ({activeClubFfp.debtRatio}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          activeClubFfp.debtRatio > 90 ? 'bg-red-500' : activeClubFfp.debtRatio > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, activeClubFfp.debtRatio)}%` }}
                      />
                    </div>
                  </div>

                  {/* Client Contract Restructuring Section (If user represents players at this club) */}
                  {myClientsInClub.length > 0 && (
                    <div className="bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-950 border border-amber-500/40 p-3.5 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5 uppercase">
                          <Handshake className="w-3.5 h-3.5 text-amber-400" />
                          <span>Advise Represented Clients to Restructure ({myClientsInClub.length})</span>
                        </h4>
                        <span className="text-[10px] text-amber-400/80 font-bold">Debt Relief Available</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Restructuring your client's contract reduces club wage debt by 25%, restores FFP compliance, boosts player loyalty, and pays your agency an advisory bonus!
                      </p>

                      <div className="space-y-2">
                        {myClientsInClub.map(client => {
                          const savingsAnnual = Math.round((client.wage || 50000) * 0.25 * 52);
                          return (
                            <div key={client.id} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                              <div>
                                <p className="font-bold text-xs text-white">{client.name} ({client.position})</p>
                                <p className="text-[10px] text-slate-400">
                                  Current: {formatMoney(client.wage)}/wk • Saves Club: <strong className="text-emerald-400">{formatMoney(savingsAnnual)}/yr</strong>
                                </p>
                              </div>
                              <button
                                onClick={() => handleAdviseRestructuring(client)}
                                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow shrink-0"
                              >
                                <Scale className="w-3.5 h-3.5" />
                                <span>Advise Restructure</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Role-Specific Club Governance / Boardroom / Agency Panel */}
                  <div className="space-y-2 pt-1 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        {isFA ? (
                          <span className="text-amber-400 flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5" />
                            <span>Federation Governance & Sanctions Against {activeClub.name}</span>
                          </span>
                        ) : isOwner ? (
                          <span className="text-indigo-400 flex items-center gap-1.5">
                            <Crown className="w-3.5 h-3.5" />
                            <span>{activeClub.id === ownedClub?.id || activeClub.name === ownedClub?.name ? `Presidential Controls: ${activeClub.name}` : `Diplomatic Inter-Club Relations: ${activeClub.name}`}</span>
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>Agency Commercial Actions with {activeClub.name}</span>
                          </span>
                        )}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        {isFA ? 'Regulatory Body' : isOwner ? 'Club Executive' : 'Agency Mandate'}
                      </span>
                    </div>

                    {/* FA PRESIDENT: SANCTIONS & REGULATION */}
                    {isFA && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          onClick={() => handleExecuteSanction('fine')}
                          className="bg-red-600/90 hover:bg-red-500 text-white font-black p-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition shadow"
                          title="Fine club €10,000,000 for FFP overspending"
                        >
                          <Coins className="w-4 h-4 text-amber-300 shrink-0" />
                          <div className="text-left">
                            <span className="block font-bold">Levy €10M Fine</span>
                            <span className="text-[9px] text-red-200 font-normal">Collect into Treasury</span>
                          </div>
                        </button>

                        <button
                          onClick={() => handleExecuteSanction('points_deduction')}
                          className="bg-amber-600/90 hover:bg-amber-500 text-white font-black p-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition shadow"
                          title="Deduct 6 points from league standings"
                        >
                          <TrendingDown className="w-4 h-4 text-amber-200 shrink-0" />
                          <div className="text-left">
                            <span className="block font-bold">Deduct -6 Points</span>
                            <span className="text-[9px] text-amber-200 font-normal">Standings Penalty</span>
                          </div>
                        </button>

                        <button
                          onClick={() => handleExecuteSanction('transfer_ban')}
                          className="bg-slate-950 hover:bg-red-950 text-red-300 border border-red-500/40 font-black p-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition"
                          title="Impose 2-window transfer registration ban"
                        >
                          <Ban className="w-4 h-4 text-red-400 shrink-0" />
                          <div className="text-left">
                            <span className="block font-bold">Transfer Ban</span>
                            <span className="text-[9px] text-slate-400 font-normal">2-Window Registration Freeze</span>
                          </div>
                        </button>

                        <button
                          onClick={() => handleExecuteSanction('wage_slash_order')}
                          className="bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-black p-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition"
                          title="Impose mandatory 15% wage slash to restore solvency"
                        >
                          <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                          <div className="text-left">
                            <span className="block font-bold">15% Wage Slash</span>
                            <span className="text-[9px] text-slate-400 font-normal">Emergency Solvency Order</span>
                          </div>
                        </button>

                        <button
                          onClick={() => handleExecuteSanction('forensic_audit')}
                          className="col-span-1 sm:col-span-2 bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/40 font-black p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer transition"
                          title="Spend €500k Dark Arts funds to leak off-ledger books"
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
                            <div className="text-left">
                              <span className="block font-bold">Leak Forensic Debt Dossier to FIFA</span>
                              <span className="text-[9px] text-indigo-300/80 font-normal">Expose off-ledger bookkeeping (+5 Dark Arts)</span>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-amber-300 bg-indigo-900/80 px-2 py-0.5 rounded">€500K</span>
                        </button>
                      </div>
                    )}

                    {/* CLUB OWNER: BOARDROOM CONTROLS */}
                    {isOwner && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeClub.id === ownedClub?.id || activeClub.name === ownedClub?.name ? (
                          <>
                            <button
                              onClick={() => {
                                if (agency.balance < 1000000) {
                                  alert('Need €1,000,000 personal executive capital to inject into club budget!');
                                  return;
                                }
                                const updatedClub = {
                                  ...activeClub,
                                  transferBudget: (activeClub.transferBudget || 20000000) + 1000000
                                };
                                if (onUpdateClub) onUpdateClub(updatedClub);
                                onUpdateAgency({
                                  ...agency,
                                  balance: agency.balance - 1000000
                                });
                                if (agency.soundEnabled) soundEngine.playCashSound();
                                if (addToast) addToast(`💰 Equity Injected! Added €1,000,000 to ${activeClub.name}'s transfer budget.`, 'success');
                                else alert(`Equity Injected! Added €1,000,000 to ${activeClub.name}'s transfer budget.`);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition shadow"
                            >
                              <Coins className="w-4 h-4 text-amber-300 shrink-0" />
                              <div className="text-left">
                                <span className="block font-bold">Inject €1M Equity</span>
                                <span className="text-[9px] text-indigo-200">Owner Capital Injection</span>
                              </div>
                            </button>

                            <button
                              onClick={() => {
                                if (agency.balance < 500000) {
                                  alert('Need €500,000 for stadium hospitality expansion!');
                                  return;
                                }
                                const updatedClub = {
                                  ...activeClub,
                                  reputation: Math.min(100, activeClub.reputation + 2)
                                };
                                if (onUpdateClub) onUpdateClub(updatedClub);
                                onUpdateAgency({
                                  ...agency,
                                  balance: agency.balance - 500000
                                });
                                if (agency.soundEnabled) soundEngine.playCashSound();
                                if (addToast) addToast(`🏟️ Stadium Expanded! Built 12 new VIP Corporate Luxury Suites for ${activeClub.name}. +2 Club Reputation!`, 'success');
                                else alert('Stadium expanded!');
                              }}
                              className="bg-slate-900 hover:bg-slate-800 border border-indigo-500/40 text-indigo-200 font-bold p-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition"
                            >
                              <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                              <div className="text-left">
                                <span className="block font-bold">Expand Stadium VIP</span>
                                <span className="text-[9px] text-slate-400">€500K (+2 Reputation)</span>
                              </div>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                if (agency.balance < 25000) {
                                  alert('Need €25,000 for VIP Boardroom Hospitality.');
                                  return;
                                }
                                onUpdateAgency({
                                  ...agency,
                                  balance: agency.balance - 25000
                                });
                                if (agency.soundEnabled) soundEngine.playCashSound();
                                if (addToast) addToast(`🍷 Executive Summit: Hosted ${activeClub.name}'s Chairman in your presidential suite. Inter-club relations established!`, 'success');
                                else alert('Executive Summit hosted!');
                              }}
                              className="bg-slate-900 hover:bg-slate-800 border border-indigo-500/40 text-indigo-200 font-bold p-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition"
                            >
                              <Handshake className="w-4 h-4 text-indigo-400 shrink-0" />
                              <div className="text-left">
                                <span className="block font-bold">Host Boardroom Summit</span>
                                <span className="text-[9px] text-slate-400">€25K VIP Hospitality</span>
                              </div>
                            </button>

                            <button
                              onClick={() => {
                                if (agency.balance < 10000) {
                                  alert('Need €10,000 for comprehensive scouting report.');
                                  return;
                                }
                                onUpdateAgency({
                                  ...agency,
                                  balance: agency.balance - 10000
                                });
                                if (agency.soundEnabled) soundEngine.playCashSound();
                                if (addToast) addToast(`🕵️ Tactical Dossier: Chief scout delivered detailed tactical report on ${activeClub.name}'s tactical setups & wage structure.`, 'info');
                                else alert('Tactical Dossier received!');
                              }}
                              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold p-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition"
                            >
                              <Search className="w-4 h-4 text-cyan-400 shrink-0" />
                              <div className="text-left">
                                <span className="block font-bold">Tactical Scouting Dossier</span>
                                <span className="text-[9px] text-slate-400">€10K Deep Analysis</span>
                              </div>
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* FOOTBALL AGENT: COMMERCIAL RELATIONS */}
                    {isAgent && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            if (agency.balance < 15000) {
                              alert('Need €15,000 to place a full-time scout at this club.');
                              return;
                            }
                            onUpdateAgency({
                              ...agency,
                              balance: agency.balance - 15000
                            });
                            if (agency.soundEnabled) soundEngine.playCashSound();
                            if (addToast) addToast(`🕵️ Scout Embedded: Dedicated talent spotter deployed at ${activeClub.name}'s youth academy!`, 'success');
                            else alert('Scout embedded!');
                          }}
                          className="bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-200 font-bold p-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition"
                        >
                          <Search className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="text-left">
                            <span className="block font-bold">Embed Talent Scout</span>
                            <span className="text-[9px] text-slate-400">€15K Academy Wire</span>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            if (addToast) addToast(`💼 Pitch Sent: Dispatched your agency's complete portfolio to ${activeClub.name}'s Sporting Director!`, 'info');
                            else alert('Pitch Sent!');
                          }}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold p-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition"
                        >
                          <Send className="w-4 h-4 text-purple-400 shrink-0" />
                          <div className="text-left">
                            <span className="block font-bold">Pitch Roster Portfolio</span>
                            <span className="text-[9px] text-slate-400">Direct to Director</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW 2: ROSTER SEARCH & PLAYER LIST */}
              {clubViewMode === 'roster' && (
                <div className="space-y-3">
                  {/* Roster Search Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Active Roster ({clubPlayers.length} players)</span>
                    </h4>
                    <div className="relative w-44">
                      <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search player..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-2 py-1 text-[11px] text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Player Roster Cards */}
                  <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                    {filteredPlayers.map(player => {
                      const isSelected = selectedPlayer?.id === player.id;
                      return (
                        <div
                          key={player.id}
                          onClick={() => setSelectedPlayer(player)}
                          className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-slate-800 border-sky-400 text-white shadow-md'
                              : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 w-8 text-center">
                              {player.position}
                            </span>
                            <div>
                              <p className="font-bold text-xs flex items-center gap-1.5">
                                <span>{player.name}</span>
                                {player.isMyClient && (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1 rounded font-extrabold">
                                    CLIENT
                                  </span>
                                )}
                                {player.isAutoYouthPromoted && (
                                  <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-1 rounded font-semibold">
                                    YOUTH
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Age {player.age} • Rating {player.rating} • Agency: {player.agencyName || 'Unrepresented'}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-extrabold text-xs text-amber-300">{formatMoney(player.value)}</p>
                            <p className="text-[9px] text-slate-400">{formatMoney(player.wage)}/wk</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select a club from the league table to inspect spending, FFP status, and squad roster.
            </div>
          )}
        </div>

        {/* Col 3: Player Deep Inspector Card & Contextual Actions (3 cols) */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          {selectedPlayer ? (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-500 text-slate-950">
                    {selectedPlayer.position}
                  </span>
                  <span className="text-xs font-extrabold text-amber-400">
                    OVR {selectedPlayer.rating} / POT {selectedPlayer.potential}
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-base text-white flex items-center gap-2">
                    <span>{selectedPlayer.flag}</span>
                    <span>{selectedPlayer.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedPlayer.age} yrs • {selectedPlayer.nationality} • {selectedPlayer.clubName}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Market Value</span>
                    <strong className="text-emerald-400">{formatMoney(selectedPlayer.value)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Weekly Wage</span>
                    <strong className="text-slate-200">{formatMoney(selectedPlayer.wage)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Agency</span>
                    <strong className="text-purple-300">{selectedPlayer.agencyName || 'Unrepresented'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Loyalty</span>
                    <strong className={(selectedPlayer.loyalty ?? 80) < 40 ? 'text-red-400' : 'text-emerald-400'}>
                      {selectedPlayer.loyalty ?? 80}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* Dynamic Valuation Factor Breakdown */}
              {(() => {
                const valData = calculateDynamicValuation(selectedPlayer, activeClub, undefined, agency);
                return (
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-[11px] space-y-2">
                    <p className="font-bold text-xs text-white flex items-center justify-between">
                      <span>Dynamic Valuation Engine:</span>
                      <strong className="text-amber-300">{formatMoney(valData.finalValuation)}</strong>
                    </p>
                    <div className="space-y-1 text-[10px] text-slate-400">
                      {valData.breakdown.map((b, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span>{b.factor}</span>
                          <span className="font-mono text-emerald-400">x{b.multiplier.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Contextual Action Buttons based on Active Persona Role */}
              <div className="space-y-2.5 pt-2.5 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] uppercase font-black tracking-wider flex items-center gap-1.5 text-slate-300">
                    {isFA ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5" />
                        <span>Federation Executive Directives</span>
                      </span>
                    ) : isOwner ? (
                      <span className="text-indigo-400 flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5" />
                        <span>Presidential Boardroom Actions</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Agency Commercial Operations</span>
                      </span>
                    )}
                  </h4>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-slate-800 text-slate-400">
                    {isFA ? 'FA President' : isOwner ? 'Club Owner' : 'Agent'}
                  </span>
                </div>

                {/* ROLE 1: FEDERATION PRESIDENT SUITE */}
                {isFA && (
                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      onClick={() => {
                        const res = executeNationalSquadCallUp(selectedPlayer, agency);
                        if (res.updatedPlayer) {
                          onUpdatePlayer(res.updatedPlayer);
                          setSelectedPlayer(res.updatedPlayer);
                        }
                        onUpdateAgency(res.updatedAgency);
                        if (agency.soundEnabled) soundEngine.playCashSound();
                        confetti({ particleCount: 50, spread: 70 });
                        if (addToast) addToast(res.message, res.type);
                        else alert(res.message);
                      }}
                      className="w-full bg-amber-600/90 hover:bg-amber-500 text-white font-bold py-2 px-2.5 rounded-xl text-xs flex items-center justify-between gap-2 transition cursor-pointer shadow"
                    >
                      <div className="flex items-center gap-2">
                        <Flag className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                        <span className="text-left font-bold">Summon to Senior National Squad</span>
                      </div>
                      <span className="text-[10px] bg-amber-700/80 px-1.5 py-0.5 rounded font-mono">+15 Morale</span>
                    </button>

                    <button
                      onClick={() => {
                        const res = executeWorkPermitFastTrack(selectedPlayer, agency);
                        if (res.updatedPlayer) {
                          onUpdatePlayer(res.updatedPlayer);
                          setSelectedPlayer(res.updatedPlayer);
                        }
                        onUpdateAgency(res.updatedAgency);
                        if (agency.soundEnabled) soundEngine.playCashSound();
                        if (addToast) addToast(res.message, res.type);
                        else alert(res.message);
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-200 font-bold py-2 px-2.5 rounded-xl text-xs flex items-center justify-between gap-2 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <FileBadge className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-left">Expedite Talent Visa & Clearance</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">+10% Value</span>
                    </button>

                    <button
                      onClick={() => {
                        const res = executeAntiDopingAudit(selectedPlayer, agency);
                        if (res.updatedPlayer) {
                          onUpdatePlayer(res.updatedPlayer);
                          setSelectedPlayer(res.updatedPlayer);
                        }
                        onUpdateAgency(res.updatedAgency);
                        if (agency.soundEnabled) soundEngine.playCashSound();
                        if (addToast) addToast(res.message, res.type);
                        else alert(res.message);
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold py-2 px-2.5 rounded-xl text-xs flex items-center justify-between gap-2 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="text-left">Anti-Doping & Integrity Blood Audit</span>
                      </div>
                      <span className="text-[10px] text-cyan-300 font-mono">Screening</span>
                    </button>

                    <button
                      onClick={() => {
                        const res = executeDisciplinaryCitation(selectedPlayer, agency);
                        if (res.updatedPlayer) {
                          onUpdatePlayer(res.updatedPlayer);
                          setSelectedPlayer(res.updatedPlayer);
                        }
                        onUpdateAgency(res.updatedAgency);
                        if (addToast) addToast(res.message, res.type);
                        else alert(res.message);
                      }}
                      className="w-full bg-slate-900 hover:bg-red-950/60 border border-red-500/30 text-red-200 font-bold py-2 px-2.5 rounded-xl text-xs flex items-center justify-between gap-2 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="text-left">Issue Disciplinary Citation</span>
                      </div>
                      <span className="text-[10px] text-red-300 font-mono">+4% FA Power</span>
                    </button>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => {
                          const res = executePresidentialMeritMedal(selectedPlayer, agency);
                          if (res.updatedPlayer) {
                            onUpdatePlayer(res.updatedPlayer);
                            setSelectedPlayer(res.updatedPlayer);
                          }
                          onUpdateAgency(res.updatedAgency);
                          if (res.type === 'success') {
                            if (agency.soundEnabled) soundEngine.playCashSound();
                            confetti({ particleCount: 60, spread: 80 });
                          }
                          if (addToast) addToast(res.message, res.type);
                          else alert(res.message);
                        }}
                        className="bg-amber-950/70 hover:bg-amber-900 border border-amber-500/50 text-amber-200 font-bold py-2 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Fair Play Medal (€10k)</span>
                      </button>

                      <button
                        onClick={() => {
                          const res = executeGrassrootsAmbassador(selectedPlayer, agency);
                          if (res.updatedPlayer) {
                            onUpdatePlayer(res.updatedPlayer);
                            setSelectedPlayer(res.updatedPlayer);
                          }
                          onUpdateAgency(res.updatedAgency);
                          if (agency.soundEnabled) soundEngine.playCashSound();
                          if (addToast) addToast(res.message, res.type);
                          else alert(res.message);
                        }}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold py-2 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <HeartHandshake className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Youth Ambassador</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ROLE 2: CLUB PRESIDENT / OWNER SUITE */}
                {isOwner && (
                  <div className="grid grid-cols-1 gap-1.5">
                    {/* Check if player belongs to owner's club */}
                    {Boolean(ownedClub && (selectedPlayer.clubId === ownedClub.id || selectedPlayer.clubName === ownedClub.name)) ? (
                      <>
                        <div className="bg-indigo-950/50 border border-indigo-500/30 p-2 rounded-lg text-[10px] text-indigo-300 font-bold flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                          <span>Player Roster: {ownedClub?.name} (Your Club)</span>
                        </div>

                        <button
                          onClick={() => {
                            const res = executeClubContractRenewal(selectedPlayer, agency);
                            if (res.updatedPlayer) {
                              onUpdatePlayer(res.updatedPlayer);
                              setSelectedPlayer(res.updatedPlayer);
                            }
                            onUpdateAgency(res.updatedAgency);
                            if (res.type === 'success') {
                              if (agency.soundEnabled) soundEngine.playCashSound();
                              confetti({ particleCount: 70, spread: 70 });
                            }
                            if (addToast) addToast(res.message, res.type);
                            else alert(res.message);
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-2.5 rounded-xl text-xs flex items-center justify-between gap-2 transition cursor-pointer shadow"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
                            <span className="text-left font-bold">Presidential Renewal (+2 Yrs)</span>
                          </div>
                          <span className="text-[10px] bg-indigo-800 px-1.5 py-0.5 rounded font-mono">€100k Bonus</span>
                        </button>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => {
                              const res = executeAwardCaptaincy(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              onUpdateAgency(res.updatedAgency);
                              if (agency.soundEnabled) soundEngine.playCashSound();
                              if (addToast) addToast(res.message, res.type);
                              else alert(res.message);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold py-2 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            <span>Award Captaincy</span>
                          </button>

                          <button
                            onClick={() => {
                              const res = executeBoardroomPepTalk(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                              else alert(res.message);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold py-2 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Boardroom Talk</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => {
                              const res = executeSwissMedicalClinic(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              onUpdateAgency(res.updatedAgency);
                              if (res.type === 'success' && agency.soundEnabled) soundEngine.playCashSound();
                              if (addToast) addToast(res.message, res.type);
                              else alert(res.message);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold py-2 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Zurich Clinic (€25k)</span>
                          </button>

                          <button
                            onClick={() => {
                              const res = executePresidentialFine(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                              else alert(res.message);
                            }}
                            className="bg-slate-900 hover:bg-red-950/60 border border-red-500/30 text-red-300 font-bold py-2 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5 text-red-400" />
                            <span>Fine (2 Wks Wages)</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onOpenTransferModal(selectedPlayer)}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow"
                        >
                          <DollarSign className="w-4 h-4" />
                          <span>Submit Presidential Transfer Bid to Chairman</span>
                        </button>

                        {activeClub && (
                          <button
                            onClick={() => {
                              const res = executeInviteRivalChairman(activeClub, selectedPlayer, agency);
                              onUpdateAgency(res.updatedAgency);
                              if (res.type === 'success' && agency.soundEnabled) soundEngine.playCashSound();
                              if (addToast) addToast(res.message, res.type);
                              else alert(res.message);
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 border border-indigo-500/40 text-indigo-200 font-bold py-2 px-2.5 rounded-xl text-xs flex items-center justify-between gap-2 transition cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Handshake className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="text-left">Invite {activeClub.name} Chairman to VIP Suite</span>
                            </div>
                            <span className="text-[10px] text-amber-300 font-mono">€15k (15% Discount)</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* ROLE 3: FOOTBALL AGENT SUITE */}
                {isAgent && (
                  <div className="grid grid-cols-1 gap-1.5">
                    {selectedPlayer.isMyClient ? (
                      <>
                        <div className="bg-emerald-950/50 border border-emerald-500/30 p-2 rounded-lg text-[10px] text-emerald-300 font-bold flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Represented Client in Your Agency</span>
                        </div>

                        <button
                          onClick={() => {
                            const res = executeDemandWageRenegotiation(selectedPlayer, agency);
                            if (res.updatedPlayer) {
                              onUpdatePlayer(res.updatedPlayer);
                              setSelectedPlayer(res.updatedPlayer);
                            }
                            onUpdateAgency(res.updatedAgency);
                            if (res.type === 'success') {
                              if (agency.soundEnabled) soundEngine.playCashSound();
                              confetti({ particleCount: 60, spread: 70 });
                            }
                            if (addToast) addToast(res.message, res.type);
                            else alert(res.message);
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-2.5 rounded-xl text-xs flex items-center justify-between gap-2 transition cursor-pointer shadow"
                        >
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-200" />
                            <span className="text-left font-bold">Demand Wage Renegotiation (+30%)</span>
                          </div>
                          <span className="text-[10px] bg-emerald-800 px-1.5 py-0.5 rounded font-mono">+10% Cut</span>
                        </button>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => {
                              const res = executeCommercialBootDeal(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              onUpdateAgency(res.updatedAgency);
                              if (agency.soundEnabled) soundEngine.playCashSound();
                              if (addToast) addToast(res.message, res.type);
                              else alert(res.message);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold py-2 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Boot Deal (+€50k)</span>
                          </button>

                          <button
                            onClick={() => handleRebuildLoyalty(selectedPlayer)}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold py-2 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Award className="w-3.5 h-3.5 text-emerald-400" />
                            <span>VIP Dinner (€20k)</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => {
                              const res = executeTabloidLeak(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                              else alert(res.message);
                            }}
                            className="bg-slate-900 hover:bg-red-950/60 border border-red-500/30 text-red-300 font-bold py-2 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Megaphone className="w-3.5 h-3.5 text-red-400" />
                            <span>Tabloid Leak (-25%)</span>
                          </button>

                          <button
                            onClick={() => onOpenTransferModal(selectedPlayer)}
                            className="bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 font-bold py-2 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Transfer Move</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handlePoachOrRepresentPlayer(selectedPlayer)}
                          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow"
                        >
                          <Zap className="w-4 h-4 text-amber-300" />
                          <span>Pitch & Sign Agency Representation</span>
                        </button>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => {
                              const res = executeTapUpEntourage(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              onUpdateAgency(res.updatedAgency);
                              if (agency.soundEnabled) soundEngine.playCashSound();
                              if (addToast) addToast(res.message, res.type);
                              else alert(res.message);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-purple-500/40 text-purple-300 font-bold py-2 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5 text-purple-400" />
                            <span>Tap-Up Entourage (€25k)</span>
                          </button>

                          <button
                            onClick={() => onOpenTransferModal(selectedPlayer)}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold py-2 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Broker 3rd-Party Deal</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs">
              Click any player from the active roster to view full player card, dynamic valuation breakdown, and contextual actions.
            </div>
          )}
        </div>

      </div>

      {pitchingPlayer && (
        <PlayerPitchNegotiationModal
          player={pitchingPlayer}
          agency={agency}
          onClose={() => setPitchingPlayer(null)}
          onSuccessSign={(signedPlayer, updatedAgency) => {
            if (signedPlayer.isMyClient) {
              onUpdatePlayer(signedPlayer);
              if (selectedPlayer?.id === signedPlayer.id) setSelectedPlayer(signedPlayer);
            }
            onUpdateAgency(updatedAgency);
            setPitchingPlayer(null);
          }}
        />
      )}
    </div>
  );
};
