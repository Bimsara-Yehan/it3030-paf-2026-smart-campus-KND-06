import { TicketCategory, TicketPriority } from '../types/ticket';

export interface AIPrediction {
  category?: TicketCategory;
  priority?: TicketPriority;
  reason: string;
}

const KEYWORD_RULES = [
  {
    keywords: ['fire', 'smoke', 'danger', 'stranger', 'emergency', 'gas', 'explosion', 'fight', 'weapon'],
    category: 'SECURITY' as TicketCategory,
    priority: 'CRITICAL' as TicketPriority,
    reason: 'Detected high-risk emergency keywords.'
  },
  {
    keywords: ['water', 'leak', 'pipe', 'flood', 'ac', 'aircon', 'air conditioning', 'power', 'electricity', 'broken door', 'shattered', 'elevator'],
    category: 'MAINTENANCE' as TicketCategory,
    priority: 'HIGH' as TicketPriority,
    reason: 'Detected facility hazard or major infrastructure issue.'
  },
  {
    keywords: ['wifi', 'internet', 'network', 'projector', 'computer', 'printer', 'mouse', 'keyboard', 'screen', 'software', 'login'],
    category: 'IT_SUPPORT' as TicketCategory,
    priority: 'MEDIUM' as TicketPriority,
    reason: 'Detected IT or technological equipment keywords.'
  },
  {
    keywords: ['spill', 'mess', 'trash', 'dirty', 'smell', 'bathroom', 'toilet', 'stain', 'dust'],
    category: 'CLEANING' as TicketCategory,
    priority: 'LOW' as TicketPriority,
    reason: 'Detected sanitation or cleaning keywords.'
  }
];

export function predictTicketDetails(text: string): AIPrediction | null {
  const normalizedText = text.toLowerCase();
  
  for (const rule of KEYWORD_RULES) {
    for (const keyword of rule.keywords) {
      // Basic word boundary check or simple inclusion. 
      // Included spaces inside keywords means we just check for substring.
      if (normalizedText.includes(keyword)) {
        return {
          category: rule.category,
          priority: rule.priority,
          reason: rule.reason
        };
      }
    }
  }

  return null;
}
