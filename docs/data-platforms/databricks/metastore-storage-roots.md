---
sidebar_position: 1
---
# Metastore, storage roots, and admin boundaries

The metastore is the top-level Unity Catalog container. It decides where managed table bytes go by default, and it is a different admin plane from “this principal exists.”

## The metastore

- One metastore per region, per account; workspaces attach to it.
- It holds the securable hierarchy: metastore → catalog → schema → table / view / volume / …
- Governance authority flows top-down: account admin → metastore admin → catalog owner → schema owner → …

## Where managed table data lives

When UC stores a **managed** table, the bytes go to cloud object storage (S3 / ADLS / GCS). Two ways that location is chosen:

| Mode | Who owns the bucket | How it is set |
| ---- | ------------------- | ------------- |
| **Storage root (BYO)** | You | Admin sets a default path on the metastore at creation. Managed tables inherit it unless a catalog or schema overrides with `MANAGED LOCATION`. |
| **Default Storage (Databricks-managed)** | Databricks | Metastore storage-root is empty (`null`). Storage is attached **per catalog** through the managed UI / API flow. |

**Gotcha.** Default Storage being enabled on the account is not the same as a metastore storage root existing. `CREATE CATALOG` with no `MANAGED LOCATION`, against a metastore that has no storage root, fails with:

```text
Metastore storage root URL does not exist. Default Storage is enabled in your account…
```

Create that catalog through the managed UI/API (so Default Storage can attach), or pass an explicit `MANAGED LOCATION`.

## Creating identity vs governing identity

| Plane | Question it answers | Who administers it | Examples |
| ----- | ------------------- | ------------------ | -------- |
| **Identity** | Does this principal *exist*? | Account admin or workspace admin (account users / SPs / groups) | Create a user, service principal, or group |
| **Data governance (UC)** | What may this principal *access*? | Account admin or metastore admin + object owners | `CREATE CATALOG`, `GRANT SELECT`, ownership |
| **Workspace** | Workspace resources and settings | Workspace admin | Clusters, jobs, warehouses, workspace ACLs |

Creating a user / SP / group is an **identity** action. It never touches the metastore. A workspace admin can do it (and in a federated workspace, users and SPs get account presence; groups do not).

Governing data is a **UC** action. `CREATE CATALOG` is a metastore-level privilege. A workspace admin does **not** have it by default.

If you are a workspace admin but not a metastore admin:

```text
PERMISSION_DENIED: User does not have CREATE CATALOG on Metastore
```

Being able to create identities and own a workspace does not grant authority to create top-level UC securables. See [AIM, SCIM, and workspace identity](./aim-scim-workspace-identity.md) for how principals get account presence.

## Delegable vs role-based powers

**Delegable** — grant a specific metastore privilege without making someone admin:

- `GRANT CREATE CATALOG ON METASTORE TO <principal>`
- `CREATE EXTERNAL LOCATION`, `CREATE STORAGE CREDENTIAL`, `CREATE CONNECTION`
- Delta Sharing creates
- Per-object ownership transfer (`ALTER … OWNER TO`)

**Role / ownership-based** — not grantable à la carte:

- Setting the metastore storage root
- Assigning the metastore to workspaces
- The admin’s blanket “manage everything”
- Designating the metastore-admin group

To hand those over, change the metastore-admin group (an account-admin action).
