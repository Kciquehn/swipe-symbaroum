# Swipe Symbaroum — Mobile Character Sheet for Foundry VTT

A touch-friendly, mobile-optimized character sheet drawer for the **Symbaroum** RPG system on [Foundry VTT](https://foundryvtt.com/).

Inspired by the ergonomics and minimalist aesthetic of **Swipe VTT**, this module allows players to easily access and control their characters from smartphones and tablets.

---

## Features

- **Slide-up Mobile Drawer**: Smooth swipe gestures — pull down from the top handle to close.
- **Resource Bars in Header**:
  - **Toughness (Vitalidade)**: Color-coded bar (green/orange/red) with Pain Threshold (Limiar de Dor) indicator. Quick adjustment dialog (`-5`, `-1`, `+1`, `+5`).
  - **Corruption (Corrupção)**: Purple bar with corruption threshold warning. Separate tracking for Temporary, Daily, and Permanent corruption.
- **4 Dedicated Mobile Tabs**:
  - **Overview (Visão Geral)**: Quick Defense, Initiative, and Armor values. 4×2 Grid of all 8 Symbaroum attributes with **direct tap-to-roll**. Experience point tracking (Available, Spent, Total).
  - **Combat (Combate)**: Weapons with attack d20 buttons, damage, and qualities. Armor with protection roll and impediment. Active combat traits.
  - **Powers (Poderes)**: Mystical powers with novice/adept/master rank badges and cast button. Abilities, rituals, boons, and burdens.
  - **Inventory (Inventário)**: Currency tracker (Thaler, Shilling, Orteg), equipment list with quantities, and artifacts with special powers.
- **Symbaroum HUD Integration**:
  - Automatically suppresses the desktop `symbaroum-hud` module when logging in on mobile devices to keep your mobile screen clean and save battery.
- **Bilingual**: Full localization for English and Português (Brasil).

---

## Installation

### Manifest URL
In the Foundry VTT Setup screen, go to **Add-on Modules** > **Install Module** and paste this Manifest URL:

```
https://raw.githubusercontent.com/Kciquehn/swipe-symbaroum/main/module.json
```

---

## How to Use

1. Enable the module in your Symbaroum world under **Game Settings > Manage Modules**.
2. **On Mobile/Tablet**:
   - Double-tap your token on the canvas or tap your character in the sidebar.
   - The mobile drawer will slide up from the bottom.
3. **On Desktop (Testing Mode)**:
   - Go to **Game Settings > Configure Settings > Module Settings > Swipe Symbaroum**.
   - Enable **Force Enable (Desktop)** to test the mobile layout on your desktop browser.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
Symbaroum is a registered trademark of Free League Publishing.
