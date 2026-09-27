import React, { useState } from 'react';
import { AgencyState, Player, Club } from '../types';
import { formatMoney, calculateWeeklyFinances, getReputationBadge } from '../utils/gameEngine';
import { soundEngine } from '../utils/soundEffects';
import { AgencyDebtManager } from './AgencyDebtManager';
import { AgencyMergersAndIpoView } from './AgencyMergersAndIpoView';
import { 
  TrendingUp, 
  DollarSign, 
  PieChart as PieIcon, 
  ShieldCheck, 
  Building2, 
  Zap, 
  Landmark, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Trophy,
  Award,
  ChevronRight,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Calendar,
  Layers,
  Coins
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';

interface FinancialAnalyticsViewProps {
  agency: AgencyState;
  players?: Player[];
  clubs?: Club[];
  onUpdateAgency: (agency: AgencyState) => void;
  onUpdateClub?: (club: Club) => void;
  onOpenTab?: (tab: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const FinancialAnalyticsView: React.FC<FinancialAnalyticsViewProps> = ({ 
  agency, 
  players = [], 
  clubs = [],
  onUpdateAgency, 
  onUpdateClub,
  onOpenTab,
  onShowToast = (_msg?: string, _t?: string) => {}
}) => {
  const [subTab, setSubTab] = useState<'analytics' | 'escrow' | 'debt' | 'ipo'>('analytics');
  const myClients = players.filter(p => p.isMyClient);
  const finances = calculateWeeklyFinances(agency, players);
  const repBadge = getReputationBadge(agency.reputation);
  const rawHistory = (agency && Array.isArray(agency.financialHistory) && agency.financialHistory.length > 0)
    ? agency.financialHistory
    : [{ week: agency?.currentWeek || 1, season: agency?.currentSeason || 2026, income: 0, expense: 0, net: 0, balance: agency?.balance || 25000000 }];

  const historyData = rawHistory.map(h => ({
    name: `W${h.week || 1} '26`,
    Balance: (h.balance || 0) / 1000000,
    Income: (h.income || 0) / 1000000,
    Expense: (h.expense || 0) / 1000000,
    Net: (h.net || 0) / 1000000
  }));

  const activeEscrowDeals = agency.escrowDeals || [];
  const totalEscrowReceivables = activeEscrowDeals.reduce((sum, d) => sum + (d.totalReceivableRemaining || 0), 0);

  // Transfer funds to offshore tax shelter account
  const handleDepositOffshore = (amount: number) => {
    if (agency.balance < amount) {
      onShowToast('Insufficient liquid agency capital!', 'error');
      return;
    }

    if (agency.soundEnabled) soundEngine.playCashSound();

    onUpdateAgency({
      ...agency,
      balance: agency.balance - amount,
      offshoreAccountBalance: (agency.offshoreAccountBalance || 0) + amount
    });
    onShowToast(`💰 Deposited ${formatMoney(amount)} into Cayman Islands offshore shelter!`, 'success');
  };

  // Withdraw funds from offshore tax shelter account
  const handleWithdrawOffshore = (amount: number) => {
    if ((agency.offshoreAccountBalance || 0) < amount) {
      onShowToast('Insufficient funds in offshore tax shelter!', 'error');
      return;
    }

    if (agency.soundEnabled) soundEngine.playCashSound();

    onUpdateAgency({
      ...agency,
      balance: agency.balance + amount,
      offshoreAccountBalance: (agency.offshoreAccountBalance || 0) - amount
    });
    onShowToast(`💰 Withdrew ${formatMoney(amount)} from offshore shelter to liquid balance!`, 'success');
  };

  const taxLevel = agency.staff?.taxAdvisorLevel || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Sub-Tab Navigation Switcher */}
      <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <button
          onClick={() => setSubTab('analytics')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
            subTab === 'analytics'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Financial Analytics & Taxes</span>
        </button>

        <button
          onClick={() => setSubTab('escrow')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
            subTab === 'escrow'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Escrow & Deferred Liquidity {activeEscrowDeals.length > 0 ? `(${activeEscrowDeals.filter(d => d.status === 'active').length})` : ''}</span>
        </button>

        <button
          onClick={() => setSubTab('debt')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
            subTab === 'debt'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Bank Loans & Debt Facilities {agency.bankLoans && agency.bankLoans.length > 0 ? `(${agency.bankLoans.length})` : ''}</span>
        </button>

        <button
          onClick={() => setSubTab('ipo')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
            subTab === 'ipo'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Stock Market IPO & Agency M&A {agency.ipoState?.isPublic ? '📈' : ''}</span>
        </button>
      </div>

      {subTab === 'debt' ? (
        <AgencyDebtManager
          agency={agency}
          clubs={clubs}
          onUpdateAgency={(updater) => onUpdateAgency(updater(agency))}
          onUpdateClub={onUpdateClub}
          onShowToast={onShowToast}
        />
      ) : subTab === 'ipo' ? (
        <AgencyMergersAndIpoView
          agency={agency}
          players={players}
          onUpdateAgency={(updater) => onUpdateAgency(updater(agency))}
          onShowToast={onShowToast}
        />
      ) : subTab === 'escrow' ? (
        <div className="space-y-6">
          {/* Escrow Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border-2 border-sky-500/40 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="w-6 h-6 text-sky-400" />
                <span>Mega-Transfer Escrow & Deferred Liquidity Vault</span>
              </h2>
              <p className="text-xs text-sky-200/80 mt-1 max-w-2xl">
                Structured installment schedules, milestone contingency tranches (e.g. appearances & trophies), and long-term liquidity receivables for transfers exceeding €50M.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Total Receivables In Escrow</p>
                <p className="text-base font-black text-sky-400">{formatMoney(totalEscrowReceivables)}</p>
              </div>

              <div className="bg-emerald-950/60 border border-emerald-500/40 px-4 py-2 rounded-xl text-right">
                <p className="text-[10px] text-emerald-300 uppercase font-bold">Active Mega-Deals</p>
                <p className="text-base font-black text-emerald-400">{activeEscrowDeals.filter(d => d.status === 'active').length} Structured</p>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Liquidity Timing Strategy</span>
              <p className="text-sm font-bold text-slate-200">Staggered Multi-Window Cash Flow</p>
              <p className="text-[11px] text-slate-400">Protects agency from sudden off-season cash dry-spells by distributing commission across future matchweeks.</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Appearance Milestone Security</span>
              <p className="text-sm font-bold text-amber-300">Automated Performance Trigger</p>
              <p className="text-[11px] text-slate-400">Once your client reaches 15 appearances at their new club, contingent escrow bonus is instantly credited.</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Default Protection</span>
              <p className="text-sm font-bold text-emerald-400">100% Guaranteed by Federation Clearinghouse</p>
              <p className="text-[11px] text-slate-400">All escrow accounts are legally safeguarded by the Continental League Banking Association.</p>
            </div>
          </div>

          {/* Escrow Deals List */}
          {activeEscrowDeals.length === 0 ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">No Mega-Transfer Escrow Accounts Active</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                When you negotiate a blockbuster player transfer exceeding €50,000,000, payments are automatically structured into guaranteed deferred installment tranches and milestone incentives.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeEscrowDeals.map((deal) => (
                <div key={deal.id} className="bg-slate-900 border border-slate-800 hover:border-sky-500/40 transition rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-xl">
                        {deal.playerAvatarEmoji || '⚽'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{deal.playerName}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            deal.status === 'fully_settled' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          }`}>
                            {deal.status === 'fully_settled' ? 'Fully Disbursed' : 'Active Escrow Plan'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {deal.sellingClubName} ➔ <strong className="text-slate-200">{deal.buyingClubName}</strong> • Total Fee: <strong className="text-emerald-400">{formatMoney(deal.totalFee)}</strong> ({deal.commissionPercent}% Cut)
                        </p>
                      </div>
                    </div>

                    <div className="text-right sm:self-auto self-start">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Remaining Pending Receivables</span>
                      <span className="text-base font-black text-sky-400">{formatMoney(deal.totalReceivableRemaining)}</span>
                    </div>
                  </div>

                  {/* Tranches Table / Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    {deal.tranches.map((tranche) => (
                      <div
                        key={tranche.id}
                        className={`p-3.5 rounded-xl border transition ${
                          tranche.status === 'disbursed'
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                            : 'bg-slate-950/80 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Tranche #{tranche.trancheNumber}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            tranche.status === 'disbursed' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {tranche.status === 'disbursed' ? 'Disbursed' : 'Pending'}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-white truncate">{tranche.label}</p>
                        <p className="text-xs font-black text-emerald-400 mt-1">
                          Agency Cut: {formatMoney(tranche.agentCut)} <span className="text-[10px] font-normal text-slate-400">({formatMoney(tranche.amount)} gross)</span>
                        </p>

                        <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5 space-y-0.5">
                          {tranche.conditionType === 'scheduled_installment' ? (
                            <p className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-sky-400" />
                              <span>Maturity: <strong>Week {tranche.dueWeek} (Season {tranche.dueSeason})</strong></span>
                            </p>
                          ) : (
                            <p className="flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-amber-400" />
                              <span>Condition: <strong>15 Appearances ({tranche.currentProgress || 0}/15)</strong></span>
                            </p>
                          )}
                          <p className="text-[10px] text-slate-500 leading-tight">{tranche.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/40 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                <span>Executive Financial Analytics & Tax Optimization</span>
              </h2>
              <p className="text-xs text-indigo-200/80 mt-1 max-w-2xl">
                Real-time financial breakdown, revenue commission trajectory, asset cash flows, and Cayman Islands offshore tax shelter management.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Liquid Balance</p>
                <p className="text-base font-black text-emerald-400">{formatMoney(agency.balance)}</p>
              </div>

              <div className="bg-amber-950/60 border border-amber-500/40 px-4 py-2 rounded-xl text-right">
                <p className="text-[10px] text-amber-300 uppercase font-bold">Offshore Tax Shelter</p>
                <p className="text-base font-black text-amber-400">{formatMoney(agency.offshoreAccountBalance || 0)}</p>
              </div>
            </div>
          </div>

          {/* Executive Financial KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Weekly Finances Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Weekly Net Income</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3">
                <p className={`text-2xl font-black ${finances.netWeekly >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {finances.netWeekly >= 0 ? '+' : ''}{formatMoney(finances.netWeekly)} /wk
                </p>
                <div className="mt-2 text-xs text-slate-400 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Commissions:</span>
                    <span className="text-slate-200 font-semibold">{formatMoney(finances.clientCommissions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Real Estate:</span>
                    <span className="text-slate-200 font-semibold">{formatMoney(finances.realEstateIncome)}</span>
                  </div>
                  {finances.loanInterestExpense > 0 && (
                    <div className="flex justify-between text-amber-400">
                      <span>Loan Interest:</span>
                      <span>-{formatMoney(finances.loanInterestExpense)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-red-400/80">
                    <span>Total Expenses:</span>
                    <span>-{formatMoney(finances.totalExpense)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Agency Value */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Portfolio Market Value</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3">
                <p className="text-2xl font-black text-slate-100">
                  {formatMoney(myClients.reduce((sum, p) => sum + p.value, 0))}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Managing <strong className="text-blue-400">{myClients.length} professional clients</strong> across top world leagues.
                </p>
              </div>
            </div>

            {/* Reputation Level Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agent Reputation</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <Award className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-purple-300">{agency.reputation} / 100</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${repBadge.color}`}>
                    {repBadge.title}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-indigo-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${agency.reputation}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Agency Empire Office HQ */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agency Office HQ</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3">
                <p className="text-lg font-black text-amber-300">
                  {agency.officeLevel === 1 && 'Level 1: Local Office'}
                  {agency.officeLevel === 2 && 'Level 2: City Business Center'}
                  {agency.officeLevel === 3 && 'Level 3: Glass Tower Suite'}
                  {agency.officeLevel === 4 && 'Level 4: Luxury Skyscraper'}
                  {agency.officeLevel === 5 && 'Level 5: Global Godfather HQ'}
                </p>
                {onOpenTab && (
                  <button
                    onClick={() => onOpenTab('tycoon')}
                    className="mt-3 text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 group cursor-pointer"
                  >
                    <span>Upgrade Agency HQ</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Balance Growth Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Agency Balance & Revenue Growth (€ Millions)</span>
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">Live Feed</span>
              </div>

              <div className="h-64 w-full pt-4 min-h-[240px]">
                <ResponsiveContainer width="100%" height={220} minWidth={100} minHeight={200}>
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} 
                      formatter={(val: any) => [`€${(Number(val) || 0).toFixed(2)}M`, 'Value']}
                    />
                    <Line type="monotone" dataKey="Balance" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981' }} />
                    <Line type="monotone" dataKey="Income" stroke="#6366f1" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Net Cashflow Bar Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-indigo-400" />
                  <span>Weekly Income vs Expenses Comparison (€ Millions)</span>
                </h3>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-bold">Weekly Audit</span>
              </div>

              <div className="h-64 w-full pt-4 min-h-[240px]">
                <ResponsiveContainer width="100%" height={220} minWidth={100} minHeight={200}>
                  <BarChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} 
                      formatter={(val: any) => [`€${(Number(val) || 0).toFixed(2)}M`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                    <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Progressive Corporate Tax & Legal Deductions Audit Panel */}
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Progressive Corporate Tax & Legal Deductions Audit</h3>
                  <p className="text-xs text-slate-400">
                    Graduated corporate income tax on agency profits, optimized through certified tax structuring, legal offshore schemes, and real estate depreciation.
                  </p>
                </div>
              </div>

              <div className="bg-slate-800 px-4 py-2 rounded-xl text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Total Legal Write-Off</p>
                <p className="text-sm font-bold text-emerald-400">
                  -{finances.totalDeductionPercent || 0}% Tax Reduction
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-bold block">Gross Unadjusted Tax:</span>
                <span className="text-base font-black text-red-400">{formatMoney(finances.unadjustedTax || 0)} /wk</span>
                <span className="text-[10px] text-slate-500 block mt-1">Based on weekly gross profits</span>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-bold block">Tax Advisor Deduction:</span>
                <span className="text-base font-black text-emerald-400">
                  {agency.staff.taxAdvisorLevel ? `Lvl ${agency.staff.taxAdvisorLevel} (-${agency.staff.taxAdvisorLevel * 12}%)` : 'None (0%)'}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Certified accounting strategy</span>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-bold block">Offshore Legal & Real Estate:</span>
                <span className="text-base font-black text-indigo-400">
                  -{((agency.staff.lawyerLevel || 0) * 5) + Math.min(10, agency.realEstate.filter(r => r.owned).length * 2)}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Depreciation & legal structuring</span>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/30">
                <span className="text-emerald-400 font-bold block">Net Corporate Tax Remitted:</span>
                <span className="text-base font-black text-emerald-300">-{formatMoney(finances.corporateTax || 0)} /wk</span>
                <span className="text-[10px] text-emerald-500 font-bold block mt-1">Saved {formatMoney(finances.taxSavingsTotal || 0)}/wk legally</span>
              </div>
            </div>
          </div>

          {/* Offshore Tax Shelter Operations Panel */}
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Cayman Islands Offshore Shell Banking</h3>
                  <p className="text-xs text-slate-400">
                    Shield transfer commissions from European tax authorities. Offshore capital generates 5% annual interest tax-free!
                  </p>
                </div>
              </div>

              <div className="bg-slate-800 px-4 py-2 rounded-xl text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Tax Savings Level</p>
                <p className="text-sm font-bold text-amber-300">
                  Tax Advisor Lvl {taxLevel} ({taxLevel * 10}% Tax Exemption)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Deposit Actions */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
                <p className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  <span>Deposit Capital Offshore:</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {[500000, 1000000, 5000000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleDepositOffshore(amt)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition cursor-pointer min-h-[44px]"
                    >
                      +{formatMoney(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Withdraw Actions */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
                <p className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-amber-400" />
                  <span>Withdraw to Liquid Agency Balance:</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {[500000, 1000000, 5000000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleWithdrawOffshore(amt)}
                      className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition cursor-pointer min-h-[44px]"
                    >
                      -{formatMoney(amt)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

