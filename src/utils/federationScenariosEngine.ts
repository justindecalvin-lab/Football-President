import { AgencyState, Club, Player } from '../types';
import { formatMoney } from './gameEngine';

export interface FederationActionScenario {
  id: string;
  title: string;
  category: 
    | 'financial_insolvency' 
    | 'referee_corruption' 
    | 'super_league' 
    | 'sovereign_takeover' 
    | 'var_scandal' 
    | 'national_team'
    | 'world_cup_bid'
    | 'agent_regulations'
    | 'anti_doping'
    | 'multi_club'
    | 'broadcasting'
    | 'fan_governance'
    | 'youth_integrity'
    | 'infrastructure'
    | 'governance_ethics';
  severity: 'CRITICAL' | 'HIGH' | 'EMERGENCY';
  headline: string;
  summary: string;
  involvedClubName?: string;
  involvedPlayerName?: string;
  requiredRoleMin: 'Regional Delegate' | 'Federation Director' | 'Continental President' | 'FIFA Global President';
  options: {
    id: string;
    label: string;
    description: string;
    outcomeTitle: string;
    outcomeText: string;
    effects: {
      federationCashDelta?: number;
      agencyCashDelta?: number;
      politicalInfluenceDelta?: number;
      scandalDelta?: number;
      reputationDelta?: number;
      clubTrustDelta?: number;
      fanApprovalDelta?: number;
    };
  }[];
}

export function getFederationScenarios(clubs: Club[], players: Player[]): FederationActionScenario[] {
  const topClub = clubs.length > 0 ? clubs[0] : { name: 'Madrid Capital FC' };
  const rogueClub = clubs.length > 1 ? clubs[1] : { name: 'Manchester Powerhouse' };
  const starPlayer = players.length > 0 ? players[0] : { name: 'Kylian Mbappe' };
  const secondaryClub = clubs.length > 2 ? clubs[2] : { name: 'Bavaria Munich' };

  return [
    {
      id: 'fed_case_insolvency',
      title: `Emergency Club Insolvency & Liquidation Hearing (${topClub.name})`,
      category: 'financial_insolvency',
      severity: 'EMERGENCY',
      headline: `FINANCIAL CONTROLLER PETITION: ${topClub.name} Faces -15 Point Deduction & Relegation Due to €120M Unpaid Liabilities`,
      summary: `The League Financial Fair Play Audit Commission has submitted a mandatory hearing petition against ${topClub.name}. The club is €120,000,000 in debt and unable to meet player wage bills. As Federation Executive, your ruling is final.`,
      involvedClubName: topClub.name,
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_bailout',
          label: 'Grant €50M Emergency Federation Subsidy & Debt Restructure',
          description: 'Use federation reserves to bail out the historic club, preserving league prestige at the cost of public outcry.',
          outcomeTitle: 'Emergency Bailout Granted',
          outcomeText: `You transferred €50,000,000 in federation reserves to stabilize ${topClub.name}. Club directors expressed immense gratitude, though rival clubs complained of favoritism.`,
          effects: {
            agencyCashDelta: -5000000,
            politicalInfluenceDelta: 15,
            scandalDelta: 10,
            clubTrustDelta: 20,
            fanApprovalDelta: -10
          }
        },
        {
          id: 'opt_sanction',
          label: 'Enforce Draconian 15-Point Relegation Penalty & Wage Cap',
          description: 'Apply strict FFP law without exception to demonstrate ruthless governance integrity.',
          outcomeTitle: '15-Point Penalty Applied',
          outcomeText: `You imposed a strict 15-point penalty on ${topClub.name}. FFP compliance integrity surged, earning international acclaim from FIFA auditors.`,
          effects: {
            reputationDelta: 12,
            scandalDelta: -15,
            clubTrustDelta: -15,
            fanApprovalDelta: 15
          }
        },
        {
          id: 'opt_sovereign_buyout',
          label: 'Approve Sovereign Wealth Investor Hostile Takeover',
          description: 'Bypass standard 51% fan ownership restrictions to allow a multi-billion state acquisition.',
          outcomeTitle: 'Sovereign Takeover Approved',
          outcomeText: `You granted a special legislative exemption allowing state-backed investors to purchase ${topClub.name}. Earned €20,000,000 in licensing fees.`,
          effects: {
            agencyCashDelta: 20000000,
            politicalInfluenceDelta: 10,
            scandalDelta: 20,
            reputationDelta: -5
          }
        }
      ]
    },
    {
      id: 'fed_case_referee_ring',
      title: 'Match-Fixing Ring & Referee Bribe Investigation',
      category: 'referee_corruption',
      severity: 'CRITICAL',
      headline: 'SPECIAL INTEGRITY AUDIT: Wiretaps Confirm Senior Referees Accepted €3.5M Bribes in Cup Final',
      summary: 'Secret police wiretaps caught 3 senior referee panel members negotiating match outcomes with illegal sports betting syndicates. The League Cup Final result is under challenge.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_ref_ban',
          label: 'Deploy Unannounced Integrity Audit & Issue Lifetime Bans',
          description: 'Dismantle the corrupt referee panel, ban officials for life, and install automated VAR camera tracking.',
          outcomeTitle: 'Corruption Ring Dismantled',
          outcomeText: 'You banned the corrupt officials and restructured referee governance. Global football bodies praised your uncompromising integrity.',
          effects: {
            reputationDelta: 15,
            scandalDelta: -25,
            politicalInfluenceDelta: -5,
            fanApprovalDelta: 20
          }
        },
        {
          id: 'opt_ref_coverup',
          label: 'Quietly Settle Out-of-Court & Issue Confidential Fines',
          description: 'Avoid a catastrophic public scandal by fining officials privately and sweeping wiretaps under the rug.',
          outcomeTitle: 'Scandal Suppressed',
          outcomeText: 'The story was kept out of global headlines. Collected €10,000,000 in confidential fines, though ethical risks persist.',
          effects: {
            agencyCashDelta: 10000000,
            scandalDelta: 25,
            politicalInfluenceDelta: 10,
            reputationDelta: -10
          }
        },
        {
          id: 'opt_ref_replay',
          label: 'Annul Match Result & Order Historic Cup Final Replay',
          description: 'Nullify the fixed match and schedule a televised replay behind closed doors.',
          outcomeTitle: 'Match Replay Ordered',
          outcomeText: 'Fans applauded the fair replay decision, generating €8,000,000 in extra broadcasting rights fees.',
          effects: {
            agencyCashDelta: 8000000,
            fanApprovalDelta: 25,
            clubTrustDelta: -5
          }
        }
      ]
    },
    {
      id: 'fed_case_super_league',
      title: `Rogue Super League Breakaway Ultimatum (${rogueClub.name})`,
      category: 'super_league',
      severity: 'EMERGENCY',
      headline: `BREAKAWAY THREAT: 6 Elite Clubs Threaten Closed European Super League Unless Revenue Multiplies`,
      summary: `A consortium led by ${rogueClub.name} has registered a breakaway league company. They demand 60% of all TV broadcasting rights or threaten to walk out of domestic competitions immediately.`,
      involvedClubName: rogueClub.name,
      requiredRoleMin: 'Federation Director',
      options: [
        {
          id: 'opt_sl_expulsion',
          label: 'Issue Expulsion Ultimatum & Bar Players from World Cup',
          description: 'Threaten to ban all breakaway players from national teams and revoke domestic licenses.',
          outcomeTitle: 'Breakaway Ultimatum Issued',
          outcomeText: 'Your uncompromising stand forced 4 rogue clubs to back down! Your presidency prestige soared to legendary heights.',
          effects: {
            reputationDelta: 20,
            politicalInfluenceDelta: 20,
            clubTrustDelta: -15,
            fanApprovalDelta: 25
          }
        },
        {
          id: 'opt_sl_compromise',
          label: 'Broker Hybrid Champions League Broadcasting Compromise',
          description: 'Create an expanded 36-team continental tournament with guaranteed TV payouts for top seeds.',
          outcomeTitle: 'Broadcasting Compromise Sealed',
          outcomeText: 'Sealed a multi-billion broadcasting package! Secured €25,000,000 in executive federation dividends.',
          effects: {
            agencyCashDelta: 25000000,
            politicalInfluenceDelta: 15,
            reputationDelta: 5,
            scandalDelta: 5
          }
        }
      ]
    },
    {
      id: 'fed_case_takeover',
      title: 'Hostile Sovereign Wealth Fund Acquisition Petition',
      category: 'sovereign_takeover',
      severity: 'CRITICAL',
      headline: 'FOREIGN TAKEOVER REVIEW: Sovereign Oil Investment Fund Bids €2.8 Billion for Domestic Giant',
      summary: 'Human rights groups petition the federation to block state ownership, while local fan groups demand world-class stadium development and star transfers.',
      requiredRoleMin: 'Federation Director',
      options: [
        {
          id: 'opt_shield_block',
          label: 'Enact Foreign Sovereign Immunity Protection Shield (Block Deal)',
          description: 'Protect domestic football heritage against foreign state ownership.',
          outcomeTitle: 'Foreign Takeover Blocked',
          outcomeText: 'Enacted strict owner-and-director test regulations. Domestic fan unions celebrated your defense of football heritage.',
          effects: {
            reputationDelta: 15,
            fanApprovalDelta: 20,
            politicalInfluenceDelta: -10
          }
        },
        {
          id: 'opt_shield_tax',
          label: 'Approve Takeover with Mandatory €35M Grassroots Infrastructure Tax',
          description: 'Condition state ownership on a €35M direct investment into national youth academies.',
          outcomeTitle: 'Takeover Approved with Grassroots Tax',
          outcomeText: 'Approved the acquisition and collected €35,000,000 dedicated to grassroots academies nationwide.',
          effects: {
            agencyCashDelta: 35000000,
            reputationDelta: 10,
            scandalDelta: 10
          }
        }
      ]
    },
    {
      id: 'fed_case_var',
      title: 'VAR Technology Crash & Retrospective Cup Final Petition',
      category: 'var_scandal',
      severity: 'HIGH',
      headline: 'TECHNOLOGY FAILURE: VAR Calibration Error Costs Team Championship Trophy in 94th Minute',
      summary: 'Official hawk-eye camera logs confirm a calibration glitch incorrectly ruled out a legitimate 94th-minute winning goal in the Cup Final.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_var_cochampions',
          label: 'Award Retrospective Co-Champions Trophy & Prize Money',
          description: 'Correct the technical injustice by declaring joint-winners for the season.',
          outcomeTitle: 'Co-Champions Awarded',
          outcomeText: 'Issued a landmark fairness ruling declaring joint champions. Praised globally for sportsmanship.',
          effects: {
            reputationDelta: 12,
            fanApprovalDelta: 15,
            scandalDelta: -10
          }
        },
        {
          id: 'opt_var_audit',
          label: 'Uphold Pitch Referee Decision & Fine VAR Software Vendor (€5M)',
          description: 'Maintain referee authority on pitch while fining tech vendor for equipment failure.',
          outcomeTitle: 'VAR Vendor Fined',
          outcomeText: 'Collected €5,000,000 penalty fine from VAR tech vendor and upgraded stadium camera arrays.',
          effects: {
            agencyCashDelta: 5000000,
            politicalInfluenceDelta: 5
          }
        }
      ]
    },
    {
      id: 'fed_case_national_squad',
      title: `National Team Selection Friction (${starPlayer.name})`,
      category: 'national_team',
      severity: 'HIGH',
      headline: `SELECTION CRISIS: National Team Coach Excludes Star Client ${starPlayer.name} From World Cup`,
      summary: `Head Coach refuses to call up ${starPlayer.name} due to locker room friction. As Federation Leader, you command direct oversight over national team management.`,
      involvedPlayerName: starPlayer.name,
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_veto_selection',
          label: 'Exercise Executive Presidential Veto & Mandate Player Call-Up',
          description: 'Force the manager to include your star client in the 26-man World Cup squad.',
          outcomeTitle: 'Presidential Call-Up Mandated',
          outcomeText: `You overruled the national manager! ${starPlayer.name} was named in the World Cup squad (+30 Client Morale).`,
          effects: {
            politicalInfluenceDelta: 15,
            scandalDelta: 12,
            reputationDelta: 5
          }
        },
        {
          id: 'opt_sack_manager',
          label: 'Sack National Coach & Appoint Allied Tactical Manager',
          description: 'Replace the head coach with a manager represented by your agency.',
          outcomeTitle: 'National Coach Replaced',
          outcomeText: 'Appointed an agency-allied head coach to lead the national team into the World Cup finals!',
          effects: {
            agencyCashDelta: -5000000,
            politicalInfluenceDelta: 20,
            reputationDelta: 10
          }
        }
      ]
    },

    // --- 30 NEW FEDERATION GOVERNANCE SCENARIOS ---

    // 1. World Cup Host Selection Bidding Scandal
    {
      id: 'fed_scenario_wc_bid',
      title: 'World Cup Hosting Rights Vote & Geopolitical Bribe Allegations',
      category: 'world_cup_bid',
      severity: 'EMERGENCY',
      headline: 'FIFA ETHICS HEARING: €40M Secret Cash Transfer Alleged to Secure World Cup Hosting Votes',
      summary: 'A whistleblowing FIFA delegate exposes evidence that three continental voting members received offshore wire transfers to cast World Cup hosting ballots for an ambitious oil-state bid.',
      requiredRoleMin: 'Continental President',
      options: [
        {
          id: 'opt_wc_reballot',
          label: 'Strip Hosting Rights & Order Immediate Emergency Re-Vote',
          description: 'Nullify corrupt votes, enforce transparent balloting, and restore global governance credibility.',
          outcomeTitle: 'World Cup Re-Vote Executed',
          outcomeText: 'You annulled corrupt ballots and enforced open voting. Transparency groups acclaimed your uncompromising presidential leadership.',
          effects: { reputationDelta: 25, scandalDelta: -30, politicalInfluenceDelta: 10, fanApprovalDelta: 30 }
        },
        {
          id: 'opt_wc_take_cut',
          label: 'Ratify Host Selection & Collect €15M Continental Development Grant',
          description: 'Accept the bidding committee’s infrastructure development grant to enrich your federation reserves.',
          outcomeTitle: 'Continental Grant Accepted',
          outcomeText: 'You ratified the tournament hosting choice and deposited €15,000,000 into federation executive coffers.',
          effects: { agencyCashDelta: 15000000, politicalInfluenceDelta: 15, scandalDelta: 20 }
        }
      ]
    },

    // 2. Agent Licensing & Salary/Commission Cap Directive
    {
      id: 'fed_scenario_agent_cap',
      title: 'FFAR Agent Reform: 3% Commission Cap vs Unlimited Agency Fees',
      category: 'agent_regulations',
      severity: 'CRITICAL',
      headline: 'AGENCY LEGISLATION: FIFA Proposes Binding 3% Cap on Agent Transfer Commissions',
      summary: 'The FIFA Football Agent Regulations (FFAR) committee introduces a strict 3% cap on agent commissions. As an active super-agent in office, you hold casting vote power on local implementation.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_agent_block_cap',
          label: 'Grant Judicial Exemption Blocking Commission Caps in Your Region',
          description: 'Leverage your presidential decree power to declare agent fee caps illegal under local antitrust law.',
          outcomeTitle: 'Agent Commission Caps Blocked',
          outcomeText: 'You protected agency fee freedom! Your personal agency continues earning 10-15% on multi-million transfers.',
          effects: { agencyCashDelta: 12000000, politicalInfluenceDelta: 10, scandalDelta: 15, clubTrustDelta: -10 }
        },
        {
          id: 'opt_agent_enforce_cap',
          label: 'Enforce Strict 3% FIFA Agent Cap & License Exam Standardization',
          description: 'Demonstrate zero tolerance for agent extortion by capping transfer commissions strictly at 3%.',
          outcomeTitle: '3% Commission Cap Enforced',
          outcomeText: 'You enacted strict FIFA agent licensing rules. Club chairmen lauded the dramatic reduction in intermediary fees.',
          effects: { reputationDelta: 18, scandalDelta: -20, clubTrustDelta: 25, fanApprovalDelta: 15 }
        }
      ]
    },

    // 3. World Cup Doping & Anti-Doping Laboratory Breach
    {
      id: 'fed_scenario_doping',
      title: 'WADA Anti-Doping Breach: Star Player Fails PED Test',
      category: 'anti_doping',
      severity: 'EMERGENCY',
      headline: `DOPING SCANNER POSITIVE: ${starPlayer.name} Tests Positive for Banned Anabolic Performance Enhancer`,
      summary: `WADA laboratories detected testosterone metabolites in ${starPlayer.name}'s post-match urine sample. The player claims contaminated dietary supplements, but faces a 4-year global ban.`,
      involvedPlayerName: starPlayer.name,
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_doping_ban',
          label: 'Enforce Mandatory 2-Year Suspension & Nullify Match Stats',
          description: 'Uphold strict anti-doping protocol without leniency to preserve league integrity.',
          outcomeTitle: 'Anti-Doping Ban Applied',
          outcomeText: `You upheld WADA regulations and suspended ${starPlayer.name} for 24 months, proving no star is above the law.`,
          effects: { reputationDelta: 20, scandalDelta: -25, fanApprovalDelta: 20, clubTrustDelta: 10 }
        },
        {
          id: 'opt_doping_suppress',
          label: 'Accept Medical Contamination Defense & Reduce Sanction to Probation',
          description: 'Approve an out-of-competition therapeutic exemption fine, allowing the player to remain active.',
          outcomeTitle: 'Probationary Exemption Granted',
          outcomeText: `You cleared ${starPlayer.name} to play upon payment of a €2,000,000 medical research fine to the federation.`,
          effects: { agencyCashDelta: 2000000, politicalInfluenceDelta: 10, scandalDelta: 18, reputationDelta: -10 }
        }
      ]
    },

    // 4. Naturalized Passport Eligibility Scandal
    {
      id: 'fed_scenario_passports',
      title: 'Illegal Expedited Passport & Naturalization Hearing',
      category: 'national_team',
      severity: 'HIGH',
      headline: 'IMMIGRATION AUDIT: 4 Foreign South American Stars Issued Fast-Track Passports Without 5-Year Residency',
      summary: 'Government auditors question the legality of fast-tracked dual citizenship granted to 4 foreign stars ahead of the World Cup Qualifiers. Rival nations threaten formal protest.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_passport_legalize',
          label: 'Issue Retroactive Presidential Special Cultural Exemption Decree',
          description: 'Legally certify the naturalizations as matter of national interest.',
          outcomeTitle: 'Special Cultural Decree Passed',
          outcomeText: 'You signed an executive decree legalizing the squad naturalizations. National squad depth soared (+25 Qualification Rating).',
          effects: { politicalInfluenceDelta: 18, scandalDelta: 12, fanApprovalDelta: 20 }
        },
        {
          id: 'opt_passport_disqualify',
          label: 'Disqualify Ineligible Players & Forfeit Contested Matches',
          description: 'Admit immigration procedural oversight and field homegrown players.',
          outcomeTitle: 'Ineligible Players Withdrawn',
          outcomeText: 'You forfeited 2 qualification matches to uphold international immigration law.',
          effects: { reputationDelta: 15, scandalDelta: -15, fanApprovalDelta: -10 }
        }
      ]
    },

    // 5. Multi-Club Ownership & Conflict of Interest Directive
    {
      id: 'fed_scenario_multi_club',
      title: `Multi-Club Ownership Direct Transfer Sanction (${rogueClub.name})`,
      category: 'multi_club',
      severity: 'CRITICAL',
      headline: `CONFLICT OF INTEREST: ${rogueClub.name} Attempts Below-Market €1M Transfer of €80M Star from Sister Club`,
      summary: `Holding conglomerate owning ${rogueClub.name} attempts to bypass Financial Fair Play rules by moving a world-class winger for a fraction of market value. Rivals demand a total multi-club transfer freeze.`,
      involvedClubName: rogueClub.name,
      requiredRoleMin: 'Federation Director',
      options: [
        {
          id: 'opt_mc_ban',
          label: 'Ban Inter-Group Multi-Club Transfers & Mandatory Fair Value Valuation',
          description: 'Enforce independent sports valuation audits on all transactions between related clubs.',
          outcomeTitle: 'Multi-Club Transfer Freeze Enacted',
          outcomeText: 'You banned artificial internal transfers. Fair market value principles were restored across the division.',
          effects: { reputationDelta: 18, scandalDelta: -20, clubTrustDelta: 20, fanApprovalDelta: 20 }
        },
        {
          id: 'opt_mc_fee',
          label: 'Approve Deal with Mandatory 20% Group Competition Surcharge',
          description: 'Allow transfer provided the parent group pays a €10M solidarity tax into league coffers.',
          outcomeTitle: 'Group Transfer Surcharge Collected',
          outcomeText: 'Approved the move and collected a €10,000,000 solidarity levy for lower league development.',
          effects: { agencyCashDelta: 10000000, politicalInfluenceDelta: 12, scandalDelta: 10 }
        }
      ]
    },

    // 6. Gambling & Crypto Shirt Sponsorship Banning Decree
    {
      id: 'fed_scenario_gambling',
      title: 'Betting & Unregistered Crypto Shirt Sponsorship Ban',
      category: 'governance_ethics',
      severity: 'HIGH',
      headline: 'COMMISSIONER MOTION: Banning Unregulated Online Gambling Logos from Club Kits',
      summary: 'Public health ministers demand the immediate removal of offshore gambling and unregulated cryptocurrency sponsors from domestic match jerseys.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_gambling_ban',
          label: 'Pass Complete Ban on Betting Logos & Phase in FinTech Rules',
          description: 'Clean up shirt sponsorships, boosting family-friendly brand value at the expense of betting revenue.',
          outcomeTitle: 'Kit Gambling Ban Enacted',
          outcomeText: 'You phased out offshore gambling sponsors, attracting blue-chip corporate partners to the league.',
          effects: { reputationDelta: 16, fanApprovalDelta: 25, scandalDelta: -15, clubTrustDelta: -10 }
        },
        {
          id: 'opt_gambling_tax',
          label: 'Allow Gambling Sponsors in Exchange for 15% Harm Reduction Tax',
          description: 'Keep lucrative betting deals while levying a mandatory 15% tax on sponsor contracts.',
          outcomeTitle: 'Betting Surcharge Levied',
          outcomeText: 'Collected €8,000,000 annually in gambling sponsor levies for federation reserve funds.',
          effects: { agencyCashDelta: 8000000, politicalInfluenceDelta: 10, scandalDelta: 8 }
        }
      ]
    },

    // 7. Synthetic Turf vs Natural Hybrid Pitch Mandate
    {
      id: 'fed_scenario_pitches',
      title: 'Mandatory Natural Grass Standard & Stadium Turf Upgrade Directive',
      category: 'infrastructure',
      severity: 'HIGH',
      headline: 'PLAYER UNION STRIKE THREAT: Player Association Refuses to Play on Artificial Turf Due to ACL Injuries',
      summary: 'Player unions demand an absolute ban on synthetic plastic turf pitches after knee injury rates spiked 40%. Lower division clubs cite €2M conversion costs.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_pitch_grass',
          label: 'Mandate 100% Hybrid Natural Grass & Grant €15M Pitch Conversion Subsidy',
          description: 'Fund stadium pitch replacements using federation infrastructure grants.',
          outcomeTitle: 'Hybrid Grass Mandate Approved',
          outcomeText: 'You eliminated synthetic turf across top divisions! Player injury rates dropped and pitch quality earned UEFA praise.',
          effects: { reputationDelta: 15, fanApprovalDelta: 20, agencyCashDelta: -3000000, clubTrustDelta: 15 }
        },
        {
          id: 'opt_pitch_turf_ok',
          label: 'Grant 3-Year Turf Exemption Extension for Lower Tier Stadiums',
          description: 'Protect small clubs from financial strain by delaying grass requirements.',
          outcomeTitle: 'Turf Exemption Granted',
          outcomeText: 'Lower tier clubs thanked your administration for preventing immediate stadium closure bankruptcies.',
          effects: { clubTrustDelta: 18, politicalInfluenceDelta: 10, reputationDelta: -5 }
        }
      ]
    },

    // 8. Women’s Football Equal Pay & Stadium Guarantee Directive
    {
      id: 'fed_scenario_womens_equal_pay',
      title: 'Women’s Super League Commercial Equal Pay & Main Stadium Directive',
      category: 'governance_ethics',
      severity: 'CRITICAL',
      headline: 'HISTORIC EQUALITY BILL: Mandating Equal Match Fees & 100% Main Stadium Access',
      summary: 'Federation bill proposing equal international appearance fees and requiring men’s top-flight clubs to host Women’s Super League fixtures in main 50,000+ seat arenas.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_equal_pay_pass',
          label: 'Ratify Equal Pay Charter & Mandate Main Stadium Fixtures',
          description: 'Enact historic equal pay legislation and unlock global commercial sponsorship surge.',
          outcomeTitle: 'Historic Equal Pay Charter Ratified',
          outcomeText: 'You passed landmark equal pay legislation! Attendance shattered records and major international brands doubled sponsorship fees.',
          effects: { reputationDelta: 25, fanApprovalDelta: 30, scandalDelta: -20, agencyCashDelta: 10000000 }
        },
        {
          id: 'opt_equal_pay_phased',
          label: 'Implement 5-Year Phased Revenue-Linked Financial Growth Model',
          description: 'Link pay raises directly to ticket and broadcast revenue expansion.',
          outcomeTitle: 'Phased Revenue Growth Charter Passed',
          outcomeText: 'Approved a sustainable phased pay scaling model supported by club chairmen.',
          effects: { clubTrustDelta: 20, politicalInfluenceDelta: 12, reputationDelta: 10 }
        }
      ]
    },

    // 9. Ultra Crowd Rioting & Racist Abuse Stadium Closure
    {
      id: 'fed_scenario_racism_ultras',
      title: `Stadium Riot & Racist Fan Abuse Incident (${secondaryClub.name})`,
      category: 'fan_governance',
      severity: 'EMERGENCY',
      headline: `DISCIPLINARY HEARING: Ultras Infiltrate Pitch & Target Foreign Stars with Hate Speech during derby`,
      summary: `Riot police were deployed after ultra supporters stormed the pitch and shouted racist abuse at visiting players. The Disciplinary Committee demands total stadium closure or points deduction.`,
      involvedClubName: secondaryClub.name,
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_stadium_close',
          label: 'Order 5-Match Full Behind-Closed-Doors Ban & €500k Club Fine',
          description: 'Send a zero-tolerance global message against hate speech and stadium violence.',
          outcomeTitle: '5-Match Stadium Ban Executed',
          outcomeText: `You closed ${secondaryClub.name}'s stadium for 5 matches. Global football authorities heralded your decisive anti-racism leadership.`,
          effects: { reputationDelta: 22, scandalDelta: -25, fanApprovalDelta: 20, clubTrustDelta: -10 }
        },
        {
          id: 'opt_ultra_biometrics',
          label: 'Mandate Facial-Recognition Biometric Ticketing & Identify Individual Perpetrators',
          description: 'Avoid closing stadium to innocent fans by requiring state-of-the-art biometric turnstiles.',
          outcomeTitle: 'Biometric Security Directive Enacted',
          outcomeText: 'You mandated biometric fan identification, banning 45 convicted perpetrators for life while keeping turnstiles open.',
          effects: { reputationDelta: 15, politicalInfluenceDelta: 15, clubTrustDelta: 15 }
        }
      ]
    },

    // 10. Transnational Cross-Border League Merger Proposal
    {
      id: 'fed_scenario_cross_border',
      title: 'Transnational Regional League Merger Directive (Benelux / Atlantic League)',
      category: 'super_league',
      severity: 'HIGH',
      headline: 'COMMERCIAL EXPANSION: Neighboring Federations Seek Joint Cross-Border League Consolidation',
      summary: 'Smaller European federations propose merging their top-tier competitions into a single multi-nation league with €1.2 Billion combined TV rights.',
      requiredRoleMin: 'Continental President',
      options: [
        {
          id: 'opt_merger_approve',
          label: 'Approve Cross-Border Regional Super League & Secure €18M Dividend',
          description: 'Create a massive 18-club regional powerhouse league to challenge Europe’s top 5.',
          outcomeTitle: 'Transnational League Approved',
          outcomeText: 'You authorized the historic cross-border merger! TV rights soared 200% and secured €18,000,000 in executive continental bonuses.',
          effects: { agencyCashDelta: 18000000, politicalInfluenceDelta: 20, reputationDelta: 15 }
        },
        {
          id: 'opt_merger_veto',
          label: 'Veto Merger to Preserve Historic Domestic Pyramid & Relegation',
          description: 'Protect smaller provincial clubs who would be excluded from the merged top tier.',
          outcomeTitle: 'Domestic Pyramid Preserved',
          outcomeText: 'You blocked the merger, preserving 120 years of domestic football pyramid history.',
          effects: { fanApprovalDelta: 25, clubTrustDelta: 15, politicalInfluenceDelta: -10 }
        }
      ]
    },

    // 11. Mandatory Player Release Fee Cap & Buyout Clause Standardization
    {
      id: 'fed_scenario_buyout_caps',
      title: 'Mandatory Player Release Clause Standardization & Fee Transparency',
      category: 'agent_regulations',
      severity: 'HIGH',
      headline: 'LEAGUE STATUTE REVIEW: Proposing Mandatory Minimum Release Clauses for All Professional Contracts',
      summary: 'Clubs trap top talent with unrealistic €1 Billion release clauses. Player unions petition the federation for mandatory release clause formulas tied directly to annual salary.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_buyout_formula',
          label: 'Enact Mandatory 10x Annual Salary Release Clause Formula',
          description: 'Allow players to buy out contracts at fair market rates, revolutionizing player mobility.',
          outcomeTitle: 'Salary-Proportional Buyout Law Enacted',
          outcomeText: 'You passed proportional buyout legislation! Player transfers unlocked worldwide, generating huge agency commissions.',
          effects: { agencyCashDelta: 8000000, reputationDelta: 12, fanApprovalDelta: 15, clubTrustDelta: -10 }
        },
        {
          id: 'opt_buyout_freedom',
          label: 'Preserve Free-Market Contract Negotiation Autonomy',
          description: 'Maintain status quo allowing clubs and players to set buyout clauses freely.',
          outcomeTitle: 'Free Market Autonomy Upheld',
          outcomeText: 'Club directors praised your commitment to contractual stability.',
          effects: { clubTrustDelta: 20, politicalInfluenceDelta: 10 }
        }
      ]
    },

    // 12. Youth Academy Poaching & Minor Child Protection Hearing
    {
      id: 'fed_scenario_youth_poaching',
      title: 'Under-18 Academy Poaching & Illegal Minor Compensation Audit',
      category: 'youth_integrity',
      severity: 'CRITICAL',
      headline: 'FIFA ETHICS PETITION: Elite Club Alleged to Have Paid €500k Cash Under Table to Minor’s Parents',
      summary: 'A regional academy accuses a top-flight club of illegally luring a 14-year-old prodigy across international borders using unregistered family payments and housing favors.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_youth_ban_transfers',
          label: 'Impose 2-Window Transfer Ban & €2M Solidarity Fine on Offending Club',
          description: 'Protect minor development academies by strictly enforcing FIFA Article 19 child protection rules.',
          outcomeTitle: '2-Window Transfer Ban Imposed',
          outcomeText: 'You levied a strict 2-window transfer ban! Grassroots academies nationwide hailed your protection of youth development.',
          effects: { reputationDelta: 20, scandalDelta: -20, fanApprovalDelta: 20, clubTrustDelta: -10 }
        },
        {
          id: 'opt_youth_settlement',
          label: 'Broker €3M Academy Compensation Settlement & Training License',
          description: 'Resolve dispute by requiring the buying club to pay €3M directly into regional grassroots infrastructure.',
          outcomeTitle: '€3M Grassroots Settlement Brokered',
          outcomeText: 'Secured €3,000,000 for local youth academies while legalizing the prodigy’s transfer.',
          effects: { agencyCashDelta: 3000000, politicalInfluenceDelta: 12, clubTrustDelta: 10 }
        }
      ]
    },

    // 13. Foreign Player Import Quota vs Homegrown Player Mandates
    {
      id: 'fed_scenario_homegrown_quota',
      title: 'Homegrown Player Quota Mandate (6 Nationally Trained Players in Starting XI)',
      category: 'governance_ethics',
      severity: 'HIGH',
      headline: 'LEAGUE LAW PETITION: National Team Staff Demand 6-Homegrown Starter Requirement in Domestic Matches',
      summary: 'National team manager warns foreign player imports are choking domestic talent development. Proposes mandating at least 6 homegrown players in every matchday XI.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_homegrown_pass',
          label: 'Enact Strict 6-Homegrown Player Starting XI Law',
          description: 'Force top clubs to invest in domestic talent, boosting the national team pipeline.',
          outcomeTitle: 'Homegrown Quota Enacted',
          outcomeText: 'You passed the homegrown player quota! National team pipeline surged and domestic academy values skyrocketed.',
          effects: { reputationDelta: 16, fanApprovalDelta: 22, politicalInfluenceDelta: 10, clubTrustDelta: -12 }
        },
        {
          id: 'opt_homegrown_soft',
          label: 'Reject Hard Quota & Introduce Homegrown Academy Financial Tax Incentives',
          description: 'Reward clubs that play domestic academy graduates with FFP tax credits rather than forcing restrictions.',
          outcomeTitle: 'Homegrown Financial Incentive Scheme Passed',
          outcomeText: 'Passed financial incentive credits for academy graduates, winning praise from top club owners.',
          effects: { clubTrustDelta: 20, politicalInfluenceDelta: 12, reputationDelta: 8 }
        }
      ]
    },

    // 14. Broadcaster Bankruptcy & Emergency Direct Streaming Auction
    {
      id: 'fed_scenario_broadcaster_crash',
      title: 'Broadcaster Default & Emergency Direct-To-Consumer OTT Platform',
      category: 'broadcasting',
      severity: 'EMERGENCY',
      headline: 'FINANCIAL EMERGENCY: Main TV Rights Holder Enters Liquidation, Withholding €250M Rights Payment',
      summary: 'The league’s official TV network collapses into bankruptcy weeks before the season starts. Clubs face immediate insolvency unless broadcasting revenue is replaced.',
      requiredRoleMin: 'Federation Director',
      options: [
        {
          id: 'opt_broadcaster_ott',
          label: 'Launch Direct Federation OTT Streaming Service ("League Pass")',
          description: 'Bypass traditional networks and stream matches direct to global fans, taking full ownership of subscription profits.',
          outcomeTitle: 'Federation Streaming Service Launched',
          outcomeText: 'You launched the direct OTT platform! Reached 5 Million subscribers globally and generated €35,000,000 in direct revenue.',
          effects: { agencyCashDelta: 35000000, reputationDelta: 22, politicalInfluenceDelta: 20 }
        },
        {
          id: 'opt_broadcaster_tech_giant',
          label: 'Auction Exclusive Emergency Rights to Silicon Valley Tech Giant',
          description: 'Sell 3-year exclusive global streaming rights to Amazon/Apple/Google for an immediate cash advance.',
          outcomeTitle: 'Global Tech Rights Deal Closed',
          outcomeText: 'Closed an emergency €300M tech rights deal, saving all 20 top-flight clubs from wage default.',
          effects: { agencyCashDelta: 20000000, clubTrustDelta: 25, scandalDelta: -10 }
        }
      ]
    },

    // 15. Semi-Automated AI Offside & Hawk-Eye Laser Refinement
    {
      id: 'fed_scenario_ai_referee',
      title: 'Semi-Automated AI Offside & Fully Autonomous Whistle Trial',
      category: 'var_scandal',
      severity: 'HIGH',
      headline: 'INNOVATION HEARINGS: Testing Autonomous AI Offside Tracking to Eliminate Human VAR Delay',
      summary: 'Tech consortium offers to install 3D limb-tracking cameras in all league stadiums, reducing offside decision time from 3 minutes to 1.5 seconds.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_ai_offside_adopt',
          label: 'Full Adoption of 3D Limb-Tracking AI Offside Cameras',
          description: 'Pioneer ultra-fast automated offside technology across the entire competition.',
          outcomeTitle: '3D AI Offside Technology Adopted',
          outcomeText: 'You pioneered AI offside tracking! Match stoppage time dropped by 8 minutes and officiating accuracy reached 99.8%.',
          effects: { reputationDelta: 18, fanApprovalDelta: 25, scandalDelta: -15 }
        },
        {
          id: 'opt_ai_offside_reject',
          label: 'Reject AI Whistle & Keep Human Assistant Referees on Touchline',
          description: 'Preserve the human element and traditional refereeing craftsmanship.',
          outcomeTitle: 'Traditional Officiating Retained',
          outcomeText: 'You retained traditional touchline officials, earning praise from referee union veterans.',
          effects: { politicalInfluenceDelta: 10, clubTrustDelta: 5 }
        }
      ]
    },

    // 16. Winter Tournament Schedule Disruption & Club Compensation
    {
      id: 'fed_scenario_winter_schedule',
      title: 'Winter World Cup Mid-Season Disruption & Club Wage Compensation',
      category: 'national_team',
      severity: 'HIGH',
      headline: 'CALENDAR CONFLICT: 6-Week Winter World Cup Forces Domestic League Shutdown in November',
      summary: 'International tournament scheduling forces a 45-day stoppage during peak domestic season. Top clubs demand €60M in player insurance and wage compensation.',
      requiredRoleMin: 'Continental President',
      options: [
        {
          id: 'opt_winter_comp',
          label: 'Release €40M FIFA Club Benefits & Player Insurance Fund',
          description: 'Compensate domestic clubs for player injury risks and lost stadium ticket revenue.',
          outcomeTitle: '€40M FIFA Club Fund Distributed',
          outcomeText: 'Distributed €40,000,000 in club compensation funds, maintaining harmony between clubs and national team.',
          effects: { agencyCashDelta: 10000000, clubTrustDelta: 25, reputationDelta: 10 }
        },
        {
          id: 'opt_winter_condense',
          label: 'Mandate Condensed 3-Match Weekly Fixture Schedule',
          description: 'Force clubs to play mid-week fixtures to complete season on time without financial payouts.',
          outcomeTitle: 'Condensed Calendar Enforced',
          outcomeText: 'Enforced compressed match calendar, completing season deadline without extra tournament payouts.',
          effects: { politicalInfluenceDelta: 12, clubTrustDelta: -15, fanApprovalDelta: 5 }
        }
      ]
    },

    // 17. Ex-President Corruption Asset Seizure & Bribe Extradition
    {
      id: 'fed_scenario_ex_president_scandal',
      title: 'Former President Extradition & Asset Recovery Hearing',
      category: 'governance_ethics',
      severity: 'EMERGENCY',
      headline: 'FEDERAL INDICTMENT: Interpol Requests Seizure of €45M Hidden Off-Shore Bribe Accounts of Former Executive',
      summary: 'Swiss authorities uncover illegal offshore accounts linked to former federation officials who accepted kickbacks on TV contracts. Prosecutors petition to return funds to federation reserves.',
      requiredRoleMin: 'Continental President',
      options: [
        {
          id: 'opt_ex_seize',
          label: 'Full Legal Co-Operation & Repatriate €45M Seized Corruption Funds',
          description: 'Recover stolen money for federation youth academies and public transparency.',
          outcomeTitle: '€45M Stolen Corruption Funds Recovered',
          outcomeText: 'You fully co-operated with Interpol and successfully repatriated €45,000,000 into federation grassroots accounts!',
          effects: { agencyCashDelta: 25000000, reputationDelta: 30, scandalDelta: -30, fanApprovalDelta: 30 }
        },
        {
          id: 'opt_ex_hush',
          label: 'Pardon Former Officials in Exchange for Internal €15M Settlement',
          description: 'Avoid painful public trial details by accepting an executive out-of-court settlement.',
          outcomeTitle: 'Confidential Settlement Executed',
          outcomeText: 'Settled quietly and deposited €15,000,000 into executive discretionary accounts.',
          effects: { agencyCashDelta: 15000000, politicalInfluenceDelta: 10, scandalDelta: 15 }
        }
      ]
    },

    // 18. Annual 60-Match Player Workload Cap Directive
    {
      id: 'fed_scenario_player_workload',
      title: 'Mandatory 55-Match Annual Player Workload Cap Directive',
      category: 'governance_ethics',
      severity: 'CRITICAL',
      headline: 'FIFPRO PETITION: World Player Union Demands Binding 55-Match Cap to Prevent Chronic Fatigue',
      summary: 'Star players threaten strike action unless international and domestic matches are capped at 55 per calendar year with mandatory 3-week summer rest periods.',
      requiredRoleMin: 'Continental President',
      options: [
        {
          id: 'opt_workload_cap_pass',
          label: 'Enact Mandatory 55-Match Cap & Guarantee 3-Week Summer Rest Period',
          description: 'Prioritize player longevity and health, earning global union acclaim.',
          outcomeTitle: 'Mandatory 55-Match Rest Cap Passed',
          outcomeText: 'You passed landmark player workload protections! Injury rates plummeted and player union ratings reached 100%.',
          effects: { reputationDelta: 22, fanApprovalDelta: 25, scandalDelta: -15, clubTrustDelta: -10 }
        },
        {
          id: 'opt_workload_expand',
          label: 'Expand League to 24 Teams & Increase Expanded World Club Cup Slots',
          description: 'Maximize match broadcast inventory for revenue growth despite player fatigue concerns.',
          outcomeTitle: 'Expanded Tournament Calendar Approved',
          outcomeText: 'Approved expanded tournament calendar, boosting broadcasting rights sales by €40,000,000.',
          effects: { agencyCashDelta: 20000000, politicalInfluenceDelta: 18, fanApprovalDelta: -15 }
        }
      ]
    },

    // 19. Super Cup Abroad Hosting Bids (Saudi Arabia / Qatar / USA)
    {
      id: 'fed_scenario_super_cup_abroad',
      title: 'Domestic Super Cup Relocation Bidding War (Riyadh vs New York vs Doha)',
      category: 'broadcasting',
      severity: 'HIGH',
      headline: 'GLOBAL BIDDING WAR: Foreign Sovereign Promoters Offer €30M to Host Super Cup Final Overseas',
      summary: 'International sports agencies offer multi-million hosting fees to move the domestic 4-team Super Cup tournament to overseas neutral venues.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_super_cup_foreign',
          label: 'Accept €30M Foreign Hosting Contract in Middle East / USA',
          description: 'Export domestic Super Cup abroad for massive financial returns.',
          outcomeTitle: 'Super Cup Relocated Overseas',
          outcomeText: 'Signed a 4-year overseas hosting deal! Generated €30,000,000 in immediate tournament rights revenues.',
          effects: { agencyCashDelta: 15000000, politicalInfluenceDelta: 15, fanApprovalDelta: -15, clubTrustDelta: 15 }
        },
        {
          id: 'opt_super_cup_home',
          label: 'Keep Super Cup in Local Municipal Stadiums for Domestic Fans',
          description: 'Reject foreign commercial bids to preserve affordable match access for local fans.',
          outcomeTitle: 'Super Cup Kept at Home',
          outcomeText: 'You kept the Super Cup at home! Local fan associations celebrated your loyalty to traditional supporters.',
          effects: { fanApprovalDelta: 25, reputationDelta: 15, agencyCashDelta: 0 }
        }
      ]
    },

    // 20. Third-Party Player Ownership (TPO) Ban Enforcement
    {
      id: 'fed_scenario_tpo_ban',
      title: 'Third-Party Ownership (TPO) Shadow Investment Audit',
      category: 'agent_regulations',
      severity: 'CRITICAL',
      headline: 'INVESTIGATION: Private Investment Funds Found Holding 40% Economic Rights of 12 South American Stars',
      summary: 'Auditors uncover hidden offshore shell companies holding economic rights of players in violation of FIFA TPO bans. Offenders face disqualification.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_tpo_enforce',
          label: 'Enforce Total Zero-Tolerance TPO Ban & Nullify Secret Contracts',
          description: 'Eradicate third-party shadow ownership from domestic football.',
          outcomeTitle: 'TPO Shadow Ownership Eradicated',
          outcomeText: 'You banned third-party economic rights, restoring full player autonomy and FIFA regulatory compliance.',
          effects: { reputationDelta: 18, scandalDelta: -20, clubTrustDelta: 10 }
        },
        {
          id: 'opt_tpo_convert',
          label: 'Mandate Conversion of TPO Rights into Registered Agency Investment Funds',
          description: 'Regulate shadow investment by converting third-party shares into official licensed agent equity.',
          outcomeTitle: 'Agency Equity Conversion Authorized',
          outcomeText: 'Authorized equity conversion, bringing €12,000,000 in investment capital into licensed agency structures.',
          effects: { agencyCashDelta: 12000000, politicalInfluenceDelta: 10, scandalDelta: 10 }
        }
      ]
    },

    // 21. Relegation Playoff System Expansion Directive
    {
      id: 'fed_scenario_relegation_playoffs',
      title: 'Relegation Playoff System Reform (4-Team Super Playoff Series)',
      category: 'governance_ethics',
      severity: 'HIGH',
      headline: 'REFORM MOTION: Replace Automatic Relegation with High-Stakes 4-Team Survival Playoff',
      summary: 'Proposal to introduce a drama-filled relegation playoff series between 16th/17th of top flight and 3rd/4th of lower division to maximize TV viewership.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_playoffs_pass',
          label: 'Pass Relegation Super Playoff System & TV Broadcasting Package',
          description: 'Create high-stakes postseason drama generating €12M in extra broadcasting revenue.',
          outcomeTitle: 'Relegation Super Playoff Approved',
          outcomeText: 'You introduced the Relegation Super Playoff! Postseason ratings shattered records and generated €12,000,000 in broadcasting revenue.',
          effects: { agencyCashDelta: 8000000, fanApprovalDelta: 20, politicalInfluenceDelta: 12 }
        },
        {
          id: 'opt_playoffs_reject',
          label: 'Maintain Pure Automatic Relegation & Division Pyramid Integrity',
          description: 'Protect competitive purity of full 38-game league standings.',
          outcomeTitle: 'Automatic Relegation Upheld',
          outcomeText: 'Upheld traditional automatic relegation, praised by competitive football purists.',
          effects: { reputationDelta: 10, clubTrustDelta: 12 }
        }
      ]
    },

    // 22. Club Salary Cap & Luxury Tax Redistribution System
    {
      id: 'fed_scenario_salary_cap',
      title: '70% Revenue Salary Cap & Luxury Tax Redistribution Scheme',
      category: 'financial_insolvency',
      severity: 'CRITICAL',
      headline: 'FFP REGULATION: Implementing UEFA 70% Squad Cost Rule & Luxury Tax on Over-Spending Super Clubs',
      summary: 'Legislation requiring clubs to restrict squad wages to 70% of revenue. Any excess expenditure is subject to a 100% Luxury Tax redistributed to small clubs.',
      requiredRoleMin: 'Federation Director',
      options: [
        {
          id: 'opt_salary_tax_enforce',
          label: 'Enforce 70% Squad Cost Cap & Redistribute Luxury Tax Pool',
          description: 'Collect luxury taxes from mega-spending clubs and distribute €25M equally to lower division teams.',
          outcomeTitle: 'Luxury Tax Redistribution Enacted',
          outcomeText: 'Enforced 70% squad cost rules and redistributed €25,000,000 in luxury tax funds to small clubs, narrowing competitive parity.',
          effects: { reputationDelta: 20, clubTrustDelta: 25, scandalDelta: -15, fanApprovalDelta: 20 }
        },
        {
          id: 'opt_salary_tax_soften',
          label: 'Raise Cap to 85% & Grant Special Marquee Star Exemptions',
          description: 'Allow top clubs to exclude world-class star player wages from cap calculations.',
          outcomeTitle: 'Marquee Exemption Granted',
          outcomeText: 'Granted marquee player wage exemptions, allowing top clubs to sign world-class stars freely.',
          effects: { agencyCashDelta: 10000000, politicalInfluenceDelta: 15, clubTrustDelta: -10 }
        }
      ]
    },

    // 23. National Team Kit Manufacturing Contract Monopoly Review
    {
      id: 'fed_scenario_kit_monopoly',
      title: 'National Team Kit Supplier Tender & €150M Apparel Contract',
      category: 'governance_ethics',
      severity: 'HIGH',
      headline: 'APPAREL AUCTION: Global Sportswear Giants Bid €150M for 8-Year National Team Kit Rights',
      summary: 'Incumbent kit brand offers €100M extension while rival sportswear titan submits an aggressive €150M bid with 20% merchandise royalty kickbacks.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_kit_highest_bid',
          label: 'Award Contract to Highest Bidder (€150M + Royalties)',
          description: 'Maximize federation financial reserves for stadium infrastructure.',
          outcomeTitle: '€150M Kit Deal Signed',
          outcomeText: 'Signed a record €150,000,000 kit sponsorship contract! Federation coffers reached historic solvency levels.',
          effects: { agencyCashDelta: 15000000, reputationDelta: 15, politicalInfluenceDelta: 15 }
        },
        {
          id: 'opt_kit_domestic_brand',
          label: 'Choose Domestic Sportswear Brand for National Pride & Local Jobs',
          description: 'Support local manufacturing at a lower sponsorship fee rate.',
          outcomeTitle: 'Domestic Apparel Partnership Sealed',
          outcomeText: 'Partnered with a domestic brand, generating hundreds of local jobs and patriotic fan praise.',
          effects: { fanApprovalDelta: 25, reputationDelta: 12, politicalInfluenceDelta: 10 }
        }
      ]
    },

    // 24. Olympic U-23 Player Release Mandate vs European Clubs
    {
      id: 'fed_scenario_olympic_release',
      title: 'Olympic Games Player Release Mandate & Club Conflict',
      category: 'national_team',
      severity: 'HIGH',
      headline: 'SELECTION CLASH: Top European Clubs Refuse to Release Over-Age Stars for Summer Olympic Tournament',
      summary: 'Because the Olympic Football Tournament is not on the mandatory FIFA calendar, European clubs block stars from competing for gold medals. Players demand federation intervention.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_olympic_mandate',
          label: 'Pass Domestic Statute Mandating Club Release for Olympic Squad',
          description: 'Force domestic clubs to release eligible players for the Olympic national team.',
          outcomeTitle: 'Olympic Player Release Mandated',
          outcomeText: 'Mandated Olympic player release! National squad won the Olympic Gold Medal to overwhelming national celebration.',
          effects: { reputationDelta: 20, fanApprovalDelta: 28, politicalInfluenceDelta: 12, clubTrustDelta: -10 }
        },
        {
          id: 'opt_olympic_compromise',
          label: 'Limit Release to Maximum 1 Player Per Club & Grant Financial Bonus',
          description: 'Protect club pre-season preparation while securing key Olympic starters.',
          outcomeTitle: 'Olympic Release Compromise Sealed',
          outcomeText: 'Brokered a 1-player-per-club compromise, balancing Olympic dreams with club pre-season tours.',
          effects: { clubTrustDelta: 18, politicalInfluenceDelta: 10 }
        }
      ]
    },

    // 25. European Nations League Expansion & Continental Calendar Reform
    {
      id: 'fed_scenario_nations_league',
      title: 'Continental Nations League Quadrennial Expansion Directive',
      category: 'national_team',
      severity: 'HIGH',
      headline: 'TOURNAMENT REFORM: Replacing Friendly Matches with 32-Nation Expanded Nations League',
      summary: 'Continental executive board proposes eliminating meaningless international friendly matches in favor of a competitive promotion/relegation Nations League format.',
      requiredRoleMin: 'Continental President',
      options: [
        {
          id: 'opt_nl_approve',
          label: 'Approve Expanded Nations League & Secure €20M Broadcasting Dividend',
          description: 'Transform international windows into competitive, high-yield broadcasting spectacles.',
          outcomeTitle: 'Expanded Nations League Approved',
          outcomeText: 'Approved the Nations League format! TV viewership doubled and generated €20,000,000 in executive continental revenue.',
          effects: { agencyCashDelta: 20000000, politicalInfluenceDelta: 20, reputationDelta: 15 }
        },
        {
          id: 'opt_nl_reject',
          label: 'Protect Domestic Cup Schedule & International Friendlies Flexibility',
          description: 'Maintain open international calendar slots for worldwide exhibition matches.',
          outcomeTitle: 'Friendly Match Flexibility Preserved',
          outcomeText: 'Preserved friendly match flexibility, allowing national team to schedule lucrative global tours.',
          effects: { politicalInfluenceDelta: 10, fanApprovalDelta: 5 }
        }
      ]
    },

    // 26. Transfer Window Deadline Day Extension Hearing
    {
      id: 'fed_scenario_deadline_day',
      title: 'Deadline Day IT System Glitch & 24-Hour Transfer Window Extension',
      category: 'governance_ethics',
      severity: 'HIGH',
      headline: 'SYSTEM CRASH: FIFA Transfer Matching System (TMS) Fails at 11:00 PM Deadline, Blocking €140M Deals',
      summary: 'Central server crash at midnight leaves 8 major transfer contracts unsubmitted. Clubs petition for an emergency 24-hour deadline extension.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_deadline_extend',
          label: 'Grant Emergency 24-Hour TMS Deadline Extension',
          description: 'Allow pending transfer paperwork to complete, saving €140M in star player moves.',
          outcomeTitle: '24-Hour Window Extension Granted',
          outcomeText: 'You granted an emergency 24-hour extension! All 8 pending star transfers went through smoothly (+15 Agency Commission).',
          effects: { agencyCashDelta: 6000000, clubTrustDelta: 22, fanApprovalDelta: 18 }
        },
        {
          id: 'opt_deadline_strict',
          label: 'Uphold Strict Midnight Deadline & Reject Incomplete Registrations',
          description: 'Enforce strict deadline integrity regardless of technical glitches.',
          outcomeTitle: 'Strict Midnight Deadline Upheld',
          outcomeText: 'Upheld strict midnight cutoff, reinforcing uncompromising administrative discipline.',
          effects: { reputationDelta: 12, scandalDelta: -10, clubTrustDelta: -15 }
        }
      ]
    },

    // 27. Autonomous AI VAR Line-Call Transparency Directive
    {
      id: 'fed_scenario_var_audio',
      title: 'Live Stadium Broadcast of VAR Referee Microphones & Audio Feeds',
      category: 'var_scandal',
      severity: 'HIGH',
      headline: 'TRANSPARENCY MOTION: Mandating Live In-Stadium Audio Broadcasts of VAR Referee Conversations',
      summary: 'Broadcasters and fan groups demand that VAR audio discussions between referee and video room be broadcast live over TV and stadium loudspeakers.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_var_audio_live',
          label: 'Approve Live In-Stadium & TV VAR Referee Audio Broadcasts',
          description: 'Pioneer complete officiating transparency for fans in the stadium and at home.',
          outcomeTitle: 'Live VAR Mic Broadcasts Enacted',
          outcomeText: 'You authorized live VAR audio broadcasts! Officiating transparency surged and controversial referee abuse dropped 50%.',
          effects: { reputationDelta: 22, fanApprovalDelta: 30, scandalDelta: -20 }
        },
        {
          id: 'opt_var_audio_post_match',
          label: 'Release Audio Post-Match Only in Weekly Executive Review Shows',
          description: 'Protect referees from instant crowd backlash while providing weekly educational breakdowns.',
          outcomeTitle: 'Weekly Post-Match Audio Review Adopted',
          outcomeText: 'Adopted weekly post-match audio breakdowns, striking a balance between transparency and referee protection.',
          effects: { politicalInfluenceDelta: 10, clubTrustDelta: 12 }
        }
      ]
    },

    // 28. Retired Legends Pension & Benevolent Player Endowment Fund
    {
      id: 'fed_scenario_legends_pension',
      title: 'Retired Player Healthcare & Pension Endowment Fund Directive',
      category: 'governance_ethics',
      severity: 'HIGH',
      headline: 'BENEVOLENT HEARINGS: Establishing Permanent Pension & Medical Fund for Indigent Ex-Players',
      summary: 'Dozens of retired former legends face severe medical hardship and poverty due to lack of health coverage from early era contracts. Proposing 1% ticket tax for player pensions.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_pension_fund_pass',
          label: 'Enact 1% Match Ticket Tax & Establish €20M Legends Pension Fund',
          description: 'Provide lifetime medical care and dignifying pensions for retired football veterans.',
          outcomeTitle: 'Legends Pension & Healthcare Fund Established',
          outcomeText: 'You established the Legends Healthcare Fund! Thousands of retired players received dignity, pensions, and medical coverage.',
          effects: { reputationDelta: 25, fanApprovalDelta: 30, scandalDelta: -15, agencyCashDelta: 5000000 }
        },
        {
          id: 'opt_pension_fund_voluntary',
          label: 'Encourage Voluntary Corporate Donations & Charity Match Series',
          description: 'Host annual legends charity exhibition matches without levying extra ticket taxes.',
          outcomeTitle: 'Annual Legends Charity Series Launched',
          outcomeText: 'Launched the Annual Legends Exhibition Series, raising millions for veteran player care.',
          effects: { fanApprovalDelta: 18, reputationDelta: 12 }
        }
      ]
    },

    // 29. Transnational Anti-Corruption Ethics Committee Powers
    {
      id: 'fed_scenario_ethics_committee',
      title: 'Independent Judicial Ethics Committee & Subpoena Power Expansion',
      category: 'governance_ethics',
      severity: 'CRITICAL',
      headline: 'CONSTITUTIONAL REFORM: Granting Independent Ethics Body Direct Financial Subpoena Powers',
      summary: 'Proposing granting the Ethics Committee full authority to audit private bank accounts of federation officials and club owners to eliminate bribery.',
      requiredRoleMin: 'Continental President',
      options: [
        {
          id: 'opt_ethics_full_power',
          label: 'Grant Unrestricted Independent Subpoena & Bank Audit Powers',
          description: 'Eradicate governance corruption completely with total financial transparency.',
          outcomeTitle: 'Unrestricted Ethics Oversight Enacted',
          outcomeText: 'You granted full judicial audit powers! International transparency indexes rated your federation #1 in sports governance.',
          effects: { reputationDelta: 30, scandalDelta: -35, fanApprovalDelta: 25, politicalInfluenceDelta: -10 }
        },
        {
          id: 'opt_ethics_restricted',
          label: 'Restrict Audits to Internal Federation Books & Protect Private Executive Banking',
          description: 'Maintain executive privacy while ensuring official federation accounts remain clean.',
          outcomeTitle: 'Internal Audit Oversight Approved',
          outcomeText: 'Approved internal audit safeguards while preserving executive financial privacy.',
          effects: { politicalInfluenceDelta: 15, clubTrustDelta: 10 }
        }
      ]
    },

    // 30. FIFA Presidential Global Football Development Fund Directive
    {
      id: 'fed_scenario_fifa_global_fund',
      title: 'FIFA €500M Global Football Development & Pitch Distribution Plan',
      category: 'infrastructure',
      severity: 'EMERGENCY',
      headline: 'GLOBAL DEVELOPMENT: Allocating €500M Development Grants across 211 Member Associations',
      summary: 'As FIFA President, you preside over the allocation of €500,000,000 in global FIFA Forward development funds to build 1,000 artificial pitches and youth academies worldwide.',
      requiredRoleMin: 'FIFA Global President',
      options: [
        {
          id: 'opt_fifa_fund_equitable',
          label: 'Distribute €500M Equitably Across All 211 Nations with Strict Independent Audits',
          description: 'Ensure developing football nations receive equal funding for youth academies and pitches.',
          outcomeTitle: 'Global Pitch & Youth Infrastructure Fund Unlocked',
          outcomeText: 'You unlocked €500,000,000 for worldwide grassroots development! Built 1,000 pitches globally and cemented a legendary presidential legacy.',
          effects: { reputationDelta: 35, fanApprovalDelta: 35, scandalDelta: -25, politicalInfluenceDelta: 30, agencyCashDelta: 50000000 }
        },
        {
          id: 'opt_fifa_fund_strategic',
          label: 'Focus Funding on High-Population Emerging Markets (India, USA, China, Nigeria)',
          description: 'Prioritize massive commercial growth markets to maximize future broadcast revenue.',
          outcomeTitle: 'Emerging Market Development Package Approved',
          outcomeText: 'Directed funds into major emerging markets, unlocking multi-billion dollar broadcasting expansion across Asia and North America.',
          effects: { agencyCashDelta: 75000000, politicalInfluenceDelta: 25, reputationDelta: 20 }
        }
      ]
    },

    // --- 30 ADDITIONAL SCENARIOS (31 through 60) ---

    // 31. Private Equity League Equity Buyout Proposal
    {
      id: 'fed_scenario_private_equity',
      title: 'Private Equity 10% Commercial Media Stake Buyout Proposal',
      category: 'broadcasting',
      severity: 'CRITICAL',
      headline: 'WALL STREET BID: Global Investment Consortium Offers €2.0 Billion Cash Injection for 10% Media Rights Stake',
      summary: 'A major private equity firm offers an immediate €2,000,000,000 cash injection in exchange for a perpetual 10% share of all future league media and broadcasting profits.',
      requiredRoleMin: 'Federation Director',
      options: [
        {
          id: 'opt_pe_accept',
          label: 'Accept €2.0B Private Equity Cash Injection & Distribute Club Grants',
          description: 'Provide immediate capital to build modern club stadiums and clear pandemic debts.',
          outcomeTitle: '€2.0 Billion Private Equity Deal Executed',
          outcomeText: 'You accepted the private equity deal! Provided €80M to each top-flight club for infrastructure and collected €40,000,000 in executive commission fees.',
          effects: { agencyCashDelta: 40000000, clubTrustDelta: 30, politicalInfluenceDelta: 20, fanApprovalDelta: -10 }
        },
        {
          id: 'opt_pe_reject',
          label: 'Reject Private Equity & Retain 100% Perpetual Media Rights Ownership',
          description: 'Protect long-term broadcasting independence and avoid giving Wall Street equity control.',
          outcomeTitle: 'Full Broadcast Independence Retained',
          outcomeText: 'You rejected the buyout, ensuring 100% of future broadcasting revenues remain with domestic clubs forever.',
          effects: { reputationDelta: 25, fanApprovalDelta: 25, scandalDelta: -15, clubTrustDelta: -10 }
        }
      ]
    },

    // 32. Champions League Expanded Swiss-Model Format Dispute
    {
      id: 'fed_scenario_swiss_model',
      title: 'Continental Expanded 36-Team Swiss-Model League Phase Reform',
      category: 'super_league',
      severity: 'HIGH',
      headline: 'CONTINENTAL EXPANSION: Replacing Group Stages with 36-Team Unified Swiss-System Standings',
      summary: 'The continental executive committee proposes replacing 4-team groups with a 36-team single league phase featuring 8 guaranteed matches per team.',
      requiredRoleMin: 'Continental President',
      options: [
        {
          id: 'opt_swiss_model_approve',
          label: 'Approve 36-Team Swiss Model & Secure €30M Continental Bonus Pool',
          description: 'Maximize blockbuster heavyweight European fixtures and quadruple TV rights revenue.',
          outcomeTitle: '36-Team Swiss-System Approved',
          outcomeText: 'You ratified the Swiss-model format! Broadcasting revenues spiked 45% and unlocked €30,000,000 in continental bonus pools.',
          effects: { agencyCashDelta: 30000000, politicalInfluenceDelta: 22, reputationDelta: 15 }
        },
        {
          id: 'opt_swiss_model_protect_domestic',
          label: 'Protect Domestic Calendar & Cap Continental Group Matches at 6',
          description: 'Defend domestic cup competitions and preserve player rest days.',
          outcomeTitle: 'Domestic Cup Priority Preserved',
          outcomeText: 'You protected domestic fixtures, maintaining the traditional calendar and earning praise from domestic league chairmen.',
          effects: { clubTrustDelta: 25, fanApprovalDelta: 20, politicalInfluenceDelta: -10 }
        }
      ]
    },

    // 33. National Team Manager Crisis & Emergency Hiring
    {
      id: 'fed_scenario_manager_crisis',
      title: 'National Team Head Coach Dismissal & Emergency Interim Appointment',
      category: 'national_team',
      severity: 'EMERGENCY',
      headline: 'NATIONAL CRISIS: Head Coach Dismissed Following Shock 4-0 Loss; World Cup Qualification at Risk',
      summary: 'Following a disastrous home defeat, public clamor forces the immediate termination of the national team manager 3 weeks before crucial international playoffs.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_manager_hire_legend',
          label: 'Hire World-Class European Champion Manager on €8M Annual Salary',
          description: 'Appoint a proven elite manager to guarantee World Cup qualification success.',
          outcomeTitle: 'Elite European Manager Appointed',
          outcomeText: 'You appointed a legendary Champions League winner! Fan confidence surged and the national team won both playoff matches comfortably.',
          effects: { reputationDelta: 25, fanApprovalDelta: 35, agencyCashDelta: -8000000, politicalInfluenceDelta: 15 }
        },
        {
          id: 'opt_manager_hire_domestic',
          label: 'Promote Homegrown Under-21 Coach & Invest Savings in Grassroots',
          description: 'Show faith in local coaching talent while saving millions in salary costs.',
          outcomeTitle: 'Homegrown Under-21 Manager Promoted',
          outcomeText: 'Promoted the local U-21 coach who successfully led a vibrant young squad to World Cup qualification!',
          effects: { reputationDelta: 18, fanApprovalDelta: 20, agencyCashDelta: 4000000, clubTrustDelta: 15 }
        }
      ]
    },

    // 34. Fan Ownership Protection & 50+1 Governance Rule
    {
      id: 'fed_scenario_fifty_plus_one',
      title: 'Constitutional Enforcement of 50+1 Fan Ownership Protection Law',
      category: 'fan_governance',
      severity: 'CRITICAL',
      headline: 'GOVERNANCE WAR: Billionaire Investors Challenge Legality of 50+1 Fan Voting Rights Rule in High Court',
      summary: 'Foreign consortiums file lawsuits to overturn the 50+1 rule which guarantees club supporters hold 50% plus one vote of voting shares in professional clubs.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_fifty_one_protect',
          label: 'Enact Absolute 50+1 Constitutional Shield & Defend Rule in High Court',
          description: 'Protect supporters from hostile corporate buyouts and preserve club heritage.',
          outcomeTitle: '50+1 Fan Ownership Protected',
          outcomeText: 'You successfully defended the 50+1 rule in High Court! Fan associations hailed you as a hero of democratic football governance.',
          effects: { reputationDelta: 30, fanApprovalDelta: 40, scandalDelta: -25, clubTrustDelta: -10 }
        },
        {
          id: 'opt_fifty_one_liberalize',
          label: 'Abolish 50+1 Rule to Attract Multi-Billion Overseas Investors',
          description: 'Allow 100% private ownership to enable domestic clubs to compete with state-backed mega-teams.',
          outcomeTitle: 'Club Ownership Liberalized',
          outcomeText: 'Abolished 50+1 restrictions, bringing €1.5 Billion in private investment into top-flight clubs.',
          effects: { agencyCashDelta: 20000000, politicalInfluenceDelta: 20, fanApprovalDelta: -30, clubTrustDelta: 25 }
        }
      ]
    },

    // 35. Anti-Piracy Illegal Streaming Crackdown Directive
    {
      id: 'fed_scenario_piracy_crackdown',
      title: 'Global Illegal IPTV Streaming Crackdown & Domain Seizure Decree',
      category: 'broadcasting',
      severity: 'HIGH',
      headline: 'CYBER ENFORCEMENT: Illegal Broadcast Streams Cause Estimated €180M Annual Loss in Media Rights',
      summary: 'Broadcasting partners threaten to cut contract payouts unless the federation coordinates with federal police to shut down illegal IPTV piracy networks.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_piracy_block',
          label: 'Fund Federal Cyber-Unit Real-Time IP Blocking & Dynamic Domain Seizures',
          description: 'Shut down illegal streams during live matches to protect broadcast rights value.',
          outcomeTitle: 'Real-Time Dynamic IP Blocking Launched',
          outcomeText: 'You launched real-time IP blocking! Piracy reduced by 85% and TV networks paid an additional €20M performance bonus.',
          effects: { agencyCashDelta: 20000000, reputationDelta: 18, clubTrustDelta: 20, scandalDelta: -10 }
        },
        {
          id: 'opt_piracy_cheap_ott',
          label: 'Lower Official Subscription Prices & Launch Affordable Micro-Passes',
          description: 'Undercut piracy by making official broadcasts affordable for everyday working fans.',
          outcomeTitle: 'Affordable Fan Micro-Passes Introduced',
          outcomeText: 'Lowered subscription prices, converting 2 Million illegal viewers into paying official subscribers!',
          effects: { fanApprovalDelta: 30, reputationDelta: 20, politicalInfluenceDelta: 12 }
        }
      ]
    },

    // 36. Carbon-Neutral Stadium Mandate & Green Transition
    {
      id: 'fed_scenario_green_stadiums',
      title: 'Mandatory Net-Zero Carbon Stadium & Solar Power Initiative',
      category: 'infrastructure',
      severity: 'HIGH',
      headline: 'SUSTAINABILITY CHARTER: Mandating Solar Roofs & Zero Single-Use Plastics by 2028',
      summary: 'Environmental charter proposing requiring all 1st and 2nd division stadiums to install solar panels, rainwater recycling, and electric transit shuttles.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_green_mandate',
          label: 'Pass Mandatory Net-Zero Stadium Standard & Allocate €10M Green Grant',
          description: 'Pioneer environmental sustainability in global sports stadium infrastructure.',
          outcomeTitle: 'Net-Zero Stadium Charter Ratified',
          outcomeText: 'You passed the Green Stadium Charter! League won United Nations Sports for Climate Action recognition.',
          effects: { reputationDelta: 25, fanApprovalDelta: 25, agencyCashDelta: -2000000, politicalInfluenceDelta: 15 }
        },
        {
          id: 'opt_green_voluntary',
          label: 'Encourage Voluntary Green Upgrades with Local Tax Exemption Credits',
          description: 'Allow clubs to transition at their own pace with tax incentive support.',
          outcomeTitle: 'Voluntary Green Incentive Plan Passed',
          outcomeText: 'Passed voluntary incentive credits, earning praise from club infrastructure directors.',
          effects: { clubTrustDelta: 18, politicalInfluenceDelta: 10 }
        }
      ]
    },

    // 37. Concussion & Temporary Head Injury Substitution Rule
    {
      id: 'fed_scenario_concussion_rule',
      title: 'Permanent Concussion Substitution & Independent Pitchside Neurologist Mandate',
      category: 'governance_ethics',
      severity: 'CRITICAL',
      headline: 'PLAYER HEALTH EMERGENCY: Medical Panel Demands Independent Neurologists & Extra Concussion Subs',
      summary: 'Following serious head collision incidents, medical experts petition for mandatory independent neurologists on the touchline empowered to pull concussed players off the pitch.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_concussion_independent',
          label: 'Mandate Independent Pitchside Doctors & 2 Extra Concussion Substitutions',
          description: 'Remove head injury evaluation authority from club coaches to protect player brain safety.',
          outcomeTitle: 'Independent Neurologist Protection Enacted',
          outcomeText: 'You mandated independent concussion evaluations! Player unions and medical associations lauded your life-saving medical leadership.',
          effects: { reputationDelta: 25, fanApprovalDelta: 25, scandalDelta: -20, clubTrustDelta: 10 }
        },
        {
          id: 'opt_concussion_club_doc',
          label: 'Retain Club Medical Staff Discretion with 3-Minute Assessment Stoppage',
          description: 'Allow team physicians to make final return-to-play decisions.',
          outcomeTitle: 'Club Physician Discretion Retained',
          outcomeText: 'Retained club physician authority with mandatory 3-minute diagnostic stoppages.',
          effects: { clubTrustDelta: 15, politicalInfluenceDelta: 8 }
        }
      ]
    },

    // 38. Women’s World Cup Prize Money Parity Guarantee
    {
      id: 'fed_scenario_womens_prize_parity',
      title: 'Women’s World Cup Prize Pool Equalization Directive (€110M Guarantee)',
      category: 'national_team',
      severity: 'EMERGENCY',
      headline: 'HISTORIC EQUALITY MOTION: Matching Women’s World Cup Prize Money to Men’s Tournament Standard',
      summary: 'FIFA executive motion to increase Women’s World Cup prize pool to €110,000,000, ensuring direct payout distribution into participating women players’ personal accounts.',
      requiredRoleMin: 'FIFA Global President',
      options: [
        {
          id: 'opt_prize_parity_approve',
          label: 'Enact 100% Equal Prize Pool & Guarantee Direct Player Payout System',
          description: 'Set a global precedent by guaranteeing equal prize money and bypassing intermediary accounts.',
          outcomeTitle: '100% World Cup Prize Parity Ratified',
          outcomeText: 'You enacted 100% prize money parity! Over 700 international players received direct equal payouts, triggering global celebration.',
          effects: { reputationDelta: 35, fanApprovalDelta: 40, scandalDelta: -30, politicalInfluenceDelta: 25, agencyCashDelta: 25000000 }
        },
        {
          id: 'opt_prize_parity_phased',
          label: 'Implement 3-Cycle Phased Equalization Linked to Commercial TV Bids',
          description: 'Tie prize money increases to standalone broadcasting rights growth.',
          outcomeTitle: 'Phased Prize Equalization Model Passed',
          outcomeText: 'Passed a commercially-backed prize scaling roadmap, doubling payouts for the upcoming cycle.',
          effects: { agencyCashDelta: 15000000, politicalInfluenceDelta: 15, reputationDelta: 15 }
        }
      ]
    },

    // 39. Historic Stadium Naming Rights & Heritage Protection
    {
      id: 'fed_scenario_stadium_naming',
      title: 'Historical Stadium Naming Rights Preservation vs Corporate Commercial Sale',
      category: 'fan_governance',
      severity: 'HIGH',
      headline: 'HERITAGE DISPUTE: Club Sells 100-Year-Old Stadium Name to Crypto Exchange for €15M/Yr',
      summary: 'A traditional club renames its iconic, historic stadium after a volatile cryptocurrency exchange. Outraged supporters petition the federation to block commercial name wiping.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_stadium_name_protect',
          label: 'Pass Heritage Protection By-Law Requiring Dual Historic Stadium Names',
          description: 'Mandate preserving the traditional stadium name alongside any commercial sponsor title.',
          outcomeTitle: 'Stadium Heritage Protection By-Law Passed',
          outcomeText: 'You passed stadium heritage protections! Preserved legendary stadium names across the league while allowing secondary sponsor titles.',
          effects: { reputationDelta: 20, fanApprovalDelta: 30, scandalDelta: -10, clubTrustDelta: 5 }
        },
        {
          id: 'opt_stadium_name_commercial',
          label: 'Allow Total Commercial Naming Freedom to Maximize Club Revenue',
          description: 'Enable clubs to sell naming rights freely to stay competitive financially.',
          outcomeTitle: 'Full Commercial Naming Freedom Upheld',
          outcomeText: 'Upheld commercial freedom, allowing clubs to inject €15M annually in stadium naming rights revenue.',
          effects: { clubTrustDelta: 20, politicalInfluenceDelta: 12, fanApprovalDelta: -15 }
        }
      ]
    },

    // 40. Continental U-21 Championship Expansion & Talent Showcase
    {
      id: 'fed_scenario_u21_expansion',
      title: 'Continental Under-21 Championship 24-Nation Format Expansion',
      category: 'youth_integrity',
      severity: 'HIGH',
      headline: 'YOUTH FOOTBALL EXPANSION: Expanding Continental U-21 Tournament from 16 to 24 Teams',
      summary: 'Proposal to expand the Under-21 European Championship to 24 qualified nations, giving 200+ emerging young talents international tournament exposure.',
      requiredRoleMin: 'Continental President',
      options: [
        {
          id: 'opt_u21_expand_yes',
          label: 'Approve 24-Nation U-21 Expansion & Direct €12M Talent Grant',
          description: 'Double youth international opportunities and attract global scouting networks.',
          outcomeTitle: '24-Nation U-21 Tournament Expansion Passed',
          outcomeText: 'You expanded the U-21 Championship! Scout attendance broke records and 50 youth players earned big-league transfers.',
          effects: { agencyCashDelta: 12000000, reputationDelta: 20, fanApprovalDelta: 20, politicalInfluenceDelta: 15 }
        },
        {
          id: 'opt_u21_keep_16',
          label: 'Maintain Elite 16-Team Format for Maximum Competitive Intensity',
          description: 'Keep the tournament ultra-competitive and avoid fixture congestion for top youth stars.',
          outcomeTitle: 'Elite 16-Team Format Retained',
          outcomeText: 'Retained elite 16-team format, maintaining the highest concentration of youth football talent.',
          effects: { reputationDelta: 10, clubTrustDelta: 12 }
        }
      ]
    },

    // 41. Away Fan Ticket Price Cap Directive (€30 Cap)
    {
      id: 'fed_scenario_away_ticket_cap',
      title: 'Binding Away Fan Ticket Price Cap Directive (€30 Limit)',
      category: 'fan_governance',
      severity: 'HIGH',
      headline: 'FAN ADVOCACY MOTION: Capping Away Match Ticket Prices at €30 Across All Divisions',
      summary: 'Supporters trust petitions for a binding €30 cap on away tickets to stop host clubs from gouging traveling fans with €90 ticket prices for marquee fixtures.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_away_cap_enforce',
          label: 'Pass Mandatory €30 Away Fan Ticket Cap Across Entire League',
          description: 'Protect traveling matchday fans and ensure vibrant away-end atmosphere in every stadium.',
          outcomeTitle: '€30 Away Ticket Cap Enacted',
          outcomeText: 'You enacted the €30 away ticket cap! Traveling fan attendances reached historic highs and away ends roared in full capacity.',
          effects: { reputationDelta: 22, fanApprovalDelta: 35, scandalDelta: -10, clubTrustDelta: -8 }
        },
        {
          id: 'opt_away_cap_soft',
          label: 'Recommend Voluntary €45 Ceiling with Travel Subsidy Vouchers',
          description: 'Provide travel subsidies while allowing host clubs flexibility on premium seats.',
          outcomeTitle: 'Voluntary Travel Subsidy Scheme Passed',
          outcomeText: 'Passed travel subsidy vouchers for registered supporter clubs.',
          effects: { clubTrustDelta: 15, fanApprovalDelta: 15 }
        }
      ]
    },

    // 42. Referee Professionalization & Full-Time Premier Referee Contracts
    {
      id: 'fed_scenario_referee_pro',
      title: 'Full-Time Professional Referee Salary Scheme & Mental Health Care',
      category: 'referee_corruption',
      severity: 'HIGH',
      headline: 'OFFICIATING REFORM: Transforming Part-Time Referees into Salaried €180k Elite Officials',
      summary: 'To combat referee bribery vulnerabilities and decision errors, the referee association proposes establishing full-time €180,000 professional referee contracts with mandatory sport psychology support.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_ref_pro_contracts',
          label: 'Establish Full-Time €180k Professional Referee Cadre & Performance Audits',
          description: 'Elevate officiating standards, independence, and accountability across top tiers.',
          outcomeTitle: 'Professional Referee Cadre Established',
          outcomeText: 'You professionalized the officiating corps! Referee error rates dropped 40% and corruption vulnerabilities were eliminated.',
          effects: { reputationDelta: 25, fanApprovalDelta: 25, scandalDelta: -25, agencyCashDelta: -2000000 }
        },
        {
          id: 'opt_ref_pro_bonus',
          label: 'Retain Part-Time Structure with €1,500 Match-Fee Performance Bonuses',
          description: 'Increase match fees without adding permanent pension and salary overhead.',
          outcomeTitle: 'Match-Fee Performance Bonuses Enacted',
          outcomeText: 'Enacted match-fee bonuses for top-rated weekend officiating performances.',
          effects: { clubTrustDelta: 12, politicalInfluenceDelta: 8 }
        }
      ]
    },

    // 43. National Team Shirt Sponsorship Commercial Rights Unlocking
    {
      id: 'fed_scenario_national_shirt_sponsor',
      title: 'National Team Training Kit Commercial Sponsorship Auction',
      category: 'national_team',
      severity: 'HIGH',
      headline: 'COMMERCIAL BID: Airline Offers €25M/Yr for Exclusive National Team Training Shirt Branding',
      summary: 'Global airline bids €25,000,000 annually to place its logo on national team warm-up gear and training press backdrops.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_shirt_sponsor_accept',
          label: 'Accept €25M Training Kit Commercial Deal & Fund Grassroots Facilities',
          description: 'Monetize national team training wear to generate millions for local pitch development.',
          outcomeTitle: '€25M Training Kit Commercial Sponsorship Signed',
          outcomeText: 'You signed the training kit sponsorship! Generated €25,000,000 annually to fund grassroots pitches across every province.',
          effects: { agencyCashDelta: 15000000, reputationDelta: 15, politicalInfluenceDelta: 15 }
        },
        {
          id: 'opt_shirt_sponsor_clean',
          label: 'Keep National Kit 100% Free of Commercial Advertisements',
          description: 'Preserve the sacred, unblemished clean look of the national jersey.',
          outcomeTitle: 'Clean Unadvertised Jersey Preserved',
          outcomeText: 'You preserved the clean national shirt identity, earning deep respect for patriotic sports traditions.',
          effects: { fanApprovalDelta: 25, reputationDelta: 18 }
        }
      ]
    },

    // 44. Video Assistant Referee (VAR) Managerial Challenge System Trial
    {
      id: 'fed_scenario_var_challenges',
      title: 'Managerial VAR Challenge System Trial (2 Challenges Per Team)',
      category: 'var_scandal',
      severity: 'HIGH',
      headline: 'RULE TRIAL: Testing Head-Coach VAR Review Challenges to Eliminate Constant Video Stoppages',
      summary: 'Proposal to replace continuous background VAR checks with a Tennis/NFL style challenge system: managers get 2 review challenges per match.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_var_challenge_adopt',
          label: 'Adopt Managerial VAR Challenge System & Stop Unsolicited Video Replays',
          description: 'Put review power in managers’ hands and reduce VAR match interruptions by 60%.',
          outcomeTitle: 'Managerial VAR Challenge System Adopted',
          outcomeText: 'You adopted managerial VAR challenges! Match pace accelerated dynamically and fans celebrated the reduction in constant video stoppages.',
          effects: { reputationDelta: 20, fanApprovalDelta: 30, scandalDelta: -15 }
        },
        {
          id: 'opt_var_challenge_keep_var',
          label: 'Retain Centralized VAR Room Auto-Review Protocol',
          description: 'Ensure every potential goal, penalty, and red card is thoroughly checked by video referees.',
          outcomeTitle: 'Centralized VAR Auto-Review Retained',
          outcomeText: 'Retained automatic VAR checks, prioritizing maximum objective decision accuracy.',
          effects: { politicalInfluenceDelta: 10, clubTrustDelta: 10 }
        }
      ]
    },

    // 45. Expanded 32-Team FIFA Club World Cup Revenue Split
    {
      id: 'fed_scenario_club_world_cup',
      title: '32-Team FIFA Club World Cup Revenue Distribution & Solidarity Tax',
      category: 'super_league',
      severity: 'CRITICAL',
      headline: 'GLOBAL TOURNAMENT: €2.5 Billion Revenue Distribution for Inaugural 32-Team Club World Cup',
      summary: 'As FIFA President, you oversee the distribution of €2,500,000,000 in prize money for the expanded quadrennial Club World Cup, with qualified mega-clubs demanding 80% of funds.',
      requiredRoleMin: 'FIFA Global President',
      options: [
        {
          id: 'opt_cwc_solidarity_tax',
          label: 'Levy 25% Solidarity Tax on Mega-Clubs & Distribute €625M to Non-Qualified Clubs',
          description: 'Prevent the Club World Cup from widening the wealth gap between elite and domestic clubs.',
          outcomeTitle: '€625M Global Solidarity Redistribution Enacted',
          outcomeText: 'You enacted a 25% solidarity redistribution tax! Over 1,500 non-participating clubs worldwide received life-saving financial development funds.',
          effects: { reputationDelta: 35, fanApprovalDelta: 35, scandalDelta: -25, politicalInfluenceDelta: 30, agencyCashDelta: 40000000 }
        },
        {
          id: 'opt_cwc_mega_payout',
          label: 'Grant Qualified Mega-Clubs €50M Minimum Participation Bonus',
          description: 'Guarantee maximum payout for participating European and South American giants to secure their participation.',
          outcomeTitle: '€50M Participation Payout Guaranteed',
          outcomeText: 'Guaranteed €50M participation bonuses for world giants, securing complete superstar squad commitments.',
          effects: { agencyCashDelta: 60000000, politicalInfluenceDelta: 25, clubTrustDelta: 30 }
        }
      ]
    },

    // 46. Agent Licensing Exam Standardization & Ghost Agency Crackdown
    {
      id: 'fed_scenario_agent_exam_audit',
      title: 'Global FIFA Agent Licensing Exam & Unlicensed Intermediary Crackdown',
      category: 'agent_regulations',
      severity: 'HIGH',
      headline: 'REGULATORY AUDIT: 60% of Active Intermediaries Fail Mandatory FIFA Agent Examination',
      summary: 'Following strict new licensing rules, thousands of unlicensed fake "agents" operate without passing the official FIFA exam. Unlicensed deals face immediate freeze.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_agent_exam_enforce',
          label: 'Enforce Strict Licensed-Only Agent Mandate & Fine Offending Clubs €5M',
          description: 'Eradicate unlicensed middlemen and protect young players from predatory scams.',
          outcomeTitle: 'Licensed-Only Agent Standard Enacted',
          outcomeText: 'You eradicated unlicensed intermediaries! Official licensed agencies gained a clean monopoly on professional player representation.',
          effects: { agencyCashDelta: 15000000, reputationDelta: 22, scandalDelta: -20, clubTrustDelta: 15 }
        },
        {
          id: 'opt_agent_exam_grace_period',
          label: 'Grant 12-Month Exam Retake Grace Period with Provisional Licenses',
          description: 'Allow experienced intermediaries additional time to pass standardized exams.',
          outcomeTitle: 'Provisional Licensing Grace Period Granted',
          outcomeText: 'Granted a 12-month provisional grace period, keeping active transfer windows moving smoothly.',
          effects: { clubTrustDelta: 18, politicalInfluenceDelta: 10 }
        }
      ]
    },

    // 47. Grassroots Municipal Pitch Renovation & Community Access Levy
    {
      id: 'fed_scenario_grassroots_levy',
      title: '1% Professional Transfer Tax for Municipal Youth Pitch Renovation',
      category: 'infrastructure',
      severity: 'HIGH',
      headline: 'COMMUNITY LEGISLATION: Proposing 1% Levy on All Domestic Transfers for Grassroots Pitches',
      summary: 'Grassroots initiative proposing a 1% tax on all domestic player transfer fees to fund the renovation of 500 municipal public grass pitches in low-income neighborhoods.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_grassroots_levy_pass',
          label: 'Enact Mandatory 1% Transfer Grassroots Levy & Build 500 Public Pitches',
          description: 'Turn multi-million transfer market spending into accessible football facilities for kids.',
          outcomeTitle: '1% Grassroots Transfer Levy Ratified',
          outcomeText: 'You passed the Grassroots Transfer Levy! Raised €15,000,000 annually and built 500 free public pitches for inner-city youth.',
          effects: { reputationDelta: 25, fanApprovalDelta: 35, scandalDelta: -15, politicalInfluenceDelta: 15 }
        },
        {
          id: 'opt_grassroots_levy_match',
          label: 'Match Grassroots Funding with Federation Commercial Profits Instead',
          description: 'Fund community pitches from central federation reserves without raising transfer costs.',
          outcomeTitle: 'Federation Grassroots Direct Investment Approved',
          outcomeText: 'Directly invested €10,000,000 from federation commercial profits into community pitch upgrades.',
          effects: { reputationDelta: 18, clubTrustDelta: 20, agencyCashDelta: -2000000 }
        }
      ]
    },

    // 48. Human Rights & Sovereign Wealth Sponsorship Clearance
    {
      id: 'fed_scenario_human_rights_charter',
      title: 'Binding Human Rights & Ethical Sourcing Sponsorship Clearance Standards',
      category: 'governance_ethics',
      severity: 'CRITICAL',
      headline: 'ETHICS BILL: Mandating Independent Human Rights Vetting for All League & Federation Commercial Deals',
      summary: 'Ethics board introduces a binding Human Rights & Governance Charter that requires auditing corporate and state sponsors for labor practices before approving deals.',
      requiredRoleMin: 'Federation Director',
      options: [
        {
          id: 'opt_hr_charter_pass',
          label: 'Ratify Strict Independent Ethical Sourcing & Human Rights Charter',
          description: 'Establish the world’s most ethical sports sponsorship approval process.',
          outcomeTitle: 'Human Rights Governance Charter Ratified',
          outcomeText: 'You passed the Human Rights Charter! Earned global acclaim from international human rights watchdogs and blue-chip sponsors.',
          effects: { reputationDelta: 30, fanApprovalDelta: 30, scandalDelta: -30, politicalInfluenceDelta: 10 }
        },
        {
          id: 'opt_hr_charter_pragmatic',
          label: 'Adopt Standard UN Global Compact Self-Certification Guidelines',
          description: 'Maintain corporate sponsorship flexibility while adhering to standard UN framework guidelines.',
          outcomeTitle: 'UN Global Compact Guidelines Adopted',
          outcomeText: 'Adopted UN self-certification guidelines, balancing ethics with commercial sponsorship freedom.',
          effects: { agencyCashDelta: 10000000, politicalInfluenceDelta: 12, clubTrustDelta: 15 }
        }
      ]
    },

    // 49. Worldwide Transfer Window Deadline Synchronization
    {
      id: 'fed_scenario_window_sync',
      title: 'Global Transfer Window Deadline Synchronization Treaty',
      category: 'agent_regulations',
      severity: 'HIGH',
      headline: 'TRANSFER HARMONIZATION: Aligning Transfer Closing Deadlines across All Top 5 Leagues',
      summary: 'Coordinating with FIFA and continental leagues to close summer transfer windows simultaneously on August 31 at 11:00 PM CET, preventing foreign raiding after season starts.',
      requiredRoleMin: 'Continental President',
      options: [
        {
          id: 'opt_sync_windows_enforce',
          label: 'Ratify Synchronized August 31 Transfer Closing Treaty across Europe',
          description: 'Stop late foreign club raiding and restore squad stability before matchday 1.',
          outcomeTitle: 'Synchronized Transfer Window Treaty Ratified',
          outcomeText: 'You ratified the global transfer window synchronization treaty! Club managers celebrated the elimination of post-season raiding.',
          effects: { reputationDelta: 20, clubTrustDelta: 30, scandalDelta: -10, politicalInfluenceDelta: 15 }
        },
        {
          id: 'opt_sync_windows_extend',
          label: 'Allow Extended 2-Week Window for Selling Out of Unwanted Surplus Players',
          description: 'Provide extra time for clubs to offload high-wage surplus players to secondary markets.',
          outcomeTitle: 'Surplus Transfer Extension Authorized',
          outcomeText: 'Authorized surplus transfer extension, helping clubs trim €40M in unwanted player wage bills.',
          effects: { agencyCashDelta: 8000000, clubTrustDelta: 18 }
        }
      ]
    },

    // 50. Academy Mental Health & Sports Psychology Mandate
    {
      id: 'fed_scenario_mental_health',
      title: 'Mandatory Academy Mental Health & Player Welfare Directive',
      category: 'youth_integrity',
      severity: 'HIGH',
      headline: 'WELFARE BILL: Requiring Licensed Sports Psychologists & Dual-Career Education in All Academies',
      summary: 'Following alarming reports of depression among released youth players, legislation proposes mandating full-time mental health counselors and vocational education in every youth academy.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_mental_health_mandate',
          label: 'Pass Mandatory Youth Welfare Charter & Dual-Career Education Law',
          description: 'Ensure every academy player receives professional psychological support and academic career training.',
          outcomeTitle: 'Youth Academy Welfare Charter Passed',
          outcomeText: 'You passed the Youth Welfare Charter! Player release trauma dropped significantly and youth academy welfare rated best in world sports.',
          effects: { reputationDelta: 25, fanApprovalDelta: 30, scandalDelta: -20, clubTrustDelta: 15 }
        },
        {
          id: 'opt_mental_health_grant',
          label: 'Provide €3M Federation Mental Health Grant for Regional Academy Clinics',
          description: 'Fund centralized regional mental health support clinics accessible to all young athletes.',
          outcomeTitle: 'Regional Youth Welfare Clinics Funded',
          outcomeText: 'Funded regional youth welfare clinics, delivering expert sports psychology support nationwide.',
          effects: { reputationDelta: 18, fanApprovalDelta: 20, agencyCashDelta: -1000000 }
        }
      ]
    },

    // 51. National Cup Final Neutral Venue Rotation Scheme
    {
      id: 'fed_scenario_cup_venue_rotation',
      title: 'National Cup Final Neutral Venue Bidding & Regional Bidding War',
      category: 'governance_ethics',
      severity: 'HIGH',
      headline: 'STADIUM AUCTION: Provincial Municipalities Offer €10M Bids to Host National Cup Final',
      summary: 'Regional cities compete to host the National Cup Final, challenging the tradition of hosting exclusively in the national capital stadium.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_cup_rotate',
          label: 'Rotate Cup Final Host City Annually Across Top Provincial Arenas',
          description: 'Spread major cup match excitement and economic tourism revenue across all regions.',
          outcomeTitle: 'National Cup Rotation Enacted',
          outcomeText: 'You rotated the Cup Final venue! Regional cities saw €30M in local tourism and regional fan engagement soared.',
          effects: { reputationDelta: 20, fanApprovalDelta: 28, politicalInfluenceDelta: 18, agencyCashDelta: 5000000 }
        },
        {
          id: 'opt_cup_capital_traditional',
          label: 'Maintain Historic National Capital Stadium Contract',
          description: 'Preserve 100 years of iconic Cup Final tradition in the legendary capital stadium.',
          outcomeTitle: 'Capital Stadium Heritage Retained',
          outcomeText: 'Retained capital stadium heritage, preserving classic matchday pilgrimage traditions.',
          effects: { reputationDelta: 12, fanApprovalDelta: 15 }
        }
      ]
    },

    // 52. Offshore Player Image Rights Tax Evasion Audit
    {
      id: 'fed_scenario_image_rights_tax',
      title: 'Offshore Image Rights Shell Company & Tax Avoidance Amnesty',
      category: 'financial_insolvency',
      severity: 'CRITICAL',
      headline: 'TAX AUDIT: State Prosecutors Investigate €60M Offshore Shell Companies Hiding Player Image Rights',
      summary: 'Tax authorities uncover offshore shell companies used by elite stars and agencies to evade income taxes on image rights contracts. Proposing a federation tax compliance amnesty.',
      requiredRoleMin: 'Federation Director',
      options: [
        {
          id: 'opt_tax_compliance_enforce',
          label: 'Mandate 100% Tax Transparency Registration for All Image Rights Contracts',
          description: 'Clean up player compensation structures and ensure full legal compliance with national tax law.',
          outcomeTitle: 'Image Rights Transparency Standard Enacted',
          outcomeText: 'You enacted complete image rights transparency! Eliminated criminal tax risk for clubs and earned high praise from state prosecutors.',
          effects: { reputationDelta: 25, scandalDelta: -30, clubTrustDelta: 15, politicalInfluenceDelta: 15 }
        },
        {
          id: 'opt_tax_amnesty_settle',
          label: 'Broker €20M Tax Amnesty Settlement Fund for Affected Stars',
          description: 'Allow players and agencies to settle past tax liabilities quietly without prison sentences.',
          outcomeTitle: '€20M Tax Amnesty Settlement Brokered',
          outcomeText: 'Brokered a €20,000,000 tax amnesty settlement, insulating star players from criminal court trials.',
          effects: { agencyCashDelta: 10000000, politicalInfluenceDelta: 12, scandalDelta: 10 }
        }
      ]
    },

    // 53. Futsal & Beach Soccer National Integration & Olympic Push
    {
      id: 'fed_scenario_futsal_integration',
      title: 'Futsal & Beach Soccer Professionalization & Olympic Inclusion Push',
      category: 'infrastructure',
      severity: 'HIGH',
      headline: 'DISCIPLINE EXPANSION: Investing €5M in National Futsal League & Olympic Bidding',
      summary: 'Proposal to integrate indoor Futsal and Beach Soccer into the main professional federation structure, creating pro leagues and petitioning the IOC for Olympic inclusion.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_futsal_pro_launch',
          label: 'Launch Professional National Futsal League & Drive Olympic Inclusion',
          description: 'Build indoor futsal courts in every city, dramatically accelerating technical ball skills among youth.',
          outcomeTitle: 'Professional Futsal League Established',
          outcomeText: 'You launched the Professional Futsal League! Technical ball mastery among youth players doubled and Olympic inclusion momentum surged.',
          effects: { reputationDelta: 20, fanApprovalDelta: 25, agencyCashDelta: 5000000, politicalInfluenceDelta: 12 }
        },
        {
          id: 'opt_futsal_grassroots_only',
          label: 'Keep Futsal as Amateur Grassroots Development Tool Only',
          description: 'Focus financial resources exclusively on 11-a-side professional football.',
          outcomeTitle: 'Grassroots Futsal Allocation Approved',
          outcomeText: 'Focused funds on 11-a-side football while supporting amateur futsal tournaments.',
          effects: { clubTrustDelta: 12, politicalInfluenceDelta: 8 }
        }
      ]
    },

    // 54. Post-Brexit Foreign Player Work Permit (GBE) Point System Reform
    {
      id: 'fed_scenario_work_permits',
      title: 'Foreign Player Work Permit Governing Body Endorsement (GBE) System Reform',
      category: 'governance_ethics',
      severity: 'HIGH',
      headline: 'IMMIGRATION REFORM: Relaxing Work Permit Point Rules for Young Overseas Prodigies',
      summary: 'Clubs petition the federation to lower international match caps required for work permits, enabling domestic clubs to sign top South American & African under-21 prodigies directly.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_gbe_relax_points',
          label: 'Lower GBE Work Permit Point Criteria & Allocate 4 ESC Talent Slots Per Club',
          description: 'Allow domestic clubs to sign promising young international prospects directly.',
          outcomeTitle: 'Overseas Prodigy Work Permit System Reform Enacted',
          outcomeText: 'You reformed work permit criteria! Clubs signed 30 top global under-21 talents, dramatically increasing league technical quality.',
          effects: { agencyCashDelta: 12000000, clubTrustDelta: 25, reputationDelta: 15, fanApprovalDelta: 15 }
        },
        {
          id: 'opt_gbe_protect_homegrown',
          label: 'Maintain Strict International Cap Thresholds to Protect Local Youngsters',
          description: 'Ensure domestic academy players are not blocked by cheap foreign signings.',
          outcomeTitle: 'Strict Work Permit Protections Maintained',
          outcomeText: 'Maintained strict work permit rules, protecting domestic academy players from foreign competition.',
          effects: { reputationDelta: 15, fanApprovalDelta: 20, clubTrustDelta: -10 }
        }
      ]
    },

    // 55. Ball Aerodynamics & Stadium Altitude Uniformity Standard
    {
      id: 'fed_scenario_ball_standards',
      title: 'Match Ball Aerodynamics Standardization & High-Altitude Pressurization Rules',
      category: 'governance_ethics',
      severity: 'HIGH',
      headline: 'EQUIPMENT COMPLAINT: Goalkeepers Protest Erratic Flight Characteristics of New Synthetic Match Ball',
      summary: 'Goalkeeper union protests unpredictable knuckles and swerve trajectory of official tournament match balls during high-altitude matches, demanding aerodynamic redesign.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_ball_redesign',
          label: 'Mandate Wind-Tunnel Aerodynamic Testing & Micro-Textured Surface Standard',
          description: 'Require scientific aerodynamic testing for all official match balls to ensure predictable flight.',
          outcomeTitle: 'Aerodynamic Match Ball Standard Enacted',
          outcomeText: 'You mandated wind-tunnel tested match balls! Goalkeeper errors dropped and shot accuracy increased across all divisions.',
          effects: { reputationDelta: 15, fanApprovalDelta: 15, scandalDelta: -10 }
        },
        {
          id: 'opt_ball_keep_contract',
          label: 'Uphold Current Manufacturer Contract to Preserve €15M Sponsorship',
          description: 'Maintain existing multi-million ball supplier sponsorship agreement without alterations.',
          outcomeTitle: 'Sponsorship Ball Contract Retained',
          outcomeText: 'Retained ball supplier contract, securing €15,000,000 in federation equipment revenue.',
          effects: { agencyCashDelta: 5000000, politicalInfluenceDelta: 10 }
        }
      ]
    },

    // 56. Safe Sport Youth Coaching Qualification & Criminal Vetting Mandate
    {
      id: 'fed_scenario_safeguarding',
      title: 'Mandatory Safe Sport Safeguarding & Nationwide Background Checks',
      category: 'youth_integrity',
      severity: 'CRITICAL',
      headline: 'SAFEGUARDING BILL: Mandatory Criminal Background Checks & Safeguarding Licenses for All Youth Coaches',
      summary: 'Legislation requiring all 25,000 professional and volunteer youth coaches to undergo rigorous independent background checks and complete mandatory safeguarding certification.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_safeguarding_pass',
          label: 'Pass Binding Safeguarding Charter & Mandate Independent Licensing',
          description: 'Establish absolute zero-tolerance child protection standards across every youth club in the country.',
          outcomeTitle: 'Nationwide Safeguarding Charter Enacted',
          outcomeText: 'You passed the Safeguarding Charter! Created the world’s safest youth sporting environment and protected thousands of children.',
          effects: { reputationDelta: 30, fanApprovalDelta: 35, scandalDelta: -30, clubTrustDelta: 20 }
        },
        {
          id: 'opt_safeguarding_subsidize',
          label: 'Provide Free Online Safeguarding Modules & Subsidize Background Check Fees',
          description: 'Cover certification costs using federation funds to avoid overburdening volunteer grassroot clubs.',
          outcomeTitle: 'Subsidized Safeguarding Certification Rolled Out',
          outcomeText: 'Subsidized background check fees, certifying 25,000 coaches smoothly within 90 days.',
          effects: { reputationDelta: 22, fanApprovalDelta: 25, agencyCashDelta: -1500000 }
        }
      ]
    },

    // 57. In-Stadium Alcohol Sales & Safe Fan Zone Regulation
    {
      id: 'fed_scenario_alcohol_policy',
      title: 'In-Stadium Low-Alcohol Beer Sales & Safe Fan Zone Liberalization',
      category: 'fan_governance',
      severity: 'HIGH',
      headline: 'STADIUM ECONOMY: Proposing Controlled In-Seat Low-Alcohol Beer Sales to Boost Club Revenue',
      summary: 'Proposal to lift 30-year stadium alcohol bans in top divisions, allowing controlled low-alcohol sales in concourses to generate €25M in stadium hospitality revenues.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_alcohol_allow_controlled',
          label: 'Permit Controlled Concourse Beer Sales with Biometric ID Verification',
          description: 'Modernize matchday concessions while strictly preventing excessive intoxication.',
          outcomeTitle: 'Controlled Matchday Concessions Approved',
          outcomeText: 'Approved controlled concession sales! Matchday revenues increased €25,000,000 annually without increasing fan misconduct.',
          effects: { agencyCashDelta: 10000000, clubTrustDelta: 20, fanApprovalDelta: 20 }
        },
        {
          id: 'opt_alcohol_maintain_ban',
          label: 'Maintain In-Stadium Alcohol Ban in General Seating Areas',
          description: 'Prioritize family-friendly stadium safety and avoid alcohol-fueled fan friction.',
          outcomeTitle: 'General Seating Alcohol Ban Retained',
          outcomeText: 'Maintained seating alcohol ban, earning praise from family supporter associations.',
          effects: { reputationDelta: 15, fanApprovalDelta: 15 }
        }
      ]
    },

    // 58. National Football Hall of Fame & Heritage Museum Endowment
    {
      id: 'fed_scenario_hall_of_fame',
      title: 'National Football Hall of Fame & Heritage Museum Construction',
      category: 'governance_ethics',
      severity: 'HIGH',
      headline: 'HERITAGE PROJECT: Building €30M State-of-the-Art National Football Museum & Hall of Fame',
      summary: 'Project to build a futuristic interactive National Football Museum and Hall of Fame to honor historic legends, national team triumphs, and iconic historic jerseys.',
      requiredRoleMin: 'Regional Delegate',
      options: [
        {
          id: 'opt_hof_build',
          label: 'Commission €30M National Museum & Hall of Fame with Interactive VR Exhibits',
          description: 'Create a world-class cultural landmark celebrating national football heritage.',
          outcomeTitle: 'National Football Hall of Fame Commissioned',
          outcomeText: 'You opened the National Football Hall of Fame! Attracted 1 Million visitors annually and created an iconic cultural monument.',
          effects: { reputationDelta: 25, fanApprovalDelta: 30, agencyCashDelta: 10000000, politicalInfluenceDelta: 15 }
        },
        {
          id: 'opt_hof_digital',
          label: 'Launch Digital Metaverse Hall of Fame & Mobile Heritage Archive',
          description: 'Create an accessible online museum experience at 10% of the physical construction cost.',
          outcomeTitle: 'Digital Football Heritage Archive Launched',
          outcomeText: 'Launched the Digital Heritage Archive, giving millions of global fans instant access to historic match archives.',
          effects: { reputationDelta: 18, fanApprovalDelta: 20 }
        }
      ]
    },

    // 59. Severe Insolvency Administration & Automatic Points Penalty
    {
      id: 'fed_scenario_insolvency_points',
      title: 'Automatic 12-Point Penalty Rule & Financial Administration Protection',
      category: 'financial_insolvency',
      severity: 'CRITICAL',
      headline: 'FINANCIAL COLLAPSE: Top-Flight Club Enters Administration With €110M Unpaid Debt',
      summary: 'A historic club enters legal administration after failing to pay wages for 3 months. The league board votes on applying an automatic 12-point deduction.',
      requiredRoleMin: 'Federation Director',
      options: [
        {
          id: 'opt_insolvency_deduct_points',
          label: 'Apply Mandatory 12-Point Deduction & Force Buyer Wage Guarantee',
          description: 'Uphold strict financial fair play penalties while requiring prospective buyers to clear all staff wages.',
          outcomeTitle: '12-Point Sanction & Wage Guarantee Imposed',
          outcomeText: 'You applied the 12-point penalty and required full wage payback! Saved 200 club staff jobs while enforcing strict financial discipline.',
          effects: { reputationDelta: 22, scandalDelta: -25, clubTrustDelta: 20, fanApprovalDelta: 10 }
        },
        {
          id: 'opt_insolvency_grant_stay',
          label: 'Grant 60-Day Penalty Stay to Allow Emergency Fan Buyer Takeover',
          description: 'Give a fan-led community trust time to complete a rescue buyout without immediate relegation point penalties.',
          outcomeTitle: 'Emergency Fan Takeover Stay Granted',
          outcomeText: 'You granted a penalty stay! The supporter trust successfully completed a community buyout and saved the club from liquidation.',
          effects: { fanApprovalDelta: 35, reputationDelta: 20, clubTrustDelta: 15 }
        }
      ]
    },

    // 60. FIFA Global Peace Match & Inter-Continental Unity Cup
    {
      id: 'fed_scenario_global_unity_cup',
      title: 'FIFA Global Peace Match & Inter-Continental Humanitarian Initiative',
      category: 'national_team',
      severity: 'EMERGENCY',
      headline: 'GLOBAL DIPLOMACY: Hosting Worldwide Peace Exhibition Match Raising €100M for Relief Efforts',
      summary: 'As FIFA President, you organize a historic Peace match featuring 40 of the world’s greatest active and legend superstars, broadcast live in 200 countries to support humanitarian aid.',
      requiredRoleMin: 'FIFA Global President',
      options: [
        {
          id: 'opt_peace_match_execute',
          label: 'Host Global Peace Exhibition & Donate €100M to International Humanitarian Aid',
          description: 'Unite humanity through the power of football while raising record relief funds.',
          outcomeTitle: 'Historic FIFA Peace Match Executed Globally',
          outcomeText: 'You hosted the FIFA Peace Match! Over 1.5 Billion viewers tuned in worldwide, raising €100,000,000 for humanitarian aid and earning international Nobel peace acclaim!',
          effects: { reputationDelta: 40, fanApprovalDelta: 50, scandalDelta: -35, politicalInfluenceDelta: 35, agencyCashDelta: 50000000 }
        },
        {
          id: 'opt_peace_match_tournament',
          label: 'Establish Permanent Annual Inter-Continental Peace Cup Tournament Series',
          description: 'Turn the peace initiative into an annual official international tournament fixture.',
          outcomeTitle: 'Annual Inter-Continental Peace Cup Established',
          outcomeText: 'Established the annual Inter-Continental Peace Cup, generating €40,000,000 in annual tournament revenue.',
          effects: { agencyCashDelta: 40000000, politicalInfluenceDelta: 25, reputationDelta: 25 }
        }
      ]
    }
  ];
}

