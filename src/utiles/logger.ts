import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";
const logDir = path.join(process.cwd(), "logs");

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

// Human-readable format for development
const devFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaString = Object.keys(meta).length
      ? `\n${JSON.stringify(meta, null, 2)}`
      : "";
    return `${timestamp} ${level}: ${stack || message}${metaString}`;
  })
);

// Structured JSON format for production (easy to ship to Datadog, ELK, CloudWatch, etc.)
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const transports: winston.transport[] = [new winston.transports.Console()];

// Only write files in production
if (isProduction) {
  transports.push(
    new DailyRotateFile({
      dirname: logDir,
      filename: "app-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      zippedArchive: true,
      level: "info",
    }),
    new DailyRotateFile({
      dirname: logDir,
      filename: "error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "30d",
      zippedArchive: true,
      level: "error",
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  format: isProduction ? prodFormat : devFormat,
  defaultMeta: { service: "todo-api" },
  transports,
  exitOnError: false,
});

export default logger;