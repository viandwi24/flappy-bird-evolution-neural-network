import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { GameStartup } from './components/game/game'
import * as tf from '@tensorflow/tfjs'
// import App from './App'
// import reportWebVitals from './reportWebVitals'

tf.setBackend('cpu')

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)
root.render(
  <React.StrictMode>
    <GameStartup />
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals()
