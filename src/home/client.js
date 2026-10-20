import './interactions.js';
document.querySelectorAll('.evidence-gallery').forEach(gallery=>{
 gallery.querySelectorAll('[data-screen]').forEach(button=>button.addEventListener('click',()=>{
  gallery.querySelectorAll('[data-screen]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  gallery.querySelectorAll('[data-panel]').forEach(panel=>panel.hidden=panel.dataset.panel!==button.dataset.screen);
 }));
});
const motionOff=matchMedia('(prefers-reduced-motion: reduce)').matches||(()=>{try{return localStorage.getItem('ankit-motion-paused')==='true';}catch{return false;}})();
if(!motionOff&&'IntersectionObserver' in window){
 // Classes are removed after the entrance so hover and sticky styles on the children apply normally again.
 const reveal=new IntersectionObserver(entries=>entries.forEach(({isIntersecting,target})=>{
  if(!isIntersecting)return;
  reveal.unobserve(target);
  target.classList.add('revealed');
  setTimeout(()=>target.classList.remove('reveal','revealed'),520+target.children.length*70);
 }),{rootMargin:'0px 0px -10% 0px'});
 document.querySelectorAll('.section-intro,.integrated-project,.about-grid,.decision-list').forEach(group=>{
  if(group.getBoundingClientRect().top<innerHeight)return;
  [...group.children].forEach((child,i)=>child.style.setProperty('--reveal-delay',i*70+'ms'));
  group.classList.add('reveal');
  reveal.observe(group);
 });
}
