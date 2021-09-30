import React from "react";
import ReactDOM from "react-dom";
import reportWebVitals from "./reportWebVitals";
import { HashRouter, Route, Switch } from "react-router-dom";
import "./index.css";
import App from "./App";
import Homepage from "./Homepage";

ReactDOM.render(
  <React.StrictMode>
    <HashRouter>
      <div>
        <Switch>
          <Route path="/wallet" component={App} />
          <Route path="/" component={Homepage} />
        </Switch>
      </div>
    </HashRouter>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log);