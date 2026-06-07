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

    const buttonElement = pipContainer.querySelector('button');
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
            console.error("Fehler beim Umschalten von PiP:", error);
        }
    });

    fullscreenContainer.parentNode.insertBefore(pipContainer, fullscreenContainer);
}

function handleYouTubePiP() {
    let pipButton = document.querySelector('.ytp-pip-button');
    const fullscreenButton = document.querySelector('.ytp-fullscreen-button');

    if (!fullscreenButton) return;

    // Inject CSS to override YouTube's display: none and center the icon
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

    // Force inline-block style
    if (pipButton.style.display !== 'inline-block') {
        pipButton.style.setProperty('display', 'inline-block', 'important');
    }

    // Move before fullscreen button if not already there
    if (pipButton.parentNode !== fullscreenButton.parentNode || pipButton.nextElementSibling !== fullscreenButton) {
        fullscreenButton.parentNode.insertBefore(pipButton, fullscreenButton);
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
                console.error("Fehler beim Umschalten von PiP auf YouTube:", error);
            }
        });
    }
}

function runInjection() {
    const hostname = window.location.hostname;
    if (hostname.includes('twitch.tv')) {
        handleTwitchPiP();
    } else if (hostname.includes('youtube.com')) {
        handleYouTubePiP();
    }
}

const observer = new MutationObserver(() => {
    runInjection();
});

observer.observe(document.body, { childList: true, subtree: true });

// Run once immediately
runInjection();