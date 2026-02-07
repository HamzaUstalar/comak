import { useEffect, useRef, useState } from 'react';
import ImageTrail from './components/ImageTrail';
import './App.css';

const media = fileName => `${import.meta.env.BASE_URL}media/${fileName}`;

const trailImages = [
  media('friends-1.jpeg'),
  media('friends-2.jpeg'),
  media('friends-1.jpeg'),
  media('friends-2.jpeg'),
  media('friends-1.jpeg'),
  media('friends-2.jpeg'),
  media('friends-1.jpeg'),
  media('friends-2.jpeg')
];

const backgroundVideos = [media('websitevideo.mp4'), media('friends-loop.mp4')];
const introVideo = media('intro-24-background.mp4');
const introAudio = media('intro-24-audio.m4a');
const revealStages = {
  gate: 'gate',
  unveil: 'unveil',
  done: 'done'
};

function App() {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [revealStage, setRevealStage] = useState(revealStages.gate);
  const [musicStarted, setMusicStarted] = useState(false);
  const [trailAssetsReady, setTrailAssetsReady] = useState(false);
  const [isMobileClient, setIsMobileClient] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return window.matchMedia('(pointer: coarse) and (max-width: 1024px)').matches;
  });
  const videoRefs = useRef([]);
  const revealTimeoutsRef = useRef([]);
  const introAudioRef = useRef(null);

  const finalLayerVisible = revealStage === revealStages.unveil || revealStage === revealStages.done;
  const introVisible = revealStage !== revealStages.done;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: coarse) and (max-width: 1024px)');
    const updateClientType = () => {
      setIsMobileClient(mediaQuery.matches);
    };

    updateClientType();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateClientType);
      return () => mediaQuery.removeEventListener('change', updateClientType);
    }

    mediaQuery.addListener(updateClientType);
    return () => mediaQuery.removeListener(updateClientType);
  }, []);

  useEffect(() => {
    if (!isMobileClient) {
      return undefined;
    }

    const timerId = setInterval(() => {
      setActiveVideoIndex(prevIndex => (prevIndex + 1) % backgroundVideos.length);
    }, 5000);

    return () => clearInterval(timerId);
  }, [isMobileClient]);

  useEffect(() => {
    if (!isMobileClient) {
      return;
    }

    const video = videoRefs.current[activeVideoIndex];
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
  }, [activeVideoIndex, isMobileClient]);

  useEffect(() => {
    let cancelled = false;
    const uniqueTrailImages = [...new Set(trailImages)];

    Promise.all(
      uniqueTrailImages.map(
        url =>
          new Promise(resolve => {
            const image = new Image();
            const done = () => resolve();
            image.onload = done;
            image.onerror = done;
            image.src = url;
            if (image.complete) {
              done();
            }
          })
      )
    ).then(() => {
      if (!cancelled) {
        setTrailAssetsReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const revealTimeouts = revealTimeoutsRef.current;

    return () => {
      revealTimeouts.forEach(timerId => window.clearTimeout(timerId));
    };
  }, []);

  useEffect(() => {
    const introAudioElement = introAudioRef.current;

    return () => {
      if (introAudioElement) {
        introAudioElement.pause();
        introAudioElement.currentTime = 0;
      }
    };
  }, []);

  const handleStartMusic = () => {
    const audio = introAudioRef.current;
    if (!audio) {
      setMusicStarted(true);
      return;
    }

    audio
      .play()
      .then(() => {
        setMusicStarted(true);
      })
      .catch(() => {
        setMusicStarted(true);
      });
  };

  const requestFullscreen = async () => {
    const root = document.documentElement;
    const request =
      root.requestFullscreen || root.webkitRequestFullscreen || root.msRequestFullscreen;

    if (!request) {
      return;
    }

    if (document.fullscreenElement || document.webkitFullscreenElement) {
      return;
    }

    try {
      const response = request.call(root);
      if (response && typeof response.then === 'function') {
        await response;
      }
    } catch {
      // Tam ekran izni tarayıcı tarafından engellenirse normal akış devam eder.
    }
  };

  const handleIntroClick = async () => {
    if (revealStage !== revealStages.gate) {
      return;
    }

    if (!trailAssetsReady) {
      return;
    }

    await requestFullscreen();
    setRevealStage(revealStages.unveil);

    const doneTimer = window.setTimeout(() => {
      setRevealStage(revealStages.done);
    }, 420);

    revealTimeoutsRef.current.push(doneTimer);
  };

  if (!isMobileClient) {
    return (
      <div className="desktop-lock">
        <div className="desktop-lock-card">
          <h1>Bu site sadece mobil için aktif</h1>
          <p>Devam etmek için telefondan aç.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <audio ref={introAudioRef} src={introAudio} loop preload="auto" aria-hidden="true" />

      <main className={`birthday-page ${finalLayerVisible ? 'is-revealed' : 'is-locked'}`}>
        <div className="video-background" aria-hidden="true">
          {backgroundVideos.map((videoSrc, index) => (
            <video
              key={videoSrc}
              ref={node => {
                videoRefs.current[index] = node;
              }}
              className={`background-video ${activeVideoIndex === index ? 'is-active' : 'is-idle'}`}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          ))}
        </div>
        <div className="video-overlay" aria-hidden="true" />

        <section className="hero-content">
          <h1>Doğum Günün Kutlu Olsun Çomak Kardeeşş</h1>
          <p className="hero-subtitle">Parmağını ekranda gezdir</p>
          <p className="hero-note">Hediye alacak param yok amk idare et piç</p>
        </section>

        <section className="image-trail-stage" aria-label="Anılar">
          <ImageTrail items={trailImages} variant={2} />
        </section>
      </main>

      {introVisible && (
        <div className={`intro-layer ${revealStage !== revealStages.gate ? 'is-leaving' : ''}`}>
          <video className="intro-video" autoPlay loop muted playsInline preload="auto" aria-hidden="true">
            <source src={introVideo} type="video/mp4" />
          </video>
          <div className="intro-video-overlay" aria-hidden="true" />

          <section className="intro-center">
            <div className="intro-cta-wrap">
              {!musicStarted ? (
                <button className="intro-button" type="button" onClick={handleStartMusic}>
                  Müziği Başlat
                </button>
              ) : (
                <button
                  className="intro-button"
                  type="button"
                  onClick={handleIntroClick}
                  disabled={!trailAssetsReady}
                >
                  {trailAssetsReady ? 'Butona Bas Amına Çaktığım' : 'Fotoğraflar Yükleniyor...'}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
