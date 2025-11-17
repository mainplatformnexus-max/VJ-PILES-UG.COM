"use client"

import { useState } from "react"
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isSignup) {
        if (password !== confirmPassword) {
          setError("Passwords do not match")
          setLoading(false)
          return
        }
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      onClose()
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || (isSignup ? "Signup failed" : "Login failed. Please check your credentials."))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setError("")
    setLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      onClose()
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || "Google authentication failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition">
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">VJ PILES UG MOVIES</h2>
          <p className="text-slate-400 text-sm">{isSignup ? "Create Account" : "Welcome Back"}</p>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-500/20 border border-red-400/50 rounded text-red-100 text-xs">{error}</div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-white mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8 bg-slate-800 border-slate-700 text-white placeholder-slate-500 text-xs"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white mb-1">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-8 bg-slate-800 border-slate-700 text-white placeholder-slate-500 text-xs"
              placeholder="Enter your password"
              required
            />
          </div>

          {isSignup && (
            <div>
              <label className="block text-xs font-medium text-white mb-1">Confirm Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-8 bg-slate-800 border-slate-700 text-white placeholder-slate-500 text-xs"
                placeholder="Confirm your password"
                required
              />
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full h-8 bg-[#e50914] hover:bg-[#f6121d] text-white text-xs">
            {loading ? (isSignup ? "Creating..." : "Logging in...") : isSignup ? "Sign Up" : "Login"}
          </Button>
        </form>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-slate-900 text-slate-500">Or continue with</span>
          </div>
        </div>

        <Button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full h-8 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs mb-4"
        >
          {loading ? "Signing in..." : "Sign in with Google"}
        </Button>

        <div className="text-center text-xs text-slate-400">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup)
              setError("")
              setConfirmPassword("")
            }}
            className="text-[#e50914] hover:text-[#f6121d] font-medium transition"
          >
            {isSignup ? "Login" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  )
}
