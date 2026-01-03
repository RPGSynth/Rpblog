(() => {
  const wrappers = document.querySelectorAll('[data-movies]');
  if (!wrappers.length) return;

  wrappers.forEach((wrapper) => {
    const table = wrapper.querySelector('[data-movies-table]');
    const tbody = table?.querySelector('tbody');
    if (!table || !tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    const filterInput = wrapper.querySelector('[data-movies-filter]');
    let state = { key: 'rating', dir: -1, type: 'number' };

    const getValue = (row, key, type) => {
      const cell = row.querySelector(`[data-key="${key}"]`);
      if (!cell) return '';
      const raw = cell.dataset.value ?? cell.textContent.trim();
      if (type === 'number') {
        const n = Number(raw);
        return Number.isNaN(n) ? -Infinity : n;
      }
      return raw.toLowerCase();
    };

    const apply = () => {
      const q = (filterInput?.value || '').toLowerCase();
      let filtered = rows.filter((row) => {
        if (!q) return true;
        const hay = row.dataset.search || row.textContent.toLowerCase();
        return hay.includes(q);
      });

      if (state.key) {
        const { key, dir, type } = state;
        filtered = filtered.sort((a, b) => {
          const av = getValue(a, key, type);
          const bv = getValue(b, key, type);
          if (av < bv) return -1 * dir;
          if (av > bv) return 1 * dir;
          return 0;
        });
      }

      tbody.replaceChildren(...filtered);

      table.querySelectorAll('th[data-sort]').forEach((th) => {
        th.removeAttribute('aria-sort');
        if (th.dataset.sort === state.key) {
          th.setAttribute('aria-sort', state.dir === 1 ? 'ascending' : 'descending');
        }
      });
    };

    table.querySelectorAll('th[data-sort]').forEach((th) => {
      th.style.cursor = 'pointer';
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        const type = th.dataset.type || 'text';
        const dir = state.key === key ? -state.dir : type === 'number' ? -1 : 1;
        state = { key, dir, type };
        apply();
      });
    });

    filterInput?.addEventListener('input', apply);

    apply();
  });
})();
