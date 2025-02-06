// Create new file: src/utils/orderStatusUpdate.js
export class OrderStatusUpdates {
    constructor() {
      this.eventSource = null;
      this.retryCount = 0;
      this.maxRetries = 5;
      this.retryInterval = 5000;
    }
  
    initialize(dispatch) {
      if (this.eventSource) {
        this.eventSource.close();
      }
  
      this.eventSource = new EventSource(`${server}/order/status-updates`, {
        withCredentials: true
      });
  
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          dispatch({
            type: "updateOrderStatus",
            payload: data
          });
        } catch (error) {
          console.error('SSE message processing error:', error);
        }
      };
  
      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        this.eventSource.close();
        
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          setTimeout(() => this.initialize(dispatch), this.retryInterval);
        }
      };
  
      this.eventSource.onopen = () => {
        this.retryCount = 0;
      };
    }
  
    cleanup() {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    }
  }
  
  export const orderStatusUpdates = new OrderStatusUpdates();