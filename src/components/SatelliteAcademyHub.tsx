import React, { useState } from 'react';
import { AgencyState, SatelliteAcademy, Player, Club } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { soundEngine } from '../utils/soundEffects';
import { 
  Building2, 
  Globe, 
  Sparkles, 
  UserPlus, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle2, 
  Coins, 
  UserCheck, 
  ShieldCheck, 
  RotateCcw,
  Zap,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SatelliteAcademyHubProps {
  agency: AgencyState;
  club: Club;
  players: Player[];
  onUpdateAgency: (agency: AgencyState) => void;
  onUpdatePlayer?: (player: Player) => void;
  addToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SatelliteAcademyHub: React.FC<SatelliteAcademyHubProps> = ({
  agency,
  club,
  players,
  onUpdateAgency,
  onUpdatePlayer,
  addToast
}) => {
  const satelliteAcademies = agency.satelliteAcademies || [];
  const [selectedPlayerToLoan, setSelectedPlayerToLoan] = useState<string>('');

  // Eligible young players for feeder loan pipeline (age <= 22)
  const eligibleLoanPlayers = players.filter(p => (p.isMyClient || p.clubId === club.id) && p.age <= 22);

  const handleAcquireAcademy = (academy: SatelliteAcademy) => {
    if (agency.balance < academy.cost && club.transferBudget < academy.cost) {
      alert(`Insufficient Funds! You need ${formatMoney(academy.cost)} either in personal agency funds or club transfer budget.`);
      return;
    }

    const payFromClub = club.transferBudget >= academy.cost;

    const updatedAcademies = satelliteAcademies.map(a => 
      a.id === academy.id ? { ...a, owned: true } : a
    );

    if (payFromClub) {
      onUpdateAgency({
        ...agency,
        reputation: Math.min(100, agency.reputation + 4),
        satelliteAcademies: updatedAcademies
      });
    } else {
      onUpdateAgency({
        ...agency,
        balance: agency.balance - academy.cost,
        reputation: Math.min(100, agency.reputation + 4),
        satelliteAcademies: updatedAcademies
      });
    }

    if (agency.soundEnabled) soundEngine.playCashSound();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    if (addToast) {
      addToast(`🌐 ${academy.name} (${academy.country}) acquired! Multi-Club loan pipeline unlocked!`, 'success');
    }
  };

  const handleAssignLoan = (academyId: string) => {
    if (!selectedPlayerToLoan) {
      alert('Please select an eligible youth prospect from the dropdown first.');
      return;
    }

    const targetPlayer = players.find(p => p.id === selectedPlayerToLoan);
    if (!targetPlayer) return;

    const targetAcademy = satelliteAcademies.find(a => a.id === academyId);
    if (!targetAcademy) return;

    const updatedAcademies = satelliteAcademies.map(a => {
      if (a.id === academyId) {
        return {
          ...a,
          assignedLoanProspects: [...(a.assignedLoanProspects || []), targetPlayer.id]
        };
      }
      return a;
    });

    // Boost player development
    if (onUpdatePlayer) {
      onUpdatePlayer({
        ...targetPlayer,
        rating: Math.min(99, targetPlayer.rating + 3),
        potential: Math.min(99, targetPlayer.potential + 2),
        form: 90,
        morale: 95
      });
    }

    onUpdateAgency({
      ...agency,
      satelliteAcademies: updatedAcademies
    });

    if (agency.soundEnabled) soundEngine.playCashSound();
    confetti({ particleCount: 60 });
    if (addToast) {
      addToast(`🚀 ${targetPlayer.name} assigned to ${targetAcademy.name} for 1st-team development (+3 OVR / +2 POT)!`, 'success');
    }

    setSelectedPlayerToLoan('');
  };

  const handleRecallPlayer = (academyId: string, playerId: string) => {
    const targetPlayer = players.find(p => p.id === playerId);
    const updatedAcademies = satelliteAcademies.map(a => {
      if (a.id === academyId) {
        return {
          ...a,
          assignedLoanProspects: (a.assignedLoanProspects || []).filter(id => id !== playerId)
        };
      }
      return a;
    });

    onUpdateAgency({
      ...agency,
      satelliteAcademies: updatedAcademies
    });

    if (agency.soundEnabled) soundEngine.playClickSound();
    if (addToast) {
      addToast(`🔄 ${targetPlayer?.name || 'Player'} recalled back to first-team squad.`, 'info');
    }
  };

  return (
    <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border-2 border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                Multi-Club Ownership (MCO) Network
              </span>
              <span className="text-xs text-slate-400 font-bold">Global Talent Feeder Pipeline</span>
            </div>
            <h3 className="text-lg font-black text-white">Satellite Academies &amp; Feeder Clubs</h3>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400">
            Owned Feeder Hubs: <strong className="text-amber-400">{satelliteAcademies.filter(a => a.owned).length} / {satelliteAcademies.length}</strong>
          </span>
        </div>
      </div>

      {/* Loan Candidate Selection Dropdown */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs font-black text-white flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>Select Youth Prospect for Feeder Loan Dispatch:</span>
          </p>
          <p className="text-[11px] text-slate-400">
            Players on feeder loans receive 90 minutes weekly, bypass EU work permits, and gain rapid attribute growth.
          </p>
        </div>

        <select
          value={selectedPlayerToLoan}
          onChange={(e) => setSelectedPlayerToLoan(e.target.value)}
          aria-label="Select youth prospect for feeder loan dispatch"
          className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:border-indigo-400 outline-none w-full sm:w-64 cursor-pointer"
        >
          <option value="">-- Choose Youth Prospect --</option>
          {eligibleLoanPlayers.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.position}, {p.age}yo, {p.rating} OVR / {p.potential} POT)
            </option>
          ))}
        </select>
      </div>

      {/* Satellite Feeder Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {satelliteAcademies.map(academy => {
          const assignedPlayers = (academy.assignedLoanProspects || [])
            .map(id => players.find(p => p.id === id))
            .filter(Boolean) as Player[];

          return (
            <div
              key={academy.id}
              className={`p-5 rounded-2xl border-2 transition space-y-4 flex flex-col justify-between ${
                academy.owned 
                  ? 'bg-slate-950/90 border-indigo-500/60 shadow-lg' 
                  : 'bg-slate-950/50 border-slate-800'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{academy.flag}</span>
                    <div>
                      <h4 className="text-sm font-black text-white">{academy.name}</h4>
                      <span className="text-[10px] text-indigo-300 font-bold">{academy.region}</span>
                    </div>
                  </div>

                  {academy.owned ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-black px-2.5 py-1 rounded-full border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>OPERATIONAL</span>
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded">
                      Available for Purchase
                    </span>
                  )}
                </div>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <p className="text-amber-300 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Specialty: {academy.talentBonus}</span>
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Operating Cost: <strong className="text-white">{formatMoney(academy.weeklyOperatingCost)} / wk</strong>
                  </p>
                </div>
              </div>

              {/* Assigned Loan Prospects */}
              {academy.owned && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300">
                      Assigned Loan Talents ({assignedPlayers.length}):
                    </span>
                    <button
                      onClick={() => handleAssignLoan(academy.id)}
                      disabled={!selectedPlayerToLoan}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-3 py-1 rounded-lg text-[10px] transition cursor-pointer flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Dispatch Selected</span>
                    </button>
                  </div>

                  {assignedPlayers.length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {assignedPlayers.map(p => (
                        <div key={p.id} className="bg-slate-900 border border-slate-800 p-2 rounded-lg flex items-center justify-between text-xs">
                          <span className="font-bold text-white">
                            {p.flag} {p.name} ({p.position}, {p.rating} OVR)
                          </span>
                          <button
                            onClick={() => handleRecallPlayer(academy.id, p.id)}
                            className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Recall</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">No prospects currently dispatched to this feeder club.</p>
                  )}
                </div>
              )}

              {/* Purchase Button */}
              {!academy.owned && (
                <button
                  onClick={() => handleAcquireAcademy(academy)}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black py-2.5 rounded-xl text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <Coins className="w-4 h-4 text-amber-300" />
                  <span>Acquire Feeder Club ({formatMoney(academy.cost)})</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
