import React from "react";
import "./Homepage.css";
import OrbsLogo from "./assets/orbs.png";
import DeFiLogo from "./assets/logo.svg";
import LI1 from "./assets/list-icon1.svg";
import LI2 from "./assets/list-icon2.svg";
import LI3 from "./assets/list-icon3.svg";
import LI4 from "./assets/list-icon4.svg";
import LI5 from "./assets/list-icon5.svg";
import DotLine from "./assets/dotted-line.svg";
import Geom1 from "./assets/geom1.png";
import Geom2 from "./assets/geom2.png";

/* eslint-disable */
export const Homepage = () => {
  return (
    <div>
      <div className="PartnersSection row" style={{ paddingTop: "0px" }}>
        <div className="LogoSection column">
          <div className="StrategicPartnersLabel large">MANAGING PARTNERS</div>
          <div className="StrategicPartnersList row" style={{ marginTop: "25px" }}>
            <a className="OrbsLogo" href="https://www.orbs.com">
              <img className="OrbsLogo" src={OrbsLogo} alt={"Orbs"} />
            </a>
          </div>
        </div>
      </div>

      <div className="TitleSection column">
        <img className="logo" src={DeFiLogo} />
        <div>
          <h1>
            DeFi<span className="small">.js</span>
          </h1>
          <p>Community-led initiative to standardize the management of Decentralized Finance positions programmatically</p>
        </div>
        <p>UNDER CONSTRUCTION</p>
      </div>
      <div className="LightSection column spaced">
        <h3>Simplify and standardize DeFi position management</h3>
        <div className="IconList row">
          <div className="column">
            <img src={LI1} />
            <p>Discover and quickly assess leading DeFi protocol strategies</p>
          </div>
          <div className="column">
            <img src={LI2} />
            <p>Monitor key position properties ex. APY, TVL, rewards</p>
          </div>
          <div className="column">
            <img src={LI3} />
            <p>Monitor position health and governance</p>
          </div>
          <div className="column">
            <img src={LI4} />
            <p>Compare historical performances between strategies</p>
          </div>
          <div className="column">
            <img src={LI5} />
            <p>Composability and interop with the ecosystem</p>
          </div>
        </div>
      </div>
      <div className="DarkSection row DarkAbstract">
        <div className="Half column">
          <div className="SectionTitle">
            <h2>THE API</h2>
            <img src={DotLine} />
          </div>
        </div>
        <div className="Half column">
          <ul className="BulletList">
            <li>getNetwork(): Network</li>
            <li>getAssets(): Token[]</li>
            <li>getRewardAssets(): Token[]</li>
            <li>getTVL(): Promise&lt;BN&gt;</li>
            <li>getAPR(): Promise&lt;BN&gt;</li>
            <li>getHealth(): Promise&lt;Threat[]&gt;</li>
            <li>getPendingRewards(): Promise&lt;TokenAmount[]&gt;</li>
          </ul>
        </div>
      </div>

      <div className="Footer row">
        <span>© 2020 defi.org</span>
        <a href="https://www.announcements.defi.org/">Announcements</a>
        <a href="https://www.privacypolicies.com/generic/">Privacy</a>
        <a href="https://github.com/defi-org-code">GitHub</a>
        <a href="https://t.me/defiorg">Telegram</a>
        <a href="mailto:hello@defi.org">hello@defi.org</a>
      </div>

      <div id="geometry_container" hidden={true}>
        <div style={{ width: "15%", maxWidth: "180px", position: "absolute", left: "15%", top: "-70px" }}>
          <img src={Geom1} width="100%" />
        </div>
        <div style={{ width: "15%", maxWidth: "360px", position: "absolute", left: "70%", top: "20px" }}>
          <img src={Geom2} width="100%" />
        </div>
      </div>
    </div>
  );
};
