
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 8080;


const BACKEND_TARGET = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
const FRONTEND_TARGET = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';

// Sử dụng 127.0.0.1 để đảm bảo kết nối nội bộ ổn định hơn trên Windows
app.use('/api', createProxyMiddleware({
  target: BACKEND_TARGET,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.log(`--- Loi Backend: Chua thay backend tai ${BACKEND_TARGET}. Dang thu lai...`);
    res.status(503).send('Backend service is currently unavailable.');
  }
}));

app.use('/', createProxyMiddleware({
  target: FRONTEND_TARGET,
  changeOrigin: true,
  ws: true,
  onError: (err, req, res) => {
    console.log(`--- Loi Frontend: Chua thay frontend tai ${FRONTEND_TARGET}. Dang thu lai...`);
    res.status(503).send('Frontend service is currently unavailable.');
  }
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Gateway dang chay tai: http://127.0.0.1:${PORT}`);
});
