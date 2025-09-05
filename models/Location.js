const mongoose = require("mongoose");
const { Schema } = mongoose;

const LocationSchema = new mongoose.Schema({
  postalcodes: [{
    type: String,
    required: true,
    validate: {
      validator: (v) => /^[A-Z]{1,2}\d[A-Z\d]?$/i.test(v),
      message: props => `${props.value} is not a valid UK outward code!`
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model("Location", LocationSchema);
