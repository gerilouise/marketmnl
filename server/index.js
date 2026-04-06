// server/index.js
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_API_URL = "https://api.paymongo.com/v1";

const paymongoApi = axios.create({
  baseURL: PAYMONGO_API_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ":").toString("base64")}`,
  },
});

const toCents = (amount) => Math.round(amount * 100);

app.post("/api/create-checkout-session", async (req, res) => {
  console.log("📦 Received checkout request");

  try {
    const {
      amount,
      currency = "PHP",
      description,
      paymentMethodTypes,
      successUrl,
      failedUrl,
      metadata,
      items,
    } = req.body;

    const lineItems = items.map((item) => ({
      currency: currency,
      amount: toCents(item.price),
      description: item.name,
      name: item.name,
      quantity: item.quantity,
    }));

    console.log("💰 Creating PayMongo session for amount:", amount);

    const response = await paymongoApi.post("/checkout_sessions", {
      data: {
        attributes: {
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          payment_method_types: paymentMethodTypes || ["card", "gcash", "maya"],
          line_items: lineItems,
          success_url: successUrl,
          failed_url: failedUrl,
          metadata: metadata || {},
        },
      },
    });

    console.log("✅ PayMongo session created");

    res.json({
      success: true,
      checkoutSession: response.data.data,
    });
  } catch (error) {
    console.error("❌ PayMongo error:", error.response?.data || error.message);
    res.status(400).json({
      success: false,
      error:
        error.response?.data?.errors?.[0]?.detail ||
        "Failed to create checkout session",
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 PayMongo server running on port ${PORT}`);
  console.log(`📍 Access from phone: http://192.168.1.4:${PORT}`);
});
