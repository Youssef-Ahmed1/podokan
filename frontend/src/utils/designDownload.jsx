// utils/designDownload.js - Full implementation with proper naming
import JSZip from "jszip";
import { saveAs } from "file-saver";
import axios from "axios";

export class DesignDownloader {
  static async fetchImageAsBlob(url) {
    try {
      const response = await axios({
        url,
        responseType: "blob",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
        // Remove credentials for Cloudinary public assets
        withCredentials: false,
      });
  
      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      return new Blob([response.data], {
        type: response.headers["content-type"],
      });
    } catch (error) {
      console.error('Network error:', error);
      throw new Error(`Failed to fetch image: ${error.message}`);
    }
  }
  
  // Updated product template URL generator
  static getProductTemplateUrl(productType, productColor) {
    const type = (productType || 'hoodie').toLowerCase();
    const color = (productColor || 'white').toLowerCase().replace(/\s+/g, '-');
    
    const templates = {
      hoodie: `https://res.cloudinary.com/dkot9tyjm/image/upload/v1728392918/hoodies/hoodie-${color}-front.png`,
      tshirt: `https://res.cloudinary.com/dkot9tyjm/image/upload/v1728393898/t-shirts/t-shirt-${color}-front.png`,
      longsleeve: `https://res.cloudinary.com/dkot9tyjm/image/upload/v1728394665/long-sleeves/longseleves-${color}-front.png`
    };
  
    return templates[
      type.includes("hoodie")
        ? "hoodie"
        : type.includes("long")
        ? "longsleeve"
        : "tshirt"
    ];
  }

  // Generate a file name based on order and item IDs
  static generateFileName(orderId, itemId) {
    const timestamp = new Date().getTime();
    const safeOrderId =
      orderId?.toString().replace(/[^a-z0-9]/gi, "_") || "unknown";
    const safeItemId =
      itemId?.toString().replace(/[^a-z0-9]/gi, "_") || timestamp;
    return `design_${safeOrderId}_${safeItemId}`;
  }

  // Place design on product using exact specs from order
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

        // 3. Try to load product template
        let productImg;
        try {
          // First try specific product/color template
          const templatePath = `/static/templates/${productType.toLowerCase()}_${productColor.toLowerCase()}.png`;
          productImg = await this.loadImage(templatePath);
        } catch (e) {
          try {
            // If that fails, try generic product template
            const genericPath = `/static/templates/${productType.toLowerCase()}_white.png`;
            productImg = await this.loadImage(genericPath);
          } catch (e2) {
            // If that fails too, use default hoodie
            productImg = await this.loadImage(
              "/static/templates/hoodie_white.png"
            );
          }
        }

        // 4. Create canvas with product dimensions
        const canvas = document.createElement("canvas");
        canvas.width = productImg.width;
        canvas.height = productImg.height;

        const ctx = canvas.getContext("2d");

        // 5. Draw product image
        ctx.drawImage(productImg, 0, 0);

        // 6. Setup design positioning using exact specs from order
        const posX = designSpecs.positionX;
        const posY = designSpecs.positionY;
        const scale = designSpecs.scale;
        const rotation = designSpecs.rotation;

        // Calculate dimensions after scaling
        const designWidth = designImg.width * scale;
        const designHeight = designImg.height * scale;

        // Calculate center position (convert from percentage to pixels)
        const centerX = canvas.width * (posX / 100);
        const centerY = canvas.height * (posY / 100);

        // 7. Apply transformations and draw design
        ctx.save();

        // Move to position
        ctx.translate(centerX, centerY);

        // Apply rotation if any
        if (rotation !== 0) {
          ctx.rotate((rotation * Math.PI) / 180);
        }

        // Draw design centered at position
        ctx.drawImage(
          designImg,
          -designWidth / 2, // Center horizontally
          -designHeight / 2, // Center vertically
          designWidth,
          designHeight
        );

        // Restore canvas state
        ctx.restore();

        // 8. Convert canvas to blob
        canvas.toBlob((blob) => {
          // Clean up
          URL.revokeObjectURL(designObjectUrl);
          resolve(blob);
        }, "image/png");
      } catch (error) {
        console.error("Error creating product mockup:", error);
        reject(error);
      }
    });
  }

  // Main function to download a single design with all details
  static async downloadSingleDesign(designData) {
    try {
      console.log("Downloading design with data:", designData);

      if (!designData) throw new Error("No design data provided");

      // Extract URL with fallbacks for different formats
      const designUrl = designData.url || designData.imageUrl || designData;

      if (!designUrl || typeof designUrl !== "string") {
        throw new Error("Invalid or missing design URL");
      }

      // Create a simple download if specs not available
      if (!designData.specs) {
        console.log("No specs available, performing direct download");

        // Fetch the design image
        const response = await fetch(designUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        // Get the image blob
        const blob = await response.blob();

        // Create filename
        const filename =
          designData.name || `design-${designData.orderId || "unknown"}.png`;

        // Use saveAs from file-saver
        saveAs(blob, filename);
        console.log("Direct download complete");
        return true;
      }

      // If we have full specs, use ZIP functionality for complete package
      console.log("Creating full design package with specs");

      // Prepare specs with defaults for missing values
      const specs = designData.specs || {};

      // Create unified format for internal processing
      const processedData = {
        imageUrl: designUrl,
        mockupUrl: designData.mockupUrl,
        orderId: designData.orderId,
        itemId: designData.itemId,
        specs: {
          product: {
            title: designData.productTitle || "Design",
            type: specs.type || "hoodie",
            color: specs.color || "white",
            size: specs.size || "One Size",
          },
          design: {
            position: specs.position || {
              positionX: 50,
              positionY: 40,
              scale: 1,
              rotation: 0,
            },
          },
          order: {
            orderId: designData.orderId,
            orderNumber: designData.orderNumber,
            orderDate: new Date().toISOString(),
            quantity: 1,
            price: {
              itemPrice: 0,
              subtotal: 0,
              shippingCost: 0,
              total: 0,
            },
          },

          customer: {},
          shipping: {},
        },
      };
      const zip = new JSZip();

      // Add original design image
      console.log("Fetching original design...");
      const designBlob = await this.fetchImageAsBlob(processedData.imageUrl);
      zip.file("original_design.png", designBlob);

      // Create and add product mockup with design
      console.log("Creating product mockup...");
      try {
        const mockupBlob = await this.createProductMockup(
          imageUrl,
          productType,
          productColor,
          designPosition
        );
        zip.file("product_mockup.png", mockupBlob);
      } catch (mockupError) {
        console.error("Failed to create mockup:", mockupError);
      }

      // Add existing mockup image if available
      if (mockupUrl) {
        try {
          console.log("Adding existing mockup...");
          const mockupBlob = await this.fetchImageAsBlob(mockupUrl);
          zip.file("original_mockup.png", mockupBlob);
        } catch (e) {
          console.log("Could not fetch original mockup");
        }
      }

      // Create a ZIP archive

      // Add complete specifications JSON
      zip.file("specifications.json", JSON.stringify(specs, null, 2));

      // Add human-readable summary
      const summary = `
ORDER DETAILS
------------
Order ID: ${orderId || "N/A"}
Date: ${new Date(specs.order.orderDate || Date.now()).toLocaleString()}
Status: ${specs.order.status || "N/A"}

PRODUCT DETAILS
--------------
Title: ${specs.product.title || "N/A"}
Type: ${specs.product.type || "N/A"}
Color: ${specs.product.color || "N/A"}
Size: ${specs.product.size || "N/A"}
Quantity: ${specs.order.quantity || 1}
Price: ${specs.order.price.itemPrice || 0}

DESIGN PLACEMENT
---------------
Position X: ${designPosition.positionX || 50}%
Position Y: ${designPosition.positionY || 50}%
Scale: ${designPosition.scale || 1}x
Rotation: ${designPosition.rotation || 0}°

CUSTOMER INFORMATION
------------------
Name: ${specs.customer?.name || "N/A"}
Email: ${specs.customer?.email || "N/A"}

SHIPPING ADDRESS
---------------
${specs.shipping?.address || "N/A"}
${specs.shipping?.city || "N/A"}, ${specs.shipping?.country || "N/A"} ${
        specs.shipping?.postalCode || ""
      }

PRICING
-------
Item Price: ${specs.order.price.itemPrice || 0}
Quantity: ${specs.order.quantity || 1}
Subtotal: ${specs.order.price.subtotal || 0}
Shipping: ${specs.order.price.shippingCost || 0}
Total: ${specs.order.price.total || 0}
      `.trim();

      zip.file("summary.txt", summary);

      // Generate ZIP file
      console.log("Generating ZIP file...");
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
      });

      // Generate filename
      const filename =
        designData.name || `design-${processedData.orderId || "unknown"}.zip`;

      // Save the file
      saveAs(zipBlob, filename);
      console.log("Download complete");

      return true;
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  }

  // Download all designs from an order
  static async downloadAllDesigns(order) {
    try {
      if (
        !order ||
        !order.cart ||
        !Array.isArray(order.cart) ||
        order.cart.length === 0
      ) {
        throw new Error("No valid order items found");
      }

      // Create main ZIP file
      const mainZip = new JSZip();
      const designsFolder = mainZip.folder("designs");

      // Process each order item
      for (let i = 0; i < order.cart.length; i++) {
        const item = order.cart[i];
        if (!item) continue;

        try {
          // Create individual ZIP for this item
          const itemZip = new JSZip();

          // Get design image
          const designUrl = item.designImage?.url || item.designImage;
          if (!designUrl) continue;

          // Add original design
          const designBlob = await this.fetchImageAsBlob(designUrl);
          itemZip.file("original_design.png", designBlob);

          // Create product mockup
          try {
            const mockupBlob = await this.createProductMockup(
              designUrl,
              item.ProductType || "Hoodie",
              item.ProductColor || "White",
              {
                positionX: item.designSpecs?.positionX || 50,
                positionY: item.designSpecs?.positionY || 50,
                scale: item.designSpecs?.scale || 1,
                rotation: item.designSpecs?.rotation || 0,
              }
            );
            itemZip.file("product_mockup.png", mockupBlob);
          } catch (mockupError) {
            console.error(
              `Failed to create mockup for item ${i}:`,
              mockupError
            );
          }

          // Add item specifications
          const itemSpecs = {
            product: {
              title: item.DesignTitle || "",
              type: item.ProductType || "",
              color: item.ProductColor || "",
              size: item.size || "",
              quantity: item.qty || 1,
              price: item.price || 0,
            },
            design: {
              positionX: item.designSpecs?.positionX || 50,
              positionY: item.designSpecs?.positionY || 50,
              scale: item.designSpecs?.scale || 1,
              rotation: item.designSpecs?.rotation || 0,
            },
          };

          itemZip.file(
            "specifications.json",
            JSON.stringify(itemSpecs, null, 2)
          );

          // Generate and add item ZIP to main folder
          const itemZipBlob = await itemZip.generateAsync({ type: "blob" });
          designsFolder.file(`design_${item._id || i}.zip`, itemZipBlob);
        } catch (itemError) {
          console.error(`Error processing item ${i}:`, itemError);
        }
      }

      // Add order summary
      const orderSummary = {
        orderId: order._id || "",
        date: order.createdAt || new Date().toISOString(),
        customer: {
          name: order.user?.name || "",
          email: order.user?.email || "",
        },
        status: order.status || "Processing",
        items: order.cart.length,
        total: order.totalPrice || 0,
      };

      mainZip.file("order_summary.json", JSON.stringify(orderSummary, null, 2));

      // Generate final ZIP
      const zipBlob = await mainZip.generateAsync({ type: "blob" });

      // Generate filename
      const filename = `order_${
        order._id?.slice(0, 8) || "unknown"
      }_designs.zip`;

      // Save the ZIP file
      saveAs(zipBlob, filename);

      return true;
    } catch (error) {
      console.error("Error downloading all designs:", error);
      throw error;
    }
  }
}

export default DesignDownloader;
