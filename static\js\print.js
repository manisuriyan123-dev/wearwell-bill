// Bill printing functionality
async function printBill(orderNumber) {
    try {
        // Read selected billing style from localStorage (default 'thermal')
        const selectedStyle = localStorage.getItem('billingStyle') || 'thermal';
        const response = await API.printBill(orderNumber, selectedStyle);
        
        // Determine font size for printing
        const fontSize = (typeof window.getBillFontSize === 'function') ? window.getBillFontSize() : '10px';

        // If server returned A4 HTML, open that directly
        if (response && response.bill_html) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(response.bill_html);
            printWindow.document.close();
            setTimeout(() => { printWindow.print(); }, 250);
            return;
        }

        // Create a new window for printing (legacy thermal/plain text)
        const printWindow = window.open('', '_blank');
        // sanitize bill content to remove unwanted characters
        const cleanedBill = sanitizeBillContent(response.bill_content);

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bill ${orderNumber}</title>
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        font-size: ${fontSize};
                        width: 80mm;
                        margin: 0;
                        padding: 10px;
                    }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .divider { border-top: 1px dashed #000; margin: 10px 0; }
                    table { width: 100%; border-collapse: collapse; }
                    td { padding: 4px 0; }
                    .right { text-align: right; }
                </style>
            </head>
            <body>
                <pre>${escapeHtml(cleanedBill)}</pre>
            </body>
            </html>
        `);
        printWindow.document.close();
        
        // Wait for content to load, then print
        setTimeout(() => {
            printWindow.print();
            // Optionally close after printing
            // printWindow.close();
        }, 250);
        
    } catch (error) {
        console.error('Print error:', error);
        alert('Error generating bill: ' + error.message);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Sanitize bill content: remove control characters and common stray symbols
function sanitizeBillContent(text) {
    if (typeof text !== 'string') return text;

    // Remove non-printable/control characters except common whitespace (tab/newline/carriage)
    let cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Remove known unwanted symbol clusters like (?,?,?,?,...) or standalone repeated symbols
    cleaned = cleaned.replace(/\(\s*[\?\.\*\^@#,\s]+\s*\)/g, '');

    // Remove remaining isolated unwanted characters: ? * ^ @ # (but keep periods that are part of numbers/amounts)
    // To avoid removing decimal points in numbers, only strip periods that are surrounded by spaces or repeated dots
    cleaned = cleaned.replace(/(?<=\s|^)\.+(?=\s|$)/g, '');
    cleaned = cleaned.replace(/[\?\*\^@#]+/g, '');

    // Collapse multiple spaces/newlines
    cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    return cleaned.trim();
}

// Bill font size helpers (persisted in localStorage)
window.setBillFontSize = function(size) {
    if (typeof size === 'number') size = `${size}px`;
    if (typeof size !== 'string') return;
    // Basic validation: must end with px, pt, or em
    if (!/(px|pt|em)$/.test(size)) size = size + 'px';
    localStorage.setItem('billFontSize', size);
};

window.getBillFontSize = function() {
    return localStorage.getItem('billFontSize') || '10px';
};

// Example usage:
// setBillFontSize('12px');
// setBillFontSize(11); // stores '11px'

// For direct ESC/POS printing (requires printer connection)
function sendToPrinter(escposContent) {
    // This would require a printer connection library
    // For now, we use the print dialog approach
    console.log('ESC/POS content:', escposContent);
}
