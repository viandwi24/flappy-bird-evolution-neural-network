import { GameObject, GameScreen, Rect } from './game'
import { NeuralNetwork } from './neural-network'

export class Bird extends Rect {
  velocity = 0
  gravity = 0.25
  keyPress = false
  brain: NeuralNetwork
  score: number = 0
  travelledDistance: number = 0
  fitness: number = 0
  predictedTable: {
    time: number,
    inputs: number[],
    outputs: Float32Array | Int32Array | Uint8Array,
  }[] = []
  
  constructor(public screen: GameScreen, public x: number, public y: number, brainInstance?: NeuralNetwork) {
    super(screen, x, y, 20, 20, 'white')
    if (brainInstance) {
      this.brain = brainInstance
    } else {
      this.brain = new NeuralNetwork()
      this.brain.setNodes(5, 8, 2)
      this.brain.setModel()
    }
    window.addEventListener('keydown', this.onKeyDown.bind(this))
    window.addEventListener('keyup', this.onKeyUp.bind(this))
  }

  setBrain(brain: NeuralNetwork): void {
    this.brain = brain
  }
  
  update(time: number, delta: number) {
    const screenHeight = this.screen.getHeight()
    const screenWidth = this.screen.getWidth()

    // brain
    // 5 input : bird x, bird y, hole y1, hole y2, hole x
    const pipes: Pipe[] = this.screen.objects.filter(o => o instanceof Pipe) as unknown as Pipe[]

    // get pipe in front of bird
    let closestPipe: Pipe|undefined
    let minXclosestPipe = Infinity
    for (const pipe of pipes) {
      if (!closestPipe) {
        closestPipe = pipe
        minXclosestPipe = pipe.x
      }
      if (pipe.x > 0 && pipe.x > this.x && minXclosestPipe < closestPipe.x) {
        closestPipe = pipe
        minXclosestPipe = pipe.x
      }
    }
    if (closestPipe && closestPipe.x > 0) {
      const inputs = [
        this.y / screenHeight,
        closestPipe.getHoleY().y1 / screenHeight,
        closestPipe.getHoleY().y2 / screenHeight,
        closestPipe.getX() / screenWidth,
        this.velocity / 10,
      ]
      const outputs = this.brain.predict(inputs)
      if (outputs[0] > outputs[1]) {
        this.flap()
      }
      this.fitness = this.travelledDistance - closestPipe.getX()

      // save
      this.predictedTable.push({
        time,
        inputs,
        outputs,
      })
    }

    this.velocity += this.gravity
    this.y += this.velocity

    if (this.y + this.height > screenHeight) {
      this.y = screenHeight - this.height
      this.velocity = 0
    }
    if (this.y < 0) {
      this.y = 0
      this.velocity = 0
    }

    //  if bird is dead, destroy it
    // bird collision with ground
    if (this.y + this.height >= (screenHeight - this.height)) {
      this.destroy()
    }
    // bird collision with pipe
    if (closestPipe) {
      if (
        (this.x >= closestPipe.x && this.x <= closestPipe.x + closestPipe.getWidth())
        && !(this.y >= closestPipe.getHoleY().y1 && this.y <= closestPipe.getHoleY().y2)
      ) {
        this.destroy()
      }
    }
  }

  flap() {
    this.velocity = -5
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.code === 'Space') {
      this.flap()
      this.keyPress = true
    }
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.code === 'Space') this.keyPress = false
  }

  destroy(): void {
    super.destroy()
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }
}

export class Pipe extends GameObject {
  pipe1: Rect
  pipe2: Rect
  gapHeight = 180

  constructor(public screen: GameScreen, public x: number) {
    super(screen)
    const width = 60
    const minHeight = 20
    const maxHeight = screen.getHeight() - (this.gapHeight)
    const pipe1Height = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight
    // const pipe1Height = 300
    const pipe2Height = screen.getHeight() - pipe1Height - this.gapHeight
    const pipe1 = new Rect(screen, x, 0, width, pipe1Height, 'white')
    const pipe2 = new Rect(screen, x, pipe1Height + this.gapHeight, width, pipe2Height, 'white')
    this.pipe1 = pipe1
    this.pipe2 = pipe2
  }

  getHoleY() {
    return {
      y1: this.pipe1.y + this.pipe1.height,
      y2: this.pipe2.y,
    }
  }

  getX() {
    return this.x
  }

  setX(x: number) {
    this.x = x
    this.pipe1.x = x
    this.pipe2.x = x
  }

  getWidth() {
    return this.pipe1.width
  }

  update(time: number, delta: number): void {
    super.update(time, delta)
    this.x = this.pipe1.x
  }

  destroy(): void {
    super.destroy()
    this.pipe1.destroy()
    this.pipe2.destroy()
  }
}