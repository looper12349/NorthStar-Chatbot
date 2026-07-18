import React from 'react';
import SupportWidget from './components/SupportWidget';
import './App.css';

/**
 * Demo host page: a lightweight storefront backdrop that the support
 * widget floats over, tall enough to verify the widget never scrolls
 * the host page. The widget itself is self-contained in SupportWidget.
 */
const DEMO_PRODUCTS = [
  ['Ridgeline Shell Jacket', 'Waterproof, packable, trail-tested'],
  ['Summit 45L Pack', 'Adjustable suspension for long hauls'],
  ['Cascade Trail Runners', 'Grip for fast and light days'],
  ['Basecamp 4 Tent', 'Roomy shelter for family trips'],
  ['Ember Down Quilt', 'Warmth without the weight'],
  ['Northline Trekking Poles', 'Carbon, collapsible, dependable']
];

function App() {
  return (
    <div className="App">
      <header className="demo-nav">
        <span className="demo-brand">North Star Outdoors</span>
        <nav className="demo-links" aria-label="Demo navigation">
          <span>Gear</span>
          <span>Trails</span>
          <span>Stories</span>
          <span>Support</span>
        </nav>
      </header>

      <main>
        <section className="demo-hero">
          <h1>Find your north.</h1>
          <p>
            Gear for the trail, the summit, and everything in between. This demo storefront hosts
            the support chat — the star button in the corner.
          </p>
        </section>

        <section className="demo-grid" aria-label="Featured gear">
          {DEMO_PRODUCTS.map(([name, blurb]) => (
            <article className="demo-card" key={name}>
              <div className="demo-card-art" aria-hidden="true" />
              <h2>{name}</h2>
              <p>{blurb}</p>
            </article>
          ))}
        </section>

        <section className="demo-hero demo-footer-block">
          <h1>Out there is calling.</h1>
          <p>Scroll all you like — the chat stays put and never moves this page.</p>
        </section>
      </main>
    </div>
  );
}

function AppWithWidget() {
  return (
    <>
      <App />
      <SupportWidget />
    </>
  );
}

export default AppWithWidget;
