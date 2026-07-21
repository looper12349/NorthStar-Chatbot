/**
 * Conversation Flow State Machine
 * Manages conversation state, routes to handlers, tracks context
 * 
 * ARCHITECTURE: Message Processing Pipeline
 * Every message goes through these steps in order:
 * 1. Order number check (always runs first, regardless of state)
 * 2. Pleasantry check (absorb and stay in current flow)
 * 3. Active flow context (try to resolve within current flow)
 * 4. Fresh intent detection (switch flows cleanly)
 * 5. Fallback (graceful handling with escalation)
 */

import { recognizeIntent, extractOrderNumber } from './intentRecognizer';
import { orderData, shippingInfo } from '../data/mockData';
import { responses } from '../data/responses';
import { recommendationTree } from '../data/recommendationTree';

// Conversation states
export const STATES = {
  IDLE: 'IDLE',
  MAIN_MENU: 'MAIN_MENU',
  AWAITING_ORDER_NUMBER: 'AWAITING_ORDER_NUMBER',
  ORDER_RESULT: 'ORDER_RESULT',
  RETURNS_INFO: 'RETURNS_INFO',
  SHIPPING_INFO: 'SHIPPING_INFO',
  RECOMMEND_ACTIVITY: 'RECOMMEND_ACTIVITY',
  RECOMMEND_NEED: 'RECOMMEND_NEED',
  RECOMMEND_RESULT: 'RECOMMEND_RESULT',
  LIVE_AGENT: 'LIVE_AGENT',
  FALLBACK: 'FALLBACK'
};

/**
 * Initialize conversation state
 */
export function initializeConversation() {
  return {
    state: STATES.IDLE,
    fallbackCount: 0,
    context: {},
    history: [],
    lastOrderNumber: null,
    currentFlow: null,
    lastFlow: null
  };
}

/**
 * Check if input is a pleasantry that should be absorbed
 */
function isPleasantry(input) {
  const lower = input.toLowerCase().trim();
  const pleasantries = [
    'thanks', 'thank you', 'thankyou', 'thx', 'ty',
    'ok', 'okay', 'sure', 'got it', 'understood',
    'cool', 'great', 'awesome', 'perfect', 'nice',
    'appreciate it', 'cheers'
  ];
  
  // Check if entire input is just a pleasantry (with optional punctuation)
  const cleaned = lower.replace(/[!?.]/g, '').trim();
  return pleasantries.some(p => cleaned === p || cleaned === p + ' you');
}

/**
 * Get random item from array
 */
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Quick replies for the recommendation quiz step 1, built from the tree
 * so labels/icons never drift from the data.
 */
function activityReplies() {
  return Object.entries(recommendationTree.activities).map(([key, activity]) => ({
    label: activity.label,
    value: key,
    icon: activity.icon
  }));
}

/**
 * Process user input and return bot response
 * PIPELINE ARCHITECTURE - processes in strict order:
 * 1. Order number check (global, runs first always)
 * 2. Pleasantry absorption (stay in current state)
 * 3. Active flow context (resolve within current flow)
 * 4. Fresh intent detection (switch flows)
 * 5. Fallback (graceful degradation)
 * 
 * @param {string} userInput - User message
 * @param {object} conversationState - Current conversation state
 * @returns {object} - { messages: [], quickReplies: [], newState: string, context: {} }
 */
export function processInput(userInput, conversationState) {
  const { state, fallbackCount, context } = conversationState;
  
  // Handle initial greeting
  if (state === STATES.IDLE) {
    const greeting = handleGreeting();
    return {
      ...greeting,
      currentFlow: 'main_menu',
      lastFlow: null,
      fallbackCount: 0
    };
  }
  
  // ============================================================
  // PIPELINE STEP 1: Order number check (ALWAYS runs first)
  // ============================================================
  const orderNumber = extractOrderNumber(userInput);
  if (orderNumber) {
    const result = lookupOrder(orderNumber);
    return {
      ...result,
      currentFlow: 'order_tracking',
      lastFlow: conversationState.currentFlow,
      lastOrderNumber: orderNumber,
      fallbackCount: 0 // Reset on successful action
    };
  }
  
  // ============================================================
  // PIPELINE STEP 2: Pleasantry absorption (stay in current flow)
  // ============================================================
  if (isPleasantry(userInput)) {
    return handlePleasantry(state, context, conversationState.currentFlow);
  }
  
  // ============================================================
  // PIPELINE STEP 3: Active flow context resolution
  // ============================================================
  const flowResult = handleWithinFlow(userInput, state, context, fallbackCount, conversationState.currentFlow);
  if (flowResult) {
    return {
      ...flowResult,
      currentFlow: flowResult.newState === STATES.MAIN_MENU ? 'main_menu' : conversationState.currentFlow,
      lastFlow: conversationState.currentFlow,
      lastOrderNumber: conversationState.lastOrderNumber
    };
  }
  
  // ============================================================
  // PIPELINE STEP 4: Fresh intent detection
  // ============================================================
  const { intent } = recognizeIntent(userInput);
  
  if (intent !== 'UNKNOWN') {
    const result = routeToFlow(intent, state, fallbackCount);
    return {
      ...result,
      currentFlow: getFlowFromIntent(intent),
      lastFlow: conversationState.currentFlow,
      lastOrderNumber: conversationState.lastOrderNumber,
      fallbackCount: 0
    };
  }
  
  // ============================================================
  // PIPELINE STEP 5: Fallback
  // ============================================================
  const fallbackResult = handleFallback(fallbackCount, state, conversationState.currentFlow);
  return {
    ...fallbackResult,
    currentFlow: fallbackResult.newState === STATES.MAIN_MENU ? null : conversationState.currentFlow,
    lastFlow: conversationState.currentFlow,
    lastOrderNumber: conversationState.lastOrderNumber
  };
}

/**
 * Get flow name from intent
 */
function getFlowFromIntent(intent) {
  switch (intent) {
    case 'ORDER_TRACKING': return 'order_tracking';
    case 'RETURNS': return 'returns';
    case 'SHIPPING': return 'shipping';
    case 'RECOMMEND': return 'recommend';
    case 'HUMAN_HANDOFF': return 'handoff';
    case 'GREETING': return 'main_menu';
    default: return null;
  }
}

/**
 * Handle pleasantry - absorb and stay in current state
 */
function handlePleasantry(state, context, currentFlow) {
  // Mid-quiz: acknowledge but keep the quiz options on screen —
  // otherwise a "thanks" strands the user with no visible choices.
  if (state === STATES.RECOMMEND_ACTIVITY) {
    return {
      messages: [randomChoice(responses.thanks)],
      quickReplies: activityReplies(),
      quiz: { step: 1, total: 2, title: 'Find your gear' },
      newState: state,
      context: context,
      fallbackCount: 0
    };
  }
  if (state === STATES.RECOMMEND_NEED && context && context.selectedActivity) {
    const activity = recommendationTree.activities[context.selectedActivity];
    return {
      messages: [randomChoice(responses.thanks)],
      quickReplies: Object.keys(activity.needs).map(needKey => ({
        label: activity.needs[needKey].label,
        value: needKey,
        icon: activity.needs[needKey].icon
      })),
      quiz: { step: 2, total: 2, title: activity.label },
      newState: state,
      context: context,
      fallbackCount: 0
    };
  }

  // If we're in a result state, acknowledge and offer next steps
  if (state === STATES.ORDER_RESULT || state === STATES.RETURNS_INFO || state === STATES.RECOMMEND_RESULT) {
    return {
      messages: [randomChoice(responses.thanks) + " Is there anything else I can help you with?"],
      quickReplies: [
        { label: 'Track Order', value: 'track order' },
        { label: 'Returns', value: 'return policy' },
        { label: 'Recommendations', value: 'recommend gear' },
        { label: 'Talk to Agent', value: 'talk to agent' }
      ],
      newState: STATES.MAIN_MENU,
      context: {},
      fallbackCount: 0
    };
  }
  
  // Otherwise, just acknowledge and maintain state
  return {
    messages: [randomChoice(responses.thanks)],
    quickReplies: [],
    newState: state,
    context: context,
    fallbackCount: 0
  };
}

/**
 * Try to resolve input within the current active flow
 * Returns null if input cannot be resolved within flow
 */
function handleWithinFlow(userInput, state, context, fallbackCount, currentFlow) {
  const lower = userInput.toLowerCase().trim();
  
  // Check for explicit "main menu" request in any state
  if (lower.includes('main menu') || lower === 'menu' || lower === 'back to menu') {
    return handleGreeting();
  }
  
  // Handle based on current state
  switch (state) {
    case STATES.MAIN_MENU:
      return null; // Let intent detection handle it
      
    case STATES.AWAITING_ORDER_NUMBER:
      return handleOrderNumberInput(userInput, fallbackCount);
      
    case STATES.ORDER_RESULT:
      return handleOrderResultFollowup(userInput, context, fallbackCount, currentFlow);
      
    case STATES.RETURNS_INFO:
      return handleReturnsFollowup(userInput, fallbackCount, currentFlow);

    case STATES.SHIPPING_INFO:
      return handleShippingFollowup(userInput, fallbackCount, currentFlow);

    case STATES.RECOMMEND_ACTIVITY:
      return handleActivitySelection(userInput, fallbackCount);
      
    case STATES.RECOMMEND_NEED:
      return handleNeedSelection(userInput, context, fallbackCount);
      
    case STATES.RECOMMEND_RESULT:
      return handleRecommendationFollowup(userInput, fallbackCount, context, currentFlow);
      
    case STATES.LIVE_AGENT:
      return handleLiveAgent(userInput);
      
    default:
      return null;
  }
}

/**
 * Route to flow based on intent
 */
function routeToFlow(intent, currentState, fallbackCount) {
  switch (intent) {
    case 'ORDER_TRACKING':
      return {
        messages: [responses.orderTracking.prompt],
        quickReplies: [
          { label: 'Main Menu', value: 'main menu' }
        ],
        newState: STATES.AWAITING_ORDER_NUMBER,
        context: {}
      };
      
    case 'RETURNS':
      return {
        messages: [responses.returns.policy],
        quickReplies: [
          { label: 'More Questions', value: 'more questions about returns' },
          { label: 'Talk to Agent', value: 'talk to agent' },
          { label: 'Main Menu', value: 'main menu' }
        ],
        newState: STATES.RETURNS_INFO,
        context: {}
      };

    case 'SHIPPING':
      return {
        messages: [responses.shipping.info],
        quickReplies: [
          { label: 'More Questions', value: 'more questions about shipping' },
          { label: 'Track Order', value: 'track order' },
          { label: 'Main Menu', value: 'main menu' }
        ],
        newState: STATES.SHIPPING_INFO,
        context: {}
      };

    case 'RECOMMEND':
      return {
        messages: [responses.recommendations.intro],
        quickReplies: activityReplies(),
        quiz: { step: 1, total: 2, title: 'Find your gear' },
        newState: STATES.RECOMMEND_ACTIVITY,
        context: {}
      };
      
    case 'HUMAN_HANDOFF':
      return {
        messages: [responses.handoff.connecting],
        quickReplies: [
          { label: 'Return to Main Menu', value: 'main menu' }
        ],
        newState: STATES.LIVE_AGENT,
        context: {}
      };
      
    case 'GREETING':
      return handleGreeting();
      
    case 'THANKS':
      return {
        messages: [randomChoice(responses.thanks), responses.mainMenu],
        quickReplies: [
          { label: 'Track Order', value: 'track order' },
          { label: 'Returns', value: 'return policy' },
          { label: 'Recommendations', value: 'recommend gear' },
          { label: 'Talk to Agent', value: 'talk to agent' }
        ],
        newState: STATES.MAIN_MENU,
        context: {}
      };
      
    case 'GOODBYE':
      return {
        messages: [randomChoice(responses.goodbye)],
        quickReplies: [
          { label: 'Main Menu', value: 'main menu' }
        ],
        newState: STATES.MAIN_MENU,
        context: {}
      };
      
    default:
      return null;
  }
}

/**
 * Handle initial greeting
 */
function handleGreeting() {
  return {
    messages: [
      randomChoice(responses.greeting),
      responses.mainMenu
    ],
    quickReplies: [
      { label: 'Track Order', value: 'track order' },
      { label: 'Returns & Exchanges', value: 'return policy' },
      { label: 'Product Recommendations', value: 'recommend gear' },
      { label: 'Talk to Agent', value: 'talk to agent' }
    ],
    newState: STATES.MAIN_MENU,
    context: {}
  };
}

/**
 * Handle order number input
 * POST-RESOLUTION RULES:
 * - Another order number → look it up (correction or new)
 * - "sorry" + order number → look it up (correction signal)
 * - Return keywords → switch to returns
 * - Main menu → exit
 * - Anything else → gentle fallback with context
 */
function handleOrderNumberInput(userInput, fallbackCount) {
  // Check if user wants to go back
  const { intent } = recognizeIntent(userInput);
  if (intent === 'HUMAN_HANDOFF' || userInput.toLowerCase().includes('main menu')) {
    return handleGreeting();
  }
  
  return {
    messages: [responses.orderTracking.invalidFormat],
    quickReplies: [
      { label: 'Try Again', value: 'try again' },
      { label: 'Talk to Agent', value: 'talk to agent' },
      { label: 'Main Menu', value: 'main menu' }
    ],
    newState: STATES.AWAITING_ORDER_NUMBER,
    context: {},
    fallbackCount: fallbackCount + 1
  };
}

/**
 * Look up order in mock data
 */
function lookupOrder(orderNumber) {
  const order = orderData[orderNumber];
  
  if (!order) {
    return {
      messages: [responses.orderTracking.notFound(orderNumber)],
      quickReplies: [
        { label: 'Try Another Order', value: 'track another order' },
        { label: 'Talk to Agent', value: 'talk to agent' },
        { label: 'Main Menu', value: 'main menu' }
      ],
      newState: STATES.MAIN_MENU,
      context: {}
    };
  }
  
  // Journey steps derived from status; progressPct drives the card's
  // animated progress bar so the component stays presentation-only.
  const ORDER_STEPS = ['Ordered', 'Processing', 'Shipped', 'Delivered'];
  const activeStep = { Processing: 1, Shipped: 2, Delivered: 3 }[order.status] ?? 0;
  const orderCard = {
    type: 'order',
    orderNumber,
    status: order.status,
    deliveryEstimate: order.deliveryEstimate,
    steps: ORDER_STEPS,
    activeStep,
    progressPct: [12, 45, 78, 100][activeStep]
  };

  // Special handling for delivered orders
  if (order.status === 'Delivered') {
    return {
      messages: [
        orderCard,
        responses.orderTracking.followUpDelivered
      ],
      quickReplies: [
        { label: 'Yes, all good!', value: 'all good' },
        { label: 'I have an issue', value: 'talk to agent' },
        { label: 'Main Menu', value: 'main menu' }
      ],
      newState: STATES.ORDER_RESULT,
      context: { orderNumber, orderStatus: order.status }
    };
  }

  return {
    messages: [orderCard],
    quickReplies: [
      { label: 'Track Another Order', value: 'track another order' },
      { label: 'Returns Help', value: 'return policy' },
      { label: 'Main Menu', value: 'main menu' }
    ],
    newState: STATES.ORDER_RESULT,
    context: { orderNumber, orderStatus: order.status }
  };
}

/**
 * Handle order result follow-up
 * POST-RESOLUTION RULES:
 * - Another order number → look it up (tracked in pipeline)
 * - "all good" / pleasantry → acknowledge and offer menu
 * - Return keywords → switch to returns flow
 * - Issue keywords → offer agent
 * - Main menu → exit
 * - Anything else → check intent or gentle fallback
 */
function handleOrderResultFollowup(userInput, context, fallbackCount, currentFlow) {
  const lower = userInput.toLowerCase().trim();
  const { intent } = recognizeIntent(userInput);
  
  // Handle "all good" confirmation
  if (lower.includes('all good') || lower.includes('everything is fine') || 
      lower.includes('everything is ok') || intent === 'THANKS') {
    return {
      messages: [randomChoice(responses.thanks) + " Anything else I can help you with?"],
      quickReplies: [
        { label: 'Track Another Order', value: 'track order' },
        { label: 'Returns', value: 'return policy' },
        { label: 'Recommendations', value: 'recommend gear' },
        { label: 'Main Menu', value: 'main menu' }
      ],
      newState: STATES.MAIN_MENU,
      context: {}
    };
  }
  
  // Handle issue keywords - offer agent
  if (lower.includes('issue') || lower.includes('problem') || lower.includes('wrong') || 
      lower.includes('damaged') || lower.includes('missing')) {
    return {
      messages: ["I'm sorry to hear that! Let me connect you with a specialist who can help resolve this."],
      quickReplies: [
        { label: 'Connect to Agent', value: 'talk to agent' },
        { label: 'Main Menu', value: 'main menu' }
      ],
      newState: STATES.ORDER_RESULT,
      context: context
    };
  }
  
  // Check for returns intent
  if (intent === 'RETURNS') {
    return {
      messages: [responses.returns.policy],
      quickReplies: [
        { label: 'More Questions', value: 'more questions about returns' },
        { label: 'Talk to Agent', value: 'talk to agent' },
        { label: 'Main Menu', value: 'main menu' }
      ],
      newState: STATES.RETURNS_INFO,
      context: {}
    };
  }
  
  // Let intent detection handle known intents
  return null;
}

/**
 * Handle returns follow-up
 * POST-RESOLUTION RULES:
 * - Packaging question → clarify packaging requirement
 * - Timeframe question → clarify 30-day window
 * - "start a return" → show link again
 * - Order number → switch to order tracking
 * - Main menu → exit
 * - Anything else → check intent or gentle fallback
 */
function handleReturnsFollowup(userInput, fallbackCount, currentFlow) {
  const lower = userInput.toLowerCase().trim();
  const { intent } = recognizeIntent(userInput);
  
  // Handle follow-up questions about returns policy
  if (lower.includes('packaging') || lower.includes('package') || lower.includes('box')) {
    return {
      messages: ["Items must be in their original packaging — that includes the original box, tags, and any protective materials. This helps us process returns quickly!"],
      quickReplies: [
        { label: 'More Questions', value: 'more questions' },
        { label: 'Talk to Agent', value: 'talk to agent' },
        { label: 'Main Menu', value: 'main menu' }
      ],
      newState: STATES.RETURNS_INFO,
      context: {}
    };
  }
  
  if (lower.includes('how long') || lower.includes('timeframe') || lower.includes('30 day') || 
      lower.includes('time limit') || lower.includes('window')) {
    return {
      messages: ["You have 30 days from your purchase date to initiate a return. After that, we're unfortunately unable to accept returns. The 30-day window ensures items are still in season and sellable."],
      quickReplies: [
        { label: 'More Questions', value: 'more questions' },
        { label: 'Talk to Agent', value: 'talk to agent' },
        { label: 'Main Menu', value: 'main menu' }
      ],
      newState: STATES.RETURNS_INFO,
      context: {}
    };
  }
  
  if (lower.includes('unused') || lower.includes('used') || lower.includes('condition')) {
    return {
      messages: ["Items must be unused and in the same condition as when you received them. That means no wear, dirt, or signs of use. We want to make sure the next customer gets a pristine product!"],
      quickReplies: [
        { label: 'More Questions', value: 'more questions' },
        { label: 'Talk to Agent', value: 'talk to agent' },
        { label: 'Main Menu', value: 'main menu' }
      ],
      newState: STATES.RETURNS_INFO,
      context: {}
    };
  }
  
  if (lower.includes('start') || lower.includes('initiate') || lower.includes('begin') || 
      lower.includes('how do i return') || lower.includes('process')) {
    return {
      messages: ["To start your return, visit our returns portal at northstaroutdoors.com/returns — you'll enter your order number and email, then print a prepaid shipping label. Easy!"],
      quickReplies: [
        { label: 'More Questions', value: 'more questions' },
        { label: 'Talk to Agent', value: 'talk to agent' },
        { label: 'Main Menu', value: 'main menu' }
      ],
      newState: STATES.RETURNS_INFO,
      context: {}
    };
  }
  
  // Check if they want to switch to order tracking
  if (intent === 'ORDER_TRACKING') {
    return {
      messages: [responses.orderTracking.prompt],
      quickReplies: [
        { label: 'Main Menu', value: 'main menu' }
      ],
      newState: STATES.AWAITING_ORDER_NUMBER,
      context: {}
    };
  }
  
  // Let intent detection handle other cases
  return null;
}

/**
 * Handle shipping follow-up
 * POST-RESOLUTION RULES:
 * - Standard shipping question → clarify standard timeframe
 * - Expedited shipping question → clarify expedited timeframe
 * - Order number / order tracking intent → switch to order tracking
 * - Returns intent → switch to returns flow
 * - Main menu → exit
 * - Anything else → check intent or gentle fallback
 */
function handleShippingFollowup(userInput, fallbackCount, currentFlow) {
  const lower = userInput.toLowerCase().trim();
  const { intent } = recognizeIntent(userInput);

  if (lower.includes('standard')) {
    return {
      messages: [`Standard shipping takes ${shippingInfo.standard} once your order ships.`],
      quickReplies: [
        { label: 'More Questions', value: 'more questions' },
        { label: 'Talk to Agent', value: 'talk to agent' },
        { label: 'Main Menu', value: 'main menu' }
      ],
      newState: STATES.SHIPPING_INFO,
      context: {}
    };
  }

  if (lower.includes('expedited') || lower.includes('express') || lower.includes('fast') || lower.includes('quick')) {
    return {
      messages: [`Expedited shipping takes ${shippingInfo.expedited} once your order ships.`],
      quickReplies: [
        { label: 'More Questions', value: 'more questions' },
        { label: 'Talk to Agent', value: 'talk to agent' },
        { label: 'Main Menu', value: 'main menu' }
      ],
      newState: STATES.SHIPPING_INFO,
      context: {}
    };
  }

  // Check if they want to switch to order tracking
  if (intent === 'ORDER_TRACKING') {
    return {
      messages: [responses.orderTracking.prompt],
      quickReplies: [
        { label: 'Main Menu', value: 'main menu' }
      ],
      newState: STATES.AWAITING_ORDER_NUMBER,
      context: {}
    };
  }

  // Check if they want to switch to returns
  if (intent === 'RETURNS') {
    return {
      messages: [responses.returns.policy],
      quickReplies: [
        { label: 'More Questions', value: 'more questions about returns' },
        { label: 'Talk to Agent', value: 'talk to agent' },
        { label: 'Main Menu', value: 'main menu' }
      ],
      newState: STATES.RETURNS_INFO,
      context: {}
    };
  }

  // Let intent detection handle other cases
  return null;
}

/**
 * Handle activity selection for recommendations
 */
function handleActivitySelection(userInput, fallbackCount) {
  const input = userInput.toLowerCase().trim();
  const activities = recommendationTree.activities;
  
  let selectedActivity = null;

  // Direct match (case-insensitive: quick-reply values are camelCase keys
  // like 'winterSports' but user input is lowercased)
  const exactActivity = Object.keys(activities).find(key => key.toLowerCase() === input);
  if (exactActivity) {
    selectedActivity = exactActivity;
  } else {
    // Fuzzy match
    Object.keys(activities).forEach(key => {
      if (input.includes(key.toLowerCase()) || activities[key].label.toLowerCase().includes(input)) {
        selectedActivity = key;
      }
    });
  }
  
  if (!selectedActivity) {
    // Check if user wants main menu
    if (input.includes('main menu') || input.includes('back')) {
      return handleGreeting();
    }
    return handleFallback(fallbackCount);
  }
  
  const activity = activities[selectedActivity];
  const needButtons = Object.keys(activity.needs).map(needKey => {
    return {
      label: activity.needs[needKey].label,
      value: needKey,
      icon: activity.needs[needKey].icon
    };
  });

  return {
    messages: [responses.recommendations.specificNeed],
    quickReplies: needButtons,
    quiz: { step: 2, total: 2, title: activity.label },
    newState: STATES.RECOMMEND_NEED,
    context: { selectedActivity }
  };
}

/**
 * Handle need selection for recommendations
 */
function handleNeedSelection(userInput, context, fallbackCount) {
  const { selectedActivity } = context;
  const input = userInput.toLowerCase().trim();
  
  if (!selectedActivity) {
    return handleFallback(fallbackCount);
  }
  
  const activity = recommendationTree.activities[selectedActivity];
  let selectedNeed = null;

  // Direct match (case-insensitive: quick-reply values are camelCase keys
  // like 'weatherProtection' but user input is lowercased)
  const exactNeed = Object.keys(activity.needs).find(needKey => needKey.toLowerCase() === input);
  if (exactNeed) {
    selectedNeed = exactNeed;
  } else {
    // Fuzzy match
    Object.keys(activity.needs).forEach(needKey => {
      const need = activity.needs[needKey];
      if (input.includes(needKey.toLowerCase()) || need.label.toLowerCase().includes(input)) {
        selectedNeed = needKey;
      }
    });
  }
  
  if (!selectedNeed) {
    if (input.includes('main menu') || input.includes('back')) {
      return handleGreeting();
    }
    return handleFallback(fallbackCount);
  }
  
  const need = activity.needs[selectedNeed];
  const recommendation = need.recommendation;

  // Deterministic playful match score in 88-97 (stable per activity+need,
  // so tests and re-renders never flicker).
  let hash = 0;
  for (const ch of selectedActivity + selectedNeed) {
    hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  }
  const matchScore = 88 + (hash % 10);

  return {
    messages: [
      "Perfect! Here's your match:",
      {
        type: 'recommendation',
        matchScore,
        activityKey: selectedActivity,
        activityLabel: activity.label,
        activityIcon: activity.icon,
        needKey: selectedNeed,
        needLabel: need.label,
        needIcon: need.icon,
        category: recommendation.category,
        description: recommendation.description,
        tip: recommendation.tip
      }
    ],
    quickReplies: [
      { label: 'Recommend Again', value: 'recommend gear' },
      { label: 'Talk to Expert', value: 'talk to agent' },
      { label: 'Main Menu', value: 'main menu' }
    ],
    newState: STATES.RECOMMEND_RESULT,
    context: { selectedActivity, selectedNeed }
  };
}

/**
 * Handle recommendation follow-up
 * POST-RESOLUTION RULES:
 * - Refinement question → offer to re-run recommendation
 * - "show me another" / "different" → restart from activity selection
 * - "talk to expert" → handoff
 * - Main menu → exit
 * - Anything else → check intent or gentle fallback
 */
function handleRecommendationFollowup(userInput, fallbackCount, context, currentFlow) {
  const lower = userInput.toLowerCase().trim();
  const { intent } = recognizeIntent(userInput);
  
  // Handle refinement questions
  if (lower.includes('what about') || lower.includes('what if') || lower.includes('different') ||
      lower.includes('instead') || lower.includes('other') || lower.includes('else')) {
    return {
      messages: ["I can help you find something different! Would you like to explore a different activity, or get another recommendation for the same type of gear?"],
      quickReplies: [
        { label: 'Different Activity', value: 'recommend gear' },
        { label: 'Talk to Expert', value: 'talk to agent' },
        { label: 'Main Menu', value: 'main menu' }
      ],
      newState: STATES.RECOMMEND_RESULT,
      context: context
    };
  }
  
  // Handle "show me another" - restart recommendations
  if (lower.includes('another') || lower.includes('more') || lower.includes('again')) {
    return {
      messages: [responses.recommendations.intro],
      quickReplies: activityReplies(),
      quiz: { step: 1, total: 2, title: 'Find your gear' },
      newState: STATES.RECOMMEND_ACTIVITY,
      context: {}
    };
  }
  
  // Check for agent handoff
  if (intent === 'HUMAN_HANDOFF' || lower.includes('expert') || lower.includes('specialist')) {
    return {
      messages: [responses.handoff.connecting],
      quickReplies: [
        { label: 'Return to Main Menu', value: 'main menu' }
      ],
      newState: STATES.LIVE_AGENT,
      context: {}
    };
  }
  
  // Let intent detection handle other cases
  return null;
}

/**
 * Handle live agent state
 * POST-RESOLUTION RULES:
 * - "never mind" / "cancel" / "go back" → return to main menu
 * - Anything else → acknowledge and confirm they're in queue
 */
function handleLiveAgent(userInput) {
  const lower = userInput.toLowerCase().trim();
  
  // Handle exit requests
  if (lower.includes('main menu') || lower.includes('return') || lower.includes('back') ||
      lower.includes('never mind') || lower.includes('nevermind') || lower.includes('cancel') ||
      lower.includes('exit') || lower.includes('quit')) {
    return {
      messages: [responses.handoff.ended],
      quickReplies: [
        { label: 'Track Order', value: 'track order' },
        { label: 'Returns', value: 'return policy' },
        { label: 'Recommendations', value: 'recommend gear' }
      ],
      newState: STATES.MAIN_MENU,
      context: {}
    };
  }
  
  // Acknowledge their message and confirm they're waiting
  return {
    messages: [responses.handoff.inSession],
    quickReplies: [
      { label: 'Return to Main Menu', value: 'main menu' }
    ],
    newState: STATES.LIVE_AGENT,
    context: {}
  };
}

/**
 * Handle fallback when intent is not recognized
 * Tracks consecutive failures and escalates to agent after 2
 */
function handleFallback(fallbackCount, currentState, currentFlow) {
  const newCount = fallbackCount + 1;
  
  // After 2 consecutive fallbacks, offer human handoff
  if (newCount >= 2) {
    return {
      messages: [responses.fallback.escalate],
      quickReplies: [
        { label: 'Yes, connect me', value: 'talk to agent' },
        { label: 'No, show main menu', value: 'main menu' }
      ],
      newState: STATES.MAIN_MENU,
      context: {},
      fallbackCount: 0 // Reset after escalation offer
    };
  }
  
  // First fallback - provide context-aware message
  let fallbackMessage = responses.fallback.first;
  
  // Add context if we're in a specific flow
  if (currentFlow === 'order_tracking') {
    fallbackMessage = "I didn't quite catch that. If you're trying to track an order, just give me the order number (like #111). Otherwise, here's what I can help with:";
  } else if (currentFlow === 'returns') {
    fallbackMessage = "I didn't quite catch that. If you have a question about our return policy, try asking about packaging, timeframe, or how to start a return. Or choose from:";
  } else if (currentFlow === 'shipping') {
    fallbackMessage = "I didn't quite catch that. If you have a question about shipping, try asking about standard or expedited delivery times. Or choose from:";
  } else if (currentFlow === 'recommend') {
    fallbackMessage = "I didn't quite catch that. If you want a product recommendation, let me know what activity you're interested in. Or choose from:";
  }
  
  return {
    messages: [fallbackMessage],
    quickReplies: [
      { label: 'Track Order', value: 'track order' },
      { label: 'Returns & Exchanges', value: 'return policy' },
      { label: 'Product Recommendations', value: 'recommend gear' },
      { label: 'Talk to Agent', value: 'talk to agent' }
    ],
    newState: STATES.MAIN_MENU,
    context: {},
    fallbackCount: newCount
  };
}
