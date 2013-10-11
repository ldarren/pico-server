pico-server
===========

A lean and mean realtime http server

Features
========
* two channel design, push and pull channel to achieve fast and realtime http server
* data cache to prevent data lost
* efficent user session handling, session only persistence when pull channel dc
* multiple input per query similar to facebook "big pipeline"
* server stream data to client through push channel

Installation
============
 1) mkdir [PROJ_DIR]
 2) cd [PROJ_DIR]
 3) sudo npm install pico-server -g
 4) npm link pico-server
 5) mkdir app # all your server code should goes here
