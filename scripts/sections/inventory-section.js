/**
 * Inventory Section - Equipment, Artifacts, and Money
 * Integrates item usage (e.g. Cura Herbal, Rações) with symbaroum-ind-resources automation.
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
      <div class="ssym-section-header">
        <div class="ssym-section-title">${i18n('SWIPE_SYM.Money')}</div>
      </div>
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
      <div class="ssym-section-header">
        <div class="ssym-section-title">${i18n('SWIPE_SYM.Equipment')}</div>
      </div>
      <div class="ssym-card-list">
        ${equipment.length === 0 ? `<p class="ssym-empty">${i18n('SWIPE_SYM.NoEquipment')}</p>` : ''}
        ${equipment.map(e => this._renderEquipment(e)).join('')}
      </div>

      <!-- Artifacts -->
      ${artifacts.length > 0 ? `
        <div class="ssym-section-header">
          <div class="ssym-section-title">${i18n('SWIPE_SYM.Artifacts')}</div>
        </div>
        <div class="ssym-card-list">
          ${artifacts.map(a => this._renderArtifact(a)).join('')}
        </div>
      ` : ''}
    `;
  }

  _isHerbalCure(item) {
    if (!item || item.type !== 'equipment') return false;
    const ref = String(item.system?.reference ?? '').toLowerCase().replace(/[\s_-]+/g, '');
    const name = String(item.name ?? '').toLowerCase().trim();
    return ref === 'herbalcure' || name === 'cura herbal' || name === 'herbal cure' || name.includes('cura herbal');
  }

  _isRation(item) {
    if (!item) return false;
    if (game.tenebreResources?.rations?.isRation?.(item)) return true;
    const ref = String(item.system?.reference ?? '').toLowerCase().replace(/[\s_-]+/g, '');
    const name = String(item.name ?? '').toLowerCase().trim();
    return ref.includes('ration') || name.includes('ração') || name.includes('racao') || name.includes('ration') || name.includes('pão de viagem') || name.includes('pao de viagem');
  }

  _isItemUsable(item) {
    if (this._isHerbalCure(item)) return true;
    if (this._isRation(item)) return true;
    if (game.tenebreResources?.chatItemUse?.canSend?.(item)) return true;
    if (game.tenebreResources?.containers?.isContainer?.(item)) return true;
    return false;
  }

  _getItemUseIcon(item) {
    if (this._isHerbalCure(item)) return 'fa-heart-pulse';
    if (this._isRation(item)) return 'fa-utensils';
    if (game.tenebreResources?.containers?.isContainer?.(item)) return 'fa-box-open';
    return 'fa-hand-sparkles';
  }

  _renderEquipment(item) {
    const qty = item.system.number ?? 1;
    const isActive = item.system.state === 'active';
    const isUsable = this._isItemUsable(item);
    const useIcon = this._getItemUseIcon(item);

    return `
      <div class="ssym-item-card ${isActive ? 'is-active-gear' : ''} ${isUsable ? 'is-usable-item' : ''}" data-item-id="${item.id}">
        <div class="ssym-item-main">
          <img class="ssym-item-icon ${isUsable ? 'ssym-icon-usable' : ''}" src="${item.img}" alt="${item.name}" data-action="${isUsable ? 'use-item' : ''}" data-item-id="${item.id}" title="${isUsable ? i18n('SWIPE_SYM.Use') : item.name}" />
          <div class="ssym-item-content">
            <div class="ssym-item-title-row">
              <span class="ssym-item-name">${item.name}</span>
              ${qty > 1 ? `<span class="ssym-tag ssym-tag-qty">×${qty}</span>` : ''}
            </div>
            ${item.system.cost ? `
              <div class="ssym-item-tags">
                <span class="ssym-tag ssym-tag-cost">${item.system.cost}</span>
              </div>
            ` : ''}
          </div>
        </div>
        ${isUsable ? `
          <div class="ssym-item-footer">
            <button type="button" class="ssym-card-btn ssym-btn-use-item" data-action="use-item" data-item-id="${item.id}">
              <i class="fas ${useIcon}"></i>
              <span>${i18n('SWIPE_SYM.Use')}</span>
            </button>
          </div>
        ` : ''}
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
      <div class="ssym-item-card is-artifact ${isActive ? 'is-active-artifact' : ''}" data-item-id="${artifact.id}">
        <div class="ssym-item-main">
          <img class="ssym-item-icon" src="${artifact.img}" alt="${artifact.name}" />
          <div class="ssym-item-content">
            <div class="ssym-item-title-row">
              <span class="ssym-item-name">${artifact.name}</span>
              <span class="ssym-tag ssym-tag-artifact"><i class="fas fa-gem"></i> Artefato</span>
            </div>
            ${powers.length > 0 ? `
              <div class="ssym-artifact-powers-list">
                ${powers.map(p => `
                  <div class="ssym-artifact-power-badge">
                    <span>${p.name}</span>
                    ${p.corruption ? `<span class="ssym-corruption-sub">${p.corruption}</span>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  _bindEvents(container) {
    // Use item buttons and clickable usable icons
    container.querySelectorAll('[data-action="use-item"]').forEach(el => {
      el.addEventListener('click', async (e) => {
        e.stopPropagation();
        const itemId = el.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (!item) return;

        el.classList.add('ssym-pressed');
        setTimeout(() => el.classList.remove('ssym-pressed'), 200);

        await this._useItem(item);
      });
    });

    // Card tap / long press to open item sheet for inspection
    container.querySelectorAll('.ssym-item-card').forEach(card => {
      let pressTimer;
      card.addEventListener('touchstart', (e) => {
        if (e.target.closest('button') || e.target.closest('.ssym-icon-usable')) return;
        pressTimer = setTimeout(() => {
          const itemId = card.dataset.itemId;
          const item = this.actor.items.get(itemId);
          if (item?.sheet) item.sheet.render(true);
        }, 500);
      }, { passive: true });
      card.addEventListener('touchend', () => clearTimeout(pressTimer), { passive: true });
      card.addEventListener('touchmove', () => clearTimeout(pressTimer), { passive: true });

      card.addEventListener('dblclick', (e) => {
        if (e.target.closest('button') || e.target.closest('.ssym-icon-usable')) return;
        const itemId = card.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item?.sheet) item.sheet.render(true);
      });
    });
  }

  // ─── Item Usage Automation ───────────────────────────────────────────────────

  async _useItem(item) {
    try {
      // 1. Herbal Cure (Cura Herbal)
      if (this._isHerbalCure(item)) {
        return await this._useHerbalCure(item);
      }

      // 2. Rations (Rações)
      if (this._isRation(item)) {
        if (typeof game.tenebreResources?.rations?.consumeDay === 'function') {
          await game.tenebreResources.rations.consumeDay(this.actor, item);
          this.drawer.renderCurrentSection();
          return;
        }
      }

      // 3. Containers
      if (typeof game.tenebreResources?.containers?.isContainer === 'function' && game.tenebreResources.containers.isContainer(item)) {
        await game.tenebreResources.containers.toggleContainer(this.actor, item);
        this.drawer.renderCurrentSection();
        return;
      }

      // 4. Chat item use
      if (typeof game.tenebreResources?.chatItemUse?.send === 'function' && game.tenebreResources.chatItemUse.canSend(item)) {
        await game.tenebreResources.chatItemUse.send(this.actor, item);
        return;
      }

      // 5. Default item sendToChat
      if (typeof item.sheet?.sendToChat === 'function') {
        await item.sheet.sendToChat();
        return;
      }

      // Fallback
      if (item.sheet) item.sheet.render(true);
    } catch (err) {
      console.error('swipe-symbaroum | Error using item:', err);
      ui.notifications?.error?.(err.message || String(err));
    }
  }

  async _useHerbalCure(item) {
    // 1. Try public API from symbaroum-ind-resources
    if (typeof game.tenebreResources?.herbalCure?.use === 'function') {
      const res = await game.tenebreResources.herbalCure.use(this.actor, item);
      this.drawer.renderCurrentSection();
      return res;
    }

    // 2. Try dynamic import from symbaroum-ind-resources module
    try {
      const mod = await import('/modules/symbaroum-ind-resources/scripts/herbal-cure.mjs');
      if (typeof mod?.HerbalCureService?.use === 'function') {
        if (game.tenebreResources) game.tenebreResources.herbalCure = mod.HerbalCureService;
        const res = await mod.HerbalCureService.use(this.actor, item);
        this.drawer.renderCurrentSection();
        return res;
      }
    } catch (err) {
      console.warn('swipe-symbaroum | Dynamic import of HerbalCureService failed:', err);
    }

    // 3. Robust Standalone Fallback
    await this._fallbackHerbalCure(item);
  }

  async _fallbackHerbalCure(item) {
    const qty = Number(item.system?.number ?? 1);
    if (qty <= 0) {
      ui.notifications.warn(game.i18n.localize('TENEBRE.HerbalCure.NoUses') || 'Não há nenhuma dose de Cura Herbal disponível.');
      return;
    }

    // Resolve target: first user target or self
    const targets = Array.from(game.user?.targets ?? []);
    if (targets.length > 1) {
      ui.notifications.warn(game.i18n.localize('TENEBRE.HerbalCure.OneTarget') || 'Selecione no máximo um alvo para usar a Cura Herbal.');
      return;
    }
    const targetActor = targets[0]?.actor ?? this.actor;
    const curVal = Number(targetActor.system?.health?.toughness?.value ?? 0);
    const maxVal = Number(targetActor.system?.health?.toughness?.max ?? 0);

    if (maxVal > 0 && curVal >= maxVal) {
      ui.notifications.warn(`${targetActor.name} já está com a Vitalidade cheia.`);
      return;
    }

    // Check if actor has Medicus
    const medicusItem = this.actor.items.find(i => {
      const ref = String(i.system?.reference ?? '').toLowerCase();
      const n = String(i.name ?? '').toLowerCase();
      return ref === 'medicus' || n.includes('médico') || n.includes('medico') || n.includes('medicus');
    });

    let level = 0;
    if (medicusItem) {
      if (medicusItem.system?.master?.isActive) level = 3;
      else if (medicusItem.system?.adept?.isActive) level = 2;
      else if (medicusItem.system?.novice?.isActive) level = 1;
    }

    const executeUse = async (useMedicus) => {
      let healed = 1;
      let rollDesc = 'Cura normalmente (1 Vitalidade)';
      let rolls = [];

      if (useMedicus && level > 0) {
        const cunning = Number(this.actor.system?.attributes?.cunning?.total ?? 10);
        const d20 = new Roll('1d20');
        await d20.evaluate();
        rolls.push(d20);
        const success = d20.total <= cunning;

        const formula = level === 1 ? '1d6' : level === 2 ? '1d8' : '1d10';
        if (success) {
          const healRoll = new Roll(formula);
          await healRoll.evaluate();
          rolls.push(healRoll);
          healed = healRoll.total;
          rollDesc = `Teste de Astuto (${d20.total} vs ${cunning}) — <strong>Sucesso</strong>! Curou ${healed} (${formula}).`;
        } else {
          healed = level === 3 ? (await (new Roll('1d6')).evaluate()).total : 0;
          rollDesc = `Teste de Astuto (${d20.total} vs ${cunning}) — <strong>Falha</strong>. ${healed > 0 ? `Curou ${healed} (1d6).` : 'Nenhuma cura.'}`;
        }
      }

      // Apply healing
      const finalHeal = Math.min(healed, Math.max(0, maxVal - curVal));
      if (finalHeal > 0) {
        await targetActor.update({ 'system.health.toughness.value': curVal + finalHeal });
      }

      // Decrement item quantity
      await item.update({ 'system.number': Math.max(0, qty - 1) });

      // Chat message
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="symbaroum">
            <h3 style="margin: 0 0 4px 0; border-bottom: 1px solid #c5a059;"><strong>Cura Herbal</strong></h3>
            <p style="margin: 4px 0;"><strong>${this.actor.name}</strong> usa Cura Herbal em <strong>${targetActor.name}</strong>.</p>
            <p style="margin: 4px 0; font-size: 0.9em;">${rollDesc}</p>
            ${finalHeal > 0 ? `<p style="margin: 4px 0; color: #4caf50;"><strong>${targetActor.name} recupera ${finalHeal} de Vitalidade!</strong></p>` : ''}
          </div>
        `
      });

      this.drawer.renderCurrentSection();
    };

    if (level > 0) {
      new Dialog({
        title: 'Usar Cura Herbal',
        content: '<p>Como deseja usar a Cura Herbal?</p>',
        buttons: {
          medicus: {
            icon: '<i class="fas fa-stethoscope"></i>',
            label: 'Usar com Médico',
            callback: () => executeUse(true)
          },
          standard: {
            icon: '<i class="fas fa-hand-holding-medical"></i>',
            label: 'Usar normalmente (cura 1)',
            callback: () => executeUse(false)
          }
        },
        default: 'medicus',
        render: (html) => {
          const win = html[0]?.closest('.window-app') || html[0]?.closest('dialog') || html[0]?.parentElement;
          if (win) win.style.zIndex = '10020';
        }
      }).render(true);
    } else {
      await executeUse(false);
    }
  }
}
