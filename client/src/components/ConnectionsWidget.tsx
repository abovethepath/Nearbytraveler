import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Users } from "lucide-react";
import { SimpleAvatar } from "@/components/simple-avatar";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Other"];
const SEXUAL_PREFERENCE_OPTIONS = ["Straight", "Gay", "Lesbian", "Bisexual", "Pansexual", "Other"];

interface ConnectionsWidgetProps {
  userConnections: any[];
  isOwnProfile: boolean;
  effectiveUserId: number;
  showConnectionFilters: boolean;
  setShowConnectionFilters: (show: boolean) => void;
  connectionFilters: any;
  setConnectionFilters: (filters: any) => void;
  connectionsDisplayCount: number;
  setConnectionsDisplayCount: (count: number) => void;
  editingConnectionNote: number | null;
  setEditingConnectionNote: (id: number | null) => void;
  connectionNoteText: string;
  setConnectionNoteText: (text: string) => void;
}

export const ConnectionsWidget: React.FC<ConnectionsWidgetProps> = ({
  userConnections,
  isOwnProfile,
  effectiveUserId,
  showConnectionFilters,
  setShowConnectionFilters,
  connectionFilters,
  setConnectionFilters,
  connectionsDisplayCount,
  setConnectionsDisplayCount,
  editingConnectionNote,
  setEditingConnectionNote,
  connectionNoteText,
  setConnectionNoteText
}) => {
  const [, setLocation] = useLocation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            Connections ({userConnections.length})
          </div>
          {userConnections.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConnectionFilters(!showConnectionFilters)}
              className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600"
            >
              {showConnectionFilters ? "Hide Options" : "Sort & View"}
            </Button>
          )}
        </CardTitle>
        
        {/* Filter Panel */}
        {showConnectionFilters && userConnections.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Location</label>
                <Select
                  value={connectionFilters.location || "all"}
                  onValueChange={(value) => setConnectionFilters(prev => ({ ...prev, location: value === "all" ? "" : value }))}
                >
                  <SelectTrigger className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    {userConnections
                      .map((conn: any) => conn.connectedUser?.location)
                      .filter((location: any) => Boolean(location))
                      .filter((location: any, index: number, arr: any[]) => arr.indexOf(location) === index)
                      .map((location: any) => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Gender</label>
                <Select
                  value={connectionFilters.gender}
                  onValueChange={(value) => setConnectionFilters(prev => ({ ...prev, gender: value === "all" ? "" : value }))}
                >
                  <SelectTrigger className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600">
                    <SelectValue placeholder="Any gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any gender</SelectItem>
                    {GENDER_OPTIONS.map((gender) => (
                      <SelectItem key={gender} value={gender.toLowerCase()}>
                        {gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Sexual Preference</label>
                <Select
                  value={connectionFilters.sexualPreference}
                  onValueChange={(value) => setConnectionFilters(prev => ({ ...prev, sexualPreference: value === "all" ? "" : value }))}
                >
                  <SelectTrigger className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600">
                    <SelectValue placeholder="Any preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any preference</SelectItem>
                    {SEXUAL_PREFERENCE_OPTIONS.map((preference) => (
                      <SelectItem key={preference} value={preference}>
                        {preference}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Min Age</label>
                <Input
                  type="number"
                  placeholder="Min age"
                  value={connectionFilters.minAge}
                  onChange={(e) => setConnectionFilters(prev => ({ ...prev, minAge: e.target.value }))}
                  className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600"
                  min="18"
                  max="100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Max Age</label>
                <Input
                  type="number"
                  placeholder="Max age"
                  value={connectionFilters.maxAge}
                  onChange={(e) => setConnectionFilters(prev => ({ ...prev, maxAge: e.target.value }))}
                  className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600"
                  min="18"
                  max="100"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConnectionFilters({ location: 'all', gender: 'all', sexualPreference: 'all', minAge: '', maxAge: '' })}
                className="h-8 text-xs bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600"
              >
                Reset
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {userConnections.length > 0 ? (
          <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {userConnections.slice(0, connectionsDisplayCount).map((connection: any) => (
              <div
                key={connection.id}
                className="rounded-xl border p-3 hover:shadow-sm bg-white dark:bg-gray-800 flex flex-col items-center text-center gap-2"
              >
                <SimpleAvatar
                  user={connection.connectedUser}
                  size="md"
                  className="w-16 h-16 sm:w-14 sm:h-14 rounded-full border-2 object-cover cursor-pointer"
                  onClick={() => setLocation(`/profile/${connection.connectedUser?.id?.toString() || ''}`)}
                />
                <div className="w-full">
                  <p className="font-medium text-sm truncate text-gray-900 dark:text-white">
                    {connection.connectedUser?.name || connection.connectedUser?.username}
                  </p>
                  <p className="text-xs truncate text-gray-500 dark:text-gray-400">
                    {connection.connectedUser?.hometownCity && connection.connectedUser?.hometownCountry
                      ? `${connection.connectedUser?.hometownCity}, ${connection.connectedUser?.hometownCountry.replace("United States", "USA")}`
                      : "New member"}
                  </p>
                  
                  {/* Connection Note - How We Met */}
                  {isOwnProfile && (
                    <div className="mt-2 w-full">
                      {editingConnectionNote === connection.id ? (
                        <div className="space-y-2">
                          <Input
                            value={connectionNoteText}
                            onChange={(e) => setConnectionNoteText(e.target.value)}
                            placeholder="How did we meet? e.g., met at bonfire BBQ"
                            className="text-xs h-7 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                // Save connection note
                                apiRequest('PATCH', `/api/connections/${connection.id}/note`, {
                                  connectionNote: connectionNoteText
                                }).then(() => {
                                  queryClient.invalidateQueries({ queryKey: [`/api/connections/${effectiveUserId}`] });
                                  setEditingConnectionNote(null);
                                  setConnectionNoteText('');
                                }).catch(console.error);
                              }
                            }}
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => {
                                apiRequest('PATCH', `/api/connections/${connection.id}/note`, {
                                  connectionNote: connectionNoteText
                                }).then(() => {
                                  queryClient.invalidateQueries({ queryKey: [`/api/connections/${effectiveUserId}`] });
                                  setEditingConnectionNote(null);
                                  setConnectionNoteText('');
                                }).catch(console.error);
                              }}
                              className="h-6 px-2 text-xs bg-green-500 hover:bg-green-600 text-white border-0"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingConnectionNote(null);
                                setConnectionNoteText('');
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="cursor-pointer text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded px-2 py-1 mt-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingConnectionNote(connection.id);
                            setConnectionNoteText(connection.connectionNote || '');
                          }}
                          title="Click to edit how you met"
                        >
                          {connection.connectionNote ? (
                            <span className="text-blue-600 dark:text-blue-400">📍 {connection.connectionNote}</span>
                          ) : (
                            <span className="text-gray-400 italic">+ How did we meet?</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Connection notes are private - not shown to others */}
                </div>

                {/* Show the button on ≥sm only; on mobile the whole tile is tappable */}
                <Button
                  size="sm"
                  variant="outline"
                  className="hidden sm:inline-flex h-8 px-3 text-xs bg-blue-500 hover:bg-blue-600 text-white border-0"
                  onClick={() => setLocation(`/profile/${connection.connectedUser?.id?.toString() || ''}`)}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
            
            {/* Load More / Load Less buttons */}
            {userConnections.length > 3 && (
              <div className="text-center pt-2">
                {connectionsDisplayCount < userConnections.length ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConnectionsDisplayCount(userConnections.length)}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950 h-8"
                  >
                    Load More ({userConnections.length - connectionsDisplayCount} more)
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConnectionsDisplayCount(3)}
                    className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800 h-8"
                  >
                    Load Less
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No connections yet</p>
            <p className="text-xs">
              {isOwnProfile 
                ? "Start connecting with other travelers" 
                : "This user hasn't made any connections yet"
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};