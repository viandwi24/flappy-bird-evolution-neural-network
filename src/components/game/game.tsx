import React, { useEffect, useRef, useState } from 'react'
import { Game } from '../../utils/game'
import { Bird, Pipe } from '../../utils/gameplay'
import { getNewBirdBrain, pickBird } from '../../utils/genetic'
import * as tf from '@tensorflow/tfjs'

export function GameStartup() {
  const [options, setOptions] = useState<IGameCanvasOptions>({
    type: 'play',
    genetic: 'cross',
    population: 10,
  })
  const [start, setStart] = useState(false)

  const [haveTrainedData, setHaveTrainedData] = useState(false)

  const startGame = (type: 'play'|'train') => {
    setOptions(prev => ({...prev, type}))
    setStart(true)
  }

  const downloadTrainedData = () => {
    const load = async () => {
      try {
        const model = await tf.loadLayersModel('localstorage://flappy-bird-ai-model')
        model.save('downloads://flappy-bird-ai-model')
      } catch (error) {
      }
    }
    load()
  }

  useEffect(() => {
    const load = async () => {
      try {
        const model = await tf.loadLayersModel('localstorage://flappy-bird-ai-model')
        if (model) {
          setHaveTrainedData(true)
        }
      } catch (error) {
        setHaveTrainedData(false)
      }
    }
    load()
  }, [])

  if (start) return <GameCanvas options={options} />

  return (
    <div className="h-screen text-gray-100 bg-slate-900">
      <div className="max-w-lg pt-8 mx-auto">
        <h1 className="font-bold text-2xl text-center">
          Flappy Bird Evolution Neural Network with Genetic Algorithm
        </h1>

        {/* card */}
        <div className="mt-4 px-6 py-4 border border-slate-400 rounded shadow bg-slate-800 relative">
          <div className="text-center text-lg font-semibold bg-slate-700 mb-4 shadow rouned py-2">
            Training Bird
          </div>
          <form className="flex flex-col w-full">
            <div className="mb-4">
              <label className="block mb-2" htmlFor="">Genetic Algorithm Type</label>
              <select
                defaultValue={options.genetic}
                onChange={(e) => setOptions({ ...options, genetic: e.target.value as 'cross' | 'single' })}
                className="border border-slate-100 px-2 py-1 rounded-sm bg-transparent"
              >
                <option value="single">Single</option>
                <option value="cross">Crossover</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2" htmlFor="">Population</label>
              <input
                type="number"
                defaultValue={options.population} onChange={(e) => setOptions({ ...options, population: Number(e.target.value) })}
                className="border border-slate-100 px-2 py-1 rounded-sm bg-transparent"
              />
            </div>
          </form>
          <div className="flex">
            <button
              type="button"
              onClick={() => startGame('train')}
              className="border w-full border-blue-300 px-2 py-1 rounded-sm bg-blue-500"
            >
              Start
            </button>
          </div>
        </div>

        {/* ok */}
        <div className="mt-4 px-6 py-4 border border-slate-400 rounded shadow bg-slate-800 relative">
          <div className="text-center text-lg font-semibold bg-slate-700 mb-4 shadow rouned py-2">
            Play Bird With Saved Neural Network
          </div>
          {!haveTrainedData && (
            <div className="text-center">
              You didn't have trained data, please train first
            </div>
          )}
          {haveTrainedData && (
            <>
              <div className="flex">
                <button
                  type="button"
                  onClick={() => startGame('play')}
                  className="border w-full border-blue-300 px-2 py-1 rounded-sm bg-blue-500"
                >
                  Start
                </button>
                <button
                  type="button"
                  onClick={() => downloadTrainedData()}
                  className="border w-full border-blue-300 px-2 py-1 rounded-sm bg-blue-500"
                >
                  Download Trained Data
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export interface GameCanvasStats {
  startTime: number
  birdAlive: number
  totalBirds: number
  generation: number
  generationTime: number
  bestBird?: Bird
  bestBirdScore: number
  bestBirdFitness: number
  bestBirdGeneration: number
  bestBirdBrainModelWeightLength: number
}

export interface IGameCanvasOptions {
  type: 'play' | 'train'
  genetic: 'cross' | 'single'
  population: number
}

export function GameCanvas(props: { options: IGameCanvasOptions }) {
  const game = useRef<Game>()
  const canvas = useRef<HTMLCanvasElement>(null)

  const [gameStats, setGameStats] = useState<GameCanvasStats>({
    startTime: Date.now(),
    birdAlive: 0,
    totalBirds: 0,
    generation: 0,
    generationTime: 0,
    bestBird: undefined,
    bestBirdGeneration: 0,
    bestBirdScore: 0,
    bestBirdFitness: 0,
    bestBirdBrainModelWeightLength: 0,
  })

  // ====================
  useEffect(() => {
    if (!canvas.current) return
    const g = new Game(canvas.current)

    // =========================================================================
    const birds: Bird[] = []
    const diedBirds: Bird[] = []
    const pipes: Pipe[] = []
    let bestBird: Bird|undefined
    let currentGeneration = 0
    g.hook.add('restart-action', () => {
      birds.splice(0, birds.length)
      pipes.splice(0, pipes.length)
      diedBirds.splice(0, diedBirds.length)
      bestBird = undefined
      game.current?.screen.objects.splice(0, game.current?.screen.objects.length)
    })
    g.hook.add('stop', () => {
      // birds.splice(0, birds.length)
      // pipes.splice(0, pipes.length)
      // diedBirds.splice(0, diedBirds.length)
      // bestBird = undefined
      // game.current?.screen.objects.splice(0, game.current?.screen.objects.length)
    })
    // on start
    g.hook.add('start', async () => {
      // ====================================
      const createNewBird = () => new Bird(g.screen, 100, g.screen.getHeight() / 2)
      // ====================================
      if (props.options.type === 'train') {
        // create obj
        const birdCount = props.options.population
        let useBestBirdCount = 0
        for (let i = 0; i < birdCount; i++) {
          // let bird = diedBirds.length > 0 ? pickBird(g, diedBirds) : new Bird(g.screen, 100, g.screen.getHeight() / 2)
          let bird: Bird

          if (diedBirds.length > 0) {
            const newBird = createNewBird()
            newBird.setBrain(getNewBirdBrain(g, diedBirds, props.options.genetic === 'cross'))
            bird = newBird
          } else {
            bird = createNewBird()
          }

          if (useBestBirdCount < Math.round(birdCount / 2) && bestBird) {
            useBestBirdCount++
            bird.brain.setModel(bestBird.brain.copy())
          }
          
          bird.hook.add('destroy', () => {
            birds.splice(birds.indexOf(bird), 1)
            diedBirds.push(bird)
          })
          birds.push(bird)
        }
        pipes.push(new Pipe(g.screen, g.screen.getWidth() / 2))
        diedBirds.filter(bird => bird !== bestBird).forEach(bird => {
          try {
            bird.brain.model?.dispose()
          } catch (error) {}
        })
        diedBirds.splice(0, diedBirds.length)

        setGameStats((prev) => ({ ...prev, birdAlive: birds.length, totalBirds: birds.length }))
      } else {
        const bird = createNewBird()
        pipes.push(new Pipe(g.screen, g.screen.getWidth() / 2))
        bird.brain.setNodes(5, 8, 2)
        // const a = await tf.loadLayersModel('localstorage://flappy-bird-ai-model') as tf.LayersModel
        // const a = bird.brain.createModel()
        const a = await tf.loadLayersModel('localstorage://flappy-bird-ai-model')
        console.log(a)
        // @ts-ignore
        bird.brain.setModel(a)
        birds.push(bird)
        bird.hook.add('destroy', () => {
          birds.splice(birds.indexOf(bird), 1)
        })
      }
    })
    // on update
    g.hook.add('update', (time: number, delta: number) => {
      // vars
      const speed = 4
      
      if (props.options.type === 'train') {
        const pipes = g.screen.objects.filter(o => o instanceof Pipe) as unknown as Pipe[]
        // update
        birds.forEach(bird => {
          bird.travelledDistance += speed
          // console.log(bird.fitness)
        })
        pipes.forEach(p => {
          p.setX(p.getX() - speed)

          if (p.getX() < 0 - p.getWidth()) {
            birds.forEach(b => b.score++)
            p.destroy()
          }
        })

        // stats
        setGameStats((prev) => ({ ...prev, birdAlive: birds.length, generationTime: g.time.lastTime - g.time.startTime }))

        // if pipes are too close, create new pipe
        if (pipes.length < 2) {
          pipes.push(new Pipe(g.screen, g.screen.getWidth()))
        }

        // if all birs die
        if (birds.length === 0) {
          // 
          const bestBirdFromDie = diedBirds.sort((a, b) => b.fitness - a.fitness)[0]
          // 
          console.log('Next Generation')
          let newBestBird: Bird|undefined
          if (
            (bestBird && bestBirdFromDie.fitness > bestBird.fitness)
            || !bestBird
          ) {
            bestBird = bestBirdFromDie
            setGameStats((prev) => ({
              ...prev,
              bestBird,
              bestBirdGeneration: currentGeneration,
              bestBirdScore: bestBird?.score || 0,
              bestBirdFitness: bestBird?.fitness || 0,
              bestBirdBrainModelWeightLength: bestBird?.brain.model?.getWeights().length || 0,
            }))
          }
          currentGeneration++
          setGameStats((prev) => ({
            ...prev,
            generation: prev.generation + 1,
          }))
          
          // // restart
          // if (currentGeneration > 2) {
          //   console.log(bestBird, bestBird.brain.model?.getWeights())
          //   return g.destroy()
          // }

          g.restart()
        }
      } else {
        const pipes = g.screen.objects.filter(o => o instanceof Pipe) as unknown as Pipe[]
        // update
        pipes.forEach(p => {
          p.setX(p.getX() - speed)

          if (p.getX() < 0 - p.getWidth()) {
            birds.forEach(b => b.score++)
            p.destroy()
          }
        })
        // if pipes are too close, create new pipe
        if (pipes.length < 2) {
          pipes.push(new Pipe(g.screen, g.screen.getWidth()))
        }
        
        if (birds.length === 0) {
          g.restart()
        }
      }
    })
    // =========================================================================

    // start
    g.start()
    game.current = g
    return () => game.current?.destroy()
  }, [])

  // 
  const saveTrained = () => {
    if (!game.current || !gameStats.bestBird) return
    // game.current.hook.dispatch('save-trained-action')
    gameStats.bestBird.brain.model?.save('localstorage://flappy-bird-ai-model')
  }


  // 
  const [start, setStart] = useState(true)

  return (
    <div className="h-screen bg-slate-800 flex space-x-4 justify-center items-center">
      <div>
        <canvas ref={canvas} style={{ backgroundColor: 'black', border: '1px solid white' }} width="800px" height="600px" />
      </div>
      {props.options.type === 'train' && (
        <div className="w-1/4 flex flex-col space-y-4">
          <div
            className="text-gray-50 bg-slate-700 px-6 py-4 rounded"
          >
            <div className="mb-2 text-lg font-semibold">STATS</div>
            <div>
              <div>Time : {Date.now() - gameStats.startTime}</div>
              <div>Current Generation : {gameStats.generation}</div>
              <div>Current Generation Time : {Math.round(gameStats.generationTime)}</div>
              <div>Bird Alive : {gameStats.birdAlive} / {gameStats.totalBirds}</div>
            </div>
          </div>
          <div
            className="text-gray-50 bg-slate-700 px-6 py-4 rounded"
          >
          <div className="mb-2 text-lg font-semibold">Best Bird</div>
            <div>
              <div>Best Bird Generation : {gameStats.bestBirdGeneration}</div>
              <div>Best Bird Score : {gameStats.bestBirdScore}</div>
              <div>Best Bird Fitness : {gameStats.bestBirdFitness}</div>
            </div>
          </div>
          <div className="mt-2 flex space-x-4">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm"
              onClick={() => {
                if (start) {
                  game.current?.stop()
                } else {
                  game.current?.hook.dispatch('restart-action')
                  game.current?.start()
                  gameStats.startTime = Date.now()
                }
                setStart(!start)
              }}
            >
              {start ? 'Stop' : 'Start'}
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm"
              onClick={() => {
                saveTrained()
              }}
            >
              Save Trained Result
            </button>
          </div>
        </div>
      )}
    </div>
  )
}