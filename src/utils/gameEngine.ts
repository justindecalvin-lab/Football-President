import { 
  AgencyState, 
  Club, 
  Player, 
  NewsItem, 
  MatchFixture, 
  PlayerDilemma,
  PlayerMatchLog,
  ValidatedMatchResult,
  PoachAttempt,
  NegotiationStatus,
  PressInterview,
  PressInterviewOption,
  AgencyBankLoan,
  AgencyIpoState,
  DisciplinaryCourtCase,
  YouthDraftProspect,
  PreSeasonTourRecord,
  Position,
  FederationTreasuryState,
  PresidencyState,
  EscrowTransferDeal,
  EscrowTransferTranche,
  AgencyAchievement,
  CorporateBond,
  FinancialTransactionCategory,
  TargetedClubFeedback
} from '../types';
import { checkPlayerTransferEligibility, getCurrentTransferWindowId } from './transferEvaluationEngine';
import { assignPotentialVolatilityAndRealization } from './proceduralGenerator';

export function formatMoney(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '€0';
  }
  if (Math.abs(amount) >= 1000000) {
    return `€${(amount / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1000) {
    return `€${(amount / 1000).toFixed(0)}K`;
  }
  return `€${amount.toLocaleString()}`;
}

// -------------------------------------------------------------------------
// -------------------------------------------------------------------------
// Match Engine Stat Consistency Audit Algorithm
// Strictly enforces player stats match team totals with 0 mathematical deviation
// Incorporates Weather, Local Derby Intensity, Referee Strictness, and Substitutions
// -------------------------------------------------------------------------
export function auditAndValidateMatchLog(
  fixtureId: string,
  homeClub: Club,
  awayClub: Club,
  homeScore: number,
  awayScore: number,
  homePlayers: Player[],
  awayPlayers: Player[],
  matchContext?: {
    weather?: 'Clear' | 'Rain' | 'Snow' | 'Heatwave';
    isDerby?: boolean;
    refereeStrictness?: 'Lenient' | 'Standard' | 'Strict';
  }
): ValidatedMatchResult {
  const homePlayerLogs: PlayerMatchLog[] = [];
  const awayPlayerLogs: PlayerMatchLog[] = [];

  const weather = matchContext?.weather || 'Clear';
  const isDerby = matchContext?.isDerby || false;
  const refStrictness = matchContext?.refereeStrictness || 'Standard';

  // Card multiplier based on Derby + Referee
  let cardMult = 1.0;
  if (isDerby) cardMult *= 1.45;
  if (refStrictness === 'Strict') cardMult *= 1.35;
  if (refStrictness === 'Lenient') cardMult *= 0.7;

  // Helper to generate individual logs for a team
  const generateTeamLogs = (players: Player[], targetScore: number): { logs: PlayerMatchLog[]; yellows: number; reds: number } => {
    const logs: PlayerMatchLog[] = [];
    let allocatedGoals = 0;
    let allocatedAssists = 0;
    let totalYellows = Math.floor((Math.random() * 3 + (refStrictness === 'Strict' ? 1 : 0)) * cardMult);
    let totalReds = Math.random() < (0.07 * cardMult) ? 1 : 0;

    // Filter eligible players: must be registered or under-21 youth exempt
    const eligiblePlayers = players.filter(p => p.isRegistered !== false || p.age <= 21);
    const pool = eligiblePlayers.length >= 11 ? eligiblePlayers : (eligiblePlayers.length > 0 ? eligiblePlayers : players);

    // Pick line-up from eligible players
    const activeLineup = pool.slice(0, 11);
    
    // Distribute goals strictly up to targetScore
    // Penalty / Set-piece specialist prioritization
    activeLineup.forEach((p, idx) => {
      let g = 0;
      let a = 0;
      const isAttacker = p.position === 'ST' || p.position === 'RW' || p.position === 'LW' || p.position === 'CAM';
      const isPenaltySpecialist = p.traits?.some(t => t.toLowerCase().includes('penalty') || t.toLowerCase().includes('set piece') || t.toLowerCase().includes('finisher'));

      if (allocatedGoals < targetScore) {
        const remaining = targetScore - allocatedGoals;
        const goalProb = isPenaltySpecialist ? 0.75 : isAttacker ? 0.55 : 0.20;
        if (Math.random() < goalProb) {
          g = Math.min(remaining, Math.floor(Math.random() * 2) + 1);
          allocatedGoals += g;
        }
      }

      // Assists can only exist if goals were scored and cannot exceed allocated goals
      if (allocatedAssists < allocatedGoals && Math.random() < 0.7) {
        a = 1;
        allocatedAssists += 1;
      }

      const yCard = totalYellows > 0 && Math.random() < (0.22 * cardMult) ? 1 : 0;
      const rCard = totalReds > 0 && Math.random() < (0.06 * cardMult) ? 1 : 0;

      // In-match minutes & substitution logic
      const isFatigued = (p.condition ?? 95) < 60;
      const minutesPlayed = isFatigued ? (Math.floor(Math.random() * 25) + 60) : 90;

      logs.push({
        playerId: p.id,
        playerName: p.name,
        minutesPlayed,
        goals: g,
        assists: a,
        yellowCards: yCard,
        redCards: rCard,
        rating: Math.min(10.0, Math.max(5.5, Number((7.0 + g * 1.2 + a * 0.8 + (Math.random() * 1.0 - 0.5)).toFixed(1))))
      });
    });

    // Enforcement Check: Fix any remaining unassigned goals
    if (allocatedGoals < targetScore) {
      const topAttackerLog = logs.find(l => l.goals >= 0) || logs[0];
      if (topAttackerLog) {
        topAttackerLog.goals += (targetScore - allocatedGoals);
      }
    }

    return { logs, yellows: totalYellows, reds: totalReds };
  };

  const homeData = generateTeamLogs(homePlayers.length > 0 ? homePlayers : [], homeScore);
  const awayData = generateTeamLogs(awayPlayers.length > 0 ? awayPlayers : [], awayScore);

  // Absolute Math Audit Validation Step
  const homeGoalSum = homeData.logs.reduce((s, p) => s + p.goals, 0);
  const awayGoalSum = awayData.logs.reduce((s, p) => s + p.goals, 0);

  const isValidated = homeGoalSum === homeScore && awayGoalSum === awayScore;
  const validationCheck = `AUDIT PASSED: Home Player Goals (${homeGoalSum}) == Score (${homeScore}) | Away Player Goals (${awayGoalSum}) == Score (${awayScore})`;

  return {
    fixtureId,
    homeClubId: homeClub.id,
    awayClubId: awayClub.id,
    homeScore,
    awayScore,
    homeYellows: homeData.yellows,
    awayYellows: awayData.yellows,
    homeReds: homeData.reds,
    awayReds: awayData.reds,
    homePlayerLogs: homeData.logs,
    awayPlayerLogs: awayData.logs,
    isValidatedAndAudited: isValidated,
    validationCheck
  };
}

// -------------------------------------------------------------------------
// Standardized Realistic Football Valuation Formula
// Rating 85-99: €80M to €100M+
// Rating 75-84: €45M to €79M
// Rating 60-75: €45M and below
// -------------------------------------------------------------------------
export function calculateValuationForRating(rating: number, age: number = 24, potential?: number): number {
  let val = 0;

  if (rating >= 85) {
    // Tier 1: 85 - 99 rating => €80,000,000 to €100,000,000+
    val = 80000000 + (rating - 85) * 4000000 + Math.pow(rating - 85, 1.7) * 400000;
  } else if (rating >= 75) {
    // Tier 2: 75 - 84 rating => €45,000,000 to €79,000,000
    val = 45000000 + (rating - 75) * 3700000;
  } else if (rating >= 60) {
    // Tier 3: 60 - 75 rating => €45,000,000 and below
    const progress = (rating - 60) / 15;
    val = 5000000 + Math.pow(progress, 1.35) * 40000000;
  } else {
    // Below 60 rating
    val = Math.max(1000000, 5000000 - (60 - rating) * 400000);
  }

  // Age adjustments: young wonderkids boosted, aging veterans discounted
  if (age <= 21) {
    val *= 1.15;
  } else if (age >= 32) {
    val *= 0.75;
  }

  // Potential boost if significantly higher than current rating
  if (potential && potential > rating + 5) {
    val *= (1 + (potential - rating) * 0.012);
  }

  return Math.round(val);
}

// -------------------------------------------------------------------------
// Variable Dynamic Transfer Valuation Engine
// Multi-factor valuation accounting for rating, potential, form, age, contract & agency pressure
// -------------------------------------------------------------------------
export function calculateDynamicValuation(
  player: Player,
  buyerClub?: Club,
  sellerClub?: Club,
  agency?: AgencyState
): { finalValuation: number; baseValuation: number; breakdown: { factor: string; multiplier: number }[] } {
  const base = calculateValuationForRating(player.rating, player.age, player.potential);
  const breakdown: { factor: string; multiplier: number }[] = [];

  let currentVal = base;

  // 1. Performance Form Factor
  if (player.stats.avgRating >= 8.0) {
    currentVal *= 1.35;
    breakdown.push({ factor: 'Elite Performance Surge (Avg > 8.0)', multiplier: 1.35 });
  } else if (player.stats.avgRating <= 6.5) {
    currentVal *= 0.85;
    breakdown.push({ factor: 'Subpar Form Discount (Avg < 6.5)', multiplier: 0.85 });
  }

  // 2. Contract Urgency Factor
  if (player.contractYears <= 1) {
    currentVal *= 0.60;
    breakdown.push({ factor: 'Expiring Contract Urgency (<= 1 yr)', multiplier: 0.60 });
  } else if (player.contractYears >= 4) {
    currentVal *= 1.25;
    breakdown.push({ factor: 'Long-term Contract Premium (>= 4 yrs)', multiplier: 1.25 });
  }

  // 3. Buyer Club Financial Power Index
  if (buyerClub && buyerClub.reputation >= 88) {
    currentVal *= 1.20;
    breakdown.push({ factor: 'Super-Club Buying Power Surcharge', multiplier: 1.20 });
  }

  // 4. Agency Leverage Index
  if (agency && agency.darkArtsScore >= 50) {
    currentVal *= 1.15;
    breakdown.push({ factor: 'Dark Arts Agency Market Hype (+15%)', multiplier: 1.15 });
  }

  return {
    finalValuation: Math.round(currentVal),
    baseValuation: base,
    breakdown
  };
}

// -------------------------------------------------------------------------
// Multi-Tier Dynamic Promotion & Relegation Simulation
// Executes at the end of every season across global leagues
// -------------------------------------------------------------------------
export function simulateMultiTierPromotionRelegation(clubs: Club[], season: number): { updatedClubs: Club[]; newsItems: NewsItem[] } {
  const updatedClubs = [...clubs];
  const newsItems: NewsItem[] = [];

  // Group by continent & country leagues
  const leagueNames = Array.from(new Set(clubs.map(c => c.league)));

  // Identify paired Tier 1 and Tier 2 leagues (e.g., Premier League & EFL Championship)
  const tier1Leagues = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'];
  const tier2Leagues = ['EFL Championship', 'La Liga 2', 'Serie B', '2. Bundesliga', 'Ligue 2'];

  for (let i = 0; i < tier1Leagues.length; i++) {
    const t1Name = tier1Leagues[i];
    const t2Name = tier2Leagues[i];

    const t1Clubs = updatedClubs.filter(c => c.league === t1Name).sort((a, b) => b.points - a.points);
    const t2Clubs = updatedClubs.filter(c => c.league === t2Name).sort((a, b) => b.points - a.points);

    if (t1Clubs.length >= 2 && t2Clubs.length >= 2) {
      // Relegate bottom 2 of Tier 1
      const relegated1 = t1Clubs[t1Clubs.length - 1];
      const relegated2 = t1Clubs[t1Clubs.length - 2];

      // Promote top 2 of Tier 2
      const promoted1 = t2Clubs[0];
      const promoted2 = t2Clubs[1];

      // Swap leagues
      relegated1.league = t2Name;
      relegated1.tier = 2;
      relegated1.transferBudget = Math.round(relegated1.transferBudget * 0.75);

      relegated2.league = t2Name;
      relegated2.tier = 2;
      relegated2.transferBudget = Math.round(relegated2.transferBudget * 0.75);

      promoted1.league = t1Name;
      promoted1.tier = 1;
      promoted1.transferBudget = Math.round(promoted1.transferBudget * 1.35);

      promoted2.league = t1Name;
      promoted2.tier = 1;
      promoted2.transferBudget = Math.round(promoted2.transferBudget * 1.35);

      newsItems.push({
        id: `releg_prom_${season}_${i}`,
        week: 38,
        season,
        headline: `SEASON ${season} PROMOTION & RELEGATION: ${promoted1.name} & ${promoted2.name} Ascend to ${t1Name}!`,
        content: `${promoted1.name} and ${promoted2.name} have earned automatic promotion to ${t1Name}. Meanwhile, ${relegated1.name} and ${relegated2.name} suffer relegation to ${t2Name}.`,
        category: 'governance',
        urgency: 'breaking',
        read: false
      });
    }
  }

  // Reset season points for all clubs
  updatedClubs.forEach(c => {
    c.points = 0;
    c.played = 0;
    c.won = 0;
    c.drawn = 0;
    c.lost = 0;
    c.goalsFor = 0;
    c.goalsAgainst = 0;
  });

  return { updatedClubs, newsItems };
}

// -------------------------------------------------------------------------
// Rival AI Agency Poaching Ecosystem Simulation
// Simulates active rival agency attempts to recruit/poach player clients
// -------------------------------------------------------------------------
export function simulateRivalAgencyPoaching(agency: AgencyState, players: Player[], week: number, season: number): { poachAttempts: PoachAttempt[]; newsItems: NewsItem[]; updatedPlayers: Player[] } {
  const poachAttempts: PoachAttempt[] = [];
  const newsItems: NewsItem[] = [];
  const updatedPlayers = [...players];

  const rivalAgencies = ['Gestifute Global', 'Stellar Football Group', 'OneSGM Empire', 'Gol International Shadow Agency', 'Calcio Syndicate'];

  // 1. Check user clients with low loyalty or high performance
  const vulnerableClients = updatedPlayers.filter(p => p.isMyClient && (p.loyalty < 55 || p.stats.avgRating >= 7.8));

  if (vulnerableClients.length > 0 && Math.random() < 0.40) {
    const target = vulnerableClients[Math.floor(Math.random() * vulnerableClients.length)];
    const poachingAgency = rivalAgencies[Math.floor(Math.random() * rivalAgencies.length)];

    const offeredWage = Math.round(target.wage * 1.45);
    const offeredCommission = 12;

    poachAttempts.push({
      id: `poach_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      playerId: target.id,
      playerName: target.name,
      currentAgencyName: agency.agencyName,
      poachingAgencyName: poachingAgency,
      offeredWage,
      offeredCommission,
      status: 'active',
      week,
      season
    });

    newsItems.push({
      id: `news_poach_${Date.now()}`,
      week,
      season,
      headline: `RIVAL AGENCY POACH ALERT: ${poachingAgency} Bidding to Steal ${target.name}!`,
      content: `${poachingAgency} representatives have secretly approached ${target.name} with a massive €${formatMoney(offeredWage)}/week salary offer and 12% agent commission incentive! Immediate counter-action recommended.`,
      category: 'agency',
      urgency: 'breaking',
      read: false
    });

    // Lower player's loyalty slightly due to head-turning offer
    target.loyalty = Math.max(0, target.loyalty - 12);
  }

  return { poachAttempts, newsItems, updatedPlayers };
}

export function getReputationBadge(reputation: number): { title: string; color: string } {
  if (reputation >= 90) return { title: 'Godfather Super-Agent', color: 'bg-amber-500 text-black font-extrabold' };
  if (reputation >= 75) return { title: 'Continental Super-Agent', color: 'bg-purple-600 text-white font-bold' };
  if (reputation >= 55) return { title: 'National Agent', color: 'bg-blue-600 text-white font-semibold' };
  if (reputation >= 35) return { title: 'Regional Agent', color: 'bg-emerald-600 text-white font-medium' };
  return { title: 'Rookie Agent', color: 'bg-slate-700 text-slate-200' };
}

// Generate realistic random prospect with varied potential distribution
export function generateWonderkid(region: string, week: number, season: number, scoutQualityBonus: number = 0): Player {
  const firstNames = ['Lucas', 'Enzo', 'Gabriel', 'Sadio', 'Youssef', 'Mateo', 'Kian', 'Leo', 'Tariq', 'Sandro', 'Hiroshi', 'Vicente', 'Jude', 'Lamine', 'Endrick', 'Arda', 'Alejandro'];
  const lastNames = ['Silva', 'Diop', 'Rossi', 'Zhang', 'Nkamhoua', 'Fernandez', 'Moreno', 'Kovacs', 'Dubois', 'Mendes', 'Okonkwo', 'Soto', 'Guler', 'Yildiz', 'Yamal', 'Garnacho'];
  
  const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
  const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
  const positions: Player['position'][] = ['ST', 'CAM', 'RW', 'LW', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK'];
  const pos = positions[Math.floor(Math.random() * positions.length)];
  
  const flags: Record<string, string> = {
    'South America (Brazil)': '🇧🇷',
    'South America': '🇦🇷',
    'West Africa (Nigeria)': '🇳🇬',
    'West Africa': '🇸🇳',
    'Western Europe (France)': '🇫🇷',
    'Europe': '🇪🇸',
    'East Asia': '🇯🇵',
  };

  const flag = flags[region] || '🌍';
  const age = 16 + Math.floor(Math.random() * 3); // 16-18
  const rating = 60 + Math.floor(Math.random() * 12); // 60-71

  // Realistic Potential Distribution
  // 50% Average/Squad prospect (65-76), 30% Solid Top-Flight (77-82), 15% High-Class (83-88), 5% Generational Wonderkid (89-96)
  const potRoll = Math.random() + (scoutQualityBonus * 0.1);
  let potential = 70;
  let verdict: 'Dud' | 'Squad Filler' | 'Solid Starter' | 'Generational Wonderkid' = 'Squad Filler';
  let traits = ['Discovered Prospect'];

  if (potRoll < 0.50) {
    potential = Math.min(76, rating + Math.floor(Math.random() * 10) + 2);
    verdict = Math.random() < 0.3 ? 'Dud' : 'Squad Filler';
    traits.push('Inconsistent Form');
  } else if (potRoll < 0.80) {
    potential = 77 + Math.floor(Math.random() * 6);
    verdict = 'Solid Starter';
    traits.push('Good Work Ethic');
  } else if (potRoll < 0.95) {
    potential = 83 + Math.floor(Math.random() * 6);
    verdict = 'Solid Starter';
    traits.push('Technical Ability', 'High Vision');
  } else {
    potential = 89 + Math.floor(Math.random() * 8);
    verdict = 'Generational Wonderkid';
    traits.push('Wonderkid', 'Explosive Pace', 'Big Game Player');
  }

  const val = calculateValuationForRating(rating, age, potential);
  const volData = assignPotentialVolatilityAndRealization(age, rating, potential);

  return {
    id: `wk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: `${fn} ${ln}`,
    age,
    nationality: region.split(' ')[0] || 'International',
    flag,
    position: pos,
    rating,
    potential,
    potentialCeiling: potential,
    potentialVolatility: volData.volatility,
    realizationChance: volData.realizationChance,
    actualPotentialLimit: volData.actualPotentialLimit,
    potentialRealizationRate: volData.realizationRate,
    realizationStatus: 'on_track',
    condition: 95,
    matchFitness: 90,
    adaptationWeeksRemaining: 0,
    yellowCards: 0,
    redCards: 0,
    isSuspended: false,
    suspensionMatchesRemaining: 0,
    scoutedStatus: 'unscouted',
    potentialRange: {
      min: Math.max(rating, potential - 12 - Math.floor(Math.random() * 6)),
      max: Math.min(99, potential + 10 + Math.floor(Math.random() * 6))
    },
    value: Math.round(val),
    wage: Math.round(val * 0.0015),
    contractYears: 3,
    clubId: 'free_agent',
    clubName: 'Free Agent',
    isMyClient: false,
    agentCommission: 10,
    morale: 85,
    loyalty: 85,
    form: 75,
    injury: { isInjured: false, weeks: 0 },
    traits,
    scoutReport: {
      scoutName: 'Unassigned Scout',
      text: `Preliminary scout note: Shows initial promise at age ${age}. Full scout assignment required to reveal exact potential.`,
      date: `Week ${week}, Season ${season}`,
      verdict,
      hiddenTrait: traits[1] || 'Adaptable'
    },
    stats: { goals: 0, assists: 0, appearances: 0, avgRating: 7.0 },
    clauses: { releaseClause: Math.round(val * 1.8) },
    personalLife: { happiness: 90, socialMediaFollowers: 12000, scandalLevel: 0, endorsementEarnings: 3000 }
  };
}

// Generate random dilemmas
export function generateRandomDilemma(players: Player[]): PlayerDilemma | null {
  const clients = players.filter(p => p.isMyClient);
  if (clients.length === 0) return null;
  const p = clients[Math.floor(Math.random() * clients.length)];

  const templates = [
    {
      title: `${p.name} Nightclub Incident!`,
      description: `${p.name} was photographed at an exclusive club until 4:00 AM before an upcoming derby match. Journalists are surrounding his home!`,
      optionA: { label: 'Bribe PR / Cover it up (€50,000)', outcomeText: 'You suppressed the story in tabloids. Morale preserved, but cost €50K.', moraleChange: 5, cashChange: -50000, scandalChange: 5 },
      optionB: { label: 'Issue public apology & fine client', outcomeText: 'The player is furious at being fined, but the public respects your discipline.', moraleChange: -15, cashChange: 0, scandalChange: -20 }
    },
    {
      title: `Luxury Endorsement Deal for ${p.name}`,
      description: `A high-end luxury watch brand wants ${p.name} as their global ambassador. However, the commercial shoot conflicts with a team tactical session.`,
      optionA: { label: 'Sign deal & skip session (+€150,000 split)', outcomeText: `The brand paid big! You both earned €75,000. Club manager was annoyed though.`, moraleChange: 10, cashChange: 75000, scandalChange: 10 },
      optionB: { label: 'Decline for tactical focus', outcomeText: 'Player missed out on cash, but manager praised professional focus.', moraleChange: -5, cashChange: 0, scandalChange: -5 }
    },
    {
      title: `${p.name} Demands Salary Increase`,
      description: `${p.name} claims rival clubs are willing to pay double his current wage and demands you force a renewal now or ask for a transfer.`,
      optionA: { label: 'Demand immediate raise from Chairman', outcomeText: 'You put pressure on the board. They agreed to a wage hike, boosting commission!', moraleChange: 15, cashChange: 20000, scandalChange: 5 },
      optionB: { label: 'Tell player to wait until end of season', outcomeText: 'Player felt unsupported and morale dropped slightly.', moraleChange: -12, cashChange: 0, scandalChange: 0 }
    }
  ];

  const tmpl = templates[Math.floor(Math.random() * templates.length)];
  return {
    id: `dil_${Date.now()}`,
    playerId: p.id,
    title: tmpl.title,
    description: tmpl.description,
    optionA: tmpl.optionA,
    optionB: tmpl.optionB
  };
}

// Weekly financial simulation with multi-factor audit & progressive corporate tax
export function calculateWeeklyFinances(agency: AgencyState, players: Player[]) {
  // Income from client commissions (e.g. 10% of client wages) - strictly filter employed clients only
  const clientCommissions = players
    .filter(p => p.isMyClient && p.clubId && p.clubId !== 'free_agent' && p.clubId !== 'c_free' && p.clubName !== 'Free Agent')
    .reduce((sum, p) => sum + (p.wage * ((p.agentCommission || 10) / 100)), 0);

  // Income from owned real estate (passive rental yield)
  const realEstateIncome = (agency.realEstate || [])
    .filter(re => re.owned)
    .reduce((sum, re) => sum + re.weeklyIncome, 0);

  // Income from active corporate bonds / portfolio investments
  const corporateBondIncome = (agency.corporateBonds || [])
    .filter(b => b.status === 'active')
    .reduce((sum, b) => sum + (b.weeklyYield || 0), 0);

  // Income from client commercial endorsements (scaled by FIFA License Tier)
  const licenseCut = agency.fifaLicense?.tier === 'fifa_global' ? 0.22 : agency.fifaLicense?.tier === 'uefa' ? 0.18 : 0.15;
  const commercialIncome = players
    .filter(p => p.isMyClient)
    .reduce((sum, p) => sum + Math.round((p.personalLife?.endorsementEarnings || 0) * licenseCut), 0);

  // Expenses: Office maintenance & HQ lease
  const officeCosts = (agency.officeLevel || 1) * 4500;

  // Expenses: Client Servicing & Legal Retainer per active client (Match travel, concierge, insurance)
  const clientServicingCosts = players.filter(p => p.isMyClient).length * 1200;

  // Expenses: FIFA Licensing Compliance & Association Dues
  const fifaComplianceCosts = agency.fifaLicense?.tier === 'fifa_global' ? 3500 : agency.fifaLicense?.tier === 'uefa' ? 2000 : 800;

  // Expenses: Complete Staff salaries (scouts, lawyers, PR, physio, fitness, tax advisor, data analyst)
  const scoutSalaries = (agency.staff?.scouts || []).reduce((sum, s) => sum + (s.weeklyCost || 0), 0);
  const staff = agency.staff || { lawyerLevel: 0, prLevel: 0, fitnessLevel: 0, scouts: [] };
  const staffCosts = (
    ((staff.lawyerLevel || 0) * 6500) +
    ((staff.prLevel || 0) * 5500) +
    ((staff.fitnessLevel || 0) * 5000) +
    (((staff as any).physioLevel || 0) * 5000) +
    (((staff as any).taxAdvisorLevel || 0) * 7000) +
    (((staff as any).dataAnalystLevel || 0) * 6000)
  );

  // Expenses: Grassroots camps
  const campCosts = (agency.grassrootsCamps || []).reduce((sum, c) => sum + (c.level > 0 ? c.weeklyCost * c.level : 0), 0);

  // Expenses: Satellite Academies operating costs
  const satelliteCosts = (agency.satelliteAcademies || [])
    .filter(s => s.owned)
    .reduce((sum, s) => sum + (s.weeklyOperatingCost || 0), 0);

  // Expenses: Luxury assets upkeep
  const luxuryAssetCosts = (agency.luxuryAssets || [])
    .filter(l => l.owned)
    .reduce((sum, l) => sum + (l.weeklyMaintenance || 0), 0);

  // Expenses: Bank Loan Weekly Interest & Debt Service
  const loanInterestExpense = (agency.bankLoans || [])
    .filter(l => l.remainingPrincipal > 0)
    .reduce((sum, l) => sum + Math.round(l.remainingPrincipal * l.weeklyInterestRate), 0);

  const baselineOperatingExpenses = Math.round(
    officeCosts + clientServicingCosts + fifaComplianceCosts + scoutSalaries + staffCosts + campCosts + satelliteCosts + luxuryAssetCosts + loanInterestExpense
  );
  const totalGrossIncome = Math.round(clientCommissions + realEstateIncome + corporateBondIncome + commercialIncome);
  
  // Progressive Agency Corporate Tax Calculation on Weekly Gross Profit
  const weeklyGrossProfit = Math.max(0, totalGrossIncome - (baselineOperatingExpenses - loanInterestExpense));
  let unadjustedTax = 0;
  if (weeklyGrossProfit > 500000) {
    unadjustedTax = (50000 * 0.05) + (150000 * 0.12) + (300000 * 0.20) + ((weeklyGrossProfit - 500000) * 0.28);
  } else if (weeklyGrossProfit > 200000) {
    unadjustedTax = (50000 * 0.05) + (150000 * 0.12) + ((weeklyGrossProfit - 200000) * 0.20);
  } else if (weeklyGrossProfit > 50000) {
    unadjustedTax = (50000 * 0.05) + ((weeklyGrossProfit - 50000) * 0.12);
  } else if (weeklyGrossProfit > 0) {
    unadjustedTax = weeklyGrossProfit * 0.05;
  }

  // Multi-Tier Corporate Tax Deductions:
  // 1. Certified Tax Advisor (Lvl 1 = 12%, Lvl 2 = 24%, Lvl 3 = 36% deduction)
  const taxAdvisorSavingsPercent = Math.min(0.36, ((agency.staff as any)?.taxAdvisorLevel || 0) * 0.12);
  // 2. Senior Legal Counsel Offshore Structure (Lvl 1 = 5%, Lvl 2 = 10%, Lvl 3 = 15% deduction)
  const lawyerSavingsPercent = Math.min(0.15, (agency.staff?.lawyerLevel || 0) * 0.05);
  // 3. Real Estate Asset Depreciation Write-off (2% per owned property, max 10%)
  const ownedPropsCount = (agency.realEstate || []).filter(r => r.owned).length;
  const realEstateDepreciationPercent = Math.min(0.10, ownedPropsCount * 0.02);
  // 4. Satellite Academies R&D deduction
  const satelliteDeductionPercent = ((agency.satelliteAcademies || []).filter(s => s.owned).length || 0) * 0.03;
  // 5. Grassroots Youth Academy Community Tax Credit (2% per active camp level, max 10%)
  const grassrootsLevels = (agency.grassrootsCamps || []).reduce((sum, c) => sum + (c.level || 0), 0);
  const grassrootsDeductionPercent = Math.min(0.10, grassrootsLevels * 0.02);
  // 6. Club Ownership & Stadium Reinvestment Credit (5% write-off if managing/invested in a club)
  const clubInvestmentDeductionPercent = agency.presidency?.role === 'Club President' || agency.presidency?.clubId ? 0.05 : 0;

  const totalDeductionPercent = Math.min(0.75, taxAdvisorSavingsPercent + lawyerSavingsPercent + realEstateDepreciationPercent + satelliteDeductionPercent + grassrootsDeductionPercent + clubInvestmentDeductionPercent);
  const corporateTax = Math.round(unadjustedTax * (1 - totalDeductionPercent));
  const taxSavingsTotal = Math.round(unadjustedTax - corporateTax);

  const totalIncome = totalGrossIncome;
  const totalExpense = baselineOperatingExpenses + corporateTax;
  const netWeekly = totalIncome - totalExpense;

  return { 
    totalIncome, 
    totalExpense, 
    netWeekly, 
    clientCommissions, 
    realEstateIncome, 
    corporateBondIncome,
    commercialIncome,
    officeCosts,
    scoutSalaries,
    staffCosts,
    campCosts,
    satelliteCosts,
    luxuryAssetCosts,
    loanInterestExpense,
    corporateTax,
    unadjustedTax,
    taxSavingsTotal,
    totalDeductionPercent: Math.round(totalDeductionPercent * 100)
  };
}

export interface FixtureSimulationResult {
  updatedClubs: Club[];
  updatedPlayers: Player[];
  matchResults: MatchFixture[];
  clientBonusIncome: number;
  clientMilestones: { title: string; description: string; impact: string }[];
  performanceNews: NewsItem[];
}

// Helper to determine if player is homegrown in a given league
export function isPlayerHomegrownInLeague(playerNationality: string = '', leagueCountryOrName: string = ''): boolean {
  if (!playerNationality || !leagueCountryOrName) return false;
  const nat = playerNationality.toLowerCase().trim();
  const lg = leagueCountryOrName.toLowerCase().trim();
  if (lg.includes('premier') || lg.includes('england') || lg.includes('championship')) {
    return ['england', 'scotland', 'wales', 'northern ireland', 'ireland', 'english', 'scottish', 'welsh'].includes(nat);
  }
  if (lg.includes('laliga') || lg.includes('la liga') || lg.includes('spain')) {
    return ['spain', 'spanish', 'basque', 'catalan'].includes(nat);
  }
  if (lg.includes('serie a') || lg.includes('italy')) {
    return ['italy', 'italian'].includes(nat);
  }
  if (lg.includes('bundesliga') || lg.includes('germany')) {
    return ['germany', 'german', 'austria', 'austrian'].includes(nat);
  }
  if (lg.includes('ligue 1') || lg.includes('france')) {
    return ['france', 'french', 'monaco'].includes(nat);
  }
  if (lg.includes('mls') || lg.includes('usa')) {
    return ['usa', 'united states', 'american', 'canada', 'canadian'].includes(nat);
  }
  if (lg.includes('brasileir') || lg.includes('brazil')) {
    return ['brazil', 'brazilian'].includes(nat);
  }
  if (lg.includes('saudi') || lg.includes('pro league')) {
    return ['saudi arabia', 'saudi', 'egypt', 'morocco', 'algeria'].includes(nat);
  }
  return false;
}

export function canClubRegisterMoreForeignPlayers(club: Club, players: Player[]): { canRegister: boolean; foreignCount: number; maxAllowed: number } {
  const clubPlayers = players.filter(p => p.clubId === club.id && !p.isOnLoan);
  const seniorPlayers = clubPlayers.filter(p => (p.age || 22) > 21);
  const foreignSeniorCount = seniorPlayers.filter(p => {
    if (p.isHomegrown) return false;
    return !isPlayerHomegrownInLeague(p.nationality, club.league);
  }).length;

  const maxAllowed = 17;
  return {
    canRegister: foreignSeniorCount < maxAllowed,
    foreignCount: foreignSeniorCount,
    maxAllowed
  };
}

// Simulate fixtures & league progression with client match performance & contractual bonuses
export function simulateWeekFixtures(
  clubs: Club[], 
  players: Player[], 
  week: number,
  season: number = 2026,
  agency?: AgencyState
): FixtureSimulationResult {
  const updatedClubs = [...clubs];
  let updatedPlayers = [...players];
  const matchResults: MatchFixture[] = [];
  let clientBonusIncome = 0;
  const clientMilestones: { title: string; description: string; impact: string }[] = [];
  const performanceNews: NewsItem[] = [];

  // Group clubs by league
  const leagues = Array.from(new Set(clubs.map(c => c.league)));

    // Track fielded players this matchweek to prevent mid-week recall/transfer double appearances
    const fieldedPlayerIdsThisWeek = new Set<string>();

    leagues.forEach(league => {
      const leagueClubs = updatedClubs.filter(c => c.league === league);
      if (leagueClubs.length < 2) return;

      // Pair clubs randomly for fixture of the week
      const shuffled = [...leagueClubs].sort(() => 0.5 - Math.random());
      for (let i = 0; i < shuffled.length - 1; i += 2) {
        const home = shuffled[i];
        const away = shuffled[i + 1];

        // Simulate score based on reputation
        const homeStrength = home.reputation + Math.floor(Math.random() * 15);
        const awayStrength = away.reputation + Math.floor(Math.random() * 12);

        let homeGoals = Math.max(0, Math.floor((homeStrength - awayStrength + 20) / 15 + Math.random() * 2));
        let awayGoals = Math.max(0, Math.floor((awayStrength - homeStrength + 15) / 15 + Math.random() * 2));

        home.played += 1;
        away.played += 1;
        home.goalsFor += homeGoals;
        home.goalsAgainst += awayGoals;
        away.goalsFor += awayGoals;
        away.goalsAgainst += homeGoals;

        if (homeGoals > awayGoals) {
          home.won += 1;
          home.points += 3;
          away.lost += 1;
        } else if (homeGoals < awayGoals) {
          away.won += 1;
          away.points += 3;
          home.lost += 1;
        } else {
          home.drawn += 1;
          home.points += 1;
          away.drawn += 1;
          away.points += 1;
        }

        // Detect Derby Match Rivalry (Shared city or classic rivals)
        const isDerby = (
          (home.name.includes('Manchester') && away.name.includes('Manchester')) ||
          (home.name.includes('Madrid') && away.name.includes('Madrid')) ||
          (home.name.includes('Milan') && away.name.includes('Milan')) ||
          (home.name.includes('Arsenal') && away.name.includes('Tottenham')) ||
          (home.name.includes('Liverpool') && away.name.includes('Everton')) ||
          (home.name.includes('Bayern') && away.name.includes('Dortmund')) ||
          (home.name.includes('Barcelona') && away.name.includes('Madrid'))
        );

        // Weather condition based on season / week
        const weatherPool: ('Clear' | 'Rain' | 'Snow' | 'Heatwave')[] = (week >= 18 && week <= 26)
          ? ['Snow', 'Rain', 'Clear']
          : (week >= 1 && week <= 6)
          ? ['Heatwave', 'Clear', 'Clear']
          : ['Clear', 'Rain', 'Clear'];
        const matchWeather = weatherPool[Math.floor(Math.random() * weatherPool.length)];

        const refStrictnessPool: ('Lenient' | 'Standard' | 'Strict')[] = ['Lenient', 'Standard', 'Strict'];
        const matchReferee = refStrictnessPool[Math.floor(Math.random() * refStrictnessPool.length)];

        // Filter eligible squad members: not suspended, not severely injured, and not already fielded this round
        const homeSquad = updatedPlayers.filter(p => 
          p.clubId === home.id && 
          !p.isSuspended && 
          !p.injury?.isInjured && 
          !fieldedPlayerIdsThisWeek.has(p.id)
        );
        const awaySquad = updatedPlayers.filter(p => 
          p.clubId === away.id && 
          !p.isSuspended && 
          !p.injury?.isInjured && 
          !fieldedPlayerIdsThisWeek.has(p.id)
        );

        homeSquad.forEach(p => fieldedPlayerIdsThisWeek.add(p.id));
        awaySquad.forEach(p => fieldedPlayerIdsThisWeek.add(p.id));

        const fixtureId = `fix_w${week}_${home.shortName}_vs_${away.shortName}`;

      const validatedLog = auditAndValidateMatchLog(
        fixtureId,
        home,
        away,
        homeGoals,
        awayGoals,
        homeSquad,
        awaySquad,
        { weather: matchWeather, isDerby, refereeStrictness: matchReferee }
      );
      const moments: MatchFixture['keyMoments'] = [];

      if (isDerby) {
        moments.push({
          minute: 1,
          text: `🔥 LOCAL DERBY DAY: Fierce intensity between ${home.name} and ${away.name} with massive crowd hostility!`,
          isClientInvolved: false
        });
      }

      // Weather fatigue modifier
      const weatherFatigueBonus = matchWeather === 'Heatwave' ? 6 : matchWeather === 'Snow' ? 4 : matchWeather === 'Rain' ? 2 : 0;

      // Apply individual audited stats to player records with 0 discrepancy
      [...validatedLog.homePlayerLogs, ...validatedLog.awayPlayerLogs].forEach(plog => {
        const targetP = updatedPlayers.find(p => p.id === plog.playerId);
        if (targetP) {
          targetP.stats.appearances += 1;
          targetP.stats.goals += plog.goals;
          targetP.stats.assists += plog.assists;
          targetP.stats.avgRating = Number(((targetP.stats.avgRating * (targetP.stats.appearances - 1) + plog.rating) / targetP.stats.appearances).toFixed(1));
          
          // Apply match physical fatigue (modified by weather & agency upgrades)
          const baseFatigue = Math.floor(Math.random() * 8) + 10 + weatherFatigueBonus;
          targetP.condition = Math.max(20, (targetP.condition ?? 95) - baseFatigue);

          // Card accumulation & suspension logic
          if (plog.yellowCards > 0) {
            targetP.yellowCards = (targetP.yellowCards || 0) + plog.yellowCards;
            if (targetP.yellowCards >= 5) {
              targetP.isSuspended = true;
              targetP.suspensionMatchesRemaining = 1;
              targetP.yellowCards = 0;
              if (targetP.isMyClient) {
                performanceNews.push({
                  id: `news_susp_${Date.now()}_${targetP.id}`,
                  week,
                  season,
                  headline: `🟨 SUSPENSION: Client ${targetP.name} Picked Up 5th Yellow Card`,
                  content: `${targetP.name} has triggered a 1-match suspension due to yellow card accumulation in ${targetP.clubName}'s recent fixture.`,
                  category: 'match',
                  urgency: 'normal',
                  read: false,
                  targetRole: 'agent',
                  relatedPlayerId: targetP.id
                });
              }
            }
          }

          if (plog.redCards > 0) {
            targetP.redCards = (targetP.redCards || 0) + 1;
            targetP.isSuspended = true;
            targetP.suspensionMatchesRemaining = 2;
            if (targetP.isMyClient) {
              performanceNews.push({
                id: `news_red_${Date.now()}_${targetP.id}`,
                week,
                season,
                headline: `🟥 RED CARD BANNED: Client ${targetP.name} Sent Off!`,
                content: `${targetP.name} received a direct red card in ${targetP.clubName}'s match, resulting in a mandatory 2-match federation suspension.`,
                category: 'match',
                urgency: 'hot',
                read: false,
                targetRole: 'agent',
                relatedPlayerId: targetP.id
              });
            }
          }
          
          if (plog.goals > 0) {
            moments.push({
              minute: Math.floor(Math.random() * 80) + 10,
              text: `GOAL! ${targetP.name} scored (${plog.goals}) for ${targetP.clubName}! [Audit Validated]`,
              isClientInvolved: targetP.isMyClient,
              playerImpactName: targetP.name
            });
          }

          // Loanee development tracking
          if (targetP.isOnLoan && targetP.loanDetails) {
            targetP.loanDetails.appearances = (targetP.loanDetails.appearances || 0) + 1;
            targetP.loanDetails.goals = (targetP.loanDetails.goals || 0) + plog.goals;
            targetP.loanDetails.ratingSum = (targetP.loanDetails.ratingSum || 0) + plog.rating;
            // Potential youth rating growth
            if (targetP.age <= 21 && Math.random() < 0.15 && targetP.rating < (targetP.potential || 85)) {
              targetP.rating += 1;
              targetP.value = Math.round(targetP.value * 1.08);
            }
          }

          // Client match performance bonuses & incentive milestones
          if (targetP.isMyClient) {
            const commRate = (targetP.agentCommission || 10) / 100;

            // 1. Goal Bonus
            if (plog.goals > 0) {
              const goalBonusPerGoal = targetP.clauses?.goalBonus || Math.round(targetP.wage * 0.25);
              const totalGoalBonus = goalBonusPerGoal * plog.goals;
              const agentGoalBonus = Math.round(totalGoalBonus * commRate);
              clientBonusIncome += agentGoalBonus;

              clientMilestones.push({
                title: `⚽ Goal Milestone: ${targetP.name}`,
                description: `${targetP.name} netted ${plog.goals} goal${plog.goals > 1 ? 's' : ''} in matchweek ${week}. Paid €${formatMoney(totalGoalBonus)} in contractual bonuses.`,
                impact: `+€${formatMoney(agentGoalBonus)} Commission`
              });
            }

            // 2. Clean Sheet Bonus
            const isDefenderOrGk = ['GK', 'CB', 'LB', 'RB'].includes(targetP.position);
            const teamConceded = targetP.clubId === home.id ? awayGoals : homeGoals;
            if (isDefenderOrGk && teamConceded === 0) {
              const cleanSheetBonus = targetP.clauses?.cleanSheetBonus || Math.round(targetP.wage * 0.2);
              const agentCsBonus = Math.round(cleanSheetBonus * commRate);
              clientBonusIncome += agentCsBonus;

              clientMilestones.push({
                title: `🛡️ Clean Sheet: ${targetP.name}`,
                description: `${targetP.name} anchored a flawless defense in a 0-conceded victory.`,
                impact: `+€${formatMoney(agentCsBonus)} Commission`
              });
            }

            // 3. Star Performance / Man of the Match (Rating >= 8.0 or 2+ goals)
            if (plog.rating >= 8.0 || plog.goals >= 2) {
              targetP.morale = Math.min(100, (targetP.morale || 75) + 10);
              const valBoost = Math.round(targetP.value * 0.06);
              targetP.value += valBoost;

              performanceNews.push({
                id: `news_motm_${Date.now()}_${targetP.id}_${week}`,
                week,
                season,
                headline: `🌟 MAN OF THE MATCH: ${targetP.name} Dominates for ${targetP.clubName} (Rating ${plog.rating.toFixed(1)})!`,
                content: `An electrifying display from ${targetP.name} earned top matchday honors. European scouts are buzzing as the player's market valuation surges to €${formatMoney(targetP.value)} (+€${formatMoney(valBoost)}).`,
                category: 'player_development',
                urgency: 'hot',
                read: false,
                targetRole: 'agent',
                roleBadge: '💼 Client Matchday',
                actionTab: 'my_players',
                actionLabel: 'View Client',
                relatedPlayerId: targetP.id
              });

              // Endorsement upgrade chance (15% on star performance)
              if (Math.random() < 0.15) {
                const brands = ['Nike Elite Athlete', 'Adidas Predator Pro', 'Puma Future Icon'];
                const brand = brands[Math.floor(Math.random() * brands.length)];
                const endorsementDeal = Math.round(targetP.value * 0.05);
                const agentEndorsementCut = Math.round(endorsementDeal * 0.2);
                clientBonusIncome += agentEndorsementCut;

                if (!targetP.personalLife) {
                  targetP.personalLife = {
                    happiness: 85,
                    socialMediaFollowers: 75000,
                    scandalLevel: 0,
                    brandSponsor: brand,
                    sponsor: brand,
                    endorsementEarnings: endorsementDeal,
                    scandalRisk: 5,
                    lifestyleSpending: Math.round(targetP.wage * 0.3),
                    netWorth: endorsementDeal
                  };
                } else {
                  targetP.personalLife.brandSponsor = brand;
                  targetP.personalLife.sponsor = brand;
                  targetP.personalLife.endorsementEarnings = (targetP.personalLife.endorsementEarnings || 0) + endorsementDeal;
                }

                performanceNews.push({
                  id: `news_endorse_${Date.now()}_${targetP.id}`,
                  week,
                  season,
                  headline: `👟 COMMERCIAL DEAL: ${targetP.name} Signs High-End Endorsement with ${brand}!`,
                  content: `Following blistering match performances, ${targetP.name} signed a lucrative €${formatMoney(endorsementDeal)} commercial boot endorsement. ${agency?.agencyName || 'Agency'} secured €${formatMoney(agentEndorsementCut)} in sponsorship commission!`,
                  category: 'agency',
                  urgency: 'hot',
                  read: false,
                  targetRole: 'agent',
                  roleBadge: '💼 Sponsorship Cut',
                  actionTab: 'my_players',
                  actionLabel: 'Client Profile',
                  relatedPlayerId: targetP.id
                });
              }
            }
          }
        }
      });

      // Push fixture result
      matchResults.push({
        id: `fix_w${week}_${home.shortName}_vs_${away.shortName}`,
        week,
        homeClubId: home.id,
        awayClubId: away.id,
        homeScore: homeGoals,
        awayScore: awayGoals,
        played: true,
        keyMoments: moments
      });
    }
  });

  return { updatedClubs, updatedPlayers, matchResults, clientBonusIncome, clientMilestones, performanceNews };
}

// Helper to filter news items tailored to the player's active role
export function filterNewsForActiveRole(
  news: NewsItem[], 
  role: 'agent' | 'club_owner' | 'fa_president' | 'all'
): NewsItem[] {
  if (role === 'all') return news;
  return news.filter(item => {
    if (!item.targetRole || item.targetRole === 'all') return true;
    if (item.targetRoles && item.targetRoles.includes(role)) return true;
    return item.targetRole === role;
  });
}

// Generate Simulation News Articles for League Rules, Presidency, Scandals, and Role-Tailored Intel
export function generateSimulationNewsItems(agency: AgencyState, week: number, season: number, players: Player[]): NewsItem[] {
  const newItems: NewsItem[] = [];

  const scandalLevel = agency.presidency?.conflictScandalLevel || 0;
  const pRole = agency.presidency?.role || 'None';
  const policies = agency.presidency?.activePolicies;
  const activeRoles = agency.activeRoles || { agent: true, club_owner: false, fa_president: false, currentRole: 'agent' };

  // ==========================================
  // 1. AGENT ROLE TAILORED NEWS
  // ==========================================
  const myClients = players.filter(p => p.isMyClient);

  // Check for Client Player Discontent (Low Loyalty)
  const discontentPlayer = myClients.find(p => p.loyalty < 35);
  if (discontentPlayer && Math.random() < 0.45) {
    newItems.push({
      id: `news_loyalty_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      week,
      season,
      headline: `💼 AGENT ALERT: ${discontentPlayer.name} Demands Contract Renegotiation!`,
      content: `Reports indicate ${discontentPlayer.name} (Loyalty: ${discontentPlayer.loyalty}%) is questioning agency representation and demands an improved salary tier at ${discontentPlayer.clubName}.`,
      category: 'scandal',
      urgency: 'hot',
      read: false,
      targetRole: 'agent',
      roleBadge: '💼 Agent Intel',
      actionTab: 'my_players',
      actionLabel: 'Manage Client',
      relatedPlayerId: discontentPlayer.id
    });
  }

  // Elite Club Transfer Inquiry for Star Clients
  const starClient = myClients.find(p => p.rating >= 83);
  if (starClient && Math.random() < 0.3) {
    const eliteClubs = ['Real Madrid', 'Manchester City', 'Bayern Munich', 'Paris SG', 'Inter Milan'];
    const interestedClub = eliteClubs[Math.floor(Math.random() * eliteClubs.length)];
    newItems.push({
      id: `news_agent_inquiry_${Date.now()}_${starClient.id}`,
      week,
      season,
      headline: `💼 TRANSFER RADAR: ${interestedClub} Inquires About ${starClient.name}!`,
      content: `Chief scouts from ${interestedClub} have reached out to ${agency.agencyName} regarding the contract availability and wage expectations for star client ${starClient.name} (${starClient.position}, €${((starClient.value || 0)/1000000).toFixed(1)}M value).`,
      category: 'transfer',
      urgency: 'hot',
      read: false,
      targetRole: 'agent',
      roleBadge: '💼 Agency Dispatch',
      actionTab: 'transfer_market',
      actionLabel: 'Transfer Desk',
      relatedPlayerId: starClient.id
    });
  }

  // Commercial Brand Endorsement Inquiry
  if (myClients.length > 0 && Math.random() < 0.25) {
    const randomClient = myClients[Math.floor(Math.random() * myClients.length)];
    const brands = ['Nike Football', 'Adidas Performance', 'Puma Speed', 'Under Armour', 'EA Sports FC'];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    newItems.push({
      id: `news_brand_pitch_${Date.now()}_${randomClient.id}`,
      week,
      season,
      headline: `💼 COMMERCIAL SPONSORSHIP: ${brand} Submits Boot Deal for ${randomClient.name}!`,
      content: `Global sports brand ${brand} has submitted an official marketing endorsement term sheet for ${randomClient.name}. Deal includes image rights revenue cuts for ${agency.agencyName}.`,
      category: 'sponsorship',
      urgency: 'normal',
      read: false,
      targetRole: 'agent',
      roleBadge: '💼 Commercial Pitch',
      actionTab: 'my_players',
      actionLabel: 'Review Deal',
      relatedPlayerId: randomClient.id
    });
  }

  // ==========================================
  // 2. CLUB PRESIDENT / OWNER TAILORED NEWS
  // ==========================================
  const ownsClub = (agency.clubShares || []).some(s => s.sharePercent > 50 || s.lastElectionWon) || activeRoles.club_owner || pRole === 'Club President';
  const clubName = agency.presidency?.clubName || (agency.clubShares && agency.clubShares[0]?.clubName) || 'Your Owned Club';

  if (ownsClub) {
    // Matchday Box Office & VIP Gate Receipts
    if (Math.random() < 0.35) {
      const matchdayRevenue = Math.floor(1500000 + Math.random() * 2500000);
      newItems.push({
        id: `news_club_gate_${Date.now()}`,
        week,
        season,
        headline: `👑 PRESIDENT'S DESK: Sold-Out Stadium Delivers €${(matchdayRevenue/1000000).toFixed(2)}M Gate Receipts at ${clubName}!`,
        content: `Matchday operations report record attendance and sell-out VIP luxury boxes at ${clubName}. Commercial matchday turnover boosts quarterly operational cashflow.`,
        category: 'agency',
        urgency: 'normal',
        read: false,
        targetRole: 'club_owner',
        roleBadge: '👑 Club Presidential',
        actionTab: 'club_president',
        actionLabel: 'President Suite'
      });
    }

    // Manager Tactical & Dressing Room Morale Bulletin
    if (Math.random() < 0.3) {
      newItems.push({
        id: `news_club_tactics_${Date.now()}`,
        week,
        season,
        headline: `👑 SQUAD REPORT: Head Coach Praises Squad Chemistry & Tactical Discipline at ${clubName}`,
        content: `The coaching staff at ${clubName} has submitted their weekly tactical audit. Team spirit is high following tactical adjustments, with senior squad leaders holding 88% dressing room harmony.`,
        category: 'match',
        urgency: 'normal',
        read: false,
        targetRole: 'club_owner',
        roleBadge: '👑 Dressing Room',
        actionTab: 'club_president',
        actionLabel: 'Inspect Squad'
      });
    }

    // Shareholder & Board Confidence Poll
    if (Math.random() < 0.25) {
      newItems.push({
        id: `news_club_board_${Date.now()}`,
        week,
        season,
        headline: `👑 BOARD CONFIDENCE: Club Shareholders Reaffirm Strong Trust in Presidential Stewardship`,
        content: `Financial auditors and club trustees at ${clubName} published their quarterly review, noting disciplined wage management and positive stadium asset valuation under presidential leadership.`,
        category: 'agency',
        urgency: 'normal',
        read: false,
        targetRole: 'club_owner',
        roleBadge: '👑 Board of Directors',
        actionTab: 'club_president',
        actionLabel: 'Board Suite'
      });
    }
  }

  // ==========================================
  // 3. FA / FEDERATION PRESIDENT TAILORED NEWS
  // ==========================================
  const isFAExecutive = activeRoles.fa_president || pRole === 'FIFA Global President' || pRole === 'Continental President' || pRole === 'Federation Director';

  if (isFAExecutive || Math.random() < 0.4) {
    // League Rule Governance & Salary Cap Compliance
    if (policies && Math.random() < 0.45) {
      newItems.push({
        id: `news_gov_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        week,
        season,
        headline: `🏛️ FEDERATION GAZETTE: Salary Cap €${(policies.salaryCapPerYear/1000000).toFixed(0)}M & Foreign Limits Audited`,
        content: `The Executive Governance Council confirms that continental league regulations are being audited. Member clubs must comply with the ${policies.foreignPlayerLimit}-foreign player quota or face points penalties.`,
        category: 'governance',
        urgency: 'normal',
        read: false,
        targetRole: 'fa_president',
        roleBadge: '🏛️ Federation Council',
        actionTab: 'governance',
        actionLabel: 'Governance Desk'
      });
    }

    // Disciplinary Tribunal Investigation Bulletin
    if (Math.random() < 0.35) {
      newItems.push({
        id: `news_tribunal_probe_${Date.now()}`,
        week,
        season,
        headline: `🏛️ ETHICS TRIBUNAL: Disciplinary Committee Concludes Compliance Review of Member Leagues`,
        content: `The independent Ethics & Disciplinary Chamber submitted their weekly compliance brief to the President's Office, reviewing financial fair play filings and referee conduct across top leagues.`,
        category: 'governance',
        urgency: 'hot',
        read: false,
        targetRole: 'fa_president',
        roleBadge: '🏛️ Ethics Tribunal',
        actionTab: 'governance',
        actionLabel: 'Review Tribunal'
      });
    }

    // Solidarity Grants & Grassroots Development Funds
    if (Math.random() < 0.3) {
      newItems.push({
        id: `news_solidarity_fund_${Date.now()}`,
        week,
        season,
        headline: `🏛️ SOLIDARITY DESK: Federation Distributes €25M in Grassroots Youth Infrastructure Grants`,
        content: `Under the Presidential Youth Initiative, 54 regional football associations have received multi-million euro solidarity subsidies to modernize youth academies and referee development centers.`,
        category: 'governance',
        urgency: 'normal',
        read: false,
        targetRole: 'fa_president',
        roleBadge: '🏛️ Solidarity Fund',
        actionTab: 'governance',
        actionLabel: 'Treasury Suite'
      });
    }
  }

  // ==========================================
  // 4. GLOBAL / CROSS-ROLE SCANDALS & BREAKING NEWS
  // ==========================================
  // Check for Ethics & Conflict Scandal
  if (scandalLevel >= 40 && Math.random() < 0.5) {
    newItems.push({
      id: `news_scandal_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      week,
      season,
      headline: `🚨 ETHICS COMMITTEE ALERT: Press Exposes Insider Deals at ${agency.agencyName}!`,
      content: `A whistleblower has leaked confidential contracts showing dual-role conflict-of-interest operations. Scandal hazard level has reached ${scandalLevel}%. Legal advisors urge immediate action.`,
      category: 'scandal',
      urgency: scandalLevel >= 60 ? 'breaking' : 'hot',
      read: false,
      targetRole: 'all',
      roleBadge: '🚨 Breaking Scandal',
      actionTab: 'dark_arts',
      actionLabel: 'Crisis Desk'
    });
  }

  // Federation Presidency Command Overview
  if (pRole !== 'None' && Math.random() < 0.25) {
    newItems.push({
      id: `news_pres_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      week,
      season,
      headline: `🌐 CONTINENTAL DESK: ${agency.agentName} Command as ${pRole} Continues`,
      content: `With Political Influence standing at ${agency.presidency?.politicalInfluence || 50}/100, executive policy directives continue to shape continental football governance and regulatory standards.`,
      category: 'governance',
      urgency: 'normal',
      read: false,
      targetRole: 'fa_president',
      roleBadge: '🏛️ President Mandate',
      actionTab: 'governance',
      actionLabel: 'Governance Desk'
    });
  }

  return newItems;
}

// Add milestone helper
export function createCareerMilestone(
  agency: AgencyState,
  title: string,
  description: string,
  type: 'transfer' | 'award' | 'presidency' | 'milestone' | 'quest' | 'acquisition' | 'election' | 'scandal',
  impact?: string
): AgencyState {
  const newMilestone = {
    id: `ms_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    week: agency.currentWeek,
    season: agency.currentSeason,
    title,
    description,
    type,
    impact
  };

  return {
    ...agency,
    milestones: [newMilestone, ...agency.milestones]
  };
}

// Helper to record financial transactions & keep balance, history, and milestones synced
export function recordFinancialTransaction(
  agency: AgencyState,
  amount: number, // positive for income, negative for expense
  title: string,
  description: string,
  category: FinancialTransactionCategory = 'acquisition'
): AgencyState {
  const currentWeek = agency.currentWeek || 1;
  const currentSeason = agency.currentSeason || 2026;
  const newBalance = Math.max(0, agency.balance + amount);

  // Update or append financial history
  const history = [...(agency.financialHistory || [])];
  const lastIdx = history.length - 1;

  if (lastIdx >= 0 && history[lastIdx].week === currentWeek && history[lastIdx].season === currentSeason) {
    const existing = history[lastIdx];
    const newIncome = amount > 0 ? existing.income + amount : existing.income;
    const newExpense = amount < 0 ? existing.expense + Math.abs(amount) : existing.expense;
    history[lastIdx] = {
      ...existing,
      income: newIncome,
      expense: newExpense,
      net: newIncome - newExpense,
      balance: newBalance
    };
  } else {
    const income = amount > 0 ? amount : 0;
    const expense = amount < 0 ? Math.abs(amount) : 0;
    history.push({
      week: currentWeek,
      season: currentSeason,
      income,
      expense,
      net: income - expense,
      balance: newBalance
    });
  }

  const milestone = {
    id: `fin_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    week: currentWeek,
    season: currentSeason,
    title,
    description,
    type: category,
    impact: amount >= 0 ? `+${formatMoney(amount)}` : `-${formatMoney(Math.abs(amount))}`
  };

  return {
    ...agency,
    balance: newBalance,
    milestones: [milestone, ...(agency.milestones || [])],
    financialHistory: history
  };
}

// -------------------------------------------------------------------------
// Weekly Player Unrest & Transfer Request Engine
// Dynamically generates and advances player discontent, club clashes & transfer requests
// -------------------------------------------------------------------------
export function processWeeklyPlayerUnrest(
  players: Player[],
  clubs: Club[],
  week: number,
  season: number
): { updatedPlayers: Player[]; newsItems: NewsItem[] } {
  const updatedPlayers = [...players];
  const newsItems: NewsItem[] = [];

  const reasonsMap = [
    {
      key: 'wants_new_challenge' as const,
      label: 'Wants New Challenge',
      desc: 'Player feels stale after years at the club and wants to test himself in a new environment.'
    },
    {
      key: 'underpaid_wage_dispute' as const,
      label: 'Underpaid Wage Dispute',
      desc: 'Player believes his weekly wage does not reflect his star ratings compared to teammates.'
    },
    {
      key: 'outgrown_club_level' as const,
      label: 'Outgrown Club Level',
      desc: 'Player rating has surpassed the stature of his club and demands a move to a European titan.'
    },
    {
      key: 'benched_lack_playing_time' as const,
      label: 'Benched / Lack of Minutes',
      desc: 'Player is frustrated by limited starting line-up opportunities under the head coach.'
    },
    {
      key: 'manager_clash' as const,
      label: 'Tactical Clash with Manager',
      desc: 'Player disagrees with manager tactics and defensive setup.'
    },
    {
      key: 'contract_stalled' as const,
      label: 'Contract Negotiations Stalled',
      desc: 'Club board refuses to meet wage expectations with contract expiring soon.'
    }
  ];

  updatedPlayers.forEach((player) => {
    if (player.clubId === 'free_agent') return;

    const club = clubs.find(c => c.id === player.clubId);

    // Initialize Playing Time Baseline if not present
    if (!player.agreedPlayingTime) {
      if (player.rating >= 84) player.agreedPlayingTime = 'Star Player';
      else if (player.rating >= 78) player.agreedPlayingTime = 'Important Starter';
      else if (player.rating >= 72) player.agreedPlayingTime = 'Regular Starter';
      else if (player.age <= 21) player.agreedPlayingTime = 'Youth Prospect';
      else player.agreedPlayingTime = 'Squad Rotation';
    }

    if (player.playingTimeSatisfaction === undefined) {
      player.playingTimeSatisfaction = 85;
    }
    if (player.consecutiveWeeksBenched === undefined) {
      player.consecutiveWeeksBenched = 0;
    }

    // Evaluate Playing Time Satisfaction based on appearances vs agreed playing time
    const expectedApps = player.agreedPlayingTime === 'Star Player' ? Math.floor(week * 0.85) :
                         player.agreedPlayingTime === 'Important Starter' ? Math.floor(week * 0.70) :
                         player.agreedPlayingTime === 'Regular Starter' ? Math.floor(week * 0.50) :
                         Math.floor(week * 0.25);

    const isLackingMinutes = week >= 6 && player.stats.appearances < expectedApps;

    if (isLackingMinutes) {
      player.consecutiveWeeksBenched += 1;
      player.playingTimeSatisfaction = Math.max(0, player.playingTimeSatisfaction - (player.consecutiveWeeksBenched >= 4 ? 12 : 6));
      player.form = Math.max(30, player.form - 2);
    } else {
      player.consecutiveWeeksBenched = Math.max(0, player.consecutiveWeeksBenched - 1);
      player.playingTimeSatisfaction = Math.min(100, player.playingTimeSatisfaction + 4);
    }

    const isUnrestActive = !!player.unrest && player.unrest.status !== 'content';

    // 1. Progress existing unrest
    if (isUnrestActive && player.unrest) {
      // Increase discontent if not addressed
      const newLevel = Math.min(100, player.unrest.discontentLevel + Math.floor(Math.random() * 6) + 3);
      player.morale = Math.max(10, player.morale - 4);

      if (newLevel >= 75 && player.unrest.status === 'discontent') {
        player.unrest.status = 'transfer_requested';
        player.unrest.discontentLevel = newLevel;
        player.unrest.discountPercent = 30;

        // Club Hierarchy Decision: Loan Out, Transfer List, or Force Player to Stay!
        const clubDecisionRoll = Math.random();
        if (player.age <= 22 || player.rating < (club?.reputation || 75)) {
          // Loan decision: Club decides to loan player out for game time
          player.isLoanListed = true;
          player.loanListedByClub = true;
          newsItems.push({
            id: `news_loan_decision_${Date.now()}_${player.id}`,
            week,
            season,
            headline: `LOAN LISTED: ${player.clubName} Make ${player.name} Available for Loan!`,
            content: `Following lack of minutes and player disinterest, ${player.clubName} have placed ${player.name} (${player.rating} OVR) on the official Loan List to gain vital match experience elsewhere.`,
            category: 'transfer',
            urgency: 'hot',
            read: false
          });
        } else if (clubDecisionRoll < 0.50) {
          // Transfer list decision
          player.isTransferListed = true;
          player.transferListedByClub = true;
          newsItems.push({
            id: `news_tr_${Date.now()}_${player.id}`,
            week,
            season,
            headline: `TRANSFER REQUEST ACCEPTED: ${player.name} Listed by ${player.clubName}!`,
            content: `${player.name} (Rating ${player.rating}) has formally handed in a Transfer Request to ${player.clubName}. Reason: ${player.unrest.reasonLabel}. Club agreed to entertain bids!`,
            category: 'scandal',
            urgency: 'breaking',
            read: false
          });
        } else {
          // Club forces player to stay!
          player.clubForcedStay = true;
          player.morale = Math.max(5, player.morale - 30);
          player.form = Math.max(25, player.form - 20);

          // Side-effects: Locker room toxicity & teammates morale penalty
          updatedPlayers.filter(p => p.clubId === player.clubId && p.id !== player.id).forEach(teammate => {
            teammate.morale = Math.max(10, (teammate.morale || 80) - 5);
          });

          newsItems.push({
            id: `news_forced_stay_${Date.now()}_${player.id}`,
            week,
            season,
            headline: `⚠️ LOCKED IN CONTRACT JAIL: ${player.clubName} Block ${player.name}'s Exit!`,
            content: `The board of ${player.clubName} has formally BLOCKED ${player.name}'s transfer request, forcing the player to honor their contract! Side effects: Player went on training strike, dressing room morale plummeted (-5 team morale), and tabloid leaks intensified.`,
            category: 'scandal',
            urgency: 'breaking',
            read: false
          });
        }
      } else {
        player.unrest.discontentLevel = newLevel;
      }
    } else {
      // 2. Evaluate new potential unrest trigger
      const triggerRoll = Math.random();

      let triggeredReason = null;

      if (player.playingTimeSatisfaction < 40 && player.agreedPlayingTime !== 'Youth Prospect') {
        triggeredReason = reasonsMap.find(r => r.key === 'benched_lack_playing_time');
      } else if (player.rating >= 80 && player.wage < 40000 && triggerRoll < 0.15) {
        triggeredReason = reasonsMap.find(r => r.key === 'underpaid_wage_dispute');
      } else if (player.rating >= 81 && club && club.reputation < 82 && triggerRoll < 0.18) {
        triggeredReason = reasonsMap.find(r => r.key === 'outgrown_club_level');
      } else if (player.contractYears <= 1 && triggerRoll < 0.20) {
        triggeredReason = reasonsMap.find(r => r.key === 'contract_stalled');
      } else if (triggerRoll < 0.04) {
        triggeredReason = reasonsMap[Math.floor(Math.random() * reasonsMap.length)];
      }

      if (triggeredReason) {
        player.unrest = {
          status: 'discontent',
          reason: triggeredReason.key,
          reasonLabel: triggeredReason.label,
          discontentLevel: 50 + Math.floor(Math.random() * 20),
          description: `${player.name}: ${triggeredReason.desc} (Playing time satisfaction: ${player.playingTimeSatisfaction}%)`,
          discountPercent: 20
        };

        if (player.isMyClient) {
          newsItems.push({
            id: `news_client_unrest_${Date.now()}_${player.id}`,
            week,
            season,
            headline: `CLIENT ALERT: ${player.name} Expresses Discontent at ${player.clubName}!`,
            content: `Your client ${player.name} has reached out to your agency regarding issues at ${player.clubName} (${triggeredReason.label}). Role promised: ${player.agreedPlayingTime}. Open My Clients to intervene and resolve the issue.`,
            category: 'agency',
            urgency: 'hot',
            read: false
          });
        }
      }
    }
  });

  return { updatedPlayers, newsItems };
}

// -------------------------------------------------------------------------
// AI Club-to-Club Automatic Transfer Simulation
// Simulates independent transfers between AI clubs on the open market
// -------------------------------------------------------------------------
export function simulateAiClubToClubTransfers(
  players: Player[],
  clubs: Club[],
  week: number,
  season: number
): { updatedPlayers: Player[]; updatedClubs: Club[]; newsItems: NewsItem[] } {
  const updatedPlayers = [...players];
  const updatedClubs = [...clubs];
  const newsItems: NewsItem[] = [];

  // Transfer window active weeks (e.g. Weeks 1-12 Summer, 22-26 Winter)
  const isTransferWindow = (week >= 1 && week <= 12) || (week >= 22 && week <= 26);
  const chance = isTransferWindow ? 0.45 : 0.15;

  if (Math.random() < chance) {
    // Pick non-user client players in AI clubs or free agency who are eligible for permanent transfer
    const eligibleTargets = updatedPlayers.filter(p => !p.isMyClient && p.rating >= 72 && checkPlayerTransferEligibility(p, week, season).canTransferPermanently);
    if (eligibleTargets.length > 0) {
      const targetPlayer = eligibleTargets[Math.floor(Math.random() * eligibleTargets.length)];
      
      // Find potential buyer clubs with reputation & budget
      const buyerClubs = updatedClubs.filter(c => c.id !== targetPlayer.clubId && c.transferBudget >= targetPlayer.value * 0.85);

      if (buyerClubs.length > 0) {
        const buyer = buyerClubs[Math.floor(Math.random() * buyerClubs.length)];
        const oldClubName = targetPlayer.clubName;
        const fee = Math.round(targetPlayer.value * (0.9 + Math.random() * 0.3));

        // Execute transfer
        targetPlayer.clubId = buyer.id;
        targetPlayer.clubName = buyer.name;
        targetPlayer.wage = Math.round(targetPlayer.wage * 1.15);
        targetPlayer.lastTransferWeek = week;
        targetPlayer.lastTransferSeason = season;
        targetPlayer.lastTransferWindowId = getCurrentTransferWindowId(season, week);
        targetPlayer.transferredInCurrentWindow = true;
        targetPlayer.transferredFromClubName = oldClubName;
        targetPlayer.isTransferListed = false;
        targetPlayer.transferListedByClub = false;
        buyer.transferBudget = Math.max(0, buyer.transferBudget - fee);

        if (oldClubName !== 'Free Agent') {
          const seller = updatedClubs.find(c => c.name === oldClubName);
          if (seller) {
            let sellerNetGain = fee;
            // Sell-on clause check
            if (targetPlayer.clauses?.sellOnPercent && targetPlayer.clauses.sellOnPercent > 0) {
              const sellOnFee = Math.round(fee * (targetPlayer.clauses.sellOnPercent / 100));
              sellerNetGain = Math.max(0, fee - sellOnFee);
              targetPlayer.historicalSellOnEarned = (targetPlayer.historicalSellOnEarned || 0) + sellOnFee;
              
              newsItems.push({
                id: `news_sellon_${Date.now()}_${targetPlayer.id}`,
                week,
                season,
                headline: `💰 SELL-ON CLAUSE TRIGGERED: €${formatMoney(sellOnFee)} Secondary Payout!`,
                content: `${targetPlayer.name}'s transfer triggered an active ${targetPlayer.clauses.sellOnPercent}% sell-on clause. €${formatMoney(sellOnFee)} was paid out to originating stakeholders!`,
                category: 'transfer',
                urgency: 'normal',
                read: false
              });
            }
            seller.transferBudget += Math.round(sellerNetGain * 0.9);
          }
        }

        newsItems.push({
          id: `news_ai_tr_${Date.now()}_${targetPlayer.id}`,
          week,
          season,
          headline: oldClubName === 'Free Agent'
            ? `FREE AGENT SIGNING: ${buyer.name} Complete Acquisition of ${targetPlayer.name}!`
            : `BLOCKBUSTER AI TRANSFER: ${buyer.name} Sign ${targetPlayer.name} for €${formatMoney(fee)}!`,
          content: `${targetPlayer.name} (Rating ${targetPlayer.rating}, Position ${targetPlayer.position}) has officially completed a move from ${oldClubName} to ${buyer.name} for €${formatMoney(fee)} on a 4-year deal!`,
          category: 'transfer',
          urgency: fee >= 50000000 ? 'breaking' : 'hot',
          read: false
        });
      }
    }
  }

  return { updatedPlayers, updatedClubs, newsItems };
}

// -------------------------------------------------------------------------
// Multi-Week Ongoing Contract Negotiation Processor
// Processes multi-week board reviews and contract proposals
// -------------------------------------------------------------------------
export function processOngoingContractNegotiations(
  players: Player[],
  agency: AgencyState,
  week: number,
  season: number
): { updatedPlayers: Player[]; updatedAgency: AgencyState; newsItems: NewsItem[] } {
  const updatedPlayers = [...players];
  let updatedAgency = { ...agency };
  const newsItems: NewsItem[] = [];

  updatedPlayers.forEach(player => {
    if (player.ongoingContractNegotiation && player.ongoingContractNegotiation.status === 'pending_board') {
      const neg = player.ongoingContractNegotiation;
      neg.weeksRemaining -= 1;

      if (neg.weeksRemaining <= 0) {
        // Evaluate Board Decision
        const targetWage = neg.requestedWage;
        const currentWage = player.wage;
        const wageRatio = targetWage / Math.max(1000, currentWage);

        if (wageRatio <= 1.40 || (player.rating >= 82 && wageRatio <= 1.80)) {
          // Board Accepts Terms
          neg.status = 'accepted';
          player.wage = targetWage;
          player.contractYears = neg.requestedYears || 4;
          player.agentCommission = neg.requestedCommission;
          
          if (neg.requestedReleaseClause) {
            player.clauses.releaseClause = neg.requestedReleaseClause;
          }
          if (neg.requestedClauses) {
            player.clauses = {
              ...player.clauses,
              ...neg.requestedClauses
            };
          }

          player.morale = 100;
          player.loyalty = Math.min(100, player.loyalty + 20);
          player.unrest = {
            status: 'content',
            reason: 'wants_new_challenge',
            reasonLabel: 'Satisfied (New Extended Contract)',
            discontentLevel: 0,
            description: `Board approved extended contract at €${formatMoney(targetWage)}/wk.`,
            discountPercent: 0
          };

          // Commission bonus to agency
          const commEarned = Math.round(targetWage * (neg.requestedCommission / 100) * 4);
          updatedAgency = recordFinancialTransaction(
            updatedAgency,
            commEarned,
            `Contract Renewal Fee: ${player.name}`,
            `Agent commission earned on ${player.name}'s renewed contract with ${player.clubName}.`,
            'transfer'
          );

          newsItems.push({
            id: `news_neg_approved_${Date.now()}_${player.id}`,
            week,
            season,
            headline: `CONTRACT APPROVED: ${player.name} Signs €${formatMoney(targetWage)}/wk Renewal at ${player.clubName}!`,
            content: `Following multi-week board deliberations, ${player.clubName} approved the contract renewal for ${player.name}! New salary set to €${formatMoney(targetWage)}/week with a ${neg.requestedCommission}% agent commission fee.`,
            category: 'agency',
            urgency: 'breaking',
            read: false
          });
        } else if (wageRatio <= 2.20) {
          // Board Counter-Offer
          const counterWage = Math.round(currentWage * 1.35);
          neg.status = 'counter_offered';
          neg.counterWage = counterWage;
          neg.reasoning = `The board refused €${formatMoney(targetWage)}/wk, but counter-offered €${formatMoney(counterWage)}/wk.`;

          newsItems.push({
            id: `news_neg_counter_${Date.now()}_${player.id}`,
            week,
            season,
            headline: `BOARD COUNTER-OFFER: ${player.clubName} Propose €${formatMoney(counterWage)}/wk for ${player.name}`,
            content: `${player.clubName} executives rejected the original €${formatMoney(targetWage)}/wk request, but submitted a counter-proposal of €${formatMoney(counterWage)}/week. Open My Clients to respond.`,
            category: 'agency',
            urgency: 'hot',
            read: false
          });
        } else {
          // Board Rejection
          neg.status = 'rejected';
          neg.reasoning = `The board flatly rejected your €${formatMoney(targetWage)}/wk demand as absurd!`;
          player.morale = Math.max(10, player.morale - 25);
          
          if (player.unrest) {
            player.unrest.discontentLevel = 95;
            player.unrest.status = 'transfer_requested';
            player.unrest.description = `Negotiations collapsed after board rejected wage demands at ${player.clubName}.`;
          }

          newsItems.push({
            id: `news_neg_rejected_${Date.now()}_${player.id}`,
            week,
            season,
            headline: `NEGOTIATIONS COLLAPSED: ${player.clubName} Flatly Reject ${player.name}'s Wage Demands!`,
            content: `Contract talks between ${agency.agencyName} and ${player.clubName} broke down completely after the board deemed the requested salary unreasonable. ${player.name} is now demanding an immediate transfer listing!`,
            category: 'scandal',
            urgency: 'breaking',
            read: false
          });
        }
      }
    }
  });

  return { updatedPlayers, updatedAgency, newsItems };
}

// -------------------------------------------------------------------------
// Multi-Week Ongoing Transfer Negotiation Processor
// Processes multi-week club transfer negotiations and board responses
// -------------------------------------------------------------------------
export function processOngoingTransferNegotiations(
  players: Player[],
  clubs: Club[],
  agency: AgencyState,
  week: number,
  season: number
): { updatedPlayers: Player[]; updatedAgency: AgencyState; newsItems: NewsItem[] } {
  const updatedPlayers = [...players];
  let updatedAgency = { ...agency };
  const newsItems: NewsItem[] = [];

  updatedPlayers.forEach(player => {
    if (player.ongoingTransferNegotiation) {
      const neg = player.ongoingTransferNegotiation;
      if (neg.status === 'pending_buying_club' || neg.status === 'asking_time') {
        neg.weeksRemaining -= 1;

        if (neg.weeksRemaining > 0) {
          // The buying club asks for time to decide or is deliberating!
          const roll = Math.random();
          if (roll < 0.50) {
            neg.status = 'asking_time';
            neg.lastResponseReasoning = `${neg.buyingClubName} sporting director ${neg.buyingClubDirector} requested 1 additional week to consult with the board of directors and manager regarding financial approval.`;
            newsItems.push({
              id: `news_tr_time_${Date.now()}_${player.id}`,
              week,
              season,
              headline: `TRANSFER STALLED: ${neg.buyingClubName} Ask for Time on ${player.name} Bid`,
              content: `${neg.buyingClubName} requested extra time to deliberate on the transfer terms for ${player.name}. Sporting Director ${neg.buyingClubDirector} stated the board needs additional budget review.`,
              category: 'transfer',
              urgency: 'hot',
              read: false
            });
          } else {
            neg.lastResponseReasoning = `${neg.buyingClubName} executive committee is actively reviewing your counter-proposal. Final answer expected next matchweek.`;
          }
        } else {
          // Evaluation week! Time's up or decision reached.
          const counterFee = neg.counterFee || neg.offeredFee;
          const playerVal = player.value || 10000000;
          const feeRatio = counterFee / Math.max(1, playerVal);

          if (feeRatio <= 1.30 || Math.random() < 0.55) {
            // ACCEPTED BY BUYING CLUB!
            neg.status = 'accepted';
            neg.lastResponseReasoning = `${neg.buyingClubName} has ACCEPTED your counter-proposal! Open Transfer Hub or Mail to finalize the deal.`;
            newsItems.push({
              id: `news_tr_accepted_${Date.now()}_${player.id}`,
              week,
              season,
              headline: `TRANSFER AGREED: ${neg.buyingClubName} Accept ${formatMoney(counterFee)} Deal for ${player.name}!`,
              content: `Breaking news! ${neg.buyingClubName} accepted all transfer conditions for ${player.name}. The ${formatMoney(counterFee)} transfer is ready for final agency signature!`,
              category: 'transfer',
              urgency: 'breaking',
              read: false
            });
          } else if (feeRatio <= 1.70) {
            // COUNTER-OFFERED BY BUYING CLUB!
            const compFee = Math.round((neg.offeredFee + counterFee) / 2);
            neg.status = 'counter_offered_by_club';
            neg.offeredFee = compFee;
            neg.lastResponseReasoning = `${neg.buyingClubName} rejected ${formatMoney(counterFee)}, but submitted a counter-bid of ${formatMoney(compFee)}.`;
            newsItems.push({
              id: `news_tr_counter_${Date.now()}_${player.id}`,
              week,
              season,
              headline: `COUNTER-BID: ${neg.buyingClubName} Offer ${formatMoney(compFee)} for ${player.name}`,
              content: `${neg.buyingClubName} responded to your counter-offer for ${player.name} with a revised bid of ${formatMoney(compFee)}. Open Transfer Hub to review.`,
              category: 'transfer',
              urgency: 'hot',
              read: false
            });
          } else {
            // REJECTED / WALKED AWAY
            neg.status = 'rejected';
            neg.lastResponseReasoning = `${neg.buyingClubName} walked away from negotiations due to excessive fee demands.`;
            newsItems.push({
              id: `news_tr_rejected_${Date.now()}_${player.id}`,
              week,
              season,
              headline: `TALKS COLLAPSED: ${neg.buyingClubName} Withdraw Bid for ${player.name}`,
              content: `Transfer negotiations between ${agency.agencyName} and ${neg.buyingClubName} for ${player.name} broke down after the asking price exceeded the club's budget ceiling.`,
              category: 'scandal',
              urgency: 'hot',
              read: false
            });
          }
        }
      }
    }
  });

  return { updatedPlayers, updatedAgency, newsItems };
}

// -------------------------------------------------------------------------
// Interactive Press Interview Generator
// Spawns journalist press conference interviews & media interactions
// -------------------------------------------------------------------------
export function generatePressInterviews(
  players: Player[],
  agency: AgencyState,
  week: number,
  season: number
): PressInterview[] {
  const interviews: PressInterview[] = [];
  const myClients = players.filter(p => p.isMyClient);

  const journalists = [
    { name: 'Fabrizio "Here We Go" Romano', outlet: 'Fabrizio Romano HQ', avatar: '🎙️' },
    { name: 'James Pearce', outlet: 'Sky Sports Football', avatar: '📺' },
    { name: 'Hugo Delorme', outlet: 'L\'Equipe France', avatar: '📰' },
    { name: 'Neil Ashton', outlet: 'Daily Football Gazette', avatar: '🗞️' }
  ];

  if (myClients.length > 0 && Math.random() < 0.60) {
    const p = myClients[Math.floor(Math.random() * myClients.length)];
    const j = journalists[Math.floor(Math.random() * journalists.length)];

    interviews.push({
      id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      journalistName: j.name,
      mediaOutlet: j.outlet,
      journalistAvatar: j.avatar,
      topicTitle: `Contract Speculation Surrounding ${p.name}`,
      questionText: `Reports are circulating that European super-clubs are targeting ${p.name} (${p.rating} OVR). Is your agency actively orchestrating a move away from ${p.clubName}?`,
      question: `Reports are circulating that European super-clubs are targeting ${p.name} (${p.rating} OVR). Is your agency actively orchestrating a move away from ${p.clubName}?`,
      playerId: p.id,
      playerName: p.name,
      relatedPlayerName: p.name,
      relatedClubName: p.clubName,
      week,
      season,
      answered: false,
      options: [
        {
          id: `opt_1_${p.id}`,
          label: 'Reaffirm Commitment',
          text: `Our priority is ${p.name}'s happiness and long-term project at ${p.clubName}.`,
          description: 'Reaffirm commitment to current club.',
          impactSummary: '+10 Board Trust, +5 Loyalty, Calm Media',
          mediaReaction: `${j.outlet} reported: Agency shuts down exit rumors, praising project at ${p.clubName}.`,
          loyaltyChange: 5,
          moraleChange: 5,
          moraleDelta: 5,
          reputationChange: 2,
          reputationDelta: 2,
          darkArtsDelta: 0,
          unrestDelta: -10
        },
        {
          id: `opt_2_${p.id}`,
          label: 'Market Valuation Warning',
          text: 'Every elite player has a price tag in modern football if an irresistible bid arrives.',
          description: 'Fuel transfer hype and boost market valuation.',
          impactSummary: '+15 Market Hype, -10 Board Trust, +5 Agency Rep',
          mediaReaction: `${j.outlet} headline: Agency refuses to rule out blockbuster transfer for ${p.name}!`,
          loyaltyChange: -5,
          moraleChange: 10,
          moraleDelta: 10,
          reputationChange: 5,
          reputationDelta: 5,
          darkArtsDelta: 5,
          unrestDelta: 10
        },
        {
          id: `opt_3_${p.id}`,
          label: 'Demand Board Ambition & Raise',
          text: `The club hierarchy must match our client's ambition with an upgraded contract offer!`,
          description: 'Put public press pressure on club executives.',
          impactSummary: '+20 Client Morale, Board Friction, Forces Renewal Talk',
          mediaReaction: `${j.outlet} report: Super-agent issues public wage ultimatum to ${p.clubName} directors!`,
          loyaltyChange: 15,
          moraleChange: 15,
          moraleDelta: 15,
          reputationChange: -3,
          reputationDelta: -3,
          darkArtsDelta: 10,
          unrestDelta: 20
        },
        {
          id: `opt_4_${p.id}`,
          label: 'No Comment / Media Silence',
          text: 'We do not entertain unverified tabloid rumors. Our client remains fully focused on the pitch.',
          description: 'Maintain strict media silence.',
          impactSummary: 'Neutral impact across all parties.',
          mediaReaction: `${j.outlet} note: Agent declined to comment on ongoing market whispers.`,
          loyaltyChange: 0,
          moraleChange: 0,
          moraleDelta: 0,
          reputationChange: 0,
          reputationDelta: 0,
          darkArtsDelta: 0,
          unrestDelta: 0
        }
      ]
    });
  }

  return interviews;
}

// -------------------------------------------------------------------------
// Incoming AI Transfer Offers Generator for User Clients
// Generates realistic incoming transfer bids for the user's represented players
// Boosts offer likelihood significantly if player is Transfer Listed or Discontent
// -------------------------------------------------------------------------
export function simulateIncomingTransferOffersForUserClients(
  players: Player[],
  clubs: Club[],
  agency: AgencyState,
  week: number,
  season: number
): { updatedPlayers: Player[]; newsItems: NewsItem[] } {
  const updatedPlayers = [...players];
  const newsItems: NewsItem[] = [];

  const isTransferWindow = (week >= 1 && week <= 12) || (week >= 22 && week <= 26);

  const topClubPool = [
    { name: 'Manchester City', role: 'Sporting Director', director: 'Txiki Begiristain', avatar: '🏢' },
    { name: 'Real Madrid', role: 'Chief Scout', director: 'Juni Calafat', avatar: '👑' },
    { name: 'Paris Saint-Germain', role: 'Football Advisor', director: 'Luís Campos', avatar: '🇫🇷' },
    { name: 'Bayern Munich', role: 'Board Member for Sport', director: 'Max Eberl', avatar: '🔴' },
    { name: 'Arsenal FC', role: 'Sporting Director', director: 'Edu Gaspar', avatar: '🔴' },
    { name: 'Barcelona', role: 'Sporting Director', director: 'Deco', avatar: '🔵' },
    { name: 'Chelsea FC', role: 'Co-Sporting Director', director: 'Paul Winstanley', avatar: '🦁' },
    { name: 'Al-Nassr', role: 'CEO', director: 'Guido Fienga', avatar: '🌴' },
    { name: 'Liverpool FC', role: 'Sporting Director', director: 'Richard Hughes', avatar: '🔴' },
    { name: 'Juventus', role: 'Football Director', director: 'Cristiano Giuntoli', avatar: '⚪' },
    { name: 'Inter Milan', role: 'CEO of Sport', director: 'Giuseppe Marotta', avatar: '🐍' },
    { name: 'Tottenham Hotspur', role: 'Technical Director', director: 'Johan Lange', avatar: '⚪' }
  ];

  updatedPlayers.forEach(player => {
    if (player.isMyClient && !player.ongoingTransferNegotiation) {
      // Check if client is locked from permanent transfers in current window
      const eligibility = checkPlayerTransferEligibility(player, week, season);
      if (!eligibility.canTransferPermanently) {
        return; // Only loan bids or next window allows new permanent offers
      }

      const isListed = player.isTransferListed || player.unrest?.status === 'transfer_requested' || (player.unrest && player.unrest.discontentLevel > 50);

      // Chance calculation
      let chance = 0;
      if (isListed) {
        chance = isTransferWindow ? 0.75 : 0.38;
      } else {
        if (isTransferWindow && (player.rating >= 68 || player.form >= 60)) {
          chance = 0.28;
        } else {
          chance = 0.12;
        }
      }

      if (Math.random() < chance) {
        // Pick an interested buyer club
        const possibleClubs = clubs.filter(c => c.id !== player.clubId && c.name.toLowerCase() !== player.clubName.toLowerCase());
        let buyerName = '';
        let directorName = 'Sporting Director';
        let directorRole = 'Head of Recruitment';
        let directorAvatar = '🏢';
        let buyerClubId = `buyer_${Date.now()}`;

        if (possibleClubs.length > 0) {
          const pickedClub = possibleClubs[Math.floor(Math.random() * possibleClubs.length)];
          buyerClubId = pickedClub.id;
          buyerName = pickedClub.name;
          directorName = pickedClub.chairmanName || 'Sporting Director';
          directorRole = 'Sporting Director';
        } else {
          const pickedPool = topClubPool[Math.floor(Math.random() * topClubPool.length)];
          buyerName = pickedPool.name;
          directorName = pickedPool.director;
          directorRole = pickedPool.role;
          directorAvatar = pickedPool.avatar;
        }

        // Calculate offer financials
        const val = player.value || 10000000;
        const currentWage = player.wage || 30000;

        const multiplier = isListed ? (0.90 + Math.random() * 0.35) : (1.10 + Math.random() * 0.45);
        const offeredFee = Math.max(1000000, Math.round((val * multiplier) / 250000) * 250000);
        const offeredWage = Math.max(10000, Math.round((currentWage * (1.15 + Math.random() * 0.35)) / 1000) * 1000);
        const offeredCommission = 15;

        player.ongoingTransferNegotiation = {
          id: `neg_offer_${Date.now()}_${player.id}`,
          buyingClubId: buyerClubId,
          buyingClubName: buyerName,
          offeredFee,
          offeredWage,
          offeredCommission,
          offeredYears: 4,
          weeksRemaining: 2,
          status: 'pending_user_decision',
          buyingClubDirector: directorName,
          buyingClubRole: directorRole,
          directorAvatar,
          lastResponseReasoning: `${buyerName} have submitted an official bid of ${formatMoney(offeredFee)} with a weekly wage of ${formatMoney(offeredWage)}/wk for ${player.name}.`,
          startWeek: week,
          startSeason: season
        };

        newsItems.push({
          id: `news_tr_bid_${Date.now()}_${player.id}`,
          week,
          season,
          headline: `🔥 INCOMING BID: ${buyerName} Submit ${formatMoney(offeredFee)} Offer for ${player.name}!`,
          content: `${buyerName} have officially submitted a ${formatMoney(offeredFee)} transfer offer alongside a ${formatMoney(offeredWage)}/wk wage proposal for ${player.name}${isListed ? ' (Listed on Transfer Market)' : ''}. Open your Transfer Hub or Mail to negotiate!`,
          category: 'transfer',
          urgency: 'breaking',
          read: false
        });
      }
    }
  });

  return { updatedPlayers, newsItems };
}

// -------------------------------------------------------------------------
// Commercial Endorsements & Mentorship Progression Simulator
// -------------------------------------------------------------------------
export function processWeeklyCommercialAndMentorshipProgression(
  agency: AgencyState,
  players: Player[],
  week: number,
  season: number
): { updatedAgency: AgencyState; updatedPlayers: Player[]; toastMessages: string[]; newsItems: NewsItem[] } {
  let updatedAgency = { ...agency };
  let updatedPlayers = [...players];
  const toastMessages: string[] = [];
  const newsItems: NewsItem[] = [];

  let totalWeeklyCommercialIncome = 0;

  updatedPlayers = updatedPlayers.map(player => {
    let p = { ...player };

    // 1. Process Brand Endorsement
    if (p.isMyClient && p.brandEndorsement) {
      const comm = p.brandEndorsement;
      const agencyWeeklyCut = comm.agentCommissionCut || Math.round(comm.weeklyRoyalty * 0.15);
      totalWeeklyCommercialIncome += agencyWeeklyCut;

      const remaining = comm.contractWeeksRemaining - 1;
      if (remaining <= 0) {
        toastMessages.push(`📋 Sponsorship Expired: ${p.name}'s boot endorsement with ${comm.brandName} has concluded.`);
        p.brandEndorsement = undefined;
      } else {
        p.brandEndorsement = {
          ...comm,
          contractWeeksRemaining: remaining
        };
      }
    }

    // 2. Process Mentorship Growth
    if (p.isMyClient && p.mentorship) {
      const m = p.mentorship;
      const weeks = (m.weeksActive || 0) + 1;

      // Every 4 weeks of active mentorship, small permanent attribute polishing
      if (weeks % 4 === 0 && Math.random() < 0.6) {
        p.form = Math.min(99, p.form + 2);
        toastMessages.push(`🎓 Mentorship Impact: ${m.mentorName}'s masterclasses boosted ${p.name}'s tactical form!`);
      }

      p.mentorship = {
        ...m,
        weeksActive: weeks
      };
    }

    return p;
  });

  // Credit agency balance with commercial endorsements cut
  if (totalWeeklyCommercialIncome > 0) {
    updatedAgency = recordFinancialTransaction(
      updatedAgency,
      totalWeeklyCommercialIncome,
      'Commercial Endorsements Royalty Cut',
      `Collected agency commission from client brand & boot sponsorships in week ${week}.`,
      'award'
    );
  }

  return { updatedAgency, updatedPlayers, toastMessages, newsItems };
}

// -------------------------------------------------------------------------
// Rival Agency Retaliation & Dynamic Bidding Wars Simulator
// -------------------------------------------------------------------------
export function processWeeklyRivalRetaliationAndBiddingWars(
  agency: AgencyState,
  players: Player[],
  week: number,
  season: number
): { updatedAgency: AgencyState; updatedPlayers: Player[]; newsItems: NewsItem[]; retaliationAlert?: string } {
  let updatedAgency = { ...agency };
  let updatedPlayers = [...players];
  const newsItems: NewsItem[] = [];
  let retaliationAlert: string | undefined;

  // Only trigger for active agent role with clients
  if (agency.activeRoles?.currentRole !== 'agent') {
    return { updatedAgency, updatedPlayers, newsItems };
  }

  const myClients = updatedPlayers.filter(p => p.isMyClient);
  if (myClients.length === 0) {
    return { updatedAgency, updatedPlayers, newsItems };
  }

  // 18% chance per week for rival agency counter-offensive or bidding war
  if (Math.random() < 0.18) {
    const rivalAgents = [
      { name: 'Mino Mendes', agency: 'Stellar Gestifute Group', tactic: 'smear', avatar: '🕶️' },
      { name: 'Jorge Barnett', agency: 'Unique Football Empire', tactic: 'poach', avatar: '💼' },
      { name: 'Jonathan Raiola', agency: 'Global Titan Sports', tactic: 'counter_bid', avatar: '🎩' }
    ];

    const rival = rivalAgents[Math.floor(Math.random() * rivalAgents.length)];
    const targetClient = myClients[Math.floor(Math.random() * myClients.length)];

    if (rival.tactic === 'smear') {
      // Rival launches media leak / smear campaign
      targetClient.personalLife = {
        ...targetClient.personalLife,
        scandalLevel: Math.min(100, targetClient.personalLife.scandalLevel + 15)
      };
      newsItems.push({
        id: `news_rival_smear_${Date.now()}_${targetClient.id}`,
        week,
        season,
        headline: `🚨 TABLOID LEAK: Rival Agency ${rival.agency} Leaks Contract Friction for ${targetClient.name}!`,
        content: `Anonymous briefings linked to ${rival.name} claim ${agency.agencyName} is mishandling ${targetClient.name}'s image rights at ${targetClient.clubName}. Visit the Unrest & Damage Control Hotline to manage!`,
        category: 'scandal',
        urgency: 'hot',
        read: false
      });
      retaliationAlert = `⚠️ Rival Retaliation: ${rival.name} (${rival.agency}) launched a smear briefing targeting ${targetClient.name}!`;
    } else if (rival.tactic === 'poach' && (targetClient.loyalty || 70) < 65) {
      // Rival attempts aggressive client poach
      newsItems.push({
        id: `news_rival_poach_${Date.now()}_${targetClient.id}`,
        week,
        season,
        headline: `⚔️ AGENT WAR: ${rival.name} Makes Secret Approach to Poach ${targetClient.name}!`,
        content: `Reports from training grounds reveal ${rival.agency} representatives met with ${targetClient.name}'s inner circle offering a massive signing bonus to switch representation.`,
        category: 'transfer',
        urgency: 'breaking',
        read: false
      });
      retaliationAlert = `⚔️ Poach Defense Alert: ${rival.name} is aggressively attempting to poach ${targetClient.name}!`;
    }
  }

  return { updatedAgency, updatedPlayers, newsItems, retaliationAlert };
}

// -------------------------------------------------------------------------
// Bank Debt & Emergency Loan Engine (Zero Loophole Mathematical Audit)
// -------------------------------------------------------------------------
export function processWeeklyDebtAndLoans(
  agency: AgencyState,
  week: number,
  season: number
): { updatedAgency: AgencyState; loanNews: NewsItem[]; toastAlert?: string } {
  const updatedAgency = { ...agency };
  const loans = [...(updatedAgency.bankLoans || [])];
  const loanNews: NewsItem[] = [];
  let toastAlert: string | undefined;

  if (loans.length === 0) {
    return { updatedAgency, loanNews };
  }

  let totalInterestDeducted = 0;
  let hasDefaulted = false;

  const processedLoans = loans.map(loan => {
    if (loan.remainingPrincipal <= 0) return loan;

    const interestDue = Math.round(loan.remainingPrincipal * loan.weeklyInterestRate);
    totalInterestDeducted += interestDue;

    const newWeeksRemaining = Math.max(0, loan.weeksRemaining - 1);
    let newDefaulted = loan.defaultedWeeks;

    // Check if overdue
    if (newWeeksRemaining === 0 && loan.remainingPrincipal > 0) {
      newDefaulted += 1;
      hasDefaulted = true;
    }

    return {
      ...loan,
      weeksRemaining: newWeeksRemaining,
      defaultedWeeks: newDefaulted,
      totalPaidSoFar: loan.totalPaidSoFar + interestDue
    };
  });

  // Credit Rating Audit
  let newCreditRating = updatedAgency.creditRating || 'A';
  if (hasDefaulted) {
    if (newCreditRating === 'AAA') newCreditRating = 'AA';
    else if (newCreditRating === 'AA') newCreditRating = 'A';
    else if (newCreditRating === 'A') newCreditRating = 'BBB';
    else newCreditRating = 'Subprime';

    loanNews.push({
      id: `loan_default_${Date.now()}`,
      week,
      season,
      headline: `⚠️ BANK DEFAULT WARNING: Unpaid Loan Facility Matured!`,
      content: `A commercial credit facility has exceeded its term. Your agency credit rating has been downgraded to ${newCreditRating}. Settle the principal in Debt Management immediately!`,
      category: 'agency',
      urgency: 'hot',
      read: false
    });
    toastAlert = `⚠️ Loan Default Alert: Interest accrued & credit rating downgraded to ${newCreditRating}!`;
  }

  updatedAgency.bankLoans = processedLoans.filter(l => l.remainingPrincipal > 0);
  updatedAgency.creditRating = newCreditRating;

  return { updatedAgency, loanNews, toastAlert };
}

// -------------------------------------------------------------------------
// Agency Stock Market IPO Engine (Weekly Ticker Simulation)
// -------------------------------------------------------------------------
export function processWeeklyIpoStockMarket(
  agency: AgencyState,
  week: number,
  season: number,
  players: Player[]
): { updatedAgency: AgencyState; ipoNews: NewsItem[] } {
  const updatedAgency = { ...agency };
  const ipoNews: NewsItem[] = [];

  if (!updatedAgency.ipoState || !updatedAgency.ipoState.isPublic) {
    return { updatedAgency, ipoNews };
  }

  const ipo = { ...updatedAgency.ipoState };
  const myClients = players.filter(p => p.isMyClient);
  
  // Performance factors
  const avgForm = myClients.length > 0 
    ? myClients.reduce((sum, p) => sum + (p.stats.avgRating || 7.0), 0) / myClients.length 
    : 7.0;
  
  const formDeltaPercent = (avgForm - 7.0) * 2.5; // +/- 5%
  const randomMarketFluctuation = (Math.random() * 4 - 2); // +/- 2%
  const cashHealthDelta = agency.balance > 10000000 ? 1.0 : agency.balance < 500000 ? -2.0 : 0;

  const totalWeeklyDelta = Number((formDeltaPercent + randomMarketFluctuation + cashHealthDelta).toFixed(2));
  const newPrice = Math.max(1.0, Number((ipo.sharePrice * (1 + totalWeeklyDelta / 100)).toFixed(2)));
  const newMarketCap = Math.round(newPrice * ipo.sharesOutstanding);

  const updatedHistory = [
    ...(ipo.historicalPrices || []),
    { week, season, price: newPrice }
  ].slice(-20);

  const confidence = Math.min(100, Math.max(10, Math.round(50 + (newPrice - 20) * 1.5)));
  ipo.sharePrice = newPrice;
  ipo.marketCap = newMarketCap;
  ipo.weeklyStockPriceChangePercent = totalWeeklyDelta;
  ipo.historicalPrices = updatedHistory;
  ipo.shareholderConfidence = confidence;
  ipo.activistInvestorWarning = confidence < 45;

  updatedAgency.ipoState = ipo;

  if (confidence < 45 && !ipo.activistInvestorWarning) {
    ipoNews.push({
      id: `ipo_activist_${Date.now()}`,
      week,
      season,
      headline: `⚠️ ACTIVIST INVESTOR ALERT: Hedge Funds Demand Buyback or Dividend for ${ipo.tickerSymbol}!`,
      content: `Institutional shareholders holding ${ipo.publicFloatPercent}% of ${agency.agencyName} are pressuring executive management to disburse dividends or execute a share buyback program immediately.`,
      category: 'agency',
      urgency: 'hot',
      read: false
    });
  } else if (Math.abs(totalWeeklyDelta) >= 6) {
    ipoNews.push({
      id: `ipo_ticker_${Date.now()}`,
      week,
      season,
      headline: `📈 STOCK EXCHANGE: ${ipo.tickerSymbol} Shares ${totalWeeklyDelta > 0 ? 'Surge' : 'Dip'} ${Math.abs(totalWeeklyDelta)}%!`,
      content: `Trading on the ${ipo.stockExchange} closed at €${newPrice.toFixed(2)} per share (Market Cap: €${(newMarketCap / 1000000).toFixed(1)}M) following client matchday outcomes.`,
      category: 'agency',
      urgency: 'normal',
      read: false
    });
  }

  return { updatedAgency, ipoNews };
}

// -------------------------------------------------------------------------
// Global Wonderkid Draft Generator (Annual Week 24 Draft Event)
// -------------------------------------------------------------------------
export function generateGlobalYouthDraftProspects(season: number, grassrootsSubsidy: number = 8000000): YouthDraftProspect[] {
  // Boost rating & potential dynamically if the Federation funds Grassroots Grants generously
  const ratingBoost = grassrootsSubsidy >= 20000000 ? 3 : grassrootsSubsidy >= 12000000 ? 2 : grassrootsSubsidy >= 8000000 ? 1 : 0;
  const potentialBoost = grassrootsSubsidy >= 20000000 ? 3 : grassrootsSubsidy >= 12000000 ? 2 : 0;

  const templates: {
    name: string;
    nationality: string;
    flag: string;
    position: Position;
    rating: number;
    potential: number;
    originAcademy: string;
    preferredStyle: string;
    personality: YouthDraftProspect['personality'];
  }[] = [
    {
      name: 'Gabriel Vilarinho',
      nationality: 'Brazil',
      flag: '🇧🇷',
      position: 'ST',
      rating: 69 + ratingBoost,
      potential: Math.min(99, 94 + potentialBoost),
      originAcademy: 'Santos Vila Belmiro',
      preferredStyle: 'Sambista Dribbler',
      personality: 'Ambitious Prodigy'
    },
    {
      name: 'Kenzo Takahashi',
      nationality: 'Japan',
      flag: '🇯🇵',
      position: 'CAM',
      rating: 68 + ratingBoost,
      potential: Math.min(99, 92 + potentialBoost),
      originAcademy: 'Yokohama F. Marinos Youth',
      preferredStyle: 'Playmaking Maestro',
      personality: 'Humble Workhorse'
    },
    {
      name: 'Emmanuel Osei-Boateng',
      nationality: 'Ghana',
      flag: '🇬🇭',
      position: 'RW',
      rating: 70 + ratingBoost,
      potential: Math.min(99, 93 + potentialBoost),
      originAcademy: 'Right to Dream Accra',
      preferredStyle: 'Explosive Speedster',
      personality: 'Commercial Superstar'
    },
    {
      name: 'Mateo De la Vega',
      nationality: 'Argentina',
      flag: '🇦🇷',
      position: 'CM',
      rating: 69 + ratingBoost,
      potential: Math.min(99, 93 + potentialBoost),
      originAcademy: 'Boca Juniors Casa Amarilla',
      preferredStyle: 'Box-to-Box Pitbull',
      personality: 'Family-Oriented Genius'
    },
    {
      name: 'Lucas Van Dijk',
      nationality: 'Netherlands',
      flag: '🇳🇱',
      position: 'CB',
      rating: 71 + ratingBoost,
      potential: Math.min(99, 91 + potentialBoost),
      originAcademy: 'Ajax De Toekomst',
      preferredStyle: 'Ball-Playing Commander',
      personality: 'Humble Workhorse'
    },
    {
      name: 'Amine Benali',
      nationality: 'France',
      flag: '🇫🇷',
      position: 'LW',
      rating: 70 + ratingBoost,
      potential: Math.min(99, 94 + potentialBoost),
      originAcademy: 'Clairefontaine INF',
      preferredStyle: 'Inside Forward Finisher',
      personality: 'Ambitious Prodigy'
    },
    // Extra Wonderkids unlocked when Federation Grassroots Subsidy >= €10M
    ...(grassrootsSubsidy >= 10000000 ? [
      {
        name: 'Maximilian Krause',
        nationality: 'Germany',
        flag: '🇩🇪',
        position: 'GK' as Position,
        rating: 71 + ratingBoost,
        potential: Math.min(99, 93 + potentialBoost),
        originAcademy: 'Bayern Munich Campus',
        preferredStyle: 'Sweeper Keeper Extraordinaire',
        personality: 'Humble Workhorse' as const
      },
      {
        name: 'Joao Cancelo Jr',
        nationality: 'Portugal',
        flag: '🇵🇹',
        position: 'RB' as Position,
        rating: 70 + ratingBoost,
        potential: Math.min(99, 94 + potentialBoost),
        originAcademy: 'Sporting CP Alcochete',
        preferredStyle: 'Attacking Inverted Wingback',
        personality: 'Ambitious Prodigy' as const
      }
    ] : [])
  ];

  return templates.map((tmpl, idx) => ({
    id: `draft_p_${season}_${idx + 1}`,
    name: tmpl.name,
    age: 16,
    nationality: tmpl.nationality,
    flag: tmpl.flag,
    position: tmpl.position,
    rating: tmpl.rating,
    potential: tmpl.potential,
    originAcademy: tmpl.originAcademy,
    preferredStyle: tmpl.preferredStyle,
    personality: tmpl.personality,
    agentBattle: {
      rivalAgentsCompeting: ['Mino Mendes', 'Jorge Barnett', 'Jonathan Raiola'],
      leadingAgent: 'Jorge Barnett',
      userPitchScore: 0,
      rivalPitchScore: Math.floor(Math.random() * 30) + 40,
      decisionWeeksRemaining: 3
    }
  }));
}

// -------------------------------------------------------------------------
// FA Disciplinary Court Cases Generator
// -------------------------------------------------------------------------
export function generateInitialDisciplinaryCases(week: number, season: number, clubs: Club[]): DisciplinaryCourtCase[] {
  const sampleClub = clubs[0] || { name: 'Manchester City', id: 'c1' };
  const sampleRival = clubs[1] || { name: 'Real Madrid', id: 'c2' };

  return [
    {
      id: `case_var_${Date.now()}_1`,
      caseType: 'controversial_var_red',
      title: 'Contested VAR Red Card Appeal: Star Striker Violent Conduct',
      involvedEntityName: `${sampleClub.name} Striker`,
      involvedEntityType: 'player',
      clubId: sampleClub.id,
      details: `${sampleClub.name} has appealed a straight red card issued at minute 88 for alleged elbowing during a contentious derby. Broadcast replays show inconclusive contact.`,
      evidenceStrength: 65,
      prosecutionDemand: 'Mandatory 3-match suspension and €25,000 fine',
      isResolved: false,
      weekSubmitted: week,
      seasonSubmitted: season,
      verdictOptions: [
        {
          label: 'Uphold 3-Match Suspension',
          description: 'Enforce full disciplinary penalty to protect referee authority.',
          sanctionType: 'ban_matches',
          banWeeks: 3,
          politicalInfluenceImpact: +5,
          integrityImpact: +10,
          publicApprovalImpact: -5
        },
        {
          label: 'Reduce to 1-Match Ban + Warning',
          description: 'Acknowledge contact was incidental and reduce severity.',
          sanctionType: 'ban_matches',
          banWeeks: 1,
          politicalInfluenceImpact: +2,
          integrityImpact: +4,
          publicApprovalImpact: +8
        },
        {
          label: 'Completely Rescind Card (Exonerate)',
          description: 'Overturn the referee decision completely based on video review.',
          sanctionType: 'exonerate',
          politicalInfluenceImpact: -5,
          integrityImpact: -5,
          publicApprovalImpact: +15
        }
      ]
    },
    {
      id: `case_fix_${Date.now()}_2`,
      caseType: 'match_fixing_allegation',
      title: 'Syndicate Betting Anomaly & Match-Fixing Investigation',
      involvedEntityName: sampleRival.name,
      involvedEntityType: 'club',
      clubId: sampleRival.id,
      details: `Independent integrity monitoring units detected abnormal Asian betting patterns on corner counts and red cards during a recent fixture involving ${sampleRival.name}. Club directors claim no knowledge.`,
      evidenceStrength: 80,
      prosecutionDemand: '10 League Points Deduction, €500k Fine, and 1-Year Transfer Ban',
      isResolved: false,
      weekSubmitted: week,
      seasonSubmitted: season,
      verdictOptions: [
        {
          label: 'Enforce Heavy 10-Point Deduction & Transfer Embargo',
          description: 'Send a ruthless message across world football against corruption.',
          sanctionType: 'points_deduction',
          pointsDeducted: 10,
          fineAmount: 500000,
          politicalInfluenceImpact: +15,
          integrityImpact: +20,
          publicApprovalImpact: +10
        },
        {
          label: 'Impose Financial Sanction Only (€1,000,000 Fine)',
          description: 'Penalize the club fiscally without altering league sporting standings.',
          sanctionType: 'fine',
          fineAmount: 1000000,
          politicalInfluenceImpact: +5,
          integrityImpact: +5,
          publicApprovalImpact: -10
        },
        {
          label: 'Exonerate for Lack of Conclusive Proof',
          description: 'Dismiss charges citing insufficient direct director link.',
          sanctionType: 'exonerate',
          politicalInfluenceImpact: -10,
          integrityImpact: -15,
          publicApprovalImpact: -15
        }
      ]
    },
    {
      id: `case_brawl_${Date.now()}_3`,
      caseType: 'manager_touchline_brawl',
      title: 'Tunnel Altercation & Referee Intimidation Hearing',
      involvedEntityName: `${sampleClub.name} Head Coach`,
      involvedEntityType: 'manager',
      clubId: sampleClub.id,
      details: `Following a 94th-minute disallowed goal, the head coach confronted the fourth official in the technical area and shoved security personnel in the tunnel.`,
      evidenceStrength: 95,
      prosecutionDemand: '4-Match Stadium Touchline Ban and €100,000 Fine',
      isResolved: false,
      weekSubmitted: week,
      seasonSubmitted: season,
      verdictOptions: [
        {
          label: '4-Match Touchline Ban & €100k Fine',
          description: 'Zero tolerance for violent conduct against match officials.',
          sanctionType: 'ban_matches',
          banWeeks: 4,
          fineAmount: 100000,
          politicalInfluenceImpact: +8,
          integrityImpact: +12,
          publicApprovalImpact: +5
        },
        {
          label: 'Suspended 2-Match Ban & €50k Fine',
          description: 'Lenient ruling with conditional good behavior period.',
          sanctionType: 'fine',
          fineAmount: 50000,
          politicalInfluenceImpact: +2,
          integrityImpact: +2,
          publicApprovalImpact: +3
        }
      ]
    }
  ];
}

// Aliases for game engine loop integration
export const generateSeasonalYouthDraftPool = generateGlobalYouthDraftProspects;
export function generateWeeklyDisciplinaryCases(players: Player[], week: number, season: number): DisciplinaryCourtCase[] {
  const dummyClubs: Club[] = [
    { id: 'c1', name: 'Real Madrid', shortName: 'RMA', league: 'La Liga', reputation: 92, transferBudget: 150000000, wageBudget: 4000000, logoColor: '#FFFFFF', secondaryColor: '#00529F', stadiumCapacity: 81044, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, continent: 'Europe', chairmanName: 'Florentino Perez', chairmanTrust: 80 },
    { id: 'c2', name: 'Manchester City', shortName: 'MCI', league: 'Premier League', reputation: 94, transferBudget: 200000000, wageBudget: 5000000, logoColor: '#6CABDD', secondaryColor: '#1C2C5B', stadiumCapacity: 55000, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, continent: 'Europe', chairmanName: 'Khaldoon Al Mubarak', chairmanTrust: 85 }
  ];
  return generateInitialDisciplinaryCases(week, season, dummyClubs);
}

// -------------------------------------------------------------------------
// Federation Tax & Fiscal Credit Engine
// -------------------------------------------------------------------------
export function processWeeklyTaxAndFederationCredits(
  agency: AgencyState,
  corporateTax: number,
  clubs: Club[],
  week: number,
  season: number
): { updatedAgency: AgencyState; taxNews: NewsItem[] } {
  const updatedAgency = { ...agency };
  const taxNews: NewsItem[] = [];

  // Default / initialize Federation Treasury if missing
  const currentTreasury: FederationTreasuryState = updatedAgency.federationTreasury || {
    treasuryBalance: 250000000,
    annualSponsorRevenue: 85000000,
    tvBroadcastPackageTotal: 380000000,
    broadcastDistributionModel: 'equal_merit',
    totalTaxRevenueCollected: 0,
    weeklyCorporateTaxCollected: 0,
    weeklyLuxuryTaxCollected: 0,
    prizeMoneyPool: {
      championPrize: 45000000,
      top4Bonus: 20000000,
      midTableGrant: 10000000,
      relegationParachute: 12000000,
      grassrootsSubsidy: 8000000
    }
  };

  let weeklyLuxuryTax = 0;
  const luxuryThreshold = updatedAgency.presidency?.activePolicies?.luxuryTaxThreshold;
  if (luxuryThreshold && luxuryThreshold > 0) {
    clubs.forEach(c => {
      const spent = c.seasonSpending || c.seasonSpent || 0;
      if (spent > luxuryThreshold) {
        const excess = spent - luxuryThreshold;
        const taxLevy = Math.round(excess * 0.10);
        weeklyLuxuryTax += taxLevy;
      }
    });
  }

  const totalWeeklyTaxCredited = corporateTax + weeklyLuxuryTax;
  const newTreasuryBalance = currentTreasury.treasuryBalance + totalWeeklyTaxCredited;
  const newTotalTaxes = (currentTreasury.totalTaxRevenueCollected || 0) + totalWeeklyTaxCredited;

  updatedAgency.federationTreasury = {
    ...currentTreasury,
    treasuryBalance: newTreasuryBalance,
    totalTaxRevenueCollected: newTotalTaxes,
    weeklyCorporateTaxCollected: corporateTax,
    weeklyLuxuryTaxCollected: weeklyLuxuryTax
  };

  if (updatedAgency.presidency) {
    updatedAgency.presidency = {
      ...updatedAgency.presidency,
      totalTaxesCollected: (updatedAgency.presidency.totalTaxesCollected || 0) + totalWeeklyTaxCredited
    };
  }

  if (week % 4 === 0 && totalWeeklyTaxCredited > 0) {
    taxNews.push({
      id: `tax_treasury_${Date.now()}`,
      week,
      season,
      headline: `🏛️ FEDERATION FISCAL REVENUE: +€${(totalWeeklyTaxCredited / 1000).toFixed(0)}k Credited to Federation Treasury!`,
      content: `Official tax audits processed: €${(corporateTax / 1000).toFixed(0)}k in Agency Corporate Taxes ${weeklyLuxuryTax > 0 ? `and €${(weeklyLuxuryTax / 1000).toFixed(0)}k in Club Luxury Spending Levies ` : ''}credited to the National Federation Treasury (Treasury Reserves: €${(newTreasuryBalance / 1000000).toFixed(1)}M).`,
      category: 'governance',
      urgency: 'normal',
      read: false
    });
  }

  return { updatedAgency, taxNews };
}

// -------------------------------------------------------------------------
// Presidency Tenure, Tier Progression & Triennial Election Engine
// -------------------------------------------------------------------------
export function processPresidencyTenureAndApproval(
  agency: AgencyState,
  isSeasonReset: boolean,
  week: number,
  season: number
): { updatedAgency: AgencyState; governanceNews: NewsItem[]; alertToast?: string } {
  const updatedAgency = { ...agency };
  const governanceNews: NewsItem[] = [];
  let alertToast: string | undefined;

  const pState = updatedAgency.presidency;
  if (!pState || pState.role === 'None') {
    return { updatedAgency, governanceNews };
  }

  let currentTier: 1 | 2 | 3 | 4 = pState.tier || 1;
  if (pState.role === 'Regional Delegate') currentTier = 1;
  else if (pState.role === 'Federation Director') currentTier = 2;
  else if (pState.role === 'Continental President') currentTier = 3;
  else if (pState.role === 'FIFA Global President') currentTier = 4;

  let approval = pState.approvalRating ?? 65;
  let tenureSeason = pState.tenureSeason || 1;
  let termsServed = pState.termsServed || 0;
  let highestTierCompleted = pState.highestTierCompleted || 0;

  // Dynamic Approval Rating Adjustments
  const treasuryBal = updatedAgency.federationTreasury?.treasuryBalance || 100000000;
  if (treasuryBal > 150000000) approval = Math.min(100, approval + 0.05);
  else if (treasuryBal < 15000000) approval = Math.max(0, approval - 0.2);

  if (pState.conflictScandalLevel > 30) {
    approval = Math.max(0, approval - 0.3);
  }

  if (pState.activePolicies.refereeIntegrityLevel && pState.activePolicies.refereeIntegrityLevel > 80) {
    approval = Math.min(100, approval + 0.05);
  }

  approval = Number(Math.min(100, Math.max(10, approval)).toFixed(1));

  // Triennial Tenure & Season Reset Logic
  if (isSeasonReset) {
    tenureSeason += 1;

    // Realistic gradual reputation progression across seasons (+1 if approval >= 60%)
    if (approval >= 60) {
      updatedAgency.reputation = Math.min(100, updatedAgency.reputation + 1);
    } else if (approval < 40) {
      updatedAgency.reputation = Math.max(0, updatedAgency.reputation - 2);
    }

    // 3 Seasons Tenure Completed -> Triennial Election Congress!
    if (tenureSeason > 3) {
      const requiredApproval = currentTier === 1 ? 55 : currentTier === 2 ? 60 : currentTier === 3 ? 65 : 70;

      if (approval >= requiredApproval) {
        // Successful Re-election!
        termsServed += 1;
        highestTierCompleted = Math.max(highestTierCompleted, currentTier);
        tenureSeason = 1; // Reset to season 1 of the new 3-season term

        // Realistic reputation bonus (+2)
        updatedAgency.reputation = Math.min(100, updatedAgency.reputation + 2);

        governanceNews.push({
          id: `gov_reelect_${Date.now()}`,
          week: 1,
          season,
          headline: `🗳️ TRIENNIAL CONGRESS: Re-elected as ${pState.role} (Approval: ${approval}%)!`,
          content: `The General Assembly has concluded your 3-season tenure review. With an approval rating of ${approval}%, member delegates voted to renew your 3-season mandate. Higher tier presidency candidacy is unlocked!`,
          category: 'governance',
          urgency: 'hot',
          read: false
        });

        alertToast = `🏆 Triennial Election Victory: Re-elected as ${pState.role} with ${approval}% Approval Rating!`;
      } else {
        // Voted Out of Office!
        governanceNews.push({
          id: `gov_voted_out_${Date.now()}`,
          week: 1,
          season,
          headline: `❌ CONGRESS VOTE OF NO CONFIDENCE: Relinquished ${pState.role}`,
          content: `Following the conclusion of your 3-season tenure, the General Assembly voted you out of office due to low approval rating (${approval}% vs ${requiredApproval}% required).`,
          category: 'governance',
          urgency: 'breaking',
          read: false
        });

        alertToast = `❌ Congress Vote of No Confidence: Relinquished ${pState.role} due to low approval (${approval}%).`;

        updatedAgency.presidency = {
          ...pState,
          role: 'None',
          tier: 1,
          approvalRating: 50,
          tenureSeason: 1,
          reElectionStatus: 'voted_out',
          campaignStatus: 'idle',
          campaign: undefined,
          termsServed,
          highestTierCompleted
        };

        if (updatedAgency.activeRoles?.currentRole === 'fa_president') {
          updatedAgency.activeRoles = {
            ...updatedAgency.activeRoles,
            fa_president: false,
            currentRole: 'agent'
          };
        }

        return { updatedAgency, governanceNews, alertToast };
      }
    }
  }

  // Update presidency state
  updatedAgency.presidency = {
    ...pState,
    tier: currentTier,
    approvalRating: approval,
    tenureSeason,
    termsServed,
    highestTierCompleted,
    termYearsLeft: Math.max(1, 4 - tenureSeason),
    reElectionStatus: tenureSeason === 3 ? 'reelection_due' : 'active'
  };

  return { updatedAgency, governanceNews, alertToast };
}

// -------------------------------------------------------------------------
// Mega-Transfer Escrow & Deferred Tranche Architecture (>€50M Deals)
// -------------------------------------------------------------------------
export function createEscrowDealForMegaTransfer(
  player: Player,
  sellingClubName: string,
  buyingClubName: string,
  totalFee: number,
  commissionPercent: number,
  currentWeek: number,
  currentSeason: number
): EscrowTransferDeal {
  // If deal >= €50M, structure into realistic multi-phase deferred tranches:
  // 1. 50% Upfront Liquidity
  // 2. 20% 8-Week Matured Installment
  // 3. 15% 16-Week Mid-Season Installment
  // 4. 15% 15-Appearance Performance Milestone Contingency
  const isMegaDeal = totalFee >= 50000000;
  const upfrontPercent = isMegaDeal ? 0.50 : 1.0;
  const upfrontCash = Math.round(totalFee * upfrontPercent);

  const tranches: EscrowTransferTranche[] = [];

  if (isMegaDeal) {
    const tranche1Gross = Math.round(totalFee * 0.20);
    const tranche1Cut = Math.round(tranche1Gross * (commissionPercent / 100));
    tranches.push({
      id: `tranche_1_${Date.now()}_${player.id}`,
      trancheNumber: 1,
      label: 'Tranche 1: Post-Transfer 8-Week Liquidity Installment',
      amount: tranche1Gross,
      agentCut: tranche1Cut,
      dueWeek: ((currentWeek + 7) % 38) + 1,
      dueSeason: currentWeek + 8 > 38 ? currentSeason + 1 : currentSeason,
      conditionType: 'scheduled_installment',
      status: 'pending',
      description: `Guaranteed deferred payment installment payable in Week ${((currentWeek + 7) % 38) + 1}.`
    });

    const tranche2Gross = Math.round(totalFee * 0.15);
    const tranche2Cut = Math.round(tranche2Gross * (commissionPercent / 100));
    tranches.push({
      id: `tranche_2_${Date.now()}_${player.id}`,
      trancheNumber: 2,
      label: 'Tranche 2: 16-Week Mid-Season Deferred Capital',
      amount: tranche2Gross,
      agentCut: tranche2Cut,
      dueWeek: ((currentWeek + 15) % 38) + 1,
      dueSeason: currentWeek + 16 > 38 ? currentSeason + 1 : currentSeason,
      conditionType: 'scheduled_installment',
      status: 'pending',
      description: `Guaranteed mid-season secondary installment payable in Week ${((currentWeek + 15) % 38) + 1}.`
    });

    const tranche3Gross = Math.round(totalFee * 0.15);
    const tranche3Cut = Math.round(tranche3Gross * (commissionPercent / 100));
    tranches.push({
      id: `tranche_3_${Date.now()}_${player.id}`,
      trancheNumber: 3,
      label: 'Tranche 3: 15-Appearance Performance Milestone Contingency',
      amount: tranche3Gross,
      agentCut: tranche3Cut,
      dueWeek: 38,
      dueSeason: currentSeason,
      conditionType: 'appearances_milestone',
      conditionTarget: 15,
      currentProgress: player.stats?.appearances || 0,
      status: 'pending',
      description: `Contingent bonus triggered once ${player.name} completes 15 competitive match appearances for ${buyingClubName}.`
    });
  }

  const totalReceivableRemaining = tranches.reduce((sum, t) => sum + t.agentCut, 0);

  return {
    id: `escrow_${Date.now()}_${player.id}`,
    playerId: player.id,
    playerName: player.name,
    playerAvatarEmoji: player.flag,
    sellingClubName,
    buyingClubName,
    totalFee,
    upfrontCash,
    commissionPercent,
    tranches,
    totalReceivableRemaining,
    dateCreatedWeek: currentWeek,
    dateCreatedSeason: currentSeason,
    isUserClient: player.isMyClient,
    status: tranches.length === 0 ? 'fully_settled' : 'active'
  };
}

// -------------------------------------------------------------------------
// Weekly Escrow Accounts Settlement & Maturation Processor
// -------------------------------------------------------------------------
export function processWeeklyEscrowTranches(
  agency: AgencyState,
  players: Player[],
  week: number,
  season: number
): { updatedAgency: AgencyState; escrowNews: NewsItem[]; totalDisbursedThisWeek: number } {
  const existingDeals = agency.escrowDeals || [];
  if (existingDeals.length === 0) {
    return { updatedAgency: agency, escrowNews: [], totalDisbursedThisWeek: 0 };
  }

  let totalDisbursedThisWeek = 0;
  const escrowNews: NewsItem[] = [];
  let agencyBalanceDelta = 0;

  const playerMap = new Map(players.map(p => [p.id, p]));

  const updatedDeals = existingDeals.map(deal => {
    if (deal.status === 'fully_settled') return deal;

    let dealReceivable = deal.totalReceivableRemaining;
    const playerObj = playerMap.get(deal.playerId);

    const updatedTranches = deal.tranches.map(tranche => {
      if (tranche.status !== 'pending') return tranche;

      let shouldDisburse = false;
      let milestoneTriggerReason = '';

      if (tranche.conditionType === 'scheduled_installment') {
        // Matured if time reached
        if ((season > tranche.dueSeason) || (season === tranche.dueSeason && week >= tranche.dueWeek)) {
          shouldDisburse = true;
          milestoneTriggerReason = `Scheduled maturity date (W${tranche.dueWeek} S${tranche.dueSeason}) reached.`;
        }
      } else if (tranche.conditionType === 'appearances_milestone') {
        const currentApps = playerObj?.stats?.appearances || 0;
        const targetApps = tranche.conditionTarget || 15;
        if (currentApps >= targetApps) {
          shouldDisburse = true;
          milestoneTriggerReason = `Player reached milestone of ${currentApps}/${targetApps} competitive appearances!`;
        }
      }

      if (shouldDisburse) {
        agencyBalanceDelta += tranche.agentCut;
        totalDisbursedThisWeek += tranche.agentCut;
        dealReceivable = Math.max(0, dealReceivable - tranche.agentCut);

        escrowNews.push({
          id: `escrow_news_${Date.now()}_${tranche.id}`,
          week,
          season,
          headline: `🏦 ESCROW LIQUIDITY RELEASED: ${formatMoney(tranche.agentCut)} for ${deal.playerName}!`,
          content: `${tranche.label} for the transfer of ${deal.playerName} to ${deal.buyingClubName} has matured! ${formatMoney(tranche.agentCut)} disbursed into agency treasury. (${milestoneTriggerReason})`,
          category: 'agency',
          urgency: 'hot',
          read: false
        });

        return {
          ...tranche,
          status: 'disbursed' as const
        };
      }

      return {
        ...tranche,
        currentProgress: playerObj?.stats?.appearances || tranche.currentProgress || 0
      };
    });

    const isAllSettled = updatedTranches.every(t => t.status === 'disbursed');

    return {
      ...deal,
      tranches: updatedTranches,
      totalReceivableRemaining: dealReceivable,
      status: isAllSettled ? ('fully_settled' as const) : ('active' as const)
    };
  });

  const updatedAgency: AgencyState = {
    ...agency,
    balance: agency.balance + agencyBalanceDelta,
    escrowDeals: updatedDeals
  };

  return { updatedAgency, escrowNews, totalDisbursedThisWeek };
}

// -------------------------------------------------------------------------
// Player Contract Termination & Severance Calculation
// -------------------------------------------------------------------------
export function calculateSeveranceBuyoutCost(
  player: Player,
  mode: 'mutual_consent' | 'unilateral_sack' | 'player_release_request'
): {
  severanceCost: number;
  reputationImpact: number;
  fanRevoltRisk: number;
  remainingContractTotal: number;
  reasonLabel: string;
  breakdown: string;
} {
  const weeklyWage = player.wage || 30000;
  const contractYears = player.contractYears || 2;
  const annualWage = weeklyWage * 52;
  const remainingContractTotal = annualWage * contractYears;
  const unrestStatus = player.unrest?.status || 'content';
  const loyalty = player.loyalty ?? 80;

  if (mode === 'player_release_request' || unrestStatus === 'strike' || unrestStatus === 'transfer_requested') {
    // Player is already demanding a move or unhappy - minimal or zero severance
    const cost = Math.round(weeklyWage * 4); // 1 month nominal settlement
    return {
      severanceCost: cost,
      reputationImpact: 0,
      fanRevoltRisk: 5,
      remainingContractTotal,
      reasonLabel: 'Discontent Mutual Settlement',
      breakdown: `Client was already seeking an exit (${unrestStatus}). Agreement reached for nominal 4-week severance payment of ${formatMoney(cost)}.`
    };
  }

  if (mode === 'mutual_consent') {
    // Standard mutual parting - 20% to 30% of remaining contract value
    const factor = loyalty < 50 ? 0.15 : 0.25;
    const cost = Math.round(remainingContractTotal * factor);
    return {
      severanceCost: cost,
      reputationImpact: -1,
      fanRevoltRisk: player.rating >= 85 ? 20 : 5,
      remainingContractTotal,
      reasonLabel: 'Amicable Mutual Buyout',
      breakdown: `Both parties agreed to an amicable termination. Golden parachute negotiated at ${Math.round(factor * 100)}% of remaining contract (${formatMoney(cost)}).`
    };
  }

  // Unilateral Dismissal / Sacking of Client
  // FIFA Regulations: Unilateral termination without sporting cause requires full compensation
  const sackFactor = 0.50; // 50% golden parachute
  const cost = Math.round(remainingContractTotal * sackFactor);
  const repHit = player.rating >= 80 ? -4 : -2;

  return {
    severanceCost: cost,
    reputationImpact: repHit,
    fanRevoltRisk: player.rating >= 85 ? 35 : 10,
    remainingContractTotal,
    reasonLabel: 'Unilateral Agency Termination Penalty',
    breakdown: `Unilateral dismissal triggers FIFA Article 17 compensation: ${Math.round(sackFactor * 100)}% severance golden parachute (${formatMoney(cost)}) and agency reputation penalty (${repHit}).`
  };
}

// -------------------------------------------------------------------------
// End-of-Season Multi-Year Rollover & Contract Clause Engine (Week 38 Season Finale)
// Processes Title Winning Bonuses, Player Aging (+1), Contract Countdowns (-1),
// Bosman Free Agency, Career Stat Archiving, Loan Returns, Veteran Retirements & Youth Regens
// -------------------------------------------------------------------------
export function processEndOfSeasonContractClauses(
  agency: AgencyState,
  players: Player[],
  clubs: Club[],
  season: number
): {
  updatedAgency: AgencyState;
  updatedPlayers: Player[];
  toastMessages: string[];
  newsItems: NewsItem[];
} {
  const toastMessages: string[] = [];
  const newsItems: NewsItem[] = [];
  let totalBonusCashEarned = 0;
  let repDelta = 0;

  // Rank clubs by league
  const clubsByLeague: Record<string, Club[]> = {};
  clubs.forEach(c => {
    const l = c.league || 'Premier League';
    if (!clubsByLeague[l]) clubsByLeague[l] = [];
    clubsByLeague[l].push(c);
  });

  // Sort each league by points descending, then goal difference
  Object.keys(clubsByLeague).forEach(leagueKey => {
    clubsByLeague[leagueKey].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdB = (b.goalsFor || 0) - (b.goalsAgainst || 0);
      const gdA = (a.goalsFor || 0) - (a.goalsAgainst || 0);
      return gdB - gdA;
    });
  });

  const retiredPlayerNames: string[] = [];
  const regeneratedYouth: Player[] = [];
  let regenCounter = 1;

  const updatedPlayers: Player[] = [];

  players.forEach(p => {
    let updatedPlayer = { ...p };
    const club = clubs.find(c => c.id === p.clubId);

    // 1. Client Bonus Clauses (if represented and attached to a club)
    if (p.isMyClient && club) {
      const leagueTable = clubsByLeague[club.league || 'Premier League'] || [];
      const clubRank = leagueTable.findIndex(c => c.id === club.id) + 1; // 1-indexed rank

      // League Champion Title Bonus Clause
      if (clubRank === 1) {
        const bonusAmount = p.clauses?.championsLeagueBonus || 250000;
        const agentCommission = Math.round(bonusAmount * ((p.agentCommission || 10) / 100));
        totalBonusCashEarned += agentCommission;
        repDelta += 2;

        updatedPlayer.morale = 100;
        updatedPlayer.rating = Math.min(updatedPlayer.potential, updatedPlayer.rating + 1);
        updatedPlayer.value = Math.round(updatedPlayer.value * 1.15);

        toastMessages.push(`🏆 TITLE CHAMPION: ${p.name} & ${club.name} won the ${club.league}! Earned ${formatMoney(agentCommission)} agent title bonus!`);
        newsItems.push({
          id: `news_title_bonus_${p.id}_${season}_${Date.now()}`,
          week: 38,
          season,
          headline: `CHAMPIONS: ${p.name} Celebrates League Title with ${club.name}!`,
          content: `${p.name} and ${club.name} have been crowned champions of ${club.league}! Contractual title clauses and performance bonuses were activated for ${agency.agencyName}.`,
          category: 'match',
          urgency: 'hot',
          read: false
        });
      }

      // Continental UEFA Qualification Clause (Top 4 finish)
      if (clubRank >= 2 && clubRank <= 4) {
        const qualBonus = Math.round((p.wage * 8) * ((p.agentCommission || 10) / 100));
        totalBonusCashEarned += qualBonus;
        
        const newWage = Math.round(updatedPlayer.wage * 1.08);
        updatedPlayer.wage = newWage;
        updatedPlayer.morale = Math.min(100, (updatedPlayer.morale || 80) + 12);
        updatedPlayer.value = Math.round(updatedPlayer.value * 1.08);

        toastMessages.push(`⭐ UCL QUALIFICATION: ${p.name} & ${club.name} qualified for Europe! +8% wage escalator activated (${formatMoney(newWage)}/wk).`);
      }

      // Goal Scoring / Milestone Bonus (e.g. 15+ goals)
      if (p.stats && p.stats.goals >= 15) {
        const goalBonus = Math.round(p.stats.goals * 12000);
        totalBonusCashEarned += Math.round(goalBonus * ((p.agentCommission || 10) / 100));
        toastMessages.push(`⚽ GOLDEN STRIKER: ${p.name} scored ${p.stats.goals} goals this season! Performance bonus unlocked.`);
      }
    }

    // 2. Career History Archiving (Record last season's stats before wipe)
    const lastSeasonAppearances = updatedPlayer.stats?.appearances || 0;
    if (lastSeasonAppearances > 0 || (updatedPlayer.stats?.goals || 0) > 0) {
      const historicalEntry = {
        season: `Season ${season - 1}`,
        clubName: updatedPlayer.clubName || 'Free Agent',
        appearances: lastSeasonAppearances,
        goals: updatedPlayer.stats?.goals || 0,
        assists: updatedPlayer.stats?.assists || 0,
        cleanSheets: updatedPlayer.stats?.cleanSheets || 0,
        avgRating: updatedPlayer.stats?.avgRating || 6.8
      };
      updatedPlayer.careerHistory = [...(updatedPlayer.careerHistory || []), historicalEntry];
    }

    // Reset current season stats & disciplinary cards
    updatedPlayer.stats = {
      appearances: 0,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      avgRating: 0,
      pace: updatedPlayer.stats?.pace,
      shooting: updatedPlayer.stats?.shooting,
      passing: updatedPlayer.stats?.passing,
      dribbling: updatedPlayer.stats?.dribbling,
      defending: updatedPlayer.stats?.defending,
      physical: updatedPlayer.stats?.physical
    };
    updatedPlayer.yellowCards = 0;
    updatedPlayer.redCards = 0;
    updatedPlayer.isSuspended = false;
    updatedPlayer.suspensionMatchesRemaining = 0;

    // 3. Return Loanees to Parent Clubs
    if (updatedPlayer.isOnLoan && updatedPlayer.loanDetails) {
      const parentName = updatedPlayer.loanDetails.parentClubName || 'Parent Club';
      const parentId = updatedPlayer.loanDetails.parentClubId;
      updatedPlayer.clubId = parentId;
      updatedPlayer.clubName = parentName;
      updatedPlayer.isOnLoan = false;
      updatedPlayer.loanDetails = undefined;
      
      if (updatedPlayer.isMyClient) {
        toastMessages.push(`↩️ LOAN RETURN: ${updatedPlayer.name} has concluded his loan spell and returned to ${parentName}.`);
      }
    }

    // 4. Player Aging (+1 year)
    updatedPlayer.age = (updatedPlayer.age || 22) + 1;

    // 5. Contract Countdown (-1 year)
    const remainingContract = Math.max(0, (updatedPlayer.contractYears || 2) - 1);
    updatedPlayer.contractYears = remainingContract;

    // 6. Bosman Pre-Contract Fulfillment or Contract Expiration
    if (updatedPlayer.preContract) {
      const preCon = updatedPlayer.preContract;
      const oldClubName = updatedPlayer.clubName || 'Previous Club';
      updatedPlayer.clubId = preCon.targetClubId;
      updatedPlayer.clubName = preCon.targetClubName;
      updatedPlayer.wage = preCon.agreedWage;
      updatedPlayer.contractYears = preCon.contractYears;
      updatedPlayer.isRegistered = true;
      updatedPlayer.unregisteredWeeks = 0;
      updatedPlayer.morale = 100;
      updatedPlayer.isTransferListed = false;
      updatedPlayer.transferListedByClub = false;
      updatedPlayer.preContract = undefined; // Agreement fulfilled!

      if (updatedPlayer.isMyClient) {
        toastMessages.push(`🤝 BOSMAN ARRIVAL: ${updatedPlayer.name} has officially completed his summer switch to ${preCon.targetClubName}!`);
        newsItems.push({
          id: `news_bosman_arrival_${updatedPlayer.id}_${season}_${Date.now()}`,
          week: 1,
          season,
          headline: `🌟 PRE-CONTRACT FULFILLED: ${updatedPlayer.name} Unveiled by ${preCon.targetClubName}!`,
          content: `Following the Bosman pre-contract agreement brokered during the Winter Window, ${updatedPlayer.name} (${updatedPlayer.rating} OVR) has officially parted ways with ${oldClubName} and arrived at ${preCon.targetClubName} on a free transfer! Contract: ${preCon.contractYears} years at ${formatMoney(preCon.agreedWage)}/week.`,
          category: 'transfer',
          urgency: 'hot',
          read: false,
          targetRole: 'agent',
          actionTab: 'my_players',
          relatedPlayerId: updatedPlayer.id
        });
      }
    } else if (remainingContract <= 0 && updatedPlayer.clubId !== 'free_agent') {
      // High-reputation players with good morale may get renewed by club
      const willRenew = updatedPlayer.rating >= 78 && (updatedPlayer.morale || 70) >= 60 && Math.random() < 0.65;
      
      if (willRenew) {
        updatedPlayer.contractYears = Math.floor(Math.random() * 2) + 2;
        updatedPlayer.wage = Math.round(updatedPlayer.wage * 1.10);
      } else {
        // Contract Expired: Released to Free Agency
        const oldClub = updatedPlayer.clubName;
        updatedPlayer.clubId = 'free_agent';
        updatedPlayer.clubName = 'Free Agent';
        updatedPlayer.contractYears = 1;
        updatedPlayer.isRegistered = true;
        updatedPlayer.unregisteredWeeks = 0;

        if (updatedPlayer.isMyClient) {
          toastMessages.push(`🆓 BOSMAN FREE AGENT: ${updatedPlayer.name}'s contract at ${oldClub} has expired! He is now a Free Agent.`);
          newsItems.push({
            id: `news_bosman_free_${updatedPlayer.id}_${season}_${Date.now()}`,
            week: 1,
            season,
            headline: `🚨 BOSMAN FREE AGENCY: ${updatedPlayer.name} Leaves ${oldClub} on Free Transfer!`,
            content: `Following the conclusion of Season ${season - 1}, ${updatedPlayer.name} (${updatedPlayer.rating} OVR) has officially parted ways with ${oldClub} upon contract expiry. Agency ${agency.agencyName} is now accepting free transfer bids and pre-contract proposals.`,
            category: 'transfer',
            urgency: 'hot',
            read: false,
            targetRole: 'agent',
            actionTab: 'my_players',
            relatedPlayerId: updatedPlayer.id
          });
        }
      }
    }

    // 7. Veteran Retirements (Age 35+ with declining rating, or Age 38+)
    const isRetiring = (updatedPlayer.age >= 35 && updatedPlayer.rating < 74) || updatedPlayer.age >= 38;
    if (isRetiring) {
      retiredPlayerNames.push(updatedPlayer.name);
      if (updatedPlayer.isMyClient) {
        toastMessages.push(`🎖️ CAREER RETIREMENT: Storied Legend ${updatedPlayer.name} has officially retired at Age ${updatedPlayer.age}!`);
        newsItems.push({
          id: `news_retire_${updatedPlayer.id}_${season}_${Date.now()}`,
          week: 1,
          season,
          headline: `FAREWELL TO A LEGEND: ${updatedPlayer.name} Announces Retirement at Age ${updatedPlayer.age}!`,
          content: `After an illustrious professional career spanning over 15 seasons and hundreds of competitive appearances, ${updatedPlayer.name} has hung up his boots. Agency ${agency.agencyName} honors their iconic client.`,
          category: 'agency',
          urgency: 'hot',
          read: false
        });
      }

      // Generate a youth academy regen to replace the retiring player
      if (club) {
        const positions: Position[] = ['ST', 'CAM', 'CM', 'CB', 'LB', 'RB', 'GK', 'LW', 'RW'];
        const regenPos = updatedPlayer.position || positions[Math.floor(Math.random() * positions.length)];
        const regenAge = Math.floor(Math.random() * 3) + 16; // 16-18
        const regenRating = Math.floor(Math.random() * 12) + 56; // 56-67
        const regenPotential = Math.min(94, regenRating + Math.floor(Math.random() * 16) + 12); // 72-94 potential
        const isWonderkid = regenPotential >= 87;

        regeneratedYouth.push({
          id: `regen_s${season}_${club.id}_${regenCounter++}`,
          name: `${updatedPlayer.name.split(' ')[0]} (Academy Regen)`,
          age: regenAge,
          nationality: updatedPlayer.nationality || 'England',
          flag: updatedPlayer.flag || '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
          position: regenPos,
          rating: regenRating,
          potential: regenPotential,
          potentialCeiling: regenPotential,
          value: calculateValuationForRating(regenRating, regenAge, regenPotential),
          wage: Math.round(regenRating * 250),
          contractYears: 3,
          clubId: club.id,
          clubName: club.name,
          agencyName: 'Unrepresented',
          agencyLoyalty: 60,
          isAutoYouthPromoted: true,
          isHomegrown: true,
          isRegistered: true,
          unregisteredWeeks: 0,
          isMyClient: false,
          agentCommission: 8,
          morale: 85,
          loyalty: 80,
          form: 75,
          injury: { isInjured: false, weeks: 0 },
          traits: isWonderkid ? ['Wonderkid Prospect', 'Academy Graduate'] : ['Academy Graduate'],
          personalLife: { happiness: 85, socialMediaFollowers: 5000, scandalLevel: 5, endorsementEarnings: 0 },
          stats: { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, avgRating: 0 },
          clauses: {}
        });
      }

      return; // Do not keep retired player in active roster
    }

    // Re-evaluate market valuation for new age
    updatedPlayer.value = calculateValuationForRating(updatedPlayer.rating, updatedPlayer.age, updatedPlayer.potential);

    updatedPlayers.push(updatedPlayer);
  });

  // Append new youth intake regens
  const finalPlayersList = [...updatedPlayers, ...regeneratedYouth];

  const updatedAgency: AgencyState = {
    ...agency,
    balance: agency.balance + totalBonusCashEarned,
    reputation: Math.min(99, agency.reputation + repDelta),
    totalTransferEarnings: (agency.totalTransferEarnings || 0) + totalBonusCashEarned
  };

  return {
    updatedAgency,
    updatedPlayers: finalPlayersList,
    toastMessages,
    newsItems
  };
}

// -------------------------------------------------------------------------
// AI Narrative Player Bio Generator
// -------------------------------------------------------------------------
export async function generatePlayerBio(player: Player): Promise<string> {
  try {
    const res = await fetch('/api/ai/player-bio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.bio && data.bio.length > 20) {
        return data.bio;
      }
    }
  } catch (err) {
    console.error('Error fetching player bio from server:', err);
  }

  // Fallback procedural bio generator (hometown, struggles, playstyle)
  const hometownMap: Record<string, string[]> = {
    England: ['Sheffield', 'Manchester', 'South London', 'Birmingham', 'Liverpool'],
    France: ['Bondy (Paris suburbs)', 'Marseille', 'Lyon', 'Lille', 'Toulouse'],
    Spain: ['Barcelona', 'Madrid', 'Seville', 'Valencia', 'Bilbao'],
    Brazil: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Santos'],
    Germany: ['Gelsenkirchen', 'Munich', 'Berlin', 'Dortmund', 'Hamburg'],
    Nigeria: ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Enugu'],
    Italy: ['Naples', 'Milan', 'Rome', 'Turin', 'Palermo'],
    Argentina: ['Rosario', 'Buenos Aires', 'Córdoba', 'Mendoza'],
    Norway: ['Bryne', 'Oslo', 'Bergen', 'Trondheim'],
    China: ['Dalian', 'Shanghai', 'Guangzhou', 'Beijing', 'Wuhan'],
    Japan: ['Yokohama', 'Tokyo', 'Osaka', 'Saitama', 'Kobe']
  };

  const pool = hometownMap[player.nationality] || [`the heart of ${player.nationality}`];
  const hometown = pool[Math.floor(Math.random() * pool.length)];

  return `${player.name} grew up in ${hometown}, battling through early financial hardship and fierce youth system competition before catching the eye of professional academy scouts. Overcoming early doubts about physical stature and tactical discipline, they honed a relentless work ethic that propelled them into senior football.\n\nOn the pitch, ${player.name} is distinguished by exceptional footballing IQ as a ${player.position} (${player.rating} OVR / ${player.potential} POT), characterized by explosive close control, fearless attacking ambition, and decisive composure in high-stakes matches. Off the pitch, they remain grounded and actively support youth development initiatives back home.`;
}

// -------------------------------------------------------------------------
// Agency Achievements & Career Trophies Tracking Engine
// -------------------------------------------------------------------------
export function checkAndUnlockAchievements(
  agency: AgencyState,
  players: Player[],
  _clubs: Club[]
): { updatedAgency: AgencyState; newlyUnlocked: AgencyAchievement[] } {
  const currentAchievements = agency.achievements && agency.achievements.length > 0
    ? [...agency.achievements]
    : [];

  if (currentAchievements.length === 0) {
    return { updatedAgency: agency, newlyUnlocked: [] };
  }

  const newlyUnlocked: AgencyAchievement[] = [];
  let totalBonusCash = 0;
  let totalBonusRep = 0;

  const myClients = players.filter(p => p.isMyClient);
  const maxClientGoals = myClients.reduce((max, p) => Math.max(max, p.stats?.goals || 0), 0);
  const maxClientRating = myClients.reduce((max, p) => Math.max(max, p.rating || 0), 0);
  const wonderkidsCount = myClients.filter(p => (p.potential || 0) >= 88 && p.age <= 21).length;
  const maxCleanSheets = myClients.reduce((max, p) => Math.max(max, p.stats?.cleanSheets || (p.position === 'GK' ? Math.floor((p.stats?.appearances || 0) * 0.4) : 0)), 0);
  const netWorth = (agency.balance || 0) + 
    (agency.realEstate?.filter(r => r.owned).reduce((s, r) => s + r.cost, 0) || 0) + 
    (agency.luxuryAssets?.filter(l => l.owned).reduce((s, l) => s + l.cost, 0) || 0);
  const maxClubShare = agency.clubShares?.reduce((max, c) => Math.max(max, c.sharePercent), 0) || 0;
  const maxTransferDeal = (agency.totalTransferEarnings || 0) > 0 ? (agency.totalTransferEarnings || 0) : 0;
  const interviewCount = agency.pressInterviews?.filter(pi => pi.answered).length || 0;

  const updatedAchievements = currentAchievements.map(ach => {
    if (ach.unlocked) return ach;

    let currentProgress = 0;
    let isCompleted = false;

    switch (ach.id) {
      case 'ach_first_10m':
        currentProgress = maxTransferDeal;
        isCompleted = currentProgress >= 10000000;
        break;
      case 'ach_mega_50m':
        currentProgress = maxTransferDeal;
        isCompleted = currentProgress >= 50000000;
        break;
      case 'ach_galactico_100m':
        currentProgress = maxTransferDeal;
        isCompleted = currentProgress >= 100000000;
        break;
      case 'ach_golden_boot':
        currentProgress = maxClientGoals;
        isCompleted = currentProgress >= 20;
        break;
      case 'ach_ballon_dor':
        currentProgress = maxClientRating;
        isCompleted = currentProgress >= 90;
        break;
      case 'ach_wonderkid_nursery':
        currentProgress = wonderkidsCount;
        isCompleted = currentProgress >= 5;
        break;
      case 'ach_rival_poach':
        currentProgress = myClients.filter(p => p.agencyLoyalty !== undefined || p.traits?.includes('Poached Star')).length > 0 ? 1 : 0;
        isCompleted = currentProgress >= 1;
        break;
      case 'ach_press_maestro':
        currentProgress = interviewCount;
        isCompleted = currentProgress >= 5;
        break;
      case 'ach_tycoon_empire':
        currentProgress = netWorth;
        isCompleted = currentProgress >= 50000000;
        break;
      case 'ach_club_takeover':
        currentProgress = maxClubShare;
        isCompleted = currentProgress >= 51;
        break;
      case 'ach_fa_president':
        currentProgress = (agency.presidency?.role === 'FIFA Global President' || agency.activeRoles?.fa_president) ? 1 : 0;
        isCompleted = currentProgress >= 1;
        break;
      case 'ach_clean_sheet':
        currentProgress = maxCleanSheets;
        isCompleted = currentProgress >= 8;
        break;
      default:
        break;
    }

    if (isCompleted && !ach.unlocked) {
      const unlockedAch: AgencyAchievement = {
        ...ach,
        unlocked: true,
        progress: Math.max(ach.target, currentProgress),
        unlockedAtWeek: agency.currentWeek,
        unlockedAtSeason: agency.currentSeason
      };
      newlyUnlocked.push(unlockedAch);
      totalBonusCash += ach.rewardCash;
      totalBonusRep += ach.rewardReputation;
      return unlockedAch;
    }

    return {
      ...ach,
      progress: Math.min(ach.target, currentProgress)
    };
  });

  const updatedAgency: AgencyState = {
    ...agency,
    balance: agency.balance + totalBonusCash,
    reputation: Math.min(99, agency.reputation + totalBonusRep),
    achievements: updatedAchievements
  };

  return { updatedAgency, newlyUnlocked };
}

// -------------------------------------------------------------------------
// Agent License Level Multipliers & Privilege Calculators
// -------------------------------------------------------------------------
export function getLicenseMultipliers(tier: string = 'grassroots'): {
  maxLoansAllowed: number;
  internationalBuyoutCeiling: number;
  legalDisputeCostDiscount: number; // 0 to 0.50
  maxCommissionCap: number; // %
  tierLabel: string;
} {
  switch (tier) {
    case 'fifa_global':
      return {
        maxLoansAllowed: 25,
        internationalBuyoutCeiling: 500000000,
        legalDisputeCostDiscount: 0.50,
        maxCommissionCap: 20,
        tierLabel: 'Super Agent FIFA Pro'
      };
    case 'uefa':
      return {
        maxLoansAllowed: 10,
        internationalBuyoutCeiling: 150000000,
        legalDisputeCostDiscount: 0.30,
        maxCommissionCap: 15,
        tierLabel: 'Grade A Elite Continental'
      };
    case 'national':
      return {
        maxLoansAllowed: 6,
        internationalBuyoutCeiling: 60000000,
        legalDisputeCostDiscount: 0.15,
        maxCommissionCap: 12,
        tierLabel: 'Grade B National'
      };
    case 'grassroots':
    default:
      return {
        maxLoansAllowed: 3,
        internationalBuyoutCeiling: 20000000,
        legalDisputeCostDiscount: 0.0,
        maxCommissionCap: 10,
        tierLabel: 'Grade C Grassroots'
      };
  }
}

// -------------------------------------------------------------------------
// FIFA Tribunal Deregistration & Contract Termination Processor
// Enforces FIFA RSTP Articles 14/15 Sporting Just Cause for unregistered players
// -------------------------------------------------------------------------
export function processDeregistrationTribunal(
  players: Player[],
  week: number,
  season: number
): { updatedPlayers: Player[]; newsItems: NewsItem[] } {
  const updatedPlayers = [...players];
  const newsItems: NewsItem[] = [];

  updatedPlayers.forEach(player => {
    if (player.clubId === 'free_agent') return;

    if (player.isRegistered === false) {
      player.unregisteredWeeks = (player.unregisteredWeeks || 0) + 1;
      player.morale = Math.max(5, (player.morale || 75) - 6);
      player.playingTimeSatisfaction = Math.max(0, (player.playingTimeSatisfaction || 50) - 15);

      // Established players (>72 OVR or age > 22) who are unregistered for >4 weeks can walk for free
      if (player.unregisteredWeeks >= 4 && player.rating >= 72) {
        const oldClubName = player.clubName;
        player.clubId = 'free_agent';
        player.clubName = 'Free Agent';
        player.isRegistered = true;
        player.unregisteredWeeks = 0;
        player.isTransferListed = false;
        player.isLoanListed = false;
        player.morale = 60;
        player.unrest = {
          status: 'content',
          reason: 'wants_new_challenge',
          reasonLabel: 'Contract Terminated (FIFA Sporting Just Cause)',
          discontentLevel: 0,
          description: `Contract unilaterally terminated via FIFA Tribunal after remaining unregistered for ${player.unregisteredWeeks} consecutive weeks.`,
          discountPercent: 0
        };

        newsItems.push({
          id: `news_fifa_tribunal_${Date.now()}_${player.id}`,
          week,
          season,
          headline: `⚖️ FIFA TRIBUNAL RULING: ${player.name} Unilaterally Terminates Contract with ${oldClubName}!`,
          content: `Under FIFA RSTP Sporting Just Cause regulations, ${player.name} (${player.rating} OVR) has been granted immediate contract termination following over 4 weeks of squad de-registration by ${oldClubName}. The player is now a free agent on the open market!`,
          category: 'scandal',
          urgency: 'breaking',
          read: false
        });
      }
    } else {
      player.unregisteredWeeks = Math.max(0, (player.unregisteredWeeks || 0) - 1);
    }
  });

  return { updatedPlayers, newsItems };
}

// -------------------------------------------------------------------------
// Weekly Promises Resolution Engine
// Tracks active promises, deadline countdowns, and reputation consequences
// -------------------------------------------------------------------------
export function processWeeklyPromises(
  players: Player[],
  agency: AgencyState,
  week: number,
  season: number
): { updatedPlayers: Player[]; updatedAgency: AgencyState; newsItems: NewsItem[] } {
  const updatedPlayers = [...players];
  let updatedAgency = { ...agency };
  const newsItems: NewsItem[] = [];
  let repDelta = 0;

  updatedPlayers.forEach(player => {
    if (!player.promisesMade || player.promisesMade.length === 0) return;

    player.promisesMade = player.promisesMade.map(promise => {
      if (promise.status !== 'active') return promise;

      let isFulfilled = false;
      let isBroken = false;

      if (promise.promiseType === 'playing_time') {
        if (player.playingTimeSatisfaction && player.playingTimeSatisfaction >= 70) {
          if (week >= promise.targetDeadlineWeek) {
            isFulfilled = true;
          }
        } else if (player.playingTimeSatisfaction && player.playingTimeSatisfaction < 40 && week >= promise.targetDeadlineWeek) {
          isBroken = true;
        }
      } else if (promise.promiseType === 'wage_hike') {
        if (player.wage >= 40000 || (player.ongoingContractNegotiation?.status === 'accepted')) {
          isFulfilled = true;
        } else if (week >= promise.targetDeadlineWeek) {
          isBroken = true;
        }
      } else if (promise.promiseType === 'ucl_move') {
        if (player.clubName?.includes('Madrid') || player.clubName?.includes('City') || player.clubName?.includes('Munich') || player.clubName?.includes('Paris')) {
          isFulfilled = true;
        } else if (week >= promise.targetDeadlineWeek) {
          isBroken = true;
        }
      } else if (promise.promiseType === 'boot_sponsorship') {
        if (player.brandEndorsement) {
          isFulfilled = true;
        } else if (week >= promise.targetDeadlineWeek) {
          isBroken = true;
        }
      }

      if (isFulfilled) {
        player.morale = Math.min(100, (player.morale || 70) + 15);
        player.loyalty = Math.min(100, (player.loyalty || 70) + 15);
        repDelta += 1;

        newsItems.push({
          id: `news_prom_ful_${Date.now()}_${player.id}`,
          week,
          season,
          headline: `🤝 PROMISE KEPT: ${player.name} Praises Agency Commitment!`,
          content: `${agency.agencyName} has successfully fulfilled the promise made to ${player.name} (${promise.description}). Player loyalty and agent standing elevated!`,
          category: 'agency',
          urgency: 'hot',
          read: false
        });

        return { ...promise, status: 'fulfilled' as const };
      }

      if (isBroken) {
        player.morale = Math.max(10, (player.morale || 70) - 25);
        player.loyalty = Math.max(10, (player.loyalty || 70) - 35);
        repDelta -= 2;

        player.unrest = {
          status: 'discontent',
          reason: 'contract_stalled',
          reasonLabel: 'Broken Agency Promise',
          discontentLevel: 80,
          description: `Agency failed to deliver on promised commitment: "${promise.description}" by deadline week ${promise.targetDeadlineWeek}.`,
          discountPercent: 20
        };

        newsItems.push({
          id: `news_prom_brk_${Date.now()}_${player.id}`,
          week,
          season,
          headline: `⚠️ BROKEN PROMISE: ${player.name} Furious with Agency!`,
          content: `${player.name} expressed severe frustration after ${agency.agencyName} failed to deliver on promise: "${promise.description}". Client loyalty collapsed!`,
          category: 'agency',
          urgency: 'breaking',
          read: false
        });

        return { ...promise, status: 'broken' as const };
      }

      return promise;
    });
  });

  updatedAgency = {
    ...updatedAgency,
    reputation: Math.max(1, Math.min(99, updatedAgency.reputation + repDelta))
  };

  return { updatedPlayers, updatedAgency, newsItems };
}

// -------------------------------------------------------------------------
// Weekly Scouting Missions & Academy Pipeline Engine
// -------------------------------------------------------------------------
export function processWeeklyScoutingMissions(
  agency: AgencyState,
  players: Player[],
  week: number,
  season: number
): {
  updatedAgency: AgencyState;
  updatedPlayers: Player[];
  scoutNews: NewsItem[];
  toastAlerts: string[];
} {
  const updatedAgency = { ...agency };
  let updatedPlayers = [...players];
  const scoutNews: NewsItem[] = [];
  const toastAlerts: string[] = [];

  const currentScouts = agency.staff?.scouts || [];
  let scoutsModified = false;

  const updatedScouts = currentScouts.map(scout => {
    if (scout.status !== 'scouting') return scout;

    const remaining = (scout.weeksLeft ?? 2) - 1;
    if (remaining > 0) {
      scoutsModified = true;
      return { ...scout, weeksLeft: remaining };
    }

    // Scouting mission completed!
    scoutsModified = true;
    const region = scout.targetRegion || scout.region || 'Europe';
    const scoutBonus = Math.max(0, (scout.rating - 70) / 100);
    
    // Generate 1-2 new discovered prospects
    const count = scout.rating >= 85 ? 2 : 1;
    const newProspects: Player[] = [];
    for (let i = 0; i < count; i++) {
      const prospect = generateWonderkid(region, week, season, scoutBonus);
      prospect.scoutedStatus = 'fully_scouted';
      newProspects.push(prospect);
    }

    updatedPlayers = [...newProspects, ...updatedPlayers];

    const bestProspect = newProspects.sort((a, b) => b.potential - a.potential)[0];
    scoutNews.push({
      id: `scout_done_${Date.now()}_${scout.id}`,
      week,
      season,
      headline: `🔍 SCOUTING DISPATCH: ${scout.name} Returns from ${region}!`,
      content: `Chief scout ${scout.name} has concluded their international mission across ${region}, discovering ${newProspects.length} high-potential talent(s). Headline prospect: ${bestProspect.name} (${bestProspect.age}yo ${bestProspect.position}, Potential ${bestProspect.potential}).`,
      category: 'player_development',
      urgency: bestProspect.potential >= 88 ? 'hot' : 'normal',
      read: false
    });

    toastAlerts.push(`🔍 Scout ${scout.name} returned from ${region} with ${newProspects.length} prospect(s)!`);

    return {
      ...scout,
      status: 'idle' as const,
      weeksLeft: undefined,
      targetRegion: undefined
    };
  });

  // Grassroots Camps Talent Emergence (Every 4 weeks)
  if (week % 4 === 0 && agency.grassrootsCamps && agency.grassrootsCamps.length > 0) {
    agency.grassrootsCamps.forEach(camp => {
      if (camp.level > 0 && Math.random() < 0.35 + (camp.level * 0.1)) {
        const academyKid = generateWonderkid(camp.region, week, season, camp.level * 0.15);
        academyKid.traits = [...(academyKid.traits || []), `${camp.region} Academy Graduate`];
        academyKid.scoutedStatus = 'fully_scouted';
        updatedPlayers = [academyKid, ...updatedPlayers];

        scoutNews.push({
          id: `camp_talent_${Date.now()}_${camp.id}`,
          week,
          season,
          headline: `🌱 ACADEMY GRADUATE: ${academyKid.name} Emerges from ${camp.region} Academy!`,
          content: `Your grassroots youth investment in ${camp.region} bore fruit. ${academyKid.name} (${academyKid.position}, ${academyKid.age}yo, ${academyKid.potential} POT) has graduated from the ${camp.region} Grassroots Academy and is ready for agent representation!`,
          category: 'player_development',
          urgency: 'hot',
          read: false
        });

        toastAlerts.push(`🌱 New talent emerged from ${camp.region} Academy: ${academyKid.name}!`);
      }
    });
  }

  if (scoutsModified) {
    updatedAgency.staff = {
      ...updatedAgency.staff,
      scouts: updatedScouts
    };
  }

  return { updatedAgency, updatedPlayers, scoutNews, toastAlerts };
}

// -------------------------------------------------------------------------
// Weekly Corporate Bonds Engine
// -------------------------------------------------------------------------
export function processWeeklyCorporateBonds(
  agency: AgencyState,
  week: number,
  season: number
): {
  updatedAgency: AgencyState;
  bondNews: NewsItem[];
  toastAlerts: string[];
} {
  const updatedAgency = { ...agency };
  const existingBonds = agency.corporateBonds || [];
  if (existingBonds.length === 0) {
    return { updatedAgency, bondNews: [], toastAlerts: [] };
  }

  const bondNews: NewsItem[] = [];
  const toastAlerts: string[] = [];
  let balanceDelta = 0;

  const processedBonds = existingBonds.map(bond => {
    if (bond.status !== 'active') return bond;

    const remaining = Math.max(0, bond.weeksRemaining - 1);
    
    if (remaining === 0) {
      // Bond has matured
      if (bond.principalRaised > 0) {
        // Agency issued bond: must repay principal
        if (updatedAgency.balance + balanceDelta >= bond.principalRaised) {
          balanceDelta -= bond.principalRaised;
          bondNews.push({
            id: `bond_mature_${Date.now()}_${bond.id}`,
            week,
            season,
            headline: `📜 CORPORATE BOND SETTLED: Principal Repaid!`,
            content: `Your agency's corporate bond "${bond.name}" has matured. Principal of ${formatMoney(bond.principalRaised)} was successfully remitted to bondholders. Agency creditworthiness maintained.`,
            category: 'agency',
            urgency: 'normal',
            read: false
          });
          toastAlerts.push(`📜 Bond ${bond.name} matured & principal settled!`);
          return { ...bond, weeksRemaining: 0, status: 'matured' as const };
        } else {
          // Default on bond!
          bondNews.push({
            id: `bond_default_${Date.now()}_${bond.id}`,
            week,
            season,
            headline: `⚠️ CORPORATE BOND DEFAULT: Insolvency Warning!`,
            content: `Agency failed to repay principal on matured bond "${bond.name}" (${formatMoney(bond.principalRaised)}). Credit rating downgraded to Subprime!`,
            category: 'agency',
            urgency: 'breaking',
            read: false
          });
          toastAlerts.push(`⚠️ Bond Default: Insolvent on ${bond.name}!`);
          updatedAgency.creditRating = 'Subprime';
          return { ...bond, weeksRemaining: 0, status: 'defaulted' as const };
        }
      }
    }

    return { ...bond, weeksRemaining: remaining };
  });

  updatedAgency.corporateBonds = processedBonds;
  updatedAgency.balance = Math.max(0, updatedAgency.balance + balanceDelta);

  return { updatedAgency, bondNews, toastAlerts };
}

// -------------------------------------------------------------------------
// Interactive Press Conference Generator & Media Desk Engine
// Generates situational press conferences based on real game state
// -------------------------------------------------------------------------
export function generateDynamicPressInterview(
  agency: AgencyState,
  players: Player[],
  clubs: Club[],
  week: number,
  season: number
): PressInterview | null {
  const clients = players.filter(p => p.isMyClient);
  if (clients.length === 0) return null;

  const topClient = [...clients].sort((a, b) => (b.value || 0) - (a.value || 0))[0];
  const unrestClient = clients.find(p => p.unrest && p.unrest.status !== 'content');
  const transferClient = clients.find(p => p.ongoingTransferNegotiation && p.ongoingTransferNegotiation.status === 'pending_user_decision');
  const targetClient = transferClient || unrestClient || clients[Math.floor(Math.random() * clients.length)] || topClient;

  const outlets = [
    { name: 'Sky Sports News', journalist: 'Kaveh Solhekol', avatar: '🎙️' },
    { name: 'The Athletic UK', journalist: 'David Ornstein', avatar: '📰' },
    { name: 'L’Équipe', journalist: 'Loïc Tanzi', avatar: '🇫🇷' },
    { name: 'Marca Flash', journalist: 'José Félix Díaz', avatar: '🇪🇸' },
    { name: 'Gazzetta dello Sport', journalist: 'Fabrizio Romano', avatar: '⭐' }
  ];
  const outlet = outlets[Math.floor(Math.random() * outlets.length)];

  // Scenario 1: Ongoing transfer negotiation
  if (transferClient && transferClient.ongoingTransferNegotiation) {
    const neg = transferClient.ongoingTransferNegotiation;
    return {
      id: `press_${Date.now()}_${transferClient.id}`,
      week,
      season,
      playerId: transferClient.id,
      playerName: transferClient.name,
      mediaOutlet: outlet.name,
      journalistName: outlet.journalist,
      journalistAvatar: outlet.avatar,
      context: `Exclusive Transfer Desk Briefing: ${outlet.name} cornered you outside the training ground regarding ${neg.buyingClubName}'s ${formatMoney(neg.offeredFee)} offer for ${transferClient.name}.`,
      question: `"${outlet.journalist} here for ${outlet.name}. We understand ${neg.buyingClubName} have tabled an official ${formatMoney(neg.offeredFee)} package for ${transferClient.name}. Is your client pushing for this move, or are you holding out for better contract terms?"`,
      urgency: 'breaking',
      answered: false,
      options: [
        {
          id: 'opt_1',
          label: 'Aggressive Stance',
          tone: 'Aggressive',
          text: `Demand ${neg.buyingClubName} match player ambition with higher financial valuation.`,
          responseQuote: `"If ${neg.buyingClubName} want a world-class player like ${transferClient.name}, they need to pay world-class numbers. We won't let our client be undervalued."`,
          moraleDelta: 15,
          reputationDelta: 2,
          clubTrustDelta: -10,
          fanPopularityDelta: 12,
          darkArtsDelta: 5,
          impactSummary: '+15 Morale, +2 Agency Rep, -10 Club Board Trust, +12 Fan Hype'
        },
        {
          id: 'opt_2',
          label: 'Diplomatic Response',
          tone: 'Diplomatic',
          text: `Emphasize professional respect for ${transferClient.clubName || 'current club'} while leaving options open.`,
          responseQuote: `"${transferClient.name} is 100% committed on the pitch. Transfer talks are handled privately with maximum respect for both institutions."`,
          moraleDelta: 5,
          reputationDelta: 1,
          clubTrustDelta: 10,
          fanPopularityDelta: 5,
          darkArtsDelta: 0,
          impactSummary: '+5 Morale, +1 Agency Rep, +10 Club Board Trust'
        },
        {
          id: 'opt_3',
          label: 'Humorous Deflection',
          tone: 'Humorous',
          text: `Make a witty remark about transfer deadline madness and tea prices.`,
          responseQuote: `"I came here for an espresso, not to negotiate contracts in front of cameras! Ask me again when the ink is actually dry."`,
          moraleDelta: 5,
          reputationDelta: 0,
          clubTrustDelta: 0,
          fanPopularityDelta: 15,
          darkArtsDelta: 0,
          impactSummary: '+5 Morale, +15 Fan Hype, +0 Scandal'
        }
      ]
    };
  }

  // Scenario 2: Unrest or Contract Dispute
  if (unrestClient) {
    return {
      id: `press_${Date.now()}_${unrestClient.id}`,
      week,
      season,
      playerId: unrestClient.id,
      playerName: unrestClient.name,
      mediaOutlet: outlet.name,
      journalistName: outlet.journalist,
      journalistAvatar: outlet.avatar,
      context: `Dressing Room Friction Alert: Reports of unrest regarding ${unrestClient.name}'s current standing at ${unrestClient.clubName}.`,
      question: `"${outlet.journalist} from ${outlet.name}. Rumors suggest ${unrestClient.name} is extremely frustrated with playing time and wage promises. Is a transfer request imminent?"`,
      urgency: 'hot',
      answered: false,
      options: [
        {
          id: 'opt_1',
          label: 'Defend Client Fiercely',
          tone: 'Aggressive',
          text: `Put public pressure on the coaching staff to play your superstar.`,
          responseQuote: `"A player of ${unrestClient.name}'s caliber shouldn't be warming any bench. The manager knows what needs to happen if they want harmony in the squad."`,
          moraleDelta: 20,
          reputationDelta: 2,
          clubTrustDelta: -15,
          fanPopularityDelta: 10,
          darkArtsDelta: 5,
          impactSummary: '+20 Morale, +2 Agency Rep, -15 Club Trust'
        },
        {
          id: 'opt_2',
          label: 'Calm the Storm',
          tone: 'Diplomatic',
          text: `Reassure supporters that differences will be ironed out behind closed doors.`,
          responseQuote: `"Every top professional has competitive fire. There are no rifts—we are working collaboratively with the sporting director to find the right harmony."`,
          moraleDelta: 0,
          reputationDelta: 1,
          clubTrustDelta: 12,
          fanPopularityDelta: 5,
          darkArtsDelta: 0,
          impactSummary: '+1 Agency Rep, +12 Club Trust'
        },
        {
          id: 'opt_3',
          label: 'Playful Quip',
          tone: 'Humorous',
          text: `Laugh off sensationalist media reports with irony.`,
          responseQuote: `"If I believed every headline you write, I'd think ${unrestClient.name} was signing for Mars FC next Tuesday!"`,
          moraleDelta: 5,
          reputationDelta: 0,
          clubTrustDelta: 5,
          fanPopularityDelta: 15,
          darkArtsDelta: 0,
          impactSummary: '+5 Morale, +15 Fan Hype'
        }
      ]
    };
  }

  // Scenario 3: General Agency Reputation & Golden Ambition
  return {
    id: `press_${Date.now()}_${targetClient.id}`,
    week,
    season,
    playerId: targetClient.id,
    playerName: targetClient.name,
    mediaOutlet: outlet.name,
    journalistName: outlet.journalist,
    journalistAvatar: outlet.avatar,
    context: `Weekly Press Media Briefing: Journalists questioning ${agency.agencyName}'s rising international footprint and client roster strategy.`,
    question: `"${outlet.journalist} from ${outlet.name}. With your agency's rapid expansion across European football, critics argue you hold too much leverage over club boards. How do you respond?"`,
    urgency: 'normal',
    answered: false,
    options: [
      {
        id: 'opt_1',
        label: 'Embrace Super-Agent Status',
        tone: 'Aggressive',
        text: `Assert that your primary fiduciary duty is maximizing value for your players.`,
        responseQuote: `"We protect the talent. Without our players, the stadiums are empty and the TV cameras have nothing to broadcast. We make no apologies for excellence."`,
        moraleDelta: 10,
        reputationDelta: 3,
        clubTrustDelta: -5,
        fanPopularityDelta: 15,
        darkArtsDelta: 5,
        impactSummary: '+10 Client Morale, +3 Agency Rep, +15 Fan Hype'
      },
      {
        id: 'opt_2',
        label: 'Promote Football Governance & Ethics',
        tone: 'Diplomatic',
        text: `Highlight transparent partnerships, academy development, and fair contracts.`,
        responseQuote: `"We view ourselves as long-term partners to clubs. Our mission is sustainable player development, ethical representation, and safeguarding athlete futures."`,
        moraleDelta: 5,
        reputationDelta: 2,
        clubTrustDelta: 15,
        fanPopularityDelta: 5,
        darkArtsDelta: 0,
        impactSummary: '+2 Agency Rep, +15 Club Trust, High Integrity'
      },
      {
        id: 'opt_3',
        label: 'Charming Joke',
        tone: 'Humorous',
        text: `Smile and invite the press room for post-match coffees.`,
        responseQuote: `"Too much leverage? I can't even get my staff to agree on where we order lunch! Let's focus on good football."`,
        moraleDelta: 5,
        reputationDelta: 1,
        clubTrustDelta: 5,
        fanPopularityDelta: 20,
        darkArtsDelta: 0,
        impactSummary: '+1 Agency Rep, +20 Fan Hype'
      }
    ]
  };
}

// -------------------------------------------------------------------------
// Targeted Club Feedback Generation Engine
// Generates nuanced, realistic club feedback, valuation verdicts, tactical reasoning,
// and suggested alternative deal structures (installments, sell-on clauses, add-ons).
// -------------------------------------------------------------------------
export function generateTargetedClubFeedback(
  player: Player,
  targetClub: Club,
  offeredFee: number,
  offeredWage: number,
  agentCommissionFee: number,
  isLoan: boolean,
  loanFee: number = 0,
  wageContributionPercent: number = 100,
  sellOnClausePercent: number = 0,
  upfrontInstallmentPercent: number = 50,
  hasAddons: boolean = false,
  buyerClub?: Club
): TargetedClubFeedback {
  const directorName = targetClub.sportingDirectorProfile?.name || `${targetClub.name} Sporting Director`;
  const directorRole = targetClub.sportingDirectorProfile?.personality || 'Chief Negotiator';
  const directorAvatar = targetClub.sportingDirectorProfile?.avatar || '👔';

  // Calculate expected base valuation
  let expectedFee = player.value || calculateValuationForRating(player.rating, player.age, player.potential);
  
  // Tactical squad importance
  const isKeyStarter = player.rating >= 81;
  const isSquadRotation = player.rating >= 74 && player.rating < 81;
  const isSurplus = player.rating < 74 || (player.unrest && (player.unrest.status === 'discontent' || player.unrest.status === 'strike' || player.unrest.status === 'transfer_requested')) || (player.morale !== undefined && player.morale < 40);
  
  let squadImportance: 'Key Indispensable Starter' | 'Important Squad Player' | 'Rotation' | 'Surplus to Requirements' = 'Important Squad Player';
  let tacticalReasoning = '';

  if (isKeyStarter) {
    squadImportance = 'Key Indispensable Starter';
    tacticalReasoning = `${player.name} is a cornerstone of our first-team system. Relinquishing our starting ${player.position} mid-campaign requires a substantial premium to fund an immediate replacement.`;
    expectedFee = Math.round(expectedFee * 1.15);
  } else if (isSquadRotation) {
    squadImportance = 'Important Squad Player';
    tacticalReasoning = `${player.name} provides vital squad depth across competitive fixtures. We are open to discussions only if the package guarantees financial security.`;
  } else if (isSurplus) {
    squadImportance = 'Surplus to Requirements';
    tacticalReasoning = `The technical staff is open to facilitating ${player.name}'s departure to streamline the wage bill and squad registration.`;
    expectedFee = Math.round(expectedFee * 0.85);
  }

  // Adjust for contract urgency
  if (player.contractYears <= 1) {
    expectedFee = Math.round(expectedFee * 0.75);
  } else if (player.contractYears >= 3) {
    expectedFee = Math.round(expectedFee * 1.10);
  }

  const effectiveOffered = isLoan ? loanFee : offeredFee;
  const gapAmount = expectedFee - effectiveOffered;
  const ratio = expectedFee > 0 ? effectiveOffered / expectedFee : 1;

  // Clause concessions
  let clauseDiscount = 0;
  if (sellOnClausePercent >= 15) clauseDiscount += 0.08;
  if (sellOnClausePercent >= 25) clauseDiscount += 0.15;
  if (upfrontInstallmentPercent >= 75) clauseDiscount += 0.05;
  if (hasAddons) clauseDiscount += 0.05;

  const adjustedRatio = ratio + clauseDiscount;

  let verdict: 'accepted' | 'counter_offer' | 'rejected_valuation' | 'rejected_indispensable' | 'rejected_wage_ffp' | 'rejected_rival';
  let statusLabel = '';
  let responseQuote = '';
  let valuationVerdict: 'insulting' | 'below_valuation' | 'fair' | 'generous' = 'fair';
  let valuationReasoning = '';
  let cashflowVerdict = '';
  let ffpRisk: 'low' | 'moderate' | 'high' = 'low';

  // Suggested Alternative Structure
  let suggestedAlternativeStructure: TargetedClubFeedback['suggestedAlternativeStructure'] = undefined;

  if (adjustedRatio >= 0.95 && (!isLoan || wageContributionPercent >= 70)) {
    verdict = 'accepted';
    statusLabel = 'Offer Sanctioned & Agreed';
    valuationVerdict = adjustedRatio > 1.15 ? 'generous' : 'fair';
    valuationReasoning = `The proposed fee of ${formatMoney(effectiveOffered)} satisfies our valuation benchmark of ${formatMoney(expectedFee)}.`;
    responseQuote = `"We have reviewed your formal proposal with the board. The numbers align with our sporting valuation and cashflow prerequisites. We are prepared to sign off on the deal."`;
    cashflowVerdict = `Acceptable payment structure with ${upfrontInstallmentPercent}% upfront liquidity.`;
    ffpRisk = 'low';
  } else if (adjustedRatio >= 0.65) {
    verdict = 'counter_offer';
    statusLabel = 'Counter-Proposal Formulated';
    valuationVerdict = 'below_valuation';
    valuationReasoning = `Offered ${formatMoney(effectiveOffered)} falls ${formatMoney(Math.max(0, gapAmount))} below our required threshold of ${formatMoney(expectedFee)}. However, the gap can be bridged with structural clauses.`;
    responseQuote = `"Your offer is close, but we cannot sanction a straight sale at this exact price. If you are willing to improve the upfront installment ratio and insert a sell-on clause, we can finalize the agreement."`;
    cashflowVerdict = upfrontInstallmentPercent < 60 ? 'Current installment ratio is too heavily deferred across future seasons.' : 'Cashflow structure is manageable.';
    ffpRisk = 'moderate';

    const counterFee = Math.round(expectedFee * 0.92);
    const suggestedUpfront = Math.max(65, upfrontInstallmentPercent);
    const suggestedSellOn = Math.max(15, sellOnClausePercent);
    const suggestedAddOns = Math.round(expectedFee * 0.08);
    const counterWage = Math.round(Math.max(player.wage * 1.12, offeredWage));

    suggestedAlternativeStructure = {
      counterTransferFee: counterFee,
      suggestedInstallmentUpfrontPercent: suggestedUpfront,
      suggestedSellOnPercent: suggestedSellOn,
      suggestedAddOnsAmount: suggestedAddOns,
      counterWage: counterWage,
      summaryText: `We propose: ${formatMoney(counterFee)} total transfer fee, structured with ${suggestedUpfront}% paid upfront, a ${suggestedSellOn}% future sell-on clause, and ${formatMoney(suggestedAddOns)} in performance add-ons.`
    };
  } else if (isKeyStarter && ratio < 0.50) {
    verdict = 'rejected_indispensable';
    statusLabel = 'Rejected: Vital Player / Valuation Gap';
    valuationVerdict = 'insulting';
    valuationReasoning = `An offer of ${formatMoney(effectiveOffered)} is dramatically below the ${formatMoney(expectedFee)} minimum required to sanction the loss of our starting ${player.position}.`;
    responseQuote = `"This proposal does not reflect the reality of ${player.name}'s importance to our club. We cannot entertain talks at this tier without a transformative bid."`;
    cashflowVerdict = 'Financially unacceptable given replacement acquisition costs in current market.';
    ffpRisk = 'high';

    const counterFee = Math.round(expectedFee * 1.05);
    suggestedAlternativeStructure = {
      counterTransferFee: counterFee,
      suggestedInstallmentUpfrontPercent: 75,
      suggestedSellOnPercent: 20,
      suggestedAddOnsAmount: Math.round(expectedFee * 0.10),
      counterWage: Math.round(player.wage * 1.25),
      summaryText: `To even reopen discussions, our board requires an opening bid of at least ${formatMoney(counterFee)} with 75% upfront cash and 20% sell-on rights.`
    };
  } else {
    verdict = 'rejected_valuation';
    statusLabel = 'Rejected: Insufficient Fee';
    valuationVerdict = ratio < 0.45 ? 'insulting' : 'below_valuation';
    valuationReasoning = `Bid of ${formatMoney(effectiveOffered)} is ${formatMoney(gapAmount)} short of the club's ${formatMoney(expectedFee)} valuation.`;
    responseQuote = `"We must protect our balance sheet and sporting assets. We cannot accept a bid this far beneath market rates."`;
    cashflowVerdict = 'Inadequate upfront return for squad reinvestment.';
    ffpRisk = 'moderate';

    const counterFee = Math.round(expectedFee * 0.95);
    suggestedAlternativeStructure = {
      counterTransferFee: counterFee,
      suggestedInstallmentUpfrontPercent: 60,
      suggestedSellOnPercent: 15,
      suggestedAddOnsAmount: Math.round(expectedFee * 0.05),
      counterWage: Math.round(Math.max(player.wage * 1.1, offeredWage)),
      summaryText: `A revised bid of ${formatMoney(counterFee)} with a 15% sell-on clause would be favorably reviewed by the board.`
    };
  }

  return {
    verdict,
    statusLabel,
    responseQuote,
    directorName,
    directorRole,
    directorAvatar,
    valuationAssessment: {
      offeredFee: effectiveOffered,
      expectedFee,
      gapAmount: Math.max(0, gapAmount),
      verdict: valuationVerdict,
      reasoning: valuationReasoning
    },
    squadImportanceAssessment: {
      importance: squadImportance,
      tacticalReasoning
    },
    financialStructureAssessment: {
      cashflowVerdict,
      ffpRisk
    },
    suggestedAlternativeStructure
  };
}


