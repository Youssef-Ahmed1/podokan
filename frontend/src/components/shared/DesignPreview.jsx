import React, { forwardRef, useState, useMemo } from 'react';
import { HiRefresh, HiViewGrid } from 'react-icons/hi';
import { toast } from 'react-toastify';
import { getMockupUrl } from '../Admin/ProductApproval/constants/productConfig';


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
  disabled,
  bounds
}, ref) => {
  const [mockupLoaded, setMockupLoaded] = useState(false);
  const [mockupError, setMockupError] = useState(false);

  const mockupUrl = useMemo(() => {
    const url = getMockupUrl(
      product.ProductType,
      product.ProductColor,
      product.ProductView || 'front'
    );
    
    if (!url) {
      console.warn('Mockup not available, falling back to default');
      return getMockupUrl('t-shirt', 'white', 'front');
    }
    
    return url;
  }, [product.ProductType, product.ProductColor, product.ProductView]);

  const handleMockupError = (error) => {
    console.error('Mockup loading failed:', error);
    setMockupError(true);
    setMockupLoaded(false);
    toast.error('Failed to load product mockup');
  };

  const handleMockupLoad = () => {
    setMockupLoaded(true);
    setMockupError(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Control Panel */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={onCenter}
            disabled={disabled}
            className={`
              flex items-center px-3 py-2 rounded-lg text-sm font-medium
              ${disabled 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}
            `}
          >
            <HiRefresh className="w-4 h-4 mr-2" />
            Center Design
          </button>
          <button
            onClick={() => onToggleGridLines()}
            disabled={disabled}
            className={`
              flex items-center px-3 py-2 rounded-lg text-sm font-medium
              ${disabled 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : showGridLines
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}
            `}
          >
            <HiViewGrid className="w-4 h-4 mr-2" />
            Grid Lines
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Scale:</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.01"
              value={scale}
              onChange={(e) => onScaleChange(parseFloat(e.target.value))}
              disabled={disabled}
              className="w-32"
            />
            <span className="text-sm text-gray-600">
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
          cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab'
        }}
      >
        {/* Background Mockup */}
        <img
          key={mockupUrl}
          src={mockupUrl}
          alt={`${product.ProductType} ${product.ProductColor} ${product.ProductView} mockup`}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
            mockupLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleMockupLoad}
          onError={handleMockupError}
        />

        {/* Loading/Error States */}
        {!mockupLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            {mockupError ? (
              <div className="text-center text-red-500">
                <svg 
                  className="mx-auto h-12 w-12" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
                <p className="mt-2">Failed to load mockup</p>
              </div>
            ) : (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            )}
          </div>
        )}

        {/* Design Image */}
        {product.designImage && mockupLoaded && (
          <div
            className={`absolute transition-transform ${isDragging ? '' : 'duration-200'}`}
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              width: '20%',
              opacity: isOutOfBounds ? 0.5 : 1
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

        {/* Grid Lines */}
        {showGridLines && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="border border-blue-300 border-opacity-50"
                />
              ))}
            </div>
          </div>
        )}

        {/* Boundaries */}
        {bounds && (
          <div
            className="absolute pointer-events-none border-2 border-red-500 border-dashed opacity-50"
            style={{
              left: `${bounds.left}%`,
              top: `${bounds.top}%`,
              width: `${bounds.width}%`,
              height: `${bounds.height}%`
            }}
          />
        )}
      </div>
    </div>
  );
});

DesignPreview.displayName = 'DesignPreview';

export default DesignPreview;