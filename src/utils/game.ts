export class Game {
  screen: GameScreen
  time: GameTime
  hook: GameHookManager

  constructor(public canvasEl: HTMLCanvasElement) {
    this.screen = new GameScreen(this, canvasEl)
    this.time = new GameTime(this)
    this.hook = new GameHookManager()
  }

  start() {
    this.time.start()
  }

  restart() {
    this.time.stop()
    this.time.start()
  }

  stop() {
    this.time.stop()
  }

  destroy() {
    this.time.stop()
  }
}

export interface Hook {
  key: string
  callback: (...args: any[]) => void
}

export class GameHookManager {
  hooks: Hook[] = []

  add(key: string, callback: (...args: any[]) => void) {
    this.hooks.push({ key, callback });
  }

  remove(key: string, callback: (...args: any[]) => void) {
    const index = this.hooks.findIndex(hook => hook.key === key && hook.callback === callback)
    if (index > -1) this.hooks.splice(index, 1)
  }

  dispatch(key: string, ...args: any[]) {
    this.hooks.filter(hook => hook.key === key).forEach(hook => hook.callback(...args))
    // console.log(key)
  }
}

export class GameTime {
  lastTime: number = 0
  startTime: number = 0
  fps: number = 60
  fpsInterval: number = 1000
  anim: number = 0
  state: 'stopped' | 'running' = 'stopped'

  constructor(public game: Game) {}

  start() {
    this.game.hook.dispatch('start')
    this.startAnimating()
  }

  startAnimating() {
    this.fpsInterval = 1000 / this.fps
    this.lastTime = Date.now()
    this.startTime = this.lastTime;
    this.state = 'running'
    this.update();
  }

  update() {
    if (this.state === 'stopped') return
    const currTime = Date.now()
    const elapsed = currTime - this.lastTime
    const time = currTime - this.startTime
    this.game.hook.dispatch('update:physics', elapsed)
    if (elapsed > this.fpsInterval) {
      this.game.screen.clear()
      this.lastTime = currTime - (elapsed % this.fpsInterval)
      this.game.hook.dispatch('update', time, elapsed)
      try {
        this.game.screen.objects.forEach(object => object.update(time, elapsed))
      } catch (error) {}
      this.draw(time, elapsed)
    }
    this.anim = requestAnimationFrame(this.update.bind(this))
  }

  draw(time: number, delta: number) {
    this.game.hook.dispatch('draw')
    try {
      this.game.screen.objects.forEach(object => object.draw(time, delta))
    } catch (error) {}
  }

  stop() {
    this.game.hook.dispatch('stop')
    cancelAnimationFrame(this.anim)
    this.state = 'stopped'
    this.game.screen.objects.forEach(object => object.destroy())
    this.game.screen.objects = []
    this.game.screen.clear()
  }
}

export class GameScreen {
  ctx: CanvasRenderingContext2D
  objects: GameObject[] = []

  constructor(public game: Game, public canvasEl: HTMLCanvasElement) {
    this.ctx = canvasEl.getContext('2d') as CanvasRenderingContext2D 
  }

  getWidth() {
    return this.canvasEl.width
  }

  getHeight() {
    return this.canvasEl.height
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height)
  }

  addRect(x: number, y: number, width: number, height: number, style: string) {
    return new Rect(this, x, y, width, height, style)
  }
}


export class GameObject {
  hook: GameHookManager

  constructor(public screen: GameScreen) {
    this.screen.objects.push(this)
    this.hook = new GameHookManager()
  }

  update(time: number, delta: number) {}

  draw(time: number, delta: number) {}

  destroy() {
    this.screen.objects.splice(this.screen.objects.indexOf(this), 1)
    this.hook.dispatch('destroy')
  }
}

export class Rect extends GameObject {
  constructor(public screen: GameScreen, public x: number, public y: number, public width: number, public height: number, public fillStyle?: string, public strokeStyle?: string) {
    super(screen)
  }

  draw(delta: number): void {
    const { ctx } = this.screen
    ctx.beginPath()
    ctx.rect(this.x, this.y, this.width, this.height)
    // fill
    if (this.fillStyle) {
      ctx.fillStyle = this.fillStyle
      ctx.fill()
    }
    // stroke
    if (this.strokeStyle) {
      ctx.strokeStyle = this.strokeStyle
      ctx.stroke()
    }
    ctx.closePath()
  }
}