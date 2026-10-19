# TaskPilot design brief

Made with the `awwwards` MCP (`search_sites`, `create_design_brief`) on 2026-10-19. We take ideas from these sites; we copy none of them.

## References

| Site                                                | Award            | What we take                                                                                                              |
| --------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [Butter](https://www.butter.video/)                 | SOTD + Developer | Glossy 3D squircle tiles that float over a timeline. Our task cards become tiles like these in the hero.                  |
| [Heron AI](https://heronaiapp.com/)                 | SOTD + Developer | An AI product told in a technical, drafting style: thin grid lines, `+` corner marks, mono labels, one hot orange accent. |
| [Overworld Audio](https://overworldaudio.com/)      | SOTD + Developer | A deep night-blue 3D world with small glowing markers. This sets the mood of our dark theme.                              |
| [Lidar Drone Scanning](https://drone.riotters.com/) | SOTD + Developer | Scroll storytelling where the camera moves through a scene, and a cool grey-blue palette.                                 |

## The idea: a cockpit for your day

Glossy glass task cards float like instruments and settle onto a glowing orange flight path (the day's timeline), with a small paper plane flying it. The landing page is the drama; the app is a calm, quiet cockpit. The owner's character appears only on the Meet the developer page.

## Palette

Dark (default):

| Token       | Hex       | Use                                                             |
| ----------- | --------- | --------------------------------------------------------------- |
| `--bg`      | `#0D1017` | page (night sky, after Overworld)                               |
| `--surface` | `#151A23` | cards, sidebar                                                  |
| `--line`    | `#252C38` | grid lines, borders                                             |
| `--text`    | `#E9ECEE` | body text (15.9:1 on bg)                                        |
| `--muted`   | `#9AA4B2` | secondary text (7.6:1 on bg)                                    |
| `--accent`  | `#FF6B3D` | signal orange: primary buttons, focus, "now" line (6.9:1 on bg) |
| `--sky`     | `#7CC4FF` | AI and links (10:1 on bg)                                       |
| `--go`      | `#4ADE9A` | done, streaks                                                   |

Light: `--bg #F6F5F1` (paper), `--surface #FFFFFF`, `--text #13161C`, `--muted #556070`, `--accent #C2410C` (5.2:1 on paper), `--sky #0B6BB8`.

Eisenhower colours reuse accent, sky, go and muted, so the app stays to four hues.

## Type

- Display: **Space Grotesk** (600–700, tight tracking) for headings and the big hero lines.
- Body: **Inter** variable.
- HUD labels: **JetBrains Mono**, uppercase, 11–12px, wide tracking, for times, shortcuts and section labels (the Heron drafting feel).
- Self-hosted with `@fontsource-variable`, so no font requests leave the site.

## Motion

- **Hero (R3F + drei):** six rounded glass tiles (`RoundedBox` + a physical glass material) float with `Float` and tilt toward the pointer. On phones, software-rendered GPUs or reduced motion, the hero shows the generated still instead. The 8s clip plays in the AI section.
- **Scroll (GSAP ScrollTrigger + Lenis):** one pinned "flight path" section where the tiles land in order on a timeline (quick add → today → board → focus → matrix → AI plan), with each step's copy fading in. Lines draw in with `scrub`.
- **App (Motion):** layout animations for list moves and the board, 150–220ms, ease-out. There is no scroll-jacking in the app.
- **Details:** grid lines and `+` corner marks, a mono clock in the header, and the orange "now" line on the calendar.
- `prefers-reduced-motion`: no Lenis, no ScrollTrigger scrub, no tile float; content and keyboard access stay the same.

## Layout

- Landing: full-bleed hero → pinned flight path → feature grid (bento) → AI section → pricing teaser → developer card → footer "Made with ♥ by EWSTUDIOS".
- App: a sidebar on the left (views and projects), the list in the middle, a detail drawer on the right; on mobile, a bottom bar and full-screen sheets. Ctrl+K opens everywhere; `Q` is quick add.
