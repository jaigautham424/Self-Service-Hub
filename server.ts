import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Database } from './src/server/db.js';
import { analyzeTicket, generateSmartReply } from './src/server/ai.js';
import { User, TicketStatus, TicketPriority } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes FIRST

// Get all users
app.get('/api/users', (req: Request, res: Response) => {
  try {
    const users = Database.getUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get tickets (supports filtering by customerId or agentId)
app.get('/api/tickets', (req: Request, res: Response) => {
  try {
    const { customerId, agentId, department, status } = req.query;
    let tickets = Database.getTickets();

    if (customerId) {
      tickets = tickets.filter(t => t.customerId === customerId);
    }
    if (agentId) {
      tickets = tickets.filter(t => t.assignedAgentId === agentId);
    }
    if (department) {
      tickets = tickets.filter(t => t.department === department);
    }
    if (status) {
      tickets = tickets.filter(t => t.status === status);
    }

    res.json(tickets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single ticket with messages and logs
app.get('/api/tickets/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = Database.getTicketById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    const messages = Database.getMessages(id);
    const logs = Database.getAuditLogs(id);

    res.json({ ticket, messages, logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new support ticket (with AI Auto-Classification)
app.post('/api/tickets', async (req: Request, res: Response) => {
  try {
    const { title, description, customerId, department: requestedDepartment } = req.body;
    
    if (!title || !description || !customerId) {
      return res.status(400).json({ error: 'Missing required parameters: title, description, and customerId' });
    }

    const customer = Database.getUserById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // 1. Run Real-time AI Classification via Gemini!
    console.log(`Starting AI Auto-Classification for ticket: "${title}"`);
    const aiAnalysis = await analyzeTicket(title, description);
    console.log(`AI Classification complete: Category=${aiAnalysis.suggestedCategory}, Priority=${aiAnalysis.priority}, Sentiment=${aiAnalysis.sentimentLabel}`);

    // Determine final department. Use user's manual selection if specified, or default to AI suggestion
    const finalDepartment = requestedDepartment || aiAnalysis.suggestedCategory || 'General';

    // Auto-allocate agent based on department
    const agents = Database.getUsers().filter(u => u.role === 'agent');
    const matchedAgent = agents.find(a => a.department === finalDepartment) || agents[0];

    // Create ticket in db
    const ticket = Database.createTicket({
      title,
      description,
      status: 'open',
      priority: aiAnalysis.priority,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerAvatar: customer.avatar,
      department: finalDepartment,
      tags: aiAnalysis.tags || [finalDepartment],
      assignedAgentId: matchedAgent?.id,
      assignedAgentName: matchedAgent?.name,
      aiMetadata: {
        sentiment: aiAnalysis.sentiment,
        sentimentLabel: aiAnalysis.sentimentLabel,
        intent: aiAnalysis.intent,
        suggestedCategory: aiAnalysis.suggestedCategory,
        confidenceScore: aiAnalysis.confidenceScore,
        suggestedResponse: aiAnalysis.suggestedResponse
      }
    });

    res.status(201).json(ticket);
  } catch (error: any) {
    console.error("Failed to create ticket:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update a ticket (assign agent, change status, change priority)
app.patch('/api/tickets/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedAgentId, department, actorId } = req.body;

    if (!actorId) {
      return res.status(400).json({ error: 'Actor ID (actorId) is required for audit logs' });
    }

    const actor = Database.getUserById(actorId);
    if (!actor) {
      return res.status(404).json({ error: 'Actor not found' });
    }

    const updates: Partial<any> = {};
    if (status) updates.status = status as TicketStatus;
    if (priority) updates.priority = priority as TicketPriority;
    if (department) updates.department = department;
    
    if (assignedAgentId) {
      const agent = Database.getUserById(assignedAgentId);
      if (agent) {
        updates.assignedAgentId = agent.id;
        updates.assignedAgentName = agent.name;
      }
    }

    const ticket = Database.updateTicket(id, updates, actor);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Post a message in a ticket (Agent/Customer Chat)
app.post('/api/tickets/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id: ticketId } = req.params;
    const { senderId, text, attachments } = req.body;

    if (!senderId || !text) {
      return res.status(400).json({ error: 'Missing senderId or text' });
    }

    const sender = Database.getUserById(senderId);
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    const ticket = Database.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const message = Database.createMessage({
      ticketId,
      senderId,
      senderName: sender.name,
      senderRole: sender.role === 'customer' ? 'customer' : 'agent',
      senderAvatar: sender.avatar,
      text,
      attachments
    });

    // If customer sent a message, automatically generate a new Smart Reply suggested response
    if (sender.role === 'customer') {
      const history = Database.getMessages(ticketId).map(m => ({
        sender: m.senderRole,
        text: m.text
      }));
      
      console.log(`Generating AI Smart Reply for ticket ${ticketId}`);
      const smartReply = await generateSmartReply(ticket.title, ticket.description, history);
      
      // Update ticket metadata suggested reply
      const systemUser: User = { id: 'system', name: 'AI Engine', email: 'ai@nexus.com', role: 'admin' };
      Database.updateTicket(ticketId, {
        aiMetadata: {
          ...ticket.aiMetadata,
          suggestedResponse: smartReply
        }
      }, systemUser);
    }

    res.status(201).json(message);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Submit a Customer Satisfaction Survey (CSAT)
app.post('/api/tickets/:id/csat', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating is required and must be between 1 and 5' });
    }

    const ticket = Database.submitCSAT(id, rating, feedback);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Request AI response draft manually
app.post('/api/tickets/:id/generate-ai-draft', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = Database.getTicketById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const history = Database.getMessages(id).map(m => ({
      sender: m.senderRole,
      text: m.text
    }));

    const draft = await generateSmartReply(ticket.title, ticket.description, history);
    
    // Update db
    const systemUser: User = { id: 'system', name: 'AI Engine', email: 'ai@nexus.com', role: 'admin' };
    Database.updateTicket(id, {
      aiMetadata: {
        ...ticket.aiMetadata,
        suggestedResponse: draft
      }
    }, systemUser);

    res.json({ suggestedResponse: draft });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Knowledge Base articles
app.get('/api/kb', (req: Request, res: Response) => {
  try {
    const { search, category } = req.query;
    let articles = Database.getKBArticles();

    if (category) {
      articles = articles.filter(a => a.category.toLowerCase() === (category as string).toLowerCase());
    }

    if (search) {
      const q = (search as string).toLowerCase();
      articles = articles.filter(a => 
        a.title.toLowerCase().includes(q) || 
        a.content.toLowerCase().includes(q) ||
        (a.tags && a.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    res.json(articles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get singular KB article (tracks views)
app.get('/api/kb/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const articles = Database.getKBArticles();
    const article = articles.find(a => a.id === id);
    if (!article) {
      return res.status(404).json({ error: 'KB Article not found' });
    }

    Database.trackKBView(id);
    res.json(article);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Submit KB helpfulness feedback
app.post('/api/kb/:id/feedback', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { helpful } = req.body;

    if (helpful === undefined) {
      return res.status(400).json({ error: 'Helpful flag is required' });
    }

    Database.submitKBFeedback(id, !!helpful);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get overall system metrics and audit activities (Manager / Admin Dash)
app.get('/api/stats', (req: Request, res: Response) => {
  try {
    const stats = Database.getStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit logs
app.get('/api/logs', (req: Request, res: Response) => {
  try {
    const logs = Database.getAuditLogs();
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export Tickets as Excel-Compatible CSV Report
app.get('/api/reports/export', (req: Request, res: Response) => {
  try {
    const tickets = Database.getTickets();
    let csvContent = 'Ticket ID,Title,Status,Priority,Department,Customer,Agent,Sentiment,SLA Breached,Created At\n';
    
    tickets.forEach(t => {
      const escapedTitle = `"${t.title.replace(/"/g, '""')}"`;
      const isSlaBreached = t.sla.isResponseBreached || t.sla.isResolutionBreached ? 'Yes' : 'No';
      const formattedDate = new Date(t.createdAt).toISOString();
      
      csvContent += `${t.id},${escapedTitle},${t.status},${t.priority},${t.department},"${t.customerName}","${t.assignedAgentName || 'Unassigned'}",${t.aiMetadata.sentimentLabel},${isSlaBreached},${formattedDate}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=nexus_tickets_report.csv');
    res.status(200).send(csvContent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Setup Vite Dev Server / Production Serving

const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Nexus Support] Server running at http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
};

startServer().catch(err => {
  console.error("Failed to start Nexus Support server:", err);
});
