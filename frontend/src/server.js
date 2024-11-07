export const server = "https://testpodokan.store/api/v2";
export const backend_url = "https://testpodokan.store";


axios.defaults.withCredentials = true;
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Clear tokens on unauthorized
        localStorage.removeItem('token');
        localStorage.removeItem('seller_token');
        delete axios.defaults.headers.common['Authorization'];
        delete axios.defaults.headers.common['Seller-Authorization'];
      }
      return Promise.reject(error);
    }
  );
