# Removing Kafka Brokers

Removing a broker (scaling down) requires careful orchestration to ensure zero data loss and minimal client impact.

## High-Level Process

1.  **Identify Broker**: Determine the `broker.id` to remove.
2.  **Drain Data**: Reassign all partition replicas *off* the target broker to remaining brokers.
3.  **Wait for Completion**: Ensure the broker is empty (no leaders, no followers).
4.  **Shutdown**: Stop the Kafka process.
5.  **Decommission**: Remove the node from infrastructure.

## Detailed Steps

### 1. Drain the Broker (Reassign Partitions)
**Do not simply stop the broker.** If you stop a broker that hosts leaders, you trigger immediate failovers. If it hosts the only in-sync replica, you cause unavailability.

**Using `kafka-reassign-partitions.sh`:**
1.  Create a topics-to-move JSON file (or generate a plan moving all partitions away from the target ID).
2.  Execute the reassignment.
3.  Monitor progress using `--verify`.

**Using Cruise Control:**
Use the `remove_broker` endpoint or goal. This automates the calculation of where to move data while respecting cluster balance.

### 2. Verify Broker is Empty
Check that the broker holds no partition replicas.

```bash
kafka-log-dirs.sh --bootstrap-server localhost:9092 --describe --broker-list <ID_TO_REMOVE>
```
*Output should show empty log directories or no partitions.*

### 3. Controlled Shutdown
Once empty, perform a graceful shutdown.

```bash
sudo systemctl stop kafka
```
*Note: If the broker is truly empty, this is instant. If it still held leaders, a "Controlled Shutdown" will attempt to migrate leadership before stopping, minimizing downtime.*

### 4. Remove from Cluster Metadata
*   **Zookeeper Mode**: The broker ephemeral node disappears automatically.
*   **KRaft Mode**: You may need to unregister the broker if it doesn't return.

## Risks of Improper Removal
*   **Under-replicated Partitions**: Stopping a broker with replicas reduces redundancy.
*   **Offline Partitions**: Stopping a broker with the *last* in-sync replica causes data unavailability.
*   **Unclean Leader Election**: Forcing a shutdown without draining can trigger unclean elections if configured, potentially losing data.

