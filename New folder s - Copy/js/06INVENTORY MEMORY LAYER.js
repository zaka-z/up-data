   //06
   function normalizeProductID(productId) {
      return String(productId ?? '').trim();
    }

    function rebuildInventoryIndex() {
      const map = new Map();
      const duplicates = new Set();
      
      inventoryData.forEach((row, index) => {
        const id = normalizeProductID(row.ProductID);
        if (id) {
          if (map.has(id)) {
            duplicates.add(id);
          }
          map.set(id, { row, index });
        }
      });
      
      if (duplicates.size > 0) {
        addLog(`هشدار: ${duplicates.size} ProductID تکراری در انبار یافت شد: ${Array.from(duplicates).join(', ')}`, 'warn');
      }
      
      inventoryProductMap = map;
      return map;
    }

    function getInventoryProductMap() {
      return inventoryProductMap;
    }

    function findInventoryProductById(productId) {
      const id = normalizeProductID(productId);
      if (!id) return null;
      const entry = inventoryProductMap.get(id);
      return entry ? entry.row : null;
    }

    function hasInventoryProduct(productId) {
      return !!findInventoryProductById(productId);
    }

    function onInventoryDatabaseUpdated() {
      rebuildInventoryIndex();
      addLog(`دیتابیس انبار به‌روزرسانی شد. تعداد محصولات: ${inventoryData.length}`, 'info');
      clearProductHelpers();
    }