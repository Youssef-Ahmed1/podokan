// components/Products/ProductDisplay.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDesignScaling } from '../../hooks/useDesignScaling';
import { FiZoomIn, FiZoomOut, FiMove } from 'react-icons/fi';

const ProductDisplay = ({ product, onUpdateDesign }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  
  const {
    scale,
    position,
    handleScaleChange,
    handlePositionChange
  } = useDesignScaling(product.ProductType, product.DesignScale);

  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  
  const handleZoom = (direction) => {
    const newScale = direction === 'in' ? scale * 1.1 : scale * 0.9;
    handleScaleChange(newScale);
  };

  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => setIsDragging(false);
  
  const handleDrag = (event, info) => {
    if (!isZoomed) return;
    setDragPosition({
      x: dragPosition.x + info.delta.x,
      y: dragPosition.y + info.delta.y
    });
    handlePositionChange({
      x: position.x + info.delta.x,
      y: position.y + info.delta.y
    });
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && isZoomed) {
        setIsZoomed(false);
        setDragPosition({ x: 0, y: 0 });
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isZoomed]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative aspect-square w-full xs:w-[475px] sm:w-[600px] md:w-[700px] 
        lg:w-[800px] xl:w-[900px] mx-auto rounded-2xl overflow-hidden bg-white shadow-lg">
        {/* Product Preview Background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100"
          initial={false}
          animate={{
            scale: isZoomed ? 1.1 : 1,
            transition: { duration: 0.3 }
          }}
        />

        {/* Product Image */}
        <motion.div
          ref={containerRef}
          className={`absolute inset-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          drag={isZoomed}
          dragConstraints={containerRef}
          dragElastic={0.1}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrag={handleDrag}
          initial={false}
          animate={{
            scale: isZoomed ? scale : 1,
            x: isZoomed ? dragPosition.x : 0,
            y: isZoomed ? dragPosition.y : 0,
            transition: { duration: 0.3 }
          }}
        >
          <img
            src={product.ProductImage}
            alt={product.ProductTitle}
            className="w-full h-full object-contain"
          />
          
          {/* Design Overlay */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            style={{
              width: `${product.DesignWidth}px`,
              height: `${product.DesignHeight}px`
            }}
          >
            <img
              src={product.DesignImage}
              alt="Design"
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </motion.div>
        </motion.div>

        {/* Controls */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleZoom('out')}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg
              hover:bg-white transition-colors"
          >
            <FiZoomOut className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleZoom('in')}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg
              hover:bg-white transition-colors"
          >
            <FiZoomIn className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg
              hover:bg-white transition-colors"
          >
            <FiMove className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Zoom Instructions */}
        <AnimatePresence>
          {isZoomed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute top-4 left-1/2 transform -translate-x-1/2
                bg-black/75 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm"
            >
              Drag to move • Press ESC to reset
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Product Info */}
      <div className="mt-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {product.ProductTitle}
        </h2>
        <p className="text-gray-500">
          {product.ProductDescription}
        </p>
      </div>
    </div>
  );
};

export default ProductDisplay;