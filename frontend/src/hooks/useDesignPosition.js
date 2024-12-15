import { useState, useCallback, useRef, useEffect } from 'react';
import { PRODUCT_TYPES, DEFAULT_PRODUCT_CONFIG } from '../../src/components/Admin/ProductApproval/constants/productConfig';

export const useDesignPosition = ({
  initialPosition = { x: 50, y: 50 }, 
  initialScale = 0.5,
  productType = 'hoodie',
  productView = 'front',
  disabled = false
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [scale, setScale] = useState(initialScale);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef(position);

  // Get boundaries based on product type and view
  const getBoundaries = useCallback(() => {
    const productConfig = PRODUCT_TYPES[productType]?.mockupConfig?.boundaries || 
                         DEFAULT_PRODUCT_CONFIG.mockupConfig.boundaries;
    return productConfig[productView] || productConfig.front;
  }, [productType, productView]);

  // Handle scale change with new maximum
  const handleScaleChange = useCallback((newScale) => {
    const MIN_SCALE = 0.1;
    const MAX_SCALE = 1.3;
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    setScale(clampedScale);
  }, []);

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

  const centerDesign = useCallback(() => {
    const bounds = getBoundaries();
    const centerPosition = {
      x: (bounds.x[0] + bounds.x[1]) / 2,
      y: (bounds.y[0] + bounds.y[1]) / 2
    };
    setPosition(centerPosition);
    positionRef.current = centerPosition;
  }, [getBoundaries]);

  const reset = useCallback(() => {
    setPosition(initialPosition);
    setScale(initialScale);
    positionRef.current = initialPosition;
  }, [initialPosition, initialScale]);

  const handleDragStart = useCallback((e) => {
    if (disabled || !e.currentTarget) return;
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const designElement = e.currentTarget.querySelector('.design-container');
    
    if (!designElement) return;

    setIsDragging(true);
    
    // Calculate offset relative to design position
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