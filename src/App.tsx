import "./App.css";
import { Web3Provider } from "./components";
import TokenExchange from "./components/TokenExchange";

function App() {
  return (
    <div className="wrapper">
      <div className="container">
        <Web3Provider>
          <h1>Fanrating Token Exchange</h1>

          <TokenExchange />
        </Web3Provider>
      </div>
    </div>
  );
}

export default App;
