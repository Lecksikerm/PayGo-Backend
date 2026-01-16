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
 *         description: Unauthorized - token missing or invalid
 */
router.get("/balance", auth, walletController.getWallet);

/**
 * @swagger
 * /api/wallet/fund:
 *   post:
 *     tags: [Wallet]
 *     summary: Fund the user's wallet
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
 *         description: Wallet funded successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post("/fund", auth, walletController.fundWallet);

/**
 * @swagger
 * /api/wallet/transfer:
 *   post:
 *     tags: [Wallet]
 *     summary: Transfer funds to another user
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
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 3000
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Transfer successful
 *       400:
 *         description: Invalid input data
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
 *     summary: Get user's transaction history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user transactions
 *       401:
 *         description: Unauthorized
 */
router.get("/transactions", auth, walletController.getTransactions);


module.exports = router;



