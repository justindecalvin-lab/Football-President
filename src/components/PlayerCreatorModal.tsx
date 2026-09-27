import React, { useState } from 'react';
import { Player, Position } from '../types';
import { PlayerAvatar } from './PlayerAvatar';
import { soundEngine } from '../utils/soundEffects';
import { calculateValuationForRating } from '../utils/gameEngine';
import { Sparkles, X, UserPlus, Trophy, Award, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlayerCreatorModalProps {
  onClose: () => void;
  onAddPlayer: (player: Player) => void;
  soundEnabled?: boolean;
}

export const PlayerCreatorModal: React.FC<PlayerCreatorModalProps> = ({
  onClose,
  onAddPlayer,
  soundEnabled
}) => {
  const [name, setName] = useState('Leo Da Silva');
  const [age, setAge] = useState(17);
  const [nationality, setNationality] = useState('Brazil');
  const [flag, setFlag] = useState('🇧🇷');
  const [position, setPosition] = useState<Position>('CAM');
  const [rating, setRating] = useState(76);
  const [potential, setPotential] = useState(92);
  const [skinTone, setSkinTone] = useState('#f8d5c2');
  const [hairStyle, setHairStyle] = useState('afro');
  const [hairColor, setHairColor] = useState('#2c1e19');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    const newPlayer: Player = {
      id: 'p_custom_' + Date.now(),
      name,
      age,
      nationality,
      flag,
      position,
      rating,
      potential,
      value: calculateValuationForRating(rating, age, potential),
      wage: Math.round(rating * 1000),
      contractYears: 4,
      clubId: 'free_agent',
      clubName: 'Free Agent',
      isMyClient: true,
      agentCommission: 10,
      morale: 95,
      loyalty: 90,
      form: 85,
      injury: { isInjured: false, weeks: 0 },
      traits: ['Custom Wonderkid', 'Flair', 'Playmaker'],
      stats: { goals: 0, assists: 0, appearances: 0, avgRating: 7.0 },
      clauses: { releaseClause: Math.round(calculateValuationForRating(rating, age, potential) * 1.5) },
      personalLife: { happiness: 95, socialMediaFollowers: 50000, scandalLevel: 0, endorsementEarnings: 15000, fatigue: 0, mentalHealth: 100 },
      avatarSeed: { skinTone, hairStyle, hairColor, eyeColor: '#1a100c' }
    };

    if (soundEnabled) soundEngine.playCashSound();
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });

    onAddPlayer(newPlayer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Create Custom Wonderkid Client</h2>
            <p className="text-xs text-slate-400">Design your agency's next Ballon d'Or prospect from scratch.</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Player Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Position:</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as Position)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nationality & Flag:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                  className="w-16 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-center text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Age ({age} yrs):</label>
              <input
                type="range"
                min="16"
                max="24"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Current Overall Rating ({rating}):</label>
              <input
                type="range"
                min="65"
                max="85"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Potential Ceiling ({potential}):</label>
              <input
                type="range"
                min="80"
                max="99"
                value={potential}
                onChange={(e) => setPotential(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          {/* Avatar Hair & Skin customization */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
            <h3 className="text-xs font-bold text-slate-200">Avatar Style Customization:</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Hair Style:</label>
                <select
                  value={hairStyle}
                  onChange={(e) => setHairStyle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                >
                  <option value="afro">Afro Curls</option>
                  <option value="short">Short Cut</option>
                  <option value="curly">Curly Top</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Skin Tone:</label>
                <input
                  type="color"
                  value={skinTone}
                  onChange={(e) => setSkinTone(e.target.value)}
                  className="w-full h-8 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition cursor-pointer min-h-[44px] shadow-lg flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Sign Custom Wonderkid to Agency</span>
          </button>
        </form>
      </div>
    </div>
  );
};
