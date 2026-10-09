import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleGeminiApi } from './server/gemini.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const dist=path.join(root,'dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer(async(req,res)=>{
  if(req.url?.startsWith('/api/analyze')){await handleGeminiApi(req,res);return;}
  if(req.url==='/_app/health'){res.statusCode=200;res.setHeader('Content-Type','text/plain');res.end('ok');return;}
  const pathname=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`).pathname;
  const requested=path.resolve(dist,`.${pathname}`); const file=fs.existsSync(requested)&&fs.statSync(requested).isFile()?requested:path.join(dist,'index.html');
  fs.createReadStream(file).on('error',()=>{res.statusCode=404;res.end('Not found');}).on('open',()=>{res.statusCode=200;res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');}).pipe(res);
});
const port=Number(process.env.PORT||3000);server.listen(port,'0.0.0.0',()=>console.log(`Briefme server listening on ${port}`));
