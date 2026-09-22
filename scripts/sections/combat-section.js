/**
 * Combat Section - Weapons, Armor, and Combat Traits
 * Supports Weapon Readiness (Sacar/Guardar Armas) from symbaroum-ind-resources
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

  // ─── Weapon Readiness Helpers (symbaroum-ind-resources) ─────────────────────

  _isWeaponReadinessActive() {
    return Boolean(
      game.modules.get('symbaroum-ind-resources')?.active &&
      game.tenebreResources?.weaponReadiness?.isEnabled?.()
    );
  }

  _isWeaponDrawn(weapon) {
    if (this._isWeaponReadinessActive()) {
      return game.tenebreResources.weaponReadiness.isDrawn(weapon);
    }
    return String(weapon.system?.state ?? '').toLowerCase() === 'active';
  }

  async _toggleWeaponReadiness(weapon) {
    const isDrawn = this._isWeaponDrawn(weapon);
    if (this._isWeaponReadinessActive()) {
      await game.tenebreResources.weaponReadiness.setDrawn(weapon, !isDrawn);
    } else {
      await weapon.update({ 'system.state': isDrawn ? 'equipped' : 'active' });
    }
    // Refresh drawer
    this.drawer.renderCurrentSection();
  }

  // ─── HTML Generation ───────────────────────────────────────────────────────

  _getHTML() {
    const weapons = this.actor.items.filter(i => i.type === 'weapon');
    const armors = this.actor.items.filter(i => i.type === 'armor');
    const traits = this.actor.items.filter(i => i.type === 'trait' && this._hasActiveLevel(i));

    // Sort: drawn / active first, then equipped, then other
    weapons.sort((a, b) => {
      const aDrawn = this._isWeaponDrawn(a) ? 0 : 1;
      const bDrawn = this._isWeaponDrawn(b) ? 0 : 1;
      if (aDrawn !== bDrawn) return aDrawn - bDrawn;
      return a.name.localeCompare(b.name);
    });

    armors.sort((a, b) => {
      const aActive = a.system.state === 'active' ? 0 : 1;
      const bActive = b.system.state === 'active' ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return a.name.localeCompare(b.name);
    });

    const hasReadiness = this._isWeaponReadinessActive();

    return `
      <!-- Weapons Section -->
      <div class="ssym-section-header">
        <div class="ssym-section-title">${i18n('SWIPE_SYM.Weapons')}</div>
        ${hasReadiness ? `
          <button type="button" class="ssym-btn-pill" data-action="manage-readiness">
            <i class="fas fa-hand-holding-hand"></i>
            <span>${i18n('SWIPE_SYM.ManageWeapons')}</span>
          </button>
        ` : ''}
      </div>

      <div class="ssym-card-list">
        ${weapons.length === 0 ? `<p class="ssym-empty">${i18n('SWIPE_SYM.NoWeapons')}</p>` : ''}
        ${weapons.map(w => this._renderWeapon(w)).join('')}
      </div>

      <!-- Armor Section -->
      <div class="ssym-section-header">
        <div class="ssym-section-title">${i18n('SWIPE_SYM.ArmorSection')}</div>
      </div>

      <div class="ssym-card-list">
        ${armors.length === 0 ? `<p class="ssym-empty">${i18n('SWIPE_SYM.NoArmor')}</p>` : ''}
        ${armors.map(a => this._renderArmor(a)).join('')}
      </div>

      <!-- Combat Traits -->
      ${traits.length > 0 ? `
        <div class="ssym-section-header">
          <div class="ssym-section-title">${i18n('SWIPE_SYM.CombatTraits')}</div>
        </div>
        <div class="ssym-card-list">
          ${traits.map(t => this._renderTrait(t)).join('')}
        </div>
      ` : ''}
    `;
  }

  _renderWeapon(weapon) {
    const sys = weapon.system;
    const isDrawn = this._isWeaponDrawn(weapon);
    const attrKey = sys.attribute || 'accurate';
    const attrLabel = i18n(`ATTRIBUTE.${attrKey.toUpperCase()}ABBR`);
    const damage = sys.baseDamage || '1d8';
    const bonusDmg = sys.bonusDamage ? `+${sys.bonusDamage}` : '';
    const qualities = this._getActiveQualities(sys.qualities);

    return `
      <div class="ssym-item-card ${isDrawn ? 'is-drawn' : 'is-sheathed'}" data-item-id="${weapon.id}">
        <div class="ssym-item-main">
          <img class="ssym-item-icon" src="${weapon.img}" alt="${weapon.name}" />
          <div class="ssym-item-content">
            <div class="ssym-item-title-row">
              <span class="ssym-item-name">${weapon.name}</span>
              <button type="button" class="ssym-badge-btn ${isDrawn ? 'drawn' : 'sheathed'}" data-action="toggle-drawn" data-item-id="${weapon.id}" title="${isDrawn ? i18n('SWIPE_SYM.Sheathe') : i18n('SWIPE_SYM.Draw')}">
                <i class="fas ${isDrawn ? 'fa-hand-fist' : 'fa-hand'}"></i>
                <span>${isDrawn ? i18n('SWIPE_SYM.Drawn') : i18n('SWIPE_SYM.Sheathed')}</span>
              </button>
            </div>
            <div class="ssym-item-tags">
              <span class="ssym-tag ssym-tag-attr">${attrLabel}</span>
              <span class="ssym-tag ssym-tag-damage">${damage}${bonusDmg}</span>
              ${qualities ? `<span class="ssym-tag ssym-tag-qualities">${qualities}</span>` : ''}
            </div>
          </div>
        </div>

        <div class="ssym-item-footer">
          <button type="button" class="ssym-card-btn ssym-btn-attack" data-action="attack" data-item-id="${weapon.id}" title="${i18n('SWIPE_SYM.Attack')}">
            <i class="fas fa-dice-d20"></i>
            <span>${i18n('SWIPE_SYM.Attack')}</span>
          </button>
          <button type="button" class="ssym-card-btn ssym-btn-damage" data-action="damage" data-item-id="${weapon.id}" title="${i18n('SWIPE_SYM.Damage')}">
            <i class="fas fa-tint"></i>
            <span>${damage}${bonusDmg}</span>
          </button>
          <button type="button" class="ssym-card-btn ssym-btn-draw-toggle ${isDrawn ? 'is-drawn' : ''}" data-action="toggle-drawn" data-item-id="${weapon.id}">
            <i class="fas ${isDrawn ? 'fa-shield' : 'fa-hand-fist'}"></i>
            <span>${isDrawn ? i18n('SWIPE_SYM.Sheathe') : i18n('SWIPE_SYM.Draw')}</span>
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
    const impediment = sys.impediment ? `${sys.impediment}` : '0';
    const qualities = this._getActiveQualities(sys.qualities);

    return `
      <div class="ssym-item-card is-armor ${isActive ? 'is-active-armor' : ''}" data-item-id="${armor.id}">
        <div class="ssym-item-main">
          <img class="ssym-item-icon" src="${armor.img}" alt="${armor.name}" />
          <div class="ssym-item-content">
            <div class="ssym-item-title-row">
              <span class="ssym-item-name">${armor.name}</span>
              ${isActive ? `<span class="ssym-badge-btn drawn"><i class="fas fa-shield-halved"></i> Equipada</span>` : ''}
            </div>
            <div class="ssym-item-tags">
              <span class="ssym-tag ssym-tag-protect">${i18n('SWIPE_SYM.Protection')}: ${prot}${bonusProt}</span>
              <span class="ssym-tag ssym-tag-impediment">${i18n('SWIPE_SYM.Impediment')}: ${impediment}</span>
              ${qualities ? `<span class="ssym-tag ssym-tag-qualities">${qualities}</span>` : ''}
            </div>
          </div>
        </div>

        <div class="ssym-item-footer">
          <button type="button" class="ssym-card-btn ssym-btn-protect" data-action="protect" data-item-id="${armor.id}">
            <i class="fas fa-shield-alt"></i>
            <span>${i18n('SWIPE_SYM.Protect')} (${prot}${bonusProt})</span>
          </button>
        </div>
      </div>
    `;
  }

  _renderTrait(trait) {
    const rank = this._getActiveRank(trait);
    return `
      <div class="ssym-item-card is-trait" data-item-id="${trait.id}">
        <div class="ssym-item-main">
          <img class="ssym-item-icon" src="${trait.img}" alt="${trait.name}" />
          <div class="ssym-item-content">
            <div class="ssym-item-title-row">
              <span class="ssym-item-name">${trait.name}</span>
              <span class="ssym-rank-badge ssym-rank-${rank}">
                ${i18n(`SWIPE_SYM.${rank.charAt(0).toUpperCase() + rank.slice(1)}`)}
              </span>
            </div>
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

  // ─── Event Binding ─────────────────────────────────────────────────────────

  _bindEvents(container) {
    // Attack buttons
    container.querySelectorAll('[data-action="attack"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const itemId = btn.dataset.itemId;
        const weapon = this.actor.items.get(itemId);
        if (!weapon) return;

        btn.classList.add('ssym-pressed');
        setTimeout(() => btn.classList.remove('ssym-pressed'), 200);

        await this._rollAttack(weapon);
      });
    });

    // Damage buttons
    container.querySelectorAll('[data-action="damage"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const itemId = btn.dataset.itemId;
        const weapon = this.actor.items.get(itemId);
        if (!weapon) return;

        btn.classList.add('ssym-pressed');
        setTimeout(() => btn.classList.remove('ssym-pressed'), 200);

        await this._rollDamage(weapon);
      });
    });

    // Toggle drawn/sheathed buttons
    container.querySelectorAll('[data-action="toggle-drawn"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const itemId = btn.dataset.itemId;
        const weapon = this.actor.items.get(itemId);
        if (!weapon) return;

        btn.classList.add('ssym-pressed');
        setTimeout(() => btn.classList.remove('ssym-pressed'), 200);

        await this._toggleWeaponReadiness(weapon);
      });
    });

    // Manage readiness global dialog
    container.querySelectorAll('[data-action="manage-readiness"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (game.tenebreResources?.weaponReadiness?.open) {
          await game.tenebreResources.weaponReadiness.open(this.actor);
          this.drawer.renderCurrentSection();
        }
      });
    });

    // Protect buttons
    container.querySelectorAll('[data-action="protect"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        btn.classList.add('ssym-pressed');
        setTimeout(() => btn.classList.remove('ssym-pressed'), 200);
        await this._rollArmor();
      });
    });

    // Item cards: long press to inspect item sheet
    container.querySelectorAll('.ssym-item-card').forEach(card => {
      let pressTimer;
      card.addEventListener('touchstart', (e) => {
        // Do not trigger sheet on button taps
        if (e.target.closest('button')) return;
        pressTimer = setTimeout(() => {
          const itemId = card.dataset.itemId;
          const item = this.actor.items.get(itemId);
          if (item?.sheet) item.sheet.render(true);
        }, 500);
      }, { passive: true });
      card.addEventListener('touchend', () => clearTimeout(pressTimer), { passive: true });
      card.addEventListener('touchmove', () => clearTimeout(pressTimer), { passive: true });

      // Double-click for desktop testing
      card.addEventListener('dblclick', (e) => {
        if (e.target.closest('button')) return;
        const itemId = card.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item?.sheet) item.sheet.render(true);
      });
    });
  }

  // ─── Roll Handlers ─────────────────────────────────────────────────────────

  async _rollAttack(weapon) {
    try {
      // If weapon readiness is active and weapon is sheathed, automatically draw it first!
      if (this._isWeaponReadinessActive() && !this._isWeaponDrawn(weapon)) {
        await this._toggleWeaponReadiness(weapon);
      }

      // Symbaroum's actor.rollWeapon() requires the evaluated weapon from actor.system.weapons
      const weaponObj = this.actor.system.weapons?.find(w => w.id === weapon.id);

      if (weaponObj && typeof this.actor.rollWeapon === 'function') {
        try {
          return await this.actor.rollWeapon(weaponObj);
        } catch (err) {
          console.warn("swipe-symbaroum | actor.rollWeapon failed, using attribute roll fallback:", err);
        }
      }

      // Robust fallback: roll the weapon's attribute directly
      const attr = weaponObj?.attribute || weapon.system.attribute || 'accurate';
      if (typeof this.actor.rollAttribute === 'function') {
        return await this.actor.rollAttribute(attr);
      }
    } catch (err) {
      console.error('swipe-symbaroum | Error rolling attack:', err);
      ui.notifications?.error?.(err.message || String(err));
    }
  }

  async _rollDamage(weapon) {
    try {
      const damageFormula = (weapon.system.baseDamage || '1d8') + (weapon.system.bonusDamage ? `+${weapon.system.bonusDamage}` : '');
      const roll = new Roll(damageFormula);
      await roll.evaluate();
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `<strong>${weapon.name}</strong> — ${i18n('SWIPE_SYM.Damage')}`
      });
    } catch (err) {
      console.error('swipe-symbaroum | Error rolling damage:', err);
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
