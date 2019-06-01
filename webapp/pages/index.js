import React, { Component } from 'react'
import io from 'socket.io-client';
import Dashboard from './Dashboard';


// export default () => (
//   <div>
//     <Dashboard />
//   </div>
// )

class App extends Component {
  constructor() {
    super()
  }

  componentDidMount = () => {
      const socket = io();
  }
  
  render() {
    return (
    <div>
     <Dashboard />
    </div>
    )
  }
}


export default App;