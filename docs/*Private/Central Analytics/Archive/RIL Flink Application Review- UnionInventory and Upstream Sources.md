### **Source App Summaries and Inferences**

---

### **1. RPOS**

- Aggregates per `(SITE, ARTICLE, SALE_DATE)`
    
    - Sink: `CONFLUENT_SALES_ARTICLE` via **upsert-Kafka**
    

- **Inference**: Stream of sales transactions

- Notes:

1. DDL for `CONFLUENT_SITE_ARTICLE_TICKET` contains line “CASE WHEN B.op_type = 'U' THEN B.QUANTITY ELSE 0 END AS QUANTITY_U” but `Filtered_TXNITEM` already has “WHERE ... AND op_type = 'I'”. So `B.op_type = 'U'` will **never match**, making this field **always zero**.
    
    - Either:
        
        - Remove `QUANTITY_U` altogether.
        
        - Or—if planning to relax the `op_type` filter in future—make a note but comment it out for now.
        
    

1. You are calling `TO_TIMESTAMP()` on a string column (`A_SALE_DELTA_DATE`) **inside a** `**WHERE**` **clause before aggregation**.
    
    That function must: Parse the string for **every incoming record**
    
    Noted that the pipeline does:
    
    1. **op_ts → string** (via `DATE_FORMAT`)
    
    1. **string → timestamp** (via `TO_TIMESTAMP`)
    
    1. Then filters on the timestamp
    
    **Recommendation**
    
    Avoid converting timestamp → string → timestamp again
    
    In your first SELECT (i.e., enrichment query into `CONFLUENT_SITE_ARTICLE_TICKET`), change this:
    
    ```SQL
    DATE_FORMAT(A.op_ts, 'yyyyMMddHHmmss') AS A_SALE_DELTA_DATE,
    ```
    
    to:
    
    ```SQL
    A.op_ts AS A_SALE_DELTA_TS,
    DATE_FORMAT(A.op_ts, 'yyyyMMddHHmmss') AS A_SALE_DELTA_DATE,
    ```
    
    Similarly for `B.op_ts → B_SALE_DELTA_TS` and `B_SALE_DELTA_DATE`.
    
    Then in your aggregation query (insert into `CONFLUENT_SALES_ARTICLE`), change:
    
    ```SQL
    TO_TIMESTAMP(A_SALE_DELTA_DATE, 'yyyyMMddHHmmss') >= CURRENT_DATE
    ```
    
    to:
    
    ```SQL
    A_SALE_DELTA_TS >= CURRENT_DATE
    ```
    
    This avoids unnecessary parsing.
    

### **2. ROMS**

- Aggregates per `(STORENO, ARTICLEID, ORDERDATE)`
    
    - Sink: `EXPSTORE_ORDER_AGGREGATED` via **upsert-Kafka**
    

- **Inference**: Stream of orders information

- **Implication**: Since filtering is on recent 15 days and then aggregated by `(SITE, ARTICLE)`, defining PK `(STORENO, ARTICLEID, ORDERDATE)` is needed to enable updates. However, the UNION logic further aggregates by `(SITE, ARTICLE)`, which is valid as long as filtering ensures no duplicate dates.

### **3. MSEG**

- Aggregates per `(MATNR, WERKS, op_date)`
    
    - Sink: `MSEG_FINAL` via **upsert-Kafka** on `(MATNR, WERKS, op_date_str)`
    

- **Inference**: Changelog stream capturing changes ( delta ) in inventory per MARD cycle

- **Implication**: Must define PK as `(MATNR, WERKS, op_date)` in the Flink table. Filtering on `op_date_str = CURRENT_DATE` ensures only **one record per key** enters the aggregation, enabling accurate group-by `(SITE, ARTICLE)`.

### **MARD**

- Uses ROWNUM to deduplicate record over `(MBLNR, MJAHR, ZEILE)`

- Inference: Stream of latest material stock state

- Combines full + delta

- Sink: `MARD_FINAL` via upsert-**Kafka** on **(**`MATNR, WERKS`)

- **Inference**: This is an update stream, representing current stock data per day

- **Implication**: In `unioninventory`, any aggregation downstream (e.g., per `SITE, ARTICLE`) will correctly retract old values and apply updated values.

---

### **UnionInventory Source-Sink Notes**

1. **RPOS (**`**CONFLUENT_SALES_ARTICLE**`**)**
    
    - Upstream source is `upsert-kafka` with PK. Kafka topic key `(SITE, ARTICLE, SALE_DATE)`
    
    - Source in `unionInventory` is treated as changelog stream / append-only → ==PK not defined==
    
    - **Note:**
        
        - It would be reasonable to read as upsert with PK defined in the source topic
        
    

1. **ROMS (**`**EXPSTORE_ORDER_AGGREGATED**`**)**
    
    - Upstream source is `upsert-kafka`. Kafka topic key `(STORENO, ARTICLEID, ORDERDATE)`
    
    - Source in `unionInventory` is treated as changelog stream / append-only → ==PK not defined==
    
    - In `unionInventory`, filtered on recent 15 days and then aggregated by `(SITE, ARTICLE)`
    
    - Note:
        
        - It would be reasonable to read as upsert with PK defined on `(STORENO, ARTICLEID)` to read as upsert stream.
        
    

1. **MSEG (**`**CONFLUENT_MSEG_FINAL**`**)**
    
    - Upstream source is `upsert-kafka`.Aggregated per `(MATNR, WERKS, op_date_str)`
    
    - Source in `unionInventory` is treated as changelog stream / append-only → ==PK not defined==
    
    - **Note:**
        
        - It would be reasonable to read as upsert with PK defined in the source topic
        
    

1. **MARD (**`**CONFLUENT_MARD_FINAL**`**)**
    
    - Upstream source is `upsert-kafka`. Deduplicates on `(MATNR, WERKS)`
    
    - Source in `unionInventory` is treated as changelog stream / append-only → ==PK not defined==
    
    - **Note:**
        
        - It would be reasonable to read as upsert with PK defined in the source topic
        
    

1. **Milkbasket (**`**CONFLUENT_2**`**)**
    
    - Source in `unionInventory` is treated as upsert-stream over → PK `(SITE, ARTICLE, ORDER_DATE)`
    
    - PK defined and matched in `unionInventory`
    

### Summary for Issues in UnionInventory

The `UnionInventory` Flink SQL application performs an aggregation over multiple Kafka sources—each feeding data ( inventory, sales/orders, or movement deltas )—to compute the latest inventory view per `(SITE, ARTICLE)`.

The correctness of this aggregation depends on **changelog tracking** (detecting `+U`, `-U` updates) from upstream Kafka sources. This, in turn, depends on:

- Whether the source Kafka topics are written using **upsert semantics**
    
    - I see this is correctly defined in individual apps
    

- Whether the **primary keys** are **correctly defined** on the consuming Flink tables
    
    - This is not defined in UnionInventory
        
        - RPOS, MSEG, MARD are treated as append-only
        
        - This can lead to double counting if (SITE,ARTICLE) aggregation in individual applications is updated
            
            - Read “**About omission of PK in Flink Tables Removes Changelog Semantics”** section for example sceanrio
            
        
    

- Whether the **downstream grouping keys match** the update keys of the upstream streams
    
    - source table has PK `(A, B, C)` and aggregation is on `(A, B)`:
    
    - Issue example scenario:
        
        - Initial state was set to 10 by +I from the upsert source A
        
        - A -U, +U sequence from the upsert stream A ( for the same SITE, ARTICLE, DATE ) updated the state to 15 ( = 10 -10 + 15 )
        
        - A subsequent +I event ( emitted when the DATE changed while SITE, ARTICLE were same ) from the same upsert source A added 20, increasing the state to 35.
            
            - This implies that when the upstream key is a superset of the GROUP BY columns, the downstream operator may treat events as additive instead of updates.
            
        
    
    - **Aggregation state is maintained per** `**(SITE, ARTICLE)**` But upstream changelog tracks state per `(SITE, ARTICLE, DATE)`
    
    - Therefore, Flink sees each new `DATE` as a new, independent record, and treats it as an append / insert
    
    - This causes accumulation, not update, and may result in overcounting
    

---

### **About omission of PK in Flink Tables Removes Changelog Semantics**

- If a Flink table does **not** define a `PRIMARY KEY` ( even if the Kafka topic has keys and comes from an upsert-Kafka producer ), Flink **treats the table as append-only**.

- That causes:
    
    - Double-counting in aggregations
    
    - Missed retractions or corrections
    

- Example
    
    Say `CONFLUENT_MSEG_FINAL` topic being written to by upsert-kafka producers as follows:
    
    ```JSON
    Key: { "id": 123 }
    Value (first): { "id": 123, "count": 10 }
    Value (second): { "id": 123, "count": 20 }
    ```
    
    If table is defined as:
    
    ```SQL
    CREATE TABLE my_table (
      id STRING,
      count INT,
      PRIMARY KEY (id) NOT ENFORCED
    ) WITH (
      'connector' = 'upsert-kafka',
      ...
    );
    ```
    
    Then Flink processes the above as:
    
    - `+I(id=123, count=10)`
    
    - `-U(id=123, count=10)`
    
    - `+U(id=123, count=20)`
    
    But if you omit the PK, like:
    
    ```SQL
    CREATE TABLE my_table (
      id STRING,
      count INT
    ) WITH (
      'connector' = 'kafka',
      ...
    );
    ```
    
    Then Flink assumes append-only, so the second event is just another insert:
    
    - `+I(id=123, count=10)`
    
    - `+I(id=123, count=20)`
    
    The downstream aggregation operator in unionInventory tracks correct state using the retracting events, else the state will hold wrong values.
    
    In this case, SUM aggregate would consider (10+20) as MSEGs contribution, however we wanted it to consider (-10+20)
    

- **Fix**: Define the same PK as in the upstream source app