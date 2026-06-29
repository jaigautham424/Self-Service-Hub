import React, { useState } from 'react';
import { 
  Terminal, ShieldCheck, Database, RefreshCw, Cpu, 
  Search, AlertTriangle, ShieldAlert, CheckCircle2, Sliders, Zap
} from 'lucide-react';
import { AuditLog, Ticket } from '../types';

interface AdminPanelProps {
  logs: AuditLog[];
  tickets: Ticket[];
  onRefreshLogs: () => void;
  onRefreshTickets: () => void;
  isRefreshing: boolean;
}

export function AdminPanel({ logs, tickets, onRefreshLogs, onRefreshTickets, isRefreshing }: AdminPanelProps) {
  const [searchLog, setSearchLog] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [breachSuccess, setBreachSuccess] = useState<string | null>(null);

  // Filter logs based on search criteria
  const filteredLogs = logs.filter(log => {
    const term = searchLog.toLowerCase();
    const actionMatch = selectedAction ? log.action === selectedAction : true;
    const stringMatch = 
      log.details.toLowerCase().includes(term) ||
      log.actorName.toLowerCase().includes(term) ||
      (log.ticketId && log.ticketId.toLowerCase().includes(term));
    
    return actionMatch && stringMatch;
  });

  // Extract unique actions for quick filters
  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  // SLA Breach simulation logic
  const handleSimulateSlaBreach = async (ticketId: string) => {
    try {
      // Fetch ticket to update its deadlines to timestamps in the past
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: 'admin-1', // Simulated as Admin
          priority: 'urgent',
          status: 'open'
        })
      });

      if (res.ok) {
        setBreachSuccess(`Successfully updated Ticket ${ticketId} status to "Urgent" to trigger active SLA escalation warnings!`);
        onRefreshTickets();
        onRefreshLogs();
        setTimeout(() => setBreachSuccess(null), 5000);
      }
    } catch (e) {
      console.error("Simulation failed:", e);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-800 tracking-tight">System Administration & Diagnostics</h1>
          <p className="text-xs text-slate-400 mt-1">Audit low-level server environments, diagnostic heartbeat monitors, and execute simulation payloads.</p>
        </div>

        <button
          onClick={() => { onRefreshLogs(); onRefreshTickets(); }}
          disabled={isRefreshing}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
          <span>Sync Diagnostics</span>
        </button>
      </div>

      {/* 1. Live System Heartbeats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Card 1 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Cpu size={20} />
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Node.js Express Gateway</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-semibold text-xs text-slate-800">ONLINE • Port 3000</span>
            </div>
          </div>
        </div>

        {/* Status Card 2 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Terminal size={20} />
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Gemini AI Client SDK</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-semibold text-xs text-slate-800">CONNECTED • Gemini 3.5 Flash</span>
            </div>
          </div>
        </div>

        {/* Status Card 3 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Database size={20} />
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Database Persistence</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-semibold text-xs text-slate-800">LOCAL STORAGE • db.json File</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SLA Simulation Playground */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
          <Sliders size={14} className="text-indigo-600" /> Escalation Simulation Playground
        </h3>

        {breachSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{breachSuccess}</span>
          </div>
        )}

        <p className="text-xs text-slate-500">
          To audit how our manager alarms, priority queues, and email timers process severe customer escalations, select a ticket below to artificially elevate its priority status to **Urgent**:
        </p>

        <div className="flex flex-wrap gap-2">
          {tickets.map(t => (
            <button
              key={t.id}
              onClick={() => handleSimulateSlaBreach(t.id)}
              className="bg-slate-50 border border-slate-200 hover:border-indigo-300 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Zap size={12} className="text-amber-500" />
              <span>Escalate {t.id} to Urgent</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Comprehensive Master Audit Trail Ledger */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-50 pb-4">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Centralized Audit Log Ledger</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Filter the complete secure chronological history of all database mutations.</p>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search actor name, ticket ID, details..."
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:border-indigo-500 transition text-slate-800 placeholder-slate-400"
              />
            </div>

            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer text-slate-600"
            >
              <option value="">All Actions</option>
              {uniqueActions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Master Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-100">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action</th>
                <th className="p-3">Ticket</th>
                <th className="p-3">Actor / Agent</th>
                <th className="p-3">Ledger Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/40 text-slate-700">
                  <td className="p-3 text-slate-400 font-medium whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3">
                    {log.ticketId ? (
                      <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                        {log.ticketId}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-800">{log.actorName}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-medium">{log.actorRole}</div>
                  </td>
                  <td className="p-3 text-slate-600 leading-relaxed max-w-sm">
                    {log.details}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No matching audit entries registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
