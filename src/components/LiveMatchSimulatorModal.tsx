import React, { useState, useEffect } from 'react';
import { Player, MatchFixture, Club, MatchdayDirectiveType } from '../types';
import { soundEngine } from '../utils/soundEffects';
import { 
  Play, 
  Pause, 
  Zap, 
  MessageSquare, 
  ShieldAlert, 
  Award, 
  X, 
  Sparkles, 
  Crown, 
  Eye, 
  Flame, 
  Shield, 
  Heart, 
  Activity, 
  TrendingUp, 
  CheckCircle2, 
  Users, 
  Radio,
  Clock,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LiveMatchSimulatorModalProps {
  fixture?: MatchFixture;
  homeClub: Club;
  awayClub: Club;
  clientPlayers?: Player[];
  players?: Player[];
  onClose: () => void;
  onUpdatePlayer?: (player: Player) => void;
  soundEnabled?: boolean;
  activeDirectives?: Record<string, MatchdayDirectiveType>;
  onSetDirective?: (playerId: string, directive: MatchdayDirectiveType) => void;
}

export const LiveMatchSimulatorModal: React.FC<LiveMatchSimulatorModalProps> = ({
  fixture,
  homeClub,
  awayClub,
  clientPlayers,
  players,
  onClose,
  onUpdatePlayer = (_p?: Player) => {},
  soundEnabled,
  activeDirectives = {},
  onSetDirective
}) => {
  const activeClientPlayers = clientPlayers || (players ? players.filter(p => p.isMyClient && (p.clubId === homeClub.id || p.clubId === awayClub.id)) : []);
  const [minute, setMinute] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [crowdEnergy, setCrowdEnergy] = useState(75); // 0 - 100
  const [activeDirective, setActiveDirective] = useState<MatchdayDirectiveType>('none');
  const [selectedClient, setSelectedClient] = useState<Player | null>(activeClientPlayers[0] || null);
  const [scoutBuzz, setScoutBuzz] = useState<string[]>([]);
  const [commentary, setCommentary] = useState<{ minute: number; text: string; isGoal?: boolean; isHighlight?: boolean; isDirective?: boolean }[]>([
    { minute: 1, text: `🏟️ VIP Director's Box: Viewing kick-off between ${homeClub.name} and ${awayClub.name}. European club scouts in attendance!` }
  ]);
  const [clientMatchRating, setClientMatchRating] = useState<number>(6.5);

  useEffect(() => {
    if (!isPlaying || minute >= 90) return;

    const timer = setInterval(() => {
      setMinute((prev) => {
        const nextMin = prev + 3;
        const roll = Math.random();

        // Fluctuate crowd energy
        setCrowdEnergy(e => Math.min(100, Math.max(30, e + (Math.random() > 0.5 ? 4 : -4))));

        // Impact of Pitchside Directives on simulation
        let goalThreshold = 0.84;
        let clientEventChance = 0.55;

        if (activeDirective === 'showcase_flair') {
          clientEventChance = 0.75;
          setClientMatchRating(r => Math.min(10.0, +(r + 0.12).toFixed(1)));
        } else if (activeDirective === 'all_out_press') {
          goalThreshold = 0.78;
          clientEventChance = 0.70;
          setClientMatchRating(r => Math.min(10.0, +(r + 0.1).toFixed(1)));
        } else if (activeDirective === 'tactical_discipline') {
          setClientMatchRating(r => Math.min(9.5, +(r + 0.08).toFixed(1)));
        }

        // Random match events
        if (roll > goalThreshold) {
          const isHomeGoal = Math.random() > 0.45;
          if (isHomeGoal) {
            setHomeScore(s => s + 1);
            if (soundEnabled) soundEngine.playWhistle();
            setCrowdEnergy(95);
            setCommentary(c => [{ minute: nextMin, text: `⚽ GOAL! ${homeClub.name} scores! The stadium erupts into deafening celebration!`, isGoal: true }, ...c]);
          } else {
            setAwayScore(s => s + 1);
            if (soundEnabled) soundEngine.playWhistle();
            setCrowdEnergy(85);
            setCommentary(c => [{ minute: nextMin, text: `⚽ GOAL! ${awayClub.name} strikes on the counter-attack!`, isGoal: true }, ...c]);
          }
        } else if (roll > (1 - clientEventChance) && selectedClient) {
          if (activeDirective === 'showcase_flair') {
            setCommentary(c => [
              { 
                minute: nextMin, 
                text: `🌟 FLAIR HIGHLIGHT: ${selectedClient.name} pulls off a spectacular rainbow flick past two defenders! The VIP scouts lean forward in their seats!`,
                isHighlight: true 
              }, 
              ...c
            ]);
            if (Math.random() > 0.6 && !scoutBuzz.includes('Real Madrid Chief Scout noted technical brilliance')) {
              setScoutBuzz(prev => ['Real Madrid & Man City scouts marked high transfer interest', ...prev]);
            }
          } else if (activeDirective === 'all_out_press') {
            setCommentary(c => [
              { 
                minute: nextMin, 
                text: `⚡ ALL-OUT PRESS: ${selectedClient.name} makes a bone-crunching interception and feeds a dangerous through ball!`,
                isHighlight: true 
              }, 
              ...c
            ]);
          } else if (activeDirective === 'tactical_discipline') {
            setCommentary(c => [
              { 
                minute: nextMin, 
                text: `🛡️ TACTICAL DISCIPLINE: ${selectedClient.name} tracks back 40 yards to cut out a dangerous 2-on-1 attack. Head coach applauds from the touchline.`,
                isHighlight: true 
              }, 
              ...c
            ]);
          } else if (activeDirective === 'injury_caution') {
            setCommentary(c => [
              { 
                minute: nextMin, 
                text: `🩹 PRESERVATION: ${selectedClient.name} smartly pulls out of a 50/50 collision, preserving physical condition and maintaining neat ball circulation.`,
                isHighlight: true 
              }, 
              ...c
            ]);
          } else {
            setCommentary(c => [
              { 
                minute: nextMin, 
                text: `🎯 ${selectedClient.name} plays an intelligent line-breaking pass forward, creating a half-chance.` 
              }, 
              ...c
            ]);
          }
        }

        if (nextMin >= 90) {
          setIsPlaying(false);
          setCommentary(c => [{ minute: 90, text: `🏁 FULL TIME! Final Score: ${homeClub.name} ${homeScore} - ${awayScore} ${awayClub.name}. Match analysis completed.`, isGoal: true }, ...c]);
          if (soundEnabled) soundEngine.playSuccess();
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        }

        return nextMin;
      });
    }, 600);

    return () => clearInterval(timer);
  }, [isPlaying, minute, homeClub, awayClub, selectedClient, homeScore, awayScore, soundEnabled, activeDirective, scoutBuzz]);

  const handleApplyDirective = (directive: MatchdayDirectiveType) => {
    setActiveDirective(directive);
    if (soundEnabled) soundEngine.playClickSound();

    if (selectedClient) {
      if (onSetDirective) {
        onSetDirective(selectedClient.id, directive);
      }

      let boostDesc = '';
      if (directive === 'showcase_flair') {
        boostDesc = 'Instructed client to play high-risk creative flair football. Social engagement & scout interest surging!';
        onUpdatePlayer({
          ...selectedClient,
          form: Math.min(100, selectedClient.form + 6),
          personalLife: {
            ...selectedClient.personalLife,
            socialMediaFollowers: (selectedClient.personalLife.socialMediaFollowers || 100000) + 15000,
            fatigue: Math.min(100, (selectedClient.personalLife.fatigue || 20) + 12)
          }
        });
      } else if (directive === 'tactical_discipline') {
        boostDesc = 'Instructed client to stick strictly to defensive positioning. Head Coach trust & starting guarantee unlocked!';
        onUpdatePlayer({
          ...selectedClient,
          morale: Math.min(100, selectedClient.morale + 5),
          form: Math.min(100, selectedClient.form + 4)
        });
      } else if (directive === 'injury_caution') {
        boostDesc = 'Instructed client to avoid physical slide tackles and conserve stamina.';
        onUpdatePlayer({
          ...selectedClient,
          personalLife: {
            ...selectedClient.personalLife,
            fatigue: Math.max(0, (selectedClient.personalLife.fatigue || 20) - 10)
          }
        });
      } else if (directive === 'all_out_press') {
        boostDesc = 'Instructed client to trigger aggressive pressing traps and shoot from range.';
        onUpdatePlayer({
          ...selectedClient,
          form: Math.min(100, selectedClient.form + 7)
        });
      }

      setCommentary(c => [
        { 
          minute: Math.min(90, minute || 1), 
          text: `📡 PITCHSIDE ADVISING DIRECTIVE SENT: ${boostDesc}`, 
          isDirective: true 
        }, 
        ...c
      ]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-indigo-500/60 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in duration-200">
        
        {/* Header with VIP Director's Box Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  VIP Director's Box Seat
                </span>
                <span className="text-xs text-slate-400 font-bold">{homeClub.league}</span>
              </div>
              <h3 className="text-base font-black text-white">Live Matchday &amp; Pitchside Advising Suite</h3>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stadium Atmosphere Scoreboard */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-indigo-500/30 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            {/* Home Club */}
            <div className="text-center space-y-1.5 flex-1">
              <div className={`w-12 h-12 mx-auto rounded-2xl ${homeClub.logoColor} flex items-center justify-center text-white font-black text-sm shadow-lg`}>
                {homeClub.shortName}
              </div>
              <p className="font-extrabold text-white text-xs truncate max-w-[130px] mx-auto">{homeClub.name}</p>
              <span className="text-[10px] text-slate-400">Home • Rep {homeClub.reputation}</span>
            </div>

            {/* Score & Timer */}
            <div className="text-center px-6">
              <div className="bg-slate-900 border border-slate-700/80 px-6 py-2 rounded-2xl shadow-inner">
                <span className="text-4xl font-black text-amber-400 tracking-widest font-mono">
                  {homeScore} : {awayScore}
                </span>
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <Radio className={`w-3.5 h-3.5 ${isPlaying ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <span className="text-xs font-black text-indigo-300">
                  {minute >= 90 ? 'FULL TIME (90+3\')' : `${minute}' MIN`}
                </span>
              </div>
            </div>

            {/* Away Club */}
            <div className="text-center space-y-1.5 flex-1">
              <div className={`w-12 h-12 mx-auto rounded-2xl ${awayClub.logoColor} flex items-center justify-center text-white font-black text-sm shadow-lg`}>
                {awayClub.shortName}
              </div>
              <p className="font-extrabold text-white text-xs truncate max-w-[130px] mx-auto">{awayClub.name}</p>
              <span className="text-[10px] text-slate-400">Away • Rep {awayClub.reputation}</span>
            </div>
          </div>

          {/* Crowd Energy & Momentum Bar */}
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-[11px] text-slate-400 font-bold">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> Stadium Crowd Decibel Meter
              </span>
              <span className="text-amber-300">{crowdEnergy}% Peak Atmosphere</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-300"
                style={{ width: `${crowdEnergy}%` }}
              />
            </div>
          </div>
        </div>

        {/* Client Focus Card & Rating */}
        {selectedClient && (
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-xl shrink-0">
                {selectedClient.flag}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">{selectedClient.name}</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold border border-indigo-500/30">
                    {selectedClient.position} • {selectedClient.rating} OVR
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Client Match Rating: <strong className="text-amber-400">{clientMatchRating}</strong> / 10.0 • Form: <strong>{selectedClient.form}%</strong>
                </p>
              </div>
            </div>

            {/* Scout Buzz Tags */}
            <div className="flex flex-wrap gap-1.5 max-w-xs items-center">
              <span className="text-[10px] bg-slate-900 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-400" />
                <span>{selectedClient.agreedPlayingTime || 'Regular Starter'}</span>
              </span>

              {(selectedClient.playingTimeSatisfaction !== undefined && selectedClient.playingTimeSatisfaction < 50) || (selectedClient.consecutiveWeeksBenched && selectedClient.consecutiveWeeksBenched >= 2) ? (
                <span className="text-[10px] bg-red-950/80 border border-red-500/50 text-red-300 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  <span>Discontent Risk ({selectedClient.playingTimeSatisfaction ?? 40}%)</span>
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-full font-bold">
                  PT Satisfied ({selectedClient.playingTimeSatisfaction ?? 85}%)
                </span>
              )}

              <span className="text-[10px] bg-purple-950/70 border border-purple-500/40 text-purple-200 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <Eye className="w-3 h-3 text-purple-300" />
                <span>3 Scouts in Box</span>
              </span>
              {activeDirective !== 'none' && (
                <span className="text-[10px] bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-300" />
                  <span>Directive: {activeDirective.replace('_', ' ').toUpperCase()}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Pitchside Advising Directives Suite */}
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold uppercase text-amber-300 flex items-center gap-1.5 tracking-wider">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Pitchside Advising Directives (Live Match Intervention):</span>
            </p>
            <span className="text-[10px] text-slate-400">Directly affects match performance &amp; transfer interest</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => handleApplyDirective('showcase_flair')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1 cursor-pointer min-h-[44px] ${
                activeDirective === 'showcase_flair'
                  ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-lg'
                  : 'bg-slate-900 border-slate-800 hover:border-amber-500/50 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Showcase Flair</span>
              </div>
              <p className="text-[10px] text-slate-400">
                +15% Rating • +15k Fans • Scout Hype
              </p>
            </button>

            <button
              onClick={() => handleApplyDirective('tactical_discipline')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1 cursor-pointer min-h-[44px] ${
                activeDirective === 'tactical_discipline'
                  ? 'bg-indigo-950/80 border-indigo-400 text-indigo-200 shadow-lg'
                  : 'bg-slate-900 border-slate-800 hover:border-indigo-500/50 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-300">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tactical Discipline</span>
              </div>
              <p className="text-[10px] text-slate-400">
                +10 Coach Trust • Guarantees Starts
              </p>
            </button>

            <button
              onClick={() => handleApplyDirective('all_out_press')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1 cursor-pointer min-h-[44px] ${
                activeDirective === 'all_out_press'
                  ? 'bg-red-950/80 border-red-400 text-red-200 shadow-lg'
                  : 'bg-slate-900 border-slate-800 hover:border-red-500/50 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-red-300">
                <Flame className="w-3.5 h-3.5 text-red-400" />
                <span>All-Out Press</span>
              </div>
              <p className="text-[10px] text-slate-400">
                +20% Goal/Assist • High Aggression
              </p>
            </button>

            <button
              onClick={() => handleApplyDirective('injury_caution')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1 cursor-pointer min-h-[44px] ${
                activeDirective === 'injury_caution'
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-lg'
                  : 'bg-slate-900 border-slate-800 hover:border-emerald-500/50 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300">
                <Heart className="w-3.5 h-3.5 text-emerald-400" />
                <span>Injury Caution</span>
              </div>
              <p className="text-[10px] text-slate-400">
                -80% Injury Risk • Conserves Stamina
              </p>
            </button>
          </div>
        </div>

        {/* Live Text Commentary Feed */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl h-52 overflow-y-auto space-y-2 text-xs">
          {commentary.map((c, idx) => (
            <div 
              key={idx} 
              className={`p-2.5 rounded-xl border transition ${
                c.isGoal 
                  ? 'bg-amber-950/70 border-amber-500/80 text-amber-100 font-extrabold shadow' 
                  : c.isHighlight
                    ? 'bg-indigo-950/60 border-indigo-500/60 text-indigo-100 font-bold'
                    : c.isDirective
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
              }`}
            >
              <span className="text-indigo-400 font-black mr-2">'{c.minute}</span>
              <span>{c.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
