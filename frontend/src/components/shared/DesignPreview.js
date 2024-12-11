import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { HiPlus as PlusIcon, HiMinus as MinusIcon } from 'react-icons/hi';
import { BsGrid3X3 } from 'react-icons/bs';

const DesignPreview = forwardRef(({
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
  disabled
}, ref) => {
  // Get mockup image based on product type and color
  const mockupUrl = `/mockups/${product.ProductType}/${product.ProductColor}/${product.ProductView || 'front'}.png`;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          Design Preview
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onScaleChange(scale - 0.1)}
            disabled={disabled || scale <= 0.1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <MinusIcon className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm text-gray-600">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => onScaleChange(scale + 0.1)}
            disabled={disabled || scale >= 2}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <PlusIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={onToggleGridLines}
            className={`p-2 rounded-lg ${showGridLines ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <BsGrid3X3 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div 
        ref={ref}
        className="relative w-full aspect-[3/4] bg-gray-50"
        onMouseDown={onDragStart}
        style={{
          cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab'
        }}
      >
        {/* Mockup Image */}
        <img
          src={mockupUrl}
          alt="Product mockup"
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* Design Image */}
        {product.designImage && (
          <div
            className={`absolute transition-transform ${isDragging ? '' : 'duration-200'}`}
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              width: '33%',
              opacity: isOutOfBounds ? 0.5 : 1
            }}
          >
            <img
              src={product.designImage}
              alt="Design"
              className="w-full h-full object-contain"
              draggable="false"
            />
          </div>
        )}

        {/* Grid Lines */}
        {showGridLines && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-blue-200 opacity-50" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

DesignPreview.propTypes = {
  product: PropTypes.shape({
    ProductType: PropTypes.string.isRequired,
    ProductColor: PropTypes.string.isRequired,
    ProductView: PropTypes.string,
    designImage: PropTypes.string
  }).isRequired,
  position: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
  }).isRequired,
  scale: PropTypes.number.isRequired,
  isDragging: PropTypes.bool.isRequired,
  isOutOfBounds: PropTypes.bool.isRequired,
  onDragStart: PropTypes.func.isRequired,
  onScaleChange: PropTypes.func.isRequired,
  onPositionChange: PropTypes.func.isRequired,
  onCenter: PropTypes.func.isRequired,
  showGridLines: PropTypes.bool.isRequired,
  onToggleGridLines: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

DesignPreview.displayName = 'DesignPreview';

export default DesignPreview;