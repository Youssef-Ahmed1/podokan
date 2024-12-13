import { useState, useCallback, useRef } from 'react';

export const useDesignPosition = ({
  initialPosition = { x: 50, y: 30 },
  initialScale = 0.5,
  productType = 't-shirt',
  disabled = false
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [scale, setScale] = useState(initialScale);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef(position);

  // Get boundaries based on product type
  const getBoundaries = useCallback(() => {
    const boundaries = {
      't-shirt': { x: [30, 70], y: [20, 40] },
      'hoodie': { x: [35, 65], y: [25, 45] },
      'long-sleeve': { x: [30, 70], y: [20, 40] }
    };
    return boundaries[productType] || boundaries['t-shirt'];
  }, [productType]);

  // Check if position is within boundaries
  const checkBoundaries = useCallback((pos) => {
    const bounds = getBoundaries();
    return pos.x >= bounds.x[0] && 
           pos.x <= bounds.x[1] && 
           pos.y >= bounds.y[0] && 
           pos.y <= bounds.y[1];
  }, [getBoundaries]);

  // Handle drag start
  const handleDragStart = useCallback((e) => {
    if (disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - (positionRef.current.x * rect.width / 100),
      y: e.clientY - (positionRef.current.y * rect.height / 100)
    };

    // Add event listeners
    const handleMouseMove = (moveEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const newPosition = {
        x: ((moveEvent.clientX - dragStartRef.current.x) / rect.width) * 100,
        y: ((moveEvent.clientY - dragStartRef.current.y) / rect.height) * 100
      };

      // Clamp position within boundaries
      const bounds = getBoundaries();
      const clampedPosition = {
        x: Math.max(bounds.x[0], Math.min(bounds.x[1], newPosition.x)),
        y: Math.max(bounds.y[0], Math.min(bounds.y[1], newPosition.y))
      };

      setPosition(clampedPosition);
      positionRef.current = clampedPosition;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [disabled, getBoundaries]);

  // Handle scale change
  const handleScaleChange = useCallback((newScale) => {
    const MIN_SCALE = 0.1;
    const MAX_SCALE = 1;
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    setScale(clampedScale);
  }, []);

  // Center the design
  const centerDesign = useCallback(() => {
    const centeredPosition = {
      x: 50,
      y: 30
    };
    setPosition(centeredPosition);
    positionRef.current = centeredPosition;
    setScale(0.5);
  }, []);

  // Check if current position is out of bounds
  const isOutOfBounds = useCallback(() => {
    return !checkBoundaries(position);
  }, [position, checkBoundaries]);

  // Update position from external changes
  const updatePosition = useCallback((newPosition) => {
    setPosition(newPosition);
    positionRef.current = newPosition;
  }, []);

  // Reset to initial state
  const reset = useCallback(() => {
    setPosition(initialPosition);
    positionRef.current = initialPosition;
    setScale(initialScale);
    setIsDragging(false);
  }, [initialPosition, initialScale]);

  return {
    position,
    scale,
    isDragging,
    isOutOfBounds: isOutOfBounds(),
    handleDragStart,
    handleScaleChange,
    updatePosition,
    centerDesign,
    reset,
    bounds: getBoundaries()
  };
};