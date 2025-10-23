-- Drop existing tables to ensure a clean slate.
DROP TABLE IF EXISTS teczki;
DROP TABLE IF EXISTS submissions;

-- Table for raw, original submissions.
CREATE TABLE submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_type TEXT NOT NULL,
    content TEXT,
    original_filename TEXT,
    stored_filename TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table for analytical data ('folders').
CREATE TABLE teczki (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL,
    kategoria TEXT DEFAULT 'Nieskategoryzowane',
    status TEXT DEFAULT 'Nowe',
    powod_weryfikacji TEXT, -- Reason why it needs verification
    notatki_analityka TEXT,
    przetworzony_tekst TEXT,
    latitude REAL,
    longitude REAL,
    zrodlo_gps TEXT DEFAULT 'brak',
    zweryfikowane_gps BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (submission_id) REFERENCES submissions (id)
);
