import './original.js';
document.querySelectorAll('.evidence-gallery').forEach(gallery=>{
 gallery.querySelectorAll('[data-screen]').forEach(button=>button.addEventListener('click',()=>{
  gallery.querySelectorAll('[data-screen]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  gallery.querySelectorAll('[data-panel]').forEach(panel=>panel.hidden=panel.dataset.panel!==button.dataset.screen);
 }));
});
