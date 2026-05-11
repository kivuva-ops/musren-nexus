import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Musren" }, { name: "description", content: "Sign in to Musren." }] }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-md px-4 py-16">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="size-9 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center">
              <Zap className="size-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-bold">Musren</span>
          </Link>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your dashboard or create an account.</p>
        </div>

        <div className="rounded-2xl glass-strong p-6 border-gradient">
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="space-y-4 mt-6">
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" className="mt-1.5 glass" /></div>
              <div><Label htmlFor="password">Password</Label><Input id="password" type="password" className="mt-1.5 glass" /></div>
              <Button className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold">Sign in</Button>
              <p className="text-xs text-center text-muted-foreground">Auth & roles are wired up in the next iteration via Lovable Cloud.</p>
            </TabsContent>
            <TabsContent value="signup" className="space-y-4 mt-6">
              <div><Label htmlFor="name2">Name</Label><Input id="name2" className="mt-1.5 glass" /></div>
              <div><Label htmlFor="email2">Email</Label><Input id="email2" type="email" className="mt-1.5 glass" /></div>
              <div><Label htmlFor="password2">Password</Label><Input id="password2" type="password" className="mt-1.5 glass" /></div>
              <Button className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold">Create account</Button>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </SiteLayout>
  );
}
