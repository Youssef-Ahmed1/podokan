import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { HiCheck, HiX, HiExclamation } from 'react-icons/hi';
import { PRODUCT_TYPES } from './constants/productConfig';

// Add default product config
const DEFAULT_PRODUCT_CONFIG = {
  basePrice: 850,
  productionCost: 650,
  margins: {
    min: 0.15,
    recommended: 0.30
  }
};


const ValidationSystem = ({ product, onValidationChange }) => {
  // Add null checks for product type
  const productConfig = PRODUCT_TYPES[product?.ProductType] || DEFAULT_PRODUCT_CONFIG;
  
  // Validation rules with detailed checks
  const validationResults = useMemo(() => {
    return {
      design: {
        label: 'Design Validation',
        checks: [
          {
            id: 'designImage',
            label: 'Design image is present',
            isValid: !!product?.designImage,
            severity: 'error',
            message: 'Design image is required'
          },
          {
            id: 'designPosition',
            label: 'Design position is valid',
            isValid: product?.DesignPosition && 
                    product.DesignPosition.x >= 20 && 
                    product.DesignPosition.x <= 80 && 
                    product.DesignPosition.y >= 15 && 
                    product.DesignPosition.y <= 45,
            severity: 'error',
            message: 'Design must be positioned within the safe area'
          },
          {
            id: 'designScale',
            label: 'Design scale is appropriate',
            isValid: product.DesignScale && 
                    product.DesignScale >= 0.3 && 
                    product.DesignScale <= 2,
            severity: 'error',
            message: 'Design scale must be between 30% and 200%'
          }
        ]
      },
      content: {
        label: 'Content Validation',
        checks: [
          {
            id: 'title',
            label: 'Design title',
            isValid: !!product.DesignTitle && product.DesignTitle.length >= 3,
            severity: 'error',
            message: 'Title must be at least 3 characters long'
          },
          {
            id: 'description',
            label: 'Product description',
            isValid: !!product.Description && product.Description.length >= 10,
            severity: 'error',
            message: 'Description must be at least 10 characters long'
          },
          {
            id: 'mainTags',
            label: 'Main tags',
            isValid: product.mainTags && product.mainTags.length >= 2,
            severity: 'error',
            message: 'At least 2 main tags are required'
          },
          {
            id: 'designTags',
            label: 'Design tags',
            isValid: product.Designtags && product.Designtags.length >= 1,
            severity: 'warning',
            message: 'At least 1 design tag is recommended'
          }
        ]
      },
      pricing: {
        label: 'Pricing Validation',
        checks: [
          {
            id: 'basePrice',
            label: 'Base price requirement',
            isValid: (product?.originalPrice || 0) >= (productConfig?.basePrice || DEFAULT_PRODUCT_CONFIG.basePrice),
            severity: 'error',
            message: `Price must be at least ${productConfig?.basePrice || DEFAULT_PRODUCT_CONFIG.basePrice} THB`
          },
          {
            id: 'margin',
            label: 'Profit margin',
            isValid: product?.originalPrice ? 
              ((product.originalPrice - (productConfig?.productionCost || DEFAULT_PRODUCT_CONFIG.productionCost)) / product.originalPrice) >= 
              (productConfig?.margins.min || DEFAULT_PRODUCT_CONFIG.margins.min) : false,
            severity: 'error',
            message: `Margin must be at least ${(productConfig?.margins.min || DEFAULT_PRODUCT_CONFIG.margins.min) * 100}%`
          },
          {
            id: 'recommendedMargin',
            label: 'Recommended margin',
            isValid: ((product.originalPrice - productConfig.productionCost) / product.originalPrice) >= productConfig.margins.recommended,
            severity: 'warning',
            message: `Recommended margin is ${productConfig.margins.recommended * 100}%`
          },
          {
            id: 'discountPrice',
            label: 'Discount price (if set)',
            isValid: !product.discountPrice || 
                    (product.discountPrice >= productConfig.basePrice && 
                     product.discountPrice <= product.originalPrice),
            severity: 'error',
            message: 'Discount price must be between base price and original price'
          }
        ]
      }
    };
  }, [product]);

  // Calculate overall validation status
  const validationStatus = useMemo(() => {
    const allChecks = Object.values(validationResults).flatMap(group => group.checks);
    const errorChecks = allChecks.filter(check => check.severity === 'error');
    const warningChecks = allChecks.filter(check => check.severity === 'warning');
    
    return {
      isValid: errorChecks.every(check => check.isValid),
      hasWarnings: warningChecks.some(check => !check.isValid),
      errorCount: errorChecks.filter(check => !check.isValid).length,
      warningCount: warningChecks.filter(check => !check.isValid).length
    };
  }, [validationResults]);

  // Update parent component with validation status
  useEffect(() => {
    onValidationChange(validationStatus);
  }, [validationStatus, onValidationChange]);

  const ValidationIcon = ({ isValid, severity }) => {
    if (isValid) {
      return <HiCheck className="w-5 h-5 text-green-500" />;
    }
    return severity === 'error' 
      ? <HiX className="w-5 h-5 text-red-500" />
      : <HiExclamation className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Validation Status
        </h3>
        <div className="flex items-center space-x-4">
          {validationStatus.errorCount > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-700">
              {validationStatus.errorCount} {validationStatus.errorCount === 1 ? 'Error' : 'Errors'}
            </span>
          )}
          {validationStatus.warningCount > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
              {validationStatus.warningCount} {validationStatus.warningCount === 1 ? 'Warning' : 'Warnings'}
            </span>
          )}
          {validationStatus.isValid && !validationStatus.hasWarnings && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
              All Checks Passed
            </span>
          )}
        </div>
      </div>

      {/* Validation Groups */}
      <div className="space-y-6">
        {Object.entries(validationResults).map(([key, group]) => (
          <div key={key} className="space-y-3">
            <h4 className="font-medium text-gray-700">
              {group.label}
            </h4>
            <div className="space-y-2">
              {group.checks.map(check => (
                <div
                  key={check.id}
                  className={`
                    flex items-center justify-between p-3 rounded-lg
                    ${check.isValid 
                      ? 'bg-green-50' 
                      : check.severity === 'error'
                        ? 'bg-red-50'
                        : 'bg-yellow-50'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <ValidationIcon isValid={check.isValid} severity={check.severity} />
                    <div>
                      <p className={`
                        text-sm font-medium
                        ${check.isValid 
                          ? 'text-green-700' 
                          : check.severity === 'error'
                            ? 'text-red-700'
                            : 'text-yellow-700'
                        }
                      `}>
                        {check.label}
                      </p>
                      {!check.isValid && (
                        <p className={`
                          text-sm mt-0.5
                          ${check.severity === 'error' ? 'text-red-500' : 'text-yellow-500'}
                        `}>
                          {check.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

ValidationSystem.propTypes = {
  product: PropTypes.shape({
    ProductType: PropTypes.string,
    DesignTitle: PropTypes.string,
    Description: PropTypes.string,
    designImage: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]),
    DesignPosition: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number
    }),
    DesignScale: PropTypes.number,
    mainTags: PropTypes.arrayOf(PropTypes.string),
    Designtags: PropTypes.arrayOf(PropTypes.string),
    originalPrice: PropTypes.number,
    discountPrice: PropTypes.number
  }).isRequired,
  onValidationChange: PropTypes.func.isRequired
};


export default ValidationSystem;