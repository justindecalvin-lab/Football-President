import React, { useState, useMemo } from 'react';
import { AgencyState, Player, Club } from '../types';
import { formatMoney } from '../utils/gameEngine';
import { 
  Mail, 
  MailOpen, 
  AlertCircle, 
  AlertTriangle,
  ShieldAlert, 
  ShieldCheck,
  ChevronRight, 
  Building2, 
  User, 
  Briefcase, 
  Globe, 
  Zap, 
  Search, 
  Filter, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  FileText,
  X,
  Megaphone,
  Trophy,
  Crown,
  Landmark,
  CheckCircle2,
  Scale,
  Send,
  Flag,
  DollarSign,
  Users,
  Eye,
  Sliders,
  Check
} from 'lucide-react';

export interface ExecutiveAlertItem {
  id: string;
  senderName: string;
  senderRole: string;
  senderAvatar: string;
  senderBadge?: string;
  organization?: string;
  subject: string;
  preview: string;
  body: string;
  targetRole: 'fa_president' | 'club_owner' | 'agent' | 'all';
  category: 'urgent_crisis' | 'governance_directive' | 'transfer_bid' | 'client_demand' | 'scout_intel' | 'board_directive' | 'ethics_audit' | 'election_intel' | 'commercial';
  urgency: 'urgent' | 'breaking' | 'important' | 'normal';
  timestamp: string;
  read: boolean;
  actionTab?: string;
  actionLabel?: string;
  impactNote?: string;
  actionPayload?: any;
  targetPlayerName?: string;
}

interface ExecutiveInboxProps {
  agency: AgencyState;
  players: Player[];
  clubs?: Club[];
  onOpenTab: (tab: string) => void;
  onOpenPlayerModal?: (player: Player) => void;
  onStartNegotiation?: (player: Player) => void;
  addToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ExecutiveInbox: React.FC<ExecutiveInboxProps> = ({
  agency,
  players,
  clubs = [],
  onOpenTab,
  onOpenPlayerModal,
  onStartNegotiation,
  addToast
}) => {
  const currentRole = (agency.activeRoles?.currentRole || 'agent') as 'agent' | 'club_owner' | 'fa_president';
  const [roleChannelFilter, setRoleChannelFilter] = useState<'active_role' | 'fa_president' | 'club_owner' | 'agent' | 'all'>('active_role');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAlert, setSelectedAlert] = useState<ExecutiveAlertItem | null>(null);
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(new Set());

  const currentWeek = agency.currentWeek || 1;
  const currentSeason = agency.currentSeason || 1;
  const myClients = useMemo(() => players.filter(p => p.isMyClient), [players]);
  const discontentClients = useMemo(() => myClients.filter(p => p.unrest && p.unrest.status !== 'content'), [myClients]);

  // Determine active displayed role for UI skinning
  const displayedRole = roleChannelFilter === 'active_role' 
    ? currentRole 
    : roleChannelFilter === 'all' 
    ? currentRole 
    : roleChannelFilter;

  // Generate dynamic, role-tailored alerts based on live simulation state
  const allGeneratedAlerts = useMemo(() => {
    const list: ExecutiveAlertItem[] = [];

    // ==========================================
    // 1. FA PRESIDENT: URGENT FEDERATION ALERTS
    // ==========================================
    const pState = agency.presidency;
    const scandalLevel = pState?.conflictScandalLevel || 10;
    const approvalRating = pState?.approvalRating || 68;
    const influence = pState?.politicalInfluence || 55;
    const activePolicies = pState?.activePolicies;
    const continent = pState?.federationContinent || 'Europe';

    // FA Alert 1: National Team & Tactical Directive
    list.push({
      id: `fa_nat_team_${currentSeason}_${currentWeek}`,
      senderName: 'Director of National Teams - Roberto Mancini',
      senderRole: 'National Technical Committee',
      senderAvatar: '🏆',
      senderBadge: '🏛️ Federation Council',
      organization: `${continent} Football Confederation`,
      subject: `🚨 URGENT FEDERATION ALERT: National Squad Selection & Tournament Preparations`,
      preview: `Managerial staff report high tactical pressure. National squad call-ups require presidential oversight before qualification rounds.`,
      body: `Mr. President,\n\nThe National Technical Committee has convened ahead of the upcoming qualification cycle. We are monitoring ${myClients.length} domestic star athletes eligible for selection.\n\nSeveral club chairmen are lobbying against international friendlies due to fixture congestion. As FA President, your political influence (${influence}/100) and council standing will dictate squad clearance and federation staff budget allocations.\n\nWe urgently request your attendance in the FA Council chambers to confirm regulatory exemptions.\n\nRespectfully,\nRoberto Mancini\nHead of Technical Committee`,
      targetRole: 'fa_president',
      category: 'urgent_crisis',
      urgency: 'urgent',
      timestamp: `Wk ${currentWeek}, Season ${currentSeason}`,
      read: readAlertIds.has(`fa_nat_team_${currentSeason}_${currentWeek}`),
      actionTab: 'fa_presidency',
      actionLabel: 'Open FA Council',
      impactNote: 'Affects National Squad prestige and manager harmony.'
    });

    // FA Alert 2: Ethics Committee & Conflict of Interest Warning
    if (scandalLevel >= 20 || agency.activeRoles?.agent) {
      list.push({
        id: `fa_ethics_${currentSeason}_${currentWeek}`,
        senderName: 'FIFA Independent Ethics Committee',
        senderRole: 'Chief Regulatory Investigator',
        senderAvatar: '⚖️',
        senderBadge: '🚨 Ethics Chamber',
        organization: 'FIFA Headquarters (Zurich)',
        subject: `⚖️ REGULATORY DOSSIER: Dual-Role Scrutiny & Conflict of Interest Assessment`,
        preview: `Current conflict scandal level registered at ${scandalLevel}%. Dual representation under active review.`,
        body: `President ${agency.agentName},\n\nThis is an official notice from the FIFA Integrity and Compliance Division. Your dual engagement in football agency operations (${agency.agencyName}) alongside federation executive duties is under quarterly audit.\n\nYour conflict risk metric is currently evaluated at ${scandalLevel}%. Under Article 19 of FIFA Governance Statutes, any insider transfers involving your clients or siphoning of federation development subsidies may result in formal investigatory proceedings.\n\nPlease ensure full transparency disclosures are submitted via the Presidential Decree portal.\n\nOffice of the Ethics Secretariat\nFIFA House, Zurich`,
        targetRole: 'fa_president',
        category: 'ethics_audit',
        urgency: scandalLevel >= 40 ? 'breaking' : 'urgent',
        timestamp: `Wk ${currentWeek}, Season ${currentSeason}`,
        read: readAlertIds.has(`fa_ethics_${currentSeason}_${currentWeek}`),
        actionTab: 'fa_presidency',
        actionLabel: 'Audit & Decrees Desk',
        impactNote: 'Failure to manage conflict scandal can trigger FIFA sanctions.'
      });
    }

    // FA Alert 3: Regional Delegates & Electoral Challenger Intel
    list.push({
      id: `fa_election_${currentSeason}_${currentWeek}`,
      senderName: 'Federation General Secretariat',
      senderRole: 'Council Speaker',
      senderAvatar: '🗳️',
      senderBadge: '🏛️ Electoral Watch',
      organization: 'FA Electoral Commission',
      subject: `🏛️ FEDERATION INTELLIGENCE: Delegate Sentiment & Re-Election Pulse`,
      preview: `Executive approval rating currently stands at ${approvalRating}%. Regional voting blocs preparing agenda for next Congress.`,
      body: `Mr. President,\n\nWe have compiled the weekly sentiment index across regional member associations:\n\n• Current Council Approval Rating: ${approvalRating}%\n• Political Influence Score: ${influence}/100\n• Active Policies: Foreign Cap (${activePolicies?.foreignPlayerLimit || 5}), Agent Cap (${activePolicies?.agentCommissionCap || 15}%)\n\nRegional delegates from lower divisions are demanding a 10% increase in grassroots development subsidies. Passing popular decrees or reducing referee VAR controversies will solidify your delegate majority ahead of the next Congress.\n\nGeneral Secretariat Desk`,
      targetRole: 'fa_president',
      category: 'election_intel',
      urgency: 'important',
      timestamp: `Wk ${currentWeek}, Season ${currentSeason}`,
      read: readAlertIds.has(`fa_election_${currentSeason}_${currentWeek}`),
      actionTab: 'fa_presidency',
      actionLabel: 'Review Council Votes',
      impactNote: 'Maintains presidential tenure and unlocks higher confederation tiers.'
    });

    // FA Alert 4: League Refereeing & VAR Controversy
    list.push({
      id: `fa_var_${currentSeason}_${currentWeek}`,
      senderName: 'Chief Refereeing Officer - Pierluigi Collina',
      senderRole: 'Referees Disciplinary Board',
      senderAvatar: '🟨',
      senderBadge: '⚽ League Governance',
      organization: 'National Referees Committee',
      subject: `📢 GOVERNANCE DIRECTIVE: VAR Protocol & Homegrown Quota Enforcement`,
      preview: `Club presidents demand review of strict VAR guidelines and 25-player roster registration thresholds.`,
      body: `President ${agency.agentName},\n\nThe National League Board has filed an official petition regarding matchday disciplinary thresholds.\n\nSeveral top-tier clubs are failing to meet the Homegrown Quota (Minimum ${activePolicies?.minHomegrownQuota || 8} domestic trained players) and have requested special presidential waivers. Enforcing strict penalties protects youth academies but may provoke league boycott threats.\n\nYou may adjust the VAR Strictness and Homegrown quotas from the Federation Directives panel.\n\nPierluigi Collina\nChief of Referees`,
      targetRole: 'fa_president',
      category: 'governance_directive',
      urgency: 'normal',
      timestamp: `Wk ${currentWeek}, Season ${currentSeason}`,
      read: readAlertIds.has(`fa_var_${currentSeason}_${currentWeek}`),
      actionTab: 'fa_presidency',
      actionLabel: 'Adjust Policies & VAR',
      impactNote: 'Shapes match card frequency and domestic youth development.'
    });

    // ==========================================
    // 2. CLUB OWNER: PRESIDENTIAL BOARDROOM INBOX
    // ==========================================
    const presidentClubId = agency.presidency?.clubId;
    const clubPowers = (presidentClubId && agency.clubPresidentPowers ? agency.clubPresidentPowers[presidentClubId] : undefined) || (agency.clubPresidentPowers ? Object.values(agency.clubPresidentPowers)[0] : undefined);
    const fanApproval = clubPowers?.fanApproval || 74;
    const boardApproval = clubPowers?.boardApproval || 80;

    // Club Alert 1: Head Manager Tactical Report & Roster Needs
    list.push({
      id: `club_mgr_${currentSeason}_${currentWeek}`,
      senderName: 'Head Coach - Mikel Arteta',
      senderRole: 'First Team Manager',
      senderAvatar: '👔',
      senderBadge: '👑 Boardroom Memo',
      organization: 'First Team Tactical Staff',
      subject: `📋 PRESIDENTIAL BOARDROOM MEMO: Squad Depth & Mid-Season Roster Review`,
      preview: `Managerial staff requesting reinforcement in attack and defense. Squad morale standing at 82%.`,
      body: `Mr. Chairman,\n\nOur coaching staff has completed the weekly tactical review. The squad is performing well, but we are vulnerable to fatigue during high-density match weeks.\n\nBoard Approval: ${boardApproval}%\nFan Approval: ${fanApproval}%\n\nWe recommend either investing in Medical Center upgrades (Level ${clubPowers?.medicalCenterLevel || 1}) to reduce injury durations or authorizing transfer funds to bring in depth options.\n\nYours in sport,\nHead Manager`,
      targetRole: 'club_owner',
      category: 'board_directive',
      urgency: 'important',
      timestamp: `Wk ${currentWeek}, Season ${currentSeason}`,
      read: readAlertIds.has(`club_mgr_${currentSeason}_${currentWeek}`),
      actionTab: 'club_ownership',
      actionLabel: 'Club Dashboard',
      impactNote: 'Improves first team win probability and board satisfaction.'
    });

    // Club Alert 2: Commercial Sponsorship & Stadium Revenue
    list.push({
      id: `club_comm_${currentSeason}_${currentWeek}`,
      senderName: 'Chief Commercial Officer',
      senderRole: 'Corporate Partnerships',
      senderAvatar: '🏟️',
      senderBadge: '👑 Commercial Desk',
      organization: 'Club Commercial Operations',
      subject: `💰 COMMERCIAL BRIEFING: Stadium Naming Rights & Matchday Gate Revenue`,
      preview: `Sponsorship consortium submits new commercial proposal. Stadium capacity currently at ${clubPowers?.stadiumSeats ? clubPowers.stadiumSeats.toLocaleString() : '45,000'}.`,
      body: `President ${agency.agentName},\n\nOur corporate sales division has received inquiries from global airline and crypto partners seeking front-of-shirt and stadium naming rights.\n\nUpgrading the stadium infrastructure (Level ${clubPowers?.stadiumLevel || 2}) will increase weekly matchday revenue and attract higher tier sponsorship guarantees.\n\nPlease review the expansion proposals in the Club Ownership Hub.\n\nCommercial Directorate`,
      targetRole: 'club_owner',
      category: 'commercial',
      urgency: 'normal',
      timestamp: `Wk ${currentWeek}, Season ${currentSeason}`,
      read: readAlertIds.has(`club_comm_${currentSeason}_${currentWeek}`),
      actionTab: 'club_ownership',
      actionLabel: 'Stadium & Sponsors',
      impactNote: 'Boosts weekly operational cashflow and FFP solvency.'
    });

    // ==========================================
    // 3. AGENT: EXECUTIVE AGENT & TRANSFER DESK
    // ==========================================
    // Agent Alert 1: Discontent Client
    if (discontentClients.length > 0) {
      const p = discontentClients[0];
      list.push({
        id: `agent_unrest_${p.id}_${currentWeek}`,
        senderName: p.name,
        senderRole: `Client (${p.position} - ${p.clubName})`,
        senderAvatar: p.flag || '⚽',
        senderBadge: '💼 Client Dispatch',
        organization: p.clubName,
        subject: `⚠️ URGENT CLIENT DISPUTE: Wage & Transfer Grievance - ${p.name}`,
        preview: `Client discontent at ${p.unrest?.discontentLevel || 75}%. Demanding immediate contract upgrade or transfer listing.`,
        body: `Dear ${agency.agentName},\n\nI am reaching out with extreme urgency regarding my status at ${p.clubName}. I feel completely undervalued by the sporting director.\n\nIssue: ${p.unrest?.reasonLabel || 'Wage & Playing Time Dispute'}\nDiscontent Metric: ${p.unrest?.discontentLevel || 75}%\n\nIf you don't secure me an improved wage package or initiate transfer negotiations with interested clubs, I will be forced to terminate our representation mandate!\n\n${p.name}`,
        targetRole: 'agent',
        category: 'client_demand',
        urgency: 'urgent',
        timestamp: `Wk ${currentWeek}, Season ${currentSeason}`,
        read: readAlertIds.has(`agent_unrest_${p.id}_${currentWeek}`),
        actionTab: 'unrest_hotline',
        actionLabel: 'Open Unrest Hotline',
        impactNote: 'Resolve quickly to prevent client firing and market value drops.',
        targetPlayerName: p.name
      });
    }

    // Agent Alert 2: Major Transfer Bid
    if (myClients.length > 0) {
      const star = myClients[0];
      const offeredFee = Math.round((star.value || 15000000) * 1.3);
      const offeredWage = Math.round((star.wage || 60000) * 1.4);

      list.push({
        id: `agent_bid_${star.id}_${currentWeek}`,
        senderName: 'Txiki Begiristain',
        senderRole: 'Director of Football',
        senderAvatar: '💼',
        senderBadge: '💰 Transfer Wire',
        organization: 'Manchester City FC',
        subject: `💰 FORMAL TRANSFER BID: Official Inquiry for ${star.name} (${formatMoney(offeredFee)})`,
        preview: `Top European giant submits opening proposal of ${formatMoney(offeredFee)} with €${(offeredWage).toLocaleString()}/wk terms.`,
        body: `Dear ${agency.agentName},\n\nManchester City has formally tracked ${star.name} (${star.position}, Rating: ${star.rating}, Age: ${star.age}).\n\nWe are prepared to submit a structured transfer package totaling ${formatMoney(offeredFee)} with personal wages of ${formatMoney(offeredWage)}/week and a guaranteed 15% agent commission fee upon signing.\n\nWe look forward to initiating official transfer negotiations immediately.\n\nTxiki Begiristain\nDirector of Football`,
        targetRole: 'agent',
        category: 'transfer_bid',
        urgency: 'breaking',
        timestamp: `Wk ${currentWeek}, Season ${currentSeason}`,
        read: readAlertIds.has(`agent_bid_${star.id}_${currentWeek}`),
        actionTab: 'transfer_market',
        actionLabel: 'Transfer Desk',
        impactNote: 'High commission windfall potential upon deal closure.',
        targetPlayerName: star.name
      });
    }

    // Agent Alert 3: Scout Intelligence
    list.push({
      id: `agent_scout_${currentSeason}_${currentWeek}`,
      senderName: 'Chief Scout - Marco Rossi',
      senderRole: 'Global Scouting Network',
      senderAvatar: '🔍',
      senderBadge: '✨ Scout Dossier',
      organization: `${agency.agencyName} Talent Division`,
      subject: `✨ SCOUT DOSSIER: 16-Year-Old South American Playmaker Discovered`,
      preview: `Identified generational talent with 93+ Potential in Santos youth academy. European scouts circling.`,
      body: `Boss,\n\nOur South American talent network has just flagged an exceptional 16-year-old attacking midfielder. His vision, ball control, and acceleration are elite (Potential 90-95).\n\nOther rival agencies are attempting to contact his family. We have an immediate window to approach and sign him to our roster before his market value explodes.\n\nScout Marco Rossi\nHead of Youth Recruitment`,
      targetRole: 'agent',
      category: 'scout_intel',
      urgency: 'important',
      timestamp: `Wk ${currentWeek}, Season ${currentSeason}`,
      read: readAlertIds.has(`agent_scout_${currentSeason}_${currentWeek}`),
      actionTab: 'scouting',
      actionLabel: 'View Scouting Hub',
      impactNote: 'Opportunity to represent a future world-class superstar.'
    });

    return list;
  }, [agency, myClients, discontentClients, currentWeek, currentSeason, readAlertIds]);

  // Filter alerts by role channel and categories
  const filteredAlerts = useMemo(() => {
    return allGeneratedAlerts.filter(alert => {
      // Role Channel filtering
      if (roleChannelFilter === 'active_role') {
        const matchesActive = alert.targetRole === currentRole || alert.targetRole === 'all';
        if (!matchesActive) return false;
      } else if (roleChannelFilter !== 'all') {
        const matchesExplicit = alert.targetRole === roleChannelFilter || alert.targetRole === 'all';
        if (!matchesExplicit) return false;
      }

      // Category filter
      if (categoryFilter === 'urgent_only') {
        if (alert.urgency !== 'urgent' && alert.urgency !== 'breaking') return false;
      } else if (categoryFilter === 'unread_only') {
        if (alert.read) return false;
      } else if (categoryFilter !== 'all') {
        if (alert.category !== categoryFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery = 
          alert.subject.toLowerCase().includes(q) ||
          alert.preview.toLowerCase().includes(q) ||
          alert.senderName.toLowerCase().includes(q) ||
          alert.body.toLowerCase().includes(q) ||
          (alert.organization && alert.organization.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [allGeneratedAlerts, roleChannelFilter, currentRole, categoryFilter, searchQuery]);

  const unreadCount = useMemo(() => {
    return filteredAlerts.filter(a => !a.read).length;
  }, [filteredAlerts]);

  const urgentCount = useMemo(() => {
    return filteredAlerts.filter(a => a.urgency === 'urgent' || a.urgency === 'breaking').length;
  }, [filteredAlerts]);

  const handleMarkAsRead = (id: string) => {
    setReadAlertIds(prev => new Set([...prev, id]));
  };

  const handleMarkAllRead = () => {
    const allIds = filteredAlerts.map(a => a.id);
    setReadAlertIds(prev => new Set([...prev, ...allIds]));
    if (addToast) addToast('All executive alerts marked as read.', 'info');
  };

  // Get Role Theme & Styling configuration
  const roleThemeConfig = useMemo(() => {
    if (displayedRole === 'fa_president') {
      return {
        title: 'Urgent Federation Alerts & Presidential Dossier',
        subtitle: 'FIFA Governance Directives, Ethics Inquiries, Delegate Petitions, & Council Mandates',
        icon: Landmark,
        badgeLabel: '🏛️ FA PRESIDENTIAL DESK',
        badgeColor: 'bg-blue-600 text-white border-blue-400/40',
        cardBg: 'from-slate-900 via-blue-950/20 to-slate-900',
        borderColor: 'border-blue-500/30',
        accentColor: 'text-blue-400',
        buttonGradient: 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500',
        roleCategories: [
          { id: 'all', label: 'All Federation Alerts' },
          { id: 'urgent_only', label: '🚨 Urgent / Crisis Only' },
          { id: 'governance_directive', label: '🏛️ Directives' },
          { id: 'ethics_audit', label: '⚖️ Ethics & Audits' },
          { id: 'election_intel', label: '🗳️ Electoral Intel' }
        ]
      };
    } else if (displayedRole === 'club_owner') {
      return {
        title: 'Presidential Boardroom Directives & Club Intelligence',
        subtitle: 'Executive Board Memos, Head Coach Tactical Reports, Fan Ultra Inquiries, & Stadium Operations',
        icon: Crown,
        badgeLabel: '👑 CLUB PRESIDENTIAL DESK',
        badgeColor: 'bg-amber-500 text-slate-950 border-amber-400/50',
        cardBg: 'from-slate-900 via-amber-950/20 to-slate-900',
        borderColor: 'border-amber-500/30',
        accentColor: 'text-amber-400',
        buttonGradient: 'from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950',
        roleCategories: [
          { id: 'all', label: 'All Directives' },
          { id: 'urgent_only', label: '🚨 High Priority Only' },
          { id: 'board_directive', label: '👔 Tactical & Squad' },
          { id: 'commercial', label: '🏟️ Stadium & Revenue' }
        ]
      };
    } else {
      return {
        title: 'Executive Agent Inbox & Transfer Wire',
        subtitle: 'Direct Memos from Sporting Directors, Discontent Clients, Scout Inquiries, & Licensing',
        icon: Briefcase,
        badgeLabel: '💼 SUPER-AGENT COMMAND DESK',
        badgeColor: 'bg-emerald-600 text-white border-emerald-400/40',
        cardBg: 'from-slate-900 via-emerald-950/20 to-slate-900',
        borderColor: 'border-emerald-500/30',
        accentColor: 'text-emerald-400',
        buttonGradient: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
        roleCategories: [
          { id: 'all', label: 'All Mails' },
          { id: 'urgent_only', label: '🚨 Urgent Demands' },
          { id: 'transfer_bid', label: '💰 Transfer Bids' },
          { id: 'client_demand', label: '⚠️ Client Grievances' },
          { id: 'scout_intel', label: '✨ Scout Dossiers' }
        ]
      };
    }
  }, [displayedRole]);

  const HeaderIcon = roleThemeConfig.icon;

  return (
    <div id="executive-inbox-section" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
      {/* Top Header Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className={`p-3 rounded-2xl border shrink-0 ${
            displayedRole === 'fa_president' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
            displayedRole === 'club_owner' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
            'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          }`}>
            <HeaderIcon className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-sm ${roleThemeConfig.badgeColor}`}>
                {roleThemeConfig.badgeLabel}
              </span>
              <h3 className="font-black text-lg text-white">
                {roleThemeConfig.title}
              </h3>
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase animate-pulse">
                  {unreadCount} New Alert{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {roleThemeConfig.subtitle}
            </p>
          </div>
        </div>

        {/* Top Controls & Mark Read */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
          <button
            id="mark-all-inbox-read-btn"
            onClick={handleMarkAllRead}
            className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 px-3.5 py-2 rounded-xl font-bold cursor-pointer transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Role Channel Switcher Banner */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-slate-400 text-[11px] font-extrabold uppercase shrink-0 px-1 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-amber-400" />
            <span>Office Feed:</span>
          </span>

          {[
            { id: 'active_role', label: `🎯 My Active Role (${currentRole === 'fa_president' ? 'FA President' : currentRole === 'club_owner' ? 'Club President' : 'Super-Agent'})` },
            { id: 'fa_president', label: '🏛️ Urgent Federation Alerts' },
            { id: 'club_owner', label: '👑 Club Boardroom' },
            { id: 'agent', label: '💼 Agent Transfer Wire' },
            { id: 'all', label: '🌐 All Executive Channels' },
          ].map((ch) => (
            <button
              key={ch.id}
              id={`role-channel-tab-${ch.id}`}
              onClick={() => {
                setRoleChannelFilter(ch.id as any);
                setCategoryFilter('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                roleChannelFilter === ch.id
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>

        {/* Quick Summary Counts */}
        <div className="flex items-center gap-2 text-xs shrink-0 font-medium text-slate-400">
          <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            Total: <strong className="text-white">{filteredAlerts.length}</strong>
          </span>
          {urgentCount > 0 && (
            <span className="bg-red-500/10 text-red-300 border border-red-500/30 px-2.5 py-1 rounded-lg font-bold">
              Urgent: <strong>{urgentCount}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full sm:w-auto">
          {roleThemeConfig.roleCategories.map(cat => (
            <button
              key={cat.id}
              id={`inbox-category-tab-${cat.id}`}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-slate-700 text-white font-black shadow'
                  : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            id="executive-inbox-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts, directives..."
            className="bg-transparent text-xs text-white focus:outline-none w-full"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Alert Feed Items */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-200">No Pending Alerts in Selected Channel</h4>
            <p className="text-xs text-slate-500">
              {displayedRole === 'fa_president'
                ? 'Your federation council decrees are up-to-date and all regulatory dockets are currently clear.'
                : displayedRole === 'club_owner'
                ? 'Boardroom directives and stadium operations are operating stably.'
                : 'No urgent client grievances or pending transfer bids at this time.'}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isUnread = !alert.read;
            const isHighUrgency = alert.urgency === 'urgent' || alert.urgency === 'breaking';

            return (
              <div
                key={alert.id}
                id={`alert-card-${alert.id}`}
                onClick={() => {
                  setSelectedAlert(alert);
                  handleMarkAsRead(alert.id);
                }}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                  isUnread
                    ? isHighUrgency
                      ? 'bg-gradient-to-r from-red-950/30 via-slate-900 to-slate-900 border-red-500/50 shadow-lg shadow-red-950/20 hover:border-red-400'
                      : alert.targetRole === 'fa_president'
                      ? 'bg-gradient-to-r from-blue-950/30 via-slate-900 to-slate-900 border-blue-500/40 shadow-lg hover:border-blue-400'
                      : 'bg-slate-850 border-sky-500/40 shadow-md ring-1 ring-sky-500/20 hover:border-sky-400'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-80 hover:opacity-100 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`text-2xl p-2.5 rounded-2xl border shrink-0 ${
                    alert.urgency === 'breaking' || alert.urgency === 'urgent'
                      ? 'bg-red-500/20 border-red-500/40 text-red-300'
                      : alert.targetRole === 'fa_president'
                      ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                      : alert.targetRole === 'club_owner'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-200'
                  }`}>
                    {alert.senderAvatar}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {alert.senderBadge && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {alert.senderBadge}
                        </span>
                      )}

                      <span className="font-extrabold text-xs text-white">{alert.senderName}</span>
                      <span className="text-[10px] text-slate-400">({alert.senderRole})</span>

                      {isUnread && (
                        <span className="bg-sky-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                          NEW
                        </span>
                      )}

                      {alert.urgency === 'breaking' && (
                        <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase animate-pulse">
                          BREAKING
                        </span>
                      )}

                      {alert.urgency === 'urgent' && (
                        <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                          ACTION REQUIRED
                        </span>
                      )}
                    </div>

                    <h4 className={`font-extrabold text-xs sm:text-sm leading-snug ${
                      alert.urgency === 'breaking' || alert.urgency === 'urgent'
                        ? 'text-rose-200 group-hover:text-white'
                        : alert.targetRole === 'fa_president'
                        ? 'text-blue-200 group-hover:text-white'
                        : 'text-slate-100 group-hover:text-white'
                    }`}>
                      {alert.subject}
                    </h4>

                    <p className="text-[11px] text-slate-400 line-clamp-1 leading-relaxed">
                      {alert.preview}
                    </p>

                    {alert.impactNote && (
                      <p className="text-[10px] text-amber-400/90 font-medium">
                        ⚡ Impact: {alert.impactNote}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Action / Timestamp Strip */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-2.5 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono font-medium">{alert.timestamp}</span>

                  <div className="flex items-center gap-2">
                    {alert.actionTab && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(alert.id);
                          onOpenTab(alert.actionTab!);
                        }}
                        className={`text-[11px] font-black px-3 py-1.5 rounded-xl border flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer ${
                          alert.targetRole === 'fa_president'
                            ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/50'
                            : alert.targetRole === 'club_owner'
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 font-black'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/50'
                        }`}
                      >
                        <span>{alert.actionLabel || 'Proceed'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <span className="text-xs text-sky-400 font-bold hidden sm:flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                      Inspect <Eye className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FULL ALERT DETAIL MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedAlert(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-750 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-4 pr-8">
              <div className="text-3xl p-3 bg-slate-800 rounded-2xl border border-slate-700 shrink-0">
                {selectedAlert.senderAvatar}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedAlert.senderBadge && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {selectedAlert.senderBadge}
                    </span>
                  )}
                  <h3 className="font-extrabold text-sm text-white">{selectedAlert.senderName}</h3>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {selectedAlert.senderRole} {selectedAlert.organization ? `• ${selectedAlert.organization}` : ''}
                </p>
                <p className="text-xs text-sky-300 font-bold mt-1">{selectedAlert.subject}</p>
                <p className="text-[10px] text-slate-500 font-mono">{selectedAlert.timestamp}</p>
              </div>
            </div>

            {/* Modal Content Letter Body */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-3 font-sans leading-relaxed text-xs text-slate-200 whitespace-pre-line max-h-[320px] overflow-y-auto">
              {selectedAlert.body}
            </div>

            {selectedAlert.impactNote && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Impact Assessment: {selectedAlert.impactNote}</span>
              </div>
            )}

            {/* Modal Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => setSelectedAlert(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer min-h-[40px]"
              >
                Close Memo
              </button>

              {/* Direct negotiation launcher if applicable */}
              {selectedAlert.category === 'transfer_bid' && onStartNegotiation && selectedAlert.targetPlayerName && (
                <button
                  onClick={() => {
                    const targetP = players.find(p => p.name === selectedAlert.targetPlayerName) || myClients[0];
                    if (targetP) {
                      setSelectedAlert(null);
                      onStartNegotiation(targetP);
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition min-h-[40px]"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Negotiate Transfer Contract</span>
                </button>
              )}

              {/* Action Tab Direct Trigger */}
              {selectedAlert.actionTab && (
                <button
                  onClick={() => {
                    const tab = selectedAlert.actionTab!;
                    setSelectedAlert(null);
                    onOpenTab(tab);
                  }}
                  className={`font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition min-h-[40px] ${
                    selectedAlert.targetRole === 'fa_president'
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : selectedAlert.targetRole === 'club_owner'
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  <span>{selectedAlert.actionLabel || 'Execute Action'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
