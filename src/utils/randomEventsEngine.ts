import { RandomEvent, Player, Club, AgencyState } from '../types';
import { formatMoney } from './gameEngine';

export function generateDynamicRandomEvent(agency: AgencyState, players: Player[], clubs: Club[]): RandomEvent {
  const clients = players.filter(p => p.isMyClient);
  const sampleClient = clients.length > 0 
    ? clients[Math.floor(Math.random() * clients.length)] 
    : (players.length > 0 ? players[0] : { id: 'temp_p1', name: 'Star Prospect' } as Player);
  const sampleClub = clubs.length > 0 ? clubs[Math.floor(Math.random() * clubs.length)] : null;

  const eventTemplates: RandomEvent[] = [
    {
      id: `evt_tax_audit_${Date.now()}`,
      title: 'HMRC & Tax Authority Special Investigation',
      category: 'financial',
      description: `Tax inspectors have launched an unannounced audit into ${agency.agencyName}'s offshore shell companies and image rights payments. They suspect tax avoidance on foreign transfer commissions!`,
      characterName: 'Inspector Victor Vance',
      characterRole: 'Chief Financial Auditor',
      imageEmoji: '🔍',
      options: [
        {
          label: 'Pay Out-of-Court Settlement (€350,000)',
          description: 'Settle immediately without admitting guilt to keep tabloid headlines clean.',
          outcomeTitle: 'Audit Closed Silently',
          outcomeText: 'You transferred €350,000 to the tax authority. The audit was quietly dropped with zero public scandal.',
          effects: { cashChange: -350000, scandalChange: -10, reputationChange: 2 }
        },
        {
          label: 'Hire Elite Tax Defense Lawyers (€100,000)',
          description: 'Fight the tax authorities in tribunal court using loopholes.',
          outcomeTitle: 'Legal Battle Commenced',
          outcomeText: 'Your lawyers discovered valid international treaties. You saved cash, but public speculation slightly raised scandal.',
          effects: { cashChange: -100000, scandalChange: 12, reputationChange: -2 }
        },
        {
          label: 'Blame Offshore Accounting Firm',
          description: 'Deny involvement and shift full responsibility onto Swiss asset managers.',
          outcomeTitle: 'Blame Shifted',
          outcomeText: 'The media ran wild with rumors. Public trust dropped, but you paid nothing in immediate fines.',
          effects: { scandalChange: 25, reputationChange: -8 }
        }
      ]
    },
    {
      id: `evt_nightclub_${Date.now()}`,
      title: `${sampleClient.name} Derby Nightclub Incident`,
      category: 'scandal',
      description: `${sampleClient.name} was photographed partying in an exclusive VIP lounge at 4:30 AM on the eve of a crucial league derby. Tabloid paparazzi have video footage!`,
      characterName: sampleClient.name,
      characterRole: 'Star Client',
      imageEmoji: '🍾',
      targetPlayerId: sampleClient.id,
      options: [
        {
          label: 'Buy Paparazzi Video Rights (€150,000)',
          description: 'Pay the tabloid editor to bury the footage forever.',
          outcomeTitle: 'Scandal Suppressed',
          outcomeText: 'The video was deleted. Player morale remained high and the manager never found out.',
          effects: { cashChange: -150000, moraleChange: 10, scandalChange: -15 }
        },
        {
          label: 'Issue Public Apology & Fine Client (€50,000)',
          description: 'Hold a press conference, acknowledge the mistake, and dock 2 weeks wage.',
          outcomeTitle: 'Disciplined Apology',
          outcomeText: 'The public appreciated the swift discipline, but the player is annoyed at losing 2 weeks wage.',
          effects: { moraleChange: -15, scandalChange: -20, reputationChange: 5 }
        },
        {
          label: 'Defend Player & Blame AI Deepfake',
          description: 'Claim the video is a fabricated digital hoax created by rival fans.',
          outcomeTitle: 'Media Frenzy',
          outcomeText: 'The internet went wild with memes! Scandal level surged, but player felt defended by you.',
          effects: { moraleChange: 15, scandalChange: 25, reputationChange: -5 }
        }
      ]
    },
    {
      id: `evt_sponsor_${Date.now()}`,
      title: 'Global Sportswear Brand Mega-Endorsement',
      category: 'sponsor',
      description: 'A tier-1 global sportswear brand wants to sign an exclusive multi-year footwear and apparel endorsement package with your agency stars!',
      characterName: 'Elena Rostova',
      characterRole: 'Global Commercial VP',
      imageEmoji: '👟',
      options: [
        {
          label: 'Sign Exclusive Sponsorship Deal (+€500,000)',
          description: 'Accept immediate guaranteed upfront commercial payout for agency.',
          outcomeTitle: 'Sponsorship Signed!',
          outcomeText: 'Secured €500,000 upfront sponsorship bonus! Your agency reputation rose significantly.',
          effects: { cashChange: 500000, reputationChange: 8, moraleChange: 10 }
        },
        {
          label: 'Hold Out for Higher Royalties (+€250,000 + Rep)',
          description: 'Push for custom boot lines and performance bonuses.',
          outcomeTitle: 'High-Stakes Counter Offer',
          outcomeText: 'They accepted your bold terms! Received €250,000 plus ongoing brand prestige.',
          effects: { cashChange: 250000, reputationChange: 12, moraleChange: 8 }
        }
      ]
    },
    {
      id: `evt_manager_sacking_${Date.now()}`,
      title: `Emergency Manager Sacking at ${sampleClub?.name || 'Top Club'}`,
      category: 'manager',
      description: `Following a string of 4 consecutive defeats, ${sampleClub?.name || 'the club'} board has fired head coach ${sampleClub?.headCoach || 'the manager'}. The chairman wants your input!`,
      characterName: sampleClub?.chairmanName || 'Club Chairman',
      characterRole: 'Chairman',
      imageEmoji: '👔',
      targetClubId: sampleClub?.id,
      options: [
        {
          label: 'Recommend Allied Tactical Coach (€100,000 Lobby)',
          description: 'Lobby for a coach signed to your agency client network.',
          outcomeTitle: 'Allied Coach Appointed',
          outcomeText: 'Your preferred head coach was hired! Chairman trust soared and client playing time is guaranteed.',
          effects: { cashChange: -100000, chairmanTrustChange: 20, reputationChange: 5 }
        },
        {
          label: 'Demand High Transfer Guarantee for Client',
          description: 'Refuse to endorse any new coach unless your star client gets a wage renewal.',
          outcomeTitle: 'Wage Guarantee Demanded',
          outcomeText: 'The board agreed to review your client contract in exchange for managerial stability.',
          effects: { chairmanTrustChange: -5, moraleChange: 12, cashChange: 50000 }
        }
      ]
    },
    {
      id: `evt_rival_poach_${Date.now()}`,
      title: `Hostile Rival Agency Poaching Attempt on ${sampleClient.name}`,
      category: 'player',
      description: `Rival super-agency Gestifute Global sent secret agents to meet ${sampleClient.name}'s family, offering a €1,000,000 cash sign-on bonus to switch agencies!`,
      characterName: 'Jorge Mendes Jr.',
      characterRole: 'Rival Super-Agent',
      imageEmoji: '⚔️',
      targetPlayerId: sampleClient.id,
      options: [
        {
          label: 'Match Sign-On Bonus & Gift Villa (€300,000)',
          description: 'Provide an instant loyalty cash bonus and luxury car to retain client.',
          outcomeTitle: 'Client Loyalty Secured!',
          outcomeText: `${sampleClient.name} rejected the rival agency and swore long-term loyalty to you!`,
          effects: { cashChange: -300000, moraleChange: 25, reputationChange: 6 }
        },
        {
          label: 'Report Illegal TAP-ING to FIFA Desk',
          description: 'File an official grievance for illegal poaching rules violation.',
          outcomeTitle: 'FIFA Investigation Opened',
          outcomeText: 'FIFA issued a warning to Gestifute. Your political influence rose without spending cash!',
          effects: { politicalInfluenceChange: 10, scandalChange: -5, moraleChange: -5 }
        }
      ]
    },
    {
      id: `evt_stadium_tifo_${Date.now()}`,
      title: 'Ultras Fan Pyro & Tifo Demonstration',
      category: 'stadium',
      description: 'The club Ultras fan group wants agency funding to create a record-breaking 3D stadium choreo display with smoke pyro for the upcoming European derby!',
      characterName: 'Marco "The Titan"',
      characterRole: 'Ultras Fan Leader',
      imageEmoji: '🔥',
      options: [
        {
          label: 'Fund Record Choreo (€120,000)',
          description: 'Pay for smoke flares and massive banner. Fan approval will surge.',
          outcomeTitle: 'Atmosphere Maxed Out!',
          outcomeText: 'The stadium tifo went viral worldwide! Fan approval jumped by +15 points.',
          effects: { cashChange: -120000, fanApprovalChange: 15, reputationChange: 5 }
        },
        {
          label: 'Decline Due to Pyro Safety Regulations',
          description: 'Refuse to fund pyrotechnics to prevent UEFA fines.',
          outcomeTitle: 'Safety First',
          outcomeText: 'Avoided potential UEFA fines, though Ultras expressed slight disappointment.',
          effects: { fanApprovalChange: -5, chairmanTrustChange: 10 }
        }
      ]
    },
    {
      id: `evt_wonderkid_grassroots_${Date.now()}`,
      title: 'Grassroots Academy Wonderkid Breakthrough',
      category: 'grassroots',
      description: 'Your South American scouting network uncovered a 16-year-old unrepresented prodigy with 94 Potential in Santos, Brazil! European giants are watching.',
      characterName: 'Paulo Silva',
      characterRole: 'Chief Youth Scout',
      imageEmoji: '⭐',
      options: [
        {
          label: 'Sign Exclusive Family Agency Contract (€150,000)',
          description: 'Pay relocation package for the family and secure 100% agency rights.',
          outcomeTitle: 'Wonderkid Signed!',
          outcomeText: 'Secured exclusive representation of football\'s next top prospect!',
          effects: { cashChange: -150000, reputationChange: 15 }
        },
        {
          label: 'Sell Exclusive Scouting Rights to Real Madrid (€600,000)',
          description: 'Brokered a finder fee with Real Madrid scouts for immediate cash.',
          outcomeTitle: 'Scouting Fee Collected!',
          outcomeText: 'Earned €600,000 instant finder fee from Real Madrid!',
          effects: { cashChange: 600000, reputationChange: 5 }
        }
      ]
    },
    {
      id: `evt_crypto_boom_${Date.now()}`,
      title: 'Agency Crypto & Fan Token Market Surge',
      category: 'financial',
      description: 'A major crypto platform sponsoring digital fan tokens experienced a 300% market surge! Your agency digital treasury holds tokens.',
      characterName: 'Satoshi Nakamoto Jr.',
      characterRole: 'Fintech Broker',
      imageEmoji: '📈',
      options: [
        {
          label: 'Cash Out Digital Treasury (+€750,000)',
          description: 'Liquidate all crypto assets immediately for hard currency.',
          outcomeTitle: 'Crypto Profits Realized!',
          outcomeText: 'Successfully cashed out €750,000 into agency bank accounts!',
          effects: { cashChange: 750000, reputationChange: 3 }
        },
        {
          label: 'Distribute Crypto Dividends to Clients',
          description: 'Pass 50% of earnings to agency players to boost client happiness.',
          outcomeTitle: 'Clients Thrilled!',
          outcomeText: 'Your players loved the crypto payout! Morale and loyalty surged across all clients.',
          effects: { cashChange: 250000, moraleChange: 20, reputationChange: 10 }
        }
      ]
    }
  ];

  return eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
}
