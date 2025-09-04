import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToolType } from './ToolBar';
import { 
  Pencil, 
  Brush, 
  PenTool, 
  Palette, 
  Settings,
  RotateCw,
  Zap,
  Layers,
  Scissors,
  Eraser as EraserIcon
} from 'lucide-react';

interface ToolPanelProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  pressure: number;
  onPressureChange: (pressure: number) => void;
  angle: number;
  onAngleChange: (angle: number) => void;
  surfaceType: 'whiteboard' | 'canvas' | 'paper';
  onSurfaceChange: (surface: 'whiteboard' | 'canvas' | 'paper') => void;
}

export const ToolPanel = ({
  activeTool,
  onToolChange,
  pressure,
  onPressureChange,
  angle,
  onAngleChange,
  surfaceType,
  onSurfaceChange
}: ToolPanelProps) => {
  const [leadHardness, setLeadHardness] = useState(2); // 0=8B (soft) to 4=4H (hard)
  const [brushSize, setBrushSize] = useState(5);
  const [paintType, setPaintType] = useState<'oil' | 'acrylic' | 'watercolor'>('oil');
  const [damping, setDamping] = useState(0.85);
  const [elasticity, setElasticity] = useState(1.2);

  const tools = [
    { id: 'pencil' as const, icon: Pencil, name: 'Pencil', description: 'Realistic graphite pencil' },
    { id: 'mechanicalPencil' as const, icon: Scissors, name: 'Mechanical Pencil', description: 'Precision mechanical pencil' },
    { id: 'pen' as const, icon: PenTool, name: 'Pen', description: 'Professional ink pen' },
    { id: 'brush' as const, icon: Brush, name: 'Brush', description: 'Artist paint brush' },
    { id: 'crayon' as const, icon: Palette, name: 'Crayon', description: 'Wax crayon tool' },
    { id: 'eraser' as const, icon: EraserIcon, name: 'Eraser', description: '3D eraser with wear' },
  ];

  const surfaces = [
    { id: 'whiteboard' as const, name: 'Whiteboard', texture: 'Smooth, glossy surface' },
    { id: 'canvas' as const, name: 'Canvas', texture: 'Textured art canvas' },
    { id: 'paper' as const, name: 'Paper', texture: 'Fine drawing paper' }
  ];

  const leadTypes = ['8B', '6B', '4B', '2B', 'HB', '2H', '4H'];

  return (
    <Card className="w-80 h-full ui-panel custom-scrollbar overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Tool Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Settings className="w-4 h-4" />
            3D Tools
          </h3>
          <div className="grid gap-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.id}
                  variant={activeTool === tool.id ? "default" : "secondary"}
                  onClick={() => onToolChange(tool.id)}
                  className="w-full justify-start h-auto p-3 tool-transition"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-xs text-muted-foreground">{tool.description}</div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Tool Properties */}
        <Tabs defaultValue="physics" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="physics">Physics</TabsTrigger>
            <TabsTrigger value="surface">Surface</TabsTrigger>
          </TabsList>

          <TabsContent value="physics" className="space-y-4 mt-4">
            {/* Pressure Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Pressure
                </label>
                <Badge variant="secondary">{Math.round(pressure * 100)}%</Badge>
              </div>
              <Slider
                value={[pressure]}
                onValueChange={(value) => onPressureChange(value[0])}
                max={1}
                min={0.1}
                step={0.01}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Scroll wheel to adjust during drawing
              </p>
            </div>

            {/* Angle Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <RotateCw className="w-4 h-4" />
                  Angle
                </label>
                <Badge variant="secondary">{Math.round(angle * 57.3)}°</Badge>
              </div>
              <Slider
                value={[angle]}
                onValueChange={(value) => onAngleChange(value[0])}
                max={Math.PI / 2}
                min={-Math.PI / 2}
                step={0.01}
                className="w-full"
              />
            </div>

            {/* Physics Properties */}
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Elastic Damping</label>
                <Slider
                  value={[damping]}
                  onValueChange={(value) => setDamping(value[0])}
                  max={1}
                  min={0.5}
                  step={0.01}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Controls tool bounce and stability
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Elastic Force</label>
                <Slider
                  value={[elasticity]}
                  onValueChange={(value) => setElasticity(value[0])}
                  max={2}
                  min={0.5}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Azimuth force response sensitivity
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="surface" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Surface Type</h4>
              <div className="grid gap-2">
                {surfaces.map((surface) => (
                  <Button
                    key={surface.id}
                    variant={surfaceType === surface.id ? "default" : "secondary"}
                    onClick={() => onSurfaceChange(surface.id)}
                    className="w-full justify-start h-auto p-3"
                  >
                    <div className="text-left">
                      <div className="font-medium">{surface.name}</div>
                      <div className="text-xs text-muted-foreground">{surface.texture}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Quick Actions */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              Sharpen Pencil
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              Clean Brush
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              Mix Paint
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              New Canvas
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};