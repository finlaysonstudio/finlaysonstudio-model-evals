/**
 * Formatting utilities for CLI output
 */

/**
 * Formats results as a simple table
 */
export function formatAsTable(data: Record<string, any>[]): string {
  if (data.length === 0) {
    return 'No data available';
  }

  // Get all keys from the objects
  const keys = Object.keys(data[0]);
  
  // Calculate column widths
  const columnWidths: Record<string, number> = {};
  
  keys.forEach(key => {
    // Start with the header width
    columnWidths[key] = key.length;
    
    // Check all values for this key
    data.forEach(row => {
      const value = String(row[key] || '');
      columnWidths[key] = Math.max(columnWidths[key], value.length);
    });
  });
  
  // Generate header row
  let tableOutput = keys.map(key => key.padEnd(columnWidths[key])).join(' | ') + '\n';
  
  // Add separator row
  tableOutput += keys.map(key => '-'.repeat(columnWidths[key])).join('-+-') + '\n';
  
  // Add data rows
  data.forEach(row => {
    tableOutput += keys.map(key => {
      const value = String(row[key] || '');
      return value.padEnd(columnWidths[key]);
    }).join(' | ') + '\n';
  });
  
  return tableOutput;
}

/**
 * Formats data as JSON string
 */
export function formatAsJson(data: any): string {
  return JSON.stringify(data, null, 2);
}