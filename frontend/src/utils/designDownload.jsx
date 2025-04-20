import JSZip from "jszip";
import { saveAs } from "file-saver";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";

const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_NAME;
const BASE_CLOUDINARY_URL = `https://res.cloudinary.com/${
  CLOUDINARY_CLOUD_NAME || "MISSING_CLOUD_NAME"
}/image/upload`;

const TEMPLATE_FOLDERS = {
  hoodie: "hoodies",
  "t-shirt": "t-shirts",
  "long-sleeve": "long-sleeves",
};

const getTemplateFilenamePrefix = (typeKey) => {
  switch (typeKey) {
    case "hoodie":
      return "hoodie";
    case "t-shirt":
      return "t-shirt";
    case "long-sleeve":
      return "longsleeves";
    default:
      return typeKey;
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
    if (!url || typeof url !== "string")
      throw new ImageProcessingError("Invalid image URL provided.", null, url);
    if (
      url.startsWith(BASE_CLOUDINARY_URL) &&
      CLOUDINARY_CLOUD_NAME === "MISSING_CLOUD_NAME"
    ) {
      throw new ImageProcessingError(
        "Application misconfigured: Cloudinary name missing.",
        null,
        url
      );
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
      if (!(response.data instanceof Blob))
        throw new ImageProcessingError(
          "Invalid response: expected a Blob.",
          response.status,
          url
        );
      return new Blob([response.data], {
        type: response.headers["content-type"] || "image/png",
      });
    } catch (error) {
      let errMsg = `Image fetch failed: ${error.message}`;
      let status = error.response?.status;
      if (axios.isCancel(error)) errMsg = "Image fetch cancelled.";
      else if (error.code === "ECONNABORTED") errMsg = "Image fetch timed out.";
      else if (error.response)
        errMsg = `Image fetch failed (Status ${status}): ${error.message}`;
      console.error(`fetchImageAsBlob Error (${url}):`, errMsg, error);
      throw new ImageProcessingError(errMsg, status, url);
    }
  }

  static loadImage(imageSource) {
    return new Promise((resolve, reject) => {
      if (!imageSource)
        return reject(
          new ImageProcessingError("Cannot load image: source missing.")
        );
      const image = new Image();
      image.crossOrigin = "anonymous";
      let objectUrl = null;
      image.onload = () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        if (image.naturalWidth === 0 || image.naturalHeight === 0)
          reject(
            new ImageProcessingError(
              `Image loaded but has invalid dimensions (0x0). Source: ${
                typeof imageSource === "string" ? imageSource : "Blob"
              }`,
              null,
              typeof imageSource === "string" ? imageSource : "Blob Source"
            )
          );
        else resolve(image);
      };
      image.onerror = (errorEvent) => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        console.error("Image load error:", errorEvent);
        reject(
          new ImageProcessingError(
            `Failed to load image resource. Source: ${
              typeof imageSource === "string" ? imageSource : "Blob"
            }`,
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
      } else reject(new ImageProcessingError("Invalid image source type."));
    });
  }

  static getProductTemplateUrl(productType, ProductColor) {
    if (!productType || !ProductColor)
      throw new Error("Product type and color required for template URL.");
    if (CLOUDINARY_CLOUD_NAME === "MISSING_CLOUD_NAME")
      throw new Error("App misconfigured: Cloudinary name missing.");
    const typeKey = productType.toLowerCase().replace(/\s+/g, "-");
    const colorKey = ProductColor.toLowerCase().replace(/\s+/g, "-");
    const folder = TEMPLATE_FOLDERS[typeKey];
    if (!folder)
      throw new Error(
        `Unsupported product type for template: '${productType}'.`
      );
    const filenamePrefix = getTemplateFilenamePrefix(typeKey);
    const fileName = `${filenamePrefix}-${colorKey}-front.png`;
    const templateUrl = `${BASE_CLOUDINARY_URL}/${folder}/${fileName}`;
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
    ProductColor,
    designSpecs
  ) {
    if (
      !designImageUrl ||
      !productType ||
      !ProductColor ||
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
      templateImageUrl = DesignDownloader.getProductTemplateUrl(
        productType,
        ProductColor
      );
    } catch (e) {
      throw new ImageProcessingError(
        `Template URL generation failed: ${e.message}`
      );
    }
    try {
      const [designBlob, templateBlob] = await Promise.all([
        DesignDownloader.fetchImageAsBlob(designImageUrl),
        DesignDownloader.fetchImageAsBlob(templateImageUrl),
      ]);
      const [designImage, templateImage] = await Promise.all([
        DesignDownloader.loadImage(designBlob),
        DesignDownloader.loadImage(templateBlob),
      ]);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new ImageProcessingError("Could not get 2D context.");
      canvas.width = templateImage.naturalWidth;
      canvas.height = templateImage.naturalHeight;
      if (canvas.width === 0 || canvas.height === 0)
        throw new ImageProcessingError(
          `Template image has zero dimensions. URL: ${templateImageUrl}`,
          null,
          templateImageUrl
        );
      ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
      let printableArea = {
        xRatio: 0.3,
        yRatio: 0.2,
        widthRatio: 0.4,
        heightRatio: 0.5,
      };
      const typeKey = productType.toLowerCase().replace(/\s+/g, "-");
      if (typeKey === "hoodie")
        printableArea = {
          xRatio: 0.32,
          yRatio: 0.25,
          widthRatio: 0.36,
          heightRatio: 0.4,
        };
      else if (typeKey === "long-sleeve")
        printableArea = {
          xRatio: 0.3,
          yRatio: 0.22,
          widthRatio: 0.4,
          heightRatio: 0.48,
        };
      const areaX = canvas.width * printableArea.xRatio;
      const areaY = canvas.height * printableArea.yRatio;
      const areaW = canvas.width * printableArea.widthRatio;
      const areaH = canvas.height * printableArea.heightRatio;
      const targetAreaWidth = areaW * scale;
      const targetAreaHeight = areaH * scale;
      let designRenderWidth = targetAreaWidth;
      let designRenderHeight =
        (designImage.naturalHeight / designImage.naturalWidth) *
        designRenderWidth;
      if (designRenderHeight > targetAreaHeight) {
        designRenderHeight = targetAreaHeight;
        designRenderWidth =
          (designImage.naturalWidth / designImage.naturalHeight) *
          designRenderHeight;
      }
      if (
        designRenderWidth <= 0 ||
        designRenderHeight <= 0 ||
        !isFinite(designRenderWidth) ||
        !isFinite(designRenderHeight)
      ) {
        console.warn(
          "Calculated invalid design dimensions for mockup. Skipping draw.",
          { designRenderWidth, designRenderHeight }
        );
        return new Promise((resolve, reject) =>
          canvas.toBlob(
            (blob) =>
              blob
                ? resolve(blob)
                : reject(new ImageProcessingError("Canvas toBlob failed.")),
            "image/png"
          )
        );
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
      return new Promise((resolve, reject) =>
        canvas.toBlob(
          (blob) =>
            blob
              ? resolve(blob)
              : reject(
                  new ImageProcessingError("Canvas toBlob conversion failed.")
                ),
          "image/png",
          0.95
        )
      );
    } catch (error) {
      console.error("Mockup creation failed:", error);
      throw error instanceof DesignDownloadError
        ? error
        : new ImageProcessingError(
            `Mockup generation failed: ${error.message}`
          );
    }
  }

  static async downloadSingleDesign(designData) {
    const requiredPaths = [
      "imageUrl",
      "orderId",
      "itemId",
      "specs.type",
      "specs.color",
      "specs.size",
      "specs.position.positionX",
      "specs.position.positionY",
    ];
    const checkNested = (obj, path) =>
      path
        .split(".")
        .reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);
    for (const path of requiredPaths)
      if (checkNested(designData, path) === undefined)
        throw new DesignDownloadError(`Missing required field '${path}'.`);
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
    const itemIdentifier = `${productTitle || "item"}_${itemId.slice(-6)}`;
    toast.info(`Creating ZIP package for ${itemIdentifier}...`, {
      autoClose: 2000,
    });
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
          throw new DesignDownloadError(
            `Failed to fetch design: ${e.message}`,
            "FETCH_DESIGN_FAILED"
          );
        }),
        DesignDownloader.createProductMockup(
          imageUrl,
          specs.type,
          specs.color,
          specs.position
        ).catch((e) => {
          return { error: `Mockup generation failed: ${e.message}` };
        }),
      ]);
      const designResult = results[0];
      const mockupResult = results[1];
      if (designResult.status === "fulfilled")
        zip.file("original_design.png", designResult.value);
      else {
        zip.file(
          "ERROR_fetching_design.txt",
          `Failed:\nURL: ${imageUrl}\nReason: ${
            designResult.reason?.message || "Unknown"
          }`
        );
        toast.error(`Failed to fetch design for ${itemIdentifier}.`);
      }
      if (
        mockupResult.status === "fulfilled" &&
        mockupResult.value &&
        !mockupResult.value.error
      )
        zip.file("product_mockup.png", mockupResult.value);
      else {
        const errorMsg =
          mockupResult.status === "rejected"
            ? mockupResult.reason?.message || "Unknown"
            : mockupResult.value?.error || "Unknown";
        zip.file("ERROR_generating_mockup.txt", `Failed:\nReason: ${errorMsg}`);
        toast.warn(`Failed to generate mockup for ${itemIdentifier}.`);
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
      toast.success(`Download initiated for ${itemIdentifier}!`);
      return true;
    } catch (error) {
      console.error(`Package creation error for ${itemIdentifier}:`, error);
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
    )
      throw new DesignDownloadError("Invalid or empty order data.");
    const mainZip = new JSZip();
    const itemsFolder = mainZip.folder("order_items");
    const totalItems = orderData.cart.length;
    const processingPromises = [];
    const failures = [];
    let successCount = 0;
    const orderIdentifier = `Order ${orderData._id.slice(-8)}`;
    toast.info(
      `Starting batch download for ${totalItems} items in ${orderIdentifier}...`
    );
    orderData.cart.forEach((item, index) => {
      const itemIndex = index + 1;
      const itemId = item._id || `item_${itemIndex}`;
      const itemIdentifier = `${item.DesignTitle || "item"}_${itemId.slice(
        -6
      )}`;
      const itemPromise = (async () => {
        const itemZip = new JSZip();
        try {
          const imageUrl = item.designImage?.url;
          if (!imageUrl)
            throw new DesignDownloadError("Missing design URL.", "MISSING_URL");
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
          if (designResult.status === "fulfilled")
            itemZip.file("design.png", designResult.value);
          else {
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
          if (mockupResult.status === "fulfilled")
            itemZip.file("mockup.png", mockupResult.value);
          else {
            itemZip.file(
              "ERROR_mockup.txt",
              `Mockup failed:\n${mockupResult.reason?.message || "Unknown"}`
            );
            console.warn(`Mockup failed for item ${itemIndex}, continuing.`);
            failures.push({
              itemId,
              index: itemIndex,
              reason: `Mockup Failed: ${
                mockupResult.reason?.message || "Unknown"
              }`,
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
      `${orderIdentifier} Batch finished. Success: ${successCount}, Failures: ${failures.length}`
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
    if (failures.length > 0)
      toast.warn(
        `Batch download completed for ${orderIdentifier}, but ${failures.length} item(s) failed. Check summary/errors in ZIP.`,
        { autoClose: 8000 }
      );
    else toast.success(`Batch download for ${orderIdentifier} initiated!`);
    return true;
  }
}
