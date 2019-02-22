import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css'
import "./index.css"
import "./ParameterView.css"
import "./App.css"

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';
import App from "./App"

ReactDOM.render(
  <App/>,
  document.getElementById('root') as HTMLElement
);

registerServiceWorker();
