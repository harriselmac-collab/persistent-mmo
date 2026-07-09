# Database — PostgreSQL Relational Schema & Mechanics

This directory contains the core database architecture, tables, relational structures, stored procedures, and triggers.

## Core Philosophy
1.  **Data-Driven Mechanics**: Game mechanics (experience curves, energy consumption rates, marketplace fees, item modifiers) are stored entirely in tables (`game_config`, `item_templates`, etc.) instead of hardcoded in code.
2.  **Row Level Security (RLS)**: No table is accessible without a strict RLS policy. Write permissions are restricted to authenticated owners or authorized roles, and sensitive administrative tables require service-role clearance.
3.  **Encapsulation**: Write complex state transitions (such as purchasing a factory or waging war) in PL/pgSQL database functions (RPCs) to ensure ACID compliance.

## Folder Structure
```
database/
├── schemas/              # SQL schema definition scripts
│   ├── 01_users.sql      # User profile, statistics, experience, energy
│   ├── 02_economy.sql    # Companies, marketplace, transactions, items
│   └── 03_politics.sql   # Countries, regions, elections, taxes
├── functions/            # Custom PL/pgSQL triggers and functions
└── policies/             # Row Level Security (RLS) scripts
```
