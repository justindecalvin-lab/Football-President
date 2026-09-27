import React, { useState } from 'react';
import { Player, AgencyState } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { soundEngine } from '../utils/soundEffects';
import { 
  UserCheck, 
  Sparkles, 
  DollarSign, 
  TrendingUp, 
  ShieldAlert, 
  X, 
  Award, 
  Flame, 
  CheckCircle2, 
  AlertCircle,
  Percent,
  MessageSquare,
  ShieldCheck,
  Zap,
  RefreshCw,
  Heart,
  UserPlus,
  Compass,
  FileCheck,
  Scale,
  Briefcase,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlayerPitchNegotiationModalProps {
  player: Player;
  agency: AgencyState;
  onClose: () => void;
  onSuccessSign: (player: Player, updatedAgency: AgencyState) => void;
}

export const PlayerPitchNegotiationModal: React.FC<PlayerPitchNegotiationModalProps> = ({
  player,
  agency,
  onClose,
  onSuccessSign
}) => {
  const rating = player.rating || 75;
  const potential = player.potential || 85;
  const age = player.age || 22;

  const isWonderkid = player.traits?.includes('Wonderkid Prospect') || age <= 20;
  const isSuperstar = rating >= 84;
  const isDiscontent = (player.morale ?? 70) < 55;

  // Poaching check
  const isCurrentlyRepresented = player.agencyName && 
    player.agencyName !== 'Unrepresented Representative' && 
    player.agencyName !== 'Unrepresented' &&
    player.agencyName !== agency.agencyName;

  // Demands baseline
  const maxTolerableCommission = isSuperstar ? 7 : isWonderkid ? 8 : 10;
  const baseTargetBonus = isSuperstar ? 650000 : isWonderkid ? 300000 : 120000;
  const buyoutFee = isCurrentlyRepresented ? Math.min(1500000, Math.max(100000, Math.round(player.value * 0.05))) : 0;

  // Archetype & Questions
  const archetype = isSuperstar 
    ? 'World-Class Superstar' 
    : isWonderkid 
      ? 'Wonderkid Prodigy' 
      : isDiscontent 
        ? 'Discontented Rebel' 
        : 'Professional Senior';

  // Modal Step State
  const [pitchStage, setPitchStage] = useState<'demands' | 'package' | 'vetting' | 'rival_poach'>('demands');

  // Terms State
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [signingBonus, setSigningBonus] = useState<number>(baseTargetBonus);
  const [promiseUclMove, setPromiseUclMove] = useState<boolean>(isSuperstar);
  const [promiseWageHike, setPromiseWageHike] = useState<boolean>(true);
  const [lowReleaseClausePromise, setLowReleaseClausePromise] = useState<boolean>(isWonderkid);
  const [dedicatedPrTeam, setDedicatedPrTeam] = useState<boolean>(false);
  const [familyBribe, setFamilyBribe] = useState<boolean>(false);
  const [payBuyoutFee, setPayBuyoutFee] = useState<boolean>(isCurrentlyRepresented);

  // Vetting Q&A Answer
  const [selectedVettingAnswer, setSelectedVettingAnswer] = useState<number | null>(null);

  // Negotiation Rounds & Dialogue
  const [negotiationRound, setNegotiationRound] = useState<number>(1);
  const [negotiationStatus, setNegotiationStatus] = useState<'negotiating' | 'counter' | 'rejected' | 'signed'>('negotiating');
  const [playerDialogue, setPlayerDialogue] = useState<string | null>(null);

  // Total Upfront Agency Cost
  const totalFinancialCost = signingBonus + 
    (dedicatedPrTeam ? 80000 : 0) + 
    (familyBribe ? 200000 : 0) + 
    (payBuyoutFee ? buyoutFee : 0);

  // Calculate Satisfaction Score (Realistic FIFA Standards & Agent Clout)
  const calculateSatisfaction = () => {
    let score = 20; // Rigorous baseline

    // Agency Reputation vs Player Rating (High standards for stars)
    const repAdvantage = (agency.reputation || 35) - rating;
    score += Math.round(repAdvantage * 0.75);

    // FIFA Licensing Tier Requirement for Superstars & Wonderkids
    const licenseTier = agency.fifaLicense?.tier || 'national';
    if (isSuperstar) {
      if (licenseTier === 'fifa_global') score += 15;
      else if (licenseTier === 'uefa') score += 5;
      else score -= 25; // Superstars refuse agents without continental/global license
    } else if (isWonderkid) {
      if (licenseTier === 'fifa_global' || licenseTier === 'uefa') score += 10;
    }

    // Commission Penalty / Reward (Players hate commissions > 8%, strictly capped by FIFA)
    if (commissionRate <= 4) score += 25;
    else if (commissionRate <= 6) score += 15;
    else if (commissionRate <= 8) score += 4;
    else if (commissionRate <= 10) score -= 15;
    else if (commissionRate >= 14) score -= 40;
    else score -= 28;

    // Signing Bonus Ratio (Superstars and wonderkids demand significant upfront financial proof)
    const bonusRatio = signingBonus / Math.max(1, baseTargetBonus);
    if (bonusRatio >= 1.5) score += 20;
    else if (bonusRatio >= 1.0) score += 8;
    else if (bonusRatio < 0.8) score -= 30;

    // Career Promises
    if (promiseUclMove) score += isSuperstar ? 16 : 8;
    if (promiseWageHike) score += 8;
    if (lowReleaseClausePromise) score += isWonderkid ? 14 : 6;
    if (dedicatedPrTeam) score += 8;
    if (familyBribe) score += 16;

    // Vetting answer
    if (selectedVettingAnswer === 0) score += 10;
    else if (selectedVettingAnswer === 1) score += 6;
    else if (selectedVettingAnswer === 2) score += 3;

    // Poaching Buyout & Loyalty Resistance
    if (isCurrentlyRepresented) {
      const rivalLoyalty = player.agencyLoyalty ?? 65;
      if (payBuyoutFee) score += 8;
      else score -= 50; // Impossible to poach without paying contract buyout fee
      if (rivalLoyalty > 75) score -= 20; // Strongly attached to current agent
    }

    if (isDiscontent) score += 20;

    return Math.min(92, Math.max(5, score));
  };

  const satisfactionScore = calculateSatisfaction();

  // Dynamic live feedback
  const getLivePlayerFeedback = () => {
    if (playerDialogue) return playerDialogue;

    const licenseTier = agency.fifaLicense?.tier || 'national';
    if (isSuperstar && licenseTier === 'national') {
      return `"An 84+ Superstar requires a FIFA Global or UEFA licensed agency with international jurisdiction. You only hold a National permit."`;
    }
    if (commissionRate > maxTolerableCommission) {
      return `"${commissionRate}% commission is unacceptable for my caliber. We demand maximum ${maxTolerableCommission}% under FIFA rules!"`;
    }
    if (signingBonus < baseTargetBonus * 0.75) {
      return `"An upfront bonus of ${formatMoney(signingBonus)} is below my expectation (${formatMoney(baseTargetBonus)} minimum)."`;
    }
    if (isCurrentlyRepresented && !payBuyoutFee) {
      return `"I am legally bound to ${player.agencyName}. If you don't pay the ${formatMoney(buyoutFee)} buyout fee, my agency will sue!"`;
    }
    if (satisfactionScore >= 75) {
      return `"Your agency's vision for my development is top-notch! The terms and guarantees look very strong."`;
    }
    if (satisfactionScore >= 50) {
      return `"The proposal is reasonable, but I need stronger contractual guarantees before committing."`;
    }
    return `"I have serious doubts about whether ${agency.agencyName} has the clout to handle my career."`;
  };

  // Submit Final Proposal
  const handleExecuteProposal = () => {
    if (agency.activeRoles?.currentRole && agency.activeRoles.currentRole !== 'agent') {
      alert('🔒 Governance Restriction: Only an active Agent can sign and represent players. FA Presidents and Club Presidents cannot act as commercial player agents under FIFA integrity regulations.');
      return;
    }

    if (agency.balance < totalFinancialCost) {
      alert(`Insufficient agency funds! You need ${formatMoney(totalFinancialCost)} in capital to execute this proposal.`);
      return;
    }

    if (agency.soundEnabled) soundEngine.playClickSound();

    const roll = Math.floor(Math.random() * 100) + 1;
    const isSuccess = roll <= satisfactionScore;

    const newBalance = agency.balance - totalFinancialCost;
    const scandalDelta = familyBribe ? 12 : 0;

    if (isSuccess) {
      if (agency.soundEnabled) soundEngine.playCashSound();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setNegotiationStatus('signed');

      const updatedClauses = {
        ...(player.clauses || {}),
        ...(lowReleaseClausePromise ? { releaseClause: Math.round((player.value || 10000000) * 1.15) } : {}),
        ...(promiseUclMove ? { championsLeagueBonus: 750000 } : {}),
        ...(promiseWageHike ? { loyaltyBonus: Math.round((player.wage || 40000) * 20) } : {})
      };

      const signedPlayer: Player = {
        ...player,
        isMyClient: true,
        agencyName: agency.agencyName,
        agentCommission: commissionRate,
        clauses: updatedClauses,
        morale: Math.min(100, (player.morale || 70) + 20),
        loyalty: 85,
        lastPitchWeek: agency.currentWeek,
        lastPitchSeason: agency.currentSeason,
        personalLife: {
          ...player.personalLife,
          endorsementEarnings: (player.personalLife?.endorsementEarnings || 0) + (dedicatedPrTeam ? 40000 : 0)
        }
      };

      const updatedAgency: AgencyState = {
        ...agency,
        balance: newBalance,
        reputation: Math.min(100, agency.reputation + (isSuperstar ? 5 : isWonderkid ? 4 : 2)),
        darkArtsScore: agency.darkArtsScore + scandalDelta
      };

      setTimeout(() => {
        onSuccessSign(signedPlayer, updatedAgency);
        onClose();
      }, 1200);

    } else {
      // Counter offer logic
      if (negotiationRound < 3 && satisfactionScore >= 40) {
        setNegotiationRound(prev => prev + 1);
        setNegotiationStatus('counter');

        let counterText = '';
        if (commissionRate > maxTolerableCommission) {
          counterText = `"${player.name}'s Entourage: 'We demand max ${maxTolerableCommission}% agent commission and a sign-on bonus of at least ${formatMoney(Math.round(baseTargetBonus * 1.15))}. Adjust terms!'"`;
          setCommissionRate(maxTolerableCommission);
          setSigningBonus(Math.round(baseTargetBonus * 1.15));
        } else {
          counterText = `"${player.name}: 'Guarantee a UCL Move and dedicated PR team or talks are over!'"`;
          setPromiseUclMove(true);
          setDedicatedPrTeam(true);
        }
        setPlayerDialogue(counterText);
      } else {
        setNegotiationStatus('rejected');
        setPlayerDialogue(`"REJECTED! ${player.name} and his advisors walked out of negotiations. Pitch failed."`);

        const updatedAgency: AgencyState = {
          ...agency,
          balance: newBalance,
          darkArtsScore: agency.darkArtsScore + scandalDelta
        };

        const rejectedPlayer: Player = {
          ...player,
          lastPitchWeek: agency.currentWeek,
          lastPitchSeason: agency.currentSeason
        };

        setTimeout(() => {
          onSuccessSign(rejectedPlayer, updatedAgency);
          onClose();
        }, 1800);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-5 relative text-white my-auto max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-4 pr-8 shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-amber-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shrink-0 border border-white/20">
            {rating}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <UserPlus className="w-3 h-3 text-amber-400" />
                <span>{isCurrentlyRepresented ? 'Poach Client Negotiation' : 'Agency Representation Pitch'}</span>
              </span>
              <span className="text-xs text-slate-400">{player.position} • Age {age} • OVR {rating} / POT {potential}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{player.name}</h2>
            <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
              <span>Club: <strong className="text-amber-400">{player.clubName || 'Free Agent'}</strong></span>
              <span>•</span>
              <span>Valuation: <strong className="text-emerald-400">{formatMoney(player.value)}</strong></span>
            </p>
          </div>
        </div>

        {/* Multi-Stage Stepper Navigation */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800 text-xs shrink-0">
          <button
            onClick={() => setPitchStage('demands')}
            className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
              pitchStage === 'demands' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>1. Player Demands</span>
          </button>

          <button
            onClick={() => setPitchStage('package')}
            className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
              pitchStage === 'package' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>2. Financial Package</span>
          </button>

          <button
            onClick={() => setPitchStage('vetting')}
            className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
              pitchStage === 'vetting' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>3. Strategy Vetting</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {/* STAGE 1: PLAYER DEMANDS & INITIAL STANCE */}
          {pitchStage === 'demands' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> Archetype: {archetype}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Agency Rep: <strong className="text-emerald-400">{agency.reputation}</strong> / Player: <strong className="text-amber-400">{rating}</strong>
                  </span>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                  <p className="font-bold text-white">Client Opening Stance:</p>
                  <p className="italic">
                    {rating > (agency.reputation + 25)
                      ? `"${player.name}: 'My advisors are skeptical that ${agency.agencyName} has enough global clout for a player of my calibre. You will need to offer significant upfront signing incentives and career promises to convince me.'"`
                      : `"${player.name}: 'I am looking for an ambitious agent who will fight for my starting minutes, secure top endorsements, and keep commission cuts reasonable.'"`}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400">Min. Expected Sign-on Bonus:</span>
                    <p className="text-sm font-bold text-amber-300">{formatMoney(baseTargetBonus)}</p>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400">Max Tolerable Agent Cut:</span>
                    <p className="text-sm font-bold text-blue-300">{maxTolerableCommission}% Max</p>
                  </div>
                </div>

                <button
                  onClick={() => setPitchStage('package')}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-md"
                >
                  <span>Proceed to Customize Package & Guarantees</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STAGE 2: FINANCIAL TERMS & CAREER GUARANTEES */}
          {pitchStage === 'package' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                {/* Commission Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-bold">Proposed Agent Commission:</span>
                    <strong className={`font-black ${commissionRate <= maxTolerableCommission ? 'text-emerald-400' : 'text-red-400'}`}>
                      {commissionRate}%
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="18"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>4% (Player Friendly)</span>
                    <span>{maxTolerableCommission}% (Expected Cap)</span>
                    <span>18% (Greedy Cut)</span>
                  </div>
                </div>

                {/* Sign-on Bonus Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-bold">Upfront Sign-on Bonus (Paid from Agency Balance):</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      Math.round(baseTargetBonus * 0.6),
                      baseTargetBonus,
                      Math.round(baseTargetBonus * 1.5)
                    ].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setSigningBonus(amt)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          signingBonus === amt
                            ? 'bg-emerald-600 text-white border-emerald-400'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {formatMoney(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Career Promises Checkboxes */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <p className="text-xs font-bold text-slate-300">Contract Promises & Representation Perks:</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={promiseUclMove}
                        onChange={(e) => setPromiseUclMove(e.target.checked)}
                        className="rounded accent-indigo-500"
                      />
                      <span>🏆 Guarantee UCL Move in 1 Yr</span>
                    </label>

                    <label className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={promiseWageHike}
                        onChange={(e) => setPromiseWageHike(e.target.checked)}
                        className="rounded accent-indigo-500"
                      />
                      <span>💰 Guarantee +30% Wage Raise</span>
                    </label>

                    <label className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lowReleaseClausePromise}
                        onChange={(e) => setLowReleaseClausePromise(e.target.checked)}
                        className="rounded accent-indigo-500"
                      />
                      <span>🔓 Low Release Clause Protection</span>
                    </label>

                    <label className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dedicatedPrTeam}
                        onChange={(e) => setDedicatedPrTeam(e.target.checked)}
                        className="rounded accent-indigo-500"
                      />
                      <span>📢 PR Sponsorship Team (€80K)</span>
                    </label>
                  </div>
                </div>

                {/* Poach Buyout if represented */}
                {isCurrentlyRepresented && (
                  <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" /> Rival Agency Contract Buyout Fee
                      </span>
                      <span className="font-mono text-amber-400 font-bold">{formatMoney(buyoutFee)}</span>
                    </div>
                    <label className="flex items-center gap-2 text-slate-300 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={payBuyoutFee}
                        onChange={(e) => setPayBuyoutFee(e.target.checked)}
                        className="accent-amber-500"
                      />
                      <span>Pay full buyout penalty to release player from {player.agencyName}</span>
                    </label>
                  </div>
                )}

                <button
                  onClick={() => setPitchStage('vetting')}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-md"
                >
                  <span>Proceed to Strategy Vetting Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STAGE 3: STRATEGY VETTING Q&A */}
          {pitchStage === 'vetting' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <h4 className="font-bold text-xs text-white">Client Philosophical Test Question</h4>
                </div>

                <p className="text-xs text-slate-300 italic bg-slate-900 p-3 rounded-xl border border-slate-800">
                  "{player.name}: 'If a European powerhouse bids for me next window but my club manager refuses to let me leave, what is your representation strategy?'"
                </p>

                <div className="space-y-2 text-xs">
                  {[
                    { text: '"We negotiate directly with the sporting director and structure an irresistible release clause package."', desc: 'Diplomatic & Project Oriented (+12 Pitch Score)' },
                    { text: '"We use media leverage and fan sentiment to force the board into accepting the bid."', desc: 'Aggressive Market Mover (+8 Pitch Score)' },
                    { text: '"We advise patience and secure a massive wage renewal in the meantime."', desc: 'Conservative Financial Stabilizer (+5 Pitch Score)' }
                  ].map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedVettingAnswer(idx)}
                      className={`w-full p-3 rounded-xl text-left border transition cursor-pointer ${
                        selectedVettingAnswer === idx
                          ? 'bg-purple-900/60 border-purple-400 text-white shadow-lg'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      <p className="font-bold">{opt.text}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Feedback & Success Probability Footer */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Upfront Agency Cost:</span>
            <strong className="text-amber-400 text-sm font-black">{formatMoney(totalFinancialCost)}</strong>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-bold">Pitch Acceptance Probability:</span>
              <strong className={`font-black ${satisfactionScore >= 70 ? 'text-emerald-400' : satisfactionScore >= 45 ? 'text-amber-400' : 'text-red-400'}`}>
                {satisfactionScore}% Chance
              </strong>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  satisfactionScore >= 70 ? 'bg-emerald-500' : satisfactionScore >= 45 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${satisfactionScore}%` }}
              />
            </div>
          </div>

          {/* Live Player Feedback */}
          <p className="text-[11px] text-slate-300 italic">
            {getLivePlayerFeedback()}
          </p>

          {/* Submit Action */}
          <button
            type="button"
            onClick={handleExecuteProposal}
            disabled={negotiationStatus === 'signed' || negotiationStatus === 'rejected'}
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-xl disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4" />
            <span>Submit Representation Pitch (Round {negotiationRound}/3)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
