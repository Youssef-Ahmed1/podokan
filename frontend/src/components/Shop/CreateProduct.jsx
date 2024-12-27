import React, { useState, useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AiOutlineCloudUpload } from "react-icons/ai";
import { createProduct } from "../../redux/actions/product";
import { useDesignPosition } from '../../hooks/useDesignPosition';
import DesignPreview from '../shared/DesignPreview';
import { PRODUCT_TYPES, AVAILABLE_COLORS, DEFAULT_PRODUCT_CONFIG } from '../Admin/ProductApproval/constants/productConfig';
import imageCompression from 'browser-image-compression';

const CreateProduct = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formState, setFormState] = useState({
    DesignTitle: '',
    Description: '',
    mainTags: [],
    Designtags: [],
    ProductType: 'hoodie',
    ProductColor: 'white',
    ProductView: 'front'
  });

  const [designFile, setDesignFile] = useState({
    file: null,
    preview: null,
    dpi: 0,
    dimensions: { width: 0, height: 0 },
    score: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});

  const {
    position,
    scale,
    isDragging,
    isOutOfBounds,
    handleDragStart,
    handleScaleChange,
    updatePosition,
    centerDesign,
  } = useDesignPosition({
    initialPosition: designPosition,
    productType: formState.ProductType,
    disabled: isSubmitting,
    onChange: (newPosition) => {
      setDesignPosition(newPosition);
    }
  });

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
      // Compress image if needed
      let processedFile = file;
      if (file.size > 2 * 1024 * 1024) {
        processedFile = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 4000,
          useWebWorker: true
        });
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(processedFile);

      // Get image dimensions and calculate DPI
      const img = new Image();
      img.src = previewUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
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

      // Show quality feedback
      if (score < 70) {
        toast.warning("Design quality could be improved. Consider using a higher resolution image.");
      }
    } catch (error) {
      console.error("Error processing design:", error);
      toast.error("Failed to process design file");
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processDesignFile(file);
    } else {
      toast.error("Please upload an image file");
    }
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      processDesignFile(file);
    }
  }, []);
  const validateForm = () => {
    const errors = {};
    
    if (!formState.DesignTitle.trim()) {
      errors.DesignTitle = "Design title is required";
    }
    
    if (!formState.Description.trim()) {
      errors.Description = "Description is required";
    }
    
    if (!designFile.file) {
      errors.design = "Design file is required";
    }
    
    if (designFile.dpi < 150) {
      errors.dpi = "Design DPI is too low for quality printing";
    }
    
    if (isOutOfBounds) {
      errors.position = "Design is outside the safe print area";
    }
    
    if (formState.mainTags.length === 0) {
      errors.mainTags = "At least one main tag is required";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('design', designFile.file);
      formData.append('DesignTitle', formState.DesignTitle);
      formData.append('Description', formState.Description);
      formData.append('mainTags', JSON.stringify(formState.mainTags));
      formData.append('Designtags', JSON.stringify(formState.Designtags));
      formData.append('ProductType', formState.ProductType);
      formData.append('ProductColor', formState.ProductColor);
      formData.append('ProductView', formState.ProductView);
      formData.append('designPosition', JSON.stringify({
        x: position.x,
        y: position.y,
        scale: scale,
        rotation: position.rotation || 0
      }));

      formData.append('quality', designFile.score);

      await dispatch(createProduct(formData));
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
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
              {!designFile.preview ? (
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
                  <img src={designFile.preview} alt="Design preview" className="max-h-48 mx-auto" />
                  <div className="text-sm">
                    <p>DPI: {designFile.dpi}</p>
                    <p>Quality Score: {designFile.score}/100</p>
                    <button
                      type="button"
                      onClick={() => setDesignFile({ file: null, preview: null, dpi: 0, dimensions: { width: 0, height: 0 }, score: 0 })}
                      className="text-red-500 mt-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
              {validationErrors.design && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.design}</p>
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
                  {PRODUCT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
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
              designImage={designFile.preview}
              position={position}
              scale={scale}
              productType={formState.ProductType}
              productColor={formState.ProductColor}
              productView={formState.ProductView}
              showGuides={showGuides}
              onDragStart={handleDragStart}
              onDragEnd={updatePosition}
              isDragging={isDragging}
              isOutOfBounds={isOutOfBounds}
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
