// ============================================
// CONFIGURATION
// ============================================
const API_URL = '';

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadEnvelopes();
});

// ============================================
// API CALLS
// ============================================

/**
 * Fetch all envelopes from the server
 * @returns {Promise<Object>} Response with totalBudget and envelopes array
 */
async function fetchEnvelopes() {
    const response = await fetch(`${API_URL}/envelopes`);
    if (!response.ok) {
        throw new Error('Failed to fetch envelopes');
    }
    return await response.json();
}

/**
 * Create a new envelope
 * @param {string} title - Envelope title
 * @param {number} budget - Initial budget
 * @returns {Promise<Object>} Created envelope
 */
async function createEnvelopeAPI(title, budget) {
    const response = await fetch(`${API_URL}/envelopes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, budget })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
    }
    
    return await response.json();
}

/**
 * Update an envelope's budget
 * @param {number} id - Envelope ID
 * @param {number} budget - New budget value
 * @returns {Promise<Object>} Updated envelope
 */
async function updateEnvelopeAPI(id, budget) {
    const response = await fetch(`${API_URL}/envelopes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
    }
    
    return await response.json();
}

/**
 * Subtract amount from an envelope
 * @param {number} id - Envelope ID
 * @param {number} amount - Amount to subtract
 * @returns {Promise<Object>} Updated envelope
 */
async function subtractFromEnvelopeAPI(id, amount) {
    const response = await fetch(`${API_URL}/envelopes/${id}/subtract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
    }
    
    return await response.json();
}

/**
 * Delete an envelope
 * @param {number} id - Envelope ID
 * @returns {Promise<Object>} Deletion confirmation
 */
async function deleteEnvelopeAPI(id) {
    const response = await fetch(`${API_URL}/envelopes/${id}`, {
        method: 'DELETE'
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
    }
    
    return await response.json();
}

/**
 * Transfer money between envelopes
 * @param {number} fromId - Source envelope ID
 * @param {number} toId - Destination envelope ID
 * @param {number} amount - Amount to transfer
 * @returns {Promise<Object>} Transfer result
 */
async function transferBetweenEnvelopesAPI(fromId, toId, amount) {
    const response = await fetch(`${API_URL}/envelopes/transfer/${fromId}/${toId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
    }
    
    return await response.json();
}

/**
 * Distribute amount across multiple envelopes
 * @param {number} amount - Total amount to distribute
 * @param {Array} distributions - Array of {id, percentage} objects
 * @returns {Promise<Object>} Distribution result
 */
async function distributeAmountAPI(amount, distributions) {
    const response = await fetch(`${API_URL}/envelopes/distribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, distributions })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
    }
    
    return await response.json();
}

// ============================================
// UI RENDERING
// ============================================

/**
 * Load and display all envelopes
 */
async function loadEnvelopes() {
    try {
        const data = await fetchEnvelopes();
        
        updateTotalBudgetDisplay(data.totalBudget);
        renderEnvelopesList(data.envelopes);
        updateTransferSelects(data.envelopes);
    } catch (error) {
        console.error('Error loading envelopes:', error);
        showError('Failed to load envelopes');
    }
}

/**
 * Update the total budget display
 * @param {number} totalBudget - Total budget amount
 */
function updateTotalBudgetDisplay(totalBudget) {
    document.getElementById('totalBudget').textContent = totalBudget.toFixed(2);
}

/**
 * Render the list of envelopes
 * @param {Array} envelopes - Array of envelope objects
 */
function renderEnvelopesList(envelopes) {
    const envelopesList = document.getElementById('envelopesList');
    envelopesList.innerHTML = '';
    
    if (envelopes.length === 0) {
        envelopesList.innerHTML = '<p style="color: #999;">No envelopes yet. Create one to get started!</p>';
        return;
    }
    
    envelopes.forEach(envelope => {
        const card = createEnvelopeCard(envelope);
        envelopesList.appendChild(card);
    });
}

/**
 * Create an envelope card element
 * @param {Object} envelope - Envelope object
 * @returns {HTMLElement} Envelope card element
 */
function createEnvelopeCard(envelope) {
    const card = document.createElement('div');
    card.className = 'envelope-card';
    card.innerHTML = `
        <div class="envelope-header">
            <div class="envelope-title">${escapeHtml(envelope.title)}</div>
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

/**
 * Update transfer dropdown selects with current envelopes
 * @param {Array} envelopes - Array of envelope objects
 */
function updateTransferSelects(envelopes) {
    const fromSelect = document.getElementById('transferFrom');
    const toSelect = document.getElementById('transferTo');
    
    fromSelect.innerHTML = '<option value="">From Envelope</option>';
    toSelect.innerHTML = '<option value="">To Envelope</option>';
    
    envelopes.forEach(envelope => {
        const optionFrom = createEnvelopeOption(envelope);
        const optionTo = createEnvelopeOption(envelope);
        
        fromSelect.appendChild(optionFrom);
        toSelect.appendChild(optionTo);
    });
}

/**
 * Create an option element for envelope selection
 * @param {Object} envelope - Envelope object
 * @returns {HTMLElement} Option element
 */
function createEnvelopeOption(envelope) {
    const option = document.createElement('option');
    option.value = envelope.id;
    option.textContent = `${envelope.title} ($${envelope.budget.toFixed(2)})`;
    return option;
}

// ============================================
// USER ACTIONS - ENVELOPE MANAGEMENT
// ============================================

/**
 * Create a new envelope from form input
 */
async function createEnvelope() {
    const title = document.getElementById('envelopeTitle').value.trim();
    const budget = parseFloat(document.getElementById('envelopeBudget').value);
    
    if (!title || isNaN(budget) || budget < 0) {
        showError('Please enter valid title and budget');
        return;
    }
    
    try {
        await createEnvelopeAPI(title, budget);
        clearForm(['envelopeTitle', 'envelopeBudget']);
        await loadEnvelopes();
    } catch (error) {
        showError(error.message);
    }
}

/**
 * Update an envelope's budget
 * @param {number} id - Envelope ID
 */
async function updateEnvelope(id) {
    const budget = parseFloat(document.getElementById(`update-${id}`).value);
    
    if (isNaN(budget) || budget < 0) {
        showError('Please enter a valid budget');
        return;
    }
    
    try {
        await updateEnvelopeAPI(id, budget);
        await loadEnvelopes();
    } catch (error) {
        showError(error.message);
    }
}

/**
 * Subtract amount from an envelope
 * @param {number} id - Envelope ID
 */
async function subtractFromEnvelope(id) {
    const amount = parseFloat(document.getElementById(`subtract-${id}`).value);
    
    if (isNaN(amount) || amount <= 0) {
        showError('Please enter a valid amount');
        return;
    }
    
    try {
        await subtractFromEnvelopeAPI(id, amount);
        await loadEnvelopes();
    } catch (error) {
        showError(error.message);
    }
}

/**
 * Delete an envelope
 * @param {number} id - Envelope ID
 */
async function deleteEnvelope(id) {
    if (!confirm('Are you sure you want to delete this envelope?')) {
        return;
    }
    
    try {
        await deleteEnvelopeAPI(id);
        await loadEnvelopes();
    } catch (error) {
        showError(error.message);
    }
}

// ============================================
// USER ACTIONS - TRANSFERS
// ============================================

/**
 * Transfer money between envelopes from form input
 */
async function transferBetweenEnvelopes() {
    const fromId = document.getElementById('transferFrom').value;
    const toId = document.getElementById('transferTo').value;
    const amount = parseFloat(document.getElementById('transferAmount').value);
    
    if (!fromId || !toId) {
        showError('Please select both source and destination envelopes');
        return;
    }
    
    if (fromId === toId) {
        showError('Cannot transfer to the same envelope');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        showError('Please enter a valid amount');
        return;
    }
    
    try {
        await transferBetweenEnvelopesAPI(fromId, toId, amount);
        clearForm(['transferAmount', 'transferFrom', 'transferTo']);
        await loadEnvelopes();
        showSuccess('Transfer completed successfully!');
    } catch (error) {
        showError(error.message);
    }
}

// ============================================
// USER ACTIONS - DISTRIBUTION
// ============================================

/**
 * Show the distribution modal
 */
async function showDistributeModal() {
    const amount = parseFloat(document.getElementById('distributeAmount').value);
    
    if (isNaN(amount) || amount <= 0) {
        showError('Please enter a valid amount to distribute');
        return;
    }
    
    try {
        const data = await fetchEnvelopes();
        
        if (data.envelopes.length === 0) {
            showError('Create some envelopes first');
            return;
        }
        
        renderDistributeForm(data.envelopes);
        document.getElementById('distributeModal').style.display = 'block';
    } catch (error) {
        showError('Failed to load envelopes');
    }
}

/**
 * Render the distribution form in the modal
 * @param {Array} envelopes - Array of envelope objects
 */
function renderDistributeForm(envelopes) {
    const form = document.getElementById('distributeForm');
    form.innerHTML = '<p>Set percentage for each envelope (must total 100%):</p>';
    
    envelopes.forEach(envelope => {
        const item = document.createElement('div');
        item.className = 'distribute-item';
        item.innerHTML = `
            <label>${escapeHtml(envelope.title)}</label>
            <input type="number" id="dist-${envelope.id}" placeholder="%" min="0" max="100" step="0.01">
            <span>%</span>
        `;
        form.appendChild(item);
    });
}

/**
 * Close the distribution modal
 */
function closeDistributeModal() {
    document.getElementById('distributeModal').style.display = 'none';
}

/**
 * Execute the distribution
 */
async function distributeAmount() {
    const amount = parseFloat(document.getElementById('distributeAmount').value);
    
    try {
        const data = await fetchEnvelopes();
        const distributions = [];
        let totalPercentage = 0;
        
        // Collect percentages from form
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
        
        // Validate total percentage
        if (Math.abs(totalPercentage - 100) > 0.01) {
            showError(`Percentages must total 100%. Current total: ${totalPercentage.toFixed(2)}%`);
            return;
        }
        
        await distributeAmountAPI(amount, distributions);
        
        document.getElementById('distributeAmount').value = '';
        closeDistributeModal();
        await loadEnvelopes();
        showSuccess('Amount distributed successfully!');
    } catch (error) {
        showError(error.message);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Clear form inputs
 * @param {Array<string>} fieldIds - Array of input field IDs
 */
function clearForm(fieldIds) {
    fieldIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
        }
    });
}

/**
 * Show error message to user
 * @param {string} message - Error message
 */
function showError(message) {
    alert(message);
}

/**
 * Show success message to user
 * @param {string} message - Success message
 */
function showSuccess(message) {
    alert(message);
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
