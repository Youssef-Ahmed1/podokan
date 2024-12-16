import { useState, useCallback, useRef, useEffect } from 'react';
import { PRODUCT_TYPES, DEFAULT_PRODUCT_CONFIG } from '../../src/components/Admin/ProductApproval/constants/productConfig';

export const useDesignPosition = ({
  initialPosition = { x: 50, y: 70 }, 
  initialScale = 0.5,
  productType = 'hoodie',
  productView = 'front',
  disabled = false,
  maxScale = 1.1
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [scale, setScale] = useState(initialScale);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef(position);

  // Updated boundaries to match the visible dotted line rectangle
  const getBoundaries = useCallback(() => {
    const defaultBounds = {
      hoodie: {
        x: [30, 70], // More restrictive horizontal boundaries
        y: [20, 50]  // More restrictive vertical boundaries
      },
      // 't-shirt': {
      //   x: [30, 70],
      //   y: [20, 40]
      // }
    };

    return defaultBounds[productType] || defaultBounds.hoodie;
  }, [productType]);

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

    return pos.x >= leftBound && 
           pos.x <= rightBound && 
           pos.y >= topBound && 
           pos.y <= bottomBound;
  }, [getBoundaries]);

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
  }, [getBoundaries, scale]);

  // Add the missing centerDesign function
  const centerDesign = useCallback(() => {
    const bounds = getBoundaries();
    const centerPosition = {
      x: (bounds.x[0] + bounds.x[1]) / 2,
      y: (bounds.y[0] + bounds.y[1]) / 2
    };
    updatePosition(centerPosition, scale);
  }, [getBoundaries, updatePosition, scale]);

  // Add the missing reset function
  const reset = useCallback(() => {
    const defaultPosition = { x: 50, y: 75 };
    const defaultScale = 0.5;
    updatePosition(defaultPosition, defaultScale);
    setScale(defaultScale);
  }, [updatePosition]);

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

  return {
    position,
    scale,
    isDragging,
    isOutOfBounds: !checkBoundaries(position, scale),
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