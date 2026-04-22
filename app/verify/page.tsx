"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Film } from "lucide-react"

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailParam = searchParams.get("email") || ""
  
  const [email, setEmail] = useState(emailParam)
  const [token, setToken] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(20)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResend = async () => {
    if (!email) {
      setError("Email is missing")
      return
    }
    setError("")
    setMessage("")
    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Resend failed")
      } else {
        setMessage("Verification code resent!")
        setCountdown(20)
      }
    } catch (err) {
      setError("An error occurred while resending.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !token) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Verification failed")
      } else {
        router.push("/login?verified=true")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <Film className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">CineStream</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-foreground">Verify Email</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter the 6-digit code sent to your Gmail address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                readOnly={!!emailParam}
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token" className="text-foreground">Verification Code</Label>
              <Input
                id="token"
                type="text"
                placeholder="123456"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="bg-background border-border text-foreground text-center tracking-[0.5em] font-mono text-xl"
                maxLength={6}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-green-500">{message}</p>}
            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? "Verifying..." : "Verify Account"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            {countdown > 0 ? (
              <p className="text-sm text-muted-foreground">
                Resend code in {countdown}s
              </p>
            ) : (
              <Button variant="link" onClick={handleResend} className="text-primary hover:underline">
                Resend Verification Code
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
