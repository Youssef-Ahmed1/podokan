// utils/designDownload.js

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import axios from 'axios';

export class DesignDownloader {
  static async fetchImageAsBlob(imageUrl) {
    try {
      if (!imageUrl) {
        throw new Error('Invalid image URL');
      }

      const response = await axios.get(imageUrl, {
        responseType: 'blob',
        withCredentials: false,
        headers: {
          'Accept': 'image/*',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.data || !(response.data instanceof Blob)) {
        throw new Error('Invalid image data received');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching image:', error);
      throw new Error(`Failed to fetch image: ${error.message}`);
    }
  }

  static generateSafeFileName(prefix, orderId, itemId) {
    const timestamp = new Date().getTime();
    const safeOrderId = orderId?.toString().replace(/[^a-z0-9]/gi, '_') || 'unknown';
    const safeItemId = itemId?.toString().replace(/[^a-z0-9]/gi, '_') || timestamp;
    return `${prefix}_${safeOrderId}_${safeItemId}`;
  }

  static async downloadSingleDesign(designData) {
    try {
      // Validate design data
      if (!designData?.imageUrl || !designData?.specs) {
        throw new Error('Invalid design data structure');
      }

      const zip = new JSZip();
      
      // Fetch and validate image
      const imageBlob = await this.fetchImageAsBlob(designData.imageUrl);
      zip.file('design.png', imageBlob);

      // Prepare specifications
      const specifications = {
        orderInfo: {
          orderId: designData.orderId || 'Unknown',
          orderDate: designData.specs.order?.orderDate || new Date().toISOString(),
          quantity: designData.specs.order?.quantity || 1,
          price: designData.specs.order?.price || 0
        },
        productInfo: {
          title: designData.specs.product?.title || 'Untitled',
          type: designData.specs.product?.type || 'N/A',
          color: designData.specs.product?.color || 'N/A',
          size: designData.specs.product?.size || 'N/A'
        },
        designInfo: {
          position: designData.specs.design?.position || { x: 50, y: 40 },
          scale: designData.specs.design?.scale || 1
        },
        seller: {
          name: designData.specs.seller?.name || 'Unknown',
          email: designData.specs.seller?.email || 'N/A'
        },
        customer: {
          name: designData.specs.customer?.name || 'Anonymous',
          email: designData.specs.customer?.email || 'N/A'
        }
      };

      // Add specifications JSON
      zip.file('specifications.json', JSON.stringify(specifications, null, 2));

      // Generate human-readable summary
      const summary = `
Order Summary
------------
Order ID: ${specifications.orderInfo.orderId}
Date: ${new Date(specifications.orderInfo.orderDate).toLocaleString()}

Product Details
--------------
Title: ${specifications.productInfo.title}
Type: ${specifications.productInfo.type}
Color: ${specifications.productInfo.color}
Size: ${specifications.productInfo.size}
Quantity: ${specifications.orderInfo.quantity}
Price: ${specifications.orderInfo.price}

Design Details
-------------
Position: X: ${specifications.designInfo.position.x}, Y: ${specifications.designInfo.position.y}
Scale: ${specifications.designInfo.scale}

Seller Information
-----------------
Name: ${specifications.seller.name}
Email: ${specifications.seller.email}

Customer Information
------------------
Name: ${specifications.customer.name}
Email: ${specifications.customer.email}
      `.trim();

      // Add summary text file
      zip.file('summary.txt', summary);

      // Generate zip with compression
      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9
        }
      });

      if (!content) {
        throw new Error('Failed to generate zip file');
      }

      // Create safe filename and download
      const fileName = this.generateSafeFileName('design', designData.orderId, designData.itemId);
      saveAs(content, `${fileName}.zip`);

      return true;
    } catch (error) {
      console.error('Download error:', error);
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  static async downloadOrderDesigns(order) {
    try {
      if (!order?._id || !Array.isArray(order.cart)) {
        throw new Error('Invalid order data');
      }

      const zip = new JSZip();
      const designsFolder = zip.folder("designs");
      
      // Initialize summary data
      const summary = {
        orderId: order._id,
        orderDate: order.createdAt || new Date().toISOString(),
        customerInfo: {
          name: order.user?.name || 'Unknown',
          email: order.user?.email || 'N/A'
        },
        items: [],
        totalItems: order.cart.length,
        processedItems: 0
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
          itemFolder.file('design.png', imageBlob);

          // Prepare item specifications
          const itemSpecs = {
            productInfo: {
              title: item.DesignTitle || 'Untitled',
              type: item.ProductType || 'N/A',
              color: item.ProductColor || 'N/A',
              size: item.size || 'N/A',
              quantity: item.qty || 1
            },
            designSpecs: {
              position: item.DesignPosition || { x: 50, y: 40 },
              scale: item.DesignScale || 1
            },
            pricing: {
              price: item.price || 0,
              discountPrice: item.discountPrice,
              originalPrice: item.originalPrice
            }
          };

          // Add specifications to item folder
          itemFolder.file('specs.json', JSON.stringify(itemSpecs, null, 2));
          
          // Add to summary
          summary.items.push({
            id: item._id,
            title: item.DesignTitle || 'Untitled',
            type: item.ProductType || 'N/A',
            quantity: item.qty || 1,
            price: item.price || 0
          });

          summary.processedItems++;
        } catch (error) {
          console.error(`Failed to process item ${item?._id}:`, error);
        }
      }

      // Add order summary
      zip.file('order_summary.json', JSON.stringify(summary, null, 2));

      // Generate human-readable summary
      const textSummary = `
Order Summary
------------
Order ID: ${summary.orderId}
Date: ${new Date(summary.orderDate).toLocaleString()}
Customer: ${summary.customerInfo.name} (${summary.customerInfo.email})

Items Processed: ${summary.processedItems} of ${summary.totalItems}

Items:
${summary.items.map(item => `
- ${item.title}
  Type: ${item.type}
  Quantity: ${item.quantity}
  Price: ${item.price}
`).join('\n')}
      `.trim();

      zip.file('summary.txt', textSummary);

      // Generate zip
      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9
        }
      });

      if (!content) {
        throw new Error('Failed to generate zip file');
      }

      // Download with safe filename
      const fileName = this.generateSafeFileName('order', order._id, 'designs');
      saveAs(content, `${fileName}.zip`);

      return true;
    } catch (error) {
      console.error('Order download error:', error);
      throw new Error(`Order download failed: ${error.message}`);
    }
  }

  static async downloadBulkDesigns(orders) {
    try {
      if (!Array.isArray(orders) || orders.length === 0) {
        throw new Error('No orders provided for bulk download');
      }

      const zip = new JSZip();
      const ordersFolder = zip.folder("orders");
      
      const bulkSummary = {
        totalOrders: orders.length,
        processedOrders: 0,
        totalDesigns: 0,
        processedDesigns: 0,
        orders: []
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
            customerName: order.user?.name || 'Unknown',
            designs: order.cart.length
          });

          bulkSummary.processedOrders++;
          bulkSummary.totalDesigns += order.cart.length;
        } catch (error) {
          console.error(`Failed to process order ${order?._id}:`, error);
        }
      }

      // Add bulk summary
      zip.file('bulk_summary.json', JSON.stringify(bulkSummary, null, 2));

      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9
        }
      });

      if (!content) {
        throw new Error('Failed to generate bulk zip file');
      }

      const fileName = `bulk_designs_${new Date().getTime()}`;
      saveAs(content, `${fileName}.zip`);

      return true;
    } catch (error) {
      console.error('Bulk download error:', error);
      throw new Error(`Bulk download failed: ${error.message}`);
    }
  }
}

export default DesignDownloader;