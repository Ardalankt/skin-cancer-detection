import jwt from "jsonwebtoken"

export const verifyToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided." })
    }

    const token = authHeader.split(" ")[1]

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Add user info to request
    req.user = decoded

    next()
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" })
    }

    res.status(401).json({ message: "Invalid token" })
  }
}

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next()
  } else {
    res.status(403).json({ message: "Access denied. Admin privileges required." })
  }
}
