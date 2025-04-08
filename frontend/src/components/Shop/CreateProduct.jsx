import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createProduct } from "../../redux/actions/product";
import { 
  AiOutlineCloudUpload, 
  AiOutlineDelete, 
  AiOutlineInfoCircle,
  AiOutlineMinusCircle,
  AiOutlinePlusCircle,
  
} from "react-icons/ai";
import { BiRuler, BiMove, BiTag } from "react-icons/bi";
import { 

  MdTitle,
  MdDescription
} from "react-icons/md";
import { DESIGN_CONFIG, DesignScalingManager } from '../../utils/designScaling';
import { useDesignPosition } from '../../hooks/useDesignPosition';

// Constants
const BOUNDARY_LIMITS = {
  'hoodie': { top: 25,bottom: 55, left: 35, right: 65 }  // Increased vertical space
};
const COLOR_OPTIONS = {
  white: { value: 'white', label: 'White', hex: '#ffffff', textColor: 'text-gray-800' },
  black: { value: 'black', label: 'Black', hex: '#000000', textColor: 'text-white' }
};
const PRODUCT_TYPES = {
  'hoodie': {
    label: 'Hoodie',
    mockupConfig: {
      version: "v1728392918",
      folder: "hoodies",
      getFilename: (color, view) => `hoodie-${color}-${view}`
    }
  }
};
const FORM_FIELDS = {
  DesignTitle: {
    label: "Design Title",
    placeholder: "Enter a title for your design",
    icon: MdTitle,
    validation: (value) => !value.trim() && "Design title is required"
  },
  Description: {
    label: "Description",
    placeholder: "Describe your design",
    icon: MdDescription,
    multiline: true,
    validation: (value) => !value.trim() && "Description is required"
  },
  Maintag: {
    label: "Main Tag",
    placeholder: "Primary category (e.g., 'Funny', 'Artistic')",
    icon: BiTag,
    validation: (value) => !value.trim() && "Main tag is required"
  },
  Designtags: {
    label: "Design Tags",
    placeholder: "Additional tags (comma separated)",
    icon: BiTag,
    validation: (value) => {
      const tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
      return tags.length === 0 && "At least one design tag is required";
    }
  }
};


const calculateDPI = (width, height) => {
  const PRINT_SIZE = 12;
  return Math.min(width, height) / PRINT_SIZE;
};

const getMockupUrl = (productType = 'hoodie', color = 'white', view = 'front') => {
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
        const MAX_DIMENSION = 4000;
        const TARGET_SIZE = 500 * 1024;
        
        if (Math.max(width, height) > MAX_DIMENSION) {
          const ratio = MAX_DIMENSION / Math.max(width, height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        let quality = 1.0;
        let blob;
        
        do {
          blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', quality));
          quality -= 0.1;
        } while (blob.size > TARGET_SIZE && quality > 0.3);

        const dpi = calculateDPI(width, height);
        
        const compressedFile = new File([blob], file.name, {
          type: 'image/png',
          lastModified: Date.now()
        });

        resolve({
          file: compressedFile,
          compressedSize: blob.size,
          width,
          height,
          quality: quality * 100,
          dpi
        });
      } catch (error) {
        reject(error);
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
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        // Clear any background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Only add white background for dark products
        if (['black'].includes(productColor)) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0);
        
        // Ensure PNG with transparency
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
        if (data[i] < 255) {
          resolve(true);
          return;
        }
      }
      resolve(false);
    };

    img.src = URL.createObjectURL(file);
  });
};


const calculateDesignQualityScore = (imageInfo) => {
  let score = 100;
  let feedback = [];

  const dpiScore = Math.min(40, (imageInfo.dpi / 300) * 40);
  score -= (40 - dpiScore);
  if (imageInfo.dpi < 300) {
    feedback.push({
      type: 'warning',
      message: `DPI is ${Math.round(imageInfo.dpi)}. Higher DPI recommended for best print quality.`
    });
  }

  const sizeScore = Math.min(30, (Math.min(imageInfo.compressedSize, 500000) / 500000) * 30);
  score -= (30 - sizeScore);
  if (imageInfo.compressedSize > 500000) {
    feedback.push({
      type: 'info',
      message: 'File will be optimized for web display and printing.'
    });
  }

  if (!imageInfo.hasTransparency) {
    score -= 20;
    feedback.push({
      type: 'error',
      message: 'Design requires a transparent background for proper display.'
    });
  }

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



const ScaleControl = ({ scale, onChange, disabled }) => (
  <div className="w-full max-w-xs mx-auto">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-gray-700">
        Design Size: {scale.toFixed(1)}x
      </span>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0.5, scale - 0.1))}
          disabled={disabled || scale <= 0.5}
          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50
            transition-colors duration-200"
        >
          <AiOutlineMinusCircle size={20} />
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.min(1.2, scale + 0.1))}
          disabled={disabled || scale >= 1.2}
          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50
            transition-colors duration-200"
        >
          <AiOutlinePlusCircle size={20} />
        </button>
      </div>
    </div>
    <input
      type="range"
      min="0.5"
      max="1.2"
      step="0.1"
      value={scale}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      disabled={disabled}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
    />
  </div>
);

const CreateProduct = () => {
  const mockupContainerRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { seller } = useSelector((state) => state.seller);

  const designPreviewRef = useRef(null);
  const designPositionRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef(null);
  const compressionTimeoutRef = useRef(null);
  const lastScaleRef = useRef(1);
  const formRef = useRef(null);

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
  const [isScaling, setIsScaling] = useState(false);

  const [formState, setFormState] = useState({
    DesignTitle: "",
    Description: "",
    Maintag: "",
    maintag: "",
    Designtags: "",
    ProductType: "hoodie",
    ProductColor: "white",
    ProductView: "front",
    DesignScale: 0.8,
    designPosition: { x: 50, y: 40 },
    availableColors: ["white" , "black"]
  });

  const [designFile, setDesignFile] = useState({
    preview: null,
    file: null,
    originalFile: null,
    compressionStats: null,
    error: null,
    isCompressing: false
  });
  const {
    position,
    scale,
    updatePosition,
    updateScale,
    isOutOfBounds,
    handleDragStart
  } = useDesignPosition({
    initialPosition: DESIGN_CONFIG.position.default,
    initialScale: DESIGN_CONFIG.scale.default,
    productType: formState.ProductType,
    productView: formState.ProductView
  });

  const FormField = useCallback(({ name, value, onChange, error }) => {
    const config = FORM_FIELDS[name];
    const Icon = config.icon;

    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {config.label}
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
          {config.multiline ? (
            <textarea
              name={name}
              value={value}
              onChange={(e) => onChange(name, e.target.value)}
              className={`block w-full pl-10 py-2 sm:text-sm rounded-md
                ${error 
                  ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              placeholder={config.placeholder}
              rows={4}
            />
          ) : (
            <input
              type="text"
              name={name}
              value={value}
              onChange={(e) => onChange(name, e.target.value)}
              className={`block w-full pl-10 pr-3 py-2 sm:text-sm rounded-md
                ${error 
                  ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              placeholder={config.placeholder}
            />
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }, []);

  

  const handleFieldChange = useCallback((fieldName, value) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: value
    }));
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  }, [validationErrors]);

  const checkBoundariesAndUpdate = (position, productType, setIsDesignVisible, setFormState) => {
    const boundaries = BOUNDARY_LIMITS[productType];
    if (!boundaries) return false;
  
    // Add small buffer for strict enforcement
    const buffer = 2; // 2% buffer zone
    
    const isWithinBounds = 
      position.x >= (boundaries.left - buffer) && 
      position.x <= (boundaries.right + buffer) && 
      position.y >= (boundaries.top - buffer) && 
      position.y <= (boundaries.bottom + buffer);
  
    // If outside bounds, snap to nearest valid position
    const newPosition = {
      x: Math.max(boundaries.left, Math.min(boundaries.right, position.x)),
      y: Math.max(boundaries.top, Math.min(boundaries.bottom, position.y))
    };
  
    setIsDesignVisible(isWithinBounds);
    
    setFormState(prev => ({
      ...prev,
      designPosition: isWithinBounds ? position : newPosition
    }));
  
    return isWithinBounds;
  };
  

  const handleDesignDrag = useCallback((e) => {
    if (!mockupContainerRef.current || !isDragging) return;
  
    const rect = mockupContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
  
    requestAnimationFrame(() => {
      const newPosition = { x, y };
      const boundaries = BOUNDARY_LIMITS[formState.ProductType];
      
      if (boundaries) {
        // Add strict boundary checking
        const isWithinBounds = checkBoundariesAndUpdate(
          newPosition, 
          formState.ProductType, 
          setIsDesignVisible, 
          setFormState
        );
  
        if (!isWithinBounds) {
          // Add visual feedback for out-of-bounds
          if (designPreviewRef.current) {
            designPreviewRef.current.style.opacity = '0.5';
            designPreviewRef.current.style.filter = 'grayscale(50%)';
          }
        } else {
          if (designPreviewRef.current) {
            designPreviewRef.current.style.opacity = '1';
            designPreviewRef.current.style.filter = 'none';
          }
        }
      }
    });
  }, [isDragging, formState.ProductType]);


  const BoundaryGuides = ({ productType }) => {
    const boundaries = BOUNDARY_LIMITS[productType];
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        {/* Safe area rectangle */}
        <div 
          className="absolute border-2 border-blue-500 border-dashed opacity-30"
          style={{
            top: `${boundaries.top}%`,
            left: `${boundaries.left}%`,
            right: `${100 - boundaries.right}%`,
            bottom: `${100 - boundaries.bottom}%`
          }}
        />
        
        {/* Add corner markers */}
        <div className="absolute w-2 h-2 bg-blue-500 rounded-full"
          style={{ top: `${boundaries.top}%`, left: `${boundaries.left}%` }} />
        <div className="absolute w-2 h-2 bg-blue-500 rounded-full"
          style={{ top: `${boundaries.top}%`, right: `${100 - boundaries.right}%` }} />
        <div className="absolute w-2 h-2 bg-blue-500 rounded-full"
          style={{ bottom: `${100 - boundaries.bottom}%`, left: `${boundaries.left}%` }} />
        <div className="absolute w-2 h-2 bg-blue-500 rounded-full"
          style={{ bottom: `${100 - boundaries.bottom}%`, right: `${100 - boundaries.right}%` }} />
      </div>
    );
  };


  const handleDesignUpload = useCallback(async (file) => {
    try {
      if (!file) return;

      if (file.size > 20 * 1024 * 1024) {
        toast.error("File size exceeds 20MB limit");
        return;
      }

      if (file.type !== "image/png") {
        toast.error("Please upload only PNG files");
        return;
      }

      setIsLoading(true);
      setDesignFile(prev => ({ ...prev, isCompressing: true }));
      
      if (compressionTimeoutRef.current) {
        clearTimeout(compressionTimeoutRef.current);
      }

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

      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.design;
        return newErrors;
      });

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
  }, [formState.ProductColor]);

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
  }, [handleDesignUpload]);


  const handleScaleChange = useCallback((newScale) => {
    setIsScaling(true);
    lastScaleRef.current = formState.DesignScale;
    setFormState(prev => ({ ...prev, DesignScale: newScale }));
    setTimeout(() => setIsScaling(false), 300);
  }, [formState.DesignScale]);


  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
  
    try {
      setIsSubmitting(true);
  
      // Verify tokens exist
      const token = localStorage.getItem('token');
      const sellerToken = localStorage.getItem('seller_token');
  
      if (!token || !sellerToken) {
        toast.error("Please login again to continue");
        navigate("/login");
        return;
      }
  
      const formData = new FormData();
      
      if (designFile.file) {
        formData.append('designImage', designFile.file);
      }
  
      formData.append('DesignTitle', formState.DesignTitle);
      formData.append('Description', formState.Description);
      formData.append('Maintag', formState.Maintag);
      formData.append('Designtags', JSON.stringify(formState.Designtags.split(',').map(tag => tag.trim()).filter(Boolean)));
      formData.append('ProductType', formState.ProductType);
      formData.append('ProductColor', formState.ProductColor);
      formData.append('ProductView', formState.ProductView);
      formData.append('DesignScale', formState.DesignScale.toString());
      formData.append('designPosition', JSON.stringify(formState.designPosition));
      formData.append('availableColors', JSON.stringify([formState.ProductColor]));
  
      const response = await dispatch(createProduct(formData));

      if (response.success) {
        toast.success("Product created successfully");
        navigate("/dashboard");
      }
  
    } catch (error) {
      console.error("Submit error:", error);
      
      if (error.message === "Please login as a seller to create products" || 
          error.response?.status === 401) {
        toast.error("Please login again to continue");
        navigate("/login");
        return;
      }
      
      toast.error(error.response?.data?.message || error.message || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (seller && seller._id) {
      setFormState(prev => ({ ...prev, shopId: seller._id }));
      setIsLoading(false);
    } else if (seller === null) {
      toast.error("Please log in as a seller to create products");
      navigate("/login");
    }
  }, [seller, navigate]);
  useEffect(() => {
    const sellerToken = localStorage.getItem("seller_token");

    if (!sellerToken) {
      toast.error("Seller login required to create products.");
      navigate("/shop-login");
    }
  }, [navigate]);

  // Return/Render JSX
  return (
    <div className="w-[90%] 800px:w-[90%] bg-white shadow h-[80vh] rounded-[4px] p-3 overflow-y-scroll">
      <style>
      {`
  .design-preview {
    transition: transform 0.2s ease-out, opacity 0.2s ease-out;
    mix-blend-mode: multiply;  /* Add this */
  }
  
  .design-preview img {
    transition: opacity 0.2s ease-out;
    background: transparent !important;  /* Add this */
  }

  /* Add this for dark backgrounds */
  .dark-product .design-preview {
    mix-blend-mode: screen;
  }
`}
      </style>

      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-4 text-center text-gray-800">
          Create New Design
        </h2>

        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Basic Information
              </h3>
              <div className="space-y-4">
                {/* Design Title */}
                <FormField
                  name="DesignTitle"
                  value={formState.DesignTitle}
                  onChange={handleFieldChange}
                  error={validationErrors.DesignTitle}
                />

                {/* Description */}
                <FormField
                  name="Description"
                  value={formState.Description}
                  onChange={handleFieldChange}
                  error={validationErrors.Description}
                />

                {/* Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="Maintag"
                    value={formState.Maintag}
                    onChange={handleFieldChange}
                    error={validationErrors.Maintag}
                  />
                  <FormField
                    name="Designtags"
                    value={formState.Designtags}
                    onChange={handleFieldChange}
                    error={validationErrors.Designtags}
                  />
                </div>

                {/* Pricing */}
                
              </div>
            </div>

            {/* Product Type and Color Selection */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Product Options
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Type Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Type
                  </label>
                  <select
                    name="ProductType"
                    value={formState.ProductType}
                    onChange={(e) => handleFieldChange('ProductType', e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  >
                    {Object.entries(PRODUCT_TYPES).map(([value, { label }]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Product Color Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(COLOR_OPTIONS).map(([value, option]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleFieldChange('ProductColor', value)}
                        className={`w-8 h-8 rounded-full border-2 transition-all
                          ${formState.ProductColor === value 
                            ? 'border-blue-500 scale-110' 
                            : 'border-gray-300 hover:border-blue-300'}`}
                        style={{ backgroundColor: option.hex }}
                        disabled={isSubmitting}
                      >
                        <span className="sr-only">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Design Upload and Preview Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Design Upload
              </h3>

              {!designFile.preview ? (
                <>
                  {/* Design Requirements */}
                  {showRequirements && (
                    <div className="mb-6 space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">
                          File Specifications
                        </h4>
                        <ul className="list-disc list-inside text-blue-700 space-y-2">
                          <li>File format: PNG with transparent background</li>
                          <li>Maximum file size: 20MB (will be optimized)</li>
                          <li>Recommended dimensions: 1000px to 4000px</li>
                          <li>Recommended DPI: 300 or higher</li>
                        </ul>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">
                          Design Guidelines
                        </h4>
                        <ul className="list-disc list-inside text-green-700 space-y-2">
                          <li>Keep important elements within safe area</li>
                          <li>Use high contrast colors for better visibility</li>
                          <li>Avoid very thin lines (minimum 1px width)</li>
                          <li>Test your design on different backgrounds</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Upload Area */}
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
                    {/* Upload Content */}
                    <div className="text-center space-y-4">
                      <div className="relative inline-block">
                        <AiOutlineCloudUpload 
                          className="mx-auto h-16 w-16 text-blue-400 
                          group-hover:text-blue-500 transition-colors" 
                        />
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

                    {/* Compression Progress Overlay */}
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

                  {validationErrors.design && (
                    <p className="mt-2 text-sm text-red-600">
                      {validationErrors.design}
                    </p>
                  )}
                </>
              ) : (
                // Design Preview and Controls
                <div className="space-y-6">
                  {/* Design Preview */}
                  <div className="relative">
                    <div 
                        ref={mockupContainerRef}
                        className={`relative w-full aspect-square bg-gray-100 rounded-lg 
                          overflow-hidden shadow-inner ${formState.ProductColor === 'black' ? 'dark-product' : ''}`}
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
                      <div
                        ref={designPreviewRef}
                        className={`design-preview absolute ${isScaling ? 'scaling' : ''}
                          ${!isDesignVisible ? 'outside' : ''}`}
                        style={{
                          position: 'absolute',
                          top: `${formState.designPosition.y}%`,
                          left: `${formState.designPosition.x}%`,
                          transform: `translate(-50%, -50%) scale(${formState.DesignScale})`,
                          width: '200px',
                          height: '200px',
                          cursor: isDragging ? 'grabbing' : 'grab',
                        }}
                      >
                        <img
                          src={designFile.preview}
                          alt="Design Preview"
                          className="w-full h-full object-contain"
                          draggable="false"
                        />
                      </div>
                      {showGuides && <BoundaryGuides productType={formState.ProductType} />}
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
                    <div className="mt-4 space-y-4">
                      <ScaleControl
                        scale={formState.DesignScale}
                        onChange={handleScaleChange}
                        disabled={isSubmitting}
                      />

                      <div className="flex flex-wrap justify-center gap-4">
                        <button
                          type="button"
                          onClick={() => setShowGuides(!showGuides)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white 
                            border border-gray-300 rounded-md hover:bg-gray-50 
                            transition-colors duration-200 flex items-center gap-2"
                        >
                          <BiRuler />
                          {showGuides ? 'Hide Guides' : 'Show Guides'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormState(prev => ({
                            ...prev,
                            ProductView: prev.ProductView === "front" ? "back" : "front"
                          }))}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 
                            rounded-md hover:bg-blue-700 transition-colors duration-200
                            flex items-center gap-2"
                          disabled={isSubmitting}
                        >
                          <BiMove />
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
                            transition-colors duration-200 flex items-center gap-2"
                          disabled={isSubmitting}
                        >
                          <AiOutlineDelete />
                          Remove Design
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Design Quality Score */}
                  {designQualityScore && (
                    <div className="space-y-4 bg-white p-4 rounded-lg shadow-md">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">Design Quality Score</h3>
                        <span className={`text-lg font-bold ${
                          designQualityScore.score > 80 ? 'text-green-500' : 
                          designQualityScore.score > 60 ? 'text-yellow-500' : 
                          'text-red-500'
                        }`}>
                          {designQualityScore.score}/100
                        </span>
                      </div>

                      {/* Quality Feedback Messages */}
                      <div className="space-y-2">
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

                      {/* Technical Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="text-gray-600">DPI: </span>
                          <span className="font-medium">
                            {Math.round(designQualityScore.details.dpi)}
                          </span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="text-gray-600">Size: </span>
                          <span className="font-medium">
                            {(designQualityScore.details.size / 1024).toFixed(2)}KB
                          </span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="text-gray-600">Dimensions: </span>
                          <span className="font-medium">
                            {designQualityScore.details.dimensions}
                          </span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="text-gray-600">Transparency: </span>
                          <span className="font-medium">
                            {designQualityScore.details.transparency ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
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
        )}
      </div>
    </div>
  );
};

export default CreateProduct;