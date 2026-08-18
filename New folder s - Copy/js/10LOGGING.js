    
    //10
    function addLog(message, level = 'info') {
      const entry = {
        timestampISO: new Date().toISOString(),
        displayTime: new Date().toLocaleString('fa-IR'),
        level,
        message: String(message ?? '')
      };

      logs.push(entry);

      if (logs.length > MAX_LOG_ENTRIES) {
        logs.splice(0, logs.length - MAX_LOG_ENTRIES);
      }

      updateLogDisplay();
    }

    function updateLogDisplay() {
      const logArea = document.getElementById('logArea');
      if (!logArea) return;
      
      const display = logs.map(entry => {
        const prefix = entry.level === 'error' ? '❌' : entry.level === 'warn' ? '⚠️' : 'ℹ️';
        return `${entry.displayTime} ${prefix} ${entry.message}`;
      }).join('\n');
      
      logArea.value = display;
      logArea.scrollTop = logArea.scrollHeight;
    }