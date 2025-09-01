import { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Environment, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useToast } from '@/hooks/use-toast';
import { ToolType, InteractionMode } from './ToolBar';

interface Tool3DProps {
  type: ToolType;
  position: [number, number, number];
  rotation: [number, number, number];
  pressure: number;
  angle: number;
  isDrawing: boolean;
  mode: InteractionMode;
}

interface CanvasSurface {
  type: 'whiteboard' | 'canvas' | 'paper';
  texture: string;
  roughness: number;
}

const Pencil3D = ({ position, rotation, pressure, angle, isDrawing, mode }: Tool3DProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const tipRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (isDrawing && tipRef.current) {
      // Simulate pencil tip wear based on pressure and lead type
      const wearFactor = pressure * 0.001;
      tipRef.current.scale.setScalar(Math.max(0.85, 1 - wearFactor));
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Pencil body - wooden shaft */}
      <mesh ref={meshRef}>
        <cylinderGeometry args={[0.04, 0.04, 1.5, 8]} />
        <meshPhysicalMaterial 
          color="#D2691E" 
          roughness={0.8}
          metalness={0.1}
          clearcoat={0.2}
        />
      </mesh>
      
      {/* Metal ferrule */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.2, 8]} />
        <meshPhysicalMaterial 
          color="#C0C0C0" 
          roughness={0.2}
          metalness={0.9}
          clearcoat={0.8}
        />
      </mesh>
      
      {/* Eraser */}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.1, 8]} />
        <meshPhysicalMaterial 
          color="#FFB6C1" 
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>
      
      {/* Pencil tip with realistic graphite */}
      <mesh ref={tipRef} position={[0, -1.0, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.02, 0.1, 8]} />
        <meshPhysicalMaterial 
          color="#2F2F2F" 
          roughness={0.3}
          metalness={0.1}
          emissive="#111111"
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* Realistic wood tip around graphite (frustum with hole) */}
      <mesh position={[0, -0.85, 0]}>
        {/* Frustum: top wide connects to body, bottom small leaves hole for graphite */}
        <cylinderGeometry args={[0.04, 0.022, 0.2, 16]} />
        <meshPhysicalMaterial 
          color="#DEB887" 
          roughness={0.8}
          metalness={0.0}
        />
      </mesh>
    </group>
  );
};

const Brush3D = ({ position, rotation, pressure, angle, isDrawing }: Tool3DProps) => {
  const brushRef = useRef<THREE.Mesh>(null);
  const bristlesRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (bristlesRef.current && isDrawing) {
      // Simulate brush bend based on pressure
      const bendAngle = pressure * 0.3;
      bristlesRef.current.rotation.x = bendAngle;
      
      // Elastic bristle physics
      bristlesRef.current.children.forEach((bristle, index) => {
        if (bristle instanceof THREE.Mesh) {
          const offset = (index % 2 - 0.5) * bendAngle * 0.5;
          bristle.rotation.x = bendAngle + offset;
        }
      });
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Brush handle */}
      <mesh ref={brushRef}>
        <cylinderGeometry args={[0.03, 0.04, 1.2, 8]} />
        <meshPhysicalMaterial 
          color="#8B4513" 
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>
      
      {/* Metal ferrule */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.04, 0.03, 0.15, 8]} />
        <meshPhysicalMaterial 
          color="#C0C0C0" 
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      
      {/* Realistic brush bristles */}
      <group ref={bristlesRef} position={[0, -0.7, 0]}>
        {Array.from({ length: 20 }, (_, i) => (
          <mesh key={i} position={[
            (Math.random() - 0.5) * 0.06,
            -Math.random() * 0.2,
            (Math.random() - 0.5) * 0.06
          ]}>
            <cylinderGeometry args={[0.001, 0.002, 0.3, 4]} />
            <meshPhysicalMaterial 
              color="#4A4A4A"
              roughness={0.8}
              metalness={0.0}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};

const DrawingSurface = ({ surfaceType }: { surfaceType: CanvasSurface['type'] }) => {
  const surfaceRef = useRef<THREE.Mesh>(null);

  const getSurfaceProperties = () => {
    switch (surfaceType) {
      case 'canvas':
        return {
          color: '#F5F5DC',
          roughness: 0.9,
          normalScale: 1.5,
        };
      case 'paper':
        return {
          color: '#FFFEF7',
          roughness: 0.8,
          normalScale: 0.8,
        };
      default: // whiteboard
        return {
          color: '#FFFFFF',
          roughness: 0.1,
          normalScale: 0.2,
        };
    }
  };

  const props = getSurfaceProperties();

  // Procedural micro-normal texture for realistic surface grain
  const normalMap = useMemo(() => {
    const size = 128;
    const data = new Uint8Array(size * size * 4);
    for (let i = 0; i < size * size; i++) {
      const v = Math.floor(128 + (Math.random() - 0.5) * 40); // subtle noise
      data[i * 4] = v;
      data[i * 4 + 1] = v;
      data[i * 4 + 2] = v;
      data[i * 4 + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(surfaceType === 'canvas' ? 20 : surfaceType === 'paper' ? 10 : 2, surfaceType === 'canvas' ? 16 : surfaceType === 'paper' ? 8 : 2);
    texture.needsUpdate = true;
    return texture;
  }, [surfaceType]);

  return (
    <mesh ref={surfaceRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
      <planeGeometry args={[20, 15]} />
      <meshPhysicalMaterial 
        color={props.color}
        roughness={props.roughness}
        metalness={0.0}
        clearcoat={surfaceType === 'whiteboard' ? 0.8 : 0.0}
        clearcoatRoughness={0.1}
        normalMap={normalMap as any}
        normalScale={new THREE.Vector2(props.normalScale, props.normalScale)}
      />
    </mesh>
  );
};

const Scene = ({ 
  activeTool, 
  pressure, 
  angle, 
  isDrawing, 
  surfaceType,
  mode
}: {
  activeTool: Tool3DProps['type'];
  pressure: number;
  angle: number;
  isDrawing: boolean;
  surfaceType: CanvasSurface['type'];
  mode: InteractionMode;
}) => {
  const { camera, raycaster, pointer, scene } = useThree();
  const [toolPosition, setToolPosition] = useState<[number, number, number]>([0, 0.5, 0]);
  const [toolVelocity, setToolVelocity] = useState<[number, number, number]>([0, 0, 0]);
  const [grabPoint, setGrabPoint] = useState<[number, number, number]>([0, 0, 0]);
  const [grabOffset, setGrabOffset] = useState<[number, number, number]>([0, 0, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<THREE.Vector3[]>([]);
  const [surfaceContactForce, setSurfaceContactForce] = useState(0);
  const [planeDragOffset, setPlaneDragOffset] = useState<[number, number]>([0, 0]);
  
  const toolRef = useRef<THREE.Group>(null);
  const intersectionPoint = useRef<THREE.Vector3>(new THREE.Vector3());
  const lastToolPosition = useRef<[number, number, number]>([0, 0.5, 0]);
  
  // Physics constants
  const GRAVITY = -0.008;
  const SURFACE_Y = -1; // Surface position
  const TOOL_LENGTH = 1.05; // Half tool length (to tip) for collision
  const ELASTIC_DAMPING = 0.85;
  const COLLISION_STIFFNESS = 0.3;
  const FRICTION = 0.95;

  const surfacePlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -SURFACE_Y), []);

  useEffect(() => {
    camera.position.set(3, 2, 3);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Physics simulation loop
  useFrame((state, delta) => {
    if (mode !== 'tool') return;

    // Calculate tool tip position
    const tipY = toolPosition[1] - TOOL_LENGTH;
    let newVelocity: [number, number, number] = [...toolVelocity];
    let newPosition: [number, number, number] = [...toolPosition];

    if (!isDragging) {
      // Apply gravity when not being dragged
      newVelocity[1] += GRAVITY;
      
      // Integrate velocity to position
      newPosition[0] += newVelocity[0] * delta;
      newPosition[1] += newVelocity[1] * delta;
      newPosition[2] += newVelocity[2] * delta;

      // Check surface collision (tool tip hits surface)
      const newTipY = newPosition[1] - TOOL_LENGTH;
      if (newTipY <= SURFACE_Y) {
        // Collision! Constrain tip to the surface
        const penetration = SURFACE_Y - newTipY;
        
        // Snap tool so tip rests on surface
        newPosition[1] = SURFACE_Y + TOOL_LENGTH;
        
        // Elastic bounce only if moving downward
        if (newVelocity[1] < 0) { // Only if moving downward
          newVelocity[1] = -newVelocity[1] * ELASTIC_DAMPING;
          
          // Collision force feedback
          const collisionForce = Math.abs(newVelocity[1]) * 10;
          setSurfaceContactForce(collisionForce);
          
          // Subtle lateral vibration
          if (collisionForce > 0.5) {
            newPosition[0] += (Math.random() - 0.5) * 0.01 * collisionForce;
            newPosition[2] += (Math.random() - 0.5) * 0.01 * collisionForce;
          }
        }
        
        // Friction when in contact
        newVelocity[0] *= FRICTION;
        newVelocity[2] *= FRICTION;
      }

      // Air resistance
      newVelocity[0] *= 0.98;
      newVelocity[1] *= 0.98;
      newVelocity[2] *= 0.98;
      
      // Update positions
      setToolPosition(newPosition);
      setToolVelocity(newVelocity);
    }

    // Store last position for velocity calculation
    lastToolPosition.current = [...newPosition];
    
    // Decay surface contact force
    setSurfaceContactForce(prev => prev * 0.9);
  });

  // Handle pointer interaction with 3D tool
  const handlePointerDown = (event: any) => {
    if (mode !== 'tool') return;
    (event as any).stopPropagation?.();

    const ray: THREE.Ray = (event as any).ray;
    const target = new THREE.Vector3();

    if (ray.intersectPlane(surfacePlane, target)) {
      // Store horizontal offset so drag feels "grabbed from anywhere"
      const offsetX = target.x - toolPosition[0];
      const offsetZ = target.z - toolPosition[2];
      setPlaneDragOffset([offsetX, offsetZ]);

      setGrabPoint([target.x, SURFACE_Y, target.z]);
      setIsDragging(true);
    }
  };

  const handlePointerMove = (event: any) => {
    if (!isDragging || mode !== 'tool') return;

    const ray: THREE.Ray = (event as any).ray;
    const target = new THREE.Vector3();

    if (ray.intersectPlane(surfacePlane, target)) {
      // Desired horizontal tool position (XZ only), keep tip constrained to surface
      const desiredX = target.x - planeDragOffset[0];
      const desiredZ = target.z - planeDragOffset[1];
      const desiredY = SURFACE_Y + TOOL_LENGTH;

      // Smooth movement to avoid jitter
      const smoothing = 0.25;
      const newToolPosition: [number, number, number] = [
        THREE.MathUtils.lerp(toolPosition[0], desiredX, smoothing),
        desiredY,
        THREE.MathUtils.lerp(toolPosition[2], desiredZ, smoothing),
      ];

      setToolPosition(newToolPosition);
      setToolVelocity([0, 0, 0]); // Reset velocity when dragging

      // Drawing when the tip touches the surface
      const tipY = newToolPosition[1] - TOOL_LENGTH;
      const isOnSurface = Math.abs(tipY - SURFACE_Y) < 0.02;
      const effectivePressure = Math.min(1, pressure + surfaceContactForce * 0.05);
      const hasPressure = effectivePressure > 0.05;

      if (isOnSurface && hasPressure) {
        const drawPoint = new THREE.Vector3(newToolPosition[0], SURFACE_Y + 0.001, newToolPosition[2]);
        setDrawingPoints((prev) => {
          const lastPoint = prev[prev.length - 1];
          if (!lastPoint || lastPoint.distanceTo(drawPoint) > 0.005) {
            return [...prev, drawPoint];
          }
          return prev;
        });
      }
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setGrabOffset([0, 0, 0]);
  };

  const renderTool = () => {
    const baseProps = {
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, angle] as [number, number, number],
      pressure: isDragging ? pressure * 1.5 : pressure,
      angle,
      isDrawing: isDragging,
      type: activeTool,
      mode
    };

    const toolComponent = (() => {
      switch (activeTool) {
        case 'pencil':
          return <Pencil3D {...baseProps} />;
        case 'brush':
          return <Brush3D {...baseProps} />;
        default:
          return <Pencil3D {...baseProps} />;
      }
    })();

    return (
      <group 
        ref={toolRef}
        position={toolPosition}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Enlarged invisible collider for easier grabbing */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.25, 1.8, 0.25]} />
          <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
        </mesh>
        {toolComponent}
      </group>
    );
  };

  // Render drawing strokes
  const renderStrokes = () => {
    if (drawingPoints.length < 2) return null;
    
    const points = drawingPoints;
    const effectivePressure = Math.min(1, pressure + surfaceContactForce * 0.05);
    const width = 2 + effectivePressure * 6; // screen-space line width
    
    return (
      <Line
        points={points}
        color="#2F2F2F"
        lineWidth={width}
        dashed={false}
      />
    );
  };

  return (
    <>
      <PerspectiveCamera makeDefault position={[3, 2, 3]} />
      <OrbitControls 
        enablePan={mode === 'camera'}
        enableZoom={mode === 'camera'}
        enableRotate={mode === 'camera'}
        maxPolarAngle={Math.PI / 2}
        minDistance={2}
        maxDistance={10}
      />
      
      <Environment preset="studio" />
      
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} />
      
      <DrawingSurface surfaceType={surfaceType} />
      {/* Invisible interaction plane for robust XZ dragging */}
      <mesh
        position={[0, SURFACE_Y + 0.0005, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {renderTool()}
      {renderStrokes()}
      
      {/* Studio environment elements */}
      <mesh position={[8, 3, 0]} rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[0.1, 6, 0.1]} />
        <meshPhysicalMaterial color="#8B4513" roughness={0.8} />
      </mesh>
    </>
  );
};

interface ArtCanvas3DProps {
  activeTool: Tool3DProps['type'];
  surfaceType: CanvasSurface['type'];
  pressure: number;
  angle: number;
  mode: InteractionMode;
}

export const ArtCanvas3D = ({ activeTool, surfaceType, pressure, angle, mode }: ArtCanvas3DProps) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: "3D Art Studio Ready",
      description: "Your realistic drawing tools are loaded and ready to create!",
    });
  }, [toast]);

  return (
    <div className="w-full h-full relative canvas-surface rounded-lg overflow-hidden">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance"
        }}
        onPointerDown={() => setIsDrawing(true)}
        onPointerUp={() => setIsDrawing(false)}
        onPointerLeave={() => setIsDrawing(false)}
      >
        <Suspense fallback={null}>
          <Scene 
            activeTool={activeTool}
            pressure={pressure}
            angle={angle}
            isDrawing={isDrawing}
            surfaceType={surfaceType}
            mode={mode}
          />
        </Suspense>
      </Canvas>
      
      {/* 3D Canvas overlay info */}
      <div className="absolute top-4 left-4 ui-panel rounded-lg p-3">
        <div className="text-sm font-medium text-foreground">
          Tool: {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Pressure: {Math.round(pressure * 100)}% | Angle: {Math.round(angle * 57.3)}°
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4 ui-panel rounded-lg p-3">
        <div className="text-xs text-muted-foreground">
          Scroll: Adjust Pressure | Click+Drag: Rotate View
        </div>
      </div>
    </div>
  );
};