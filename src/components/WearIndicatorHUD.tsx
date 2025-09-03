import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { LeadTip } from './LeadTipPhysics';
import { ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';

interface WearIndicatorHUDProps {
  avgWear: number;
  wearVertices: { position: THREE.Vector3; wear: number }[];
  isVisible: boolean;
  onToggle: () => void;
  onZoomTip: () => void;
}

export const WearIndicatorHUD = ({ 
  avgWear, 
  wearVertices, 
  isVisible, 
  onToggle, 
  onZoomTip 
}: WearIndicatorHUDProps) => {
  const [showTipZoom, setShowTipZoom] = useState(false);
  
  const getWearColor = (wear: number) => {
    if (wear < 0.2) return 'hsl(120, 70%, 50%)'; // Green - fresh
    if (wear < 0.5) return 'hsl(60, 70%, 50%)';  // Yellow - moderate
    if (wear < 0.8) return 'hsl(30, 70%, 50%)';  // Orange - high
    return 'hsl(0, 70%, 50%)';                   // Red - very worn
  };
  
  const getWearStatus = (wear: number) => {
    if (wear < 0.2) return 'Fresh';
    if (wear < 0.5) return 'Moderate';
    if (wear < 0.8) return 'High Wear';
    return 'Critical';
  };

  const TipZoomView = () => (
    <div className="absolute inset-4 ui-panel rounded-lg border-2 border-primary/20 bg-background/95 backdrop-blur-sm">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <ZoomIn className="w-4 h-4" />
            Lead Tip Detail View
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowTipZoom(false)}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex-1 relative">
          <Canvas className="w-full h-full">
            <PerspectiveCamera makeDefault position={[0, 0, 0.15]} />
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              maxDistance={0.3}
              minDistance={0.05}
            />
            
            <ambientLight intensity={1.2} />
            <directionalLight position={[1, 1, 1]} intensity={1.5} />
            <pointLight position={[-1, -1, 1]} intensity={0.8} />
            
            {/* Zoomed in lead tip */}
            <LeadTip
              position={[0, 0, 0]}
              rotation={[0, 0, 0]}
              pressure={0}
              isDrawing={false}
              surfaceY={-0.05}
              onContact={() => {}}
              onWearUpdate={() => {}}
            />
            
            {/* Wear visualization particles */}
            {wearVertices.map((vertex, i) => vertex.wear > 0.1 && (
              <mesh key={i} position={vertex.position.toArray()}>
                <sphereGeometry args={[0.001 * (1 + vertex.wear * 2)]} />
                <meshBasicMaterial 
                  color={getWearColor(vertex.wear)}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            ))}
          </Canvas>
          
          <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">
            Drag to rotate • Wheel to zoom • {wearVertices.filter(v => v.wear > 0.1).length} wear points
          </div>
        </div>
      </div>
    </div>
  );

  if (!isVisible && !showTipZoom) return null;

  return (
    <>
      {/* Main HUD */}
      {isVisible && (
        <Card className="absolute top-4 right-4 w-72 ui-panel/95 backdrop-blur-sm border border-border/50">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Info className="w-4 h-4" />
                Lead Tip Wear
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onToggle}
              >
                ×
              </Button>
            </div>
            
            {/* Wear Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall Wear</span>
                <Badge 
                  variant="secondary" 
                  style={{ backgroundColor: getWearColor(avgWear) + '20', color: getWearColor(avgWear) }}
                >
                  {getWearStatus(avgWear)}
                </Badge>
              </div>
              <Progress 
                value={avgWear * 100} 
                className="h-2"
                style={{ 
                  '--progress-background': getWearColor(avgWear) 
                } as React.CSSProperties}
              />
              <div className="text-xs text-muted-foreground">
                {Math.round(avgWear * 100)}% worn • {wearVertices.filter(v => v.wear > 0.1).length} affected vertices
              </div>
            </div>
            
            {/* Wear Distribution */}
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Wear Distribution</span>
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: 16 }, (_, i) => {
                  const wearLevel = wearVertices[i]?.wear || 0;
                  return (
                    <div
                      key={i}
                      className="aspect-square rounded-sm border border-border/30"
                      style={{
                        backgroundColor: wearLevel > 0.05 
                          ? getWearColor(wearLevel) + '60'
                          : 'transparent'
                      }}
                    />
                  );
                })}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowTipZoom(true)}
                className="flex-1"
              >
                <ZoomIn className="w-3 h-3 mr-1" />
                Zoom View
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  // Reset wear would go here
                }}
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
            
            {/* Performance tip */}
            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
              💡 High wear affects drawing smoothness. Consider sharpening or replacing the lead.
            </div>
          </div>
        </Card>
      )}
      
      {/* Tip Zoom Modal */}
      {showTipZoom && <TipZoomView />}
    </>
  );
};