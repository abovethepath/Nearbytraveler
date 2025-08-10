import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, VolumeX, Music, MapPin, Shuffle, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AmbientTrack {
  id: string;
  name: string;
  location: string;
  mood: string;
  url: string;
  duration: number;
  category: 'nature' | 'urban' | 'cultural' | 'coastal' | 'mountain' | 'forest' | 'desert';
}

interface AmbientMusicPlayerProps {
  currentLocation?: string;
  travelDestination?: string;
  className?: string;
}

// Curated ambient tracks for different locations and moods
const AMBIENT_TRACKS: AmbientTrack[] = [
  // Paris
  {
    id: 'paris-cafe',
    name: 'Parisian Café Ambience',
    location: 'Paris',
    mood: 'romantic',
    url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    duration: 180,
    category: 'urban'
  },
  {
    id: 'paris-rain',
    name: 'Rain on Cobblestones',
    location: 'Paris',
    mood: 'peaceful',
    url: 'https://www.soundjay.com/misc/sounds/rain-01.wav',
    duration: 240,
    category: 'urban'
  },
  
  // Tokyo
  {
    id: 'tokyo-temple',
    name: 'Temple Bells & Bamboo',
    location: 'Tokyo',
    mood: 'zen',
    url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    duration: 300,
    category: 'cultural'
  },
  {
    id: 'tokyo-city',
    name: 'Urban Tokyo Night',
    location: 'Tokyo',
    mood: 'energetic',
    url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    duration: 200,
    category: 'urban'
  },

  // Bali
  {
    id: 'bali-jungle',
    name: 'Tropical Rainforest',
    location: 'Bali',
    mood: 'exotic',
    url: 'https://www.soundjay.com/nature/sounds/rain-forest.wav',
    duration: 360,
    category: 'forest'
  },
  {
    id: 'bali-ocean',
    name: 'Balinese Beach Waves',
    location: 'Bali',
    mood: 'relaxing',
    url: 'https://www.soundjay.com/nature/sounds/ocean-waves.wav',
    duration: 420,
    category: 'coastal'
  },

  // New York
  {
    id: 'nyc-park',
    name: 'Central Park Morning',
    location: 'New York',
    mood: 'peaceful',
    url: 'https://www.soundjay.com/nature/sounds/birds-chirping.wav',
    duration: 280,
    category: 'nature'
  },
  {
    id: 'nyc-subway',
    name: 'Underground Rhythms',
    location: 'New York',
    mood: 'urban',
    url: 'https://www.soundjay.com/misc/sounds/train-whistle.wav',
    duration: 160,
    category: 'urban'
  },

  // Generic/Universal tracks
  {
    id: 'mountain-wind',
    name: 'Mountain Wind',
    location: 'Mountains',
    mood: 'serene',
    url: 'https://www.soundjay.com/nature/sounds/wind.wav',
    duration: 320,
    category: 'mountain'
  },
  {
    id: 'desert-night',
    name: 'Desert Night',
    location: 'Desert',
    mood: 'mystical',
    url: 'https://www.soundjay.com/nature/sounds/desert-wind.wav',
    duration: 380,
    category: 'desert'
  }
];

export default function AmbientMusicPlayer({ 
  currentLocation = 'Unknown', 
  travelDestination,
  className = '' 
}: AmbientMusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<AmbientTrack | null>(null);
  const [volume, setVolume] = useState([70]);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Get relevant tracks based on location
  const getLocationTracks = () => {
    const location = travelDestination || currentLocation;
    
    // Find tracks that match the location
    const locationTracks = AMBIENT_TRACKS.filter(track => 
      track.location.toLowerCase().includes(location.toLowerCase()) ||
      location.toLowerCase().includes(track.location.toLowerCase())
    );
    
    // If no location-specific tracks, return some generic atmospheric tracks
    if (locationTracks.length === 0) {
      return AMBIENT_TRACKS.filter(track => 
        ['Mountains', 'Desert'].includes(track.location)
      );
    }
    
    return locationTracks;
  };

  const availableTracks = getLocationTracks();

  // Initialize with first available track
  useEffect(() => {
    if (availableTracks.length > 0 && !currentTrack) {
      setCurrentTrack(availableTracks[0]);
    }
  }, [availableTracks, currentTrack]);

  // Audio management
  useEffect(() => {
    if (currentTrack && !audioRef.current) {
      audioRef.current = new Audio(currentTrack.url);
      audioRef.current.loop = true;
      audioRef.current.volume = volume[0] / 100;
      
      audioRef.current.addEventListener('loadstart', () => {
        console.log('Loading ambient track:', currentTrack.name);
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.log('Audio error (expected for demo URLs):', e);
        // Continue with demo functionality even if audio files don't exist
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentTrack, volume]);

  // Progress tracking
  useEffect(() => {
    if (isPlaying && currentTrack) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 1;
          if (newProgress >= currentTrack.duration) {
            // Auto-advance to next track
            handleNextTrack();
            return 0;
          }
          return newProgress;
        });
      }, 1000);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, currentTrack]);

  const handlePlayPause = () => {
    if (!currentTrack) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      // For demo purposes, we'll simulate playing even if audio fails
      audioRef.current?.play().catch(() => {
        console.log('Audio playback simulated (demo mode)');
      });
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume[0] / 100;
    }
    if (newVolume[0] > 0) {
      setIsMuted(false);
    }
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? volume[0] / 100 : 0;
    }
  };

  const handleNextTrack = () => {
    if (availableTracks.length === 0) return;
    
    const currentIndex = availableTracks.findIndex(track => track.id === currentTrack?.id);
    let nextIndex;
    
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * availableTracks.length);
    } else {
      nextIndex = (currentIndex + 1) % availableTracks.length;
    }
    
    setCurrentTrack(availableTracks[nextIndex]);
    setProgress(0);
    
    // Reset audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      nature: 'bg-green-100 text-green-800',
      urban: 'bg-blue-100 text-blue-800',
      cultural: 'bg-blue-100 text-blue-800',
      coastal: 'bg-cyan-100 text-cyan-800',
      mountain: 'bg-gray-100 text-gray-800',
      forest: 'bg-emerald-100 text-emerald-800',
      desert: 'bg-orange-100 text-orange-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (availableTracks.length === 0) {
    return null;
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Music className="w-5 h-5 text-blue-600" />
          Ambient Soundscape
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-auto"
          >
            {isExpanded ? '−' : '+'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current track info */}
        {currentTrack && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{currentTrack.location}</span>
              <Badge className={`text-xs ${getCategoryColor(currentTrack.category)}`}>
                {currentTrack.category}
              </Badge>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">{currentTrack.name}</h4>
              <p className="text-sm text-gray-500 capitalize">{currentTrack.mood} ambience</p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(currentTrack.duration)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <motion.div
                  className="bg-blue-600 h-1 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress / currentTrack.duration) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlayPause}
                  className="flex items-center gap-1"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextTrack}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShuffle(!shuffle)}
                  className={shuffle ? 'text-blue-600' : 'text-gray-400'}
                >
                  <Shuffle className="w-4 h-4" />
                </Button>
              </div>

              {/* Volume control */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMute}
                >
                  {isMuted || volume[0] === 0 ? 
                    <VolumeX className="w-4 h-4" /> : 
                    <Volume2 className="w-4 h-4" />
                  }
                </Button>
                <div className="w-16">
                  <Slider
                    value={isMuted ? [0] : volume}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Track list (when expanded) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2 border-t pt-3"
            >
              <h5 className="text-sm font-medium text-gray-700">Available Tracks</h5>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {availableTracks.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      setCurrentTrack(track);
                      setProgress(0);
                      if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current = null;
                      }
                    }}
                    className={`w-full text-left p-2 rounded text-sm transition-colors ${
                      currentTrack?.id === track.id
                        ? 'bg-blue-50 text-blue-900 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{track.name}</span>
                      <Badge className={`text-xs ${getCategoryColor(track.category)}`}>
                        {track.mood}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {track.location} • {formatTime(track.duration)}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}