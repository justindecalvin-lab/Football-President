import React, { useState } from 'react';
import { AgencyState, Club, ClubShare } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { soundEngine } from '../utils/soundEffects';
import { 
  Crown, 
  Users, 
  DollarSign, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Award, 
  Percent,
  Megaphone,
  Briefcase
} from 'lucide-react';

interface ClubShareElectionModalProps {
  club: Club;
  share: ClubShare;
  agency: AgencyState;
  onClose: () => void;
  onElectionResult: (won: boolean, updatedAgency: AgencyState) => void;
  addToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ClubShareElectionModal: React.FC<ClubShareElectionModalProps> = ({
  club,
  share,
  agency,
  onClose,
  onElectionResult,
  addToast
}) => {
  const [promiseWarChest, setPromiseWarChest] = useState(false);
  const [promiseManager, setPromiseManager] = useState(false);
  const [promiseFanSubsidies, setPromiseFanSubsidies] = useState(false);
  const [promiseYouthAcademy, setPromiseYouthAcademy] = useState(false);
  const [spentInfluence, setSpentInfluence] = useState(10);
  const [isVoting, setIsVoting] = useState(false);
  const [voteResult, setVoteResult] = useState<{
    userVotes: number;
    boardVotes: number;
    won: boolean;
    breakdown: {
      equityVotes: number;
      fanVotes: number;
      institutionalVotes: number;
      influenceVotes: number;
    };
  } | null>(null);

  // Check Cooldown
  const currentWeek = agency.currentWeek || 1;
  const currentSeason = agency.currentSeason || 2026;
  const lastWeek = share.lastElectionWeek;
  const lastSeason = share.lastElectionSeason;

  const isSameSeason = lastSeason === currentSeason;
  const weeksSinceLast = lastWeek !== undefined && isSameSeason ? currentWeek - lastWeek : 999;
  const inCooldown = weeksSinceLast < 8;
  const weeksRemaining = Math.max(0, 8 - weeksSinceLast);

  // Cost calculation
  let campaignCost = 500000;
  if (promiseWarChest) campaignCost += 3000000;
  if (promiseManager) campaignCost += 1500000;
  if (promiseFanSubsidies) campaignCost += 1000000;
  if (promiseYouthAcademy) campaignCost += 1000000;

  const handleRunElection = () => {
    if (inCooldown) {
      alert(`Election cooldown in effect! You must wait ${weeksRemaining} more weeks before launching another proxy election at ${club.name}.`);
      return;
    }

    if (agency.balance < campaignCost) {
      alert(`Insufficient funds for this election campaign! Needed: ${formatMoney(campaignCost)}, Available: ${formatMoney(agency.balance)}.`);
      return;
    }

    soundEngine.playClick();
    setIsVoting(true);

    setTimeout(() => {
      // Calculate Voting Percentages
      const baseEquity = share.sharePercent; // e.g. 30%
      
      // Fan proxy votes (0 - 25%)
      let fanShare = 5 + Math.round((agency.reputation / 100) * 10);
      if (promiseFanSubsidies) fanShare += 8;
      if (promiseWarChest) fanShare += 4;
      fanShare = Math.min(25, fanShare);

      // Institutional shareholder votes (0 - 30%)
      let instShare = Math.round((club.reputation / 100) * 8);
      if (promiseWarChest) instShare += 10;
      if (promiseManager) instShare += 6;
      if (promiseYouthAcademy) instShare += 5;
      instShare = Math.min(30, instShare);

      // Influence boost (0 - 15%)
      const influenceBoost = Math.round((spentInfluence / 100) * 12);

      // Random swing (-5% to +5%)
      const swing = Math.floor(Math.random() * 11) - 5;

      const totalUserVotes = Math.min(100, Math.max(10, baseEquity + fanShare + instShare + influenceBoost + swing));
      const boardVotes = 100 - totalUserVotes;
      const won = totalUserVotes > 50;

      if (won) {
        soundEngine.playSuccess();
      } else {
        soundEngine.playError();
      }

      setVoteResult({
        userVotes: totalUserVotes,
        boardVotes,
        won,
        breakdown: {
          equityVotes: baseEquity,
          fanVotes: fanShare,
          institutionalVotes: instShare,
          influenceVotes: influenceBoost
        }
      });

      // Update Agency State
      const updatedShares = agency.clubShares.map(s => {
        if (s.clubId === club.id) {
          return {
            ...s,
            lastElectionWeek: currentWeek,
            lastElectionSeason: currentSeason,
            lastElectionWon: won
          };
        }
        return s;
      });

      let updatedAgency: AgencyState = {
        ...agency,
        balance: agency.balance - campaignCost,
        clubShares: updatedShares
      };

      if (won) {
        updatedAgency = {
          ...updatedAgency,
          activeRoles: {
            agent: false,
            club_owner: true,
            fa_president: false,
            currentRole: 'club_owner',
            presidentClubId: club.id,
            presidentClubName: club.name
          },
          presidency: {
            ...agency.presidency,
            role: 'Club President',
            clubId: club.id
          },
          milestones: [
            ...agency.milestones,
            {
              id: `milestone_pres_win_${Date.now()}`,
              week: currentWeek,
              season: currentSeason,
              title: `ELECTED CLUB PRESIDENT: ${club.name}`,
              description: `Won majority shareholder proxy vote with ${totalUserVotes}% of the ballot! Official presidential takeover enacted.`,
              type: 'election',
              impact: `Controlling Presidency of ${club.name}`
            }
          ]
        };
      }

      onElectionResult(won, updatedAgency);
      setIsVoting(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-slate-800 pb-4 pr-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Shareholder Proxy Battle</span>
              <h3 className="text-xl font-black text-white">Run for President of {club.name}</h3>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            You hold <strong>{share.sharePercent}% equity</strong>. Because you own under 50%, you must run a shareholder election campaign to convince institutional investors and fan clubs to grant you majority proxy voting control (&gt;50%).
          </p>
        </div>

        {/* Cooldown Warning */}
        {inCooldown && !voteResult && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-amber-300">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
            <div>
              <strong className="block font-bold">Election Cooldown Active</strong>
              <span>The board only allows one presidential proxy challenge every 8 weeks. Cooldown remaining: <strong>{weeksRemaining} weeks</strong>.</span>
            </div>
          </div>
        )}

        {/* Vote Results View */}
        {voteResult ? (
          <div className="space-y-5 py-2 animate-in fade-in zoom-in-95">
            <div className={`p-5 rounded-3xl border-2 text-center space-y-2 ${
              voteResult.won 
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300' 
                : 'bg-red-500/10 border-red-500/50 text-red-300'
            }`}>
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-slate-900 border border-slate-700">
                {voteResult.won ? <Crown className="w-6 h-6 text-emerald-400" /> : <ShieldAlert className="w-6 h-6 text-red-400" />}
              </div>
              <h4 className="text-xl font-black text-white">
                {voteResult.won ? 'VICTORY! YOU ARE NOW CLUB PRESIDENT!' : 'ELECTION DEFEATED BY INCUMBENT BOARD'}
              </h4>
              <p className="text-xs max-w-md mx-auto">
                {voteResult.won 
                  ? `You secured ${voteResult.userVotes}% of total shareholder & fan proxy votes, ousting the incumbent hierarchy! The Presidential Suite is now unlocked for ${club.name}.`
                  : `You secured ${voteResult.userVotes}% of votes, falling short of the 50.1% majority threshold. You retain your ${share.sharePercent}% equity, but must wait 8 weeks before launching another campaign.`
                }
              </p>
            </div>

            {/* Voting Breakdown */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-3 text-xs">
              <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Vote Tally Breakdown</div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Your Equity Base:</span>
                  <span className="font-bold text-white">+{voteResult.breakdown.equityVotes}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fan & Ultra Proxy Ballots:</span>
                  <span className="font-bold text-emerald-400">+{voteResult.breakdown.fanVotes}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Institutional Shareholder Proxies:</span>
                  <span className="font-bold text-indigo-400">+{voteResult.breakdown.institutionalVotes}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Political Influence Lobbying:</span>
                  <span className="font-bold text-amber-400">+{voteResult.breakdown.influenceVotes}%</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between font-black text-sm">
                  <span className="text-white">Total Shareholder Support:</span>
                  <span className={voteResult.won ? 'text-emerald-400' : 'text-red-400'}>{voteResult.userVotes}% / 100%</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Close Election Report
            </button>
          </div>
        ) : (
          /* Manifesto & Campaign Configuration */
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-2">Presidential Manifesto & Board Pledges</label>
              <div className="space-y-2">
                <label className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                  promiseWarChest ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}>
                  <input
                    type="checkbox"
                    checked={promiseWarChest}
                    onChange={e => setPromiseWarChest(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-500 focus:ring-0"
                  />
                  <div>
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>Promise €50M Transfer War Chest</span>
                      <span className="text-emerald-400 font-black">+14% Votes (€3.0M Campaign)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Pledge massive recruitment funds to satisfy institutional board members.</p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                  promiseManager ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}>
                  <input
                    type="checkbox"
                    checked={promiseManager}
                    onChange={e => setPromiseManager(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-500 focus:ring-0"
                  />
                  <div>
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>Appoint Elite Tactical Manager</span>
                      <span className="text-emerald-400 font-black">+8% Votes (€1.5M Campaign)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Commit to hiring a world-class manager to overhaul tactics.</p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                  promiseFanSubsidies ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}>
                  <input
                    type="checkbox"
                    checked={promiseFanSubsidies}
                    onChange={e => setPromiseFanSubsidies(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-500 focus:ring-0"
                  />
                  <div>
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>Slash Season Ticket Prices for Fans</span>
                      <span className="text-emerald-400 font-black">+10% Fan Votes (€1.0M Campaign)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Win the overwhelming backing of the Ultras and supporter clubs.</p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                  promiseYouthAcademy ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}>
                  <input
                    type="checkbox"
                    checked={promiseYouthAcademy}
                    onChange={e => setPromiseYouthAcademy(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-500 focus:ring-0"
                  />
                  <div>
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>Expand Global Youth Satellite Academy</span>
                      <span className="text-emerald-400 font-black">+6% Votes (€1.0M Campaign)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Promote long-term club self-sustainability and youth development.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Campaign Cost Summary */}
            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Campaign Budget</span>
                <span className="text-base font-black text-emerald-400">{formatMoney(campaignCost)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Agency Treasury</span>
                <span className="text-sm font-bold text-white">{formatMoney(agency.balance)}</span>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                disabled={inCooldown || isVoting}
                onClick={handleRunElection}
                className={`w-full py-3.5 rounded-2xl font-black text-xs tracking-wide flex items-center justify-center gap-2 transition cursor-pointer ${
                  inCooldown
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white shadow-lg shadow-indigo-500/25 active:scale-95'
                }`}
              >
                {isVoting ? (
                  <span>TALLYING SHAREHOLDER BALLOTS...</span>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    <span>LAUNCH PROXY ELECTION &amp; CALL VOTE</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
