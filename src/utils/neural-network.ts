import * as tf from '@tensorflow/tfjs'

export class NeuralNetwork {
    input: number = 0
    hidden: number = 0
    output: number = 0
    model?: tf.Sequential
    input_weights?: tf.Tensor<tf.Rank>
    output_weights?: tf.Tensor<tf.Rank>
  
    setNodes(input: number, hidden: number, output: number) {
      this.input = input
      this.hidden = hidden
      this.output = output
      
    //   this.input_weights = tf.randomNormal([this.input, this.hidden]);
    //   this.output_weights = tf.randomNormal([this.hidden, this.output]);
    }
  
    getNodes() {
      return [
        this.input,
        this.hidden,
        this.output,
      ]
    }
  
    createModel() {
      // @ts-ignore
      return tf.tidy<tf.Sequential>(() => {
        const model = tf.sequential()
        const hiddenLayer = tf.layers.dense({
          units: this.hidden,
          inputShape: [this.input],
          activation: 'sigmoid',
        })
        const outputLayer = tf.layers.dense({
          units: this.output,
          activation: 'softmax',
        })
        model.add(hiddenLayer)
        model.add(outputLayer)
        return model
      })
    }
  
    setModel(model?: tf.Sequential) {
      if (!model) return this.model = this.createModel()
      this.model = model
    }
  
    copy() {
      // @ts-ignore
      return tf.tidy<tf.Sequential>(() => {
        const currModel = this.model || this.createModel()
        const modelCopied = this.createModel()
        const weightsCurrentModel = currModel.getWeights()
        const weightsCopied = []
  
        // 
        for (let i = 0; i < weightsCurrentModel.length; i++) {
          weightsCopied[i] = weightsCurrentModel[i].clone()
        }
  
        modelCopied.setWeights(weightsCopied)
        return modelCopied
      })
    }
  
    crossover(brain2: NeuralNetwork) {
      const model1 = this.model || this.createModel()
      const model2 = brain2.model || brain2.createModel()
      // @ts-ignore
      return tf.tidy<tf.Sequential>(() => {
        const weights1 = model1.getWeights()
        const weights2 = model2.getWeights()
        const newModel = this.createModel()
        const weights = []
        // cross weights1 and weights2
        const mid = Math.floor(weights1.length / 2)
        for (let i = 0; i < weights1.length; i++) {
            const tensor = i < mid ? weights1[i] : weights2[i]
            weights[i] = tensor
        }
        newModel.setWeights(weights)
        return newModel
      })
    }
  
    predict(input: number[]) {
      return tf.tidy(() => {
        const xs = tf.tensor2d([input])
        const ys = this.model?.predict(xs) as tf.Tensor
        return ys?.dataSync()
      })
    }
  
    randomGaussian() {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }
  
    mutate(rate: number) {
      return tf.tidy(() => {
        if (!this.model) return
        const weights = this.model.getWeights()
        const mutatedWeights = []
        for (let i = 0; i < weights.length; i++) {
          let tensor = weights[i]
          let shape = weights[i].shape
          let values = tensor.dataSync().slice();
          for (let j = 0; j < values.length; j++) {
            // pick random 1 or 0
            const rand = Math.round(Math.random())
            if (rand < rate) {
              values[j] = values[j] + this.randomGaussian()
            }
          }
          let newTensor = tf.tensor(values, shape)
          mutatedWeights[i] = newTensor
        }
        this.model.setWeights(mutatedWeights);
      })
    }
  }