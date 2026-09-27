import React, { useState } from 'react';
import { 
  AgencyState, 
  Player, 
  Club, 
  AssistantDelegateState, 
  AssistantRecruitmentCriteria 
} from '../types';
import { formatMoney } from '../utils/gameEngine';
import { soundEngine } from '../utils/soundEffects';
import { 
  DEFAULT_ASSISTANT_STATE, 
  executeDelegatedScoutAndSignMission 
} from '../utils/assistantEngine';
import { 
  X, 
  Briefcase, 
  UserCheck, 
  DollarSign, 
  Sparkles, 
  Sliders, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Award, 
  Zap, 
  RefreshCw, 
  Users, 
  Layers,
  ArrowRight,
  Compass,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AssistantRecruiterModalProps {
  agency: AgencyState;
  players: Player[];
  clubs: Club[];
  onClose: () => void;
  onUpdateAgency: (agency: AgencyState) => void;
  onUpdatePlayers: (players: Player[]) => void;
  addToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AssistantRecruiterModal: React.FC<AssistantRecruiterModalProps> = ({
  agency,
  players,
  clubs,
  onClose,
  onUpdateAgency,
  onUpdatePlayers,
  addToast
}) => {
  const assistant: AssistantDelegateState = agency.assistantDelegate || {
    ...DEFAULT_ASSISTANT_STATE,
    allocatedBudget: 1500000,
    remainingBudget: 1500000
  };

  const [activeTab, setActiveTab] = useState<'control' | 'criteria' | 'history'>('control');
  const [depositAmount, setDepositAmount] = useState<number>(500000);
  const [isRunningMission, setIsRunningMission] = useState<boolean>(false);
  const [lastMissionResult, setLastMissionResult] = useState<string | null>(null);

  // Criteria State
  const [criteria, setCriteria] = useState<AssistantRecruitmentCriteria>(assistant.criteria);
  const [autoRecruit, setAutoRecruit] = useState<boolean>(assistant.autoRecruitActive);

  // Save criteria helper
  const handleSaveCriteria = (newCriteria: AssistantRecruitmentCriteria, autoToggle?: boolean) => {
    const updatedAssistant: AssistantDelegateState = {
      ...assistant,
      criteria: newCriteria,
      autoRecruitActive: autoToggle !== undefined ? autoToggle : autoRecruit
    };

    onUpdateAgency({
      ...agency,
      assistantDelegate: updatedAssistant
    });

    if (addToast) {
      addToast('✅ Assistant recruitment criteria updated successfully!', 'success');
    }
  };

  // Deposit funds into Assistant Treasury
  const handleDepositBudget = () => {
    if (agency.balance < depositAmount) {
      alert(`Insufficient agency funds! You have ${formatMoney(agency.balance)}, need ${formatMoney(depositAmount)}.`);
      return;
    }

    if (agency.soundEnabled) soundEngine.playCashSound();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });

    const newRemaining = assistant.remainingBudget + depositAmount;
    const newAllocated = assistant.allocatedBudget + depositAmount;

    const updatedAssistant: AssistantDelegateState = {
      ...assistant,
      allocatedBudget: newAllocated,
      remainingBudget: newRemaining
    };

    const updatedAgency: AgencyState = {
      ...agency,
      balance: agency.balance - depositAmount,
      assistantDelegate: updatedAssistant
    };

    onUpdateAgency(updatedAgency);
    if (addToast) {
      addToast(`💰 Deposited ${formatMoney(depositAmount)} into Assistant Recruitment Treasury!`, 'success');
    }
  };

  // Withdraw funds back from Assistant Treasury to Agency Balance
  const handleWithdrawBudget = () => {
    if (assistant.remainingBudget <= 0) {
      alert('Assistant Treasury has no remaining funds to withdraw!');
      return;
    }

    const withdrawAmt = assistant.remainingBudget;
    if (agency.soundEnabled) soundEngine.playCashSound();

    const updatedAssistant: AssistantDelegateState = {
      ...assistant,
      remainingBudget: 0,
      allocatedBudget: Math.max(0, assistant.allocatedBudget - withdrawAmt)
    };

    const updatedAgency: AgencyState = {
      ...agency,
      balance: agency.balance + withdrawAmt,
      assistantDelegate: updatedAssistant
    };

    onUpdateAgency(updatedAgency);
    if (addToast) {
      addToast(`↩️ Withdrew ${formatMoney(withdrawAmt)} from Assistant back to Agency Balance!`, 'info');
    }
  };

  // Run Immediate Recruitment Mission
  const handleRunImmediateMission = () => {
    if (assistant.remainingBudget < 100000) {
      alert(`Assistant needs at least €100,000 in delegated budget to conduct an active signing campaign! Current Treasury: ${formatMoney(assistant.remainingBudget)}.`);
      return;
    }

    setIsRunningMission(true);
    if (agency.soundEnabled) soundEngine.playClickSound();

    setTimeout(() => {
      const outcome = executeDelegatedScoutAndSignMission(
        assistant,
        agency,
        players,
        clubs,
        agency.currentWeek || 1,
        agency.currentSeason || 2026
      );

      setIsRunningMission(false);
      onUpdateAgency(outcome.updatedAgency);
      onUpdatePlayers(outcome.updatedPlayers);
      setLastMissionResult(outcome.record.verdictLog);

      if (outcome.success) {
        if (agency.soundEnabled) soundEngine.playSuccess();
        confetti({ particleCount: 80, spread: 70 });
        if (addToast) addToast(outcome.toastMessage, 'success');
      } else {
        if (agency.soundEnabled) soundEngine.playError();
        if (addToast) addToast(outcome.toastMessage, 'error');
      }
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-5 relative text-white my-auto max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-4 pr-10 shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center text-3xl shadow-lg shrink-0 border border-white/20">
            {assistant.avatar || '👔'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-amber-400" />
                <span>Executive Delegated Recruitment</span>
              </span>
              <span className="text-xs text-emerald-400 font-bold">
                Rating: {assistant.assistantRating} OVR
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{assistant.assistantName}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {assistant.assistantTitle} • Auto-recruits new client talent within allocated budget & targets.
            </p>
          </div>
        </div>

        {/* Treasury & KPI Quick Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shrink-0 text-center text-xs">
          <div>
            <p className="text-slate-400 text-[11px]">Treasury Budget</p>
            <p className="text-base font-black text-emerald-400">{formatMoney(assistant.remainingBudget)}</p>
            <p className="text-[10px] text-slate-500">Allocated: {formatMoney(assistant.allocatedBudget)}</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Total Clients Signed</p>
            <p className="text-base font-black text-amber-300">{assistant.totalSignedCount || 0} Players</p>
            <p className="text-[10px] text-slate-500">By Assistant</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Total Budget Spent</p>
            <p className="text-base font-black text-blue-400">{formatMoney(assistant.totalBudgetSpent || 0)}</p>
            <p className="text-[10px] text-slate-500">Bonuses & Fees</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Weekly Auto-Recruit</p>
            <p className={`text-base font-black ${assistant.autoRecruitActive ? 'text-emerald-400' : 'text-slate-500'}`}>
              {assistant.autoRecruitActive ? 'ACTIVE' : 'PAUSED'}
            </p>
            <p className="text-[10px] text-slate-500">Runs Every Week</p>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex border-b border-slate-800 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('control')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'control'
                ? 'bg-indigo-500/10 text-indigo-300 border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Mission Control & Treasury</span>
          </button>

          <button
            onClick={() => setActiveTab('criteria')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'criteria'
                ? 'bg-indigo-500/10 text-indigo-300 border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Recruitment Criteria & Bounds</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-indigo-500/10 text-indigo-300 border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Signing History ({assistant.history?.length || 0})</span>
          </button>
        </div>

        {/* Dynamic Tab Body */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {/* TAB 1: MISSION CONTROL & TREASURY */}
          {activeTab === 'control' && (
            <div className="space-y-4">
              {/* Treasury Management Box */}
              <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Assistant Treasury Allocation</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Transfer funds from your Agency Balance ({formatMoney(agency.balance)}) into your Assistant's dedicated recruitment treasury to cover player sign-on bonuses and scout operations.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex-1 w-full flex items-center gap-2">
                    {[250000, 500000, 1000000, 2500000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDepositAmount(amt)}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          depositAmount === amt
                            ? 'bg-emerald-600 text-white border-emerald-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        +{formatMoney(amt)}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleDepositBudget}
                      className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Deposit {formatMoney(depositAmount)}</span>
                    </button>

                    {assistant.remainingBudget > 0 && (
                      <button
                        onClick={handleWithdrawBudget}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer"
                        title="Withdraw all remaining funds back to Agency Balance"
                      >
                        Withdraw All
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Immediate Mission Trigger Box */}
              <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 p-5 rounded-2xl border border-indigo-500/40 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="font-extrabold text-base text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <span>Dispatch Assistant on Immediate Mission</span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Direct {assistant.assistantName} to immediately scout, negotiate, and sign a talent matching your criteria right now.
                    </p>
                  </div>

                  <button
                    onClick={handleRunImmediateMission}
                    disabled={isRunningMission}
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs cursor-pointer transition shadow-xl flex items-center gap-2 disabled:opacity-50"
                  >
                    {isRunningMission ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Negotiating Pitch...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-slate-950" />
                        <span>Launch Immediate Mission</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Result Feedback Banner */}
                {lastMissionResult && (
                  <div className="bg-slate-950/90 border border-indigo-500/50 p-3.5 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-amber-400" /> Latest Mission Outcome:
                    </span>
                    <p className="text-slate-200 leading-relaxed italic">{lastMissionResult}</p>
                  </div>
                )}
              </div>

              {/* Auto-Recruitment Toggle */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white">Continuous Weekly Background Recruitment</h4>
                  <p className="text-[11px] text-slate-400">
                    When enabled, {assistant.assistantName} automatically scans the market and signs players every week during week advance if budget is available.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newToggle = !autoRecruit;
                    setAutoRecruit(newToggle);
                    handleSaveCriteria(criteria, newToggle);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${
                    autoRecruit
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  {autoRecruit ? 'Enabled (Active)' : 'Disabled'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: RECRUITMENT CRITERIA & BOUNDS */}
          {activeTab === 'criteria' && (
            <div className="space-y-4 bg-slate-950/90 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span>Recruitment Criteria & Delegation Boundaries</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Define the exact profile, position, rating thresholds, and financial limits your assistant must adhere to.
                  </p>
                </div>

                <button
                  onClick={() => handleSaveCriteria(criteria)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Criteria</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Target Category */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Target Position / Category:</label>
                  <select
                    value={criteria.targetCategory}
                    onChange={(e) => setCriteria({ ...criteria, targetCategory: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 font-bold"
                  >
                    <option value="ANY">Any Position / All Categories</option>
                    <option value="WONDERKIDS">⭐ Wonderkids & High Potential (U20)</option>
                    <option value="ATTACKERS">⚽ Attackers (ST, LW, RW)</option>
                    <option value="MIDFIELDERS">🎯 Midfielders (CAM, CM, CDM)</option>
                    <option value="DEFENDERS">🛡️ Defenders (CB, LB, RB)</option>
                    <option value="GOALKEEPERS">🧤 Goalkeepers (GK)</option>
                  </select>
                </div>

                {/* Age Bracket */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Age Bracket:</label>
                  <select
                    value={criteria.ageBracket}
                    onChange={(e) => setCriteria({ ...criteria, ageBracket: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 font-bold"
                  >
                    <option value="ANY">Any Age (16 - 36)</option>
                    <option value="WONDERKID_U20">Wonderkids Only (Under 20)</option>
                    <option value="PRIME_21_26">Prime Age (21 - 26)</option>
                    <option value="EXPERIENCED_27_PLUS">Experienced Veterans (27+)</option>
                  </select>
                </div>

                {/* Min Rating */}
                <div className="space-y-1.5 bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-bold">Minimum Rating (OVR):</span>
                    <strong className="text-emerald-400 font-black">{criteria.minRating} OVR</strong>
                  </div>
                  <input
                    type="range"
                    min="55"
                    max="88"
                    value={criteria.minRating}
                    onChange={(e) => setCriteria({ ...criteria, minRating: Number(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>55 (Prospect)</span>
                    <span>75 (First Team)</span>
                    <span>88 (Elite Star)</span>
                  </div>
                </div>

                {/* Min Potential */}
                <div className="space-y-1.5 bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-bold">Minimum Potential (POT):</span>
                    <strong className="text-amber-400 font-black">{criteria.minPotential} POT</strong>
                  </div>
                  <input
                    type="range"
                    min="65"
                    max="95"
                    value={criteria.minPotential}
                    onChange={(e) => setCriteria({ ...criteria, minPotential: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>65 (Decent)</span>
                    <span>82 (Top League)</span>
                    <span>95 (Generational)</span>
                  </div>
                </div>

                {/* Max Sign-on Bonus Cap */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Max Sign-on Bonus Allowed Per Player:</label>
                  <select
                    value={criteria.maxSignOnBonus}
                    onChange={(e) => setCriteria({ ...criteria, maxSignOnBonus: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 font-bold"
                  >
                    <option value={100000}>€100,000 (Low Budget)</option>
                    <option value={250000}>€250,000 (Moderate)</option>
                    <option value={500000}>€500,000 (High-Tier)</option>
                    <option value={1000000}>€1,000,000 (Superstar Ceiling)</option>
                    <option value={2500000}>€2,500,000 (Unlimited Whales)</option>
                  </select>
                </div>

                {/* Negotiation Stance */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Negotiation Stance:</label>
                  <select
                    value={criteria.negotiationStance}
                    onChange={(e) => setCriteria({ ...criteria, negotiationStance: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 font-bold"
                  >
                    <option value="Conservative">Conservative (Tighter budgets, lower success rate)</option>
                    <option value="Balanced">Balanced (Standard terms, high reliability)</option>
                    <option value="Aggressive">Aggressive (Spares no expense, highest success rate)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SIGNING HISTORY & ATTEMPT LOGS */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {assistant.history && assistant.history.length > 0 ? (
                assistant.history.map((record) => (
                  <div
                    key={record.id}
                    className={`p-3.5 rounded-2xl border ${
                      record.status === 'signed'
                        ? 'bg-emerald-950/40 border-emerald-500/40'
                        : 'bg-slate-950/80 border-slate-800'
                    } text-xs space-y-2`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          record.status === 'signed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {record.status === 'signed' ? '✅ SIGNED' : '❌ FAILED'}
                        </span>
                        <h4 className="font-black text-white text-sm">{record.playerName}</h4>
                        {record.playerRating > 0 && (
                          <span className="text-slate-400 text-[11px]">
                            ({record.playerPosition}, {record.playerRating} OVR / {record.playerPotential} POT)
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">
                        Week {record.week}, Season {record.season}
                      </span>
                    </div>

                    <p className="text-slate-300 leading-relaxed italic">{record.verdictLog}</p>

                    {record.status === 'signed' && (
                      <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                        <span>Sign-on Bonus Paid: <strong className="text-emerald-400">{formatMoney(record.signOnBonusPaid)}</strong></span>
                        <span>Agent Cut Secured: <strong className="text-amber-300">{record.commissionSecuredPercent}%</strong></span>
                        <span>Assistant Fee: <strong className="text-blue-300">{formatMoney(record.assistantFee)}</strong></span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-slate-950/60 p-8 rounded-2xl border border-slate-800 text-center space-y-2">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-bold">No recruitment history logged yet.</p>
                  <p className="text-[11px] text-slate-500">
                    Allocate treasury funds and click <strong>Launch Immediate Mission</strong> or advance matchweeks to begin building your delegated portfolio.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
