
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require("body-parser");
require('dotenv').config();
const PORT = process.env.PORT || 3000;

const connectDB = require('./db/db.js');
connectDB();

const userroutes = require('./routes/userroutes')
const Adminroutes = require('./routes/Adminroutes');
const Bookingroute = require('./routes/BookingRoute.js');
const therapistRoutes = require('./routes/TherapistRoutes.js')
const login_User = require('./controller/admin/adminlogin');


const User = require('./models/userSchema.js');
const servicesroute = require('./routes/servicesRoute.js');
const otproutes = require('./routes/otproutes.js');
const tokenHandler = require('./controller/tokenHandler.js');
const jwt = require('jsonwebtoken')
const login_Therapist = require('./controller/therapistController/AUTH/therapistlogin.js'); 
const { googleAuthCallback } = require('./routes/google.js');
const fileupload = require('express-fileupload');
app.post('/webhook',  express.raw({ type: 'application/json' }), require('./routes/webhook'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: '*' }));
app.use(fileupload({
  useTempFiles: true,
}));

app.get('/', (req, res) => {
  res.send(`Hello from server`);
});

app.use('/auth', require('./routes/google.js'));

app.use(express.json());
app.use('/auth/user', userroutes);
app.use('/admin', Adminroutes);
app.use('/verifyotp', otproutes);
app.post('/auth/admin/login', login_User);
app.use('/auth/therapist/login', login_Therapist);
app.use('/therapist', therapistRoutes);
app.use('/services', servicesroute);
app.get('/auth/verifytoken', tokenHandler);
app.post('/payment/create-checkout-session', require("./controller/booking/create_booking.js"));
app.use('/bookings', Bookingroute);
app.use('/auth',require('./routes/forgotpasswordRoute/forgotpass.js'))

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
