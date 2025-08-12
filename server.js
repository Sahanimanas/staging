const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const userroutes = require('./routes/userroutes')
const Adminroutes = require('./routes/Adminroutes');
// const db = require('./db/db.js');
const connectDB = require('./db/db.js');
const checkRole = require('./middlewares/admin.js');
const User = require('./models/user.js');
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
app.post('/verifyotp',require('./controller/verifyotp.js'));

app.post('/register',async (req, res) => {
  // Handle registration logic here
   const { email, password,role } = req.body;
   const user = new User({ email, passwordHash:password, role });
   await user.save();

   // Perform validation and create user logic
   // ...

   res.status(201).json({ message: "User registered successfully" });
}); 
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

