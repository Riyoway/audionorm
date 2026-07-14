import { PRESETS } from "@audio-normalizer/core";
import { iconUrlForService, hideBrokenIcon } from "../lib/serviceIcons";

// Two rows of service chips scrolling in opposite directions. Decorative.
interface Chip {
  label: string;
  icon?: string;
}

// Service presets that have a brand logo, shown as short platform names.
const CHIPS: Chip[] = PRESETS.map((p) => ({
  id: p.id,
  label: p.label.replace(/\s*\(.*\)\s*$/, ""),
  icon: iconUrlForService(p.id),
}))
  .filter((c) => c.icon)
  .map(({ label, icon }) => ({ label, icon }));

const HALF = Math.ceil(CHIPS.length / 2);
const ROW_A = CHIPS.slice(0, HALF);
const ROW_B = CHIPS.slice(HALF);

function ChipEl({ label, icon }: Chip) {
  return (
    <span className="chip">
      {icon && (
        <img
          className="chip-icon"
          src={icon}
          alt=""
          width={15}
          height={15}
          decoding="async"
          onError={hideBrokenIcon}
        />
      )}
      {label}
    </span>
  );
}

function Row({ items, reverse }: { items: Chip[]; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className={`marquee${reverse ? " reverse" : ""}`}>
      <div className="marquee-track">
        {doubled.map((c, i) => (
          <ChipEl key={i} {...c} />
        ))}
      </div>
    </div>
  );
}

export function ServiceMarquee() {
  return (
    <div className="marquee-wrap" aria-hidden="true">
      <Row items={ROW_A} />
      <Row items={ROW_B} reverse />
    </div>
  );
}
