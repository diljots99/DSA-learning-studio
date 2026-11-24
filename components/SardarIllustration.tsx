/**
 * A cheerful Sardar ji in a kesari dastar, waving the Indian national flag.
 * Hand-drawn marker style to match the chapters. The flag follows the Flag Code of India:
 * saffron on top, white with a navy-blue 24-spoke Ashoka Chakra, green at the bottom.
 */
const SAFFRON = "#FF9933";
const GREEN = "#138808";
const NAVY = "#000080";
const INK = "#1f2937";
const SKIN = "#f1c19a";
const BEARD = "#3b2a20";

/** One wavy band of the flag, from the pole (x=150) to the fly end (x=208), 12 units tall. */
const band = (y: number) =>
  `M150,${y} C162,${y - 6} 174,${y + 6} 186,${y} C194,${y - 4} 201,${y - 3} 208,${y} L208,${y + 12} C201,${y + 9} 194,${y + 8} 186,${y + 12} C174,${y + 18} 162,${y + 6} 150,${y + 12} Z`;

export default function SardarIllustration({ className }: { className?: string }) {
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const a = (i * Math.PI) / 12;
    return <line key={i} x1={178} y1={36} x2={178 + 4.6 * Math.cos(a)} y2={36 + 4.6 * Math.sin(a)} stroke={NAVY} strokeWidth={0.45} />;
  });

  return (
    <svg className={className} viewBox="0 0 220 210" role="img" aria-label="Illustration: a smiling Sikh man in an orange turban waving the Indian flag">
      <style>{`
        .sj-wave { transform-origin: 150px 120px; animation: sj-wave 2.4s ease-in-out infinite; }
        .sj-flag { transform-origin: 150px 30px; animation: sj-flag 1.2s ease-in-out infinite alternate; }
        @keyframes sj-wave { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(4deg); } }
        @keyframes sj-flag { from { transform: skewY(-3deg) scaleX(.97); } to { transform: skewY(3deg) scaleX(1.02); } }
        @media (prefers-reduced-motion: reduce) { .sj-wave, .sj-flag { animation: none; } }
      `}</style>

      {/* speech bubble */}
      <g>
        <path d="M8,14 Q8,6 16,6 L84,6 Q92,6 92,14 L92,34 Q92,42 84,42 L44,42 L34,52 L36,42 L16,42 Q8,42 8,34 Z" fill="#fff" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        <text x="50" y="29" textAnchor="middle" fontFamily="Caveat, cursive" fontWeight="700" fontSize="17" fill={INK}>
          Sat Sri Akal!
        </text>
      </g>

      {/* body: kurta */}
      <path d="M58,210 C58,172 78,156 104,156 C130,156 150,172 150,210 Z" fill="#dbeafe" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M104,158 L104,188" stroke="#2563eb" strokeWidth={2} strokeLinecap="round" />
      <circle cx="104" cy="170" r="1.8" fill="#2563eb" />
      <circle cx="104" cy="180" r="1.8" fill="#2563eb" />
      {/* resting arm */}
      <path d="M66,176 C56,186 54,198 58,210" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />

      {/* waving arm + flag */}
      <g className="sj-wave">
        <path d="M134,170 C142,152 148,134 150,122 L162,124 C160,140 152,160 144,178 Z" fill="#dbeafe" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
        {/* flag pole */}
        <line x1="153" y1="122" x2="150" y2="16" stroke="#8b5a2b" strokeWidth={3.4} strokeLinecap="round" />
        <circle cx="150" cy="14" r="3" fill="#d4a017" stroke={INK} strokeWidth={1.2} />
        {/* the tiranga */}
        <g className="sj-flag">
          <path d={band(18)} fill={SAFFRON} />
          <path d={band(30)} fill="#ffffff" />
          <path d={band(42)} fill={GREEN} />
          <path d={`M150,18 C162,12 174,24 186,18 C194,14 201,15 208,18 L208,54 C201,51 194,50 186,54 C174,60 162,48 150,54 Z`} fill="none" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
          <circle cx="178" cy="36" r="4.8" fill="none" stroke={NAVY} strokeWidth={0.9} />
          {spokes}
          <circle cx="178" cy="36" r="0.9" fill={NAVY} />
        </g>
        {/* hand and kara (steel bracelet) */}
        <circle cx="155" cy="120" r="8.5" fill={SKIN} stroke={INK} strokeWidth={2} />
        <ellipse cx="156" cy="130" rx="7" ry="2.6" fill="none" stroke="#94a3b8" strokeWidth={2.6} />
      </g>

      {/* ears */}
      <ellipse cx="70" cy="104" rx="5" ry="7" fill={SKIN} stroke={INK} strokeWidth={2} />
      <ellipse cx="138" cy="104" rx="5" ry="7" fill={SKIN} stroke={INK} strokeWidth={2} />
      {/* face */}
      <circle cx="104" cy="102" r="34" fill={SKIN} stroke={INK} strokeWidth={2.4} />
      {/* beard */}
      <path d="M72,108 C72,144 90,158 104,158 C118,158 136,144 136,108 C130,122 120,128 104,128 C88,128 78,122 72,108 Z" fill={BEARD} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      {/* happy smile inside the beard */}
      <path d="M93,132 Q104,146 115,132 Q104,137 93,132 Z" fill="#fff" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      {/* moustache */}
      <path d="M88,124 C95,117 101,119 104,123 C107,119 113,117 120,124 C113,128 108,127 104,125 C100,127 95,128 88,124 Z" fill={BEARD} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
      {/* nose */}
      <path d="M103,108 Q108,116 101,117" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
      {/* closed happy eyes, eyebrows, rosy cheeks */}
      <path d="M86,102 Q92,95 98,102" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M110,102 Q116,95 122,102" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M85,92 Q92,88 99,91" fill="none" stroke={BEARD} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M109,91 Q116,88 123,92" fill="none" stroke={BEARD} strokeWidth={2.4} strokeLinecap="round" />
      <circle cx="84" cy="112" r="5" fill="#f87171" opacity={0.35} />
      <circle cx="124" cy="112" r="5" fill="#f87171" opacity={0.35} />

      {/* kesari dastar (turban) with its pointed front fold */}
      <path d="M68,94 C64,62 84,46 104,46 C126,46 146,60 140,94 C128,84 114,80 104,88 C94,80 80,84 68,94 Z" fill="#f97316" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M76,82 C88,66 120,66 132,82" fill="none" stroke="#c2410c" strokeWidth={2} strokeLinecap="round" />
      <path d="M82,70 C94,58 116,58 126,70" fill="none" stroke="#c2410c" strokeWidth={2} strokeLinecap="round" />
      <path d="M104,88 L104,58" stroke="#c2410c" strokeWidth={1.6} strokeLinecap="round" opacity={0.7} />
    </svg>
  );
}
