const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

class DesignProcessor {
  // Download an image to a temporary file
  static async downloadImage(url, outputPath) {
    try {
      const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
      });

      return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);
        writer.on("finish", () => resolve(outputPath));
        writer.on("error", reject);
      });
    } catch (error) {
      console.error("Error downloading image:", error);
      throw error;
    }
  }

  // Get product template path based on type and color
  static getProductTemplatePath(productType, productColor) {
    const baseDir = path.join(__dirname, "../assets/templates");

    // Normalize product type and color
    const type = (productType || "hoodie").toLowerCase();
    const color = (productColor || "white").toLowerCase();

    // Determine file path based on product type
    let templateName;
    if (type.includes("hoodie")) {
      templateName = `hoodie_${color}.png`;
    } else if (type.includes("shirt")) {
      templateName = `tshirt_${color}.png`;
    } else if (type.includes("long")) {
      templateName = `longsleeve_${color}.png`;
    } else {
      templateName = `hoodie_white.png`; // Default
    }

    const templatePath = path.join(baseDir, templateName);

    // Check if file exists, use default if not
    if (!fs.existsSync(templatePath)) {
      return path.join(baseDir, "hoodie_white.png");
    }

    return templatePath;
  }

  // Process design and create a mockup
  static async createMockup(
    designImageUrl,
    productType,
    productColor,
    designPosition
  ) {
    try {
      // Get product template path
      const templatePath = this.getProductTemplatePath(
        productType,
        productColor
      );

      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Create temp file paths
      const designTempPath = path.join(tempDir, `design_${Date.now()}.png`);
      const outputPath = path.join(tempDir, `mockup_${Date.now()}.png`);

      // Download design image
      await this.downloadImage(designImageUrl, designTempPath);

      // Get template image dimensions
      const templateMetadata = await sharp(templatePath).metadata();
      const { width: templateWidth, height: templateHeight } = templateMetadata;

      // Get design image dimensions and resize based on scale
      const designMetadata = await sharp(designTempPath).metadata();
      const scale = designPosition?.scale || 1;
      const designWidth = Math.round(designMetadata.width * scale);
      const designHeight = Math.round(designMetadata.height * scale);

      // Resize design
      const resizedDesignPath = path.join(tempDir, `resized_${Date.now()}.png`);
      await sharp(designTempPath)
        .resize(designWidth, designHeight)
        .toFile(resizedDesignPath);

      // Calculate position in pixels (convert from percentage)
      const posX =
        Math.round((templateWidth * (designPosition?.positionX || 50)) / 100) -
        Math.round(designWidth / 2);
      const posY =
        Math.round((templateHeight * (designPosition?.positionY || 50)) / 100) -
        Math.round(designHeight / 2);

      // Create mockup by compositing images
      await sharp(templatePath)
        .composite([
          {
            input: resizedDesignPath,
            left: posX,
            top: posY,
          },
        ])
        .toFile(outputPath);

      // Clean up temporary design file
      fs.unlinkSync(designTempPath);
      fs.unlinkSync(resizedDesignPath);

      return outputPath;
    } catch (error) {
      console.error("Error creating mockup:", error);
      throw error;
    }
  }

  // Process an order item and create a mockup
  static async processOrderItem(orderItem) {
    try {
      if (!orderItem) {
        throw new Error("Invalid order item");
      }

      const designImageUrl =
        orderItem.designImage?.url || orderItem.designImage;
      if (!designImageUrl) {
        throw new Error("Design image not found");
      }

      const productType = orderItem.ProductType || "Hoodie";
      const productColor = orderItem.ProductColor || "White";

      const designPosition = {
        positionX: orderItem.designSpecs?.positionX || 50,
        positionY: orderItem.designSpecs?.positionY || 50,
        scale: orderItem.designSpecs?.scale || 1,
        rotation: orderItem.designSpecs?.rotation || 0,
      };

      const mockupPath = await this.createMockup(
        designImageUrl,
        productType,
        productColor,
        designPosition
      );

      return mockupPath;
    } catch (error) {
      console.error("Error processing order item:", error);
      throw error;
    }
  }
}

module.exports = DesignProcessor;
