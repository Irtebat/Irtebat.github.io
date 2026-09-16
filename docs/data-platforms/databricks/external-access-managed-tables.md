---
sidebar_position: 4
---
# External access to UC managed tables

Unity Catalog exposes two open REST paths for external engines: **Unity REST** (Delta clients) and **Iceberg REST Catalog** (Iceberg clients). Table-format support in an engine is not the same as support for the UC integration protocol.

*Last checked: 27 August 2026. This area moves quickly — see [Re-check](#re-check) before relying on this for a new implementation.*

## Mental model

```text
                            Unity Catalog
                           /             \
                          /               \
                 Unity REST API      Iceberg REST Catalog
                       |                    |
                  Delta clients        Iceberg clients
                       |                    |
               Managed Delta        Managed Iceberg
                Read / Write         Read / Write
                       |
                       +---- Delta table with Iceberg Reads
                                  can also be exposed through
                                  Iceberg REST as READ-ONLY
```

- An engine can understand `_delta_log` and still lack the Unity REST integration required for governed access to UC **managed** Delta.
- An Iceberg-capable engine can use the standardized Iceberg REST Catalog protocol against UC.

## Path A — Unity REST API (Delta clients)

The Unity REST API lets supported external **Delta Lake clients** access Delta tables registered in Unity Catalog.

For UC managed Delta, Databricks currently documents:

| Operation | Managed Delta |
| --------- | ------------- |
| Read | Yes |
| Write | Yes\* |
| Create | Yes\* |

\* External writes and creation of managed Delta tables require **catalog commits**. Creating and writing managed tables through external Delta clients is currently **Public Preview**.

```text
External Delta engine
        |
        | Unity REST integration
        v
Unity Catalog
  - authentication / authorization
  - metadata
  - credential vending
  - catalog-managed commit coordination
        |
        v
Cloud object storage → UC managed Delta
```

The external engine still performs Delta operations. Unity Catalog is not a row-oriented CRUD API. `SELECT` / `INSERT` / `UPDATE` / `DELETE` / `MERGE` work only if the client supports both the relevant Delta table features **and** the Databricks Unity REST integration.

### Catalog commits

External writes to **managed** Delta must go through UC-controlled commit coordination. The table needs catalog-managed commits:

```sql
CREATE TABLE catalog.schema.orders (
  id BIGINT,
  amount DOUBLE
)
USING DELTA
TBLPROPERTIES ('delta.feature.catalogManaged' = 'supported');
```

```text
Databricks writer --------\
                           \
                            > Unity Catalog commit coordination
                           /
External Delta writer ----/
                             v
                       Managed Delta
```

An external engine should not independently mutate the Delta transaction state of a UC managed table while bypassing that path.

### Supported Delta clients

As of 27 August 2026, Databricks documents:

- **Supported:** Apache Spark
- **Beta:** Apache Flink, DuckDB, StreamNative, Starburst

**OSS Trino is not listed** as a Unity REST Delta client. Trino still has a Delta Lake connector for other catalog/storage setups; the missing piece is the **current** Databricks Unity REST integration for UC managed Delta. The old Databricks Unity Catalog HTTP integration was removed in **Trino 473**. Current Trino docs point UC users at **Iceberg REST**.

Starburst *is* listed as a Beta Delta client for Unity REST.

### Permissions and setup

Typical requirements:

- External data access enabled on the metastore
- `EXTERNAL USE SCHEMA`
- `SELECT` for reads, `MODIFY` for writes, `CREATE` on the schema for table creation
- `EXTERNAL USE LOCATION` where applicable for external tables
- PAT or OAuth
- Catalog commits enabled for external writes to managed Delta

UC can **vend temporary storage credentials** to supported engines, scoped to the Databricks principal and its UC privileges.

### Limitations

Current docs include:

- Some table / property alterations are not supported.
- External clients cannot run managed-table maintenance (`OPTIMIZE`, `VACUUM`, `ANALYZE`).
- Support depends on the Delta protocol / table features the client understands.
- Databricks warns against unsafe concurrent modification of the same Delta data from different writer clients, particularly on S3.

## Path B — Iceberg REST Catalog

UC implements the Apache Iceberg REST Catalog API. Current endpoint:

```text
/api/2.1/unity-catalog/iceberg-rest
```

```text
External Iceberg engine
        |
        | Iceberg REST Catalog protocol
        v
Unity Catalog
  - catalog metadata
  - authorization
  - credential vending
        |
        v
UC table / object storage
```

Engines with Iceberg REST support include Spark, Flink, Trino, and others.

For a **UC managed Iceberg** table:

| Operation | Managed Iceberg |
| --------- | --------------- |
| Read | Yes |
| Write | Yes |
| Create | Yes |

That is the natural path for Trino (Iceberg connector) when the UC table is Iceberg.

## Reading Delta through Iceberg REST

A UC Delta table can enable **Iceberg Reads**. Databricks uses Delta **UniForm** metadata generation so Iceberg clients can interpret the same Parquet data without converting or duplicating the table.

```text
             UC Managed Delta
                    |
          Delta transaction metadata
                    |
          +---------+---------+
          |                   |
     Delta client       Generated Iceberg
                         metadata (UniForm)
                              |
                              v
                     Iceberg REST Catalog
                              |
                              v
                         Iceberg client
```

| UC table type | Read via Iceberg REST | Write via Iceberg REST |
| ------------- | --------------------- | ---------------------- |
| Managed Iceberg | Yes | Yes |
| Foreign Iceberg | Yes | No |
| Managed Delta + Iceberg Reads | Yes | **No** |
| External Delta + Iceberg Reads | Yes | **No** |

Use this for **read interoperability**: the engine has Iceberg REST but not Databricks Unity REST. Databricks still treats the authoritative table as Delta. It is **not** a route for an Iceberg client to modify the Delta table.

## Trino as a worked example

Trino understands both Delta and Iceberg as formats. That is not enough.

| Path | Result (as of 27 Aug 2026) |
| ---- | -------------------------- |
| Trino Delta connector → ordinary metastore + object storage | Format works (read / various writes) — not the UC managed-table integration |
| Trino Delta connector → current Unity REST for UC managed Delta | **Not listed / not a supported path** |
| Trino Iceberg connector → UC Iceberg REST → managed Iceberg | Read + write |
| Trino Iceberg connector → UC Iceberg REST → managed Delta + Iceberg Reads | **Read-only** — the clean UC-governed way for OSS Trino to query managed Delta today |

Starburst, not OSS Trino, is the Beta Unity REST Delta client.

## Summary

| External client path | UC managed Delta | UC managed Iceberg |
| -------------------- | ---------------- | ------------------ |
| Delta client → **Unity REST API** | Read / Write / Create\* | Not the normal path |
| Iceberg client → **Iceberg REST Catalog** | Read-only when Iceberg Reads is enabled | Read / Write / Create |
| OSS Trino Delta → current UC REST | Not currently listed as supported | N/A |
| OSS Trino Iceberg → UC Iceberg REST | Read-only via Iceberg Reads | Read / Write |
| Starburst Delta → Unity REST | Beta | N/A |

\* Managed Delta external write/create requires catalog commits; currently Public Preview.

## Decision tree

```text
What is the UC managed table format?
|
+-- DELTA
|    +-- Engine supports Databricks Unity REST Delta integration?
|    |       YES → Unity REST API (Read / Write / Create*)
|    |       NO  → Engine supports Iceberg REST?
|    |               YES → enable Iceberg Reads → read-only
|    |               NO  → other interoperability mechanisms
|    * managed writes require catalog commits
|
+-- ICEBERG
     +-- Engine supports Iceberg REST?
             YES → UC Iceberg REST Catalog (Read / Write / Create)
```

## Takeaway

Do not reason only from the table format:

> “Engine X supports Delta, therefore it can write UC managed Delta.”

The correct question:

> “Does Engine X support both the table format **and** the Unity Catalog external-access protocol required for this table?”

```text
Managed Delta write  = Delta client + Unity REST + catalog commits
Managed Iceberg      = Iceberg client + Iceberg REST Catalog
Delta as Iceberg     = Iceberg Reads / UniForm + Iceberg REST  → read-only
```

## Re-check

External-engine support changes quickly. Revisit:

1. Has OSS Trino gained Unity REST Delta client support?
2. Has managed Delta external write/create moved from Public Preview to GA?
3. Has the supported Delta-client list expanded?
4. Have Iceberg REST writes to Delta / UniForm tables become supported?
5. Have catalog-commit requirements or limitations changed?
6. Which engines now support UC credential vending?
7. Are row filters, column masks, or ABAC supported by the engine / version in use?
8. Which Delta and Iceberg protocol versions / table features does that client version support?

| Page | Why |
| ---- | --- |
| [Access Databricks tables from Delta clients](https://docs.databricks.com/aws/en/external-access/unity-rest) | Supported Delta clients, preview/GA, catalog commits, limitations |
| [Access Databricks tables from Apache Iceberg clients](https://docs.databricks.com/aws/en/external-access/iceberg) | Iceberg REST endpoint, managed Iceberg R/W, Delta + Iceberg Reads |
| [Access Databricks data using external systems](https://docs.databricks.com/aws/en/external-access) | Top-level architecture and capability matrix |
| [UC managed tables for Delta Lake and Apache Iceberg](https://docs.databricks.com/aws/en/tables/managed) | Broader managed-table interoperability model |
| [UC credential vending](https://docs.databricks.com/aws/en/external-access/credential-vending) | Short-lived storage / table / path credentials |
| [Read Delta Lake tables with Iceberg clients](https://docs.databricks.com/aws/en/delta/iceberg-reads) | UniForm, protocol versions, limitations |
| [Trino data lake components](https://trino.io/ecosystem/data-lake.html) | Current recommended UC integration (Iceberg REST after Trino 473) |
| [Trino release 473](https://trino.io/docs/current/release/release-473.html) | Removal of the deprecated Databricks UC HTTP integration |
