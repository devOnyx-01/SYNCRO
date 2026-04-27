const express = require("express");
const cors = require("cors");
const stellarSdk = require("stellar-sdk");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "SYNCRO Backend is running" });
});

// Stellar wallet verification endpoint
app.post("/api/wallet/verify", async (req, res) => {
  try {
    const { publicKey, message, signature } = req.body;

    // Validate required fields
    if (!publicKey || !message || !signature) {
      return res.status(400).json({
        verified: false,
        error: "Missing required fields: publicKey, message, and signature are required",
      });
    }

    // Validate Stellar public key format
    if (!stellarSdk.StrKey.isValidEd25519PublicKey(publicKey)) {
      return res.status(400).json({
        verified: false,
        error: "Invalid Stellar public key format",
      });
    }

    // Verify the signature
    try {
      const keypair = stellarSdk.Keypair.fromPublicKey(publicKey);
      const messageBuffer = Buffer.from(message, "utf8");
      const signatureBuffer = Buffer.from(signature, "base64");

      const isValid = keypair.verify(messageBuffer, signatureBuffer);

      if (isValid) {
        // TODO: Store verified wallet in database
        // For now, just return success
        return res.json({
          verified: true,
          publicKey,
          message: "Wallet successfully verified",
        });
      } else {
        return res.status(401).json({
          verified: false,
          error: "Invalid signature - verification failed",
        });
      }
    } catch (verifyError) {
      console.error("Signature verification error:", verifyError);
      return res.status(401).json({
        verified: false,
        error: "Signature verification failed",
      });
    }
  } catch (error) {
    console.error("Wallet verification error:", error);
    return res.status(500).json({
      verified: false,
      error: "Internal server error during verification",
    });
  }
});

// Get verified wallet for user
app.get("/api/wallet/status", (req, res) => {
  // TODO: Implement user authentication and fetch from database
  res.json({
    verified: false,
    publicKey: null,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`SYNCRO Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
