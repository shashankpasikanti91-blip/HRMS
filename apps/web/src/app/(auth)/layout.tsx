export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden lg:flex flex-col justify-between border-r border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.25),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_30%),#020617] p-10">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
              SRP AI HRMS Platform
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight">Built for fast-growing teams. Designed the SRP way.</h1>
              <p className="max-w-xl text-sm leading-6 text-slate-300">
                One connected workspace for HR, payroll, attendance, recruitment, analytics, documents, and employee self-service.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Live employee workflows",
                "Role-based owner and user access",
                "Payroll + attendance in one system",
                "Secure document uploads and approvals",
              ].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-semibold">360°</p>
              <p className="text-xs text-slate-300">People operations visibility</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-semibold">AI</p>
              <p className="text-xs text-slate-300">Guided workflows and insights</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-semibold">24/7</p>
              <p className="text-xs text-slate-300">Self-service access for teams</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-8 lg:px-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
