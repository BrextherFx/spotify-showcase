import {
  W,
  H,
  GRID_TOP,
  GRID_BOT,
  LBL_HR_Y,
  LBL_MN_Y,
  X1,
  hx,
  mx,
  nearest5,
  textPixels,
  tracePath,
} from "@/lib/ecg";

type Props = {
  hour24: number;
  minute: number;
  second: number;
  className?: string;
};

function Label({
  text,
  cx,
  y,
  highlighted,
}: {
  text: string;
  cx: number;
  y: number;
  highlighted?: boolean;
}) {
  const { on, tx, tw } = textPixels(text, cx, y);
  return (
    <g>
      {highlighted && (
        <rect
          x={Math.max(tx - 2, 0)}
          y={y - 1}
          width={tw + 4}
          height={11}
          className="fill-ecg-ink"
        />
      )}
      {on.map((p, i) => (
        <rect
          key={i}
          x={p.x}
          y={p.y}
          width={1}
          height={1}
          className={highlighted ? "fill-ecg-paper" : "fill-ecg-ink"}
        />
      ))}
    </g>
  );
}

export function EcgWatchface({ hour24, minute, second, className }: Props) {
  const h12 = hour24 % 12 || 12;
  const pm = hour24 >= 12;
  const near5 = nearest5(minute);

  const minorX = Array.from({ length: 61 }, (_, m) => mx(m));
  const majorX = Array.from({ length: 13 }, (_, i) => mx(i * 5));
  const rowsY: number[] = [];
  for (let y = GRID_TOP; y <= GRID_BOT; y += 20) rowsY.push(y);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      shapeRendering="geometricPrecision"
      role="img"
      aria-label={`ECG watchface showing ${h12}:${String(minute).padStart(2, "0")} ${pm ? "PM" : "AM"}`}
    >
      <rect x={0} y={0} width={W} height={H} className="fill-ecg-paper" />

      {/* ECG paper grid */}
      <g className="stroke-ecg-grid">
        {minorX.map((x, i) => (
          <line
            key={`n${i}`}
            x1={x + 0.5}
            y1={GRID_TOP}
            x2={x + 0.5}
            y2={GRID_BOT}
            strokeWidth={0.4}
            strokeDasharray="1 3"
          />
        ))}
        {majorX.map((x, i) => (
          <line
            key={`m${i}`}
            x1={x + 0.5}
            y1={GRID_TOP}
            x2={x + 0.5}
            y2={GRID_BOT}
            strokeWidth={0.6}
            strokeDasharray="1 1"
          />
        ))}
        {rowsY.map((y, i) => (
          <line
            key={`r${i}`}
            x1={0}
            y1={y + 0.5}
            x2={W}
            y2={y + 0.5}
            strokeWidth={0.6}
            strokeDasharray="1 1"
          />
        ))}
      </g>

      {/* Traces: hour spikes up, minute spikes down */}
      <g
        fill="none"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-ecg-trace"
      >
        <path d={tracePath(hx(h12), -1)} className="ecg-glow" />
        <path d={tracePath(mx(minute), 1)} className="ecg-glow" />
      </g>

      {/* Animated second ECG line */}
      <g
        fill="none"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-ecg-trace opacity-50"
      >
        <path d={tracePath(7 + (second / 60) * 235, 1)} className="ecg-glow" />
      </g>

      {/* Hour labels */}
      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
        <Label key={h} text={String(h)} cx={hx(h)} y={LBL_HR_Y} highlighted={h === h12} />
      ))}

      {/* Minute labels */}
      {Array.from({ length: 13 }, (_, i) => i * 5).map((m) => (
        <Label key={m} text={String(m)} cx={mx(m)} y={LBL_MN_Y} highlighted={m === near5} />
      ))}

      {/* AM/PM */}
      <Label text={pm ? "PM" : "AM"} cx={X1 - 8 + 8} y={LBL_HR_Y} />
    </svg>
  );
}
