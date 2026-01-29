**Migration**

Setup Cluster Linking : sync data + offsets

- Resources Shared

Migrate consumers

- Stop the consumer.

- Update bootstrap endpoints and other relevant configs to point to CC.

- _Ensure offsets are synced (use a utility to assist)._

- Restart the consumer against CC.

Migrate producers

- Stop the producer

- _Promote the mirror topic_
    
    - This step enforces that replication lag is zero before writes are permitted
    
    - _You can confirm there is no replication lag via the Cluster Link metrics_
        
        - io.confluent.kafka.server/cluster_link_mirror_topic_offset_lag
        
    

- Update bootstrap endpoints and other relevant configs

- Restart the producer against CC

  

**Rollback:**  
Let’s assume we have 5 Consumer Groups: CG-1 through CG-5.Suppose CG-1, CG-2, and CG-3 have been migrated to CC, while the remaining continue on-prem. If an issue arises that necessitates rolling back these three consumer groups to the on-prem Kafka cluster, the requirement is to retain their consumer offsets as tracked in CC, and reflect those offsets accurately on-prem to avoid re-reading data.Since bidirectional cluster linking is not supported b/w OSK and CC, we cannot rely on automatic offset sync from CC to on-prem.One approach I would recommend is to perform a controlled rollback as follows: ( we can perform these programmatically ):

- Fetch offsets of CG-1, CG-2, and CG-3 from CC

- Apply the fetched offsets to the on-prem cluster

A reusable utility tool built using Kafka SDKs can automate these steps.