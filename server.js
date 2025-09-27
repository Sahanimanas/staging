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
dotenv.config({ path: '/etc/secrets/stripe.env' });
dotenv.config({ path: './.env' });

const PORT = process.env.PORT && !isNaN(process.env.PORT) ? parseInt(process.env.PORT, 10) : 3000;

const app = express();
const connectDB = require('./db/db.js');
connectDB();

// JSON middleware, except for /webhook
app.use((req, res, next) => {
  if (req.originalUrl === "/api/webhook") {
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
app.get('/api/health', (req, res) => {
  res.json({
    status: "ok",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    stripe: process.env.STRIPE_SECRET_KEY ? "loaded" : "missing",
    port: PORT
  });
});
// require('./bgwork/deleteBooking.js')
require('./bgwork/ServiceLocation')
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
const verifyAdmin = require('./models/middlewares/verifyadmin.js');
const authmiddleware = require('./models/middlewares/authtoken')
app.post('/api/webhook', express.raw({ type: 'application/json' }), require('./routes/webhook'));
app.get('/api/'  , (req, res) => res.send("Hello from server"));
app.use('/api/auth', require('./routes/google.js'));
app.use('/api/auth/user', userAuth);
app.use('/api/user', require('./routes/userRoutes.js'));  
app.use('/api/admin', Adminroutes);
app.use('/api/verifyotp', require('./routes/otproutes.js'));
app.post('/api/auth/admin/login', login_User);
app.use('/api/auth/therapist/login', login_Therapist);
app.use('/api/therapist', therapistRoutes);
app.use('/api/services', require('./routes/servicesRoute.js'));
app.get('/api/auth/verifytoken', tokenHandler);


app.post('/api/payment/create-checkout-session', require("./controller/booking/create_booking.js"));
app.post('/api/payment/cashbooking', require("./controller/booking/bycashbooking"))

app.use('/api/bookings', Bookingroute);
app.use('/api/auth', require('./routes/forgotpasswordRoute/forgotpass.js'));
app.use('/api/otp',authmiddleware, require('./routes/OTProute'))
app.use('/api/payout',require('./routes/payoutRoute'))

app.get('/api/outcodes', require('./services/getoutcodes')) //testing 4
app.get('/api/blog', require('./controller/blog/blog').getBlogs)
app.get('/api/blog/:id',require('./controller/blog/blog').BlogID)
// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on port ${PORT}`);
});