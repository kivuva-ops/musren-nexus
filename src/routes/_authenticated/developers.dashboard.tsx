import { createFileRoute, Link } from "@tanstack/react-router";
import { Code2, KeyRound, Webhook, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section } from "@/components/site/Section";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/developers/dashboard")({
  head: () => ({
    meta: [
      { title: "Developer dashboard — Musren" },
      { name: "description", content: "Manage your API keys, webhooks and sandbox." },
    ],
  }),
  component: DeveloperDashboard,
});

function DeveloperDashboard() {
  const { user } = useAuth();
  const cards = [
    { icon: KeyRound, title: "API keys", desc: "Create and rotate sandbox and live keys." },
    { icon: Webhook, title: "Webhooks", desc: "Configure endpoints with signed payloads." },
    { icon: Code2, title: "SDKs & samples", desc: "Node, Python, PHP and Java starters." },
    { icon: BookOpen, title: "Docs & forum", desc: "Guides, references and community." },
  ];
  return (
    <SiteLayout>
      <Section
        eyebrow="Developers"
        title={<>Welcome back, <span className="text-gradient">{user?.email?.split("@")[0]}</span></>}
        description="Your developer workspace — keys, webhooks, SDKs and docs."
      >
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
              Request live access
            </Button>
          </Link>
          <Link to="/developers">
            <Button variant="outline" className="glass">Back to overview</Button>
          </Link>
        </div>
      </Section>
    </SiteLayout>
  );
}
