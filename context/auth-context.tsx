"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { loginUser, registerUser, getCurrentUser } from "@/lib/api"

interface User {
  _id: string
  name: string
  email: string
  role: string
  profilePicture?: string
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Check if user is already logged in
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const storedToken = localStorage.getItem("token")

        if (storedToken) {
          setToken(storedToken)

          // Fetch current user data
          const { user } = await getCurrentUser()
          setUser(user)
        }
      } catch (error) {
        // If token is invalid, clear it
        localStorage.removeItem("token")
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkLoggedIn()
  }, [])

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await loginUser({ email, password })

      // Save token to localStorage
      localStorage.setItem("token", data.token)

      // Update state
      setToken(data.token)
      setUser(data.user)

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error: any) {
      setError(error.response?.data?.message || "Login failed")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Register function
  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await registerUser({ name, email, password })

      // Save token to localStorage
      localStorage.setItem("token", data.token)

      // Update state
      setToken(data.token)
      setUser(data.user)

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error: any) {
      setError(error.response?.data?.message || "Registration failed")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = () => {
    // Clear token from localStorage
    localStorage.removeItem("token")

    // Update state
    setToken(null)
    setUser(null)

    // Redirect to home page
    router.push("/")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
