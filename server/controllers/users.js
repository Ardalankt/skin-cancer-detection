import User from "../models/User.js"

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({ user })
  } catch (error) {
    res.status(500).json({ message: "Failed to get user profile", error: error.message })
  }
}

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { name, email } = req.body

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email })
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ message: "Email is already taken" })
      }
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { name, email } },
      { new: true, runValidators: true },
    )

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({ user: updatedUser })
  } catch (error) {
    res.status(500).json({ message: "Failed to update user profile", error: error.message })
  }
}

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    // Find user with password
    const user = await User.findById(req.user.id).select("+password")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.status(200).json({ message: "Password updated successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to change password", error: error.message })
  }
}
