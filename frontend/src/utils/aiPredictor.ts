import { TicketCategory, TicketPriority } from '../types/ticket';

export interface AIPrediction {
  category?: TicketCategory;
  priority?: TicketPriority;
  reason: string;
}

const KEYWORD_RULES = [
  {
    keywords: ['fire', 'smoke', 'danger', 'stranger', 'emergency', 'gas', 'explosion', 'fight', 'weapon', 'theft', 'stolen', 'break-in', 'break in', 'intruder', 'suspicious', 'assault', 'attack', 'security risk', 'suspicious person', 'unauthorized'],
    category: 'SECURITY' as TicketCategory,
    priority: 'CRITICAL' as TicketPriority,
    reason: 'Detected high-risk emergency keywords.'
  },
  {
    keywords: ['water', 'leak', 'pipe', 'flood', 'ac', 'aircon', 'air conditioning', 'power', 'electricity', 'broken door', 'shattered', 'elevator', 'hvac', 'heating', 'cooling', 'plumbing', 'structural', 'wall', 'ceiling', 'roof', 'window', 'glass', 'lock', 'handle', 'equipment failure'],
    category: 'MAINTENANCE' as TicketCategory,
    priority: 'HIGH' as TicketPriority,
    reason: 'Detected facility hazard or major infrastructure issue.'
  },
  {
    keywords: ['wifi', 'internet', 'network', 'projector', 'computer', 'printer', 'mouse', 'keyboard', 'screen', 'software', 'login', 'password', 'email', 'server', 'cable', 'connection', 'system', 'app', 'application', 'database', 'it issue'],
    category: 'IT_SUPPORT' as TicketCategory,
    priority: 'MEDIUM' as TicketPriority,
    reason: 'Detected IT or technological equipment keywords.'
  },
  {
    keywords: ['spill', 'mess', 'trash', 'dirty', 'smell', 'bathroom', 'toilet', 'stain', 'dust', 'cleaning', 'sweeping', 'mopping', 'garbage', 'litter', 'floor', 'surface', 'carpet', 'wall stain', 'graffiti', 'washroom', 'sanitation', 'hygiene', 'dirty restroom', 'filthy'],
    category: 'CLEANING' as TicketCategory,
    priority: 'LOW' as TicketPriority,
    reason: 'Detected sanitation or cleaning keywords.'
  },
  {
    keywords: ['other', 'miscellaneous', 'various', 'general', 'multiple issues', 'several problems'],
    category: 'OTHER' as TicketCategory,
    priority: 'MEDIUM' as TicketPriority,
    reason: 'Detected general or multiple issue types.'
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
