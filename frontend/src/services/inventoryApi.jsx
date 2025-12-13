import api from './api';

export const productAPI = {
  getProducts: () => api.get('/products'),
  getProduct: (id) => api.get(`/products/${id}`), // Might be useful later, though list has data
  addProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
};

export const inventoryAPI = {
  getStock: (id) => api.get(`/inventory/${id}`),
  updateStock: (data) => api.post('/inventory/update', data),
};
