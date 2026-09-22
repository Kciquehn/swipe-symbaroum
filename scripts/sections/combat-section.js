/**
 * Combat Section - Weapons, Armor, and Combat Traits
 */

const i18n = (key) => game.i18n.localize(key);

export class CombatSection {
  constructor(actor, drawer) {
    this.actor = actor;
    this.drawer = drawer;
  }

  get id() { return 'combat'; }
  get label() { return i18n('SWIPE_SYM.Tab.Combat'); }
  get icon() { return 'fas fa-crossed-swords'; }

  render(container) {
    container.innerHTML = `<div class="ssym-section active">${this._getHTML()}</div>`;
    this._bindEvents(container);
  }

  _getHTML() {
    const weapons = this.actor.items.filter(i => i.type === 'weapon');
    const armors = this.actor.items.filter(i => i.type === 'armor');
    const traits = this.actor.items.filter(i => i.type === 'trait' && this._hasActiveLevel(i));

    // Sort: active/equipped first
    const sortByState = (a, b) => {
      const stateOrder = { active: 0, equipped: 1, other: 2 };
      return (stateOrder[a.system.state] ?? 2) - (stateOrder[b.system.state] ?? 2);
    };
    weapons.sort(sortByState);
    armors.sort(sortByState);

    return `
      <!-- Weapons -->
      <div class="ssym-section-title">${i18n('SWIPE_SYM.Weapons')}</div>
      <div class="ssym-item-list">
        ${weapons.length === 0 ? `<p class="ssym-empty">${i18n('SWIPE_SYM.NoWeapons')}</p>` : ''}
        ${weapons.map(w => this._renderWeapon(w)).join('')}
      </div>

      <!-- Armor -->
      <div class="ssym-section-title">${i18n('SWIPE_SYM.ArmorSection')}</div>
      <div class="ssym-item-list">
        ${armors.length === 0 ? `<p class="ssym-empty">${i18n('SWIPE_SYM.NoArmor')}</p>` : ''}
        ${armors.map(a => this._renderArmor(a)).join('')}
      </div>

      <!-- Active Combat Traits -->
      ${traits.length > 0 ? `
        <div class="ssym-section-title">${i18n('SWIPE_SYM.CombatTraits')}</div>
        <div class="ssym-item-list">
          ${traits.map(t => this._renderTrait(t)).join('')}
        </div>
      ` : ''}
    `;
  }

  _renderWeapon(weapon) {
    const sys = weapon.system;
    const isActive = sys.state === 'active';
    const attrLabel = i18n(`ATTRIBUTE.${(sys.attribute || 'accurate').toUpperCase()}ABBR`);
    const damage = sys.baseDamage || '1d8';
    const bonusDmg = sys.bonusDamage ? `+${sys.bonusDamage}` : '';

    // Collect active qualities
    const qualities = this._getActiveQualities(sys.qualities);

    return `
      <div class="ssym-item-row ${isActive ? 'ssym-item-active' : ''}" data-item-id="${weapon.id}">
        <img class="ssym-item-icon" src="${weapon.img}" alt="${weapon.name}" />
        <div class="ssym-item-info">
          <div class="ssym-item-name">${weapon.name}</div>
          <div class="ssym-item-details">
            <span class="ssym-item-tag">${attrLabel}</span>
            <span class="ssym-item-tag">${damage}${bonusDmg}</span>
            ${qualities ? `<span class="ssym-item-qualities">${qualities}</span>` : ''}
          </div>
        </div>
        <div class="ssym-item-actions">
          <button type="button" class="ssym-btn ssym-btn-attack" data-action="attack" data-item-id="${weapon.id}">
            <i class="fas fa-dice-d20"></i>
          </button>
        </div>
      </div>
    `;
  }

  _renderArmor(armor) {
    const sys = armor.system;
    const isActive = sys.state === 'active';
    const prot = sys.baseProtection || '0';
    const bonusProt = sys.bonusProtection ? `+${sys.bonusProtection}` : '';
    const qualities = this._getActiveQualities(sys.qualities);

    return `
      <div class="ssym-item-row ${isActive ? 'ssym-item-active' : ''}" data-item-id="${armor.id}">
        <img class="ssym-item-icon" src="${armor.img}" alt="${armor.name}" />
        <div class="ssym-item-info">
          <div class="ssym-item-name">${armor.name}</div>
          <div class="ssym-item-details">
            <span class="ssym-item-tag">${i18n('SWIPE_SYM.Protection')}: ${prot}${bonusProt}</span>
            ${qualities ? `<span class="ssym-item-qualities">${qualities}</span>` : ''}
          </div>
        </div>
        <div class="ssym-item-actions">
          <button type="button" class="ssym-btn ssym-btn-protect" data-action="protect" data-item-id="${armor.id}">
            <i class="fas fa-shield-alt"></i>
          </button>
        </div>
      </div>
    `;
  }

  _renderTrait(trait) {
    const rank = this._getActiveRank(trait);
    return `
      <div class="ssym-item-row ssym-item-compact" data-item-id="${trait.id}">
        <img class="ssym-item-icon" src="${trait.img}" alt="${trait.name}" />
        <div class="ssym-item-info">
          <div class="ssym-item-name">${trait.name}</div>
          <div class="ssym-item-details">
            <span class="ssym-rank-badge ssym-rank-${rank}">${i18n(`SWIPE_SYM.${rank.charAt(0).toUpperCase() + rank.slice(1)}`)}</span>
          </div>
        </div>
      </div>
    `;
  }

  _hasActiveLevel(item) {
    return item.system.novice?.isActive || item.system.adept?.isActive || item.system.master?.isActive;
  }

  _getActiveRank(item) {
    if (item.system.master?.isActive) return 'master';
    if (item.system.adept?.isActive) return 'adept';
    if (item.system.novice?.isActive) return 'novice';
    return 'novice';
  }

  _getActiveQualities(qualities) {
    if (!qualities) return '';
    const active = Object.entries(qualities)
      .filter(([_, v]) => v === true)
      .map(([k]) => k.replace(/([A-Z])/g, ' $1').trim())
      .slice(0, 3);
    return active.length > 0 ? active.join(', ') : '';
  }

  _bindEvents(container) {
    // Attack buttons
    container.querySelectorAll('[data-action="attack"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemId = btn.dataset.itemId;
        const weapon = this.actor.items.get(itemId);
        if (!weapon) return;

        btn.classList.add('ssym-pressed');
        setTimeout(() => btn.classList.remove('ssym-pressed'), 200);

        this._rollAttack(weapon);
      });
    });

    // Protect buttons
    container.querySelectorAll('[data-action="protect"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();

        btn.classList.add('ssym-pressed');
        setTimeout(() => btn.classList.remove('ssym-pressed'), 200);

        this._rollArmor();
      });
    });

    // Item rows: tap to open sheet
    container.querySelectorAll('.ssym-item-row').forEach(row => {
      let pressTimer;
      row.addEventListener('touchstart', () => {
        pressTimer = setTimeout(() => {
          const itemId = row.dataset.itemId;
          const item = this.actor.items.get(itemId);
          if (item?.sheet) item.sheet.render(true);
        }, 500);
      }, { passive: true });
      row.addEventListener('touchend', () => clearTimeout(pressTimer), { passive: true });
      row.addEventListener('touchmove', () => clearTimeout(pressTimer), { passive: true });
    });
  }

  async _rollAttack(weapon) {
    try {
      if (typeof this.actor.rollWeapon === 'function') {
        return await this.actor.rollWeapon(weapon);
      }
      // Fallback
      const attr = weapon.system.attribute || 'accurate';
      if (typeof this.actor.rollAttribute === 'function') {
        return await this.actor.rollAttribute(attr);
      }
    } catch (err) {
      console.error('swipe-symbaroum | Error rolling attack:', err);
    }
  }

  async _rollArmor() {
    try {
      if (typeof this.actor.rollArmor === 'function') {
        return await this.actor.rollArmor();
      }
    } catch (err) {
      console.error('swipe-symbaroum | Error rolling armor:', err);
    }
  }
}
