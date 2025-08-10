export default function MobileNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="grid grid-cols-5 py-2">
        <button className="flex flex-col items-center py-2 text-primary-600" data-testid="button-nav-home">
          <i className="fas fa-home text-lg"></i>
          <span className="text-xs mt-1">Home</span>
        </button>
        <button className="flex flex-col items-center py-2 text-gray-400" data-testid="button-nav-discover">
          <i className="fas fa-compass text-lg"></i>
          <span className="text-xs mt-1">Discover</span>
        </button>
        <button className="flex flex-col items-center py-2 text-gray-400" data-testid="button-nav-create">
          <i className="fas fa-plus-circle text-lg"></i>
          <span className="text-xs mt-1">Create</span>
        </button>
        <button className="flex flex-col items-center py-2 text-gray-400" data-testid="button-nav-messages">
          <i className="fas fa-comments text-lg"></i>
          <span className="text-xs mt-1">Messages</span>
        </button>
        <button className="flex flex-col items-center py-2 text-gray-400" data-testid="button-nav-profile">
          <i className="fas fa-user text-lg"></i>
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </div>
  );
}
