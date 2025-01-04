// hooks/useDesignPosition.js

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  DESIGN_BOUNDARIES,
  DESIGN_SCALE,
  DEFAULT_POSITION,
  validateDesignPosition
} from '../components/Admin/ProductApproval/constants/productConfig';

export const useDesignPosition = ({
  productType = 'hoodie',
  productView = 'front',
  initialPosition = DEFAULT_POSITION,
  initialScale = DESIGN_SCALE.default,
  disabled = false,
  onChange
} = {}) => {
  // State
  const [position, setPosition] = useState(initialPosition);
  const [scale, setScale] = useState(initialScale);
  const [isDragging, setIsDragging] = useState(false);
  const [isOutOfBounds, setIsOutOfBounds] = useState(false);

  // Refs for drag handling
  const dragStartRef = useRef(null);
  const positionRef = useRef(position);

  // Validate and update position
  const updatePosition = useCallback((newPosition, newScale = scale) => {
    const { isValid, boundaries } = validateDesignPosition(newPosition, productType, productView);
    
    if (isValid) {
      setPosition(newPosition);
      positionRef.current = newPosition;
      setIsOutOfBounds(false);
      
      if (onChange) {
        onChange({ position: newPosition, scale: newScale });
      }
    } else {
      setIsOutOfBounds(true);
      
      // Clamp position to boundaries
      const clampedPosition = {
        x: Math.max(boundaries.x.min, Math.min(boundaries.x.max, newPosition.x)),
        y: Math.max(boundaries.y.min, Math.min(boundaries.y.max, newPosition.y))
      };
      
      setPosition(clampedPosition);
      positionRef.current = clampedPosition;
      
      if (onChange) {
        onChange({ position: clampedPosition, scale: newScale });
      }
    }
  }, [scale, productType, productView, onChange]);

  // Handle scale changes
  const handleScaleChange = useCallback((newScale) => {
    const clampedScale = Math.max(
      DESIGN_SCALE.min,
      Math.min(DESIGN_SCALE.max, newScale)
    );
    
    setScale(clampedScale);
    updatePosition(position, clampedScale);
  }, [position, updatePosition]);

  // Center the design
  const centerDesign = useCallback(() => {
    const boundaries = DESIGN_BOUNDARIES[productType][productView];
    const centerPosition = {
      x: (boundaries.x.min + boundaries.x.max) / 2,
      y: (boundaries.y.min + boundaries.y.max) / 2
    };
    updatePosition(centerPosition, scale);
  }, [productType, productView, scale, updatePosition]);

  // Reset to defaults
  const reset = useCallback(() => {
    setScale(DESIGN_SCALE.default);
    updatePosition(DEFAULT_POSITION, DESIGN_SCALE.default);
  }, [updatePosition]);

  // Drag handling
  const handleDragStart = useCallback((e) => {
    if (disabled || !e.currentTarget) return;
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    setIsDragging(true);
    
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPosition: { ...positionRef.current }
    };

    const handleMouseMove = (moveEvent) => {
      if (!dragStartRef.current) return;

      const deltaX = ((moveEvent.clientX - dragStartRef.current.startX) / rect.width) * 100;
      const deltaY = ((moveEvent.clientY - dragStartRef.current.startY) / rect.height) * 100;

      const newPosition = {
        x: dragStartRef.current.initialPosition.x + deltaX,
        y: dragStartRef.current.initialPosition.y + deltaY
      };

      updatePosition(newPosition, scale);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [disabled, scale, updatePosition]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (isDragging) {
        window.removeEventListener('mousemove', () => {});
        window.removeEventListener('mouseup', () => {});
      }
    };
  }, [isDragging]);

  return {
    position,
    scale,
    isDragging,
    isOutOfBounds,
    handleDragStart,
    handleScaleChange,
    updatePosition,
    centerDesign,
    reset,
    boundaries: DESIGN_BOUNDARIES[productType][productView]
  };
};