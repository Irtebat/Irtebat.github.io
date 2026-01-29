When I joined Confluent in 2022, I worked alongside the Connect and Confluent Platform engineering groups, on tuning open-source connectors and building services that supported migrations. As of 2025, I am part of a specialised engineering team in APAC that builds **services** used by some of our largest customers. The role has both a technical and a strategic aspect.  

The context is, for Confluent, a select number of large enterprises have advanced requirements that go beyond the standard product capabilities. These select customers ( telcos, banks ) often face challenges that require **dedicated engineering focus.** Our team works with these select customers ( mostly banks, telcos ) to understand their operational challenges, and then **design and build accelerator services** that make enterprise adoption faster and easier.

These accelerators typically fall into two categories:

1. **Product Gap Extensions** – solutions that fill functional or operational gaps until they are natively supported in the product.

1. **Platform Deployment Accelerators** – frameworks that simplify and standardize the deployment of data platforms across enterprise environments for : enabling an automated pipeline setup and monitoring

In both cases, our focus is on engineering solutions that are **scalable, and reusable.**

The intent is to **unblock enterprises** through engineering, while feeding back learnings that can inform product evolution.

### **Example of Product Gap Extensions:**

==**CDC-aware orchestration service**==

**Situation:**

Our account team was pursuing enterprises to use **Kafka as a low-cost disaster recovery solution** for relational databases by leveraging **Kafka’s Connector ecosystem**.

For these replication setups, a key operational challenge surfaced at the ideation stage: when **DDL changes would be applied directly on databases** under replication through **Kafka Connect**, they would **break replication** or cause **schema drift** between source and target systems.

We needed a scalable design of a kafka-enabled DR solution, and a **safe, automated way** to apply DDLs while maintaining replication consistency across environments.

**Task:**

Our team was brought in to **design the overall Kafka-as-DR replication solution** and most importantly develop a solution to address this ddl-related reliability challenge.

I broke down the ask into two broad problem statements :

1. **Design a scalable CDC ingestion and replication platform**, and

1. **Build a CDC-aware orchestration service** to coordinate DDL application with ongoing replication — effectively making schema changes **transactional with respect to CDC pipelines**.

I want to talk about the cdc-aware orchestration service. I can cover the DR-platform design afterwards.

**Action:**

I developed a **FastAPI microservice** that serves as the control plane for DDL operations. It has 3 embedded services:

- **A Kafka Connect client** that uses REST APIs to reconfigure, drain, pause, or resume connectors.

- A Kakfa Client that used Confluent-kafka python SDK to track and modify kafka flags ( connect offsets ).

- Database Client that using JDBC API to apply the DDLs in a controlled manner. ( JayDeBeAPI — JPype Java Bridge )

  

The workflow looked like this:

1. A DDL request was received by the service.

1. The statement was **classified** (create, alter, drop, index, view) — parsed using sqlparse

1. Based on classification, the service picks a strategy, orchestrates the replication pipeline as per the applicable strategy.

1. For audit, every operation was recorded in a **Kafka-backed metadata log** that tracks execution state.

1. It enforced **selective concurrency** — serial execution for structural DDLs (`ALTER TABLE`, `DROP COLUMN`), parallel for non-structural ones (views, indexes).
    
    - For synchronous calls : await asyncio.gather(run_in_threadpool ( blocking_fn1)…)
    
    - (asyncio.get_running_loop()).run_in_executor (()→getProcessPoolExecutor(),fn, **params)
    

The service was packaged as a **image for secure bastion deployment**, providing controlled access between application and data layers.

**Result:**

The solution eliminated replication breakages due to unsynchronized DDLs and became the **standard interface** we recommended for SQL teams to use to manage schema changes safely for the proposed kafka-as-a-DR solution.

The service was later **shared with Confluent’s account and professional services teams** to be used across enterprise engagements.

### **Example of Platform Deployment Accelerators:**

==**Flink-based Hybrid Analytics Framework**==

**Context:**

Across multiple large enterprise implementations, we noticed a recurring pattern — teams needed to **combine batch data from systems like SAP HANA or ERP exports** with **real-time event streams** to maintain consistent operational views, such as inventory reconciliation or order fulfillment.

Each engagement rebuilt this logic from scratch — deploying Flink Session Clusters, building custom Flink images with application logic.

**Task:**

I was asked to **design and implement a reusable, production-grade analytics framework** that could standardize how enterprise teams build these **stream processing pipelines.**

**Action:**

I engineered a **Flink-based analytics framework** deployed as a **Kubernetes-native service**, with **Kafka as the data backbone** and a declarative configuration model to define data pipelines.

The framework comprised three core layers:

### 1. **Topology Definition Layer**

- Users define **sources, transformations, and sinks** in a configuration YAML.

- Each source specifies its **semantics** (append or upsert), **primary key**, and **watermarking strategy**.

- Transformation logic and **joins** are declared with parameters such as join type, keys, and TTL (for state expiration).

- Under the hood, the library generates **Table API pipelines** dynamically at runtime

### 2. **Deployment & Governance Layer**

- A **Helm-based deployment blueprint** standardized runtime configuration across environments.

- Integrated with **Schema Registry** for contract governance

- Included **state checkpointing**, **exactly-once guarantees**, and **error recovery** patterns as defaults.

### 3. **Observability & SLO Enforcement**

- Exposed **Prometheus metrics**.

- Packaged **Grafana dashboards** for SLO visualization and alerting.

- Defined baseline SLOs for **latency**, **throughput**, and **freshness**, enforcing them through the framework’s health monitors.

Everything was **containerized and versioned**, enabling consistent reuse across multiple engagements rather than rebuilding per customer.

---

**Result:**

The framework became a **reference architecture within Confluent** for real-time reconciliation and analytics use cases. It:

- Reduced setup and implementation time for new customer programs.

- Improved **consistency**, **observability**, and **maintainability** of hybrid Flink jobs.

- Enabled a **productized delivery model** — turning what used to be per-customer custom work into an **internal, versioned software component**.

The key engineering takeaway was that **streaming analytics should be treated like a product** — with standardized APIs, observability, and lifecycle management — rather than one-off data pipelines. This shift allowed Confluent’s teams to scale delivery quality and reliability across enterprise environments.

---

**Self-optimizing CDC ingestion and replication platform**

using Kafka Connect and custom Java sink modules for Oracle, Postgres, and SQL Server.

• Built a **Watchdog Service** that periodically analyzed connector performance and DB performance metrics and **auto-tuned CDC source and JDBC sink parameters** to sustain required throughput under varying loads.

• Developed a **Streaming Lag Tracker service** for real-time monitoring of source-to-sink latency and anomaly detection.

• Containerized the full stack (Connect, Watchdog, Lag Tracker) with Helm-based deployment assets for Kubernetes, including Prometheus/Grafana observability and DR automation.

• Reduced new-domain onboarding effort by over 60% and stabilized cross-database CDC throughput within SLA targets.

**Situation:**

Several enterprise teams were modernizing data pipelines to Confluent Kafka, but each business domain was spending weeks building one-off integrations for different source and target databases. The goal was to industrialize this — a reusable, deployable, extendable and observable platform for CDC-based data movement.

I used Kafka Connect as the backbone.

- For sources, we leveraged Oracle and Postgres CDC connectors.

- For sinks, I built a **custom JDBC application** running inside the Connect runtime to handle upsert semantics based on record metadata.

- Both components were packaged as images with Kubernetes deployment templates and observability baked in.

**Key Software Piece — Watchdog Service:**

The major service that facilitated the pipeline was a **Watchdog Service for Day-2 operations ( a smart pipeline observability tool )** — a feedback controller that continuously reads metrics from Prometheus and Kafka Connect REST endpoints.

It periodically adjusted connector parameters — like batch size, commit interval, and fetch delay — to maintain optimal lag and throughput. This made the system adaptive to workload spikes or network fluctuations. It also implemented restart and recovery logic for failed tasks.

**Streaming Lag Tracker:**

Alongside that, I built a **streaming service** that computed and visualized lag from source timestamp to sink acknowledgment in near real time. It powered proactive alerting and automated SLA breach detection.

**Ops and Reliability:**

All components were deployed on Kubernetes with Helm.

We integrated Grafana dashboards, implemented cross-region DR with mirrored offsets, and built CI/CD pipelines for deterministic rollouts.”

**Impact:**

This platform turned what used to be weeks of per-domain setup into a few hours of configuration. Infra teams measured more than 60% faster onboarding, and operational metrics stabilized around single-digit-second average lag for steady loads.”

  

---

**Schema Reconciliation Framework**

Built a Java-based Schema Reconciliation Framework enabling active–active Schema Registry synchronization, a capability not natively supported in Confluent’s platform. Designed algorithms to detect, validate, and reconcile schema deltas across registries while preserving compatibility and semantic integrity. Delivered controlled rollout and rollback pipelines with audit logging and GitOps integration, standardizing schema governance across multi-region environments.

---

**Situation:**

Confluent’s Schema Registry provides strong governance within a single environment, but it does not natively support _active–active multi-region synchronization_.

In large environments, teams often maintain parallel registries — for example, cross-cloud or region-isolated setups — and need to keep them in sync safely.

**Task:**

I built a **Schema Reconciliation Framework** that could identify and safely propagate schema deltas between registries, ensuring compatibility and correctness across regions.

**Action:**

I designed a **Java-based service** that periodically or on-demand:

- Discovers all subjects and schema versions from multiple registries via their REST APIs.

- Computes a **semantic delta plan** by normalizing and diffing schemas.

- Validates compatibility modes and field-level changes before propagation.

- Executes **controlled rollouts** to secondary registries, maintaining transactional logs and rollback checkpoints.
    
    It also provides a REST interface and integrates with GitOps pipelines so schema promotion can be done as part of CI/CD.
    
    The framework was packaged as a **lightweight container service** deployed on Kubernetes — stateless, idempotent, and fully auditable.
    

**Result:**

This closed a major operational gap for active–active schema governance.

It allowed enterprises to synchronize Schema Registries safely across environments, eliminated manual drift, and introduced formal schema lifecycle management where none existed natively in the platform.”