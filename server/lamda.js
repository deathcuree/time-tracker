import { createServer, proxy } from 'aws-serverless-express';
import app from './dist/index'; // or adjust based on your output

const server = createServer(app);

export function handler(event, context) {
  return proxy(server, event, context);
}
