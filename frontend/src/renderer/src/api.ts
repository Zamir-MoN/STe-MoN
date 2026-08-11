import axios from 'axios'

const api = axios.create({
  baseURL: 'http://13.212.175.6:4050/api',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('steamhub_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    console.error("AXIOS ERROR:", error.message, error.code, error.config?.url);
    if (error.response) {
      console.error("RESPONSE DATA:", error.response.data);
    }
    return Promise.reject(error);
  }
)

export default api
