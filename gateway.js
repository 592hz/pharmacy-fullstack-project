
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 8080;

// Sử dụng 127.0.0.1 để đảm bảo kết nối nội bộ ổn định hơn trên Windows
app.use('/api', createProxyMiddleware({
  target: 'http://127.0.0.1:5000',
  changeOrigin: true,
  onError: (err, req, res) => {
    console.log('--- Loi Backend: Chua thay cong 5000 mo. Dang thu lai...');
  }
}));

app.use('/', createProxyMiddleware({
  target: 'http://127.0.0.1:5173',
  changeOrigin: true,
  ws: true,
  onError: (err, req, res) => {
    console.log('--- Loi Frontend: Chua thay cong 5173 mo. Dang thu lai...');
  }
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Gateway dang chay tai: http://127.0.0.1:${PORT}`);
});
