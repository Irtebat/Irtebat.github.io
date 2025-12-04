---
sidebar_position: 1
title: About Me
description: Senior Engineer specializing in distributed systems, platform engineering, and data streaming. Learn about my experience and background.
hide_table_of_contents: true
---

import SuperheroBackground from '@site/src/components/SuperheroBackground';

<div className="profile-container">
  
  <div className="profile-header">
    <div className="profile-image-container">
      <img 
        src="/img/profile.jpeg" 
        alt="Irtebat Shaukat" 
        className="profile-image"
      />
    </div>
    
    <div className="profile-info">
      <h1 className="profile-name">IRTEBAT SHAUKAT</h1>
      <h2 className="profile-title">PLATFORM ENGINEER</h2>
      
      <div style={{ marginTop: '1rem' }}>
        <a 
          href="https://drive.google.com/file/d/15kpWr1hmLw-4UHmCz9iOHgZFsVOpsMx2/view?usp=drive_link" 
          target="_blank" 
          rel="noopener noreferrer"
          className="comic-resume-btn-small"
        >
          📄 VIEW RESUME
        </a>
      </div>
      
      <div className="profile-socials">
        <a href="https://linkedin.com/in/irtebat" target="_blank" rel="noopener noreferrer">LinkedIn</a> • 
        <a href="https://github.com/Irtebat" target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
    </div>
  </div>

  <div className="profile-content">
    <div className="comic-feature-box" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
      <h3>BIO</h3>
      <div style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--ifm-font-color-secondary)' }}>
        Senior Engineer specializing in distributed systems, platform engineering, and data streaming.
        <br/>
        My work sits at the intersection of software engineering, platform architecture, and DevOps automation. 
        Over the years, I have designed and implemented high-throughput streaming platforms, microservice architectures, and cloud-native pipelines for organizations across domains such as Retail, Banking, and E-commerce — always with an emphasis on reliability, observability, and developer velocity.
      </div>
    </div>

    <div className="profile-section">
      <h3 className="section-title">EXPERIENCE</h3>
      
      {/* Confluent */}
      <div className="experience-group">
        <h4 className="experience-company-title">CONFLUENT</h4>
        
        <div className="experience-sub-item">
          <div className="experience-role-header">
            <span className="experience-role-name">Senior Engineer</span>
            <span className="experience-sub-date">2024 - Present • Remote</span>
          </div>
          <p className="experience-description">
            Lead the design and deployment of large-scale data platforms and real-time stream processing solutions for Confluent’s enterprise-users.
          </p>
        </div>

        <div className="experience-sub-item">
          <div className="experience-role-header">
            <span className="experience-role-name">Engineer</span>
            <span className="experience-sub-date">2022 - 2024 • Remote</span>
          </div>
          <p className="experience-description">
            Designed, developed, and operationalised high-performance, scalable, and resilient enterprise-user experiences as a hands-on technical consulting engineer. 
          </p>
        </div>
      </div>

      {/* Cisco */}
      <div className="experience-group">
        <h4 className="experience-company-title">CISCO</h4>
        
        <div className="experience-sub-item">
          <div className="experience-role-header">
            <span className="experience-role-name">Engineer</span>
            <span className="experience-sub-date">2022 - 2024 • Remote</span>
          </div>
            <p className="experience-description">
            In this role, I was responsible for development of automation tools to provide operational recommendations and generate insights for Enterprise customers.
          </p>
        </div>
      </div>

    </div>

  </div>
</div>
