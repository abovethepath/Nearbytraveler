import { Link } from "wouter";

export default function SimpleNavbar() {
  return (
    <nav className="bg-red-600 text-white w-full h-16 flex items-center px-4" style={{ zIndex: 9999, position: 'relative' }}>
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        <div>
          <Link href="/" className="text-white text-xl font-bold">
            Nearby Traveler
          </Link>
          <span className="ml-4 text-white text-sm font-bold uppercase tracking-wide bg-white/20 px-2 py-1 rounded">BETA</span>
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
    </nav>
  );
}