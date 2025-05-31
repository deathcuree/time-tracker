const awsServerlessExpress = require('aws-serverless-express');
const app = require('./dist/app').default; // or adjust based on your output

const server = awsServerlessExpress.createServer(app);

exports.handler = (event, context) => {
  return awsServerlessExpress.proxy(server, event, context);
};
