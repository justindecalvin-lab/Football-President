import React from 'react';
import { TargetedClubFeedback, Club } from '../types';
import { formatMoney } from '../utils/gameEngine';
import {
  Building,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Percent,
  Coins,
  ShieldCheck,
  Zap,
  ArrowRight,
  UserCheck
} from 'lucide-react';

interface TargetedClubFeedbackViewProps {
  feedback: TargetedClubFeedback;
  targetClub?: Club;
  onApplySuggestedStructure?: (structure: {
    counterFee: number;
    upfrontPercent: number;
    sellOnPercent: number;
    addonsAmount?: number;
    counterWage?: number;
  }) => void;
}

export const TargetedClubFeedbackView: React.FC<TargetedClubFeedbackViewProps> = ({
  feedback,
  targetClub,
  onApplySuggestedStructure
}) => {
  const isAccepted = feedback.verdict === 'accepted';
  const isCounter = feedback.verdict === 'counter_offer';

  const verdictStyles = isAccepted
    ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
    : isCounter
    ? 'bg-amber-950/70 border-amber-500/60 text-amber-200'
    : 'bg-rose-950/70 border-rose-500/60 text-rose-200';

  const verdictBadgeColor = isAccepted
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    : isCounter
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    : 'bg-rose-500/20 text-rose-300 border-rose-500/40';

  return (
    <div className={`p-4 sm:p-5 rounded-3xl border-2 space-y-4 shadow-xl text-xs ${verdictStyles}`}>
      {/* Header with Director info & Verdict */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shrink-0">
            {feedback.directorAvatar || '👔'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{feedback.directorName}</span>
              <span className="text-[10px] text-slate-300">({feedback.directorRole})</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {targetClub?.name || 'Prospective Club'} Official Board Stance
            </p>
          </div>
        </div>

        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border shrink-0 ${verdictBadgeColor}`}>
          {feedback.statusLabel}
        </span>
      </div>

      {/* Quote */}
      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
        <p className="italic text-slate-200 text-xs leading-relaxed">
          {feedback.responseQuote}
        </p>
      </div>

      {/* Structured Assessments Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Valuation Assessment */}
        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Valuation Check</span>
            <span className={`text-[10px] font-black uppercase ${
              feedback.valuationAssessment.verdict === 'generous' || feedback.valuationAssessment.verdict === 'fair'
                ? 'text-emerald-400'
                : feedback.valuationAssessment.verdict === 'below_valuation'
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}>
              {feedback.valuationAssessment.verdict.replace('_', ' ')}
            </span>
          </div>
          <p className="text-white font-bold">
            Expected: {formatMoney(feedback.valuationAssessment.expectedFee)}
          </p>
          {feedback.valuationAssessment.gapAmount > 0 && (
            <p className="text-rose-400 text-[11px]">
              Gap: -{formatMoney(feedback.valuationAssessment.gapAmount)}
            </p>
          )}
          <p className="text-slate-400 text-[10px] pt-1 border-t border-slate-800/80">
            {feedback.valuationAssessment.reasoning}
          </p>
        </div>

        {/* 2. Tactical & Squad Importance */}
        {feedback.squadImportanceAssessment && (
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Squad Priority</span>
              <span className="text-indigo-300 font-black text-[10px]">
                {feedback.squadImportanceAssessment.importance.split(' ')[0]}
              </span>
            </div>
            <p className="text-white font-bold">
              {feedback.squadImportanceAssessment.importance}
            </p>
            <p className="text-slate-400 text-[10px] pt-1 border-t border-slate-800/80">
              {feedback.squadImportanceAssessment.tacticalReasoning}
            </p>
          </div>
        )}

        {/* 3. Financial & Cashflow Stance */}
        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Cashflow &amp; FFP</span>
            <span className={`text-[10px] font-black uppercase ${
              feedback.financialStructureAssessment.ffpRisk === 'low'
                ? 'text-emerald-400'
                : feedback.financialStructureAssessment.ffpRisk === 'moderate'
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}>
              {feedback.financialStructureAssessment.ffpRisk} Risk
            </span>
          </div>
          <p className="text-white font-bold">
            Liquidity Review
          </p>
          <p className="text-slate-400 text-[10px] pt-1 border-t border-slate-800/80">
            {feedback.financialStructureAssessment.cashflowVerdict}
          </p>
        </div>
      </div>

      {/* Suggested Alternative Deal Structure Panel */}
      {feedback.suggestedAlternativeStructure && onApplySuggestedStructure && (
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-950 to-indigo-950/60 border border-amber-500/40 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Target Club Alternative Deal Structure</span>
            </span>
            <span className="text-[10px] text-slate-400">Formal Counter-Terms</span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {feedback.suggestedAlternativeStructure.summaryText}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl font-bold text-emerald-400">
              Fee: {formatMoney(feedback.suggestedAlternativeStructure.counterTransferFee)}
            </span>
            <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl font-bold text-amber-300">
              Upfront: {feedback.suggestedAlternativeStructure.suggestedInstallmentUpfrontPercent}%
            </span>
            <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl font-bold text-indigo-300">
              Sell-On: {feedback.suggestedAlternativeStructure.suggestedSellOnPercent}%
            </span>
            {feedback.suggestedAlternativeStructure.suggestedAddOnsAmount && (
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl font-bold text-sky-300">
                Add-Ons: +{formatMoney(feedback.suggestedAlternativeStructure.suggestedAddOnsAmount)}
              </span>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (feedback.suggestedAlternativeStructure) {
                  onApplySuggestedStructure({
                    counterFee: feedback.suggestedAlternativeStructure.counterTransferFee,
                    upfrontPercent: feedback.suggestedAlternativeStructure.suggestedInstallmentUpfrontPercent,
                    sellOnPercent: feedback.suggestedAlternativeStructure.suggestedSellOnPercent,
                    addonsAmount: feedback.suggestedAlternativeStructure.suggestedAddOnsAmount,
                    counterWage: feedback.suggestedAlternativeStructure.counterWage
                  });
                }
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Adopt Suggested Deal Structure &amp; Adjust Bid</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
