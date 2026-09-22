/**
 * Powers Section - Mystical Powers, Abilities, and Rituals
 * Supports direct rolling via actor.usePower() for scripted abilities and powers.
 */

const i18n = (key) => game.i18n.localize(key);

export class PowersSection {
  constructor(actor, drawer) {
    this.actor = actor;
    this.drawer = drawer;
  }

  get id() { return 'powers'; }
  get label() { return i18n('SWIPE_SYM.Tab.Powers'); }
  get icon() { return 'fas fa-hat-wizard'; }

  render(container) {
    container.innerHTML = `<div class="ssym-section active">${this._getHTML()}</div>`;
    this._bindEvents(container);
  }

  _getHTML() {
    const powers = this.actor.items.filter(i => i.type === 'mysticalPower');
    const abilities = this.actor.items.filter(i => i.type === 'ability');
    const rituals = this.actor.items.filter(i => i.type === 'ritual');
    const boons = this.actor.items.filter(i => i.type === 'boon');
    const burdens = this.actor.items.filter(i => i.type === 'burden');

    return `
      <!-- Mystical Powers -->
      <div class="ssym-section-header">
        <div class="ssym-section-title">${i18n('SWIPE_SYM.MysticalPowers')}</div>
      </div>
      <div class="ssym-card-list">
        ${powers.length === 0 ? `<p class="ssym-empty">${i18n('SWIPE_SYM.NoPowers')}</p>` : ''}
        ${powers.map(p => this._renderPower(p)).join('')}
      </div>

      <!-- Abilities -->
      <div class="ssym-section-header">
        <div class="ssym-section-title">${i18n('SWIPE_SYM.Abilities')}</div>
      </div>
      <div class="ssym-card-list">
        ${abilities.length === 0 ? `<p class="ssym-empty">${i18n('SWIPE_SYM.NoAbilities')}</p>` : ''}
        ${abilities.map(a => this._renderAbility(a)).join('')}
      </div>

      <!-- Rituals -->
      ${rituals.length > 0 ? `
        <div class="ssym-section-header">
          <div class="ssym-section-title">${i18n('SWIPE_SYM.Rituals')}</div>
        </div>
        <div class="ssym-card-list">
          ${rituals.map(r => this._renderRitual(r)).join('')}
        </div>
      ` : ''}

      <!-- Boons -->
      ${boons.length > 0 ? `
        <div class="ssym-section-header">
          <div class="ssym-section-title">${i18n('SWIPE_SYM.Boons')}</div>
        </div>
        <div class="ssym-card-list">
          ${boons.map(b => this._renderSimpleItem(b)).join('')}
        </div>
      ` : ''}

      <!-- Burdens -->
      ${burdens.length > 0 ? `
        <div class="ssym-section-header">
          <div class="ssym-section-title">${i18n('SWIPE_SYM.Burdens')}</div>
        </div>
        <div class="ssym-card-list">
          ${burdens.map(b => this._renderSimpleItem(b)).join('')}
        </div>
      ` : ''}
    `;
  }

  _renderRanks(item) {
    const isNovice = Boolean(item.system?.novice?.isActive);
    const isAdept = Boolean(item.system?.adept?.isActive);
    const isMaster = Boolean(item.system?.master?.isActive);

    return `
      <div class="ssym-ranks-container" title="Noviço (N) / Adepto (A) / Mestre (M)">
        <span class="ssym-rank-diamond ${isNovice ? 'active' : ''}">
          <span class="ssym-diamond-symbol">${isNovice ? '◆' : '◇'}</span>
          <span class="ssym-rank-char">N</span>
        </span>
        <span class="ssym-rank-diamond ${isAdept ? 'active' : ''}">
          <span class="ssym-diamond-symbol">${isAdept ? '◆' : '◇'}</span>
          <span class="ssym-rank-char">A</span>
        </span>
        <span class="ssym-rank-diamond ${isMaster ? 'active' : ''}">
          <span class="ssym-diamond-symbol">${isMaster ? '◆' : '◇'}</span>
          <span class="ssym-rank-char">M</span>
        </span>
      </div>
    `;
  }

  /**
   * Check if an ability has a scripted action that can be rolled.
   * Checks hasScript, scriptedAbilities config, combatMods, and common localized names.
   */
  _isUsable(item) {
    if (item.system?.hasScript && item.system?.isPower) return true;
    const ref = String(item.system?.reference ?? '').toLowerCase().trim();
    if (ref && game.symbaroum?.config?.scriptedAbilities?.includes(ref)) return true;
    if (this.actor.system?.combat?.combatMods?.abilities?.[item.id]?.isScripted) return true;

    // Localized name fallback for Portuguese & English
    const usableKeywords = [
      'médico', 'medicus', 'alquimia', 'alchemy', 'veneno', 'poisoner',
      'líder', 'leader', 'mestre do saber', 'loremaster', 'visão da bruxa',
      'witchsight', 'acrobacia', 'acrobatics', 'recuperação', 'recovery',
      'estrangulador', 'strangler', 'ferreiro', 'blacksmith', 'falar com bestas',
      'beastlore', 'dominar', 'dominate', 'fúria', 'berserker'
    ];
    const name = String(item.name ?? '').toLowerCase().trim();
    if (usableKeywords.some(kw => name.includes(kw))) return true;

    return false;
  }

  _renderPower(power) {
    const rank = this._getActiveRank(power);
    const activeLevel = power.system[rank];
    const action = activeLevel?.action || '';
    const corruption = power.system.corruption || '';

    return `
      <div class="ssym-item-card is-power" data-item-id="${power.id}">
        <div class="ssym-item-main">
          <img class="ssym-item-icon" src="${power.img}" alt="${power.name}" />
          <div class="ssym-item-content">
            <div class="ssym-item-title-row">
              <span class="ssym-item-name">${power.name}</span>
              ${this._renderRanks(power)}
            </div>
            <div class="ssym-item-tags">
              ${action ? `<span class="ssym-tag ssym-tag-action">${action}</span>` : ''}
              ${corruption ? `<span class="ssym-tag ssym-tag-corruption"><i class="fas fa-biohazard"></i> ${corruption}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="ssym-item-footer">
          <button type="button" class="ssym-card-btn ssym-btn-cast" data-action="use-power" data-item-id="${power.id}">
            <i class="fas fa-dice-d20"></i>
            <span>${i18n('SWIPE_SYM.Use')}</span>
          </button>
        </div>
      </div>
    `;
  }

  _renderAbility(ability) {
    const rank = this._getActiveRank(ability);
    const activeLevel = ability.system[rank];
    const action = activeLevel?.action || '';
    const usable = this._isUsable(ability);

    return `
      <div class="ssym-item-card is-ability" data-item-id="${ability.id}">
        <div class="ssym-item-main">
          <img class="ssym-item-icon" src="${ability.img}" alt="${ability.name}" />
          <div class="ssym-item-content">
            <div class="ssym-item-title-row">
              <span class="ssym-item-name">${ability.name}</span>
              ${this._renderRanks(ability)}
            </div>
            ${action ? `
              <div class="ssym-item-tags">
                <span class="ssym-tag ssym-tag-action">${action}</span>
              </div>
            ` : ''}
          </div>
        </div>
        ${usable ? `
          <div class="ssym-item-footer">
            <button type="button" class="ssym-card-btn ssym-btn-ability" data-action="use-power" data-item-id="${ability.id}">
              <i class="fas fa-dice-d20"></i>
              <span>${i18n('SWIPE_SYM.Use')}</span>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  _renderRitual(ritual) {
    const tradition = ritual.system.tradition || '';
    return `
      <div class="ssym-item-card is-ritual" data-item-id="${ritual.id}">
        <div class="ssym-item-main">
          <img class="ssym-item-icon" src="${ritual.img}" alt="${ritual.name}" />
          <div class="ssym-item-content">
            <div class="ssym-item-title-row">
              <span class="ssym-item-name">${ritual.name}</span>
              ${tradition ? `<span class="ssym-tag ssym-tag-tradition">${tradition}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _renderSimpleItem(item) {
    return `
      <div class="ssym-item-card is-simple" data-item-id="${item.id}">
        <div class="ssym-item-main">
          <img class="ssym-item-icon" src="${item.img}" alt="${item.name}" />
          <div class="ssym-item-content">
            <div class="ssym-item-title-row">
              <span class="ssym-item-name">${item.name}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _getActiveRank(item) {
    if (item.system.master?.isActive) return 'master';
    if (item.system.adept?.isActive) return 'adept';
    return 'novice';
  }

  _bindEvents(container) {
    // Use power / ability button — calls actor.usePower() directly for scripted items
    container.querySelectorAll('[data-action="use-power"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const itemId = btn.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (!item) return;

        btn.classList.add('ssym-pressed');
        setTimeout(() => btn.classList.remove('ssym-pressed'), 200);

        await this._usePower(item);
      });
    });

    // Open sheet button (for non-scripted powers that can't be rolled)
    container.querySelectorAll('[data-action="open-sheet"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemId = btn.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (!item) return;

        btn.classList.add('ssym-pressed');
        setTimeout(() => btn.classList.remove('ssym-pressed'), 200);

        if (item.sheet) item.sheet.render(true);
      });
    });

    // Card tap / long press to open item sheet
    container.querySelectorAll('.ssym-item-card').forEach(card => {
      let pressTimer;
      card.addEventListener('touchstart', (e) => {
        if (e.target.closest('button')) return;
        pressTimer = setTimeout(() => {
          const itemId = card.dataset.itemId;
          const item = this.actor.items.get(itemId);
          if (item?.sheet) item.sheet.render(true);
        }, 500);
      }, { passive: true });
      card.addEventListener('touchend', () => clearTimeout(pressTimer), { passive: true });
      card.addEventListener('touchmove', () => clearTimeout(pressTimer), { passive: true });

      card.addEventListener('dblclick', (e) => {
        if (e.target.closest('button')) return;
        const itemId = card.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item?.sheet) item.sheet.render(true);
      });
    });
  }

  // ─── Roll Handler ─────────────────────────────────────────────────────────

  /**
   * Use a power or scripted ability by calling actor.usePower().
   * This triggers the Symbaroum system's own roll dialog with modifiers,
   * corruption, targets, etc. — the same dialog you'd get from the desktop sheet.
   * Falls back to rollAttribute if usePower is not available.
   */
  async _usePower(item) {
    try {
      // Primary: use the system's usePower method (handles scripted abilities & powers)
      if (typeof this.actor.usePower === 'function') {
        return await this.actor.usePower(item);
      }

      // Fallback: if the item has an associated attribute, roll that directly
      const rank = this._getActiveRank(item);
      const activeLevel = item.system?.[rank];
      const castingAttr = activeLevel?.attribute || item.system?.attribute;

      if (castingAttr && typeof this.actor.rollAttribute === 'function') {
        return await this.actor.rollAttribute(castingAttr);
      }

      // Last resort: open the item sheet
      if (item.sheet) item.sheet.render(true);
    } catch (err) {
      console.error('swipe-symbaroum | Error using power/ability:', err);
      ui.notifications?.error?.(err.message || String(err));
    }
  }
}
