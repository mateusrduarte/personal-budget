const express = require('express');
const app = express();
const PORT = 3000;

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
app.use(express.json());
app.use(express.static('public'));

// ============================================
// DATA STORAGE
// ============================================
let envelopes = [];
let totalBudget = 0;
let nextId = 1;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Find an envelope by ID
 * @param {number} id - Envelope ID
 * @returns {Object|undefined} Envelope object or undefined
 */
function findEnvelopeById(id) {
    return envelopes.find(env => env.id === id);
}

/**
 * Validate if a value is a positive number
 * @param {*} value - Value to validate
 * @returns {boolean} True if valid positive number
 */
function isValidPositiveNumber(value) {
    return typeof value === 'number' && value >= 0;
}

/**
 * Validate if a value is a positive non-zero number
 * @param {*} value - Value to validate
 * @returns {boolean} True if valid positive non-zero number
 */
function isValidPositiveAmount(value) {
    return typeof value === 'number' && value > 0;
}

// ============================================
// ROUTES - ENVELOPE RETRIEVAL
// ============================================

/**
 * GET /envelopes
 * Retrieve all envelopes and total budget
 */
app.get('/envelopes', (req, res) => {
    res.status(200).json({
        totalBudget: totalBudget,
        envelopes: envelopes
    });
});

/**
 * GET /envelopes/:id
 * Retrieve a specific envelope by ID
 */
app.get('/envelopes/:id', (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    const envelope = findEnvelopeById(id);

    if (!envelope) {
        return res.status(404).json({ error: 'Envelope not found' });
    }

    res.status(200).json(envelope);
});

// ============================================
// ROUTES - ENVELOPE CREATION
// ============================================

/**
 * POST /envelopes
 * Create a new budget envelope
 */
app.post('/envelopes', (req, res) => {
    const { title, budget } = req.body;

    // Validate required fields
    if (!title || budget === undefined) {
        return res.status(400).json({ error: 'Title and budget are required' });
    }

    // Validate budget value
    if (!isValidPositiveNumber(budget)) {
        return res.status(400).json({ error: 'Budget must be a positive number' });
    }

    // Create new envelope
    const newEnvelope = {
        id: nextId++,
        title: title,
        budget: budget
    };

    envelopes.push(newEnvelope);
    totalBudget += budget;

    res.status(201).json(newEnvelope);
});

// ============================================
// ROUTES - ENVELOPE UPDATES
// ============================================

/**
 * PUT /envelopes/:id
 * Update envelope title and/or budget
 */
app.put('/envelopes/:id', (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    const envelope = findEnvelopeById(id);

    if (!envelope) {
        return res.status(404).json({ error: 'Envelope not found' });
    }

    const { title, budget } = req.body;

    // Validate at least one field is provided
    if (title === undefined && budget === undefined) {
        return res.status(400).json({ error: 'Title or budget must be provided' });
    }

    // Update budget if provided
    if (budget !== undefined) {
        if (!isValidPositiveNumber(budget)) {
            return res.status(400).json({ error: 'Budget must be a positive number' });
        }

        // Adjust total budget
        totalBudget = totalBudget - envelope.budget + budget;
        envelope.budget = budget;
    }

    // Update title if provided
    if (title !== undefined) {
        envelope.title = title;
    }

    res.status(200).json(envelope);
});

/**
 * POST /envelopes/:id/subtract
 * Subtract money from an envelope (e.g., when spending)
 */
app.post('/envelopes/:id/subtract', (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    const envelope = findEnvelopeById(id);

    if (!envelope) {
        return res.status(404).json({ error: 'Envelope not found' });
    }

    const { amount } = req.body;

    // Validate amount
    if (amount === undefined) {
        return res.status(400).json({ error: 'Amount is required' });
    }

    if (!isValidPositiveAmount(amount)) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Check sufficient funds
    if (envelope.budget < amount) {
        return res.status(400).json({ error: 'Insufficient funds in envelope' });
    }

    // Subtract amount
    envelope.budget -= amount;
    totalBudget -= amount;

    res.status(200).json(envelope);
});

// ============================================
// ROUTES - ENVELOPE DELETION
// ============================================

/**
 * DELETE /envelopes/:id
 * Delete a specific envelope
 */
app.delete('/envelopes/:id', (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    const envelope = findEnvelopeById(id);

    if (!envelope) {
        return res.status(404).json({ error: 'Envelope not found' });
    }

    // Remove envelope from array
    envelopes = envelopes.filter(env => env.id !== id);

    // Update total budget
    totalBudget -= envelope.budget;

    res.status(200).json({
        message: 'Envelope deleted successfully',
        envelope: envelope
    });
});

// ============================================
// ROUTES - ENVELOPE TRANSFERS
// ============================================

/**
 * POST /envelopes/transfer/:from/:to
 * Transfer money between two envelopes
 */
app.post('/envelopes/transfer/:from/:to', (req, res) => {
    const fromId = parseInt(req.params.from);
    const toId = parseInt(req.params.to);

    // Validate IDs
    if (isNaN(fromId) || isNaN(toId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Prevent transfer to same envelope
    if (fromId === toId) {
        return res.status(400).json({ error: 'Cannot transfer to the same envelope' });
    }

    // Find both envelopes
    const fromEnvelope = findEnvelopeById(fromId);
    const toEnvelope = findEnvelopeById(toId);

    if (!fromEnvelope) {
        return res.status(404).json({ error: 'Source envelope not found' });
    }

    if (!toEnvelope) {
        return res.status(404).json({ error: 'Destination envelope not found' });
    }

    const { amount } = req.body;

    // Validate amount
    if (amount === undefined) {
        return res.status(400).json({ error: 'Amount is required' });
    }

    if (!isValidPositiveAmount(amount)) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Check sufficient funds
    if (fromEnvelope.budget < amount) {
        return res.status(400).json({ error: 'Insufficient funds in source envelope' });
    }

    // Execute transfer
    fromEnvelope.budget -= amount;
    toEnvelope.budget += amount;

    res.status(200).json({
        message: 'Transfer successful',
        from: fromEnvelope,
        to: toEnvelope
    });
});

/**
 * POST /envelopes/distribute
 * Distribute a single amount across multiple envelopes by percentage
 */
app.post('/envelopes/distribute', (req, res) => {
    const { amount, distributions } = req.body;

    // Validate amount
    if (amount === undefined) {
        return res.status(400).json({ error: 'Amount is required' });
    }

    if (!isValidPositiveAmount(amount)) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Validate distributions array
    if (!Array.isArray(distributions) || distributions.length === 0) {
        return res.status(400).json({ error: 'Distributions array is required' });
    }

    // Validate percentages sum to 100
    const totalPercentage = distributions.reduce((sum, dist) => sum + (dist.percentage || 0), 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
        return res.status(400).json({ error: 'Percentages must sum to 100' });
    }

    const results = [];

    // Distribute amount to each envelope
    for (const dist of distributions) {
        const envelope = findEnvelopeById(dist.id);

        if (!envelope) {
            return res.status(404).json({ error: `Envelope with ID ${dist.id} not found` });
        }

        const distributedAmount = (amount * dist.percentage) / 100;
        envelope.budget += distributedAmount;

        results.push({
            id: envelope.id,
            title: envelope.title,
            addedAmount: distributedAmount,
            newBudget: envelope.budget
        });
    }

    totalBudget += amount;

    res.status(200).json({
        message: 'Amount distributed successfully',
        totalDistributed: amount,
        distributions: results
    });
});

// ============================================
// SERVER STARTUP
// ============================================
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
