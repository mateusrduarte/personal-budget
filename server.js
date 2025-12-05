const express = require('express');
const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// Global variables
let envelopes = [];
let totalBudget = 0;
let nextId = 1;

// Basic route
app.get('/', (req, res) => {
    res.send('Hello, World');
});

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

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
