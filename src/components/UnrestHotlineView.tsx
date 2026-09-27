import React, { useState } from 'react';
import { Player, AgencyState } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { soundEngine } from '../utils/soundEffects';
import { 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ShieldAlert, 
  Zap, 
  DollarSign, 
  Newspaper, 
  Wine, 
  ChevronRight, 
  Flame, 
  Sparkles,
  ArrowRight,
  UserX,
  Award,
  Lock,
  HeartHandshake
} from 'lucide-react';

interface UnrestHotlineViewProps {
  players: Player[];
  agencyBalance: number;
  onUpdatePlayer: (player: Player) => void;
  onOpenTransferModal: (player: Player) => void;
  onOpenTab: (tab: string) => void;
  agency?: AgencyState;
  onUpdateAgency?: (agency: AgencyState) => void;
}

export interface NegotiationChoice {
  id: string;
  label: string;
  description: string;
  variant: 'emerald' | 'amber' | 'red' | 'purple' | 'sky';
  action: () => void;
}

export interface NegotiationModalState {
  player: Player;
  actionTitle: string;
  actionType: 'transfer_request' | 'wage_demand' | 'tabloid_leak' | 'pacify';
  outcomeBadge: {
    text: string;
    bg: string;
    border: string;
    textColor: string;
  };
  clubName: string;
  speakerName: string;
  speakerRole: string;
  speakerAvatar: string;
  quote: string;
  bodyText: string;
  choices: NegotiationChoice[];
}

export const UnrestHotlineView: React.FC<UnrestHotlineViewProps> = ({
  players,
  agencyBalance,
  onUpdatePlayer,
  onOpenTransferModal,
  onOpenTab,
  agency,
  onUpdateAgency
}) => {
  const [activeModal, setActiveModal] = useState<NegotiationModalState | null>(null);

  // Contract Negotiation Suite State
  const [customContractPlayer, setCustomContractPlayer] = useState<Player | null>(null);
  const [reqWage, setReqWage] = useState<number>(50000);
  const [reqYears, setReqYears] = useState<number>(3);
  const [reqReleaseClause, setReqReleaseClause] = useState<number | undefined>(undefined);
  const [reqCommission, setReqCommission] = useState<number>(10);

  const myClients = players.filter(p => p.isMyClient);
  const unrestClients = myClients.filter(p => p.unrest && p.unrest.status !== 'content');

  const closeModal = () => {
    soundEngine.playClick();
    setActiveModal(null);
  };

  // Helper to adjust agency balance or reputation if available
  const adjustAgencyFunds = (deltaBalance: number, deltaReputation: number = 0) => {
    if (agency && onUpdateAgency) {
      onUpdateAgency({
        ...agency,
        balance: agency.balance + deltaBalance,
        reputation: Math.max(0, Math.min(100, agency.reputation + deltaReputation))
      });
    }
  };

  // 1. ACTION: SUBMIT FORMAL TRANSFER REQUEST
  const handleForceTransferRequest = (player: Player) => {
    soundEngine.playClick();
    const roll = Math.random();

    if (roll < 0.45) {
      // Outcome A: Board Reluctantly Accepts & Transfer Lists
      soundEngine.playSuccess();
      setActiveModal({
        player,
        actionTitle: '⚡ Transfer Request Outcome',
        actionType: 'transfer_request',
        outcomeBadge: {
          text: 'BOARD APPROVED EXIT',
          bg: 'bg-emerald-500/20',
          border: 'border-emerald-500/40',
          textColor: 'text-emerald-300'
        },
        clubName: player.clubName,
        speakerName: 'Board Director',
        speakerRole: `President of ${player.clubName}`,
        speakerAvatar: '🏛️',
        quote: `"We are deeply disappointed by ${player.name}'s lack of commitment, but we will not keep an unmotivated player in our dressing room. He is now officially transfer listed."`,
        bodyText: `The board of ${player.clubName} accepted the transfer request. ${player.name} is placed on the market with an official 30% discount to accelerate buyer interest.`,
        choices: [
          {
            id: 'accept_list',
            label: 'Acknowledge & View Transfer Market',
            description: 'Finalize discount listing and jump to the transfer market desk.',
            variant: 'emerald',
            action: () => {
              const updated: Player = {
                ...player,
                morale: Math.min(100, player.morale + 15),
                unrest: {
                  status: 'transfer_requested',
                  reason: player.unrest?.reason || 'wants_new_challenge',
                  reasonLabel: 'Transfer Request Granted (-30%)',
                  discontentLevel: 85,
                  description: `${player.name} handed in an official Transfer Request to ${player.clubName}! Listed at a 30% discount.`,
                  discountPercent: 30
                }
              };
              onUpdatePlayer(updated);
              closeModal();
              onOpenTransferModal(updated);
            }
          }
        ]
      });
    } else if (roll < 0.80) {
      // Outcome B: Board Rejects Discount Exit & Demands Release Clause
      soundEngine.playError();
      setActiveModal({
        player,
        actionTitle: '⚡ Board Rejection & Counter-Stance',
        actionType: 'transfer_request',
        outcomeBadge: {
          text: 'DISCOUNT REJECTED',
          bg: 'bg-amber-500/20',
          border: 'border-amber-500/40',
          textColor: 'text-amber-300'
        },
        clubName: player.clubName,
        speakerName: 'Sporting Director',
        speakerRole: `Head of Football - ${player.clubName}`,
        speakerAvatar: '👔',
        quote: `"${player.name} is vital to our tactical setup! We refuse to grant a 30% discount. If any club wants him, they must pay his full €${formatMoney(player.value)} valuation!"`,
        bodyText: `The club board refuses a cut-price sale. You can accept their full-price listing or escalate by threatening a player training strike.`,
        choices: [
          {
            id: 'accept_full_price',
            label: 'Accept Full Price Listing (0% Discount)',
            description: 'List player on the transfer market at standard value without a discount.',
            variant: 'amber',
            action: () => {
              const updated: Player = {
                ...player,
                morale: Math.max(0, player.morale - 10),
                unrest: {
                  status: 'transfer_requested',
                  reason: player.unrest?.reason || 'wants_new_challenge',
                  reasonLabel: 'Full Valuation Market Listing',
                  discontentLevel: 80,
                  description: `Listed for transfer at full €${formatMoney(player.value)} market price following board resistance.`,
                  discountPercent: 0
                }
              };
              onUpdatePlayer(updated);
              closeModal();
              onOpenTransferModal(updated);
            }
          },
          {
            id: 'force_strike',
            label: 'Threaten Training Strike & Escalation',
            description: 'Client threatens to refuse training. Forces a 20% discount exit, but player is fined €10,000.',
            variant: 'red',
            action: () => {
              soundEngine.playSuccess();
              const updated: Player = {
                ...player,
                morale: Math.min(100, player.morale + 10),
                unrest: {
                  status: 'transfer_requested',
                  reason: 'manager_clash',
                  reasonLabel: 'Training Strike & Forced Exit (-20%)',
                  discontentLevel: 95,
                  description: `Public training strike forced ${player.clubName} to list player at a 20% discount!`,
                  discountPercent: 20
                }
              };
              onUpdatePlayer(updated);
              closeModal();
              onOpenTransferModal(updated);
            }
          }
        ]
      });
    } else {
      // Outcome C: Manager Ultimatum / Reserve Squad Threat
      soundEngine.playError();
      setActiveModal({
        player,
        actionTitle: '⚠️ Manager Ultimatum & Reserve Threat',
        actionType: 'transfer_request',
        outcomeBadge: {
          text: 'RESERVE DEMOTION THREAT',
          bg: 'bg-red-500/20',
          border: 'border-red-500/40',
          textColor: 'text-red-300'
        },
        clubName: player.clubName,
        speakerName: 'Head Coach',
        speakerRole: `Manager of ${player.clubName}`,
        speakerAvatar: '🧢',
        quote: `"Submitting a transfer request mid-season destroys squad unity! If ${player.name} doesn't retract this request immediately, he will train with the Under-18s for the rest of the year!"`,
        bodyText: `The manager is furious and threatens to bench ${player.name}. Stand firm to force a discounted exit or retract the request to salvage team relations.`,
        choices: [
          {
            id: 'stand_firm_force',
            label: 'Stand Firm & Force Immediate Exit (-35% Fee)',
            description: 'Ignite a total exit clash. Player is listed at 35% discount, but suffers morale hit.',
            variant: 'red',
            action: () => {
              soundEngine.playSuccess();
              const updated: Player = {
                ...player,
                morale: Math.max(10, player.morale - 20),
                unrest: {
                  status: 'transfer_requested',
                  reason: 'manager_clash',
                  reasonLabel: 'Manager Fallout Exit (-35%)',
                  discontentLevel: 98,
                  description: `Total breakdown with ${player.clubName} manager! Listed at a heavy 35% discount.`,
                  discountPercent: 35
                }
              };
              onUpdatePlayer(updated);
              closeModal();
              onOpenTransferModal(updated);
            }
          },
          {
            id: 'retract_apologize',
            label: 'Withdraw Request & De-escalate',
            description: 'Back down to protect player playing time. Discontent level drops to 45%.',
            variant: 'sky',
            action: () => {
              const updated: Player = {
                ...player,
                morale: Math.max(10, player.morale - 15),
                unrest: {
                  ...player.unrest!,
                  status: 'discontent',
                  discontentLevel: 45,
                  description: `Withdrew transfer request to avoid U-18 demotion at ${player.clubName}.`
                }
              };
              onUpdatePlayer(updated);
              closeModal();
            }
          }
        ]
      });
    }
  };

  // 2. ACTION: OPEN CUSTOM CONTRACT NEGOTIATION SUITE
  const handleRenegotiateWageUpgrade = (player: Player) => {
    if (player.lastContractNegotiationWeek === agency.currentWeek && player.lastContractNegotiationSeason === agency.currentSeason) {
      alert(`⚠️ Board Protocol: You have already submitted contract negotiations for ${player.name} in matchweek ${agency.currentWeek}. Advance the week before re-opening contract talks.`);
      return;
    }

    soundEngine.playClick();
    setCustomContractPlayer(player);
    setReqWage(Math.round(player.wage * 1.35));
    setReqYears(Math.max(2, player.contractYears + 1));
    setReqReleaseClause(player.clauses?.releaseClause || Math.round(player.value * 1.5));
    setReqCommission(player.agentCommission || 10);
  };

  // 3. ACTION: LEAK ROW TO TABLOIDS
  const handleLeakToPressDarkArts = (player: Player) => {
    soundEngine.playClick();
    const roll = Math.random();

    if (roll < 0.50) {
      // Outcome A: Sensational Front Page Headline
      soundEngine.playSuccess();
      setActiveModal({
        player,
        actionTitle: '📰 Tabloid Leak Explosive Success',
        actionType: 'tabloid_leak',
        outcomeBadge: {
          text: 'MEDIA STORM IGNITED',
          bg: 'bg-purple-500/20',
          border: 'border-purple-500/40',
          textColor: 'text-purple-300'
        },
        clubName: player.clubName,
        speakerName: 'Sports Editor',
        speakerRole: 'Daily Football Gazette',
        speakerAvatar: '🗞️',
        quote: `"FRONT PAGE NEWS: 'DRESSING ROOM WAR AT ${player.clubName.toUpperCase()}! ${player.name.toUpperCase()} ACCUSES BOARD OF BROKEN PROMISES!' Headlines dominate international media."`,
        bodyText: `The press leak created an irresistible media frenzy. Under immense public pressure, ${player.clubName} agrees to list ${player.name} with a 35% discount!`,
        choices: [
          {
            id: 'capitalize_media_frenzy',
            label: 'Capitalize on Media Frenzy (Open Market)',
            description: 'Transfer list client with a 35% discount fee.',
            variant: 'purple',
            action: () => {
              const updated: Player = {
                ...player,
                unrest: {
                  status: 'transfer_requested',
                  reason: 'manager_clash',
                  reasonLabel: 'Media Storm & Tabloid Row (-35%)',
                  discontentLevel: 98,
                  description: `Sensational tabloid leak exposed dressing room row at ${player.clubName}! Valuation slashed by 35%.`,
                  discountPercent: 35
                }
              };
              onUpdatePlayer(updated);
              closeModal();
              onOpenTransferModal(updated);
            }
          }
        ]
      });
    } else if (roll < 0.80) {
      // Outcome B: Official Club Fine
      const fineAmount = Math.round(player.wage * 2);
      soundEngine.playError();
      setActiveModal({
        player,
        actionTitle: '🚨 Club Reprimand & Official Fine',
        actionType: 'tabloid_leak',
        outcomeBadge: {
          text: 'CLUB FINE ISSUED',
          bg: 'bg-red-500/20',
          border: 'border-red-500/40',
          textColor: 'text-red-300'
        },
        clubName: player.clubName,
        speakerName: 'Press Officer',
        speakerRole: `Media Relations - ${player.clubName}`,
        speakerAvatar: '📣',
        quote: `"${player.clubName} strictly condemns unauthorized press leaks. We have officially fined ${player.name} 2 weeks' wages (€${formatMoney(fineAmount)}) for breach of contract conduct!"`,
        bodyText: `${player.clubName} retaliated with a formal fine. You can pay your client's fine out of agency funds to build massive loyalty, or tell him to accept it.`,
        choices: [
          {
            id: 'pay_client_fine',
            label: `Pay Client's Fine (€${formatMoney(fineAmount)})`,
            description: `Cover the €${formatMoney(fineAmount)} fine from agency balance. Client loyalty skyrockets (+25) and forces 30% discount exit!`,
            variant: 'emerald',
            action: () => {
              if (agencyBalance < fineAmount) {
                alert(`Insufficient agency balance! Need €${formatMoney(fineAmount)}.`);
                return;
              }
              soundEngine.playSuccess();
              adjustAgencyFunds(-fineAmount, 2);
              const updated: Player = {
                ...player,
                morale: Math.min(100, player.morale + 25),
                loyalty: Math.min(100, (player.loyalty || 70) + 25),
                unrest: {
                  status: 'transfer_requested',
                  reason: 'manager_clash',
                  reasonLabel: 'Agency Backed Exit (-30%)',
                  discontentLevel: 90,
                  description: `Agency paid ${player.name}'s €${formatMoney(fineAmount)} fine after press leaks. Listed with 30% discount.`,
                  discountPercent: 30
                }
              };
              onUpdatePlayer(updated);
              closeModal();
              onOpenTransferModal(updated);
            }
          },
          {
            id: 'accept_fine_punishment',
            label: 'Tell Client to Comply with Fine',
            description: 'Client accepts fine. Discontent remains high (85%) without price discount.',
            variant: 'amber',
            action: () => {
              const updated: Player = {
                ...player,
                morale: Math.max(10, player.morale - 20),
                unrest: {
                  ...player.unrest!,
                  status: 'discontent',
                  discontentLevel: 85,
                  description: `Fined 2 weeks' wages by ${player.clubName} following tabloid leak.`
                }
              };
              onUpdatePlayer(updated);
              closeModal();
            }
          }
        ]
      });
    } else {
      // Outcome C: PR Counter-Attack Hits Agency Reputation
      soundEngine.playError();
      setActiveModal({
        player,
        actionTitle: '📉 Club PR Counter-Attack',
        actionType: 'tabloid_leak',
        outcomeBadge: {
          text: 'AGENCY REPUTATION HIT',
          bg: 'bg-red-500/20',
          border: 'border-red-500/40',
          textColor: 'text-red-300'
        },
        clubName: player.clubName,
        speakerName: 'PR Communications Director',
        speakerRole: `Corporate PR - ${player.clubName}`,
        speakerAvatar: '🎙️',
        quote: `"The stories circulating in the tabloid press are baseless fabrications engineered by greedy agent representatives seeking artificial transfer commissions!"`,
        bodyText: `${player.clubName}'s PR machine launched a counter-strike accusing your agency of destabilizing players. Agency reputation drops by -5 points unless you hire a crisis PR firm (€15,000).`,
        choices: [
          {
            id: 'hire_crisis_pr',
            label: 'Hire Crisis PR Firm (€15,000)',
            description: 'Cleanse agency reputation hit and turn pressure back on the board for a 30% discount exit.',
            variant: 'purple',
            action: () => {
              if (agencyBalance < 15000) {
                alert('Insufficient agency funds (€15,000 needed)!');
                return;
              }
              soundEngine.playSuccess();
              adjustAgencyFunds(-15000, 3);
              const updated: Player = {
                ...player,
                unrest: {
                  status: 'transfer_requested',
                  reason: 'manager_clash',
                  reasonLabel: 'PR Campaign Exit (-30%)',
                  discontentLevel: 92,
                  description: `Crisis PR campaign forced ${player.clubName} onto the defensive. Listed with 30% discount.`,
                  discountPercent: 30
                }
              };
              onUpdatePlayer(updated);
              closeModal();
              onOpenTransferModal(updated);
            }
          },
          {
            id: 'weather_pr_storm',
            label: 'Weather the PR Storm (-5 Rep)',
            description: 'Accept minor reputation damage without spending agency funds.',
            variant: 'sky',
            action: () => {
              adjustAgencyFunds(0, -5);
              const updated: Player = {
                ...player,
                unrest: {
                  ...player.unrest!,
                  status: 'discontent',
                  discontentLevel: 80,
                  description: `Absorbed PR counter-attack from ${player.clubName}.`
                }
              };
              onUpdatePlayer(updated);
              closeModal();
            }
          }
        ]
      });
    }
  };

  // 4. ACTION: PACIFY WITH LUXURY RETREAT (€15,000)
  const handlePacifyClient = (player: Player) => {
    soundEngine.playClick();
    if (agencyBalance < 15000) {
      soundEngine.playError();
      alert('Need €15,000 in agency balance for private client luxury dinner & strategy retreat!');
      return;
    }

    const roll = Math.random();

    if (roll < 0.45) {
      // Outcome A: Strategic Breakthrough (-40 Discontent)
      soundEngine.playSuccess();
      adjustAgencyFunds(-15000, 1);
      setActiveModal({
        player,
        actionTitle: '🍾 5-Star Strategy Dinner Success!',
        actionType: 'pacify',
        outcomeBadge: {
          text: 'CLIENT PACIFIED (-40 DISCONTENT)',
          bg: 'bg-emerald-500/20',
          border: 'border-emerald-500/40',
          textColor: 'text-emerald-300'
        },
        clubName: player.clubName,
        speakerName: player.name,
        speakerRole: `Client (${player.position})`,
        speakerAvatar: player.flag || '⚽',
        quote: `"Thank you, agent! Spending this evening reviewing my long-term career roadmap showed me you truly care about my future. I'll stay focused and perform on the pitch!"`,
        bodyText: `The 5-star retreat was a huge success. ${player.name}'s discontent dropped by 40 points, restoring team focus.`,
        choices: [
          {
            id: 'finish_pacify_success',
            label: 'Return to Business',
            description: 'Apply discontent reduction and return to agency dashboard.',
            variant: 'emerald',
            action: () => {
              const curLevel = player.unrest?.discontentLevel || 50;
              const newLevel = Math.max(0, curLevel - 40);
              const updated: Player = {
                ...player,
                morale: Math.min(100, player.morale + 25),
                loyalty: Math.min(100, (player.loyalty || 70) + 15),
                unrest: {
                  ...player.unrest!,
                  status: newLevel < 20 ? 'content' : player.unrest?.status || 'discontent',
                  discontentLevel: newLevel,
                  description: newLevel < 20 ? 'Satisfied following agency strategy retreat.' : player.unrest?.description
                }
              };
              onUpdatePlayer(updated);
              closeModal();
            }
          }
        ]
      });
    } else if (roll < 0.80) {
      // Outcome B: Temporary Reassurance (-18 Discontent)
      soundEngine.playClick();
      adjustAgencyFunds(-15000, 0);
      setActiveModal({
        player,
        actionTitle: '🥂 Partial Relief: "Get Me Results!"',
        actionType: 'pacify',
        outcomeBadge: {
          text: 'PARTIAL RELIEF (-18 DISCONTENT)',
          bg: 'bg-amber-500/20',
          border: 'border-amber-500/40',
          textColor: 'text-amber-300'
        },
        clubName: player.clubName,
        speakerName: player.name,
        speakerRole: `Client (${player.position})`,
        speakerAvatar: player.flag || '⚽',
        quote: `"I appreciate the champagne and luxury resort, agent. But I still need real playing time or a contract extension within 4 weeks!"`,
        bodyText: `${player.name} appreciated the gesture, but warns that actual board actions are required soon. Discontent dropped by 18 points.`,
        choices: [
          {
            id: 'finish_pacify_partial',
            label: 'Promise Results & Conclude Meeting',
            description: 'Apply partial discontent reduction.',
            variant: 'amber',
            action: () => {
              const curLevel = player.unrest?.discontentLevel || 50;
              const newLevel = Math.max(0, curLevel - 18);
              const updated: Player = {
                ...player,
                morale: Math.min(100, player.morale + 10),
                unrest: {
                  ...player.unrest!,
                  status: newLevel < 20 ? 'content' : player.unrest?.status || 'discontent',
                  discontentLevel: newLevel
                }
              };
              onUpdatePlayer(updated);
              closeModal();
            }
          }
        ]
      });
    } else {
      // Outcome C: Unimpressed Client Demand
      soundEngine.playError();
      adjustAgencyFunds(-15000, 0);
      setActiveModal({
        player,
        actionTitle: '😤 Client Unimpressed by Distractions',
        actionType: 'pacify',
        outcomeBadge: {
          text: 'CLIENT UNIMPRESSED',
          bg: 'bg-red-500/20',
          border: 'border-red-500/40',
          textColor: 'text-red-300'
        },
        clubName: player.clubName,
        speakerName: player.name,
        speakerRole: `Client (${player.position})`,
        speakerAvatar: player.flag || '⚽',
        quote: `"Fancy dinners won't fix my bench-warming at ${player.clubName}! I need real action with the board, not luxury distractions!"`,
        bodyText: `${player.name} wants concrete contract or transfer action. You can refund €15,000 as a personal loyalty bonus or promise an immediate board meeting.`,
        choices: [
          {
            id: 'refund_loyalty_bonus',
            label: 'Pay €15,000 Loyalty Bonus to Client',
            description: 'Transfer €15,000 directly to player as a bonus. Loyalty rises (+20) and discontent drops by 15 points.',
            variant: 'emerald',
            action: () => {
              soundEngine.playSuccess();
              const curLevel = player.unrest?.discontentLevel || 50;
              const newLevel = Math.max(0, curLevel - 15);
              const updated: Player = {
                ...player,
                morale: Math.min(100, player.morale + 15),
                loyalty: Math.min(100, (player.loyalty || 70) + 20),
                unrest: {
                  ...player.unrest!,
                  status: newLevel < 20 ? 'content' : player.unrest?.status || 'discontent',
                  discontentLevel: newLevel
                }
              };
              onUpdatePlayer(updated);
              closeModal();
            }
          },
          {
            id: 'promise_board_escalation',
            label: 'Promise Immediate Board Meeting Next Week',
            description: 'Client agrees to hold out 1 week before escalating discontent.',
            variant: 'sky',
            action: () => {
              const updated: Player = {
                ...player,
                morale: Math.min(100, player.morale + 5),
                unrest: {
                  ...player.unrest!,
                  description: `Awaiting promised agency board intervention at ${player.clubName}.`
                }
              };
              onUpdatePlayer(updated);
              closeModal();
            }
          }
        ]
      });
    }
  };

  // -------------------------------------------------------------------------
  // PR Crisis Damage Control & Mistake Correction Suite
  // -------------------------------------------------------------------------
  const handleDeployCrisisPR = (player: Player) => {
    const isAgent = !agency?.activeRoles?.currentRole || agency.activeRoles.currentRole === 'agent';
    if (!isAgent) {
      alert('Governance Lock: Only player agents can contract PR agencies for client representation.');
      return;
    }
    const cost = 35000;
    if (agencyBalance < cost) {
      alert(`Insufficient agency funds! Hiring a top-tier Crisis PR team costs ${formatMoney(cost)}.`);
      return;
    }

    if (agency && onUpdateAgency) {
      onUpdateAgency({
        ...agency,
        balance: Math.max(0, agency.balance - cost),
        reputation: Math.min(100, agency.reputation + 6)
      });
    }

    const currentScandal = player.personalLife?.scandalLevel || 0;
    const currentDiscontent = player.unrest?.discontentLevel || 50;

    const updated: Player = {
      ...player,
      morale: Math.min(100, player.morale + 20),
      loyalty: Math.min(100, (player.loyalty || 70) + 15),
      personalLife: {
        ...player.personalLife,
        scandalLevel: Math.max(0, currentScandal - 45)
      },
      unrest: player.unrest ? {
        ...player.unrest,
        status: currentDiscontent - 40 <= 15 ? 'content' : 'discontent',
        discontentLevel: Math.max(0, currentDiscontent - 40),
        description: `PR Crisis team sanitized media narratives. ${player.name} feels supported by agency.`
      } : undefined
    };

    onUpdatePlayer(updated);
    soundEngine.playSuccess();
    alert(`📢 Crisis PR Deployed! Cleaned up press controversy, reduced scandal by 45%, and pacified locker-room friction.`);
  };

  const handleCoachPeaceSummit = (player: Player) => {
    const isAgent = !agency?.activeRoles?.currentRole || agency.activeRoles.currentRole === 'agent';
    if (!isAgent) {
      alert('Governance Lock: Only player agents can conduct bilateral coach summits on behalf of clients.');
      return;
    }

    const updated: Player = {
      ...player,
      morale: Math.min(100, player.morale + 25),
      loyalty: Math.min(100, (player.loyalty || 70) + 10),
      unrest: {
        status: 'content',
        reason: 'manager_clash',
        reasonLabel: 'Peace Pact',
        discontentLevel: 0,
        discountPercent: 0,
        description: `Peace summit successful: Head coach at ${player.clubName} guaranteed starter minutes and tactical clarity.`
      }
    };

    onUpdatePlayer(updated);
    soundEngine.playSuccess();
    alert(`🤝 Coach Peace Summit Concluded! ${player.name} has been guaranteed playing time and discontent has been completely cleared!`);
  };

  const handleEmergencyRetentionGrant = (player: Player) => {
    const isAgent = !agency?.activeRoles?.currentRole || agency.activeRoles.currentRole === 'agent';
    if (!isAgent) {
      alert('Governance Lock: Only player agents can issue representation loyalty grants.');
      return;
    }
    const bonusCost = 25000;
    if (agencyBalance < bonusCost) {
      alert(`Insufficient funds! Emergency retention grant requires ${formatMoney(bonusCost)}.`);
      return;
    }

    if (agency && onUpdateAgency) {
      onUpdateAgency({
        ...agency,
        balance: Math.max(0, agency.balance - bonusCost),
        reputation: Math.min(100, agency.reputation + 4)
      });
    }

    const updated: Player = {
      ...player,
      loyalty: 95,
      morale: 95,
      isTransferListed: false,
      unrest: {
        status: 'content',
        reason: 'underpaid_wage_dispute',
        reasonLabel: 'Loyalty Secured',
        discontentLevel: 0,
        discountPercent: 0,
        description: `Direct loyalty grant accepted. ${player.name} has reaffirmed 100% commitment to ${agency?.agencyName || 'our agency'}.`
      }
    };

    onUpdatePlayer(updated);
    soundEngine.playSuccess();
    alert(`💰 Loyalty Retention Bonus Granted! ${player.name}'s loyalty surged to 95%, cancelling all transfer demands.`);
  };

  const isAgentRole = !agency?.activeRoles?.currentRole || agency.activeRoles.currentRole === 'agent';

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border-2 border-red-500/80 p-5 rounded-3xl shadow-2xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 font-extrabold text-2xl animate-pulse shrink-0">
            🔥
          </div>
          <div>
            <h2 className="text-xl font-black text-red-100 flex items-center gap-2">
              <span>Client Unrest & Discontent Hotline</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Active discontent intervention center. Perform tactical negotiations, leak dressing-room rows to tabloids, demand contract raises, deploy crisis PR damage control, or host luxury retreats.
            </p>
          </div>
        </div>
      </div>

      {/* Role Exclusivity Governance Notice */}
      {!isAgentRole && (
        <div className="bg-amber-950/80 border-2 border-amber-500/80 rounded-2xl p-4 flex items-start gap-3 shadow-lg">
          <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-amber-200 uppercase tracking-wide">
              FIFA Governance Separation Protocol Active
            </h4>
            <p className="text-xs text-amber-300/90 leading-relaxed">
              You are currently acting as <strong>{agency?.activeRoles?.currentRole === 'fa_president' ? 'FA Federation President' : 'Club Owner'}</strong>. Intervening in private agency contract strikes, press leaks, and player unrest is strictly limited to licensed player agents under Article 19 conflict-of-interest regulations.
            </p>
          </div>
        </div>
      )}

      {unrestClients.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-4 shadow-xl">
          <div className="text-5xl">😌</div>
          <h3 className="font-extrabold text-slate-100 text-lg">All Clients Are Content & Satisfied!</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            No player is currently experiencing manager clashes or wage discontent. Check back as match weeks progress or manage squad rosters.
          </p>
          <button
            onClick={() => onOpenTab('my_players')}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-lg active:scale-95"
          >
            Return to Client Directory
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {unrestClients.map((client) => (
            <div
              key={`unrest_page_${client.id}`}
              className="bg-slate-900 border border-red-500/50 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden group hover:border-red-500/80 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl p-2 bg-slate-800 rounded-2xl border border-slate-700 shrink-0">
                    {client.flag || '⚽'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-white text-base">{client.name}</h3>
                      <span className="text-xs text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-bold uppercase">
                        {client.unrest?.reasonLabel || 'Discontent'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {client.position} | <strong className="text-slate-200">{client.clubName}</strong> | Weekly Wage: <span className="text-emerald-400 font-bold">{formatMoney(client.wage)}/wk</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-red-950/90 border border-red-500/60 px-3.5 py-1.5 rounded-2xl self-start sm:self-auto shadow-inner">
                  <span className="text-xs text-red-300 font-extrabold uppercase">Discontent:</span>
                  <span className="text-base font-black text-red-400">{client.unrest?.discontentLevel}%</span>
                </div>
              </div>

              <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-2">
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  "{client.unrest?.description}"
                </p>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-red-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${client.unrest?.discontentLevel || 70}%` }}
                  />
                </div>
              </div>

              {/* Action Interventions Suite */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Select Agent Intervention Strategy:
                  </p>
                  {!isAgentRole && (
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
                      <Lock className="w-3 h-3" /> Role Locked (Agent Only)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    disabled={!isAgentRole}
                    onClick={() => handleForceTransferRequest(client)}
                    className={`text-xs font-bold p-3.5 rounded-2xl transition flex items-center justify-between gap-2 shadow-lg group ${
                      !isAgentRole
                        ? 'bg-slate-800/60 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white cursor-pointer active:scale-98'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {!isAgentRole ? <Lock className="w-4 h-4 text-slate-500" /> : <Zap className="w-4 h-4 text-amber-300" />}
                      <span>Submit Transfer Request</span>
                    </span>
                    <span className="text-[10px] bg-red-950/80 border border-red-400/30 px-2 py-0.5 rounded font-black text-red-200">
                      -30% Fee
                    </span>
                  </button>

                  <button
                    disabled={!isAgentRole}
                    onClick={() => handleRenegotiateWageUpgrade(client)}
                    className={`text-xs font-bold p-3.5 rounded-2xl transition flex items-center justify-between gap-2 shadow-lg group ${
                      !isAgentRole
                        ? 'bg-slate-800/60 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white cursor-pointer active:scale-98'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {!isAgentRole ? <Lock className="w-4 h-4 text-slate-500" /> : <DollarSign className="w-4 h-4 text-emerald-300" />}
                      <span>Demand Wage Hike</span>
                    </span>
                    <span className="text-[10px] bg-emerald-950/80 border border-emerald-400/30 px-2 py-0.5 rounded font-black text-emerald-200">
                      +35% Pay
                    </span>
                  </button>

                  <button
                    disabled={!isAgentRole}
                    onClick={() => handleLeakToPressDarkArts(client)}
                    className={`text-xs font-bold p-3.5 rounded-2xl transition flex items-center justify-between gap-2 shadow-lg group ${
                      !isAgentRole
                        ? 'bg-slate-800/60 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white cursor-pointer active:scale-98'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {!isAgentRole ? <Lock className="w-4 h-4 text-slate-500" /> : <Newspaper className="w-4 h-4 text-purple-300" />}
                      <span>Leak Row to Tabloids</span>
                    </span>
                    <span className="text-[10px] bg-purple-950/80 border border-purple-400/30 px-2 py-0.5 rounded font-black text-purple-200">
                      Dark Arts
                    </span>
                  </button>

                  <button
                    disabled={!isAgentRole}
                    onClick={() => handlePacifyClient(client)}
                    className={`text-xs font-bold p-3.5 rounded-2xl transition flex items-center justify-between gap-2 shadow-md group ${
                      !isAgentRole
                        ? 'bg-slate-800/60 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-slate-600 cursor-pointer active:scale-98'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {!isAgentRole ? <Lock className="w-4 h-4 text-slate-500" /> : <Wine className="w-4 h-4 text-amber-400" />}
                      <span>Pacify with Retreat</span>
                    </span>
                    <span className="text-[10px] bg-slate-900 border border-slate-600 px-2 py-0.5 rounded font-black text-amber-300">
                      €15k Cost
                    </span>
                  </button>
                </div>

                {/* PR Crisis & Damage Control Suite */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <p className="text-[11px] font-extrabold uppercase text-sky-400 tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>PR Damage Control & Mistake Correction:</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      disabled={!isAgentRole}
                      onClick={() => handleDeployCrisisPR(client)}
                      className={`text-xs font-bold p-2.5 rounded-xl transition flex flex-col justify-between gap-1 shadow group ${
                        !isAgentRole
                          ? 'bg-slate-800/50 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                          : 'bg-sky-950/60 hover:bg-sky-900/80 text-sky-200 border border-sky-500/40 hover:border-sky-400 cursor-pointer active:scale-98'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-sky-300">
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                        <span>Deploy Crisis PR</span>
                      </div>
                      <span className="text-[10px] text-slate-400 text-left">
                        -45% Scandal • €35k
                      </span>
                    </button>

                    <button
                      disabled={!isAgentRole}
                      onClick={() => handleCoachPeaceSummit(client)}
                      className={`text-xs font-bold p-2.5 rounded-xl transition flex flex-col justify-between gap-1 shadow group ${
                        !isAgentRole
                          ? 'bg-slate-800/50 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                          : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-500/40 hover:border-emerald-400 cursor-pointer active:scale-98'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-emerald-300">
                        <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Coach Peace Summit</span>
                      </div>
                      <span className="text-[10px] text-slate-400 text-left">
                        Guarantees Starter Min
                      </span>
                    </button>

                    <button
                      disabled={!isAgentRole}
                      onClick={() => handleEmergencyRetentionGrant(client)}
                      className={`text-xs font-bold p-2.5 rounded-xl transition flex flex-col justify-between gap-1 shadow group ${
                        !isAgentRole
                          ? 'bg-slate-800/50 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                          : 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 border border-amber-500/40 hover:border-amber-400 cursor-pointer active:scale-98'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-amber-300">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Retention Grant</span>
                      </div>
                      <span className="text-[10px] text-slate-400 text-left">
                        95% Loyalty • €25k
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EXECUTIVE BOARDROOM CONTRACT NEGOTIATION SUITE */}
      {customContractPlayer && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setCustomContractPlayer(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-1 border-b border-slate-800 pb-4 pr-8">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Boardroom Negotiation Desk
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {customContractPlayer.clubName}
                </span>
              </div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span>Negotiate Terms for {customContractPlayer.name}</span>
              </h3>
              <p className="text-xs text-slate-400">
                OVR: <strong className="text-emerald-400">{customContractPlayer.rating}</strong> | Age: {customContractPlayer.age} | Current Wage: <strong className="text-amber-300">€{formatMoney(customContractPlayer.wage)}/wk</strong>
              </p>
            </div>

            {/* Negotiation Controls */}
            <div className="space-y-4">
              {/* Wage Slider & Quick Buttons */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Requested Weekly Wage</span>
                  </label>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    €{formatMoney(reqWage)}/wk
                  </span>
                </div>

                <input
                  type="range"
                  min={customContractPlayer.wage}
                  max={Math.round(customContractPlayer.wage * 3.5)}
                  step={1000}
                  value={reqWage}
                  onChange={(e) => setReqWage(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />

                <div className="flex gap-2 pt-1">
                  {[1.2, 1.35, 1.6, 2.0].map((multiplier) => {
                    const calculated = Math.round(customContractPlayer.wage * multiplier);
                    const pctLabel = `+${Math.round((multiplier - 1) * 100)}%`;
                    return (
                      <button
                        key={multiplier}
                        type="button"
                        onClick={() => setReqWage(calculated)}
                        className={`flex-1 text-[10px] font-bold py-1 px-2 rounded-lg border transition cursor-pointer ${
                          reqWage === calculated 
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {pctLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contract Length & Release Clause */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Contract Length */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Contract Duration</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((years) => (
                      <button
                        key={years}
                        type="button"
                        onClick={() => setReqYears(years)}
                        className={`flex-1 text-xs font-bold py-1.5 rounded-lg border transition cursor-pointer ${
                          reqYears === years
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {years}y
                      </button>
                    ))}
                  </div>
                </div>

                {/* Agent Commission */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Agency Fee Commission</label>
                  <div className="flex gap-1.5">
                    {[5, 8, 10, 12, 15].map((comm) => (
                      <button
                        key={comm}
                        type="button"
                        onClick={() => setReqCommission(comm)}
                        className={`flex-1 text-xs font-bold py-1.5 rounded-lg border transition cursor-pointer ${
                          reqCommission === comm
                            ? 'bg-purple-500 text-white border-purple-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {comm}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Release Clause Option */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Release Clause</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[
                    { label: 'None', val: undefined },
                    { label: '€20M', val: 20000000 },
                    { label: '€50M', val: 50000000 },
                    { label: '€80M', val: 80000000 },
                    { label: '€120M', val: 120000000 },
                    { label: '€200M', val: 200000000 }
                  ].map((clause) => (
                    <button
                      key={clause.label}
                      type="button"
                      onClick={() => setReqReleaseClause(clause.val)}
                      className={`text-[10px] font-bold py-1.5 rounded-lg border transition cursor-pointer ${
                        reqReleaseClause === clause.val
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {clause.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submission Actions */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                Select Negotiation Pace:
              </p>

              {/* Immediate Summit */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  const ratio = reqWage / customContractPlayer.wage;
                  const roll = Math.random();

                  if (ratio <= 1.30 || (ratio <= 1.50 && roll < 0.60)) {
                    // Accepted
                    soundEngine.playSuccess();
                    const updated: Player = {
                      ...customContractPlayer,
                      wage: reqWage,
                      contractYears: reqYears,
                      agentCommission: reqCommission,
                      clauses: {
                        ...customContractPlayer.clauses,
                        releaseClause: reqReleaseClause
                      },
                      morale: Math.min(100, customContractPlayer.morale + 30),
                      unrest: {
                        status: 'content',
                        reason: 'wants_new_challenge',
                        reasonLabel: 'New Contract Signed',
                        discontentLevel: 0,
                        description: `Signed fresh contract extension at €${formatMoney(reqWage)}/wk with ${customContractPlayer.clubName}.`,
                        discountPercent: 0
                      }
                    };
                    onUpdatePlayer(updated);
                    setCustomContractPlayer(null);
                    setActiveModal({
                      player: updated,
                      actionTitle: '✅ Immediate Board Approval!',
                      actionType: 'wage_demand',
                      outcomeBadge: {
                        text: 'CONTRACT SIGNED',
                        bg: 'bg-emerald-500/20',
                        border: 'border-emerald-500/40',
                        textColor: 'text-emerald-300'
                      },
                      clubName: customContractPlayer.clubName,
                      speakerName: 'Board Executive',
                      speakerRole: `Director at ${customContractPlayer.clubName}`,
                      speakerAvatar: '✍️',
                      quote: `"We have agreed to all requested terms for ${customContractPlayer.name}. The new deal is signed!"`,
                      bodyText: `New wage (€${formatMoney(reqWage)}/wk) and contract duration (${reqYears} years) registered with the league.`,
                      choices: [
                        {
                          id: 'close_success',
                          label: 'Acknowledge Contract Signing',
                          description: 'Return to agency squad management.',
                          variant: 'emerald',
                          action: () => closeModal()
                        }
                      ]
                    });
                  } else if (ratio <= 1.80 && roll < 0.80) {
                    // Counter offer
                    const counterW = Math.round(customContractPlayer.wage * 1.25);
                    soundEngine.playClick();
                    setActiveModal({
                      player: customContractPlayer,
                      actionTitle: '🤝 Board Counter-Offer',
                      actionType: 'wage_demand',
                      outcomeBadge: {
                        text: 'COUNTER PROPOSAL',
                        bg: 'bg-amber-500/20',
                        border: 'border-amber-500/40',
                        textColor: 'text-amber-300'
                      },
                      clubName: customContractPlayer.clubName,
                      speakerName: 'Finance Director',
                      speakerRole: `CFO at ${customContractPlayer.clubName}`,
                      speakerAvatar: '📊',
                      quote: `"Your demand of €${formatMoney(reqWage)}/wk exceeds our ceiling, but we offer €${formatMoney(counterW)}/wk on a ${reqYears}-year deal."`,
                      bodyText: `Accept the counter-offer or submit for multi-week review to pressure the board further.`,
                      choices: [
                        {
                          id: 'accept_counter',
                          label: `Accept Counter Deal (€${formatMoney(counterW)}/wk)`,
                          description: 'Sign counter-offer contract.',
                          variant: 'emerald',
                          action: () => {
                            soundEngine.playSuccess();
                            const updated: Player = {
                              ...customContractPlayer,
                              wage: counterW,
                              contractYears: reqYears,
                              agentCommission: reqCommission,
                              unrest: {
                                status: 'content',
                                reason: 'wants_new_challenge',
                                reasonLabel: 'Counter-Offer Signed',
                                discontentLevel: 0,
                                description: `Agreed to €${formatMoney(counterW)}/wk deal with ${customContractPlayer.clubName}.`,
                                discountPercent: 0
                              }
                            };
                            onUpdatePlayer(updated);
                            closeModal();
                          }
                        }
                      ]
                    });
                  } else {
                    // Rejected
                    soundEngine.playError();
                    setActiveModal({
                      player: customContractPlayer,
                      actionTitle: '❌ Demands Flatly Rejected',
                      actionType: 'wage_demand',
                      outcomeBadge: {
                        text: 'SUMMIT REJECTED',
                        bg: 'bg-red-500/20',
                        border: 'border-red-500/40',
                        textColor: 'text-red-300'
                      },
                      clubName: customContractPlayer.clubName,
                      speakerName: 'Club President',
                      speakerRole: `President at ${customContractPlayer.clubName}`,
                      speakerAvatar: '🛑',
                      quote: `"Demanding €${formatMoney(reqWage)}/wk is unrealistic for our payroll! We refuse this deal."`,
                      bodyText: `The board rejected the sudden wage hike summit.`,
                      choices: [
                        {
                          id: 'close_rej',
                          label: 'Acknowledge Rejection',
                          description: 'Exit boardroom session.',
                          variant: 'red',
                          action: () => closeModal()
                        }
                      ]
                    });
                  }
                  setCustomContractPlayer(null);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs p-3.5 rounded-2xl transition cursor-pointer flex items-center justify-between gap-2 shadow-lg active:scale-98"
              >
                <div className="text-left">
                  <p className="font-extrabold text-xs">⚡ Demand Immediate Board Summit</p>
                  <p className="text-[10px] text-emerald-100 font-normal">Force instant decision on wage €{formatMoney(reqWage)}/wk</p>
                </div>
                <Zap className="w-4 h-4 text-emerald-200" />
              </button>

              {/* Multi-Week Review */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSuccess();
                  const updated: Player = {
                    ...customContractPlayer,
                    ongoingContractNegotiation: {
                      requestedWage: reqWage,
                      requestedYears: reqYears,
                      requestedReleaseClause: reqReleaseClause,
                      requestedCommission: reqCommission,
                      weeksRemaining: 2,
                      status: 'pending_board',
                      notes: `Submitted formal contract extension proposal (€${formatMoney(reqWage)}/wk, ${reqYears}yrs) for board deliberation.`
                    }
                  };
                  onUpdatePlayer(updated);
                  setCustomContractPlayer(null);
                  setActiveModal({
                    player: updated,
                    actionTitle: '⏳ Submitted for Multi-Week Board Review',
                    actionType: 'wage_demand',
                    outcomeBadge: {
                      text: 'UNDER BOARD DELIBERATION (2 WEEKS)',
                      bg: 'bg-sky-500/20',
                      border: 'border-sky-500/30',
                      textColor: 'text-sky-300'
                    },
                    clubName: customContractPlayer.clubName,
                    speakerName: 'Board Secretary',
                    speakerRole: `Executive Committee at ${customContractPlayer.clubName}`,
                    speakerAvatar: '📜',
                    quote: `"Your proposal for €${formatMoney(reqWage)}/wk has been placed on the agenda for our upcoming board meetings over the next 2-3 weeks."`,
                    bodyText: `The negotiation is now ongoing! Each week as you advance time, the board will deliberate and present a final response or counter-offer.`,
                    choices: [
                      {
                        id: 'ack_multiweek',
                        label: 'Acknowledge Multi-Week Process',
                        description: 'Return to dashboard and continue weekly matchdays.',
                        variant: 'sky',
                        action: () => closeModal()
                      }
                    ]
                  });
                }}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black text-xs p-3.5 rounded-2xl transition cursor-pointer flex items-center justify-between gap-2 shadow-lg active:scale-98"
              >
                <div className="text-left">
                  <p className="font-extrabold text-xs">⏳ Submit Proposal for Multi-Week Board Review</p>
                  <p className="text-[10px] text-sky-100 font-normal">Safe deliberation process over 2-3 matchweeks</p>
                </div>
                <ChevronRight className="w-4 h-4 text-sky-200" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE NEGOTIATION & CLUB RESPONSE MODAL */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Title & Outcome Badge */}
            <div className="space-y-2 border-b border-slate-800 pb-4">
              <div className="flex items-center justify-between gap-2 pr-8">
                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${activeModal.outcomeBadge.bg} ${activeModal.outcomeBadge.border} ${activeModal.outcomeBadge.textColor}`}>
                  {activeModal.outcomeBadge.text}
                </span>
                <span className="text-xs text-slate-400 font-mono font-bold">
                  {activeModal.clubName}
                </span>
              </div>
              <h3 className="text-xl font-black text-white">{activeModal.actionTitle}</h3>
            </div>

            {/* Speaker Quote Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl p-2 bg-slate-800 rounded-xl border border-slate-700">
                  {activeModal.speakerAvatar}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">{activeModal.speakerName}</h4>
                  <p className="text-[10px] text-slate-400">{activeModal.speakerRole}</p>
                </div>
              </div>

              <blockquote className="text-xs text-amber-300 italic font-serif leading-relaxed border-l-2 border-amber-500 pl-3 py-0.5">
                {activeModal.quote}
              </blockquote>

              <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
                {activeModal.bodyText}
              </p>
            </div>

            {/* Interactive Choices */}
            <div className="space-y-2.5 pt-1">
              <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                Select Your Decision:
              </p>
              <div className="space-y-2">
                {activeModal.choices.map((choice) => {
                  let btnStyle = 'bg-emerald-600 hover:bg-emerald-500 text-white';
                  if (choice.variant === 'amber') btnStyle = 'bg-amber-600 hover:bg-amber-500 text-white';
                  if (choice.variant === 'red') btnStyle = 'bg-red-600 hover:bg-red-500 text-white';
                  if (choice.variant === 'purple') btnStyle = 'bg-purple-600 hover:bg-purple-500 text-white';
                  if (choice.variant === 'sky') btnStyle = 'bg-sky-600 hover:bg-sky-500 text-white';

                  return (
                    <button
                      key={choice.id}
                      onClick={choice.action}
                      className={`w-full text-left p-3.5 rounded-2xl transition cursor-pointer flex items-center justify-between gap-3 shadow-lg active:scale-98 ${btnStyle}`}
                    >
                      <div>
                        <p className="font-extrabold text-xs">{choice.label}</p>
                        <p className="text-[10px] opacity-90 mt-0.5 leading-snug">{choice.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0 opacity-80" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

