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
    body: "A new contributor opens a link and lands on the same Node, the same Python and the same env vars as everyone else. No version-matching call, no afternoon of brew archaeology.",
  },
  {
    k: "Review",
    title: "Their branch, not your laptop",
    body: "Open a second workspace on someone's pull request instead of stashing your own work to make room for it. Two containers, two terminals, one tab each.",
  },
  {
    k: "Ship",
    title: "A URL, not a repo",
    body: "Start the server and hand over the address. It works from a phone, from a webhook, and from someone who was never going to run npm install to look at your work.",
  },
  {
    k: "Offload",
    title: "Off the fans",
    body: "A long install, a hungry file watcher, a test suite that spins the laptop up to take off — it runs on the cluster, and your battery does not notice it happened.",
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

      <p className="mt-6 text-sm leading-relaxed text-ink-subtle">
        <span className="text-ink-muted">Not for:</span> GPUs, privileged
        containers, Docker-in-Docker, or anything you need still running after
        you close the tab. Workspaces are unprivileged pods with CPU and memory
        limits, and they are reclaimed when they go idle.
      </p>
    </Section>
  );
}
