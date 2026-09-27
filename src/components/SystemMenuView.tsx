import React, { useState, useEffect } from 'react';
import { AgencyState } from '../types';
import { HardDrive, Wrench, Save, Download, PlusCircle, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { vacuumStorage, getFormattedStorageFootprint } from '../utils/storage';

interface SystemMenuViewProps {
  agency: AgencyState;
  onOpenSaveManager: () => void;
  onOpenEditor: () => void;
  onSaveGame: () => void;
  onLoadGame: () => void;
  onStartNewGame: () => void;
  onRestartGame: () => void;
}

export const SystemMenuView: React.FC<SystemMenuViewProps> = ({
  agency,
  onOpenSaveManager,
  onOpenEditor,
  onSaveGame,
  onLoadGame,
  onStartNewGame,
  onRestartGame
}) => {
  const [storageUsage, setStorageUsage] = useState<string>('Calculating...');
  const [isVacuuming, setIsVacuuming] = useState<boolean>(false);
  const [vacuumFeedback, setVacuumFeedback] = useState<string | null>(null);

  const refreshFootprint = async () => {
    try {
      const footprint = await getFormattedStorageFootprint();
      setStorageUsage(footprint);
    } catch (e) {
      setStorageUsage('OK');
    }
  };

  useEffect(() => {
    refreshFootprint();
  }, []);

  const handleVacuumStorage = async () => {
    setIsVacuuming(true);
    setVacuumFeedback(null);
    try {
      const { freedBytes } = await vacuumStorage();
      await refreshFootprint();
      const freedFormatted = freedBytes > 1024 * 1024
        ? `${(freedBytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(freedBytes / 1024)} KB`;
      setVacuumFeedback(`Freed ${freedFormatted} storage space! Data compacted.`);
    } catch (e) {
      setVacuumFeedback('Optimization failed.');
    } finally {
      setIsVacuuming(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 p-5 rounded-2xl shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              ⚙️
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-100">Game System & Storage</h2>
              <p className="text-xs text-slate-400">
                Manage local offline save slots, import/export JSON backups, and optimize memory.
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Storage Used</span>
            <span className="text-xs font-black text-amber-300">{storageUsage}</span>
          </div>
        </div>
      </div>

      {/* Main Options Grid */}
      <div className="grid grid-cols-1 gap-3">
        {/* Offline Save & Resume Manager */}
        <button
          onClick={onOpenSaveManager}
          className="bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 p-4 rounded-2xl flex items-center justify-between text-left transition cursor-pointer group shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-sm">Offline Save & Resume Manager</h3>
              <p className="text-xs text-slate-400">Manage 5 save slots, export JSON files, and set auto-saves</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            Open Hub
          </span>
        </button>

        {/* Optimize & Vacuum Storage */}
        <div className="bg-slate-900/90 border border-indigo-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-100 text-sm">Storage Vacuum & Data Compactor</h3>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded">
                  {storageUsage}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Purges obsolete cache keys, compresses non-client world players, and caps news logs
              </p>
              {vacuumFeedback && (
                <p className="text-xs text-emerald-400 font-bold mt-1 animate-fadeIn">
                  ✓ {vacuumFeedback}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleVacuumStorage}
            disabled={isVacuuming}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isVacuuming ? 'animate-spin' : ''}`} />
            <span>{isVacuuming ? 'Compacting...' : 'Vacuum & Optimize'}</span>
          </button>
        </div>

        {/* Quick Save Game */}
        <button
          onClick={onSaveGame}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-4 rounded-2xl flex items-center justify-between text-left transition cursor-pointer group shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-sky-500/20 text-sky-400 group-hover:scale-110 transition">
              <Save className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-sm">Quick Save Game</h3>
              <p className="text-xs text-slate-400">Instantly save current progress (Season {agency.currentSeason}, Wk {agency.currentWeek})</p>
            </div>
          </div>
          <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
            Quick Save
          </span>
        </button>

        {/* Load Game */}
        <button
          onClick={onLoadGame}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-4 rounded-2xl flex items-center justify-between text-left transition cursor-pointer group shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-sm">Load Saved Game</h3>
              <p className="text-xs text-slate-400">Restore last saved progress slot</p>
            </div>
          </div>
          <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
            Load Save
          </span>
        </button>

        {/* In-Game Editor (Cheats) */}
        <button
          onClick={onOpenEditor}
          className="bg-slate-900 hover:bg-slate-800 border border-amber-500/40 p-4 rounded-2xl flex items-center justify-between text-left transition cursor-pointer group shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-110 transition">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-sm">In-Game Customization & Editor</h3>
              <p className="text-xs text-slate-400">Adjust cash balance, player stats, attributes, and agency prestige</p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
            Launch Editor
          </span>
        </button>

        {/* Start New Game */}
        <button
          onClick={onStartNewGame}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-4 rounded-2xl flex items-center justify-between text-left transition cursor-pointer group shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-sm">Start Brand New Career</h3>
              <p className="text-xs text-slate-400">Reset progress and generate fresh global clubs & players</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            New Game
          </span>
        </button>

        {/* Restart Current Career */}
        <button
          onClick={onRestartGame}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-4 rounded-2xl flex items-center justify-between text-left transition cursor-pointer group shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-110 transition">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-sm">Restart Current Season</h3>
              <p className="text-xs text-slate-400">Keep agency name but reset to Season 1, Week 1</p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
            Restart
          </span>
        </button>
      </div>

      {/* Security Info */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-3 text-xs text-slate-400">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <p>All progress is synchronized with local storage and IndexedDB automatically every week.</p>
      </div>
    </div>
  );
};
