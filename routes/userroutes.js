const express = require('express');
const router = express.Router();

const registerUser = require('../controller/client/registerUser.js');
const login_User = require('../controller/client/userlogin.js');

/**
 * @swagger
 * /auth/user/register:
 *   post:
 *     summary: Register a new user (client)
 *     tags: [UserAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: mySecretPassword
 *               name:
 *                 type: object
 *                 properties:
 *                   first:
 *                     type: string
 *                     example: John
 *                   last:
 *                     type: string
 *                     example: Doe
 *     responses:
 *       201:
 *         description: Registration successful, OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: " Please verify your email with the OTP sent."
 *       200:
 *         description: Email already in use, OTP sent for verification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email already in use, please verify your account using OTP.
 *       500:
 *         description: Server error
 */
router.post('/register',registerUser);

/**
 * @swagger
 * /auth/user/login:
 *   post:
 *     summary: User login (client)
 *     tags: [UserAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: mySecretPassword
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: login successfull
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid email or password
 *       404:
 *         description: Error login (wrong role)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error login
 *       500:
 *         description: Server error
 */
router.post('/login',login_User);
module.exports = router;
