atomjs
======

Load on demand front-end framework for single page web applications.

CHANGELOG:
3.0.0   - released initial v3 beta with example bootstrap site
3.0.1   - fixed atom-path bug for Admin link
        - fixed sign out bug.
3.1.0   - fixed loadspinner bug, only shows for unloaded sub elements
        - refixed atom-path bug for Admin link
        - moved navigated to emit on routeElement
        - moved 401 code into admin.js
        - added 404 event, enhanced 404 example

Use the simple Nodejs server/app.js to run for testing or development purposes.

[ RUN AS ROOT SITE ]
To run as root site, cd to atomjs-3.0.0 folder level:
    > node server/app -b bootstrap.html -p 3000
Then hit http://localhost:3000 in Chrome.
Tests at http://localhost:3000/js/lib/atomjs/tests/

[ RUN AS SUB SITE ]
To run as sub site, cd to atomjs-3.0.0 folder level:
    > cd public
    > mkdir sub
    > cd sub
    > mkdir site
    > cd ../../../
    > node server/app -b sub/site/bootstrap.html -p 3000 -s sub/site
Change atomjs-3.0.0/sub/site/js/atomjs/bootstrap.js "siteRoot" setting to '/sub/site'.
Then hit localhost:3000/sub/site in Chrome.
Tests at http://localhost:3000/sub/site/js/lib/atomjs/tests/.

[ EXAMPLE APPLICATION INFO ]
All content for example site is under atomjs-3.0.0/public/com/example.
The entry point for the app is under atomjs-3.0.0/js/atomjs/bootstrap.js

[ CSS URLS ]
Normally urls in stylesheets are relative to the stylesheet, however if they are loaded by atom as a template or controller style, make them relative to the bootstrap file location (no leading slash).

[ KNOWN ISSUES ]
* There is currently an issue when emitting events, the trigger call seems to fire asynchronously where as it needs to be synchronous. This means the loadspinner control will always show even for cached elements. This will be investigated and fixed soon.
* There is no console component, just native console logging for now.

[ API AND DEV GUIDE ]
* To require the main atom functionality, just define 'atom' as one of the dependencies of your module.
* Leave all src and href paths as relative to the bootstrap file, the server app will find and replace any relative urls in the initial bootstrap.html and all subsequent templates to enable you to move to sub site (It will ignore absolute paths).
* You can specify a list of (space separated) controllers, templates, or styles on any elements.
    - Space separated templates = the templates will be loaded in parallel and the appended to the element in order from left to right.
    - Space separated controllers = this allows subclassing, the controllers will be loaded in parallel and override the base Control functionality from left to right. You cannot override existing abstract functions.
    - Space separated styles = the styles will be loaded in parallel and all stylesheets will be created.
* Current working atom attributes:
    - atom-bootstrap = placed anywhere on bootstrap page to allow client to identify when bootstrap is returned, if expecting other content and 404 occurs.
    - atom-controller, atom-template, atom-style = define separate template, controller, and styles.
    - atom-template-controller, atom-template-controller-style, atom-template-style, atom-controller-style = define the same template/controller/styles in one declaration.
    - atom-load = true|false to prevent elements from loading automatically.
    - atom-hide = true|false to prevent elements from hiding when loading.
    - atom-path = true|false or string of path to navigate to. Place this attribute on any clickable element such as an <a> tag to cause a navigation within the single page. If a path is given, this will override the href attribute if present.
    - atom-route = defines part of the url pathway to navigate content. Each route should be a single part of the url path and the containment or route elements within route elements define to overall url.
        + use atom.location() to change the history url
        + use atom.navigate() to cause content navigation without history change
    - atom-route-default = true|false make an element the default content to navigate to within a navigated route without causing any change in the url history (needs to be true to take effect)
    - atom-route-on = regex pattern to match against route navigation. If the pattern is found in the current url, the atom-class attribute value will be applied to the element (and removed if not matched)
    - atom-route-end = true|false causes the navigation to end without travelling through the paths further. Any remaining parts of the url are converted to params in the :navigated event info
