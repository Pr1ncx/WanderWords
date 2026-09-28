# WANDERWORDS

An interactive, premium digital travel magazine told as a train journey through 10 Indian destinations:
Srinagar, Manali, Amritsar, Jaipur, Agra, Goa, Munnar, Gangtok, Rann of Kutch and Shillong.

## Experience

1. **Loader** with sound prompt.
2. **Intro gate**: "The INDIAN JOURNEY begins".
3. **Train carriage intro**: an automatic cinematic ride through the countryside ("A journey, ten stops."), with SKIP INTRO and a music button.
4. **Ten stops**: scrolling moves the train. Each city's landmark passes the window while story cards appear. A tunnel transition takes you to the next stop.
5. **Gift**: a downloadable postcard.

## Run locally

```bash
npm install
npm run dev
```

Build for production with `npm run build`.

## Optional sound

Add royalty-free `ambient.mp3` (train or music loop) and `whoosh.mp3` to `public/audio/`. Missing files are ignored.

## Stack

Vite, three.js, GSAP and Lenis. All graphics are generated in code.
