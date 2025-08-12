
const checkRole = (roles) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: "Access denied" });
    }
    req.body.role = userRole; // Ensure role is set in request body
    next();
  };
};

module.exports = checkRole;
