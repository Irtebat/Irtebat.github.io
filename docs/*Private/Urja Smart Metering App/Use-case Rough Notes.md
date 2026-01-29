- Context:
    
    - HEC System taking data from on-ground smart metering devices
        
        - 20 instances
            
            - DC, DR and T&D per customer
            
            - ~10 customer
            
        
        - Clients: primary Java, NodeJS ( KafkaJS )
        
        - Triggered pulls ( sync ) or
        
        - Pushed by smart metering devices
        
    
    - Data is processed and send it downstream
        
        - Internal topics
        
        - External topics
            
            - 4 topics
            
        
    
    - External topic data is processed by middleware ( Nifi ) — data ingestion, routing, transformation, and provenance tracking
        
        - Transformation
            
            - change record format ( ex: csv, json )
            
            - perform aggregations
            
        
        - Push data to external systems ( ex: REST based systems, JMS Queues, Rabbit MQ, SFTP, Kafka, HDFS in parquet format ) of vendors
            
            - Most system expect streaming
            
            - SFTP based systems : based on size and time
            
        
    
    - DC → DR replication is missing
        
        - DB replication is happening
        
        - MongoDB
            
            - ReplicaSets
            
        
        - Oracle
            
            - ADG
                
                - 5 mins
                
            
        
        - Kafka Data - 700 GB - 1TB
            
            - 7 days
            
        
    
    - If DC is shutdown, it takes 2-4 hrs
    
    - Reporting layer uses external topic
        
        - Currently, data is routed to MongoDB, Oracle, Redis, Postgres and transformations are applied
        
        - Requirements:
            
            - Transformation
            
            - Record Format - json, csv
            
            - SLA calculation for certain profiles ( key - device specific, overall ) based on
                
                - Ballpark - 10 Lac meters, 9-10 cr records per day
                    
                    - Calculations base on this volume
                    
                    - Payload : 1 -2 KB ( 850-950 Bytes )
                    
                
                - Volume, event-time semantics
                
                - Triggers