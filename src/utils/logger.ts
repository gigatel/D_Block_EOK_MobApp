/* eslint-disable no-console */
type LogArgs = unknown[];

/**
 * Thin logging wrapper. Debug/info output is stripped in production builds;
 * warnings and errors are kept so they can be forwarded to a crash reporter.
 */
export const logger = {
  debug: (...args: LogArgs) => {
    if (__DEV__) {
      console.log('[debug]', ...args);
    }
  },
  info: (...args: LogArgs) => {
    if (__DEV__) {
      console.info('[info]', ...args);
    }
  },
  warn: (...args: LogArgs) => console.warn('[warn]', ...args),
  error: (...args: LogArgs) => console.error('[error]', ...args),
};
