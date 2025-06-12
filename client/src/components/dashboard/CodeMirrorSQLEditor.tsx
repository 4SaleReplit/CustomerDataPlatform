import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CodeMirrorSQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onExecute?: () => void;
}

export function CodeMirrorSQLEditor({ value, onChange, placeholder, className, onExecute }: CodeMirrorSQLEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [currentWord, setCurrentWord] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);

  // Comprehensive Snowflake SQL keywords for autocomplete
  const sqlKeywords = [
    // Core DML Keywords
    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'INSERT INTO', 'UPDATE', 'DELETE', 'MERGE', 'TRUNCATE',
    
    // DDL Keywords
    'CREATE', 'ALTER', 'DROP', 'RENAME', 'DESCRIBE', 'TABLE', 'VIEW', 'SCHEMA', 'DATABASE',
    
    // Join Keywords
    'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN', 'ON', 'USING',
    
    // Logical and Comparison
    'AS', 'DISTINCT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'IS NULL', 'IS NOT NULL', 'LIKE', 'ILIKE', 'BETWEEN',
    
    // Set Operations
    'UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT',
    
    // Window Functions Keywords
    'OVER', 'PARTITION BY', 'QUALIFY',
    
    // Data Types
    'VARCHAR', 'STRING', 'TEXT', 'CHAR', 'CHARACTER', 'NUMBER', 'DECIMAL', 'NUMERIC', 'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'BYTEINT', 'FLOAT', 'DOUBLE', 'BOOLEAN', 'DATE', 'DATETIME', 'TIME', 'TIMESTAMP', 'TIMESTAMP_LTZ', 'TIMESTAMP_NTZ', 'TIMESTAMP_TZ', 'VARIANT', 'OBJECT', 'ARRAY', 'GEOGRAPHY', 'GEOMETRY', 'BINARY', 'VARBINARY',
    
    // Aggregate Functions
    'AVG', 'COUNT', 'SUM', 'MIN', 'MAX', 'LISTAGG', 'ARRAY_AGG', 'OBJECT_AGG', 'APPROX_COUNT_DISTINCT', 'MEDIAN',
    
    // Window Functions
    'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'LEAD', 'LAG', 'FIRST_VALUE', 'LAST_VALUE', 'NTILE', 'PERCENT_RANK', 'CUME_DIST',
    
    // String Functions
    'CONCAT', 'LOWER', 'UPPER', 'TRIM', 'LTRIM', 'RTRIM', 'SUBSTRING', 'REPLACE', 'SPLIT', 'INITCAP', 'LENGTH', 'LEFT', 'RIGHT', 'LPAD', 'RPAD', 'REVERSE', 'TRANSLATE',
    
    // Date and Time Functions
    'CURRENT_DATE', 'CURRENT_TIMESTAMP', 'DATE_TRUNC', 'DATEDIFF', 'DATEADD', 'TO_DATE', 'TO_TIMESTAMP', 'EXTRACT', 'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND', 'DAYOFWEEK', 'DAYOFYEAR', 'WEEK', 'QUARTER',
    
    // Numeric Functions
    'ABS', 'ROUND', 'CEIL', 'FLOOR', 'RANDOM', 'SQRT', 'POWER', 'LOG', 'LN', 'EXP', 'SIN', 'COS', 'TAN', 'SIGN', 'MOD', 'GREATEST', 'LEAST',
    
    // Conversion Functions
    'CAST', 'TRY_CAST', 'TO_VARCHAR', 'TO_NUMBER', 'TO_JSON', 'TO_XML', 'PARSE_JSON', 'PARSE_XML',
    
    // Conditional Functions
    'COALESCE', 'NULLIF', 'IFF', 'ZEROIFNULL', 'NVL', 'NVL2', 'DECODE',
    
    // JSON Functions
    'GET', 'GET_PATH', 'FLATTEN', 'OBJECT_CONSTRUCT', 'OBJECT_INSERT', 'ARRAY_CONSTRUCT', 'ARRAY_INSERT', 'ARRAY_APPEND', 'ARRAY_PREPEND', 'ARRAY_CAT', 'ARRAY_COMPACT', 'ARRAY_CONTAINS', 'ARRAY_POSITION', 'ARRAY_SIZE', 'ARRAY_SLICE', 'ARRAY_TO_STRING', 'ARRAY_UNIQUE_AGG',
    
    // Hash Functions
    'MD5', 'SHA1', 'SHA2', 'HASH',
    
    // Encoding Functions
    'BASE64_ENCODE', 'BASE64_DECODE', 'HEX_ENCODE', 'HEX_DECODE',
    
    // Regular Expression Functions
    'REGEXP', 'REGEXP_LIKE', 'REGEXP_REPLACE', 'REGEXP_SUBSTR', 'REGEXP_COUNT', 'RLIKE',
    
    // System Functions
    'CURRENT_USER', 'CURRENT_ROLE', 'CURRENT_DATABASE', 'CURRENT_SCHEMA', 'CURRENT_SESSION', 'CURRENT_WAREHOUSE', 'CURRENT_REGION', 'CURRENT_ACCOUNT',
    
    // Snowflake Specific Functions
    'SNOWFLAKE_SAMPLE', 'GENERATOR', 'SEQ1', 'SEQ2', 'SEQ4', 'SEQ8', 'UNIFORM', 'NORMAL', 'ZIPF',
    
    // Geospatial Functions
    'ST_AREA', 'ST_ASGEOJSON', 'ST_ASWKT', 'ST_BUFFER', 'ST_CENTROID', 'ST_CONTAINS', 'ST_DISTANCE', 'ST_INTERSECTS', 'ST_LENGTH', 'ST_POINT', 'ST_POLYGON', 'ST_WITHIN',
    
    // Constants and Literals
    'TRUE', 'FALSE', 'PI',
    
    // Order and Null Handling
    'ASC', 'DESC', 'NULLS FIRST', 'NULLS LAST',
    
    // Common CTEs and Advanced
    'WITH', 'RECURSIVE', 'LATERAL'
  ];

  // Comprehensive SQL syntax highlighting color scheme
  const tokenColors = {
    // Core elements
    background: '#002B36',    // Dark cyan background
    default: '#839496',       // Light gray default text
    
    // Comments
    comment: '#6272A4',       // Muted blue-gray for comments
    
    // Keywords - categorized by function
    primaryKeyword: '#BD93F9',     // Bright purple - SELECT, FROM, WHERE, etc.
    dmlKeyword: '#FFB86C',         // Orange - INSERT, UPDATE, DELETE
    ddlKeyword: '#FF5555',         // Red - CREATE, ALTER, DROP
    transactionKeyword: '#8BE9FD', // Cyan - COMMIT, ROLLBACK, BEGIN
    clauseKeyword: '#8BE9FD',      // Cyan - DISTINCT, LIMIT, CASE, etc.
    
    // Data and literals
    string: '#50FA7B',        // Green - String literals
    number: '#BD93F9',        // Purple - Numeric values
    boolean: '#FFB86C',       // Orange - TRUE/FALSE
    null: '#FF5555',          // Red - NULL values
    
    // Functions and types
    function: '#F1FA8C',      // Yellow - Built-in functions
    datatype: '#8BE9FD',      // Cyan - Data types
    
    // Operators and punctuation
    operator: '#FF79C6',      // Pink - Operators
    punctuation: '#F8F8F2'    // White - Parentheses, commas, semicolons
  };

  // Comprehensive SQL patterns categorized by type
  const sqlPatterns = {
    // Comments
    comments: /--.*$/gm,
    multilineComments: /\/\*[\s\S]*?\*\//g,
    
    // Primary keywords (most common SQL operations)
    primaryKeywords: /\b(SELECT|FROM|WHERE|GROUP|BY|ORDER|HAVING|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|ON|AS|AND|OR|NOT|IN|EXISTS|LIKE|BETWEEN|IS|UNION|ALL|WITH|RECURSIVE|OVER|PARTITION|WINDOW|USING|NATURAL|CROSS)\b/gi,
    
    // DML keywords (data modification)
    dmlKeywords: /\b(INSERT|INTO|VALUES|UPDATE|SET|DELETE|MERGE)\b/gi,
    
    // DDL keywords (structure modification)
    ddlKeywords: /\b(CREATE|ALTER|DROP|TRUNCATE|TABLE|INDEX|VIEW|DATABASE|SCHEMA|PROCEDURE|FUNCTION)\b/gi,
    
    // Transaction control
    transactionKeywords: /\b(COMMIT|ROLLBACK|BEGIN|TRANSACTION|SAVEPOINT)\b/gi,
    
    // Clause and other keywords
    clauseKeywords: /\b(DISTINCT|LIMIT|OFFSET|QUALIFY|CASE|WHEN|THEN|ELSE|END|NULL|ASC|DESC|NULLS|FIRST|LAST)\b/gi,
    
    // Functions
    functions: /\b(COUNT|SUM|AVG|MIN|MAX|UPPER|LOWER|LENGTH|SUBSTRING|TRIM|COALESCE|ISNULL|IFNULL|IFF|CAST|CONVERT|DATEPART|YEAR|MONTH|DAY|NOW|CURRENT_TIMESTAMP|CURRENT_DATE|CURRENT_TIME|EXTRACT|CONCAT|REPLACE|ROUND|FLOOR|CEIL|ABS|POWER|SQRT|LOG|EXP|SIGN|RAND|ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD|FIRST_VALUE|LAST_VALUE|NTILE|PERCENTILE_CONT|PERCENTILE_DISC|APPROX_COUNT_DISTINCT|TO_CHAR|TO_DATE|TO_NUMBER|SPLIT|ARRAY_AGG|OBJECT_CONSTRUCT|PARSE_JSON|GET|GET_PATH|FLATTEN)\s*(?=\()/gi,
    
    // Data types
    datatypes: /\b(VARCHAR|CHAR|STRING|TEXT|NUMBER|INTEGER|INT|BIGINT|SMALLINT|TINYINT|DECIMAL|NUMERIC|FLOAT|REAL|DOUBLE|MONEY|SMALLMONEY|BIT|BOOLEAN|BOOL|DATE|TIME|DATETIME|DATETIME2|TIMESTAMP|TIMESTAMPTZ|TIMESTAMPLTZ|TIMESTAMPNTZ|BINARY|VARBINARY|ARRAY|OBJECT|VARIANT|GEOGRAPHY|GEOMETRY|JSON|XML|UUID|SERIAL|AUTOINCREMENT)\b/gi,
    
    // Boolean values
    booleans: /\b(TRUE|FALSE)\b/gi,
    
    // NULL specifically
    nullValues: /\b(NULL)\b/gi,
    
    // Strings
    strings: /'([^'\\]|\\.)*'/g,
    doubleQuotedStrings: /"([^"\\]|\\.)*"/g,
    
    // Numbers
    numbers: /\b\d+(\.\d+)?\b/g,
    
    // Operators
    operators: /([=<>!]+|[\+\-\*\/\%]|::|&&|\|\||<>|<=|>=|!=)/g,
    
    // Punctuation
    punctuation: /[(),;]/g
  };

  // Comprehensive tokenization and colorization
  const colorizeText = useCallback((text: string): string => {
    if (!text) return '';
    
    // Escape HTML first
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Split by lines to preserve line breaks
    const lines = escaped.split('\n');
    const colorizedLines = lines.map(line => {
      if (!line) return '';
      
      // Use precise tokenization with comprehensive pattern matching
      const tokens = [];
      let remaining = line;
      
      while (remaining) {
        let matched = false;
        
        // 1. Comments first (highest priority)
        const commentMatch = remaining.match(/^--.*$/);
        if (commentMatch) {
          tokens.push(`<span style="color: ${tokenColors.comment}; font-style: italic;">${commentMatch[0]}</span>`);
          remaining = '';
          matched = true;
        }
        
        // 2. Strings (to avoid highlighting keywords inside strings)
        if (!matched) {
          const stringMatch = remaining.match(/^'([^'\\]|\\.)*'/);
          if (stringMatch) {
            tokens.push(`<span style="color: ${tokenColors.string};">${stringMatch[0]}</span>`);
            remaining = remaining.slice(stringMatch[0].length);
            matched = true;
          }
        }
        
        // 3. Double-quoted strings
        if (!matched) {
          const doubleStringMatch = remaining.match(/^"([^"\\]|\\.)*"/);
          if (doubleStringMatch) {
            tokens.push(`<span style="color: ${tokenColors.string};">${doubleStringMatch[0]}</span>`);
            remaining = remaining.slice(doubleStringMatch[0].length);
            matched = true;
          }
        }
        
        // 4. NULL values (special case)
        if (!matched) {
          const nullMatch = remaining.match(/^\b(NULL)\b/i);
          if (nullMatch) {
            tokens.push(`<span style="color: ${tokenColors.null}; font-weight: 600;">${nullMatch[0]}</span>`);
            remaining = remaining.slice(nullMatch[0].length);
            matched = true;
          }
        }
        
        // 5. Boolean values
        if (!matched) {
          const boolMatch = remaining.match(/^\b(TRUE|FALSE)\b/i);
          if (boolMatch) {
            tokens.push(`<span style="color: ${tokenColors.boolean}; font-weight: 600;">${boolMatch[0]}</span>`);
            remaining = remaining.slice(boolMatch[0].length);
            matched = true;
          }
        }
        
        // 6. DDL Keywords (highest impact - red)
        if (!matched) {
          const ddlMatch = remaining.match(/^\b(CREATE|ALTER|DROP|TRUNCATE|TABLE|INDEX|VIEW|DATABASE|SCHEMA|PROCEDURE|FUNCTION)\b/i);
          if (ddlMatch) {
            tokens.push(`<span style="color: ${tokenColors.ddlKeyword}; font-weight: 700;">${ddlMatch[0]}</span>`);
            remaining = remaining.slice(ddlMatch[0].length);
            matched = true;
          }
        }
        
        // 7. DML Keywords (data modification - orange)
        if (!matched) {
          const dmlMatch = remaining.match(/^\b(INSERT|INTO|VALUES|UPDATE|SET|DELETE|MERGE)\b/i);
          if (dmlMatch) {
            tokens.push(`<span style="color: ${tokenColors.dmlKeyword}; font-weight: 600;">${dmlMatch[0]}</span>`);
            remaining = remaining.slice(dmlMatch[0].length);
            matched = true;
          }
        }
        
        // 8. Transaction Keywords (cyan)
        if (!matched) {
          const transactionMatch = remaining.match(/^\b(COMMIT|ROLLBACK|BEGIN|TRANSACTION|SAVEPOINT)\b/i);
          if (transactionMatch) {
            tokens.push(`<span style="color: ${tokenColors.transactionKeyword}; font-weight: 600;">${transactionMatch[0]}</span>`);
            remaining = remaining.slice(transactionMatch[0].length);
            matched = true;
          }
        }
        
        // 9. Primary Keywords (most common - purple)
        if (!matched) {
          const primaryMatch = remaining.match(/^\b(SELECT|FROM|WHERE|GROUP|BY|ORDER|HAVING|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|ON|AS|AND|OR|NOT|IN|EXISTS|LIKE|BETWEEN|IS|UNION|ALL|WITH|RECURSIVE|OVER|PARTITION|WINDOW|USING|NATURAL|CROSS)\b/i);
          if (primaryMatch) {
            tokens.push(`<span style="color: ${tokenColors.primaryKeyword}; font-weight: 600;">${primaryMatch[0]}</span>`);
            remaining = remaining.slice(primaryMatch[0].length);
            matched = true;
          }
        }
        
        // 10. Clause Keywords (cyan)
        if (!matched) {
          const clauseMatch = remaining.match(/^\b(DISTINCT|LIMIT|OFFSET|QUALIFY|CASE|WHEN|THEN|ELSE|END|ASC|DESC|NULLS|FIRST|LAST)\b/i);
          if (clauseMatch) {
            tokens.push(`<span style="color: ${tokenColors.clauseKeyword}; font-weight: 500;">${clauseMatch[0]}</span>`);
            remaining = remaining.slice(clauseMatch[0].length);
            matched = true;
          }
        }
        
        // 11. Functions (yellow)
        if (!matched) {
          const functionMatch = remaining.match(/^\b(COUNT|SUM|AVG|MIN|MAX|UPPER|LOWER|LENGTH|SUBSTRING|TRIM|COALESCE|ISNULL|IFNULL|IFF|CAST|CONVERT|DATEPART|YEAR|MONTH|DAY|NOW|CURRENT_TIMESTAMP|CURRENT_DATE|CURRENT_TIME|EXTRACT|CONCAT|REPLACE|ROUND|FLOOR|CEIL|ABS|POWER|SQRT|LOG|EXP|SIGN|RAND|ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD|FIRST_VALUE|LAST_VALUE|NTILE|PERCENTILE_CONT|PERCENTILE_DISC|APPROX_COUNT_DISTINCT|TO_CHAR|TO_DATE|TO_NUMBER|SPLIT|ARRAY_AGG|OBJECT_CONSTRUCT|PARSE_JSON|GET|GET_PATH|FLATTEN)\s*(?=\()/i);
          if (functionMatch) {
            tokens.push(`<span style="color: ${tokenColors.function}; font-weight: 500;">${functionMatch[0]}</span>`);
            remaining = remaining.slice(functionMatch[0].length);
            matched = true;
          }
        }
        
        // 12. Data types (cyan)
        if (!matched) {
          const datatypeMatch = remaining.match(/^\b(VARCHAR|CHAR|STRING|TEXT|NUMBER|INTEGER|INT|BIGINT|SMALLINT|TINYINT|DECIMAL|NUMERIC|FLOAT|REAL|DOUBLE|MONEY|SMALLMONEY|BIT|BOOLEAN|BOOL|DATE|TIME|DATETIME|DATETIME2|TIMESTAMP|TIMESTAMPTZ|TIMESTAMPLTZ|TIMESTAMPNTZ|BINARY|VARBINARY|ARRAY|OBJECT|VARIANT|GEOGRAPHY|GEOMETRY|JSON|XML|UUID|SERIAL|AUTOINCREMENT)\b/i);
          if (datatypeMatch) {
            tokens.push(`<span style="color: ${tokenColors.datatype}; font-weight: 500;">${datatypeMatch[0]}</span>`);
            remaining = remaining.slice(datatypeMatch[0].length);
            matched = true;
          }
        }
        
        // 13. Numbers (purple)
        if (!matched) {
          const numberMatch = remaining.match(/^\d+(\.\d+)?/);
          if (numberMatch) {
            tokens.push(`<span style="color: ${tokenColors.number};">${numberMatch[0]}</span>`);
            remaining = remaining.slice(numberMatch[0].length);
            matched = true;
          }
        }
        
        // 14. Operators (pink)
        if (!matched) {
          const operatorMatch = remaining.match(/^([=<>!]+|[\+\-\*\/\%]|::|&&|\|\||<>|<=|>=|!=)/);
          if (operatorMatch) {
            tokens.push(`<span style="color: ${tokenColors.operator};">${operatorMatch[0]}</span>`);
            remaining = remaining.slice(operatorMatch[0].length);
            matched = true;
          }
        }
        
        // 15. Punctuation (white)
        if (!matched) {
          const punctuationMatch = remaining.match(/^[(),;]/);
          if (punctuationMatch) {
            tokens.push(`<span style="color: ${tokenColors.punctuation};">${punctuationMatch[0]}</span>`);
            remaining = remaining.slice(punctuationMatch[0].length);
            matched = true;
          }
        }
        
        // 16. Default text
        if (!matched) {
          tokens.push(remaining.charAt(0));
          remaining = remaining.slice(1);
        }
      }
      
      return tokens.join('');
    });
    
    return colorizedLines.join('<br>');
  }, [tokenColors]);

  // Get current word being typed for autocomplete
  const getCurrentWord = useCallback((element: HTMLDivElement): { word: string; startPos: number; endPos: number } => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return { word: '', startPos: 0, endPos: 0 };
    
    const text = element.textContent || '';
    
    // Get cursor position more reliably
    let cursorPos = 0;
    try {
      const range = selection.getRangeAt(0);
      
      // Walk through text nodes to find actual cursor position
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let textNode;
      let offset = 0;
      
      while (textNode = walker.nextNode()) {
        if (textNode === range.startContainer) {
          cursorPos = offset + range.startOffset;
          break;
        }
        offset += textNode.textContent?.length || 0;
      }
      
      // Fallback to range offset if walker fails
      if (textNode === null) {
        cursorPos = range.startOffset;
      }
    } catch (e) {
      cursorPos = 0;
    }
    
    // Find word boundaries
    let startPos = cursorPos;
    let endPos = cursorPos;
    
    // Go backwards to find start of word
    while (startPos > 0 && /[a-zA-Z_0-9]/.test(text[startPos - 1])) {
      startPos--;
    }
    
    // Go forwards to find end of word (but not past cursor for autocomplete)
    while (endPos < cursorPos && /[a-zA-Z_0-9]/.test(text[endPos])) {
      endPos++;
    }
    
    const word = text.substring(startPos, endPos);
    
    return {
      word,
      startPos,
      endPos
    };
  }, []);

  // Update autocomplete suggestions
  const updateAutocomplete = useCallback((word: string, element: HTMLDivElement) => {
    // Show autocomplete for any non-empty word
    if (word.length === 0) {
      setShowAutocomplete(false);
      return;
    }
    
    // Filter keywords that start with the typed word (case insensitive)
    const filtered = sqlKeywords.filter(keyword => 
      keyword.toLowerCase().startsWith(word.toLowerCase())
    );
    
    // Debug logging
    console.log('Autocomplete debug:', { word, filtered: filtered.slice(0, 5) });
    
    if (filtered.length > 0) {
      setFilteredSuggestions(filtered.slice(0, 10)); // Limit to 10 suggestions
      setSelectedSuggestion(0);
      setCurrentWord(word);
      
      // Calculate position for dropdown
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const editorRect = element.getBoundingClientRect();
          
          setAutocompletePosition({
            top: rect.bottom - editorRect.top + 5,
            left: rect.left - editorRect.left
          });
        } catch (e) {
          // Fallback position
          setAutocompletePosition({ top: 25, left: 0 });
        }
      }
      
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
  }, [sqlKeywords]);

  // Apply syntax highlighting to a word
  const highlightCurrentWord = useCallback((element: HTMLDivElement) => {
    const text = element.textContent || '';
    const colorized = colorizeText(text);
    
    // Save cursor position
    const selection = window.getSelection();
    const cursorPos = selection?.rangeCount ? selection.getRangeAt(0).startOffset : 0;
    
    element.innerHTML = colorized;
    
    // Restore cursor position
    if (selection && element.firstChild) {
      try {
        const range = document.createRange();
        const textNode = element.firstChild;
        range.setStart(textNode, Math.min(cursorPos, textNode.textContent?.length || 0));
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (error) {
        // Place cursor at end if restoration fails
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [colorizeText]);

  // Handle contenteditable input with real-time highlighting and autocomplete
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const text = target.textContent || '';
    onChange(text);
    
    // Get current word for autocomplete
    const { word } = getCurrentWord(target);
    updateAutocomplete(word, target);
  }, [onChange, getCurrentWord, updateAutocomplete]);

  // Insert suggestion at current position
  const insertSuggestion = useCallback((suggestion: string) => {
    if (!editorRef.current) return;
    
    const { word, startPos, endPos } = getCurrentWord(editorRef.current);
    const text = editorRef.current.textContent || '';
    const newText = text.substring(0, startPos) + suggestion + text.substring(endPos);
    
    // Update the text content
    editorRef.current.textContent = newText;
    onChange(newText);
    
    // Position cursor after the inserted suggestion
    const selection = window.getSelection();
    if (selection && editorRef.current.firstChild) {
      const range = document.createRange();
      const newCursorPos = startPos + suggestion.length;
      range.setStart(editorRef.current.firstChild, Math.min(newCursorPos, newText.length));
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    setShowAutocomplete(false);
    
    // Apply highlighting after insertion
    setTimeout(() => {
      if (editorRef.current) {
        highlightCurrentWord(editorRef.current);
      }
    }, 0);
  }, [getCurrentWord, onChange, highlightCurrentWord]);

  // Handle keyboard shortcuts and autocomplete navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle autocomplete navigation
    if (showAutocomplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(prev => Math.max(prev - 1, 0));
        return;
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredSuggestions[selectedSuggestion]) {
          insertSuggestion(filteredSuggestions[selectedSuggestion]);
        }
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowAutocomplete(false);
        return;
      }
    }
    
    // Handle regular editor shortcuts
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '  ');
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (onExecute) {
        onExecute();
      }
    } else if (e.key === ' ') {
      // Apply highlighting when space is pressed (word completion)
      setTimeout(() => {
        if (editorRef.current) {
          highlightCurrentWord(editorRef.current);
        }
      }, 0);
    }
  }, [showAutocomplete, filteredSuggestions, selectedSuggestion, insertSuggestion, onExecute, highlightCurrentWord]);

  // Update content when value changes from external source
  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      if (value) {
        const colorized = colorizeText(value);
        editorRef.current.innerHTML = colorized;
      } else if (placeholder) {
        editorRef.current.innerHTML = `<span style="color: ${tokenColors.comment}; font-style: italic;">${placeholder}</span>`;
      } else {
        editorRef.current.innerHTML = '';
      }
    }
  }, [value, colorizeText, placeholder, tokenColors.comment]);

  // Handle focus/blur for placeholder and highlighting
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (editorRef.current && !value) {
      editorRef.current.innerHTML = '';
    }
  }, [value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (editorRef.current) {
      const text = editorRef.current.textContent || '';
      if (text) {
        // Apply syntax highlighting when user finishes editing
        const colorized = colorizeText(text);
        editorRef.current.innerHTML = colorized;
      } else if (placeholder) {
        editorRef.current.innerHTML = `<span style="color: ${tokenColors.comment}; font-style: italic;">${placeholder}</span>`;
      }
    }
  }, [colorizeText, placeholder, tokenColors.comment]);

  return (
    <div className={`relative ${className || ''}`}>
      <style>{`
        .codemirror-sql-editor {
          font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace;
          font-size: 14px;
          line-height: 1.6;
          letter-spacing: 0.025em;
          width: 100%;
          height: 100%;
          padding: 12px;
          margin: 0;
          border: none;
          outline: none;
          box-sizing: border-box;
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
          
          /* Comprehensive Dark Theme */
          background-color: ${tokenColors.background};
          color: ${tokenColors.default};
          caret-color: ${tokenColors.default};
        }
        
        .codemirror-sql-editor:empty:before {
          content: attr(data-placeholder);
          color: ${tokenColors.comment};
          font-style: italic;
          pointer-events: none;
        }
        
        .codemirror-sql-editor::selection {
          background-color: #073642;
        }
        
        .codemirror-sql-editor:focus {
          outline: none;
        }
        
        .autocomplete-dropdown {
          position: absolute;
          background: #1a1a1a;
          border: 1px solid #444;
          border-radius: 4px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace;
          font-size: 12px;
        }
        
        .autocomplete-item {
          padding: 8px 12px;
          cursor: pointer;
          color: #d4d4d4;
          border-bottom: 1px solid #333;
        }
        
        .autocomplete-item:last-child {
          border-bottom: none;
        }
        
        .autocomplete-item:hover,
        .autocomplete-item.selected {
          background: #264f78;
          color: #ffffff;
        }
        
        .autocomplete-item.selected {
          background: #0e639c;
        }
      `}</style>
      
      <div
        ref={editorRef}
        className="codemirror-sql-editor"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        data-placeholder={placeholder}
        spellCheck={false}
      />
      
      {/* Autocomplete dropdown */}
      {showAutocomplete && (
        <div 
          className="autocomplete-dropdown"
          style={{
            top: autocompletePosition.top,
            left: autocompletePosition.left
          }}
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={`autocomplete-item ${index === selectedSuggestion ? 'selected' : ''}`}
              onClick={() => insertSuggestion(suggestion)}
              onMouseEnter={() => setSelectedSuggestion(index)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}