import React, { useState } from 'react';
import { AgencyState, Player, Club, LoanDeal } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { evaluateLoanNegotiation, executeBuybackClause, recallLoaneePlayer, conductLoanMedical, checkLoanSquadRegistration } from '../utils/loanEngine';
import { 
  Repeat, 
  ArrowRightLeft, 
  ShieldCheck, 
  TrendingUp, 
  UserCheck, 
  Coins, 
  Sparkles, 
  Clock, 
  Building, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  Trophy,
  Search,
  Filter,
  DollarSign,
  ChevronRight,
  UserPlus,
  Zap,
  Info,
  Calendar,
  Award,
  BarChart3,
  Flame,
  Handshake,
  XCircle,
  Activity,
  FileCheck,
  X
} from 'lucide-react';

interface LoanManagementViewProps {
  agency: AgencyState;
  players: Player[];
  clubs: Club[];
  onUpdateAgency: (updated: AgencyState) => void;
  onUpdatePlayers: (updated: Player[]) => void;
  onAddToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialSelectedPlayer?: Player | null;
}

export const LoanManagementView: React.FC<LoanManagementViewProps> = ({
  agency,
  players,
  clubs,
  onUpdateAgency,
  onUpdatePlayers,
  onAddToast,
  initialSelectedPlayer
}) => {
  const [activeTab, setActiveTab] = useState<'active_loans' | 'negotiate' | 'buyback_vault' | 'history'>('active_loans');

  // Negotiation Form State
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(initialSelectedPlayer ? initialSelectedPlayer.id : '');
  const [selectedLoaneeClubId, setSelectedLoaneeClubId] = useState<string>('');
  const [loanDurationWeeks, setLoanDurationWeeks] = useState<number>(19);
  const [wageContributionPercent, setWageContributionPercent] = useState<number>(80); // Loanee club pays 80%
  const [loanFee, setLoanFee] = useState<number>(250000);
  const [buybackActive, setBuybackActive] = useState<boolean>(true);
  const [buybackFee, setBuybackFee] = useState<number>(5000000);
  const [buyoutType, setBuyoutType] = useState<'none' | 'optional_buyout' | 'mandatory_buyout'>('none');
  const [buyoutFee, setBuyoutFee] = useState<number>(8000000);
  const [playingTimeGuarantee, setPlayingTimeGuarantee] = useState<'Key Starter' | 'Rotation' | 'Fringe Player'>('Key Starter');
  const [agencyCommissionPercent, setAgencyCommissionPercent] = useState<number>(10);

  // Filters for Active Loans
  const [filterStatus, setFilterStatus] = useState<'all' | 'clients' | 'buyback' | 'mandatory_buyout' | 'optional_buyout' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Pre-select player if passed from outside
  React.useEffect(() => {
    if (initialSelectedPlayer) {
      setSelectedPlayerId(initialSelectedPlayer.id);
      setActiveTab('negotiate');
      // Set default buyback fee based on value
      setBuybackFee(Math.max(3000000, Math.floor(initialSelectedPlayer.value * 1.3)));
      setBuyoutFee(Math.max(4000000, Math.floor(initialSelectedPlayer.value * 1.2)));
    }
  }, [initialSelectedPlayer]);

  const activeDeals = (agency.loanDeals || []).filter(d => d.status === 'active');
  const completedDeals = (agency.loanDeals || []).filter(d => d.status !== 'active');
  const buybackDeals = (agency.loanDeals || []).filter(d => d.buybackClause.active && !d.buybackClause.isExercised);

  const totalRatingGrowth = (agency.loanDeals || []).reduce((acc, d) => acc + (d.ratingGrowthGained || 0), 0);
  const totalLoanFeeIncome = (agency.loanDeals || []).reduce((acc, d) => acc + (d.loanFee || 0), 0);

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);
  const selectedParentClub = selectedPlayer ? clubs.find(c => c.id === selectedPlayer.clubId) || clubs[0] : null;
  const selectedLoaneeClub = clubs.find(c => c.id === selectedLoaneeClubId);

  // Update suggested fees when selected player changes
  const handlePlayerSelect = (pId: string) => {
    setSelectedPlayerId(pId);
    const p = players.find(x => x.id === pId);
    if (p) {
      setBuybackFee(Math.max(2500000, Math.floor(p.value * 1.35)));
      setBuyoutFee(Math.max(3500000, Math.floor(p.value * 1.2)));
      setLoanFee(Math.max(100000, Math.floor(p.value * 0.05)));
    }
  };

  // Pre-flight checks
  const liveMedicalCheck = selectedPlayer ? conductLoanMedical(selectedPlayer) : null;
  const liveRegCheck = (selectedLoaneeClub && selectedPlayer)
    ? checkLoanSquadRegistration(selectedLoaneeClub, selectedPlayer, players, agency.presidency)
    : null;

  // Evaluate proposed deal live
  const liveEvaluation = (selectedPlayer && selectedParentClub && selectedLoaneeClub)
    ? evaluateLoanNegotiation(selectedPlayer, selectedParentClub, selectedLoaneeClub, {
        loanDurationWeeks,
        wageContributionPercent,
        loanFee,
        buybackActive,
        buybackFee,
        optionToBuyActive: buyoutType === 'optional_buyout',
        optionToBuyFee: buyoutFee,
        buyoutType,
        buyoutFee,
        playingTimeGuarantee
      })
    : null;

  // Execute Loan Deal Submission
  const handleExecuteLoanDeal = () => {
    if (!selectedPlayer || !selectedLoaneeClub || !selectedParentClub) {
      onAddToast('Please select both a player and a target loanee club.', 'error');
      return;
    }

    if (selectedParentClub.id === selectedLoaneeClub.id) {
      onAddToast('Target loanee club cannot be the same as parent club.', 'error');
      return;
    }

    // Check Medical & Registration Blocking Issues
    if (liveMedicalCheck && !liveMedicalCheck.passed) {
      onAddToast(`Loan Medical Failed: ${liveMedicalCheck.notes}`, 'error');
      return;
    }

    if (liveRegCheck && !liveRegCheck.eligible) {
      onAddToast(`Squad Registration Blocked: ${liveRegCheck.reason}`, 'error');
      return;
    }

    const evalResult = evaluateLoanNegotiation(selectedPlayer, selectedParentClub, selectedLoaneeClub, {
      loanDurationWeeks,
      wageContributionPercent,
      loanFee,
      buybackActive,
      buybackFee,
      optionToBuyActive: buyoutType === 'optional_buyout',
      optionToBuyFee: buyoutFee,
      buyoutType,
      buyoutFee,
      playingTimeGuarantee
    });

    if (!evalResult.accepted) {
      onAddToast(`Deal Rejected: ${evalResult.message}`, 'error');
      return;
    }

    const commissionEarned = Math.floor(loanFee * (agencyCommissionPercent / 100));

    const newDeal: LoanDeal = {
      id: `loan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      playerId: selectedPlayer.id,
      playerName: selectedPlayer.name,
      playerPosition: selectedPlayer.position,
      playerRating: selectedPlayer.rating,
      playerPotential: selectedPlayer.potential,
      playerAge: selectedPlayer.age,
      parentClubId: selectedParentClub.id,
      parentClubName: selectedParentClub.name,
      loaneeClubId: selectedLoaneeClub.id,
      loaneeClubName: selectedLoaneeClub.name,
      loaneeClubLeague: selectedLoaneeClub.league,
      loanDurationWeeks,
      weeksRemaining: loanDurationWeeks,
      wageContributionPercent,
      weeklyWage: selectedPlayer.wage,
      loanFee,
      buybackClause: {
        active: buybackActive,
        fee: buybackFee,
        isExercised: false
      },
      optionToBuy: {
        active: buyoutType === 'optional_buyout',
        fee: buyoutFee,
        isExercised: false
      },
      buyoutType: buyoutType,
      buyoutFee: buyoutType !== 'none' ? buyoutFee : undefined,
      medicalStatus: liveMedicalCheck?.status || 'passed',
      registrationStatus: liveRegCheck?.eligible ? 'registered' : 'rejected',
      playingTimeGuarantee,
      status: 'active',
      ratingGrowthGained: 0,
      matchAppearances: 0,
      goalsScored: 0,
      assistsCount: 0,
      isPlayerClient: selectedPlayer.isMyClient,
      agencyCommission: commissionEarned,
      dateCreatedWeek: agency.currentWeek,
      dateCreatedSeason: agency.currentSeason
    };

    // Update Player state to reflect on loan
    const updatedPlayers = players.map(p => {
      if (p.id === selectedPlayer.id) {
        return {
          ...p,
          isOnLoan: true,
          clubId: selectedLoaneeClub.id,
          clubName: selectedLoaneeClub.name,
          loanDetails: {
            loanId: newDeal.id,
            loaneeClubId: selectedLoaneeClub.id,
            loaneeClubName: selectedLoaneeClub.name,
            parentClubId: selectedParentClub.id,
            parentClubName: selectedParentClub.name,
            buybackFee: buybackActive ? buybackFee : undefined,
            weeksRemaining: loanDurationWeeks,
            wageContributionPercent,
            loanFee,
            playingTimeGuarantee
          }
        };
      }
      return p;
    });

    const updatedDeals = [newDeal, ...(agency.loanDeals || [])];
    const updatedAgency: AgencyState = {
      ...agency,
      balance: agency.balance + commissionEarned,
      loanDeals: updatedDeals,
      milestones: [
        {
          id: `ms_loan_${Date.now()}`,
          week: agency.currentWeek,
          season: agency.currentSeason,
          title: `Loan Deal Finalized: ${selectedPlayer.name}`,
          description: `Negotiated loan deal sending ${selectedPlayer.name} from ${selectedParentClub.name} to ${selectedLoaneeClub.name} (${loanDurationWeeks} wks, Buy-Back: ${buybackActive ? formatMoney(buybackFee) : 'None'}, Buyout: ${buyoutType !== 'none' ? `${buyoutType === 'mandatory_buyout' ? 'Mandatory' : 'Optional'} (${formatMoney(buyoutFee)})` : 'None'}). Commission earned: ${formatMoney(commissionEarned)}.`,
          type: 'transfer'
        },
        ...agency.milestones
      ]
    };

    onUpdateAgency(updatedAgency);
    onUpdatePlayers(updatedPlayers);
    onAddToast(`🤝 Loan Deal Signed! ${selectedPlayer.name} moved to ${selectedLoaneeClub.name} on loan. +${formatMoney(commissionEarned)} commission!`, 'success');
    setActiveTab('active_loans');
  };

  // Handle Buyback Execution
  const handleTriggerBuyback = (dealId: string) => {
    const result = executeBuybackClause(dealId, agency, players, clubs);
    if (result.success) {
      onUpdateAgency(result.updatedAgency);
      onUpdatePlayers(result.updatedPlayers);
      onAddToast(result.message, 'success');
    } else {
      onAddToast(result.message, 'error');
    }
  };

  // Handle Recall
  const handleTriggerRecall = (dealId: string) => {
    const result = recallLoaneePlayer(dealId, agency, players);
    if (result.success) {
      onUpdateAgency(result.updatedAgency);
      onUpdatePlayers(result.updatedPlayers);
      onAddToast(result.message, 'info');
    } else {
      onAddToast(result.message, 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12 text-slate-100">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-xl border border-emerald-400/40">
              <Repeat className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-white">Loan & Buy-Back Management Studio</h2>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  Youth & Talent Development
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Negotiate strategic loan deals with <strong className="text-emerald-400">buy-back clauses</strong>. Send younger prospects to smaller clubs for guaranteed first-team playing time, accelerate their rating progression, and retain full repurchase options!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTab('negotiate');
            }}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-5 h-5" />
            <span>Negotiate New Loan Deal</span>
          </button>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
              <Repeat className="w-4 h-4 text-emerald-400" />
              <span>Active Loans</span>
            </div>
            <p className="text-xl font-black text-emerald-400">{activeDeals.length} Players</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Out at loanee clubs</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Buy-Back Watchlist</span>
            </div>
            <p className="text-xl font-black text-amber-300">{buybackDeals.length} Clauses</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Locked repurchase rights</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span>Loanee Rating Growth</span>
            </div>
            <p className="text-xl font-black text-sky-400">+{totalRatingGrowth} OVR</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Gained during loan spells</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>Total Loan Fees</span>
            </div>
            <p className="text-xl font-black text-emerald-300">{formatMoney(totalLoanFeeIncome)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Upfront loan revenue</p>
          </div>
        </div>
      </div>

      {/* Primary Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'active_loans', label: `Active Loans (${activeDeals.length})`, icon: Repeat },
          { id: 'negotiate', label: 'Loan Negotiation Studio', icon: Handshake },
          { id: 'buyback_vault', label: `Buy-Back Clause Vault (${buybackDeals.length})`, icon: ShieldCheck },
          { id: 'history', label: `Loan History & Log (${completedDeals.length})`, icon: BarChart3 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap min-h-[44px] ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ACTIVE LOANS HUB */}
      {activeTab === 'active_loans' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              {[
                { id: 'all', label: 'All Active Loans' },
                { id: 'clients', label: 'My Agency Clients' },
                { id: 'mandatory_buyout', label: 'Mandatory Buyouts' },
                { id: 'optional_buyout', label: 'Optional Buyouts' },
                { id: 'buyback', label: 'Has Buy-Back Clause' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    filterStatus === f.id
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search player or club..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Active Loans Cards Grid */}
          {activeDeals.length === 0 ? (
            <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Repeat className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">No Players Currently Out on Loan</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
                  Loan out younger agency clients to smaller clubs to guarantee first-team minutes and accelerate their rating growth with buy-back options.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('negotiate')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Set Up First Loan Deal</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeDeals
                .filter(deal => {
                  if (filterStatus === 'clients') return deal.isPlayerClient;
                  if (filterStatus === 'mandatory_buyout') return deal.buyoutType === 'mandatory_buyout';
                  if (filterStatus === 'optional_buyout') return deal.buyoutType === 'optional_buyout' || deal.optionToBuy?.active;
                  if (filterStatus === 'buyback') return deal.buybackClause.active;
                  return true;
                })
                .filter(deal => {
                  if (!searchTerm) return true;
                  const st = searchTerm.toLowerCase();
                  return deal.playerName.toLowerCase().includes(st) || deal.loaneeClubName.toLowerCase().includes(st) || deal.parentClubName.toLowerCase().includes(st);
                })
                .map(deal => {
                  const progressPct = Math.round(((deal.loanDurationWeeks - deal.weeksRemaining) / deal.loanDurationWeeks) * 100);

                  return (
                    <div
                      key={deal.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition shadow-lg relative overflow-hidden"
                    >
                      {/* Top Row: Player Header & Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center font-black">
                            <span className="text-xs text-emerald-400">{deal.playerPosition}</span>
                            <span className="text-sm text-white">{deal.playerRating}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-base text-white">{deal.playerName}</h4>
                              <span className="text-xs text-slate-400">({deal.playerAge} yrs)</span>
                              {deal.isPlayerClient && (
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-1.5 py-0.2 rounded font-bold">
                                  Client
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>Potential: <strong className="text-emerald-400">{deal.playerPotential}</strong></span>
                              <span>•</span>
                              <span className="text-amber-300 font-semibold">+{deal.ratingGrowthGained} OVR Gained</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          {deal.buybackClause.active && (
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Buy-Back: {formatMoney(deal.buybackClause.fee)}</span>
                            </span>
                          )}
                          {deal.buyoutType === 'mandatory_buyout' && (
                            <span className="bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[10px] px-2 py-0.5 rounded font-bold">
                              Mandatory Buyout: {formatMoney(deal.buyoutFee || 0)}
                            </span>
                          )}
                          {deal.buyoutType === 'optional_buyout' && (
                            <span className="bg-sky-500/10 text-sky-300 border border-sky-500/30 text-[10px] px-2 py-0.5 rounded font-bold">
                              Option to Buy: {formatMoney(deal.buyoutFee || 0)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Medical & Registration Badges */}
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 border ${
                          deal.medicalStatus === 'failed'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : deal.medicalStatus === 'minor_flag'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          <Activity className="w-3 h-3" />
                          <span>Medical: {deal.medicalStatus === 'passed' ? 'Passed' : deal.medicalStatus === 'minor_flag' ? 'Conditioning Flag' : 'Failed'}</span>
                        </span>

                        <span className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 border ${
                          deal.registrationStatus === 'registered'
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          <FileCheck className="w-3 h-3" />
                          <span>{deal.registrationStatus === 'registered' ? 'Registered for Matchplay' : 'Unregistered'}</span>
                        </span>
                      </div>

                      {/* Club Transfer Route */}
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Parent Club</p>
                            <p className="font-bold text-slate-200">{deal.parentClubName}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-center px-2">
                          <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                          <span className="text-[9px] text-emerald-400 font-bold mt-0.5">LOAN</span>
                        </div>

                        <div className="flex items-center gap-2 text-right">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Loanee Club</p>
                            <p className="font-bold text-emerald-400">{deal.loaneeClubName}</p>
                          </div>
                          <Building className="w-4 h-4 text-emerald-400" />
                        </div>
                      </div>

                      {/* Match Performances & Playing Time */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                          <p className="text-[10px] text-slate-500 font-semibold">Appearances</p>
                          <p className="font-bold text-slate-200 text-sm mt-0.5">{deal.matchAppearances} Matches</p>
                        </div>

                        <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                          <p className="text-[10px] text-slate-500 font-semibold">Goals / Assists</p>
                          <p className="font-bold text-emerald-400 text-sm mt-0.5">{deal.goalsScored} G / {deal.assistsCount} A</p>
                        </div>

                        <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                          <p className="text-[10px] text-slate-500 font-semibold">Role Guarantee</p>
                          <span className={`text-[11px] font-bold block mt-0.5 ${
                            deal.playingTimeGuarantee === 'Key Starter' ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {deal.playingTimeGuarantee}
                          </span>
                        </div>
                      </div>

                      {/* Loan Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400 font-medium">Loan Duration Progress</span>
                          <span className="font-bold text-slate-200">{deal.weeksRemaining} Wks Left ({progressPct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 flex items-center gap-2">
                        {deal.buybackClause.active && !deal.buybackClause.isExercised && (
                          <button
                            onClick={() => handleTriggerBuyback(deal.id)}
                            className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[40px]"
                          >
                            <ShieldCheck className="w-4 h-4 text-amber-400" />
                            <span>Exercise Buy-Back ({formatMoney(deal.buybackClause.fee)})</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleTriggerRecall(deal.id)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[40px]"
                        >
                          Recall Player
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LOAN NEGOTIATION STUDIO */}
      {activeTab === 'negotiate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form (8 Cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Handshake className="w-5 h-5 text-emerald-400" />
                <span>Negotiate Strategic Loan Terms</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure duration, wage contribution, playing time guarantees, and buy-back clause parameters.
              </p>
            </div>

            {/* Step 1: Select Player */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
                <span>1. Select Player for Loan</span>
                <span className="text-[11px] text-emerald-400 font-normal">Youngsters (age &le; 23) gain extra XP</span>
              </label>
              <select
                value={selectedPlayerId}
                onChange={e => handlePlayerSelect(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Choose Player --</option>
                <optgroup label="My Agency Clients">
                  {players
                    .filter(p => p.isMyClient && !p.isOnLoan)
                    .map(p => {
                      const isLoanList = p.isLoanListed || p.loanListedByClub;
                      const isTransferList = p.isTransferListed || p.transferListedByClub;
                      const isUnrest = p.unrest && p.unrest.discontentLevel >= 50;
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.position}, OVR: {p.rating}, POT: {p.potential}, Age: {p.age}) - {p.clubName}
                          {isLoanList ? ' [🎯 LOAN LISTED - HIGH ACCEP]' : isTransferList ? ' [🔄 TRANSFER LISTED]' : isUnrest ? ' [⚠️ UNHAPPY/BENCHED]' : ''}
                        </option>
                      );
                    })}
                </optgroup>
                <optgroup label="Other Squad Players">
                  {players
                    .filter(p => !p.isMyClient && !p.isOnLoan && p.age <= 23)
                    .map(p => {
                      const isLoanList = p.isLoanListed || p.loanListedByClub;
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.position}, OVR: {p.rating}, POT: {p.potential}, Age: {p.age}) - {p.clubName}
                          {isLoanList ? ' [🎯 LOAN LISTED]' : ''}
                        </option>
                      );
                    })}
                </optgroup>
              </select>
            </div>

            {/* Step 2: Select Target Loanee Club */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                2. Select Target Loanee Club
              </label>
              <select
                value={selectedLoaneeClubId}
                onChange={e => setSelectedLoaneeClubId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Choose Target Loanee Club --</option>
                {clubs
                  .filter(c => selectedParentClub ? c.id !== selectedParentClub.id : true)
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.league}) - Rep: {c.reputation}/100 - Budget: {formatMoney(c.transferBudget)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Step 3: Loan Duration & Playing Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Loan Duration
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLoanDurationWeeks(19)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      loanDurationWeeks === 19
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    19 Weeks (Half Season)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoanDurationWeeks(38)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      loanDurationWeeks === 38
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    38 Weeks (Full Season)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Playing Time Guarantee
                </label>
                <select
                  value={playingTimeGuarantee}
                  onChange={e => setPlayingTimeGuarantee(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Key Starter">Key Starter (Highest Rating Growth)</option>
                  <option value="Rotation">Rotation (Moderate Growth)</option>
                  <option value="Fringe Player">Fringe Player (Low Growth)</option>
                </select>
              </div>
            </div>

            {/* Step 4: Financial Structure (Wage Split & Upfront Fee) */}
            <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 uppercase tracking-wide">
                  Loanee Club Wage Share: <strong className="text-emerald-400">{wageContributionPercent}%</strong>
                </span>
                <span className="text-slate-400">
                  (Parent pays {100 - wageContributionPercent}%)
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={wageContributionPercent}
                onChange={e => setWageContributionPercent(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />

              <div className="pt-2 flex items-center justify-between gap-4">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide whitespace-nowrap">
                  Upfront Loan Fee (€)
                </label>
                <input
                  type="number"
                  step="50000"
                  value={loanFee}
                  onChange={e => setLoanFee(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 w-44 text-right"
                />
              </div>
            </div>

            {/* Step 5: BUYOUT CLAUSE ARCHITECTURE (Optional vs Mandatory Buyout) */}
            <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-sky-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-sky-400" />
                    <span>Buyout Clause Type</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Option for loanee club to acquire the player during or upon loan completion.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBuyoutType('none')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    buyoutType === 'none'
                      ? 'bg-slate-800 text-white border-slate-600'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
                  }`}
                >
                  No Buyout
                </button>
                <button
                  type="button"
                  onClick={() => setBuyoutType('optional_buyout')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    buyoutType === 'optional_buyout'
                      ? 'bg-sky-600 text-white border-sky-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
                  }`}
                >
                  Optional Buyout
                </button>
                <button
                  type="button"
                  onClick={() => setBuyoutType('mandatory_buyout')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    buyoutType === 'mandatory_buyout'
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
                  }`}
                >
                  Mandatory Buyout
                </button>
              </div>

              {buyoutType !== 'none' && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">
                      {buyoutType === 'mandatory_buyout' ? 'Mandatory Buyout Fee:' : 'Optional Purchase Fee:'}
                    </span>
                    <span className="font-extrabold text-sky-300">{formatMoney(buyoutFee)}</span>
                  </div>

                  <input
                    type="number"
                    step="500000"
                    value={buyoutFee}
                    onChange={e => setBuyoutFee(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-sky-300 focus:outline-none focus:border-sky-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    {buyoutType === 'mandatory_buyout'
                      ? '📌 Mandatory Buyout forces the loanee club to sign the player permanently at loan end.'
                      : '📌 Optional Buyout grants the loanee club first right of refusal to sign permanently.'}
                  </p>
                </div>
              )}
            </div>

            {/* Step 6: BUY-BACK CLAUSE SETUP (Core Highlight Feature) */}
            <div className="bg-gradient-to-r from-amber-950/30 to-slate-950 border border-amber-500/30 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="font-bold text-xs text-amber-300 uppercase tracking-wide">
                      Parent Buy-Back Clause Option
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Retain the contractual option to re-acquire the player at a locked fee.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={buybackActive}
                    onChange={e => setBuybackActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {buybackActive && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Locked Buy-Back Fee:</span>
                    <span className="font-extrabold text-amber-300">{formatMoney(buybackFee)}</span>
                  </div>

                  <input
                    type="number"
                    step="500000"
                    value={buybackFee}
                    onChange={e => setBuybackFee(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    💡 Tip: If set too low, smaller clubs will reject the offer because they want to profit from developing the player.
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleExecuteLoanDeal}
              disabled={!liveEvaluation?.accepted || (liveMedicalCheck && !liveMedicalCheck.passed) || (liveRegCheck && !liveRegCheck.eligible)}
              className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition cursor-pointer min-h-[48px] ${
                liveEvaluation?.accepted && (!liveMedicalCheck || liveMedicalCheck.passed) && (!liveRegCheck || liveRegCheck.eligible)
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20 active:scale-98'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Handshake className="w-5 h-5" />
              <span>Finalize & Sign Loan Deal</span>
            </button>
          </div>

          {/* Right Live AI Evaluation Panel (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Pre-Loan Medical & Federation Registration Audit */}
            {(liveMedicalCheck || liveRegCheck) && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <span>Pre-Flight Medical & Registration Audit</span>
                </h4>

                {liveMedicalCheck && (
                  <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    liveMedicalCheck.status === 'failed'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : liveMedicalCheck.status === 'minor_flag'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  }`}>
                    {liveMedicalCheck.status === 'failed' ? (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    ) : liveMedicalCheck.status === 'minor_flag' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">Medical Examination: {liveMedicalCheck.status.toUpperCase()}</p>
                      <p className="text-[11px] mt-0.5 opacity-90">{liveMedicalCheck.notes}</p>
                    </div>
                  </div>
                )}

                {liveRegCheck && (
                  <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    !liveRegCheck.eligible
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                  }`}>
                    {!liveRegCheck.eligible ? (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <FileCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">Federation Squad Registration</p>
                      <p className="text-[11px] mt-0.5 opacity-90">{liveRegCheck.reason}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Loanee Club AI Evaluation</span>
              </h4>

              {liveEvaluation ? (
                <div className="space-y-4">
                  {/* Score Meter */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2">
                    <p className="text-xs text-slate-400 font-semibold">Deal Approval Probability</p>
                    <div className="text-3xl font-black flex items-center justify-center gap-1">
                      <span className={liveEvaluation.accepted ? 'text-emerald-400' : 'text-amber-400'}>
                        {liveEvaluation.score}%
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          liveEvaluation.accepted ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, liveEvaluation.score)}%` }}
                      />
                    </div>
                  </div>

                  {/* Feedback Message */}
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    liveEvaluation.accepted
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}>
                    {liveEvaluation.message}
                  </div>

                  {/* Suggested Counter-Offer if available */}
                  {liveEvaluation.counterOffer && (
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <p className="font-bold text-amber-400 uppercase text-[10px] tracking-wide">
                        Suggested Club Counter-Offer:
                      </p>
                      <ul className="space-y-1 text-slate-300">
                        {liveEvaluation.counterOffer.wageContributionPercent !== undefined && (
                          <li>• Lower Wage Share to <strong>{liveEvaluation.counterOffer.wageContributionPercent}%</strong></li>
                        )}
                        {liveEvaluation.counterOffer.buybackFee !== undefined && (
                          <li>• Increase Buy-Back Clause to <strong>{formatMoney(liveEvaluation.counterOffer.buybackFee)}</strong></li>
                        )}
                        {liveEvaluation.counterOffer.buyoutFee !== undefined && (
                          <li>• Adjust Buyout Clause to <strong>{formatMoney(liveEvaluation.counterOffer.buyoutFee)}</strong></li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                  <HelpCircle className="w-8 h-8 mx-auto opacity-40" />
                  <p>Select both a player and a loanee club to view live deal evaluation score.</p>
                </div>
              )}
            </div>

            {/* Educational Info Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs text-slate-300">
              <h5 className="font-bold text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-sky-400" />
                <span>Strategic Loan Architecture & Rules</span>
              </h5>
              <ul className="space-y-2 list-disc list-inside text-slate-400">
                <li><strong className="text-slate-200">Loan List Status:</strong> Clubs readily accept loan deals for players officially listed on the loan transfer list.</li>
                <li><strong className="text-slate-200">Mandatory vs Optional Buyout:</strong> Mandatory buyout guarantees future sales revenue, while Optional buyout provides the loanee club trial flexibility.</li>
                <li><strong className="text-slate-200">Squad Registration & Medicals:</strong> Unregistered players or those failing medical fitness examinations cannot participate in official federation matches.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BUY-BACK CLAUSE VAULT */}
      {activeTab === 'buyback_vault' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>Buy-Back Clause Vault</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Track all players under active buy-back clauses across global leagues and execute repurchase options.
              </p>
            </div>
          </div>

          {buybackDeals.length === 0 ? (
            <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
              <ShieldCheck className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-sm font-bold text-white">No Active Buy-Back Clauses Registered</p>
              <p className="text-xs text-slate-500">Negotiate loan deals with buy-back options enabled to populate this vault.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {buybackDeals.map(deal => {
                const targetPlayer = players.find(p => p.id === deal.playerId);
                const currentVal = targetPlayer ? targetPlayer.value : 0;
                const profitMargin = currentVal - deal.buybackClause.fee;

                return (
                  <div
                    key={deal.id}
                    className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-xl relative"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-base text-white">{deal.playerName}</h4>
                        <p className="text-xs text-slate-400">{deal.playerPosition} • OVR: {deal.playerRating} • POT: {deal.playerPotential}</p>
                      </div>
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-1 rounded-full font-bold">
                        Clause Locked
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div>
                        <p className="text-slate-500 font-medium">Locked Buy-Back Price</p>
                        <p className="text-base font-black text-amber-300">{formatMoney(deal.buybackClause.fee)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Current Market Value</p>
                        <p className="text-base font-black text-emerald-400">{formatMoney(currentVal)}</p>
                      </div>
                    </div>

                    {profitMargin > 0 && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-xs text-emerald-300 flex items-center justify-between font-bold">
                        <span>Bargain Margin:</span>
                        <span>+{formatMoney(profitMargin)} Below Market</span>
                      </div>
                    )}

                    <button
                      onClick={() => handleTriggerBuyback(deal.id)}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer min-h-[40px]"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Trigger Buy-Back Re-Acquisition ({formatMoney(deal.buybackClause.fee)})</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LOAN HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>Completed & Recalled Loan Log</span>
          </h3>

          {completedDeals.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No past loan deal records found.</p>
          ) : (
            <div className="divide-y divide-slate-800 text-xs">
              {completedDeals.map(deal => (
                <div key={deal.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-white">{deal.playerName} ({deal.playerPosition})</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {deal.parentClubName} &rarr; {deal.loaneeClubName} • Status: <strong className="text-emerald-400 uppercase">{deal.status}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-emerald-400">+{deal.ratingGrowthGained} OVR Gained</p>
                    <p className="text-slate-400 text-[11px]">{deal.matchAppearances} Apps, {deal.goalsScored} Goals</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function HandshakeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m11 17 2 2a1 1 0 0 0 1.4 0l3.6-3.6" />
      <path d="m14 14 2.5 2.5" />
      <path d="M18 11V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" />
      <path d="M18 17.5a2.5 2.5 0 0 0 5 0V11a2 2 0 0 0-2-2h-3" />
    </svg>
  );
}
