import React, { useEffect, useState, memo, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { fetchPendingProducts, approveRejectProduct } from '../../../redux/actions/product';
import { BsZoomIn, BsZoomOut } from 'react-icons/bs';
import { AiOutlineWarning, AiOutlineInfoCircle } from 'react-icons/ai';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';

// Constants
const PRODUCT_TYPES = {
  't-shirt': {
    label: 'T-Shirt',
    basePrice: 290,
    productionCost: 150,
    margins: {
      min: 0.3,
      recommended: 0.5,
    },
    mockupConfig: {
      version: 'v1',
      folder: 't-shirts',
      getFilename: (color, view) => `t-shirt-${color}-${view}`,
      designArea: {
        front: { width: 300, height: 400, top: '25%', left: '50%' },
        back: { width: 300, height: 400, top: '25%', left: '50%' }
      },
      defaultScale: 1,
      minScale: 0.5,
      maxScale: 2,
      gridLines: true
    }
  },
  'hoodie': {
    label: 'Hoodie',
    basePrice: 450,
    productionCost: 250,
    margins: {
      min: 0.35,
      recommended: 0.55,
    },
    mockupConfig: {
      version: 'v1',
      folder: '/hoodies',
      getFilename: (color, view) => `hoodie-${color}-${view}`,
      designArea: {
        front: { width: 280, height: 380, top: '30%', left: '50%' },
        back: { width: 300, height: 400, top: '25%', left: '50%' }
      },
      defaultScale: 1,
      minScale: 0.5,
      maxScale: 2,
      gridLines: true
    }
  },
  'long-sleeves': {
    label: 'Long Sleeves',
    basePrice: 370,
    productionCost: 200,
    margins: {
      min: 0.35,
      recommended: 0.55,
    },
    mockupConfig: {
      version: 'v1',
      folder: '/long-sleeves',
      getFilename: (color, view) => `longseleves-${color}-${view}`,
      designArea: {
        front: { width: 280, height: 380, top: '30%', left: '50%' },
        back: { width: 300, height: 400, top: '25%', left: '50%' }
      },
      defaultScale: 1,
      minScale: 0.5,
      maxScale: 2,
      gridLines: true
    }
  }
};

const COLOR_OPTIONS = {
  white: {
    value: 'white',
    label: 'White',
    hex: '#ffffff',
    textColor: 'text-gray-800',
    mockupModifier: 'none',
    designBlendMode: 'multiply'
  },
  black: {
    value: 'black',
    label: 'Black',
    hex: '#000000',
    textColor: 'text-white',
    mockupModifier: 'brightness(0)',
    designBlendMode: 'screen'
  },
  gray: {
    value: 'gray',
    label: 'Gray',
    hex: '#808080',
    textColor: 'text-white',
    mockupModifier: 'grayscale(1) brightness(0.5)',
    designBlendMode: 'multiply'
  },
  red: {
    value: 'red',
    label: 'Red',
    hex: '#ff0000',
    textColor: 'text-white',
    mockupModifier: 'sepia(1) saturate(10000%) hue-rotate(0deg)',
    designBlendMode: 'multiply'
  },
  blue: {
    value: 'blue',
    label: 'Blue',
    hex: '#0000ff',
    textColor: 'text-white',
    mockupModifier: 'sepia(1) saturate(10000%) hue-rotate(240deg)',
    designBlendMode: 'multiply'
  }
};

const MAIN_TAGS = [
  { value: 'funny', label: 'Funny' },
  { value: 'custom', label: 'Custom' },
  { value: 'anime', label: 'Anime' },
  { value: 'sci-fi', label: 'Sci-Fi' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'movies', label: 'Movies' },
  { value: 'hoodie', label: 'Hoodie' },
  { value: 'sports', label: 'Sports' },
  { value: 'music', label: 'Music' },
  { value: 'television', label: 'Television' },
  { value: 'shirts', label: 'Shirts' }
];

const STATUS_CONFIG = {
  pending: {
    value: 'pending',
    label: 'Pending Review',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-800',
    icon: AiOutlineWarning,
    description: 'Awaiting admin review'
  },
  public: {
    value: 'public',
    label: 'Public',
    color: 'bg-green-500',
    textColor: 'text-green-800',
    icon: AiOutlineInfoCircle,
    description: 'Visible to all users'
  },
  rejected: {
    value: 'rejected',
    label: 'Rejected',
    color: 'bg-red-500',
    textColor: 'text-red-800',
    icon: AiOutlineWarning,
    description: 'Not approved for sale'
  }
};

const DESIGN_TAGS_CONFIG = {
  minTags: 1,
  maxTags: 7
};

const CURRENCY = {
  code: 'EGP',
  symbol: 'EGP',
  format: (amount) => `${amount} EGP`
};

// Utility Functions
const getImageFormat = (url) => {
  const extension = url.split('.').pop().toLowerCase();
  return `image/${extension}`;
};

const getProductionCost = (productType) => {
  return PRODUCT_TYPES[productType]?.productionCost || 0;
};

const formatCheckName = (checkType) => {
  return checkType
    .split(/(?=[A-Z])/)
    .join(' ')
    .replace(/^\w/, c => c.toUpperCase());
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 rounded-lg">
          <h3 className="text-red-800">Something went wrong</h3>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};


const ProductPreview = memo(({ 
  editedProduct,
  onZoom,
  onPositionChange,
  onViewChange,
  disabled = false 
}) => {
  const containerRef = useRef(null);
  const designRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 50, y: 25 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [isOutOfBounds, setIsOutOfBounds] = useState(false);

  const productConfig = PRODUCT_TYPES[editedProduct.ProductType];
  const colorConfig = COLOR_OPTIONS[editedProduct.ProductColor];

  // Check if design is out of bounds
  const checkBoundary = useCallback(() => {
    if (!designRef.current || !containerRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const design = designRef.current.getBoundingClientRect();
    const designArea = productConfig.mockupConfig.designArea[editedProduct.ProductView];

    const designCenterX = design.left + (design.width / 2);
    const designCenterY = design.top + (design.height / 2);
    const containerCenterX = container.left + (container.width / 2);
    const containerCenterY = container.top + (container.height / 2);

    const maxOffsetX = (container.width * designArea.width) / 200;
    const maxOffsetY = (container.height * designArea.height) / 200;

    const isOut = Math.abs(designCenterX - containerCenterX) > maxOffsetX ||
                 Math.abs(designCenterY - containerCenterY) > maxOffsetY;

    setIsOutOfBounds(isOut);
    return isOut;
  }, [productConfig, editedProduct.ProductView]);

  // Center design functions
  const centerDesign = useCallback((axis) => {
    if (disabled) return;

    const newPosition = { ...position };
    if (axis === 'x' || axis === 'both') newPosition.x = 50;
    if (axis === 'y' || axis === 'both') newPosition.y = 25;

    setPosition(newPosition);
    onPositionChange?.(newPosition);
  }, [disabled, position, onPositionChange]);

  // Grid rendering function
  const renderGrid = useCallback(() => {
    if (!showGrid) return null;

    const gridLines = [];
    // Vertical center line
    gridLines.push(
      <div key="vertical" className="absolute top-0 bottom-0 left-1/2 w-px bg-blue-500 opacity-50" />
    );
    // Horizontal center line
    gridLines.push(
      <div key="horizontal" className="absolute left-0 right-0 top-1/2 h-px bg-blue-500 opacity-50" />
    );
    // Grid squares
    for (let i = 1; i < 10; i++) {
      gridLines.push(
        <div key={`vertical-${i}`} className="absolute top-0 bottom-0 w-px bg-gray-300 opacity-25"
             style={{ left: `${i * 10}%` }} />,
        <div key={`horizontal-${i}`} className="absolute left-0 right-0 h-px bg-gray-300 opacity-25"
             style={{ top: `${i * 10}%` }} />
      );
    }
    return gridLines;
  }, [showGrid]);

  const mockupUrl = useMemo(() => {
    const baseUrl = "https://res.cloudinary.com/dkot9tyjm/image/upload/";
    const config = PRODUCT_TYPES[editedProduct.ProductType]?.mockupConfig;
    
    if (!config) return "";
    
    const filename = config.getFilename(
      editedProduct.ProductColor, 
      editedProduct.ProductView
    );
    
    return `${baseUrl}${config.version}/${config.folder}/${filename}.png`;
  }, [editedProduct.ProductType, editedProduct.ProductColor, editedProduct.ProductView]);
  
  const handleImageLoad = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  const handleImageError = useCallback(() => {
    setLoading(false);
    setError('Failed to load product mockup');
  }, []);

  const handleDragStart = useCallback((e) => {
    if (disabled) return;
    
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
  }, [disabled]);

  const handleDragMove = useCallback((e) => {
    if (!isDragging || !containerRef.current || disabled) return;

    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    
    const container = containerRef.current.getBoundingClientRect();
    const deltaX = (clientX - dragStart.x) / container.width * 100;
    const deltaY = (clientY - dragStart.y) / container.height * 100;

    const newX = Math.max(0, Math.min(100, position.x + deltaX));
    const newY = Math.max(0, Math.min(100, position.y + deltaY));

    setPosition({ x: newX, y: newY });
    setDragStart({ x: clientX, y: clientY });
    onPositionChange?.({ x: newX, y: newY });
    checkBoundary();
  }, [isDragging, dragStart, position, disabled, onPositionChange, checkBoundary]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoom = useCallback((direction) => {
    if (disabled) return;
    
    const newZoom = direction === 'in' 
      ? Math.min(zoom * 1.1, productConfig.mockupConfig.maxScale)
      : Math.max(zoom * 0.9, productConfig.mockupConfig.minScale);
    
    setZoom(newZoom);
    onZoom?.(newZoom);
    setTimeout(checkBoundary, 0);
  }, [zoom, disabled, productConfig, onZoom, checkBoundary]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    checkBoundary();
  }, [position, zoom, checkBoundary]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Product Preview</h3>
          <div className="flex items-center space-x-4">
            {/* View Controls */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['front', 'back'].map((view) => (
                <button
                  key={view}
                  onClick={() => onViewChange?.(view)}
                  disabled={disabled}
                  className={`
                    px-3 py-1 rounded-md text-sm font-medium transition-all
                    ${editedProduct.ProductView === view 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>

            {/* Grid Toggle */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`
                p-2 rounded-lg border transition-all
                ${showGrid ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
              `}
              title="Toggle Grid"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 4h4m4 0h4m4 0h4M4 8h4m4 0h4m4 0h4M4 12h4m4 0h4m4 0h4M4 16h4m4 0h4m4 0h4M4 20h4m4 0h4m4 0h4" />
              </svg>
            </button>

            {/* Center Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => centerDesign('x')}
                disabled={disabled}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                title="Center Horizontally"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 4v16m-6-8h12" />
                </svg>
              </button>
              <button
                onClick={() => centerDesign('y')}
                disabled={disabled}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                title="Center Vertically"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 12h16m-8-6v12" />
                </svg>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleZoom('out')}
                disabled={disabled || zoom <= productConfig.mockupConfig.minScale}
                className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
                title="Zoom Out"
              >
                <BsZoomOut size={20} />
              </button>
              <span className="text-sm text-gray-500">
                {(zoom * 100).toFixed(0)}%
              </span>
              <button
                onClick={() => handleZoom('in')}
                disabled={disabled || zoom >= productConfig.mockupConfig.maxScale}
                className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
                title="Zoom In"
              >
                <BsZoomIn size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative aspect-square w-full bg-gray-50 overflow-hidden"
      >
        {/* Grid Lines */}
        {renderGrid()}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center text-red-500">
              <AiOutlineWarning size={32} className="mx-auto mb-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        <img
          src={mockupUrl}
          alt={`${editedProduct.ProductType} ${editedProduct.ProductColor} ${editedProduct.ProductView} view`}
          className="w-full h-full object-contain"
          style={{
            filter: colorConfig.mockupModifier !== 'none' ? colorConfig.mockupModifier : undefined
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {!loading && !error && editedProduct.designImage && (
          <div
            ref={designRef}
            className={`
              absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200
              ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
              ${isOutOfBounds ? 'opacity-50' : 'opacity-100'}
            `}
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              width: `${productConfig.mockupConfig.designArea[editedProduct.ProductView].width}px`,
              height: `${productConfig.mockupConfig.designArea[editedProduct.ProductView].height}px`,
              transform: `translate(-50%, -50%) scale(${zoom})`,
              mixBlendMode: colorConfig.designBlendMode
            }}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <img
              src={editedProduct.designImage}
              alt="Design"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 text-sm text-gray-500">
        <div className="flex justify-between items-center">
          <p>
            {disabled 
              ? 'Preview mode: Design position is locked'
              : 'Drag to adjust design position • Use zoom controls to resize'}
          </p>
          {isOutOfBounds && (
            <span className="text-red-500 flex items-center">
              <AiOutlineWarning className="mr-1" />
              Design is outside safe area
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

ProductPreview.propTypes = {
  editedProduct: PropTypes.shape({
    ProductType: PropTypes.string.isRequired,
    ProductColor: PropTypes.string.isRequired,
    ProductView: PropTypes.string.isRequired,
    designImage: PropTypes.string
  }).isRequired,
  onZoom: PropTypes.func,
  onPositionChange: PropTypes.func,
  onViewChange: PropTypes.func,
  disabled: PropTypes.bool
};

ProductPreview.displayName = 'ProductPreview';



const PriceCalculator = memo(({ 
  productType,
  originalPrice,
  discountPrice,
  onChange,
  disabled
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [priceError, setPriceError] = useState(null);
  const productConfig = PRODUCT_TYPES[productType];
  
  const basePrice = useMemo(() => {
    return productConfig.basePrice;
  }, [productConfig]);

  const validatePrice = useCallback((price, isDiscount = false) => {
    if (!price) return 'Price is required';
    if (price < basePrice) {
      return `Price cannot be less than base price (${CURRENCY.format(basePrice)})`;
    }
    if (isDiscount && price > originalPrice) {
      return 'Discount price cannot be higher than original price';
    }
    return null;
  }, [basePrice, originalPrice]);

  const calculateMargin = useCallback((price) => {
    const cost = productConfig.productionCost;
    return ((price - cost) / price * 100).toFixed(1);
  }, [productConfig]);

  const getMarginStatus = useCallback((margin) => {
    const minMargin = productConfig.margins.min * 100;
    const recMargin = productConfig.margins.recommended * 100;
    
    if (margin < minMargin) return 'error';
    if (margin < recMargin) return 'warning';
    return 'success';
  }, [productConfig]);

  const handlePriceChange = useCallback((type, value) => {
    const numValue = parseFloat(value) || 0;
    const error = validatePrice(numValue, type === 'discount');
    setPriceError(error);
    
    if (!error) {
      if (type === 'original') {
        onChange({
          originalPrice: numValue,
          discountPrice: discountPrice > numValue ? numValue : discountPrice
        });
      } else {
        onChange({
          originalPrice,
          discountPrice: numValue > originalPrice ? originalPrice : numValue
        });
      }
    }
  }, [originalPrice, discountPrice, onChange, validatePrice]);

  const profitDetails = useMemo(() => {
    const cost = productConfig.productionCost;
    const profit = originalPrice - cost;
    const profitMargin = (profit / originalPrice) * 100;
    const discountedProfit = discountPrice ? (discountPrice - cost) : profit;
    const discountedMargin = discountPrice ? (discountedProfit / discountPrice) * 100 : profitMargin;

    return {
      profit: CURRENCY.format(profit),
      profitMargin: profitMargin.toFixed(1),
      discountedProfit: CURRENCY.format(discountedProfit),
      discountedMargin: discountedMargin.toFixed(1),
      costPerUnit: CURRENCY.format(cost)
    };
  }, [productConfig, originalPrice, discountPrice]);

  const priceStatus = useMemo(() => {
    if (!originalPrice) return 'error';
    const margin = calculateMargin(originalPrice);
    return getMarginStatus(parseFloat(margin));
  }, [originalPrice, calculateMargin, getMarginStatus]);

  const renderPriceInput = (type, value, label) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value || ''}
          onChange={(e) => handlePriceChange(type, e.target.value)}
          disabled={disabled}
          min={basePrice}
          step="1"
          className={`
            w-full px-3 py-2 border rounded-lg
            ${disabled ? 'bg-gray-100' : 'bg-white'}
            ${priceError ? 'border-red-300' : 
              priceStatus === 'warning' ? 'border-yellow-300' : 
              'border-gray-300'}
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          `}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-gray-500">{CURRENCY.code}</span>
        </div>
      </div>
      {type === 'original' && priceError && (
        <p className="text-sm text-red-600">{priceError}</p>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Price Configuration</h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showAdvanced ? 'Simple View' : 'Advanced Options'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Base Price Info */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700">
              Base Price for {productConfig.label}
            </span>
            <span className="text-lg font-bold text-blue-700">
              {CURRENCY.format(basePrice)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderPriceInput('original', originalPrice, 'Original Price')}
          {renderPriceInput('discount', discountPrice, 'Discount Price (Optional)')}
        </div>

        {showAdvanced && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Profit Analysis</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Cost per unit</p>
                  <p className="text-lg font-bold">{profitDetails.costPerUnit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Profit per unit</p>
                  <p className="text-lg font-bold">{profitDetails.profit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Profit margin</p>
                  <p className={`text-lg font-bold ${
                    getMarginStatus(parseFloat(profitDetails.profitMargin)) === 'error' ? 'text-red-600' :
                    getMarginStatus(parseFloat(profitDetails.profitMargin)) === 'warning' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {profitDetails.profitMargin}%
                  </p>
                </div>
                {discountPrice && (
                  <div>
                    <p className="text-sm text-gray-500">Discounted margin</p>
                    <p className={`text-lg font-bold ${
                      getMarginStatus(parseFloat(profitDetails.discountedMargin)) === 'error' ? 'text-red-600' :
                      getMarginStatus(parseFloat(profitDetails.discountedMargin)) === 'warning' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {profitDetails.discountedMargin}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Final Price</p>
            <p className="text-xl font-bold text-gray-900">
              {CURRENCY.format(originalPrice || 0)}
              {discountPrice && (
                <span className="ml-2 text-sm text-gray-500 line-through">
                  {CURRENCY.format(discountPrice)}
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Profit per sale</p>
            <p className="text-xl font-bold text-gray-900">
              {profitDetails.profit}
              <span className="ml-2 text-sm text-gray-500">
                ({profitDetails.profitMargin}%)
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

PriceCalculator.propTypes = {
  productType: PropTypes.string.isRequired,
  originalPrice: PropTypes.number,
  discountPrice: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

PriceCalculator.displayName = 'PriceCalculator';



const ProductConfig = memo(({ 
  editedProduct, 
  onUpdate, 
  disabled = false 
}) => {
  const [activeTab, setActiveTab] = useState('settings');
  const [tagInput, setTagInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tagError, setTagError] = useState('');

  const debouncedUpdate = useCallback(
    debounce((updates) => {
      onUpdate(updates);
      setIsProcessing(false);
    }, 300),
    [onUpdate]
  );

  const handleTextChange = useCallback((field, value) => {
    if (disabled) return;
    setIsProcessing(true);
    debouncedUpdate({ [field]: value });
  }, [disabled, debouncedUpdate]);

  const handleAvailableColorsChange = useCallback((selectedColors) => {
    if (disabled) return;
    setIsProcessing(true);
    debouncedUpdate({ availableColors: selectedColors });
  }, [disabled, debouncedUpdate]);

  const handleAvailableProductTypesChange = useCallback((selectedTypes) => {
    if (disabled) return;
    setIsProcessing(true);
    debouncedUpdate({ availableProductTypes: selectedTypes });
  }, [disabled, debouncedUpdate]);

  const handleMainTagsChange = useCallback((selectedTags) => {
    if (disabled) return;
    setIsProcessing(true);
    debouncedUpdate({ mainTags: selectedTags });
  }, [disabled, debouncedUpdate]);

  const handleAddTag = useCallback(() => {
    if (disabled || !tagInput.trim()) return;

    const newTags = [...(editedProduct.Designtags || [])];
    const normalizedTag = tagInput.trim().toLowerCase();

    if (newTags.length >= DESIGN_TAGS_CONFIG.maxTags) {
      setTagError(`Maximum ${DESIGN_TAGS_CONFIG.maxTags} tags allowed`);
      return;
    }

    if (!newTags.includes(normalizedTag)) {
      newTags.push(normalizedTag);
      debouncedUpdate({ Designtags: newTags });
      setTagError('');
    }
    setTagInput('');
  }, [disabled, tagInput, editedProduct.Designtags, debouncedUpdate]);

  const handleRemoveTag = useCallback((tagToRemove) => {
    if (disabled) return;
    
    const newTags = (editedProduct.Designtags || []).filter(tag => tag !== tagToRemove);
    if (newTags.length < DESIGN_TAGS_CONFIG.minTags) {
      setTagError(`Minimum ${DESIGN_TAGS_CONFIG.minTags} tag required`);
      return;
    }
    
    debouncedUpdate({ Designtags: newTags });
    setTagError('');
  }, [disabled, editedProduct.Designtags, debouncedUpdate]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }, [handleAddTag]);

  // Custom Multi-Select Dropdown Component
  const MultiSelect = ({ options, value, onChange, placeholder, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div className="relative">
        <div
          className={`
            p-2 border rounded-lg bg-white cursor-pointer
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-blue-500'}
          `}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex flex-wrap gap-1">
            {value.length > 0 ? (
              value.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-sm"
                >
                  {options.find(opt => opt.value === item)?.label || item}
                  {!disabled && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(value.filter(v => v !== item));
                      }}
                      className="ml-1 hover:text-blue-900"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
        </div>
        
        {isOpen && !disabled && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <div
                key={option.value}
                className={`
                  p-2 cursor-pointer hover:bg-blue-50
                  ${value.includes(option.value) ? 'bg-blue-50' : ''}
                `}
                onClick={() => {
                  const newValue = value.includes(option.value)
                    ? value.filter(v => v !== option.value)
                    : [...value, option.value];
                  onChange(newValue);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="border-b border-gray-200">
        <div className="flex items-center px-4 py-2">
          <div className="flex space-x-4">
            {['settings', 'metadata', 'description'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${activeTab === tab 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'}
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Product Types
              </label>
              <MultiSelect
                options={Object.entries(PRODUCT_TYPES).map(([value, config]) => ({
                  value,
                  label: config.label
                }))}
                value={editedProduct.availableProductTypes || [editedProduct.ProductType]}
                onChange={handleAvailableProductTypesChange}
                placeholder="Select available product types..."
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Colors
              </label>
              <MultiSelect
                options={Object.entries(COLOR_OPTIONS).map(([value, config]) => ({
                  value,
                  label: config.label
                }))}
                value={editedProduct.availableColors || [editedProduct.ProductColor]}
                onChange={handleAvailableColorsChange}
                placeholder="Select available colors..."
                disabled={disabled}
              />
            </div>
          </div>
        )}

        {activeTab === 'metadata' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Design Title
              </label>
              <input
                type="text"
                value={editedProduct.DesignTitle || ''}
                onChange={(e) => handleTextChange('DesignTitle', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100"
                placeholder="Enter design title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Main Tags
              </label>
              <MultiSelect
                options={MAIN_TAGS}
                value={editedProduct.mainTags || []}
                onChange={handleMainTagsChange}
                placeholder="Select main tags..."
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Design Tags ({DESIGN_TAGS_CONFIG.minTags}-{DESIGN_TAGS_CONFIG.maxTags} tags)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(editedProduct.Designtags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      disabled={disabled}
                      className="ml-1 hover:text-blue-900 disabled:opacity-50"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={disabled || editedProduct.Designtags?.length >= DESIGN_TAGS_CONFIG.maxTags}
                  className="flex-1 px-3 py-2 border rounded-lg disabled:bg-gray-100"
                  placeholder={editedProduct.Designtags?.length >= DESIGN_TAGS_CONFIG.maxTags 
                    ? "Maximum tags reached" 
                    : "Add a tag..."}
                />
                <button
                  onClick={handleAddTag}
                  disabled={disabled || !tagInput.trim() || editedProduct.Designtags?.length >= DESIGN_TAGS_CONFIG.maxTags}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              {tagError && (
                <p className="mt-1 text-sm text-red-600">{tagError}</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'description' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Description
              </label>
              <textarea
                value={editedProduct.Description || ''}
                onChange={(e) => handleTextChange('Description', e.target.value)}
                disabled={disabled}
                rows={6}
                className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100"
                placeholder="Enter product description..."
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-500">
          <span>
            Last updated: {new Date(editedProduct.updatedAt).toLocaleDateString()}
          </span>
          <span>{isProcessing ? 'Saving...' : 'All changes saved'}</span>
        </div>
      </div>
    </div>
  );
});

ProductConfig.propTypes = {
  editedProduct: PropTypes.shape({
    ProductType: PropTypes.string.isRequired,
    ProductColor: PropTypes.string.isRequired,
    DesignTitle: PropTypes.string,
    Description: PropTypes.string,
    Designtags: PropTypes.arrayOf(PropTypes.string),
    mainTags: PropTypes.arrayOf(PropTypes.string),
    availableColors: PropTypes.arrayOf(PropTypes.string),
    availableProductTypes: PropTypes.arrayOf(PropTypes.string),
    updatedAt: PropTypes.string
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

ProductConfig.displayName = 'ProductConfig';







const ValidationSystem = memo(({ product, onValidationChange }) => {
  const [validationResults, setValidationResults] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  const validationRules = useMemo(() => ({
    design: [
      {
        id: 'designImage',
        name: 'Design Image',
        validate: (product) => ({
          valid: !!product.designImage,
          message: 'Design image is required'
        })
      },
      {
        id: 'designPosition',
        name: 'Design Position',
        validate: (product) => {
          const isWithinBounds = product.DesignPosition && 
            product.DesignPosition.x >= 0 && 
            product.DesignPosition.x <= 100 && 
            product.DesignPosition.y >= 0 && 
            product.DesignPosition.y <= 100;
          
          return {
            valid: isWithinBounds,
            message: 'Design must be within product boundaries'
          };
        }
      },
      {
        id: 'designScale',
        name: 'Design Scale',
        validate: (product) => {
          const config = PRODUCT_TYPES[product.ProductType];
          return {
            valid: product.DesignScale >= config.mockupConfig.minScale &&
                   product.DesignScale <= config.mockupConfig.maxScale,
            message: `Design scale must be between ${config.mockupConfig.minScale}x and ${config.mockupConfig.maxScale}x`
          };
        }
      }
    ],
    metadata: [
      {
        id: 'title',
        name: 'Design Title',
        validate: (product) => ({
          valid: product.DesignTitle?.length >= 5,
          message: 'Title must be at least 5 characters long'
        })
      },
      {
        id: 'description',
        name: 'Description',
        validate: (product) => ({
          valid: product.Description?.length >= 20,
          message: 'Description must be at least 20 characters long'
        })
      },
      {
        id: 'designTags',
        name: 'Design Tags',
        validate: (product) => ({
          valid: Array.isArray(product.Designtags) && 
                 product.Designtags.length >= DESIGN_TAGS_CONFIG.minTags &&
                 product.Designtags.length <= DESIGN_TAGS_CONFIG.maxTags,
          message: `Must have between ${DESIGN_TAGS_CONFIG.minTags} and ${DESIGN_TAGS_CONFIG.maxTags} design tags`
        })
      },
      {
        id: 'mainTags',
        name: 'Main Tags',
        validate: (product) => ({
          valid: Array.isArray(product.mainTags) && product.mainTags.length > 0,
          message: 'At least one main tag must be selected'
        })
      }
    ],
    productConfig: [
      {
        id: 'availableColors',
        name: 'Available Colors',
        validate: (product) => ({
          valid: Array.isArray(product.availableColors) && product.availableColors.length > 0,
          message: 'At least one color must be available'
        })
      },
      {
        id: 'availableTypes',
        name: 'Available Product Types',
        validate: (product) => ({
          valid: Array.isArray(product.availableProductTypes) && product.availableProductTypes.length > 0,
          message: 'At least one product type must be available'
        })
      },
      {
        id: 'colorCompatibility',
        name: 'Color Compatibility',
        validate: (product) => ({
          valid: product.availableColors?.includes(product.ProductColor),
          message: 'Selected color must be in available colors'
        })
      },
      {
        id: 'typeCompatibility',
        name: 'Type Compatibility',
        validate: (product) => ({
          valid: product.availableProductTypes?.includes(product.ProductType),
          message: 'Selected product type must be in available types'
        })
      }
    ],
    pricing: [
      {
        id: 'basePrice',
        name: 'Base Price',
        validate: (product) => {
          const basePrice = PRODUCT_TYPES[product.ProductType].basePrice;
          return {
            valid: product.originalPrice >= basePrice,
            message: `Price must be at least ${CURRENCY.format(basePrice)} for ${PRODUCT_TYPES[product.ProductType].label}`
          };
        }
      },
      {
        id: 'discountPrice',
        name: 'Discount Price',
        validate: (product) => {
          if (!product.discountPrice) return { valid: true };
          const basePrice = PRODUCT_TYPES[product.ProductType].basePrice;
          return {
            valid: product.discountPrice >= basePrice && product.discountPrice <= product.originalPrice,
            message: `Discount price must be between ${CURRENCY.format(basePrice)} and original price`
          };
        }
      },
      {
        id: 'profitMargin',
        name: 'Profit Margin',
        validate: (product) => {
          const cost = PRODUCT_TYPES[product.ProductType].productionCost;
          const margin = (product.originalPrice - cost) / product.originalPrice;
          const minMargin = PRODUCT_TYPES[product.ProductType].margins.min;
          return {
            valid: margin >= minMargin,
            message: `Profit margin must be at least ${(minMargin * 100).toFixed(1)}%`
          };
        }
      }
    ]
  }), []);

  const validateProduct = useCallback(async () => {
    setIsValidating(true);
    const results = {};

    try {
      Object.entries(validationRules).forEach(([category, rules]) => {
        results[category] = rules.map(rule => ({
          ...rule,
          ...rule.validate(product)
        }));
      });

      setValidationResults(results);

      // Calculate overall validation status
      const isValid = Object.values(results).every(
        categoryRules => categoryRules.every(rule => rule.valid)
      );

      onValidationChange(isValid);
      return isValid;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [product, validationRules, onValidationChange]);

  useEffect(() => {
    const timeoutId = setTimeout(validateProduct, 500);
    return () => clearTimeout(timeoutId);
  }, [product, validateProduct]);

  const getCategoryStatus = useCallback((rules) => {
    if (!rules || rules.length === 0) return 'pending';
    if (rules.every(rule => rule.valid)) return 'success';
    return 'error';
  }, []);

  const getCategoryIcon = useCallback((status) => {
    switch (status) {
      case 'success':
        return (
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
    }
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Validation Status</h3>
      </div>

      <div className="p-4">
        {isValidating ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(validationResults).map(([category, rules]) => {
              const categoryStatus = getCategoryStatus(rules);
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(categoryStatus)}
                      <h4 className="font-medium text-gray-900 capitalize">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {rules.map(rule => (
                      <div
                        key={rule.id}
                        className={`
                          flex items-center justify-between p-2 rounded
                          ${rule.valid ? 'bg-green-50' : 'bg-red-50'}
                        `}
                      >
                        <span className={`
                          text-sm font-medium
                          ${rule.valid ? 'text-green-800' : 'text-red-800'}
                        `}>
                          {rule.name}
                        </span>
                        {!rule.valid && (
                          <span className="text-sm text-red-600">
                            {rule.message}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            All checks must pass before approval
          </span>
          {!isValidating && (
            <button
              onClick={validateProduct}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       transition-colors duration-200"
            >
              Run Validation
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

ValidationSystem.propTypes = {
  product: PropTypes.shape({
    designImage: PropTypes.string,
    DesignPosition: PropTypes.object,
    DesignScale: PropTypes.number,
    DesignTitle: PropTypes.string,
    Description: PropTypes.string,
    Designtags: PropTypes.arrayOf(PropTypes.string),
    mainTags: PropTypes.arrayOf(PropTypes.string),
    availableColors: PropTypes.arrayOf(PropTypes.string),
    availableProductTypes: PropTypes.arrayOf(PropTypes.string),
    ProductType: PropTypes.string.isRequired,
    ProductColor: PropTypes.string.isRequired,
    originalPrice: PropTypes.number,
    discountPrice: PropTypes.number
  }).isRequired,
  onValidationChange: PropTypes.func.isRequired
};

ValidationSystem.displayName = 'ValidationSystem';





const StatusManager = memo(({ 
  product, 
  onStatusChange, 
  onReasonChange, 
  disabled 
}) => {
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStatusChange = useCallback((newStatus) => {
    if (disabled || isProcessing) return;

    const statusChanges = {
      'rejected': {
        title: 'Reject Product',
        message: 'This will notify the seller and remove the product from public view.',
        action: 'Reject',
        actionColor: 'bg-red-600 hover:bg-red-700',
        requiresReason: true
      },
      'public': {
        title: 'Approve Product',
        message: 'This will make the product visible to all users.',
        action: 'Approve',
        actionColor: 'bg-green-600 hover:bg-green-700',
        requiresReason: false
      }
    };

    const change = statusChanges[newStatus];
    if (change) {
      setConfirmDialog({
        status: newStatus,
        ...change
      });
    }
  }, [disabled, isProcessing]);

  const handleConfirm = useCallback(async () => {
    if (!confirmDialog || isProcessing) return;

    try {
      setIsProcessing(true);
      await onStatusChange(confirmDialog.status);
      setConfirmDialog(null);
      toast.success(`Product ${confirmDialog.status === 'public' ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      console.error('Status change failed:', error);
      toast.error('Failed to update product status');
    } finally {
      setIsProcessing(false);
    }
  }, [confirmDialog, isProcessing, onStatusChange]);

  const handleReasonChange = useCallback((e) => {
    onReasonChange(e.target.value);
  }, [onReasonChange]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Product Status</h3>
      </div>

      <div className="p-4 space-y-6">
        {/* Current Status */}
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-500">Current Status:</span>
          <span className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${STATUS_CONFIG[product.status].color} ${STATUS_CONFIG[product.status].textColor}
          `}>
            {STATUS_CONFIG[product.status].label}
          </span>
        </div>

        {/* Status History */}
        {product.statusHistory && product.statusHistory.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Status History</h4>
            <div className="space-y-1">
              {product.statusHistory.map((history, index) => (
                <div key={index} className="text-sm text-gray-600 flex justify-between">
                  <span>{STATUS_CONFIG[history.status].label}</span>
                  <span>{new Date(history.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleStatusChange('public')}
            disabled={disabled || isProcessing || product.status === 'public'}
            className={`
              p-3 rounded-lg border border-green-500 transition-all
              ${disabled || product.status === 'public'
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-green-50'}
            `}
          >
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <AiOutlineInfoCircle size={20} />
              <span>Approve Product</span>
            </div>
          </button>

          <button
            onClick={() => handleStatusChange('rejected')}
            disabled={disabled || isProcessing || product.status === 'rejected'}
            className={`
              p-3 rounded-lg border border-red-500 transition-all
              ${disabled || product.status === 'rejected'
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-red-50'}
            `}
          >
            <div className="flex items-center justify-center space-x-2 text-red-600">
              <AiOutlineWarning size={20} />
              <span>Reject Product</span>
            </div>
          </button>
        </div>

        {/* Rejection Reason */}
        {(product.status === 'rejected' || confirmDialog?.requiresReason) && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Rejection Reason
            </label>
            <textarea
              value={product.rejectionReason || ''}
              onChange={handleReasonChange}
              disabled={disabled || isProcessing}
              rows={3}
              className={`
                w-full px-3 py-2 border rounded-lg resize-none
                ${disabled ? 'bg-gray-100' : 'bg-white'}
                focus:ring-2 focus:ring-red-500 focus:border-red-500
              `}
              placeholder="Provide a detailed reason for rejection..."
            />
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 m-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmDialog.title}
            </h3>
            <p className="text-gray-600 mb-4">{confirmDialog.message}</p>
            
            {confirmDialog.requiresReason && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason
                </label>
                <textarea
                  value={product.rejectionReason || ''}
                  onChange={handleReasonChange}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg resize-none
                           focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Provide a detailed reason for rejection..."
                />
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDialog(null)}
                disabled={isProcessing}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isProcessing || (confirmDialog.requiresReason && !product.rejectionReason)}
                className={`
                  px-4 py-2 rounded-lg text-white transition-colors
                  ${confirmDialog.actionColor}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  confirmDialog.action
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

StatusManager.propTypes = {
  product: PropTypes.shape({
    status: PropTypes.string.isRequired,
    rejectionReason: PropTypes.string,
    statusHistory: PropTypes.arrayOf(PropTypes.shape({
      status: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired
    }))
  }).isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onReasonChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

StatusManager.displayName = 'StatusManager';



const AdminProductApproval = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { isLoading, pendingProducts } = useSelector((state) => state.product);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editedProduct, setEditedProduct] = useState(null);
  const [validationStatus, setValidationStatus] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showGridLines, setShowGridLines] = useState(false);

  // Load pending products
  useEffect(() => {
    dispatch(fetchPendingProducts());
  }, [dispatch]);

  // Filter and search products
  const filteredProducts = useMemo(() => {
    if (!pendingProducts) return [];
    
    return pendingProducts.filter(product => {
      const matchesSearch = searchQuery === '' || 
        product.DesignTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.Description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.mainTags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        product.Designtags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
      const matchesFilter = filterStatus === 'all' || product.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  }, [pendingProducts, searchQuery, filterStatus]);

  // Handle product selection
  const handleProductSelect = useCallback((product) => {
    setSelectedProduct(product);
    setEditedProduct({
      ...product,
      DesignScale: product.DesignScale || 1,
      DesignPosition: product.DesignPosition || { x: 50, y: 25 },
      originalPrice: product.originalPrice || PRODUCT_TYPES[product.ProductType].basePrice,
      availableColors: product.availableColors || [product.ProductColor],
      availableProductTypes: product.availableProductTypes || [product.ProductType],
      mainTags: product.mainTags || []
    });
  }, []);

  // Handle product updates with validation
  const handleProductUpdate = useCallback((updates) => {
    setEditedProduct(prev => {
      const updated = {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Validate base price based on product type
      if (updates.ProductType || updates.originalPrice) {
        const basePrice = PRODUCT_TYPES[updated.ProductType].basePrice;
        if (updated.originalPrice < basePrice) {
          updated.originalPrice = basePrice;
        }
        if (updated.discountPrice && updated.discountPrice < basePrice) {
          updated.discountPrice = basePrice;
        }
      }

      // Validate design tags count
      if (updates.Designtags) {
        if (updates.Designtags.length > 7) {
          updated.Designtags = updates.Designtags.slice(0, 7);
        }
      }

      // Ensure product color is in available colors
      if (updates.availableColors && !updates.availableColors.includes(updated.ProductColor)) {
        updated.availableColors = [...updates.availableColors, updated.ProductColor];
      }

      // Ensure product type is in available types
      if (updates.availableProductTypes && !updates.availableProductTypes.includes(updated.ProductType)) {
        updated.availableProductTypes = [...updates.availableProductTypes, updated.ProductType];
      }

      return updated;
    });
  }, []);

  // Handle design position update
  const handlePositionChange = useCallback((position) => {
    handleProductUpdate({ DesignPosition: position });
  }, [handleProductUpdate]);

  // Handle center alignment
  const handleCenterAlignment = useCallback((axis) => {
    const newPosition = { ...editedProduct.DesignPosition };
    if (axis === 'x' || axis === 'both') newPosition.x = 50;
    if (axis === 'y' || axis === 'both') newPosition.y = 25;
    handleProductUpdate({ DesignPosition: newPosition });
  }, [editedProduct, handleProductUpdate]);

  // Handle validation status updates
  const handleValidationUpdate = useCallback((isValid) => {
    setValidationStatus(prev => ({
      ...prev,
      isValid
    }));
  }, []);

  // Handle status change
  const handleStatusChange = useCallback(async (newStatus) => {
    if (!editedProduct) return;

    try {
      setIsSubmitting(true);
      
      const updates = {
        ...editedProduct,
        status: newStatus,
        originalPrice: parseFloat(editedProduct.originalPrice),
        discountPrice: editedProduct.discountPrice ? parseFloat(editedProduct.discountPrice) : null,
        availableColors: editedProduct.availableColors || [editedProduct.ProductColor],
        availableProductTypes: editedProduct.availableProductTypes || [editedProduct.ProductType],
        mainTags: editedProduct.mainTags || []
      };

      await dispatch(approveRejectProduct(
        editedProduct._id,
        newStatus,
        editedProduct.rejectionReason,
        updates
      ));

      toast.success(`Product ${newStatus === 'public' ? 'approved' : 'rejected'} successfully`);
      setSelectedProduct(null);
      setEditedProduct(null);
      dispatch(fetchPendingProducts());
    } catch (error) {
      console.error('Status change failed:', error);
      toast.error(error.message || 'Failed to update product status');
    } finally {
      setIsSubmitting(false);
    }
  }, [editedProduct, dispatch]);

  // Check if user has admin access
  if (!user?.role === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">
            Access Denied
          </h2>
          <p className="mt-2 text-gray-600">
            You need administrator privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Product Approval Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {filteredProducts.length} products pending review
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex space-x-4 w-full sm:w-auto">
            <div className="flex-1 sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <option key={status} value={status}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Product List */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  Pending Products
                </h2>
              </div>
              
              {isLoading ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No products found matching your criteria
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {filteredProducts.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => handleProductSelect(product)}
                      className={`
                        w-full p-4 rounded-lg transition-all duration-200
                        ${selectedProduct?._id === product._id 
                          ? 'bg-blue-50 border-2 border-blue-500' 
                          : 'hover:bg-gray-50 border border-gray-200'}
                      `}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1 text-left">
                          <h3 className="font-medium text-gray-900">
                            {product.DesignTitle || 'Untitled Design'}
                          </h3>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {product.mainTags?.map(tag => (
                              <span key={tag} className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(product.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`
                          px-3 py-1 rounded-full text-xs font-medium
                          ${STATUS_CONFIG[product.status].color} 
                          ${STATUS_CONFIG[product.status].textColor}
                        `}>
                          {STATUS_CONFIG[product.status].label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Review Area */}
          {selectedProduct && editedProduct ? (
            <div className="w-full lg:w-2/3 space-y-6">
              <ProductPreview
                editedProduct={editedProduct}
                onPositionChange={handlePositionChange}
                onCenterAlignment={handleCenterAlignment}
                onZoom={(scale) => handleProductUpdate({ DesignScale: scale })}
                onViewChange={(view) => handleProductUpdate({ ProductView: view })}
                showGridLines={showGridLines}
                onToggleGridLines={() => setShowGridLines(!showGridLines)}
                disabled={isSubmitting}
              />

              <ProductConfig
                editedProduct={editedProduct}
                onUpdate={handleProductUpdate}
                disabled={isSubmitting}
              />

              <PriceCalculator
                productType={editedProduct.ProductType}
                originalPrice={editedProduct.originalPrice}
                discountPrice={editedProduct.discountPrice}
                onChange={({ originalPrice, discountPrice }) => 
                  handleProductUpdate({ originalPrice, discountPrice })}
                disabled={isSubmitting}
              />

              <ValidationSystem
                product={editedProduct}
                onValidationChange={handleValidationUpdate}
              />

              <StatusManager
                product={editedProduct}
                onStatusChange={handleStatusChange}
                onReasonChange={(reason) => handleProductUpdate({ rejectionReason: reason })}
                disabled={!validationStatus.isValid || isSubmitting}
              />
            </div>
          ) : (
            <div className="w-full lg:w-2/3 flex items-center justify-center bg-white rounded-xl shadow-lg p-8">
              <div className="text-center text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No product selected
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select a product from the list to review it
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent" />
            <p className="mt-4 text-gray-600">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductApproval;