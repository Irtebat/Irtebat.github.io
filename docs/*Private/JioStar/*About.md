
SHI case has been raised: [https://support.confluent.io/hc/en-us/requests/334077](https://support.confluent.io/hc/en-us/requests/334077)

FF: [https://confluentinc.atlassian.net/browse/FF-25489](https://confluentinc.atlassian.net/browse/FF-25489)
Success Pod: [https://confluentinc.atlassian.net/browse/POD-1951](https://confluentinc.atlassian.net/browse/POD-1951)

**Ultra has a hard limit of 152 CKUs for AWS.  If Jio is expecting a higher load, multiple clusters will need to be considered.** The Engineering team has enabled and confirmed the **228 CKU** configuration


**The [cross-region linking ticket](https://support.confluent.io/hc/en-us/requests/334036) is already approved and with the network team for configuration.**
  

**JioStar (Org ID: 641921)** under **Jio Platforms Limited** is migrating their workloads to **Confluent Cloud on AWS**. They are preparing for two major events coming up soon:

- **T20 Cricket World Cup in Feb 2026**
- **IPL from March to May 2026**

  

They are currently operating in **ap-southeast-1,(Singapore).** and all clusters are going to be  **Ultra**. Their expected CKU ranges are:

- **Ads Cluster**: 84 to 92 CKU
- **Heartbeat Cluster**: 120 to 250 CKU
- **Analytics Cluster**: 84 to 92 CKU

They may also bring up additional dedicated clusters in the same region with CKU ranges between **2 to 10**, depending on traffic patterns during the events. They may also run **S3 Sink Connectors**.**Ask:**

Have we run any scaling or stress testing in this region for similar CKU ranges, and do we have updated capacity planning guidance to confirm everything will work as expected? Since the events are only two months away, we need clarity on:

1. Testing readiness in **ap-southeast-1**

1. Any known AWS regional limits

1. Capacity planning validation for these CKU levels

1. Preventing issues similar to what they faced during IPL 2024 when GCP hit the hard limit of 512 nodes

This will help us plan an early test window and avoid surprises close to the event.

**Note**: The numbers below are shared by Customers based on the last high traffic events with a 30-40% increase. Actual number might vary, and this is just for our internal capacity planning to avoid last-minute surprises.

- **Ads Cluster**:
    
    - Ingress: 600MB/s to 750MB/s
    
    - Egress: 3.4GB/s to 4GB/s
    

- **Heartbeat Cluster**:
    
    - Ingress: 2.6GB/s to 3.5GB/s
    
    - Egress: 18GB/s to 21GB/s
    

- **Analytics Cluster**:
    
    - Ingress: TBD
    
    - Egress: TBD
