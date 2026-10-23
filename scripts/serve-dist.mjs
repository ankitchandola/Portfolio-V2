import { access, readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';

const root = resolve('dist');
const port = Number(process.env.PORT ?? 4173);
const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.woff', 'font/woff'],
  ['.pdf', 'application/pdf'],
  ['.xml', 'application/xml'],
  ['.txt', 'text/plain; charset=utf-8'],
]);

await access(join(root, 'index.html'));
createServer((request, response) => {
  const serve = async () => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    let path;
    try {
      path = decodeURIComponent(
        new URL(request.url ?? '/', 'http://localhost').pathname,
      );
    } catch (error) {
      if (!(error instanceof URIError || error instanceof TypeError))
        throw error;
      response.writeHead(400).end('Invalid URL');
      return;
    }
    let file = resolve(root, '.' + path);
    if (file !== root && !file.startsWith(root + sep)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    let status = 200;
    let body;
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      body = await readFile(file);
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !('code' in error) ||
        (error.code !== 'ENOENT' && error.code !== 'ENOTDIR')
      )
        throw error;
      status = 404;
      file = join(root, '404.html');
      body = await readFile(file);
    }
    response.writeHead(status, {
      'Content-Type': types.get(extname(file)) ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  };
  serve().catch((error) => {
    console.error(error);
    response.writeHead(500).end('Internal server error');
  });
}).listen(port, '127.0.0.1', () => {
  console.log(`Serving dist at http://127.0.0.1:${port}`);
});
