import React, { forwardRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { HiPlus, HiMinus } from 'react-icons/hi';
import { BsGrid3X3 } from 'react-icons/bs';
import { BiReset } from 'react-icons/bi';
import { toast } from 'react-toastify';

const SCALE_STEP = 0.02; // Each click changes scale by 2%
const MIN_SCALE = 0.1;   // 10% minimum size
const MAX_SCALE = 1;     // 100% maximum size

const CLOUDINARY_BASE = 'https://res.cloudinary.com/dkot9tyjm/image/upload';

const DesignPreview = forwardRef(({
  product,
  onUpdateDesign,
  disabled,
  showGridLines,
  onToggleGridLines
}, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState(product.DesignPosition || { x: 50, y: 25 });
  const [scale, setScale] = useState(product.DesignScale || 0.5);
  const [outOfBounds, setOutOfBounds] = useState(false);
  const [mockupLoaded, setMockupLoaded] = useState(false);

  // Get boundaries based on product type
  const getBoundaries = () => {
    const boundaries = {
      't-shirt': { x: [35, 65], y: [20, 35] },
      'hoodie': { x: [40, 60], y: [25, 40] },
      'long-sleeve': { x: [35, 65], y: [20, 35] }
    };
    return boundaries[product.ProductType] || boundaries['t-shirt'];
  };

  // Check if position is within boundaries
  const checkBoundaries = (pos) => {
    const bounds = getBoundaries();
    return {
      isValid: pos.x >= bounds.x[0] && pos.x <= bounds.x[1] && 
               pos.y >= bounds.y[0] && pos.y <= bounds.y[1],
      bounds
    };
  };

  const getMockupUrl = (productType, color, view) => {
    return `${CLOUDINARY_BASE}/v1728392918/${productType}s/${productType}-${color}-${view}.png`;
  };

  // Handle mouse down for dragging
  const handleMouseDown = (e) => {
    if (disabled) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - (position.x * rect.width / 100),
      y: e.clientY - (position.y * rect.height / 100)
    });
  };

  // Handle mouse move while dragging
  const handleMouseMove = (e) => {
    if (!isDragging || disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const newPosition = {
      x: ((e.clientX - dragStart.x) / rect.width) * 100,
      y: ((e.clientY - dragStart.y) / rect.height) * 100
    };

    const { isValid, bounds } = checkBoundaries(newPosition);
    setOutOfBounds(!isValid);

    // Clamp position within boundaries
    const clampedPosition = {
      x: Math.max(bounds.x[0], Math.min(bounds.x[1], newPosition.x)),
      y: Math.max(bounds.y[0], Math.min(bounds.y[1], newPosition.y))
    };

    setPosition(clampedPosition);
  };

  // Handle mouse up after dragging
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onUpdateDesign({
        DesignPosition: position,
        DesignScale: scale
      });
    }
  };

  // Handle scale change
  const handleScaleChange = (newScale) => {
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    setScale(clampedScale);
    onUpdateDesign({
      DesignPosition: position,
      DesignScale: clampedScale
    });
  };

  // Reset design position and scale
  const handleReset = () => {
    const defaultPosition = { x: 50, y: 25 };
    setPosition(defaultPosition);
    setScale(0.5);
    onUpdateDesign({
      DesignPosition: defaultPosition,
      DesignScale: 0.5
    });
  };

  // Add/remove mouse move and up listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Control Panel */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Design Preview</h3>
          <div className="flex items-center space-x-2">
            {/* Scale Controls */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleScaleChange(scale - SCALE_STEP)}
                disabled={disabled || scale <= MIN_SCALE}
                className="p-1.5 rounded hover:bg-white disabled:opacity-50"
                title="Decrease size"
              >
                <HiMinus className="w-4 h-4" />
              </button>
              <span className="px-2 text-sm font-medium min-w-[4rem] text-center">
                {Math.round(scale * 50)}%
              </span>
              <button
                onClick={() => handleScaleChange(scale + SCALE_STEP)}
                disabled={disabled || scale >= MAX_SCALE}
                className="p-1.5 rounded hover:bg-white disabled:opacity-50"
                title="Increase size"
              >
                <HiPlus className="w-4 h-4" />
              </button>
            </div>

            {/* Grid Toggle */}
            <button
              onClick={onToggleGridLines}
              className={`p-2 rounded-lg transition-colors ${
                showGridLines ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title="Toggle grid"
            >
              <BsGrid3X3 className="w-4 h-4" />
            </button>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Reset position and size"
            >
              <BiReset className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div 
        ref={ref}
        className="relative w-full aspect-[3/4] bg-gray-50"
        onMouseDown={handleMouseDown}
        style={{
          cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab'
        }}
      >
        {/* Background Mockup Image */}
        <img
          src={getMockupUrl(product.ProductType, product.ProductColor, 'front')}
          alt="Product mockup"
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
            mockupLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={(e) => {
            console.error('Failed to load mockup:', e);
            toast.error('Failed to load product mockup');
          }}
          onLoad={() => setMockupLoaded(true)}
        />
        
        {!mockupLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        )}

        {/* Design Image */}
        {product.designImage && (
          <div
            className={`absolute transition-transform ${isDragging ? '' : 'duration-200'}`}
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              width: '15%',
              opacity: outOfBounds ? 0.5 : 1,
              mixBlendMode: 'multiply'
            }}
          >
            <img
              src={product.designImage}
              alt="Design"
              className="w-full h-full object-contain pointer-events-none"
              draggable="false"
            />
          </div>
        )}

        {/* Boundaries Visualization */}
        {!disabled && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Safe Area */}
            <div className={`
              absolute 
              border-2 
              border-dashed 
              ${outOfBounds ? 'border-red-400' : 'border-blue-400'} 
              opacity-30
            `}
              style={{
                left: `${getBoundaries().x[0]}%`,
                top: `${getBoundaries().y[0]}%`,
                width: `${getBoundaries().x[1] - getBoundaries().x[0]}%`,
                height: `${getBoundaries().y[1] - getBoundaries().y[0]}%`
              }}
            />
          </div>
        )}

        {/* Grid Lines */}
        {showGridLines && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-blue-200 opacity-30" />
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
    designImage: PropTypes.string,
    DesignPosition: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number
    }),
    DesignScale: PropTypes.number
  }).isRequired,
  onUpdateDesign: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  showGridLines: PropTypes.bool,
  onToggleGridLines: PropTypes.func.isRequired
};

DesignPreview.displayName = 'DesignPreview';

export default DesignPreview;