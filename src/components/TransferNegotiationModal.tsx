import React, { useState } from 'react';
import { Player, Club, AgencyState, OngoingTransferNegotiation, ContractClauses } from '../types';
import { formatMoney, recordFinancialTransaction, createEscrowDealForMegaTransfer } from '../utils/gameEngine';
import { soundEngine } from '../utils/soundEffects';
import { evaluatePlayerTransferAcceptance, TransferEvaluationResult, getCurrentTransferWindowId } from '../utils/transferEvaluationEngine';
import { 
  X, 
  DollarSign, 
  Briefcase, 
  Clock, 
  Zap, 
  ChevronRight, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Building2,
  UserCheck,
  TrendingUp,
  FileCheck,
  Award,
  Shield,
  FileText,
  Percent,
  BadgeCheck,
  Coins,
  Star,
  RefreshCw,
  Lock,
  Scale,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  HeartHandshake
} from 'lucide-react';

interface TransferNegotiationModalProps {
  player: Player;
  buyingClubName?: string;
  directorName?: string;
  directorRole?: string;
  directorAvatar?: string;
  initialOfferedFee?: number;
  initialOfferedWage?: number;
  initialOfferedCommission?: number;
  agency: AgencyState;
  clubs: Club[];
  onClose: () => void;
  onUpdatePlayer: (player: Player) => void;
  onUpdateAgency: (agency: AgencyState) => void;
  onUpdateClubs?: (clubs: Club[]) => void;
  addToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const TransferNegotiationModal: React.FC<TransferNegotiationModalProps> = ({
  player,
  buyingClubName = player.ongoingTransferNegotiation?.buyingClubName || 'Interested Club',
  directorName = player.ongoingTransferNegotiation?.buyingClubDirector || 'Sporting Director',
  directorRole = player.ongoingTransferNegotiation?.buyingClubRole || 'Head of Recruitment',
  directorAvatar = player.ongoingTransferNegotiation?.directorAvatar || '🏢',
  initialOfferedFee = player.ongoingTransferNegotiation?.offeredFee || Math.round((player.value || 10000000) * 1.15),
  initialOfferedWage = player.ongoingTransferNegotiation?.offeredWage || Math.round((player.wage || 40000) * 1.25),
  initialOfferedCommission = player.ongoingTransferNegotiation?.offeredCommission || 15,
  agency,
  clubs,
  onClose,
  onUpdatePlayer,
  onUpdateAgency,
  onUpdateClubs,
  addToast
}) => {
  const existingNeg = player.ongoingTransferNegotiation;

  const [counterFee, setCounterFee] = useState<number>(
    existingNeg?.counterFee || initialOfferedFee
  );
  const [counterWage, setCounterWage] = useState<number>(
    existingNeg?.counterWage || initialOfferedWage
  );
  const [counterCommission, setCounterCommission] = useState<number>(
    existingNeg?.counterCommission || initialOfferedCommission
  );
  const [counterYears, setCounterYears] = useState<number>(
    existingNeg?.counterYears || 4
  );

  // Bosman Pre-Contract State (Winter Window & Expiring Contract)
  const isWinterWindow = (agency.currentWeek >= 20 && agency.currentWeek <= 24);
  const isExpiringContract = (player.contractYears <= 1 || player.contractExpiringSoon) && player.clubId !== 'free_agent';
  const isBosmanEligible = isWinterWindow && isExpiringContract;
  const [isPreContractMode, setIsPreContractMode] = useState<boolean>(false);
  const [signingBonus, setSigningBonus] = useState<number>(Math.round((player.value || 10000000) * 0.35));

  // Standard Contract Clauses State
  const [releaseClause, setReleaseClause] = useState<number>(
    player.clauses?.releaseClause || Math.round((player.value || 10000000) * 1.8)
  );
  const [buybackClause, setBuybackClause] = useState<number>(
    player.clauses?.buybackClause || 0
  );
  const [sellOnPercent, setSellOnPercent] = useState<number>(
    player.clauses?.sellOnPercent || 15
  );
  const [appearanceBonus, setAppearanceBonus] = useState<number>(
    player.clauses?.appearanceBonus || Math.round((player.wage || 40000) * 0.1)
  );
  const [goalBonus, setGoalBonus] = useState<number>(
    player.clauses?.goalBonus || Math.round((player.wage || 40000) * 0.15)
  );
  const [cleanSheetBonus, setCleanSheetBonus] = useState<number>(
    player.clauses?.cleanSheetBonus || Math.round((player.wage || 40000) * 0.1)
  );
  const [championsLeagueBonus, setChampionsLeagueBonus] = useState<number>(
    player.clauses?.championsLeagueBonus || 500000
  );
  const [relegationRelease, setRelegationRelease] = useState<boolean>(
    player.clauses?.relegationRelease ?? true
  );

  // 10 FIFA Governance Contract Clauses State
  const [ballonDorBonus, setBallonDorBonus] = useState<number>(player.clauses?.ballonDorBonus || 2500000);
  const [loyaltyBonus, setLoyaltyBonus] = useState<number>(player.clauses?.loyaltyBonus || 1000000);
  const [imageRightsPercent, setImageRightsPercent] = useState<number>(player.clauses?.imageRightsPercent || 25);
  const [autoExtensionOption, setAutoExtensionOption] = useState<boolean>(player.clauses?.autoExtensionOption ?? true);
  const [nonPromotionReleaseFee, setNonPromotionReleaseFee] = useState<number>(player.clauses?.nonPromotionReleaseFee || 5000000);
  const [firstRefusalOption, setFirstRefusalOption] = useState<boolean>(player.clauses?.firstRefusalOption ?? true);
  const [antiTamperingClause, setAntiTamperingClause] = useState<boolean>(player.clauses?.antiTamperingClause ?? true);
  const [internationalCapBonus, setInternationalCapBonus] = useState<number>(player.clauses?.internationalCapBonus || 5000);
  const [marqueeStatusClause, setMarqueeStatusClause] = useState<boolean>(player.clauses?.marqueeStatusClause ?? true);
  const [relegationWageProtectionPercent, setRelegationWageProtectionPercent] = useState<number>(player.clauses?.relegationWageProtectionPercent || 80);

  const [clausesTab, setClausesTab] = useState<'governance' | 'performance'>('governance');
  const [showClausesPanel, setShowClausesPanel] = useState<boolean>(true);
  const [playerSweetenerPaid, setPlayerSweetenerPaid] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'negotiate' | 'status'>('negotiate');
  const [negotiationResult, setNegotiationResult] = useState<{
    title: string;
    body: string;
    status: 'accepted' | 'countered' | 'rejected';
    finalFee?: number;
    finalWage?: number;
    finalComm?: number;
  } | null>(null);

  const buyingClub = clubs.find(c => c.name.toLowerCase() === buyingClubName.toLowerCase()) || {
    id: `club_buyer_${Date.now()}`,
    name: buyingClubName,
    shortName: buyingClubName.substring(0, 3).toUpperCase(),
    league: 'Premier League',
    continent: 'Europe',
    reputation: 85,
    transferBudget: 150000000,
    wageBudget: 25000000,
    chairmanTrust: 75,
    chairmanName: directorName,
    logoColor: 'from-blue-600 to-indigo-700',
    secondaryColor: '#3b82f6',
    points: 0,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0
  };

  const activeClauses: ContractClauses = {
    ...player.clauses,
    releaseClause: releaseClause || undefined,
    buybackClause: buybackClause || undefined,
    sellOnPercent: sellOnPercent || undefined,
    appearanceBonus: appearanceBonus || undefined,
    goalBonus: goalBonus || undefined,
    cleanSheetBonus: cleanSheetBonus || undefined,
    championsLeagueBonus: championsLeagueBonus || undefined,
    relegationRelease,
    ballonDorBonus,
    loyaltyBonus,
    imageRightsPercent,
    autoExtensionOption,
    nonPromotionReleaseFee,
    firstRefusalOption,
    antiTamperingClause,
    internationalCapBonus,
    marqueeStatusClause,
    relegationWageProtectionPercent
  };

  // Evaluate Player Destination Acceptance with Clauses
  const playerEvaluation: TransferEvaluationResult = evaluatePlayerTransferAcceptance(
    player,
    buyingClub,
    counterWage,
    false,
    agency.currentWeek,
    agency.currentSeason,
    activeClauses
  );

  const isPlayerRefusingMove = !playerEvaluation.allowed && !playerSweetenerPaid;

  // Handler to pay player sweetener bonus
  const handlePaySweetener = () => {
    if (playerEvaluation.isLockedToLoanOnly) {
      alert(`Cannot pay sweetener: ${player.name} cannot make another permanent transfer this window. Only LOAN transfers are permitted.`);
      return;
    }
    const cost = playerEvaluation.sweetenerCostRequired || 150000;
    if (agency.balance < cost) {
      alert(`Insufficient agency funds to pay ${player.name}'s relocation sweetener! Needed: ${formatMoney(cost)}, Available: ${formatMoney(agency.balance)}.`);
      return;
    }

    soundEngine.playCashSound();
    const updatedAgency = recordFinancialTransaction(
      agency,
      -cost,
      `Relocation Sweetener: ${player.name}`,
      `Paid ${formatMoney(cost)} relocation bonus to convince ${player.name} to waive transfer objections and join ${buyingClubName}.`,
      'transfer'
    );
    onUpdateAgency(updatedAgency);
    setPlayerSweetenerPaid(true);

    if (addToast) {
      addToast(`🤝 Paid ${formatMoney(cost)} relocation sweetener! ${player.name} has agreed to join ${buyingClubName}.`, 'success');
    }
  };

  // Helper to execute final Bosman Pre-Contract
  const executeFinalPreContract = (agreedSigningBonus: number, agreedWage: number, agreedComm: number) => {
    if (isPlayerRefusingMove) {
      alert(`Cannot finalize pre-contract: ${player.name} refuses terms to join ${buyingClubName}!`);
      return;
    }
    soundEngine.playSuccess();

    // Upfront Bosman Agent Commission: 12% of first year's wage + 15% of player's signing bonus
    const upfrontCommission = Math.round(agreedWage * 52 * 0.12) + Math.round(agreedSigningBonus * 0.15);

    const postDealAgency = recordFinancialTransaction(
      agency,
      upfrontCommission,
      `Bosman Pre-Contract Intermediary Fee: ${player.name}`,
      `Secured ${formatMoney(upfrontCommission)} intermediary commission for signing ${player.name} on a Bosman Pre-Contract with ${buyingClubName} effective Summer ${(agency.currentSeason || 2026) + 1}.`,
      'transfer'
    );

    const updatedPlayer: Player = {
      ...player,
      preContract: {
        targetClubId: buyingClub.id,
        targetClubName: buyingClubName,
        targetLeague: buyingClub.league || 'Premier League',
        agreedWage: agreedWage,
        contractYears: counterYears,
        signingBonus: agreedSigningBonus,
        agentPreContractCommission: upfrontCommission,
        effectiveSeason: (agency.currentSeason || 2026) + 1,
        effectiveWeek: 1,
        dateSigned: `Week ${agency.currentWeek}, Season ${agency.currentSeason}`
      },
      agentCommission: agreedComm,
      morale: 100,
      loyalty: 85,
      isTransferListed: false,
      transferListedByClub: false,
      ongoingTransferNegotiation: undefined
    };

    onUpdateAgency(postDealAgency);
    onUpdatePlayer(updatedPlayer);

    if (addToast) {
      addToast(`📜 BOSMAN PRE-CONTRACT SIGNED! ${player.name} will join ${buyingClubName} next summer! Upfront Intermediary Fee: ${formatMoney(upfrontCommission)}`, 'success');
    }

    onClose();
  };

  // Helper to execute final transfer
  const executeFinalTransfer = (agreedFee: number, agreedWage: number, agreedComm: number) => {
    if (playerEvaluation.isLockedToLoanOnly) {
      if (addToast) {
        addToast(`Transfer blocked under league rules: ${player.name} moved to ${player.clubName} in this transfer window and cannot transfer permanently again until ${playerEvaluation.nextAllowedWindowName || 'the next transfer window'}. Only loan moves are permitted.`, 'error');
      }
      return;
    }
    if (isPlayerRefusingMove) {
      if (addToast) {
        addToast(`Cannot finalize transfer: ${player.name} refuses to join ${buyingClubName}!`, 'error');
      }
      return;
    }
    soundEngine.playSuccess();

    // Commission earned
    const totalCommission = Math.round(agreedFee * (agreedComm / 100));
    const isMegaDeal = agreedFee >= 50000000;
    const upfrontCommission = isMegaDeal ? Math.round(totalCommission * 0.50) : totalCommission;

    let postDealAgency = recordFinancialTransaction(
      agency,
      upfrontCommission,
      `Transfer Commission: ${player.name}`,
      isMegaDeal 
        ? `Earned ${formatMoney(upfrontCommission)} (50% upfront liquidity) on €${(agreedFee / 1000000).toFixed(1)}M mega-transfer of ${player.name} to ${buyingClubName}. Remaining tranches placed in Escrow Vault.`
        : `Earned ${agreedComm}% agent commission on ${player.name}'s move to ${buyingClubName} for ${formatMoney(agreedFee)}.`,
      'transfer'
    );

    if (isMegaDeal) {
      const escrowDeal = createEscrowDealForMegaTransfer(
        player,
        player.clubName,
        buyingClubName,
        agreedFee,
        agreedComm,
        agency.currentWeek || 1,
        agency.currentSeason || 2026
      );
      postDealAgency = {
        ...postDealAgency,
        escrowDeals: [escrowDeal, ...(postDealAgency.escrowDeals || [])]
      };
    }

    const updatedClauses: ContractClauses = activeClauses;

    // Update Player
    const updatedPlayer: Player = {
      ...player,
      clubId: buyingClub.id,
      clubName: buyingClubName,
      wage: agreedWage,
      contractYears: counterYears,
      agentCommission: agreedComm,
      morale: 100,
      loyalty: 80,
      clauses: updatedClauses,
      lastTransferWeek: agency.currentWeek,
      lastTransferSeason: agency.currentSeason,
      lastTransferWindowId: getCurrentTransferWindowId(agency.currentSeason, agency.currentWeek),
      transferredInCurrentWindow: true,
      transferredFromClubName: player.clubName,
      isTransferListed: false,
      transferListedByClub: false,
      unrest: {
        status: 'content',
        reason: 'wants_new_challenge',
        reasonLabel: 'Satisfied (New Club Transfer)',
        discontentLevel: 0,
        description: `Successfully transferred to ${buyingClubName} on a ${counterYears}-year contract at ${formatMoney(agreedWage)}/wk with custom performance & governance clauses attached.`,
        discountPercent: 0
      },
      ongoingTransferNegotiation: undefined
    };

    // Update Clubs budgets
    if (onUpdateClubs && clubs.length > 0) {
      const updatedClubs = clubs.map(c => {
        if (c.name === buyingClubName) {
          return {
            ...c,
            transferBudget: Math.max(0, c.transferBudget - agreedFee),
            seasonSpent: (c.seasonSpent || 0) + agreedFee
          };
        }
        if (c.id === player.clubId) {
          return {
            ...c,
            transferBudget: c.transferBudget + Math.round(agreedFee * 0.9),
            seasonRevenue: (c.seasonRevenue || 0) + agreedFee
          };
        }
        return c;
      });
      onUpdateClubs(updatedClubs);
    }

    onUpdateAgency(postDealAgency);
    onUpdatePlayer(updatedPlayer);

    if (addToast) {
      addToast(
        isMegaDeal
          ? `🏦 MEGA-TRANSFER STRUCTURED! ${player.name} signs for ${buyingClubName} for ${formatMoney(agreedFee)}! Initial Liquidity: ${formatMoney(upfrontCommission)} (+3 Deferred Escrow Tranches)!`
          : `🎉 BLOCKBUSTER DEAL DONE! ${player.name} signs for ${buyingClubName}! Agent Commission: ${formatMoney(upfrontCommission)}`,
        'success'
      );
    }

    onClose();
  };

  // Action: Accept original offer immediately
  const handleAcceptOriginalOffer = () => {
    executeFinalTransfer(initialOfferedFee, initialOfferedWage, initialOfferedCommission);
  };

  // Action 1: Immediate Summit Response (Tougher Negotiation Engine)
  const handleImmediateSummit = () => {
    soundEngine.playClick();
    const playerVal = player.value || 10000000;
    const feeRatio = counterFee / Math.max(1, playerVal);
    const wageRatio = counterWage / Math.max(1000, player.wage);
    const roll = Math.random();

    // Check Buying Club Transfer Budget Limit
    const clubBudget = buyingClub.transferBudget || 50000000;
    if (counterFee > clubBudget) {
      soundEngine.playError();
      setNegotiationResult({
        title: '❌ Demands Exceed Total Club Budget',
        body: `${directorName} (${directorRole}) broke off talks immediately: "Our entire remaining transfer budget for this window is ${formatMoney(clubBudget)}. Your demand of ${formatMoney(counterFee)} is financially impossible."`,
        status: 'rejected'
      });
      const updatedPlayer: Player = {
        ...player,
        ongoingTransferNegotiation: undefined
      };
      onUpdatePlayer(updatedPlayer);
      return;
    }

    // High Commission Penalty: Over 10% triggers strict resistance
    const commissionResistance = counterCommission > 10 ? (counterCommission - 10) * 0.05 : 0;
    const effectiveFeeRatio = feeRatio + commissionResistance;

    // Tougher Thresholds
    const isSuperstar = (player.rating || 75) >= 84;
    const acceptThreshold = isSuperstar ? 1.12 : 1.05;
    const counterThreshold = isSuperstar ? 1.35 : 1.25;

    if (effectiveFeeRatio <= acceptThreshold && wageRatio <= 1.35 && (roll + (agency.reputation / 200) >= 0.35)) {
      // Accepted
      setNegotiationResult({
        title: '✅ Deal Agreed on the Spot!',
        body: `${directorName} (${directorRole}) consulted with the sporting committee and ACCEPTED your terms: ${formatMoney(counterFee)} transfer fee, ${formatMoney(counterWage)}/wk wage, and ${counterCommission}% agent commission.`,
        status: 'accepted',
        finalFee: counterFee,
        finalWage: counterWage,
        finalComm: counterCommission
      });
    } else if (effectiveFeeRatio <= counterThreshold && (roll < 0.70 || wageRatio <= 1.6)) {
      // Counter-Offer (Club pushes hard compromise)
      const compFee = Math.round(initialOfferedFee + (counterFee - initialOfferedFee) * 0.45);
      const compWage = Math.round(initialOfferedWage + (counterWage - initialOfferedWage) * 0.5);
      const compComm = Math.min(counterCommission, 10);

      setNegotiationResult({
        title: '🤝 Tough Counter-Offer Presented',
        body: `${directorName} pushed back aggressively: "${formatMoney(counterFee)} is beyond our sporting valuation. We can offer a firm ceiling of ${formatMoney(compFee)} with ${formatMoney(compWage)}/wk salary and ${compComm}% commission. Take it or we look elsewhere."`,
        status: 'countered',
        finalFee: compFee,
        finalWage: compWage,
        finalComm: compComm
      });
    } else {
      // Rejection & Talks Terminated
      soundEngine.playError();
      setNegotiationResult({
        title: '❌ Demands Rejected & Talks Walked Away',
        body: `${directorName} terminated negotiations on the spot, citing exorbitant financial demands (${formatMoney(counterFee)} fee and ${counterCommission}% commission). ${buyingClubName} has formally withdrawn their inquiry.`,
        status: 'rejected'
      });
      const updatedPlayer: Player = {
        ...player,
        ongoingTransferNegotiation: undefined
      };
      onUpdatePlayer(updatedPlayer);
    }
  };

  // Action 2: Multi-Week Dragging Negotiations
  const handleMultiWeekNegotiation = () => {
    soundEngine.playSuccess();
    const multiWeekNeg: OngoingTransferNegotiation = {
      id: `neg_tr_${Date.now()}_${player.id}`,
      buyingClubId: buyingClub.id,
      buyingClubName,
      offeredFee: initialOfferedFee,
      offeredWage: initialOfferedWage,
      offeredCommission: initialOfferedCommission,
      offeredYears: 4,
      offeredClauses: player.clauses,
      counterFee,
      counterWage,
      counterCommission,
      counterYears,
      counterClauses: activeClauses,
      weeksRemaining: 2,
      status: 'pending_buying_club',
      buyingClubDirector: directorName,
      buyingClubRole: directorRole,
      directorAvatar,
      lastResponseReasoning: `Formal counter-offer submitted for multi-week board deliberation. ${buyingClubName} will respond in upcoming matchweeks.`,
      startWeek: agency.currentWeek || 1,
      startSeason: agency.currentSeason || 2026
    };

    const updatedPlayer: Player = {
      ...player,
      ongoingTransferNegotiation: multiWeekNeg
    };

    onUpdatePlayer(updatedPlayer);

    if (addToast) {
      addToast(`⏳ Counter-offer submitted to ${buyingClubName}! Negotiations entered multi-week review.`, 'info');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="space-y-1.5 border-b border-slate-800 pb-4 pr-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> Transfer Negotiation Desk
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Buying Club: <strong className="text-white">{buyingClubName}</strong>
            </span>
          </div>

          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>Negotiate Deal for {player.name}</span>
          </h2>

          <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
            <span>OVR: <strong className="text-emerald-400">{player.rating}</strong></span>
            <span>Age: {player.age}yo</span>
            <span>Est. Market Value: <strong className="text-amber-300">{formatMoney(player.value)}</strong></span>
            <span>Current Wage: <strong className="text-slate-200">{formatMoney(player.wage)}/wk</strong></span>
          </div>
        </div>

        {/* Existing Negotiation Banner if Active */}
        {existingNeg && (
          <div className="bg-slate-950 border border-sky-500/40 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-sky-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 animate-spin text-sky-300" />
                <span>Multi-Week Negotiation Active (Status: {existingNeg.status.toUpperCase()})</span>
              </span>
              <span className="text-[10px] font-mono bg-sky-500/20 text-sky-200 px-2 py-0.5 rounded">
                {existingNeg.weeksRemaining} Wks Remaining
              </span>
            </div>
            <p className="text-xs text-slate-300 italic">
              "{existingNeg.lastResponseReasoning}"
            </p>
          </div>
        )}

        {/* Result Screen if Summit Completed */}
        {negotiationResult ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">{negotiationResult.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{negotiationResult.body}</p>
            </div>

            {negotiationResult.status !== 'rejected' && (
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Final Agreed Transfer Fee:</span>
                  <strong className="text-emerald-400 font-mono text-sm">{formatMoney(negotiationResult.finalFee)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Agreed Weekly Wage:</span>
                  <strong className="text-sky-300 font-mono">{formatMoney(negotiationResult.finalWage)}/wk</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Agency Commission Fee:</span>
                  <strong className="text-purple-300 font-mono">{negotiationResult.finalComm}% ({formatMoney(Math.round((negotiationResult.finalFee || 0) * ((negotiationResult.finalComm || 0) / 100)))})</strong>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {negotiationResult.status !== 'rejected' ? (
                <button
                  onClick={() => executeFinalTransfer(
                    negotiationResult.finalFee || counterFee,
                    negotiationResult.finalWage || counterWage,
                    negotiationResult.finalComm || counterCommission
                  )}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Finalize & Sign Blockbuster Transfer Deal</span>
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs cursor-pointer"
                >
                  Close Negotiation Desk
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Main Interactive Form */
          <div className="space-y-5">
            {/* Player Destination Acceptance & Stance Card */}
            <div className={`p-4 rounded-2xl border ${
              isPlayerRefusingMove 
                ? 'bg-rose-950/40 border-rose-500/50' 
                : 'bg-emerald-950/30 border-emerald-500/40'
            } space-y-2.5`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {isPlayerRefusingMove ? (
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                  ) : (
                    <HeartHandshake className="w-5 h-5 text-emerald-400" />
                  )}
                  <h4 className="font-bold text-xs text-white">
                    {isPlayerRefusingMove ? '⚠️ Client Transfer Objections & Destination Refusal' : '✅ Client Agrees to Destination Move'}
                  </h4>
                </div>

                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                  isPlayerRefusingMove ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {isPlayerRefusingMove ? 'REFUSING DESTINATION' : 'TERMS AGREED'}
                </span>
              </div>

              <p className="text-xs text-slate-200 italic bg-slate-900/90 p-3 rounded-xl border border-slate-800 leading-relaxed">
                {playerSweetenerPaid 
                  ? `"${player.name}: 'The relocation bonus package convinced me. I am ready to sign for ${buyingClubName}!'" (Sweetener Paid)`
                  : playerEvaluation.quote}
              </p>

              {isPlayerRefusingMove && playerEvaluation.canBribeSweetener && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 border-t border-rose-500/20">
                  <span className="text-[11px] text-rose-200">
                    Persuade client with an upfront relocation sweetener:
                  </span>
                  <button
                    type="button"
                    onClick={handlePaySweetener}
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Pay Relocation Bonus ({formatMoney(playerEvaluation.sweetenerCostRequired || 150000)})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Initial Buyer Offer Summary */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="text-2xl p-2 bg-slate-900 rounded-xl border border-slate-800">
                  {directorAvatar}
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-white">{directorName}</h4>
                  <p className="text-[10px] text-slate-400">{directorRole} — {buyingClubName}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center text-xs">
                <div className="bg-slate-900/80 p-2 rounded-xl">
                  <p className="text-[9px] uppercase font-extrabold text-slate-400">Offered Fee</p>
                  <p className="font-extrabold text-emerald-400 font-mono">{formatMoney(initialOfferedFee)}</p>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl">
                  <p className="text-[9px] uppercase font-extrabold text-slate-400">Offered Wage</p>
                  <p className="font-extrabold text-sky-300 font-mono">{formatMoney(initialOfferedWage)}/wk</p>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl">
                  <p className="text-[9px] uppercase font-extrabold text-slate-400">Agent Commission</p>
                  <p className="font-extrabold text-purple-300 font-mono">{initialOfferedCommission}%</p>
                </div>
              </div>
            </div>

            {/* Bosman Pre-Contract Option Banner (Winter Window / Expiring Contract) */}
            {isBosmanEligible && (
              <div className="bg-gradient-to-r from-amber-950/60 to-purple-950/60 border border-amber-500/40 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h4 className="font-extrabold text-xs text-amber-200">
                      Bosman Ruling Pre-Contract Window Active
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isPreContractMode;
                      setIsPreContractMode(next);
                      if (next) {
                        setCounterFee(0);
                        setCounterWage(Math.round(initialOfferedWage * 1.25));
                      } else {
                        setCounterFee(initialOfferedFee);
                        setCounterWage(initialOfferedWage);
                      }
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-black border transition cursor-pointer ${
                      isPreContractMode
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isPreContractMode ? 'PRE-CONTRACT ACTIVE' : 'SWITCH TO PRE-CONTRACT'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {player.name} has &le;1 year remaining on contract. Under FIFA Article 18.3, your agency can negotiate a <strong>Pre-Contract Free Transfer</strong> effective for next summer. Transfer fee to {player.clubName} is €0, allowing you to extract a massive player signing bonus and elevated agency intermediary commission!
                </p>
              </div>
            )}

            {/* Counter-Offer Controls */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isPreContractMode ? 'Configure Bosman Pre-Contract Terms' : 'Configure Agency Counter-Proposal'}</span>
              </h3>

              {isPreContractMode ? (
                /* Pre-Contract Signing Bonus Slider */
                <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-amber-300 flex items-center gap-1">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span>Player Signing-On Bonus</span>
                    </label>
                    <span className="text-base font-black text-amber-400 font-mono">
                      {formatMoney(signingBonus)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={1000000}
                    max={Math.max(5000000, Math.round((player.value || 10000000) * 0.6))}
                    step={250000}
                    value={signingBonus}
                    onChange={(e) => setSigningBonus(Number(e.target.value))}
                    className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                    <span>Transfer Fee to {player.clubName}: <strong className="text-emerald-400 font-mono">€0 (Free Transfer)</strong></span>
                    <span>Upfront Intermediary Fee: <strong className="text-purple-300 font-mono">{formatMoney(Math.round(counterWage * 52 * 0.12) + Math.round(signingBonus * 0.15))}</strong></span>
                  </div>
                </div>
              ) : (
                /* Standard Counter Transfer Fee */
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>Demanded Transfer Fee</span>
                    </label>
                    <span className="text-base font-black text-emerald-400 font-mono">
                      {formatMoney(counterFee)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={initialOfferedFee}
                    max={Math.round(initialOfferedFee * 2.5)}
                    step={500000}
                    value={counterFee}
                    onChange={(e) => setCounterFee(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />

                  <div className="flex gap-2">
                    {[1.0, 1.15, 1.30, 1.50].map((mult) => {
                      const calc = Math.round(initialOfferedFee * mult);
                      return (
                        <button
                          key={mult}
                          type="button"
                          onClick={() => setCounterFee(calc)}
                          className={`flex-1 text-[10px] font-bold py-1 rounded-lg border transition cursor-pointer ${
                            counterFee === calc 
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {mult === 1.0 ? 'Original' : `+${Math.round((mult - 1) * 100)}%`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Counter Wage & Commission */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Weekly Wage */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300">Player Wage Demand</label>
                    <span className="text-xs font-extrabold text-sky-300 font-mono">{formatMoney(counterWage)}/wk</span>
                  </div>
                  <input
                    type="range"
                    min={initialOfferedWage}
                    max={Math.round(initialOfferedWage * 2.2)}
                    step={2000}
                    value={counterWage}
                    onChange={(e) => setCounterWage(Number(e.target.value))}
                    className="w-full accent-sky-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Agent Commission */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Agency Commission Fee</label>
                  <div className="flex gap-1.5">
                    {[10, 12, 15, 18, 20].map((comm) => (
                      <button
                        key={comm}
                        type="button"
                        onClick={() => setCounterCommission(comm)}
                        className={`flex-1 text-xs font-bold py-1.5 rounded-lg border transition cursor-pointer ${
                          counterCommission === comm
                            ? 'bg-purple-500 text-white border-purple-400 font-black'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {comm}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contract Clauses Panel (Governance & Performance) */}
              <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-4 space-y-3">
                <div 
                  onClick={() => setShowClausesPanel(!showClausesPanel)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                      Contract Governance & Performance Clauses
                    </h4>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                      Active
                    </span>
                  </div>
                  <button type="button" className="text-slate-400 hover:text-white">
                    {showClausesPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {showClausesPanel && (
                  <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                    {/* Clauses Sub-tab Switcher */}
                    <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 gap-1">
                      <button
                        type="button"
                        onClick={() => setClausesTab('governance')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          clausesTab === 'governance'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" /> FIFA Governance (10 Clauses)
                      </button>
                      <button
                        type="button"
                        onClick={() => setClausesTab('performance')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          clausesTab === 'performance'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" /> Performance & Release Terms
                      </button>
                    </div>

                    {clausesTab === 'performance' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Minimum Fee Release Clause */}
                        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-amber-300 flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              <span>Release Clause</span>
                            </span>
                            <span className="font-mono text-amber-400 font-bold">{formatMoney(releaseClause)}</span>
                          </div>
                          <input
                            type="range"
                            min={Math.round((player.value || 10000000) * 0.8)}
                            max={Math.round((player.value || 10000000) * 3.5)}
                            step={1000000}
                            value={releaseClause}
                            onChange={(e) => setReleaseClause(Number(e.target.value))}
                            className="w-full accent-amber-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Sell-On Clause % */}
                        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-purple-300 flex items-center gap-1">
                              <Percent className="w-3.5 h-3.5 text-purple-400" />
                              <span>Future Sell-On Clause</span>
                            </span>
                            <span className="font-mono text-purple-300 font-bold">{sellOnPercent}% Profit</span>
                          </div>
                          <div className="flex gap-1">
                            {[0, 10, 15, 20, 25].map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => setSellOnPercent(pct)}
                                className={`flex-1 text-[10px] py-1 rounded border ${
                                  sellOnPercent === pct ? 'bg-purple-600 text-white font-bold' : 'bg-slate-950 text-slate-400'
                                }`}
                              >
                                {pct}%
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Appearance Bonus */}
                        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-sky-300 flex items-center gap-1">
                              <Coins className="w-3.5 h-3.5 text-sky-400" />
                              <span>Appearance Bonus</span>
                            </span>
                            <span className="font-mono text-sky-300 font-bold">{formatMoney(appearanceBonus)}/match</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={Math.round((counterWage || 40000) * 0.4)}
                            step={1000}
                            value={appearanceBonus}
                            onChange={(e) => setAppearanceBonus(Number(e.target.value))}
                            className="w-full accent-sky-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Goal / Clean Sheet Bonus */}
                        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-emerald-300 flex items-center gap-1">
                              <Award className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{player.position === 'GK' || player.position === 'CB' || player.position === 'LB' || player.position === 'RB' ? 'Clean Sheet Bonus' : 'Goal Bonus'}</span>
                            </span>
                            <span className="font-mono text-emerald-300 font-bold">
                              {player.position === 'GK' || player.position === 'CB' || player.position === 'LB' || player.position === 'RB' 
                                ? `${formatMoney(cleanSheetBonus)}/shutout`
                                : `${formatMoney(goalBonus)}/goal`}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={Math.round((counterWage || 40000) * 0.5)}
                            step={1000}
                            value={player.position === 'GK' || player.position === 'CB' || player.position === 'LB' || player.position === 'RB' ? cleanSheetBonus : goalBonus}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (player.position === 'GK' || player.position === 'CB' || player.position === 'LB' || player.position === 'RB') {
                                setCleanSheetBonus(val);
                              } else {
                                setGoalBonus(val);
                              }
                            }}
                            className="w-full accent-emerald-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Champions League Bonus */}
                        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-amber-300 flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-400" />
                              <span>UCL Qualification Bonus</span>
                            </span>
                            <span className="font-mono text-amber-300 font-bold">{formatMoney(championsLeagueBonus)}</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={2000000}
                            step={100000}
                            value={championsLeagueBonus}
                            onChange={(e) => setChampionsLeagueBonus(Number(e.target.value))}
                            className="w-full accent-amber-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Relegation Free Release */}
                        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-rose-300 flex items-center gap-1">
                              <Scale className="w-3.5 h-3.5 text-rose-400" />
                              <span>Relegation Free Release</span>
                            </span>
                            <p className="text-[10px] text-slate-400">Free agent status if relegated</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setRelegationRelease(!relegationRelease)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer border ${
                              relegationRelease ? 'bg-rose-500 text-white border-rose-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            {relegationRelease ? 'INCLUDED' : 'NONE'}
                          </button>
                        </div>
                      </div>
                    ) : (
                    /* Grid for 10 FIFA Governance Clauses */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Clause 1: Ballon d'Or / Golden Boot Bonus */}
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-amber-300 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-amber-400" />
                            <span>1. Ballon d'Or Bonus</span>
                          </span>
                          <span className="font-mono text-emerald-400 font-bold">{formatMoney(ballonDorBonus)}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={5000000}
                          step={250000}
                          value={ballonDorBonus}
                          onChange={(e) => setBallonDorBonus(Number(e.target.value))}
                          className="w-full accent-amber-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Clause 2: Annual Loyalty Fee */}
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-indigo-300 flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-indigo-400" />
                            <span>2. Loyalty Retention Fee</span>
                          </span>
                          <span className="font-mono text-emerald-400 font-bold">{formatMoney(loyaltyBonus)}/yr</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={2000000}
                          step={100000}
                          value={loyaltyBonus}
                          onChange={(e) => setLoyaltyBonus(Number(e.target.value))}
                          className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Clause 3: Image Rights Share */}
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-purple-300 flex items-center gap-1">
                            <Percent className="w-3.5 h-3.5 text-purple-400" />
                            <span>3. Image Rights Royalty</span>
                          </span>
                          <span className="font-mono text-purple-300 font-bold">{imageRightsPercent}% Share</span>
                        </div>
                        <div className="flex gap-1">
                          {[10, 20, 25, 35, 50].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setImageRightsPercent(pct)}
                              className={`flex-1 text-[10px] py-1 rounded border ${
                                imageRightsPercent === pct ? 'bg-purple-600 text-white font-bold' : 'bg-slate-950 text-slate-400'
                              }`}
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Clause 4: Auto 1-Year Extension Trigger */}
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-sky-300 flex items-center gap-1">
                            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                            <span>4. Auto +1 Yr Extension</span>
                          </span>
                          <p className="text-[10px] text-slate-400">Trigger on 25+ match apps</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAutoExtensionOption(!autoExtensionOption)}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer border ${
                            autoExtensionOption ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          {autoExtensionOption ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </div>

                      {/* Clause 5: Non-Promotion Release Fee */}
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-red-300 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-red-400" />
                            <span>5. Non-Promotion Buyout</span>
                          </span>
                          <span className="font-mono text-red-400 font-bold">{formatMoney(nonPromotionReleaseFee)}</span>
                        </div>
                        <input
                          type="range"
                          min={1000000}
                          max={15000000}
                          step={500000}
                          value={nonPromotionReleaseFee}
                          onChange={(e) => setNonPromotionReleaseFee(Number(e.target.value))}
                          className="w-full accent-red-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Clause 6: 48h Right of First Refusal */}
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-emerald-300 flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-emerald-400" />
                            <span>6. 48h Right of First Refusal</span>
                          </span>
                          <p className="text-[10px] text-slate-400">Match accepted transfer bids</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFirstRefusalOption(!firstRefusalOption)}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer border ${
                            firstRefusalOption ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          {firstRefusalOption ? 'ACTIVE' : 'OFF'}
                        </button>
                      </div>

                      {/* Clause 7: Anti-Tampering Immunity */}
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-teal-300 flex items-center gap-1">
                            <BadgeCheck className="w-3.5 h-3.5 text-teal-400" />
                            <span>7. Anti-Tampering Immunity</span>
                          </span>
                          <p className="text-[10px] text-slate-400">FIFA legal audit protection</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAntiTamperingClause(!antiTamperingClause)}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer border ${
                            antiTamperingClause ? 'bg-teal-500 text-slate-950 border-teal-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          {antiTamperingClause ? 'PROTECTED' : 'OFF'}
                        </button>
                      </div>

                      {/* Clause 8: Senior National Cap Top-up */}
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-amber-300 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-400" />
                            <span>8. Int. Cap Wage Top-up</span>
                          </span>
                          <span className="font-mono text-amber-300 font-bold">+{formatMoney(internationalCapBonus)}/wk</span>
                        </div>
                        <input
                          type="range"
                          min={1000}
                          max={15000}
                          step={1000}
                          value={internationalCapBonus}
                          onChange={(e) => setInternationalCapBonus(Number(e.target.value))}
                          className="w-full accent-amber-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Clause 9: Marquee Player FFP Wage Cap Exemption Tag */}
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-yellow-300 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-yellow-400" />
                            <span>9. Marquee FFP Exemption</span>
                          </span>
                          <p className="text-[10px] text-slate-400">Exempt from squad wage caps</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMarqueeStatusClause(!marqueeStatusClause)}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer border ${
                            marqueeStatusClause ? 'bg-yellow-400 text-slate-950 border-yellow-300' : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          {marqueeStatusClause ? 'TAGGED' : 'OFF'}
                        </button>
                      </div>

                      {/* Clause 10: Relegation Wage Floor Protection */}
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-rose-300 flex items-center gap-1">
                            <Scale className="w-3.5 h-3.5 text-rose-400" />
                            <span>10. Relegation Wage Floor</span>
                          </span>
                          <span className="font-mono text-rose-300 font-bold">{relegationWageProtectionPercent}% Min Wage</span>
                        </div>
                        <input
                          type="range"
                          min={50}
                          max={100}
                          step={5}
                          value={relegationWageProtectionPercent}
                          onChange={(e) => setRelegationWageProtectionPercent(Number(e.target.value))}
                          className="w-full accent-rose-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Core Action Choice Buttons */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                Select Negotiation Execution Strategy:
              </p>

              {/* Choice A: Immediate Summit or Pre-Contract Signing */}
              {isPreContractMode ? (
                <button
                  type="button"
                  onClick={() => executeFinalPreContract(signingBonus, counterWage, counterCommission)}
                  className="w-full bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-slate-950 font-black text-xs p-3.5 rounded-2xl transition cursor-pointer flex items-center justify-between gap-2 shadow-xl active:scale-98"
                >
                  <div className="text-left">
                    <p className="font-extrabold text-xs text-white">📜 Ratify & Sign Bosman Pre-Contract</p>
                    <p className="text-[10px] text-amber-100 font-normal">Commit to free summer move + pocket {formatMoney(Math.round(counterWage * 52 * 0.12) + Math.round(signingBonus * 0.15))} upfront agency commission</p>
                  </div>
                  <Check className="w-5 h-5 text-white" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleImmediateSummit}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs p-3.5 rounded-2xl transition cursor-pointer flex items-center justify-between gap-2 shadow-lg active:scale-98"
                >
                  <div className="text-left">
                    <p className="font-extrabold text-xs">⚡ Demand Immediate Board Summit</p>
                    <p className="text-[10px] text-emerald-100 font-normal">Force instant decision on counter-fee {formatMoney(counterFee)}</p>
                  </div>
                  <Zap className="w-4 h-4 text-emerald-200" />
                </button>
              )}

              {/* Choice B: Multi-Week Dragging Negotiations */}
              <button
                type="button"
                onClick={handleMultiWeekNegotiation}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs p-3.5 rounded-2xl transition cursor-pointer flex items-center justify-between gap-2 shadow-lg active:scale-98"
              >
                <div className="text-left">
                  <p className="font-extrabold text-xs">⏳ Enter Multi-Week Negotiation Review (Drag for Weeks)</p>
                  <p className="text-[10px] text-indigo-100 font-normal">Allow {buyingClubName} 1-3 weeks to deliberate with board & scouts</p>
                </div>
                <Clock className="w-4 h-4 text-indigo-200" />
              </button>

              {/* Quick Accept */}
              <button
                type="button"
                onClick={handleAcceptOriginalOffer}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs p-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Accept Original Offered Terms Immediately ({formatMoney(initialOfferedFee)})</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
