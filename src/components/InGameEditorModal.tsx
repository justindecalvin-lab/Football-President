import React, { useState } from 'react';
import { AgencyState, Player, Club } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { 
  X, 
  Wrench, 
  DollarSign, 
  Trophy, 
  Building2, 
  Users, 
  Sparkles, 
  Zap, 
  Sliders, 
  ShieldCheck, 
  Search,
  CheckCircle2,
  TrendingUp,
  Award,
  Crown,
  Briefcase,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InGameEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  agency: AgencyState;
  setAgency: React.Dispatch<React.SetStateAction<AgencyState>>;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  clubs: Club[];
  setClubs: React.Dispatch<React.SetStateAction<Club[]>>;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const InGameEditorModal: React.FC<InGameEditorModalProps> = ({
  isOpen,
  onClose,
  agency,
  setAgency,
  players,
  setPlayers,
  clubs,
  setClubs,
  addToast
}) => {
  const [activeTab, setActiveTab] = useState<'agency' | 'players' | 'clubs' | 'god_mode'>('agency');

  // Active Executive Roles
  const activeRoles = agency.activeRoles || {
    agent: true,
    club_owner: true,
    fa_president: true,
    currentRole: 'agent'
  };

  const handleToggleRoleInEditor = (roleKey: 'agent' | 'club_owner' | 'fa_president') => {
    const currentVal = activeRoles[roleKey];
    const newVal = !currentVal;

    let updatedPresidency = { ...agency.presidency };

    if (roleKey === 'club_owner' && newVal) {
      if (updatedPresidency.role === 'None' || !updatedPresidency.role) {
        updatedPresidency.role = 'Club President';
        updatedPresidency.clubId = 'c1';
      }
    }

    if (roleKey === 'fa_president' && newVal) {
      if (updatedPresidency.role !== 'FIFA Global President' && updatedPresidency.role !== 'Federation Director' && updatedPresidency.role !== 'Continental President') {
        updatedPresidency.role = 'FIFA Global President';
      }
    }

    const updatedActiveRoles = {
      ...activeRoles,
      [roleKey]: newVal,
      currentRole: newVal ? roleKey : activeRoles.currentRole
    };

    setAgency(prev => ({
      ...prev,
      presidency: updatedPresidency,
      activeRoles: updatedActiveRoles
    }));

    addToast(`👑 Executive Role ${roleKey.replace('_', ' ').toUpperCase()} toggled ${newVal ? 'ON' : 'OFF'}!`, 'success');
  };

  const handleSetFocusRoleInEditor = (roleKey: 'agent' | 'club_owner' | 'fa_president') => {
    let updatedPresidency = { ...agency.presidency };

    if (roleKey === 'club_owner' && (updatedPresidency.role === 'None' || !updatedPresidency.role)) {
      updatedPresidency.role = 'Club President';
      updatedPresidency.clubId = 'c1';
    }

    if (roleKey === 'fa_president' && (updatedPresidency.role !== 'FIFA Global President' && updatedPresidency.role !== 'Federation Director' && updatedPresidency.role !== 'Continental President')) {
      updatedPresidency.role = 'FIFA Global President';
    }

    setAgency(prev => ({
      ...prev,
      presidency: updatedPresidency,
      activeRoles: {
        ...activeRoles,
        [roleKey]: true,
        currentRole: roleKey
      }
    }));

    addToast(`🎯 Primary Career Focus set to ${roleKey.replace('_', ' ').toUpperCase()}!`, 'info');
  };
  const [customBalanceInput, setCustomBalanceInput] = useState<string>('');
  const [customReputation, setCustomReputation] = useState<number>(agency.reputation);
  const [customOfficeLevel, setCustomOfficeLevel] = useState<number>(agency.officeLevel);

  // Player Selection & Edit State
  const [playerSearchQuery, setPlayerSearchQuery] = useState<string>('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');
  const selectedPlayer = players.find(p => p.id === selectedPlayerId) || players[0];

  const [playerEditForm, setPlayerEditForm] = useState<{
    rating: number;
    potential: number;
    age: number;
    value: number;
    wage: number;
    contractYears: number;
    isMyClient: boolean;
    morale: number;
    energy: number;
    form: number;
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  }>({
    rating: selectedPlayer?.rating || 80,
    potential: selectedPlayer?.potential || 85,
    age: selectedPlayer?.age || 24,
    value: selectedPlayer?.value || 10000000,
    wage: selectedPlayer?.wage || 50000,
    contractYears: selectedPlayer?.contractYears || 3,
    isMyClient: !!selectedPlayer?.isMyClient,
    morale: selectedPlayer?.morale || 85,
    energy: selectedPlayer?.energy || 100,
    form: selectedPlayer?.form || 75,
    pace: selectedPlayer?.stats?.pace || 75,
    shooting: selectedPlayer?.stats?.shooting || 75,
    passing: selectedPlayer?.stats?.passing || 75,
    dribbling: selectedPlayer?.stats?.dribbling || 75,
    defending: selectedPlayer?.stats?.defending || 75,
    physical: selectedPlayer?.stats?.physical || 75,
  });

  // Club Selection & Edit State
  const [clubSearchQuery, setClubSearchQuery] = useState<string>('');
  const [selectedClubId, setSelectedClubId] = useState<string>(clubs[0]?.id || '');
  const selectedClub = clubs.find(c => c.id === selectedClubId) || clubs[0];

  const [clubEditForm, setClubEditForm] = useState<{
    transferBudget: number;
    wageBudget: number;
    stadiumCapacity: number;
    points: number;
    wins: number;
    draws: number;
    losses: number;
    sharePercent: number;
  }>({
    transferBudget: selectedClub?.transferBudget || 50000000,
    wageBudget: selectedClub?.wageBudget || 500000,
    stadiumCapacity: selectedClub?.stadiumCapacity || 40000,
    points: selectedClub?.points || 0,
    wins: selectedClub?.wins || 0,
    draws: selectedClub?.draws || 0,
    losses: selectedClub?.losses || 0,
    sharePercent: agency.clubShares.find(s => s.clubId === selectedClub?.id)?.sharePercent || 0,
  });

  if (!isOpen) return null;

  // Sync player form when player selection changes
  const handleSelectPlayer = (pId: string) => {
    setSelectedPlayerId(pId);
    const target = players.find(p => p.id === pId);
    if (target) {
      setPlayerEditForm({
        rating: target.rating,
        potential: target.potential,
        age: target.age,
        value: target.value,
        wage: target.wage,
        contractYears: target.contractYears,
        isMyClient: !!target.isMyClient,
        morale: target.morale || 85,
        energy: target.energy || 100,
        form: target.form || 75,
        pace: target.stats?.pace || 75,
        shooting: target.stats?.shooting || 75,
        passing: target.stats?.passing || 75,
        dribbling: target.stats?.dribbling || 75,
        defending: target.stats?.defending || 75,
        physical: target.stats?.physical || 75,
      });
    }
  };

  // Sync club form when club selection changes
  const handleSelectClub = (cId: string) => {
    setSelectedClubId(cId);
    const target = clubs.find(c => c.id === cId);
    if (target) {
      const share = agency.clubShares.find(s => s.clubId === cId)?.sharePercent || 0;
      setClubEditForm({
        transferBudget: target.transferBudget,
        wageBudget: target.wageBudget,
        stadiumCapacity: target.stadiumCapacity,
        points: target.points,
        wins: target.wins,
        draws: target.draws,
        losses: target.losses,
        sharePercent: share,
      });
    }
  };

  // Agency Editors
  const handleAddAgencyFunds = (amount: number) => {
    setAgency(prev => ({
      ...prev,
      balance: prev.balance + amount
    }));
    addToast(`💰 Added ${formatMoney(amount)} to Agency Capital!`, 'success');
  };

  const handleApplyCustomBalance = () => {
    const val = parseFloat(customBalanceInput);
    if (isNaN(val) || val < 0) {
      addToast('Please enter a valid numeric balance amount.', 'error');
      return;
    }
    setAgency(prev => ({ ...prev, balance: val }));
    setCustomBalanceInput('');
    addToast(`💰 Agency Balance set to ${formatMoney(val)}!`, 'success');
  };

  const handleApplyAgencyStats = () => {
    setAgency(prev => ({
      ...prev,
      reputation: Math.min(100, Math.max(0, customReputation)),
      officeLevel: Math.min(5, Math.max(1, customOfficeLevel))
    }));
    addToast('⚡ Agency Reputation & HQ Level updated!', 'success');
  };

  // Save Player Edits
  const handleSavePlayer = () => {
    if (!selectedPlayer) return;
    setPlayers(prev => prev.map(p => {
      if (p.id === selectedPlayer.id) {
        return {
          ...p,
          rating: playerEditForm.rating,
          potential: playerEditForm.potential,
          age: playerEditForm.age,
          value: playerEditForm.value,
          wage: playerEditForm.wage,
          contractYears: playerEditForm.contractYears,
          isMyClient: playerEditForm.isMyClient,
          morale: playerEditForm.morale,
          energy: playerEditForm.energy,
          form: playerEditForm.form,
          stats: {
            ...p.stats,
            goals: p.stats?.goals || 0,
            assists: p.stats?.assists || 0,
            appearances: p.stats?.appearances || 0,
            avgRating: p.stats?.avgRating || 7.0,
            pace: playerEditForm.pace,
            shooting: playerEditForm.shooting,
            passing: playerEditForm.passing,
            dribbling: playerEditForm.dribbling,
            defending: playerEditForm.defending,
            physical: playerEditForm.physical,
          }
        };
      }
      return p;
    }));
    addToast(`⭐ Updated Player Stats for ${selectedPlayer.name}!`, 'success');
  };

  // Save Club Edits
  const handleSaveClub = () => {
    if (!selectedClub) return;
    setClubs(prev => prev.map(c => {
      if (c.id === selectedClub.id) {
        return {
          ...c,
          transferBudget: clubEditForm.transferBudget,
          wageBudget: clubEditForm.wageBudget,
          stadiumCapacity: clubEditForm.stadiumCapacity,
          points: clubEditForm.points,
          wins: clubEditForm.wins,
          draws: clubEditForm.draws,
          losses: clubEditForm.losses,
        };
      }
      return c;
    }));

    // Update Agency Share ownership
    setAgency(prev => {
      const existing = prev.clubShares.filter(s => s.clubId !== selectedClub.id);
      if (clubEditForm.sharePercent > 0) {
        existing.push({
          clubId: selectedClub.id,
          clubName: selectedClub.name,
          sharePercent: clubEditForm.sharePercent,
          purchasePrice: 0
        });
      }
      return {
        ...prev,
        clubShares: existing
      };
    });

    addToast(`🏟️ Updated Club Finances & Shares for ${selectedClub.name}!`, 'success');
  };

  // God Mode Cheat Presets
  const handleCheatBillionaire = () => {
    setAgency(prev => ({
      ...prev,
      balance: prev.balance + 1000000000,
      reputation: 100,
      officeLevel: 5
    }));
    confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 } });
    addToast('🤑 GOD MODE: Added €1 Billion Capital & Maxed Agency Reputation to 100!', 'success');
  };

  const handleCheatMaxAllClients = () => {
    let count = 0;
    setPlayers(prev => prev.map(p => {
      if (p.isMyClient) {
        count++;
        return {
          ...p,
          rating: 99,
          potential: 99,
          morale: 100,
          energy: 100,
          form: 99,
          value: 200000000,
          stats: {
            ...p.stats,
            goals: p.stats?.goals || 0,
            assists: p.stats?.assists || 0,
            appearances: p.stats?.appearances || 0,
            avgRating: 9.5,
            pace: 99,
            shooting: 99,
            passing: 99,
            dribbling: 99,
            defending: 99,
            physical: 99
          }
        };
      }
      return p;
    }));
    confetti({ particleCount: 120, spread: 120 });
    addToast(`⚡ GOD MODE: Maxed stats to 99 OVR for all ${count} Agency Clients!`, 'success');
  };

  const handleCheatOwnAllClubs = () => {
    const allShares = clubs.map(c => ({
      clubId: c.id,
      clubName: c.name,
      sharePercent: 100,
      investedAmount: 0,
      purchasePrice: 0
    }));
    setAgency(prev => ({
      ...prev,
      clubShares: allShares
    }));
    confetti({ particleCount: 100, spread: 80 });
    addToast('👑 GOD MODE: Acquired 100% Majority Ownership in ALL Global Clubs!', 'success');
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
    p.position.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
    (p.clubName && p.clubName.toLowerCase().includes(playerSearchQuery.toLowerCase()))
  );

  const filteredClubs = clubs.filter(c => 
    c.name.toLowerCase().includes(clubSearchQuery.toLowerCase()) ||
    (c.country && c.country.toLowerCase().includes(clubSearchQuery.toLowerCase())) ||
    c.league.toLowerCase().includes(clubSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal Bar */}
        <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 p-4 sm:p-5 text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-950/40 rounded-2xl border border-white/20 shadow-inner">
              <Wrench className="w-6 h-6 text-amber-200 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-wide">In-Game Editor & Cheats</h2>
                <span className="bg-slate-950/50 text-amber-200 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-amber-300/30">
                  God Mode
                </span>
              </div>
              <p className="text-xs text-amber-100/90 font-medium">Modify agency funds, player attributes, club finances, or trigger cheat presets live.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-950/40 hover:bg-slate-950/70 text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-950 border-b border-slate-800 p-2 flex gap-1.5 overflow-x-auto">
          {[
            { id: 'agency', label: 'Agency Funds & Stats', icon: DollarSign },
            { id: 'players', label: 'Player Editor', icon: Users },
            { id: 'clubs', label: 'Club Editor', icon: Building2 },
            { id: 'god_mode', label: 'God Mode Cheats', icon: Sparkles },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-100">

          {/* TAB 1: AGENCY FUNDS & STATS */}
          {activeTab === 'agency' && (
            <div className="space-y-6">
              {/* Executive Career Role Toggles */}
              <div className="bg-slate-800/80 border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <h3 className="font-extrabold text-sm text-white">Executive Career Roles & Mode Toggles</h3>
                  </div>
                  <span className="text-[10px] bg-slate-950 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30 font-extrabold self-start sm:self-auto">
                    Primary Focus: {activeRoles.currentRole === 'club_owner' ? '👑 Club Owner' : activeRoles.currentRole === 'fa_president' ? '🏛️ FA President' : '💼 Football Agent'}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Toggle executive career roles ON/OFF to unlock or lock specific executive dashboards, governance tools, and club management suites.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Role 1: Football Agent */}
                  <div className={`p-3.5 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                    activeRoles.agent
                      ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${activeRoles.agent ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-100">💼 Football Agent</h4>
                          <p className="text-[10px] text-slate-400">Transfers & Clients</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeRoles.agent ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'}`}>
                        {activeRoles.agent ? 'ACTIVE' : 'OFF'}
                      </span>
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      <button
                        onClick={() => handleToggleRoleInEditor('agent')}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          activeRoles.agent
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                            : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-extrabold'
                        }`}
                      >
                        {activeRoles.agent ? 'Disable' : 'Enable'}
                      </button>
                      {activeRoles.agent && (
                        <button
                          onClick={() => handleSetFocusRoleInEditor('agent')}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            activeRoles.currentRole === 'agent'
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {activeRoles.currentRole === 'agent' ? 'Focused' : 'Focus'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Role 2: Club Owner */}
                  <div className={`p-3.5 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                    activeRoles.club_owner
                      ? 'bg-amber-950/40 border-amber-500/60 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${activeRoles.club_owner ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                          <Crown className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-100">👑 Club Owner</h4>
                          <p className="text-[10px] text-slate-400">President Suite & Shares</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeRoles.club_owner ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-500'}`}>
                        {activeRoles.club_owner ? 'ACTIVE' : 'OFF'}
                      </span>
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      <button
                        onClick={() => handleToggleRoleInEditor('club_owner')}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          activeRoles.club_owner
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                            : 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-extrabold'
                        }`}
                      >
                        {activeRoles.club_owner ? 'Disable' : 'Enable'}
                      </button>
                      {activeRoles.club_owner && (
                        <button
                          onClick={() => handleSetFocusRoleInEditor('club_owner')}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            activeRoles.currentRole === 'club_owner'
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {activeRoles.currentRole === 'club_owner' ? 'Focused' : 'Focus'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Role 3: FA President */}
                  <div className={`p-3.5 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                    activeRoles.fa_president
                      ? 'bg-sky-950/40 border-sky-500/60 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${activeRoles.fa_president ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-500'}`}>
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-100">🏛️ FA President</h4>
                          <p className="text-[10px] text-slate-400">Governance & Rules</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeRoles.fa_president ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-slate-800 text-slate-500'}`}>
                        {activeRoles.fa_president ? 'ACTIVE' : 'OFF'}
                      </span>
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      <button
                        onClick={() => handleToggleRoleInEditor('fa_president')}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          activeRoles.fa_president
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                            : 'bg-sky-500 text-slate-950 hover:bg-sky-400 font-extrabold'
                        }`}
                      >
                        {activeRoles.fa_president ? 'Disable' : 'Enable'}
                      </button>
                      {activeRoles.fa_president && (
                        <button
                          onClick={() => handleSetFocusRoleInEditor('fa_president')}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            activeRoles.currentRole === 'fa_president'
                              ? 'bg-sky-500 text-slate-950 font-black'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {activeRoles.currentRole === 'fa_president' ? 'Focused' : 'Focus'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Money Injectors */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Instant Capital Injector</h3>
                </div>
                <p className="text-xs text-slate-400">Current Agency Balance: <strong className="text-emerald-400 text-sm font-black">{formatMoney(agency.balance)}</strong></p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button onClick={() => handleAddAgencyFunds(5000000)} className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold p-3 rounded-xl text-xs transition cursor-pointer">
                    + €5,000,000
                  </button>
                  <button onClick={() => handleAddAgencyFunds(25000000)} className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold p-3 rounded-xl text-xs transition cursor-pointer">
                    + €25,000,000
                  </button>
                  <button onClick={() => handleAddAgencyFunds(100000000)} className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold p-3 rounded-xl text-xs transition cursor-pointer">
                    + €100,000,000
                  </button>
                  <button onClick={() => handleAddAgencyFunds(500000000)} className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold p-3 rounded-xl text-xs transition cursor-pointer">
                    + €500,000,000
                  </button>
                </div>

                {/* Custom Balance Input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="number"
                    value={customBalanceInput}
                    onChange={(e) => setCustomBalanceInput(e.target.value)}
                    placeholder="Enter Custom Balance (e.g. 1000000000)"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                  <button
                    onClick={handleApplyCustomBalance}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Set Balance
                  </button>
                </div>
              </div>

              {/* Reputation & Office Level */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-sm text-white">Agency Reputation & HQ Level</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Reputation Score (0 - 100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={customReputation}
                      onChange={(e) => setCustomReputation(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Office HQ Level (1 - 5)</label>
                    <select
                      value={customOfficeLevel}
                      onChange={(e) => setCustomOfficeLevel(parseInt(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value={1}>Level 1 - Starter HQ</option>
                      <option value={2}>Level 2 - City Tower Office</option>
                      <option value={3}>Level 3 - Luxury Penthouse</option>
                      <option value={4}>Level 4 - Global Executive Hub</option>
                      <option value={5}>Level 5 - World Football Palace</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleApplyAgencyStats}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold p-3 rounded-xl text-xs transition cursor-pointer"
                >
                  Apply Agency Reputation & HQ Level
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PLAYER EDITOR */}
          {activeTab === 'players' && (
            <div className="space-y-5">
              {/* Search & Select Player Dropdown */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={playerSearchQuery}
                    onChange={(e) => setPlayerSearchQuery(e.target.value)}
                    placeholder="Search player by name, position, or club..."
                    className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-xs"
                  />
                </div>

                <select
                  value={selectedPlayerId}
                  onChange={(e) => handleSelectPlayer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-bold"
                >
                  {filteredPlayers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.position}, OVR {p.rating}/{p.potential}) - {p.clubName || 'Free Agent'} {p.isMyClient ? '★ Client' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlayer && (
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <div>
                      <h4 className="text-base font-black text-white">{selectedPlayer.name}</h4>
                      <p className="text-xs text-slate-400">{selectedPlayer.position} • {selectedPlayer.clubName || 'Free Agent'}</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-bold text-amber-300">
                      <input
                        type="checkbox"
                        checked={playerEditForm.isMyClient}
                        onChange={(e) => setPlayerEditForm(prev => ({ ...prev, isMyClient: e.target.checked }))}
                        className="rounded accent-amber-500"
                      />
                      <span>Signed to My Agency</span>
                    </label>
                  </div>

                  {/* Rating, Potential, Value, Wage */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">Overall Rating (OVR)</label>
                      <input
                        type="number"
                        min="40"
                        max="99"
                        value={playerEditForm.rating}
                        onChange={(e) => setPlayerEditForm(prev => ({ ...prev, rating: parseInt(e.target.value) || 50 }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs font-bold text-emerald-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">Potential (POT)</label>
                      <input
                        type="number"
                        min="40"
                        max="99"
                        value={playerEditForm.potential}
                        onChange={(e) => setPlayerEditForm(prev => ({ ...prev, potential: parseInt(e.target.value) || 50 }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs font-bold text-amber-300"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">Market Value (€)</label>
                      <input
                        type="number"
                        value={playerEditForm.value}
                        onChange={(e) => setPlayerEditForm(prev => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs font-mono text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">Weekly Salary (€)</label>
                      <input
                        type="number"
                        value={playerEditForm.wage}
                        onChange={(e) => setPlayerEditForm(prev => ({ ...prev, wage: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs font-mono text-white"
                      />
                    </div>
                  </div>

                  {/* Detailed Attributes */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-300 uppercase mb-2">Technical & Physical Attributes</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { key: 'pace', label: 'Pace (PAC)' },
                        { key: 'shooting', label: 'Shooting (SHO)' },
                        { key: 'passing', label: 'Passing (PAS)' },
                        { key: 'dribbling', label: 'Dribbling (DRI)' },
                        { key: 'defending', label: 'Defending (DEF)' },
                        { key: 'physical', label: 'Physical (PHY)' },
                      ].map(attr => (
                        <div key={attr.key} className="space-y-1">
                          <label className="text-[10px] text-slate-400">{attr.label}</label>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={(playerEditForm as any)[attr.key]}
                            onChange={(e) => setPlayerEditForm(prev => ({ ...prev, [attr.key]: parseInt(e.target.value) || 50 }))}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs font-bold text-sky-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Max Button & Save */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setPlayerEditForm(prev => ({
                        ...prev,
                        rating: 99,
                        potential: 99,
                        pace: 99,
                        shooting: 99,
                        passing: 99,
                        dribbling: 99,
                        defending: 99,
                        physical: 99,
                        morale: 100,
                        energy: 100
                      }))}
                      className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      ⚡ Max All Stats to 99
                    </button>

                    <button
                      onClick={handleSavePlayer}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold p-2.5 rounded-xl text-xs transition cursor-pointer shadow-lg"
                    >
                      Save Changes to Player
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CLUB EDITOR */}
          {activeTab === 'clubs' && (
            <div className="space-y-5">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={clubSearchQuery}
                    onChange={(e) => setClubSearchQuery(e.target.value)}
                    placeholder="Search club by name or country..."
                    className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-xs"
                  />
                </div>

                <select
                  value={selectedClubId}
                  onChange={(e) => handleSelectClub(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-bold"
                >
                  {filteredClubs.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.country || c.league}) - Budget: {formatMoney(c.transferBudget)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedClub && (
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-5">
                  <div className="border-b border-slate-700 pb-3">
                    <h4 className="text-base font-black text-white">{selectedClub.name}</h4>
                    <p className="text-xs text-slate-400">{selectedClub.country || selectedClub.league} • Stadium: {selectedClub.stadiumName || `${selectedClub.name} Arena`}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-semibold">Transfer Budget (€)</label>
                      <input
                        type="number"
                        value={clubEditForm.transferBudget}
                        onChange={(e) => setClubEditForm(prev => ({ ...prev, transferBudget: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-emerald-400 font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-semibold">Weekly Wage Budget (€)</label>
                      <input
                        type="number"
                        value={clubEditForm.wageBudget}
                        onChange={(e) => setClubEditForm(prev => ({ ...prev, wageBudget: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-semibold">League Points</label>
                      <input
                        type="number"
                        value={clubEditForm.points}
                        onChange={(e) => setClubEditForm(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-amber-300 font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-semibold">Agency Share Ownership (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={clubEditForm.sharePercent}
                        onChange={(e) => setClubEditForm(prev => ({ ...prev, sharePercent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-indigo-300 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setClubEditForm(prev => ({ ...prev, transferBudget: prev.transferBudget + 100000000 }))}
                      className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      + €100M Budget
                    </button>
                    <button
                      onClick={() => setClubEditForm(prev => ({ ...prev, sharePercent: 100 }))}
                      className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Make 100% Majority Owner
                    </button>
                    <button
                      onClick={handleSaveClub}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold p-2.5 rounded-xl text-xs transition cursor-pointer shadow-lg"
                    >
                      Save Club Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GOD MODE CHEATS */}
          {activeTab === 'god_mode' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="font-extrabold text-sm text-amber-200">One-Click God Mode Cheats</h3>
                </div>
                <p className="text-xs text-slate-300">
                  Instantly execute powerful game-breaking cheats to unlock unlimited funds, max out player abilities, or control all global clubs.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {/* Cheat 1 */}
                  <button
                    onClick={handleCheatBillionaire}
                    className="bg-slate-900 hover:bg-slate-800 border border-amber-500/40 p-4 rounded-2xl text-left space-y-2 group transition cursor-pointer"
                  >
                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl w-fit">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white group-hover:text-amber-300">Billionaire Agency Cheat</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Injects €1,000,000,000 capital and maxes reputation to 100.</p>
                    </div>
                  </button>

                  {/* Cheat 2 */}
                  <button
                    onClick={handleCheatMaxAllClients}
                    className="bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 p-4 rounded-2xl text-left space-y-2 group transition cursor-pointer"
                  >
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white group-hover:text-emerald-300">99 OVR All Clients Cheat</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Boosts all current agency client ratings to 99 OVR world-class status.</p>
                    </div>
                  </button>

                  {/* Cheat 3 */}
                  <button
                    onClick={handleCheatOwnAllClubs}
                    className="bg-slate-900 hover:bg-slate-800 border border-indigo-500/40 p-4 rounded-2xl text-left space-y-2 group transition cursor-pointer"
                  >
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white group-hover:text-indigo-300">Global Tycoon Empire Cheat</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Gives you 100% majority ownership in all clubs across world football.</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Changes take effect live in game state immediately</span>
          </span>

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-2 rounded-xl transition cursor-pointer"
          >
            Close Editor
          </button>
        </div>

      </div>
    </div>
  );
};
