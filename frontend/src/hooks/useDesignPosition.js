// hooks/useDesignPosition.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { getResponsiveDimensions, isWithinSafeArea } from '../utils/designScaling';

export const useDesignPosition = ({
  initialPosition = { x: 50, y: 50 },
  initialScale = 1,
  productType,
  disabled = false
}) => {
  const containerRef = useRef(null);
  const [position, setPosition] = useState(initialPosition);
  const [scale, setScale] = useState(initialScale);
  const [isDragging, setIsDragging] = useState(false);
  const [isOutOfBounds, setIsOutOfBounds] = useState(false);

  // Update dimensions when container size changes
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const dimensions = getResponsiveDimensions(container.width);
    return dimensions;
  }, []);

  // Handle design dragging
  const handleDragStart = useCallback((e) => {
    if (disabled) return;
    e.preventDefault();
    
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    
    setIsDragging(true);
  }, [disabled]);

  const handleDragMove = useCallback((e) => {
    if (!isDragging || !containerRef.current || disabled) return;

    const container = containerRef.current.getBoundingClientRect();
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    
    const newX = ((clientX - container.left) / container.width) * 100;
    const newY = ((clientY - container.top) / container.height) * 100;
    
    const newPosition = {
      x: Math.max(0, Math.min(100, newX)),
      y: Math.max(0, Math.min(100, newY))
    };

    setPosition(newPosition);
    setIsOutOfBounds(!isWithinSafeArea(newPosition, productType));
  }, [isDragging, disabled, productType]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle scale changes
  const handleScaleChange = useCallback((newScale) => {
    if (disabled) return;
    setScale(Math.max(0.1, Math.min(2.0, newScale)));
  }, [disabled]);

  // Center design
  const centerDesign = useCallback(() => {
    setPosition({ x: 50, y: 50 });
  }, []);

  // Add event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Update dimensions on resize
  useEffect(() => {
    const handleResize = debounce(updateDimensions, 250);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateDimensions]);

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