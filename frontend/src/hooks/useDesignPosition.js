import { useState, useRef, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';

export const useDesignPosition = ({
  initialPosition = { x: 50, y: 25 },
  initialScale = 1,
  productType = 't-shirt',
  disabled = false
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [scale, setScale] = useState(initialScale);
  const [isDragging, setIsDragging] = useState(false);
  const [isOutOfBounds, setIsOutOfBounds] = useState(false);
  
  const containerRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const designPosRef = useRef({ x: 0, y: 0 });

  // Update position when initial values change
  useEffect(() => {
    setPosition(initialPosition);
    setScale(initialScale);
  }, [initialPosition, initialScale]);

  // Check if position is within bounds
  const checkBounds = useCallback((pos) => {
    const bounds = {
      't-shirt': { x: [30, 70], y: [15, 35] },
      'hoodie': { x: [30, 70], y: [20, 40] },
      'long-sleeves': { x: [30, 70], y: [15, 35] }
    };

    const productBounds = bounds[productType] || bounds['t-shirt'];
    return pos.x >= productBounds.x[0] && 
           pos.x <= productBounds.x[1] && 
           pos.y >= productBounds.y[0] && 
           pos.y <= productBounds.y[1];
  }, [productType]);

  // Handle mouse movement
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || disabled) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPosition = {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    };

    setPosition(newPosition);
    setIsOutOfBounds(!checkBounds(newPosition));
  }, [isDragging, disabled, checkBounds]);

  // Handle drag start
  const handleDragStart = useCallback((e) => {
    if (disabled) return;
    
    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    designPosRef.current = position;

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [disabled, position, handleMouseMove]);

  // Handle scale change
  const handleScaleChange = useCallback((newScale) => {
    if (disabled) return;
    setScale(Math.max(0.1, Math.min(2, newScale)));
  }, [disabled]);

  // Center design
  const centerDesign = useCallback(() => {
    if (disabled) return;
    setPosition({ x: 50, y: 25 });
    setScale(1);
  }, [disabled]);

  return {
    containerRef,
    position,
    scale,
    isDragging,
    isOutOfBounds,
    handleDragStart,
    handleScaleChange,
    centerDesign
  };
};