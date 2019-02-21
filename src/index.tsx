import "./App.css"
import "./index.css"
import "./ParameterView.css"
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as serviceWorker from './registerServiceWorker';
import App from "./App"

ReactDOM.render(
  <App/>,
  document.getElementById('root') as HTMLElement
);
serviceWorker.unregister();
//registerServiceWorker();
