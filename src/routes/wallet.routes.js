const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");
const { setPin, verifyPin } = require("../controllers/pin.controller");
const auth = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet operations (balance, funding, transfers)
 */

/**
 * @swagger
 * /api/wallet/balance:
 *   get:
 *     tags: [Wallet]
 *     summary: Get user wallet balance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/balance", auth, walletController.getWallet);

/**
 * @swagger
 * /api/wallet/fund/manual:
 *   post:
 *     tags: [Wallet]
 *     summary: Fund the wallet manually (development mode)
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
 *         description: Wallet funded successfully (manual)
 *       400:
 *         description: Invalid amount
 *       401:
 *         description: Unauthorized
 */
router.post("/fund/manual", auth, walletController.fundWalletManual);

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
 *       400:
 *         description: Invalid amount
 *       401:
 *         description: Unauthorized
 */
router.post("/fund/paystack", auth, walletController.fundWalletPaystack);

/**
 * @swagger
 * /api/wallet/verify/{reference}:
 *   get:
 *     tags: [Wallet]
 *     summary: Verify Paystack payment (optional, for frontend)
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Paystack transaction reference
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet funded successfully
 *       400:
 *         description: Payment not successful
 *       401:
 *         description: Unauthorized
 */
router.get("/verify/:reference", auth, walletController.verifyFunding);

/**
 * @swagger
 * /api/wallet/webhook/paystack:
 *   post:
 *     tags: [Wallet]
 *     summary: Paystack webhook for automatic wallet funding
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received and processed
 */
router.post(
  "/webhook/paystack",
  express.raw({ type: "*/*" }),
  walletController.paystackWebhook
);

/**
 * @swagger
 * /api/wallet/set-pin:
 *   post:
 *     tags: [Wallet]
 *     summary: Set or update the user's 4-digit wallet PIN
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pin
 *             properties:
 *               pin:
 *                 type: string
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: PIN created or updated successfully
 *       400:
 *         description: Invalid PIN format
 *       401:
 *         description: Unauthorized
 */
router.post("/set-pin", auth, setPin);

/**
 * @swagger
 * /api/wallet/verify-pin:
 *   post:
 *     tags: [Wallet]
 *     summary: Verify the user's wallet PIN before sensitive actions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pin
 *             properties:
 *               pin:
 *                 type: string
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: PIN verified successfully
 *       400:
 *         description: Incorrect PIN or invalid input
 *       401:
 *         description: Unauthorized
 */
router.post("/verify-pin", auth, verifyPin);

/**
 * @swagger
 * /api/wallet/transfer:
 *   post:
 *     tags: [Wallet]
 *     summary: Transfer funds to another user (requires 4-digit PIN)
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
 *               - email
 *               - pin
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 3000
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               pin:
 *                 type: string
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: Transfer successful
 *       400:
 *         description: Invalid input data or incorrect PIN
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recipient not found
 */
router.post("/transfer", auth, walletController.transfer);

/**
 * @swagger
 * /api/wallet/transactions:
 *   get:
 *     tags: [Wallet]
 *     summary: Get paginated & filtered transaction history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [credit, debit]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Transaction list retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/transactions", auth, walletController.getTransactions);

/**
 * @swagger
 * /api/wallet/transactions/{id}:
 *   get:
 *     tags: [Wallet]
 *     summary: Get a single transaction by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Transaction not found
 */
router.get("/transactions/:id", auth, walletController.getTransactionById);


module.exports = router;





