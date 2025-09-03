import { useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

export interface DrawingStroke {
  id: string;
  points: THREE.Vector3[];
  pressure: number;
  toolType: string;
  color: string;
  timestamp: number;
  width: number;
  opacity: number;
}

export interface StrokePoint {
  position: THREE.Vector3;
  pressure: number;
  timestamp: number;
  velocity: number;
}

export const useDrawingStrokeSystem = () => {
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const lastPoint = useRef<THREE.Vector3 | null>(null);
  const lastTimestamp = useRef<number>(0);

  const startStroke = useCallback((
    position: THREE.Vector3, 
    pressure: number, 
    toolType: string, 
    color: string = '#2F2F2F'
  ) => {
    const newStroke: DrawingStroke = {
      id: `stroke_${Date.now()}_${Math.random()}`,
      points: [position.clone()],
      pressure,
      toolType,
      color,
      timestamp: Date.now(),
      width: calculateWidth(pressure, toolType),
      opacity: calculateOpacity(pressure, toolType)
    };
    
    setCurrentStroke(newStroke);
    lastPoint.current = position.clone();
    lastTimestamp.current = Date.now();
  }, []);

  const addPointToStroke = useCallback((
    position: THREE.Vector3, 
    pressure: number
  ) => {
    if (!currentStroke) return;

    const now = Date.now();
    const velocity = lastPoint.current 
      ? position.distanceTo(lastPoint.current) / Math.max(1, now - lastTimestamp.current)
      : 0;

    // Only add point if it's far enough from last point for smooth curves
    if (!lastPoint.current || lastPoint.current.distanceTo(position) > 0.003) {
      setCurrentStroke(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          points: [...prev.points, position.clone()],
          // Update stroke properties based on current pressure (not stored pressure)
          width: calculateWidth(pressure, prev.toolType),
          opacity: calculateOpacity(pressure, prev.toolType)
        };
      });
      
      lastPoint.current = position.clone();
      lastTimestamp.current = now;
    }
  }, [currentStroke]);

  const endStroke = useCallback(() => {
    if (currentStroke && currentStroke.points.length > 1) {
      setStrokes(prev => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
    lastPoint.current = null;
    lastTimestamp.current = 0;
  }, [currentStroke]);

  const clearStrokes = useCallback(() => {
    setStrokes([]);
    setCurrentStroke(null);
    lastPoint.current = null;
  }, []);

  return {
    strokes,
    currentStroke,
    startStroke,
    addPointToStroke,
    endStroke,
    clearStrokes
  };
};

// Helper functions for tool-specific calculations
const calculateWidth = (pressure: number, toolType: string): number => {
  const baseWidth = getBaseWidth(toolType);
  
  switch (toolType) {
    case 'pencil':
    case 'mechanicalPencil':
      // Pencils maintain constant width, only darkness changes
      return baseWidth;
    case 'brush':
      // Brushes vary width with pressure
      return baseWidth * (0.5 + pressure * 1.5);
    case 'pen':
      return baseWidth * (0.8 + pressure * 0.4);
    case 'crayon':
      return baseWidth * (0.7 + pressure * 0.8);
    default:
      return baseWidth;
  }
};

const calculateOpacity = (pressure: number, toolType: string): number => {
  switch (toolType) {
    case 'pencil':
    case 'mechanicalPencil':
      // Pencils get darker with pressure (more graphite deposited)
      return Math.min(1, 0.3 + pressure * 0.7);
    case 'brush':
      return Math.min(1, 0.5 + pressure * 0.5);
    case 'pen':
      return Math.min(1, 0.7 + pressure * 0.3);
    case 'crayon':
      return Math.min(1, 0.4 + pressure * 0.6);
    default:
      return Math.min(1, 0.3 + pressure * 0.7);
  }
};

const getBaseWidth = (toolType: string): number => {
  switch (toolType) {
    case 'pencil': return 1.5;
    case 'mechanicalPencil': return 0.8;
    case 'pen': return 1.2;
    case 'brush': return 3.0;
    case 'crayon': return 2.5;
    default: return 1.5;
  }
};