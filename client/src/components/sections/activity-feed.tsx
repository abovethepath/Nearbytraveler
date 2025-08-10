import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function ActivityFeed() {
  // Mock data for demonstration - in a real app this would come from the API
  const recentConnections = [
    {
      id: 1,
      userName: "Sarah M.",
      action: "connected with",
      target: "Local Guide Tokyo",
      time: "2 minutes ago",
      location: "Tokyo, Japan",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    },
    {
      id: 2,
      userName: "David L.",
      action: "joined",
      target: "Barcelona Food Tour",
      time: "15 minutes ago",
      location: "Barcelona, Spain",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b5bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    },
    {
      id: 3,
      userName: "Alex R.",
      action: "created event",
      target: "Sunrise Hike",
      time: "1 hour ago",
      location: "San Francisco, CA",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    }
  ];

  const trendingEvents = [
    {
      id: 1,
      title: "Weekend Market Tour",
      description: "Explore local markets with fellow food lovers",
      location: "Paris, France",
      attendees: 12
    },
    {
      id: 2,
      title: "Photography Walk",
      description: "Capture the city's hidden gems together",
      location: "New York, NY",
      attendees: 8
    },
    {
      id: 3,
      title: "Coffee & Culture",
      description: "Local coffee shops and cultural exchange",
      location: "Melbourne, AU",
      attendees: 15
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Live Community Activity
          </h2>
          <p className="text-xl text-gray-600">
            See what's happening in the Nearby Traveler community right now
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Recent Connections */}
          <div className="bg-primary-gradient rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <i className="fas fa-handshake text-primary-600 mr-3"></i>
              Recent Connections
            </h3>
            <div className="space-y-4">
              {recentConnections.map((connection) => (
                <div key={connection.id} className="flex items-center space-x-3" data-testid={`connection-${connection.id}`}>
                  <img 
                    src={connection.avatar} 
                    alt="User avatar" 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{connection.userName}</span> {connection.action} <span className="font-medium">{connection.target}</span>
                    </p>
                    <p className="text-xs text-gray-500">{connection.time} • {connection.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Events */}
          <div className="bg-amber-gradient rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <i className="fas fa-fire text-amber-600 mr-3"></i>
              Trending Events
            </h3>
            <div className="space-y-4">
              {trendingEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-xl p-4 shadow-sm" data-testid={`event-${event.id}`}>
                  <h4 className="font-medium text-gray-900 mb-1">{event.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span><i className="fas fa-map-marker-alt mr-1"></i>{event.location}</span>
                    <span><i className="fas fa-users mr-1"></i>{event.attendees} attending</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Join the Community?</h3>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Start as a local in your hometown and unlock authentic travel experiences worldwide. Our community is waiting to welcome you.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              className="bg-white text-primary-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-become-local"
            >
              <i className="fas fa-home mr-2"></i>
              Become a Local
            </Button>
            <Button 
              className="bg-primary-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-400 transition-colors border border-primary-400"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-explore-platform"
            >
              <i className="fas fa-compass mr-2"></i>
              Explore Platform
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
