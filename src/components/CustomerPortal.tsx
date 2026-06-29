import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, BookOpen, Search, Send, CheckCircle, 
  HelpCircle, Star, ThumbsUp, ThumbsDown, MessageSquare, 
  Paperclip, AlertCircle, Clock, CheckCircle2, Archive
} from 'lucide-react';
import { User, Ticket, KBArticle, Message } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerPortalProps {
  currentUser: User;
  tickets: Ticket[];
  kbArticles: KBArticle[];
  onRefreshTickets: () => void;
  onRefreshStats: () => void;
}

export function CustomerPortal({ currentUser, tickets, kbArticles, onRefreshTickets, onRefreshStats }: CustomerPortalProps) {
  const [activeTab, setActiveTab] = useState<'kb' | 'tickets' | 'new-ticket'>('kb');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredArticles, setFilteredArticles] = useState<KBArticle[]>(kbArticles);
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  
  // Ticket form state
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [createdTicketSuccess, setCreatedTicketSuccess] = useState<Ticket | null>(null);

  // Active chat state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);

  // CSAT state
  const [csatRating, setCsatRating] = useState<number>(0);
  const [csatFeedback, setCsatFeedback] = useState('');
  const [isSubmittingCsat, setIsSubmittingCsat] = useState(false);
  const [csatSuccess, setCsatSuccess] = useState(false);

  // Search articles whenever query changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredArticles(kbArticles);
      return;
    }
    const q = searchQuery.toLowerCase();
    const filtered = kbArticles.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.content.toLowerCase().includes(q) ||
      (a.tags && a.tags.some(t => t.toLowerCase().includes(q)))
    );
    setFilteredArticles(filtered);
  }, [searchQuery, kbArticles]);

  // Load active chat messages if a ticket is selected
  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      
      // Auto-poll to simulate live agent response
      const interval = setInterval(() => {
        fetchMessages(selectedTicket.id, true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedTicket]);

  const fetchMessages = async (ticketId: string, isPoll = false) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages);
        if (!isPoll) {
          // Sync selected ticket state
          setSelectedTicket(data.ticket);
        }
      }
    } catch (e) {
      console.error("Error fetching messages:", e);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDesc.trim()) return;

    setIsSubmittingTicket(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ticketTitle,
          description: ticketDesc,
          customerId: currentUser.id,
          department: selectedDept || undefined // Allow AI default
        })
      });

      if (res.ok) {
        const newTicket = await res.json();
        setCreatedTicketSuccess(newTicket);
        setTicketTitle('');
        setTicketDesc('');
        setSelectedDept('');
        onRefreshTickets();
        onRefreshStats();
      } else {
        const err = await res.json();
        alert(`Error filing ticket: ${err.error}`);
      }
    } catch (e) {
      console.error("Error creating ticket:", e);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedTicket) return;

    const textToSend = newMessageText;
    setNewMessageText('');
    setIsSendingMessage(true);

    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          text: textToSend
        })
      });

      if (res.ok) {
        const msg = await res.json();
        setChatMessages(prev => [...prev, msg]);
        onRefreshTickets();
        
        // Simulate immediate Agent automated interaction
        setIsAgentTyping(true);
        setTimeout(async () => {
          // Fetch updated messages (which will include agent's simulated typing / auto responses)
          await fetchMessages(selectedTicket.id);
          setIsAgentTyping(false);
        }, 3000);
      }
    } catch (e) {
      console.error("Error sending message:", e);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSubmitCsat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csatRating || !selectedTicket) return;

    setIsSubmittingCsat(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/csat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: csatRating,
          feedback: csatFeedback
        })
      });

      if (res.ok) {
        setCsatSuccess(true);
        onRefreshTickets();
        onRefreshStats();
        setTimeout(() => {
          setCsatSuccess(false);
          setCsatRating(0);
          setCsatFeedback('');
          setSelectedTicket(null); // Return to list
        }, 2000);
      }
    } catch (e) {
      console.error("Error submitting CSAT:", e);
    } finally {
      setIsSubmittingCsat(false);
    }
  };

  const handleArticleFeedback = async (id: string, helpful: boolean) => {
    try {
      await fetch(`/api/kb/${id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful })
      });
      // Just visually update selected article helper counts
      if (selectedArticle && selectedArticle.id === id) {
        setSelectedArticle({
          ...selectedArticle,
          helpfulCount: helpful ? selectedArticle.helpfulCount + 1 : selectedArticle.helpfulCount,
          unhelpfulCount: !helpful ? selectedArticle.unhelpfulCount + 1 : selectedArticle.unhelpfulCount
        });
      }
    } catch (e) {
      console.error("Feedback failed", e);
    }
  };

  const customerTickets = tickets.filter(t => t.customerId === currentUser.id);

  return (
    <div className="grid grid-cols-12 gap-6 p-6 max-w-7xl mx-auto font-sans">
      {/* Sidebar Navigation */}
      <div className="col-span-12 md:col-span-3 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="h-10 w-10 rounded-full object-cover border border-slate-200"
            />
            <div>
              <h3 className="font-semibold text-slate-800 text-sm leading-tight">{currentUser.name}</h3>
              <p className="text-[11px] text-slate-400 font-medium">{currentUser.email}</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab('kb'); setSelectedArticle(null); setSelectedTicket(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-2.5 ${
                activeTab === 'kb' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BookOpen size={16} />
              <span>Self-Service KB</span>
            </button>
            <button
              onClick={() => { setActiveTab('tickets'); setSelectedArticle(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer flex items-center justify-between ${
                activeTab === 'tickets' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare size={16} />
                <span>My Tickets</span>
              </div>
              {customerTickets.length > 0 && (
                <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === 'tickets' ? 'bg-white/20 text-white' : 'bg-indigo-600 text-white'
                }`}>
                  {customerTickets.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('new-ticket'); setCreatedTicketSuccess(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-2.5 ${
                activeTab === 'new-ticket' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <PlusCircle size={16} />
              <span>File Support Ticket</span>
            </button>
          </nav>
        </div>

        {/* Dynamic Widget */}
        <div className="bg-gradient-to-br from-indigo-700 to-purple-800 text-white rounded-2xl p-6 shadow-xl shadow-indigo-500/15 space-y-4 border border-indigo-600/20">
          <div className="flex items-center gap-2 text-indigo-100 font-bold text-xs uppercase tracking-wider">
            <HelpCircle size={16} className="text-indigo-200" />
            <span>AI Deflection Active</span>
          </div>
          <p className="text-[11px] text-indigo-100/80 leading-relaxed">
            Our diagnostic crawler scans all drafted tickets instantly to recommend accurate solutions before agents need to manually triage them.
          </p>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white w-4/5 animate-pulse rounded-full" />
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="col-span-12 md:col-span-9">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: KNOWLEDGE BASE */}
          {activeTab === 'kb' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {!selectedArticle ? (
                <>
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <h1 className="text-2xl font-display font-semibold text-slate-800 tracking-tight">How can we help?</h1>
                    <p className="text-xs text-slate-400 mt-1 mb-5">Search our help articles or check out popular troubleshooting templates.</p>
                    
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search password resets, subdomains, CNAME DNS guides, invoice disputes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-xs outline-none focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredArticles.map((article) => (
                      <div
                        key={article.id}
                        onClick={() => {
                          setSelectedArticle(article);
                          fetch(`/api/kb/${article.id}`); // increment view
                        }}
                        className="bg-white border border-slate-100 p-5 rounded-2xl hover:border-indigo-200 transition-all duration-200 cursor-pointer shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {article.category}
                          </span>
                          <h3 className="font-semibold text-sm text-slate-800 mt-2.5 mb-1.5">{article.title}</h3>
                          <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{article.content}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{article.views} views</span>
                          <span>{Math.round((article.helpfulCount / (article.helpfulCount + article.unhelpfulCount + 1)) * 100)}% helpful</span>
                        </div>
                      </div>
                    ))}
                    {filteredArticles.length === 0 && (
                      <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-slate-100">
                        <HelpCircle size={40} className="mx-auto text-slate-300 mb-3" />
                        <h4 className="font-semibold text-slate-700 text-sm">No matched articles</h4>
                        <p className="text-xs text-slate-400 mt-1">Try other search terms or file a ticket directly with our engineering team.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    ← Back to Self-Service KB
                  </button>

                  <div className="pb-4 border-b border-slate-50">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {selectedArticle.category}
                    </span>
                    <h1 className="text-2xl font-display font-semibold text-slate-800 mt-3">{selectedArticle.title}</h1>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-5 rounded-2xl border border-slate-50">
                    {selectedArticle.content}
                  </p>

                  <div className="bg-slate-50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <h4 className="text-xs font-semibold text-slate-700">Was this article helpful?</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Your anonymous feedback assists us in refining our help desk material.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleArticleFeedback(selectedArticle.id, true)}
                        className="bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-medium text-slate-600 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ThumbsUp size={14} className="text-green-500" />
                        <span>Yes ({selectedArticle.helpfulCount})</span>
                      </button>
                      <button
                        onClick={() => handleArticleFeedback(selectedArticle.id, false)}
                        className="bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-medium text-slate-600 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ThumbsDown size={14} className="text-red-500" />
                        <span>No ({selectedArticle.unhelpfulCount})</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: TICKETS LIST / ACTIVE CHAT */}
          {activeTab === 'tickets' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {!selectedTicket ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h1 className="text-2xl font-display font-semibold text-slate-800 tracking-tight mb-6">Your Support Tickets</h1>
                  
                  <div className="space-y-3">
                    {customerTickets.map((ticket) => {
                      const slaDeadline = new Date(ticket.sla.resolutionTimeDeadline);
                      const isClosed = ticket.status === 'resolved' || ticket.status === 'closed';

                      return (
                        <div
                          key={ticket.id}
                          onClick={() => setSelectedTicket(ticket)}
                          className="p-4 border border-slate-100 hover:border-indigo-200 rounded-xl transition duration-200 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                                {ticket.id}
                              </span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                                ticket.status === 'open' ? 'bg-emerald-50 text-emerald-700' :
                                ticket.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {ticket.status}
                              </span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                                ticket.priority === 'urgent' ? 'bg-red-50 text-red-700 font-bold' :
                                ticket.priority === 'high' ? 'bg-orange-50 text-orange-700' :
                                'bg-blue-50 text-blue-700'
                              }`}>
                                {ticket.priority}
                              </span>
                            </div>
                            <h3 className="font-semibold text-sm text-slate-800">{ticket.title}</h3>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{ticket.description}</p>
                          </div>

                          <div className="text-right flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-50 gap-2">
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock size={12} />
                              <span>Filed {new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                            {!isClosed && (
                              <div className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                                Resolution SLA: {ticket.sla.resolutionTimeLimit}
                              </div>
                            )}
                            {ticket.status === 'resolved' && !ticket.csat && (
                              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full animate-bounce">
                                Leave Feedback!
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {customerTickets.length === 0 && (
                      <div className="text-center py-16">
                        <MessageSquare size={48} className="mx-auto text-slate-200 mb-3" />
                        <h4 className="font-semibold text-slate-700 text-sm">No active tickets found</h4>
                        <p className="text-xs text-slate-400 mt-1">If you require immediate technical or billing assistance, click "File Support Ticket" above.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Chat Timeline (Left) */}
                  <div className="md:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col h-[520px]">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                      <div>
                        <button
                          onClick={() => { setSelectedTicket(null); setCsatRating(0); setCsatFeedback(''); }}
                          className="text-xs text-slate-400 hover:text-slate-600 mb-1 cursor-pointer"
                        >
                          ← Back to My Tickets
                        </button>
                        <h2 className="font-semibold text-sm text-slate-800 line-clamp-1">{selectedTicket.title}</h2>
                      </div>
                      <span className="text-xs font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded">
                        {selectedTicket.id}
                      </span>
                    </div>

                    {/* Chat log */}
                    <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                      {chatMessages.map((msg) => {
                        const isCustomer = msg.senderRole === 'customer';
                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-3 max-w-[85%] ${isCustomer ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                          >
                            <img
                              src={msg.senderAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                              alt={msg.senderName}
                              className="h-8 w-8 rounded-full object-cover border border-slate-100 shrink-0"
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold text-slate-700">{msg.senderName}</span>
                                <span className="text-[9px] text-slate-400">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                isCustomer 
                                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                                  : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100'
                              }`}>
                                {msg.text}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {isAgentTyping && (
                        <div className="flex gap-3 mr-auto max-w-[85%]">
                          <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center font-bold text-[10px] text-indigo-600">
                            AI
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-indigo-600">Assistant Typing...</span>
                            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl rounded-tl-none text-xs flex gap-1">
                              <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chat Input */}
                    {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' ? (
                      <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-50 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Type your reply..."
                          value={newMessageText}
                          onChange={(e) => setNewMessageText(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition text-slate-800"
                        />
                        <button
                          type="submit"
                          disabled={isSendingMessage || !newMessageText.trim()}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
                        >
                          <Send size={14} />
                        </button>
                      </form>
                    ) : (
                      <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-400 font-medium">
                        🔓 This ticket is locked because it is resolved/closed.
                      </div>
                    )}
                  </div>

                  {/* CSAT Survey or Ticket Details (Right Sidebar) */}
                  <div className="md:col-span-4 space-y-4">
                    {/* CSAT Survey Panel */}
                    {selectedTicket.status === 'resolved' && !selectedTicket.csat && (
                      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-5 shadow-sm space-y-4">
                        <div className="text-center">
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Resolved
                          </span>
                          <h3 className="font-display font-semibold text-slate-800 text-base mt-2.5">Your Feedback Matters</h3>
                          <p className="text-xs text-slate-500 mt-1">Please rate your support interaction with our staff on ticket {selectedTicket.id}.</p>
                        </div>

                        {csatSuccess ? (
                          <div className="text-center py-6 text-green-600 flex flex-col items-center gap-2">
                            <CheckCircle2 size={32} />
                            <span className="font-semibold text-xs">Feedback Recorded! Thank you.</span>
                          </div>
                        ) : (
                          <form onSubmit={handleSubmitCsat} className="space-y-4">
                            <div className="flex justify-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  type="button"
                                  key={star}
                                  onClick={() => setCsatRating(star)}
                                  className="text-slate-300 hover:text-amber-400 focus:outline-none transition cursor-pointer p-1"
                                >
                                  <Star
                                    size={24}
                                    fill={star <= csatRating ? '#f59e0b' : 'none'}
                                    className={star <= csatRating ? 'text-amber-500' : 'text-slate-300'}
                                  />
                                </button>
                              ))}
                            </div>

                            <div>
                              <textarea
                                placeholder="Any comments or custom feedback (optional)..."
                                value={csatFeedback}
                                onChange={(e) => setCsatFeedback(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-indigo-500 text-slate-800 h-20 resize-none"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={isSubmittingCsat || !csatRating}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50"
                            >
                              {isSubmittingCsat ? 'Submitting...' : 'Submit Satisfaction Rating'}
                            </button>
                          </form>
                        )}
                      </div>
                    )}

                    {selectedTicket.csat && (
                      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3 text-center">
                        <CheckCircle size={24} className="mx-auto text-green-500" />
                        <h4 className="font-semibold text-slate-800 text-sm">CSAT Survey Complete</h4>
                        <div className="flex justify-center gap-1 text-amber-500">
                          {Array.from({ length: selectedTicket.csat.rating }).map((_, i) => (
                            <Star key={i} size={14} fill="#f59e0b" className="text-amber-500" />
                          ))}
                        </div>
                        {selectedTicket.csat.feedback && (
                          <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg">
                            "{selectedTicket.csat.feedback}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Standard Info Panel */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                      <h4 className="text-xs font-semibold text-slate-700 border-b border-slate-50 pb-2">Ticket Specifications</h4>
                      
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Department</span>
                          <span className="font-medium text-slate-700">{selectedTicket.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Representative</span>
                          <span className="font-medium text-indigo-600">{selectedTicket.assignedAgentName || 'Auto-Allocating...'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Response limit</span>
                          <span className="font-medium text-slate-700">{selectedTicket.sla.responseTimeLimit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">SLA Status</span>
                          <span className={`font-semibold ${selectedTicket.sla.isResponseBreached || selectedTicket.sla.isResolutionBreached ? 'text-red-500' : 'text-emerald-600'}`}>
                            {selectedTicket.sla.isResponseBreached || selectedTicket.sla.isResolutionBreached ? 'Breached' : 'Active Compliance'}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-slate-50">
                          <span className="text-slate-400 block mb-1">Index Keywords</span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedTicket.tags.map((tag, idx) => (
                              <span key={idx} className="bg-slate-50 border border-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-medium">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: FILE NEW TICKET FORM */}
          {activeTab === 'new-ticket' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-xl mx-auto"
            >
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
                {!createdTicketSuccess ? (
                  <>
                    <div>
                      <h1 className="text-2xl font-display font-semibold text-slate-800 tracking-tight">Open Support Ticket</h1>
                      <p className="text-xs text-slate-400 mt-1">Our server-side Gemini AI classifies department, urgency, and drafts suggestions instantly.</p>
                    </div>

                    <form onSubmit={handleCreateTicket} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Ticket Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., Charged twice for Enterprise annual contract renewal"
                          value={ticketTitle}
                          onChange={(e) => setTicketTitle(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs outline-none focus:border-indigo-500 transition text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Problem Description</label>
                        <textarea
                          required
                          placeholder="Provide all details including invoice numbers, error logs, or custom DNS configuration details..."
                          value={ticketDesc}
                          onChange={(e) => setTicketDesc(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs outline-none focus:border-indigo-500 transition text-slate-800 placeholder-slate-400 h-32 resize-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                          <span>Department Routing</span>
                          <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded">
                            Optional Auto-Route
                          </span>
                        </label>
                        <select
                          value={selectedDept}
                          onChange={(e) => setSelectedDept(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs outline-none focus:border-indigo-500 transition text-slate-700 cursor-pointer"
                        >
                          <option value="">Let Gemini AI Decide (Recommended)</option>
                          <option value="Billing">Billing & Subscription</option>
                          <option value="Technical">Technical Troubleshooting</option>
                          <option value="Features">Feature Requests & Integrations</option>
                          <option value="Account Setup">MFA & Password Accounts</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingTicket}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-semibold shadow-sm transition duration-200 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingTicket ? 'AI Processing & Saving...' : 'Submit Support Ticket'}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center mx-auto text-green-500">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <h2 className="text-lg font-display font-semibold text-slate-800">Support Ticket Raised!</h2>
                      <p className="text-xs text-slate-400 mt-1">Gemini has completed classification and automatically assigned a representative.</p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ticket ID</span>
                        <span className="font-mono font-bold text-indigo-600">{createdTicketSuccess.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Classified Category</span>
                        <span className="font-medium text-slate-700">{createdTicketSuccess.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">AI Priority score</span>
                        <span className="font-medium text-slate-700 uppercase">{createdTicketSuccess.priority}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">SLA Response window</span>
                        <span className="font-semibold text-amber-600">{createdTicketSuccess.sla.responseTimeLimit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Customer Sentiment</span>
                        <span className="font-semibold text-indigo-600 capitalize">{createdTicketSuccess.aiMetadata.sentimentLabel}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => { setSelectedTicket(createdTicketSuccess); setActiveTab('tickets'); }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
                    >
                      Open Live Chat Timeline
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
