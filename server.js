const express = require('express');

const cors = require('cors');
const qs = require("qs");
const fileUpload = require("express-fileupload");

const jwt = require('jsonwebtoken');

const dotenv = require('dotenv');

const mongoose = require('mongoose');


// ===============================

// Load environment variables

// ===============================

// dotenv.config({ path: '/etc/secrets/stripe.env' });
dotenv.config({ path: './.env' });
// Debug env

console.log("STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY ? "Loaded" : "Missing");


// Ensure PORT always defined

const PORT = process.env.PORT && !isNaN(process.env.PORT) ? parseInt(process.env.PORT, 10) : 3000;


// ===============================

// Express setup

// ===============================

const app = express();


const connectDB = require('./db/db.js');

connectDB();


// JSON middleware, except for /webhook

app.use((req, res, next) => {

  if (req.originalUrl === "/webhook") {

    next();

  } else {

    express.json()(req, res, next);

  }

});


app.use(express.urlencoded({ extended: true }));

app.use(cors({ origin: '*' }));


app.use(fileUpload({

  useTempFiles: true,

  tempFileDir: "/tmp/"

}));


// ===============================

// Health endpoint

// ===============================

app.get('/health', (req, res) => {

  res.json({

    status: "ok",

    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",

    stripe: process.env.STRIPE_SECRET_KEY ? "loaded" : "missing",

    port: PORT

  });

});


// ===============================

// Routes

// ===============================

const userAuth = require('./routes/userAuth.js');

const Adminroutes = require('./routes/Adminroutes');

const Bookingroute = require('./routes/BookingRoute.js');

const therapistRoutes = require('./routes/TherapistRoutes.js');

const login_User = require('./controller/admin/adminlogin');

const tokenHandler = require('./controller/tokenHandler.js');

const login_Therapist = require('./controller/therapistController/AUTH/therapistlogin.js');

const { googleAuthCallback } = require('./routes/google.js');


app.post('/webhook', express.raw({ type: 'application/json' }), require('./routes/webhook'));


app.get('/', (req, res) => res.send("Hello from server"));


app.use('/auth', require('./routes/google.js'));

app.use('/auth/user', userAuth);

app.use('/user', require('./routes/userRoutes.js'));

app.use('/admin', Adminroutes);

app.use('/verifyotp', require('./routes/otproutes.js'));

app.post('/auth/admin/login', login_User);

app.use('/auth/therapist/login', login_Therapist);

app.use('/therapist', therapistRoutes);

app.use('/services', require('./routes/servicesRoute.js'));

app.get('/auth/verifytoken', tokenHandler);

app.post('/payment/create-checkout-session', require("./controller/booking/create_booking.js"));

app.use('/bookings', Bookingroute);

app.use('/auth', require('./routes/forgotpasswordRoute/forgotpass.js'));


// ===============================

// Start server

// ===============================

app.listen(PORT, '0.0.0.0', () => {

  console.log(`✅ Server is running on port ${PORT}`);

});

