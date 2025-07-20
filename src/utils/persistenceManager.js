/**
 * Persistence Manager
 * Utilities for managing injection persistence state
 */

export class PersistenceManager {
  static STORAGE_KEYS = {
    INJECTED_COMPONENT: 'injectedComponent',
    COMPONENT_STATE: 'herbieComponentState',
    INJECTION_SETTINGS: 'injectionSettings'
  };

  /**
   * Check if there's an active injection
   */
  static async isInjectionActive() {
    try {
      const result = await chrome.storage.local.get([this.STORAGE_KEYS.INJECTED_COMPONENT]);
      return !!(result.injectedComponent && result.injectedComponent.isActive);
    } catch (error) {
      console.error('Error checking injection status:', error);
      return false;
    }
  }

  /**
   * Get current injection data
   */
  static async getInjectionData() {
    try {
      const result = await chrome.storage.local.get([this.STORAGE_KEYS.INJECTED_COMPONENT]);
      return result.injectedComponent || null;
    } catch (error) {
      console.error('Error getting injection data:', error);
      return null;
    }
  }

  /**
   * Set injection data
   */
  static async setInjectionData(componentData) {
    try {
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.INJECTED_COMPONENT]: {
          ...componentData,
          isActive: true,
          timestamp: Date.now()
        }
      });
      return true;
    } catch (error) {
      console.error('Error setting injection data:', error);
      return false;
    }
  }

  /**
   * Clear injection persistence
   */
  static async clearInjection() {
    try {
      await chrome.storage.local.remove([
        this.STORAGE_KEYS.INJECTED_COMPONENT,
        this.STORAGE_KEYS.COMPONENT_STATE
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing injection:', error);
      return false;
    }
  }

  /**
   * Save component state (position, content, etc.)
   */
  static async saveComponentState(state) {
    try {
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.COMPONENT_STATE]: {
          ...state,
          lastUpdated: Date.now()
        }
      });
      return true;
    } catch (error) {
      console.error('Error saving component state:', error);
      return false;
    }
  }

  /**
   * Get saved component state
   */
  static async getComponentState() {
    try {
      const result = await chrome.storage.local.get([this.STORAGE_KEYS.COMPONENT_STATE]);
      return result.herbieComponentState || null;
    } catch (error) {
      console.error('Error getting component state:', error);
      return null;
    }
  }

  /**
   * Get injection settings (user preferences)
   */
  static async getInjectionSettings() {
    try {
      const result = await chrome.storage.local.get([this.STORAGE_KEYS.INJECTION_SETTINGS]);
      return {
        autoInject: true,
        rememberPosition: true,
        rememberContent: true,
        reinjectDelay: 1000,
        ...result.injectionSettings
      };
    } catch (error) {
      console.error('Error getting injection settings:', error);
      return {
        autoInject: true,
        rememberPosition: true,
        rememberContent: true,
        reinjectDelay: 1000
      };
    }
  }

  /**
   * Save injection settings
   */
  static async saveInjectionSettings(settings) {
    try {
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.INJECTION_SETTINGS]: settings
      });
      return true;
    } catch (error) {
      console.error('Error saving injection settings:', error);
      return false;
    }
  }

  /**
   * Listen for injection state changes
   */
  static onInjectionStateChange(callback) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes[this.STORAGE_KEYS.INJECTED_COMPONENT]) {
        const { oldValue, newValue } = changes[this.STORAGE_KEYS.INJECTED_COMPONENT];
        callback({
          oldValue,
          newValue,
          isActive: !!(newValue && newValue.isActive)
        });
      }
    });
  }

  /**
   * Debug: Get all injection-related storage data
   */
  static async debugGetAllData() {
    try {
      const result = await chrome.storage.local.get([
        this.STORAGE_KEYS.INJECTED_COMPONENT,
        this.STORAGE_KEYS.COMPONENT_STATE,
        this.STORAGE_KEYS.INJECTION_SETTINGS
      ]);
      return result;
    } catch (error) {
      console.error('Error getting debug data:', error);
      return {};
    }
  }

  /**
   * Reset all injection-related data
   */
  static async resetAll() {
    try {
      await chrome.storage.local.remove([
        this.STORAGE_KEYS.INJECTED_COMPONENT,
        this.STORAGE_KEYS.COMPONENT_STATE,
        this.STORAGE_KEYS.INJECTION_SETTINGS
      ]);
      return true;
    } catch (error) {
      console.error('Error resetting injection data:', error);
      return false;
    }
  }
}