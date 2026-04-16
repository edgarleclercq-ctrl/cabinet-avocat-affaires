// Mode démo : store mutable partagé pour les clients/dossiers créés
// pendant la session. Persistance via localStorage pour survivre aux
// reloads. useSyncExternalStore (natif React) pour la réactivité.

"use client";

import { useSyncExternalStore } from "react";

const LS_CLIENTS = "lexicab_demo_added_clients";
const LS_DOSSIERS = "lexicab_demo_added_dossiers";

type Listener = () => void;

function createStore<T>(storageKey: string) {
  let items: T[] = [];
  const listeners = new Set<Listener>();
  let initialized = false;

  function load() {
    if (typeof window === "undefined") return;
    if (initialized) return;
    initialized = true;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) items = JSON.parse(raw);
    } catch {
      // ignore corrupted localStorage
    }
  }

  function persist() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // localStorage may be unavailable (incognito, quota)
    }
  }

  function emit() {
    listeners.forEach((l) => l());
  }

  return {
    add(item: T) {
      load();
      items = [item, ...items];
      persist();
      emit();
    },
    getAll(): T[] {
      load();
      return items;
    },
    clear() {
      load();
      items = [];
      persist();
      emit();
    },
    subscribe(listener: Listener) {
      load();
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    // Snapshot stable : la même référence tant que rien n'a changé.
    getSnapshot(): T[] {
      load();
      return items;
    },
  };
}

export const demoClientsStore = createStore<any>(LS_CLIENTS);
export const demoDossiersStore = createStore<any>(LS_DOSSIERS);

// Snapshot serveur (SSR) : tableau vide partagé pour stabilité.
const EMPTY_ARRAY: any[] = [];

export function useDemoAddedClients(): any[] {
  return useSyncExternalStore(
    demoClientsStore.subscribe,
    demoClientsStore.getSnapshot,
    () => EMPTY_ARRAY
  );
}

export function useDemoAddedDossiers(): any[] {
  return useSyncExternalStore(
    demoDossiersStore.subscribe,
    demoDossiersStore.getSnapshot,
    () => EMPTY_ARRAY
  );
}
