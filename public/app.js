const API_URL = '';

// Load envelopes on page load
document.addEventListener('DOMContentLoaded', () => {
    loadEnvelopes();
});

async function loadEnvelopes() {
    try {
        const response = await fetch(`${API_URL}/envelopes`);
        const data = await response.json();
        
        document.getElementById('totalBudget').textContent = data.totalBudget.toFixed(2);
        
        const envelopesList = document.getElementById('envelopesList');
        envelopesList.innerHTML = '';
        
        if (data.envelopes.length === 0) {
            envelopesList.innerHTML = '<p style="color: #999;">No envelopes yet. Create one to get started!</p>';
            updateTransferSelects([]);
            return;
        }
        
        data.envelopes.forEach(envelope => {
            const card = createEnvelopeCard(envelope);
            envelopesList.appendChild(card);
        });
        
        updateTransferSelects(data.envelopes);
    } catch (error) {
        console.error('Error loading envelopes:', error);
        alert('Failed to load envelopes');
    }
}

function updateTransferSelects(envelopes) {
    const fromSelect = document.getElementById('transferFrom');
    const toSelect = document.getElementById('transferTo');
    
    fromSelect.innerHTML = '<option value="">From Envelope</option>';
    toSelect.innerHTML = '<option value="">To Envelope</option>';
    
    envelopes.forEach(envelope => {
        const optionFrom = document.createElement('option');
        optionFrom.value = envelope.id;
        optionFrom.textContent = `${envelope.title} ($${envelope.budget.toFixed(2)})`;
        fromSelect.appendChild(optionFrom);
        
        const optionTo = document.createElement('option');
        optionTo.value = envelope.id;
        optionTo.textContent = `${envelope.title} ($${envelope.budget.toFixed(2)})`;
        toSelect.appendChild(optionTo);
    });
}

function createEnvelopeCard(envelope) {
    const card = document.createElement('div');
    card.className = 'envelope-card';
    card.innerHTML = `
        <div class="envelope-header">
            <div class="envelope-title">${envelope.title}</div>
            <div class="envelope-budget">$${envelope.budget.toFixed(2)}</div>
        </div>
        <div class="envelope-actions">
            <input type="number" id="update-${envelope.id}" placeholder="New budget" min="0" step="0.01">
            <button onclick="updateEnvelope(${envelope.id})">Update Budget</button>
            <input type="number" id="subtract-${envelope.id}" placeholder="Amount to subtract" min="0" step="0.01">
            <button onclick="subtractFromEnvelope(${envelope.id})">Subtract</button>
            <button class="btn-delete" onclick="deleteEnvelope(${envelope.id})">Delete</button>
        </div>
    `;
    return card;
}

async function createEnvelope() {
    const title = document.getElementById('envelopeTitle').value;
    const budget = parseFloat(document.getElementById('envelopeBudget').value);
    
    if (!title || isNaN(budget) || budget < 0) {
        alert('Please enter valid title and budget');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/envelopes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, budget })
        });
        
        if (response.ok) {
            document.getElementById('envelopeTitle').value = '';
            document.getElementById('envelopeBudget').value = '';
            loadEnvelopes();
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        console.error('Error creating envelope:', error);
        alert('Failed to create envelope');
    }
}

async function updateEnvelope(id) {
    const budget = parseFloat(document.getElementById(`update-${id}`).value);
    
    if (isNaN(budget) || budget < 0) {
        alert('Please enter a valid budget');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/envelopes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ budget })
        });
        
        if (response.ok) {
            loadEnvelopes();
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        console.error('Error updating envelope:', error);
        alert('Failed to update envelope');
    }
}

async function subtractFromEnvelope(id) {
    const amount = parseFloat(document.getElementById(`subtract-${id}`).value);
    
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/envelopes/${id}/subtract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
        
        if (response.ok) {
            loadEnvelopes();
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        console.error('Error subtracting from envelope:', error);
        alert('Failed to subtract from envelope');
    }
}

async function deleteEnvelope(id) {
    if (!confirm('Are you sure you want to delete this envelope?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/envelopes/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadEnvelopes();
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        console.error('Error deleting envelope:', error);
        alert('Failed to delete envelope');
    }
}

function showDistributeModal() {
    const amount = parseFloat(document.getElementById('distributeAmount').value);
    
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount to distribute');
        return;
    }
    
    fetch(`${API_URL}/envelopes`)
        .then(response => response.json())
        .then(data => {
            if (data.envelopes.length === 0) {
                alert('Create some envelopes first');
                return;
            }
            
            const form = document.getElementById('distributeForm');
            form.innerHTML = '<p>Set percentage for each envelope (must total 100%):</p>';
            
            data.envelopes.forEach(envelope => {
                const item = document.createElement('div');
                item.className = 'distribute-item';
                item.innerHTML = `
                    <label>${envelope.title}</label>
                    <input type="number" id="dist-${envelope.id}" placeholder="%" min="0" max="100" step="0.01">
                    <span>%</span>
                `;
                form.appendChild(item);
            });
            
            document.getElementById('distributeModal').style.display = 'block';
        });
}

function closeDistributeModal() {
    document.getElementById('distributeModal').style.display = 'none';
}

async function distributeAmount() {
    const amount = parseFloat(document.getElementById('distributeAmount').value);
    
    const response = await fetch(`${API_URL}/envelopes`);
    const data = await response.json();
    
    const distributions = [];
    let totalPercentage = 0;
    
    for (const envelope of data.envelopes) {
        const percentage = parseFloat(document.getElementById(`dist-${envelope.id}`).value) || 0;
        totalPercentage += percentage;
        
        if (percentage > 0) {
            distributions.push({
                id: envelope.id,
                percentage: percentage
            });
        }
    }
    
    if (Math.abs(totalPercentage - 100) > 0.01) {
        alert(`Percentages must total 100%. Current total: ${totalPercentage.toFixed(2)}%`);
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/envelopes/distribute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, distributions })
        });
        
        if (response.ok) {
            document.getElementById('distributeAmount').value = '';
            closeDistributeModal();
            loadEnvelopes();
            alert('Amount distributed successfully!');
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        console.error('Error distributing amount:', error);
        alert('Failed to distribute amount');
    }
}


async function transferBetweenEnvelopes() {
    const fromId = document.getElementById('transferFrom').value;
    const toId = document.getElementById('transferTo').value;
    const amount = parseFloat(document.getElementById('transferAmount').value);
    
    if (!fromId || !toId) {
        alert('Please select both source and destination envelopes');
        return;
    }
    
    if (fromId === toId) {
        alert('Cannot transfer to the same envelope');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/envelopes/transfer/${fromId}/${toId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
        
        if (response.ok) {
            document.getElementById('transferAmount').value = '';
            document.getElementById('transferFrom').value = '';
            document.getElementById('transferTo').value = '';
            loadEnvelopes();
            alert('Transfer completed successfully!');
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        console.error('Error transferring between envelopes:', error);
        alert('Failed to transfer between envelopes');
    }
}
