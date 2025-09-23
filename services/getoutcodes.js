// controllers/postcodeController.js

const londonOutcodes = [
  "CM", "CR", "DA", "E1", "E10", "E11", "E12", "E13", "E14", "E15", "E16", "E17", "E18", "E2", "E20", "E22", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "EC1A", "EC1M", "EC1N", "EC1P", "EC1R", "EC1V", "EC1Y",
  "EC2A", "EC2M", "EC2N", "EC2P", "EC2R", "EC2V", "EC2Y", "EC3A", "EC3M", "EC3N", "EC3P", "EC3R", "EC3V", "EC4A", "EC4M", "EC4N", "EC4P", "EC4R", "EC4V", "EC4Y",
  "HA", "IG", "N1", "N2", "N3", "N4", "N5", "N6", "N7", "N8", "N9", "N10", "N11", "N12", "N13", "N14", "N15", "N16", "N17", "N18", "N19", "N20", "N21", "N22", "N81",
  "NW1", "NW2", "NW3", "NW4", "NW5", "NW6", "NW7", "NW8", "NW9", "NW10", "NW11",
  "RM", "SE1", "SE10", "SE11", "SE12", "SE13", "SE14", "SE15", "SE16", "SE17", "SE18", "SE19", "SE2", "SE20", "SE21", "SE22", "SE23", "SE24", "SE25", "SE26", "SE27", "SE28",
  "SM", "SW1A", "SW1E", "SW1H", "SW1P", "SW1V", "SW1W", "SW1X", "SW1Y", "SW2", "SW3", "SW4", "SW5", "SW6", "SW7", "SW8", "SW9", "SW10", "SW11", "SW12", "SW13", "SW14", "SW15", "SW16", "SW17", "SW18", "SW19", "SW20",
  "TN", "TW", "UB", "W1A", "W1B", "W1C", "W1D", "W1F", "W1G", "W1H", "W1J", "W1K", "W1S", "W1T", "W1U", "W1W",
  "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9",
  "WC1A", "WC1B", "WC1E", "WC1H", "WC1N", "WC1R", "WC1V", "WC1X",
  "WC2A", "WC2B", "WC2E", "WC2H", "WC2N", "WC2R",
  "WD", "W10", "W11", "W12", "W13", "W14",
  "KT", "SL"
]

const getLondonOutcodes = (req, res) => {
  try {
    let { q = "", limit = 50 } = req.query; // Default limit 50
    limit = parseInt(limit, 10);

    // Filter by query
    let filtered = londonOutcodes.filter(code =>
      code.toLowerCase().includes(q.toLowerCase())
    );

    // Apply limit
    filtered = filtered.slice(0, limit);
 const result = filtered.map(code => ({ postcode: code }));
    res.status(200).json({ result})
  } catch (error) {
    console.error("Error fetching London outcodes:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports =  getLondonOutcodes ;
