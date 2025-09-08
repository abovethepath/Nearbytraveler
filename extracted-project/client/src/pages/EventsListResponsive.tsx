import ResponsiveNavbar from "@/components/ResponsiveNavbar";

const events = [
  { id: 1, title: "Dockweiler Bonfire", city: "Los Angeles", when: "Fri 7:00 PM", img: "https://placehold.co/800x500" },
  { id: 2, title: "Venice Coffee Walk", city: "Los Angeles", when: "Sat 10:00 AM", img: "https://placehold.co/800x500" },
  { id: 3, title: "Temescal Sunset Hike", city: "Los Angeles", when: "Sun 5:00 PM", img: "https://placehold.co/800x500" },
  { id: 4, title: "Manhattan Beach Volleyball", city: "LA South Bay", when: "Thu 6:00 PM", img: "https://placehold.co/800x500" },
];

export default function EventsListResponsive() {
  return (
    <div className="min-screen flex flex-col">
      <ResponsiveNavbar />

      <main className="container-default py-6 md:py-10 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Upcoming Events</h1>
          <div className="flex flex-wrap items-center gap-2">
            <button className="pill">Today</button>
            <button className="pill">This Weekend</button>
            <button className="pill">LA Area</button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((ev) => (
            <article key={ev.id} className="rounded-2xl border overflow-hidden bg-white hover:shadow-md transition-shadow">
              <div className="aspect-[16/9] w-full overflow-hidden">
                <img src={ev.img} alt={ev.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-4 space-y-1">
                <h3 className="text-base font-semibold line-clamp-1">{ev.title}</h3>
                <p className="text-sm text-gray-600">{ev.city} • {ev.when}</p>
                <div className="pt-2">
                  <button className="pill">View</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}