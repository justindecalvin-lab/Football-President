import { Player, Club, PlayerTransferPreference, ContractClauses, AgencyState, NewsItem } from '../types';
import { formatMoney, isPlayerHomegrownInLeague, canClubRegisterMoreForeignPlayers } from './gameEngine';

export interface TransferEvaluationResult {
  allowed: boolean;
  verdict: string;
  quote: string;
  refusalType?: 'club_too_small' | 'no_champions_league' | 'wage_too_low' | 'rival_hated_club' | 'loves_current_club' | 'prefers_tier1' | 'recently_transferred';
  severity: 'low' | 'medium' | 'high';
  canBribeSweetener?: boolean;
  sweetenerCostRequired?: number;
  isLockedToLoanOnly?: boolean;
  nextAllowedWindowName?: string;
  clauseHighlights?: string[];
}

export interface PlayerTransferEligibility {
  canTransferPermanently: boolean;
  canLoan: boolean;
  isRecentlyTransferred: boolean;
  lockedReason?: string;
  nextAllowedWindowName?: string;
  transferredFromClubName?: string;
  lastTransferWeek?: number;
  lastTransferSeason?: number;
}

/**
 * Checks if the global transfer window is open based on matchweek
 * (Summer Window: Weeks 1-8, Winter Window: Weeks 20-24)
 */
export function isTransferWindowOpen(week: number): boolean {
  return (week >= 1 && week <= 8) || (week >= 20 && week <= 24);
}

/**
 * Returns a unique string ID for the transfer window active at the given week/season
 */
export function getCurrentTransferWindowId(season: number = 2026, week: number = 1): string {
  if (week >= 1 && week <= 8) {
    return `s${season}_summer`;
  } else if (week >= 20 && week <= 24) {
    return `s${season}_winter`;
  } else if (week > 8 && week < 20) {
    return `s${season}_midseason_closed`;
  } else {
    return `s${season}_lateseason_closed`;
  }
}

/**
 * Returns user-friendly name of the next opening transfer window
 */
export function getNextTransferWindowName(season: number = 2026, week: number = 1): string {
  if (week <= 8) {
    return `Season ${season} Winter Window (Week 20)`;
  } else if (week <= 24) {
    return `Season ${season + 1} Summer Window (Week 1)`;
  } else {
    return `Season ${season + 1} Summer Window (Week 1)`;
  }
}

/**
 * Evaluates whether a player can be transferred permanently or only on loan.
 * Rule: After a player moves to a new club, he cannot be transferred to another club
 * until a new transfer window, OR only on loan.
 */
export function checkPlayerTransferEligibility(
  player: Player,
  currentWeek: number = 1,
  currentSeason: number = 2026
): PlayerTransferEligibility {
  // If player is currently out on loan, they cannot be permanently transferred
  if (player.isOnLoan) {
    return {
      canTransferPermanently: false,
      canLoan: false,
      isRecentlyTransferred: false,
      lockedReason: `${player.name} is currently on loan at ${player.loanDetails?.loaneeClubName || 'another club'} and cannot be transferred until the loan finishes or is recalled.`
    };
  }

  // Free agents can sign anywhere permanently or on loan
  if (!player.clubId || player.clubId === 'free_agent' || player.clubName === 'Free Agent') {
    return {
      canTransferPermanently: true,
      canLoan: true,
      isRecentlyTransferred: false
    };
  }

  const currentWindowId = getCurrentTransferWindowId(currentSeason, currentWeek);

  // Check if player transferred during this same window
  const isSameWindowId = Boolean(player.lastTransferWindowId && player.lastTransferWindowId === currentWindowId);
  const isSameSeasonAndRecentlyMoved = Boolean(
    player.lastTransferSeason === currentSeason &&
    player.lastTransferWeek !== undefined &&
    (
      // Both in summer window (weeks 1-8)
      (currentWeek <= 8 && player.lastTransferWeek <= 8) ||
      // Both in winter window (weeks 20-24)
      (currentWeek >= 20 && currentWeek <= 24 && player.lastTransferWeek >= 20 && player.lastTransferWeek <= 24) ||
      // Transferred within the last 4 weeks regardless
      (currentWeek - player.lastTransferWeek >= 0 && currentWeek - player.lastTransferWeek < 4)
    )
  );

  const isTransferredThisWindow = isSameWindowId || isSameSeasonAndRecentlyMoved || Boolean(player.transferredInCurrentWindow);

  if (isTransferredThisWindow) {
    const nextWindow = getNextTransferWindowName(currentSeason, currentWeek);
    return {
      canTransferPermanently: false,
      canLoan: true, // CAN STILL BE MOVED ON LOAN!
      isRecentlyTransferred: true,
      lockedReason: `Recently moved to ${player.clubName} in this transfer window (Wk ${player.lastTransferWeek ?? currentWeek}, ${player.lastTransferSeason ?? currentSeason}). Under FIFA & League registration rules, a player cannot make two permanent club transfers in the same window. Only LOAN transfers are permitted until ${nextWindow}.`,
      nextAllowedWindowName: nextWindow,
      transferredFromClubName: player.transferredFromClubName,
      lastTransferWeek: player.lastTransferWeek,
      lastTransferSeason: player.lastTransferSeason
    };
  }

  return {
    canTransferPermanently: true,
    canLoan: true,
    isRecentlyTransferred: false
  };
}

// Major Football Derbies & Bitter Rivalries
const RIVALRY_PAIRS: [string, string][] = [
  ['Real Madrid', 'Barcelona'],
  ['Manchester City', 'Manchester United'],
  ['Manchester United', 'Liverpool'],
  ['Arsenal', 'Tottenham'],
  ['Inter Milan', 'AC Milan'],
  ['Inter Milan', 'Juventus'],
  ['AC Milan', 'Juventus'],
  ['Bayern Munich', 'Dortmund'],
  ['Paris Saint-Germain', 'Marseille'],
  ['Chelsea', 'Tottenham'],
  ['Chelsea', 'Arsenal'],
  ['Atletico Madrid', 'Real Madrid']
];

function isBitterRival(club1Name: string, club2Name: string): boolean {
  if (!club1Name || !club2Name) return false;
  const c1 = club1Name.toLowerCase();
  const c2 = club2Name.toLowerCase();

  return RIVALRY_PAIRS.some(([r1, r2]) => {
    const r1L = r1.toLowerCase();
    const r2L = r2.toLowerCase();
    return (c1.includes(r1L) && c2.includes(r2L)) || (c1.includes(r2L) && c2.includes(r1L));
  });
}

function isChampionsLeagueTier(club: { name: string; reputation?: number; league?: string }): boolean {
  const rep = club.reputation ?? 75;
  const uclLeagues = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'];
  const isTopLeague = uclLeagues.some(l => club.league?.toLowerCase().includes(l.toLowerCase()));
  return rep >= 88 && isTopLeague;
}

/**
 * Evaluates whether a player agrees to move to a destination club or refuses
 * based on stature, UCL aspirations, wages, rivalries, loyalty, transfer window eligibility,
 * and contract governance clauses.
 */
export function evaluatePlayerTransferAcceptance(
  player: Player,
  destinationClub: { id?: string; name: string; reputation?: number; league?: string; tier?: number },
  offeredWage: number,
  isLoan: boolean = false,
  currentWeek: number = 1,
  currentSeason: number = 2026,
  offeredClauses?: ContractClauses
): TransferEvaluationResult {
  const destRep = destinationClub.reputation ?? 78;
  const playerRating = player.rating || 75;
  const currentWage = player.wage || 30000;
  const morale = player.morale ?? 80;
  const loyalty = player.loyalty ?? 75;
  const isSuperstar = playerRating >= 85;
  const isPrimeStar = playerRating >= 80;
  const clauseHighlights: string[] = [];

  // Clause Value Calculations
  const imageRightsShare = offeredClauses?.imageRightsPercent ?? 20;
  const loyaltyBonusAnnual = offeredClauses?.loyaltyBonus ?? 0;
  const loyaltyWeeklyEquiv = Math.round(loyaltyBonusAnnual / 52);
  const ballonDorBonus = offeredClauses?.ballonDorBonus ?? 0;
  const intCapBonus = offeredClauses?.internationalCapBonus ?? 0;
  const uclBonus = offeredClauses?.championsLeagueBonus ?? 0;
  const hasRelegationRelease = Boolean(offeredClauses?.relegationRelease);
  const wageProtectionFloor = offeredClauses?.relegationWageProtectionPercent ?? 0;
  const hasFirstRefusal = Boolean(offeredClauses?.firstRefusalOption);
  const hasMarqueeTag = Boolean(offeredClauses?.marqueeStatusClause);
  const hasAutoExtension = Boolean(offeredClauses?.autoExtensionOption);

  if (imageRightsShare > 25) {
    clauseHighlights.push(`${imageRightsShare}% Commercial Image Rights share`);
  }
  if (loyaltyBonusAnnual >= 1000000) {
    clauseHighlights.push(`${formatMoney(loyaltyBonusAnnual)}/yr Loyalty Retention bonus`);
  }
  if (ballonDorBonus >= 2000000) {
    clauseHighlights.push(`${formatMoney(ballonDorBonus)} Ballon d'Or incentive clause`);
  }
  if (hasMarqueeTag) {
    clauseHighlights.push('Marquee FFP Wage Cap Exemption');
  }
  if (wageProtectionFloor >= 80 || hasRelegationRelease) {
    clauseHighlights.push('Downside Relegation Protection Clause');
  }

  // Effective Total Weekly Value (Wages + Weekly Perks & Bonuses)
  const imageRightsWeeklyValue = Math.round(offeredWage * Math.max(0, imageRightsShare - 20) / 100);
  const effectiveWeeklyCompensation = offeredWage + loyaltyWeeklyEquiv + intCapBonus + imageRightsWeeklyValue;

  // 0. Transfer Window Rule: Permanent Transfer Blocked if already moved in current window (Loan Only)
  if (!isLoan) {
    const eligibility = checkPlayerTransferEligibility(player, currentWeek, currentSeason);
    if (!eligibility.canTransferPermanently) {
      return {
        allowed: false,
        refusalType: 'recently_transferred',
        severity: 'high',
        isLockedToLoanOnly: true,
        nextAllowedWindowName: eligibility.nextAllowedWindowName,
        verdict: `Window Transfer Lock: ${player.name} transferred to ${player.clubName} during this window. Permanent moves are blocked until ${eligibility.nextAllowedWindowName || 'the next transfer window'}. Only loan moves are permitted.`,
        quote: `"${player.name}: 'I recently joined ${player.clubName} in this transfer window! Under league registration guidelines, I cannot complete another permanent move in the same window. Only a loan departure is permitted until ${eligibility.nextAllowedWindowName || 'the next transfer window'}!'"`,
        canBribeSweetener: false
      };
    }
  }

  // 1. Bitter Derby / Hated Rivalry Refusal
  if (player.clubName && isBitterRival(player.clubName, destinationClub.name)) {
    return {
      allowed: false,
      refusalType: 'rival_hated_club',
      severity: 'high',
      verdict: `Mortal Rivalry Refusal: ${player.name} refuses to betray ${player.clubName} supporters for ${destinationClub.name}!`,
      quote: `"${player.name}: 'I cannot wear the shirt of ${destinationClub.name}. The rivalry with ${player.clubName} runs too deep, and I will not betray our fans!'"`,
      canBribeSweetener: false
    };
  }

  // 2. Club Stature & Reputation Disparity Check ("Club too small for my calibre")
  // Elite 86+ OVR players will refuse sub-85 reputation clubs unless marquee/lucrative incentives are present
  const hasMegastarIncentives = ballonDorBonus >= 2500000 && imageRightsShare >= 35 && hasMarqueeTag;
  if (isSuperstar && destRep < 86 && !hasMegastarIncentives) {
    const sweetenerCost = Math.round(player.value * 0.05);
    return {
      allowed: false,
      refusalType: 'club_too_small',
      severity: 'high',
      verdict: `Stature Mismatch: ${player.name} (${playerRating} OVR) considers ${destinationClub.name} (Rep ${destRep}) beneath their global ambitions.`,
      quote: `"${player.name}: 'With respect to ${destinationClub.name}, I am a world-class player at ${playerRating} OVR. I expect my next move to be to a global super-club competing for the Ballon d'Or and continental crowns.'"`,
      canBribeSweetener: true,
      sweetenerCostRequired: sweetenerCost
    };
  }

  if (isPrimeStar && destRep < 76 && !(wageProtectionFloor >= 80 || hasRelegationRelease || effectiveWeeklyCompensation >= currentWage * 1.35)) {
    const sweetenerCost = Math.round(player.value * 0.03);
    return {
      allowed: false,
      refusalType: 'club_too_small',
      severity: 'medium',
      verdict: `Ambition Deficit: ${player.name} (${playerRating} OVR) believes ${destinationClub.name} lacks competitive stature.`,
      quote: `"${player.name}: 'Moving to ${destinationClub.name} feels like a step backwards in my career path. I want to play at the highest tier.'"`,
      canBribeSweetener: true,
      sweetenerCostRequired: sweetenerCost
    };
  }

  // 3. Champions League Demand Check
  const requiresUcl = isSuperstar || player.playerPreferences?.requiresChampionsLeague;
  if (requiresUcl && !isChampionsLeagueTier(destinationClub) && !isLoan && !hasMegastarIncentives) {
    return {
      allowed: false,
      refusalType: 'no_champions_league',
      severity: 'high',
      verdict: `No Champions League: ${player.name} demands European top-tier Champions League football.`,
      quote: `"${player.name}: 'I have stated to my agency that I will only consider clubs participating in the UEFA Champions League. ${destinationClub.name} cannot offer that project.'"`,
      canBribeSweetener: true,
      sweetenerCostRequired: Math.round(player.value * 0.04)
    };
  }

  // 4. Wage & Clauses Package Evaluation Check (Realistic Financial Modeling)
  const isDesperateToLeave = player.unrest?.status === 'transfer_requested' || (player.unrest && player.unrest.discontentLevel >= 80);
  const currentClubRep = 80;
  const isStepDown = destRep < currentClubRep;
  
  // Base expectation: 15% wage hike for regular moves, 25% for prime/superstars
  let wageMultiplier = isDesperateToLeave ? 0.95 : isSuperstar ? 1.25 : isPrimeStar ? 1.18 : 1.12;
  
  // If stepping down, demand extra, UNLESS downside clauses protect the player (e.g. 80%+ wage floor or relegation release)
  if (isStepDown && !isDesperateToLeave) {
    if (wageProtectionFloor >= 80 || hasRelegationRelease) {
      wageMultiplier += 0.05; // Modest step-down premium because downside is legally protected
    } else {
      wageMultiplier += 0.15; // Financial compensation demanded for stepping down in prestige
    }
  }
  
  const minRequiredWage = Math.round(currentWage * wageMultiplier);
  
  // Evaluate if direct wage OR effective compensation (wage + loyalty + image rights + bonuses) meets the threshold
  if (offeredWage < minRequiredWage && effectiveWeeklyCompensation < minRequiredWage) {
    const wageGap = Math.max(2000, minRequiredWage - effectiveWeeklyCompensation);
    return {
      allowed: false,
      refusalType: 'wage_too_low',
      severity: 'medium',
      verdict: `Wage Package Insufficient: Offered wage (${formatMoney(offeredWage)}/wk) fails to match player wage expectations (${formatMoney(minRequiredWage)}/wk).`,
      quote: `"${player.name}: 'My current earnings at ${player.clubName} are ${formatMoney(currentWage)}/wk. To sign for ${destinationClub.name}${isStepDown ? ' (which is a step down in stature)' : ''}, I demand at least ${formatMoney(minRequiredWage)}/wk or equivalent contract bonuses!'"` ,
      canBribeSweetener: true,
      sweetenerCostRequired: Math.max(100000, wageGap * 52) // 1 year wage top-up subsidy
    };
  }

  // 5. High Loyalty & Morale to Current Club ("Loves current club")
  if (loyalty >= 90 && morale >= 85 && !isLoan && destRep <= (destRep + 2)) {
    const currentClubReputation = 85;
    if (destRep <= currentClubReputation && !hasMegastarIncentives) {
      return {
        allowed: false,
        refusalType: 'loves_current_club',
        severity: 'low',
        verdict: `Club Attachment: ${player.name} is deeply settled at ${player.clubName} and refuses to be pushed out.`,
        quote: `"${player.name}: 'I love the fans, my teammates, and the manager here at ${player.clubName}. Unless an undeniable European giant comes in, I have no desire to leave.'"`,
        canBribeSweetener: true,
        sweetenerCostRequired: Math.round(player.value * 0.02)
      };
    }
  }

  // All checks passed! Player is thrilled or willing to join!
  let approvalQuote = `"${player.name}: 'The project at ${destinationClub.name} excites me! I am ready to sign the contract and fight for trophies.'"`;
  if (clauseHighlights.length > 0) {
    approvalQuote = `"${player.name}: 'I am thrilled by the terms offered by ${destinationClub.name}! The contract includes ${clauseHighlights.slice(0, 2).join(' and ')}, which shows true belief in my career.'"`;
  }
  if (isLoan) {
    approvalQuote = `"${player.name}: 'A loan move to ${destinationClub.name} is a great chance to secure guaranteed minutes and sharpen my form.'"`;
  }

  return {
    allowed: true,
    verdict: `Player Approved: ${player.name} has agreed to personal terms with ${destinationClub.name}.`,
    quote: approvalQuote,
    severity: 'low',
    clauseHighlights
  };
}

export interface ListingRequestResult {
  allowed: boolean;
  verdict: string;
  playerQuote: string;
  directorQuote: string;
  reason: 'player_refusal' | 'club_refusal' | 'approved';
}

/**
 * Evaluates whether a player's club and the player agree to be listed for transfer or loan.
 */
export function evaluateClubListingRequest(
  player: Player,
  listingType: 'transfer' | 'loan',
  currentWeek: number = 1,
  currentSeason: number = 2026
): ListingRequestResult {
  const morale = player.morale ?? 75;
  const loyalty = player.loyalty ?? 70;
  const isStarter = (player.rating || 75) >= 83;
  const hasUnrest = player.unrest && player.unrest.status !== 'content';

  // Case 0: Recently transferred in current window trying to list for permanent transfer
  if (listingType === 'transfer') {
    const eligibility = checkPlayerTransferEligibility(player, currentWeek, currentSeason);
    if (!eligibility.canTransferPermanently) {
      return {
        allowed: false,
        reason: 'club_refusal',
        verdict: `Transfer Listing Blocked: ${player.name} transferred to ${player.clubName} during this window. Regulations prohibit two permanent transfers in the same window until ${eligibility.nextAllowedWindowName || 'the next transfer window'}. However, a loan listing is permitted!`,
        playerQuote: `"${player.name}: 'I just arrived at ${player.clubName} this window. I cannot be sold again permanently in the same window, but you can list me on LOAN if you want to arrange a temporary move!'"`,
        directorQuote: `"Sporting Director: 'League regulations strictly forbid registering a player for two permanent club sales in the same window. ${player.name} can only be listed on the LOAN market until ${eligibility.nextAllowedWindowName || 'the next transfer window'}.'"`
      };
    }
  }

  // Case 1: Player loves club and refuses to be listed
  if (loyalty >= 85 && morale >= 80 && !hasUnrest) {
    return {
      allowed: false,
      reason: 'player_refusal',
      verdict: `Request Denied: ${player.name} is settled and happy at ${player.clubName} and refused the listing request.`,
      playerQuote: `"${player.name}: 'Agent, I am loving life at ${player.clubName} right now! I play every weekend, the fans chant my name, and I do not want to be ${listingType}-listed.'"`,
      directorQuote: `"Sporting Director: '${player.name} approached us and made it clear he wants to stay and fight for this club. We are rejecting your listing request.'"`
    };
  }

  // Case 2: Club considers player irreplaceable superstar and refuses to list
  if (isStarter && !hasUnrest && player.contractYears && player.contractYears >= 2 && Math.random() < 0.4) {
    return {
      allowed: false,
      reason: 'club_refusal',
      verdict: `Request Denied: ${player.clubName} refuses to list an indispensable key asset.`,
      playerQuote: `"${player.name}: 'The club hierarchy told me they have big plans for me this season and won't entertain listing me.'"`,
      directorQuote: `"Sporting Director: '${player.name} is vital to our tactical system and under long-term contract. We will NOT put him on the ${listingType} market.'"`
    };
  }

  // Case 3: Request Approved!
  let pQuote = `"${player.name}: 'Thank you for stepping in. I need a new challenge where I can showcase my true potential.'"`;
  if (listingType === 'loan') {
    pQuote = `"${player.name}: 'A loan move is exactly what I need right now to secure 90 minutes every week and rebuild my match fitness.'"`;
  }

  return {
    allowed: true,
    reason: 'approved',
    verdict: `Listing Approved: ${player.name} has been officially placed on the ${listingType === 'loan' ? 'Loan' : 'Transfer'} Market by ${player.clubName}!`,
    playerQuote: pQuote,
    directorQuote: `"Sporting Director: 'We have reviewed the situation and agreed to place ${player.name} on the ${listingType} list. Send us any formal inquiries.'"`
  };
}

export interface AiTransferMarketResult {
  updatedClubs: Club[];
  updatedPlayers: Player[];
  updatedAgency: AgencyState;
  newsItems: NewsItem[];
  transfersExecutedCount: number;
}

/**
 * Simulates a dynamic AI-to-AI transfer market during open transfer windows.
 * AI clubs proactively scout, bid, and purchase top talent or transfer-listed stars,
 * generating breaking news reports, paying agent commissions on user clients,
 * and maintaining realistic club balance sheets.
 */
export function simulateAiTransferMarket(
  clubs: Club[],
  players: Player[],
  week: number,
  season: number,
  agency: AgencyState
): AiTransferMarketResult {
  const newsItems: NewsItem[] = [];
  let updatedClubs = [...clubs];
  let updatedPlayers = [...players];
  let updatedAgency = { ...agency };
  let transfersExecutedCount = 0;

  if (!isTransferWindowOpen(week)) {
    return {
      updatedClubs,
      updatedPlayers,
      updatedAgency,
      newsItems,
      transfersExecutedCount: 0
    };
  }

  // Determine how many bidding actions take place this week (1 to 3 bids)
  const windowId = getCurrentTransferWindowId(season, week);
  const numAttempts = 1 + Math.floor(Math.random() * 3);

  // Eligible AI buyer clubs with healthy transfer budgets (> €15M)
  const userClubId = agency.presidency?.role === 'Club President' ? agency.presidency?.clubId : undefined;
  const buyerCandidates = updatedClubs.filter(c => 
    c.id !== userClubId && 
    (c.transferBudget || 0) >= 15000000 &&
    (c.ffpSanctionStatus !== 'transfer_banned')
  );

  if (buyerCandidates.length === 0) {
    return { updatedClubs, updatedPlayers, updatedAgency, newsItems, transfersExecutedCount };
  }

  for (let i = 0; i < numAttempts; i++) {
    const buyer = buyerCandidates[Math.floor(Math.random() * buyerCandidates.length)];
    if (!buyer) continue;

    // Find candidate targets: not already at buyer club, eligible for transfer in current window
    const targetPool = updatedPlayers.filter(p => {
      if (p.clubId === buyer.id) return false;
      if (p.lastTransferWindowId === windowId) return false; // Already moved in current window
      if (p.isOnLoan) return false;
      // Budget sanity: player value is at most 85% of buyer's transfer budget
      const playerVal = p.value || 5000000;
      if (playerVal > buyer.transferBudget * 0.85) return false;
      // Prefer transfer-listed, unhappy, or high potential stars
      const isListed = p.isTransferListed || p.transferListedByClub;
      const isUnrest = p.unrest && p.unrest.status !== 'content';
      const isHighQuality = p.rating >= (buyer.reputation > 80 ? 78 : 72) || (p.potential && p.potential >= 82);
      return isListed || isUnrest || isHighQuality;
    });

    if (targetPool.length === 0) continue;

    // Weight candidate selection towards transfer-listed or discontent players
    targetPool.sort((a, b) => {
      const aScore = (a.isTransferListed ? 30 : 0) + ((a.unrest?.discontentLevel || 0) * 0.3) + (a.rating || 0);
      const bScore = (b.isTransferListed ? 30 : 0) + ((b.unrest?.discontentLevel || 0) * 0.3) + (b.rating || 0);
      return bScore - aScore;
    });

    const targetPlayer = targetPool[Math.floor(Math.random() * Math.min(6, targetPool.length))];
    if (!targetPlayer) continue;

    // Real-Time 17-Foreign Player Quota Validator
    const isTargetHomegrown = targetPlayer.isHomegrown || isPlayerHomegrownInLeague(targetPlayer.nationality, buyer.league);
    if (!isTargetHomegrown && (targetPlayer.age || 22) > 21) {
      const quotaCheck = canClubRegisterMoreForeignPlayers(buyer, updatedPlayers);
      if (!quotaCheck.canRegister) {
        // Buyer at full 17 foreign limit - must look for homegrown player instead
        continue;
      }
    }

    const sellerClub = updatedClubs.find(c => c.id === targetPlayer.clubId);
    const isFreeAgent = !targetPlayer.clubId || targetPlayer.clubId === 'free_agent' || targetPlayer.clubId === 'c_free' || targetPlayer.clubName === 'Free Agent';

    // Calculate bid fee
    const baseValue = targetPlayer.value || 5000000;
    const premiumMultiplier = targetPlayer.isTransferListed ? 0.92 : targetPlayer.age <= 21 ? 1.25 : 1.05;
    const offerFee = isFreeAgent ? 0 : Math.round(baseValue * premiumMultiplier * (0.95 + Math.random() * 0.2));

    if (!isFreeAgent && offerFee > buyer.transferBudget) continue;

    // Seller evaluation
    let sellerAccepts = true;
    if (!isFreeAgent && sellerClub) {
      // Don't auto-sell user president club players without user confirmation
      if (sellerClub.id === userClubId) {
        // Generate incoming transfer inquiry news for user!
        newsItems.push({
          id: `news_bid_inquiry_${Date.now()}_${targetPlayer.id}`,
          week,
          season,
          headline: `💼 TRANSFER BID SUBMITTED: ${buyer.name} table €${formatMoney(offerFee)} for ${targetPlayer.name}!`,
          content: `${buyer.name} has submitted an official transfer offer of €${formatMoney(offerFee)} for your player ${targetPlayer.name}. Manage this inquiry in Squad Management.`,
          category: 'transfer',
          urgency: 'hot',
          read: false
        });
        continue;
      }

      const minAcceptable = baseValue * (targetPlayer.isTransferListed ? 0.85 : 0.98);
      sellerAccepts = offerFee >= minAcceptable;
    }

    // If target player is user's client, generate incoming transfer negotiation instead of auto-selling
    if (targetPlayer.isMyClient && sellerAccepts) {
      if (!targetPlayer.ongoingTransferNegotiation) {
        const offeredWage = Math.max(
          Math.round((targetPlayer.wage || 30000) * 1.3),
          Math.round((buyer.wageBudget || 2000000) * 0.04)
        );
        targetPlayer.ongoingTransferNegotiation = {
          id: `neg_${Date.now()}_${targetPlayer.id}`,
          buyingClubId: buyer.id,
          buyingClubName: buyer.name,
          buyingClubDirector: buyer.managerName || 'Sporting Director',
          buyingClubRole: 'Director of Football',
          offeredFee: offerFee,
          offeredWage,
          offeredCommission: targetPlayer.agentCommission || 12,
          offeredYears: 4,
          weeksRemaining: 3,
          startWeek: week,
          startSeason: season,
          status: 'pending_user_decision',
          directorAvatar: '💼'
        };

        newsItems.push({
          id: `news_bid_client_${Date.now()}_${targetPlayer.id}`,
          week,
          season,
          headline: `🚨 INCOMING TRANSFER BID: ${buyer.name} Table €${formatMoney(offerFee)} for ${targetPlayer.name}!`,
          content: `${buyer.name} have submitted an official bid of €${formatMoney(offerFee)} for your client ${targetPlayer.name} with weekly wages of €${formatMoney(offeredWage)}. Review and negotiate in My Clients.`,
          category: 'transfer',
          urgency: 'breaking',
          read: false,
          targetRole: 'agent',
          actionTab: 'my_players',
          actionLabel: 'Review Offer',
          relatedPlayerId: targetPlayer.id
        });
      }
      continue;
    }

    if (sellerAccepts) {
      // Execute the transfer!
      transfersExecutedCount++;
      const oldClubName = targetPlayer.clubName || 'Free Agent';

      // Update buyer financials & squad
      buyer.transferBudget = Math.max(0, buyer.transferBudget - offerFee);
      buyer.seasonSpent = (buyer.seasonSpent || 0) + offerFee;

      // Update seller financials
      if (sellerClub) {
        sellerClub.transferBudget = (sellerClub.transferBudget || 0) + offerFee;
        sellerClub.seasonRevenue = (sellerClub.seasonRevenue || 0) + offerFee;
      }

      // Update player
      const newWage = Math.max(
        Math.round((targetPlayer.wage || 30000) * 1.25),
        Math.round((buyer.wageBudget || 2000000) * 0.04)
      );

      updatedPlayers = updatedPlayers.map(p => {
        if (p.id === targetPlayer.id) {
          return {
            ...p,
            clubId: buyer.id,
            clubName: buyer.name,
            wage: newWage,
            contractYears: 4,
            lastTransferWeek: week,
            lastTransferSeason: season,
            lastTransferWindowId: windowId,
            transferredInCurrentWindow: true,
            transferredFromClubName: oldClubName,
            isTransferListed: false,
            isLoanListed: false,
            morale: Math.min(100, (p.morale || 75) + 15),
            unrest: {
              status: 'content',
              reason: 'wants_new_challenge',
              reasonLabel: 'Satisfied (New Club Move)',
              discontentLevel: 0,
              description: `Completed a blockbuster move to ${buyer.name} for €${formatMoney(offerFee)}.`,
              discountPercent: 0
            }
          };
        }
        return p;
      });

      // Handle user client commission
      let commissionNote = '';
      if (targetPlayer.isMyClient) {
        const commRate = (targetPlayer.agentCommission || 10) / 100;
        const commissionEarned = Math.round(offerFee * commRate);
        if (commissionEarned > 0) {
          updatedAgency.balance = updatedAgency.balance + commissionEarned;
          updatedAgency.totalTransferEarnings = (updatedAgency.totalTransferEarnings || 0) + commissionEarned;
          commissionNote = ` As representation, ${agency.agencyName} pocketed €${formatMoney(commissionEarned)} in intermediary commission!`;
        }
      }

      // News announcement
      const isBlockbuster = offerFee >= 35000000;
      newsItems.push({
        id: `news_ai_transfer_${Date.now()}_${targetPlayer.id}_${week}`,
        week,
        season,
        headline: `${isBlockbuster ? '🚨 BLOCKBUSTER TRANSFER: ' : '✍️ DONE DEAL: '}${targetPlayer.name} Signs for ${buyer.name} in €${formatMoney(offerFee)} Deal!`,
        content: `${buyer.name} have completed the official signing of ${targetPlayer.name} (${targetPlayer.position}, Age ${targetPlayer.age}) from ${oldClubName} for an agreed transfer fee of €${formatMoney(offerFee)}.${commissionNote}`,
        category: 'transfer',
        urgency: isBlockbuster ? 'breaking' : 'hot',
        read: false
      });
    }
  }

  return {
    updatedClubs,
    updatedPlayers,
    updatedAgency,
    newsItems,
    transfersExecutedCount
  };
}

