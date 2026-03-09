export default function PlatformLoading() {
  return (
    <div className="py-12 text-center text-gray-500">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin motion-reduce:animate-none rounded-full border-2 border-violet-600 border-t-transparent" />
        <p>Loading&hellip;</p>
      </div>
    </div>
  );
}
