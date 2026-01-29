  

**SAP Stack:**

- Application layer Layer

- Semantic views ( such as CDS, BW Query results ) exposed via ODP

- Database Tables

## Available Options

### **A. ODP based Solution**

ODP is a SAP framework to extract and replicate data from SAP data sources — SAP extractors, CDS view, other operation data providers

**ODP Source Connector (by INIT)**

- Available via Confluent Hub

- Supported and actively maintained by Confluent Partner ( verified gold )
    
    - Read [here](https://www.confluent.io/hub/init/kafka-connect-odp)
    
    - The current stable version is 1.3.4
    

- Solution type: CDC solution for ODP-enabled datasources

- Important notes:
    
    - The ODP Source Connector extracts data from SAP systems that provide ODP contexts — S/4HANA, BW, ECC
    
    - If RIL team uses SAP HANA Database (as DB-as-a-service, or standalone DB), ODP based solutions cannot be used.
    

- To confirm with Eldose:
    
    - Is their SAP system configured to expose data via ODP extractors?
        
        - Do they have ODP-enabled DataSources available in the Operational Delta Queue (ODQ) for the data objects we want to replicate?
            
            - Standalone, data-sources are not ODP enabled
            
        
    
    - Do they have RFC access and SAP JCo connectivity enabled for external systems to consume these ODP extractors?
        
        - NA
        
    

### **B. SAP SDI based solution**

SDI is SAP’s ETL Solution. Requires the following setup: SDI ( DP Agent ) + Kafka Adapter. This solutions is designed to capture full data loads and Incremental loads based on timestamps or keys.

- Issues
    
    - It is not designed for delete capture in Kafka pipelines.
    
    - SAP itself does not supply a Kafka Adapter for SDI out of the box.
        
        - Solution: Kafka Adapter by **Advantco (** third-party )
            
            - Read more here: [https://www.advantco.com/sap-hana-sdi-integration-adapters/sap-hana-sdi-kafka-integration](https://www.advantco.com/sap-hana-sdi-integration-adapters/sap-hana-sdi-kafka-integration)
                
                - Important notes for this adapter:
                    
                    - Supports both inbound and outbound operations
                    
                    - Supports SASL_PLAIN
                    
                    - Supports Integration with Schema Registry
                    
                
            
        
    

- Important:
    
    - SDI requires licensing ( DP included )
        
        - Note: It is available in HANA Enterprise Edition.
        
    
    - Kafka Adapter typically requires additional licensing.
    

- To confirm with Eldose:
    
    - Do they have SDI licence?
    

### C. JDBC based solution

Query-based extraction using JDBC to capture inserts, updates, or the results of custom queries on each poll interval.

- Supported by Confluent via JDBC Sink Connectors
    
    - Read [here](https://www.confluent.io/hub/confluentinc/kafka-connect-jdbc)
    

- This solutions is designed to capture full data loads and Incremental loads based on timestamps or keys.

- Issue #1: It is not designed for delete capture in Kafka pipelines.

### D. CDC-based solution

Direct CDC on the database

**Qlik CDC**

- Supported and actively maintained by Confluent Partner
    
    - Read [here](https://www.confluent.io/resources/ebook/confluent-and-qlik-ebook/)
    

- Important Notes
    
    - Captures snapshot
    
    - Streams change events via:
        
        - log-based CDC
        
        - trigger-based CDC
        
        - ODP-based CDC
        
        - extractor-based CDC