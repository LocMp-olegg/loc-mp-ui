export function ChatListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border/50 bg-card/40 animate-pulse"
        >
          <div className="w-11 h-11 rounded-xl bg-muted shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div className="h-3.5 bg-muted rounded-full w-1/3" />
              <div className="h-3 bg-muted rounded-full w-10 shrink-0" />
            </div>
            <div className="h-3 bg-muted rounded-full w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
