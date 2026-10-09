import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { handleGeminiApi } from './server/gemini.mjs';

const geminiDevApi=():Plugin=>({name:'briefme-gemini-dev-api',configureServer(server){server.middlewares.use('/api/analyze',(req,res)=>{void handleGeminiApi(req,res);});}});
export default defineConfig({plugins:[react(),geminiDevApi()],server:{port:3000,host:'0.0.0.0'},build:{outDir:'dist'}});
