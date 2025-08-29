import { useMemo } from 'react';

export interface PhysicsState {
  position: [number, number, number];
  velocity: [number, number, number];
  acceleration: [number, number, number];
  pressure: number;
  angle: number;
  elasticity: number;
  damping: number;
  mass: number;
}

export interface ToolPhysics {
  pencil: {
    leadHardness: number; // 0-6 (8B to 4H)
    tipSharpness: number; // 0-1
    wearRate: number;
    mass: number;
  };
  brush: {
    bristleStiffness: number;
    paintLoad: number;
    bristleCount: number;
    tipSize: number;
    hairElasticity: number;
    rigidity: number;
    dampness: number;
    bristleShape: 'round' | 'flat' | 'filbert' | 'fan' | 'detail';
  };
  pen: {
    inkFlow: number;
    tipMaterial: 'ballpoint' | 'gel' | 'fountain' | 'marker' | 'fineliner';
    pressure: number;
  };
  crayon: {
    waxHardness: number;
    pigmentDensity: number;
    meltingPoint: number;
    mass: number;
  };
  mechanicalPencil: {
    leadSize: number; // 0.3, 0.5, 0.7, 0.9, 2.0mm
    leadHardness: number;
    clickMechanism: boolean;
    leadExtension: number;
  };
  eraser: {
    material: 'rubber' | 'vinyl' | 'kneaded' | 'gum';
    hardness: number;
    wearRate: number;
    residueProduction: number;
    mass: number;
  };
}

export class ArtPhysicsEngine {
  private state: PhysicsState;
  private toolProperties: ToolPhysics;
  
  constructor() {
    this.state = {
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      acceleration: [0, 0, 0],
      pressure: 0.5,
      angle: 0,
      elasticity: 1.2,
      damping: 0.85,
      mass: 1.0
    };

    this.toolProperties = {
      pencil: {
        leadHardness: 2, // HB
        tipSharpness: 0.8,
        wearRate: 0.001,
        mass: 0.05
      },
      brush: {
        bristleStiffness: 0.5,
        paintLoad: 0.8,
        bristleCount: 50,
        tipSize: 5,
        hairElasticity: 0.7,
        rigidity: 0.6,
        dampness: 0.3,
        bristleShape: 'round'
      },
      pen: {
        inkFlow: 0.7,
        tipMaterial: 'ballpoint',
        pressure: 0.6
      },
      crayon: {
        waxHardness: 0.4,
        pigmentDensity: 0.8,
        meltingPoint: 45,
        mass: 0.08
      },
      mechanicalPencil: {
        leadSize: 0.5,
        leadHardness: 2,
        clickMechanism: true,
        leadExtension: 0.0
      },
      eraser: {
        material: 'rubber',
        hardness: 0.6,
        wearRate: 0.002,
        residueProduction: 0.1,
        mass: 0.03
      }
    };
  }

  // Calculate realistic pencil lead hardness effects
  calculateLeadProperties(hardness: number) {
    const hardnessScale = ['8B', '6B', '4B', '2B', 'HB', '2H', '4H'];
    const currentLead = hardnessScale[hardness] || 'HB';
    
    // Softer leads (lower index) wear faster and create darker marks
    const wearRate = Math.max(0.0005, 0.003 - (hardness * 0.0004));
    const darkness = Math.max(0.2, 1.0 - (hardness * 0.12));
    const softness = Math.max(0.1, 1.0 - (hardness * 0.15));
    
    return {
      leadType: currentLead,
      wearRate,
      darkness,
      softness,
      lineWidth: 0.5 + (softness * 2)
    };
  }

  // Calculate brush physics with realistic bristle behavior
  calculateBrushPhysics(pressure: number, velocity: number, paintLoad: number) {
    const brush = this.toolProperties.brush;
    
    // Bristle bending based on pressure and velocity
    const bristleBend = Math.min(Math.PI / 4, pressure * velocity * 0.1);
    
    // Paint flow rate affected by pressure and paint viscosity
    const flowRate = paintLoad * pressure * 0.05;
    
    // Bristle spread based on pressure
    const bristleSpread = Math.min(2.0, 1.0 + (pressure * 0.8));
    
    return {
      bristleBend,
      flowRate,
      bristleSpread,
      paintDepletion: flowRate * 0.02
    };
  }

  // Simulate elastic damping forces for realistic tool behavior
  applyElasticDamping(
    currentPosition: [number, number, number],
    targetPosition: [number, number, number],
    velocity: [number, number, number],
    deltaTime: number
  ): { 
    newPosition: [number, number, number]; 
    newVelocity: [number, number, number] 
  } {
    const springConstant = this.state.elasticity * 10;
    const damping = this.state.damping;
    
    // Calculate spring forces
    const springForce: [number, number, number] = [
      (targetPosition[0] - currentPosition[0]) * springConstant,
      (targetPosition[1] - currentPosition[1]) * springConstant,
      (targetPosition[2] - currentPosition[2]) * springConstant
    ];
    
    // Apply damping to velocity
    const dampedVelocity: [number, number, number] = [
      velocity[0] * damping,
      velocity[1] * damping,
      velocity[2] * damping
    ];
    
    // Calculate new velocity with spring force
    const newVelocity: [number, number, number] = [
      dampedVelocity[0] + (springForce[0] / this.state.mass) * deltaTime,
      dampedVelocity[1] + (springForce[1] / this.state.mass) * deltaTime,
      dampedVelocity[2] + (springForce[2] / this.state.mass) * deltaTime
    ];
    
    // Calculate new position
    const newPosition: [number, number, number] = [
      currentPosition[0] + newVelocity[0] * deltaTime,
      currentPosition[1] + newVelocity[1] * deltaTime,
      currentPosition[2] + newVelocity[2] * deltaTime
    ];
    
    return { newPosition, newVelocity };
  }

  // Calculate surface interaction effects
  calculateSurfaceInteraction(
    surfaceType: 'whiteboard' | 'canvas' | 'paper',
    toolType: 'pencil' | 'brush' | 'pen',
    pressure: number
  ) {
    const surfaceProperties = {
      whiteboard: { friction: 0.1, absorption: 0.0, texture: 0.05 },
      canvas: { friction: 0.8, absorption: 0.6, texture: 0.9 },
      paper: { friction: 0.6, absorption: 0.4, texture: 0.3 }
    };
    
    const surface = surfaceProperties[surfaceType];
    
    // Tool behaves differently on different surfaces
    const effectiveResistance = surface.friction * pressure;
    const markIntensity = Math.min(1.0, pressure * (1 - surface.absorption * 0.3));
    const textureEffect = surface.texture * 0.1;
    
    return {
      resistance: effectiveResistance,
      markIntensity,
      textureVariation: textureEffect,
      bleedingEffect: surface.absorption * 0.2
    };
  }

  // Advanced pressure sensitivity with exponential response curve
  calculatePressureResponse(rawPressure: number, sensitivity: number = 2.5): number {
    // Apply exponential curve for natural pressure feel
    const curve = Math.pow(rawPressure, 1 / sensitivity);
    
    // Add slight randomness for organic feel
    const organic = curve + (Math.random() - 0.5) * 0.02;
    
    return Math.max(0.01, Math.min(1.0, organic));
  }

  // Tool angle calculations with azimuth forces
  calculateToolAngle(
    mousePosition: [number, number],
    lastPosition: [number, number],
    currentAngle: number,
    lockAngle: boolean = false
  ): number {
    if (lockAngle) return currentAngle;
    
    // Calculate movement direction
    const deltaX = mousePosition[0] - lastPosition[0];
    const deltaY = mousePosition[1] - lastPosition[1];
    
    if (Math.abs(deltaX) < 0.001 && Math.abs(deltaY) < 0.001) {
      return currentAngle; // No movement, keep current angle
    }
    
    // Calculate target angle from movement direction  
    const targetAngle = Math.atan2(deltaY, deltaX);
    
    // Smooth angle transition with damping
    const angleDifference = targetAngle - currentAngle;
    const smoothedAngle = currentAngle + angleDifference * 0.15;
    
    return smoothedAngle;
  }

  updateState(newState: Partial<PhysicsState>) {
    this.state = { ...this.state, ...newState };
  }

  getState(): PhysicsState {
    return { ...this.state };
  }

  getToolProperties(): ToolPhysics {
    return { ...this.toolProperties };
  }
}

// Custom hook for using the physics engine
export const usePhysicsEngine = () => {
  const engine = useMemo(() => new ArtPhysicsEngine(), []);
  
  return {
    engine,
    calculateLeadProperties: engine.calculateLeadProperties.bind(engine),
    calculateBrushPhysics: engine.calculateBrushPhysics.bind(engine),
    applyElasticDamping: engine.applyElasticDamping.bind(engine),
    calculateSurfaceInteraction: engine.calculateSurfaceInteraction.bind(engine),
    calculatePressureResponse: engine.calculatePressureResponse.bind(engine),
    calculateToolAngle: engine.calculateToolAngle.bind(engine),
    updateState: engine.updateState.bind(engine),
    getState: engine.getState.bind(engine),
    getToolProperties: engine.getToolProperties.bind(engine)
  };
};