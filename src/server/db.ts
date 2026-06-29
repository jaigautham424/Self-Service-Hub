import fs from 'fs';
import path from 'path';
import { Ticket, User, Message, KBArticle, AuditLog, DashboardStats, TicketPriority } from '../types';

const DB_FILE = path.join(process.cwd(), 'db.json');

interface DatabaseSchema {
  users: User[];
  tickets: Ticket[];
  messages: Message[];
  kbArticles: KBArticle[];
  auditLogs: AuditLog[];
}

const DEFAULT_USERS: User[] = [
  {
    id: 'customer-1',
    name: 'Alice Cooper',
    email: 'alice@example.com',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80'
  },
  {
    id: 'customer-2',
    name: 'Marcus Aurelius',
    email: 'marcus@example.com',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'
  },
  {
    id: 'agent-1',
    name: 'Bob Miller',
    email: 'bob@example.com',
    role: 'agent',
    department: 'Technical',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80'
  },
  {
    id: 'agent-2',
    name: 'Sarah Connor',
    email: 'sarah@example.com',
    role: 'agent',
    department: 'Billing',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80'
  },
  {
    id: 'manager-1',
    name: 'Charles Xavier',
    email: 'charles@example.com',
    role: 'manager',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80'
  },
  {
    id: 'admin-1',
    name: 'Diana Prince',
    email: 'diana@example.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
  }
];

const DEFAULT_KB_ARTICLES: KBArticle[] = [
  {
    id: 'kb-1',
    title: 'How to Reset Your Premium Account Password',
    category: 'Account Setup',
    content: 'To reset your password, navigate to the Login page and click on the "Forgot Password" link. Enter your registered email address and check your inbox for a password reset link. Follow the link to enter a secure, new password consisting of at least 12 characters, including numbers and symbols. If you do not receive the email, please check your spam folder or reach out to our Technical team.',
    views: 1420,
    helpfulCount: 382,
    unhelpfulCount: 12,
    tags: ['password', 'reset', 'security', 'login']
  },
  {
    id: 'kb-2',
    title: 'Setting Up Auto-Renew and Understanding Billing Cycles',
    category: 'Billing',
    content: 'All premium enterprise subscriptions are billed annually or monthly based on your selected plan. To enable or disable auto-renew, head to Billing Settings in your Admin Console. Toggle the "Automatic Renewal" switch. Payments are processed 24 hours prior to the cycle end. If a payment fails, our system attempts recovery three times over a 7-day grace period before account suspension.',
    views: 950,
    helpfulCount: 220,
    unhelpfulCount: 24,
    tags: ['billing', 'payment', 'auto-renew', 'invoice']
  },
  {
    id: 'kb-3',
    title: 'Custom Subdomain and DNS CNAME Mapping Guide',
    category: 'Technical',
    content: 'To map your custom subdomain (e.g., support.yourcompany.com) to our service, you must create a CNAME record in your domain registrar (e.g., GoDaddy, Cloudflare). Point the CNAME host to "ingress.nexus.enterprise.com". After configuring DNS, wait 10-15 minutes for propagation. Then, enter your custom domain in the Platform Settings dashboard, where an SSL certificate will be automatically generated and provisioned within 5 minutes.',
    views: 2450,
    helpfulCount: 610,
    unhelpfulCount: 5,
    tags: ['dns', 'cname', 'subdomain', 'ssl', 'domain']
  },
  {
    id: 'kb-4',
    title: 'Configuring Multi-Factor Authentication (MFA)',
    category: 'Account Setup',
    content: 'Nexus Support enforces secure authentication. To enable MFA, click your avatar and select "Security Settings". Click "Enable MFA" and scan the generated QR code using an authenticator app of your choice (such as Google Authenticator or 1Password). Input the 6-digit confirmation code. Make sure to download and store the recovery codes in a secure location, as they will be required if you lose access to your authenticator device.',
    views: 1100,
    helpfulCount: 295,
    unhelpfulCount: 3,
    tags: ['mfa', 'totp', 'security', 'authenticator']
  },
  {
    id: 'kb-5',
    title: 'API Rate Limits and Webhook Deliveries',
    category: 'Features',
    content: 'Enterprise subscriptions have a rate limit of 10,000 API requests per minute. Standard plans have a limit of 1,000 requests per minute. When rate limits are reached, the API returns an HTTP 429 Too Many Requests status code. Webhooks are delivered via POST requests to your configured URL. We require webhooks to respond with a 2xx status code within 5 seconds, otherwise we retry with an exponential backoff over a 24-hour window.',
    views: 820,
    helpfulCount: 198,
    unhelpfulCount: 1,
    tags: ['api', 'rate-limit', 'webhook', 'developers']
  }
];

const DEFAULT_TICKETS: Ticket[] = [
  {
    id: 'tick-1001',
    title: 'Billing discrepancies on annual Enterprise license renewals',
    description: 'We were charged twice on our renewal invoice INV-2026-9483. We requested a single corporate invoice for 50 seats but our card on file was billed for 50 seats and a separate invoice was also issued for manual bank transfer. Please refund the credit card charge and keep the manual invoice active.',
    status: 'open',
    priority: 'high',
    customerId: 'customer-1',
    customerName: 'Alice Cooper',
    customerEmail: 'alice@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    assignedAgentId: 'agent-2',
    assignedAgentName: 'Sarah Connor',
    department: 'Billing',
    tags: ['Double Billing', 'Renewal', 'Enterprise'],
    aiMetadata: {
      sentiment: -0.65,
      sentimentLabel: 'negative',
      intent: 'billing_dispute',
      suggestedCategory: 'Billing',
      confidenceScore: 0.94,
      suggestedResponse: 'Hello Alice, I am very sorry for the duplicate billing. I have located invoice INV-2026-9483 and confirmed both the automatic credit card charge and the pending manual transfer. I am initiating an immediate refund of the card payment ($4,800), which should reflect in 3-5 business days. The manual transfer invoice will remain active as requested.'
    },
    sla: {
      responseTimeLimit: '4h',
      resolutionTimeLimit: '24h',
      responseTimeDeadline: Date.now() + 4 * 60 * 60 * 1000,
      resolutionTimeDeadline: Date.now() + 24 * 60 * 60 * 1000,
      isResponseBreached: false,
      isResolutionBreached: false
    },
    createdAt: Date.now() - 30 * 60 * 1000, // 30 mins ago
    updatedAt: Date.now() - 30 * 60 * 1000
  },
  {
    id: 'tick-1002',
    title: 'API Webhook signature validation failing with SHA256 mismatch',
    description: 'We are trying to set up webhooks for our ticket updates. However, the HMAC SHA256 signature we calculate on our end does not match the x-nexus-signature header included in your HTTP POST request. We are using the exact webhook secret provided in our settings. Please check if your signature schema has changed.',
    status: 'pending',
    priority: 'high',
    customerId: 'customer-2',
    customerName: 'Marcus Aurelius',
    customerEmail: 'marcus@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    assignedAgentId: 'agent-1',
    assignedAgentName: 'Bob Miller',
    department: 'Technical',
    tags: ['Webhooks', 'API', 'HMAC-SHA256'],
    aiMetadata: {
      sentiment: -0.2,
      sentimentLabel: 'neutral',
      intent: 'api_bug',
      suggestedCategory: 'Technical',
      confidenceScore: 0.89,
      suggestedResponse: 'Hello Marcus, we recently updated our signature encoder to include a UTF-8 string encoding guard. Please ensure you are hashing the raw bytes of the request body, not the parsed JSON string, as whitespaces can vary. Let me know if you are using Node, Python, or Go so I can provide a copy-pasteable validator code snippet.'
    },
    sla: {
      responseTimeLimit: '2h',
      resolutionTimeLimit: '8h',
      responseTimeDeadline: Date.now() - 15 * 60 * 1000, // breached response 15 mins ago
      resolutionTimeDeadline: Date.now() + 7 * 60 * 60 * 1000,
      isResponseBreached: true,
      isResolutionBreached: false,
      firstRespondedAt: Date.now() - 5 * 60 * 1000
    },
    createdAt: Date.now() - 3 * 60 * 60 * 1000, // 3 hrs ago
    updatedAt: Date.now() - 5 * 60 * 1000
  }
];

const DEFAULT_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    ticketId: 'tick-1001',
    senderId: 'customer-1',
    senderName: 'Alice Cooper',
    senderRole: 'customer',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    text: 'We were charged twice on our renewal invoice INV-2026-9483. We requested a single corporate invoice for 50 seats but our card on file was billed for 50 seats and a separate invoice was also issued for manual bank transfer. Please refund the credit card charge and keep the manual invoice active.',
    createdAt: Date.now() - 30 * 60 * 1000
  },
  {
    id: 'msg-2',
    ticketId: 'tick-1002',
    senderId: 'customer-2',
    senderName: 'Marcus Aurelius',
    senderRole: 'customer',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    text: 'We are trying to set up webhooks for our ticket updates. However, the HMAC SHA256 signature we calculate on our end does not match the x-nexus-signature header included in your HTTP POST request. We are using the exact webhook secret provided in our settings. Please check if your signature schema has changed.',
    createdAt: Date.now() - 3 * 60 * 60 * 1000
  },
  {
    id: 'msg-3',
    ticketId: 'tick-1002',
    senderId: 'agent-1',
    senderName: 'Bob Miller',
    senderRole: 'agent',
    senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
    text: 'Hello Marcus, let me look into this. Could you let me know what programming language you are using to validate the signature? Sometimes whitespace formatting differences can cause signature mismatches.',
    createdAt: Date.now() - 5 * 60 * 1000
  }
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    ticketId: 'tick-1001',
    action: 'CREATE_TICKET',
    actorName: 'Alice Cooper',
    actorRole: 'customer',
    details: 'Ticket created with "High" priority and routing set to Billing department.',
    createdAt: Date.now() - 30 * 60 * 1000
  },
  {
    id: 'log-2',
    ticketId: 'tick-1002',
    action: 'CREATE_TICKET',
    actorName: 'Marcus Aurelius',
    actorRole: 'customer',
    details: 'Ticket created with "High" priority and routing set to Technical department.',
    createdAt: Date.now() - 3 * 60 * 60 * 1000
  },
  {
    id: 'log-3',
    ticketId: 'tick-1002',
    action: 'ASSIGN_AGENT',
    actorName: 'System Router',
    actorRole: 'admin',
    details: 'AI Agent recommended Bob Miller based on department (Technical) and skillset.',
    createdAt: Date.now() - 2.9 * 60 * 60 * 1000
  }
];

export class Database {
  private static load(): DatabaseSchema {
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = {
        users: DEFAULT_USERS,
        tickets: DEFAULT_TICKETS,
        messages: DEFAULT_MESSAGES,
        kbArticles: DEFAULT_KB_ARTICLES,
        auditLogs: DEFAULT_AUDIT_LOGS
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error parsing db file, resetting to defaults', e);
      const initial: DatabaseSchema = {
        users: DEFAULT_USERS,
        tickets: DEFAULT_TICKETS,
        messages: DEFAULT_MESSAGES,
        kbArticles: DEFAULT_KB_ARTICLES,
        auditLogs: DEFAULT_AUDIT_LOGS
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
  }

  private static save(data: DatabaseSchema) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  // Users
  static getUsers(): User[] {
    return this.load().users;
  }

  static getUserById(id: string): User | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  // Tickets
  static getTickets(): Ticket[] {
    return this.load().tickets;
  }

  static getTicketById(id: string): Ticket | undefined {
    return this.getTickets().find(t => t.id === id);
  }

  static createTicket(ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'sla'> & { sla?: Partial<Ticket['sla']> }): Ticket {
    const db = this.load();
    const id = 'tick-' + (1000 + db.tickets.length + 1);
    
    const responseLimit = ticketData.priority === 'urgent' ? '1h' : ticketData.priority === 'high' ? '4h' : '12h';
    const responseHours = ticketData.priority === 'urgent' ? 1 : ticketData.priority === 'high' ? 4 : 12;
    const resolutionHours = ticketData.priority === 'urgent' ? 4 : ticketData.priority === 'high' ? 24 : 48;
    
    const newTicket: Ticket = {
      ...ticketData,
      id,
      sla: {
        responseTimeLimit: responseLimit,
        resolutionTimeLimit: `${resolutionHours}h`,
        responseTimeDeadline: Date.now() + responseHours * 60 * 60 * 1000,
        resolutionTimeDeadline: Date.now() + resolutionHours * 60 * 60 * 1000,
        isResponseBreached: false,
        isResolutionBreached: false,
        ...ticketData.sla
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    db.tickets.push(newTicket);
    this.save(db);
    
    // Auto add initial message
    this.createMessage({
      ticketId: id,
      senderId: ticketData.customerId,
      senderName: ticketData.customerName,
      senderRole: 'customer',
      senderAvatar: ticketData.customerAvatar,
      text: ticketData.description
    });

    // Log action
    this.addAuditLog({
      ticketId: id,
      action: 'CREATE_TICKET',
      actorName: ticketData.customerName,
      actorRole: 'customer',
      details: `Ticket created with "${ticketData.priority}" priority. Assigned to ${ticketData.department} department.`
    });

    return newTicket;
  }

  static updateTicket(id: string, updates: Partial<Ticket>, actor: User): Ticket | undefined {
    const db = this.load();
    const index = db.tickets.findIndex(t => t.id === id);
    if (index === -1) return undefined;

    const oldTicket = db.tickets[index];
    const updatedTicket = {
      ...oldTicket,
      ...updates,
      updatedAt: Date.now()
    };

    // Calculate SLA actions or logs
    const logs: string[] = [];
    if (updates.status && updates.status !== oldTicket.status) {
      logs.push(`Status changed from "${oldTicket.status}" to "${updates.status}"`);
      if (updates.status === 'resolved' || updates.status === 'closed') {
        updatedTicket.sla.resolvedAt = Date.now();
        updatedTicket.sla.isResolutionBreached = Date.now() > oldTicket.sla.resolutionTimeDeadline;
      }
    }
    if (updates.priority && updates.priority !== oldTicket.priority) {
      logs.push(`Priority changed from "${oldTicket.priority}" to "${updates.priority}"`);
    }
    if (updates.assignedAgentId && updates.assignedAgentId !== oldTicket.assignedAgentId) {
      logs.push(`Assigned agent changed to ${updates.assignedAgentName || updates.assignedAgentId}`);
    }

    db.tickets[index] = updatedTicket;
    this.save(db);

    // Write audit logs
    logs.forEach(log => {
      this.addAuditLog({
        ticketId: id,
        action: updates.status && updates.status !== oldTicket.status ? 'UPDATE_STATUS' : 'UPDATE_TICKET',
        actorName: actor.name,
        actorRole: actor.role,
        details: log
      });
    });

    return updatedTicket;
  }

  static submitCSAT(id: string, rating: number, feedback?: string): Ticket | undefined {
    const db = this.load();
    const index = db.tickets.findIndex(t => t.id === id);
    if (index === -1) return undefined;

    db.tickets[index].csat = {
      rating,
      feedback,
      createdAt: Date.now()
    };
    
    db.tickets[index].status = 'closed'; // CSAT usually auto-closes resolved tickets
    db.tickets[index].updatedAt = Date.now();
    this.save(db);

    this.addAuditLog({
      ticketId: id,
      action: 'SUBMIT_CSAT',
      actorName: db.tickets[index].customerName,
      actorRole: 'customer',
      details: `Customer submitted CSAT rating: ${rating}/5. ${feedback ? 'Feedback: ' + feedback : ''}`
    });

    return db.tickets[index];
  }

  // Messages
  static getMessages(ticketId?: string): Message[] {
    const msgs = this.load().messages;
    if (ticketId) {
      return msgs.filter(m => m.ticketId === ticketId);
    }
    return msgs;
  }

  static createMessage(msgData: Omit<Message, 'id' | 'createdAt'>): Message {
    const db = this.load();
    const newMessage: Message = {
      ...msgData,
      id: 'msg-' + (db.messages.length + 1),
      createdAt: Date.now()
    };
    db.messages.push(newMessage);

    // Update ticket's updatedAt and SLA first response if needed
    const ticketIndex = db.tickets.findIndex(t => t.id === msgData.ticketId);
    if (ticketIndex !== -1) {
      const ticket = db.tickets[ticketIndex];
      ticket.updatedAt = Date.now();
      
      // If it is an agent responding, set the firstRespondedAt timestamp
      if (msgData.senderRole === 'agent' && !ticket.sla.firstRespondedAt) {
        ticket.sla.firstRespondedAt = Date.now();
        ticket.sla.isResponseBreached = Date.now() > ticket.sla.responseTimeDeadline;
        
        // Log response SLA resolution
        this.addAuditLog({
          ticketId: ticket.id,
          action: 'FIRST_RESPONSE',
          actorName: msgData.senderName,
          actorRole: 'agent',
          details: `First agent response sent. Response SLA ${ticket.sla.isResponseBreached ? 'Breached' : 'Met'}.`
        });
      }
    }

    this.save(db);
    return newMessage;
  }

  // KB Articles
  static getKBArticles(): KBArticle[] {
    return this.load().kbArticles;
  }

  static trackKBView(id: string) {
    const db = this.load();
    const index = db.kbArticles.findIndex(a => a.id === id);
    if (index !== -1) {
      db.kbArticles[index].views += 1;
      this.save(db);
    }
  }

  static submitKBFeedback(id: string, helpful: boolean) {
    const db = this.load();
    const index = db.kbArticles.findIndex(a => a.id === id);
    if (index !== -1) {
      if (helpful) {
        db.kbArticles[index].helpfulCount += 1;
      } else {
        db.kbArticles[index].unhelpfulCount += 1;
      }
      this.save(db);
    }
  }

  // Audit Logs
  static getAuditLogs(ticketId?: string): AuditLog[] {
    const logs = this.load().auditLogs;
    if (ticketId) {
      return logs.filter(l => l.ticketId === ticketId);
    }
    return logs.sort((a, b) => b.createdAt - a.createdAt);
  }

  static addAuditLog(logData: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    const db = this.load();
    const newLog: AuditLog = {
      ...logData,
      id: 'log-' + (db.auditLogs.length + 1),
      createdAt: Date.now()
    };
    db.auditLogs.push(newLog);
    this.save(db);
    return newLog;
  }

  // Stats calculation
  static getStats(): DashboardStats {
    const tickets = this.getTickets();
    const auditLogs = this.getAuditLogs();
    
    const open = tickets.filter(t => t.status === 'open').length;
    const pending = tickets.filter(t => t.status === 'pending').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const closed = tickets.filter(t => t.status === 'closed').length;
    
    // SLA Compliance
    const metResponse = tickets.filter(t => t.sla.firstRespondedAt && !t.sla.isResponseBreached).length;
    const metResolution = tickets.filter(t => t.sla.resolvedAt && !t.sla.isResolutionBreached).length;
    const totalSlaActions = tickets.filter(t => t.sla.firstRespondedAt).length + tickets.filter(t => t.sla.resolvedAt).length;
    const slaComplianceRate = totalSlaActions > 0 ? Math.round(((metResponse + metResolution) / totalSlaActions) * 100) : 100;

    // Averages
    let totalResponseTimeMs = 0;
    let responseCount = 0;
    let totalResolutionTimeMs = 0;
    let resolutionCount = 0;
    let csatSum = 0;
    let csatCount = 0;

    tickets.forEach(t => {
      if (t.sla.firstRespondedAt) {
        totalResponseTimeMs += (t.sla.firstRespondedAt - t.createdAt);
        responseCount++;
      }
      if (t.sla.resolvedAt) {
        totalResolutionTimeMs += (t.sla.resolvedAt - t.createdAt);
        resolutionCount++;
      }
      if (t.csat) {
        csatSum += t.csat.rating;
        csatCount++;
      }
    });

    const byPriority = { low: 0, medium: 0, high: 0, urgent: 0 };
    const byCategory: { [category: string]: number } = {};
    const byStatus: { [status: string]: number } = {};

    tickets.forEach(t => {
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      byCategory[t.department] = (byCategory[t.department] || 0) + 1;
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    });

    return {
      totalTickets: tickets.length,
      openTickets: open,
      pendingTickets: pending,
      resolvedTickets: resolved,
      closedTickets: closed,
      avgResponseTimeMs: responseCount > 0 ? Math.round(totalResponseTimeMs / responseCount) : 0,
      avgResolutionTimeMs: resolutionCount > 0 ? Math.round(totalResolutionTimeMs / resolutionCount) : 0,
      slaComplianceRate,
      avgCsat: csatCount > 0 ? parseFloat((csatSum / csatCount).toFixed(1)) : 4.5,
      byPriority,
      byCategory,
      byStatus,
      recentActivity: auditLogs.slice(0, 15)
    };
  }
}
