// Gloss Lab: before/after wipe, process line, stacking packages, live quote builder.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- quote builder ---------- */
const q = document.querySelector('.quote');
const fmt = n => 'TT$' + (Math.round(n / 10) * 10).toLocaleString('en-US');
function total() {
  const base = +q.pkg.value * +q.size.value;
  const adds = [...q.querySelectorAll('[name=add]:checked')].reduce((s, c) => s + +c.value, 0);
  const out = q.querySelector('output[name=total]');
  const next = base + adds, prev = +(out.dataset.v || next);
  out.dataset.v = next;
  if (reduce || !window.gsap) return (out.value = fmt(next));
  const o = { v: prev };
  gsap.to(o, { v: next, duration: .5, ease: 'power2.out', onUpdate: () => (out.value = fmt(o.v)) });
}
q.addEventListener('change', total);
q.date.min = new Date().toISOString().slice(0, 10);
q.addEventListener('submit', e => {
  e.preventDefault();
  const bad = ['name', 'phone'].filter(n => !q[n].value.trim() || (n === 'phone' && q.phone.value.replace(/\D/g, '').length < 7));
  ['name', 'phone'].forEach(n => q[n].setAttribute('aria-invalid', bad.includes(n)));
  q.querySelector('.err').hidden = !bad.length;
  if (bad.length) return q[bad[0]].focus();
  q.querySelector('.done').hidden = false;
});
total();

/* ---------- motion ---------- */
if (!reduce && window.gsap) {
  gsap.registerPlugin(ScrollTrigger);

  // smooth wheel scrolling, driven by GSAP's ticker so scrubbed effects move in step with it
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: .1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const el = document.querySelector(a.getAttribute('href'));
      if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -68 }); }
    }));
  }

  // hero: lights come up, copy slides in; on scroll the car pushes in and the copy lifts away
  gsap.timeline()
    .from('.hero-bg img', { scale: 1.15, filter: 'brightness(.2)', duration: 2.2, ease: 'power2.out', clearProps: 'filter' })
    .from('.hero h1, .hero p, .hero .ctas', { y: 40, opacity: 0, stagger: .12, duration: .9, ease: 'power3.out' }, .5);
  gsap.to('.hero-bg img', { scale: 1.12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-copy', { y: -120, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 30%', scrub: true } });

  // before/after: scroll drags the wipe from right to left, a sheen sweeps the clean side.
  // Only transforms animate here (no clip-path, filters or layout), so it stays on the GPU.
  const stage = document.querySelector('.ba-stage');
  gsap.set('.ba-after', { x: 0, xPercent: 100 });
  gsap.set('.ba-after-in', { x: 0, xPercent: -100 });
  gsap.set('.ba-line', { left: 0 });
  gsap.timeline({ scrollTrigger: { trigger: '.ba', start: 'top top', end: '+=140%', pin: true, scrub: .6, invalidateOnRefresh: true } })
    .to('.ba-after', { xPercent: 0, ease: 'none' })
    .to('.ba-after-in', { xPercent: 0, ease: 'none' }, 0)
    .fromTo('.ba-line', { x: () => stage.clientWidth - 2 }, { x: 0, ease: 'none' }, 0)
    .to('.ba-sheen', { xPercent: 60, ease: 'none' }, 0)
    .to('.ba-line', { opacity: 0, duration: .08 }, .92);

  // process: the lime line draws down as each step comes in
  gsap.to('.proc-line .fill', { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.proc', start: 'top 60%', end: 'bottom 60%', scrub: true } });
  gsap.utils.toArray('.pstep').forEach(s => {
    gsap.from(s.querySelector('img'), { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'power3.inOut', scrollTrigger: { trigger: s, start: 'top 75%' } });
    gsap.from(s.querySelector('div').children, { x: 30, opacity: 0, stagger: .1, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 70%' } });
  });

  // packages: earlier cards recede as the next one slides over them
  const cards = gsap.utils.toArray('.pkg');
  cards.forEach((c, i) => {
    if (i === cards.length - 1) return;
    gsap.to(c, { scale: .92, filter: 'brightness(.45)', ease: 'none', scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 96px', scrub: true } });
  });

  gsap.from('.quote, .book-side', { y: 60, opacity: 0, stagger: .15, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.book', start: 'top 75%' } });
}
