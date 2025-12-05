const express = require('express');
const app = express();
const PORT = 3000;

// Middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
app.use(express.json());
app.use(express.static('public'));

// Global variables
let envelopes = [];
let totalBudget = 0;
let nextId = 1;

// GET endpoint to retrieve all envelopes
app.get('/envelopes', (req, res) => {
    res.status(200).json({
        totalBudget: totalBudget,
        envelopes: envelopes
    });
});

// GET endpoint to retrieve a specific envelope by ID
app.get('/envelopes/:id', (req, res) => {
    const id = parseInt(req.params.id);

    // Validate ID is a number
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Find envelope by ID
    const envelope = envelopes.find(env => env.id === id);

    if (!envelope) {
        return res.status(404).json({ error: 'Envelope not found' });
    }

    res.status(200).json(envelope);
});

// POST endpoint to create a new envelope
app.post('/envelopes', (req, res) => {
    const { title, budget } = req.body;

    // Validation
    if (!title || budget === undefined) {
        return res.status(400).json({ error: 'Title and budget are required' });
    }

    if (typeof budget !== 'number' || budget < 0) {
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

// PUT endpoint to update a specific envelope
app.put('/envelopes/:id', (req, res) => {
    const id = parseInt(req.params.id);

    // Validate ID is a number
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Find envelope by ID
    const envelope = envelopes.find(env => env.id === id);

    if (!envelope) {
        return res.status(404).json({ error: 'Envelope not found' });
    }

    const { title, budget } = req.body;

    // Validate at least one field is provided
    if (title === undefined && budget === undefined) {
        return res.status(400).json({ error: 'Title or budget must be provided' });
    }

    // Validate budget if provided
    if (budget !== undefined) {
        if (typeof budget !== 'number' || budget < 0) {
            return res.status(400).json({ error: 'Budget must be a positive number' });
        }

        // Update total budget
        totalBudget = totalBudget - envelope.budget + budget;
        envelope.budget = budget;
    }

    // Update title if provided
    if (title !== undefined) {
        envelope.title = title;
    }

    res.status(200).json(envelope);
});

// POST endpoint to subtract money from an envelope
app.post('/envelopes/:id/subtract', (req, res) => {
    const id = parseInt(req.params.id);

    // Validate ID is a number
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Find envelope by ID
    const envelope = envelopes.find(env => env.id === id);

    if (!envelope) {
        return res.status(404).json({ error: 'Envelope not found' });
    }

    const { amount } = req.body;

    // Validate amount
    if (amount === undefined) {
        return res.status(400).json({ error: 'Amount is required' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Check if sufficient funds
    if (envelope.budget < amount) {
        return res.status(400).json({ error: 'Insufficient funds in envelope' });
    }

    // Subtract amount from envelope and total budget
    envelope.budget -= amount;
    totalBudget -= amount;

    res.status(200).json(envelope);
});

// DELETE endpoint to remove a specific envelope
app.delete('/envelopes/:id', (req, res) => {
    const id = parseInt(req.params.id);

    // Validate ID is a number
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Find envelope by ID
    const envelope = envelopes.find(env => env.id === id);

    if (!envelope) {
        return res.status(404).json({ error: 'Envelope not found' });
    }

    // Remove envelope from array using filter
    envelopes = envelopes.filter(env => env.id !== id);

    // Update total budget
    totalBudget -= envelope.budget;

    res.status(200).json({ message: 'Envelope deleted successfully', envelope: envelope });
});

// POST endpoint to transfer money between envelopes
app.post('/envelopes/transfer/:from/:to', (req, res) => {
    const fromId = parseInt(req.params.from);
    const toId = parseInt(req.params.to);

    // Validate IDs are numbers
    if (isNaN(fromId) || isNaN(toId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Check if trying to transfer to the same envelope
    if (fromId === toId) {
        return res.status(400).json({ error: 'Cannot transfer to the same envelope' });
    }

    // Find both envelopes
    const fromEnvelope = envelopes.find(env => env.id === fromId);
    const toEnvelope = envelopes.find(env => env.id === toId);

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

    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Check if sufficient funds in source envelope
    if (fromEnvelope.budget < amount) {
        return res.status(400).json({ error: 'Insufficient funds in source envelope' });
    }

    // Transfer the amount
    fromEnvelope.budget -= amount;
    toEnvelope.budget += amount;

    res.status(200).json({
        message: 'Transfer successful',
        from: fromEnvelope,
        to: toEnvelope
    });
});

// POST endpoint to distribute amount across multiple envelopes
app.post('/envelopes/distribute', (req, res) => {
    const { amount, distributions } = req.body;

    // Validate amount
    if (amount === undefined) {
        return res.status(400).json({ error: 'Amount is required' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
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
        const envelope = envelopes.find(env => env.id === dist.id);

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

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
