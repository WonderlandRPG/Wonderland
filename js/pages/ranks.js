"use strict";

document.addEventListener("DOMContentLoaded",()=>{
  const cards=[...document.querySelectorAll(".rank-card")];
  if(!cards.length)return;
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add("rank-visible");observer.unobserve(entry.target)}
    });
  },{threshold:.16});
  cards.forEach(card=>observer.observe(card));
});
