/* Motion polish: gentle reveal-on-scroll for cards. Content is visible without JS;
   nothing runs under prefers-reduced-motion. Transform + opacity only. */
(function () {
  'use strict';
  /* Layout guard (runs even with reduced motion): on desktop the take box is pinned bottom-left over the hero.
     If larger text makes it collide with the hero buttons, stack it under them instead of overlapping. */
  (function () {
    var hero = document.querySelector('.hero'), box = document.getElementById('jaredTake'), cta = document.querySelector('.hero-copy .cta');
    if (!hero || !box || !cta) return;
    function check() {
      hero.classList.remove('jt-stack'); if (box.hidden) return;
      if (box.getBoundingClientRect().top < cta.getBoundingClientRect().bottom + 12) hero.classList.add('jt-stack');
    }
    var t; function later() { clearTimeout(t); t = setTimeout(check, 60); }
    addEventListener('resize', later); new MutationObserver(later).observe(box, { attributes: true, childList: true, subtree: true }); later();
  })();
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('rv-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  function arm() {
    var els = document.querySelectorAll('main .card-fact, main .card-op, main .calitem, main h2, main .lab, main .elonbox');
    Array.prototype.forEach.call(els, function (el, i) {
      if (el.classList.contains('rv')) return;
      var r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) return; // already on screen: never hide it
      el.classList.add('rv'); el.style.transitionDelay = (i % 4) * 60 + 'ms'; io.observe(el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm); else arm();
})();
