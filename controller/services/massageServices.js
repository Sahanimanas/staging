const express = require('express')
const Service = require('../../models/ServiceSchema.js');
const getAllServices = async (req, res) => {
  try {
    // if (!req.user) {
    //   return res.status(401).json({ message: "Unauthorized access. Please log in." });
    // }
    const services = await Service.find();
    res.status(200).json(services);
  } catch (err) {
    
    res.status(500).json({ message: "Server error. Could not fetch services." });
  }
}

module.exports = getAllServices
