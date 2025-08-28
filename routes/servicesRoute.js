const express = require('express');
const router = express.Router();

const getAllServices = require('../controller/services/massageServices.js');
const authMiddleware = require('../models/middlewares/authtoken.js');

/**
 * @swagger
 * /services/list:
 *   get:
 *     summary: Get all available services
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all services
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Server error
 */
router.get('/list', authMiddleware, getAllServices);


module.exports = router;
