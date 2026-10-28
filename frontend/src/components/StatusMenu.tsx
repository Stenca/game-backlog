import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { STATUSES, type Status } from "../types/Game";
import { getStatusColor } from "../utils/status";

type Props = {
  status: Status;
  onChange: (status: Status) => void | Promise<void>;
  direction?: "up" | "down";
  size?: "sm" | "md";
};

export default function StatusMenu({
  status,
  onChange,
  direction = "down",
  size = "md",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleSelect(newStatus: Status) {
    setOpen(false);
    await onChange(newStatus);
  }

  const buttonSize =
    size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-3 py-1.5 text-sm";
  const itemSize = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  const menuPosition =
    direction === "up"
      ? "bottom-full mb-1 left-0 origin-bottom"
      : "top-full mt-1 left-0 origin-top";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`cursor-pointer rounded font-medium uppercase tracking-wide text-black transition-opacity hover:opacity-60 ${buttonSize} ${getStatusColor(status)}`}
      >
        {status}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: direction === "up" ? 4 : -4,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: direction === "up" ? 4 : -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-10 overflow-hidden rounded border border-border bg-surface/90 backdrop-blur-md shadow-lg ${menuPosition}`}
          >
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleSelect(s)}
                className={`block w-full cursor-pointer text-left transition-colors hover:bg-surface-2 ${itemSize} ${
                  s === status ? "text-brand" : "text-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
