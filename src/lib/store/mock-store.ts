import type {
  DailyReport,
  Expense,
  SiteSurvey,
  User,
} from "@/lib/types";
import {
  SEED_EXPENSE_CATEGORIES,
  SEED_MATERIALS,
  SEED_PROJECTS,
  SEED_SITE_TOOLS,
  SEED_SITE_WORK_TYPES,
  SEED_VEHICLES,
  SEED_WORK_TYPES,
} from "@/lib/seed/masters";

interface MockStore {
  users: User[];
  dailyReports: DailyReport[];
  expenses: Expense[];
  siteSurveys: SiteSurvey[];
}

const defaultStore: MockStore = {
  users: [],
  dailyReports: [],
  expenses: [],
  siteSurveys: [],
};

let memoryStore: MockStore = { ...defaultStore };

function isBrowser() {
  return typeof window !== "undefined";
}

const STORAGE_KEY = "toughflow-mock-store";

function loadStore(): MockStore {
  if (!isBrowser()) return memoryStore;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryStore = JSON.parse(raw) as MockStore;
    }
  } catch {
    memoryStore = { ...defaultStore };
  }
  return memoryStore;
}

function saveStore(store: MockStore) {
  memoryStore = store;
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }
}

export function getMockStore(): MockStore {
  return loadStore();
}

export function resetMockStore() {
  saveStore({ ...defaultStore });
}

export function upsertUser(user: User) {
  const store = loadStore();
  const idx = store.users.findIndex((u) => u.id === user.id);
  if (idx >= 0) store.users[idx] = user;
  else store.users.push(user);
  saveStore(store);
  return user;
}

export function addDailyReport(report: DailyReport) {
  const store = loadStore();
  store.dailyReports.unshift(report);
  saveStore(store);
  return report;
}

export function listDailyReports(userId?: string) {
  const store = loadStore();
  if (!userId) return store.dailyReports;
  return store.dailyReports.filter((r) => r.userId === userId);
}

export function addExpense(expense: Expense) {
  const store = loadStore();
  store.expenses.unshift(expense);
  saveStore(store);
  return expense;
}

export function listExpenses(userId?: string) {
  const store = loadStore();
  if (!userId) return store.expenses;
  return store.expenses.filter((e) => e.userId === userId);
}

export function addSiteSurvey(survey: SiteSurvey) {
  const store = loadStore();
  store.siteSurveys.unshift(survey);
  saveStore(store);
  return survey;
}

export function listSiteSurveys(userId?: string) {
  const store = loadStore();
  if (!userId) return store.siteSurveys;
  return store.siteSurveys.filter((s) => s.userId === userId);
}

export function getMasters() {
  return {
    dailyReport: {
      workTypes: SEED_WORK_TYPES.filter((w) => w.isActive),
      vehicles: SEED_VEHICLES.filter((v) => v.isActive),
      materials: SEED_MATERIALS.filter((m) => m.isActive),
    },
    siteSurvey: {
      workTypes: SEED_SITE_WORK_TYPES.filter((w) => w.isActive),
      tools: SEED_SITE_TOOLS.filter((t) => t.isActive),
    },
    expenseCategories: SEED_EXPENSE_CATEGORIES.filter((c) => c.isActive),
    projects: SEED_PROJECTS.filter((p) => p.status === "active"),
  };
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
