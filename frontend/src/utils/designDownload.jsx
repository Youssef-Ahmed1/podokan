// frontend/src/utils/designDownload.js
import JSZip from "jszip";
import { saveAs } from "file-saver";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

class DesignDownloadError extends Error {
  constructor(m, c = "DESIGN_DOWNLOAD_FAILED", d = {}) {
    super(m);
    this.name = "DesignDownloadError";
    this.code = c;
    this.details = d;
  }
}
class ImageProcessingError extends DesignDownloadError {
  constructor(m, s = null, u = null) {
    super(m, "IMAGE_PROCESSING_ERROR", { httpStatus: s, failedUrl: u });
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
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
          Expires: "0",
        },
        timeout: 45000,
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return new Blob([res.data], {
        type: res.headers["content-type"] || "image/png",
      });
    } catch (e) {
      throw new ImageProcessingError(
        `Image fetch failed: ${e.message}`,
        e.response?.status,
        url
      );
    }
  }
  static loadImage(src) {
    return new Promise((res, rej) => {
      if (!src) return rej(new ImageProcessingError("Source missing."));
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => res(i);
      i.onerror = () =>
        rej(new ImageProcessingError(`Load failed.`, null, src));
      i.src = src;
    });
  }
  static getProductTemplateUrl(type, color) {
    const t = (type || "hoodie").toLowerCase().replace(/\s+/g, "-");
    const c = (color || "white").toLowerCase().replace(/\s+/g, "-");
    const BASE = "https://res.cloudinary.com/dkot9tyjm/image/upload";
    const FOLDERS = { hoodie: "hoodies", tshirt: "tshirts" };
    const VERS = { hoodie: "v1728392918", tshirt: "v1728393898" };
    const folder = FOLDERS[t] || `${t}s`;
    const ver = VERS[t] || "q_auto,f_auto";
    const file = `${t}-${c}-front.png`;
    return `${BASE}/${ver}/${folder}/${file}`;
  }
  static generateFileName(pfx, oId, iId, ext = "zip") {
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T-]/g, "");
    const sOId = (oId || uuidv4()).toString().replace(/[^a-z0-9_.-]/gi, "_");
    const sIId = (iId || uuidv4()).toString().replace(/[^a-z0-9_.-]/gi, "_");
    return `${pfx}_${sOId}_${sIId}_${ts}.${ext}`;
  }
  static async createProductMockup(imgUrl, pType, pColor, specs) {
    if (!imgUrl || !pType || !pColor || !specs)
      throw new ImageProcessingError("Missing mockup params.");
    let dUrl = null,
      tUrl = null;
    try {
      const [dBlob, tBlob] = await Promise.all([
        DesignDownloader.fetchImageAsBlob(imgUrl),
        DesignDownloader.fetchImageAsBlob(
          DesignDownloader.getProductTemplateUrl(pType, pColor)
        ),
      ]);
      dUrl = URL.createObjectURL(dBlob);
      tUrl = URL.createObjectURL(tBlob);
      const [dImg, pImg] = await Promise.all([
        DesignDownloader.loadImage(dUrl),
        DesignDownloader.loadImage(tUrl),
      ]);
      const c = document.createElement("canvas"),
        tW = pImg.naturalWidth,
        tH = pImg.naturalHeight;
      if (tW === 0 || tH === 0)
        throw new ImageProcessingError("Template 0 dimensions.");
      c.width = tW;
      c.height = tH;
      const ctx = c.getContext("2d");
      if (!ctx) throw new ImageProcessingError("No 2D context.");
      ctx.drawImage(pImg, 0, 0, tW, tH);
      const area = { xR: 0.3, yR: 0.2, wR: 0.4, hR: 0.5 };
      const aX = tW * area.xR,
        aY = tH * area.yR,
        aW = tW * area.wR,
        aH = tH * area.hR;
      const pX = specs.positionX ?? 50,
        pY = specs.positionY ?? 50,
        sc = specs.scale ?? 1,
        rot = specs.rotation ?? 0;
      let dW = aW * sc,
        dH = (dImg.naturalHeight / dImg.naturalWidth) * dW;
      if (dH > aH * sc) {
        dH = aH * sc;
        dW = (dImg.naturalWidth / dImg.naturalHeight) * dH;
      }
      const cX = aX + (pX / 100) * aW,
        cY = aY + (pY / 100) * aH;
      ctx.save();
      ctx.translate(cX, cY);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.drawImage(dImg, -dW / 2, -dH / 2, dW, dH);
      ctx.restore();
      return new Promise((res, rej) =>
        c.toBlob(
          (b) =>
            b ? res(b) : rej(new ImageProcessingError("Canvas toBlob failed.")),
          "image/png",
          0.95
        )
      );
    } catch (e) {
      throw e instanceof ImageProcessingError
        ? e
        : new ImageProcessingError(`Mockup gen failed: ${e.message}`);
    } finally {
      if (dUrl) URL.revokeObjectURL(dUrl);
      if (tUrl) URL.revokeObjectURL(tUrl);
    }
  }
  static async downloadSingleDesign(data) {
    if (!data?.imageUrl || !data.orderId || !data.itemId || !data.specs)
      throw new DesignDownloadError("Missing download data.");
    const zip = new JSZip();
    try {
      const meta = {
        dlAt: new Date().toISOString(),
        order: { id: data.orderId, num: data.orderNumber, item: data.itemId },
        product: {
          title: data.productTitle,
          type: data.specs.type,
          color: data.specs.color,
          size: data.specs.size,
        },
        design: { url: data.imageUrl, pos: data.specs.position },
        pricing: data.price,
      };
      zip.file("metadata.json", JSON.stringify(meta, null, 2));
      const [dBlob, mBlob] = await Promise.all([
        DesignDownloader.fetchImageAsBlob(data.imageUrl).catch((e) => {
          throw new DesignDownloadError(`Fetch design fail: ${e.message}`);
        }),
        DesignDownloader.createProductMockup(
          data.imageUrl,
          meta.product.type,
          meta.product.color,
          meta.design.pos
        ).catch((e) => {
          zip.file("ERROR_mockup.txt", `Mockup fail:\n${e.message}`);
          return null;
        }),
      ]);
      zip.file("original_design.png", dBlob);
      if (mBlob) zip.file("product_mockup.png", mBlob);
      const zBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });
      saveAs(
        zBlob,
        DesignDownloader.generateFileName(
          "design",
          meta.order.id,
          meta.order.item
        )
      );
      return true;
    } catch (e) {
      throw e instanceof DesignDownloadError
        ? e
        : new DesignDownloadError(`Package creation fail: ${e.message}`);
    }
  }
  static async downloadAllDesigns(order) {
    if (!order?._id || !Array.isArray(order.cart) || order.cart.length === 0)
      throw new DesignDownloadError("Invalid batch order.");
    const mainZip = new JSZip(),
      folder = mainZip.folder("order_items"),
      limit = 3;
    let ok = 0;
    const fails = [],
      total = order.cart.length;
    for (let i = 0; i < total; i += limit) {
      const batch = order.cart.slice(i, i + limit);
      await Promise.all(
        batch.map(async (item, idx) => {
          const itemIdx = i + idx,
            itemId = item._id || `item_${itemIdx}`;
          try {
            const url =
              item.designImage?.url ||
              (typeof item.designImage === "string" ? item.designImage : null);
            if (!url)
              throw new DesignDownloadError("Missing URL.", "MISSING_URL");
            const itemData = {
              imageUrl: url,
              orderId: order._id,
              itemId,
              productTitle: item.DesignTitle,
              specs: {
                type: item.ProductType,
                color: item.ProductColor,
                size: item.size,
                position: item.designSpecs || {},
              },
              price: {
                itemPrice: item.price,
                quantity: item.qty,
                itemTotal: (item.price || 0) * (item.qty || 1),
              },
            };
            const itemZip = new JSZip();
            const [dBlob, mBlob] = await Promise.all([
              DesignDownloader.fetchImageAsBlob(itemData.imageUrl).catch(
                (e) => {
                  throw new DesignDownloadError(`Fetch fail: ${e.message}`);
                }
              ),
              DesignDownloader.createProductMockup(
                itemData.imageUrl,
                itemData.specs.type,
                itemData.specs.color,
                itemData.specs.position
              ).catch((e) => {
                itemZip.file("ERROR_mockup.txt", `Mockup fail:\n${e.message}`);
                return null;
              }),
            ]);
            itemZip.file("design.png", dBlob);
            if (mBlob) itemZip.file("mockup.png", mBlob);
            itemZip.file(
              "meta.json",
              JSON.stringify({ id: itemId, specs: itemData.specs }, null, 1)
            );
            const itemZipBlob = await itemZip.generateAsync({
              type: "blob",
              compression: "DEFLATE",
              compressionOptions: { level: 1 },
            });
            folder.file(`item_${itemIdx + 1}_${itemId}.zip`, itemZipBlob);
            ok++;
          } catch (e) {
            const reason =
              e instanceof DesignDownloadError
                ? `${e.code}: ${e.message}`
                : e.message;
            fails.push({ itemId, index: itemIdx + 1, reason });
            folder.file(
              `item_${itemIdx + 1}_${itemId}_ERROR.txt`,
              `Failed: ${reason}`
            );
          }
        })
      );
    }
    const summary = {
      batchAt: new Date().toISOString(),
      order: { id: order._id, total },
      summary: { ok, failed: fails.length },
      fails,
    };
    mainZip.file("batch_summary.json", JSON.stringify(summary, null, 2));
    const zBlob = await mainZip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
    saveAs(zBlob, DesignDownloader.generateFileName("batch", order._id, "all"));
    return true;
  }
}
