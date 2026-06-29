import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Check, ArrowRight, User, Clock, ShieldAlert, AlertTriangle, 
  Tag, Send, CheckCircle2, History, RefreshCw, Layers, Clipboard, AlertCircle
} from 'lucide-react';
import { User as UserType, Ticket, Message, AuditLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AgentWorkspaceProps {
  currentUser: UserType;
  tickets: Ticket[];
  onRefreshTickets: () => void;
  onRefreshStats: () => void;
  users: UserType[];
}

export function AgentWorkspace({ currentUser, tickets, onRefreshTickets, onRefreshStats, users }: AgentWorkspaceProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(tickets[0]?.id || null);
  const [ticketDetails, setTicketDetails] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAiRegenerating, setIsAiRegenerating] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Filters state
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('');

  // Fetch complete details whenever selected ticket changes
  useEffect(() => {
    if (selectedTicketId) {
      fetchTicketData(selectedTicketId);
    } else {
      setTicketDetails(null);
      setMessages([]);
      setLogs([]);
    }
  }, [selectedTicketId]);

  const fetchTicketData = async (id: string) => {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTicketDetails(data.ticket);
        setMessages(data.messages);
        setLogs(data.logs);
      }
    } catch (e) {
      console.error("Error loading ticket info:", e);
    }
  };

  const handleUpdateTicket = async (updates: Partial<Ticket>) => {
    if (!selectedTicketId || !ticketDetails) return;
    try {
      const res = await fetch(`/api/tickets/${selectedTicketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          actorId: currentUser.id
        })
      });
      if (res.ok) {
        await fetchTicketData(selectedTicketId);
        onRefreshTickets();
        onRefreshStats();
      }
    } catch (e) {
      console.error("Error patching ticket", e);
    }
  };

  const handleSendReply = async (e: React.FormEvent, customText?: string) => {
    e.preventDefault();
    const textToSend = customText || replyText;
    if (!textToSend.trim() || !selectedTicketId) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          text: textToSend
        })
      });
      if (res.ok) {
        setReplyText('');
        await fetchTicketData(selectedTicketId);
        onRefreshTickets();
      }
    } catch (e) {
      console.error("Error replying:", e);
    } finally {
      setIsSending(false);
    }
  };

  const handleRegenerateAiDraft = async () => {
    if (!selectedTicketId) return;
    setIsAiRegenerating(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicketId}/generate-ai-draft`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        if (ticketDetails) {
          setTicketDetails({
            ...ticketDetails,
            aiMetadata: {
              ...ticketDetails.aiMetadata,
              suggestedResponse: data.suggestedResponse
            }
          });
        }
      }
    } catch (e) {
      console.error("AI Draft generation failed:", e);
    } finally {
      setIsAiRegenerating(false);
    }
  };

  const applySuggestedDraft = () => {
    if (ticketDetails?.aiMetadata?.suggestedResponse) {
      setReplyText(ticketDetails.aiMetadata.suggestedResponse);
    }
  };

  // Filtered ticket listing
  const filteredTickets = tickets.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    if (deptFilter && t.department !== deptFilter) return false;
    return true;
  });

  return (
    <div className="grid grid-cols-12 gap-0 min-h-[calc(100vh-57px)] bg-slate-50 font-sans">
      
      {/* 1. Ticket Navigation Sidebar (Left) */}
      <div className="col-span-12 md:col-span-3 border-r border-slate-200 bg-white flex flex-col h-[calc(100vh-57px)]">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <h2 className="font-display font-semibold text-slate-800 text-sm tracking-wide">Triage Queue ({filteredTickets.length})</h2>
          
          {/* Quick Filters */}
          <div className="space-y-1.5 text-xs">
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-lg p-1.5 outline-none cursor-pointer text-slate-600"
              >
                <option value="">Any Status</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-lg p-1.5 outline-none cursor-pointer text-slate-600"
              >
                <option value="">Any Urgency</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-lg p-1.5 outline-none cursor-pointer text-slate-600"
            >
              <option value="">Any Department</option>
              <option value="Billing">Billing</option>
              <option value="Technical">Technical</option>
              <option value="Features">Features</option>
              <option value="Account Setup">Account Setup</option>
            </select>
          </div>
        </div>

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredTickets.map((t) => {
            const isSelected = t.id === selectedTicketId;
            const isSlaBreached = t.sla.isResponseBreached || t.sla.isResolutionBreached;
            
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTicketId(t.id)}
                className={`p-4 cursor-pointer transition duration-150 relative ${
                  isSelected ? 'bg-indigo-50/50 border-l-4 border-indigo-600' : 'hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                    {t.id}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      t.priority === 'urgent' ? 'bg-red-50 text-red-600' :
                      t.priority === 'high' ? 'bg-orange-50 text-orange-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {t.priority}
                    </span>
                    <span className="text-[9px] font-medium text-slate-400">
                      {new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <h4 className="font-semibold text-xs text-slate-800 line-clamp-1">{t.title}</h4>
                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{t.customerName} ({t.customerEmail})</p>

                <div className="flex items-center justify-between mt-3 text-[9px] font-medium">
                  <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {t.department}
                  </span>
                  {isSlaBreached ? (
                    <span className="text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-bold animate-pulse">
                      <ShieldAlert size={10} /> SLA BREACH
                    </span>
                  ) : (
                    <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      SLA {t.sla.responseTimeLimit}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredTickets.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              No tickets matched. Adjust filters.
            </div>
          )}
        </div>
      </div>

      {/* 2. Communication Workspace (Center) */}
      <div className="col-span-12 md:col-span-6 bg-slate-50 border-r border-slate-200 flex flex-col h-[calc(100vh-57px)]">
        {ticketDetails ? (
          <>
            {/* Header / Ticket Settings */}
            <div className="bg-white p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
              <div>
                <h1 className="font-display font-semibold text-slate-800 text-sm tracking-tight">{ticketDetails.title}</h1>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Raised by <strong className="text-slate-600">{ticketDetails.customerName}</strong> • {ticketDetails.customerEmail}
                </p>
              </div>

              {/* Status Toggles & Department Escalations */}
              <div className="flex items-center gap-2">
                <select
                  value={ticketDetails.status}
                  onChange={(e) => handleUpdateTicket({ status: e.target.value as any })}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 cursor-pointer outline-none focus:border-indigo-500 transition"
                >
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <select
                  value={ticketDetails.priority}
                  onChange={(e) => handleUpdateTicket({ priority: e.target.value as any })}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 cursor-pointer outline-none focus:border-indigo-500 transition"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>

                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-[11px] font-medium ${
                    showLogs 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                  title="View Audit Logs"
                >
                  <History size={13} />
                  <span>{showLogs ? 'Chat' : 'Audit'}</span>
                </button>
              </div>
            </div>

            {/* Conversation Log / Audit Trail */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {showLogs ? (
                /* AUDIT Trail VIEW */
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
                    <History size={14} /> Immutable System Audit logs
                  </h3>
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div key={log.id} className="bg-white border border-slate-100 p-3.5 rounded-xl text-xs space-y-1 shadow-xs">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <User size={10} /> {log.actorName} ({log.actorRole})
                          </span>
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="font-semibold text-slate-800 text-[11px]">{log.action}</p>
                        <p className="text-slate-600 leading-relaxed text-[11px]">{log.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* CHAT LOG VIEW */
                <div className="space-y-4">
                  {/* Initial Description Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium mb-1.5">
                      <span>ORIGINAL TICKET FILING</span>
                      <span>•</span>
                      <span>{new Date(ticketDetails.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-semibold bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {ticketDetails.description}
                    </p>
                  </div>

                  {/* Message History */}
                  {messages.map((msg) => {
                    const isAgent = msg.senderRole === 'agent';
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-[90%] ${isAgent ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                      >
                        <img
                          src={msg.senderAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                          alt={msg.senderName}
                          className="h-7 w-7 rounded-full object-cover shrink-0 border border-slate-100"
                        />
                        <div className="space-y-1">
                          <div className={`flex items-center gap-1.5 flex-wrap ${isAgent ? 'justify-end' : ''}`}>
                            <span className="text-[10px] font-bold text-slate-700">{msg.senderName}</span>
                            <span className="text-[9px] text-slate-400">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            isAgent
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-white text-slate-700 rounded-tl-none border border-slate-200 shadow-xs'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Replying Field */}
            {ticketDetails.status !== 'closed' && (
              <form onSubmit={(e) => handleSendReply(e)} className="p-4 bg-white border-t border-slate-200">
                <textarea
                  placeholder="Type your official response..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-indigo-500 text-slate-800 h-24 resize-none mb-2"
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {ticketDetails.aiMetadata?.suggestedResponse && (
                      <button
                        type="button"
                        onClick={applySuggestedDraft}
                        className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-[10px] font-semibold hover:bg-indigo-100 transition cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles size={11} className="text-indigo-500" /> Apply Response Draft
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isSending || !replyText.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    <Send size={12} />
                    <span>Send Message</span>
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div className="m-auto text-center py-20 text-slate-400">
            <Clipboard size={48} className="mx-auto mb-3 opacity-50 text-indigo-400" />
            <h3 className="font-semibold text-slate-700 text-sm">No ticket selected</h3>
            <p className="text-xs mt-1">Select a ticket from the triage queue on the left to start processing.</p>
          </div>
        )}
      </div>

      {/* 3. AI Insights & Customer Details (Right Sidebar) */}
      <div className="col-span-12 md:col-span-3 bg-white h-[calc(100vh-57px)] overflow-y-auto p-4 space-y-6">
        {ticketDetails ? (
          <>
            {/* Customer specs */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-100 flex items-center gap-1">
                <User size={13} /> Customer Specifications
              </h3>
              <div className="flex items-center gap-2.5">
                <img 
                  src={ticketDetails.customerAvatar} 
                  alt={ticketDetails.customerName} 
                  className="h-8 w-8 rounded-full object-cover border border-slate-100"
                />
                <div>
                  <h4 className="font-semibold text-xs text-slate-800 leading-none">{ticketDetails.customerName}</h4>
                  <span className="text-[10px] text-slate-400">{ticketDetails.customerEmail}</span>
                </div>
              </div>

              {/* SLA Monitor Panel */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-4 space-y-2 border border-slate-800 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase tracking-wider text-indigo-300 font-bold">Resolution SLA</span>
                  <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                    {ticketDetails.priority}
                  </span>
                </div>
                <div className="text-xl font-mono font-bold tracking-tight text-white flex items-center gap-1.5">
                  <Clock size={16} className="text-indigo-400 animate-pulse" />
                  <span>{ticketDetails.sla.resolutionTimeLimit} Deadline</span>
                </div>
                <p className="text-[9px] text-indigo-200">
                  Must resolve before: {new Date(ticketDetails.sla.resolutionTimeDeadline).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {/* AI Insights Platform */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-100 flex items-center gap-1">
                <Sparkles size={13} className="text-indigo-600" /> Nexus AI Insights Engine
              </h3>

              {/* Sentiment Dynamic Meter */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-medium">
                  <span className="text-slate-400">Customer Sentiment</span>
                  <span className={`font-bold uppercase tracking-wider ${
                    ticketDetails.aiMetadata.sentimentLabel === 'negative' ? 'text-red-600' :
                    ticketDetails.aiMetadata.sentimentLabel === 'positive' ? 'text-green-600' :
                    'text-slate-600'
                  }`}>
                    {ticketDetails.aiMetadata.sentimentLabel} ({ticketDetails.aiMetadata.sentiment})
                  </span>
                </div>

                <div className="relative h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      ticketDetails.aiMetadata.sentiment < -0.3 ? 'bg-red-500' :
                      ticketDetails.aiMetadata.sentiment > 0.3 ? 'bg-green-500' :
                      'bg-amber-400'
                    }`}
                    style={{ 
                      width: `${Math.round(((ticketDetails.aiMetadata.sentiment + 1) / 2) * 100)}%` 
                    }}
                  />
                </div>
                <p className="text-[9px] text-slate-400 leading-relaxed">
                  Real-time sentiment analyzer evaluates anger thresholds to recommend immediate manager routing or priority escalations.
                </p>
              </div>

              {/* Classification Info */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between p-2 bg-slate-50/50 rounded-lg">
                  <span className="text-slate-400">Intent Code</span>
                  <span className="font-mono text-slate-800 font-semibold">{ticketDetails.aiMetadata.intent || 'general_query'}</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-50/50 rounded-lg">
                  <span className="text-slate-400">Suggested Dept</span>
                  <span className="font-semibold text-slate-800">{ticketDetails.aiMetadata.suggestedCategory || 'Technical'}</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-50/50 rounded-lg">
                  <span className="text-slate-400">Confidence Match</span>
                  <span className="font-semibold text-emerald-600">{Math.round((ticketDetails.aiMetadata.confidenceScore || 0.9) * 100)}%</span>
                </div>
              </div>

              {/* Suggested Response Panel */}
              <div className="border border-indigo-100 bg-indigo-50/20 rounded-xl p-4 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-700 flex items-center gap-1">
                    <Sparkles size={12} className="text-indigo-500 animate-pulse" />
                    <span>SUGGESTED RESPONSE DRAFT</span>
                  </span>
                  <button 
                    onClick={handleRegenerateAiDraft}
                    disabled={isAiRegenerating}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
                    title="Re-run AI draft generator"
                  >
                    <RefreshCw size={11} className={isAiRegenerating ? 'animate-spin' : ''} />
                  </button>
                </div>

                {ticketDetails.aiMetadata?.suggestedResponse ? (
                  <>
                    <p className="text-[11px] text-slate-600 leading-relaxed bg-white border border-slate-100 p-3 rounded-lg italic">
                      "{ticketDetails.aiMetadata.suggestedResponse}"
                    </p>
                    <button
                      onClick={applySuggestedDraft}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] py-1.5 rounded-lg font-bold shadow-sm cursor-pointer transition"
                    >
                      Use Draft Response Draft
                    </button>
                  </>
                ) : (
                  <div className="text-center py-4 text-slate-400 text-[10px]">
                    No suggestion loaded. Click refresh to query AI.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-slate-300 text-xs">
            No selection
          </div>
        )}
      </div>

    </div>
  );
}
