/**
 * Intent Recognition Engine
 * Uses weighted keyword scoring to classify user input
 * Returns the highest-scoring intent above threshold
 */

const intentKeywords = {
  ORDER_TRACKING: {
    high: ['track', 'order', 'package', 'shipment', 'delivery', 'arrive', 'arriving', 'shipped', 'tracking'],
    medium: ['where', 'status', 'dispatch', 'parcel', 'ship'],
    low: ['my', 'is', 'when', 'find', 'check']
  },
  RETURNS: {
    high: ['return', 'refund', 'exchange', 'send back', 'return policy', 'returning'],
    medium: ['unused', 'packaging', '30 day', 'days', 'money back', 'policy'],
    low: ['want', 'item', 'back', 'purchase', 'bought']
  },
  RECOMMEND: {
    high: ['recommend', 'suggest', 'looking for', 'help me find', 'what should', 'suggestion', 'advice'],
    medium: ['buy', 'need', 'gear', 'best', 'good', 'suitable', 'product', 'purchase'],
    low: ['outdoor', 'hiking', 'camping', 'want', 'winter', 'climbing']
  },
  HUMAN_HANDOFF: {
    high: ['agent', 'human', 'person', 'representative', 'live', 'speak to', 'talk to', 'real person'],
    medium: ['help', 'connect', 'real', 'someone', 'support team', 'customer service'],
    low: ['please', 'can', 'want', 'need']
  },
  GREETING: {
    high: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'sup', 'yo'],
    medium: ['greetings', 'hiya'],
    low: []
  },
  THANKS: {
    high: ['thanks', 'thank you', 'thankyou', 'cheers', 'appreciate', 'awesome', 'great', 'perfect'],
    medium: ['thx', 'ty', 'nice', 'cool', 'helpful'],
    low: []
  },
  GOODBYE: {
    high: ['bye', 'goodbye', 'see you', 'later', 'cya', 'farewell', 'exit', 'quit'],
    medium: ['done', 'finished', 'leave'],
    low: []
  }
};

const weights = {
  high: 3,
  medium: 2,
  low: 1
};

const thresholds = {
  ORDER_TRACKING: 2,
  RETURNS: 2,
  RECOMMEND: 2,
  HUMAN_HANDOFF: 2,
  GREETING: 3,
  THANKS: 3,
  GOODBYE: 3
};

/**
 * Tokenize and normalize user input
 * @param {string} input - Raw user input
 * @returns {string[]} - Array of lowercase tokens
 */
function tokenize(input) {
  return input
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 0);
}

/**
 * Calculate intent score based on keyword matches
 * @param {string[]} tokens - Tokenized user input
 * @param {object} keywords - Keyword set for an intent
 * @returns {number} - Weighted score
 */
function calculateScore(tokens, keywords) {
  let score = 0;
  const input = tokens.join(' ');
  
  // Check high-weight keywords
  keywords.high.forEach(keyword => {
    if (input.includes(keyword.toLowerCase())) {
      score += weights.high;
    }
  });
  
  // Check medium-weight keywords
  keywords.medium.forEach(keyword => {
    if (input.includes(keyword.toLowerCase())) {
      score += weights.medium;
    }
  });
  
  // Check low-weight keywords
  keywords.low.forEach(keyword => {
    if (tokens.includes(keyword.toLowerCase())) {
      score += weights.low;
    }
  });
  
  return score;
}

/**
 * Extract order number from user input
 * Supports formats: #111, 111, "order 111", "order #111"
 * @param {string} input - User input
 * @returns {string|null} - Extracted order number or null
 */
export function extractOrderNumber(input) {
  // Pattern 1: #123 or just 123 (3+ digits)
  const pattern1 = /#?(\d{3,})/;
  const match1 = input.match(pattern1);
  if (match1) {
    return match1[1];
  }
  
  // Pattern 2: "order #123" or "order 123"
  const pattern2 = /order\s*#?\s*(\d{3,})/i;
  const match2 = input.match(pattern2);
  if (match2) {
    return match2[1];
  }
  
  return null;
}

/**
 * Recognize intent from user input
 * @param {string} input - Raw user input
 * @returns {object} - { intent: string, confidence: number, orderNumber: string|null }
 */
export function recognizeIntent(input) {
  if (!input || input.trim().length === 0) {
    return { intent: 'UNKNOWN', confidence: 0, orderNumber: null };
  }
  
  const tokens = tokenize(input);
  const scores = {};
  
  // Calculate scores for all intents
  Object.keys(intentKeywords).forEach(intent => {
    scores[intent] = calculateScore(tokens, intentKeywords[intent]);
  });
  
  // Find highest scoring intent
  let maxIntent = 'UNKNOWN';
  let maxScore = 0;
  
  Object.keys(scores).forEach(intent => {
    if (scores[intent] > maxScore && scores[intent] >= thresholds[intent]) {
      maxScore = scores[intent];
      maxIntent = intent;
    }
  });
  
  // Extract order number if present
  const orderNumber = extractOrderNumber(input);
  
  // If order number found, boost ORDER_TRACKING
  if (orderNumber && scores.ORDER_TRACKING > 0) {
    maxIntent = 'ORDER_TRACKING';
    maxScore = scores.ORDER_TRACKING;
  }
  
  return {
    intent: maxIntent,
    confidence: maxScore,
    orderNumber: orderNumber
  };
}

/**
 * Test the intent recognizer with various inputs
 * For development/debugging only
 */
export function testIntentRecognizer() {
  const testCases = [
    "where is my order",
    "track my package",
    "order #111",
    "what's the status of order 222",
    "i want to return something",
    "what's your return policy",
    "can I get a refund",
    "recommend me a jacket",
    "what should I buy for hiking",
    "I need gear advice",
    "talk to an agent",
    "connect me to a human",
    "I need help from a person",
    "hello",
    "hi there",
    "thanks",
    "thank you so much",
    "bye",
    "goodbye"
  ];
  
  console.log("Intent Recognition Test Results:");
  testCases.forEach(input => {
    const result = recognizeIntent(input);
    console.log(`"${input}" → ${result.intent} (${result.confidence})`);
  });
}
