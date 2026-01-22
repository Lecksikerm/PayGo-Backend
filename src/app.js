const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
require("dotenv").config();

// Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");

const authRoutes = require("./routes/auth.routes");
const walletRoutes = require("./routes/wallet.routes");
const profileRoutes = require("./routes/profile.routes");
const adminRoutes = require("./routes/admin.routes");

const walletController = require("./controllers/wallet.controller");

const app = express();

app.use(cors());
app.use(morgan("dev"));


app.post(
  "/api/wallet/webhook/paystack",
  express.raw({ type: "*/*" }),
  walletController.paystackWebhook
);

// Express JSON parser for all other routes
app.use(express.json());

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("PayGo Backend Running...");
});

module.exports = app;



