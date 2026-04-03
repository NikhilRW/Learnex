type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const shouldLog = (level: LogLevel) => {
  if (level === 'error') {
    return true;
  }
  return __DEV__;
};

const formatTag = (tag?: string) => (tag ? `[${tag}]` : '');

export const logger = {
  debug: (message: string, meta?: unknown, tag?: string) => {
    if (shouldLog('debug')) {
      console.log(formatTag(tag), message, meta ?? '');
    }
  },
  info: (message: string, meta?: unknown, tag?: string) => {
    if (shouldLog('info')) {
      console.log(formatTag(tag), message, meta ?? '');
    }
  },
  warn: (message: string, meta?: unknown, tag?: string) => {
    if (shouldLog('warn')) {
      console.warn(formatTag(tag), message, meta ?? '');
    }
  },
  error: (message: string, meta?: unknown, tag?: string) => {
    console.error(formatTag(tag), message, meta ?? '');
  },
};
