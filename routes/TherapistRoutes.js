const login_Therapist = require('../controller/therapistController/therapistlogin.js');
const  getTherapists  = require('../controller/therapistController/getTherapists.js');

const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /auth/therapist/login:
 *   post:
 *     summary: Therapist login
 *     tags: [TherapistAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: manashvisahani@gmail.com
 *               password:
 *                 type: string
 *                 example: 12345678
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid credentials
 *       404:
 *         description: Therapist not found or not authorized
 *       500:
 *         description: Server error
 */


/**
 * @swagger
 * /auth/therapist/filter:
 *   post:
 *     summary: Filter available therapists by service, date, and time
 *     tags: [Therapist]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               service:
 *                 type: object
 *                 properties:
 *                   serviceId:
 *                     type: string
 *                     example: 64e1a2b3c4d5e6f7a8b9c0d1
 *                   optionIndex:
 *                     type: integer
 *                     example: 0
 *               date:
 *                 type: string
 *                 example: 2025-08-22
 *               time:
 *                 type: string
 *                 example: 10:00
 *     responses:
 *       200:
 *         description: List of available therapists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 therapists:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid request body or option index
 *       404:
 *         description: Service not found
 *       500:
 *         description: Internal Server Error
 */
router.post('/login',login_Therapist);
router.post("/filter",getTherapists);
router.post('/addAvailability',require('../controller/therapistController/addAvailabilty'));
router.post('/addTherapist',require('../controller/therapistController/Addtherapist'));
router.delete('/deleteTherapist',require('../controller/therapistController/deletetherapist'));
router.get('/getAllTherapists',require('../controller/therapistController/getAllTherapists'));
// router.get('/gettherapist/:id',require('../controller/therapistController/getTherapistById'));
module.exports = router;
