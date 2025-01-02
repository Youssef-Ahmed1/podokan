import { useState, useCallback, useRef, useEffect } from 'react';
import { PRODUCT_CONFIG, DEFAULT_PRODUCT_CONFIG } from '../components/Admin/ProductApproval/constants/productConfig';

export const useDesignPosition = (props) => {
  // Initialize all variables at the top
  const {
    initialPosition = { x: 50, y: 40 },
    initialScale = 0.8,
    productType = 'hoodie',
    productView = 'front',
    disabled = false,
    maxScale = 1.2,
    onChange
  } = props || {};

  // State declarations
  const [position, setPosition] = useState(initialPosition);
  const [scale, setScale] = useState(initialScale);
  const [isDragging, setIsDragging] = useState(false);
  const [isOutOfBounds, setIsOutOfBounds] = useState(false);

  // Refs
  const dragStartRef = useRef(null);
  const positionRef = useRef(position);

  // Get boundaries based on product type and view
  const getBoundaries = useCallback(() => {
    const config = PRODUCT_CONFIG[productType];
    if (!config) return DEFAULT_PRODUCT_CONFIG.mockupConfig.boundaries.front;
    
    return config.mockupConfig.boundaries[productView] || 
           config.mockupConfig.boundaries.front;
  }, [productType, productView]);

  // Check if position is within boundaries
  const checkBoundaries = useCallback((pos, currentScale) => {
    const bounds = getBoundaries();
    
    // Calculate design dimensions based on scale
    const designWidth = 20 * currentScale;
    const designHeight = 20 * currentScale;

    // Calculate actual boundaries considering design size
    const leftBound = bounds.x[0] + (designWidth / 2);
    const rightBound = bounds.x[1] - (designWidth / 2);
    const topBound = bounds.y[0] + (designHeight / 2);
    const bottomBound = bounds.y[1] - (designHeight / 2);

    const withinBounds = pos.x >= leftBound && 
                        pos.x <= rightBound && 
                        pos.y >= topBound && 
                        pos.y <= bottomBound;

    setIsOutOfBounds(!withinBounds);
    return withinBounds;
  }, [getBoundaries]);

  // Update position with boundary checking
  const updatePosition = useCallback((newPosition, currentScale = scale) => {
    const bounds = getBoundaries();
    const designWidth = 20 * currentScale;
    const designHeight = 20 * currentScale;

    const clampedPosition = {
      x: Math.max(
        bounds.x[0] + (designWidth / 2),
        Math.min(bounds.x[1] - (designWidth / 2), newPosition.x)
      ),
      y: Math.max(
        bounds.y[0] + (designHeight / 2),
        Math.min(bounds.y[1] - (designHeight / 2), newPosition.y)
      )
    };

    setPosition(clampedPosition);
    positionRef.current = clampedPosition;
    
    if (onChange) {
      onChange({ position: clampedPosition, scale: currentScale });
    }
  }, [getBoundaries, scale, onChange]);

  // Center the design
  const centerDesign = useCallback(() => {
    const bounds = getBoundaries();
    const centerPosition = {
      x: (bounds.x[0] + bounds.x[1]) / 2,
      y: (bounds.y[0] + bounds.y[1]) / 2
    };
    updatePosition(centerPosition, scale);
  }, [getBoundaries, updatePosition, scale]);

  // Reset to default position and scale
  const reset = useCallback(() => {
    const defaultPosition = { x: 50, y: 35 };
    const defaultScale = 0.5;
    updatePosition(defaultPosition, defaultScale);
    setScale(defaultScale);
  }, [updatePosition]);

  // Handle drag start
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

      if (checkBoundaries(newPosition, scale)) {
        updatePosition(newPosition);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [disabled, updatePosition, checkBoundaries, scale]);

  // Handle scale change
  const handleScaleChange = useCallback((newScale) => {
    const MIN_SCALE = 0.1;
    const MAX_SCALE = maxScale;
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    
    if (checkBoundaries(position, clampedScale)) {
      setScale(clampedScale);
    } else {
      const bounds = getBoundaries();
      const centerPosition = {
        x: (bounds.x[0] + bounds.x[1]) / 2,
        y: (bounds.y[0] + bounds.y[1]) / 2
      };
      updatePosition(centerPosition, clampedScale);
      setScale(clampedScale);
    }
  }, [maxScale, position, checkBoundaries, getBoundaries, updatePosition]);

  // Center design on mount and product type/view change
  useEffect(() => {
    centerDesign();
  }, [productType, productView, centerDesign]);

  // Cleanup event listeners
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
    bounds: getBoundaries(),
    setPosition,
    setScale,
    checkBoundaries
  };
};