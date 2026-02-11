import http from 'http';

const port = Number(process.env.PORT) || 5000;

const app = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<html><body><h1>Test server works!</h1></body></html>\n');
});

app.listen(port, '0.0.0.0', () => {
  console.log('test server on', port);
});
