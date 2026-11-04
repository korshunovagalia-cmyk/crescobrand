/* Cresco — scroll reveal + mobile navigation. No dependencies. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- hero title typewriter --------------------------------------------- */
  var typeEl = document.querySelector('.type');

  if (typeEl && !reduced) {
    // capture the original nodes (text + any <br> line breaks) before
    // clearing, so forced line breaks in the markup survive the rebuild
    var sourceNodes = Array.prototype.slice.call(typeEl.childNodes);
    typeEl.textContent = '';
    var chars = [];

    sourceNodes.forEach(function (node) {
      if (node.nodeName === 'BR') {
        chars.push(typeEl.appendChild(node.cloneNode(false)));
      } else {
        Array.prototype.forEach.call(node.textContent, function (ch) {
          var span = document.createElement('span');
          span.className = 'char';
          span.textContent = ch;
          typeEl.appendChild(span);
          chars.push(span);
        });
      }
    });

    var cursor = document.createElement('span');
    cursor.className = 'type-cursor is-on';
    cursor.setAttribute('aria-hidden', 'true');
    typeEl.insertBefore(cursor, chars[0]);

    var i = 0;
    function typeNext() {
      if (i >= chars.length) {
        window.setTimeout(function () {
          cursor.classList.remove('is-on');
        }, 900);
        return;
      }
      var node = chars[i];
      if (node.nodeName !== 'BR') node.classList.add('is-shown');
      typeEl.insertBefore(cursor, node.nextSibling);
      i++;
      window.setTimeout(typeNext, node.nodeName === 'BR' ? 90 : 16 + Math.random() * 28);
    }
    window.setTimeout(typeNext, 300);
  }

  /* --- reveal on scroll ------------------------------------------------ */
  var targets = document.querySelectorAll('.reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(targets, function (el) {
      el.classList.add('is-in');
    });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    Array.prototype.forEach.call(targets, function (el) {
      observer.observe(el);
    });
  }

  /* --- scroll-linked statement weight ------------------------------------
     As the statement travels up the screen its rows turn bold one after
     another, top to bottom; once it has passed, all rows go thin. */
  var weightBlocks = document.querySelectorAll('[data-weight-scroll]');

  if (weightBlocks.length && !reduced) {
    var updateWeights = function () {
      var vh = window.innerHeight;
      Array.prototype.forEach.call(weightBlocks, function (block) {
        var rows = block.querySelectorAll('.big-line__row');
        var rect = block.getBoundingClientRect();
        // 0 when the block's centre is at the bottom edge, 1 at the top edge
        var t = 1 - (rect.top + rect.height / 2) / vh;
        // first row until 0.4, then each following row for a 0.15 step
        var active = t < 0.4 ? 0 : Math.floor((t - 0.4) / 0.15) + 1;
        if (active >= rows.length) active = -1;
        Array.prototype.forEach.call(rows, function (row, i) {
          row.classList.toggle('is-bold', i === active);
        });
      });
      weightTicking = false;
    };

    var weightTicking = false;
    window.addEventListener('scroll', function () {
      if (weightTicking) return;
      weightTicking = true;
      window.requestAnimationFrame(updateWeights);
    }, { passive: true });
    window.addEventListener('resize', updateWeights);
    updateWeights();
  }

  /* --- scroll-linked marquee -------------------------------------------- */
  var tracks = document.querySelectorAll('[data-marquee-track]');

  if (tracks.length && !reduced) {
    var state = Array.prototype.map.call(tracks, function (track) {
      return { track: track, section: track.closest('.marquee-section'), max: 0 };
    });

    var measure = function () {
      state.forEach(function (s) {
        s.max = Math.max(0, s.track.scrollWidth - s.section.clientWidth);
      });
    };

    var apply = function () {
      var vh = window.innerHeight;
      state.forEach(function (s) {
        var rect = s.section.getBoundingClientRect();
        var progress = (vh - rect.top) / (vh + rect.height);
        progress = Math.min(1, Math.max(0, progress));
        s.track.style.transform = 'translateX(-' + (progress * s.max) + 'px)';
      });
      ticking = false;
    };

    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(apply);
    };

    measure();
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { measure(); apply(); });
  }

  /* --- showreel: stopped by default; the button plays it with sound,
         clicking the video pauses it (no native controls overlay) -------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-showreel]'), function (reel) {
    var video = reel.querySelector('video');
    var btn = reel.querySelector('.showreel__btn');
    if (!video || !btn) return;

    btn.addEventListener('click', function () {
      reel.classList.add('is-playing', 'is-started');
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    });

    video.addEventListener('click', function () {
      if (video.paused) return;
      video.pause();
      reel.classList.remove('is-playing');
    });

    video.addEventListener('ended', function () {
      reel.classList.remove('is-playing', 'is-started');
      video.currentTime = 0;
    });
  });

  /* --- mobile navigation ----------------------------------------------- */
  var toggle = document.querySelector('.nav__toggle');
  var overlay = document.querySelector('.nav__overlay');
  if (!toggle || !overlay) return;

  function setOpen(open) {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
  }

  toggle.addEventListener('click', function () {
    setOpen(!document.body.classList.contains('nav-open'));
  });

  overlay.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 860) setOpen(false);
  });
})();
