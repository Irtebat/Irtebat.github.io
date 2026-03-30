# Kafka Client Resilience Cheat-Sheet

**Practical cheat-sheet** focused specifically on **handling transient connectivity during broker scale up / scale down**.

When the cluster scales up or down, brokers are added or removed. This causes leadership changes and replica reassignments, and clients need to refresh metadata and reconnect to the right brokers. During this window, brief disconnects are normal.

Errors like `ECONNREFUSED`, `NETWORK_EXCEPTION`, `NOT_LEADER_FOR_PARTITION`, and `LEADER_NOT_AVAILABLE` are expected during scaling. These are transient and usually clear up quickly once leadership stabilizes and clients refresh metadata ( within seconds to a few minutes based on my observation )

Kafka clients are built to handle this by default:

- **Producers** retry failed requests, apply retry backoff, and automatically refresh metadata
- **Consumers** use session timeouts and heartbeats to detect failures and rebalance. They also keep refreshing cluster metadata to adapt to broker and leader changes.

To be more specific, here is a cheatsheet I whipped up that explains failure mode and appropriate client property mapping.

| Transient Failure          | What is happening                                               | Client property    |
| -------------------------- | --------------------------------------------------------------- | ------------------ |
| Broker briefly unavailable | Broker is shutting down or not yet ready during a scale event   | Retries            |
| Retry storms               | Many clients retry at the same time, causing a thundering herd  | Retry backoff      |
| Slow broker shutdown       | TCP connection succeeds but the broker stops responding         | Connection timeout |
| Stale metadata             | Leader or ISR changes during broker scale                       | Metadata refresh   |
| In-flight request failure  | Socket drops or no response while a request is in progress      | Request timeout    |
| Duplicate writes           | Retry happens after a partial produce success                   | Idempotence        |
| Coordinator moved or lost  | Group coordinator broker is removed or leadership changes       | Heartbeat          |
| Slow group stabilization   | Dead consumers are not evicted quickly after coordinator change | Session timeout    |

As long as defaults are not overly tightened, clients generally ride through scaling events without manual intervention.

Perhaps later, I can work with app teams / share recommendations for kafka SDKs they are using.

_(Generic property types by failure mode)_

## 1. Broker temporarily unavailable

_(broker scaling, restart, connection refused)_

### Producers

| Client      | Properties                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| **Java**    | `retries`, `retry.backoff.ms`, `delivery.timeout.ms`, `request.timeout.ms`                               |
| **KafkaJS** | `retry.retries`, `retry.initialRetryTime`, `retry.maxRetryTime`, `connectionTimeout`, `requestTimeout`   |
| **Sarama**  | `Producer.Retry.Max`, `Producer.Retry.Backoff`, `Net.DialTimeout`, `Net.ReadTimeout`, `Net.WriteTimeout` |

### Consumers

| Client      | Properties                                                               |
| ----------- | ------------------------------------------------------------------------ |
| **Java**    | `request.timeout.ms`, `reconnect.backoff.ms`, `reconnect.backoff.max.ms` |
| **KafkaJS** | `retry.retries`, `connectionTimeout`, `requestTimeout`                   |
| **Sarama**  | `Consumer.Retry.Backoff`, `Net.DialTimeout`, `Net.ReadTimeout`           |

---

## 2. Retry storms / thundering herd

_(many clients reconnect simultaneously)_

### Producers

|Client|Properties|
|---|---|
|**Java**|`retry.backoff.ms`, `delivery.timeout.ms`|
|**KafkaJS**|`retry.initialRetryTime`, `retry.maxRetryTime`, `retry.multiplier`|
|**Sarama**|`Producer.Retry.Backoff`|

### Consumers

|Client|Properties|
|---|---|
|**Java**|`reconnect.backoff.ms`, `reconnect.backoff.max.ms`|
|**KafkaJS**|`retry.initialRetryTime`, `retry.maxRetryTime`|
|**Sarama**|`Consumer.Retry.Backoff`|

---

## 3. Stale metadata / leader movement

_(partition leadership changes during scale)_

### Producers

|Client|Properties|
|---|---|
|**Java**|`metadata.max.age.ms`|
|**KafkaJS**|`metadataMaxAge`|
|**Sarama**|`Metadata.RefreshFrequency`, `Metadata.Retry.Max`|

### Consumers

|Client|Properties|
|---|---|
|**Java**|`metadata.max.age.ms`|
|**KafkaJS**|`metadataMaxAge`|
|**Sarama**|`Metadata.RefreshFrequency`, `Metadata.Retry.Max`|

---

## 4. In-flight request dropped

_(broker shuts down mid-produce / fetch)_

### Producers

|Client|Properties|
|---|---|
|**Java**|`request.timeout.ms`, `delivery.timeout.ms`, `enable.idempotence`|
|**KafkaJS**|`requestTimeout`, `idempotent`, `maxInFlightRequests`|
|**Sarama**|`Net.ReadTimeout`, `Net.WriteTimeout`, `Producer.Idempotent`|

### Consumers

|Client|Properties|
|---|---|
|**Java**|`request.timeout.ms`|
|**KafkaJS**|`requestTimeout`|
|**Sarama**|`Net.ReadTimeout`|

---

## 5. Duplicate writes due to retries

_(producer retries after partial success)_

### Producers only

|Client|Properties|
|---|---|
|**Java**|`enable.idempotence`, `acks=all`, `max.in.flight.requests.per.connection`|
|**KafkaJS**|`idempotent`, `maxInFlightRequests`|
|**Sarama**|`Producer.Idempotent`, `Net.MaxOpenRequests`|

---

## 6. Consumer group instability

_(coordinator movement, brief disconnects)_

### Consumers only

|Client|Properties|
|---|---|
|**Java**|`session.timeout.ms`, `heartbeat.interval.ms`, `max.poll.interval.ms`, `rebalance.timeout.ms`|
|**KafkaJS**|`sessionTimeout`, `heartbeatInterval`, `rebalanceTimeout`|
|**Sarama**|`Consumer.Group.Session.Timeout`, `Consumer.Group.Heartbeat.Interval`, `Consumer.Group.Rebalance.Timeout`|

---

## 7. Stale or drained TCP connections

_(brokers removed but sockets linger)_

### Producers

|Client|Properties|
|---|---|
|**Java**|`connections.max.idle.ms`|
|**KafkaJS**|_(handled internally, no direct knob)_|
|**Sarama**|`Net.KeepAlive`|

### Consumers

|Client|Properties|
|---|---|
|**Java**|`connections.max.idle.ms`|
|**KafkaJS**|_(handled internally)_|
|**Sarama**|`Net.KeepAlive`|
