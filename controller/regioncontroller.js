// controllers/regionController.js

const postcodeRegions = {
  central: ["EC1", "EC2", "EC3", "EC4", "WC1", "WC2", "W1", "SW1", "NW1", "SE1"],
  east: [
    "E1","E2","E3","E4","E5","E6","E7","E8","E9","E10","E11","E12","E13","E14","E15","E16","E17","E18","E20",
    "IG1","IG2","IG3","IG4","IG5","IG6","IG7","IG8","IG9","IG10","IG11",
    "RM1","RM2","RM3","RM4","RM5","RM6","RM7","RM8","RM9","RM10","RM11","RM12","RM13"
  ],
  west: [
    "W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12","W13","W14",
    "SW3","SW4","SW5","SW6","SW7","SW10","SW13","SW14","SW15","SW18","SW19","SW20",
    "UB1","UB2","UB3","UB4","UB5","UB6","UB7","UB8","UB9","UB10","UB11",
    "HA0","HA1","HA2","HA3","HA4","HA5","HA6","HA7","HA8","HA9",
    "TW1","TW2","TW3","TW4","TW5","TW6","TW7","TW8","TW9","TW10","TW11","TW12","TW13","TW14","TW15","TW16","TW17","TW18","TW19","TW20"
  ],
  north: [
    "N1","N2","N3","N4","N5","N6","N7","N8","N9","N10","N11","N12","N13","N14","N15","N16","N17","N18","N19","N20","N21","N22",
    "NW2","NW3","NW4","NW5","NW6","NW7","NW8","NW9","NW10","NW11",
    "EN1","EN2","EN3","EN4","EN5"
  ],
  south: [
    "SE1","SE2","SE3","SE4","SE5","SE6","SE7","SE8","SE9","SE10","SE11","SE12","SE13","SE14","SE15","SE16","SE17","SE18","SE19","SE20","SE21","SE22","SE23","SE24","SE25","SE26","SE27","SE28",
    "SW2","SW8","SW9","SW11","SW12","SW16","SW17",
    "CR0","CR2","CR3","CR4","CR5","CR6","CR7","CR8","CR9",
    "BR1","BR2","BR3","BR4","BR5","BR6","BR7","BR8",
    "SM1","SM2","SM3","SM4","SM5","SM6","SM7",
    "KT1","KT2","KT3","KT4","KT5","KT6","KT9"
  ]
};

const getRegionFromPostcode = (req, res) => {
  try {
    const { postalCode } = req.body;
    if (!postalCode) {
      return res.status(400).json({ error: "Postcode is required" });
    }

    // Normalize: remove spaces, make uppercase
    const normalized = postalCode.toUpperCase().replace(/\s+/g, "");

    // Extract outward code properly
    const outwardMatch = normalized.match(/^([A-Z]{1,2}\d[A-Z\d]?)/);
    if (!outwardMatch) {
      return res.status(400).json({ error: "Invalid UK postcode format" });
    }

    const code = outwardMatch[1];
    console.log("Outward code detected:", code);

    // Prefix match to detect region
    let region = null;
    for (const [key, codes] of Object.entries(postcodeRegions)) {
      if (codes.some(c => code.startsWith(c))) {
        region = key;
        break;
      }
    }

    if (!region) {
      return res.status(404).json({ region: "unknown", message: "Not a recognized London postcode" });
    }

    return res.json({ postcode: code, region });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = getRegionFromPostcode;
