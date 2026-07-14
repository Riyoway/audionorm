import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { useI18n } from "../i18n";

export interface SelectOption {
  value: string;
  label: string;
  /** Optional group header shown above the first option of each group. */
  group?: string;
  /** Optional leading icon URL. */
  icon?: string;
}

function hideBrokenIcon(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = "none";
}

interface Props {
  id?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  /** Show a search box that filters options (for long lists). */
  searchable?: boolean;
}

export function Select({ id, value, options, onChange, ariaLabel, searchable }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = id ? `${id}-listbox` : "select-listbox";
  const activeId = open ? `${listId}-opt-${highlight}` : undefined;

  const visible = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || (o.group ?? "").toLowerCase().includes(q),
    );
  }, [options, query, searchable]);

  const selected = options.find((o) => o.value === value);

  const close = useCallback(() => setOpen(false), []);

  const openMenu = useCallback(() => {
    setQuery("");
    setHighlight(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }, [options, value]);

  const choose = useCallback(
    (index: number) => {
      const opt = visible[index];
      if (opt) onChange(opt.value);
      setOpen(false);
    },
    [visible, onChange],
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(
      `[data-index="${highlight}"]`,
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [open, highlight]);

  const triggerKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        if (open && !searchable) choose(highlight);
        else openMenu();
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!open) openMenu();
        else if (!searchable) setHighlight((h) => Math.min(visible.length - 1, h + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openMenu();
        else if (!searchable) setHighlight((h) => Math.max(0, h - 1));
        break;
      case "Home":
        if (open && !searchable) {
          e.preventDefault();
          setHighlight(0);
        }
        break;
      case "End":
        if (open && !searchable) {
          e.preventDefault();
          setHighlight(visible.length - 1);
        }
        break;
      case "Escape":
      case "Tab":
        close();
        break;
    }
  };

  const searchKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        choose(highlight);
        break;
      case "ArrowDown":
        e.preventDefault();
        setHighlight((h) => Math.min(visible.length - 1, h + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlight((h) => Math.max(0, h - 1));
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
    }
  };

  return (
    <div className={`select${open ? " open" : ""}`} ref={rootRef}>
      <button
        id={id}
        type="button"
        className="select-trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && !searchable ? activeId : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={triggerKeyDown}
      >
        <span className="select-value">
          {selected?.icon && (
            <img
              className="select-icon"
              src={selected.icon}
              alt=""
              width={16}
              height={16}
              onError={hideBrokenIcon}
            />
          )}
          <span className="select-value-text">{selected?.label}</span>
        </span>
        <ChevronDown size={18} className="select-chevron" />
      </button>

      {open && (
        <div className="select-menu">
          {searchable && (
            <div className="select-search">
              <Search size={15} />
              <input
                ref={searchRef}
                type="text"
                role="combobox"
                aria-expanded={open}
                aria-controls={listId}
                aria-activedescendant={activeId}
                value={query}
                placeholder={t("search.placeholder")}
                aria-label={t("search.placeholder")}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
                onKeyDown={searchKeyDown}
              />
            </div>
          )}
          <ul className="select-list" id={listId} role="listbox" ref={listRef} tabIndex={-1}>
            {visible.length === 0 && <li className="select-empty">{t("select.empty")}</li>}
            {visible.map((opt, i) => {
              const isSelected = opt.value === value;
              const showGroup = opt.group && opt.group !== visible[i - 1]?.group;
              return (
                <Fragment key={opt.value}>
                  {showGroup && (
                    <li className="select-group" role="presentation" aria-hidden="true">
                      {opt.group}
                    </li>
                  )}
                  <li
                    role="option"
                    id={`${listId}-opt-${i}`}
                    data-index={i}
                    aria-selected={isSelected}
                    className={
                      "select-option" +
                      (i === highlight ? " active" : "") +
                      (isSelected ? " selected" : "")
                    }
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => choose(i)}
                  >
                    <span className="select-optlabel">
                      {opt.icon && (
                        <img
                          className="select-icon"
                          src={opt.icon}
                          alt=""
                          width={16}
                          height={16}
                          onError={hideBrokenIcon}
                        />
                      )}
                      {opt.label}
                    </span>
                    {isSelected && <Check size={16} className="select-check" />}
                  </li>
                </Fragment>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
