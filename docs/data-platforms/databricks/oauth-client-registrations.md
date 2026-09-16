---
sidebar_position: 3
---
# OAuth client registrations

OAuth 2.0 requires every client to be pre-registered with the authorization server (the Databricks account OIDC provider) so it has a known `client_id`, redirect URIs, and scopes. Databricks offers several registration types depending on *who* the client is and *how* it is distributed.

**Rule of thumb:** U2M (user login) = app integrations; M2M (unattended) = service principals. 
## OIDC endpoints

Per workspace unless noted:

```text
Discovery : https://<workspace-host>/oidc/.well-known/oauth-authorization-server
Authorize : https://<workspace-host>/oidc/v1/authorize
Token     : https://<workspace-host>/oidc/v1/token                          # U2M
Token     : https://accounts.cloud.databricks.com/oidc/accounts/<account-id>/v1/token  # M2M, account
```

## Registration types

| Type                                 | Who / how                                    | `client_id`                   | Auth flow                                                        |
| ------------------------------------ | -------------------------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| **Built-in CLI client**              | Ships on every account                       | fixed `databricks-cli`        | U2M (`authorization_code` + PKCE). M2M uses a service principal. |
| **Custom app integration**           | One account admin registers a private app    | auto-gen, per account         | U2M (`authorization_code` + PKCE)                                |
| **Published app integration**        | ISV registers once; enabled by many accounts | auto-gen once, global         | U2M (`authorization_code`)                                       |
| **Service principal + OAuth secret** | A non-human identity in an account           | the SP’s `client_id` + secret | M2M (`client_credentials`)                                       |
| **Databricks App (hosting product)** | A deployed app gets its own identity         | provisioned at deploy         | M2M (`client_credentials`) + OBO token-exchange                  |

### 1. Built-in `databricks-cli` client

- **Purpose:** zero-setup U2M / M2M ( for service principal ) login for the CLI / SDK / Terraform. U2M uses the built-in client.
- **Redirect:** `http://localhost:8020`. Uses the standard OIDC endpoints above.

### 2. Custom OAuth app integration

- **Purpose:** an internal tool or agent authenticates users via U2M (`authorization_code` + PKCE) with short-lived, scoped tokens instead of PATs. `client_id` is valid only in the registering account.
- **Create:** account console → *Settings → App connections*, or `POST /api/2.0/accounts/<account-id>/oauth2/custom-app-integrations` (CLI: `databricks account custom-app-integration create`).
- **Redirect:** URIs you register — `localhost` for local tools, HTTPS callbacks for hosted apps.

### 3. Published OAuth app integration

- **Purpose:** an ISV ships one binary to many customers (Tableau, Power BI, dbt, DataGrip). The same hardcoded `client_id` must work on every Databricks account, so it is generated once at publish time and each customer account enables / consents — like “Sign in with Google.”
- **Create:** `POST /api/2.0/accounts/<account-id>/oauth2/published-app-integrations`. Customers enable the published `client_id` in their account.
- **Redirect:** vendor-fixed (e.g. `https://<vendor-app>/oauth/callback`).

### 4. Service principal with OAuth secret (M2M)

- **Purpose:** unattended automation — jobs, CI/CD, backends — authenticate **as a service principal**, no human, via client-credentials.
- **Create:** account / workspace SP → add an OAuth secret (`client_id` + `client_secret`).
- **Token:** `…/oidc/accounts/<account-id>/v1/token` with `grant_type=client_credentials`.

### 5. Databricks App identity (the Apps hosting product)

- **Purpose:** a deployed Databricks App (e.g. `*-mcp-server-….databricksapps.com`) automatically gets its own OAuth service-principal identity and can act on the caller’s behalf. Distinct from registering a *client* — it is an app the platform runs and identifies.
- **URI:** `https://<app-name>-<workspace-id>.<region>.databricksapps.com/…`.

## Choosing

| You are building… | Register… |
| ----------------- | --------- |
| An internal tool that logs users in | Custom app integration (U2M) |
| Automation / CI as a robot | Service principal + OAuth secret (M2M) |
| Software you distribute to other Databricks customers | Published app integration |
| A UI / service you host on Databricks | Databricks App |

## Governance

All of these are account-level securables (except the App’s runtime identity). An account admin can list, scope, and revoke any registration centrally, and every app is a distinct, auditable identity. Registering requires account admin.
