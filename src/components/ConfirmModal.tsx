import React from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmStyle?: 'danger' | 'warning' | 'emerald' | 'indigo';
  icon?: 'alert' | 'check' | 'refresh';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmStyle = 'danger',
  icon = 'alert',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const styleMap = {
    danger: 'bg-red-600 hover:bg-red-500 shadow-red-600/30 text-white',
    warning: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30 text-white',
    emerald: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 text-white',
    indigo: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 text-white'
  };

  const iconMap = {
    alert: <AlertTriangle className="w-8 h-8 text-red-400" />,
    check: <CheckCircle className="w-8 h-8 text-emerald-400" />,
    refresh: <RefreshCw className="w-8 h-8 text-amber-400" />
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-slate-100 relative overflow-hidden">
        {/* Close top X */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0 shadow-inner">
            {iconMap[icon]}
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white leading-snug">{title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Agency Command Authorization</p>
          </div>
        </div>

        {/* Message */}
        <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer min-h-[44px]"
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-lg transition active:scale-95 cursor-pointer min-h-[44px] ${styleMap[confirmStyle]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
