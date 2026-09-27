import React, { useState } from 'react';
import { Club, Player, AgencyState, PresidentialTransferProposal, SportingDirectorProfile } from '../types';
import { formatMoney } from '../utils/gameEngine';
import {
  orderSportingDirectorNegotiate,
  orderSportingDirectorOffload,
  executePresidentialTransferDecision,
  authorizeInternalStaffTransferRequest
} from '../utils/roleInteractionsEngine';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Search,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Send,
  Users,
  Building,
  Check,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BoardMeetingMiniGameModal } from './BoardMeetingMiniGameModal';

interface PresidentialTransfersApprovalsProps {
  club: Club;
  allPlayers: Player[];
  allClubs: Club[];
  agency: AgencyState;
  onUpdateAgency: (agency: AgencyState) => void;
  onUpdateClub: (club: Club) => void;
  onUpdateAllPlayers?: (players: Player[]) => void;
  onUpdateAllClubs?: (clubs: Club[]) => void;
  addToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  boardApprovalRequired?: boolean;
  onToggleBoardApproval?: (enabled: boolean) => void;
}

export const PresidentialTransfersApprovals: React.FC<PresidentialTransfersApprovalsProps> = ({
  club,
  allPlayers,
  allClubs,
  agency,
  onUpdateAgency,
  onUpdateClub,
  onUpdateAllPlayers,
  onUpdateAllClubs,
  addToast,
  boardApprovalRequired,
  onToggleBoardApproval
}) => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'staff_requests' | 'scout_order' | 'squad_offload' | 'tasks'>('approvals');
  const [searchTarget, setSearchTarget] = useState('');
  const [selectedTargetPlayer, setSelectedTargetPlayer] = useState<Player | null>(null);
  const [targetPriceCeiling, setTargetPriceCeiling] = useState<number>(0);
  const [targetWageCeiling, setTargetWageCeiling] = useState<number>(0);
  const [priority, setPriority] = useState<'Urgent Priority' | 'Balanced Strategy' | 'Bargain Hunting'>('Balanced Strategy');

  // Board Approval Mini-Game State
  const [selectedProposalForBoardMeeting, setSelectedProposalForBoardMeeting] = useState<PresidentialTransferProposal | null>(null);

  const isBoardApprovalActive = boardApprovalRequired !== undefined
    ? boardApprovalRequired
    : club.requireBoardApprovalOver50PercentTreasury ?? agency.clubPresidentPowers?.[club.id]?.requireBoardApprovalForMajorTransfers ?? true;

  // Offload Mandate state
  const [selectedOffloadPlayer, setSelectedOffloadPlayer] = useState<Player | null>(null);
  const [offloadMode, setOffloadMode] = useState<'sale' | 'loan'>('sale');
  const [minAskingPrice, setMinAskingPrice] = useState<number>(0);
  const [offloadSellOnClause, setOffloadSellOnClause] = useState<number>(10);
  const [offloadEnableBuyback, setOffloadEnableBuyback] = useState<boolean>(false);
  const [offloadBuybackMultiplier, setOffloadBuybackMultiplier] = useState<number>(1.5);
  const [offloadProhibitRivals, setOffloadProhibitRivals] = useState<boolean>(false);
  const [offloadPerformanceAddons, setOffloadPerformanceAddons] = useState<boolean>(false);
  const [offloadStrategy, setOffloadStrategy] = useState<'Fast Clearance' | 'Competitive Auction' | 'Development Loan'>('Competitive Auction');
  const [offloadMinWageCoverage, setOffloadMinWageCoverage] = useState<number>(100);

  const director: SportingDirectorProfile = club.sportingDirectorProfile || {
    id: 'sd_default',
    name: club.sportingDirector || 'Director of Football',
    avatar: '👔',
    rating: 82,
    scoutingRating: 84,
    tacticalFocus: 'Possession',
    personality: 'Shrewd Operator',
    wage: 28000,
    contractYears: 3,
    dealSuccessBonus: 10
  };

  const pendingProposals = club.pendingPresidentialTransfers || [];
  const activeTasks = club.sportingDirectorTasks || [];
  const staffRequests = (club.internalTransferRequests || []).filter(r => r.status === 'pending_president_authorization');
  const squadPlayers = allPlayers.filter(p => p.clubId === club.id);

  // When target player selected, initialize reasonable ceilings
  const handleSelectTarget = (player: Player) => {
    setSelectedTargetPlayer(player);
    const suggestedFee = Math.round(player.value * 1.15);
    const suggestedWage = Math.max(player.wage || 30000, Math.round(player.value * 0.003));
    setTargetPriceCeiling(suggestedFee);
    setTargetWageCeiling(suggestedWage);
  };

  // Dispatch Sporting Director to negotiate target
  const handleDispatchNegotiations = () => {
    if (!selectedTargetPlayer) return;

    const outcome = orderSportingDirectorNegotiate(
      club,
      selectedTargetPlayer,
      targetPriceCeiling,
      targetWageCeiling,
      priority,
      agency.currentWeek,
      agency.currentSeason,
      agency
    );

    if (outcome.updatedClub) onUpdateClub(outcome.updatedClub);
    if (outcome.updatedAgency) onUpdateAgency(outcome.updatedAgency);

    if (addToast) {
      addToast(outcome.message, outcome.type);
    }

    if (outcome.type === 'success') {
      confetti({ particleCount: 40, spread: 50 });
      setSelectedTargetPlayer(null);
      setActiveTab('approvals');
    }
  };

  // Dispatch Sporting Director to sell / loan squad player
  const handleDispatchOffload = () => {
    if (!selectedOffloadPlayer) return;

    const outcome = orderSportingDirectorOffload(
      club,
      selectedOffloadPlayer,
      {
        mode: offloadMode,
        minAskingPrice: offloadMode === 'sale' ? minAskingPrice : Math.round(selectedOffloadPlayer.value * 0.05),
        minWageContributionPercent: offloadMinWageCoverage,
        sellOnClausePercent: offloadSellOnClause,
        enableBuyback: offloadEnableBuyback,
        buybackPriceMultiplier: offloadBuybackMultiplier,
        prohibitDomesticRivals: offloadProhibitRivals,
        performanceAddonsRequired: offloadPerformanceAddons,
        priorityStrategy: offloadStrategy
      },
      allClubs,
      agency.currentWeek,
      agency.currentSeason,
      agency
    );

    if (outcome.updatedClub) onUpdateClub(outcome.updatedClub);
    if (outcome.updatedAgency) onUpdateAgency(outcome.updatedAgency);

    if (addToast) {
      addToast(outcome.message, outcome.type);
    }

    if (outcome.type === 'success') {
      confetti({ particleCount: 30, spread: 50 });
      setSelectedOffloadPlayer(null);
      setActiveTab('approvals');
    }
  };

  // Authorize internal staff transfer request
  const handleAuthorizeStaffRequest = (requestId: string) => {
    const outcome = authorizeInternalStaffTransferRequest(
      requestId,
      'authorize',
      club,
      allPlayers,
      allClubs,
      agency,
      agency.currentWeek,
      agency.currentSeason
    );

    if (outcome.updatedClub) onUpdateClub(outcome.updatedClub);
    if (outcome.updatedAgency) onUpdateAgency(outcome.updatedAgency);

    if (addToast) {
      addToast(outcome.message, outcome.type);
    }

    if (outcome.type === 'success') {
      confetti({ particleCount: 45, spread: 55 });
      setActiveTab('approvals');
    }
  };

  // Dismiss internal staff transfer request
  const handleDismissStaffRequest = (requestId: string) => {
    const updated = (club.internalTransferRequests || []).map(r => 
      r.id === requestId ? { ...r, status: 'dismissed' as const } : r
    );
    onUpdateClub({
      ...club,
      internalTransferRequests: updated
    });
    if (addToast) {
      addToast('Staff transfer request dismissed.', 'info');
    }
  };

  // Presidential decision on a pending proposal
  const handleDecision = (proposalId: string, decision: 'approve' | 'reject' | 'demand_renegotiate') => {
    const outcome = executePresidentialTransferDecision(
      proposalId,
      decision,
      club,
      allPlayers,
      allClubs,
      agency,
      agency.currentWeek,
      agency.currentSeason
    );

    if (outcome.updatedClub) onUpdateClub(outcome.updatedClub);
    if (outcome.updatedAgency) onUpdateAgency(outcome.updatedAgency);
    if (outcome.updatedAllPlayers && onUpdateAllPlayers) onUpdateAllPlayers(outcome.updatedAllPlayers);
    if (outcome.updatedAllClubs && onUpdateAllClubs) onUpdateAllClubs(outcome.updatedAllClubs);

    if (addToast) {
      addToast(outcome.message, outcome.type);
    }

    if (decision === 'approve' && outcome.type === 'success') {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  };

  // Attempt approval: if board approval is enabled and deal is over 50% treasury, trigger simulated board meeting mini-game
  const handleAttemptApprove = (proposal: PresidentialTransferProposal) => {
    const treasuryThreshold = club.transferBudget * 0.5;
    const isOver50Percent = proposal.negotiatedFee > treasuryThreshold;

    if (isBoardApprovalActive && isOver50Percent) {
      setSelectedProposalForBoardMeeting(proposal);
      if (addToast) {
        addToast(`🏛️ Convening Extraordinary Board Chamber: ${proposal.playerName} deal exceeds 50% of club treasury!`, 'info');
      }
      return;
    }

    // Direct presidential authorization
    handleDecision(proposal.id, 'approve');
  };

  // Search filtered players
  const filteredCandidates = allPlayers.filter(p => {
    if (p.clubId === club.id) return false;
    if (!searchTarget.trim()) return p.rating >= 78;
    const q = searchTarget.toLowerCase();
    return p.name.toLowerCase().includes(q) ||
      p.clubName.toLowerCase().includes(q) ||
      p.nationality.toLowerCase().includes(q) ||
      p.position.toLowerCase().includes(q);
  }).slice(0, 12);

  return (
    <div className="space-y-6">
      {/* Sporting Director Status & Presidential Command Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 flex items-center justify-center text-3xl shadow-inner shrink-0">
              {director.avatar || '👔'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Chief Sporting Director
                </span>
                <span className="text-xs text-slate-400 font-semibold">{director.tacticalFocus} Doctrine</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">{director.name}</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Negotiation Rating: <strong className="text-amber-400">{director.rating} OVR</strong> • Scouting Eye: <strong className="text-emerald-400">{director.scoutingRating} OVR</strong> • Style: <strong className="text-indigo-300">{director.personality}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl text-center flex-1 sm:flex-initial">
              <span className="text-[10px] uppercase font-bold text-slate-400">Pending Approvals</span>
              <p className="text-lg font-black text-amber-400">{pendingProposals.length}</p>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl text-center flex-1 sm:flex-initial">
              <span className="text-[10px] uppercase font-bold text-slate-400">Club Treasury</span>
              <p className="text-lg font-black text-emerald-400">{formatMoney(club.transferBudget)}</p>
            </div>
          </div>
        </div>

        {/* Presidential Sub-Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pt-5 mt-5 border-t border-slate-800 scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`py-2.5 px-4 rounded-2xl font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
              activeTab === 'approvals'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Presidential Approvals ({pendingProposals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('staff_requests')}
            className={`py-2.5 px-4 rounded-2xl font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap border relative ${
              activeTab === 'staff_requests'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff &amp; Coach Directives</span>
            {staffRequests.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'staff_requests' ? 'bg-slate-950 text-cyan-300' : 'bg-cyan-500 text-slate-950'
              }`}>
                {staffRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('scout_order')}
            className={`py-2.5 px-4 rounded-2xl font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
              activeTab === 'scout_order'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-950/40'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Order Sporting Director to Buy</span>
          </button>

          <button
            onClick={() => setActiveTab('squad_offload')}
            className={`py-2.5 px-4 rounded-2xl font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
              activeTab === 'squad_offload'
                ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-950/40'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Order Sporting Director to Offload</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-2.5 px-4 rounded-2xl font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
              activeTab === 'tasks'
                ? 'bg-slate-800 text-white border-slate-700'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Director Log &amp; Tasks ({activeTasks.length})</span>
          </button>
        </div>
      </div>

      {/* 1. TAB: PENDING PRESIDENTIAL APPROVALS */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {/* Board Approval Requirement Policy Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-2 border-indigo-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                🏛️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-xs">Board Approval Requirement Policy</span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    isBoardApprovalActive
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {isBoardApprovalActive ? 'Enforced' : 'Bypassed (Autocratic)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  When enabled, any transfer worth over 50% of the club's current treasury (<strong className="text-amber-300">{formatMoney(club.transferBudget * 0.5)}</strong>) requires a simulated Board Meeting mini-game to gain approval before the deal can be finalized.
                </p>
              </div>
            </div>

            {onToggleBoardApproval && (
              <button
                type="button"
                onClick={() => onToggleBoardApproval(!isBoardApprovalActive)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 shrink-0 border shadow-md ${
                  isBoardApprovalActive
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-amber-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{isBoardApprovalActive ? 'Board Approval: ENABLED' : 'Board Approval: DISABLED'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-amber-400" />
              <span>Transfers Awaiting Presidential Signature ({pendingProposals.length})</span>
            </h3>
            <span className="text-xs text-slate-400">
              The Sporting Director has agreed terms. Your signature executes the contract.
            </span>
          </div>

          {pendingProposals.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-2xl">
                📂
              </div>
              <h4 className="text-base font-black text-white">Presidential Inbox Clear</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No transfer agreements currently require your executive approval. Instruct your Sporting Director to open negotiations for incoming talent or offload squad players.
              </p>
              <button
                onClick={() => setActiveTab('scout_order')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-5 py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                Open Transfer Negotiation Mandate
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {pendingProposals.map((proposal) => {
                const isIncoming = proposal.type === 'incoming_signing' || proposal.type === 'incoming_loan';
                const isWarning = proposal.boardVerdict === 'warning' || proposal.boardVerdict === 'requires_vote';

                return (
                  <div
                    key={proposal.id}
                    className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl space-y-4 flex flex-col justify-between"
                  >
                    {/* Header */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                            isIncoming
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          }`}>
                            {isIncoming ? 'Incoming Transfer Signing' : 'Outgoing Squad Sale'}
                          </span>
                          {proposal.initiatedBy && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 capitalize">
                              Via {proposal.initiatedBy.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Expires in {proposal.expiresInWeeks} weeks</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                          {proposal.playerAvatarEmoji || '⚽'}
                        </div>
                        <div>
                          <h4 className="text-base font-black text-white">{proposal.playerName}</h4>
                          <p className="text-xs text-slate-300">
                            {proposal.playerPosition} • {proposal.playerAge} yrs • <strong className="text-amber-400">{proposal.playerRating} OVR</strong> • {proposal.playerNationality}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Deal Breakdown Table */}
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-800/80">
                        <span className="text-slate-400">Transfer Fee:</span>
                        <strong className="text-emerald-400 font-black text-sm">{formatMoney(proposal.negotiatedFee)}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/80">
                        <span className="text-slate-400">Weekly Wage:</span>
                        <strong className="text-white font-bold">{formatMoney(proposal.negotiatedWage)}/wk</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/80">
                        <span className="text-slate-400">Contract Length:</span>
                        <strong className="text-slate-200">{proposal.negotiatedContractYears} Years</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/80">
                        <span className="text-slate-400">Destination/Buyer Club:</span>
                        <strong className="text-indigo-300 font-bold">{proposal.otherClubName}</strong>
                      </div>

                      {/* Negotiated Clauses */}
                      {(proposal.sellOnClausePercent || proposal.buybackClausePrice || proposal.performanceAddons || proposal.wageContributionPercent) && (
                        <div className="py-2 border-b border-slate-800/80 space-y-1">
                          <span className="text-slate-400 text-[11px] font-bold block">Negotiated Contract Clauses:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {proposal.sellOnClausePercent ? (
                              <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black">
                                📌 {proposal.sellOnClausePercent}% Future Sell-On
                              </span>
                            ) : null}
                            {proposal.buybackClausePrice ? (
                              <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black">
                                🔄 Buy-Back Option ({formatMoney(proposal.buybackClausePrice)})
                              </span>
                            ) : null}
                            {proposal.performanceAddons ? (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black">
                                🎯 Performance Add-Ons (+{formatMoney((proposal.performanceAddons.appearanceBonusFee || 0) + (proposal.performanceAddons.goalMilestoneBonusFee || 0) + (proposal.performanceAddons.trophyBonusFee || 0))})
                              </span>
                            ) : null}
                            {proposal.wageContributionPercent !== undefined && (
                              <span className="px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-black">
                                💰 {proposal.wageContributionPercent}% Wage Relief
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Director Assessment:</span>
                        <span className="capitalize font-bold text-amber-400">
                          {proposal.directorAssessment.replace('_', ' ')} ({proposal.directorConfidence}% confidence)
                        </span>
                      </div>
                    </div>

                    {/* Sporting Director & Board Notes */}
                    <div className="space-y-2">
                      <div className="bg-indigo-950/40 border border-indigo-500/30 p-3 rounded-2xl text-xs space-y-1">
                        <span className="text-[10px] font-black uppercase text-indigo-300 flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-indigo-400" />
                          <span>Sporting Director Dossier</span>
                        </span>
                        <p className="text-slate-300 italic">{proposal.directorNotes}</p>
                      </div>

                      <div className={`p-3 rounded-2xl border text-xs space-y-1 ${
                        isWarning
                          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                          : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                      }`}>
                        <span className="text-[10px] font-black uppercase flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          <span>Board of Directors Verdict: {proposal.boardVerdict.toUpperCase()}</span>
                        </span>
                        <p className="text-slate-300">{proposal.boardNotes}</p>
                      </div>
                    </div>

                    {/* 50% Treasury Threshold Warning & Indicator */}
                    {proposal.negotiatedFee > (club.transferBudget * 0.5) && (
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                        isBoardApprovalActive
                          ? 'bg-amber-950/60 border-amber-500/50 text-amber-200'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="text-base">🏛️</span>
                          <span className="font-semibold text-[11px]">
                            {isBoardApprovalActive
                              ? `Major Capital Transfer: Fee (${formatMoney(proposal.negotiatedFee)}) exceeds 50% treasury threshold (${formatMoney(club.transferBudget * 0.5)}). Board hearing required!`
                              : `Major Capital Transfer: Exceeds 50% treasury threshold, but Board Hearing is disabled by Presidential Decree.`}
                          </span>
                        </div>
                        {isBoardApprovalActive && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                            Hearing Required
                          </span>
                        )}
                      </div>
                    )}

                    {/* Presidential Action Buttons */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleAttemptApprove(proposal)}
                        className={`font-black py-2.5 px-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg ${
                          isBoardApprovalActive && proposal.negotiatedFee > (club.transferBudget * 0.5)
                            ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 shadow-amber-950/40 border border-amber-400'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                        }`}
                      >
                        {isBoardApprovalActive && proposal.negotiatedFee > (club.transferBudget * 0.5) ? (
                          <>
                            <Building className="w-4 h-4 text-slate-950" />
                            <span>Convene Board Hearing</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Approve Deal</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDecision(proposal.id, 'demand_renegotiate')}
                        className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold py-2.5 px-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 border border-slate-700"
                        title="Instruct Sporting Director to renegotiate a 10% lower fee/wage"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Squeeze Terms</span>
                      </button>

                      <button
                        onClick={() => handleDecision(proposal.id, 'reject')}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold py-2.5 px-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 border border-red-500/30"
                      >
                        <X className="w-4 h-4" />
                        <span>Veto Deal</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. TAB: STAFF TRANSFER DIRECTIVES & COACH DEMANDS */}
      {activeTab === 'staff_requests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>Staff Directives &amp; Department Demands ({staffRequests.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Head coach, financial director, and chief scout propose tactical offloads and targeted acquisitions. Sign to authorize execution.
              </p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl self-start">
              Executive Delegation Active
            </span>
          </div>

          {staffRequests.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto text-2xl">
                📋
              </div>
              <h4 className="text-base font-black text-white">No Pending Staff Demands</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Your coaching staff and financial directors have not flagged any urgent transfer requests this match week. Next week's performance reviews will generate new department requests.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {staffRequests.map((req) => {
                const urgencyColor =
                  req.urgency === 'disciplinary_immediate' || req.urgency === 'financial_urgent'
                    ? 'bg-red-500/20 text-red-300 border-red-500/40'
                    : req.urgency === 'tactical_priority'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';

                return (
                  <div
                    key={req.id}
                    className="bg-slate-900 border-2 border-cyan-500/30 rounded-3xl p-5 shadow-2xl space-y-4 flex flex-col justify-between"
                  >
                    {/* Header */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{req.requesterAvatar || '👔'}</span>
                          <div>
                            <span className="text-xs font-black text-white block">{req.requesterName}</span>
                            <span className="text-[10px] text-cyan-400 font-bold uppercase">{req.requesterRole}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${urgencyColor}`}>
                          {req.urgency.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Player info */}
                      <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                          ⚽
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-white truncate">{req.playerName}</h4>
                            <span className="text-xs font-black text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-800">
                              {req.playerRating} OVR
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {req.playerPosition} • {req.playerAge} yrs • Val: {formatMoney(req.playerValue || 0)}
                          </p>
                        </div>
                      </div>

                      {/* Staff Reasoning Quote */}
                      <div className="bg-slate-950/80 border-l-4 border-cyan-500 p-3 rounded-r-2xl text-xs space-y-1">
                        <span className="text-[10px] font-black uppercase text-cyan-400 flex items-center gap-1">
                          <span>Department Justification</span>
                        </span>
                        <p className="text-slate-300 italic">{req.reasoning}</p>
                      </div>

                      {/* Mandate Terms */}
                      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Action Type:</span>
                          <span className="text-white font-black capitalize">
                            {req.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {req.suggestedMinFee !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Target Min Fee:</span>
                            <span className="text-emerald-400 font-black">{formatMoney(req.suggestedMinFee)}</span>
                          </div>
                        )}
                        {req.suggestedWage !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Max Wage Ceiling:</span>
                            <span className="text-white font-bold">{formatMoney(req.suggestedWage)}/wk</span>
                          </div>
                        )}
                        {req.recommendedClauses && req.recommendedClauses.length > 0 && (
                          <div className="pt-1 flex flex-wrap gap-1">
                            {req.recommendedClauses.map((clause, idx) => (
                              <span key={idx} className="bg-cyan-950/70 border border-cyan-700/60 text-cyan-300 text-[10px] px-1.5 py-0.5 rounded">
                                {clause}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleAuthorizeStaffRequest(req.id)}
                        className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-2.5 px-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/40"
                      >
                        <Check className="w-4 h-4" />
                        <span>Authorize Mandate</span>
                      </button>
                      <button
                        onClick={() => handleDismissStaffRequest(req.id)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 border border-slate-700"
                      >
                        <X className="w-4 h-4" />
                        <span>Dismiss</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. TAB: SCOUT & ORDER NEGOTIATION */}
      {activeTab === 'scout_order' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Presidential Transfer Mandate
            </span>
            <h3 className="text-xl font-black text-white mt-1">Direct Sporting Director to Acquire Target</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Select any player worldwide and set your strategic budget constraints. {director.name} will handle negotiations with the club and player.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by player name, club, position, or nationality..."
              value={searchTarget}
              onChange={(e) => setSearchTarget(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Candidate Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCandidates.map((player) => {
              const isSelected = selectedTargetPlayer?.id === player.id;
              return (
                <div
                  key={player.id}
                  onClick={() => handleSelectTarget(player)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-400 shadow-lg shadow-indigo-950/50'
                      : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0">
                      {player.avatarEmoji || '⚽'}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{player.name}</h4>
                      <p className="text-[11px] text-slate-400">{player.position} • {player.clubName}</p>
                      <p className="text-[10px] text-emerald-400 font-bold">{formatMoney(player.value)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-amber-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                      {player.rating} OVR
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Negotiation Configuration Form */}
          {selectedTargetPlayer && (
            <div className="bg-slate-950 p-5 sm:p-6 rounded-3xl border-2 border-indigo-500/50 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-2xl">
                    {selectedTargetPlayer.avatarEmoji || '⚽'}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">Target: {selectedTargetPlayer.name}</h4>
                    <p className="text-xs text-slate-300">
                      {selectedTargetPlayer.position} • {selectedTargetPlayer.clubName} • Est. Market Value: <strong className="text-emerald-400">{formatMoney(selectedTargetPlayer.value)}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTargetPlayer(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Max Transfer Fee Ceiling (€)</label>
                  <input
                    type="number"
                    value={targetPriceCeiling}
                    onChange={(e) => setTargetPriceCeiling(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-black"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Treasury: {formatMoney(club.transferBudget)}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Max Player Wage Ceiling (€/wk)</label>
                  <input
                    type="number"
                    value={targetWageCeiling}
                    onChange={(e) => setTargetWageCeiling(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-black"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Current Wage: {formatMoney(selectedTargetPlayer.wage || 30000)}/wk
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Negotiation Strategy</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold"
                  >
                    <option value="Balanced Strategy">⚖️ Balanced Strategy</option>
                    <option value="Urgent Priority">⚡ Urgent Priority (+Success Chance)</option>
                    <option value="Bargain Hunting">💎 Bargain Hunting (Push Discounts)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800">
                <p className="text-xs text-slate-400">
                  {director.name} will initiate talks with {selectedTargetPlayer.clubName}. Success will deposit a formal proposal for your final signature.
                </p>

                <button
                  onClick={handleDispatchNegotiations}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black px-6 py-3 rounded-2xl text-xs transition cursor-pointer shadow-lg shadow-indigo-950/60 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Dispatch {director.name} to Negotiate</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. TAB: SQUAD OFFLOAD / LOAN MANDATE */}
      {activeTab === 'squad_offload' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Presidential Clearance Directive
            </span>
            <h3 className="text-xl font-black text-white mt-1">Order Sporting Director to Sell or Loan Players</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Select a squad member to offload. Your Sporting Director will shop the player to suitable European clubs and return an official bid for your presidential ratification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {squadPlayers.map((player) => {
              const isSelected = selectedOffloadPlayer?.id === player.id;
              return (
                <div
                  key={player.id}
                  onClick={() => {
                    setSelectedOffloadPlayer(player);
                    setMinAskingPrice(player.value);
                  }}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-purple-950/60 border-purple-400 shadow-lg shadow-purple-950/50'
                      : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0">
                      {player.avatarEmoji || '⚽'}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{player.name}</h4>
                      <p className="text-[11px] text-slate-400">{player.position} • {player.age} yrs</p>
                      <p className="text-[10px] text-emerald-400 font-bold">Val: {formatMoney(player.value)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-purple-300 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                      {player.rating} OVR
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedOffloadPlayer && (
            <div className="bg-slate-950 p-5 sm:p-6 rounded-3xl border-2 border-purple-500/50 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-2xl">
                    {selectedOffloadPlayer.avatarEmoji || '⚽'}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">Offload Candidate: {selectedOffloadPlayer.name}</h4>
                    <p className="text-xs text-slate-300">
                      Weekly Wage: <strong className="text-white">{formatMoney(selectedOffloadPlayer.wage || 0)}/wk</strong> • Market Value: <strong className="text-emerald-400">{formatMoney(selectedOffloadPlayer.value)}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOffloadPlayer(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Offload Format</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOffloadMode('sale')}
                      className={`flex-1 py-2.5 rounded-xl font-bold border transition cursor-pointer ${
                        offloadMode === 'sale'
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      💰 Permanent Sale
                    </button>
                    <button
                      type="button"
                      onClick={() => setOffloadMode('loan')}
                      className={`flex-1 py-2.5 rounded-xl font-bold border transition cursor-pointer ${
                        offloadMode === 'loan'
                          ? 'bg-sky-600 text-white border-sky-400'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      🔄 Season Loan Out
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    {offloadMode === 'sale' ? 'Minimum Acceptable Fee (€)' : 'Minimum Wage Contribution (%)'}
                  </label>
                  {offloadMode === 'sale' ? (
                    <input
                      type="number"
                      value={minAskingPrice}
                      onChange={(e) => setMinAskingPrice(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-black"
                    />
                  ) : (
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold text-slate-300">
                        <span>Borrower Pays:</span>
                        <span className="text-sky-400">{offloadMinWageCoverage}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        step="10"
                        value={offloadMinWageCoverage}
                        onChange={(e) => setOffloadMinWageCoverage(Number(e.target.value))}
                        className="w-full accent-sky-500"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Negotiation Mandate Style</label>
                  <select
                    value={offloadStrategy}
                    onChange={(e) => setOffloadStrategy(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                  >
                    <option value="Competitive Auction">🏆 Competitive Bidding (Max Total Return)</option>
                    <option value="Fast Clearance">⚡ Urgent Offload (Quickest Agreement)</option>
                    <option value="Development Loan">🌱 Development Focus (Guaranteed Minutes)</option>
                  </select>
                </div>
              </div>

              {/* Clause and Protective Directives */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <span className="text-[10px] font-black uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                  <span>Presidential Contract Stipulations &amp; Strategic Protection</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Sell-On Clause */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <label className="block text-[11px] text-slate-300 font-bold mb-1">Sell-On Clause (%)</label>
                    <select
                      value={offloadSellOnClause}
                      onChange={(e) => setOffloadSellOnClause(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold text-xs"
                    >
                      <option value={0}>No Sell-On (0%)</option>
                      <option value={10}>10% Future Capital Gain</option>
                      <option value={15}>15% Future Capital Gain</option>
                      <option value={20}>20% Future Capital Gain</option>
                      <option value={25}>25% Future Capital Gain</option>
                    </select>
                  </div>

                  {/* Buyback Option */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-300 font-bold cursor-pointer" htmlFor="buybackToggle">
                        Buy-Back Clause
                      </label>
                      <input
                        type="checkbox"
                        id="buybackToggle"
                        checked={offloadEnableBuyback}
                        onChange={(e) => setOffloadEnableBuyback(e.target.checked)}
                        className="rounded accent-purple-500 w-4 h-4"
                      />
                    </div>
                    {offloadEnableBuyback && (
                      <select
                        value={offloadBuybackMultiplier}
                        onChange={(e) => setOffloadBuybackMultiplier(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-purple-500/40 rounded-lg p-1.5 text-white text-[11px] font-bold"
                      >
                        <option value={1.3}>1.3x Sale Value Buyback</option>
                        <option value={1.5}>1.5x Sale Value Buyback</option>
                        <option value={2.0}>2.0x Sale Value Buyback</option>
                      </select>
                    )}
                  </div>

                  {/* Prohibit Domestic Rivals */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-slate-300 font-bold block">Block Domestic Rivals</span>
                      <span className="text-[10px] text-slate-500">Only sell outside league</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={offloadProhibitRivals}
                      onChange={(e) => setOffloadProhibitRivals(e.target.checked)}
                      className="rounded accent-purple-500 w-4 h-4"
                    />
                  </div>

                  {/* Performance Add-ons */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-slate-300 font-bold block">Require Add-Ons</span>
                      <span className="text-[10px] text-slate-500">Milestone bonuses</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={offloadPerformanceAddons}
                      onChange={(e) => setOffloadPerformanceAddons(e.target.checked)}
                      className="rounded accent-purple-500 w-4 h-4"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800">
                <p className="text-xs text-slate-400">
                  {director.name} will circulate dossier to top European clubs and submit the highest bid for your final approval.
                </p>

                <button
                  onClick={handleDispatchOffload}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black px-6 py-3 rounded-2xl text-xs transition cursor-pointer shadow-lg shadow-purple-950/60 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Circulate Dossier to Buyer Clubs</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB: SPORTING DIRECTOR TASKS & LOGS */}
      {activeTab === 'tasks' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>Sporting Director Negotiation Log &amp; Task Stream</span>
          </h3>

          {activeTasks.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-8">
              No recent negotiation mandates on record. Direct your Sporting Director to begin scouting or negotiations.
            </p>
          ) : (
            <div className="space-y-3">
              {activeTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <strong className="text-white text-sm">{task.playerName}</strong>
                      <span className="text-slate-400">({task.playerPosition}, {task.playerClubName})</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      task.status === 'completed_pending_approval'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : task.status === 'failed_breakdown'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {task.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {task.failureReason && (
                    <p className="text-red-300 bg-red-950/40 p-2.5 rounded-xl border border-red-500/20 italic">
                      ⚠️ Breakdown Note: {task.failureReason}
                    </p>
                  )}

                  <div className="space-y-1 pt-1 border-t border-slate-800/60">
                    {task.logs.map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>• Week {log.week}: {log.text}</span>
                        {log.successProbability !== undefined && (
                          <span className="text-indigo-400 font-bold">{log.successProbability}% roll</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Simulated Board Meeting Mini-Game Modal */}
      {selectedProposalForBoardMeeting && (
        <BoardMeetingMiniGameModal
          proposal={selectedProposalForBoardMeeting}
          club={club}
          agency={agency}
          onClose={() => setSelectedProposalForBoardMeeting(null)}
          onApproveSuccess={(proposalId) => {
            setSelectedProposalForBoardMeeting(null);
            handleDecision(proposalId, 'approve');
          }}
          onVetoOutcome={(proposalId) => {
            setSelectedProposalForBoardMeeting(null);
            handleDecision(proposalId, 'reject');
          }}
          addToast={addToast}
        />
      )}
    </div>
  );
};
