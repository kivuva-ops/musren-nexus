import { createFileRoute, Link } from "@tanstack/react-router";
import { Link2, BarChart3, Trophy, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { RequestRoleAccess } from "@/components/site/RequestRoleAccess";
import { RolesBadges } from "@/components/site/RolesBadges";

export const Route = createFileRoute("/_authenticated/affiliates/dashboard")({
  head: () => ({
    meta: [
      { title: "Affiliate dashboard — Musren" },
      { name: "description", content: "Track referrals, earnings and campaigns." },
    ],
  }),
  component: AffiliateDashboard,
});

function AffiliateDashboard() {
  const { user, hasAnyRole } = useAuth();
  const allowed = hasAnyRole(["affiliate", "admin", "staff"]);
  if (!allowed) {
    return (
      <SiteLayout>
        <Section
          eyebrow="Affiliates"
          title="Affiliate access required"
          description="Your account isn't enrolled in the affiliate program yet. Apply and our partner team will activate it."
        >
          <div className="space-y-5">
            <RolesBadges highlightMissing="affiliate" />
            <RequestRoleAccess role="affiliate" />
            <div className="flex flex-wrap gap-3">
              <Link to="/affiliates">
                <Button variant="outline" className="glass">Back to overview</Button>
              </Link>
            </div>
          </div>
        </Section>
      </SiteLayout>
    );
  }
  const cards = [
    { icon: Link2, title: "Referral links", desc: "Generate and share personal links and QR codes." },
    { icon: BarChart3, title: "Performance", desc: "Clicks, signups, conversions and revenue." },
    { icon: Trophy, title: "Leaderboards", desc: "See where you rank in active campaigns." },
    { icon: Wallet, title: "Rewards", desc: "Redeem to airtime, data or M-Pesa." },
  ];
  return (
    <SiteLayout>
      <Section
        eyebrow="Affiliates"
        title={<>Welcome back, <span className="text-gradient">{user?.email?.split("@")[0]}</span></>}
        description="Your affiliate workspace — referrals, performance and rewards."
      >
        <div className="mb-6"><RolesBadges /></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((c) => (
            <div key={c.title} className="glass rounded-2xl p-6">
              <c.icon className="size-6 text-primary mb-3" />
              <div className="font-semibold mb-1">{c.title}</div>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/contact">
            <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold">
              Talk to partner team
            </Button>
          </Link>
          <Link to="/affiliates">
            <Button variant="outline" className="glass">Back to overview</Button>
          </Link>
        </div>
      </Section>
    </SiteLayout>
  );
}
