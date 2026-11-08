// learnvi tutorials: replay scene animations as they scroll into view, run quizzes, track the current scene.
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var figs = Array.prototype.slice.call(document.querySelectorAll(".fig, .mm"));

  function play(el) {
    el.classList.remove("pending", "play");
    void el.offsetWidth; // restart the CSS animations
    el.classList.add("play");
  }

  if (!reduce && "IntersectionObserver" in window) {
    // only figures that start below the first screen wait for the reader; everything above is shown as is
    var fold = window.innerHeight;
    figs.forEach(function (f) { if (f.getBoundingClientRect().top > fold) f.classList.add("pending"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { play(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });
    figs.forEach(function (f) { if (f.classList.contains("pending")) io.observe(f); });
  }

  document.querySelectorAll(".replay").forEach(function (b) {
    b.addEventListener("click", function () { play(b.closest(".fig")); });
  });

  // quizzes: pick an option, or reveal
  document.querySelectorAll(".quiz").forEach(function (q) {
    var answer = Number(q.getAttribute("data-answer"));
    var opts = q.querySelectorAll(".opt");
    var explain = q.querySelector(".explain");
    var reveal = q.querySelector(".reveal");
    function settle(picked) {
      opts.forEach(function (o, i) {
        o.disabled = true;
        if (i === answer) o.classList.add("right");
        else if (i === picked) o.classList.add("wrong");
      });
      var lead = explain.querySelector("strong");
      lead.textContent = picked === undefined ? "Answer: " + opts[answer].textContent.slice(1).trim() + "." : picked === answer ? "Correct." : "Not quite. It's " + opts[answer].textContent.slice(1).trim() + ".";
      explain.hidden = false;
      reveal.hidden = true;
    }
    opts.forEach(function (o, i) { o.addEventListener("click", function () { settle(i); }); });
    reveal.addEventListener("click", function () { settle(undefined); });
  });

  // scene list: highlight the scene being read
  var links = {};
  document.querySelectorAll(".toc a").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
  if ("IntersectionObserver" in window && Object.keys(links).length) {
    var cur;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (cur) cur.classList.remove("on");
        cur = links[e.target.id];
        if (cur) cur.classList.add("on");
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    document.querySelectorAll(".scene").forEach(function (s) { spy.observe(s); });
  }
})();
