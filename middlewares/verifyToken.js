const jwt = require("jsonwebtoken");

// Verify Token
function verifyToken(req, res, next) {
  const authToken = req.headers.authorization;
  if (authToken) {
    const token = authToken.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ msg: "Invalid Token, access denied" });
    }
  } else {
    return res.status(401).json({ msg: "No Token Provided, access denied" });
  }
}

// Verify Token & Admin
function verifyTokenAndAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.isAdmin) {
      next();
    } else {
      return res.status(403).json({ msg: "Not Allow, Only Admin" });
    }
  });
}

// Verify Token & Only User Himself
function verifyTokenAndOnlyUser(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id) {
      next();
    } else {
      return res.status(403).json({ msg: "Not Allow, Only User Himself" });
    }
  });
}

// Verify Token & Only User Himself Or Admins
function verifyTokenAndOnlyUserOrAdmins(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.user.isAdmin) {
      next();
    } else {
      return res.status(403).json({ msg: "Not Allow, Only User Himself Or Admins" });
    }
  });
}

module.exports = {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndOnlyUser,
  verifyTokenAndOnlyUserOrAdmins,
};
