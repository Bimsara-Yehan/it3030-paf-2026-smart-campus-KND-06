/**
 * ResourcesPage — placeholder for the Campus Resources module.
 * Full implementation is owned by another module team member.
 */

export default function ResourcesPage() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
          <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Resources</h2>
        <p className="mt-1 text-sm text-gray-500">This module is coming soon.</p>
      </div>
    </div>
  );
}
