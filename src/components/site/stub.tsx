import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function makeStub(opts: {
  path: string;
  title: string;
  eyebrow: string;
  description: string;
  bullets?: string[];
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return createFileRoute(opts.path as never)({
    head: () => ({
      meta: [
        { title: `${opts.title} — Musren` },
        { name: "description", content: opts.description },
        { property: "og:title", content: `${opts.title} — Musren` },
        { property: "og:description", content: opts.description },
      ],
    }),
    component: () => (
      <SiteLayout>
        <Section
          eyebrow={opts.eyebrow}
          title={<><span className="text-gradient">{opts.title}</span></>}
          description={opts.description}
        >
          {opts.bullets && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {opts.bullets.map((b) => (
                <div key={b} className="glass rounded-2xl p-6">
                  <p className="text-foreground/90">{b}</p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-12 flex gap-3 flex-wrap">
            <Link to={opts.ctaHref ?? "/contact"}>
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold glow">
                {opts.ctaLabel ?? "Talk to sales"} <ArrowRight className="ml-1 size-4" />
              </Button>
            </Link>
            <Link to="/solutions">
              <Button size="lg" variant="outline" className="glass">View solutions</Button>
            </Link>
          </div>
        </Section>
      </SiteLayout>
    ),
  });
}
