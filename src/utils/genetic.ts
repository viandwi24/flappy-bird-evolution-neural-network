import { Game } from "./game"
import { Bird } from "./gameplay"
import { NeuralNetwork } from "./neural-network"

export const pickBird = (game: Game, candidateBirds: Bird[]) => {
  let index = 0
  let r = Math.random()
  while (r > 0) {
    r -= candidateBirds[index].fitness;
    index += 1;
  }
  index -= 1
  // const parentBird = index > 0 ? candidateBirds[index] : candidateBirds[0]
  // const newBird = new Bird(game.screen, 100, game.screen.getHeight() / 2)
  // newBird.brain.setModel(parentBird.brain.copy())
  // const mutationRate = Math.random() * 0.1 + 0.05
  // newBird.brain.mutate(mutationRate)
  // return newBird

  // const parentBird = index > 0 ? candidateBirds[index] : candidateBirds[0]
  const parentBird = candidateBirds[index]

  // create new brain
  const newBrain = new NeuralNetwork()
  newBrain.setNodes(parentBird.brain.input, parentBird.brain.hidden, parentBird.brain.output)
  newBrain.setModel(parentBird.brain.copy())

  // return
  return newBrain
}

export const getNewBirdBrain = (game: Game, candidateBirds: Bird[], cross: boolean = true) => {
  console.log("generate new bird brain with", cross ? "crossover" : "single")

  // if (candidateBirds.length < 2) {
  //   const tmpChild = new NeuralNetwork()
  //   tmpChild.setNodes(candidateBirds[0].brain.input, candidateBirds[0].brain.hidden, candidateBirds[0].brain.output)
  //   tmpChild.setModel()
  //   return tmpChild
  // }

  let child
  if (cross) {
    const parent1 = pickBird(game, candidateBirds)
    const parent2 = pickBird(game, candidateBirds)

    // create new brain
    const tmpChild = new NeuralNetwork()
    tmpChild.setNodes(parent1.input, parent1.hidden, parent1.output)
    tmpChild.setModel(parent1.copy())
    tmpChild.crossover(parent2)
    child = tmpChild
  } else {
    // pick
    const tmpChild = pickBird(game, candidateBirds)
    // return
    child = tmpChild
  }


  // mutate new brain child
  const mutationRate = Math.random() * 0.1 + 0.05
  child.mutate(mutationRate)

  // return
  return child
}
