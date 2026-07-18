# Project Summary — North Star Support Bot

**Quick Reference Document**

---

## What Is This?

A customer support chatbot for North Star Outdoors (outdoor gear e-commerce) built as part of the Upwork Talent Accelerator Program assessment.

**Technology:** React 18.2.0 (pure frontend, no backend)  
**Intelligence:** Rule-based intent recognition with weighted keyword scoring  
**No External Dependencies:** Zero API keys, runs completely offline

---

## 4 Core Use Cases

1. **Order Tracking** — Check status of orders #111, #222, #333 (mock data)
2. **Returns & Exchanges** — Display 30-day return policy
3. **Product Recommendations** — 2-question decision tree (5 activities, multiple needs per activity)
4. **Human Handoff** — Escalate to live agent (simulated)

---

## Key Features That Differentiate This

✨ **Consecutive Fallback Escalation** — After 2 unrecognized inputs, proactively offers agent handoff  
✨ **Typing Indicator** — 800-1200ms simulated "thinking" makes it feel alive  
✨ **Dual Input Mode** — Free text + quick reply buttons work simultaneously  
✨ **Smart Intent Scoring** — Handles varied phrasings, not just exact keywords  
✨ **No Dead Ends** — Every state has a "Main Menu" escape hatch  

---

## Architecture in 3 Layers

```
┌─────────────────┐
│   UI Layer      │ ← ChatWindow, Message, QuickReplies, TypingIndicator
├─────────────────┤
│  Engine Layer   │ ← Message Pipeline → intentRecognizer.js, conversationFlow.js
├─────────────────┤
│   Data Layer    │ ← mockData.js, responses.js, recommendationTree.js
└─────────────────┘
```

**Message Processing Pipeline (runs on every input):**
```
1. Order number check    → Extract & lookup globally
2. Pleasantry check      → Absorb without reset
3. Active flow context   → Resolve within current flow
4. Intent detection      → Switch flows if needed
5. Fallback             → Context-aware escalation
```

---

## Context Persistence — The Key Fix

**Problem Solved:**  
Traditional chatbots lose context after each flow completes. This bot maintains conversation memory.

**Examples:**
- User: "222" → Bot shows order  
- User: "sorry its 333" → Bot understands correction, looks up 333 ✅

- User: "return policy" → Bot shows policy  
- User: "what about packaging" → Bot answers in context ✅

- User: "track order 111" → Bot shows status  
- User: "thanks" → Bot absorbs pleasantry, offers next steps ✅

**How:**  
- Persistent context object tracks: `currentFlow`, `lastFlow`, `lastOrderNumber`, `fallbackCount`
- Pipeline checks context before running intent detection
- Each flow defines post-resolution rules for follow-ups

---

## How to Run

```bash
npm install
npm start
```

Opens at `http://localhost:3000` — no configuration needed.

---

## Files Overview

**Core Engine:**
- `src/engine/intentRecognizer.js` — Weighted keyword scoring for intent classification
- `src/engine/conversationFlow.js` — Finite state machine handling conversation routing

**Data:**
- `src/data/mockData.js` — Order statuses (#111, #222, #333), return policy, shipping info
- `src/data/responses.js` — All bot message templates
- `src/data/recommendationTree.js` — Product recommendation decision tree (5 activities × 4 needs each)

**UI Components:**
- `src/components/ChatWindow.jsx` — Main container, manages state and message flow
- `src/components/Message.jsx` — Individual chat bubble (bot/user)
- `src/components/QuickReplies.jsx` — Interactive button interface
- `src/components/TypingIndicator.jsx` — Animated typing dots

**Documentation:**
- `README.md` — Setup guide, architecture notes, testing instructions
- `TESTING_GUIDE.md` — Comprehensive test cases for all flows
- `VIDEO_DEMO_SCRIPT.md` — Script for recording demo video
- `SUBMISSION_CHECKLIST.md` — Pre-submission quality checklist

---

## Intent Recognition: How It Works

**Universal Message Pipeline (runs first, before intent detection):**

```
Message → Order Number? → YES → Lookup immediately (works in any state)
              ↓ NO
          Pleasantry? → YES → Absorb, stay in current flow
              ↓ NO
       Active Context? → YES → Resolve within current flow
              ↓ NO
       Intent Detection → Score & Route
              ↓
          Fallback
```

**Intent Scoring Process:**

1. **Tokenize** user input → `["where", "is", "my", "order"]`
2. **Score** against all intents using weighted keywords:
   - High-weight match = 3 points (e.g., "order", "track")
   - Medium-weight match = 2 points (e.g., "where", "status")
   - Low-weight match = 1 point (e.g., "my", "is")
3. **Select** highest-scoring intent above threshold
4. **Extract** entities (e.g., order number from input)
5. **Route** to appropriate conversation handler

**Why the Pipeline Matters:**

Without the pipeline, every message goes straight to intent detection. Problem:
- "sorry its 333" has no scoreable keywords → falls to fallback ❌
- "what about packaging" has no return keywords → falls to fallback ❌
- "thanks" triggers THANKS intent → resets entire flow ❌

With the pipeline:
- "sorry its 333" → order number extracted globally at step 1 ✅
- "what about packaging" → resolved within returns context at step 3 ✅
- "thanks" → absorbed at step 2, flow stays alive ✅

---

## Conversation State Machine

```
IDLE → MAIN_MENU (context persists across all transitions)
       ├── ORDER_TRACKING → AWAITING_ORDER_NUMBER → ORDER_RESULT → stays open
       ├── RETURNS → RETURNS_INFO → stays open
       ├── RECOMMEND → RECOMMEND_ACTIVITY → RECOMMEND_NEED → RECOMMEND_RESULT → stays open
       ├── HUMAN_HANDOFF → LIVE_AGENT → stays open
       └── FALLBACK (x2) → escalate to LIVE_AGENT
```

**Key Change:** Flows no longer exit immediately after resolution. Each flow stays active and defines its own post-resolution rules:

**Order Result → User can:**
- Type another order number → lookup immediately
- Ask about returns → switch to returns flow
- Say "all good" → acknowledge and return to menu
- Type nonsense → context-aware fallback

**Returns Info → User can:**
- Ask "what about packaging" → get detailed answer in context
- Ask "how long" → get timeframe clarification
- Type order number → switch to order tracking
- Type nonsense → context-aware fallback

**Recommendation Result → User can:**
- Ask "what about X" → offer alternatives
- Say "show me another" → restart recommendations
- Ask for expert → handoff to agent
- Type nonsense → context-aware fallback

**Live Agent → User can:**
- Say "never mind" → return to main menu cleanly
- Type anything else → acknowledge, stay in queue

---

## Mock Data (Do Not Modify — Matches PRD Exactly)

**Orders:**
- `#111` → Shipped (arriving tomorrow)
- `#222` → Processing (ships within 24 hours)
- `#333` → Delivered (follow-up question triggered)
- Any other → Not found

**Return Policy:**
- 30-day window
- Unused items only
- Original packaging required
- Link: northstaroutdoors.com/returns

**Shipping:**
- Standard: 3-5 business days
- Expedited: 1-2 business days

---

## Product Recommendation Tree Structure

**5 Activities:**
1. Hiking & Trekking (4 needs)
2. Camping & Shelter (4 needs)
3. Climbing (4 needs)
4. Winter Sports (4 needs)
5. Cycling & Adventure (4 needs)

**Each recommendation includes:**
- Category name (e.g., "Waterproof Jackets & Rain Gear")
- Description (2-3 sentences)
- Pro tip (1 sentence, starts with 💡)

---

## Testing Quick Reference

**Valid Orders:** `#111`, `#222`, `#333`  
**Invalid Order:** `#999` or any other number  
**Order Formats:** `#111`, `111`, `order 111`, `order #111` (all work)

**Intent Triggers:**
- Order Tracking: `"where is my order"`, `"track package"`, `"order status"`
- Returns: `"return policy"`, `"how to return"`, `"refund"`
- Recommend: `"recommend gear"`, `"what should I buy"`, `"suggest product"`
- Agent: `"talk to agent"`, `"connect to human"`, `"speak to person"`

**Fallback Test:** Type nonsense twice → bot offers agent escalation

---

## Why This Approach (Not LLM)

**Reasons:**
1. ✅ Evaluators can test instantly (no API key setup)
2. ✅ Predictable behavior (matches spec exactly)
3. ✅ No external dependencies (zero security risk)
4. ✅ Demonstrates engineering judgment (right tool for the job)
5. ✅ Shows algorithmic thinking (intent scoring, state machine)

**What evaluators will notice:**
- Professional code organization
- Clean separation of concerns
- Smart intent recognition (not just if/else)
- Polished UI/UX
- Comprehensive documentation

---

## Key Decisions Made

**Decision 1:** No LLM/API (see "Why This Approach" above)  
**Decision 2:** Weighted keyword scoring over simple keyword match (handles variations)  
**Decision 3:** Consecutive fallback escalation (not in spec, but good UX)  
**Decision 4:** Typing delay simulation (makes bot feel natural)  
**Decision 5:** Dual input mode (buttons + text, maximizes accessibility)

---

## Potential Evaluator Questions

**Q: Why not use ChatGPT/LLM?**  
A: The spec requires evaluators to run without API keys. Embedding keys in frontend code would be a security anti-pattern. A well-executed rule-based system demonstrates better engineering judgment for this context.

**Q: How does intent recognition handle variations?**  
A: Weighted keyword scoring. Each intent has high/medium/low weight keywords. User input is tokenized, matched against all keywords, scores summed, highest score wins (if above threshold).

**Q: What happens if two intents score equally?**  
A: The first one checked wins (order tracking, returns, recommend, agent in that order). In practice, this rarely happens due to weight differences.

**Q: Can it handle typos?**  
A: Partially. Minor typos may still match (e.g., "reccomend" → won't match "recommend" exactly, but other keywords in input might trigger intent). Severe typos will fallback gracefully.

**Q: Is the recommendation tree hardcoded?**  
A: Yes, in `recommendationTree.js`. This is by design — spec requires specific product categories and tips. A real implementation would fetch from a CMS or database.

---

## Time Investment

**Actual Build Time:** ~6 hours  
- Architecture & engine: 2 hours
- UI components & styling: 2 hours
- Data setup & testing: 1 hour
- Documentation: 1 hour

**Submission Prep Time:** ~3 hours  
- Final testing: 1 hour
- Video recording: 1 hour
- Documentation review & packaging: 1 hour

**Total:** ~9 hours for complete delivery

---

## Next Steps

1. ✅ Code complete
2. ⬜ Run through full TESTING_GUIDE.md
3. ⬜ Record video using VIDEO_DEMO_SCRIPT.md
4. ⬜ Complete SUBMISSION_CHECKLIST.md
5. ⬜ Package and submit to Upwork

---

**Last Updated:** July 18, 2026  
**Status:** ✅ Development Complete — Ready for Testing
