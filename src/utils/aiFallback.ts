import { Player, Club } from '../types';

export interface BackstoryResult {
  biography: string;
  careerHistory: Array<{
    season: string;
    clubName: string;
    appearances: number;
    goals: number;
    assists: number;
    transferFee: string;
  }>;
  isAiGenerated: boolean;
}

export interface ScoutReportResult {
  report: string;
  isAiGenerated: boolean;
}

export interface NegotiateTalkResult {
  chairmanReply?: string;
  feedback: any;
  isAiGenerated: boolean;
}

/**
 * Procedural fallback player career history.
 */
export function generateFallbackCareerHistory(player: Player) {
  if (!player) return [];
  const history = [];
  const club = player.clubName || 'Youth Academy';
  const age = player.age || 20;

  history.push({
    season: '2025/26',
    clubName: club,
    appearances: player.stats?.appearances || 18,
    goals: player.stats?.goals || 4,
    assists: player.stats?.assists || 3,
    transferFee: 'Current Squad'
  });

  if (age >= 19) {
    history.push({
      season: '2024/25',
      clubName: club,
      appearances: 28,
      goals: Math.max(1, (player.stats?.goals || 3) + 2),
      assists: Math.max(1, (player.stats?.assists || 2) + 1),
      transferFee: 'Signed for €' + (((player.value || 10000000) * 0.7) / 1000000).toFixed(1) + 'M'
    });
  }

  if (age >= 21) {
    history.push({
      season: '2023/24',
      clubName: `${player.nationality || 'Local'} Youth FC`,
      appearances: 22,
      goals: 5,
      assists: 4,
      transferFee: 'Academy Graduate'
    });
  }

  return history;
}

/**
 * Generate client-side procedural biography and career history (no backend required).
 */
export function generateClientPlayerBackstory(player: Player): BackstoryResult {
  const nicknames: Record<string, string> = {
    ST: 'The Fox in the Box',
    CF: 'The Targetman',
    RW: 'The Flash',
    LW: 'The Wing Wizard',
    CAM: 'The Playmaker',
    CM: 'The Engine Room',
    CDM: 'The Destroyer',
    CB: 'The Iron Wall',
    LB: 'The Overlapper',
    RB: 'The Flank Patrol',
    GK: 'The Safe Hands'
  };

  const nickname = nicknames[player.position] || 'The Maestro';
  const traitsText = player.traits && player.traits.length > 0 ? player.traits.join(', ') : 'explosive agility and tactical discipline';

  const bio = `${player.name} grew up in ${player.nationality}, first catching national attention on youth tournament pitches before entering the professional football pyramid. Renowned as a ${player.position} with ${traitsText}, supporters and coaching staff affectionately call them "${nickname}". Off the training pitch, ${player.name} is deeply invested in personal conditioning, family life, and sports charity initiatives.`;

  return {
    biography: bio.slice(0, 350), // Cap length to save storage
    careerHistory: generateFallbackCareerHistory(player),
    isAiGenerated: false
  };
}

/**
 * Generate client-side realistic scout report (no backend required).
 */
export function generateClientScoutReport(player: Player, scoutName?: string): ScoutReportResult {
  const scout = scoutName || 'Chief Scout Expert';
  const valM = (player.value / 1000000).toFixed(1);

  const reportText = `[${scout} Confidential Dossier]\nPlayer: ${player.name} (${player.position}, Age ${player.age}) | Valuation: €${valM}M\n\n• Technical: Exhibits commanding presence and sharp positional instinct. Current rating ${player.rating}/99.\n• Ceiling: Projected potential ceiling of ${player.potential}/99. High ceiling for resale capital appreciation.\n• Agent Recommendation: Secure long-term contract extensions with moderate buyout clauses.`;

  return {
    report: reportText.slice(0, 350),
    isAiGenerated: false
  };
}

/**
 * Generate client-side negotiation dialogue and board feedback (no backend required).
 */
export function generateClientNegotiationFeedback(
  player: Player,
  club: Club,
  agentOffer: any
): NegotiateTalkResult {
  const offeredFee = agentOffer?.transferFee || 10000000;
  const offeredWage = agentOffer?.wage || 50000;
  const playerVal = player?.value || 20000000;
  const isStarter = (player?.rating || 75) >= 80;

  const isAccepted = offeredFee >= playerVal * 0.92;
  const isCounter = offeredFee >= playerVal * 0.65;

  const quote = isAccepted
    ? `We have consulted with our executive board. Your valuation of €${(offeredFee / 1000000).toFixed(1)}M meets our target criteria. We sanction this transfer move and are prepared to finalize paperwork.`
    : isCounter
    ? `Your proposal of €${(offeredFee / 1000000).toFixed(1)}M is below our benchmark valuation of €${(playerVal / 1000000).toFixed(1)}M. We require enhanced upfront guarantees and future sell-on protection.`
    : `An offer of €${(offeredFee / 1000000).toFixed(1)}M is wholly insufficient for a talent of this calibre. We will not entertain discussions without a substantially improved bid.`;

  const feedback = {
    verdict: isAccepted ? 'accepted' : isCounter ? 'counter_offer' : 'rejected_valuation',
    statusLabel: isAccepted ? 'Offer Sanctioned & Agreed' : isCounter ? 'Counter-Proposal Formulated' : 'Rejected: Valuation Gap',
    responseQuote: quote,
    directorName: club?.sportingDirectorProfile?.name || `${club?.name || 'Club'} Sporting Director`,
    directorRole: club?.sportingDirectorProfile?.personality || 'Chief Negotiator',
    valuationAssessment: {
      offeredFee,
      expectedFee: playerVal,
      gapAmount: Math.max(0, playerVal - offeredFee),
      verdict: isAccepted ? 'fair' : isCounter ? 'below_valuation' : 'insulting',
      reasoning: `Offered €${(offeredFee / 1000000).toFixed(1)}M vs benchmark €${(playerVal / 1000000).toFixed(1)}M.`
    },
    squadImportanceAssessment: {
      importance: isStarter ? 'Key Indispensable Starter' : 'Important Squad Player',
      tacticalReasoning: `${player?.name || 'Player'} has strategic tactical value in our senior squad.`
    },
    financialStructureAssessment: {
      cashflowVerdict: 'Requires structured installment guarantees and liquidity balance.',
      ffpRisk: offeredFee < playerVal * 0.6 ? 'high' : 'moderate'
    },
    suggestedAlternativeStructure: {
      counterTransferFee: Math.round(playerVal * 0.95),
      suggestedInstallmentUpfrontPercent: 65,
      suggestedSellOnPercent: 15,
      suggestedAddOnsAmount: Math.round(playerVal * 0.05),
      counterWage: Math.round(Math.max(offeredWage, (player?.wage || 40000) * 1.1)),
      summaryText: `Counter: €${((playerVal * 0.95) / 1000000).toFixed(1)}M (65% upfront), 15% sell-on, and bonus add-ons.`
    }
  };

  return {
    chairmanReply: quote,
    feedback,
    isAiGenerated: false
  };
}

/**
 * Universal safe fetcher with offline fallback for static GitHub Pages hosting.
 */
export async function safeFetchAi<T>(
  endpoint: string,
  payload: any,
  fallbackGenerator: () => T
): Promise<T> {
  // If hosted statically (e.g. GitHub Pages or file:// or when backend is down),
  // attempt fetch with a short 2.5s timeout. If network fails or returns 404/500, immediately return fallback.
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return fallbackGenerator();
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return fallbackGenerator();
    }

    const data = await res.json();
    return data as T;
  } catch (err) {
    // Network failure, static host 404, or abort - gracefully invoke client fallback
    return fallbackGenerator();
  }
}
