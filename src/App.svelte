<script>
  import { onMount } from 'svelte'

  const modes = ['Story Mode', 'Arcade Mode', 'Co-op Mode']
  const bootMessages = [
    'Calibrating party lasers',
    'Syncing birthday timeline',
    'Loading confetti physics',
    'Verifying hype levels'
  ]

  let phase = 'intro'
  let selectedMode = 0
  let bootProgress = 0

  let canvas
  let frameId
  let bootIntervalId
  let resizeHandler

  const stars = []
  const STAR_COUNT = 160

  function startExperience() {
    if (phase !== 'intro') return

    phase = 'boot'
    bootProgress = 0

    bootIntervalId = window.setInterval(() => {
      bootProgress = Math.min(100, bootProgress + Math.round(Math.random() * 16 + 8))
      if (bootProgress >= 100) {
        window.clearInterval(bootIntervalId)
        phase = 'reveal'
      }
    }, 130)
  }

  function onKeydown(event) {
    if (phase === 'intro' && event.key === 'ArrowDown') {
      selectedMode = (selectedMode + 1) % modes.length
      return
    }

    if (phase === 'intro' && event.key === 'ArrowUp') {
      selectedMode = (selectedMode - 1 + modes.length) % modes.length
      return
    }

    if ((phase === 'intro' || phase === 'boot') && event.key === 'Enter') {
      startExperience()
      return
    }

    if (phase === 'reveal' && event.key.toLowerCase() === 'r') {
      phase = 'intro'
      bootProgress = 0
    }
  }

  onMount(() => {
    const context = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const buildStars = () => {
      stars.length = 0
      for (let i = 0; i < STAR_COUNT; i += 1) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.8 + 0.3,
          speed: Math.random() * 0.45 + 0.12,
          alpha: Math.random() * 0.55 + 0.2
        })
      }
    }

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)

      const speedMultiplier = phase === 'boot' ? 3.8 : phase === 'reveal' ? 1.9 : 1
      for (const star of stars) {
        star.y += star.speed * speedMultiplier
        if (star.y > canvas.height + 6) {
          star.y = -6
          star.x = Math.random() * canvas.width
        }

        context.beginPath()
        context.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        context.fillStyle = `rgba(19, 32, 64, ${star.alpha})`
        context.fill()
      }

      if (phase === 'boot') {
        context.fillStyle = 'rgba(235, 83, 42, 0.12)'
        context.fillRect(0, 0, canvas.width, canvas.height)
      }

      frameId = window.requestAnimationFrame(draw)
    }

    resize()
    buildStars()
    draw()

    resizeHandler = () => {
      resize()
      buildStars()
    }

    window.addEventListener('resize', resizeHandler)

    window.addEventListener('keydown', onKeydown)

    return () => {
      if (bootIntervalId) {
        window.clearInterval(bootIntervalId)
      }
      window.removeEventListener('keydown', onKeydown)
      window.removeEventListener('resize', resizeHandler)
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
    }
  })
</script>

<canvas bind:this={canvas} class="starfield" aria-hidden="true"></canvas>

<main class="viewport">
  <header class="hud" aria-hidden="true">
    <p>Player: Bhuvi</p>
    <p>Mode: {modes[selectedMode]}</p>
    <p>Level: Birthday Quest</p>
  </header>

  <section class="panel intro" class:hidden={phase !== 'intro'}>
    <p class="meta">Birthday.exe</p>
    <h1 class="command">Press Enter To Start</h1>
    <p class="helper">Use Up/Down arrows to pick a mode.</p>

    <ul class="mode-list" aria-label="Game mode list">
      {#each modes as mode, index}
        <li class:selected={index === selectedMode}>{mode}</li>
      {/each}
    </ul>

    <button class="start" on:click={startExperience}>Launch Mission</button>
  </section>

  <section class="panel boot" class:visible={phase === 'boot'}>
    <p class="meta">Initializing...</p>
    <h2 class="boot-title">Loading Celebration Engine</h2>
    <div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={bootProgress}>
      <span style={`width: ${bootProgress}%`}></span>
    </div>
    <p class="boot-status">{bootMessages[Math.min(bootMessages.length - 1, Math.floor(bootProgress / 25))]} • {bootProgress}%</p>
  </section>

  <section class="panel reveal" class:visible={phase === 'reveal'}>
    <p class="meta">Transmission</p>
    <h2 class="line-one">Happy Birthday</h2>
    <h3 class="line-two">Bhuvi!</h3>
    <p class="wish">Main character energy unlocked. Press R to replay.</p>
  </section>

  <footer class="controls" aria-hidden="true">Controls: Enter Start • Up/Down Select Mode • R Replay</footer>
</main>
