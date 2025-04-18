// File: frontend/src/utils/designDownload.js
import JSZip from "jszip";
import { saveAs } from "file-saver";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";

const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_NAME;

if (!CLOUDINARY_CLOUD_NAME) {
  console.error("CONFIG ERROR: REACT_APP_CLOUDINARY_NAME environment variable is not set!");
  toast.error("Application Configuration Error: Cannot load image resources. Downloads will fail.", { autoClose: false });
}

const BASE_CLOUDINARY_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME || 'MISSING_CLOUD_NAME'}/image/upload`;

const TEMPLATE_FOLDERS = {
  hoodie: "hoodies",
  "t-shirt": "t-shirts",
  "long-sleeve": "long-sleeves",
};

const PRINTABLE_AREAS = {
  't-shirt': { x: 0.3, y: 0.2, width: 0.4, height: 0.5 },
  'hoodie': { x: 0.32, y: 0.25, width: 0.36, height: 0.4 },
  'long-sleeve': { x: 0.3, y: 0.22, width: 0.4, height: 0.48 },
  default: { x: 0.3, y: 0.2, width: 0.4, height: 0.5 },
};

const getTemplateFilenamePrefix = (typeKey) => {
  switch (typeKey) {
    case "hoodie": return "hoodie";
    case "t-shirt": return "t-shirt";
    case "long-sleeve": return "longsleeves";
    default: return typeKey;
  }
};

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

export class DesignDownloader {

  static async fetchImageAsBlob(url) {
    if (!url || typeof url !== 'string') {
      throw new ImageProcessingError("Invalid image URL provided.", null, url);
    }

    console.log(`Fetching image blob: ${url}`);
    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'blob',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        timeout: 45000,
        validateStatus: (status) => status >= 200 && status < 300,
        withCredentials: false,
      });

      if (!(response.data instanceof Blob)) {
        throw new ImageProcessingError("Invalid response received: expected a Blob.", response.status, url);
      }

      console.log(`Successfully fetched blob for: ${url} (Type: ${response.data.type}, Size: ${response.data.size})`);
      return new Blob([response.data], { type: response.headers['content-type'] || 'image/png' });
    } catch (error) {
      let errMsg = `Image fetch failed: ${error.message}`;
      let status = error.response?.status;

      if (axios.isCancel(error)) errMsg = "Image fetch request was cancelled.";
      else if (error.code === 'ECONNABORTED') errMsg = "Image fetch timed out after 45s.";
      else if (error.response) errMsg = `Image fetch failed (Status ${status}): ${error.message}`;

      console.error(`fetchImageAsBlob Error (${url}):`, errMsg, error);
      throw new ImageProcessingError(errMsg, status, url);
    }
  }

  static loadImage(imageSource) {
    return new Promise((resolve, reject) => {
      if (!imageSource) {
        return reject(new ImageProcessingError("Cannot load image: source is missing."));
      }

      const image = new Image();
      image.crossOrigin = "anonymous";
      let objectUrl = null;

      image.onload = () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        if (image.naturalWidth === 0 || image.naturalHeight === 0) {
          console.error("Image loaded but has zero dimensions:", image.src);
          reject(new ImageProcessingError(`Image loaded but has invalid dimensions (0x0).`, null, typeof imageSource === 'string' ? imageSource : 'Blob Source'));
        } else {
          console.log(`Image loaded successfully: ${image.src} (${image.naturalWidth}x${image.naturalHeight})`);
          resolve(image);
        }
      };

      image.onerror = (errorEvent) => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        console.error("Image load error:", errorEvent, image.src);
        reject(new ImageProcessingError(`Failed to load the image resource. Check network and URL/Blob validity.`, null, typeof imageSource === 'string' ? imageSource : 'Blob Source'));
      };

      if (imageSource instanceof Blob) {
        objectUrl = URL.createObjectURL(imageSource);
        image.src = objectUrl;
      } else if (typeof imageSource === 'string') {
        image.src = imageSource;
      } else {
        reject(new ImageProcessingError("Invalid image source type provided (must be URL string or Blob)."));
      }
    });
  }

  static getProductTemplateUrl(productType, ProductColor) {
    if (!productType || !ProductColor) {
      throw new Error("Product type and color are required to get template URL.");
    }
    if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === 'MISSING_CLOUD_NAME') {
      throw new Error("Cloudinary configuration is missing. Cannot generate template URL.");
    }

    const typeKey = productType.toLowerCase().replace(/\s+/g, '-');
    const colorKey = ProductColor.toLowerCase().replace(/\s+/g, '-');

    const folder = TEMPLATE_FOLDERS[typeKey];
    if (!folder) {
      console.warn(`Template folder not defined for product type '${typeKey}'. Using default folder 't-shirts'.`);
      const fallbackFileName = `t-shirt-${colorKey}-front.png`;
      return `${BASE_CLOUDINARY_URL}/t-shirts/${fallbackFileName}`;
    }

    const filenamePrefix = getTemplateFilenamePrefix(typeKey);
    const fileName = `${filenamePrefix}-${colorKey}-front.png`;
    const templateUrl = `${BASE_CLOUDINARY_URL}/${folder}/${fileName}`;

    console.log(`Generated template URL for ${productType} (${ProductColor}): ${templateUrl}`);
    return templateUrl;
  }

  static generateFileName(prefix, orderId, itemId, extension = "zip") {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T-]/g, "");
    const safeOrderId = (orderId || uuidv4()).toString().replace(/[^a-z0-9_.-]/gi, '_');
    const safeItemId = (itemId || uuidv4()).toString().replace(/[^a-z0-9_.-]/gi, '_');
    return `${prefix}_${safeOrderId}_${safeItemId}_${timestamp}.${extension}`;
  }

  static async createProductMockup(designImageUrl, productType, productColor, designSpecs) {

    if (!designImageUrl || !productType || !productColor || !designSpecs || designSpecs.positionX == null || designSpecs.positionY == null) {
      throw new ImageProcessingError("Missing required parameters for mockup generation (URL, Type, Color, Specs.Position).", null, designImageUrl);
    }

    const scale = designSpecs.scale ?? 1;
    const rotation = designSpecs.rotation ?? 0;
    const posXPercent = designSpecs.positionX;
    const posYPercent = designSpecs.positionY;

    console.log(`Generating mockup for: ${productType} ${productColor}, Scale: ${scale}, Rotation: ${rotation}, Pos: (${posXPercent}%, ${posYPercent}%)`);

    let templateImageUrl;
    try {
      templateImageUrl = DesignDownloader.getProductTemplateUrl(productType, productColor);
    } catch (e) {
      throw new ImageProcessingError(`Template URL generation failed: ${e.message}`);
    }

    try {
      const [designBlob, templateBlob] = await Promise.all([
        DesignDownloader.fetchImageAsBlob(designImageUrl).catch(e => { throw new ImageProcessingError(`Failed fetching design: ${e.message}`, e.status, designImageUrl); }),
        DesignDownloader.fetchImageAsBlob(templateImageUrl).catch(e => { throw new ImageProcessingError(`Failed fetching template: ${e.message}`, e.status, templateImageUrl); })
      ]);

      const [designImage, templateImage] = await Promise.all([
        DesignDownloader.loadImage(designBlob).catch(e => { throw new ImageProcessingError(`Failed loading design Blob: ${e.message}`); }),
        DesignDownloader.loadImage(templateBlob).catch(e => { throw new ImageProcessingError(`Failed loading template Blob: ${e.message}`); })
      ]);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new ImageProcessingError("Could not get 2D rendering context for canvas.");
      }

      canvas.width = templateImage.naturalWidth;
      canvas.height = templateImage.naturalHeight;
      if (canvas.width === 0 || canvas.height === 0) {
        throw new ImageProcessingError("Template image has zero dimensions.", null, templateImageUrl);
      }

      ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);

      const typeKey = productType.toLowerCase().replace(/\s+/g, '-');
      const areaConfig = PRINTABLE_AREAS[typeKey] || PRINTABLE_AREAS.default;
      const areaX = canvas.width * areaConfig.x;
      const areaY = canvas.height * areaConfig.y;
      const areaW = canvas.width * areaConfig.width;
      const areaH = canvas.height * areaConfig.height;

      let designRenderWidth = areaW * scale;
      let designRenderHeight = (designImage.naturalHeight / designImage.naturalWidth) * designRenderWidth;

      if (designRenderWidth <= 0 || designRenderHeight <= 0 || !isFinite(designRenderWidth) || !isFinite(designRenderHeight)) {
        console.warn("Calculated design dimensions for mockup are invalid. Skipping design draw.", { designRenderWidth, designRenderHeight });
        return new Promise((resolve, reject) => {
          canvas.toBlob(blob => blob ? resolve(blob) : reject(new ImageProcessingError("Canvas toBlob failed.")), 'image/png');
        });
      }

      const drawCenterX = areaX + (posXPercent / 100) * areaW;
      const drawCenterY = areaY + (posYPercent / 100) * areaH;

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

      console.log(`Mockup canvas prepared. Converting to Blob...`);
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`Mockup Blob created (Size: ${blob.size})`);
              resolve(blob);
            } else {
              reject(new ImageProcessingError("Canvas toBlob conversion failed."));
            }
          },
          'image/png',
          0.95
        );
      });
    } catch (error) {
      console.error("Mockup creation failed significantly:", error);
      throw error instanceof DesignDownloadError ? error : new ImageProcessingError(`Mockup generation failed unexpectedly: ${error.message}`);
    }
  }

  static async downloadSingleDesign(designData) {
    console.log("Initiating single design download with data:", designData);
    const requiredFields = [
      "imageUrl", "orderId", "itemId",
      "specs.type", "specs.color", "specs.size", "specs.position"
    ];
    for (const field of requiredFields) {
      const checkNested = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);
      if (checkNested(designData, field) == null) {
        console.error(`Missing required field '${field}' in designData:`, designData);
        throw new DesignDownloadError(`Missing required field '${field}' in design data for download.`);
      }
    }

    const zip = new JSZip();
    const {
      imageUrl, orderId, itemId, orderNumber,
      productTitle, specs, price
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
        design: {
          sourceUrl: imageUrl,
          specifications: specs.position
        },
        pricing: price || {},
      };
      zip.file("metadata.json", JSON.stringify(metadata, null, 2));
      console.log("Metadata added to zip.");

      const results = await Promise.allSettled([
        DesignDownloader.fetchImageAsBlob(imageUrl).catch(e => {
          console.error(`Failed fetching original design: ${e.message}`);
          return { error: `Failed to fetch original design: ${e.message}` };
        }),
        DesignDownloader.createProductMockup(imageUrl, specs.type, specs.color, specs.position).catch(e => {
          console.error(`Failed generating mockup: ${e.message}`);
          return { error: `Mockup generation failed: ${e.message}` };
        })
      ]);

      const designResult = results[0];
      const mockupResult = results[1];

      if (designResult.status === 'fulfilled' && !designResult.value.error) {
        zip.file("original_design.png", designResult.value);
        console.log("Original design added to zip.");
      } else {
        const reason = designResult.reason?.message || designResult.value?.error || "Unknown fetch error";
        zip.file("ERROR_fetching_design.txt", `Failed to fetch original design:\\n${reason}`);
        console.error("Failed to add original design to zip:", reason);
      }

      if (mockupResult.status === 'fulfilled' && !mockupResult.value.error) {
        zip.file("product_mockup.png", mockupResult.value);
        console.log("Mockup added to zip.");
      } else {
        const reason = mockupResult.reason?.message || mockupResult.value?.error || "Unknown mockup error";
        zip.file("ERROR_generating_mockup.txt", `Failed to generate mockup:\\n${reason}`);
        console.error("Failed to add mockup to zip:", reason);
      }

      console.log("Generating ZIP file...");
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });
      console.log(`ZIP generated (Size: ${zipBlob.size}). Triggering download...`);

      saveAs(zipBlob, DesignDownloader.generateFileName("design_pkg", orderId, itemId));

      if (designResult.value?.error || mockupResult.value?.error) {
          toast.warn("Download initiated, but some files encountered errors. Check the ZIP contents.");
      }

      return true;

    } catch (error) {
      console.error("Single design package creation error:", error);
      throw error instanceof DesignDownloadError ? error : new DesignDownloadError(`Package creation failed: ${error.message}`);
    }
  }
  static async downloadAllDesigns(orderData) {
    if (!orderData?._id || !Array.isArray(orderData.cart) || orderData.cart.length === 0) {
      throw new DesignDownloadError("Invalid or empty order data provided for batch download.", "INVALID_BATCH_DATA");
    }

    const mainZip = new JSZip();
    const itemsFolder = mainZip.folder("order_items");
    const totalItems = orderData.cart.length;
    const processingPromises = [];
    const failures = [];
    let successCount = 0;

    console.log(`Starting batch download for order ${orderData._id} with ${totalItems} items.`);
    toast.info(`Preparing batch download for ${totalItems} items...`);

    orderData.cart.forEach((item, index) => {
      const itemIndex = index + 1;
      const itemId = item._id || `item_${itemIndex}_${uuidv4().slice(0, 8)}`;

      const itemPromise = (async () => {
        const itemZip = new JSZip();
        try {
          const imageUrl = item.designImage?.url;
          if (!imageUrl) throw new DesignDownloadError("Missing design image URL.", "MISSING_URL");

          const specs = {
            type: item.ProductType || "N/A",
            color: item.ProductColor || "N/A",
            size: item.size || "N/A",
            position: item.designSpecs || { positionX: 50, positionY: 50, scale: 1, rotation: 0 }
          };

          itemZip.file('details.json', JSON.stringify({
            itemId, index: itemIndex, designTitle: item.DesignTitle || "Untitled",
            specs, qty: item.qty, price: item.price, sourceImageUrl: imageUrl
          }, null, 2));

          const itemResults = await Promise.allSettled([
            DesignDownloader.fetchImageAsBlob(imageUrl).catch(e => ({ error: `Design fetch failed: ${e.message}` })),
            DesignDownloader.createProductMockup(imageUrl, specs.type, specs.color, specs.position).catch(e => ({ error: `Mockup generation failed: ${e.message}` }))
          ]);

          const designResult = itemResults[0];
          const mockupResult = itemResults[1];

          if (designResult.status === 'fulfilled' && !designResult.value.error) {
            itemZip.file('design.png', designResult.value);
          } else {
            const reason = designResult.reason?.message || designResult.value?.error || "Unknown fetch error";
            itemZip.file('ERROR_design.txt', `Fetch failed:\\n${reason}`);
            throw new DesignDownloadError(`Design fetch failed for item ${itemIndex}`, "FETCH_FAILED", { reason });
          }

          if (mockupResult.status === 'fulfilled' && !mockupResult.value.error) {
            itemZip.file('mockup.png', mockupResult.value);
          } else {
            const reason = mockupResult.reason?.message || mockupResult.value?.error || "Unknown mockup error";
            itemZip.file('ERROR_mockup.txt', `Mockup failed:\\n${reason}`);
            console.warn(`Mockup failed for item ${itemIndex} (ID: ${itemId}), but continuing batch.`);
            failures.push({ itemId, index: itemIndex, reason: `Mockup Generation Failed: ${reason}` });
          }

          const itemZipBlob = await itemZip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 1 } });
          itemsFolder.file(`item_${itemIndex}_${itemId}.zip`, itemZipBlob);
          successCount++;

        } catch (error) {
          console.error(`Failed to process item ${itemIndex} (ID: ${itemId}):`, error);
          const reason = error instanceof DesignDownloadError ? `${error.code}: ${error.message}` : error.message;
          if (!failures.some(f => f.itemId === itemId)) {
              failures.push({ itemId, index: itemIndex, reason });
          }
          itemsFolder.file(`item_${itemIndex}_${itemId}_ERROR.txt`, `Processing Failed: ${reason}\\n${error.stack || ''}`);
        }
      })();
      processingPromises.push(itemPromise);
    });

    await Promise.all(processingPromises);
    console.log(`Batch processing finished. Success: ${successCount}, Failures recorded: ${failures.length}`);

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
      compressionOptions: { level: 6 }
    });
    saveAs(mainZipBlob, DesignDownloader.generateFileName("batch_order", orderData._id, "all_items"));

    if (failures.length > 0) {
      toast.warn(`Batch download completed, but ${failures.length} item(s) had issues. Check 'batch_summary.json' and error files inside the ZIP.`);
    } else {
      toast.success(`Batch download for order ${orderData._id.slice(-8)} initiated successfully!`);
    }
    return true;
  }
}