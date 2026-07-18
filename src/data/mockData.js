/**
 * Mock Data for North Star Support Bot
 * Contains order statuses, return policy, and shipping information
 * as specified in the PRD - DO NOT MODIFY without updating spec
 */

export const orderData = {
  '111': {
    status: 'Shipped',
    message: 'Order #111 is on its way! 📦 It\'s been shipped and is arriving tomorrow.',
    deliveryEstimate: 'Tomorrow'
  },
  '222': {
    status: 'Processing',
    message: 'Order #222 is currently being processed and will ship within 24 hours. 📋',
    deliveryEstimate: 'Ships within 24 hours'
  },
  '333': {
    status: 'Delivered',
    message: 'Great news — Order #333 has been delivered! 🎉',
    deliveryEstimate: 'Already delivered'
  }
};

export const returnPolicy = {
  window: '30 days from date of purchase',
  condition: 'Items must be unused',
  packaging: 'Original packaging required',
  link: 'https://northstaroutdoors.com/returns'
};

export const shippingInfo = {
  standard: '3–5 business days',
  expedited: '1–2 business days'
};
