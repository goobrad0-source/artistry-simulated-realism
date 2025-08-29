import { useState, useEffect, useCallback } from 'react';
import { ArtCanvas3D } from '@/components/ArtCanvas3D';
import { ToolPanel } from '@/components/ToolPanel';
import { usePhysicsEngine } from '@/components/PhysicsEngine';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Save, 
  Share2, 
  Maximize2,
  Menu,
  X
} from 'lucide-react';

type ToolType = 'pencil' | 'pen' | 'brush';
type SurfaceType = 'whiteboard' | 'canvas' | 'paper';

export const ArtStudio = () => {
  const [activeTool, setActiveTool] = useState<ToolType>('pencil');
  const [surfaceType, setSurfaceType] = useState<SurfaceType>('canvas');
  const [pressure, setPressure] = useState(0.5);
  const [angle, setAngle] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showToolPanel, setShowToolPanel] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const { engine, calculatePressureResponse, getState } = usePhysicsEngine();
  const { toast } = useToast();

  // Enhanced pressure sensitivity with scroll wheel
  const handleWheelPressure = useCallback((event: WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.05 : 0.05;
    const newPressure = Math.max(0.1, Math.min(1.0, pressure + delta));
    setPressure(calculatePressureResponse(newPressure, 2.5));
    
    // Haptic feedback simulation
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [pressure, calculatePressureResponse]);

  // Advanced keyboard shortcuts for professional workflow
  const handleKeyboard = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    
    switch (key) {
      case 'p':
        setActiveTool('pencil');
        toast({ title: "Pencil Tool", description: "Realistic graphite pencil selected" });
        break;
      case 'b':
        setActiveTool('brush');
        toast({ title: "Brush Tool", description: "Artist paint brush selected" });
        break;
      case 'n':
        setActiveTool('pen');
        toast({ title: "Pen Tool", description: "Professional ink pen selected" });
        break;
      case '1':
        setSurfaceType('whiteboard');
        break;
      case '2':
        setSurfaceType('canvas');
        break;
      case '3':
        setSurfaceType('paper');
        break;
      case 'r':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Reset canvas
          toast({ title: "Canvas Reset", description: "Starting fresh!" });
        }
        break;
      case 's':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          toast({ title: "Saved", description: "Your artwork has been saved" });
        }
        break;
      case 'f':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          setIsFullscreen(!isFullscreen);
        }
        break;
      case 'tab':
        event.preventDefault();
        setShowToolPanel(!showToolPanel);
        break;
    }
  }, [toast, isFullscreen, showToolPanel]);

  useEffect(() => {
    window.addEventListener('wheel', handleWheelPressure, { passive: false });
    window.addEventListener('keydown', handleKeyboard);
    
    return () => {
      window.removeEventListener('wheel', handleWheelPressure);
      window.removeEventListener('keydown', handleKeyboard);
    };
  }, [handleWheelPressure, handleKeyboard]);

  // Physics simulation loop
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      const state = getState();
      // Update physics state based on current tool interaction
      engine.updateState({
        pressure: calculatePressureResponse(pressure),
        angle: angle
      });
    }, 16); // 60fps physics simulation
    
    return () => clearInterval(interval);
  }, [isPlaying, engine, pressure, angle, calculatePressureResponse, getState]);

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    
    // Tool-specific physics adjustments
    switch (tool) {
      case 'pencil':
        engine.updateState({ mass: 0.05, elasticity: 1.2, damping: 0.85 });
        break;
      case 'brush':
        engine.updateState({ mass: 0.08, elasticity: 0.8, damping: 0.7 });
        break;
      case 'pen':
        engine.updateState({ mass: 0.03, elasticity: 1.5, damping: 0.9 });
        break;
    }
  };

  const handleSurfaceChange = (surface: SurfaceType) => {
    setSurfaceType(surface);
    toast({
      title: `${surface.charAt(0).toUpperCase() + surface.slice(1)} Selected`,
      description: "Surface texture will affect tool behavior"
    });
  };

  return (
    <div className="h-screen w-screen bg-background overflow-hidden flex">
      {/* Tool Panel */}
      <div className={`transition-all duration-300 ${showToolPanel ? 'w-80' : 'w-0'} overflow-hidden`}>
        <ToolPanel
          activeTool={activeTool}
          onToolChange={handleToolChange}
          pressure={pressure}
          onPressureChange={setPressure}
          angle={angle}
          onAngleChange={setAngle}
          surfaceType={surfaceType}
          onSurfaceChange={handleSurfaceChange}
        />
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="h-16 ui-panel border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowToolPanel(!showToolPanel)}
            >
              {showToolPanel ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                QUANTUM ART STUDIO
              </Badge>
              <Badge variant="outline">
                {activeTool.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <Button variant="ghost" size="sm">
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="sm">
              <Save className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="sm">
              <Share2 className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="flex-1 p-4">
          <ArtCanvas3D
            activeTool={activeTool}
            surfaceType={surfaceType}
            pressure={pressure}
            angle={angle}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-8 ui-panel border-t border-border flex items-center justify-between px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Physics: {isPlaying ? 'ACTIVE' : 'PAUSED'}</span>
          <span>Surface: {surfaceType}</span>
          <span>Pressure: {Math.round(pressure * 100)}%</span>
        </div>
        <div className="flex items-center gap-4">
          <span>P=Pencil | B=Brush | N=Pen | Tab=Tools</span>
          <span>Scroll=Pressure | Ctrl+S=Save</span>
        </div>
      </div>
    </div>
  );
};