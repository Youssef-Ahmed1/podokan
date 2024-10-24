import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createProduct } from "../../redux/actions/product";
import { AiOutlineCloudUpload, AiOutlineDelete, AiOutlineInfoCircle } from "react-icons/ai";
import { BiRuler, BiMove } from "react-icons/bi";
import { MdOutlineKeyboardArrowUp, MdOutlineKeyboardArrowDown, 
         MdOutlineKeyboardArrowLeft, MdOutlineKeyboardArrowRight } from "react-icons/md";

// Constants
const COLOR_OPTIONS = {
  white: { value: 'white', label: 'White', hex: '#ffffff', textColor: 'text-gray-800' },
  black: { value: 'black', label: 'Black', hex: '#000000', textColor: 'text-white' },
  red: { value: 'red', label: 'Red', hex: '#ff0000', textColor: 'text-white' },
  blue: { value: 'blue', label: 'Blue', hex: '#0000ff', textColor: 'text-white' },
  gray: { value: 'gray', label: 'Gray', hex: '#808080', textColor: 'text-white' }
};

const BOUNDARY_LIMITS = {
  't-shirt': { top: 25, bottom: 70, left: 25, right: 75 },
  'hoodie': { top: 30, bottom: 65, left: 30, right: 70 },
  'long-sleeve': { top: 25, bottom: 70, left: 25, right: 75 }
};

const PRODUCT_TYPES = {
  't-shirt': {
    label: 'T-Shirt',
    mockupConfig: {
      version: "v1728393898",
      folder: "t-shirts",
      getFilename: (color, view) => `t-shirt-${color}-${view}`
    }
  },
  'hoodie': {
    label: 'Hoodie',
    mockupConfig: {
      version: "v1728392918",
      folder: "hoodies",
      getFilename: (color, view) => `hoodie-${color}-${view}`
    }
  },
  'long-sleeve': {
    label: 'Long Sleeve',
    mockupConfig: {
      version: "v1728394665",
      folder: "long-sleeves",
      getFilename: (color, view) => color === "gray" 
        ? `longsleeves-${color}-${view}`
        : ["white", "black"].includes(color)
          ? `longseleves-${color}-${view}`
          : `t-shirt-${color}-${view}`
    }
  }
};

// Utility Functions
const getMockupUrl = (productType = 't-shirt', color = 'white', view = 'front') => {
  const baseUrl = "https://res.cloudinary.com/dkot9tyjm/image/upload/";
  const config = PRODUCT_TYPES[productType]?.mockupConfig;
  
  if (!config) return "";
  
  const filename = config.getFilename(color, view);
  return `${baseUrl}${config.version}/${config.folder}/${filename}.png`;
};

const compressDesign = async (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = async () => {
      try {
        let { width, height } = img;
        const MAX_DIMENSION = 2000;
        const TARGET_SIZE = 500 * 1024; // 500KB
        
        if (Math.max(width, height) > MAX_DIMENSION) {
          const ratio = MAX_DIMENSION / Math.max(width, height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.filter = 'sharpen(1)';
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        let blob;
        
        while (quality >= 0.3) {
          blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', quality));
          
          if (blob.size <= TARGET_SIZE) break;
          
          quality -= 0.1;
        }

        const compressedFile = new File([blob], file.name, {
          type: 'image/png',
          lastModified: Date.now()
        });

        const dpi = calculateDPI(width, height);

        resolve({
          file: compressedFile,
          compressedSize: blob.size,
          width,
          height,
          quality: quality * 100,
          dpi,
          compressionRatio: ((file.size - blob.size) / file.size * 100).toFixed(2)
        });
      } catch (error) {
        reject(new Error('Compression failed: ' + error.message));
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

const createDesignPreview = async (file, productColor) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (['black', 'navy', 'gray'].includes(productColor)) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

const checkTransparency = async (file) => {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 250) {
          resolve(true);
          return;
        }
      }
      resolve(false);
    };

    img.src = URL.createObjectURL(file);
  });
};

const calculateDPI = (width, height) => {
  const PRINT_SIZE = 12;
  return Math.min(width, height) / PRINT_SIZE;
};const CreateProduct = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { seller } = useSelector((state) => state.seller);

  // Refs
  const designPreviewRef = useRef(null);
  const mockupContainerRef = useRef(null);
  const designPositionRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef(null);

  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [designQualityScore, setDesignQualityScore] = useState(null);
  const [showGuides, setShowGuides] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isDesignVisible, setIsDesignVisible] = useState(true);
  const [designStats, setDesignStats] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Form State
  const [formState, setFormState] = useState({
    DesignTitle: "",
    Description: "",
    Maintag: "",
    Designtags: "",
    ProductType: "t-shirt",
    ProductColor: "white",
    ProductView: "front",
    DesignScale: 1,
    shopId: "",
    designPosition: { x: 50, y: 50 },
    availableColors: ["white"],
    price: {
      original: 0,
      discount: 0
    }
  });

  // Design File State
  const [designFile, setDesignFile] = useState({
    preview: null,
    file: null,
    originalFile: null,
    compressionStats: null,
    error: null
  });

  // Design Quality Scoring System
  const calculateDesignQualityScore = (imageInfo) => {
    let score = 100;
    let feedback = [];

    // DPI Score (40 points)
    const dpiScore = Math.min(40, (imageInfo.dpi / 300) * 40);
    score -= (40 - dpiScore);
    if (imageInfo.dpi < 300) {
      feedback.push({
        type: 'error',
        message: `DPI is ${Math.round(imageInfo.dpi)}. Minimum required is 300 DPI.`
      });
    }

    // Size Score (30 points)
    const sizeScore = Math.min(30, (Math.min(imageInfo.compressedSize, 500000) / 500000) * 30);
    score -= (30 - sizeScore);
    if (imageInfo.compressedSize > 500000) {
      feedback.push({
        type: 'warning',
        message: 'File size is larger than recommended.'
      });
    }

    // Transparency Score (20 points)
    if (!imageInfo.hasTransparency) {
      score -= 20;
      feedback.push({
        type: 'error',
        message: 'Design should have a transparent background.'
      });
    }

    // Dimension Score (10 points)
    const minDimension = Math.min(imageInfo.width, imageInfo.height);
    if (minDimension < 1000) {
      score -= 10;
      feedback.push({
        type: 'error',
        message: 'Design dimensions should be at least 1000x1000 pixels.'
      });
    }

    return {
      score: Math.max(0, Math.round(score)),
      feedback,
      details: {
        dpi: imageInfo.dpi,
        size: imageInfo.compressedSize,
        dimensions: `${imageInfo.width}x${imageInfo.height}`,
        transparency: imageInfo.hasTransparency
      }
    };
  };

  // Initial Setup Effect
  useEffect(() => {
    if (seller && seller._id) {
      setFormState(prev => ({ ...prev, shopId: seller._id }));
      setIsLoading(false);
    } else if (seller === null) {
      toast.error("Please log in as a seller to create products");
      navigate("/login");
    }
  }, [seller, navigate]);

  // Keyboard Controls Effect
  useEffect(() => {
    if (!designFile.preview) return;

    const handleKeyDown = (e) => {
      if (!designFile.preview || isSubmitting) return;

      const MOVE_STEP = e.shiftKey ? 5 : 1;
      const currentPos = formState.designPosition;
      let newPos = { ...currentPos };

      switch (e.key) {
        case 'ArrowUp':
          newPos.y = Math.max(0, currentPos.y - MOVE_STEP);
          e.preventDefault();
          break;
        case 'ArrowDown':
          newPos.y = Math.min(100, currentPos.y + MOVE_STEP);
          e.preventDefault();
          break;
        case 'ArrowLeft':
          newPos.x = Math.max(0, currentPos.x - MOVE_STEP);
          e.preventDefault();
          break;
        case 'ArrowRight':
          newPos.x = Math.min(100, currentPos.x + MOVE_STEP);
          e.preventDefault();
          break;
        case 'Escape':
          setIsDragging(false);
          break;
        default:
          return;
      }

      checkBoundariesAndUpdate(newPos);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formState.designPosition, designFile.preview, formState.ProductType, isSubmitting]);

  // Boundary Checking
  const checkBoundariesAndUpdate = useCallback((position) => {
    const boundaries = BOUNDARY_LIMITS[formState.ProductType];
    if (!boundaries) return;

    const isWithinBounds = 
      position.x >= boundaries.left && 
      position.x <= boundaries.right && 
      position.y >= boundaries.top && 
      position.y <= boundaries.bottom;

    setIsDesignVisible(isWithinBounds);
    
    if (isWithinBounds) {
      setFormState(prev => ({
        ...prev,
        designPosition: position
      }));
    }

    return isWithinBounds;
  }, [formState.ProductType]);

  // Design Upload Handler
  const handleDesignUpload = async (file) => {
    try {
      if (!file) return;

      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size exceeds 50MB limit");
        return;
      }

      if (file.type !== "image/png") {
        toast.error("Please upload only PNG files");
        return;
      }

      setIsLoading(true);
      
      const compressionResult = await compressDesign(file);
      if (compressionResult.compressedSize > 500 * 1024) {
        throw new Error("Unable to compress image to required size");
      }

      const previewUrl = await createDesignPreview(compressionResult.file, formState.ProductColor);
      const hasTransparency = await checkTransparency(compressionResult.file);
      
      const qualityScore = calculateDesignQualityScore({
        dpi: compressionResult.dpi,
        compressedSize: compressionResult.compressedSize,
        width: compressionResult.width,
        height: compressionResult.height,
        hasTransparency
      });

      setDesignFile({
        preview: previewUrl,
        file: compressionResult.file,
        originalFile: file,
        compressionStats: compressionResult,
        error: null
      });

      setDesignQualityScore(qualityScore);
      setDesignStats(compressionResult);

      toast.success(
        `Design compressed from ${(file.size / (1024 * 1024)).toFixed(2)}MB to ` +
        `${(compressionResult.compressedSize / 1024).toFixed(2)}KB`
      );

      if (qualityScore.score < 80) {
        toast.warning("Design quality could be improved. Check the quality score details.");
      }

    } catch (error) {
      console.error("Design upload error:", error);
      setDesignFile(prev => ({ ...prev, error: error.message }));
      toast.error(error.message || "Failed to process design");
    } finally {
      setIsLoading(false);
    }
  };

  // Drag and Drop Handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleDesignUpload(file);
    }
  }, []);

  // Design Position Handler
  const handleDesignDrag = useCallback((e) => {
    if (!mockupContainerRef.current || !isDragging) return;

    const rect = mockupContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    checkBoundariesAndUpdate({ x, y });
  }, [isDragging, checkBoundariesAndUpdate]);

  // Form Validation
  const validateForm = useCallback(() => {
    const errors = {};

    if (!designFile.file) {
      errors.design = "Please upload a design";
    }

    if (!formState.DesignTitle.trim()) {
      errors.DesignTitle = "Design title is required";
    }

    if (!formState.Maintag.trim()) {
      errors.Maintag = "Main tag is required";
    }

    if (!formState.Description.trim()) {
      errors.Description = "Description is required";
    }

    if (formState.price.original <= 0) {
      errors.price = "Please set a valid price";
    }

    if (formState.price.discount >= formState.price.original) {
      errors.discount = "Discount price must be less than original price";
    }

    return errors;
  }, [formState, designFile]);

  // Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast.error("Please fix all validation errors");
        return;
      }

      setIsSubmitting(true);

      if (designQualityScore?.score < 60) {
        const proceed = window.confirm(
          "Design quality is low. This might affect print quality. Do you want to proceed?"
        );
        if (!proceed) {
          setIsSubmitting(false);
          return;
        }
      }

      const formData = new FormData();
      Object.entries(formState).forEach(([key, value]) => {
        if (key === 'designPosition' || key === 'availableColors' || key === 'price') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });

      if (designFile.file) {
        formData.append("designImage", designFile.file);
      }

      const response = await dispatch(createProduct(formData));
      if (response?.success) {
        toast.success("Product created successfully and is awaiting inspection!");
        navigate("/dashboard");
      } else {
        throw new Error(response?.message || "Failed to create product");
      }

    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error.message || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };// UI Component: Design Quality Indicator
  const QualityIndicator = ({ score }) => (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Design Quality Score</h3>
        <span className={`text-lg font-bold ${
          score > 80 ? 'text-green-500' : 
          score > 60 ? 'text-yellow-500' : 
          'text-red-500'
        }`}>
          {score}/100
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${
            score > 80 ? 'bg-green-500' : 
            score > 60 ? 'bg-yellow-500' : 
            'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );

  // Main Render
  return (
    <div className="w-[90%] 800px:w-[90%] bg-white shadow h-[80vh] rounded-[4px] p-3 overflow-y-scroll">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-4 text-center text-gray-800">Create New Design</h2>
        
        {/* Design Upload Area */}
        <div className="mb-8">
          {!designFile.preview ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 transition-all ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('design-upload').click()}
            >
              <div className="text-center">
                <AiOutlineCloudUpload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-600">
                  Drop your design here or click to upload
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  PNG files only, max 50MB
                </p>
              </div>
              <input
                id="design-upload"
                type="file"
                accept="image/png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDesignUpload(file);
                }}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              {/* Design Preview */}
              <div 
                ref={mockupContainerRef}
                className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden"
                onMouseMove={handleDesignDrag}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
              >
                {/* Product Mockup */}
                <img
                  src={getMockupUrl(
                    formState.ProductType,
                    formState.ProductColor,
                    formState.ProductView
                  )}
                  alt="Product Mockup"
                  className="w-full h-full object-contain"
                />

                {/* Design Overlay */}
                {isDesignVisible && (
                  <div
                    ref={designPreviewRef}
                    style={{
                      position: 'absolute',
                      top: `${formState.designPosition.y}%`,
                      left: `${formState.designPosition.x}%`,
                      transform: `translate(-50%, -50%) scale(${formState.DesignScale})`,
                      width: '200px',
                      height: '200px',
                      cursor: isDragging ? 'grabbing' : 'grab',
                      transition: isDragging ? 'none' : 'all 0.2s ease-out'
                    }}
                  >
                    <img
                      src={designFile.preview}
                      alt="Design Preview"
                      className="w-full h-full object-contain"
                      draggable="false"
                    />
                  </div>
                )}

                {/* Design Guides */}
                {showGuides && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div 
                      className="border-2 border-blue-500 border-dashed opacity-30"
                      style={{
                        position: 'absolute',
                        top: `${BOUNDARY_LIMITS[formState.ProductType].top}%`,
                        left: `${BOUNDARY_LIMITS[formState.ProductType].left}%`,
                        right: `${100 - BOUNDARY_LIMITS[formState.ProductType].right}%`,
                        bottom: `${100 - BOUNDARY_LIMITS[formState.ProductType].bottom}%`
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Design Controls */}
              <div className="mt-4 flex flex-wrap justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowGuides(!showGuides)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {showGuides ? 'Hide Guides' : 'Show Guides'}
                </button>
                <button
                  type="button"
                  onClick={() => setFormState(prev => ({
                    ...prev,
                    ProductView: prev.ProductView === "front" ? "back" : "front"
                  }))}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  Switch to {formState.ProductView === "front" ? "Back" : "Front"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDesignFile({
                      preview: null,
                      file: null,
                      originalFile: null,
                      compressionStats: null,
                      error: null
                    });
                    setDesignQualityScore(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
                  disabled={isSubmitting}
                >
                  Remove Design
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quality Score and Stats */}
        {designQualityScore && (
          <div className="mb-8 space-y-4">
            <QualityIndicator score={designQualityScore.score} />
            
            {/* Detailed Stats */}
            <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
              <h3 className="font-semibold text-gray-700">Design Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Original Size: {(designFile.originalFile.size / (1024 * 1024)).toFixed(2)}MB
                  </p>
                  <p className="text-sm text-gray-600">
                    Compressed Size: {(designFile.compressionStats.compressedSize / 1024).toFixed(2)}KB
                  </p>
                  <p className="text-sm text-gray-600">
                    Compression Ratio: {designFile.compressionStats.compressionRatio}%
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Dimensions: {designFile.compressionStats.width}x{designFile.compressionStats.height}px
                  </p>
                  <p className="text-sm text-gray-600">
                    DPI: {Math.round(designFile.compressionStats.dpi)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Quality: {designFile.compressionStats.quality.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Quality Feedback */}
              {designQualityScore.feedback.map((item, index) => (
                <div 
                  key={index} 
                  className={`text-sm p-2 rounded ${
                    item.type === 'error' ? 'bg-red-50 text-red-700' : 
                    item.type === 'warning' ? 'bg-yellow-50 text-yellow-700' : 
                    'bg-blue-50 text-blue-700'
                  }`}
                >
                  <AiOutlineInfoCircle className="inline mr-2" />
                  {item.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Details Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Design Title */}
          <div>
            <label htmlFor="DesignTitle" className="block text-sm font-medium text-gray-700">
              Design Title
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="DesignTitle"
              value={formState.DesignTitle}
              onChange={(e) => setFormState(prev => ({
                ...prev,
                DesignTitle: e.target.value
              }))}
              className={`mt-1 block w-full rounded-md shadow-sm
                ${validationErrors.DesignTitle 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              placeholder="Enter a catchy title for your design"
              required
              maxLength={100}
              disabled={isSubmitting}
            />
            {validationErrors.DesignTitle && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.DesignTitle}</p>
            )}
          </div>

          {/* Main Tag */}
          <div>
            <label htmlFor="Maintag" className="block text-sm font-medium text-gray-700">
              Main Tag
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="Maintag"
              value={formState.Maintag}
              onChange={(e) => setFormState(prev => ({
                ...prev,
                Maintag: e.target.value
              }))}
              className={`mt-1 block w-full rounded-md shadow-sm
                ${validationErrors.Maintag 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              placeholder="Primary category or theme"
              required
              disabled={isSubmitting}
            />
            {validationErrors.Maintag && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.Maintag}</p>
            )}
          </div>

          {/* Design Tags */}
          <div>
            <label htmlFor="Designtags" className="block text-sm font-medium text-gray-700">
              Design Tags
            </label>
            <input
              type="text"
              id="Designtags"
              value={formState.Designtags}
              onChange={(e) => setFormState(prev => ({
                ...prev,
                Designtags: e.target.value
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                focus:ring-blue-500 focus:border-blue-500"
              placeholder="Comma-separated tags (e.g., funny, cute, trendy)"
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="Description" className="block text-sm font-medium text-gray-700">
              Description
              <span className="text-red-500">*</span>
            </label>
            <textarea
              id="Description"
              value={formState.Description}
              onChange={(e) => setFormState(prev => ({
                ...prev,
                Description: e.target.value
              }))}
              rows={4}
              className={`mt-1 block w-full rounded-md shadow-sm
                ${validationErrors.Description 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              placeholder="Describe your design and its appeal"
              required
              disabled={isSubmitting}
            />
            {validationErrors.Description && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.Description}</p>
            )}
          </div>

          {/* Product Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Type
            </label>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(PRODUCT_TYPES).map(([type, config]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormState(prev => ({
                    ...prev,
                    ProductType: type
                  }))}
                  disabled={isSubmitting}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formState.ProductType === type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="text-center">
                    <span className="capitalize">{config.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Colors
            </label>
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(COLOR_OPTIONS).map(([key, color]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormState(prev => ({
                    ...prev,
                    ProductColor: key
                  }))}
                  disabled={isSubmitting}
                  className={`group relative p-2 rounded-lg transition-all ${
                    formState.ProductColor === key
                      ? 'ring-2 ring-blue-500'
                      : 'hover:bg-gray-50'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div
                      className="w-8 h-8 rounded-full border border-gray-300"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className={`text-sm ${color.textColor}`}>
                      {color.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scale Controls */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Design Scale: {formState.DesignScale.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={formState.DesignScale}
              onChange={(e) => setFormState(prev => ({
                ...prev,
                DesignScale: parseFloat(e.target.value)
              }))}
              className="w-full"
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 
                rounded-md hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !designFile.file}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                isSubmitting || !designFile.file
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent 
                    rounded-full" />
                  Creating Product...
                </div>
              ) : (
                'Create Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;