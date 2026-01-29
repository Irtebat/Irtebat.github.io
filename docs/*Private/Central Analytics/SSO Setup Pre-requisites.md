
*23/1/26*


Enable SSO for Confluent Control Center deployed via CFK using Azure Entra ID as an OpenID Connect (OIDC) Identity Provider.

**Architecture Overview**

- IDP: Azure Entra ID
- SP: Confluent Control Center (via MDS )
- Protocol: OIDC, Authorization Code flow
- Authorization Model: Confluent RBAC 

## Azure Entra ID Requirements (AD Team)

### 1. App Registration

- Create a **Web application** in Azure Entra ID
- Single-tenant (recommended, unless otherwise required)
- Assign intended **users and/or groups** to the application
### 2. Redirect URI (Post-CP-Deployment)

To be added once Control Center is reachable.
**Format:**
`https://<c3-hostname>:9021/api/metadata/security/1.0/oidc/authorization-code/callback`

- HTTPS required
- Exact match enforced by Azure
### 3. Client Credentials

Provide:

- **Client ID**
- **Client Secret** (confidential)
    - Validity: Prefer long-lived (12–24 months)
    - Rotation ownership to be agreed

These are consumed by Control Center and stored securely in Kubernetes secrets.

### 4. Token Configuration

Enable **group claims** in the **ID token**.
Requirements:
- Group claims must be present
- Group identifier format must remain consistent
- No custom claims required beyond standard OIDC claims

Purpose:
- Group and user claims are mapped to Confluent RBAC principals

### 5. OIDC Metadata

Control Center requires:

- Issuer URL
- Authorization endpoint
- Token endpoint
- JWKS URI

These endpoints must remain stable.

### 6. Certificate Trust

Azure signing certificates must be trusted by Confluent Metadata Service.
Required Certificates:
- Provided in PEM format
- Used to validate ID token signatures
- Must be updated if Microsoft rotates trust roots

## Operational Considerations

- Client secret rotation
- Token lifetime changes
- Azure certificate rotation
- Group claim behavior changes

## Validation

Once configured:

- User is redirected to Microsoft login
- Successful authentication returns user to Control Center
- RBAC roles determine access and visibility