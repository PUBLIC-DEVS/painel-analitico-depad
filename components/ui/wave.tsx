"use client"

import { cn } from "@/lib/utils"

export function Wave({ className }: { className?: string }) {
  return (
    <div className={cn("absolute top-0 left-0 w-full overflow-hidden leading-[0] pointer-events-none", className)}>
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="relative block w-[calc(100%+1.3px)] h-[40px] fill-primary"
      >
        <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,29.29,512.15,65,588,78c73.3,12.6,155.15,10.1,232-15,116-37.9,252.15-46,380,20V0Z"></path>
      </svg>
    </div>
  )
}
