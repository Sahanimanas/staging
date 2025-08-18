const express = require('express');
const cors = require('cors');
const app = express();
const os = require('os');
const PORT = process.env.PORT || 3000;
const userroutes = require('./routes/userroutes')
const Adminroutes = require('./routes/Adminroutes');
const TherapistRoutes = require('./routes/TherapistRoutes');

const servicesRoutes = require('./routes/servicesRoute');
const connectDB = require('./db/db.js');

require('dotenv').config();
connectDB();
const host = os.networkInterfaces();
const ip = host['Wi-Fi'][1].address;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: '*' }));

app.get('/', (req, res) => {
  res.send('Hello from Express server!');
});

app.use('/auth/user', userroutes);
app.use('/auth/admin', Adminroutes );
app.use('/auth/therapist',TherapistRoutes);

app.use('/services', servicesRoutes);
app.post('/verify-email',require('./controller/verifyotp.js'));


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on IP address http://${ip}:${PORT}`);
});

