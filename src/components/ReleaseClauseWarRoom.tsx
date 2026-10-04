import React, { useState, useMemo } from 'react';
import { Player, Club, AgencyState } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { getCurrentTransferWindowId } from '../utils/transferEvaluationEngine';
import { 
  Zap, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Search, 
  AlertOctagon, 
  CheckCircle, 
  Flame, 
  DollarSign, 
  Eye, 
  ArrowRight,
  ShieldCheck,
  Building
} from 'lucide-react';

interface ReleaseClauseWarRoomProps {
  agency: AgencyState;
  players: Player[];
  clubs: Club[];
  onUpdateAgency: (updater: (prev: AgencyState) => AgencyState) => void;
  onUpdatePlayer: (player: Player) => void;
  onUpdateClub?: (club: Club) => void;
  onInitiateDirectContractTalks: (player: Player) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ReleaseClauseWarRoom: React.FC<ReleaseClauseWarRoomProps> = ({
  agency,
  players,
  clubs,
  onUpdateAgency,
  onUpdatePlayer,
  onUpdateClub,
  onInitiateDirectContractTalks,
  onShowToast
}) => {
  const [activeTabMode, setActiveTabMode] = useState<'hostile_radar' | 'squad_protection'>('hostile_radar');
  const [searchFilter, setSearchFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [maxClauseFilter, setMaxClauseFilter] = useState<number>(150000000);
  
  // Buyout Destination Modal State
  const [buyoutModalPlayer, setBuyoutModalPlayer] = useState<Player | null>(null);
  const [selectedDestinationType, setSelectedDestinationType] = useState<'owned_club' | 'partner_brokerage'>('owned_club');
  const [selectedTargetClubId, setSelectedTargetClubId] = useState<string>('');

  // Find all players worldwide with active release clauses (memoized)
  const playersWithClauses = useMemo(() => {
    return players.filter(p => {
      const clause = p.clauses?.releaseClause;
      return clause && clause > 0;
    });
  }, [players]);

  // Filtered radar (memoized with lowercased search)
  const filteredRadarPlayers = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    return playersWithClauses.filter(p => {
      const clause = p.clauses?.releaseClause || 0;
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.clubName && p.clubName.toLowerCase().includes(q));
      const matchesPos = positionFilter === 'ALL' || p.position === positionFilter;
      const matchesPrice = clause <= maxClauseFilter;
      return matchesSearch && matchesPos && matchesPrice;
    });
  }, [playersWithClauses, searchFilter, positionFilter, maxClauseFilter]);

  // Owned club squad players for Anti-Poaching Poison Pill mode
  const ownedClubs = useMemo(() => {
    return clubs.filter(c => agency.clubShares?.some(s => s.clubId === c.id && s.sharePercent >= 50));
  }, [clubs, agency.clubShares]);

  const ownedSquadPlayers = useMemo(() => {
    if (ownedClubs.length === 0) return [];
    const ownedClubIdSet = new Set(ownedClubs.map(oc => oc.id));
    return players.filter(p => ownedClubIdSet.has(p.clubId));
  }, [players, ownedClubs]);
  
  // Acquiring partner clubs for brokerage advances (top clubs excluding selling club)
  const getPartnerClubs = (sellingClubId: string) => {
    return clubs.filter(c => c.id !== sellingClubId && c.reputation >= 75);
  };

  // Open Buyout Modal
  const handleOpenBuyoutModal = (player: Player) => {
    setBuyoutModalPlayer(player);
    if (ownedClubs.length > 0) {
      setSelectedDestinationType('owned_club');
      setSelectedTargetClubId(ownedClubs[0].id);
    } else {
      setSelectedDestinationType('partner_brokerage');
      const partners = getPartnerClubs(player.clubId);
      setSelectedTargetClubId(partners[0]?.id || clubs[0]?.id || '');
    }
  };

  // Execute Hostile Buyout with Destination
  const handleConfirmHostileBuyout = () => {
    if (!buyoutModalPlayer) return;
    const player = buyoutModalPlayer;
    const buyoutFee = player.clauses?.releaseClause || 0;

    if (agency.balance < buyoutFee) {
      onShowToast(`Insufficient funds! Hostile buyout requires ${formatMoney(buyoutFee)} liquid balance. Secure a Bank Loan in Debt Management!`, 'error');
      return;
    }

    const targetClub = clubs.find(c => c.id === selectedTargetClubId) || clubs[0];

    if (selectedDestinationType === 'owned_club') {
      // Direct acquisition for owned club
      onUpdateAgency(prev => ({
        ...prev,
        balance: prev.balance - buyoutFee,
        totalTransferEarnings: prev.totalTransferEarnings
      }));

      // Credit selling club
      if (onUpdateClub) {
        const sellerClub = clubs.find(c => c.id === player.clubId);
        if (sellerClub) {
          onUpdateClub({
            ...sellerClub,
            transferBudget: sellerClub.transferBudget + buyoutFee
          });
        }
      }

      onShowToast(`⚡ HOSTILE BYPASS TRIGGERED: Deposited ${formatMoney(buyoutFee)} buyout fee to Federation! ${player.name} signing for ${targetClub.name}!`, 'success');
      setBuyoutModalPlayer(null);
      onInitiateDirectContractTalks(player);
    } else {
      // Partner Club Brokering Advance (FIFA Anti-TPO Compliant)
      // Front the deposit; acquiring club reimburses + 15% agency premium upon registration
      const brokeringCommission = Math.round(buyoutFee * 0.15);
      
      onUpdateAgency(prev => ({
        ...prev,
        balance: prev.balance - buyoutFee + (buyoutFee + brokeringCommission),
        totalTransferEarnings: (prev.totalTransferEarnings || 0) + brokeringCommission,
        reputation: Math.min(100, prev.reputation + 2)
      }));

      if (onUpdateClub) {
        const sellerClub = clubs.find(c => c.id === player.clubId);
        if (sellerClub) {
          onUpdateClub({
            ...sellerClub,
            transferBudget: sellerClub.transferBudget + buyoutFee
          });
        }
        if (targetClub && targetClub.transferBudget >= buyoutFee) {
          onUpdateClub({
            ...targetClub,
            transferBudget: targetClub.transferBudget - buyoutFee
          });
        }
      }

      // Re-assign player to acquiring partner club
      onUpdatePlayer({
        ...player,
        clubId: targetClub.id,
        clubName: targetClub.name,
        isMyClient: true,
        agentCommission: 15,
        morale: 95,
        lastTransferWeek: agency.currentWeek,
        lastTransferSeason: agency.currentSeason,
        lastTransferWindowId: getCurrentTransferWindowId(agency.currentSeason, agency.currentWeek),
        transferredInCurrentWindow: true,
        transferredFromClubName: player.clubName,
        isTransferListed: false,
        transferListedByClub: false,
        unrest: {
          status: 'content',
          reason: 'wants_new_challenge',
          reasonLabel: 'Satisfied (Release Clause Buyout)',
          discontentLevel: 0,
          description: `Joined ${targetClub.name} after €${formatMoney(buyoutFee)} statutory buyout was triggered.`,
          discountPercent: 0
        },
        ongoingTransferNegotiation: undefined
      });

      onShowToast(`🤝 TPO-COMPLIANT BROKERAGE COMPLETED: Fronted buyout for ${targetClub.name}. Earned ${formatMoney(brokeringCommission)} (15% brokering cut)!`, 'success');
      setBuyoutModalPlayer(null);
    }
  };

  // Club Owner Action: Upgrade to Mega-Poison Pill Clause (€500M or €1B)
  const handleApplyPoisonPillClause = (player: Player, newClauseAmount: number) => {
    const updatedClauses = {
      ...(player.clauses || {}),
      releaseClause: newClauseAmount
    };

    onUpdatePlayer({
      ...player,
      clauses: updatedClauses
    });

    onShowToast(`🛡️ Anti-Poaching Shield Activated: ${player.name}'s release clause updated to ${formatMoney(newClauseAmount)}!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border border-red-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-black text-white tracking-tight">Buyout & Release Clause War Room</h2>
            </div>
            <p className="text-slate-400 text-sm max-w-xl">
              Execute hostile 24-hour bypass acquisitions by depositing statutory buyout fees directly with the Federation, or deploy anti-poaching poison pill clauses to protect your club stars.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTabMode('hostile_radar')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTabMode === 'hostile_radar'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Hostile Buyout Radar ({playersWithClauses.length})</span>
            </button>
            <button
              onClick={() => setActiveTabMode('squad_protection')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTabMode === 'squad_protection'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Anti-Poach Defense</span>
            </button>
          </div>
        </div>
      </div>

      {activeTabMode === 'hostile_radar' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search player or club..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white px-3 py-1.5 rounded-lg w-full md:w-60 font-bold"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">Position:</span>
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg font-bold"
                >
                  <option value="ALL">All Positions</option>
                  <option value="ST">ST / Forward</option>
                  <option value="RW">RW / LW Wingers</option>
                  <option value="CAM">CAM / Midfield</option>
                  <option value="CM">CM / CDM</option>
                  <option value="CB">CB / Defenders</option>
                  <option value="GK">GK Goalkeepers</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">Max Clause:</span>
                <span className="text-amber-400 font-black">{formatMoney(maxClauseFilter)}</span>
              </div>
            </div>
          </div>

          {/* Radar Player Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRadarPlayers.map(player => {
              const clause = player.clauses?.releaseClause || 0;
              const canAfford = agency.balance >= clause;
              const isUserClient = player.isMyClient;

              return (
                <div key={player.id} className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between space-y-4 transition">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-base">{player.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-black">{player.position}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{player.clubName} • Age {player.age} • Rating {player.rating}</div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Statutory Buyout</span>
                        <div className="text-lg font-black text-amber-400">{formatMoney(clause)}</div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <div>
                        <span className="text-slate-500">Market Value:</span>
                        <span className="font-bold text-white ml-1">{formatMoney(player.value)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Weekly Wage:</span>
                        <span className="font-bold text-slate-300 ml-1">{formatMoney(player.wage)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Potential:</span>
                        <span className="font-bold text-emerald-400 ml-1">{player.potential} OVR</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Bypass Status:</span>
                        <span className="font-bold text-amber-400 ml-1">24h Ready</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {isUserClient ? (
                      <span className="text-xs text-emerald-400 font-bold">Your Direct Client</span>
                    ) : (
                      <button
                        onClick={() => handleOpenBuyoutModal(player)}
                        disabled={!canAfford}
                        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs px-4 py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-950/40"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Trigger Hostile Buyout ({formatMoney(clause)})</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Anti-Poach Squad Defense Mode */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span>Anti-Poaching Poison Pill Fortress</span>
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Prevent rival super-agents from triggering hostile release clause snatches on your owned club's key players by imposing mega-buyout poison pill clauses (€500M to €1B).
            </p>
          </div>

          {ownedSquadPlayers.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
              <Building className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-300 font-bold">No Owned Club Squad Players</p>
              <p className="text-slate-500 text-xs mt-1">Acquire majority shares (50%+) in a football club via Tycoon Assets to activate squad poison pill shields.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ownedSquadPlayers.map(player => {
                const currentClause = player.clauses?.releaseClause || 0;

                return (
                  <div key={player.id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-black text-white text-base">{player.name}</span>
                        <div className="text-xs text-slate-400 mt-0.5">{player.clubName} • {player.position} • {player.rating} OVR</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Current Clause</span>
                        <div className="text-base font-black text-amber-400">{currentClause > 0 ? formatMoney(currentClause) : 'None'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleApplyPoisonPillClause(player, 500000000)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 rounded-lg transition cursor-pointer"
                      >
                        Set €500M Poison Pill
                      </button>
                      <button
                        onClick={() => handleApplyPoisonPillClause(player, 1000000000)}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-black py-2 rounded-lg transition cursor-pointer shadow-md shadow-red-950/50"
                      >
                        Set €1B Galáctico Lock
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Hostile Buyout & Destination Structure Modal */}
      {buyoutModalPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>FIFA Anti-TPO Compliant Buyout</span>
                </div>
                <h3 className="text-xl font-black text-white mt-1">Hostile Release Clause Acquisition</h3>
              </div>
              <button
                onClick={() => setBuyoutModalPlayer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Target Player Card Summary */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-sm font-black text-white">{buyoutModalPlayer.name}</div>
                <div className="text-xs text-slate-400">{buyoutModalPlayer.clubName} • {buyoutModalPlayer.position} • {buyoutModalPlayer.rating} OVR</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Statutory Fee</span>
                <div className="text-base font-black text-amber-400">{formatMoney(buyoutModalPlayer.clauses?.releaseClause || 0)}</div>
              </div>
            </div>

            {/* Destination Selection Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Select Acquisition Destination:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={ownedClubs.length === 0}
                  onClick={() => {
                    setSelectedDestinationType('owned_club');
                    if (ownedClubs.length > 0) setSelectedTargetClubId(ownedClubs[0].id);
                  }}
                  className={`p-3 rounded-xl border text-left transition ${
                    selectedDestinationType === 'owned_club'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="text-xs font-black flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-amber-400" />
                    <span>Your Owned Club</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Directly sign player to your controlling club roster.</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDestinationType('partner_brokerage');
                    const partners = getPartnerClubs(buyoutModalPlayer.clubId);
                    setSelectedTargetClubId(partners[0]?.id || clubs[0]?.id || '');
                  }}
                  className={`p-3 rounded-xl border text-left transition ${
                    selectedDestinationType === 'partner_brokerage'
                      ? 'bg-emerald-500/10 border-emerald-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="text-xs font-black flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Partner Club Advance</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Front buyout for a partner club & earn 15% brokering cut.</div>
                </button>
              </div>
            </div>

            {/* Target Destination Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">
                {selectedDestinationType === 'owned_club' ? 'Select Controlling Club Destination:' : 'Select Acquiring Partner Club:'}
              </label>
              <select
                value={selectedTargetClubId}
                onChange={(e) => setSelectedTargetClubId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs font-bold"
              >
                {selectedDestinationType === 'owned_club' ? (
                  ownedClubs.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.league})</option>
                  ))
                ) : (
                  getPartnerClubs(buyoutModalPlayer.clubId).map(c => (
                    <option key={c.id} value={c.id}>{c.name} (Budget: {formatMoney(c.transferBudget)})</option>
                  ))
                )}
              </select>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Statutory Buyout Fee:</span>
                <span className="font-bold text-white">{formatMoney(buyoutModalPlayer.clauses?.releaseClause || 0)}</span>
              </div>
              {selectedDestinationType === 'partner_brokerage' && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Brokering Commission Earned (15%):</span>
                  <span>+{formatMoney(Math.round((buyoutModalPlayer.clauses?.releaseClause || 0) * 0.15))}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                <span>Current Agency Balance:</span>
                <span className="font-bold text-amber-400">{formatMoney(agency.balance)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBuyoutModalPlayer(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmHostileBuyout}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4" />
                <span>Confirm & Deposit Buyout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
