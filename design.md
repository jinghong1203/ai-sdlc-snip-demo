# Snip Design Language

Visual language borrowed from the lovable.dev aesthetic:
dark, minimal, generous breathing room; coral-to-pink hero glow;
pill-shaped chat-style input; generously rounded cards.

---

## Color tokens

| Token            | Value                    | Role                                        |
|------------------|--------------------------|---------------------------------------------|
| `--bg-page`      | `#0c0c0f`                | Page background (near-black)                |
| `--bg-surface`   | `#17171b`                | Card / pill input background                |
| `--bg-rim`       | `#1f1f25`                | Subtle step above surface                   |
| `--text-primary` | `#f0efe8`                | Body & heading text (warm near-white)       |
| `--text-muted`   | `#878785`                | Sub-copy, captions, table headers           |
| `--text-dim`     | `#52524f`                | Very dim secondary text, placeholder        |
| `--accent-from`  | `#ff5a2d`                | Gradient start — coral-orange               |
| `--accent-to`    | `#d9366b`                | Gradient end — pink                         |
| `--accent-glow`  | `rgba(255,90,45,0.25)`   | Box-shadow glow tint on hover               |
| `--border`       | `#2a2a30`                | Default border on cards & pill input        |
| `--border-muted` | `#222228`                | Table row dividers                          |

### Hero glow (radial overlay, position: absolute, inset: 0)

```css
background: radial-gradient(
  ellipse 90% 55% at 50% 0%,
  rgba(255, 90, 45, 0.28)   0%,
  rgba(210, 55, 110, 0.16)  48%,
  transparent               70%
);
```

### Accent gradient (button, highlights)

```css
background: linear-gradient(135deg, #ff5a2d 0%, #d9366b 100%);
```

### Hero title gradient text

```css
background: linear-gradient(160deg, #fff 30%, rgba(255,180,140,0.85) 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
```

---

## Typography

| Property        | Value                                                   |
|-----------------|---------------------------------------------------------|
| Font stack      | `'Inter', ui-sans-serif, system-ui, sans-serif`         |
| Mono stack      | `'JetBrains Mono', ui-monospace, monospace`             |
| Hero title      | `clamp(3.5rem, 8vw, 5.5rem)`, weight 800, ls −0.04em   |
| Sub-headline    | `1.125rem`, weight 400, `--text-muted`                  |
| Body            | `0.9375rem`, line-height 1.6                            |
| Small / caption | `0.8125rem`, `--text-muted`                             |
| Font smoothing  | `-webkit-font-smoothing: antialiased`                   |

---

## Spacing

| Name  | Value     | Typical use                             |
|-------|-----------|-----------------------------------------|
| `xs`  | `0.5rem`  | Icon-to-label gaps                      |
| `sm`  | `0.75rem` | Notice padding, tight inner gaps        |
| `md`  | `1.25rem` | Card horizontal padding, notice padding |
| `lg`  | `2.5rem`  | Main top padding                        |
| `xl`  | `3rem`    | Hero bottom padding                     |
| `2xl` | `5rem`    | Hero top padding                        |

Main content max-width: `960px`. Pill form / notice max-width: `620px`.

---

## Border radius

| Token      | Value     | Use                                      |
|------------|-----------|------------------------------------------|
| `--r-pill` | `9999px`  | URL input row, action button, notices    |
| `--r-card` | `1.25rem` | Links card                               |
| `--r-sm`   | `0.5rem`  | Small inline elements                    |

---

## Shadows & glows

```css
/* Card: drop shadow + faint inset highlight */
--shadow-card: 0 2px 20px rgba(0,0,0,0.45),
               0 0 0 1px rgba(255,255,255,0.04);

/* Pill input row: inset highlight + drop shadow */
--shadow-pill: 0 0 0 1px rgba(255,255,255,0.06) inset,
               0 4px 24px rgba(0,0,0,0.5);

/* Button hover glow */
box-shadow: 0 0 18px rgba(255, 90, 45, 0.25);
```

Focus ring on pill row (`:focus-within`):

```css
border-color: rgba(255, 90, 45, 0.45);
```

---

## Element mapping

| Snip element          | Design pattern                                                  |
|-----------------------|-----------------------------------------------------------------|
| Page header / hero    | Full-width `<header>`, coral/pink radial glow as absolute overlay |
| "Snip" headline       | Hero title scale, gradient text, centered                       |
| Sub-headline          | `1.125rem`, `--text-muted`, centered below title               |
| URL input + button    | `--r-pill` pill row on `--bg-surface`; gradient pill button anchored at right |
| Success notice        | `--r-pill` bar, green-tinted `border` + `color`                |
| Error notice          | `--r-pill` bar, red-tinted `border` + `color`                  |
| Links table           | `--r-card` rounded card, `--bg-surface`, `--border`; rows divided by `--border-muted`; hover row highlight |
| Link URLs             | `--text-muted` with underline; accent colour for short URLs     |
| Code / hits cells     | Mono font, `--text-muted`                                       |
