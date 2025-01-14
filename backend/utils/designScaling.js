// /frontend/src/utils/designScaling.js

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
    const boundaries = DESIGN_CONFIG.position.boundaries[productType]?.[view];
    if (!boundaries) return DESIGN_CONFIG.position.default;

    return {
      x: Math.max(boundaries.left, Math.min(boundaries.right, position.x)),
      y: Math.max(boundaries.top, Math.min(boundaries.bottom, position.y))
    };
  }

  static clampScale(scale) {
    return Math.max(
      DESIGN_CONFIG.scale.min,
      Math.min(DESIGN_CONFIG.scale.max, scale)
    );
  }

  static getDesignStyles(position, scale, productColor, view = 'front') {
    return {
      container: {
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: DESIGN_CONFIG.dimensions.default.width,
        maxWidth: DESIGN_CONFIG.dimensions.default.maxWidth,
        aspectRatio: DESIGN_CONFIG.dimensions.default.aspectRatio,
        transform: `translate(-50%, -50%) scale(${scale})`,
        mixBlendMode: DESIGN_CONFIG.blendModes[productColor],
        pointerEvents: 'none',
        transformOrigin: 'center center'
      },
      image: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        background: 'transparent'
      }
    };
  }
}

export { DESIGN_CONFIG, DesignScalingManager };