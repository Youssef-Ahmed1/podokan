import JSZip from "jszip";
import { saveAs } from "file-saver";
import axios from "axios";
import { v4 as uuidv4 } from "uuid"; // For unique fallback IDs

// --- Configuration ---
// ** IMPORTANT: Ensure this environment variable is set in your frontend build process **
//    (e.g., in a .env file: REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name)
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;

if (!CLOUDINARY_CLOUD_NAME) {
  console.error(
    "CRITICAL CONFIG ERROR: REACT_APP_CLOUDINARY_CLOUD_NAME environment variable is not set! Image templates will fail to load."
  );
  // Optionally throw an error or provide a fallback, but functionality will be broken.
  // throw new Error("Cloudinary configuration missing.");
}

const BASE_CLOUDINARY_URL = `https://res.cloudinary.com/${
  CLOUDINARY_CLOUD_NAME || "YOUR_CLOUD_NAME_PLACEHOLDER"
}/image/upload`;

// Mapping product types (lowercase, hyphenated) to Cloudinary folder names
// ** ADJUST THESE TO MATCH YOUR CLOUDINARY FOLDER STRUCTURE **
const TEMPLATE_FOLDERS = {
  hoodie: "podokan/templates/hoodies", // Example path
  "t-shirt": "podokan/templates/t-shirts", // Example path
  "long-sleeve": "podokan/templates/long-sleeves", // Example path
  // Add other product types here
};

// Helper to get filename prefix (e.g., "long-sleeve" -> "longsleeve")
// ** ADJUST IF YOUR FILENAMES DIFFER **
const getTemplateFilenamePrefix = (typeKey) => {
  if (typeKey === "long-sleeve") return "longsleeve";
  return typeKey; // Default: use the type key directly
};

// --- Custom Error Classes ---
class DesignDownloadError extends Error {
  constructor(message, code = "DESIGN_DOWNLOAD_FAILED", details = {}) {
    super(message);
    this.name = "DesignDownloadError";
    this.code = code; // e.g., 'FETCH_FAILED', 'PROCESSING_ERROR', 'MISSING_DATA'
    this.details = details; // Any additional context
  }
}

class ImageProcessingError extends DesignDownloadError {
  constructor(message, httpStatus = null, failedUrl = null) {
    super(message, "IMAGE_PROCESSING_ERROR", { httpStatus, failedUrl });
    this.status = httpStatus; // Store HTTP status if applicable
    this.url = failedUrl; // Store the URL that failed
  }
}

// --- DesignDownloader Class ---
export class DesignDownloader {
  /**
   * Fetches an image from a URL as a Blob.
   * @param {string} url - The URL of the image to fetch.
   * @returns {Promise<Blob>} - A promise resolving to the image Blob.
   * @throws {ImageProcessingError} - If fetch fails or response is invalid.
   */
  static async fetchImageAsBlob(url) {
    if (!url || typeof url !== "string") {
      throw new ImageProcessingError("Invalid image URL provided.", null, url);
    }

    try {
      const response = await axios({
        url,
        method: "GET",
        responseType: "blob", // Crucial for getting binary data
        headers: {
          // Try to bypass caches for freshest image
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
        timeout: 45000, // Increased timeout for potentially large images
        // Ensure only 2xx status codes are considered successful
        validateStatus: (status) => status >= 200 && status < 300,
        // Don't send cookies when fetching external images (usually not needed)
        withCredentials: false,
      });

      // Validate response data type
      if (!(response.data instanceof Blob)) {
        throw new ImageProcessingError(
          "Invalid response received from image server: expected a Blob.",
          response.status,
          url
        );
      }

      // Create a new Blob with the correct MIME type from headers
      return new Blob([response.data], {
        type: response.headers["content-type"] || "image/png", // Default to png if type missing
      });
    } catch (error) {
      let errMsg = `Image fetch failed: ${error.message}`;
      let status = error.response?.status;

      if (axios.isCancel(error)) errMsg = "Image fetch request was cancelled.";
      else if (error.code === "ECONNABORTED") errMsg = "Image fetch timed out.";
      else if (error.response)
        errMsg = `Image fetch failed (Status ${status}): ${error.message}`;

      console.error(
        `fetchImageAsBlob Error (${url}):`,
        errMsg,
        "\nFull Error:",
        error
      );
      throw new ImageProcessingError(errMsg, status, url); // Re-throw specific error
    }
  }

  /**
   * Loads an image source (URL or Blob) into an HTMLImageElement.
   * @param {string | Blob} imageSource - The URL string or Blob object.
   * @returns {Promise<HTMLImageElement>} - A promise resolving to the loaded Image object.
   * @throws {ImageProcessingError} - If loading fails or source is invalid.
   */
  static loadImage(imageSource) {
    return new Promise((resolve, reject) => {
      if (!imageSource) {
        return reject(
          new ImageProcessingError("Cannot load image: source is missing.")
        );
      }

      const image = new Image();
      image.crossOrigin = "anonymous"; // Necessary for canvas operations with external images
      let objectUrl = null; // To store Blob URL if created

      image.onload = () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl); // Clean up Blob URL
        // Check for invalid image dimensions after load
        if (image.naturalWidth === 0 || image.naturalHeight === 0) {
          reject(
            new ImageProcessingError(
              `Image loaded successfully but has invalid dimensions (0x0).`,
              null,
              typeof imageSource === "string" ? imageSource : "Blob Source"
            )
          );
        } else {
          resolve(image); // Resolve with the loaded image object
        }
      };

      image.onerror = (errorEvent) => {
        if (objectUrl) URL.revokeObjectURL(objectUrl); // Clean up Blob URL
        console.error("Image load error:", errorEvent);
        reject(
          new ImageProcessingError(
            `Failed to load the image resource. Check network and URL/Blob validity.`,
            null,
            typeof imageSource === "string" ? imageSource : "Blob Source"
          )
        );
      };

      // Set the source based on type
      if (imageSource instanceof Blob) {
        objectUrl = URL.createObjectURL(imageSource); // Create temporary URL for Blob
        image.src = objectUrl;
      } else if (typeof imageSource === "string") {
        image.src = imageSource; // Use URL directly
      } else {
        reject(
          new ImageProcessingError(
            "Invalid image source type provided (must be URL string or Blob)."
          )
        );
      }
    });
  }

  /**
   * Constructs the Cloudinary URL for a product template image.
   * @param {string} productType - e.g., "T-Shirt", "Hoodie".
   * @param {string} productColor - e.g., "White", "Black".
   * @returns {string} - The full Cloudinary URL.
   * @throws {Error} - If configuration for the product type is missing.
   */
  static getProductTemplateUrl(productType, productColor) {
    if (!productType || !productColor) {
      throw new Error(
        "Product type and color are required to get template URL."
      );
    }
    // Normalize keys (lowercase, hyphenated)
    const typeKey = productType.toLowerCase().replace(/\s+/g, "-");
    const colorKey = productColor.toLowerCase().replace(/\s+/g, "-");

    const folder = TEMPLATE_FOLDERS[typeKey];
    if (!folder) {
      throw new Error(
        `Template configuration error: No template folder defined for product type '${typeKey}'. Check TEMPLATE_FOLDERS map.`
      );
    }

    const filenamePrefix = getTemplateFilenamePrefix(typeKey);
    // ** ADJUST FILENAME FORMAT IF NEEDED (e.g., front/back, .jpg/.png) **
    const fileName = `${filenamePrefix}-${colorKey}-front.png`; // Assuming front view PNG

    return `${BASE_CLOUDINARY_URL}/${folder}/${fileName}`;
  }

  /**
   * Generates a standardized filename for download packages.
   * @param {string} prefix - e.g., "design", "mockup", "batch_order".
   * @param {string} orderId - The order ID.
   * @param {string} itemId - The item ID or "all_items".
   * @param {string} [extension="zip"] - File extension.
   * @returns {string} - The generated filename.
   */
  static generateFileName(prefix, orderId, itemId, extension = "zip") {
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T-]/g, ""); // YYYYMMDDHHMMSS
    // Sanitize IDs to be filesystem-safe
    const safeOrderId = (orderId || uuidv4())
      .toString()
      .replace(/[^a-z0-9_.-]/gi, "_");
    const safeItemId = (itemId || uuidv4())
      .toString()
      .replace(/[^a-z0-9_.-]/gi, "_");
    return `${prefix}_${safeOrderId}_${safeItemId}_${timestamp}.${extension}`;
  }

  /**
   * Creates a product mockup by overlaying a design onto a template image.
   * @param {string} designImageUrl - URL of the customer's design.
   * @param {string} productType - Type of the product (e.g., "T-Shirt").
   * @param {string} productColor - Color of the product (e.g., "White").
   * @param {object} designSpecs - Positioning, scale, rotation { positionX, positionY, scale, rotation }.
   * @returns {Promise<Blob>} - A promise resolving to the mockup image Blob (PNG).
   * @throws {ImageProcessingError} - If any step fails.
   */
  static async createProductMockup(
    designImageUrl,
    productType,
    productColor,
    designSpecs
  ) {
    // --- Validate Input ---
    if (
      !designImageUrl ||
      !productType ||
      !productColor ||
      designSpecs?.positionX == null ||
      designSpecs?.positionY == null
    ) {
      throw new ImageProcessingError(
        "Missing required parameters for mockup generation."
      );
    }
    // Use defaults for scale/rotation if missing
    const scale = designSpecs.scale ?? 1;
    const rotation = designSpecs.rotation ?? 0;
    const posX = designSpecs.positionX; // Already checked non-null
    const posY = designSpecs.positionY; // Already checked non-null

    let templateImageUrl;
    try {
      templateImageUrl = DesignDownloader.getProductTemplateUrl(
        productType,
        productColor
      );
    } catch (e) {
      // Wrap config error in ImageProcessingError
      throw new ImageProcessingError(
        `Template URL generation failed: ${e.message}`
      );
    }

    try {
      // --- Fetch and Load Images Concurrently ---
      const [designBlob, templateBlob] = await Promise.all([
        DesignDownloader.fetchImageAsBlob(designImageUrl),
        DesignDownloader.fetchImageAsBlob(templateImageUrl),
      ]);
      const [designImage, templateImage] = await Promise.all([
        DesignDownloader.loadImage(designBlob),
        DesignDownloader.loadImage(templateBlob),
      ]);

      // --- Setup Canvas ---
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new ImageProcessingError(
          "Could not get 2D rendering context for canvas."
        );
      }

      // Set canvas size to template size
      canvas.width = templateImage.naturalWidth;
      canvas.height = templateImage.naturalHeight;
      if (canvas.width === 0 || canvas.height === 0) {
        throw new ImageProcessingError(
          "Template image has zero dimensions.",
          null,
          templateImageUrl
        );
      }

      // --- Draw Template ---
      ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);

      // --- Calculate Design Placement ---
      // ** CRITICAL ADJUSTMENT AREA: Define the printable area on your templates **
      //    These ratios (relative to canvas width/height) define the box where the design can be placed.
      //    Measure these on your actual template images.
      const printableArea = {
        xRatio: 0.3, // Example: Starts 30% from the left edge
        yRatio: 0.2, // Example: Starts 20% from the top edge
        widthRatio: 0.4, // Example: Width is 40% of the canvas width
        heightRatio: 0.5, // Example: Height is 50% of the canvas height
      };
      const areaX = canvas.width * printableArea.xRatio;
      const areaY = canvas.height * printableArea.yRatio;
      const areaW = canvas.width * printableArea.widthRatio;
      const areaH = canvas.height * printableArea.heightRatio;

      // Calculate scaled design dimensions, maintaining aspect ratio, fitting within area bounds
      let designRenderWidth = areaW * scale;
      let designRenderHeight =
        (designImage.naturalHeight / designImage.naturalWidth) *
        designRenderWidth;

      // If scaled height exceeds printable area height, recalculate width based on height constraint
      if (designRenderHeight > areaH * scale) {
        designRenderHeight = areaH * scale;
        designRenderWidth =
          (designImage.naturalWidth / designImage.naturalHeight) *
          designRenderHeight;
      }

      // Prevent drawing if dimensions are invalid
      if (designRenderWidth <= 0 || designRenderHeight <= 0) {
        console.warn(
          "Calculated design dimensions for mockup are zero or negative. Skipping design draw."
        );
        // Return canvas with just the template
        return new Promise((resolve, reject) => {
          canvas.toBlob(
            (blob) =>
              blob
                ? resolve(blob)
                : reject(new ImageProcessingError("Canvas toBlob failed.")),
            "image/png"
          );
        });
      }

      // Calculate center point for drawing based on percentage position within the area
      const drawCenterX = areaX + (posX / 100) * areaW;
      const drawCenterY = areaY + (posY / 100) * areaH;

      // --- Draw Design with Transformations ---
      ctx.save(); // Save current context state
      ctx.translate(drawCenterX, drawCenterY); // Move origin to the calculated center
      ctx.rotate((rotation * Math.PI) / 180); // Apply rotation (convert degrees to radians)
      // Draw the design centered on the new origin
      ctx.drawImage(
        designImage,
        -designRenderWidth / 2,
        -designRenderHeight / 2,
        designRenderWidth,
        designRenderHeight
      );
      ctx.restore(); // Restore previous context state

      // --- Export Canvas to Blob ---
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            // Callback function
            if (blob) {
              resolve(blob); // Resolve promise with the PNG Blob
            } else {
              reject(
                new ImageProcessingError("Canvas toBlob conversion failed.")
              );
            }
          },
          "image/png", // Specify PNG format
          0.95 // Optional: Image quality (0 to 1)
        );
      });
    } catch (error) {
      console.error("Mockup creation failed:", error);
      // Re-throw specific errors or wrap generic ones
      throw error instanceof DesignDownloadError
        ? error
        : new ImageProcessingError(
            `Mockup generation failed: ${error.message}`
          );
    }
  }

  /**
   * Downloads a single design package (design, mockup, metadata) as a ZIP file.
   * @param {object} designData - Object containing imageUrl, orderId, itemId, specs, etc.
   * @returns {Promise<boolean>} - True if download initiated successfully.
   * @throws {DesignDownloadError} - If validation or processing fails.
   */
  static async downloadSingleDesign(designData) {
    // --- Validate Input Data ---
    const requiredFields = [
      "imageUrl",
      "orderId",
      "itemId",
      "specs.type",
      "specs.color",
      "specs.size",
      "specs.position",
    ];
    for (const field of requiredFields) {
      // Helper to check nested properties
      const checkNested = (obj, path) =>
        path.split(".").reduce((o, k) => o?.[k], obj);
      if (checkNested(designData, field) == null) {
        // Check for null or undefined
        throw new DesignDownloadError(
          `Missing required field '${field}' in designData for download.`
        );
      }
    }

    const zip = new JSZip();
    const {
      imageUrl,
      orderId,
      itemId,
      orderNumber,
      productTitle,
      specs,
      price,
    } = designData;

    try {
      // --- Add Metadata ---
      const metadata = {
        downloadedAt: new Date().toISOString(),
        order: {
          id: orderId,
          number: orderNumber || orderId.slice(-8),
          item: itemId,
        },
        product: {
          title: productTitle || "Untitled",
          type: specs.type,
          color: specs.color,
          size: specs.size,
        },
        design: { sourceUrl: imageUrl, specifications: specs.position },
        pricing: price || {}, // Include pricing info if available
      };
      zip.file("metadata.json", JSON.stringify(metadata, null, 2)); // Pretty-printed JSON

      // --- Fetch Design and Generate Mockup Concurrently ---
      // Use Promise.allSettled to handle potential failures in one part without stopping the whole process
      const results = await Promise.allSettled([
        DesignDownloader.fetchImageAsBlob(imageUrl).catch((e) => {
          console.error(`Failed to fetch original design (${imageUrl}):`, e);
          throw new DesignDownloadError(
            `Failed to fetch original design: ${e.message}`,
            "FETCH_DESIGN_FAILED"
          );
        }),
        DesignDownloader.createProductMockup(
          imageUrl,
          specs.type,
          specs.color,
          specs.position
        ).catch((e) => {
          console.error(`Failed to generate mockup for item ${itemId}:`, e);
          // Don't throw here, instead add an error file to the zip
          return { error: `Mockup generation failed: ${e.message}` }; // Return error object
        }),
      ]);

      const designResult = results[0];
      const mockupResult = results[1];

      // Add Original Design (if successful)
      if (designResult.status === "fulfilled") {
        zip.file("original_design.png", designResult.value);
      } else {
        // Add error file if design fetch failed
        zip.file(
          "ERROR_fetching_design.txt",
          `Failed to fetch original design:\n${
            designResult.reason?.message || "Unknown fetch error"
          }`
        );
      }

      // Add Mockup (if successful) or Error File
      if (
        mockupResult.status === "fulfilled" &&
        mockupResult.value &&
        !mockupResult.value.error
      ) {
        zip.file("product_mockup.png", mockupResult.value);
      } else {
        const errorMsg =
          mockupResult.status === "rejected"
            ? mockupResult.reason?.message || "Unknown mockup error"
            : mockupResult.value?.error || "Unknown mockup error"; // Handle error object case
        zip.file(
          "ERROR_generating_mockup.txt",
          `Failed to generate mockup:\n${errorMsg}`
        );
      }

      // --- Generate and Save ZIP ---
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }, // Balance between speed and size
      });

      saveAs(
        zipBlob,
        DesignDownloader.generateFileName("design_pkg", orderId, itemId)
      ); // Trigger browser download

      return true; // Indicate success
    } catch (error) {
      console.error("Single design package creation error:", error);
      // Re-throw specific or wrapped error
      throw error instanceof DesignDownloadError
        ? error
        : new DesignDownloadError(`Package creation failed: ${error.message}`);
    }
  }

  /**
   * Downloads all design packages for a given order as a single batch ZIP.
   * @param {object} orderData - The full order object containing the cart array.
   * @returns {Promise<boolean>} - True if download initiated.
   * @throws {DesignDownloadError} - If validation or processing fails.
   */
  static async downloadAllDesigns(orderData) {
    // --- Validate Input ---
    if (
      !orderData?._id ||
      !Array.isArray(orderData.cart) ||
      orderData.cart.length === 0
    ) {
      throw new DesignDownloadError(
        "Invalid or empty order data provided for batch download."
      );
    }

    const mainZip = new JSZip();
    const itemsFolder = mainZip.folder("order_items"); // Create a subfolder for items
    const totalItems = orderData.cart.length;
    const processingPromises = [];
    const failures = [];
    let successCount = 0;

    console.log(
      `Starting batch download for order ${orderData._id} with ${totalItems} items.`
    );

    // --- Process Each Item ---
    orderData.cart.forEach((item, index) => {
      const itemIndex = index + 1; // 1-based index for filename/reporting
      const itemId = item._id || `item_${itemIndex}`; // Use actual ID or fallback

      // Create a promise for each item's processing
      const itemPromise = (async () => {
        const itemZip = new JSZip(); // Zip for this individual item
        try {
          // Validate item data
          const imageUrl = item.designImage?.url;
          if (!imageUrl)
            throw new DesignDownloadError(
              "Missing design image URL.",
              "MISSING_URL"
            );

          const specs = {
            type: item.ProductType || "N/A",
            color: item.ProductColor || "N/A",
            size: item.size || "N/A",
            position: item.designSpecs || {
              positionX: 50,
              positionY: 50,
              scale: 1,
              rotation: 0,
            },
          };

          // Add item details JSON
          itemZip.file(
            "details.json",
            JSON.stringify(
              {
                itemId,
                index: itemIndex,
                designTitle: item.DesignTitle || "Untitled",
                specs,
                qty: item.qty,
                price: item.price,
                sourceImageUrl: imageUrl,
              },
              null,
              1
            )
          );

          // Fetch design and generate mockup concurrently
          const itemResults = await Promise.allSettled([
            DesignDownloader.fetchImageAsBlob(imageUrl),
            DesignDownloader.createProductMockup(
              imageUrl,
              specs.type,
              specs.color,
              specs.position
            ),
          ]);

          const designResult = itemResults[0];
          const mockupResult = itemResults[1];

          // Add design or error
          if (designResult.status === "fulfilled") {
            itemZip.file("design.png", designResult.value);
          } else {
            itemZip.file(
              "ERROR_design.txt",
              `Fetch failed:\n${designResult.reason?.message || "Unknown"}`
            );
            throw new DesignDownloadError(
              `Design fetch failed for item ${itemIndex}`,
              "FETCH_FAILED",
              { reason: designResult.reason }
            );
          }

          // Add mockup or error
          if (mockupResult.status === "fulfilled") {
            itemZip.file("mockup.png", mockupResult.value);
          } else {
            itemZip.file(
              "ERROR_mockup.txt",
              `Mockup failed:\n${mockupResult.reason?.message || "Unknown"}`
            );
            // Decide if mockup failure should fail the whole item package? Let's allow it to proceed but log failure.
            console.warn(
              `Mockup failed for item ${itemIndex}, but continuing.`
            );
            failures.push({
              itemId,
              index: itemIndex,
              reason: `Mockup Generation Failed: ${mockupResult.reason?.message}`,
            });
          }

          // Generate the individual item's zip blob
          const itemZipBlob = await itemZip.generateAsync({
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 1 },
          }); // Faster compression for items

          // Add the item's zip to the main zip's folder
          itemsFolder.file(`item_${itemIndex}_${itemId}.zip`, itemZipBlob);
          successCount++; // Increment success count for this item
        } catch (error) {
          // Catch errors during this item's processing
          console.error(
            `Failed to process item ${itemIndex} (ID: ${itemId}):`,
            error
          );
          const reason =
            error instanceof DesignDownloadError
              ? `${error.code}: ${error.message}`
              : error.message;
          failures.push({ itemId, index: itemIndex, reason });
          // Add an error file to the main zip for this item
          itemsFolder.file(
            `item_${itemIndex}_${itemId}_ERROR.txt`,
            `Processing Failed: ${reason}\n${error.stack || ""}`
          );
        }
      })(); // Immediately invoke the async function

      processingPromises.push(itemPromise);
    });

    // --- Wait for all items to be processed ---
    await Promise.all(processingPromises);

    console.log(
      `Batch processing finished. Success: ${successCount}, Failures: ${failures.length}`
    );

    // --- Add Summary File ---
    const summary = {
      batchDownloadedAt: new Date().toISOString(),
      order: { id: orderData._id, totalItems },
      summary: { successes: successCount, failures: failures.length },
      failedItems: failures, // List details of failed items
    };
    mainZip.file("batch_summary.json", JSON.stringify(summary, null, 2));

    // --- Generate Final Batch ZIP ---
    const mainZipBlob = await mainZip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }, // Better compression for final zip
    });

    // --- Trigger Download ---
    saveAs(
      mainZipBlob,
      DesignDownloader.generateFileName(
        "batch_order",
        orderData._id,
        "all_items"
      )
    );

    if (failures.length > 0) {
      toast.warn(
        `Batch download completed, but ${failures.length} item(s) failed. Check 'batch_summary.json' and error files inside the ZIP.`
      );
    } else {
      toast.success(
        `Batch download for order ${orderData._id.slice(
          -8
        )} initiated successfully!`
      );
    }

    return true;
  }
}