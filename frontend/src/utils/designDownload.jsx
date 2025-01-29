// utils/designDownload.js
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const DesignDownloader = {
    async downloadSingleDesign(item) {
      try {
        // Check if item exists
        if (!item) {
          throw new Error('No item data available');
        }
  
        // Check for required design data
        const designImage = item.designImage?.url || item.design?.url || item.designUrl;
        if (!designImage) {
          throw new Error('Design image URL not found in order data');
        }
  
        const zip = new JSZip();
  
        // Add design image with error handling
        try {
          const imageResponse = await fetch(designImage);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch design image: ${imageResponse.statusText}`);
          }
          const imageBlob = await imageResponse.blob();
          zip.file(`design_${item._id || 'unknown'}.png`, imageBlob);
        } catch (imageError) {
          console.error('Image download error:', imageError);
          throw new Error('Failed to download design image');
        }
  
        // Create specs JSON with fallback values
        const specs = {
          product: {
            type: item.ProductType || item.productType || 'unknown',
            color: item.ProductColor || item.color || 'white',
            size: item.size || 'default',
            view: item.ProductView || item.view || 'front'
          },
          design: {
            title: item.DesignTitle || item.title || `Design_${item._id || 'unknown'}`,
            position: item.DesignPosition || item.position || { x: 50, y: 40 },
            scale: item.DesignScale || item.scale || 0.8
          },
          order: {
            quantity: item.qty || item.quantity || 1,
            itemId: item._id || 'unknown'
          }
        };
  
        zip.file(`specs_${item._id || 'unknown'}.json`, JSON.stringify(specs, null, 2));
  
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `design_${item._id || 'unknown'}.zip`);
  
        return true;
      } catch (error) {
        console.error('Download error:', error);
        throw error;
      }
    },
  
    async downloadOrderDesigns(order) {
      try {
        if (!order?.cart || !Array.isArray(order.cart)) {
          throw new Error('No valid order items found');
        }
  
        const zip = new JSZip();
        const designsFolder = zip.folder("designs");
        
        // Track successful and failed downloads
        const results = {
          success: [],
          failed: []
        };
  
        // Process each design
        for (const item of order.cart) {
          try {
            const designImage = item.designImage?.url || item.design?.url || item.designUrl;
            if (!designImage) {
              results.failed.push({
                id: item._id,
                reason: 'Design image URL not found'
              });
              continue;
            }
  
            // Download image
            const imageResponse = await fetch(designImage);
            if (!imageResponse.ok) {
              throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
            }
            const imageBlob = await imageResponse.blob();
            designsFolder.file(`${item._id}/design.png`, imageBlob);
  
            // Create specs
            const specs = {
              product: {
                type: item.ProductType || item.productType || 'unknown',
                color: item.ProductColor || item.color || 'white',
                size: item.size || 'default',
                view: item.ProductView || item.view || 'front'
              },
              design: {
                title: item.DesignTitle || item.title || `Design_${item._id}`,
                position: item.DesignPosition || item.position || { x: 50, y: 40 },
                scale: item.DesignScale || item.scale || 0.8
              },
              order: {
                quantity: item.qty || item.quantity || 1,
                itemId: item._id
              }
            };
  
            designsFolder.file(`${item._id}/specs.json`, JSON.stringify(specs, null, 2));
            results.success.push(item._id);
          } catch (itemError) {
            results.failed.push({
              id: item._id,
              reason: itemError.message
            });
          }
        }
  
        // Add download summary
        const summary = {
          orderId: order._id,
          downloadDate: new Date().toISOString(),
          successfulDownloads: results.success,
          failedDownloads: results.failed,
          customerInfo: {
            name: order.user?.name || 'Unknown',
            orderId: order._id || 'Unknown',
            orderDate: order.createdAt || new Date().toISOString()
          }
        };
  
        zip.file("download_summary.json", JSON.stringify(summary, null, 2));
  
        // Generate and download zip
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `order_${order._id || 'unknown'}_designs.zip`);
  
        // Return results for potential UI updates
        return results;
      } catch (error) {
        console.error('Order download error:', error);
        throw error;
      }
    }
  };
  