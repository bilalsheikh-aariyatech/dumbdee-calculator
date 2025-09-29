/**
 * Enhanced Logger for Next.js with TypeScript
 * Provides colored logging with file path detection and environment context
 */

// Types and interfaces
type LogLevel = "log" | "info" | "warn" | "error";
type Environment = "[SERVER]" | "[CLIENT]";
type ColorName = "green" | "yellow" | "red" | "blue" | "reset" | "dim";

interface AnsiColors {
    green: string;
    yellow: string;
    red: string;
    blue: string;
    reset: string;
    dim: string;
}

interface CssStyles {
    green: string;
    yellow: string;
    red: string;
    blue: string;
    dim: string;
}

interface CallerInfo {
    filePath: string;
    line: string;
    column: string;
}

interface LoggerConfig {
    showTimestamp?: boolean;
    showEnvironment?: boolean;
    showCaller?: boolean;
    maxPathSegments?: number;
}

class NextLogger {
    private readonly isServer: boolean;
    private readonly config: Required<LoggerConfig>;

    constructor(config: LoggerConfig = {}) {
        this.isServer = typeof window === "undefined";
        this.config = {
            showTimestamp: true,
            showEnvironment: true,
            showCaller: true,
            maxPathSegments: 3,
            ...config,
        };
    }

    /**
     * Get the calling file path and function name
     */
    private getCallerInfo(): string {
        if (!this.config.showCaller) return "";

        try {
            const error = new Error();
            const stack = error.stack?.split("\n");

            if (!stack) return "unknown";

            // Look for the first stack frame that's not from this logger file
            let callerLine = "";
            for (let i = 1; i < stack.length; i++) {
                const line = stack[i];
                if (
                    line &&
                    !line.includes("logger.") &&
                    !line.includes("Logger.") &&
                    !line.includes("node_modules") &&
                    !line.includes("node:internal")
                ) {
                    callerLine = line;
                    break;
                }
            }

            if (!callerLine) return "unknown";

            // Only use Webpack/bundled code pattern
            const match = callerLine.match(/\(?([^)]+\.(?:js|ts|jsx|tsx)):(\d+):(\d+)\)?/);
            if (match) {
                let [, filePath, line, column] = match;
                if (filePath) {
                    filePath = filePath.replace(/^webpack-internal:\/\//, "");
                    filePath = filePath.replace(/^file:\/\//, "");
                    if (filePath.includes("/")) {
                        const pathParts = filePath.split("/");
                        let startIndex = -1;
                        const nextJsDirs = ["pages", "components", "app", "src", "lib", "utils", "hooks"];
                        for (let i = pathParts.length - 1; i >= 0; i--) {
                            if (nextJsDirs.some((dir) => pathParts[i].startsWith(dir))) {
                                startIndex = i;
                                break;
                            }
                        }
                        if (startIndex !== -1) {
                            filePath = pathParts.slice(startIndex).join("/");
                        } else {
                            const relevantParts = pathParts.slice(-this.config.maxPathSegments);
                            filePath = relevantParts.join("/");
                        }
                    }
                    return `${filePath}:${line}:${column}`;
                }
            }
            return "unknown location";
        } catch (e) {
            return "unknown location";
        }
    }

    /**
     * Get environment context
     */
    private getEnvironment(): Environment {
        return this.isServer ? "[SERVER]" : "[CLIENT]";
    }

    /**
     * Format timestamp
     */
    private getTimestamp(): string {
        if (!this.config.showTimestamp) return "";
        return new Date().toISOString().replace("T", " ").substring(0, 19);
    }

    /**
     * ANSI color codes for terminal output
     */
    private readonly ansiColors: AnsiColors = {
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        red: "\x1b[31m",
        blue: "\x1b[34m",
        reset: "\x1b[0m",
        dim: "\x1b[2m",
    };

    /**
     * CSS styles for browser console
     */
    private readonly cssStyles: CssStyles = {
        green: "color: #22c55e; font-weight: bold;",
        yellow: "color: #eab308; font-weight: bold;",
        red: "color: #ef4444; font-weight: bold;",
        blue: "color: #3b82f6; font-weight: bold;",
        dim: "color: #6b7280; font-weight: normal;",
    };

    /**
     * Create styled console method based on environment
     */
    private getConsoleMethod(level: LogLevel, colorName: ColorName): (...args: any[]) => void {
        if (this.isServer) {
            // Server-side: Use ANSI colors
            return (...args: any[]) => {
                const caller = this.getCallerInfo();
                const env = this.config.showEnvironment ? this.getEnvironment() : "";
                const timestamp = this.getTimestamp();

                const parts: string[] = [];
                if (timestamp) parts.push(`${this.ansiColors.dim}${timestamp}${this.ansiColors.reset}`);
                if (env) parts.push(`${this.ansiColors.blue}${env}${this.ansiColors.reset}`);
                parts.push(`${this.ansiColors[colorName]}[${level.toUpperCase()}]${this.ansiColors.reset}`);
                if (caller) parts.push(`${this.ansiColors.dim}${caller}${this.ansiColors.reset}`);

                const prefix = parts.join(" ");
                console[level](prefix, ...args);
            };
        } else {
            // Client-side: Use CSS styles
            return (...args: any[]) => {
                const caller = this.getCallerInfo();
                const env = this.config.showEnvironment ? this.getEnvironment() : "";
                const timestamp = this.getTimestamp();

                const formatParts: string[] = [];
                const styleParts: string[] = [];

                if (timestamp) {
                    formatParts.push("%c" + timestamp);
                    styleParts.push(this.cssStyles.dim);
                }
                if (env) {
                    formatParts.push("%c" + env);
                    styleParts.push(this.cssStyles.blue);
                }
                formatParts.push(`%c[${level.toUpperCase()}]`);
                // @ts-ignore
                styleParts.push(this.cssStyles[colorName]);
                if (caller) {
                    formatParts.push("%c" + caller);
                    styleParts.push(this.cssStyles.dim);
                }

                const format = formatParts.join(" ");
                console[level](format, ...styleParts, ...args);
            };
        }
    }

    /**
     * Log info message in green
     */
    public log(...args: any[]): void {
        this.getConsoleMethod("log", "green")(...args);
    }

    /**
     * Log info message in green (alias for log)
     */
    public info(...args: any[]): void {
        this.log(...args);
    }

    /**
     * Log warning message in yellow
     */
    public warn(...args: any[]): void {
        this.getConsoleMethod("warn", "yellow")(...args);
    }

    /**
     * Log error message in red
     */
    public error(...args: any[]): void {
        this.getConsoleMethod("error", "red")(...args);
    }

    /**
     * Log with custom formatting for objects
     */
    public logWithData(message: string, data: any, level: LogLevel = "log"): void {
        // Use proper method reference instead of this[level]
        const logMethod =
            level === "warn" ? this.warn.bind(this) : level === "error" ? this.error.bind(this) : this.log.bind(this);

        if (typeof data === "object" && data !== null) {
            logMethod(message, "\n", JSON.stringify(data, null, 2));
        } else {
            logMethod(message, data);
        }
    }

    /**
     * Group logging for related messages
     */
    public group(groupName: string, callback: () => void): void {
        const caller = this.getCallerInfo();
        const env = this.config.showEnvironment ? this.getEnvironment() : "";

        if (this.isServer) {
            console.log(`\n┌─ ${env} ${groupName}${caller ? ` (${caller})` : ""}`);
            callback();
            console.log(`└─ End ${groupName}\n`);
        } else {
            console.group(`${env} ${groupName}${caller ? ` (${caller})` : ""}`);
            callback();
            console.groupEnd();
        }
    }

    /**
     * Async group logging for async operations
     */
    public async groupAsync(groupName: string, callback: () => Promise<void>): Promise<void> {
        const caller = this.getCallerInfo();
        const env = this.config.showEnvironment ? this.getEnvironment() : "";

        if (this.isServer) {
            console.log(`\n┌─ ${env} ${groupName}${caller ? ` (${caller})` : ""}`);
            try {
                await callback();
            } finally {
                console.log(`└─ End ${groupName}\n`);
            }
        } else {
            console.group(`${env} ${groupName}${caller ? ` (${caller})` : ""}`);
            try {
                await callback();
            } finally {
                console.groupEnd();
            }
        }
    }

    /**
     * Time a function execution
     */
    public time<T>(label: string, fn: () => T): T;
    public time<T>(label: string, fn: () => Promise<T>): Promise<T>;
    public time<T>(label: string, fn: () => T | Promise<T>): T | Promise<T> {
        const startTime = performance.now();

        try {
            const result = fn();

            if (result instanceof Promise) {
                return result.finally(() => {
                    const endTime = performance.now();
                    this.log(`⏱️ ${label} completed in ${(endTime - startTime).toFixed(2)}ms`);
                });
            } else {
                const endTime = performance.now();
                this.log(`⏱️ ${label} completed in ${(endTime - startTime).toFixed(2)}ms`);
                return result;
            }
        } catch (error) {
            const endTime = performance.now();
            this.error(`⏱️ ${label} failed after ${(endTime - startTime).toFixed(2)}ms`, error);
            throw error;
        }
    }

    /**
     * Create a scoped logger with a prefix
     */
    public scope(scopeName: string): NextLogger {
        const scopedLogger = new NextLogger(this.config);
        const originalGetCallerInfo = scopedLogger.getCallerInfo.bind(scopedLogger);

        // Override getCallerInfo to include scope
        (scopedLogger as any).getCallerInfo = (): string => {
            const original = originalGetCallerInfo();
            return `[${scopeName}] ${original}`;
        };

        return scopedLogger;
    }

    /**
     * Check if running on server side
     */
    public get isServerSide(): boolean {
        return this.isServer;
    }

    /**
     * Check if running on client side
     */
    public get isClientSide(): boolean {
        return !this.isServer;
    }
}

// Create singleton instance with default config
const logger = new NextLogger();

// Export both the class and instance
export default logger;
export { NextLogger, type LoggerConfig, type LogLevel };

// Usage examples with TypeScript:
/*
// Basic usage
import logger from '@/utils/logger';

// In any component or API route
logger.log('This is an info message');
logger.warn('This is a warning');
logger.error('This is an error');

// With data (properly typed)
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = { id: 1, name: 'John', email: 'john@example.com' };
logger.logWithData('User data:', user);

// Grouped logging
logger.group('API Call', () => {
  logger.log('Starting request');
  logger.warn('Rate limit approaching');
  logger.log('Request completed');
});

// Async grouped logging
await logger.groupAsync('Database Operation', async () => {
  logger.log('Connecting to database');
  await someAsyncOperation();
  logger.log('Operation completed');
});

// Timing functions
const result = logger.time('Database Query', () => {
  return database.query('SELECT * FROM users');
});

// Scoped logging
const apiLogger = logger.scope('API');
apiLogger.log('This will show [API] in the path');

// Custom configuration
const customLogger = new NextLogger({
  showTimestamp: false,
  maxPathSegments: 2
});

// Environment checks
if (logger.isServerSide) {
  logger.log('Running on server');
} else {
  logger.log('Running on client');
}
*/
