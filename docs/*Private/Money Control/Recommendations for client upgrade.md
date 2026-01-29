**Kafka client version** `**0.10.2.0**`, which is **very old** (released in **2016**). Since then, Apache Kafka has gone through numerous major improvements, especially in client performance, resilience, protocol support, and API ergonomics.

Your current Kafka client version is `**0.10.2.0**`, which is **very old** (it was released in **2016**). Since then, Apache Kafka has undergone major enhancements in:

- **Performance**
- **Resilience**
- **Protocol support (e.g., idempotent producer, cooperative rebalancing)**

### Recommended Upgrade Version

Upgrade to the latest **Confluent Kafka Client** version:

<!-- [https://mvnrepository.com/artifact/org.apache.kafka/kafka-clients](https://mvnrepository.com/artifact/org.apache.kafka/kafka-clients) -->  
<dependency>  
<groupId>org.apache.kafka</groupId>  
<artifactId>kafka-clients</artifactId>  
<version>7.9.2-ce</version>  
</dependency>

Gradle:

// https://mvnrepository.com/artifact/org.apache.kafka/kafka-clients  
implementation group: 'org.apache.kafka', name: 'kafka-clients', version: '7.9.2-ce'  

Source repo: [https://mvnrepository.com/repos/confluent-packages](https://mvnrepository.com/repos/confluent-packages)

Note:

- `kafka-clients:7.9.2-ce` (Confluent) = Apache Kafka Client `3.7.0`
- Compatible Spring projects:    
    - **Spring for Kafka**: `3.3.x`
    - **Spring Kafka Integration**: `6.4.x` or later
- Kafka provides bidrectly **wire compatibility** between brokers and clients **since version** `**0.10.0**`.
    - This means you can **upgrade clients independently** of the broker version, and it is a painless change request

###   About API changes:

- Kafka clients **no longer depend on Zookeeper** — they directly communicate with Kafka brokers for metadata and coordination.
- Deprecated methods (e.g., `poll(long)`) are still supported but you should plan to replace with modern alternatives like `poll(Duration)` over the long term.  
    

Suggestions to review and update your code for performance and better stability:

Consumer Client

- Review and configure:
    
    - `max.poll.interval.ms`    
    - `max.poll.records`
    - `heartbeat.interval.ms`
    - `session.timeout.ms`

- If the consumer does not call `poll()` within `max.poll.interval.ms`, it will be considered dead, even if heartbeats are sent.
    
    - `poll()` always returns a **non-null**, possibly empty `ConsumerRecords` object.

- Consider using **cooperative rebalancing** (available since Kafka 2.4) to avoid full rebalance and improves stability during rolling deployments.
    
    - Set partition.assignment.strategy = org.apache.kafka.clients.consumer.CooperativeStickyAssignor

Producer Client

- Review and configure:    
    - `acks`
    - `linger.ms`
    - `batch.size`
    
- Set `enable.idempotence = true`
    - This ensures that exactly one copy of each message is written in the stream in case of a producer retry
    - Automatically sets `retries = Integer.MAX_VALUE` and restricts `max.in.flight.requests.per.connection <= 5`.