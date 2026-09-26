import { Section, HairlineGrid } from "./section";

/**
 * The one section on this page that is about the reader rather than the
 * machine.
 *
 * Every other section answers "what is it" or "how does it work". None of them
 * names a situation anybody is actually in, which left the page explaining a
 * product to someone who had not yet been given a reason to want one. These
 * four are the moments a container beats the laptop you are already sitting at.
 *
 * The "not for" note underneath is deliberate and is not a disclaimer. It is
 * lifted from `WHEN_NOT_TO_USE` in lib/agents.ts, which until now only machines
 * could read — and for this audience, a list of what a thing will not do buys
 * more trust than any number of claims about what it will.
 *
 * A server component; no new layout, it is `Section` + `HairlineGrid`.
 */

const MOMENTS = [
  {
    k: "Onboard",
    title: "Day one, not week one",
    body: "A new contributor opens a link and gets the same Node, the same Python, the same env vars as everyone else.",
  },
  {
    k: "Review",
    title: "Their branch, not your laptop",
    body: "Open a second workspace on someone's pull request instead of stashing your own work to make room.",
  },
  {
    k: "Ship",
    title: "A URL, not a repo",
    body: "Start the server, hand over the address. It works from a phone, and from a webhook.",
  },
  {
    k: "Offload",
    title: "Off the fans",
    body: "A long install or a hungry file watcher runs on the cluster. Your battery never notices.",
  },
];

export default function WhenYouReachForIt() {
  return (
    <Section
      id="why"
      n="03"
      eyebrow="Why bother"
      title={
        <>
          You already have an editor.{" "}
          <span className="text-ink-subtle">
            What you don&rsquo;t have is the machine.
          </span>
        </>
      }
      lead="Four times a container beats the laptop you are sitting at."
    >
      <HairlineGrid className="sm:grid-cols-2">
        {MOMENTS.map((m, i) => (
          <div key={m.k} className="flex flex-col bg-canvas p-6 sm:p-7">
            <span className="label flex items-center justify-between text-ink-subtle">
              <span>{m.k}</span>
              <span className="tabular-nums text-brand">0{i + 1}</span>
            </span>
            <h3 className="mt-8 font-display text-xl font-medium tracking-[-0.02em] text-ink">
              {m.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {m.body}
            </p>
          </div>
        ))}
      </HairlineGrid>

      <p className="mt-6 text-sm text-ink-subtle">
        <span className="text-ink-muted">Not for:</span> GPUs, privileged
        containers, or anything that has to outlive the tab.
      </p>
    </Section>
  );
}
