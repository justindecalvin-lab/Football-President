import React, { useState } from 'react';
import { Club, Player, AgencyState } from '../types';
import { formatMoney, calculateDynamicValuation } from '../utils/gameEngine';
import { getClubFfpDetails, executeClubSanctions, restructureClientContract } from '../utils/ffpEngine';
import { soundEngine } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import { PlayerPitchNegotiationModal } from './PlayerPitchNegotiationModal';
import { 
  X, 
  Building2, 
  Users, 
  Trophy, 
  DollarSign, 
  Search, 
  Sparkles, 
  Award, 
  ShieldAlert, 
  UserCheck, 
  Zap, 
  Briefcase, 
  Activity,
  ChevronRight,
  Info,
  Scale,
  Ban,
  TrendingDown,
  TrendingUp,
  Coins,
  Shield,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Handshake,
  PieChart,
  Layers,
  Landmark
} from 'lucide-react';

interface ClubDetailModalProps {
  club: Club;
  players: Player[];
  agency: AgencyState;
  onClose: () => void;
  onUpdatePlayer: (player: Player) => void;
  onUpdateAgency: (agency: AgencyState) => void;
  onOpenTransferModal: (player: Player) => void;
  onUpdateClub?: (club: Club) => void;
  addToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ClubDetailModal: React.FC<ClubDetailModalProps> = ({
  club,
  players,
  agency,
  onClose,
  onUpdatePlayer,
  onUpdateAgency,
  onOpenTransferModal,
  onUpdateClub,
  addToast
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [pitchingPlayer, setPitchingPlayer] = useState<Player | null>(null);
  const [positionFilter, setPositionFilter] = useState<'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'roster' | 'finances' | 'staff'>('finances');

  // Filter players for this club
  const clubPlayers = players.filter(p => p.clubId === club.id);
  const myClientsInClub = clubPlayers.filter(p => p.isMyClient);

  // FFP Details calculation
  const ffp = getClubFfpDetails(club, players, agency.currentWeek);

  const filteredPlayers = clubPlayers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.position.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (positionFilter === 'GK') return p.position === 'GK';
    if (positionFilter === 'DEF') return ['CB', 'LB', 'RB'].includes(p.position);
    if (positionFilter === 'MID') return ['CDM', 'CM', 'CAM'].includes(p.position);
    if (positionFilter === 'FWD') return ['LW', 'RW', 'ST'].includes(p.position);

    return true;
  });

  // Handle Governance Action on Club
  const handleExecuteSanction = (sanctionType: 'fine' | 'points_deduction' | 'transfer_ban' | 'forensic_audit' | 'wage_slash_order') => {
    try {
      const { updatedClub, updatedAgency, summaryMessage } = executeClubSanctions(club, sanctionType, agency);
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
    const { updatedPlayer, updatedClub, updatedAgency, savingsAnnual, bonusEarned } = restructureClientContract(client, club, agency);
    onUpdatePlayer(updatedPlayer);
    if (onUpdateClub) onUpdateClub(updatedClub);
    onUpdateAgency(updatedAgency);
    if (agency.soundEnabled) soundEngine.playCashSound();
    confetti({ particleCount: 70, spread: 80 });
    const msg = `🤝 Restructured Contract: ${client.name} agreed to wage restructuring, saving ${club.name} ${formatMoney(savingsAnnual)}/yr in debt! +${formatMoney(bonusEarned)} Advisory Commission Earned!`;
    if (addToast) {
      addToast(msg, 'success');
    } else {
      alert(msg);
    }
  };

  const handlePoachOrRepresent = (p: Player) => {
    if (p.isMyClient) return;
    setPitchingPlayer(p);
  };

  const handleHostDinner = (p: Player) => {
    if (agency.balance < 20000) {
      alert('You need €20,000 for a client loyalty dinner!');
      return;
    }
    const updated: Player = { ...p, loyalty: Math.min(100, (p.loyalty ?? 80) + 20) };
    onUpdatePlayer(updated);
    if (selectedPlayer?.id === p.id) setSelectedPlayer(updated);
    onUpdateAgency({ ...agency, balance: agency.balance - 20000 });
    alert(`Loyalty dinner complete! ${p.name}'s loyalty is now ${updated.loyalty}%.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Modal Header Bar */}
        <div className="bg-slate-950 border-b border-slate-800 p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={`w-6 h-6 rounded-full ${club.logoColor} shadow-lg ring-2 ring-slate-700`} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">{club.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-black border border-slate-700">
                  {club.shortName}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  {club.league} (Tier {club.tier || 1})
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                  ffp.status === 'In FFP Breach' 
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' 
                    : ffp.status === 'At Risk' 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                }`}>
                  {ffp.status === 'Compliant' ? 'FFP COMPLIANT' : ffp.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Continent: {club.continent} • Reputation: {club.reputation}/100 • Stadium: {(club.stadiumCapacity || 45000).toLocaleString()} seats • Spent: {formatMoney(ffp.spending)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Club Quick Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/50 border-b border-slate-800/80 text-xs">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Transfer Budget</span>
            <strong className="text-emerald-400 text-sm font-black">{formatMoney(club.transferBudget)}</strong>
          </div>

          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Season Spent</span>
            <strong className="text-amber-300 text-sm font-bold font-mono">{formatMoney(ffp.spending)}</strong>
          </div>

          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Debt vs Cap ({ffp.debtRatio}%)</span>
            <strong className={`text-xs font-bold ${ffp.debtRatio > 90 ? 'text-red-400' : ffp.debtRatio > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {formatMoney(ffp.debtLevel)} / {formatMoney(ffp.allowableCap)}
            </strong>
          </div>

          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Head Coach</span>
            <strong className="text-purple-300 text-xs font-bold">{club.headCoach || club.managerName}</strong>
            <span className="text-[10px] text-slate-400 block">Tactics: {club.managerTactics || 'Attacking'}</span>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 py-2 border-b border-slate-800 bg-slate-950/80 text-xs">
          <button
            onClick={() => setActiveTab('finances')}
            className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'finances'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Financial Fair Play & Actions</span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Squad Roster ({clubPlayers.length} Players)</span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Club Staff & Management ({club.staffList?.length || 5})</span>
          </button>
        </div>

        {/* Modal Body Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: FINANCIAL FAIR PLAY & SPENDING GOVERNANCE */}
          {activeTab === 'finances' && (
            <div className="space-y-4">
              {/* Compliance Status Banner */}
              {!ffp.isWithinFfp ? (
                <div className="bg-red-950/50 border-2 border-red-500/70 p-4 rounded-xl space-y-2 shadow-xl animate-pulse">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-black text-red-100 uppercase tracking-wide">
                        CRITICAL FFP OVERSPEND ALERT: {club.name}
                      </h3>
                      <p className="text-xs text-red-200/90 mt-1 leading-relaxed">
                        {ffp.alertMessage || `${club.name} is in critical breach of Financial Fair Play regulations. Total spending of ${formatMoney(ffp.spending)} exceeds allowable limit ${formatMoney(ffp.allowableCap)} by ${formatMoney(Math.max(0, ffp.spending - ffp.allowableCap))}.`}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-950/40 border border-emerald-500/50 p-4 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-black text-emerald-200">
                      FINANCIAL FAIR PLAY COMPLIANT (Debt Ratio: {ffp.debtRatio}%)
                    </h3>
                    <p className="text-xs text-emerald-300/80 mt-0.5">
                      {club.name} is operating within financial solvency rules. Next mandatory federation audit takes place in Week 38.
                    </p>
                  </div>
                </div>
              )}

              {/* 4 Core Financial Fair Play (FFP) Determinant Factors Card */}
              {ffp.factors && (
                <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-3.5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="w-5 h-5 text-indigo-400" />
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-wide">
                          4 Core FFP Determinant Factors Analysis
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          Comprehensive evaluation of financial governance, spending habits, revenue power & solvency
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Health</span>
                      <span className={`text-sm font-black font-mono ${
                        ffp.factors.overallHealthScore >= 75 ? 'text-emerald-400' :
                        ffp.factors.overallHealthScore >= 50 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {ffp.factors.overallHealthScore}/100
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Factor 1: Market Dealing */}
                    <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs font-bold text-slate-200">1. Market Dealing</span>
                        </div>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                          ffp.factors.marketDealing.score >= 80 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                          ffp.factors.marketDealing.score >= 50 ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                          'bg-red-950 text-red-300 border border-red-500/40'
                        }`}>
                          {ffp.factors.marketDealing.strategy} ({ffp.factors.marketDealing.score}/100)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        {ffp.factors.marketDealing.description}
                      </p>
                      <div className="text-[10px] text-amber-300/90 font-mono">
                        Impact: {ffp.factors.marketDealing.financialImpact}
                      </div>
                    </div>

                    {/* Factor 2: Management & Governance */}
                    <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Landmark className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-xs font-bold text-slate-200">2. Management Style</span>
                        </div>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                          ffp.factors.management.score >= 80 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                          ffp.factors.management.score >= 50 ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                          'bg-red-950 text-red-300 border border-red-500/40'
                        }`}>
                          {ffp.factors.management.governanceStyle} ({ffp.factors.management.score}/100)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        {ffp.factors.management.description}
                      </p>
                      <div className="text-[10px] text-blue-300/90 font-mono">
                        Impact: {ffp.factors.management.financialImpact}
                      </div>
                    </div>

                    {/* Factor 3: Income & Revenue Stream */}
                    <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-xs font-bold text-slate-200">3. Income & Revenue</span>
                        </div>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                          ffp.factors.income.score >= 80 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                          ffp.factors.income.score >= 50 ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                          'bg-red-950 text-red-300 border border-red-500/40'
                        }`}>
                          Rating {ffp.factors.income.score}/100 • {formatMoney(ffp.factors.income.annualRevenue)}/yr
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        {ffp.factors.income.description}
                      </p>
                      <div className="text-[10px] text-emerald-300/90 font-mono">
                        Tier: {ffp.factors.income.commercialTier}
                      </div>
                    </div>

                    {/* Factor 4: Book Balancing Competence */}
                    <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-xs font-bold text-slate-200">4. Book Balancing</span>
                        </div>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                          ffp.factors.bookBalancing.score >= 80 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                          ffp.factors.bookBalancing.score >= 50 ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                          'bg-red-950 text-red-300 border border-red-500/40'
                        }`}>
                          {ffp.factors.bookBalancing.isBalanced ? 'Solvent Balance Sheet' : 'Unhedged Debt Drag'} ({ffp.factors.bookBalancing.score}/100)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        {ffp.factors.bookBalancing.description}
                      </p>
                      <div className="text-[10px] text-purple-300/90 font-mono">
                        Fiscal Discipline: {ffp.factors.bookBalancing.financialImpact}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Outlay Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Season Spending</span>
                  <strong className="text-white text-base font-black font-mono block">{formatMoney(ffp.spending)}</strong>
                  <span className="text-[10px] text-slate-500">Transfers + Wages combined</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Allowable FFP Cap</span>
                  <strong className="text-emerald-400 text-base font-black font-mono block">{formatMoney(ffp.allowableCap)}</strong>
                  <span className="text-[10px] text-slate-500">Maximum permissible expenditure</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Debt Level</span>
                  <strong className="text-red-400 text-base font-black font-mono block">{formatMoney(ffp.debtLevel)}</strong>
                  <span className="text-[10px] text-slate-500">Accumulated operational deficit</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Weekly Squad Payroll</span>
                  <strong className="text-slate-200 text-sm font-bold block">{formatMoney(ffp.weeklyWageBill)}/wk</strong>
                  <span className="text-[10px] text-slate-500">{clubPlayers.length} contracted players</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Annualized Payroll</span>
                  <strong className="text-slate-200 text-sm font-bold block">{formatMoney(ffp.annualWageBill)}/yr</strong>
                  <span className="text-[10px] text-slate-500">52-week payroll commitment</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Transfer Window Spending</span>
                  <strong className="text-amber-300 text-sm font-bold block">{formatMoney(ffp.transferSpending)}</strong>
                  <span className="text-[10px] text-slate-500">Acquisition fees disbursed</span>
                </div>
              </div>

              {/* Visual Spending Gauge */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">Expenditure vs Sustainability Threshold</span>
                  <span className={ffp.debtRatio > 90 ? 'text-red-400' : ffp.debtRatio > 70 ? 'text-amber-400' : 'text-emerald-400'}>
                    {formatMoney(ffp.spending)} / {formatMoney(ffp.allowableCap)} ({ffp.debtRatio}% Debt Ratio)
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      ffp.debtRatio > 90 ? 'bg-red-500' : ffp.debtRatio > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, ffp.debtRatio)}%` }}
                  />
                </div>
              </div>

              {/* Represented Clients Contract Restructuring */}
              {myClientsInClub.length > 0 && (
                <div className="bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-950 border border-amber-500/40 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-amber-300 flex items-center gap-2 uppercase tracking-wide">
                      <Handshake className="w-4 h-4 text-amber-400" />
                      <span>Advise Represented Clients to Restructure Contracts ({myClientsInClub.length})</span>
                    </h4>
                    <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                      Debt Restructuring Available
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Advise your represented players at {club.name} to defer/restructure wages. This directly reduces club debt by 25%, lowers FFP risk, guarantees player loyalty, and grants your agency an immediate advisory bonus!
                  </p>

                  <div className="space-y-2">
                    {myClientsInClub.map(client => {
                      const savingsAnnual = Math.round((client.wage || 50000) * 0.25 * 52);
                      return (
                        <div key={client.id} className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-white">{client.name}</span>
                              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                {client.position}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Current Wage: {formatMoney(client.wage)}/wk • Saves Club: <strong className="text-emerald-400">{formatMoney(savingsAnnual)}/yr</strong>
                            </p>
                          </div>
                          <button
                            onClick={() => handleAdviseRestructuring(client)}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-2 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow shrink-0"
                          >
                            <Scale className="w-4 h-4" />
                            <span>Advise Restructure</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* List of Governance & Sanction Actions to Take Against Club */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                    <Scale className="w-4 h-4 text-red-400" />
                    <span>Disciplinary & Governance Actions Against {club.name}</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Federation Authority</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleExecuteSanction('fine')}
                    className="bg-red-600/90 hover:bg-red-500 text-white font-black p-3 rounded-xl text-xs flex items-center gap-3 cursor-pointer transition shadow"
                  >
                    <Coins className="w-5 h-5 text-amber-300 shrink-0" />
                    <div className="text-left">
                      <span className="block font-bold">Levy €10,000,000 FFP Fine</span>
                      <span className="text-[10px] text-red-200 font-normal">Extract fine directly into Federation Treasury</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExecuteSanction('points_deduction')}
                    className="bg-amber-600/90 hover:bg-amber-500 text-white font-black p-3 rounded-xl text-xs flex items-center gap-3 cursor-pointer transition shadow"
                  >
                    <TrendingDown className="w-5 h-5 text-amber-200 shrink-0" />
                    <div className="text-left">
                      <span className="block font-bold">Deduct -6 League Points</span>
                      <span className="text-[10px] text-amber-200 font-normal">Official sporting standings penalty</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExecuteSanction('transfer_ban')}
                    className="bg-slate-950 hover:bg-red-950 text-red-300 border border-red-500/40 font-black p-3 rounded-xl text-xs flex items-center gap-3 cursor-pointer transition"
                  >
                    <Ban className="w-5 h-5 text-red-400 shrink-0" />
                    <div className="text-left">
                      <span className="block font-bold">Impose 2-Window Transfer Ban</span>
                      <span className="text-[10px] text-slate-400 font-normal">Freeze player registrations</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExecuteSanction('wage_slash_order')}
                    className="bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-black p-3 rounded-xl text-xs flex items-center gap-3 cursor-pointer transition"
                  >
                    <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="text-left">
                      <span className="block font-bold">Mandatory 15% Squad Wage Slash</span>
                      <span className="text-[10px] text-slate-400 font-normal">Emergency club solvency order</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExecuteSanction('forensic_audit')}
                    className="col-span-1 sm:col-span-2 bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/40 font-black p-3 rounded-xl text-xs flex items-center justify-between gap-3 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-indigo-400 shrink-0" />
                      <div className="text-left">
                        <span className="block font-bold">Leak Whistleblower Forensic Dossier</span>
                        <span className="text-[10px] text-indigo-300 font-normal">Expose shadow accounting to FIFA Ethics Committee (+5 Dark Arts)</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-300 bg-indigo-900/80 px-2.5 py-1 rounded">€500K</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'staff' && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 uppercase tracking-wider">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                <span>Club Executive & Technical Staff</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(club.staffList && club.staffList.length > 0 ? club.staffList : [
                  { id: '1', name: club.headCoach || 'Head Manager', role: 'Head Manager' as const, rating: club.reputation, nationality: 'Local' },
                  { id: '2', name: 'Assistant Coach', role: 'Assistant Manager' as const, rating: Math.max(60, club.reputation - 5), nationality: 'Local' },
                  { id: '3', name: 'Head Scout', role: 'Head Scout' as const, rating: Math.max(65, club.reputation - 3), nationality: 'Local' },
                  { id: '4', name: 'Physical Trainer', role: 'Physical Trainer' as const, rating: Math.max(60, club.reputation - 4), nationality: 'Local' },
                  { id: '5', name: 'Chief Medical Officer', role: 'Chief Medical Officer' as const, rating: Math.max(70, club.reputation - 2), nationality: 'Local' }
                ]).map(staff => (
                  <div key={staff.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {staff.role}
                      </span>
                      <span className="text-xs font-black text-amber-300">
                        RATING {staff.rating}/99
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-white">{staff.name}</h4>
                    <p className="text-xs text-slate-400">Nationality: {staff.nationality}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'roster' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Side: Roster Table & Filters (7 Cols) */}
              <div className="lg:col-span-7 space-y-3">
                {/* Search & Position Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="relative w-full sm:w-48">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search player name..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Position Filter Pills */}
                  <div className="flex items-center gap-1 text-[11px] overflow-x-auto w-full sm:w-auto">
                    {(['ALL', 'GK', 'DEF', 'MID', 'FWD'] as const).map(pos => (
                      <button
                        key={pos}
                        onClick={() => setPositionFilter(pos)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                          positionFilter === pos
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Squad Roster List */}
                <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                  {filteredPlayers.map(p => {
                    const isSelected = selectedPlayer?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlayer(p)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-slate-800 border-sky-400 text-white shadow-lg'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-black px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 w-9 text-center border border-slate-700">
                            {p.position}
                          </span>
                          <div>
                            <p className="font-bold text-xs flex items-center gap-1.5">
                              <span>{p.flag}</span>
                              <span>{p.name}</span>
                              {p.isMyClient && (
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1 rounded font-black">
                                  MY CLIENT
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Age {p.age} • OVR <strong className="text-white">{p.rating}</strong>/POT <strong className="text-emerald-400">{p.potential}</strong> • {p.agencyName || 'Unrepresented'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-black text-xs text-amber-300">{formatMoney(p.value)}</p>
                          <p className="text-[9px] text-slate-400">{formatMoney(p.wage)}/wk</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Side: Detailed Selected Player Card & Contextual Actions (5 Cols) */}
              <div className="lg:col-span-5 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                {selectedPlayer ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-500 text-slate-950 mr-2">
                          {selectedPlayer.position}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          Contract: {selectedPlayer.contractYears} yrs
                        </span>
                      </div>
                      <span className="text-xs font-black text-amber-400">
                        OVR {selectedPlayer.rating} / POT {selectedPlayer.potential}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-black text-lg text-white flex items-center gap-2">
                        <span>{selectedPlayer.flag}</span>
                        <span>{selectedPlayer.name}</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedPlayer.age} yrs • {selectedPlayer.nationality} • {selectedPlayer.clubName}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Market Value</span>
                        <strong className="text-emerald-400">{formatMoney(selectedPlayer.value)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Weekly Salary</span>
                        <strong className="text-slate-200">{formatMoney(selectedPlayer.wage)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Agency Representation</span>
                        <strong className="text-purple-300">{selectedPlayer.agencyName || 'Unrepresented'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Release Clause</span>
                        <strong className="text-amber-300">{formatMoney(selectedPlayer.clauses.releaseClause)}</strong>
                      </div>
                    </div>

                    {/* Contextual Action Buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <h4 className="text-[10px] uppercase font-bold text-slate-400">Contextual Actions</h4>

                      <button
                        onClick={() => {
                          onClose();
                          onOpenTransferModal(selectedPlayer);
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer min-h-[44px]"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Submit Inter-Club Transfer Offer</span>
                      </button>

                      {!selectedPlayer.isMyClient ? (
                        <button
                          onClick={() => handlePoachOrRepresent(selectedPlayer)}
                          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer min-h-[44px]"
                        >
                          <Zap className="w-4 h-4 text-amber-300" />
                          <span>Recruit / Poach Player Client</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleHostDinner(selectedPlayer)}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-slate-700 min-h-[44px]"
                        >
                          <Award className="w-4 h-4 text-emerald-400" />
                          <span>Host Loyalty Dinner (€20,000)</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500 text-xs">
                    Click any player from the roster list to view detailed player attributes and execute contextual actions.
                  </div>
                )}
              </div>

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
