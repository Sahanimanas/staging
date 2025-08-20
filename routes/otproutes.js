//verify otp
const express = require('express');
const router = express.Router();
const verify_user = require('../controller/otpHandler/verifyotp.js');   

router.post('/email_verification',((req,res)=>{
    req.body.purpose = "email_verification";
}), verify_user);

router.post('/login',
    ((req,res)=>{
    req.body.purpose = "login";   
}), verify_user);
router.post('/registration',((req,res)=>{
    req.body.purpose = "registration";

}), verify_user);
router.post('/invite',((req,res)=>{
    req.body.purpose = "invite";

}), verify_user);
router.post('/password_reset',((req,res)=>{
    req.body.purpose = "password_reset";
}), verify_user);

module.exports = router