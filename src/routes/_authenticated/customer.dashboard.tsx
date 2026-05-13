import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, Wallet, Sparkles, Receipt, UserRound, Users } from "lucide-react";
import { CustomerShell } from "@/components/layouts/CustomerShell";
import { Section } from "@/components/site/Section";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/customer/dashboard")({
  head: () => ({
    meta: [
      { title: "Customer dashboard — Musren" },
      { name: "description", content: "Your loyalty points, rewards, bundles and wallet." },
    ],
  }),
  component: CustomerDashboard,
});

const cards = [
  { icon: Sparkles, title: "Loyalty points", desc: "View your earned points and tier progress." },
  { icon: Gift, title: "Rewards", desc: "Redeem airtime, data and bundles." },
  { icon: Users, title: "Referrals", desc: "Invite friends and earn bonus points." },
  { icon: Wallet, title: "Wallet", desc: "Top-up balance and recent activity." },
  { icon: Receipt, title: "Transactions", desc: "All your purchases and redemptions." },
  { icon: UserRound, title: "Profile", desc: "Manage your account details." },
];

function CustomerDashboard() {
  const { user } = useAuth();
  return (
    <CustomerShell>
      <Section
        eyebrow="Customer"
        title={<>Welcome, <span className="text-gradient">{user?.email?.split("@")[0]}</span></>}
        description="Your loyalty, rewards and account in one place."
      >
        <div className="mb-6"><Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Customer account</Badge></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((c) => (
            <div key={c.title} className="glass rounded-2xl p-6">
              <c.icon className="size-6 text-primary mb-3" />
              <div className="font-semibold mb-1">{c.title}</div>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link to="/solutions" className="text-sm text-primary hover:underline">Browse Musren solutions →</Link>
        </div>
      </Section>
    </CustomerShell>
  );
}
