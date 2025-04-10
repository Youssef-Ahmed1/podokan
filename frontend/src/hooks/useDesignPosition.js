// hooks/useDesignPosition.js
import { useState, useCallback, useRef, useEffect } from "react";
import {
  DESIGN_BOUNDARIES,
  DESIGN_SCALE,
  DEFAULT_POSITION,
  validateDesignPosition,
} from "../components/Admin/ProductApproval/constants/productConfig";
import { DESIGN_CONFIG, DesignScalingManager } from "../utils/designScaling";

export const useDesignPosition = ({
  productType = "hoodie",
  productView = "front",
  initialPosition = DEFAULT_POSITION,
  initialScale = DESIGN_SCALE.default,
  disabled = false,
  onChange,
  minScale = DESIGN_SCALE.min,
  maxScale = DESIGN_SCALE.max,
} = {}) => {
  // Use DesignScalingManager to clamp initial values
  const [position, setPosition] = useState(
    DesignScalingManager.clampPosition(
      initialPosition,
      productType,
      productView
    )
  );
  const [scale, setScale] = useState(
    DesignScalingManager.clampScale(initialScale)
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isOutOfBounds, setIsOutOfBounds] = useState(false);

  // Refs for drag handling
  const dragStartRef = useRef(null);
  const positionRef = useRef(position);

  // Get boundaries for current product and view
  const bounds = DESIGN_BOUNDARIES[productType]?.[productView] || {
    x: { min: 35, max: 65 },
    y: { min: 25, max: 55 },
  };

  // Validate and update position
  const updatePosition = useCallback(
    (newPosition, newScale = scale) => {
      // Use both validation systems for now, will consolidate later
      const { isValid } = validateDesignPosition(
        newPosition,
        productType,
        productView
      );

      // Also check with DesignScalingManager
      const isValidDesignScaling = DesignScalingManager.validatePosition(
        newPosition,
        productType,
        productView
      );

      const clampedPosition = DesignScalingManager.clampPosition(
        newPosition,
        productType,
        productView
      );

      setPosition(clampedPosition);
      positionRef.current = clampedPosition;
      setIsOutOfBounds(!isValid || !isValidDesignScaling);

      if (onChange) {
        onChange({ position: clampedPosition, scale: newScale });
      }
    },
    [scale, productType, productView, onChange]
  );

  // Handle scale changes
  const handleScaleChange = useCallback(
    (newScale) => {
      const clampedScale = DesignScalingManager.clampScale(newScale);
      setScale(clampedScale);
      updatePosition(position, clampedScale);
    },
    [position, updatePosition]
  );

  // Center the design
  const centerDesign = useCallback(() => {
    const centerPosition = {
      x: (bounds.x.min + bounds.x.max) / 2,
      y: (bounds.y.min + bounds.y.max) / 2,
    };
    updatePosition(centerPosition, scale);
  }, [bounds, scale, updatePosition]);

  // Reset to defaults
  const reset = useCallback(() => {
    setScale(DESIGN_SCALE.default);
    updatePosition(DEFAULT_POSITION, DESIGN_SCALE.default);
  }, [updatePosition]);

  // Drag handling
  const handleDragStart = useCallback(
    (e) => {
      if (disabled || !e.currentTarget) return;
      e.preventDefault();

      const rect = e.currentTarget.getBoundingClientRect();
      setIsDragging(true);

      dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialPosition: { ...positionRef.current },
      };

      const handleMouseMove = (moveEvent) => {
        if (!dragStartRef.current) return;

        const deltaX =
          ((moveEvent.clientX - dragStartRef.current.startX) / rect.width) *
          100;
        const deltaY =
          ((moveEvent.clientY - dragStartRef.current.startY) / rect.height) *
          100;

        const newPosition = {
          x: dragStartRef.current.initialPosition.x + deltaX,
          y: dragStartRef.current.initialPosition.y + deltaY,
        };

        updatePosition(newPosition, scale);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        dragStartRef.current = null;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [disabled, scale, updatePosition]
  );

  // Update position and scale if initialPosition or initialScale change
  useEffect(() => {
    if (initialPosition && initialPosition !== positionRef.current) {
      updatePosition(initialPosition, scale);
    }
  }, [initialPosition, scale, updatePosition]);

  useEffect(() => {
    if (initialScale !== scale) {
      handleScaleChange(initialScale);
    }
  }, [initialScale, handleScaleChange]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (isDragging) {
        window.removeEventListener("mousemove", () => {});
        window.removeEventListener("mouseup", () => {});
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
    bounds,
  };
};
