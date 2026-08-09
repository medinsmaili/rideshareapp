import { useCallback, useMemo, useState } from "react";

/**
 * Generic row-selection state for tables.
 *
 * Usage:
 *   const sel = useRowSelection<User>(users, u => u.id);
 *   sel.toggle(id); sel.toggleAll(visibleRows); sel.clear();
 *   <Checkbox checked={sel.isSelected(id)} ... />
 */
export function useRowSelection<T>(rows: T[], getId: (row: T) => string) {
  const [ids, setIds] = useState<Set<string>>(new Set());

  const isSelected = useCallback((id: string) => ids.has(id), [ids]);

  const toggle = useCallback((id: string) => {
    setIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const select = useCallback((id: string) => {
    setIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const deselect = useCallback((id: string) => {
    setIds(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setIds(new Set()), []);

  const toggleAll = useCallback((visible: T[]) => {
    setIds(prev => {
      const visibleIds = visible.map(getId);
      const allSelected = visibleIds.every(id => prev.has(id));
      const next = new Set(prev);
      if (allSelected) visibleIds.forEach(id => next.delete(id));
      else visibleIds.forEach(id => next.add(id));
      return next;
    });
  }, [getId]);

  const allSelected = useMemo(() => {
    if (rows.length === 0) return false;
    return rows.every(r => ids.has(getId(r)));
  }, [rows, ids, getId]);

  const someSelected = ids.size > 0 && !allSelected;

  const selectedRows = useMemo(
    () => rows.filter(r => ids.has(getId(r))),
    [rows, ids, getId]
  );

  return {
    ids,
    selectedIds: Array.from(ids),
    selectedRows,
    count: ids.size,
    isSelected,
    toggle,
    select,
    deselect,
    clear,
    toggleAll,
    allSelected,
    someSelected,
  };
}
