import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createProduct } from "../../redux/actions/product";
import { AiOutlineCloudUpload, AiOutlineDelete, AiOutlineInfoCircle } from "react-icons/ai";
import { BiRuler, BiMove } from "react-icons/bi";
import { MdOutlineKeyboardArrowUp, MdOutlineKeyboardArrowDown, 
         MdOutlineKeyboardArrowLeft, MdOutlineKeyboardArrowRight } from "react-icons/md";

const CreateProduct = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { seller } = useSelector((state) => state.seller);
  
  // Refs
  const designPreviewRef = useRef(null);
  const mockupContainerRef = useRef(null);
  const designPositionRef = useRef({ x: 0, y: 0 });
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [designQualityScore, setDesignQualityScore] = useState(null);
  const [showGuides, setShowGuides] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isDesignVisible, setIsDesignVisible] = useState(true);
  const [designStats, setDesignStats] = useState(null);
  
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
    designPosition: { x: 50, y: 50 }, // Center position in percentage
  });

  const [designFile, setDesignFile] = useState({
    preview: null,
    file: null,
    originalFile: null,
    compressionStats: null
  });

  // Constants for design boundaries
  const BOUNDARY_LIMITS = {
    't-shirt': { top: 25, bottom: 70, left: 25, right: 75 },
    'hoodie': { top: 30, bottom: 65, left: 30, right: 70 },
    'long-sleeve': { top: 25, bottom: 70, left: 25, right: 75 }
  };

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

  // Initial setup
  useEffect(() => {
    if (seller && seller._id) {
      setFormState(prev => ({ ...prev, shopId: seller._id }));
      setIsLoading(false);
    } else if (seller === null) {
      toast.error("Please log in as a seller to create products.");
      setIsLoading(false);
    }
  }, [seller]);

  // Keyboard controls for design positioning
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!designFile.preview) return;

      const MOVE_STEP = 1; // Percentage to move
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
        default:
          return;
      }

      checkBoundariesAndUpdate(newPos);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formState.designPosition, designFile.preview, formState.ProductType]);

  // Boundary checking function
  const checkBoundariesAndUpdate = (position) => {
    const boundaries = BOUNDARY_LIMITS[formState.ProductType];
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
  };


  // Design upload and compression handling
  const handleDesignUpload = async (file) => {
    try {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error("File size exceeds 50MB limit");
        return;
      }

      setIsLoading(true);
      const compressionResult = await compressDesign(file);
      
      // Validate compression results
      if (compressionResult.compressedSize > 500 * 1024) { // 500KB limit
        toast.error("Unable to compress image to required size. Please try a smaller image.");
        setIsLoading(false);
        return;
      }

      // Create preview and calculate quality score
      const previewUrl = await createDesignPreview(compressionResult.file, formState.ProductColor);
      const qualityScore = calculateDesignQualityScore({
        dpi: compressionResult.dpi,
        compressedSize: compressionResult.compressedSize,
        width: compressionResult.width,
        height: compressionResult.height,
        hasTransparency: await checkTransparency(compressionResult.file)
      });

      setDesignFile({
        preview: previewUrl,
        file: compressionResult.file,
        originalFile: file,
        compressionStats: compressionResult
      });

      setDesignQualityScore(qualityScore);
      
      // Show compression success message
      toast.success(`Design compressed from ${(file.size / (1024 * 1024)).toFixed(2)}MB to ${(compressionResult.compressedSize / 1024).toFixed(2)}KB`);
      
      if (qualityScore.score < 80) {
        toast.warning("Design quality could be improved. Check the quality score details.");
      }

    } catch (error) {
      toast.error(error.message || "Failed to process design");
    } finally {
      setIsLoading(false);
    }
  };

  // Drag and drop handlers
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
    if (file && file.type === "image/png") {
      handleDesignUpload(file);
    } else {
      toast.error("Please upload only PNG files");
    }
  }, []);

  // Design position handling
  const handleDesignDrag = useCallback((e) => {
    if (!mockupContainerRef.current || !isDragging) return;

    const rect = mockupContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    checkBoundariesAndUpdate({ x, y });
  }, [isDragging, checkBoundariesAndUpdate]);

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Validate design quality
      if (designQualityScore?.score < 60) {
        if (!window.confirm("Design quality is low. Are you sure you want to proceed?")) {
          return;
        }
      }

      // Prepare form data
      const formData = new FormData();
      Object.keys(formState).forEach(key => {
        if (key === 'designPosition') {
          formData.append(key, JSON.stringify(formState[key]));
        } else {
          formData.append(key, formState[key]);
        }
      });

      // Append compressed design
      if (designFile.file) {
        formData.append("designImage", designFile.file);
      }

      const response = await dispatch(createProduct(formData));
      if (response?.success) {
        toast.success("Product created successfully and is awaiting inspection!");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(error.message || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI Component: Design Quality Indicator
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

  // Main render
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
                onChange={(e) => handleDesignUpload(e.target.files[0])}
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
                  src={getMockupUrl()}
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
                      cursor: isDragging ? 'grabbing' : 'grab'
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
                    {/* Show boundary lines based on BOUNDARY_LIMITS */}
                    <div className="border-2 border-blue-500 border-dashed opacity-30"
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

              {/* Controls */}
              <div className="mt-4 flex justify-center space-x-4">
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
                >
                  Switch to {formState.ProductView === "front" ? "Back" : "Front"}
                </button>
              </div>
            </div>
          )}
        </div>
{/* Quality Score and Stats (shown when design is uploaded) */}
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
                    Quality: {designFile.compressionStats.quality}%
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter a catchy title for your design"
              required
              maxLength={100}
            />
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Primary category or theme"
              required
            />
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Comma-separated tags (e.g., funny, cute, trendy)"
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Describe your design and its appeal"
              required
            />
          </div>

          {/* Product Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Type
            </label>
            <div className="grid grid-cols-3 gap-4">
              {['t-shirt', 'hoodie', 'long-sleeve'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormState(prev => ({
                    ...prev,
                    ProductType: type
                  }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formState.ProductType === type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <span className="capitalize">{type.replace('-', ' ')}</span>
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
                  className={`group relative p-2 rounded-lg transition-all ${
                    formState.ProductColor === key
                      ? 'ring-2 ring-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
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
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
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
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Creating Product...
                </div>
              ) : (
                'Create Product'
              )}
            </button>
          </div>
        </form>

        {/* Help Modal - Can be triggered by a help button */}
        {/* You might want to add a help modal with design guidelines */}
      </div>
    </div>
  );
};

export default CreateProduct;