// utils/designDownload.jsx
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const DesignDownloader = {
  async downloadSingleDesign(item) {
    try {
      if (!item) {
        throw new Error('No item data available');
      }

      console.log('Processing item for download:', item);

      // Enhanced design image path checking
      const designImage = 
        item.designImage?.url || 
        item.cart?.[0]?.designImage?.url || 
        item.design?.url || 
        item.products?.[0]?.designImage?.url || 
        (Array.isArray(item.cart) && item.cart[0]?.design?.url) ||
        item.cart?.[0]?.designImage;

      if (!designImage) {
        throw new Error('Design image URL not found in order data');
      }

      const zip = new JSZip();

      // Enhanced image download with retry logic
      let imageBlob;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const imageResponse = await fetch(designImage);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch design image: ${imageResponse.statusText}`);
          }
          imageBlob = await imageResponse.blob();
          break;
        } catch (imageError) {
          retryCount++;
          if (retryCount === maxRetries) {
            throw new Error(`Failed to download design image after ${maxRetries} attempts`);
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      zip.file(`design_${item._id || 'unknown'}.png`, imageBlob);

      // Enhanced product details extraction
      const productDetails = item.cart?.[0] || item.products?.[0] || item;
      const designSpecs = productDetails.designSpecs || {};

      // Enhanced specs with more detailed information
      const specs = {
        product: {
          type: productDetails.ProductType || productDetails.productType || 'unknown',
          color: productDetails.ProductColor || productDetails.color || 'white',
          size: productDetails.size || 'default',
          view: productDetails.ProductView || productDetails.view || 'front',
          sku: productDetails.sku || 'unknown',
          basePrice: productDetails.basePrice || 0
        },
        design: {
          title: productDetails.DesignTitle || productDetails.title || `Design_${item._id || 'unknown'}`,
          position: {
            x: designSpecs.positionX || productDetails.DesignPosition?.x || 50,
            y: designSpecs.positionY || productDetails.DesignPosition?.y || 40
          },
          scale: designSpecs.scale || productDetails.DesignScale || 0.8,
          rotation: designSpecs.rotation || 0,
          originalWidth: designSpecs.originalWidth,
          originalHeight: designSpecs.originalHeight
        },
        order: {
          quantity: productDetails.qty || productDetails.quantity || 1,
          itemId: item._id || 'unknown',
          orderDate: item.createdAt || new Date().toISOString(),
          customizations: productDetails.customizations || {},
          notes: productDetails.notes || ''
        },
        printingSpecs: {
          technique: productDetails.printingTechnique || 'default',
          area: productDetails.printingArea || 'front',
          dimensions: productDetails.printDimensions || { width: 0, height: 0 }
        }
      };

      zip.file(`specs_${item._id || 'unknown'}.json`, JSON.stringify(specs, null, 2));

      const content = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 6
        }
      });

      saveAs(content, `design_${item._id || 'unknown'}.zip`);
      return true;

    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },

  async downloadOrderDesigns(order) {
    try {
      if (!order) {
        throw new Error('No order data available');
      }

      const cartItems = order.cart || order.products || [];
      
      if (!cartItems.length) {
        throw new Error('No items found in order');
      }

      const zip = new JSZip();
      const designsFolder = zip.folder("designs");
      
      const results = {
        success: [],
        failed: [],
        metadata: {
          totalItems: cartItems.length,
          processedAt: new Date().toISOString(),
          orderTotal: order.totalPrice || 0
        }
      };

      for (const item of cartItems) {
        try {
          const designImage = 
            item.designImage?.url ||
            item.design?.url ||
            (item.products?.[0]?.designImage?.url) ||
            item.cart?.[0]?.designImage;

          if (!designImage) {
            results.failed.push({
              id: item._id,
              reason: 'Design image URL not found',
              itemDetails: {
                productType: item.ProductType || 'unknown',
                size: item.size || 'unknown'
              }
            });
            continue;
          }

          const imageResponse = await fetch(designImage);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
          }
          const imageBlob = await imageResponse.blob();
          designsFolder.file(`${item._id}/design.png`, imageBlob);

          const designSpecs = item.designSpecs || {};
          
          const specs = {
            product: {
              type: item.ProductType || item.productType || 'unknown',
              color: item.ProductColor || item.color || 'white',
              size: item.size || 'default',
              view: item.ProductView || item.view || 'front',
              sku: item.sku || 'unknown'
            },
            design: {
              title: item.DesignTitle || item.title || `Design_${item._id}`,
              position: {
                x: designSpecs.positionX || 50,
                y: designSpecs.positionY || 40
              },
              scale: designSpecs.scale || 0.8,
              rotation: designSpecs.rotation || 0
            },
            order: {
              quantity: item.qty || item.quantity || 1,
              itemId: item._id,
              orderDate: order.createdAt || new Date().toISOString(),
              price: item.price || 0
            },
            printingSpecs: {
              technique: item.printingTechnique || 'default',
              area: item.printingArea || 'front'
            }
          };

          designsFolder.file(`${item._id}/specs.json`, JSON.stringify(specs, null, 2));
          results.success.push({
            id: item._id,
            productType: item.ProductType || 'unknown',
            designTitle: item.DesignTitle || 'unknown'
          });
        } catch (itemError) {
          results.failed.push({
            id: item._id,
            reason: itemError.message,
            timestamp: new Date().toISOString()
          });
        }
      }

      const summary = {
        orderId: order._id,
        downloadDate: new Date().toISOString(),
        successfulDownloads: results.success,
        failedDownloads: results.failed,
        customerInfo: {
          name: order.user?.name || 'Unknown',
          email: order.user?.email || 'Unknown',
          orderId: order._id || 'Unknown',
          orderDate: order.createdAt || new Date().toISOString()
        },
        statistics: {
          totalItems: cartItems.length,
          successfulItems: results.success.length,
          failedItems: results.failed.length,
          totalAmount: order.totalPrice || 0
        }
      };

      zip.file("download_summary.json", JSON.stringify(summary, null, 2));

      if (results.success.length > 0) {
        const content = await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: {
            level: 6
          }
        });
        saveAs(content, `order_${order._id || 'unknown'}_designs.zip`);
      } else {
        throw new Error('No designs were available for download');
      }

      return results;
    } catch (error) {
      console.error('Order download error:', error);
      throw error;
    }
  }
};


export default DesignDownloader;