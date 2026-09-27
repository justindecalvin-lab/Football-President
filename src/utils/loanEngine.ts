import { AgencyState, Player, Club, LoanDeal, NewsItem, PresidencyState } from '../types';
import { formatMoney } from './gameEngine';
import { getCurrentTransferWindowId } from './transferEvaluationEngine';

export interface LoanEvaluationResult {
  accepted: boolean;
  score: number;
  message: string;
  stage?: 'terms' | 'medicals' | 'registration';
  counterOffer?: {
    wageContributionPercent?: number;
    loanFee?: number;
    buybackFee?: number;
    optionToBuyFee?: number;
    optionToBuyActive?: boolean;
    buyoutType?: 'optional_buyout' | 'mandatory_buyout' | 'none';
    buyoutFee?: number;
    playingTimeGuarantee?: 'Key Starter' | 'Rotation' | 'Fringe Player';
  };
}

/**
 * Conducts standard FIFA / European medical examination for a loanee player.
 */
export function conductLoanMedical(player: Player): {
  passed: boolean;
  status: 'passed' | 'minor_flag' | 'failed';
  notes: string;
} {
  // If player is severely injured
  if (player.injury?.isInjured && player.injury.weeks > 4) {
    return {
      passed: false,
      status: 'failed',
      notes: `❌ Medical Failed: Chief Medical Officer flagged active severe injury (${player.injury.description || 'Musculoskeletal damage'}, ${player.injury.weeks} weeks remaining). Deal collapsed.`
    };
  }

  if (player.injury?.isInjured && player.injury.weeks <= 4) {
    return {
      passed: true,
      status: 'minor_flag',
      notes: `⚠️ Minor Medical Flag: Player carries mild strain (${player.injury.weeks} wks recovery). Loanee medical board accepted under condition of tailored physical rehabilitation.`
    };
  }

  // Energy / fatigue check
  if (player.energy && player.energy < 50) {
    return {
      passed: true,
      status: 'minor_flag',
      notes: `⚠️ Conditioning Advisory: Player exhibited low cardiovascular conditioning (${player.energy}% stamina), passed with mandatory fitness training regime.`
    };
  }

  return {
    passed: true,
    status: 'passed',
    notes: `✅ Medical Passed: Elite cardiovascular endurance, zero chronic joint degeneration, 100% match readiness certified.`
  };
}

/**
 * Checks squad registration quota for a club under Federation rules.
 */
export function checkLoanSquadRegistration(
  loaneeClub: Club,
  player: Player,
  allPlayers: Player[],
  presidency?: PresidencyState,
  currentWeek?: number
): { eligible: boolean; registered: boolean; isU21Exempt: boolean; reason: string } {
  const maxRegistered = presidency?.activePolicies?.maxSquadRegistration || 25;
  const minHomegrown = presidency?.activePolicies?.minHomegrownQuota || 8;
  const u21ExemptEnabled = presidency?.activePolicies?.u21ExemptionEnabled ?? true;

  const isU21 = player.age <= 21;

  if (isU21 && u21ExemptEnabled) {
    return {
      eligible: true,
      registered: true,
      isU21Exempt: true,
      reason: `✅ Under-21 Youth Exemption: ${player.name} (Age ${player.age}) is exempt from the senior ${maxRegistered}-man registration limit and can be registered anytime.`
    };
  }

  // Registration Window Calendar Check
  if (currentWeek !== undefined) {
    const isSummerOpen = currentWeek >= 1 && currentWeek <= 8;
    const isWinterOpen = currentWeek >= 20 && currentWeek <= 24;
    const isWindowOpen = isSummerOpen || isWinterOpen;

    if (!isWindowOpen) {
      return {
        eligible: false,
        registered: false,
        isU21Exempt: false,
        reason: `🔒 Registration Closed: The squad registration window closed at deadline day (Week 8 / Week 24). Senior players cannot be registered for competitive matches until the January Window opens (Week 20).`
      };
    }
  }

  const clubSquad = allPlayers.filter(p => p.clubId === loaneeClub.id);

  // Count senior registered players
  const seniorRegistered = clubSquad.filter(p => p.isRegistered !== false && (u21ExemptEnabled ? p.age > 21 : true));

  if (seniorRegistered.length >= maxRegistered) {
    return {
      eligible: false,
      registered: false,
      isU21Exempt: false,
      reason: `❌ Registration Cap Exceeded: ${loaneeClub.name} currently has ${seniorRegistered.length}/${maxRegistered} senior registered slots filled. An existing player must be deregistered or loaned out first.`
    };
  }

  return {
    eligible: true,
    registered: true,
    isU21Exempt: false,
    reason: `✅ Federation Registration Approved: ${player.name} registered under senior squad quota (${seniorRegistered.length + 1}/${maxRegistered} slots).`
  };
}

/**
 * Evaluates a proposed loan deal from the loanee club's perspective.
 */
export function evaluateLoanNegotiation(
  player: Player,
  parentClub: Club,
  loaneeClub: Club,
  proposed: {
    loanDurationWeeks: number;
    wageContributionPercent: number; // loanee club's share
    loanFee: number;
    buybackActive: boolean;
    buybackFee: number;
    optionToBuyActive: boolean;
    optionToBuyFee: number;
    buyoutType?: 'optional_buyout' | 'mandatory_buyout' | 'none';
    buyoutFee?: number;
    playingTimeGuarantee: 'Key Starter' | 'Rotation' | 'Fringe Player';
  }
): LoanEvaluationResult {
  let score = 50; // base score

  // 1. Loan Market Realism & Player Listing Status Check
  const isExplicitlyLoanListed = player.isLoanListed || player.loanListedByClub;
  const isTransferListed = player.isTransferListed || player.transferListedByClub;
  const isUnhappyBenched = player.unrest?.reason === 'benched_lack_playing_time' || (player.unrest && player.unrest.discontentLevel >= 50);
  const isYouthNeedingMinutes = player.age <= 21 && player.rating < player.potential;

  if (isExplicitlyLoanListed) {
    score += 20; // Parent club actively seeking to move player
  } else if (isUnhappyBenched || isYouthNeedingMinutes) {
    score += 15; // Natural development or unrest loan move
  } else if (player.rating >= 78 && player.contractYears >= 2 && !isTransferListed) {
    // Parent club reluctant to loan out key first-team asset unless terms are astronomical
    score -= 35;
  }

  // 2. Squad fit & quality match
  if (player.age <= 22) {
    score += 15;
    if (player.potential >= 80) score += 15;
  }

  if (player.rating > loaneeClub.reputation + 25) {
    // Player might be too elite for this club
    score -= 15;
  } else if (player.rating < 58 && loaneeClub.reputation > 75) {
    // Player too weak for top club
    return {
      accepted: false,
      score: 10,
      message: `${loaneeClub.name} sporting director rejected the proposal: "Player rating (${player.rating}) is below our 1st squad standard."`
    };
  }

  // 3. Financial Affordability (Wage Share + Loan Fee)
  const weeklyWageCost = (player.wage * proposed.wageContributionPercent) / 100;
  const totalWageCostOverLoan = weeklyWageCost * proposed.loanDurationWeeks;
  const totalCostForLoanee = totalWageCostOverLoan + proposed.loanFee;

  if (totalCostForLoanee > loaneeClub.transferBudget * 0.4) {
    score -= 25;
  } else if (proposed.wageContributionPercent <= 50) {
    score += 20;
  }

  // 4. Buyout Clause Architecture (Optional vs Mandatory)
  const activeBuyoutType = proposed.buyoutType || (proposed.optionToBuyActive ? 'optional_buyout' : 'none');
  const activeBuyoutFee = proposed.buyoutFee || proposed.optionToBuyFee || Math.round(player.value * 1.15);

  if (activeBuyoutType === 'mandatory_buyout') {
    // Mandatory Buyout requires loanee club to commit future transfer budget
    const isAffordableFuture = activeBuyoutFee <= loaneeClub.transferBudget * 0.8;
    if (isAffordableFuture && player.potential >= 75) {
      score += 10; // Loanee club happy to lock in future signing
    } else if (!isAffordableFuture) {
      score -= 25; // Too heavy a future financial commitment
    }
  } else if (activeBuyoutType === 'optional_buyout') {
    const fairOptionFee = Math.max(player.value * 1.15, 1500000);
    if (activeBuyoutFee <= fairOptionFee) {
      score += 15;
    } else if (activeBuyoutFee > player.value * 2.5) {
      score -= 10;
    } else {
      score += 5;
    }
  }

  // 5. Buy-Back Clause Acceptance
  if (proposed.buybackActive) {
    const minFairBuyback = Math.max(player.value * 1.25, 2000000);
    if (proposed.buybackFee < minFairBuyback) {
      score -= 30;
    } else {
      score += 10;
    }
  }

  // 6. Playing Time Guarantee
  if (proposed.playingTimeGuarantee === 'Key Starter') {
    if (player.rating >= loaneeClub.reputation - 10) {
      score += 15;
    } else {
      score -= 10;
    }
  }

  if (score >= 60) {
    return {
      accepted: true,
      score,
      stage: 'medicals',
      message: `✅ ${loaneeClub.name} Board Approved! "We are excited to welcome ${player.name} on loan to boost our squad."`
    };
  } else if (score >= 38) {
    // Generate counter offer
    const suggestedWage = Math.max(20, proposed.wageContributionPercent - 15);
    const suggestedFee = Math.max(0, Math.floor(proposed.loanFee * 0.6));
    const suggestedBuyback = Math.floor(Math.max(player.value * 1.4, proposed.buybackFee * 1.25));
    const suggestedOptionFee = Math.floor(player.value * 1.15);

    return {
      accepted: false,
      score,
      message: `⚠️ ${loaneeClub.name} requested modifications to the loan terms. They submitted a revised counter-offer regarding wage split, fee structure, and buyout clauses.`,
      counterOffer: {
        wageContributionPercent: suggestedWage,
        loanFee: suggestedFee,
        buybackFee: suggestedBuyback,
        optionToBuyFee: suggestedOptionFee,
        optionToBuyActive: activeBuyoutType !== 'none',
        buyoutType: activeBuyoutType,
        buyoutFee: suggestedOptionFee,
        playingTimeGuarantee: proposed.playingTimeGuarantee === 'Key Starter' ? 'Rotation' : proposed.playingTimeGuarantee
      }
    };
  } else {
    return {
      accepted: false,
      score,
      message: `❌ ${loaneeClub.name} declined the loan proposal. ${!isExplicitlyLoanListed && player.rating >= 78 ? 'Parent club unwilling to sanction loan for an established starter.' : 'Financial mismatch or tactical squad surplus.'}`
    };
  }
}

/**
 * Process active loans each week during simulation.
 */
export function processWeeklyLoans(
  agency: AgencyState,
  players: Player[],
  clubs: Club[],
  currentWeek: number,
  currentSeason: number
): {
  updatedAgency: AgencyState;
  updatedPlayers: Player[];
  newsItems: NewsItem[];
} {
  const newsItems: NewsItem[] = [];
  const existingDeals = agency.loanDeals || [];
  if (existingDeals.length === 0) {
    return { updatedAgency: agency, updatedPlayers: players, newsItems };
  }

  let updatedPlayersMap = new Map<string, Player>(players.map(p => [p.id, { ...p }]));
  let agencyBalanceDelta = 0;

  const updatedDeals = existingDeals.map(deal => {
    if (deal.status !== 'active') return deal;

    const targetPlayer = updatedPlayersMap.get(deal.playerId);
    if (!targetPlayer) return deal;

    const newWeeksRemaining = deal.weeksRemaining - 1;

    // Simulate Match Appearances and Stats
    let playedThisWeek = false;
    let goalsThisWeek = 0;
    let assistsThisWeek = 0;

    const playProb = deal.playingTimeGuarantee === 'Key Starter' ? 0.85 : deal.playingTimeGuarantee === 'Rotation' ? 0.50 : 0.20;
    if (Math.random() < playProb) {
      playedThisWeek = true;
      if (targetPlayer.position === 'ST' || targetPlayer.position === 'LW' || targetPlayer.position === 'RW') {
        if (Math.random() < 0.35) goalsThisWeek = Math.floor(Math.random() * 2) + 1;
        if (Math.random() < 0.25) assistsThisWeek = 1;
      } else if (targetPlayer.position === 'CAM' || targetPlayer.position === 'CM') {
        if (Math.random() < 0.20) goalsThisWeek = 1;
        if (Math.random() < 0.35) assistsThisWeek = 1;
      }
    }

    // Apply Player Development / Rating Boost
    let ratingGain = 0;
    if (playedThisWeek && targetPlayer.age <= 23 && targetPlayer.rating < targetPlayer.potential) {
      const growthRate = deal.playingTimeGuarantee === 'Key Starter' ? 0.25 : 0.12;
      if (Math.random() < growthRate) {
        ratingGain = 1;
        targetPlayer.rating = Math.min(targetPlayer.potential, targetPlayer.rating + 1);
        targetPlayer.value = Math.floor(targetPlayer.value * 1.08);
      }
    }

    // Update Player Stats
    targetPlayer.stats = {
      ...targetPlayer.stats,
      appearances: targetPlayer.stats.appearances + (playedThisWeek ? 1 : 0),
      goals: targetPlayer.stats.goals + goalsThisWeek,
      assists: targetPlayer.stats.assists + assistsThisWeek
    };

    // Update Player Loan Details
    targetPlayer.loanDetails = {
      ...targetPlayer.loanDetails!,
      weeksRemaining: Math.max(0, newWeeksRemaining)
    };

    const newDeal: LoanDeal = {
      ...deal,
      weeksRemaining: Math.max(0, newWeeksRemaining),
      matchAppearances: deal.matchAppearances + (playedThisWeek ? 1 : 0),
      goalsScored: deal.goalsScored + goalsThisWeek,
      assistsCount: deal.assistsCount + assistsThisWeek,
      ratingGrowthGained: deal.ratingGrowthGained + ratingGain,
      playerRating: targetPlayer.rating
    };

    // Check for Loan Expiration & Buyout Execution
    if (newWeeksRemaining <= 0) {
      const loaneeClub = clubs.find(c => c.id === deal.loaneeClubId);
      const buyoutType = deal.buyoutType || (deal.optionToBuy?.active ? 'optional_buyout' : 'none');
      const buyoutFee = deal.buyoutFee || deal.optionToBuy?.fee || Math.round(targetPlayer.value * 1.1);

      // Check if Mandatory Buyout or Option-to-buy is triggered
      const isMandatory = buyoutType === 'mandatory_buyout';
      const isOptionTriggered = buyoutType === 'optional_buyout' && (deal.ratingGrowthGained >= 2 || deal.goalsScored >= 5 || (loaneeClub && loaneeClub.transferBudget >= buyoutFee && Math.random() < 0.7));

      // Loan Buyout Budget Verification & Deficit Safety Check
      const clubLiquidity = loaneeClub ? loaneeClub.transferBudget : 100000000;
      const isSevereDeficit = loaneeClub && (clubLiquidity < buyoutFee * 0.5 || loaneeClub.transferBudget < -5000000);

      if (isMandatory && isSevereDeficit) {
        // Fallback: Mandatory Buyout Default under FIFA Insolvency Regulations
        newDeal.status = 'completed';
        targetPlayer.isOnLoan = false;
        targetPlayer.clubId = deal.parentClubId;
        targetPlayer.clubName = deal.parentClubName;
        delete targetPlayer.loanDetails;

        const defaultPenaltyFee = Math.round(buyoutFee * 0.2); // 20% breach penalty fee
        if (loaneeClub) {
          loaneeClub.transferBudget = Math.max(-20000000, loaneeClub.transferBudget - defaultPenaltyFee);
        }

        const indemnityCommission = Math.round(defaultPenaltyFee * ((targetPlayer.agentCommission || 10) / 100));
        agencyBalanceDelta += indemnityCommission;

        newsItems.push({
          id: `news_loan_buyout_default_${deal.id}_${currentWeek}`,
          week: currentWeek,
          season: currentSeason,
          headline: `⚠️ BUYOUT DEFAULT: ${deal.loaneeClubName} Deficit Blocks ${deal.playerName} Mandatory Buyout!`,
          content: `Due to severe financial deficit and FFP budget constraints, ${deal.loaneeClubName} was unable to fulfill the €${formatMoney(buyoutFee)} mandatory buyout for ${deal.playerName}. Per FIFA Tribunal directives, the player has returned to ${deal.parentClubName}, with a €${formatMoney(defaultPenaltyFee)} default compensation fee assessed.`,
          category: 'transfer',
          urgency: 'breaking',
          read: false
        });
      } else if (isMandatory || isOptionTriggered) {
        // Permanent transfer executed!
        newDeal.status = 'permanently_transferred';
        targetPlayer.isOnLoan = false;
        targetPlayer.clubId = deal.loaneeClubId;
        targetPlayer.clubName = deal.loaneeClubName;
        targetPlayer.lastTransferWeek = currentWeek;
        targetPlayer.lastTransferSeason = currentSeason;
        targetPlayer.lastTransferWindowId = getCurrentTransferWindowId(currentSeason, currentWeek);
        targetPlayer.transferredInCurrentWindow = true;
        targetPlayer.transferredFromClubName = deal.parentClubName;
        targetPlayer.isTransferListed = false;
        targetPlayer.isLoanListed = false;
        if (loaneeClub) {
          loaneeClub.transferBudget = Math.max(0, loaneeClub.transferBudget - Math.min(loaneeClub.transferBudget, buyoutFee));
        }
        targetPlayer.unrest = {
          status: 'content',
          reason: 'wants_new_challenge',
          reasonLabel: 'Satisfied (Permanent Buyout)',
          discontentLevel: 0,
          description: `Joined ${deal.loaneeClubName} permanently after loan buyout was executed for €${formatMoney(buyoutFee)}.`,
          discountPercent: 0
        };
        delete targetPlayer.loanDetails;

        const commissionEarned = Math.round(buyoutFee * ((targetPlayer.agentCommission || 10) / 100));
        agencyBalanceDelta += commissionEarned;

        newsItems.push({
          id: `news_loan_buyout_${deal.id}_${currentWeek}`,
          week: currentWeek,
          season: currentSeason,
          headline: `🔥 PERMANENT LOAN BUYOUT: ${deal.playerName} Signs for ${deal.loaneeClubName}!`,
          content: `${deal.loaneeClubName} has formally executed the ${isMandatory ? 'MANDATORY' : 'OPTIONAL'} buyout clause for ${deal.playerName}, completing a permanent €${formatMoney(buyoutFee)} transfer from ${deal.parentClubName}! ${targetPlayer.isMyClient ? `Agency earned €${formatMoney(commissionEarned)} in transfer commissions.` : ''}`,
          category: 'transfer',
          urgency: 'breaking',
          read: false
        });
      } else {
        // Standard return to parent club
        newDeal.status = 'completed';
        targetPlayer.isOnLoan = false;
        targetPlayer.clubId = deal.parentClubId;
        targetPlayer.clubName = deal.parentClubName;
        delete targetPlayer.loanDetails;

        newsItems.push({
          id: `news_loan_exp_${deal.id}_${currentWeek}`,
          week: currentWeek,
          season: currentSeason,
          headline: `LOAN RETURN: ${deal.playerName} Returns to ${deal.parentClubName}!`,
          content: `${deal.playerName} has completed their loan spell at ${deal.loaneeClubName}. Final record: ${newDeal.matchAppearances} apps, ${newDeal.goalsScored} goals, and +${newDeal.ratingGrowthGained} rating overall growth achieved!`,
          category: 'transfer',
          urgency: 'hot',
          read: false
        });
      }
    }

    updatedPlayersMap.set(targetPlayer.id, targetPlayer);
    return newDeal;
  });

  const updatedAgency: AgencyState = {
    ...agency,
    balance: agency.balance + agencyBalanceDelta,
    loanDeals: updatedDeals,
    totalTransferEarnings: (agency.totalTransferEarnings || 0) + agencyBalanceDelta
  };

  return {
    updatedAgency,
    updatedPlayers: Array.from(updatedPlayersMap.values()),
    newsItems
  };
}

/**
 * Exercise buy-back clause on an active or past loan deal.
 */
export function executeBuybackClause(
  dealId: string,
  agency: AgencyState,
  players: Player[],
  clubs: Club[]
): {
  success: boolean;
  message: string;
  updatedAgency: AgencyState;
  updatedPlayers: Player[];
  newsItem?: NewsItem;
} {
  const deals = agency.loanDeals || [];
  const dealIndex = deals.findIndex(d => d.id === dealId);
  if (dealIndex === -1) {
    return { success: false, message: 'Loan deal not found.', updatedAgency: agency, updatedPlayers: players };
  }

  const deal = deals[dealIndex];
  if (!deal.buybackClause.active || deal.buybackClause.isExercised) {
    return { success: false, message: 'No active buy-back clause available for this deal.', updatedAgency: agency, updatedPlayers: players };
  }

  const buybackFee = deal.buybackClause.fee;
  if (agency.balance < buybackFee) {
    return {
      success: false,
      message: `Insufficient agency capital to trigger buy-back clause (${formatMoney(buybackFee)} required, you have ${formatMoney(agency.balance)}).`,
      updatedAgency: agency,
      updatedPlayers: players
    };
  }

  const targetPlayer = players.find(p => p.id === deal.playerId);
  if (!targetPlayer) {
    return { success: false, message: 'Target player no longer exists.', updatedAgency: agency, updatedPlayers: players };
  }

  const updatedPlayers = players.map(p => {
    if (p.id === deal.playerId) {
      return {
        ...p,
        clubId: deal.parentClubId,
        clubName: deal.parentClubName,
        isOnLoan: false,
        loanDetails: undefined,
        morale: Math.min(100, p.morale + 15),
        value: Math.floor(p.value * 1.1)
      };
    }
    return p;
  });

  const updatedDeals = [...deals];
  updatedDeals[dealIndex] = {
    ...deal,
    status: 'bought_back',
    buybackClause: {
      ...deal.buybackClause,
      isExercised: true
    }
  };

  const newBalance = agency.balance - buybackFee;
  const updatedAgency: AgencyState = {
    ...agency,
    balance: newBalance,
    loanDeals: updatedDeals,
    totalTransferEarnings: agency.totalTransferEarnings + buybackFee
  };

  const newsItem: NewsItem = {
    id: `news_buyback_${Date.now()}`,
    week: agency.currentWeek,
    season: agency.currentSeason,
    headline: `BUY-BACK CLAUSE EXERCISED: ${deal.playerName} Re-acquired for ${formatMoney(buybackFee)}!`,
    content: `In a masterclass of contractual foresight, ${agency.agencyName} activated the buy-back clause for ${deal.playerName}, bringing the player back to ${deal.parentClubName} after extensive development at ${deal.loaneeClubName}.`,
    category: 'transfer',
    urgency: 'hot',
    read: false
  };

  return {
    success: true,
    message: `🎉 BUY-BACK EXECUTED! ${deal.playerName} has been re-acquired for ${formatMoney(buybackFee)} and returned to ${deal.parentClubName}!`,
    updatedAgency,
    updatedPlayers,
    newsItem
  };
}

/**
 * Maximum concurrent loans allowed based on agent license tier.
 */
export function getMaxConcurrentLoansForLicense(tier?: string): number {
  switch (tier) {
    case 'fifa_global':
      return 25; // Unlimited
    case 'uefa':
      return 10;
    case 'national':
      return 6;
    case 'grassroots':
    default:
      return 3;
  }
}

/**
 * Checks if the agency can take on another active loan deal.
 */
export function checkLoanLimit(agency: AgencyState): {
  allowed: boolean;
  activeCount: number;
  maxCount: number;
  message: string;
} {
  const activeCount = (agency.loanDeals || []).filter(d => d.status === 'active').length;
  const maxCount = getMaxConcurrentLoansForLicense(agency.fifaLicense?.tier);

  if (activeCount >= maxCount) {
    return {
      allowed: false,
      activeCount,
      maxCount,
      message: `❌ License Loan Cap Reached: Your current license tier (${(agency.fifaLicense?.tier || 'grassroots').toUpperCase()}) allows a maximum of ${maxCount} concurrent active loan deals (${activeCount}/${maxCount} slots filled). Upgrade your license in FIFA Licensing to broker additional simultaneous loans.`
    };
  }

  return {
    allowed: true,
    activeCount,
    maxCount,
    message: `✅ Loan Capacity Available: ${activeCount}/${maxCount} slots used.`
  };
}

/**
 * Recall player early from loan with official Transfer Window guardrails.
 */
export function recallLoaneePlayer(
  dealId: string,
  agency: AgencyState,
  players: Player[]
): {
  success: boolean;
  message: string;
  updatedAgency: AgencyState;
  updatedPlayers: Player[];
} {
  const deals = agency.loanDeals || [];
  const dealIndex = deals.findIndex(d => d.id === dealId);
  if (dealIndex === -1) {
    return { success: false, message: 'Loan deal not found.', updatedAgency: agency, updatedPlayers: players };
  }

  const deal = deals[dealIndex];
  if (deal.status !== 'active') {
    return { success: false, message: 'Loan deal is no longer active.', updatedAgency: agency, updatedPlayers: players };
  }

  const targetPlayer = players.find(p => p.id === deal.playerId);
  if (!targetPlayer) {
    return { success: false, message: 'Target player no longer exists.', updatedAgency: agency, updatedPlayers: players };
  }

  // Official FIFA Transfer Window Check (Summer: Wk 1-12, Winter: Wk 22-26)
  const isTransferWindow = (agency.currentWeek >= 1 && agency.currentWeek <= 12) || (agency.currentWeek >= 22 && agency.currentWeek <= 26);
  const emergencyBreakFee = Math.max(250000, Math.round((targetPlayer.value || 2000000) * 0.05));

  let newAgencyBalance = agency.balance;
  let feeDeductedNote = '';

  if (!isTransferWindow) {
    // Outside window: requires Emergency Break-Clause compensation
    if (agency.balance < emergencyBreakFee) {
      return {
        success: false,
        message: `❌ Transfer Window Guardrail: Loan recalls outside official transfer windows (Summer Wk 1-12, Winter Wk 22-26) require an Emergency Break-Clause Compensation fee of €${formatMoney(emergencyBreakFee)}. (Your balance: €${formatMoney(agency.balance)}). Wait for the January/Summer window or inject agency capital.`,
        updatedAgency: agency,
        updatedPlayers: players
      };
    }

    newAgencyBalance -= emergencyBreakFee;
    feeDeductedNote = ` (Paid €${formatMoney(emergencyBreakFee)} Emergency Break-Clause Fee to ${deal.loaneeClubName})`;
  }

  const updatedPlayers = players.map(p => {
    if (p.id === deal.playerId) {
      return {
        ...p,
        clubId: deal.parentClubId,
        clubName: deal.parentClubName,
        isOnLoan: false,
        loanDetails: undefined,
        isLoanListed: false,
        morale: Math.min(100, (p.morale || 80) + 10)
      };
    }
    return p;
  });

  const updatedDeals = [...deals];
  updatedDeals[dealIndex] = {
    ...deal,
    status: 'recalled',
    weeksRemaining: 0
  };

  const updatedAgency: AgencyState = {
    ...agency,
    balance: newAgencyBalance,
    loanDeals: updatedDeals
  };

  return {
    success: true,
    message: `↩️ RECALLED! ${deal.playerName} has been recalled from ${deal.loaneeClubName}.${feeDeductedNote} Parent club ${deal.parentClubName} resumes 100% wage obligations.`,
    updatedAgency,
    updatedPlayers
  };
}
