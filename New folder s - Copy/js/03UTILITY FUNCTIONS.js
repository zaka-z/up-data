    //03
    function escapeHTML(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function parseFiniteNumber(value) {
      if (value === null || value === undefined || String(value).trim() === '') {
        return null;
      }
      const number = Number(value);
      if (!Number.isFinite(number)) {
        return NaN;
      }
      return number;
    }

    function clampPage(page, totalPages) {
      const maxPage = Math.max(1, totalPages || 1);
      return Math.min(Math.max(1, page), maxPage);
    }

    function hasUnsavedChanges() {
      return Object.values(dirtyState).some(state => state);
    }

    function markDirty(tabKey) {
      if (dirtyState[tabKey] !== undefined) {
        dirtyState[tabKey] = true;
      }
    }

    function markClean(tabKey) {
      if (dirtyState[tabKey] !== undefined) {
        dirtyState[tabKey] = false;
      }
    }
