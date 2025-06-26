document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('dataForm');
    const recentItemsList = document.getElementById('recentItemsList');

    loadRecentItems(); 
    setupModal(); 

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            colore: document.getElementById('colore').value,
            sequenza: document.getElementById('sequenza').value,
            pronto: document.getElementById('pronto').value,
            reintegro: document.getElementById('reintegro').checked, // Get boolean value
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
                <div class="sequence-item ${item.reintegro === 'Si' ? 'item-reintegro' : ''}">
                    <div class="item-actions">
                        <button class="edit-btn" onclick='editItem(${escapeForHtmlAttr(JSON.stringify(item))})'>✎</button>
                        <button class="delete-btn" onclick="deleteItem(${item.sequenza}, ${item.id})">×</button>
                    </div>
                    <div class="item-info">
                        <span>Sequenza:</span> ${item.sequenza}
                        <span>Colore:</span> ${item.colore}
                        <span>Pronto:</span> ${item.pronto}
                        ${item.reintegro === 'Si' ? '<span class="reintegro-badge">REINTEGRO</span>' : ''}
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
                    ${item.note ? `<div class="item-note"><span>Note:</span> ${item.note}</div>` : ''}
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
    document.getElementById('editColore').value = item.colore;
    document.getElementById('editPronto').value = item.pronto;
    document.getElementById('editReintegro').checked = (item.reintegro === 'Si'); // Set checkbox state
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
    const sequence = document.getElementById('editItemSequence').value; 

    if (!sequence) {
        alert('Errore: Sequenza dell\'elemento da modificare non trovata.');
        return;
    }

    const formData = {
        colore: document.getElementById('editColore').value,
        pronto: document.getElementById('editPronto').value,
        reintegro: document.getElementById('editReintegro').checked, // Get boolean value
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
        const response = await fetch(`/api/update_item/${sequence}/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json().catch(() => null);

        if (response.ok && result && result.success) {
            document.getElementById('editModal').style.display = 'none';
            if (typeof loadRecentItems === 'function') { 
                loadRecentItems();
            }
            // If on a sequence page, this function might not exist directly, but we call its equivalent
            if (typeof loadSequenceItems === 'function') {
                loadSequenceItems();
            }

        } else {
            const errorMsg = result ? result.error : 'Errore durante l\'aggiornamento dell\'elemento';
            alert(errorMsg);
            console.error('Error updating item:', result);
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