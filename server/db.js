// db.js
const sql = require("mssql");

const config = {
  user: "mi2",
  password: "_scon12",
  server: "124.43.16.11",
  database: "INVENTRY",
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  requestTimeout: 100000, //
  connectionTimeout: 100000, //
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("Connected to MSSQL");
    return pool;
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    throw err;
  });

module.exports = { sql, poolPromise };
