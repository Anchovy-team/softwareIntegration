// const appRoot = require("app-root-path");
import winston from 'winston';
import { StreamOptions } from 'morgan';

// Define the custom settings for each transport
const options = {
  file: {
    level: 'info',
    filename: './logs/app.log',
    handleException: true,
    maxSize: 5242880, // about 5MB
    maxFiles: 5,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
  },
  console: {
    level: 'debug',
    handleException: true,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  },
};

// instantiate a new Winston Logger with the options defined above
const logger = winston.createLogger({
  transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console),
  ],
  exitOnError: false,
});

// Create a stream object with a 'write' function that `morgan` can use
const stream: StreamOptions = {
  write: (message: string): void => {
    // here we're using the 'info' log level so the output will
    // be picked by both transports (file and console)
    logger.info(message.trim());
  },
};

export { logger, stream };
