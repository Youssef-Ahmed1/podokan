import React, { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux"; 
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AiOutlineCloudUpload } from "react-icons/ai";
import imageCompression from 'browser-image-compression';
import { 
  PRODUCT_TYPES, 
  AVAILABLE_COLORS, 
  DEFAULT_PRODUCT_CONFIG,
  PRODUCT_CONFIG 
} from '../Admin/ProductApproval/constants/productConfig';
import { createProduct } from "../../redux/actions/product";
import { useDesignPosition } from '../../hooks/useDesignPosition';
import DesignPreview from '../shared/DesignPreview';
const CreateProduct = () => {
  // Move all hooks to the top level
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state) => state.product);

  const [formState, setFormState] = useState({
    DesignTitle: '',
    Description: '',
    Maintag: '',
    mainTags: [],
    Designtags: [],
    ProductType: 'hoodie',
    ProductColor: 'white',
    ProductView: 'front',
    availableColors: ['white', 'black'],
    DesignScale: 1,
  });

  const [designFile, setDesignFile] = useState({
    file: null,
    preview: null,
    dpi: 0,
    dimensions: { width: 0, height: 0 },
    score: 0
  });

  const [product, setProduct] = useState({
    ProductType: 'hoodie',
    ProductColor: 'white',
    ProductView: 'front',
    designImage: null
  });

  // Move hooks before any conditional logic
  const {
    position,
    scale,
    isDragging,
    isOutOfBounds,
    bounds,
    handleDragStart,
    handleScaleChange,
    updatePosition,
    centerDesign,
  } = useDesignPosition({
    initialPosition: formState.position || { x: 50, y: 40 },
    productType: formState.ProductType,
    disabled: isSubmitting,
    onChange: (newPosition) => setDesignPosition(newPosition)
  });

  const [designPosition, setDesignPosition] = useState({ x: 50, y: 40 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});

  const handleTagsChange = (type, tags) => {
    setFormState(prev => ({
      ...prev,
      [type]: Array.isArray(tags) ? tags : []
    }));
  };
  useEffect(() => {
    return () => {
      if (designFile?.preview) {
        URL.revokeObjectURL(designFile.preview);
      }
    };
  }, [designFile]);


  const calculateDPI = (width, height, physicalWidth = 10) => {
    const targetDPI = 300;
    const inches = physicalWidth / 2.54;
    const dpi = width / inches;
    return Math.round(dpi);
  };

  const scoreDesignQuality = (dpi, fileSize) => {
    let score = 0;
    
    // DPI scoring (40%)
    if (dpi >= 300) score += 40;
    else if (dpi >= 150) score += 20;
    
    // File size scoring (30%)
    const fileSizeMB = fileSize / (1024 * 1024);
    if (fileSizeMB >= 1 && fileSizeMB <= 10) score += 30;
    else if (fileSizeMB < 1) score += 15;
    
    // Minimum requirements check (30%)
    if (dpi >= 150 && fileSizeMB >= 0.5) score += 30;
    
    return score;
  };
  const processDesignFile = async (file) => {
    try {
      const loadingToast = toast.loading("Processing design...");
      
      let processedFile = file;
      if (file.size > 2 * 1024 * 1024) {
        processedFile = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 4000,
          useWebWorker: true
        });
      }
  
      const previewUrl = URL.createObjectURL(processedFile);
    
    
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = previewUrl;
      });
  
      const dpi = calculateDPI(img.width, img.height);
      const score = scoreDesignQuality(dpi, processedFile.size);
  
      setDesignFile({
        file: processedFile,
        preview: previewUrl,
        dpi,
        dimensions: { width: img.width, height: img.height },
        score
      });
  
      setProduct(prev => ({
        ...prev,
        designImage: previewUrl
      }));
  
      toast.update(loadingToast, {
        render: "Design processed successfully",
        type: "success",
        isLoading: false,
        autoClose: 2000
      });
  
      if (score < 70) {
        toast.warning("Design quality could be improved. Consider using a higher resolution image.");
      }
    } catch (error) {
      console.error("Error processing design:", error);
      toast.error("Failed to process design file");
      
      setDesignFile({
        file: null,
        preview: null,
        dpi: 0,
        dimensions: { width: 0, height: 0 },
        score: 0
      });
  
      setProduct(prev => ({
        ...prev,
        designImage: null
      }));
    }

  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
  
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // Cleanup previous preview if exists
      if (designFile?.preview) {
        URL.revokeObjectURL(designFile.preview);
      }
      processDesignFile(file);
    } else {
      toast.error("Please upload an image file");
    }
  }, [designFile]);
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Cleanup previous preview if exists
      if (designFile?.preview) {
        URL.revokeObjectURL(designFile.preview);
      }
      processDesignFile(file);
    }
  }, [designFile]);

const validateForm = () => {
  const errors = {};
  
  if (!formState.DesignTitle?.trim()) {
    errors.DesignTitle = "Design title is required";
  }
  
  if (!formState.Description?.trim()) {
    errors.Description = "Description is required";
  }
  
  if (!designFile?.file) {
    errors.design = "Design file is required";
  }

  // Ensure arrays are properly checked
  if (!Array.isArray(formState.mainTags) || formState.mainTags.length === 0) {
    errors.mainTags = "At least one main tag is required";
  }

  if (!Array.isArray(formState.Designtags)) {
    setFormState(prev => ({...prev, Designtags: []}));
  }

  setValidationErrors(errors);
  return Object.keys(errors).length === 0;
};

// Update form submission to handle arrays properly
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  setIsSubmitting(true);

  try {
    const formData = new FormData();
    
    // Handle arrays properly
    Object.keys(formState).forEach(key => {
      if (Array.isArray(formState[key])) {
        formData.append(key, JSON.stringify(formState[key]));
      } else {
        formData.append(key, formState[key] || '');
      }
    });

    // Handle file
    if (designFile?.file) {
      formData.append('design', designFile.file);
    }

    // Handle position data
    formData.append('designPosition', JSON.stringify({
      x: position?.x || 50,
      y: position?.y || 40,
      scale: scale || 1
    }));

    await dispatch(createProduct(formData));
    toast.success('Product created successfully');
    navigate('/dashboard');
  } catch (error) {
    console.error('Error creating product:', error);
    toast.error(error.response?.data?.message || 'Failed to create product');
  } finally {
    setIsSubmitting(false);
  }
};

// Add cleanup for preview URLs
useEffect(() => {
  return () => {
    if (designFile?.preview) {
      URL.revokeObjectURL(designFile.preview);
    }
  };
}, [designFile]);

// Update the tags display with proper null checks
const renderTags = (tags, type) => {
  if (!Array.isArray(tags)) return null;
  
  return tags.map((tag, index) => (
    <span
      key={index}
      className="bg-gray-200 px-2 py-1 rounded text-sm flex items-center"
    >
      {tag}
      <button
        type="button"
        onClick={() => {
          const newTags = [...tags];
          newTags.splice(index, 1);
          handleTagsChange(type, newTags);
        }}
        className="ml-2 text-gray-500 hover:text-gray-700"
      >
        ×
      </button>
    </span>
  ));
};
  return (
    <div className="max-w-6xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Design Upload Section */}
          <div className="space-y-4">
          <div 
  className={`border-2 border-dashed rounded-lg p-6 text-center ${
    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
  }`}
  onDragOver={(e) => {
    e.preventDefault();
    setDragActive(true);
  }}
  onDragLeave={() => setDragActive(false)}
  onDrop={handleDrop}
>
  {!designFile?.preview ? (
    <>
      <AiOutlineCloudUpload className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2">Drag and drop your design or</p>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="designUpload"
      />
      <label
        htmlFor="designUpload"
        className="inline-block mt-2 px-4 py-2 bg-blue-500 text-white rounded cursor-pointer"
      >
        Browse Files
      </label>
    </>
  ) : (
    <div className="space-y-2">
      <img 
        src={designFile.preview} 
        alt="Design preview" 
        className="max-h-48 mx-auto" 
      />
      <div className="text-sm">
        <p>DPI: {designFile.dpi || 0}</p>
        <p>Quality Score: {designFile.score || 0}/100</p>
        <button
          type="button"
          onClick={() => {
            if (designFile.preview) {
              URL.revokeObjectURL(designFile.preview);
            }
            setDesignFile({
              file: null,
              preview: null,
              dpi: 0,
              dimensions: { width: 0, height: 0 },
              score: 0
            });
          }}
          className="text-red-500 mt-2"
        >
          Remove
        </button>
      </div>
    </div>
  )}
</div>

            {/* Product Configuration */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Product Type</label>
                <select
  value={formState.ProductType}
  onChange={(e) => setFormState(prev => ({ ...prev, ProductType: e.target.value }))}
  className="w-full border rounded p-2"
>
 
 
{Object.entries(DEFAULT_PRODUCT_CONFIG).map(([type, config]) => (

    <option key={type} value={type}>{config.label}</option>
  ))}
</select>
              </div>

              <div>
                <label className="block text-sm font-medium">Product Color</label>
                <select
                  value={formState.ProductColor}
                  onChange={(e) => setFormState(prev => ({ ...prev, ProductColor: e.target.value }))}
                  className="w-full border rounded p-2"
                >
                  {AVAILABLE_COLORS.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Design Preview Section */}
          <div className="space-y-4">


            
          <DesignPreview
      product={product}
      position={position}
      scale={scale}
      isDragging={isDragging}
      isOutOfBounds={isOutOfBounds}
      onDragStart={handleDragStart}
      onScaleChange={handleScaleChange}
      onPositionChange={updatePosition}
      onCenter={centerDesign}
      showGridLines={showGuides}
      onToggleGridLines={() => setShowGuides(!showGuides)}
      disabled={isSubmitting}
      bounds={bounds}
    />
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">Design Scale</label>
              <input
                type="range"
                min="0.5"
                max="1.2"
                step="0.1"
                value={scale}
                onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                className="w-full"
              />
              <button
                type="button"
                onClick={centerDesign}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Center Design
              </button>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Design Title</label>
            <input
              type="text"
              value={formState.DesignTitle}
              onChange={(e) => setFormState(prev => ({ ...prev, DesignTitle: e.target.value }))}
              className="w-full border rounded p-2"
            />
            {validationErrors.DesignTitle && (
              <p className="text-red-500 text-sm">{validationErrors.DesignTitle}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              value={formState.Description}
              onChange={(e) => setFormState(prev => ({ ...prev, Description: e.target.value }))}
              className="w-full border rounded p-2"
              rows="4"
            />
            {validationErrors.Description && (
              <p className="text-red-500 text-sm">{validationErrors.Description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Tags</label>
            <input
              type="text"
              placeholder="Add tags (comma separated)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  e.preventDefault();
                  setFormState(prev => ({
                    ...prev,
                    mainTags: [...prev.mainTags, e.target.value.trim()]
                  }));
                  e.target.value = '';
                }
              }}
              className="w-full border rounded p-2"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {formState.mainTags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-200 px-2 py-1 rounded text-sm flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setFormState(prev => ({
                      ...prev,
                      mainTags: prev.mainTags.filter((_, i) => i !== index)
                    }))}
                    className="ml-2"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 rounded ${
            isSubmitting ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {isSubmitting ? 'Creating Product...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
};

export default CreateProduct;
