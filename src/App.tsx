import React, { useState, useEffect } from 'react';
import { RoleSelector } from './components/RoleSelector.tsx';
import { CustomerPortal } from './components/CustomerPortal.tsx';
import { AgentWorkspace } from './components/AgentWorkspace.tsx';
import { ManagerDashboard } from './components/ManagerDashboard.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { User, Ticket, KBArticle, AuditLog, DashboardStats } from './types';
import { BookOpen, ShieldAlert, Sliders, BarChart3, MessageSquare, ShieldCheck, LogOut, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [kbArticles, setKbArticles] = useState<KBArticle[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // Loading & Action feedback
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [aiSweepActive, setAiSweepActive] = useState(false);

  // Sync state from server APIs
  useEffect(() => {
    bootstrapApp();
  }, []);

  const bootstrapApp = async () => {
    setIsLoading(true);
    try {
      // 1. Load simulated user database
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const usersList: User[] = await usersRes.json();
        setUsers(usersList);
        
        // Default to first customer Alice Cooper for self-service triage
        const defaultCustomer = usersList.find(u => u.role === 'customer') || usersList[0];
        setCurrentUser(defaultCustomer);
      }

      // 2. Load KB Articles
      const kbRes = await fetch('/api/kb');
      if (kbRes.ok) {
        const kbData = await kbRes.json();
        setKbArticles(kbData);
      }

      // 3. Load Tickets, Stats, and Logs
      await refreshAllData();

    } catch (e) {
      console.error("Bootstrapping Nexus Support app failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAllData = async () => {
    setIsRefreshing(true);
    try {
      const tRes = await fetch('/api/tickets');
      if (tRes.ok) {
        const ticketList = await tRes.json();
        setTickets(ticketList);
      }

      const sRes = await fetch('/api/stats');
      if (sRes.ok) {
        const statsData = await sRes.json();
        setStats(statsData);
      }

      const lRes = await fetch('/api/logs');
      if (lRes.ok) {
        const logsData = await lRes.json();
        setLogs(logsData);
      }
    } catch (e) {
      console.error("Refreshing stats and tickets failed:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUserChange = (user: User) => {
    setAiSweepActive(true);
    setCurrentUser(user);
    refreshAllData();
    setTimeout(() => setAiSweepActive(false), 1200);
  };

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans text-slate-100 gap-4">
        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-center space-y-1">
          <h2 className="font-display font-semibold text-sm tracking-wide">NEXUS SUPPORT PLATFORM</h2>
          <p className="text-xs text-slate-500">Initializing AI Classifiers & Mounting Database Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* 1. Simulator Top-bar */}
      <RoleSelector
        currentUser={currentUser}
        onUserChange={handleUserChange}
        users={users}
        isAiReclassifying={aiSweepActive}
      />

      {/* 2. Top Portal Header Info bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 ${
            currentUser.role === 'customer' ? 'bg-indigo-50 text-indigo-700' :
            currentUser.role === 'agent' ? 'bg-amber-50 text-amber-700' :
            currentUser.role === 'manager' ? 'bg-purple-50 text-purple-700' :
            'bg-slate-900 text-slate-100'
          }`}>
            {currentUser.role === 'customer' ? <MessageSquare size={18} /> :
             currentUser.role === 'agent' ? <Sliders size={18} /> :
             currentUser.role === 'manager' ? <BarChart3 size={18} /> :
             <ShieldCheck size={18} />}
          </div>
          <div>
            <h1 className="font-display font-bold text-slate-800 text-sm leading-none flex items-center gap-2">
              <span>{currentUser.role === 'customer' ? 'Customer Self-Service Hub' :
                    currentUser.role === 'agent' ? 'Engineering Triage Console' :
                    currentUser.role === 'manager' ? 'Analytics Intelligence Center' :
                    'Platform Command Deck'}</span>
              <span className="text-[10px] text-slate-400 font-normal">•</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded tracking-wider">
                {currentUser.role} Workspace
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged in as <strong className="text-slate-600">{currentUser.name}</strong> ({currentUser.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role === 'customer' && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
              <BookOpen size={13} className="text-indigo-500" />
              <span>Self-service saves average of 42% on ticket load metrics.</span>
            </div>
          )}
          {currentUser.role === 'agent' && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
              <strong className="text-amber-800">SLA Watch active</strong>
              <span>• Resolve critical items inside windows.</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Role-Based Dynamic Screen Rendering */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {currentUser.role === 'customer' && (
            <motion.div
              key="customer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <CustomerPortal
                currentUser={currentUser}
                tickets={tickets}
                kbArticles={kbArticles}
                onRefreshTickets={refreshAllData}
                onRefreshStats={refreshAllData}
              />
            </motion.div>
          )}

          {currentUser.role === 'agent' && (
            <motion.div
              key="agent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <AgentWorkspace
                currentUser={currentUser}
                tickets={tickets}
                onRefreshTickets={refreshAllData}
                onRefreshStats={refreshAllData}
                users={users}
              />
            </motion.div>
          )}

          {currentUser.role === 'manager' && stats && (
            <motion.div
              key="manager"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ManagerDashboard
                stats={stats}
                onRefresh={refreshAllData}
                isRefreshing={isRefreshing}
              />
            </motion.div>
          )}

          {currentUser.role === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <AdminPanel
                logs={logs}
                tickets={tickets}
                onRefreshLogs={refreshAllData}
                onRefreshTickets={refreshAllData}
                isRefreshing={isRefreshing}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-4 text-center text-[10px] text-slate-400 font-medium">
        <span>© 2026 Nexus Support SaaS Engine Inc. Connected with Gemini 3.5 Flash server-side pipeline. All logs immutable.</span>
      </footer>
    </div>
  );
}
