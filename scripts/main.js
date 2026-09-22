/**
 * Swipe Symbaroum - Mobile Character Sheet
 * Main entry point for the Foundry VTT module
 */

import { SymbaroumMobileDrawer } from './mobile-drawer.js';

const MODULE_ID = 'swipe-symbaroum';

/**
 * Detect if the current device is mobile/touch
 */
function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|Opera Mini|IEMobile/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 0 && window.innerWidth <= 1024)
    || ('ontouchstart' in window && window.innerWidth <= 1024);
}

/**
 * Check if we're running on the Symbaroum system
 */
function isSymbaroum() {
  return game.system?.id === 'symbaroum';
}

/**
 * Check if Swipe VTT module is active
 */
function isSwipeVTTActive() {
  return game.modules.get('swipe-vtt')?.active ?? false;
}

// ─── Module Initialization ───────────────────────────────────────────────────

Hooks.once('init', () => {
  if (!isSymbaroum()) return;

  console.log(`${MODULE_ID} | Initializing Swipe Symbaroum`);

  // Register module settings
  game.settings.register(MODULE_ID, 'enableMobileSheet', {
    name: 'Enable Mobile Sheet',
    hint: 'Automatically show the mobile character sheet on touch devices.',
    scope: 'client',
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, 'forceEnable', {
    name: 'Force Enable (Desktop)',
    hint: 'Force the mobile sheet even on desktop (for testing).',
    scope: 'client',
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, 'hideSymbaroumHudOnMobile', {
    name: 'SWIPE_SYM.Settings.HideHudName',
    hint: 'SWIPE_SYM.Settings.HideHudHint',
    scope: 'client',
    config: true,
    type: Boolean,
    default: true
  });
});

Hooks.once('ready', () => {
  if (!isSymbaroum()) return;

  const forceEnable = game.settings.get(MODULE_ID, 'forceEnable');
  const enabled = game.settings.get(MODULE_ID, 'enableMobileSheet');

  if (!enabled && !forceEnable) return;
  if (!isMobileDevice() && !forceEnable) return;

  console.log(`${MODULE_ID} | Mobile device detected, enabling mobile sheets`);

  // Initialize the drawer
  SymbaroumMobileDrawer.init();

  // Add mobile class to body for CSS targeting
  document.body.classList.add('swipe-symbaroum-active');

  // Suppress Symbaroum HUD on mobile if setting is enabled
  const hideHud = game.settings.get(MODULE_ID, 'hideSymbaroumHudOnMobile');
  if (hideHud) {
    document.body.classList.add('swipe-symbaroum-hide-hud');

    // Actively disable/close symbaroum-hud to save resources and prevent DOM intrusion
    const symHudModule = game.modules.get('symbaroum-hud');
    if (symHudModule?.active && symHudModule.api?.hud) {
      const hudInstance = symHudModule.api.hud;
      try {
        hudInstance.close?.({ animate: false });
      } catch (e) {
        console.warn(`${MODULE_ID} | Could not close symbaroum-hud:`, e);
      }
      // Override render method to avoid repeated re-rendering on hooks
      hudInstance.render = function () {
        return Promise.resolve();
      };
    }
  }

  // Intercept actor sheet rendering
  Hooks.on('renderActorSheet', (sheet, html, data) => {
    const actor = sheet.actor;
    if (!actor || actor.type !== 'player') return;

    // If Swipe VTT is handling this, don't interfere
    if (isSwipeVTTActive() && sheet.constructor.isSwipeMobileSheet) return;

    // Close the default sheet and open our drawer
    sheet.close({ animate: false });
    SymbaroumMobileDrawer.instance.open(actor);
  });

  // Intercept token double-click on canvas
  if (CONFIG.Token?.objectClass?.prototype) {
    const originalClick = CONFIG.Token.objectClass.prototype._onClickLeft2;
    CONFIG.Token.objectClass.prototype._onClickLeft2 = function (event) {
      const actor = this.actor;
      if (actor && actor.type === 'player') {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        SymbaroumMobileDrawer.instance.open(actor);
        return;
      }
      return originalClick?.call(this, event);
    };
  }

  // Listen for actor updates to refresh the drawer
  Hooks.on('updateActor', (actor, changes, options, userId) => {
    if (SymbaroumMobileDrawer.instance?.isOpen && SymbaroumMobileDrawer.instance?.actor?.id === actor.id) {
      SymbaroumMobileDrawer.instance.refresh(changes);
    }
  });

  // Listen for item changes on the actor
  for (const hook of ['createItem', 'updateItem', 'deleteItem']) {
    Hooks.on(hook, (item, options, userId) => {
      const actor = item.parent;
      if (actor && SymbaroumMobileDrawer.instance?.isOpen && SymbaroumMobileDrawer.instance?.actor?.id === actor.id) {
        SymbaroumMobileDrawer.instance.renderCurrentSection();
      }
    });
  }
});
