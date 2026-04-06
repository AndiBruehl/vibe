export default function Preloader() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-red-500 border-r-yellow-500" />
        <div className="absolute inset-0 blur-md opacity-60 animate-spin rounded-full border-4 border-transparent border-t-red-500 border-r-yellow-500" />
      </div>
    </div>
  );
}
