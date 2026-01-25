const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");
const auth = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet operations (balance, funding, transfers)
 */

router.get("/balance", auth, walletController.getWallet);

/**
 * @swagger
 * /api/wallet/fund/paystack:
 *   post:
 *     tags: [Wallet]
 *     summary: Initialize Paystack wallet funding
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000
 *     responses:
 *       200:
 *         description: Paystack payment initialized
 */
router.post("/fund/paystack", auth, walletController.fundWalletPaystack);

/**
 * @swagger
 * /api/wallet/verify/{reference}:
 *   get:
 *     tags: [Wallet]
 *     summary: Verify Paystack payment
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet funded successfully
 */
router.get("/verify/:reference", auth, walletController.verifyFunding);

/**
 * @swagger
 * /api/wallet/webhook/paystack:
 *   post:
 *     tags: [Wallet]
 *     summary: Paystack webhook for automatic wallet funding
 */
router.post(
  "/webhook/paystack",
  express.raw({ type: "application/json" }),
  walletController.paystackWebhook
);

router.post("/transfer", auth, walletController.transfer);
router.get("/transactions", auth, walletController.getTransactions);
router.get("/transactions/:id", auth, walletController.getTransactionById);

module.exports = router;