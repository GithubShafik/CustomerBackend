const http = require('http');
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const config = require('./src/config/env');
const { initSocket } = require('./src/utils/socket');

const PORT = config.port;
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});