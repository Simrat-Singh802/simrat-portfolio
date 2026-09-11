# Simrat Singh — Portfolio

Personal portfolio for applied machine learning work: agricultural yield
modeling, residual-corrected trajectory forecasting, and crop disease
classification.

Five static pages, no build step, no dependencies.

## Running it

**It must be served over HTTP** — `js/main.js` is an ES module, and browsers
block module loading from `file://`. Opening the HTML by double-click will
leave the page unstyled-but-readable with no interactivity.

```bash
# VS Code: the Live Server extension (port 5501 is preconfigured)
# or:
python -m http.server 5501
# then open http://localhost:5501
```

## Structure

```
index.html      hero, capability band, telemetry chart
about.html      background and stack
projects.html   featured work + live GitHub repo query
resume.html     CV, technical stack, local PDF preview
contact.html    email and profile links

css/
  00-tokens.css       design tokens: color, type scale, spacing, motion
  01-base.css         reset, typography, focus, motion safety, print
  02-layout.css       nav, mobile drawer, hero, sections, footer
  03-components.css   cards, buttons, badges, tags, repos, forms, toast
  04-animations.css   keyframes + the [data-reveal] state machine
  05-redesign.css     structural layout overrides (loaded last)

js/
  main.js       entry point; calls each module's init()
  util.js       shared helpers (escaping, rAF throttle, media queries)
  nav.js        active link, scroll state, mobile drawer + focus trap
  reveal.js     IntersectionObserver scroll-reveal engine
  canvas.js     particle mesh background
  motion.js     word reveal, spotlight, tilt, counters
  github.js     GitHub REST repo fetcher
  resume.js     local PDF preview sandbox
  toast.js      transient status messages
```

### Conventions worth knowing

**Every JS module exports an `init()` that returns early when its anchor
element is missing.** One script serves all five pages; a page simply not
having `#bg-canvas` or `#dropzone` is normal, not an error.

**The nav and footer markup is byte-identical across all five files.** The
active link is derived from `location.pathname` by `js/nav.js` and exposed as
`aria-current="page"` — never hard-coded. If you edit the nav, edit it in all
five files and keep them identical.

**Animation never hides content permanently.** `[data-reveal]` elements start
transparent, and three independent fallbacks reveal them: the reduced-motion
media query, the `.no-js` class set inline before paint, and a 3-second
timeout in `reveal.js`.

**`.glass-card` must not be transform-animated.** It carries `backdrop-filter`,
and animating a transform on it forces the blur to recomposite every frame.
Tilt is applied to a separate `.tilt-inner` wrapper for this reason.

## Placeholders still to fill

Search for `TODO` to find each one.

- **Project links** (`projects.html`) — all four repo/demo links are `href="#"`
  and carry `.is-placeholder`. Add the real URL, then remove that class and
  the `data-placeholder-label` attribute.
- **GitHub and LinkedIn** (`contact.html`) — marked with `data-placeholder`.
  Replace the `<span class="contact-value">` with a real `<a>` and drop the
  attribute.
- **`resume.pdf`** — the download button is commented out in `resume.html`
  because the file doesn't exist. Add it to the project root and restore the
  button. "Print / Save as PDF" works today and uses the print stylesheet in
  `01-base.css`.
- **GitHub username** (`projects.html`) — the repo query input starts empty;
  set a `value` if you want it prefilled.

## Accessibility notes

Keyboard navigable throughout, with a skip link, visible focus rings, a
focus-trapped mobile drawer that closes on Escape, and labelled form
controls. `prefers-reduced-motion` disables the particle canvas and all
transitions. Tested at 320px and up with no horizontal overflow.
