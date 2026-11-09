(() => {
  'use strict';
  const search=document.querySelector('[data-tool-search]');
  const buttons=[...document.querySelectorAll('[data-filter]')];
  const cards=[...document.querySelectorAll('.tool-directory-card')];
  const count=document.querySelector('[data-tool-count]');
  const empty=document.querySelector('[data-no-results]');
  if(!search||!cards.length)return;
  let category='all';
  const apply=()=>{
    const q=search.value.trim().toLowerCase();
    let visible=0;
    cards.forEach(card=>{
      const matchCategory=category==='all'||card.dataset.category===category;
      const matchSearch=!q||card.dataset.search.includes(q);
      card.hidden=!(matchCategory&&matchSearch);
      if(!card.hidden)visible++;
    });
    count.textContent=`Showing ${visible} of ${cards.length} tools`;
    empty.hidden=visible!==0;
  };
  search.addEventListener('input',apply);
  buttons.forEach(button=>button.addEventListener('click',()=>{
    category=button.dataset.filter;
    buttons.forEach(b=>{b.classList.toggle('is-active',b===button);b.setAttribute('aria-pressed',String(b===button));});
    apply();
  }));
  apply();
})();
