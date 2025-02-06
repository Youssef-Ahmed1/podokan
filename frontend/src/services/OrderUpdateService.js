import { server } from '../server';
import { ORDER_ACTIONS } from '../redux/actions/order';


export class OrderUpdateService {
    constructor() {
      this.eventSource = null;
      this.retryCount = 0;
      this.maxRetries = 5;
      this.retryInterval = 5000;
    }
  
    connect(dispatch) {
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
            type: ORDER_ACTIONS.UPDATE_STATUS_SUCCESS,
            payload: data
          });
        } catch (error) {
          console.error('Error processing SSE message:', error);
        }
      };
  
      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        this.eventSource.close();
        
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`Retrying SSE connection (${this.retryCount}/${this.maxRetries})...`);
          setTimeout(() => this.connect(dispatch), this.retryInterval);
        } else {
          console.error('Max SSE retry attempts reached');
          dispatch({
            type: ORDER_ACTIONS.UPDATE_STATUS_FAIL,
            payload: 'Connection failed after maximum retry attempts'
          });
        }
      };
  
      this.eventSource.onopen = () => {
        console.log('SSE connection established');
        this.retryCount = 0;
      };
    }
  
    disconnect() {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    }
  }