export default function Technology() {
  const techFeatures = [
    {
      title: "Mobile PWA",
      description: "Add to home screen for native app experience",
      icon: "fas fa-mobile-alt",
      bgColor: "bg-primary-100",
      iconColor: "text-primary-600"
    },
    {
      title: "AI Powered",
      description: "Claude Sonnet integration for smart recommendations",
      icon: "fas fa-brain",
      bgColor: "bg-amber-100",
      iconColor: "text-amber-600"
    },
    {
      title: "Real-time",
      description: "Instant messaging and live updates",
      icon: "fas fa-bolt",
      bgColor: "bg-success-100",
      iconColor: "text-success-600"
    },
    {
      title: "Secure",
      description: "JWT authentication and privacy controls",
      icon: "fas fa-shield-alt",
      bgColor: "bg-red-100",
      iconColor: "text-red-600"
    }
  ];

  const techStack = [
    {
      category: "Frontend",
      technologies: [
        "React 18 + TypeScript",
        "Tailwind CSS",
        "Vite Build System",
        "TanStack Query"
      ]
    },
    {
      category: "Backend",
      technologies: [
        "Node.js + Express",
        "PostgreSQL",
        "Drizzle ORM",
        "JWT Authentication"
      ]
    },
    {
      category: "AI & Services",
      technologies: [
        "Anthropic Claude",
        "SendGrid Email",
        "Stripe Payments",
        "Neon Database"
      ]
    },
    {
      category: "Infrastructure",
      technologies: [
        "Auto-scaling",
        "SSL Encryption",
        "PWA Configuration",
        "RESTful API"
      ]
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powered by Modern Technology
          </h2>
          <p className="text-xl text-gray-600">
            Built with cutting-edge tech for the best user experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {techFeatures.map((feature, index) => (
            <div key={index} className="text-center bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className={`${feature.bgColor} ${feature.iconColor} w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-4 mx-auto`}>
                <i className={feature.icon}></i>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Technology Stack */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h3 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Technology Stack</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {techStack.map((stack, index) => (
              <div key={index}>
                <h4 className="font-medium text-gray-900 mb-3">{stack.category}</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  {stack.technologies.map((tech, techIndex) => (
                    <div key={techIndex} data-testid={`tech-${stack.category.toLowerCase()}-${techIndex}`}>
                      {tech}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
