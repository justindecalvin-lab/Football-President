import React, { useState } from 'react';
import { Club, AgencyState, BoardOfDirectorsState, BoardMember, BoardMandate, SportingDirectorProfile } from '../types';
import { formatMoney } from '../utils/gameEngine';
import {
  conveneBoardMeeting,
  getMarketSportingDirectors,
  executeHireSportingDirector
} from '../utils/roleInteractionsEngine';
import {
  Building,
  Users,
  ShieldCheck,
  Award,
  Vote,
  TrendingUp,
  AlertTriangle,
  Briefcase,
  DollarSign,
  Crown,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  FileText,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BoardOfDirectorsViewProps {
  club: Club;
  agency: AgencyState;
  onUpdateAgency: (agency: AgencyState) => void;
  onUpdateClub: (club: Club) => void;
  addToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const BoardOfDirectorsView: React.FC<BoardOfDirectorsViewProps> = ({
  club,
  agency,
  onUpdateAgency,
  onUpdateClub,
  addToast
}) => {
  const [selectedMotion, setSelectedMotion] = useState<
    'capital_injection' | 'wage_cap_exemption' | 'stadium_expansion_bond' | 'manager_dismissal' | 'commercial_partnership'
  >('capital_injection');
  const [isVoting, setIsVoting] = useState(false);
  const [activeTab, setActiveTab] = useState<'boardroom' | 'mandates' | 'meeting' | 'directors'>('boardroom');

  const board: BoardOfDirectorsState = club.boardOfDirectors || {
    boardTrust: 80,
    chairpersonName: 'Lord Alistair Sterling',
    chairpersonStance: 'Supportive & Ambitious',
    members: [],
    mandates: [],
    spendingLimitPerTransfer: 45000000,
    wageCapPerPlayer: 180000,
    emergencyBailoutAvailable: true,
    emergencyBailoutAmount: 20000000,
    boardMeetingsHistory: []
  };

  const marketDirectors = getMarketSportingDirectors();

  // Call Extraordinary Board Meeting
  const handleConveneMeeting = () => {
    setIsVoting(true);
    setTimeout(() => {
      setIsVoting(false);
      const outcome = conveneBoardMeeting(
        club,
        selectedMotion,
        agency,
        agency.currentWeek,
        agency.currentSeason
      );

      if (outcome.updatedClub) onUpdateClub(outcome.updatedClub);
      if (outcome.updatedAgency) onUpdateAgency(outcome.updatedAgency);

      if (addToast) {
        addToast(outcome.message, outcome.type);
      }

      if (outcome.type === 'success') {
        confetti({ particleCount: 60, spread: 60 });
      }
    }, 600);
  };

  // Hire a new Sporting Director
  const handleHireDirector = (candidate: SportingDirectorProfile) => {
    const outcome = executeHireSportingDirector(club, candidate, agency);

    if (outcome.updatedClub) onUpdateClub(outcome.updatedClub);
    if (outcome.updatedAgency) onUpdateAgency(outcome.updatedAgency);

    if (addToast) {
      addToast(outcome.message, outcome.type);
    }

    if (outcome.type === 'success') {
      confetti({ particleCount: 70, spread: 70 });
    }
  };

  const members = board.members || [];
  const mandates = board.mandates || [];
  const history = board.boardMeetingsHistory || [];

  return (
    <div className="space-y-6">
      {/* Boardroom Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-2 border-indigo-500/40 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400 flex items-center justify-center text-3xl shadow-inner shrink-0">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Supreme Board of Directors
                </span>
                <span className="text-xs text-amber-400 font-bold">{board.chairpersonStance}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {club.name} Boardroom Chamber
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Chairperson: <strong className="text-white">{board.chairpersonName}</strong> • Transfer Ceiling: <strong className="text-emerald-400">{formatMoney(board.spendingLimitPerTransfer)}</strong> • Wage Cap: <strong className="text-amber-300">{formatMoney(board.wageCapPerPlayer)}/wk</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950/90 border border-indigo-500/30 px-5 py-3 rounded-2xl text-center shadow-lg">
              <span className="text-[10px] font-black uppercase text-slate-400">Board Confidence</span>
              <p className="text-2xl font-black text-amber-400">{board.boardTrust}%</p>
              <span className="text-[10px] text-emerald-400 font-semibold">
                {board.boardTrust >= 75 ? 'Solid Backing' : board.boardTrust >= 50 ? 'Moderate Support' : 'Under Pressure'}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pt-5 mt-5 border-t border-slate-800 scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('boardroom')}
            className={`py-2.5 px-4 rounded-2xl font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
              activeTab === 'boardroom'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-950/40'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Shareholders &amp; Board Members ({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mandates')}
            className={`py-2.5 px-4 rounded-2xl font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
              activeTab === 'mandates'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-950/40'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Board Directives &amp; Mandates ({mandates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('meeting')}
            className={`py-2.5 px-4 rounded-2xl font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
              activeTab === 'meeting'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Vote className="w-4 h-4" />
            <span>Convene Extraordinary Vote</span>
          </button>

          <button
            onClick={() => setActiveTab('directors')}
            className={`py-2.5 px-4 rounded-2xl font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
              activeTab === 'directors'
                ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-950/40'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Hire Sporting Director</span>
          </button>
        </div>
      </div>

      {/* 1. TAB: BOARD MEMBERS & FACTIONS */}
      {activeTab === 'boardroom' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>Board of Directors Factional Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400">
              Each member holds voting equity and guides club strategic policy.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => {
              const factionColors = {
                commercial: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300',
                traditionalist: 'border-amber-500/40 bg-amber-950/30 text-amber-300',
                fan_representative: 'border-sky-500/40 bg-sky-950/30 text-sky-300',
                sporting: 'border-purple-500/40 bg-purple-950/30 text-purple-300'
              };

              return (
                <div
                  key={member.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${factionColors[member.faction] || 'bg-slate-800 text-slate-300'}`}>
                        {member.faction.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-black text-amber-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                        {member.shareholding}% Equity
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                        {member.avatar || '🧐'}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">{member.name}</h4>
                        <p className="text-xs text-slate-400">{member.role}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Loyalty to President:</span>
                      <strong className="text-emerald-400 font-bold">{member.loyalty}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Boardroom Mood:</span>
                      <strong className="text-amber-300 font-semibold capitalize">{member.mood}</strong>
                    </div>
                    <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 italic">
                      "{member.priorities}"
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. TAB: STRATEGIC MANDATES */}
      {activeTab === 'mandates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Season Directives &amp; Financial Fair Play Mandates</span>
            </h3>
            <span className="text-xs text-slate-400">
              Fulfilling mandates boosts Board Trust and unlocks emergency credit lines.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mandates.map((m) => (
              <div
                key={m.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {m.category} Mandate
                    </span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                      +{m.rewardApprovalBonus}% Trust
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white">{m.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{m.description}</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Metric:</span>
                    <strong className="text-white">{m.targetMetric}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <strong className="text-emerald-400 capitalize">{m.status.replace('_', ' ')}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TAB: CONVENE EXTRAORDINARY MEETING */}
      {activeTab === 'meeting' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Presidential Summoning Authority
            </span>
            <h3 className="text-xl font-black text-white mt-1">Convene Extraordinary Board Meeting</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Submit a major strategic resolution to the Board of Directors. Members will cast binding votes based on factional alignment and presidential loyalty.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                id: 'capital_injection',
                title: '💰 Emergency Transfer Equity (+€20M)',
                desc: 'Issue new shares to inject €20,000,000 directly into the transfer treasury.',
                favorable: 'Commercial Factions'
              },
              {
                id: 'wage_cap_exemption',
                title: '📈 Superstar Wage Cap Exemption (+€50k/wk)',
                desc: 'Raise player weekly wage ceiling to €230,000/wk for world-class galactico signings.',
                favorable: 'Sporting Factions'
              },
              {
                id: 'stadium_expansion_bond',
                title: '🏗️ Stadium Expansion Bond (+4,500 seats)',
                desc: 'Authorize capital expenditure to expand stadium capacity and matchday revenue.',
                favorable: 'Fan Trust Trustees'
              },
              {
                id: 'manager_dismissal',
                title: '👔 Managerial Contract Termination',
                desc: 'Sack the head coach due to poor results and initiate executive manager search.',
                favorable: 'Sporting Advisers'
              },
              {
                id: 'commercial_partnership',
                title: '🤝 Global Tier-1 Commercial Sponsorship (+€5M)',
                desc: 'Ratify international brand sponsorship deal providing immediate liquidity.',
                favorable: 'Commercial & Traditionalist'
              }
            ].map((motion) => (
              <div
                key={motion.id}
                onClick={() => setSelectedMotion(motion.id as any)}
                className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                  selectedMotion === motion.id
                    ? 'bg-amber-950/40 border-amber-400 shadow-lg shadow-amber-950/40'
                    : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <h4 className="text-xs font-black text-white">{motion.title}</h4>
                <p className="text-[11px] text-slate-300">{motion.desc}</p>
                <span className="text-[10px] text-indigo-300 font-bold block pt-1">
                  Primary Ally: {motion.favorable}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800">
            <p className="text-xs text-slate-400">
              Requires a majority vote (3 of 5 members) to pass.
            </p>

            <button
              onClick={handleConveneMeeting}
              disabled={isVoting}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Vote className="w-4 h-4" />
              <span>{isVoting ? 'Tallying Board Votes...' : 'Call Boardroom Vote on Motion'}</span>
            </button>
          </div>

          {/* Meeting History Logs */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">
              Boardroom Minutes &amp; Historical Resolutions
            </h4>
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Week {item.week}: {item.topic}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      item.outcome === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {item.outcome} ({item.voteTally})
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] italic">{item.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB: HIRE SPORTING DIRECTOR */}
      {activeTab === 'directors' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Executive Appointments
            </span>
            <h3 className="text-xl font-black text-white mt-1">Hire World-Class Sporting Director</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Appoint an elite sporting architect to spearhead your club's transfer negotiations, scouting operations, and squad construction.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketDirectors.map((cand) => {
              const isCurrent = club.sportingDirectorProfile?.name === cand.name;
              return (
                <div
                  key={cand.id}
                  className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 ${
                    isCurrent
                      ? 'bg-indigo-950/40 border-indigo-400 shadow-xl'
                      : 'bg-slate-950 border-slate-800 shadow-lg'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">
                        {cand.tacticalFocus} Doctrine
                      </span>
                      <span className="text-xs font-black text-amber-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                        {cand.rating} OVR
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                        {cand.avatar || '👔'}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">{cand.name}</h4>
                        <p className="text-xs text-indigo-300">{cand.personality}</p>
                      </div>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Scouting Eye:</span>
                        <strong className="text-emerald-400 font-bold">{cand.scoutingRating} OVR</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Deal Success Bonus:</span>
                        <strong className="text-amber-400">+{cand.dealSuccessBonus}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Executive Wage:</span>
                        <strong className="text-white">{formatMoney(cand.wage)}/wk</strong>
                      </div>
                    </div>
                  </div>

                  {isCurrent ? (
                    <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold py-2.5 rounded-xl text-xs text-center">
                      ✓ Currently In Office
                    </div>
                  ) : (
                    <button
                      onClick={() => handleHireDirector(cand)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-950/40"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Appoint ({formatMoney(cand.wage * 4)} Signing Fee)</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
