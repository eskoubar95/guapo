import { Skeleton } from "@/components/ui/skeleton";

const listShellClass =
  "relative overflow-hidden rounded-[1.75rem] bg-linear-to-b from-muted/30 via-muted/10 to-transparent px-4 py-2 sm:px-6";

type SkeletonListProps = {
  /** Screen-reader announcement while placeholders show */
  loadingLabel: string;
};

export function AccountOrdersListSkeleton({ loadingLabel }: SkeletonListProps) {
  return (
    <div className="mt-10">
      <p className="sr-only" role="status">
        {loadingLabel}
      </p>
      <div className={listShellClass}>
        <ul className="divide-y divide-border/50" aria-hidden>
          {[0, 1, 2, 3].map((key) => (
            <li key={key} className="py-7 first:pt-5 last:pb-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-7 w-28 rounded-lg" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-52 max-w-full" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 shrink-0 rounded" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-4 sm:items-end">
                  <Skeleton className="h-9 w-28 rounded-lg sm:w-32" />
                  <Skeleton className="h-10 w-40 rounded-full" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function AccountSubscriptionsListSkeleton({ loadingLabel }: SkeletonListProps) {
  return (
    <div className="mt-10">
      <p className="sr-only" role="status">
        {loadingLabel}
      </p>
      <div className={listShellClass}>
        <ul className="divide-y divide-border/50" aria-hidden>
          {[0, 1, 2].map((key) => (
            <li key={key} className="py-7 first:pt-5 last:pb-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-7 w-28 rounded-lg" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-64 max-w-full" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 shrink-0 rounded" />
                    <Skeleton className="h-4 w-56 max-w-full" />
                  </div>
                  <Skeleton className="h-4 w-72 max-w-full" />
                </div>
                <div className="flex shrink-0 flex-col items-start gap-4 sm:items-end">
                  <Skeleton className="h-10 w-40 rounded-full" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
