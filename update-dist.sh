:

# For now, get the jquery minified from google.
curl http://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js > dist/jquery.min.js

# get the tools from jquery-simulate-ext
cp deps/jquery-simulate-ext/src/jquery.simulate.* dist/

# Get the jquery simulate also from jquery-simulate-ext
cp deps/jquery-simulate-ext/libs/jquery.simulate.js dist/
cp deps/jquery-simulate-ext/libs/bililiteRange.js dist/


