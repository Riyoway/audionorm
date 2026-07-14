// Brand-icon lookup for the service loudness targets, used by the marquee.
// Icons come from the Simple Icons CDN (SVGs are CC0; trademarks belong to their
// owners). We request every logo in one light gray so the row stays monochrome
// and on-theme, rather than a clash of brand colors.

const GRAY = "cfcfd6";

// audionorm preset id -> Simple Icons slug.
const SLUGS: Record<string, string> = {
  spotify: "spotify",
  "spotify-podcast": "spotify",
  "apple-music": "applemusic",
  "apple-podcasts": "applepodcasts",
  youtube: "youtube",
  // Amazon Music has no logo on the Simple Icons CDN, so it renders text-only.
  tidal: "tidal",
  deezer: "deezer",
  soundcloud: "soundcloud",
  tiktok: "tiktok",
  instagram: "instagram",
  facebook: "facebook",
  acx: "audible",
};

/** CDN icon URL for a service preset id, or undefined if it has no logo. */
export function iconUrlForService(id: string): string | undefined {
  const slug = SLUGS[id];
  return slug ? `https://cdn.simpleicons.org/${slug}/${GRAY}` : undefined;
}

/** Hide an <img> whose CDN slug does not resolve, so the row stays clean. */
export function hideBrokenIcon(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = "none";
}
