import React from 'react';
import ThemeToggle from '../components/ThemeToggle';
import {Icon} from './icons';
export default function SiteHeader(){return <header className="site-header wrap"><a aria-label="Ankit Chandola home" className="brand" href="#top"><span className="brand-icon">a<span>c</span></span><span>Ankit Chandola<span className="brand-sub">FULL-STACK DEVELOPER</span></span></a><nav aria-label="Main navigation"><a href="#about">About me</a><a href="#work">Work</a><a href="#experience">Experience</a><a className="nav-contact" href="#contact">Say hello <span aria-hidden="true"><Icon name="arrow-up-right"/></span></a><ThemeToggle/></nav></header>}
