export const calculateDaysUntil = (dateStr: string): number => {
  const target = new Date(dateStr);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const formatDate = (date: Date | string): string => {
  if (!date) return '';
  const d = new Date(date);
  // Ensure we handle invalid dates gracefully
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

export const downloadCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => {
      const val = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName];
      const stringVal = String(val);
      // Escape quotes and wrap in quotes if contains comma, quote or newline
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    }).join(','))
  ].join('\n');

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSV = (text: string): any[] => {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values: string[] = [];
    let currentVal = '';
    let insideQuote = false;
    
    // Robust character-by-character parsing to handle quotes and commas correctly
    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      
      if (char === '"') {
        if (insideQuote && line[charIndex + 1] === '"') {
          // Escaped quote
          currentVal += '"';
          charIndex++; 
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        values.push(currentVal.trim());
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim()); // Push the last value

    const obj: any = {};
    headers.forEach((h, index) => {
      let val = values[index] || '';
      // Remove surrounding quotes if they persist (though logic above handles most)
      if (val.startsWith('"') && val.endsWith('"') && val.length > 1) {
        val = val.slice(1, -1);
      }
      
      // Attempt generic type conversion
      if (val.toLowerCase() === 'true') obj[h] = true;
      else if (val.toLowerCase() === 'false') obj[h] = false;
      else if (val !== '' && !isNaN(Number(val)) && !h.includes('date') && !h.includes('serial')) {
        // Only convert to number if it's not a date or serial number (which might look like numbers but should be strings)
        obj[h] = Number(val);
      } else {
        obj[h] = val;
      }
    });
    result.push(obj);
  }
  
  return result;
};
