import React, { forwardRef, useState, useMemo } from "react";
import { HiRefresh, HiViewGrid } from "react-icons/hi";
import { toast } from "react-toastify";
import {
  DESIGN_CONSTRAINTS,
  getMockupUrl,
  validateDesignPosition,
} from "../Admin/ProductApproval/constants/productConfig";
import { DesignScalingManager } from "../../utils/designScaling";

const DesignPreview = forwardRef(
  (
    {
      product,
      position,
      scale,
      isDragging,
      isOutOfBounds,
      onDragStart,
      onScaleChange,
      onPositionChange,
      onCenter,
      showGridLines,
      onToggleGridLines,
      disabled,
      bounds,
    },
    ref
  ) => {
    const [mockupLoaded, setMockupLoaded] = useState(false);
    const [mockupError, setMockupError] = useState(false);

    // Validate position for additional safety
    const { isValid, boundaries } = validateDesignPosition(
      position,
      product.ProductType,
      product.ProductView || "front"
    );

    // Get mockup URL
    const mockupUrl = useMemo(() => {
      return getMockupUrl(
        product.ProductType,
        product.ProductColor,
        product.ProductView || "front"
      );
    }, [product.ProductType, product.ProductColor, product.ProductView]);

    // Get consistent container styles from the DesignScalingManager
    const designContainerStyles =
      DesignScalingManager.getConsistentContainerStyles(
        position,
        scale,
        product.ProductColor,
        product.ProductType,
        product.ProductView || "front",
        true // isAdminPreview=true
      );

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Control Panel */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={onCenter}
              disabled={disabled}
              className={`
              flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${
                disabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100 active:bg-blue-200"
              }
            `}
            >
              <HiRefresh className="w-4 h-4 mr-2" />
              Center Design
            </button>
            <button
              onClick={onToggleGridLines}
              disabled={disabled}
              className={`
              flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${
                disabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : showGridLines
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100"
              }
            `}
            >
              <HiViewGrid className="w-4 h-4 mr-2" />
              Grid Lines
            </button>
          </div>

          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <label className="text-sm text-gray-600">Scale:</label>
              <input
                type="range"
                min={DESIGN_CONSTRAINTS.scale.min}
                max={DESIGN_CONSTRAINTS.scale.max}
                step={0.01}
                value={scale}
                onChange={(e) => onScaleChange(parseFloat(e.target.value))}
                disabled={disabled}
                className="w-full sm:w-32 h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer"
              />

              <span className="text-sm text-gray-600 min-w-[3ch]">
                {Math.round(scale * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div
          ref={ref}
          className="relative w-full aspect-[3/4] bg-gray-50"
          onMouseDown={!disabled ? onDragStart : undefined}
          style={{
            cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
          }}
        >
          {/* Background Mockup */}
          <img
            key={mockupUrl}
            src={mockupUrl}
            alt={`${product.ProductType} mockup`}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300
            ${mockupLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setMockupLoaded(true)}
            onError={() => setMockupError(true)}
            draggable="false"
          />

          {/* Design Image */}
          {product.designImage && mockupLoaded && (
            <div
              className={`absolute design-container select-none ${
                isDragging ? "" : "transition-transform duration-200"
              }`}
              style={{
                ...designContainerStyles,
                opacity: isOutOfBounds ? 0.5 : 1,
                zIndex: isDragging ? 10 : 1,
                pointerEvents: disabled ? "none" : "auto",
              }}
            >
              <img
                src={
                  typeof product.designImage === "string"
                    ? product.designImage
                    : product.designImage.url
                }
                alt="Design"
                className="w-full h-full object-contain pointer-events-none"
                draggable="false"
              />
            </div>
          )}

          {/* Grid Lines */}
          {showGridLines && (
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-blue-300 border-opacity-30"
                />
              ))}
            </div>
          )}

          {/* Safe Area */}
          {bounds && (
            <div
              className="absolute pointer-events-none border-2 border-blue-400 border-dashed opacity-30"
              style={{
                left: `${bounds.x?.min || 0}%`,
                top: `${bounds.y?.min || 0}%`,
                width: `${(bounds.x?.max || 100) - (bounds.x?.min || 0)}%`,
                height: `${(bounds.y?.max || 100) - (bounds.y?.min || 0)}%`,
              }}
            />
          )}

          {/* Loading State */}
          {!mockupLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
            </div>
          )}
        </div>
      </div>
    );
  }
);

DesignPreview.displayName = "DesignPreview";

export default DesignPreview;
