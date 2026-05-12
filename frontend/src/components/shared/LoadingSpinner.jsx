import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  // Ripple effect
  ripple: {
    initial: {
      scale: 1,
      opacity: 1,
    },
    animate: {
      scale: [1, 2, 2, 1, 1],
      opacity: [1, 0.5, 0.25, 0.5, 1],
      borderRadius: ["20%", "20%", "50%", "50%", "20%"],
    },
  },
  // Morphing shapes
  morph: {
    initial: {
      rotate: 0,
      scale: 1,
    },
    animate: {
      rotate: 360,
      scale: [1, 1.2, 0.8, 1],
      borderRadius: ["20%", "50%", "20%", "20%"],
    },
  },
  // Pulse effect
  pulse: {
    initial: {
      scale: 1,
    },
    animate: {
      scale: [1, 1.1, 1],
    },
  },
  // DNA helix
  dna: {
    initial: {
      y: 0,
      opacity: 0,
    },
    animate: {
      y: [-20, 20, -20],
      opacity: [0, 1, 0],
    },
  }
};

const SizeClasses = {
  small: "w-8 h-8",
  medium: "w-12 h-12",
  large: "w-16 h-16",
  xlarge: "w-24 h-24",
};

const LoadingSpinner = ({
    type = "ripple",
    size = "medium",
    color = "blue",
    speed = 1,
    text,
    className = "",
    customColors = {
        primary: "#3B82F6", // Blue
        secondary: "#6366F1", // Indigo
        tertiary: "#8B5CF6", // Purple
    },
}) => {
    const getAnimationProps = () => {
        const baseTransition = {
            duration: 2 / speed,
            repeat: Infinity,
            ease: "easeInOut",
        };

        switch (type) {
            case "ripple":
                return {
                    variants: variants.ripple,
                    transition: {
                        ...baseTransition,
                        times: [0, 0.2, 0.5, 0.8, 1],
                    },
                };
            case "morph":
                return {
                    variants: variants.morph,
                    transition: {
                        ...baseTransition,
                        times: [0, 0.25, 0.5, 1],
                    },
                };
            case "pulse":
                return {
                    variants: variants.pulse,
                    transition: {
                        ...baseTransition,
                        times: [0, 0.5, 1],
                    },
                };
            case "dna":
                return {
                    variants: variants.dna,
                    transition: {
                        ...baseTransition,
                        times: [0, 0.5, 1],
                    },
                };
            default:
                return {
                    variants: variants.ripple,
                    transition: baseTransition,
                };
        }
    };

    const renderSpinnerContent = () => {
        switch (type) {
            case "dna":
                return (
                    <div className="flex space-x-2">
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={i}
                                custom={i}
                                initial="initial"
                                animate="animate"
                                variants={variants.dna}
                                transition={{
                                    duration: 1 / speed,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                }}
                                style={{
                                    backgroundColor:
                                        Object.values(customColors)[i] ||
                                        customColors.primary,
                                }}
                                className={`${SizeClasses.small} rounded-full`}
                            />
                        ))}
                    </div>
                );

            case "gradient":
                return (
                    <div className="relative">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 1.5 / speed,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                            className={`
                ${SizeClasses[size]} rounded-full
                bg-gradient-to-r from-${color}-500 to-transparent
                border-2 border-${color}-500/30
              `}
                        />
                        <div
                            className={`
              absolute inset-[3px] rounded-full bg-white dark:bg-gray-900
              ${text ? "flex items-center justify-center" : ""}
            `}
                        >
                            {text && (
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    {text}
                                </span>
                            )}
                        </div>
                    </div>
                );

            default:
                return (
                    <motion.div
                        initial="initial"
                        animate="animate"
                        {...getAnimationProps()}
                        style={{
                            backgroundColor: customColors.primary,
                        }}
                        className={`${SizeClasses[size]} rounded-md`}
                    />
                );
        }
    };

    // Loader wrapper with optional text
    return (
        <div
            className={`flex flex-col items-center justify-center ${className}`}
        >
            {renderSpinnerContent()}
            {text && type !== "gradient" && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-300"
                >
                    {text}
                </motion.p>
            )}
        </div>
    );
};

// Usage examples:
const LoadingExamples = () => {
  return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8">
          {/* Basic ripple effect */}
          <LoadingSpinner type="ripple" size="large" text="Loading..." />

          {/* Morphing shapes */}
          <LoadingSpinner
              type="morph"
              size="large"
              customColors={{
                  primary: "#EC4899", // Pink
              }}
              speed={1.2}
          />

          {/* DNA helix */}
          <LoadingSpinner
              type="dna"
              size="large"
              customColors={{
                  primary: "#F59E0B", // Amber
                  secondary: "#10B981", // Emerald
                  tertiary: "#6366F1", // Indigo
              }}
              speed={0.8}
          />

          {/* Gradient spinner with text */}
          <LoadingSpinner
              type="gradient"
              size="large"
              color="purple"
              text="85%"
              speed={1.5}
          />
      </div>
  );
};

export default LoadingSpinner;
