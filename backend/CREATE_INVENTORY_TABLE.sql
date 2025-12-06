-- Create inventory_items table for dealer inventory management
CREATE TABLE IF NOT EXISTS inventory_items (
    id VARCHAR(255) PRIMARY KEY,
    dealer_id VARCHAR(255) NOT NULL,
    vin VARCHAR(17) NOT NULL UNIQUE,
    year INTEGER NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    mileage INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    title_status VARCHAR(50) DEFAULT 'Clean',
    description TEXT,
    photo_urls JSON DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'active',
    ai_generated_listing JSON,
    listing_generated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_dealer_id (dealer_id),
    INDEX idx_vin (vin),
    INDEX idx_status (status),
    INDEX idx_make_model (make, model),
    INDEX idx_year (year),
    INDEX idx_price (price)
);

-- Add comments for documentation
ALTER TABLE inventory_items COMMENT = 'Dealer inventory management table';
ALTER TABLE inventory_items MODIFY COLUMN id VARCHAR(255) COMMENT 'Unique inventory item ID';
ALTER TABLE inventory_items MODIFY COLUMN dealer_id VARCHAR(255) COMMENT 'Dealer identifier';
ALTER TABLE inventory_items MODIFY COLUMN vin VARCHAR(17) COMMENT 'Vehicle Identification Number';
ALTER TABLE inventory_items MODIFY COLUMN year INTEGER COMMENT 'Vehicle year';
ALTER TABLE inventory_items MODIFY COLUMN make VARCHAR(100) COMMENT 'Vehicle make (e.g., Toyota, Honda)';
ALTER TABLE inventory_items MODIFY COLUMN model VARCHAR(100) COMMENT 'Vehicle model (e.g., Camry, Civic)';
ALTER TABLE inventory_items MODIFY COLUMN mileage INTEGER COMMENT 'Vehicle mileage';
ALTER TABLE inventory_items MODIFY COLUMN price DECIMAL(10,2) COMMENT 'Vehicle price';
ALTER TABLE inventory_items MODIFY COLUMN title_status VARCHAR(50) COMMENT 'Title status (Clean, Salvage, etc.)';
ALTER TABLE inventory_items MODIFY COLUMN description TEXT COMMENT 'Vehicle description';
ALTER TABLE inventory_items MODIFY COLUMN photo_urls JSON COMMENT 'Array of photo URLs';
ALTER TABLE inventory_items MODIFY COLUMN status VARCHAR(50) COMMENT 'Inventory status (active, sold, removed)';
ALTER TABLE inventory_items MODIFY COLUMN ai_generated_listing JSON COMMENT 'AI generated listing data';
ALTER TABLE inventory_items MODIFY COLUMN listing_generated_at TIMESTAMP COMMENT 'When AI listing was generated';
ALTER TABLE inventory_items MODIFY COLUMN created_at TIMESTAMP COMMENT 'Record creation timestamp';
ALTER TABLE inventory_items MODIFY COLUMN updated_at TIMESTAMP COMMENT 'Record last update timestamp';
