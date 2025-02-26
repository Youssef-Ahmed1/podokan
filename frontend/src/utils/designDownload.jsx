import JSZip from "jszip";
import { saveAs } from "file-saver";
import axios from "axios";
import { server } from "../server";

export class DesignDownloader {
  static async fetchImageAsBlob(imageUrl) {
    try {
      if (!imageUrl) {
        throw new Error("Invalid image URL");
      }

      const response = await axios.get(imageUrl, {
        responseType: "blob",
        withCredentials: false,
        headers: {
          Accept: "image/*",
          "Cache-Control": "no-cache",
        },
      });

      if (!response.data || !(response.data instanceof Blob)) {
        throw new Error("Invalid image data received");
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching image:", error);
      throw new Error(`Failed to fetch image: ${error.message}`);
    }
  }

  static generateSafeFileName(prefix, orderId, itemId) {
    const timestamp = new Date().getTime();
    const safeOrderId =
      orderId?.toString().replace(/[^a-z0-9]/gi, "_") || "unknown";
    const safeItemId =
      itemId?.toString().replace(/[^a-z0-9]/gi, "_") || timestamp;
    return `${prefix}_${safeOrderId}_${safeItemId}`;
  }

  static async generateProductMockup(
    designImage,
    productType,
    productColor,
    designPosition
  ) {
    try {
      // Fetch design image first
      const designBlob = await this.fetchImageAsBlob(designImage);
      const imageUrl = URL.createObjectURL(designBlob);

      return new Promise((resolve) => {
        const img = new Image();
        img.onload = async () => {
          // Get the base product template based on product type and color
          const baseProduct = await this.getProductTemplate(
            productType,
            productColor
          );

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // Set canvas size to match the base product
          canvas.width = baseProduct.width;
          canvas.height = baseProduct.height;

          // Draw the base product
          ctx.drawImage(baseProduct, 0, 0, canvas.width, canvas.height);

          // Extract exact positioning details from the designPosition object
          const positionX = designPosition?.positionX ?? 50; // percentage (0-100)
          const positionY = designPosition?.positionY ?? 50; // percentage (0-100)
          const scale = designPosition?.scale ?? 1; // multiplier
          const rotation = designPosition?.rotation ?? 0; // degrees

          // Calculate the actual position in pixels
          const designWidth = img.width * scale;
          const designHeight = img.height * scale;

          // Convert percentage positions to actual pixel positions
          const actualX = (canvas.width * positionX) / 100 - designWidth / 2;
          const actualY = (canvas.height * positionY) / 100 - designHeight / 2;

          // Save context before rotation
          ctx.save();

          // Move to the center of where the design should be placed
          ctx.translate(actualX + designWidth / 2, actualY + designHeight / 2);

          // Rotate if needed
          if (rotation !== 0) {
            ctx.rotate((rotation * Math.PI) / 180);
          }

          // Draw the design (centered at origin after translation)
          ctx.drawImage(
            img,
            -designWidth / 2,
            -designHeight / 2,
            designWidth,
            designHeight
          );

          // Restore context
          ctx.restore();

          // Convert canvas to blob
          canvas.toBlob((blob) => {
            resolve(blob);
            URL.revokeObjectURL(imageUrl);
          }, "image/png");
        };

        img.onerror = () => {
          URL.revokeObjectURL(imageUrl);
          resolve(null);
        };

        img.src = imageUrl;
      });
    } catch (error) {
      console.error("Error generating product mockup:", error);
      return null;
    }
  }

  static async getProductTemplate(productType, productColor) {
    return new Promise((resolve) => {
      const img = new Image();

      // Normalize product type and color for template selection
      const normalizedType = productType?.toLowerCase() || "hoodie";
      const normalizedColor = productColor?.toLowerCase() || "white";

      // Determine template path based on product type and color
      let templatePath;

      // Try to get exact product type
      if (normalizedType.includes("hoodie")) {
        templatePath = `/static/templates/hoodie_${normalizedColor}.png`;
      } else if (
        normalizedType.includes("t-shirt") ||
        normalizedType.includes("tshirt")
      ) {
        templatePath = `/static/templates/tshirt_${normalizedColor}.png`;
      } else if (normalizedType.includes("long")) {
        templatePath = `/static/templates/longsleeve_${normalizedColor}.png`;
      } else {
        // Default to hoodie if type is unknown
        templatePath = `/static/templates/hoodie_${normalizedColor}.png`;
      }

      // Fallback to default color if specific one fails
      img.onerror = () => {
        const defaultPath = `/static/templates/hoodie_white.png`;
        img.src = defaultPath;
      };

      img.onload = () => resolve(img);
      img.src = templatePath;
    });
  }

  static async downloadSingleDesign(designData) {
    try {
      // Validate design data
      if (!designData?.imageUrl || !designData?.specs) {
        throw new Error("Invalid design data structure");
      }

      const zip = new JSZip();

      // Extract all needed data from the designData
      const productType = designData.specs.product?.type || "Hoodie";
      const productColor = designData.specs.product?.color || "White";
      const productSize = designData.specs.product?.size || "M";

      // Extract exact position data
      const designPosition = designData.specs.design?.position || {
        positionX: 50,
        positionY: 50,
        scale: 1,
        rotation: 0,
      };

      // Fetch and validate design image
      const imageBlob = await this.fetchImageAsBlob(designData.imageUrl);
      zip.file("design.png", imageBlob);

      // Generate product mockup with design using exact positioning
      const mockupBlob = await this.generateProductMockup(
        designData.imageUrl,
        productType,
        productColor,
        designPosition
      );

      if (mockupBlob) {
        zip.file("product_mockup.png", mockupBlob);
      }

      // If a mockup URL is provided, fetch it as well
      if (designData.mockupUrl) {
        try {
          const existingMockupBlob = await this.fetchImageAsBlob(
            designData.mockupUrl
          );
          zip.file("original_mockup.png", existingMockupBlob);
        } catch (mockupErr) {
          console.warn("Could not fetch provided mockup image");
        }
      }

      // Add specifications JSON (using the exact data as provided)
      zip.file(
        "specifications.json",
        JSON.stringify(designData.specs, null, 2)
      );

      // Generate human-readable summary
      const summary = `
Order Summary
------------
Order ID: ${designData.specs.order?.orderId || "Unknown"}
Date: ${new Date(
        designData.specs.order?.orderDate || new Date()
      ).toLocaleString()}

Product Details
--------------
Title: ${designData.specs.product?.title || "Untitled"}
Type: ${productType}
Color: ${productColor}
Size: ${productSize}
Quantity: ${designData.specs.order?.quantity || 1}

Price Breakdown
--------------
Item Price: ${designData.specs.order?.price?.itemPrice || 0}
Subtotal: ${designData.specs.order?.price?.subtotal || 0}
Shipping: ${designData.specs.order?.price?.shippingCost || 0}
Total: ${designData.specs.order?.price?.total || 0}

Design Details
-------------
Position X: ${designPosition.positionX}%
Position Y: ${designPosition.positionY}%
Scale: ${designPosition.scale}
Rotation: ${designPosition.rotation}°

Seller Information
-----------------
Name: ${designData.specs.seller?.name || "Unknown"}
Email: ${designData.specs.seller?.email || "N/A"}

Customer Information
------------------
Name: ${designData.specs.customer?.name || "Anonymous"}
Email: ${designData.specs.customer?.email || "N/A"}
Address: ${designData.specs.customer?.address || "N/A"}
      `.trim();

      // Add summary text file
      zip.file("summary.txt", summary);

      // Generate zip with compression
      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9,
        },
      });

      if (!content) {
        throw new Error("Failed to generate zip file");
      }

      // Create safe filename and download
      const fileName = this.generateSafeFileName(
        "design",
        designData.orderId,
        designData.itemId
      );
      saveAs(content, `${fileName}.zip`);

      return true;
    } catch (error) {
      console.error("Download error:", error);
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  static async downloadOrderDesigns(order) {
    try {
      if (!order?._id || !Array.isArray(order.cart)) {
        throw new Error("Invalid order data");
      }

      const zip = new JSZip();
      const designsFolder = zip.folder("designs");

      // Initialize summary data
      const summary = {
        orderId: order._id,
        orderDate: order.createdAt || new Date().toISOString(),
        customerInfo: {
          name: order.user?.name || "Unknown",
          email: order.user?.email || "N/A",
        },
        items: [],
        totalItems: order.cart.length,
        processedItems: 0,
      };

      // Process each item
      for (const item of order.cart) {
        try {
          if (!item) continue;

          const designImage = item.designImage?.url || item.designImage;
          if (!designImage) {
            console.warn(`Skipping item ${item._id}: No design image`);
            continue;
          }

          // Create item folder
          const itemFolder = designsFolder.folder(item._id.toString());

          // Fetch and add image
          const imageBlob = await this.fetchImageAsBlob(designImage);
          itemFolder.file("design.png", imageBlob);

          // Prepare item specifications
          const itemSpecs = {
            productInfo: {
              title: item.DesignTitle || "Untitled",
              type: item.ProductType || "N/A",
              color: item.ProductColor || "N/A",
              size: item.size || "N/A",
              quantity: item.qty || 1,
            },
            designSpecs: {
              position: item.DesignPosition || { x: 50, y: 40 },
              scale: item.DesignScale || 1,
            },
            pricing: {
              price: item.price || 0,
              discountPrice: item.discountPrice,
              originalPrice: item.originalPrice,
            },
          };

          // Add specifications to item folder
          itemFolder.file("specs.json", JSON.stringify(itemSpecs, null, 2));

          // Add to summary
          summary.items.push({
            id: item._id,
            title: item.DesignTitle || "Untitled",
            type: item.ProductType || "N/A",
            quantity: item.qty || 1,
            price: item.price || 0,
          });

          summary.processedItems++;
        } catch (error) {
          console.error(`Failed to process item ${item?._id}:`, error);
        }
      }

      // Add order summary
      zip.file("order_summary.json", JSON.stringify(summary, null, 2));

      // Generate human-readable summary
      const textSummary = `
Order Summary
------------
Order ID: ${summary.orderId}
Date: ${new Date(summary.orderDate).toLocaleString()}
Customer: ${summary.customerInfo.name} (${summary.customerInfo.email})

Items Processed: ${summary.processedItems} of ${summary.totalItems}

Items:
${summary.items
  .map(
    (item) => `
- ${item.title}
  Type: ${item.type}
  Quantity: ${item.quantity}
  Price: ${item.price}
`
  )
  .join("\n")}
      `.trim();

      zip.file("summary.txt", textSummary);

      // Generate zip
      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9,
        },
      });

      if (!content) {
        throw new Error("Failed to generate zip file");
      }

      // Download with safe filename
      const fileName = this.generateSafeFileName("order", order._id, "designs");
      saveAs(content, `${fileName}.zip`);

      return true;
    } catch (error) {
      console.error("Order download error:", error);
      throw new Error(`Order download failed: ${error.message}`);
    }
  }

  static async downloadBulkDesigns(orders) {
    try {
      if (!Array.isArray(orders) || orders.length === 0) {
        throw new Error("No orders provided for bulk download");
      }

      const zip = new JSZip();
      const ordersFolder = zip.folder("orders");

      const bulkSummary = {
        totalOrders: orders.length,
        processedOrders: 0,
        totalDesigns: 0,
        processedDesigns: 0,
        orders: [],
      };

      for (const order of orders) {
        try {
          const orderFolder = ordersFolder.folder(order._id.toString());

          for (const item of order.cart) {
            try {
              const designImage = item.designImage?.url || item.designImage;
              if (!designImage) continue;

              const imageBlob = await this.fetchImageAsBlob(designImage);
              orderFolder.file(`${item._id}_design.png`, imageBlob);

              bulkSummary.processedDesigns++;
            } catch (error) {
              console.error(`Failed to process design ${item?._id}:`, error);
            }
          }

          bulkSummary.orders.push({
            orderId: order._id,
            customerName: order.user?.name || "Unknown",
            designs: order.cart.length,
          });

          bulkSummary.processedOrders++;
          bulkSummary.totalDesigns += order.cart.length;
        } catch (error) {
          console.error(`Failed to process order ${order?._id}:`, error);
        }
      }

      // Add bulk summary
      zip.file("bulk_summary.json", JSON.stringify(bulkSummary, null, 2));

      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9,
        },
      });

      if (!content) {
        throw new Error("Failed to generate bulk zip file");
      }

      const fileName = `bulk_designs_${new Date().getTime()}`;
      saveAs(content, `${fileName}.zip`);

      return true;
    } catch (error) {
      console.error("Bulk download error:", error);
      throw new Error(`Bulk download failed: ${error.message}`);
    }
  }
}

export default DesignDownloader;