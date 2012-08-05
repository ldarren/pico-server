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
