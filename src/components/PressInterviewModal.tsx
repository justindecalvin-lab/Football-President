import React, { useState } from 'react';
import { 
  X, 
  Mic, 
  Sparkles, 
  Flame, 
  Smile, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Radio, 
  Newspaper,
  ChevronRight
} from 'lucide-react';
import { PressInterview, PressInterviewOption, Player, AgencyState } from '../types';
import { formatMoney } from '../utils/gameEngine';

interface PressInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  interviews: PressInterview[];
  onAnswerInterview: (interviewId: string, optionIndex: number, outcome: PressInterviewOption) => void;
  players: Player[];
  agency: AgencyState;
}

export const PressInterviewModal: React.FC<PressInterviewModalProps> = ({
  isOpen,
  onClose,
  interviews,
  onAnswerInterview,
  players,
  agency
}) => {
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [hoveredTone, setHoveredTone] = useState<'Aggressive' | 'Diplomatic' | 'Humorous' | null>(null);
  const [resolvedOutcome, setResolvedOutcome] = useState<{
    interview: PressInterview;
    option: PressInterviewOption;
  } | null>(null);

  if (!isOpen) return null;

  const pendingInterviews = interviews.filter(i => !i.answered);
  const activeInterview = pendingInterviews.find(i => i.id === selectedInterviewId) || pendingInterviews[0];

  const handleSelectOption = (optionIndex: number, option: PressInterviewOption) => {
    if (!activeInterview) return;
    
    // Store resolved outcome for immediate feedback
    setResolvedOutcome({
      interview: activeInterview,
      option
    });

    onAnswerInterview(activeInterview.id, optionIndex, option);
  };

  const handleNext = () => {
    setResolvedOutcome(null);
    const nextPending = pendingInterviews.filter(i => i.id !== activeInterview?.id);
    if (nextPending.length > 0) {
      setSelectedInterviewId(nextPending[0].id);
    } else {
      onClose();
    }
  };

  // Find related player if applicable
  const relatedPlayer = activeInterview?.playerId 
    ? players.find(p => p.id === activeInterview.playerId) 
    : players.find(p => p.name === activeInterview?.playerName || p.name === activeInterview?.relatedPlayerName);

  // Generate tone-differentiated fallback options if not present
  const interviewOptions: PressInterviewOption[] = (activeInterview?.options && activeInterview.options.length >= 3)
    ? activeInterview.options
    : [
        {
          id: 'opt_agg',
          label: 'Aggressive Stance',
          tone: 'Aggressive',
          text: 'Demand immediate respect, challenge critics openly, and stand firm on high market value.',
          responseQuote: `"We know our true worth and we will not be held back by lowball offers or media double-standards. The world sees the quality, and it is time for the board to deliver what was promised."`,
          moraleDelta: 15,
          reputationDelta: 2,
          clubTrustDelta: -10,
          fanPopularityDelta: 15,
          darkArtsDelta: 5,
          impactSummary: '+15 Morale, +2 Agency Rep, -10 Club Board Trust, +15 Fan Hype'
        },
        {
          id: 'opt_dip',
          label: 'Diplomatic Response',
          tone: 'Diplomatic',
          text: 'Express loyalty to the badge, praise coaching staff, and defuse transfer rumors calmly.',
          responseQuote: `"Our primary focus is on the pitch and honoring the badge. We have immense respect for the manager, the club hierarchy, and the supporters. We take things one match at a time."`,
          moraleDelta: 5,
          reputationDelta: 1,
          clubTrustDelta: 12,
          fanPopularityDelta: 8,
          darkArtsDelta: 0,
          impactSummary: '+5 Morale, +12 Club Board Trust, +8 Supporter Trust, +1 Agency Rep'
        },
        {
          id: 'opt_hum',
          label: 'Humorous & Charismatic',
          tone: 'Humorous',
          text: 'Deliver a witty viral soundbite to disarm the press room and charm the public.',
          responseQuote: `"If I had a ten-euro coin for every sensational headline written this week, I would buy the private jet myself and fly the squad to Ibiza! Let us enjoy the football."`,
          moraleDelta: 10,
          reputationDelta: 3,
          clubTrustDelta: 2,
          fanPopularityDelta: 20,
          darkArtsDelta: 0,
          cashChange: 25000,
          impactSummary: '+10 Morale, +20 Viral Popularity, +3 Agency Rep, +€25k Viral Endorsement'
        }
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl flex items-center justify-center shadow-inner">
              <Mic className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold tracking-tight text-white">Interactive Press Conference Q&A</h2>
                <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-ping" /> LIVE BROADCAST
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Your responses dictate client morale, agency reputation, boardroom trust, and media narrative.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {pendingInterviews.length === 0 && !resolvedOutcome ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">No Pending Press Conferences</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                All journalists questions have been answered for this matchweek. Advance to the next week to receive breaking press invitations.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm rounded-xl transition-all"
              >
                Return to Dashboard
              </button>
            </div>
          ) : resolvedOutcome ? (
            /* Outcome Feedback View */
            <div className="space-y-6 animate-fadeIn">
              <div className="p-5 rounded-xl border bg-slate-800/60 border-slate-700 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">🎙️</span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Broadcast Headline</h4>
                      <p className="text-base font-bold text-white">
                        {resolvedOutcome.option.tone === 'Aggressive' ? '🔥 BOMBSHELL STATEMENT: Agent Demands Respect in Heated Press Room!' :
                         resolvedOutcome.option.tone === 'Humorous' ? '😂 VIRAL CLIP: Agent Lights Up Press Conference with Witty Quip!' :
                         '🤝 MEASURED DIPLOMACY: Agent Emphasizes Squad Unity and Commitment!'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider ${
                    resolvedOutcome.option.tone === 'Aggressive' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                    resolvedOutcome.option.tone === 'Humorous' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  }`}>
                    {resolvedOutcome.option.tone} Approach
                  </span>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 italic text-slate-200 text-sm leading-relaxed border-l-4 border-l-indigo-500">
                  {resolvedOutcome.option.responseQuote || resolvedOutcome.option.text}
                </div>

                {/* Stat Impact Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
                    <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Client Morale</div>
                      <div className="text-sm font-bold text-emerald-400">
                        {resolvedOutcome.option.moraleDelta ? `+${resolvedOutcome.option.moraleDelta}%` : '+5%'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
                    <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Agency Reputation</div>
                      <div className="text-sm font-bold text-indigo-400">
                        {resolvedOutcome.option.reputationDelta ? `+${resolvedOutcome.option.reputationDelta}` : '+1'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
                    <div className={`p-2 rounded-md ${
                      (resolvedOutcome.option.clubTrustDelta || 0) >= 0 ? 'bg-sky-500/10 text-sky-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {(resolvedOutcome.option.clubTrustDelta || 0) >= 0 ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Boardroom Trust</div>
                      <div className={`text-sm font-bold ${
                        (resolvedOutcome.option.clubTrustDelta || 0) >= 0 ? 'text-sky-400' : 'text-rose-400'
                      }`}>
                        {(resolvedOutcome.option.clubTrustDelta || 0) >= 0 ? `+${resolvedOutcome.option.clubTrustDelta || 5}` : `${resolvedOutcome.option.clubTrustDelta}`}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
                    <div className="p-2 rounded-md bg-amber-500/10 text-amber-400">
                      <Newspaper className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Media Buzz</div>
                      <div className="text-sm font-bold text-amber-400">
                        {resolvedOutcome.option.fanPopularityDelta ? `+${resolvedOutcome.option.fanPopularityDelta}%` : '+10%'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all transform active:scale-95"
                >
                  <span>{pendingInterviews.length > 1 ? 'Next Question' : 'Complete Conference'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Active Q&A Selection View */
            <div className="space-y-6">
              
              {/* Journalist & Question Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/80 via-slate-800/50 to-slate-900 border border-slate-700 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-xl font-bold text-indigo-300 shadow-inner">
                      {activeInterview.journalistAvatar || '🎙️'}
                    </div>
                    <div>
                      <div className="text-base font-bold text-white flex items-center gap-2">
                        {activeInterview.journalistName || 'Fabrizio Romano-Style'}
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-medium">
                          {activeInterview.mediaOutlet || 'Sky Sports Global'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Season {activeInterview.season || agency.currentSeason} • Week {activeInterview.week || agency.currentWeek}</span>
                        {relatedPlayer && (
                          <span className="text-indigo-400 font-medium">
                            Focus: {relatedPlayer.name} ({relatedPlayer.position}, {relatedPlayer.clubName})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Question Topic</span>
                    <span className="text-sm font-bold text-amber-300">
                      {activeInterview.topicTitle || 'Contract Rumors & Team Dynamics'}
                    </span>
                  </div>
                </div>

                {/* Question Bubble */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-slate-100 text-base font-medium leading-relaxed relative">
                  <span className="text-indigo-400 font-bold mr-2">Q:</span>
                  "{activeInterview.questionText || activeInterview.question || `With high-profile clubs expressing immense interest in ${relatedPlayer?.name || 'your star client'}, what is your agency's official stance regarding upcoming contract extension talks?`}"
                </div>
              </div>

              {/* Response Options Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Select Your Agency's Response Tone
                  </h3>
                  <span className="text-xs text-slate-400">Choose carefully — media reactions are instant</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {interviewOptions.map((opt, idx) => {
                    const tone = opt.tone || (idx === 0 ? 'Aggressive' : idx === 1 ? 'Diplomatic' : 'Humorous');
                    const isAgg = tone === 'Aggressive';
                    const isDip = tone === 'Diplomatic';
                    const isHum = tone === 'Humorous';

                    return (
                      <div
                        key={opt.id || idx}
                        onMouseEnter={() => setHoveredTone(tone)}
                        onMouseLeave={() => setHoveredTone(null)}
                        onClick={() => handleSelectOption(idx, { ...opt, tone })}
                        className={`group relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isAgg ? 'bg-slate-800/40 hover:bg-rose-950/30 border-slate-700/80 hover:border-rose-500/60 shadow-lg hover:shadow-rose-950/40' :
                          isDip ? 'bg-slate-800/40 hover:bg-sky-950/30 border-slate-700/80 hover:border-sky-500/60 shadow-lg hover:shadow-sky-950/40' :
                          'bg-slate-800/40 hover:bg-amber-950/30 border-slate-700/80 hover:border-amber-500/60 shadow-lg hover:shadow-amber-950/40'
                        } transform hover:-translate-y-1`}
                      >
                        <div className="space-y-3">
                          {/* Tone Header */}
                          <div className="flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                              isAgg ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                              isDip ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                              'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {isAgg ? <Flame className="w-3.5 h-3.5 text-rose-400" /> :
                               isDip ? <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> :
                               <Smile className="w-3.5 h-3.5 text-amber-400" />}
                              {tone} Tone
                            </span>
                            <span className="text-xs text-slate-500 font-mono">Option #{idx + 1}</span>
                          </div>

                          <h4 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors">
                            {opt.label}
                          </h4>

                          <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                            {opt.text}
                          </p>

                          {/* Quote Snippet Preview */}
                          {opt.responseQuote && (
                            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 italic">
                              {opt.responseQuote}
                            </div>
                          )}
                        </div>

                        {/* Projected Impact Preview */}
                        <div className="mt-4 pt-3 border-t border-slate-700/50 space-y-2">
                          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                            <span>Projected Impact:</span>
                            <span className={`font-mono text-xs ${
                              isAgg ? 'text-rose-400' : isDip ? 'text-sky-400' : 'text-amber-400'
                            }`}>
                              {opt.impactSummary || (
                                isAgg ? '+Morale / -Board Trust' :
                                isDip ? '+Board Trust / Steady' :
                                '+Hype & Endorsements'
                              )}
                            </span>
                          </div>

                          <button
                            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 ${
                              isAgg ? 'bg-rose-600/80 hover:bg-rose-600 text-white' :
                              isDip ? 'bg-sky-600/80 hover:bg-sky-600 text-white' :
                              'bg-amber-600/80 hover:bg-amber-600 text-white'
                            }`}
                          >
                            <span>Deliver Statement</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Representing <span className="text-white font-semibold">{agency.agencyName}</span> • Reputation {agency.reputation}/100
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Press Room Connected</span>
          </div>
        </div>

      </div>
    </div>
  );
};
