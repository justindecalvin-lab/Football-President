import React, { useState, useMemo } from 'react';
import { Player, Club, AgencyState } from '../types';
import { formatMoney, calculateSeveranceBuyoutCost, recordFinancialTransaction, generatePlayerBio } from '../utils/gameEngine';
import { safeFetchAi, generateClientPlayerBackstory, generateClientScoutReport } from '../utils/aiFallback';
import { INITIAL_AGENCY_STATE } from '../data/mockData';
import { PlayerCreatorModal } from './PlayerCreatorModal';
import { TransferNegotiationModal } from './TransferNegotiationModal';
import { evaluateClubListingRequest, ListingRequestResult, checkPlayerTransferEligibility } from '../utils/transferEvaluationEngine';
import {
  getEffectiveRole,
  executeDemandWageRenegotiation,
  executeTabloidLeak,
  executeCommercialBootDeal,
  executePersonalBrandDefense,
  executeLuxuryRetentionGift,
  executeSpecialistSkillCoach,
  executeScoutDeepDiveDossier,
  executePitchClientToManager,
  executeNationalSquadCallUp,
  executeWorkPermitFastTrack,
  executeAntiDopingAudit,
  executeDisciplinaryCitation,
  executePresidentialMeritMedal,
  executeGrassrootsAmbassador,
  executeClubContractRenewal,
  executeAwardCaptaincy,
  executeBoardroomPepTalk,
  executeSwissMedicalClinic,
  executePresidentialFine,
  executePresidentialTransferVeto,
  executeTapUpEntourage
} from '../utils/roleInteractionsEngine';
import { 
  Trophy, 
  UserCheck, 
  DollarSign, 
  Sparkles, 
  Bot, 
  Dumbbell, 
  Megaphone, 
  ShieldCheck, 
  FileText, 
  Activity, 
  Clock, 
  AlertTriangle,
  X,
  Flame,
  UserPlus,
  BookOpen,
  History,
  Building2,
  Calendar,
  Award,
  Repeat,
  ChevronRight,
  Briefcase,
  FileCheck,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lock,
  Users,
  ShoppingBag,
  Zap,
  Globe,
  Crown,
  Flag,
  FileBadge,
  Stethoscope,
  Scale,
  Ban,
  TrendingUp,
  HeartHandshake
} from 'lucide-react';

interface MyPlayersViewProps {
  players: Player[];
  agencyBalance: number;
  agency?: AgencyState;
  clubs?: Club[];
  onUpdatePlayer: (updated: Player) => void;
  onUpdateAgency?: (agency: AgencyState) => void;
  onUpdateClubs?: (clubs: Club[]) => void;
  onOpenTransferModal: (player: Player) => void;
  onOpenTab: (tab: string) => void;
  onAddPlayer?: (player: Player) => void;
  soundEnabled?: boolean;
  addToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const MyPlayersView: React.FC<MyPlayersViewProps> = ({
  players,
  agencyBalance,
  agency = INITIAL_AGENCY_STATE,
  clubs = [],
  onUpdatePlayer,
  onUpdateAgency,
  onUpdateClubs,
  onOpenTransferModal,
  onOpenTab,
  onAddPlayer,
  soundEnabled = true,
  addToast
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [negotiatingPlayer, setNegotiatingPlayer] = useState<Player | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'pitch'>('grid');
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [isLoadingAiReport, setIsLoadingAiReport] = useState(false);
  const [aiReportText, setAiReportText] = useState<string | null>(null);
  const [isLoadingBackstory, setIsLoadingBackstory] = useState(false);
  const [profileTab, setProfileTab] = useState<'bio' | 'overview' | 'role_actions' | 'commercial' | 'mentorship' | 'loyalty' | 'scout'>('bio');
  const [listingModalResult, setListingModalResult] = useState<{
    result: ListingRequestResult;
    player: Player;
    listingType: 'transfer' | 'loan';
  } | null>(null);
  const [severanceModalPlayer, setSeveranceModalPlayer] = useState<{
    player: Player;
    mode: 'mutual_consent' | 'unilateral_sack' | 'player_release_request';
  } | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [retrainingModalPlayer, setRetrainingModalPlayer] = useState<Player | null>(null);
  const [appealModalPlayer, setAppealModalPlayer] = useState<Player | null>(null);

  // Batch Operations Handlers
  const handleToggleSelectPlayer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPlayerIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAllPlayers = () => {
    if (selectedPlayerIds.length === displayedPlayers.length) {
      setSelectedPlayerIds([]);
    } else {
      setSelectedPlayerIds(displayedPlayers.map(p => p.id));
    }
  };

  const handleBatchLoanOffer = () => {
    selectedPlayerIds.forEach(id => {
      const p = players.find(x => x.id === id);
      if (p) onUpdatePlayer({ ...p, isLoanListed: true });
    });
    if (addToast) addToast(`Offered ${selectedPlayerIds.length} players to the loan market!`, 'success');
    setSelectedPlayerIds([]);
  };

  const handleBatchFitnessRest = () => {
    const cost = selectedPlayerIds.length * 10000;
    if (agency.balance < cost) {
      if (addToast) addToast(`Insufficient agency funds! Need ${formatMoney(cost)}.`, 'error');
      return;
    }
    selectedPlayerIds.forEach(id => {
      const p = players.find(x => x.id === id);
      if (p) onUpdatePlayer({ ...p, condition: Math.min(100, (p.condition ?? 95) + 30) });
    });
    if (onUpdateAgency) {
      const postAgency = recordFinancialTransaction(
        agency,
        -cost,
        'Batch Cryotherapy & Spa Recovery',
        `Restored physical match fitness (+30% condition) for ${selectedPlayerIds.length} represented clients.`,
        'staff_overhead'
      );
      onUpdateAgency(postAgency);
    }
    if (addToast) addToast(`Restored +30% condition for ${selectedPlayerIds.length} clients!`, 'success');
    setSelectedPlayerIds([]);
  };

  const handleBatchRetrain = (targetPos: string) => {
    selectedPlayerIds.forEach(id => {
      const p = players.find(x => x.id === id);
      if (p && p.position !== targetPos) {
        onUpdatePlayer({
          ...p,
          retrainingProgress: { targetPosition: targetPos, weeksRemaining: 6, totalWeeks: 6 }
        });
      }
    });
    if (addToast) addToast(`Initiated 6-week tactical retraining to ${targetPos} for ${selectedPlayerIds.length} clients!`, 'info');
    setSelectedPlayerIds([]);
  };

  const handleExecuteAppeal = (player: Player) => {
    const legalFee = 25000;
    if (agency.balance < legalFee) {
      if (addToast) addToast(`Insufficient funds for FA Legal Appeal! Need ${formatMoney(legalFee)}.`, 'error');
      return;
    }
    const isSuccess = Math.random() < 0.65;
    const newBan = isSuccess ? Math.max(0, (player.suspensionMatchesRemaining || 2) - 1) : player.suspensionMatchesRemaining;
    const isSuspended = newBan > 0;

    onUpdatePlayer({
      ...player,
      isSuspended,
      suspensionMatchesRemaining: newBan
    });

    if (onUpdateAgency) {
      const postAgency = recordFinancialTransaction(
        agency,
        -legalFee,
        `FA Disciplinary Appeal: ${player.name}`,
        `Legal team ${isSuccess ? 'successfully reduced' : 'failed to overturn'} the suspension for ${player.name}.`,
        'legal'
      );
      onUpdateAgency(postAgency);
    }

    if (addToast) {
      if (isSuccess) {
        addToast(`⚖️ Appeal Successful! Reduced suspension by 1 match for ${player.name}.`, 'success');
      } else {
        addToast(`⚖️ Appeal Rejected: Federation upheld original suspension for ${player.name}.`, 'error');
      }
    }
    setAppealModalPlayer(null);
  };

  const [page, setPage] = useState(1);
  const [faSearchQuery, setFaSearchQuery] = useState('');
  const [faPositionFilter, setFaPositionFilter] = useState('ALL');
  const ITEMS_PER_PAGE = 24;

  const effectiveRole = getEffectiveRole(agency);
  const isFA = effectiveRole === 'fa_president';
  const isOwner = effectiveRole === 'club_owner';
  const isAgent = effectiveRole === 'agent';

  const myClients = useMemo(() => players.filter(p => p.isMyClient), [players]);
  const ownedClub = useMemo(() => {
    return clubs.find(c => c.id === agency?.presidency?.clubId || c.name === agency?.presidency?.clubName) || clubs[0];
  }, [clubs, agency?.presidency]);

  const ownerSquad = useMemo(() => {
    if (!isOwner || !ownedClub) return [];
    return players.filter(p => p.clubId === ownedClub.id || p.clubName === ownedClub.name);
  }, [isOwner, ownedClub, players]);

  // Base list of players based on current role
  const allRolePlayers = useMemo(() => {
    if (isFA) return players;
    if (isOwner) return ownerSquad;
    return myClients;
  }, [isFA, players, isOwner, ownerSquad, myClients]);

  // Filtered players (with fast search & position filter for FA / large rosters)
  const displayedPlayers = useMemo(() => {
    if (!faSearchQuery.trim() && faPositionFilter === 'ALL') {
      return allRolePlayers;
    }
    const q = faSearchQuery.toLowerCase().trim();
    return allRolePlayers.filter(p => {
      if (faPositionFilter !== 'ALL' && p.position !== faPositionFilter) return false;
      if (q) {
        const matches = p.name.toLowerCase().includes(q) || 
          p.clubName.toLowerCase().includes(q) || 
          p.nationality.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [allRolePlayers, faSearchQuery, faPositionFilter]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [faSearchQuery, faPositionFilter, effectiveRole]);

  const totalPages = Math.max(1, Math.ceil(displayedPlayers.length / ITEMS_PER_PAGE));
  const paginatedPlayers = useMemo(() => {
    if (displayedPlayers.length <= ITEMS_PER_PAGE) return displayedPlayers;
    return displayedPlayers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  }, [displayedPlayers, page]);

  const homegrownCount = isOwner ? displayedPlayers.filter(p => (p.age <= 21 || p.nationality === 'England' || p.nationality === 'Spain' || p.nationality === 'Germany' || p.nationality === 'Italy')).length : 0;

  // Handle Client Contract Termination / Severance
  const handleExecuteTermination = (player: Player, mode: 'mutual_consent' | 'unilateral_sack' | 'player_release_request') => {
    const calc = calculateSeveranceBuyoutCost(player, mode);
    if (agency.balance < calc.severanceCost) {
      if (addToast) addToast(`Insufficient agency funds for severance! Need ${formatMoney(calc.severanceCost)}.`, 'error');
      return;
    }

    if (onUpdateAgency) {
      const postAgency = recordFinancialTransaction(
        {
          ...agency,
          reputation: Math.max(1, Math.min(100, agency.reputation + calc.reputationImpact))
        },
        -calc.severanceCost,
        `Contract Severance: ${player.name}`,
        `Paid ${formatMoney(calc.severanceCost)} severance golden parachute to release ${player.name} (${calc.reasonLabel}).`,
        'acquisition'
      );
      onUpdateAgency(postAgency);
    }

    const releasedPlayer: Player = {
      ...player,
      isMyClient: false,
      agentCommission: 0,
      loyalty: 50,
      unrest: undefined,
      ongoingTransferNegotiation: undefined
    };

    onUpdatePlayer(releasedPlayer);
    setSelectedPlayer(null);
    setSeveranceModalPlayer(null);

    if (addToast) {
      addToast(`👋 Representation terminated: ${player.name} released from agency roster. Severance paid: ${formatMoney(calc.severanceCost)}.`, 'info');
    }
  };

  // Request Club to List Player on Transfer or Loan
  const handleRequestClubListing = (player: Player, listingType: 'transfer' | 'loan') => {
    const isOwnedClub = agency?.presidency?.role === 'Club President' && agency?.presidency?.clubId === player.clubId;
    
    if (isOwnedClub) {
      // President owns the club - direct listing with no approval needed!
      const isNowListed = listingType === 'transfer' ? !player.isTransferListed : !player.isLoanListed;
      const updated: Player = {
        ...player,
        ...(listingType === 'transfer' ? { isTransferListed: isNowListed, transferListedByClub: isNowListed } : { isLoanListed: isNowListed, loanListedByClub: isNowListed })
      };
      onUpdatePlayer(updated);
      if (selectedPlayer?.id === player.id) setSelectedPlayer(updated);
      if (addToast) {
        addToast(
          `👑 President Mandate: ${player.name} is ${isNowListed ? 'now' : 'no longer'} ${listingType}-listed at your club.`,
          'success'
        );
      }
      return;
    }

    // Client at third-party club: evaluate club & player reaction!
    const evalResult = evaluateClubListingRequest(player, listingType, agency.currentWeek, agency.currentSeason);
    setListingModalResult({
      result: evalResult,
      player,
      listingType
    });

    if (evalResult.allowed) {
      const updated: Player = {
        ...player,
        ...(listingType === 'transfer' 
          ? { isTransferListed: true, transferListedByClub: true } 
          : { isLoanListed: true, loanListedByClub: true })
      };
      onUpdatePlayer(updated);
      if (selectedPlayer?.id === player.id) setSelectedPlayer(updated);
    }
  };

  // Generate AI Narrative Biography & Backstory (with client fallback and storage length capping)
  const handleFetchBackstory = async (player: Player) => {
    setIsLoadingBackstory(true);
    try {
      const bioText = await generatePlayerBio(player);
      const data = await safeFetchAi(
        '/api/ai/player-backstory',
        { player },
        () => generateClientPlayerBackstory(player)
      );
      const finalBio = (bioText || data.biography || '').slice(0, 350);
      const updated: Player = {
        ...player,
        biography: finalBio,
        careerHistory: data.careerHistory || player.careerHistory
      };
      onUpdatePlayer(updated);
      setSelectedPlayer(updated);
    } catch (err) {
      console.error('Error fetching player backstory:', err);
    } finally {
      setIsLoadingBackstory(false);
    }
  };

  // Open Player Profile & ensure narrative biography is populated
  const handleSelectPlayerProfile = async (player: Player) => {
    setSelectedPlayer(player);
    if (!player.biography || player.biography.length < 30) {
      setIsLoadingBackstory(true);
      try {
        const bio = (await generatePlayerBio(player)).slice(0, 350);
        const updated = { ...player, biography: bio };
        onUpdatePlayer(updated);
        setSelectedPlayer(updated);
      } catch (e) {
      } finally {
        setIsLoadingBackstory(false);
      }
    }
  };

  // Generate AI Scout Report (with client fallback and storage length capping)
  const handleFetchAiScoutReport = async (player: Player) => {
    setIsLoadingAiReport(true);
    try {
      const data = await safeFetchAi(
        '/api/ai/scout-report',
        { player, scoutName: 'Chief Scout Expert' },
        () => generateClientScoutReport(player, 'Chief Scout Expert')
      );
      const trimmedReport = (data.report || '').slice(0, 350);
      setAiReportText(trimmedReport);
      const updated = {
        ...player,
        scoutReport: {
          scoutName: 'AI Chief Scout',
          text: trimmedReport,
          isAiGenerated: data.isAiGenerated,
          date: new Date().toLocaleDateString()
        }
      };
      onUpdatePlayer(updated);
      setSelectedPlayer(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAiReport(false);
    }
  };

  // Player Actions: Hire Trainer
  const handleHireTrainer = (player: Player) => {
    if (agencyBalance < 15000) {
      alert('Need €15,000 to hire personal trainer!');
      return;
    }
    const updated: Player = {
      ...player,
      form: Math.min(99, player.form + 12),
      morale: Math.min(100, player.morale + 5)
    };
    onUpdatePlayer(updated);
    setSelectedPlayer(updated);
  };

  // Player Actions: Hire PR Campaign
  const handleHirePR = (player: Player) => {
    if (agencyBalance < 25000) {
      alert('Need €25,000 for PR Scandal Cleanup!');
      return;
    }
    const updated: Player = {
      ...player,
      personalLife: {
        ...player.personalLife,
        scandalLevel: Math.max(0, player.personalLife.scandalLevel - 20),
        socialMediaFollowers: player.personalLife.socialMediaFollowers + 50000
      }
    };
    onUpdatePlayer(updated);
    setSelectedPlayer(updated);
  };

  // Player Actions: Rebuild Loyalty
  const handleRebuildLoyalty = (player: Player, method: 'dinner' | 'bonus' | 'endorsement') => {
    let cost = 20000;
    let boost = 20;
    let label = 'Private Loyalty Dinner';

    if (method === 'bonus') {
      cost = 50000;
      boost = 35;
      label = 'Loyalty Cash Bonus';
    } else if (method === 'endorsement') {
      cost = 15000;
      boost = 25;
      label = 'Exclusive Brand Endorsement';
    }

    if (agencyBalance < cost) {
      alert(`Need ${formatMoney(cost)} to execute ${label}!`);
      return;
    }

    const newLoyalty = Math.min(100, (player.loyalty ?? 85) + boost);
    const updated: Player = {
      ...player,
      loyalty: newLoyalty,
      morale: Math.min(100, player.morale + 10)
    };

    onUpdatePlayer(updated);
    setSelectedPlayer(updated);
    alert(`Rebuilt client trust! ${player.name}'s Loyalty increased by +${boost} points to ${newLoyalty}%.`);
  };

  // Sign Commercial Brand & Boot Sponsorship Deal
  const handleSignBrandDeal = (
    player: Player,
    brandName: 'Nike Premier' | 'Adidas Elite' | 'Puma Nitro' | 'Under Armour Pro' | 'Hublot Luxury' | 'Red Bull Global',
    logoEmoji: string,
    weeklyRoyalty: number,
    upfrontBonus: number
  ) => {
    const agencyCutPercent = 0.15;
    const agencyUpfrontCut = Math.round(upfrontBonus * agencyCutPercent);
    const agencyWeeklyCut = Math.round(weeklyRoyalty * agencyCutPercent);

    const updated: Player = {
      ...player,
      morale: Math.min(100, (player.morale || 70) + 15),
      loyalty: Math.min(100, (player.loyalty || 70) + 10),
      value: Math.round(player.value * 1.08),
      personalLife: {
        ...player.personalLife,
        socialMediaFollowers: player.personalLife.socialMediaFollowers + Math.round(upfrontBonus / 4),
        endorsementEarnings: (player.personalLife.endorsementEarnings || 0) + upfrontBonus
      },
      brandEndorsement: {
        brandName,
        logoEmoji,
        weeklyRoyalty,
        agentCommissionCut: agencyWeeklyCut,
        contractWeeksRemaining: 52,
        upfrontFeePaid: upfrontBonus
      }
    };

    onUpdatePlayer(updated);
    if (selectedPlayer?.id === player.id) setSelectedPlayer(updated);

    if (agency && onUpdateAgency) {
      onUpdateAgency({
        ...agency,
        balance: agency.balance + agencyUpfrontCut,
        reputation: Math.min(100, agency.reputation + 2)
      });
    }

    if (addToast) {
      addToast(`⭐ ${player.name} signed exclusive sponsorship with ${brandName}! Agency received ${formatMoney(agencyUpfrontCut)} upfront commission (+${formatMoney(agencyWeeklyCut)}/wk).`, 'success');
    } else {
      alert(`⭐ ${player.name} signed with ${brandName}! Agency earned ${formatMoney(agencyUpfrontCut)} upfront.`);
    }
  };

  // Assign Senior Mentor to Junior Client
  const handleAssignMentor = (mentee: Player, mentor: Player) => {
    const updatedMentee: Player = {
      ...mentee,
      potential: Math.min(99, mentee.potential + 3),
      morale: Math.min(100, (mentee.morale || 70) + 20),
      loyalty: Math.min(100, (mentee.loyalty || 70) + 15),
      traits: Array.from(new Set([...mentee.traits, 'Mentored by ' + mentor.name, mentor.traits[0] || 'Leadership'])),
      mentorship: {
        mentorPlayerId: mentor.id,
        mentorName: mentor.name,
        bonusPotentialGained: 3,
        weeksActive: 1
      }
    };

    const updatedMentor: Player = {
      ...mentor,
      morale: Math.min(100, (mentor.morale || 70) + 10),
      loyalty: Math.min(100, (mentor.loyalty || 70) + 10)
    };

    onUpdatePlayer(updatedMentee);
    onUpdatePlayer(updatedMentor);
    if (selectedPlayer?.id === mentee.id) setSelectedPlayer(updatedMentee);

    if (addToast) {
      addToast(`🎓 Mentorship Established: Senior Star ${mentor.name} is now mentoring ${mentee.name} (+3 POT, +20 Morale)!`, 'success');
    } else {
      alert(`🎓 Mentorship Established: ${mentor.name} is mentoring ${mentee.name}!`);
    }
  };

  // Break active mentorship
  const handleRemoveMentorship = (mentee: Player) => {
    const updated: Player = {
      ...mentee,
      mentorship: undefined
    };
    onUpdatePlayer(updated);
    if (selectedPlayer?.id === mentee.id) setSelectedPlayer(updated);
    if (addToast) {
      addToast(`Mentorship link for ${mentee.name} dissolved.`, 'info');
    }
  };

  // Client Unrest Handlers
  const handleForceTransferRequest = (player: Player) => {
    const updated: Player = {
      ...player,
      morale: Math.min(100, player.morale + 15),
      unrest: {
        status: 'transfer_requested',
        reason: player.unrest?.reason || 'wants_new_challenge',
        reasonLabel: player.unrest?.reasonLabel || 'Wants New Challenge & Exit',
        discontentLevel: 90,
        description: `${player.name} handed in an official Transfer Request to the board of ${player.clubName}!`,
        discountPercent: 30
      }
    };
    onUpdatePlayer(updated);
    if (selectedPlayer?.id === player.id) setSelectedPlayer(updated);
    alert(`⚡ Formal Transfer Request Submitted! ${player.name} is now listed with a 30% discount on the Transfer Market.`);
    onOpenTransferModal(updated);
  };

  const handleRenegotiateWageUpgrade = (player: Player) => {
    const newWage = Math.round(player.wage * 1.35);
    const updated: Player = {
      ...player,
      wage: newWage,
      morale: Math.min(100, player.morale + 25),
      loyalty: Math.min(100, (player.loyalty || 70) + 20),
      unrest: {
        status: 'content',
        reason: 'wants_new_challenge',
        reasonLabel: 'Satisfied (Wage Bumped)',
        discontentLevel: 0,
        description: `New contract signed at €${formatMoney(newWage)}/week. Discontent resolved.`,
        discountPercent: 0
      }
    };
    onUpdatePlayer(updated);
    if (selectedPlayer?.id === player.id) setSelectedPlayer(updated);
    alert(`💰 Negotiated +35% Wage Increase (€${formatMoney(newWage)}/wk) with ${player.clubName}! Client is satisfied.`);
  };

  const handleLeakToPressDarkArts = (player: Player) => {
    const updated: Player = {
      ...player,
      unrest: {
        status: 'transfer_requested',
        reason: player.unrest?.reason || 'manager_clash',
        reasonLabel: 'Media Storm & Manager Clash',
        discontentLevel: 98,
        description: `Sensational tabloid leak exposed dressing room row at ${player.clubName}! Valuation slashed by 35%.`,
        discountPercent: 35
      }
    };
    onUpdatePlayer(updated);
    if (selectedPlayer?.id === player.id) setSelectedPlayer(updated);
    alert(`📰 Tabloid Leak Released! Press coverage ignited a transfer frenzy around ${player.name}.`);
  };

  const handlePacifyClient = (player: Player) => {
    if (agencyBalance < 15000) {
      alert('Need €15,000 for private client dinner & strategy retreat!');
      return;
    }
    const curLevel = player.unrest?.discontentLevel || 50;
    const newLevel = Math.max(0, curLevel - 35);
    const updated: Player = {
      ...player,
      morale: Math.min(100, player.morale + 15),
      unrest: {
        ...player.unrest!,
        status: newLevel < 20 ? 'content' : player.unrest?.status || 'discontent',
        discontentLevel: newLevel
      }
    };
    onUpdatePlayer(updated);
    if (selectedPlayer?.id === player.id) setSelectedPlayer(updated);
    alert(`🍷 Dinner & Roadmap Meeting Completed! ${player.name}'s discontent dropped by 35 points.`);
  };

  return (
    <div className="space-y-6">
      {/* View Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {isFA ? (
              <>
                <Globe className="w-6 h-6 text-amber-400" />
                <span>Global Athlete Registry ({displayedPlayers.length})</span>
              </>
            ) : isOwner ? (
              <>
                <Crown className="w-6 h-6 text-indigo-400" />
                <span>{ownedClub?.name || 'Club'} Senior Squad ({displayedPlayers.length}/25)</span>
              </>
            ) : (
              <>
                <Trophy className="w-6 h-6 text-emerald-400" />
                <span>My Client Roster ({displayedPlayers.length})</span>
              </>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isFA 
              ? 'Official Federation registered athletes, national team caps, disciplinary records, anti-doping clearance, and integrity status.'
              : isOwner 
                ? `25-man squad roster, homegrown quotas (minimum 8 required: currently ${homegrownCount}/8), wage bill, and youth promotions.`
                : 'Manage player contracts, performance, personal life, clauses, and transfer listings.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Homegrown badge for Club Owner */}
          {isOwner && (
            <div className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
              homegrownCount >= 8 
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
            }`}>
              <span>📋</span>
              <span>Homegrown: {homegrownCount}/8</span>
            </div>
          )}

          <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'grid' 
                  ? isFA 
                    ? 'bg-amber-500 text-slate-950' 
                    : isOwner 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-emerald-600 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isFA ? 'Directory' : isOwner ? 'Squad Cards' : 'Roster Cards'}
            </button>
            <button
              onClick={() => setViewMode('pitch')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'pitch' 
                  ? isFA 
                    ? 'bg-amber-500 text-slate-950' 
                    : isOwner 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-emerald-600 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tactical Pitch
            </button>
          </div>

          {!isFA && onAddPlayer && (
            <button
              onClick={() => setShowCreatorModal(true)}
              className={`text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-md ${
                isOwner 
                  ? 'bg-indigo-600 hover:bg-indigo-500' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isOwner ? '+ Promote Youth Talent' : '+ Create Wonderkid'}</span>
            </button>
          )}

          {!isFA && (
            <button
              onClick={() => onOpenTab('transfer_market')}
              className={`text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-md ${
                isOwner 
                  ? 'bg-indigo-600 hover:bg-indigo-500' 
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isOwner ? 'Transfer War Room' : 'Sign New Client'}</span>
            </button>
          )}

          {isFA && (
            <button
              onClick={() => onOpenTab('governance')}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-md"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>⚖️ Disciplinary Tribunal</span>
            </button>
          )}
        </div>
      </div>

      {showCreatorModal && onAddPlayer && (
        <PlayerCreatorModal
          onClose={() => setShowCreatorModal(false)}
          onAddPlayer={onAddPlayer}
          soundEnabled={soundEnabled}
        />
      )}

      {/* Client Unrest & Club Discontent Hotline Banner (Hidden for FA President) */}
      {!isFA && (() => {
        const unrestClients = displayedPlayers.filter(p => p.unrest && p.unrest.status !== 'content');
        if (unrestClients.length === 0) return null;

        return (
          <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border-2 border-red-500/80 p-5 rounded-2xl shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-red-500/30 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 font-black animate-pulse">
                  🔥
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-red-200 flex items-center gap-2">
                    <span>
                      {isOwner 
                        ? `Squad Morale & Contract Grievances (${unrestClients.length})`
                        : `Client Hotline: Active Club Issues & Unrest (${unrestClients.length})`}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    {isOwner
                      ? 'First-team squad members demanding contract upgrades, wage parity, or increased match minutes.'
                      : 'Your clients are experiencing friction with their managers or seeking new challenges. Intervene to resolve or capitalize!'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {unrestClients.map((client) => (
                <div
                  key={`unrest_${client.id}`}
                  className="bg-slate-950/80 border border-red-500/40 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{client.name}</span>
                      <span className="text-xs text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                        {client.unrest?.reasonLabel || 'Discontent'}
                      </span>
                      <span className="text-xs text-red-400 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30 font-black">
                        Discontent {client.unrest?.discontentLevel}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{client.unrest?.description}</p>
                    <p className="text-[11px] text-slate-400">
                      Current Club: <span className="text-white font-semibold">{client.clubName}</span> | Wage: <span className="text-emerald-400 font-semibold">{formatMoney(client.wage)}/wk</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleForceTransferRequest(client)}
                      className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-md"
                    >
                      <span>⚡ {isOwner ? 'Transfer List Player' : 'Submit Transfer Request'}</span>
                    </button>
                    <button
                      onClick={() => handleRenegotiateWageUpgrade(client)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-md"
                    >
                      <span>💰 {isOwner ? 'Offer Contract Upgrade' : 'Demand Wage Hike'}</span>
                    </button>
                    {!isOwner && (
                      <button
                        onClick={() => handleLeakToPressDarkArts(client)}
                        className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-md"
                      >
                        <span>📰 Leak to Tabloids</span>
                      </button>
                    )}
                    <button
                      onClick={() => handlePacifyClient(client)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      <span>🍷 Pacify (€15k)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Batch Operations Floating Toolbar */}
      {selectedPlayerIds.length > 0 && (
        <div className="bg-slate-900/95 border-2 border-amber-500/60 rounded-2xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-4 sticky top-20 z-30 backdrop-blur-md animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg">
              {selectedPlayerIds.length} Selected
            </span>
            <button
              onClick={handleSelectAllPlayers}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              {selectedPlayerIds.length === displayedPlayers.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleBatchFitnessRest}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow cursor-pointer flex items-center gap-1.5 transition"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Cryo Rest (+30% Cond · €10k/ea)</span>
            </button>

            <button
              onClick={handleBatchLoanOffer}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow cursor-pointer flex items-center gap-1.5 transition"
            >
              <Repeat className="w-3.5 h-3.5 text-white" />
              <span>Offer All on Loan</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold px-1">Retrain:</span>
              {['CDM', 'CAM', 'CB', 'LW', 'ST'].map(pos => (
                <button
                  key={pos}
                  onClick={() => handleBatchRetrain(pos)}
                  className="bg-slate-700 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-[10px] font-black px-1.5 py-0.5 rounded transition"
                >
                  {pos}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedPlayerIds([])}
              className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-1.5 rounded-xl border border-slate-700 cursor-pointer"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Bar (Active for FA or large rosters) */}
      {(isFA || allRolePlayers.length > 24) && (
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder={`Search ${allRolePlayers.length} athletes by name, club, or nationality...`}
              value={faSearchQuery}
              onChange={(e) => setFaSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">Position:</span>
            <select
              value={faPositionFilter}
              onChange={(e) => setFaPositionFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">All Positions</option>
              <option value="GK">Goalkeepers (GK)</option>
              <option value="CB">Center Backs (CB)</option>
              <option value="LB">Left Backs (LB)</option>
              <option value="RB">Right Backs (RB)</option>
              <option value="CDM">Defensive Midfielders (CDM)</option>
              <option value="CM">Central Midfielders (CM)</option>
              <option value="CAM">Attacking Midfielders (CAM)</option>
              <option value="LW">Left Wingers (LW)</option>
              <option value="RW">Right Wingers (RW)</option>
              <option value="ST">Strikers (ST)</option>
            </select>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold"
              >
                Prev
              </button>
              <span className="font-bold text-white">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Grid or Pitch View */}
      {viewMode === 'grid' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedPlayers.map((player) => {
            const isSelected = selectedPlayerIds.includes(player.id);
            return (
            <div
              key={player.id}
              className={`bg-slate-900 border ${isSelected ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-800 hover:border-emerald-500/50'} rounded-2xl p-5 shadow-xl transition space-y-4 group relative overflow-hidden`}
            >
              {/* Checkbox Selector */}
              <div className="absolute top-3 right-3 z-10">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleToggleSelectPlayer(player.id, e as any)}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-amber-400 cursor-pointer"
                />
              </div>

              {/* Top Banner & Player Info */}
              <div className="flex items-start justify-between pr-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-black shadow-inner">
                    {player.flag}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition">
                      {player.name}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <span className="text-emerald-400 font-bold">{player.position}</span>
                      {player.secondaryPositions && player.secondaryPositions.length > 0 && (
                        <span className="text-amber-400 font-extrabold text-[10px] bg-amber-500/20 px-1 rounded">
                          +{player.secondaryPositions.join('/')}
                        </span>
                      )}
                      <span>•</span>
                      <span>{player.age} yrs</span>
                      <span>•</span>
                      <span className="text-slate-200">{player.clubName}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="bg-emerald-500/20 text-emerald-400 text-sm font-black px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    OVR {player.rating}
                  </span>
                  <p className="text-[10px] text-amber-400 font-bold mt-1">POT {player.potential}</p>
                </div>
              </div>

              {/* Stats & Attributes Grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 text-center text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Form</p>
                  <p className="font-extrabold text-slate-200">{player.form} / 100</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Morale</p>
                  <p className="font-extrabold text-emerald-400">{player.morale} %</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Condition</p>
                  <p className={`font-extrabold ${(player.condition ?? 95) < 65 ? 'text-red-400' : (player.condition ?? 95) < 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {player.condition ?? 95}%
                  </p>
                </div>
              </div>

              {/* Potential Volatility & Realization Chance Banner */}
              {player.age <= 25 && (
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold">🧬 Arc:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      player.potentialVolatility === 'boom_or_bust'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : player.potentialVolatility === 'late_bloomer'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : player.potentialVolatility === 'early_peaker'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : player.potentialVolatility === 'volatile'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {player.potentialVolatility ? player.potentialVolatility.replace('_', ' ') : 'Stable'}
                    </span>
                  </div>
                  <div className="text-right text-[11px]">
                    <span className="text-slate-400">Realize: </span>
                    <strong className="text-amber-300 font-mono">
                      {Math.round((player.realizationChance ?? 0.75) * 100)}%
                    </strong>
                    {player.realizationStatus === 'bust' && (
                      <span className="ml-1 text-[9px] bg-red-500/30 text-red-300 px-1.5 py-0.5 rounded font-black">
                        BUST
                      </span>
                    )}
                    {player.realizationStatus === 'breakout' && (
                      <span className="ml-1 text-[9px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded font-black animate-pulse">
                        SURGE
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Suspension / Card Warnings & Disciplinary Tribunal Appeal */}
              {(player.isSuspended || (player.yellowCards || 0) >= 3 || (player.redCards || 0) > 0) && (
                <div className="bg-red-950/40 border border-red-500/40 px-3 py-2 rounded-xl flex items-center justify-between text-xs text-red-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>{player.isSuspended ? '🟥' : '🟨'}</span>
                    <span>
                      {player.isSuspended
                        ? `Suspended (${player.suspensionMatchesRemaining || 1} match ban)`
                        : `${player.yellowCards} Yellow Cards (Ban at 5)`}
                    </span>
                  </div>
                  {player.isSuspended && (
                    <button
                      onClick={() => setAppealModalPlayer(player)}
                      className="text-[10px] bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded font-black cursor-pointer shadow transition"
                    >
                      ⚖️ Appeal Ban
                    </button>
                  )}
                </div>
              )}

              {/* Tactical Retraining Progress Bar */}
              {player.retrainingProgress && (
                <div className="bg-amber-950/40 border border-amber-500/40 p-2.5 rounded-xl text-xs text-amber-200 space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span>🔄 Retraining: {player.position} → {player.retrainingProgress.targetPosition}</span>
                    <span className="font-mono">{player.retrainingProgress.weeksRemaining} wks left</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full transition-all duration-300"
                      style={{
                        width: `${Math.round(((player.retrainingProgress.totalWeeks - player.retrainingProgress.weeksRemaining) / player.retrainingProgress.totalWeeks) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* International Status & Injury Resistance Badges */}
              <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 bg-slate-950/40 p-2 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1">
                  <span>🛡️ Resistance:</span>
                  <span className={`font-black ${
                    (player.injuryResistance ?? 75) >= 80
                      ? 'text-emerald-400'
                      : (player.injuryResistance ?? 75) < 60
                      ? 'text-red-400'
                      : 'text-amber-300'
                  }`}>
                    {player.injuryResistance ? `${player.injuryResistance}/99` : '75/99'}
                  </span>
                </div>
                <div>
                  <span className="text-amber-300 font-bold">
                    {player.internationalStatus?.caps || 0} Caps
                  </span>
                  {(player.internationalStatus?.goals || 0) > 0 && (
                    <span className="text-slate-300 ml-1">· {player.internationalStatus?.goals} ⚽</span>
                  )}
                </div>
              </div>

              {/* Playing Time Satisfaction & Agreed Role */}
              {(() => {
                const ptSat = player.playingTimeSatisfaction ?? 85;
                const roleLabel = player.agreedPlayingTime || 'Regular Starter';
                const isDiscontent = ptSat < 45;
                const isModerate = ptSat < 75;

                return (
                  <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 font-medium">Playing Time ({roleLabel}):</span>
                      <span className={`font-bold ${isDiscontent ? 'text-red-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {ptSat}% {isDiscontent ? '⚠️ Frustrated' : isModerate ? 'Restless' : 'Content'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${isDiscontent ? 'bg-red-500' : isModerate ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${ptSat}%` }}
                      />
                    </div>
                    {(player.consecutiveWeeksBenched || 0) >= 3 && (
                      <p className="text-[9px] text-amber-300 font-semibold mt-0.5">
                        ⚠️ Benched {player.consecutiveWeeksBenched} consecutive weeks!
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Agent Loyalty Score & Conflict Trust Strain Indicator */}
              {(() => {
                const loy = player.loyalty ?? 85;
                const isLowLoyalty = loy < 40;
                return (
                  <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 font-medium">Agent Loyalty:</span>
                      <span className={`font-bold ${isLowLoyalty ? 'text-red-400' : loy < 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {loy}% {isLowLoyalty ? '⚠️ Trust Strain' : loy < 70 ? 'Moderate' : 'Loyal'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${isLowLoyalty ? 'bg-red-500' : loy < 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${loy}%` }}
                      />
                    </div>
                    {isLowLoyalty && (
                      <p className="text-[10px] text-red-300 font-bold bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30 text-center mt-1">
                        ⚠️ Lost Trust: Demands lower commission / wage bonus!
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Active Transfer Negotiation Offer Banner if Available */}
              {player.ongoingTransferNegotiation && (
                <button
                  type="button"
                  onClick={() => setNegotiatingPlayer(player)}
                  className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-between shadow-lg animate-pulse cursor-pointer border border-indigo-400/40"
                >
                  <div className="text-left">
                    <span className="block text-[10px] uppercase font-extrabold text-indigo-200 flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-amber-300" />
                      Incoming Offer ({player.ongoingTransferNegotiation.buyingClubName})
                    </span>
                    <span className="text-xs text-white font-extrabold font-mono">
                      Fee: {formatMoney(player.ongoingTransferNegotiation.offeredFee)} | {formatMoney(player.ongoingTransferNegotiation.offeredWage)}/wk
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              )}

              {/* Forced Stay Warning Banner */}
              {player.clubForcedStay && (
                <div className="bg-red-500/15 border border-red-500/40 rounded-xl p-2.5 text-xs text-red-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-red-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Club Forced Stay (Exit Blocked)</span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-tight">
                    Board rejected transfer request. Player is alienated, suffering form & morale drop with locker room friction.
                  </p>
                </div>
              )}

              {/* Financials & Commission */}
              <div className="flex items-center justify-between text-xs py-1 border-t border-b border-slate-800">
                <div>
                  <span className="text-slate-400">Market Val: </span>
                  <strong className="text-slate-200">{formatMoney(player.value)}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Agent Cut: </span>
                  <strong className="text-emerald-400">{player.agentCommission}% ({formatMoney(player.wage * (player.agentCommission/100))}/wk)</strong>
                </div>
              </div>

              {/* Status Badges for Registration, Homegrown, Listing & Transfer Window Restrictions */}
              <div className="flex gap-1.5 flex-wrap">
                {player.isRegistered === false ? (
                  <span className="text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-lg flex items-center gap-1" title="Unregistered players cannot play match lineups">
                    <XCircle className="w-3 h-3 text-red-400" />
                    <span>Unregistered (Ineligible)</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Registered</span>
                  </span>
                )}

                {player.isHomegrown && (
                  <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-lg">
                    🏠 Homegrown (HG)
                  </span>
                )}

                {player.age <= 21 && (
                  <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-lg">
                    ⚡ U-21 Youth
                  </span>
                )}

                {player.isTransferListed && (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                    🏷️ Transfer Listed
                  </span>
                )}
                {player.isLoanListed && (
                  <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-lg">
                    🔄 Loan Listed
                  </span>
                )}
                {(() => {
                  const elig = checkPlayerTransferEligibility(player, agency.currentWeek, agency.currentSeason);
                  if (!elig.canTransferPermanently && elig.isRecentlyTransferred) {
                    return (
                      <span className="text-[10px] font-black bg-amber-950/70 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>Transferred Wk {elig.lastTransferWeek || agency.currentWeek} (Loan Only)</span>
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                {/* Request Transfer List Button */}
                <button
                  type="button"
                  onClick={() => handleRequestClubListing(player, 'transfer')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    player.isTransferListed
                      ? 'bg-amber-500 text-slate-950 font-black border border-amber-400 shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                  title="Request club to place client on Transfer List"
                >
                  <span>🏷️ {player.isTransferListed ? 'Listed' : 'Req List'}</span>
                </button>

                {/* Request Loan List Button */}
                <button
                  type="button"
                  onClick={() => handleRequestClubListing(player, 'loan')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    player.isLoanListed
                      ? 'bg-sky-500 text-slate-950 font-black border border-sky-400 shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                  title="Request club to place client on Loan List"
                >
                  <RotateCcw className="w-3 h-3 text-sky-300" />
                  <span>{player.isLoanListed ? 'Loaned' : 'Req Loan'}</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedPlayer(player);
                    setAiReportText(player.scoutReport?.text || null);
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Profile</span>
                </button>

                <button
                  onClick={() => onOpenTransferModal(player)}
                  className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 py-2 px-2.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Transfer</span>
                </button>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        /* Tactical Pitch View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="text-center max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">Agency Tactical Pitch Formation</h3>
            <p className="text-xs text-slate-400">Visual representation of your clients stationed across pitch zones.</p>
          </div>

          <div className="relative w-full max-w-3xl mx-auto h-[480px] bg-gradient-to-b from-emerald-800 via-emerald-700 to-emerald-900 rounded-3xl border-4 border-emerald-500/40 p-6 shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Pitch Markings */}
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white/30" />
            <div className="absolute left-1/2 top-1/2 w-32 h-32 border-2 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 border-2 border-t-0 border-white/30" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 border-2 border-b-0 border-white/30" />

            {/* Pitch Zones: Forwards, Midfield, Defenders, Goalkeeper */}
            <div className="relative z-10 grid grid-cols-3 gap-4 text-center">
              {myClients.filter(p => ['ST', 'LW', 'RW'].includes(p.position)).map(p => (
                <div key={p.id} onClick={() => setSelectedPlayer(p)} className="bg-slate-900/90 hover:bg-slate-900 border-2 border-amber-400 text-white p-2 rounded-xl text-xs shadow-lg cursor-pointer transform hover:scale-105 transition">
                  <p className="font-black text-amber-300">{p.position}</p>
                  <p className="font-bold truncate">{p.name}</p>
                  <p className="text-[10px] text-emerald-400 font-extrabold">OVR {p.rating}</p>
                </div>
              ))}
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-4 text-center">
              {myClients.filter(p => ['CAM', 'CM', 'CDM'].includes(p.position)).map(p => (
                <div key={p.id} onClick={() => setSelectedPlayer(p)} className="bg-slate-900/90 hover:bg-slate-900 border-2 border-blue-400 text-white p-2 rounded-xl text-xs shadow-lg cursor-pointer transform hover:scale-105 transition">
                  <p className="font-black text-blue-300">{p.position}</p>
                  <p className="font-bold truncate">{p.name}</p>
                  <p className="text-[10px] text-emerald-400 font-extrabold">OVR {p.rating}</p>
                </div>
              ))}
            </div>

            <div className="relative z-10 grid grid-cols-4 gap-2 text-center">
              {myClients.filter(p => ['LB', 'CB', 'RB', 'GK'].includes(p.position)).map(p => (
                <div key={p.id} onClick={() => setSelectedPlayer(p)} className="bg-slate-900/90 hover:bg-slate-900 border-2 border-emerald-400 text-white p-2 rounded-xl text-xs shadow-lg cursor-pointer transform hover:scale-105 transition">
                  <p className="font-black text-emerald-300">{p.position}</p>
                  <p className="font-bold truncate">{p.name}</p>
                  <p className="text-[10px] text-emerald-400 font-extrabold">OVR {p.rating}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Expanded Player Profile Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-slate-950/95 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl p-5 sm:p-6 shadow-2xl relative space-y-5 my-auto max-h-[90vh] flex flex-col">
            <button
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-emerald-500/50 flex items-center justify-center text-3xl font-black shrink-0">
                {selectedPlayer.flag}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-black text-white">{selectedPlayer.name}</h3>
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                    OVR {selectedPlayer.rating}
                  </span>
                  <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2 py-0.5 rounded border border-amber-500/30">
                    POT {selectedPlayer.potential}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedPlayer.position} • {selectedPlayer.age} years old • {selectedPlayer.nationality} • <strong className="text-slate-200">{selectedPlayer.clubName}</strong>
                </p>
              </div>
            </div>

            {/* Quick Financial Snapshot */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-800/80 p-3 rounded-2xl text-center text-xs border border-slate-700/50 shrink-0">
              <div>
                <p className="text-slate-400">Market Value</p>
                <p className="text-sm font-bold text-white">{formatMoney(selectedPlayer.value)}</p>
              </div>
              <div>
                <p className="text-slate-400">Weekly Wage</p>
                <p className="text-sm font-bold text-emerald-400">{formatMoney(selectedPlayer.wage)}/wk</p>
              </div>
              <div>
                <p className="text-slate-400">Contract</p>
                <p className="text-sm font-bold text-amber-300">{selectedPlayer.contractYears} Years</p>
              </div>
              <div>
                <p className="text-slate-400">Agent Commission</p>
                <p className="text-sm font-bold text-blue-400">{selectedPlayer.agentCommission}%</p>
              </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex border-b border-slate-800 gap-2 shrink-0 overflow-x-auto pb-1">
              <button
                onClick={() => setProfileTab('bio')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  profileTab === 'bio'
                    ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Career History & Backstory</span>
              </button>

              <button
                onClick={() => setProfileTab('overview')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  profileTab === 'overview'
                    ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Contract & Specs</span>
              </button>

              <button
                onClick={() => setProfileTab('role_actions')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  profileTab === 'role_actions'
                    ? isFA
                      ? 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-500 shadow-sm'
                      : isOwner
                        ? 'bg-indigo-500/20 text-indigo-300 border-b-2 border-indigo-500 shadow-sm'
                        : 'bg-emerald-500/20 text-emerald-300 border-b-2 border-emerald-500 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Crown className={`w-3.5 h-3.5 ${isFA ? 'text-amber-400' : isOwner ? 'text-indigo-400' : 'text-emerald-400'}`} />
                <span>
                  {isFA
                    ? '🏛️ FA Presidential Directives'
                    : isOwner
                      ? '🏢 Boardroom Directives'
                      : '💼 Agent Actions & Dark Arts'}
                </span>
              </button>

              <button
                onClick={() => setProfileTab('commercial')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  profileTab === 'commercial'
                    ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-500'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Commercial & Boot Deals</span>
              </button>

              <button
                onClick={() => setProfileTab('mentorship')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  profileTab === 'mentorship'
                    ? 'bg-sky-500/10 text-sky-400 border-b-2 border-sky-500'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>Mentorship & Syndicate</span>
              </button>

              <button
                onClick={() => setProfileTab('loyalty')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  profileTab === 'loyalty'
                    ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Trust & Loyalty</span>
              </button>

              <button
                onClick={() => setProfileTab('scout')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  profileTab === 'scout'
                    ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI Intelligence Report</span>
              </button>
            </div>

            {/* Tab Content Container */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {/* TAB 1: CAREER HISTORY & FUN BACKSTORY */}
              {profileTab === 'bio' && (
                <div className="space-y-4">
                  {/* Generated Backstory Section */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-400" />
                        <h4 className="font-bold text-sm text-white">Player Backstory & Origins</h4>
                      </div>

                      <button
                        onClick={() => handleFetchBackstory(selectedPlayer)}
                        disabled={isLoadingBackstory}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-emerald-900/30"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isLoadingBackstory ? 'Crafting Backstory...' : '✨ Generate Fun AI Backstory'}</span>
                      </button>
                    </div>

                    {selectedPlayer.biography ? (
                      <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed space-y-2">
                        <p className="whitespace-pre-line">{selectedPlayer.biography}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>Generated via Gemini AI Engine</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/60 text-center space-y-2">
                        <p className="text-xs text-slate-400">
                          No custom backstory generated yet for {selectedPlayer.name}.
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Click <strong>Generate Fun AI Backstory</strong> above to spin up a fun, creative narrative powered by Gemini AI.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Past Clubs & Career History Table */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-amber-400" />
                      <h4 className="font-bold text-sm text-white">Career History & Past Clubs</h4>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-bold text-[11px]">
                            <th className="py-2 px-2">Season</th>
                            <th className="py-2 px-2">Club</th>
                            <th className="py-2 px-2 text-center">Apps</th>
                            <th className="py-2 px-2 text-center">Goals</th>
                            <th className="py-2 px-2 text-center">Assists</th>
                            <th className="py-2 px-2 text-right">Transfer / Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {(selectedPlayer.careerHistory && selectedPlayer.careerHistory.length > 0
                            ? selectedPlayer.careerHistory
                            : [
                                { season: '2025/26', clubName: selectedPlayer.clubName, appearances: selectedPlayer.stats?.appearances || 18, goals: selectedPlayer.stats?.goals || 4, assists: selectedPlayer.stats?.assists || 3, transferFee: 'Current Club' },
                                { season: '2024/25', clubName: `${selectedPlayer.nationality} Youth Academy`, appearances: 24, goals: 6, assists: 5, transferFee: 'Academy Graduate' }
                              ]
                          ).map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/50 transition">
                              <td className="py-2.5 px-2 font-mono text-amber-300 font-bold">{item.season}</td>
                              <td className="py-2.5 px-2 font-bold text-white flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                                <span>{item.clubName}</span>
                              </td>
                              <td className="py-2.5 px-2 text-center text-slate-300 font-semibold">{item.appearances}</td>
                              <td className="py-2.5 px-2 text-center text-emerald-400 font-bold">{item.goals}</td>
                              <td className="py-2.5 px-2 text-center text-blue-400 font-bold">{item.assists}</td>
                              <td className="py-2.5 px-2 text-right text-slate-400 font-mono text-[11px]">{item.transferFee || 'Signed'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: OVERVIEW & CONTRACT SPECS */}
              {profileTab === 'overview' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Contract Clauses & Off-Pitch Specs</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                      <p className="text-slate-400">Release Clause:</p>
                      <p className="font-bold text-slate-200">
                        {selectedPlayer.clauses.releaseClause ? formatMoney(selectedPlayer.clauses.releaseClause) : 'None'}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                      <p className="text-slate-400">Sell-On Clause:</p>
                      <p className="font-bold text-slate-200">
                        {selectedPlayer.clauses.sellOnPercent ? `${selectedPlayer.clauses.sellOnPercent}% to former club` : 'None'}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                      <p className="text-slate-400">Social Followers:</p>
                      <p className="font-bold text-slate-200">{selectedPlayer.personalLife.socialMediaFollowers.toLocaleString()} Fans</p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                      <p className="text-slate-400">Press Scandal Level:</p>
                      <p className={`font-bold ${selectedPlayer.personalLife.scandalLevel > 20 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {selectedPlayer.personalLife.scandalLevel}%
                      </p>
                    </div>
                  </div>

                  {/* Squad Registration & Agreed Playing Time Management Suite */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 space-y-3 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="font-extrabold text-white flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                          <span>Squad Registration & Playing Time Agreement</span>
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Enforced by Federation League Rules. Unregistered players are strictly ineligible for competitive matches.
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {selectedPlayer.isRegistered === false ? (
                          <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            <span>Unregistered (Ineligible)</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Registered for League</span>
                          </span>
                        )}

                        {selectedPlayer.isHomegrown && (
                          <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                            🏠 Homegrown
                          </span>
                        )}

                        {selectedPlayer.age <= 21 && (
                          <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                            ⚡ U-21 Youth
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
                      {/* Playing Time Satisfaction */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400 font-semibold">Playing Time Satisfaction:</span>
                          <span className={`font-bold ${(selectedPlayer.playingTimeSatisfaction ?? 85) < 45 ? 'text-red-400' : (selectedPlayer.playingTimeSatisfaction ?? 85) < 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {selectedPlayer.playingTimeSatisfaction ?? 85}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${(selectedPlayer.playingTimeSatisfaction ?? 85) < 45 ? 'bg-red-500' : (selectedPlayer.playingTimeSatisfaction ?? 85) < 75 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${selectedPlayer.playingTimeSatisfaction ?? 85}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Agreed Role: <strong className="text-white">{selectedPlayer.agreedPlayingTime || 'Regular Starter'}</strong>
                          {selectedPlayer.consecutiveWeeksBenched ? ` • ${selectedPlayer.consecutiveWeeksBenched} wks benched` : ''}
                        </p>
                      </div>

                      {/* Registration Status and Action */}
                      <div className="flex flex-col justify-between space-y-2">
                        <div>
                          <p className="text-slate-400 text-[10px] uppercase font-bold">Eligibility & Quotas</p>
                          <p className="text-slate-200 text-xs font-semibold">
                            {selectedPlayer.isRegistered === false ? '❌ Excluded from Match Lineups' : '✅ Active Match Eligible'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const newReg = selectedPlayer.isRegistered === false ? true : false;
                            const updated: Player = {
                              ...selectedPlayer,
                              isRegistered: newReg,
                              morale: newReg ? Math.min(100, selectedPlayer.morale + 10) : Math.max(10, selectedPlayer.morale - 25)
                            };
                            onUpdatePlayer(updated);
                            setSelectedPlayer(updated);
                            if (addToast) {
                              addToast(`${selectedPlayer.name} ${newReg ? 'registered' : 'deregistered'} with ${selectedPlayer.clubName}.`, newReg ? 'success' : 'error');
                            }
                          }}
                          className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            selectedPlayer.isRegistered === false
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                              : 'bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-slate-700'
                          }`}
                        >
                          {selectedPlayer.isRegistered === false ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Register {selectedPlayer.name}</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Deregister from Squad</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Agreed Playing Time Role Selectors */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-bold text-slate-300">
                        Adjust Contract Agreed Playing Time Expectation:
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {(['Star Player', 'Important Starter', 'Regular Starter', 'Squad Rotation', 'Fringe / Backup', 'Youth Prospect'] as const).map(role => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => {
                              const updated: Player = {
                                ...selectedPlayer,
                                agreedPlayingTime: role,
                                playingTimeSatisfaction: 85,
                                consecutiveWeeksBenched: 0
                              };
                              onUpdatePlayer(updated);
                              setSelectedPlayer(updated);
                              if (addToast) {
                                addToast(`Agreed playing time for ${selectedPlayer.name} updated to "${role}".`, 'success');
                              }
                            }}
                            className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition cursor-pointer text-center truncate ${
                              (selectedPlayer.agreedPlayingTime || 'Regular Starter') === role
                                ? 'bg-emerald-600 text-white border-emerald-400'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 10 FIFA Governance Contract Clauses Breakdown */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-indigo-500/30 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold text-white flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-amber-400" />
                        <span>10 FIFA Governance Contract Clauses</span>
                      </p>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                        Active Terms
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400">1. Ballon d'Or Bonus:</span>
                        <p className="font-bold text-amber-300">{selectedPlayer.clauses?.ballonDorBonus ? formatMoney(selectedPlayer.clauses.ballonDorBonus) : '€2.5M Award'}</p>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400">2. Loyalty Retention Fee:</span>
                        <p className="font-bold text-indigo-300">{selectedPlayer.clauses?.loyaltyBonus ? `${formatMoney(selectedPlayer.clauses.loyaltyBonus)}/yr` : '€1.0M/yr'}</p>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400">3. Image Rights Royalty:</span>
                        <p className="font-bold text-purple-300">{selectedPlayer.clauses?.imageRightsPercent ?? 25}% Commercial Share</p>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400">4. Auto +1 Yr Extension:</span>
                        <p className="font-bold text-sky-300">{selectedPlayer.clauses?.autoExtensionOption !== false ? 'Active (25+ Apps)' : 'Inactive'}</p>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400">5. Non-Promotion Release:</span>
                        <p className="font-bold text-red-400">{selectedPlayer.clauses?.nonPromotionReleaseFee ? formatMoney(selectedPlayer.clauses.nonPromotionReleaseFee) : '€5.0M Buyout'}</p>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400">6. 48h First Refusal:</span>
                        <p className="font-bold text-emerald-300">{selectedPlayer.clauses?.firstRefusalOption !== false ? 'Active Priority Right' : 'None'}</p>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400">7. Anti-Tampering Audit:</span>
                        <p className="font-bold text-teal-300">{selectedPlayer.clauses?.antiTamperingClause !== false ? 'Protected' : 'Standard'}</p>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400">8. Int. Cap Wage Top-Up:</span>
                        <p className="font-bold text-amber-300">+{selectedPlayer.clauses?.internationalCapBonus ? formatMoney(selectedPlayer.clauses.internationalCapBonus) : '€5k'}/wk</p>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400">9. Marquee FFP Tag:</span>
                        <p className="font-bold text-yellow-300">{selectedPlayer.clauses?.marqueeStatusClause !== false ? 'Exempt Tagged' : 'None'}</p>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400">10. Relegation Wage Floor:</span>
                        <p className="font-bold text-rose-300">{selectedPlayer.clauses?.relegationWageProtectionPercent ?? 80}% Guaranteed</p>
                      </div>
                    </div>
                  </div>

                  {/* Club Market Listing & Transfer Requests Suite */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-500/30 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-white flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-indigo-400" />
                          <span>Club Market Listing & Transfer Requests</span>
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Submit formal requests to {selectedPlayer.clubName} to list {selectedPlayer.name} on the Transfer or Loan market.
                        </p>
                      </div>

                      <div className="flex gap-1.5">
                        {selectedPlayer.isTransferListed && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                            🏷️ Transfer Listed
                          </span>
                        )}
                        {selectedPlayer.isLoanListed && (
                          <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                            🔄 Loan Listed
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleRequestClubListing(selectedPlayer, 'transfer')}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                          selectedPlayer.isTransferListed
                            ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                            : 'bg-slate-900 border-slate-800 hover:border-amber-500/50 text-slate-200'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-amber-400 flex items-center gap-1">
                            <span>🏷️</span>
                            <span>{selectedPlayer.isTransferListed ? 'Remove from Transfer List' : 'Request Transfer Listing'}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {selectedPlayer.isTransferListed ? 'Delist from global transfer market' : 'Formal demand to board to sell client'}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRequestClubListing(selectedPlayer, 'loan')}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                          selectedPlayer.isLoanListed
                            ? 'bg-sky-500/20 border-sky-500 text-sky-200'
                            : 'bg-slate-900 border-slate-800 hover:border-sky-500/50 text-slate-200'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-sky-400 flex items-center gap-1">
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{selectedPlayer.isLoanListed ? 'Remove from Loan List' : 'Request Loan Listing'}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {selectedPlayer.isLoanListed ? 'Cancel active loan availability' : 'Request temporary loan to secure minutes'}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40 text-xs">
                    <p className="text-slate-400 mb-1">Player Traits & Archetypes:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPlayer.traits.map((trait, tIdx) => (
                        <span key={tIdx} className="bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ROLE DIRECTIVES & ACTIONS */}
              {profileTab === 'role_actions' && (
                <div className="space-y-4">
                  {/* Active Role Header Banner */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                    isFA 
                      ? 'bg-amber-950/40 border-amber-500/50 text-amber-200' 
                      : isOwner 
                        ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200' 
                        : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black ${
                        isFA ? 'bg-amber-500/20 text-amber-300' : isOwner ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {isFA ? '🏛️' : isOwner ? '🏢' : '💼'}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-white flex items-center gap-2">
                          <span>{isFA ? 'Federation President Directives' : isOwner ? 'Club Owner & Boardroom Directives' : 'Football Agent Executive Suite & Dark Arts'}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                            {isFA ? 'FA President' : isOwner ? 'Club Owner' : 'Agent'}
                          </span>
                        </h4>
                        <p className="text-xs opacity-80 mt-0.5">
                          {isFA 
                            ? `Exercise sovereign statutory powers over ${selectedPlayer.name} via FIFA & Domestic FA League regulations.`
                            : isOwner
                              ? `Direct executive presidential club orders, contract renewals, discipline, and medical authorizations for ${selectedPlayer.name}.`
                              : `Deploy agency representation leverage, aggressive salary renegotiations, boot deals, and media dark arts for ${selectedPlayer.name}.`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 1. FA PRESIDENT SUITE */}
                  {isFA && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Call Up to National Squad */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/30 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-amber-300 flex items-center gap-1.5">
                                <Flag className="w-4 h-4 text-amber-400" />
                                <span>National Squad Call-Up</span>
                              </span>
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">+15 Morale</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Officially summon {selectedPlayer.name} to the senior national team lineup for upcoming international fixtures.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const res = executeNationalSquadCallUp(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              if (onUpdateAgency) onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                            }}
                            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
                          >
                            <Flag className="w-3.5 h-3.5" />
                            <span>Issue Formal Call-Up</span>
                          </button>
                        </div>

                        {/* Fast-Track Talent Work Permit */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/30 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-amber-300 flex items-center gap-1.5">
                                <FileBadge className="w-4 h-4 text-amber-400" />
                                <span>Expedite Talent Visa & Permit</span>
                              </span>
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">+10% Value</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Grant fast-track Presidential visa waiver and sovereign employment clearance, boosting international market liquidity.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const res = executeWorkPermitFastTrack(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              if (onUpdateAgency) onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-200 font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <FileBadge className="w-3.5 h-3.5 text-amber-400" />
                            <span>Grant Presidential Clearance</span>
                          </button>
                        </div>

                        {/* Anti-Doping & Biological Passport Audit */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-cyan-300 flex items-center gap-1.5">
                                <Stethoscope className="w-4 h-4 text-cyan-400" />
                                <span>Anti-Doping & Integrity Audit</span>
                              </span>
                              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold">WADA Protocol</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Order an unscheduled biological passport screening and anti-doping integrity audit.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const res = executeAntiDopingAudit(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              if (onUpdateAgency) onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Order Doping Inspection</span>
                          </button>
                        </div>

                        {/* Issue Disciplinary Citation */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-rose-500/30 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-rose-300 flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-rose-400" />
                                <span>Disciplinary Tribunal Citation</span>
                              </span>
                              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold">+4% FA Power</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Cite {selectedPlayer.name} for conduct prejudicial to football governance or on-pitch simulation.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const res = executeDisciplinaryCitation(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              if (onUpdateAgency) onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                            }}
                            className="w-full bg-slate-900 hover:bg-rose-950 border border-rose-500/40 text-rose-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Issue Citation</span>
                          </button>
                        </div>

                        {/* Presidential Merit Medal */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/30 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-amber-300 flex items-center gap-1.5">
                                <Award className="w-4 h-4 text-amber-400" />
                                <span>Presidential Fair Play Medal</span>
                              </span>
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">€10,000</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Confer the FA Presidential Honor of Sporting Merit upon {selectedPlayer.name}, boosting national reputation and morale.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const res = executePresidentialMeritMedal(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              if (onUpdateAgency) onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                            }}
                            className="w-full bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-200 font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Award className="w-3.5 h-3.5 text-amber-400" />
                            <span>Confer Medal (€10k)</span>
                          </button>
                        </div>

                        {/* Grassroots Youth Ambassador */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-emerald-500/30 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-emerald-300 flex items-center gap-1.5">
                                <HeartHandshake className="w-4 h-4 text-emerald-400" />
                                <span>Grassroots Youth Ambassador</span>
                              </span>
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">Social PR</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Appoint player as the Federation's National Grassroots Ambassador, elevating fan goodwill and youth development engagement.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const res = executeGrassrootsAmbassador(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              if (onUpdateAgency) onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Appoint Ambassador</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. CLUB OWNER SUITE */}
                  {isOwner && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Presidential Contract Renewal */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-indigo-500/30 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-indigo-300 flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-indigo-400" />
                                <span>Presidential Renewal (+2 Yrs)</span>
                              </span>
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">€100k Bonus</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Offer an executive 2-year contract extension with a €100,000 presidential signing bonus, cementing commitment to {selectedPlayer.clubName}.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const res = executeClubContractRenewal(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              if (onUpdateAgency) onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                            }}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Sign Extension (+2 Yrs)</span>
                          </button>
                        </div>

                        {/* Award Team Captaincy */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/30 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-amber-300 flex items-center gap-1.5">
                                <Crown className="w-4 h-4 text-amber-400" />
                                <span>Award Club Captaincy Armband</span>
                              </span>
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">Max Morale</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Bestow the club captain's armband upon {selectedPlayer.name}, solidifying locker room authority and squad leadership.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const res = executeAwardCaptaincy(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              if (onUpdateAgency) onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            <span>Bestow Captaincy</span>
                          </button>
                        </div>

                        {/* Boardroom Pep Talk */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-indigo-500/30 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-indigo-300 flex items-center gap-1.5">
                                <Building2 className="w-4 h-4 text-indigo-400" />
                                <span>Boardroom Executive Pep Talk</span>
                              </span>
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">+15 Form / Morale</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Invite {selectedPlayer.name} to the Presidential boardroom suite for a personal motivating discussion on title ambitions.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const res = executeBoardroomPepTalk(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              if (onUpdateAgency) onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Hold Boardroom Meeting</span>
                          </button>
                        </div>

                        {/* Swiss Zurich Medical Clinic */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-cyan-500/30 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-cyan-300 flex items-center gap-1.5">
                                <Stethoscope className="w-4 h-4 text-cyan-400" />
                                <span>Zurich Medical Clinic Rehab</span>
                              </span>
                              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold">€25,000</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Fly {selectedPlayer.name} via private jet to Zurich orthopedic specialists, clearing lingering fatigue and physical strain.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const res = executeSwissMedicalClinic(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              if (onUpdateAgency) onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Authorize Clinic (€25k)</span>
                          </button>
                        </div>

                        {/* Impose Disciplinary Fine */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-rose-500/30 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-rose-300 flex items-center gap-1.5">
                                <Ban className="w-4 h-4 text-rose-400" />
                                <span>Presidential Disciplinary Fine</span>
                              </span>
                              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold">2 Wks Wages</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Dock 2 weeks of wages for tardiness, training ground breach, or unacceptable media commentary.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const res = executePresidentialFine(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              if (onUpdateAgency) onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                            }}
                            className="w-full bg-slate-900 hover:bg-rose-950 border border-rose-500/40 text-rose-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Ban className="w-3.5 h-3.5 text-rose-400" />
                            <span>Impose Wage Fine</span>
                          </button>
                        </div>

                        {/* Presidential Transfer Veto & Lock */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-indigo-500/30 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-indigo-300 flex items-center gap-1.5">
                                <Lock className="w-4 h-4 text-indigo-400" />
                                <span>Presidential Transfer Lock</span>
                              </span>
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">Veto All Bids</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Enact an official boardroom transfer veto, declaring {selectedPlayer.name} strictly Not For Sale under any circumstances.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const res = executePresidentialTransferVeto(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              if (onUpdateAgency) onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 border border-indigo-500/40 text-indigo-200 font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Lock className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Enact Transfer Veto</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. FOOTBALL AGENT SUITE */}
                  {isAgent && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Demand +30% Wage Hike */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-emerald-500/30 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-emerald-300 flex items-center gap-1.5">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                <span>Demand +30% Wage Hike</span>
                              </span>
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">10% Agent Bonus</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Storm into {selectedPlayer.clubName}'s sporting director office demanding an immediate +30% salary upgrade and upfront agency bonus.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const res = executeDemandWageRenegotiation(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              if (onUpdateAgency) onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Demand Wage Hike</span>
                          </button>
                        </div>

                        {/* Tabloid Leak & Unrest (Dark Arts) */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-rose-500/30 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-rose-300 flex items-center gap-1.5">
                                <Megaphone className="w-4 h-4 text-rose-400" />
                                <span>Tabloid Press Leak (Dark Arts)</span>
                              </span>
                              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold">+2 Dark Arts</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Leak manufactured dressing room discord to European tabloids, slashing asking price by 25% to force an exit.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const res = executeTabloidLeak(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              if (onUpdateAgency) onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                            }}
                            className="w-full bg-slate-900 hover:bg-rose-950 border border-rose-500/40 text-rose-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Megaphone className="w-3.5 h-3.5 text-rose-400" />
                            <span>Publish Media Leak</span>
                          </button>
                        </div>

                        {/* Commercial Boot Endorsement Deal */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/30 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-amber-300 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                <span>Sportswear & Boot Endorsement</span>
                              </span>
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">+€50,000 Cut</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Broker an elite commercial boot sponsorship deal with Nike, Adidas, or Puma, yielding instant agency commissions.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const res = executeCommercialBootDeal(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              if (onUpdateAgency) onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Sign Commercial Deal</span>
                          </button>
                        </div>

                        {/* Crisis PR Defense Campaign */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-indigo-300 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                                <span>Crisis PR Defense & Reputation</span>
                              </span>
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">€30,000</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Deploy top-tier crisis public relations operatives to sanitize tabloid scandals, restore market standing, and clear player image.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const res = executePersonalBrandDefense(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              if (onUpdateAgency) onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Launch PR Defense (€15k)</span>
                          </button>
                        </div>

                        {/* Luxury Client Retention Gift */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-purple-500/30 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-purple-300 flex items-center gap-1.5">
                                <Award className="w-4 h-4 text-purple-400" />
                                <span>Luxury Retention Gift (Rolex / VIP)</span>
                              </span>
                              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold">€40,000</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Present a luxury Swiss timepiece or private yacht getaway to cement unbreakable agent loyalty and prevent rival agent poaching.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const res = executeLuxuryRetentionGift(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              if (onUpdateAgency) onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                            }}
                            className="w-full bg-slate-900 hover:bg-purple-950 border border-purple-500/40 text-purple-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Award className="w-3.5 h-3.5 text-purple-400" />
                            <span>Gift Luxury Package (€40k)</span>
                          </button>
                        </div>

                        {/* Specialist Private Skills Coach */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-sky-500/30 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-sky-300 flex items-center gap-1.5">
                                <Dumbbell className="w-4 h-4 text-sky-400" />
                                <span>Specialist Private Skills Coach</span>
                              </span>
                              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-bold">€20,000</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Hire dedicated 1-on-1 positional coaches (finishing, tactical pressing, set-pieces) to boost form (+10) and performance.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const res = executeSpecialistSkillCoach(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              if (onUpdateAgency) onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                            }}
                            className="w-full bg-slate-900 hover:bg-sky-950 border border-sky-500/40 text-sky-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Dumbbell className="w-3.5 h-3.5 text-sky-400" />
                            <span>Hire Skills Coach (€20k)</span>
                          </button>
                        </div>

                        {/* Deep-Dive Scouting Dossier */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-slate-200 flex items-center gap-1.5">
                                <FileCheck className="w-4 h-4 text-slate-400" />
                                <span>Deep-Dive Analytical Dossier</span>
                              </span>
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">€10,000</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Commission exhaustive tactical tracking metrics and expected goals (xG) metrics to pitch to prospective buying clubs.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const res = executeScoutDeepDiveDossier(selectedPlayer, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              if (onUpdateAgency) onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>Commission Dossier (€10k)</span>
                          </button>
                        </div>

                        {/* Pitch Directly to Head Coach */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-emerald-500/30 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-emerald-300 flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-emerald-400" />
                                <span>Direct Pitch to Head Coach</span>
                              </span>
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">Starting XI</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Engage the manager in direct tactical talks at the training ground to lock in an immediate Starting XI role.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const managerName = selectedPlayer.clubName ? `${selectedPlayer.clubName} Manager` : 'Head Coach';
                              const res = executePitchClientToManager(selectedPlayer, managerName, agency);
                              if (res.updatedPlayer) {
                                onUpdatePlayer(res.updatedPlayer);
                                setSelectedPlayer(res.updatedPlayer);
                              }
                              if (onUpdateAgency) onUpdateAgency(res.updatedAgency);
                              if (addToast) addToast(res.message, res.type);
                            }}
                            className="w-full bg-slate-900 hover:bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Users className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Pitch to Head Manager</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: COMMERCIAL & BOOT ENDORSEMENTS */}
              {profileTab === 'commercial' && (
                <div className="space-y-4">
                  {/* Current Active Endorsement Card */}
                  {selectedPlayer.brandEndorsement ? (
                    <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-4 rounded-2xl border-2 border-amber-500/50 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl">
                            {selectedPlayer.brandEndorsement.logoEmoji || '👟'}
                          </div>
                          <div>
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold uppercase px-2 py-0.5 rounded border border-amber-500/30">
                              Active Commercial Deal
                            </span>
                            <h4 className="text-base font-black text-white mt-0.5">
                              {selectedPlayer.brandEndorsement.brandName}
                            </h4>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-slate-400">Weekly Royalty</p>
                          <p className="text-sm font-black text-amber-400">
                            {formatMoney(selectedPlayer.brandEndorsement.weeklyRoyalty)}/wk
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <div>
                          <p className="text-slate-400">Agency Commission</p>
                          <p className="font-bold text-emerald-400">
                            +{formatMoney(selectedPlayer.brandEndorsement.agentCommissionCut)}/wk (15%)
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Contract Duration</p>
                          <p className="font-bold text-sky-400">
                            {selectedPlayer.brandEndorsement.contractWeeksRemaining} Weeks Active
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Upfront Bonus Paid</p>
                          <p className="font-bold text-amber-300">
                            {formatMoney(selectedPlayer.brandEndorsement.upfrontFeePaid || 150000)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
                      <div className="text-3xl">👟</div>
                      <h4 className="font-bold text-sm text-white">No Active Boot / Brand Sponsorship</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Negotiate an exclusive commercial sponsorship for {selectedPlayer.name}. Your agency takes an immediate 15% upfront sign-on commission and 15% weekly cut!
                      </p>
                    </div>
                  )}

                  {/* Available Brand Bids & Endorsements */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>Commercial Brand Bids & Boot Endorsement Offers</span>
                      </h4>
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                        15% Agency Commission
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { name: 'Nike Premier' as const, emoji: '👟', weekly: 35000, upfront: 200000, reqOvr: 0, desc: 'Global headline boot campaign with elite marketing reach.' },
                        { name: 'Adidas Elite' as const, emoji: '⚡', weekly: 30000, upfront: 180000, reqOvr: 0, desc: 'Signature predator boot deal + billboard sponsorships.' },
                        { name: 'Puma Nitro' as const, emoji: '🐆', weekly: 22000, upfront: 120000, reqOvr: 0, desc: 'Fast-paced agility boot line with digital influencer backing.' },
                        { name: 'Under Armour Pro' as const, emoji: '🛡️', weekly: 18000, upfront: 100000, reqOvr: 0, desc: 'High-performance athletic apparel & boot endorsement.' },
                        { name: 'Hublot Luxury' as const, emoji: '💎', weekly: 45000, upfront: 300000, reqOvr: 80, desc: 'Luxury Swiss watchmaker ambassador (Requires OVR 80+).' },
                        { name: 'Red Bull Global' as const, emoji: '🐂', weekly: 25000, upfront: 150000, reqOvr: 0, desc: 'Extreme sports & energy beverage media sponsorship.' }
                      ].map((deal) => {
                        const isEligible = selectedPlayer.rating >= deal.reqOvr;
                        const isCurrent = selectedPlayer.brandEndorsement?.brandName === deal.name;
                        const agencyUpfrontCut = Math.round(deal.upfront * 0.15);
                        const agencyWeeklyCut = Math.round(deal.weekly * 0.15);

                        return (
                          <div
                            key={deal.name}
                            className={`p-3.5 rounded-2xl border space-y-2.5 transition ${
                              isCurrent
                                ? 'bg-amber-500/10 border-amber-500'
                                : isEligible
                                ? 'bg-slate-900 border-slate-800 hover:border-amber-500/50'
                                : 'bg-slate-900/40 border-slate-800/40 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{deal.emoji}</span>
                                <div>
                                  <p className="font-bold text-xs text-white">{deal.name}</p>
                                  <p className="text-[10px] text-slate-400">{deal.desc}</p>
                                </div>
                              </div>
                              {deal.reqOvr > 0 && !isEligible && (
                                <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded font-bold border border-red-500/30">
                                  OVR {deal.reqOvr}+
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950 p-2 rounded-xl border border-slate-850">
                              <div>
                                <span className="text-slate-400">Player Royalty:</span>
                                <p className="font-bold text-amber-300">{formatMoney(deal.weekly)}/wk</p>
                              </div>
                              <div>
                                <span className="text-slate-400">Agency Cut:</span>
                                <p className="font-bold text-emerald-400">+{formatMoney(agencyWeeklyCut)}/wk</p>
                              </div>
                              <div>
                                <span className="text-slate-400">Upfront Bonus:</span>
                                <p className="font-bold text-slate-200">{formatMoney(deal.upfront)}</p>
                              </div>
                              <div>
                                <span className="text-slate-400">Agency Commission:</span>
                                <p className="font-bold text-emerald-300">+{formatMoney(agencyUpfrontCut)} Upfront</p>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={!isEligible || isCurrent}
                              onClick={() => handleSignBrandDeal(selectedPlayer, deal.name, deal.emoji, deal.weekly, deal.upfront)}
                              className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                                isCurrent
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-default'
                                  : isEligible
                                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-950/30 active:scale-98'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              {isCurrent ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Signed & Active Deal</span>
                                </>
                              ) : isEligible ? (
                                <>
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Sign Contract (+{formatMoney(agencyUpfrontCut)} Cut)</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Requires OVR {deal.reqOvr}+</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: MENTORSHIP & LOCKER ROOM SYNDICATE */}
              {profileTab === 'mentorship' && (
                <div className="space-y-4">
                  {/* Locker Room Syndicate Power Section */}
                  {(() => {
                    const teammates = myClients.filter(p => p.clubName === selectedPlayer.clubName);
                    const syndicateActive = teammates.length >= 3;

                    return (
                      <div className={`p-4 rounded-2xl border-2 space-y-3 ${
                        syndicateActive
                          ? 'bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border-indigo-500/60 shadow-xl'
                          : 'bg-slate-950/80 border-slate-800'
                      }`}>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                              syndicateActive ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300' : 'bg-slate-800 text-slate-400'
                            }`}>
                              👥
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-sm text-white">Locker Room Syndicate Power</h4>
                                {syndicateActive ? (
                                  <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded border border-indigo-500/40 animate-pulse">
                                    🔥 SYNDICATE DOMINANT (3+ Clients)
                                  </span>
                                ) : (
                                  <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded">
                                    {teammates.length}/3 Clients at Club
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Agency influence inside <strong className="text-slate-200">{selectedPlayer.clubName}</strong> dressing room.
                              </p>
                            </div>
                          </div>
                        </div>

                        {syndicateActive ? (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-900/90 p-3 rounded-xl border border-indigo-500/30">
                            <div>
                              <p className="text-slate-400">Collective Wage Leverage</p>
                              <p className="font-bold text-emerald-400">+15% Board Concession</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Board Respect</p>
                              <p className="font-bold text-indigo-300">+10% Chairman Trust</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Squad Demotion Shield</p>
                              <p className="font-bold text-amber-300">Immunity from U-18 Exile</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                            💡 Sign or transfer <strong>{3 - teammates.length} more client{3 - teammates.length > 1 ? 's' : ''}</strong> to {selectedPlayer.clubName} to activate the Locker Room Syndicate power bonuses!
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {teammates.map(t => (
                            <span key={t.id} className="text-[11px] bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg text-slate-200 font-bold flex items-center gap-1.5">
                              <span>{t.flag}</span>
                              <span>{t.name} (OVR {t.rating})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Active Mentorship Status or Assignment */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-sky-400" />
                        <h4 className="font-bold text-xs text-white">Veteran Mentorship Program</h4>
                      </div>
                      {selectedPlayer.mentorship && (
                        <span className="text-[10px] bg-sky-500/20 text-sky-300 font-bold px-2 py-0.5 rounded border border-sky-500/30">
                          Active Mentorship (+3 POT)
                        </span>
                      )}
                    </div>

                    {selectedPlayer.mentorship ? (
                      <div className="bg-slate-900 p-3.5 rounded-xl border border-sky-500/40 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-slate-400">Assigned Senior Mentor:</p>
                            <p className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
                              <span>⭐</span>
                              <span>{selectedPlayer.mentorship.mentorName}</span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMentorship(selectedPlayer)}
                            className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded-lg font-bold cursor-pointer transition"
                          >
                            Dissolve Mentorship
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          {selectedPlayer.name} has gained <strong>+3 Potential</strong> and is absorbing veteran leadership instincts.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-400">
                          Pair young talent (under 24) with senior veterans in your agency (age 26+, rating 74+) to boost their Potential (+3 POT), instill leadership traits, and enhance dressing-room harmony.
                        </p>

                        {/* List of Available Mentors */}
                        {(() => {
                          const potentialMentors = myClients.filter(
                            p => p.id !== selectedPlayer.id && p.age >= 26 && p.rating >= 74
                          );

                          if (potentialMentors.length === 0) {
                            return (
                              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                                No senior veterans (26+ yrs, 74+ OVR) available in your agency to act as mentors. Sign experienced stars to unlock pairing!
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {potentialMentors.map((mentor) => (
                                <div
                                  key={mentor.id}
                                  className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{mentor.flag}</span>
                                    <div>
                                      <p className="text-xs font-bold text-white">{mentor.name}</p>
                                      <p className="text-[10px] text-slate-400">
                                        {mentor.position} • {mentor.age} yrs • OVR {mentor.rating} • {mentor.clubName}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleAssignMentor(selectedPlayer, mentor)}
                                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition shadow-md shrink-0 active:scale-95"
                                  >
                                    Pair Mentor
                                  </button>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: TRUST & LOYALTY */}
              {profileTab === 'loyalty' && (
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Client Trust & Loyalty Management</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Current Loyalty: <strong className={(selectedPlayer.loyalty ?? 85) < 40 ? 'text-red-400' : 'text-emerald-400'}>{selectedPlayer.loyalty ?? 85}%</strong>
                      </p>
                    </div>

                    {(selectedPlayer.loyalty ?? 85) < 40 && (
                      <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold px-2.5 py-1 rounded">
                        ⚠️ Trust Strain
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => handleRebuildLoyalty(selectedPlayer, 'dinner')}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 p-2.5 rounded-xl text-left text-xs transition cursor-pointer min-h-[44px]"
                    >
                      <p className="font-bold text-emerald-400">Host Loyalty Dinner</p>
                      <p className="text-[10px] text-slate-400">Spend €20,000 (+20 Loyalty)</p>
                    </button>

                    <button
                      onClick={() => handleRebuildLoyalty(selectedPlayer, 'endorsement')}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 p-2.5 rounded-xl text-left text-xs transition cursor-pointer min-h-[44px]"
                    >
                      <p className="font-bold text-amber-300">Brand Endorsement</p>
                      <p className="text-[10px] text-slate-400">Spend €15,000 (+25 Loyalty)</p>
                    </button>

                    <button
                      onClick={() => handleRebuildLoyalty(selectedPlayer, 'bonus')}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 p-2.5 rounded-xl text-left text-xs transition cursor-pointer min-h-[44px]"
                    >
                      <p className="font-bold text-blue-400">Grant Cash Bonus</p>
                      <p className="text-[10px] text-slate-400">Spend €50,000 (+35 Loyalty)</p>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: AI SCOUT REPORT */}
              {profileTab === 'scout' && (
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-300 flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-purple-400" />
                      <span>AI Scout Deep Analysis</span>
                    </h4>
                    <button
                      onClick={() => handleFetchAiScoutReport(selectedPlayer)}
                      disabled={isLoadingAiReport}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold px-3 py-1 rounded-lg cursor-pointer transition flex items-center gap-1 disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{isLoadingAiReport ? 'Analyzing...' : 'Generate AI Report'}</span>
                    </button>
                  </div>

                  {aiReportText ? (
                    <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      {aiReportText}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Click Generate AI Report to trigger server-side Gemini intelligence analysis on this client.</p>
                  )}
                </div>
              )}
            </div>

            {/* Quick Agent Actions Footer */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800 shrink-0">
              <button
                onClick={() => handleHireTrainer(selectedPlayer)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
                <span>Hire Fitness Trainer (€15K)</span>
              </button>

              <button
                onClick={() => handleHirePR(selectedPlayer)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                <span>PR Campaign Cleanup (€25K)</span>
              </button>

              <button
                onClick={() => {
                  const mode = (selectedPlayer.unrest && selectedPlayer.unrest.discontentLevel >= 50)
                    ? 'player_release_request'
                    : 'mutual_consent';
                  setSeveranceModalPlayer({ player: selectedPlayer, mode });
                }}
                className="bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-600/40 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Terminate Representation</span>
              </button>

              <button
                onClick={() => {
                  const p = selectedPlayer;
                  setSelectedPlayer(null);
                  onOpenTransferModal(p);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Negotiate Transfer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Negotiation Modal */}
      {negotiatingPlayer && (
        <TransferNegotiationModal
          player={negotiatingPlayer}
          agency={agency}
          clubs={clubs}
          onClose={() => setNegotiatingPlayer(null)}
          onUpdatePlayer={(p) => {
            onUpdatePlayer(p);
            setNegotiatingPlayer(p);
          }}
          onUpdateAgency={onUpdateAgency || (() => {})}
          onUpdateClubs={onUpdateClubs || (() => {})}
          addToast={addToast}
        />
      )}

      {/* Club Listing Request Decision Modal */}
      {listingModalResult && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-indigo-500/40 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${
                listingModalResult.result.allowed 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}>
                {listingModalResult.result.allowed ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {listingModalResult.result.allowed ? 'Listing Request Approved!' : 'Listing Request Rejected'}
                </h3>
                <p className="text-xs text-slate-400">
                  {listingModalResult.listingType === 'transfer' ? 'Transfer Market Listing' : 'Loan Market Listing'} • {listingModalResult.player.name}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Verdict */}
              <div className={`p-3 rounded-xl border ${
                listingModalResult.result.allowed 
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              } font-bold`}>
                {listingModalResult.result.verdict}
              </div>

              {/* Player Quote */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Player Stance:</span>
                <p className="text-slate-200 italic leading-relaxed">{listingModalResult.result.playerQuote}</p>
              </div>

              {/* Director Quote */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{listingModalResult.player.clubName} Sporting Director:</span>
                <p className="text-slate-300 italic leading-relaxed">{listingModalResult.result.directorQuote}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setListingModalResult(null)}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer transition shadow-lg"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Client Severance & Contract Termination Modal */}
      {severanceModalPlayer && (() => {
        const p = severanceModalPlayer.player;
        const currentMode = severanceModalPlayer.mode;
        const calc = calculateSeveranceBuyoutCost(p, currentMode);
        const canAfford = agency.balance >= calc.severanceCost;

        return (
          <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-rose-500/40 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Client Contract Termination & Severance</h3>
                    <p className="text-xs text-slate-400">{p.name} • {p.clubName} ({formatMoney(p.wage)}/wk)</p>
                  </div>
                </div>
                <button
                  onClick={() => setSeveranceModalPlayer(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode Selector */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSeveranceModalPlayer({ player: p, mode: 'mutual_consent' })}
                  className={`py-2 px-2 rounded-lg text-[11px] font-bold transition text-center cursor-pointer ${
                    currentMode === 'mutual_consent'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mutual Buyout
                </button>

                <button
                  type="button"
                  onClick={() => setSeveranceModalPlayer({ player: p, mode: 'unilateral_sack' })}
                  className={`py-2 px-2 rounded-lg text-[11px] font-bold transition text-center cursor-pointer ${
                    currentMode === 'unilateral_sack'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Unilateral Sack (Art 17)
                </button>

                <button
                  type="button"
                  onClick={() => setSeveranceModalPlayer({ player: p, mode: 'player_release_request' })}
                  className={`py-2 px-2 rounded-lg text-[11px] font-bold transition text-center cursor-pointer ${
                    currentMode === 'player_release_request'
                      ? 'bg-amber-600 text-slate-950 font-black shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Discontent Release
                </button>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Remaining Contract Value:</span>
                  <span className="text-slate-200 font-bold">{formatMoney(calc.remainingContractTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Severance Formula:</span>
                  <span className="text-slate-300 font-bold">{calc.reasonLabel}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Reputation Impact:</span>
                  <span className={`font-bold ${calc.reputationImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {calc.reputationImpact >= 0 ? `+${calc.reputationImpact}` : calc.reputationImpact} Rep Points
                  </span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase">Required Severance Golden Parachute:</span>
                  <span className="text-base font-black text-rose-400">{formatMoney(calc.severanceCost)}</span>
                </div>
              </div>

              {/* Rationale & Warning */}
              <p className="text-xs text-slate-400 leading-relaxed">
                {currentMode === 'unilateral_sack' && "⚠️ Unilateral breach without sporting cause requires a 50% golden parachute payout pursuant to FIFA transfer regulations and incurs a minor reputation hit with industry peers."}
                {currentMode === 'mutual_consent' && "🤝 Mutual agreement structures a fair 15% settlement fee, allowing the agency and player to part ways amicably with zero reputational damage."}
                {currentMode === 'player_release_request' && "⚡ When a player is already deeply discontent (Discontent > 50%), they will accept a reduced 5% token severance to obtain immediate representation freedom."}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSeveranceModalPlayer(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={() => handleExecuteTermination(p, currentMode)}
                  className={`font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer transition shadow-lg flex items-center gap-2 ${
                    canAfford
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Confirm Termination ({formatMoney(calc.severanceCost)})</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Disciplinary Appeals Tribunal Modal */}
      {appealModalPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚖️</span>
                <h3 className="text-base font-extrabold text-white">Disciplinary Appeals Tribunal</h3>
              </div>
              <button
                onClick={() => setAppealModalPlayer(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <p className="text-slate-200 font-bold">Client: {appealModalPlayer.name}</p>
              <p className="text-slate-400">Current Suspension: <span className="text-rose-400 font-black">{appealModalPlayer.suspensionMatchesRemaining || 1} match ban</span></p>
              <p className="text-slate-400">Legal Representation Fee: <span className="text-amber-400 font-mono font-bold">€25,000</span></p>
              <p className="text-slate-400">Tribunal Leniency Probability: <span className="text-emerald-400 font-bold">65% Success Rate</span></p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Our specialized sports arbitration barristers will present mitigating video evidence and character references to the FA Disciplinary Committee to argue for a 1-match suspension reduction.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setAppealModalPlayer(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecuteAppeal(appealModalPlayer)}
                disabled={agency.balance < 25000}
                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg cursor-pointer"
              >
                Submit Appeal (€25,000)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
