import React, { useState } from 'react';
import { AgencyState, Club, PreSeasonTourRecord } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { 
  Plane, 
  Globe2, 
  DollarSign, 
  TrendingUp, 
  Zap, 
  CheckCircle2, 
  Building2, 
  Flame, 
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Calendar
} from 'lucide-react';

interface PreSeasonTourManagerProps {
  agency: AgencyState;
  clubs: Club[];
  onUpdateAgency: (updater: (prev: AgencyState) => AgencyState) => void;
  onUpdateClub?: (club: Club) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface TourPackage {
  id: string;
  destination: PreSeasonTourRecord['destination'];
  flag: string;
  locationName: string;
  description: string;
  baseRevenue: number;
  merchandiseMultiplier: number;
  fatigueImpact: number; // e.g. -15
  tacticalGain: number; // e.g. +12
  bannerImageColor: string;
}

export const PreSeasonTourManager: React.FC<PreSeasonTourManagerProps> = ({
  agency,
  clubs,
  onUpdateAgency,
  onUpdateClub,
  onShowToast
}) => {
  const [selectedClubId, setSelectedClubId] = useState<string>(() => {
    const owned = clubs.find(c => agency.clubShares?.some(s => s.clubId === c.id && s.sharePercent >= 50));
    return owned ? owned.id : (clubs[0]?.id || '');
  });

  const [confirmTourModal, setConfirmTourModal] = useState<TourPackage | null>(null);

  const ownedClubs = clubs.filter(c => agency.clubShares?.some(s => s.clubId === c.id && s.sharePercent >= 50));
  const activeClub = clubs.find(c => c.id === selectedClubId) || clubs[0];

  // Calendar Window Analysis
  const currentWeek = agency.currentWeek;
  const isPreSeasonWindow = currentWeek >= 1 && currentWeek <= 4;
  const isWinterOrPostSeasonWindow = (currentWeek >= 19 && currentWeek <= 21) || (currentWeek >= 36 && currentWeek <= 38);
  const isOptimalTourWindow = isPreSeasonWindow || isWinterOrPostSeasonWindow;

  const tourPackages: TourPackage[] = [
    {
      id: 'tour_usa',
      destination: 'USA East Coast & Miami',
      flag: '🇺🇸',
      locationName: 'New York, Los Angeles & Miami SuperTour',
      description: 'Massive commercial exhibition against MLS All-Stars and European giants at NFL mega-stadiums.',
      baseRevenue: 35000000,
      merchandiseMultiplier: 1.5,
      fatigueImpact: -15,
      tacticalGain: +8,
      bannerImageColor: 'from-blue-900 to-indigo-950'
    },
    {
      id: 'tour_asia',
      destination: 'Tokyo & Seoul Super Cup',
      flag: '🇯🇵',
      locationName: 'Tokyo, Osaka & Seoul Asian Showcase',
      description: 'Sold-out 80,000 seat arenas with lucrative Japanese and Korean broadcast endorsements.',
      baseRevenue: 28000000,
      merchandiseMultiplier: 1.4,
      fatigueImpact: -18,
      tacticalGain: +10,
      bannerImageColor: 'from-red-900 to-slate-950'
    },
    {
      id: 'tour_gulf',
      destination: 'Gulf Nations Showcase',
      flag: '🇦🇪',
      locationName: 'Dubai & Riyadh Global Super Cup',
      description: 'Sovereign wealth sponsored showcase with massive appearance fees and state-of-the-art air conditioned facilities.',
      baseRevenue: 45000000,
      merchandiseMultiplier: 1.2,
      fatigueImpact: -12,
      tacticalGain: +6,
      bannerImageColor: 'from-amber-900 to-slate-950'
    },
    {
      id: 'tour_alpine',
      destination: 'Alpine Altitude Camp',
      flag: '🇦🇹',
      locationName: 'Austrian Alps High-Altitude Fortress',
      description: 'Zero commercial distractions. Pure physical conditioning, tactical drills, and mountain endurance prep.',
      baseRevenue: 6000000,
      merchandiseMultiplier: 1.0,
      fatigueImpact: +5, // Actually boosts recovery
      tacticalGain: +25,
      bannerImageColor: 'from-emerald-900 to-slate-950'
    }
  ];

  // Initiate Tour Request (Opens confirmation modal if mid-season)
  const handleRequestTour = (pkg: TourPackage) => {
    if (!isOptimalTourWindow) {
      setConfirmTourModal(pkg);
    } else {
      executeTour(pkg);
    }
  };

  // Execute Tour
  const executeTour = (pkg: TourPackage) => {
    if (!activeClub) return;

    const totalIncome = Math.round(pkg.baseRevenue * pkg.merchandiseMultiplier);

    // Update Club Budget & Reputation
    if (onUpdateClub) {
      onUpdateClub({
        ...activeClub,
        transferBudget: activeClub.transferBudget + totalIncome,
        reputation: Math.min(99, activeClub.reputation + 2)
      });
    }

    // Record Tour in Agency
    const record: PreSeasonTourRecord = {
      id: `tour_${Date.now()}`,
      destination: pkg.destination,
      flag: pkg.flag,
      totalRevenue: totalIncome,
      merchandiseBonus: Math.round(totalIncome * 0.2),
      squadFatigueImpact: pkg.fatigueImpact,
      squadTacticalPrep: pkg.tacticalGain,
      weekExecuted: agency.currentWeek,
      seasonExecuted: agency.currentSeason,
      status: 'completed'
    };

    onUpdateAgency(prev => ({
      ...prev,
      globalTours: [...(prev.globalTours || []), record]
    }));

    onShowToast(`✈️ GLOBAL TOUR COMPLETED: ${activeClub.name} generated ${formatMoney(totalIncome)} in commercial revenues from the ${pkg.destination}!`, 'success');
    setConfirmTourModal(null);
  };

  const tourHistory = agency.globalTours || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Plane className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-black text-white tracking-tight">Pre-Season Global Luxury Tours & Franchises</h2>
            </div>
            <p className="text-slate-400 text-sm max-w-xl">
              Organize international commercial showcase tours across the USA, Asia, and Gulf nations to unlock tens of millions in merchandise and broadcast revenue for your club.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Calendar Window Status Badge */}
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
              isOptimalTourWindow 
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300' 
                : 'bg-amber-950/70 border-amber-500/50 text-amber-300'
            }`}>
              <Calendar className="w-4 h-4" />
              <div>
                <div className="text-[10px] uppercase font-black">Calendar Window (Wk {currentWeek})</div>
                <div className="text-xs font-black">
                  {isPreSeasonWindow ? '🟢 Pre-Season Window (W1-4)' : isWinterOrPostSeasonWindow ? '🟢 Post-Season Break (W36-38)' : '⚠️ Active Mid-Season Fixtures'}
                </div>
              </div>
            </div>

            {/* Club Target Selector */}
            <div className="bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 flex items-center gap-3">
              <span className="text-xs text-slate-400 font-bold">Target Club:</span>
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                className="bg-slate-900 text-white text-xs font-black px-3 py-1.5 rounded-lg border border-slate-700 outline-none"
              >
                {ownedClubs.length > 0 ? (
                  ownedClubs.map(c => (
                    <option key={c.id} value={c.id}>🏟️ {c.name} (Owned)</option>
                  ))
                ) : (
                  clubs.slice(0, 10).map(c => (
                    <option key={c.id} value={c.id}>🏟️ {c.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Mid-Season Fixture Warning Banner if applicable */}
      {!isOptimalTourWindow && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-black text-amber-300">Active League Matchweek In Progress (Week {currentWeek})</div>
            <p className="text-slate-300 leading-relaxed">
              Departing on a transcontinental exhibition tour mid-season will subject the squad to acute jet-lag and fatigue (<span className="text-red-400 font-bold">-15 to -18%</span>), elevating injury vulnerability during upcoming competitive league fixtures. Optimal windows: Weeks 1–4 and Weeks 36–38.
            </p>
          </div>
        </div>
      )}

      {/* Tour Itineraries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tourPackages.map(pkg => {
          const totalYield = Math.round(pkg.baseRevenue * pkg.merchandiseMultiplier);

          return (
            <div key={pkg.id} className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between space-y-4 transition">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{pkg.flag}</span>
                      <span className="font-black text-white text-lg">{pkg.destination}</span>
                    </div>
                    <div className="text-xs text-blue-400 font-bold mt-0.5">{pkg.locationName}</div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Estimated Yield</span>
                    <div className="text-xl font-black text-emerald-400">{formatMoney(totalYield)}</div>
                  </div>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed">{pkg.description}</p>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-500">Base Prize:</span>
                    <span className="font-bold text-white ml-1">{formatMoney(pkg.baseRevenue)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Merchandise Cut:</span>
                    <span className="font-bold text-amber-400 ml-1">{pkg.merchandiseMultiplier}x</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Squad Fatigue:</span>
                    <span className={`font-bold ml-1 ${pkg.fatigueImpact < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {pkg.fatigueImpact > 0 ? `+${pkg.fatigueImpact}` : pkg.fatigueImpact}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Tactical Drill:</span>
                    <span className="font-bold text-emerald-400 ml-1">+{pkg.tacticalGain} Readiness</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => handleRequestTour(pkg)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-black py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-950/40"
                >
                  <Plane className="w-4 h-4" />
                  <span>Embark on Tour ({formatMoney(totalYield)})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mid-Season Tour Confirmation Modal */}
      {confirmTourModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Mid-Season Exhibition Tour</span>
            </div>
            
            <p className="text-slate-300 text-xs leading-relaxed">
              You are departing for the <strong className="text-white">{confirmTourModal.destination}</strong> in Matchweek {currentWeek}. The exhibition will generate <strong className="text-emerald-400">{formatMoney(Math.round(confirmTourModal.baseRevenue * confirmTourModal.merchandiseMultiplier))}</strong> for {activeClub.name}, but will apply a <strong className="text-red-400">{confirmTourModal.fatigueImpact}% fatigue penalty</strong> to active players.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmTourModal(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Postpone to Pre-Season
              </button>
              <button
                type="button"
                onClick={() => executeTour(confirmTourModal)}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Proceed with Tour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historical Tour Log */}
      {tourHistory.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-black text-white flex items-center gap-2 mb-4">
            <Globe2 className="w-5 h-5 text-blue-400" />
            <span>Commercial Tour Expedition Archive</span>
          </h3>
          <div className="space-y-3">
            {tourHistory.map(t => (
              <div key={t.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{t.flag}</span>
                  <div>
                    <span className="font-black text-white">{t.destination}</span>
                    <div className="text-slate-500 text-[11px]">Season {t.seasonExecuted}, Wk {t.weekExecuted}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-black text-sm">{formatMoney(t.totalRevenue)}</div>
                  <div className="text-slate-500 text-[10px]">+{formatMoney(t.merchandiseBonus)} Merch</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
