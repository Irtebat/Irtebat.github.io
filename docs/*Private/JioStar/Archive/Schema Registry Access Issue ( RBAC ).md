
1. In CC:
    - Confirm the principal (service account) tied to that API key
    - Confirm the role binding is on Schema Registry Subject resources in the same environment as the SR endpoint
2. Confirm the binding covers the exact subject naming strategy your serializer uses.
3. Test setting auto.register.schemas to False

**Test Strategy**

```bash
confluent login
confluent environment list
confluent environment use <ENV_ID>
```

confluent iam service-account create sr_test_client --description "service account to test sr rbac"
	ID : sa-xqv8dkq

confluent schema-registry cluster describe
```json
	{
	  "name": "Stream Governance Package",
	  "cluster": "lsrc-x1gxg",
	  "endpoint_url": "https://psrc-5mn3g.ap-southeast-2.aws.confluent.cloud",
	  "private_endpoint_url": "https://lsrc-x1gxg.ap-southeast-2.aws.private.confluent.cloud",
	  "catalog_endpoint_url": "https://psrc-5mn3g.ap-southeast-2.aws.confluent.cloud",
	  "used_schemas": "1083",
	  "available_schemas": "18917",
	  "free_schemas_limit": 20000,
	  "global_compatibility": "BACKWARD",
	  "mode": "READWRITE",
	  "cloud": "AWS",
	  "region": "ap-southeast-2",
	  "package": "ADVANCED"
	}
```

confluent iam rbac role-binding create \
  --principal User:sa-xqv8dkq \
  --role DeveloperRead \
  --environment env-xg59z \
  --schema-registry-cluster lsrc-x1gxg \
  --resource "Subject:*"

confluent iam rbac role-binding create \
  --principal User:sa-xqv8dkq \
  --role DeveloperWrite \
  --environment env-xg59z \
  --schema-registry-cluster lsrc-x1gxg \
  --resource "Subject:*"

confluent api-key create \
  --resource lsrc-x1gxg \
  --service-account sa-xqv8dkq \
  --description "SR key for sa-xqv8dkq"
	API Key  : V53HJCIP7QK6XIB4                                                 
	API Secret : cflt8LXVEKuLlqHUxU8hBHtEDyhN5CwQQFKsrC3iMv4OvgkQhFZdCxO6BlQG1DKg

SR_URL="https://psrc-5mn3g.ap-southeast-2.aws.confluent.cloud"
SUBJECT="sr-demo-topic-value"

```bash
curl -sS -u "V53HJCIP7QK6XIB4:cflt8LXVEKuLlqHUxU8hBHtEDyhN5CwQQFKsrC3iMv4OvgkQhFZdCxO6BlQG1DKg" \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  -X POST "${SR_URL}/subjects/${SUBJECT}/versions" \
  --data '{"schema":"{\"type\":\"record\",\"name\":\"Payment\",\"namespace\":\"my.examples\",\"fields\":[{\"name\":\"id\",\"type\":\"string\"},{\"name\":\"amount\",\"type\":\"double\"}]}"}'
```
```json
	{"id":100842}
```
```bash
curl -sS -u "V53HJCIP7QK6XIB4:cflt8LXVEKuLlqHUxU8hBHtEDyhN5CwQQFKsrC3iMv4OvgkQhFZdCxO6BlQG1DKg" \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  -X POST "${SR_URL}/subjects/${SUBJECT}/versions" \
  --data '{"schema":"{\"type\":\"record\",\"name\":\"Payment\",\"namespace\":\"my.examples\",\"fields\":[{\"name\":\"id\",\"type\":\"string\"}]}"}'
```
```json
	{"id":100843}
```

confluent iam rbac role-binding list \
--principal User:sa-xqv8dkq \
--schema-registry-cluster lsrc-x1gxg \
--environment env-xg59z \
--resource "subject:*"


```bash
confluent iam rbac role-binding create \ 
--principal User:<> 
\ --role ResourceOwner 
\ --environment <> 
\ --schema-registry-cluster-id <> 
\ --resource Subject:*
```


```bash
curl -u ":" \
  -X DELETE \
  "${SR_URL}/subjects/${SUBJECT}/versions/{VERSION}"
```