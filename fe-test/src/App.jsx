import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import EncryptedDiary from './EncryptedDiary'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <EncryptedDiary />
    </>
  )
}

export default App
