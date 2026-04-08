import { TicketCategory, TicketPriority } from '../types/ticket';

export interface AIPrediction {
  category?: TicketCategory;
  priority?: TicketPriority;
  reason: string;
}

// Helper function for word boundary matching
function hasKeyword(text: string, keyword: string): boolean {
  const regex = new RegExp(`\\b${keyword}\\b`, 'i');
  return regex.test(text);
}

// Helper function to count matching keywords
function countMatchingKeywords(text: string, keywords: string[]): number {
  return keywords.filter(keyword => hasKeyword(text, keyword)).length;
}

const KEYWORD_RULES = [
  {
    // SECURITY: emergencies, threats, safety issues
    keywords: ['security', 'fire', 'smoke', 'danger', 'weapon', 'theft', 'stolen', 'break in', 'intruder', 'assault', 'attack', 'armed', 'emergency', 'robbery', 'burglary', 'sabotage', 'threat', 'suspicious', 'unauthorized access', 'gas leak', 'explosion'],
    category: 'SECURITY' as TicketCategory,
    priority: 'CRITICAL' as TicketPriority,
    reason: 'High-risk security emergency detected'
  },
  {
    // MAINTENANCE: infrastructure, facilities, repairs
    keywords: ['maintenance', 'water leak', 'leaking', 'flooded', 'flood', 'pipe burst', 'pipe broken', 'electrical failure', 'power outage', 'no power', 'broken door', 'shattered glass', 'elevator stuck', 'hvac broken', 'heating failure', 'cooling failure', 'plumbing', 'structural', 'damage', 'cracks', 'roof leak', 'equipment broken', 'ac broken', 'repair needed'],
    category: 'MAINTENANCE' as TicketCategory,
    priority: 'HIGH' as TicketPriority,
    reason: 'Critical facility infrastructure issue detected'
  },
  {
    // IT_SUPPORT: technology, computers, networks, systems
    keywords: ['it', 'support', 'technology', 'wifi', 'internet', 'network', 'projector', 'computer', 'laptop', 'printer', 'mouse', 'keyboard', 'monitor', 'software', 'app', 'system', 'database', 'server', 'email', 'login', 'password', 'connection down', 'not working', 'crash', 'error', 'screen', 'display'],
    category: 'IT_SUPPORT' as TicketCategory,
    priority: 'HIGH' as TicketPriority,
    reason: 'Technology system failure detected'
  },
  {
    // CLEANING: sanitation, waste, hygiene
    keywords: ['cleaning', 'clean', 'dirty', 'filthy', 'spill', 'trash', 'garbage', 'waste', 'mess', 'litter', 'smell', 'odor', 'stain', 'graffiti', 'bathroom', 'restroom', 'toilet', 'dust', 'sanitation', 'hygiene', 'sweeping', 'mopping', 'washing', 'clogged'],
    category: 'CLEANING' as TicketCategory,
    priority: 'MEDIUM' as TicketPriority,
    reason: 'Sanitation or cleaning issue detected'
  },
  {
    // OTHER: general, miscellaneous
    keywords: ['other', 'miscellaneous', 'general', 'issue', 'problem', 'concern', 'help', 'assistance'],
    category: 'OTHER' as TicketCategory,
    priority: 'MEDIUM' as TicketPriority,
    reason: 'General or unspecified issue type'
  }
];

export function predictTicketDetails(text: string): AIPrediction | null {
  if (!text || text.trim().length < 10) {
    return null;
  }

  const normalizedText = text.toLowerCase().trim();
  let bestMatch: AIPrediction | null = null;
  let bestMatchCount = 0;

  // Check each rule and find the best match
  for (const rule of KEYWORD_RULES) {
    const matchCount = countMatchingKeywords(normalizedText, rule.keywords);
    
    // Only consider if we have at least 1 keyword match
    if (matchCount > 0 && matchCount > bestMatchCount) {
      bestMatchCount = matchCount;
      bestMatch = {
        category: rule.category,
        priority: rule.priority,
        reason: rule.reason
      };
    }
  }

  return bestMatch;
}
