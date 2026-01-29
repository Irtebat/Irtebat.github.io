*Date: 20/1/26*

**Observed**  
Flink Job ( Kafka Sink )  
- flink version 1.13.1  
- flink-connector-kafka 2.11
Sink parallelism is 60; topic partition count is 100.
Job becomes unresponsive after publishing ~4 mil messages  
Effective batching is low ( ~3 ).  
Total ingress is not close to cluster limit.  
No evidence of produce throttling or hot partitions.  
High request-latency-avg  
High record-queue-time-avg  
Low / zero bufferpool-wait-time-total  
TaskManagers are not being killed; the job restarts (failure detected by Flink runtime rather than platform OOM/eviction).

**What we have ruled out so far**  
1. Ingress quota / throughput limit on the cluster as the primary cause (total ingress below 1200 MB/s).
2. Broker-side produce throttling.
3. Hot partitions / partition skew.
4. Producers are not blocked on buffer memory allocation
5. TaskManager kill / container eviction (job restarts are driven by Flink failure handling).

**Most likely cause**  
Request-latency-avg rises, record-queue-time-avg rises, checkpoints slow, causing sustained backpressure and eventual restart via timeouts  
To check:  

- checkpoint timeouts
- embedded Kafka producer’s send/delivery/request timeouts
- transaction-related timeouts

*Date: 21/1/26*

#### Checklist

**Kafka producer behavior (sink-side)**

- Enable DEBUG logs for:
	- `org.apache.kafka.clients.producer`        
    - `org.apache.kafka.clients.NetworkClient`
- Verify runtime producer configs:
    - `acks`
    - `linger.ms`, `batch.size`
    - `delivery.timeout.ms`
    - `request.timeout.ms`
    - `max.in.flight.requests.per.connection`
    - `retries` and `retry.backoff.ms`
 
 **Checkpointing (Flink-level)**

- Flink UI → **Checkpoints**:
    - Look for **increasing duration** and **timeouts**.
    - Identify whether failures point to the **Kafka sink operator**.

- Check JobManager logs for:    
    - `Checkpoint expired`, `Declined checkpoint`

- Confirm configs:
    - `execution.checkpointing.timeout`
    - `execution.checkpointing.interval`

**Transactions / EOS (if exactly-once is enabled)**

- Verify:
    - `transaction.timeout.ms` > worst-case checkpoint duration (with buffer).
    - Broker max transaction timeout is not exceeded.
        
- Look for fatal producer errors:
    - Transaction timeout
    - Producer fenced / aborted transactions
- Correlate:
    - Rising checkpoint time → transaction duration → job restart.

**Topic & cluster semantics (sanity)**

- Confirm topic settings:
    - Replication factor
    - `min.insync.replicas`
- Ensure no silent changes from in-house Kafka defaults.

#### Summary

Packet travelling to CC has to cross more layers : flink TM node NIC, vpc routing layer, peering endpoint, CC ingress routing, the broker network stack. I am not fully aware of the exact network topology b/w flink jobs and the in-house Kafka, but it is reasonable to assume it was much closer in terms of network hops. Also, I believe there was no TLS overhead when flink jobs were talking with the in-house cluster. 
This is not a capacity or throttling problem. This is usually manageable by tuning the client appropriately (batching, in flight reqs, idempotency, etc ). We have not had the opportunity to do this yet, partly because the kafka client version used by the job is fairly ancient.

There are a few things I would like to test next. I think we are on the right track with the RCA — latency is the primary driver here. 
I would like to verify what the configured timeouts are for Flink checkpoints + whether EOS is enabled for the Kafka sink ( if so, what is the timeout ) + confirm there are no differences in topic configuration on CC compared to our in-house Kafka defaults. If possible, we should enable Kafka client debug logs in the flink job to get more clarity.
