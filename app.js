// Start Packeges
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const xss = require("xss-clean");
const rateLimiting = require("express-rate-limit");
const helmet = require("helmet");
const hpp = require("hpp");
// End Packeges

// Start Main Varibles
const connectToDB = require("./config/connectToDB");
const { errorHandler, notFound } = require("./middlewares/error");
const PORT = process.env.PORT || 8000;
// End Main Varibles

// Connect DataBase
connectToDB();

// Init App
const app = express();

// Middelwares
app.use(express.json());

// Security Headers (helmet)
app.use(helmet());

// Prevent HTTP Param Pollution
app.use(hpp());

// Prevent XSS (Cross Site Scripting) Attacks
app.use(xss());

// Rate Limiting
app.use(
  rateLimiting({
    windowMs: 10 * 60 * 1000, // 10 Minutes
    max: 200,
  })
);


// Cors Policy
// app.use(
//   cors({
//     origin: "https://devister.vercel.app",
//   })
// );


// Routes
app.use("/api/auth", require("./routes/authRoute"));
app.use("/api/users", require("./routes/userRoute"));
app.use("/api/posts", require("./routes/postRoute"));
app.use("/api/comments", require("./routes/commentRoute"));
app.use("/api/categories", require("./routes/categoryRoute"));
app.use("/api/password", require("./routes/passwordRoute"));

// Error Handler Middleware
app.use(notFound);
app.use(errorHandler);

// Run Surver
app.listen(PORT, () =>
  console.log(
    `Server Is Running In ${process.env.NODE_ENV} Mode On Port ${PORT}`
  )
);
