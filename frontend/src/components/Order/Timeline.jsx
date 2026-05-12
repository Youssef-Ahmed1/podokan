// components/Order/Timeline.jsx
import React from 'react';
import { Check, Clock } from 'lucide-react';

export const Timeline = ({ status, deliveryDate }) => {
  const steps = [
    'Processing',
    'Transferred to delivery partner',
    'Out for delivery',
    'Delivered'
  ];

  const getCurrentStep = () => {
    return steps.indexOf(status) + 1;
  };

  return (
      <div className="w-full py-6 mb-8">
          <div className="flex items-center">
              {steps.map((step, index) => (
                  <React.Fragment key={step}>
                      {/* Step Circle */}
                      <div className="relative">
                          <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  index < getCurrentStep()
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-200"
                              }`}
                          >
                              {index < getCurrentStep() ? (
                                  <Check size={20} />
                              ) : (
                                  <Clock size={20} className="text-gray-500" />
                              )}
                          </div>
                          <div className="mt-2 text-xs text-center w-20 -ml-5">
                              {step}
                          </div>
                      </div>

                      {/* Connector Line */}
                      {index < steps.length - 1 && (
                          <div
                              className={`flex-1 h-1 ${
                                  index < getCurrentStep() - 1
                                      ? "bg-blue-600"
                                      : "bg-gray-200"
                              }`}
                          />
                      )}
                  </React.Fragment>
              ))}
          </div>

          {deliveryDate && (
              <div className="text-center mt-4 text-sm text-gray-600">
                  Estimated Delivery:{" "}
                  {new Date(deliveryDate).toLocaleDateString()}
              </div>
          )}
      </div>
  );
};
