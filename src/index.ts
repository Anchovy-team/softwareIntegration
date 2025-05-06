import startApp from './boot/setup';
import { config } from 'dotenv';
import { logger } from './middleware/winston';
config();

((): void => {
  try {
    startApp();
  } catch (error) {
    logger.error('Error in index.js => startApp');
    logger.error(`Error; ${JSON.stringify(error, undefined, 2)}`);
  }
})();
