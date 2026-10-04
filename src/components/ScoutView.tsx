import React, { useState } from 'react';
import { AgencyState, Scout, GrassrootsCamp, Player } from '../types';
import { generateWonderkid, formatMoney } from '../utils/gameEngine';
import { soundEngine } from '../utils/soundEffects';
import { PlayerPitchNegotiationModal } from './PlayerPitchNegotiationModal';
import { YouthDraftScoutingHub } from './YouthDraftScoutingHub';
import confetti from 'canvas-confetti';
import { 
  Building2, 
  UserCheck, 
  Globe, 
  Sparkles, 
  Plus, 
  Check, 
  Flame, 
  Compass, 
  Award,
  Zap,
  GraduationCap
} from 'lucide-react';

interface ScoutViewProps {
  agency: AgencyState;
  onUpdateAgency: (agency: AgencyState) => void;
  onSignPlayer: (player: Player) => void;
  addToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ScoutView: React.FC<ScoutViewProps> = ({
  agency,
  onUpdateAgency,
  onSignPlayer,
  addToast
}) => {
  const [activeScoutTab, setActiveScoutTab] = useState<'scouts_academies' | 'youth_draft'>('scouts_academies');
  const [discoveredProspects, setDiscoveredProspects] = useState<Player[]>([]);
  const [isScoutingActive, setIsScoutingActive] = useState(false);
  const [pitchingKid, setPitchingKid] = useState<Player | null>(null);

  // Hire a new Scout
  const handleHireScout = () => {
    if (agency.activeRoles?.currentRole === 'fa_president') {
      if (addToast) addToast('FIFA Governance: FA Presidents cannot operate private commercial scouting networks.', 'error');
      return;
    }

    if (agency.balance < 100000) {
      if (addToast) {
        addToast('Need €100,000 capital to hire a new international scout!', 'error');
      }
      return;
    }
    const names = ['Lucas Hernandez', 'Sandro Tonali', 'Emeka Okoye', 'Takeshi Sato', 'Mateo Rossi'];
    const regions = ['South America', 'Europe', 'West Africa', 'East Asia'];
    
    const newScout: Scout = {
      id: `sc_${Date.now()}`,
      name: names[Math.floor(Math.random() * names.length)],
      region: regions[Math.floor(Math.random() * regions.length)],
      rating: 75 + Math.floor(Math.random() * 15),
      weeklyCost: 4000,
      status: 'idle'
    };

    soundEngine.playCash();
    onUpdateAgency({
      ...agency,
      balance: agency.balance - 100000,
      staff: {
        ...agency.staff,
        scouts: [...agency.staff.scouts, newScout]
      }
    });

    if (addToast) {
      addToast(`🔍 Hired scout ${newScout.name} (Rating ${newScout.rating}) to your global network!`, 'success');
    }
  };

  // Dispatch scout on mission
  const handleDispatchScout = (scoutId: string, region: string) => {
    const updatedScouts = agency.staff.scouts.map(s => {
      if (s.id === scoutId) {
        return {
          ...s,
          status: 'scouting' as const,
          targetRegion: region,
          weeksLeft: 2
        };
      }
      return s;
    });

    soundEngine.playClick();
    onUpdateAgency({
      ...agency,
      staff: {
        ...agency.staff,
        scouts: updatedScouts
      }
    });

    // Generate immediate wonderkid prospect for user to inspect!
    const kid = generateWonderkid(region, agency.currentWeek, agency.currentSeason);
    setDiscoveredProspects(prev => [kid, ...prev]);

    if (addToast) {
      addToast(`🗺️ Scout deployed to ${region}! Initial prospect ${kid.name} reported.`, 'info');
    }
  };

  // Upgrade Grassroots Academy Camp
  const handleUpgradeCamp = (campId: string) => {
    const camp = agency.grassrootsCamps.find(c => c.id === campId);
    if (!camp) return;

    const cost = (camp.level + 1) * 200000;
    if (agency.balance < cost) {
      if (addToast) {
        addToast(`Need ${formatMoney(cost)} to upgrade ${camp.region} Youth Academy!`, 'error');
      }
      return;
    }

    const updatedCamps = agency.grassrootsCamps.map(c => {
      if (c.id === campId) {
        return {
          ...c,
          level: c.level + 1,
          producedWonderkids: c.producedWonderkids + 1
        };
      }
      return c;
    });

    // Spawns high-potential wonderkid from youth academy!
    const wonderkid = generateWonderkid(camp.region, agency.currentWeek, agency.currentSeason);
    wonderkid.potential = Math.min(99, wonderkid.potential + 3); // Bonus for youth academy upgrade
    setDiscoveredProspects(prev => [wonderkid, ...prev]);

    soundEngine.playSuccess();
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 }
    });

    onUpdateAgency({
      ...agency,
      balance: agency.balance - cost,
      grassrootsCamps: updatedCamps
    });

    if (addToast) {
      addToast(
        `⚡ Upgraded ${camp.region} Youth Academy to Level ${camp.level + 1}! Wonderkid ${wonderkid.name} graduated.`,
        'success'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tab Switcher */}
      <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <button
          onClick={() => setActiveScoutTab('scouts_academies')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
            activeScoutTab === 'scouts_academies'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Regional Scouts & Academies</span>
        </button>

        <button
          onClick={() => setActiveScoutTab('youth_draft')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
            activeScoutTab === 'youth_draft'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Annual Youth Draft & Wonderkid Pitch Battles 🌟</span>
        </button>
      </div>

      {activeScoutTab === 'youth_draft' ? (
        <YouthDraftScoutingHub
          agency={agency}
          onUpdateAgency={(updater) => onUpdateAgency(updater(agency))}
          onRegisterClient={onSignPlayer}
          onShowToast={(msg, type) => {
            if (addToast) addToast(msg, type || 'info');
          }}
        />
      ) : (
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="w-6 h-6 text-blue-400" />
            <span>Scout Network & Grassroots Academies</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Deploy scouts across global talent hubs and invest in Grassroots Youth Academies (Brazil, Nigeria, France) to discover high-potential wonderkids before rival agencies.
          </p>
        </div>

        <button
          onClick={handleHireScout}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg cursor-pointer transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Hire Scout (€100,000)</span>
        </button>
      </div>

      {/* Discovered Wonderkids Scouting Pool */}
      {discoveredProspects.length > 0 && (
        <div className="bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border-2 border-blue-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">Discovered Wonderkid Prospects</h3>
            </div>
            <span className="text-xs text-amber-300 font-semibold">{discoveredProspects.length} Unassigned Talent</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {discoveredProspects.map((kid) => {
              const isScouted = kid.scoutedStatus === 'fully_scouted';
              const potRange = typeof kid.potentialRange === 'object' && kid.potentialRange !== null
                ? `${kid.potentialRange.min}-${kid.potentialRange.max}`
                : (typeof kid.potentialRange === 'string' && kid.potentialRange 
                  ? kid.potentialRange 
                  : `${Math.max(50, kid.potential - 6)}-${Math.min(99, kid.potential + 4)}`);

              return (
                <div
                  key={kid.id}
                  className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{kid.flag}</span>
                        <h4 className="font-bold text-slate-100 text-sm">{kid.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        <span className="text-blue-400 font-bold">{kid.position}</span> • {kid.age}yo • {kid.nationality}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="bg-emerald-500/20 text-emerald-400 text-xs font-black px-2 py-0.5 rounded border border-emerald-500/30">
                        OVR {kid.rating}
                      </span>
                      <div className="mt-1">
                        {isScouted ? (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-black px-1.5 py-0.5 rounded border border-amber-500/30">
                            POT {kid.potential}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-800 text-slate-400 font-mono font-bold px-1.5 py-0.5 rounded border border-slate-700">
                            POT {potRange}?
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scouting Status Banner */}
                  <div className="bg-slate-950 border border-slate-800 p-2 rounded-lg space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Scout Report:</span>
                      {isScouted ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Fully Scouted
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            setDiscoveredProspects(prev => prev.map(p => {
                              if (p.id === kid.id) {
                                return { ...p, scoutedStatus: 'fully_scouted' };
                              }
                              return p;
                            }));
                          }}
                          className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-extrabold cursor-pointer transition text-[10px]"
                        >
                          🔍 Scout True Potential
                        </button>
                      )}
                    </div>

                    {isScouted && kid.potentialVolatility && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                        <span className="text-slate-400">Volatility Arc:</span>
                        <span className={`font-black px-1.5 py-0.5 rounded ${
                          kid.potentialVolatility === 'boom_or_bust' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                          kid.potentialVolatility === 'late_bloomer' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          kid.potentialVolatility === 'volatile' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          kid.potentialVolatility === 'early_peaker' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {kid.potentialVolatility === 'boom_or_bust' ? 'Boom or Bust' :
                           kid.potentialVolatility === 'late_bloomer' ? 'Late Bloomer' :
                           kid.potentialVolatility === 'early_peaker' ? 'Early Peaker' :
                           kid.potentialVolatility === 'volatile' ? 'Volatile' : 'Stable'}
                          {kid.realizationChance ? ` (${Math.round(kid.realizationChance * 100)}% Realization)` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs py-1 border-t border-slate-800">
                    <span className="text-slate-400">Asking Value: <strong className="text-slate-200">{formatMoney(kid.value)}</strong></span>
                    <span className="text-slate-400">Wage: <strong className="text-slate-200">{formatMoney(kid.wage)}/wk</strong></span>
                  </div>

                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      setPitchingKid(kid);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-md"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Pitch & Recruit Prospect</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Player Pitch Negotiation Modal */}
      {pitchingKid && (
        <PlayerPitchNegotiationModal
          player={pitchingKid}
          agency={agency}
          onClose={() => setPitchingKid(null)}
          onSuccessSign={(signedPlayer, updatedAgency) => {
            onSignPlayer(signedPlayer);
            onUpdateAgency(updatedAgency);
            setDiscoveredProspects(prev => prev.filter(p => p.id !== pitchingKid.id));
            setPitchingKid(null);
            if (addToast) {
              addToast(`🎉 Successfully signed wonderkid ${signedPlayer.name} to the agency!`, 'success');
            }
          }}
        />
      )}

      {/* Scout Staff Roster */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-400" />
          <span>Active Scout Personnel ({agency.staff.scouts.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agency.staff.scouts.map((scout) => (
            <div
              key={scout.id}
              className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-100 text-sm">{scout.name}</h4>
                  <span className="bg-blue-500/20 text-blue-400 text-[10px] font-extrabold px-2 py-0.5 rounded border border-blue-500/30">
                    Rating {scout.rating}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Region Focus: <span className="text-slate-200 font-medium">{scout.region}</span> • Weekly Cost: <span className="text-emerald-400 font-semibold">{formatMoney(scout.weeklyCost)}</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Status: <strong className={scout.status === 'scouting' ? 'text-amber-400' : 'text-slate-300'}>{scout.status === 'scouting' ? `Scouting ${scout.targetRegion} (${scout.weeksLeft}w left)` : 'Ready for Mission'}</strong>
                </p>
              </div>

              {/* Mission dispatch options */}
              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                {['South America (Brazil)', 'West Africa (Nigeria)', 'Western Europe (France)'].map((reg) => (
                  <button
                    key={reg}
                    onClick={() => handleDispatchScout(scout.id, reg)}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    Scout {reg.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grassroots Youth Academies (Feature #9) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              <span>Grassroots Youth Academies Pipeline</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Build and upgrade custom youth academies to incubate 14-16yo wonderkids directly for your agency.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {agency.grassrootsCamps.map((camp) => (
            <div
              key={camp.id}
              className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-5 space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-100">{camp.region}</span>
                <span className="bg-amber-500/20 text-amber-300 font-extrabold text-xs px-2 py-0.5 rounded border border-amber-500/30">
                  Lvl {camp.level}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-400">
                <p>Weekly Maintenance: <strong className="text-slate-200">{formatMoney(camp.weeklyCost * Math.max(1, camp.level))}</strong></p>
                <p>Produced Wonderkids: <strong className="text-emerald-400">{camp.producedWonderkids} Superstars</strong></p>
              </div>

              <button
                onClick={() => handleUpgradeCamp(camp.id)}
                className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-md"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Upgrade Camp ({formatMoney((camp.level + 1) * 200000)})</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}
</div>
);
};

