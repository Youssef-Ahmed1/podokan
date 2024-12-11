import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

const ValidationSystem = ({ product, onValidationChange }) => {
  const validationRules = useMemo(() => [
    {
      id: 'design',
      label: 'Design Validation',
      checks: [
        {
          id: 'designImage',
          label: 'Design image is present',
          validate: () => !!product.designImage
        },
        {
          id: 'designPosition',
          label: 'Design position is valid',
          validate: () => {
            const pos = product.DesignPosition;
            return pos && pos.x >= 0 && pos.x <= 100 && pos.y >= 0 && pos.y <= 100;
          }
        },
        {
          id: 'designScale',
          label: 'Design scale is valid',
          validate: () => {
            const scale = product.DesignScale;
            return scale && scale >= 0.1 && scale <= 2.0;
          }
        }
      ]
    },
    {
      id: 'product',
      label: 'Product Information',
      checks: [
        {
          id: 'title',
          label: 'Design title is present',
          validate: () => product.DesignTitle?.length > 0
        },
        {
          id: 'description',
          label: 'Description is present',
          validate: () => product.Description?.length > 0
        },
        {
          id: 'tags',
          label: 'Has required tags',
          validate: () => product.mainTags?.length >= 2
        }
      ]
    },
    {
      id: 'pricing',
      label: 'Pricing Validation',
      checks: [
        {
          id: 'originalPrice',
          label: 'Original price is valid',
          validate: () => product.originalPrice > 0
        },
        {
          id: 'discountPrice',
          label: 'Discount price is valid (if present)',
          validate: () => !product.discountPrice || 
            (product.discountPrice > 0 && product.discountPrice <= product.originalPrice)
        }
      ]
    }
  ], [product]);

  const validationResults = useMemo(() => {
    const results = validationRules.map(group => ({
      ...group,
      checks: group.checks.map(check => ({
        ...check,
        isValid: check.validate()
      }))
    }));

    const isValid = results.every(group => 
      group.checks.every(check => check.isValid)
    );

    return { groups: results, isValid };
  }, [validationRules]);

  useEffect(() => {
    onValidationChange(validationResults.isValid);
  }, [validationResults.isValid, onValidationChange]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Validation Status
      </h3>

      <div className="space-y-6">
        {validationResults.groups.map(group => (
          <div key={group.id} className="space-y-2">
            <h4 className="font-medium text-gray-700">
              {group.label}
            </h4>
            <div className="space-y-1">
              {group.checks.map(check => (
                <div
                  key={check.id}
                  className="flex items-center text-sm"
                >
                  <span className={`
                    w-4 h-4 rounded-full mr-2 flex-shrink-0
                    ${check.isValid ? 'bg-green-500' : 'bg-red-500'}
                  `} />
                  <span className={check.isValid ? 'text-gray-700' : 'text-red-600'}>
                    {check.label}
                  </span>
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
    designImage: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    DesignPosition: PropTypes.object,
    DesignScale: PropTypes.number,
    DesignTitle: PropTypes.string,
    Description: PropTypes.string,
    mainTags: PropTypes.arrayOf(PropTypes.string),
    originalPrice: PropTypes.number,
    discountPrice: PropTypes.number
  }).isRequired,
  onValidationChange: PropTypes.func.isRequired
};

export default ValidationSystem;