import { useState, useCallback, useRef, useEffect } from 'react';
import {  PRODUCT_TYPES  } from '../../src/components/Admin/ProductApproval/constants/productConfig';

export const useDesignPosition = ({
  initialPosition = { x: 50, y: 30 },
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
    const MAX_SCALE = 1.3; // Increased maximum scale to 130%
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

  const handleDragStart = useCallback((e) => {
    if (disabled || !e.currentTarget) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - (positionRef.current.x * rect.width / 100),
      y: e.clientY - (positionRef.current.y * rect.height / 100)
    };

    const handleMouseMove = (moveEvent) => {
      if (!e.currentTarget) return;
      
      const rect = e.currentTarget.getBoundingClientRect();
      const newPosition = {
        x: ((moveEvent.clientX - dragStartRef.current.x) / rect.width) * 100,
        y: ((moveEvent.clientY - dragStartRef.current.y) / rect.height) * 100
      };

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

  // Reset position when the view changes
  useEffect(() => {
    const bounds = getBoundaries();
    const centerPosition = {
      x: (bounds.x[0] + bounds.x[1]) / 2,
      y: (bounds.y[0] + bounds.y[1]) / 2
    };
    setPosition(centerPosition);
    positionRef.current = centerPosition;
  }, [productType, productView, getBoundaries]);

  // Cleanup on unmount
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
    handleDragStart,
    handleScaleChange,
    setPosition,
    setScale,
    checkBoundaries
  };
};