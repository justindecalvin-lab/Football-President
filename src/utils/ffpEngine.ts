import { Club, Player, AgencyState } from '../types';
import { formatMoney } from './gameEngine';

export interface FfpFactorDetail {
  label: string;
  score: number; // 0 - 100
  ratingLevel: 'Elite' | 'Prudent' | 'Moderate' | 'High Risk' | 'Critical';
  description: string;
  financialImpact: string;
}

export interface ClubFfpFactors {
  marketDealing: FfpFactorDetail & {
    strategy: 'Prudent Moneyball' | 'Youth Seller & Developer' | 'Bargain Hunter' | 'Aggressive Spender' | 'Reckless Gambler';
    transferSpendMultiplier: number;
    netTransferSpend: number;
  };
  management: FfpFactorDetail & {
    governanceStyle: 'Austerity & Sustainable' | 'Prudent Traditionalist' | 'Corporate Growth' | 'Sugar-Daddy Aggressive' | 'Chaotic Mismanagement';
    wageCostMultiplier: number;
    operationalDisciplineScore: number;
  };
  income: FfpFactorDetail & {
    incomeRating: number;
    annualRevenue: number;
    commercialTier: string;
  };
  bookBalancing: FfpFactorDetail & {
    competenceScore: number;
    structuralDebtOrSurplus: number;
    isBalanced: boolean;
  };
  overallHealthScore: number; // 0 - 100
}

export interface ClubFfpMetrics {
  spentThisSeason: number;
  spending: number;
  transferSpending: number;
  revenueThisSeason: number;
  annualWageBill: number;
  weeklyWageBill: number;
  ffpLimit: number;
  allowableCap: number;
  allowableLossCap: number;
  debtRatio: number;
  debtLevel: number;
  estimatedDebt: number;
  status: 'Compliant' | 'At Risk' | 'In FFP Breach';
  overspendAmount: number;
  surplusAmount: number;
  isWithinFfp: boolean;
  alertSeverity: 'none' | 'warning' | 'critical';
  alertMessage: string;
  recommendedActions: FfpActionOption[];
  netSpend: number;
  annualPayroll: number;
  spendingRatio: number;
  factors: ClubFfpFactors;
}

export interface FfpActionOption {
  id: 'fine' | 'points' | 'ban' | 'restructure' | 'leak' | 'audit' | 'firesale';
  title: string;
  description: string;
  impactLabel: string;
  iconType: string;
  category: 'governance' | 'agency' | 'dark_arts';
  isAvailable: boolean;
  unavailableReason?: string;
}

/**
 * Calculates comprehensive, realistic Financial Fair Play metrics for any club
 * driven strictly by the 4 Core Factors:
 * 1. Market Dealing (Transfers approach & sales offset)
 * 2. Management Style (Governance, wage discipline & overhead control)
 * 3. Income & Revenue Streams (Commercial power, broadcast share & matchday yield)
 * 4. Ability to Balance the Books (Accounting competence, debt service & amortization)
 */
export function calculateClubFfpMetrics(
  club: Club, 
  allPlayersOrSquad: Player[] = [],
  isSquadAlreadyFiltered: boolean = false
): ClubFfpMetrics {
  const clubPlayers = isSquadAlreadyFiltered ? allPlayersOrSquad : allPlayersOrSquad.filter(p => p.clubId === club.id);
  const isTier2 = club.tier === 2;

  // =========================================================================
  // FACTOR 1: MARKET DEALING (Transfer strategy, acquisition multiplier & resale)
  // =========================================================================
  let marketStrategy: 'Prudent Moneyball' | 'Youth Seller & Developer' | 'Bargain Hunter' | 'Aggressive Spender' | 'Reckless Gambler' =
    club.marketDealing || (isTier2 ? 'Prudent Moneyball' : club.transferBudget > 140000000 ? 'Aggressive Spender' : 'Bargain Hunter');

  let transferSpendMultiplier = 0.6;
  let marketScore = 75;
  let marketRatingLevel: FfpFactorDetail['ratingLevel'] = 'Prudent';
  let marketDescription = 'Balanced transfer activity matching squad requirements.';
  let marketImpact = 'Standard transfer spend amortized across squad.';

  switch (marketStrategy) {
    case 'Prudent Moneyball':
      transferSpendMultiplier = 0.35;
      marketScore = 94;
      marketRatingLevel = 'Elite';
      marketDescription = 'Data-driven value recruitment, bargain acquisitions, high capital efficiency.';
      marketImpact = '-65% Transfer Outlays + High Resale Margins';
      break;
    case 'Youth Seller & Developer':
      transferSpendMultiplier = 0.30;
      marketScore = 91;
      marketRatingLevel = 'Elite';
      marketDescription = 'Heavy academy integration; consistently generates massive net transfer profits from star sales.';
      marketImpact = '-70% Transfer Outlays + Regular Academy Sales';
      break;
    case 'Bargain Hunter':
      transferSpendMultiplier = 0.55;
      marketScore = 78;
      marketRatingLevel = 'Prudent';
      marketDescription = 'Specializes in free transfers, end-of-contract stars, and smart loan options.';
      marketImpact = '-45% Transfer Outlays + Controlled Fee Amortization';
      break;
    case 'Aggressive Spender':
      transferSpendMultiplier = 1.25;
      marketScore = 44;
      marketRatingLevel = 'High Risk';
      marketDescription = 'Pays inflated transfer valuations and large agent commissions to win signature races.';
      marketImpact = '+25% Premium Transfer Costs & High Fee Liabilities';
      break;
    case 'Reckless Gambler':
      transferSpendMultiplier = 1.65;
      marketScore = 20;
      marketRatingLevel = 'Critical';
      marketDescription = 'High-risk leveraged signing sprees with unhedged clauses and low resale equity.';
      marketImpact = '+65% Transfer Splurge & Toxic Amortization Burden';
      break;
  }

  // Calculate actual transfer outlays
  const baseTransferSpend = isTier2 
    ? Math.max(1200000, Math.round((club.transferBudget || 10000000) * 0.35 * transferSpendMultiplier))
    : Math.max(6000000, Math.round((club.transferBudget || 60000000) * 0.45 * transferSpendMultiplier));
  const estimatedTransferSpend = baseTransferSpend;

  // =========================================================================
  // FACTOR 2: MANAGEMENT & BOARD GOVERNANCE (Wage discipline & ops overhead)
  // =========================================================================
  let mgmtStyle: 'Austerity & Sustainable' | 'Prudent Traditionalist' | 'Corporate Growth' | 'Sugar-Daddy Aggressive' | 'Chaotic Mismanagement' =
    club.managementStyle || (isTier2 ? 'Austerity & Sustainable' : club.chairmanTrust > 75 ? 'Prudent Traditionalist' : 'Corporate Growth');

  let wageCostMultiplier = 1.0;
  let mgmtScore = 70;
  let mgmtRatingLevel: FfpFactorDetail['ratingLevel'] = 'Moderate';
  let mgmtDescription = 'Standard board governance with typical operational spending.';
  let mgmtImpact = 'Standard baseline wage hierarchy.';

  switch (mgmtStyle) {
    case 'Austerity & Sustainable':
      wageCostMultiplier = 0.80;
      mgmtScore = 96;
      mgmtRatingLevel = 'Elite';
      mgmtDescription = 'Disciplined salary cap (<=55% turnover), zero frivolous payouts, hard wage ceilings.';
      mgmtImpact = '-20% Squad Payroll + Strict Cost Controls';
      break;
    case 'Prudent Traditionalist':
      wageCostMultiplier = 0.90;
      mgmtScore = 85;
      mgmtRatingLevel = 'Prudent';
      mgmtDescription = 'Conservative fiscal framework, emergency reserves maintained, wage hierarchy preserved.';
      mgmtImpact = '-10% Squad Payroll + Healthy Cash Buffers';
      break;
    case 'Corporate Growth':
      wageCostMultiplier = 1.00;
      mgmtScore = 70;
      mgmtRatingLevel = 'Moderate';
      mgmtDescription = 'Corporate commercial strategy; balances calculated wage investments with revenue expansion.';
      mgmtImpact = 'Balanced wage-to-revenue ratio (~65%)';
      break;
    case 'Sugar-Daddy Aggressive':
      wageCostMultiplier = 1.22;
      mgmtScore = 38;
      mgmtRatingLevel = 'High Risk';
      mgmtDescription = 'Owner subsidies inflate wage structures; vulnerable to severe sanctions if subsidies are curtailed.';
      mgmtImpact = '+22% Inflated Wages + High Overhead Exposure';
      break;
    case 'Chaotic Mismanagement':
      wageCostMultiplier = 1.45;
      mgmtScore = 18;
      mgmtRatingLevel = 'Critical';
      mgmtDescription = 'Rampant wage inflation, deadwood on long guaranteed deals, severance churn & operational leakage.';
      mgmtImpact = '+45% Bloated Payroll & High Severance Overhead';
      break;
  }

  // Calculate annual wage bill
  const totalWeeklyWagesFromSquad = clubPlayers.reduce((acc, p) => acc + (p.wage || 0), 0);
  let weeklyWageBill: number;
  if (totalWeeklyWagesFromSquad > 0) {
    weeklyWageBill = Math.round(totalWeeklyWagesFromSquad * wageCostMultiplier);
  } else {
    const baseWeeklyBudget = club.wageBudget || (isTier2 ? 320000 : 2200000);
    weeklyWageBill = Math.round(baseWeeklyBudget * (isTier2 ? 0.65 : 0.80) * wageCostMultiplier);
  }
  const annualWageBill = weeklyWageBill * 52;

  // =========================================================================
  // FACTOR 3: INCOME & REVENUE STREAMS (Commercial, Matchday, TV Broadcast)
  // =========================================================================
  const incomeRating = club.incomeStreamRating ?? (isTier2 ? Math.min(85, Math.max(48, club.reputation - 5)) : Math.min(99, Math.max(65, club.reputation)));
  
  let incomeScore = Math.min(100, Math.max(10, incomeRating));
  let incomeRatingLevel: FfpFactorDetail['ratingLevel'] = 'Moderate';
  let commercialTier = 'Standard Domestic Yield';
  let incomeDescription = 'Stable revenue supported by regional attendance and domestic broadcast distributions.';
  let incomeImpact = 'Steady operational turnover.';

  if (incomeScore >= 88) {
    incomeRatingLevel = 'Elite';
    commercialTier = 'Global Commercial Heavyweight';
    incomeDescription = 'Massive global merchandising, prime European broadcast pool, and high matchday yield.';
    incomeImpact = 'High turnover buffer shielding club from deficits';
  } else if (incomeScore >= 72) {
    incomeRatingLevel = 'Prudent';
    commercialTier = 'Robust Mid-Tier Revenue Base';
    incomeDescription = 'Solid domestic sponsorship deals, strong season-ticket base, and reliable broadcast share.';
    incomeImpact = 'Healthy revenue stream fully financing standard operations';
  } else if (incomeScore >= 50) {
    incomeRatingLevel = 'Moderate';
    commercialTier = 'Developing Regional Stream';
    incomeDescription = 'Moderate ticketing and lower-tier commercial partnerships.';
    incomeImpact = 'Moderate turnover requiring disciplined wage management';
  } else {
    incomeRatingLevel = 'High Risk';
    commercialTier = 'Depressed Revenue Base';
    incomeDescription = 'Limited commercial sponsorships, low stadium attendance, and minimal television distributions.';
    incomeImpact = 'Constrained revenue heightening deficit risks';
  }

  // Realistic revenue modeling by Tier
  let calculatedAnnualRevenue: number;
  if (club.seasonRevenue !== undefined && club.seasonRevenue > 0) {
    calculatedAnnualRevenue = club.seasonRevenue;
  } else {
    const rep = club.reputation || 65;
    const capacity = club.stadiumCapacity || (isTier2 ? 22000 : 50000);
    if (isTier2) {
      // Division 2 clubs generate ~€32M - €65M annually (from EFL Championship / Serie B broadcast, ticket sales & commercial)
      const baseBroadcast = rep * 550000;
      const matchdayAnnual = capacity * 380;
      calculatedAnnualRevenue = Math.round((baseBroadcast + matchdayAnnual) * (incomeScore / 68));
    } else {
      // Division 1 clubs generate ~€120M - €380M annually
      const baseBroadcast = rep * 1900000;
      const matchdayAnnual = capacity * 750;
      calculatedAnnualRevenue = Math.round((baseBroadcast + matchdayAnnual) * (incomeScore / 76));
    }
  }
  const revenueThisSeason = calculatedAnnualRevenue;

  // =========================================================================
  // FACTOR 4: ABILITY TO BALANCE THE BOOKS (Fiscal discipline & debt service)
  // =========================================================================
  let bookBalancingScore = club.bookBalancingCompetence;
  if (bookBalancingScore === undefined) {
    // Derive from management and market dealing if not explicitly seeded
    const combinedScore = (mgmtScore * 0.6) + (marketScore * 0.4);
    bookBalancingScore = Math.round(combinedScore);
  }
  bookBalancingScore = Math.min(100, Math.max(10, bookBalancingScore));

  let bookRatingLevel: FfpFactorDetail['ratingLevel'] = 'Moderate';
  let bookDescription = 'Standard balance sheet management; meets regulatory reporting standards.';
  let bookImpact = 'No extraordinary debt service penalties.';
  let structuralDebtOverhead = 0;
  let isBalanced = true;

  if (bookBalancingScore >= 82) {
    bookRatingLevel = 'Elite';
    bookDescription = 'Master of the balance sheet. Flawlessly amortizes contracts, minimizes debt, maintains surplus reserves.';
    bookImpact = '+€4M Accounting Prudence Buffer & Zero Unfunded Debt';
    structuralDebtOverhead = 0;
    isBalanced = true;
  } else if (bookBalancingScore >= 65) {
    bookRatingLevel = 'Prudent';
    bookDescription = 'Balanced accounting. Manages cashflows prudently and maintains sustainable debt ratios.';
    bookImpact = 'Solvent bookkeeping with stable debt-servicing';
    structuralDebtOverhead = 0;
    isBalanced = true;
  } else if (bookBalancingScore >= 45) {
    bookRatingLevel = 'High Risk';
    bookDescription = 'Over-leveraged bookkeeping. High debt-servicing costs and unamortized contract liabilities.';
    bookImpact = `+${formatMoney(isTier2 ? 3500000 : 9000000)} Annual Debt Service Overhead`;
    structuralDebtOverhead = isTier2 ? 3500000 : 9000000;
    isBalanced = false;
  } else {
    bookRatingLevel = 'Critical';
    bookDescription = 'Chronic inability to balance books. Off-balance sheet liabilities, unhedged loans, and insolvency drag.';
    bookImpact = `+${formatMoney(isTier2 ? 8500000 : 22000000)} Toxic Debt Drag & Financing Penalties`;
    structuralDebtOverhead = isTier2 ? 8500000 : 22000000;
    isBalanced = false;
  }

  // =========================================================================
  // OVERALL SPENDING, ALLOWABLE LIMIT & FFP COMPLIANCE CALCULATION
  // =========================================================================
  let spentThisSeason = club.seasonSpent;
  if (spentThisSeason === undefined) {
    spentThisSeason = Math.round(estimatedTransferSpend + annualWageBill + structuralDebtOverhead);
  }

  // FFP Allowable Loss threshold:
  // Tier 1 allows up to €30M loss; Tier 2 allows up to €12M loss, with bonus buffer for high book-balancing clubs
  const baseAllowableLoss = isTier2 ? 12000000 : 30000000;
  const bookBalancingBonus = bookBalancingScore >= 80 ? (isTier2 ? 3000000 : 6000000) : 0;
  const allowableLoss = baseAllowableLoss + bookBalancingBonus;
  const ffpLimit = revenueThisSeason + allowableLoss;

  const debtRatio = Math.min(240, Math.max(10, Math.round((spentThisSeason / Math.max(1, revenueThisSeason)) * 100)));
  const overspendAmount = Math.max(0, spentThisSeason - ffpLimit);
  const surplusAmount = Math.max(0, ffpLimit - spentThisSeason);

  // Overall Financial Health Score (0 - 100) combining the 4 factors
  const overallHealthScore = Math.round(
    (marketScore * 0.25) +
    (mgmtScore * 0.30) +
    (incomeScore * 0.20) +
    (bookBalancingScore * 0.25)
  );

  // Status & Alerts:
  let status: 'Compliant' | 'At Risk' | 'In FFP Breach' = 'Compliant';
  let alertSeverity: 'none' | 'warning' | 'critical' = 'none';
  let alertMessage = `Club finances are solvent and compliant. Total spending of ${formatMoney(spentThisSeason)} is within the ${formatMoney(ffpLimit)} allowable limit (Debt Ratio: ${debtRatio}%). Supported by ${marketStrategy} dealing and ${mgmtStyle} management.`;

  // Determine breach / risk conditions based on all 4 factors
  const hasInsolvencyDrag = bookBalancingScore < 40;
  const hasSevereOverspending = overspendAmount > (isTier2 ? 3000000 : 10000000);
  const hasExcessiveDebtRatio = debtRatio > 118;
  const hasChaoticManagement = mgmtStyle === 'Chaotic Mismanagement' && debtRatio > 105;

  if (hasSevereOverspending || (hasExcessiveDebtRatio && hasInsolvencyDrag) || (hasChaoticManagement && overspendAmount > 0)) {
    status = 'In FFP Breach';
    alertSeverity = 'critical';
    alertMessage = `🚨 CRITICAL FFP BREACH: ${club.name} has breached allowable limits by ${formatMoney(overspendAmount || 8500000)} (Debt Ratio: ${debtRatio}%). Driven by ${marketStrategy} transfer dealing, ${mgmtStyle}, and an inability to balance books (${bookBalancingScore}/100). Facing mandatory point deductions at seasonal audit!`;
  } else if (debtRatio > 102 || overspendAmount > 0 || (bookBalancingScore < 50 && debtRatio > 88) || (marketStrategy === 'Aggressive Spender' && debtRatio > 92)) {
    status = 'At Risk';
    alertSeverity = 'warning';
    alertMessage = `⚠️ FFP DEFICIT WARNING: ${club.name} is approaching the allowable loss limit (Debt Ratio: ${debtRatio}%). Deficit pressures from ${mgmtStyle} and ${marketStrategy} require contract restructuring before audit.`;
  }

  const isWithinFfp = status === 'Compliant';

  // 4-Factors detailed object
  const factors: ClubFfpFactors = {
    marketDealing: {
      strategy: marketStrategy,
      label: 'Market Dealing',
      score: marketScore,
      ratingLevel: marketRatingLevel,
      description: marketDescription,
      financialImpact: marketImpact,
      transferSpendMultiplier,
      netTransferSpend: estimatedTransferSpend
    },
    management: {
      governanceStyle: mgmtStyle,
      label: 'Management & Governance',
      score: mgmtScore,
      ratingLevel: mgmtRatingLevel,
      description: mgmtDescription,
      financialImpact: mgmtImpact,
      wageCostMultiplier,
      operationalDisciplineScore: mgmtScore
    },
    income: {
      label: 'Income & Revenue Stream',
      score: incomeScore,
      ratingLevel: incomeRatingLevel,
      description: incomeDescription,
      financialImpact: incomeImpact,
      incomeRating: incomeScore,
      annualRevenue: revenueThisSeason,
      commercialTier
    },
    bookBalancing: {
      label: 'Book Balancing Ability',
      score: bookBalancingScore,
      ratingLevel: bookRatingLevel,
      description: bookDescription,
      financialImpact: bookImpact,
      competenceScore: bookBalancingScore,
      structuralDebtOrSurplus: structuralDebtOverhead > 0 ? -structuralDebtOverhead : surplusAmount,
      isBalanced
    },
    overallHealthScore
  };

  // Recommended actions for user agency & governance
  const myClientsAtClub = clubPlayers.filter(p => p.isMyClient);

  const recommendedActions: FfpActionOption[] = [
    {
      id: 'restructure',
      title: 'Advise Client Contract Restructure',
      description: `Negotiate voluntary wage restructuring & bonus deferral with your clients at ${club.name} to cut club debt.`,
      impactLabel: 'Restructure wage commitments, +20 Chairman Trust, +15 Loyalty',
      iconType: 'FileText',
      category: 'agency',
      isAvailable: myClientsAtClub.length > 0,
      unavailableReason: 'No agency clients currently signed to this club.'
    },
    {
      id: 'fine',
      title: 'Levy Governance Financial Fine (€10M)',
      description: `Impose an official €10,000,000 regulatory fine on ${club.name} for financial fair play overspending.`,
      impactLabel: 'Transfers €10M into Federation Treasury & +4 Reputation',
      iconType: 'Coins',
      category: 'governance',
      isAvailable: status !== 'Compliant',
      unavailableReason: 'Club is currently FFP compliant.'
    },
    {
      id: 'points',
      title: 'Apply -6 Points Deduction Penalty',
      description: `Issue immediate 6-point deduction penalty in official league standings for severe fiscal overspending.`,
      impactLabel: 'Deducts 6 Points from club league tally',
      iconType: 'TrendingDown',
      category: 'governance',
      isAvailable: status === 'In FFP Breach',
      unavailableReason: 'Requires club to be in active FFP Breach.'
    },
    {
      id: 'ban',
      title: 'Impose 2-Window Transfer Embargo',
      description: `Block ${club.name} from registering new domestic and international incoming signings for 2 consecutive transfer windows.`,
      impactLabel: 'Freezes incoming player registration rights',
      iconType: 'Ban',
      category: 'governance',
      isAvailable: status !== 'Compliant',
      unavailableReason: 'Club is currently FFP compliant.'
    },
    {
      id: 'leak',
      title: 'Leak Forensic Whistleblower Dossier',
      description: `Fund forensic accounting investigation (€500k) to leak off-balance-sheet debt records to UEFA/FIFA investigators.`,
      impactLabel: 'Triggers global investigation & +5 Dark Arts Score',
      iconType: 'ShieldAlert',
      category: 'dark_arts',
      isAvailable: true
    },
    {
      id: 'audit',
      title: 'Order Mandatory Austerity Audit',
      description: `Force club board into statutory administration monitoring and mandate a 15% reduction in player wage expenditure.`,
      impactLabel: 'Lowers club debt ratio by 15% and enforces fiscal ceiling',
      iconType: 'Scale',
      category: 'governance',
      isAvailable: true
    },
    {
      id: 'firesale',
      title: 'Exploit FFP Distress Fire-Sale',
      description: `Exploit ${club.name}'s insolvency to demand expedited transfer departures for squad players at a 30% distress discount.`,
      impactLabel: 'Unlocks 30% discount on outgoing player transfers',
      iconType: 'DollarSign',
      category: 'agency',
      isAvailable: status !== 'Compliant',
      unavailableReason: 'Club is not in financial distress.'
    }
  ];

  return {
    spentThisSeason,
    spending: spentThisSeason,
    transferSpending: estimatedTransferSpend,
    revenueThisSeason,
    annualWageBill,
    weeklyWageBill,
    ffpLimit,
    allowableCap: ffpLimit,
    allowableLossCap: ffpLimit,
    debtRatio,
    debtLevel: overspendAmount,
    estimatedDebt: overspendAmount,
    status,
    overspendAmount,
    surplusAmount,
    isWithinFfp,
    alertSeverity,
    alertMessage,
    recommendedActions,
    netSpend: spentThisSeason,
    annualPayroll: annualWageBill,
    spendingRatio: debtRatio,
    factors
  };
}

/**
 * Restructure a client's contract to alleviate club debt and improve FFP standing.
 */
export function restructureClientContractForDebt(
  player: Player,
  club: Club,
  agency: AgencyState
): {
  updatedPlayer: Player;
  updatedClub: Club;
  updatedAgency: AgencyState;
  debtReduced: number;
  message: string;
} {
  const weeklyWageReduction = Math.round(player.wage * 0.18);
  const annualDebtReduced = weeklyWageReduction * 52;
  const newWage = Math.max(1000, player.wage - weeklyWageReduction);
  const consultingFee = 150000; // Agent consulting bonus for facilitating restructuring

  const updatedPlayer: Player = {
    ...player,
    wage: newWage,
    contractYears: (player.contractYears || 2) + 1, // Add 1 year contract security
    loyalty: Math.min(100, (player.loyalty ?? 80) + 15),
    morale: Math.min(100, (player.morale || 80) + 10)
  };

  const currentSpent = club.seasonSpent ?? (club.reputation * 1500000);
  const updatedClub: Club = {
    ...club,
    seasonSpent: Math.max(0, currentSpent - annualDebtReduced),
    transferBudget: club.transferBudget + Math.round(annualDebtReduced * 0.5),
    chairmanTrust: Math.min(100, club.chairmanTrust + 20),
    wageBudget: club.wageBudget + weeklyWageReduction,
    bookBalancingCompetence: Math.min(100, (club.bookBalancingCompetence || 65) + 12)
  };

  const updatedAgency: AgencyState = {
    ...agency,
    balance: agency.balance + consultingFee,
    reputation: Math.min(100, agency.reputation + 4)
  };

  return {
    updatedPlayer,
    updatedClub,
    updatedAgency,
    debtReduced: annualDebtReduced,
    message: `Contract restructured for ${player.name}! Slashed annual club wage debt by ${formatMoney(annualDebtReduced)} (-18% wage, +1 yr contract extension). +${formatMoney(consultingFee)} agent advisory fee received and Chairman Trust boosted to ${updatedClub.chairmanTrust}%.`
  };
}

/**
 * Bulk restructure all user clients playing at clubs that are At Risk or In FFP Breach.
 */
export function bulkRestructureClientsAtRisk(
  players: Player[],
  clubs: Club[],
  agency: AgencyState
): {
  updatedPlayers: Player[];
  updatedClubs: Club[];
  updatedAgency: AgencyState;
  totalDebtReduced: number;
  restructuredCount: number;
  totalSavingsAnnual: number;
  totalBonusEarned: number;
  count: number;
} {
  let currentPlayers = [...players];
  let currentClubs = [...clubs];
  let currentAgency = { ...agency };
  let totalDebtReduced = 0;
  let restructuredCount = 0;

  const atRiskClubIds = new Set(
    clubs
      .filter(c => {
        const metrics = calculateClubFfpMetrics(c, players);
        return metrics.status !== 'Compliant';
      })
      .map(c => c.id)
  );

  currentPlayers = currentPlayers.map(p => {
    if (p.isMyClient && atRiskClubIds.has(p.clubId)) {
      const club = currentClubs.find(c => c.id === p.clubId);
      if (club) {
        const res = restructureClientContractForDebt(p, club, currentAgency);
        currentClubs = currentClubs.map(c => c.id === club.id ? res.updatedClub : c);
        currentAgency = res.updatedAgency;
        totalDebtReduced += res.debtReduced;
        restructuredCount += 1;
        return res.updatedPlayer;
      }
    }
    return p;
  });

  return {
    updatedPlayers: currentPlayers,
    updatedClubs: currentClubs,
    updatedAgency: currentAgency,
    totalDebtReduced,
    restructuredCount,
    totalSavingsAnnual: totalDebtReduced,
    totalBonusEarned: restructuredCount * 150000,
    count: restructuredCount
  };
}

/**
 * Convenience wrapper returning extended details for Federation governance and league inspectors.
 */
export function getClubFfpDetails(
  club: Club,
  players: Player[] = [],
  _currentWeek: number = 1,
  isSquadPreFiltered: boolean = false
): ClubFfpMetrics & {
  netSpend: number;
  annualPayroll: number;
  allowableLossCap: number;
  estimatedDebt: number;
  spendingRatio: number;
} {
  const metrics = calculateClubFfpMetrics(club, players, isSquadPreFiltered);
  return {
    ...metrics,
    netSpend: metrics.spentThisSeason,
    annualPayroll: metrics.annualWageBill,
    allowableLossCap: metrics.ffpLimit,
    estimatedDebt: metrics.overspendAmount,
    spendingRatio: metrics.debtRatio
  };
}

/**
 * High-speed batch FFP calculation for 500 clubs.
 * Pre-indexes 10,000 players by clubId once in O(N),
 * dropping evaluation from 5,000,000 quadratic loops to ~10,500 operations (500x speedup).
 */
export function getBatchClubFfpMap(
  clubs: Club[],
  players: Player[],
  currentWeek: number = 1
): Map<string, ClubFfpMetrics & {
  netSpend: number;
  annualPayroll: number;
  allowableLossCap: number;
  estimatedDebt: number;
  spendingRatio: number;
}> {
  const playersByClub = new Map<string, Player[]>();
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    let list = playersByClub.get(p.clubId);
    if (!list) {
      list = [];
      playersByClub.set(p.clubId, list);
    }
    list.push(p);
  }

  const result = new Map<string, any>();
  for (let i = 0; i < clubs.length; i++) {
    const club = clubs[i];
    const squad = playersByClub.get(club.id) || [];
    const details = getClubFfpDetails(club, squad, currentWeek, true);
    result.set(club.id, details);
  }
  return result;
}

/**
 * Restructure client contract alias returning compatible object fields.
 */
export function restructureClientContract(
  player: Player,
  club: Club,
  agency: AgencyState
): {
  updatedPlayer: Player;
  updatedClub: Club;
  updatedAgency: AgencyState;
  savingsAnnual: number;
  bonusEarned: number;
  message: string;
} {
  const res = restructureClientContractForDebt(player, club, agency);
  return {
    updatedPlayer: res.updatedPlayer,
    updatedClub: res.updatedClub,
    updatedAgency: res.updatedAgency,
    savingsAnnual: res.debtReduced,
    bonusEarned: 150000,
    message: res.message
  };
}

/**
 * Executes a formal federation disciplinary sanction on a club.
 */
export function executeClubSanctions(
  club: Club,
  sanctionType: 'fine' | 'points_deduction' | 'transfer_ban' | 'forensic_audit' | 'wage_slash_order',
  agency: AgencyState
): {
  updatedClub: Club;
  updatedAgency: AgencyState;
  summaryMessage: string;
} {
  let updatedClub = { ...club };
  let updatedAgency = { ...agency };
  let summaryMessage = '';

  switch (sanctionType) {
    case 'fine': {
      const fineAmount = 10000000;
      updatedClub.transferBudget = Math.max(0, updatedClub.transferBudget - fineAmount);
      updatedClub.ffpSanctionStatus = 'fined';
      updatedAgency.balance += fineAmount;
      updatedAgency.reputation = Math.min(100, updatedAgency.reputation + 4);
      summaryMessage = `⚖️ FFP Sanction: Levied €10,000,000 regulatory fine on ${club.name}! Fine revenues paid into treasury.`;
      break;
    }
    case 'points_deduction': {
      const deduction = 6;
      updatedClub.points = Math.max(0, updatedClub.points - deduction);
      updatedClub.ffpSanctionStatus = 'points_deducted';
      summaryMessage = `⚖️ FFP Sanction: Deducted -6 points from ${club.name} in official league standings!`;
      break;
    }
    case 'transfer_ban': {
      updatedClub.ffpSanctionStatus = 'transfer_banned';
      summaryMessage = `⚖️ FFP Sanction: Imposed 2-window transfer registration ban on ${club.name}! Incoming signings frozen.`;
      break;
    }
    case 'wage_slash_order': {
      updatedClub.wageBudget = Math.max(500000, Math.round(updatedClub.wageBudget * 0.85));
      summaryMessage = `⚖️ FFP Sanction: Mandated 15% squad wage expenditure slash for ${club.name} to enforce solvent operations.`;
      break;
    }
    case 'forensic_audit': {
      if (agency.balance < 500000) {
        throw new Error('Need €500,000 in agency balance to fund forensic audit whistleblower investigation!');
      }
      updatedAgency.balance -= 500000;
      updatedAgency.darkArtsScore = (updatedAgency.darkArtsScore || 0) + 5;
      summaryMessage = `🕵️ Dark Arts Whistleblower Leak: Forensic accounting leak for ${club.name} sent to FIFA / UEFA FFP committee! (+5 Dark Arts)`;
      break;
    }
  }

  return {
    updatedClub,
    updatedAgency,
    summaryMessage
  };
}
