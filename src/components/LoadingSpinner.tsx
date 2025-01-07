export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-emerald-600 border-t-transparent"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-400 border-t-transparent animate-reverse"></div>
        </div>
      </div>
    </div>
  );
}
