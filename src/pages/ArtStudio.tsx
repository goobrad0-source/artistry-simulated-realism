import { useState, useEffect, useCallback } from 'react';
import { ArtCanvas3D } from '@/components/ArtCanvas3D';
import { ToolPanel } from '@/components/ToolPanel';
import { ToolBar, RightSidebar, ToolType, InteractionMode } from '@/components/ToolBar';
import { Timeline } from '@/components/Timeline';
import { Palette3DCanvas } from '@/components/Palette3D';
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
  X,
  User,
  HelpCircle,
  BookOpen
} from 'lucide-react';

type SurfaceType = 'whiteboard' | 'canvas' | 'paper';

export const ArtStudio = () => {
  const [activeTool, setActiveTool] = useState<ToolType>('pencil');
  const [surfaceType, setSurfaceType] = useState<SurfaceType>('canvas');
  const [pressure, setPressure] = useState(0.5);
  const [angle, setAngle] = useState(0);
  const [roll, setRoll] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showToolPanel, setShowToolPanel] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mode, setMode] = useState<InteractionMode>('tool');
  const [showPalette, setShowPalette] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(30);
  
  const { engine, calculatePressureResponse, getState } = usePhysicsEngine();
  const { toast } = useToast();

  // Enhanced pressure/gravity control with scroll wheel
  const [gravity, setGravity] = useState(0.5); // 0 = lifting off paper, 1 = max pressure
  
  const handleWheelPressure = useCallback((event: WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.05 : 0.05;
    const newGravity = Math.max(-0.2, Math.min(1.0, gravity + delta)); // Allow negative for lift-off
    setGravity(newGravity);
    
    // Calculate actual pressure based on gravity
    if (newGravity <= 0) {
      setPressure(0); // Lift off paper completely
    } else {
      setPressure(newGravity);
    }
    
    // Haptic feedback simulation
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [gravity]);

  // Advanced keyboard shortcuts for professional workflow
  const handleKeyboard = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    
    switch (key) {
      case ' ':
        event.preventDefault();
        setMode(mode === 'tool' ? 'camera' : 'tool');
        toast({ 
          title: `${mode === 'tool' ? 'Camera' : 'Tool'} Mode`, 
          description: `Switched to ${mode === 'tool' ? 'camera navigation' : 'tool interaction'}` 
        });
        break;
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
      case 'c':
        setActiveTool('crayon');
        toast({ title: "Crayon Tool", description: "Wax crayon selected" });
        break;
      case 'm':
        setActiveTool('mechanicalPencil');
        toast({ title: "Mechanical Pencil", description: "Precision mechanical pencil selected" });
        break;
      case 'delete':
      case 'backspace':
        setActiveTool('eraser');
        toast({ title: "Eraser Tool", description: "3D eraser with physics selected" });
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
      case 'q':
        setRoll(Math.max(-45, roll - 5));
        toast({ title: "Roll Left", description: `Pencil roll: ${roll - 5}°` });
        break;
      case 'e':
        if (!event.altKey) {
          setRoll(Math.min(45, roll + 5));
          toast({ title: "Roll Right", description: `Pencil roll: ${roll + 5}°` });
        }
        break;
      case 'tab':
        event.preventDefault();
        setShowToolPanel(!showToolPanel);
        break;
    }
  }, [toast, isFullscreen, showToolPanel, mode, roll]);

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
      case 'crayon':
        engine.updateState({ mass: 0.08, elasticity: 0.6, damping: 0.6 });
        break;
      case 'mechanicalPencil':
        engine.updateState({ mass: 0.04, elasticity: 1.4, damping: 0.9 });
        break;
      case 'eraser':
        engine.updateState({ mass: 0.03, elasticity: 0.9, damping: 0.8 });
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
    <div className="h-screen w-screen bg-background overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="h-16 ui-panel border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="font-mono text-xs">
            QUANTUM ART STUDIO
          </Badge>
          <Badge variant="outline">
            {activeTool.toUpperCase()} - {mode.toUpperCase()}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <User className="w-4 h-4" />
            Sign In
          </Button>
          
          <Button variant="ghost" size="sm">
            <HelpCircle className="w-4 h-4" />
            Help
          </Button>
          
          <Button variant="ghost" size="sm">
            <BookOpen className="w-4 h-4" />
            Tutorial
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          <Button variant="ghost" size="sm">
            <Save className="w-4 h-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tool Bar */}
        <ToolBar
          activeTool={activeTool}
          onToolChange={handleToolChange}
          mode={mode}
          onModeChange={setMode}
          isLeftPanelOpen={showToolPanel}
          onToggleLeftPanel={() => setShowToolPanel(!showToolPanel)}
          onOpenPalette={() => setShowPalette(true)}
        />

        {/* Left Tool Panel (Collapsible) */}
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
          <ArtCanvas3D
            activeTool={activeTool}
            surfaceType={surfaceType}
            pressure={pressure}
            gravity={gravity}
            angle={angle}
            roll={roll}
            mode={mode}
          />
        </div>

        {/* Right Sidebar */}
        <RightSidebar />
      </div>

      {/* Timeline */}
      <Timeline
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        currentTime={currentTime}
        duration={duration}
        onTimeChange={setCurrentTime}
      />

      {/* 3D Palette Modal */}
      <Palette3DCanvas 
        isOpen={showPalette}
        onClose={() => setShowPalette(false)}
      />

      {/* Status Bar */}
      <div className="absolute bottom-20 left-0 right-0 h-6 ui-panel/90 backdrop-blur-sm border-t border-border flex items-center justify-between px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Mode: {mode} | Physics: {isPlaying ? 'ACTIVE' : 'PAUSED'}</span>
          <span>Surface: {surfaceType} | Gravity: {Math.round(gravity * 100)}% | Roll: {roll}°</span>
          {gravity <= 0 && <span className="text-primary">✈️ LIFTED OFF</span>}
        </div>
        <div className="flex items-center gap-4">
          <span>SPACE=Switch Mode | P=Pencil | B=Brush | E=Eraser</span>
          <span>Q/E=Roll | Scroll=Pressure | Ctrl+S=Save</span>
        </div>
      </div>
    </div>
  );
};