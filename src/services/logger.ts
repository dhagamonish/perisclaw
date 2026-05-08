import pino from 'pino';
import { broadcastLog } from './dashboard.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:standard',
    },
  },
  hooks: {
    logMethod(inputArgs, method) {
      const msg = typeof inputArgs[0] === 'string' ? inputArgs[0] : inputArgs[1];
      const details = typeof inputArgs[0] === 'object' ? inputArgs[0] : undefined;
      const level = method.name.toUpperCase();
      
      broadcastLog(level, msg, details);
      return method.apply(this, inputArgs as [any, ...any[]]);
    }
  }
});

export default logger;
