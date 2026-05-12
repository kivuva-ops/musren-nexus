import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Users, Megaphone, FileCheck2, Receipt } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section } from "@/components/site/Section";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — Musren" },
      { name: "description", content: "Administer users, roles, affiliates and consent." },
    ],
  }),
  component: AdminDashboardPage,
});

const cards = [
  { href: "/admin/users", title: "Users & roles", description: "Grant or revoke access for any team member.", icon: Users },
  { href: "/admin/role-requests", title: "Role requests", description: "Review and approve role change requests.", icon: FileCheck2 },
  { href: "/admin/affiliates", title: "Affiliates", description: "Manage codes, assets, templates and payouts.", icon: Megaphone },
  { href: "/admin/corporate-topup", title: "Corporate top-ups", description: "Process bulk top-up requests.", icon: Receipt },
  { href: "/admin/consent", title: "Consent log", description: "Audit user consent records.", icon: ShieldCheck },
] as const;

function AdminDashboardPage() {
  const { user, roles } = useAuth();
  return (
    <SiteLayout>
      <Section
        eyebrow="Admin"
        title={<>Welcome back, <span className="text-gradient">{user?.email?.split("@")[0]}</span></>}
        description={`Signed in as ${roles.join(", ") || "admin"}.`}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map(({ href, title, description, icon: Icon }) => (
            <Link key={href} to={href} className="glass rounded-2xl p-6 transition hover:bg-secondary/70">
              <Icon className="size-7 text-primary" />
              <h2 className="mt-5 font-display text-xl font-bold">{title}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{description}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Open <ArrowRight className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      </Section>
    </SiteLayout>
  );
}
