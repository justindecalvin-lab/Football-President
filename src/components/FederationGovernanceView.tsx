import React, { useState, useEffect, useMemo } from 'react';
import { AgencyState, PresidencyState, ElectionCampaign, Club, Player } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { soundEngine } from '../utils/soundEffects';
import { getFederationScenarios, FederationActionScenario } from '../utils/federationScenariosEngine';
import { 
  getClubFfpDetails,
  getBatchClubFfpMap,
  executeClubSanctions, 
  restructureClientContract, 
  bulkRestructureClientsAtRisk 
} from '../utils/ffpEngine';
import { 
  Globe, 
  Award, 
  Vote, 
  ShieldAlert, 
  DollarSign, 
  Sliders, 
  Building2, 
  Zap, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Crown,
  Lock,
  Flame,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  Landmark,
  FileText,
  Users,
  Search,
  Check,
  Percent,
  Scale,
  Clock,
  ArrowUpRight,
  BadgeCheck,
  FileSpreadsheet,
  Filter,
  Shield,
  Coins,
  Briefcase,
  Ban,
  TrendingDown,
  Handshake
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FederationTreasuryTab } from './FederationTreasuryTab';
import { DisciplinaryTribunalCourt } from './DisciplinaryTribunalCourt';

interface FederationGovernanceViewProps {
  agency: AgencyState;
  clubs?: Club[];
  players?: Player[];
  onUpdateAgency: (agency: AgencyState) => void;
  onUpdatePlayer?: (player: Player) => void;
  onUpdateClub?: (club: Club) => void;
  addToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const FederationGovernanceView: React.FC<FederationGovernanceViewProps> = ({
  agency,
  clubs = [],
  players = [],
  onUpdateAgency,
  onUpdatePlayer,
  onUpdateClub,
  addToast
}) => {
  const notify = (msg: string, type: "success" | "error" | "info" = "info") => {
    if (addToast) addToast(msg, type);
  };
  const [activeTab, setActiveTab] = useState<
    'certification' | 'federation_treasury' | 'tribunal_court' | 'league_reform' | 'ffp_monitor' | 'career_path' | 'campaign' | 'policies' | 'conflict_ethics' | 'global_suite' | 'executive_hearings'
  >('certification');
  const [isSimulatingVote, setIsSimulatingVote] = useState(false);
  const [isLegislating, setIsLegislating] = useState(false);
  const [legislativeProgress, setLegislativeProgress] = useState(0);

  // -------------------------------------------------------------------------
  // Feature 1: Agent Certification & Seasonal Agency License Approvals State
  // -------------------------------------------------------------------------
  const [applicantAgencies, setApplicantAgencies] = useState([
    {
      id: 'app_1',
      name: 'Samba Stars Talent Group',
      founder: 'Rivaldo Silva',
      region: 'South America (Brazil / Argentina)',
      specialty: 'Youth Wonderkids & South American Imports',
      proposedFee: '10% Commission Cap',
      licensingFee: 3000000,
      reputationScore: 78,
      status: 'pending' as 'pending' | 'approved' | 'rejected'
    },
    {
      id: 'app_2',
      name: 'Alpine Global Sports Management',
      founder: 'Markus Weber',
      region: 'Central Europe (Germany / Switzerland)',
      specialty: 'Tactical Coaches & Bundesliga Stars',
      proposedFee: '12% Commission Cap',
      licensingFee: 4500000,
      reputationScore: 84,
      status: 'pending' as 'pending' | 'approved' | 'rejected'
    },
    {
      id: 'app_3',
      name: 'Iberian Apex Agency',
      founder: 'Carlos Gomez',
      region: 'Southern Europe (Spain / Portugal)',
      specialty: 'La Liga Pros & Release Clause Dealmaking',
      proposedFee: '15% Commission Cap',
      licensingFee: 5000000,
      reputationScore: 89,
      status: 'pending' as 'pending' | 'approved' | 'rejected'
    },
    {
      id: 'app_4',
      name: 'Nordic Prodigy Representation',
      founder: 'Einar Lindqvist',
      region: 'Scandinavia & North America',
      specialty: 'Data Analytics & Physical Athletes',
      proposedFee: '8% Commission Cap',
      licensingFee: 2500000,
      reputationScore: 72,
      status: 'pending' as 'pending' | 'approved' | 'rejected'
    }
  ]);

  const handleApproveAgencyApplication = (appId: string) => {
    if (agency.activeRoles?.currentRole !== 'fa_president') {
      notify('🔒 FA President Authority Required: You must be elected and active as FA / Competition President to approve or deny agency licensing applications.');
      return;
    }

    const target = applicantAgencies.find(a => a.id === appId);
    if (!target) return;

    setApplicantAgencies(prev => prev.map(a => a.id === appId ? { ...a, status: 'approved' } : a));

    onUpdateAgency({
      ...agency,
      balance: agency.balance + target.licensingFee,
      reputation: Math.min(100, agency.reputation + 3)
    });

    if (agency.soundEnabled) soundEngine.playCashSound();
    confetti({ particleCount: 70, spread: 70 });
    notify(`🏛️ Agency License Granted! ${target.name} approved by Federation Board. +${formatMoney(target.licensingFee)} licensing fee collected into treasury!`);
  };

  const handleRejectAgencyApplication = (appId: string) => {
    if (agency.activeRoles?.currentRole !== 'fa_president') {
      notify('🔒 FA President Authority Required: You must be elected and active as FA / Competition President to approve or deny agency licensing applications.');
      return;
    }

    const target = applicantAgencies.find(a => a.id === appId);
    if (!target) return;

    setApplicantAgencies(prev => prev.map(a => a.id === appId ? { ...a, status: 'rejected' } : a));
    notify(`🏛️ License Application Denied: ${target.name} application rejected.`);
  };

  // -------------------------------------------------------------------------
  // Feature 2: League Reform & Expansion Voting State
  // -------------------------------------------------------------------------
  const [reformProposals, setReformProposals] = useState([
    {
      id: 'reform_1',
      category: 'League Structure & Expansion',
      title: 'Top Division Expansion to 22 Clubs',
      description: 'Expand the top tier league from 20 to 22 clubs, increasing season match fixtures to 42 matches.',
      impactText: '➕ Increases overall broadcast TV revenue (+15%), but increases player match fatigue & injury risks.',
      votesFor: 12,
      votesAgainst: 8,
      userVote: 'none' as 'for' | 'against' | 'abstain' | 'none',
      status: 'voting' as 'voting' | 'passed' | 'rejected'
    },
    {
      id: 'reform_2',
      category: 'Promotion & Relegation System',
      title: '4-Team Relegation Playoff Tournament',
      description: 'Replace direct 3rd relegation spot with a 4-team high-stakes playoff between 16th in Tier 1 and 3rd-5th in Tier 2.',
      impactText: '🔥 Creates dramatic playoff broadcasting revenue and gives top-tier clubs a second chance to survive relegation.',
      votesFor: 15,
      votesAgainst: 5,
      userVote: 'none' as 'for' | 'against' | 'abstain' | 'none',
      status: 'voting' as 'voting' | 'passed' | 'rejected'
    },
    {
      id: 'reform_3',
      category: 'Foreign Player Roster Quota',
      title: 'Strict Homegrown Domestic Player Mandate',
      description: 'Restrict foreign non-domestic players to maximum 4 per matchday squad (down from 7).',
      impactText: '⚡ Substantially inflates domestic player market valuations (+25%) and prioritizes homegrown academy talent.',
      votesFor: 9,
      votesAgainst: 11,
      userVote: 'none' as 'for' | 'against' | 'abstain' | 'none',
      status: 'voting' as 'voting' | 'passed' | 'rejected'
    },
    {
      id: 'reform_4',
      category: 'Squad Salary Cap & Luxury Redistribution',
      title: 'Hard Annual Squad Salary Cap (€25,000,000/yr)',
      description: 'Enforce a rigid €25M annual player wage cap for all division clubs to prevent financial monopoly by billionaire owners.',
      impactText: '⚖️ Levels playing field across all clubs, capping maximum contract demands from elite players.',
      votesFor: 14,
      votesAgainst: 6,
      userVote: 'none' as 'for' | 'against' | 'abstain' | 'none',
      status: 'voting' as 'voting' | 'passed' | 'rejected'
    }
  ]);

  const handleVoteOnReform = (proposalId: string, choice: 'for' | 'against' | 'abstain') => {
    if (agency.activeRoles?.currentRole !== 'fa_president') {
      notify('🔒 FA President Authority Required: You must be elected and active as FA / Competition President to cast votes on League Reform legislation.');
      return;
    }

    setReformProposals(prev => prev.map(p => {
      if (p.id !== proposalId) return p;
      let newFor = p.votesFor;
      let newAgainst = p.votesAgainst;
      if (p.userVote === 'for') newFor--;
      if (p.userVote === 'against') newAgainst--;

      if (choice === 'for') newFor++;
      if (choice === 'against') newAgainst++;

      const isPassed = newFor > newAgainst;

      return {
        ...p,
        votesFor: newFor,
        votesAgainst: newAgainst,
        userVote: choice,
        status: isPassed ? 'passed' : 'rejected'
      };
    }));

    if (agency.soundEnabled) soundEngine.playClickSound();
    const prop = reformProposals.find(p => p.id === proposalId);
    if (prop) {
      notify(`📜 League Reform Vote Cast! You voted "${choice.toUpperCase()}" on "${prop.title}". Updated in Federation Assembly.`);
    }
  };

  const handleLobbyReformDelegates = (proposalId: string) => {
    if (agency.activeRoles?.currentRole !== 'fa_president') {
      notify('🔒 FA President Authority Required: You must be elected and active as FA / Competition President to lobby delegates on League Reform.');
      return;
    }

    if (agency.balance < 1000000) {
      notify('Need €1,000,000 to lobby delegate committee on League Reform!');
      return;
    }

    onUpdateAgency({
      ...agency,
      balance: agency.balance - 1000000,
      presidency: {
        ...pState,
        politicalInfluence: Math.min(100, (pState.politicalInfluence || 50) + 5)
      }
    });

    setReformProposals(prev => prev.map(p => {
      if (p.id !== proposalId) return p;
      return {
        ...p,
        votesFor: p.votesFor + 3
      };
    }));

    if (agency.soundEnabled) soundEngine.playCashSound();
    notify('🏛️ Lobbying Campaign Executed! Swung +3 Delegate Votes in favor of the proposal (+5 Political Influence).');
  };

  // -------------------------------------------------------------------------
  // Feature 3: Financial Fair Play (FFP) Debt Monitor State & 4-Week Warning System
  // -------------------------------------------------------------------------
  const [ffpSearchQuery, setFfpSearchQuery] = useState('');
  const [ffpFilterStatus, setFfpFilterStatus] = useState<'all' | 'compliant' | 'warning' | 'breach'>('all');
  const [hasShownAuditWarningToast, setHasShownAuditWarningToast] = useState(false);

  // 4-Week Audit Warning Check (Audit is at Week 38; Week 34 is 4 weeks before)
  const isAuditWarningPeriod = (agency.currentWeek >= 34 && agency.currentWeek <= 38);
  const weeksUntilAudit = Math.max(0, 38 - agency.currentWeek);

  // High-performance batch evaluation: maps club FFP metrics once in O(N) rather than 5,000,000 quadratic loops
  const batchFfpMap = useMemo(() => {
    return getBatchClubFfpMap(clubs, players, agency.currentWeek);
  }, [clubs, players, agency.currentWeek]);

  // Index my clients by clubId for O(1) representation check
  const clientsByClub = useMemo(() => {
    const map = new Map<string, Player[]>();
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (p.isMyClient && p.clubId) {
        let list = map.get(p.clubId);
        if (!list) {
          list = [];
          map.set(p.clubId, list);
        }
        list.push(p);
      }
    }
    return map;
  }, [players]);

  // Find all clubs with FFP risk and represented clients in those clubs
  const atRiskClubs = useMemo(() => {
    return clubs.filter(c => {
      const ffp = batchFfpMap.get(c.id);
      return ffp && (!ffp.isWithinFfp || ffp.status === 'At Risk');
    });
  }, [clubs, batchFfpMap]);

  const representedClientsAtRisk = useMemo(() => {
    const atRiskClubIdSet = new Set(atRiskClubs.map(c => c.id));
    const result: Player[] = [];
    atRiskClubIdSet.forEach(cId => {
      const cls = clientsByClub.get(cId);
      if (cls) result.push(...cls);
    });
    return result;
  }, [atRiskClubs, clientsByClub]);

  // Trigger 'Financial Fair Play Risk' Toast when 4 weeks before seasonal audit (or upon entering governance view)
  useEffect(() => {
    if (isAuditWarningPeriod && !hasShownAuditWarningToast) {
      setHasShownAuditWarningToast(true);
      const msg = `⚠️ Financial Fair Play Risk: Seasonal FFP Audit takes place in ${weeksUntilAudit} weeks! ${atRiskClubs.length} clubs are at risk of sanctions. Advise your ${representedClientsAtRisk.length} represented clients to restructure their contracts to reduce club debt.`;
      if (addToast) {
        addToast(msg, 'error');
      }
    }
  }, [agency.currentWeek, isAuditWarningPeriod, hasShownAuditWarningToast]);

  const handleManualTriggerFfpWarning = () => {
    const msg = `⚠️ Financial Fair Play Risk Alert: Seasonal FFP Audit takes place in ${weeksUntilAudit || 4} weeks! ${atRiskClubs.length} clubs are currently overspending. Advise your represented clients to restructure contracts to reduce club debt and avoid points deductions.`;
    if (addToast) {
      addToast(msg, 'error');
    } else {
      notify(msg);
    }
    if (agency.soundEnabled) soundEngine.playCashSound();
  };

  // Restructure contract for individual client
  const handleAdviseRestructuring = (client: Player) => {
    const club = clubs.find(c => c.id === client.clubId);
    if (!club) return;
    const { updatedPlayer, updatedClub, updatedAgency, savingsAnnual, bonusEarned } = restructureClientContract(client, club, agency);
    if (onUpdatePlayer) onUpdatePlayer(updatedPlayer);
    if (onUpdateClub) onUpdateClub(updatedClub);
    onUpdateAgency(updatedAgency);
    if (agency.soundEnabled) soundEngine.playCashSound();
    confetti({ particleCount: 80, spread: 90 });
    const msg = `🤝 Contract Restructured: ${client.name} agreed to wage restructuring! ${club.name}'s debt reduced by ${formatMoney(savingsAnnual)}/yr. +${formatMoney(bonusEarned)} Advisory Commission Earned!`;
    if (addToast) {
      addToast(msg, 'success');
    } else {
      notify(msg);
    }
  };

  // Bulk restructure all represented clients at risk
  const handleBulkRestructureAll = () => {
    if (representedClientsAtRisk.length === 0) {
      if (addToast) addToast('No represented clients are currently at clubs with FFP debt risks.', 'info');
      else notify('No represented clients are currently at clubs with FFP debt risks.');
      return;
    }

    const { updatedPlayers, updatedClubs, updatedAgency, totalSavingsAnnual, totalBonusEarned, count } = bulkRestructureClientsAtRisk(players, clubs, agency);
    updatedPlayers.forEach(p => onUpdatePlayer && onUpdatePlayer(p));
    updatedClubs.forEach(c => onUpdateClub && onUpdateClub(c));
    onUpdateAgency(updatedAgency);
    if (agency.soundEnabled) soundEngine.playCashSound();
    confetti({ particleCount: 120, spread: 100 });
    const msg = `⚡ Bulk Restructuring Success: ${count} client contracts restructured! Reduced combined club debts by ${formatMoney(totalSavingsAnnual)}/yr. Earned +${formatMoney(totalBonusEarned)} in advisory fees!`;
    if (addToast) {
      addToast(msg, 'success');
    } else {
      notify(msg);
    }
  };

  // Execute Federation Governance Sanction against Club
  const handleExecuteSanction = (club: Club, sanctionType: 'fine' | 'points_deduction' | 'transfer_ban' | 'forensic_audit' | 'wage_slash_order') => {
    try {
      const { updatedClub, updatedAgency, summaryMessage } = executeClubSanctions(club, sanctionType, agency);
      if (onUpdateClub) onUpdateClub(updatedClub);
      onUpdateAgency(updatedAgency);
      if (agency.soundEnabled) soundEngine.playCashSound();
      if (addToast) {
        addToast(summaryMessage, sanctionType === 'fine' ? 'success' : 'info');
      } else {
        notify(summaryMessage);
      }
    } catch (err: any) {
      if (addToast) addToast(err.message, 'error');
      else notify(err.message);
    }
  };

  // Resolution Tracking States
  const [resolvedScenarioIds, setResolvedScenarioIds] = useState<string[]>([]);
  const [executedSuiteActions, setExecutedSuiteActions] = useState<{ [key: string]: boolean }>({});

  // Federation Expansion States
  const [selectedNationalTeam, setSelectedNationalTeam] = useState<string>('England National XI');
  const [selectedCoachName, setSelectedCoachName] = useState<string>('Thomas Tuchel');
  const [selectedFfpClubId, setSelectedFfpClubId] = useState<string>('');

  // Federation Expansion Handlers
  const handleFfpAudit = (clubId: string, action: 'warning' | 'fine' | 'ban') => {
    const targetClub = clubs.find(c => c.id === clubId);
    if (!targetClub) {
      notify('Please select a target club to perform FFP Audit!');
      return;
    }
    if (action === 'fine') {
      if (onUpdateClub) {
        onUpdateClub({ ...targetClub, transferBudget: Math.max(0, targetClub.transferBudget - 10000000) });
      }
      notify(`FFP Audit Executed: €10,000,000 Financial Fine levied on ${targetClub.name}!`);
    } else if (action === 'ban') {
      notify(`FFP Audit Executed: ${targetClub.name} issued European Competition Registration Ban for non-compliance!`);
    } else {
      notify(`FFP Audit Executed: Formal FFP Warning issued to ${targetClub.name}.`);
    }
    if (agency.soundEnabled) soundEngine.playCashSound();
  };

  const handleSuperLeagueDecision = (decision: 'ban' | 'sanction') => {
    const newStatus = decision === 'ban' ? 'Banned' : 'Sanctioned & Active';
    onUpdateAgency({
      ...agency,
      reputation: Math.min(100, agency.reputation + 10),
      presidency: {
        ...pState,
        activePolicies: {
          ...pState.activePolicies,
          superLeagueStatus: newStatus
        }
      }
    });
    notify(`Super League Legislative Resolution Passed! Breakaway Super League is now ${newStatus}! (+10 Federation Prestige)`);
    if (agency.soundEnabled) soundEngine.playCashSound();
  };

  const handleAppointNationalManager = () => {
    if (agency.balance < 5000000) {
      notify('Need €5,000,000 in federation funds to hire National Team Coach!');
      return;
    }
    onUpdateAgency({
      ...agency,
      balance: agency.balance - 5000000,
      presidency: {
        ...pState,
        activePolicies: {
          ...pState.activePolicies,
          nationalCoachAppointed: `${selectedCoachName} (${selectedNationalTeam})`
        }
      }
    });
    notify(`Official Appointment: ${selectedCoachName} appointed Head Coach of ${selectedNationalTeam}!`);
    if (agency.soundEnabled) soundEngine.playCashSound();
  };

  const handleWorldCupHostBid = () => {
    if (agency.balance < 10000000) {
      notify('Need €10,000,000 capital for FIFA World Cup Bidding Campaign!');
      return;
    }
    onUpdateAgency({
      ...agency,
      balance: agency.balance - 10000000,
      reputation: Math.min(100, agency.reputation + 15),
      presidency: {
        ...pState,
        activePolicies: {
          ...pState.activePolicies,
          worldCupBiddingNation: agency.agencyName
        }
      }
    });
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    notify(`FIFA World Cup Hosting Bid Submitted! Official host selection campaign launched (+15 Global Prestige)!`);
  };

  const handleVarAndRulebook = (varSetting: 'Strict' | 'Lenient' | 'Off') => {
    onUpdateAgency({
      ...agency,
      presidency: {
        ...pState,
        activePolicies: {
          ...pState.activePolicies,
          varStrictness: varSetting
        }
      }
    });
    notify(`Rulebook Legislative Update: VAR Strictness now set to ${varSetting}. Referees instructed accordingly.`);
  };

  const handleNationalYouthFacility = () => {
    if (agency.balance < 20000000) {
      notify('Need €20,000,000 to construct National Youth Excellence Center!');
      return;
    }
    onUpdateAgency({
      ...agency,
      balance: agency.balance - 20000000,
      reputation: Math.min(100, agency.reputation + 12)
    });
    confetti({ particleCount: 60, spread: 70 });
    notify('National Youth Football Excellence Center constructed! Boosted domestic youth generation nationwide.');
  };

  const handleWorkPermitPoints = (points: number) => {
    onUpdateAgency({
      ...agency,
      presidency: {
        ...pState,
        activePolicies: {
          ...pState.activePolicies,
          workPermitPoints: points
        }
      }
    });
    notify(`Work Permit Legislation Enacted: Non-domestic player point threshold set to ${points} Points.`);
  };

  const handleRefereeIntegrity = () => {
    if (agency.balance < 3000000) {
      notify('Need €3,000,000 to fund FIFA Integrity Commission!');
      return;
    }
    onUpdateAgency({
      ...agency,
      balance: agency.balance - 3000000,
      presidency: {
        ...pState,
        activePolicies: {
          ...pState.activePolicies,
          refereeIntegrityLevel: 98
        }
      }
    });
    notify('FIFA Integrity Commission & Referee Panel Audit deployed! Match-fixing risk minimized to 0%.');
  };

  const handleTvRightsTender = () => {
    onUpdateAgency({
      ...agency,
      balance: agency.balance + 15000000,
      presidency: {
        ...pState,
        activePolicies: {
          ...pState.activePolicies,
          tvRightsPackageValue: 1500000000
        }
      }
    });
    confetti({ particleCount: 80, spread: 90 });
    notify('Global Broadcast Rights Tender Signed! €1.5 Billion multi-year broadcasting package sealed (+€15,000,000 Federation Dividend)!');
  };

  const handleAgentExamLicensing = () => {
    onUpdateAgency({
      ...agency,
      balance: agency.balance + 5000000,
      presidency: {
        ...pState,
        activePolicies: {
          ...pState.activePolicies,
          agentExamDifficulty: 'Extreme FIFA Standard'
        }
      }
    });
    notify('Mandatory FIFA Agent Licensing Exam System Enacted! Unlicensed agents barred and €5,000,000 licensing revenue collected.');
  };

  const handleSupercupGlobalHosting = (location: string) => {
    onUpdateAgency({
      ...agency,
      balance: agency.balance + 12000000,
      presidency: {
        ...pState,
        activePolicies: {
          ...pState.activePolicies,
          supercupHostNation: location
        }
      }
    });
    confetti({ particleCount: 50 });
    notify(`Domestic Supercup Rights awarded to ${location}! Generated €12,000,000 hosting fee revenue.`);
  };

  const handleAntiDopingAudit = () => {
    notify('Unannounced Anti-Doping Blood Audits executed across all league squads! Integrity score 100%.');
  };

  const handleLuxuryTaxSystem = () => {
    onUpdateAgency({
      ...agency,
      presidency: {
        ...pState,
        activePolicies: {
          ...pState.activePolicies,
          luxuryTaxThreshold: 100000000
        }
      }
    });
    notify('Luxury Spending Tax Enacted! 10% tax on high-spending clubs re-allocated to grassroots academies.');
  };

  const handleForeignTakeoverShield = () => {
    onUpdateAgency({
      ...agency,
      presidency: {
        ...pState,
        activePolicies: {
          ...pState.activePolicies,
          foreignTakeoverImmunity: true
        }
      }
    });
    notify('Foreign Sovereign Wealth Immunity Law Enacted! Protected domestic clubs against hostile foreign state takeovers.');
  };

  const handleHallOfFameInduction = (name: string) => {
    const list = pState.activePolicies?.medalOfHonorAwarded || [];
    if (list.includes(name)) return;
    onUpdateAgency({
      ...agency,
      reputation: Math.min(100, agency.reputation + 5),
      presidency: {
        ...pState,
        activePolicies: {
          ...pState.activePolicies,
          medalOfHonorAwarded: [...list, name]
        }
      }
    });
    confetti({ particleCount: 60 });
    notify(`Official Federation Medal of Honor awarded to ${name}! Added to Football Hall of Fame (+5 Reputation).`);
  };
  // Selected player for scouting own club
  const [selectedScoutPlayerId, setSelectedScoutPlayerId] = useState<string>('');
  // Selected player for conflict of interest insider contract
  const [selectedInsiderPlayerId, setSelectedInsiderPlayerId] = useState<string>('');

  // Legislative proposal form state
  const [proposedSalaryCap, setProposedSalaryCap] = useState<number>(20000000);
  const [proposedWindowWeeks, setProposedWindowWeeks] = useState<number>(8);
  const [proposedForeignQuota, setProposedForeignQuota] = useState<number>(6);
  const [proposedCommissionCap, setProposedCommissionCap] = useState<number>(15);
  const [proposedMaxSquadRegistration, setProposedMaxSquadRegistration] = useState<number>(25);
  const [proposedMinHomegrownQuota, setProposedMinHomegrownQuota] = useState<number>(8);
  const [proposedU21Exemption, setProposedU21Exemption] = useState<boolean>(true);

  const pState: PresidencyState = agency.presidency || {
    role: 'None',
    politicalInfluence: 50,
    termYearsLeft: 0,
    conflictScandalLevel: 10,
    conflictLogs: [],
    activePolicies: {
      agentCommissionCap: 15,
      foreignPlayerLimit: 6,
      varStrictness: 'Strict',
      annualFederationSubsidy: 50000000,
      salaryCapPerYear: 20000000,
      transferWindowWeeks: 8,
      maxSquadRegistration: 25,
      minHomegrownQuota: 8,
      u21ExemptionEnabled: true
    }
  };

  const activePolicies = {
    agentCommissionCap: pState.activePolicies?.agentCommissionCap ?? 15,
    foreignPlayerLimit: pState.activePolicies?.foreignPlayerLimit ?? 6,
    varStrictness: pState.activePolicies?.varStrictness ?? 'Strict',
    annualFederationSubsidy: pState.activePolicies?.annualFederationSubsidy ?? 50000000,
    salaryCapPerYear: pState.activePolicies?.salaryCapPerYear ?? 20000000,
    transferWindowWeeks: pState.activePolicies?.transferWindowWeeks ?? 8,
    maxSquadRegistration: pState.activePolicies?.maxSquadRegistration ?? 25,
    minHomegrownQuota: pState.activePolicies?.minHomegrownQuota ?? 8,
    u21ExemptionEnabled: pState.activePolicies?.u21ExemptionEnabled ?? true
  };

  const currentRole = pState.role || 'None';
  const isDualRole = pState.role === 'Club President' || agency.clubShares.some(s => s.sharePercent >= 51);

  // Find user's club
  const userClub = clubs.find(c => c.id === pState.clubId) || clubs[0];

  // Direct Office Upgrade Handler for Federation Career Qualification
  const handleDirectOfficeUpgrade = () => {
    const nextLvl = agency.officeLevel + 1;
    if (nextLvl > 5) return;
    const costs = [0, 500000, 2500000, 10000000, 50000000];
    const cost = costs[agency.officeLevel];
    if (agency.balance < cost) {
      notify(`Need ${formatMoney(cost)} capital to upgrade Agency HQ to Level ${nextLvl}!`);
      return;
    }
    onUpdateAgency({
      ...agency,
      balance: agency.balance - cost,
      officeLevel: nextLvl,
      reputation: Math.min(100, agency.reputation + 5)
    });
    if (agency.soundEnabled) soundEngine.playCashSound();
    confetti({ particleCount: 80, spread: 70 });
    notify(`🏢 Agency HQ Upgraded to Level ${nextLvl}! Qualified for higher federation governance candidacies (+5 Reputation)!`);
  };

  // Step Down / Vacate Seat Handler
  const handleVacateOfficeSeat = () => {
    if (window.confirm(`Are you sure you want to vacate your ${pState.role} seat? Your mandate will terminate immediately.`)) {
      onUpdateAgency({
        ...agency,
        presidency: {
          ...pState,
          role: 'None',
          termYearsLeft: 0,
          termWeeksLeft: 0,
          reElectionStatus: 'expired'
        }
      });
      notify('You have stepped down from office.');
    }
  };

  // Execute Federation Scenario Option
  const handleExecuteScenarioOption = (scenario: FederationActionScenario, optionId: string) => {
    if (agency.activeRoles?.currentRole !== 'fa_president') {
      notify('🔒 FA President Authority Required: You must be elected and active as FA / Competition President to adjudicate Federation Executive Hearings.');
      return;
    }

    const opt = scenario.options.find(o => o.id === optionId);
    if (!opt) return;

    const effects = opt.effects;
    const newBalance = Math.max(0, agency.balance + (effects.agencyCashDelta || 0));
    const newRep = Math.min(100, Math.max(0, agency.reputation + (effects.reputationDelta || 0)));
    const newInfluence = Math.min(100, Math.max(0, (pState.politicalInfluence || 50) + (effects.politicalInfluenceDelta || 0)));
    const newScandal = Math.min(100, Math.max(0, (pState.conflictScandalLevel || 0) + (effects.scandalDelta || 0)));

    onUpdateAgency({
      ...agency,
      balance: newBalance,
      reputation: newRep,
      presidency: {
        ...pState,
        politicalInfluence: newInfluence,
        conflictScandalLevel: newScandal
      }
    });

    // Remove scenario from the active hearings list so it disappears from the view immediately!
    setResolvedScenarioIds(prev => [...prev, scenario.id]);

    if (agency.soundEnabled) soundEngine.playCashSound();
    if ((effects.agencyCashDelta || 0) > 0 || (effects.reputationDelta || 0) > 0) {
      confetti({ particleCount: 80, spread: 80 });
    }

    notify(`🏛️ Federation Rulings Executed: ${opt.outcomeTitle}\n\n${opt.outcomeText}`);
  };

  // Career Path Definitions with Office Requirements, Hierarchical Tier Locks & 3-Season Tenure
  const careerLevels = [
    {
      role: 'Local Agent' as const,
      title: 'Local Football Agent',
      tier: 0,
      officeReq: 1,
      officeName: 'Local Flat (Lvl 1)',
      reputationReq: 0,
      balanceReq: 0,
      sharesReq: 0,
      desc: 'Base level agency operations brokering local transfers and youth talent contracts.',
      unlocked: true,
      tierLockReason: null
    },
    {
      role: 'Regional Delegate' as const,
      title: 'Regional Federation Delegate (Tier 1)',
      tier: 1,
      officeReq: 2,
      officeName: 'City Business Suite (Lvl 2+)',
      reputationReq: 30,
      balanceReq: 1000000,
      sharesReq: 0,
      desc: 'Starting grassroots political office. Voting rights on regional youth development funds and regional referee panels.',
      unlocked: agency.officeLevel >= 2 && agency.reputation >= 30 && agency.balance >= 1000000,
      tierLockReason: null
    },
    {
      role: 'Federation Director' as const,
      title: 'National Federation Director (Tier 2)',
      tier: 2,
      officeReq: 3,
      officeName: 'Glass Skyscraper (Lvl 3+)',
      reputationReq: 50,
      balanceReq: 5000000,
      sharesReq: 1,
      desc: 'National FA Board. Regulates top division salary caps, foreign player limits, and domestic cup prize allocations. Requires completing a successful 3-season term as Regional Delegate.',
      unlocked: (pState.highestTierCompleted || 0) >= 1 && agency.officeLevel >= 3 && agency.reputation >= 50 && agency.balance >= 5000000,
      tierLockReason: (pState.highestTierCompleted || 0) < 1 ? '🔒 Hierarchy Locked: Must first serve and complete a 3-season tenure as Regional Delegate (Tier 1) with strong approval.' : null
    },
    {
      role: 'Continental President' as const,
      title: 'Continental President (Tier 3 - UEFA / CONMEBOL)',
      tier: 3,
      officeReq: 4,
      officeName: 'Luxury Penthouse (Lvl 4+)',
      reputationReq: 70,
      balanceReq: 20000000,
      sharesReq: 1,
      desc: 'Supreme continental leader commanding Champions League broadcast tenders, supercup host selections, and continent-wide FFP. Requires completing a successful 3-season term as National Federation Director.',
      unlocked: (pState.highestTierCompleted || 0) >= 2 && agency.officeLevel >= 4 && agency.reputation >= 70 && agency.balance >= 20000000,
      tierLockReason: (pState.highestTierCompleted || 0) < 2 ? '🔒 Hierarchy Locked: Must first serve and complete a 3-season tenure as National FA Director (Tier 2).' : null
    },
    {
      role: 'FIFA Global President' as const,
      title: 'FIFA Global President (Tier 4 - Supreme Global FA)',
      tier: 4,
      officeReq: 5,
      officeName: 'Global Palace HQ (Lvl 5)',
      reputationReq: 85,
      balanceReq: 50000000,
      sharesReq: 2,
      desc: 'Supreme global president. Selects World Cup host nations, regulates world agent transfer caps, and controls multi-billion euro central reserves. Requires completing a successful 3-season term as Continental President.',
      unlocked: (pState.highestTierCompleted || 0) >= 3 && agency.officeLevel >= 5 && agency.reputation >= 85 && agency.balance >= 50000000,
      tierLockReason: (pState.highestTierCompleted || 0) < 3 ? '🔒 Hierarchy Locked: Must first serve and complete a 3-season tenure as Continental President (Tier 3).' : null
    }
  ];

  // Start Election Campaign for a target role
  const handleStartCampaign = (targetRole: ElectionCampaign['targetRole'], cost: number) => {
    if (agency.balance < cost) {
      notify(`Need ${formatMoney(cost)} to fund a ${targetRole} election campaign war chest!`);
      return;
    }

    if (agency.soundEnabled) soundEngine.playCashSound();

    const newCampaign: ElectionCampaign = {
      active: true,
      targetRole,
      voterSupport: 35, // Base 35%
      spentCash: cost,
      spentReputation: 0,
      spentInfluence: 10,
      weeksRemaining: 4,
      scandalRisk: 10,
      keyVoterClubs: [
        { clubId: 'vc1', clubName: 'Manchester Powerhouse', supported: true, bribeCost: 1000000 },
        { clubId: 'vc2', clubName: 'Madrid Capital FC', supported: false, bribeCost: 2500000 },
        { clubId: 'vc3', clubName: 'Bavaria Munich FC', supported: false, bribeCost: 2000000 },
        { clubId: 'vc4', clubName: 'Rio Flamengo RedBlack', supported: true, bribeCost: 1500000 },
        { clubId: 'vc5', clubName: 'Riyadh Al-Nassr Gold', supported: false, bribeCost: 3000000 }
      ]
    };

    onUpdateAgency({
      ...agency,
      balance: agency.balance - cost,
      presidency: {
        ...pState,
        campaign: newCampaign,
        campaignStatus: 'running'
      }
    });

    setActiveTab('campaign');
  };

  // Spend Resource in Campaign (Cash / Reputation / Influence)
  const handleSpendCampaignResource = (resource: 'cash' | 'reputation' | 'influence' | 'gala') => {
    if (!pState.campaign) return;

    let costAmount = 0;
    let boost = 0;

    if (resource === 'cash') {
      costAmount = 1000000;
      if (agency.balance < costAmount) {
        notify('Insufficient cash balance to buy campaign ads!');
        return;
      }
      boost = 8;
      onUpdateAgency({
        ...agency,
        balance: agency.balance - costAmount,
        presidency: {
          ...pState,
          campaign: {
            ...pState.campaign,
            voterSupport: Math.min(100, pState.campaign.voterSupport + boost),
            spentCash: pState.campaign.spentCash + costAmount
          }
        }
      });
    } else if (resource === 'reputation') {
      if (agency.reputation < 5) {
        notify('Need at least 5 Reputation points to leverage!');
        return;
      }
      boost = 10;
      onUpdateAgency({
        ...agency,
        reputation: agency.reputation - 3,
        presidency: {
          ...pState,
          campaign: {
            ...pState.campaign,
            voterSupport: Math.min(100, pState.campaign.voterSupport + boost),
            spentReputation: pState.campaign.spentReputation + 3
          }
        }
      });
    } else if (resource === 'influence') {
      if ((pState.politicalInfluence || 0) < 10) {
        notify('Need at least 10 Political Influence points!');
        return;
      }
      boost = 12;
      onUpdateAgency({
        ...agency,
        presidency: {
          ...pState,
          politicalInfluence: (pState.politicalInfluence || 0) - 10,
          campaign: {
            ...pState.campaign,
            voterSupport: Math.min(100, pState.campaign.voterSupport + boost),
            spentInfluence: pState.campaign.spentInfluence + 10
          }
        }
      });
    } else if (resource === 'gala') {
      costAmount = 2500000;
      if (agency.balance < costAmount) {
        notify('Hosting a Gala Speech requires €2,500,000!');
        return;
      }
      boost = 15;
      onUpdateAgency({
        ...agency,
        balance: agency.balance - costAmount,
        presidency: {
          ...pState,
          campaign: {
            ...pState.campaign,
            voterSupport: Math.min(100, pState.campaign.voterSupport + boost),
            spentCash: pState.campaign.spentCash + costAmount
          }
        }
      });
    }

    if (agency.soundEnabled) soundEngine.playCashSound();
  };

  // Lobby Voter Club in Campaign
  const handleLobbyVoterClub = (voterClubId: string) => {
    if (!pState.campaign) return;
    const club = pState.campaign.keyVoterClubs.find(c => c.clubId === voterClubId);
    if (!club) return;

    if (agency.balance < club.bribeCost) {
      notify(`Need ${formatMoney(club.bribeCost)} to lobby ${club.clubName}!`);
      return;
    }

    if (agency.soundEnabled) soundEngine.playCashSound();

    const updatedClubs = pState.campaign.keyVoterClubs.map(c => 
      c.clubId === voterClubId ? { ...c, supported: true } : c
    );

    const supportBoost = 12; // +12% voter support
    const newSupport = Math.min(100, pState.campaign.voterSupport + supportBoost);

    onUpdateAgency({
      ...agency,
      balance: agency.balance - club.bribeCost,
      presidency: {
        ...pState,
        campaign: {
          ...pState.campaign,
          voterSupport: newSupport,
          spentCash: pState.campaign.spentCash + club.bribeCost,
          keyVoterClubs: updatedClubs
        }
      }
    });
  };

  // Execute Election Vote Tally Simulation
  const handleSimulateElectionVote = () => {
    if (!pState.campaign) return;
    setIsSimulatingVote(true);

    if (agency.soundEnabled) soundEngine.playClickSound();

    setTimeout(() => {
      setIsSimulatingVote(false);

      const support = pState.campaign?.voterSupport || 50;
      const roll = Math.floor(Math.random() * 20) - 10; // -10 to +10 variance
      const finalVotePercent = Math.min(100, Math.max(0, support + roll));
      const targetRoleName = pState.campaign?.targetRole || 'Federation Director';
      let targetTier: 1 | 2 | 3 | 4 = 1;
      if (targetRoleName === 'Regional Delegate') targetTier = 1;
      else if (targetRoleName === 'Federation Director') targetTier = 2;
      else if (targetRoleName === 'Continental President') targetTier = 3;
      else if (targetRoleName === 'FIFA Global President') targetTier = 4;

      if (finalVotePercent >= 55) {
        if (agency.soundEnabled) soundEngine.playCashSound();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });

        notify(`🏆 ELECTION VICTORY! You won the election with ${finalVotePercent}% of the voter delegates! You are now elected as ${targetRoleName} for a 3-Season Tenure!`);

        const updatedMilestones = [
          {
            id: `ms_elec_${Date.now()}`,
            week: agency.currentWeek,
            season: agency.currentSeason,
            title: `Elected as ${targetRoleName}`,
            description: `Won the federation election with ${finalVotePercent}% delegate vote for a 3-season mandate.`,
            type: 'election' as const,
            impact: `Unlocked Tier ${targetTier} Governance Powers & Realistic Reputation Growth`
          },
          ...agency.milestones
        ];

        onUpdateAgency({
          ...agency,
          reputation: Math.min(100, agency.reputation + 2), // Realistic, non-spiking growth (+2)
          milestones: updatedMilestones,
          activeRoles: {
            agent: false,
            club_owner: false,
            fa_president: true,
            currentRole: 'fa_president',
            faAchievementEligibility: true
          },
          presidency: {
            ...pState,
            role: targetRoleName,
            tier: targetTier,
            tenureSeason: 1, // Season 1 of 3
            approvalRating: 68,
            politicalInfluence: Math.min(100, (pState.politicalInfluence || 50) + 15),
            termYearsLeft: 3,
            termWeeksLeft: 114,
            termTotalWeeks: 114,
            reElectionStatus: 'active',
            campaignStatus: 'won',
            campaign: undefined,
            highestTierCompleted: pState.highestTierCompleted || 0
          }
        });
      } else {
        notify(`❌ ELECTION DEFEAT! You received ${finalVotePercent}% of the delegate vote (55% required to win). Your campaign has concluded.`);

        onUpdateAgency({
          ...agency,
          presidency: {
            ...pState,
            campaignStatus: 'lost',
            campaign: undefined
          }
        });
      }
    }, 2000);
  };

  // Propose & Execute Legislative Vote on League Laws
  const handleInitiateLegislativeVote = () => {
    if (agency.activeRoles?.currentRole !== 'fa_president') {
      notify('🔒 FA President Authority Required: You must be elected and active as FA / Competition President to propose and enact Legislative League Laws.');
      return;
    }

    if (pState.lastDecreeWeek === agency.currentWeek && pState.lastDecreeSeason === agency.currentSeason) {
      notify(`⚠️ Legislative Decree Limit Reached: The Federation Congress only allows passing 1 major policy decree per matchweek. Advance the week to debate and vote on further legislation.`);
      return;
    }

    setIsLegislating(true);
    setLegislativeProgress(0);

    if (agency.soundEnabled) soundEngine.playClickSound();

    const interval = setInterval(() => {
      setLegislativeProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsLegislating(false);

          if (agency.soundEnabled) soundEngine.playCashSound();
          confetti({ particleCount: 80, spread: 70 });

          notify(`📜 LEGISLATIVE BILL PASSED! The new League Laws have been officially enacted across all clubs!`);

          const updatedMilestones = [
            {
              id: `ms_law_${Date.now()}`,
              week: agency.currentWeek,
              season: agency.currentSeason,
              title: `Enacted Global League & Squad Laws`,
              description: `Passed legislative bill: Squad Cap ${proposedMaxSquadRegistration} (Min ${proposedMinHomegrownQuota} Homegrown, U21 Exempt: ${proposedU21Exemption ? 'Yes' : 'No'}), Salary Cap €${(proposedSalaryCap/1000000).toFixed(0)}M, Agent Cap ${proposedCommissionCap}%, Foreign Quota ${proposedForeignQuota}.`,
              type: 'presidency' as const,
              impact: `Enforced new squad registration quotas and financial regulations across top division clubs`
            },
            ...agency.milestones
          ];

          onUpdateAgency({
            ...agency,
            milestones: updatedMilestones,
            presidency: {
              ...pState,
              lastDecreeWeek: agency.currentWeek,
              lastDecreeSeason: agency.currentSeason,
              politicalInfluence: Math.min(100, pState.politicalInfluence + 5),
              activePolicies: {
                ...activePolicies,
                salaryCapPerYear: proposedSalaryCap,
                transferWindowWeeks: proposedWindowWeeks,
                foreignPlayerLimit: proposedForeignQuota,
                agentCommissionCap: proposedCommissionCap,
                maxSquadRegistration: proposedMaxSquadRegistration,
                minHomegrownQuota: proposedMinHomegrownQuota,
                u21ExemptionEnabled: proposedU21Exemption
              }
            }
          });
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  // Conflict of Interest: Scout Own Club Player (Fluctuates Player Loyalty)
  const handleScoutOwnPlayer = (playerId: string) => {
    const targetPlayer = players.find(p => p.id === playerId);
    if (!targetPlayer) return;

    if (agency.soundEnabled) soundEngine.playCashSound();

    const valueBoost = Math.round(targetPlayer.value * 0.25);
    const newLoyalty = Math.max(0, targetPlayer.loyalty - 15);

    const updatedPlayer: Player = {
      ...targetPlayer,
      value: targetPlayer.value + valueBoost,
      loyalty: newLoyalty,
      scoutReport: {
        scoutName: 'Insider President Audit',
        text: `Insider Presidential Scout Report: Inflated transfer fee potential by +25% (€${formatMoney(valueBoost)}). Rival super-clubs are placing priority bids!`,
        date: `Wk ${agency.currentWeek}`
      }
    };

    if (onUpdatePlayer) onUpdatePlayer(updatedPlayer);

    // Also lower loyalty for other clients at the same agency slightly due to conflict ethics
    players.filter(p => p.isMyClient && p.id !== playerId).forEach(otherClient => {
      if (onUpdatePlayer) {
        onUpdatePlayer({
          ...otherClient,
          loyalty: Math.max(0, otherClient.loyalty - 5)
        });
      }
    });

    // Log conflict
    const newLog = {
      id: `log_${Date.now()}`,
      week: agency.currentWeek,
      actionType: 'Inflated Sale' as const,
      details: `Scouted & Inflated market valuation of ${targetPlayer.name} by +25% at ${targetPlayer.clubName}. Player loyalty dropped to ${newLoyalty}%.`,
      scandalDelta: 12,
      profitDelta: valueBoost
    };

    onUpdateAgency({
      ...agency,
      presidency: {
        ...pState,
        conflictScandalLevel: Math.min(100, (pState.conflictScandalLevel || 0) + 12),
        conflictLogs: [newLog, ...(pState.conflictLogs || [])]
      }
    });

    notify(`Insider Scouting Complete! Inflated ${targetPlayer.name}'s valuation (+25%). Player loyalty dropped to ${newLoyalty}% due to conflict concerns!`);
  };

  // Conflict of Interest: Negotiate Insider Contract with Perks (Fluctuates Player Loyalty)
  const handleNegotiateInsiderContract = (playerId: string, perk: 'commission25' | 'starting11' | 'lowBuyout' | 'bribeSplit') => {
    const targetPlayer = players.find(p => p.id === playerId);
    if (!targetPlayer) return;

    if (agency.soundEnabled) soundEngine.playCashSound();

    let perkText = '';
    let scandalIncrease = 15;
    let profitBoost = 0;
    let loyaltyDrop = 20;

    let updatedPlayer: Player = { ...targetPlayer };

    if (perk === 'commission25') {
      updatedPlayer.agentCommission = 25;
      perkText = 'Enforced 25% Agent Commission Rate';
      profitBoost = Math.round(targetPlayer.wage * 0.25 * 52);
    } else if (perk === 'starting11') {
      updatedPlayer.morale = 100;
      updatedPlayer.form = 95;
      perkText = 'Guaranteed Starting XI & Captaincy Perk';
      loyaltyDrop = 10;
    } else if (perk === 'lowBuyout') {
      updatedPlayer.clauses = {
        ...targetPlayer.clauses,
        releaseClause: 5000000
      };
      perkText = 'Forced €5,000,000 Low Release Clause';
    } else if (perk === 'bribeSplit') {
      perkText = 'Siphoned €1,000,000 Sign-on Bonus directly to Agency';
      profitBoost = 1000000;
      loyaltyDrop = 25;
    }

    updatedPlayer.loyalty = Math.max(0, targetPlayer.loyalty - loyaltyDrop);

    if (onUpdatePlayer) onUpdatePlayer(updatedPlayer);

    const newLog = {
      id: `log_${Date.now()}`,
      week: agency.currentWeek,
      actionType: 'Insider Contract' as const,
      details: `${perkText} on ${targetPlayer.name}. Loyalty dropped by -${loyaltyDrop} points.`,
      scandalDelta: scandalIncrease,
      profitDelta: profitBoost
    };

    onUpdateAgency({
      ...agency,
      balance: agency.balance + profitBoost,
      presidency: {
        ...pState,
        conflictScandalLevel: Math.min(100, (pState.conflictScandalLevel || 0) + scandalIncrease),
        conflictLogs: [newLog, ...(pState.conflictLogs || [])]
      }
    });

    notify(`Insider Contract Executed! ${perkText} for ${targetPlayer.name}! (+${scandalIncrease} Scandal Hazard, Loyalty: ${updatedPlayer.loyalty}%)`);
  };

  // Clear Conflict Scandal
  const handleClearScandal = (method: 'lawyers' | 'bribe') => {
    const cost = method === 'lawyers' ? 2000000 : 5000000;
    if (agency.balance < cost) {
      notify(`Need ${formatMoney(cost)} to execute this legal defense!`);
      return;
    }

    if (agency.soundEnabled) soundEngine.playCashSound();

    const reduction = method === 'lawyers' ? 30 : 60;
    const newScandal = Math.max(0, (pState.conflictScandalLevel || 0) - reduction);

    notify(`Legal action complete. Reduced Conflict Scandal level by ${reduction} points!`);

    onUpdateAgency({
      ...agency,
      balance: agency.balance - cost,
      presidency: {
        ...pState,
        conflictScandalLevel: newScandal
      }
    });
  };

  const isFaPresident = agency.activeRoles?.currentRole === 'fa_president';
  const currentActiveRoleName = agency.activeRoles?.currentRole === 'club_owner' ? 'Club President' : agency.activeRoles?.currentRole === 'fa_president' ? 'FA President' : 'Football Agent';

  const handleResignFaPresident = () => {
    if (window.confirm('Are you sure you want to resign as FA / Competition President?\n\nYou will step down from global governance and return to independent Football Agent status.')) {
      if (agency.soundEnabled) soundEngine.playClickSound();
      onUpdateAgency({
        ...agency,
        activeRoles: {
          agent: true,
          club_owner: false,
          fa_president: false,
          currentRole: 'agent',
          presidentClubId: undefined
        },
        presidency: {
          ...pState,
          role: 'None',
          termYearsLeft: 0,
          termWeeksLeft: 0,
          reElectionStatus: 'expired'
        }
      });
      if (addToast) {
        addToast('🏛️ You formally stepped down as FA President. Returned to Football Agent.', 'info');
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Role Exclusivity Alert Banner if not holding FA Presidency */}
      {!isFaPresident && (
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border-2 border-amber-500/50 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded">
                  Observer Mode
                </span>
                <span className="text-xs text-amber-300 font-bold">Active Role: {currentActiveRoleName}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                You are currently active as a <strong className="text-white">{currentActiveRoleName}</strong>. 
                Under FIFA regulations, executive legislative decrees, reform voting, and disciplinary hearings require holding the <strong>FA / Competition President</strong> office (requires resigning from other roles).
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('campaign')}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shrink-0 shadow-lg shadow-amber-500/20"
          >
            Go to Campaign Hub
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-amber-950 border-2 border-amber-500/60 p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shrink-0">
            <Globe className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                {isFaPresident ? (pState.role || 'FA President') : 'Federation Observer'}
              </span>
              {isFaPresident && pState.tier && (
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-black uppercase px-2.5 py-0.5 rounded">
                  Tier {pState.tier} Presidency
                </span>
              )}
              {isFaPresident && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded">
                  Tenure: Season {pState.tenureSeason || 1} / 3
                </span>
              )}
              {isFaPresident && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  (pState.approvalRating || 65) >= 60 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : (pState.approvalRating || 65) >= 50
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-red-500/20 text-red-300 border-red-500/40'
                }`}>
                  Approval: {pState.approvalRating || 65}%
                </span>
              )}
              <span className="text-xs text-amber-300 font-bold">Influence: {pState.politicalInfluence || 50}/100</span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">Global Football Governance &amp; FIFA Headquarters</h2>
            <p className="text-xs text-amber-200/80">
              Serve 3-season governance tenures, maintain voter approval to secure re-election, collect progressive federation taxes, and enact global league laws.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isFaPresident && (
            <div className="bg-slate-900/90 border border-emerald-500/40 px-3.5 py-2 rounded-xl text-center">
              <p className="text-[9px] text-slate-400 uppercase font-bold">Voter Approval</p>
              <p className={`text-base font-black ${(pState.approvalRating || 65) >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {pState.approvalRating || 65}%
              </p>
              <p className="text-[9px] text-slate-500">Need &ge;60% at Term End</p>
            </div>
          )}

          <div className="bg-slate-900/90 border border-amber-500/40 px-4 py-2 rounded-xl text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Conflict Scandal Risk</p>
            <p className={`text-lg font-black ${(pState.conflictScandalLevel || 0) > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
              {pState.conflictScandalLevel || 0}%
            </p>
          </div>

          {isFaPresident && (
            <button
              onClick={handleResignFaPresident}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Resign from FA Presidency and return to Agent"
            >
              Resign Presidency
            </button>
          )}
        </div>
      </div>

      {/* Term Mandate Alert Banner (If term is expiring or expired) */}
      {currentRole !== 'None' && ((pState.termWeeksLeft ?? 16) <= 3 || pState.reElectionStatus === 'expired') && (
        <div className="bg-gradient-to-r from-red-950/90 via-slate-900 to-amber-950/80 border-2 border-red-500/80 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500 flex items-center justify-center text-red-400 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>⚠️ FEDERATION MANDATE EXPIRED / EXPIRING SOON</span>
                <span className="text-xs bg-red-500 text-white font-bold px-2 py-0.5 rounded">
                  {pState.termWeeksLeft ?? 0} Weeks Left
                </span>
              </h3>
              <p className="text-xs text-red-200/90 mt-0.5">
                Your 4-year election mandate as <strong>{pState.role}</strong> has reached its term limit. You must run for re-election or upgrade your Agency HQ to qualify for higher office.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => {
                const targetLvl = careerLevels.find(c => c.role === pState.role);
                const cost = targetLvl ? targetLvl.balanceReq / 2 : 1000000;
                handleStartCampaign(pState.role as any, cost);
              }}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer min-h-[44px]"
            >
              <Vote className="w-4 h-4" />
              <span>Launch Re-Election Campaign</span>
            </button>
            <button
              onClick={handleVacateOfficeSeat}
              className="bg-slate-800 hover:bg-red-900/60 text-red-300 border border-red-500/40 font-bold px-3 py-2.5 rounded-xl text-xs cursor-pointer min-h-[44px]"
            >
              Vacate Seat
            </button>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'certification', label: 'Agent Certification & License Approvals', icon: BadgeCheck },
          { id: 'tribunal_court', label: 'Disciplinary Tribunal & CAS Appeals Court ⚖️', icon: ShieldAlert },
          { id: 'federation_treasury', label: 'Federation Treasury & Prize Money', icon: Landmark },
          { id: 'league_reform', label: 'League Reform & Expansion Voting', icon: Scale },
          { id: 'ffp_monitor', label: 'Financial Fair Play Debt Monitor', icon: FileSpreadsheet },
          { id: 'career_path', label: 'Career Hierarchy Path', icon: Crown },
          { id: 'executive_hearings', label: 'Executive Action Hearings', icon: Scale },
          { id: 'campaign', label: 'Election Campaign Hub', icon: Vote },
          { id: 'policies', label: 'Administrative League Laws', icon: Sliders },
          { id: 'global_suite', label: '15-Point Global Governance Suite', icon: Landmark },
          { id: 'conflict_ethics', label: 'Conflict of Interest & Ethics', icon: ShieldAlert }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer min-h-[44px] ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB: DISCIPLINARY TRIBUNAL & CAS APPEALS COURT */}
      {activeTab === 'tribunal_court' && (
        <DisciplinaryTribunalCourt
          agency={agency}
          players={players}
          clubs={clubs}
          onUpdateAgency={(updater) => onUpdateAgency(updater(agency))}
          onUpdatePlayer={onUpdatePlayer}
          onShowToast={(msg, type) => {
            if (addToast) addToast(msg, type || 'info');
          }}
        />
      )}

      {/* TAB: FEDERATION TREASURY & PRIZE MONEY */}
      {activeTab === 'federation_treasury' && (
        <FederationTreasuryTab
          agency={agency}
          clubs={clubs}
          players={players}
          onUpdateAgency={onUpdateAgency}
          onUpdateClub={onUpdateClub}
          addToast={addToast}
        />
      )}

      {/* TAB 0.1: AGENT CERTIFICATION & SEASONAL AGENCY LICENSING APPROVALS */}
      {activeTab === 'certification' && (
        <div className="space-y-6">
          {/* Agent Certification Tier Status Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border-2 border-indigo-500/50 rounded-2xl p-6 shadow-2xl space-y-6">
            {(() => {
              const rep = agency.reputation || 0;
              let tierLevel = 1;
              let tierName = 'Grassroots Licensed Agent';
              let tierBadgeColor = 'bg-slate-700 text-slate-200';
              let playerCapText = 'Players rated ≤ 72 OVR | Regional Clubs';
              let clubCapText = 'Grassroots & Second Division Clubs';
              let perkText = 'Standard Local Transfers';

              if (rep >= 86) {
                tierLevel = 4;
                tierName = 'FIFA Global Super-Agent';
                tierBadgeColor = 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black';
                playerCapText = 'Unrestricted Superstars (89+ OVR & World Cup Stars)';
                clubCapText = 'Elite Tier Super-Clubs (Real Madrid, Man City, PSG, Bayern)';
                perkText = 'Full International & National Team Representation Granted!';
              } else if (rep >= 66) {
                tierLevel = 3;
                tierName = 'Continental Elite Agent';
                tierBadgeColor = 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black';
                playerCapText = 'Players rated ≤ 88 OVR (National Team Starters)';
                clubCapText = 'Continental Giant Clubs (UEFA Champions League Tier)';
                perkText = 'National Team Representation Unlocked!';
              } else if (rep >= 36) {
                tierLevel = 2;
                tierName = 'National Pro Agent';
                tierBadgeColor = 'bg-blue-600 text-white font-extrabold';
                playerCapText = 'Players rated ≤ 81 OVR (Top Division Pros)';
                clubCapText = 'Top Division Mid-Table Clubs';
                perkText = 'National Youth Squad Representation Unlocked!';
              }

              return (
                <div className="space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center text-indigo-300 shrink-0 shadow-lg">
                        <BadgeCheck className="w-8 h-8 animate-pulse text-amber-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] uppercase px-3 py-0.5 rounded-full shadow ${tierBadgeColor}`}>
                            Level {tierLevel} Certification
                          </span>
                          <span className="text-xs text-indigo-300 font-bold">Reputation: {rep} / 100</span>
                        </div>
                        <h3 className="text-2xl font-black text-white mt-1">{tierName}</h3>
                        <p className="text-xs text-indigo-200/90 mt-0.5">
                          Official FIFA Agent Certification status governing player representation caps and club negotiation access.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-indigo-500/30 p-3.5 rounded-2xl text-right min-w-[180px]">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Negotiation Access</p>
                      <p className="text-xs font-black text-amber-400">{clubCapText}</p>
                    </div>
                  </div>

                  {/* Privileges & Caps Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Representable Player Tier</span>
                      </p>
                      <p className="text-xs font-bold text-white">{playerCapText}</p>
                    </div>

                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Target Club Tiers</span>
                      </p>
                      <p className="text-xs font-bold text-white">{clubCapText}</p>
                    </div>

                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-amber-400" />
                        <span>National Team Rights</span>
                      </p>
                      <p className="text-xs font-bold text-amber-300">{perkText}</p>
                    </div>
                  </div>

                  {/* Certification Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-300">Certification Prestige Progress</span>
                      <span className="text-amber-400">{rep}% / 100% Rep</span>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 transition-all duration-500"
                        style={{ width: `${rep}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Presidential Review Panel: Seasonal Agency Licensing Approvals */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-amber-400" />
                    <span>Presidential Agency Review Panel (Seasonal Licensing)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Every season, review competing agency license applications. Approve or reject applicant agencies to expand federation licensing revenues and dictate market competition.
                  </p>
                </div>

                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-xl shrink-0">
                  Current Season Applications: {applicantAgencies.filter(a => a.status === 'pending').length} Pending
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {applicantAgencies.map((app) => (
                  <div
                    key={app.id}
                    className={`border rounded-2xl p-5 space-y-3 transition ${
                      app.status === 'approved'
                        ? 'bg-emerald-950/30 border-emerald-500/50'
                        : app.status === 'rejected'
                        ? 'bg-red-950/20 border-red-500/30 opacity-60'
                        : 'bg-slate-800/80 border-slate-700/80 hover:border-amber-500/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {app.region}
                        </span>
                        <h4 className="text-base font-black text-white mt-1">{app.name}</h4>
                        <p className="text-xs text-slate-300">Founder: <strong>{app.founder}</strong></p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-400 block">{formatMoney(app.licensingFee)}</span>
                        <span className="text-[10px] text-slate-400">License Treasury Fee</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                      <p className="text-slate-300"><strong>Specialty Focus:</strong> {app.specialty}</p>
                      <p className="text-slate-400"><strong>Proposed Fee Structure:</strong> {app.proposedFee}</p>
                    </div>

                    {app.status === 'pending' ? (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleApproveAgencyApplication(app.id)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition shadow-md min-h-[38px]"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve License (+{formatMoney(app.licensingFee)})</span>
                        </button>
                        <button
                          onClick={() => handleRejectAgencyApplication(app.id)}
                          className="bg-slate-800 hover:bg-red-900/60 text-red-300 border border-slate-700 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer transition min-h-[38px]"
                        >
                          Reject
                        </button>
                      </div>
                    ) : app.status === 'approved' ? (
                      <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 py-2 rounded-xl text-xs font-extrabold text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Licensed Agency Approved</span>
                      </div>
                    ) : (
                      <div className="bg-slate-800 text-slate-500 py-2 rounded-xl text-xs font-bold text-center">
                        Application Denied & Archived
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 0.2: LEAGUE REFORM & ASSEMBLY VOTING */}
      {activeTab === 'league_reform' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Scale className="w-6 h-6 text-amber-400" />
                  <span>Seasonal League Reform & Assembly Voting Panel</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  As an influential FIFA stakeholder, vote on proposed league expansions, promotion/relegation playoff rule changes, foreign quotas, and wage caps each season.
                </p>
              </div>

              <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 text-right shrink-0">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Assembly Clout</p>
                <p className="text-sm font-black text-amber-400">{pState.politicalInfluence || 50} Influence Points</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {reformProposals.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-slate-800/90 border border-slate-700 hover:border-amber-500/60 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
                        {prop.category}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                        prop.status === 'passed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {prop.status === 'passed' ? 'Passing Majority' : 'Voting in Assembly'}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-white">{prop.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{prop.description}</p>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-amber-300 font-semibold">
                      {prop.impactText}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-700/60">
                    {/* Vote Count Indicator */}
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-emerald-400">For: {prop.votesFor} Delegates</span>
                      <span className="text-red-400">Against: {prop.votesAgainst} Delegates</span>
                    </div>

                    {/* Voting Action Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleVoteOnReform(prop.id, 'for')}
                        className={`py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 min-h-[38px] ${
                          prop.userVote === 'for'
                            ? 'bg-emerald-600 text-white border-2 border-emerald-400 shadow-md'
                            : 'bg-slate-900 hover:bg-emerald-950 text-slate-300 border border-slate-700'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Vote FOR</span>
                      </button>

                      <button
                        onClick={() => handleVoteOnReform(prop.id, 'against')}
                        className={`py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 min-h-[38px] ${
                          prop.userVote === 'against'
                            ? 'bg-red-600 text-white border-2 border-red-400 shadow-md'
                            : 'bg-slate-900 hover:bg-red-950 text-slate-300 border border-slate-700'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Vote AGAINST</span>
                      </button>

                      <button
                        onClick={() => handleLobbyReformDelegates(prop.id)}
                        className="bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1 min-h-[38px]"
                        title="Spend €1M to buy +3 delegate votes"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Lobby (€1M)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 0.3: FINANCIAL FAIR PLAY DEBT MONITOR */}
      {activeTab === 'ffp_monitor' && (
        <div className="space-y-6">
          {/* Impending Seasonal FFP Audit Warning Banner */}
          <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/60 border-2 border-red-500/60 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-500/20 border-2 border-red-400 flex items-center justify-center text-red-400 shrink-0 shadow-lg animate-pulse">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] uppercase font-black px-3 py-0.5 rounded-full bg-red-500 text-white shadow">
                      {isAuditWarningPeriod ? '⚠️ Seasonal Audit Warning Active' : 'FFP Compliance System'}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      Audit Schedule: Week 38 (Current: Week {agency.currentWeek}) | {weeksUntilAudit} Weeks Until Audit
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">Financial Fair Play (FFP) Debt Monitor & Advisory Hub</h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                    Federation rules mandate all clubs maintain sustainable wage-to-turnover ratios (&le;70%) and avoid excessive debt. 
                    4 weeks prior to seasonal audit, agents should advise clients to restructure contracts with deferred incentives to slash club debt and prevent sanctions.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <button
                  onClick={handleManualTriggerFfpWarning}
                  className="bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
                  title="Test or trigger 4-week warning toast"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Trigger Warning Alert</span>
                </button>
                {representedClientsAtRisk.length > 0 && (
                  <button
                    onClick={handleBulkRestructureAll}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer min-h-[44px]"
                  >
                    <Handshake className="w-4 h-4" />
                    <span>Bulk Restructure All ({representedClientsAtRisk.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-red-500/30 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Clubs Overspending / At Risk</p>
                  <p className="text-base font-black text-red-400">{atRiskClubs.length} of {clubs.length} Clubs</p>
                </div>
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-amber-500/30 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Your Clients at Risk Clubs</p>
                  <p className="text-base font-black text-amber-300">{representedClientsAtRisk.length} Represented Players</p>
                </div>
                <Users className="w-6 h-6 text-amber-400" />
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Contract Restructuring Benefit</p>
                  <p className="text-base font-black text-emerald-400">-25% Club Debt &amp; +Fees</p>
                </div>
                <Coins className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* PRIORITY: Represented Clients Contract Restructuring Desk */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-emerald-400" />
                  <span>Agent Advisory Desk: Client Contract Restructuring</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Advise your clients at debt-laden clubs to accept backloaded/restructured wages. This slashes club debt by 25%, avoids federation point deductions, and yields high advisory commissions.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-xl self-start sm:self-auto">
                {representedClientsAtRisk.length} Affected Clients
              </span>
            </div>

            {representedClientsAtRisk.length === 0 ? (
              <div className="p-5 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="font-bold text-white">All Represented Clients are in FFP-Compliant Clubs</p>
                <p className="mt-0.5">None of your signed players are currently exposed to club insolvency or FFP points deduction penalties.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {representedClientsAtRisk.map(client => {
                  const club = clubs.find(c => c.id === client.clubId);
                  const wageWeekly = client.wage || 50000;
                  const newWageWeekly = Math.round(wageWeekly * 0.85);
                  const annualSavings = Math.round((wageWeekly - newWageWeekly) * 52);
                  const bonusCommission = Math.max(100000, Math.round(annualSavings * 0.15));

                  return (
                    <div key={client.id} className="bg-slate-950 p-4 rounded-xl border border-amber-500/40 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">{client.name}</span>
                            <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-1.5 py-0.5 rounded">{client.position} | OVR {client.rating}</span>
                          </div>
                          <p className="text-xs text-amber-400 font-bold mt-0.5">{club?.name || 'Club'}</p>
                        </div>
                        <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-black uppercase">
                          At Risk Club
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Current &rarr; New Wage</p>
                          <p className="font-bold text-slate-200">{formatMoney(wageWeekly)} &rarr; <span className="text-emerald-400">{formatMoney(newWageWeekly)}/wk</span></p>
                        </div>
                        <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Agency Advisory Fee</p>
                          <p className="font-bold text-amber-300">+{formatMoney(bonusCommission)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] text-slate-400">Club Debt Relief: <strong className="text-emerald-400">{formatMoney(annualSavings)}/yr</strong></span>
                        <button
                          onClick={() => handleAdviseRestructuring(client)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow"
                        >
                          <Handshake className="w-3.5 h-3.5" />
                          <span>Advise Restructure</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CLUBS FFP AUDIT DIRECTORY */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-6 h-6 text-red-400" />
                  <span>Clubs Financial Fair Play &amp; Debt Audit Directory</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Examine club financial balance sheets, spending levels, and debt ratios. Levy regulatory sanctions or leak forensic dossiers.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                  {(['all', 'breach', 'warning', 'compliant'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFfpFilterStatus(f)}
                      className={`px-3 py-1 rounded-lg capitalize transition cursor-pointer ${
                        ffpFilterStatus === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f === 'breach' ? 'In Breach' : f === 'warning' ? 'At Risk' : f}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-56">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={ffpSearchQuery}
                    onChange={(e) => setFfpSearchQuery(e.target.value)}
                    placeholder="Search club name..."
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Clubs Audit Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-2">
                <span>League Clubs Balance Sheet ({clubs.length} Clubs Evaluated)</span>
                <span className="text-red-400 font-mono">Disciplinary Sanctions Ready</span>
              </div>

              <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                {clubs
                  .filter(c => {
                    if (ffpSearchQuery && !c.name.toLowerCase().includes(ffpSearchQuery.toLowerCase())) return false;
                    const ffp = batchFfpMap.get(c.id);
                    if (!ffp) return false;
                    if (ffpFilterStatus === 'breach') return ffp.status === 'In FFP Breach';
                    if (ffpFilterStatus === 'warning') return ffp.status === 'At Risk';
                    if (ffpFilterStatus === 'compliant') return ffp.status === 'Compliant';
                    return true;
                  })
                  .map((club) => {
                    const ffp = batchFfpMap.get(club.id)!;
                    const clubMyClients = clientsByClub.get(club.id) || [];

                    let badgeStyle = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
                    if (ffp.status === 'In FFP Breach') badgeStyle = 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
                    else if (ffp.status === 'At Risk') badgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/40';

                    return (
                      <div
                        key={club.id}
                        className="bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 rounded-2xl p-4 flex flex-col gap-3 transition"
                      >
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                          <div className="space-y-1.5 min-w-[240px]">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded border ${badgeStyle}`}>
                                {ffp.status}
                              </span>
                              <span className="text-xs text-slate-400 font-bold">Tier {club.tier || 1} | Points: {club.points}</span>
                              {clubMyClients.length > 0 && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-black">
                                  {clubMyClients.length} Represented Client{clubMyClients.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>

                            <h4 className="text-base font-black text-white">{club.name}</h4>
                            <p className="text-xs text-slate-300">
                              Chairman: <strong>{club.chairmanName}</strong> | Budget: <strong className="text-emerald-400">{formatMoney(club.transferBudget)}</strong> | Turnover: <strong className="text-slate-200">{formatMoney(ffp.revenueThisSeason)}/yr</strong>
                            </p>
                          </div>

                          {/* Financial Statistics Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                              <p className="text-[9px] text-slate-400 uppercase font-bold">Total Spent</p>
                              <p className="font-black font-mono text-white">{formatMoney(ffp.netSpend)}</p>
                            </div>

                            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                              <p className="text-[9px] text-slate-400 uppercase font-bold">Annual Payroll</p>
                              <p className="font-black font-mono text-slate-300">{formatMoney(ffp.annualPayroll)}</p>
                            </div>

                            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                              <p className="text-[9px] text-slate-400 uppercase font-bold">FFP Loss Cap</p>
                              <p className="font-black font-mono text-emerald-400">{formatMoney(ffp.allowableLossCap)}</p>
                            </div>

                            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                              <p className="text-[9px] text-slate-400 uppercase font-bold">Debt Ratio</p>
                              <p className={`font-black font-mono ${ffp.debtRatio > 100 ? 'text-red-400' : ffp.debtRatio > 80 ? 'text-amber-300' : 'text-emerald-400'}`}>
                                {ffp.debtRatio}%
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 4 Core FFP Factors Breakdown Pills */}
                        {ffp.factors && (
                          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">4 FFP Factors:</span>
                              
                              {/* Factor 1: Market Dealing */}
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[11px] text-amber-300 font-semibold" title={`Market Dealing: ${ffp.factors.marketDealing.description}`}>
                                <Coins className="w-3 h-3 text-amber-400" />
                                <span>{ffp.factors.marketDealing.strategy} ({ffp.factors.marketDealing.score})</span>
                              </span>

                              {/* Factor 2: Management Style */}
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[11px] text-blue-300 font-semibold" title={`Governance: ${ffp.factors.management.description}`}>
                                <Landmark className="w-3 h-3 text-blue-400" />
                                <span>{ffp.factors.management.governanceStyle} ({ffp.factors.management.score})</span>
                              </span>

                              {/* Factor 3: Income Rating */}
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[11px] text-emerald-300 font-semibold" title={`Income Stream: ${ffp.factors.income.description}`}>
                                <TrendingUp className="w-3 h-3 text-emerald-400" />
                                <span>Revenue: {ffp.factors.income.score}/100</span>
                              </span>

                              {/* Factor 4: Book Balancing Competence */}
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[11px] text-purple-300 font-semibold" title={`Book Balancing: ${ffp.factors.bookBalancing.description}`}>
                                <FileSpreadsheet className="w-3 h-3 text-purple-400" />
                                <span>Books: {ffp.factors.bookBalancing.score}/100</span>
                              </span>
                            </div>

                            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                              ffp.factors.overallHealthScore >= 70 ? 'text-emerald-400 bg-emerald-950/60' :
                              ffp.factors.overallHealthScore >= 45 ? 'text-amber-300 bg-amber-950/60' : 'text-red-400 bg-red-950/60'
                            }`}>
                              Health Index: {ffp.factors.overallHealthScore}/100
                            </span>
                          </div>
                        )}

                        {/* Disciplinary Sanctions Actions */}
                        <div className="flex flex-wrap gap-1.5 justify-end pt-1 border-t border-slate-800">
                          {clubMyClients.length > 0 && !ffp.isWithinFfp && (
                            <button
                              onClick={() => handleAdviseRestructuring(clubMyClients[0])}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-2.5 py-2 rounded-xl text-xs transition cursor-pointer min-h-[38px] flex items-center gap-1 shadow"
                              title="Restructure your client contract to reduce club debt"
                            >
                              <Handshake className="w-3.5 h-3.5" />
                              <span>Restructure</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleExecuteSanction(club, 'fine')}
                            className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-2.5 py-2 rounded-xl text-xs transition cursor-pointer min-h-[38px] flex items-center gap-1"
                            title="Levy €10M FFP fine collected into federation treasury"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>Fine €10M</span>
                          </button>

                          <button
                            onClick={() => handleExecuteSanction(club, 'points_deduction')}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-2.5 py-2 rounded-xl text-xs transition cursor-pointer min-h-[38px] flex items-center gap-1"
                            title="Deduct -6 points from league standings"
                          >
                            <TrendingDown className="w-3.5 h-3.5" />
                            <span>-6 Pts</span>
                          </button>

                          <button
                            onClick={() => handleExecuteSanction(club, 'transfer_ban')}
                            className="bg-slate-950 hover:bg-red-950 text-red-300 border border-red-500/40 font-bold px-2.5 py-2 rounded-xl text-xs cursor-pointer transition min-h-[38px] flex items-center gap-1"
                            title="Impose 2-window transfer registration ban"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Transfer Ban</span>
                          </button>

                          <button
                            onClick={() => handleExecuteSanction(club, 'wage_slash_order')}
                            className="bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40 font-bold px-2.5 py-2 rounded-xl text-xs cursor-pointer transition min-h-[38px] flex items-center gap-1"
                            title="Mandate 15% squad wage slash"
                          >
                            <Percent className="w-3.5 h-3.5" />
                            <span>Slash Wages</span>
                          </button>

                          <button
                            onClick={() => handleExecuteSanction(club, 'forensic_audit')}
                            className="bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-500/40 font-bold px-2.5 py-2 rounded-xl text-xs cursor-pointer transition min-h-[38px] flex items-center gap-1"
                            title="Spend €500k Dark Arts to leak forensic accounting audit"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Leak Dossier</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: CAREER HIERARCHY PATH */}
      {activeTab === 'career_path' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span>Executive Governance Progression Path</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Meet reputation, financial, and Agency HQ Office requirements to unlock election campaigns for higher federation offices.
                </p>
              </div>

              <div className="bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-300 shrink-0">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>Agency HQ Level: {agency.officeLevel} / 5</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2">
              {careerLevels.map((lvl, idx) => {
                const isCurrentRole = currentRole === lvl.role;
                const meetsOffice = agency.officeLevel >= lvl.officeReq;

                return (
                  <div
                    key={lvl.role}
                    className={`border rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition ${
                      isCurrentRole
                        ? 'bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border-amber-500 shadow-xl'
                        : lvl.unlocked
                        ? 'bg-slate-800/80 border-slate-700/80'
                        : 'bg-slate-900/40 border-slate-800/80 opacity-70'
                    }`}
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
                          Tier {idx + 1} Position
                        </span>
                        {isCurrentRole && (
                          <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                            Current Role Held
                          </span>
                        )}
                      </div>

                      <h4 className="text-lg font-bold text-white">{lvl.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{lvl.desc}</p>

                      <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1 font-bold">
                          {meetsOffice ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
                          <span className={meetsOffice ? 'text-emerald-400' : 'text-amber-300'}>
                            Agency HQ: Lvl {lvl.officeReq}+ ({lvl.officeName})
                          </span>
                        </span>

                        <span className="flex items-center gap-1">
                          {agency.reputation >= lvl.reputationReq ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-slate-500" />}
                          Reputation: {lvl.reputationReq}+
                        </span>

                        <span className="flex items-center gap-1">
                          {agency.balance >= lvl.balanceReq ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-slate-500" />}
                          Capital: {formatMoney(lvl.balanceReq)}
                        </span>
                      </div>

                      {lvl.tierLockReason && (
                        <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-[11px] text-red-300 font-semibold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                          <span>{lvl.tierLockReason}</span>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 w-full md:w-auto space-y-2">
                      {isCurrentRole ? (
                        <div className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-4 py-2.5 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-2 min-h-[44px]">
                          <ShieldCheck className="w-4 h-4" />
                          <span>In Office (Season {pState.tenureSeason || 1}/3)</span>
                        </div>
                      ) : lvl.unlocked ? (
                        <button
                          onClick={() => handleStartCampaign(lvl.role as any, lvl.balanceReq / 2)}
                          className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer min-h-[44px]"
                        >
                          <Vote className="w-4 h-4" />
                          <span>Launch Election Campaign ({formatMoney(lvl.balanceReq / 2)})</span>
                        </button>
                      ) : !meetsOffice ? (
                        <button
                          onClick={handleDirectOfficeUpgrade}
                          className="w-full md:w-auto bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[44px]"
                        >
                          <Building2 className="w-4 h-4 text-amber-400" />
                          <span>Upgrade Office HQ to Lvl {lvl.officeReq}</span>
                        </button>
                      ) : (
                        <div className="bg-slate-800 text-slate-400 border border-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-2 min-h-[44px]">
                          <Lock className="w-4 h-4 text-amber-400" />
                          <span>Hierarchy Requirements Locked</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* NEW TAB: EXECUTIVE ACTION HEARINGS */}
      {activeTab === 'executive_hearings' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                <span>Federation Presidential Action & Crisis Hearings Desk</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Adjudicate critical club insolvencies, match-fixing referee scandals, super league breakaways, and foreign sovereign takeover petitions.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {(() => {
                const activeScenarios = getFederationScenarios(clubs, players).filter(s => !resolvedScenarioIds.includes(s.id));
                
                if (activeScenarios.length === 0) {
                  return (
                    <div className="bg-slate-800/80 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shadow-lg">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-black text-white">All Emergency Hearings & Crises Resolved</h4>
                      <p className="text-xs text-slate-300 max-w-lg mx-auto">
                        Your presidential orders have been successfully enacted across all federation jurisdictions. No active emergency hearings require ruling at this time.
                      </p>
                    </div>
                  );
                }

                return activeScenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded ${
                            scenario.severity === 'EMERGENCY' ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-slate-950 font-bold'
                          }`}>
                            {scenario.severity} HEARING
                          </span>
                          <span className="text-xs text-slate-400 font-bold">
                            Required Role: {scenario.requiredRoleMin}+
                          </span>
                        </div>
                        <h4 className="text-lg font-black text-white mt-1">{scenario.title}</h4>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                      <p className="text-xs text-amber-300 font-extrabold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{scenario.headline}</span>
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">{scenario.summary}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {scenario.options.map((opt) => (
                        <div
                          key={opt.id}
                          className="bg-slate-900 border border-slate-700/80 hover:border-amber-500/60 rounded-xl p-4 flex flex-col justify-between space-y-3 transition"
                        >
                          <div className="space-y-1.5">
                            <h5 className="text-xs font-black text-white">{opt.label}</h5>
                            <p className="text-[11px] text-slate-400 leading-snug">{opt.description}</p>
                          </div>

                          <button
                            onClick={() => handleExecuteScenarioOption(scenario, opt.id)}
                            className="w-full bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 font-black py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[40px]"
                          >
                            <Scale className="w-3.5 h-3.5" />
                            <span>Pass Legislative Order</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ELECTION CAMPAIGN HUB */}
      {activeTab === 'campaign' && (
        <div className="space-y-6">
          {pState.campaign ? (
            <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold px-2.5 py-0.5 rounded-full uppercase">
                    Active Election Campaign
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">
                    Running for {pState.campaign.targetRole}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lobby key voter club chairmen, spend agency resources, and build delegate consensus before holding the final vote tally.
                  </p>
                </div>

                <div className="bg-slate-800 px-5 py-3 rounded-2xl border border-slate-700 text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Voter Delegate Support</p>
                  <p className="text-2xl font-black text-amber-400">{pState.campaign.voterSupport}%</p>
                </div>
              </div>

              {/* Voter Support Progress Bar with 55% Majority Line */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs text-slate-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Vote className="w-4 h-4 text-amber-400" />
                    <span>Current Delegate Consensus: <strong className="text-amber-400">{pState.campaign.voterSupport}%</strong></span>
                  </span>
                  <span className="text-emerald-400 font-extrabold">55% Majority Needed to Win</span>
                </div>

                <div className="relative w-full h-5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  {/* Majority threshold marker line */}
                  <div className="absolute top-0 bottom-0 left-[55%] w-1 bg-amber-400 z-10 shadow-lg shadow-amber-400/50" title="55% Majority Line" />
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-500"
                    style={{ width: `${pState.campaign.voterSupport}%` }}
                  />
                </div>
              </div>

              {/* Real-Time Election Sentiment Indicator */}
              {(() => {
                const support = pState.campaign.voterSupport;
                const pledgedCount = pState.campaign.keyVoterClubs.filter(c => c.supported).length;
                const totalClubs = pState.campaign.keyVoterClubs.length;

                let sentimentColor = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400';
                let badgeBg = 'bg-emerald-500 text-slate-950';
                let sentimentTitle = 'Favorable Constituency Sentiment';
                let sentimentQuote = `"Constituency delegates applaud your platform on TV revenue distribution and agent fee cap reforms."`;

                if (support < 45) {
                  sentimentColor = 'bg-red-500/10 border-red-500/40 text-red-400';
                  badgeBg = 'bg-red-500 text-white';
                  sentimentTitle = 'Hostile Opposition Sentiment';
                  sentimentQuote = `"Factions of club chairmen remain highly skeptical. Urgent lobbying is required to avoid vote collapse."`;
                } else if (support < 65) {
                  sentimentColor = 'bg-amber-500/10 border-amber-500/40 text-amber-300';
                  badgeBg = 'bg-amber-500 text-slate-950';
                  sentimentTitle = 'Contested / Neutral Sentiment';
                  sentimentQuote = `"Delegates are divided evenly. Undecided chairmen are awaiting last-minute promises before declaring support."`;
                }

                return (
                  <div className={`p-4 rounded-xl border ${sentimentColor} space-y-2 transition-all`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${badgeBg} animate-pulse`}>
                          Real-Time Sentiment
                        </span>
                        <h4 className="font-extrabold text-sm text-white">{sentimentTitle}</h4>
                      </div>
                      <span className="text-xs font-bold text-slate-300">
                        Pledged Clubs: <strong className="text-amber-300">{pledgedCount} / {totalClubs}</strong>
                      </span>
                    </div>
                    <p className="text-xs italic text-slate-300">
                      {sentimentQuote}
                    </p>
                  </div>
                );
              })()}

              {/* Spend Agency Resources to Win Support */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Spend Agency Resources for Campaign Standing</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleSpendCampaignResource('cash')}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-3.5 rounded-xl text-left space-y-1 cursor-pointer transition min-h-[44px]"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                      <span>Ad Campaign</span>
                      <span>+8% Support</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Spend €1,000,000 Cash on media campaign</p>
                  </button>

                  <button
                    onClick={() => handleSpendCampaignResource('reputation')}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-3.5 rounded-xl text-left space-y-1 cursor-pointer transition min-h-[44px]"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
                      <span>Leverage Rep</span>
                      <span>+10% Support</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Spend 3 Reputation points for voter clout</p>
                  </button>

                  <button
                    onClick={() => handleSpendCampaignResource('influence')}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-3.5 rounded-xl text-left space-y-1 cursor-pointer transition min-h-[44px]"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                      <span>Pull Favor</span>
                      <span>+12% Support</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Spend 10 Political Influence points</p>
                  </button>

                  <button
                    onClick={() => handleSpendCampaignResource('gala')}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-3.5 rounded-xl text-left space-y-1 cursor-pointer transition min-h-[44px]"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-yellow-300">
                      <span>Host Gala</span>
                      <span>+15% Support</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Host €2.5M Federation Dinner Gala</p>
                  </button>
                </div>
              </div>

              {/* Key Voter Clubs Lobbying Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Key Delegate Voter Clubs</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pState.campaign.keyVoterClubs.map((club) => (
                    <div
                      key={club.clubId}
                      className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">{club.clubName}</p>
                        <p className="text-[11px] text-slate-400">
                          Status: {club.supported ? <strong className="text-emerald-400">Pledged Support (+12%)</strong> : <span className="text-amber-400">Undecided</span>}
                        </p>
                      </div>

                      {club.supported ? (
                        <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Secured</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleLobbyVoterClub(club.clubId)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer min-h-[38px]"
                        >
                          Lobby ({formatMoney(club.bribeCost)})
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Execute Vote Action */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  disabled={isSimulatingVote}
                  onClick={handleSimulateElectionVote}
                  className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold px-8 py-3 rounded-xl text-sm flex items-center gap-2 shadow-2xl transition active:scale-95 cursor-pointer min-h-[48px]"
                >
                  <Vote className="w-5 h-5" />
                  <span>{isSimulatingVote ? 'Tallying Delegate Votes...' : 'Execute Official Vote Tally'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-5">
              <Vote className="w-12 h-12 text-amber-500 mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-white">Select Federation Seat for Election Campaign</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Choose a target position from the Career Hierarchy Path below to launch a campaign war chest!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto pt-2">
                {[
                  { role: 'Regional Delegate', cost: 1000000 },
                  { role: 'Federation Director', cost: 5000000 },
                  { role: 'Continental President', cost: 15000000 },
                  { role: 'FIFA Global President', cost: 37500000 }
                ].map((item) => (
                  <button
                    key={item.role}
                    onClick={() => handleStartCampaign(item.role as any, item.cost)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-xl text-left space-y-2 transition cursor-pointer min-h-[44px]"
                  >
                    <p className="text-sm font-bold text-white">{item.role}</p>
                    <p className="text-xs font-extrabold text-amber-400">War Chest: {formatMoney(item.cost)}</p>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold inline-block">
                      Launch Campaign
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADMINISTRATIVE LEAGUE LAWS & PROPOSAL VOTING */}
      {activeTab === 'policies' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <span>Administrative Rules & Propose League Law Changes</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Propose legislative bills to modify salary caps, transfer window durations, foreign quotas, and FIFA commission caps.
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl text-right">
              <p className="text-[10px] text-amber-400 uppercase font-bold">Legislative Power</p>
              <p className="text-sm font-bold text-white">{currentRole}</p>
            </div>
          </div>

          {/* Current Enacted Laws Summary Chips */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase font-bold">Squad Size Cap</p>
              <p className="text-xs font-black text-amber-400">{activePolicies.maxSquadRegistration ?? 25} Reg. Players</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase font-bold">Homegrown Quota</p>
              <p className="text-xs font-black text-emerald-400">Min {activePolicies.minHomegrownQuota ?? 8} HG</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase font-bold">U-21 Exemption</p>
              <p className="text-xs font-black text-sky-400">{activePolicies.u21ExemptionEnabled !== false ? 'Automatic' : 'Restricted'}</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase font-bold">Squad Salary Cap</p>
              <p className="text-xs font-black text-amber-400">{formatMoney(activePolicies.salaryCapPerYear)} / yr</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase font-bold">Agent Fee Cap</p>
              <p className="text-xs font-black text-amber-400">{activePolicies.agentCommissionCap}% Max</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase font-bold">Transfer Window</p>
              <p className="text-xs font-black text-amber-400">{activePolicies.transferWindowWeeks} Weeks</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase font-bold">Foreign Limit</p>
              <p className="text-xs font-black text-amber-400">{activePolicies.foreignPlayerLimit} Players</p>
            </div>
          </div>

          {/* Legislative Bill Proposal Form */}
          <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/80 space-y-5">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Draft New Legislative Bill & Propose Rule Amendments</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Proposed Max Squad Registration */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 flex justify-between">
                  <span>Max Registered Squad Quota</span>
                  <span className="text-emerald-400">{proposedMaxSquadRegistration} Players</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[21, 23, 25, 28].map(val => (
                    <button
                      key={val}
                      onClick={() => setProposedMaxSquadRegistration(val)}
                      className={`py-2 rounded-lg text-xs font-bold border transition cursor-pointer min-h-[38px] ${
                        proposedMaxSquadRegistration === val ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">Unregistered players will be strictly banned from match lineups.</p>
              </div>

              {/* Proposed Min Homegrown Quota */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 flex justify-between">
                  <span>Homegrown Minimum Quota</span>
                  <span className="text-emerald-400">Min {proposedMinHomegrownQuota} HG</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[4, 6, 8, 10].map(val => (
                    <button
                      key={val}
                      onClick={() => setProposedMinHomegrownQuota(val)}
                      className={`py-2 rounded-lg text-xs font-bold border transition cursor-pointer min-h-[38px] ${
                        proposedMinHomegrownQuota === val ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      {val} HG
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">Enforces national academy development by requiring trained domestic talents.</p>
              </div>

              {/* Proposed U21 Youth Exemption */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 flex justify-between">
                  <span>U-21 Youth Automatic Exemption</span>
                  <span className={proposedU21Exemption ? 'text-sky-400' : 'text-amber-400'}>{proposedU21Exemption ? 'Enabled' : 'Disabled'}</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setProposedU21Exemption(true)}
                    className={`py-2 rounded-lg text-xs font-bold border transition cursor-pointer min-h-[38px] ${
                      proposedU21Exemption ? 'bg-sky-600 text-white border-sky-400' : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    ✓ U21 Exempt (Free)
                  </button>
                  <button
                    onClick={() => setProposedU21Exemption(false)}
                    className={`py-2 rounded-lg text-xs font-bold border transition cursor-pointer min-h-[38px] ${
                      !proposedU21Exemption ? 'bg-amber-600 text-white border-amber-400' : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    ✕ Must Register U21s
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">If enabled, players aged ≤21 can play without occupying a senior registration slot.</p>
              </div>

              {/* Proposed Salary Cap */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 flex justify-between">
                  <span>Proposed Annual Salary Cap</span>
                  <span className="text-emerald-400">{formatMoney(proposedSalaryCap)}</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5000000, 10000000, 20000000, 50000000].map(val => (
                    <button
                      key={val}
                      onClick={() => setProposedSalaryCap(val)}
                      className={`py-2 rounded-lg text-xs font-bold border transition cursor-pointer min-h-[38px] ${
                        proposedSalaryCap === val ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      {formatMoney(val)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Proposed Transfer Window Weeks */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 flex justify-between">
                  <span>Proposed Transfer Window Duration</span>
                  <span className="text-emerald-400">{proposedWindowWeeks} Weeks</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[4, 8, 12].map(val => (
                    <button
                      key={val}
                      onClick={() => setProposedWindowWeeks(val)}
                      className={`py-2 rounded-lg text-xs font-bold border transition cursor-pointer min-h-[38px] ${
                        proposedWindowWeeks === val ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      {val} Weeks
                    </button>
                  ))}
                </div>
              </div>

              {/* Proposed Foreign Quota */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 flex justify-between">
                  <span>Proposed Foreign Player Limit</span>
                  <span className="text-emerald-400">{proposedForeignQuota} Players</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 5, 8, 12].map(val => (
                    <button
                      key={val}
                      onClick={() => setProposedForeignQuota(val)}
                      className={`py-2 rounded-lg text-xs font-bold border transition cursor-pointer min-h-[38px] ${
                        proposedForeignQuota === val ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Proposed Agent Commission Cap */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 flex justify-between">
                  <span>Proposed FIFA Agent Commission Cap</span>
                  <span className="text-emerald-400">{proposedCommissionCap}%</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 25].map(val => (
                    <button
                      key={val}
                      onClick={() => setProposedCommissionCap(val)}
                      className={`py-2 rounded-lg text-xs font-bold border transition cursor-pointer min-h-[38px] ${
                        proposedCommissionCap === val ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Voting Simulation Progress Indicator */}
            {isLegislating && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-bold text-emerald-400">
                  <span>Federation Delegate Assembly Voting in Progress...</span>
                  <span>{legislativeProgress}% Votes Tallied</span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${legislativeProgress}%` }} />
                </div>
              </div>
            )}

            <button
              disabled={isLegislating}
              onClick={handleInitiateLegislativeVote}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold py-3.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer min-h-[48px]"
            >
              <Vote className="w-5 h-5" />
              <span>{isLegislating ? 'Voting Delegates in Progress...' : 'Propose Bill & Execute Delegate Assembly Vote'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3.5: 15-POINT GLOBAL GOVERNANCE & FEDERATION EXPANSION SUITE */}
      {activeTab === 'global_suite' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Landmark className="w-6 h-6 text-amber-400" />
                <span>15-Point Global Federation Executive Suite</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Exercise supreme presidential power over TV tenders, national team appointments, FFP audits, World Cup host bids, and integrity commissions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Feature 1: FFP Audit */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <h4 className="font-bold text-xs text-white">1. FFP Financial Fair Play Audits</h4>
                </div>
                <select
                  value={selectedFfpClubId}
                  onChange={(e) => setSelectedFfpClubId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2 text-xs font-semibold"
                >
                  <option value="">-- Select Target Club --</option>
                  {clubs.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (Budget: {formatMoney(c.transferBudget)})</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button onClick={() => handleFfpAudit(selectedFfpClubId, 'fine')} className="flex-1 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold p-2 rounded-xl">
                    Levy €10M Fine
                  </button>
                  <button onClick={() => handleFfpAudit(selectedFfpClubId, 'ban')} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold p-2 rounded-xl">
                    UEFA Ban
                  </button>
                </div>
              </div>

              {/* Feature 2: Global Super League */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <h4 className="font-bold text-xs text-white">2. Breakaway Super League Resolution</h4>
                </div>
                <p className="text-[11px] text-slate-400">Current Status: <strong className="text-amber-300">{pState.activePolicies?.superLeagueStatus || 'Banned'}</strong></p>
                <div className="flex gap-2">
                  <button onClick={() => handleSuperLeagueDecision('ban')} className="flex-1 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold p-2 rounded-xl">
                    Ban Super League
                  </button>
                  <button onClick={() => handleSuperLeagueDecision('sanction')} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold p-2 rounded-xl">
                    Sanction & Co-Exist
                  </button>
                </div>
              </div>

              {/* Feature 3: National Team Manager */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-xs text-white">3. National Team Coach Appointment</h4>
                </div>
                <div className="space-y-1.5 text-xs">
                  <input
                    type="text"
                    value={selectedCoachName}
                    onChange={(e) => setSelectedCoachName(e.target.value)}
                    placeholder="Coach Name"
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white text-xs font-semibold"
                  />
                  <button onClick={handleAppointNationalManager} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-2 rounded-xl text-xs">
                    Appoint Head Coach (€5,000,000)
                  </button>
                </div>
              </div>

              {/* Feature 4: World Cup Bidding */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-xs text-white">4. FIFA World Cup Host Bid</h4>
                </div>
                <p className="text-[11px] text-slate-400">Campaign to bring World Cup tournament to home nation (+15 Prestige).</p>
                <button onClick={handleWorldCupHostBid} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold p-2 rounded-xl text-xs">
                  Submit World Cup Bid (€10,000,000)
                </button>
              </div>

              {/* Feature 5: VAR & Football Laws */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <h4 className="font-bold text-xs text-white">5. VAR & Offside Margin Laws</h4>
                </div>
                <div className="flex gap-2">
                  {(['Strict', 'Lenient', 'Off'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => handleVarAndRulebook(mode)}
                      className={`flex-1 p-2 rounded-xl text-[11px] font-bold border ${
                        pState.activePolicies?.varStrictness === mode ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      VAR {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feature 6: National Youth Facility */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <h4 className="font-bold text-xs text-white">6. National Youth Excellence Center</h4>
                </div>
                <p className="text-[11px] text-slate-400">Build nationwide youth development center to boost youth ratings.</p>
                <button onClick={handleNationalYouthFacility} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold p-2 rounded-xl text-xs">
                  Construct Youth Facility (€20,000,000)
                </button>
              </div>

              {/* Feature 7: Work Permit Points */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  <h4 className="font-bold text-xs text-white">7. Work Permit Points Threshold</h4>
                </div>
                <div className="flex gap-2">
                  {[10, 15, 20].map(pts => (
                    <button
                      key={pts}
                      onClick={() => handleWorkPermitPoints(pts)}
                      className="flex-1 bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold p-2 rounded-xl"
                    >
                      {pts} Pts
                    </button>
                  ))}
                </div>
              </div>

              {/* Feature 8: Referee Integrity Commission */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-xs text-white">8. Referee Integrity Audit</h4>
                </div>
                <p className="text-[11px] text-slate-400">Deploy integrity inspectors to eliminate match-fixing scandals.</p>
                <button onClick={handleRefereeIntegrity} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-2 rounded-xl text-xs">
                  Deploy Integrity Panel (€3,000,000)
                </button>
              </div>

              {/* Feature 9: TV Broadcast Rights */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-xs text-white">9. TV Broadcast Rights Tender</h4>
                </div>
                <p className="text-[11px] text-slate-400">Sell multi-year TV package to global networks (+€15,000,000 bonus).</p>
                <button onClick={handleTvRightsTender} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-2 rounded-xl text-xs">
                  Sign TV Rights Tender (€1.5B)
                </button>
              </div>

              {/* Feature 10: FIFA Agent Licensing Exam */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-xs text-white">10. Mandatory FIFA Agent Exam</h4>
                </div>
                <p className="text-[11px] text-slate-400">Enforce agent licensing exams and collect annual licensing fees.</p>
                <button onClick={handleAgentExamLicensing} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold p-2 rounded-xl text-xs">
                  Enforce Agent Exams (+€5M)
                </button>
              </div>

              {/* Feature 11: Domestic Supercup Overseas */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <h4 className="font-bold text-xs text-white">11. Overseas Supercup Hosting</h4>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleSupercupGlobalHosting('Saudi Arabia (Riyadh)')} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white text-[11px] font-bold p-2 rounded-xl">
                    Riyadh (+€12M)
                  </button>
                  <button onClick={() => handleSupercupGlobalHosting('USA (Los Angeles)')} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold p-2 rounded-xl">
                    USA (+€12M)
                  </button>
                </div>
              </div>

              {/* Feature 12: Anti-Doping Blood Audits */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-400" />
                  <h4 className="font-bold text-xs text-white">12. Anti-Doping Random Audits</h4>
                </div>
                <p className="text-[11px] text-slate-400">Order unannounced anti-doping blood testing across all top clubs.</p>
                <button onClick={handleAntiDopingAudit} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold p-2 rounded-xl text-xs">
                  Trigger Unannounced Audits
                </button>
              </div>

              {/* Feature 13: Luxury Tax Redistribution */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                  <h4 className="font-bold text-xs text-white">13. Luxury Tax Redistribution</h4>
                </div>
                <p className="text-[11px] text-slate-400">Tax high-spending mega clubs 10% to fund lower league grassroots academies.</p>
                <button onClick={handleLuxuryTaxSystem} className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold p-2 rounded-xl text-xs">
                  Enact 10% Luxury Tax
                </button>
              </div>

              {/* Feature 14: Foreign Takeover Shield */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <h4 className="font-bold text-xs text-white">14. Foreign Takeover Shield</h4>
                </div>
                <p className="text-[11px] text-slate-400">Legislate immunity laws shielding domestic clubs from hostile state takeovers.</p>
                <button onClick={handleForeignTakeoverShield} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-2 rounded-xl text-xs">
                  Enact Takeover Shield Law
                </button>
              </div>

              {/* Feature 15: Football Hall of Fame Medals */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-300" />
                  <h4 className="font-bold text-xs text-white">15. Hall of Fame & Medals</h4>
                </div>
                <p className="text-[11px] text-slate-400">Induct legendary retired clients or presidents into Hall of Fame (+5 Rep).</p>
                <button onClick={() => handleHallOfFameInduction('Sir Alex Ferguson')} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold p-2 rounded-xl text-xs">
                  Award Medal of Honor (+5 Rep)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONFLICT OF INTEREST & ETHICS COMMITTEE */}
      {activeTab === 'conflict_ethics' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  <span>Dual-Role Conflict of Interest & Insider Operations</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Holding dual authority as Agent and Club President allows scouting own players for inflated transfer fees and enforcing insider client contracts.
                </p>
              </div>

              <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Ethics Audit Hazard</p>
                <p className={`text-xl font-black ${(pState.conflictScandalLevel || 0) > 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {pState.conflictScandalLevel || 0}%
                </p>
              </div>
            </div>

            {/* DUAL-ROLE LOGIC BRIDGE PANEL */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Feature 1: Scout Own Players for Transfer Fees */}
              <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Scout Own Players for Max Transfer Fees</h4>
                    <p className="text-[11px] text-slate-400">Perform an insider scouting audit on your club's players to inflate market value (+25%) and spark bidding wars.</p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <label className="block text-xs font-bold text-slate-300">Select Club Player to Scout & Inflate:</label>
                  <select
                    value={selectedScoutPlayerId}
                    onChange={(e) => setSelectedScoutPlayerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose Player from {userClub?.name || 'Club'} --</option>
                    {players.filter(p => p.clubId === userClub?.id).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.position}) - OVR {p.rating} | Market Val: {formatMoney(p.value)}
                      </option>
                    ))}
                  </select>

                  <button
                    disabled={!selectedScoutPlayerId}
                    onClick={() => handleScoutOwnPlayer(selectedScoutPlayerId)}
                    className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-extrabold py-3 rounded-xl text-xs transition cursor-pointer min-h-[44px] flex items-center justify-center gap-2 shadow-lg"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Execute Insider Scouting & Inflate Value (+25%)</span>
                  </button>
                </div>
              </div>

              {/* Feature 2: Negotiate 'Insider' Contracts with Perks */}
              <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 space-y-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Negotiate 'Insider' Contracts with Perks</h4>
                    <p className="text-[11px] text-slate-400">Use presidential leverage to sign agency clients to lucrative perks and high commission rates.</p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <label className="block text-xs font-bold text-slate-300">Select Agency Client at Your Club:</label>
                  <select
                    value={selectedInsiderPlayerId}
                    onChange={(e) => setSelectedInsiderPlayerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose Client Playing at Your Club --</option>
                    {players.filter(p => p.isMyClient && p.clubId === userClub?.id).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.position}) - Comm: {p.agentCommission}% | Wage: {formatMoney(p.wage)}/wk
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      disabled={!selectedInsiderPlayerId}
                      onClick={() => handleNegotiateInsiderContract(selectedInsiderPlayerId, 'commission25')}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold p-2.5 rounded-xl text-[11px] transition cursor-pointer min-h-[40px]"
                    >
                      Enforce 25% Comm Rate
                    </button>

                    <button
                      disabled={!selectedInsiderPlayerId}
                      onClick={() => handleNegotiateInsiderContract(selectedInsiderPlayerId, 'starting11')}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold p-2.5 rounded-xl text-[11px] transition cursor-pointer min-h-[40px]"
                    >
                      Guaranteed Starter XI
                    </button>

                    <button
                      disabled={!selectedInsiderPlayerId}
                      onClick={() => handleNegotiateInsiderContract(selectedInsiderPlayerId, 'lowBuyout')}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold p-2.5 rounded-xl text-[11px] transition cursor-pointer min-h-[40px]"
                    >
                      €5M Low Release Clause
                    </button>

                    <button
                      disabled={!selectedInsiderPlayerId}
                      onClick={() => handleNegotiateInsiderContract(selectedInsiderPlayerId, 'bribeSplit')}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold p-2.5 rounded-xl text-[11px] transition cursor-pointer min-h-[40px]"
                    >
                      Siphon €1M Bribe Split
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Conflict Logs Activity Trail */}
            {(pState.conflictLogs || []).length > 0 && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Insider Dealing Log Trail</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto text-xs">
                  {pState.conflictLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-300">Wk {log.week}: {log.details}</span>
                      <span className="text-red-400 font-bold">+{log.scandalDelta} Scandal</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ethics Committee Audit Legal Clearance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Retain FIFA Defense Lawyers</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Hire premier sports attorneys to suppress media leaks and clear -30 conflict scandal points.
                </p>
                <button
                  onClick={() => handleClearScandal('lawyers')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer min-h-[44px]"
                >
                  Retain Legal Defense (€2,000,000)
                </button>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Settle Ethics Audit Under-The-Table</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Pay offshore settlement fees directly to ethics committee auditors to wipe -60 conflict scandal points.
                </p>
                <button
                  onClick={() => handleClearScandal('bribe')}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer min-h-[44px]"
                >
                  Offshore Ethics Settlement (€5,000,000)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
