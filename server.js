const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const userroutes = require('./routes/userroutes')
const Adminroutes = require('./routes/Adminroutes');

const therapistRoutes = require('./routes/TherapistRoutes.js')
const connectDB = require('./db/db.js');
const User = require('./models/userSchema.js');

const servicesroute = require('./routes/servicesRoute.js');
const otproutes = require('./routes/otproutes.js');
require('dotenv').config();
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: '*' }));

app.get('/', (req, res) => {
  res.send('Hello from Express server!');
});

app.use('/auth/user', userroutes);
app.use('/auth/admin', Adminroutes );
app.use('/verifyotp', otproutes);

app.use('/auth/therapist', therapistRoutes);
app.use('/services', servicesroute);

// app.use('/bookings', require('./routes/BookingRoute'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

