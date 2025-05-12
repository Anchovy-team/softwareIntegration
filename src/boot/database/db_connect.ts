import { Pool, types } from 'pg';
import { logger } from '../../middleware/winston';
import { config } from 'dotenv';
config();

const db_config = {
  user: process.env.DB_USER as string,
  host: process.env.DB_HOST as string,
  database: process.env.DB_NAME as string,
  password: process.env.DB_PASSWORD as string,
  port: 5432,
  max: 10,
};

let db_connection: Pool;

function startConnection(): void {
  // type parsers here
  types.setTypeParser(1082, (stringValue: string) => {
    return stringValue; // 1082 is for date type
  });

  db_connection = new Pool(db_config);

  db_connection.connect((err: Error | null) => {
    if (!err) {
      logger.info('PostgreSQL Connected');
    } else {
      logger.error('PostgreSQL Connection Failed', err);
    }
  });

  db_connection.on('error', (err: Error) => {
    logger.error('Unexpected error on idle client', err);
    startConnection();
  });
}

startConnection();

export default db_connection as Pool;
