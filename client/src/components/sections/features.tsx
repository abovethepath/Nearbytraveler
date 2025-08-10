import { Button } from "@/components/ui/button";

export default function Features() {
  const features = [
    {
      title: "Smart Matching",
      description: "AI-powered algorithm connects you with compatible travelers and locals based on interests, travel dates, and activities.",
      icon: "fas fa-users",
      gradient: "bg-primary-gradient",
      buttonColor: "text-primary-600",
      buttonText: "Learn More"
    },
    {
      title: "Real-time Chat",
      description: "Instant messaging with travelers and locals. Dedicated chat rooms for events and secure communication channels.",
      icon: "fas fa-comments",
      gradient: "bg-success-gradient",
      buttonColor: "text-success-600",
      buttonText: "Start Chatting"
    },
    {
      title: "AI Travel Companion",
      description: "Claude Sonnet integration provides intelligent trip planning, photo analysis, and personalized recommendations.",
      icon: "fas fa-robot",
      gradient: "bg-amber-gradient",
      buttonColor: "text-amber-600",
      buttonText: "Try AI Assistant"
    },
    {
      title: "Events & Meetups",
      description: "Discover local events, create meetups, and join activities. Quick \"Let's Meet Now\" for spontaneous connections.",
      icon: "fas fa-calendar-alt",
      gradient: "bg-purple-gradient",
      buttonColor: "text-purple-600",
      buttonText: "Find Events"
    },
    {
      title: "Trip Planning",
      description: "Comprehensive itinerary tools, location-based discovery, and travel memory documentation all in one place.",
      icon: "fas fa-route",
      gradient: "bg-indigo-gradient",
      buttonColor: "text-indigo-600",
      buttonText: "Plan Trip"
    },
    {
      title: "Local Businesses",
      description: "Connect with local businesses, discover special offers, and find authentic experiences recommended by locals.",
      icon: "fas fa-store",
      gradient: "bg-red-gradient",
      buttonColor: "text-red-600",
      buttonText: "Explore Offers"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Your Complete Travel Social Network
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From planning trips to making lifelong connections, Nearby Traveler has everything you need for authentic travel experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className={`${feature.gradient} rounded-2xl p-8 hover:shadow-lg transition-shadow`}>
              <div className={`${feature.buttonColor.replace('text-', 'bg-').replace('600', '600')} text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6`}>
                <i className={`${feature.icon} text-2xl`}></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 mb-4">{feature.description}</p>
              <Button 
                variant="ghost" 
                className={`${feature.buttonColor} font-medium hover:${feature.buttonColor.replace('600', '700')} p-0`}
                data-testid={`button-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {feature.buttonText} <i className="fas fa-arrow-right ml-1"></i>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
