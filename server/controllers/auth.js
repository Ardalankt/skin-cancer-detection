import jwt from "jsonwebtoken"
import User from "../models/User.js"

// Register a new user
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" })
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password,
    })

    // Save user to database
    await newUser.save()

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: "1d" })

    // Return user data (excluding password) and token
    const userWithoutPassword = { ...newUser._doc }
    delete userWithoutPassword.password

    res.status(201).json({
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message })
  }
}

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user by email and include password for verification
    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" })

    // Return user data (excluding password) and token
    const userWithoutPassword = { ...user._doc }
    delete userWithoutPassword.password

    res.status(200).json({
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message })
  }
}

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({ user })
  } catch (error) {
    res.status(500).json({ message: "Failed to get user", error: error.message })
  }
}
