import React, { useState } from 'react';
import { AgencyState, FederationTreasuryState, Club, Player } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { soundEngine } from '../utils/soundEffects';
import { 
  Landmark, 
  DollarSign, 
  Trophy, 
  Globe, 
  Users, 
  Sparkles, 
  Tv, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  Award, 
  Coins, 
  Flag, 
  Sliders, 
  Play, 
  Crown, 
  Briefcase,
  AlertTriangle,
  Flame,
  UserPlus,
  UserMinus,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FederationTreasuryTabProps {
  agency: AgencyState;
  clubs?: Club[];
  players?: Player[];
  onUpdateAgency: (agency: AgencyState) => void;
  onUpdateClub?: (club: Club) => void;
  onUpdateClubs?: (clubs: Club[]) => void;
  addToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const FederationTreasuryTab: React.FC<FederationTreasuryTabProps> = ({
  agency,
  clubs = [],
  players = [],
  onUpdateAgency,
  onUpdateClub,
  onUpdateClubs,
  addToast
}) => {
  const isFaPresident = agency.activeRoles?.currentRole === 'fa_president';

  const defaultTreasury: FederationTreasuryState = agency.federationTreasury || {
    treasuryBalance: 250000000,
    annualSponsorRevenue: 85000000,
    tvBroadcastPackageTotal: 380000000,
    broadcastDistributionModel: 'equal_merit',
    prizeMoneyPool: {
      championPrize: 45000000,
      top4Bonus: 20000000,
      midTableGrant: 8000000,
      relegationParachute: 12000000,
      grassrootsSubsidy: 10000000
    },
    nationalCoach: {
      name: 'Jurgen Klopp-Style',
      nationality: 'Germany',
      style: 'High-Press Machine',
      rating: 92,
      salary: 6500000,
      contractYears: 2,
      publicApproval: 88,
      targetTournamentGoal: 'Win the Trophy'
    },
    worldCupBid: {
      active: false,
      targetTournament: '2030 FIFA World Cup',
      bidBudgetInvested: 0,
      voterDelegatesSecured: 35,
      hostStadiumsPrepared: 6,
      status: 'bidding'
    },
    disbursedPrizeMoneyHistory: []
  };

  const [treasury, setTreasury] = useState<FederationTreasuryState>(defaultTreasury);
  const [championPrizeInput, setChampionPrizeInput] = useState(defaultTreasury.prizeMoneyPool.championPrize);
  const [top4BonusInput, setTop4BonusInput] = useState(defaultTreasury.prizeMoneyPool.top4Bonus);
  const [relegationParachuteInput, setRelegationParachuteInput] = useState(defaultTreasury.prizeMoneyPool.relegationParachute);
  const [grassrootsSubsidyInput, setGrassrootsSubsidyInput] = useState(defaultTreasury.prizeMoneyPool.grassrootsSubsidy);

  // Available National Head Coaches for Hire
  const AVAILABLE_COACHES = [
    {
      name: 'Pep Guardiola-Style',
      nationality: 'Spain',
      flag: '🇪🇸',
      style: 'Total Football' as const,
      rating: 96,
      salary: 8500000,
      contractYears: 3,
      desc: 'Obsessive possession, tiki-taka dominance & youth cultivation.'
    },
    {
      name: 'Jurgen Klopp-Style',
      nationality: 'Germany',
      flag: '🇩🇪',
      style: 'High-Press Machine' as const,
      rating: 93,
      salary: 6500000,
      contractYears: 2,
      desc: 'Heavy-metal pressing, infectious morale & tournament knockout resilience.'
    },
    {
      name: 'Carlo Ancelotti-Style',
      nationality: 'Italy',
      flag: '🇮🇹',
      style: 'Tactical Mastermind' as const,
      rating: 94,
      salary: 7200000,
      contractYears: 2,
      desc: 'Unshakable tactical adaptability & master of high-pressure finals.'
    },
    {
      name: 'Jose Mourinho-Style',
      nationality: 'Portugal',
      flag: '🇵🇹',
      style: 'Defensive Rock' as const,
      rating: 89,
      salary: 5000000,
      contractYears: 2,
      desc: 'Impenetrable low block, set-piece lethal counters & ruthless cup mentality.'
    }
  ];

  const handleUpdatePrizeMoney = () => {
    if (!isFaPresident) {
      alert('🔒 FA President Authority Required: Only the elected FA President can adjust official tournament prize allocations.');
      return;
    }

    const updated: FederationTreasuryState = {
      ...treasury,
      prizeMoneyPool: {
        ...treasury.prizeMoneyPool,
        championPrize: championPrizeInput,
        top4Bonus: top4BonusInput,
        relegationParachute: relegationParachuteInput,
        grassrootsSubsidy: grassrootsSubsidyInput
      }
    };

    setTreasury(updated);
    onUpdateAgency({
      ...agency,
      federationTreasury: updated
    });

    if (agency.soundEnabled) soundEngine.playClickSound();
    if (addToast) addToast('🏆 Tournament Prize Allocations legally updated by FA President Decree!', 'success');
  };

  const handleDisbursePrizeMoney = () => {
    if (!isFaPresident) {
      alert('🔒 FA President Authority Required: Only the elected FA President can disburse central federation prize money.');
      return;
    }

    const totalPrizePool = 
      championPrizeInput + 
      (top4BonusInput * 3) + 
      (treasury.prizeMoneyPool.midTableGrant * 8) + 
      (relegationParachuteInput * 3) + 
      grassrootsSubsidyInput;

    if (treasury.treasuryBalance < totalPrizePool) {
      alert(`Insufficient Treasury Balance! Needed: ${formatMoney(totalPrizePool)}, Available: ${formatMoney(treasury.treasuryBalance)}`);
      return;
    }

    // Disburse funds to league clubs based on standings/reputation
    const sortedClubs = [...clubs].sort((a, b) => b.reputation - a.reputation);
    const updatedClubsList = sortedClubs.map((club, idx) => {
      let prizeShare = 0;
      if (idx === 0) prizeShare = championPrizeInput;
      else if (idx <= 3) prizeShare = top4BonusInput;
      else if (idx >= sortedClubs.length - 3) prizeShare = relegationParachuteInput;
      else prizeShare = treasury.prizeMoneyPool.midTableGrant;

      return {
        ...club,
        transferBudget: club.transferBudget + Math.round(prizeShare * 0.75),
        wageBudget: club.wageBudget + Math.round((prizeShare * 0.25) / 52)
      };
    });

    if (onUpdateClubs) {
      onUpdateClubs(updatedClubsList);
    } else if (onUpdateClub) {
      updatedClubsList.forEach(c => onUpdateClub(c));
    }

    const updatedTreasury: FederationTreasuryState = {
      ...treasury,
      treasuryBalance: treasury.treasuryBalance - totalPrizePool,
      disbursedPrizeMoneyHistory: [
        {
          season: agency.currentSeason,
          championClubName: sortedClubs[0]?.name || 'Premier League Champions',
          totalPaidOut: totalPrizePool
        },
        ...(treasury.disbursedPrizeMoneyHistory || [])
      ]
    };

    setTreasury(updatedTreasury);
    onUpdateAgency({
      ...agency,
      federationTreasury: updatedTreasury
    });

    if (agency.soundEnabled) soundEngine.playCashSound();
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    if (addToast) {
      addToast(`🎉 ${formatMoney(totalPrizePool)} Season Prize Money successfully disbursed to all ${clubs.length} clubs!`, 'success');
    }
  };

  const handleChangeDistributionModel = (model: 'equal_merit' | 'top_heavy' | 'grassroots_equalizer') => {
    if (!isFaPresident) {
      alert('🔒 FA President Authority Required: Only the elected FA President can enact broadcast distribution models.');
      return;
    }

    const updated: FederationTreasuryState = {
      ...treasury,
      broadcastDistributionModel: model
    };

    setTreasury(updated);
    onUpdateAgency({
      ...agency,
      federationTreasury: updated
    });

    if (agency.soundEnabled) soundEngine.playClickSound();
    if (addToast) addToast(`📺 Broadcast Model changed to ${model.replace('_', ' ').toUpperCase()}!`, 'info');
  };

  const handleLaunchWorldCupBid = () => {
    if (!isFaPresident) {
      alert('🔒 FA President Authority Required: Launching international tournament bids requires the FA President mandate.');
      return;
    }

    if (treasury.treasuryBalance < 25000000) {
      alert('Launching an international tournament bid campaign requires €25,000,000 from the Federation Treasury.');
      return;
    }

    const updated: FederationTreasuryState = {
      ...treasury,
      treasuryBalance: treasury.treasuryBalance - 25000000,
      worldCupBid: {
        active: true,
        targetTournament: '2030 FIFA World Cup',
        bidBudgetInvested: (treasury.worldCupBid?.bidBudgetInvested || 0) + 25000000,
        voterDelegatesSecured: 65,
        hostStadiumsPrepared: 8,
        status: 'bidding'
      }
    };

    setTreasury(updated);
    onUpdateAgency({
      ...agency,
      federationTreasury: updated
    });

    if (agency.soundEnabled) soundEngine.playCashSound();
    if (addToast) addToast('🌍 2030 FIFA World Cup Official Bid Campaign Launched! Secured 65% delegate support.', 'success');
  };

  const handleFinalizeBidAward = () => {
    if (!isFaPresident) return;

    const updated: FederationTreasuryState = {
      ...treasury,
      treasuryBalance: treasury.treasuryBalance + 120000000, // Massive €120M economic windfall
      worldCupBid: {
        ...(treasury.worldCupBid || {
          targetTournament: '2030 FIFA World Cup',
          bidBudgetInvested: 25000000,
          voterDelegatesSecured: 100,
          hostStadiumsPrepared: 10
        }),
        active: false,
        status: 'awarded'
      }
    };

    setTreasury(updated);
    onUpdateAgency({
      ...agency,
      presidency: {
        ...agency.presidency,
        politicalInfluence: Math.min(100, (agency.presidency.politicalInfluence || 50) + 25)
      },
      federationTreasury: updated
    });

    if (agency.soundEnabled) soundEngine.playCashSound();
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
    if (addToast) addToast('🏆 TOURNAMENT HOSTING RIGHTS AWARDED! +€120,000,000 Treasury Windfall & +25 Political Influence!', 'success');
  };

  const handleHireNationalCoach = (coach: typeof AVAILABLE_COACHES[0]) => {
    if (!isFaPresident) {
      alert('🔒 FA President Authority Required: Appointing national team head coaches requires FA President executive authority.');
      return;
    }

    const updated: FederationTreasuryState = {
      ...treasury,
      nationalCoach: {
        name: coach.name,
        nationality: coach.nationality,
        style: coach.style,
        rating: coach.rating,
        salary: coach.salary,
        contractYears: coach.contractYears,
        publicApproval: 90,
        targetTournamentGoal: 'Win the Trophy'
      }
    };

    setTreasury(updated);
    onUpdateAgency({
      ...agency,
      federationTreasury: updated
    });

    if (agency.soundEnabled) soundEngine.playCashSound();
    confetti({ particleCount: 60 });
    if (addToast) addToast(`👔 ${coach.name} formally appointed as National Team Head Coach!`, 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Treasury Master Balance Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-900 border-2 border-indigo-400/50 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/30 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400/40 flex items-center justify-center text-amber-300 shadow">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded border border-amber-500/30">
                  Official Central Reserve
                </span>
                <span className="text-xs text-slate-400 font-bold">Season {agency.currentSeason}</span>
              </div>
              <h3 className="text-xl font-black text-white">Central Federation Treasury &amp; Revenue Distribution</h3>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Central Treasury Balance</p>
            <p className="text-2xl font-black text-emerald-400 tracking-wide font-mono">
              {formatMoney(treasury.treasuryBalance)}
            </p>
          </div>
        </div>

        {/* Inflow Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" /> Commercial Sponsors
            </p>
            <p className="text-lg font-black text-white">{formatMoney(treasury.annualSponsorRevenue)} / yr</p>
            <p className="text-[10px] text-emerald-400 font-bold">Guaranteed Inflow</p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-indigo-400" /> Global TV Rights
            </p>
            <p className="text-lg font-black text-white">{formatMoney(treasury.tvBroadcastPackageTotal)} / yr</p>
            <p className="text-[10px] text-indigo-300 font-bold">Broadcast Contract</p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-emerald-400" /> Total Tax Receipts
            </p>
            <p className="text-lg font-black text-emerald-400">{formatMoney(treasury.totalTaxRevenueCollected || 0)}</p>
            <p className="text-[10px] text-slate-400 font-bold">Progressive Tax Audits</p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-400" /> Distribution Model
            </p>
            <p className="text-sm font-black text-amber-400 capitalize">
              {treasury.broadcastDistributionModel.replace('_', ' ')}
            </p>
            <p className="text-[10px] text-slate-400 font-bold">Regulated by FA Decree</p>
          </div>
        </div>
      </div>

      {/* SECTION 0: FEDERATION TAX INTAKE & FISCAL AUDIT SUMMARY */}
      <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-400" />
            <h4 className="text-base font-black text-white">Federation Tax Inflows &amp; Fiscal Compliance Audits</h4>
          </div>
          <span className="text-xs text-emerald-400 font-bold">Progressive Tax Collection Active</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekly Agency Corporate Tax</span>
            <p className="text-xl font-black text-emerald-300 font-mono">
              +{formatMoney(treasury.weeklyCorporateTaxCollected || 0)} / wk
            </p>
            <p className="text-xs text-slate-400">
              Graduated corporate tax levied on weekly agency profits and credited to the Central FA Treasury.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekly Club Luxury Tax Levies</span>
            <p className="text-xl font-black text-amber-300 font-mono">
              +{formatMoney(treasury.weeklyLuxuryTaxCollected || 0)} / wk
            </p>
            <p className="text-xs text-slate-400">
              10% penalty surcharges on clubs exceeding the Federation Luxury Spending threshold.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cumulative Taxes Inflow</span>
            <p className="text-xl font-black text-white font-mono">
              {formatMoney(treasury.totalTaxRevenueCollected || 0)}
            </p>
            <p className="text-xs text-slate-400">
              Total lifetime taxes collected to fund national tournaments, grassroots grants, and infrastructure.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: TOURNAMENT PRIZE MONEY ALLOCATION SYSTEM */}
      <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h4 className="text-base font-black text-white">Domestic League &amp; Cup Prize Money Pool Allocation</h4>
          </div>
          <span className="text-xs text-slate-400">FA President Sets Official Payout Pools</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Champions Prize */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-amber-300 flex items-center justify-between">
              <span>🏆 1st Place Trophy Prize</span>
              <span className="font-mono text-white">{formatMoney(championPrizeInput)}</span>
            </label>
            <input
              type="range"
              min="20000000"
              max="100000000"
              step="5000000"
              value={championPrizeInput}
              onChange={(e) => setChampionPrizeInput(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Awarded to domestic league champions</p>
          </div>

          {/* Top 4 Bonus */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-indigo-300 flex items-center justify-between">
              <span>🥈 Top 4 UCL Pool (per club)</span>
              <span className="font-mono text-white">{formatMoney(top4BonusInput)}</span>
            </label>
            <input
              type="range"
              min="10000000"
              max="50000000"
              step="2500000"
              value={top4BonusInput}
              onChange={(e) => setTop4BonusInput(Number(e.target.value))}
              className="w-full accent-indigo-400 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Champions League qualification bonus</p>
          </div>

          {/* Relegation Parachute */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-red-300 flex items-center justify-between">
              <span>🛡️ Relegation Parachute</span>
              <span className="font-mono text-white">{formatMoney(relegationParachuteInput)}</span>
            </label>
            <input
              type="range"
              min="5000000"
              max="30000000"
              step="1000000"
              value={relegationParachuteInput}
              onChange={(e) => setRelegationParachuteInput(Number(e.target.value))}
              className="w-full accent-red-400 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Softens financial blow of relegation</p>
          </div>

          {/* Grassroots Subsidy */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-emerald-300 flex items-center justify-between">
              <span>🌱 Grassroots &amp; Academy Fund</span>
              <span className="font-mono text-white">{formatMoney(grassrootsSubsidyInput)}</span>
            </label>
            <input
              type="range"
              min="5000000"
              max="25000000"
              step="1000000"
              value={grassrootsSubsidyInput}
              onChange={(e) => setGrassrootsSubsidyInput(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Mandatory youth development investment</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={handleUpdatePrizeMoney}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer border border-slate-700 min-h-[44px]"
          >
            Save Prize Money Allocation Decree
          </button>

          <button
            onClick={handleDisbursePrizeMoney}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-500/20 min-h-[44px]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Disburse Season Prize Money to All League Clubs</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: TV BROADCAST DISTRIBUTION MODELS */}
      <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Tv className="w-5 h-5 text-indigo-400" />
          <h4 className="text-base font-black text-white">TV Broadcast Rights Distribution Model</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div
            onClick={() => handleChangeDistributionModel('equal_merit')}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer space-y-2 ${
              treasury.broadcastDistributionModel === 'equal_merit'
                ? 'border-indigo-400 bg-indigo-950/40 shadow-lg'
                : 'border-slate-800 bg-slate-950 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">Equal Merit Model (EPL Style)</span>
              {treasury.broadcastDistributionModel === 'equal_merit' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
            </div>
            <p className="text-[11px] text-slate-300">
              50% split equally among all 20 clubs, 25% based on league table merit, 25% on televised match appearances.
            </p>
            <span className="text-[10px] text-emerald-400 font-bold block">Maximizes league parity and international competitiveness</span>
          </div>

          <div
            onClick={() => handleChangeDistributionModel('top_heavy')}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer space-y-2 ${
              treasury.broadcastDistributionModel === 'top_heavy'
                ? 'border-indigo-400 bg-indigo-950/40 shadow-lg'
                : 'border-slate-800 bg-slate-950 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">Top-Heavy Giant Model (La Liga Classic)</span>
              {treasury.broadcastDistributionModel === 'top_heavy' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
            </div>
            <p className="text-[11px] text-slate-300">
              45% concentrated into the top 2 domestic giants (Real Madrid/Barcelona style), remainder split amongst rest.
            </p>
            <span className="text-[10px] text-amber-400 font-bold block">Creates Champions League superclubs, but widens domestic wealth gap</span>
          </div>

          <div
            onClick={() => handleChangeDistributionModel('grassroots_equalizer')}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer space-y-2 ${
              treasury.broadcastDistributionModel === 'grassroots_equalizer'
                ? 'border-indigo-400 bg-indigo-950/40 shadow-lg'
                : 'border-slate-800 bg-slate-950 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">Grassroots Equalizer (German 50+1 Style)</span>
              {treasury.broadcastDistributionModel === 'grassroots_equalizer' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
            </div>
            <p className="text-[11px] text-slate-300">
              Flat equal distribution with mandatory 20% youth academy reinvestment tax deducted at source.
            </p>
            <span className="text-[10px] text-purple-400 font-bold block">Massive wonderkid production and financial sustainability</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: INTERNATIONAL TOURNAMENT & WORLD CUP BIDDING */}
      <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-400" />
            <h4 className="text-base font-black text-white">International Tournament &amp; FIFA World Cup Bidding Hub</h4>
          </div>
          <span className="text-xs font-bold text-amber-300">Target: 2030 FIFA World Cup</span>
        </div>

        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">Official 2030 FIFA World Cup Host Bid</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                treasury.worldCupBid?.status === 'awarded' 
                  ? 'bg-emerald-500 text-slate-950' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {treasury.worldCupBid?.status === 'awarded' ? 'AWARDED & HOSTING' : 'ACTIVE BID CAMPAIGN'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Bid Budget Invested: <strong className="text-white">{formatMoney(treasury.worldCupBid?.bidBudgetInvested || 0)}</strong> • Delegate Support: <strong className="text-amber-400">{treasury.worldCupBid?.voterDelegatesSecured || 35}%</strong> • Modern Host Stadiums: <strong className="text-indigo-300">{treasury.worldCupBid?.hostStadiumsPrepared || 6}/10</strong>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {treasury.worldCupBid?.status !== 'awarded' ? (
              <>
                <button
                  onClick={handleLaunchWorldCupBid}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition cursor-pointer min-h-[44px]"
                >
                  Invest €25M in Bid Campaign
                </button>
                <button
                  onClick={handleFinalizeBidAward}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition cursor-pointer shadow min-h-[44px]"
                >
                  Finalize Bid &amp; Collect €120M Windfall
                </button>
              </>
            ) : (
              <span className="text-xs bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold px-4 py-2 rounded-xl">
                ✓ Hosting Rights Locked
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: NATIONAL TEAM HEAD COACH APPOINTMENTS */}
      <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            <h4 className="text-base font-black text-white">National Team Head Coach Appointments</h4>
          </div>
          {treasury.nationalCoach && (
            <span className="text-xs font-bold text-emerald-400">
              Active Coach: {treasury.nationalCoach.name} ({treasury.nationalCoach.rating} OVR)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {AVAILABLE_COACHES.map(coach => {
            const isCurrent = treasury.nationalCoach?.name === coach.name;

            return (
              <div
                key={coach.name}
                className={`p-4 rounded-2xl border-2 transition space-y-3 flex flex-col justify-between ${
                  isCurrent 
                    ? 'border-emerald-500 bg-emerald-950/30 shadow-lg' 
                    : 'border-slate-800 bg-slate-950'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{coach.flag}</span>
                    <span className="text-xs bg-slate-800 text-amber-300 font-black px-2 py-0.5 rounded">
                      {coach.rating} OVR
                    </span>
                  </div>
                  <h5 className="text-xs font-black text-white mt-1">{coach.name}</h5>
                  <p className="text-[10px] text-indigo-300 font-bold">{coach.style}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{coach.desc}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <p className="text-[10px] text-slate-400">Salary: <strong className="text-white">{formatMoney(coach.salary)} / yr</strong></p>
                  {isCurrent ? (
                    <span className="w-full block text-center text-xs bg-emerald-500/20 text-emerald-300 font-bold py-1.5 rounded-lg border border-emerald-500/40">
                      Current Head Coach
                    </span>
                  ) : (
                    <button
                      onClick={() => handleHireNationalCoach(coach)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer min-h-[44px]"
                    >
                      Appoint Coach
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
