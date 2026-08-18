   //05
   window.addEventListener('beforeunload', function(event) {
      if (hasUnsavedChanges()) {
        event.preventDefault();
        event.returnValue = '';
      }
    });