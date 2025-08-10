export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Sign Up as Local",
      description: "Establish your hometown knowledge and become part of the local community. Share your city's hidden gems and favorite spots.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      alt: "Person using location-based app",
      bgColor: "bg-primary-600"
    },
    {
      number: 2,
      title: "Connect & Share",
      description: "Meet fellow locals and travelers. Share experiences, create events, and build meaningful connections in your community.",
      image: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      alt: "Diverse group meeting at coffee shop",
      bgColor: "bg-success-600"
    },
    {
      number: 3,
      title: "Travel with Insider Access",
      description: "When you travel, connect with locals who know their cities like you know yours. Get authentic recommendations and experiences.",
      image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      alt: "Travelers exploring with local guide",
      bgColor: "bg-amber-600"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            The 95/5 Rule: Local First
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            People spend 95% of their life as LOCALS, only 5% traveling. Start as a local to build authentic connections, then travel with insider knowledge.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className={`${step.bgColor} text-white w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-6 mx-auto`}>
                {step.number}
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">{step.title}</h3>
              <p className="text-gray-600 mb-6">{step.description}</p>
              <img 
                src={step.image} 
                alt={step.alt}
                className="rounded-xl shadow-lg w-full h-48 object-cover"
                data-testid={`img-step-${step.number}`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
