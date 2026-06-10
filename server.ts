/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

let stripeClient: Stripe | null = null;

function getStripe(): Stripe | null {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key) {
      stripeClient = new Stripe(key, {
        apiVersion: "2025-01-27-preview" as any,
      });
    }
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Check if Stripe is configured
  app.get("/api/stripe-config", (req, res) => {
    res.json({
      configured: !!process.env.STRIPE_SECRET_KEY,
    });
  });

  // API Route: Create checkout session
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { items, customerEmail, customerName, spreadsheetId, accessToken } = req.body;

      if (!items || !items.length) {
        return res.status(400).json({ error: "No items provided in cart" });
      }

      const stripe = getStripe();
      const appUrl = process.env.APP_URL || "http://localhost:3000";

      // Calculate total amount for reporting/analytics in sandbox
      const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

      if (stripe) {
        // Build real Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          customer_email: customerEmail,
          line_items: items.map((item: any) => ({
            price_data: {
              currency: "usd",
              product_data: {
                name: `${item.brand} ${item.name}`,
                description: `${item.cpu} | ${item.ram} | ${item.storage}`,
              },
              unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
          })),
          mode: "payment",
          success_url: `${appUrl}/checkout-success?sessionId={CHECKOUT_SESSION_ID}&spreadsheetId=${spreadsheetId}&accessToken=${encodeURIComponent(accessToken)}&customerName=${encodeURIComponent(customerName)}&customerEmail=${encodeURIComponent(customerEmail)}&items=${encodeURIComponent(JSON.stringify(items))}`,
          cancel_url: `${appUrl}/?checkout_status=cancelled`,
        });

        return res.json({ id: session.id, url: session.url });
      } else {
        // Secure sandbox/demo fallback url
        const sandboxUrl = `${appUrl}/sandbox-payment?spreadsheetId=${spreadsheetId}&accessToken=${encodeURIComponent(accessToken)}&customerName=${encodeURIComponent(customerName)}&customerEmail=${encodeURIComponent(customerEmail)}&totalAmount=${totalAmount}&items=${encodeURIComponent(JSON.stringify(items))}`;
        return res.json({ id: "sandbox_session_id", url: sandboxUrl, isSandbox: true });
      }
    } catch (error: any) {
      console.error("Create checkout session error:", error);
      res.status(500).json({ error: error.message || "Failed to create checkout transaction" });
    }
  });

  // Vite middleware for development or fallback static delivery for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
