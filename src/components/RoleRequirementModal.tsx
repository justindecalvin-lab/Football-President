import React from 'react';
import { AgencyState, Club } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { soundEngine } from '../utils/soundEffects';
import { 
  Crown, 
  Globe, 
  Briefcase, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Trophy, 
  DollarSign, 
  ShieldCheck, 
  Award,
  Vote
} from 'lucide-react';

interface RoleRequirementModalProps {
  targetRole: 'club_owner' | 'fa_president';
  agency: AgencyState;
  clubs: Club[];
  onClose: () => void;
  onNavigateToTab: (tab: string) => void;
  onPromoteToRole: (role: 'club_owner' | 'fa_president') => void;
}

export const RoleRequirementModal: React.FC<RoleRequirementModalProps> = ({
  targetRole,
  agency,
  clubs,
  onClose,
  onNavigateToTab,
  onPromoteToRole
}) => {
  if (targetRole === 'club_owner') {
    // Check if user already owns >50% in any club or won an election
    const ownedClubShare = agency.clubShares.find(s => s.sharePercent > 50 || s.lastElectionWon);
    const anyShares = agency.clubShares.filter(s => s.sharePercent > 0);

    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 border-b border-slate-800 pb-4 pr-10">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Career Progression Rule</span>
              <h3 className="text-xl font-black text-white">Club President Locked</h3>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              As a licensed Football Agent, you cannot assume a Club Presidency until you acquire controlling equity or win a shareholder election in that club.
            </p>

            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-2.5">
              <div className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">How to Become Club President:</div>
              
              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded bg-indigo-500/20 text-indigo-400 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-white block">Majority Buyout (&gt;50% Shares)</strong>
                  <span className="text-slate-400">Save capital and purchase over 50% shares in Tycoon & Empire tab to trigger an automatic takeover.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded bg-amber-500/20 text-amber-400 mt-0.5">
                  <Vote className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-white block">Shareholder Proxy Election (&lt;50% Shares)</strong>
                  <span className="text-slate-400">Acquire 20% to 40% equity and launch a board election to win over institutional &amp; fan proxy votes.</span>
                </div>
              </div>
            </div>

            {/* Current Shares Progress */}
            <div>
              <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">Your Current Club Stakes:</div>
              {anyShares.length > 0 ? (
                <div className="space-y-1.5">
                  {anyShares.map(s => {
                    const c = clubs.find(cl => cl.id === s.clubId);
                    return (
                      <div key={s.clubId} className="flex items-center justify-between bg-slate-950/60 border border-slate-800 px-3 py-2 rounded-xl">
                        <span className="font-bold text-white">{c?.name || s.clubName || 'Football Club'}</span>
                        <span className="text-xs font-black text-indigo-400">{s.sharePercent}% Equity</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 italic bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                  No club shares owned yet. Visit the Tycoon &amp; Empire hub to acquire your first stake.
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
                onNavigateToTab('tycoon');
              }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-black text-xs transition shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Go to Tycoon Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Target: FA President Requirements
  const reqRep = agency.reputation >= 85;
  const reqFunds = agency.balance >= 50000000;
  const reqHonours = (agency.trophiesWon?.length || 0) >= 2;
  const reqEthics = (agency.darkArtsScore || 0) <= 25;

  const allMet = reqRep && reqFunds && reqHonours && reqEthics;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 pr-10">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Continental Governance</span>
            <h3 className="text-xl font-black text-white">FA Presidential Election Criteria</h3>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The FIFA &amp; Continental Congress requires candidates to prove elite global stature, vast financial reserves, and institutional prestige before qualifying for election.
        </p>

        {/* 4 Core Requirements */}
        <div className="space-y-2.5 text-xs">
          {/* 1. Reputation */}
          <div className={`p-3 rounded-2xl border flex items-center justify-between ${
            reqRep ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center gap-2.5">
              {reqRep ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-slate-500" />}
              <div>
                <strong className="text-white block">Agency / Executive Reputation ≥ 85</strong>
                <span className="text-[11px] text-slate-400">Current Reputation: {agency.reputation}/100</span>
              </div>
            </div>
            <span className={`text-xs font-black ${reqRep ? 'text-emerald-400' : 'text-slate-500'}`}>
              {reqRep ? 'QUALIFIED' : `${85 - agency.reputation} more needed`}
            </span>
          </div>

          {/* 2. Treasury */}
          <div className={`p-3 rounded-2xl border flex items-center justify-between ${
            reqFunds ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center gap-2.5">
              {reqFunds ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-slate-500" />}
              <div>
                <strong className="text-white block">Personal / Agency Reserves ≥ €50,000,000</strong>
                <span className="text-[11px] text-slate-400">Current Balance: {formatMoney(agency.balance)}</span>
              </div>
            </div>
            <span className={`text-xs font-black ${reqFunds ? 'text-emerald-400' : 'text-slate-500'}`}>
              {reqFunds ? 'QUALIFIED' : 'Insufficient Capital'}
            </span>
          </div>

          {/* 3. Honours */}
          <div className={`p-3 rounded-2xl border flex items-center justify-between ${
            reqHonours ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center gap-2.5">
              {reqHonours ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-slate-500" />}
              <div>
                <strong className="text-white block">Trophies / Career Honours Won ≥ 2</strong>
                <span className="text-[11px] text-slate-400">Total Honours: {agency.trophiesWon?.length || 0}</span>
              </div>
            </div>
            <span className={`text-xs font-black ${reqHonours ? 'text-emerald-400' : 'text-slate-500'}`}>
              {reqHonours ? 'QUALIFIED' : `${Math.max(0, 2 - (agency.trophiesWon?.length || 0))} more needed`}
            </span>
          </div>

          {/* 4. Ethics Record */}
          <div className={`p-3 rounded-2xl border flex items-center justify-between ${
            reqEthics ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center gap-2.5">
              {reqEthics ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-slate-500" />}
              <div>
                <strong className="text-white block">Ethics &amp; Scandal Index ≤ 25</strong>
                <span className="text-[11px] text-slate-400">Dark Arts Score: {agency.darkArtsScore || 0}</span>
              </div>
            </div>
            <span className={`text-xs font-black ${reqEthics ? 'text-emerald-400' : 'text-amber-400'}`}>
              {reqEthics ? 'PASSED' : 'Ethics Violation'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            Dismiss
          </button>
          
          <button
            disabled={!allMet}
            onClick={() => {
              if (!allMet) return;
              soundEngine.playGavel();
              onPromoteToRole('fa_president');
              onClose();
            }}
            className={`flex-1 py-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
              allMet
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Launch FA Candidacy &amp; Assume Role</span>
          </button>
        </div>
      </div>
    </div>
  );
};
