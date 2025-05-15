import express from "express"
import { getUserProfile, updateUserProfile, changePassword } from "../controllers/users.js"

const router = express.Router()

// Get user profile
router.get("/profile", getUserProfile)

// Update user profile
router.put("/profile", updateUserProfile)

// Change password
router.put("/change-password", changePassword)

export default router
