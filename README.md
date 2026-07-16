# iex-dashboard



# IEX-Dashboard Architecture Design

Below are the High-Level Design (HLD) and Low-Level Design (LLD) diagrams for the IEX-Dashboard project. 

## 1. High-Level Design (HLD)
The HLD outlines the overall system architecture, demonstrating how the frontend, backend, database, and external clients interact with one another.

```mermaid
flowchart TD
    subgraph frontend ["Frontend UI (React SPA)"]
        UI[Dashboard Interface]
    end

    subgraph backend ["Backend Server (Node.js/Express)"]
        API[API Controllers]
        Calc[Savings Calculator Engine]
        Export[Excel Exporter]
    end

    subgraph database ["Database (PostgreSQL)"]
        DB[(Relational DB / Prisma)]
    end

    UI <-->|HTTP REST| API
    API --> Calc
    API --> Export
    Calc <-->|Read/Write| DB
    Export -->|Read| DB
```

## 2. Component Interaction Flow (HLD)
A deeper look into the exact request flow when a user runs a Savings Calculation simulation.

```mermaid
sequenceDiagram
    participant User as React Frontend
    participant API as API Controller
    participant Engine as Savings Calculator Service
    participant DB as Prisma (PostgreSQL)

    User->>API: POST /api/savings-calculator/calculate
    API->>Engine: calculateSavings(input)
    
    rect rgb(200, 220, 240)
        Note right of Engine: Market Intelligence Gathering
        Engine->>DB: Fetch historical Dam/Rtm/Gdam MCP for exact dates
        DB-->>Engine: Raw 15-min Market Clearing Prices
        Engine->>DB: Fetch StateCharges & Tariffs (for State & Voltage)
        DB-->>Engine: Surcharges (STU, Wheeling, CTU, FPPA)
    end
    
    rect rgb(220, 240, 200)
        Note right of Engine: Simulation Engine
        Engine->>Engine: Filter non-working holidays
        Engine->>Engine: Run 96-slot Load Shifting Algorithm
        Engine->>Engine: Calculate Landed OA Cost vs DISCOM Baseline
        Engine->>Engine: Apply 7.5% ED and Retroactive FPPA logic
    end

    Engine-->>API: JSON: Detailed Simulation Results & Graphs
    API-->>User: Render Dashboard
```

## 3. Low-Level Design (LLD) - Database ERD
The Low-Level Design highlights the relational database schema, which tracks time-series market data, regional tariff regulations, and user inputs.

```mermaid
erDiagram
    SavingsCalculatorEntry ||--o{ StateTariff : "Matches By State/Voltage"
    SavingsCalculatorEntry ||--o{ DamRecord : "Simulates Against"
    
    Dataset ||--|{ DamRecord : "Contains"
    Dataset ||--|{ RtmRecord : "Contains"
    Dataset ||--|{ GdamRecord : "Contains"

    Dataset {
        int id PK
        string market "DAM, RTM, GDAM"
        date deliveryDate
        string status
    }

    DamRecord {
        int id PK
        int datasetId FK
        int intervalNumber "1-96 (15 min slots)"
        decimal mcp "Market Clearing Price"
    }

    StateTariff {
        int id PK
        string state
        string supplyVoltageCategory
        string todStartTime
        string todEndTime
        decimal energyRate
    }

    StateCharges {
        int id PK
        string state
        decimal crossSubsidy
        decimal stuCharges
        decimal demandFixedChargeKvaPerMonthRs
    }
    
    FppaCharges {
        int id PK
        string state
        int month "YYYYMM"
        decimal fppaChargePercent
    }

    SavingsCalculatorEntry {
        string id PK
        string clientName
        decimal contractDemandKva
        decimal sanctionedLoadKw
        string stateCode
        json consumptionData
    }
```

## 4. Class / Module Design (LLD)
A look at the backend modular architecture.

```mermaid
classDiagram
    class SavingsCalculatorController {
        +calculateSettings(req, res)
        +exportExcelReport(req, res)
    }

    class SavingsCalculatorService {
        +calculateSavings(entry, dates)
        +calculateMarketDecision(entryId, month)
        -calculateProratedDemandCharge()
    }

    class PersistenceService {
        +saveDraftEntry(data)
        +fetchEntryById(id)
    }

    class DatabaseClient {
        <<PrismaClient>>
        +DamRecord
        +RtmRecord
        +StateTariff
        +FppaCharges
    }

    SavingsCalculatorController --> SavingsCalculatorService : "Uses"
    SavingsCalculatorController --> PersistenceService : "Uses"
    SavingsCalculatorService --> DatabaseClient : "Queries Market & Tariffs"
    PersistenceService --> DatabaseClient : "Saves User Inputs"
```


