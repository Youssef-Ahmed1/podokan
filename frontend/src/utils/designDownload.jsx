import JSZip from "jszip";
import { saveAs } from "file-saver";
import axios from "axios";
import { v4 as uuidv4 } from "uuid"; // For unique fallback IDs
import { toast } from "react-toastify";
// --- Configuration ---
// ** Access Cloudinary Name from Frontend Environment Variable **
//    Ensure you have REACT_APP_CLOUDINARY_NAME=dkot9tyjm in your .env file for React
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_NAME;

if (!CLOUDINARY_CLOUD_NAME) {
  console.error(
    "CRITICAL CONFIG ERROR: REACT_APP_CLOUDINARY_CLOUD_NAME environment variable is not set! Image templates will fail to load."
  );
  toast.error(
    "Application Configuration Error: Cannot load image templates. Please contact support.",
    { autoClose: false }
  );
  // throw new Error("Cloudinary configuration missing."); // Optionally throw to halt execution
}

// Base URL construction using the cloud name
const BASE_CLOUDINARY_URL = `https://res.cloudinary.com/${
  CLOUDINARY_CLOUD_NAME || "YOUR_CLOUD_NAME_PLACEHOLDER"
}/image/upload`;

// Mapping product types (lowercase, hyphenated) to Cloudinary folder names
// ** Updated based on your provided URLs **
const TEMPLATE_FOLDERS = {
  hoodie: "hoodies",
  "t-shirt": "t-shirts",
  "long-sleeve": "long-sleeves",
  // Add other product types and their corresponding Cloudinary folder names here
};

// Helper to get the correct filename prefix for the template file
// ** Updated based on your provided URLs and standardization **
const getTemplateFilenamePrefix = (typeKey) => {
  switch (typeKey) {
    case "hoodie":
      return "hoodie";
    case "t-shirt":
      return "t-shirt";
    case "long-sleeve":
      return "longsleeves"; // Standardizing to 'longsleeves' based on some filenames
    default:
      return typeKey; // Fallback to the type key itself
  }
};

// --- Custom Error Classes --- (Keep as they are)
class DesignDownloadError extends Error {
  constructor(message, code = "DESIGN_DOWNLOAD_FAILED", details = {}) {
    super(message);
    this.name = "DesignDownloadError";
    this.code = code;
    this.details = details;
  }
}
class ImageProcessingError extends DesignDownloadError {
  constructor(message, httpStatus = null, failedUrl = null) {
    super(message, "IMAGE_PROCESSING_ERROR", { httpStatus, failedUrl });
    this.status = httpStatus;
    this.url = failedUrl;
  }
}

// --- DesignDownloader Class ---
export class DesignDownloader {
  static async fetchImageAsBlob(url) {
    if (!url || typeof url !== "string") {
      throw new ImageProcessingError("Invalid image URL provided.", null, url);
    }
    try {
      const response = await axios({
        url,
        method: "GET",
        responseType: "blob",
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
        timeout: 45000,
        validateStatus: (status) => status >= 200 && status < 300,
        withCredentials: false,
      });
      if (!(response.data instanceof Blob)) {
        throw new ImageProcessingError(
          "Invalid response received from image server: expected a Blob.",
          response.status,
          url
        );
      }
      return new Blob([response.data], {
        type: response.headers["content-type"] || "image/png",
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
      throw new ImageProcessingError(errMsg, status, url);
    }
  }

  static loadImage(imageSource) {
    return new Promise((resolve, reject) => {
      if (!imageSource) {
        return reject(
          new ImageProcessingError("Cannot load image: source is missing.")
        );
      }
      const image = new Image();
      image.crossOrigin = "anonymous";
      let objectUrl = null;
      image.onload = () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        if (image.naturalWidth === 0 || image.naturalHeight === 0) {
          reject(
            new ImageProcessingError(
              `Image loaded successfully but has invalid dimensions (0x0).`,
              null,
              typeof imageSource === "string" ? imageSource : "Blob Source"
            )
          );
        } else {
          resolve(image);
        }
      };
      image.onerror = (errorEvent) => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        console.error("Image load error:", errorEvent);
        reject(
          new ImageProcessingError(
            `Failed to load the image resource. Check network and URL/Blob validity.`,
            null,
            typeof imageSource === "string" ? imageSource : "Blob Source"
          )
        );
      };
      if (imageSource instanceof Blob) {
        objectUrl = URL.createObjectURL(imageSource);
        image.src = objectUrl;
      } else if (typeof imageSource === "string") {
        image.src = imageSource;
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
   * Constructs the Cloudinary URL for a product template image (FRONT view only).
   * @param {string} productType - e.g., "T-Shirt", "Hoodie".
   * @param {string} productColor - e.g., "White", "Black".
   * @returns {string} - The full Cloudinary URL for the front template.
   * @throws {Error} - If configuration for the product type is missing or template cannot be formed.
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
    // ** Construct filename for FRONT view only **
    const fileName = `${filenamePrefix}-${colorKey}-front.png`;

    // Construct the full URL (without version number for simplicity, Cloudinary handles it)
    const templateUrl = `${BASE_CLOUDINARY_URL}/${folder}/${fileName}`;
    // console.log(`Generated template URL for ${productType} ${productColor}: ${templateUrl}`);
    return templateUrl;
  }

  static generateFileName(prefix, orderId, itemId, extension = "zip") {
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T-]/g, "");
    const safeOrderId = (orderId || uuidv4())
      .toString()
      .replace(/[^a-z0-9_.-]/gi, "_");
    const safeItemId = (itemId || uuidv4())
      .toString()
      .replace(/[^a-z0-9_.-]/gi, "_");
    return `${prefix}_${safeOrderId}_${safeItemId}_${timestamp}.${extension}`;
  }

  static async createProductMockup(
    designImageUrl,
    productType,
    productColor,
    designSpecs
  ) {
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
    const scale = designSpecs.scale ?? 1;
    const rotation = designSpecs.rotation ?? 0;
    const posX = designSpecs.positionX;
    const posY = designSpecs.positionY;

    let templateImageUrl;
    try {
      // Get the URL for the FRONT template
      templateImageUrl = DesignDownloader.getProductTemplateUrl(
        productType,
        productColor
      );
    } catch (e) {
      throw new ImageProcessingError(
        `Template URL generation failed: ${e.message}`
      );
    }

    try {
      const [designBlob, templateBlob] = await Promise.all([
        DesignDownloader.fetchImageAsBlob(designImageUrl),
        DesignDownloader.fetchImageAsBlob(templateImageUrl), // Fetch the front template
      ]);
      const [designImage, templateImage] = await Promise.all([
        DesignDownloader.loadImage(designBlob),
        DesignDownloader.loadImage(templateBlob),
      ]);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new ImageProcessingError(
          "Could not get 2D rendering context for canvas."
        );
      }

      canvas.width = templateImage.naturalWidth;
      canvas.height = templateImage.naturalHeight;
      if (canvas.width === 0 || canvas.height === 0) {
        throw new ImageProcessingError(
          "Template image has zero dimensions.",
          null,
          templateImageUrl
        );
      }

      ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);

      // --- Define Printable Area ---
      // ** IMPORTANT: Adjust these ratios based on your specific template images **
      //    Measure the Bounding Box where designs should go relative to the template dimensions.
      let printableArea = {
        xRatio: 0.3,
        yRatio: 0.2,
        widthRatio: 0.4,
        heightRatio: 0.5,
      }; // Default (likely T-Shirt)

      // Adjust area based on product type if necessary
      const typeKey = productType.toLowerCase().replace(/\s+/g, "-");
      if (typeKey === "hoodie") {
        printableArea = {
          xRatio: 0.32,
          yRatio: 0.25,
          widthRatio: 0.36,
          heightRatio: 0.4,
        }; // Example for Hoodie
      } else if (typeKey === "long-sleeve") {
        printableArea = {
          xRatio: 0.3,
          yRatio: 0.22,
          widthRatio: 0.4,
          heightRatio: 0.48,
        }; // Example for Long Sleeve
      }
      // -----------------------------

      const areaX = canvas.width * printableArea.xRatio;
      const areaY = canvas.height * printableArea.yRatio;
      const areaW = canvas.width * printableArea.widthRatio;
      const areaH = canvas.height * printableArea.heightRatio;

      let designRenderWidth = areaW * scale;
      let designRenderHeight =
        (designImage.naturalHeight / designImage.naturalWidth) *
        designRenderWidth;
      if (designRenderHeight > areaH * scale) {
        designRenderHeight = areaH * scale;
        designRenderWidth =
          (designImage.naturalWidth / designImage.naturalHeight) *
          designRenderHeight;
      }
      if (designRenderWidth <= 0 || designRenderHeight <= 0) {
        console.warn(
          "Calculated design dimensions for mockup are zero or negative. Skipping design draw."
        );
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

      const drawCenterX = areaX + (posX / 100) * areaW;
      const drawCenterY = areaY + (posY / 100) * areaH;

      ctx.save();
      ctx.translate(drawCenterX, drawCenterY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(
        designImage,
        -designRenderWidth / 2,
        -designRenderHeight / 2,
        designRenderWidth,
        designRenderHeight
      );
      ctx.restore();

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(
                new ImageProcessingError("Canvas toBlob conversion failed.")
              );
            }
          },
          "image/png",
          0.95
        );
      });
    } catch (error) {
      console.error("Mockup creation failed:", error);
      throw error instanceof DesignDownloadError
        ? error
        : new ImageProcessingError(
            `Mockup generation failed: ${error.message}`
          );
    }
  }

  // downloadSingleDesign and downloadAllDesigns methods remain the same as in the previous version...
  // They rely on the corrected getProductTemplateUrl and createProductMockup methods.

  static async downloadSingleDesign(designData) {
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
      const checkNested = (obj, path) =>
        path.split(".").reduce((o, k) => o?.[k], obj);
      if (checkNested(designData, field) == null) {
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
        pricing: price || {},
      };
      zip.file("metadata.json", JSON.stringify(metadata, null, 2));

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
          return { error: `Mockup generation failed: ${e.message}` };
        }),
      ]);

      const designResult = results[0];
      const mockupResult = results[1];

      if (designResult.status === "fulfilled") {
        zip.file("original_design.png", designResult.value);
      } else {
        zip.file(
          "ERROR_fetching_design.txt",
          `Failed to fetch original design:\n${
            designResult.reason?.message || "Unknown fetch error"
          }`
        );
      }

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
            : mockupResult.value?.error || "Unknown mockup error";
        zip.file(
          "ERROR_generating_mockup.txt",
          `Failed to generate mockup:\n${errorMsg}`
        );
      }

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });
      saveAs(
        zipBlob,
        DesignDownloader.generateFileName("design_pkg", orderId, itemId)
      );
      return true;
    } catch (error) {
      console.error("Single design package creation error:", error);
      throw error instanceof DesignDownloadError
        ? error
        : new DesignDownloadError(`Package creation failed: ${error.message}`);
    }
  }

  static async downloadAllDesigns(orderData) {
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
    const itemsFolder = mainZip.folder("order_items");
    const totalItems = orderData.cart.length;
    const processingPromises = [];
    const failures = [];
    let successCount = 0;

    console.log(
      `Starting batch download for order ${orderData._id} with ${totalItems} items.`
    );

    orderData.cart.forEach((item, index) => {
      const itemIndex = index + 1;
      const itemId = item._id || `item_${itemIndex}`;

      const itemPromise = (async () => {
        const itemZip = new JSZip();
        try {
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

          if (mockupResult.status === "fulfilled") {
            itemZip.file("mockup.png", mockupResult.value);
          } else {
            itemZip.file(
              "ERROR_mockup.txt",
              `Mockup failed:\n${mockupResult.reason?.message || "Unknown"}`
            );
            console.warn(
              `Mockup failed for item ${itemIndex}, but continuing.`
            );
            failures.push({
              itemId,
              index: itemIndex,
              reason: `Mockup Generation Failed: ${mockupResult.reason?.message}`,
            });
          }

          const itemZipBlob = await itemZip.generateAsync({
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 1 },
          });
          itemsFolder.file(`item_${itemIndex}_${itemId}.zip`, itemZipBlob);
          successCount++;
        } catch (error) {
          console.error(
            `Failed to process item ${itemIndex} (ID: ${itemId}):`,
            error
          );
          const reason =
            error instanceof DesignDownloadError
              ? `${error.code}: ${error.message}`
              : error.message;
          failures.push({ itemId, index: itemIndex, reason });
          itemsFolder.file(
            `item_${itemIndex}_${itemId}_ERROR.txt`,
            `Processing Failed: ${reason}\n${error.stack || ""}`
          );
        }
      })();

      processingPromises.push(itemPromise);
    });

    await Promise.all(processingPromises);
    console.log(
      `Batch processing finished. Success: ${successCount}, Failures: ${failures.length}`
    );

    const summary = {
      batchDownloadedAt: new Date().toISOString(),
      order: { id: orderData._id, totalItems },
      summary: { successes: successCount, failures: failures.length },
      failedItems: failures,
    };
    mainZip.file("batch_summary.json", JSON.stringify(summary, null, 2));

    const mainZipBlob = await mainZip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
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
} // End of DesignDownloader Class