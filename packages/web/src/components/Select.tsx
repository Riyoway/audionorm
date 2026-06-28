import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  id?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
}

export function Select({ id, value, options, onChange, ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];

  const close = useCallback(() => setOpen(false), []);

  const openMenu = useCallback(() => {
    setHighlight(selectedIndex);
    setOpen(true);
  }, [selectedIndex]);

  const choose = useCallback(
    (index: number) => {
      const opt = options[index];
      if (opt) onChange(opt.value);
      setOpen(false);
    },
    [options, onChange],
  );

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  // Keep the highlighted option in view.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [open, highlight]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        if (open) choose(highlight);
        else openMenu();
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!open) openMenu();
        else setHighlight((h) => Math.min(options.length - 1, h + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openMenu();
        else setHighlight((h) => Math.max(0, h - 1));
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setHighlight(0);
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setHighlight(options.length - 1);
        }
        break;
      case "Escape":
        close();
        break;
      case "Tab":
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
        aria-label={ariaLabel}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKeyDown}
      >
        <span className="select-value">{selected?.label}</span>
        <ChevronDown size={18} className="select-chevron" />
      </button>

      {open && (
        <ul className="select-menu" role="listbox" ref={listRef} tabIndex={-1}>
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                className={
                  "select-option" +
                  (i === highlight ? " active" : "") +
                  (isSelected ? " selected" : "")
                }
                onMouseEnter={() => setHighlight(i)}
                onClick={() => choose(i)}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={16} className="select-check" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
