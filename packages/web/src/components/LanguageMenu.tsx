import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import { useI18n, availableLocales } from "../i18n";

export function LanguageMenu() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const locales = availableLocales();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="lang" ref={ref}>
      <button
        className="icon-link"
        aria-label={t("lang.label")}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Globe size={18} />
      </button>
      {open && (
        <ul className="select-menu lang-menu" role="listbox" aria-label={t("lang.label")}>
          {locales.map((l) => (
            <li
              key={l.code}
              role="option"
              aria-selected={l.code === lang}
              className={"select-option" + (l.code === lang ? " selected" : "")}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
            >
              <span>{l.label}</span>
              {l.code === lang && <Check size={16} className="select-check" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
