![Logo](admin/homeoverview.png)

# ioBroker.homeoverview

[![NPM version](http://img.shields.io/npm/v/iobroker.homeoverview.svg)](https://www.npmjs.com/package/iobroker.homeoverview)
[![Downloads](https://img.shields.io/npm/dm/iobroker.homeoverview.svg)](https://www.npmjs.com/package/iobroker.homeoverview)
[![Dependency Status](https://img.shields.io/david/Swissglider/iobroker.homeoverview.svg)](https://david-dm.org/Swissglider/iobroker.homeoverview)
[![Known Vulnerabilities](https://snyk.io/test/github/Swissglider/ioBroker.homeoverview/badge.svg)](https://snyk.io/test/github/Swissglider/ioBroker.homeoverview)

[![NPM](https://nodei.co/npm/iobroker.homeoverview.png?downloads=true)](https://nodei.co/npm/iobroker.homeoverview/)

**Tests:**: [![Travis-CI](http://img.shields.io/travis/Swissglider/ioBroker.homeoverview/master.svg)](https://travis-ci.org/Swissglider/ioBroker.homeoverview)

## homeoverview adapter for ioBroker

HomeOverview Adapter

## Sprint 1 Overview

This is the Sprint 1 Version. See also: [Project](https://github.com/swissglider/ioBroker.homeOverview/projects/1?card_filter_query=sprint+1)

### Backlog

MVP &rightarrow; Show simple dynamic state change (angular - socket.io adapter)
- [x] implement angular client with socket.io to show one state change dynamicly from ioBroker

## Sprint 1 - Documentation

# Sprint 1

>**Node**
States are all Observibles, so they are always up to date

0.   initiate and setup the connection to ioBroker
1.   load and store states/objects/enums   
  1.1. load all states/objects and enums from ioBroker    
  1.2. store the Obeserver to all live states/objects/enums to the DataStore   
2.   after initiation, homepage.component askes for the counter state
3.   after changing state on the GUI it has to be set
4.   and safe it to the ioBroker

>:arrow_forward: because the counter state saved on the state-store is a live observer,
and the ioBroker.service monitors all changes,
the state in the store is updated automaticaly
>:arrow_forward: ioBrokerConnection do handle the whole connection with the ioBroker
>:arrow_forward: ioBrokerConnection is an adaptation of the iobroker conn.js sample
>:arrow_forward: the ngx-socket-io is used


![cached image](https://plantuml-server.kkeisuke.app/svg/ZPB1JiCm343l_Wfhf_NGb06d7j1Wdy0H8PIrfWHQkqfSBcZ_JjPMj1jb8YShZj-pvMo3MgzTKmEyUjiGhkwvwchhNrRu1HZFqviqrDgAJ25DAqoipqF2oOEN3_8caFzq1PrTxuIP2dN2OoAgbDAWukcqfBHgzpP4-Up9Qj1FbPYXxDyZCGR4NJFK7k000BzxmJIzM-m5SxnAqB5JDCPWCMJwk1PRegrhx7qX6tGXEze2BFP_gfckSzoOpQZvYuXhooLsRNbC9PVuo_Ftaki4-mfioGSNDAvdbC7IvcQySrEEaLMHFlQoTOnsqh6IJowGbYQ_YItzOC8Sy_yjvNWxKG2sn6NyfDy0.svg)



## License

MIT License

Copyright (c) 2019 Swissglider <swissglider@github.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
