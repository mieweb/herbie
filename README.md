http://mieweb.github.io/herbie/

Herbie
======

Herbie is a set of tools for developing BDD (https://en.wikipedia.org/wiki/Behavior-driven_development) scripts for testing.  The premise is that the scripts should be human understandable and author-able.

There are several different components to Herbie:

1. An English like language parser specifically for understanding documentation like directives: Vision.
2. An interactive inspector to make it easier for Vision authors to discover what elements are on a page.
3. A simple Vision interpreter that allow an author to test/debug Vision script. 

The jQuery Simulate Extended plug-in (a.k.a. jquery-simulate-ext) provides methods for simulating complex
user interactions based on the [jQuery.simulate()](https://github.com/jquery/jquery-simulate) plug-in.
The plug-in provides simulation of: Drag & Drop, Key Sequences, Key Combinations

Chrome Extension
----------------
A Goole Chrome extension is maintained here: [Chrome Plugin Source](chrome_extension).  To install:
* First, clone the project to your local machine.
* Chrome -> Preferences... -> Extensions 
* Make sure "Developer mode" is checked (upper left)
* Press "Load unpacked extension..."
* Browse to the chrome_extension folder in the project.
* viola.  Now a Herbie, robot button should display on the toolbar.  It will inject Herbie into the current tab of any webpage.

Demo
----
An online demo is available here: http://mieweb.github.io/herbie/demo/index.html#run_hebie

![Herbie example movie](http://mieweb.github.io/herbie/herbie_movie.gif)

About
-----
Through a fault in manufacturing, a robot, RB-34 (a.k.a. Herbie), is created that possesses telepathic abilities. https://en.wikipedia.org/wiki/Liar!_(short_story)

References
----------

Inspiration has been drawn from:
* [Gherkin](https://github.com/cucumber/cucumber/wiki/Gherkin) and [Cucumber](https://cukes.info/) but Vision has a slightly different goals.
* [Sikuli Script] (http://www.sikuli.org/) tho specific to the web, and mean to be browser independant.
* [DalekJS](http://dalekjs.com/pages/documentation.html)
* [Nightwatch.js](http://nightwatchjs.org/)
