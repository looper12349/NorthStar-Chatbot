# North Star Support Bot

A customer support chatbot for North Star Outdoors — specializing in outdoor apparel and camping gear. Built with React, this intelligent bot handles order tracking, returns, product recommendations, and seamless escalation to live agents.

![North Star Support Bot](https://img.shields.io/badge/React-18.2.0-blue) ![No External APIs](https://img.shields.io/badge/Dependencies-None-green)

---

## Features

✅ **Order Tracking** — Check shipment status for orders  
✅ **Returns & Exchanges** — Get clear return policy information  
✅ **Product Recommendations** — Two-question decision tree for personalized gear suggestions  
✅ **Human Handoff** — Seamless escalation to live agent support  
✅ **Smart Fallback Handling** — Proactive agent escalation after consecutive failures  
✅ **Dual Input Mode** — Free text + quick reply buttons work simultaneously  
✅ **Professional UI** — Polished chat interface with typing indicators  

---

## Prerequisites

- **Node.js** version 14 or higher
- **npm** (comes with Node.js)

---

## Setup & Installation

1. **Clone or download this repository**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser** — The app will automatically open at `http://localhost:3000`

That's it! The chatbot is fully self-contained with no external API keys or configuration required.

---

## How to Test Each Use Case

### 1. Order Tracking

**Test Valid Orders:**
- Type: `"track my order"` or `"where is my package"`
- When prompted, enter: `#111` (shipped), `#222` (processing), or `#333` (delivered)

**Test Invalid Order:**
- Enter order number: `#999` (not found)

**Test Direct Entry:**
- Type: `"track order 111"` (extracts order number automatically)

### 2. Returns & Exchanges

- Type: `"I want to return something"` or `"what's your return policy"`
- Bot displays the full 30-day return policy with conditions

### 3. Product Recommendations

- Type: `"recommend me some gear"` or `"I need help finding gear"`
- Select an activity (e.g., Hiking, Camping, Climbing)
- Select a specific need (e.g., Weather Protection, Footwear)
- Receive tailored product category recommendation + pro tip

**Test Multiple Activities:**
- Try all 5 activities: Hiking, Camping, Climbing, Winter Sports, Cycling

### 4. Human Handoff

**Explicit Request:**
- Type: `"talk to an agent"` or `"connect me to a human"`
- Bot transitions to live agent mode

**Fallback Escalation:**
- Type nonsense twice in a row (e.g., `"asdfasdf"` then `"qwerty"`)
- Bot proactively offers human handoff after 2 consecutive failures

**Return from Agent:**
- Click "Return to Main Menu" to exit live agent mode

### 5. Fallback Handling

- Type unrecognized input (e.g., `"purple monkey dishwasher"`)
- Bot displays fallback message with main menu options
- Try again with another unrecognized input — bot offers agent escalation

---

## Architecture Overview

### Project Structure

```
north-star-chatbot/
├── public/
├── src/
│   ├── components/          # React UI components
│   │   ├── ChatWindow.jsx   # Main chat container
│   │   ├── Message.jsx      # Individual message bubble
│   │   ├── QuickReplies.jsx # Button interface
│   │   └── TypingIndicator.jsx # Animated typing dots
│   ├── engine/              # Core chatbot logic
│   │   ├── intentRecognizer.js  # Weighted keyword scoring
│   │   └── conversationFlow.js  # State machine & routing
│   ├── data/                # Business rules & content
│   │   ├── mockData.js      # Order statuses & policies
│   │   ├── responses.js     # Bot message templates
│   │   └── recommendationTree.js # Product decision tree
│   ├── App.jsx
│   └── index.js
├── README.md
└── package.json
```

### How It Works

**Message Processing Pipeline**  
Every user message goes through a 5-step pipeline in strict order:

1. **Order Number Check** — Extracts order numbers globally (works in any state)
2. **Pleasantry Absorption** — Handles "thanks", "ok" without breaking flow
3. **Active Flow Context** — Resolves within current conversation context
4. **Fresh Intent Detection** — Switches flows when user changes topic
5. **Fallback** — Graceful handling with context-aware messages

**Layer 1 — Intent Recognition**  
User input → Tokenization → Weighted keyword scoring → Intent classification

**Layer 2 — Conversation Flow**  
Pipeline + Context + State → Flow handler → Post-resolution rules → Response

**Layer 3 — UI Rendering**  
Response → Messages + Quick Replies → React components → User sees bot response

### Key Technical Decisions

- **No LLM/API** — All intelligence is rule-based for zero setup friction
- **Message Pipeline** — Universal processing order ensures context never lost
- **Context Persistence** — Conversation state survives across turns
- **Weighted Scoring** — Handles varied phrasings (not just exact keyword match)
- **Finite State Machine** — Predictable conversation flow with clear transitions
- **Post-Resolution Rules** — Each flow defines what happens after completion
- **Typing Simulation** — 800–1200ms delay makes the bot feel alive
- **Consecutive Fallback Detection** — Proactively escalates after 2 failures (not in spec, but good UX)

### Context Preservation Examples

Unlike traditional chatbots that reset after each flow, this bot maintains context:

✅ **Order Correction:** After checking order 111, typing "sorry its 333" immediately looks up 333  
✅ **Follow-up Questions:** After returns policy, "what about packaging" gets context-aware answer  
✅ **Pleasantry Absorption:** "thanks" or "ok" mid-flow are acknowledged without reset  
✅ **Flow Switching:** After order tracking, "what about returns" seamlessly switches flows  
✅ **Handoff Recovery:** During agent handoff, "never mind" returns to main menu cleanly
- **Post-Resolution Rules** — Each flow defines what happens after completion
- **Typing Simulation** — 800–1200ms delay makes the bot feel alive
- **Consecutive Fallback Detection** — Proactively escalates after 2 failures (not in spec, but good UX)

---

## Mock Data Reference

### Order Statuses

| Order Number | Status | Response |
|---|---|---|
| #111 | Shipped | Arriving tomorrow |
| #222 | Processing | Ships within 24 hours |
| #333 | Delivered | Already delivered (asks follow-up) |
| Any other | Invalid | Not found message |

### Return Policy

- **Window:** 30 days from purchase date  
- **Condition:** Items must be unused  
- **Packaging:** Original packaging required  
- **Link:** northstaroutdoors.com/returns (simulated)

### Shipping Times

- Standard Shipping: 3–5 business days  
- Expedited Shipping: 1–2 business days

---

## Intent Recognition Examples

The bot recognizes natural language variations for each use case:

**Order Tracking:**
- "where is my order"
- "track my package"
- "what's the status of order 111"
- "when will my shipment arrive"

**Returns:**
- "I want to return something"
- "what's your return policy"
- "can I get a refund"
- "how do I send this back"

**Recommendations:**
- "recommend me a jacket"
- "what should I buy for hiking"
- "I need gear for camping"
- "suggest something for winter"

**Human Handoff:**
- "talk to an agent"
- "connect me to a person"
- "I need to speak with someone"
- "can I talk to a human"

---

## Technical Details

**Built With:**
- React 18.2.0
- Pure JavaScript (no TypeScript)
- CSS3 with animations
- No external chat libraries or frameworks

**Browser Compatibility:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Performance:**
- Instant response rendering
- Smooth animations
- No network latency (all logic client-side)

---

## Code Quality Notes

- **Modular Architecture** — Separated concerns: engine, data, UI
- **Commented Code** — All key functions have JSDoc comments
- **Consistent Naming** — Semantic variable and function names
- **Reusable Components** — Message, QuickReplies, TypingIndicator
- **State Management** — Centralized conversation state in ChatWindow
- **Error Handling** — Graceful fallbacks for unrecognized input

---

## Future Enhancements (Out of Scope)

- Real backend integration with order API
- Persistent chat history across sessions
- Multi-language support
- Voice input/output
- Real-time live agent connection
- Analytics and conversation logging

---

## License

This project is built as part of the Upwork Talent Accelerator Program assessment.

---

## Contact

For questions or feedback, contact via Upwork messaging.

**Built with 🏔️ by Amritesh Indal**
