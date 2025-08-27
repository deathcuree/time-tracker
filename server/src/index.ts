import 'dotenv/config';
import serverless from 'serverless-http';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { PORT } from './config/env.js';
import { logger } from './shared/utils/logger.js';

const app = createApp();

const binary = [
  'application/octet-stream',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const handler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectDB();
  const serverlessHandler = serverless(app, { binary });
  return serverlessHandler(event, context);
};

if (process.env.AWS_LAMBDA_FUNCTION_NAME === undefined) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      logger.info(`Server running locally on port ${PORT}`);
    });
  });
}
