import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0);
  const [data, setData] = useState([]);

  electronAPI.onMessage( data => console.log(data) );
  useEffect(()=>{
    electronAPI.onDisplay( data => {
        setData(JSON.parse(data));
        // console.log('Got data:', data);
    });
  }, []);
  

  const directories = data.map(d => {
    const files = d.files.map(f=>{
        return (
            <li key = {f}>{f}</li>
        )
    })
    return (
        <div>
            <h3>{d.dir}</h3>
            <ul>{files}</ul>
        </div>
    )
  })

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Electron + Vite + React</h1>
      <div className="card">
        <button onClick={() => {
            electronAPI.sendButtonClick(`Click #${count + 1}`);
            setCount((count) => count + 1);
        }}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <div>
        {directories}
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
