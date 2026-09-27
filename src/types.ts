export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LW' | 'RW' | 'ST';

export interface PreContractAgreement {
  targetClubId: string;
  targetClubName: string;
  targetLeague: string;
  agreedWage: number;
  contractYears: number;
  signingBonus: number;
  agentPreContractCommission: number;
  effectiveSeason: number;
  effectiveWeek: number;
  dateSigned: string;
}

export interface PlayerTransferPreference {
  preferredClubs?: string[]; // Club names or IDs player dreams of joining
  hatedClubs?: string[]; // Rival clubs player refuses to join
  requiresChampionsLeague?: boolean; // If true, player refuses non-UCL clubs
  minAcceptableWage?: number;
  willingToMoveToTier2?: boolean;
  preferredLeagues?: string[];
}

export interface ContractClauses {
  releaseClause?: number;
  buybackClause?: number;
  sellOnPercent?: number;
  appearanceBonus?: number;
  goalBonus?: number;
  cleanSheetBonus?: number;
  championsLeagueBonus?: number;
  relegationRelease?: boolean;
  // 10 New FIFA/Governance Contract Clauses:
  ballonDorBonus?: number; // 1. Ballon d'Or / Golden Boot Award Bonus
  loyaltyBonus?: number; // 2. Annual Loyalty & Retention Fee
  imageRightsPercent?: number; // 3. Commercial Image Rights Royalty Share (%)
  autoExtensionOption?: boolean; // 4. Automatic +1 Year Extension on 25+ Matches
  nonPromotionReleaseFee?: number; // 5. Non-Promotion / Lower Tier Release Fee
  firstRefusalOption?: boolean; // 6. Selling Club/Agency 48h Right of First Refusal
  antiTamperingClause?: boolean; // 7. Anti-Tampering & Legal Audit Protection
  internationalCapBonus?: number; // 8. Senior International Cap Performance Top-up
  marqueeStatusClause?: boolean; // 9. Marquee Player FFP Wage Cap Exemption Tag
  relegationWageProtectionPercent?: number; // 10. Relegation Wage Floor Protection (%)
}

export interface PlayerPersonalLife {
  happiness: number; // 0-100
  socialMediaFollowers: number;
  scandalLevel: number; // 0-100
  endorsementEarnings: number;
  fatigue?: number; // 0-100
  mentalHealth?: number; // 0-100
  luxuryItem?: string;
  brandSponsor?: string; // 'Nike' | 'Adidas' | 'Puma' | 'Under Armour'
  sponsor?: string;
  scandalRisk?: number;
  lifestyleSpending?: number;
  netWorth?: number;
}

export interface PlayerStats {
  goals: number;
  assists: number;
  appearances: number;
  cleanSheets?: number;
  avgRating: number;
  internationalCaps?: number;
  internationalGoals?: number;
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
}

export interface Player {
  id: string;
  name: string;
  age: number;
  nationality: string;
  flag: string;
  position: Position;
  rating: number; // Overall 50-99
  potential: number; // 50-99
  value: number; // EUR
  wage: number; // Weekly EUR
  contractYears: number;
  clubId: string; // 'free_agent' or club ID
  clubName: string;
  agencyName?: string; // 'Gestifute Global' | 'Stellar Agency' | 'Mino Sports' | 'Your Agency' | etc.
  agencyLoyalty?: number; // 0-100 relationship with current agency
  isAutoYouthPromoted?: boolean; // Youth player generated to maintain 25-player roster rule
  isMyClient: boolean;
  isTransferListed?: boolean; // Toggled by agent or club to increase incoming AI transfer offers
  transferListedByClub?: boolean; // Explicitly placed on transfer list by owning club
  isLoanListed?: boolean; // Listed for loan moves
  loanListedByClub?: boolean; // Explicitly placed on loan list by owning club
  contractExpiringSoon?: boolean; // Less than 1 year on contract
  playerPreferences?: PlayerTransferPreference;
  agentCommission: number; // e.g. 10 (%)
  morale: number; // 0-100
  loyalty: number; // 0-100
  form: number; // 0-100
  energy?: number; // 0-100
  injury: {
    isInjured: boolean;
    weeks: number;
    description?: string;
  };
  traits: string[];
  avatarEmoji?: string;
  loan?: any;
  stats: PlayerStats;
  clauses: ContractClauses;
  preContract?: PreContractAgreement;
  personalLife: PlayerPersonalLife;
  isNationalTeamCalledUp?: boolean;
  isOnLoan?: boolean;
  loanDetails?: {
    loanId?: string;
    loaneeClubId: string;
    loaneeClubName: string;
    parentClubId: string;
    parentClubName: string;
    buybackFee?: number;
    weeksRemaining: number;
    wageContributionPercent: number;
    loanFee: number;
    playingTimeGuarantee?: 'Key Starter' | 'Rotation' | 'Fringe Player';
    appearances?: number;
    goals?: number;
    ratingSum?: number;
  };
  avatarSeed?: {
    skinTone: string;
    hairStyle: string;
    hairColor: string;
    eyeColor: string;
  };
  scoutedStatus?: 'unscouted' | 'partially_scouted' | 'fully_scouted';
  potentialRange?: {
    min: number;
    max: number;
  };
  scoutReport?: {
    scoutName: string;
    text: string;
    isAiGenerated?: boolean;
    date: string;
    verdict?: 'Dud' | 'Squad Filler' | 'Solid Starter' | 'Generational Wonderkid';
    hiddenTrait?: string;
  };
  ongoingContractNegotiation?: {
    requestedWage: number;
    requestedYears: number;
    requestedReleaseClause?: number;
    requestedCommission: number;
    requestedClauses?: ContractClauses;
    weeksRemaining: number;
    status: 'pending_board' | 'counter_offered' | 'rejected' | 'accepted';
    counterWage?: number;
    counterYears?: number;
    counterClauses?: ContractClauses;
    reasoning?: string;
    notes?: string;
  };
  lastContractNegotiationWeek?: number;
  lastContractNegotiationSeason?: number;
  ongoingTransferNegotiation?: OngoingTransferNegotiation;
  lastTransferWeek?: number;
  lastTransferSeason?: number;
  lastTransferWindowId?: string;
  transferredInCurrentWindow?: boolean;
  transferredFromClubName?: string;
  lastPitchWeek?: number;
  lastPitchSeason?: number;
  lastDarkArtOpWeek?: number;
  lastDarkArtOpSeason?: number;
  biography?: string;
  careerHistory?: {
    season: string;
    clubName: string;
    appearances: number;
    goals: number;
    assists: number;
    transferFee?: string;
  }[];
  unrest?: {
    status: 'content' | 'discontent' | 'transfer_requested' | 'strike';
    reason: 'wants_new_challenge' | 'benched_lack_playing_time' | 'underpaid_wage_dispute' | 'outgrown_club_level' | 'manager_clash' | 'contract_stalled' | 'homesick';
    reasonLabel: string;
    discontentLevel: number; // 0-100
    description: string;
    discountPercent: number; // e.g. 20-40% discount on transfer value
  };
  // Dynamic Progression, Potential Volatility & Realization:
  potentialVolatility?: 'stable' | 'volatile' | 'boom_or_bust' | 'late_bloomer' | 'early_peaker';
  realizationChance?: number; // 0.15 to 0.95: probability potential translates to actual rating
  actualPotentialLimit?: number; // Calculated true ceiling (ensures high potential != guaranteed elite)
  realizationStatus?: 'on_track' | 'bust' | 'overachieving' | 'dormant' | 'breakout';
  condition?: number; // 0-100% physical match fitness
  matchFitness?: number; // 0-100% sharpness
  adaptationWeeksRemaining?: number; // Cultural adaptation period in foreign leagues
  yellowCards?: number; // Season yellow cards
  redCards?: number; // Season red cards
  isSuspended?: boolean; // Card accumulation / disciplinary suspension
  suspensionMatchesRemaining?: number;
  tacticalSynergy?: number; // 0-100 role familiarity
  historicalSellOnEarned?: number;
  potentialCeiling?: number; // Initial theoretical peak potential
  potentialRealizationRate?: number; // 0.70 to 1.10 development curve
  consecutiveBadFormWeeks?: number; // Tracks weeks in severe form slump
  consecutiveGoodFormWeeks?: number; // Tracks weeks in hot streak
  consecutiveUnregisteredWeeks?: number; // Tracks weeks unregistered
  homesickWeeks?: number; // Tracks weeks suffering from homesickness
  degradationEvents?: {
    week: number;
    season: number;
    reason: string;
    ratingDelta: number;
  }[];
  progressionEvents?: {
    week: number;
    season: number;
    reason: string;
    ratingDelta: number;
  }[];
  mentorship?: {
    mentorPlayerId?: string;
    mentorName?: string;
    bonusPotentialGained?: number;
    weeksActive?: number;
  };
  brandEndorsement?: {
    brandName: 'Nike Premier' | 'Adidas Elite' | 'Puma Nitro' | 'Under Armour Pro' | 'Hublot Luxury' | 'Red Bull Global';
    logoEmoji: string;
    weeklyRoyalty: number; // EUR per week
    agentCommissionCut: number; // EUR earned by agency per week
    contractWeeksRemaining: number;
    upfrontFeePaid: number;
  };
  poachImmunityWeeks?: number;
  clinicalInterventionUsed?: 'standard' | 'elite_clinic' | 'rush_therapy';
  isBosmanEligible?: boolean;
  injuryResistance?: number; // 30-99 (chronic injury susceptibility)
  secondaryPositions?: string[]; // e.g. ['LWB', 'CDM']
  retrainingProgress?: { targetPosition: string; weeksRemaining: number; totalWeeks: number };
  internationalStatus?: { isInternational: boolean; nationalTeam: string; caps: number; goals: number; isCalledUp: boolean };
  preContractAgreement?: { targetClubName: string; agreedWage: number; signingSeason: number };
  milestones?: { caps50?: boolean; caps100?: boolean; goals100?: boolean; goals250?: boolean; appearances200?: boolean };
  retentionGift?: {
    name: string;
    cost: number;
    expiresWeek: number;
    expiresSeason: number;
  };
  // Federation Squad Registration & Homegrown Quotas:
  isRegistered?: boolean; // If false, player CANNOT play in competitive matches for the club
  unregisteredWeeks?: number; // Consecutive weeks unregistered triggering FIFA Tribunal contract cancellation
  isHomegrown?: boolean; // Trained in domestic nation between 15-21
  // Playing Time Promises & Satisfaction Tracking:
  agreedPlayingTime?: 'Star Player' | 'Important Starter' | 'Regular Starter' | 'Squad Rotation' | 'Fringe / Backup' | 'Youth Prospect';
  consecutiveWeeksBenched?: number;
  playingTimeSatisfaction?: number; // 0-100 (100 = delighted, <40 = discontent)
  clubForcedStay?: boolean; // If club rejected transfer and locked player
  promisesMade?: {
    id: string;
    promiseType: 'ucl_move' | 'low_release_clause' | 'wage_hike' | 'playing_time' | 'boot_sponsorship';
    description: string;
    weekPromised: number;
    seasonPromised: number;
    targetDeadlineWeek: number;
    status: 'active' | 'fulfilled' | 'broken';
  }[];
}

export interface SportingDirectorProfile {
  id: string;
  name: string;
  avatar: string;
  rating: number; // 50-99 negotiation competence
  scoutingRating: number; // 50-99 talent identification
  tacticalFocus: 'Attacking' | 'Possession' | 'Counter-Attack' | 'Youth-First' | 'Moneyball Analytics' | 'Pragmatic';
  personality: 'Shrewd Operator' | 'Aggressive Closer' | 'Prudent Scout' | 'Visionary Architect' | 'Hardline Negotiator';
  wage: number; // EUR/wk
  contractYears: number;
  dealSuccessBonus: number; // % bonus chance
  historicalSigningsCount?: number;
  totalSpent?: number;
}

export interface BoardMember {
  id: string;
  name: string;
  role: string; // 'Vice-Chairman', 'Commercial Director', 'Fan Representative', 'Majority Shareholder', 'Audit Chair'
  avatar: string;
  shareholding: number; // %
  faction: 'traditionalist' | 'commercial' | 'sporting' | 'fan_representative';
  loyalty: number; // 0-100
  mood: 'delighted' | 'satisfied' | 'skeptical' | 'hostile';
  priorities: string;
}

export interface BoardMandate {
  id: string;
  title: string;
  category: 'financial' | 'sporting' | 'youth' | 'reputation';
  description: string;
  targetMetric: string;
  targetValue: number;
  currentValue: number;
  status: 'on_track' | 'at_risk' | 'failed' | 'achieved';
  deadlineSeason: number;
  rewardApprovalBonus: number;
  penaltyOnFailure: number;
}

export interface TargetedClubFeedback {
  verdict: 'accepted' | 'counter_offer' | 'rejected_valuation' | 'rejected_indispensable' | 'rejected_wage_ffp' | 'rejected_rival';
  statusLabel: string;
  responseQuote: string;
  directorName: string;
  directorRole: string;
  directorAvatar?: string;
  valuationAssessment: {
    offeredFee: number;
    expectedFee: number;
    gapAmount: number;
    verdict: 'insulting' | 'below_valuation' | 'fair' | 'generous';
    reasoning: string;
  };
  squadImportanceAssessment?: {
    importance: 'Key Indispensable Starter' | 'Important Squad Player' | 'Rotation' | 'Surplus to Requirements';
    tacticalReasoning: string;
  };
  financialStructureAssessment: {
    cashflowVerdict: string;
    ffpRisk: 'low' | 'moderate' | 'high';
  };
  suggestedAlternativeStructure?: {
    counterTransferFee: number;
    suggestedInstallmentUpfrontPercent: number; // e.g. 65%
    suggestedSellOnPercent: number; // e.g. 15%
    suggestedAddOnsAmount?: number; // e.g. €4,000,000
    counterWage?: number;
    summaryText: string;
  };
}

export interface BoardOfDirectorsState {
  boardTrust: number; // 0-100
  chairpersonName: string;
  chairpersonStance: 'Supportive & Ambitious' | 'Prudent & Frugal' | 'Demanding Tycoon' | 'Impatient Win-Now';
  members: BoardMember[];
  mandates: BoardMandate[];
  spendingLimitPerTransfer: number; // Threshold above which requires board emergency vote (e.g. €45,000,000)
  wageCapPerPlayer: number; // Threshold above which requires board vote (e.g. €200,000/wk)
  requireBoardApprovalForMajorTransfers?: boolean; // When enabled, transfers >50% of club treasury trigger a simulated board meeting mini-game
  emergencyBailoutAvailable: boolean;
  emergencyBailoutAmount: number;
  boardMeetingsHistory: {
    id: string;
    week: number;
    season: number;
    topic: string;
    outcome: 'approved' | 'rejected' | 'compromise';
    voteTally: string; // e.g. "4 In Favor, 1 Against"
    summary: string;
  }[];
  lastMeetingWeek?: number;
}

export interface InternalClubTransferRequest {
  id: string;
  requesterName: string;
  requesterRole: 'Head Coach' | 'Technical Director' | 'Chief Financial Officer' | 'Chief Scout' | 'Head of Youth Development';
  requesterAvatar?: string;
  type: 'request_offload' | 'request_signing' | 'request_loan_out' | 'request_contract_renewal';
  playerId: string;
  playerName: string;
  playerPosition: Position;
  playerRating: number;
  playerAge: number;
  playerClubName?: string;
  playerValue?: number;
  playerWage?: number;
  reasoning: string;
  urgency: 'routine' | 'tactical_priority' | 'financial_urgent' | 'disciplinary_immediate';
  suggestedMinFee?: number;
  suggestedMaxFee?: number;
  suggestedWage?: number;
  recommendedClauses?: string[];
  status: 'pending_president_authorization' | 'authorized' | 'dismissed';
  weekSubmitted: number;
  seasonSubmitted: number;
}

export interface OffloadMandateOptions {
  mode: 'sale' | 'loan';
  minAskingPrice: number;
  minWageContributionPercent?: number; // 0-100% for loans
  sellOnClausePercent?: number; // 0, 10, 15, 20, 25%
  enableBuyback?: boolean;
  buybackPriceMultiplier?: number; // 1.2x - 2.0x
  prohibitDomesticRivals?: boolean;
  performanceAddonsRequired?: boolean;
  priorityStrategy?: 'Fast Clearance' | 'Competitive Auction' | 'Development Loan';
}

export interface PresidentialTransferProposal {
  id: string;
  type: 'incoming_signing' | 'outgoing_sale' | 'incoming_loan' | 'outgoing_loan' | 'contract_renewal';
  playerId: string;
  playerName: string;
  playerAvatarEmoji?: string;
  playerPosition: Position;
  playerRating: number;
  playerAge: number;
  playerNationality?: string;
  currentClubId: string;
  currentClubName: string;
  otherClubId: string;
  otherClubName: string;
  negotiatedFee: number;
  negotiatedWage: number;
  negotiatedContractYears: number;
  agentCommission: number;
  clauses?: ContractClauses;
  sellOnClausePercent?: number;
  buybackClausePrice?: number;
  wageContributionPercent?: number;
  prohibitRivalTransfers?: boolean;
  performanceAddons?: {
    appearanceBonusFee?: number;
    goalMilestoneBonusFee?: number;
    trophyBonusFee?: number;
  };
  competingBidsCount?: number;
  directorNotes: string;
  directorConfidence: number; // 0-100%
  directorAssessment: 'bargain' | 'fair_value' | 'expensive' | 'marquee_investment';
  boardVerdict: 'approved' | 'caution' | 'warning' | 'requires_vote';
  boardNotes: string;
  ffpRisk: 'low' | 'moderate' | 'high' | 'critical';
  status: 'pending_president_approval' | 'approved_by_president' | 'rejected_by_president' | 'renegotiation_requested' | 'vetoed_by_board' | 'completed' | 'expired';
  initiatedBy: 'president_directive' | 'coach_recommendation' | 'cfo_financial_mandate' | 'technical_director_advice' | 'sporting_director_scouting' | 'incoming_bid_from_ai_club' | 'player_demand';
  createdAtWeek: number;
  createdAtSeason: number;
  expiresInWeeks: number;
}

export interface SportingDirectorTask {
  id: string;
  type: 'target_signing' | 'offload_player' | 'target_loan_in' | 'target_loan_out' | 'contract_renewal';
  playerId: string;
  playerName: string;
  playerPosition: Position;
  playerRating: number;
  playerAge: number;
  playerClubName: string;
  playerClubId?: string;
  targetPriceCeiling: number;
  targetWageCeiling: number;
  negotiationPriority: 'Urgent Priority' | 'Balanced Strategy' | 'Bargain Hunting';
  progress: number; // 0-100%
  status: 'active_negotiation' | 'completed_pending_approval' | 'failed_breakdown' | 'cancelled';
  logs: { week: number; text: string; successProbability: number }[];
  failureReason?: string;
}

export interface ClubStaffMember {
  id: string;
  name: string;
  role: 'Head Manager' | 'Assistant Manager' | 'Head Scout' | 'Physical Trainer' | 'Chief Medical Officer';
  rating: number; // 50-99
  nationality: string;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  league: string;
  tier?: number; // 1 (Top) or 2 (Second Division / Relegation)
  continent: 'Europe' | 'South America' | 'North America' | 'Asia' | 'Africa';
  country?: string;
  stadiumName?: string;
  reputation: number; // 1-100
  transferBudget: number;
  wageBudget: number;
  chairmanTrust: number; // 0-100 trust with agent
  chairmanName: string;
  sportingDirector?: string;
  sportingDirectorProfile?: SportingDirectorProfile;
  boardOfDirectors?: BoardOfDirectorsState;
  pendingPresidentialTransfers?: PresidentialTransferProposal[];
  sportingDirectorTasks?: SportingDirectorTask[];
  internalTransferRequests?: InternalClubTransferRequest[];
  requireBoardApprovalOver50PercentTreasury?: boolean;
  headCoach?: string;
  staffList?: ClubStaffMember[];
  leagueCoefficient?: number; // European or Continental Ranking (e.g. 85.4)
  logoColor: string;
  secondaryColor: string;
  stadiumCapacity?: number;
  managerName?: string;
  managerTactics?: 'Attacking' | 'Tiki-Taka' | 'Counter-Attack' | 'Park the Bus';
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor: number;
  goalsAgainst: number;
  seasonSpending?: number; // Total spending in current season (EUR)
  seasonSpent?: number; // Total spending in current season (EUR)
  seasonRevenue?: number; // Total revenue generated in current season (EUR)
  ffpSanctionStatus?: 'clean' | 'warned' | 'fined' | 'points_deducted' | 'transfer_banned';
  ffpAuditHistory?: string[];
  debtLevel?: number; // Total club debt (EUR)
  // 4 Core Financial Fair Play (FFP) Determinant Factors:
  managementStyle?: 'Austerity & Sustainable' | 'Prudent Traditionalist' | 'Corporate Growth' | 'Sugar-Daddy Aggressive' | 'Chaotic Mismanagement';
  marketDealing?: 'Prudent Moneyball' | 'Youth Seller & Developer' | 'Bargain Hunter' | 'Aggressive Spender' | 'Reckless Gambler';
  incomeStreamRating?: number; // 1-100 rating of commercial power, matchday yield, broadcast share
  bookBalancingCompetence?: number; // 1-100 score of accounting competence & fiscal balance discipline
}

export interface ClubPresidentPowers {
  clubId: string;
  stadiumLevel: number; // 1-5
  stadiumSeats: number; // e.g. 45,000
  managerRating: number; // 50-99
  managerStyle: 'Tactical Genius' | 'Youth Master' | 'Defensive Guru' | 'Motivational Legend';
  fanApproval: number; // 0-100
  boardApproval: number; // 0-100
  requireBoardApprovalForMajorTransfers?: boolean; // When enabled, transfers >50% of treasury require simulated board meeting
  presidentialDirectives: {
    prioritizeYouthClients: boolean;
    slashTicketPrices: boolean;
    unlimitedWageCeiling: boolean;
    boardApprovalRequiredForLargeTransfers?: boolean;
  };
  // 15 Club Ownership Expansions
  mcoGroupClubs?: string[]; // Multi-Club Network
  stadiumRoof?: boolean;
  stadiumNamingSponsor?: string;
  stadiumNamingDeal?: {
    sponsorName: string;
    annualRevenue: number;
    yearsLeft: number;
    totalValue: number;
  };
  frontOfShirtSponsor?: {
    sponsorName: string;
    annualRevenue: number;
    yearsLeft: number;
  };
  executives?: {
    ccoLevel: number;
    techDirectorLevel: number;
    headScoutLevel: number;
    prDirectorLevel: number;
  };
  isPublicIpo?: boolean;
  sovereignPartner?: string;
  crestTheme?: string;
  ultraRel?: number; // 0-100 Fan Ultra Satisfaction
  medicalCenterLevel?: number; // 0-3
  hasPrivateJetFleet?: boolean;
  preseasonTourRegion?: string;
  youthSatellites?: string[]; // e.g., ['Brazil - Santos Satellite', 'Ghana - Accra Hub']
  vetoTransfersActive?: boolean;
  kitSupplierDeal?: string; // e.g. 'Nike Premier €45M/yr'
  cryptoFanTokensActive?: boolean;
  hasClubMuseum?: boolean;
}

export interface ElectionCampaign {
  active: boolean;
  targetRole: 'Regional Delegate' | 'Federation Director' | 'Continental President' | 'FIFA Global President';
  targetContinent?: 'Europe' | 'South America' | 'North America' | 'Asia' | 'Africa' | 'Global (FIFA)';
  voterSupport: number; // 0 - 100%
  spentCash: number;
  spentReputation: number;
  spentInfluence: number;
  weeksRemaining: number;
  scandalRisk: number; // 0 - 100%
  keyVoterClubs: { clubId: string; clubName: string; supported: boolean; bribeCost: number }[];
}

export interface PressInterviewOption {
  id?: string;
  label: string;
  description?: string;
  text?: string;
  tone?: 'Aggressive' | 'Diplomatic' | 'Humorous';
  responseQuote?: string;
  impactSummary?: string;
  loyaltyChange?: number;
  moraleChange?: number;
  moraleDelta?: number;
  reputationChange?: number;
  reputationDelta?: number;
  clubTrustDelta?: number;
  fanPopularityDelta?: number;
  darkArtsDelta?: number;
  unrestDelta?: number;
  cashChange?: number;
  mediaReaction?: string;
}

export interface AgencyAchievement {
  id: string;
  title: string;
  description: string;
  category: 'transfers' | 'awards' | 'wealth' | 'governance' | 'reputation';
  icon: string;
  badgeTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  unlocked: boolean;
  unlockedAtWeek?: number;
  unlockedAtSeason?: number;
  rewardCash: number;
  rewardReputation: number;
  progress: number;
  target: number;
  progressLabel?: string;
}

export interface CorporateBond {
  id: string;
  name: string;
  principalRaised: number;
  couponRatePercent: number; // weekly coupon percentage
  weeklyPayment: number;
  weeklyYield?: number;
  termWeeks: number;
  weeksRemaining: number;
  status: 'active' | 'matured' | 'defaulted';
  issuedWeek: number;
  issuedSeason: number;
}

export interface PressInterview {
  id: string;
  journalistName: string;
  mediaOutlet: string;
  journalistAvatar: string;
  topicTitle?: string;
  questionText?: string;
  question?: string;
  context?: string;
  urgency?: 'normal' | 'hot' | 'breaking';
  playerId?: string;
  playerName?: string;
  relatedPlayerName?: string;
  relatedClubName?: string;
  week: number;
  season: number;
  answered: boolean;
  chosenAnswerIndex?: number;
  selectedOptionId?: string;
  options: PressInterviewOption[];
}

export interface PlayerPitchNegotiation {
  playerId: string;
  playerName: string;
  rating: number;
  currentAgentName?: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging' | 'Extremely Hard';
  effortRequired: number; // 10-100 effort points
  effortSpent: number;
  pitchScores: {
    financial: number;
    careerPlan: number;
    endorsements: number;
    darkArts: number;
  };
  playerExpectations: {
    greed: number; // 1-100
    ambition: number; // 1-100
    brandFocus: number; // 1-100
    loyaltyToCurrent: number; // 1-100
  };
}

export interface ConflictOfInterestLog {
  id: string;
  week: number;
  actionType: 'Siphon Budget' | 'Insider Contract' | 'Inflated Sale' | 'Forced Transfer';
  details: string;
  scandalDelta: number;
  profitDelta: number;
}

export interface PresidencyState {
  role: 'None' | 'Club President' | 'Regional Delegate' | 'Federation Director' | 'Continental President' | 'FIFA Global President';
  tier?: 1 | 2 | 3 | 4; // Tier 1: Regional Delegate, Tier 2: National FA Director, Tier 3: Continental President, Tier 4: FIFA Global President
  clubId?: string;
  clubName?: string;
  federationContinent?: 'Europe' | 'South America' | 'North America' | 'Asia' | 'Africa' | 'Global (FIFA)';
  politicalInfluence: number; // 0-100
  termYearsLeft: number;
  termWeeksLeft?: number;
  termTotalWeeks?: number;
  tenureSeason?: number; // 1, 2, or 3 (3-season tenure cycle)
  approvalRating?: number; // 0-100 (Decides re-election and promotion after 3 seasons)
  termsServed?: number;
  highestTierCompleted?: number; // 0 to 4 (Must start at Tier 1, then unlock higher tiers after a successful 3-season term)
  reElectionStatus?: 'active' | 'warning' | 'expired' | 'reelection_due' | 'voted_out' | 'promoted';
  campaignStatus?: 'idle' | 'running' | 'won' | 'lost';
  campaign?: ElectionCampaign;
  conflictScandalLevel: number; // 0-100 ethics committee risk
  conflictLogs: ConflictOfInterestLog[];
  lastDecreeWeek?: number;
  lastDecreeSeason?: number;
  decreesPassedThisWeek?: number;
  totalTaxesCollected?: number;
  activePolicies: {
    agentCommissionCap: number; // e.g. 15 (%)
    foreignPlayerLimit: number; // e.g. 5
    varStrictness: 'Strict' | 'Lenient' | 'Off';
    worldCupHostNation?: string;
    annualFederationSubsidy: number;
    salaryCapPerYear: number; // EUR
    transferWindowWeeks: number; // 4 - 12
    // 15 Federation Expansions
    ffpStrictness?: 'Off' | 'Moderate' | 'Strict' | 'Draconian';
    superLeagueStatus?: 'Banned' | 'Pending Vote' | 'Sanctioned & Active';
    nationalCoachAppointed?: string;
    worldCupBiddingNation?: string;
    workPermitPoints?: number;
    refereeIntegrityLevel?: number;
    tvRightsPackageValue?: number;
    agentExamDifficulty?: 'Easy' | 'Hard' | 'Extreme FIFA Standard';
    supercupHostNation?: string;
    antiDopingRegime?: 'Standard' | 'Unannounced Blood Audits';
    luxuryTaxThreshold?: number;
    foreignTakeoverImmunity?: boolean;
    medalOfHonorAwarded?: string[];
    // Federation Squad Registration Limits:
    maxSquadRegistration?: number; // Maximum registered senior squad size (e.g. 25)
    minHomegrownQuota?: number; // Minimum required homegrown players in squad (e.g. 8)
    u21ExemptionEnabled?: boolean; // Under-21 players exempt from registration quota limit
  };
}

export interface Scout {
  id: string;
  name: string;
  region: string;
  rating: number; // 1-100
  weeklyCost: number;
  status: 'idle' | 'scouting';
  targetRegion?: string;
  weeksLeft?: number;
}

export interface Staff {
  scouts: Scout[];
  lawyerLevel: number; // 0 to 3
  prLevel: number; // 0 to 3
  fitnessLevel: number; // 0 to 3
  physioLevel: number; // 0 to 3 (injury recovery speed)
  taxAdvisorLevel: number; // 0 to 3 (tax savings & offshore shell banking)
  dataAnalystLevel: number; // 0 to 3 (scouting accuracy)
}

export interface RealEstate {
  id: string;
  name: string;
  cost: number;
  weeklyIncome: number;
  owned: boolean;
  type: 'Residential' | 'Commercial' | 'Stadium Complex';
}

export interface LuxuryAsset {
  id: string;
  name: string;
  type: 'Car' | 'Yacht' | 'Private Jet' | 'Villa';
  cost: number;
  prestige: number;
  owned: boolean;
  iconName: string;
  weeklyMaintenance?: number;
}

export interface ClubShare {
  clubId: string;
  clubName?: string;
  sharePercent: number;
  investedAmount?: number;
  purchasePrice?: number;
  lastElectionWeek?: number;
  lastElectionSeason?: number;
  lastElectionWon?: boolean;
}

export interface GrassrootsCamp {
  id: string;
  region: 'South America (Brazil)' | 'West Africa (Nigeria)' | 'Western Europe (France)' | 'Eastern Europe' | 'East Asia';
  level: number;
  weeklyCost: number;
  producedWonderkids: number;
}

export type NewsTargetRole = 'all' | 'agent' | 'club_owner' | 'fa_president';

export interface NewsItem {
  id: string;
  week: number;
  season: number;
  headline: string;
  content: string;
  category: 'transfer' | 'award' | 'scandal' | 'match' | 'agency' | 'dilemma' | 'sponsorship' | 'national' | 'governance' | 'player_development';
  urgency: 'normal' | 'hot' | 'breaking';
  playerImage?: string;
  read: boolean;
  targetRole?: NewsTargetRole;
  targetRoles?: Array<'agent' | 'club_owner' | 'fa_president'>;
  actionTab?: string;
  actionLabel?: string;
  relatedClubId?: string;
  relatedPlayerId?: string;
  roleBadge?: string;
}

export type NegotiationStatus = 'OFFER_SUBMITTED' | 'COUNTER_OFFER' | 'AGENCY_TERMS_PENDING' | 'COMPLETED' | 'REJECTED' | 'POACH_TRIGGERED';

export interface TransferOffer {
  id: string;
  playerId: string;
  fromClubId: string;
  toClubId: string;
  transferFee: number;
  offeredWage: number;
  contractYears: number;
  agentFeePercent: number;
  signOnBonus?: number;
  status: NegotiationStatus;
  isPlayerClient: boolean;
  buyerClubName?: string;
  sellerClubName?: string;
  counterOfferFee?: number;
  counterOfferWage?: number;
}

export interface PlayerMatchLog {
  playerId: string;
  playerName: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  rating: number; // e.g. 7.8
}

export interface ValidatedMatchResult {
  fixtureId: string;
  homeClubId: string;
  awayClubId: string;
  homeScore: number;
  awayScore: number;
  homeYellows: number;
  awayYellows: number;
  homeReds: number;
  awayReds: number;
  homePlayerLogs: PlayerMatchLog[];
  awayPlayerLogs: PlayerMatchLog[];
  isValidatedAndAudited: boolean;
  validationCheck: string; // e.g. "PASSED: Player Goals Sum (2) == Team Total Goals (2)"
}

export interface PoachAttempt {
  id: string;
  playerId: string;
  playerName: string;
  currentAgencyName: string;
  poachingAgencyName: string;
  offeredWage: number;
  offeredCommission: number;
  status: 'active' | 'repelled' | 'succumbed';
  week: number;
  season: number;
}

export type FinancialTransactionCategory = 
  | 'transfer' 
  | 'award' 
  | 'presidency' 
  | 'milestone' 
  | 'quest' 
  | 'acquisition' 
  | 'election' 
  | 'scandal' 
  | 'operations' 
  | 'marketing' 
  | 'hospitality' 
  | 'scouting' 
  | 'legal' 
  | 'passive_income' 
  | 'staff_overhead' 
  | 'debt_service' 
  | 'performance_bonus';

export interface CareerMilestone {
  id: string;
  week: number;
  season: number;
  title: string;
  description: string;
  type: FinancialTransactionCategory;
  impact?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  rewardMoney: number;
  rewardReputation: number;
  completed: boolean;
  category: 'career' | 'financial' | 'dark_arts' | 'scouting';
}

export interface FinancialHistoryRecord {
  week: number;
  season: number;
  income: number;
  expense: number;
  net: number;
  balance: number;
}

export interface MatchFixture {
  id: string;
  week: number;
  homeClubId: string;
  awayClubId: string;
  homeScore?: number;
  awayScore?: number;
  played: boolean;
  keyMoments?: { minute: number; text: string; isClientInvolved?: boolean; playerImpactName?: string }[];
}

export interface RivalAgent {
  id: string;
  name: string;
  agencyName: string;
  influence: number; // 1-100
  relationship: number; // -100 (Enemy) to +100 (Ally)
  topClients: string[]; // Names of top clients
  strategy: 'Aggressive Poacher' | 'Diplomatic Dealmaker' | 'Shadow Media Operator' | 'Financial Mogul';
  avatarColor: string;
  headquarters: string;
}

export interface ActiveRolesState {
  agent: boolean;
  club_owner: boolean;
  fa_president: boolean;
  currentRole: 'agent' | 'club_owner' | 'fa_president';
  startingRole?: 'agent' | 'club_owner' | 'fa_president';
  presidentClubId?: string;
  presidentClubName?: string;
  faAchievementEligibility?: boolean;
}

export interface AssistantRecruitmentCriteria {
  targetCategory: 'ANY' | 'ATTACKERS' | 'MIDFIELDERS' | 'DEFENDERS' | 'GOALKEEPERS' | 'WONDERKIDS';
  minRating: number; // e.g. 60 - 90
  minPotential: number; // e.g. 70 - 95
  ageBracket: 'ANY' | 'WONDERKID_U20' | 'PRIME_21_26' | 'EXPERIENCED_27_PLUS';
  maxSignOnBonus: number; // Maximum bonus assistant is allowed to offer per player
  maxWeeklyWage: number;
  negotiationStance: 'Conservative' | 'Balanced' | 'Aggressive';
  targetRegion?: string;
}

export interface DelegatedSigningRecord {
  id: string;
  week: number;
  season: number;
  playerId: string;
  playerName: string;
  playerRating: number;
  playerPotential: number;
  playerPosition: Position;
  playerAge: number;
  clubName: string;
  signOnBonusPaid: number;
  commissionSecuredPercent: number;
  assistantFee: number;
  verdictLog: string;
  status: 'signed' | 'failed_wage' | 'failed_reputation' | 'failed_budget' | 'rejected_by_player';
}

export interface AssistantDelegateState {
  assistantName: string;
  assistantTitle: string;
  assistantRating: number; // 50-99 (Affects negotiation success rate & bonus discounts)
  avatar: string;
  allocatedBudget: number; // Total budget assigned by user
  remainingBudget: number; // Funds remaining in assistant treasury
  autoRecruitActive: boolean; // Runs scouting & signing every week
  criteria: AssistantRecruitmentCriteria;
  history: DelegatedSigningRecord[];
  totalSignedCount: number;
  totalBudgetSpent: number;
}

export interface AgencyState {
  agencyName: string;
  agentName: string;
  balance: number;
  reputation: number; // 1-100
  officeLevel: number; // 1-5
  currentWeek: number;
  currentSeason: number; // e.g. 2026
  activeRoles?: ActiveRolesState;
  staff: Staff;
  assistantDelegate?: AssistantDelegateState;
  realEstate: RealEstate[];
  luxuryAssets: LuxuryAsset[];
  clubShares: ClubShare[];
  grassrootsCamps: GrassrootsCamp[];
  trophiesWon: string[];
  totalTransferEarnings: number;
  totalClientEarnings?: number;
  darkArtsScore: number; // Bribes/leaks used
  soundEnabled: boolean;
  offshoreAccountBalance: number;
  presidency: PresidencyState;
  clubPresidentPowers?: Record<string, ClubPresidentPowers>; // clubId -> powers
  milestones: CareerMilestone[];
  quests: Quest[];
  financialHistory: FinancialHistoryRecord[];
  bets: { id: string; fixtureId: string; predictedResult: 'home' | 'draw' | 'away'; amount: number; odds: number; resolved?: boolean; won?: boolean }[];
  rivalAgents?: RivalAgent[];
  loanDeals?: LoanDeal[];
  pressInterviews?: PressInterview[];
  fifaLicense?: FifaLicenseState;
  satelliteAcademies?: SatelliteAcademy[];
  activeMatchDirectives?: Record<string, MatchdayDirectiveType>;
  federationTreasury?: FederationTreasuryState;
  bankLoans?: AgencyBankLoan[];
  creditRating?: 'AAA' | 'AA' | 'A' | 'BBB' | 'Subprime';
  ipoState?: AgencyIpoState;
  acquiredAgencies?: AcquiredBoutiqueAgency[];
  disciplinaryCases?: DisciplinaryCourtCase[];
  globalTours?: PreSeasonTourRecord[];
  youthDraftProspects?: YouthDraftProspect[];
  escrowDeals?: EscrowTransferDeal[];
  achievements?: AgencyAchievement[];
  corporateBonds?: CorporateBond[];
  headquartersUpgrades?: AgencyHeadquartersUpgrades;
  pastSeasonsArchive?: PastSeasonArchive[];
  subAgents?: SubAgentRecruit[];
  brandPartnership?: AgencyBrandPartnership;
  disciplinaryAppeals?: DisciplinaryAppealCase[];
  ethicsCompliance?: EthicsComplianceState;
  transferRumors?: TransferRumorItem[];
  dashboardWidgets?: string[];
}

export interface SubAgentRecruit {
  id: string;
  name: string;
  specialty: 'South American Scout' | 'Hardball Negotiator' | 'Commercial Sponsorship Guru' | 'Youth Whisperer';
  revSharePercent: number; // e.g. 15%
  reputation: number;
  weeklySalary: number;
}

export interface AgencyBrandPartnership {
  brandName: 'Nike Pro Agency' | 'Adidas Global Elite' | 'Puma Nitro Network' | 'Under Armour Football';
  annualIncome: number;
  yearsRemaining: number;
  playerGearDiscountPercent: number;
  logoEmoji: string;
}

export interface DisciplinaryAppealCase {
  id: string;
  playerId: string;
  playerName: string;
  clubName: string;
  originalBanMatches: number;
  reducedBanMatches?: number;
  status: 'pending' | 'successful' | 'rejected';
  legalFee: number;
  weekSubmitted: number;
  defenseStrategy: 'Video Evidence (VAR Defect)' | 'Character Testimony' | 'Provocation Defense';
  verdictMessage?: string;
}

export interface EthicsComplianceState {
  scrutinyLevel: number; // 0-100
  lastAuditWeek?: number;
  underInvestigation?: boolean;
  investigationReason?: string;
  investigationFine?: number;
}

export interface TransferRumorItem {
  id: string;
  headline: string;
  tier: 'Tier 1 (Here We Go!)' | 'Tier 2 (Reliable)' | 'Tier 3 (Gossip)';
  credibility: number; // 1-100
  playerName: string;
  fromClub: string;
  toClub: string;
  estimatedFee: number;
  week: number;
}

export interface AgencyHeadquartersUpgrades {
  dataAnalyticsSuite: number; // 0-3 (Boosts scouting accuracy & hidden potential revelation)
  physioRecoveryClinic: number; // 0-3 (Accelerates client fatigue restoration & injury recovery)
  vipNegotiationLounge: number; // 0-3 (Increases player pitch & contract negotiation leverage +5% to +15%)
  legalDefenseUnit: number; // 0-3 (Reduces dark arts penalties & tax auditing risks)
}

export interface PastSeasonArchive {
  season: number;
  championClubName: string;
  championLeague: string;
  goldenBootWinner: {
    name: string;
    clubName: string;
    goals: number;
  };
  topPlaymaker: {
    name: string;
    clubName: string;
    assists: number;
  };
  recordTransfer: {
    playerName: string;
    fromClub: string;
    toClub: string;
    fee: number;
  };
  agencyFinalRank: number;
  totalClientEarnings: number;
}

export interface FifaLicenseState {
  tier: 'grassroots' | 'national' | 'uefa' | 'fifa_global';
  licenseNumber: string;
  examPassed: boolean;
  examScore?: number;
  lastExamWeek?: number;
  lastExamSeason?: number;
  commissionCapPercent: number; // 3, 5, 7, 10
  maxRepresentableValuation: number; // e.g. €1M, €15M, €60M, Infinity
  reputationMultiplier: number;
}

export type MatchdayDirectiveType = 'showcase_flair' | 'tactical_discipline' | 'injury_caution' | 'all_out_press' | 'none';

export interface MatchdayDirective {
  playerId: string;
  type: MatchdayDirectiveType;
  instructions: string;
  active: boolean;
}

export interface SatelliteAcademy {
  id: string;
  name: string;
  country: string;
  region: 'Brazil (Santos)' | 'Belgium (Lommel)' | 'Ghana (Accra)' | 'Japan (Yokohama)' | 'Portugal (Algarve)';
  cost: number;
  weeklyOperatingCost: number;
  prestige: number;
  talentBonus: string;
  owned: boolean;
  assignedLoanProspects: string[]; // player IDs
  producedWonderkidsCount: number;
  flag: string;
}

export interface FederationTreasuryState {
  treasuryBalance: number; // e.g. €350,000,000
  annualSponsorRevenue: number; // e.g. €120,000,000
  tvBroadcastPackageTotal: number; // e.g. €450,000,000
  broadcastDistributionModel: 'equal_merit' | 'top_heavy' | 'grassroots_equalizer';
  totalTaxRevenueCollected?: number;
  weeklyCorporateTaxCollected?: number;
  weeklyLuxuryTaxCollected?: number;
  prizeMoneyPool: {
    championPrize: number; // e.g. €50,000,000
    top4Bonus: number; // e.g. €25,000,000
    midTableGrant: number; // e.g. €12,000,000
    relegationParachute: number; // e.g. €15,000,000
    grassrootsSubsidy: number; // e.g. €10,000,000
  };
  nationalCoach?: {
    name: string;
    nationality: string;
    style: 'Tactical Mastermind' | 'Total Football' | 'High-Press Machine' | 'Defensive Rock';
    rating: number; // 50-99
    salary: number; // annual
    contractYears: number;
    publicApproval: number; // 0-100
    targetTournamentGoal: 'Quarter-Finals' | 'Semi-Finals' | 'Finalists' | 'Win the Trophy';
  };
  worldCupBid?: {
    active: boolean;
    targetTournament: '2028 Continental Euro Championship' | '2030 FIFA World Cup' | '2034 Global Super Cup';
    bidBudgetInvested: number;
    voterDelegatesSecured: number; // 0-100%
    hostStadiumsPrepared: number;
    status: 'bidding' | 'awarded' | 'defeated';
  };
  disbursedPrizeMoneyHistory?: {
    season: number;
    championClubName: string;
    totalPaidOut: number;
  }[];
}

export interface LoanDeal {
  id: string;
  playerId: string;
  playerName: string;
  playerPosition: Position;
  playerRating: number;
  playerPotential: number;
  playerAge: number;
  parentClubId: string;
  parentClubName: string;
  loaneeClubId: string;
  loaneeClubName: string;
  loaneeClubLeague?: string;
  loanDurationWeeks: number; // e.g., 19 (half season) or 38 (full season)
  weeksRemaining: number;
  wageContributionPercent: number; // e.g. 80 means loanee pays 80%, parent pays 20%
  weeklyWage: number;
  loanFee: number; // upfront fee paid to parent club
  buybackClause: {
    active: boolean;
    fee: number; // e.g., 6000000
    isExercised?: boolean;
  };
  optionToBuy?: {
    active: boolean;
    fee: number;
    isExercised?: boolean;
  };
  buyoutType?: 'optional_buyout' | 'mandatory_buyout' | 'none';
  buyoutFee?: number;
  isMandatoryExercised?: boolean;
  medicalStatus?: 'passed' | 'minor_flag' | 'failed' | 'pending';
  medicalNotes?: string;
  registrationStatus?: 'registered' | 'pending' | 'rejected';
  negotiationStage?: 'terms' | 'medicals' | 'registration' | 'completed';
  playingTimeGuarantee: 'Key Starter' | 'Rotation' | 'Fringe Player';
  status: 'active' | 'recalled' | 'bought_back' | 'permanently_transferred' | 'completed';
  ratingGrowthGained: number; // e.g. +3 rating gained during loan
  matchAppearances: number;
  goalsScored: number;
  assistsCount: number;
  isPlayerClient: boolean;
  agencyCommission: number; // EUR fee earned
  dateCreatedWeek: number;
  dateCreatedSeason: number;
}

export interface PlayerDilemma {
  id: string;
  playerId: string;
  title: string;
  description: string;
  optionA: { label: string; outcomeText: string; moraleChange: number; cashChange: number; scandalChange: number };
  optionB: { label: string; outcomeText: string; moraleChange: number; cashChange: number; scandalChange: number };
}

export interface RandomEventOption {
  label: string;
  description: string;
  outcomeTitle: string;
  outcomeText: string;
  effects: {
    cashChange?: number;
    reputationChange?: number;
    scandalChange?: number;
    moraleChange?: number;
    fanApprovalChange?: number;
    chairmanTrustChange?: number;
    politicalInfluenceChange?: number;
  };
}

export interface AgencyBankLoan {
  id: string;
  lenderName: string;
  lenderType: 'Commercial Bank' | 'Sovereign Wealth Fund' | 'Private Equity' | 'High-Risk Shadow Vault';
  principal: number; // Original amount borrowed
  remainingPrincipal: number; // Remaining amount to repay
  weeklyInterestRate: number; // e.g. 0.015 (1.5% per week)
  weeklyInterestPayment: number; // Calculated interest due per week
  weeklyAmortizationPayment: number; // Optional automatic principal reduction
  totalPaidSoFar: number;
  termWeeksTotal: number;
  weeksRemaining: number;
  collateralAsset?: string;
  defaultedWeeks: number;
  dateBorrowedWeek: number;
  dateBorrowedSeason: number;
}

export interface AgencyIpoState {
  isPublic: boolean;
  stockExchange: 'London Stock Exchange (LSE)' | 'New York Stock Exchange (NYSE)' | 'Frankfurt DAX';
  tickerSymbol: string;
  sharePrice: number; // in EUR, e.g. €24.50
  sharesOutstanding: number; // e.g. 10,000,000
  marketCap: number; // sharePrice * sharesOutstanding
  publicFloatPercent: number; // e.g. 35%
  capitalRaisedAtIpo: number;
  weeklyStockPriceChangePercent: number;
  quarterlyDividendsPaid: number;
  quarterlyEarningsTarget: number;
  shareholderConfidence: number; // 0-100
  historicalPrices: { week: number; season: number; price: number }[];
  totalBuybacksExecuted?: number;
  secondaryOfferingsRaised?: number;
  activistInvestorWarning?: boolean;
}

export interface AcquiredBoutiqueAgency {
  id: string;
  name: string;
  country: string;
  flag: string;
  specialization: string;
  acquisitionCost: number;
  clientCount: number;
  topClientPlayerIds: string[];
  reputationBonus: number;
  scoutCount: number;
  acquiredWeek?: number;
  acquiredSeason?: number;
  owned: boolean;
}

export interface DisciplinaryCourtCase {
  id: string;
  caseType: 'controversial_var_red' | 'manager_touchline_brawl' | 'match_fixing_allegation' | 'doping_violation' | 'illegal_third_party_ownership';
  title: string;
  involvedEntityName: string;
  involvedEntityType: 'club' | 'player' | 'manager';
  clubId?: string;
  playerId?: string;
  details: string;
  evidenceStrength: number; // 0-100%
  prosecutionDemand: string;
  verdictOptions: {
    label: string;
    description: string;
    sanctionType: 'points_deduction' | 'fine' | 'ban_matches' | 'transfer_ban' | 'exonerate';
    pointsDeducted?: number;
    fineAmount?: number;
    banWeeks?: number;
    politicalInfluenceImpact: number;
    integrityImpact: number;
    publicApprovalImpact: number;
  }[];
  isResolved: boolean;
  chosenVerdictIndex?: number;
  weekSubmitted: number;
  seasonSubmitted: number;
}

export interface PreSeasonTourRecord {
  id: string;
  destination: 'USA East Coast & Miami' | 'Tokyo & Seoul Super Cup' | 'Gulf Nations Showcase' | 'Alpine Altitude Camp';
  flag: string;
  totalRevenue: number;
  merchandiseBonus: number;
  squadFatigueImpact: number;
  squadTacticalPrep: number;
  weekExecuted: number;
  seasonExecuted: number;
  status: 'planned' | 'completed';
}

export interface YouthDraftProspect {
  id: string;
  name: string;
  age: number;
  nationality: string;
  flag: string;
  position: Position;
  rating: number;
  potential: number;
  originAcademy: string;
  preferredStyle: string;
  personality: 'Ambitious Prodigy' | 'Family-Oriented Genius' | 'Commercial Superstar' | 'Humble Workhorse';
  agentBattle: {
    rivalAgentsCompeting: string[];
    leadingAgent: string;
    userPitchScore: number;
    rivalPitchScore: number;
    decisionWeeksRemaining: number;
    signedWithUser?: boolean;
    signedWithRival?: string;
  };
}

export interface OngoingTransferNegotiation {
  id: string;
  buyingClubId: string;
  buyingClubName: string;
  buyingClubLogoColor?: string;
  offeredFee: number;
  offeredWage: number;
  offeredCommission: number;
  offeredYears: number;
  offeredReleaseClause?: number;
  offeredClauses?: ContractClauses;
  counterFee?: number;
  counterWage?: number;
  counterCommission?: number;
  counterYears?: number;
  counterClauses?: ContractClauses;
  weeksRemaining: number;
  status: 'pending_buying_club' | 'pending_user_decision' | 'counter_offered_by_club' | 'accepted' | 'rejected' | 'asking_time';
  buyingClubDirector: string;
  buyingClubRole: string;
  directorAvatar?: string;
  lastResponseReasoning?: string;
  startWeek: number;
  startSeason: number;
}

export interface RandomEvent {
  id: string;
  title: string;
  category: 'scandal' | 'sponsor' | 'manager' | 'financial' | 'stadium' | 'player' | 'governance' | 'grassroots';
  description: string;
  characterName?: string;
  characterRole?: string;
  imageEmoji?: string;
  targetPlayerId?: string;
  targetClubId?: string;
  options: RandomEventOption[];
}

export interface EscrowTransferTranche {
  id: string;
  trancheNumber: number;
  label: string;
  amount: number; // EUR gross
  agentCut: number; // EUR received by agency
  dueWeek: number;
  dueSeason: number;
  conditionType: 'scheduled_installment' | 'appearances_milestone' | 'trophy_incentive';
  conditionTarget?: number; // e.g. 15 appearances
  currentProgress?: number;
  status: 'pending' | 'matured' | 'disbursed';
  description: string;
}

export interface EscrowTransferDeal {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatarEmoji?: string;
  sellingClubName: string;
  buyingClubName: string;
  totalFee: number;
  upfrontCash: number;
  commissionPercent: number;
  tranches: EscrowTransferTranche[];
  totalReceivableRemaining: number;
  dateCreatedWeek: number;
  dateCreatedSeason: number;
  isUserClient: boolean;
  status: 'active' | 'fully_settled';
}

export interface TvRightsTenderBid {
  id: string;
  networkName: string;
  networkLogo: string;
  broadcasterType: 'Linear Global Broadcast' | 'Premium OTT Streaming' | 'Tech Giant Platform';
  bidAmountAnnual: number;
  termYears: number;
  distributionBonusPercent: number; // Bonus on European continental coefficient
  preferredModel: 'equal_merit' | 'top_heavy' | 'grassroots_equalizer';
  status: 'available' | 'awarded' | 'rejected';
}


