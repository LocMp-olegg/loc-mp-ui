import { useId } from 'react'

const STAR_PATH =
  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'

interface StarProps {
  fill: number // 0..1
  size: number
  clipId: string
}

function PartialStar({ fill, size, clipId }: StarProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ flexShrink: 0 }}>
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={fill * 24} height="24" />
        </clipPath>
      </defs>
      {/* Empty background */}
      <path d={STAR_PATH} className="fill-border" />
      {/* Filled portion */}
      <path d={STAR_PATH} className="fill-amber-400" clipPath={`url(#${clipId})`} />
    </svg>
  )
}

interface Props {
  rating: number
  max?: number
  size?: number
  className?: string
}

export function StarRating({ rating, max = 5, size = 16, className }: Props) {
  const id = useId()

  return (
    <div className={`flex items-center gap-0.5 ${className ?? ''}`}>
      {Array.from({ length: max }).map((_, i) => {
        const fill = Math.min(1, Math.max(0, rating - i))
        return (
          <PartialStar key={i} fill={fill} size={size} clipId={`${id}s${i}`} />
        )
      })}
    </div>
  )
}
