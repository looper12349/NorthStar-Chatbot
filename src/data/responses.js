/**
 * Bot Response Templates
 * All conversational responses organized by flow
 */

export const responses = {
  greeting: [
    "Hey there! Welcome to North Star Outdoors support.",
    "Hi! I'm here to help you with your outdoor gear needs.",
    "Hello! Ready to help you get back on the trail."
  ],
  
  mainMenu: "How can I help you today?",
  
  orderTracking: {
    prompt: "I can help with that! What's your order number? (Example: #111 or just 111)",
    invalidFormat: "Hmm, I need a valid order number to look that up. It should be a 3-digit number like #111. Can you try again?",
    notFound: (orderNum) => `Hmm, I couldn't find order #${orderNum} in our system. Please double-check your confirmation email. Would you like to try again or talk to a live agent?`,
    followUpDelivered: "Is there anything else I can help you with? Did you receive everything okay?"
  },
  
  returns: {
    policy: `Happy to help with a return or exchange! Here's our policy:

• 30-day return window from purchase date
• Items must be unused
• Original packaging required

Start your return at northstaroutdoors.com/returns`,
    followUp: "Do you have any other questions about returns?"
  },
  
  recommendations: {
    intro: "I'd love to help you find the right gear! First — what activity are you shopping for?",
    specificNeed: "Great choice! What's your main priority?",
    followUp: "Would you like another recommendation or speak with a gear expert?"
  },
  
  handoff: {
    connecting: `No problem — connecting you with a live agent now.

You're connected to the North Star support team. Average wait time is about 2 minutes.

A team member will be with you shortly!`,
    inSession: "You're currently connected with a live agent. They'll respond soon!",
    ended: "Thanks for chatting! Returning you to the main menu."
  },
  
  fallback: {
    first: "I didn't quite catch that — sorry about that! Here's what I can help you with:",
    second: "I'm still having trouble understanding. Let me show you what I can do:",
    escalate: "Seems like I'm having trouble understanding. Would you like me to connect you with a live agent who can help directly?"
  },
  
  thanks: [
    "You're welcome! Happy trails!",
    "Glad I could help! Enjoy the outdoors!",
    "Anytime! Stay adventurous!"
  ],
  
  goodbye: [
    "Safe travels! Feel free to reach out anytime.",
    "Take care out there! See you on the trail!",
    "Happy adventuring! Come back anytime!"
  ]
};
