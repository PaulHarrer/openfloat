function injectPiPButton() {
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

const observer = new MutationObserver(() => {
    if (!document.getElementById('custom-twitch-pip-button')) {
        injectPiPButton();
    }
});

observer.observe(document.body, { childList: true, subtree: true });