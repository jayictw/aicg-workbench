export function focusMenu(root){const target=root?.querySelector('[role="menuitem"]:not(:disabled)')??root;target?.focus();return target;}
