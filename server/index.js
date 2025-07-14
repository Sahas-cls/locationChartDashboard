const express = require("express");
require("dotenv").config();
const cors = require("cors");
const server = express();

// MIDDLEWARES
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};

server.use(cors(true));
server.use(express.json()); // Add this to parse JSON bodies

// ROUTES
const getDataRoute = require("./routes/GetData");
server.use("/api", getDataRoute);

// Error handling middleware
server.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// RUN THE SERVER
const port = process.env.API_PORT || 4000;
server
  .listen(port, () => {
    console.log(`Server is running on ${port}`);
  })
  .on("error", (error) => {
    console.log(`Error while trying to run server: ${error}`);
  });
