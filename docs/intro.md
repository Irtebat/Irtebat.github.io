---
sidebar_position: 0
slug: /
title: ""
sidebar_label: "Home"
hide_table_of_contents: true
---

import SuperheroBackground from '@site/src/components/SuperheroBackground';

<SuperheroBackground />

export const ComicCard = ({ title, description, link, issue, color }) => (
  <a href={link} className="comic-card" style={{ '--card-color': color }}>
    <div className="comic-card-top">
      <span className="comic-publisher">BRAIN COMICS</span>
      <span className="comic-price">FREE</span>
    </div>
    <div className="comic-card-visual">
      <h3 className="comic-title">{title}</h3>
      <div className="comic-badge">VOL. {issue}</div>
    </div>
    <div className="comic-card-bottom">
      <p>{description}</p>
      <span className="read-btn">READ ISSUE</span>
    </div>
  </a>
);

<div className="comic-container">
  
  <div className="comic-header">
    <h1>IRTEBAT'S<br/><span className="highlight">SECOND BRAIN</span></h1>
    <p>THE ORIGIN STORY OF ENGINEERING & THOUGHT</p>
  </div>

  <div className="comic-feature-box">
    <h3>SECRET IDENTITY</h3>
    <p>
      By day, I build scalable systems and wrestle with distributed complexities. 
      By night, I document the chaos here. This digital garden is a collection of mental models, 
      technical deep dives, and experiments—a living archive of everything I've learned so I don't have to relearn it later.
    </p>
    <p style={{ marginTop: '1rem' }}>
      <em>Welcome to the headquarters. Pick an issue below to start reading.</em>
    </p>
  </div>

  <div className="comic-section-header">
    <h2>LATEST ISSUES</h2>
    <div className="comic-line"></div>
  </div>

  <div className="comic-grid">
    <ComicCard 
      title="CONCEPT" 
      issue="01"
      description="Unlock superior decision making! Discover the cognitive tools and first principles used by the world's top thinkers."
      link="/concept"
      color="#ef4444"
    />
    <ComicCard 
      title="SYSTEM DESIGN" 
      issue="02"
      description="Go behind the scenes of massive scale! Deep dives into architecture, distributed systems, and the internals of modern tech."
      link="/system-design"
      color="#3b82f6"
    />
    <ComicCard 
      title="PLAYBOOKS" 
      issue="03"
      description="Execute with precision! Actionable guides and step-by-step protocols for engineering leadership and ops."
      link="/playbooks"
      color="#f59e0b"
    />
  </div>

  <div className="comic-feature-box" style={{ marginTop: '4rem', transform: 'rotate(1deg)' }}>
    <h3 style={{ background: 'var(--ifm-color-primary)', transform: 'rotate(2deg)', left: 'auto', right: '1rem' }}>EDITOR'S NOTE</h3>
    <p>
      "Writing is nature's way of letting you know how sloppy your thinking is."
    </p>
    <p style={{ textAlign: 'right', fontWeight: 'bold', marginTop: '0.5rem' }}>— Dick Guindon</p>
  </div>

  <div style={{ marginTop: '5rem', borderTop: '4px solid var(--ifm-font-color-base)', paddingTop: '2rem', textAlign: 'center', fontFamily: 'var(--font-comic-body)' }}>
    <div style={{ fontSize: '1.2rem', color: 'var(--ifm-font-color-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
      © {new Date().getFullYear()} Irtebat's Brain Comics • Printed in the Cloud
    </div>
  </div>
</div>
