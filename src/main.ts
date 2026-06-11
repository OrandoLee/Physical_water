import './styles.css'
import { SceneApp } from './scene/SceneApp'

const root = document.querySelector<HTMLDivElement>('#app')

if (!root) {
  throw new Error('Missing #app root element')
}

const app = new SceneApp(root)
app.start()
