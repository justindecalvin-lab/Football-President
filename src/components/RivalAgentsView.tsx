import React, { useState } from 'react';
import { AgencyState, RivalAgent, Player } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { PlayerPitchNegotiationModal } from './PlayerPitchNegotiationModal';
import {
  executeAuditRivalAgency,
  executeSanctionRivalAgent,
  executeGrantPreferredIntermediary,
  executeBlacklistRivalAgent
} from '../utils/roleInteractionsEngine';
import { 
  Crown, 
  ShieldAlert, 
  Handshake, 
  Skull, 
  TrendingUp, 
  Zap, 
  UserCheck, 
  Award,
  AlertTriangle,
  Flame,
  Check,
  Lock,
  Scale,
  Ban,
  Shield,
  Briefcase,
  FileCheck
} from 'lucide-react';

interface RivalAgentsViewProps {
  agency: AgencyState;
  players: Player[];
  onUpdateAgency: (agency: AgencyState) => void;
  onUpdatePlayer: (player: Player) => void;
}

export const RivalAgentsView: React.FC<RivalAgentsViewProps> = ({
  agency,
  players,
  onUpdateAgency,
  onUpdatePlayer
}) => {
  const rivalAgents = agency.rivalAgents || [];
  const [selectedAgentId, setSelectedAgentId] = useState<string>(rivalAgents[0]?.id || '');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [pitchingPlayer, setPitchingPlayer] = useState<Player | null>(null);

  const selectedAgent = rivalAgents.find(r => r.id === selectedAgentId);
  const myClients = players.filter(p => p.isMyClient);

  const isAgentRole = agency.activeRoles?.currentRole === 'agent' || (!agency.activeRoles?.currentRole && (!agency.presidency?.role || agency.presidency.role === 'None'));
  const isFaPresident = agency.activeRoles?.currentRole === 'fa_president' || (agency.presidency?.role !== 'None' && agency.presidency?.role !== 'Club President' && Boolean(agency.presidency?.role));
  const isClubOwner = agency.activeRoles?.currentRole === 'club_owner' || agency.presidency?.role === 'Club President';

  // FA PRESIDENT: Audit Agency
  const handleAuditAgency = (agent: RivalAgent) => {
    const outcome = executeAuditRivalAgency(agent, agency);
    if (outcome.updatedRivalAgent) {
      const updatedRivals = rivalAgents.map(r => r.id === agent.id ? outcome.updatedRivalAgent! : r);
      onUpdateAgency({ ...outcome.updatedAgency, rivalAgents: updatedRivals });
    } else {
      onUpdateAgency(outcome.updatedAgency);
    }
    setActionNotice(outcome.message);
  };

  // FA PRESIDENT: Sanction Agency
  const handleSanctionAgency = (agent: RivalAgent) => {
    const outcome = executeSanctionRivalAgent(agent, agency);
    if (outcome.updatedRivalAgent) {
      const updatedRivals = rivalAgents.map(r => r.id === agent.id ? outcome.updatedRivalAgent! : r);
      onUpdateAgency({ ...outcome.updatedAgency, rivalAgents: updatedRivals });
    } else {
      onUpdateAgency(outcome.updatedAgency);
    }
    setActionNotice(outcome.message);
  };

  // CLUB OWNER: Preferred Intermediary
  const handleGrantPreferredIntermediary = (agent: RivalAgent) => {
    const outcome = executeGrantPreferredIntermediary(agent, agency);
    if (outcome.updatedRivalAgent) {
      const updatedRivals = rivalAgents.map(r => r.id === agent.id ? outcome.updatedRivalAgent! : r);
      onUpdateAgency({ ...outcome.updatedAgency, rivalAgents: updatedRivals });
    }
    setActionNotice(outcome.message);
  };

  // CLUB OWNER: Blacklist Agent
  const handleBlacklistAgent = (agent: RivalAgent) => {
    const outcome = executeBlacklistRivalAgent(agent, agency);
    if (outcome.updatedRivalAgent) {
      const updatedRivals = rivalAgents.map(r => r.id === agent.id ? outcome.updatedRivalAgent! : r);
      onUpdateAgency({ ...outcome.updatedAgency, rivalAgents: updatedRivals });
    }
    setActionNotice(outcome.message);
  };

  // Form Strategic Alliance (Agent role)
  const handleFormAlliance = (agent: RivalAgent) => {
    if (!isAgentRole) return;

    if (agency.balance < 100000) {
      alert('Need €100,000 to initiate executive partnership talks!');
      return;
    }

    const updatedRivals = rivalAgents.map(r => 
      r.id === agent.id ? { ...r, relationship: Math.min(100, r.relationship + 30) } : r
    );

    setActionNotice(`🤝 ALLIANCE SIGNED! Formed strategic partnership with ${agent.agencyName}. Joint transfer leverage unlocked!`);
    onUpdateAgency({
      ...agency,
      balance: agency.balance - 100000,
      reputation: Math.min(100, agency.reputation + 3),
      rivalAgents: updatedRivals
    });
  };

  // Launch Smear Campaign against Rival (Agent role)
  const handleSmearCampaign = (agent: RivalAgent) => {
    if (!isAgentRole) return;

    if (agency.balance < 75000) {
      alert('Need €75,000 for press leak campaign!');
      return;
    }

    const updatedRivals = rivalAgents.map(r => 
      r.id === agent.id ? { ...r, influence: Math.max(10, r.influence - 12), relationship: Math.max(-100, r.relationship - 25) } : r
    );

    setActionNotice(`📰 PRESS SMEAR EXPOSED! Tabloids ran hit-pieces on ${agent.agencyName}. Their influence dropped by 12 points!`);
    onUpdateAgency({
      ...agency,
      balance: agency.balance - 75000,
      darkArtsScore: (agency.darkArtsScore || 0) + 1,
      rivalAgents: updatedRivals
    });
  };

  // Attempt to Poach Rival's Client via Negotiation Studio (Agent role)
  const handlePoachClient = (agent: RivalAgent) => {
    if (!isAgentRole) return;

    let target = players.find(p => p.agencyName === agent.agencyName || agent.topClients.includes(p.name));
    if (!target) {
      const candidates = players.filter(p => !p.isMyClient);
      if (candidates.length > 0) {
        const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];
        target = { ...randomCandidate, agencyName: agent.agencyName };
      }
    }

    if (target) {
      setPitchingPlayer(target);
    } else {
      alert(`No active clients currently available to poach from ${agent.agencyName}.`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border-2 border-indigo-500/40 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-indigo-400" />
            <span>Rival Super-Agents & Global Agency Network</span>
          </h2>
          <p className="text-xs text-indigo-200/80 mt-1 max-w-xl">
            Compete against the world's most powerful football agents: Jorge Mendes, Rafaela Pimenta, Jonathan Barnett, and Pini Zahavi. Form alliances, steal clients, or wage agency press wars.
          </p>
        </div>

        <div className="bg-indigo-900/60 border border-indigo-500/50 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold text-indigo-200">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Agency Hierarchy Rank: #2</span>
        </div>
      </div>

      {/* Role Restriction Banner if FA President or Club Owner */}
      {!isAgentRole && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
          isFaPresident 
            ? 'bg-amber-950/70 border-amber-500/50 text-amber-200' 
            : 'bg-indigo-950/70 border-indigo-500/50 text-indigo-200'
        }`}>
          <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
          <div className="text-xs">
            <p className="font-extrabold text-sm text-white">
              {isFaPresident ? '🏛️ FIFA Governance Mode: Commercial Agency Actions Locked' : '🏢 Club President Mode: Agency Poaching Locked'}
            </p>
            <p className="mt-0.5 opacity-90">
              {isFaPresident 
                ? 'Under FIFA Ethics Code (Art. 19 Conflict of Interest), the active FA President cannot poach players, represent private clients, or form agency commercial cartels. Step down or resign presidency in Governance to resume private agent practice.'
                : 'As an active Club President, dual-representation rules prohibit operating private player agencies or poaching clients for personal agent fees.'}
            </p>
          </div>
        </div>
      )}

      {/* Action Notice */}
      {actionNotice && (
        <div className="bg-indigo-950/90 border-2 border-indigo-500/60 p-4 rounded-2xl text-xs text-indigo-100 font-bold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-indigo-300 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rival Agents Leaderboard (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <span>Global Super-Agent Leaderboard</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rivalAgents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`bg-slate-900 border rounded-2xl p-5 space-y-3 cursor-pointer transition shadow-xl ${
                  selectedAgentId === agent.id 
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${agent.avatarColor} flex items-center justify-center text-white font-black text-sm shadow-md`}>
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{agent.name}</h4>
                      <p className="text-xs text-indigo-300 font-medium">{agent.agencyName}</p>
                    </div>
                  </div>

                  <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2.5 py-1 rounded-lg">
                    Inf {agent.influence}
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-800">
                  <div className="flex justify-between">
                    <span>Strategy:</span>
                    <strong className="text-amber-300">{agent.strategy}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Relationship:</span>
                    <strong className={agent.relationship >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {agent.relationship >= 0 ? `+${agent.relationship} (Friendly)` : `${agent.relationship} (Rival)`}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>HQ:</span>
                    <span className="text-slate-300">{agent.headquarters}</span>
                  </div>
                </div>

                {/* Touch buttons on card */}
                <div className="flex items-center gap-2 pt-2">
                  {isFaPresident ? (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAuditAgency(agent); }}
                        className="flex-1 text-xs font-bold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 min-h-[44px] bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Audit Agency</span>
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleSanctionAgency(agent); }}
                        className="flex-1 text-xs font-bold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 min-h-[44px] bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Sanction</span>
                      </button>
                    </>
                  ) : isClubOwner ? (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleGrantPreferredIntermediary(agent); }}
                        className="flex-1 text-xs font-bold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 min-h-[44px] bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40"
                      >
                        <Handshake className="w-3.5 h-3.5" />
                        <span>Club Mandate</span>
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleBlacklistAgent(agent); }}
                        className="flex-1 text-xs font-bold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 min-h-[44px] bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Blacklist</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleFormAlliance(agent); }}
                        className="flex-1 text-xs font-bold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 min-h-[44px] bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40"
                      >
                        <Handshake className="w-4 h-4" />
                        <span>Alliance</span>
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); handlePoachClient(agent); }}
                        className="flex-1 text-xs font-bold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 min-h-[44px] bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Poach Client</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Agent Inspector & Operations Panel */}
        <div>
          {selectedAgent ? (
            <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl space-y-5 sticky top-20">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl ${selectedAgent.avatarColor} flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                  {selectedAgent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{selectedAgent.name}</h3>
                  <p className="text-xs text-indigo-400 font-semibold">{selectedAgent.agencyName}</p>
                </div>
              </div>

              <div className="space-y-2 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 text-xs">
                <p className="font-bold text-slate-200">Top Represented Clients:</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAgent.topClients.map((client) => (
                    <span key={client} className="bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg font-medium text-[11px]">
                      ⭐ {client}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons with 44px Touch Targets */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {isFaPresident ? '🏛️ Federation Oversight Directives:' : isClubOwner ? '🏢 Presidential Club Operations:' : '💼 Executive Agency Operations:'}
                </p>

                {isFaPresident ? (
                  <>
                    <button
                      onClick={() => handleAuditAgency(selectedAgent)}
                      className="w-full font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-between transition cursor-pointer min-h-[44px] shadow-lg bg-amber-600 hover:bg-amber-500 text-white"
                    >
                      <span className="flex items-center gap-2">
                        <Scale className="w-4 h-4" />
                        <span>Audit Fee Cap Compliance</span>
                      </span>
                      <span className="bg-amber-950/60 text-amber-200 px-2 py-0.5 rounded text-[10px]">FIFA Art. 19</span>
                    </button>

                    <button
                      onClick={() => handleSanctionAgency(selectedAgent)}
                      className="w-full font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-between transition cursor-pointer min-h-[44px] shadow-lg bg-red-600 hover:bg-red-500 text-white"
                    >
                      <span className="flex items-center gap-2">
                        <Ban className="w-4 h-4" />
                        <span>Impose 6-Month Suspension</span>
                      </span>
                      <span className="bg-red-950/60 text-red-200 px-2 py-0.5 rounded text-[10px]">Freeze License</span>
                    </button>
                  </>
                ) : isClubOwner ? (
                  <>
                    <button
                      onClick={() => handleGrantPreferredIntermediary(selectedAgent)}
                      className="w-full font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-between transition cursor-pointer min-h-[44px] shadow-lg bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                      <span className="flex items-center gap-2">
                        <Handshake className="w-4 h-4" />
                        <span>Grant Exclusive Club Mandate</span>
                      </span>
                      <span className="bg-indigo-950/60 text-indigo-200 px-2 py-0.5 rounded text-[10px]">Discount Fees</span>
                    </button>

                    <button
                      onClick={() => handleBlacklistAgent(selectedAgent)}
                      className="w-full font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-between transition cursor-pointer min-h-[44px] shadow-lg bg-slate-900 hover:bg-red-950 border border-red-500/40 text-red-300"
                    >
                      <span className="flex items-center gap-2">
                        <Ban className="w-4 h-4 text-red-400" />
                        <span>Training Ground Blacklist</span>
                      </span>
                      <span className="bg-red-950/60 text-red-200 px-2 py-0.5 rounded text-[10px]">Persona Non Grata</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleFormAlliance(selectedAgent)}
                      className="w-full font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-between transition cursor-pointer min-h-[44px] shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <span className="flex items-center gap-2">
                        <Handshake className="w-4 h-4" />
                        <span>Form Strategic Alliance</span>
                      </span>
                      <span className="bg-emerald-950/60 text-emerald-200 px-2 py-0.5 rounded text-[10px]">€100,000</span>
                    </button>

                    <button
                      onClick={() => handlePoachClient(selectedAgent)}
                      className="w-full font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-between transition cursor-pointer min-h-[44px] shadow-lg bg-amber-600 hover:bg-amber-500 text-white"
                    >
                      <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span>Poach Top Client Target</span>
                      </span>
                      <span className="bg-amber-950/60 text-amber-200 px-2 py-0.5 rounded text-[10px]">Pitch Studio</span>
                    </button>

                    <button
                      onClick={() => handleSmearCampaign(selectedAgent)}
                      className="w-full font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-between transition cursor-pointer min-h-[44px] shadow-lg bg-purple-700 hover:bg-purple-600 text-white"
                    >
                      <span className="flex items-center gap-2">
                        <Skull className="w-4 h-4" />
                        <span>Launch Press Smear Campaign</span>
                      </span>
                      <span className="bg-purple-950/60 text-purple-200 px-2 py-0.5 rounded text-[10px]">€75,000</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-500 italic text-xs">
              Select a rival agent to inspect operations.
            </div>
          )}
        </div>
      </div>

      {pitchingPlayer && (
        <PlayerPitchNegotiationModal
          player={pitchingPlayer}
          agency={agency}
          onClose={() => setPitchingPlayer(null)}
          onSuccessSign={(signedPlayer, updatedAgency) => {
            if (signedPlayer.isMyClient) {
              onUpdatePlayer(signedPlayer);
              const updatedRivals = rivalAgents.map(r =>
                r.agencyName === signedPlayer.agencyName || (pitchingPlayer && r.topClients.includes(pitchingPlayer.name))
                  ? { ...r, influence: Math.max(10, r.influence - 10), relationship: Math.max(-100, r.relationship - 25) }
                  : r
              );
              onUpdateAgency({ ...updatedAgency, rivalAgents: updatedRivals });
              setActionNotice(`🔥 POACHING VICTORY! ${signedPlayer.name} parted ways with ${signedPlayer.agencyName || 'their rival agent'} and signed with ${agency.agencyName}!`);
            } else {
              onUpdateAgency(updatedAgency);
            }
            setPitchingPlayer(null);
          }}
        />
      )}
    </div>
  );
};
