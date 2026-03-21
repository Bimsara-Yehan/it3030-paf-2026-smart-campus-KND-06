/**
 * TicketsPage — placeholder for the Maintenance Ticket module.
 * Full implementation is owned by another module team member.
 */

export default function TicketsPage() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-50">
          <svg className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Tickets</h2>
        <p className="mt-1 text-sm text-gray-500">This module is coming soon.</p>
      </div>
    </div>
  );
}
