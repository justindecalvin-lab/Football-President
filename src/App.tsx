import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  AgencyState, 
  Club, 
  Player, 
  NewsItem, 
  PlayerDilemma, 
  RandomEvent, 
  PressInterview, 
  PressInterviewOption 
} from './types';
import { 
  INITIAL_AGENCY_STATE, 
  INITIAL_CLUBS, 
  INITIAL_PLAYERS 
} from './data/mockData';
import { 
  generateProceduralClubs, 
  ensureTwentyClubsPerLeague,
  generateProceduralPlayers,
  enforceSquadMinRoster
} from './utils/proceduralGenerator';
import { 
  calculateWeeklyFinances, 
  simulateRivalAgencyPoaching, 
  simulateMultiTierPromotionRelegation, 
  generateRandomDilemma,
  simulateWeekFixtures,
  processWeeklyPlayerUnrest,
  generateSimulationNewsItems,
  processWeeklyEscrowTranches,
  processWeeklyDebtAndLoans,
  processWeeklyIpoStockMarket,
  processWeeklyCorporateBonds,
  processWeeklyScoutingMissions,
  processWeeklyPromises,
  processEndOfSeasonContractClauses,
  checkAndUnlockAchievements,
  generateDynamicPressInterview,
  formatMoney 
} from './utils/gameEngine';
import { processWeeklyLoans } from './utils/loanEngine';
import { simulateAiTransferMarket } from './utils/transferEvaluationEngine';
import { processWeeklyAssistantDelegation } from './utils/assistantEngine';
import { generateDynamicRandomEvent } from './utils/randomEventsEngine';
import { syncAgencyRoles, getEffectiveRole, processWeeklyExecutiveGovernance } from './utils/roleInteractionsEngine';
import { processWeeklyPlayerProgressionAndDegradation } from './utils/playerProgressionEngine';
import { enforceSquadRegistrationDeadline } from './utils/registrationEngine';
import { soundEngine } from './utils/soundEffects';
import { 
  saveItemToStorage, 
  loadItemFromStorage,
  vacuumStorage
} from './utils/storage';

// Component Views
import { Header } from './components/Header';
import { SubNavHeader } from './components/SubNavHeader';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { NewsAndAwardsView } from './components/NewsAndAwardsView';
import { MatchesView } from './components/MatchesView';
import { MyPlayersView } from './components/MyPlayersView';
import { UnrestHotlineView } from './components/UnrestHotlineView';
import { LoanManagementView } from './components/LoanManagementView';
import { TransferMarketView } from './components/TransferMarketView';
import { ScoutView } from './components/ScoutView';
import { RivalAgentsView } from './components/RivalAgentsView';
import { ClubPresidentSuiteView } from './components/ClubPresidentSuiteView';
import { FederationGovernanceView } from './components/FederationGovernanceView';
import { FinancialAnalyticsView } from './components/FinancialAnalyticsView';
import { TycoonView } from './components/TycoonView';
import { LeagueHierarchyInspector } from './components/LeagueHierarchyInspector';
import { DarkArtsView } from './components/DarkArtsView';
import { HallOfFameView } from './components/HallOfFameView';
import { SystemMenuView } from './components/SystemMenuView';
import { GameLauncherScreen, NewGameOptions } from './components/GameLauncherScreen';

// Modals
import { SaveLoadModal } from './components/SaveLoadModal';
import { InGameEditorModal } from './components/InGameEditorModal';
import { ClubDetailModal } from './components/ClubDetailModal';
import { RoleRequirementModal } from './components/RoleRequirementModal';
import { PressInterviewModal } from './components/PressInterviewModal';
import { UniversalSearchModal } from './components/UniversalSearchModal';
import { RandomEventModal } from './components/RandomEventModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';

const STORAGE_KEY_AGENCY = 'soccer_agent_agency';
const STORAGE_KEY_PLAYERS = 'soccer_agent_players';
const STORAGE_KEY_CLUBS = 'soccer_agent_clubs';
const STORAGE_KEY_NEWS = 'soccer_agent_news';
const STORAGE_KEY_GAME_STARTED = 'soccer_agent_game_started';

export default function App() {
  // Game Core State
  const [agency, setAgency] = useState<AgencyState>(INITIAL_AGENCY_STATE);
  const [clubs, setClubs] = useState<Club[]>(() => generateProceduralClubs());
  const [players, setPlayers] = useState<Player[]>(() => generateProceduralPlayers(generateProceduralClubs()));
  const [news, setNews] = useState<NewsItem[]>([
    {
      id: 'news_welcome_001',
      week: 1,
      season: 2026,
      headline: '⚽ European Season Kickoff: Summer Transfer Window Opens!',
      content: 'Club executives and premier scouting networks have officially opened transfer negotiations across 20-team national leagues. Scout wonderkids, navigate FFP rules, and establish your football dynasty.',
      category: 'transfer',
      urgency: 'breaking',
      read: false
    }
  ]);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Active Tab & Subviews
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Interactive Dilemmas & Events
  const [activeDilemma, setActiveDilemma] = useState<PlayerDilemma | null>(null);
  const [randomEvent, setRandomEvent] = useState<RandomEvent | null>(null);

  // Selected entities for modals
  const [selectedPlayerForTransfer, setSelectedPlayerForTransfer] = useState<Player | null>(null);
  const [selectedClubForDetail, setSelectedClubForDetail] = useState<Club | null>(null);

  // Modals visibility state
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showEditorModal, setShowEditorModal] = useState<boolean>(false);
  const [showRoleModal, setShowRoleModal] = useState<'club_owner' | 'fa_president' | null>(null);
  const [showPressInterviewModal, setShowPressInterviewModal] = useState<boolean>(false);
  const [showUniversalSearch, setShowUniversalSearch] = useState<boolean>(false);
  const [showLauncher, setShowLauncher] = useState<boolean>(false);
  const [confirmRestartOpen, setConfirmRestartOpen] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // 1. Initial Load from Persistent Storage (IndexedDB + LocalStorage)
  useEffect(() => {
    async function initializeData() {
      try {
        const savedAgency = await loadItemFromStorage<AgencyState>(STORAGE_KEY_AGENCY);
        const savedPlayers = await loadItemFromStorage<Player[]>(STORAGE_KEY_PLAYERS);
        const savedClubs = await loadItemFromStorage<Club[]>(STORAGE_KEY_CLUBS);
        const savedNews = await loadItemFromStorage<NewsItem[]>(STORAGE_KEY_NEWS);
        const savedStarted = await loadItemFromStorage<boolean>(STORAGE_KEY_GAME_STARTED);

        let activeClubsList: Club[];
        if (savedClubs && savedClubs.length > 0) {
          activeClubsList = ensureTwentyClubsPerLeague(savedClubs);
          setClubs(activeClubsList);
        } else {
          activeClubsList = generateProceduralClubs();
          setClubs(activeClubsList);
        }

        if (savedPlayers && savedPlayers.length > 0) {
          const enforcedPlayers = enforceSquadMinRoster(activeClubsList, savedPlayers);
          setPlayers(enforcedPlayers);
        } else {
          setPlayers(generateProceduralPlayers(activeClubsList));
        }

        if (savedAgency) setAgency(savedAgency);
        if (savedNews && savedNews.length > 0) setNews(savedNews.slice(0, 30));
        if (savedStarted !== null && savedStarted !== undefined) {
          setGameStarted(savedStarted);
        } else if (savedAgency) {
          setGameStarted(true);
        }

        // Automatic storage vacuum: clean up legacy bloated raw keys from LocalStorage
        vacuumStorage().catch(() => {});
      } catch (err) {
        console.warn('Storage initial load notice:', err);
      } finally {
        setIsInitializing(false);
      }
    }

    initializeData();
  }, []);

  // 2. Debounced Auto-sync state changes to persistent storage (avoids UI render lockups)
  const syncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isInitializing && gameStarted) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        saveItemToStorage(STORAGE_KEY_AGENCY, agency);
        saveItemToStorage(STORAGE_KEY_PLAYERS, players);
        saveItemToStorage(STORAGE_KEY_CLUBS, clubs);
        saveItemToStorage(STORAGE_KEY_NEWS, news);
        saveItemToStorage(STORAGE_KEY_GAME_STARTED, gameStarted);
      }, 1500);
    }
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [agency, players, clubs, news, gameStarted, isInitializing]);

  // Handle Starting a New Game Career
  const handleStartNewGame = useCallback((options: NewGameOptions) => {
    const isOwner = options.role === 'club_owner';
    const isFA = options.role === 'fa_president';

    const freshClubs = generateProceduralClubs();
    const freshPlayers = generateProceduralPlayers(freshClubs);

    const chosenClub = freshClubs.find(c => c.id === options.targetClubId) || freshClubs[0];

    const freshAgency: AgencyState = {
      ...INITIAL_AGENCY_STATE,
      agentName: options.characterName,
      agencyName: options.organizationName,
      balance: options.startingBudget,
      reputation: isOwner ? 60 : isFA ? 80 : 35,
      currentWeek: 1,
      currentSeason: 2026,
      activeRoles: {
        agent: true,
        club_owner: isOwner,
        fa_president: isFA,
        currentRole: options.role,
        startingRole: options.role
      },
      presidency: {
        role: isOwner ? 'Club President' : isFA ? 'FIFA Global President' : 'None',
        clubId: isOwner ? chosenClub.id : undefined,
        politicalInfluence: isFA ? 75 : 10,
        termYearsLeft: isFA ? 4 : isOwner ? 5 : 0,
        conflictScandalLevel: 5,
        conflictLogs: [],
        activePolicies: { ...INITIAL_AGENCY_STATE.presidency.activePolicies }
      }
    };

    // If starting as Club Owner, allocate controlling shares
    if (isOwner) {
      freshAgency.clubShares = [
        {
          clubId: chosenClub.id,
          clubName: chosenClub.name,
          sharePercent: 65,
          investedAmount: options.startingBudget,
          lastElectionWon: true
        }
      ];
    }

    setAgency(freshAgency);
    setPlayers(freshPlayers);
    setClubs(freshClubs);
    setNews([
      {
        id: `news_welcome_${Date.now()}`,
        week: 1,
        season: 2026,
        headline: `🌟 NEW CAREER: ${options.characterName} Appointed as ${
          isOwner ? `President of ${chosenClub.name}` : isFA ? 'Federation President' : `Head of ${options.organizationName}`
        }!`,
        content: `A transformative new era begins in football management. ${options.characterName} has assumed executive leadership with a starter treasury of ${formatMoney(options.startingBudget)}.`,
        category: 'agency',
        urgency: 'breaking',
        read: false
      }
    ]);

    setGameStarted(true);
    setShowLauncher(false);
    setActiveTab(isOwner ? 'club_president' : isFA ? 'governance' : 'dashboard');
    addToast(`Career initialized successfully as ${options.characterName}!`, 'success');
  }, [clubs, addToast]);

  // Single-week simulation runner executing all 16 game systems
  const executeSimulationWeek = useCallback((
    baseAgency: AgencyState,
    basePlayers: Player[],
    baseClubs: Club[]
  ) => {
    const nextWeek = baseAgency.currentWeek >= 38 ? 1 : baseAgency.currentWeek + 1;
    const nextSeason = baseAgency.currentWeek >= 38 ? baseAgency.currentSeason + 1 : baseAgency.currentSeason;
    const isNewSeason = baseAgency.currentWeek >= 38;

    // 1. Process Weekly Financial Cash Flow
    const finances = calculateWeeklyFinances(baseAgency, basePlayers);
    let currentBalance = Math.max(0, baseAgency.balance + finances.netWeekly);

    let updatedAgency: AgencyState = {
      ...baseAgency,
      currentWeek: nextWeek,
      currentSeason: nextSeason,
      balance: currentBalance,
      financialHistory: [
        {
          week: nextWeek,
          season: nextSeason,
          income: finances.totalIncome,
          expense: finances.totalExpense,
          net: finances.netWeekly,
          balance: currentBalance
        },
        ...(baseAgency.financialHistory || []).slice(0, 20)
      ]
    };

    let updatedPlayers = [...basePlayers];
    let updatedClubs = [...baseClubs];
    let stepNews: NewsItem[] = [];
    const stepToasts: string[] = [];

    // 2. Simulate League Fixtures & Client Match Performance
    const fixtureResult = simulateWeekFixtures(updatedClubs, updatedPlayers, nextWeek, nextSeason, updatedAgency);
    updatedClubs = fixtureResult.updatedClubs;
    updatedPlayers = fixtureResult.updatedPlayers;
    stepNews = [...stepNews, ...fixtureResult.performanceNews];

    if (fixtureResult.clientBonusIncome > 0) {
      updatedAgency.balance += fixtureResult.clientBonusIncome;
      updatedAgency.totalClientEarnings = (updatedAgency.totalClientEarnings || 0) + fixtureResult.clientBonusIncome;
    }
    if (fixtureResult.clientMilestones.length > 0) {
      const milestoneItems = fixtureResult.clientMilestones.map(m => ({
        id: `ms_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        week: nextWeek,
        season: nextSeason,
        title: m.title,
        description: m.description,
        type: 'performance_bonus' as const,
        impact: m.impact
      }));
      updatedAgency.milestones = [...milestoneItems, ...(updatedAgency.milestones || [])];
    }

    // 3. Escrow Accounts Settlement & Maturation Processor
    const escrowResult = processWeeklyEscrowTranches(updatedAgency, updatedPlayers, nextWeek, nextSeason);
    updatedAgency = escrowResult.updatedAgency;
    stepNews = [...stepNews, ...escrowResult.escrowNews];

    // 4. Bank Loans & Debt Amortization
    const debtResult = processWeeklyDebtAndLoans(updatedAgency, nextWeek, nextSeason);
    updatedAgency = debtResult.updatedAgency;
    stepNews = [...stepNews, ...debtResult.loanNews];
    if (debtResult.toastAlert) stepToasts.push(debtResult.toastAlert);

    // 5. Stock Market IPO Simulation (if public)
    const ipoResult = processWeeklyIpoStockMarket(updatedAgency, nextWeek, nextSeason, updatedPlayers);
    updatedAgency = ipoResult.updatedAgency;
    stepNews = [...stepNews, ...ipoResult.ipoNews];

    // 6. Corporate Bonds Maturation & Coupon Lifecycle
    const bondResult = processWeeklyCorporateBonds(updatedAgency, nextWeek, nextSeason);
    updatedAgency = bondResult.updatedAgency;
    stepNews = [...stepNews, ...bondResult.bondNews];
    bondResult.toastAlerts.forEach(t => stepToasts.push(t));

    // 7. Scouting Network Missions & Academy Talent Pipelines
    const scoutResult = processWeeklyScoutingMissions(updatedAgency, updatedPlayers, nextWeek, nextSeason);
    updatedAgency = scoutResult.updatedAgency;
    updatedPlayers = scoutResult.updatedPlayers;
    stepNews = [...stepNews, ...scoutResult.scoutNews];
    scoutResult.toastAlerts.forEach(t => stepToasts.push(t));

    // 8. Client Commitments & Promises Lifecycle
    const promiseResult = processWeeklyPromises(updatedPlayers, updatedAgency, nextWeek, nextSeason);
    updatedAgency = promiseResult.updatedAgency;
    updatedPlayers = promiseResult.updatedPlayers;
    stepNews = [...stepNews, ...promiseResult.newsItems];

    // 9. Simulate Dynamic AI-to-AI Transfer Market
    const aiTransferResult = simulateAiTransferMarket(updatedClubs, updatedPlayers, nextWeek, nextSeason, updatedAgency);
    updatedClubs = aiTransferResult.updatedClubs;
    updatedPlayers = aiTransferResult.updatedPlayers;
    updatedAgency = aiTransferResult.updatedAgency;
    stepNews = [...stepNews, ...aiTransferResult.newsItems];

    // 10. Process Loan Engagements & Buyouts
    const loanResult = processWeeklyLoans(updatedAgency, updatedPlayers, updatedClubs, nextWeek, nextSeason);
    updatedAgency = loanResult.updatedAgency;
    updatedPlayers = loanResult.updatedPlayers;
    stepNews = [...stepNews, ...loanResult.newsItems];

    // 11. Automated Assistant Recruitment Delegation
    const assistantResult = processWeeklyAssistantDelegation(
      updatedAgency, 
      updatedPlayers, 
      updatedClubs, 
      nextWeek, 
      nextSeason
    );
    updatedAgency = assistantResult.updatedAgency;
    updatedPlayers = assistantResult.updatedPlayers;
    if (assistantResult.toastMessage) {
      stepToasts.push(assistantResult.toastMessage);
    }

    // 12. Weekly Player Unrest, Contract Demands & Discontent
    const unrestResult = processWeeklyPlayerUnrest(updatedPlayers, updatedClubs, nextWeek, nextSeason);
    updatedPlayers = unrestResult.updatedPlayers;
    stepNews = [...stepNews, ...unrestResult.newsItems];

    // 13. Dynamic Player Progression & Ability Degradation Engine (Bad form streaks, homesickness, age, development)
    const progressionResult = processWeeklyPlayerProgressionAndDegradation(
      updatedPlayers,
      updatedClubs,
      nextWeek,
      nextSeason,
      updatedAgency
    );
    updatedPlayers = progressionResult.updatedPlayers;
    stepNews = [...stepNews, ...progressionResult.newsItems];
    progressionResult.toastMessages.forEach(t => stepToasts.push(t));

    // 14. Squad Registration Deadline Day Enforcement (Summer Week 8, Winter Week 24)
    const registrationResult = enforceSquadRegistrationDeadline(
      updatedClubs,
      updatedPlayers,
      nextWeek,
      nextSeason,
      updatedAgency.presidency
    );
    updatedPlayers = registrationResult.updatedPlayers;
    stepNews = [...stepNews, ...registrationResult.newsItems];
    registrationResult.toastMessages.forEach(t => stepToasts.push(t));

    // 15. Rival Agency Poaching Actions
    const poachResult = simulateRivalAgencyPoaching(updatedAgency, updatedPlayers, nextWeek, nextSeason);
    updatedPlayers = poachResult.updatedPlayers;
    stepNews = [...stepNews, ...poachResult.newsItems];

    // 16. League Governance, Scandals & Presidency News
    const simNews = generateSimulationNewsItems(updatedAgency, nextWeek, nextSeason, updatedPlayers);
    stepNews = [...stepNews, ...simNews];

    // 17. Executive Governance (Sporting Director Tasks, Board Mandates, Presidential Approval Expiries, Staff Directives)
    const execGovResult = processWeeklyExecutiveGovernance(updatedClubs, updatedAgency, nextWeek, nextSeason, updatedPlayers);
    updatedClubs = execGovResult.updatedClubs;
    updatedAgency = execGovResult.updatedAgency;
    stepNews = [...stepNews, ...execGovResult.newsItems];
    execGovResult.toastMessages.forEach(t => stepToasts.push(t));

    // 18. Achievements & Career Trophies
    const achResult = checkAndUnlockAchievements(updatedAgency, updatedPlayers, updatedClubs);
    updatedAgency = achResult.updatedAgency;

    // 16. Season Transitions (End-of-Season Clauses, Promotion, Relegation)
    if (isNewSeason) {
      const clauseResult = processEndOfSeasonContractClauses(updatedAgency, updatedPlayers, updatedClubs, nextSeason);
      updatedAgency = clauseResult.updatedAgency;
      updatedPlayers = clauseResult.updatedPlayers;
      stepNews = [...stepNews, ...clauseResult.newsItems];
      clauseResult.toastMessages.forEach(msg => stepToasts.push(msg));

      const seasonResult = simulateMultiTierPromotionRelegation(updatedClubs, nextSeason);
      updatedClubs = seasonResult.updatedClubs;
      stepNews = [...stepNews, ...seasonResult.newsItems];
      stepToasts.push(`🎉 Season ${baseAgency.currentSeason} concluded! New ${nextSeason} Season Fixtures Drawn!`);
    }

    // 17. Random Dilemma Trigger (25% chance)
    let triggeredDilemma: PlayerDilemma | null = null;
    if (Math.random() < 0.25) {
      triggeredDilemma = generateRandomDilemma(updatedPlayers) || null;
    }

    // 18. Dynamic Random Event Trigger (15% chance)
    let triggeredEvent: RandomEvent | null = null;
    if (Math.random() < 0.15) {
      triggeredEvent = generateDynamicRandomEvent(updatedAgency, updatedPlayers, updatedClubs) || null;
    }

    // 19. Dynamic Press Interview Conference Trigger (20% chance or breaking context)
    let triggeredInterview: PressInterview | null = null;
    if (Math.random() < 0.20 || updatedPlayers.some(p => p.ongoingTransferNegotiation?.status === 'pending_user_decision')) {
      const newInterview = generateDynamicPressInterview(updatedAgency, updatedPlayers, updatedClubs, nextWeek, nextSeason);
      if (newInterview) {
        triggeredInterview = newInterview;
        updatedAgency.pressInterviews = [newInterview, ...(updatedAgency.pressInterviews || []).filter(i => !i.answered).slice(0, 5)];
      }
    }

    // 20. Synchronize Active Roles & Persona State
    updatedAgency = syncAgencyRoles(updatedAgency);

    return {
      updatedAgency,
      updatedPlayers,
      updatedClubs,
      stepNews,
      stepToasts,
      triggeredDilemma,
      triggeredEvent,
      triggeredInterview,
      netWeekly: finances.netWeekly,
      clientBonusIncome: fixtureResult.clientBonusIncome,
      nextWeek,
      nextSeason
    };
  }, []);

  // Handle Advance 1 Week
  const handleAdvanceWeek = useCallback(() => {
    if (agency.soundEnabled) soundEngine.playClick();

    const result = executeSimulationWeek(agency, players, clubs);

    if (result.triggeredDilemma) setActiveDilemma(result.triggeredDilemma);
    if (result.triggeredEvent) setRandomEvent(result.triggeredEvent);
    if (result.triggeredInterview && !result.triggeredDilemma && !result.triggeredEvent) {
      setShowPressInterviewModal(true);
    }

    setNews(prev => [...result.stepNews, ...prev].slice(0, 30));
    setAgency(result.updatedAgency);
    setPlayers(result.updatedPlayers);
    setClubs(result.updatedClubs);

    result.stepToasts.forEach(msg => addToast(msg, 'info'));

    const bonusSummary = result.clientBonusIncome > 0 ? ` (+${formatMoney(result.clientBonusIncome)} match bonuses)` : '';
    addToast(`Advanced to Week ${result.nextWeek} (Season ${result.nextSeason}). Net: ${result.netWeekly >= 0 ? '+' : ''}${formatMoney(result.netWeekly)}${bonusSummary}`, 'info');
  }, [agency, players, clubs, executeSimulationWeek, addToast]);

  // Fast Forward 4 Weeks (Robust Sequential Simulation)
  const handleFastForward4Weeks = useCallback(() => {
    if (agency.soundEnabled) soundEngine.playClick();

    let curAgency = agency;
    let curPlayers = players;
    let curClubs = clubs;
    let allNews: NewsItem[] = [];
    let allToasts: string[] = [];
    let lastDilemma: PlayerDilemma | null = null;
    let lastEvent: RandomEvent | null = null;
    let totalClientBonus = 0;
    const initialBalance = agency.balance;

    for (let step = 0; step < 4; step++) {
      const stepResult = executeSimulationWeek(curAgency, curPlayers, curClubs);
      curAgency = stepResult.updatedAgency;
      curPlayers = stepResult.updatedPlayers;
      curClubs = stepResult.updatedClubs;
      allNews = [...stepResult.stepNews, ...allNews];
      allToasts = [...allToasts, ...stepResult.stepToasts];
      if (stepResult.triggeredDilemma) lastDilemma = stepResult.triggeredDilemma;
      if (stepResult.triggeredEvent) lastEvent = stepResult.triggeredEvent;
      totalClientBonus += stepResult.clientBonusIncome;
    }

    if (lastDilemma) setActiveDilemma(lastDilemma);
    if (lastEvent) setRandomEvent(lastEvent);

    setNews(prev => [...allNews, ...prev].slice(0, 30));
    setAgency(curAgency);
    setPlayers(curPlayers);
    setClubs(curClubs);

    // Show highlights from toasts
    allToasts.slice(0, 2).forEach(t => addToast(t, 'info'));

    const netChange = curAgency.balance - initialBalance;
    const bonusText = totalClientBonus > 0 ? ` incl. ${formatMoney(totalClientBonus)} client match bonuses` : '';
    addToast(`⏩ Fast-forwarded 4 Weeks to W${curAgency.currentWeek} S${curAgency.currentSeason}! Net: ${netChange >= 0 ? '+' : ''}${formatMoney(netChange)}${bonusText}`, 'success');
  }, [agency, players, clubs, executeSimulationWeek, addToast]);

  // Resolve Player Dilemma
  const handleResolveDilemma = useCallback((dilemma: PlayerDilemma, option: 'A' | 'B') => {
    const opt = option === 'A' ? dilemma.optionA : dilemma.optionB;
    
    setPlayers(prev => prev.map(p => {
      if (p.id === dilemma.playerId) {
        return {
          ...p,
          morale: Math.min(100, Math.max(0, (p.morale || 75) + opt.moraleChange)),
          personalLife: {
            ...p.personalLife,
            scandalLevel: Math.min(100, Math.max(0, (p.personalLife?.scandalLevel || 0) + opt.scandalChange))
          }
        };
      }
      return p;
    }));

    if (opt.cashChange !== 0) {
      setAgency(prev => ({
        ...prev,
        balance: Math.max(0, prev.balance + opt.cashChange)
      }));
    }

    addToast(opt.outcomeText, 'info');
    setActiveDilemma(null);
  }, [addToast]);

  // Handle Press Interview Answer
  const handleAnswerInterview = useCallback((interviewId: string, _optionIndex: number, outcome: PressInterviewOption) => {
    const repDelta = outcome.reputationDelta ?? outcome.reputationChange ?? 0;
    const cashDelta = outcome.cashChange ?? 0;
    const feedback = outcome.responseQuote || outcome.impactSummary || outcome.mediaReaction || 'Interview concluded.';

    setAgency(prev => ({
      ...prev,
      balance: cashDelta !== 0 ? Math.max(0, prev.balance + cashDelta) : prev.balance,
      reputation: Math.min(100, Math.max(0, prev.reputation + repDelta)),
      pressInterviews: (prev.pressInterviews || []).map(i => i.id === interviewId ? { ...i, answered: true } : i)
    }));

    addToast(`Press Conference Concluded: ${feedback}`, 'success');
  }, [addToast]);

  // Handle Update Player Helper
  const handleUpdatePlayer = useCallback((updated: Player) => {
    setPlayers(prev => prev.map(p => p.id === updated.id ? updated : p));
  }, []);

  // Handle Add Player Helper
  const handleAddPlayer = useCallback((newPlayer: Player) => {
    setPlayers(prev => [newPlayer, ...prev]);
  }, []);

  // Handle Update Club Helper
  const handleUpdateClub = useCallback((updatedClub: Club) => {
    setClubs(prev => prev.map(c => c.id === updatedClub.id ? updatedClub : c));
  }, []);

  // Handle Restructure / Load Save Slot
  const handleLoadState = useCallback((savedState: { agency: AgencyState; clubs: Club[]; players: Player[]; news: NewsItem[] }) => {
    setAgency(savedState.agency);
    setClubs(savedState.clubs);
    setPlayers(savedState.players);
    setNews(savedState.news);
    setGameStarted(true);
    setShowSaveModal(false);
    addToast('Career loaded successfully from save slot!', 'success');
  }, [addToast]);

  // Number of unrested clients
  const unrestCount = useMemo(() => {
    return players.filter(p => p.isMyClient && p.unrest && p.unrest.status !== 'content').length;
  }, [players]);

  const isTransferWindow = useMemo(() => {
    return (agency.currentWeek >= 1 && agency.currentWeek <= 8) || (agency.currentWeek >= 20 && agency.currentWeek <= 24);
  }, [agency.currentWeek]);

  // If initial load in progress
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4 p-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-300 tracking-wider animate-pulse">Initializing Football Agent Studio...</p>
      </div>
    );
  }

  // If Game has not started or Launcher explicitly opened
  if (!gameStarted || showLauncher) {
    return (
      <ErrorBoundary>
        <GameLauncherScreen
          currentAgency={agency}
          clubs={clubs}
          players={players}
          hasExistingGame={gameStarted}
          hasExistingSave={true}
          onResumeGame={() => setShowLauncher(false)}
          onStartNewGame={handleStartNewGame}
          onOpenSaveManager={() => setShowSaveModal(true)}
        />
        {/* Save / Load Modal if triggered from launcher */}
        {showSaveModal && (
          <SaveLoadModal
            isOpen={showSaveModal}
            onClose={() => setShowSaveModal(false)}
            agency={agency}
            clubs={clubs}
            players={players}
            news={news}
            onLoadState={handleLoadState}
            addToast={addToast}
          />
        )}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
        {/* Primary Sticky Header */}
        <Header
          agency={agency}
          playersCount={players.filter(p => p.isMyClient).length}
          onAdvanceWeek={handleAdvanceWeek}
          onFastForward4Weeks={handleFastForward4Weeks}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onStartNewGame={() => setShowLauncher(true)}
          onRestartGame={() => setConfirmRestartOpen(true)}
          onSaveGame={() => setShowSaveModal(true)}
          onLoadGame={() => setShowSaveModal(true)}
          onOpenEditor={() => setShowEditorModal(true)}
          onOpenSaveManager={() => setShowSaveModal(true)}
          onOpenLauncher={() => setShowLauncher(true)}
          onShowRoleRequirement={(role) => setShowRoleModal(role)}
          onUpdateAgency={setAgency}
          onOpenUniversalSearch={() => setShowUniversalSearch(true)}
          onOpenPressInterview={() => setShowPressInterviewModal(true)}
        />

        {/* Sub-Navigation Pills Header */}
        <SubNavHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unrestCount={unrestCount}
          isTransferWindow={isTransferWindow}
          activeRole={agency.activeRoles?.currentRole || 'agent'}
          clubName={agency.presidency?.clubName}
          currentWeek={agency.currentWeek}
          currentSeason={agency.currentSeason}
        />

        {/* Main View Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 pb-28">
          {activeTab === 'dashboard' && (
            <DashboardView
              agency={agency}
              players={players}
              clubs={clubs}
              news={news}
              activeDilemma={activeDilemma}
              onResolveDilemma={handleResolveDilemma}
              onOpenTab={setActiveTab}
              onOpenPlayerModal={(player) => {
                setSelectedPlayerForTransfer(player);
                setActiveTab('my_players');
              }}
              onUpdateAgency={setAgency}
              onUpdatePlayer={handleUpdatePlayer}
              onUpdateClubs={setClubs}
              onAddPlayer={handleAddPlayer}
              addToast={addToast}
              onOpenPressInterview={() => setShowPressInterviewModal(true)}
            />
          )}

          {activeTab === 'news_awards' && (
            <NewsAndAwardsView
              news={news}
              players={players}
              agency={agency}
              setNews={setNews}
              setAgency={setAgency}
              setPlayers={setPlayers}
              onAdvanceWeek={handleAdvanceWeek}
              onTriggerRandomEvent={() => {
                const evt = generateDynamicRandomEvent(agency, players, clubs);
                if (evt) setRandomEvent(evt);
              }}
              addToast={addToast}
              onOpenTab={setActiveTab}
            />
          )}

          {activeTab === 'matches' && (
            <MatchesView
              clubs={clubs}
              players={players}
              agency={agency}
              onUpdateAgency={setAgency}
              onAdvanceWeek={handleAdvanceWeek}
              onUpdatePlayer={handleUpdatePlayer}
            />
          )}

          {activeTab === 'my_players' && (
            <MyPlayersView
              players={players}
              agencyBalance={agency.balance}
              agency={agency}
              clubs={clubs}
              onUpdatePlayer={handleUpdatePlayer}
              onUpdateAgency={setAgency}
              onUpdateClubs={setClubs}
              onOpenTransferModal={(player) => {
                setSelectedPlayerForTransfer(player);
                setActiveTab('transfer_market');
              }}
              onOpenTab={setActiveTab}
              onAddPlayer={handleAddPlayer}
              soundEnabled={agency.soundEnabled}
              addToast={addToast}
            />
          )}

          {activeTab === 'unrest_hotline' && (
            <UnrestHotlineView
              players={players}
              agencyBalance={agency.balance}
              agency={agency}
              onUpdatePlayer={handleUpdatePlayer}
              onUpdateAgency={setAgency}
              onOpenTransferModal={(player) => {
                setSelectedPlayerForTransfer(player);
                setActiveTab('transfer_market');
              }}
              onOpenTab={setActiveTab}
            />
          )}

          {activeTab === 'loan_management' && (
            <LoanManagementView
              agency={agency}
              players={players}
              clubs={clubs}
              onUpdateAgency={setAgency}
              onUpdatePlayers={setPlayers}
              onAddToast={addToast}
            />
          )}

          {activeTab === 'transfer_market' && (
            <TransferMarketView
              players={players}
              clubs={clubs}
              agency={agency}
              onUpdatePlayer={handleUpdatePlayer}
              onUpdateAgency={setAgency}
              onUpdateClubs={setClubs}
              selectedPlayerForTransfer={selectedPlayerForTransfer}
              onCloseSelectedPlayerForTransfer={() => setSelectedPlayerForTransfer(null)}
              addToast={addToast}
            />
          )}

          {activeTab === 'scouting' && (
            <ScoutView
              agency={agency}
              onUpdateAgency={setAgency}
              onSignPlayer={handleAddPlayer}
              addToast={addToast}
            />
          )}

          {activeTab === 'rivals' && (
            <RivalAgentsView
              agency={agency}
              players={players}
              onUpdateAgency={setAgency}
              onUpdatePlayer={handleUpdatePlayer}
            />
          )}

          {activeTab === 'club_president' && (
            <ClubPresidentSuiteView
              agency={agency}
              clubs={clubs}
              players={players}
              onUpdateAgency={setAgency}
              onUpdateClub={handleUpdateClub}
              onUpdatePlayer={handleUpdatePlayer}
              addToast={addToast}
            />
          )}

          {activeTab === 'governance' && (
            <FederationGovernanceView
              agency={agency}
              clubs={clubs}
              players={players}
              onUpdateAgency={setAgency}
              onUpdatePlayer={handleUpdatePlayer}
              onUpdateClub={handleUpdateClub}
              addToast={addToast}
            />
          )}

          {activeTab === 'analytics' && (
            <FinancialAnalyticsView
              agency={agency}
              players={players}
              clubs={clubs}
              onUpdateAgency={setAgency}
              onUpdateClub={handleUpdateClub}
              onOpenTab={setActiveTab}
              onShowToast={addToast}
            />
          )}

          {activeTab === 'tycoon' && (
            <TycoonView
              agency={agency}
              clubs={clubs}
              onUpdateAgency={setAgency}
              onOpenTab={setActiveTab}
              addToast={addToast}
            />
          )}

          {activeTab === 'league_inspector' && (
            <LeagueHierarchyInspector
              clubs={clubs}
              players={players}
              agency={agency}
              onUpdatePlayer={handleUpdatePlayer}
              onUpdateAgency={setAgency}
              onOpenTransferModal={(player) => {
                setSelectedPlayerForTransfer(player);
                setActiveTab('transfer_market');
              }}
              onOpenClubModal={(club) => setSelectedClubForDetail(club)}
              onUpdateClub={handleUpdateClub}
              addToast={addToast}
            />
          )}

          {activeTab === 'dark_arts' && (
            <DarkArtsView
              agency={agency}
              players={players}
              onUpdateAgency={setAgency}
              onUpdatePlayer={handleUpdatePlayer}
            />
          )}

          {activeTab === 'hall_of_fame' && (
            <HallOfFameView
              agency={agency}
              players={players}
            />
          )}

          {activeTab === 'system_menu' && (
            <SystemMenuView
              agency={agency}
              onOpenSaveManager={() => setShowSaveModal(true)}
              onOpenEditor={() => setShowEditorModal(true)}
              onSaveGame={() => setShowSaveModal(true)}
              onLoadGame={() => setShowSaveModal(true)}
              onStartNewGame={() => setShowLauncher(true)}
              onRestartGame={() => setConfirmRestartOpen(true)}
            />
          )}
        </main>

        {/* Fixed Mobile/Desktop Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unrestCount={unrestCount}
          isTransferWindow={isTransferWindow}
          activeRole={agency.activeRoles?.currentRole || 'agent'}
        />

        {/* --- Global Interactive Modals --- */}

        {/* 1. Save & Load Hub */}
        {showSaveModal && (
          <SaveLoadModal
            isOpen={showSaveModal}
            onClose={() => setShowSaveModal(false)}
            agency={agency}
            clubs={clubs}
            players={players}
            news={news}
            onLoadState={handleLoadState}
            addToast={addToast}
          />
        )}

        {/* 2. In-Game Cheat & Data Editor */}
        {showEditorModal && (
          <InGameEditorModal
            isOpen={showEditorModal}
            onClose={() => setShowEditorModal(false)}
            agency={agency}
            setAgency={setAgency}
            players={players}
            setPlayers={setPlayers}
            clubs={clubs}
            setClubs={setClubs}
            addToast={addToast}
          />
        )}

        {/* 3. Club Detail Inspector Modal */}
        {selectedClubForDetail && (
          <ClubDetailModal
            club={selectedClubForDetail}
            players={players}
            agency={agency}
            onClose={() => setSelectedClubForDetail(null)}
            onUpdatePlayer={handleUpdatePlayer}
            onUpdateAgency={setAgency}
            onOpenTransferModal={(player) => {
              setSelectedPlayerForTransfer(player);
              setSelectedClubForDetail(null);
              setActiveTab('transfer_market');
            }}
            onUpdateClub={handleUpdateClub}
            addToast={addToast}
          />
        )}

        {/* 4. Role Requirement Locked Info Modal */}
        {showRoleModal && (
          <RoleRequirementModal
            targetRole={showRoleModal}
            agency={agency}
            clubs={clubs}
            onClose={() => setShowRoleModal(null)}
            onNavigateToTab={(tab) => {
              setShowRoleModal(null);
              setActiveTab(tab);
            }}
            onPromoteToRole={(role) => {
              setAgency(prev => ({
                ...prev,
                activeRoles: {
                  ...prev.activeRoles!,
                  [role]: true,
                  currentRole: role
                }
              }));
              setShowRoleModal(null);
              setActiveTab(role === 'club_owner' ? 'club_president' : 'governance');
              addToast(`Unlocked executive role: ${role === 'club_owner' ? 'Club President' : 'FA President'}!`, 'success');
            }}
          />
        )}

        {/* 5. Press Interview Conference Modal */}
        {showPressInterviewModal && (
          <PressInterviewModal
            isOpen={showPressInterviewModal}
            onClose={() => setShowPressInterviewModal(false)}
            interviews={agency.pressInterviews || []}
            onAnswerInterview={handleAnswerInterview}
            players={players}
            agency={agency}
          />
        )}

        {/* 5b. Universal Global Search Modal */}
        {showUniversalSearch && (
          <UniversalSearchModal
            isOpen={showUniversalSearch}
            onClose={() => setShowUniversalSearch(false)}
            players={players}
            clubs={clubs}
            news={news}
            onSelectPlayer={(player) => {
              setShowUniversalSearch(false);
              if (player.isMyClient) {
                setActiveTab('my_players');
              } else {
                setSelectedPlayerForTransfer(player);
                setActiveTab('transfer_market');
              }
            }}
            onSelectClub={(club) => {
              setShowUniversalSearch(false);
              setSelectedClubForDetail(club);
            }}
            onNavigateTab={(tab) => {
              setShowUniversalSearch(false);
              setActiveTab(tab);
            }}
          />
        )}

        {/* 6. Dynamic Random Event Modal */}
        {randomEvent && (
          <RandomEventModal
            event={randomEvent}
            onClose={() => setRandomEvent(null)}
            agency={agency}
            setAgency={setAgency}
            players={players}
            setPlayers={setPlayers}
            clubs={clubs}
            setClubs={setClubs}
            addToast={addToast}
          />
        )}

        {/* 7. Confirm Game Restart Modal */}
        {confirmRestartOpen && (
          <ConfirmModal
            isOpen={confirmRestartOpen}
            title="Restart Career Campaign?"
            message="Are you sure you want to reset all current career progression? Any unsaved changes in your current agency session will be cleared."
            confirmLabel="Restart Career"
            cancelLabel="Cancel"
            confirmStyle="danger"
            icon="alert"
            onConfirm={() => {
              setConfirmRestartOpen(false);
              setShowLauncher(true);
            }}
            onCancel={() => setConfirmRestartOpen(false)}
          />
        )}

        {/* Global Toast Notification Stack */}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    </ErrorBoundary>
  );
}
