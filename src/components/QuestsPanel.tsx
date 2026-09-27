import React from 'react';
import { AgencyState, Quest } from '../types';
import { soundEngine } from '../utils/soundEffects';
import { formatMoney } from '../utils/gameEngine';
import { Trophy, CheckCircle, Target, Award, Sparkles, DollarSign, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuestsPanelProps {
  agency: AgencyState;
  onUpdateAgency: (agency: AgencyState) => void;
}

export const QuestsPanel: React.FC<QuestsPanelProps> = ({ agency, onUpdateAgency }) => {
  const quests = agency.quests || [];

  const handleClaimReward = (quest: Quest) => {
    if (agency.soundEnabled) soundEngine.playCashSound();
    confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });

    const updatedQuests = quests.map(q => q.id === quest.id ? { ...q, completed: true } : q);

    onUpdateAgency({
      ...agency,
      balance: agency.balance + quest.rewardMoney,
      reputation: Math.min(100, agency.reputation + quest.rewardReputation),
      quests: updatedQuests,
      milestones: [
        ...agency.milestones,
        {
          id: 'm_quest_' + Date.now(),
          week: agency.currentWeek,
          season: agency.currentSeason,
          title: `Quest Completed: ${quest.title}`,
          description: `Claimed +${formatMoney(quest.rewardMoney)} and +${quest.rewardReputation} Agency Reputation!`,
          type: 'quest'
        }
      ]
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Super-Agent Career Campaign Quests</h3>
            <p className="text-xs text-slate-400">Complete career milestones to unlock executive bonuses & reputation boosts.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quests.map((quest) => {
          const isReadyToClaim = !quest.completed && quest.currentCount >= quest.targetCount;
          const pct = Math.min(100, Math.round((quest.currentCount / quest.targetCount) * 100));

          return (
            <div
              key={quest.id}
              className={`p-4 rounded-xl border space-y-3 ${
                quest.completed 
                  ? 'bg-slate-950/60 border-slate-800 opacity-70' 
                  : isReadyToClaim 
                  ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/50' 
                  : 'bg-slate-800/60 border-slate-700/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-white text-sm">{quest.title}</h4>
                  <p className="text-xs text-slate-300 mt-0.5">{quest.description}</p>
                </div>
                {quest.completed && (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Done
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                  <span>Progress: {quest.currentCount.toLocaleString()} / {quest.targetCount.toLocaleString()}</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Reward & Action */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <div className="text-[11px] font-bold text-amber-300 flex items-center gap-2">
                  <span>🎁 Reward: +{formatMoney(quest.rewardMoney)}</span>
                  <span>•</span>
                  <span>+{quest.rewardReputation} Rep</span>
                </div>

                {isReadyToClaim && (
                  <button
                    onClick={() => handleClaimReward(quest)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded-lg text-xs transition cursor-pointer min-h-[36px] flex items-center gap-1 shadow-lg"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Claim</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
