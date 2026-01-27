export class Storage {
  static STORAGE_KEY = 'todoo-simpleapp-data';

  // Save entire application state
  static saveState(state) {
    try {
      const serialized = JSON.stringify(state, (key, value) => {
        // Handle Date objects
        if (value instanceof Date) {
          return { __type: 'Date', value: value.toISOString() };
        }
        return value;
      });
      localStorage.setItem(this.STORAGE_KEY, serialized);
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  }

  // Load application state
  static loadState() {
    try {
      const serialized = localStorage.getItem(this.STORAGE_KEY);
      if (!serialized) return null;

      return JSON.parse(serialized, (key, value) => {
        // Revive Date objects
        if (value && value.__type === 'Date') {
          return new Date(value.value);
        }
        return value;
      });
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }

  // Clear all stored data
  static clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Check if storage is available
  static isAvailable() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get storage usage info
  static getUsage() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return { bytes: 0, percent: 0 };

      const bytes = new Blob([data]).size;
      const maxBytes = 5 * 1024 * 1024; // 5MB typical limit
      const percent = (bytes / maxBytes) * 100;

      return {
        bytes,
        kilobytes: (bytes / 1024).toFixed(2),
        megabytes: (bytes / (1024 * 1024)).toFixed(2),
        percent: percent.toFixed(2),
        warning: percent > 80
      };
    } catch (error) {
      return { error: 'Unable to calculate usage' };
    }
  }

  // Backup data to downloadable file
  static backup() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todoo-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  }

  // Restore from backup file
  static restore(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
          resolve(true);
        } catch (error) {
          reject(new Error('Invalid backup file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}
