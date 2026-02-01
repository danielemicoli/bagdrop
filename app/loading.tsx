import { Briefcase } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header skeleton */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-brand-navy" />
              <span className="text-2xl font-bold text-brand-navy">BagDrop.it</span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero skeleton */}
      <div className="bg-gradient-to-br from-brand-navy via-brand-navy-dark to-brand-navy-light text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <div className="h-10 w-64 bg-white/10 rounded-full animate-pulse mb-6" />
            
            {/* Title */}
            <div className="h-16 w-96 max-w-full bg-white/10 rounded-lg animate-pulse mb-4" />
            <div className="h-12 w-80 max-w-full bg-white/10 rounded-lg animate-pulse mb-8" />
            
            {/* Search box */}
            <div className="w-full max-w-2xl">
              <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 h-14 bg-white/30 rounded-xl animate-pulse" />
                  <div className="h-14 w-40 bg-brand-orange/50 rounded-xl animate-pulse" />
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 w-full max-w-4xl">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white/10 rounded-2xl p-4">
                  <div className="h-8 w-16 bg-white/20 rounded animate-pulse mx-auto mb-2" />
                  <div className="h-4 w-24 bg-white/20 rounded animate-pulse mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
