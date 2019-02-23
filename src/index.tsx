import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css'
import "./index.css"
import "./Components/ParameterView.css"
import "./Components/App.css"

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';
import App from "./Components/App"

ReactDOM.render(
  <App/>,
  document.getElementById('root') as HTMLElement
);

registerServiceWorker();
