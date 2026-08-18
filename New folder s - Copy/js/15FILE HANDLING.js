//15
async function openCSVFile(schema, dataArray, fileHandleRef, tabKey) {
      try {
        let fileText = null;
        let fileHandleTemp = null;
        let fileName = '';

        if (window.showOpenFilePicker) {
          const [fileHandle] = await window.showOpenFilePicker({
            types: [{
              description: 'CSV Files',
              accept: { 'text/csv': ['.csv'] }
            }]
          });
          fileHandleTemp = fileHandle;
          const file = await fileHandle.getFile();
          fileText = await file.text();
          fileName = file.name;
        } else {
          fileText = await new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv';
            input.onchange = async (e) => {
              const file = e.target.files[0];
              if (!file) {
                resolve(null);
                return;
              }
              const text = await file.text();
              fileName = file.name;
              resolve(text);
            };
            input.oncancel = () => resolve(null);
            input.click();
          });
          if (fileText === null) {
            addLog(`لغو انتخاب فایل CSV بخش ${tabNames[tabKey] || tabKey}.`, 'info');
            return false;
          }
        }

        if (!fileText.trim()) {
          addLog(`فایل CSV بخش ${tabNames[tabKey] || tabKey} خالی است.`, 'error');
          return false;
        }

        const { headers, data, invalidRows } = parseCSV(fileText);
        
        if (headers.length === 0) {
          addLog(`فایل CSV بخش ${tabNames[tabKey] || tabKey} header ندارد.`, 'error');
          return false;
        }

        const validation = validateCSVHeaders(headers, schema);
        if (!validation.valid) {
          addLog(`فایل CSV بخش ${tabNames[tabKey] || tabKey} با schema سازگار نیست. ستون‌های مفقود: ${validation.missing.join('، ')}`, 'error');
          return false;
        }
        
        if (validation.duplicates.length > 0) {
          addLog(`هشدار: ستون‌های تکراری در فایل CSV بخش ${tabNames[tabKey] || tabKey}: ${validation.duplicates.join('، ')}`, 'warn');
        }
        
        if (validation.extra.length > 0) {
          addLog(`هشدار: ستون‌های اضافی در فایل CSV بخش ${tabNames[tabKey] || tabKey}: ${validation.extra.join('، ')}`, 'warn');
        }

        // Import شبه‌اتمیک: ابتدا در آرایه موقت، سپس جایگزینی
        const tempData = [...data];
        
        if (invalidRows.length > 0) {
          invalidRows.forEach(row => {
            addLog(`ردیف ${row.line}: تعداد ستون‌ها با header برابر نیست (${row.actual} در مقابل ${row.expected})`, 'error');
          });
          addLog(`CSV خوانده شد: ${data.length} ردیف معتبر، ${invalidRows.length} ردیف نامعتبر.`, 'warn');
        } else {
          addLog(`CSV خوانده شد: ${data.length} ردیف معتبر.`, 'info');
        }

        // جایگزینی آرایه اصلی
        dataArray.splice(0, dataArray.length, ...tempData);
        fileHandleRef.handle = fileHandleTemp || null;
        markClean(tabKey);
        
        addLog(`فایل CSV بخش ${tabNames[tabKey] || tabKey} با موفقیت بارگذاری شد (${data.length} رکورد).`, 'info');
        refreshTableForTab(tabKey);
        
        if (tabKey === 'inventory') {
          onInventoryDatabaseUpdated();
        }
        
        return true;
      } catch (err) {
        if (err.name === 'AbortError') {
          addLog(`لغو انتخاب فایل CSV بخش ${tabNames[tabKey] || tabKey}.`, 'info');
          return false;
        }
        addLog(`خطا در باز کردن فایل: ${err.message}`, 'error');
        return false;
      }
    }

    async function saveCSVToFile(dataArray, schema, fileHandleRef, tabKey) {
      try {
        const csvString = objectsToCSV(dataArray, schema.map(s => s.name));
        const csvWithBOM = '\uFEFF' + csvString;
        const fileName = defaultFileNames[tabKey] || 'data.csv';

        if (window.showSaveFilePicker) {
          try {
            let handle = fileHandleRef.handle;
            
            if (!handle) {
              handle = await window.showSaveFilePicker({
                suggestedName: fileName,
                types: [{
                  description: 'CSV Files',
                  accept: { 'text/csv': ['.csv'] }
                }]
              });
              fileHandleRef.handle = handle;
            }
            
            const writable = await handle.createWritable();
            await writable.write(csvWithBOM);
            await writable.close();
            addLog('فایل CSV با موفقیت ذخیره شد.', 'info');
            return true;
          } catch (err) {
            if (err.name === 'AbortError') {
              addLog('ذخیره فایل لغو شد.', 'info');
              return false;
            }
            addLog(`خطا در ذخیره فایل با File System Access API: ${err.message}`, 'error');
            fileHandleRef.handle = null;
            // Fallback به دانلود
          }
        }

        // Fallback: دانلود مستقیم
        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        addLog(`فایل CSV با نام ${fileName} دانلود شد.`, 'warn');
        return true;
      } catch (err) {
        addLog(`خطا در ذخیره فایل: ${err.message}`, 'error');
        return false;
      }
    }