const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type LogLevel = keyof typeof LEVELS;

const currentLevel: LogLevel = (() => {
  const env = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
  return env in LEVELS ? (env as LogLevel) : 'info';
})();

const pad = (n: number) => String(n).padStart(2, '0');

const timestamp = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const LABEL: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info:  'INFO ',
  warn:  'WARN ',
  error: 'ERROR',
};

export interface Logger {
  debug(msg: string, ...args: unknown[]): void;
  info(msg: string, ...args: unknown[]): void;
  warn(msg: string, ...args: unknown[]): void;
  error(msg: string, ...args: unknown[]): void;
}

export function createLogger(module: string): Logger {
  const prefix = (level: LogLevel) => `[${timestamp()}] ${LABEL[level]} [${module}]`;

  const write = (level: LogLevel, msg: string, args: unknown[]) => {
    if (LEVELS[level] < LEVELS[currentLevel]) return;
    const out = level === 'error' ? console.error
              : level === 'warn'  ? console.warn
              : console.log;
    out(`${prefix(level)} ${msg}`, ...args);
  };

  return {
    debug: (msg, ...args) => write('debug', msg, args),
    info:  (msg, ...args) => write('info',  msg, args),
    warn:  (msg, ...args) => write('warn',  msg, args),
    error: (msg, ...args) => write('error', msg, args),
  };
}
