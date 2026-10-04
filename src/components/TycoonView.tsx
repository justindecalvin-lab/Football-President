import React, { useState } from 'react';
import { AgencyState, Club, RealEstate, LuxuryAsset, ClubShare } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { soundEngine } from '../utils/soundEffects';
import { ClubShareElectionModal } from './ClubShareElectionModal';
import { 
  Building2, 
  Crown, 
  Car, 
  Ship, 
  Plane, 
  Home, 
  TrendingUp, 
  ShieldCheck, 
  Briefcase, 
  Zap, 
  Award,
  Check,
  Vote,
  ShieldAlert,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface TycoonViewProps {
  agency: AgencyState;
  clubs: Club[];
  onUpdateAgency: (agency: AgencyState) => void;
  onOpenTab?: (tab: string) => void;
  addToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const TycoonView: React.FC<TycoonViewProps> = ({
  agency,
  clubs,
  onUpdateAgency,
  onOpenTab,
  addToast
}) => {
  const [electionTarget, setElectionTarget] = useState<{ club: Club; share: ClubShare } | null>(null);

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (addToast) addToast(msg, type);
  };

  // Upgrade Office HQ Level
  const handleUpgradeOffice = () => {
    const nextLevel = agency.officeLevel + 1;
    if (nextLevel > 5) return;

    const costs = [0, 500000, 2500000, 10000000, 50000000];
    const cost = costs[agency.officeLevel];

    if (agency.balance < cost) {
      notify(`Need ${formatMoney(cost)} to upgrade HQ to Level ${nextLevel}!`, 'error');
      return;
    }

    soundEngine.playSuccess();
    onUpdateAgency({
      ...agency,
      balance: agency.balance - cost,
      officeLevel: nextLevel,
      reputation: Math.min(100, agency.reputation + 5)
    });
    notify(`Headquarters upgraded to Level ${nextLevel}! (+5 Reputation)`, 'success');
  };

  // Buy Real Estate
  const handleBuyRealEstate = (reId: string) => {
    const re = agency.realEstate.find(r => r.id === reId);
    if (!re || re.owned) return;

    if (agency.balance < re.cost) {
      notify(`Need ${formatMoney(re.cost)} capital to purchase ${re.name}!`, 'error');
      return;
    }

    soundEngine.playCashSound();
    const updated = agency.realEstate.map(r => r.id === reId ? { ...r, owned: true } : r);
    onUpdateAgency({
      ...agency,
      balance: agency.balance - re.cost,
      realEstate: updated
    });
    notify(`Acquired commercial property: ${re.name}!`, 'success');
  };

  // Buy Luxury Asset
  const handleBuyLuxury = (assetId: string) => {
    const asset = agency.luxuryAssets.find(l => l.id === assetId);
    if (!asset || asset.owned) return;

    if (agency.balance < asset.cost) {
      notify(`Need ${formatMoney(asset.cost)} capital to buy ${asset.name}!`, 'error');
      return;
    }

    soundEngine.playCashSound();
    const updated = agency.luxuryAssets.map(l => l.id === assetId ? { ...l, owned: true } : l);
    onUpdateAgency({
      ...agency,
      balance: agency.balance - asset.cost,
      luxuryAssets: updated,
      reputation: Math.min(100, agency.reputation + asset.prestige)
    });
    notify(`Purchased luxury asset: ${asset.name}! (+${asset.prestige} Prestige)`, 'success');
  };

  // Buy Club Shares (>50% Automatically Becomes President, <50% can run election)
  const handleBuyClubShares = (clubId: string) => {
    const club = clubs.find(c => c.id === clubId);
    if (!club) return;

    const shareCost = Math.round(club.reputation * 350000); // e.g. €28M - €35M for 20%
    if (agency.balance < shareCost) {
      notify(`Need ${formatMoney(shareCost)} to acquire 20% equity in ${club.name}!`, 'error');
      return;
    }

    soundEngine.playCashSound();
    const existing = agency.clubShares.find(s => s.clubId === clubId);
    const currentShare = existing?.sharePercent || 0;
    const newShare = Math.min(100, currentShare + 20);

    const isNowMajority = newShare > 50;

    const updatedShares = agency.clubShares.filter(s => s.clubId !== clubId);
    updatedShares.push({ 
      clubId, 
      clubName: club.name,
      sharePercent: newShare, 
      investedAmount: (existing?.investedAmount || 0) + shareCost,
      lastElectionWeek: existing?.lastElectionWeek,
      lastElectionSeason: existing?.lastElectionSeason,
      lastElectionWon: existing?.lastElectionWon
    });

    let updatedAgency: AgencyState = {
      ...agency,
      balance: agency.balance - shareCost,
      clubShares: updatedShares
    };

    if (isNowMajority) {
      soundEngine.playSuccess();
      updatedAgency = {
        ...updatedAgency,
        activeRoles: {
          agent: false,
          club_owner: true,
          fa_president: false,
          currentRole: 'club_owner',
          presidentClubId: club.id,
          presidentClubName: club.name
        },
        presidency: {
          ...agency.presidency,
          role: 'Club President',
          clubId: club.id
        },
        milestones: [
          ...agency.milestones,
          {
            id: `milestone_majority_buyout_${Date.now()}`,
            week: agency.currentWeek,
            season: agency.currentSeason,
            title: `MAJORITY TAKEOVER: ${club.name}`,
            description: `Acquired ${newShare}% majority equity stake in ${club.name}. Automatically assumed the Club Presidency & Boardroom control!`,
            type: 'milestone',
            impact: `President & Majority Owner of ${club.name}`
          }
        ]
      };

      if (addToast) {
        addToast(`👑 MAJORITY TAKEOVER! You now own ${newShare}% of ${club.name} and have assumed the Club Presidency!`, 'success');
      }
    } else {
      if (addToast) {
        addToast(`💼 Acquired +20% equity in ${club.name} (Total: ${newShare}%). You can now launch a proxy election or acquire more shares!`, 'info');
      }
    }

    onUpdateAgency(updatedAgency);
  };

  const handleOpenElectionModal = (club: Club) => {
    const share = agency.clubShares.find(s => s.clubId === club.id);
    if (!share) return;
    setElectionTarget({ club, share });
  };

  return (
    <div className="space-y-8">
      {/* Election Modal */}
      {electionTarget && (
        <ClubShareElectionModal
          club={electionTarget.club}
          share={electionTarget.share}
          agency={agency}
          onClose={() => setElectionTarget(null)}
          onElectionResult={(won, updatedAgency) => {
            onUpdateAgency(updatedAgency);
            if (won && onOpenTab) {
              setTimeout(() => {
                onOpenTab('club_president');
              }, 600);
            }
          }}
          addToast={addToast}
        />
      )}

      {/* Tycoon Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-400" />
            <span>Agency Empire &amp; Tycoon Assets</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Build a mega-empire: upgrade your Agency HQ, acquire luxury assets, invest in commercial real estate, and buy controlling stakes in football clubs.
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-300">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Status: {agency.presidency.role === 'Club President' ? 'Club President Owner' : 'Empire Architect'}</span>
        </div>
      </div>

      {/* HQ Upgrade Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Agency Headquarters Upgrade</h3>
          </div>
          <span className="text-xs text-amber-300 font-extrabold bg-amber-500/20 px-2.5 py-0.5 rounded border border-amber-500/30">
            Level {agency.officeLevel} / 5
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          {[
            { lvl: 1, name: 'Local Flat', cost: 0, rep: '+0 Rep' },
            { lvl: 2, name: 'City Business Suite', cost: 500000, rep: '+5 Rep' },
            { lvl: 3, name: 'Glass Skyscraper', cost: 2500000, rep: '+10 Rep' },
            { lvl: 4, name: 'Luxury Skyscraper Penthouse', cost: 10000000, rep: '+15 Rep' },
            { lvl: 5, name: 'Godfather Global HQ', cost: 50000000, rep: '+25 Rep' },
          ].map((item) => (
            <div
              key={item.lvl}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 ${
                agency.officeLevel >= item.lvl
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
              }`}
            >
              <div>
                <p className="font-bold text-sm text-slate-100">{item.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{item.rep}</p>
              </div>

              {agency.officeLevel >= item.lvl ? (
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Unlocked
                </span>
              ) : (
                <p className="font-bold text-amber-300">{formatMoney(item.cost)}</p>
              )}
            </div>
          ))}
        </div>

        {agency.officeLevel < 5 && (
          <button
            onClick={handleUpgradeOffice}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-lg active:scale-95"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Upgrade HQ to Level {agency.officeLevel + 1}</span>
          </button>
        )}
      </div>

      {/* Real Estate Portfolio */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Home className="w-5 h-5 text-emerald-400" />
            <span>Commercial Real Estate Portfolio</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Acquire prime commercial real estate in global capital cities to generate weekly passive rental yield into your agency treasury.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agency.realEstate.map((re) => (
            <div
              key={re.id}
              className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">{re.name}</h4>
                  <p className="text-xs text-slate-400">{re.type} Property</p>
                </div>
                {re.owned ? (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                    OWNED
                  </span>
                ) : (
                  <span className="text-emerald-300 font-bold text-xs">{formatMoney(re.cost)}</span>
                )}
              </div>

              <div className="text-xs text-slate-300">
                <p>Weekly Income Yield: <strong className="text-emerald-400">{formatMoney(re.weeklyIncome)}/wk</strong></p>
              </div>

              {!re.owned && (
                <button
                  onClick={() => handleBuyRealEstate(re.id)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs cursor-pointer transition shadow-md"
                >
                  Acquire Property
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Luxury Assets & Prestige */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Car className="w-5 h-5 text-purple-400" />
            <span>High-End Luxury &amp; Executive Prestige</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Collect elite supercars, private Gulfstream jets, and Mediterranean superyachts to maximize your prestige when meeting world-class club directors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agency.luxuryAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">{asset.name}</h4>
                  <p className="text-xs text-slate-400">{asset.type} • +{asset.prestige} Prestige Rep</p>
                </div>
                {asset.owned ? (
                  <span className="bg-purple-500/20 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/30">
                    OWNED
                  </span>
                ) : (
                  <span className="text-purple-300 font-bold text-xs">{formatMoney(asset.cost)}</span>
                )}
              </div>

              {!asset.owned && (
                <button
                  onClick={() => handleBuyLuxury(asset.id)}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl text-xs cursor-pointer transition shadow-md"
                >
                  Buy Prestige Asset
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Club Equity & Presidency Ownership */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>Club Equity &amp; Board Takeover System</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Acquire 20% equity stakes in football clubs. Reaching <strong>&gt;50%</strong> automatically installs you as President. Owning <strong>&lt;50%</strong> enables running a shareholder proxy election!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.slice(0, 15).map((club) => {
            const share = agency.clubShares.find(s => s.clubId === club.id);
            const currentShare = share?.sharePercent || 0;
            const cost20 = Math.round(club.reputation * 350000);
            const isMajorityOwner = currentShare > 50;
            const isCurrentClubPresident = agency.presidency.role === 'Club President' && agency.presidency.clubId === club.id;

            return (
              <div
                key={club.id}
                className={`border rounded-2xl p-4 space-y-3.5 transition flex flex-col justify-between ${
                  isMajorityOwner || isCurrentClubPresident 
                    ? 'bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-950/30' 
                    : currentShare > 0 
                      ? 'bg-slate-850 border-indigo-500/40' 
                      : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                        <span>{club.name}</span>
                        {(isMajorityOwner || isCurrentClubPresident) && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                      </h4>
                      <p className="text-xs text-slate-400">{club.league} • Rep: {club.reputation}/100</p>
                    </div>
                    <span className={`font-black text-xs px-2.5 py-1 rounded-full border ${
                      isMajorityOwner || isCurrentClubPresident
                        ? 'bg-amber-500 text-slate-950 border-amber-400' 
                        : currentShare > 0 
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {currentShare}% Shares
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-slate-300 space-y-1">
                    <p>+20% Stake Cost: <strong className="text-amber-400">{formatMoney(cost20)}</strong></p>
                    <p className="text-[11px] text-slate-400">
                      Transfer War Chest: <strong>{formatMoney(club.transferBudget)}</strong>
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  {isMajorityOwner || isCurrentClubPresident ? (
                    <button
                      onClick={() => {
                        onUpdateAgency({
                          ...agency,
                          presidency: {
                            ...agency.presidency,
                            role: 'Club President',
                            clubId: club.id
                          }
                        });
                        if (onOpenTab) onOpenTab('club_president');
                      }}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-2.5 rounded-xl text-xs cursor-pointer transition shadow-lg flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Crown className="w-4 h-4" />
                      <span>Enter Club President Suite</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleBuyClubShares(club.id)}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs cursor-pointer transition shadow-md flex items-center justify-center gap-1.5"
                      >
                        <span>Buy +20% Stake ({formatMoney(cost20)})</span>
                      </button>

                      {currentShare > 0 && currentShare <= 50 && (
                        <button
                          onClick={() => handleOpenElectionModal(club)}
                          className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold py-2 rounded-xl text-xs cursor-pointer transition flex items-center justify-center gap-1.5"
                        >
                          <Vote className="w-3.5 h-3.5 text-amber-400" />
                          <span>Run for President ({currentShare}% Proxy Election)</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
