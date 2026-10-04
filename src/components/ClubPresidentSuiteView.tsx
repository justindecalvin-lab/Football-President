import React, { useState } from 'react';
import { AgencyState, Club, Player, ClubPresidentPowers } from '../types';
import { formatMoney, recordFinancialTransaction } from '../utils/gameEngine';
import { soundEngine } from '../utils/soundEffects';
import { 
  Crown, 
  Building2, 
  UserCheck, 
  DollarSign, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  Award, 
  Sliders, 
  Sparkles,
  Users,
  Flame,
  UserX,
  Plus,
  Globe,
  Tag,
  Repeat,
  CheckCircle2,
  Filter,
  AlertTriangle,
  Briefcase,
  Vote
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SatelliteAcademyHub } from './SatelliteAcademyHub';
import { PreSeasonTourManager } from './PreSeasonTourManager';
import { PresidentialTransfersApprovals } from './PresidentialTransfersApprovals';
import { BoardOfDirectorsView } from './BoardOfDirectorsView';
import { X, Plane } from 'lucide-react';

interface ClubPresidentSuiteViewProps {
  agency: AgencyState;
  clubs: Club[];
  players: Player[];
  onUpdateAgency: (agency: AgencyState) => void;
  onUpdateClub: (club: Club) => void;
  onUpdateClubs?: (clubs: Club[]) => void;
  onUpdatePlayer?: (player: Player) => void;
  onUpdatePlayers?: (players: Player[]) => void;
  addToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ClubPresidentSuiteView: React.FC<ClubPresidentSuiteViewProps> = ({
  agency,
  clubs,
  players,
  onUpdateAgency,
  onUpdateClub,
  onUpdateClubs,
  onUpdatePlayer,
  onUpdatePlayers,
  addToast
}) => {
  const clubId = agency.presidency.clubId;
  const club = clubs.find(c => c.id === clubId) || clubs[0];
  const [suiteTab, setSuiteTab] = useState<'transfers' | 'boardroom' | 'facilities' | 'mco' | 'squad'>('transfers');
  const [squadFilter, setSquadFilter] = useState<'all' | 'transfer' | 'loan' | 'clients' | 'registered' | 'deregistered' | 'homegrown'>('all');
  const [showTourManager, setShowTourManager] = useState(false);

  const existingPowers: ClubPresidentPowers = (agency.clubPresidentPowers && agency.clubPresidentPowers[club.id]) || {
    clubId: club.id,
    stadiumLevel: 2,
    stadiumSeats: club.stadiumCapacity || 45000,
    managerRating: 82,
    managerStyle: 'Tactical Genius',
    fanApproval: 85,
    boardApproval: 90,
    presidentialDirectives: {
      prioritizeYouthClients: true,
      slashTicketPrices: false,
      unlimitedWageCeiling: false
    }
  };

  const [powers, setPowers] = useState<ClubPresidentPowers>(existingPowers);
  const [injectAmount, setInjectAmount] = useState<number>(5000000);

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (addToast) addToast(msg, type);
  };

  const isBoardApprovalActive = powers.requireBoardApprovalForMajorTransfers ?? powers.presidentialDirectives?.boardApprovalRequiredForLargeTransfers ?? true;

  // Toggle Board Approval requirement policy for transfers exceeding 50% treasury
  const handleToggleBoardApproval = (val?: boolean) => {
    const nextVal = val !== undefined ? val : !isBoardApprovalActive;
    const updatedPowers: ClubPresidentPowers = {
      ...powers,
      requireBoardApprovalForMajorTransfers: nextVal,
      presidentialDirectives: {
        ...powers.presidentialDirectives,
        boardApprovalRequiredForLargeTransfers: nextVal
      }
    };
    updatePowers(updatedPowers);
    onUpdateClub({
      ...club,
      requireBoardApprovalOver50PercentTreasury: nextVal
    });
    notify(
      nextVal
        ? `Board Approval Policy ENABLED: Transfers exceeding 50% of treasury (${formatMoney(club.transferBudget * 0.5)}) require a simulated Board Meeting mini-game!`
        : `Executive Decree: Autocratic Presidential Approval enabled (Board hearings bypassed).`,
      'info'
    );
  };

  // Helper to save updated president powers
  const updatePowers = (newP: ClubPresidentPowers) => {
    setPowers(newP);
    onUpdateAgency({
      ...agency,
      clubPresidentPowers: {
        ...(agency.clubPresidentPowers || {}),
        [club.id]: newP
      }
    });
  };

  // Inject personal agency money into club transfer budget
  const handleInjectCapital = () => {
    if (agency.balance < injectAmount) {
      notify(`Insufficient personal agency funds! You have ${formatMoney(agency.balance)}, but need ${formatMoney(injectAmount)}.`, 'error');
      return;
    }

    if (agency.soundEnabled) soundEngine.playCashSound();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });

    const updatedAgency = recordFinancialTransaction(
      { ...agency, reputation: Math.min(100, agency.reputation + 2) },
      -injectAmount,
      `Capital Injection: ${club.name}`,
      `Injected ${formatMoney(injectAmount)} personal agency capital directly into ${club.name}'s transfer budget.`,
      'presidency'
    );

    onUpdateAgency(updatedAgency);

    onUpdateClub({
      ...club,
      transferBudget: club.transferBudget + injectAmount
    });

    updatePowers({
      ...powers,
      boardApproval: Math.min(100, powers.boardApproval + 5),
      fanApproval: Math.min(100, powers.fanApproval + 3)
    });
    notify(`Capital Injection: Added ${formatMoney(injectAmount)} into ${club.name}'s transfer budget!`, 'success');
  };

  // Helper to spend money either from Club Budget or Personal Agency Funds
  const handleSpendForClub = (
    cost: number,
    title: string,
    description: string,
    onSuccessAction: () => void
  ) => {
    if (club.transferBudget >= cost) {
      if (agency.soundEnabled) soundEngine.playCashSound();
      onUpdateClub({
        ...club,
        transferBudget: club.transferBudget - cost
      });
      onSuccessAction();
      notify(`[Club Budget Payment] ${title} completed! Paid ${formatMoney(cost)} directly from ${club.name}'s transfer budget.`, 'success');
    } else if (agency.balance >= cost) {
      if (agency.soundEnabled) soundEngine.playCashSound();
      const updatedAgency = recordFinancialTransaction(
        agency,
        -cost,
        title,
        `${description} (Paid via personal owner investment into ${club.name})`,
        'presidency'
      );
      onUpdateAgency(updatedAgency);
      onSuccessAction();
      notify(`[Owner Investment Payment] ${title} completed! Paid ${formatMoney(cost)} from personal agency capital.`, 'success');
    } else {
      notify(`Insufficient funds! Need ${formatMoney(cost)} in either ${club.name}'s transfer budget (${formatMoney(club.transferBudget)}) or personal agency balance (${formatMoney(agency.balance)}).`, 'error');
    }
  };

  // Hire a new high-profile manager
  const handleHireManager = (style: 'Tactical Genius' | 'Youth Master' | 'Defensive Guru' | 'Motivational Legend', rating: number, cost: number) => {
    handleSpendForClub(
      cost,
      `Hired Manager: ${style}`,
      `Appointed ${style} (${rating} rating) to lead ${club.name}.`,
      () => {
        onUpdateClub({
          ...club,
          managerName: `Manager ${style}`,
          managerTactics: style === 'Tactical Genius' ? 'Tiki-Taka' : style === 'Defensive Guru' ? 'Park the Bus' : 'Attacking'
        });

        updatePowers({
          ...powers,
          managerRating: rating,
          managerStyle: style,
          fanApproval: Math.min(100, powers.fanApproval + 8)
        });
      }
    );
  };

  // Expand Stadium Capacity
  const handleExpandStadium = () => {
    const cost = 15000000;
    handleSpendForClub(
      cost,
      'Stadium Expansion',
      `Expanded ${club.name} stadium capacity by +10,000 seats.`,
      () => {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        const newSeats = powers.stadiumSeats + 10000;

        onUpdateClub({
          ...club,
          stadiumCapacity: newSeats
        });

        updatePowers({
          ...powers,
          stadiumSeats: newSeats,
          stadiumLevel: powers.stadiumLevel + 1,
          fanApproval: Math.min(100, powers.fanApproval + 10)
        });
      }
    );
  };

  // 15 Club Ownership Expansion Handlers
  const handleMcoSynergy = () => {
    const mcoList = powers.mcoGroupClubs || [club.id];
    if (!mcoList.includes(club.id)) {
      mcoList.push(club.id);
    }
    updatePowers({ ...powers, mcoGroupClubs: mcoList });
    notify(`Multi-Club Ownership (MCO) Network established! Free priority loanee movements activated across ${mcoList.length} affiliated clubs.`, 'success');
  };

  const handleStadiumNamingSponsor = () => {
    const sponsorName = `${club.name} Arena by Emirates Airlines`;
    const sponsorshipRevenue = 15000000;
    
    // Revenue boosts both club budget and agency executive payout
    onUpdateClub({
      ...club,
      transferBudget: club.transferBudget + sponsorshipRevenue
    });

    const updatedAgency = recordFinancialTransaction(
      agency,
      3000000,
      'Stadium Naming Bonus',
      `Received €3,000,000 presidential commission for negotiating Emirates Arena naming rights for ${club.name}.`,
      'presidency'
    );
    onUpdateAgency(updatedAgency);

    updatePowers({
      ...powers,
      stadiumNamingSponsor: sponsorName,
      stadiumRoof: true
    });
    confetti({ particleCount: 60, spread: 70 });
    notify(`Stadium Naming Rights Deal Signed! Stadium renamed to "${sponsorName}" (+${formatMoney(sponsorshipRevenue)} Club Budget & +€3M Agency Bonus)!`, 'success');
  };

  const handleHireExecutive = (role: 'ccoLevel' | 'techDirectorLevel' | 'headScoutLevel' | 'prDirectorLevel') => {
    const cost = 4000000;
    handleSpendForClub(
      cost,
      `Appointed C-Suite Executive (${role})`,
      `Upgraded front-office executive staff level for ${club.name}.`,
      () => {
        const currentExecs = powers.executives || { ccoLevel: 1, techDirectorLevel: 1, headScoutLevel: 1, prDirectorLevel: 1 };
        const updatedExecs = { ...currentExecs, [role]: Math.min(3, currentExecs[role] + 1) };
        updatePowers({ ...powers, executives: updatedExecs });
      }
    );
  };

  const handlePublicIpo = () => {
    if (powers.isPublicIpo) {
      notify('Club shares are already listed on the Stock Exchange!', 'info');
      return;
    }
    const ipoCapital = 100000000;
    const agencyPayout = 20000000;

    onUpdateClub({
      ...club,
      transferBudget: club.transferBudget + ipoCapital
    });

    const updatedAgency = recordFinancialTransaction(
      agency,
      agencyPayout,
      'Public Stock IPO Dividend',
      `Floating ${club.name} on the Stock Exchange generated ${formatMoney(agencyPayout)} in equity founder dividends.`,
      'presidency'
    );
    onUpdateAgency(updatedAgency);

    updatePowers({ ...powers, isPublicIpo: true });
    confetti({ particleCount: 100, spread: 90 });
    notify(`Public Stock IPO Completed! Raised ${formatMoney(ipoCapital)} in club equity capital and earned ${formatMoney(agencyPayout)} founder dividend!`, 'success');
  };

  const handleSovereignPartnership = () => {
    const sovereignInjection = 150000000;
    const agencyCut = 25000000;

    onUpdateClub({
      ...club,
      transferBudget: club.transferBudget + sovereignInjection
    });

    const updatedAgency = recordFinancialTransaction(
      agency,
      agencyCut,
      'Sovereign Wealth Partnership',
      `Secured sovereign equity fund partnership for ${club.name}, earning ${formatMoney(agencyCut)} broker fee.`,
      'presidency'
    );
    onUpdateAgency(updatedAgency);

    updatePowers({ ...powers, sovereignPartner: 'Middle East Sovereign Investment Fund' });
    confetti({ particleCount: 90, spread: 80 });
    notify(`Sovereign Investment Partnership Signed! Injected ${formatMoney(sovereignInjection)} into club budget and +${formatMoney(agencyCut)} to agency!`, 'success');
  };

  const handleJerseySponsorship = () => {
    const clubPayout = 20000000;
    const agencyFee = 4000000;

    onUpdateClub({
      ...club,
      transferBudget: club.transferBudget + clubPayout
    });

    const updatedAgency = recordFinancialTransaction(
      agency,
      agencyFee,
      'Shirt Sponsorship Commission',
      `Negotiated primary shirt sponsor deal for ${club.name}.`,
      'presidency'
    );
    onUpdateAgency(updatedAgency);

    confetti({ particleCount: 50 });
    notify(`Primary Jersey Shirt Sponsor Signed! +${formatMoney(clubPayout)} to club budget and +${formatMoney(agencyFee)} to agency!`, 'success');
  };

  const handleUltrasAtmosphere = () => {
    const cost = 2000000;
    handleSpendForClub(
      cost,
      'Ultras Tifo Funding',
      `Funded stadium choreography and tifos for ${club.name} supporters.`,
      () => {
        updatePowers({
          ...powers,
          ultraRel: Math.min(100, (powers.ultraRel || 80) + 15),
          fanApproval: Math.min(100, powers.fanApproval + 10)
        });
      }
    );
  };

  const handleMedicalCenter = () => {
    const cost = 25000000;
    handleSpendForClub(
      cost,
      'Bio-Performance Medical Center',
      `Constructed state-of-the-art medical center at ${club.name}.`,
      () => {
        updatePowers({ ...powers, medicalCenterLevel: 3 });
      }
    );
  };

  const handlePrivateJetFleet = () => {
    const cost = 18000000;
    handleSpendForClub(
      cost,
      'Boeing Team Jet Purchase',
      `Acquired team jet airliner for ${club.name}.`,
      () => {
        updatePowers({ ...powers, hasPrivateJetFleet: true });
      }
    );
  };

  const handleBuildVipBoxes = () => {
    const cost = 10000000;
    handleSpendForClub(
      cost,
      'Executive VIP Skyboxes',
      `Constructed 50 luxury corporate VIP skyboxes at ${club.name}.`,
      () => {
        if (addToast) addToast('VIP Luxury Skyboxes successfully opened! Matchday commercial revenue boosted.', 'success');
      }
    );
  };

  const handleLaunchClubOttApp = () => {
    const cost = 8000000;
    handleSpendForClub(
      cost,
      'Club OTT Streaming App',
      `Launched official direct-to-consumer streaming app for ${club.name}.`,
      () => {
        if (addToast) addToast('Global OTT streaming platform live! Worldwide fan base monetized.', 'success');
      }
    );
  };

  const handlePreseasonTour = (region: string) => {
    const tourRevenue = 15000000;
    const agencyCut = 3000000;

    onUpdateClub({
      ...club,
      transferBudget: club.transferBudget + tourRevenue
    });

    const updatedAgency = recordFinancialTransaction(
      agency,
      agencyCut,
      `Pre-Season Tour: ${region}`,
      `Completed international pre-season tour in ${region}.`,
      'presidency'
    );
    onUpdateAgency(updatedAgency);

    updatePowers({ ...powers, preseasonTourRegion: region });
    confetti({ particleCount: 60 });
    notify(`Global Pre-Season Tour in ${region} completed! Earned ${formatMoney(tourRevenue)} for club and +${formatMoney(agencyCut)} for agency!`, 'success');
  };

  const handleYouthSatellite = (location: string) => {
    const cost = 5000000;
    const currentSats = powers.youthSatellites || [];
    if (currentSats.includes(location)) {
      notify(`Scouting hub in ${location} is already operational!`, 'info');
      return;
    }

    handleSpendForClub(
      cost,
      `Youth Satellite Hub: ${location}`,
      `Opened scouting hub in ${location}.`,
      () => {
        updatePowers({ ...powers, youthSatellites: [...currentSats, location] });
      }
    );
  };

  const handleTransferVeto = () => {
    const newVeto = !powers.vetoTransfersActive;
    updatePowers({ ...powers, vetoTransfersActive: newVeto });
    notify(`Presidential Transfer Veto Power is now ${newVeto ? 'ACTIVE (Sporting Director blocked from selling stars)' : 'DISABLED'}.`, 'info');
  };

  const handleKitSupplierDeal = () => {
    const bonus = 25000000;
    const agencyCut = 5000000;

    onUpdateClub({
      ...club,
      transferBudget: club.transferBudget + bonus
    });

    const updatedAgency = recordFinancialTransaction(
      agency,
      agencyCut,
      'Nike Kit Manufacturer Deal',
      `Signed Nike Elite kit deal for ${club.name}.`,
      'presidency'
    );
    onUpdateAgency(updatedAgency);

    updatePowers({ ...powers, kitSupplierDeal: 'Nike Elite Tier €25M/yr' });
    confetti({ particleCount: 50 });
    notify(`Nike Elite Kit Manufacturer Deal signed! +${formatMoney(bonus)} to club budget and +${formatMoney(agencyCut)} to agency!`, 'success');
  };

  const handleCryptoFanTokens = () => {
    if (powers.cryptoFanTokensActive) {
      notify('Club Crypto Fan Tokens are already launched and active!', 'info');
      return;
    }
    const tokenRevenue = 10000000;
    const agencyCut = 2000000;

    onUpdateClub({
      ...club,
      transferBudget: club.transferBudget + tokenRevenue
    });

    const updatedAgency = recordFinancialTransaction(
      agency,
      agencyCut,
      'Crypto Fan Tokens Launch',
      `Launched fan token offering for ${club.name}.`,
      'presidency'
    );
    onUpdateAgency(updatedAgency);

    updatePowers({ ...powers, cryptoFanTokensActive: true });
    confetti({ particleCount: 70 });
    notify(`Club Crypto Fan Tokens launched! +${formatMoney(tokenRevenue)} to club budget and +${formatMoney(agencyCut)} to agency!`, 'success');
  };

  const handleClubMuseum = () => {
    const cost = 12000000;
    handleSpendForClub(
      cost,
      'World-Class Club Museum',
      `Constructed museum and trophy room at ${club.name}.`,
      () => {
        updatePowers({ ...powers, hasClubMuseum: true });
        confetti({ particleCount: 60 });
      }
    );
  };


  const agencyClientsInClub = players.filter(p => p.isMyClient && p.clubId === club.id);
  const isClubPresident = agency.activeRoles?.currentRole === 'club_owner';
  const currentRoleName = agency.activeRoles?.currentRole === 'fa_president' ? 'FA President' : 'Football Agent';

  const handleResignClubPresident = () => {
    if (window.confirm(`Are you sure you want to resign as Club President of ${club.name}?\n\nYou will step down from executive boardroom authority and return to independent Football Agent status.`)) {
      if (agency.soundEnabled) soundEngine.playClickSound();
      onUpdateAgency({
        ...agency,
        activeRoles: {
          agent: true,
          club_owner: false,
          fa_president: false,
          currentRole: 'agent',
          presidentClubId: undefined
        },
        presidency: {
          ...agency.presidency,
          role: 'None',
          clubId: undefined
        }
      });
      if (addToast) {
        addToast(`🏛️ You formally resigned as Club President of ${club.name}. Returned to Football Agent.`, 'info');
      }
    }
  };

  // If not currently holding the Club President role, show restricted boardroom state
  if (!isClubPresident) {
    const userSharesInClub = agency.clubShares.find(s => s.clubId === club.id);
    const anyOwnedShares = agency.clubShares.filter(s => s.sharePercent > 0);

    return (
      <div className="space-y-6 pb-12">
        <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <Crown className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Strict Role Exclusivity
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Boardroom Access Restricted</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              You are currently active as a <strong className="text-amber-400 font-bold">{currentRoleName}</strong>.
              Under FIFA regulations and career rules, you cannot exercise club executive boardroom powers while serving in another capacity.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl max-w-md mx-auto text-left space-y-3 text-xs">
            <div className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>How to become Club President:</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              1. Save funds and acquire <strong className="text-emerald-400">&gt;50% controlling equity</strong> in Tycoon &amp; Empire to automatically take over as President.
            </p>
            <p className="text-slate-400 leading-relaxed">
              2. Or acquire 20-40% equity and win a <strong className="text-amber-400">Shareholder Proxy Election</strong>.
            </p>
            <p className="text-slate-500 text-[11px] italic">
              Note: Becoming Club President will require resigning from your other active role.
            </p>

            {userSharesInClub && (
              <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-xl flex items-center justify-between mt-2">
                <span className="font-bold text-white">{club.name} Equity:</span>
                <span className="font-black text-amber-400">{userSharesInClub.sharePercent}%</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <button
              onClick={() => {
                const tycoonBtn = document.querySelector('[data-tab="tycoon"]') as HTMLButtonElement;
                if (tycoonBtn) tycoonBtn.click();
              }}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Open Tycoon Club Shares
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* President Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 border-2 border-amber-500/60 p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shrink-0">
            <Crown className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                Club President &amp; Owner
              </span>
              <span className="text-xs text-amber-300 font-bold">{club.league}</span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">Club President Suite: {club.name}</h2>
            <p className="text-xs text-amber-200/80">
              You hold supreme executive authority. Direct transfer strategy, fire managers, inject capital, and build club infrastructure.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Board Approval Toggle Pill */}
          <button
            type="button"
            onClick={() => handleToggleBoardApproval()}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 border shadow-inner ${
              isBoardApprovalActive
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Toggle Board Approval requirement for transfers worth over 50% of club treasury"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-left">
              <span className="block text-[9px] uppercase font-bold text-slate-400">Board Approval (&gt;50% Treasury)</span>
              <span className="block font-black text-[11px] text-white">
                {isBoardApprovalActive ? '✅ ENABLED (Mini-Game)' : '🚫 DISABLED (Autocratic)'}
              </span>
            </div>
          </button>

          <div className="bg-slate-900/90 border border-amber-500/40 px-4 py-2 rounded-xl text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Fan Approval</p>
            <p className="text-lg font-black text-emerald-400">{powers.fanApproval}%</p>
          </div>
          <div className="bg-slate-900/90 border border-amber-500/40 px-4 py-2 rounded-xl text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Board Trust</p>
            <p className="text-lg font-black text-amber-400">{powers.boardApproval}%</p>
          </div>
          <button
            onClick={handleResignClubPresident}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Step down as Club President"
          >
            Resign as President
          </button>
        </div>
      </div>

      {/* Presidential Main Suite Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto bg-slate-900/90 border border-amber-500/30 p-2 rounded-2xl shadow-xl scrollbar-none text-xs">
        <button
          onClick={() => setSuiteTab('transfers')}
          className={`py-2.5 px-4 rounded-xl font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
            suiteTab === 'transfers'
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
              : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>Delegated Transfers &amp; Approvals</span>
          {((club.pendingPresidentialTransfers?.length || 0) + ((club.internalTransferRequests || []).filter(r => r.status === 'pending_president_authorization').length)) > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
              {(club.pendingPresidentialTransfers?.length || 0) + ((club.internalTransferRequests || []).filter(r => r.status === 'pending_president_authorization').length)}
            </span>
          )}
        </button>

        <button
          onClick={() => setSuiteTab('boardroom')}
          className={`py-2.5 px-4 rounded-xl font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
            suiteTab === 'boardroom'
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-950/40'
              : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Board of Directors Governance</span>
        </button>

        <button
          onClick={() => setSuiteTab('facilities')}
          className={`py-2.5 px-4 rounded-xl font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
            suiteTab === 'facilities'
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-950/40'
              : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Infrastructure &amp; Operations</span>
        </button>

        <button
          onClick={() => setSuiteTab('mco')}
          className={`py-2.5 px-4 rounded-xl font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
            suiteTab === 'mco'
              ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-950/40'
              : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Multi-Club &amp; Academies</span>
        </button>

        <button
          onClick={() => setSuiteTab('squad')}
          className={`py-2.5 px-4 rounded-xl font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
            suiteTab === 'squad'
              ? 'bg-sky-600 text-white border-sky-400 shadow-lg shadow-sky-950/40'
              : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Squad Registry &amp; Mandates</span>
        </button>
      </div>

      {/* 1. DELEGATED TRANSFERS & APPROVALS TAB */}
      {suiteTab === 'transfers' && (
        <PresidentialTransfersApprovals
          club={club}
          allPlayers={players}
          allClubs={clubs}
          agency={agency}
          onUpdateAgency={onUpdateAgency}
          onUpdateClub={onUpdateClub}
          onUpdateAllPlayers={onUpdatePlayers}
          onUpdateAllClubs={onUpdateClubs}
          addToast={addToast}
          boardApprovalRequired={isBoardApprovalActive}
          onToggleBoardApproval={handleToggleBoardApproval}
        />
      )}

      {/* 2. BOARD OF DIRECTORS GOVERNANCE TAB */}
      {suiteTab === 'boardroom' && (
        <BoardOfDirectorsView
          club={club}
          agency={agency}
          onUpdateAgency={onUpdateAgency}
          onUpdateClub={onUpdateClub}
          addToast={addToast}
        />
      )}

      {/* 3. MULTI-CLUB & SATELLITE ACADEMIES TAB */}
      {suiteTab === 'mco' && (
        <SatelliteAcademyHub
          agency={agency}
          club={club}
          players={players}
          onUpdateAgency={onUpdateAgency}
          onUpdatePlayer={onUpdatePlayer}
          addToast={addToast}
        />
      )}

      {/* 4. INFRASTRUCTURE & CAPITAL OPERATIONS TAB */}
      {suiteTab === 'facilities' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Financial & Transfer Budget Injection */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>Inject Personal Agency Capital</span>
          </h3>
          <p className="text-xs text-slate-400">
            Transfer money from your agency balance into {club.name}'s transfer budget to finance massive signings.
          </p>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Current Club Budget:</span>
              <strong className="text-emerald-400">{formatMoney(club.transferBudget)}</strong>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-300">Select Capital Amount:</label>
              <div className="flex gap-2">
                {[5000000, 10000000, 25000000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setInjectAmount(amt)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer min-h-[44px] ${
                      injectAmount === amt ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {formatMoney(amt)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleInjectCapital}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer min-h-[44px] flex items-center justify-center gap-2 shadow-lg"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Inject Capital into Club</span>
            </button>
          </div>
        </div>

        {/* Column 2: Managerial Suite & Hire/Fire */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <span>Managerial Staffing & Tactics</span>
          </h3>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Current Manager:</p>
                <p className="text-sm font-bold text-white">{club.managerName || 'Manager Unknown'}</p>
              </div>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs px-2.5 py-1 rounded-lg font-bold">
                {powers.managerStyle} ({powers.managerRating} Rating)
              </span>
            </div>
          </div>

          <p className="text-xs font-bold text-slate-300">Hire Elite Managerial Specialist:</p>
          <div className="space-y-2">
            {[
              { style: 'Youth Master', rating: 88, cost: 3000000, desc: 'Accelerates wonderkid development & agency client ratings' },
              { style: 'Tactical Genius', rating: 92, cost: 6000000, desc: 'Tiki-Taka dominance & higher match win percentage' },
              { style: 'Motivational Legend', rating: 90, cost: 5000000, desc: 'Maximizes squad morale & player form' }
            ].map((m) => (
              <div key={m.style} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-white">{m.style} ({m.rating} Rating)</p>
                  <p className="text-[10px] text-slate-400">{m.desc}</p>
                </div>
                <button
                  onClick={() => handleHireManager(m.style as any, m.rating, m.cost)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer shrink-0 min-h-[36px]"
                >
                  Hire ({formatMoney(m.cost)})
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Stadium Expansion & Agency Synergy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <span>Stadium Infrastructure & Synergy</span>
          </h3>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Stadium Capacity:</span>
              <strong className="text-amber-300">{powers.stadiumSeats.toLocaleString()} seats</strong>
            </div>

            <button
              onClick={handleExpandStadium}
              className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-3 rounded-xl text-xs transition cursor-pointer min-h-[44px] flex items-center justify-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Expand Stadium +10,000 Seats (€15M)</span>
            </button>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 space-y-2">
            <p className="text-xs font-bold text-slate-200">Agency Clients at {club.shortName}:</p>
            {agencyClientsInClub.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No agency clients currently playing for this club. Sign them or transfer them here!</p>
            ) : (
              <div className="space-y-1">
                {agencyClientsInClub.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-700/40">
                    <span className="text-slate-200 font-bold">{p.name} ({p.position})</span>
                    <span className="text-emerald-400 font-semibold">OVR {p.rating}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONFLICT OF INTEREST DUAL-ROLE BRIDGE PANEL */}
      <div className="bg-slate-900 border-2 border-red-500/50 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Conflict of Interest Insider Operations</h3>
              <p className="text-xs text-slate-400">
                Leverage dual roles as Club President and Player Agent to execute insider transactions, siphon transfer budgets, and negotiate insider client contracts.
              </p>
            </div>
          </div>

          <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Current Scandal Hazard</p>
            <p className="text-sm font-bold text-red-400">{agency.presidency?.conflictScandalLevel || 10}% Audit Risk</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action 1: Siphon Club Budget */}
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>Siphon 15% Club Transfer Budget</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Channel 15% of {club.name}'s transfer budget directly into agency account as "Consultancy Fees".
              </p>
            </div>

            <button
              onClick={() => {
                if (club.transferBudget < 5000000) {
                  notify("Club transfer budget is too low to siphon!", 'error');
                  return;
                }
                const siphoned = Math.round(club.transferBudget * 0.15);
                if (agency.soundEnabled) soundEngine.playCashSound();
                notify(`Siphoned ${formatMoney(siphoned)} from club transfer budget into agency account! (+15 Scandal Hazard)`, 'warning');

                onUpdateClub({
                  ...club,
                  transferBudget: club.transferBudget - siphoned
                });

                const updatedAgency = recordFinancialTransaction(
                  {
                    ...agency,
                    presidency: {
                      ...agency.presidency,
                      conflictScandalLevel: Math.min(100, (agency.presidency?.conflictScandalLevel || 10) + 15)
                    }
                  },
                  siphoned,
                  `Siphoned Club Capital: ${club.name}`,
                  `Channeled ${formatMoney(siphoned)} from ${club.name}'s transfer budget into personal agency account as consultancy fees.`,
                  'scandal'
                );

                onUpdateAgency(updatedAgency);
              }}
              className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs transition cursor-pointer min-h-[44px]"
            >
              Execute Budget Siphon
            </button>
          </div>

          {/* Action 2: Insider Low Buyout Contract */}
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Force 'Insider' Client Release Clause</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Force {club.name} to sign your agency clients to tiny €10M release clauses so European giants buy them easily.
              </p>
            </div>

            <button
              onClick={() => {
                const clientsInClub = players.filter(p => p.isMyClient && p.clubId === club.id);
                if (clientsInClub.length === 0) {
                  notify("No agency clients currently play for this club!", 'error');
                  return;
                }
                if (agency.soundEnabled) soundEngine.playClickSound();
                notify(`Forced low release clauses on ${clientsInClub.length} agency clients at ${club.name}! (+10 Scandal Hazard)`, 'warning');

                onUpdateAgency({
                  ...agency,
                  presidency: {
                    ...agency.presidency,
                    conflictScandalLevel: Math.min(100, (agency.presidency?.conflictScandalLevel || 10) + 10)
                  }
                });
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-2.5 rounded-xl text-xs transition cursor-pointer min-h-[44px]"
            >
              Enforce Low Clause
            </button>
          </div>

          {/* Action 3: Overprice Client Transfer Fee */}
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Inflate Agency Client Valuation</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Inflate market valuation of agency clients by +30% at {club.name} to demand higher transfer fees and agent commissions.
              </p>
            </div>

            <button
              onClick={() => {
                if (agency.soundEnabled) soundEngine.playCashSound();
                notify(`Inflated agency client valuations at ${club.name} by +30%! (+10 Scandal Hazard)`, 'warning');

                onUpdateAgency({
                  ...agency,
                  presidency: {
                    ...agency.presidency,
                    conflictScandalLevel: Math.min(100, (agency.presidency?.conflictScandalLevel || 10) + 10)
                  }
                });
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 rounded-xl text-xs transition cursor-pointer min-h-[44px]"
            >
              Inflate Valuation (+30%)
            </button>
          </div>
        </div>
      </div>

      {/* 15-POINT MULTI-CLUB OWNERSHIP & CLUB TYCOON EXPANSION SUITE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-400" />
            <span>15-Point Club Tycoon &amp; Multi-Club Ownership Expansion Suite</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Build global multi-club networks, list stock exchange IPOs, partner with sovereign wealth funds, construct bio-medical centers, and tour the world.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Feature 16: Multi-Club Ownership Network */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-xs text-white">16. Multi-Club Ownership (MCO) Group</h4>
            </div>
            <p className="text-[11px] text-slate-400">Connect owned clubs into a syndicate for zero-cost loanee movement.</p>
            <button onClick={handleMcoSynergy} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold p-2 rounded-xl text-xs">
              Establish MCO Synergy Network
            </button>
          </div>

          {/* Feature 17: Stadium Roof & Naming Rights */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-xs text-white">17. Stadium Roof &amp; Naming Rights</h4>
              <span className="text-[10px] text-slate-400">{powers.stadiumRoof ? 'Built' : 'Standard'}</span>
            </div>
            <p className="text-[11px] text-slate-400">Sell naming rights for huge cash windfall &amp; add retractable roof.</p>
            <button onClick={handleStadiumNamingSponsor} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-2 rounded-xl text-xs">
              Sign Sponsor (+€15M)
            </button>
          </div>

          {/* Feature 18: Sovereign Wealth Fund Loan */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-yellow-400" />
              <h4 className="font-bold text-xs text-white">18. Sovereign Wealth Fund Credit Line</h4>
            </div>
            <p className="text-[11px] text-slate-400">Borrow €50,000,000 liquid capital at 3% seasonal interest.</p>
            <button onClick={handleSovereignPartnership} className="w-full bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold p-2 rounded-xl text-xs">
              Draw €50M Credit
            </button>
          </div>

          {/* Feature 19: Stock Exchange IPO */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <h4 className="font-bold text-xs text-white">19. Public Stock Exchange IPO</h4>
            </div>
            <p className="text-[11px] text-slate-400">Float 10% club equity on London/NYSE stock exchanges.</p>
            <button onClick={handlePublicIpo} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold p-2 rounded-xl text-xs">
              Launch Public IPO (+€40M)
            </button>
          </div>

          {/* Feature 20: C-Suite Executive Upgrades */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <h4 className="font-bold text-xs text-white">20. C-Suite Front-Office Upgrades</h4>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <button onClick={() => handleHireExecutive('ccoLevel')} className="bg-slate-700 hover:bg-slate-600 text-white p-1.5 rounded-lg">
                Chief Commercial Officer (€4M)
              </button>
              <button onClick={() => handleHireExecutive('techDirectorLevel')} className="bg-slate-700 hover:bg-slate-600 text-white p-1.5 rounded-lg">
                Technical Director (€4M)
              </button>
              <button onClick={() => handleHireExecutive('headScoutLevel')} className="bg-slate-700 hover:bg-slate-600 text-white p-1.5 rounded-lg">
                Head of Global Scouting (€4M)
              </button>
              <button onClick={() => handleHireExecutive('prDirectorLevel')} className="bg-slate-700 hover:bg-slate-600 text-white p-1.5 rounded-lg">
                Director of Public Relations (€4M)
              </button>
            </div>
          </div>

          {/* Feature 21: VIP Hospitality Boxes */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-xs text-white">21. 50 Luxury Executive VIP Boxes</h4>
            </div>
            <p className="text-[11px] text-slate-400">Install premium corporate skyboxes (+€500k weekly matchday income).</p>
            <button onClick={handleBuildVipBoxes} className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold p-2 rounded-xl text-xs">
              Construct VIP Skyboxes (€10M)
            </button>
          </div>

          {/* Feature 22: Club TV Broadcast Streaming App */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <h4 className="font-bold text-xs text-white">22. Global Club OTT Streaming App</h4>
            </div>
            <p className="text-[11px] text-slate-400">Launch exclusive direct-to-consumer club TV app for global fan subscriptions.</p>
            <button onClick={handleLaunchClubOttApp} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-2 rounded-xl text-xs">
              Launch Club OTT Platform (€8M)
            </button>
          </div>

          {/* Feature 23: Bio-Medical Recovery Center */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <h4 className="font-bold text-xs text-white">23. Cryo-Tech Bio-Medical Hub</h4>
            </div>
            <p className="text-[11px] text-slate-400">Reduces squad injury duration by 50% &amp; accelerates stamina regeneration.</p>
            <button onClick={handleMedicalCenter} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold p-2 rounded-xl text-xs">
              Build Medical Hub (€25M)
            </button>
          </div>

          {/* Feature 24: Private Club Team Aircraft */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <h4 className="font-bold text-xs text-white">24. Private Boeing Team Jet Fleet</h4>
            </div>
            <p className="text-[11px] text-slate-400">Buy custom team airliner to eliminate away match squad travel fatigue.</p>
            <button onClick={handlePrivateJetFleet} className="w-full bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold p-2 rounded-xl text-xs">
              Buy Boeing Team Jet (€18M)
            </button>
          </div>

          {/* Feature 25: Pre-Season Global Tours */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <h4 className="font-bold text-xs text-white">25. Pre-Season Global Tour Hub</h4>
            </div>
            <p className="text-[11px] text-slate-400">Launch international tours in USA, East Asia, Middle East or Australia with custom prize money &amp; sponsors.</p>
            <button 
              onClick={() => setShowTourManager(true)} 
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Plane className="w-4 h-4 text-amber-300" />
              <span>Open Tour Expedition Center</span>
            </button>
          </div>

          {/* Feature 26: Youth Scouting Satellite Hubs */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" />
              <h4 className="font-bold text-xs text-white">26. Youth Scouting Satellite Hubs</h4>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleYouthSatellite('Santos, Brazil')} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold p-2 rounded-xl">
                Brazil Hub (€5M)
              </button>
              <button onClick={() => handleYouthSatellite('Accra, Ghana')} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold p-2 rounded-xl">
                Ghana Hub (€5M)
              </button>
            </div>
          </div>

          {/* Feature 27: Presidential Transfer Veto */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-red-400" />
              <h4 className="font-bold text-xs text-white">27. Presidential Transfer Veto</h4>
            </div>
            <p className="text-[11px] text-slate-400">Status: <strong className="text-amber-300">{powers.vetoTransfersActive ? 'Active' : 'Disabled'}</strong></p>
            <button onClick={handleTransferVeto} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold p-2 rounded-xl text-xs">
              Toggle Transfer Veto Power
            </button>
          </div>

          {/* Feature 28: Kit Supplier Squeezing */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-xs text-white">28. Nike/Adidas Kit Deal Squeeze</h4>
            </div>
            <p className="text-[11px] text-slate-400">Renegotiate kit manufacturer deal with performance bonuses.</p>
            <button onClick={handleKitSupplierDeal} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold p-2 rounded-xl text-xs">
              Sign Nike Deal (+€25M)
            </button>
          </div>

          {/* Feature 29: Club Crypto Fan Tokens */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <h4 className="font-bold text-xs text-white">29. Club Crypto Fan Tokens</h4>
            </div>
            <p className="text-[11px] text-slate-400">Launch official digital fan tokens for instant fan monetization.</p>
            <button onClick={handleCryptoFanTokens} className="w-full bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold p-2 rounded-xl text-xs">
              Launch Fan Tokens (+€10M)
            </button>
          </div>

          {/* Feature 30: Interactive Club Museum */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <h4 className="font-bold text-xs text-white">30. Club Museum &amp; Trophy Room</h4>
            </div>
            <p className="text-[11px] text-slate-400">Construct world-class museum to generate weekly tourism revenue.</p>
            <button onClick={handleClubMuseum} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold p-2 rounded-xl text-xs">
              Build Museum (€12M)
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* 5. SQUAD REGISTRATION & MANDATES TAB */}
  {suiteTab === 'squad' && (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>Squad Registration &amp; Presidential Squad List Hub</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Audit Homegrown (HG) quotas, manage senior roster registrations (max 25), and exercise presidential mandate over Transfer &amp; Loan lists.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {[
              { id: 'all', label: 'All Squad' },
              { id: 'registered', label: 'Registered' },
              { id: 'deregistered', label: 'Deregistered' },
              { id: 'homegrown', label: 'Homegrown (HG)' },
              { id: 'transfer', label: 'Transfer Listed' },
              { id: 'loan', label: 'Loan Listed' },
              { id: 'clients', label: 'Agency Clients' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSquadFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-[11px] ${
                  squadFilter === f.id
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Homegrown & Registration Audit Summary Banner */}
        {(() => {
          const clubPlayers = players.filter(p => p.clubId === club.id);
          const registeredCount = clubPlayers.filter(p => p.isRegistered !== false).length;
          const homegrownCount = clubPlayers.filter(p => p.isHomegrown).length;
          const deregisteredCount = clubPlayers.filter(p => p.isRegistered === false).length;
          const hgQuotaMet = homegrownCount >= 8;

          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Registered Squad</span>
                <p className={`text-base font-black ${registeredCount <= 25 ? 'text-white' : 'text-red-400'}`}>
                  {registeredCount} / 25 Max
                </p>
                <p className="text-[10px] text-slate-500">{25 - registeredCount} slot{25 - registeredCount !== 1 ? 's' : ''} available</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Homegrown (HG) Quota</span>
                <p className={`text-base font-black flex items-center gap-1.5 ${hgQuotaMet ? 'text-emerald-400' : 'text-amber-400'}`}>
                  <span>{homegrownCount} / 8 Min</span>
                  {hgQuotaMet ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                </p>
                <p className="text-[10px] text-slate-500">{hgQuotaMet ? 'Compliant with FA rules' : 'Below 8 HG minimum quota'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Foreign / Non-HG</span>
                <p className="text-base font-black text-indigo-300">
                  {clubPlayers.length - homegrownCount} / 17 Max
                </p>
                <p className="text-[10px] text-slate-500">International senior players</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Deregistered Risk</span>
                <p className={`text-base font-black ${deregisteredCount === 0 ? 'text-slate-400' : 'text-red-400'}`}>
                  {deregisteredCount} Player{deregisteredCount !== 1 ? 's' : ''}
                </p>
                <p className="text-[10px] text-slate-500">{deregisteredCount > 0 ? 'Tribunal walkout risk (>4 wks)' : 'All squad registered'}</p>
              </div>
            </div>
          );
        })()}

        {/* Squad Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold text-[11px]">
                <th className="py-2.5 px-3">Player</th>
                <th className="py-2.5 px-2 text-center">Pos</th>
                <th className="py-2.5 px-2 text-center">Age</th>
                <th className="py-2.5 px-2 text-center">OVR</th>
                <th className="py-2.5 px-2 text-center">Playing Time</th>
                <th className="py-2.5 px-3">Value</th>
                <th className="py-2.5 px-3">Wage</th>
                <th className="py-2.5 px-3 text-center">Squad Registration</th>
                <th className="py-2.5 px-3 text-right">Presidential Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {players
                .filter(p => p.clubId === club.id)
                .filter(p => {
                  if (squadFilter === 'registered') return p.isRegistered !== false;
                  if (squadFilter === 'deregistered') return p.isRegistered === false;
                  if (squadFilter === 'homegrown') return p.isHomegrown;
                  if (squadFilter === 'transfer') return p.isTransferListed;
                  if (squadFilter === 'loan') return p.isLoanListed;
                  if (squadFilter === 'clients') return p.isMyClient;
                  return true;
                })
                .map(player => (
                  <tr key={player.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{player.flag}</span>
                        <div>
                          <p className="font-bold text-white flex items-center gap-1.5">
                            <span>{player.name}</span>
                            {player.isHomegrown && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-bold border border-amber-500/30" title="Homegrown Club Player">
                                🏠 HG
                              </span>
                            )}
                            {player.isMyClient && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                Client
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400">{player.nationality} • {player.traits?.[0] || 'First Team'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-300">
                        {player.position}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-slate-300 font-semibold">{player.age}</td>
                    <td className="py-3 px-2 text-center font-bold text-amber-400">{player.rating}</td>
                    <td className="py-3 px-2 text-center">
                      <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                        {player.agreedPlayingTime || 'Regular Starter'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-200">{formatMoney(player.value)}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono">{formatMoney(player.wage)}/wk</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const isReg = player.isRegistered !== false;
                          const updated: Player = {
                            ...player,
                            isRegistered: !isReg,
                            unregisteredWeeks: !isReg ? 0 : 1,
                            morale: !isReg ? Math.min(100, player.morale + 10) : Math.max(10, player.morale - 25)
                          };
                          if (onUpdatePlayer) onUpdatePlayer(updated);
                          if (addToast) {
                            addToast(
                              !isReg
                                ? `✅ ${player.name} registered for official competition roster.`
                                : `⚠️ ${player.name} de-registered from competition roster (-25 Morale). Risk of tribunal walkout if prolonged.`,
                              !isReg ? 'success' : 'info'
                            );
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition cursor-pointer border ${
                          player.isRegistered !== false
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30 animate-pulse'
                        }`}
                        title="Toggle 25-man squad registration"
                      >
                        {player.isRegistered !== false ? '✅ Registered' : `🚫 Deregistered (${player.unregisteredWeeks || 1}w)`}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Toggle Transfer List */}
                        <button
                          type="button"
                          onClick={() => {
                            const isListed = !player.isTransferListed;
                            const updated: Player = {
                              ...player,
                              isTransferListed: isListed,
                              transferListedByClub: isListed
                            };
                            if (onUpdatePlayer) onUpdatePlayer(updated);
                            if (addToast) {
                              addToast(
                                isListed 
                                  ? `👑 President Mandate: ${player.name} placed on Transfer List.` 
                                  : `👑 President Mandate: ${player.name} removed from Transfer List.`,
                                isListed ? 'success' : 'info'
                              );
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                            player.isTransferListed
                              ? 'bg-amber-500 text-slate-950 font-black border border-amber-400 shadow-md'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }`}
                          title="Toggle Transfer Listing"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{player.isTransferListed ? 'Listed' : 'Transfer List'}</span>
                        </button>

                        {/* Toggle Loan List */}
                        <button
                          type="button"
                          onClick={() => {
                            const isListed = !player.isLoanListed;
                            const updated: Player = {
                              ...player,
                              isLoanListed: isListed,
                              loanListedByClub: isListed
                            };
                            if (onUpdatePlayer) onUpdatePlayer(updated);
                            if (addToast) {
                              addToast(
                                isListed 
                                  ? `👑 President Mandate: ${player.name} placed on Loan List.` 
                                  : `👑 President Mandate: ${player.name} removed from Loan List.`,
                                isListed ? 'success' : 'info'
                              );
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                            player.isLoanListed
                              ? 'bg-sky-500 text-slate-950 font-black border border-sky-400 shadow-md'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }`}
                          title="Toggle Loan Listing"
                        >
                          <Repeat className="w-3 h-3" />
                          <span>{player.isLoanListed ? 'Loan Listed' : 'Loan List'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

      {/* Pre-Season Tour Expedition Modal */}
      {showTourManager && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowTourManager(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <PreSeasonTourManager
              agency={agency}
              clubs={clubs}
              onUpdateAgency={(updater) => onUpdateAgency(updater(agency))}
              onUpdateClub={onUpdateClub}
              onShowToast={(msg, type) => {
                if (addToast) addToast(msg, type || 'info');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

