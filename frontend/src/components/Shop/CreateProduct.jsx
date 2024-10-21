import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createProduct } from "../../redux/actions/product";

const CreateProduct = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { seller } = useSelector((state) => state.seller);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  });
  const [designPreview, setDesignPreview] = useState(null);
  const [designData, setDesignData] = useState(null);
  
  useEffect(() => {
    if (seller && seller._id) {
      setFormState(prevState => ({ ...prevState, shopId: seller._id }));
      setIsLoading(false);
    } else if (seller === null) {
      toast.error("No seller logged in. Please log in to create a product.");
      setIsLoading(false);
    }
  }, [seller]);
  
  const handleChange = (e) => {
    const { id, type, checked, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [id]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleDesignUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 2048 * 2048) { // 50MB limit
        toast.error("File size exceeds 100MB limit. Please choose a smaller file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setDesignPreview(event.target.result);
        setDesignData(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (isSubmitting) return;
      setIsSubmitting(true);
  
      if (!formState.shopId) {
        toast.error("Seller information is missing. Please make sure you are logged in.");
        setIsSubmitting(false);
        return;
      }
  
      if (!formState.DesignTitle || !formState.Maintag || !formState.Description || !designData) {
        toast.error("Please fill in all required fields and upload a design");
        setIsSubmitting(false);
        return;
      }
  
      const formData = new FormData();
      Object.keys(formState).forEach(key => formData.append(key, formState[key]));
      if (designData) {
        formData.append("designImage", designData);
      }
  
      try {
        const response = await dispatch(createProduct(formData));
        if (response && response.success) {
          toast.success("Product created successfully and is awaiting inspection!");
          navigate("/dashboard");
        } else {
          toast.error(response?.message || "An error occurred while creating the product.");
        }
      } catch (error) {
        console.error("Error details:", error);
        toast.error(error.response?.data?.message || "An error occurred while creating the product.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, designData, navigate, dispatch, isSubmitting]
  );
  
  const getMockupUrl = () => {
    const baseUrl = "https://res.cloudinary.com/dkot9tyjm/image/upload/";
    let version, folder, filename;
    
    switch (formState.ProductType) {
      case "hoodie":
        version = "v1728392918";
        folder = "hoodies";
        filename = `hoodie-${formState.ProductColor}-${formState.ProductView}`;
        break;
      case "t-shirt":
        version = "v1728393898";
        folder = "t-shirts";
        filename = `t-shirt-${formState.ProductColor}-${formState.ProductView}`;
        break;
      case "long-sleeve":
        version = "v1728394665";
        folder = "long-sleeves";
        if (formState.ProductColor === "white" || formState.ProductColor === "black") {
          filename = `longseleves-${formState.ProductColor}-${formState.ProductView}`;
        } else if (formState.ProductColor === "gray") {
          filename = `longsleeves-${formState.ProductColor}-${formState.ProductView}`;
        } else {
          filename = `t-shirt-${formState.ProductColor}-${formState.ProductView}`;
        }
        break;
      default:
        return "";
    }
  
    return `${baseUrl}${version}/${folder}/${filename}.png`;
  };
  
  const handleZoom = (direction) => {
    setFormState(prevState => ({
      ...prevState,
      DesignScale: direction === 'in'
        ? Math.min(prevState.DesignScale + 0.1, 2)
        : Math.max(prevState.DesignScale - 0.1, 0.5)
    }));
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-blue-500 font-semibold">Loading seller data...</p>
        </div>
      </div>
    );
  }
  
  if (!seller || !formState.shopId) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <p className="text-red-500 font-semibold">No seller data available. Please log in.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-[90%] 800px:w-[90%] bg-white shadow h-[80vh] rounded-[4px] p-3 overflow-y-scroll">
      <h2 className="text-3xl font-bold mb-4 text-center text-green-600">Design Product</h2>
      <p className="text-center text-blue-500 mb-4">
        <a href="#" className="underline">Need help uploading?</a>
      </p>
  
      <div className="design-upload-area mb-8">
        {!designPreview ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer w-[400px] h-[400px] mx-auto flex items-center justify-center"
            onClick={() => document.getElementById("design-upload").click()}
          >
            <div>
              <svg
                className="w-12 h-12 mx-auto mb-4 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="text-sm text-gray-600">Drop one file here or click to upload</p>
            </div>
          </div>
        ) : (
          <div className="relative w-[400px] h-[400px] mx-auto">
            <img src={designPreview} alt="Design Preview" className="w-full h-full object-contain" />
          </div>
        )}
        <input
          type="file"
          id="design-upload"
          accept="image/png"
          onChange={handleDesignUpload}
          className="hidden"
        />
      </div>
  
      {designPreview && (
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="DesignTitle" className="block mb-1 font-medium">Design Title:</label>
            <input
              type="text"
              id="DesignTitle"
              value={formState.DesignTitle}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Give your design a name"
            />
          </div>
  
          <div className="mb-6">
            <label htmlFor="Maintag" className="block mb-1 font-medium">Main Tag:</label>
            <input
              type="text"
              id="Maintag"
              value={formState.Maintag}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What do people search to find your design?"
            />
          </div>
  
          <div className="mb-6">
            <label htmlFor="Designtags" className="block mb-1 font-medium">Design Tags:</label>
            <input
              type="text"
              id="Designtags"
              value={formState.Designtags}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any other relevant tags to categorize your design"
            />
          </div>
  
          <div className="mb-6">
            <label htmlFor="Description" className="block mb-1 font-medium">Description:</label>
            <textarea
              id="Description"
              value={formState.Description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your design in a short sentence or two!"
              rows="3"
            ></textarea>
          </div>
  
          <div className="mb-6">
            <label htmlFor="ProductType" className="block mb-1 font-medium">Product Type:</label>
            <select
              id="ProductType"
              value={formState.ProductType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="t-shirt">T-shirt</option>
              <option value="hoodie">Hoodie</option>
              <option value="long-sleeve">Long Sleeve</option>
            </select>
          </div>
  
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Product Mockup</h3>
            <div className="relative w-full h-[500px] bg-gray-100">
              <img
                src={getMockupUrl()}
                alt="Product Mockup"
                className="w-full h-full object-contain"
              />
              <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                style={{ 
                  transform: `translate(-50%, -50%) scale(${formState.DesignScale})`,
                  width: '200px',
                  height: '200px'
                }}
              >
                {designPreview && (
                  <img
                    src={designPreview}
                    alt="Design Preview"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-center space-x-4">
              <button
                type="button"
                onClick={() => setFormState({ ...formState, ProductView: formState.ProductView === "front" ? "back" : "front" })}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Switch to {formState.ProductView === "front" ? "Back" : "Front"}
              </button>
              <button
                type="button"
                onClick={() => handleZoom('in')}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Zoom In
              </button>
              <button
                type="button"
                onClick={() => handleZoom('out')}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Zoom Out
              </button>
            </div>
          </div>
  
          <div className="mb-8">
            <label htmlFor="ProductColor" className="block mb-1 font-medium">Product Color:</label>
            <div className="grid grid-cols-4 gap-4">
              {['white', 'black', 'red', 'blue', 'gray'].map((color) => (
                <div
                  key={color}
                  className={`p-4 rounded-md cursor-pointer ${
                    formState.ProductColor === color ? 'ring-2 ring-blue-500' : 'bg-gray-100'
                  }`}
                  onClick={() => setFormState({ ...formState, ProductColor: color })}
                  aria-label={`Select color ${color}`}
                >
                  <div
                    className="w-12 h-12 mx-auto rounded-full"
                    style={{ backgroundColor: color }}
                  ></div>
                  <p className="mt-2 text-center text-sm capitalize">{color}</p>
                </div>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className={`w-full px-4 py-2 text-lg font-bold text-white ${
              isSubmitting ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Product...' : 'Create Product'}
          </button>
        </form>
      )}
    </div>
  );
};
  
export default CreateProduct;