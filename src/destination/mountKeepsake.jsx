import React, { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

const Keepsake = lazy(() => import('./framer/Keepsake.jsx'));

export const SRINAGAR_DESTINATIONS = [
  {
    id: 'floating-market',
    cardIndex: 0,
    title: 'Floating Market, Dal Lake',
    folioNo: 'FOLIO IND-JK-01',
    category: 'TRADING POST & FLOATING GARDENS',
    coords: '34.0837° N, 74.7973° E · GUZARWAN',
    image: '/media/srinagar/01.webp',
    timing: '05:15 – 07:00 IST (Dawn Light)',
    chiefCommodity: 'Nadru (Lotus Root) & Collard Greens',
    cultivation: 'Floating reed wetlands (Radh)',
    elevation: '1,585 M (Jhelum Valley)',
    lede: 'Centuries before modern Srinagar woke to motorized traffic, the waters of Dal Lake sustained an independent floating economy.',
    story: [
      'Every morning before sunrise crests the Zabarwan peaks, Dal Lake stirs in hushed silence. Scores of slender cedar shikaras emerge from mist-shrouded canals into Guzarwan lagoon, laden with newly picked lotus stems (nadru), collard greens, water chestnuts, and fresh turnips harvested from floating reed beds known as radh.',
      'Here, not a single coin changes hands on dry land. Mir Bahri farmers barter produce in swift, low-pitched exchanges, trading crisp bundles of nadru for mounds of fresh knol-khol. By seven in the morning, as golden dawn touches the houseboats, the entire bazaar dissolves back into the water.'
    ]
  },
  {
    id: 'shalimar-bagh',
    cardIndex: 1,
    title: 'Shalimar Bagh Royal Terraces',
    folioNo: 'FOLIO IND-JK-02',
    category: 'MUGHAL IMPERIAL WATER GARDENS',
    coords: '34.1486° N, 74.8722° E · NORTHEAST SHORE',
    image: '/media/srinagar/02.webp',
    timing: '09:00 – 18:00 IST (Spring Bloom)',
    chiefCommodity: 'Chinar Groves & Persian Rose Beds',
    cultivation: 'Harwan mountain stream water canal',
    elevation: '1,610 M (Zabarwan Foothills)',
    lede: 'Commissioned in 1619 by Mughal Emperor Jahangir for Empress Nur Jahan, Shalimar Bagh is the pinnacle of Persian Charbagh design.',
    story: [
      'Constructed as the "Abode of Love", Shalimar Bagh ascends the hillside across four grand tiered terraces. Cascades of glacial meltwater tumble through central stone channels, overflowing past 410 fountains and polished marble pavilions that once hosted royal imperial courts.',
      'The topmost terrace, known as the Zenana Garden, features a pavilion carved from black Kashmiri stone, flanked by ancient Chinar trees that turn fiery crimson in autumn. Here, emperors reclined along marble chaddars (waterfalls) listening to the sound of flowing mountain water.'
    ]
  },
  {
    id: 'pashmina-ateliers',
    cardIndex: 2,
    title: 'Pashmina Weaving Ateliers',
    folioNo: 'FOLIO IND-JK-03',
    category: 'HERITAGE TEXTILE GUILD WORKSHOPS',
    coords: '34.0911° N, 74.8061° E · ZAINAKADAL',
    image: '/media/srinagar/03.webp',
    timing: '08:30 – 17:30 IST (Year-Round)',
    chiefCommodity: 'Hand-Spun Changthangi Pashm',
    cultivation: 'Ladakhi capra undercoat at 14,000 ft',
    elevation: '1,590 M (Old City Quarters)',
    lede: 'Spun from the downy winter undercoat of high-altitude Himalayan goats, authentic Kashmiri Pashmina is so fine it passes through a signet ring.',
    story: [
      'In generational family workshops tucked behind the carved wooden facades of Srinagar\'s old city along the Jhelum River, master artisans preserve six centuries of weaving mastery introduced by Persian Sufi scholar Mir Sayyid Ali Hamadani.',
      'Using traditional wooden handlooms, master weavers follow coded notation scrolls called Talim. Artisans practice delicate Sozni needlework and Kani bobbin weaving, painstakingly guiding hundreds of wooden spools over four to six months to complete a single feather-light heirloom shawl.'
    ]
  },
  {
    id: 'dal-lake-panorama',
    cardIndex: 3,
    title: 'Dal Lake & Houseboat Basin',
    folioNo: 'FOLIO IND-JK-04',
    category: 'NATURAL SANCTUARY & CEDAR CRAFT',
    coords: '34.0750° N, 74.8210° E · BOULEVARD',
    image: '/media/srinagar/04.webp',
    timing: '24 Hours (Twilight & Golden Hour)',
    chiefCommodity: 'Carved Deodar Houseboats & Shikaras',
    cultivation: 'Spring water basins & lotus lagoons',
    elevation: '1,585 M (Valley Heart)',
    lede: 'Covering 18 square kilometers beneath snow-capped Himalayan peaks, Dal Lake is a living wetland kingdom lived upon reflections.',
    story: [
      'Hand-carved cedar houseboats, moored along weeping willows and floating lotus beds, serve as floating sanctuaries where generations of Kashmiri families live attuned to the gentle rhythm of heart-shaped oars and drifting mountain mist.',
      'Each vessel is an architectural marvel built from fragrant deodar wood, adorned with intricate Khatamband woodwork ceilings, Pinjrakari lattice balustrades, and wood-burning bukharis. At dusk, as temple bells and evening prayers drift across the water, the entire lake turns into liquid gold.'
    ]
  }
];

const SRINAGAR_PROPS = {
  image1: '/media/srinagar/01.webp',
  text1: 'Floating market, Dal Lake',
  image2: '/media/srinagar/02.webp',
  text2: 'Shalimar Bagh terraces',
  image3: '/media/srinagar/03.webp',
  text3: 'Pashmina ateliers, Kashmir',
  image4: '/media/srinagar/04.webp',
  text4: 'Dal Lake panorama',
  folderTitle: 'Srinagar',
  folderBody: '2026',
};

function DestinationModal({ destination, onClose, onPrev, onNext, total, currentIndex }) {
  if (!destination) return null;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="ed-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 18, 32, 0.78)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(16px, 3.5vw, 40px)',
        boxSizing: 'border-box',
        animation: 'edModalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        className="ed-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '90vh',
          background: '#FAF7F2',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.15fr) 1.35fr',
          boxShadow: '0 32px 90px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.12)',
          color: '#0E0C0A'
        }}
      >
        {/* Left Side: Photo Column */}
        <div
          style={{
            position: 'relative',
            background: '#0E0C0A',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <img
            src={destination.image}
            alt={destination.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '18px',
              left: '18px',
              background: 'rgba(14, 12, 10, 0.85)',
              backdropFilter: 'blur(8px)',
              color: '#FFFFFF',
              fontFamily: 'monospace',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              padding: '6px 14px',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}
          >
            {destination.folioNo}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '18px',
              left: '18px',
              right: '18px',
              background: 'linear-gradient(transparent, rgba(14, 12, 10, 0.88))',
              padding: '24px 14px 4px 14px',
              color: '#FAF7F2',
              fontFamily: 'monospace',
              fontSize: '10px',
              letterSpacing: '0.12em'
            }}
          >
            {destination.coords}
          </div>
        </div>

        {/* Right Side: Narrative Content Column */}
        <div
          style={{
            padding: 'clamp(24px, 4vw, 44px)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}
        >
          <div>
            {/* Header / Kicker */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
                borderBottom: '1px solid rgba(14, 12, 10, 0.12)',
                paddingBottom: '12px'
              }}
            >
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#1591EA'
                }}
              >
                ● {destination.category}
              </span>
              <button
                onClick={onClose}
                aria-label="Close modal"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#0E0C0A',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            {/* Title */}
            <h2
              style={{
                fontFamily: "'SharpGroteskBlack', 'Sharp Grotesk', system-ui, sans-serif",
                fontSize: 'clamp(1.75rem, 2.5vw, 2.4rem)',
                lineHeight: 1.05,
                letterSpacing: '0.01em',
                margin: '0 0 10px 0',
                textTransform: 'uppercase',
                color: '#0E0C0A'
              }}
            >
              {destination.title}
            </h2>

            {/* Lede */}
            <p
              style={{
                fontFamily: "'Reckless', Georgia, serif",
                fontSize: 'clamp(1.1rem, 1.35vw, 1.25rem)',
                lineHeight: 1.45,
                color: '#2E5E73',
                margin: '0 0 16px 0',
                fontWeight: 500
              }}
            >
              {destination.lede}
            </p>

            {/* Narrative Story */}
            <div style={{ marginBottom: '22px' }}>
              {destination.story.map((para, idx) => (
                <p
                  key={idx}
                  style={{
                    fontFamily: "'Reckless', Georgia, serif",
                    fontSize: '14.5px',
                    lineHeight: 1.65,
                    color: '#3A332C',
                    margin: '0 0 12px 0'
                  }}
                >
                  {para}
                </p>
              ))}
            </div>

            {/* Field Notes Ledger */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                padding: '14px 16px',
                background: '#EFEAE1',
                borderRadius: '8px',
                borderLeft: '3px solid #1591EA',
                marginBottom: '20px'
              }}
            >
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', color: '#6B645B', textTransform: 'uppercase' }}>
                  OPTIMAL WINDOW
                </div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12.5px', fontWeight: 600, color: '#0E0C0A', marginTop: '2px' }}>
                  {destination.timing}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', color: '#6B645B', textTransform: 'uppercase' }}>
                  SIGNATURE HERITAGE
                </div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12.5px', fontWeight: 600, color: '#0E0C0A', marginTop: '2px' }}>
                  {destination.chiefCommodity}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '16px',
              borderTop: '1px solid rgba(14, 12, 10, 0.12)'
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onPrev}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  border: '1px solid rgba(14, 12, 10, 0.25)',
                  background: '#FFFFFF',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.1em'
                }}
              >
                ← PREV
              </button>
              <button
                onClick={onNext}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  border: '1px solid rgba(14, 12, 10, 0.25)',
                  background: '#FFFFFF',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.1em'
                }}
              >
                NEXT →
              </button>
            </div>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 700,
                color: '#6B645B',
                letterSpacing: '0.12em'
              }}
            >
              {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function KeepsakeWithModal(props) {
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    const handleCardOpen = (e) => {
      const idx = e.detail?.cardIndex ?? 0;
      setActiveIndex(idx);
    };
    window.addEventListener('wanderwords:open_destination_card', handleCardOpen);
    return () => window.removeEventListener('wanderwords:open_destination_card', handleCardOpen);
  }, []);

  const handleClose = () => setActiveIndex(null);
  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev !== null ? (prev - 1 + SRINAGAR_DESTINATIONS.length) % SRINAGAR_DESTINATIONS.length : 0));
  }, []);
  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev !== null ? (prev + 1) % SRINAGAR_DESTINATIONS.length : 0));
  }, []);

  const currentDestination = activeIndex !== null ? SRINAGAR_DESTINATIONS[activeIndex] : null;

  return (
    <>
      <Keepsake {...props} />
      {currentDestination && (
        <DestinationModal
          destination={currentDestination}
          onClose={handleClose}
          onPrev={handlePrev}
          onNext={handleNext}
          total={SRINAGAR_DESTINATIONS.length}
          currentIndex={activeIndex}
        />
      )}
    </>
  );
}

export function mountKeepsakes(rootEl) {
  const roots = [];
  rootEl.querySelectorAll('[data-mount-keepsake]').forEach((node) => {
    const r = createRoot(node);
    r.render(
      <Suspense fallback={null}>
        <KeepsakeWithModal {...SRINAGAR_PROPS} />
      </Suspense>
    );
    roots.push(r);
  });
  return roots;
}
