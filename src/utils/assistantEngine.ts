import { 
  AssistantDelegateState, 
  AssistantRecruitmentCriteria, 
  DelegatedSigningRecord, 
  Player, 
  Club, 
  AgencyState, 
  Position 
} from '../types';
import { formatMoney, calculateValuationForRating } from './gameEngine';

export const DEFAULT_ASSISTANT_CRITERIA: AssistantRecruitmentCriteria = {
  targetCategory: 'ANY',
  minRating: 70,
  minPotential: 82,
  ageBracket: 'ANY',
  maxSignOnBonus: 300000,
  maxWeeklyWage: 60000,
  negotiationStance: 'Balanced',
  targetRegion: 'Europe'
};

export const DEFAULT_ASSISTANT_STATE: AssistantDelegateState = {
  assistantName: 'Marco "The Broker" Bellini',
  assistantTitle: 'Chief Director of Talent Acquisition',
  assistantRating: 84, // 50-99
  avatar: '👔',
  allocatedBudget: 1500000, // €1.5M starter delegated pool
  remainingBudget: 1500000,
  autoRecruitActive: true,
  criteria: DEFAULT_ASSISTANT_CRITERIA,
  history: [],
  totalSignedCount: 0,
  totalBudgetSpent: 0
};

export interface DelegatedAttemptOutcome {
  success: boolean;
  record: DelegatedSigningRecord;
  updatedAssistant: AssistantDelegateState;
  updatedAgency: AgencyState;
  updatedPlayers: Player[];
  toastMessage: string;
}

// Helper to filter or find an unrepresented candidate player
function findOrGenerateCandidate(
  criteria: AssistantRecruitmentCriteria,
  players: Player[],
  clubs: Club[]
): Player | null {
  // Try to find an existing unrepresented player first
  const existingCandidates = players.filter(p => {
    if (p.isMyClient) return false;
    
    // Category check
    if (criteria.targetCategory === 'ATTACKERS' && !['ST', 'LW', 'RW'].includes(p.position)) return false;
    if (criteria.targetCategory === 'MIDFIELDERS' && !['CAM', 'CM', 'CDM'].includes(p.position)) return false;
    if (criteria.targetCategory === 'DEFENDERS' && !['CB', 'LB', 'RB'].includes(p.position)) return false;
    if (criteria.targetCategory === 'GOALKEEPERS' && p.position !== 'GK') return false;
    if (criteria.targetCategory === 'WONDERKIDS' && (p.age > 20 || (p.potential || 80) < 85)) return false;

    // Rating & Potential
    if (p.rating < criteria.minRating) return false;
    if ((p.potential || p.rating) < criteria.minPotential) return false;

    // Age Bracket
    if (criteria.ageBracket === 'WONDERKID_U20' && p.age > 20) return false;
    if (criteria.ageBracket === 'PRIME_21_26' && (p.age < 21 || p.age > 26)) return false;
    if (criteria.ageBracket === 'EXPERIENCED_27_PLUS' && p.age < 27) return false;

    // Wage cap
    if (criteria.maxWeeklyWage && p.wage > criteria.maxWeeklyWage) return false;

    return true;
  });

  if (existingCandidates.length > 0) {
    // Pick random candidate
    return existingCandidates[Math.floor(Math.random() * existingCandidates.length)];
  }

  // If no exact match exists in the database, generate a fresh scouted prospect!
  const positions: Position[] = criteria.targetCategory === 'ATTACKERS' ? ['ST', 'LW', 'RW'] :
    criteria.targetCategory === 'MIDFIELDERS' ? ['CAM', 'CM', 'CDM'] :
    criteria.targetCategory === 'DEFENDERS' ? ['CB', 'LB', 'RB'] :
    criteria.targetCategory === 'GOALKEEPERS' ? ['GK'] :
    ['ST', 'CAM', 'CM', 'CB', 'LW', 'RW', 'RB', 'LB', 'GK'];

  const pos = positions[Math.floor(Math.random() * positions.length)];
  
  let targetAge = 22;
  if (criteria.ageBracket === 'WONDERKID_U20' || criteria.targetCategory === 'WONDERKIDS') {
    targetAge = 17 + Math.floor(Math.random() * 4); // 17-20
  } else if (criteria.ageBracket === 'PRIME_21_26') {
    targetAge = 21 + Math.floor(Math.random() * 6); // 21-26
  } else if (criteria.ageBracket === 'EXPERIENCED_27_PLUS') {
    targetAge = 27 + Math.floor(Math.random() * 7); // 27-33
  } else {
    targetAge = 18 + Math.floor(Math.random() * 12); // 18-29
  }

  const baseRating = Math.max(criteria.minRating, Math.min(88, Math.floor(criteria.minRating + Math.random() * 6)));
  const basePot = Math.max(criteria.minPotential, Math.min(94, Math.floor(baseRating + Math.random() * 8)));

  const firstNames = ['Luca', 'Gabriel', 'Mateo', 'Alexandre', 'Enzo', 'Kofi', 'Viktor', 'Santiago', 'Jonas', 'Dario', 'Noah', 'Kai', 'Tariq', 'Milos'];
  const lastNames = ['Silva', 'Moreno', 'Kovacs', 'Diallo', 'Santos', 'Brunner', 'Rossi', 'Lindqvist', 'Mensah', 'Petrovic', 'Vargas', 'Okonkwo'];
  const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;

  const nationalities = [
    { nat: 'France', flag: '🇫🇷' },
    { nat: 'Brazil', flag: '🇧🇷' },
    { nat: 'Germany', flag: '🇩🇪' },
    { nat: 'Argentina', flag: '🇦🇷' },
    { nat: 'Spain', flag: '🇪🇸' },
    { nat: 'Portugal', flag: '🇵🇹' },
    { nat: 'Nigeria', flag: '🇳🇬' },
    { nat: 'Netherlands', flag: '🇳🇱' },
    { nat: 'Croatia', flag: '🇭🇷' },
    { nat: 'Belgium', flag: '🇧🇪' }
  ];
  const natPick = nationalities[Math.floor(Math.random() * nationalities.length)];
  const randomClub = clubs[Math.floor(Math.random() * clubs.length)] || { id: 'c_free', name: 'Free Agent' };

  const val = calculateValuationForRating(baseRating, targetAge, basePot);
  const wage = Math.min(criteria.maxWeeklyWage || 80000, Math.max(10000, Math.round((val * 0.0018) / 1000) * 1000));

  const newPlayer: Player = {
    id: `p_scout_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name,
    age: targetAge,
    nationality: natPick.nat,
    flag: natPick.flag,
    position: pos,
    rating: baseRating,
    potential: basePot,
    value: val,
    wage,
    contractYears: 3,
    clubId: randomClub.id,
    clubName: randomClub.name,
    isMyClient: false,
    agentCommission: 10,
    morale: 85,
    loyalty: 80,
    form: 75,
    injury: { isInjured: false, weeks: 0 },
    traits: basePot >= 88 ? ['Wonderkid Prospect', 'High Potential'] : ['Tactical Awareness'],
    stats: { goals: Math.floor(Math.random() * 6), assists: Math.floor(Math.random() * 5), appearances: 16, avgRating: 7.2 },
    clauses: { releaseClause: Math.round(val * 1.6) },
    personalLife: { happiness: 85, socialMediaFollowers: 45000, scandalLevel: 0, endorsementEarnings: 0, luxuryItem: 'None' },
    biography: `Scouted by ${DEFAULT_ASSISTANT_STATE.assistantName}. Discovered in regional league competitions.`,
    careerHistory: [
      { season: '2025/26', clubName: randomClub.name, appearances: 16, goals: 3, assists: 4, transferFee: 'Signed' }
    ]
  };

  return newPlayer;
}

/**
 * Runs a single delegated scout & sign mission executed by the Chief Assistant
 */
export function executeDelegatedScoutAndSignMission(
  assistant: AssistantDelegateState,
  agency: AgencyState,
  players: Player[],
  clubs: Club[],
  week: number,
  season: number
): DelegatedAttemptOutcome {
  const assistantFee = 3500; // Operational travel & legal drafting fee

  // Budget validation
  if (assistant.remainingBudget < assistantFee || agency.balance < assistantFee) {
    const failedRecord: DelegatedSigningRecord = {
      id: `del_rec_${Date.now()}`,
      week,
      season,
      playerId: 'none',
      playerName: 'No Candidate (Treasury Depleted)',
      playerRating: 0,
      playerPotential: 0,
      playerPosition: 'ST',
      playerAge: 0,
      clubName: 'N/A',
      signOnBonusPaid: 0,
      commissionSecuredPercent: 0,
      assistantFee: 0,
      verdictLog: 'Assistant halted recruitment: Delegated treasury has insufficient remaining budget! Allocate more funds to resume.',
      status: 'failed_budget'
    };

    return {
      success: false,
      record: failedRecord,
      updatedAssistant: {
        ...assistant,
        history: [failedRecord, ...(assistant.history || [])].slice(0, 30)
      },
      updatedAgency: agency,
      updatedPlayers: players,
      toastMessage: '⚠️ Assistant Delegation paused: Assistant budget exhausted!'
    };
  }

  // Find candidate
  const candidate = findOrGenerateCandidate(assistant.criteria, players, clubs);
  if (!candidate) {
    const failedRecord: DelegatedSigningRecord = {
      id: `del_rec_${Date.now()}`,
      week,
      season,
      playerId: 'none',
      playerName: 'Scouted Targets Exhausted',
      playerRating: 0,
      playerPotential: 0,
      playerPosition: 'ST',
      playerAge: 0,
      clubName: 'N/A',
      signOnBonusPaid: 0,
      commissionSecuredPercent: 0,
      assistantFee,
      verdictLog: 'Assistant completed a regional sweep but found no players matching your strict criteria thresholds.',
      status: 'failed_reputation'
    };

    return {
      success: false,
      record: failedRecord,
      updatedAssistant: {
        ...assistant,
        remainingBudget: Math.max(0, assistant.remainingBudget - assistantFee),
        totalBudgetSpent: assistant.totalBudgetSpent + assistantFee,
        history: [failedRecord, ...(assistant.history || [])].slice(0, 30)
      },
      updatedAgency: {
        ...agency,
        balance: Math.max(0, agency.balance - assistantFee)
      },
      updatedPlayers: players,
      toastMessage: '🔍 Assistant conducted scouting sweep: No target matching criteria found this week.'
    };
  }

  // 1. Calculate Player Demand for Sign-on Bonus
  const isWonderkid = candidate.age <= 20 || candidate.traits?.includes('Wonderkid Prospect');
  const isSuperstar = candidate.rating >= 84;
  const baseBonusDemand = isSuperstar ? 600000 : isWonderkid ? 280000 : 120000;

  // Assistant stance & rating modifier
  const stanceDiscount = assistant.criteria.negotiationStance === 'Aggressive' ? 0.85 :
    assistant.criteria.negotiationStance === 'Conservative' ? 0.65 : 0.75;
  
  const skillDiscount = (assistant.assistantRating / 100) * 0.25; // up to 25% discount from great assistant
  const requiredBonus = Math.max(50000, Math.round(baseBonusDemand * (1 - skillDiscount) * stanceDiscount));

  // Check 1: Max Sign-on Bonus Cap
  if (requiredBonus > assistant.criteria.maxSignOnBonus) {
    const failedRecord: DelegatedSigningRecord = {
      id: `del_rec_${Date.now()}`,
      week,
      season,
      playerId: candidate.id,
      playerName: candidate.name,
      playerRating: candidate.rating,
      playerPotential: candidate.potential,
      playerPosition: candidate.position,
      playerAge: candidate.age,
      clubName: candidate.clubName,
      signOnBonusPaid: 0,
      commissionSecuredPercent: 0,
      assistantFee,
      verdictLog: `Negotiation Stalled: ${candidate.name} demanded an upfront sign-on bonus of ${formatMoney(requiredBonus)}, exceeding your set cap of ${formatMoney(assistant.criteria.maxSignOnBonus)}.`,
      status: 'failed_budget'
    };

    return {
      success: false,
      record: failedRecord,
      updatedAssistant: {
        ...assistant,
        remainingBudget: Math.max(0, assistant.remainingBudget - assistantFee),
        totalBudgetSpent: assistant.totalBudgetSpent + assistantFee,
        history: [failedRecord, ...(assistant.history || [])].slice(0, 30)
      },
      updatedAgency: {
        ...agency,
        balance: Math.max(0, agency.balance - assistantFee)
      },
      updatedPlayers: players.some(p => p.id === candidate.id) ? players : [candidate, ...players],
      toastMessage: `❌ Assistant failed to sign ${candidate.name}: Demanded bonus ${formatMoney(requiredBonus)} > Cap ${formatMoney(assistant.criteria.maxSignOnBonus)}.`
    };
  }

  // Check 2: Total cost check vs remaining budget & agency balance
  const totalCost = requiredBonus + assistantFee;
  if (assistant.remainingBudget < totalCost || agency.balance < totalCost) {
    const failedRecord: DelegatedSigningRecord = {
      id: `del_rec_${Date.now()}`,
      week,
      season,
      playerId: candidate.id,
      playerName: candidate.name,
      playerRating: candidate.rating,
      playerPotential: candidate.potential,
      playerPosition: candidate.position,
      playerAge: candidate.age,
      clubName: candidate.clubName,
      signOnBonusPaid: 0,
      commissionSecuredPercent: 0,
      assistantFee: 0,
      verdictLog: `Deal Aborted: Insufficient delegated funds in assistant pool (Need ${formatMoney(totalCost)}, Remaining ${formatMoney(assistant.remainingBudget)}).`,
      status: 'failed_budget'
    };

    return {
      success: false,
      record: failedRecord,
      updatedAssistant: {
        ...assistant,
        history: [failedRecord, ...(assistant.history || [])].slice(0, 30)
      },
      updatedAgency: agency,
      updatedPlayers: players,
      toastMessage: `⚠️ Assistant could not close ${candidate.name}: Insufficient delegated budget.`
    };
  }

  // Check 3: Agency Reputation & Player Stature Check
  const repDiff = (agency.reputation || 35) - candidate.rating;
  const assistantBonusChance = (assistant.assistantRating - 50) * 0.8;
  let successChance = 65 + repDiff * 0.7 + assistantBonusChance;

  if (assistant.criteria.negotiationStance === 'Aggressive') successChance += 15;
  if (assistant.criteria.negotiationStance === 'Conservative') successChance -= 10;

  const roll = Math.floor(Math.random() * 100) + 1;
  const isSuccess = roll <= Math.min(95, Math.max(20, successChance));

  if (!isSuccess) {
    const refusalReasons = [
      `"${candidate.name} stated that your agency's international presence is not yet prestigious enough for his career ambitions."`,
      `"${candidate.name}'s family advisors rejected the representation pitch at the 11th hour following contact from a rival agency."`,
      `"${candidate.name} decided to remain with his current legal representation after reviewing your agency portfolio."`
    ];
    const pickedReason = refusalReasons[Math.floor(Math.random() * refusalReasons.length)];

    const failedRecord: DelegatedSigningRecord = {
      id: `del_rec_${Date.now()}`,
      week,
      season,
      playerId: candidate.id,
      playerName: candidate.name,
      playerRating: candidate.rating,
      playerPotential: candidate.potential,
      playerPosition: candidate.position,
      playerAge: candidate.age,
      clubName: candidate.clubName,
      signOnBonusPaid: 0,
      commissionSecuredPercent: 0,
      assistantFee,
      verdictLog: `Pitch Rejected: ${pickedReason}`,
      status: 'rejected_by_player'
    };

    return {
      success: false,
      record: failedRecord,
      updatedAssistant: {
        ...assistant,
        remainingBudget: Math.max(0, assistant.remainingBudget - assistantFee),
        totalBudgetSpent: assistant.totalBudgetSpent + assistantFee,
        history: [failedRecord, ...(assistant.history || [])].slice(0, 30)
      },
      updatedAgency: {
        ...agency,
        balance: Math.max(0, agency.balance - assistantFee)
      },
      updatedPlayers: players.some(p => p.id === candidate.id) ? players : [candidate, ...players],
      toastMessage: `❌ Assistant pitch turned down by ${candidate.name} (${candidate.position}, ${candidate.rating} OVR).`
    };
  }

  // SUCCESS! Player is Signed!
  const securedCommission = isSuperstar ? 8 : isWonderkid ? 9 : 10;
  const signedPlayer: Player = {
    ...candidate,
    isMyClient: true,
    agencyName: agency.agencyName,
    agentCommission: securedCommission,
    morale: 95,
    loyalty: 85,
    personalLife: {
      ...candidate.personalLife,
      endorsementEarnings: (candidate.personalLife?.endorsementEarnings || 0) + 15000
    }
  };

  const successRecord: DelegatedSigningRecord = {
    id: `del_rec_${Date.now()}`,
    week,
    season,
    playerId: signedPlayer.id,
    playerName: signedPlayer.name,
    playerRating: signedPlayer.rating,
    playerPotential: signedPlayer.potential,
    playerPosition: signedPlayer.position,
    playerAge: signedPlayer.age,
    clubName: signedPlayer.clubName,
    signOnBonusPaid: requiredBonus,
    commissionSecuredPercent: securedCommission,
    assistantFee,
    verdictLog: `🤝 CONTRACT SEALED! ${assistant.assistantName} successfully closed representation terms with ${signedPlayer.name} (${signedPlayer.position}, OVR ${signedPlayer.rating}, POT ${signedPlayer.potential}) for ${formatMoney(requiredBonus)} sign-on bonus with ${securedCommission}% agent commission.`,
    status: 'signed'
  };

  const updatedPlayersList = players.some(p => p.id === signedPlayer.id)
    ? players.map(p => p.id === signedPlayer.id ? signedPlayer : p)
    : [signedPlayer, ...players];

  const newRemainingBudget = Math.max(0, assistant.remainingBudget - totalCost);
  const newTotalSpent = assistant.totalBudgetSpent + totalCost;

  const updatedAssistant: AssistantDelegateState = {
    ...assistant,
    remainingBudget: newRemainingBudget,
    totalBudgetSpent: newTotalSpent,
    totalSignedCount: (assistant.totalSignedCount || 0) + 1,
    history: [successRecord, ...(assistant.history || [])].slice(0, 30)
  };

  const updatedAgency: AgencyState = {
    ...agency,
    balance: Math.max(0, agency.balance - totalCost),
    reputation: Math.min(100, agency.reputation + (isSuperstar ? 4 : isWonderkid ? 3 : 2)),
    assistantDelegate: updatedAssistant
  };

  return {
    success: true,
    record: successRecord,
    updatedAssistant,
    updatedAgency,
    updatedPlayers: updatedPlayersList,
    toastMessage: `🎉 ASSISTANT SIGNING: ${assistant.assistantName} successfully signed ${signedPlayer.name} (${signedPlayer.position}, ${signedPlayer.rating} OVR) to your agency portfolio!`
  };
}

/**
 * Automatically processes weekly assistant recruitment during week advance
 */
export function processWeeklyAssistantDelegation(
  agency: AgencyState,
  players: Player[],
  clubs: Club[],
  week: number,
  season: number
): { updatedAgency: AgencyState; updatedPlayers: Player[]; toastMessage?: string } {
  const assistant = agency.assistantDelegate || DEFAULT_ASSISTANT_STATE;

  if (!assistant.autoRecruitActive) {
    return { updatedAgency: agency, updatedPlayers: players };
  }

  // 60% chance per matchweek of assistant executing a scouting & signing move
  if (Math.random() > 0.65) {
    return { updatedAgency: agency, updatedPlayers: players };
  }

  const outcome = executeDelegatedScoutAndSignMission(assistant, agency, players, clubs, week, season);

  return {
    updatedAgency: outcome.updatedAgency,
    updatedPlayers: outcome.updatedPlayers,
    toastMessage: outcome.toastMessage
  };
}
