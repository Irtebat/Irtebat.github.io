---
sidebar_position: 0
---
# Databricks

Mental models for Unity Catalog, identity, and open-table access: who a principal is, what it may touch, and how an external engine is allowed to reach managed data.

## Index

* [**Metastore, storage roots, and admin boundaries**](./metastore-storage-roots.md) - Where managed bytes live, and why creating an identity is not the same as governing it.
* [**AIM, SCIM, and workspace identity**](./aim-scim-workspace-identity.md) - How users, groups, and service principals enter Databricks, and when a workspace identity is known at the account.
* [**OAuth client registrations**](./oauth-client-registrations.md) - Registration types for U2M and M2M against the account OIDC provider.
* [**External access to UC managed tables**](./external-access-managed-tables.md) - Unity REST vs Iceberg REST, catalog commits, and what “supports Delta” actually buys you.
* [**Lakebase vector and text search**](./lakebase-search.md) - Semantic and keyword search inside Lakebase Postgres (`lakebase_vector` / `lakebase_text`).
