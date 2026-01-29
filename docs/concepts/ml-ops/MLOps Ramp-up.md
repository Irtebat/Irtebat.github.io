## Day 1 — What MLOps Is and Why ML Fails in Production

### Primary (Must Read)

1. **Hidden Technical Debt in Machine Learning Systems**  
    Google Research  
    [https://papers.nips.cc/paper/2015/file/86df7dcfd896fcaf2674f757a2463eba-Paper.pdf](https://papers.nips.cc/paper/2015/file/86df7dcfd896fcaf2674f757a2463eba-Paper.pdf)  
    Focus sections:
    
    - ML system diagram
        
    - Data dependencies
        
    - Configuration debt
        
2. **Rules of Machine Learning: Best Practices for ML Engineering**  
    Google  
    [https://developers.google.com/machine-learning/guides/rules-of-ml](https://developers.google.com/machine-learning/guides/rules-of-ml)  
    Read Rules 1–30 only.
    

### Short Video (Optional)

- **MLOps Explained** – Google Cloud Tech  
    [https://www.youtube.com/watch?v=06-AZXmwHjo](https://www.youtube.com/watch?v=06-AZXmwHjo)
    

### Outcome

You should clearly articulate:

- Why DevOps mental models fail for ML
    
- Why data is the dominant risk factor
    

---

## Day 2 — Data, Features, and Reproducibility

### Primary Reads

1. **The Hard Parts of Machine Learning**  
    Google Engineering Blog  
    https://ai.googleblog.com/2018/03/the-hard-parts-of-machine-learning.html
    
2. **Feature Stores: The Missing Piece in MLOps**  
    Feast Blog (conceptual)  
    [https://feast.dev/blog/what-is-a-feature-store/](https://feast.dev/blog/what-is-a-feature-store/)
    

### Deep Concept Read (Skim)

3. **Data Validation for Machine Learning**  
    TensorFlow Data Validation  
    https://www.tensorflow.org/tfx/data_validation
    

### Key Concepts to Extract

- Point-in-time correctness
    
- Feature leakage
    
- Dataset versioning vs code versioning
    

---

## Day 3 — Training Pipelines, CI/CD, Deployment Patterns

### Primary Reads

1. **Continuous Delivery for Machine Learning**  
    Google Cloud Architecture  
    [https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning)
    
2. **Machine Learning Deployment Patterns**  
    Martin Fowler  
    [https://martinfowler.com/articles/cd4ml.html](https://martinfowler.com/articles/cd4ml.html)
    

### Short Video

- **CI/CD for Machine Learning** – Chip Huyen  
    [https://www.youtube.com/watch?v=KJtZARuO3JY](https://www.youtube.com/watch?v=KJtZARuO3JY)
    

### Concepts to Internalize

- Why models need registries
    
- Why canary deployments matter more for ML
    
- Why training pipelines are not build pipelines
    

---

## Day 4 — Monitoring, Drift, and Governance

### Primary Reads

1. **Monitoring Machine Learning Models in Production**  
    Google  
    https://cloud.google.com/architecture/mlops-monitoring
    
2. **Concept Drift and Data Drift in ML Systems**  
    Evidently AI Blog  
    https://www.evidentlyai.com/ml-monitoring/data-drift
    

### Governance and Risk

3. **Model Governance for ML Systems**  
    Microsoft Learn  
    https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/model-governance
    

### Key Mental Models

- Proxy metrics vs true labels
    
- Alerting humans vs auto-retraining
    
- Auditability over accuracy
    

---

## Day 5 — Tooling Landscape and Reference Architectures

### Tool Landscape (High-Level Only)

1. **MLOps Stack Explained**  
    Chip Huyen  
    [https://huyenchip.com/2020/12/30/mlops-v2.html](https://huyenchip.com/2020/12/30/mlops-v2.html)
    
2. **MLflow Concepts (Not Tutorials)**  
    https://mlflow.org/docs/latest/concepts.html
    
3. **Kubeflow Pipelines Overview**  
    [https://www.kubeflow.org/docs/components/pipelines/overview/](https://www.kubeflow.org/docs/components/pipelines/overview/)
    

### Architecture Reference

4. **End-to-End MLOps Architecture**  
    Google  
    https://cloud.google.com/architecture/reference-architectures/mlops
    

### Final Synthesis Resource

5. **Designing Machine Learning Systems** (Book – selective reading)  
    Chip Huyen  
    Chapters to read:
    
    - Chapter 1: Overview of ML Systems
        
    - Chapter 6: Model Deployment and Prediction Service
        
    - Chapter 9: Continual Learning and Monitoring
        

---

## One-Page Cheat Sheet (What You Should Walk Away With)

You should be able to confidently explain:

- What must be versioned: **data, features, models, metrics**
    
- Why monitoring is harder than deployment
    
- Why automation increases risk early
    
- Why most ML outages are data-related, not code-