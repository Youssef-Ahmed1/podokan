
// Calculate responsive dimensions based on container size
export const getResponsiveDimensions = (containerWidth) => {
    // Base dimensions as percentages of container
    const dimensions = {
      xs: { width: '45%', height: '55%' },
      sm: { width: '40%', height: '50%' },
      md: { width: '35%', height: '45%' },
      lg: { width: '30%', height: '40%' },
      xl: { width: '25%', height: '35%' }
    };
  
    // Return dimensions based on container width
    if (containerWidth < 640) return dimensions.xs;
    if (containerWidth < 768) return dimensions.sm;
    if (containerWidth < 1024) return dimensions.md;
    if (containerWidth < 1280) return dimensions.lg;
    return dimensions.xl;
  };
  
  // Calculate safe area boundaries
  export const calculateSafeArea = (productType) => {
    const safeAreaConfig = {

      'hoodie': {
        top: 30,
        bottom: 70,
        left: 35,
        right: 65
      },      
      // 't-shirt': {
        // top: 25,
        // bottom: 75,
        // left: 30,
        // right: 70
      // },
      // 'long-sleeves': {
        // top: 25,
        // bottom: 75,
        // left: 30,
        // right: 70
      // }
    };
  
    return safeAreaConfig[productType] || safeAreaConfig['hoodie'];
  };
  
  // Check if design is within safe area
  export const isWithinSafeArea = (position, productType) => {
    const safeArea = calculateSafeArea(productType);
    return (
      position.x >= safeArea.left &&
      position.x <= safeArea.right &&
      position.y >= safeArea.top &&
      position.y <= safeArea.bottom
    );
  };