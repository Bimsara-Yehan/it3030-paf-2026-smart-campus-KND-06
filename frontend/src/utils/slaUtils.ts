import { TicketPriority, TicketStatus } from '../types/ticket';

export interface SLAMetadata {
  goalHours: number;
  timeRemainingMs: number;
  isOverdue: boolean;
  status: 'ON_TRACK' | 'OVERDUE' | 'MET' | 'MISSED';
  label: string;
}

const SLA_HOURS: Record<TicketPriority, number> = {
  CRITICAL: 4,
  HIGH: 12,
  MEDIUM: 24,
  LOW: 72,
};

export function calculateSLA(
  priority: TicketPriority,
  createdAt: string,
  status: TicketStatus,
  resolvedAt?: string
): SLAMetadata {
  const goalHours = SLA_HOURS[priority] || 24;
  const createdDate = new Date(createdAt).getTime();
  const goalTime = createdDate + goalHours * 60 * 60 * 1000;
  
  const endComparisonTime = status === 'RESOLVED' || status === 'CLOSED' 
    ? (resolvedAt ? new Date(resolvedAt).getTime() : Date.now())
    : Date.now();

  const isCompleted = status === 'RESOLVED' || status === 'CLOSED';
  const timeRemainingMs = goalTime - endComparisonTime;
  const isOverdue = timeRemainingMs < 0;

  let slaStatus: SLAMetadata['status'] = isOverdue ? 'OVERDUE' : 'ON_TRACK';
  if (isCompleted) {
    slaStatus = isOverdue ? 'MISSED' : 'MET';
  }

  const hoursRemaining = Math.abs(Math.floor(timeRemainingMs / (1000 * 60 * 60)));
  const minsRemaining = Math.abs(Math.floor((timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60)));

  let label = '';
  if (isCompleted) {
    label = slaStatus === 'MET' ? 'SLA Met' : `SLA Missed (${hoursRemaining}h ${minsRemaining}m over)`;
  } else {
    label = isOverdue ? `${hoursRemaining}h ${minsRemaining}m overdue` : `${hoursRemaining}h ${minsRemaining}m remaining`;
  }

  return {
    goalHours,
    timeRemainingMs,
    isOverdue,
    status: slaStatus,
    label,
  };
}
