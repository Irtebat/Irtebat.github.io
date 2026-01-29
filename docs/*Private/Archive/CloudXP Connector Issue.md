I noted logs “[2025-07-03 04:32:22,731] WARN [pmdm_office_master_sink_connector|task-0] [Consumer clientId=connector-consumer-pmdm_office_master_sink_connector-0, groupId=connect-pmdm_office_master_sink_connector] consumer poll timeout has expired.”

Implications

- Kafka Connect JDBC Sink operates inside a **single-threaded task** per connector task.
    
    - It fetches a batch of records from Kafka, then calls the JDBC `executeBatch()` method.
    
    - When the connector calls `executeBatch()`:
        
        - JDBC driver sends all batched SQL statements to the database.
        
        - Then the driver **waits for the database to process all those statements**.
        
        - Only after all results are received (either success or exception), does `executeBatch()` return.
        
    
    - Until `executeBatch()` returns, that task:
        
        - Cannot process any new Kafka records.
        
        - Cannot send new poll requests to Kafka (this is tied to the log above ).
            
            - JDBC insert operation took longer than `max.poll.interval.ms`.
            
            - Kafka Connect could not call `poll()` in time, triggering **consumer timeout**.
            
            - Kafka removed the consumer from the group, forcing a **rebalance**.
            
            - PostgreSQL accumulates stuck backends.
            
        
        - Cannot commit offsets or heartbeat.
        
    

- Your **JDBC Sink Connector task** got blocked inside the `put()` method. My thoughts on why:
    
    - It was trying to process a large batch
    
    - Kafka Connect JDBC Sink uses JDBC batch mode. As such, the JDBC driver sends **multiple individual statements** over the TCP connection.
    
    - PostgreSQL **executes** each one quickly and starts returning a result for each statement.
        
        - This causes large numbers of TCP packets, responses, and possible stalls for large batches.
        
    
    - If PostgreSQL’s **TCP socket buffer** fills up (due to too many responses or TCP congestion), PostgreSQL pauses sending more responses and waits for the client (JDBC driver) to start reading them.
    
    - Kafka Connect JDBC Sink’s `executeBatch()` **internally waits for all responses before returning**.
        
        - `executeBatch()` waits for all responses from the database before it returns.
        
    
    - If TCP buffers are full or Connect is blocked internally, this leads to a deadlock-like situation:
        
        - PostgreSQL waits for the client (stuck in `ClientRead`).
        
        - Kafka Connect waits for PostgreSQL to complete `executeBatch()`.
        
        - Both sides are blocked on TCP socket behavior, not query execution latency.
        
    

  

**Optimizations to alleviate the issue**  
  
`reWriteBatchedInserts=true`

Reduce `batch.size` to a safer value (start with 100 or lower).

"[consumer.override.max.poll.interval.ms](http://consumer.override.max.poll.interval.ms/)": "600000"

  

Based on the logs, the root cause appears to be blocking at the TCP socket layer during JDBC batch writes, caused by inefficient batching behavior and large batch sizes overwhelming TCP buffers between Kafka Connect and PostgreSQL.

  

My notes:  

I noted logs:

`[2025-07-03 04:32:22,731] WARN [pmdm_office_master_sink_connector|task-0] [Consumer clientId=connector-consumer-pmdm_office_master_sink_connector-0, groupId=connect-pmdm_office_master_sink_connector] consumer poll timeout has expired.`

**Implications of the log:**

Kafka Connect JDBC Sink operates inside a **single-threaded task** per connector task. It fetches a batch of records from Kafka, then calls the JDBC `executeBatch()` method.

During `executeBatch()`:

- The JDBC driver sends the batched SQL statements to PostgreSQL.

- The driver then waits for the database to process all those statements.

- Only after all responses (either success or exception) are fully received does `executeBatch()` return.

While the task is inside `executeBatch()`:

- It cannot process any new Kafka records.

- It cannot send new poll requests to Kafka (this caused the log above).

- It cannot commit offsets or send heartbeats to the Kafka group coordinator.

  

If JDBC insert operation takes longer than `max.poll.interval.ms`. Therefore

- Kafka Connect could not call `poll()` in time, triggering a consumer timeout.

- Kafka removed the consumer from the group, forcing a rebalance.
    
    - There are a set of rebalance logs
    

- PostgreSQL accumulates stuck backends waiting for the client to read results.

  

**Possible reasons why the JDBC Sink Connector Task Gets Blocked Inside** `**put()**`**:**

- The connector was processing a large batch.

- Kafka Connect JDBC Sink uses JDBC batch mode.
    
    - By default, the PostgreSQL JDBC driver sends **multiple individual INSERT statements** over the TCP connection per batch.
    

- PostgreSQL executes each statement quickly and starts returning a result for each. This creates a large number of TCP packets and responses, especially for large batches.

- If PostgreSQL’s TCP socket buffer fills up, PostgreSQL pauses sending further responses and waits for the client (JDBC driver) to read the buffered results.

- Kafka Connect JDBC Sink’s `executeBatch()` **internally waits for all responses** before it returns.

**This results in a deadlock-like Situation:**

- PostgreSQL waits for the client to read results (**stuck in** `**ClientRead**`).

- Kafka Connect task is blocked inside `executeBatch()`, waiting for PostgreSQL to finish.

- Both sides are effectively blocked due to TCP socket behavior and backpressure, even though PostgreSQL query latency itself may be acceptable.

  

**Optimizations to Alleviate This Issue:**

1. Enable PostgreSQL JDBC batch rewriting by appending this query parameter in your connection string: reWriteBatchedInserts=true
    
    1. This rewrites batches into a single multi-row `INSERT`, reducing the number of responses and eliminating the stall.
    

1. Reduce `batch.size` to a safer value (start with **100** or benchmark ).

1. Optionally, increase: "consumer.override.max.poll.interval.ms": "600000"
    
    1. I see this as a temporary safeguard—this does not solve the root cause but avoids premature consumer timeouts during long processing.