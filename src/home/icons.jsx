import React from 'react';
const shapes={
 'arrow-up-right':<><path d="M7 7h10v10"/><path d="M7 17 17 7"/></>,
 'arrow-down-right':<><path d="m7 7 10 10"/><path d="M17 7v10H7"/></>,
 'arrow-down':<><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></>,
 'arrow-up':<><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></>,
 asterisk:<><path d="M12 6v12"/><path d="M17.196 9 6.804 15"/><path d="m6.804 9 10.392 6"/></>,
 github:<><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></>,
 linkedin:<><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect height="12" width="4" x="2" y="9"/><circle cx="4" cy="4" r="2"/></>,
};
export function Icon({name}){return <svg aria-hidden="true" className={'icon icon-'+name} fill="none" focusable="false" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">{shapes[name]}</svg>}
export function LinkArrow(){return <svg className="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 7h10v10M7 17 17 7"/></svg>}
