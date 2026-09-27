import React, { useState } from 'react';
import { RandomEvent, RandomEventOption, AgencyState, Player, Club } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { 
  X, 
  AlertTriangle, 
  Sparkles, 
  DollarSign, 
  Trophy, 
  ShieldCheck, 
  TrendingUp, 
  Flame, 
  CheckCircle2, 
  HelpCircle,
  Building2,
  Users,
  Zap,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RandomEventModalProps {
  event: RandomEvent | null;
  onClose: () => void;
  onActionTaken?: () => void;
  agency: AgencyState;
  setAgency: React.Dispatch<React.SetStateAction<AgencyState>>;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  clubs: Club[];
  setClubs: React.Dispatch<React.SetStateAction<Club[]>>;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const RandomEventModal: React.FC<RandomEventModalProps> = ({
  event,
  onClose,
  onActionTaken,
  agency,
  setAgency,
  players,
  setPlayers,
  clubs,
  setClubs,
  addToast
}) => {
  const [chosenOption, setChosenOption] = useState<RandomEventOption | null>(null);

  if (!event) return null;

  const handleSelectOption = (opt: RandomEventOption) => {
    const effects = opt.effects;

    // Apply Agency Effects
    setAgency(prev => {
      const newCash = Math.max(0, prev.balance + (effects.cashChange || 0));
      const newRep = Math.min(100, Math.max(0, prev.reputation + (effects.reputationChange || 0)));
      const newScandal = Math.min(100, Math.max(0, (prev.presidency?.conflictScandalLevel || 0) + (effects.scandalChange || 0)));
      const newPol = Math.min(100, Math.max(0, (prev.presidency?.politicalInfluence || 50) + (effects.politicalInfluenceChange || 0)));

      return {
        ...prev,
        balance: newCash,
        reputation: newRep,
        presidency: {
          ...prev.presidency,
          conflictScandalLevel: newScandal,
          politicalInfluence: newPol
        }
      };
    });

    // Apply Player Morale Effects if target or all clients
    if (effects.moraleChange) {
      setPlayers(prev => prev.map(p => {
        if (event.targetPlayerId ? p.id === event.targetPlayerId : p.isMyClient) {
          return {
            ...p,
            morale: Math.min(100, Math.max(0, p.morale + (effects.moraleChange || 0)))
          };
        }
        return p;
      }));
    }

    // Apply Club Approval Effects if target or all
    if (effects.fanApprovalChange || effects.chairmanTrustChange) {
      setClubs(prev => prev.map(c => {
        if (event.targetClubId ? c.id === event.targetClubId : true) {
          return {
            ...c,
            chairmanTrust: Math.min(100, Math.max(0, c.chairmanTrust + (effects.chairmanTrustChange || 0)))
          };
        }
        return c;
      }));
    }

    if ((effects.cashChange || 0) > 0 || (effects.reputationChange || 0) > 0) {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    }

    setChosenOption(opt);
    addToast(`⚡ Event Decision Executed: ${opt.outcomeTitle}`, 'info');
    if (onActionTaken) {
      onActionTaken();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 text-white">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-amber-600 via-red-600 to-amber-700 p-5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="text-3xl p-2 bg-slate-950/40 rounded-2xl border border-white/20">
              {event.imageEmoji || '⚡'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-950/50 text-amber-200 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-300/30">
                  {event.category} Event
                </span>
                {event.characterRole && (
                  <span className="text-xs text-amber-100/90 font-medium italic">
                    • {event.characterName} ({event.characterRole})
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-wide text-white mt-0.5">{event.title}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-950/40 hover:bg-slate-950/70 text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {!chosenOption ? (
            <>
              {/* Description */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 text-sm text-slate-200 leading-relaxed shadow-inner">
                {event.description}
              </div>

              {/* Options Selection */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  <span>Choose Your Directive Response</span>
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {event.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(opt)}
                      className="group bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-amber-500/60 p-4 rounded-2xl text-left transition cursor-pointer space-y-2 shadow-md hover:shadow-amber-500/10"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition flex items-center gap-2">
                          <span>{opt.label}</span>
                        </h4>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
                      </div>

                      <p className="text-xs text-slate-300">{opt.description}</p>

                      {/* Expected Effects Preview */}
                      <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-bold">
                        {opt.effects.cashChange !== undefined && opt.effects.cashChange !== 0 && (
                          <span className={opt.effects.cashChange > 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {opt.effects.cashChange > 0 ? '+' : ''}{formatMoney(opt.effects.cashChange)} Cash
                          </span>
                        )}
                        {opt.effects.reputationChange !== undefined && opt.effects.reputationChange !== 0 && (
                          <span className={opt.effects.reputationChange > 0 ? 'text-amber-300' : 'text-red-400'}>
                            {opt.effects.reputationChange > 0 ? '+' : ''}{opt.effects.reputationChange} Reputation
                          </span>
                        )}
                        {opt.effects.scandalChange !== undefined && opt.effects.scandalChange !== 0 && (
                          <span className={opt.effects.scandalChange < 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {opt.effects.scandalChange > 0 ? '+' : ''}{opt.effects.scandalChange}% Scandal
                          </span>
                        )}
                        {opt.effects.moraleChange !== undefined && opt.effects.moraleChange !== 0 && (
                          <span className={opt.effects.moraleChange > 0 ? 'text-sky-300' : 'text-red-400'}>
                            {opt.effects.moraleChange > 0 ? '+' : ''}{opt.effects.moraleChange}% Morale
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Outcome View */
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                  <h3 className="font-black text-base">{chosenOption.outcomeTitle}</h3>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{chosenOption.outcomeText}</p>
              </div>

              {/* Summary of Impact */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Applied Consequences</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-extrabold">
                  {chosenOption.effects.cashChange !== undefined && chosenOption.effects.cashChange !== 0 && (
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span className={chosenOption.effects.cashChange > 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {chosenOption.effects.cashChange > 0 ? '+' : ''}{formatMoney(chosenOption.effects.cashChange)}
                      </span>
                    </div>
                  )}

                  {chosenOption.effects.reputationChange !== undefined && chosenOption.effects.reputationChange !== 0 && (
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className={chosenOption.effects.reputationChange > 0 ? 'text-amber-300' : 'text-red-400'}>
                        {chosenOption.effects.reputationChange > 0 ? '+' : ''}{chosenOption.effects.reputationChange} Rep
                      </span>
                    </div>
                  )}

                  {chosenOption.effects.scandalChange !== undefined && chosenOption.effects.scandalChange !== 0 && (
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className={chosenOption.effects.scandalChange < 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {chosenOption.effects.scandalChange > 0 ? '+' : ''}{chosenOption.effects.scandalChange}% Scandal
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black p-3.5 rounded-2xl text-sm transition cursor-pointer shadow-lg"
              >
                Continue Career
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
