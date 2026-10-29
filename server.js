const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const VERSION = process.env.VERSION || "v1";

// Validate the application version.
const match = /^v([123])$/.exec(VERSION);

if (!match) {
    throw new Error("VERSION must be v1, v2, or v3");
}

const versionNumber = Number(match[1]);

// Store feedback in a JSON file.
const DATA_FILE = path.join(__dirname, "data.json");

// Create the data file if it does not exist.
function ensureDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify({ feedback: [] }, null, 2)
        );
    }
}

// Read feedback.
function readData() {
    ensureDataFile();

    const data = JSON.parse(
        fs.readFileSync(DATA_FILE, "utf8")
    );

    return {
        feedback: Array.isArray(data.feedback)
            ? data.feedback
            : []
    };
}

// Save feedback.
function writeData(data) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 2)
    );
}

// Restrict endpoints to their assigned versions.
function requireVersion(requiredVersion, res) {
    if (versionNumber !== requiredVersion) {
        res.status(403).json({
            error: `This feature is available only in v${requiredVersion}`
        });

        return false;
    }

    return true;
}

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

// Health check: available in all versions.
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        version: VERSION,
        application: "Feedback System"
    });
});

// --------------------------------------------------
// VERSION 1: SUBMIT FEEDBACK
// POST /feedback
// --------------------------------------------------

app.post("/feedback", (req, res) => {
    if (!requireVersion(1, res)) return;

    const {
        name,
        email,
        message,
        rating
    } = req.body;

    if (
        typeof name !== "string" ||
        !name.trim() ||

        typeof email !== "string" ||
        !email.trim() ||

        typeof message !== "string" ||
        !message.trim() ||

        !Number.isInteger(Number(rating)) ||
        Number(rating) < 1 ||
        Number(rating) > 5
    ) {
        return res.status(400).json({
            error: "Provide a name, email, message and rating from 1 to 5"
        });
    }

    const data = readData();

    const feedback = {
        id: Math.max(
            0,
            ...data.feedback.map(item => item.id)
        ) + 1,

        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        rating: Number(rating),
        createdAt: new Date().toISOString()
    };

    data.feedback.push(feedback);

    writeData(data);

    res.status(201).json({
        message: "Feedback submitted successfully",
        feedback
    });
});

// --------------------------------------------------
// VERSION 2: VIEW ALL FEEDBACK
// GET /feedback
// --------------------------------------------------

app.get("/feedback", (req, res) => {
    if (!requireVersion(2, res)) return;

    const data = readData();

    res.json({
        count: data.feedback.length,
        feedback: data.feedback
    });
});

// --------------------------------------------------
// VERSION 3: FILTER AND SORT FEEDBACK
// GET /feedback/filter
// --------------------------------------------------

app.get("/feedback/filter", (req, res) => {
    if (!requireVersion(3, res)) return;

    const data = readData();

    let feedback = [...data.feedback];

    const {
        rating,
        search,
        sort
    } = req.query;

    // Filter by rating.
    if (rating !== undefined) {
        const selectedRating = Number(rating);

        if (
            !Number.isInteger(selectedRating) ||
            selectedRating < 1 ||
            selectedRating > 5
        ) {
            return res.status(400).json({
                error: "Rating must be between 1 and 5"
            });
        }

        feedback = feedback.filter(
            item => item.rating === selectedRating
        );
    }

    // Search feedback by name or message.
    if (typeof search === "string" && search.trim()) {
        const term = search.trim().toLowerCase();

        feedback = feedback.filter(item =>
            item.name.toLowerCase().includes(term) ||
            item.message.toLowerCase().includes(term)
        );
    }

    // Sort by date or rating.
    if (sort === "newest") {
        feedback.sort(
            (a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
        );
    } else if (sort === "oldest") {
        feedback.sort(
            (a, b) =>
                new Date(a.createdAt) - new Date(b.createdAt)
        );
    } else if (sort === "rating-high") {
        feedback.sort(
            (a, b) => b.rating - a.rating
        );
    } else if (sort === "rating-low") {
        feedback.sort(
            (a, b) => a.rating - b.rating
        );
    } else if (sort !== undefined && sort !== "") {
        return res.status(400).json({
            error: "Invalid sort option"
        });
    }

    res.json({
        count: feedback.length,
        feedback
    });
});

// Return a JSON error for unsupported endpoints.
app.use((req, res) => {
    res.status(404).json({
        error: "Endpoint not found"
    });
});

// Start the server.
app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `Feedback System ${VERSION} running on port ${PORT}`
    );
});
