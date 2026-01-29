
*21/1/26*
- Basic Auth for C3 is setup

*22/1/26*
Security for Prod Env
- Components - Kraft, Kafka, C3, SR, Connect
- AuthN :
	- Client to kafka : mTLS
	- CP-to-CP : mTLS
	- C3 : SSO with AD ( OIDC )
- AuthZ : RBAC
- Audit log

References:
https://github.com/confluentinc/confluent-kubernetes-examples/blob/master/security/mds-mtls-c3-sso/confluent-platform.yaml

https://github.com/Irtebat/cfk-reference-deployments/tree/master/kafka_mTLS_RBAC_NodePort-LB

Enable Audit Log

27/1/26
- Flink SQL C3 UI Setup ( without Security )

Asks:
- Field level Access Control 
- compute pool references flink image; Jio uses custom registry. How do we refer to imagePullSecrets
	- To be validated: Docs say compute-pool `clusterSpec` is a Flink Kubernetes Deployment spec similar to a CMF FlinkApplication. `kubectl explain` shows `spec.imagePullSecrets` is not allowed top-level, so use `jobManager.podTemplate.spec.imagePullSecrets[].name` (and similarly for `taskManager`) and ensure the pull secret exists in the FlinkApplication namespace.


**Pending**

1. Ingress Controller Setup ( Bifurcate to 2 instances )
2. Security Setup
	- Components - Kraft, Kafka, C3, SR, Connect
	- AuthN :
		- Client to kafka : mTLS
		- CP-to-CP : mTLS
		- C3 : SSO with AD ( OIDC )
		- Flink : mTLS
	- AuthZ : RBAC
	- Audit log