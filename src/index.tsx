import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css'
import "./index.css"
import "./Components/ParameterView.css"
import "./Components/bwError.css"
import "./Pages/MainPage.css"

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';
import MainPage from "./Pages/MainPage"

ReactDOM.render(
    <MainPage />,
    document.getElementById('root') as HTMLElement
);

registerServiceWorker();
