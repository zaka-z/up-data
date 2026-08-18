    
    
    //08
    function parseCSV(text) {
      const lines = [];
      let currentLine = [];
      let currentField = '';
      let inQuotes = false;
      let i = 0;

      while (i < text.length) {
        const char = text[i];
        const nextChar = i + 1 < text.length ? text[i + 1] : '';

        if (inQuotes) {
          if (char === '"' && nextChar === '"') {
            currentField += '"';
            i += 2;
          } else if (char === '"') {
            inQuotes = false;
            i++;
          } else {
            currentField += char;
            i++;
          }
        } else {
          if (char === '"') {
            inQuotes = true;
            i++;
          } else if (char === ',') {
            currentLine.push(currentField);
            currentField = '';
            i++;
          } else if (char === '\r' && nextChar === '\n') {
            currentLine.push(currentField);
            lines.push(currentLine);
            currentLine = [];
            currentField = '';
            i += 2;
          } else if (char === '\n') {
            currentLine.push(currentField);
            lines.push(currentLine);
            currentLine = [];
            currentField = '';
            i++;
          } else if (char === '\r') {
            currentLine.push(currentField);
            lines.push(currentLine);
            currentLine = [];
            currentField = '';
            i++;
          } else {
            currentField += char;
            i++;
          }
        }
      }

      if (currentField !== '' || currentLine.length > 0) {
        currentLine.push(currentField);
        lines.push(currentLine);
      }

      if (lines.length === 0) return { headers: [], data: [] };
      
      let headers = lines[0];
      if (headers.length > 0 && headers[0].charCodeAt(0) === 0xFEFF) {
        headers[0] = headers[0].replace(/^\uFEFF/, '');
      }
      
      headers = headers.map(h => h.trim());

      const data = [];
      const invalidRows = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i];
        if (values.length === headers.length) {
          const row = {};
          headers.forEach((h, idx) => {
            row[h.trim()] = values[idx];
          });
          data.push(row);
        } else if (values.some(v => v.trim() !== '')) {
          invalidRows.push({
            line: i + 1,
            expected: headers.length,
            actual: values.length,
            values: values.join(',')
          });
        }
      }

      return { headers, data, invalidRows };
    }

    function csvEscape(value) {
      const text = String(value ?? '');
      const escaped = text.replace(/"/g, '""');
      
      if (/[",\n\r]/.test(escaped)) {
        return `"${escaped}"`;
      }
      
      return escaped;
    }

    function objectsToCSV(data, schemaFields) {
      if (data.length === 0) return schemaFields.join(',') + '\n';
      
      const lines = [schemaFields.join(',')];
      
      data.forEach(row => {
        const vals = schemaFields.map(f => {
          const value = row[f] !== undefined ? row[f] : '';
          return csvEscape(value);
        });
        lines.push(vals.join(','));
      });
      
      return lines.join('\n') + '\n';
    }
