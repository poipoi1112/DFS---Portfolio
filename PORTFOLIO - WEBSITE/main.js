"use strict";

const SETTINGS = {
  maxSpinDegPerSec: 720,
  scrollSpinFactor: 0.5,
  cursorEase: 0.18,
  heroTitleWidth: 0.94,
};

const $  = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const pad = (n, size = 2) => String(n).padStart(size, "0");

document.documentElement.classList.add("js");

function buildSkills() {
  const list = $("#skills-list");
  PORTFOLIO_DATA.skills.forEach((skill, i) => {
    const row = make("li");
    row.append(
      make("span", "skill__id", `S.${pad(i + 1)}`),
      make("span", "skill__name", skill.name),
      make("span", "skill__note", skill.note)
    );

    const bars = make("span", "bars");
    for (let b = 1; b <= 5; b++) {
      bars.append(make("i", b <= skill.level ? "" : "is-empty"));
    }
    row.append(bars);
    list.append(row);
  });

  const tools = $("#tools-list");
  PORTFOLIO_DATA.tools.forEach((tool) => tools.append(make("li", "", tool)));
}

function buildCertificates() {
  const list = $("#certs-list");
  PORTFOLIO_DATA.certificates.forEach((cert) => {
    const row = make("li");
    const verify = make("a", "cert__verify", "Verify ↗");
    verify.href = cert.link || "#";
    verify.target = "_blank";
    verify.rel = "noopener";

    row.append(
      make("span", "cert__year", `[${cert.year}]`),
      make("span", "cert__name", cert.name),
      make("span", "cert__issuer", cert.issuer),
      verify
    );
    list.append(row);
  });
}

buildSkills();
buildCertificates();


const heroTitle = $(".hero__title");
const heroLines = $$(".hero__line", heroTitle);

function fitHeroTitle() {
  const available = heroTitle.parentElement.clientWidth * SETTINGS.heroTitleWidth;
  heroTitle.style.fontSize = "100px";

  const widest = Math.max(
    ...heroLines.map((line) => {
      const range = document.createRange();
      range.selectNodeContents(line);
      return range.getBoundingClientRect().width;
    })
  );

  if (widest > 0) heroTitle.style.fontSize = `${(100 * available) / widest}px`;
}

fitHeroTitle();
window.addEventListener("resize", fitHeroTitle);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHeroTitle);


const blades = $("#blades");
const speedSlider = $("#fan-speed");
const rpmReadout = $("#fan-rpm");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let angle = 0;
let lastTime = performance.now();
let lastScrollY = window.scrollY;
let shownRpm = 0;

function spin(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1) || 0.016;
  lastTime = now;

  const scrollDelta = window.scrollY - lastScrollY;
  lastScrollY = window.scrollY;

  const autoSpeed = reduceMotion ? 0 : (speedSlider.value / 100) * SETTINGS.maxSpinDegPerSec;
  const step = autoSpeed * dt + scrollDelta * SETTINGS.scrollSpinFactor;
  angle += step;
  blades.setAttribute("transform", `rotate(${angle} 100 100)`);

  const rpm = Math.abs(step / dt) / 6;
  shownRpm += (rpm - shownRpm) * 0.12;
  rpmReadout.textContent = pad(Math.round(shownRpm), 4);

  requestAnimationFrame(spin);
}
requestAnimationFrame(spin);


const cursor = $("#cursor");
const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (cursor && hasMouse) {
  let targetX = window.innerWidth / 2, targetY = window.innerHeight / 2;
  let x = targetX, y = targetY;

  window.addEventListener("mousemove", (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  });

  (function follow() {
    x += (targetX - x) * SETTINGS.cursorEase;
    y += (targetY - y) * SETTINGS.cursorEase;
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    requestAnimationFrame(follow);
  })();

  const hoverables = "a, button, input, .certs li, .tags li";
  document.addEventListener("mouseover", (e) => cursor.classList.toggle("is-hover", !!e.target.closest(hoverables)));
}


const navLinks = $$(".nav__link");
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) =>
        link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`)
      );
    });
  },
  { rootMargin: "-40% 0px -55% 0px" }
);
$$("main section[id]").forEach((section) => sectionObserver.observe(section));


const REVEAL_TARGETS = [
  ".section__head", ".about__figure", ".about__text",
  ".skills li", ".tags", ".certs li",
  ".contact > *", ".footer",
];

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const node = entry.target;
      node.classList.add("is-visible");
      revealObserver.unobserve(node);
      setTimeout(() => {
        node.classList.remove("reveal", "is-visible");
        node.style.transitionDelay = "";
      }, 1200);
    });
  },
  { threshold: 0.12 }
);

$$(REVEAL_TARGETS.join(", ")).forEach((node, i) => {
  node.classList.add("reveal");
  node.style.transitionDelay = `${(i % 4) * 70}ms`;
  revealObserver.observe(node);
});