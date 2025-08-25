import ResponsiveNavbar from "@/components/ResponsiveNavbar";

const samplePills = ["Los Angeles", "Beach", "Live Music", "Coffee", "Hiking", "Sunsets"];

export default function ProfilePageResponsive() {
  return (
    <div className="min-screen flex flex-col">
      <ResponsiveNavbar />

      <main className="container-default py-6 md:py-10 flex-1">
        {/* Header: avatar + info */}
        <section className="grid grid-cols-1 md:grid-cols-[160px,1fr] gap-6 md:gap-8 items-start">
          {/* Avatar */}
          <div className="flex md:block justify-center">
            <img
              src="https://placehold.co/320x320"
              alt="Profile"
              className="h-32 w-32 md:h-40 md:w-40 rounded-full object-cover"
            />
          </div>

          {/* Name + actions */}
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Aaron L.</h1>
              <p className="text-sm text-gray-600">Local • Playa del Rey, CA</p>
            </div>

            {/* Actions bar: turns into 2x2 grid on mobile */}
            <div className="grid grid-cols-2 sm:auto-cols-fr sm:grid-flow-col gap-2">
              <button className="pill">Message</button>
              <button className="pill">Invite</button>
              <button className="pill col-span-2 sm:col-span-1">Follow</button>
            </div>

            {/* Pills wrap nicely */}
            <div className="flex flex-wrap gap-2">
              {samplePills.map((p) => (
                <span key={p} className="pill">{p}</span>
              ))}
            </div>
          </div>
        </section>

        {/* About + Gallery (stack on mobile) */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <article className="lg:col-span-2 rounded-2xl border p-4 md:p-6 bg-white">
            <h2 className="text-lg font-semibold mb-2">About</h2>
            <p className="text-sm leading-6 text-gray-700">
              I've hosted 400+ travelers from 40+ countries. I love beach bonfires,
              live music, and showing people the real LA.
            </p>
          </article>

          <aside className="rounded-2xl border p-4 md:p-6 bg-white">
            <h3 className="text-lg font-semibold mb-3">Next Availability</h3>
            <ul className="space-y-2 text-sm">
              <li>Fri 7pm — Bonfire @ Dockweiler</li>
              <li>Sat 10am — Coffee Walk Venice</li>
              <li>Sun 5pm — Sunset Hike Temescal</li>
            </ul>
          </aside>
        </section>

        {/* Photo grid */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Photos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <img
                key={i}
                src={`https://placehold.co/600x400?text=${i + 1}`}
                alt={`Photo ${i + 1}`}
                className="w-full aspect-[4/3] object-cover rounded-xl"
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}