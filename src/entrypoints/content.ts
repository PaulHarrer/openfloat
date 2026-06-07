export default defineContentScript({
  matches: [
    '*://*.twitch.tv/*',
    '*://*.youtube.com/*',
    '*://*.joyn.de/*',
    '*://*.joyn.at/*',
    '*://*.orf.at/*',
    '*://*.zdf.de/*',
    '*://*.zdfheute.de/*',
  ],
  allFrames: true,
  main() {
    function querySelectorDeep(selector: string, root: Document | ShadowRoot = document): Element | null {
      const element = root.querySelector(selector);
      if (element) return element;

      const all = root.querySelectorAll('*');
      for (const el of all) {
        if (el.shadowRoot) {
          const found = querySelectorDeep(selector, el.shadowRoot);
          if (found) return found;
        }
      }
      return null;
    }

    function findAllVideosDeep(root: Document | ShadowRoot = document, results: HTMLVideoElement[] = []): HTMLVideoElement[] {
      if (!root) return results;
      const videos = root.querySelectorAll('video');
      for (const v of videos) {
        results.push(v);
      }

      const all = root.querySelectorAll('*');
      for (const el of all) {
        if (el.shadowRoot) {
          findAllVideosDeep(el.shadowRoot, results);
        }
      }
      return results;
    }

    function findActiveVideoDeep(): HTMLVideoElement | null {
      const videos = findAllVideosDeep();
      if (videos.length === 0) return null;
      if (videos.length === 1) return videos[0];

      let bestVideo: HTMLVideoElement | null = null;
      let bestScore = -1;

      for (const video of videos) {
        let score = 0;

        if (video.src || video.querySelector('source')) score += 10;
        if (video.offsetWidth > 0 && video.offsetHeight > 0) score += 5;
        if (video.currentTime > 0) score += 5;
        if (!video.paused) score += 5;
        if (video.readyState > 0) score += 3;

        if (score > bestScore) {
          bestScore = score;
          bestVideo = video;
        }
      }

      return bestVideo || videos[0];
    }

    function handleTwitchPiP() {
      if (document.getElementById('custom-twitch-pip-button')) return;

      const fullscreenButton = document.querySelector('[data-a-target="player-fullscreen-button"]');
      if (!fullscreenButton) return;

      const fullscreenContainer = fullscreenButton.closest('.InjectLayout-sc-1i43xsx-0');
      if (!fullscreenContainer) return;

      const pipContainer = document.createElement('div');
      pipContainer.className = fullscreenContainer.className;
      pipContainer.id = 'custom-twitch-pip-button';

      pipContainer.innerHTML = `
        <div class="Layout-sc-1xcs6mc-0 ScLayoutCssVars-sc-1pn65j5-0 jfyitl hjknGi">
            <button class="ScCoreButton-sc-ocjdkq-0 glPhvE ScButtonIcon-sc-9yap0r-0 dgVYJo" aria-label="Bild-in-Bild (PiP)" aria-haspopup="menu">
                <div class="ButtonIconFigure-sc-1emm8lf-0 lnTwMD">
                    <div class="ScSvgWrapper-sc-wkgzod-0 kccyMt tw-svg">
                        <svg width="24" height="24" viewBox="0 0 24 24" focusable="false" aria-hidden="true" fill="currentColor">
                            <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z"></path>
                        </svg>
                    </div>
                </div>
            </button>
        </div>
      `;

      const buttonElement = pipContainer.querySelector('button')!;
      buttonElement.addEventListener('click', async () => {
        const video = document.querySelector('video');
        if (!video) return;

        try {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
          } else {
            await video.requestPictureInPicture();
          }
        } catch (error) {
          console.error('Fehler beim Umschalten von PiP:', error);
        }
      });

      fullscreenContainer.parentNode!.insertBefore(pipContainer, fullscreenContainer);
    }

    function handleYouTubePiP() {
      let pipButton = document.querySelector<HTMLButtonElement>('.ytp-pip-button');
      const fullscreenButton = document.querySelector('.ytp-fullscreen-button');

      if (!fullscreenButton) return;

      if (!document.getElementById('custom-youtube-pip-style')) {
        const style = document.createElement('style');
        style.id = 'custom-youtube-pip-style';
        style.textContent = `
          .ytp-pip-button {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            vertical-align: middle !important;
            position: relative !important;
          }
          .ytp-pip-button svg {
            width: 36px !important;
            height: 36px !important;
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
          }
        `;
        document.head.appendChild(style);
      }

      if (!pipButton) {
        pipButton = document.createElement('button');
        pipButton.className = 'ytp-pip-button ytp-button';
        pipButton.title = 'Bild im Bild';
        pipButton.setAttribute('data-tooltip-title', 'Bild im Bild');
        pipButton.innerHTML = `
          <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
            <use class="ytp-svg-shadow" xlink:href="#ytp-id-25"></use>
            <path d="M25,17 L17,17 L17,23 L25,23 L25,17 L25,17 Z M29,25 L29,10.98 C29,9.88 28.1,9 27,9 L9,9 C7.9,9 7,9.88 7,10.98 L7,25 C7,26.1 7.9,27 9,27 L27,27 C28.1,27 29,26.1 29,25 L29,25 Z M27,25.02 L9,25.02 L9,10.97 L27,10.97 L27,25.02 L27,25.02 Z" fill="#fff" id="ytp-id-25"></path>
          </svg>
        `;
      }

      if (pipButton.style.display !== 'inline-block') {
        pipButton.style.setProperty('display', 'inline-block', 'important');
      }

      if (pipButton.parentNode !== fullscreenButton.parentNode || pipButton.nextElementSibling !== fullscreenButton) {
        fullscreenButton.parentNode!.insertBefore(pipButton, fullscreenButton);
      }

      if (!pipButton.dataset.pipListenerAdded) {
        pipButton.dataset.pipListenerAdded = 'true';
        pipButton.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();

          const playerContainer = fullscreenButton.closest('.html5-video-player');
          const video = playerContainer ? playerContainer.querySelector('video') : document.querySelector('video');
          if (!video) return;

          try {
            if (document.pictureInPictureElement) {
              await document.exitPictureInPicture();
            } else {
              await video.requestPictureInPicture();
            }
          } catch (error) {
            console.error('Fehler beim Umschalten von PiP auf YouTube:', error);
          }
        });
      }
    }

    function handleJoynPiP() {
      if (querySelectorDeep('#custom-joyn-pip-button')) return;

      const fullscreenButton = querySelectorDeep('.fullscreen-button');
      if (!fullscreenButton) return;

      const pipButton = document.createElement('button');
      pipButton.id = 'custom-joyn-pip-button';
      pipButton.type = 'button';
      pipButton.className = 'button pip-button visible';
      pipButton.style.display = 'inline-flex';
      pipButton.style.alignItems = 'center';
      pipButton.style.justifyContent = 'center';
      pipButton.style.cursor = 'pointer';
      pipButton.title = 'Bild-in-Bild';
      pipButton.setAttribute('aria-label', 'Bild-in-Bild');
      pipButton.setAttribute('tabindex', '0');

      pipButton.innerHTML = `
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="display: block; margin: auto; width: 24px; height: 24px;">
          <path fill="currentColor" d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z"></path>
        </svg>
      `;

      pipButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const video = findActiveVideoDeep();
        if (!video) {
          console.error('OpenFloat: Kein aktives Video-Element auf Joyn gefunden.');
          return;
        }

        if (video.disablePictureInPicture) {
          video.disablePictureInPicture = false;
        }

        try {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
          } else {
            await video.requestPictureInPicture();
          }
        } catch (error) {
          console.error('OpenFloat: Fehler beim Umschalten von PiP auf Joyn:', error);
        }
      });

      fullscreenButton.parentNode!.insertBefore(pipButton, fullscreenButton);
    }

    function handleOrfPiP() {
      if (document.getElementById('player-button-pip')) return;

      const fullscreenButton = document.getElementById('player-button-fullscreen');
      if (!fullscreenButton) return;

      const pipButton = document.createElement('button');
      pipButton.type = 'button';
      pipButton.className = 'player-controls-button b-button';
      pipButton.id = 'player-button-pip';
      pipButton.setAttribute('data-test-id', 'player-button-pip');
      pipButton.setAttribute('tabindex', '0');
      pipButton.style.setProperty('--button-width', '1.3');
      pipButton.style.setProperty('--button-height', '1.3');

      const iconContainer = document.createElement('div');
      iconContainer.className = 'b-icon button-icon';
      const svgPath = 'M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z';
      iconContainer.style.backgroundImage = `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fff'%3E%3Cpath d='${svgPath}'/%3E%3C/svg%3E")`;

      const textSpan = document.createElement('span');
      textSpan.className = 'visuallyhidden';
      textSpan.setAttribute('aria-live', 'polite');
      textSpan.setAttribute('aria-atomic', 'true');
      textSpan.textContent = 'Bild-in-Bild';

      pipButton.appendChild(iconContainer);
      pipButton.appendChild(textSpan);

      pipButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const video = findActiveVideoDeep();
        if (!video) {
          console.error('OpenFloat: Kein aktives Video-Element auf ORF gefunden.');
          return;
        }

        try {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
          } else {
            await video.requestPictureInPicture();
          }
        } catch (error) {
          console.error('OpenFloat: Fehler beim Umschalten von PiP auf ORF:', error);
        }
      });

      fullscreenButton.parentNode!.insertBefore(pipButton, fullscreenButton);
    }

    function handleZdfPiP() {
      if (document.getElementById('custom-zdf-pip-button')) return;

      const fullscreenButton = document.querySelector('.button-fullscreen');
      if (!fullscreenButton) return;

      const fullscreenContainer = fullscreenButton.closest('[class*="fullscreen-control"]');
      if (!fullscreenContainer) return;

      // Add custom styles if they don't exist yet
      if (!document.getElementById('custom-zdf-pip-style')) {
        const style = document.createElement('style');
        style.id = 'custom-zdf-pip-style';
        style.textContent = `
          .zdfplayer-icon-pip::before {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z'/%3E%3C/svg%3E") !important;
          }
        `;
        document.head.appendChild(style);
      }

      const pipButton = document.createElement('button');
      for (const attr of fullscreenButton.attributes) {
        if (attr.name !== 'class' && attr.name !== 'aria-label' && attr.name !== 'aria-controls') {
          pipButton.setAttribute(attr.name, attr.value);
        }
      }
      pipButton.id = 'custom-zdf-pip-button';
      pipButton.setAttribute('aria-label', 'Bild-in-Bild');
      pipButton.title = 'Bild-in-Bild';

      const classList = Array.from(fullscreenButton.classList)
        .filter(c => c !== 'button-fullscreen' && c !== 'button-fullscreen-exit');
      pipButton.className = classList.join(' ') + ' button-pip';

      const span = document.createElement('span');
      const fullscreenSpan = fullscreenButton.querySelector('span');
      if (fullscreenSpan) {
        const spanClasses = Array.from(fullscreenSpan.classList)
          .filter(c => c !== 'zdfplayer-icon-fullscreen' && c !== 'zdfplayer-icon-fullscreen-exit');
        span.className = spanClasses.join(' ') + ' zdfplayer-icon-pip';
      } else {
        span.className = 'zdfplayer-button-icon zdfplayer-icon-pip';
      }
      pipButton.appendChild(span);

      pipButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const video = findActiveVideoDeep();
        if (!video) {
          console.error('OpenFloat: Kein aktives Video-Element auf ZDF gefunden.');
          return;
        }

        video.removeAttribute('disablepictureinpicture');
        video.disablePictureInPicture = false;

        try {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
          } else {
            await video.requestPictureInPicture();
          }
        } catch (error) {
          console.error('OpenFloat: Fehler beim Umschalten von PiP auf ZDF:', error);
        }
      });

      fullscreenContainer.parentNode!.insertBefore(pipButton, fullscreenContainer);
    }

    function runInjection() {
      const hostname = window.location.hostname;
      if (hostname.includes('twitch.tv')) {
        handleTwitchPiP();
      } else if (hostname.includes('youtube.com')) {
        handleYouTubePiP();
      } else if (hostname.includes('joyn.de') || hostname.includes('joyn.at')) {
        handleJoynPiP();
      } else if (hostname.includes('orf.at')) {
        handleOrfPiP();
      } else if (hostname.includes('zdf.de') || hostname.includes('zdfheute.de')) {
        handleZdfPiP();
      }
    }

    const observer = new MutationObserver(() => {
      runInjection();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    runInjection();

    setInterval(runInjection, 1000);
  },
});
