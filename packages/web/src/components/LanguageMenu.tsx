import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import { useI18n, availableLocales } from "../i18n";

export function LanguageMenu() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const locales = availableLocales();

  const openMenu = () => {
    setHighlight(Math.max(0, locales.findIndex((l) => l.code === lang)));
    setOpen(true);
  };

  const close = (refocus = false) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  };

  const pick = (code: string) => {
    setLang(code);
    close(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    listRef.current?.focus();
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const onListKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlight((h) => Math.min(locales.length - 1, h + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlight((h) => Math.max(0, h - 1));
        break;
      case "Home":
        e.preventDefault();
        setHighlight(0);
        break;
      case "End":
        e.preventDefault();
        setHighlight(locales.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        pick(locales[highlight].code);
        break;
      case "Escape":
      case "Tab":
        e.preventDefault();
        close(true);
        break;
    }
  };

  return (
    <div className="lang" ref={rootRef}>
      <button
        ref={btnRef}
        className="icon-link"
        aria-label={t("lang.label")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="lang-listbox"
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            openMenu();
          }
        }}
      >
        <Globe size={18} />
      </button>
      {open && (
        <div className="select-menu lang-menu">
          <ul
            id="lang-listbox"
            className="select-list"
            role="listbox"
            aria-label={t("lang.label")}
            tabIndex={-1}
            ref={listRef}
            aria-activedescendant={`lang-opt-${highlight}`}
            onKeyDown={onListKeyDown}
          >
            {locales.map((l, i) => (
              <li
                key={l.code}
                id={`lang-opt-${i}`}
                role="option"
                aria-selected={l.code === lang}
                className={
                  "select-option" +
                  (i === highlight ? " active" : "") +
                  (l.code === lang ? " selected" : "")
                }
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(l.code)}
              >
                <span>{l.label}</span>
                {l.code === lang && <Check size={16} className="select-check" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
