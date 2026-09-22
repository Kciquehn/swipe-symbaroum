/**
 * Details Section - Overview tab
 * Shows attributes grid, combat stats, and experience
 */

const i18n = (key) => game.i18n.localize(key);

const ATTRIBUTES = [
  { key: 'cunning', abbr: 'ATTRIBUTE.CUNNINGABBR', label: 'ATTRIBUTE.CUNNING' },
  { key: 'discreet', abbr: 'ATTRIBUTE.DISCREETABBR', label: 'ATTRIBUTE.DISCREET' },
  { key: 'persuasive', abbr: 'ATTRIBUTE.PERSUASIVEABBR', label: 'ATTRIBUTE.PERSUASIVE' },
  { key: 'accurate', abbr: 'ATTRIBUTE.ACCURATEABBR', label: 'ATTRIBUTE.ACCURATE' },
  { key: 'quick', abbr: 'ATTRIBUTE.QUICKABBR', label: 'ATTRIBUTE.QUICK' },
  { key: 'resolute', abbr: 'ATTRIBUTE.RESOLUTEABBR', label: 'ATTRIBUTE.RESOLUTE' },
  { key: 'vigilant', abbr: 'ATTRIBUTE.VIGILANTABBR', label: 'ATTRIBUTE.VIGILANT' },
  { key: 'strong', abbr: 'ATTRIBUTE.STRONGABBR', label: 'ATTRIBUTE.STRONG' }
];

export class DetailsSection {
  constructor(actor, drawer) {
    this.actor = actor;
    this.drawer = drawer;
  }

  get id() { return 'details'; }
  get label() { return i18n('SWIPE_SYM.Tab.Details'); }
  get icon() { return 'fas fa-address-card'; }

  render(container) {
    container.innerHTML = `<div class="ssym-section active">${this._getHTML()}</div>`;
    this._bindEvents(container);
  }

  _getHTML() {
    const sys = this.actor.system;

    // Combat stats
    const defense = this._getDefenseValue();
    const initiative = sys.initiative?.value ?? 0;
    const armorProtection = this._getArmorProtection();

    // Experience
    const xpAvail = sys.experience?.available ?? 0;
    const xpTotal = sys.experience?.total ?? 0;
    const xpSpent = sys.experience?.spent ?? 0;

    return `
      <!-- Quick Combat Stats -->
      <div class="ssym-stats-row">
        <div class="ssym-stat-capsule">
          <span class="ssym-stat-label">${i18n('SWIPE_SYM.Defense')}</span>
          <span class="ssym-stat-value">${defense}</span>
        </div>
        <div class="ssym-stat-capsule">
          <span class="ssym-stat-label">${i18n('SWIPE_SYM.Initiative')}</span>
          <span class="ssym-stat-value">${initiative}</span>
        </div>
        <div class="ssym-stat-capsule">
          <span class="ssym-stat-label">${i18n('SWIPE_SYM.Armor')}</span>
          <span class="ssym-stat-value">${armorProtection}</span>
        </div>
      </div>

      <!-- Attributes Grid -->
      <div class="ssym-section-title">
        ${i18n('SWIPE_SYM.Attributes')}
        <span class="ssym-section-hint">${i18n('SWIPE_SYM.TapToRoll')}</span>
      </div>
      <div class="ssym-attributes-grid">
        ${ATTRIBUTES.map(attr => {
          const data = sys.attributes?.[attr.key] ?? {};
          const total = data.total ?? 10;
          const tempMod = data.temporaryMod ?? 0;
          return `
            <div class="ssym-attr-card" data-attribute="${attr.key}">
              <div class="ssym-attr-abbr">${i18n(attr.abbr)}</div>
              <div class="ssym-attr-value">${total}</div>
              ${tempMod !== 0 ? `<div class="ssym-attr-mod ${tempMod > 0 ? 'positive' : 'negative'}">${tempMod > 0 ? '+' : ''}${tempMod}</div>` : ''}
              <div class="ssym-attr-name">${i18n(attr.label)}</div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Experience -->
      <div class="ssym-section-title">${i18n('SWIPE_SYM.XP')}</div>
      <div class="ssym-xp-row">
        <div class="ssym-xp-item">
          <span class="ssym-xp-label">${i18n('SWIPE_SYM.XPAvailable')}</span>
          <span class="ssym-xp-value ssym-xp-available">${xpAvail}</span>
        </div>
        <div class="ssym-xp-item">
          <span class="ssym-xp-label">${i18n('SWIPE_SYM.XPSpent')}</span>
          <span class="ssym-xp-value">${xpSpent}</span>
        </div>
        <div class="ssym-xp-item">
          <span class="ssym-xp-label">${i18n('SWIPE_SYM.XPTotal')}</span>
          <span class="ssym-xp-value">${xpTotal}</span>
        </div>
      </div>
    `;
  }

  _getDefenseValue() {
    const sys = this.actor.system;
    const defAttr = sys.defense?.attribute ?? 'quick';
    const attrVal = sys.attributes?.[defAttr]?.total ?? 10;

    // Find equipped armor impediment
    const armor = this.actor.items.find(i => i.type === 'armor' && i.system.state === 'active');
    const impediment = armor ? Number(armor.system.impediment ?? 0) : 0;

    return attrVal - impediment;
  }

  _getArmorProtection() {
    const armor = this.actor.items.find(i => i.type === 'armor' && i.system.state === 'active');
    if (!armor) return '0';

    let prot = armor.system.baseProtection ?? '0';
    if (armor.system.bonusProtection) {
      prot += `+${armor.system.bonusProtection}`;
    }
    return prot;
  }

  _bindEvents(container) {
    container.querySelectorAll('.ssym-attr-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const attrKey = card.dataset.attribute;
        this._rollAttribute(attrKey);

        // Visual feedback
        card.classList.add('ssym-pressed');
        setTimeout(() => card.classList.remove('ssym-pressed'), 200);
      });
    });
  }

  async _rollAttribute(attrKey) {
    try {
      // Use the Symbaroum system's native roll method
      if (typeof this.actor.rollAttribute === 'function') {
        return await this.actor.rollAttribute(attrKey);
      }

      // Fallback: use the API
      if (game.symbaroum?.api?.rollAttribute) {
        return await game.symbaroum.api.rollAttribute(this.actor, attrKey);
      }

      // Last resort fallback
      const attr = this.actor.system.attributes[attrKey];
      const roll = new Roll('1d20');
      await roll.evaluate();
      const success = roll.total <= attr.total;
      const isCrit = roll.total === 1;
      const isFumble = roll.total === 20;

      const flavor = `
        <strong>${i18n(`ATTRIBUTE.${attrKey.toUpperCase()}`)} — ${i18n('SWIPE_SYM.TapToRoll')}</strong><br>
        Target: ≤ ${attr.total} | Rolled: <strong>${roll.total}</strong><br>
        <span style="color: ${success ? '#4CAF50' : '#F44336'}; font-weight: bold;">
          ${isCrit ? '💥 CRITICAL!' : isFumble ? '💀 FUMBLE!' : success ? '✅ Success' : '❌ Failure'}
        </span>
      `;
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor
      });
    } catch (err) {
      console.error('swipe-symbaroum | Error rolling attribute:', err);
    }
  }
}
