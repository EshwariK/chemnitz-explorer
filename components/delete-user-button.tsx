"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Trash2, AlertTriangle } from "lucide-react"

export function DeleteUserButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    
    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Account deleted successfully")
        // Sign out the user and redirect to home
        await signOut({ callbackUrl: "/" })
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to delete account")
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      toast.error("An error occurred while deleting your account")
    } finally {
      setIsDeleting(false)
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="w-full">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription className="text-left space-y-2">
            <p>
              <strong>This action cannot be undone.</strong> This will permanently delete your account and remove all your data from our servers.
            </p>
            <p>This includes:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Your profile information</li>
              <li>All favorite cultural sites</li>
              <li>Your activity history</li>
              <li>Any memories you&apos;ve created</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
