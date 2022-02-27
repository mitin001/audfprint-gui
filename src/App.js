import React from 'react';
import {
  HashRouter as Router, Link, Route, Switch, Redirect,
} from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import { IoMdFingerPrint } from 'react-icons/io';
import FingerprintPage from './scenes/FingerprintPage/FingerprintPage';

import './App.css';

const App = () => (
  <div className="app">
    <Router>
      <div className="layout">
        <nav className="layout-nav">
          <Link className="layout-link" to="/">
            <IoMdFingerPrint
              data-delay-show="500"
              data-tip="Fingerprint"
              size={25}
            />
            <ReactTooltip />
            <span>Fingerprint</span>
          </Link>
        </nav>
        <main className="layout-main">
          <Switch>
            <Route exact path="/" component={FingerprintPage} />
            <Redirect to="/" />
          </Switch>
        </main>
      </div>
    </Router>
  </div>
);

export default App;
