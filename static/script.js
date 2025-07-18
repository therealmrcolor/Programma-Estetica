document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('dataForm');
    const recentItemsList = document.getElementById('recentItemsList');

    // Gestione sequenze attive
    setupActiveSequences();
    
    loadRecentItems(); 
    loadGlobalColorsRecap(); // Add global colors recap for homepage
    setupModal();
    setupPaintingList(); // Setup Painting List functionality

    // Assicuriamoci che le sequenze attive siano evidenziate dopo il caricamento di tutto
    highlightActiveSequences();

    // Funzione per gestire le sequenze attive
    function setupActiveSequences() {
        // Controlla se siamo nella pagina di inserimento
        const seqCheckboxes = document.querySelectorAll('.seq-active-cb');
        if (seqCheckboxes.length > 0) {
            // Siamo nella pagina di inserimento, inizializza i checkbox
            const activeSeqs = getActiveSequences();
            
            seqCheckboxes.forEach(cb => {
                const seqNum = cb.value;
                cb.checked = activeSeqs.includes(seqNum);
                
                cb.addEventListener('change', function() {
                    saveActiveSequences();
                    highlightActiveSequences();
                });
            });
        }
        
        // Evidenzia le sequenze attive nella barra di navigazione
        highlightActiveSequences();
    }
    
    // Funzione per salvare le sequenze attive nel localStorage
    function saveActiveSequences() {
        const seqCheckboxes = document.querySelectorAll('.seq-active-cb');
        const activeSeqs = Array.from(seqCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        
        localStorage.setItem('activeSequences', JSON.stringify(activeSeqs));
    }
    
    // Funzione per recuperare le sequenze attive dal localStorage
    function getActiveSequences() {
        const stored = localStorage.getItem('activeSequences');
        return stored ? JSON.parse(stored) : [];
    }
    // Rendiamo globale anche questa funzione
    window.getActiveSequences = getActiveSequences;
    
    // Funzione per evidenziare le sequenze attive nella barra di navigazione
    function highlightActiveSequences() {
        const activeSeqs = getActiveSequences();
        const navItems = document.querySelectorAll('.nav-item[data-seq]');
        
        navItems.forEach(item => {
            const seqNum = item.getAttribute('data-seq');
            if (activeSeqs.includes(seqNum)) {
                item.classList.add('active-sequence');
            } else {
                item.classList.remove('active-sequence');
            }
        });
    }
    // Rendiamo globale la funzione per poterla chiamare da qualsiasi pagina
    window.highlightActiveSequences = highlightActiveSequences;

    // Funzione per gestire la Painting List
    function setupPaintingList() {
        // Main form
        setupPaintingListForForm(
            'painting_list_scanner', 
            'painting_list', 
            'scannedCodesBody', 
            'paintingListCount', 
            'clearPaintingList',
            null, // Il pulsante toggle non esiste più
            null  // Il container è sempre visibile
        );

        // Edit modal
        setupPaintingListForForm(
            'editPaintingListScanner', 
            'editPaintingList', 
            'editScannedCodesBody', 
            'editPaintingListCount', 
            'editClearPaintingList',
            null, // Il pulsante toggle non esiste più
            null  // Il container è sempre visibile
        );
    }

    function setupPaintingListForForm(scannerId, hiddenInputId, tableBodyId, countId, clearBtnId, toggleBtnId, containerId) {
        const scannerInput = document.getElementById(scannerId);
        const hiddenInput = document.getElementById(hiddenInputId);
        const tableBody = document.getElementById(tableBodyId);
        const countElement = document.getElementById(countId);
        const clearBtn = document.getElementById(clearBtnId);
        
        if (!scannerInput) return; // Element might not be on the page (e.g. sequence.html)

        scannerInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // Evita il submit del form
                const code = scannerInput.value.trim();
                if (code) {
                    addCodeToPaintingList(code, hiddenInput, tableBody, countElement);
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
        
        // Il pulsante mostra/nascondi è stato rimosso, la sezione è sempre visibile
    }

    function addCodeToPaintingList(code, hiddenInput, tableBody, countElement) {
        const currentCodes = hiddenInput.value ? hiddenInput.value.split('\n') : [];
        // Evita duplicati
        if (!currentCodes.includes(code)) { 
            currentCodes.push(code);
            hiddenInput.value = currentCodes.join('\n');
            window.updateScannedCodesTable(hiddenInput, tableBody, countElement);
        }
    }
    
    function removeCodeFromPaintingList(index, hiddenInput, tableBody, countElement) {
        const lines = hiddenInput.value.split('\n');
        lines.splice(index, 1);
        hiddenInput.value = lines.join('\n');
        window.updateScannedCodesTable(hiddenInput, tableBody, countElement);
    }
    
    // Rendi la funzione globale
    window.removeCodeFromPaintingList = removeCodeFromPaintingList;

    // Funzione per aggiornare la tabella dei codici scansionati
    function updateScannedCodesTable(hiddenInput, tableBody, countElement) {
        const lines = hiddenInput.value.trim() ? hiddenInput.value.split('\n').filter(line => line.trim()) : [];
        
        // Pulisce la tabella
        if (!tableBody) return;
        tableBody.innerHTML = '';
        
        // Aggiunge le righe per ogni codice
        lines.forEach((code, index) => {
            if (!code.trim()) return;
            
            const tr = document.createElement('tr');
            
            // Cella per il numero
            const tdNum = document.createElement('td');
            tdNum.textContent = index + 1;
            tr.appendChild(tdNum);
            
            // Cella per il codice
            const tdCode = document.createElement('td');
            tdCode.textContent = code.trim();
            tr.appendChild(tdCode);
            
            // Cella per il pulsante di rimozione
            const tdAction = document.createElement('td');
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-code-btn';
            removeBtn.textContent = 'Rimuovi';
            removeBtn.addEventListener('click', function() {
                window.removeCodeFromPaintingList(index, hiddenInput, tableBody, countElement);
            });
            
            tdAction.appendChild(removeBtn);
            tr.appendChild(tdAction);
            
            tableBody.appendChild(tr);
        });

        if (countElement) {
            countElement.textContent = lines.length;
        }
    }
    
    // Rendi la funzione globale per l'uso nell'editItem
    window.updateScannedCodesTable = updateScannedCodesTable;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Gestione automatica del prefisso RAL per codici di 4 cifre
        let coloreValue = document.getElementById('colore').value.trim();
        if (/^\d{4}$/.test(coloreValue)) {
            coloreValue = 'RAL' + coloreValue;
        }
        
        const formData = {
            colore: coloreValue,
            sequenza: document.getElementById('sequenza').value,
            pronto: document.getElementById('pronto').value,
            reintegro: document.getElementById('reintegro').checked ? 'Si' : 'No',
            ricambi: document.getElementById('ricambi').checked ? 'Si' : 'No',
            note: document.getElementById('note').value,
            painting_list: document.getElementById('painting_list').value,
            carretti_vert: [],
            tavoli: [],
            pedane: [],
            contenitori: [],
            spalle: [],
            painting_list: document.getElementById('painting_list').value.trim()
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
                document.getElementById('painting_list').value = ''; // Clear painting list
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
window.setupModal = setupModal; // Make it globally accessible

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

    // Popola la Painting List
    const editPaintingList = document.getElementById('editPaintingList');
    if (editPaintingList) {
        editPaintingList.value = item.painting_list || '';
        window.updateScannedCodesTable(
            editPaintingList, 
            document.getElementById('editScannedCodesBody'), 
            document.getElementById('editPaintingListCount')
        );
    }

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

    // Gestione automatica del prefisso RAL per codici di 4 cifre nel form di modifica
    let editColoreValue = document.getElementById('editColore').value.trim();
    if (/^\d{4}$/.test(editColoreValue)) {
        editColoreValue = 'RAL' + editColoreValue;
    }

    const formData = {
        colore: editColoreValue,
        pronto: document.getElementById('editPronto').value,
        reintegro: document.getElementById('editReintegro').checked ? 'Si' : 'No',
        ricambi: document.getElementById('editRicambi').checked ? 'Si' : 'No',
        note: document.getElementById('editNote').value,
        carretti_vert: [],
        tavoli: [],
        pedane: [],
        contenitori: [],
        spalle: [],
        painting_list: document.getElementById('editPaintingList').value.trim()
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
        // Aggiorna l'evidenziazione delle sequenze attive
        if (typeof highlightActiveSequences === 'function') {
            highlightActiveSequences();
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
                // Aggiorna l'evidenziazione delle sequenze attive
                if (typeof highlightActiveSequences === 'function') {
                    highlightActiveSequences();
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
        
        let colorData = [];
        
        // Controlla se siamo nella homepage (globalColorsList) o in una pagina sequenza (colorsList)
        const globalColorsEl = document.getElementById('globalColorsList');
        const sequenceColorsEl = document.getElementById('colorsList');
        
        if (globalColorsEl && globalColorsEl.style.display !== 'none') {
            // Homepage - estrai colori dal recap globale e cerca gli elementi completi
            const response = await fetch('/api/get_recent_items_all');
            if (response.ok) {
                const items = await response.json();
                const colorMap = new Map();
                
                items.forEach(item => {
                    const status = (item.reintegro === 'Si' || item.ricambi === 'Si') ? 'R' : 'E';
                    const key = `${item.colore}-${status}-${item.sequenza}`;
                    
                    if (!colorMap.has(key)) {
                        colorMap.set(key, `${item.colore},${status},${item.sequenza}`);
                    }
                });
                
                colorData = Array.from(colorMap.values());
                
                // Ordina alfabeticamente per colore (come nella visualizzazione)
                colorData.sort((a, b) => {
                    const colorA = a.split(',')[0]; // Estrae il colore dalla stringa "RAL3020,E,3"
                    const colorB = b.split(',')[0];
                    return colorA.localeCompare(colorB);
                });
            }
        } else if (sequenceColorsEl) {
            // Pagina sequenza - estrai colori dal recap della sequenza e cerca gli elementi
            const sequenceNum = window.sequenceNum || document.URL.match(/\/sequence\/(\d+)/)?.[1];
            if (sequenceNum) {
                const response = await fetch(`/api/get_items/${sequenceNum}`);
                if (response.ok) {
                    const items = await response.json();
                    const colorMap = new Map();
                    
                    console.log('COPY FUNCTION - Items received for sequence:', items);
                    
                    items.forEach(item => {
                        const status = (item.reintegro === 'Si' || item.ricambi === 'Si') ? 'R' : 'E';
                        const key = `${item.colore}-${status}`;
                        
                        console.log(`COPY - Processing: ${item.colore}, reintegro: ${item.reintegro}, ricambi: ${item.ricambi}, status: ${status}, key: ${key}`);
                        
                        // Mantieni solo una riga per ogni combinazione colore-status
                        if (!colorMap.has(key)) {
                            colorMap.set(key, `${item.colore},${status},${item.sequenza}`);
                            console.log(`COPY - Added to map: ${key} -> ${item.colore},${status},${item.sequenza}`);
                        } else {
                            console.log(`COPY - Key ${key} already exists, skipping`);
                        }
                    });
                    
                    console.log('COPY - Final colorMap entries:', Array.from(colorMap.entries()));
                    colorData = Array.from(colorMap.values());
                    
                    // Ordina alfabeticamente per colore (come nella visualizzazione)
                    colorData.sort((a, b) => {
                        const colorA = a.split(',')[0]; // Estrae il colore dalla stringa "RAL3020,E,3"
                        const colorB = b.split(',')[0];
                        return colorA.localeCompare(colorB);
                    });
                    
                    console.log('COPY - Final colorData (sorted):', colorData);
                }
            }
        }
        
        if (colorData.length === 0) {
            throw new Error('Nessun colore da copiare');
        }
        
        // Crea il testo da copiare
        const colorsText = colorData.join('\n');
        
        // Prova prima la clipboard API moderna
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(colorsText);
                showCopySuccess(copyBtn);
                return;
            } catch (clipboardError) {
                console.log('Clipboard API fallita, provo metodo alternativo:', clipboardError);
            }
        }
        
        // Fallback per browser più vecchi o contesti non sicuri (come HTTP su Windows)
        const textArea = document.createElement('textarea');
        textArea.value = colorsText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        // Prova il comando document.execCommand (deprecated ma ancora supportato)
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
            showCopySuccess(copyBtn);
        } else {
            throw new Error('Metodo di copia fallback non riuscito');
        }
        
    } catch (error) {
        console.error('Errore durante la copia:', error);
        showCopyError(copyBtn, error.message);
    }
}

// Funzione helper per mostrare successo
function showCopySuccess(copyBtn) {
    copyBtn.textContent = '✅ Copiato!';
    setTimeout(() => {
        copyBtn.textContent = '📋 Copia Colori';
        copyBtn.disabled = false;
    }, 2000);
}

// Funzione helper per mostrare errore
function showCopyError(copyBtn, errorMessage) {
    copyBtn.textContent = '❌ Errore';
    console.error('Dettagli errore copia:', errorMessage);
    
    // Mostra un alert con istruzioni alternative
    setTimeout(() => {
        alert('Impossibile copiare automaticamente. Prova:\n\n1. Usa Ctrl+A per selezionare tutto\n2. Usa Ctrl+C per copiare\n\nOppure prova ad accedere al sito tramite HTTPS.');
    }, 100);
    
    setTimeout(() => {
        copyBtn.textContent = '📋 Copia Colori';
        copyBtn.disabled = false;
    }, 2000);
}

// Funzione alternativa per mostrare i colori in un modal
async function showColorsModal() {
    let colorData = [];
    
    try {
        // Controlla se siamo nella homepage (globalColorsList) o in una pagina sequenza (colorsList)
        const globalColorsEl = document.getElementById('globalColorsList');
        const sequenceColorsEl = document.getElementById('colorsList');
        
        if (globalColorsEl && globalColorsEl.style.display !== 'none') {
            // Homepage - estrai colori dal recap globale e cerca gli elementi completi
            const response = await fetch('/api/get_recent_items_all');
            if (response.ok) {
                const items = await response.json();
                const colorMap = new Map();
                
                items.forEach(item => {
                    const status = (item.reintegro === 'Si' || item.ricambi === 'Si') ? 'R' : 'E';
                    const key = `${item.colore}-${status}-${item.sequenza}`;
                    
                    if (!colorMap.has(key)) {
                        colorMap.set(key, `${item.colore},${status},${item.sequenza}`);
                    }
                });
                
                colorData = Array.from(colorMap.values());
            }
        } else if (sequenceColorsEl) {
            // Pagina sequenza - estrai colori dal recap della sequenza e cerca gli elementi
            const sequenceNum = window.sequenceNum || document.URL.match(/\/sequence\/(\d+)/)?.[1];
            if (sequenceNum) {
                const response = await fetch(`/api/get_items/${sequenceNum}`);
                if (response.ok) {
                    const items = await response.json();
                    const colorMap = new Map();
                    
                    items.forEach(item => {
                        const status = (item.reintegro === 'Si' || item.ricambi === 'Si') ? 'R' : 'E';
                        const key = `${item.colore}-${status}`;
                        
                        // Mantieni solo una riga per ogni combinazione colore-status
                        if (!colorMap.has(key)) {
                            colorMap.set(key, `${item.colore},${status},${item.sequenza}`);
                        }
                    });
                    
                    colorData = Array.from(colorMap.values());
                }
            }
        }
        
        // Ordina alfabeticamente per colore (come nella visualizzazione)
        if (colorData.length > 0) {
            colorData.sort((a, b) => {
                const colorA = a.split(',')[0]; // Estrae il colore dalla stringa "RAL3020,E,3"
                const colorB = b.split(',')[0];
                return colorA.localeCompare(colorB);
            });
        }
        
        if (colorData.length === 0) {
            alert('Nessun colore trovato');
            return;
        }
        
        // Crea il modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 500px;
            width: 90%;
            max-height: 70%;
            overflow-y: auto;
        `;
        
        const title = document.createElement('h3');
        title.textContent = 'Colori con Stato e Sequenza';
        title.style.margin = '0 0 15px 0';
        
        const textarea = document.createElement('textarea');
        textarea.value = colorData.join('\n');
        textarea.style.cssText = `
            width: 100%;
            height: 300px;
            font-family: monospace;
            font-size: 14px;
            resize: vertical;
            border: 1px solid #ccc;
            padding: 10px;
            margin: 10px 0;
        `;
        textarea.readOnly = true;
        
        const instructions = document.createElement('p');
        instructions.innerHTML = '<strong>Formato:</strong> Colore,Stato,Sequenza<br><strong>Stato:</strong> E = Normale, R = Reintegro/Ricambi<br><br><strong>Seleziona tutto (Ctrl+A) e copia (Ctrl+C)</strong>';
        instructions.style.margin = '0 0 10px 0';
        instructions.style.fontSize = '14px';
        instructions.style.color = '#666';
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Chiudi';
        closeBtn.style.cssText = `
            background: #666;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        `;
        
        closeBtn.onclick = () => document.body.removeChild(modal);
        modal.onclick = (e) => { if (e.target === modal) document.body.removeChild(modal); };
        
        modalContent.appendChild(title);
        modalContent.appendChild(instructions);
        modalContent.appendChild(textarea);
        modalContent.appendChild(closeBtn);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Seleziona tutto il testo automaticamente
        textarea.select();
        textarea.focus();
        
    } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        alert('Errore nel caricamento dei dati');
    }
}

// Rende le funzioni globali per l'uso negli onclick HTML
window.copyColorsToClipboard = copyColorsToClipboard;
window.showColorsModal = showColorsModal;