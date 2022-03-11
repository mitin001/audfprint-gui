import React, { useEffect, useState } from 'react';
import {
  HashRouter as Router, Link, Route, Switch, Redirect,
} from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import { IoMdFingerPrint } from 'react-icons/io';
import FingerprintPage from './scenes/FingerprintPage/FingerprintPage';

import './App.css';

const App = () => {
  const [installationStatus, setInstallationStatus] = useState({ installing: false });
  const { installing } = installationStatus || {};

  useEffect(() => {
    window.ipc.on('installationStatusChanged', (event, data) => {
      setInstallationStatus(data);
    });
  }, []);

  if (installing) {
    return <div className="install"><h1>Installation in progress...</h1></div>;
  }

  return (
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
};

export default App;
