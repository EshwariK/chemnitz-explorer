"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Chrome, Github } from "lucide-react"
import Link from "next/link"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setIsLoading("google")
    await signIn("google", { callbackUrl: "/" })
  }

  const handleGithubLogin = async () => {
    setIsLoading("github")
    await signIn("github", { callbackUrl: "/" })
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
        <CardDescription className="text-center">
          Sign in to your Cultural Explorer account using your preferred provider
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading !== null}>
          <Chrome className="mr-2 h-4 w-4" />
          {isLoading === "google" ? "Signing in..." : "Continue with Google"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={handleGithubLogin} disabled={isLoading !== null}>
          <Github className="mr-2 h-4 w-4" />
          {isLoading === "github" ? "Signing in..." : "Continue with GitHub"}
        </Button>

        <div className="text-center text-sm text-muted-foreground mt-6">
          <p>
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-primary">
              Privacy Policy
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
