import React from 'react';
import { 
  BarChart2, Award, Users, AlertTriangle, ShieldCheck, 
  Download, Calendar, TrendingUp, RefreshCw, Star, CheckCircle, Clock
} from 'lucide-react';
import { DashboardStats } from '../types';

interface ManagerDashboardProps {
  stats: DashboardStats;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function ManagerDashboard({ stats, onRefresh, isRefreshing }: ManagerDashboardProps) {
  // Convert response time ms to readable hours/mins
  const formatTime = (ms: number) => {
    if (!ms) return '0 mins';
    const totalMins = Math.round(ms / 1000 / 60);
    if (totalMins < 60) return `${totalMins} mins`;
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${hrs}h ${mins}m`;
  };

  // Safe percentage calculation for priority distributions
  const getTotalForPriority = () => {
    return (stats.byPriority.low || 0) + 
           (stats.byPriority.medium || 0) + 
           (stats.byPriority.high || 0) + 
           (stats.byPriority.urgent || 0) || 1;
  };

  const priorityPercentages = {
    low: Math.round(((stats.byPriority.low || 0) / getTotalForPriority()) * 100),
    medium: Math.round(((stats.byPriority.medium || 0) / getTotalForPriority()) * 100),
    high: Math.round(((stats.byPriority.high || 0) / getTotalForPriority()) * 100),
    urgent: Math.round(((stats.byPriority.urgent || 0) / getTotalForPriority()) * 100),
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-800 tracking-tight">Executive Management Console</h1>
          <p className="text-xs text-slate-400 mt-1">Audit SLA compliance ratings, overall agent productivity speeds, and satisfaction surveys.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh Analytics</span>
          </button>
          
          <a
            href="/api/reports/export"
            download="nexus_tickets_report.csv"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Download size={12} />
            <span>Export Corporate CSV</span>
          </a>
        </div>
      </div>

      {/* 1. Main KPI Indicators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition duration-300" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Active Tickets</span>
          <div className="text-3xl font-display font-semibold text-slate-800 mt-2">{stats.totalTickets}</div>
          <div className="flex gap-2 text-[10px] text-slate-400 mt-3 font-medium">
            <span className="text-emerald-600">{stats.openTickets} open</span>
            <span>•</span>
            <span className="text-amber-600">{stats.pendingTickets} pending</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition duration-300" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SLA Compliance Rate</span>
          <div className="text-3xl font-display font-semibold text-emerald-600 mt-2">{stats.slaComplianceRate}%</div>
          <div className="text-[10px] text-slate-400 mt-3 font-medium flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-500" /> Goal: &gt;95% Target Compliance
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-amber-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition duration-300" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg First Response</span>
          <div className="text-3xl font-display font-semibold text-slate-800 mt-2">{formatTime(stats.avgResponseTimeMs)}</div>
          <div className="text-[10px] text-slate-400 mt-3 font-medium flex items-center gap-1">
            <Clock size={12} className="text-indigo-400" /> Average across all departments
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-purple-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition duration-300" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Satisfaction</span>
          <div className="text-3xl font-display font-semibold text-amber-500 mt-2 flex items-baseline gap-1">
            <span>{stats.avgCsat}</span>
            <span className="text-xs text-slate-400">/ 5.0</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-3 font-medium flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={11} fill={i < Math.round(stats.avgCsat) ? '#f59e0b' : 'none'} className="text-amber-500" />
            ))}
            <span className="ml-1">CSAT Average</span>
          </div>
        </div>
      </div>

      {/* 2. Graphical Visualizers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Visualizer 1: Ticket distribution by Status (Custom Responsive SVG Chart) */}
        <div className="lg:col-span-8 bg-white border border-slate-100 p-6 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Ticket Volumetric Load by Department</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Live distribution of customer cases assigned to respective queues.</p>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase">
              By Category
            </span>
          </div>

          <div className="h-64 flex items-end justify-between px-6 pt-4 border-b border-slate-100 pb-1 relative">
            {/* Guide Gridlines */}
            <div className="absolute w-full h-full left-0 top-0 pointer-events-none flex flex-col justify-between opacity-5 pr-6 pb-1">
              <div className="border-t border-slate-800 w-full" />
              <div className="border-t border-slate-800 w-full" />
              <div className="border-t border-slate-800 w-full" />
              <div className="border-t border-slate-800 w-full" />
            </div>

            {/* Render Bars for Categories */}
            {Object.entries(stats.byCategory || {}).map(([category, count]) => {
              // Calculate scaled height. Default total limit to 10 for neat height rendering
              const maxCount = Math.max(...Object.values(stats.byCategory), 1);
              const heightPercent = Math.max((count / maxCount) * 80, 15); // limit between 15% and 80%

              return (
                <div key={category} className="flex flex-col items-center gap-2 group w-1/4">
                  {/* Tooltip */}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white font-mono text-[10px] px-2 py-1 rounded shadow-md leading-none mb-1">
                    {count} tickets
                  </span>
                  
                  {/* Actual Bar */}
                  <div 
                    className="w-12 bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-xl transition-all duration-500 relative group-hover:shadow-lg group-hover:shadow-indigo-100"
                    style={{ height: `${heightPercent}%` }}
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-white/20 rounded-t-xl" />
                  </div>

                  {/* Axis Label */}
                  <span className="text-[10px] text-slate-500 font-medium truncate max-w-full">
                    {category}
                  </span>
                </div>
              );
            })}

            {Object.keys(stats.byCategory || {}).length === 0 && (
              <div className="w-full text-center text-slate-400 text-xs pb-20">
                No tickets registered in DB.
              </div>
            )}
          </div>
        </div>

        {/* Visualizer 2: Priority breakdown & SLA Warnings (Right Panel) */}
        <div className="lg:col-span-4 bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-6">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Criticality & Queue Severity</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Percent allocation of active tickets classified by priority levels.</p>
          </div>

          <div className="space-y-4">
            {/* Priority: Urgent */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-red-600 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" /> Urgent
                </span>
                <span className="text-slate-600 font-mono">{stats.byPriority.urgent || 0} ({priorityPercentages.urgent}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${priorityPercentages.urgent}%` }} />
              </div>
            </div>

            {/* Priority: High */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-orange-500">High</span>
                <span className="text-slate-600 font-mono">{stats.byPriority.high || 0} ({priorityPercentages.high}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${priorityPercentages.high}%` }} />
              </div>
            </div>

            {/* Priority: Medium */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-500">Medium</span>
                <span className="text-slate-600 font-mono">{stats.byPriority.medium || 0} ({priorityPercentages.medium}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${priorityPercentages.medium}%` }} />
              </div>
            </div>

            {/* Priority: Low */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-blue-500">Low</span>
                <span className="text-slate-600 font-mono">{stats.byPriority.low || 0} ({priorityPercentages.low}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${priorityPercentages.low}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-500 flex items-start gap-2.5">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <div>
              <h4 className="font-semibold text-slate-700 text-[11px]">SLA Escalations Enabled</h4>
              <p className="text-[10px] mt-0.5 leading-relaxed">
                Tickets categorized as "Urgent" bypass the triage queue and send webhooks to on-call support engineers automatically.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Analytics Activity Stream */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">System Auditor Real-Time activity timeline</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Chronological ledger of security and triage changes made across tickets.</p>
        </div>

        <div className="relative border-l border-slate-100 pl-4 ml-2 space-y-4 max-h-60 overflow-y-auto">
          {stats.recentActivity.map((activity, idx) => (
            <div key={activity.id} className="relative text-xs">
              {/* Timeline dot */}
              <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-600 border-2 border-white shadow-xs" />
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="font-semibold text-slate-800">{activity.action}</span>
                  <span className="text-slate-400 mx-1.5">•</span>
                  <span className="text-slate-600">{activity.details}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                  by <strong className="text-slate-500">{activity.actorName}</strong> • {new Date(activity.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {stats.recentActivity.length === 0 && (
            <div className="text-center py-6 text-slate-400">
              No recent audit trail entries registered.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
