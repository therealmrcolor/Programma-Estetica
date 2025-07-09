document.addEventListener('DOMContentLoaded', function() {
    loadSequenceItems();
    setupModal(); // This will use the global setupModal, editItem, updateItem, deleteItem from script.js if not redefined here
});

// setupModal is defined in script.js and is global, so it can be reused
// editItem is defined in script.js and is global
// updateItem is defined in script.js and is global
// deleteItem is defined in script.js and is global


async function loadSequenceItems() {
    try {
        // sequenceNum is global, defined in sequence.html
        const response = await fetch(`/api/get_items/${sequenceNum}`); 
        if (!response.ok) {
            console.error("Failed to load sequence items, status:", response.status);
            const errorData = await response.json().catch(() => ({error: "Errore generico"}));
            document.getElementById('sequenceItems').innerHTML = `<p>Errore nel caricamento: ${errorData.error || response.statusText}</p>`;
            return;
        }
        const items = await response.json();
        const sequenceItemsEl = document.getElementById('sequenceItems'); // Renamed variable

        if (!items || items.length === 0) {
            sequenceItemsEl.innerHTML = "<p>Nessun elemento in questa sequenza.</p>";
            updateColorsRecap([]); // Update colors recap with empty array
            return;
        }
        
        const escapeForHtmlAttr = (jsonString) => jsonString.replace(/'/g, "'");

        sequenceItemsEl.innerHTML = items.map(item => `
            <div id="color-${encodeURIComponent(item.colore)}" class="sequence-item ${item.reintegro === 'Si' ? 'item-reintegro' : ''} ${item.ricambi === 'Si' ? 'item-ricambi' : ''}">
                <div class="item-actions">
                    <button class="edit-btn" onclick='editItem(${escapeForHtmlAttr(JSON.stringify(item))})'>✎</button>
                    <button class="delete-btn" onclick="deleteItem(${sequenceNum}, ${item.id})">×</button>
                </div>
                <div class="item-info">
                    <span><span class="info-label">Colore:</span> <span class="info-value">${item.colore}</span></span>
                    <span><span class="info-label">Pronto:</span> <span class="info-value">${item.pronto}</span></span>
                    ${item.reintegro === 'Si' ? '<span class="reintegro-badge">REINTEGRO</span>' : ''}
                    ${item.ricambi === 'Si' ? '<span class="ricambi-badge">RICAMBI</span>' : ''}
                </div>
                <div class="item-grid">
                    <div class="row-header"></div>
                    <div class="ub-header">UB 1</div>
                    <div class="ub-header">UB 2</div>
                    <div class="ub-header">UB 3</div>
                    <div class="ub-header">UB 4</div>
                    <div class="ub-header">UB 5</div>

                    <div class="row-header">Carretti Vert</div>
                    ${(item.carretti_vert || []).map(val => `<div>${val || ''}</div>`).join('')}

                    <div class="row-header">Tavoli</div>
                    ${(item.tavoli || []).map(val => `<div>${val || ''}</div>`).join('')}

                    <div class="row-header">Pedane</div>
                    ${(item.pedane || []).map(val => `<div>${val || ''}</div>`).join('')}

                    <div class="row-header">Contenitori</div>
                    ${(item.contenitori || []).map(val => `<div>${val || ''}</div>`).join('')}

                    <div class="row-header">Spalle</div>
                    ${(item.spalle || []).map(val => `<div>${val || ''}</div>`).join('')}
                </div>
                ${item.note ? `<div class="item-note"><span class="info-label">Note:</span> <span class="info-value">${item.note}</span></div>` : ''}
                <div class="item-timestamp">Creato: ${new Date(item.timestamp).toLocaleString('it-IT')}</div>
            </div>
        `).join('');

        // Update colors recap
        updateColorsRecap(items);
        
        // Handle URL hash to scroll to specific color
        handleColorHash();
    } catch (error) {
        console.error('Error loading sequence items:', error);
        document.getElementById('sequenceItems').innerHTML = "<p>Errore critico nel caricamento degli elementi della sequenza.</p>";
        updateColorsRecap([]); // Update colors recap with empty array on error
    }
}

function updateColorsRecap(items) {
    const colorsListEl = document.getElementById('colorsList');
    
    // Always start with the header
    let html = `
        <div class="colors-header">
            <div class="colors-header-item">Colore</div>
            <div class="colors-header-item">Qty</div>
        </div>
    `;
    
    if (!items || items.length === 0) {
        html += `
            <div class="colors-empty">
                <div>Nessun colore presente</div>
            </div>
        `;
        colorsListEl.innerHTML = html;
        return;
    }

    // Count colors by occupied cells
    const colorCounts = {};
    items.forEach(item => {
        if (item.colore && item.colore.trim()) {
            const color = item.colore.trim().toUpperCase();
            
            // Count occupied cells for this item
            let occupiedCells = 0;
            const cellTypes = ['carretti_vert', 'tavoli', 'pedane', 'contenitori', 'spalle'];
            
            cellTypes.forEach(cellType => {
                if (item[cellType] && Array.isArray(item[cellType])) {
                    item[cellType].forEach(cellValue => {
                        if (cellValue && String(cellValue).trim()) {
                            occupiedCells++;
                        }
                    });
                }
            });
            
            // Add occupied cells to the color count
            colorCounts[color] = (colorCounts[color] || 0) + occupiedCells;
        }
    });

    // Sort colors alphabetically
    const sortedColors = Object.keys(colorCounts).sort();

    if (sortedColors.length === 0) {
        html += `
            <div class="colors-empty">
                <div>Nessun colore presente</div>
            </div>
        `;
        colorsListEl.innerHTML = html;
        return;
    }

    // Generate table rows
    html += sortedColors.map(color => `
        <div class="color-row">
            <div class="color-item"><a href="#color-${encodeURIComponent(color)}" onclick="scrollToColor('${color}')">${color}</a></div>
            <div class="color-count">${colorCounts[color]}</div>
        </div>
    `).join('');

    colorsListEl.innerHTML = html;
}
window.loadSequenceItems = loadSequenceItems; // Make global for calls from updateItem/deleteItem


// This function is specific to sequence pages
async function clearSequence(sequence) {
    if (confirm('Sei sicuro di voler eliminare tutti gli elementi di questa sequenza?')) {
        try {
            const response = await fetch(`/api/clear_sequence/${sequence}`, {
                method: 'DELETE'
            });
            const result = await response.json().catch(() => null);

            if (response.ok && result && result.success) {
                loadSequenceItems(); // This will also update the colors recap
            } else {
                const errorMsg = result ? result.error : 'Errore durante la pulizia della sequenza';
                alert(errorMsg);
                console.error('Error clearing sequence:', result);
            }
        } catch (error) {
            console.error('Error in clearSequence fetch:', error);
            alert('Errore di comunicazione durante la pulizia della sequenza.');
        }
    }
}
window.clearSequence = clearSequence; // Make global for onclick

// Function to handle URL hash and scroll to specific color
function handleColorHash() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#color-')) {
        // Wait a bit for the DOM to be fully rendered
        setTimeout(() => {
            const targetElement = document.querySelector(hash);
            if (targetElement) {
                // Add a highlight effect
                targetElement.style.transition = 'all 0.3s ease';
                targetElement.style.boxShadow = '0 0 20px rgba(0, 123, 255, 0.5)';
                targetElement.style.transform = 'scale(1.02)';
                
                // Scroll to the element with some offset
                const yOffset = -20;
                const y = targetElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({top: y, behavior: 'smooth'});
                
                // Remove highlight after a few seconds
                setTimeout(() => {
                    targetElement.style.boxShadow = '';
                    targetElement.style.transform = '';
                }, 3000);
            }
        }, 100);
    }
}

// Function to scroll to a specific color in the current page
function scrollToColor(color) {
    const encodedColor = encodeURIComponent(color);
    const targetElement = document.querySelector(`#color-${encodedColor}`);
    
    if (targetElement) {
        // Add a highlight effect
        targetElement.style.transition = 'all 0.3s ease';
        targetElement.style.boxShadow = '0 0 20px rgba(0, 123, 255, 0.5)';
        targetElement.style.transform = 'scale(1.02)';
        
        // Scroll to the element with some offset
        const yOffset = -20;
        const y = targetElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({top: y, behavior: 'smooth'});
        
        // Remove highlight after a few seconds
        setTimeout(() => {
            targetElement.style.boxShadow = '';
            targetElement.style.transform = '';
        }, 3000);
    }
    
    // Prevent default link behavior since we're handling it manually
    return false;
}

// Funzione per copiare i colori nella clipboard (specifica per le pagine sequenza)
async function copyColorsToClipboard() {
    const copyBtn = document.getElementById('copyColorsBtn');
    
    try {
        copyBtn.disabled = true;
        copyBtn.textContent = '📋 Copiando...';
        
        let colors = [];
        
        // Estrai colori dal recap della sequenza
        const sequenceColorsEl = document.getElementById('colorsList');
        if (sequenceColorsEl) {
            const colorRows = sequenceColorsEl.querySelectorAll('.color-row');
            colorRows.forEach(row => {
                const colorElement = row.querySelector('.color-item');
                if (colorElement) {
                    const colorText = colorElement.textContent.trim();
                    if (colorText && !colors.includes(colorText)) {
                        colors.push(colorText);
                    }
                }
            });
        }
        
        if (colors.length === 0) {
            throw new Error('Nessun colore da copiare');
        }
        
        // Copia nella clipboard
        const colorsText = colors.join('\n');
        await navigator.clipboard.writeText(colorsText);
        
        // Feedback visuale
        copyBtn.textContent = '✅ Copiato!';
        setTimeout(() => {
            copyBtn.textContent = '📋 Copia Colori';
            copyBtn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('Errore durante la copia:', error);
        copyBtn.textContent = '❌ Errore';
        setTimeout(() => {
            copyBtn.textContent = '📋 Copia Colori';
            copyBtn.disabled = false;
        }, 2000);
    }
}

// Rende la funzione globale per l'uso negli onclick HTML
window.copyColorsToClipboard = copyColorsToClipboard;