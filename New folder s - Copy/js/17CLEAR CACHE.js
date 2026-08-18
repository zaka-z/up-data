//17
function clearCache() {
      const ok = confirm('آیا مطمئن هستید که می‌خواهید کش و داده‌های موقت برنامه پاک شود؟');
      if (!ok) return;

      salesData.length = 0;
      interactionsData.length = 0;
      inventoryData.length = 0;
      
      salesFileHandle.handle = null;
      interactionsFileHandle.handle = null;
      inventoryFileHandle.handle = null;
      
      logs.length = 0;
      updateLogDisplay();
      
      paginationState.sales.page = 1;
      paginationState.interactions.page = 1;
      paginationState.inventory.page = 1;
      
      dirtyState.sales = false;
      dirtyState.interactions = false;
      dirtyState.inventory = false;
      
      inventoryProductMap.clear();
      
      refreshTableForTab('sales');
      refreshTableForTab('interactions');
      refreshTableForTab('inventory');
      
      clearForm(salesSchema, 'salesFormGrid');
      clearForm(inventorySchema, 'inventoryFormGrid');
      clearProductHelpers();
      
      addLog('کش برنامه پاک شد.', 'info');
    }