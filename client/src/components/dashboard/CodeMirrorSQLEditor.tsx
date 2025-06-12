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
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [currentWord, setCurrentWord] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [lineCount, setLineCount] = useState(1);

  // Snowflake database schema from the provided data
  const snowflakeSchema: Record<string, Record<string, Record<string, string[]>>> = {
    "DATA_LAKE": {
      "DATA_PLATFORM_METRICS": {
        "DATA_VOLUME": ["DATE", "TABLE_CATALOG", "TABLE_SCHEMA", "TABLE_NAME", "SIZE", "PREV_SIZE", "DELTA_SIZE", "RECORDS", "PREV_ROWS_COUNT", "DELTA_ROWS_COUNT"]
      },
      "DYNAMODB": {
        "DEVICE_USER_ADV_VIEWS": ["DEVICE_ID", "USER_ADV_ID", "DATE_VIEWED", "IS_DELETED", "SYNCED", "PK_DEVICE_ADV_DATE"],
        "DEV_DEVICE_USER_ADV_VIEWS": ["DEVICE_ID", "USER_ADV_ID", "DATE_VIEWED", "IS_DELETED", "SYNCED", "PK_DEVICE_ADV_DATE"],
        "STAGING_DEVICE_USER_ADV_VIEWS": ["DEVICE_ID", "USER_ADV_ID", "DATE_VIEWED", "IS_DELETED", "SYNCED"],
        "USER_ADV_VIEWS_HOUR": ["DATE", "USER_ADV_ID", "COUNT"]
      },
      "INFORMATION_SCHEMA": {}
    },
    "DBT_CORE_PROD_DATABASE": {
      "DATA_MART": {
        "DOM_LEVEL_1_SI": ["LEVEL_1", "EN_NAME", "FULL_PATH", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7", "Day 8", "Day 9", "Day 10", "Day 11", "Day 12", "Day 13", "Day 14", "Day 15", "Day 16", "Day 17", "Day 18", "Day 19", "Day 20", "Day 21", "Day 22", "Day 23", "Day 24", "Day 25", "Day 26", "Day 27", "Day 28", "Day 29", "Day 30", "Day 31"],
        "DOM_VERTICAL_SI": ["VERTICAL_NAME", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7", "Day 8", "Day 9", "Day 10", "Day 11", "Day 12", "Day 13", "Day 14", "Day 15", "Day 16", "Day 17", "Day 18", "Day 19", "Day 20", "Day 21", "Day 22", "Day 23", "Day 24", "Day 25", "Day 26", "Day 27", "Day 28", "Day 29", "Day 30", "Day 31"],
        "OFFICES_STATS_REPORT": ["USER_ADV_ID", "USER_ID", "DATE_PUBLISHED", "SOURCE_TABLE", "CAT_ID", "SOURCE", "ASKING_PRICE", "TITLE", "LEVEL_1", "LEVEL_3", "LEVEL_4", "FIRST_NAME_FIXED", "LAST_NAME_FIXED", "USER_TYPE", "TOTAL_VIEWS", "MILLAGE", "PHONECALL", "CALLICON", "WHATSAPPCALL", "CHAT", "CALL", "PHONE", "WHATSAPPICON", "ENQUIRENOW", "EXTERNALURL", "TESTDRIVE"]
      },
      "OPERATIONS": {
        "USER_SEGMENTATION_PROJECT_V4": ["USER_ADV_ID", "USER_ID", "DATE_CREATED", "VERTICAL", "LEVEL_1", "LEVEL_2", "LEVEL_3", "LEVEL_4", "TOTAL_LISTINGS_COUNT", "ACTIVE_LISTINGS_COUNT", "EXPIRED_LISTINGS_COUNT", "DELETED_LISTINGS_COUNT", "TOTAL_VIEWS", "TOTAL_CTAS", "PHONE_CALL_CTAS", "WHATSAPP_CTAS", "CHAT_CTAS", "AVG_VIEWS_PER_LISTING", "AVG_CTAS_PER_LISTING", "CONVERSION_RATE"],
        "AGGREGATED_LOSSES": ["DATE_MONTH", "VERTICAL", "LEVEL_1", "PLAN_NAME", "TOTAL_LOSSES"],
        "BUNDLES_COST": ["category_id", "bundle_id", "bundle_name", "views", "price", "description", "next_page", "is_free", "extend_period", "recommended", "badge", "visibility_link", "features", "addons", "plan_base_price", "Vertical", "Category", "Date"],
        "BUNDLES_PRICE": ["category_id", "plan_id", "name", "views", "price", "description", "next_page", "is_free", "extend_period", "recommended", "badge", "visibility_link", "features", "refreshes", "addons", "plan_base_price", "Vertical", "Category", "Date"],
        "CARS_LISTINGS_PROJECTION": ["USER_ADV_ID", "BRAND_ID", "MODEL_ID", "MAN_YEAR", "ASKING_PRICE", "FULL_PATH", "CAT_NAME", "count", "lower_bound", "average_price", "upper_bound", "percentile_10", "percentile_30", "percentile_60", "percentile_90", "PRICING"]
      },
      "INFORMATION_SCHEMA": {}
    }
  };

  // Get all database names
  const getDatabaseNames = useCallback(() => {
    return Object.keys(snowflakeSchema);
  }, []);

  // Get schema names for a database
  const getSchemaNames = useCallback((database: string) => {
    const db = snowflakeSchema[database];
    return db ? Object.keys(db) : [];
  }, []);

  // Get table names for a database.schema
  const getTableNames = useCallback((database: string, schema: string) => {
    const db = snowflakeSchema[database];
    const schemaObj = db?.[schema];
    return schemaObj ? Object.keys(schemaObj) : [];
  }, []);

  // Get column names for a database.schema.table
  const getColumnNames = useCallback((database: string, schema: string, table: string) => {
    const db = snowflakeSchema[database];
    const schemaObj = db?.[schema];
    const tableObj = schemaObj?.[table];
    return tableObj || [];
  }, []);

  // Analyze query context to determine what type of suggestions to show
  const analyzeContext = useCallback((text: string, cursorPos: number): {
    type: 'keyword' | 'database' | 'schema' | 'table' | 'column';
    database?: string;
    schema?: string;
    table?: string;
  } => {
    const textBeforeCursor = text.substring(0, cursorPos).toUpperCase();
    
    // Check if we're after FROM, JOIN, UPDATE, INTO, etc. - suggest tables
    if (/\b(FROM|JOIN|UPDATE|INTO)\s+[A-Z_]*\.?[A-Z_]*\.?[A-Z_]*$/i.test(textBeforeCursor)) {
      const parts = textBeforeCursor.split(/\s+/).pop()?.split('.');
      if (parts && parts.length === 1) {
        return { type: 'database' };
      } else if (parts && parts.length === 2) {
        return { type: 'schema', database: parts[0] };
      } else if (parts && parts.length === 3) {
        return { type: 'table', database: parts[0], schema: parts[1] };
      }
      return { type: 'table' };
    }
    
    // Check if we're in SELECT, WHERE, ORDER BY, GROUP BY - suggest columns or keywords
    if (/\b(SELECT|WHERE|ORDER\s+BY|GROUP\s+BY)\s+[A-Z_]*$/i.test(textBeforeCursor)) {
      // Try to find table context from FROM clause
      const fromMatch = text.match(/\bFROM\s+([A-Z_]+(?:\.[A-Z_]+)?(?:\.[A-Z_]+)?)/i);
      if (fromMatch) {
        const tableParts = fromMatch[1].split('.');
        if (tableParts.length === 3) {
          return { type: 'column', database: tableParts[0], schema: tableParts[1], table: tableParts[2] };
        } else if (tableParts.length === 2) {
          return { type: 'column', schema: tableParts[0], table: tableParts[1] };
        } else {
          return { type: 'column', table: tableParts[0] };
        }
      }
      return { type: 'keyword' };
    }
    
    // Check if we're typing a qualified name with dots
    const wordParts = textBeforeCursor.split(/\s+/).pop()?.split('.');
    if (wordParts && wordParts.length > 1) {
      if (wordParts.length === 2) {
        return { type: 'schema', database: wordParts[0] };
      } else if (wordParts.length === 3) {
        return { type: 'table', database: wordParts[0], schema: wordParts[1] };
      } else if (wordParts.length === 4) {
        return { type: 'column', database: wordParts[0], schema: wordParts[1], table: wordParts[2] };
      }
    }
    
    return { type: 'keyword' };
  }, []);

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

  // Update autocomplete suggestions with context awareness
  const updateAutocomplete = useCallback((word: string, element: HTMLDivElement) => {
    
    const text = element.textContent || '';
    const selection = window.getSelection();
    let cursorPos = 0;
    
    // Get cursor position
    if (selection && selection.rangeCount > 0) {
      try {
        const range = selection.getRangeAt(0);
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT
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
      } catch (e) {
        cursorPos = text.length;
      }
    }
    
    // Analyze context to determine what type of suggestions to show
    const context = analyzeContext(text, cursorPos);
    let suggestions: string[] = [];
    
    // Handle dot-triggered autocomplete
    const lastChar = text[cursorPos - 1];
    if (lastChar === '.' || word.length === 0) {
      // After a dot, determine what to suggest based on context
      const textBeforeDot = text.substring(0, cursorPos - 1);
      const parts = textBeforeDot.split(/\s+/).pop()?.split('.');
      
      if (parts && parts.length >= 1) {
        const database = parts[0];
        const schema = parts[1];
        
        if (parts.length === 1) {
          // database. - suggest schemas
          suggestions = getSchemaNames(database);
        } else if (parts.length === 2) {
          // database.schema. - suggest tables
          suggestions = getTableNames(database, schema);
        } else if (parts.length === 3) {
          // database.schema.table. - suggest columns
          const table = parts[2];
          suggestions = getColumnNames(database, schema, table);
        }
      }
    } else {
      // Regular word-based suggestions
      switch (context.type) {
        case 'database':
          suggestions = getDatabaseNames().filter(db => 
            db.toLowerCase().startsWith(word.toLowerCase())
          );
          break;
          
        case 'schema':
          if (context.database) {
            suggestions = getSchemaNames(context.database).filter(schema => 
              schema.toLowerCase().startsWith(word.toLowerCase())
            );
          }
          break;
          
        case 'table':
          if (context.database && context.schema) {
            suggestions = getTableNames(context.database, context.schema).filter(table => 
              table.toLowerCase().startsWith(word.toLowerCase())
            );
          } else {
            // Show all tables from all schemas if no specific database/schema context
            const allTables: string[] = [];
            Object.values(snowflakeSchema).forEach(db => {
              Object.values(db).forEach(schema => {
                if (typeof schema === 'object') {
                  allTables.push(...Object.keys(schema));
                }
              });
            });
            const uniqueTables = allTables.filter((table, index, arr) => 
              arr.indexOf(table) === index
            );
            suggestions = uniqueTables.filter(table => 
              table.toLowerCase().startsWith(word.toLowerCase())
            );
          }
          break;
          
        case 'column':
          if (context.database && context.schema && context.table) {
            suggestions = getColumnNames(context.database, context.schema, context.table).filter(column => 
              column.toLowerCase().startsWith(word.toLowerCase())
            );
          } else {
            // Show common columns if no specific table context
            const allColumns: string[] = [];
            Object.values(snowflakeSchema).forEach(db => {
              Object.values(db).forEach(schema => {
                if (typeof schema === 'object') {
                  Object.values(schema).forEach(table => {
                    if (Array.isArray(table)) {
                      allColumns.push(...table);
                    }
                  });
                }
              });
            });
            const uniqueColumns = allColumns.filter((column, index, arr) => 
              arr.indexOf(column) === index
            );
            suggestions = uniqueColumns.filter((column: string) => 
              column.toLowerCase().startsWith(word.toLowerCase())
            ).slice(0, 20); // Limit common columns
          }
          break;
          
        default:
          // Default to SQL keywords
          suggestions = sqlKeywords.filter(keyword => 
            keyword.toLowerCase().startsWith(word.toLowerCase())
          );
          break;
      }
    }
    
    // Debug logging
    console.log('Autocomplete context:', { word, context, suggestionsCount: suggestions.length, suggestions: suggestions.slice(0, 5) });
    
    if (suggestions.length > 0) {
      setFilteredSuggestions(suggestions.slice(0, 15)); // Limit to 15 suggestions
      setSelectedSuggestion(0);
      setCurrentWord(word);
      
      // Calculate position for dropdown
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
          setAutocompletePosition({ top: 25, left: 0 });
        }
      }
      
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
  }, [sqlKeywords, analyzeContext, getDatabaseNames, getSchemaNames, getTableNames, getColumnNames, snowflakeSchema]);

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

  // Update line numbers based on content
  const updateLineNumbers = useCallback((text: string) => {
    const lines = text.split('\n').length;
    setLineCount(lines);
    
    if (lineNumbersRef.current) {
      const lineNumbers = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
      lineNumbersRef.current.textContent = lineNumbers;
    }
  }, []);

  // Handle contenteditable input with real-time highlighting and autocomplete
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const text = target.textContent || '';
    onChange(text);
    
    // Update line numbers
    updateLineNumbers(text);
    
    // Get current word for autocomplete
    const { word } = getCurrentWord(target);
    
    // Check if user just typed a dot - trigger schema/table/column suggestions
    const lastChar = text[text.length - 1];
    if (lastChar === '.') {
      // Force update autocomplete with empty word to trigger context analysis
      updateAutocomplete('', target);
    } else {
      updateAutocomplete(word, target);
    }
  }, [onChange, getCurrentWord, updateAutocomplete, updateLineNumbers]);

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
    } else if (e.key === 'Enter') {
      // Handle Enter key for line breaks
      e.preventDefault();
      
      // Insert a newline character
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        // Insert a newline text node
        const newline = document.createTextNode('\n');
        range.insertNode(newline);
        
        // Position cursor after the newline
        range.setStartAfter(newline);
        range.setEndAfter(newline);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Trigger input event to update state and line numbers
        const inputEvent = new Event('input', { bubbles: true });
        editorRef.current?.dispatchEvent(inputEvent);
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
        updateLineNumbers(value);
      } else if (placeholder) {
        editorRef.current.innerHTML = `<span style="color: ${tokenColors.comment}; font-style: italic;">${placeholder}</span>`;
        updateLineNumbers('');
      } else {
        editorRef.current.innerHTML = '';
        updateLineNumbers('');
      }
    }
  }, [value, colorizeText, placeholder, tokenColors.comment, updateLineNumbers]);

  // Initialize line numbers on mount
  useEffect(() => {
    updateLineNumbers(value || '');
  }, [updateLineNumbers, value]);

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
    <div className={`relative ${className || ''}`} style={{ backgroundColor: tokenColors.background }}>
      <style>{`
        .sql-editor-container {
          display: flex;
          background-color: ${tokenColors.background};
          border-radius: 6px;
          overflow: hidden;
          min-height: 150px;
          resize: vertical;
          border: 1px solid #374151;
        }
        
        .line-numbers {
          background-color: ${tokenColors.background};
          color: ${tokenColors.comment};
          padding: 12px 8px;
          font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace;
          font-size: 14px;
          line-height: 1.6;
          text-align: right;
          min-width: 50px;
          user-select: none;
          border-right: 1px solid #073642;
          white-space: pre;
          overflow: hidden;
        }
        
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
          overflow-y: auto;
          resize: none;
          
          /* Comprehensive Dark Theme - Full Background */
          background-color: ${tokenColors.background} !important;
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
      
      <div className="sql-editor-container">
        {/* Line numbers */}
        <div ref={lineNumbersRef} className="line-numbers">
          1
        </div>
        
        {/* Editor content */}
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
      </div>
      
      {/* Autocomplete dropdown */}
      {showAutocomplete && (
        <div 
          className="autocomplete-dropdown"
          style={{
            top: autocompletePosition.top,
            left: autocompletePosition.left + 50 // Offset for line numbers
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