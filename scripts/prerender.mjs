import {readFile,writeFile,mkdir,unlink} from 'node:fs/promises';
import {render,renderHome} from '../.build/entry-server.js';
let home=await readFile('dist/index.html','utf8');

await writeFile('dist/index.html',home.replace('<!--home-html-->',renderHome()).replace('</head>','<link rel="stylesheet" href="/assets/theme.css"></head>'));
const template=(await readFile('dist/case.html','utf8')).replace('</head>','<link rel="stylesheet" href="/assets/theme.css"></head>');
for(const route of ['/work/b2c','/work/opsgate','/work/operations','/work/visualization','/work/website-cms','/work/recon-desk','/work/sales-crm','/lite','/404']){
 const dir=`dist${route}`;await mkdir(dir,{recursive:true});
 const title=route==='/lite'?'Lite reading version':route==='/404'?'Page not found':route.includes('sales-crm')?'Sales CRM & Browser Telephony':route.includes('recon-desk')?'Recon Desk':route.includes('visualization')?'Project Visualization Library':route.includes('website-cms')?'Public Brand Website & CMS':'Internal Operations Platform';
 let html=template.replace('<!--app-html-->',render(route)).replace(/<title>.*?<\/title>/,`<title>${title} — Interactive Edition</title>`).replace('</head>',`<link rel="canonical" href="https://ankit-interactive-v2.black-macaw-1189.chatgpt.site${route}"></head>`);
 if(route==='/lite')html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link[^>]*rel="modulepreload"[^>]*>/g,'').replace(/<button class="theme-toggle"[\s\S]*?<\/button>/g,'');
 await writeFile(`${dir}/index.html`,html);if(route==='/404')await writeFile('dist/404.html',html);
}
await unlink('dist/case.html');
console.log('Prerendered interactive v2 homepage, project details, lite and 404.');
