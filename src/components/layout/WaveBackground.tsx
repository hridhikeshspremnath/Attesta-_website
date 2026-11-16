// src/components/layout/WaveBackground.tsx
// Attesta — slow indigo waves behind the whole app. Decorative only.
// Motion and layout live in globals.css (.waves, .wave, .wave-swell).

const W = 2880; // two 1440-unit periods, so a -50% slide loops seamlessly

/** Sine-like curve from x=0 to W through `y`, alternating crest and trough. */
function curve(y: number, amp: number, period: number, reverse = false): string {
  const half = period / 2;
  const segments: string[] = [];
  for (let i = 0; i < W / half; i++) {
    const x0 = i * half;
    const peak = y + (i % 2 ? amp : -amp);
    segments.push(reverse ? ` Q${x0 + half / 2} ${peak} ${x0} ${y}` : ` Q${x0 + half / 2} ${peak} ${x0 + half} ${y}`);
  }
  return reverse ? segments.reverse().join("") : segments.join("");
}

const line = (y: number, amp: number, period = 1440) => `M0 ${y}${curve(y, amp, period)}`;
/** Closed ribbon between the curve at `y` and the same curve `thick` lower. */
const band = (y: number, amp: number, thick: number, period = 1440) =>
  `M0 ${y}${curve(y, amp, period)} L${W} ${y + thick}${curve(y + thick, amp, period, true)} Z`;

type Layer = { drift: string; swell: string; blur: number; opacity: number; fill: string; edge?: string };

const LAYERS: Layer[] = [
  // back: wide, soft, slow
  { drift: "70s", swell: "11s", blur: 30, opacity: 0.9, fill: band(400, 200, 340) },
  // middle: the bright ribbon with a crisp leading edge
  { drift: "44s", swell: "8s", blur: 8, opacity: 1, fill: band(580, -140, 170), edge: line(580, -140) },
  // front: shorter ripples low on the page
  { drift: "28s", swell: "6s", blur: 3, opacity: 0.9, fill: band(760, 50, 110, 720), edge: line(760, 50, 720) },
];

export default function WaveBackground() {
  return (
    <div className="waves" aria-hidden>
      {LAYERS.map((l, i) => (
        <div key={i} className="wave-swell" style={{ animationDuration: l.swell }}>
          <div className="wave" style={{ animationDuration: l.drift, opacity: l.opacity }}>
            <svg viewBox={`0 0 ${W} 900`} preserveAspectRatio="none">
              <defs>
                <linearGradient id={`wave-fill-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#A9B6FF" stopOpacity="0.6" />
                  <stop offset="0.5" stopColor="#4F6BFF" stopOpacity="0.22" />
                  <stop offset="1" stopColor="#4F6BFF" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={l.fill} fill={`url(#wave-fill-${i})`} style={{ filter: `blur(${l.blur}px)` }} />
              {l.edge && <path d={l.edge} fill="none" stroke="#DCE2FF" strokeOpacity="0.75" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />}
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
