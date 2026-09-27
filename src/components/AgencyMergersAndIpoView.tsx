import React, { useState } from 'react';
import { AgencyState, AcquiredBoutiqueAgency, AgencyIpoState, Player } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  Landmark,
  Coins,
  Activity
} from 'lucide-react';

interface AgencyMergersAndIpoViewProps {
  agency: AgencyState;
  players: Player[];
  onUpdateAgency: (updater: (prev: AgencyState) => AgencyState) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AgencyMergersAndIpoView: React.FC<AgencyMergersAndIpoViewProps> = ({
  agency,
  players,
  onUpdateAgency,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'ipo' | 'ma'>('ipo');
  const [selectedExchange, setSelectedExchange] = useState<AgencyIpoState['stockExchange']>('London Stock Exchange (LSE)');
  const [publicFloat, setPublicFloat] = useState<number>(30); // 30% public float

  // Pre-configured Boutique Rival Agencies for M&A
  const availableBoutiqueAgencies: AcquiredBoutiqueAgency[] = [
    {
      id: 'ma_nordic_prodigy',
      name: 'Nordic Prodigy Management',
      country: 'Denmark & Norway',
      flag: '🇩🇰',
      specialization: 'Scandinavia & Benelux U21 Wonderkids',
      acquisitionCost: 15000000,
      clientCount: 4,
      topClientPlayerIds: [],
      reputationBonus: 8,
      scoutCount: 2,
      owned: agency.acquiredAgencies?.some(a => a.id === 'ma_nordic_prodigy') || false
    },
    {
      id: 'ma_iberian_talents',
      name: 'Iberian Stars & Talents S.L.',
      country: 'Spain & Portugal',
      flag: '🇪🇸',
      specialization: 'La Liga & Primeira Liga Playmakers',
      acquisitionCost: 35000000,
      clientCount: 6,
      topClientPlayerIds: [],
      reputationBonus: 14,
      scoutCount: 3,
      owned: agency.acquiredAgencies?.some(a => a.id === 'ma_iberian_talents') || false
    },
    {
      id: 'ma_samba_agency',
      name: 'Samba Ouro Sports Agency',
      country: 'Brazil & Argentina',
      flag: '🇧🇷',
      specialization: 'South American Generational Dribblers',
      acquisitionCost: 50000000,
      clientCount: 8,
      topClientPlayerIds: [],
      reputationBonus: 20,
      scoutCount: 4,
      owned: agency.acquiredAgencies?.some(a => a.id === 'ma_samba_agency') || false
    }
  ];

  const ipoState = agency.ipoState;
  const isAlreadyPublic = ipoState?.isPublic || false;

  // Unified Enterprise Net Worth Breakdown
  const liquidBalance = agency.balance;
  const offshoreCash = agency.offshoreAccountBalance || 0;
  const realEstateTotal = (agency.realEstate?.filter(r => r.owned) || []).reduce((sum, r) => sum + (r.cost || 0), 0);
  const luxuryAssetsTotal = (agency.luxuryAssets?.filter(l => l.owned) || []).reduce((sum, l) => sum + (l.cost || 0), 0);
  const tycoonRealEstateValue = realEstateTotal + luxuryAssetsTotal;
  const myClients = players.filter(p => p.isMyClient);
  const clientPortfolioValue = myClients.reduce((sum, p) => sum + p.value, 0);
  const clientCommissionEquity = myClients.reduce((sum, p) => sum + Math.round(p.value * ((p.agentCommission || 10) / 100)), 0);
  const escrowReceivables = (agency.escrowDeals || []).filter(e => e.status === 'active').reduce((sum, e) => sum + (e.totalReceivableRemaining || 0), 0);
  const clubSharesValue = (agency.clubShares || []).reduce((sum, s) => sum + Math.round((s.investedAmount || 10000000) * (s.sharePercent / 100)), 0);
  const totalDebt = (agency.bankLoans || []).filter(l => l.remainingPrincipal > 0).reduce((sum, l) => sum + l.remainingPrincipal, 0);

  const totalEnterpriseNetWorth = Math.max(
    25000000,
    liquidBalance + offshoreCash + tycoonRealEstateValue + clientCommissionEquity + escrowReceivables + clubSharesValue - totalDebt
  );

  // Valuation for IPO based on comprehensive enterprise net worth and earnings
  const agencyValuation = Math.round(totalEnterpriseNetWorth * 1.25 + (agency.reputation * 1500000));
  const potentialCapitalRaise = Math.round(agencyValuation * (publicFloat / 100));

  // Launch IPO
  const handleLaunchIpo = () => {
    if (agency.reputation < 50) {
      onShowToast('IPO requires minimum 50 Agency Reputation!', 'error');
      return;
    }

    const ticker = agency.agencyName.replace(/[^A-Z]/gi, '').slice(0, 4).toUpperCase() || 'FCAG';
    const initialSharePrice = 25.00;
    const sharesOutstanding = Math.round(agencyValuation / initialSharePrice);

    const newIpo: AgencyIpoState = {
      isPublic: true,
      stockExchange: selectedExchange,
      tickerSymbol: ticker,
      sharePrice: initialSharePrice,
      sharesOutstanding,
      marketCap: agencyValuation,
      publicFloatPercent: publicFloat,
      capitalRaisedAtIpo: potentialCapitalRaise,
      weeklyStockPriceChangePercent: 0,
      quarterlyDividendsPaid: 0,
      quarterlyEarningsTarget: Math.round(potentialCapitalRaise * 0.1),
      shareholderConfidence: 85,
      historicalPrices: [
        { week: agency.currentWeek, season: agency.currentSeason, price: initialSharePrice }
      ]
    };

    onUpdateAgency(prev => ({
      ...prev,
      balance: prev.balance + potentialCapitalRaise,
      ipoState: newIpo
    }));

    onShowToast(`🎉 INITIAL PUBLIC OFFERING SUCCESS: ${agency.agencyName} ($${ticker}) floated on ${selectedExchange}, raising ${formatMoney(potentialCapitalRaise)}!`, 'success');
  };

  // Pay Quarterly Dividend
  const handlePayDividends = () => {
    if (!ipoState) return;
    const dividendAmount = Math.round(ipoState.marketCap * 0.02); // 2% dividend

    if (agency.balance < dividendAmount) {
      onShowToast(`Insufficient funds to pay ${formatMoney(dividendAmount)} in dividends!`, 'error');
      return;
    }

    onUpdateAgency(prev => {
      if (!prev.ipoState) return prev;
      return {
        ...prev,
        balance: prev.balance - dividendAmount,
        ipoState: {
          ...prev.ipoState,
          quarterlyDividendsPaid: prev.ipoState.quarterlyDividendsPaid + dividendAmount,
          shareholderConfidence: Math.min(100, prev.ipoState.shareholderConfidence + 12),
          sharePrice: Number((prev.ipoState.sharePrice * 1.06).toFixed(2)),
          activistInvestorWarning: false
        }
      };
    });

    onShowToast(`💰 Disbursed ${formatMoney(dividendAmount)} in shareholder dividends! Shareholder confidence surged!`, 'success');
  };

  // Execute Share Buyback Program (5% of market cap)
  const handleExecuteShareBuyback = () => {
    if (!ipoState) return;
    const buybackCost = Math.round(ipoState.marketCap * 0.05);

    if (agency.balance < buybackCost) {
      onShowToast(`Insufficient funds! Share buyback requires ${formatMoney(buybackCost)}.`, 'error');
      return;
    }

    onUpdateAgency(prev => {
      if (!prev.ipoState) return prev;
      const newPrice = Number((prev.ipoState.sharePrice * 1.10).toFixed(2));
      const newOutstanding = Math.round(prev.ipoState.sharesOutstanding * 0.95);
      const newMarketCap = Math.round(newPrice * newOutstanding);
      const newFloat = Math.max(10, prev.ipoState.publicFloatPercent - 3);

      return {
        ...prev,
        balance: prev.balance - buybackCost,
        ipoState: {
          ...prev.ipoState,
          sharePrice: newPrice,
          sharesOutstanding: newOutstanding,
          marketCap: newMarketCap,
          publicFloatPercent: newFloat,
          totalBuybacksExecuted: (prev.ipoState.totalBuybacksExecuted || 0) + buybackCost,
          shareholderConfidence: Math.min(100, prev.ipoState.shareholderConfidence + 15),
          activistInvestorWarning: false
        }
      };
    });

    onShowToast(`📈 SHARE BUYBACK EXECUTED: Bought back 5% of shares for ${formatMoney(buybackCost)}! EPS increased & share price jumped +10%!`, 'success');
  };

  // Execute Secondary Equity Capital Offering (+5% float)
  const handleSecondaryOffering = () => {
    if (!ipoState) return;
    const capitalRaised = Math.round(ipoState.marketCap * 0.06);

    onUpdateAgency(prev => {
      if (!prev.ipoState) return prev;
      const newPrice = Number((prev.ipoState.sharePrice * 0.96).toFixed(2)); // Minor 4% dilution
      const newOutstanding = Math.round(prev.ipoState.sharesOutstanding * 1.06);
      const newMarketCap = Math.round(newPrice * newOutstanding);
      const newFloat = Math.min(49, prev.ipoState.publicFloatPercent + 4);

      return {
        ...prev,
        balance: prev.balance + capitalRaised,
        ipoState: {
          ...prev.ipoState,
          sharePrice: newPrice,
          sharesOutstanding: newOutstanding,
          marketCap: newMarketCap,
          publicFloatPercent: newFloat,
          secondaryOfferingsRaised: (prev.ipoState.secondaryOfferingsRaised || 0) + capitalRaised,
          shareholderConfidence: Math.max(20, prev.ipoState.shareholderConfidence - 5)
        }
      };
    });

    onShowToast(`🏦 SECONDARY OFFERING COMPLETE: Issued secondary equity to institutional funds, raising ${formatMoney(capitalRaised)} cash!`, 'success');
  };

  // M&A Acquisition
  const handleAcquireBoutiqueAgency = (boutique: AcquiredBoutiqueAgency) => {
    if (agency.balance < boutique.acquisitionCost) {
      onShowToast(`Insufficient funds! Acquiring ${boutique.name} requires ${formatMoney(boutique.acquisitionCost)}.`, 'error');
      return;
    }

    const updatedBoutique = {
      ...boutique,
      owned: true,
      acquiredWeek: agency.currentWeek,
      acquiredSeason: agency.currentSeason
    };

    onUpdateAgency(prev => {
      const existing = prev.acquiredAgencies || [];
      return {
        ...prev,
        balance: prev.balance - boutique.acquisitionCost,
        reputation: Math.min(99, prev.reputation + boutique.reputationBonus),
        acquiredAgencies: [...existing, updatedBoutique]
      };
    });

    onShowToast(`🤝 M&A MERGER COMPLETE: Successfully acquired ${boutique.name}! Gained +${boutique.reputationBonus} Agency Reputation!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Landmark className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-black text-white tracking-tight">Stock Market IPO & Agency M&A Mergers</h2>
            </div>
            <p className="text-slate-400 text-sm max-w-xl">
              Float your sports agency on the world's premier stock exchanges to raise institutional equity capital, or acquire boutique regional agencies to monopolize wonderkid territories.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('ipo')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ipo'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Stock Exchange IPO</span>
            </button>
            <button
              onClick={() => setActiveTab('ma')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ma'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Boutique Agency M&A</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'ipo' ? (
        <div className="space-y-6">
          {isAlreadyPublic && ipoState ? (
            /* Public Listed Agency Dashboard */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                    <span>Ticker & Exchange</span>
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white mt-1">${ipoState.tickerSymbol}</div>
                  <div className="text-[11px] text-slate-500 mt-1 truncate">{ipoState.stockExchange}</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                    <span>Share Price</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">€{ipoState.sharePrice.toFixed(2)}</div>
                  <div className={`text-[11px] font-bold mt-1 ${ipoState.weeklyStockPriceChangePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {ipoState.weeklyStockPriceChangePercent >= 0 ? `+${ipoState.weeklyStockPriceChangePercent}%` : `${ipoState.weeklyStockPriceChangePercent}%`} this week
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                    <span>Market Capitalization</span>
                    <DollarSign className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black text-indigo-400 mt-1">{formatMoney(ipoState.marketCap)}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{ipoState.publicFloatPercent}% Public Float</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                    <span>Shareholder Confidence</span>
                    <PieChart className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-amber-400 mt-1">{ipoState.shareholderConfidence}%</div>
                  <div className="text-[11px] text-slate-500 mt-1">Wall Street Sentiment: High</div>
                </div>
              </div>

              {/* Activist Investor Alert if confidence < 45 */}
              {(ipoState.shareholderConfidence < 45 || ipoState.activistInvestorWarning) && (
                <div className="p-4 rounded-2xl bg-red-950/80 border-2 border-red-500/60 flex items-center justify-between gap-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-black">
                      ⚠️
                    </div>
                    <div>
                      <h4 className="font-bold text-red-200 text-sm">Activist Hedge Fund Boardroom Pressure</h4>
                      <p className="text-xs text-red-300/80">
                        Shareholder confidence is critically low ({ipoState.shareholderConfidence}%). Disburse dividends or launch a share buyback program to prevent proxy battles!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Capital Actions: Dividends, Buybacks & Secondary Offerings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Quarterly Dividends */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <Coins className="w-4 h-4" />
                      <span>Quarterly Dividends</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1">
                      Distribute 2% of market cap to institutional stockholders to boost public sentiment.
                    </p>
                    <p className="text-xs font-mono font-bold text-slate-300 mt-2">
                      Cost: {formatMoney(ipoState.marketCap * 0.02)}
                    </p>
                  </div>

                  <button
                    onClick={handlePayDividends}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Disburse 2% Dividend</span>
                  </button>
                </div>

                {/* Share Buyback Program */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                      <Sparkles className="w-4 h-4" />
                      <span>Share Buyback Program</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1">
                      Repurchase 5% of shares from public float with agency cash to boost EPS and jump share price by +10%.
                    </p>
                    <p className="text-xs font-mono font-bold text-slate-300 mt-2">
                      Cost: {formatMoney(ipoState.marketCap * 0.05)}
                    </p>
                  </div>

                  <button
                    onClick={handleExecuteShareBuyback}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Execute 5% Buyback</span>
                  </button>
                </div>

                {/* Secondary Equity Offering */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <DollarSign className="w-4 h-4" />
                      <span>Secondary Capital Offering</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1">
                      Sell new shares (+4% float) to institutional hedge funds for an immediate, non-debt cash injection.
                    </p>
                    <p className="text-xs font-mono font-bold text-emerald-400 mt-2">
                      Instant Cash: +{formatMoney(ipoState.marketCap * 0.06)}
                    </p>
                  </div>

                  <button
                    onClick={handleSecondaryOffering}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-black py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Raise +{formatMoney(ipoState.marketCap * 0.06)}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* IPO Launch Terminal */
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-emerald-400" />
                  <span>Public Offering Underwriting Terminal</span>
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Structure your initial public offering. Sell equity shares to raise massive upfront growth capital.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-bold">Comprehensive Enterprise Valuation</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{formatMoney(agencyValuation)}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Based on full balance sheet equity</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-bold">Public Equity Float</span>
                  <div className="text-2xl font-black text-white mt-1">{publicFloat}%</div>
                  <input
                    type="range"
                    min={15}
                    max={49}
                    value={publicFloat}
                    onChange={(e) => setPublicFloat(Number(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-bold">Upfront Capital Raised</span>
                  <div className="text-2xl font-black text-amber-400 mt-1">{formatMoney(potentialCapitalRaise)}</div>
                  <div className="text-[11px] text-emerald-400 font-bold mt-1">Instant Cash Injection</div>
                </div>
              </div>

              {/* Comprehensive Enterprise Asset Ledger */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Audited Enterprise Balance Sheet & Assets</span>
                  <span className="text-emerald-400">Total Net Equity: {formatMoney(totalEnterpriseNetWorth)}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[11px]">Liquid Cash</span>
                    <div className="font-bold text-white mt-0.5">{formatMoney(liquidBalance)}</div>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[11px]">Offshore Shelters</span>
                    <div className="font-bold text-amber-400 mt-0.5">{formatMoney(offshoreCash)}</div>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[11px]">Tycoon Real Estate</span>
                    <div className="font-bold text-blue-400 mt-0.5">{formatMoney(tycoonRealEstateValue)}</div>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[11px]">Client Equity</span>
                    <div className="font-bold text-emerald-400 mt-0.5">{formatMoney(clientCommissionEquity)}</div>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[11px]">Escrow Receivables</span>
                    <div className="font-bold text-purple-400 mt-0.5">{formatMoney(escrowReceivables)}</div>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[11px]">Active Debt</span>
                    <div className="font-bold text-red-400 mt-0.5">-{formatMoney(totalDebt)}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-slate-400 font-bold">Select Listing Stock Exchange:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {(['London Stock Exchange (LSE)', 'New York Stock Exchange (NYSE)', 'Frankfurt DAX'] as const).map(ex => (
                    <div
                      key={ex}
                      onClick={() => setSelectedExchange(ex)}
                      className={`p-3 rounded-xl border cursor-pointer transition ${selectedExchange === ex ? 'bg-emerald-950/40 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                    >
                      <div className="font-black text-sm">{ex}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Tier 1 Sovereign Liquidity</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Min Requirement: <strong className="text-white">50 Reputation</strong> • Current: <strong className="text-emerald-400">{agency.reputation}</strong>
                </div>

                <button
                  onClick={handleLaunchIpo}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-6 py-3 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Public IPO ({formatMoney(potentialCapitalRaise)})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Boutique Agency M&A Hub */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availableBoutiqueAgencies.map(boutique => {
              const isOwned = boutique.owned;
              const canAfford = agency.balance >= boutique.acquisitionCost;

              return (
                <div key={boutique.id} className={`bg-slate-900/90 border ${isOwned ? 'border-emerald-500/60 bg-emerald-950/20' : 'border-slate-800 hover:border-slate-700'} rounded-2xl p-5 flex flex-col justify-between space-y-4 transition`}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{boutique.flag}</span>
                          <span className="font-black text-white text-base">{boutique.name}</span>
                        </div>
                        <div className="text-xs text-indigo-400 font-bold mt-0.5">{boutique.country}</div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Valuation</span>
                        <div className="text-base font-black text-emerald-400">{formatMoney(boutique.acquisitionCost)}</div>
                      </div>
                    </div>

                    <p className="text-slate-400 text-xs leading-relaxed">{boutique.specialization}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <div>
                        <span className="text-slate-500">Client Roster:</span>
                        <span className="font-bold text-white ml-1">{boutique.clientCount} Pros</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Reputation Boost:</span>
                        <span className="font-bold text-amber-400 ml-1">+{boutique.reputationBonus}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Regional Scouts:</span>
                        <span className="font-bold text-indigo-300 ml-1">+{boutique.scoutCount} Staff</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Territory:</span>
                        <span className="font-bold text-emerald-400 ml-1">Dominant</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    {isOwned ? (
                      <div className="text-xs text-emerald-400 font-black flex items-center justify-center gap-1.5 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                        <CheckCircle2 className="w-4 h-4" /> Fully Absorbed Subsidiary
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAcquireBoutiqueAgency(boutique)}
                        disabled={!canAfford}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-black py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-950/40"
                      >
                        <Building2 className="w-4 h-4" />
                        <span>Acquire Agency ({formatMoney(boutique.acquisitionCost)})</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
