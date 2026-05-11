import logger from './logger.js';

interface LimitStore {
  [jid: string]: {
    count: number;
    resetTime: number;
  }
}

const store: LimitStore = {};
const MAX_REQUESTS_PER_MINUTE = 15;

export function checkRateLimit(jid: string): boolean {
  const now = Date.now();
  const userLimit = store[jid];

  if (!userLimit || now > userLimit.resetTime) {
    // Initialize or Reset
    store[jid] = {
      count: 1,
      resetTime: now + 60 * 1000 // 1 minute from now
    };
    return true;
  }

  if (userLimit.count >= MAX_REQUESTS_PER_MINUTE) {
    logger.warn({ jid }, 'Rate limit exceeded');
    return false;
  }

  userLimit.count++;
  return true;
}
