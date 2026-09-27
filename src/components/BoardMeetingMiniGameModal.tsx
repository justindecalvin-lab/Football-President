import React, { useState } from 'react';
import { Club, PresidentialTransferProposal, AgencyState } from '../types';
import { formatMoney } from '../utils/gameEngine';
import {
  Building2,
  Users,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Sparkles,
  Award,
  Vote,
  FileText,
  DollarSign,
  AlertTriangle,
  Flame,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BoardMeetingMiniGameModalProps {
  proposal: PresidentialTransferProposal;
  club: Club;
  agency: AgencyState;
  onClose: () => void;
  onApproveSuccess: (proposalId: string) => void;
  onVetoOutcome: (proposalId: string) => void;
  addToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface BoardMemberRep {
  id: string;
  name: string;
  role: string;
  faction: 'Financial' | 'Commercial' | 'Sporting' | 'Supporters';
  avatar: string;
  approval: number; // 0 - 100
  initialApproval: number;
  priorityQuote: string;
  reaction?: string;
  voted?: 'aye' | 'nay';
}

interface PitchArgument {
  id: string;
  title: string;
  category: string;
  description: string;
  statement: string;
  financialImpact: number;
  commercialImpact: number;
  sportingImpact: number;
  supportersImpact: number;
}

const AVAILABLE_PITCHES: PitchArgument[] = [
  {
    id: 'installment_structure',
    title: '💼 Phased Installment Deferral',
    category: 'Fiscal Prudence',
    description: 'Structure fee across multi-year tranches, protecting immediate operating cashflow.',
    statement: '"By structuring this fee across 3 annual tranches with 50% upfront, our operating cashflow remains secure for day-to-day club operations."',
    financialImpact: 35,
    commercialImpact: 5,
    sportingImpact: 10,
    supportersImpact: 5
  },
  {
    id: 'commercial_boom',
    title: '🌟 Global Commercial & Jersey Boom',
    category: 'Brand Expansion',
    description: 'Leverage superstar appeal to secure lucrative international brand sponsorships and shirt sales.',
    statement: '"This marquee signing elevates our global brand stature, guaranteeing record shirt sales and high-value sponsorship renewals across Asia and America."',
    financialImpact: -5,
    commercialImpact: 40,
    sportingImpact: 15,
    supportersImpact: 25
  },
  {
    id: 'trophy_ambition',
    title: '🏆 Championship Ambition & UEFA Revenue',
    category: 'Sporting Excellence',
    description: 'Transformative talent required to secure European silverware and lucrative UEFA prize payouts.',
    statement: '"To win trophies and qualify for top-tier European competitions, we must invest in elite tier-1 talent. Champions League prize money will easily offset this fee."',
    financialImpact: 10,
    commercialImpact: 20,
    sportingImpact: 40,
    supportersImpact: 30
  },
  {
    id: 'resale_equity',
    title: '📈 High Future Resale Capital Gain',
    category: 'Asset Valuation',
    description: 'Young age profile guarantees significant asset appreciation and massive future transfer profit.',
    statement: '"At this age and potential, this player is an appreciating asset. If we decide to sell in 3 seasons, the market return will deliver substantial capital appreciation."',
    financialImpact: 25,
    commercialImpact: 20,
    sportingImpact: 15,
    supportersImpact: 5
  },
  {
    id: 'performance_bonuses',
    title: '🛡️ Risk-Mitigated Milestone Clauses',
    category: 'Risk Management',
    description: 'Tying high-end payments strictly to appearances, clean sheets, and trophy bonuses.',
    statement: '"We have protected the club by tying significant payment tranches to actual pitch performance, appearances, and trophy milestones. If they don\'t perform, we don\'t pay."',
    financialImpact: 30,
    commercialImpact: 10,
    sportingImpact: 15,
    supportersImpact: 10
  },
  {
    id: 'fan_icon',
    title: '🤝 Generational Fan Icon & Culture',
    category: 'Fan Engagement',
    description: 'Inspire the next generation of supporters and pack the stadium every home fixture.',
    statement: '"Our supporters deserve a hero who embodies the club\'s attacking identity. This signing will fill our stadium every matchday and ignite the entire city."',
    financialImpact: -10,
    commercialImpact: 25,
    sportingImpact: 20,
    supportersImpact: 40
  }
];

export const BoardMeetingMiniGameModal: React.FC<BoardMeetingMiniGameModalProps> = ({
  proposal,
  club,
  agency,
  onClose,
  onApproveSuccess,
  onVetoOutcome,
  addToast
}) => {
  const treasuryRatio = Math.round((proposal.negotiatedFee / Math.max(1, club.transferBudget)) * 100);

  const [members, setMembers] = useState<BoardMemberRep[]>([
    {
      id: 'm1',
      name: 'Lady Eleanor Vance',
      role: 'Chief Financial Trustee',
      faction: 'Financial',
      avatar: '🧐',
      approval: Math.max(20, 70 - Math.round(treasuryRatio * 0.4)),
      initialApproval: Math.max(20, 70 - Math.round(treasuryRatio * 0.4)),
      priorityQuote: `"Spending ${treasuryRatio}% of our liquid reserves on a single transaction introduces alarming cashflow vulnerability."`
    },
    {
      id: 'm2',
      name: 'Marco Benetti',
      role: 'Commercial Strategy Director',
      faction: 'Commercial',
      avatar: '💼',
      approval: proposal.playerRating >= 80 ? 65 : 45,
      initialApproval: proposal.playerRating >= 80 ? 65 : 45,
      priorityQuote: `"We need players who sell tickets and expand our international merchandising profile."`
    },
    {
      id: 'm3',
      name: 'Sir Thomas Sterling',
      role: 'Legend Trustee & Sporting Adviser',
      faction: 'Sporting',
      avatar: '🏆',
      approval: proposal.playerRating >= 78 ? 70 : 40,
      initialApproval: proposal.playerRating >= 78 ? 70 : 40,
      priorityQuote: `"If this player elevates our starting eleven to challenge for titles, the fee is justified."`
    },
    {
      id: 'm4',
      name: 'Dave Jenkins',
      role: 'Supporters\' Trust Representative',
      faction: 'Supporters',
      avatar: '📢',
      approval: 50,
      initialApproval: 50,
      priorityQuote: `"The fans want ambitious signings, but not if it bankrupts the club or prices out working-class supporters."`
    }
  ]);

  const [deliveredPitches, setDeliveredPitches] = useState<string[]>([]);
  const [activeSpeech, setActiveSpeech] = useState<string | null>(null);
  const [meetingPhase, setMeetingPhase] = useState<'pitching' | 'voting' | 'concluded'>('pitching');
  const [voteOutcome, setVoteOutcome] = useState<'approved' | 'vetoed' | null>(null);
  const [isTallying, setIsTallying] = useState(false);

  const maxPitches = 3;
  const remainingPitches = maxPitches - deliveredPitches.length;

  const handleDeliverPitch = (pitch: PitchArgument) => {
    if (deliveredPitches.includes(pitch.id) || deliveredPitches.length >= maxPitches) return;

    setActiveSpeech(pitch.statement);

    const updatedMembers = members.map((m) => {
      let delta = 0;
      let reaction = '';

      if (m.faction === 'Financial') {
        delta = pitch.financialImpact;
        reaction = delta > 0 ? 'Acknowledges prudent fiscal safeguards.' : 'Expresses concern regarding balance sheet exposure.';
      } else if (m.faction === 'Commercial') {
        delta = pitch.commercialImpact;
        reaction = delta > 0 ? 'Impressed by revenue growth projections.' : 'Notes limited international branding upside.';
      } else if (m.faction === 'Sporting') {
        delta = pitch.sportingImpact;
        reaction = delta > 0 ? 'Excited by tactical quality and title contention.' : 'Questions immediate first-team impact.';
      } else if (m.faction === 'Supporters') {
        delta = pitch.supportersImpact;
        reaction = delta > 0 ? 'Rallied by passion and fan-first commitment.' : 'Remains cautious on ticket price implications.';
      }

      const newApproval = Math.min(100, Math.max(0, m.approval + delta));
      return {
        ...m,
        approval: newApproval,
        reaction
      };
    });

    setMembers(updatedMembers);
    setDeliveredPitches([...deliveredPitches, pitch.id]);
  };

  const handleCallVote = () => {
    setMeetingPhase('voting');
    setIsTallying(true);

    setTimeout(() => {
      let ayes = 0;
      let nays = 0;

      const votedMembers = members.map((m) => {
        const isAye = m.approval >= 50;
        if (isAye) ayes++;
        else nays++;
        return {
          ...m,
          voted: (isAye ? 'aye' : 'nay') as 'aye' | 'nay'
        };
      });

      setMembers(votedMembers);
      setIsTallying(false);
      setMeetingPhase('concluded');

      const isPassed = ayes >= 3; // Majority of 4 (at least 3 ayes)
      setVoteOutcome(isPassed ? 'approved' : 'vetoed');

      if (isPassed) {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
        if (addToast) addToast(`🏛️ Board Resolution PASSED (${ayes} Ayes to ${nays} Nays)! Transfer authorized!`, 'success');
      } else {
        if (addToast) addToast(`❌ Board Resolution VETOED (${ayes} Ayes to ${nays} Nays). Deal blocked by trustees.`, 'error');
      }
    }, 1200);
  };

  const handleFinalizeApproval = () => {
    onApproveSuccess(proposal.id);
  };

  const handleFinalizeVeto = () => {
    onVetoOutcome(proposal.id);
  };

  const avgApproval = Math.round(members.reduce((acc, m) => acc + m.approval, 0) / members.length);

  return (
    <div className="fixed inset-0 bg-slate-950/95 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-indigo-500/50 w-full max-w-3xl rounded-3xl p-5 sm:p-6 shadow-2xl relative space-y-5 my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center text-3xl shadow-inner shrink-0">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Extraordinary Board Chamber
                </span>
                <span className="text-xs text-rose-400 font-bold">
                  Major Capital Expenditure Mandate
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Board Authorization Hearing: {proposal.playerName}
              </h2>
              <p className="text-xs text-slate-300">
                Transfer Fee: <strong className="text-emerald-400">{formatMoney(proposal.negotiatedFee)}</strong> ({treasuryRatio}% of club treasury <strong className="text-slate-200">{formatMoney(club.transferBudget)}</strong>)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Treasury Alert Banner */}
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-950 to-indigo-950/60 border border-amber-500/40 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-300">Governance Policy Enforced:</span>
              <p className="text-slate-300 text-[11px]">
                Deals exceeding 50% of treasury require presidential justification and majority approval (at least 3 of 4 votes).
              </p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl text-center shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Chamber Consensus</span>
            <p className={`text-base font-black ${avgApproval >= 60 ? 'text-emerald-400' : avgApproval >= 45 ? 'text-amber-400' : 'text-rose-400'}`}>
              {avgApproval}% Favorable
            </p>
          </div>
        </div>

        {/* Scrollable Chamber Content */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {/* Board Member Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map((m) => {
              const factionColor =
                m.faction === 'Financial'
                  ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                  : m.faction === 'Commercial'
                  ? 'border-amber-500/30 bg-amber-950/20 text-amber-300'
                  : m.faction === 'Sporting'
                  ? 'border-indigo-500/30 bg-indigo-950/20 text-indigo-300'
                  : 'border-sky-500/30 bg-sky-950/20 text-sky-300';

              return (
                <div
                  key={m.id}
                  className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${factionColor}`}>
                      {m.faction} Faction
                    </span>

                    {m.voted ? (
                      <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${
                        m.voted === 'aye' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                      }`}>
                        Voted: {m.voted.toUpperCase()}
                      </span>
                    ) : (
                      <span className={`text-xs font-black ${m.approval >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {m.approval}% {m.approval >= 50 ? 'Support' : 'Objection'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                      {m.avatar}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{m.name}</h4>
                      <p className="text-[10px] text-slate-400">{m.role}</p>
                    </div>
                  </div>

                  {/* Dynamic Reaction or Default Priority Quote */}
                  <p className="text-[11px] text-slate-300 italic bg-slate-900/90 p-2 rounded-xl border border-slate-800/80 leading-relaxed">
                    {m.reaction ? `💬 "${m.reaction}"` : m.priorityQuote}
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${m.approval >= 50 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                      style={{ width: `${m.approval}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Presidential Speech Display */}
          {activeSpeech && (
            <div className="bg-indigo-950/40 border border-indigo-500/40 p-3.5 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase text-indigo-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Presidential Address to the Board:</span>
              </span>
              <p className="text-xs text-slate-200 italic leading-relaxed">{activeSpeech}</p>
            </div>
          )}

          {/* Interactive Pitch Deck Selection */}
          {meetingPhase === 'pitching' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Deliver Strategic Boardroom Defense ({remainingPitches} Arguments Remaining)</span>
                </h4>
                <span className="text-[11px] text-slate-400">Select up to {maxPitches} arguments</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AVAILABLE_PITCHES.map((pitch) => {
                  const isUsed = deliveredPitches.includes(pitch.id);
                  const isMaxReached = deliveredPitches.length >= maxPitches && !isUsed;

                  return (
                    <button
                      key={pitch.id}
                      type="button"
                      onClick={() => handleDeliverPitch(pitch)}
                      disabled={isUsed || isMaxReached}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                        isUsed
                          ? 'bg-slate-950/40 border-slate-800 opacity-50 cursor-not-allowed'
                          : isMaxReached
                          ? 'bg-slate-950/60 border-slate-800 opacity-40 cursor-not-allowed'
                          : 'bg-slate-900 hover:bg-slate-800/90 border-slate-700 hover:border-amber-400 shadow-md'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">{pitch.title}</span>
                          <span className="text-[10px] font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                            {pitch.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1">{pitch.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                        <span>{isUsed ? '✓ Argument Delivered' : 'Click to Present'}</span>
                        <ArrowRight className="w-3 h-3 text-amber-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Voting Phase Outcome Banner */}
          {meetingPhase === 'concluded' && voteOutcome && (
            <div className={`p-5 rounded-3xl border-2 space-y-3 ${
              voteOutcome === 'approved'
                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                : 'bg-rose-950/60 border-rose-500/60 text-rose-200'
            }`}>
              <div className="flex items-center gap-3">
                {voteOutcome === 'approved' ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
                )}
                <div>
                  <h3 className="text-base font-black text-white">
                    {voteOutcome === 'approved' ? 'Resolution Approved by Board of Directors' : 'Resolution Vetoed by Board of Directors'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {voteOutcome === 'approved'
                      ? 'The trustees have granted formal executive authority to complete the transfer.'
                      : 'The board has rejected the motion due to excessive balance sheet exposure.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 shrink-0">
          <p className="text-[11px] text-slate-400 text-center sm:text-left">
            {meetingPhase === 'pitching'
              ? `${deliveredPitches.length}/${maxPitches} arguments presented to the chamber.`
              : meetingPhase === 'voting'
              ? 'Roll-call tally in progress...'
              : 'Hearing officially concluded.'}
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {meetingPhase === 'pitching' && (
              <button
                type="button"
                onClick={handleCallVote}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <Vote className="w-4 h-4" />
                <span>Call Chamber Vote on Motion</span>
              </button>
            )}

            {meetingPhase === 'concluded' && voteOutcome === 'approved' && (
              <button
                type="button"
                onClick={handleFinalizeApproval}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Execute Authorized Transfer Deal</span>
              </button>
            )}

            {meetingPhase === 'concluded' && voteOutcome === 'vetoed' && (
              <button
                type="button"
                onClick={handleFinalizeVeto}
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white font-black px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Record Board Veto in Minutes</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
