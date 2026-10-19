import {readFile,writeFile,mkdir,unlink} from 'node:fs/promises';
import {render,renderHome} from '../.build/entry-server.js';
import projects from '../src/content/projects.json' with {type:'json'};
const site='https://ankitchandola.github.io';
let home=await readFile('dist/index.html','utf8');

await writeFile('dist/index.html',home.replace('<!--home-html-->',renderHome()).replace('</head>','<link rel="stylesheet" href="/assets/theme.css"></head>'));
const template=(await readFile('dist/case.html','utf8')).replace('</head>','<link rel="stylesheet" href="/assets/theme.css"></head>');
const titles=Object.fromEntries([...projects.map(p=>['/work/'+p.slug,p.name]),['/lite','Lite reading version'],['/404','Page not found']]);
for(const [route,title] of Object.entries(titles)){
 const dir=`dist${route}`;await mkdir(dir,{recursive:true});
 let html=template.replace('<!--app-html-->',render(route)).replace(/<title>.*?<\/title>/,`<title>${title} — Interactive Edition</title>`);
 if(route!=='/404')html=html.replace('</head>',`<link rel="canonical" href="${site}${route}/"></head>`);
 if(route==='/lite')html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link[^>]*rel="modulepreload"[^>]*>/g,'').replace(/<button class="theme-toggle"[\s\S]*?<\/button>/g,'');
 await writeFile(`${dir}/index.html`,html);if(route==='/404')await writeFile('dist/404.html',html);
}
await unlink('dist/case.html');
const pages=['/',...Object.keys(titles).filter(route=>route!=='/404').map(route=>route+'/')];
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(p=>`<url><loc>${site}${p}</loc></url>`).join('')}</urlset>\n`);
console.log('Prerendered interactive v2 homepage, project details, lite, 404 and sitemap.');
