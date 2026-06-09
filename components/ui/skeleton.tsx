import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-accent", className)}
      {...props}
    />
  )
}

export function SkeletonTable() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3 py-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="flex gap-4 items-center" key={index}>
          <Skeleton className="h-5 flex-1 bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  )
}

export { Skeleton }
