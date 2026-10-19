import postcss from 'postcss';
import {readFile,writeFile} from 'node:fs/promises';
const css=postcss.parse(await readFile('src/style.css','utf8'));
css.walkAtRules('font-face',r=>r.remove());
css.walkRules(rule=>{
 if(rule.parent.type==='atrule'&&/keyframes/.test(rule.parent.name))return;
 if(rule.selectors.some(s=>s.includes(':root'))){rule.remove();return;}
 rule.selectors=rule.selectors.map(s=>'.v2-lab '+s);
});
await writeFile('public/assets/lab.css',css.toString());
