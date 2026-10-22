"use strict";

// 01. Movimento: a preferência do visitante tem prioridade.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const motionDisabled = () => reducedMotion.matches;
document.getElementById("year").textContent = new Date().getFullYear();

// 02. Menu de celular, com navegação nativa e suporte à tecla Escape.
const menuButton = document.querySelector(".menu-toggle");
const mainNav = document.getElementById("main-nav");
menuButton.hidden = false;
function setMenu(open) {
  menuButton.setAttribute("aria-expanded", String(open));
  mainNav.classList.toggle("is-open", open);
  if (mobileLayout?.matches) mainNav.inert = !open;
}
menuButton.addEventListener("click", () =>
  setMenu(menuButton.getAttribute("aria-expanded") !== "true"),
);
mainNav
  .querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menuButton.getAttribute("aria-expanded") === "true"
  ) {
    setMenu(false);
    menuButton.focus();
  }
});
const mobileLayout = window.matchMedia("(max-width: 960px)");
function syncMenuLayout() {
  setMenu(false);
  mainNav.inert = mobileLayout.matches;
}
mobileLayout.addEventListener("change", syncMenuLayout);
syncMenuLayout();

// 03. Revela as seções uma única vez. Sem JavaScript, tudo continua visível.
const revealElements = document.querySelectorAll(".reveal");
let revealObserver;
function setupReveals() {
  revealObserver?.disconnect();
  revealElements.forEach((element) => element.classList.remove("is-pending"));
  if (motionDisabled() || !("IntersectionObserver" in window)) return;
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove("is-pending");
        entry.target.dataset.revealed = "true";
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.08 },
  );
  revealElements.forEach((element) => {
    if (element.dataset.revealed || element.getBoundingClientRect().bottom < 0)
      return;
    if (element.parentElement.matches(".process-grid, .work-grid")) {
      const index = [...element.parentElement.children].indexOf(element);
      element.style.setProperty("--delay", `${Math.min(index, 3) * 100}ms`);
    }
    element.classList.add("is-pending");
    revealObserver.observe(element);
  });
}

// 04. Entrada dos títulos por palavra, preservando espaços e marcação semântica.
const textHeadings = document.querySelectorAll(
  ".section-heading h2, .service-intro h2, .contact-title",
);
let textObserver;
function setupHeadings() {
  textObserver?.disconnect();
  textHeadings.forEach((heading) =>
    heading.classList.remove("type-ready", "type-visible"),
  );
  if (motionDisabled() || !("IntersectionObserver" in window)) return;
  textObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("type-visible");
        textObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.1 },
  );
  textHeadings.forEach((heading) => {
    if (!heading.dataset.wordsReady) {
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      let index = 0;
      nodes.forEach((node) => {
        const fragment = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            fragment.append(document.createTextNode(part));
            return;
          }
          const word = document.createElement("span");
          word.className = "type-word";
          word.textContent = part;
          word.style.setProperty(
            "--word-delay",
            `${Math.min(index++, 9) * 80}ms`,
          );
          fragment.append(word);
        });
        node.replaceWith(fragment);
      });
      heading.dataset.wordsReady = "true";
    }
    if (heading.getBoundingClientRect().bottom < 0) return;
    heading.classList.add("type-ready");
    textObserver.observe(heading);
  });
}

// 05. Partículas decorativas, sem imagens remotas nem captura do cursor.
const particleLayer = document.querySelector(".hero-particles");
for (let index = 0; index < 22; index++) {
  const particle = document.createElement("span");
  particle.style.left = `${(index * 43 + 9) % 100}%`;
  particle.style.top = `${(index * 29 + 13) % 100}%`;
  particle.style.setProperty("--duration", `${6 + (index % 7)}s`);
  particle.style.setProperty("--delay", `${-(index % 8)}s`);
  particleLayer.append(particle);
}

// 06. As miniaturas são composições HTML locais, não projetos de clientes.
const thumbnails = document.querySelectorAll(".thumbnail");
// As dimensões visuais são calculadas sem deixar os 900 px internos alargarem o card.
function previewDimensions(width, naturalHeight, virtualWidth) {
  if (width <= 0 || naturalHeight <= 0 || virtualWidth <= 0) return null;
  const scale = width / virtualWidth;
  return { scale, height: Math.ceil(naturalHeight * scale) };
}
function setStyleIfChanged(element, property, value) {
  if (element.style.getPropertyValue(property) !== value)
    element.style.setProperty(property, value);
}
function scaleThumbnails() {
  const layouts = [...thumbnails].map((thumbnail) => {
    const sample = thumbnail.querySelector(".concept-site");
    return {
      thumbnail,
      size: previewDimensions(
        thumbnail.clientWidth,
        sample?.offsetHeight || 540,
        900,
      ),
    };
  });
  layouts.forEach(({ thumbnail, size }) => {
    if (!size) return;
    setStyleIfChanged(thumbnail, "--sample-scale", String(size.scale));
    setStyleIfChanged(thumbnail, "--sample-height", `${size.height}px`);
  });
}
let thumbnailFrame = 0;
function scheduleThumbnails() {
  if (!thumbnailFrame)
    thumbnailFrame = requestAnimationFrame(() => {
      thumbnailFrame = 0;
      scaleThumbnails();
    });
}
scaleThumbnails();
if ("ResizeObserver" in window) {
  const thumbnailObserver = new ResizeObserver(scheduleThumbnails);
  thumbnails.forEach((thumbnail) => {
    thumbnailObserver.observe(thumbnail);
    thumbnailObserver.observe(thumbnail.querySelector(".concept-site"));
  });
} else {
  window.addEventListener("resize", scheduleThumbnails);
}
document.fonts?.ready.then(scheduleThumbnails);

// 07. Prévia em modal: teclado, fechamento nativo e alternância de dispositivo.
const conceptDialog = document.getElementById("concept-dialog");
const conceptTitle = document.getElementById("concept-title");
const deviceFrame = document.getElementById("device-frame");
const deviceStatus = document.getElementById("device-status");
const deviceButtons = document.querySelectorAll(".device-controls button");
const conceptNames = {
  forma: "Forma — arquitetura",
  pulse: "Pulse — plataforma digital",
  mov: "Mov. — estúdio criativo",
};
let openingButton;
let deviceAnimation;
let deviceFitFrame = 0;
const phoneScreen = window.matchMedia("(max-width: 600px)");
function fitDevicePreview() {
  if (deviceFrame.dataset.device === "mobile") {
    deviceFrame.style.removeProperty("height");
    deviceFrame.style.removeProperty("--device-scale");
    return;
  }
  const sample = deviceFrame.firstElementChild;
  const size = previewDimensions(
    deviceFrame.clientWidth,
    sample?.offsetHeight || 0,
    960,
  );
  if (!size) return;
  setStyleIfChanged(deviceFrame, "--device-scale", String(size.scale));
  setStyleIfChanged(deviceFrame, "height", `${size.height + 2}px`);
}
function scheduleDeviceFit() {
  if (!deviceFitFrame)
    deviceFitFrame = requestAnimationFrame(() => {
      deviceFitFrame = 0;
      fitDevicePreview();
    });
}
let previewObserver;
if ("ResizeObserver" in window) {
  previewObserver = new ResizeObserver(scheduleDeviceFit);
  previewObserver.observe(deviceFrame);
}
window.addEventListener("resize", scheduleDeviceFit);
window.visualViewport?.addEventListener("resize", scheduleDeviceFit);
document.fonts?.ready.then(scheduleDeviceFit);
function setDevice(device, animate = true) {
  if (!["desktop", "mobile"].includes(device)) return;
  const changed = deviceFrame.dataset.device !== device;
  deviceFrame.dataset.device = device;
  deviceButtons.forEach((button) =>
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.device === device),
    ),
  );
  deviceStatus.textContent = `${device === "mobile" ? "Visualização no celular" : "Visualização no computador"}. Conceito ilustrativo, sem vínculo com clientes.`;
  deviceAnimation?.cancel();
  fitDevicePreview();
  scheduleDeviceFit();
  if (changed && animate && !motionDisabled() && deviceFrame.animate) {
    deviceAnimation = deviceFrame.animate(
      [
        { opacity: 0.4, transform: "translateY(18px) scale(.98)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      { duration: 650, easing: "cubic-bezier(.16,1,.3,1)" },
    );
  }
}
function openConcept(key, trigger) {
  const template = document.getElementById(`concept-${key}`);
  if (!template || !conceptNames[key]) return;
  openingButton = trigger;
  conceptTitle.textContent = conceptNames[key];
  deviceFrame.replaceChildren(template.content.cloneNode(true));
  conceptDialog.showModal();
  setDevice(phoneScreen.matches ? "mobile" : "desktop", false);
  if (deviceFrame.firstElementChild)
    previewObserver?.observe(deviceFrame.firstElementChild);
  document.body.classList.add("dialog-open");
  conceptDialog.scrollTop = 0;
}
document.querySelectorAll(".work-open").forEach((button) => {
  button.addEventListener("click", () =>
    openConcept(button.dataset.concept, button),
  );
});
deviceButtons.forEach((button) =>
  button.addEventListener("click", () => setDevice(button.dataset.device)),
);
conceptDialog
  .querySelector(".dialog-close")
  .addEventListener("click", () => conceptDialog.close());
conceptDialog.addEventListener("click", (event) => {
  if (event.target !== conceptDialog) return;
  const bounds = conceptDialog.getBoundingClientRect();
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  )
    conceptDialog.close();
});
conceptDialog.addEventListener("close", () => {
  document.body.classList.remove("dialog-open");
  deviceAnimation?.cancel();
  if (deviceFrame.firstElementChild)
    previewObserver?.unobserve(deviceFrame.firstElementChild);
  deviceFrame.replaceChildren();
  deviceFrame.style.removeProperty("height");
  deviceFrame.style.removeProperty("--device-scale");
  openingButton?.focus({ preventScroll: true });
});

// 08. Acordeão de serviços: uma especialidade por vez, sem limitar as dúvidas.
const serviceItems = document.querySelectorAll(".service-item");
serviceItems.forEach((item) =>
  item.addEventListener("toggle", () => {
    if (item.open)
      serviceItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
  }),
);

// 09. Luz nos cards apenas com mouse; ações nativas dos botões preservadas.
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
document.querySelectorAll(".work-art").forEach((art) => {
  let pointerFrame = 0;
  art.addEventListener("pointermove", (event) => {
    if (motionDisabled() || !finePointer.matches) return;
    cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => {
      const bounds = art.getBoundingClientRect();
      art.style.setProperty("--light-x", `${event.clientX - bounds.left}px`);
      art.style.setProperty("--light-y", `${event.clientY - bounds.top}px`);
    });
  });
  art.addEventListener("pointerleave", () =>
    cancelAnimationFrame(pointerFrame),
  );
});
document.querySelectorAll(".button").forEach((button) =>
  button.addEventListener("click", (event) => {
    if (motionDisabled()) return;
    const bounds = button.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "click-ripple";
    ripple.setAttribute("aria-hidden", "true");
    ripple.style.left = `${event.detail ? event.clientX - bounds.left : bounds.width / 2}px`;
    ripple.style.top = `${event.detail ? event.clientY - bounds.top : bounds.height / 2}px`;
    button.append(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), {
      once: true,
    });
  }),
);

// 10. Progresso de leitura, atualizado no máximo uma vez por quadro.
const pageProgress = document.createElement("div");
pageProgress.className = "page-progress";
pageProgress.setAttribute("aria-hidden", "true");
document.body.prepend(pageProgress);
let progressFrame = 0;
function updateProgress() {
  progressFrame = 0;
  const available = document.documentElement.scrollHeight - window.innerHeight;
  const progress =
    available > 0 ? Math.min(1, Math.max(0, window.scrollY / available)) : 0;
  pageProgress.style.transform = `scaleX(${progress})`;
}
function scheduleProgress() {
  if (!progressFrame) progressFrame = requestAnimationFrame(updateProgress);
}
window.addEventListener("scroll", scheduleProgress, { passive: true });
window.addEventListener("resize", scheduleProgress);
if ("ResizeObserver" in window)
  new ResizeObserver(scheduleProgress).observe(document.body);

// 11. Respeita a configuração de movimento reduzido do dispositivo.
function applyMotionState() {
  document.documentElement.dataset.motion = motionDisabled()
    ? "paused"
    : "active";
  if (motionDisabled()) {
    deviceAnimation?.cancel();
    document
      .querySelectorAll(".click-ripple")
      .forEach((ripple) => ripple.remove());
  }
  setupReveals();
  setupHeadings();
}
reducedMotion.addEventListener("change", applyMotionState);
applyMotionState();
updateProgress();
