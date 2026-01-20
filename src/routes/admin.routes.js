const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const isAdmin = require("../middlewares/isAdmin");
const adminController = require("../controllers/admin.controller");

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only user management
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       403:
 *         description: Access denied. Admins only
 */
router.get("/users", auth, isAdmin(adminController.getAllUsers));

/**
 * @swagger
 * /api/admin/users/{id}/suspend:
 *   put:
 *     tags: [Admin]
 *     summary: Suspend a user account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User suspended successfully
 *       403:
 *         description: Access denied. Admins only
 *       404:
 *         description: User not found
 */
router.put("/users/:id/suspend", auth, isAdmin(adminController.suspendUser));

/**
 * @swagger
 * /api/admin/users/{id}/activate:
 *   put:
 *     tags: [Admin]
 *     summary: Activate a suspended user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User activated successfully
 *       403:
 *         description: Access denied. Admins only
 *       404:
 *         description: User not found
 */
router.put("/users/:id/activate", auth, isAdmin(adminController.activateUser));

/**
 * @swagger
 * /api/admin/users/{id}/delete:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a user account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Access denied. Admins only
 *       404:
 *         description: User not found
 */
router.delete("/users/:id/delete", auth, isAdmin(adminController.deleteUser));


module.exports = router;

