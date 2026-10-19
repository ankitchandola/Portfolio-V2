import {defineConfig} from 'vite';
import mdx from '@mdx-js/rollup';
import {resolve} from 'node:path';
// Production builds fill the placeholder in scripts/prerender.mjs.
const devHome={name:'dev-home-markup',apply:'serve',transformIndexHtml:{order:'pre',async handler(html,{server}){if(!html.includes('<!--home-html-->'))return html;const {renderHome}=await server.ssrLoadModule('/src/entry-server.jsx');return html.replace('<!--home-html-->',renderHome());}}};
export default defineConfig(({isSsrBuild})=>({plugins:[mdx(),devHome],esbuild:{jsx:'automatic'},build:{target:'es2022',rollupOptions:isSsrBuild?{}:{input:{main:resolve('index.html'),case:resolve('case.html')}}}}));
