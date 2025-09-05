import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Pencil, 
  Brush, 
  PenTool, 
  Eraser,
  Palette,
  Layers,
  MessageSquare,
  Settings,
  FileImage,
  Database,
  ChevronLeft,
  ChevronRight,
  Scissors
} from 'lucide-react';

export type ToolType = 'pencil' | 'pen' | 'brush' | 'crayon' | 'mechanicalPencil' | 'eraser';
export type InteractionMode = 'tool' | 'camera';

interface ToolBarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  mode: InteractionMode;
  onModeChange: (mode: InteractionMode) => void;
  isLeftPanelOpen: boolean;
  onToggleLeftPanel: () => void;
  onOpenPalette: () => void;
}

const tools = [
  { id: 'pencil' as const, icon: Pencil, name: 'Pencil', color: '#8B4513' },
  { id: 'mechanicalPencil' as const, icon: Scissors, name: 'Mechanical Pencil', color: '#A0A0A0' },
  { id: 'pen' as const, icon: PenTool, name: 'Pen', color: '#000080' },
  { id: 'brush' as const, icon: Brush, name: 'Brush', color: '#8B0000' },
  { id: 'crayon' as const, icon: Palette, name: 'Crayon', color: '#FF6347' },
  { id: 'eraser' as const, icon: Eraser, name: 'Eraser', color: '#FFB6C1' },
];

export const ToolBar = ({
  activeTool,
  onToolChange,
  mode,
  onModeChange,
  isLeftPanelOpen,
  onToggleLeftPanel,
  onOpenPalette
}: ToolBarProps) => {
  return (
    <div className="w-16 h-full ui-panel border-r border-border flex flex-col relative z-20 pointer-events-auto">
      {/* Panel Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleLeftPanel}
        className="m-2 h-12 w-12 p-0"
        title={isLeftPanelOpen ? "Collapse Panel" : "Expand Panel"}
      >
        {isLeftPanelOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </Button>

      {/* Tools */}
      <div className="space-y-1 px-2 flex-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Button
              key={tool.id}
              variant={activeTool === tool.id ? "default" : "ghost"}
              size="sm"
              onClick={() => onToolChange(tool.id)}
              className="w-12 h-12 p-0 tool-transition"
              title={tool.name}
            >
              <Icon 
                className="w-5 h-5" 
                style={{ 
                  color: activeTool === tool.id ? 'currentColor' : tool.color 
                }}
              />
            </Button>
          );
        })}

        {/* Palette Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenPalette}
          className="w-12 h-12 p-0 tool-transition"
          title="3D Palette"
        >
          <svg 
            className="w-5 h-5" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17C15.24 5.06 14.28 5 13.26 5C10.54 5 8.04 5.4 5.97 6.12C3.59 6.98 2 9.15 2 11.65V21C2 21.55 2.45 22 3 22H5C5.55 22 6 21.55 6 21V12.5C7.25 12.17 8.58 12 9.97 12C11.36 12 12.69 12.17 13.94 12.5L17 15.5L19 13.5L21 9ZM9 16C7.9 16 7 16.9 7 18S7.9 20 9 20 11 19.1 11 18 10.1 16 9 16Z" 
              fill="currentColor"
            />
          </svg>
        </Button>
      </div>

      {/* Mode Switch Indicator */}
      <div className="p-2 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          <div>SPACE</div>
          <div>Switch</div>
        </div>
      </div>
    </div>
  );
};

export const RightSidebar = () => {
  const panels = [
    { id: 'chat', icon: MessageSquare, name: 'AI Chat' },
    { id: 'layers', icon: Layers, name: 'Layers' },
    { id: 'assets', icon: FileImage, name: 'Assets' },
    { id: 'properties', icon: Settings, name: 'Properties' },
    { id: 'apis', icon: Database, name: 'APIs' },
  ];

  return (
    <div className="w-16 h-full ui-panel border-l border-border flex flex-col">
      <div className="space-y-1 px-2 py-4">
        {panels.map((panel) => {
          const Icon = panel.icon;
          return (
            <Button
              key={panel.id}
              variant="ghost"
              size="sm"
              className="w-12 h-12 p-0 tool-transition"
              title={panel.name}
            >
              <Icon className="w-5 h-5" />
            </Button>
          );
        })}
      </div>
    </div>
  );
};