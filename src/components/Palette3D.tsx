import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Palette, X } from 'lucide-react';

interface Color3D {
  id: string;
  color: string;
  viscosity: number;
  dryingTime: number;
  opacity: number;
  position: [number, number, number];
  amount: number;
}

interface Palette3DProps {
  isOpen: boolean;
  onClose: () => void;
}

const PaletteColors = ({ colors }: { colors: Color3D[] }) => {
  return (
    <group position={[0, 0.01, 0]}>
      {colors.map((color) => (
        <mesh key={color.id} position={color.position}>
          <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
          <meshPhysicalMaterial 
            color={color.color}
            roughness={0.4}
            metalness={0.0}
            transmission={1 - color.opacity}
            ior={1.5}
          />
        </mesh>
      ))}
    </group>
  );
};

const PaletteBase = () => {
  return (
    <group>
      {/* Main palette surface */}
      <mesh>
        <cylinderGeometry args={[1.2, 1.2, 0.05, 32]} />
        <meshPhysicalMaterial 
          color="#FFFFFF"
          roughness={0.2}
          metalness={0.0}
          clearcoat={0.8}
        />
      </mesh>
      
      {/* Palette rim */}
      <mesh position={[0, 0.03, 0]}>
        <torusGeometry args={[1.2, 0.05, 8, 32]} />
        <meshPhysicalMaterial 
          color="#F5F5F5"
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
};

export const Palette3DCanvas = ({ isOpen, onClose }: Palette3DProps) => {
  const [colors] = useState<Color3D[]>([
    { id: '1', color: '#FF0000', viscosity: 0.8, dryingTime: 30, opacity: 0.9, position: [0.3, 0, 0.3], amount: 1.0 },
    { id: '2', color: '#00FF00', viscosity: 0.7, dryingTime: 25, opacity: 0.9, position: [-0.3, 0, 0.3], amount: 1.0 },
    { id: '3', color: '#0000FF', viscosity: 0.8, dryingTime: 35, opacity: 0.9, position: [0.3, 0, -0.3], amount: 1.0 },
    { id: '4', color: '#FFFF00', viscosity: 0.6, dryingTime: 20, opacity: 0.9, position: [-0.3, 0, -0.3], amount: 1.0 },
    { id: '5', color: '#FFFFFF', viscosity: 0.9, dryingTime: 40, opacity: 1.0, position: [0, 0, 0.5], amount: 1.0 },
    { id: '6', color: '#000000', viscosity: 0.5, dryingTime: 15, opacity: 1.0, position: [0, 0, -0.5], amount: 1.0 },
  ]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
      <Card className="w-96 h-96 ui-panel">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            <h3 className="font-semibold">3D Paint Palette</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="h-80 relative">
          {/* 3D palette would be rendered here with Three.js */}
          <div className="w-full h-full bg-gradient-to-br from-muted/20 to-muted/40 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Palette className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">3D Palette Simulation</p>
              <p className="text-xs text-muted-foreground">Mix colors with realistic physics</p>
            </div>
          </div>
          
          {/* Color mixing controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background/95">
            <div className="grid grid-cols-6 gap-2">
              {colors.map((color) => (
                <button
                  key={color.id}
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.color }}
                  title={`Opacity: ${color.opacity}, Viscosity: ${color.viscosity}`}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const PaletteButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="tool-transition"
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
  );
};