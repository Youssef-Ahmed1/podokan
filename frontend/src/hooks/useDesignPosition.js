// useDesignPosition.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { PRODUCT_TYPES, DEFAULT_PRODUCT_CONFIG } from '../../src/components/Admin/ProductApproval/constants/productConfig';

export const useDesignPosition = ({
  initialPosition = { x: 50, y: 50 }, 
  initialScale = 0.5,
  productType = 'hoodie',
  productView = 'front',
  disabled = false,
  maxScale = 1.1 // Changed maximum scale to 110%
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [scale, setScale] = useState(initialScale);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef(position);

  // Updated boundaries for better centering
  const getBoundaries = useCallback(() => {
    const defaultBounds = {
      x: [20, 80], // Restrict horizontal movement to center area
      y: [30, 70]  // Restrict vertical movement to center area
    };

    const productConfig = PRODUCT_TYPES[productType]?.mockupConfig?.boundaries || 
                         DEFAULT_PRODUCT_CONFIG.mockupConfig.boundaries;
    
    return {
      ...defaultBounds,
      ...(productConfig[productView] || productConfig.front)
    };
  }, [productType, productView]);

  const handleScaleChange = useCallback((newScale) => {
    const MIN_SCALE = 0.1;
    const MAX_SCALE = maxScale; // Use the maxScale parameter
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    setScale(clampedScale);
  }, [maxScale]);

  const checkBoundaries = useCallback((pos) => {
    const bounds = getBoundaries();
    return pos.x >= bounds.x[0] && 
           pos.x <= bounds.x[1] && 
           pos.y >= bounds.y[0] && 
           pos.y <= bounds.y[1];
  }, [getBoundaries]);

  const updatePosition = useCallback((newPosition) => {
    const bounds = getBoundaries();
    const clampedPosition = {
      x: Math.max(bounds.x[0], Math.min(bounds.x[1], newPosition.x)),
      y: Math.max(bounds.y[0], Math.min(bounds.y[1], newPosition.y))
    };
    setPosition(clampedPosition);
    positionRef.current = clampedPosition;
  }, [getBoundaries]);

  // Updated centerDesign to position in the middle of the allowed area
  const centerDesign = useCallback(() => {
    const bounds = getBoundaries();
    const centerPosition = {
      x: 50, // Center horizontally
      y: 50  // Center vertically
    };
    setPosition(centerPosition);
    positionRef.current = centerPosition;
    setScale(0.5); // Reset scale to default
  }, [getBoundaries]);

  const reset = useCallback(() => {
    const centerPosition = { x: 50, y: 50 };
    setPosition(centerPosition);
    setScale(0.5);
    positionRef.current = centerPosition;
  }, []);

  const handleDragStart = useCallback((e) => {
    if (disabled || !e.currentTarget) return;
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const designElement = e.currentTarget.querySelector('.design-container');
    
    if (!designElement) return;

    setIsDragging(true);
    
    const designRect = designElement.getBoundingClientRect();
    const offsetX = e.clientX - designRect.left;
    const offsetY = e.clientY - designRect.top;

    dragStartRef.current = {
      offsetX,
      offsetY,
      startX: positionRef.current.x,
      startY: positionRef.current.y
    };

    const handleMouseMove = (moveEvent) => {
      const deltaX = ((moveEvent.clientX - e.clientX) / rect.width) * 100;
      const deltaY = ((moveEvent.clientY - e.clientY) / rect.height) * 100;

      const newPosition = {
        x: dragStartRef.current.startX + deltaX,
        y: dragStartRef.current.startY + deltaY
      };

      updatePosition(newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [disabled, updatePosition]);

  // Center design when product type or view changes
  useEffect(() => {
    centerDesign();
  }, [productType, productView, centerDesign]);

  useEffect(() => {
    return () => {
      if (isDragging) {
        window.removeEventListener('mousemove', () => {});
        window.removeEventListener('mouseup', () => {});
      }
    };
  }, [isDragging]);

  const bounds = getBoundaries();
  const isOutOfBounds = !checkBoundaries(position);

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
    bounds,
    setPosition,
    setScale,
    checkBoundaries
  };
};