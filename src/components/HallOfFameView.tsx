import React, { useState } from 'react';
import { AgencyState, Player } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { 
  Crown, 
  Trophy, 
  DollarSign, 
  Award, 
  Flame, 
  Calendar, 
  TrendingUp,
  Sparkles,
  Building2,
  Vote,
  ShieldAlert,
  Globe,
  CheckCircle2,
  Filter
} from 'lucide-react';

interface HallOfFameViewProps {
  agency: AgencyState;
  players: Player[];
}

export const HallOfFameView: React.FC<HallOfFameViewProps> = ({
  agency,
  players
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const myClients = players.filter(p => p.isMyClient);

  // Top client record holders
  const recordTransferClient = [...myClients].sort((a, b) => b.value - a.value)[0];
  const recordWageClient = [...myClients].sort((a, b) => b.wage - a.wage)[0];

  const milestones = agency.milestones || [];
  const filteredMilestones = milestones.filter(m => selectedCategory === 'ALL' || m.type === selectedCategory);

  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'election':
      case 'presidency':
        return Vote;
      case 'acquisition':
        return Building2;
      case 'transfer':
        return DollarSign;
      case 'scandal':
        return ShieldAlert;
      case 'award':
        return Award;
      default:
        return Trophy;
    }
  };

  const getMilestoneBadgeColor = (type: string) => {
    switch (type) {
      case 'election':
      case 'presidency':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'acquisition':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'transfer':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'scandal':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'award':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border-2 border-amber-500/40 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-400" />
            <span>Agent Career Hall of Fame & Timeline Archive</span>
          </h2>
          <p className="text-xs text-amber-200/80 mt-1 max-w-xl">
            Historical record archive of your agency's iconic transfer masterclasses, club acquisitions, successful elections, and major career milestones.
          </p>
        </div>

        <div className="bg-amber-500/20 border border-amber-500/40 px-4 py-2 rounded-xl text-center">
          <p className="text-[10px] text-amber-300 font-semibold uppercase">Total Transfer Revenue</p>
          <p className="text-lg font-black text-white">{formatMoney(agency.totalTransferEarnings)}</p>
        </div>
      </div>

      {/* Career Record Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Record Transfer Deal</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-lg font-black text-white">{recordTransferClient ? recordTransferClient.name : 'N/A'}</p>
          <p className="text-xs text-emerald-400 font-bold">{recordTransferClient ? formatMoney(recordTransferClient.value) : '€0'}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Highest Client Wage</span>
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-lg font-black text-white">{recordWageClient ? recordWageClient.name : 'N/A'}</p>
          <p className="text-xs text-amber-400 font-bold">{recordWageClient ? `${formatMoney(recordWageClient.wage)}/wk` : '€0'}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Archive Milestones</span>
            <Award className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-lg font-black text-white">{milestones.length} Historical Records</p>
          <p className="text-xs text-purple-400 font-bold">Season {agency.currentSeason}</p>
        </div>
      </div>

      {/* Historical Milestones Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span>Agency Career Timeline & Legacy Archive</span>
          </h3>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['ALL', 'election', 'acquisition', 'transfer', 'award', 'scandal'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredMilestones.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center italic">No career timeline events recorded in this category yet.</p>
        ) : (
          <div className="relative border-l-2 border-slate-800 ml-4 space-y-6 pt-2">
            {filteredMilestones.map((m) => {
              const IconComponent = getMilestoneIcon(m.type);
              const badgeClass = getMilestoneBadgeColor(m.type);

              return (
                <div key={m.id} className="relative pl-6">
                  <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-amber-500 border-4 border-slate-900 flex items-center justify-center text-[10px]">
                    •
                  </div>
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-2 hover:bg-slate-800 transition">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded border ${badgeClass} flex items-center gap-1`}>
                          <IconComponent className="w-3 h-3" />
                          <span>{m.type}</span>
                        </span>
                        <h4 className="font-extrabold text-sm text-white">{m.title}</h4>
                      </div>

                      <span className="text-xs text-slate-400 font-medium shrink-0">Wk {m.week} ({m.season})</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{m.description}</p>

                    {m.impact && (
                      <p className="text-[11px] text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg inline-block mt-1">
                        ✨ Impact: {m.impact}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
