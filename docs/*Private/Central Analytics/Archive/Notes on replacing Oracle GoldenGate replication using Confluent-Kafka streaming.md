  

CDC-based replication from Oracle into Kafka using Kafka Connect ecosystem.

1. **Oracle CDC Source** : The Kafka Connect Oracle CDC Source connector captures each change to rows in a database and represents each of those as change event records in Kafka topics. The connector uses Oracle LogMiner to read the database redo log.
    
    [https://docs.confluent.io/kafka-connectors/oracle-cdc/current/overview.html](https://docs.confluent.io/kafka-connectors/oracle-cdc/current/overview.html)
    

1. **Oracle XStream CDC Source** : The Kafka Connect Oracle XStream CDC Source Connector captures all changes made to rows in an Oracle database and represents the changes as change event records in Apache Kafka® topics. The connector uses Oracle’s XStream API to read changes from the database redo log.  
    [https://docs.confluent.io/kafka-connectors/oracle-xstream-cdc-source/current/overview.html](https://docs.confluent.io/kafka-connectors/oracle-xstream-cdc-source/current/overview.html)

1. **Debezium Connector for Oracle** : The Kafka Connect Debezium’s Oracle connector captures and records row-level changes that occur in databases on an Oracle server, including tables that are added while the connector is running. You can configure the connector to emit change events for specific subsets of schemas and tables, or to ignore, mask, or truncate values in specific columns.
    
    [https://debezium.io/documentation/reference/2.7/connectors/oracle.html](https://debezium.io/documentation/reference/2.7/connectors/oracle.html)