// components/shared/DesignPreview.js
import React from 'react';
import { useDesignPosition } from '../../hooks/useDesignPosition';

const DesignPreview = ({
  product,
  onUpdateDesign,
  disabled = false
}) => {
  const {
    containerRef,
    position,
    scale,
    isDragging,
    isOutOfBounds,
    handleDragStart,
    handleScaleChange,
    centerDesign
  } = useDesignPosition({
    initialPosition: editedProduct.designPosition,
    initialScale: editedProduct.DesignScale,
    productType: editedProduct.ProductType,
    disabled: isSubmitting
  });
  

  return (
    <div className="relative w-full">
      {/* Container with aspect ratio */}
      <div className="relative w-full aspect-square bg-gray-50 rounded-lg overflow-hidden">
        <div 
          ref={containerRef}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* Mockup Image */}
          <img
            src={product.mockupUrl}
            alt={`${product.ProductType} Preview`}
            className="w-full h-full object-contain"
          />

          {/* Design Overlay */}
          <div
            className={`
              absolute
              transform -translate-x-1/2 -translate-y-1/2
              transition-all duration-300
              xs:w-[45%] sm:w-[40%] md:w-[35%] lg:w-[30%] xl:w-[25%]
              xs:h-[55%] sm:h-[50%] md:h-[45%] lg:h-[40%] xl:h-[35%]
              ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
              ${disabled ? 'cursor-not-allowed' : ''}
              ${isOutOfBounds ? 'opacity-50' : 'opacity-100'}
            `}
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: `translate(-50%, -50%) scale(${scale})`
            }}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <img
              src={product.designImage}
              alt="Design"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 space-y-4">
        <div className="flex justify-between items-center">
          <button
            onClick={centerDesign}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            disabled={disabled}
          >
            Center Design
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleScaleChange(scale - 0.1)}
              disabled={disabled || scale <= 0.1}
              className="p-2 rounded hover:bg-gray-100"
            >
              <MinusIcon className="w-5 h-5" />
            </button>
            
            <span className="min-w-[4rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={() => handleScaleChange(scale + 0.1)}
              disabled={disabled || scale >= 2.0}
              className="p-2 rounded hover:bg-gray-100"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignPreview;