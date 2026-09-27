import React, { useState } from 'react';
import { AgencyState, Player, YouthDraftProspect } from '../types';
import { formatMoney, generateGlobalYouthDraftProspects } from '../utils/gameEngine';
import { 
  GraduationCap, 
  Sparkles, 
  Flame, 
  Trophy, 
  ShieldCheck, 
  Users, 
  DollarSign, 
  ArrowRight, 
  CheckCircle2, 
  Award,
  Zap,
  Globe2
} from 'lucide-react';

interface YouthDraftScoutingHubProps {
  agency: AgencyState;
  onUpdateAgency: (updater: (prev: AgencyState) => AgencyState) => void;
  onRegisterClient: (player: Player) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const YouthDraftScoutingHub: React.FC<YouthDraftScoutingHubProps> = ({
  agency,
  onUpdateAgency,
  onRegisterClient,
  onShowToast
}) => {
  const grassrootsSubsidy = agency.federationTreasury?.prizeMoneyPool?.grassrootsSubsidy || 8000000;

  const [prospects, setProspects] = useState<YouthDraftProspect[]>(() => {
    return agency.youthDraftProspects && agency.youthDraftProspects.length > 0
      ? agency.youthDraftProspects
      : generateGlobalYouthDraftProspects(agency.currentSeason, grassrootsSubsidy);
  });

  const [selectedProspect, setSelectedProspect] = useState<YouthDraftProspect | null>(null);

  // Pitch Package Selection State
  const [pitchPackages, setPitchPackages] = useState<{
    familyRelocation: boolean; // €250k cost
    bootGuarantee: boolean; // €500k cost
    debutClause: boolean; // 0 cost, requires rep
    eliteMentorship: boolean; // €150k cost
  }>({
    familyRelocation: false,
    bootGuarantee: false,
    debutClause: false,
    eliteMentorship: false
  });

  // Calculate Total Pitch Package Cost
  const totalPitchCost = 
    (pitchPackages.familyRelocation ? 250000 : 0) +
    (pitchPackages.bootGuarantee ? 500000 : 0) +
    (pitchPackages.eliteMentorship ? 150000 : 0);

  // Execute Pitch Battle
  const handleExecutePitch = (prospect: YouthDraftProspect) => {
    if (agency.balance < totalPitchCost) {
      onShowToast(`Insufficient funds! Pitch package requires ${formatMoney(totalPitchCost)}.`, 'error');
      return;
    }

    // Calculate User Pitch Score
    let score = agency.reputation * 0.5 + Math.floor(Math.random() * 20);
    if (pitchPackages.familyRelocation) score += 25;
    if (pitchPackages.bootGuarantee) score += 35;
    if (pitchPackages.debutClause) score += 20;
    if (pitchPackages.eliteMentorship) score += 20;

    // Deduct pitch package cash
    onUpdateAgency(prev => ({
      ...prev,
      balance: prev.balance - totalPitchCost
    }));

    const rivalScore = prospect.agentBattle.rivalPitchScore;

    if (score >= rivalScore) {
      // Determine professional development club for draft wonderkid
      const partnerClubs = [
        { id: 'c_ajax', name: 'AFC Ajax Academy', value: 14000000 },
        { id: 'c_benfica', name: 'SL Benfica B', value: 12500000 },
        { id: 'c_sporting', name: 'Sporting CP Youth', value: 11000000 },
        { id: 'c_dortmund', name: 'Borussia Dortmund U21', value: 16000000 },
        { id: 'c_zagreb', name: 'Dinamo Zagreb Academy', value: 9500000 },
        { id: 'c_salzburg', name: 'Red Bull Salzburg', value: 13500000 }
      ];
      const assignedClub = partnerClubs[Math.floor(Math.random() * partnerClubs.length)];

      // Won signing!
      const newPlayer: Player = {
        id: `draft_signed_${prospect.id}_${Date.now()}`,
        name: prospect.name,
        age: prospect.age,
        nationality: prospect.nationality,
        flag: prospect.flag,
        position: prospect.position,
        rating: prospect.rating,
        potential: prospect.potential,
        clubId: assignedClub.id,
        clubName: assignedClub.name,
        value: assignedClub.value,
        wage: 5000,
        contractYears: 3,
        isMyClient: true,
        agentCommission: 10,
        morale: 95,
        form: 75,
        energy: 100,
        loyalty: 95,
        injury: { isInjured: false, weeks: 0 },
        clauses: { releaseClause: 45000000 },
        personalLife: {
          happiness: 95,
          socialMediaFollowers: 85000,
          scandalLevel: 0,
          endorsementEarnings: 50000
        },
        stats: {
          appearances: 0,
          goals: 0,
          assists: 0,
          cleanSheets: 0,
          avgRating: 7.5
        },
        traits: [prospect.preferredStyle, prospect.personality]
      };

      onRegisterClient(newPlayer as any);

      const updated = prospects.map(p => {
        if (p.id === prospect.id) {
          return {
            ...p,
            agentBattle: {
              ...p.agentBattle,
              userPitchScore: score,
              signedWithUser: true
            }
          };
        }
        return p;
      });

      setProspects(updated);
      onUpdateAgency(prev => ({
        ...prev,
        youthDraftProspects: updated
      }));

      onShowToast(`🌟 WONDERKID SIGNED: ${prospect.name} (${prospect.potential} POT) has signed exclusively with ${agency.agencyName}!`, 'success');
      setSelectedProspect(null);
    } else {
      // Lost to rival
      const updated = prospects.map(p => {
        if (p.id === prospect.id) {
          return {
            ...p,
            agentBattle: {
              ...p.agentBattle,
              userPitchScore: score,
              signedWithRival: prospect.agentBattle.leadingAgent
            }
          };
        }
        return p;
      });

      setProspects(updated);
      onUpdateAgency(prev => ({
        ...prev,
        youthDraftProspects: updated
      }));

      onShowToast(`❌ Pitch Defeated: ${prospect.name} chose ${prospect.agentBattle.leadingAgent}'s package. (Score: ${score} vs ${rivalScore})`, 'error');
      setSelectedProspect(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-black text-white tracking-tight">Global Youth Wonderkid Draft</h2>
            </div>
            <p className="text-slate-400 text-sm max-w-xl">
              Compete directly against rival super-agents in high-stakes signing pitch battles to secure 15-17 year old generational prodigies from South America, West Africa, and elite European academies.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-700/80 rounded-xl p-4 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
            <div>
              <div className="text-[11px] text-slate-400 font-bold uppercase">Annual Wonderkid Intake</div>
              <div className="text-sm font-black text-white">Season {agency.currentSeason} Draft Pool</div>
            </div>
          </div>
        </div>
      </div>

      {/* Federation Grassroots Investment Impact Banner */}
      <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">
            🏛️
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Federation Grassroots Development Grant ROI</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                {formatMoney(grassrootsSubsidy)} / Season
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {grassrootsSubsidy >= 15000000 
                ? 'High national grassroots funding has unlocked +3 OVR/POT academy boosts and additional European & South American wonderkids in this draft pool!'
                : 'Allocating higher Grassroots Subsidies in the Federation Treasury enhances wonderkid potential ratings and spawns additional generational academy prodigies worldwide.'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Talent Pool Quality</span>
          <span className="text-xs font-black text-emerald-400">
            {grassrootsSubsidy >= 20000000 ? '🌟 Generational Class' : grassrootsSubsidy >= 12000000 ? '⭐ Elite Wonderkids' : '✨ Standard Intake'}
          </span>
        </div>
      </div>

      {/* Prospects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prospects.map(prospect => {
          const isSignedWithUser = prospect.agentBattle.signedWithUser;
          const isSignedWithRival = prospect.agentBattle.signedWithRival;

          return (
            <div key={prospect.id} className={`bg-slate-900/90 border ${isSignedWithUser ? 'border-emerald-500/60 bg-emerald-950/20' : isSignedWithRival ? 'border-red-900/40 opacity-60' : 'border-slate-800 hover:border-slate-700'} rounded-2xl p-5 flex flex-col justify-between space-y-4 transition`}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{prospect.flag}</span>
                      <span className="font-black text-white text-lg">{prospect.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-black">{prospect.position}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Age {prospect.age} • Origin: <span className="text-slate-300 font-bold">{prospect.originAcademy}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Potential</span>
                    <div className="text-xl font-black text-emerald-400">{prospect.potential} <span className="text-xs text-slate-400">OVR</span></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-500">Current Rating:</span>
                    <span className="font-bold text-white ml-1">{prospect.rating} OVR</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Playstyle:</span>
                    <span className="font-bold text-amber-400 ml-1">{prospect.preferredStyle}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Personality:</span>
                    <span className="font-bold text-indigo-300 ml-1">{prospect.personality}</span>
                  </div>
                </div>

                {/* Rival Competition Tracker */}
                <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span>Leading Rival Agent:</span>
                    <span className="font-bold text-amber-400">{prospect.agentBattle.leadingAgent}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, prospect.agentBattle.rivalPitchScore)}%` }} />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-800/80">
                {isSignedWithUser ? (
                  <div className="text-xs text-emerald-400 font-black flex items-center justify-center gap-1.5 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4" /> Signed with {agency.agencyName}
                  </div>
                ) : isSignedWithRival ? (
                  <div className="text-xs text-red-400 font-bold flex items-center justify-center gap-1.5 py-2">
                    Signed with {isSignedWithRival}
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedProspect(prospect)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/40"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Launch Representation Pitch Battle</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pitch Battle Configuration Modal */}
      {selectedProspect && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Representation Pitch War</span>
                <h3 className="text-xl font-black text-white mt-0.5">{selectedProspect.name} ({selectedProspect.potential} Potential)</h3>
                <p className="text-xs text-slate-400 mt-1">Configure signing bonuses and career guarantees to out-pitch {selectedProspect.agentBattle.leadingAgent}.</p>
              </div>
              <button
                onClick={() => setSelectedProspect(null)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Pitch Packages Checklist */}
            <div className="space-y-2.5 text-xs">
              <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${pitchPackages.familyRelocation ? 'bg-indigo-950/40 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={pitchPackages.familyRelocation}
                    onChange={(e) => setPitchPackages({ ...pitchPackages, familyRelocation: e.target.checked })}
                    className="rounded border-slate-700 text-indigo-600"
                  />
                  <div>
                    <div className="font-bold">Luxury Family Relocation Package</div>
                    <div className="text-[11px] text-slate-400">Furnished luxury apartment + private schooling (+25 Pitch Score)</div>
                  </div>
                </div>
                <span className="font-black text-amber-400">€250,000</span>
              </label>

              <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${pitchPackages.bootGuarantee ? 'bg-indigo-950/40 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={pitchPackages.bootGuarantee}
                    onChange={(e) => setPitchPackages({ ...pitchPackages, bootGuarantee: e.target.checked })}
                    className="rounded border-slate-700 text-indigo-600"
                  />
                  <div>
                    <div className="font-bold">Nike / Adidas Boot Sponsorship Guarantee</div>
                    <div className="text-[11px] text-slate-400">Guaranteed multi-year brand footwear contract (+35 Pitch Score)</div>
                  </div>
                </div>
                <span className="font-black text-amber-400">€500,000</span>
              </label>

              <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${pitchPackages.eliteMentorship ? 'bg-indigo-950/40 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={pitchPackages.eliteMentorship}
                    onChange={(e) => setPitchPackages({ ...pitchPackages, eliteMentorship: e.target.checked })}
                    className="rounded border-slate-700 text-indigo-600"
                  />
                  <div>
                    <div className="font-bold">Private Elite Performance Coaching</div>
                    <div className="text-[11px] text-slate-400">Dedicated biomechanics and media trainer (+20 Pitch Score)</div>
                  </div>
                </div>
                <span className="font-black text-amber-400">€150,000</span>
              </label>

              <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${pitchPackages.debutClause ? 'bg-indigo-950/40 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={pitchPackages.debutClause}
                    onChange={(e) => setPitchPackages({ ...pitchPackages, debutClause: e.target.checked })}
                    className="rounded border-slate-700 text-indigo-600"
                  />
                  <div>
                    <div className="font-bold">First-Team Debut Clause Commitment</div>
                    <div className="text-[11px] text-slate-400">Guarantees transfer to a club with senior pathway (+20 Pitch Score)</div>
                  </div>
                </div>
                <span className="font-black text-emerald-400">Free</span>
              </label>
            </div>

            {/* Total Pitch Summary & Submit */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-slate-400">Total Investment</div>
                <div className="text-lg font-black text-white">{formatMoney(totalPitchCost)}</div>
              </div>

              <button
                onClick={() => handleExecutePitch(selectedProspect)}
                disabled={agency.balance < totalPitchCost}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-black px-5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/50"
              >
                <span>Submit Final Pitch</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
