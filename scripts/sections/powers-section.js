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
            <i class="fas fa-wand-magic-sparkles"></i>
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
    // Use power button
    container.querySelectorAll('[data-action="use-power"]').forEach(btn => {
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
}
