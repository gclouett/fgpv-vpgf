(() => {
    'use strict';

    // layer group ids should not collide
    let itemIdCounter = 0;

    // visibility toggle logic goes here
    // TODO: deal with out-of-scale visibility state
    const VISIBILITY_TOGGLE = {
        off: 'on',
        on: 'off'
    };

    // TODO: move this somewhere later
    // jscs:disable maximumLineLength
    const NO_IMAGE =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAIAAACRXR/mAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAUJJREFUeNrs172Kg0AQB/BcOLHSRhBFEF/B5/cBrMRGsLESFBFsFAs/ivuTheW4kOBN1mSLmWJB0PGHM6vjV5IkF/3ietEymMUsZjGLWcxiltas7+OnNk3T9/22bYTbGIbhum4QBIpZMJVl+coDGIYB60HZUVZd11ht27Ysi2CapmkcRyRRzFqWBWsYhp7nEVhd1xVFIZLwTnwQaMd1XfVi5XmOjZJlGUF2Pc8ktt48z23basGSpg/0FkqTpinKpNxEZ8GEpkGB0NS/ZUpMRJY0iUN8kdSaKKw/Jsdx4jhWa6KwsK3ONr3U8ueZ6KxTTf+btyQIw5MYBDAXuLd4fgnmDll3xSzTNPd9l5PJ/evqSWCkEecjiWKW7/tVVY23IJcGSRSzoihC7bQbmsW8ezwv/5Axi1nMYhazmMWst8ePAAMA0CzGRisOjIgAAAAASUVORK5CYII=';
    // jscs:enable maximumLineLength

    /**
     * @ngdoc service
     * @name legendService
     * @module app.geo
     * @requires dependencies
     * @description
     *
     * The `legendService` factory constructs the legend (auto or structured). `LayerRegistry` instantiates `LegendService` providing the current config, layers and legend containers.
     * This service also scrapes layer symbology.
     *
     */
    angular
        .module('app.geo')
        .factory('legendService', legendServiceFactory);

    function legendServiceFactory($http, $q, $timeout, layerDefaults, layerTypes, layerStates, legendEntryFactory) {
        // jscs doesn't like enhanced object notation
        // jscs:disable requireSpacesInAnonymousFunctionExpression

        const LAYER_GROUP = (name, expanded = false) => {
            return {
                type: 'group',
                name,
                id: 'rv_lg_' + itemIdCounter++,
                expanded,
                items: [],
                cache: {}, // to cache stuff like retrieved metadata info

                // TODO: add hook to set group options
                options: {
                    visibility: {
                        value: 'on', // 'off', 'zoomIn', 'zoomOut'
                        enabled: true
                    },
                    remove: {
                        enabled: false
                    }
                },

                /**
                 * Adds an item (layer or another group) to a layer group.
                 * @param {Object} item     layer or group item to add
                 * @param {Number} position position to insert the item at; defaults to the last position in the array
                 */
                add(item, position = this.items.length) { // <- awesome! default is re-evaluated everytime the function is called
                    item.parent = this;
                    this.items.splice(position, 0, item);
                },

                /**
                 * Removes a given item (layer or another group) from a layer group.
                 * @param {Object} item     layer or group item to add
                 * @return {Number}      index of the item before removal or -1 if the item is not in the group
                 */
                remove(item) {
                    const index = this.items.indexOf(item);
                    if (index !== -1) {
                        delete item.parent;
                        this.items.splice(index, 1);
                    }

                    return index;
                },

                /**
                 * Sets or toggles visibility of the group legend entry and all it's children
                 * @param {Boolean|undefined} value target visibility value; toggles visibility if not set
                 * Other arguments are passed straight to child functions; useful for decorators;
                 */
                setVisibility(value, ...arg) {
                    const option = this.options.visibility;
                    if (typeof value !== 'undefined') {
                        option.value = value ? 'on' : 'off';
                    } else {
                        option.value = VISIBILITY_TOGGLE[option.value];
                    }

                    if (this.type === 'group') {
                        this.items.forEach(item => item.setVisibility(option.value === 'on', ...arg));
                    }
                },

                /**
                 * Returns visibility of the group legend entry
                 * @return {Boolean} true - visible; false - not visbile; undefined - visible and invisible at the same time
                 */
                getVisibility() {
                    return this.options.visibility.value === 'on';
                },

                /**
                 * Walks child items executing the provided function on each leaf;
                 * Returns a flatten array of results from the provided function;
                 * @param  {Function} action function which is passed the following arguments: legend layer entry, its index in its parent's array, parent
                 * @return {Array}        flat array of results
                 */
                walkItems(action) {
                    // roll in the results into a flat array
                    return [].concat.apply([], this.items.map((item, index) => {
                        if (item.type === 'group') {
                            return item.walkItems(action);
                        } else {
                            return action(item, index, this);
                        }
                    }));
                },

                /**
                 * Wraps a default function of the group legend entry
                 * @param  {String} name    Name of the local function to wrap
                 * @param  {Function} wrapper a wrapper function; it recieves the original funciton as the first argument; it's context is set to this
                 */
                decorate(name, wrapper) {
                    const target = this[name].bind(this);
                    this[name] = (...arg) => wrapper.bind(this)(target, ...arg);
                }
            };
        };

        const GROUPED_LAYER_ENTRY = (initialState, expanded = false) => {
            // get defaults for specific layerType
            const defaults = layerDefaults[initialState.layerType] || {};

            return angular.merge(
                LAYER_GROUP(initialState.name, expanded),
                {
                    options: angular.extend({}, defaults.options)
                },
                initialState
            );
        };

        /**
         * Generates a layer entry to be displayed in toc
         * @param  {Object} initialState __must__ have `layerType` property
         * @return {Object}              lyaer entry
         */
        const LAYER_ITEM = (initialState) => {
            // get defaults for specific layerType
            const defaults = layerDefaults[initialState.layerType];

            // merge initialState on top of the defaults
            return angular.merge({}, {
                type: 'layer',
                name: 'dogguts',
                id: 'rv_lt_' + itemIdCounter++,
                options: angular.extend({}, defaults.options),
                flags: angular.extend({}, defaults.flags),
                state: layerStates.default,
                cache: {}, // to cache stuff like retrieved metadata info
                symbology: [{
                    icon: NO_IMAGE,
                    name: ''
                }],

                /**
                 * Sets or toggles visibility of the layer legend entry
                 * @param {Boolean|undefined} value target visibility value; toggles visibiliyt if not set
                 */
                setVisibility(value) {
                    const option = this.options.visibility;

                    if (typeof value !== 'undefined') {
                        option.value = value ? 'on' : 'off';
                    } else {
                        option.value = VISIBILITY_TOGGLE[option.value];
                    }
                },

                /**
                 * Returns visibility of the layer legend entry
                 * @return {Boolean} true - visible; false - not visbile; undefined - visible and invisible at the same time
                 */
                getVisibility() {
                    return this.options.visibility.value === 'on';
                },

                /**
                 * Wraps a default function of the layer legend entry
                 * @param  {String} name    Name of the local function to wrap
                 * @param  {Function} wrapper a wrapper function; it recieves the original funciton as the first argument; it's context is set to this
                 */
                decorate(name, wrapper) {
                    const target = this[name].bind(this);
                    this[name] = (...arg) => wrapper.bind(this)(target, ...arg);
                }
            }, initialState);
        };
        // jscs:enable requireSpacesInAnonymousFunctionExpression

        const legendSwitch = {
            structured: structuredLegendService,
            autopopulate: autoLegendService
        };

        return (config, ...args) => legendSwitch[config.legend.type](config, ...args);

        /**
         * Constrcuts and maintains autogenerated legend.
         * @param  {Object} config current config
         * @param  {Object} layers object with layers from `layerRegistry`
         * @param  {Array} legend array for legend item from `layerRegistry`
         * @return {Object}        instance of `legendService` for autogenerated legend
         */
        function autoLegendService(config, layers, legend) {
            const ref = {
                dataGroup: legendEntryFactory.entryGroup('Data layers', true),
                imageGroup: legendEntryFactory.entryGroup('Image layers', true),
                root: legend.items
            };

            // maps layerTypes to default layergroups
            const layerTypeGroups = {
                esriDynamic: ref.dataGroup,
                esriFeature: ref.dataGroup,
                esriImage: ref.imageGroup,
                esriTile: ref.imageGroup,
                ogcWms: ref.imageGroup
            };

            // maps layerTypes to layer item generators
            const layerTypeGenerators = {
                esriDynamic: dynamicGenerator,
                esriFeature: featureGenerator,
                esriImage: imageGenerator,
                esriTile: tileGenerator,
                ogcWms: imageGenerator
            };

            const service = {
                addLayer,
                removeLayer,
                setLayerState,
                setLayerLoadingFlag
            };

            init();

            return service;

            /***/

            /**
             * Initializes autolegend by adding data and image groups to it.
             */
            function init() {
                ref.root.push(ref.dataGroup, ref.imageGroup);
            }

            /**
             * Creates a grouped layer toc entry (for dynamic and tile layers)
             * @param  {Object} layer layer object from the `layerRegistry`
             * @return {Object}       toc layer entry with hierarchy of sublayers and added symbology
             * @private
             */
            function createGroupedLayerEntry(layer, layerEntriesOptions = {}) {
                const dynamicGroup = legendEntryFactory.dynamicEntryMasterGroup(
                    layer.initialState, layer.layer, true);
                const layerEntryType = `${layer.initialState.layerType}LayerEntry`;
                layer.state = dynamicGroup;
                dynamicGroup.slaves = [];

                const symbologyPromise = getMapServerSymbology(layer);

                // generate all the slave sublayers upfornt ...
                layer.layer.layerInfos.forEach((layerInfo, index) => {
                    const layerEntryOptions = layerEntriesOptions[index] || {};

                    if (layerInfo.subLayerIds) { // group item
                        const groupItem = legendEntryFactory.dynamicEntryGroup({
                            name: layerInfo.name,
                            layerType: layerEntryType,
                            options: layerEntryOptions
                            // TODO: add options override from the config
                        });

                        assignDirectMaster(groupItem, layerInfo.parentLayerId);
                    } else { // leaf item
                        const layerItem = legendEntryFactory.dynamicLayerEntry({
                            name: layerInfo.name,
                            layerType: layerEntryType,
                            options: layerEntryOptions
                            // TODO: add options override from the config
                        });

                        assignDirectMaster(layerItem, layerInfo.parentLayerId);
                    }
                });

                // wait for symbology to load and ...
                symbologyPromise
                    .then(({ data }) => { // ... and apply them to existing child items
                        data.layers.forEach(layer => applySymbology(dynamicGroup.slaves[layer.layerId], layer));
                    });

                // if there is no metadataurl, remove metadata options altogether
                if (typeof dynamicGroup.metadataUrl === 'undefined') {
                    delete dynamicGroup.options.metadata;
                    dynamicGroup.slaves.forEach(slave => delete slave.options.metadata);
                }

                return dynamicGroup;

                /**
                 * Finds direct parent of a child item in dynamic layer group and adds it to its items array.
                 * @param  {Object} item     layer or group item
                 * @param  {Number} masterId id of the direct parent
                 */
                function assignDirectMaster(item, masterId) {
                    item.master = dynamicGroup; // store a reference to the root group item of the dynamic layer
                    dynamicGroup.slaves.push(item); // store in slave reference array

                    if (masterId !== -1) {
                        dynamicGroup.slaves[masterId].add(item); // add to master's items list only if it's not the root
                    }
                }
            }

            /**
             * Parses a dynamic layer object and creates a legend item (with nested groups and symbology)
             * For a dynamic layer, there are two visibility functions:
             *     - `setVisibility`: https://developers.arcgis.com/javascript/jsapi/arcgisdynamicmapservicelayer-amd.html#setvisibility
             *      sets visibility of the whole layer; if this is set to false, using `setVisibleLayers` will not change anything
             *
             *  - `setVisibleLayers`: https://developers.arcgis.com/javascript/jsapi/arcgisdynamicmapservicelayer-amd.html#setvisiblelayers
             *      sets visibility of sublayers;
             *
             * A tocEntry for a dynamic layer contains subgroups and leaf nodes, each one with a visibility toggle.
             *  - User clicks on leaf's visibility toggle:
             *      toggle visibility of the leaf's layer item;
             *      notify the root group of this dynamic layer;
             *      walk root's children to find out which leaves are visible, omitting any subgroups
             *      call `setVisibleLayers` on the layer object to change the visibility of the layer
             *
             *  - User clicks on subgroup's visibility toggle:
             *      toggle visibility of the subgroup item;
             *      toggle all its children (prevent children from notifying the root when they are toggled)
             *      notify the root group of this dynamic layer;
             *      walk root's children to find out which leaves are visible, omitting any subgroups
             *      call `setVisibleLayers` on the layer object to change the visibility of the layer
             *
             *  - User clicks on root's visibility toggle:
             *      toggle all its children (prevent children from notifying the root when they are toggled)
             *      walk root's children to find out which leaves are visible, omitting any subgroups
             *      call `setVisibleLayers` on the layer object to change the visibility of the layer
             *
             * @param  {Object} layer layer object from `layerRegistry`
             * @return {Object}       legend item
             */
            function dynamicGenerator(layer) {

                const layerEntriesOptions = {};
                layer.initialState.layerEntries.forEach(layerEntry => {
                    layerEntriesOptions[layerEntry.index] = layerEntry;
                });

                const tocEntry = createGroupedLayerEntry(layer, layerEntriesOptions);

                // TODO: Aly's points:
                // decorators in JS are much harder to read / track than in languages that have proper annotations
                // make an explicit class hierarchy and have subclasses add their own setVisiblity implementations
                /*
                tocEntry.decorate('setVisibility', setVisibilityDynamicRoot);

                // decorate all leaves
                tocEntry.slaves.forEach(slave => slave.decorate('setVisibility', setVisibilityDynamicChild));
                */
                // add to the legend only once that are specified
                // NOTE:  :point_up: [March 18, 2016 12:53 PM](https://gitter.im/RAMP-PCAR/TeamRoom?at=56ec3281bb4a1731739b0d33)
                // We assume the inclusion is properly formatted (ex: [1, 2] will result in sublayer 2 being included twice - once under root and once more time under 1).



                layer.state.layerEntries.forEach(({ index }) => {
                    const slave = tocEntry.slaves[index];
                    // if layerEntry id is incorrect, ignore it
                    if (slave) {
                        slave.setVisibility(slave.getVisibility(), false);

                        tocEntry.add(slave);
                    }
                });
                /*
                // set initial visibility of the sublayers;
                // this cannot be set in `layerRegistry` because legend entry for dynamic layer didn't exist yet;
                tocEntry.setVisibility(null, true);
                */
                tocEntry._setVisibility();

                return tocEntry;

                /**
                 * Set visibility of the root group in the dynamic layer
                 * @param  {Function}  targetFunction original `setVisibility` function from LAYER_GROUP
                 * @param  {Boolean}  value          target visibility value; if undefined, toggle visibility
                 * @param  {Boolean} isNotified     defaults to false; flag indicating if root was notified by a child; this is used to avoid multiple calls between root and children; if true, value is ignored
                 */
                function setVisibilityDynamicRoot(targetFunction, value, isNotified = false) {
                    if (!isNotified) {
                        targetFunction(value, false);
                    }

                    // get an array of visible sublayers (e.g. [1,4,6])
                    const visibleSublayerIds = tocEntry.walkItems(item => {
                        // get sublayer index from the slaves array
                        const index = tocEntry.slaves.indexOf(item);
                        return item.getVisibility() ? index : -1;
                    }).filter(index => index !== -1);

                    console.log(tocEntry.name + ' set to ' + tocEntry.getVisibility() + ' ' + visibleSublayerIds);

                    // set visibility of the dynamic layer
                    layer.layer.setVisibility(tocEntry.getVisibility());

                    // finally, set visibility of the sublayers
                    layer.layer.setVisibleLayers(visibleSublayerIds);
                }

                /**
                 * Set visibility of the dynamic child (group or leaf); notifies root if not suppressed
                 * @param  {Function} targetFunction original `setVisibility` function from LAYER_ITEM or LAYER_GROUP
                 * @param  {Boolean} value          target visibility value; if undefined, toggle visibility
                 * @param  {Boolean} notifyMaster   defaults to true; flag indicating if children should be notified; this is used to avoid multiple calls between root and children
                 */
                function setVisibilityDynamicChild(targetFunction, value, notifyMaster = true) {
                    targetFunction(value, false);

                    if (notifyMaster) {
                        tocEntry.setVisibility(null, true);
                    }
                }
            }

            /**
             * Parses a tile layer object and creates a legend item (with nested groups and symbology)
             * Uses the same logic as dynamic layers to generate symbology hierarchy
             * @param  {Object} layer layer object from `layerRegistry`
             * @return {Object}       legend item
             */
            function tileGenerator(layer) {
                const tocEntry = legendEntryFactory.singleLayerEntry(layer.initialState, layer.layer);

                // add all tile sublayers to the toc entry
                tocEntry.slaves.forEach(slave => tocEntry.add(slave));

                return tocEntry;
            }

            /**
             * Parses feature layer object and create a legend entry with symbology
             * @param  {Object} layer layer object from `layerRegistry`
             * @return {Object}       legend item
             */
            function featureGenerator(layer) {
                // generate toc entry
                const state = legendEntryFactory.singleLayerEntry(layer.initialState, layer.layer);
                layer.state = state;

                const symbologyPromise = getMapServerSymbology(layer);

                symbologyPromise.then(
                    ({ data, index }) => applySymbology(state, data.layers[index]));

                return state;
            }

            /**
             * Parses esri image layer object and create a legend entry with symbology
             * @param  {Object} layer layer object from `layerRegistry`
             * @return {Object}       legend item
             */
            function imageGenerator(layer) {
                // generate toc entry
                const state = legendEntryFactory.singleLayerEntry(layer.initialState, layer.layer);
                layer.state = state;

                return state;
            }

            /**
             * Add a provided layer to the appropriate group;
             *
             * TODO: hide groups with no layers;
             * @param {Object} layer object from `layerRegistry` `layers` object
             */
            function addLayer(layer) {
                const layerType = layer.initialState.layerType;
                const entry = layerTypeGenerators[layerType](layer);

                layerTypeGroups[layerType].add(entry);
            }

            /**
             * Removes a provided layer from the appropriate group.
             * @param {Object} layer object from `layerRegistry` `layers` object
             */
            function removeLayer(layer) {
                layerTypeGroups[layer.state.layerType].remove(layer.state);
            }

            /**
             * Sets state of the layer entry: error, default, out-of-scale, etc
             * @param {Object} layer layer object from `layerRegistry`
             * @param {String} state defaults to `default`; state name
             * @param {Number} delay defaults to 0; delay before setting the state
             */
            function setLayerState(layer, state = layerStates.default, delay = 0) {
                const legendEntry = layer.state;

                // same as with map loading indicator, need timeout since it's a non-Angular async call
                $timeout.cancel(legendEntry.stateTimeout);
                legendEntry.stateTimeout = $timeout(() => {
                    legendEntry.state = state;

                    /*switch (state) {
                        case: layerStates
                    }*/
                }, delay);
            }

            /**
             * Sets `isLoading` flag on the legend entry.
             * @param {Object} layer layer object from `layerRegistry`
             * @param {Boolean} isLoading defaults to true; flag indicating if the layer is updating their content
             * @param {Number} delay defaults to 0; delay before setting the state
             */
            function setLayerLoadingFlag(layer, isLoading = true, delay = 0) {
                const legendEntry = layer.state;

                // same as with map loading indicator, need timeout since it's a non-Angular async call
                $timeout.cancel(legendEntry.loadingTimeout);
                legendEntry.loadingTimeout = $timeout(() => {
                    legendEntry.isLoading = isLoading;
                }, delay);
            }
        }

        // TODO: maybe this should be split into a separate service; it can get messy otherwise in here
        function structuredLegendService() {

        }

        /**
         * TODO: Work in progress... Works fine for feature layers only right now; everything else gest a generic icon;
         * TODO: move to geoapi as it's stateless and very specific
         * Scrapes feaure and dynamic layers for their symbology;
         *
         * * data.layers [
         *     {
         *         layerId: Number,
         *         legend: Array
         *     },
         *     ...
         * ]
         * @param  {Object} layer layer object from `layerRegistry`
         */
        function getMapServerSymbology(layer) {
            const reg = /(.+?)(\/(\d))?$/; // separate layer id from the rest of the url
            const url = layer.state.url.replace(/\/+$/, ''); // strip trailing slashes

            // jscs also doesn't like fancy destructuring
            // jscs:disable requireSpaceAfterComma
            const [, legendUrl,, index = -1] = reg.exec(url); // https://babeljs.io/docs/learn-es2015/#destructuring
            // jscs:enable requireSpaceAfterComma

            return $http.jsonp(`${legendUrl}/legend?f=json&callback=JSON_CALLBACK`)
                .then(result => {
                    // console.log(legendUrl, index, result);

                    if (result.data.error) {
                        return $q.reject(result.data.error);
                    }
                    return {
                        data: result.data,
                        index
                    };
                })
                .catch(error => {
                    // TODO: apply default symbology to the layer in question in this case
                    console.error(error);
                });
        }

        /**
         * Applies retrieved symbology to the layer item's state
         * @param  {Object} state     layer item
         * @param  {Object} layerData data from the legend endpoint
         */
        function applySymbology(state, layerData) {
            state.symbology = layerData.legend.map(item => {
                return {
                    icon: `data:${item.contentType};base64,${item.imageData}`,
                    name: item.label
                };
            });
        }
    }
})();
