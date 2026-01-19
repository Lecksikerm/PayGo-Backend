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
 *         description: Unauthorized - token missing or invalid
 */
router.get("/balance", auth, walletController.getWallet);

/**
 * @swagger
 * /api/wallet/fund:
 *   post:
 *     tags: [Wallet]
 *     summary: Fund the user's wallet (requires 4-digit PIN)
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
 *               - pin
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000
 *               pin:
 *                 type: string
 *                 example: "1234"
 *                 description: 4-digit transaction PIN
 *     responses:
 *       200:
 *         description: Wallet funded successfully
 *       400:
 *         description: Invalid request data or incorrect PIN
 *       401:
 *         description: Unauthorized
 */
router.post("/fund", auth, walletController.fundWallet);

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
 *                 description: 4-digit transaction PIN
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




