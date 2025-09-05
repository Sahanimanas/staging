const TherapistProfile  = require('../../../models/TherapistProfiles');

const therapist = async (req,res) =>{
    const {id} = req.params;
    if(!id){
        return res.status(400).json({error: "Therapist ID is required"});
    }
  
    const therapistProfile = await TherapistProfile.findById(id).populate('userId').populate('specializations', 'name -_id').lean();
   
    if (!therapistProfile) {
        return res.status(404).json({error: "Therapist not found"});
    }

    return res.status(200).json({therapist: therapistProfile});
}

module.exports = therapist;