import { TicketCategory, TicketPriority } from '../types/ticket';

export interface AIPrediction {
  category?: TicketCategory;
  priority?: TicketPriority;
  reason: string;
}

interface WeightedKeyword {
  word: string;
  weight: number; // 1 = supporting signal, 2 = strong signal, 3 = definitive signal
}

// Word boundary match with regex-special-char escaping
function hasKeyword(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'i');
  return regex.test(text);
}

// Sum weighted scores for all matching keywords
function scoreKeywords(text: string, keywords: WeightedKeyword[]): number {
  return keywords.reduce((score, { word, weight }) => {
    return score + (hasKeyword(text, word) ? weight : 0);
  }, 0);
}

const KEYWORD_RULES: Array<{
  keywords: WeightedKeyword[];
  category: TicketCategory;
  priority: TicketPriority;
  reason: string;
  minScore: number;
}> = [
  {
    // SECURITY: emergencies, threats, safety issues
    keywords: [
      { word: 'fire',                weight: 3 },
      { word: 'smoke',               weight: 3 },
      { word: 'weapon',              weight: 3 },
      { word: 'assault',             weight: 3 },
      { word: 'attack',              weight: 3 },
      { word: 'armed',               weight: 3 },
      { word: 'explosion',           weight: 3 },
      { word: 'gas leak',            weight: 3 },
      { word: 'robbery',             weight: 3 },
      { word: 'burglary',            weight: 3 },
      { word: 'fire alarm',           weight: 3 },
      { word: 'suspicious person',   weight: 3 },
      { word: 'suspicious activity', weight: 3 },
      { word: 'security breach',     weight: 3 },
      { word: 'locked out',          weight: 2 }, // building/room lockout (vs "account locked" in IT)
      { word: 'danger',              weight: 2 },
      { word: 'theft',               weight: 2 },
      { word: 'stolen',              weight: 2 },
      { word: 'break in',            weight: 2 },
      { word: 'intruder',            weight: 2 },
      { word: 'emergency',           weight: 1 }, // also an escalation signal — kept low so it doesn't override category
      { word: 'sabotage',            weight: 2 },
      { word: 'threat',              weight: 2 },
      { word: 'unauthorized access', weight: 2 },
      { word: 'security',            weight: 1 },
      { word: 'suspicious',          weight: 1 },
    ],
    category: 'SECURITY' as TicketCategory,
    priority: 'CRITICAL' as TicketPriority,
    reason: 'High-risk security emergency detected',
    minScore: 2, // single "fire" (score 3) passes; "suspicious" alone (score 1) doesn't
  },
  {
    // MAINTENANCE: infrastructure, facilities, repairs
    keywords: [
      { word: 'pipe burst',           weight: 3 },
      { word: 'electrical failure',  weight: 3 },
      { word: 'power outage',        weight: 3 },
      { word: 'no power',            weight: 3 },
      { word: 'power is out',        weight: 3 },
      { word: 'elevator stuck',      weight: 3 },
      { word: 'elevator broken',     weight: 3 },
      { word: 'lift broken',         weight: 3 },
      { word: 'roof leak',           weight: 3 },
      { word: 'ceiling leak',        weight: 3 },
      { word: 'no hot water',        weight: 3 },
      { word: 'flooded',             weight: 3 },
      { word: 'flood',               weight: 2 },
      { word: 'water leak',          weight: 2 },
      { word: 'water damage',        weight: 2 },
      { word: 'leaking',             weight: 2 },
      { word: 'pipe broken',         weight: 2 },
      { word: 'hvac broken',         weight: 2 },
      { word: 'heating failure',     weight: 2 },
      { word: 'cooling failure',     weight: 2 },
      { word: 'lights not working',  weight: 2 },
      { word: 'light broken',        weight: 2 },
      { word: 'door won\'t open',    weight: 2 },
      { word: 'door won\'t close',   weight: 2 },
      { word: 'window broken',       weight: 2 },
      { word: 'air conditioning',    weight: 2 },
      { word: 'structural',          weight: 2 },
      { word: 'cracks',              weight: 2 },
      { word: 'shattered glass',     weight: 2 },
      { word: 'broken door',         weight: 2 },
      { word: 'maintenance',         weight: 1 },
      { word: 'plumbing',            weight: 1 },
      { word: 'damage',              weight: 1 },
      { word: 'equipment broken',    weight: 1 },
      { word: 'ac broken',           weight: 1 },
      { word: 'repair needed',       weight: 1 },
    ],
    category: 'MAINTENANCE' as TicketCategory,
    priority: 'HIGH' as TicketPriority,
    reason: 'Critical facility infrastructure issue detected',
    minScore: 2, // "leaking" alone (score 2) correctly triggers
  },
  {
    // IT_SUPPORT: technology, computers, networks, systems
    keywords: [
      { word: 'it support',           weight: 3 },
      { word: 'it issue',            weight: 3 },
      { word: 'it problem',          weight: 3 },
      { word: 'connection down',     weight: 3 },
      { word: 'wifi is down',        weight: 3 },
      { word: 'internet is down',    weight: 3 },
      { word: 'no internet',         weight: 3 },
      { word: 'can\'t log in',       weight: 3 },
      { word: 'cannot log in',       weight: 3 },
      { word: 'forgot password',     weight: 3 },
      { word: 'account locked',      weight: 3 },
      { word: 'blue screen',         weight: 3 },
      { word: 'computer won\'t start', weight: 3 },
      { word: 'laptop won\'t start', weight: 3 },
      { word: 'projector not working', weight: 3 },
      { word: 'printer not working', weight: 3 },
      { word: 'database',            weight: 3 },
      { word: 'server',              weight: 2 },
      { word: 'login',               weight: 2 },
      { word: 'password',            weight: 2 },
      { word: 'wifi',                weight: 2 },
      { word: 'internet',            weight: 2 },
      { word: 'network',             weight: 2 },
      { word: 'printer',             weight: 2 },
      { word: 'computer',            weight: 2 },
      { word: 'laptop',              weight: 2 },
      { word: 'projector',           weight: 2 },
      { word: 'software',            weight: 2 },
      { word: 'email',               weight: 2 },
      { word: 'crash',               weight: 2 },
      { word: 'slow internet',       weight: 2 },
      { word: 'it department',       weight: 2 },
      { word: 'tech support',        weight: 2 },
      { word: 'vpn',                 weight: 2 },
      { word: 'not working',         weight: 1 },
      { word: 'technology',          weight: 1 },
      { word: 'keyboard',            weight: 1 },
      { word: 'mouse',               weight: 1 },
      { word: 'monitor',             weight: 1 },
      { word: 'display',             weight: 1 },
    ],
    category: 'IT_SUPPORT' as TicketCategory,
    priority: 'HIGH' as TicketPriority,
    reason: 'Technology system failure detected',
    minScore: 3, // "monitor" alone (score 1) won't fire; "laptop not working" (2+1=3) will
  },
  {
    // CLEANING: sanitation, waste, hygiene
    keywords: [
      { word: 'sewage',              weight: 3 },
      { word: 'biohazard',           weight: 3 },
      { word: 'cockroach',           weight: 3 },
      { word: 'pest control',        weight: 3 },
      { word: 'mold',                weight: 3 },
      { word: 'overflowing bin',     weight: 3 },
      { word: 'toilet blocked',      weight: 3 },
      { word: 'bathroom smell',      weight: 3 },
      { word: 'vomit',               weight: 3 },
      { word: 'rats',                weight: 3 },
      { word: 'clogged',             weight: 2 },
      { word: 'graffiti',            weight: 2 },
      { word: 'spill',               weight: 2 },
      { word: 'filthy',              weight: 2 },
      { word: 'trash',               weight: 2 },
      { word: 'garbage',             weight: 2 },
      { word: 'odor',                weight: 2 },
      { word: 'stain',               weight: 2 },
      { word: 'bin is full',         weight: 2 },
      { word: 'needs cleaning',      weight: 2 },
      { word: 'sink blocked',        weight: 2 },
      { word: 'mice',                weight: 2 },
      { word: 'insects',             weight: 2 },
      { word: 'cleaning',            weight: 1 },
      { word: 'clean',               weight: 1 },
      { word: 'dirty',               weight: 1 },
      { word: 'waste',               weight: 1 },
      { word: 'mess',                weight: 1 },
      { word: 'litter',              weight: 1 },
      { word: 'smell',               weight: 1 },
      { word: 'bathroom',            weight: 1 },
      { word: 'restroom',            weight: 1 },
      { word: 'toilet',              weight: 1 },
      { word: 'dust',                weight: 1 },
      { word: 'sanitation',          weight: 1 },
      { word: 'hygiene',             weight: 1 },
      { word: 'sweeping',            weight: 1 },
      { word: 'mopping',             weight: 1 },
      { word: 'washing',             weight: 1 },
    ],
    category: 'CLEANING' as TicketCategory,
    priority: 'MEDIUM' as TicketPriority,
    reason: 'Sanitation or cleaning issue detected',
    minScore: 2, // "dirty bathroom" (1+1=2) correctly triggers
  },
  {
    // OTHER: truly unclassifiable submissions
    keywords: [
      { word: 'other',               weight: 1 },
      { word: 'miscellaneous',       weight: 1 },
      { word: 'general inquiry',     weight: 1 },
      { word: 'not listed',          weight: 1 },
      { word: 'none of the above',   weight: 1 },
    ],
    category: 'OTHER' as TicketCategory,
    priority: 'MEDIUM' as TicketPriority,
    reason: 'General or unspecified issue type',
    minScore: 3, // all words are weight 1 — forces 3 explicit OTHER signals before triggering
  }
];

// Priority escalation — words that indicate urgency regardless of category
const ESCALATION_KEYWORDS = [
  'urgent', 'urgently', 'asap', 'immediately', 'critical', 'emergency',
  'still broken', 'still not fixed', 'still not working', 'not yet fixed',
  'days without', 'week without', 'weeks without',
  'days ago', 'week ago', 'weeks ago',
  'been waiting', 'no response', 'unresolved',
  'affecting everyone', 'whole floor', 'entire building', 'everyone affected',
  'escalate', 'escalating',
];

const PRIORITY_LADDER: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function bumpPriority(priority: TicketPriority): TicketPriority {
  const index = PRIORITY_LADDER.indexOf(priority);
  return index < PRIORITY_LADDER.length - 1 ? PRIORITY_LADDER[index + 1] : priority;
}

function hasEscalationSignal(text: string): boolean {
  return ESCALATION_KEYWORDS.some(keyword => hasKeyword(text, keyword));
}

// title and description are scored separately — title counts 2x since it carries the core signal
export function predictTicketDetails(title: string, description: string = ''): AIPrediction | null {
  if (!title || title.trim().length < 3) {
    return null;
  }

  const normalizedTitle = title.toLowerCase().trim();
  const normalizedDescription = description.toLowerCase().trim();
  let bestMatch: AIPrediction | null = null;
  let bestScore = 0;

  for (const rule of KEYWORD_RULES) {
    const titleScore = scoreKeywords(normalizedTitle, rule.keywords) * 2; // title is 2x
    const descScore  = scoreKeywords(normalizedDescription, rule.keywords);
    const score = titleScore + descScore;

    if (score >= rule.minScore && score > bestScore) {
      bestScore = score;
      bestMatch = {
        category: rule.category,
        priority: rule.priority,
        reason: rule.reason
      };
    }
  }

  // Bump priority if urgency signals are present in either field
  const fullText = `${normalizedTitle} ${normalizedDescription}`;
  if (bestMatch && hasEscalationSignal(fullText)) {
    const escalated = bumpPriority(bestMatch.priority!);
    if (escalated !== bestMatch.priority) {
      bestMatch = {
        ...bestMatch,
        priority: escalated,
        reason: bestMatch.reason + ' — marked urgent'
      };
    }
  }

  return bestMatch;
}
