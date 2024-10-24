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

// Enhanced Utility Functions
const getMockupUrl = (productType = 't-shirt', color = 'white', view = 'front') => {
  const baseUrl = "https://res.cloudinary.com/dkot9tyjm/image/upload/";
  const config = PRODUCT_TYPES[productType]?.mockupConfig;
  
  if (!config) return "";
  
  const filename = config.getFilename(color, view);
  return `${baseUrl}${config.version}/${config.folder}/${filename}.png`;
};

// Improved image compression with chunked processing
const compressDesign = async (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = async () => {
      try {
        let { width, height } = img;
        const MAX_DIMENSION = 4000; // Increased max dimension
        const TARGET_SIZE = 500 * 1024; // Target: 500KB
        
        // Calculate initial dimensions while maintaining aspect ratio
        if (Math.max(width, height) > MAX_DIMENSION) {
          const ratio = MAX_DIMENSION / Math.max(width, height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Apply image smoothing and sharpening
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.filter = 'sharpen(1)';
        
        // Draw image in chunks for large files
        const CHUNK_SIZE = 1000;
        for (let y = 0; y < height; y += CHUNK_SIZE) {
          for (let x = 0; x < width; x += CHUNK_SIZE) {
            const chunkWidth = Math.min(CHUNK_SIZE, width - x);
            const chunkHeight = Math.min(CHUNK_SIZE, height - y);
            
            ctx.drawImage(
              img,
              x, y, chunkWidth, chunkHeight,
              x, y, chunkWidth, chunkHeight
            );
          }
        }

        // Progressive compression with quality adjustment
        let quality = 1.0;
        let blob;
        let attempts = 0;
        const MAX_ATTEMPTS = 10;
        
        while (attempts < MAX_ATTEMPTS) {
          blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', quality));
          
          if (blob.size <= TARGET_SIZE || quality <= 0.3) break;
          
          // Adaptive quality reduction
          quality -= blob.size > TARGET_SIZE * 2 ? 0.2 : 0.1;
          quality = Math.max(0.3, quality); // Don't go below 30% quality
          attempts++;
        }

        // If still too large, try reducing dimensions
        if (blob.size > TARGET_SIZE && width > 1000) {
          width *= 0.8;
          height *= 0.8;
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', quality));
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

  // Refs with improved tracking
  const designPreviewRef = useRef(null);
  const mockupContainerRef = useRef(null);
  const designPositionRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef(null);
  const compressionTimeoutRef = useRef(null);

  // Enhanced State Management
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [designQualityScore, setDesignQualityScore] = useState(null);
  const [showGuides, setShowGuides] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isDesignVisible, setIsDesignVisible] = useState(true);
  const [designStats, setDesignStats] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [showRequirements, setShowRequirements] = useState(true);
  const [compressionProgress, setCompressionProgress] = useState(0);

  // Enhanced Form State
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

  // Enhanced Design File State
  const [designFile, setDesignFile] = useState({
    preview: null,
    file: null,
    originalFile: null,
    compressionStats: null,
    error: null,
    isCompressing: false
  });

  // Design Quality Scoring System with improved metrics
  const calculateDesignQualityScore = (imageInfo) => {
    let score = 100;
    let feedback = [];

    // Enhanced DPI Scoring (40 points)
    const dpiScore = Math.min(40, (imageInfo.dpi / 300) * 40);
    score -= (40 - dpiScore);
    if (imageInfo.dpi < 300) {
      feedback.push({
        type: 'warning',
        message: `DPI is ${Math.round(imageInfo.dpi)}. Higher DPI recommended for best print quality.`
      });
    }

    // Enhanced Size Scoring (30 points)
    const sizeScore = Math.min(30, (Math.min(imageInfo.compressedSize, 500000) / 500000) * 30);
    score -= (30 - sizeScore);
    if (imageInfo.compressedSize > 500000) {
      feedback.push({
        type: 'info',
        message: 'File will be optimized for web display and printing.'
      });
    }

    // Transparency Score (20 points)
    if (!imageInfo.hasTransparency) {
      score -= 20;
      feedback.push({
        type: 'error',
        message: 'Design requires a transparent background for proper display.'
      });
    }

    // Dimension Score with improved criteria (10 points)
    const minDimension = Math.min(imageInfo.width, imageInfo.height);
    const maxDimension = Math.max(imageInfo.width, imageInfo.height);
    if (minDimension < 1000 || maxDimension > 4000) {
      score -= 10;
      feedback.push({
        type: 'warning',
        message: 'Optimal dimensions are between 1000px and 4000px.'
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

  // Enhanced Design Upload Handler
  const handleDesignUpload = async (file) => {
    try {
      if (!file) return;

      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        toast.error("File size exceeds 20MB limit");
        return;
      }

      if (file.type !== "image/png") {
        toast.error("Please upload only PNG files");
        return;
      }

      setIsLoading(true);
      setDesignFile(prev => ({ ...prev, isCompressing: true }));
      
      // Clear any existing compression timeout
      if (compressionTimeoutRef.current) {
        clearTimeout(compressionTimeoutRef.current);
      }

      // Show compression progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 5;
        if (progress <= 90) {
          setCompressionProgress(progress);
        }
      }, 500);

      const compressionResult = await compressDesign(file);
      clearInterval(progressInterval);
      setCompressionProgress(100);

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
        error: null,
        isCompressing: false
      });

      setDesignQualityScore(qualityScore);
      setDesignStats(compressionResult);
      setShowRequirements(false);

      toast.success(
        `Design optimized: ${(file.size / (1024 * 1024)).toFixed(2)}MB → ` +
        `${(compressionResult.compressedSize / 1024).toFixed(2)}KB`
      );

      if (qualityScore.score < 80) {
        toast.info("Check design quality details for optimization tips.");
      }

    } catch (error) {
      console.error("Design upload error:", error);
      setDesignFile(prev => ({
        ...prev,
        error: error.message,
        isCompressing: false
      }));
      toast.error("Failed to process design. Please try a different file.");
    } finally {
      setIsLoading(false);
      setCompressionProgress(0);
    }
  };

  // Enhanced Drag and Drop Handlers
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

  // Enhanced Design Position Handler with Smooth Movement
  const handleDesignDrag = useCallback((e) => {
    if (!mockupContainerRef.current || !isDragging) return;

    const rect = mockupContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Smooth position updating
    requestAnimationFrame(() => {
      checkBoundariesAndUpdate({ x, y });
    });
  }, [isDragging]);

  // Enhanced Boundary Checking with Smooth Clipping
  const checkBoundariesAndUpdate = useCallback((position) => {
    const boundaries = BOUNDARY_LIMITS[formState.ProductType];
    if (!boundaries) return;

    const isWithinBounds = 
      position.x >= boundaries.left && 
      position.x <= boundaries.right && 
      position.y >= boundaries.top && 
      position.y <= boundaries.bottom;

    setIsDesignVisible(true); // Always show design, clipping will handle visibility
    
    setFormState(prev => ({
      ...prev,
      designPosition: position
    }));

    return isWithinBounds;
  }, [formState.ProductType]);

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

    // Quality check confirmation
    if (designQualityScore?.score < 60) {
      const proceed = window.confirm(
        "Design quality is low. This might affect print quality. Do you want to proceed?"
      );
      if (!proceed) {
        setIsSubmitting(false);
        return;
      }
    }

    // Prepare form data
    const formData = new FormData();
    
    // Add all form state fields
    Object.entries(formState).forEach(([key, value]) => {
      if (key === 'designPosition' || key === 'availableColors' || key === 'price') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });

    // Add design file if exists
    if (designFile.file) {
      formData.append("designImage", designFile.file);
    }

    // Submit to backend
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
};
  // Form Validation with Improved Checks
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


  // UI Components
  const DesignRequirements = () => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Design Requirements</h3>
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">File Specifications</h4>
          <ul className="list-disc list-inside text-blue-700 space-y-2">
            <li>File format: PNG with transparent background</li>
            <li>Maximum file size: 20MB (will be optimized)</li>
            <li>Recommended dimensions: 1000px to 4000px</li>
            <li>Recommended DPI: 300 or higher</li>
          </ul>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">Design Guidelines</h4>
          <ul className="list-disc list-inside text-green-700 space-y-2">
            <li>Keep important elements within safe area</li>
            <li>Use high contrast colors for better visibility</li>
            <li>Avoid very thin lines (minimum 1px width)</li>
            <li>Test your design on different backgrounds</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // Main Render
  return (
    <div className="w-[90%] 800px:w-[90%] bg-white shadow h-[80vh] rounded-[4px] p-3 overflow-y-scroll">
      <style>
        {`
          .design-preview {
            clip-path: inset(0);
            transition: clip-path 0.3s ease-out;
          }
          
          .design-preview.clipped {
            clip-path: var(--clip-path);
          }
        `}
      </style>
      
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-4 text-center text-gray-800">Create New Design</h2>
        
        {/* Show Requirements First */}
        {!designFile.preview && <DesignRequirements />}
        
        {/* Enhanced Upload Area */}
        <div className="mb-8">
          {!designFile.preview ? (
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8 transition-all
                ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer
                group
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('design-upload').click()}
            >
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <AiOutlineCloudUpload className="mx-auto h-16 w-16 text-blue-400 
                    group-hover:text-blue-500 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 border-4 border-blue-500 border-dashed 
                      rounded-full animate-spin opacity-0 group-hover:opacity-100 
                      transition-opacity" />
                  </div>
                </div>
                
                <div>
                  <p className="text-lg font-medium text-gray-700 group-hover:text-gray-900">
                    Drop your design here or click to browse
                  </p>
                  <p className="mt-2 text-sm text-gray-500 group-hover:text-gray-700">
                    PNG files only, max 20MB
                  </p>
                </div>
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

              {/* Compression Progress Indicator */}
              {designFile.isCompressing && (
                <div className="absolute inset-0 bg-white/90 flex items-center 
                  justify-center flex-col space-y-4">
                  <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${compressionProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Optimizing design... {compressionProgress}%
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              {/* Design Preview */}
              <div 
                ref={mockupContainerRef}
                className="relative w-full aspect-square bg-gray-100 rounded-lg 
                  overflow-hidden shadow-inner"
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

                {/* Design Overlay with Smooth Clipping */}
                <div
                  ref={designPreviewRef}
                  className={`design-preview absolute ${!isDesignVisible ? 'clipped' : ''}`}
                  style={{
                    top: `${formState.designPosition.y}%`,
                    left: `${formState.designPosition.x}%`,
                    transform: `translate(-50%, -50%) scale(${formState.DesignScale})`,
                    width: '200px',
                    height: '200px',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    '--clip-path': `inset(
                      ${Math.max(0, BOUNDARY_LIMITS[formState.ProductType].top - formState.designPosition.y)}% 
                      ${Math.max(0, formState.designPosition.x - BOUNDARY_LIMITS[formState.ProductType].right)}% 
                      ${Math.max(0, formState.designPosition.y - BOUNDARY_LIMITS[formState.ProductType].bottom)}% 
                      ${Math.max(0, BOUNDARY_LIMITS[formState.ProductType].left - formState.designPosition.x)}%
                    )`
                  }}
                >
                  <img
                    src={designFile.preview}
                    alt="Design Preview"
                    className="w-full h-full object-contain"
                    draggable="false"
                    style={{ border: 'none' }}
                  />
                </div>

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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white 
                    border border-gray-300 rounded-md hover:bg-gray-50 
                    transition-colors duration-200"
                >
                  {showGuides ? 'Hide Guides' : 'Show Guides'}
                </button>
                <button
                  type="button"
                  onClick={() => setFormState(prev => ({
                    ...prev,
                    ProductView: prev.ProductView === "front" ? "back" : "front"
                  }))}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 
                    rounded-md hover:bg-blue-700 transition-colors duration-200"
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
                    setShowRequirements(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-white 
                    border border-red-300 rounded-md hover:bg-red-50 
                    transition-colors duration-200"
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
            {/* Quality Score Indicator */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">Design Quality Score</h3>
                <span className={`text-lg font-bold ${
                  designQualityScore.score > 80 ? 'text-green-500' : 
                  designQualityScore.score > 60 ? 'text-yellow-500' : 
                  'text-red-500'
                }`}>
                  {designQualityScore.score}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    designQualityScore.score > 80 ? 'bg-green-500' : 
                    designQualityScore.score > 60 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}
                  style={{ width: `${designQualityScore.score}%` }}
                />
              </div>
            </div>
            
            {/* Detailed Stats */}
            <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
              <h3 className="font-semibold text-gray-700">Design Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 flex justify-between">
                    <span>Original Size:</span>
                    <span className="font-medium">
                      {(designFile.originalFile.size / (1024 * 1024)).toFixed(2)}MB
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 flex justify-between">
                    <span>Optimized Size:</span>
                    <span className="font-medium">
                      {(designFile.compressionStats.compressedSize / 1024).toFixed(2)}KB
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 flex justify-between">
                    <span>Compression:</span>
                    <span className="font-medium text-green-600">
                      {designFile.compressionStats.compressionRatio}% reduced
                    </span>
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 flex justify-between">
                    <span>Dimensions:</span>
                    <span className="font-medium">
                      {designFile.compressionStats.width} × {designFile.compressionStats.height}px
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 flex justify-between">
                    <span>DPI:</span>
                    <span className="font-medium">
                      {Math.round(designFile.compressionStats.dpi)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 flex justify-between">
                    <span>Quality:</span>
                    <span className="font-medium">
                      {designFile.compressionStats.quality.toFixed(1)}%
                    </span>
                  </p>
                </div>
              </div>

              {/* Quality Feedback Messages */}
              <div className="mt-4 space-y-2">
                {designQualityScore.feedback.map((item, index) => (
                  <div 
                    key={index} 
                    className={`text-sm p-2 rounded flex items-start ${
                      item.type === 'error' ? 'bg-red-50 text-red-700' : 
                      item.type === 'warning' ? 'bg-yellow-50 text-yellow-700' : 
                      'bg-blue-50 text-blue-700'
                    }`}
                  >
                    <AiOutlineInfoCircle className="mt-0.5 mr-2 flex-shrink-0" />
                    <span>{item.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Product Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Design Title */}
            <div>
              <label htmlFor="DesignTitle" className="block text-sm font-medium text-gray-700">
                Design Title <span className="text-red-500">*</span>
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
                placeholder="Enter a catchy title"
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
                Main Category <span className="text-red-500">*</span>
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
                placeholder="Main design category"
                disabled={isSubmitting}
              />
              {validationErrors.Maintag && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.Maintag}</p>
              )}
            </div>
          </div>

          {/* Design Tags */}
          <div>
            <label htmlFor="Designtags" className="block text-sm font-medium text-gray-700">
              Additional Tags
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
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="Description"
              value={formState.Description}
              onChange={(e) => setFormState(prev => ({
                ...prev,
                Description: e.target.value
              }))}
              rows={4}
              className={`mt-1 block w-full rounded-md shadow-sm resize-none
                ${validationErrors.Description 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              placeholder="Describe your design"
              disabled={isSubmitting}
            />
            {validationErrors.Description && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.Description}</p>
            )}
          </div>

          {/* Submit Section */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white 
                border border-gray-300 rounded-md hover:bg-gray-50 
                transition-colors duration-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !designFile.file}
              className={`px-6 py-2 text-sm font-medium text-white rounded-md 
                transition-all duration-200 ${
                isSubmitting || !designFile.file
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white 
                    border-t-transparent rounded-full" />
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