import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Sign in to your Cultural Explorer account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
