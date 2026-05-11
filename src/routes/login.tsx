import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — Musren" },
      { name: "description", content: "Sign in to your Musren dashboard." },
    ],
  }),
  component: LoginPage,
});

const credSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate({ to: search.redirect ?? "/admin/corporate-topup" });
    }
  }, [loading, isAuthenticated, navigate, search.redirect]);

  const handle = async (
    e: React.FormEvent<HTMLFormElement>,
    mode: "signin" | "signup",
  ) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = credSchema.safeParse({
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        toast.success("Signed in");
      } else {
        const { error } = await supabase.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo: `${window.location.origin}/login` },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to confirm.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

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
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your dashboard or create an account.
          </p>
        </div>

        <div className="rounded-2xl glass-strong p-6 border-gradient">
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-6">
              <form onSubmit={(e) => handle(e, "signin")} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required maxLength={255} className="mt-1.5 glass" />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required minLength={8} maxLength={72} className="mt-1.5 glass" />
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold"
                >
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <form onSubmit={(e) => handle(e, "signup")} className="space-y-4">
                <div>
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" name="email" type="email" required maxLength={255} className="mt-1.5 glass" />
                </div>
                <div>
                  <Label htmlFor="password2">Password</Label>
                  <Input id="password2" name="password" type="password" required minLength={8} maxLength={72} className="mt-1.5 glass" />
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold"
                >
                  {busy ? "Creating…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </SiteLayout>
  );
}
