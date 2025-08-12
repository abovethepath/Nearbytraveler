import { Link } from "wouter";

export default function SimpleNavbar() {
  return (
    <div 
      className="bg-red-600 text-white w-full h-16 flex items-center px-4 border-b-4 border-red-800 shadow-xl" 
      style={{ 
        position: 'fixed', 
        top: 'env(safe-area-inset-top)', 
        left: 0, 
        right: 0, 
        zIndex: 999999,
        display: 'flex',
        visibility: 'visible',
        opacity: 1
      }}
    >
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        <div className="flex items-center">
          <Link href="/" className="text-white text-xl font-bold mr-4">
            Nearby Traveler
          </Link>
          <span className="text-white text-sm font-bold uppercase tracking-wide bg-white/20 px-2 py-1 rounded">BETA</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/auth" className="bg-white text-red-600 hover:bg-white/90 px-4 py-2 rounded-md text-sm font-medium">
            Sign In
          </Link>
          <Link href="/join" className="bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded-md text-sm font-medium">
            Join
          </Link>
        </div>
      </div>
    </div>
  );
}