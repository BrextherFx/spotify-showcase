import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Home, Loader2 } from "lucide-react";

const order = {
  item: "Pro plan",
  detail: "Annual subscription",
  subtotal: "£192.00",
  tax: "£38.40",
  total: "£230.40",
  id: "ORD-2048",
  card: "Visa •••• 4242",
  date: "11 AUG 2026 · 14:32",
};

type Status = "idle" | "printing" | "done";

const barcode = [
  3, 1, 1, 2, 1, 3, 2, 1, 1, 1, 3, 2, 1, 2, 1, 1, 3, 1, 2, 3, 1, 1, 2, 1, 1, 3,
  2, 1, 3, 1, 1, 2, 1, 1, 2, 3, 1, 2, 1, 3,
];

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span
        className={
          strong
            ? "text-[11px] font-semibold tracking-[0.16em] text-ink uppercase"
            : "text-[11px] tracking-[0.08em] text-ink-soft"
        }
      >
        {label}
      </span>
      <span
        className={
          strong
            ? "text-lg font-semibold tracking-tight text-ink"
            : "text-[11px] tracking-[0.04em] text-ink-soft"
        }
      >
        {value}
      </span>
    </div>
  );
}

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 302 306" aria-hidden className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(45.3, 45.9) scale(0.72)">
        <path d="M228.734 0.953571C233.2 0.953571 234.595 7.06103 230.726 9.29154C-11.4027 148.876 23.4251 303.998 21.9667 304.666C20.4792 305.347 -23.4252 216.314 30.3316 121.152C71.3371 48.563 119.758 0.953571 119.758 0.953571C119.758 0.953571 190.027 0.953571 228.734 0.953571Z" fill="currentColor"/>
        <path d="M114.889 195.52C58.1093 191.793 21.9176 305.596 18.7499 304.297C15.5822 302.998 37.1803 158.152 139.362 130.213C142.264 129.42 223.849 101.236 275.438 204.575C284.818 223.365 286.681 235.203 292.08 255.288C296.044 270.035 300.143 291.323 301.927 300.943C302.416 303.582 300.387 306 297.703 306H198.633C196.607 306 194.862 304.65 194.369 302.685C189.839 284.632 165.682 198.853 114.889 195.52Z" fill="currentColor"/>
        <path d="M21.2793 287.893C22.3358 288.344 20.7502 301.42 19.4452 301.42C18.1403 301.42 15.901 294.355 15.901 293.209C18.6381 279.326 18.6379 290.148 19.1663 290.598C19.3314 290.739 20.2228 292.402 21.2793 287.893Z" fill="currentColor"/>
        <path d="M0 4.31587C0 1.93228 1.93217 0 4.31562 0H86.3123C86.3123 0 60.5445 32.9778 45.314 55.0273C30.8889 75.9109 12.1459 106.927 4.03404 120.52C2.90725 122.408 0 121.588 0 119.389V4.31587Z" fill="currentColor"/>
      </g>
    </svg>
  );
}

export function ReceiptPrinter() {
  const [status, setStatus] = useState<Status>("idle");

  const printing = status === "printing";

  return (
    <div className="flex w-full flex-col items-center">
      {/* Printer body */}
      <motion.div
        animate={
          printing
            ? { y: [0, -0.6, 0.6, 0], rotate: [0, -0.12, 0.12, 0] }
            : { y: 0, rotate: 0 }
        }
        transition={
          printing
            ? { duration: 0.24, repeat: Infinity, ease: "linear" }
            : { duration: 0.4 }
        }
        className="printer-shell relative z-20 w-full max-w-[420px] rounded-3xl bg-shell p-3"
      >
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-shell-foreground">
            <Mark className="size-4" />
          </span>
          <button
            type="button"
            className="accent-interactive flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium text-shell-foreground"
          >
            <Home className="size-3.5" />
            Home
          </button>
        </div>

        <div className="rounded-2xl bg-screen p-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-lg font-semibold tracking-tight text-screen-text">
                {order.item}
              </p>
              <p className="text-sm text-screen-text-muted">{order.detail}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-screen-text-muted">Total</p>
              <p className="text-xl font-semibold tracking-tight text-screen-text">
                {order.total}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <AnimatePresence mode="wait" initial={false}>
              {status === "idle" ? (
                <motion.button
                  key="pay"
                  type="button"
                  onClick={() => {
                    setStatus("printing");
                    window.setTimeout(() => setStatus("done"), 2400);
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Pay {order.total}
                </motion.button>
              ) : (
                <motion.div
                  key="state"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 text-sm"
                >
                  {printing ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-screen-text-muted" />
                      <span className="text-screen-text-muted">
                        Printing receipt…
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="flex size-4 items-center justify-center rounded-full bg-success">
                        <Check className="size-2.5 text-primary-foreground" strokeWidth={4} />
                      </span>
                      <span className="text-screen-text">Order complete</span>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Paper slot */}
        <div className="mx-4 mt-3 h-2 rounded-full bg-slot shadow-[inset_0_1px_2px_oklch(0_0_0/60%)]" />
      </motion.div>

      {/* Receipt */}
      <div className="relative z-10 -mt-2 w-full max-w-[340px]">
        <AnimatePresence>
          {status !== "idle" && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 2.8, ease: [0.22, 0.9, 0.24, 1] }}
              className="overflow-hidden"
            >
              <div className="paper-shadow bg-paper px-7 pt-9 pb-6 font-mono">
                <div className="flex justify-center">
                  <span className="flex size-11 items-center justify-center bg-ink text-paper">
                    <Mark className="size-6" />
                  </span>
                </div>

                <div className="my-6 border-t border-dashed border-ink-soft/40" />

                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.18em] text-ink uppercase">
                      {order.item}
                    </p>
                    <p className="mt-1 text-[11px] tracking-[0.04em] text-ink-soft">
                      {order.detail}
                    </p>
                  </div>
                  <p className="text-[11px] tracking-[0.04em] text-ink">
                    {order.subtotal}
                  </p>
                </div>

                <div className="my-6 border-t border-dashed border-ink-soft/40" />

                <div className="space-y-2">
                  <Row label="Subtotal" value={order.subtotal} />
                  <Row label="Tax" value={order.tax} />
                </div>

                <div className="mt-5">
                  <Row label="Total paid" value={order.total} strong />
                </div>

                <div className="my-6 border-t border-dashed border-ink-soft/40" />

                <div className="space-y-2">
                  <Row label="Order" value={order.id} />
                  <Row label="Paid with" value={order.card} />
                  <Row label="Date" value={order.date} />
                </div>

                <div className="mt-8 flex h-11 items-end justify-center gap-[2px]">
                  {barcode.map((w, i) => (
                    <span
                      key={i}
                      className="h-full bg-ink"
                      style={{ width: w }}
                    />
                  ))}
                </div>
                <p className="mt-3 text-center text-[10px] tracking-[0.3em] text-ink-soft">
                  THANK YOU
                </p>
              </div>
              <div className="torn-edge" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {status === "done" && (
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setStatus("idle")}
          className="mt-8 text-xs tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:text-foreground"
        >
          Tear off · reset
        </motion.button>
      )}
    </div>
  );
}
