const mongoose = require('mongoose')

const temporarySchema = new mongoose.Schema({
  // Define your schema fields here
data:{
    type:Object
}
});

module.exports = mongoose.model('Temporary', temporarySchema);
