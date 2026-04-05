export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen w-full justify-center p-4 md:p-8">
      <div className="flex w-full max-w-md justify-center">
        <div className="w-full origin-top scale-90 md:scale-95">
          <div className="flex min-h-[420px] w-full flex-col items-center justify-center rounded-2xl bg-white shadow-lg shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-transparent dark:border-gray-600 dark:border-t-white" />

            <p className="text-sm text-gray-600 dark:text-gray-300">
              Loading post...
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
