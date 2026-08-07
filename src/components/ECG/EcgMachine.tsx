import { EcgWatchface } from "./EcgWatchface";

type Props = {
  hour24: number;
  minute: number;
  second: number;
  bpm: number;
};

function Readout({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-md border border-case-edge/70 bg-case-edge/20 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.2em] text-case-foreground/50">{label}</div>
      <div className="mt-0.5 font-mono text-lg leading-none text-ecg-trace">
        {value}
        {unit && (
          <span className="ml-1 text-[10px] text-case-foreground/50">{unit}</span>
        )}
      </div>
    </div>
  );
}

export function EcgMachine({ hour24, minute, second, bpm }: Props) {
  const h12 = hour24 % 12 || 12;
  const pm = hour24 >= 12;
  const clock = `${String(h12).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;

  return (
    <div
      className="w-full max-w-3xl rounded-[22px] border border-case-edge bg-case p-5 sm:p-7"
      style={{ boxShadow: "var(--shadow-case)" }}
    >
      {/* Top bar */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="ecg-blip block h-2.5 w-2.5 rounded-full bg-ecg-trace" />
          <span className="font-mono text-xs uppercase tracking-[0.32em] text-case-foreground/70">
            PicoWatch ECG
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-case-foreground/40">
          Lead II · 25 mm/s · 10 mm/mV
        </span>
      </div>

      {/* Screen */}
      <div className="relative overflow-hidden rounded-lg border-4 border-case-edge bg-ecg-paper">
        <EcgWatchface hour24={hour24} minute={minute} second={second} className="block w-full" />
        <div
          aria-hidden
          className="ecg-sweep pointer-events-none absolute inset-y-0 left-0 w-1/5"
          style={{
            background:
              "linear-gradient(90deg, transparent, color-mix(in oklab, var(--ecg-trace) 14%, transparent), transparent)",
          }}
        />
      </div>

      {/* Readouts */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Readout label="Time" value={clock} unit={pm ? "PM" : "AM"} />
        <Readout label="Hour peak" value={String(h12)} unit="hr" />
        <Readout label="Min peak" value={String(minute).padStart(2, "0")} unit="min" />
        <Readout label="Rate" value={String(bpm)} unit="bpm" />
      </div>

      {/* Controls */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-case-edge/60 pt-4">
        <div className="flex gap-2">
          {["LEAD", "GAIN", "FILT", "PRINT"].map((k) => (
            <span
              key={k}
              className="rounded border border-case-edge/70 px-2.5 py-1 font-mono text-[10px] tracking-widest text-case-foreground/55"
            >
              {k}
            </span>
          ))}
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="h-6 w-1.5 rounded-full bg-case-edge/80" />
          ))}
        </div>
      </div>
    </div>
  );
}
