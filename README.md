atomjs
======

Load on demand front-end framework for SPA (single page web) applications.

Use the simple Nodejs server/app.js to run locally for testing or development purposes.

Run as root site
----------------
To run as root site, cd to atomjs-3.0.0 folder level:
*    node server/app -b bootstrap.html -p 3000
* Hit http://localhost:3000 in Chrome 

Tests at http://localhost:3000/js/lib/atomjs/tests/

Run as sub site
---------------
To run as sub site, cd to atomjs-3.0.0 folder level:
*   cd public
*   mkdir sub
*   cd sub
*   mkdir site
*   cd ../../../
*   node server/app -b sub/site/bootstrap.html -p 3000 -s sub/site
* Change atomjs-3.0.0/sub/site/js/atomjs/bootstrap.js "siteRoot" setting to '/sub/site'
* Hit localhost:3000/sub/site in Chrome

Tests at http://localhost:3000/sub/site/js/lib/atomjs/tests/.

Example application info
------------------------
* All content/components for example site is under atomjs-3.0.0/public/com/example
* The entry point for the app is under atomjs-3.0.0/js/atomjs/bootstrap.js

CSS urls
--------
Normally urls in stylesheets are relative to the stylesheet, however if they are loaded by atom as a template or controller style, make them relative to the bootstrap file location (with no leading slashes).

API and development guide
-------------------------
* To require the main atom functionality, just define 'atom' as one of the dependencies of your module.
* Leave all src and href paths as relative to the bootstrap file, the server app will find and replace any relative urls in the initial bootstrap.html and all subsequent templates to enable you to move to sub site (It will ignore absolute paths).
* You can specify a list of (space separated) controllers, templates, or styles on any elements.
    - Space separated templates = the templates will be loaded in parallel and the appended to the element in order from left to right.
    - Space separated controllers = this allows subclassing, the controllers will be loaded in parallel and override the base Control functionality from left to right. You cannot override existing abstract functions.
    - Space separated styles = the styles will be loaded in parallel and all stylesheets will be created.
* Current working atom attributes:
    - <code>atom-bootstrap</code> = placed anywhere on bootstrap page to allow client to identify when bootstrap is returned (ie. if expecting other content and 404 occurs)
    - <code>atom-controller</code>, <code>atom-template</code>, <code>atom-style</code> = define separate template, controller, and styles.
    - <code>atom-template-controller</code>, <code>atom-template-controller-style</code>, <code>atom-template-style</code>, <code>atom-controller-style</code> = define the same template/controller/styles in one declaration.
    - <code>atom-load</code> = true|false to prevent elements from loading automatically.
    - <code>atom-hide</code> = true|false to prevent elements from hiding when loading.
    - <code>atom-path</code> = true|false or string of path to navigate to. Place this attribute on any clickable element such as an &lt;a&gt; tag to cause a navigation within the single page. If a path is given, this will override the href attribute if present.
    - <code>atom-route</code> = defines part of the url pathway to navigate content. Each route should be a single part of the url path and the containment or route elements within route elements define to overall url.
        + use atom.location() to change the history url
        + use atom.navigate() to cause content navigation without history change
    - <code>atom-route-default</code> = true|false make an element the default content to navigate to within a navigated route without causing any change in the url history (needs to be true to take effect)
    - <code>atom-route-on</code> = regex pattern to match against route navigation. If the pattern is found in the current url, the <code>atom-class</code> attribute value will be applied to the element (and removed if not matched)
    - <code>atom-route-end</code> = true|false causes the navigation to end without travelling through the paths further. Any remaining parts of the url are converted to params in the :navigated event info
