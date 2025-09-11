
//verify otp
const express = require('express');
const router = express.Router();
const verify_user = require('../controller/otpHandler/verifyotp.js');   

router.post('/email_verification',((req,res,next)=>{
    req.body.purpose = "email_verification";next();
}), verify_user);

router.post('/login',
    ((req,res,next)=>{
    req.body.purpose = "login";  next(); 
}), verify_user);


router.post('/register',((req,res,next)=>{
    req.body.purpose = "registration";
    next();
}), verify_user);
router.post('/invite',((req,res,next)=>{
    req.body.purpose = "invite";next();
}), verify_user);

router.post('/password_reset',((req,res,next)=>{
    req.body.purpose = "password_reset";next();
}), verify_user);

module.exports = router


//post
//url/verifyotp/login
//url/verifyotp/email_verification
//url/verifyotp/registration
//url/verifyotp/invite
//url/verifyotp/password_reset