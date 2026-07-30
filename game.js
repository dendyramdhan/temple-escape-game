// =====================================================
// TEMPLE ESCAPE — Complete Text Adventure RPG
// Pure vanilla JS, no dependencies
// =====================================================

const LOCATIONS = {
  entrance: {
    name: "Temple Entrance",
    desc: "You stand before the crumbling entrance of an ancient temple. Moss covers the stone pillars. A dark corridor leads deeper inside. The air smells of dust and forgotten secrets.",
    exits: { north: "hall" },
    items: [],
    enemy: null
  },
  hall: {
    name: "Main Hall",
    desc: "A vast hall with faded murals on the walls. Broken statues litter the floor. There are passages leading north, east, and west. A faint glow comes from the north.",
    exits: { south: "entrance", north: "corridor", east: "lair", west: "armory" },
    items: ["health_potion"],
    enemy: null
  },
  armory: {
    name: "Ruined Armory",
    desc: "Racks of rusted weapons line the walls. Most are useless, but something glints under a pile of debris.",
    exits: { east: "hall" },
    items: ["rusty_sword"],
    enemy: null
  },
  lair: {
    name: "Monster Lair",
    desc: "Bones and torn cloth cover the floor. Something large has been living here. You hear heavy breathing from the shadows.",
    exits: { west: "hall" },
    items: [],
    enemy: "temple_guardian"
  },
  corridor: {
    name: "Long Corridor",
    desc: "A narrow stone corridor stretches ahead. Torches long extinguished. At the far end you see a heavy wooden door with an ornate lock.",
    exits: { south: "hall", north: "gate" },
    items: [],
    enemy: null
  },
  gate: {
    name: "Sealed Gate",
    desc: "A massive iron-bound door blocks your path. It requires a key. Behind it you can hear the distant sound of wind — freedom perhaps?",
    exits: { south: "corridor" },
    items: [],
    enemy: null,
    locked: true,
    requires: "golden_key"
  },
  treasure: {
    name: "Treasure Chamber",
    desc: "Gold coins and ancient artifacts glitter in the torchlight. In the center rests a pedestal holding a glowing amulet.",
    exits: { west: "lair" },
    items: ["ancient_amulet", "gold_pile"],
    enemy: null,
    hidden: true
  },
  exit: {
    name: "Temple Exit",
    desc: "Sunlight streams through the opening. You have escaped the temple!",
    exits: {},
    items: [],
    enemy: null
  }
};

const ITEMS = {
  health_potion: {
    name: "Health Potion",
    desc: "A small red vial. Restores 40 HP.",
    type: "consumable",
    effect: { hp: 40 }
  },
  rusty_sword: {
    name: "Rusty Sword",
    desc: "An old iron sword. Still sharp enough. (+8 ATK)",
    type: "weapon",
    effect: { atk: 8 }
  },
  golden_key: {
    name: "Golden Key",
    desc: "An ornate golden key with strange runes.",
    type: "key"
  },
  ancient_amulet: {
    name: "Ancient Amulet",
    desc: "A glowing amulet that pulses with power. (+5 DEF, +20 Max HP)",
    type: "relic",
    effect: { def: 5, maxHp: 20 }
  },
  gold_pile: {
    name: "Pile of Gold",
    desc: "A small pile of ancient coins.",
    type: "gold",
    effect: { gold: 50 }
  }
};

const ENEMIES = {
  temple_guardian: {
    name: "Temple Guardian",
    hp: 45,
    maxHp: 45,
    atk: 12,
    def: 3,
    gold: 25,
    drops: ["golden_key"],
    desc: "A hulking stone golem animated by dark magic. Its eyes glow red."
  }
};

// =====================================================
// GAME STATE
// =====================================================

let state = {
  location: "entrance",
  hp: 100,
  maxHp: 100,
  atk: 10,
  def: 5,
  gold: 0,
  inventory: [],
  equipped: { weapon: null, relic: null },
  combat: null, // { enemyKey, enemyHp }
  flags: {
    guardianDefeated: false,
    treasureFound: false,
    escaped: false
  },
  message: "You arrive at the temple. Your journey begins...",
  messageType: "normal"
};

// =====================================================
// UI HELPERS
// =====================================================

function $(id) {
  return document.getElementById(id);
}

function setMessage(text, type = "normal") {
  state.message = text;
  state.messageType = type;
  const el = $("message-log");
  el.textContent = text;
  el.className = type;
}

function updateStatus() {
  $("hp").textContent = state.hp;
  $("max-hp").textContent = state.maxHp;
  $("atk").textContent = getTotalAtk();
  $("def").textContent = getTotalDef();
  $("gold").textContent = state.gold;
}

function getTotalAtk() {
  let bonus = 0;
  if (state.equipped.weapon && ITEMS[state.equipped.weapon]) {
    bonus += ITEMS[state.equipped.weapon].effect?.atk || 0;
  }
  return state.atk + bonus;
}

function getTotalDef() {
  let bonus = 0;
  if (state.equipped.relic && ITEMS[state.equipped.relic]) {
    bonus += ITEMS[state.equipped.relic].effect?.def || 0;
  }
  return state.def + bonus;
}

function renderInventory() {
  const list = $("inventory-list");
  list.innerHTML = "";
  if (state.inventory.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Empty";
    list.appendChild(li);
    return;
  }
  state.inventory.forEach(key => {
    const item = ITEMS[key];
    if (!item) return;
    const li = document.createElement("li");
    li.textContent = item.name;
    if (state.equipped.weapon === key || state.equipped.relic === key) {
      li.textContent += " (equipped)";
      li.style.color = "var(--gold)";
    }
    list.appendChild(li);
  });
}

function clearChoices() {
  $("choices").innerHTML = "";
}

function addChoice(label, callback, className = "") {
  const btn = document.createElement("button");
  btn.className = "btn " + className;
  btn.textContent = label;
  btn.onclick = callback;
  $("choices").appendChild(btn);
}

// =====================================================
// CORE LOGIC
// =====================================================

function startGame(fresh = true) {
  if (fresh) {
    state = {
      location: "entrance",
      hp: 100,
      maxHp: 100,
      atk: 10,
      def: 5,
      gold: 0,
      inventory: [],
      equipped: { weapon: null, relic: null },
      combat: null,
      flags: {
        guardianDefeated: false,
        treasureFound: false,
        escaped: false
      },
      message: "You arrive at the temple. Your journey begins...",
      messageType: "normal"
    };
  }
  render();
}

function render() {
  updateStatus();
  renderInventory();

  const loc = LOCATIONS[state.location];
  $("location-title").textContent = loc.name;
  $("description").textContent = loc.desc;

  const msgEl = $("message-log");
  msgEl.textContent = state.message;
  msgEl.className = state.messageType;

  clearChoices();

  // Combat mode
  if (state.combat) {
    renderCombat();
    return;
  }

  // Normal exploration
  // Show items in room
  if (loc.items && loc.items.length > 0) {
    loc.items.forEach(itemKey => {
      if (!state.inventory.includes(itemKey) && !(itemKey === "gold_pile" && state.flags.treasureFound)) {
        const item = ITEMS[itemKey];
        addChoice(`Take ${item.name}`, () => takeItem(itemKey));
      }
    });
  }

  // Exits
  if (loc.exits) {
    Object.entries(loc.exits).forEach(([dir, dest]) => {
      const destLoc = LOCATIONS[dest];
      let label = `Go ${dir} → ${destLoc.name}`;

      // Special locked gate
      if (dest === "gate" && loc.name === "Long Corridor") {
        // already handled in gate
      }

      if (destLoc.locked && !state.inventory.includes(destLoc.requires)) {
        label += " (Locked)";
        addChoice(label, () => {
          setMessage("The door is locked. You need a special key.", "danger");
          render();
        }, "danger");
      } else {
        addChoice(label, () => moveTo(dest));
      }
    });
  }

  // Special actions
  if (state.location === "gate" && state.inventory.includes("golden_key")) {
    addChoice("Use Golden Key on the door", () => {
      LOCATIONS.gate.locked = false;
      setMessage("The key turns with a heavy click. The gate slowly opens...", "success");
      state.flags.escaped = true;
      moveTo("exit");
    });
  }

  // Inventory actions (use potion)
  if (state.inventory.includes("health_potion")) {
    addChoice("Drink Health Potion (+40 HP)", () => usePotion());
  }

  // Equip weapons/relics
  state.inventory.forEach(key => {
    const item = ITEMS[key];
    if (!item) return;
    if (item.type === "weapon" && state.equipped.weapon !== key) {
      addChoice(`Equip ${item.name}`, () => equipItem(key));
    }
    if (item.type === "relic" && state.equipped.relic !== key) {
      addChoice(`Equip ${item.name}`, () => equipItem(key));
    }
  });

  // Secret path after defeating guardian
  if (state.location === "lair" && state.flags.guardianDefeated && !state.flags.treasureFound) {
    addChoice("Search the lair carefully...", () => {
      state.location = "treasure";
      setMessage("Behind a false wall you discover a hidden chamber!", "success");
      render();
    });
  }

  // Win condition
  if (state.location === "exit") {
    showEnding(true);
  }
}

function moveTo(dest) {
  const loc = LOCATIONS[dest];

  // Enter combat if enemy present and not yet defeated
  if (loc.enemy && !state.flags.guardianDefeated) {
    const enemy = ENEMIES[loc.enemy];
    state.combat = {
      enemyKey: loc.enemy,
      enemyHp: enemy.hp
    };
    setMessage(`A ${enemy.name} blocks your path! ${enemy.desc}`, "danger");
    state.location = dest;
    render();
    return;
  }

  state.location = dest;
  setMessage(`You move to the ${loc.name}.`, "normal");
  render();
}

function takeItem(itemKey) {
  const item = ITEMS[itemKey];
  if (!item) return;

  if (item.type === "gold") {
    state.gold += item.effect.gold;
    setMessage(`You collect ${item.effect.gold} gold coins!`, "success");
    // remove from room
    const loc = LOCATIONS[state.location];
    loc.items = loc.items.filter(i => i !== itemKey);
    state.flags.treasureFound = true;
  } else {
    if (state.inventory.includes(itemKey)) {
      setMessage(`You already have the ${item.name}.`, "normal");
      return;
    }
    state.inventory.push(itemKey);
    setMessage(`You take the ${item.name}.`, "success");

    // Auto equip weapon if none
    if (item.type === "weapon" && !state.equipped.weapon) {
      state.equipped.weapon = itemKey;
      setMessage(`You take and equip the ${item.name}. (+${item.effect.atk} ATK)`, "success");
    }
    if (item.type === "relic") {
      // apply maxHp
      if (item.effect.maxHp) {
        state.maxHp += item.effect.maxHp;
        state.hp = Math.min(state.hp + item.effect.maxHp, state.maxHp);
      }
      state.equipped.relic = itemKey;
      setMessage(`You take and equip the ${item.name}.`, "success");
    }

    // remove from room
    const loc = LOCATIONS[state.location];
    loc.items = loc.items.filter(i => i !== itemKey);
  }
  render();
}

function equipItem(key) {
  const item = ITEMS[key];
  if (item.type === "weapon") {
    state.equipped.weapon = key;
    setMessage(`Equipped ${item.name}.`, "success");
  } else if (item.type === "relic") {
    state.equipped.relic = key;
    setMessage(`Equipped ${item.name}.`, "success");
  }
  render();
}

function usePotion() {
  const idx = state.inventory.indexOf("health_potion");
  if (idx === -1) return;
  state.inventory.splice(idx, 1);
  const heal = 40;
  state.hp = Math.min(state.hp + heal, state.maxHp);
  setMessage(`You drink the potion and recover ${heal} HP.`, "success");
  render();
}

// =====================================================
// COMBAT
// =====================================================

function renderCombat() {
  const enemy = ENEMIES[state.combat.enemyKey];
  $("location-title").textContent = `Combat — ${enemy.name}`;
  $("description").textContent = `${enemy.desc}\n\nEnemy HP: ${state.combat.enemyHp} / ${enemy.maxHp}`;

  clearChoices();
  addChoice("Attack", () => playerAttack());
  if (state.inventory.includes("health_potion")) {
    addChoice("Use Health Potion", () => {
      usePotion();
      // enemy still attacks after potion
      setTimeout(() => enemyAttack(), 400);
    });
  }
  addChoice("Try to Flee", () => tryFlee(), "danger");
}

function playerAttack() {
  const enemy = ENEMIES[state.combat.enemyKey];
  const damage = Math.max(1, getTotalAtk() - enemy.def + Math.floor(Math.random() * 5) - 2);
  state.combat.enemyHp -= damage;
  setMessage(`You strike the ${enemy.name} for ${damage} damage!`, "success");

  if (state.combat.enemyHp <= 0) {
    // Victory
    state.gold += enemy.gold;
    enemy.drops.forEach(drop => {
      if (!state.inventory.includes(drop)) {
        state.inventory.push(drop);
      }
    });
    state.flags.guardianDefeated = true;
    state.combat = null;
    setMessage(`You defeated the ${enemy.name}! It dropped a Golden Key and ${enemy.gold} gold.`, "success");
    render();
    return;
  }

  // Enemy attacks back
  setTimeout(() => enemyAttack(), 500);
}

function enemyAttack() {
  if (!state.combat) return;
  const enemy = ENEMIES[state.combat.enemyKey];
  const damage = Math.max(1, enemy.atk - getTotalDef() + Math.floor(Math.random() * 4) - 1);
  state.hp -= damage;
  setMessage(`The ${enemy.name} hits you for ${damage} damage!`, "danger");

  if (state.hp <= 0) {
    state.hp = 0;
    showEnding(false);
    return;
  }
  render();
}

function tryFlee() {
  if (Math.random() < 0.55) {
    state.combat = null;
    state.location = "hall";
    setMessage("You successfully fled back to the Main Hall!", "success");
    render();
  } else {
    setMessage("You failed to escape!", "danger");
    setTimeout(() => enemyAttack(), 400);
  }
}

// =====================================================
// ENDINGS & MODAL
// =====================================================

function showEnding(victory) {
  const modal = $("modal");
  const title = $("modal-title");
  const text = $("modal-text");
  const btn = $("modal-btn");

  if (victory) {
    title.textContent = "You Escaped!";
    let extra = "";
    if (state.flags.treasureFound) {
      extra = "\n\nYou also claimed the ancient treasure and the powerful amulet. True hero!";
    } else {
      extra = "\n\nYou escaped with your life, but the temple's secrets remain.";
    }
    text.textContent = `Congratulations! You made it out of the Forgotten Temple alive.\n\nFinal Gold: ${state.gold}${extra}`;
    btn.textContent = "Play Again";
  } else {
    title.textContent = "You Have Fallen...";
    text.textContent = "The temple claims another victim. Your adventure ends here.\n\nRefresh or click below to try again.";
    btn.textContent = "Try Again";
  }

  modal.classList.remove("hidden");
  btn.onclick = () => {
    modal.classList.add("hidden");
    // reset locations items (deep copy simple)
    LOCATIONS.hall.items = ["health_potion"];
    LOCATIONS.armory.items = ["rusty_sword"];
    LOCATIONS.treasure.items = ["ancient_amulet", "gold_pile"];
    LOCATIONS.gate.locked = true;
    startGame(true);
  };
}

// =====================================================
// SAVE / LOAD
// =====================================================

function saveGame() {
  try {
    localStorage.setItem("templeEscapeSave", JSON.stringify(state));
    setMessage("Game saved successfully.", "success");
    render();
  } catch (e) {
    setMessage("Failed to save.", "danger");
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem("templeEscapeSave");
    if (!raw) {
      setMessage("No save found.", "danger");
      render();
      return;
    }
    state = JSON.parse(raw);
    setMessage("Game loaded.", "success");
    render();
  } catch (e) {
    setMessage("Failed to load save.", "danger");
  }
}

// =====================================================
// INIT
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  $("btn-save").onclick = saveGame;
  $("btn-load").onclick = loadGame;
  $("btn-restart").onclick = () => {
    if (confirm("Restart the game? Current progress will be lost (unless saved).")) {
      LOCATIONS.hall.items = ["health_potion"];
      LOCATIONS.armory.items = ["rusty_sword"];
      LOCATIONS.treasure.items = ["ancient_amulet", "gold_pile"];
      LOCATIONS.gate.locked = true;
      startGame(true);
    }
  };
  startGame(true);
});