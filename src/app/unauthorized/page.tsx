export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-5V7a5 5 0 00-10 0v3H1v9a2 2 0 002 2h14a2 2 0 002-2v-9h-1V7a5 5 0 00-5-5z" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Access Restricted</h1>
        <p className="text-gray-500 mb-8">
          This page is only accessible to <strong>Admin</strong> users. Contact your administrator if you need access.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors"
        >
          ← Back to Dashboard
        </a>
      </div>
    </main>
  );
}
