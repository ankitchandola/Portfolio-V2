import {defineConfig} from 'vite';
import mdx from '@mdx-js/rollup';
import {resolve} from 'node:path';
export default defineConfig(({isSsrBuild})=>({plugins:[mdx()],esbuild:{jsx:'automatic'},build:{target:'es2022',rollupOptions:isSsrBuild?{}:{input:{main:resolve('index.html'),case:resolve('case.html')}}}}));
