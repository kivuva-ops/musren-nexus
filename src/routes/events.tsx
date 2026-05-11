import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/site/StubPage";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Trainings & Events — Musren" },
      { name: "description", content: "Webinars, trainings, workshops and partner events from Musren." },
      { property: "og:title", content: "Trainings & Events — Musren" },
      { property: "og:description", content: "Learn, connect, build with Musren." },
    ],
  }),
  component: () => (
    <StubPage
      eyebrow="Trainings & Events"
      title={<>Learn, connect, <span className="text-gradient">build with Musren</span></>}
      description="Hands-on developer trainings, partner workshops and customer engagement webinars across the year."
      bullets={[
        "Quarterly developer bootcamps.",
        "Partner & affiliate workshops.",
        "Industry roundtables.",
        "On-demand webinars.",
        "Annual Musren Summit.",
        "Local meetups across Africa.",
      ]}
      ctaLabel="See upcoming events"
    />
  ),
});
