# Architecture Notes — North Star Support Bot

**Technical deep-dive into the conversation engine design**

---

## The Problem We Solved

Traditional chatbot implementations suffer from **context amnesia** — after completing any flow, they treat the next message as a brand new conversation.

### Symptoms:
- ❌ "sorry its 333" → Fallback (no "order" keyword)
- ❌ "what about packaging" → Fallback (no "return" keyword)
- ❌ "thanks" → Resets entire conversation
- ❌ "never mind" during handoff → Stuck in state

### Root Cause:
Two architectural flaws:

1. **No context survival** — State machine resets after each flow resolution
2. **Intent detection runs on everything** — Even when context provides the answer

---

## The Solution: Universal Message Pipeline

Every message flows through a **5-step pipeline** in strict order, running **above** all conversation flows.

```
┌─────────────────────────────────────────────────┐
│         UNIVERSAL MESSAGE PIPELINE              │
│                                                 │
│  1. Order Number Check   → Extract globally    │
│  2. Pleasantry Check     → Absorb gracefully   │
│  3. Active Flow Context  → Resolve in context  │
│  4. Intent Detection     → Switch flows        │
│  5. Fallback            → Escalate smartly     │
│                                                 │
└─────────────────────────────────────────────────┘
                         ↓
               ┌──────────────────┐
               │  CONVERSATION    │
               │     FLOWS        │
               │                  │
               │  • Order Track   │
               │  • Returns       │
               │  • Recommend     │
               │  • Handoff       │
               └──────────────────┘
```

---

## Pipeline Step 1: Global Order Number Extraction

**Runs first, always, regardless of state.**

```javascript
const orderNumber = extractOrderNumber(userInput);
if (orderNumber) {
  return lookupOrder(orderNumber);
}
```

**Why:**  
Order numbers are entities, not intents. They should work anywhere in the conversation.

**Patterns Matched:**
- `#111`, `111`, `333`
- `order 111`, `order #222`
- `sorry its 333`, `actually 222`, `wait, 111`

**Result:**
- ✅ "sorry its 333" → Looks up 333 immediately
- ✅ "actually 222" → Looks up 222 immediately
- ✅ Works after any previous flow

---

## Pipeline Step 2: Pleasantry Absorption

**Handles social niceties without breaking flow.**

```javascript
if (isPleasantry(userInput)) {
  return handlePleasantry(state, context, currentFlow);
}
```

**Recognized Pleasantries:**
- `thanks`, `thank you`, `thankyou`, `thx`, `ty`
- `ok`, `okay`, `sure`, `got it`, `understood`
- `cool`, `great`, `awesome`, `perfect`, `nice`
- `appreciate it`, `cheers`

**Behavior:**
- In result states (ORDER_RESULT, RETURNS_INFO, RECOMMEND_RESULT):
  - Acknowledge: "You're welcome! Is there anything else I can help you with?"
  - Offer main menu
  
- In other states:
  - Acknowledge: "You're welcome!"
  - Stay in current state
  - Don't reset context

**Result:**
- ✅ "thanks" → Absorbed gracefully, no reset
- ✅ "ok" → Absorbed, stays in flow
- ✅ "got it" → Absorbed, context preserved

---

## Pipeline Step 3: Active Flow Context Resolution

**Tries to resolve input within the current active flow before running intent detection.**

```javascript
const flowResult = handleWithinFlow(userInput, state, context, fallbackCount, currentFlow);
if (flowResult) {
  return flowResult; // Resolved in context
}
// If null, continue to intent detection
```

**Per-Flow Context Handlers:**

### Order Result Context
Handles:
- "all good", "everything is fine" → Acknowledge, return to menu
- "issue", "problem", "wrong", "damaged" → Offer agent
- Returns keywords → Switch to returns flow

### Returns Info Context
Handles:
- "packaging", "package", "box" → Explain packaging requirement
- "how long", "timeframe", "30 day" → Explain 30-day window
- "unused", "used", "condition" → Explain unused requirement
- "start", "initiate", "how do i return" → Show returns link
- Order number detected → Switch to order tracking

### Recommendation Result Context
Handles:
- "what about", "what if", "different" → Offer alternatives
- "another", "more", "again" → Restart recommendations
- "expert", "specialist" → Handoff to agent

### Live Agent Context
Handles:
- "never mind", "cancel", "go back" → Exit cleanly to menu
- Anything else → Acknowledge, stay in queue

**Result:**
- ✅ "what about packaging" after returns → Detailed answer
- ✅ "how long do I have" after returns → 30-day explanation
- ✅ "never mind" in handoff → Clean exit
- ✅ "what about X" after recommendation → Smart refinement

---

## Pipeline Step 4: Fresh Intent Detection

**Only runs if context doesn't resolve the input.**

```javascript
const { intent } = recognizeIntent(userInput);
if (intent !== 'UNKNOWN') {
  return routeToFlow(intent, state, fallbackCount);
}
```

**Intent Scoring Algorithm:**

```javascript
// Weighted keyword matching
const weights = {
  high: 3,    // "order", "track", "return", "recommend"
  medium: 2,  // "where", "status", "policy", "suggest"
  low: 1      // "my", "is", "want", "need"
};

// Calculate score for each intent
let score = 0;
for (keyword in intent.highWeightKeywords) {
  if (input.includes(keyword)) score += 3;
}
for (keyword in intent.mediumWeightKeywords) {
  if (input.includes(keyword)) score += 2;
}
// ... etc

// Select highest score above threshold
if (score >= threshold) return intent;
```

**Intent Thresholds:**
- ORDER_TRACKING: 2
- RETURNS: 2
- RECOMMEND: 2
- HUMAN_HANDOFF: 2
- GREETING: 3
- THANKS: 3
- GOODBYE: 3

**Flow Routing:**
- ORDER_TRACKING → AWAITING_ORDER_NUMBER state
- RETURNS → RETURNS_INFO state
- RECOMMEND → RECOMMEND_ACTIVITY state
- HUMAN_HANDOFF → LIVE_AGENT state

**Result:**
- ✅ Intent detection only runs if Steps 1-3 don't resolve
- ✅ Allows smooth flow switching ("what about returns" after order)
- ✅ Prevents premature fallbacks

---

## Pipeline Step 5: Context-Aware Fallback

**Handles unrecognized input with context-specific guidance.**

```javascript
function handleFallback(fallbackCount, currentState, currentFlow) {
  const newCount = fallbackCount + 1;
  
  // After 2 consecutive fallbacks, offer agent
  if (newCount >= 2) {
    return {
      messages: ["Seems like I'm having trouble understanding. Would you like me to connect you with a live agent?"],
      quickReplies: [
        { label: 'Yes, connect me 🧑‍💼', value: 'talk to agent' },
        { label: 'No, show main menu', value: 'main menu' }
      ],
      fallbackCount: 0 // Reset after escalation offer
    };
  }
  
  // First fallback - context-aware message
  let message = responses.fallback.first;
  
  if (currentFlow === 'order_tracking') {
    message = "I didn't quite catch that. If you're trying to track an order, just give me the order number (like #111). Otherwise, here's what I can help with:";
  } else if (currentFlow === 'returns') {
    message = "I didn't quite catch that. If you have a question about our return policy, try asking about packaging, timeframe, or how to start a return. Or choose from:";
  } else if (currentFlow === 'recommend') {
    message = "I didn't quite catch that. If you want a product recommendation, let me know what activity you're interested in. Or choose from:";
  }
  
  return {
    messages: [message],
    quickReplies: [...mainMenuOptions],
    fallbackCount: newCount
  };
}
```

**Features:**
- Tracks consecutive failures
- Escalates to agent after 2 consecutive fallbacks
- Provides context-aware guidance based on currentFlow
- Resets count on successful action
- Offers clear recovery paths

**Result:**
- ✅ Context-aware fallback messages
- ✅ Proactive escalation after repeated failures
- ✅ Clear recovery options always available

---

## Context Object Structure

The conversation state now tracks:

```javascript
{
  state: 'ORDER_RESULT',          // Current FSM state
  context: {                      // Flow-specific context
    orderNumber: '111',
    orderStatus: 'Shipped'
  },
  fallbackCount: 0,               // Consecutive fallback counter
  history: [...],                 // Conversation history
  currentFlow: 'order_tracking',  // Active flow identifier
  lastFlow: 'main_menu',          // Previous flow
  lastOrderNumber: '111'          // Last order looked up
}
```

**Persistence Rules:**

1. **currentFlow** persists after flow completion
2. **lastOrderNumber** persists across all flows
3. **fallbackCount** resets on successful action
4. **context** is flow-specific, cleared on flow switch

---

## Post-Resolution Rules

Each flow no longer exits immediately. Instead, flows **stay open** and define what happens next:

### Order Tracking → After Result
```javascript
// User can:
// - Type another order number → lookup immediately (Step 1)
// - Say "all good" → acknowledge and menu (Step 3)
// - Ask about returns → switch flows (Step 4)
// - Type nonsense → context-aware fallback (Step 5)
```

### Returns → After Policy Shown
```javascript
// User can:
// - Ask "what about packaging" → detailed answer (Step 3)
// - Ask "how long" → timeframe clarification (Step 3)
// - Type order number → switch to tracking (Step 1)
// - Type nonsense → context-aware fallback (Step 5)
```

### Recommendations → After Result
```javascript
// User can:
// - Ask "what about X" → offer refinement (Step 3)
// - Say "show another" → restart recommendations (Step 3)
// - Ask for expert → handoff (Step 4)
// - Type nonsense → context-aware fallback (Step 5)
```

### Live Agent → In Session
```javascript
// User can:
// - Say "never mind" → clean exit (Step 3)
// - Say anything else → acknowledge, stay in queue (Step 3)
```

---

## Flow Switching Logic

**Key Insight:** Context resolution runs **before** intent detection, so flows can gracefully transition.

**Example Flow:**

```
User: "track order 111"
→ Step 1: Extract "111" → ORDER_TRACKING flow
→ Bot shows order status
→ State: ORDER_RESULT, currentFlow: 'order_tracking'

User: "what about returns"
→ Step 1: No order number → continue
→ Step 2: Not pleasantry → continue
→ Step 3: handleOrderResultFollowup checks intent
→   Recognizes RETURNS intent → returns null (let pipeline handle)
→ Step 4: Intent detection → RETURNS → Switch flows
→ Bot shows return policy
→ State: RETURNS_INFO, currentFlow: 'returns', lastFlow: 'order_tracking'

User: "what about packaging"
→ Step 1: No order number → continue
→ Step 2: Not pleasantry → continue
→ Step 3: handleReturnsFollowup detects "packaging"
→   Returns detailed packaging answer (resolved in context)
→ Bot explains packaging requirement
→ State: RETURNS_INFO, currentFlow: 'returns' (unchanged)
```

---

## Key Design Patterns

### 1. Pipeline Over Switch Statement

**Old Approach:**
```javascript
switch (state) {
  case MAIN_MENU: handleMainMenu(input);
  case ORDER_RESULT: handleOrderResult(input);
  // ...
}
```

**New Approach:**
```javascript
// Universal pipeline
if (orderNumber) return lookupOrder(orderNumber);
if (isPleasantry) return absorbPleasantry();
if (flowContext) {
  const result = resolveInContext();
  if (result) return result;
}
// Then state-specific handling
```

**Benefit:** Universal checks run first, context preserved.

---

### 2. Return Null to Continue Pipeline

Handlers can return `null` to signal "I can't handle this, continue pipeline."

```javascript
function handleOrderResultFollowup(input, context) {
  if (input.includes('all good')) {
    return ack AndReturnToMenu();
  }
  
  // Check for returns intent
  const { intent } = recognizeIntent(input);
  if (intent === 'RETURNS') {
    return null; // Let pipeline route to RETURNS flow
  }
  
  return null; // Let pipeline continue to Step 4
}
```

---

### 3. Fallback Count Tracking

```javascript
// Increment on fallback
fallbackCount: fallbackCount + 1

// Reset on successful action
fallbackCount: 0

// Check threshold
if (fallbackCount >= 2) {
  offerAgentEscalation();
}
```

**Ensures:** User frustration is detected and escalated proactively.

---

## Testing Strategy

### Unit Tests (Mental Model)
- Step 1: Does `extractOrderNumber("sorry its 333")` return "333"?
- Step 2: Does `isPleasantry("thanks")` return true?
- Step 3: Does `handleReturnsFollowup("what about packaging")` return answer?
- Step 4: Does `recognizeIntent("what about returns")` return RETURNS?
- Step 5: Does `handleFallback(1, 'returns')` provide context-aware message?

### Integration Tests (See CONTEXT_TESTING.md)
- Order corrections work globally
- Returns follow-ups stay in context
- Pleasantries don't reset flow
- Handoff recovery works cleanly
- Flow switching is smooth
- Fallback escalation triggers correctly

---

## Performance Considerations

**Pipeline Overhead:**
- 5 checks per message
- Most checks are O(1) or O(n) where n = input length
- Order extraction: Regex match
- Pleasantry check: Array lookup
- Flow context: Single function call
- Intent detection: Keyword scoring (already existed)
- Fallback: Simple counter check

**Result:** Negligible overhead (<1ms per message)

---

## Future Enhancements

### Potential Improvements:
1. **Context Timeout** — Clear context after 5 minutes of inactivity
2. **Multi-turn Entity Collection** — "What's the order number?" "111" "And the email?" "user@example.com"
3. **Conversation History UI** — Show past exchanges in sidebar
4. **Context Repair** — "Did you mean order 333 instead of 111?"
5. **Proactive Suggestions** — "I see you checked order 111. Would you like to start a return?"

---

## Why This Architecture Works

### ✅ Separation of Concerns
- Pipeline handles universal logic
- Flows handle domain-specific logic
- Clean boundaries, easy to test

### ✅ Predictable Execution Order
- Pipeline steps run in strict order
- No race conditions or ambiguity
- Easy to reason about behavior

### ✅ Context Preservation
- Persistent state object
- Flows stay open after completion
- Post-resolution rules defined per flow

### ✅ Graceful Degradation
- Each step can pass to next
- Fallback is last resort
- User never stuck

### ✅ Extensibility
- Add new flows without touching pipeline
- Add new context handlers easily
- Add new intent types trivially

---

## Implementation Files

**Core Pipeline:**
- `src/engine/conversationFlow.js` — Main pipeline logic

**Supporting Modules:**
- `src/engine/intentRecognizer.js` — Step 4 (Intent detection)
- `src/data/mockData.js` — Order data, policies
- `src/data/responses.js` — Bot message templates
- `src/data/recommendationTree.js` — Product decision tree

**UI Integration:**
- `src/components/ChatWindow.jsx` — State management integration

---

## Key Takeaways

1. **Context is king** — Preserve it at all costs
2. **Pipeline over branching** — Universal checks before specific logic
3. **Return null to continue** — Handlers can defer to later steps
4. **Flows stay open** — Define post-resolution rules
5. **Test context transitions** — That's where bugs hide

---

**Last Updated:** July 18, 2026  
**Architecture:** Message Pipeline + Context Persistence  
**Status:** ✅ Production-Ready
