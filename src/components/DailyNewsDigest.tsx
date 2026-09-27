import React, { useState, useMemo } from 'react';
import { NewsItem, Player, AgencyState } from '../types';
import { filterNewsForActiveRole } from '../utils/gameEngine';
import { 
  Newspaper, 
  Flame, 
  Zap, 
  TrendingUp, 
  ChevronRight, 
  FileText, 
  Sparkles, 
  RefreshCw, 
  BarChart2, 
  Eye, 
  ShieldAlert, 
  Trophy, 
  DollarSign,
  Radio,
  Clock,
  ArrowUpRight,
  ArrowRight,
  Briefcase,
  Crown,
  Landmark
} from 'lucide-react';

interface DailyNewsDigestProps {
  news: NewsItem[];
  agency: AgencyState;
  players: Player[];
  onOpenTab: (tab: string) => void;
  onOpenPlayerModal?: (player: Player) => void;
}

export const DailyNewsDigest: React.FC<DailyNewsDigestProps> = ({
  news,
  agency,
  players,
  onOpenTab,
  onOpenPlayerModal
}) => {
  const currentRole = (agency.activeRoles?.currentRole || 'agent') as 'agent' | 'club_owner' | 'fa_president';
  const [roleChannelFilter, setRoleChannelFilter] = useState<'my_role' | 'all' | 'agent' | 'club_owner' | 'fa_president'>('my_role');
  const [digestFilter, setDigestFilter] = useState<'all' | 'transfers' | 'executive'>('all');
  const [selectedNewsDetail, setSelectedNewsDetail] = useState<NewsItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('Just now');

  // Role-scoped base news items
  const roleFilteredNews = useMemo(() => {
    if (roleChannelFilter === 'my_role') {
      return filterNewsForActiveRole(news, currentRole);
    }
    if (roleChannelFilter === 'all') {
      return news;
    }
    return filterNewsForActiveRole(news, roleChannelFilter);
  }, [news, roleChannelFilter, currentRole]);

  // Compute Digest Analytics & Summaries from role-filtered news
  const digestMetrics = useMemo(() => {
    const totalCount = roleFilteredNews.length;
    const breakingCount = roleFilteredNews.filter(n => n.urgency === 'breaking').length;
    const hotCount = roleFilteredNews.filter(n => n.urgency === 'hot').length;
    
    // Category Breakdown
    const categoryCounts: Record<string, number> = {};
    roleFilteredNews.forEach(n => {
      categoryCounts[n.category] = (categoryCounts[n.category] || 0) + 1;
    });

    let topCategory = 'Transfers & Rumors';
    let maxCatCount = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count > maxCatCount) {
        maxCatCount = count;
        topCategory = cat;
      }
    });

    // Market Sentiment heuristic
    let sentiment = 'Balanced';
    if (breakingCount > 2) sentiment = 'High Volatility / Breaking';
    else if ((categoryCounts['transfer'] || 0) > 3) sentiment = 'Bullish Transfer Window';
    else if ((categoryCounts['scandal'] || 0) > 1) sentiment = 'Media Scrutiny Heavy';
    else if ((categoryCounts['governance'] || 0) > 1) sentiment = 'Policy & Regulatory Flux';

    return {
      totalCount,
      breakingCount,
      hotCount,
      topCategory: topCategory.toUpperCase(),
      sentiment
    };
  }, [roleFilteredNews]);

  // Featured Lead Story (highest urgency or most recent)
  const leadStory = useMemo(() => {
    if (roleFilteredNews.length === 0) return null;
    const breakingStories = roleFilteredNews.filter(n => n.urgency === 'breaking');
    if (breakingStories.length > 0) return breakingStories[0];
    const hotStories = roleFilteredNews.filter(n => n.urgency === 'hot');
    if (hotStories.length > 0) return hotStories[0];
    return roleFilteredNews[0];
  }, [roleFilteredNews]);

  // Filtered stories for digest tabs
  const filteredDigestStories = useMemo(() => {
    if (digestFilter === 'transfers') {
      return roleFilteredNews.filter(n => n.category === 'transfer' || n.category === 'sponsorship');
    }
    if (digestFilter === 'executive') {
      return roleFilteredNews.filter(n => n.category === 'agency' || n.category === 'scandal' || n.category === 'dilemma' || n.category === 'governance');
    }
    return roleFilteredNews;
  }, [roleFilteredNews, digestFilter]);

  // Automated Digest Bullet Summaries tailored to role
  const generatedSummaries = useMemo(() => {
    if (roleFilteredNews.length === 0) return [];

    const summaries: Array<{
      id: string;
      title: string;
      category: string;
      bullets: string[];
      urgency: 'breaking' | 'hot' | 'normal';
      sourceItems: NewsItem[];
      actionTab?: string;
      actionLabel?: string;
    }> = [];

    // Role-specific briefs
    if (roleChannelFilter === 'fa_president' || (roleChannelFilter === 'my_role' && currentRole === 'fa_president')) {
      const govItems = roleFilteredNews.filter(n => n.category === 'governance' || n.category === 'scandal' || n.targetRole === 'fa_president');
      if (govItems.length > 0) {
        summaries.push({
          id: 'sum_gov',
          title: 'Federation Governance & Election Dossier',
          category: '🏛️ Federation Council',
          urgency: govItems.some(n => n.urgency === 'breaking') ? 'breaking' : 'hot',
          bullets: [
            `${govItems.length} regulatory directives and council intelligence items on docket.`,
            govItems[0] ? `Headline Item: "${govItems[0].headline}"` : 'Council delegates reviewing state of association.',
            `Maintain political influence and keep conflict scandals suppressed before the next Congress.`
          ],
          sourceItems: govItems,
          actionTab: 'fa_presidency',
          actionLabel: 'Open FA Council'
        });
      }
    }

    if (roleChannelFilter === 'club_owner' || (roleChannelFilter === 'my_role' && currentRole === 'club_owner')) {
      const clubItems = roleFilteredNews.filter(n => n.category === 'transfer' || n.category === 'match' || n.targetRole === 'club_owner');
      if (clubItems.length > 0) {
        summaries.push({
          id: 'sum_club',
          title: 'Presidential Club Operations & Roster Watch',
          category: '👑 Boardroom Directive',
          urgency: clubItems.some(n => n.urgency === 'breaking') ? 'breaking' : 'hot',
          bullets: [
            `${clubItems.length} club-related match reports, wage demands, and market movements.`,
            clubItems[0] ? `Roster Notice: "${clubItems[0].headline}"` : 'Tactics and financial solvency remain top priorities.',
            `Review squad depth and staff upgrades in the Club President Hub.`
          ],
          sourceItems: clubItems,
          actionTab: 'club_ownership',
          actionLabel: 'Club Dashboard'
        });
      }
    }

    // 1. Transfer Digest Brief
    const transferItems = roleFilteredNews.filter(n => n.category === 'transfer');
    if (transferItems.length > 0) {
      summaries.push({
        id: 'sum_transfer',
        title: 'Transfer Market & Contract Intelligence Digest',
        category: 'Market Watch',
        urgency: transferItems.some(n => n.urgency === 'breaking') ? 'breaking' : 'hot',
        bullets: [
          `${transferItems.length} active transfer moves and negotiations logged this period.`,
          transferItems[0] ? `Headline Deal: "${transferItems[0].headline}"` : 'Clubs actively scouting key talent.',
          `Agent commissions and player valuation trends remain highly active across top divisions.`
        ],
        sourceItems: transferItems,
        actionTab: 'transfers',
        actionLabel: 'Transfer Hub'
      });
    }

    // 2. Agency & Scandal Digest Brief
    const agencyItems = roleFilteredNews.filter(n => n.category === 'agency' || n.category === 'scandal' || n.category === 'dilemma');
    if (agencyItems.length > 0) {
      summaries.push({
        id: 'sum_agency',
        title: 'Executive Agency Operations & Media Pulse',
        category: 'Agency Intel',
        urgency: agencyItems.some(n => n.urgency === 'breaking') ? 'breaking' : 'normal',
        bullets: [
          `${agencyItems.length} key agency developments and press briefings recorded.`,
          agencyItems[0] ? `Media Highlight: "${agencyItems[0].headline}"` : 'Reputation management active.',
          `Client morale and public relations standing require continuous monitoring.`
        ],
        sourceItems: agencyItems,
        actionTab: 'news_awards',
        actionLabel: 'Press Desk'
      });
    }

    // 3. Matchday & Honors Digest Brief
    const matchItems = roleFilteredNews.filter(n => n.category === 'match' || n.category === 'award' || n.category === 'national');
    if (matchItems.length > 0) {
      summaries.push({
        id: 'sum_match',
        title: 'Performance, Awards & Matchday Briefing',
        category: 'On-Field Action',
        urgency: 'normal',
        bullets: [
          `${matchItems.length} key match highlights and player accolades tracked.`,
          matchItems[0] ? `Pitch Event: "${matchItems[0].headline}"` : 'Players competing across domestic and international fixtures.',
          `Individual player performances driving market values upward.`
        ],
        sourceItems: matchItems,
        actionTab: 'players',
        actionLabel: 'Client Roster'
      });
    }

    return summaries;
  }, [roleFilteredNews, roleChannelFilter, currentRole]);

  const handleRefreshDigest = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshedTime('Just now');
    }, 600);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Background Decorative Accent */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-md">
              <Radio className="w-3 h-3 animate-pulse" />
              Daily News Digest
            </span>
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Season {agency.currentSeason}, Week {agency.currentWeek} • Refreshed {lastRefreshedTime}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <span>Global Football Media Digest</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-xs text-slate-400">
            Automated executive press briefing synthesizing all breaking stories, transfer leaks, and agency news.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshDigest}
            disabled={isRefreshing}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 min-h-[40px]"
            title="Refresh Digest Synthesis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isRefreshing ? 'Synthesizing...' : 'Re-Sync Digest'}</span>
          </button>

          <button
            onClick={() => onOpenTab('news_awards')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg cursor-pointer min-h-[40px]"
          >
            <span>Full Newsroom</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Role Intelligence Channel Filter */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/70 border border-slate-800 p-2.5 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-slate-400 text-[11px] font-bold uppercase shrink-0 px-1">Role Intelligence:</span>
          {[
            { id: 'my_role', label: `🎯 My Active Role (${filterNewsForActiveRole(news, currentRole).length})` },
            { id: 'all', label: `🌐 Global Feed (${news.length})` },
            { id: 'agent', label: `💼 Agency Wire (${filterNewsForActiveRole(news, 'agent').length})` },
            { id: 'club_owner', label: `👑 Presidential Desk (${filterNewsForActiveRole(news, 'club_owner').length})` },
            { id: 'fa_president', label: `🏛️ Federation Gazette (${filterNewsForActiveRole(news, 'fa_president').length})` },
          ].map((channel) => (
            <button
              key={channel.id}
              onClick={() => setRoleChannelFilter(channel.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                roleChannelFilter === channel.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {channel.label}
            </button>
          ))}
        </div>
      </div>

      {/* Digest Quick Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Stories</p>
            <p className="text-lg font-black text-white">{digestMetrics.totalCount}</p>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Breaking Alerts</p>
            <p className="text-lg font-black text-red-400">{digestMetrics.breakingCount}</p>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Top Trending Sector</p>
            <p className="text-xs font-black text-amber-300 truncate max-w-[120px]">{digestMetrics.topCategory}</p>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Media Sentiment</p>
            <p className="text-xs font-black text-emerald-300 truncate max-w-[120px]">{digestMetrics.sentiment}</p>
          </div>
        </div>
      </div>

      {/* Featured Lead Story Spotlight */}
      {leadStory && (
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border border-indigo-500/30 rounded-2xl p-5 relative overflow-hidden shadow-xl space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {leadStory.roleBadge && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {leadStory.roleBadge}
                </span>
              )}
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                leadStory.urgency === 'breaking' ? 'bg-red-600 text-white animate-pulse' :
                leadStory.urgency === 'hot' ? 'bg-amber-500 text-black' : 'bg-indigo-600 text-white'
              }`}>
                ⚡ Featured Story Spotlight
              </span>
              <span className="text-xs text-slate-400 font-mono">Category: {leadStory.category.toUpperCase()}</span>
            </div>
            <span className="text-xs text-slate-400 font-semibold">Wk {leadStory.week}</span>
          </div>

          <h3 className="text-lg md:text-xl font-black text-white leading-snug">
            {leadStory.headline}
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            {leadStory.content}
          </p>

          <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedNewsDetail(leadStory)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspect Full Story</span>
              </button>

              {leadStory.actionTab && (
                <button
                  onClick={() => onOpenTab(leadStory.actionTab!)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1 transition shadow cursor-pointer"
                >
                  <span>{leadStory.actionLabel || 'Go to Module'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <span className="text-[11px] text-slate-500 italic">Source: Global Football Press Wire</span>
          </div>
        </div>
      )}

      {/* Filter Tabs for Summarized Digests */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setDigestFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              digestFilter === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Briefings
          </button>
          <button
            onClick={() => setDigestFilter('transfers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              digestFilter === 'transfers' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Transfers & Market
          </button>
          <button
            onClick={() => setDigestFilter('executive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              digestFilter === 'executive' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Agency & Governance
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          Showing {filteredDigestStories.length} articles
        </span>
      </div>

      {/* Automated Digest Summaries Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {generatedSummaries.length === 0 ? (
          <div className="col-span-3 py-8 text-center text-slate-500 italic text-xs">
            No news data available for this role channel filter. Advance weekly matches to generate fresh news!
          </div>
        ) : (
          generatedSummaries.map((sum) => (
            <div
              key={sum.id}
              className="bg-slate-950/70 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-indigo-500/20">
                    {sum.category}
                  </span>
                  {sum.urgency === 'breaking' && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white animate-pulse">
                      Breaking
                    </span>
                  )}
                </div>

                <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-300 transition leading-snug">
                  {sum.title}
                </h4>

                <ul className="space-y-1.5 pt-1">
                  {sum.bullets.map((bullet, idx) => (
                    <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                      <span className="text-indigo-400 font-bold shrink-0">•</span>
                      <span className="leading-tight">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Derived from {sum.sourceItems.length} news items</span>
                {sum.actionTab ? (
                  <button
                    onClick={() => onOpenTab(sum.actionTab!)}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>{sum.actionLabel || 'Action'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenTab('news_awards')}
                    className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Individual Stories Ticker Grid */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Latest Press Articles Feed</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
          {filteredDigestStories.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4 text-center col-span-2">No items match this digest filter.</p>
          ) : (
            filteredDigestStories.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedNewsDetail(item)}
                className="bg-slate-950/90 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl space-y-1.5 cursor-pointer transition group"
              >
                <div className="flex items-center justify-between text-[10px] flex-wrap gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.roleBadge && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {item.roleBadge}
                      </span>
                    )}
                    <span className={`font-black uppercase px-2 py-0.5 rounded ${
                      item.urgency === 'breaking' ? 'bg-red-600 text-white animate-pulse' :
                      item.urgency === 'hot' ? 'bg-amber-500 text-black font-bold' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {item.urgency}
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono">Wk {item.week} (S{item.season})</span>
                </div>

                <h5 className="font-bold text-xs text-slate-200 group-hover:text-indigo-300 transition line-clamp-1">
                  {item.headline}
                </h5>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {item.content}
                </p>

                {item.actionTab && (
                  <div className="pt-1 flex items-center justify-end">
                    <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5 group-hover:underline">
                      {item.actionLabel || 'Action'}
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Full Story Inspection Modal */}
      {selectedNewsDetail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {selectedNewsDetail.roleBadge && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                    {selectedNewsDetail.roleBadge}
                  </span>
                )}
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded ${
                  selectedNewsDetail.urgency === 'breaking' ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'
                }`}>
                  {selectedNewsDetail.category.toUpperCase()} • {selectedNewsDetail.urgency.toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Season {selectedNewsDetail.season}, Week {selectedNewsDetail.week}
              </span>
            </div>

            <h3 className="text-lg font-black text-white leading-snug">
              {selectedNewsDetail.headline}
            </h3>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
              <p>{selectedNewsDetail.content}</p>
            </div>

            <div className="flex justify-end items-center gap-2 pt-2">
              {selectedNewsDetail.actionTab && (
                <button
                  onClick={() => {
                    const targetTab = selectedNewsDetail.actionTab!;
                    setSelectedNewsDetail(null);
                    onOpenTab(targetTab);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer min-h-[40px]"
                >
                  <span>{selectedNewsDetail.actionLabel || 'Proceed to Action'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setSelectedNewsDetail(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer min-h-[40px]"
              >
                Close Story
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
