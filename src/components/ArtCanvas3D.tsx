import { useRef, useState, useEffect, Suspense } from 'react';
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

const Pencil3D = ({ position, rotation, pressure, angle, isDrawing }: Tool3DProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const tipRef = useRef<THREE.Mesh>(null);

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
      <mesh ref={tipRef} position={[0, -0.75, 0]}>
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
      <mesh position={[0, -0.7, 0]}>
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
          color="#Silver" 
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
          normalScale: 2.0,
          bumpScale: 0.05
        };
      case 'paper':
        return {
          color: '#FFFEF7',
          roughness: 0.8,
          normalScale: 1.0,
          bumpScale: 0.02
        };
      default: // whiteboard
        return {
          color: '#FFFFFF',
          roughness: 0.1,
          normalScale: 0.1,
          bumpScale: 0.001
        };
    }
  };

  const props = getSurfaceProperties();

  return (
    <mesh ref={surfaceRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
      <planeGeometry args={[20, 15]} />
      <meshPhysicalMaterial 
        color={props.color}
        roughness={props.roughness}
        metalness={0.0}
        clearcoat={surfaceType === 'whiteboard' ? 0.8 : 0.0}
        clearcoatRoughness={0.1}
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
  const { camera } = useThree();
  const [toolPosition, setToolPosition] = useState<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    // Position camera for optimal art creation view
    camera.position.set(3, 2, 3);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  const renderTool = () => {
    const baseProps = {
      position: toolPosition,
      rotation: [0, 0, angle] as [number, number, number],
      pressure,
      angle,
      isDrawing,
      type: activeTool,
      mode
    };

    switch (activeTool) {
      case 'pencil':
        return <Pencil3D {...baseProps} />;
      case 'brush':
        return <Brush3D {...baseProps} />;
      default:
        return <Pencil3D {...baseProps} />;
    }
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