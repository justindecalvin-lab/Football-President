import {
  Player,
  Club,
  AgencyState,
  RivalAgent,
  ClubStaffMember,
  SportingDirectorProfile,
  BoardMember,
  BoardMandate,
  BoardOfDirectorsState,
  PresidentialTransferProposal,
  SportingDirectorTask,
  Position,
  NewsItem,
  InternalClubTransferRequest,
  OffloadMandateOptions
} from '../types';
import { formatMoney, recordFinancialTransaction } from './gameEngine';

export interface InteractionOutcome {
  updatedPlayer?: Player;
  updatedAgency: AgencyState;
  updatedClub?: Club;
  updatedRivalAgent?: RivalAgent;
  updatedAllPlayers?: Player[];
  updatedAllClubs?: Club[];
  message: string;
  type: 'success' | 'info' | 'error';
  newsHeadline?: string;
  newsContent?: string;
}

export type RoleType = 'agent' | 'club_owner' | 'fa_president';

/**
 * Returns the effective active persona role of the agency/player
 */
export function getEffectiveRole(agency: AgencyState): RoleType {
  if (agency.activeRoles?.currentRole) {
    return agency.activeRoles.currentRole;
  }
  if (agency.presidency?.role === 'Club President') {
    return 'club_owner';
  }
  if (agency.presidency?.role && agency.presidency.role !== 'None') {
    return 'fa_president';
  }
  return 'agent';
}

/**
 * Seamlessly synchronizes agency activeRoles and presidency states when switching or updating roles
 */
export function syncAgencyRoles(agency: AgencyState, targetRole?: RoleType, options?: { clubId?: string; clubName?: string }): AgencyState {
  const currentRole = targetRole || getEffectiveRole(agency);
  const isOwner = currentRole === 'club_owner';
  const isFA = currentRole === 'fa_president';

  const clubId = options?.clubId || agency.activeRoles?.presidentClubId || agency.presidency?.clubId || agency.clubShares?.[0]?.clubId;
  const clubName = options?.clubName || agency.activeRoles?.presidentClubName || agency.presidency?.clubName || agency.clubShares?.[0]?.clubName;

  const currentPresidencyRole = isOwner
    ? 'Club President'
    : isFA
    ? (agency.presidency?.role && agency.presidency.role !== 'None' && agency.presidency.role !== 'Club President' ? agency.presidency.role : 'FIFA Global President')
    : 'None';

  return {
    ...agency,
    activeRoles: {
      agent: true,
      club_owner: isOwner || (agency.clubShares && agency.clubShares.some(s => s.sharePercent >= 50)) || !!agency.activeRoles?.club_owner,
      fa_president: isFA || !!agency.activeRoles?.fa_president || (agency.presidency?.role !== 'None' && agency.presidency?.role !== 'Club President'),
      currentRole,
      startingRole: agency.activeRoles?.startingRole || currentRole,
      presidentClubId: isOwner ? clubId : agency.activeRoles?.presidentClubId,
      presidentClubName: isOwner ? clubName : agency.activeRoles?.presidentClubName,
      faAchievementEligibility: isFA || agency.activeRoles?.faAchievementEligibility
    },
    presidency: {
      ...agency.presidency,
      role: currentPresidencyRole,
      clubId: isOwner ? clubId : agency.presidency?.clubId,
      clubName: isOwner ? clubName : agency.presidency?.clubName
    }
  };
}

// =========================================================================
// 1. FOOTBALL AGENT (INTERMEDIARY / AGENCY TYCOON) INTERACTIONS
// =========================================================================

/**
 * Agent demands an immediate wage renegotiation (+30% wage + agent commission)
 */
export function executeDemandWageRenegotiation(
  player: Player,
  agency: AgencyState
): InteractionOutcome {
  const currentWage = player.wage || 50000;
  const newWage = Math.round(currentWage * 1.3);
  const agentSigningBonus = Math.round(newWage * 4 * 0.1); // 10% agent commission on first month

  const updatedPlayer: Player = {
    ...player,
    wage: newWage,
    morale: 100,
    loyalty: Math.min(100, (player.loyalty || 80) + 20),
    unrest: undefined
  };

  const agencyWithTransaction = recordFinancialTransaction(
    agency,
    agentSigningBonus,
    `Renegotiation Commission: ${player.name}`,
    `Negotiated +30% wage hike (€${formatMoney(newWage)}/wk) for ${player.name} at ${player.clubName}.`,
    'transfer'
  );

  return {
    updatedPlayer,
    updatedAgency: agencyWithTransaction,
    message: `💰 Wage Hike Secured! ${player.name}'s weekly wage raised to €${formatMoney(newWage)}/wk (+30%). Agency earned €${formatMoney(agentSigningBonus)} commission bonus!`,
    type: 'success',
    newsHeadline: `💼 Contract Upgrade: ${player.name} Pens Lucrative New Deal at ${player.clubName}`,
    newsContent: `Following aggressive negotiations led by ${agency.agencyName}, ${player.name} has committed to new terms boosting weekly earnings to €${formatMoney(newWage)}.`
  };
}

/**
 * Agent leaks transfer desire to Tabloids (Dark Arts unrest creation)
 */
export function executeTabloidLeak(
  player: Player,
  agency: AgencyState
): InteractionOutcome {
  const updatedPlayer: Player = {
    ...player,
    unrest: {
      status: 'transfer_requested',
      reason: 'manager_clash',
      reasonLabel: 'Media Storm & Dressing Room Row',
      discontentLevel: 95,
      description: `Sensational tabloid leak triggered headlines across Europe! Asking price slashed by 25%.`,
      discountPercent: 25
    },
    value: Math.round(player.value * 0.75)
  };

  const updatedAgency: AgencyState = {
    ...agency,
    darkArtsScore: (agency.darkArtsScore || 0) + 2
  };

  return {
    updatedPlayer,
    updatedAgency,
    message: `📰 Tabloid Hit-Piece Published! Front-page stories created a massive transfer frenzy for ${player.name}. Valuation reduced by 25% to force a sale! (+2 Dark Arts)`,
    type: 'info',
    newsHeadline: `⚡ Dressing Room Mutiny: ${player.name} Demands Immediate Exit from ${player.clubName}`,
    newsContent: `Confidential dressing room leaks have sparked feverish speculation across European media regarding ${player.name}'s imminent transfer.`
  };
}

/**
 * Agent secures luxury sportswear & commercial boot endorsement deal
 */
export function executeCommercialBootDeal(
  player: Player,
  agency: AgencyState
): InteractionOutcome {
  const agentCommission = 50000;
  const brands = ['Nike Elite Premier', 'Adidas Predator Pro', 'Puma Future Nitro', 'Under Armour Speed'] as const;
  const chosenBrand = brands[Math.floor(Math.random() * brands.length)];

  const updatedPlayer: Player = {
    ...player,
    morale: Math.min(100, (player.morale || 80) + 15),
    personalLife: {
      ...player.personalLife,
      brandSponsor: chosenBrand,
      endorsementEarnings: (player.personalLife?.endorsementEarnings || 0) + 75000,
      happiness: 100
    }
  };

  const agencyWithTransaction = recordFinancialTransaction(
    agency,
    agentCommission,
    `Commercial Sponsorship: ${player.name}`,
    `Brokered global ${chosenBrand} footwear endorsement for ${player.name}.`,
    'award'
  );

  return {
    updatedPlayer,
    updatedAgency: agencyWithTransaction,
    message: `👟 Global Boot Deal Signed! Brokered exclusive ${chosenBrand} footwear endorsement for ${player.name}. Agency earned €50,000 commission!`,
    type: 'success',
    newsHeadline: `👟 Commercial Power: ${player.name} Inks Multi-Year ${chosenBrand} Sponsorship`,
    newsContent: `Global sports brand ${chosenBrand} announced ${player.name} as their new headline ambassador in a campaign orchestrated by ${agency.agencyName}.`
  };
}

/**
 * Agent conducts PR Crisis Defense & Personal Brand Makeover
 */
export function executePersonalBrandDefense(
  player: Player,
  agency: AgencyState
): InteractionOutcome {
  const prCost = 15000;
  if (agency.balance < prCost) {
    return {
      updatedAgency: agency,
      message: `Insufficient agency funds (€${formatMoney(prCost)} required for high-profile PR crisis defense).`,
      type: 'error'
    };
  }

  const updatedPlayer: Player = {
    ...player,
    morale: 100,
    personalLife: {
      ...player.personalLife,
      scandalLevel: 0,
      happiness: 100,
      socialMediaFollowers: (player.personalLife?.socialMediaFollowers || 50000) + 25000
    }
  };

  const agencyWithTransaction = recordFinancialTransaction(
    agency,
    -prCost,
    `PR Crisis Defense: ${player.name}`,
    `Retained premier crisis PR firm to scrub scandalous media stories and polish ${player.name}'s image.`,
    'acquisition'
  );

  return {
    updatedPlayer,
    updatedAgency: agencyWithTransaction,
    message: `🛡️ PR Crisis Cleaned Up! Media scandals for ${player.name} eliminated. Social following +25,000 and player happiness locked to 100%!`,
    type: 'success'
  };
}

/**
 * Agent buys Luxury Retention Gift (supercar, penthouse, luxury watch)
 */
export function executeLuxuryRetentionGift(
  player: Player,
  agency: AgencyState
): InteractionOutcome {
  const giftCost = 40000;
  if (agency.balance < giftCost) {
    return {
      updatedAgency: agency,
      message: `Insufficient agency funds (€${formatMoney(giftCost)} required for luxury retention gift).`,
      type: 'error'
    };
  }

  const gifts = ['Custom Matte-Black Supercar', 'Monaco Waterfront Penthouse Lease', 'Diamond-Encrusted Tourbillon Watch', 'Private Mediterranean Yacht Weekend'];
  const chosenGift = gifts[Math.floor(Math.random() * gifts.length)];

  const updatedPlayer: Player = {
    ...player,
    loyalty: 100,
    morale: 100,
    personalLife: {
      ...player.personalLife,
      luxuryItem: chosenGift,
      happiness: 100
    }
  };

  const agencyWithTransaction = recordFinancialTransaction(
    agency,
    -giftCost,
    `Retention Gift: ${player.name}`,
    `Gifted ${chosenGift} to client ${player.name} to cement agency commitment.`,
    'acquisition'
  );

  return {
    updatedPlayer,
    updatedAgency: agencyWithTransaction,
    message: `🎁 Luxury Gift Delivered! Presented ${player.name} with a ${chosenGift}. Client loyalty locked to 100%!`,
    type: 'success'
  };
}

/**
 * Agent hires Specialist Individual Skills Coach (boosts shooting, passing, or pace)
 */
export function executeSpecialistSkillCoach(
  player: Player,
  agency: AgencyState
): InteractionOutcome {
  const coachCost = 20000;
  if (agency.balance < coachCost) {
    return {
      updatedAgency: agency,
      message: `Insufficient agency funds (€${formatMoney(coachCost)} required for private skills guru).`,
      type: 'error'
    };
  }

  const statKeys: (keyof NonNullable<Player['stats']>)[] = ['shooting', 'passing', 'pace', 'dribbling', 'defending', 'physical'];
  const chosenStat = statKeys[Math.floor(Math.random() * statKeys.length)];
  const currentStatVal = (player.stats?.[chosenStat] as number) || 75;
  const newStatVal = Math.min(99, currentStatVal + 3);

  const updatedPlayer: Player = {
    ...player,
    form: 100,
    rating: Math.min(99, player.rating + 1),
    stats: {
      ...player.stats,
      [chosenStat]: newStatVal
    }
  };

  const agencyWithTransaction = recordFinancialTransaction(
    agency,
    -coachCost,
    `Specialist Coach: ${player.name}`,
    `Retained elite biomechanical trainer to hone ${player.name}'s ${String(chosenStat)}.`,
    'acquisition'
  );

  return {
    updatedPlayer,
    updatedAgency: agencyWithTransaction,
    message: `⚡ Private Skills Training Complete! ${player.name}'s ${String(chosenStat).toUpperCase()} improved to ${newStatVal} (+3)! Overall rating increased to ${updatedPlayer.rating}.`,
    type: 'success'
  };
}

/**
 * Agent taps up player via entourage backchannels
 */
export function executeTapUpEntourage(
  player: Player,
  agency: AgencyState
): InteractionOutcome {
  const tapCost = 25000;
  if (agency.balance < tapCost) {
    return {
      updatedAgency: agency,
      message: `Need €${formatMoney(tapCost)} for backchannel entourage meeting and scouting consultants.`,
      type: 'error'
    };
  }

  const updatedPlayer: Player = {
    ...player,
    loyalty: Math.max(15, (player.loyalty || 80) - 35)
  };

  const agencyWithTransaction = recordFinancialTransaction(
    agency,
    -tapCost,
    `Backchannel Tap-Up: ${player.name}`,
    `Funded secret dinner with ${player.name}'s family & entourage (+1 Dark Arts).`,
    'acquisition'
  );

  const updatedAgency: AgencyState = {
    ...agencyWithTransaction,
    darkArtsScore: (agency.darkArtsScore || 0) + 1
  };

  return {
    updatedPlayer,
    updatedAgency,
    message: `🕵️ Entourage Backchannel Meeting Completed: Secretly met with ${player.name}'s inner circle. Their loyalty to their current agency fell by 35%! Ready to pitch! (+1 Dark Arts)`,
    type: 'success'
  };
}

/**
 * Agent compiles deep-dive forensic scouting dossier on target player
 */
export function executeScoutDeepDiveDossier(
  player: Player,
  agency: AgencyState
): InteractionOutcome {
  const cost = 10000;
  if (agency.balance < cost) {
    return {
      updatedAgency: agency,
      message: `Need €${formatMoney(cost)} for deep-dive investigative scouting report.`,
      type: 'error'
    };
  }

  const traits = ['Dead-Ball Specialist', 'High Tactical IQ', 'Big Match Temperament', 'Relentless Stamina', 'Poacher Instincts', 'Speed Demon'];
  const discoveredTrait = traits[Math.floor(Math.random() * traits.length)];
  const existingTraits = player.traits || [];
  const updatedTraits = existingTraits.includes(discoveredTrait) ? existingTraits : [...existingTraits, discoveredTrait];

  const updatedPlayer: Player = {
    ...player,
    scoutedStatus: 'fully_scouted',
    traits: updatedTraits,
    potentialRange: { min: player.potential - 2, max: player.potential + 2 },
    scoutReport: {
      scoutName: 'Apex Data Analytics Hub',
      date: `Season ${agency.currentSeason}, Week ${agency.currentWeek}`,
      verdict: player.potential >= 88 ? 'Generational Wonderkid' : player.potential >= 82 ? 'Solid Starter' : 'Squad Filler',
      text: `Comprehensive 40-page dossier compiled. Key discovered signature trait: "${discoveredTrait}". True ceiling verified at ${player.potential} POT.`
    }
  };

  const agencyWithTransaction = recordFinancialTransaction(
    agency,
    -cost,
    `Deep Scouting Dossier: ${player.name}`,
    `Commissioned analytical scouting investigation for ${player.name}.`,
    'acquisition'
  );

  return {
    updatedPlayer,
    updatedAgency: agencyWithTransaction,
    message: `🔍 Deep-Dive Dossier Unlocked! Unveiled true potential (${player.potential}) and discovered signature trait "${discoveredTrait}" for ${player.name}.`,
    type: 'success'
  };
}

/**
 * Agent pitches client directly to Head Manager for starting lineup guarantee
 */
export function executePitchClientToManager(
  player: Player,
  managerName: string,
  agency: AgencyState
): InteractionOutcome {
  const dinnerCost = 8000;
  if (agency.balance < dinnerCost) {
    return {
      updatedAgency: agency,
      message: `Need €${formatMoney(dinnerCost)} to host manager ${managerName} for tactical consultation.`,
      type: 'error'
    };
  }

  const updatedPlayer: Player = {
    ...player,
    morale: Math.min(100, (player.morale || 80) + 20),
    agreedPlayingTime: 'Star Player',
    playingTimeSatisfaction: 100
  };

  const agencyWithTransaction = recordFinancialTransaction(
    agency,
    -dinnerCost,
    `Tactical Summit: ${managerName}`,
    `Hosted private tactical dinner with ${player.clubName} manager ${managerName} regarding ${player.name}.`,
    'acquisition'
  );

  return {
    updatedPlayer,
    updatedAgency: agencyWithTransaction,
    message: `👔 Manager Summit Successful! ${managerName} pledged key starter priority for ${player.name} in upcoming competitive fixtures. Player morale +20!`,
    type: 'success'
  };
}


// =========================================================================
// 2. CLUB PRESIDENT / OWNER INTERACTIONS
// =========================================================================

/**
 * Club President renews contract with €100k sign-on bonus from club funds
 */
export function executeClubContractRenewal(
  player: Player,
  agency: AgencyState
): InteractionOutcome {
  const signOnBonus = 100000;
  if (agency.balance < signOnBonus) {
    return {
      updatedAgency: agency,
      message: `Insufficient club treasury funds (€${formatMoney(signOnBonus)} needed for presidential sign-on bonus).`,
      type: 'error'
    };
  }

  const updatedPlayer: Player = {
    ...player,
    contractYears: (player.contractYears || 2) + 2,
    loyalty: Math.min(100, (player.loyalty || 80) + 25),
    morale: 100,
    unrest: undefined
  };

  const agencyWithTransaction = recordFinancialTransaction(
    agency,
    -signOnBonus,
    `Presidential Extension: ${player.name}`,
    `Awarded €100,000 executive bonus to extend ${player.name} (+2 years).`,
    'transfer'
  );

  return {
    updatedPlayer,
    updatedAgency: agencyWithTransaction,
    message: `🖋️ Contract Extended! ${player.name} signed a +2 year contract extension with a €100k presidential bonus. Morale and loyalty restored to 100%!`,
    type: 'success',
    newsHeadline: `✍️ Presidential Extension: ${player.name} Signs +2 Year Deal with ${player.clubName}`,
    newsContent: `Club President ${agency.agentName} has personally concluded a marquee 2-year contract extension for ${player.name}.`
  };
}

/**
 * Club President awards Team Captaincy
 */
export function executeAwardCaptaincy(
  player: Player,
  agency: AgencyState
): InteractionOutcome {
  const updatedPlayer: Player = {
    ...player,
    morale: 100,
    loyalty: Math.min(100, (player.loyalty || 80) + 30),
    unrest: undefined
  };

  return {
    updatedPlayer,
    updatedAgency: agency,
    message: `👑 Captain's Armband Bestowed! ${player.name} has been appointed Team Captain. Dressing room leadership and commitment consolidated!`,
    type: 'success',
    newsHeadline: `👑 New Club Leader: ${player.name} Handed Captain's Armband by Club President`,
    newsContent: `In an official boardroom ceremony, President ${agency.agentName} formally bestowed the captaincy of ${player.clubName} upon ${player.name}.`
  };
}

/**
 * Club President holds 1-on-1 Boardroom Pep Talk
 */
export function executeBoardroomPepTalk(
  player: Player,
  agency: AgencyState
): InteractionOutcome {
  const updatedPlayer: Player = {
    ...player,
    morale: Math.min(100, (player.morale || 80) + 25),
    unrest: undefined
  };

  return {
    updatedPlayer,
    updatedAgency: agency,
    message: `🏛️ Presidential Pep Talk Completed: ${player.name} appreciated the private boardroom consultation and pledged full matchday commitment. Morale +25!`,
    type: 'success'
  };
}

/**
 * Club President issues 2-week wage disciplinary fine
 */
export function executePresidentialFine(
  player: Player,
  agency: AgencyState
): InteractionOutcome {
  const fineAmount = (player.wage || 30000) * 2;

  const updatedPlayer: Player = {
    ...player,
    morale: Math.max(30, (player.morale || 80) - 15)
  };

  const agencyWithTransaction = recordFinancialTransaction(
    agency,
    fineAmount,
    `Disciplinary Fine: ${player.name}`,
    `Deducted 2 weeks' wages (€${formatMoney(fineAmount)}) from ${player.name} for breach of club discipline standards.`,
    'award'
  );

  return {
    updatedPlayer,
    updatedAgency: agencyWithTransaction,
    message: `⚠️ Disciplinary Fine Imposed: Deducted 2 weeks wages (€${formatMoney(fineAmount)}) from ${player.name}. Funds credited directly to Club Treasury!`,
    type: 'info'
  };
}

/**
 * Club President sends player to Private Swiss Sports Clinic
 */
export function executeSwissMedicalClinic(
  player: Player,
  agency: AgencyState
): InteractionOutcome {
  const clinicCost = 25000;
  if (agency.balance < clinicCost) {
    return {
      updatedAgency: agency,
      message: `Insufficient club treasury funds (€${formatMoney(clinicCost)} needed for Swiss clinic).`,
      type: 'error'
    };
  }

  const updatedPlayer: Player = {
    ...player,
    morale: 100,
    energy: 100,
    condition: 100,
    matchFitness: 100,
    injury: {
      isInjured: false,
      weeks: 0
    }
  };

  const agencyWithTransaction = recordFinancialTransaction(
    agency,
    -clinicCost,
    `Swiss Medical Clinic: ${player.name}`,
    `Specialist recovery and conditioning program for ${player.name} in Zurich.`,
    'acquisition'
  );

  return {
    updatedPlayer,
    updatedAgency: agencyWithTransaction,
    message: `🏥 Zurich Medical Treatment Completed! ${player.name} underwent elite hydrotherapy and biomechanical recovery. 100% healed and match fit!`,
    type: 'success'
  };
}

/**
 * Club President enacts Presidential Transfer Veto & Lock
 */
export function executePresidentialTransferVeto(
  player: Player,
  agency: AgencyState
): InteractionOutcome {
  const updatedPlayer: Player = {
    ...player,
    clubForcedStay: true,
    isTransferListed: false,
    transferListedByClub: false
  };

  return {
    updatedPlayer,
    updatedAgency: agency,
    message: `🔒 Presidential Transfer Veto Enacted! ${player.name} declared untouchable. All external transfer inquiries blocked!`,
    type: 'info',
    newsHeadline: `🚫 Not for Sale: President Vetoes Any Transfer for ${player.name}`,
    newsContent: `President ${agency.agentName} has formally notified all European clubs that ${player.name} is strictly non-transferable.`
  };
}

/**
 * Club President invites rival Chairman to VIP Directors' Suite
 */
export function executeInviteRivalChairman(
  targetClub: Club,
  targetPlayer: Player,
  agency: AgencyState
): InteractionOutcome {
  const vipCost = 15000;
  if (agency.balance < vipCost) {
    return {
      updatedAgency: agency,
      message: `Need €15,000 for VIP Presidential Suite hospitality.`,
      type: 'error'
    };
  }

  const updatedClub: Club = {
    ...targetClub,
    chairmanTrust: Math.min(100, (targetClub.chairmanTrust || 60) + 20)
  };

  const agencyWithTransaction = recordFinancialTransaction(
    agency,
    -vipCost,
    `VIP Hospitality: ${targetClub.name} Chairman`,
    `Hosted ${targetClub.name} chairman in Presidential Lounge to discuss ${targetPlayer.name}.`,
    'acquisition'
  );

  return {
    updatedClub,
    updatedAgency: agencyWithTransaction,
    message: `🍷 Presidential Summit Hosted! The Chairman of ${targetClub.name} enjoyed VIP hospitality. Chairman trust +20 and preferential terms granted for ${targetPlayer.name}!`,
    type: 'success'
  };
}

/**
 * Club President issues Presidential Tactical Directive to Head Manager
 */
export function executePresidentialTacticalDirective(
  club: Club,
  tactics: 'Attacking' | 'Tiki-Taka' | 'Counter-Attack' | 'Park the Bus',
  agency: AgencyState
): InteractionOutcome {
  const updatedClub: Club = {
    ...club,
    managerTactics: tactics
  };

  return {
    updatedClub,
    updatedAgency: agency,
    message: `📋 Tactical Directive Issued! Ordered head manager ${club.headCoach || club.managerName || 'Head Coach'} to implement ${tactics} football philosophy.`,
    type: 'success'
  };
}

/**
 * Club President backs the Head Manager with an official Vote of Confidence
 */
export function executeBackManagerPublicly(
  club: Club,
  agency: AgencyState
): InteractionOutcome {
  const managerName = club.headCoach || club.managerName || 'Head Coach';
  const updatedClub: Club = {
    ...club,
    chairmanTrust: Math.min(100, (club.chairmanTrust || 60) + 15)
  };

  return {
    updatedClub,
    updatedAgency: agency,
    message: `🎙️ Official Vote of Confidence: President ${agency.agentName} publicly backed ${managerName}. Dressing room harmony stabilized!`,
    type: 'success',
    newsHeadline: `🤝 Boardroom Backing: President Confirms Full Faith in Manager ${managerName}`,
    newsContent: `Amid intense scrutiny, President ${agency.agentName} delivered a resounding vote of confidence in ${managerName}'s tactical vision.`
  };
}


// =========================================================================
// 3. FEDERATION PRESIDENT (FA / FIFA) INTERACTIONS
// =========================================================================

/**
 * FA President summons a player to the Senior National Squad
 */
export function executeNationalSquadCallUp(
  player: Player,
  agency: AgencyState
): InteractionOutcome {
  const currentInfluence = agency.presidency?.politicalInfluence || 70;
  const newInfluence = Math.min(100, currentInfluence + 3);

  const updatedPlayer: Player = {
    ...player,
    isNationalTeamCalledUp: true,
    stats: {
      ...player.stats,
      internationalCaps: (player.stats?.internationalCaps || 0) + 1
    },
    morale: Math.min(100, (player.morale || 80) + 15),
    loyalty: Math.min(100, (player.loyalty || 80) + 10)
  };

  const newsHeadline = `🏅 National Team Call-Up: ${player.name} Selected by Federation Decree`;
  const newsContent = `President ${agency.agentName} has formally ratified the international call-up for ${player.name} (${player.clubName}) to represent ${player.nationality} in upcoming international fixtures.`;

  const updatedAgency: AgencyState = {
    ...agency,
    presidency: {
      ...agency.presidency,
      politicalInfluence: newInfluence
    }
  };

  return {
    updatedPlayer,
    updatedAgency,
    message: `🏅 Formal Call-Up Issued! ${player.name} summoned to the ${player.nationality} Senior National Squad. International caps +1, player morale +15!`,
    type: 'success',
    newsHeadline,
    newsContent
  };
}

/**
 * FA President fast-tracks international work permit and exceptional talent clearance
 */
export function executeWorkPermitFastTrack(
  player: Player,
  agency: AgencyState
): InteractionOutcome {
  const currentInfluence = agency.presidency?.politicalInfluence || 70;
  const newInfluence = Math.min(100, currentInfluence + 2);

  const updatedPlayer: Player = {
    ...player,
    value: Math.round(player.value * 1.1)
  };

  const updatedAgency: AgencyState = {
    ...agency,
    presidency: {
      ...agency.presidency,
      politicalInfluence: newInfluence
    }
  };

  return {
    updatedPlayer,
    updatedAgency,
    message: `🛂 Work Permit Expedited! Granted full international clearance and exceptional talent visa to ${player.name}. Market valuation surged by +10%!`,
    type: 'success'
  };
}

/**
 * FA President subjects player to surprise Anti-Doping & Integrity Blood Audit
 */
export function executeAntiDopingAudit(
  player: Player,
  agency: AgencyState
): InteractionOutcome {
  const isClean = Math.random() < 0.92;
  const currentInfluence = agency.presidency?.politicalInfluence || 70;

  if (isClean) {
    const updatedPlayer: Player = {
      ...player,
      morale: Math.min(100, (player.morale || 80) + 10)
    };
    const updatedAgency: AgencyState = {
      ...agency,
      presidency: {
        ...agency.presidency,
        politicalInfluence: Math.min(100, currentInfluence + 2)
      }
    };
    return {
      updatedPlayer,
      updatedAgency,
      message: `💉 Clean Bill of Health! WADA & Federation biological passport audit for ${player.name} returned 100% negative. Official integrity certificate issued.`,
      type: 'success'
    };
  } else {
    const updatedPlayer: Player = {
      ...player,
      morale: Math.max(20, (player.morale || 80) - 5)
    };
    const updatedAgency: AgencyState = {
      ...agency,
      presidency: {
        ...agency.presidency,
        politicalInfluence: Math.min(100, currentInfluence + 1)
      }
    };
    return {
      updatedPlayer,
      updatedAgency,
      message: `🔬 Minor Biomarker Flag: Muscle enzyme elevation flagged for ${player.name}. Federation sports medicine panel advised 1-week training adjustment.`,
      type: 'info'
    };
  }
}

/**
 * FA President issues Disciplinary Tribunal Citation / Misconduct Review
 */
export function executeDisciplinaryCitation(
  player: Player,
  agency: AgencyState
): InteractionOutcome {
  const currentInfluence = agency.presidency?.politicalInfluence || 70;
  const updatedPlayer: Player = {
    ...player,
    morale: Math.max(30, (player.morale || 80) - 10)
  };

  const updatedAgency: AgencyState = {
    ...agency,
    presidency: {
      ...agency.presidency,
      politicalInfluence: Math.min(100, currentInfluence + 4)
    }
  };

  return {
    updatedPlayer,
    updatedAgency,
    message: `⚖️ Disciplinary Citation Handed Down: ${player.name} formally cautioned for on-field conduct. Federation disciplinary record logged (+4% Political Authority).`,
    type: 'info'
  };
}

/**
 * FA President bestows Presidential Fair Play & Merit Medal
 */
export function executePresidentialMeritMedal(
  player: Player,
  agency: AgencyState
): InteractionOutcome {
  const medalCost = 10000;
  if (agency.balance < medalCost) {
    return {
      updatedAgency: agency,
      message: `Insufficient Federation Treasury funds (€${formatMoney(medalCost)} needed) to bestow the Presidential Medal.`,
      type: 'error'
    };
  }

  const updatedPlayer: Player = {
    ...player,
    morale: 100,
    loyalty: 100
  };

  const agencyWithTransaction = recordFinancialTransaction(
    agency,
    -medalCost,
    `Presidential Merit Medal: ${player.name}`,
    `Awarded official Presidential Fair Play & Merit Gold Decoration to ${player.name}.`,
    'award'
  );

  const updatedAgency: AgencyState = {
    ...agencyWithTransaction,
    presidency: {
      ...agencyWithTransaction.presidency,
      politicalInfluence: Math.min(100, (agency.presidency?.politicalInfluence || 70) + 6)
    }
  };

  return {
    updatedPlayer,
    updatedAgency,
    message: `🎖️ Presidential Medal Bestowed! ${player.name} received the Gold Decoration for Exceptional Sportsmanship. Morale and loyalty locked to 100%!`,
    type: 'success',
    newsHeadline: `🎖️ Presidential Honors: ${player.name} Awarded Federation Medal of Merit`,
    newsContent: `At the Annual Federation Gala, President ${agency.agentName} personally conferred the Presidential Football Medal to ${player.name} (${player.clubName}).`
  };
}

/**
 * FA President appoints player as Official Grassroots Ambassador
 */
export function executeGrassrootsAmbassador(
  player: Player,
  agency: AgencyState
): InteractionOutcome {
  const currentInfluence = agency.presidency?.politicalInfluence || 70;
  const updatedPlayer: Player = {
    ...player,
    morale: Math.min(100, (player.morale || 80) + 15)
  };

  const updatedAgency: AgencyState = {
    ...agency,
    presidency: {
      ...agency.presidency,
      politicalInfluence: Math.min(100, currentInfluence + 5)
    }
  };

  return {
    updatedPlayer,
    updatedAgency,
    message: `🤝 Grassroots Ambassador Appointed: ${player.name} will headline continental youth academy and football development clinics (+5 Political Influence).`,
    type: 'success'
  };
}

/**
 * FA President awards Youth Development Grant to Club
 */
export function executeAwardYouthSubsidyGrant(
  club: Club,
  agency: AgencyState
): InteractionOutcome {
  const grantAmount = 100000;
  if (agency.balance < grantAmount) {
    return {
      updatedAgency: agency,
      message: `Insufficient Federation Treasury funds (€${formatMoney(grantAmount)} needed for youth grant).`,
      type: 'error'
    };
  }

  const updatedClub: Club = {
    ...club,
    transferBudget: club.transferBudget + grantAmount,
    chairmanTrust: Math.min(100, (club.chairmanTrust || 60) + 25)
  };

  const agencyWithTransaction = recordFinancialTransaction(
    agency,
    -grantAmount,
    `Youth Grant: ${club.name}`,
    `Disbursed €100,000 Federation youth academy modernization grant to ${club.name}.`,
    'award'
  );

  const updatedAgency: AgencyState = {
    ...agencyWithTransaction,
    presidency: {
      ...agencyWithTransaction.presidency,
      politicalInfluence: Math.min(100, (agency.presidency?.politicalInfluence || 70) + 8)
    }
  };

  return {
    updatedClub,
    updatedAgency,
    message: `🏛️ Federation Grant Disbursed! €100,000 invested into ${club.name}'s youth academy. Club chairman trust +25! (+8 Political Influence)`,
    type: 'success',
    newsHeadline: `🌱 Grassroots Investment: Federation Injects €100K into ${club.name} Youth Setup`,
    newsContent: `President ${agency.agentName} has ratified a major infrastructural grant to accelerate academy development at ${club.name}.`
  };
}

/**
 * FA President orders surprise Financial Fair Play (FFP) Forensic Audit on Club
 */
export function executeForensicFFPAudit(
  club: Club,
  agency: AgencyState
): InteractionOutcome {
  const isDeficit = (club.debtLevel || 0) > 20000000 || (club.seasonSpending || 0) > (club.seasonRevenue || 50000000);
  const currentInfluence = agency.presidency?.politicalInfluence || 70;

  if (isDeficit) {
    const fineAmount = 150000;
    const updatedClub: Club = {
      ...club,
      ffpSanctionStatus: 'fined',
      transferBudget: Math.max(0, club.transferBudget - fineAmount)
    };

    const agencyWithTransaction = recordFinancialTransaction(
      agency,
      fineAmount,
      `FFP Audit Fine: ${club.name}`,
      `Levied €150,000 Financial Fair Play accounting penalty on ${club.name}.`,
      'award'
    );

    const updatedAgency: AgencyState = {
      ...agencyWithTransaction,
      presidency: {
        ...agencyWithTransaction.presidency,
        politicalInfluence: Math.min(100, currentInfluence + 6)
      }
    };

    return {
      updatedClub,
      updatedAgency,
      message: `⚖️ FFP Breach Discovered! Accounting irregularities uncovered at ${club.name}. Levied €150,000 regulatory fine into Federation Treasury!`,
      type: 'info',
      newsHeadline: `🚨 FFP Sanction: ${club.name} Hit with €150K Fine by Federation Regulators`,
      newsContent: `Following a comprehensive financial investigation, the Federation Governance Committee confirmed ${club.name} violated spending limits.`
    };
  } else {
    return {
      updatedAgency: {
        ...agency,
        presidency: {
          ...agency.presidency,
          politicalInfluence: Math.min(100, currentInfluence + 3)
        }
      },
      message: `📑 FFP Audit Complete: ${club.name}'s balance sheets are 100% compliant with continental solvency regulations.`,
      type: 'success'
    };
  }
}


// =========================================================================
// 4. INTERACTION WITH NPC RIVAL AGENTS
// =========================================================================

/**
 * FA President audits rival agency for commission cap compliance
 */
export function executeAuditRivalAgency(
  agent: RivalAgent,
  agency: AgencyState
): InteractionOutcome {
  const hasBreach = Math.random() < 0.6;
  const currentInfluence = agency.presidency?.politicalInfluence || 70;

  if (hasBreach) {
    const fineRevenue = 75000;
    const agencyWithTransaction = recordFinancialTransaction(
      agency,
      fineRevenue,
      `Ethics Fine: ${agent.agencyName}`,
      `Levied €75,000 regulatory fine on ${agent.agencyName} for undeclared intermediary kickbacks.`,
      'award'
    );
    const updatedRival: RivalAgent = {
      ...agent,
      influence: Math.max(10, agent.influence - 10)
    };
    return {
      updatedAgency: {
        ...agencyWithTransaction,
        presidency: {
          ...agencyWithTransaction.presidency,
          politicalInfluence: Math.min(100, currentInfluence + 5)
        }
      },
      updatedRivalAgent: updatedRival,
      message: `⚖️ Compliance Breach Uncovered! ${agent.agencyName} audited for undisclosed agent fees. Levied €75,000 regulatory fine into Federation Treasury!`,
      type: 'success'
    };
  } else {
    return {
      updatedAgency: {
        ...agency,
        presidency: {
          ...agency.presidency,
          politicalInfluence: Math.min(100, currentInfluence + 2)
        }
      },
      message: `📑 Audit Complete: ${agent.agencyName}'s books are fully compliant with FIFA Commission Regulations. Transparency verified.`,
      type: 'info'
    };
  }
}

/**
 * FA President issues 6-Month License Sanction on Rival Agent
 */
export function executeSanctionRivalAgent(
  agent: RivalAgent,
  agency: AgencyState
): InteractionOutcome {
  const currentInfluence = agency.presidency?.politicalInfluence || 70;
  const updatedRival: RivalAgent = {
    ...agent,
    influence: Math.max(5, agent.influence - 25),
    relationship: Math.max(-100, agent.relationship - 40)
  };

  return {
    updatedAgency: {
      ...agency,
      presidency: {
        ...agency.presidency,
        politicalInfluence: Math.min(100, currentInfluence + 8)
      }
    },
    updatedRivalAgent: updatedRival,
    message: `🚫 6-Month License Suspension Issued! ${agent.name} (${agent.agencyName}) sanctioned for illegal player touting and prohibited third-party ownership.`,
    type: 'info'
  };
}

/**
 * Club President designates rival agent as Preferred Club Intermediary
 */
export function executeGrantPreferredIntermediary(
  agent: RivalAgent,
  agency: AgencyState
): InteractionOutcome {
  const updatedRival: RivalAgent = {
    ...agent,
    relationship: 100
  };

  return {
    updatedAgency: agency,
    updatedRivalAgent: updatedRival,
    message: `🤝 Preferred Intermediary Mandate Granted! ${agent.agencyName} is now your club's official scouting partner. Future transfer agency fees discounted!`,
    type: 'success'
  };
}

/**
 * Club President blacklists rival agent from training ground
 */
export function executeBlacklistRivalAgent(
  agent: RivalAgent,
  agency: AgencyState
): InteractionOutcome {
  const updatedRival: RivalAgent = {
    ...agent,
    relationship: -100
  };

  return {
    updatedAgency: agency,
    updatedRivalAgent: updatedRival,
    message: `🚫 Training Ground Blacklist Enacted! ${agent.name} declared Persona Non Grata. Security instructed to bar them from entering club facilities to prevent player tapping!`,
    type: 'info'
  };
}

/**
 * Agent forms strategic Co-Representation Alliance with Rival Agent
 */
export function executeCoRepresentationAlliance(
  agent: RivalAgent,
  agency: AgencyState
): InteractionOutcome {
  const allianceCost = 15000;
  if (agency.balance < allianceCost) {
    return {
      updatedAgency: agency,
      message: `Need €15,000 for formal agency partnership legal retainers.`,
      type: 'error'
    };
  }

  const updatedRival: RivalAgent = {
    ...agent,
    relationship: Math.min(100, agent.relationship + 50)
  };

  const agencyWithTransaction = recordFinancialTransaction(
    agency,
    -allianceCost,
    `Co-Representation Alliance: ${agent.agencyName}`,
    `Established cross-border talent sharing alliance with ${agent.agencyName}.`,
    'acquisition'
  );

  const updatedAgency: AgencyState = {
    ...agencyWithTransaction,
    reputation: Math.min(100, agency.reputation + 4)
  };

  return {
    updatedAgency,
    updatedRivalAgent: updatedRival,
    message: `🤝 Strategic Alliance Formed! Partnered with ${agent.name} (${agent.agencyName}). Shared scouting network unlocked (+4 Agency Reputation)!`,
    type: 'success'
  };
}

/**
 * Agent plants Smear Rumor about Rival Agent in the Tabloids
 */
export function executePlantSmearCampaign(
  agent: RivalAgent,
  agency: AgencyState
): InteractionOutcome {
  const smearCost = 20000;
  if (agency.balance < smearCost) {
    return {
      updatedAgency: agency,
      message: `Need €20,000 for covert media disinformation campaign.`,
      type: 'error'
    };
  }

  const updatedRival: RivalAgent = {
    ...agent,
    influence: Math.max(5, agent.influence - 20),
    relationship: Math.max(-100, agent.relationship - 30)
  };

  const agencyWithTransaction = recordFinancialTransaction(
    agency,
    -smearCost,
    `Covert Media Operation: ${agent.agencyName}`,
    `Funded investigative hit-piece questioning ${agent.agencyName}'s fiscal transparency.`,
    'acquisition'
  );

  const updatedAgency: AgencyState = {
    ...agencyWithTransaction,
    darkArtsScore: (agency.darkArtsScore || 0) + 2
  };

  return {
    updatedAgency,
    updatedRivalAgent: updatedRival,
    message: `🗡️ Smear Campaign Executed! Damaging exposé published on ${agent.agencyName}. Rival influence dropped by 20! (+2 Dark Arts)`,
    type: 'info'
  };
}

// =========================================================================
// 5. CLUB PRESIDENT & SPORTING DIRECTOR EXECUTIVE GOVERNANCE
// =========================================================================

/**
 * Returns available elite Sporting Directors on the market
 */
export function getMarketSportingDirectors(): SportingDirectorProfile[] {
  return [
    {
      id: 'sd_cand_1',
      name: 'Michael Edwards',
      avatar: '📊',
      rating: 96,
      scoutingRating: 97,
      tacticalFocus: 'Moneyball Analytics',
      personality: 'Shrewd Operator',
      wage: 35000,
      contractYears: 3,
      dealSuccessBonus: 18,
      historicalSigningsCount: 38,
      totalSpent: 420000000
    },
    {
      id: 'sd_cand_2',
      name: 'Txiki Begiristain',
      avatar: '💼',
      rating: 95,
      scoutingRating: 93,
      tacticalFocus: 'Possession',
      personality: 'Visionary Architect',
      wage: 38000,
      contractYears: 3,
      dealSuccessBonus: 16,
      historicalSigningsCount: 52,
      totalSpent: 890000000
    },
    {
      id: 'sd_cand_3',
      name: 'Luis Campos',
      avatar: '🔍',
      rating: 94,
      scoutingRating: 98,
      tacticalFocus: 'Youth-First',
      personality: 'Shrewd Operator',
      wage: 32000,
      contractYears: 3,
      dealSuccessBonus: 15,
      historicalSigningsCount: 44,
      totalSpent: 380000000
    },
    {
      id: 'sd_cand_4',
      name: 'Andrea Berta',
      avatar: '🛡️',
      rating: 91,
      scoutingRating: 90,
      tacticalFocus: 'Counter-Attack',
      personality: 'Hardline Negotiator',
      wage: 28000,
      contractYears: 3,
      dealSuccessBonus: 12,
      historicalSigningsCount: 35,
      totalSpent: 290000000
    },
    {
      id: 'sd_cand_5',
      name: 'Simon Rolfes',
      avatar: '🏆',
      rating: 92,
      scoutingRating: 94,
      tacticalFocus: 'Attacking',
      personality: 'Visionary Architect',
      wage: 29000,
      contractYears: 3,
      dealSuccessBonus: 14,
      historicalSigningsCount: 26,
      totalSpent: 185000000
    },
    {
      id: 'sd_cand_6',
      name: 'Mateu Alemany',
      avatar: '⚖️',
      rating: 93,
      scoutingRating: 88,
      tacticalFocus: 'Moneyball Analytics',
      personality: 'Hardline Negotiator',
      wage: 30000,
      contractYears: 3,
      dealSuccessBonus: 15,
      historicalSigningsCount: 41,
      totalSpent: 310000000
    }
  ];
}

/**
 * President hires a new Sporting Director
 */
export function executeHireSportingDirector(
  club: Club,
  candidate: SportingDirectorProfile,
  agency: AgencyState
): InteractionOutcome {
  const signingBonus = candidate.wage * 4; // 1 month wage
  if (club.transferBudget < signingBonus) {
    return {
      updatedAgency: agency,
      message: `Club transfer treasury insufficient to pay executive appointment fee (€${formatMoney(signingBonus)}).`,
      type: 'error'
    };
  }

  const updatedClub: Club = {
    ...club,
    sportingDirector: candidate.name,
    sportingDirectorProfile: candidate,
    transferBudget: club.transferBudget - signingBonus,
    staffList: (club.staffList || []).map(stf =>
      stf.role === 'Head Scout' ? { ...stf, name: `${candidate.name} Scouting Unit`, rating: candidate.scoutingRating } : stf
    )
  };

  return {
    updatedClub,
    updatedAgency: agency,
    message: `👔 Executive Appointment Ratified! ${candidate.name} appointed as Chief Sporting Director (${candidate.rating} OVR, ${candidate.tacticalFocus} Focus).`,
    type: 'success',
    newsHeadline: `👔 Boardroom Shakeup: ${candidate.name} Appointed Sporting Director at ${club.name}`,
    newsContent: `Club President ${agency.agentName} has formally presented ${candidate.name} as the new sporting architect of ${club.name}, taking charge of all transfer negotiations.`
  };
}

/**
 * Club President gives an executive negotiation mandate to the Sporting Director for an incoming target
 */
export function orderSportingDirectorNegotiate(
  club: Club,
  targetPlayer: Player,
  targetPriceCeiling: number,
  targetWageCeiling: number,
  priority: 'Urgent Priority' | 'Balanced Strategy' | 'Bargain Hunting',
  currentWeek: number,
  currentSeason: number,
  agency: AgencyState
): InteractionOutcome {
  const sd = club.sportingDirectorProfile || {
    id: 'sd_default',
    name: club.sportingDirector || 'Director of Football',
    avatar: '👔',
    rating: 78,
    scoutingRating: 78,
    tacticalFocus: 'Pragmatic',
    personality: 'Shrewd Operator',
    wage: 25000,
    contractYears: 2,
    dealSuccessBonus: 8
  };

  // Base seller asking price
  const sellerAskingFee = Math.round(targetPlayer.value * (targetPlayer.potential > 85 ? 1.35 : 1.15));
  const playerExpectedWage = Math.max(targetPlayer.wage || 30000, Math.round((targetPlayer.value * 0.0025)));

  // Calculate negotiation success roll based on SD competence + priority
  const sdCompetenceMod = (sd.rating - 70) * 1.2;
  const priceMarginMod = ((targetPriceCeiling - sellerAskingFee) / (sellerAskingFee || 1)) * 40;
  const wageMarginMod = ((targetWageCeiling - playerExpectedWage) / (playerExpectedWage || 1)) * 30;
  const priorityMod = priority === 'Urgent Priority' ? 15 : priority === 'Bargain Hunting' ? -10 : 0;

  const baseSuccessChance = Math.min(95, Math.max(15, 60 + sdCompetenceMod + priceMarginMod + wageMarginMod + priorityMod + (sd.dealSuccessBonus || 0)));
  const roll = Math.random() * 100;
  const isSuccessful = roll <= baseSuccessChance;

  if (!isSuccessful) {
    const failureReasons = [
      `${targetPlayer.clubName} rejected initial valuation and refused to enter formal talks below €${formatMoney(sellerAskingFee * 1.25)}.`,
      `Player's agent demanded exorbitant signing fees (€${formatMoney(targetPlayer.value * 0.15)}) that exceeded club parameters.`,
      `Rival European clubs entered a bidding war, driving the price beyond your €${formatMoney(targetPriceCeiling)} ceiling.`,
      `${targetPlayer.name} requested guaranteed UEFA Champions League minutes before committing.`
    ];
    const reason = failureReasons[Math.floor(Math.random() * failureReasons.length)];

    const task: SportingDirectorTask = {
      id: `task_${Date.now()}_${targetPlayer.id}`,
      type: 'target_signing',
      playerId: targetPlayer.id,
      playerName: targetPlayer.name,
      playerPosition: targetPlayer.position,
      playerRating: targetPlayer.rating,
      playerAge: targetPlayer.age,
      playerClubName: targetPlayer.clubName,
      playerClubId: targetPlayer.clubId,
      targetPriceCeiling,
      targetWageCeiling,
      negotiationPriority: priority,
      progress: 40,
      status: 'failed_breakdown',
      failureReason: reason,
      logs: [
        { week: currentWeek, text: `Initiated talks with ${targetPlayer.clubName} sporting desk.`, successProbability: Math.round(baseSuccessChance) },
        { week: currentWeek, text: `Negotiations broke down: ${reason}`, successProbability: 0 }
      ]
    };

    const updatedTasks = [task, ...(club.sportingDirectorTasks || [])].slice(0, 15);
    const updatedClub: Club = {
      ...club,
      sportingDirectorTasks: updatedTasks
    };

    return {
      updatedClub,
      updatedAgency: agency,
      message: `❌ Negotiations Breakdown: ${sd.name} reported that talks for ${targetPlayer.name} collapsed. (${reason})`,
      type: 'info'
    };
  }

  // Success! Calculate negotiated terms based on SD personality
  let discount = 0;
  if (sd.personality === 'Shrewd Operator') discount = 0.12;
  else if (sd.personality === 'Hardline Negotiator') discount = 0.15;
  else if (sd.personality === 'Visionary Architect') discount = 0.08;

  const negotiatedFee = Math.max(100000, Math.round(Math.min(targetPriceCeiling, sellerAskingFee * (1 - discount))));
  const negotiatedWage = Math.max(5000, Math.round(Math.min(targetWageCeiling, playerExpectedWage * 1.1)));
  const negotiatedYears = targetPlayer.age < 23 ? 5 : targetPlayer.age < 29 ? 4 : 2;
  const agentFee = Math.round(negotiatedFee * 0.08);

  const directorConfidence = Math.min(99, Math.max(65, Math.round(sd.rating + (targetPriceCeiling - negotiatedFee) / 1000000)));
  const assessment: PresidentialTransferProposal['directorAssessment'] =
    negotiatedFee < targetPlayer.value * 0.85 ? 'bargain' :
    negotiatedFee > targetPlayer.value * 1.25 ? 'expensive' :
    targetPlayer.rating >= 88 ? 'marquee_investment' : 'fair_value';

  const spendLimit = club.boardOfDirectors?.spendingLimitPerTransfer || 45000000;
  const wageCap = club.boardOfDirectors?.wageCapPerPlayer || 200000;

  const boardVerdict: PresidentialTransferProposal['boardVerdict'] =
    negotiatedFee > spendLimit ? 'requires_vote' :
    negotiatedWage > wageCap ? 'warning' :
    negotiatedFee > spendLimit * 0.8 ? 'caution' : 'approved';

  const boardNotes =
    boardVerdict === 'requires_vote' ? `⚠️ Exceeds standard board spending limit (€${formatMoney(spendLimit)}). Requires Board of Directors approval.` :
    boardVerdict === 'warning' ? `⚠️ Player wage (€${formatMoney(negotiatedWage)}/wk) tests our wage ceiling. Strict performance clauses recommended.` :
    boardVerdict === 'caution' ? `Prudent deal, but monitor season Financial Fair Play reserves.` :
    `✅ Fully within fiscal governance guidelines. High commercial ROI anticipated.`;

  const proposal: PresidentialTransferProposal = {
    id: `prop_in_${Date.now()}_${targetPlayer.id}`,
    type: 'incoming_signing',
    playerId: targetPlayer.id,
    playerName: targetPlayer.name,
    playerAvatarEmoji: targetPlayer.avatarEmoji || '⚽',
    playerPosition: targetPlayer.position,
    playerRating: targetPlayer.rating,
    playerAge: targetPlayer.age,
    playerNationality: targetPlayer.nationality,
    currentClubId: targetPlayer.clubId,
    currentClubName: targetPlayer.clubName,
    otherClubId: targetPlayer.clubId,
    otherClubName: targetPlayer.clubName,
    negotiatedFee,
    negotiatedWage,
    negotiatedContractYears: negotiatedYears,
    agentCommission: agentFee,
    directorNotes: `${sd.name} successfully agreed terms with ${targetPlayer.clubName}. Player is enthusiastic about the sporting project and ready for medical examination.`,
    directorConfidence,
    directorAssessment: assessment,
    boardVerdict,
    boardNotes,
    ffpRisk: negotiatedFee > 60000000 ? 'high' : negotiatedFee > 30000000 ? 'moderate' : 'low',
    status: 'pending_president_approval',
    initiatedBy: 'president_directive',
    createdAtWeek: currentWeek,
    createdAtSeason: currentSeason,
    expiresInWeeks: 2
  };

  const task: SportingDirectorTask = {
    id: `task_${Date.now()}_${targetPlayer.id}`,
    type: 'target_signing',
    playerId: targetPlayer.id,
    playerName: targetPlayer.name,
    playerPosition: targetPlayer.position,
    playerRating: targetPlayer.rating,
    playerAge: targetPlayer.age,
    playerClubName: targetPlayer.clubName,
    playerClubId: targetPlayer.clubId,
    targetPriceCeiling,
    targetWageCeiling,
    negotiationPriority: priority,
    progress: 100,
    status: 'completed_pending_approval',
    logs: [
      { week: currentWeek, text: `Opened formal transfer channels with ${targetPlayer.clubName}.`, successProbability: Math.round(baseSuccessChance) },
      { week: currentWeek, text: `Agreed personal terms with agent (€${formatMoney(negotiatedWage)}/wk, ${negotiatedYears} yrs).`, successProbability: 95 },
      { week: currentWeek, text: `Agreement finalized at €${formatMoney(negotiatedFee)}. Awaiting President's final signature.`, successProbability: 100 }
    ]
  };

  const updatedProposals = [proposal, ...(club.pendingPresidentialTransfers || [])].filter((p, i, self) => self.findIndex(t => t.id === p.id) === i);
  const updatedTasks = [task, ...(club.sportingDirectorTasks || [])].slice(0, 15);

  const updatedClub: Club = {
    ...club,
    pendingPresidentialTransfers: updatedProposals,
    sportingDirectorTasks: updatedTasks
  };

  return {
    updatedClub,
    updatedAgency: agency,
    message: `🤝 Deal Agreed! ${sd.name} successfully negotiated €${formatMoney(negotiatedFee)} fee & €${formatMoney(negotiatedWage)}/wk wage for ${targetPlayer.name}. Awaiting your presidential approval!`,
    type: 'success',
    newsHeadline: `📑 Terms Agreed: ${targetPlayer.name} Nears Move to ${club.name} Pending Presidential Approval`,
    newsContent: `Following negotiations led by Sporting Director ${sd.name}, ${club.name} have concluded an agreement with ${targetPlayer.clubName} for ${targetPlayer.name}. The transfer now awaits the formal signature of President ${agency.agentName}.`
  };
}

/**
 * Club President instructs Sporting Director to shop/offload a squad player on the open market.
 * The President sets minimum fees, loan/sale terms, and clauses (Sell-On %, Buyback, Rival prohibitions),
 * and the Sporting Director offers the player to candidate clubs and negotiates structured offers
 * that await the President's final signature.
 */
export function orderSportingDirectorOffload(
  club: Club,
  squadPlayer: Player,
  minAskingPriceOrOptions: number | OffloadMandateOptions,
  modeOrAllClubs: 'sale' | 'loan' | Club[],
  allClubsOrWeek?: Club[] | number,
  currentWeekOrSeason?: number,
  currentSeasonOrAgency?: number | AgencyState,
  agencyOrUndefined?: AgencyState,
  initiatedByStaff: 'president_directive' | 'coach_recommendation' | 'cfo_financial_mandate' | 'technical_director_advice' = 'president_directive'
): InteractionOutcome {
  // Normalize parameters
  let options: OffloadMandateOptions;
  let allClubs: Club[];
  let currentWeek: number;
  let currentSeason: number;
  let agency: AgencyState;

  if (typeof minAskingPriceOrOptions === 'object') {
    options = minAskingPriceOrOptions;
    allClubs = modeOrAllClubs as Club[];
    currentWeek = allClubsOrWeek as number;
    currentSeason = currentWeekOrSeason as number;
    agency = currentSeasonOrAgency as AgencyState;
  } else {
    options = {
      mode: modeOrAllClubs as 'sale' | 'loan',
      minAskingPrice: minAskingPriceOrOptions,
      minWageContributionPercent: 100,
      sellOnClausePercent: 10,
      enableBuyback: false,
      prohibitDomesticRivals: false,
      performanceAddonsRequired: false,
      priorityStrategy: 'Balanced Strategy' as any
    };
    allClubs = allClubsOrWeek as Club[];
    currentWeek = currentWeekOrSeason as number;
    currentSeason = currentSeasonOrAgency as number;
    agency = agencyOrUndefined as AgencyState;
  }

  const {
    mode,
    minAskingPrice,
    minWageContributionPercent = 100,
    sellOnClausePercent = 0,
    enableBuyback = false,
    buybackPriceMultiplier = 1.5,
    prohibitDomesticRivals = false,
    performanceAddonsRequired = false,
    priorityStrategy = 'Competitive Auction'
  } = options;

  const sd = club.sportingDirectorProfile || {
    id: 'sd_default',
    name: club.sportingDirector || 'Director of Football',
    rating: 78,
    scoutingRating: 78,
    tacticalFocus: 'Pragmatic',
    personality: 'Shrewd Operator',
    wage: 25000,
    contractYears: 2,
    dealSuccessBonus: 8
  };

  // Filter potential buyer clubs across markets (excluding selling club and domestic rivals if prohibited)
  const candidateClubs = allClubs.filter(c => {
    if (c.id === club.id) return false;
    if (prohibitDomesticRivals && c.league === club.league) return false;

    if (mode === 'loan') {
      return (c.wageBudget >= (squadPlayer.wage || 20000) * 0.5) && Math.abs(c.reputation - club.reputation) <= 35;
    } else {
      const minAffordable = minAskingPrice > 0 ? minAskingPrice * 0.65 : squadPlayer.value * 0.5;
      return c.transferBudget >= minAffordable && Math.abs(c.reputation - club.reputation) <= 30;
    }
  });

  if (candidateClubs.length === 0) {
    const reasonDetail = prohibitDomesticRivals
      ? `No international clubs outside of ${club.league} could meet the €${formatMoney(minAskingPrice)} asking criteria.`
      : `No external clubs currently have the financial bandwidth to meet the €${formatMoney(minAskingPrice)} minimum asking price for ${squadPlayer.name}.`;

    return {
      updatedAgency: agency,
      message: `🚫 Sporting Director Report: ${reasonDetail} Consider lowering asking price or loosening rival restrictions.`,
      type: 'error'
    };
  }

  // Shuffle & select bidders (up to 3 competing clubs)
  const shuffled = [...candidateClubs].sort(() => 0.5 - Math.random());
  const competingBidders = shuffled.slice(0, priorityStrategy === 'Competitive Auction' ? Math.min(3, shuffled.length) : 1);
  const winningBuyerClub = competingBidders[0];

  // Calculate negotiated transfer/loan fee based on auction competition and SD competence
  const sdBonusFactor = 1 + ((sd.rating - 70) / 150); // e.g. 1.05 - 1.15
  const competitionMultiplier = competingBidders.length > 1 ? 1.08 + (competingBidders.length * 0.04) : 1.0;
  
  let negotiatedFee = 0;
  if (mode === 'sale') {
    const baseValue = Math.max(minAskingPrice, squadPlayer.value);
    negotiatedFee = Math.round(baseValue * sdBonusFactor * competitionMultiplier * (0.95 + Math.random() * 0.2));
    if (minAskingPrice > 0) {
      negotiatedFee = Math.max(minAskingPrice, negotiatedFee);
    }
  } else {
    // Loan fee
    negotiatedFee = Math.max(0, Math.round(squadPlayer.value * (0.04 + Math.random() * 0.06) * sdBonusFactor));
  }

  const negotiatedWage = Math.round((squadPlayer.wage || 30000) * (mode === 'loan' ? 1.0 : 1.05));
  const buybackPrice = enableBuyback ? Math.round(negotiatedFee * buybackPriceMultiplier) : undefined;
  
  const performanceAddons = performanceAddonsRequired ? {
    appearanceBonusFee: Math.round(negotiatedFee * 0.08),
    goalMilestoneBonusFee: Math.round(negotiatedFee * 0.05),
    trophyBonusFee: Math.round(negotiatedFee * 0.1)
  } : undefined;

  const competingNotes = competingBidders.length > 1
    ? `🔥 Competitive Bidding War: ${sd.name} leveraged inquiries from ${competingBidders.map(c => c.name).join(', ')} to drive the final price to €${formatMoney(negotiatedFee)}.`
    : `Market Offering: ${winningBuyerClub.name} submitted a formal offer matching the mandated parameters.`;

  const clausesSummary = [
    sellOnClausePercent > 0 ? `${sellOnClausePercent}% Sell-On Clause` : null,
    buybackPrice ? `€${formatMoney(buybackPrice)} Buy-Back Clause` : null,
    mode === 'loan' ? `${minWageContributionPercent}% Wage Coverage` : null,
    performanceAddonsRequired ? `Performance Milestone Add-ons` : null,
    prohibitDomesticRivals ? `Domestic Rival Transfer Prohibited` : null
  ].filter(Boolean).join(' • ');

  const proposal: PresidentialTransferProposal = {
    id: `prop_out_${Date.now()}_${squadPlayer.id}`,
    type: mode === 'sale' ? 'outgoing_sale' : 'outgoing_loan',
    playerId: squadPlayer.id,
    playerName: squadPlayer.name,
    playerAvatarEmoji: squadPlayer.avatarEmoji || '⚽',
    playerPosition: squadPlayer.position,
    playerRating: squadPlayer.rating,
    playerAge: squadPlayer.age,
    playerNationality: squadPlayer.nationality,
    currentClubId: club.id,
    currentClubName: club.name,
    otherClubId: winningBuyerClub.id,
    otherClubName: winningBuyerClub.name,
    negotiatedFee,
    negotiatedWage,
    negotiatedContractYears: mode === 'sale' ? 3 : 1,
    agentCommission: 0,
    sellOnClausePercent: sellOnClausePercent > 0 ? sellOnClausePercent : undefined,
    buybackClausePrice: buybackPrice,
    wageContributionPercent: mode === 'loan' ? minWageContributionPercent : undefined,
    prohibitRivalTransfers: prohibitDomesticRivals,
    performanceAddons,
    competingBidsCount: competingBidders.length,
    directorNotes: `${competingNotes} Agreed clauses: ${clausesSummary || 'Standard Direct Transfer'}.`,
    directorConfidence: 94,
    directorAssessment: negotiatedFee >= squadPlayer.value * 1.1 ? 'marquee_investment' : negotiatedFee >= squadPlayer.value ? 'fair_value' : 'bargain',
    boardVerdict: 'approved',
    boardNotes: `✅ Generates €${formatMoney(negotiatedFee)} in liquidity & clears €${formatMoney(squadPlayer.wage || 0)}/wk from wage budget.`,
    ffpRisk: 'low',
    status: 'pending_president_approval',
    initiatedBy: initiatedByStaff,
    createdAtWeek: currentWeek,
    createdAtSeason: currentSeason,
    expiresInWeeks: 2
  };

  const task: SportingDirectorTask = {
    id: `task_offload_${Date.now()}_${squadPlayer.id}`,
    type: mode === 'sale' ? 'offload_player' : 'target_loan_out',
    playerId: squadPlayer.id,
    playerName: squadPlayer.name,
    playerPosition: squadPlayer.position,
    playerRating: squadPlayer.rating,
    playerAge: squadPlayer.age,
    playerClubName: club.name,
    playerClubId: club.id,
    targetPriceCeiling: minAskingPrice,
    targetWageCeiling: squadPlayer.wage || 30000,
    negotiationPriority: priorityStrategy === 'Fast Clearance' ? 'Urgent Priority' : 'Balanced Strategy',
    progress: 100,
    status: 'completed_pending_approval',
    logs: [
      { week: currentWeek, text: `Circulated dossier to ${candidateClubs.length} potential buyer clubs across Europe.`, successProbability: 90 },
      { week: currentWeek, text: `Conducted multi-club bidding round (${competingBidders.length} bids received).`, successProbability: 95 },
      { week: currentWeek, text: `Structured deal with ${winningBuyerClub.name} including agreed clauses. Awaiting Presidential Signature.`, successProbability: 100 }
    ]
  };

  const updatedProposals = [proposal, ...(club.pendingPresidentialTransfers || [])].filter((p, idx, self) => self.findIndex(t => t.id === p.id) === idx);
  const updatedTasks = [task, ...(club.sportingDirectorTasks || [])].slice(0, 20);

  const updatedClub: Club = {
    ...club,
    pendingPresidentialTransfers: updatedProposals,
    sportingDirectorTasks: updatedTasks
  };

  const formattedMsg = mode === 'sale'
    ? `📤 Bid Agreed! ${winningBuyerClub.name} agreed to purchase ${squadPlayer.name} for €${formatMoney(negotiatedFee)}${sellOnClausePercent > 0 ? ` (+${sellOnClausePercent}% sell-on)` : ''}. Awaiting your presidential signature!`
    : `🔄 Loan Bid Agreed! ${winningBuyerClub.name} agreed to take ${squadPlayer.name} on loan covering ${minWageContributionPercent}% wages. Awaiting your presidential signature!`;

  return {
    updatedClub,
    updatedAgency: agency,
    message: formattedMsg,
    type: 'success',
    newsHeadline: `📑 Formal Offer: ${winningBuyerClub.name} Agree Terms for ${squadPlayer.name}`,
    newsContent: `Following market circulation led by Sporting Director ${sd.name}, ${winningBuyerClub.name} have concluded an agreement with ${club.name} for ${squadPlayer.name}. The deal now sits on President ${agency.agentName}'s desk awaiting formal executive signature.`
  };
}

/**
 * Generates realistic internal staff requests (Head Coach, CFO, Technical Director, Chief Scout)
 * for the Club President to review, authorize, or dismiss.
 */
export function generateWeeklyInternalStaffRequests(
  club: Club,
  squadPlayers: Player[],
  allPlayers: Player[],
  allClubs: Club[],
  currentWeek: number,
  currentSeason: number
): Club {
  const existingRequests = club.internalTransferRequests || [];
  // Keep recent active requests (limit backlog)
  const activeRequests = existingRequests.filter(r => r.status === 'pending_president_authorization' && (currentWeek - r.weekSubmitted) <= 4);

  if (activeRequests.length >= 3) {
    return { ...club, internalTransferRequests: activeRequests };
  }

  const newRequests: InternalClubTransferRequest[] = [...activeRequests];

  // 1. Head Coach Tactical Request (Offload or Sign)
  const coachName = club.headCoach || club.managerName || 'Head Coach Roberto';
  const lowMoraleOrRedundant = squadPlayers.find(p => p.morale < 45 || (p.age > 30 && p.rating < 74) || p.unregisteredWeeks);
  
  if (lowMoraleOrRedundant && !newRequests.some(r => r.playerId === lowMoraleOrRedundant.id)) {
    newRequests.push({
      id: `req_coach_${Date.now()}_${lowMoraleOrRedundant.id}`,
      requesterName: coachName,
      requesterRole: 'Head Coach',
      requesterAvatar: '📋',
      type: 'request_offload',
      playerId: lowMoraleOrRedundant.id,
      playerName: lowMoraleOrRedundant.name,
      playerPosition: lowMoraleOrRedundant.position,
      playerRating: lowMoraleOrRedundant.rating,
      playerAge: lowMoraleOrRedundant.age,
      playerValue: lowMoraleOrRedundant.value,
      playerWage: lowMoraleOrRedundant.wage,
      reasoning: `Tactical Mismatch: ${lowMoraleOrRedundant.name} is surplus to our current tactical system and dressing room dynamic. Recommend offloading this window to free squad space.`,
      urgency: 'tactical_priority',
      suggestedMinFee: Math.round(lowMoraleOrRedundant.value * 0.85),
      recommendedClauses: ['10% Sell-On Clause', 'Quick Exit Priority'],
      status: 'pending_president_authorization',
      weekSubmitted: currentWeek,
      seasonSubmitted: currentSeason
    });
  }

  // 2. CFO Financial Optimization Request
  const highEarnerFringe = squadPlayers.find(p => (p.wage || 0) >= 50000 && p.rating < 80 && !newRequests.some(r => r.playerId === p.id));
  if (highEarnerFringe) {
    newRequests.push({
      id: `req_cfo_${Date.now()}_${highEarnerFringe.id}`,
      requesterName: 'Elena Rostova (CFO)',
      requesterRole: 'Chief Financial Officer',
      requesterAvatar: '💼',
      type: 'request_offload',
      playerId: highEarnerFringe.id,
      playerName: highEarnerFringe.name,
      playerPosition: highEarnerFringe.position,
      playerRating: highEarnerFringe.rating,
      playerAge: highEarnerFringe.age,
      playerValue: highEarnerFringe.value,
      playerWage: highEarnerFringe.wage,
      reasoning: `Wage Bill Optimization: ${highEarnerFringe.name} consumes €${formatMoney(highEarnerFringe.wage || 0)}/wk. Offloading or loaning will restore fiscal liquidity and strengthen FFP compliance.`,
      urgency: 'financial_urgent',
      suggestedMinFee: Math.round(highEarnerFringe.value * 0.9),
      recommendedClauses: ['100% Wage Relief', 'Installment Structuring'],
      status: 'pending_president_authorization',
      weekSubmitted: currentWeek,
      seasonSubmitted: currentSeason
    });
  }

  // 3. Technical Director / Scout Youth Development Loan Request
  const youngTalentLoan = squadPlayers.find(p => p.age <= 21 && p.potential > 80 && p.rating < 77 && !p.isOnLoan && !newRequests.some(r => r.playerId === p.id));
  if (youngTalentLoan) {
    newRequests.push({
      id: `req_tech_${Date.now()}_${youngTalentLoan.id}`,
      requesterName: club.sportingDirectorProfile?.name || 'Technical Director',
      requesterRole: 'Technical Director',
      requesterAvatar: '🎯',
      type: 'request_loan_out',
      playerId: youngTalentLoan.id,
      playerName: youngTalentLoan.name,
      playerPosition: youngTalentLoan.position,
      playerRating: youngTalentLoan.rating,
      playerAge: youngTalentLoan.age,
      playerValue: youngTalentLoan.value,
      playerWage: youngTalentLoan.wage,
      reasoning: `Development Loan: ${youngTalentLoan.name} (Potential: ${youngTalentLoan.potential}) needs regular first-team minutes to accelerate development. Recommend finding a loan destination with starting guarantees.`,
      urgency: 'routine',
      suggestedMinFee: 0,
      recommendedClauses: ['Recall Option', 'Guaranteed Starter Clause'],
      status: 'pending_president_authorization',
      weekSubmitted: currentWeek,
      seasonSubmitted: currentSeason
    });
  }

  // 4. Chief Scout Target Recommendation (Incoming)
  if (club.transferBudget >= 20000000 && !newRequests.some(r => r.type === 'request_signing')) {
    const scoutTarget = allPlayers.find(p => p.clubId !== club.id && p.potential >= 84 && p.value <= club.transferBudget * 0.7);
    if (scoutTarget) {
      newRequests.push({
        id: `req_scout_${Date.now()}_${scoutTarget.id}`,
        requesterName: 'Luc Moreau (Chief Scout)',
        requesterRole: 'Chief Scout',
        requesterAvatar: '🔍',
        type: 'request_signing',
        playerId: scoutTarget.id,
        playerName: scoutTarget.name,
        playerPosition: scoutTarget.position,
        playerRating: scoutTarget.rating,
        playerAge: scoutTarget.age,
        playerClubName: scoutTarget.clubName,
        playerValue: scoutTarget.value,
        playerWage: scoutTarget.wage,
        reasoning: `Scouted Gem: ${scoutTarget.name} (${scoutTarget.position}, ${scoutTarget.rating} OVR, ${scoutTarget.potential} POT) at ${scoutTarget.clubName} fits our club profile perfectly. Highly recommended acquisition.`,
        urgency: 'routine',
        suggestedMaxFee: Math.round(scoutTarget.value * 1.15),
        suggestedWage: Math.round((scoutTarget.wage || 25000) * 1.2),
        status: 'pending_president_authorization',
        weekSubmitted: currentWeek,
        seasonSubmitted: currentSeason
      });
    }
  }

  return {
    ...club,
    internalTransferRequests: newRequests.slice(0, 6)
  };
}

/**
 * President authorizes or dismisses an internal staff transfer request
 */
export function authorizeInternalStaffTransferRequest(
  requestId: string,
  action: 'authorize' | 'dismiss',
  club: Club,
  allPlayers: Player[],
  allClubs: Club[],
  agency: AgencyState,
  currentWeek: number,
  currentSeason: number
): InteractionOutcome {
  const request = (club.internalTransferRequests || []).find(r => r.id === requestId);
  if (!request) {
    return {
      updatedAgency: agency,
      message: 'Staff transfer request not found.',
      type: 'error'
    };
  }

  if (action === 'dismiss') {
    const updatedRequests = (club.internalTransferRequests || []).map(r =>
      r.id === requestId ? { ...r, status: 'dismissed' as const } : r
    );
    return {
      updatedClub: { ...club, internalTransferRequests: updatedRequests },
      updatedAgency: agency,
      message: `❌ Dismissed ${request.requesterName}'s recommendation regarding ${request.playerName}.`,
      type: 'info'
    };
  }

  // Authorize: dispatch the Sporting Director to execute the mandate
  const updatedRequests = (club.internalTransferRequests || []).map(r =>
    r.id === requestId ? { ...r, status: 'authorized' as const } : r
  );

  const staffOrigin = request.requesterRole === 'Head Coach'
    ? 'coach_recommendation'
    : request.requesterRole === 'Chief Financial Officer'
    ? 'cfo_financial_mandate'
    : 'technical_director_advice';

  if (request.type === 'request_offload' || request.type === 'request_loan_out') {
    const player = allPlayers.find(p => p.id === request.playerId);
    if (!player) {
      return {
        updatedAgency: agency,
        message: `Player ${request.playerName} not found in squad registry.`,
        type: 'error'
      };
    }

    const outcome = orderSportingDirectorOffload(
      { ...club, internalTransferRequests: updatedRequests },
      player,
      {
        mode: request.type === 'request_loan_out' ? 'loan' : 'sale',
        minAskingPrice: request.suggestedMinFee || Math.round(player.value * 0.8),
        sellOnClausePercent: 10,
        minWageContributionPercent: 100,
        priorityStrategy: 'Competitive Auction'
      },
      allClubs,
      currentWeek,
      currentSeason,
      agency,
      undefined,
      staffOrigin
    );

    return outcome;
  } else {
    // Request Signing
    const targetPlayer = allPlayers.find(p => p.id === request.playerId);
    if (!targetPlayer) {
      return {
        updatedAgency: agency,
        message: `Target player ${request.playerName} not found.`,
        type: 'error'
      };
    }

    const outcome = orderSportingDirectorNegotiate(
      { ...club, internalTransferRequests: updatedRequests },
      targetPlayer,
      request.suggestedMaxFee || Math.round(targetPlayer.value * 1.15),
      request.suggestedWage || Math.round((targetPlayer.wage || 30000) * 1.2),
      'Balanced Strategy',
      currentWeek,
      currentSeason,
      agency
    );

    return outcome;
  }
}

/**
 * President renders final decision on a transfer proposal (Approve, Reject, or Request Better Terms)
 */
export function executePresidentialTransferDecision(
  proposalId: string,
  decision: 'approve' | 'reject' | 'demand_renegotiate',
  club: Club,
  allPlayers: Player[],
  allClubs: Club[],
  agency: AgencyState,
  currentWeek: number,
  currentSeason: number
): InteractionOutcome {
  const proposal = (club.pendingPresidentialTransfers || []).find(p => p.id === proposalId);
  if (!proposal) {
    return {
      updatedAgency: agency,
      message: 'Transfer proposal not found or already processed.',
      type: 'error'
    };
  }

  const remainingProposals = (club.pendingPresidentialTransfers || []).filter(p => p.id !== proposalId);

  // 1. REJECT DECISION
  if (decision === 'reject') {
    const updatedClub: Club = {
      ...club,
      pendingPresidentialTransfers: remainingProposals
    };
    return {
      updatedClub,
      updatedAgency: agency,
      message: `🚫 Presidential Veto: Transfer deal for ${proposal.playerName} has been cancelled by presidential decree.`,
      type: 'info',
      newsHeadline: `🚫 President Vetoes Deal: ${proposal.playerName} Transfer to ${club.name} Called Off`,
      newsContent: `Club President ${agency.agentName} has exercised executive veto authority, rejecting the negotiated terms for ${proposal.playerName}.`
    };
  }

  // 2. DEMAND RENEGOTIATION
  if (decision === 'demand_renegotiate') {
    const sdRating = club.sportingDirectorProfile?.rating || 80;
    const renegotiationRoll = Math.random() * 100;
    const isSuccess = renegotiationRoll <= sdRating + 5;

    if (isSuccess) {
      const discount = 0.10;
      const newFee = Math.round(proposal.negotiatedFee * (1 - discount));
      const newWage = Math.round(proposal.negotiatedWage * (1 - discount));

      const renegotiatedProposal: PresidentialTransferProposal = {
        ...proposal,
        negotiatedFee: newFee,
        negotiatedWage: newWage,
        directorNotes: `Sporting Director successfully renegotiated lower terms with ${proposal.otherClubName}. Fee shaved by 10% (-€${formatMoney(proposal.negotiatedFee - newFee)}).`,
        status: 'pending_president_approval'
      };

      const updatedClub: Club = {
        ...club,
        pendingPresidentialTransfers: [renegotiatedProposal, ...remainingProposals]
      };

      return {
        updatedClub,
        updatedAgency: agency,
        message: `📉 Renegotiation Successful! Sporting Director squeezed fee down to €${formatMoney(newFee)} and wage to €${formatMoney(newWage)}/wk!`,
        type: 'success'
      };
    } else {
      const updatedClub: Club = {
        ...club,
        pendingPresidentialTransfers: remainingProposals
      };

      return {
        updatedClub,
        updatedAgency: agency,
        message: `⚠️ Renegotiation Failed: ${proposal.otherClubName} took offense to the discounted counter-offer and walked away from the bargaining table.`,
        type: 'error'
      };
    }
  }

  // 3. APPROVE DECISION
  const targetPlayer = allPlayers.find(p => p.id === proposal.playerId);
  if (!targetPlayer) {
    return {
      updatedAgency: agency,
      message: 'Player data could not be located in global registry.',
      type: 'error'
    };
  }

  // INCOMING SIGNING
  if (proposal.type === 'incoming_signing' || proposal.type === 'incoming_loan') {
    if (club.transferBudget < proposal.negotiatedFee) {
      return {
        updatedAgency: agency,
        message: `Transfer budget insufficient (€${formatMoney(club.transferBudget)} available vs €${formatMoney(proposal.negotiatedFee)} required).`,
        type: 'error'
      };
    }

    const updatedPlayer: Player = {
      ...targetPlayer,
      clubId: club.id,
      clubName: club.name,
      wage: proposal.negotiatedWage,
      contractYears: proposal.negotiatedContractYears,
      morale: 100,
      loyalty: 85,
      isOnLoan: proposal.type === 'incoming_loan',
      loanDetails: proposal.type === 'incoming_loan' ? {
        loaneeClubId: club.id,
        loaneeClubName: club.name,
        parentClubId: proposal.otherClubId,
        parentClubName: proposal.otherClubName,
        weeksRemaining: 38,
        wageContributionPercent: 100,
        loanFee: proposal.negotiatedFee
      } : undefined
    };

    const updatedAllPlayers = allPlayers.map(p => p.id === targetPlayer.id ? updatedPlayer : p);

    // Update selling club finances
    const updatedAllClubs = allClubs.map(c => {
      if (c.id === proposal.otherClubId) {
        return { ...c, transferBudget: c.transferBudget + proposal.negotiatedFee };
      }
      return c;
    });

    const updatedBoardTrust = Math.min(100, (club.boardOfDirectors?.boardTrust || 80) + (proposal.directorAssessment === 'bargain' ? 5 : 2));

    const updatedClub: Club = {
      ...club,
      transferBudget: club.transferBudget - proposal.negotiatedFee,
      pendingPresidentialTransfers: remainingProposals,
      boardOfDirectors: club.boardOfDirectors ? {
        ...club.boardOfDirectors,
        boardTrust: updatedBoardTrust
      } : undefined
    };

    return {
      updatedPlayer,
      updatedClub,
      updatedAllPlayers,
      updatedAllClubs,
      updatedAgency: agency,
      message: `👑 Presidential Seal of Approval Affixed! ${proposal.playerName} is officially a ${club.name} player! Fee: €${formatMoney(proposal.negotiatedFee)}.`,
      type: 'success',
      newsHeadline: `🔥 Official Signing: ${proposal.playerName} Joins ${club.name} for €${formatMoney(proposal.negotiatedFee)}`,
      newsContent: `Club President ${agency.agentName} and Sporting Director ${club.sportingDirector || 'Executive Desk'} have finalized the marquee arrival of ${proposal.playerName} at ${club.name}.`
    };
  }

  // OUTGOING SALE / LOAN
  if (proposal.type === 'outgoing_sale' || proposal.type === 'outgoing_loan') {
    const updatedPlayer: Player = {
      ...targetPlayer,
      clubId: proposal.otherClubId,
      clubName: proposal.otherClubName,
      isOnLoan: proposal.type === 'outgoing_loan',
      loanDetails: proposal.type === 'outgoing_loan' ? {
        loaneeClubId: proposal.otherClubId,
        loaneeClubName: proposal.otherClubName,
        parentClubId: club.id,
        parentClubName: club.name,
        weeksRemaining: 38,
        wageContributionPercent: 100,
        loanFee: proposal.negotiatedFee
      } : undefined
    };

    const updatedAllPlayers = allPlayers.map(p => p.id === targetPlayer.id ? updatedPlayer : p);

    // Update buyer club finances
    const updatedAllClubs = allClubs.map(c => {
      if (c.id === proposal.otherClubId) {
        return { ...c, transferBudget: Math.max(0, c.transferBudget - proposal.negotiatedFee) };
      }
      return c;
    });

    const updatedBoardTrust = Math.min(100, (club.boardOfDirectors?.boardTrust || 80) + 4);

    const updatedClub: Club = {
      ...club,
      transferBudget: club.transferBudget + proposal.negotiatedFee,
      pendingPresidentialTransfers: remainingProposals,
      boardOfDirectors: club.boardOfDirectors ? {
        ...club.boardOfDirectors,
        boardTrust: updatedBoardTrust
      } : undefined
    };

    return {
      updatedPlayer,
      updatedClub,
      updatedAllPlayers,
      updatedAllClubs,
      updatedAgency: agency,
      message: `📤 Sale Ratified! ${proposal.playerName} transferred to ${proposal.otherClubName}. Treasury received +€${formatMoney(proposal.negotiatedFee)}!`,
      type: 'success',
      newsHeadline: `🛫 Confirmed Departure: ${proposal.playerName} Completes €${formatMoney(proposal.negotiatedFee)} Move to ${proposal.otherClubName}`,
      newsContent: `President ${agency.agentName} has formally signed off on the transfer of ${proposal.playerName} to ${proposal.otherClubName}.`
    };
  }

  return {
    updatedAgency: agency,
    message: 'Processed transfer action.',
    type: 'info'
  };
}

/**
 * President convenes an official Board of Directors Meeting to vote on strategic club motions
 */
export function conveneBoardMeeting(
  club: Club,
  motion: 'capital_injection' | 'wage_cap_exemption' | 'stadium_expansion_bond' | 'manager_dismissal' | 'commercial_partnership',
  agency: AgencyState,
  currentWeek: number,
  currentSeason: number
): InteractionOutcome {
  const board = club.boardOfDirectors;
  if (!board) {
    return {
      updatedAgency: agency,
      message: 'No Board of Directors constitution found.',
      type: 'error'
    };
  }

  const members = board.members || [];
  let votesInFavor = 0;
  let votesAgainst = 0;

  const motionTitles: Record<string, string> = {
    capital_injection: 'Emergency Transfer Equity Injection (+€20,000,000)',
    wage_cap_exemption: 'Superstar Wage Cap Exemption (+€50,000/wk limit)',
    stadium_expansion_bond: 'Stadium Capacity Expansion Bond (+4,500 seats)',
    manager_dismissal: 'Dismissal of Head Coach & Managerial Search',
    commercial_partnership: 'Global Tier-1 Commercial Sponsorship Package'
  };

  members.forEach(member => {
    let favorable = member.loyalty > 65;
    if (member.faction === 'commercial' && (motion === 'commercial_partnership' || motion === 'capital_injection')) favorable = true;
    if (member.faction === 'traditionalist' && (motion === 'capital_injection' || motion === 'wage_cap_exemption')) favorable = member.loyalty > 80;
    if (member.faction === 'fan_representative' && motion === 'stadium_expansion_bond') favorable = true;
    if (member.faction === 'sporting' && motion === 'manager_dismissal') favorable = member.loyalty > 60;

    if (favorable) votesInFavor++;
    else votesAgainst++;
  });

  const isApproved = votesInFavor > votesAgainst;
  const outcome: 'approved' | 'rejected' = isApproved ? 'approved' : 'rejected';
  const tally = `${votesInFavor} In Favor, ${votesAgainst} Against`;

  let outcomeSummary = '';
  let updatedTransferBudget = club.transferBudget;
  let updatedBoardTrust = board.boardTrust;
  let updatedWageCap = board.wageCapPerPlayer;
  let updatedStadiumCapacity = club.stadiumCapacity || 40000;

  if (isApproved) {
    if (motion === 'capital_injection') {
      updatedTransferBudget += 20000000;
      updatedBoardTrust = Math.max(10, updatedBoardTrust - 5);
      outcomeSummary = 'The Board approved a €20,000,000 equity issuance into the transfer budget. Board expects immediate trophy contention.';
    } else if (motion === 'wage_cap_exemption') {
      updatedWageCap += 50000;
      outcomeSummary = 'The Board raised the individual player wage cap by +€50,000/wk for world-class targets.';
    } else if (motion === 'stadium_expansion_bond') {
      updatedStadiumCapacity += 4500;
      updatedTransferBudget = Math.max(0, updatedTransferBudget - 8000000);
      outcomeSummary = 'The Board authorized stadium expansion (+4,500 capacity). €8M co-financed from club reserves.';
    } else if (motion === 'manager_dismissal') {
      outcomeSummary = `The Board ratified the termination of manager ${club.headCoach || 'Head Coach'}'s contract.`;
    } else if (motion === 'commercial_partnership') {
      updatedTransferBudget += 5000000;
      updatedBoardTrust = Math.min(100, updatedBoardTrust + 8);
      outcomeSummary = 'The Board approved the international commercial sponsorship, yielding +€5M upfront.';
    }
  } else {
    outcomeSummary = `The motion was rejected by the Board majority. Traditionalist and financial members expressed solvency concerns.`;
  }

  const meetingHistoryItem = {
    id: `bm_meet_${Date.now()}`,
    week: currentWeek,
    season: currentSeason,
    topic: motionTitles[motion] || motion,
    outcome,
    voteTally: tally,
    summary: outcomeSummary
  };

  const updatedBoard: BoardOfDirectorsState = {
    ...board,
    boardTrust: updatedBoardTrust,
    wageCapPerPlayer: updatedWageCap,
    lastMeetingWeek: currentWeek,
    boardMeetingsHistory: [meetingHistoryItem, ...(board.boardMeetingsHistory || [])].slice(0, 10)
  };

  const updatedClub: Club = {
    ...club,
    transferBudget: updatedTransferBudget,
    stadiumCapacity: updatedStadiumCapacity,
    boardOfDirectors: updatedBoard,
    headCoach: isApproved && motion === 'manager_dismissal' ? 'Interim Caretaker Manager' : club.headCoach
  };

  return {
    updatedClub,
    updatedAgency: agency,
    message: isApproved ? `🏛️ Motion Passed! Board of Directors ratified "${motionTitles[motion]}" (${tally})!` : `❌ Motion Rejected: Board of Directors voted against the proposal (${tally}).`,
    type: isApproved ? 'success' : 'info',
    newsHeadline: `🏛️ Boardroom Resolution: ${club.name} Board Vote on ${motionTitles[motion]}`,
    newsContent: `In an extraordinary general meeting called by President ${agency.agentName}, the Board of Directors recorded a ${outcome.toUpperCase()} resolution: "${outcomeSummary}".`
  };
}

/**
 * Weekly simulation processing for Sporting Director tasks, Board Mandates, and Presidential Transfer Proposals
 */
export function processWeeklyExecutiveGovernance(
  clubs: Club[],
  agency: AgencyState,
  currentWeek: number,
  currentSeason: number,
  allPlayers?: Player[]
): {
  updatedClubs: Club[];
  updatedAgency: AgencyState;
  newsItems: NewsItem[];
  toastMessages: string[];
} {
  const newsItems: NewsItem[] = [];
  const toastMessages: string[] = [];

  const updatedClubs = clubs.map(club => {
    let hasChanges = false;
    let pendingTransfers = club.pendingPresidentialTransfers ? [...club.pendingPresidentialTransfers] : [];
    let tasks = club.sportingDirectorTasks ? [...club.sportingDirectorTasks] : [];
    let board = club.boardOfDirectors ? { ...club.boardOfDirectors } : undefined;
    let internalRequests = club.internalTransferRequests ? [...club.internalTransferRequests] : [];

    // 0. Periodic Internal Staff Requests Generation for User Club
    const userOwnedClubId = agency.presidency?.clubId || (agency.activeRoles?.currentRole === 'club_owner' ? (agency.clubShares?.find(s => s.sharePercent >= 50)?.clubId || clubs[0]?.id) : undefined);
    const isUserControlledClub = userOwnedClubId ? club.id === userOwnedClubId : false;

    if (allPlayers && isUserControlledClub) {
      const activePending = internalRequests.filter(r => r.status === 'pending_president_authorization');
      if (activePending.length === 0 || (currentWeek % 3 === 0 && activePending.length < 3)) {
        const squadPlayers = allPlayers.filter(p => p.clubId === club.id);
        const clubWithReqs = generateWeeklyInternalStaffRequests(club, squadPlayers, allPlayers, clubs, currentWeek, currentSeason);
        if (clubWithReqs.internalTransferRequests && clubWithReqs.internalTransferRequests.length > 0) {
          internalRequests = clubWithReqs.internalTransferRequests;
          hasChanges = true;
          toastMessages.push(`📋 Your Head Coach & Chief Scout submitted transfer recommendations for Presidential authorization.`);
        }
      }
    }

    // 1. Process Expiring Pending Transfers
    if (pendingTransfers.length > 0) {
      hasChanges = true;
      const validTransfers: PresidentialTransferProposal[] = [];
      
      pendingTransfers.forEach(prop => {
        const remainingWeeks = (prop.expiresInWeeks || 3) - 1;
        if (remainingWeeks > 0) {
          validTransfers.push({
            ...prop,
            expiresInWeeks: remainingWeeks
          });
        } else {
          // Expired
          if (club.id === agency.presidency?.clubId) {
            toastMessages.push(`⏳ Transfer window deal for ${prop.playerName} lapsed due to lack of presidential approval.`);
            newsItems.push({
              id: `news_exp_${Date.now()}_${prop.id}`,
              week: currentWeek,
              season: currentSeason,
              headline: `⏰ Deal Lapsed: ${prop.playerName} Move to ${club.name} Expired`,
              content: `The agreed terms for ${prop.playerName} between ${prop.otherClubName} and ${club.name} have expired without the President's signature.`,
              category: 'transfer',
              urgency: 'normal',
              read: false
            });
          }
        }
      });
      pendingTransfers = validTransfers;
    }

    // 2. Progress Sporting Director Tasks
    if (tasks.length > 0) {
      tasks = tasks.map(task => {
        if (task.status === 'active_negotiation' && task.progress < 100) {
          hasChanges = true;
          const progressGain = 25 + Math.floor(Math.random() * 20);
          const newProgress = Math.min(100, task.progress + progressGain);
          const isComplete = newProgress >= 100;

          const updatedLogs = [
            ...(task.logs || []),
            {
              week: currentWeek,
              text: isComplete 
                ? `Negotiation completed with counterparty. Terms structured for Presidential Approval.` 
                : `Sporting Director held talks with intermediaries (${newProgress}% concluded).`,
              successProbability: Math.min(95, 50 + Math.round(newProgress * 0.4))
            }
          ];

          if (isComplete && club.id === agency.presidency?.clubId) {
            toastMessages.push(`📋 Sporting Director concluded terms for ${task.playerName}! Awaiting your Presidential Approval.`);
          }

          return {
            ...task,
            progress: newProgress,
            status: isComplete ? ('completed_pending_approval' as const) : ('active_negotiation' as const),
            logs: updatedLogs
          };
        }
        return task;
      });
    }

    // 3. Board Mandate Progress Evaluation
    if (board && board.mandates) {
      const updatedMandates = board.mandates.map(mandate => {
        if (mandate.status === 'on_track' || mandate.status === 'at_risk') {
          if (mandate.category === 'financial') {
            const currentBudget = club.transferBudget;
            const isTargetMet = currentBudget >= mandate.targetValue;
            const newStatus: BoardMandate['status'] = isTargetMet ? 'achieved' : (mandate.deadlineSeason <= currentSeason && currentWeek >= 35) ? (currentBudget < mandate.targetValue * 0.7 ? 'at_risk' : 'on_track') : 'on_track';
            return {
              ...mandate,
              currentValue: currentBudget,
              status: newStatus
            };
          }
          if (mandate.category === 'sporting') {
            const leaguePoints = club.points || 0;
            const isTargetMet = leaguePoints >= mandate.targetValue;
            const newStatus: BoardMandate['status'] = isTargetMet ? 'achieved' : (mandate.deadlineSeason <= currentSeason && currentWeek >= 35) ? (leaguePoints < mandate.targetValue * 0.6 ? 'at_risk' : 'on_track') : 'on_track';
            return {
              ...mandate,
              currentValue: leaguePoints,
              status: newStatus
            };
          }
        }
        return mandate;
      });

      board = {
        ...board,
        mandates: updatedMandates
      };
      hasChanges = true;
    }

    if (hasChanges) {
      return {
        ...club,
        pendingPresidentialTransfers: pendingTransfers,
        sportingDirectorTasks: tasks,
        boardOfDirectors: board,
        internalTransferRequests: internalRequests
      };
    }

    return club;
  });

  return {
    updatedClubs,
    updatedAgency: agency,
    newsItems,
    toastMessages
  };
}


