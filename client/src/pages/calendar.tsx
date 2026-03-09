import { useAuth } from "@/App";
import NearbyTravelerCalendar from "@/components/NearbyTravelerCalendar";
import BackButton from "@/components/back-button";

export default function CalendarPage() {
  const { user } = useAuth();
  const userCity = (user as any)?.hometownCity || "";

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-20">
        <div className="flex items-center gap-2 mb-4">
          <BackButton />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Events Calendar</h1>
        </div>
        <NearbyTravelerCalendar initialCity={userCity} />
      </div>
    </div>
  );
}
