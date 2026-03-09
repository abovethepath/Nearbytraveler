import ActivityFeed from "@/components/ActivityFeed";

export default function ActivityPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Activity</h1>
        <ActivityFeed />
      </div>
    </div>
  );
}
