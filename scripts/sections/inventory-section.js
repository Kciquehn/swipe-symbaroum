/**
 * Inventory Section - Equipment, Artifacts, and Money
 */

const i18n = (key) => game.i18n.localize(key);

export class InventorySection {
  constructor(actor, drawer) {
    this.actor = actor;
    this.drawer = drawer;
  }

  get id() { return 'inventory'; }
  get label() { return i18n('SWIPE_SYM.Tab.Inventory'); }
  get icon() { return 'fas fa-backpack'; }

  render(container) {
    container.innerHTML = `<div class="ssym-section active">${this._getHTML()}</div>`;
    this._bindEvents(container);
  }

  _getHTML() {
    const equipment = this.actor.items.filter(i => i.type === 'equipment');
    const artifacts = this.actor.items.filter(i => i.type === 'artifact');
    const money = this.actor.system.money ?? {};

    return `
      <!-- Money -->
      <div class="ssym-section-title">${i18n('SWIPE_SYM.Money')}</div>
      <div class="ssym-money-row">
        <div class="ssym-money-item">
          <i class="fas fa-coins ssym-money-icon ssym-money-thaler"></i>
          <div class="ssym-money-info">
            <span class="ssym-money-value">${money.thaler ?? 0}</span>
            <span class="ssym-money-label">${i18n('SWIPE_SYM.Thaler')}</span>
          </div>
        </div>
        <div class="ssym-money-item">
          <i class="fas fa-coins ssym-money-icon ssym-money-shilling"></i>
          <div class="ssym-money-info">
            <span class="ssym-money-value">${money.shilling ?? 0}</span>
            <span class="ssym-money-label">${i18n('SWIPE_SYM.Shilling')}</span>
          </div>
        </div>
        <div class="ssym-money-item">
          <i class="fas fa-coins ssym-money-icon ssym-money-orteg"></i>
          <div class="ssym-money-info">
            <span class="ssym-money-value">${money.orteg ?? 0}</span>
            <span class="ssym-money-label">${i18n('SWIPE_SYM.Orteg')}</span>
          </div>
        </div>
      </div>

      <!-- Equipment -->
      <div class="ssym-section-title">${i18n('SWIPE_SYM.Equipment')}</div>
      <div class="ssym-item-list">
        ${equipment.length === 0 ? `<p class="ssym-empty">${i18n('SWIPE_SYM.NoEquipment')}</p>` : ''}
        ${equipment.map(e => this._renderEquipment(e)).join('')}
      </div>

      <!-- Artifacts -->
      ${artifacts.length > 0 ? `
        <div class="ssym-section-title">${i18n('SWIPE_SYM.Artifacts')}</div>
        <div class="ssym-item-list">
          ${artifacts.map(a => this._renderArtifact(a)).join('')}
        </div>
      ` : ''}
    `;
  }

  _renderEquipment(item) {
    const qty = item.system.number ?? 1;
    const isActive = item.system.state === 'active';

    return `
      <div class="ssym-item-row ${isActive ? 'ssym-item-active' : ''}" data-item-id="${item.id}">
        <img class="ssym-item-icon" src="${item.img}" alt="${item.name}" />
        <div class="ssym-item-info">
          <div class="ssym-item-name">${item.name}</div>
          <div class="ssym-item-details">
            ${qty > 1 ? `<span class="ssym-item-tag">×${qty}</span>` : ''}
            ${item.system.cost ? `<span class="ssym-item-tag">${item.system.cost}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  _renderArtifact(artifact) {
    const sys = artifact.system;
    const isActive = sys.state === 'active';

    // Gather artifact powers
    const powers = [];
    for (const key of ['power1', 'power2', 'power3']) {
      if (sys[key]?.name) {
        powers.push(sys[key]);
      }
    }

    return `
      <div class="ssym-item-row ssym-artifact-row ${isActive ? 'ssym-item-active' : ''}" data-item-id="${artifact.id}">
        <img class="ssym-item-icon" src="${artifact.img}" alt="${artifact.name}" />
        <div class="ssym-item-info">
          <div class="ssym-item-name">${artifact.name}</div>
          ${powers.length > 0 ? `
            <div class="ssym-artifact-powers">
              ${powers.map(p => `
                <div class="ssym-artifact-power">
                  <span class="ssym-artifact-power-name">${p.name}</span>
                  ${p.corruption ? `<span class="ssym-item-tag ssym-corruption-tag">${p.corruption}</span>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  _bindEvents(container) {
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

      // Desktop: double click
      row.addEventListener('dblclick', () => {
        const itemId = row.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item?.sheet) item.sheet.render(true);
      });
    });
  }
}
