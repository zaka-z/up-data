   
  //09 
   function validateCSVHeaders(headers, schema) {
      const schemaFields = schema.map(f => f.name);
      const cleanHeaders = headers.map(h => h.replace(/^\uFEFF/, '').trim());
      
      const missing = schemaFields.filter(f => !cleanHeaders.includes(f));
      const extra = cleanHeaders.filter(h => !schemaFields.includes(h));
      
      const duplicates = new Set();
      const seen = new Set();
      cleanHeaders.forEach(h => {
        if (seen.has(h)) duplicates.add(h);
        seen.add(h);
      });

      return { 
        missing, 
        extra, 
        duplicates: Array.from(duplicates),
        cleanHeaders, 
        valid: missing.length === 0 
      };
    }