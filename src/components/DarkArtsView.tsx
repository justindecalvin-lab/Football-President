import React from 'react';
import { AgencyState, Player } from '../types';
import { ShieldAlert, Zap, Skull, FileX, Flame, Award, Lock } from 'lucide-react';
import { formatMoney } from '../utils/gameEngine';

interface DarkArtsViewProps {
  agency: AgencyState;
  players: Player[];
  onUpdateAgency: React.Dispatch<React.SetStateAction<AgencyState>>;
  onUpdatePlayer: (player: Player) => void;
}

export const DarkArtsView: React.FC<DarkArtsViewProps> = ({
  agency,
  players,
  onUpdateAgency,
  onUpdatePlayer
}) => {
  const clients = players.filter(p => p.isMyClient);
  const [opsLog, setOpsLog] = React.useState<Array<{ id: string; text: string; time: string }>>([]);
  const [activeOpsMap, setActiveOpsMap] = React.useState<{ [key: string]: string }>({});

  const isAgentRole = agency.activeRoles?.currentRole === 'agent';
  const isFaPresident = agency.activeRoles?.currentRole === 'fa_president';

  const handleLeakedPressStrike = (player: Player) => {
    if (!isAgentRole) {
      alert(isFaPresident 
        ? '🔒 FIFA Ethics Lockdown: An active FA President running illegal tabloid press leaks is subject to immediate FIFA Ethics Committee impeachment.'
        : '🔒 Club President Restriction: Boardroom Presidents cannot operate unsanctioned agency media leaks.'
      );
      return;
    }
    if (player.lastDarkArtOpWeek === agency.currentWeek && player.lastDarkArtOpSeason === agency.currentSeason) {
      alert(`⚠️ ${player.name} is already under active media fallout from a dark arts strike this week. Advance the week to dispatch another op.`);
      return;
    }
    if (agency.balance < 50000) {
      alert('Need €50,000 to coordinate press leaks!');
      return;
    }
    onUpdateAgency(prev => ({ 
      ...prev, 
      balance: prev.balance - 50000,
      darkArtsScore: Math.min(100, prev.darkArtsScore + 8)
    }));
    const updated: Player = {
      ...player,
      morale: Math.max(10, (player.morale || 70) - 30),
      lastDarkArtOpWeek: agency.currentWeek,
      lastDarkArtOpSeason: agency.currentSeason,
      personalLife: {
        ...player.personalLife,
        scandalLevel: Math.min(100, (player.personalLife?.scandalLevel || 0) + 25)
      }
    };
    onUpdatePlayer(updated);

    const logMsg = `📰 Press Leak Dispatched for ${player.name}! (+25 Scandal Hazard, -30 Morale)`;
    setOpsLog(prev => [{ id: String(Date.now()), text: logMsg, time: 'Just now' }, ...prev]);
    setActiveOpsMap(prev => ({ ...prev, [`leak_${player.id}`]: 'Press Leak Dispatched' }));

    alert(logMsg);
  };

  const handleBribeSportingDirector = (player: Player) => {
    if (!isAgentRole) {
      alert(isFaPresident 
        ? '🔒 Anti-Corruption Lockdown: As FA President, bribery constitutes a criminal sports integrity violation under FIFA governance.'
        : '🔒 Club President Restriction: Bribery between club executives is strictly prohibited.'
      );
      return;
    }
    if (player.lastDarkArtOpWeek === agency.currentWeek && player.lastDarkArtOpSeason === agency.currentSeason) {
      alert(`⚠️ Offshore envelope already delivered for ${player.name} this week. Advance to next week before running another bribe.`);
      return;
    }
    if (agency.balance < 150000) {
      alert('Need €150,000 for offshore Director gift envelope!');
      return;
    }
    onUpdateAgency(prev => ({ 
      ...prev, 
      balance: prev.balance - 150000,
      darkArtsScore: Math.min(100, prev.darkArtsScore + 15)
    }));
    const updated: Player = {
      ...player,
      wage: Math.round(player.wage * 1.35),
      loyalty: Math.min(100, (player.loyalty || 70) + 15),
      lastDarkArtOpWeek: agency.currentWeek,
      lastDarkArtOpSeason: agency.currentSeason
    };
    onUpdatePlayer(updated);

    const logMsg = `💼 Offshore Director Envelope Delivered for ${player.name}! (+35% Wage Increase to ${formatMoney(updated.wage)}/wk)`;
    setOpsLog(prev => [{ id: String(Date.now()), text: logMsg, time: 'Just now' }, ...prev]);
    setActiveOpsMap(prev => ({ ...prev, [`bribe_${player.id}`]: 'Offshore Bribe Active' }));

    alert(logMsg);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border border-red-900/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-900/30 border border-red-700/50 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">Dark Arts Operations Headquarters</h2>
              <span className="bg-red-500/20 text-red-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-red-500/30">
                UNSANCTIONED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Leverage shadowy agency maneuvers, media leaks, press leaks, and transfer force strikes.
            </p>
          </div>
        </div>
      </div>

      {/* Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Media Leak Machine */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6 text-amber-400" />
            <h3 className="text-base font-bold text-white">Press Leak Transfer Strike (€50,000)</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Leak fake interest to European tabloids to force a club to improve your client contract or trigger an immediate transfer request.
          </p>

          <div className="space-y-2 pt-2">
            {clients.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No represented clients to run ops on.</p>
            ) : (
              clients.map(p => {
                const isLeaked = !!activeOpsMap[`leak_${p.id}`];
                return (
                  <div key={p.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-slate-100">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.clubName} • Morale: {p.morale}%</p>
                    </div>
                    <button
                      onClick={() => handleLeakedPressStrike(p)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                        isLeaked 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                          : 'bg-red-600 hover:bg-red-500 text-white'
                      }`}
                    >
                      {isLeaked ? '⚡ Leak Dispatched' : 'Leak Press'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Director Bribe/Gift Envelope */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Offshore Director Envelope (€150,000)</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Bypass standard club hierarchy and line the pockets of a Sporting Director to guarantee a +35% wage extension for your client.
          </p>

          <div className="space-y-2 pt-2">
            {clients.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No represented clients to run ops on.</p>
            ) : (
              clients.map(p => {
                const isBribed = !!activeOpsMap[`bribe_${p.id}`];
                return (
                  <div key={p.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-slate-100">{p.name}</p>
                      <p className="text-[10px] text-emerald-400">Wage: {formatMoney(p.wage)}/wk</p>
                    </div>
                    <button
                      onClick={() => handleBribeSportingDirector(p)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                        isBribed 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isBribed ? '✅ Bribe Delivered' : 'Execute Ops'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Dark Arts Activity Log */}
      {opsLog.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
            <Flame className="w-4 h-4" />
            <span>Unsanctioned Operations Executed This Session</span>
          </h4>
          <div className="space-y-2">
            {opsLog.map(item => (
              <div key={item.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <span>{item.text}</span>
                <span className="text-[10px] text-slate-500 font-mono">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
