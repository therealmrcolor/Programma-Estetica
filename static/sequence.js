document.addEventListener('DOMContentLoaded', function() {
    loadSequenceItems();
    setupModal(); // This will use the global setupModal, editItem, updateItem, deleteItem from script.js if not redefined here
    
    // Setup Painting List functionality for the edit modal
    setupPaintingListForEditModal();
    
    // Evidenzia le sequenze attive nella barra di navigazione
    if (typeof highlightActiveSequences === 'function') {
        highlightActiveSequences();
    }
});

// Function to setup Painting List for edit modal in sequence page
function setupPaintingListForEditModal() {
    // Setup painting list for edit modal using the same approach as in script.js
    const scannerInput = document.getElementById('editPaintingListScanner');
    const hiddenInput = document.getElementById('editPaintingList');
    const tableBody = document.getElementById('editScannedCodesBody');
    const countElement = document.getElementById('editPaintingListCount');
    const clearBtn = document.getElementById('editClearPaintingList');
    
    if (!scannerInput) return; // Element might not be on the page

    scannerInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Evita il submit del form
            const code = scannerInput.value.trim();
            if (code) {
                addCodeToPaintingListLocal(code, hiddenInput, tableBody, countElement);
                scannerInput.value = '';
            }
        }
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            hiddenInput.value = '';
            window.updateScannedCodesTable(hiddenInput, tableBody, countElement);
        });
    }
}

function addCodeToPaintingListLocal(code, hiddenInput, tableBody, countElement) {
    const currentCodes = hiddenInput.value ? hiddenInput.value.split('\n') : [];
    // Evita duplicati
    if (!currentCodes.includes(code)) { 
        currentCodes.push(code);
        hiddenInput.value = currentCodes.join('\n');
        window.updateScannedCodesTable(hiddenInput, tableBody, countElement);
    }
}

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

        // Ordina gli elementi alfabeticamente per colore
        const sortedItems = items.sort((a, b) => {
            const colorA = (a.colore || '').trim().toUpperCase();
            const colorB = (b.colore || '').trim().toUpperCase();
            return colorA.localeCompare(colorB);
        });

        sequenceItemsEl.innerHTML = sortedItems.map(item => `
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
                ${item.painting_list && item.painting_list.trim() ? 
                    `<div class="painting-list-preview-static">
                        <span class="info-label">Painting List (${item.painting_list.split('\n').filter(c => c.trim()).length} codici):</span>
                        <div class="painting-codes-table-static">
                            <table>
                                <tbody>
                                    ${item.painting_list.split('\n')
                                        .filter(code => code.trim())
                                        .map((code, index) => 
                                            `<tr>
                                                <td>${index + 1}</td>
                                                <td>${code.trim()}</td>
                                            </tr>`
                                        ).join('')
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>` 
                    : ''
                }
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

    // Count colors by occupied cells and track latest timestamp for each color
    const colorCounts = {};
    const colorTimestamps = {};
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
            
            // Track the latest timestamp for this color
            const itemTimestamp = new Date(item.timestamp).getTime();
            if (!colorTimestamps[color] || itemTimestamp > colorTimestamps[color]) {
                colorTimestamps[color] = itemTimestamp;
            }
        }
    });

    // Sort colors by latest timestamp (most recent first), then alphabetically as fallback
    const sortedColors = Object.keys(colorCounts).sort((a, b) => {
        const timestampA = colorTimestamps[a] || 0;
        const timestampB = colorTimestamps[b] || 0;
        if (timestampA !== timestampB) {
            return timestampB - timestampA; // Most recent first
        }
        return a.localeCompare(b); // Alphabetical fallback
    });

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
        
        let colorData = [];
        
        // Estrai colori dal recap della sequenza e cerca gli elementi completi
        const response = await fetch(`/api/get_items/${sequenceNum}`);
        if (response.ok) {
            const items = await response.json();
            const colorMap = new Map();
            
            console.log('SEQUENCE.JS - Items received for sequence:', items);
            
            items.forEach(item => {
                const status = (item.reintegro === 'Si' || item.ricambi === 'Si') ? 'R' : 'E';
                const key = `${item.colore}-${status}`;
                
                console.log(`SEQUENCE.JS - Processing: ${item.colore}, reintegro: ${item.reintegro}, ricambi: ${item.ricambi}, status: ${status}, key: ${key}`);
                
                // Mantieni solo una riga per ogni combinazione colore-status
                if (!colorMap.has(key)) {
                    colorMap.set(key, `${item.colore},${status},${item.sequenza}`);
                    console.log(`SEQUENCE.JS - Added to map: ${key} -> ${item.colore},${status},${item.sequenza}`);
                } else {
                    console.log(`SEQUENCE.JS - Key ${key} already exists, skipping`);
                }
            });
            
            console.log('SEQUENCE.JS - Final colorMap entries:', Array.from(colorMap.entries()));
            colorData = Array.from(colorMap.values());
            console.log('SEQUENCE.JS - Final colorData:', colorData);
        }
        
        if (colorData.length === 0) {
            throw new Error('Nessun colore da copiare');
        }
        
        // Prova prima la clipboard API moderna
        const colorsText = colorData.join('\n');
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(colorsText);
                copyBtn.textContent = '✅ Copiato!';
                setTimeout(() => {
                    copyBtn.textContent = '📋 Copia Colori';
                    copyBtn.disabled = false;
                }, 2000);
                return;
            } catch (clipboardError) {
                console.log('Clipboard API fallita, provo metodo alternativo:', clipboardError);
            }
        }
        
        // Fallback per browser più vecchi
        const textArea = document.createElement('textarea');
        textArea.value = colorsText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
            copyBtn.textContent = '✅ Copiato!';
        } else {
            throw new Error('Metodo di copia fallback non riuscito');
        }
        
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

// Funzione per mostrare/nascondere i codici della painting list
function togglePaintingList(button) {
    const codesTable = button.closest('.painting-list-preview').querySelector('.painting-codes-table');
    if (codesTable.classList.contains('hidden')) {
        codesTable.classList.remove('hidden');
        button.textContent = 'Nascondi';
    } else {
        codesTable.classList.add('hidden');
        button.textContent = 'Mostra';
    }
}

window.togglePaintingList = togglePaintingList;

// Rende la funzione globale per l'uso negli onclick HTML
window.copyColorsToClipboard = copyColorsToClipboard;