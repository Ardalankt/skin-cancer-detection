import express from "express"
import { register, login, getCurrentUser } from "../controllers/auth.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

// Register a new user
router.post("/register", register)

// Login user
router.post("/login", login)

// Get current user (protected route)
router.get("/me", verifyToken, getCurrentUser)

export default router
