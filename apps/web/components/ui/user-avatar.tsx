"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A user's picture, or a generated one when there isn't a real picture.
 *
 * ## Why this exists
 *
 * Only GitHub sign-ins carry a photograph. A magic-link account has none, so
 * `apps/core/services/auth/magiclink.go` fills the field by picking one of
 * eight hardcoded imgur URLs — *at random, on every login*, so even when it
 * worked your face changed each time you signed in. All eight have since been
 * deleted.
 *
 * The detail that matters: imgur answers a deleted image with **HTTP 200 and a
 * 503-byte "this image was removed" placeholder**, not a 404. The browser
 * loads it successfully, `onError` never fires, and no amount of error
 * handling would have caught it — which is why the account menu was showing a
 * grey slab of imgur's apology text. Checked against all eight URLs; all eight
 * behave this way.
 *
 * So the fix is not "handle the failure", it is "do not trust the field". A
 * photograph in this system can only have come from GitHub, so that is the
 * only host rendered as one. `onError` stays as a second line of defence for
 * the day a GitHub URL genuinely 404s.
 *
 * The backend still writes the bad field — it is out of scope for this pass.
 * This makes it harmless rather than removing it.
 *
 * ## The orb
 *
 * Deterministic: the same person gets the same orb forever, on every device,
 * with no storage and no network. Three soft radial gradients over a base
 * colour, every position derived from a hash of the account name — the
 * drifting-fluid look, minus the WebGL. At the 20–32px these render at, a
 * shader would be indistinguishable and would cost a GL context per avatar on
 * a page that already runs one for its backdrop.
 *
 * Hues run the whole wheel, but lightness and chroma are pinned because the
 * colours are stated in `oklch`. No user's orb is louder than another's, and
 * none of them can out-shout the amber accent — the one colour on this site
 * that is allowed to mean something.
 */

/** Only these hosts ever serve a real photograph. See the doc comment. */
const PHOTO_HOSTS = [
  "https://avatars.githubusercontent.com/",
  "https://github.com/",
];

function isPhotoUrl(url: string | undefined): url is string {
  if (!url) return false;
  return PHOTO_HOSTS.some((host) => url.startsWith(host));
}

/**
 * FNV-1a. Small, stable, and identical on the server and the client — which a
 * hash used for rendering must be, or the markup mismatches on hydration.
 */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

interface AvatarUser {
  login?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
}

/** Whatever keeps one person's orb stable across sessions. */
function identityOf(user: AvatarUser): string {
  return user.login || user.email || user.name || "anonymous";
}

function initialOf(user: AvatarUser): string {
  const source = user.name || user.login || user.email || "";
  const letter = source.trim().match(/[a-z0-9]/i);
  return letter ? letter[0].toUpperCase() : "?";
}

/** The three blobs and the ground they sit on, all from one seed. */
function orbStyle(seed: number): React.CSSProperties {
  const hue = seed % 360;
  // Spread the blobs around the face without letting any of them land dead
  // centre, which is what would make it read as a target rather than as fluid.
  const x1 = 22 + ((seed >> 3) % 26);
  const y1 = 12 + ((seed >> 7) % 22);
  const x2 = 58 + ((seed >> 11) % 30);
  const y2 = 30 + ((seed >> 13) % 34);
  const x3 = 18 + ((seed >> 17) % 60);
  const y3 = 72 + ((seed >> 19) % 24);

  return {
    backgroundColor: `oklch(0.46 0.13 ${hue})`,
    backgroundImage: [
      `radial-gradient(58% 58% at ${x1}% ${y1}%, oklch(0.86 0.14 ${(hue + 340) % 360}) 0%, transparent 64%)`,
      `radial-gradient(56% 56% at ${x2}% ${y2}%, oklch(0.63 0.18 ${(hue + 26) % 360}) 0%, transparent 62%)`,
      `radial-gradient(70% 70% at ${x3}% ${y3}%, oklch(0.34 0.12 ${(hue + 62) % 360}) 0%, transparent 72%)`,
    ].join(", "),
  };
}

export function UserAvatar({
  user,
  size,
  className,
}: {
  user: AvatarUser;
  /** Rendered size in px. Drives the initial's type size too. */
  size: number;
  className?: string;
}) {
  const [broken, setBroken] = React.useState(false);
  const box = { width: size, height: size } as const;

  if (isPhotoUrl(user.avatar_url) && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatar_url}
        alt=""
        width={size}
        height={size}
        onError={() => setBroken(true)}
        style={box}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        ...box,
        ...orbStyle(hash(identityOf(user))),
        // A hairline of light along the rim. Without it the orb sits flat
        // against a dark bar; with it, it reads as a sphere.
        boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.14)",
        fontSize: Math.round(size * 0.42),
        lineHeight: `${size}px`,
      }}
      className={cn(
        "inline-block shrink-0 select-none rounded-full text-center",
        "font-medium text-white/85",
        className,
      )}
    >
      {initialOf(user)}
    </span>
  );
}
