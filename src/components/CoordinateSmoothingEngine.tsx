import * as THREE from 'three';

export interface SmoothPoint {
  position: THREE.Vector2; // 2D surface coordinates
  pressure: number;
  surfaceHeight: number; // 3D surface variation at this point
  friction: number; // Surface friction coefficient
}

export class CoordinateSmoothingEngine {
  private history: SmoothPoint[] = [];
  private readonly maxHistoryLength = 10;
  private readonly smoothingRadius = 0.01;
  
  // Convert 3D collision points to smooth 2D drawing coordinates
  convertTo2D(
    collision3D: THREE.Vector3, 
    pressure: number, 
    paperTopology: THREE.Mesh
  ): SmoothPoint {
    // Raycast downward to get exact surface height and normal
    const raycaster = new THREE.Raycaster();
    raycaster.set(
      new THREE.Vector3(collision3D.x, collision3D.y + 1, collision3D.z),
      new THREE.Vector3(0, -1, 0)
    );
    
    const intersects = raycaster.intersectObject(paperTopology);
    let surfaceHeight = collision3D.y;
    let surfaceNormal = new THREE.Vector3(0, 1, 0);
    let friction = 0.8; // Default paper friction
    
    if (intersects.length > 0) {
      const intersection = intersects[0];
      surfaceHeight = intersection.point.y;
      surfaceNormal = intersection.face?.normal || new THREE.Vector3(0, 1, 0);
      
      // Calculate friction based on surface angle and texture
      const surfaceAngle = surfaceNormal.angleTo(new THREE.Vector3(0, 1, 0));
      friction = 0.6 + (1 - surfaceAngle / Math.PI) * 0.4;
      
      // Add micro-texture variation
      const textureNoise = this.getTextureNoise(intersection.point.x, intersection.point.z);
      friction += textureNoise * 0.1;
    }
    
    const smoothPoint: SmoothPoint = {
      position: new THREE.Vector2(collision3D.x, collision3D.z),
      pressure,
      surfaceHeight,
      friction: Math.max(0.3, Math.min(1.0, friction))
    };
    
    return this.applySmoothingFilter(smoothPoint);
  }
  
  // Apply temporal smoothing to reduce jitter
  private applySmoothingFilter(point: SmoothPoint): SmoothPoint {
    this.history.push(point);
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
    
    if (this.history.length < 3) return point;
    
    // Weighted average with more weight on recent points
    let totalWeight = 0;
    let smoothedX = 0;
    let smoothedZ = 0;
    let smoothedPressure = 0;
    let smoothedFriction = 0;
    
    for (let i = 0; i < this.history.length; i++) {
      const weight = Math.pow(2, i); // Exponential weighting
      const historyPoint = this.history[i];
      
      smoothedX += historyPoint.position.x * weight;
      smoothedZ += historyPoint.position.y * weight;
      smoothedPressure += historyPoint.pressure * weight;
      smoothedFriction += historyPoint.friction * weight;
      totalWeight += weight;
    }
    
    return {
      position: new THREE.Vector2(smoothedX / totalWeight, smoothedZ / totalWeight),
      pressure: smoothedPressure / totalWeight,
      surfaceHeight: point.surfaceHeight, // Keep current height
      friction: smoothedFriction / totalWeight
    };
  }
  
  // Generate procedural paper texture noise for realistic friction variation
  private getTextureNoise(x: number, z: number): number {
    // Multi-octave noise for realistic paper texture
    const scale1 = 100; // Fine grain
    const scale2 = 20;  // Medium grain  
    const scale3 = 5;   // Coarse grain
    
    const noise1 = Math.sin(x * scale1) * Math.cos(z * scale1) * 0.4;
    const noise2 = Math.sin(x * scale2) * Math.cos(z * scale2) * 0.3;
    const noise3 = Math.sin(x * scale3) * Math.cos(z * scale3) * 0.3;
    
    return (noise1 + noise2 + noise3) * 0.5 + 0.5; // Normalize to 0-1
  }
  
  // Convert smooth 2D coordinates back to 3D for stroke rendering
  convertTo3D(smoothPoint: SmoothPoint): THREE.Vector3 {
    return new THREE.Vector3(
      smoothPoint.position.x,
      smoothPoint.surfaceHeight + 0.001, // Slightly above surface
      smoothPoint.position.y
    );
  }
  
  // Generate SVG-like smooth path from points
  generateSmoothPath(points: SmoothPoint[]): {
    pathData: string;
    controlPoints: THREE.Vector2[];
  } {
    if (points.length < 2) {
      return { pathData: '', controlPoints: [] };
    }
    
    const controlPoints: THREE.Vector2[] = [];
    let pathData = `M ${points[0].position.x} ${points[0].position.y}`;
    
    if (points.length === 2) {
      pathData += ` L ${points[1].position.x} ${points[1].position.y}`;
      return { pathData, controlPoints };
    }
    
    // Create smooth Bezier curves between points
    for (let i = 1; i < points.length - 1; i++) {
      const p0 = points[i - 1].position;
      const p1 = points[i].position;
      const p2 = points[i + 1].position;
      
      // Calculate control points for smooth curve
      const tension = 0.3; // Curve smoothness
      const cp1 = new THREE.Vector2(
        p1.x + (p0.x - p2.x) * tension,
        p1.y + (p0.y - p2.y) * tension
      );
      const cp2 = new THREE.Vector2(
        p1.x - (p0.x - p2.x) * tension,
        p1.y - (p0.y - p2.y) * tension
      );
      
      controlPoints.push(cp1, cp2);
      
      if (i === 1) {
        pathData += ` Q ${cp1.x} ${cp1.y} ${p1.x} ${p1.y}`;
      } else {
        pathData += ` S ${cp2.x} ${cp2.y} ${p1.x} ${p1.y}`;
      }
    }
    
    // Add final point
    const lastPoint = points[points.length - 1].position;
    pathData += ` L ${lastPoint.x} ${lastPoint.y}`;
    
    return { pathData, controlPoints };
  }
  
  clear() {
    this.history = [];
  }
}