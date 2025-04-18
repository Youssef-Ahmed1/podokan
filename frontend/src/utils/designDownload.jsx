// File: frontend/src/utils/designDownload.jsx
import JSZip from "jszip";
import { saveAs } from "file-saver";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";

const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_NAME;
if (!CLOUDINARY_CLOUD_NAME) {
  console.error("REACT_APP_CLOUDINARY_NAME missing in env!");
  toast.error("Config Error: Cannot load templates.", { autoClose: false });
}
const BASE_CLOUDINARY_URL = `https://res.cloudinary.com/${
  CLOUDINARY_CLOUD_NAME || "MISSING_CLOUD"
}/image/upload`;

const TEMPLATE_FOLDERS = {
  hoodie: "hoodies",
  "t-shirt": "t-shirts",
  "long-sleeve": "long-sleeves",
};
const getTemplateFilenamePrefix = (type) =>
  ({ hoodie: "hoodie", "t-shirt": "t-shirt", "long-sleeve": "longsleeves" }[
    type
  ] || type);

class DesignDownloadError extends Error {
  constructor(m, c = "DL_FAILED", d = {}) {
    super(m);
    this.name = "DesignDownloadError";
    this.code = c;
    this.details = d;
  }
}
class ImageProcessingError extends DesignDownloadError {
  constructor(m, s = null, u = null) {
    super(m, "IMG_PROC_ERROR", { s, u });
    this.status = s;
    this.url = u;
  }
}

export class DesignDownloader {
  static async fetchImageAsBlob(url) {
    if (!url) throw new ImageProcessingError("Invalid image URL.", null, url);
    try {
      const res = await axios({
        url,
        method: "GET",
        responseType: "blob",
        headers: { "Cache-Control": "no-store" },
        timeout: 45000,
        validateStatus: (s) => s >= 200 && s < 300,
        withCredentials: false,
      });
      if (!(res.data instanceof Blob))
        throw new ImageProcessingError(
          "Invalid response: expected Blob.",
          res.status,
          url
        );
      return new Blob([res.data], {
        type: res.headers["content-type"] || "image/png",
      });
    } catch (e) {
      let m = `Fetch failed: ${e.message}`;
      let s = e.response?.status;
      if (axios.isCancel(e)) m = "Fetch cancelled.";
      else if (e.code === "ECONNABORTED") m = "Fetch timed out.";
      else if (e.response) m = `Fetch failed (${s}): ${e.message}`;
      console.error(`fetchBlob Error (${url}):`, m, e);
      throw new ImageProcessingError(m, s, url);
    }
  }

  static loadImage(src) {
    return new Promise((resolve, reject) => {
      if (!src)
        return reject(new ImageProcessingError("Missing image source."));
      const img = new Image();
      img.crossOrigin = "anonymous";
      let objUrl = null;
      img.onload = () => {
        if (objUrl) URL.revokeObjectURL(objUrl);
        if (img.naturalWidth === 0)
          reject(
            new ImageProcessingError(
              "Image loaded with 0 dimensions.",
              null,
              typeof src === "string" ? src : "Blob"
            )
          );
        else resolve(img);
      };
      img.onerror = (e) => {
        if (objUrl) URL.revokeObjectURL(objUrl);
        reject(
          new ImageProcessingError(
            "Image load failed.",
            null,
            typeof src === "string" ? src : "Blob"
          )
        );
      };
      if (src instanceof Blob) {
        objUrl = URL.createObjectURL(src);
        img.src = objUrl;
      } else if (typeof src === "string") img.src = src;
      else reject(new ImageProcessingError("Invalid image source type."));
    });
  }

  static getProductTemplateUrl(type, color) {
    if (!type || !color)
      throw new Error("Type and color required for template URL.");
    const typeKey = type.toLowerCase().replace(/\s+/g, "-");
    const colorKey = color.toLowerCase().replace(/\s+/g, "-");
    const folder = TEMPLATE_FOLDERS[typeKey];
    if (!folder)
      console.warn(
        `Template folder missing for type '${typeKey}'. Using default.`
      );
    const prefix = getTemplateFilenamePrefix(typeKey);
    const file = `${prefix}-${colorKey}-front.png`;
    return `${BASE_CLOUDINARY_URL}/${folder || "t-shirts"}/${file}`;
  }

  static generateFileName(prefix, orderId, itemId, ext = "zip") {
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T-]/g, "");
    const safeOId = (orderId || uuidv4())
      .toString()
      .replace(/[^a-z0-9_.-]/gi, "_");
    const safeIId = (itemId || uuidv4())
      .toString()
      .replace(/[^a-z0-9_.-]/gi, "_");
    return `${prefix}_${safeOId}_${safeIId}_${ts}.${ext}`;
  }

  static async createProductMockup(designUrl, type, color, specs) {
    if (
      !designUrl ||
      !type ||
      !color ||
      specs?.positionX == null ||
      specs?.positionY == null
    )
      throw new ImageProcessingError("Missing params for mockup.");
    const { scale = 1, rotation = 0, positionX: posX, positionY: posY } = specs;
    let templateUrl;
    try {
      templateUrl = DesignDownloader.getProductTemplateUrl(type, color);
    } catch (e) {
      throw new ImageProcessingError(`Template URL error: ${e.message}`);
    }

    try {
      const [designBlob, templateBlob] = await Promise.all([
        DesignDownloader.fetchImageAsBlob(designUrl),
        DesignDownloader.fetchImageAsBlob(templateUrl),
      ]);
      const [designImage, templateImage] = await Promise.all([
        DesignDownloader.loadImage(designBlob),
        DesignDownloader.loadImage(templateBlob),
      ]);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new ImageProcessingError("Canvas context error.");
      canvas.width = templateImage.naturalWidth;
      canvas.height = templateImage.naturalHeight;
      if (canvas.width === 0 || canvas.height === 0)
        throw new ImageProcessingError(
          "Template 0 dimensions.",
          null,
          templateUrl
        );
      ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);

      let area = { xR: 0.3, yR: 0.2, wR: 0.4, hR: 0.5 }; // Default (t-shirt)
      const typeKey = type.toLowerCase().replace(/\s+/g, "-");
      if (typeKey === "hoodie")
        area = { xR: 0.32, yR: 0.25, wR: 0.36, hR: 0.4 };
      else if (typeKey === "long-sleeve")
        area = { xR: 0.3, yR: 0.22, wR: 0.4, hR: 0.48 };

      const areaX = canvas.width * area.xR,
        areaY = canvas.height * area.yR;
      const areaW = canvas.width * area.wR,
        areaH = canvas.height * area.hR;
      let dW = areaW * scale,
        dH = (designImage.naturalHeight / designImage.naturalWidth) * dW;
      if (dH > areaH * scale) {
        dH = areaH * scale;
        dW = (designImage.naturalWidth / designImage.naturalHeight) * dH;
      }
      if (dW <= 0 || dH <= 0) {
        console.warn("Mockup design size 0. Skipping draw.");
        return new Promise((r) => canvas.toBlob((b) => r(b), "image/png"));
      }

      const cX = areaX + (posX / 100) * areaW,
        cY = areaY + (posY / 100) * areaH;
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
      throw error instanceof DesignDownloadError
        ? error
        : new ImageProcessingError(`Mockup error: ${error.message}`);
    }
  }

  static async downloadSingleDesign(designData) {
    const fields = [
      "imageUrl",
      "orderId",
      "itemId",
      "specs.type",
      "specs.color",
      "specs.size",
      "specs.position",
    ];
    for (const f of fields)
      if (f.split(".").reduce((o, k) => o?.[k], designData) == null)
        throw new DesignDownloadError(`Missing field '${f}' in download data.`);

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
        ).catch((e) => ({ error: `Mockup failed: ${e.message}` })),
      ]);

      const designRes = results[0];
      const mockupRes = results[1];
      if (designRes.status === "fulfilled")
        zip.file("original_design.png", designRes.value);
      else
        zip.file(
          "ERROR_fetching_design.txt",
          `Failed: ${designRes.reason?.message || "Unknown"}`
        );
      if (
        mockupRes.status === "fulfilled" &&
        mockupRes.value &&
        !mockupRes.value.error
      )
        zip.file("product_mockup.png", mockupRes.value);
      else
        zip.file(
          "ERROR_generating_mockup.txt",
          `Failed: ${
            mockupRes.status === "rejected"
              ? mockupRes.reason?.message || "Unknown"
              : mockupRes.value?.error || "Unknown"
          }`
        );

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
      throw error instanceof DesignDownloadError
        ? error
        : new DesignDownloadError(`Package error: ${error.message}`);
    }
  }

  static async downloadAllDesigns(orderData) {
    if (
      !orderData?._id ||
      !Array.isArray(orderData.cart) ||
      orderData.cart.length === 0
    )
      throw new DesignDownloadError("Invalid order data for batch download.");
    const mainZip = new JSZip();
    const itemsFolder = mainZip.folder("order_items");
    const totalItems = orderData.cart.length;
    const promises = [];
    const failures = [];
    let successCount = 0;
    console.log(
      `Batch download for order ${orderData._id} (${totalItems} items)...`
    );

    orderData.cart.forEach((item, index) => {
      const itemIndex = index + 1;
      const itemId = item._id || `item_${itemIndex}`;
      promises.push(
        (async () => {
          const itemZip = new JSZip();
          try {
            const imageUrl = item.designImage?.url;
            if (!imageUrl)
              throw new DesignDownloadError("Missing URL.", "MISSING_URL");
            const specs = {
              type: item.ProductType || "N/A",
              color: item.ProductColor || "N/A",
              size: item.size || "N/A",
              position:
                item.designSpecs ||
                {
                  /* defaults */
                },
            };
            itemZip.file(
              "details.json",
              JSON.stringify(
                {
                  itemId,
                  index: itemIndex,
                  title: item.DesignTitle || "Untitled",
                  specs,
                  qty: item.qty,
                  price: item.price,
                  url: imageUrl,
                },
                null,
                1
              )
            );
            const res = await Promise.allSettled([
              DesignDownloader.fetchImageAsBlob(imageUrl),
              DesignDownloader.createProductMockup(
                imageUrl,
                specs.type,
                specs.color,
                specs.position
              ),
            ]);
            if (res[0].status === "fulfilled")
              itemZip.file("design.png", res[0].value);
            else {
              itemZip.file(
                "ERROR_design.txt",
                `Fetch fail: ${res[0].reason?.message}`
              );
              throw new DesignDownloadError(
                `Design fetch failed`,
                "FETCH_FAILED",
                { r: res[0].reason }
              );
            }
            if (res[1].status === "fulfilled")
              itemZip.file("mockup.png", res[1].value);
            else {
              itemZip.file(
                "ERROR_mockup.txt",
                `Mockup fail: ${res[1].reason?.message}`
              );
              failures.push({
                itemId,
                index: itemIndex,
                reason: `Mockup Fail: ${res[1].reason?.message}`,
              });
            }
            const itemBlob = await itemZip.generateAsync({
              type: "blob",
              compression: "DEFLATE",
              compressionOptions: { level: 1 },
            });
            itemsFolder.file(`item_${itemIndex}_${itemId}.zip`, itemBlob);
            successCount++;
          } catch (error) {
            const reason =
              error instanceof DesignDownloadError
                ? `${error.code}: ${error.message}`
                : error.message;
            failures.push({ itemId, index: itemIndex, reason });
            itemsFolder.file(
              `item_${itemIndex}_${itemId}_ERROR.txt`,
              `Fail: ${reason}\n${error.stack || ""}`
            );
          }
        })()
      );
    });

    await Promise.all(promises);
    console.log(
      `Batch finished. Success: ${successCount}, Failures: ${failures.length}`
    );
    const summary = {
      downloadedAt: new Date().toISOString(),
      order: { id: orderData._id, totalItems },
      summary: { successes: successCount, failures: failures.length },
      failedItems: failures,
    };
    mainZip.file("batch_summary.json", JSON.stringify(summary, null, 2));
    const mainBlob = await mainZip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
    saveAs(
      mainBlob,
      DesignDownloader.generateFileName(
        "batch_order",
        orderData._id,
        "all_items"
      )
    );
    if (failures.length > 0)
      toast.warn(
        `Batch DL completed, ${failures.length} item(s) failed. Check summary.`
      );
    else
      toast.success(`Batch DL for order ${orderData._id.slice(-8)} started!`);
    return true;
  }
}
