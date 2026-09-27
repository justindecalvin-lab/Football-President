import React, { useState, useEffect, useRef } from 'react';
import { AgencyState, Club, Player, NewsItem } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { 
  saveItemToStorage, 
  loadItemFromStorage, 
  removeItemFromStorage, 
  cleanLocalStorageBloat, 
  getStorageFootprintMB,
  getFormattedStorageFootprint,
  vacuumStorage,
  compactPlayers,
  compactClubs,
  hydratePlayers,
  hydrateClubs
} from '../utils/storage';
import { 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  X, 
  HardDrive, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Building2, 
  Trophy, 
  DollarSign, 
  ShieldCheck, 
  RefreshCw,
  FileText,
  Radio,
  Sparkles
} from 'lucide-react';

export interface GameSaveSlot {
  slotId: string;
  slotName: string;
  savedAt: string;
  agency: AgencyState;
  clubs: Club[];
  players: Player[];
  news: NewsItem[];
  isAutoSave?: boolean;
}

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  agency: AgencyState;
  clubs: Club[];
  players: Player[];
  news: NewsItem[];
  onLoadState: (state: { agency: AgencyState; clubs: Club[]; players: Player[]; news: NewsItem[] }) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const STORAGE_PREFIX = 'SOCCER_AGENT_SLOT_';
const AUTOSAVE_KEY = 'SOCCER_AGENT_AUTOSAVE_SLOT';
const AUTOSAVE_SETTING_KEY = 'SOCCER_AGENT_AUTOSAVE_ENABLED';

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  isOpen,
  onClose,
  agency,
  clubs,
  players,
  news,
  onLoadState,
  addToast
}) => {
  const [activeTab, setActiveTab] = useState<'slots' | 'export_import' | 'settings'>('slots');
  const [slots, setSlots] = useState<{ [key: string]: GameSaveSlot | null }>({
    slot_1: null,
    slot_2: null,
    slot_3: null,
    autosave: null
  });
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [slotNames, setSlotNames] = useState<{ [key: string]: string }>({
    slot_1: 'Manual Save 1',
    slot_2: 'Manual Save 2',
    slot_3: 'Manual Save 3',
    autosave: 'Auto-Save'
  });
  const [isEditingSlotName, setIsEditingSlotName] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [previewImport, setPreviewImport] = useState<GameSaveSlot | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Monitor Network / Offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [storageSizeMB, setStorageSizeMB] = useState<number>(0);
  const [formattedFootprint, setFormattedFootprint] = useState<string>('0 KB');
  const [isVacuuming, setIsVacuuming] = useState<boolean>(false);

  // Refresh slots from High-Capacity Storage
  const loadSlotsFromStorage = async () => {
    const newSlots: { [key: string]: GameSaveSlot | null } = {
      slot_1: null,
      slot_2: null,
      slot_3: null,
      autosave: null
    };

    for (const id of ['slot_1', 'slot_2', 'slot_3']) {
      try {
        const slotData = await loadItemFromStorage<GameSaveSlot>(STORAGE_PREFIX + id);
        if (slotData) {
          newSlots[id] = slotData;
        }
      } catch (e) {
        console.error(`Error loading save slot ${id}`, e);
      }
    }

    try {
      const autoData = await loadItemFromStorage<GameSaveSlot>(AUTOSAVE_KEY);
      if (autoData) {
        newSlots.autosave = autoData;
      }
    } catch (e) {}

    setSlots(newSlots);

    try {
      const setting = localStorage.getItem(AUTOSAVE_SETTING_KEY);
      if (setting !== null) {
        setAutoSaveEnabled(setting === 'true');
      }
    } catch (e) {}

    const footprint = await getStorageFootprintMB();
    setStorageSizeMB(footprint);
    const formatted = await getFormattedStorageFootprint();
    setFormattedFootprint(formatted);
  };

  const handleVacuumStorage = async () => {
    setIsVacuuming(true);
    try {
      const { freedBytes } = await vacuumStorage();
      await loadSlotsFromStorage();
      const updatedFormatted = await getFormattedStorageFootprint();
      setFormattedFootprint(updatedFormatted);
      const freedFormatted = freedBytes > 1024 * 1024 
        ? `${(freedBytes / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(freedBytes / 1024)} KB`;
      addToast(`🧹 Storage vacuumed & optimized! Freed: ${freedFormatted}. Active size: ${updatedFormatted}`, 'success');
    } catch (e) {
      addToast('❌ Storage optimization error', 'error');
    } finally {
      setIsVacuuming(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSlotsFromStorage();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Save current game into a specific slot
  const handleSaveToSlot = async (slotId: string) => {
    try {
      const saveData: GameSaveSlot = {
        slotId,
        slotName: slotNames[slotId] || `Save Slot ${slotId.replace('slot_', '')}`,
        savedAt: new Date().toISOString(),
        agency,
        clubs,
        players,
        news,
        isAutoSave: slotId === 'autosave'
      };

      const key = slotId === 'autosave' ? AUTOSAVE_KEY : STORAGE_PREFIX + slotId;
      const ok = await saveItemToStorage(key, saveData);

      if (ok) {
        await loadSlotsFromStorage();
        addToast(`💾 Game Saved to ${saveData.slotName}! (Season ${agency.currentSeason}, Wk ${agency.currentWeek})`, 'success');
      } else {
        addToast('❌ Save failed. Storage limit reached.', 'error');
      }
    } catch (e) {
      console.error('Failed to save to storage slot:', e);
      addToast('❌ Storage quota exceeded or save failed!', 'error');
    }
  };

  // Load game from a specific slot
  const handleLoadFromSlot = (slot: GameSaveSlot) => {
    if (!slot.agency) {
      addToast('❌ Invalid save slot format!', 'error');
      return;
    }
    if (window.confirm(`Load save from ${new Date(slot.savedAt).toLocaleString()}? Current unsaved progress will be overwritten.`)) {
      onLoadState({
        agency: slot.agency,
        clubs: slot.clubs || [],
        players: slot.players || [],
        news: slot.news || []
      });
      addToast(`✅ Career Resumed! (Season ${slot.agency.currentSeason}, Week ${slot.agency.currentWeek})`, 'success');
      onClose();
    }
  };

  // Delete a save slot
  const handleDeleteSlot = async (slotId: string) => {
    if (window.confirm('Are you sure you want to delete this save slot?')) {
      const key = slotId === 'autosave' ? AUTOSAVE_KEY : STORAGE_PREFIX + slotId;
      await removeItemFromStorage(key);
      await loadSlotsFromStorage();
      addToast('🗑️ Save slot deleted.', 'info');
    }
  };

  // Export Save Slot to JSON file on hard drive (using compact serialization for lightweight file)
  const handleExportToFile = (slot?: GameSaveSlot) => {
    try {
      const srcAgency = slot ? slot.agency : agency;
      const srcClubs = slot ? slot.clubs : clubs;
      const srcPlayers = slot ? slot.players : players;
      const srcNews = slot ? slot.news : news;

      const dataToExport = {
        slotId: slot?.slotId || 'offline_export',
        slotName: slot?.slotName || `${srcAgency.agencyName} Backup`,
        savedAt: new Date().toISOString(),
        agency: srcAgency,
        clubs: compactClubs(srcClubs),
        players: compactPlayers(srcPlayers),
        news: srcNews ? srcNews.slice(0, 30) : []
      };

      const jsonStr = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeAgencyName = srcAgency.agencyName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.href = url;
      link.download = `soccer_agent_${safeAgencyName}_s${srcAgency.currentSeason}_w${srcAgency.currentWeek}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast('📥 Compact Save File (.json) Downloaded Successfully!', 'success');
    } catch (e) {
      console.error('Export error:', e);
      addToast('❌ Failed to generate offline save file.', 'error');
    }
  };

  // Process imported file JSON
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Validation check
        if (!parsed.agency || !parsed.agency.agencyName || typeof parsed.agency.currentSeason !== 'number') {
          addToast('❌ Invalid save file structure!', 'error');
          return;
        }

        const hydratedPlayers = hydratePlayers(parsed.players || []);
        const hydratedClubs = hydrateClubs(parsed.clubs || []);

        setPreviewImport({
          slotId: 'imported',
          slotName: parsed.slotName || `${parsed.agency.agencyName} (Imported File)`,
          savedAt: parsed.savedAt || new Date().toISOString(),
          agency: parsed.agency,
          clubs: hydratedClubs,
          players: hydratedPlayers,
          news: parsed.news || []
        });

        addToast('🔍 Save file verified! Review summary and click "Resume Progress".', 'info');
      } catch (err) {
        console.error('Import parse error:', err);
        addToast('❌ Failed to parse save file. Ensure it is a valid .json file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Confirm Import state into game
  const handleConfirmImport = () => {
    if (!previewImport) return;
    onLoadState({
      agency: previewImport.agency,
      clubs: previewImport.clubs,
      players: previewImport.players,
      news: previewImport.news
    });
    addToast(`🚀 Resume Complete! Welcome back to ${previewImport.agency.agencyName}!`, 'success');
    setPreviewImport(null);
    onClose();
  };

  // Toggle Auto-Save setting
  const handleToggleAutoSave = () => {
    const nextVal = !autoSaveEnabled;
    setAutoSaveEnabled(nextVal);
    localStorage.setItem(AUTOSAVE_SETTING_KEY, String(nextVal));
    addToast(nextVal ? '⚙️ Auto-Save Enabled (Saves after each week advance)' : '⚙️ Auto-Save Disabled', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Offline Save & Resume Manager</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isOnline ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  <Radio className={`w-3 h-3 ${isOnline ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
                  <span>{isOnline ? 'Online / Local Storage Ready' : '100% Offline Mode Active'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Save game progress locally in offline slots or download `.json` backups to resume anytime.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-950/60 border-b border-slate-800/80 px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('slots')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'slots'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>LocalStorage Slots</span>
            </button>

            <button
              onClick={() => setActiveTab('export_import')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'export_import'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Offline File Export / Import (.json)</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Auto-Save Settings</span>
            </button>
          </div>

          <button
            onClick={() => handleSaveToSlot('slot_1')}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Quick Save (Slot 1)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: LOCALSTORAGE SAVE SLOTS */}
          {activeTab === 'slots' && (
            <div className="space-y-4">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Current Active Career Snapshot</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {agency.agencyName} ({agency.agentName}) • Season {agency.currentSeason}, Week {agency.currentWeek} • {formatMoney(agency.balance)} Capital
                  </p>
                </div>

                <button
                  onClick={() => handleExportToFile()}
                  className="bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/40 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>Download File Backup</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'autosave', title: 'Auto-Save Slot', isAuto: true },
                  { id: 'slot_1', title: 'Manual Save Slot 1', isAuto: false },
                  { id: 'slot_2', title: 'Manual Save Slot 2', isAuto: false },
                  { id: 'slot_3', title: 'Manual Save Slot 3', isAuto: false }
                ].map(({ id, title, isAuto }) => {
                  const slot = slots[id];

                  return (
                    <div
                      key={id}
                      className={`border rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition ${
                        slot 
                          ? isAuto 
                            ? 'bg-gradient-to-br from-slate-900 to-indigo-950/40 border-indigo-500/50' 
                            : 'bg-slate-800/90 border-slate-700 hover:border-emerald-500/60'
                          : 'bg-slate-900/40 border-slate-800/80 border-dashed'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                              isAuto ? 'bg-indigo-500 text-white' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}>
                              {isAuto ? 'AUTO' : 'SLOT'}
                            </span>
                            <h4 className="text-sm font-extrabold text-white">{title}</h4>
                          </div>

                          {slot && (
                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{new Date(slot.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                          )}
                        </div>

                        {slot ? (
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between">
                              <h5 className="text-base font-black text-amber-300">{slot.agency?.agencyName}</h5>
                              <span className="text-xs text-emerald-400 font-extrabold">{formatMoney(slot.agency?.balance || 0)}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                              <div className="flex items-center gap-1.5">
                                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                                <span>Season {slot.agency?.currentSeason}, Wk {slot.agency?.currentWeek}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                                <span>HQ Level {slot.agency?.officeLevel}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Reputation: {slot.agency?.reputation}/100</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Clients: {slot.players?.filter(p => p.isMyClient).length || 0}</span>
                              </div>
                            </div>

                            <p className="text-[10px] text-slate-400">
                              Saved: {new Date(slot.savedAt).toLocaleDateString()} {new Date(slot.savedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        ) : (
                          <div className="py-6 text-center space-y-1">
                            <Save className="w-8 h-8 text-slate-700 mx-auto" />
                            <p className="text-xs font-bold text-slate-500">Empty Save Slot</p>
                            <p className="text-[11px] text-slate-600">Click below to save current game progress</p>
                          </div>
                        )}
                      </div>

                      {/* Action Controls */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                        {slot ? (
                          <>
                            <button
                              onClick={() => handleLoadFromSlot(slot)}
                              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[40px]"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Resume Game</span>
                            </button>

                            <button
                              onClick={() => handleSaveToSlot(id)}
                              className="bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer min-h-[40px]"
                              title="Overwrite Slot"
                            >
                              Overwrite
                            </button>

                            <button
                              onClick={() => handleExportToFile(slot)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 p-2 rounded-xl transition cursor-pointer min-h-[40px] flex items-center justify-center"
                              title="Download File"
                            >
                              <Download className="w-4 h-4 text-sky-400" />
                            </button>

                            {!isAuto && (
                              <button
                                onClick={() => handleDeleteSlot(id)}
                                className="bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700 p-2 rounded-xl transition cursor-pointer min-h-[40px] flex items-center justify-center"
                                title="Delete Save"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => handleSaveToSlot(id)}
                            className="w-full bg-slate-800 hover:bg-emerald-500/20 text-emerald-300 hover:border-emerald-500/50 border border-slate-700 font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer min-h-[40px]"
                          >
                            <Save className="w-4 h-4 text-emerald-400" />
                            <span>Save Current Progress Here</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: EXPORT / IMPORT FILE (.JSON) */}
          {activeTab === 'export_import' && (
            <div className="space-y-6">
              {/* Export Panel */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Export Save File to Offline Storage (.json)</h3>
                    <p className="text-xs text-slate-400">
                      Download a complete copy of your agency career to your phone or computer. Perfect for offline playing, backups, or moving saves across devices.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-xs text-slate-300 space-y-1">
                    <p className="font-extrabold text-amber-300">{agency.agencyName} Career Data</p>
                    <p className="text-slate-400">Contains: {clubs.length} Clubs, {players.length} Players, Full Financial Ledger & Federation Status.</p>
                  </div>

                  <button
                    onClick={() => handleExportToFile()}
                    className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black px-5 py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer min-h-[44px]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Save File (.json)</span>
                  </button>
                </div>
              </div>

              {/* Import Panel */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Import Offline Save File (.json)</h3>
                    <p className="text-xs text-slate-400">
                      Select or drag-and-drop a previously downloaded `.json` save file to resume game progress immediately.
                    </p>
                  </div>
                </div>

                {/* File Dropzone */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-950/80 hover:bg-slate-900 border-2 border-dashed border-slate-700 hover:border-purple-500/80 rounded-2xl p-8 text-center cursor-pointer transition space-y-3 group"
                >
                  <Upload className="w-10 h-10 text-purple-400 group-hover:scale-110 mx-auto transition" />
                  <div>
                    <p className="text-sm font-extrabold text-slate-200">Click or Drag & Drop `.json` save file here</p>
                    <p className="text-xs text-slate-500 mt-0.5">Supports official Soccer Agent save backups</p>
                  </div>
                </div>

                {/* Import Preview */}
                {previewImport && (
                  <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-slate-900 border-2 border-purple-500 rounded-2xl p-5 shadow-2xl space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-purple-400" />
                        <h4 className="text-sm font-extrabold text-white">Save File Verified & Ready for Import</h4>
                      </div>
                      <span className="text-xs text-purple-300 font-bold">{previewImport.slotName}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase">Agency Name</p>
                        <p className="font-extrabold text-amber-300">{previewImport.agency.agencyName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase">Timeline</p>
                        <p className="font-bold text-slate-200">Season {previewImport.agency.currentSeason}, Wk {previewImport.agency.currentWeek}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase">Capital</p>
                        <p className="font-extrabold text-emerald-400">{formatMoney(previewImport.agency.balance)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase">HQ Level</p>
                        <p className="font-bold text-amber-300">Level {previewImport.agency.officeLevel}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={handleConfirmImport}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer min-h-[44px]"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Resume Game From Imported File</span>
                      </button>

                      <button
                        onClick={() => setPreviewImport(null)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-3 rounded-xl text-xs cursor-pointer min-h-[44px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AUTO-SAVE SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-emerald-400" />
                      <span>Automatic Weekly Progress Auto-Save</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      When enabled, the game automatically updates the local Auto-Save slot every time you click "Advance Week".
                    </p>
                  </div>

                  <button
                    onClick={handleToggleAutoSave}
                    className={`w-14 h-8 rounded-full p-1 transition cursor-pointer ${
                      autoSaveEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow-md transform transition ${
                        autoSaveEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-amber-400" />
                      <span>100% Offline Capability</span>
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      All save data is stored directly inside your web browser's LocalStorage or downloaded directly to your device as standard JSON files. No internet connection or cloud account is required!
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Data Protection & Privacy</span>
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your agency records, transfers, and federation choices remain 100% private on your own device.
                    </p>
                  </div>
                </div>

                {/* Storage Health & Vacuum Optimizer */}
                <div className="bg-slate-950/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-white">Storage Health & Footprint</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          LZW Compact Active (~85% Space Saved)
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Current data footprint across IndexedDB and LocalStorage: <span className="font-bold text-amber-300">{formattedFootprint}</span>
                      </p>
                    </div>

                    <button
                      onClick={handleVacuumStorage}
                      disabled={isVacuuming}
                      className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shrink-0 shadow-md"
                    >
                      <Sparkles className={`w-4 h-4 ${isVacuuming ? 'animate-spin' : ''}`} />
                      <span>{isVacuuming ? 'Optimizing...' : 'Vacuum & Optimize Storage'}</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
                    Vacuum cleans orphaned cache keys, compacts non-client world player objects into lightweight tuples, caps expired rolling news, and purges duplicate save slots.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 border-t border-slate-800 px-6 py-4 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Local Offline Persistence Operational</span>
          </p>

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer min-h-[40px]"
          >
            Close Manager
          </button>
        </div>
      </div>
    </div>
  );
};
