const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env")
});

module.exports = {
  port: process.env.PORT || 5000,
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  },
  jwtSecret: process.env.JWT_SECRET || "paddel-drop-secret-key-change-in-production",
};