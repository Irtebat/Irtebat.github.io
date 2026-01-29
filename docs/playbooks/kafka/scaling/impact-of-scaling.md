# Impact of Scaling Kafka Brokers

Scaling operations (adding or removing brokers) are generally non-disruptive if done correctly, but they do have observable impacts on the cluster and clients.

## 1. Cluster Performance Impact

### Network Saturation
*   **Replication Traffic**: Moving partitions (rebalancing) generates significant network traffic between brokers.
*   **Impact**: Can saturate network interfaces, potentially increasing latency for producer/consumer requests.
*   **Mitigation**: Use `kafka-reassign-partitions.sh --throttle` to limit replication bandwidth.

### Disk I/O
*   **Write Amplification**: The destination broker writes data heavily as it copies partitions. The source broker reads heavily.
*   **Impact**: Increased disk contention can slow down standard produce/consume operations.

### Controller Load
*   **Metadata Updates**: Every partition move updates cluster metadata. The controller publishes these changes to all brokers.
*   **Impact**: Minimal in modern Kafka, but massive reassignments can spike controller CPU.

## 2. Client Impact

Clients (Producers and Consumers) will experience transient events. See [Client Resilience Cheat-Sheet](./client-resilience.md) for configuration details.

| Event | Description | Client Symptom |
| :--- | :--- | :--- |
| **Leadership Change** | A partition leader moves from Broker A to Broker B. | `NOT_LEADER_FOR_PARTITION` or `LEADER_NOT_AVAILABLE` errors. |
| **Metadata Refresh** | Clients must discover the new leader. | Brief latency spike while client fetches new metadata. |
| **Connection Reset** | Old broker connections are closed; new ones opened. | `NETWORK_EXCEPTION` or `ECONNREFUSED` (if hitting a drained broker). |
| **Group Rebalance** | If the Group Coordinator moves, consumer groups rebalance. | Consumers pause processing briefly to rejoin the group. |

## 3. Operational Risks

*   **Under-Replication**: During the move, if the source broker fails before the destination is in-sync, you are vulnerable.
*   **Straggler Partitions**: Large partitions take longer to move, potentially delaying the completion of a scale-down event.

