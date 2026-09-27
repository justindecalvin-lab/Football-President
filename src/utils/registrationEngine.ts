import { Player, Club, AgencyState, NewsItem, PresidencyState } from '../types';

export interface SquadRegistrationStatus {
  isOpen: boolean;
  isDeadlineWeek: boolean;
  deadlineWeek: number;
  windowName: string;
  periodLabel: string;
  weeksUntilDeadline: number;
  description: string;
}

export type HomegrownType = 'club' | 'nation' | 'non_homegrown';

export interface SquadQuotaAnalysis {
  maxSeniorLimit: number;
  maxNonHomegrownAllowed: number; // Exactly 17 in standard UEFA / Premier League rules
  minHomegrownRequired: number; // 8 required for full 25-man squad
  registeredSeniorCount: number;
  seniorHomegrownCount: number;
  seniorNonHomegrownCount: number;
  u21ExemptCount: number;
  unregisteredCount: number;
  maxAllowableSquadSize: number; // 17 + Math.min(8, seniorHomegrownCount)
  isValid: boolean;
  warnings: string[];
}

/**
 * Maps league name to its domestic host nation.
 */
export function getLeagueCountry(leagueName?: string): string {
  if (!leagueName) return 'England';
  if (leagueName.includes('Premier League') || leagueName.includes('Championship') || leagueName.includes('EFL')) return 'England';
  if (leagueName.includes('La Liga') || leagueName.includes('Segunda')) return 'Spain';
  if (leagueName.includes('Serie A') || leagueName.includes('Serie B')) return 'Italy';
  if (leagueName.includes('Bundesliga')) return 'Germany';
  if (leagueName.includes('Ligue 1') || leagueName.includes('Ligue 2')) return 'France';
  if (leagueName.includes('Eredivisie')) return 'Netherlands';
  if (leagueName.includes('Primeira Liga') || leagueName.includes('Portugal')) return 'Portugal';
  if (leagueName.includes('Brasileir') || leagueName.includes('Brazil')) return 'Brazil';
  if (leagueName.includes('Saudi') || leagueName.includes('Pro League')) return 'Saudi Arabia';
  return 'England';
}

/**
 * Evaluates whether a player qualifies as Homegrown (Club), Homegrown (Nation), or Non-Homegrown.
 * Standard Rule: 3+ years trained in the domestic association between ages 15 and 21.
 */
export function calculatePlayerHomegrownStatus(player: Player, club?: Club): {
  type: HomegrownType;
  label: string;
  isHomegrown: boolean;
  badgeEmoji: string;
} {
  const leagueCountry = getLeagueCountry(club?.league);
  const playerNat = player.nationality || 'England';

  // 1. Homegrown at Club: Either explicitly tagged, or trained in club academy, or domestic + joined young
  if (player.isAutoYouthPromoted || (playerNat === leagueCountry && player.age <= 21)) {
    return {
      type: 'club',
      label: 'Homegrown (Club)',
      isHomegrown: true,
      badgeEmoji: '🛡️'
    };
  }

  // 2. Homegrown at Nation: Domestic nationality or player explicitly marked isHomegrown
  if (player.isHomegrown || playerNat === leagueCountry) {
    return {
      type: 'nation',
      label: 'Homegrown (Nation)',
      isHomegrown: true,
      badgeEmoji: '🏴'
    };
  }

  // 3. Non-Homegrown (Foreign Senior Slot)
  return {
    type: 'non_homegrown',
    label: 'Non-Homegrown (Foreign)',
    isHomegrown: false,
    badgeEmoji: '✈️'
  };
}

/**
 * Calculates comprehensive squad registration quota and homegrown compliance breakdown for a club.
 */
export function analyzeClubSquadQuota(
  club: Club,
  players: Player[],
  presidency?: PresidencyState
): SquadQuotaAnalysis {
  const maxSeniorLimit = presidency?.activePolicies?.maxSquadRegistration || 25;
  const minHomegrownRequired = presidency?.activePolicies?.minHomegrownQuota || 8;
  const maxNonHomegrownAllowed = Math.max(10, maxSeniorLimit - minHomegrownRequired); // 25 - 8 = 17
  const u21Exempt = presidency?.activePolicies?.u21ExemptionEnabled ?? true;

  const clubSquad = players.filter(p => p.clubId === club.id);

  let u21ExemptCount = 0;
  let seniorHomegrownCount = 0;
  let seniorNonHomegrownCount = 0;
  let registeredSeniorCount = 0;
  let unregisteredCount = 0;

  clubSquad.forEach(p => {
    const isU21 = u21Exempt && p.age <= 21;
    if (isU21) {
      u21ExemptCount++;
    } else {
      const hg = calculatePlayerHomegrownStatus(p, club);
      if (p.isRegistered !== false) {
        registeredSeniorCount++;
        if (hg.isHomegrown) {
          seniorHomegrownCount++;
        } else {
          seniorNonHomegrownCount++;
        }
      } else {
        unregisteredCount++;
      }
    }
  });

  // Allowed squad size depends on available HG players: Max 17 Non-HG + available HG (up to 8)
  const maxAllowableSquadSize = maxNonHomegrownAllowed + Math.min(minHomegrownRequired, seniorHomegrownCount);
  const warnings: string[] = [];

  if (seniorNonHomegrownCount > maxNonHomegrownAllowed) {
    warnings.push(`Exceeds Foreign Quota: ${seniorNonHomegrownCount}/${maxNonHomegrownAllowed} non-homegrown players registered.`);
  }

  if (seniorHomegrownCount < minHomegrownRequired) {
    const shortfall = minHomegrownRequired - seniorHomegrownCount;
    warnings.push(`Homegrown Shortfall: Missing ${shortfall} homegrown players. Total squad size capped at ${maxAllowableSquadSize}/${maxSeniorLimit}.`);
  }

  if (registeredSeniorCount > maxAllowableSquadSize) {
    warnings.push(`Squad Limit Exceeded: ${registeredSeniorCount} seniors registered (Max allowable is ${maxAllowableSquadSize}).`);
  }

  const isValid = seniorNonHomegrownCount <= maxNonHomegrownAllowed && registeredSeniorCount <= maxAllowableSquadSize;

  return {
    maxSeniorLimit,
    maxNonHomegrownAllowed,
    minHomegrownRequired,
    registeredSeniorCount,
    seniorHomegrownCount,
    seniorNonHomegrownCount,
    u21ExemptCount,
    unregisteredCount,
    maxAllowableSquadSize,
    isValid,
    warnings
  };
}

/**
 * Checks if the Federation Squad Registration period is currently open.
 * Period 1 (Summer): Weeks 1 through 8 (Deadline on Week 8).
 * Period 2 (Winter / January): Weeks 20 through 24 (Deadline on Week 24).
 */
export function isSquadRegistrationOpen(week: number): boolean {
  return (week >= 1 && week <= 8) || (week >= 20 && week <= 24);
}

/**
 * Returns true if the current matchweek is an official Squad Registration Deadline Week.
 * Summer Deadline: Week 8
 * Winter / January Deadline: Week 24
 */
export function isSquadRegistrationDeadlineWeek(week: number): boolean {
  return week === 8 || week === 24;
}

/**
 * Returns comprehensive status metadata about the current squad registration window.
 */
export function getSquadRegistrationStatus(week: number, season: number = 2026): SquadRegistrationStatus {
  if (week <= 8) {
    const isDeadline = week === 8;
    const weeksLeft = 8 - week;
    return {
      isOpen: true,
      isDeadlineWeek: isDeadline,
      deadlineWeek: 8,
      windowName: `Summer Registration Window (Season ${season})`,
      periodLabel: isDeadline ? '🚨 DEADLINE WEEK' : `🟢 Open (${weeksLeft} wks left)`,
      weeksUntilDeadline: weeksLeft,
      description: isDeadline
        ? `🚨 SUMMER DEADLINE DAY (Week 8): All 25-man senior squad rosters must be locked and submitted with the Federation by midnight tonight!`
        : `Summer Registration Window is OPEN until Week 8. Clubs may register new signings, promote youth, or reshuffle 25-man rosters.`
    };
  } else if (week >= 9 && week <= 19) {
    const weeksUntilJan = 20 - week;
    return {
      isOpen: false,
      isDeadlineWeek: false,
      deadlineWeek: 24,
      windowName: `Mid-Season Registration Closed`,
      periodLabel: `🔒 Locked (Opens Jan Wk 20)`,
      weeksUntilDeadline: 0,
      description: `Squad rosters are LOCKED for the autumn fixture schedule. Only U21 youth-exempt players or emergency medical dispensations may play until the January window opens in Week 20 (${weeksUntilJan} weeks).`
    };
  } else if (week >= 20 && week <= 24) {
    const isDeadline = week === 24;
    const weeksLeft = 24 - week;
    return {
      isOpen: true,
      isDeadlineWeek: isDeadline,
      deadlineWeek: 24,
      windowName: `Winter / January Registration Window (Season ${season})`,
      periodLabel: isDeadline ? '🚨 DEADLINE WEEK' : `🟢 Open (${weeksLeft} wks left)`,
      weeksUntilDeadline: weeksLeft,
      description: isDeadline
        ? `🚨 WINTER DEADLINE DAY (Week 24): Final squad lists for the spring title run-in and relegation battle must be locked tonight!`
        : `Winter / January Registration Window is OPEN until Week 24. Clubs may register winter transfers and recall loanees.`
    };
  } else {
    return {
      isOpen: false,
      isDeadlineWeek: false,
      deadlineWeek: 8,
      windowName: `Late-Season Registration Closed`,
      periodLabel: `🔒 Locked (Season Finale)`,
      weeksUntilDeadline: 0,
      description: `Squad rosters are permanently locked for the final championship and relegation run-in. Registration will reopen in Season ${season + 1} (Week 1).`
    };
  }
}

/**
 * Enforces squad registration rules at deadline day (Week 8 & Week 24).
 * Auto-registers each club's best 25 senior players (strictly adhering to Homegrown & Foreign quotas).
 */
export function enforceSquadRegistrationDeadline(
  clubs: Club[],
  players: Player[],
  week: number,
  season: number,
  presidency?: PresidencyState
): { updatedPlayers: Player[]; newsItems: NewsItem[]; toastMessages: string[] } {
  const updatedPlayers = [...players];
  const newsItems: NewsItem[] = [];
  const toastMessages: string[] = [];

  const maxSeniorSlots = presidency?.activePolicies?.maxSquadRegistration || 25;
  const minHomegrownRequired = presidency?.activePolicies?.minHomegrownQuota || 8;
  const maxNonHomegrownAllowed = Math.max(10, maxSeniorSlots - minHomegrownRequired); // 17
  const u21Exempt = presidency?.activePolicies?.u21ExemptionEnabled ?? true;

  const isSummerDeadline = week === 8;
  const isWinterDeadline = week === 24;

  if (!isSummerDeadline && !isWinterDeadline) {
    return { updatedPlayers, newsItems, toastMessages };
  }

  const deadlineLabel = isSummerDeadline ? 'Summer' : 'Winter / January';

  toastMessages.push(`🚨 SQUAD REGISTRATION DEADLINE (Week ${week}): ${deadlineLabel} 25-man rosters officially submitted and locked across all leagues!`);

  newsItems.push({
    id: `news_reg_deadline_${season}_w${week}_${Date.now()}`,
    week,
    season,
    headline: `🚨 SQUAD REGISTRATION DEADLINE DAY: ${deadlineLabel} Rosters Locked Across Europe!`,
    content: `The official Federation registration deadline has passed. Every member club has submitted their certified ${maxSeniorSlots}-man squad list (with U21 youth exemptions and minimum ${minHomegrownRequired} Homegrown slots). Unregistered players will be ineligible for league matches until the next registration window.`,
    category: 'governance',
    urgency: 'breaking',
    read: false
  });

  // Index squad rosters for O(1) instant lookup to eliminate 5,000,000 quadratic filter iterations
  const squadByClub = new Map<string, Player[]>();
  for (let i = 0; i < updatedPlayers.length; i++) {
    const p = updatedPlayers[i];
    let list = squadByClub.get(p.clubId);
    if (!list) {
      list = [];
      squadByClub.set(p.clubId, list);
    }
    list.push(p);
  }

  clubs.forEach(club => {
    const clubSquad = squadByClub.get(club.id) || [];
    if (clubSquad.length === 0) return;

    // Separate U21 exempt vs senior players
    const u21Players = u21Exempt ? clubSquad.filter(p => p.age <= 21) : [];
    const seniorPlayers = u21Exempt ? clubSquad.filter(p => p.age > 21) : clubSquad;

    // Always auto-register U21 players
    u21Players.forEach(p => {
      p.isRegistered = true;
      p.unregisteredWeeks = 0;
      p.isHomegrown = calculatePlayerHomegrownStatus(p, club).isHomegrown;
    });

    // Classify seniors into Homegrown vs Non-Homegrown
    const seniorHomegrown: Player[] = [];
    const seniorNonHomegrown: Player[] = [];

    seniorPlayers.forEach(p => {
      const hg = calculatePlayerHomegrownStatus(p, club);
      p.isHomegrown = hg.isHomegrown;
      if (hg.isHomegrown) {
        seniorHomegrown.push(p);
      } else {
        seniorNonHomegrown.push(p);
      }
    });

    // Sort both groups by rating descending, then value
    const sortByAbility = (a: Player, b: Player) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.value - a.value;
    };
    seniorHomegrown.sort(sortByAbility);
    seniorNonHomegrown.sort(sortByAbility);

    // Register top Non-Homegrown up to max 17 slots
    const registeredNonHg = seniorNonHomegrown.slice(0, maxNonHomegrownAllowed);
    const unregisteredNonHg = seniorNonHomegrown.slice(maxNonHomegrownAllowed);

    // Remaining available slots for Homegrown = maxSeniorSlots - registeredNonHg.length
    const remainingSlotsForHg = maxSeniorSlots - registeredNonHg.length;
    const registeredHg = seniorHomegrown.slice(0, remainingSlotsForHg);
    const unregisteredHg = seniorHomegrown.slice(remainingSlotsForHg);

    // Mark registered players
    [...registeredNonHg, ...registeredHg].forEach(p => {
      p.isRegistered = true;
      p.unregisteredWeeks = 0;
    });

    // Mark unregistered players
    const allUnregistered = [...unregisteredNonHg, ...unregisteredHg];
    allUnregistered.forEach(p => {
      p.isRegistered = false;
      p.unregisteredWeeks = (p.unregisteredWeeks || 0) + 1;

      if (p.isMyClient) {
        newsItems.push({
          id: `news_client_unreg_${Date.now()}_${p.id}`,
          week,
          season,
          headline: `⚠️ SQUAD EXCLUSION: Client ${p.name} Left Unregistered at ${club.name}!`,
          content: `Following the ${deadlineLabel} squad registration deadline, ${club.name} failed to register your client ${p.name} (${p.rating} OVR, €${(p.wage / 1000).toFixed(0)}k/wk) due to foreign/homegrown squad limits! He cannot play league matches and may petition the Disciplinary Tribunal for breach of contract.`,
          category: 'agency',
          urgency: 'hot',
          read: false,
          targetRole: 'agent',
          actionTab: 'my_players',
          relatedPlayerId: p.id
        });
      }
    });
  });

  return { updatedPlayers, newsItems, toastMessages };
}

/**
 * Toggles or checks if a player can be manually registered / deregistered.
 * Allowed ONLY when squad registration window is OPEN (Weeks 1-8, 20-24).
 */
export function togglePlayerSquadRegistration(
  player: Player,
  club: Club,
  allPlayers: Player[],
  week: number,
  presidency?: PresidencyState
): { success: boolean; updatedPlayer: Player; message: string } {
  if (!isSquadRegistrationOpen(week)) {
    return {
      success: false,
      updatedPlayer: player,
      message: `❌ Registration Locked: The squad registration window is currently closed (Week ${week}). Rosters can only be modified during the Summer Window (Weeks 1-8) or January Window (Weeks 20-24).`
    };
  }

  const maxSlots = presidency?.activePolicies?.maxSquadRegistration || 25;
  const minHomegrownRequired = presidency?.activePolicies?.minHomegrownQuota || 8;
  const maxNonHomegrownAllowed = Math.max(10, maxSlots - minHomegrownRequired); // 17
  const u21Exempt = presidency?.activePolicies?.u21ExemptionEnabled ?? true;

  if (player.age <= 21 && u21Exempt) {
    // U21 players are exempt from quota
    const newStatus = !(player.isRegistered ?? true);
    return {
      success: true,
      updatedPlayer: {
        ...player,
        isRegistered: newStatus,
        unregisteredWeeks: newStatus ? 0 : 1
      },
      message: `✅ Youth Exemption: ${player.name} (Age ${player.age}) is exempt from the ${maxSlots}-man senior limit and is now ${newStatus ? 'REGISTERED' : 'UNREGISTERED'}.`
    };
  }

  const isCurrentlyRegistered = player.isRegistered !== false;

  if (isCurrentlyRegistered) {
    // Deregistering player
    return {
      success: true,
      updatedPlayer: {
        ...player,
        isRegistered: false,
        unregisteredWeeks: 1
      },
      message: `⚠️ Deregistered: ${player.name} has been removed from ${club.name}'s active squad.`
    };
  } else {
    // Registering player - check homegrown & slot constraints
    const hgStatus = calculatePlayerHomegrownStatus(player, club);
    const analysis = analyzeClubSquadQuota(club, allPlayers, presidency);

    if (!hgStatus.isHomegrown && analysis.seniorNonHomegrownCount >= maxNonHomegrownAllowed) {
      return {
        success: false,
        updatedPlayer: player,
        message: `❌ Foreign Quota Exceeded: ${club.name} already has ${analysis.seniorNonHomegrownCount}/${maxNonHomegrownAllowed} Non-Homegrown players registered. Deregister another foreign player first.`
      };
    }

    if (analysis.registeredSeniorCount >= analysis.maxAllowableSquadSize) {
      return {
        success: false,
        updatedPlayer: player,
        message: `❌ Roster Cap Reached: ${club.name} is at maximum allowable capacity (${analysis.registeredSeniorCount}/${analysis.maxAllowableSquadSize} senior slots). You must deregister another player or register homegrown talent to unlock slots.`
      };
    }

    return {
      success: true,
      updatedPlayer: {
        ...player,
        isRegistered: true,
        unregisteredWeeks: 0,
        isHomegrown: hgStatus.isHomegrown
      },
      message: `✅ Registered: ${player.name} added to ${club.name}'s official squad (${analysis.registeredSeniorCount + 1}/${analysis.maxAllowableSquadSize} registered).`
    };
  }
}

/**
 * Checks whether a player is legally allowed to play in a competitive match.
 */
export function checkPlayerMatchEligibility(player: Player, week: number): { eligible: boolean; reason?: string } {
  if (player.injury?.isInjured) {
    return {
      eligible: false,
      reason: `Injured (${player.injury.description || 'Medical injury'}, ${player.injury.weeks} wks left)`
    };
  }

  // If unregistered and window is closed
  if (player.isRegistered === false && !isSquadRegistrationOpen(week) && player.age > 21) {
    return {
      eligible: false,
      reason: `Unregistered with Federation (25-man roster cap & Foreign quota)`
    };
  }

  return { eligible: true };
}

