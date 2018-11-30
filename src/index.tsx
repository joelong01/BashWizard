import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css';
import Parameter from './Parameter';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(
  <Parameter longName="test"/>,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
