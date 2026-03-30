# Adding Kafka Brokers

Adding brokers to a Kafka cluster is a horizontal scaling operation used to increase storage capacity and throughput.

## High-Level Process

1.  **Provision Infrastructure**: Spin up the new server, container, or pod.
2.  **Configure Broker**: Update `server.properties` with a unique `broker.id` and connect it to the existing Zookeeper or KRaft quorum.
3.  **Start Broker**: Launch the Kafka process.
4.  **Verify Membership**: Ensure the broker has joined the cluster.
5.  **Rebalance Cluster**: Move partitions to the new broker to utilize its capacity.

## Detailed Steps

### 1. Provision & Configure
Ensure the new node has network connectivity to the existing brokers and Zookeeper/Controller nodes.

**Key Configuration (`server.properties`):**
```properties
broker.id=4                  # Must be unique
zookeeper.connect=zk1:2181,zk2:2181... # or controller.quorum.voters for KRaft
listeners=PLAINTEXT://:9092
log.dirs=/var/lib/kafka/data
```

### 2. Start the Broker
Start the Kafka service. The broker will register itself with the cluster controller.

```bash
# Example systemd start
sudo systemctl start kafka
```

### 3. Verify Membership
Check if the new broker is active.

**Using Zookeeper (Legacy):**
```bash
zookeeper-shell.sh localhost:2181 ls /brokers/ids
# Output should include [..., 4]
```

**Using Admin Client:**
```bash
kafka-broker-api-versions.sh --bootstrap-server localhost:9092
```

### 4. Rebalance (Crucial Step)
A new broker starts empty. It will **not** automatically receive existing data. You must explicitly move partitions to it.

**Option A: Kafka Reassign Partitions Tool (Manual)**
1.  Generate a reassignment JSON file proposing moves to the new broker.
2.  Execute the reassignment.
3.  Verify completion.

**Option B: Cruise Control (Automated)**
If using Cruise Control, simply trigger a `add_broker` goal or let it auto-rebalance based on goals.

## Considerations
*   **I/O Impact**: Rebalancing triggers heavy network and disk I/O as data is copied. Throttle reassignment if necessary (`--throttle`).
*   **Client Updates**: Clients automatically discover the new broker via metadata updates, but they won't send produce requests to it until it becomes a leader for some partitions.

