
 const BookingSchema = require("../../models/BookingSchema");
const sendMail = require("../../utils/sendmail");

const takeReply = async(req,res) =>{
    try{
    const {id}= req.params;
    const {reply} = req.body;
    const booking = await BookingSchema.findById(id).populate('clientId', 'email');
    const subject = 'Reply to Review';
    const html = `<p>${reply}</p>\n<p>Team Noira</p>`
    const result = await sendMail(booking.clientId.email, subject, html, "booking");
    res.status(200).json({message:"review sent"})
    }
    catch(err){
     res.status(404).json({message:err.message},)
    }

}

module.exports = takeReply;