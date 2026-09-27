import React, { useState } from 'react';
import { Club, Player, AgencyState, MatchdayDirectiveType } from '../types';
import { 
  Play, 
  Trophy, 
  Calendar, 
  Shield, 
  Swords, 
  Sparkles, 
  Crown, 
  Zap, 
  Eye, 
  Activity, 
  Flame, 
  Heart, 
  Check, 
  Users,
  AlertTriangle,
  Clock,
  Filter
} from 'lucide-react';
import { LiveMatchSimulatorModal } from './LiveMatchSimulatorModal';

interface MatchesViewProps {
  clubs: Club[];
  players: Player[];
  agency: AgencyState;
  onUpdateAgency: React.Dispatch<React.SetStateAction<AgencyState>>;
  onAdvanceWeek: () => void;
  onUpdatePlayer?: (player: Player) => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  clubs,
  players,
  agency,
  onUpdateAgency,
  onAdvanceWeek,
  onUpdatePlayer
}) => {
  const [selectedMatch, setSelectedMatch] = useState<{ homeClub: Club; awayClub: Club } | null>(null);
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState<string>('all');

  // Extract distinct leagues
  const availableLeagues = Array.from(new Set(clubs.map(c => c.league))).sort();

  // Filter clubs based on selected league or top tier clubs
  const targetLeagueClubs = selectedLeagueFilter === 'all'
    ? [...clubs].sort((a, b) => b.reputation - a.reputation).slice(0, 20)
    : clubs.filter(c => c.league === selectedLeagueFilter);

  // Generate pair fixtures for active week (up to 10 matches for 20 teams)
  const matches = [];
  for (let i = 0; i < targetLeagueClubs.length - 1; i += 2) {
    matches.push({
      homeClub: targetLeagueClubs[i],
      awayClub: targetLeagueClubs[i + 1]
    });
  }

  const myClientsPlaying = players.filter(p => p.isMyClient && p.clubId !== 'free_agent');
  const activeDirectives = agency.activeMatchDirectives || {};

  const handleSetDirective = (playerId: string, directive: MatchdayDirectiveType) => {
    onUpdateAgency(prev => ({
      ...prev,
      activeMatchDirectives: {
        ...(prev.activeMatchDirectives || {}),
        [playerId]: directive
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>Matchday Director's Box &amp; Live Matchweek Hub</span>
            </h2>
            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Week {agency.currentWeek} • Season {agency.currentSeason}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Attend high-stakes fixtures from the VIP Director's Box, issue pitchside directives to your clients, and observe live match ratings.
          </p>
        </div>

        <button
          onClick={onAdvanceWeek}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black px-6 py-3 rounded-2xl flex items-center gap-2 text-xs shadow-lg shadow-emerald-600/25 active:scale-95 transition cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Simulate All Week {agency.currentWeek} Matches</span>
        </button>
      </div>

      {/* Pre-Match Tactical Directives for Agency Clients */}
      {myClientsPlaying.length > 0 && (
        <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Pre-Match Pitchside Directives (Assigned to Your Active Clients)
              </h3>
            </div>
            <span className="text-[11px] text-indigo-300 font-bold">
              {myClientsPlaying.length} Client{myClientsPlaying.length > 1 ? 's' : ''} in Matchday Squads
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {myClientsPlaying.map(client => {
              const currentDirective = activeDirectives[client.id] || 'none';

              return (
                <div key={client.id} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{client.flag}</span>
                      <div>
                        <p className="text-xs font-black text-white">{client.name}</p>
                        <p className="text-[10px] text-slate-400">{client.clubName} • {client.position} ({client.rating} OVR)</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
                      Form {client.form}%
                    </span>
                  </div>

                  {/* Playing Time & Bench Discontent Indicator Badge */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-indigo-400" />
                      <span>{client.agreedPlayingTime || 'Regular Starter'}</span>
                    </span>

                    {(client.playingTimeSatisfaction !== undefined && client.playingTimeSatisfaction < 50) || (client.consecutiveWeeksBenched && client.consecutiveWeeksBenched >= 2) ? (
                      <span className="bg-red-950/80 border border-red-500/50 text-red-300 px-2 py-0.5 rounded font-bold flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                        <span>⚠️ Bench Discontent ({client.playingTimeSatisfaction ?? 40}%)</span>
                      </span>
                    ) : (
                      <span className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded font-semibold">
                        Satisfied ({client.playingTimeSatisfaction ?? 85}%)
                      </span>
                    )}

                    {client.isRegistered === false && (
                      <span className="bg-amber-950/80 border border-amber-500/60 text-amber-300 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                        <span>Unregistered ({client.unregisteredWeeks || 0}w)</span>
                      </span>
                    )}
                  </div>

                  {/* Directive Selector */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800/80">
                    <button
                      onClick={() => handleSetDirective(client.id, 'showcase_flair')}
                      className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border transition text-left flex items-center gap-1 cursor-pointer ${
                        currentDirective === 'showcase_flair'
                          ? 'bg-amber-950/80 border-amber-400 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>🌟 Showcase Flair</span>
                    </button>

                    <button
                      onClick={() => handleSetDirective(client.id, 'tactical_discipline')}
                      className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border transition text-left flex items-center gap-1 cursor-pointer ${
                        currentDirective === 'tactical_discipline'
                          ? 'bg-indigo-950/80 border-indigo-400 text-indigo-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Shield className="w-3 h-3 text-indigo-400" />
                      <span>🛡️ Discipline</span>
                    </button>

                    <button
                      onClick={() => handleSetDirective(client.id, 'all_out_press')}
                      className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border transition text-left flex items-center gap-1 cursor-pointer ${
                        currentDirective === 'all_out_press'
                          ? 'bg-red-950/80 border-red-400 text-red-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Flame className="w-3 h-3 text-red-400" />
                      <span>⚡ All-Out Press</span>
                    </button>

                    <button
                      onClick={() => handleSetDirective(client.id, 'injury_caution')}
                      className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border transition text-left flex items-center gap-1 cursor-pointer ${
                        currentDirective === 'injury_caution'
                          ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Heart className="w-3 h-3 text-emerald-400" />
                      <span>🩹 Caution</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fixtures League Filter & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">
            {selectedLeagueFilter === 'all' ? 'Featured Continental Matchweek Fixtures' : `${selectedLeagueFilter} Matchday Fixtures`}
          </h3>
          <span className="text-xs text-slate-400">({matches.length} matches / {matches.length * 2} teams)</span>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedLeagueFilter}
            onChange={(e) => setSelectedLeagueFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">⭐ Featured Top European &amp; Continental (10 Fixtures)</option>
            {availableLeagues.map(lg => (
              <option key={lg} value={lg}>
                {lg} (20 Teams • 10 Matches)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fixtures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map((m, idx) => {
          const homeClients = players.filter(p => p.isMyClient && p.clubId === m.homeClub.id);
          const awayClients = players.filter(p => p.isMyClient && p.clubId === m.awayClub.id);
          const totalClientsInMatch = homeClients.length + awayClients.length;

          return (
            <div
              key={idx}
              className={`border rounded-2xl p-4 flex flex-col justify-between gap-3 transition shadow-md ${
                totalClientsInMatch > 0 
                  ? 'bg-slate-900 border-indigo-500/50 shadow-indigo-950/30' 
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {m.homeClub.league} • Fixture #{idx + 1}
                </span>
                {totalClientsInMatch > 0 ? (
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{totalClientsInMatch} Client{totalClientsInMatch > 1 ? 's' : ''} Starring</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-bold">Neutral Match</span>
                )}
              </div>

              {/* Matchup */}
              <div className="flex items-center justify-between gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2.5 w-5/12">
                  <div className={`w-8 h-8 rounded-lg ${m.homeClub.logoColor} flex items-center justify-center text-xs font-black text-white shrink-0 shadow`}>
                    {m.homeClub.shortName}
                  </div>
                  <span className="text-xs font-bold text-slate-100 truncate">{m.homeClub.name}</span>
                </div>

                <div className="text-xs font-black text-slate-400 px-2 shrink-0">VS</div>

                <div className="flex items-center justify-end gap-2.5 w-5/12 text-right">
                  <span className="text-xs font-bold text-slate-100 truncate">{m.awayClub.name}</span>
                  <div className={`w-8 h-8 rounded-lg ${m.awayClub.logoColor} flex items-center justify-center text-xs font-black text-white shrink-0 shadow`}>
                    {m.awayClub.shortName}
                  </div>
                </div>
              </div>

              {/* Action: Enter Director's Box */}
              <button
                onClick={() => setSelectedMatch({ homeClub: m.homeClub, awayClub: m.awayClub })}
                className={`w-full text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
                  totalClientsInMatch > 0
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Enter Director's Box &amp; Watch Live</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Live Match Simulator Modal */}
      {selectedMatch && (
        <LiveMatchSimulatorModal
          homeClub={selectedMatch.homeClub}
          awayClub={selectedMatch.awayClub}
          players={players}
          onClose={() => setSelectedMatch(null)}
          onUpdatePlayer={onUpdatePlayer}
          soundEnabled={agency.soundEnabled}
          activeDirectives={agency.activeMatchDirectives}
          onSetDirective={handleSetDirective}
        />
      )}
    </div>
  );
};
