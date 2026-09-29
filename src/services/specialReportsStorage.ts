import {
  AnimalControlReport,
  LostFoundReport,
} from '../types';

const ANIMAL_KEY = 'hotel_patrol_animal_reports';
const LOST_FOUND_KEY = 'hotel_patrol_lost_found';

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));

  try {
    window.dispatchEvent(
      new CustomEvent('hotel_patrol_new_module_changed')
    );
  } catch {
    // Ignore environments without CustomEvent
  }
}

export const AnimalControlStorage = {
  getAll(): AnimalControlReport[] {
    return readList<AnimalControlReport>(ANIMAL_KEY);
  },

  getById(id: string): AnimalControlReport | undefined {
    return this.getAll().find((item) => item.id === id);
  },

  save(report: AnimalControlReport): void {
    const all = this.getAll();
    const index = all.findIndex((item) => item.id === report.id);

    if (index >= 0) {
      all[index] = report;
    } else {
      all.unshift(report);
    }

    writeList(ANIMAL_KEY, all);
  },

  delete(id: string): void {
    const all = this.getAll().filter((item) => item.id !== id);
    writeList(ANIMAL_KEY, all);
  },

  clear(): void {
    localStorage.removeItem(ANIMAL_KEY);
  },
};

export const LostFoundStorage = {
  getAll(): LostFoundReport[] {
    return readList<LostFoundReport>(LOST_FOUND_KEY);
  },

  getById(id: string): LostFoundReport | undefined {
    return this.getAll().find((item) => item.id === id);
  },

  save(report: LostFoundReport): void {
    const all = this.getAll();
    const index = all.findIndex((item) => item.id === report.id);

    if (index >= 0) {
      all[index] = report;
    } else {
      all.unshift(report);
    }

    writeList(LOST_FOUND_KEY, all);
  },

  delete(id: string): void {
    const all = this.getAll().filter((item) => item.id !== id);
    writeList(LOST_FOUND_KEY, all);
  },

  clear(): void {
    localStorage.removeItem(LOST_FOUND_KEY);
  },
};
