# GigPay — Design PRD
### Frontend Design System & UX Specification
**Version 1.0 | For Antigravity Team**

---

## 1. Product Overview

GigPay is a Progressive Web App built for India's gig economy workers — delivery partners, ride-share drivers, and freelance couriers on platforms like Zomato, Swiggy, Ola, and Uber. It is a financial super-app: instant payouts, expense tracking, insurance, loans, savings, and tax filing — all in one place.

The design must feel **trustworthy and empowering**, not corporate. It should feel like it was built *for* gig workers, not sold to them. The visual language should be energetic, clear, and modern — something a 22-year-old delivery rider in Bangalore would feel proud to use.

---

## 2. Design Philosophy — Soft Neobrutalism

### What is Soft Neobrutalism?
Neobrutalism at its core uses visible borders, flat fills, bold typography, and offset drop shadows to create a raw, graphic-design feel. The "soft" qualifier means we take that aesthetic and make it warmer: rounded corners instead of sharp, softer shadow offsets, and a friendlier color palette. The result is a UI that feels distinctive and modern without feeling aggressive or cold.

### How it applies to GigPay
- Cards and containers have visible, slightly bold borders — not subtle hairlines, but not black 2px strokes either. Think 1.5px solid with color.
- Drop shadows are **offset, not diffused** — a card may have a shadow shifted 4px right and 4px down, with no blur, creating a grounded, graphic feel.
- Buttons are bold and chunky with solid fills, visible borders, and offset shadows on the primary CTA.
- Typography is expressive — large numerals, heavy weight headings, and clear hierarchy.
- Empty space is used intentionally. Layouts breathe but are not sparse.
- Micro-interactions are satisfying: a button press feels like it physically depresses. A slider has tactile resistance.

### Reference Inspirations from Provided Images
- **Image 1 (Dashboard/Help Center):** Clean card grid, bold sans-serif headings, chunky tag pills, bordered list items. Adopt the card structure and task-list aesthetic for transaction lists.
- **Image 2 (Finance Banking App):** Large balance display, mint/light background with dark text, quick action icon-buttons in a row, transaction list with colored left-border rows. Adopt the balance hero and quick-action grid pattern.
- **Image 3 (Neo-Brutalism Fintech):** Visible card borders, distinct filled operation buttons with icon+label, bar chart with dual-color bars, history list with app logos. This is the closest to our target aesthetic — adopt the operation button grid, chart style, and card borders directly.

---

## 3. Color System

### Primary Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-lime` | `#C8F135` | Primary CTA, active states, key accents, progress fills |
| `--color-lime-soft` | `#E9FAA0` | Backgrounds of highlight cards, success tints |
| `--color-navy` | `#0D1B3E` | Primary text, header backgrounds, bottom nav background |
| `--color-navy-mid` | `#1A2D5A` | Secondary text, icon fills, card borders |
| `--color-navy-light` | `#2E4A8A` | Tertiary accents, chart secondary color |

### Neutral Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-surface` | `#F7F8F2` | App background, page base — a warm off-white, not pure white |
| `--color-card` | `#FFFFFF` | Card and modal backgrounds |
| `--color-border` | `#D4D8C8` | Default card/input borders — slightly warm grey-green |
| `--color-text-primary` | `#0D1B3E` | Headings, labels |
| `--color-text-secondary` | `#5A6275` | Subtext, captions, placeholder text |
| `--color-text-muted` | `#9AA0AF` | Timestamps, metadata |

### Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-success` | `#22C55E` | Completed payouts, positive earnings |
| `--color-warning` | `#F59E0B` | Pending states, advance tax alerts |
| `--color-error` | `#EF4444` | Failed transactions, error states |
| `--color-info` | `#3B82F6` | Informational banners, tips |

### Color Usage Rules
- The app background is always `--color-surface`, not white. This gives a slightly warm, papery feel that complements neobrutalism.
- Never use a lime-on-lime or navy-on-navy combination.
- Lime is exclusively for **active/primary** actions. Do not use it for informational or secondary UI.
- The BalanceCard and onboarding hero screens are the only places where navy is used as a full background — everywhere else, navy is text or border only.
- Transaction rows use left-border color coding: lime for credit/earning, red for debit/expense, amber for pending.

---

## 4. Typography

### Font Stack

**Display Font:** `Syne` (Google Fonts)
Used for: large balance numerals, page heroes, onboarding taglines. Syne has a geometric, slightly editorial quality that pairs well with neobrutalism without feeling retro.

**Body Font:** `DM Sans` (Google Fonts)
Used for: all body text, labels, form inputs, captions, navigation. DM Sans is modern, highly legible at small sizes, and has a friendly rounded quality.

**Mono Font:** `DM Mono` (Google Fonts)
Used for: account numbers, UPI IDs, Aadhaar numbers (masked), transaction IDs. Mono spacing makes financial data instantly scannable.

### Type Scale

| Name | Font | Size | Weight | Line Height | Usage |
|---|---|---|---|---|---|
| `display-xl` | Syne | 48px | 800 | 1.0 | Balance hero on BalanceCard |
| `display-lg` | Syne | 36px | 700 | 1.1 | Onboarding headline |
| `display-md` | Syne | 28px | 700 | 1.2 | Page titles, section heroes |
| `heading-lg` | DM Sans | 22px | 700 | 1.3 | Card titles, modal headings |
| `heading-md` | DM Sans | 18px | 600 | 1.4 | Section headings, tab labels |
| `body-lg` | DM Sans | 16px | 400 | 1.5 | Primary body text |
| `body-md` | DM Sans | 14px | 400 | 1.5 | Secondary body, list items |
| `label` | DM Sans | 12px | 600 | 1.4 | Badges, tags, form labels |
| `caption` | DM Sans | 11px | 400 | 1.4 | Timestamps, metadata |
| `mono` | DM Mono | 14px | 400 | 1.5 | Financial IDs, account numbers |

### Typography Rules
- Balance amounts displayed in `display-xl` Syne always. This is the most important number in the app.
- Rupee symbol (₹) uses the same font family but can be slightly smaller than the number it precedes — e.g., ₹ at 32px with the numeral at 48px.
- Platform names (Zomato, Swiggy, etc.) always render with their brand color when shown inline.
- Never use italic text anywhere in the app except for the offline fallback page.
- Headings are always `--color-navy`. Body text is `--color-text-primary` or `--color-text-secondary` depending on hierarchy.

---

## 5. Spacing & Layout

### Spacing Scale
The base unit is 4px. All spacing values are multiples of this unit.

| Token | Value | Usage |
|---|---|---|
| `--space-1` | 4px | Micro gaps within components |
| `--space-2` | 8px | Icon-to-label gaps, tight padding |
| `--space-3` | 12px | Internal card padding (compact) |
| `--space-4` | 16px | Standard internal card padding, list item padding |
| `--space-5` | 20px | Section gaps within a page |
| `--space-6` | 24px | Card-to-card gaps |
| `--space-8` | 32px | Section-level vertical rhythm |
| `--space-10` | 40px | Page section dividers |

### Layout Grid
- **Page padding:** 16px horizontal on all pages.
- **Max content width:** 420px — the app is designed for mobile-first, but caps at 420px centered on wider screens with a tasteful outer background.
- **Card gap:** 12px vertical between cards in a scroll list.
- **Bottom navigation height:** 64px, always floating above safe area inset.
- **Top bar height:** 56px.

### Breakpoints
This is a mobile PWA. There is only one meaningful breakpoint:
- **Mobile (default):** 0px–767px — full-width layout
- **Desktop/tablet fallback:** 768px+ — content centered in a 420px column, outer area uses `--color-navy` at 10% opacity as a subtle background

---

## 6. Component Design Specifications

### 6.1 Cards

Cards are the primary container unit of GigPay. Every card follows this pattern:

- **Background:** `--color-card` (white)
- **Border:** 1.5px solid `--color-border`
- **Border radius:** 16px
- **Padding:** 16px
- **Box shadow:** `4px 4px 0px #D4D8C8` — this is the neobrutalist offset shadow. It is NOT blurred. It uses the border color at full opacity, creating a grounded, graphic feel.
- **On hover/focus (desktop):** shadow increases to `6px 6px 0px #C8F135` — the lime color bleeds into the shadow on interaction.

**Special card variants:**
- **Hero card (BalanceCard, ForecastBanner):** Background is `--color-navy`, text is white/lime. Border is `2px solid #C8F135`. Shadow is `4px 4px 0px #C8F135`.
- **Highlight card (success state, algo insight with high confidence):** Background is `--color-lime-soft`. Border is `1.5px solid #C8F135`. Shadow is `4px 4px 0px #C8F135`.
- **Muted card (empty states, disabled):** Background is `--color-surface`. Border is `1px solid #E2E6D8`. No shadow.

### 6.2 Buttons

**Primary Button (CTA — "Cash Out Now", "Apply", "Confirm")**
- Background: `--color-lime`
- Text: `--color-navy`, weight 700, 16px DM Sans
- Border: 2px solid `--color-navy`
- Border radius: 12px
- Padding: 16px 24px
- Box shadow: `3px 3px 0px #0D1B3E` — navy offset shadow
- Height: 52px minimum
- On press: shadow collapses to `0px 0px 0px`, button translates `3px, 3px` — feels like it physically presses down.

**Secondary Button**
- Background: white
- Text: `--color-navy`, weight 600, 15px
- Border: 1.5px solid `--color-navy`
- Border radius: 12px
- Box shadow: `2px 2px 0px #D4D8C8`
- On press: same collapse effect as primary.

**Ghost Button / Text Link**
- No background, no border
- Text: `--color-navy-mid`, weight 600, underlined
- Used for "Skip for now", "View All" type actions only.

**Danger Button**
- Background: white
- Text: `--color-error`, weight 600
- Border: 1.5px solid `--color-error`
- Box shadow: `2px 2px 0px #FCA5A5`

**Icon Button (circular)**
- 44px × 44px circle
- Background: `--color-surface`
- Border: 1.5px solid `--color-border`
- Icon: 20px, `--color-navy`
- Used for: back buttons, notification bell, settings.

### 6.3 Bottom Navigation

The bottom nav is the primary navigation. It sits fixed at the bottom with a safe area padding.

- **Background:** `--color-navy`
- **Height:** 64px + safe area inset bottom
- **Border top:** 2px solid `--color-lime`
- **Tab layout:** 5 equal-width tabs — Home, Zones, Wallet, Insights, Profile
- **Inactive tab:** Icon 24px in white at 50% opacity, label 10px DM Sans in white at 50% opacity
- **Active tab:** Icon 24px in `--color-lime`, label 10px DM Sans in `--color-lime`, weight 600. A small 4px × 4px lime dot appears above the icon as an active indicator.
- **Notification badge:** Small red circle (18px diameter) with white number, positioned top-right of the icon. Only on Profile tab for unread count.
- **Tab switch animation:** The active indicator dot slides horizontally between tabs using a spring animation (Framer Motion: `type: spring, stiffness: 400, damping: 30`).

### 6.4 Top Bar

- **Background:** `--color-surface` (transparent, since page scrolls under it — use a blur backdrop)
- **Height:** 56px
- **Border bottom:** None by default. When page is scrolled more than 16px, a 1px bottom border in `--color-border` appears with a subtle fade-in.
- **Back button:** Left side, circular icon button (see Icon Button spec above). Only visible when not on root tab page.
- **Title:** Center-aligned, `heading-md` DM Sans 700, `--color-navy`. On the Home page, this is replaced by the greeting text which is left-aligned.
- **Right actions:** Notification bell icon button. On Home, also shows user avatar (32px circle).

### 6.5 Input Fields

- **Background:** white
- **Border:** 1.5px solid `--color-border`
- **Border radius:** 12px
- **Padding:** 14px 16px
- **Height:** 52px for single-line inputs
- **Font:** DM Sans 16px, `--color-text-primary`
- **Placeholder:** DM Sans 16px, `--color-text-muted`
- **Label:** Positioned above input, DM Sans 12px 600, `--color-navy`
- **On focus:** Border changes to `1.5px solid #0D1B3E`, box shadow becomes `2px 2px 0px #C8F135` — the lime accent shadow appears on focus. This is a signature GigPay interaction pattern.
- **Error state:** Border `1.5px solid --color-error`, below the input a small error message in `--color-error` 12px.
- **Success state:** Border `1.5px solid --color-success`, a small green checkmark icon appears inside the input on the right side.

**OTP Input (6 boxes)**
Each digit is a separate square input:
- Size: 48px × 56px
- Border: 2px solid `--color-border`
- Border radius: 12px
- Font: Syne 28px 700, `--color-navy`
- Centered text
- Active box border: `2px solid --color-navy` with lime box shadow

**Phone Input**
- Left section shows "+91" with a vertical separator line — this is non-editable and uses `--color-text-secondary`
- Right section is the editable number field
- Combined border wraps both sections

### 6.6 Amount Slider (Cashout)

- **Track background:** `--color-surface`, 6px height, full border radius
- **Filled track:** `--color-lime`, same dimensions
- **Track border:** 1px solid `--color-border` on the background, 1px solid `#C8F135` on the filled portion
- **Thumb:** 28px × 28px circle, background `--color-navy`, border 3px solid `--color-lime`, box shadow `2px 2px 0px #0D1B3E`
- **Quick-select chips:** Pill buttons with `--color-surface` background, `--color-border` border. When selected: `--color-lime` background, `--color-navy` border. Text `--color-navy` 13px 600.

### 6.7 Progress Bars

- **Track:** `--color-surface`, 8px height, full border radius, border `1px solid --color-border`
- **Fill:** `--color-lime` by default. Red for expenses over budget, amber for partial completion.
- **Animated fill:** When the page loads, the bar animates from 0% to its value over 600ms with an ease-out-cubic curve.

### 6.8 Status Badges / Tags

Pill-shaped badges used for transaction status, insight confidence, platform labels.

- **Border radius:** 999px (fully rounded)
- **Padding:** 4px 10px
- **Font:** DM Sans 11px 600, uppercase
- **Border:** 1.5px solid (same as background color, but darker tint)

Variants:
- **Success:** Background `#DCFCE7`, text `#16A34A`, border `#86EFAC`
- **Pending:** Background `#FEF9C3`, text `#CA8A04`, border `#FDE047`
- **Failed:** Background `#FEE2E2`, text `#DC2626`, border `#FCA5A5`
- **Info/neutral:** Background `#EFF6FF`, text `#1D4ED8`, border `#BFDBFE`
- **Platform — Zomato:** Background `#FEE2E2`, text `#EF4444`
- **Platform — Swiggy:** Background `#FED7AA`, text `#EA580C`
- **Platform — Ola:** Background `#DCFCE7`, text `#16A34A`
- **Platform — Uber:** Background `#F1F5F9`, text `#334155`

### 6.9 Transaction List Rows

Each row in a transaction list:
- **Height:** 64px
- **Background:** white
- **Left accent border:** 3px solid, flush with left edge of the row. Color is lime (credit), red (debit), or amber (pending).
- **Left icon:** 36px × 36px rounded square (radius 10px). Background is platform color at 15% opacity. Icon is platform logo or category icon at 20px.
- **Main text:** 14px DM Sans 600, `--color-navy` — merchant name or transaction type.
- **Sub text:** 12px DM Sans 400, `--color-text-secondary` — timestamp and source (SMS/manual/Platform).
- **Amount:** Right-aligned. 16px Syne 700. Lime/green for positive, red for negative. Always prefixed with + or −.
- **Status badge:** Below amount, right-aligned, small pill badge.
- **Row divider:** 1px `--color-border` at full width, no left indent.

### 6.10 GigScore Gauge

The GigScore is a 0–850 score similar to a credit score. Display it as a semicircular gauge:
- Outer ring: thin arc (8px stroke), background `--color-surface` with `--color-border` stroke
- Filled arc: gradient from lime (low score end) to navy (high score end)
- Score numeral: `display-md` Syne 700 centered below the arc
- Label: "GigScore" in `caption` DM Sans, `--color-text-secondary`
- Range labels: "0" and "850" at arc endpoints in `caption`

---

## 7. Page-by-Page Design Specifications

### 7.1 Onboarding — Landing Page

The landing page is the first impression. It needs to feel like a product, not a form.

**Layout:**
- Full-screen, no top bar, no bottom nav.
- Background: `--color-navy` — this is one of two dark-background screens.
- Top 60% of screen: large branded illustration or abstract geometric pattern in lime/navy. Think bold, angular shapes — not a photograph, not a cartoon. Pure geometry: overlapping circles, diagonal lines, grid dots in lime on navy.
- Bottom 40%: white card that slides up from the bottom. Border radius 24px on top corners only. Padding 24px.

**Content inside bottom card:**
- GigPay wordmark in Syne 32px bold, navy.
- Tagline: "Instant Earnings. Smart Tools. Financial Freedom." in DM Sans 18px, `--color-text-secondary`. This can break into 3 lines — that's intentional.
- Three feature highlights: small rows each with a lime-colored icon on the left and a one-line description. Icons: lightning bolt (instant payouts), shield (insurance), chart line (insights).
- "Get Started" primary button at full width.
- "Already have an account? Sign in" ghost link centered below the button.

**If PWA install prompt is available:** A small banner at the very top of the bottom card saying "📲 Add GigPay to your home screen" with a subtle right arrow. Tapping it triggers the install prompt.

### 7.2 Onboarding — Phone Entry & OTP

- **Background:** `--color-surface`
- **Top area (above form):** GigPay logo (wordmark, 24px Syne) left-aligned with a step indicator ("Step 1 of 3" or similar) right-aligned in `caption`.
- **Heading:** "What's your number?" in `display-md` Syne 700, navy.
- **Subtext:** "We'll send a 6-digit OTP to verify." in `body-md`, `--color-text-secondary`.
- **Phone input:** Full-width, +91 prefix style (see Input Fields spec).
- **Send OTP button:** Full-width primary button.

**After OTP sent, the phone field section slides up and is replaced by:**
- New heading: "Enter OTP" in `display-md`.
- 6-box OTP input (see OTP Input spec), auto-focused on first box.
- Resend timer: "Resend in 28s" in `caption`, centered. Timer counts down. When 0, becomes an active "Resend OTP" link in `--color-navy-mid` 600 weight.
- Verify button at full width.

### 7.3 Onboarding — Aadhaar KYC

- Same page structure as Phone Entry.
- Heading: "Verify your identity" in `display-md`.
- **Aadhaar input:** 12-digit, formatted as `XXXX XXXX XXXX` automatically as user types. Uses `DM Mono` font. Masked: digits shown as dots except the last 4.
- Security note below input: small lock icon + "Your Aadhaar is encrypted and never stored." in `caption`, `--color-text-muted`.
- Button: "Send OTP to Aadhaar-linked number".
- After OTP: same OTP flow as above.
- **Success state:** A green checkmark card slides in showing: the user's name (from UIDAI) and city, with a "Verified ✓" badge. This card has `--color-lime-soft` background with lime border. Pause for 1.5 seconds, then auto-advance to selfie.

### 7.4 Onboarding — Selfie Capture

- **Full-screen camera viewfinder** with dark overlay on the sides.
- Center: circular cutout in the overlay (no fill, just the camera feed shows through). Diameter: 260px. The circle has a `3px solid --color-lime` border with a subtle animated pulse.
- Below circle: "Position your face inside the circle" in white `body-md`.
- Bottom action area (above safe area): "Capture" primary button (lime, full width, 52px height).
- **After capture:** Viewfinder pauses, a preview of the captured image fills the circle. Two buttons appear: "Use This Photo" (primary) and "Retake" (secondary).

### 7.5 Onboarding — Platform Link

- **Background:** `--color-surface`
- Heading: "Connect your platforms" in `display-md`.
- Subtext: "We'll sync your earnings automatically." in `body-md`.
- **Platform cards:** One per platform (Zomato, Swiggy, Ola, Uber, Dunzo). Each is a full-width card with:
  - Left: Platform logo (40px × 40px, rounded square)
  - Center: Platform name (heading-md) + "Tap to connect" (caption, muted)
  - Right: "Connect" secondary button OR a lime "✓ Connected" badge
- Each card has the standard card border and offset shadow.
- **"Skip for now"** ghost link at the very bottom, centered. DM Sans 14px, `--color-text-secondary`. No underline, just colored differently on tap.

### 7.6 Onboarding — Bank Setup

- Heading: "Where should we send your money?" in `display-md`.
- **Two-tab toggle:** "UPI ID" | "Bank Account". Styled as a segmented control — pill-shaped container, active tab fills with `--color-navy`, text turns white.
- **UPI tab content:** Single input for UPI ID (e.g., 9999999999@ybl), mono font. Verify button appears after 10+ characters.
- **Bank Account tab content:** IFSC input, then Account Number input (mono font), then re-enter account number.
- **After verification success:** A small green card shows "✓ UPI verified — payouts will go to [masked UPI ID]".
- **Complete Setup** primary button.

### 7.7 Home Dashboard

The home dashboard is a vertical-scrolling page. No horizontal carousels. Content stacks vertically in a purposeful order.

**Structure (top to bottom):**

**Top Bar:** Left — "Good morning, Ravi 👋" in DM Sans 18px 600. Right — notification bell icon button + user avatar (32px circle).

**Balance Card:**
- Full-width card, `--color-navy` background, lime border, lime offset shadow.
- Top label: "Available Balance" in DM Sans 12px 500, white 70% opacity.
- Balance: Large number in Syne `display-xl` bold, white. Example: "₹3,240"
- Subtext row: "₹1,200 locked • Lifetime: ₹92,400" in caption, white 60% opacity.
- Full-width lime CTA button: "Cash Out Now →" inside the card at the bottom. DM Sans 16px bold, navy text.

**Earnings Card:**
- Standard card (white background, border, offset shadow).
- Title: "Today's Earnings" + date in subtitle.
- Large total at top in Syne `display-md`.
- Per-platform rows: each shows platform logo, platform name, and earnings from that platform on the right. A thin lime progress bar below the row shows that platform's proportion.
- Bottom row: "📈 18% above your 7-day average" in `--color-success` 13px.

**Forecast Banner:**
- Standard card with `--color-lime-soft` background and lime border.
- Title: "Tomorrow's Forecast 🔮" in `heading-md` navy.
- Earnings range: "₹850 – ₹1,200" in Syne 28px bold navy.
- Expected: "Expected ₹1,040" in `body-md` `--color-text-secondary`.
- Confidence bar: thin progress bar (see Progress Bars spec) labeled "Confidence: 78%".
- Factor chips: small pill tags showing contributing factors (e.g., "☀️ Clear weather", "📅 Friday", "🏏 IPL match"). These chips are `--color-surface` background with `--color-border` border, navy text.

**Hot Zone Preview:**
- Standard card.
- Title: "Nearest Hot Zone" with a pulsing red dot indicator (live).
- A small embedded map (160px height) showing the zone heat.
- Below the map: zone name, demand score badge (e.g., "Demand: 87/100" as a lime-filled chip), and distance ("2.3 km away").
- "View Full Map →" ghost link at the bottom right.

**Quick Actions:**
- Section heading: "Quick Actions" `heading-md` navy.
- 2×2 grid of action cards. Each card:
  - Background: white, standard card border and shadow.
  - Top: Icon in a 40px × 40px lime-soft rounded square.
  - Bottom: Label in DM Sans 14px 600 navy.
  - Labels: "Emergency Loan", "Insurance", "Tax Assistant", "Savings".

**Recent Transactions:**
- Section heading: "Recent Transactions" with "View All →" link right-aligned.
- Last 5 transaction rows (see Transaction List Rows spec).

### 7.8 Zones Page (Full-Screen Map)

- **Full-screen Google Maps** covering the entire viewport below the top bar.
- Map style: Custom map style — muted, desaturated base map. Roads in light grey, water in `--color-surface`, parks in `--color-lime-soft` tint. No default Google UI styling.
- Heatmap layer: Demand zones rendered in lime-to-red gradient heatmap. Hot areas glow lime, neutral areas glow amber, coolzones are invisible.
- User location: Pulsing navy dot with a lime ring pulse animation (CSS keyframe, 2s infinite).
- **Custom zone markers:** Small cards (not default pins) that float over the map with zone demand score.

**Bottom Sheet (floating):**
- Sits above the map, slides up from the bottom.
- Background white, border radius 24px top corners.
- **Handle bar** at top: small 32px × 4px rounded pill in `--color-border`, centered.
- **Time filter tab row:** "Right Now" | "In 1 Hour" | "This Evening" — horizontal scrollable pill tabs. Active tab: lime background, navy text. Inactive: surface background, muted text.
- **Toggle:** "Map View" / "List View" segmented control.
- **Top 3 zone cards:** Each card row shows: zone icon (flame emoji in a lime chip), zone name, demand score bar, wait time, and distance.

### 7.9 Wallet Overview

- Inherits the BalanceCard from home (same component, same styling).
- Below balance card: Quick action row — 4 circular icon buttons in a horizontal row: "Cash Out", "Savings", "Insurance", "Loans". Each is a 56px circle with a 24px icon, white background, navy border. Label below each in caption.
- Then section: "Recent Activity" with transaction list rows.

### 7.10 Cashout Flow

This is the **most critical UX** in the app. The flow must feel fast, reassuring, and trustworthy.

**Step 1 — Amount Selection**
- Top: "How much do you want?" heading.
- Large selected amount display: Syne `display-xl`, lime-colored, centered.
- Quick-select chips row: ₹100 | ₹500 | ₹1,000 | Max — horizontal pill chips.
- Amount slider (see spec above) below chips.
- Fee Preview card below slider (white card, lime border): shows Amount, Fee, Net Amount. Fee percentage shown as a badge. If user has GigPro: a lime "GigPro Discount Applied" chip reduces the fee.
- UPI ID row at bottom: shows the destination UPI ID with a small edit icon.
- "Review Cashout →" primary button.

**Step 2 — Confirm**
- Summary card: Amount, Fee, Net, UPI destination, Estimated time. All in a clean list format with dividers.
- Warning note if amount is large: "Transfer to third-party UPI takes 2–4 hours."
- "Confirm & Authenticate →" primary button.

**Step 3 — Biometric**
- Centered screen with a large fingerprint icon (or face icon) in navy, 80px.
- "Authenticate to proceed" heading.
- "Place your finger on the sensor" instruction in body-md, muted.
- A lime ring pulses around the fingerprint icon waiting for WebAuthn response.
- If WebAuthn fails: a secondary "Use face capture instead" link appears.

**Step 4 — Processing**
- Animated steps: Pending → Processing → Completed.
- Each step: icon + label + timestamp.
- The "processing" step shows a subtle bank-building animation (CSS animation, no external library needed).
- Steps use a vertical connector line — completed steps show lime connector, pending steps show grey dashed connector.

**Step 5 — Success**
- Full-screen success state with a lime confetti burst (CSS keyframe animation, particles only — no canvas needed).
- Large "✓" in a navy circle, 80px.
- "₹3,240 sent!" in Syne `display-md`.
- Destination UPI ID in mono font.
- "WhatsApp confirmation sent to +91 XXXXX" in caption.
- "Done" secondary button → navigates back to home.

### 7.11 Insights — Algo Insights

- Platform filter tabs at the top: All | Zomato | Swiggy | Ola | Uber. Horizontal scrollable row of pill tabs.
- Each insight card: standard card with left colored border matching platform color.
  - Top row: platform badge + insight type badge (e.g., "Peak Hours", "Tip Pattern") + confidence % chip.
  - Heading: insight title in `heading-md`.
  - Body: insight description in `body-md`, 2 lines max with "Read more" expand.
  - Stats row: small numbered chips with supporting stats.
  - Bottom row: "▲ 142 workers found this helpful" upvote button (ghost style) + "Verified ✓" badge if applicable.

### 7.12 Insights — Expenses

- Month picker: left/right arrow navigation, current month in `heading-md` centered.
- Total spend card: `--color-lime-soft` background, lime border. Shows "₹8,420 spent in January".
- Donut chart: 200px height, centered. Recharts pie chart. Center label shows total. Legend below uses platform/category color dots.
- SMS Permission banner (if not granted): yellow card with lock icon, explanation text, and "Allow SMS Access" primary button.
- Expense list grouped by date: date as a sticky section header in `label` DM Sans, then transaction rows.
- FAB "+" button: 56px lime circle with navy "+" icon. Fixed bottom right, 80px from bottom (above nav). Navy border, lime shadow offset.
- Tax Deductible filter: toggle chip at the top of the expense list — "Show only tax deductible".

### 7.13 Insights — Tax Assistant

- Annual Summary card: navy background, lime text for key numbers. Shows Gross Income, Total Deductions, Taxable Income, Tax Payable in a 2×2 grid.
- Deduction breakdown: expandable list items. Each row: deduction name (DM Sans 14px), category label, and amount right-aligned in lime.
- Regime comparison: a 2-column table card. "Old Regime" vs "New Regime". Highlighted column (lower tax) gets a lime left-border treatment and "Recommended" badge.
- Missed deduction alerts: amber warning cards. "You may have missed ₹X in fuel deductions. Add them now."
- Advance tax section: timeline of due dates with amounts. Past dates shown as muted, upcoming dates shown with amber accent.
- "File via ClearTax" button: full-width secondary button with ClearTax logo on the left.

### 7.14 Community Marketplace

- **Nearby Jobs tab:** Map at top (240px height, same style as Zones map but showing job markers), job list below. Job markers are custom cards: small white pill with job type icon and price.
- **Job cards:** Standard card with a colored type badge (e.g., "📦 Delivery", "🏠 Home Service"). Shows title, price (large, lime), distance, time posted, and poster name/avatar.
- **Post Job FAB:** Same lime FAB as Expenses page.
- **Job Detail page:** Full-screen map at top (320px height) with pickup (lime marker) and dropoff (navy marker) pins. Job details card below. Action button changes based on role (poster vs. worker).

### 7.15 Profile Page

- **Header section:** User avatar (72px circle, navy border 3px) centered. Name in `heading-lg` below. Phone number in mono font, `--color-text-secondary`. GigPro badge if subscribed.
- **GigPro upgrade CTA:** If not GigPro, a lime banner card: "Upgrade to GigPro — lower fees, priority support." Full-width, lime background, navy text, "Upgrade" button.
- **Settings list:** Standard list rows with a chevron on the right. Sections: Account, Notifications, Language, Linked Accounts, Help & Support. Section headers in `label` `--color-text-muted`.
- **Logout:** Red text link at the very bottom, centered.

---

## 8. Motion & Animation Guidelines

### Principles
- Animations communicate state, not just decorate.
- Every animation has a purpose: confirm an action, reveal a transition, indicate loading.
- Duration budget: most animations complete in 200–400ms. Longer animations (success confetti, skeleton-to-content) may run 600–800ms.

### Specific Animation Specs

**Page transitions:** Slides in from the right on forward navigation, slides out to the right on back navigation. 280ms, ease-in-out-cubic.

**Bottom nav tab switch:** Active indicator dot springs horizontally to the new tab. Framer Motion spring: `stiffness: 400, damping: 30`.

**Card entrance on page load:** Cards stagger in from the bottom. Each card translates from `y: 20` to `y: 0` and fades from `opacity: 0` to `opacity: 1`. Delay: 60ms per card. Duration: 300ms ease-out.

**Button press:** Shadow collapses (`0px 0px 0px`), element translates `3px, 3px`. Returns to resting state on release. Duration: 80ms.

**Skeleton loaders:** Pulsing gradient shimmer from `--color-surface` to `--color-border` and back. 1.5s infinite loop. Used for all data-driven components while React Query is loading.

**OTP box fill:** When a digit is entered, the box scales briefly to `1.1` then returns to `1.0`. 100ms spring. Lime border color flashes on fill.

**Success confetti:** On cashout completion, 20–30 small squares and circles in lime and white burst from the center of the ✓ checkmark and fall with gravity. Pure CSS keyframe animation, no canvas.

**Pull-to-refresh:** Custom indicator using the GigPay logo icon. Rotates as user pulls. Snaps into place when threshold is reached. Color changes from grey to lime when threshold is met.

**Progress bar fill:** On mount, animates from 0% to value. 600ms ease-out-cubic.

**Payout status steps:** Each step "completes" with a checkmark that draws in (CSS stroke animation on an SVG checkmark path). Duration: 400ms.

---

## 9. Iconography

### Icon Style
Use **Lucide Icons** as the primary icon set. Lucide uses a consistent 24px grid with 2px stroke width, which aligns well with our border weight aesthetic. Do not mix icon sets.

**Customizations:**
- All icons render at `--color-navy` by default in light contexts.
- All icons render at white in dark contexts (navy backgrounds).
- In Quick Action grids, icons are wrapped in a 40px × 40px lime-soft rounded square (border radius 10px) with a lime icon.
- Active bottom nav icons use `--color-lime`.

### Specific Icon Assignments
- Home tab: `Home`
- Zones tab: `MapPin`
- Wallet tab: `Wallet`
- Insights tab: `BarChart2`
- Profile tab: `User`
- Cashout/Payout: `ArrowUpRight`
- Income/Earning: `ArrowDownLeft`
- Emergency Loan: `Zap`
- Insurance: `Shield`
- Tax: `Receipt`
- Savings: `PiggyBank`
- Notification bell: `Bell`
- Settings: `Settings2`
- Back button: `ChevronLeft`
- Success: `CheckCircle2`
- Error: `XCircle`
- Warning: `AlertTriangle`
- Biometric: `Fingerprint`
- Location pin: `MapPin`
- SMS: `MessageSquare`
- Camera: `Camera`

---

## 10. Platform-Specific Color References

When displaying platform logos or names inline, use these brand colors:

| Platform | Primary Color | Background Tint |
|---|---|---|
| Zomato | `#EF4444` | `#FEE2E2` |
| Swiggy | `#EA580C` | `#FED7AA` |
| Ola | `#16A34A` | `#DCFCE7` |
| Uber | `#334155` | `#F1F5F9` |
| Dunzo | `#7C3AED` | `#EDE9FE` |

---

## 11. Accessibility Requirements

- **Contrast ratios:** All text must meet WCAG AA minimum. Navy on white: ✓. White on navy: ✓. Navy on lime: verify and confirm (target ≥ 4.5:1). Black text alternatives for any lime-background elements that fail.
- **Touch targets:** Minimum 44px × 44px for all interactive elements. Bottom nav tabs extend to full nav height.
- **Focus rings:** When navigating via keyboard/external device, all interactive elements show a `2px solid --color-lime` focus ring, offset 2px.
- **Font size floor:** No text renders below 11px anywhere in the app.
- **Motion reduction:** Wrap all non-trivial animations in a `prefers-reduced-motion` media query check. When reduced motion is preferred, fade-only transitions replace slides and springs.
- **Screen reader:** All icon buttons have descriptive `aria-label` attributes. Transaction amounts are announced with full context (e.g., "Received ₹320 from Swiggy, Tuesday 4:30 PM, Completed").

---

## 12. Offline & Error States

### Offline Banner
- Appears at the very top of the screen (below the top bar) when `isOffline` is true.
- Background: `#FEF9C3` (warning yellow)
- Left: `WifiOff` Lucide icon in `#CA8A04`
- Text: "You're offline — balance and transactions available" in DM Sans 13px `#CA8A04`
- Height: 36px, no dismiss button (disappears automatically when online)

### Empty States
Every list/data view must have an empty state:
- Centered illustration: simple geometric illustration in lime/navy (consistent art style with landing page). Not a photograph. Keep it simple — 3–5 geometric shapes max.
- Heading: short and human. "No transactions yet." "No jobs nearby." "Your savings goals live here."
- Body: one helpful sentence telling the user what to do.
- Optional CTA button (primary or secondary depending on action weight).

### Error States
- **Network error on a critical query:** Full card replacement with error icon, short message, and "Try Again" secondary button. Do not show empty data as if loading succeeded.
- **Partial failure (some data loaded):** Show available data, replace failed sections with a small error chip: "Couldn't load forecast. Tap to retry."

### Skeleton Loaders
Every data card must have a skeleton version. Skeletons are the same dimensions and structure as the loaded card, but content is replaced with shimmer bars. Do not use a generic spinner for card-level loading — use skeletons.

---

## 13. Tailwind Configuration Notes

The Tailwind config should extend the default theme with these custom values, consistent with our design tokens:

- **Colors:** Add `gigpay-lime`, `gigpay-navy`, and all semantic colors from Section 3 to the Tailwind color palette.
- **Font family:** Add `syne: ['Syne', 'serif']` and `dm-sans: ['DM Sans', 'sans-serif']` and `dm-mono: ['DM Mono', 'monospace']`.
- **Border radius:** Add `card: '16px'` and `button: '12px'` to the radius scale.
- **Box shadow:** Add the neobrutalist shadow utilities: `brutal: '4px 4px 0px'`, `brutal-sm: '2px 2px 0px'`, `brutal-lime: '4px 4px 0px #C8F135'`, `brutal-navy: '3px 3px 0px #0D1B3E'`.
- **Screens:** No custom breakpoints needed beyond Tailwind defaults. Focus on `sm` (640px) and below.

---

## 14. PWA & Manifest Design

- **Theme color:** `#0D1B3E` (navy) — this appears in the browser chrome on Android when the app is installed.
- **Background color:** `#0D1B3E` — splash screen background while app loads.
- **Icon design:** The GigPay icon should be a bold "GP" monogram in Syne Bold on a lime `#C8F135` background. The letters navy `#0D1B3E`. Clean, no drop shadows on the icon itself. The maskable version adds 10% padding around the monogram within the safe area.
- **Offline fallback page:** Matches the navy + lime color scheme. Simple centered layout: GigPay logo at top, "You're offline" heading in Syne, two list items showing what's available offline (balance, recent transactions). No external fonts or images — fully self-contained.

---

## 15. Design Handoff Checklist

Before Antigravity begins each phase, confirm:

- [ ] Tailwind custom config values match design tokens in Section 3 and Section 13
- [ ] Google Fonts loaded: Syne, DM Sans, DM Mono
- [ ] Custom Tailwind shadow utilities created for neobrutalist offset shadows
- [ ] Color tokens defined as CSS variables in global stylesheet
- [ ] Lucide Icons installed and aliased
- [ ] Framer Motion installed for bottom nav and page transitions
- [ ] All interactive components implement the button-press shadow-collapse animation
- [ ] Skeleton loader versions built alongside every data-driven component
- [ ] All icon buttons have minimum 44px touch targets
- [ ] Offline banner wired to `useOffline()` hook
- [ ] Font sizes never go below 11px in any component

---

*This PRD is the single source of truth for all visual and interaction decisions in GigPay's frontend. Any deviations require explicit sign-off. When in doubt, refer to the Soft Neobrutalism principles in Section 2.*