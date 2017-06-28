<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta content="width=device-width,initial-scale=1" name="viewport">
    <title>title</title>

    <style>
        body {
            display: flex;
            flex-direction: column;
        }

        #selectConfig {
            margin: 10px;
        }

        #bookmarkLoad {
            margin: 10px;
            width: 100%;
        }

        #bookmarkURL {
            width: 75%;
        }

        #clearButton {
            color: #ffffff;
            background-color: #ff0000;

        }

        #submitButton {
            background-color: #00ff00;
        }

        .myMap {
            height: 100%;
            margin: 10px;
        }
    </style>

    <% for (var index in htmlWebpackPlugin.files.css) { %>
        <% if (webpackConfig.output.crossOriginLoading) { %>
            <link rel="stylesheet" href="<%= htmlWebpackPlugin.files.css[index] %>" integrity="<%= htmlWebpackPlugin.files.cssIntegrity[index] %>" crossorigin="<%= webpackConfig.output.crossOriginLoading %>"/>
        <% } else { %>
            <link rel="stylesheet" href="<%= htmlWebpackPlugin.files.css[index] %>" />
        <% } %>
    <% } %>
</head>

<!-- rv-service-endpoint="http://section917.cloudapp.net:8000/" rv-keys='["Airports"]' -->

<body>
    <select id="selectConfig">
        <option value="config-sample-01-structured-visibility-sets.json">01. Layer with visibility sets</option>
        <option value="config-sample-02-structured-legend-controlled-layers.json">02. Layer with controlled layers</option>
        <option value="config-sample-03-structured-legend-one-child.json">03. Layer with Direct linking of dynamic child</option>
        <option value="config-sample-04-structured-legend-one-group.json">04. Layer with one group linking to multiple layers in child entries</option>
        <option value="config-sample-05-structured-nested-visibility-sets.json">05. Nested visibility sets</option>
        <option value="config-sample-06-structured-legend-dynamic-children-split-layers.json">06. Dynamic layer with children split across multiple top level groups</option>
        <option value="config-sample-07-structured-legend-one-group-proper-subset.json">07. Dynamic layer controls several of the children in the dynamic group</option>
        <option value="config-sample-08-structured-legend-one-layer-muti-legends.json">08. Layer with single entry collapsed set </option>
        <option value="config-sample-09-structured-legend-opacity-visibility-disable-locked.json">09. Multiple layers with opacity, visibility both disabled and locked</option>
        <option value="config-sample-10-structured-legend-opacity-disable-locked.json">10. Multiple layers with opacity disabled and locked</option>
        <option value="config-sample-11-structured-legend-opacity-disable.json">11. Multiple layers with opacity disabled initially</option>
        <option value="config-sample-12-structured-legend-opacity-locked.json">12. Multiple layers with opacity locked</option>
        <option value="config-sample-13-structured-legend-visibility-disable-locked.json">13. Multiple layers with visibility disabled and locked</option>
        <option value="config-sample-14-structured-legend-visibility-disable.json">14. Multiple layers with visibility disabled initially</option>
        <option value="config-sample-15-structured-legend-visibility-locked.json">15. Multiple layers with visibility locked</option>
        <option value="config-sample-16-structured-legend-tile-layer-only-valid-one-proj.json">16. Tile layer which is only valid in one of the basemap projections</option>
        <option value="config-sample-17.json">17. Layer with only Information section</option>
        <option value="config-sample-18.json">18. Layer with symbology overridden by config file specified image file</option>
        <option value="config-sample-19.json">19. Layer with Viewer with “About map” text changed</option>
        <option value="config-sample-20.json">20. Layer with Bounding box disabled</option>
        <option value="config-sample-21.json">21. Layer with Query disabled</option>
        <option value="config-sample-22.json">22. Layer with Snapshot disabled</option>
        <option value="config-sample-23.json">23. Layer with Metadata disabled</option>
        <option value="config-sample-24.json">24. Layer with Boundary zoom disabled</option>
        <option value="config-sample-25.json">25. Layer with Reload disabled</option>
        <option value="config-sample-26.json">26. Layer with Remove disabled</option>
        <option value="config-sample-27.json">27. Layer with Settings disabled</option>
        <option value="config-sample-28.json">28. Layer with Data table disabled</option>
    </select>

    <form id="bookmarkLoad">
        <input id="bookmarkURL" type="text">
        <button id="clearButton" type="button">Clear</button>
        <button id="submitButton" type="button">Load Bookmark</button>
    </form>

    <div class="myMap" id="mobile-map" is="rv-map"
        rv-config="config-sample-01-structured-visibility-sets.json"
        rv-langs='["en-CA", "fr-CA"]'
        rv-restore-bookmark="bookmark">
         <noscript>
            <p>This interactive map requires JavaScript. To view this content please enable JavaScript in your browser or download a browser that supports it.<p>

            <p>Cette carte interactive nécessite JavaScript. Pour voir ce contenu, s'il vous plaît, activer JavaScript dans votre navigateur ou télécharger un navigateur qui le prend en charge.</p>
        </noscript>
    </div>

    <script>
        var needIePolyfills = [
            'Promise' in window,
            'TextDecoder' in window,
            'findIndex' in Array.prototype,
            'find' in Array.prototype,
            'from' in Array,
            'startsWith' in String.prototype,
            'endsWith' in String.prototype,
            'outerHTML' in SVGElement.prototype
        ].some(function(x) { return !x; });
        if (needIePolyfills) {
            // NOTE: this is the only correct way of injecting scripts into a page and have it execute before loading/executing any other scripts after this point (ie polyfills must be executed before the bootstrap)
            // more info on script loading: https://www.html5rocks.com/en/tutorials/speed/script-loading/
            document.write('<script src="../ie-polyfills.js"><\/script>');
        }
    </script>

    <% for (var index in htmlWebpackPlugin.files.js) { %>
        <% if (webpackConfig.output.crossOriginLoading) { %>
            <script src="<%= htmlWebpackPlugin.files.js[index] %>" integrity="<%= htmlWebpackPlugin.files.jsIntegrity[index] %>" crossorigin="<%= webpackConfig.output.crossOriginLoading %>"></script>
        <% } else { %>
            <script src="<%= htmlWebpackPlugin.files.js[index] %>"></script>
        <% } %>
    <% } %>

    <script>
        // https://css-tricks.com/snippets/javascript/get-url-variables/
        function getQueryVariable(variable)
        {
            var query = window.location.search.substring(1);
            var vars = query.split("&");
            for (var i=0;i<vars.length;i++) {
                    var pair = vars[i].split("=");
                    if(pair[0] == variable){return pair[1];}
            }
            return(false);
        }

        // plugins
        const baseUrl = window.location.href.split('?')[0] + '?keys={RV_LAYER_LIST}';
        RV.getMap('mobile-map').registerPlugin(RV.Plugins.BackToCart, 'backToCart', baseUrl);
        RV.getMap('mobile-map').registerPlugin(RV.Plugins.CoordInfo, 'coordInfo');

        function bookmark(){
            return new Promise(function (resolve) {
                var thing = getQueryVariable("rv");
                console.log(thing);
                resolve(thing);
            });
        }

        function queryStringToJSON(q) {
            var pairs = q.search.slice(1).split('&');
            var result = {};
            pairs.forEach(function(pair) {
                pair = pair.split('=');
                result[pair[0]] = decodeURIComponent(pair[1] || '');
            });
            return JSON.parse(JSON.stringify(result));
        }
        // grab & process the url
        var queryStr = queryStringToJSON(document.location);
        var keys = queryStr.keys;
        if (keys) {
            // turn keys into an array, pass them to the map
            var keysArr = keys.split(',');
            RV.getMap('mobile-map').restoreSession(keysArr);
        } else {
            const bookmark = queryStr.rv;

            // update the config values if needed
            var previouslySelectedConfig = sessionStorage.getItem('sampleConfig');
            if (previouslySelectedConfig) {
                document.getElementById('mobile-map').setAttribute('rv-config', previouslySelectedConfig);
                document.getElementById('selectConfig').value = previouslySelectedConfig;
            } else {
                const currentConfig = document.getElementById('mobile-map').getAttribute('rv-config');
                sessionStorage.setItem('sampleConfig', currentConfig);
            }

            document.getElementById('selectConfig').addEventListener("change", changeConfig);
            document.getElementById('submitButton').addEventListener("click", loadBookmark);
            document.getElementById('clearButton').addEventListener("click", clearBookmark);

            // load book mark
            function loadBookmark() {
                let bookmarkURL = document.getElementById('bookmarkURL').value;
                RV.getMap('mobile-map').useBookmark(bookmarkURL);
            }

            function clearBookmark() {
                document.getElementById('bookmarkURL').value = '';
            }

            // change and load the new config
            function changeConfig() {
                var selectedConfig = document.getElementById('selectConfig').value;
                document.getElementById('mobile-map').setAttribute('rv-config', selectedConfig);
                RV.getMap('mobile-map').reInitialize();
                sessionStorage.setItem('sampleConfig', selectedConfig);
            }

        }
    </script>
</body>

</html>
