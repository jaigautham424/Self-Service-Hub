/**
 * Shared Type Definitions for Nexus Support
 */

export type UserRole = 'customer' | 'agent' | 'manager' | 'admin';
export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
}

export interface Attachment {
  name: string;
  url: string;
  size: string;
  type: string;
}

export interface Message {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'agent' | 'system';
  senderAvatar?: string;
  text: string;
  attachments?: Attachment[];
  createdAt: number;
  isAiSuggested?: boolean;
}

export interface TicketAIMetadata {
  sentiment: number; // -1 to 1
  sentimentLabel: 'positive' | 'neutral' | 'negative';
  intent: string;
  suggestedCategory: string;
  confidenceScore: number;
  suggestedResponse?: string;
}

export interface TicketSLA {
  responseTimeLimit: string; // e.g. "1h" or "4h"
  resolutionTimeLimit: string; // e.g. "8h" or "24h"
  responseTimeDeadline: number; // timestamp ms
  resolutionTimeDeadline: number; // timestamp ms
  isResponseBreached: boolean;
  isResolutionBreached: boolean;
  firstRespondedAt?: number;
  resolvedAt?: number;
}

export interface CSAT {
  rating: number; // 1-5
  feedback?: string;
  createdAt: number;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  department: string;
  tags: string[];
  aiMetadata: TicketAIMetadata;
  sla: TicketSLA;
  createdAt: number;
  updatedAt: number;
  csat?: CSAT;
}

export interface KBArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  views: number;
  helpfulCount: number;
  unhelpfulCount: number;
  tags?: string[];
}

export interface AuditLog {
  id: string;
  ticketId?: string;
  action: string;
  actorName: string;
  actorRole: string;
  details: string;
  createdAt: number;
}

export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  pendingTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  avgResponseTimeMs: number;
  avgResolutionTimeMs: number;
  slaComplianceRate: number;
  avgCsat: number;
  byPriority: { low: number; medium: number; high: number; urgent: number };
  byCategory: { [category: string]: number };
  byStatus: { [status: string]: number };
  recentActivity: AuditLog[];
}
