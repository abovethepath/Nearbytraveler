import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Calendar, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PublicationStatus {
  name: string;
  lastFetch: string | null;
  nextPublicationTime: string | null;
  isActiveWindow: boolean;
  city: string;
}

interface SchedulerStatus {
  isRunning: boolean;
  activeTasks: number;
  upcomingFetches: Array<{
    publication: string;
    city: string;
    nextTime: string;
  }>;
  lastCheck: string;
  citiesMonitored: string[];
}

interface ScheduleData {
  scheduleInfo: string;
  cityStatus: PublicationStatus[];
  upcomingPublications: Array<{
    publication: string;
    city: string;
    nextTime: string;
  }>;
}

export function PublicationSchedule({ city = 'Los Angeles' }: { city?: string }) {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: scheduleData, isLoading: scheduleLoading, refetch: refetchSchedule } = useQuery<ScheduleData>({
    queryKey: ['/api/publication-schedules', city],
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds if auto-refresh is on
  });

  const { data: schedulerStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery<SchedulerStatus>({
    queryKey: ['/api/scheduler-status'],
    refetchInterval: autoRefresh ? 60000 : false, // Refresh every minute
  });

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <Clock className="w-4 h-4 text-yellow-500" />
    );
  };

  const handleManualRefresh = () => {
    refetchSchedule();
    refetchStatus();
  };

  if (scheduleLoading || statusLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Loading Publication Schedules...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scheduler Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Automatic Event Updates
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={schedulerStatus?.isRunning ? "default" : "destructive"}>
                {schedulerStatus?.isRunning ? "Active" : "Inactive"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                className="flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Real-time updates from major publications - no manual deployment needed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-sm font-medium">Active Tasks</span>
              <span className="text-lg font-bold text-blue-600">{schedulerStatus?.activeTasks || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium">Cities Monitored</span>
              <span className="text-lg font-bold text-green-600">{schedulerStatus?.citiesMonitored?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <span className="text-sm font-medium">Last Check</span>
              <span className="text-xs text-gray-600">
                {schedulerStatus?.lastCheck ? formatTime(schedulerStatus.lastCheck) : 'Never'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publication Status for Current City */}
      <Card>
        <CardHeader>
          <CardTitle>Publication Status - {city}</CardTitle>
          <CardDescription>
            Current status of magazine feeds for your location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduleData?.cityStatus?.map((pub: PublicationStatus) => (
              <div key={pub.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(pub.isActiveWindow)}
                  <div>
                    <h4 className="font-medium capitalize">{pub.name.replace('-', ' ')}</h4>
                    <p className="text-sm text-gray-600">
                      {pub.isActiveWindow ? (
                        <span className="text-green-600 font-medium">Publication window active</span>
                      ) : (
                        <span>Next publication: {pub.nextPublicationTime ? formatTime(pub.nextPublicationTime) : 'TBD'}</span>
                      )}
                    </p>
                  </div>
                </div>
                <Badge variant={pub.isActiveWindow ? "default" : "secondary"}>
                  {pub.isActiveWindow ? "Fetching" : "Waiting"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Publications */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Publications</CardTitle>
          <CardDescription>
            Next scheduled updates across all cities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {schedulerStatus?.upcomingFetches?.slice(0, 5).map((fetch, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <span className="font-medium capitalize">{fetch.publication.replace('-', ' ')}</span>
                  <span className="text-gray-600 ml-2">• {fetch.city}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {formatTime(fetch.nextTime)}
                </span>
              </div>
            ))}
            {(!schedulerStatus?.upcomingFetches || schedulerStatus.upcomingFetches.length === 0) && (
              <p className="text-gray-500 text-center py-4">No upcoming publications scheduled</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Publication Schedule Information */}
      <Card>
        <CardHeader>
          <CardTitle>Magazine Publication Schedule</CardTitle>
          <CardDescription>
            When magazines publish new event content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-blue-600 mb-2">🕒 Timeout Magazine</h4>
                <p className="text-sm text-gray-600 mb-1">Tuesdays at 9:00 AM EST</p>
                <p className="text-xs">Weekly city guides for LA, NYC, Chicago, SF, Miami, Boston</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-purple-600 mb-2">📰 Village Voice</h4>
                <p className="text-sm text-gray-600 mb-1">Wednesdays at 10:00 AM EST</p>
                <p className="text-xs">NYC nightlife, concerts, and cultural events</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-green-600 mb-2">🗞️ Gothamist</h4>
                <p className="text-sm text-gray-600 mb-1">Thursdays at 11:00 AM EST</p>
                <p className="text-xs">NYC daily news with weekly event roundups</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-orange-600 mb-2">🌴 LAist</h4>
                <p className="text-sm text-gray-600 mb-1">Fridays at 12:00 PM PST</p>
                <p className="text-xs">LA weekend guides and local events</p>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800 dark:text-blue-200">How It Works</span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Events are automatically fetched during publication windows and up to 3 days after to catch fresh content. 
                This ensures you see authentic, timely events without stale or repeated listings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Auto-refresh: {autoRefresh ? 'Enabled' : 'Disabled'}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAutoRefresh(!autoRefresh)}
        >
          {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
        </Button>
      </div>
    </div>
  );
}