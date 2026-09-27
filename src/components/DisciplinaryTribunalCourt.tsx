import React, { useState } from 'react';
import { AgencyState, DisciplinaryCourtCase, Club, Player } from '../types';
import { formatMoney, generateInitialDisciplinaryCases } from '../utils/gameEngine';
import { 
  Scale, 
  Gavel, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Users, 
  Crown,
  Eye,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface DisciplinaryTribunalCourtProps {
  agency: AgencyState;
  clubs: Club[];
  players?: Player[];
  onUpdateAgency: (updater: (prev: AgencyState) => AgencyState) => void;
  onUpdatePlayer?: (player: Player) => void;
  onUpdateClub?: (club: Club) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const DisciplinaryTribunalCourt: React.FC<DisciplinaryTribunalCourtProps> = ({
  agency,
  clubs,
  onUpdateAgency,
  onUpdateClub,
  onShowToast
}) => {
  const [cases, setCases] = useState<DisciplinaryCourtCase[]>(() => {
    return agency.disciplinaryCases && agency.disciplinaryCases.length > 0
      ? agency.disciplinaryCases
      : generateInitialDisciplinaryCases(agency.currentWeek, agency.currentSeason, clubs);
  });

  const [selectedCase, setSelectedCase] = useState<DisciplinaryCourtCase | null>(null);

  // Issue Verdict
  const handleIssueVerdict = (courtCase: DisciplinaryCourtCase, verdictIndex: number) => {
    const verdict = courtCase.verdictOptions[verdictIndex];
    if (!verdict) return;

    // Apply Impacts to Club
    if (courtCase.clubId && onUpdateClub) {
      const targetClub = clubs.find(c => c.id === courtCase.clubId);
      if (targetClub) {
        let updatedPoints = targetClub.points;
        let updatedBudget = targetClub.transferBudget;

        if (verdict.pointsDeducted) {
          updatedPoints = Math.max(0, targetClub.points - verdict.pointsDeducted);
        }
        if (verdict.fineAmount) {
          updatedBudget = Math.max(0, targetClub.transferBudget - verdict.fineAmount);
        }

        onUpdateClub({
          ...targetClub,
          points: updatedPoints,
          transferBudget: updatedBudget
        });
      }
    }

    // Apply Impacts to Presidency State, Treasury & Agency Retainer Refunds
    onUpdateAgency(prev => {
      const pState = prev.presidency;
      const currentInfluence = pState?.politicalInfluence || 50;
      const updatedInfluence = Math.min(100, Math.max(0, currentInfluence + verdict.politicalInfluenceImpact));

      // Calculate Legal Retainer Refund based on verdict outcome
      let retainerRefund = 0;
      if (verdict.politicalInfluenceImpact > 0 || verdict.label.toLowerCase().includes('exonerat') || verdict.label.toLowerCase().includes('dismiss')) {
        retainerRefund = 150000; // 100% legal retainer refund on exoneration
      } else if (verdict.label.toLowerCase().includes('reduc') || verdict.label.toLowerCase().includes('mitigat') || verdict.label.toLowerCase().includes('fine only')) {
        retainerRefund = 75000; // 50% refund on mitigated penalty
      }

      // If fine collected, deposit into Federation Treasury
      let updatedTreasury = prev.federationTreasury;
      if (verdict.fineAmount && updatedTreasury) {
        updatedTreasury = {
          ...updatedTreasury,
          treasuryBalance: updatedTreasury.treasuryBalance + verdict.fineAmount
        };
      }

      const updatedCases = cases.map(c => {
        if (c.id === courtCase.id) {
          return {
            ...c,
            isResolved: true,
            chosenVerdictIndex: verdictIndex
          };
        }
        return c;
      });

      return {
        ...prev,
        balance: prev.balance + retainerRefund,
        presidency: {
          ...pState,
          politicalInfluence: updatedInfluence
        },
        federationTreasury: updatedTreasury,
        disciplinaryCases: updatedCases
      };
    });

    const updatedLocalCases = cases.map(c => {
      if (c.id === courtCase.id) {
        return {
          ...c,
          isResolved: true,
          chosenVerdictIndex: verdictIndex
        };
      }
      return c;
    });
    setCases(updatedLocalCases);

    const isExonerated = verdict.politicalInfluenceImpact > 0 || verdict.label.toLowerCase().includes('exonerat');
    const refundText = isExonerated ? ' (+€150k Legal Retainer Refunded)' : verdict.label.toLowerCase().includes('reduc') ? ' (+€75k Retainer Refunded)' : '';

    onShowToast(`⚖️ PRESIDENTIAL RULING HANDED DOWN: "${verdict.label}" for ${courtCase.involvedEntityName}${refundText}!`, 'success');
    setSelectedCase(null);
  };

  const unresolvedCount = cases.filter(c => !c.isResolved).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-black text-white tracking-tight">Federation Disciplinary Court & VAR Tribunals</h2>
            </div>
            <p className="text-slate-400 text-sm max-w-xl">
              Preside over high-profile disciplinary hearings, controversial VAR appeals, and syndicate match-fixing investigations. Hand down binding presidential rulings that reshape league standings.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-700/80 rounded-xl p-4 flex items-center gap-3">
            <Gavel className="w-8 h-8 text-amber-400" />
            <div>
              <div className="text-[11px] text-slate-400 font-bold uppercase">Pending Docket</div>
              <div className="text-base font-black text-white">{unresolvedCount} Active Hearings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cases Docket List */}
      <div className="space-y-4">
        {cases.map(courtCase => {
          const isResolved = courtCase.isResolved;
          const chosenVerdict = isResolved && courtCase.chosenVerdictIndex !== undefined 
            ? courtCase.verdictOptions[courtCase.chosenVerdictIndex] 
            : null;

          return (
            <div key={courtCase.id} className={`p-6 rounded-2xl border ${isResolved ? 'bg-slate-950/50 border-slate-800 opacity-80' : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'} space-y-4 transition`}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold uppercase tracking-wider">
                      {courtCase.caseType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-500">Season {courtCase.seasonSubmitted}, Week {courtCase.weekSubmitted}</span>
                  </div>
                  <h3 className="text-lg font-black text-white">{courtCase.title}</h3>
                  <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">{courtCase.details}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Evidence Strength</span>
                  <div className="text-lg font-black text-amber-400">{courtCase.evidenceStrength}%</div>
                </div>
              </div>

              {/* Prosecution Demand Banner */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400"><strong>Prosecution Demand:</strong> {courtCase.prosecutionDemand}</span>
                <span className="text-slate-500">Involved: <strong className="text-white">{courtCase.involvedEntityName}</strong></span>
              </div>

              {/* Resolution Status or Action */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                {isResolved && chosenVerdict ? (
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Verdict Delivered: "{chosenVerdict.label}"</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedCase(courtCase)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-950/40"
                  >
                    <Gavel className="w-4 h-4" />
                    <span>Convene Hearing & Hand Down Ruling</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hearing Verdict Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Judicial Ruling</span>
                <h3 className="text-xl font-black text-white mt-0.5">{selectedCase.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedCase.details}</p>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300">Select Binding Sanction:</span>
              {selectedCase.verdictOptions.map((opt, idx) => (
                <div
                  key={idx}
                  onClick={() => handleIssueVerdict(selectedCase, idx)}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl cursor-pointer transition space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white text-sm group-hover:text-amber-400 transition">{opt.label}</span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                  </div>
                  <p className="text-slate-400 text-xs">{opt.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-3 text-[11px] pt-1 border-t border-slate-800/80">
                    <span className="text-indigo-400">Political Influence: {opt.politicalInfluenceImpact > 0 ? `+${opt.politicalInfluenceImpact}` : opt.politicalInfluenceImpact}</span>
                    <span className="text-emerald-400">Integrity: {opt.integrityImpact > 0 ? `+${opt.integrityImpact}` : opt.integrityImpact}</span>
                    <span className="text-amber-400">Approval: {opt.publicApprovalImpact > 0 ? `+${opt.publicApprovalImpact}` : opt.publicApprovalImpact}</span>
                    {(opt.politicalInfluenceImpact > 0 || opt.label.toLowerCase().includes('exonerat')) && (
                      <span className="text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                        +€150k Retainer Refund
                      </span>
                    )}
                    {opt.label.toLowerCase().includes('reduc') && (
                      <span className="text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                        +€75k Retainer Refund
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
