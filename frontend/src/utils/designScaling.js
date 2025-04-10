const DESIGN_CONFIG = {
  dimensions: {
    default: {
      width: '30%',
      maxWidth: '30vh',
      aspectRatio: 1
    },
    preview: {
      width: '40%',
      maxWidth: '40vh',
      aspectRatio: 1
    }
  },
  scale: {
    min: 0.5,
    max: 1.2,
    default: 0.8,
    steps: 0.1
  },
  position: {
    default: { x: 50, y: 40 },
    boundaries: {
      hoodie: {
        front: {
          top: 25,
          bottom: 55,
          left: 35,
          right: 65
        },
        back: {
          top: 25,
          bottom: 55,
          left: 35,
          right: 65
        }
      }
    }
  },
  blendModes: {
    white: 'multiply',
    black: 'screen'
  }
};

class DesignScalingManager {
  static validatePosition(position, productType, view) {
    const boundaries = DESIGN_CONFIG.position.boundaries[productType]?.[view];
    if (!boundaries) return false;

    return (
      position.x >= boundaries.left &&
      position.x <= boundaries.right &&
      position.y >= boundaries.top &&
      position.y <= boundaries.bottom
    );
  }

  static clampPosition(position, productType, view) {
    if (!position) return DESIGN_CONFIG.position.default;

    const boundaries = DESIGN_CONFIG.position.boundaries[productType]?.[view];
    if (!boundaries) return DESIGN_CONFIG.position.default;

    return {
      x: Math.max(boundaries.left, Math.min(boundaries.right, position.x)),
      y: Math.max(boundaries.top, Math.min(boundaries.bottom, position.y)),
    };
  }

  static clampScale(scale) {
    if (!scale) return DESIGN_CONFIG.scale.default;
    return Math.max(
      DESIGN_CONFIG.scale.min,
      Math.min(DESIGN_CONFIG.scale.max, scale)
    );
  }

  // New method for consistent container styling across all components
  static getConsistentContainerStyles(
    position,
    scale,
    productColor,
    productType,
    view,
    isAdminPreview = false
  ) {
    // Select dimensions based on context
    const dimensions = isAdminPreview
      ? DESIGN_CONFIG.dimensions.preview
      : DESIGN_CONFIG.dimensions.default;

    // Ensure position is within boundaries
    const clampedPosition = this.clampPosition(
      position || DESIGN_CONFIG.position.default,
      productType || "hoodie",
      view || "front"
    );

    // Ensure scale is within bounds
    const clampedScale = this.clampScale(scale);

    // Get the appropriate blend mode based on product color
    const blendMode = DESIGN_CONFIG.blendModes[productColor] || "normal";

    return {
      position: "absolute",
      left: `${clampedPosition.x}%`,
      top: `${clampedPosition.y}%`,
      width: dimensions.width,
      maxWidth: dimensions.maxWidth,
      aspectRatio: dimensions.aspectRatio,
      transform: `translate(-50%, -50%) scale(${clampedScale})`,
      mixBlendMode: blendMode,
      pointerEvents: "none",
      transformOrigin: "center center",
      transition: "all 0.2s ease-out",
    };
  }
  static getDesignStyles(
    position,
    scale,
    productColor,
    productType,
    view = "front",
    isPreview = false
  ) {
    return {
      container: this.getConsistentContainerStyles(
        position,
        scale,
        productColor,
        productType,
        view,
        isPreview
      ),
      image: {
        width: "100%",
        height: "100%",
        objectFit: "contain",
        background: "transparent",
        userSelect: "none",
      },
    };
  }

  // Method for consistent positioning across different view sizes
  static normalizePosition(position, fromView, toView, productType = "hoodie") {
    const fromBoundaries =
      DESIGN_CONFIG.position.boundaries[productType]?.[fromView];
    const toBoundaries =
      DESIGN_CONFIG.position.boundaries[productType]?.[toView];

    if (!fromBoundaries || !toBoundaries || !position)
      return DESIGN_CONFIG.position.default;

    // Calculate position as percentage within boundaries
    const xPercentage =
      (position.x - fromBoundaries.left) /
      (fromBoundaries.right - fromBoundaries.left);
    const yPercentage =
      (position.y - fromBoundaries.top) /
      (fromBoundaries.bottom - fromBoundaries.top);

    // Apply percentage to new boundaries
    return {
      x:
        toBoundaries.left +
        xPercentage * (toBoundaries.right - toBoundaries.left),
      y:
        toBoundaries.top +
        yPercentage * (toBoundaries.bottom - toBoundaries.top),
    };
  }
}

export { DESIGN_CONFIG, DesignScalingManager };