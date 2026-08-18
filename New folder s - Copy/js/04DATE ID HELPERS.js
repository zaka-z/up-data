    //04
    function generateUUID() {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    function generateTxnID() {
      return `TXN-${Date.now()}-${generateUUID().slice(0, 8)}`;
    }

    function formatLocalDate(date = new Date()) {
      return date.toISOString().slice(0, 10);
    }

    function formatLocalTime(date = new Date()) {
      return date.toTimeString().slice(0, 8);
    }