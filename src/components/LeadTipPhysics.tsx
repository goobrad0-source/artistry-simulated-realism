import * as THREE from 'three';
import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';

export interface LeadVertex {
  position: THREE.Vector3;
  originalPosition: THREE.Vector3;
  wear: number; // 0 = no wear, 1 = completely worn
  hardness: number; // resistance to wear
}

export interface ContactPoint {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  area: number;
  pressure: number;
}

export class LeadTipGeometry {
  vertices: LeadVertex[] = [];
  mesh: THREE.Mesh;
  geometry: THREE.BufferGeometry;
  
  constructor(radius = 0.02, height = 0.1, segments = 16) {
    this.generateInitialGeometry(radius, height, segments);
    this.createMesh();
  }

  private generateInitialGeometry(radius: number, height: number, segments: number) {
    // Create cone-like LED tip with individual vertices
    this.vertices = [];
    
    // Tip vertex (point of cone) - pointing DOWN for correct orientation
    this.vertices.push({
      position: new THREE.Vector3(0, 0, 0),
      originalPosition: new THREE.Vector3(0, 0, 0),
      wear: 0,
      hardness: 0.7 // Tip is softer
    });

    // Base circle vertices
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      this.vertices.push({
        position: new THREE.Vector3(x, height, z),
        originalPosition: new THREE.Vector3(x, height, z),
        wear: 0,
        hardness: 0.9 // Base is harder
      });
    }

    // Create intermediate rings for more realistic wear
    const rings = 3;
    for (let ring = 1; ring <= rings; ring++) {
      const ringHeight = (height * ring) / (rings + 1);
      const ringRadius = radius * (1 - ring / (rings + 1));
      
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * ringRadius;
        const z = Math.sin(angle) * ringRadius;
        
        this.vertices.push({
          position: new THREE.Vector3(x, ringHeight, z),
          originalPosition: new THREE.Vector3(x, ringHeight, z),
          wear: 0,
          hardness: 0.8
        });
      }
    }
  }

  private createMesh() {
    this.updateGeometry();
  }

  updateGeometry() {
    const positions: number[] = [];
    const indices: number[] = [];
    
    // Add vertices
    this.vertices.forEach(vertex => {
      positions.push(vertex.position.x, vertex.position.y, vertex.position.z);
    });

    // Create faces (simplified triangulation)
    const segments = Math.floor((this.vertices.length - 1) / 4); // Approximate
    for (let i = 0; i < segments; i++) {
      const base1 = 1 + i;
      const base2 = 1 + ((i + 1) % segments);
      
      // Triangle from tip to base edge
      indices.push(0, base1, base2);
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.setIndex(indices);
    this.geometry.computeVertexNormals();
    
    if (!this.mesh) {
      const material = new THREE.MeshPhysicalMaterial({
        color: '#2F2F2F',
        roughness: 0.3,
        metalness: 0.1,
        emissive: '#111111',
        emissiveIntensity: 0.1
      });
      this.mesh = new THREE.Mesh(this.geometry, material);
    } else {
      this.mesh.geometry.dispose();
      this.mesh.geometry = this.geometry;
    }
  }

  // Advanced collision detection with surface
  checkCollisionWithSurface(surfaceY: number, toolWorldMatrix: THREE.Matrix4): ContactPoint[] {
    const contacts: ContactPoint[] = [];
    
    this.vertices.forEach(vertex => {
      // Transform vertex to world space
      const worldPos = vertex.position.clone().applyMatrix4(toolWorldMatrix);
      
      // Check if vertex is below surface
      if (worldPos.y <= surfaceY + 0.001) {
        const penetration = surfaceY - worldPos.y;
        const contact: ContactPoint = {
          position: new THREE.Vector3(worldPos.x, surfaceY, worldPos.z),
          normal: new THREE.Vector3(0, 1, 0),
          area: Math.PI * 0.001 * 0.001, // Small contact area per vertex
          pressure: Math.max(0, penetration * 100) // Convert penetration to pressure
        };
        contacts.push(contact);
      }
    });

    return contacts;
  }

  // Apply wear based on contact with enhanced realism
  applyWear(contacts: ContactPoint[], toolWorldMatrix: THREE.Matrix4, wearRate: number = 0.001) {
    const inverseMatrix = toolWorldMatrix.clone().invert();
    
    contacts.forEach(contact => {
      // Find all vertices within wear radius for more realistic wear
      const wearRadius = 0.008;
      const affectedVertices: { vertex: LeadVertex; distance: number; influence: number }[] = [];
      
      this.vertices.forEach(vertex => {
        const worldPos = vertex.position.clone().applyMatrix4(toolWorldMatrix);
        const distance = worldPos.distanceTo(contact.position);
        if (distance < wearRadius) {
          const influence = 1 - (distance / wearRadius); // Falloff
          affectedVertices.push({ vertex, distance, influence });
        }
      });

      // Apply wear to all affected vertices
      affectedVertices.forEach(({ vertex, influence }) => {
        // Enhanced wear calculation with material properties
        const pressureFactor = Math.pow(contact.pressure, 1.2); // Non-linear pressure response
        const hardnessFactor = 1 / Math.pow(vertex.hardness, 0.8);
        const wearAmount = pressureFactor * wearRate * hardnessFactor * influence * 0.1;
        
        vertex.wear = Math.min(1, vertex.wear + wearAmount);
        
        // Realistic wear deformation - lead wears away creating flat spots
        const wearDirection = contact.normal.clone().multiplyScalar(-1); // Wear in direction of contact
        const lateralWear = new THREE.Vector3(
          (Math.random() - 0.5) * 0.001 * vertex.wear,
          0,
          (Math.random() - 0.5) * 0.001 * vertex.wear
        );
        
        const totalWearOffset = wearDirection
          .multiplyScalar(vertex.wear * 0.015)
          .add(lateralWear);
          
        vertex.position.copy(vertex.originalPosition).add(totalWearOffset);
        
        // Create flat spots where heavy wear occurs
        if (vertex.wear > 0.3) {
          const flatteningFactor = (vertex.wear - 0.3) * 0.02;
          vertex.position.y += flatteningFactor;
        }
      });
    });

    // Update geometry after wear
    this.updateGeometry();
  }

  // Calculate contact shape for drawing
  getContactShape(contacts: ContactPoint[]): {
    center: THREE.Vector3;
    area: number;
    shape: 'point' | 'line' | 'oval';
    orientation: number;
  } {
    if (contacts.length === 0) {
      return {
        center: new THREE.Vector3(),
        area: 0,
        shape: 'point',
        orientation: 0
      };
    }

    // Calculate centroid
    const center = new THREE.Vector3();
    contacts.forEach(contact => center.add(contact.position));
    center.divideScalar(contacts.length);

    // Calculate total area
    const totalArea = contacts.reduce((sum, contact) => sum + contact.area, 0);

    // Determine shape based on contact distribution
    let shape: 'point' | 'line' | 'oval' = 'point';
    let orientation = 0;

    if (contacts.length > 1) {
      // Calculate principal axis of contacts
      const positions = contacts.map(c => c.position.clone().sub(center));
      let sumX2 = 0, sumZ2 = 0, sumXZ = 0;
      
      positions.forEach(pos => {
        sumX2 += pos.x * pos.x;
        sumZ2 += pos.z * pos.z;
        sumXZ += pos.x * pos.z;
      });

      const ratio = Math.sqrt(sumX2 / sumZ2);
      if (ratio > 2 || ratio < 0.5) {
        shape = 'line';
        orientation = Math.atan2(sumXZ, sumX2 - sumZ2) * 0.5;
      } else if (contacts.length > 3) {
        shape = 'oval';
        orientation = Math.atan2(sumXZ, sumX2 - sumZ2) * 0.5;
      }
    }

    return { center, area: totalArea, shape, orientation };
  }

  dispose() {
    this.geometry?.dispose();
  }
}

export interface LeadTipProps {
  position: [number, number, number];
  rotation: [number, number, number];
  pressure: number;
  isDrawing: boolean;
  surfaceY: number;
  toolWorldMatrix?: THREE.Matrix4; // Add tool's world transformation
  onContact: (contacts: ContactPoint[], shape: any) => void;
  onWearUpdate?: (avgWear: number, vertices: { position: THREE.Vector3; wear: number }[]) => void;
}

export const LeadTip = ({ position, rotation, pressure, isDrawing, surfaceY, toolWorldMatrix, onContact, onWearUpdate }: LeadTipProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const leadGeometryRef = useRef<LeadTipGeometry>();
  
  // Initialize lead geometry
  const leadGeometry = useMemo(() => {
    leadGeometryRef.current = new LeadTipGeometry();
    return leadGeometryRef.current;
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;

    // Always update the mesh world matrix
    meshRef.current.updateMatrixWorld();

    // Use the tool's world matrix if provided, otherwise use the mesh's world matrix
    const worldMatrix = toolWorldMatrix || meshRef.current.matrixWorld;

    // Check collisions using the proper world matrix - even when not drawing for visualization
    const contacts = leadGeometry.checkCollisionWithSurface(surfaceY, worldMatrix);
    
    if (contacts.length > 0) {
      // Only apply wear when actually drawing
      if (isDrawing) {
        leadGeometry.applyWear(contacts, worldMatrix, pressure * 0.002);
      }
      
      // Get contact shape for drawing
      const contactShape = leadGeometry.getContactShape(contacts);
      
      // Always notify parent component of contacts (for visualization)
      onContact(contacts, contactShape);

      // Report wear metrics to parent
      if (onWearUpdate) {
        const avgWear = leadGeometry.vertices.reduce((sum, v) => sum + v.wear, 0) / leadGeometry.vertices.length;
        const snapshot = leadGeometry.vertices.map(v => ({ position: v.position.clone(), wear: v.wear }));
        onWearUpdate(avgWear, snapshot);
      }
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={position} rotation={rotation} geometry={leadGeometry.geometry}>
        <meshPhysicalMaterial 
          color="#2F2F2F" 
          roughness={0.3}
          metalness={0.1}
          emissive="#111111"
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* Debug visualization of contact points */}
      {leadGeometry.vertices.map((vertex, i) => vertex.wear > 0.1 && (
        <mesh key={i} position={vertex.position} scale={[0.002, 0.002, 0.002]}>
          <sphereGeometry args={[1]} />
          <meshBasicMaterial color={`hsl(${60 - vertex.wear * 60}, 100%, 50%)`} />
        </mesh>
      ))}
    </group>
  );
};