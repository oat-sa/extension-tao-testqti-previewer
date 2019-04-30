/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2019 Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'i18n',
    'ui/component',
    'ui/selecter',
    'taoQtiTestPreviewer/previewer/helpers/devices',
    'tpl!taoQtiTestPreviewer/previewer/plugins/tools/scale/component/tpl/devices-selector',
    'tpl!taoQtiTestPreviewer/previewer/plugins/tools/scale/component/tpl/selector',
    'css!taoQtiTestPreviewer/previewer/plugins/tools/scale/component/css/devicesSelector.css'
], function ($, _, __, componentFactory, lookupSelecter, devicesHelper, devicesSelectorTpl, selectorTpl) {
    'use strict';

    /**
     * @typedef {Object} selectorEntry
     * @property {String} value - The value that identifies the entry
     * @property {String} label - The text displayed to describe the entry
     */

    /**
     * @typedef {selectorEntry} mainSelectorEntry
     * @property {Boolean} devicesList - tells if a list of devices is expected
     * @property {Boolean} orientation - tells if a list of orientations is expected
     */

    /**
     * Some default config
     * @type {Object}
     */
    var defaults = {
        type: 'standard',
        device: null,
        orientation: 'landscape'
    };

    /**
     * List of available types of devices
     * @type {mainSelectorEntry[]}
     */
    var deviceTypesList = [{
        value: 'standard',
        label: __('Actual size'),
        devicesList: false,
        orientation: false
    }, {
        value: 'desktop',
        label: __('Desktop preview'),
        devicesList: true,
        orientation: false
    }, {
        value: 'mobile',
        label: __('Mobile preview'),
        devicesList: true,
        orientation: true
    }];

    /**
     * List of available orientations
     * @type {selectorEntry[]}
     */
    var deviceOrientationsList = [{
        value: 'landscape',
        label: __('Landscape')
    }, {
        value: 'portrait',
        label: __('Portrait')
    }];

    /**
     * Map selector's names to setter callbacks.
     * This will be used to call the expected setter when selecting a value.
     * @see devicesSelector.select()
     * @type {Object}
     */
    var callbackMap = {
        type: 'setType',
        device: 'setDevice',
        mobile: 'setDevice',
        desktop: 'setDevice',
        orientation: 'setOrientation'
    };

    /**
     * Gets the data for a selected entry
     * @param {String} selected
     * @param {selectorEntry[]|deviceScreen[]} list
     * @returns {selectorEntry|deviceScreen|null}
     */
    function getSelectorData(selected, list) {
        if (selected && _.size(list)) {
            return _.find(list, {value: selected}) || null;
        }
        return null;
    }

    /**
     * Ensures an identifier is valid with respect to the provided list, or defaulted to null.
     * @param {String} identifier
     * @param {selectorEntry[]} list
     * @returns {String|null}
     */
    function getValidIdentifier(identifier, list) {
        if (list && list.length) {
            if (_.find(list, {value: identifier})) {
                return identifier;
            } else {
                return _.first(list).value;
            }
        }
        return null;
    }

    /**
     * Update a Select2 control
     * @param {jQuery} $selector
     * @param {String} value
     * @returns {jQuery}
     */
    function updateSelect2($selector, value) {
        var current = $selector.val();
        // avoid to stress the setters if the value is already set
        if (current !== value) {
            $selector.val(value);
            $selector.trigger('change');
        }
        return $selector;
    }

    /**
     * Uninstalls a Select2 control
     * @param {jQuery} $selector
     * @returns {jQuery}
     */
    function removeSelect2($selector) {
        if ($selector.hasClass("select2-offscreen")) {
            $selector.select2('destroy');
        }
        return $selector;
    }

    /**
     * Builds a devices selector component. It will provides 3 selectors in cascade:
     * - the first allows to select the type of device
     * - the second allows to select the device itself, the list being filtered by the value of the first selector
     * - the third allows to select the display orientation, if applicable
     *
     * @example
     *  var devicesSelector = devicesSelectorFactory('.previewer .previewer-top-bar);
     *  ...
     *  // react to type change
     *  devicesSelector.on('typechange', function(type) {
     *      if (!this.isDeviceMode()) {
     *          // reset the type to standard, we can re-apply the default size
     *      }
     *  });
     *
     *  // react to device change
     *  devicesSelector.on('devicechange', function(device, data) {
     *      // apply the size provided in data
     *  });
     *
     *  // react to orientation change
     *  devicesSelector.on('orientationchange', function(orientation) {
     *      // apply the orientation
     *  });
     *
     * @param {HTMLElement|String} container
     * @param {Object} config
     * @param {String} [config.type='standard'] - The default selected device type
     * @param {String} [config.device=null] - The default selected device
     * @param {String} [config.orientation='landscape'] - The default selected orientation
     * @returns {devicesSelector}
     * @fires ready - When the component is ready to work
     */
    function devicesSelectorFactory(container, config) {
        // internal state
        var selected = {
            type: null,
            device: null,
            orientation: null,
            desktop: null,
            mobile: null
        };
        var devicesList = [];
        var typeData = null;
        var controls = null;

        /**
         * Changes a DOM property on each selector
         * @param {String} property
         * @param {String|Boolean|Number} value
         */
        var setControlsProp = function setControlsProp(property, value) {
            _.forEach(controls, function($selector) {
                $selector.prop(property, value);
            });
        };

        // component specific API
        var api = {
            /**
             * Tells if the selector has entered in a device mode or in the standard mode.
             * Standard mode means 'actual size'.
             * @returns {Boolean}
             */
            isDeviceMode: function isDeviceMode() {
                return selected.type !== 'standard';
            },

            /**
             * Reflects the mode to the DOM
             * @returns {devicesSelector}
             */
            updateMode: function updateMode() {
                // use .attr() instead of .data() to ensure the DOM will be properly updated
                // this is required as CSS must take the relay to control the display
                if (this.is('rendered')) {
                    this.getElement().attr('data-type', selected.type);
                }
                return this;
            },

            /**
             * Gets the selected device type.
             * @returns {String} The type of device, from the list `['standard', 'mobile', 'desktop']`
             */
            getType: function getType() {
                return selected.type;
            },

            /**
             * Gets the selected device orientation.
             * If the current mode is not a device mode (i.e. actual size), null is returned.
             * @returns {String}
             */
            getOrientation: function getOrientation() {
                if (typeData && typeData.orientation) {
                    return selected.orientation;
                }
                return null;
            },

            /**
             * Gets the identifier of the selected device.
             * If the current mode is not a device mode (i.e. actual size), null is returned.
             * @returns {String|null}
             */
            getDevice: function getDevice() {
                if (typeData && typeData.devicesList) {
                    return selected.device;
                }
                return null;
            },

            /**
             * Gets the data for the selected device.
             * If the current mode is not a device mode (i.e. actual size), null is returned.
             * @returns {deviceScreen|null}
             */
            getDeviceData: function getDeviceData() {
                return getSelectorData(this.getDevice(), devicesList);
            },

            /**
             * Selects a type of device
             * @param {String} identifier
             * @returns {devicesSelector}
             * @fires typechange event after the type has been changed
             * @fires devicechange event after the device has been updated if a list of devices is expected
             */
            setType: function setType(identifier) {
                // validate the identifier before applying the change
                identifier = getValidIdentifier(identifier, deviceTypesList);
                if (identifier !== selected.type) {
                    selected.type = identifier;

                    // when the type changes, the list of devices must be updated
                    devicesList = devicesHelper.getDevicesByType(selected.type);
                    typeData = getSelectorData(selected.type, deviceTypesList);

                    // update the rendered content
                    if (this.is('rendered')) {
                        updateSelect2(controls.$typeSelector, selected.type);
                        this.updateMode();
                    }

                    /**
                     * @event typechange
                     * @param {String} selectedType
                     */
                    this.trigger('typechange', selected.type);

                    // the current device must be adapted if a list of devices is expected
                    if (typeData.devicesList) {
                        this.setDevice(selected[selected.type]);
                    }
                }
                return this;
            },

            /**
             * Sets the selected device orientation
             * @param {String} identifier
             * @returns {devicesSelector}
             * @fires orientationchange event after the type has been changed
             */
            setOrientation: function setOrientation(identifier) {
                // validate the identifier before applying the change
                identifier = getValidIdentifier(identifier, deviceOrientationsList);
                if (identifier !== selected.orientation) {
                    selected.orientation = identifier;

                    // update the rendered content
                    if (this.is('rendered')) {
                        updateSelect2(controls.$orientationSelector, selected.orientation);
                    }

                    /**
                     * @event orientationchange
                     * @param {String} selectedOrientation
                     */
                    this.trigger('orientationchange', selected.orientation);
                }
                return this;
            },

            /**
             * Selects a device
             * @param {String} identifier
             * @returns {devicesSelector}
             * @fires devicechange event after the device has been changed
             */
            setDevice: function setDevice(identifier) {
                var $selector;

                // validate the identifier before applying the change
                identifier = getValidIdentifier(identifier, devicesList);
                if (identifier !== selected.device) {
                    selected.device = identifier;
                    selected[selected.type] = identifier;

                    // update the rendered content, depending on the device's category
                    if (this.is('rendered') && this.isDeviceMode()) {
                        $selector = controls['$' + selected.type + 'Selector'];
                        if ($selector) {
                            updateSelect2($selector, selected.device);
                        }
                    }

                    /**
                     * @event devicechange
                     * @param {String} selectedDevice
                     * @param {deviceScreen} deviceData
                     */
                    this.trigger('devicechange', selected.device, this.getDeviceData());
                }
                return this;
            },

            /**
             * Selects a value in the proper selector
             * @param {String} name - The name of the selector
             * @param {String} value - The value to select
             * @returns {devicesSelector}
             */
            select: function select(name, value) {
                var setterName = callbackMap[name];
                if (setterName && _.isFunction(this[setterName])) {
                    this[setterName](value);
                }
                return this;
            },

            /**
             * Reset to default values, from the config.
             * @returns {devicesSelector}
             */
            reset: function reset() {
                var componentConfig = this.getConfig();
                this.setType(componentConfig.type);
                this.setDevice(componentConfig.device);
                this.setOrientation(componentConfig.orientation);
                return this;
            }
        };

        // build and setup the component
        var devicesSelector = componentFactory(api, defaults)
            // set the component's layout
            .setTemplate(devicesSelectorTpl)

            // auto render on init
            .on('init', function () {
                // ensure the initial state is aligned with the config
                this.reset();

                // auto render on init
                _.defer(function () {
                    devicesSelector.render(container);
                });
            })

            // renders the component
            .on('render', function () {
                var self = this;

                /**
                 * Renders a selector from a list of entries. Takes care of the currently selected value.
                 * @param {String} name - The name of the selector
                 * @param {selectorEntry[]} list - The list of entries
                 * @param {String} selectedValue - The currently selected value
                 * @param {String} [category=name] - The category of the selector (type, device, orientation).
                 *                                   Defaulted to the name if not provided.
                 * @returns {jQuery}
                 */
                function renderSelector(name, list, selectedValue, category) {
                    var $selector = $(selectorTpl({
                        name: name,
                        category: category || name,
                        items: _.map(list, function(item) {
                            return {
                                value: item.value,
                                label: item.label,
                                selected: selectedValue === item.value
                            };
                        })
                    }));
                    self.getElement().find('.' + name + '-selector').html($selector);
                    return $selector;
                }

                // create each selector, and keep access to them
                controls = {
                    $typeSelector: renderSelector('type', deviceTypesList, selected.type),
                    $desktopSelector: renderSelector('desktop', devicesHelper.getDesktopDevices(), selected.device, 'device'),
                    $mobileSelector: renderSelector('mobile', devicesHelper.getMobileDevices(), selected.device, 'device'),
                    $orientationSelector: renderSelector('orientation', deviceOrientationsList, selected.orientation)
                };
                lookupSelecter(this.getElement());

                // react to any change in selectors and then forward the event to the related entry
                this.getElement().on('change', '.selector', function onSelectorChange(e) {
                    var $selector = $(e.target).closest('select');
                    self.select($selector.attr('name'), $selector.val());
                });

                // initialize the display mode
                this.updateMode();

                /**
                 * @event ready
                 */
                this.trigger('ready');
            })

            // take care of the disable state
            .on('disable', function () {
                if (this.is('rendered')) {
                    setControlsProp("disabled", true);
                }
            })
            .on('enable', function () {
                if (this.is('rendered')) {
                    setControlsProp("disabled", false);
                }
            })

            // cleanup the place
            .on('destroy', function () {
                _.forEach(controls, removeSelect2);
                controls = null;
                selected = null;
                typeData = null;
                devicesList = null;
            });

        // initialize the component with the provided config
        // defer the call to allow to listen to the init event
        _.defer(function () {
            devicesSelector.init(config);
        });

        return devicesSelector;
    }

    return devicesSelectorFactory;
});
