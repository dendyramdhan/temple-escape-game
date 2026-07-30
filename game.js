// =====================================================
// TEMPLE ESCAPE — Enhanced + Sound + Minimap + FX + Rank
// =====================================================

const LOCATIONS = {
  entrance: { name: "Temple Entrance", short: "ENT", desc: "You stand before the crumbling stone arch of an ancient temple. Vines choke the pillars. A cold wind whispers from the dark corridor ahead.", exits: { north: "hall" }, items: [], enemy: null },
  hall: { name: "Main Hall", short: "HALL", desc: "A vast chamber with cracked marble floors. Faded murals of forgotten gods line the walls. Passages branch in every direction.", exits: { south: "entrance", north: "corridor", east: "lair", west: "armory", northeast: "library" }, items: ["health_potion"], enemy: null },
  armory: { name: "Ruined Armory", short: "ARM", desc: "Racks of rusted weapons and shattered shields. Most are useless after centuries, but a few pieces still hold an edge.", exits: { east: "hall" }, items: ["iron_sword", "leather_armor"], enemy: null },
  library: { name: "Ancient Library", short: "LIB", desc: "Shelves of rotting tomes and scrolls. On a stone pedestal lies a single glowing tablet.", exits: { southwest: "hall", east: "crypt" }, items: ["ancient_scroll"], enemy: null },
  crypt: { name: "Burial Crypt", short: "CRP", desc: "Rows of stone sarcophagi. The silence is oppressive. Something moves in the deeper shadows.", exits: { west: "library" }, items: ["greater_potion"], enemy: "skeleton_warrior" },
  lair: { name: "Monster Lair", short: "LAIR", desc: "Bones, torn cloth, and dried blood cover the floor. Heavy claw marks scar the stone walls.", exits: { west: "hall", north: "underground" }, items: [], enemy: "temple_guardian" },
  underground: { name: "Underground", short: "UND", desc: "A damp tunnel descending deeper into the earth. You hear dripping water and distant growls.", exits: { south: "lair", north: "altar" }, items: [], enemy: "shadow_beast" },
  altar: { name: "Dark Altar", short: "ALT", desc: "A black stone altar stained with old offerings. Strange symbols glow faintly.", exits: { south: "underground", east: "treasure" }, items: ["obsidian_dagger"], enemy: null },
  treasure: { name: "Treasure Vault", short: "TRS", desc: "Gold coins and ancient artifacts glitter. A radiant amulet rests on the pedestal.", exits: { west: "altar" }, items: ["ancient_amulet", "gold_hoard"], enemy: null },
  corridor: { name: "Long Corridor", short: "COR", desc: "A narrow stone hallway. At the far end stands a massive iron-bound door sealed with an ornate lock.", exits: { south: "hall", north: "gate" }, items: [], enemy: null },
  gate: { name: "Sealed Gate", short: "GATE", desc: "A towering door of iron and ancient wood. You can feel a faint breeze of freedom on the other side.", exits: { south: "corridor" }, items: [], enemy: null, locked: true, requires: "golden_key" },
  exit: { name: "Temple Exit", short: "EXIT", desc: "Sunlight floods the opening. You have survived the Forgotten Temple.", exits: {}, items: [], enemy: null }
};

const ITEMS = {
  health_potion: { name: "Health Potion", type: "consumable", effect: { hp: 45 } },
  greater_potion: { name: "Greater Potion", type: "consumable", effect: { hp: 80 } },
  iron_sword: { name: "Iron Sword", type: "weapon", effect: { atk: 12 } },
  obsidian_dagger: { name: "Obsidian Dagger", type: "weapon", effect: { atk: 18, crit: 5 } },
  leather_armor: { name: "Leather Armor", type: "armor", effect: { def: 8 } },
  ancient_amulet: { name: "Ancient Amulet", type: "accessory", effect: { def: 6, maxHp: 30, crit: 10 } },
  ancient_scroll: { name: "Ancient Scroll", type: "special", effect: { exp: 15 } },
  golden_key: { name: "Golden Key", type: "key" },
  gold_hoard: { name: "Gold Hoard", type: "gold", effect: { gold: 120 } }
};

const ENEMIES = {
  skeleton_warrior: { name: "Skeleton Warrior", hp: 38, maxHp: 38, atk: 11, def: 2, exp: 25, gold: 18, drops: ["health_potion"], desc: "Bones held together by dark magic. It raises a chipped blade." },
  temple_guardian: { name: "Temple Guardian", hp: 70, maxHp: 70, atk: 15, def: 5, exp: 55, gold: 40, drops: ["golden_key"], desc: "A massive stone golem with glowing red eyes." },
  shadow_beast: { name: "Shadow Beast", hp: 55, maxHp: 55, atk: 14, def: 3, exp: 40, gold: 30, drops: ["greater_potion"], desc: "A creature of pure darkness. Its form shifts and writhes." }
};

const MAP_LAYOUT = [
  [null, "gate", null],
  [null, "corridor", null],
  ["armory", "hall", "lair"],
  ["library", null, "underground"],
  ["crypt", null, "altar"],
  [null, "entrance", "treasure"]
];

let state = createInitialState();
let audioCtx = null;
let soundEnabled = true;

function createInitialState() {
  return {
    location: "entrance",
    level: 1, exp: 0, expToNext: 50,
    hp: 100, maxHp: 100, baseAtk: 12, baseDef: 6, gold: 0,
    inventory: [],
    equipped: { weapon: null, armor: null, accessory: null },
    combat: null,
    visited: ["entrance"],
    flags: { guardianDefeated: false, skeletonDefeated: false, shadowDefeated: false, treasureFound: false, scrollRead: false, escaped: false },
    message: "You arrive at the Forgotten Temple. Your adventure begins...",
    messageType: "normal",
    score: 0
  };
}

function $(id) { return document.getElementById(id); }

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playTone(freq, duration, type = "square", vol = 0.08) {
  if (!soundEnabled) return;
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

function sfx(name) {
  if (!soundEnabled) return;
  switch (name) {
    case "attack": playTone(180, 0.08, "square", 0.07); setTimeout(() => playTone(120, 0.06, "square", 0.05), 60); break;
    case "crit": playTone(400, 0.1, "sawtooth", 0.09); setTimeout(() => playTone(600, 0.12, "square", 0.07), 80); break;
    case "hit": playTone(90, 0.15, "sawtooth", 0.08); break;
    case "heal": playTone(320, 0.12, "sine", 0.06); setTimeout(() => playTone(480, 0.15, "sine", 0.05), 100); break;
    case "level": playTone(260, 0.1, "square", 0.07); setTimeout(() => playTone(390, 0.12, "square", 0.07), 100); setTimeout(() => playTone(520, 0.18, "square", 0.06), 220); break;
    case "item": playTone(500, 0.08, "sine", 0.05); setTimeout(() => playTone(700, 0.1, "sine", 0.04), 70); break;
    case "win": playTone(300, 0.12, "square", 0.07); setTimeout(() => playTone(400, 0.12, "square", 0.07), 120); setTimeout(() => playTone(500, 0.2, "square", 0.06), 250); break;
    case "lose": playTone(150, 0.3, "sawtooth", 0.08); setTimeout(() => playTone(100, 0.4, "sawtooth", 0.06), 200); break;
    case "click": playTone(220, 0.04, "square", 0.03); break;
  }
}

function flash(type) {
  const el = $("flash");
  el.className = type;
  setTimeout(() => { el.className = ""; }, 180);
}

function setMessage(text, type = "normal") {
  state.message = text;
  state.messageType = type;
}

function getTotalAtk() {
  let bonus = 0;
  if (state.equipped.weapon) bonus += ITEMS[state.equipped.weapon]?.effect?.atk || 0;
  return state.baseAtk + bonus + (state.level - 1) * 2;
}

function getTotalDef() {
  let bonus = 0;
  if (state.equipped.armor) bonus += ITEMS[state.equipped.armor]?.effect?.def || 0;
  if (state.equipped.accessory) bonus += ITEMS[state.equipped.accessory]?.effect?.def || 0;
  return state.baseDef + bonus + (state.level - 1);
}

function getCritChance() {
  let crit = 8;
  if (state.equipped.weapon) crit += ITEMS[state.equipped.weapon]?.effect?.crit || 0;
  if (state.equipped.accessory) crit += ITEMS[state.equipped.accessory]?.effect?.crit || 0;
  return crit;
}

function updateStatus() {
  $("level").textContent = state.level;
  $("hp").textContent = state.hp;
  $("max-hp").textContent = state.maxHp;
  $("atk").textContent = getTotalAtk();
  $("def").textContent = getTotalDef();
  $("gold").textContent = state.gold;
  $("exp").textContent = state.exp;
  $("exp-next").textContent = state.expToNext;

  const hpPct = Math.max(0, Math.min(100, (state.hp / state.maxHp) * 100));
  const expPct = Math.max(0, Math.min(100, (state.exp / state.expToNext) * 100));
  $("hp-bar").style.width = hpPct + "%";
  $("exp-bar").style.width = expPct + "%";

  $("eq-weapon").textContent = state.equipped.weapon ? ITEMS[state.equipped.weapon].name : "None";
  $("eq-armor").textContent = state.equipped.armor ? ITEMS[state.equipped.armor].name : "None";
  $("eq-accessory").textContent = state.equipped.accessory ? ITEMS[state.equipped.accessory].name : "None";
}

function updateEnemyBar() {
  const wrap = $("enemy-bar-wrap");
  if (!state.combat) {
    wrap.classList.add("hidden");
    return;
  }
  const enemy = ENEMIES[state.combat.enemyKey];
  wrap.classList.remove("hidden");
  $("enemy-name").textContent = enemy.name;
  $("enemy-hp-text").textContent = Math.max(0, state.combat.enemyHp) + " / " + enemy.maxHp;
  const pct = Math.max(0, Math.min(100, (state.combat.enemyHp / enemy.maxHp) * 100));
  $("enemy-hp-bar").style.width = pct + "%";
}

function renderMinimap() {
  const container = $("minimap");
  container.innerHTML = "";
  MAP_LAYOUT.forEach(row => {
    row.forEach(key => {
      const cell = document.createElement("div");
      cell.className = "mm-cell";
      if (!key) {
        cell.classList.add("empty");
      } else {
        cell.textContent = LOCATIONS[key].short;
        if (state.visited.includes(key)) cell.classList.add("visited");
        if (state.location === key) cell.classList.add("current");
      }
      container.appendChild(cell);
    });
  });
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
    list.appendChild(li);
  });
}

function clearChoices() { $("choices").innerHTML = ""; }

function addChoice(label, cb, cls = "") {
  const btn = document.createElement("button");
  btn.className = "btn " + cls;
  btn.textContent = label;
  btn.onclick = () => { sfx("click"); cb(); };
  $("choices").appendChild(btn);
}

function gainExp(amount) {
  state.exp += amount;
  let leveled = false;
  while (state.exp >= state.expToNext) {
    state.exp -= state.expToNext;
    state.level++;
    state.expToNext = Math.floor(state.expToNext * 1.45);
    state.maxHp += 18;
    state.hp = state.maxHp;
    state.baseAtk += 2;
    state.baseDef += 1;
    leveled = true;
  }
  if (leveled) {
    setMessage(`LEVEL UP! You are now Level ${state.level}. Stats increased!`, "levelup");
    sfx("level");
    flash("level");
  }
}

function startGame(fresh = true) {
  if (fresh) {
    state = createInitialState();
    LOCATIONS.hall.items = ["health_potion"];
    LOCATIONS.armory.items = ["iron_sword", "leather_armor"];
    LOCATIONS.library.items = ["ancient_scroll"];
    LOCATIONS.crypt.items = ["greater_potion"];
    LOCATIONS.altar.items = ["obsidian_dagger"];
    LOCATIONS.treasure.items = ["ancient_amulet", "gold_hoard"];
    LOCATIONS.gate.locked = true;
  }
  render();
}

function render() {
  updateStatus();
  renderInventory();
  renderMinimap();
  updateEnemyBar();

  const loc = LOCATIONS[state.location];
  $("location-title").textContent = loc.name;
  $("description").textContent = loc.desc;

  const msgEl = $("message-log");
  msgEl.textContent = state.message;
  msgEl.className = state.messageType;

  const gameArea = $("game-area");
  if (state.combat) gameArea.classList.add("combat-mode");
  else gameArea.classList.remove("combat-mode");

  clearChoices();

  if (state.combat) {
    renderCombat();
    return;
  }

  if (loc.items) {
    loc.items.forEach(key => {
      if (!state.inventory.includes(key) && !(key === "gold_hoard" && state.flags.treasureFound)) {
        const item = ITEMS[key];
        if (item) addChoice(`Take ${item.name}`, () => takeItem(key));
      }
    });
  }

  if (loc.exits) {
    Object.entries(loc.exits).forEach(([dir, dest]) => {
      const destLoc = LOCATIONS[dest];
      let label = `Go ${dir} → ${destLoc.name}`;
      if (destLoc.locked && !state.inventory.includes(destLoc.requires)) {
        addChoice(label + " (Locked)", () => {
          setMessage("The door is sealed. You need the Golden Key.", "danger");
          render();
        }, "danger");
      } else {
        addChoice(label, () => moveTo(dest));
      }
    });
  }

  if (state.location === "gate" && state.inventory.includes("golden_key") && LOCATIONS.gate.locked) {
    addChoice("Use Golden Key", () => {
      LOCATIONS.gate.locked = false;
      setMessage("The key turns. The massive gate slowly swings open...", "success");
      state.flags.escaped = true;
      moveTo("exit");
    });
  }

  state.inventory.forEach(key => {
    const item = ITEMS[key];
    if (item?.type === "consumable") addChoice(`Use ${item.name}`, () => useItem(key));
    if (item?.type === "special" && key === "ancient_scroll" && !state.flags.scrollRead) {
      addChoice("Read Ancient Scroll (+15 EXP)", () => {
        state.flags.scrollRead = true;
        gainExp(15);
        setMessage("The scroll reveals forgotten techniques. You feel wiser.", "success");
        sfx("item");
        render();
      });
    }
  });

  state.inventory.forEach(key => {
    const item = ITEMS[key];
    if (!item) return;
    if (item.type === "weapon" && state.equipped.weapon !== key) addChoice(`Equip ${item.name}`, () => equip(key, "weapon"));
    if (item.type === "armor" && state.equipped.armor !== key) addChoice(`Equip ${item.name}`, () => equip(key, "armor"));
    if (item.type === "accessory" && state.equipped.accessory !== key) addChoice(`Equip ${item.name}`, () => equip(key, "accessory"));
  });

  if (state.location === "exit") {
    calculateScore();
    showEnding(true);
  }
}

function moveTo(dest) {
  const gameArea = $("game-area");
  gameArea.classList.add("fade-out");

  setTimeout(() => {
    const loc = LOCATIONS[dest];
    if (!state.visited.includes(dest)) state.visited.push(dest);

    let enemyKey = loc.enemy;
    let alreadyDefeated = false;
    if (enemyKey === "temple_guardian") alreadyDefeated = state.flags.guardianDefeated;
    if (enemyKey === "skeleton_warrior") alreadyDefeated = state.flags.skeletonDefeated;
    if (enemyKey === "shadow_beast") alreadyDefeated = state.flags.shadowDefeated;

    if (enemyKey && !alreadyDefeated) {
      const enemy = ENEMIES[enemyKey];
      state.combat = { enemyKey, enemyHp: enemy.hp, defending: false };
      setMessage(`A ${enemy.name} appears! ${enemy.desc}`, "danger");
      state.location = dest;
      sfx("hit");
    } else {
      state.location = dest;
      setMessage(`You enter the ${loc.name}.`, "normal");
    }

    gameArea.classList.remove("fade-out");
    render();
  }, 180);
}

function takeItem(key) {
  const item = ITEMS[key];
  if (!item) return;
  sfx("item");

  if (item.type === "gold") {
    state.gold += item.effect.gold;
    setMessage(`You claim ${item.effect.gold} gold!`, "success");
    state.flags.treasureFound = true;
    LOCATIONS[state.location].items = LOCATIONS[state.location].items.filter(i => i !== key);
  } else {
    if (state.inventory.includes(key)) {
      setMessage(`You already have the ${item.name}.`, "normal");
      return;
    }
    state.inventory.push(key);
    setMessage(`You take the ${item.name}.`, "success");

    if (item.type === "weapon" && !state.equipped.weapon) equip(key, "weapon", true);
    if (item.type === "armor" && !state.equipped.armor) equip(key, "armor", true);
    if (item.type === "accessory") {
      if (item.effect.maxHp) {
        state.maxHp += item.effect.maxHp;
        state.hp = Math.min(state.hp + item.effect.maxHp, state.maxHp);
      }
      equip(key, "accessory", true);
    }
    LOCATIONS[state.location].items = LOCATIONS[state.location].items.filter(i => i !== key);
  }
  render();
}

function equip(key, slot, silent = false) {
  state.equipped[slot] = key;
  if (!silent) {
    setMessage(`Equipped ${ITEMS[key].name}.`, "success");
    sfx("item");
    render();
  }
}

function useItem(key) {
  const item = ITEMS[key];
  if (!item || item.type !== "consumable") return;
  const idx = state.inventory.indexOf(key);
  if (idx === -1) return;
  state.inventory.splice(idx, 1);
  const heal = item.effect.hp;
  state.hp = Math.min(state.hp + heal, state.maxHp);
  setMessage(`You use the ${item.name} and recover ${heal} HP.`, "success");
  sfx("heal");
  flash("heal");
  render();
}

function renderCombat() {
  const enemy = ENEMIES[state.combat.enemyKey];
  $("location-title").textContent = `⚔ COMBAT — ${enemy.name}`;
  $("description").textContent = enemy.desc;

  clearChoices();
  addChoice("Attack", () => playerAttack(1.0));
  addChoice("Power Strike (150% dmg, 70% hit)", () => playerAttack(1.5, 0.7), "skill");
  addChoice("Defend (reduce next damage)", () => {
    state.combat.defending = true;
    setMessage("You raise your guard.", "normal");
    setTimeout(() => enemyAttack(), 400);
  });
  state.inventory.forEach(key => {
    if (ITEMS[key]?.type === "consumable") {
      addChoice(`Use ${ITEMS[key].name}`, () => {
        useItem(key);
        setTimeout(() => enemyAttack(), 400);
      });
    }
  });
  addChoice("Flee", () => tryFlee(), "danger");
}

function playerAttack(multiplier = 1.0, hitChance = 0.92) {
  if (Math.random() > hitChance) {
    setMessage("Your attack misses!", "danger");
    sfx("hit");
    setTimeout(() => enemyAttack(), 500);
    return;
  }

  const enemy = ENEMIES[state.combat.enemyKey];
  let damage = Math.max(1, Math.floor((getTotalAtk() - enemy.def) * multiplier) + Math.floor(Math.random() * 6) - 2);
  let isCrit = Math.random() * 100 < getCritChance();

  if (isCrit) {
    damage = Math.floor(damage * 1.7);
    setMessage(`CRITICAL HIT! You deal ${damage} damage!`, "success");
    sfx("crit");
    flash("crit");
  } else {
    setMessage(`You hit for ${damage} damage.`, "success");
    sfx("attack");
  }

  state.combat.enemyHp -= damage;
  updateEnemyBar();

  if (state.combat.enemyHp <= 0) {
    state.gold += enemy.gold;
    gainExp(enemy.exp);
    enemy.drops.forEach(d => { if (!state.inventory.includes(d)) state.inventory.push(d); });

    if (state.combat.enemyKey === "temple_guardian") state.flags.guardianDefeated = true;
    if (state.combat.enemyKey === "skeleton_warrior") state.flags.skeletonDefeated = true;
    if (state.combat.enemyKey === "shadow_beast") state.flags.shadowDefeated = true;

    state.combat = null;
    setMessage(`Victory! ${enemy.name} defeated. +${enemy.exp} EXP, +${enemy.gold} gold.`, "success");
    sfx("win");
    render();
    return;
  }

  setTimeout(() => enemyAttack(), 550);
}

function enemyAttack() {
  if (!state.combat) return;
  const enemy = ENEMIES[state.combat.enemyKey];
  let damage = Math.max(1, enemy.atk - getTotalDef() + Math.floor(Math.random() * 5) - 1);

  if (state.combat.defending) {
    damage = Math.floor(damage * 0.45);
    state.combat.defending = false;
    setMessage(`You block! Only take ${damage} damage.`, "normal");
  } else {
    setMessage(`The ${enemy.name} hits you for ${damage} damage!`, "danger");
  }

  state.hp -= damage;
  sfx("hit");
  flash("hit");

  if (state.hp <= 0) {
    state.hp = 0;
    showEnding(false);
    return;
  }
  render();
}

function tryFlee() {
  const chance = 0.4 + (getTotalDef() * 0.01);
  if (Math.random() < chance) {
    state.combat = null;
    state.location = "hall";
    setMessage("You successfully fled to the Main Hall!", "success");
    render();
  } else {
    setMessage("Failed to flee!", "danger");
    setTimeout(() => enemyAttack(), 400);
  }
}

function calculateScore() {
  let score = state.gold * 2 + state.level * 40;
  if (state.flags.treasureFound) score += 200;
  if (state.flags.scrollRead) score += 50;
  if (state.flags.skeletonDefeated) score += 30;
  if (state.flags.shadowDefeated) score += 40;
  if (state.flags.guardianDefeated) score += 80;
  state.score = score;
}

function getRank(score) {
  if (score >= 700) return "S";
  if (score >= 500) return "A";
  if (score >= 300) return "B";
  return "C";
}

function showEnding(victory) {
  const modal = $("modal");
  const title = $("modal-title");
  const text = $("modal-text");
  const btn = $("modal-btn");
  const rankEl = $("rank-badge");

  if (victory) {
    title.textContent = "YOU ESCAPED";
    const rank = getRank(state.score);
    rankEl.textContent = rank;
    rankEl.className = "rank-" + rank;
    rankEl.classList.remove("hidden");

    let extra = `\n\nFinal Score: ${state.score}\nLevel: ${state.level}  |  Gold: ${state.gold}`;
    if (state.flags.treasureFound) extra += "\n\n✦ You claimed the Ancient Amulet and the full treasure!";
    else extra += "\n\nYou escaped, but left secrets behind.";
    text.textContent = `You have survived the Forgotten Temple.${extra}`;
    btn.textContent = "PLAY AGAIN";
    sfx("win");
  } else {
    title.textContent = "YOU HAVE FALLEN";
    rankEl.classList.add("hidden");
    text.textContent = "The temple claims another soul.\n\nYour adventure ends here.";
    btn.textContent = "TRY AGAIN";
    sfx("lose");
  }

  modal.classList.remove("hidden");
  btn.onclick = () => {
    modal.classList.add("hidden");
    startGame(true);
  };
}

function saveGame() {
  try {
    localStorage.setItem("templeEscapeEnhanced", JSON.stringify(state));
    setMessage("Game saved.", "success");
    render();
  } catch (e) { setMessage("Save failed.", "danger"); }
}

function loadGame() {
  try {
    const raw = localStorage.getItem("templeEscapeEnhanced");
    if (!raw) { setMessage("No save data found.", "danger"); render(); return; }
    state = JSON.parse(raw);
    if (!state.visited) state.visited = ["entrance"];
    setMessage("Game loaded.", "success");
    render();
  } catch (e) { setMessage("Load failed.", "danger"); }
}

document.addEventListener("DOMContentLoaded", () => {
  $("btn-save").onclick = saveGame;
  $("btn-load").onclick = loadGame;
  $("btn-restart").onclick = () => {
    if (confirm("Restart game? Unsaved progress will be lost.")) startGame(true);
  };
  $("btn-mute").onclick = () => {
    soundEnabled = !soundEnabled;
    $("btn-mute").textContent = soundEnabled ? "SOUND: ON" : "SOUND: OFF";
    if (soundEnabled) sfx("click");
  };

  document.body.addEventListener("click", () => initAudio(), { once: true });
  startGame(true);
});
