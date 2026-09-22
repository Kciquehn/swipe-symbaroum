/**
 * Powers Section - Mystical Powers, Abilities, and Rituals
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
      <div class="ssym-section-title">${i18n('SWIPE_SYM.MysticalPowers')}</div>
      <div class="ssym-item-list">
        ${powers.length === 0 ? `<p class="ssym-empty">${i18n('SWIPE_SYM.NoPowers')}</p>` : ''}
        ${powers.map(p => this._renderPower(p)).join('')}
      </div>

      <!-- Abilities -->
      <div class="ssym-section-title">${i18n('SWIPE_SYM.Abilities')}</div>
      <div class="ssym-item-list">
        ${abilities.length === 0 ? `<p class="ssym-empty">${i18n('SWIPE_SYM.NoAbilities')}</p>` : ''}
        ${abilities.map(a => this._renderAbility(a)).join('')}
      </div>

      <!-- Rituals -->
      ${rituals.length > 0 ? `
        <div class="ssym-section-title">${i18n('SWIPE_SYM.Rituals')}</div>
        <div class="ssym-item-list">
          ${rituals.map(r => this._renderRitual(r)).join('')}
        </div>
      ` : ''}

      <!-- Boons -->
      ${boons.length > 0 ? `
        <div class="ssym-section-title">${i18n('SWIPE_SYM.Boons')}</div>
        <div class="ssym-item-list">
          ${boons.map(b => this._renderSimpleItem(b)).join('')}
        </div>
      ` : ''}

      <!-- Burdens -->
      ${burdens.length > 0 ? `
        <div class="ssym-section-title">${i18n('SWIPE_SYM.Burdens')}</div>
        <div class="ssym-item-list">
          ${burdens.map(b => this._renderSimpleItem(b)).join('')}
        </div>
      ` : ''}
    `;
  }

  _renderPower(power) {
    const rank = this._getActiveRank(power);
    const rankLabel = i18n(`SWIPE_SYM.${rank.charAt(0).toUpperCase() + rank.slice(1)}`);
    const activeLevel = power.system[rank];
    const action = activeLevel?.action || '';

    return `
      <div class="ssym-item-row" data-item-id="${power.id}">
        <img class="ssym-item-icon" src="${power.img}" alt="${power.name}" />
        <div class="ssym-item-info">
          <div class="ssym-item-name">${power.name}</div>
          <div class="ssym-item-details">
            <span class="ssym-rank-badge ssym-rank-${rank}">${rankLabel}</span>
            ${action ? `<span class="ssym-item-tag">${action}</span>` : ''}
          </div>
        </div>
        <div class="ssym-item-actions">
          <button type="button" class="ssym-btn ssym-btn-cast" data-action="use-power" data-item-id="${power.id}">
            <i class="fas fa-magic"></i>
          </button>
        </div>
      </div>
    `;
  }

  _renderAbility(ability) {
    const rank = this._getActiveRank(ability);
    const rankLabel = i18n(`SWIPE_SYM.${rank.charAt(0).toUpperCase() + rank.slice(1)}`);
    const activeLevel = ability.system[rank];
    const action = activeLevel?.action || '';

    return `
      <div class="ssym-item-row" data-item-id="${ability.id}">
        <img class="ssym-item-icon" src="${ability.img}" alt="${ability.name}" />
        <div class="ssym-item-info">
          <div class="ssym-item-name">${ability.name}</div>
          <div class="ssym-item-details">
            <span class="ssym-rank-badge ssym-rank-${rank}">${rankLabel}</span>
            ${action ? `<span class="ssym-item-tag">${action}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  _renderRitual(ritual) {
    const tradition = ritual.system.tradition || '';
    return `
      <div class="ssym-item-row" data-item-id="${ritual.id}">
        <img class="ssym-item-icon" src="${ritual.img}" alt="${ritual.name}" />
        <div class="ssym-item-info">
          <div class="ssym-item-name">${ritual.name}</div>
          <div class="ssym-item-details">
            ${tradition ? `<span class="ssym-item-tag">${tradition}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  _renderSimpleItem(item) {
    return `
      <div class="ssym-item-row ssym-item-compact" data-item-id="${item.id}">
        <img class="ssym-item-icon" src="${item.img}" alt="${item.name}" />
        <div class="ssym-item-info">
          <div class="ssym-item-name">${item.name}</div>
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
    // Use power button
    container.querySelectorAll('[data-action="use-power"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemId = btn.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (!item) return;

        btn.classList.add('ssym-pressed');
        setTimeout(() => btn.classList.remove('ssym-pressed'), 200);

        // Open the item sheet to use the power (Symbaroum handles casting via sheets)
        if (item.sheet) item.sheet.render(true);
      });
    });

    // Long press on any item to open its sheet
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
}
