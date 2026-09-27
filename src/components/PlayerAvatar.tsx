import React from 'react';
import { Player } from '../types';

interface PlayerAvatarProps {
  player: Player;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ player, size = 'md' }) => {
  const seed = player.avatarSeed || {
    skinTone: '#f8d5c2',
    hairStyle: 'short',
    hairColor: '#2c1e19',
    eyeColor: '#1a100c'
  };

  const dimMap = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-14 h-14 text-sm',
    lg: 'w-20 h-20 text-base',
    xl: 'w-28 h-28 text-lg'
  };

  const ratingBorderColor = 
    player.rating >= 90 ? 'border-amber-400 ring-2 ring-amber-400/40' :
    player.rating >= 80 ? 'border-emerald-400' :
    player.rating >= 70 ? 'border-blue-400' :
    'border-slate-600';

  return (
    <div className={`relative rounded-2xl border-2 ${ratingBorderColor} ${dimMap[size]} bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 shadow-lg`}>
      {/* Background Stadium Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/40 via-slate-900 to-slate-950" />

      {/* Vector Avatar Graphic */}
      <svg className="w-full h-full relative z-10" viewBox="0 0 100 100" fill="none">
        {/* Jersey / Collar */}
        <path d="M 20 85 L 30 65 L 70 65 L 80 85 Z" fill="#3b82f6" />
        <path d="M 40 65 L 50 75 L 60 65 Z" fill="#ffffff" />

        {/* Head */}
        <circle cx="50" cy="45" r="22" fill={seed.skinTone} />

        {/* Eyes */}
        <circle cx="42" cy="43" r="3" fill={seed.eyeColor} />
        <circle cx="58" cy="43" r="3" fill={seed.eyeColor} />

        {/* Mouth Smile */}
        <path d="M 44 54 Q 50 58 56 54" stroke="#8d403a" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* Hair */}
        {seed.hairStyle === 'afro' && (
          <circle cx="50" cy="38" r="26" fill={seed.hairColor} opacity="0.9" />
        )}
        {seed.hairStyle === 'short' && (
          <path d="M 28 42 C 28 20, 72 20, 72 42 C 68 32, 32 32, 28 42 Z" fill={seed.hairColor} />
        )}
        {seed.hairStyle === 'curly' && (
          <path d="M 26 40 Q 50 15 74 40 Q 50 25 26 40 Z" fill={seed.hairColor} />
        )}
      </svg>

      {/* Flag Badge Bottom Right */}
      <div className="absolute bottom-0.5 right-0.5 bg-slate-950/80 rounded-md px-1 py-0.2 text-[10px] z-20 shadow">
        {player.flag}
      </div>

      {/* OVR Rating Pill Top Left */}
      <div className="absolute top-0.5 left-0.5 bg-slate-950/90 border border-slate-700 text-amber-300 font-black text-[10px] px-1 py-0.2 rounded-md z-20">
        {player.rating}
      </div>
    </div>
  );
};
