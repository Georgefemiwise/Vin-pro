export default function Skeleton() {
  return (
    <div className="space-y-4" aria-label="Loading vehicle details" aria-busy="true">
      <div className="panel p-6">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton mt-4 h-8 w-3/4 rounded-lg" />
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[1,2,3,4].map((x) => <div key={x} className="skeleton h-20 rounded-2xl" />)}
        </div>
      </div>
      {[1,2,3].map((x) => (
        <div className="panel p-6" key={x}>
          <div className="skeleton h-5 w-36 rounded" />
          <div className="mt-5 space-y-3">
            {[1,2,3,4].map((y) => <div className="skeleton h-9 rounded-lg" key={y} />)}
          </div>
        </div>
      ))}
    </div>
  );
}