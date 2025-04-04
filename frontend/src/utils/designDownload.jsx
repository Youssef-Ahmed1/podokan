import JSZip from "jszip";
import { saveAs } from "file-saver";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

// --- Configuration ---
const CLOUDINARY_CLOUD_NAME = dkot9tyjm;
if (!CLOUDINARY_CLOUD_NAME) {
  console.error(
    "CRITICAL: REACT_APP_CLOUDINARY_CLOUD_NAME environment variable not set!"
  );
}
const BASE_CLOUDINARY_URL = `https://res.cloudinary.com/${
  CLOUDINARY_CLOUD_NAME || "YOUR_CLOUD_NAME_PLACEHOLDER"
}/image/upload`;

const TEMPLATE_FOLDERS = {
  hoodie: "hoodies",
  "t-shirt": "t-shirts",
  "long-sleeve": "long-sleeves",
};

const getTemplateFilenamePrefix = (typeKey) => {
  if (typeKey === "long-sleeve") return "longsleeve";
  return typeKey;
};

// --- Error Classes ---
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
    if (!url || typeof url !== "string")
      throw new ImageProcessingError("Invalid image URL.", null, url);
    try {
      const response = await axios({
        url,
        method: "GET",
        responseType: "blob",
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
          Expires: "0",
        },
        timeout: 45000,
        validateStatus: (s) => s >= 200 && s < 300,
        withCredentials: false,
      });
      if (!(response.data instanceof Blob))
        throw new ImageProcessingError(
          "Invalid response: expected Blob.",
          response.status,
          url
        );
      return new Blob([response.data], {
        type: response.headers["content-type"] || "image/png",
      });
    } catch (error) {
      let errMsg = `Image fetch failed: ${error.message}`;
      let status = error.response?.status;
      if (axios.isCancel(error)) errMsg = "Cancelled.";
      else if (error.code === "ECONNABORTED") errMsg = "Timed out.";
      else if (error.response)
        errMsg = `Failed (Status ${status}): ${error.message}`;
      console.error(`fetchImageAsBlob Error (${url}):`, errMsg, error);
      throw new ImageProcessingError(errMsg, status, url);
    }
  }

  static loadImage(imageSource) {
    return new Promise((resolve, reject) => {
      if (!imageSource)
        return reject(new ImageProcessingError("Image source missing."));
      const image = new Image();
      image.crossOrigin = "anonymous";
      let objectUrl = null;
      image.onload = () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        if (image.naturalWidth === 0 || image.naturalHeight === 0)
          reject(
            new ImageProcessingError(
              `Image loaded with zero dimensions.`,
              null,
              typeof imageSource === "string" ? imageSource : "Blob"
            )
          );
        else resolve(image);
      };
      image.onerror = (err) => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        console.error("Image load error:", err);
        reject(
          new ImageProcessingError(
            `Failed to load image resource.`,
            null,
            typeof imageSource === "string" ? imageSource : "Blob"
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

  static getProductTemplateUrl(productType, productColor) {
    const typeKey = (productType || "t-shirt")
      .toLowerCase()
      .replace(/\s+/g, "-");
    const colorKey = (productColor || "white")
      .toLowerCase()
      .replace(/\s+/g, "-");
    const folder = TEMPLATE_FOLDERS[typeKey];
    if (!folder)
      throw new Error(
        `Config error: Template path missing for type '${productType}'.`
      );
    const filenamePrefix = getTemplateFilenamePrefix(typeKey);
    const fileName = `${filenamePrefix}-${colorKey}-front.png`;
    return `${BASE_CLOUDINARY_URL}/${folder}/${fileName}`;
  }

  static generateFileName(prefix, orderId, itemId, extension = "zip") {
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T-]/g, "");
    const safeOId = (orderId || uuidv4())
      .toString()
      .replace(/[^a-z0-9_.-]/gi, "_");
    const safeIId = (itemId || uuidv4())
      .toString()
      .replace(/[^a-z0-9_.-]/gi, "_");
    return `${prefix}_${safeOId}_${safeIId}_${ts}.${extension}`;
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
    )
      throw new ImageProcessingError("Missing params for mockup.");
    let templateImageUrl;
    try {
      templateImageUrl = DesignDownloader.getProductTemplateUrl(
        productType,
        productColor
      );
    } catch (e) {
      throw new ImageProcessingError(`Template URL error: ${e.message}`);
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
      if (!ctx) throw new ImageProcessingError("No 2D context.");
      canvas.width = templateImage.naturalWidth;
      canvas.height = templateImage.naturalHeight;
      if (canvas.width === 0)
        throw new ImageProcessingError("Template zero width.");
      ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
      // ** ADJUST PRINTABLE AREA RATIOS FOR YOUR TEMPLATES **
      const area = {
        xRatio: 0.3,
        yRatio: 0.2,
        widthRatio: 0.4,
        heightRatio: 0.5,
      };
      const areaX = canvas.width * area.xRatio;
      const areaY = canvas.height * area.yRatio;
      const areaW = canvas.width * area.widthRatio;
      const areaH = canvas.height * area.heightRatio;
      const posX = designSpecs.positionX ?? 50;
      const posY = designSpecs.positionY ?? 50;
      const scale = designSpecs.scale ?? 1;
      const rotation = designSpecs.rotation ?? 0;
      let dW = areaW * scale;
      let dH = (designImage.naturalHeight / designImage.naturalWidth) * dW;
      if (dH > areaH * scale) {
        dH = areaH * scale;
        dW = (designImage.naturalWidth / designImage.naturalHeight) * dH;
      }
      if (dW <= 0 || dH <= 0) {
        console.warn("Zero design dimensions calculated.");
        return new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
      }
      const cX = areaX + (posX / 100) * areaW;
      const cY = areaY + (posY / 100) * areaH;
      ctx.save();
      ctx.translate(cX, cY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(designImage, -dW / 2, -dH / 2, dW, dH);
      ctx.restore();
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) =>
            b
              ? resolve(b)
              : reject(new ImageProcessingError("Canvas toBlob failed.")),
          "image/png",
          0.95
        );
      });
    } catch (error) {
      console.error("Mockup creation failed:", error);
      throw error instanceof DesignDownloadError
        ? error
        : new ImageProcessingError(`Mockup generation error: ${error.message}`);
    }
  }

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
      let v = designData;
      for (const k of field.split(".")) {
        v = v?.[k];
        if (v == null)
          throw new DesignDownloadError(`Missing '${field}' in designData.`);
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
      const [designBlob, mockupBlob] = await Promise.all([
        DesignDownloader.fetchImageAsBlob(imageUrl).catch((e) => {
          throw new DesignDownloadError(`Fetch design fail: ${e.message}`);
        }),
        DesignDownloader.createProductMockup(
          imageUrl,
          specs.type,
          specs.color,
          specs.position
        ).catch((e) => {
          console.error("Mockup gen failed (single):", e);
          zip.file("ERROR_mockup.txt", `Mockup failed:\n${e.message}`);
          return null;
        }),
      ]);
      zip.file("original_design.png", designBlob);
      if (mockupBlob) zip.file("product_mockup.png", mockupBlob);
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });
      saveAs(
        zipBlob,
        DesignDownloader.generateFileName("design", orderId, itemId)
      );
      return true;
    } catch (error) {
      console.error("Single design package error:", error);
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
      throw new DesignDownloadError("Invalid order data for batch.");
    const mainZip = new JSZip();
    const itemsFolder = mainZip.folder("order_items");
    const limit = 3;
    let ok = 0;
    const fails = [];
    const total = orderData.cart.length;
    for (let i = 0; i < total; i += limit) {
      const batch = orderData.cart.slice(i, i + limit);
      await Promise.allSettled(
        batch.map(async (item, idx) => {
          const itemIdx = i + idx;
          const itemId = item._id || `item_${itemIdx + 1}`;
          const itemZip = new JSZip();
          try {
            const url = item.designImage?.url;
            if (!url)
              throw new DesignDownloadError("Missing URL.", "MISSING_URL");
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
            const [dBlob, mBlob] = await Promise.all([
              DesignDownloader.fetchImageAsBlob(url).catch((e) => {
                throw new DesignDownloadError(`Fetch fail: ${e.message}`);
              }),
              DesignDownloader.createProductMockup(
                url,
                specs.type,
                specs.color,
                specs.position
              ).catch((e) => {
                itemZip.file("ERROR_mockup.txt", `Mockup fail:\n${e.message}`);
                return null;
              }),
            ]);
            itemZip.file("design.png", dBlob);
            if (mBlob) itemZip.file("mockup.png", mBlob);
            itemZip.file(
              "details.json",
              JSON.stringify(
                {
                  itemId,
                  designTitle: item.DesignTitle || "Untitled",
                  specs,
                  qty: item.qty,
                  price: item.price,
                },
                null,
                1
              )
            );
            const itemZipBlob = await itemZip.generateAsync({
              type: "blob",
              compression: "DEFLATE",
              compressionOptions: { level: 1 },
            });
            itemsFolder.file(`item_${itemIdx + 1}_${itemId}.zip`, itemZipBlob);
            ok++;
          } catch (e) {
            const reason =
              e instanceof DesignDownloadError
                ? `${e.code}: ${e.message}`
                : e.message;
            fails.push({ itemId, index: itemIdx + 1, reason });
            itemsFolder.file(
              `item_${itemIdx + 1}_${itemId}_ERROR.txt`,
              `Failed: ${reason}\n${e.stack || ""}`
            );
          }
        })
      );
    }
    const summary = {
      batchAt: new Date().toISOString(),
      order: { id: orderData._id, total },
      summary: { ok, failed: fails.length },
      fails,
    };
    mainZip.file("batch_summary.json", JSON.stringify(summary, null, 2));
    const zBlob = await mainZip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
    saveAs(
      zBlob,
      DesignDownloader.generateFileName(
        "batch_order",
        orderData._id,
        "all_items"
      )
    );
    if (fails.length > 0)
      console.warn(`Batch download completed with ${fails.length} failures.`);
    return true;
  }
}
