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
          'Accept': 'image/*'
        }
      });

      if (!response.data) {
        throw new Error('No image data received');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching image:', error);
      throw new Error(`Failed to fetch image: ${error.message}`);
    }
  }

  static async downloadSingleDesign(designData) {
    try {
      if (!designData || !designData.imageUrl || !designData.specs) {
        throw new Error('Invalid design data structure');
      }

      const zip = new JSZip();
      
      // Fetch and validate image
      const imageBlob = await this.fetchImageAsBlob(designData.imageUrl);
      if (!imageBlob) {
        throw new Error('Failed to process design image');
      }
      
      // Add design image to zip
      zip.file('design.png', imageBlob);

      // Prepare specifications with error handling
      const specifications = {
        orderInfo: {
          orderId: designData.orderId || 'Unknown',
          orderDate: designData.specs.order?.orderDate || new Date().toISOString(),
          quantity: designData.specs.order?.quantity || 0,
          price: designData.specs.order?.price || 0
        },
        productInfo: {
          type: designData.specs.product?.type || 'N/A',
          color: designData.specs.product?.color || 'N/A',
          size: designData.specs.product?.size || 'N/A'
        },
        designInfo: {
          title: designData.specs.design?.title || 'Untitled',
          position: designData.specs.design?.position || { x: 50, y: 40 },
          scale: designData.specs.design?.scale || 1
        }
      };

      // Add specifications JSON
      zip.file('specifications.json', JSON.stringify(specifications, null, 2));

      // Generate and validate zip
      const content = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 6
        }
      });

      if (!content) {
        throw new Error('Failed to generate zip file');
      }

      // Create safe filename
      const safeFileName = `design_${designData.orderId || 'unknown'}_${designData._id || Date.now()}.zip`
        .replace(/[^a-z0-9_.-]/gi, '_');

      // Download file
      saveAs(content, safeFileName);

      return true;
    } catch (error) {
      console.error('Download error:', error);
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  static async downloadOrderDesigns(order) {
    try {
      if (!order || !order._id || !Array.isArray(order.cart)) {
        throw new Error('Invalid order data');
      }

      const zip = new JSZip();
      const designsFolder = zip.folder("designs");
      
      const summary = {
        orderId: order._id,
        orderDate: order.createdAt || new Date().toISOString(),
        customerInfo: {
          name: order.user?.name || 'Unknown',
          email: order.user?.email || 'Unknown'
        },
        items: [],
        totalItems: 0,
        processedItems: 0
      };

      // Process each item in the cart
      for (const item of order.cart) {
        try {
          if (!item) continue;

          // Get design image URL
          const designImage = typeof item.designImage === 'string' 
            ? item.designImage 
            : item.designImage?.url;

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
              quantity: item.qty || 0
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
            price: item.price || 0,
            quantity: item.qty || 0
          });

          summary.processedItems++;
        } catch (error) {
          console.error(`Failed to process item ${item?._id}:`, error);
        }
      }

      summary.totalItems = order.cart.length;

      // Add summary to zip
      zip.file('order_summary.json', JSON.stringify(summary, null, 2));

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

      // Create safe filename
      const safeFileName = `order_${order._id}_designs.zip`.replace(/[^a-z0-9_.-]/gi, '_');

      // Download file
      saveAs(content, safeFileName);

      return true;
    } catch (error) {
      console.error('Order download error:', error);
      throw new Error(`Order download failed: ${error.message}`);
    }
  }
}

export default DesignDownloader;