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
        withCredentials: false
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching image:', error);
      throw new Error(`Failed to fetch design image: ${error.message}`);
    }
  }

  static generateFileName(prefix, orderId, itemId) {
    const timestamp = new Date().getTime();
    const safeOrderId = orderId?.toString().replace(/[^a-z0-9]/gi, '_') || 'unknown';
    const safeItemId = itemId?.toString().replace(/[^a-z0-9]/gi, '_') || timestamp;
    return `${prefix}_${safeOrderId}_${safeItemId}`;
  }

  static async downloadSingleDesign(designData) {
    try {
      // Validate required data
      if (!designData?.imageUrl || !designData?.specs) {
        throw new Error('Invalid design data structure');
      }

      const zip = new JSZip();
      
      // Add design image
      const imageBlob = await this.fetchImageAsBlob(designData.imageUrl);
      zip.file('design.png', imageBlob);

      // Prepare order details
      const orderDetails = {
        orderId: designData.orderId,
        orderDate: designData.specs.order.orderDate,
        quantity: designData.specs.order.quantity,
        price: designData.specs.order.price,
        product: {
          title: designData.specs.product.title,
          type: designData.specs.product.type,
          color: designData.specs.product.color,
          size: designData.specs.product.size
        },
        design: {
          position: designData.specs.design.position,
          scale: designData.specs.design.scale
        },
        seller: designData.specs.seller,
        customer: designData.specs.customer
      };

      // Add order details
      zip.file('specifications.json', JSON.stringify(orderDetails, null, 2));

      // Generate human-readable summary
      const summary = `
Order Summary
------------
Order ID: ${orderDetails.orderId}
Date: ${new Date(orderDetails.orderDate).toLocaleString()}

Product Details
--------------
Title: ${orderDetails.product.title}
Type: ${orderDetails.product.type}
Color: ${orderDetails.product.color}
Size: ${orderDetails.product.size}
Quantity: ${orderDetails.quantity}
Price: ${orderDetails.price}

Design Details
-------------
Position: X: ${orderDetails.design.position.x}, Y: ${orderDetails.design.position.y}
Scale: ${orderDetails.design.scale}

Seller Information
-----------------
Name: ${orderDetails.seller.name}
Email: ${orderDetails.seller.email}

Customer Information
------------------
Name: ${orderDetails.customer.name}
Email: ${orderDetails.customer.email}
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

      // Download with safe filename
      const fileName = this.generateFileName('design', designData.orderId, designData.itemId);
      saveAs(content, `${fileName}.zip`);

      return true;
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
}

export default DesignDownloader;