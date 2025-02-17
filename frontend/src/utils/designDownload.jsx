// utils/designDownload.js
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import axios from 'axios';

export class DesignDownloader {
  static async fetchImageAsBlob(imageUrl) {
    try {
      // Remove withCredentials to avoid CORS issues with Cloudinary
      const response = await axios.get(imageUrl, {
        responseType: 'blob',
        withCredentials: false,
        headers: {
          'Accept': 'image/*',
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching image:', error);
      throw new Error('Failed to fetch image');
    }
  }

  static async downloadSingleDesign(designData) {
    try {
      const zip = new JSZip();
      
      // Fetch the image
      const imageBlob = await this.fetchImageAsBlob(designData.imageUrl);
      
      // Add design image to zip
      zip.file(`design.png`, imageBlob);

      // Add specifications JSON
      zip.file('specifications.json', JSON.stringify({
        orderInfo: {
          orderId: designData.orderId,
          orderDate: designData.specs.order.orderDate,
          quantity: designData.specs.order.quantity,
          price: designData.specs.order.price
        },
        productInfo: {
          type: designData.specs.product.type,
          color: designData.specs.product.color,
          size: designData.specs.product.size
        },
        designInfo: {
          title: designData.specs.design.title,
          position: designData.specs.design.position,
          scale: designData.specs.design.scale
        }
      }, null, 2));

      // Generate and download zip
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `design_${designData.orderId}_${designData._id}.zip`);

      return true;
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
  static async downloadOrderDesigns(order) {
    try {
      const zip = new JSZip();
      const designsFolder = zip.folder("designs");
      
      const summary = {
        orderId: order._id,
        orderDate: order.createdAt,
        customerInfo: {
          name: order.user?.name || 'Unknown',
          email: order.user?.email || 'Unknown'
        },
        items: []
      };

      for (const item of order.cart) {
        try {
          let designImage = '';
          if (typeof item.designImage === 'string') {
            designImage = item.designImage;
          } else if (item.designImage?.url) {
            designImage = item.designImage.url;
          }

          if (!designImage) {
            continue;
          }

          const imageBlob = await this.fetchImageAsBlob(designImage);
          const itemFolder = designsFolder.folder(item._id);
          
          itemFolder.file('design.png', imageBlob);
          
          const itemSpecs = {
            productInfo: {
              title: item.DesignTitle,
              type: item.ProductType,
              color: item.ProductColor,
              quantity: item.qty
            },
            designSpecs: {
              position: item.DesignPosition || { x: 50, y: 40 },
              scale: item.DesignScale || 1
            },
            pricing: {
              price: item.price
            }
          };

          itemFolder.file('specs.json', JSON.stringify(itemSpecs, null, 2));
          
          summary.items.push({
            id: item._id,
            title: item.DesignTitle,
            type: item.ProductType,
            price: item.price,
            quantity: item.qty
          });
        } catch (error) {
          console.error(`Failed to process item ${item._id}:`, error);
        }
      }

      zip.file('order_summary.json', JSON.stringify(summary, null, 2));

      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 6
        }
      });

      saveAs(content, `order_${order._id}_designs.zip`);
      return true;
    } catch (error) {
      console.error('Order download error:', error);
      throw error;
    }
  }
}

export default DesignDownloader;