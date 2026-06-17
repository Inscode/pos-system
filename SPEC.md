# Ghanim Enterprises POS System — Complete Specification
> Give this file to Claude Code along with `ghanim-logo.png` and `pos-layout.png`

---

## Project Overview

```
Business:  Ghanim Enterprises — Multi-category retail shop, Badulla, Sri Lanka
System:    Point of Sale (POS)
Purpose:   Daily retail billing, stock tracking, sales reporting
Currency:  LKR (Sri Lankan Rupees) — format: Rs. X,XXX
Date:      DD/MM/YYYY format
```

---

## Business Structure & Stock Architecture

```
Ghanim Enterprises has 3 systems sharing ONE database (ghanim_db):

SYSTEM 1 — FMS (Finance Management System) [Already built]
└── Tracks money, bills, payments, Rainco shadow stock
    Does NOT manage physical stock quantities

SYSTEM 2 — Wholesale & Store System [Future]
└── Main warehouse/store
    Manages STORE stock (bulk quantities)
    Sells to agents and wholesale buyers
    Transfers products to shop

SYSTEM 3 — POS (This system) [Building now]
└── Retail shop counter
    Manages SHOP stock (shelf quantities)
    Receives stock via transfer from store
    Also manages shop-specific products

SYSTEM 4 — Ecommerce [Already built - needs linking]
└── Online store
    Sells products online
    Reads from SHOP or STORE stock
    depending on product type
```

### Product Types — 3 categories

```
Type 1: STORE_PRODUCT
├── Exists in main wholesale store
├── Can be transferred to shop
├── Examples: Umbrellas, Plastic items,
│            Hardware, Stationery
└── Stock managed by: Wholesale system (future)
    Shop gets its own count after transfer

Type 2: SHOP_DIRECT
├── Bought directly by shop (not from store)
├── Trend items, seasonal, small value
├── Examples: Hair clips, seasonal decorations,
│            impulse buy items
└── Stock managed by: POS system

Type 3: BOTH
├── Exists in store AND shop buys directly too
└── Rare — handled case by case
```

### Stock Locations — separate counts

```
public.stock_locations table:
├── STORE location → managed by Wholesale system
└── SHOP location  → managed by POS system

Example: Umbrella Medium
├── STORE: 450 units (wholesale warehouse)
└── SHOP:   50 units (shop shelf)
    These are DIFFERENT physical locations
    DIFFERENT stock numbers — NOT shared

Example: Hair Clips (shop direct)
├── STORE: 0 (never stocked here)
└── SHOP: 30 units
```

### Stock Flow

```
SUPPLIER
    │
    ▼
STORE STOCK (Wholesale system manages)
    │    │
    │    └──── Wholesale/Agent sales → deduct STORE stock
    │
    │ Store→Shop Transfer
    ▼
SHOP STOCK (POS manages)
    │    │
    │    └──── Counter sales → deduct SHOP stock
    │
    ▼
DIRECT PURCHASE ──► SHOP STOCK (for shop-direct products)

ECOMMERCE reads from:
├── STORE product → STORE stock
└── SHOP product  → SHOP stock
```

### Ecommerce Stock Logic

```
Products visible online (show_online = true):
├── Store products → show store-available qty
│   fulfilled from store stock
│
└── Shop-direct products → show shop qty
    fulfilled from shop stock

NOT online (show_online = false):
├── Loose/bulk items not worth shipping
├── Very cheap items
└── Items owner decides not to sell online

Online price can differ from retail price
(online_price field — accounts for delivery cost)
```

---

## Tech Stack

```
Frontend:  Angular 17 (standalone components)
           Angular Material UI
           SCSS styling
           ImageKit for product images
           ZXing for camera barcode scanning

Backend:   Spring Boot 3
           Java 17
           Spring Security + JWT
           Spring Data JPA
           Flyway migrations
           Maven build

Database:  PostgreSQL
           Schema: pos (POS tables)
           Schema: public (shared tables - products, users)
           Existing DB: ghanim_db (already has FMS tables)

Deploy:    Backend → OCI Ubuntu server (systemd service, port 8081)
           Frontend → Vercel
           Images → ImageKit CDN
```

---

## Design Reference

```
See attached images:
- ghanim-logo.png    → Gold G logo, "GHANIM ENTERPRISES" text
- pos-layout.png     → Full POS layout reference

Color scheme:
├── Sidebar:     Dark navy (#1a2332)
├── Sidebar text: White
├── Active item:  Blue highlight
├── Main bg:     Light grey (#f5f5f5)
├── Cards:       White with shadow
├── Primary btn: Dark navy
├── Success:     Green
├── Danger:      Red
└── Gold accent: #c9a84c (from logo)
```

---

## Authentication

```
Two login accounts:
├── Username: owner    | Role: OWNER
└── Username: cashier  | Role: CASHIER

JWT token:
├── Expiry: 24 hours
├── Store: localStorage
└── Header: Authorization: Bearer {token}

Passwords: bcrypt hashed
```

---

## Existing Ecommerce — Critical Information

```
The ecommerce system already exists and uses ghanim_db.
The POS must NOT break it.
POS only ADDS new columns and tables — never drops or recreates.
```

### Existing Product Entity (ecommerce — lk.ghanim.api)

```java
// Package: lk.ghanim.api.entity
// Table: public.products (already exists in DB)
// These columns ALREADY EXIST — do not recreate:

id              BIGSERIAL PRIMARY KEY
name            VARCHAR NOT NULL
description     TEXT
retail_price    DECIMAL(10,2) NOT NULL
wholesale_price DECIMAL(10,2) NOT NULL
stock           INTEGER              ← legacy stock field (keep, ecommerce uses)
emoji           VARCHAR
image_url       VARCHAR
badge           VARCHAR (SALE/NEW/BEST_SELLER)
active          BOOLEAN DEFAULT true
category_id     BIGINT FK
created_at      TIMESTAMP
updated_at      TIMESTAMP
specifications  TEXT
cost_price      DECIMAL(10,2)
```

### What POS migration must do to products table

```sql
-- ONLY USE ALTER TABLE — never DROP or CREATE TABLE for products
-- All new columns use ADD COLUMN IF NOT EXISTS

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS barcode            VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS unit               VARCHAR(20) DEFAULT 'piece',
ADD COLUMN IF NOT EXISTS min_wholesale_qty  INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS min_stock_alert    DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS product_source     VARCHAR(20) DEFAULT 'SHOP_DIRECT',
ADD COLUMN IF NOT EXISTS fulfillment_source VARCHAR(20) DEFAULT 'SHOP',
ADD COLUMN IF NOT EXISTS show_online        BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_in_pos        BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS online_price       DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS supplier_id        BIGINT;

-- Migrate existing stock values to SHOP location
-- (after stock_locations table is created)
INSERT INTO public.stock_locations (product_id, location, quantity)
SELECT id, 'SHOP', COALESCE(stock, 0)
FROM public.products
ON CONFLICT (product_id, location)
DO UPDATE SET quantity = EXCLUDED.quantity;

-- Set online_price from retail_price for existing products
UPDATE public.products
SET online_price = retail_price
WHERE online_price IS NULL;
```

### Existing Category Entity (ecommerce)

```java
// Table: public.categories (already exists)
// Existing columns:
id          BIGSERIAL PRIMARY KEY
name        VARCHAR NOT NULL
// May have more columns — use CREATE TABLE IF NOT EXISTS
// with only the columns listed, rest will be ignored
```

### Existing ecommerce package structure

```
lk.ghanim.api          ← ecommerce Spring Boot app
                          runs on different port (8080)
                          POS runs on port 8081

POS package:
com.ghanim.pos         ← completely separate package
                          no conflict with ecommerce
```

### Key rule — ecommerce compatibility

```
1. products table:     ALTER only, never recreate ✅
2. categories table:   CREATE IF NOT EXISTS ✅
3. stock column:       KEEP in products table ✅
                       ecommerce still reads it
                       POS reads stock_locations instead
4. All new POS tables: use pos schema prefix ✅
5. New shared tables:  public schema, CREATE IF NOT EXISTS ✅
```

---

## Database Schema

### Run these migrations in order:

```sql
-- ============================================
-- MIGRATION V1: Create POS Schema
-- ============================================
CREATE SCHEMA IF NOT EXISTS pos;

-- ============================================
-- MIGRATION V2: Suppliers
-- ============================================
CREATE TABLE pos.suppliers (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    phone       VARCHAR(20),
    address     TEXT,
    notes       TEXT,
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO pos.suppliers (name) VALUES
('General Stock'),
('Rainco (Pvt) Ltd'),
('Walk-in Purchase'),
('Unknown Supplier');

-- ============================================
-- MIGRATION V3: Categories
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO public.categories (name) VALUES
('Plastic'),
('Electronic'),
('Gift Items'),
('Umbrella'),
('Net'),
('Aluminium'),
('Lighting'),
('Kitchenware'),
('General')
ON CONFLICT DO NOTHING;

-- ============================================
-- MIGRATION V4: Products table updates
-- IMPORTANT: Table already exists (ecommerce)
-- Only ADD new columns — never DROP or recreate
-- ============================================

-- Add POS-specific columns to existing products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS barcode            VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS unit               VARCHAR(20) DEFAULT 'piece',
ADD COLUMN IF NOT EXISTS min_wholesale_qty  INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS min_stock_alert    DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS product_source     VARCHAR(20) DEFAULT 'SHOP_DIRECT',
ADD COLUMN IF NOT EXISTS fulfillment_source VARCHAR(20) DEFAULT 'SHOP',
ADD COLUMN IF NOT EXISTS show_online        BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_in_pos        BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS online_price       DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS supplier_id        BIGINT;

-- Set online_price = retail_price for existing products
UPDATE public.products
SET online_price = retail_price
WHERE online_price IS NULL;

-- Set product_source for existing products
UPDATE public.products
SET product_source = 'SHOP_DIRECT',
    fulfillment_source = 'SHOP'
WHERE product_source IS NULL;

-- ============================================
-- MIGRATION V4b: Stock Locations
-- Separate stock counts per physical location
-- ============================================
CREATE TABLE IF NOT EXISTS public.stock_locations (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT REFERENCES public.products(id),
    location        VARCHAR(20) NOT NULL,
    -- STORE → wholesale warehouse stock
    -- SHOP  → retail shop shelf stock
    quantity        DECIMAL(10,2) DEFAULT 0,
    updated_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, location)
);

-- Migrate existing stock values from products.stock to SHOP location
-- This seeds initial shop stock from ecommerce stock column
INSERT INTO public.stock_locations (product_id, location, quantity)
SELECT id, 'SHOP', COALESCE(stock, 0)
FROM public.products
ON CONFLICT (product_id, location)
DO UPDATE SET quantity = EXCLUDED.quantity;

-- ============================================
-- MIGRATION V4c: Stock Transfers
-- Records movement from STORE to SHOP
-- Created by Wholesale system, received by POS
-- ============================================
CREATE TABLE IF NOT EXISTS public.stock_transfers (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT REFERENCES public.products(id),
    from_location   VARCHAR(20) NOT NULL, -- STORE
    to_location     VARCHAR(20) NOT NULL, -- SHOP
    quantity        DECIMAL(10,2) NOT NULL,
    notes           TEXT,
    status          VARCHAR(20) DEFAULT 'COMPLETED',
    -- PENDING, COMPLETED, CANCELLED
    transferred_by  VARCHAR(100),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- MIGRATION V5: Salespersons
-- ============================================
CREATE TABLE pos.salespersons (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO pos.salespersons (name) VALUES
('Ahmed'),
('Mohamed'),
('Farhan'),
('Nizam');

-- ============================================
-- MIGRATION V6: POS Sessions
-- ============================================
CREATE TABLE pos.sessions (
    id              BIGSERIAL PRIMARY KEY,
    cashier_name    VARCHAR(100) NOT NULL,
    opening_float   DECIMAL(10,2) DEFAULT 0,
    closing_cash    DECIMAL(10,2),
    status          VARCHAR(20) DEFAULT 'OPEN',
    -- OPEN, CLOSED
    notes           TEXT,
    opened_at       TIMESTAMP DEFAULT NOW(),
    closed_at       TIMESTAMP
);

-- ============================================
-- MIGRATION V7: Sales
-- ============================================
CREATE TABLE pos.sales (
    id                  BIGSERIAL PRIMARY KEY,
    session_id          BIGINT REFERENCES pos.sessions(id),
    salesperson_id      BIGINT REFERENCES pos.salespersons(id),
    sale_type           VARCHAR(20) DEFAULT 'RETAIL',
    -- RETAIL, WHOLESALE
    customer_name       VARCHAR(100),
    subtotal            DECIMAL(10,2) NOT NULL,
    item_discount       DECIMAL(10,2) DEFAULT 0,
    cart_discount       DECIMAL(10,2) DEFAULT 0,
    cart_discount_pct   DECIMAL(5,2) DEFAULT 0,
    total               DECIMAL(10,2) NOT NULL,
    payment_method      VARCHAR(20) DEFAULT 'CASH',
    -- CASH, CARD, CREDIT
    cash_tendered       DECIMAL(10,2),
    change_amount       DECIMAL(10,2),
    notes               TEXT,
    status              VARCHAR(20) DEFAULT 'COMPLETED',
    -- COMPLETED, CANCELLED, REFUNDED, HELD
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- MIGRATION V8: Sale Items
-- ============================================
CREATE TABLE pos.sale_items (
    id              BIGSERIAL PRIMARY KEY,
    sale_id         BIGINT REFERENCES pos.sales(id),
    product_id      BIGINT REFERENCES public.products(id),
    product_name    VARCHAR(200) NOT NULL,
    barcode         VARCHAR(100),
    quantity        DECIMAL(10,2) NOT NULL,
    unit_price      DECIMAL(10,2) NOT NULL,
    price_type      VARCHAR(20) DEFAULT 'RETAIL',
    -- RETAIL, WHOLESALE
    item_discount   DECIMAL(10,2) DEFAULT 0,
    item_discount_pct DECIMAL(5,2) DEFAULT 0,
    subtotal        DECIMAL(10,2) NOT NULL
);

-- ============================================
-- MIGRATION V9: Held Sales
-- ============================================
CREATE TABLE pos.held_sales (
    id              BIGSERIAL PRIMARY KEY,
    session_id      BIGINT REFERENCES pos.sessions(id),
    salesperson_id  BIGINT REFERENCES pos.salespersons(id),
    sale_type       VARCHAR(20) DEFAULT 'RETAIL',
    customer_name   VARCHAR(100),
    items           JSONB NOT NULL,
    note            VARCHAR(200),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- MIGRATION V10: Cash Movements
-- ============================================
CREATE TABLE pos.cash_movements (
    id              BIGSERIAL PRIMARY KEY,
    session_id      BIGINT REFERENCES pos.sessions(id),
    type            VARCHAR(20) NOT NULL,
    -- OPENING, SALE, CASH_IN, CASH_OUT, REFUND
    amount          DECIMAL(10,2) NOT NULL,
    reason          VARCHAR(200),
    reference_id    BIGINT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- MIGRATION V11: Returns
-- ============================================
CREATE TABLE pos.returns (
    id                  BIGSERIAL PRIMARY KEY,
    original_sale_id    BIGINT REFERENCES pos.sales(id),
    session_id          BIGINT REFERENCES pos.sessions(id),
    salesperson_id      BIGINT REFERENCES pos.salespersons(id),
    return_type         VARCHAR(20) NOT NULL,
    -- CASH_REFUND, EXCHANGE
    refund_amount       DECIMAL(10,2),
    exchange_sale_id    BIGINT,
    reason              TEXT,
    status              VARCHAR(20) DEFAULT 'COMPLETED',
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pos.return_items (
    id              BIGSERIAL PRIMARY KEY,
    return_id       BIGINT REFERENCES pos.returns(id),
    product_id      BIGINT REFERENCES public.products(id),
    product_name    VARCHAR(200) NOT NULL,
    quantity        DECIMAL(10,2) NOT NULL,
    unit_price      DECIMAL(10,2) NOT NULL,
    subtotal        DECIMAL(10,2) NOT NULL
);

-- ============================================
-- MIGRATION V12: Stock Adjustments
-- For POS: adjusts SHOP stock only
-- ============================================
CREATE TABLE pos.stock_adjustments (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT REFERENCES public.products(id),
    location        VARCHAR(20) DEFAULT 'SHOP',
    -- POS only adjusts SHOP stock
    previous_qty    DECIMAL(10,2),
    new_qty         DECIMAL(10,2),
    difference      DECIMAL(10,2),
    reason          VARCHAR(200),
    -- INITIAL_ENTRY → first time entering stock
    -- CORRECTION    → fixing wrong count
    -- DAMAGE        → damaged goods write-off
    -- FOUND         → stock found after count
    -- RETURN        → customer return added back
    -- PURCHASE      → shop direct purchase received
    -- TRANSFER_IN   → received from store
    adjusted_by     VARCHAR(100),
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- MIGRATION V13: Users
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    username    VARCHAR(50) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20) NOT NULL,
    -- OWNER, CASHIER
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Insert default users (passwords are bcrypt hashed)
-- owner123 and cashier123 as default passwords
INSERT INTO public.users (name, username, password, role) VALUES
('Owner', 'owner', '$2a$10$hashed_owner_password', 'OWNER'),
('Nizam', 'cashier', '$2a$10$hashed_cashier_password', 'CASHIER')
ON CONFLICT DO NOTHING;
```

---

## Spring Boot Backend

### Project structure
```
pos-backend/
├── src/main/java/com/ghanim/pos/
│   ├── PosApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   ├── JwtConfig.java
│   │   └── CorsConfig.java
│   ├── entity/
│   │   ├── User.java              (public schema — CREATE IF NOT EXISTS)
│   │   ├── Product.java           (public schema — EXISTING, altered)
│   │   ├── Category.java          (public schema — EXISTING ecommerce)
│   │   ├── StockLocation.java     (public schema — NEW)
│   │   ├── StockTransfer.java     (public schema — NEW)
│   │   ├── Supplier.java          (pos schema — NEW)
│   │   ├── Salesperson.java       (pos schema — NEW)
│   │   ├── Session.java           (pos schema — NEW)
│   │   ├── Sale.java              (pos schema — NEW)
│   │   ├── SaleItem.java          (pos schema — NEW)
│   │   ├── HeldSale.java          (pos schema — NEW)
│   │   ├── CashMovement.java      (pos schema — NEW)
│   │   ├── Return.java            (pos schema — NEW)
│   │   ├── ReturnItem.java        (pos schema — NEW)
│   │   └── StockAdjustment.java   (pos schema — NEW)
│   ├── repository/
│   │   ├── UserRepository.java
│   │   ├── ProductRepository.java
│   │   ├── CategoryRepository.java
│   │   ├── StockLocationRepository.java
│   │   ├── SupplierRepository.java
│   │   ├── SalespersonRepository.java
│   │   ├── SessionRepository.java
│   │   ├── SaleRepository.java
│   │   ├── HeldSaleRepository.java
│   │   ├── CashMovementRepository.java
│   │   ├── ReturnRepository.java
│   │   └── StockAdjustmentRepository.java
│   ├── service/
│   │   ├── AuthService.java
│   │   ├── ProductService.java
│   │   ├── CategoryService.java
│   │   ├── SupplierService.java
│   │   ├── SalespersonService.java
│   │   ├── SessionService.java
│   │   ├── SaleService.java
│   │   ├── HeldSaleService.java
│   │   ├── CashService.java
│   │   ├── ReturnService.java
│   │   ├── StockService.java
│   │   └── ReportService.java
│   ├── controller/
│   │   ├── AuthController.java
│   │   ├── ProductController.java
│   │   ├── CategoryController.java
│   │   ├── SupplierController.java
│   │   ├── SalespersonController.java
│   │   ├── SessionController.java
│   │   ├── SaleController.java
│   │   ├── HeldSaleController.java
│   │   ├── CashController.java
│   │   ├── ReturnController.java
│   │   ├── StockController.java
│   │   └── ReportController.java
│   ├── dto/
│   │   ├── request/
│   │   │   ├── LoginRequest.java
│   │   │   ├── ProductRequest.java
│   │   │   ├── CheckoutRequest.java
│   │   │   ├── HoldSaleRequest.java
│   │   │   ├── ReturnRequest.java
│   │   │   ├── CashMovementRequest.java
│   │   │   └── StockAdjustmentRequest.java
│   │   └── response/
│   │       ├── LoginResponse.java
│   │       ├── ProductResponse.java
│   │       ├── SaleResponse.java
│   │       ├── ReceiptResponse.java
│   │       └── DailyReportResponse.java
│   └── exception/
│       ├── GlobalExceptionHandler.java
│       ├── ResourceNotFoundException.java
│       └── InsufficientStockException.java
├── src/main/resources/
│   ├── application.properties
│   └── db/migration/
│       ├── V1__create_pos_schema.sql
│       ├── V2__create_suppliers.sql
│       ├── V3__create_categories.sql
│       ├── V4__alter_products_add_pos_columns.sql
│       ├── V4b__create_stock_locations.sql
│       ├── V4c__create_stock_transfers.sql
│       ├── V5__create_salespersons.sql
│       ├── V6__create_sessions.sql
│       ├── V7__create_sales.sql
│       ├── V8__create_sale_items.sql
│       ├── V9__create_held_sales.sql
│       ├── V10__create_cash_movements.sql
│       ├── V11__create_returns.sql
│       ├── V12__create_stock_adjustments.sql
│       └── V13__create_users.sql
└── pom.xml
```

### Key Java Entities

#### Product.java (extends existing ecommerce entity)
```java
// IMPORTANT: This entity maps to existing ecommerce table
// Package: com.ghanim.pos.entity
// Table: public.products (EXISTING — already has ecommerce columns)
// POS adds new fields via ALTER TABLE migrations

@Entity
@Table(name = "products", schema = "public")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── EXISTING ecommerce columns (DO NOT CHANGE) ──
    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal retailPrice;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal wholesalePrice;

    @Column(precision = 10, scale = 2)
    private BigDecimal costPrice;

    private Integer stock;        // legacy — keep for ecommerce compat
    private String emoji;
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    private Badge badge;          // SALE, NEW, BEST_SELLER

    @Column(nullable = false)
    private boolean active = true;

    @Column(columnDefinition = "TEXT")
    private String specifications;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @JsonIgnore
    private Category category;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // ── NEW POS columns (added via ALTER TABLE) ──
    private String barcode;
    private String unit = "piece";
    private Integer minWholesaleQty = 1;

    @Column(precision = 10, scale = 2)
    private BigDecimal minStockAlert = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal onlinePrice;

    @Enumerated(EnumType.STRING)
    private ProductSource productSource = ProductSource.SHOP_DIRECT;

    @Enumerated(EnumType.STRING)
    private FulfillmentSource fulfillmentSource = FulfillmentSource.SHOP;

    private boolean showOnline = true;
    private boolean showInPos = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    @JsonIgnore
    private Supplier supplier;

    // ── Relationships ──
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<StockLocation> stockLocations = new ArrayList<>();

    // ── Enums ──
    public enum Badge { SALE, NEW, BEST_SELLER }

    public enum ProductSource {
        STORE_PRODUCT,   // from wholesale store
        SHOP_DIRECT,     // bought directly by shop
        BOTH
    }

    public enum FulfillmentSource {
        STORE,   // online fulfilled from store stock
        SHOP     // online fulfilled from shop stock
    }

    // ── Helper: get shop stock ──
    @Transient
    public BigDecimal getShopStock() {
        return stockLocations.stream()
            .filter(sl -> "SHOP".equals(sl.getLocation()))
            .map(StockLocation::getQuantity)
            .findFirst()
            .orElse(BigDecimal.ZERO);
    }
}
```

#### StockLocation.java (new shared entity)
```java
@Entity
@Table(name = "stock_locations", schema = "public")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class StockLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;

    @Column(nullable = false)
    private String location;   // "SHOP" or "STORE"

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity = BigDecimal.ZERO;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

#### Supplier.java (new POS entity)
```java
@Entity
@Table(name = "suppliers", schema = "pos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String phone;
    private String address;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

### application.properties
```properties
# Server
server.port=8081
spring.application.name=ghanim-pos

# Database
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.properties.hibernate.default_schema=pos
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.show-sql=false

# Flyway
spring.flyway.enabled=true
spring.flyway.schemas=pos,public
spring.flyway.default-schema=pos
spring.flyway.locations=classpath:db/migration
spring.flyway.baseline-on-migrate=true

# JWT
jwt.secret=${JWT_SECRET}
jwt.expiration=86400000

# CORS
cors.allowed-origins=${ALLOWED_ORIGINS:http://localhost:4200}

# ImageKit
imagekit.public-key=${IMAGEKIT_PUBLIC_KEY}
imagekit.private-key=${IMAGEKIT_PRIVATE_KEY}
imagekit.url-endpoint=${IMAGEKIT_URL_ENDPOINT}
```

### pom.xml dependencies
```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
    </dependency>
    <dependency>
        <groupId>org.flywaydb</groupId>
        <artifactId>flyway-core</artifactId>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.11.5</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.11.5</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.11.5</version>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```

---

## API Endpoints

### Auth
```
POST /api/auth/login
Request:  { "username": "cashier", "password": "cashier123" }
Response: { "token": "jwt...", "role": "CASHIER", "name": "Nizam" }

POST /api/auth/logout
Headers:  Authorization: Bearer {token}
```

### Products
```
GET  /api/products
     Params: search (string), categoryId, active (boolean)
     Response: Page<ProductResponse>

GET  /api/products/{id}
     Response: ProductResponse

GET  /api/products/barcode/{barcode}
     Response: ProductResponse

POST /api/products
     OWNER only
     Request: ProductRequest (multipart for image)
     Response: ProductResponse

PUT  /api/products/{id}
     OWNER only
     Response: ProductResponse

DELETE /api/products/{id}
     OWNER only (soft delete - sets active=false)

ProductResponse {
    id, name, barcode, categoryId, categoryName,
    supplierId, supplierName, costPrice,
    retailPrice, wholesalePrice, minWholesaleQty,
    stockQuantity, unit, imageUrl, active
}
```

### Categories
```
GET  /api/categories
     Response: List<CategoryResponse>

POST /api/categories      (OWNER only)
PUT  /api/categories/{id} (OWNER only)
```

### Suppliers
```
GET  /api/suppliers
     Response: List<SupplierResponse>

POST /api/suppliers       (OWNER only)
PUT  /api/suppliers/{id}  (OWNER only)
```

### Salespersons
```
GET  /api/salespersons
     Response: List<SalespersonResponse>

POST /api/salespersons       (OWNER only)
PUT  /api/salespersons/{id}  (OWNER only)
```

### Sessions
```
POST /api/sessions/open
Request: {
    "cashierName": "Nizam",
    "openingFloat": 5000.00
}
Response: { "sessionId": 1, "openedAt": "..." }

GET /api/sessions/current
Response: {
    "id": 1, "status": "OPEN",
    "cashierName": "Nizam",
    "openedAt": "...",
    "openingFloat": 5000.00,
    "totalSales": 45000.00
}

POST /api/sessions/{id}/close
Request: { "closingCash": 48000.00 }
Response: { session summary with difference }

GET /api/sessions
    Params: date, status
    OWNER only
```

### Sales
```
POST /api/sales/checkout
Request: {
    "sessionId": 1,
    "salespersonId": 2,
    "saleType": "RETAIL",
    "customerName": "Ahmed",  (optional)
    "items": [
        {
            "productId": 5,
            "quantity": 2,
            "unitPrice": 450.00,
            "priceType": "RETAIL",
            "itemDiscount": 0,
            "itemDiscountPct": 0
        }
    ],
    "cartDiscountPct": 5,
    "paymentMethod": "CASH",
    "cashTendered": 2000.00,
    "notes": ""
}
Response: {
    "saleId": 1045,
    "total": 855.00,
    "changeAmount": 1145.00,
    "receipt": { ... receipt data ... }
}

GET /api/sales
    Params: date, salespersonId, saleType,
            status, page, size
    Response: Page<SaleResponse>

GET /api/sales/{id}
    Response: SaleResponse with items

POST /api/sales/{id}/cancel
     OWNER only
```

### Held Sales
```
POST /api/held-sales
Request: {
    "sessionId": 1,
    "salespersonId": 2,
    "saleType": "RETAIL",
    "items": [ ... cart items ... ],
    "note": "Customer checking wallet"
}
Response: { "heldSaleId": 3 }

GET /api/held-sales
    Params: sessionId
    Response: List<HeldSaleResponse>

GET /api/held-sales/{id}
    Response: HeldSaleResponse with items

DELETE /api/held-sales/{id}
       (after resuming)
```

### Cash Movements
```
POST /api/cash/in
Request: {
    "sessionId": 1,
    "amount": 5000.00,
    "reason": "Added float"
}

POST /api/cash/out
Request: {
    "sessionId": 1,
    "amount": 1500.00,
    "reason": "Bought cleaning supplies"
}

GET /api/cash/movements
    Params: sessionId
    Response: List<CashMovementResponse>

POST /api/cash/drawer/open
     (trigger cash drawer signal - Phase 2)
```

### Returns
```
POST /api/returns
Request: {
    "originalSaleId": 1045,
    "sessionId": 1,
    "salespersonId": 2,
    "returnType": "CASH_REFUND",
    "items": [
        {
            "productId": 5,
            "quantity": 1,
            "unitPrice": 450.00
        }
    ],
    "reason": "Defective product"
}
Response: {
    "returnId": 5,
    "refundAmount": 450.00
}

POST /api/returns/exchange
Request: {
    "originalSaleId": 1045,
    "returnItems": [ ... ],
    "exchangeItems": [ ... ],
    "sessionId": 1,
    "salespersonId": 2,
    "difference": 0
}

GET /api/returns
    Params: date, page, size
    OWNER only
```

### Stock
```
GET /api/stock/shop
    Returns all products with SHOP stock quantities
    Params: lowStock (boolean), categoryId
    OWNER only

GET /api/stock/shop/{productId}
    Returns SHOP stock for specific product

GET /api/stock/low
    Returns products where SHOP stock < min_stock_alert
    OWNER only

POST /api/stock/adjust
     OWNER only — adjusts SHOP stock only
Request: {
    "productId": 5,
    "newQuantity": 150,
    "reason": "CORRECTION",
    "notes": "Physical count done"
}

POST /api/stock/receive
     OWNER only — for shop direct purchases
     Increases SHOP stock
Request: {
    "productId": 5,
    "quantity": 30,
    "supplierId": 1,
    "costPrice": 120.00,
    "notes": "Bought from Pettah market"
}

POST /api/stock/transfer/receive
     OWNER only — receive transfer from store
     Increases SHOP stock
Request: {
    "transferId": 10,
    "productId": 5,
    "quantity": 50,
    "notes": "Received from store Jun 7"
}

GET /api/stock/adjustments
    Params: productId, date, reason
    OWNER only
```

### Reports
```
GET /api/reports/daily
    Params: date (default today)
    OWNER only
Response: {
    "date": "07/06/2026",
    "totalSales": 87,
    "totalAmount": 163800.00,
    "retailAmount": 133800.00,
    "wholesaleAmount": 30000.00,
    "totalProfit": 45000.00,
    "salespersonBreakdown": [
        {
            "name": "Ahmed",
            "salesCount": 23,
            "totalAmount": 45200.00,
            "profit": 12000.00
        }
    ],
    "cashSummary": {
        "openingFloat": 5000.00,
        "totalCashSales": 133800.00,
        "cashIn": 0,
        "cashOut": 1500.00,
        "expectedCash": 137300.00
    },
    "paymentBreakdown": {
        "cash": 133800.00,
        "card": 20000.00,
        "credit": 10000.00
    }
}

GET /api/reports/sales-summary
    Params: from, to, salespersonId
    OWNER only

GET /api/reports/top-products
    Params: from, to, limit
    OWNER only
```

---

## Angular Frontend

### Project setup
```bash
ng new pos-frontend --routing=true --style=scss --standalone=true
cd pos-frontend
npm install @angular/material @angular/cdk
npm install @zxing/ngx-scanner
npm install chart.js ng2-charts
npm install imagekitio-angular
```

### App structure
```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── interceptors/
│   │   │   ├── jwt.interceptor.ts
│   │   │   └── error.interceptor.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── product.service.ts
│   │   │   ├── sale.service.ts
│   │   │   ├── session.service.ts
│   │   │   ├── held-sale.service.ts
│   │   │   ├── return.service.ts
│   │   │   ├── report.service.ts
│   │   │   └── cash.service.ts
│   │   └── models/
│   │       ├── product.model.ts
│   │       ├── sale.model.ts
│   │       ├── session.model.ts
│   │       ├── cart.model.ts
│   │       └── report.model.ts
│   │
│   ├── layout/
│   │   ├── sidebar/
│   │   │   ├── sidebar.component.ts
│   │   │   └── sidebar.component.html
│   │   └── main-layout/
│   │       ├── main-layout.component.ts
│   │       └── main-layout.component.html
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   └── login/
│   │   │       ├── login.component.ts
│   │   │       └── login.component.html
│   │   │
│   │   ├── pos/                    ← MAIN SCREEN
│   │   │   ├── pos.component.ts
│   │   │   ├── pos.component.html
│   │   │   ├── pos.component.scss
│   │   │   ├── components/
│   │   │   │   ├── product-grid/
│   │   │   │   │   ├── product-grid.component.ts
│   │   │   │   │   └── product-grid.component.html
│   │   │   │   ├── product-card/
│   │   │   │   │   ├── product-card.component.ts
│   │   │   │   │   └── product-card.component.html
│   │   │   │   ├── cart/
│   │   │   │   │   ├── cart.component.ts
│   │   │   │   │   └── cart.component.html
│   │   │   │   ├── cart-item/
│   │   │   │   │   ├── cart-item.component.ts
│   │   │   │   │   └── cart-item.component.html
│   │   │   │   ├── checkout-dialog/
│   │   │   │   │   ├── checkout-dialog.component.ts
│   │   │   │   │   └── checkout-dialog.component.html
│   │   │   │   ├── receipt-dialog/
│   │   │   │   │   ├── receipt-dialog.component.ts
│   │   │   │   │   └── receipt-dialog.component.html
│   │   │   │   ├── hold-sale-dialog/
│   │   │   │   │   └── hold-sale-dialog.component.ts
│   │   │   │   └── barcode-scanner/
│   │   │   │       └── barcode-scanner.component.ts
│   │   │   └── dialogs/
│   │   │       ├── cash-in-out-dialog/
│   │   │       └── open-drawer-dialog/
│   │   │
│   │   ├── products/
│   │   │   ├── product-list/
│   │   │   ├── product-form/
│   │   │   └── stock-adjust/
│   │   │
│   │   ├── suppliers/
│   │   │   ├── supplier-list/
│   │   │   └── supplier-form/
│   │   │
│   │   ├── customers/
│   │   │   ├── customer-list/
│   │   │   └── customer-form/
│   │   │
│   │   ├── sales/
│   │   │   └── sales-history/
│   │   │
│   │   ├── returns/
│   │   │   ├── return-list/
│   │   │   └── process-return/
│   │   │
│   │   ├── reports/
│   │   │   ├── daily-report/
│   │   │   └── sales-report/
│   │   │
│   │   ├── expenses/
│   │   │   └── expenses-list/
│   │   │
│   │   └── settings/
│   │       ├── salespersons/
│   │       └── general/
│   │
│   └── shared/
│       ├── components/
│       │   ├── confirm-dialog/
│       │   └── loading-spinner/
│       └── pipes/
│           ├── lkr-currency.pipe.ts
│           └── date-format.pipe.ts
│
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
└── styles.scss
```

### Routes
```typescript
const routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'pos', component: PosComponent },
      { path: 'products', component: ProductListComponent,
        canActivate: [OwnerGuard] },
      { path: 'suppliers', component: SupplierListComponent,
        canActivate: [OwnerGuard] },
      { path: 'customers', component: CustomerListComponent },
      { path: 'sales', component: SalesHistoryComponent },
      { path: 'returns', component: ReturnListComponent },
      { path: 'reports', component: DailyReportComponent,
        canActivate: [OwnerGuard] },
      { path: 'expenses', component: ExpensesComponent },
      { path: 'settings', component: SettingsComponent,
        canActivate: [OwnerGuard] },
      { path: '', redirectTo: 'pos', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'pos' }
];
```

---

## UI Screens Detail

### 1. Login Screen
```
Centered card with:
- Ghanim Enterprises gold logo (top)
- "Point of Sale" subtitle
- Username input
- Password input
- Login button (dark navy, full width)
- Copyright footer
```

### 2. Open Session Screen
```
Shows when no active session:
- "Start of Day" heading
- Cashier name input
- Opening float input (Rs.)
- "Open Session" button
- Previous session summary (optional)
```

### 3. Main POS Screen
```
Layout (desktop):
┌─────────────────────────────────────────────────────┐
│ SIDEBAR    │ MAIN CONTENT          │ CART PANEL      │
│            │                       │                 │
│ [Logo]     │ [Search bar] [Ctrl+K] │ Cart (4)  Clear │
│            │ [Barcode btn]         │ ─────────────── │
│ ● POS      │                       │ Item 1   x2 900 │
│ Products   │ [All][Plastic]        │ Item 2   x1 220 │
│ Customers  │ [Electronic]...       │ Item 3   x3 750 │
│ Sales      │                       │ ─────────────── │
│ Returns    │ ┌────┐ ┌────┐ ┌────┐ │ Subtotal: 1,870 │
│ Reports    │ │Prod│ │Prod│ │Prod│ │ Disc:       0   │
│ Expenses   │ │    │ │    │ │    │ │ Total:    1,870 │
│ Settings   │ │450 │ │220 │ │250 │ │                 │
│            │ │Stk:│ │Stk:│ │Stk:│ │ [Salesperson ▼] │
│            │ │ 12 │ │ 18 │ │  7 │ │ [RETAIL][WHOLE] │
│ [Admin  ▼] │ └────┘ └────┘ └────┘ │                 │
│ [Logout]   │                       │ [  CHECKOUT F2] │
│            │                       │ [ HOLD SALE F3] │
└────────────┴───────────────────────┴─────────────────┘

Bottom action bar:
[📷 Scan F4] [👤 Customer F5] [🕐 Recent F6] [⋯ More F7]
```

### 4. Product Card
```
┌──────────────────┐
│   [Product Image]│
│   or placeholder │
├──────────────────┤
│ Product Name     │
│ Rs. 450          │
│ Stock: 12 pieces │
└──────────────────┘

On hover: Add to cart button appears
Click: adds to cart with qty 1
```

### 5. Cart Item
```
[Product Image small] Product Name        [×]
                      Qty: [-] [2] [+]
                      Rs. 450 × 2 = Rs. 900
                      Discount: [___]%  = Rs. 0
```

### 6. Checkout Dialog
```
┌─────────────────────────────────┐
│ CHECKOUT                        │
├─────────────────────────────────┤
│ Items: 3    Subtotal: Rs. 1,870 │
│ Item discounts:       Rs.     0 │
│ Cart discount: [___]% Rs.     0 │
│ ─────────────────────────────── │
│ TOTAL:               Rs. 1,870  │
├─────────────────────────────────┤
│ Payment method:                 │
│ [CASH] [CARD] [CREDIT]          │
│                                 │
│ Cash given:  Rs. [__________]   │
│ Change:      Rs. 130            │
│                                 │
│ Customer name: [________] (opt) │
│ Notes: [________________] (opt) │
├─────────────────────────────────┤
│ [CANCEL ESC]  [CONFIRM SALE ↵]  │
└─────────────────────────────────┘
```

### 7. Receipt (screen + print)
```
┌─────────────────────────────┐
│      GHANIM ENTERPRISES     │
│        Badulla, Sri Lanka   │
│       Tel: 0777926804       │
│─────────────────────────────│
│ Date: 07/06/2026  10:32 AM  │
│ Sale #: 1045                │
│ By: Ahmed    Type: RETAIL   │
│─────────────────────────────│
│ Umbrella Med  x2  Rs.   900 │
│ Plastic Box   x1  Rs.   220 │
│ Cable 1m      x3  Rs.   750 │
│─────────────────────────────│
│ Subtotal:       Rs.   1,870 │
│ Discount:       Rs.       0 │
│ TOTAL:          Rs.   1,870 │
│─────────────────────────────│
│ Cash:           Rs.   2,000 │
│ Change:         Rs.     130 │
│─────────────────────────────│
│     Thank you! Come again   │
└─────────────────────────────┘

Buttons: [🖨️ PRINT] [NEW SALE] [CLOSE]
Print uses: window.print() for MVP
```

### 8. Hold Sale Dialog
```
┌──────────────────────────────┐
│ HOLD SALE                    │
│ Current cart will be saved   │
│                              │
│ Note: [____________________] │
│ e.g. "Ahmed customer - check │
│        wallet"               │
│                              │
│ [CANCEL]  [HOLD SALE]        │
└──────────────────────────────┘
```

### 9. Held Sales Panel
```
HELD SALES (2)
─────────────────────────────
#1  Ahmed customer           [Resume]
    Rs. 1,870 • 3 items
    10:32 AM

#2  Mohamed wholesale        [Resume]
    Rs. 15,000 • 8 items
    11:15 AM
─────────────────────────────
```

### 10. Daily Report (Owner)
```
DAILY REPORT — 07/06/2026

[Summary Cards]
Total Sales: 87    Amount: Rs. 163,800
Retail: Rs. 133,800    Wholesale: Rs. 30,000
Profit: Rs. 45,000     Margin: 27.6%

[BY SALESPERSON - Table]
Name      Sales  Amount      Profit
Ahmed     23     Rs.45,200   Rs.12,000
Mohamed   18     Rs.32,100   Rs. 8,500
Farhan    15     Rs.28,500   Rs. 7,200
Nizam     31     Rs.58,000   Rs.17,300
─────────────────────────────────────
Total     87     Rs.163,800  Rs.45,000

[CASH SUMMARY]
Opening float:    Rs.   5,000
Cash sales:       Rs. 133,800
Cash in:          Rs.       0
Cash out:         Rs.   1,500
Expected in drawer: Rs. 137,300

[PAYMENT METHODS]
Cash: Rs.133,800  Card: Rs.20,000  Credit: Rs.10,000
```

### 11. Return Screen
```
PROCESS RETURN

Step 1: Find original sale
[Search by Sale ID or date]
Sale #1045 - Ahmed - 07/06/2026 - Rs.1,870

Step 2: Select items to return
☑ Umbrella Med  x2  Rs. 900  [Return qty: 1]
☐ Plastic Box   x1  Rs. 220
☑ Cable 1m      x3  Rs. 750  [Return qty: 2]

Return value: Rs. 950

Step 3: Return type
[CASH REFUND]  [EXCHANGE]

Reason: [_______________________]

[PROCESS RETURN]
```

---

## Keyboard Shortcuts

```typescript
// Implement with @HostListener in POS component
const shortcuts = {
  'ctrl+k': 'focusSearch',
  'f2': 'openCheckout',
  'f3': 'holdSale',
  'f4': 'openBarcodeScanner',
  'f5': 'addCustomer',
  'f6': 'showRecentSales',
  'f7': 'showMoreActions',
  'f8': 'openCashDrawer',
  'escape': 'clearOrClose',
  'enter': 'addToCartOrConfirm'
};
```

---

## Business Logic

### Pricing logic
```typescript
// When item added to cart:
function getPrice(product, quantity, saleType) {
  if (saleType === 'WHOLESALE' &&
      quantity >= product.minWholesaleQty &&
      product.wholesalePrice) {
    return product.wholesalePrice;
  }
  return product.retailPrice;
}
```

### Discount calculation
```typescript
// Item level:
itemSubtotal = (unitPrice * qty) - itemDiscount
itemDiscount = unitPrice * qty * (itemDiscountPct / 100)

// Cart level:
subtotalAfterItemDiscounts = sum(all itemSubtotals)
cartDiscountAmount = subtotalAfterItemDiscounts * (cartDiscountPct / 100)
total = subtotalAfterItemDiscounts - cartDiscountAmount
```

### Change calculation
```typescript
changeAmount = cashTendered - total
// Show error if cashTendered < total
```

### Stock update on sale — SHOP stock only
```typescript
// After successful checkout:
// Always deduct from SHOP stock_locations
// POS only ever touches SHOP location

stockLocation = stockLocationsRepo
    .findByProductIdAndLocation(productId, 'SHOP');
stockLocation.quantity -= saleItem.quantity;
stockLocationsRepo.save(stockLocation);

// Record adjustment
StockAdjustment adjustment = new StockAdjustment();
adjustment.reason = 'SALE';
adjustment.location = 'SHOP';
adjustment.difference = -saleItem.quantity;
```

### Stock restore on return — SHOP stock
```typescript
// After return processed:
// Add returned qty back to SHOP stock only
stockLocation = stockLocationsRepo
    .findByProductIdAndLocation(productId, 'SHOP');
stockLocation.quantity += returnItem.quantity;
stockLocationsRepo.save(stockLocation);
```

### Stock helper — get shop stock for display
```typescript
// In product service:
getShopStock(productId: Long): Decimal {
    return stockLocationRepo
        .findByProductIdAndLocation(productId, 'SHOP')
        .map(sl -> sl.quantity)
        .orElse(0);
}

// POS always shows SHOP stock
// Never shows STORE stock in POS UI
```

### Product visible in POS
```typescript
// Products shown in POS search:
// show_in_pos = true AND active = true
// Regardless of product_source

// Both STORE_PRODUCT and SHOP_DIRECT
// appear in POS as long as show_in_pos = true
```

### Profit calculation
```typescript
// Per sale item:
profit = (unitPrice - costPrice) * quantity - discount

// Only if costPrice is set
// If no costPrice: show N/A
```

### Stock low warning (not enforced in MVP)
```typescript
// When adding to cart:
shopStock = getShopStock(productId);
if (shopStock < product.minStockAlert) {
    showWarning('Low stock: only ' + shopStock + ' left');
}
// Sale still proceeds — not blocked in MVP
```

---

## Security Rules

```
Public endpoints (no auth):
└── POST /api/auth/login

CASHIER + OWNER endpoints:
├── GET /api/products (all)
├── POST /api/sales/checkout
├── GET/POST /api/held-sales
├── POST /api/cash/in
├── POST /api/cash/out
├── POST /api/sessions/open
├── GET /api/sessions/current
└── POST /api/returns

OWNER only endpoints:
├── POST/PUT/DELETE /api/products
├── POST/PUT /api/categories
├── POST/PUT /api/suppliers
├── POST/PUT /api/salespersons
├── POST /api/sessions/{id}/close
├── GET /api/reports/*
├── GET /api/stock/adjustments
├── POST /api/stock/adjust
└── POST /api/sales/{id}/cancel
```

---

## Environment Variables

### Backend (.env)
```
DB_URL=jdbc:postgresql://host/ghanim_db?sslmode=require
DB_USERNAME=ghanim_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret_minimum_32_characters_long
ALLOWED_ORIGINS=https://pos.ghanimenterprises.lk,http://localhost:4200
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

### Frontend (environment.ts)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8081/api',
  imagekitEndpoint: 'https://ik.imagekit.io/your_id',
  imagekitPublicKey: 'your_public_key'
};
```

---

## ImageKit Integration

```typescript
// Upload product image
// Use imagekitio-angular package

// In product form:
<ik-upload
  fileName="product-{{productId}}"
  folder="/products"
  (onSuccess)="onImageUpload($event)"
  (onError)="onImageError($event)">
</ik-upload>

// Display with transformation:
<ik-image
  [path]="product.imageUrl"
  [transformation]="[{height: '200', width: '200', crop: 'maintain_ratio'}]">
</ik-image>

// Placeholder if no image:
<img *ngIf="!product.imageUrl"
     src="assets/no-image.png"
     alt="No image">
```

---

## Receipt Printing (MVP = Browser Print)

```typescript
// In receipt component:
printReceipt() {
  window.print();
}

// receipt.component.scss:
@media print {
  body * { visibility: hidden; }
  .receipt-content,
  .receipt-content * { visibility: visible; }
  .receipt-content {
    position: absolute;
    left: 0; top: 0;
    width: 80mm;  // thermal paper width
    font-family: monospace;
    font-size: 12px;
  }
  .no-print { display: none; }
}
```

---

## Deployment

### Backend on OCI server
```bash
# Build
mvn clean package -DskipTests

# Copy to server
scp target/pos-backend.jar ubuntu@server-ip:/opt/pos/

# Create systemd service
sudo nano /etc/systemd/system/pos.service

[Unit]
Description=Ghanim POS Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/opt/pos
EnvironmentFile=/opt/pos/.env
ExecStart=java -jar /opt/pos/pos-backend.jar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl enable pos
sudo systemctl start pos
```

### Nginx config
```nginx
server {
    server_name pos-api.ghanimenterprises.lk;

    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Frontend on Vercel
```bash
# Build
ng build --configuration production

# Deploy to Vercel
vercel --prod

# Domain: pos.ghanimenterprises.lk
```

---

## Build Order for Claude Code

```
Step 1: Database
└── Create all migration SQL files
    Run migrations on dev DB

Step 2: Spring Boot
├── Project setup + pom.xml
├── application.properties
├── Entities (all tables)
├── Repositories
├── Security + JWT
├── Auth endpoint (login)
├── Product endpoints
├── Category + Supplier endpoints
├── Salesperson endpoints
├── Session endpoints
├── Sale/Checkout endpoint
├── Held sale endpoints
├── Cash movement endpoints
├── Return endpoints
├── Stock endpoints
└── Report endpoints

Step 3: Angular
├── Project setup
├── Core services + models
├── JWT interceptor + Auth guard
├── Login screen
├── Main layout + sidebar
├── Open session screen
├── POS main screen
│   ├── Product grid
│   ├── Category filter
│   ├── Search
│   ├── Cart panel
│   ├── Cart items with discount
│   ├── Salesperson dropdown
│   ├── Retail/Wholesale toggle
│   ├── Checkout dialog
│   ├── Receipt dialog
│   ├── Hold sale dialog
│   └── Held sales panel
├── Products management
├── Supplier management
├── Sales history
├── Returns screen
├── Daily report
├── Stock adjustment
└── Settings

Step 4: Testing + Polish
├── Test all flows
├── Mobile responsive
├── Keyboard shortcuts
└── Error handling
```

---

## Notes for Claude Code

```
1.  Use Angular 17 standalone components throughout
2.  Use Angular Material for all UI components
3.  Dark navy sidebar: #1a2332
4.  Gold accent: #c9a84c (from Ghanim logo)
5.  Currency always display as: Rs. X,XXX (LKR)
6.  Date format: DD/MM/YYYY
7.  All amounts: 2 decimal places
8.  pos schema for POS tables
9.  public schema for products, users, categories,
    stock_locations, stock_transfers
10. Soft delete (active=false) never hard delete
11. All API responses wrapped in standard format:
    { success: boolean, data: T, message: string }
12. JWT in localStorage key: 'pos_token'
13. Session stored in localStorage: 'pos_session'
14. Print via window.print() for MVP
15. No barcode scanning in MVP (add in Phase 2)
16. Stock is NOT enforced in MVP
    (warn if low but allow sale)
17. Snapshots: store product name + price in
    sale_items at time of sale (prices can change)
18. Business name: GHANIM ENTERPRISES
19. Location: Badulla, Sri Lanka
20. Phone: 0777926804
21. Default salespersons: Ahmed, Mohamed, Farhan, Nizam
22. Default supplier for existing stock: "General Stock"

STOCK ARCHITECTURE (critical):
23. POS ONLY manages SHOP stock
    Never touch STORE stock from POS
    STORE stock = Wholesale system responsibility (future)

24. Stock is in public.stock_locations table
    NOT in public.products directly
    Always query stock_locations for quantities:
    SELECT quantity FROM public.stock_locations
    WHERE product_id = ? AND location = 'SHOP'

25. When product added to POS for first time:
    Create stock_locations record:
    INSERT INTO public.stock_locations
    (product_id, location, quantity)
    VALUES (?, 'SHOP', 0)

26. product_source field values:
    STORE_PRODUCT  = comes from wholesale store
    SHOP_DIRECT    = shop buys directly
    BOTH           = exists in both

27. POS product form must set:
    product_source (dropdown)
    show_in_pos = true (default)
    show_online (owner decides)
    fulfillment_source (SHOP or STORE)

28. In POS product grid:
    Show SHOP stock quantity only
    Never show STORE stock in POS UI

29. Stock adjustment always records location = 'SHOP'
    All POS stock movements are SHOP location

30. For gradual stock entry:
    Owner can set approximate quantities first
    Use stock adjustment reason = 'INITIAL_ENTRY'
    Can correct later with reason = 'CORRECTION'

31. Ecommerce integration (future - not in MVP):
    Ecommerce reads from stock_locations
    STORE_PRODUCT with fulfillment_source=STORE
        → reads STORE location quantity
    SHOP_DIRECT with fulfillment_source=SHOP
        → reads SHOP location quantity
    show_online flag controls visibility
    online_price used for ecommerce display

ECOMMERCE COMPATIBILITY (critical):
32. Ecommerce Spring Boot runs on port 8080
    POS Spring Boot runs on port 8081
    Different apps, same DB, no conflict

33. NEVER drop or recreate public.products table
    It already exists with ecommerce data
    Only ALTER TABLE to add new columns
    Migration file name: V4__alter_products_add_pos_columns.sql

34. NEVER drop or recreate public.categories table
    Already exists in ecommerce
    Use CREATE TABLE IF NOT EXISTS only

35. products.stock column must STAY in table
    Ecommerce still reads it directly
    POS reads stock_locations.quantity instead
    Both coexist without conflict ✅

36. Flyway configuration for existing DB:
    spring.flyway.baseline-on-migrate=true
    spring.flyway.baseline-version=0
    Prevents Flyway failing on existing tables

37. Product entity package in POS:
    com.ghanim.pos.entity.Product
    Maps to same public.products table
    as ecommerce lk.ghanim.api.entity.Product
    No conflict — completely separate apps ✅

38. When POS creates any new product:
    Must ALSO create stock_locations record:
    location = 'SHOP', quantity = initialStock
    This is done in ProductService.create()

39. StockLocationRepository must have:
    Optional<StockLocation>
    findByProductIdAndLocation(Long id, String loc)

40. ProductRepository must have:
    findByShowInPosTrue() — for POS grid
    findByNameContainingIgnoreCaseAndShowInPosTrue()
    findByBarcode(String barcode) — for scanner
    findByCategoryIdAndShowInPosTrue() — for filter

41. Existing ecommerce categories table may have
    different columns than what POS expects.
    Category entity should only map id and name
    to avoid column mismatch errors.
    Use @Column annotations carefully.
```

---

## Phase 2 Features (After MVP)

```
Hardware:
├── Bluetooth printing (Web Bluetooth API)
│   └── XP-T80Q receipt printer
│   └── XP-365B label printer
├── Barcode camera scanning (ZXing)
└── Cash drawer trigger (ESC/POS command)

Stock & Operations:
├── Store → Shop transfer receiving in POS
├── Low stock alerts + notifications
├── Supplier purchase orders (shop direct)
├── Barcode label printing for products
└── Excel export for reports

Sales:
├── Customer loyalty/credit tracking
├── Multiple payment split
│   (part cash + part card)
└── End of day auto-email to owner

Ecommerce Integration:
├── Link ecommerce to stock_locations table
├── STORE_PRODUCT orders → deduct STORE stock
├── SHOP_DIRECT orders   → deduct SHOP stock
├── show_online flag controls product visibility
├── online_price field for ecommerce pricing
└── Stock buffer to prevent overselling online

Wholesale System (System 2 — future):
├── Manages STORE stock location
├── Store → Shop transfer creation
├── Agent/wholesale billing
└── Feeds into FMS for payment tracking
```

---

## Ecommerce Linking Plan (Phase 2 Detail)

```
Current ecommerce (already built):
└── Has own product management

After linking to shared DB:
└── Products from public.products
└── Stock from public.stock_locations
└── Owner manages products from POS only

Fields used by ecommerce:
├── show_online = true  → visible on website
├── online_price        → displayed price
├── image_url           → product image
├── fulfillment_source  → where stock comes from
│   STORE → check STORE location quantity
│   SHOP  → check SHOP location quantity
└── category_id         → for website categories

Ecommerce stock check:
SELECT sl.quantity
FROM public.stock_locations sl
WHERE sl.product_id = ?
AND sl.location = p.fulfillment_source
-- STORE or SHOP depending on product

Online buffer (prevent overselling):
├── Do not show full quantity online
├── Show: actual_qty - buffer (e.g. 5)
└── Configurable per product (future)
```
