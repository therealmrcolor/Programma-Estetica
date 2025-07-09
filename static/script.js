document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('dataForm');
    const recentItemsList = document.getElementById('recentItemsList');

    loadRecentItems(); 
    loadGlobalColorsRecap(); // Add global colors recap for homepage
    setupModal(); 

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            colore: document.getElementById('colore').value,
            sequenza: document.getElementById('sequenza').value,
            pronto: document.getElementById('pronto').value,
            reintegro: document.getElementById('reintegro').checked ? 'Si' : 'No',
            ricambi: document.getElementById('ricambi').checked ? 'Si' : 'No',
            note: document.getElementById('note').value,
            carretti_vert: [],
            tavoli: [],
            pedane: [],
            contenitori: [],
            spalle: []
        };

        const grid = document.querySelector('#dataForm .ub-grid'); 
        const itemTypes = ['carretti_vert', 'tavoli', 'pedane', 'contenitori', 'spalle'];
        
        itemTypes.forEach(type => {
            const typeInputs = grid.querySelectorAll(`input[name="${type}"]`);
            typeInputs.forEach(input => {
                formData[type].push(input.value || '');
            });
        });

        try {
            const response = await fetch('/api/add_item', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                form.reset(); // Resets standard inputs, checkbox will be unchecked
                // document.getElementById('reintegro').checked = false; // Ensure checkbox is reset
                itemTypes.forEach(type => {
                    const typeInputs = grid.querySelectorAll(`input[name="${type}"]`);
                    typeInputs.forEach(input => { input.value = ''; });
                });
                loadRecentItems(); 
                loadGlobalColorsRecap(); // Refresh global colors recap 
            } else {
                const errorMsg = result.error || 'Errore durante l\'aggiunta dell\'elemento';
                alert(errorMsg);
                console.error('Error adding item:', result);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Errore di comunicazione durante l\'aggiunta dell\'elemento.');
        }
    });

    async function loadRecentItems() {
        try {
            const response = await fetch(`/api/get_recent_items_all`);
            if (!response.ok) {
                console.error("Failed to load recent items, status:", response.status);
                const errorData = await response.json().catch(() => ({error: "Errore generico"}));
                recentItemsList.innerHTML = `<p>Errore nel caricamento: ${errorData.error || response.statusText}</p>`;
                return;
            }
            const items = await response.json();

            if (!items || items.length === 0) {
                recentItemsList.innerHTML = "<p>Nessun elemento recente.</p>";
                return;
            }
            
            const escapeForHtmlAttr = (jsonString) => jsonString.replace(/'/g, "'"); // Ensure ' is handled if stringifying JSON for onclick

            recentItemsList.innerHTML = items.map(item => `
                <div class="sequence-item ${item.reintegro === 'Si' ? 'item-reintegro' : ''} ${item.ricambi === 'Si' ? 'item-ricambi' : ''}">
                    <div class="item-actions">
                        <button class="edit-btn" onclick='editItem(${escapeForHtmlAttr(JSON.stringify(item))})'>✎</button>
                        <button class="delete-btn" onclick="deleteItem(${item.sequenza}, ${item.id})">×</button>
                    </div>
                    <div class="item-info">
                        <span><span class="info-label">Sequenza:</span> <span class="info-value">${item.sequenza}</span></span>
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
        } catch (error) {
            console.error('Error loading recent items:', error);
            recentItemsList.innerHTML = "<p>Errore critico nel caricamento degli elementi recenti.</p>";
        }
    }
    window.loadRecentItems = loadRecentItems; // Make it globally accessible if needed elsewhere
});

function setupModal() {
    const modal = document.getElementById('editModal');
    const span = document.getElementsByClassName('close')[0]; 
    const editForm = document.getElementById('editForm');

    if (!modal || !span || !editForm) {
        console.error("Modal elements not found for setupModal.");
        return;
    }

    span.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    editForm.onsubmit = function(e) {
        e.preventDefault();
        updateItem(); 
    }
}

function editItem(item) {
    document.getElementById('editItemId').value = item.id;
    document.getElementById('editItemSequence').value = item.sequenza; 
    
    // Popola il campo sequenza se esiste (sia input che select)
    const editSequenza = document.getElementById('editSequenza');
    if (editSequenza) {
        editSequenza.value = item.sequenza;
    }
    
    document.getElementById('editColore').value = item.colore;
    document.getElementById('editPronto').value = item.pronto;
    document.getElementById('editReintegro').checked = (item.reintegro === 'Si'); // Set checkbox state
    document.getElementById('editRicambi').checked = (item.ricambi === 'Si'); // Set checkbox state
    document.getElementById('editNote').value = item.note || '';

    const editFormGrid = document.querySelector('#editForm .ub-grid');
    const itemTypes = ['carretti_vert', 'tavoli', 'pedane', 'contenitori', 'spalle'];

    itemTypes.forEach(type => {
        const typeInputs = editFormGrid.querySelectorAll(`input[name="${type}"]`);
        (item[type] || []).forEach((value, index) => {
            if (typeInputs[index]) {
                typeInputs[index].value = value || '';
            }
        });
    });

    document.getElementById('editModal').style.display = 'block';
}
window.editItem = editItem; // Make it global

async function updateItem() {
    const itemId = document.getElementById('editItemId').value;
    const originalSequence = document.getElementById('editItemSequence').value; 
    const newSequence = document.getElementById('editSequenza').value; // Get from the select field

    if (!originalSequence) {
        alert('Errore: Sequenza originale dell\'elemento da modificare non trovata.');
        return;
    }

    if (!newSequence) {
        alert('Errore: Nuova sequenza non selezionata.');
        return;
    }

    const formData = {
        colore: document.getElementById('editColore').value,
        pronto: document.getElementById('editPronto').value,
        reintegro: document.getElementById('editReintegro').checked ? 'Si' : 'No',
        ricambi: document.getElementById('editRicambi').checked ? 'Si' : 'No',
        note: document.getElementById('editNote').value,
        carretti_vert: [],
        tavoli: [],
        pedane: [],
        contenitori: [],
        spalle: []
    };

    const editFormGrid = document.querySelector('#editForm .ub-grid');
    const itemTypes = ['carretti_vert', 'tavoli', 'pedane', 'contenitori', 'spalle'];

    itemTypes.forEach(type => {
        const typeInputs = editFormGrid.querySelectorAll(`input[name="${type}"]`);
        for (let i = 0; i < 5; i++) {
            formData[type][i] = typeInputs[i] ? (typeInputs[i].value || '') : '';
        }
    });

    try {
        // Se la sequenza è cambiata, dobbiamo prima eliminare l'elemento dalla sequenza originale
        // e poi crearlo nella nuova sequenza
        if (originalSequence !== newSequence) {
            // Prima creiamo il nuovo elemento nella nuova sequenza
            const createData = {
                ...formData,
                sequenza: newSequence
            };
            
            const createResponse = await fetch('/api/add_item', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(createData)
            });

            const createResult = await createResponse.json().catch(() => null);

            if (createResponse.ok && createResult && createResult.success) {
                // Se la creazione è riuscita, eliminiamo l'elemento originale
                const deleteResponse = await fetch(`/api/delete_item/${originalSequence}/${itemId}`, {
                    method: 'DELETE'
                });
                
                const deleteResult = await deleteResponse.json().catch(() => null);
                
                if (!deleteResponse.ok || !deleteResult || !deleteResult.success) {
                    console.warn('Errore nell\'eliminazione dell\'elemento originale, ma nuovo elemento creato');
                }
            } else {
                const errorMsg = createResult ? createResult.error : 'Errore durante la creazione dell\'elemento nella nuova sequenza';
                alert(errorMsg);
                console.error('Error creating item in new sequence:', createResult);
                return;
            }
        } else {
            // Se la sequenza non è cambiata, facciamo un normale update
            const response = await fetch(`/api/update_item/${originalSequence}/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json().catch(() => null);

            if (!response.ok || !result || !result.success) {
                const errorMsg = result ? result.error : 'Errore durante l\'aggiornamento dell\'elemento';
                alert(errorMsg);
                console.error('Error updating item:', result);
                return;
            }
        }

        // Chiudi il modale e ricarica i dati
        document.getElementById('editModal').style.display = 'none';
        if (typeof loadRecentItems === 'function') { 
            loadRecentItems();
        }
        if (typeof loadGlobalColorsRecap === 'function') {
            loadGlobalColorsRecap(); // Refresh global colors recap
        }
        if (typeof loadSequenceItems === 'function') {
            loadSequenceItems();
        }

    } catch (error) {
        console.error('Error in updateItem fetch:', error);
        alert('Errore di comunicazione durante l\'aggiornamento dell\'elemento.');
    }
}
window.updateItem = updateItem; // Make it global


async function deleteItem(sequence, id) {
    if (confirm('Sei sicuro di voler eliminare questo elemento?')) {
        try {
            const response = await fetch(`/api/delete_item/${sequence}/${id}`, {
                method: 'DELETE'
            });
            const result = await response.json().catch(() => null);

            if (response.ok && result && result.success) {
                if (typeof loadRecentItems === 'function') {
                     loadRecentItems(); 
                }
                if (typeof loadGlobalColorsRecap === 'function') {
                    loadGlobalColorsRecap(); // Refresh global colors recap
                }
                 if (typeof loadSequenceItems === 'function') { // For sequence page
                    loadSequenceItems();
                }
            } else {
                const errorMsg = result ? result.error : 'Errore durante l\'eliminazione dell\'elemento';
                alert(errorMsg);
                console.error('Error deleting item:', result);
            }
        } catch (error) {
            console.error('Error in deleteItem fetch:', error);
            alert('Errore di comunicazione durante l\'eliminazione dell\'elemento.');
        }
    }
}
window.deleteItem = deleteItem; // Make it global

async function loadGlobalColorsRecap() {
    try {
        const response = await fetch('/api/get_global_colors_recap');
        if (!response.ok) {
            console.error("Failed to load global colors recap, status:", response.status);
            return;
        }
        
        const colorsData = await response.json();
        const globalColorsListEl = document.getElementById('globalColorsList');
        
        if (!globalColorsListEl) {
            // Not on homepage, skip
            return;
        }
        
        // Always start with the header
        let html = `
            <div class="colors-header">
                <div class="colors-header-item">Sequenza</div>
                <div class="colors-header-item">Colore</div>
                <div class="colors-header-item">Qty</div>
            </div>
        `;
        
        if (!colorsData || colorsData.length === 0) {
            html += `
                <div class="colors-empty">
                    <div>Nessun elemento presente</div>
                </div>
            `;
            globalColorsListEl.innerHTML = html;
            return;
        }
        
        // Generate table rows
        html += colorsData.map(item => `
            <div class="global-color-row">
                <div class="global-seq-item">${item.sequenza}</div>
                <div class="global-color-item"><a href="/sequence/${item.sequenza}#color-${encodeURIComponent(item.colore)}">${item.colore}</a></div>
                <div class="global-count-item">${item.count}</div>
            </div>
        `).join('');
        
        globalColorsListEl.innerHTML = html;
    } catch (error) {
        console.error('Error loading global colors recap:', error);
    }
}

// Funzione per copiare i colori nella clipboard
async function copyColorsToClipboard() {
    const copyBtn = document.getElementById('copyColorsBtn');
    
    try {
        copyBtn.disabled = true;
        copyBtn.textContent = '📋 Copiando...';
        
        let colors = [];
        
        // Controlla se siamo nella homepage (globalColorsList) o in una pagina sequenza (colorsList)
        const globalColorsEl = document.getElementById('globalColorsList');
        const sequenceColorsEl = document.getElementById('colorsList');
        
        if (globalColorsEl && globalColorsEl.style.display !== 'none') {
            // Homepage - estrai colori dal recap globale
            const colorRows = globalColorsEl.querySelectorAll('.global-color-row');
            colorRows.forEach(row => {
                const colorElement = row.querySelector('.global-color-item');
                if (colorElement) {
                    const colorText = colorElement.textContent.trim();
                    if (colorText && !colors.includes(colorText)) {
                        colors.push(colorText);
                    }
                }
            });
        } else if (sequenceColorsEl) {
            // Pagina sequenza - estrai colori dal recap della sequenza
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