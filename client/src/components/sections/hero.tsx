import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function Hero() {
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    retry: false,
  });

  return (
    <section className="relative bg-gradient-to-br from-primary-600 to-primary-700 overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20" 
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')"
        }}
      ></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Where Local Experiences<br />
            <span className="text-yellow-300">Meet Worldwide Connections</span>
          </h1>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
            Connect with locals and travelers. Discover authentic experiences. Plan unforgettable trips with our AI-powered travel companion.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Button 
              className="bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-join-local"
            >
              <i className="fas fa-home mr-2"></i>
              Join as Local First
            </Button>
            <Button 
              className="bg-primary-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-400 transition-colors flex items-center justify-center"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-find-travel"
            >
              <i className="fas fa-plane mr-2"></i>
              Find Travel Connections
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-white">
            <div className="text-center">
              <div className="text-3xl font-bold" data-testid="stat-users">
                {stats?.totalUsers || 122}+
              </div>
              <div className="text-blue-200">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold" data-testid="stat-cities">
                {stats?.totalCities || 45}+
              </div>
              <div className="text-blue-200">Cities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold" data-testid="stat-events">
                {stats?.totalEvents || 687}+
              </div>
              <div className="text-blue-200">Events</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold" data-testid="stat-aura">
                1,054
              </div>
              <div className="text-blue-200">Aura Points</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
