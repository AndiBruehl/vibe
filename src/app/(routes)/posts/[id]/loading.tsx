export default function Loading() {
  return (
    <>
      {/* TOP BAR */}
      <section className="flex flex-row items-center justify-between">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
      </section>

      <main className="mx-auto w-full max-w-6xl p-4 md:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
          {/* LEFT: IMAGE CARD */}
          <article className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
            {/* Image Skeleton */}
            <div className="aspect-square w-full animate-pulse bg-gray-300 dark:bg-gray-700" />

            <div className="space-y-4 p-5 md:p-6">
              <div className="h-6 w-24 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
            </div>
          </article>

          {/* RIGHT SIDE */}
          <div className="flex flex-col gap-4">
            {/* AUTHOR CARD */}
            <article className="flex h-28 items-center justify-between rounded-2xl bg-white px-5 shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
              <div className="flex items-center gap-3">
                <div className="size-12 animate-pulse rounded-full bg-gray-300 dark:bg-gray-700" />

                <div className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
                  <div className="h-3 w-16 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
                </div>
              </div>

              <div className="h-4 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
            </article>

            {/* COMMENTS CARD */}
            <article className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
              <div className="p-5 md:p-6 space-y-4">
                <div className="h-6 w-28 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />

                {/* Comment Skeletons */}
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-gray-100 p-3 dark:bg-gray-700"
                  >
                    <div className="mb-2 h-3 w-full animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
                    <div className="h-3 w-5/6 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </main>
    </>
  );
}
