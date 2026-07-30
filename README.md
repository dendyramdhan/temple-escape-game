# Temple Escape

A **simple but complete** browser-based text adventure RPG.

Explore the forgotten temple, fight monsters, collect items, equip gear, solve a simple lock puzzle, and try to escape alive. Multiple endings depending on whether you find the secret treasure or not.

**Pure HTML + CSS + Vanilla JS** — no frameworks, no build step, works offline.

## Play Now

Just open `index.html` in any modern browser, or use GitHub Pages:

**https://dendyramdhan.github.io/temple-escape-game/**

*(GitHub Pages may take 1–2 minutes to activate after first push)*

## Features

- Full exploration with multiple interconnected rooms
- Turn-based combat system
- Inventory + equip system (weapon & relic)
- Consumable items (Health Potion)
- Locked door puzzle that requires a key dropped by the boss
- Secret treasure chamber (after defeating the guardian)
- Two endings (escape only / escape + treasure)
- Save / Load using `localStorage`
- Responsive dark fantasy UI (works well on mobile)
- Restart anytime

## How to Play

1. Click the action buttons to move, take items, equip gear, or fight.
2. Explore every room — some items are hidden.
3. Defeat the **Temple Guardian** in the Monster Lair to get the **Golden Key**.
4. Use the key on the Sealed Gate to escape.
5. Optional: After defeating the guardian, search the lair to find the secret treasure chamber.

### Tips
- Equip the **Rusty Sword** as soon as you find it (+8 ATK).
- Save the Health Potion for the boss fight.
- The Ancient Amulet gives permanent +5 DEF and +20 Max HP.

## Project Structure

```
temple-escape-game/
├── index.html      # Main page
├── style.css       # Dark fantasy theme
├── game.js         # All game logic (locations, combat, inventory, save/load)
└── README.md
```

## Controls

Everything is click-based (buttons). No keyboard required — friendly for mobile.

## License

MIT — do whatever you want with it.

---

Made for fun. Enjoy escaping the temple!
