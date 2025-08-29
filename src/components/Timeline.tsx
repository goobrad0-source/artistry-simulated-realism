import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  Clock,
  Film,
  Plus
} from 'lucide-react';

interface TimelineProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  currentTime: number;
  duration: number;
  onTimeChange: (time: number) => void;
}

export const Timeline = ({ 
  isPlaying, 
  onPlayPause, 
  currentTime, 
  duration, 
  onTimeChange 
}: TimelineProps) => {
  const [showKeyframes, setShowKeyframes] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-20 ui-panel border-t border-border flex items-center px-4 gap-4">
      {/* Animation Controls */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <SkipBack className="w-4 h-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onPlayPause}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        
        <Button variant="ghost" size="sm">
          <Square className="w-4 h-4" />
        </Button>
        
        <Button variant="ghost" size="sm">
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>

      {/* Time Display */}
      <div className="flex items-center gap-2 min-w-0">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <Badge variant="secondary" className="font-mono text-xs">
          {formatTime(currentTime)} / {formatTime(duration)}
        </Badge>
      </div>

      {/* Timeline Scrubber */}
      <div className="flex-1 min-w-0">
        <Slider
          value={[currentTime]}
          onValueChange={(value) => onTimeChange(value[0])}
          max={duration}
          min={0}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Animation Settings */}
      <div className="flex items-center gap-2">
        <Button
          variant={showKeyframes ? "default" : "ghost"}
          size="sm"
          onClick={() => setShowKeyframes(!showKeyframes)}
        >
          <Film className="w-4 h-4" />
        </Button>
        
        <Button variant="ghost" size="sm">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* FPS Display */}
      <Badge variant="outline" className="font-mono">
        60 FPS
      </Badge>
    </div>
  );
};