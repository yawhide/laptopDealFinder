all:
	set FLASK_APP $(abspath $(lastword $(MAKEFILE_LIST)))/../server
	echo $FLASK_APP
	set FLASK_DEBUG 1
	flask run


