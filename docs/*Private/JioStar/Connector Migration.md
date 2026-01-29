Summary:

JioStar ( private-networked Confluent Cloud cluster - VPC Peering ) plans to run Custom Connectors that must reach both target systems exposed  
• over public endpoints  
• over private endpoints

JioStar’s Connector Inventory: [https://docs.google.com/spreadsheets/d/1CBx4mkMeE5ZAnZoIyFnX4KKqUHXjl_c5/edit?usp=drive_link&ouid=108289407005701068102&rtpof=true&sd=true](https://docs.google.com/spreadsheets/d/1CBx4mkMeE5ZAnZoIyFnX4KKqUHXjl_c5/edit?usp=drive_link&ouid=108289407005701068102&rtpof=true&sd=true)
  

With [INIT-6770 Egress Private Link Custom Connectors (AWS)](https://confluentinc.atlassian.net/browse/INIT-6770?atlOrigin=eyJpIjoiZDM4YTE2MTQ4MzVjNDE0ZWIxZmM4NGYzMmQ4MWE2ZDQiLCJwIjoiamlyYS1zbGFjay1pbnQifQ), Jio can create a serverless egress privatelink gateway and configure access points for connectivity to the custom connector.

- For AWS-native target systems this is straightforward. For self-managed targets, our customer would need to expose these systems via an aws PrivateLink service behind an NLB.Our original request was the ability for Custom Connectors to use private networking via VPC peering ( our customer uses VPC peered CC Kafka Clusters ), without needing to front self-managed systems with PrivateLink services. That would simplify integration.
+ Custom connector can reach on Private Link and Public targets both.

( [https://confluent.slack.com/archives/C057EDJV35Z/p1765829819863709?thread_ts=1763368179.700759&cid=C057EDJV35Z](https://confluent.slack.com/archives/C057EDJV35Z/p1765829819863709?thread_ts=1763368179.700759&cid=C057EDJV35Z) )

The following document walks through the approach for enabling private connectivity for a custom Connector : [https://docs.google.com/document/d/1gNzGMs7A4BXXTgWE8YUAK6mhYgSMsNr03yAvLHC2i8I/edit?tab=t.0](https://docs.google.com/document/d/1gNzGMs7A4BXXTgWE8YUAK6mhYgSMsNr03yAvLHC2i8I/edit?tab=t.0)

- Note : the network path needed for Custom Connectors is separate from existing kafka cluster connectivity, so nothing on your existing setup will be impacted.

Custom SMTs

[https://docs.confluent.io/cloud/current/connectors/configure-custom-single-message-transforms/custom-smt-limitations-support.html#cc-custom-smt-limitations](https://docs.confluent.io/cloud/current/connectors/configure-custom-single-message-transforms/custom-smt-limitations-support.html#cc-custom-smt-limitations)