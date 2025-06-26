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
            return;
        }
        
        const escapeForHtmlAttr = (jsonString) => jsonString.replace(/'/g, "'");

        sequenceItemsEl.innerHTML = items.map(item => `
            <div class="sequence-item ${item.reintegro === 'Si' ? 'item-reintegro' : ''}">
                <div class="item-actions">
                    <button class="edit-btn" onclick='editItem(${escapeForHtmlAttr(JSON.stringify(item))})'>✎</button>
                    <button class="delete-btn" onclick="deleteItem(${sequenceNum}, ${item.id})">×</button>
                </div>
                <div class="item-info">
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
        console.error('Error loading sequence items:', error);
        document.getElementById('sequenceItems').innerHTML = "<p>Errore critico nel caricamento degli elementi della sequenza.</p>";
    }
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
                loadSequenceItems(); 
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