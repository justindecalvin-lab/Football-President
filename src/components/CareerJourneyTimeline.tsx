import React from 'react';
import { AgencyState } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { 
  Crown, 
  Globe, 
  Building2, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Briefcase
} from 'lucide-react';

interface CareerJourneyTimelineProps {
  agency: AgencyState;
  onOpenTab: (tab: string) => void;
}

export const CareerJourneyTimeline: React.FC<CareerJourneyTimelineProps> = ({ agency, onOpenTab }) => {
  const isClubPresident = agency.presidency?.role === 'Club President' || agency.clubShares.some(s => s.sharePercent >= 51);
  const isRegionalDelegate = agency.presidency?.role === 'Regional Delegate';
  const isFederationDirector = agency.presidency?.role === 'Federation Director';
  const isContinentalPresident = agency.presidency?.role === 'Continental President';
  const isFifaPresident = agency.presidency?.role === 'FIFA Global President';

  const nodes = [
    {
      id: 'local_agent',
      stage: 'Stage 1',
      title: 'Local Super-Agent',
      description: 'Found your agency, recruit promising youth prospects, and build European club trust.',
      icon: Briefcase,
      badge: 'Level 1',
      unlocked: true,
      current: agency.reputation < 50 && !isClubPresident,
      requirements: ['Agency Founded', '3 Starter Clients'],
      tabTarget: 'my_players'
    },
    {
      id: 'equity_owner',
      stage: 'Stage 2',
      title: 'Club Shareholder & Tycoon',
      description: 'Acquire equity stakes in top global football clubs to build passive dividend income.',
      icon: Building2,
      badge: 'Level 2',
      unlocked: agency.clubShares.some(s => s.sharePercent >= 20) || agency.reputation >= 50,
      current: (agency.clubShares.some(s => s.sharePercent >= 20) || agency.reputation >= 50) && !isClubPresident,
      requirements: ['Reputation ≥ 50', '20%+ Share in 1 Club'],
      tabTarget: 'tycoon'
    },
    {
      id: 'club_president',
      stage: 'Stage 3',
      title: 'Club President',
      description: 'Acquire 51%+ majority ownership of a club to run its stadium, manager, and transfer policy.',
      icon: Crown,
      badge: 'Level 3',
      unlocked: isClubPresident || isRegionalDelegate || isFederationDirector || isContinentalPresident || isFifaPresident,
      current: isClubPresident && !isRegionalDelegate && !isFederationDirector && !isContinentalPresident && !isFifaPresident,
      requirements: ['51%+ Majority Stake', 'Club President Suite Access'],
      tabTarget: 'club_president'
    },
    {
      id: 'federation_governance',
      stage: 'Stage 4',
      title: 'Federation Director / Delegate',
      description: 'Win regional federation seat elections, lobby club delegates, and enact salary caps & quotas.',
      icon: Globe,
      badge: 'Level 4',
      unlocked: isRegionalDelegate || isFederationDirector || isContinentalPresident || isFifaPresident,
      current: (isRegionalDelegate || isFederationDirector) && !isContinentalPresident && !isFifaPresident,
      requirements: ['Reputation ≥ 70', 'Win Federation Election'],
      tabTarget: 'governance'
    },
    {
      id: 'fifa_global_leader',
      stage: 'Stage 5',
      title: 'FIFA Global President',
      description: 'Supreme ruler of world football. Award World Cup host rights, set global agent fee limits, and control multi-billion subsidies.',
      icon: Sparkles,
      badge: 'Level 5 (Pinnacle)',
      unlocked: isContinentalPresident || isFifaPresident,
      current: isContinentalPresident || isFifaPresident,
      requirements: ['Reputation ≥ 95', 'Elected Global FIFA Leader'],
      tabTarget: 'governance'
    }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Power Broker Career Progression Journey</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Track your evolution from grassroots agent to supreme FIFA President.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 px-4 py-2 rounded-xl flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Current Executive Title</p>
            <p className="text-xs font-black text-amber-400">
              {isFifaPresident ? 'FIFA Global President' : isContinentalPresident ? 'Continental President' : isFederationDirector ? 'Federation Director' : isRegionalDelegate ? 'Regional Delegate' : isClubPresident ? 'Club President' : agency.reputation >= 50 ? 'Multi-Club Investor' : 'Senior Football Agent'}
            </p>
          </div>
        </div>
      </div>

      {/* Graphical Roadmap Timeline Graph */}
      <div className="relative pt-4 pb-2">
        {/* Connecting Process Line */}
        <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-1 bg-slate-800 -translate-y-1/2 z-0" />

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 relative z-10">
          {nodes.map((node) => {
            const Icon = node.icon;

            return (
              <div
                key={node.id}
                onClick={() => onOpenTab(node.tabTarget)}
                className={`border rounded-2xl p-4 flex flex-col justify-between transition cursor-pointer relative overflow-hidden group ${
                  node.current 
                    ? 'bg-gradient-to-b from-amber-950/60 to-slate-900 border-amber-500 shadow-xl shadow-amber-500/10 scale-102' 
                    : node.unlocked 
                    ? 'bg-slate-800/80 border-slate-700 hover:border-slate-500' 
                    : 'bg-slate-900/40 border-slate-800/80 opacity-60'
                }`}
              >
                {node.current && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-bl">
                    Active Stage
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      node.unlocked 
                        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' 
                        : 'bg-slate-800 border border-slate-700 text-slate-500'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      node.unlocked ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {node.badge}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">{node.stage}</span>
                    <h4 className="text-sm font-bold text-white mt-0.5 group-hover:text-amber-300 transition">{node.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">{node.description}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="space-y-1">
                    {node.requirements.map((req, i) => (
                      <p key={i} className="text-[10px] text-slate-400 flex items-center gap-1">
                        {node.unlocked ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        ) : (
                          <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                        )}
                        <span>{req}</span>
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 group-hover:translate-x-1 transition pt-1">
                    <span>{node.unlocked ? 'View Power Hub' : 'Requirements Needed'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
