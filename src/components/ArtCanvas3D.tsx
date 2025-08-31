import { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Environment } from '@react-three/drei';
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

  useFrame((state, delta) => {
    if (meshRef.current && isDrawing) {
      // Realistic pencil physics with elastic dampening
      const elasticForce = 0.02 * pressure;
      const dampening = 0.85;
      
      meshRef.current.rotation.z += (angle - meshRef.current.rotation.z) * 0.1;
      meshRef.current.position.y = position[1] - (pressure * 0.05);
      
      // Simulate pencil tip wear based on pressure and lead type
      if (tipRef.current) {
        const wearFactor = pressure * 0.001;
        tipRef.current.scale.setScalar(Math.max(0.8, 1 - wearFactor));
      }
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
      <mesh ref={tipRef} position={[0, -0.75, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.02, 0.1, 8]} />
        <meshPhysicalMaterial 
          color="#2F2F2F" 
          roughness={0.3}
          metalness={0.1}
          emissive="#111111"
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* Realistic wood tip around graphite */}
      <mesh position={[0, -0.7, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.04, 0.2, 8]} />
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
  
  const toolRef = useRef<THREE.Group>(null);
  const intersectionPoint = useRef<THREE.Vector3>(new THREE.Vector3());
  const lastToolPosition = useRef<[number, number, number]>([0, 0.5, 0]);
  
  // Physics constants
  const GRAVITY = -0.008;
  const SURFACE_Y = -1; // Surface position
  const TOOL_LENGTH = 0.75; // Half tool length for tip calculation
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
    const [currX, currY, currZ] = toolPosition;
    const [lastX, lastY, lastZ] = lastToolPosition.current;
    
    // Calculate velocity
    const velocityX = (currX - lastX) / delta;
    const velocityY = (currY - lastY) / delta;
    const velocityZ = (currZ - lastZ) / delta;
    
    let newVelocity: [number, number, number] = [velocityX, velocityY, velocityZ];
    let newPosition: [number, number, number] = [...toolPosition];

    if (!isDragging) {
      // Apply gravity when not being dragged
      newVelocity[1] += GRAVITY;
      
      // Apply velocity to position
      newPosition[0] += newVelocity[0] * delta;
      newPosition[1] += newVelocity[1] * delta;
      newPosition[2] += newVelocity[2] * delta;

      // Check surface collision (tool tip hits surface)
      const newTipY = newPosition[1] - TOOL_LENGTH;
      if (newTipY <= SURFACE_Y) {
        // Collision! Apply surface constraint and elastic dampening
        const penetration = SURFACE_Y - newTipY;
        
        // Push tool back to surface
        newPosition[1] = SURFACE_Y + TOOL_LENGTH;
        
        // Apply elastic collision response
        if (newVelocity[1] < 0) { // Only if moving downward
          newVelocity[1] = -newVelocity[1] * ELASTIC_DAMPING;
          
          // Apply collision force feedback
          const collisionForce = Math.abs(newVelocity[1]) * 10;
          setSurfaceContactForce(collisionForce);
          
          // Create vibration effect based on collision force
          if (collisionForce > 0.5) {
            newPosition[0] += (Math.random() - 0.5) * 0.01 * collisionForce;
            newPosition[2] += (Math.random() - 0.5) * 0.01 * collisionForce;
          }
        }
        
        // Apply friction to horizontal movement when in contact
        newVelocity[0] *= FRICTION;
        newVelocity[2] *= FRICTION;
      }

      // Apply air resistance
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

    // Precise ray from the event
    const rc = new THREE.Raycaster();
    rc.ray.copy((event as any).ray);

    // Only consider intersections with the tool itself
    const intersects = toolRef.current ? rc.intersectObject(toolRef.current, true) : [];

    if (intersects.length > 0) {
      const hit = intersects[0];
      const point = hit.point;

      // Calculate grab offset from tool center
      const offset: [number, number, number] = [
        point.x - toolPosition[0],
        point.y - toolPosition[1],
        point.z - toolPosition[2],
      ];

      setGrabPoint([point.x, point.y, point.z]);
      setGrabOffset(offset);
      setIsDragging(true);

      // Store grab physics for realistic tool behavior
      intersectionPoint.current.copy(point);
    }
  };

  const handlePointerMove = (event: any) => {
    if (!isDragging || mode !== 'tool') return;

    const ray: THREE.Ray = (event as any).ray;
    const target = new THREE.Vector3();

    // Intersect the ray with the drawing surface plane for precise cursor tracking
    if (ray.intersectPlane(surfacePlane, target)) {
      // Apply grab physics - different behavior based on where tool was grabbed
      const grabHeight = grabOffset[1];
      const tipInfluence = Math.max(0, 1 - Math.abs(grabHeight + 0.5) * 2); // Stronger near tip

      // Calculate realistic tool positioning with surface constraint
      let targetY = target.y + 0.1 + tipInfluence * 0.2;

      // Apply surface constraint - tool tip cannot go below surface
      const minY = SURFACE_Y + TOOL_LENGTH; // tip on the surface
      if (targetY < minY) {
        targetY = minY;
        // Apply pressure feedback when constrained to surface
        setSurfaceContactForce((prev) => Math.max(prev, Math.abs(targetY - (target.y + 0.1)) * 5));
      }

      const newToolPosition: [number, number, number] = [
        target.x - grabOffset[0],
        targetY,
        target.z - grabOffset[2],
      ];

      setToolPosition(newToolPosition);
      setToolVelocity([0, 0, 0]); // Reset velocity when dragging

      // Add drawing point if tool tip is touching surface with pressure
      const tipY = newToolPosition[1] - TOOL_LENGTH;
      const isOnSurface = Math.abs(tipY - SURFACE_Y) < 0.01;
      const hasPressure = pressure > 0.05;

      if (isOnSurface && hasPressure && tipInfluence > 0.3) {
        const drawPoint = new THREE.Vector3(newToolPosition[0], SURFACE_Y + 0.001, newToolPosition[2]);
        setDrawingPoints((prev) => {
          // Avoid duplicate points too close together
          const lastPoint = prev[prev.length - 1];
          if (!lastPoint || lastPoint.distanceTo(drawPoint) > 0.01) {
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
      position: toolPosition,
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {toolComponent}
      </group>
    );
  };

  // Render drawing strokes
  const renderStrokes = () => {
    if (drawingPoints.length < 2) return null;
    
    const points = drawingPoints;
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    return (
      <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ 
        color: "#2F2F2F", 
        linewidth: 2 
      }))} />
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