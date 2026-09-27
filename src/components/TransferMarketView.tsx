import React, { useState } from 'react';
import { Club, Player, AgencyState, TargetedClubFeedback } from '../types';
import { formatMoney, recordFinancialTransaction, generateTargetedClubFeedback } from '../utils/gameEngine';
import { safeFetchAi, generateClientNegotiationFeedback } from '../utils/aiFallback';
import { PlayerPitchNegotiationModal } from './PlayerPitchNegotiationModal';
import { AssistantRecruiterModal } from './AssistantRecruiterModal';
import { evaluatePlayerTransferAcceptance, TransferEvaluationResult, checkPlayerTransferEligibility, getCurrentTransferWindowId, getNextTransferWindowName } from '../utils/transferEvaluationEngine';
import { orderSportingDirectorNegotiate, orderSportingDirectorOffload } from '../utils/roleInteractionsEngine';
import { ReleaseClauseWarRoom } from './ReleaseClauseWarRoom';
import { TargetedClubFeedbackView } from './TargetedClubFeedbackView';
import { 
  DollarSign, 
  Search, 
  Filter, 
  Bot, 
  Sparkles, 
  X, 
  Check, 
  Send, 
  Building, 
  ShieldAlert, 
  TrendingUp,
  UserCheck,
  Briefcase,
  Layers,
  Clock,
  UserPlus,
  Compass,
  FileText,
  RotateCcw,
  Coins,
  HeartHandshake,
  Lock,
  AlertCircle,
  Crown
} from 'lucide-react';

interface TransferMarketViewProps {
  players: Player[];
  clubs: Club[];
  agency: AgencyState;
  onUpdatePlayer: (player: Player) => void;
  onUpdateAgency: (agency: AgencyState) => void;
  onUpdateClubs?: (clubs: Club[]) => void;
  selectedPlayerForTransfer?: Player | null;
  onCloseSelectedPlayerForTransfer?: () => void;
  addToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export type MarketSubTab = 'transfer_listed' | 'loan_listed' | 'free_agents' | 'expiring_contracts' | 'release_clauses' | 'all';

export const TransferMarketView: React.FC<TransferMarketViewProps> = ({
  players,
  clubs,
  agency,
  onUpdatePlayer,
  onUpdateAgency,
  onUpdateClubs,
  selectedPlayerForTransfer,
  onCloseSelectedPlayerForTransfer,
  addToast
}) => {
  const [marketTab, setMarketTab] = useState<MarketSubTab>('transfer_listed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [showUnrestOnly, setShowUnrestOnly] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 18;

  const [negotiatingPlayer, setNegotiatingPlayer] = useState<Player | null>(selectedPlayerForTransfer || null);
  const [isLoanDeal, setIsLoanDeal] = useState<boolean>(false);
  const [pitchingPlayer, setPitchingPlayer] = useState<Player | null>(null);
  const [showAssistantModal, setShowAssistantModal] = useState<boolean>(false);

  // Negotiation Form State
  const [transferFee, setTransferFee] = useState<number>(0);
  const [offeredWage, setOfferedWage] = useState<number>(0);
  const [agentCommissionFee, setAgentCommissionFee] = useState<number>(10);
  const [targetClubId, setTargetClubId] = useState<string>('');
  const [releaseClauseValue, setReleaseClauseValue] = useState<number>(0);
  const [loanFee, setLoanFee] = useState<number>(500000);
  const [wageContributionPercent, setWageContributionPercent] = useState<number>(100);
  const [agentTone, setAgentTone] = useState<'Professional' | 'Aggressive' | 'Friendly'>('Professional');

  // AI Dialogue State
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [chairmanReply, setChairmanReply] = useState<string | null>(null);
  const [negotiationStatus, setNegotiationStatus] = useState<'idle' | 'success' | 'rejected'>('idle');

  // Targeted Club Feedback & Alternative Deal Structures
  const [targetedFeedback, setTargetedFeedback] = useState<TargetedClubFeedback | null>(null);
  const [sellOnClausePercent, setSellOnClausePercent] = useState<number>(10);
  const [upfrontInstallmentPercent, setUpfrontInstallmentPercent] = useState<number>(70);
  const [addonsAmount, setAddonsAmount] = useState<number>(0);

  // Sweetener State for Player Refusal override
  const [sweetenerPaid, setSweetenerPaid] = useState<boolean>(false);

  // Presidential Offload Directive State (Clause & Auction Mandates)
  const [offloadSellOnClause, setOffloadSellOnClause] = useState<number>(10);
  const [offloadEnableBuyback, setOffloadEnableBuyback] = useState<boolean>(false);
  const [offloadBuybackMultiplier, setOffloadBuybackMultiplier] = useState<number>(1.5);
  const [offloadProhibitRivals, setOffloadProhibitRivals] = useState<boolean>(false);
  const [offloadPerformanceAddons, setOffloadPerformanceAddons] = useState<boolean>(false);
  const [offloadStrategy, setOffloadStrategy] = useState<'Fast Clearance' | 'Competitive Auction' | 'Development Loan'>('Competitive Auction');
  const [offloadMinWageCoverage, setOffloadMinWageCoverage] = useState<number>(100);

  // Reset page when tab/filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [marketTab, searchQuery, selectedPosition, showUnrestOnly]);

  // Sync selected player from props
  React.useEffect(() => {
    if (selectedPlayerForTransfer) {
      handleStartNegotiation(selectedPlayerForTransfer, false);
    }
  }, [selectedPlayerForTransfer]);

  // Filter players based on embedded sub-tabs
  const filteredPlayers = players.filter(p => {
    // 1. Search Query
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.clubName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nationality.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // 2. Position
    if (selectedPosition !== 'ALL' && p.position !== selectedPosition) return false;

    // 3. Unrest Only
    if (showUnrestOnly && (!p.unrest || p.unrest.status === 'content')) return false;

    // 4. Market Sub Tab Filter
    if (marketTab === 'transfer_listed') {
      const isListed = p.isTransferListed || p.transferListedByClub || (p.unrest && p.unrest.status === 'transfer_requested');
      return isListed;
    }
    if (marketTab === 'loan_listed') {
      const isLoan = p.isLoanListed || p.loanListedByClub;
      return isLoan;
    }
    if (marketTab === 'free_agents') {
      const isFree = p.clubName === 'Free Agent' || !p.clubId || p.clubId === 'c_free';
      return isFree;
    }
    if (marketTab === 'expiring_contracts') {
      const isExpiring = (p.contractYears !== undefined && p.contractYears <= 1) || p.contractExpiringSoon;
      return isExpiring;
    }

    return true; // 'all'
  });

  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE));
  const displayedPlayers = filteredPlayers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const userPresidencyClub = clubs.find(c => c.id === agency.presidency?.clubId);

  // Close negotiation modal cleanly and reset state
  const handleCloseNegotiator = () => {
    setNegotiatingPlayer(null);
    setNegotiationStatus('idle');
    setChairmanReply(null);
    setTargetedFeedback(null);
    if (onCloseSelectedPlayerForTransfer) {
      onCloseSelectedPlayerForTransfer();
    }
  };

  // Keyboard shortcut: Escape to dismiss negotiator modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && negotiatingPlayer) {
        handleCloseNegotiator();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [negotiatingPlayer]);

  // Open negotiation modal
  const handleStartNegotiation = (player: Player, forLoan: boolean = false) => {
    if (!player) return;
    setNegotiatingPlayer(player);
    setIsLoanDeal(forLoan);
    setSweetenerPaid(false);

    const destClub = clubs.find(c => c.id !== player.clubId) || clubs[0];
    
    // Unrest discount
    const discount = player.unrest?.discountPercent || 0;
    const baseVal = player.value || 10000000;
    const discountedVal = discount > 0 ? Math.round(baseVal * (1 - discount / 100)) : baseVal;
    const defaultWage = Math.round((player.wage || 50000) * 1.15);
    const defaultLoanFee = Math.round(baseVal * 0.05);

    setTransferFee(forLoan ? 0 : discountedVal);
    setLoanFee(defaultLoanFee);
    setOfferedWage(defaultWage);
    setAgentCommissionFee(10);
    setTargetClubId(destClub?.id || '');
    setReleaseClauseValue(Math.round(discountedVal * 1.5));
    setWageContributionPercent(100);
    setSellOnClausePercent(10);
    setUpfrontInstallmentPercent(70);
    setAddonsAmount(0);
    setChairmanReply(null);
    setNegotiationStatus('idle');

    // Generate initial targeted club feedback
    const initialFeedback = generateTargetedClubFeedback(
      player,
      destClub,
      forLoan ? 0 : discountedVal,
      defaultWage,
      10,
      forLoan,
      defaultLoanFee,
      100,
      10,
      70,
      false,
      userPresidencyClub
    );
    setTargetedFeedback(initialFeedback);
  };

  // Handler for adopting target club's alternative suggested deal structure
  const handleApplySuggestedStructure = (structure: {
    counterFee: number;
    upfrontPercent: number;
    sellOnPercent: number;
    addonsAmount?: number;
    counterWage?: number;
  }) => {
    if (!isLoanDeal) {
      setTransferFee(structure.counterFee);
    } else {
      setLoanFee(structure.counterFee);
    }
    setUpfrontInstallmentPercent(structure.upfrontPercent);
    setSellOnClausePercent(structure.sellOnPercent);
    if (structure.addonsAmount !== undefined) {
      setAddonsAmount(structure.addonsAmount);
    }
    if (structure.counterWage) {
      setOfferedWage(structure.counterWage);
    }

    if (negotiatingPlayer && targetClub) {
      const refreshedFb = generateTargetedClubFeedback(
        negotiatingPlayer,
        targetClub,
        isLoanDeal ? 0 : structure.counterFee,
        structure.counterWage || offeredWage,
        agentCommissionFee,
        isLoanDeal,
        isLoanDeal ? structure.counterFee : loanFee,
        wageContributionPercent,
        structure.sellOnPercent,
        structure.upfrontPercent,
        (structure.addonsAmount || 0) > 0,
        userPresidencyClub
      );
      setTargetedFeedback(refreshedFb);
    }

    if (addToast) {
      addToast(`⚡ Adopted ${targetClub?.name || 'Club'}'s suggested structure: ${structure.upfrontPercent}% upfront & ${structure.sellOnPercent}% sell-on.`, 'info');
    }
  };

  const targetClub = clubs.find(c => c.id === targetClubId) || clubs[0];

  // Evaluate Player Destination Acceptance
  const playerEvaluation: TransferEvaluationResult = negotiatingPlayer
    ? evaluatePlayerTransferAcceptance(negotiatingPlayer, targetClub, offeredWage, isLoanDeal, agency.currentWeek, agency.currentSeason)
    : { allowed: true, verdict: '', quote: '', severity: 'low' };

  const isPlayerRefusing = negotiatingPlayer ? (!playerEvaluation.allowed && !sweetenerPaid) : false;

  // Pay Sweetener
  const handlePaySweetener = () => {
    if (!negotiatingPlayer) return;
    if (playerEvaluation.isLockedToLoanOnly) {
      alert(`Cannot pay sweetener: ${negotiatingPlayer.name} is locked from permanent transfers this window. Under league regulations, only LOAN moves are allowed.`);
      return;
    }
    const cost = playerEvaluation.sweetenerCostRequired || 150000;
    if (agency.balance < cost) {
      alert(`Insufficient agency funds! Need ${formatMoney(cost)}, Available: ${formatMoney(agency.balance)}.`);
      return;
    }

    const updatedAgency = recordFinancialTransaction(
      agency,
      -cost,
      `Relocation Sweetener: ${negotiatingPlayer.name}`,
      `Paid relocation bonus to persuade ${negotiatingPlayer.name} to accept transfer to ${targetClub.name}.`,
      'transfer'
    );
    onUpdateAgency(updatedAgency);
    setSweetenerPaid(true);
    if (addToast) addToast(`🤝 Sweetener of ${formatMoney(cost)} paid! ${negotiatingPlayer.name} agrees to move to ${targetClub.name}.`, 'success');
  };

  // Submit Offer
  const handleSendOffer = async () => {
    if (!negotiatingPlayer) return;

    if (!isLoanDeal && playerEvaluation.isLockedToLoanOnly) {
      alert(`Transfer blocked: ${negotiatingPlayer.name} moved clubs in this transfer window. Under FIFA & league registration rules, a player cannot transfer permanently to two clubs within the same window. Only a LOAN deal is permitted until ${playerEvaluation.nextAllowedWindowName || 'the next transfer window'}.`);
      return;
    }

    if (isPlayerRefusing) {
      alert(`Cannot submit offer: ${negotiatingPlayer.name} refuses to join ${targetClub.name}! Resolve player objections or pay relocation sweetener.`);
      return;
    }

    setIsAiThinking(true);

    try {
      const offerPayload = {
        transferFee: isLoanDeal ? loanFee : transferFee,
        wage: offeredWage,
        agentFeePercent: agentCommissionFee,
        isLoan: isLoanDeal,
        sellOnPercent: sellOnClausePercent,
        upfrontPercent: upfrontInstallmentPercent,
        addonsAmount: addonsAmount
      };

      const aiData = await safeFetchAi(
        '/api/ai/negotiate-talk',
        {
          player: negotiatingPlayer,
          club: targetClub,
          agentOffer: offerPayload,
          agentTone
        },
        () => generateClientNegotiationFeedback(negotiatingPlayer, targetClub, offerPayload)
      );
      const apiReply = aiData.chairmanReply || null;

      // Generate structured, realistic club feedback & alternative deal structure
      const feedback = generateTargetedClubFeedback(
        negotiatingPlayer,
        targetClub,
        isLoanDeal ? 0 : transferFee,
        offeredWage,
        agentCommissionFee,
        isLoanDeal,
        loanFee,
        wageContributionPercent,
        sellOnClausePercent,
        upfrontInstallmentPercent,
        addonsAmount > 0,
        userPresidencyClub
      );
      setTargetedFeedback(feedback);

      const isAccepted = feedback.verdict === 'accepted';
      setChairmanReply(apiReply || feedback.responseQuote);

      if (isAccepted) {
        setNegotiationStatus('success');
        const earnedCommission = isLoanDeal
          ? Math.round(loanFee * 0.15)
          : Math.round(transferFee * (agentCommissionFee / 100));

        const updatedPlayer: Player = {
          ...negotiatingPlayer,
          clubId: targetClub.id,
          clubName: targetClub.name,
          wage: offeredWage,
          agentCommission: agentCommissionFee,
          isMyClient: true,
          clauses: {
            ...negotiatingPlayer.clauses,
            releaseClause: releaseClauseValue
          },
          lastTransferWeek: !isLoanDeal ? agency.currentWeek : negotiatingPlayer.lastTransferWeek,
          lastTransferSeason: !isLoanDeal ? agency.currentSeason : negotiatingPlayer.lastTransferSeason,
          lastTransferWindowId: !isLoanDeal ? getCurrentTransferWindowId(agency.currentSeason, agency.currentWeek) : negotiatingPlayer.lastTransferWindowId,
          transferredInCurrentWindow: !isLoanDeal ? true : negotiatingPlayer.transferredInCurrentWindow,
          transferredFromClubName: !isLoanDeal ? negotiatingPlayer.clubName : negotiatingPlayer.transferredFromClubName,
          isLoanListed: false,
          isTransferListed: false,
          loanListedByClub: false,
          transferListedByClub: false
        };

        onUpdatePlayer(updatedPlayer);

        if (onUpdateClubs) {
          const updatedClubs = clubs.map(c => {
            if (c.id === targetClub.id) {
              return {
                ...c,
                transferBudget: Math.max(0, c.transferBudget - (isLoanDeal ? loanFee : transferFee))
              };
            }
            if (c.id === negotiatingPlayer.clubId) {
              return {
                ...c,
                transferBudget: c.transferBudget + (isLoanDeal ? loanFee : transferFee)
              };
            }
            return c;
          });
          onUpdateClubs(updatedClubs);
        }

        const updatedAgency = recordFinancialTransaction(
          {
            ...agency,
            reputation: Math.min(100, agency.reputation + 2),
            totalTransferEarnings: agency.totalTransferEarnings + earnedCommission
          },
          earnedCommission,
          `${isLoanDeal ? 'Loan Deal' : 'Broker Commission'}: ${negotiatingPlayer.name}`,
          `Brokered ${negotiatingPlayer.name}'s move to ${targetClub.name}, earning ${formatMoney(earnedCommission)} commission fee.`,
          'transfer'
        );

        onUpdateAgency(updatedAgency);
        if (addToast) {
          addToast(`🎉 Transfer agreed! ${negotiatingPlayer.name} has officially signed for ${targetClub.name}!`, 'success');
        }
      } else {
        setNegotiationStatus('rejected');
        if (addToast) {
          addToast(`${targetClub.name} rejected the current proposal. Review Targeted Club Feedback below for counter-terms.`, 'info');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiThinking(false);
    }
  };

  const isPresidentOfTargetClub = !!(agency.presidency?.clubId && agency.presidency.clubId === targetClub.id);
  const isPresidentOfPlayerClub = !!(negotiatingPlayer && agency.presidency?.clubId && agency.presidency.clubId === negotiatingPlayer.clubId);

  const handlePresidentOrderNegotiation = () => {
    if (!negotiatingPlayer || !userPresidencyClub) return;
    const result = orderSportingDirectorNegotiate(
      userPresidencyClub,
      negotiatingPlayer,
      isLoanDeal ? loanFee : transferFee,
      offeredWage,
      'Balanced Strategy',
      agency.currentWeek,
      agency.currentSeason,
      agency
    );

    if (result.updatedClub && onUpdateClubs) {
      onUpdateClubs(clubs.map(c => c.id === result.updatedClub!.id ? result.updatedClub! : c));
    }
    if (result.updatedAgency) {
      onUpdateAgency(result.updatedAgency);
    }
    if (addToast) {
      addToast(result.message, result.type);
    }
    setNegotiatingPlayer(null);
  };

  const handlePresidentOrderOffload = () => {
    if (!negotiatingPlayer || !userPresidencyClub) return;
    const result = orderSportingDirectorOffload(
      userPresidencyClub,
      negotiatingPlayer,
      {
        mode: isLoanDeal ? 'loan' : 'sale',
        minAskingPrice: isLoanDeal ? loanFee : transferFee,
        minWageContributionPercent: offloadMinWageCoverage,
        sellOnClausePercent: offloadSellOnClause,
        enableBuyback: offloadEnableBuyback,
        buybackPriceMultiplier: offloadBuybackMultiplier,
        prohibitDomesticRivals: offloadProhibitRivals,
        performanceAddonsRequired: offloadPerformanceAddons,
        priorityStrategy: offloadStrategy
      },
      clubs,
      agency.currentWeek,
      agency.currentSeason,
      agency
    );

    if (result.updatedClub && onUpdateClubs) {
      onUpdateClubs(clubs.map(c => c.id === result.updatedClub!.id ? result.updatedClub! : c));
    }
    if (result.updatedAgency) {
      onUpdateAgency(result.updatedAgency);
    }
    if (addToast) {
      addToast(result.message, result.type);
    }
    setNegotiatingPlayer(null);
    if (onCloseSelectedPlayerForTransfer) onCloseSelectedPlayerForTransfer();
  };

  return (
    <div className="space-y-5">
      {/* Top Banner: Assistant Delegation & Market Hub Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 p-5 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Compass className="w-3 h-3 text-amber-400" />
              <span>Global Transfer & Loan Hub</span>
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {filteredPlayers.length} Target Players Available
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">International Market Desk</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Broker club transfers, negotiate loan arrangements, sign unattached talent, or delegate to your Assistant Recruiter.
          </p>
        </div>

        {/* Assistant Recruiter Action Button */}
        <button
          onClick={() => setShowAssistantModal(true)}
          className="w-full md:w-auto bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-600 hover:from-indigo-500 hover:to-amber-500 text-white font-black px-5 py-3 rounded-2xl text-xs transition cursor-pointer shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-2"
        >
          <Briefcase className="w-4 h-4 text-amber-300" />
          <span>Delegate Assistant Recruiter</span>
        </button>
      </div>

      {/* 6 Embedded Sub-Market Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {[
          { id: 'transfer_listed', label: '🏷️ Transfer Listed', count: players.filter(p => p.isTransferListed || p.transferListedByClub || p.unrest?.status === 'transfer_requested').length },
          { id: 'release_clauses', label: '⚡ Release Clause War Room', count: players.filter(p => (p.clauses?.releaseClause || 0) > 0).length },
          { id: 'loan_listed', label: '🔄 Loan Listed', count: players.filter(p => p.isLoanListed || p.loanListedByClub).length },
          { id: 'free_agents', label: '🆓 Free Agents', count: players.filter(p => p.clubName === 'Free Agent' || !p.clubId || p.clubId === 'c_free').length },
          { id: 'expiring_contracts', label: '⏳ Expiring Contracts', count: players.filter(p => (p.contractYears !== undefined && p.contractYears <= 1) || p.contractExpiringSoon).length },
          { id: 'all', label: '🌐 All Players', count: players.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setMarketTab(tab.id as MarketSubTab)}
            className={`py-2.5 px-4 rounded-2xl font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
              marketTab === tab.id
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-950/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850 hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              marketTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {marketTab === 'release_clauses' ? (
        <ReleaseClauseWarRoom
          agency={agency}
          players={players}
          clubs={clubs}
          onUpdateAgency={(updater) => onUpdateAgency(updater(agency))}
          onUpdatePlayer={onUpdatePlayer}
          onUpdateClub={(updatedClub) => {
            if (onUpdateClubs) {
              onUpdateClubs(clubs.map(c => c.id === updatedClub.id ? updatedClub : c));
            }
          }}
          onInitiateDirectContractTalks={(player) => {
            handleStartNegotiation(player, false);
          }}
          onShowToast={(msg, type) => {
            if (addToast) addToast(msg, type || 'info');
          }}
        />
      ) : (
        <>
          {/* Search & Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, club or nation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none text-xs">
          <button
            onClick={() => setShowUnrestOnly(!showUnrestOnly)}
            className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              showUnrestOnly
                ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-400'
                : 'bg-red-950/80 text-red-300 border border-red-500/40 hover:bg-red-900'
            }`}
          >
            <span>🔥 Club Unrest Only</span>
          </button>

          {['ALL', 'ST', 'CAM', 'CM', 'RW', 'LW', 'CB', 'LB', 'RB', 'GK'].map((pos) => (
            <button
              key={pos}
              onClick={() => setSelectedPosition(pos)}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                selectedPosition === pos
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Players Database Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedPlayers.map((player) => {
          const isTransferListed = player.isTransferListed || player.transferListedByClub || player.unrest?.status === 'transfer_requested';
          const isLoanListed = player.isLoanListed || player.loanListedByClub;
          const isExpiring = (player.contractYears !== undefined && player.contractYears <= 1) || player.contractExpiringSoon;

          return (
            <div
              key={player.id}
              className={`bg-slate-900 border ${
                player.unrest && player.unrest.status !== 'content' 
                  ? 'border-red-500/60 shadow-red-950/20' 
                  : isLoanListed
                    ? 'border-sky-500/50'
                    : isTransferListed
                      ? 'border-emerald-500/50'
                      : 'border-slate-800'
              } hover:border-indigo-500/60 rounded-3xl p-5 shadow-xl transition space-y-4 group relative overflow-hidden flex flex-col justify-between`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-black shrink-0">
                      {player.flag}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-base text-white group-hover:text-indigo-400 transition">
                          {player.name}
                        </h3>
                        {player.isMyClient && (
                          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-1.5 py-0.2 rounded border border-emerald-500/30">
                            CLIENT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        <span className="text-indigo-400 font-bold">{player.position}</span> • {player.age}yo • {player.clubName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="bg-indigo-500/20 text-indigo-300 text-sm font-black px-2.5 py-1 rounded-xl border border-indigo-500/30">
                      {player.rating}
                    </span>
                    <p className="text-[10px] text-amber-400 font-bold mt-1">POT {player.potential}</p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {isTransferListed && (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                      🏷️ Transfer Listed
                    </span>
                  )}
                  {isLoanListed && (
                    <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                      🔄 Loan Listed
                    </span>
                  )}
                  {isExpiring && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                      ⏳ Contract Expiring ({player.contractYears || 1}y)
                    </span>
                  )}
                  {/* Transfer Window Restriction Badge */}
                  {(() => {
                    const elig = checkPlayerTransferEligibility(player, agency.currentWeek, agency.currentSeason);
                    if (!elig.canTransferPermanently && elig.isRecentlyTransferred) {
                      return (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>Transferred Wk {elig.lastTransferWeek || agency.currentWeek} (Loan Only)</span>
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Transfer Window Restriction Notice Box */}
                {(() => {
                  const elig = checkPlayerTransferEligibility(player, agency.currentWeek, agency.currentSeason);
                  if (!elig.canTransferPermanently && elig.isRecentlyTransferred) {
                    return (
                      <div className="bg-amber-950/40 border border-amber-500/30 p-2 rounded-xl text-[11px] text-amber-200/90 flex items-start gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-amber-300">Permanent Transfer Locked</p>
                          <p className="text-[10px] text-slate-300">
                            Moved to {player.clubName} this window. Blocked until <span className="text-amber-300 font-semibold">{elig.nextAllowedWindowName}</span>. Loan transfers available.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Unrest Badge */}
                {player.unrest && player.unrest.status !== 'content' && (
                  <div className="bg-gradient-to-r from-red-950/90 to-amber-950/80 border border-red-500/50 p-2.5 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-red-300 flex items-center gap-1">
                        <span>🔥</span>
                        <span>{player.unrest.reasonLabel}</span>
                      </span>
                      <span className="text-amber-400 font-black bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                        -{player.unrest.discountPercent || 25}% Cut
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2">{player.unrest.description}</p>
                  </div>
                )}

                {/* Financial Details */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400">Value: </span>
                    <strong className={player.unrest?.discountPercent ? 'text-amber-400 font-black' : 'text-slate-100'}>
                      {formatMoney(player.unrest?.discountPercent ? Math.round(player.value * (1 - player.unrest.discountPercent / 100)) : player.value)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Wage: </span>
                    <strong className="text-slate-100">{formatMoney(player.wage)}/wk</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-800/80">
                {!player.isMyClient && (
                  <button
                    onClick={() => setPitchingPlayer(player)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition shadow-md"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Pitch Agent</span>
                  </button>
                )}

                {(() => {
                  const elig = checkPlayerTransferEligibility(player, agency.currentWeek, agency.currentSeason);
                  if (!elig.canTransferPermanently && elig.isRecentlyTransferred) {
                    return (
                      <button
                        onClick={() => handleStartNegotiation(player, true)}
                        className="flex-1 bg-gradient-to-r from-amber-600 to-sky-600 hover:from-amber-500 hover:to-sky-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition shadow-md"
                        title={`Moved this window. Permanent transfer locked until ${elig.nextAllowedWindowName}. Click to negotiate loan.`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Negotiate Loan (Loan Only)</span>
                      </button>
                    );
                  }

                  if (isLoanListed) {
                    return (
                      <button
                        onClick={() => handleStartNegotiation(player, true)}
                        className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition shadow-md"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Negotiate Loan</span>
                      </button>
                    );
                  }

                  return (
                    <button
                      onClick={() => handleStartNegotiation(player, false)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition shadow-md"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Broker Transfer</span>
                    </button>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs text-slate-300">
          <span>Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredPlayers.length)} of {filteredPlayers.length} players</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg font-bold cursor-pointer transition"
            >
              Previous
            </button>
            <span className="font-bold text-indigo-400 px-2">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg font-bold cursor-pointer transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
      </>
      )}

      {/* Assistant Recruiter Delegation Modal */}
      {showAssistantModal && (
        <AssistantRecruiterModal
          agency={agency}
          players={players}
          clubs={clubs}
          onClose={() => setShowAssistantModal(false)}
          onUpdateAgency={onUpdateAgency}
          onUpdatePlayers={(updated) => {
            updated.forEach(p => onUpdatePlayer(p));
          }}
          addToast={addToast}
        />
      )}

      {/* Agency Pitch Negotiation Modal */}
      {pitchingPlayer && (
        <PlayerPitchNegotiationModal
          player={pitchingPlayer}
          agency={agency}
          onClose={() => setPitchingPlayer(null)}
          onSuccessSign={(updatedPlayer, updatedAgency) => {
            onUpdatePlayer(updatedPlayer);
            onUpdateAgency(updatedAgency);
            setPitchingPlayer(null);
          }}
        />
      )}

      {/* Interactive Deal Negotiator Modal */}
      {negotiatingPlayer && (
        <div 
          className="fixed inset-0 bg-slate-950/95 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseNegotiator();
            }
          }}
        >
          <div className="bg-slate-900 border-2 border-indigo-500/40 w-full max-w-3xl rounded-3xl p-5 sm:p-6 shadow-2xl relative space-y-5 my-auto max-h-[92vh] flex flex-col">
            <button
              onClick={handleCloseNegotiator}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer transition hover:bg-slate-700"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 pr-10 shrink-0">
              <div className={`p-3 rounded-2xl border ${
                isPresidentOfPlayerClub
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
              }`}>
                {isPresidentOfPlayerClub ? <Crown className="w-6 h-6" /> : isLoanDeal ? <RotateCcw className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {isPresidentOfPlayerClub
                    ? 'Presidential Mandate: Offload Player via Sporting Director'
                    : isLoanDeal ? 'Broker Loan Agreement' : 'Interactive Transfer Negotiator'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isPresidentOfPlayerClub
                    ? 'Set your minimum financial floor and contract clauses. Your Sporting Director will shop the player to buyer clubs and present negotiated bids for your signature.'
                    : isLoanDeal 
                    ? 'Structure loan fee, wage split, and destination approval with the Sporting Director.' 
                    : 'Negotiate transfer fees, weekly wages, and agent commission with the board.'}
                </p>
              </div>
            </div>

            {/* Target Player Brief */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs shrink-0">
              <div>
                <p className="font-bold text-sm text-white">{negotiatingPlayer.name} ({negotiatingPlayer.position})</p>
                <p className="text-slate-400">
                  Current Club: <strong className="text-amber-400">{negotiatingPlayer.clubName}</strong> • Val: <strong className="text-emerald-400">{formatMoney(negotiatingPlayer.value)}</strong> • Wage: <strong className="text-slate-200">{formatMoney(negotiatingPlayer.wage || 30000)}/wk</strong>
                </p>
              </div>
              <span className="bg-indigo-500/20 text-indigo-300 font-black px-2.5 py-1 rounded-xl border border-indigo-500/30">
                OVR {negotiatingPlayer.rating}
              </span>
            </div>

            {/* If NOT presidential offload: Show Player Destination Acceptance & Refusal Stance Banner */}
            {!isPresidentOfPlayerClub && (
              <div className={`p-4 rounded-2xl border ${
                isPlayerRefusing 
                  ? 'bg-rose-950/40 border-rose-500/50' 
                  : 'bg-emerald-950/30 border-emerald-500/40'
              } space-y-2 shrink-0 text-xs`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {isPlayerRefusing ? (
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    ) : (
                      <HeartHandshake className="w-4 h-4 text-emerald-400" />
                    )}
                    <h4 className="font-bold text-white">
                      {isPlayerRefusing ? '⚠️ Client Refusal: Player Objections to Destination' : '✅ Client Consents to Destination Move'}
                    </h4>
                  </div>

                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isPlayerRefusing ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {isPlayerRefusing ? 'REFUSING DESTINATION' : 'TERMS APPROVED'}
                  </span>
                </div>

                <p className="italic text-slate-200 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                  {sweetenerPaid 
                    ? `"${negotiatingPlayer.name}: 'The relocation bonus package convinced me. I am ready to join ${targetClub.name}!'" (Sweetener Paid)`
                    : playerEvaluation.quote}
                </p>

                {isPlayerRefusing && playerEvaluation.canBribeSweetener && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 border-t border-rose-500/20">
                    <span className="text-[11px] text-rose-200">
                      Persuade client with an upfront relocation sweetener:
                    </span>
                    <button
                      type="button"
                      onClick={handlePaySweetener}
                      className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Pay Relocation Bonus ({formatMoney(playerEvaluation.sweetenerCostRequired || 150000)})</span>
                    </button>
                  </div>
                )}

                {playerEvaluation.isLockedToLoanOnly && !isLoanDeal && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1.5 border-t border-amber-500/30">
                    <span className="text-[11px] text-amber-200 font-semibold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Permanent transfer locked until {playerEvaluation.nextAllowedWindowName}. Loan moves allowed:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoanDeal(true);
                        setTransferFee(0);
                        setLoanFee(Math.round((negotiatingPlayer.value || 10000000) * 0.05));
                      }}
                      className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Switch to Loan Deal Proposal</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Form Inputs */}
            <div className="overflow-y-auto pr-1 space-y-4 flex-1">
              {isPresidentOfPlayerClub ? (
                /* PRESIDENTIAL OFFLOAD DIRECTIVE CONTROLS */
                <div className="space-y-4 text-xs">
                  {/* Deal Structure & Floor Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">Offload Format</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsLoanDeal(false);
                            setTransferFee(negotiatingPlayer.value);
                          }}
                          className={`flex-1 py-2.5 rounded-xl font-bold border transition cursor-pointer ${
                            !isLoanDeal
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          💰 Permanent Sale
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsLoanDeal(true);
                            setLoanFee(Math.round(negotiatingPlayer.value * 0.05));
                          }}
                          className={`flex-1 py-2.5 rounded-xl font-bold border transition cursor-pointer ${
                            isLoanDeal
                              ? 'bg-sky-600 text-white border-sky-400 font-black'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          🔄 Loan Deal
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">
                        {!isLoanDeal ? 'Minimum Acceptable Transfer Fee (€)' : 'Minimum Season Loan Fee (€)'}
                      </label>
                      <input
                        type="number"
                        value={!isLoanDeal ? transferFee : loanFee}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isLoanDeal) setTransferFee(val);
                          else setLoanFee(val);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-black"
                      />
                    </div>
                  </div>

                  {/* Clauses & Protection Safeguards */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                      Mandatory Contract Clauses &amp; Protections
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">
                          Future Sell-On Profit Clause
                        </label>
                        <select
                          value={offloadSellOnClause}
                          onChange={(e) => setOffloadSellOnClause(Number(e.target.value))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-bold"
                        >
                          <option value={0}>No Sell-On Clause (0%)</option>
                          <option value={10}>10% of Future Sale</option>
                          <option value={15}>15% of Future Sale (Recommended)</option>
                          <option value={20}>20% High Future Stake</option>
                          <option value={25}>25% Premium Cut</option>
                        </select>
                      </div>

                      {isLoanDeal ? (
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">
                            Borrowing Club Wage Coverage
                          </label>
                          <select
                            value={offloadMinWageCoverage}
                            onChange={(e) => setOffloadMinWageCoverage(Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-bold"
                          >
                            <option value={50}>50% Wage Relief</option>
                            <option value={75}>75% Wage Relief</option>
                            <option value={100}>100% Full Wage Coverage</option>
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">
                            Buy-Back Option
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="buyback_check"
                              checked={offloadEnableBuyback}
                              onChange={(e) => setOffloadEnableBuyback(e.target.checked)}
                              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700 cursor-pointer"
                            />
                            <label htmlFor="buyback_check" className="text-slate-300 cursor-pointer">
                              Retain Buy-Back Option ({Math.round(offloadBuybackMultiplier * 100)}% of fee)
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={offloadProhibitRivals}
                          onChange={(e) => setOffloadProhibitRivals(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 bg-slate-800 border-slate-700 cursor-pointer"
                        />
                        <span>🚫 Prohibit Sales/Loans to Domestic Rivals</span>
                      </label>

                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={offloadPerformanceAddons}
                          onChange={(e) => setOffloadPerformanceAddons(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-700 cursor-pointer"
                        />
                        <span>🎯 Demand Milestone Add-On Bonuses</span>
                      </label>
                    </div>
                  </div>

                  {/* Market Execution Strategy */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Market Circulation Strategy</label>
                    <select
                      value={offloadStrategy}
                      onChange={(e) => setOffloadStrategy(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                    >
                      <option value="Competitive Auction">🔥 Competitive Auction (Circulate widely to spark multi-club bidding)</option>
                      <option value="Fast Clearance">⚡ Fast Clearance (Prioritize rapid departure to immediately relieve wage bill)</option>
                      <option value="Development Loan">🌱 Development Focus (Prioritize clubs guaranteeing first-team minutes)</option>
                    </select>
                  </div>

                  <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-xl text-[11px] text-amber-200">
                    ℹ️ <strong>Executive Directive:</strong> You do not specify destination clubs. Your Sporting Director will shop {negotiatingPlayer.name} to all qualified buyer clubs across Europe, filter out non-compliant bids, enforce your clauses, and present the highest offer for your final presidential signature.
                  </div>
                </div>
              ) : (
                /* STANDARD AGENT / PRESIDENT-BUYING INPUTS */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Destination Club</label>
                      <select
                        value={targetClubId}
                        onChange={(e) => {
                          const newId = e.target.value;
                          setTargetClubId(newId);
                          const newClub = clubs.find(c => c.id === newId) || clubs[0];
                          if (negotiatingPlayer && newClub) {
                            const fb = generateTargetedClubFeedback(
                              negotiatingPlayer,
                              newClub,
                              isLoanDeal ? 0 : transferFee,
                              offeredWage,
                              agentCommissionFee,
                              isLoanDeal,
                              loanFee,
                              wageContributionPercent,
                              sellOnClausePercent,
                              upfrontInstallmentPercent,
                              addonsAmount > 0,
                              userPresidencyClub
                            );
                            setTargetedFeedback(fb);
                          }
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                      >
                        {clubs.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.league})
                          </option>
                        ))}
                      </select>
                    </div>

                    {!isLoanDeal ? (
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Proposed Transfer Fee (€)</label>
                        <input
                          type="number"
                          value={transferFee}
                          onChange={(e) => setTransferFee(Number(e.target.value))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Proposed Loan Fee (€)</label>
                        <input
                          type="number"
                          value={loanFee}
                          onChange={(e) => setLoanFee(Number(e.target.value))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Player Weekly Wage (€)</label>
                      <input
                        type="number"
                        value={offeredWage}
                        onChange={(e) => setOfferedWage(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Agent Commission Fee (%)</label>
                      <select
                        value={agentCommissionFee}
                        onChange={(e) => setAgentCommissionFee(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                      >
                        <option value={8}>8% (Discount Broker)</option>
                        <option value={10}>10% (Standard Rate)</option>
                        <option value={12}>12% (Premium Rep)</option>
                        <option value={15}>15% (Super-Agent Cut)</option>
                      </select>
                    </div>
                  </div>

                  {/* Flexible Deal Structuring (Installments, Sell-On Clause, Add-Ons) */}
                  {!isLoanDeal && (
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                          <Layers className="w-3.5 h-3.5 text-amber-400" />
                          <span>Deal Structuring &amp; Clauses</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Sweeten deal to bridge valuation gaps</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-400 font-medium mb-1 text-[11px]">Upfront Cash Installment</label>
                          <select
                            value={upfrontInstallmentPercent}
                            onChange={(e) => setUpfrontInstallmentPercent(Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-bold text-xs"
                          >
                            <option value={50}>50% Upfront (Standard)</option>
                            <option value={65}>65% Upfront (Favorable)</option>
                            <option value={75}>75% Upfront (Cash Heavy)</option>
                            <option value={100}>100% Full Upfront Lump Sum</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-400 font-medium mb-1 text-[11px]">Future Sell-On Clause</label>
                          <select
                            value={sellOnClausePercent}
                            onChange={(e) => setSellOnClausePercent(Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-bold text-xs"
                          >
                            <option value={0}>0% (Retain Full Rights)</option>
                            <option value={10}>10% Minor Stake</option>
                            <option value={15}>15% Moderate Stake</option>
                            <option value={20}>20% High Future Cut</option>
                            <option value={25}>25% Maximum Concession</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-400 font-medium mb-1 text-[11px]">Performance Add-Ons (€)</label>
                          <input
                            type="number"
                            step={250000}
                            value={addonsAmount}
                            onChange={(e) => setAddonsAmount(Number(e.target.value))}
                            placeholder="e.g. 1,000,000"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-bold text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Targeted Club Feedback Section */}
                  {targetedFeedback && !isPresidentOfPlayerClub && (
                    <div className="pt-1">
                      <TargetedClubFeedbackView
                        feedback={targetedFeedback}
                        targetClub={targetClub}
                        onApplySuggestedStructure={handleApplySuggestedStructure}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Success Banner with Clear Finish CTA */}
              {!isPresidentOfPlayerClub && negotiationStatus === 'success' && (
                <div className="p-4 rounded-2xl bg-emerald-950/80 border-2 border-emerald-500 text-emerald-100 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-sm font-black text-emerald-300">
                    <Check className="w-5 h-5 text-emerald-400" />
                    <span>Transfer Agreement Officially Ratified!</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {negotiatingPlayer.name} has officially transferred to {targetClub.name}. Agency commission of {formatMoney(isLoanDeal ? Math.round(loanFee * 0.15) : Math.round(transferFee * (agentCommissionFee/100)))} has been deposited into your account.
                  </p>
                  <button
                    type="button"
                    onClick={handleCloseNegotiator}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black py-3 px-5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Done • Finish &amp; Return to Transfer Market</span>
                  </button>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 shrink-0">
              {isPresidentOfTargetClub ? (
                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="text-[11px] text-amber-300 flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>President Mode: Order your Sporting Director to negotiate. Terms will await your final approval.</span>
                  </div>
                  <button
                    onClick={handlePresidentOrderNegotiation}
                    disabled={isPlayerRefusing}
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-amber-950/40 disabled:opacity-50"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Order Sporting Director to Negotiate</span>
                  </button>
                </div>
              ) : isPresidentOfPlayerClub ? (
                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="text-[11px] text-amber-300 flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>President Mode: Order your Sporting Director to offload {negotiatingPlayer.name}.</span>
                  </div>
                  <button
                    onClick={handlePresidentOrderOffload}
                    className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-rose-950/40"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Order Sporting Director to Offload</span>
                  </button>
                </div>
              ) : (
                <div className="w-full flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleCloseNegotiator}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition border border-slate-700"
                  >
                    Close Window
                  </button>

                  <button
                    onClick={handleSendOffer}
                    disabled={isAiThinking || isPlayerRefusing}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition shadow-lg disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isAiThinking ? 'Negotiating with Board...' : 'Submit Terms to Sporting Director'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
