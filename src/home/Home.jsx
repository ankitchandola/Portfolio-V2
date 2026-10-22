import React from 'react';
import SiteHeader from './SiteHeader';
import Hero from './Hero';
import StackRibbon from './StackRibbon';
import CurrentWork from './CurrentWork';
import SelectedWork from './SelectedWork';
import HowIWork from './HowIWork';
import Decisions from './Decisions';
import Career from './Career';
import Contact from './Contact';
import PlayInvite from './PlayInvite';
import {profile,year} from '../content/profile';
import {Icon} from './icons';
function SiteFooter(){return <footer className="wrap"><span>© {year} {profile.name}</span><a className="lite-link" href="/lite">Lite reading version</a><span>FULL-STACK DEVELOPER</span><a href="#top">Back to top <Icon name="arrow-up"/></a></footer>}
export default function Home(){return <>
 <a className="skip" href="#main">Skip to content</a>
 <SiteHeader/>
 <main id="main"><Hero/><StackRibbon/><CurrentWork/><SelectedWork/><PlayInvite/><HowIWork/><Decisions/><Career/><Contact/></main><SiteFooter/>
</>}
