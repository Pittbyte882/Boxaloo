import Link from "next/link"
import { Truck, AlertTriangle, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Truck className="size-7 text-primary" />
          <span className="text-xl font-bold tracking-tight text-foreground">BOXALOO</span>
        </div>
        <div className="size-16 rounded-full bg-[#ffd166]/15 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="size-8 text-[#ffd166]" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Account Suspended</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Your account has been suspended due to a billing issue. Please update your payment method to restore access to the load board and dashboard.
        </p>
        <Button className="bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90 mb-3 w-full">
          <CreditCard className="size-4 mr-2" />
          Update Billing
        </Button>
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Return to home
        </Link>
      </div>
    </div>
  )
}
