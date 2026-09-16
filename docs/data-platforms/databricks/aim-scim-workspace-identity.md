---
sidebar_position: 2
---
# AIM, SCIM, and workspace identity

How users, groups, and service principals get into Databricks — and whether a workspace-created identity is also known at the account. SCIM and AIM only govern **IdP-sourced** principals. Unity Catalog still resolves those principals at the **account**.

## SCIM vs AIM

| | **SCIM** | **AIM (Automatic Identity Management)** |
| --- | --- | --- |
| **What** | SCIM 2.0 connector. The IdP pushes creates / updates / deletes to the Account SCIM API on a schedule. | Databricks-built sync. Reads Entra ID (Graph) as source of truth and provisions just-in-time on first use. |
| **Direction** | IdP → Databricks (scheduled; ~20–40 min for Entra). | Databricks pulls from Entra (on-demand + background refresh). |
| **IdP support** | Entra ID, Okta, and others. | Entra ID only, single tenant (no cross-tenant). |
| **Service principals** | Entra connector does **not** sync them. | Surfaces them. |
| **Groups** | Direct members only (no nested / transitive expansion). | Expands nested groups. |
| **Latency** | Connector schedule. | Near-real-time (browser sign-in ~5 min; non-browser up to ~40 min). |
| **Setup** | Enterprise app in the IdP. | Enable in Databricks (identity federation on ≥1 workspace). No SCIM connector to build. |
| **Default** | — | Enabled by default for Azure Databricks accounts created after 2025-08-01. |

## How to choose

**Choose AIM** on Entra ID when you want service-principal support, nested groups, and near-real-time sync, and at least one workspace is identity-federated.

**Keep SCIM** for non-Entra IdPs, cross-tenant identities, or automation that depends on SCIM-pushed membership. Example: IdP SCIM push into cloud-native identities (AWS IAM Identity Center / GCP Cloud Identity), SSO into Databricks, JIT provisioning.

**Migrating SCIM → AIM:** run both in parallel, validate `externalId` / `objectId` alignment and nested-group behavior, then retire SCIM.

## Where an identity originates

- **IdP-sourced** (Entra ID / Okta / …): brought in by SCIM or AIM. *These are the only principals SCIM/AIM govern.*
- **Databricks-managed**: created directly in Databricks (UI / CLI / API / Terraform) — no IdP involved. Example: `databricks service-principals create`.

## Workspace vs account (identity federation)

Whether a *workspace* identity is also known at the *account* is decided by **identity federation** (a Databricks-internal workspace-to-account setting), not by SCIM or AIM.

**Federated workspace** — creating a user or SP “in” the workspace actually creates it at the account and assigns it:

| Created in the workspace | Account presence? |
| ------------------------ | ----------------- |
| User | Yes |
| Service principal | Yes |
| Group | **No.** Create groups as account groups (account console / account API), or let SCIM/AIM bring in an IdP group. |

**Legacy non-federated** — the workspace keeps a local identity store; identities stay workspace-only.

Unity Catalog resolves principals at the **account**. UC can grant only to account-visible identities. Creating the principal is still not the same as granting it data access — that boundary is in [Metastore, storage roots, and admin boundaries](./metastore-storage-roots.md).
