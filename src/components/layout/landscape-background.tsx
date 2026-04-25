import { useTheme } from '@/contexts/theme-context'

function LightSvg() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1100 720"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <linearGradient id="skyP" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8eef5" />
          <stop offset="100%" stopColor="#f0f8fc" />
        </linearGradient>
      </defs>
      <rect width="1100" height="720" fill="url(#skyP)" />
      <ellipse cx="900" cy="100" rx="300" ry="150" fill="#76c1d4" opacity=".2" />
      <path
        d="M0 420 Q180 340 360 390 Q540 440 700 360 Q860 280 1100 330 L1100 720 L0 720Z"
        fill="#09868b"
        opacity=".15"
      />
      <path
        d="M0 500 Q250 440 500 480 Q750 520 1000 460 L1100 720 L0 720Z"
        fill="#3d7c47"
        opacity=".2"
      />
      <path
        d="M0 590 Q200 550 450 580 Q700 610 950 560 L1100 720 L0 720Z"
        fill="#3d7c47"
        opacity=".3"
      />
      <path
        d="M0 660 Q350 630 700 650 Q950 665 1100 640 L1100 720 L0 720Z"
        fill="#3d7c47"
        opacity=".45"
      />
    </svg>
  )
}

function DarkSvg() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1100 720"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <linearGradient id="skyPD" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1a1c" />
          <stop offset="100%" stopColor="#0f2830" />
        </linearGradient>
      </defs>
      <rect width="1100" height="720" fill="url(#skyPD)" />
      <ellipse cx="880" cy="90" rx="280" ry="120" fill="#76c1d4" opacity=".08" />
      <path
        d="M0 400 Q200 320 400 370 Q600 420 800 340 Q950 270 1100 310 L1100 720 L0 720Z"
        fill="#09868b"
        opacity=".25"
      />
      <path
        d="M0 510 Q280 450 550 490 Q820 530 1100 460 L1100 720 L0 720Z"
        fill="#1a5c40"
        opacity=".35"
      />
      <path
        d="M0 620 Q300 580 600 610 Q900 640 1100 595 L1100 720 L0 720Z"
        fill="#3d7c47"
        opacity=".4"
      />
    </svg>
  )
}

export function LandscapeBackground() {
  const { resolvedTheme } = useTheme()

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      {resolvedTheme === 'dark' ? <DarkSvg /> : <LightSvg />}
    </div>
  )
}
