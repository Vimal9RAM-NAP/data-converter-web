function autoDetectFormat(str) {
    const trimmed = str.trim();
    if (!trimmed) return 'json';
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        return 'json';
    }
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
        return 'xml';
    }
    if (trimmed.includes(':') && !trimmed.includes(',')) {
        return 'yaml';
    }
    if (trimmed.includes(',')) {
        return 'csv';
    }
    return 'json';
}

function parseCSV(text, delimiter = ',') {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"(.*)"$/, '$1'));
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const currentline = lines[i].split(delimiter).map(cell => cell.trim().replace(/^"(.*)"$/, '$1'));
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = currentline[index] || '';
        });
        result.push(obj);
    }
    return result;
}

function jsonToCSV(jsonObj) {
    const array = Array.isArray(jsonObj) ? jsonObj : [jsonObj];
    if (array.length === 0) return '';

    const headers = Object.keys(array[0]);
    const csvRows = [headers.join(',')];

    for (const row of array) {
        const values = headers.map(header => {
            const val = row[header] === undefined ? '' : row[header];
            return `"${String(val).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
}

function jsonToSQL(jsonObj, tableName) {
    const array = Array.isArray(jsonObj) ? jsonObj : [jsonObj];
    if (array.length === 0) return '';

    const headers = Object.keys(array[0]);
    const columns = headers.join(', ');

    const statements = array.map(row => {
        const values = headers.map(h => {
            const val = row[h];
            if (typeof val === 'number') return val;
            return `'${String(val).replace(/'/g, "''")}'`;
        }).join(', ');
        return `INSERT INTO ${tableName} (${columns}) VALUES (${values});`;
    });

    return statements.join('\n');
}

function jsonToMarkdown(jsonObj) {
    const array = Array.isArray(jsonObj) ? jsonObj : [jsonObj];
    if (array.length === 0) return '';

    const headers = Object.keys(array[0]);
    const headerRow = `| ${headers.join(' | ')} |`;
    const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;

    const rows = array.map(row => {
        const values = headers.map(h => row[h] === undefined ? '' : row[h]);
        return `| ${values.join(' | ')} |`;
    });

    return [headerRow, separatorRow, ...rows].join('\n');
}

function processConversion() {
    const rawInput = document.getElementById('data-input').value;
    const outputArea = document.getElementById('data-output');
    const errorBanner = document.getElementById('error-banner');
    
    if (!rawInput.trim()) {
        outputArea.value = '';
        errorBanner.classList.add('hidden');
        setStatus('Ready', 'zinc');
        return;
    }

    let srcFmt = document.getElementById('source-format').value;
    const tgtFmt = document.getElementById('target-format').value;
    const indentVal = document.getElementById('indent-size').value;
    const sqlTable = document.getElementById('sql-table').value || 'data_table';

    if (srcFmt === 'auto') {
        srcFmt = autoDetectFormat(rawInput);
    }

    try {
        let parsedData = null;

        
        if (srcFmt === 'json') {
            parsedData = JSON.parse(rawInput);
        } else if (srcFmt === 'csv') {
            parsedData = parseCSV(rawInput, ',');
        } else if (srcFmt === 'tsv') {
            parsedData = parseCSV(rawInput, '\t');
        } else if (srcFmt === 'yaml') {
            parsedData = jsyaml.load(rawInput);
        } else {
            parsedData = JSON.parse(rawInput);
        }

        
        let resultString = '';
        const spaces = indentVal === 'min' ? 0 : parseInt(indentVal, 10);

        if (tgtFmt === 'json') {
            resultString = JSON.stringify(parsedData, null, spaces);
        } else if (tgtFmt === 'csv') {
            resultString = jsonToCSV(parsedData);
        } else if (tgtFmt === 'yaml') {
            resultString = jsyaml.dump(parsedData);
        } else if (tgtFmt === 'sql') {
            resultString = jsonToSQL(parsedData, sqlTable);
        } else if (tgtFmt === 'markdown') {
            resultString = jsonToMarkdown(parsedData);
        }

        outputArea.value = resultString;
        errorBanner.classList.add('hidden');
        setStatus('Converted', 'orange');

    } catch (err) {
        errorBanner.classList.remove('hidden');
        errorBanner.innerText = `Syntax Error (${srcFmt.toUpperCase()}): ${err.message}`;
        setStatus('Error', 'red');
    }
}

function downloadOutput() {
    const outputText = document.getElementById('data-output').value;
    if (!outputText) {
        alert('No converted output to download!');
        return;
    }

    const tgtFmt = document.getElementById('target-format').value;
    const extMap = { json: 'json', csv: 'csv', yaml: 'yaml', xml: 'xml', sql: 'sql', markdown: 'md' };
    const ext = extMap[tgtFmt] || 'txt';

    const blob = new Blob([outputText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `data_export_${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}