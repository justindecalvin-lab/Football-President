import React, { useState } from 'react';
import { AgencyState, AgencyBankLoan, Club } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { 
  Building2, 
  CreditCard, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  DollarSign, 
  Landmark, 
  ArrowRight, 
  Coins,
  FileText,
  Calculator
} from 'lucide-react';

interface AgencyDebtManagerProps {
  agency: AgencyState;
  clubs: Club[];
  onUpdateAgency: (updater: (prev: AgencyState) => AgencyState) => void;
  onUpdateClub?: (club: Club) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface LoanOffer {
  id: string;
  lenderName: string;
  lenderType: AgencyBankLoan['lenderType'];
  description: string;
  principalAmount: number;
  weeklyInterestRate: number; // e.g. 0.012 for 1.2%
  termWeeks: number;
  minCreditRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'Subprime';
  collateralReq: string;
  logoColor: string;
}

export const AgencyDebtManager: React.FC<AgencyDebtManagerProps> = ({
  agency,
  clubs,
  onUpdateAgency,
  onUpdateClub,
  onShowToast
}) => {
  const [selectedLender, setSelectedLender] = useState<string | null>(null);
  const [injectToClubId, setInjectToClubId] = useState<string>('agency_treasury');
  const [customRepayAmount, setCustomRepayAmount] = useState<{ [loanId: string]: number }>({});

  const activeLoans = agency.bankLoans || [];
  const creditRating = agency.creditRating || 'A';

  // Calculate Total Debt & Weekly Interest
  const totalDebt = activeLoans.reduce((sum, l) => sum + l.remainingPrincipal, 0);
  const totalWeeklyInterest = activeLoans.reduce((sum, l) => sum + Math.round(l.remainingPrincipal * l.weeklyInterestRate), 0);
  
  // Calculate Debt Ceiling based on Reputation and Valuation
  const debtCeiling = Math.max(10000000, agency.reputation * 1500000 + agency.balance * 2);
  const remainingBorrowCapacity = Math.max(0, debtCeiling - totalDebt);

  // Available Bank Facilities
  const loanOffers: LoanOffer[] = [
    {
      id: 'offer_rothschild',
      lenderName: 'Rothschild Sovereign Credit',
      lenderType: 'Sovereign Wealth Fund',
      description: 'Ultra-low interest prime sovereign credit facility for premier football conglomerates.',
      principalAmount: 50000000,
      weeklyInterestRate: 0.005, // 0.5% weekly
      termWeeks: 38,
      minCreditRating: 'AAA',
      collateralReq: 'HQ Real Estate & Tier 4 License',
      logoColor: 'from-amber-600 to-yellow-500'
    },
    {
      id: 'offer_barclays',
      lenderName: 'Barclays Football Revolving Line',
      lenderType: 'Commercial Bank',
      description: 'Standard institutional commercial facility for mid-window emergency transfer liquidity.',
      principalAmount: 20000000,
      weeklyInterestRate: 0.01, // 1.0% weekly
      termWeeks: 24,
      minCreditRating: 'A',
      collateralReq: 'Client Commission Escrow',
      logoColor: 'from-blue-600 to-indigo-600'
    },
    {
      id: 'offer_swiss_pe',
      lenderName: 'Alpine Private Equity Capital',
      lenderType: 'Private Equity',
      description: 'High-speed mezzanine financing with flexible covenants and rapid deployment.',
      principalAmount: 10000000,
      weeklyInterestRate: 0.015, // 1.5% weekly
      termWeeks: 16,
      minCreditRating: 'BBB',
      collateralReq: 'Grassroots Academy Assets',
      logoColor: 'from-purple-600 to-pink-600'
    },
    {
      id: 'offer_shadow_vault',
      lenderName: 'Gibraltar Shadow Syndicate Vault',
      lenderType: 'High-Risk Shadow Vault',
      description: 'No-questions-asked emergency bridge loan for distressed agencies facing default or urgent buyout bids.',
      principalAmount: 5000000,
      weeklyInterestRate: 0.035, // 3.5% weekly
      termWeeks: 8,
      minCreditRating: 'Subprime',
      collateralReq: 'Offshore Escrow & Personal Guarantee',
      logoColor: 'from-red-700 to-slate-900'
    }
  ];

  // Helper to test if rating qualifies
  const ratingHierarchy = ['Subprime', 'BBB', 'A', 'AA', 'AAA'];
  const isRatingEligible = (required: string) => {
    const userIdx = ratingHierarchy.indexOf(creditRating);
    const reqIdx = ratingHierarchy.indexOf(required);
    return userIdx >= reqIdx;
  };

  // Borrow Action
  const handleBorrowLoan = (offer: LoanOffer) => {
    if (!isRatingEligible(offer.minCreditRating)) {
      onShowToast(`Credit rating ${creditRating} does not meet ${offer.minCreditRating} requirement!`, 'error');
      return;
    }

    if (offer.principalAmount > remainingBorrowCapacity) {
      onShowToast(`Exceeds maximum allowable debt capacity of ${formatMoney(debtCeiling)}!`, 'error');
      return;
    }

    const newLoan: AgencyBankLoan = {
      id: `loan_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      lenderName: offer.lenderName,
      lenderType: offer.lenderType,
      principal: offer.principalAmount,
      remainingPrincipal: offer.principalAmount,
      weeklyInterestRate: offer.weeklyInterestRate,
      weeklyInterestPayment: Math.round(offer.principalAmount * offer.weeklyInterestRate),
      weeklyAmortizationPayment: 0,
      totalPaidSoFar: 0,
      termWeeksTotal: offer.termWeeks,
      weeksRemaining: offer.termWeeks,
      collateralAsset: offer.collateralReq,
      defaultedWeeks: 0,
      dateBorrowedWeek: agency.currentWeek,
      dateBorrowedSeason: agency.currentSeason
    };

    onUpdateAgency(prev => {
      const currentLoans = prev.bankLoans || [];
      const updatedBalance = injectToClubId === 'agency_treasury' 
        ? prev.balance + offer.principalAmount 
        : prev.balance;

      return {
        ...prev,
        balance: updatedBalance,
        bankLoans: [...currentLoans, newLoan]
      };
    });

    // If injected directly to a club owned by user
    if (injectToClubId !== 'agency_treasury' && onUpdateClub) {
      const targetClub = clubs.find(c => c.id === injectToClubId);
      if (targetClub) {
        onUpdateClub({
          ...targetClub,
          transferBudget: targetClub.transferBudget + offer.principalAmount
        });
        onShowToast(`🏦 Injected ${formatMoney(offer.principalAmount)} emergency debt funds directly into ${targetClub.name}'s transfer budget!`, 'success');
      }
    } else {
      onShowToast(`🏦 Secured ${formatMoney(offer.principalAmount)} from ${offer.lenderName}!`, 'success');
    }
  };

  // Repay Loan (Full or Partial)
  const handleRepayLoan = (loanId: string, requestedAmount: number) => {
    const loan = activeLoans.find(l => l.id === loanId);
    if (!loan) return;

    if (requestedAmount <= 0) return;

    // Strict mathematical clamping to prevent overpaying or debt loopholes
    const maxRepayable = Math.min(loan.remainingPrincipal, agency.balance);
    const amountToRepay = Math.min(requestedAmount, maxRepayable);

    if (amountToRepay <= 0) {
      onShowToast(`Insufficient agency liquid balance to repay ${formatMoney(requestedAmount)}!`, 'error');
      return;
    }

    onUpdateAgency(prev => {
      const currentLoans = prev.bankLoans || [];
      const updatedLoans = currentLoans.map(l => {
        if (l.id === loanId) {
          const newRemaining = Math.max(0, l.remainingPrincipal - amountToRepay);
          return {
            ...l,
            remainingPrincipal: newRemaining,
            totalPaidSoFar: l.totalPaidSoFar + amountToRepay,
            weeklyInterestPayment: Math.round(newRemaining * l.weeklyInterestRate)
          };
        }
        return l;
      }).filter(l => l.remainingPrincipal > 0);

      // Boost credit rating if paid off
      let updatedRating = prev.creditRating || 'A';
      if (loan.remainingPrincipal - amountToRepay <= 0 && updatedRating !== 'AAA') {
        const nextIdx = Math.min(ratingHierarchy.length - 1, ratingHierarchy.indexOf(updatedRating) + 1);
        updatedRating = ratingHierarchy[nextIdx] as any;
      }

      return {
        ...prev,
        balance: Math.max(0, prev.balance - amountToRepay),
        bankLoans: updatedLoans,
        creditRating: updatedRating
      };
    });

    onShowToast(`💳 Successfully repaid ${formatMoney(amountToRepay)} principal on ${loan.lenderName}!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Landmark className="w-6 h-6 text-indigo-400" />
              <h2 className="text-2xl font-black text-white tracking-tight">Bank Debt & Credit Facilities</h2>
            </div>
            <p className="text-slate-400 text-sm max-w-xl">
              Secure institutional bank credit and emergency loans to finance hostile release clause activations or urgent transfer windows. Zero loophole mathematical audit enforced.
            </p>
          </div>

          {/* Credit Rating Card */}
          <div className="bg-slate-950/80 border border-slate-700/80 rounded-xl p-4 flex items-center gap-4 min-w-[220px]">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <span className="text-xl font-black text-indigo-400">{creditRating}</span>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Credit Rating</div>
              <div className="text-sm font-black text-white">
                {creditRating === 'AAA' ? 'Prime Sovereign' : creditRating === 'AA' ? 'High Grade' : creditRating === 'A' ? 'Upper Medium' : creditRating === 'BBB' ? 'Speculative' : 'Default Risk'}
              </div>
              <div className="text-[11px] text-emerald-400 font-medium">Interest Multiplier: 1.0x</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
            <span>Total Debt Outstanding</span>
            <DollarSign className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400 mt-1">{formatMoney(totalDebt)}</div>
          <div className="text-[11px] text-slate-500 mt-1">{activeLoans.length} active credit lines</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
            <span>Weekly Interest Amortization</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1">{formatMoney(totalWeeklyInterest)}/wk</div>
          <div className="text-[11px] text-slate-500 mt-1">Deducted every matchweek</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
            <span>Borrowing Capacity</span>
            <Landmark className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{formatMoney(remainingBorrowCapacity)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Max Ceiling: {formatMoney(debtCeiling)}</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
            <span>Agency Liquid Balance</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">{formatMoney(agency.balance)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Available for debt settlement</div>
        </div>
      </div>

      {/* Active Loans Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-black text-white flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-indigo-400" />
          <span>Active Agency Credit Facilities ({activeLoans.length})</span>
        </h3>

        {activeLoans.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-slate-300 font-bold">Zero Outstanding Debt</p>
            <p className="text-slate-500 text-xs mt-1">Your agency is 100% debt-free with zero weekly interest burdens.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeLoans.map(loan => {
              const interest = Math.round(loan.remainingPrincipal * loan.weeklyInterestRate);
              const customAmount = customRepayAmount[loan.id] || loan.remainingPrincipal;
              const isOverdue = loan.weeksRemaining === 0 && loan.remainingPrincipal > 0;

              return (
                <div key={loan.id} className={`p-5 rounded-xl border ${isOverdue ? 'bg-red-950/20 border-red-500/50' : 'bg-slate-950/70 border-slate-800'} space-y-4`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-base">{loan.lenderName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-bold">{loan.lenderType}</span>
                        {isOverdue && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-black flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> MATURED / OVERDUE
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Borrowed Season {loan.dateBorrowedSeason}, Wk {loan.dateBorrowedWeek} • Collateral: <span className="text-slate-300">{loan.collateralAsset}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">Remaining Balance</div>
                      <div className="text-xl font-black text-red-400">{formatMoney(loan.remainingPrincipal)}</div>
                    </div>
                  </div>

                  {/* Progress & Stats Bar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                    <div>
                      <span className="text-slate-500">Weekly Interest:</span>
                      <span className="font-bold text-amber-400 ml-1.5">{formatMoney(interest)}/wk ({(loan.weeklyInterestRate * 100).toFixed(1)}%)</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Terms Left:</span>
                      <span className={`font-bold ml-1.5 ${loan.weeksRemaining <= 3 ? 'text-red-400' : 'text-slate-200'}`}>
                        {loan.weeksRemaining} / {loan.termWeeksTotal} Wks
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Principal Paid:</span>
                      <span className="font-bold text-emerald-400 ml-1.5">{formatMoney(loan.totalPaidSoFar)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Status:</span>
                      <span className="font-bold text-indigo-400 ml-1.5">{isOverdue ? 'Default Risk' : 'Active Good Standing'}</span>
                    </div>
                  </div>

                  {/* Repayment Controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Calculator className="w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        min={10000}
                        max={loan.remainingPrincipal}
                        step={100000}
                        value={customAmount}
                        onChange={(e) => setCustomRepayAmount({ ...customRepayAmount, [loan.id]: Number(e.target.value) })}
                        className="bg-slate-900 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg w-36 font-bold"
                        placeholder="Repayment amount"
                      />
                      <button
                        onClick={() => handleRepayLoan(loan.id, customAmount)}
                        disabled={agency.balance < customAmount || customAmount <= 0}
                        className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold px-3 py-2 rounded-lg transition cursor-pointer"
                      >
                        Repay {formatMoney(customAmount)}
                      </button>
                    </div>

                    <button
                      onClick={() => handleRepayLoan(loan.id, loan.remainingPrincipal)}
                      disabled={agency.balance < loan.remainingPrincipal}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-black px-4 py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-900/30"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Settle Full Loan ({formatMoney(loan.remainingPrincipal)})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Creditor Restructuring & Insolvency Tribunal (Bankruptcy Protection) */}
      <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/30 border border-red-500/30 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="text-base font-black text-white">Commercial Debt Restructuring &amp; Insolvency Tribunal</h3>
              <p className="text-xs text-slate-400">Emergency creditor arbitration &amp; sovereign financial stabilization mechanisms.</p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
            FIFA Insolvency Protocol
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Option 1: 40% Creditor Haircut Restructuring */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-xs text-amber-300">⚖️ Creditor Haircut (Chapter 11 Restructuring)</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enforce a legally binding 40% write-off on all outstanding bank loan principal.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                -40% Debt
              </span>
            </div>

            <div className="text-[10px] text-slate-400 space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <p>• <strong>Benefit:</strong> Reduces total debt by {formatMoney(Math.round(totalDebt * 0.4))}</p>
              <p>• <strong>Cost:</strong> -20 Agency Reputation &amp; Credit Rating set to Subprime</p>
            </div>

            <button
              onClick={() => {
                if (totalDebt <= 0) {
                  onShowToast('Your agency has no outstanding debts to restructure!', 'info');
                  return;
                }
                onUpdateAgency(prev => {
                  const currentLoans = prev.bankLoans || [];
                  const restructured = currentLoans.map(l => ({
                    ...l,
                    remainingPrincipal: Math.round(l.remainingPrincipal * 0.6),
                    weeklyInterestPayment: Math.round(l.remainingPrincipal * 0.6 * l.weeklyInterestRate)
                  }));
                  return {
                    ...prev,
                    bankLoans: restructured,
                    reputation: Math.max(10, prev.reputation - 20),
                    creditRating: 'Subprime'
                  };
                });
                onShowToast(`⚖️ Restructuring ratified! Creditors accepted a 40% haircut (${formatMoney(Math.round(totalDebt * 0.4))} written off).`, 'success');
              }}
              disabled={totalDebt <= 0}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-slate-950 font-black text-xs py-2.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
            >
              <span>Execute 40% Creditor Debt Write-Off</span>
            </button>
          </div>

          {/* Option 2: Sovereign Intermediary Stabilization Fund */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-xs text-emerald-300">🏛️ National Football Intermediary Bailout</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Claim emergency €5,000,000 liquidity subsidy from the national football governance board.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                +€5.0M Grant
              </span>
            </div>

            <div className="text-[10px] text-slate-400 space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <p>• <strong>Benefit:</strong> Instant €5,000,000 non-repayable cash infusion</p>
              <p>• <strong>Requirement:</strong> Liquid balance &lt; €2,000,000</p>
            </div>

            <button
              onClick={() => {
                if (agency.balance > 2000000) {
                  onShowToast('Bailout grant only accessible when agency balance is below €2,000,000!', 'error');
                  return;
                }
                onUpdateAgency(prev => ({
                  ...prev,
                  balance: prev.balance + 5000000,
                  reputation: Math.max(15, prev.reputation - 5)
                }));
                onShowToast('🏛️ Bailout approved! Received €5,000,000 emergency liquidity grant from Intermediary Fund.', 'success');
              }}
              disabled={agency.balance > 2000000}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-black text-xs py-2.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
            >
              <span>Apply for €5.0M Sovereign Bailout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Available Credit Facilities Catalog */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span>Available Institutional Credit Facilities</span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">Borrow instant liquidity for emergency transfer budget needs.</p>
          </div>

          {/* Destination Selector: Agency Balance vs Club Transfer Budget */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-bold px-2">Inject Funds Into:</span>
            <select
              value={injectToClubId}
              onChange={(e) => setInjectToClubId(e.target.value)}
              className="bg-slate-900 text-white font-bold px-2.5 py-1 rounded-lg border border-slate-700 outline-none cursor-pointer"
            >
              <option value="agency_treasury">💼 Agency Liquid Treasury</option>
              {clubs.filter(c => agency.clubShares?.some(s => s.clubId === c.id && s.sharePercent >= 50)).map(c => (
                <option key={c.id} value={c.id}>🏟️ {c.name} (Owned Club)</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loanOffers.map(offer => {
            const qualifies = isRatingEligible(offer.minCreditRating);
            const canBorrow = qualifies && offer.principalAmount <= remainingBorrowCapacity;
            const weeklyInterest = Math.round(offer.principalAmount * offer.weeklyInterestRate);

            return (
              <div key={offer.id} className={`bg-slate-950/80 border ${qualifies ? 'border-slate-800 hover:border-slate-700' : 'border-red-900/40 opacity-70'} rounded-xl p-5 flex flex-col justify-between transition`}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-black text-white text-base">{offer.lenderName}</span>
                      <div className="text-xs text-indigo-400 font-bold mt-0.5">{offer.lenderType}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-medium">Principal</span>
                      <div className="text-lg font-black text-emerald-400">{formatMoney(offer.principalAmount)}</div>
                    </div>
                  </div>

                  <p className="text-slate-400 text-xs leading-relaxed">{offer.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/70 p-3 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-slate-500">Weekly Rate:</span>
                      <span className="font-bold text-amber-400 ml-1">{(offer.weeklyInterestRate * 100).toFixed(1)}% ({formatMoney(weeklyInterest)}/wk)</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Term:</span>
                      <span className="font-bold text-white ml-1">{offer.termWeeks} Weeks</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Min Rating:</span>
                      <span className={`font-bold ml-1 ${qualifies ? 'text-emerald-400' : 'text-red-400'}`}>{offer.minCreditRating}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Collateral:</span>
                      <span className="font-bold text-slate-300 ml-1 truncate">{offer.collateralReq}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  {!qualifies ? (
                    <div className="text-xs text-red-400 font-bold flex items-center gap-1">
                      <ShieldAlert className="w-4 h-4" /> Requires {offer.minCreditRating} Credit Rating
                    </div>
                  ) : offer.principalAmount > remainingBorrowCapacity ? (
                    <div className="text-xs text-amber-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> Exceeds Borrowing Ceiling
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Instant Approval Verified
                    </div>
                  )}

                  <button
                    onClick={() => handleBorrowLoan(offer)}
                    disabled={!canBorrow}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-black px-4 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/50"
                  >
                    <span>Borrow {formatMoney(offer.principalAmount)}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
