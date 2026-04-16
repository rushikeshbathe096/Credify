import HealthCheck from "@/components/HealthCheck";
import SessionStarter from "@/components/SessionStarter";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-slate-950 font-sans">
      <div className="max-w-5xl w-full flex flex-col space-y-16 mt-16 items-center">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400 tracking-tight">
            Credify System Interface
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Connect strictly and securely to our FastAPI backend services. Check status and initialize video consultation sessions.
          </p>
        </div>
        
        {/* Components Section */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Health Check Area */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2 px-1">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h2 className="text-slate-200 font-semibold text-lg">System Status</h2>
            </div>
            <HealthCheck />
          </div>
          
          {/* Session Initialization Area */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2 px-1">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-slate-200 font-semibold text-lg">Quick Start</h2>
            </div>
            <SessionStarter />
          </div>
        </div>
        
      </div>
    </main>
  );
}
