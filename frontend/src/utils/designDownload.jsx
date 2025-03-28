import JSZip from "jszip";
import { saveAs } from "file-saver";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

// Error classes for better error handling
class DesignDownloadError extends Error {
  constructor(message, code = "DESIGN_DOWNLOAD_FAILED") {
    super(message);
    this.name = "DesignDownloadError";
    this.code = code;
  }
}

class ImageProcessingError extends DesignDownloadError {
  constructor(message, status = null) {
    super(message, "IMAGE_PROCESSING_ERROR");
    this.status = status; // Store HTTP status if applicable
  }
}

export class DesignDownloader {
  /**
   * Fetches an image URL and returns it as a Blob.
   * Handles potential CORS issues and network errors.
   * @param {string} url - The URL of the image to fetch.
   * @returns {Promise<Blob>} - A promise resolving to the image Blob.
   */
  static async fetchImageAsBlob(url) {
    if (!url) {
      throw new ImageProcessingError("Image URL is required for fetching.");
    }
    try {
      // Attempt fetch with minimal credentials first (safer for public resources like Cloudinary)
      const response = await axios({
        url,
        method: "GET",
        responseType: "blob",
        headers: {
          // Headers to try and bypass cache
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        timeout: 45000, // Increased timeout for potentially large images
        // validateStatus: (status) => status >= 200 && status < 300, // Default Axios behavior
        // withCredentials: false, // Usually not needed for Cloudinary/S3 unless restricted bucket
      });

      if (!(response.data instanceof Blob)) {
        throw new ImageProcessingError(
          "Fetched data is not a Blob.",
          response.status
        );
      }

      return response.data; // Axios puts blob directly in response.data
    } catch (error) {
      console.error(`Failed to fetch image from ${url}:`, error);
      const status = error.response?.status;
      let message = `Failed to fetch image`;
      if (status) message += ` (Status: ${status})`;
      if (error.message) message += `: ${error.message}`;
      throw new ImageProcessingError(message, status);
    }
  }

  /**
   * Loads an image from a source (URL or Blob URL) into an HTMLImageElement.
   * Handles image loading errors.
   * @param {string} src - The image source URL (can be Blob URL).
   * @returns {Promise<HTMLImageElement>} - A promise resolving to the loaded Image element.
   */
  static loadImage(src) {
    return new Promise((resolve, reject) => {
      if (!src) {
        return reject(
          new ImageProcessingError("Image source is required for loading.")
        );
      }
      const img = new Image();
      img.crossOrigin = "anonymous"; // Attempt CORS request

      const cleanup = () => {
        img.onload = null;
        img.onerror = null;
      };

      img.onload = () => {
        cleanup();
        resolve(img);
      };

      img.onerror = (e) => {
        cleanup();
        console.error("Image load failed for src:", src, e);
        reject(new ImageProcessingError(`Image loading failed for source.`)); // Don't expose src directly in error msg
      };

      try {
        // Check if src is a Blob URL and handle revoke logic if needed later
        if (src.startsWith("blob:")) {
          // Potential: URL.revokeObjectURL(src) after image is drawn to canvas if creating blob urls yourself
        }
        img.src = src;
      } catch (e) {
        reject(new ImageProcessingError(`Invalid image source: ${e.message}`));
      }
    });
  }

  /**
   * Determines the URL for the product template image based on type and color.
   * @param {string} productType - e.g., "hoodie", "tshirt".
   * @param {string} productColor - e.g., "white", "black".
   * @returns {string} - The URL of the template image.
   */
  static getProductTemplateUrl(productType, productColor) {
    // Normalize inputs
    const type = (productType || "hoodie").toLowerCase().replace(/\s+/g, "-");
    const color = (productColor || "white").toLowerCase().replace(/\s+/g, "-");

    // Use environment variables or a config file for base URL and versions ideally
    const CLOUDINARY_BASE_URL =
      process.env.REACT_APP_CLOUDINARY_URL ||
      "https://res.cloudinary.com/dkot9tyjm/image/upload"; // Example

    // Define template paths (adjust structure as needed)
    const templatePaths = {
      hoodie: `v1728392918/hoodies/hoodie-${color}-front.png`, // Example version and path
      tshirt: `v1728393898/tshirts/tshirt-${color}-front.png`, // Example
      "long-sleeve": `v1728394665/longsleeves/longsleeve-${color}-front.png`, // Example
      // Add more types...
    };

    const path = templatePaths[type] || templatePaths.hoodie; // Default to hoodie if type unknown

    // Check if path includes version already, if not prepend default
    const versionRegex = /^v\d+\//;
    const finalPath = versionRegex.test(path) ? path : `v1728392918/${path}`; // Prepend default version if needed

    // Basic validation of the constructed path
    if (!finalPath.endsWith(".png") && !finalPath.endsWith(".jpg")) {
      // Check for expected extension
      console.warn(
        `Constructed template URL might be invalid: ${CLOUDINARY_BASE_URL}/${finalPath}`
      );
    }

    return `${CLOUDINARY_BASE_URL}/${finalPath}`;
  }

  /**
   * Generates a safe and informative filename for downloads.
   * @param {string} orderId - Order ID.
   * @param {string} itemId - Item ID (or use 'batch').
   * @param {string} extension - File extension (default 'zip').
   * @returns {string} - Generated filename.
   */
  static generateFileName(orderId, itemId, extension = "zip") {
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T-]/g, "");
    // Sanitize IDs - allow letters, numbers, underscore, hyphen
    const safeOrderId = (orderId || uuidv4())
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 24); // Limit length
    const safeItemId = (itemId || uuidv4())
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 24); // Limit length

    // Ensure filename isn't excessively long
    const baseName = `order_${safeOrderId}_item_${safeItemId}_${timestamp}`;
    return `${baseName.slice(0, 100)}.${extension}`; // Limit base name length
  }

  /**
   * Creates a product mockup by overlaying a design onto a template image.
   * @param {string} designImageUrl - URL of the design image.
   * @param {string} productType - Type of product (e.g., "hoodie").
   * @param {string} productColor - Color of the product (e.g., "white").
   * @param {object} designSpecs - Design placement specs ({ positionX, positionY, scale, rotation }).
   * @returns {Promise<Blob>} - A promise resolving to the mockup image Blob.
   */
  static async createProductMockup(
    designImageUrl,
    productType,
    productColor,
    designSpecs
  ) {
    let designBlobUrl = null;
    let templateBlobUrl = null;

    try {
      if (!designImageUrl)
        throw new ImageProcessingError("Design image URL is missing.");

      const templateUrl = this.getProductTemplateUrl(productType, productColor);

      console.log("Creating mockup with:", {
        designImageUrl,
        productType,
        productColor,
        templateUrl,
        designSpecs,
      });

      // Fetch both images as Blobs in parallel
      const [designBlob, templateBlob] = await Promise.all([
        this.fetchImageAsBlob(designImageUrl),
        this.fetchImageAsBlob(templateUrl), // Fetch template too to avoid CORS tainting canvas
      ]);

      // Create temporary Blob URLs to load into Image elements
      designBlobUrl = URL.createObjectURL(designBlob);
      templateBlobUrl = URL.createObjectURL(templateBlob);

      // Load images from Blob URLs
      const [designImg, productImg] = await Promise.all([
        // **FIX: Use Class name to call static method**
        DesignDownloader.loadImage(designBlobUrl),
        DesignDownloader.loadImage(templateBlobUrl),
      ]);

      console.log("Images loaded:", {
        designW: designImg.naturalWidth,
        designH: designImg.naturalHeight,
        productW: productImg.naturalWidth,
        productH: productImg.naturalHeight,
      });

      if (
        !productImg.naturalWidth ||
        !productImg.naturalHeight ||
        !designImg.naturalWidth ||
        !designImg.naturalHeight
      ) {
        throw new ImageProcessingError(
          "Failed to load image dimensions correctly."
        );
      }

      // Setup canvas
      const canvas = document.createElement("canvas");
      // Use template dimensions as base canvas size
      canvas.width = productImg.naturalWidth;
      canvas.height = productImg.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx)
        throw new ImageProcessingError("Failed to get 2D context from canvas.");

      // Draw product template first
      ctx.drawImage(productImg, 0, 0, canvas.width, canvas.height);

      // Apply design transformations based on percentages and scale/rotation
      const safeSpecs = designSpecs || {};
      const posX = safeSpecs.positionX ?? 50;
      const posY = safeSpecs.positionY ?? 50;
      const scale = Math.max(0.1, Math.min(safeSpecs.scale ?? 1, 5)); // Clamp scale
      const rotation = safeSpecs.rotation ?? 0;

      // Calculate design dimensions and placement
      const designDrawWidth = designImg.naturalWidth * scale;
      const designDrawHeight = designImg.naturalHeight * scale;

      // --- IMPORTANT: Adjust center based on PRODUCT type ---
      // The (posX, posY) likely refer to the center *relative to a print area*, not the whole image.
      // You need mapping/coordinates defining the print area bbox for each product type/template.
      // Example: Define printArea = { x: 200, y: 150, width: 400, height: 500 } for a hoodie template
      const printArea = {
        // FIXME: Replace with actual coordinates for each template
        x: canvas.width * 0.25,
        y: canvas.height * 0.2, // Example: Top-left of print area
        width: canvas.width * 0.5,
        height: canvas.height * 0.6, // Example: Size of print area
      };

      const centerPrintAreaX = printArea.x + (posX / 100) * printArea.width;
      const centerPrintAreaY = printArea.y + (posY / 100) * printArea.height;

      // Apply drawing operations
      ctx.save(); // Save context state
      ctx.translate(centerPrintAreaX, centerPrintAreaY); // Move origin to design center
      ctx.rotate((rotation * Math.PI) / 180); // Rotate around the new origin

      // Draw the design centered at the (translated and rotated) origin
      ctx.drawImage(
        designImg,
        -designDrawWidth / 2,
        -designDrawHeight / 2,
        designDrawWidth,
        designDrawHeight
      );
      ctx.restore(); // Restore context state

      // Convert canvas to Blob
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log("Mockup created successfully.");
              resolve(blob);
            } else {
              reject(
                new ImageProcessingError(
                  "Canvas toBlob failed to produce a blob."
                )
              );
            }
          },
          "image/png", // Output format
          0.92 // Quality (optional)
        );
      });
    } catch (error) {
      console.error("Mockup creation failed:", error);
      // Re-throw a standardized error
      throw error instanceof ImageProcessingError
        ? error
        : new ImageProcessingError(`Mockup generation error: ${error.message}`);
    } finally {
      // Cleanup temporary Blob URLs
      if (designBlobUrl) URL.revokeObjectURL(designBlobUrl);
      if (templateBlobUrl) URL.revokeObjectURL(templateBlobUrl);
    }
  }

  /**
   * Downloads a single design package (original design, mockup, metadata) as a ZIP file.
   * @param {object} designData - Object containing imageUrl, specs, productTitle, orderId, etc.
   *                           (Matches the structure returned by /download-design backend endpoint)
   * @returns {Promise<boolean>} - True if download initiated successfully.
   */
  static async downloadSingleDesign(designData) {
    const startTime = performance.now();

    try {
      console.log("Starting single design download with data:", designData);
      // Validate required input data
      if (!designData?.imageUrl) {
        throw new DesignDownloadError(
          "Missing design image URL in provided data."
        );
      }
      if (!designData?.specs?.type || !designData?.specs?.color) {
        console.warn(
          "Design data missing product type or color, using defaults for mockup."
        );
      }

      const zip = new JSZip();

      // Prepare metadata (using provided data or defaults)
      const orderId = designData.orderId || uuidv4();
      const itemId = designData.itemId || uuidv4().slice(0, 8);
      const productType = designData.specs?.type || "hoodie";
      const productColor = designData.specs?.color || "white";
      const productSize = designData.specs?.size || "One Size";
      const designSpecs = designData.specs?.position || {
        positionX: 50,
        positionY: 50,
        scale: 1,
        rotation: 0,
      };
      const productTitle = designData.productTitle || "Untitled Design";

      const metadata = {
        downloadedAt: new Date().toISOString(),
        generatorVersion: "1.1", // Increment version if structure changes
        order: {
          id: orderId,
          item_id: itemId,
          order_number: designData.orderNumber || orderId.slice(0, 8),
          price_info: designData.price || {},
        },
        product: {
          title: productTitle,
          type: productType,
          color: productColor,
          size: productSize,
        },
        design: {
          original_url: designData.imageUrl,
          specifications: designSpecs,
        },
        customer: designData.customer || {}, // Include customer if provided
      };

      // Add metadata file to ZIP
      zip.file("metadata.json", JSON.stringify(metadata, null, 2));

      // Fetch assets in parallel
      console.log("Fetching assets...");
      const assets = await Promise.allSettled([
        this.fetchImageAsBlob(designData.imageUrl),
        this.createProductMockup(
          designData.imageUrl,
          productType,
          productColor,
          designSpecs
        ),
      ]);

      const designBlobResult = assets[0];
      const mockupBlobResult = assets[1];

      // Handle design fetching result
      if (designBlobResult.status === "fulfilled" && designBlobResult.value) {
        console.log("Original design fetched.");
        zip.file("original_design.png", designBlobResult.value);
      } else {
        console.error(
          "Failed to fetch original design:",
          designBlobResult.reason
        );
        // Decide if download should fail entirely without original design
        throw new DesignDownloadError(
          `Failed to fetch original design: ${
            designBlobResult.reason?.message || "Unknown error"
          }`
        );
      }

      // Handle mockup creation result (optional failure)
      if (mockupBlobResult.status === "fulfilled" && mockupBlobResult.value) {
        console.log("Product mockup created.");
        zip.file("product_mockup.png", mockupBlobResult.value);
      } else {
        console.warn(
          "Failed to create product mockup:",
          mockupBlobResult.reason
        );
        // Add a placeholder or error note to the zip instead of failing?
        zip.file(
          "MOCKUP_FAILED.txt",
          `Mockup generation failed:\n${
            mockupBlobResult.reason?.message || "Unknown error"
          }`
        );
      }

      // Generate the final ZIP file
      console.log("Generating ZIP file...");
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }, // Level 6 is good balance
        comment: `Design package generated on ${new Date().toISOString()}`,
      });

      // Initiate download using FileSaver.js
      saveAs(zipBlob, this.generateFileName(orderId, itemId, "zip"));

      const duration = performance.now() - startTime;
      console.log(
        `Design package download initiated successfully in ${duration.toFixed(
          0
        )}ms.`
      );
      return true; // Indicate success
    } catch (error) {
      console.error("Design package download failed:", error);
      // Re-throw standardized error for handling in UI/action
      throw error instanceof DesignDownloadError
        ? error
        : new DesignDownloadError(
            `Failed to create or download design package: ${error.message}`
          );
    }
    // No finally block needed as JSZip doesn't hold external resources needing explicit cleanup here
  }

  /**
   * Downloads design packages for ALL items in an order as a single batch ZIP.
   * @param {object} order - The full order object containing the cart.
   * @returns {Promise<boolean>} - True if download initiated successfully.
   */
  static async downloadAllDesigns(order) {
    const startTime = performance.now();
    const transactionId = uuidv4(); // Unique ID for this batch operation

    try {
      if (!order || !Array.isArray(order.cart) || order.cart.length === 0) {
        throw new DesignDownloadError("Order contains no items to download.");
      }

      console.log(
        `Starting batch download for order ${order._id}, ${order.cart.length} items.`
      );

      const mainZip = new JSZip();
      const designsFolder = mainZip.folder("order_items"); // Create a subfolder for items
      const errors = []; // To collect errors for individual items

      // Process items - Consider limiting concurrency if many items
      // Using Promise.all for simplicity here, could use a library like 'p-limit' for true concurrency control
      await Promise.all(
        order.cart.map(async (item, index) => {
          const itemId = item._id?.toString() || `item_${index}`;
          try {
            // Use downloadSingleDesign logic internally but generate blob instead of saving
            const itemZip = new JSZip();

            const designUrl = item.designImage?.url || item.designImage;
            if (!designUrl) {
              throw new DesignDownloadError("Missing design image URL.");
            }

            const productType = item.ProductType || "hoodie";
            const productColor = item.ProductColor || "white";
            const designSpecs = item.designSpecs || {};

            // Prepare metadata specific to this item
            const itemMetadata = {
              itemIndex: index,
              itemId: itemId,
              productTitle: item.DesignTitle || "Untitled",
              productType: productType,
              productColor: productColor,
              productSize: item.size || "One Size",
              designSpecs: designSpecs,
              unitPrice: item.price || 0,
              quantity: item.qty || 1,
            };
            itemZip.file(
              "item_metadata.json",
              JSON.stringify(itemMetadata, null, 2)
            );

            // Fetch assets
            const assets = await Promise.allSettled([
              this.fetchImageAsBlob(designUrl),
              this.createProductMockup(
                designUrl,
                productType,
                productColor,
                designSpecs
              ),
            ]);

            // Add design
            if (assets[0].status === "fulfilled" && assets[0].value) {
              itemZip.file("original_design.png", assets[0].value);
            } else {
              throw new DesignDownloadError(
                `Failed to fetch original design: ${assets[0].reason?.message}`
              );
            }

            // Add mockup (optional fail)
            if (assets[1].status === "fulfilled" && assets[1].value) {
              itemZip.file("product_mockup.png", assets[1].value);
            } else {
              console.warn(
                `Mockup failed for item ${itemId}:`,
                assets[1].reason
              );
              itemZip.file(
                "MOCKUP_FAILED.txt",
                `Mockup generation failed:\n${
                  assets[1].reason?.message || "Unknown error"
                }`
              );
            }

            // Generate item ZIP blob
            const itemZipBlob = await itemZip.generateAsync({
              type: "blob",
              compression: "DEFLATE",
              compressionOptions: { level: 1 },
            }); // Faster compression for item zips

            // Add item zip to main zip folder
            designsFolder.file(
              this.generateFileName(order._id, itemId, "zip"),
              itemZipBlob
            );
            console.log(
              `Processed item ${index + 1}/${order.cart.length} successfully.`
            );
          } catch (itemError) {
            console.error(
              `Processing failed for item ${itemId} (index ${index}):`,
              itemError
            );
            errors.push(
              `Item ${index + 1} (${item.DesignTitle || "Untitled"}): ${
                itemError.message
              }`
            );
            // Add error file to main zip for this item
            designsFolder.file(
              `ITEM_${index + 1}_ERROR.txt`,
              `Failed to process item:\n${itemError.message}`
            );
          }
        }) // End map
      ); // End Promise.all

      // Add overall order summary and error log to main ZIP
      const orderSummary = {
        orderId: order._id.toString(),
        orderNumber: order._id.toString().slice(0, 8),
        orderDate: order.createdAt,
        totalPrice: order.totalPrice,
        totalItems: order.cart.length,
        itemsSuccessfullyProcessed: order.cart.length - errors.length,
        itemsFailed: errors.length,
        downloadTransactionId: transactionId,
        downloadedAt: new Date().toISOString(),
      };
      mainZip.file("order_summary.json", JSON.stringify(orderSummary, null, 2));

      if (errors.length > 0) {
        mainZip.file("PROCESSING_ERRORS.txt", errors.join("\n\n"));
      }

      // Generate the final main ZIP file
      console.log("Generating final batch ZIP file...");
      const mainZipBlob = await mainZip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      // Initiate download
      saveAs(mainZipBlob, this.generateFileName(order._id, "batch", "zip"));

      const duration = performance.now() - startTime;
      console.log(
        `Batch download initiated (${order.cart.length - errors.length}/${
          order.cart.length
        } items OK) in ${duration.toFixed(0)}ms.`
      );
      if (errors.length > 0) {
        // Maybe show a non-blocking warning toast?
        // toast.warn(`Batch download complete, but ${errors.length} items had processing errors.`);
      }

      return true;
    } catch (error) {
      console.error("Batch design download failed:", error);
      throw error instanceof DesignDownloadError
        ? error
        : new DesignDownloadError(
            `Failed to download order designs: ${error.message}`
          );
    }
  }
}
