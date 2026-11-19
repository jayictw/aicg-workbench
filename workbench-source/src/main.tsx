import {LibraryGate} from './persistence/LibraryUI'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './creation/workbench-system.css'

createRoot(document.getElementById('root')!).render(<StrictMode><LibraryGate><App /></LibraryGate></StrictMode>)

if(import.meta.env.MODE==='s1b-test')void window.workLibrary?.info().then(info=>{if(info.mode==='automation')return import('./persistence/test-fixture')})
