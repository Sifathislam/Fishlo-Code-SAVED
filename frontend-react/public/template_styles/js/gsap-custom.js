/*  GSAP Customs  */
gsap.registerPlugin(ScrollTrigger, SplitText);

//*  Cursor animation  */
class bl_Cursor {
  constructor(opts = {}) {
    // Default settings
    this.settings = Object.assign(
      {
        container: "body",
        speed: 0.6,
        ease: "power3.out",
        visibleDelay: 250,
      },
      opts
    );

    // Elements
    this.$root = document.querySelector(this.settings.container);
    this.$cursor = document.createElement("div");
    this.$cursor.className = "sp-cursor";
    this.$cursorText = document.createElement("div");
    this.$cursorText.className = "sp-cursor-text";
    this.$cursor.appendChild(this.$cursorText);
    this.$cursorImg = document.createElement("div");
    this.$cursorImg.className = "sp-cursor-img";
    this.$cursor.appendChild(this.$cursorImg);
    this.$root.appendChild(this.$cursor);

    // State
    this.pos = { x: -9999, y: -9999 };
    this.isVisible = false;
    this.hideCounter = 0; // ✅ FIX: Properly initialize

    // Init
    this.bindEvents();
    this.moveInstant();

    window.addEventListener("mousemove", () => {
      this.show();
    }, { once: true });

    // ✅ Optional failsafe (use if needed)
    window.addEventListener("focus", () => this.forceShowCursor());
    document.addEventListener("mouseleave", () => this.forceShowCursor());
  }

  // --------------------
  // Core Methods
  // --------------------
  bindEvents() {
    this.$root.addEventListener("mouseenter", () => this.show());
    this.$root.addEventListener("mouseleave", () => this.hide());
    this.$root.addEventListener("mousemove", (e) => this.trackPosition(e));
    this.$root.addEventListener("mousedown", () =>
      this.toggleState("active", true)
    );
    this.$root.addEventListener("mouseup", () =>
      this.toggleState("active", false)
    );

    // Interactive elements
    this.hoverState("iframe, input, textarea, a", null, { hide: true });
    this.hoverDataAttr("[data-cursor]", "state");
    this.hoverDataAttr("[data-cursor-text]", "text");
    this.hoverDataAttr("[data-cursor-img]", "hover-img");
  }

  trackPosition(e) {
    this.pos.x = e.clientX;
    this.pos.y = e.clientY;
    this.bl_render();
  }

  bl_render(x, y, duration) {
    gsap.to(this.$cursor, {
      x: x ?? this.pos.x,
      y: y ?? this.pos.y,
      duration: this.isVisible ? duration ?? this.settings.speed : 0,
      ease: this.settings.ease,
      overwrite: true,
      force3D: true,
    });
  }

  moveInstant() {
    this.bl_render(-window.innerWidth, -window.innerHeight, 0);
  }

  // --------------------
  // Show / Hide
  // --------------------
  show() {
    this.hideCounter = Math.max(0, this.hideCounter - 1);

    if (this.hideCounter === 0) {
      this.$cursor.classList.add("cursor-show");
      clearTimeout(this._timeout);
      this._timeout = setTimeout(() => (this.isVisible = true));
      // console.log("show", this.hideCounter);
    }
  }

  hide() {
    this.hideCounter++;
    this.$cursor.classList.remove("cursor-show");
    clearTimeout(this._timeout);
    this._timeout = setTimeout(() => {
      if (this.hideCounter > 0) {
        this.isVisible = false;
      }
    }, this.settings.visibleDelay);
    // console.log("hide", this.hideCounter);
  }

  forceShowCursor() {
    this.hideCounter = 0;
    this.show();
  }

  // --------------------
  // State Controls
  // --------------------
  toggleState(name, enable) {
    this.$cursor.classList.toggle(`${name}`, enable);
  }

  setText(value) {
    this.$cursorText.innerHTML = value;
    this.toggleState("text", true);
  }

  clearText() {
    this.toggleState("text", false);
  }

  setImg(value) {
    this.$cursorImg.innerHTML = `<img src="${value}" alt="cursor image">`;
    this.toggleState("hover-img", true);
  }

  clearImg() {
    this.toggleState("hover-img", false);
  }

  // --------------------
  // Helpers
  // --------------------
  hoverState(selector, state, opts = {}) {
    this.$root.querySelectorAll(selector).forEach((el) => {
      el.addEventListener("mouseenter", () => {
        if (opts.hide) return this.hide();
        if (state) this.toggleState(state, true);
      });
      el.addEventListener("mouseleave", () => {
        if (opts.hide) return this.show();
        if (state) this.toggleState(state, false);
      });
    });
  }

  hoverDataAttr(selector, type) {
    this.$root.querySelectorAll(selector).forEach((el) => {
      el.addEventListener("mouseenter", () => {
        if (type === "state") this.toggleState(el.dataset.cursor, true);
        if (type === "text") this.setText(el.dataset.cursorText);
        if (type === "hover-img") this.setImg(el.dataset.cursorImg);
      });
      el.addEventListener("mouseleave", () => {
        if (type === "state") this.toggleState(el.dataset.cursor, false);
        if (type === "text") this.clearText();
        if (type === "hover-img") this.clearImg();
      });
    });
  }
}

// Init
const cursor = new bl_Cursor();

gsap.set(".main-title", { opacity: 1 });

// Create the SplitText instance
let split = new SplitText(".main-title", {
  type: "chars"
});

// Optional: animate the characters
gsap.from(split.chars, {
  opacity: 0,
  x: 20,
  duration: 1,
  stagger: 0.04,
  ease: "back.out(1.1)"
});

// Select all target text elements for animation
const textRevealTargets = document.querySelectorAll('.sp-title h2, .sp-breadcrumb-2 h2');

// Loop through each element and apply animation
textRevealTargets.forEach((textElement) => {

  // Clean up any existing animation and revert split
  if (textElement._gsapAnim) {
    textElement._gsapAnim.progress(1).kill();
    textElement._splitInstance.revert();
  }

  // Create new SplitText instance
  const splitInstance = new SplitText(textElement, {
    type: "lines, words, chars",
    linesClass: "split-line"
  });

  // Store for later cleanup if needed
  textElement._splitInstance = splitInstance;

  // Set initial perspective and character styles
  gsap.set(textElement, { perspective: 500 });
  gsap.set(splitInstance.chars, {
    opacity: 0,
    x: 50
  });

  // Animate characters when scrolled into view
  const revealAnim = gsap.to(splitInstance.chars, {
    scrollTrigger: {
      trigger: textElement,
      start: "top 90%",
    },
    x: 0,
    y: 0,
    rotateX: 0,
    opacity: 1,
    duration: 1,
    ease: "back.out(1.1)",
    stagger: 0.02
  });

  // Store animation on element for potential cleanup
  textElement._gsapAnim = revealAnim;
});

/*  Vendor section  */
gsap.fromTo(".product-box img",
  {
    scale: 1
  },
  {
    scale: 1.5,
    scrollTrigger: {
      trigger: ".sp-vendor-list",
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    }
  });

/*  Banner section  */
gsap.fromTo(".bnr-1, .bnr-2, .bnr-3, .bnr-4, .bnr-5, .bnr-6",
  { backgroundSize: "100%" },
  {
    backgroundSize: "130%",
    scrollTrigger: {
      trigger: ".sp-banner",
      start: "top bottom",
      end: "bottom top",
      scrub: true
    }
  }
);

/*  Blog section  */
gsap.fromTo(".sp-blog-box .sp-blog-img img, .sp-blog-box-2 .sp-blog-img img",
  {
    scale: 1
  },
  {
    scale: 1.3,
    scrollTrigger: {
      trigger: ".sp-blog-box, sp-blog-box-2",
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    }
  });

/*   Blog detail page main image  */
gsap.utils.toArray(".blog-img img").forEach((img) => {
    gsap.to(img, {
      scale: 1.2,
      y: -30,
      ease: "none",
      scrollTrigger: {
        trigger: img,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  });

/*   Blog detail page sub image  */
 gsap.utils.toArray(".reveal-wrapper").forEach(wrapper => {
    const mask = wrapper.querySelector(".reveal-mask");

    gsap.to(mask, {
      xPercent: 100,
      duration: 1.5,
      ease: "back.out(1.1)",
      scrollTrigger: {
        trigger: wrapper,
        start: "top 80%",
        toggleActions: "play none none none",
      }
    });
  });

 
