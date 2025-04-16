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
  // DesignProcessor.js - Replace getProductTemplatePath method
  static getProductTemplatePath(productType, ProductColor) {
    // Base Cloudinary URL for templates
    const cloudinaryBaseUrl =
      "https://res.cloudinary.com/dkot9tyjm/image/upload";

    // Normalize product type and color
    const type = (productType || "hoodie").toLowerCase();
    const color =
      ProductColor && ProductColor !== "N/A"
        ? ProductColor.toLowerCase()
        : "white";

    // Determine folder and filename pattern based on product type
    let folder;
    let filePattern;

    if (type.includes("hoodie")) {
      folder = "hoodies";
      filePattern = `hoodie-${color}-front.png`;
    } else if (type.includes("long")) {
      folder = "long-sleeves";
      filePattern = `longseleves-${color}-front.png`;
      // Handle inconsistencies in naming (some use t-shirt-color-front pattern)
      if (color === "red" || color === "blue") {
        filePattern = `t-shirt-${color}-front.png`;
      }
    } else {
      // Default to t-shirt
      folder = "t-shirts";
      filePattern = `t-shirt-${color}-front.png`;
    }

    // Construct the full URL
    // Note: Use a version number that exists for your assets
    const versionId =
      type === "hoodie"
        ? "v1728392918"
        : type.includes("long")
        ? "v1728394665"
        : "v1728393898";

    return `${cloudinaryBaseUrl}/${versionId}/${folder}/${filePattern}`;
  }

  // Process design and create a mockup
  // designDownload.js - Update createProductMockup method
  static async createProductMockup(
    designImageUrl,
    productType,
    productColor,
    designSpecs
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("Creating mockup with:", {
          designImageUrl,
          productType,
          productColor,
          designSpecs,
        });

        // 1. Download design image
        const designBlob = await this.fetchImageAsBlob(designImageUrl);
        const designObjectUrl = URL.createObjectURL(designBlob);

        // 2. Load design image
        const designImg = await this.loadImage(designObjectUrl);

        // 3. Generate template URL
        const templateUrl = this.getProductTemplateUrl(
          productType,
          productColor
        );
        console.log(`Using template URL: ${templateUrl}`);

        // 4. Load product template
        const productImg = await this.loadImage(templateUrl);

        // Rest of the method remains the same...
      } catch (error) {
        console.error("Error creating product mockup:", error);
        reject(error);
      }
    });
  }

  // Add a new method to generate template URLs
  static getProductTemplateUrl(productType, productColor) {
    // Base Cloudinary URL
    const cloudinaryBaseUrl =
      "https://res.cloudinary.com/dkot9tyjm/image/upload";

    // Normalize inputs
    const type = (productType || "hoodie").toLowerCase();
    const color =
      productColor && productColor !== "N/A" ? color.toLowerCase() : "white";

    // Determine the right path pattern
    let folder, filePattern;

    if (type.includes("hoodie")) {
      folder = "hoodies";
      filePattern = `hoodie-${color}-front.png`;
    } else if (type.includes("long")) {
      folder = "long-sleeves";
      filePattern =
        color === "red" || color === "blue"
          ? `t-shirt-${color}-front.png`
          : `longseleves-${color}-front.png`;
    } else {
      folder = "t-shirts";
      filePattern = `t-shirt-${color}-front.png`;
    }

    // Use appropriate version number
    const versionId =
      type === "hoodie"
        ? "v1728392918"
        : type.includes("long")
        ? "v1728394665"
        : "v1728393898";

    return `${cloudinaryBaseUrl}/${versionId}/${folder}/${filePattern}`;
  }
}

module.exports = DesignProcessor;
