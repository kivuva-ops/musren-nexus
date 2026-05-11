import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Settings2, Sparkles, Coins, Trophy, ShieldCheck, Wallet, Plus, Save, CheckCircle2, XCircle, Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { products } from "@/lib/products";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/affiliates")({
  head: () => ({ meta: [{ title: "Affiliate admin — Musren" }] }),
  component: AffiliateAdminPage,
});

function AffiliateAdminPage() {
  const { hasAnyRole, hasRole, loading } = useAuth();
  if (loading) return <SiteLayout><Section title="Loading…" /></SiteLayout>;
  if (!hasAnyRole(["admin", "staff"])) {
    return (
      <SiteLayout>
        <Section eyebrow="Admin" title="Staff access required" description="You need admin or staff role to manage affiliates.">
          <Link to="/"><Button variant="outline" className="glass">Back home</Button></Link>
        </Section>
      </SiteLayout>
    );
  }
  return (
    <SiteLayout>
      <Section eyebrow="Admin" title="Affiliate engine" description="Configure rewards, promotions, exchange rates, withdrawals and view rankings.">
        <div className="mb-6">
          <Link to="/admin/role-requests" className="text-sm text-muted-foreground inline-flex items-center gap-1.5 hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to admin
          </Link>
        </div>
        <Tabs defaultValue="rules">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
            <TabsTrigger value="rules"><Settings2 className="size-4 mr-1.5" />Rules</TabsTrigger>
            <TabsTrigger value="promos"><Sparkles className="size-4 mr-1.5" />Promotions</TabsTrigger>
            <TabsTrigger value="rates"><Coins className="size-4 mr-1.5" />Exchange</TabsTrigger>
            <TabsTrigger value="withdrawals"><Wallet className="size-4 mr-1.5" />Withdrawals</TabsTrigger>
            <TabsTrigger value="config"><ShieldCheck className="size-4 mr-1.5" />Config</TabsTrigger>
            <TabsTrigger value="board"><Trophy className="size-4 mr-1.5" />Leaderboard</TabsTrigger>
          </TabsList>
          <TabsContent value="rules" className="mt-6"><RulesTab canEdit={hasRole("admin")} /></TabsContent>
          <TabsContent value="promos" className="mt-6"><PromotionsTab canEdit={hasRole("admin")} /></TabsContent>
          <TabsContent value="rates" className="mt-6"><RatesTab canEdit={hasRole("admin")} /></TabsContent>
          <TabsContent value="withdrawals" className="mt-6"><WithdrawalsTab /></TabsContent>
          <TabsContent value="config" className="mt-6"><ConfigTab canEdit={hasRole("admin")} /></TabsContent>
          <TabsContent value="board" className="mt-6"><LeaderboardTab /></TabsContent>
        </Tabs>
      </Section>
    </SiteLayout>
  );
}

/* ============ Reward Rules ============ */
function RulesTab({ canEdit }: { canEdit: boolean }) {
  const qc = useQueryClient();
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["aff-admin-rules"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("affiliate_reward_rules").select("*").order("product_slug");
      return data ?? [];
    },
  });

  const upsert = useMutation({
    mutationFn: async (row: any) => {
      const { error } = await (supabase as any).from("affiliate_reward_rules").upsert(row, { onConflict: "product_slug" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["aff-admin-rules"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const existingSlugs = new Set(rules.map((r: any) => r.product_slug));
  const allRows = [
    ...rules,
    ...products.filter((p) => !existingSlugs.has(p.slug)).map((p) => ({
      product_slug: p.slug, click_points: 0, signup_points: 0, purchase_points: 0,
      revenue_share_bps: 0, max_daily_points: null, active: true,
    })),
  ].sort((a: any, b: any) => a.product_slug.localeCompare(b.product_slug));

  if (isLoading) return <Sk />;
  return (
    <div className="space-y-3">
      {allRows.map((r: any) => <RuleRow key={r.product_slug} row={r} canEdit={canEdit} onSave={(x) => upsert.mutate(x)} busy={upsert.isPending} />)}
    </div>
  );
}

function RuleRow({ row, canEdit, onSave, busy }: { row: any; canEdit: boolean; onSave: (r: any) => void; busy: boolean }) {
  const [r, setR] = useState(row);
  const product = products.find((p) => p.slug === r.product_slug);
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div>
          <div className="font-semibold">{product?.name ?? r.product_slug}</div>
          <div className="text-xs text-muted-foreground font-mono">{r.product_slug}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs"><span className="text-muted-foreground">Active</span>
            <Switch checked={r.active} onCheckedChange={(v) => setR({ ...r, active: v })} disabled={!canEdit} />
          </div>
          {canEdit && (
            <Button size="sm" onClick={() => onSave(r)} disabled={busy}><Save className="size-3.5 mr-1.5" />Save</Button>
          )}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Field label="Click pts" value={r.click_points} onChange={(v) => setR({ ...r, click_points: +v })} disabled={!canEdit} />
        <Field label="Signup pts" value={r.signup_points} onChange={(v) => setR({ ...r, signup_points: +v })} disabled={!canEdit} />
        <Field label="Purchase pts" value={r.purchase_points} onChange={(v) => setR({ ...r, purchase_points: +v })} disabled={!canEdit} />
        <Field label="Revenue share (bps)" value={r.revenue_share_bps} onChange={(v) => setR({ ...r, revenue_share_bps: +v })} disabled={!canEdit} />
        <Field label="Max daily pts" value={r.max_daily_points ?? ""} onChange={(v) => setR({ ...r, max_daily_points: v ? +v : null })} disabled={!canEdit} />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, disabled }: { label: string; value: any; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <label className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="glass" />
    </label>
  );
}

/* ============ Promotions ============ */
function PromotionsTab({ canEdit }: { canEdit: boolean }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: promos = [] } = useQuery({
    queryKey: ["aff-admin-promos"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("affiliate_promotions").select("*, promotion_products(product_slug)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await (supabase as any).from("affiliate_promotions").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aff-admin-promos"] }),
  });

  return (
    <div className="space-y-4">
      {canEdit && (
        <Button onClick={() => setOpen(!open)} className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
          <Plus className="size-4 mr-1.5" /> {open ? "Cancel" : "New promotion"}
        </Button>
      )}
      {open && <NewPromotionForm onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["aff-admin-promos"] }); }} />}
      {promos.length === 0 ? <Empty msg="No promotions yet." /> : promos.map((p: any) => (
        <div key={p.id} className="glass rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="font-semibold flex items-center gap-2">{p.name}
                <Badge className="bg-primary/15 text-primary border-primary/30">{Number(p.multiplier).toFixed(2)}×</Badge>
                {p.public_visible && <Badge variant="outline" className="text-xs">visible</Badge>}
                {p.notify_affiliates && <Badge variant="outline" className="text-xs">notifies</Badge>}
              </div>
              {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
              <div className="text-xs text-muted-foreground mt-2">
                {new Date(p.starts_at).toLocaleString()} → {p.ends_at ? new Date(p.ends_at).toLocaleString() : "no end"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Products: {p.promotion_products?.length ? p.promotion_products.map((x: any) => x.product_slug).join(", ") : "all"}
              </div>
            </div>
            {canEdit && (
              <div className="flex items-center gap-2 text-xs">Active
                <Switch checked={p.active} onCheckedChange={(v) => toggleActive.mutate({ id: p.id, active: v })} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function NewPromotionForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    name: "", description: "", multiplier: "2",
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: "", public_visible: true, notify_affiliates: true,
    product_slugs: [] as string[],
  });
  const create = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Name required");
      const { data: p, error } = await (supabase as any).from("affiliate_promotions").insert({
        name: form.name, description: form.description || null,
        multiplier: parseFloat(form.multiplier),
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        public_visible: form.public_visible, notify_affiliates: form.notify_affiliates, active: true,
      }).select("id").single();
      if (error) throw error;
      if (form.product_slugs.length) {
        const rows = form.product_slugs.map((s) => ({ promotion_id: p.id, product_slug: s }));
        const { error: e2 } = await (supabase as any).from("promotion_products").insert(rows);
        if (e2) throw e2;
      }
    },
    onSuccess: () => { toast.success("Promotion created"); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggleProduct = (slug: string) => setForm((f) => ({
    ...f, product_slugs: f.product_slugs.includes(slug) ? f.product_slugs.filter((s) => s !== slug) : [...f.product_slugs, slug],
  }));
  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Promotion name" className="glass" />
      <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="glass" />
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="space-y-1"><span className="text-xs text-muted-foreground">Multiplier</span>
          <Input type="number" step="0.5" value={form.multiplier} onChange={(e) => setForm({ ...form, multiplier: e.target.value })} className="glass" /></label>
        <label className="space-y-1"><span className="text-xs text-muted-foreground">Starts</span>
          <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className="glass" /></label>
        <label className="space-y-1"><span className="text-xs text-muted-foreground">Ends (optional)</span>
          <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className="glass" /></label>
      </div>
      <div className="flex flex-wrap gap-2">
        {products.map((p) => (
          <button key={p.slug} type="button" onClick={() => toggleProduct(p.slug)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${form.product_slugs.includes(p.slug) ? "bg-primary/15 border-primary/40 text-primary" : "border-border text-muted-foreground"}`}>
            {p.name}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">Public visible <Switch checked={form.public_visible} onCheckedChange={(v) => setForm({ ...form, public_visible: v })} /></label>
        <label className="flex items-center gap-2">Notify affiliates <Switch checked={form.notify_affiliates} onCheckedChange={(v) => setForm({ ...form, notify_affiliates: v })} /></label>
      </div>
      <Button onClick={() => create.mutate()} disabled={create.isPending} className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
        {create.isPending ? <Loader2 className="size-4 animate-spin" /> : "Create promotion"}
      </Button>
    </div>
  );
}

/* ============ Exchange Rates ============ */
function RatesTab({ canEdit }: { canEdit: boolean }) {
  const qc = useQueryClient();
  const { data: rates = [] } = useQuery({
    queryKey: ["aff-admin-rates"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("loyalty_exchange_rates").select("*").order("kind").order("starts_at", { ascending: false });
      return data ?? [];
    },
  });
  const [form, setForm] = useState({ kind: "cash", points: "100", value_amount: "1000", label: "" });
  const create = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("loyalty_exchange_rates").insert({
        kind: form.kind, points: +form.points, value_amount: +form.value_amount, label: form.label || null, active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Rate added"); qc.invalidateQueries({ queryKey: ["aff-admin-rates"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await (supabase as any).from("loyalty_exchange_rates").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aff-admin-rates"] }),
  });
  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="glass rounded-2xl p-5 grid sm:grid-cols-5 gap-3 items-end">
          <label className="space-y-1"><span className="text-xs text-muted-foreground">Kind</span>
            <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
              <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash (cents)</SelectItem>
                <SelectItem value="airtime">Airtime (cents)</SelectItem>
                <SelectItem value="data">Data (MB)</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <Field label="Points" value={form.points} onChange={(v) => setForm({ ...form, points: v })} />
          <Field label="Value amount" value={form.value_amount} onChange={(v) => setForm({ ...form, value_amount: v })} />
          <label className="space-y-1 sm:col-span-2"><span className="text-xs text-muted-foreground">Label</span>
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="glass" placeholder="e.g. Weekend boost: 2× cash" />
          </label>
          <Button onClick={() => create.mutate()} disabled={create.isPending} className="bg-gradient-to-r from-primary to-accent text-primary-foreground sm:col-span-5">
            <Plus className="size-4 mr-1.5" /> Add rate
          </Button>
        </div>
      )}
      {rates.map((r: any) => (
        <div key={r.id} className="glass rounded-xl p-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-medium capitalize">{r.kind}: {r.points} pts → {r.value_amount} {r.kind === "data" ? "MB" : "cents"}</div>
            {r.label && <div className="text-xs text-muted-foreground">{r.label}</div>}
            <div className="text-xs text-muted-foreground">{new Date(r.starts_at).toLocaleString()} {r.ends_at ? `→ ${new Date(r.ends_at).toLocaleString()}` : ""}</div>
          </div>
          {canEdit && <Switch checked={r.active} onCheckedChange={(v) => toggle.mutate({ id: r.id, active: v })} />}
        </div>
      ))}
    </div>
  );
}

/* ============ Withdrawals queue ============ */
function WithdrawalsTab() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "paid" | "rejected">("pending");
  const { data: list = [] } = useQuery({
    queryKey: ["aff-admin-withdrawals", tab],
    queryFn: async () => {
      const { data } = await (supabase as any).from("withdrawal_requests").select("*").eq("status", tab).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const approve = useMutation({
    mutationFn: async ({ id, ref }: { id: string; ref: string }) => {
      const { error } = await (supabase as any).rpc("affiliate_approve_withdrawal", { _id: id, _payout_ref: ref });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Approved & marked paid"); qc.invalidateQueries({ queryKey: ["aff-admin-withdrawals"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const reject = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await (supabase as any).rpc("affiliate_reject_withdrawal", { _id: id, _reason: reason });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Rejected"); qc.invalidateQueries({ queryKey: ["aff-admin-withdrawals"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
      <TabsList className="grid grid-cols-3 max-w-md">
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="paid">Paid</TabsTrigger>
        <TabsTrigger value="rejected">Rejected</TabsTrigger>
      </TabsList>
      <TabsContent value={tab} className="mt-4 space-y-3">
        {list.length === 0 ? <Empty msg={`No ${tab} withdrawals.`} /> : list.map((w: any) => (
          <WithdrawalRow key={w.id} w={w} onApprove={(ref) => approve.mutate({ id: w.id, ref })} onReject={(r) => reject.mutate({ id: w.id, reason: r })} busy={approve.isPending || reject.isPending} canAct={tab === "pending"} />
        ))}
      </TabsContent>
    </Tabs>
  );
}

function WithdrawalRow({ w, onApprove, onReject, busy, canAct }: { w: any; onApprove: (ref: string) => void; onReject: (reason: string) => void; busy: boolean; canAct: boolean }) {
  const [ref, setRef] = useState("");
  const [reason, setReason] = useState("");
  const valueLabel = w.method === "data" ? `${w.amount_value} MB` : `KES ${(w.amount_value / 100).toFixed(2)}`;
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <div className="font-semibold capitalize">{w.method} • {w.amount_points} pts → {valueLabel}</div>
          <div className="text-xs text-muted-foreground font-mono break-all">user: {w.user_id}</div>
          {w.destination && <div className="text-xs text-muted-foreground">to: {w.destination}</div>}
          <div className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString()}</div>
        </div>
        <Badge variant="outline" className="capitalize">{w.status}</Badge>
      </div>
      {canAct && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Payout reference (e.g. M-Pesa code)" className="glass" />
            <Button size="sm" disabled={busy || !ref.trim()} onClick={() => onApprove(ref)} className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
              <CheckCircle2 className="size-4 mr-1.5" /> Approve & mark paid
            </Button>
          </div>
          <div className="space-y-2">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Rejection reason" className="glass" />
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onReject(reason)} className="glass">
              <XCircle className="size-4 mr-1.5" /> Reject & refund
            </Button>
          </div>
        </div>
      )}
      {w.payout_ref && <div className="mt-2 text-xs text-muted-foreground">ref: <span className="font-mono">{w.payout_ref}</span></div>}
      {w.reviewer_notes && <div className="mt-2 text-xs text-muted-foreground">notes: {w.reviewer_notes}</div>}
    </div>
  );
}

/* ============ Config (rules + treasury) ============ */
function ConfigTab({ canEdit }: { canEdit: boolean }) {
  const qc = useQueryClient();
  const { data: rules } = useQuery({
    queryKey: ["aff-admin-wrules"],
    queryFn: async () => (await (supabase as any).from("withdrawal_rules").select("*").eq("id", 1).maybeSingle()).data,
  });
  const { data: treasury } = useQuery({
    queryKey: ["aff-admin-treasury"],
    queryFn: async () => (await (supabase as any).from("admin_treasury").select("*").eq("id", 1).maybeSingle()).data,
  });

  const [r, setR] = useState<any>(rules ?? null);
  const [t, setT] = useState<any>(treasury ?? null);
  if (rules && !r) setR(rules);
  if (treasury && !t) setT(treasury);

  const saveRules = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("withdrawal_rules").update({
        min_points: r.min_points, daily_limit_points: r.daily_limit_points,
        auto_approve: r.auto_approve, cooldown_minutes: r.cooldown_minutes,
      }).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Rules saved"); qc.invalidateQueries({ queryKey: ["aff-admin-wrules"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const saveTreasury = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("admin_treasury").update({ balance_cash_cents: t.balance_cash_cents }).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Treasury updated"); qc.invalidateQueries({ queryKey: ["aff-admin-treasury"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!r || !t) return <Sk />;
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="glass rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold">Withdrawal rules</h3>
        <Field label="Minimum points" value={r.min_points} onChange={(v) => setR({ ...r, min_points: +v })} disabled={!canEdit} />
        <Field label="Daily limit (pts)" value={r.daily_limit_points} onChange={(v) => setR({ ...r, daily_limit_points: +v })} disabled={!canEdit} />
        <Field label="Cooldown (min)" value={r.cooldown_minutes} onChange={(v) => setR({ ...r, cooldown_minutes: +v })} disabled={!canEdit} />
        <label className="flex items-center gap-2 text-sm">Auto-approve <Switch checked={r.auto_approve} onCheckedChange={(v) => setR({ ...r, auto_approve: v })} disabled={!canEdit} /></label>
        {canEdit && <Button onClick={() => saveRules.mutate()} disabled={saveRules.isPending}><Save className="size-4 mr-1.5" />Save rules</Button>}
      </div>
      <div className="glass rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold">Treasury (cash float)</h3>
        <div className="text-sm text-muted-foreground">Current balance: <span className="font-mono text-foreground">KES {(t.balance_cash_cents / 100).toFixed(2)}</span></div>
        <Field label="Balance (cents)" value={t.balance_cash_cents} onChange={(v) => setT({ ...t, balance_cash_cents: +v })} disabled={!canEdit} />
        <p className="text-xs text-muted-foreground">M-Pesa B2C is not yet wired — set this manually to reflect your funded float. Approving an M-Pesa withdrawal debits this balance and records the payout reference.</p>
        {canEdit && <Button onClick={() => saveTreasury.mutate()} disabled={saveTreasury.isPending}><Save className="size-4 mr-1.5" />Save treasury</Button>}
      </div>
    </div>
  );
}

/* ============ Leaderboard ============ */
function LeaderboardTab() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["aff-admin-board"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("affiliate_leaderboard_weekly");
      if (error) throw error;
      return data ?? [];
    },
  });
  if (isLoading) return <Sk />;
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-border/50">
        <h3 className="font-semibold flex items-center gap-2"><Trophy className="size-4 text-primary" /> Top affiliates — last 7 days</h3>
        <p className="text-xs text-muted-foreground mt-1">Admin/staff only. Affiliates do not see this view.</p>
      </div>
      {rows.length === 0 ? <Empty msg="No activity in the last 7 days." /> : (
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs text-muted-foreground">
            <tr><th className="px-4 py-2 text-left">#</th><th className="px-4 py-2 text-left">User</th><th className="px-4 py-2 text-right">Clicks</th><th className="px-4 py-2 text-right">Signups</th><th className="px-4 py-2 text-right">Purchases</th><th className="px-4 py-2 text-right">Points</th><th className="px-4 py-2 text-right">Revenue</th></tr>
          </thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr key={r.user_id} className="border-t border-border/30">
                <td className="px-4 py-2">{i + 1}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.user_id}</td>
                <td className="px-4 py-2 text-right">{r.clicks}</td>
                <td className="px-4 py-2 text-right">{r.signups}</td>
                <td className="px-4 py-2 text-right">{r.purchases}</td>
                <td className="px-4 py-2 text-right font-mono font-semibold">{r.points}</td>
                <td className="px-4 py-2 text-right">KES {(r.revenue_cents / 100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ============ helpers ============ */
function Sk() { return <div className="h-32 rounded-2xl bg-muted/30 animate-pulse" />; }
function Empty({ msg }: { msg: string }) { return <div className="glass rounded-2xl p-8 text-center text-muted-foreground">{msg}</div>; }
