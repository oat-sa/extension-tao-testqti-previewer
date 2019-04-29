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
    'tpl!taoQtiTestPreviewer/previewer/plugins/tools/scale/component/tpl/devices-previewer',
    'css!taoQtiTestPreviewer/previewer/plugins/tools/scale/component/css/devicesPreviewer.css'
], function ($, _, __, componentFactory, devicesPreviewerTpl) {
    'use strict';

    /**
     * Some default config
     * @type {Object}
     */
    var defaults = {
        deviceType: 'standard',
        deviceWith: 0,
        deviceHeight: 0,
        deviceOrientation: null
    };

    /**
     * Builds a devices previewer component. It will works in two modes:
     * - the standard mode will do nothing special, this is simply a sleeping mode
     * - the device mode will redesign the view to show a content using a device's layout and aspect ratio
     *
     * @example
     *  var devicesPreviewer = devicesPreviewerFactory('.previewer .previewer-content);
     *  ...
     *  // react to type change
     *  devicesPreviewer.on('resize', function(width, height) {
     *      // the size has changed
     *  });
     *
     * @param {HTMLElement|String} container
     * @param {Object} config
     * @param {String} [config.deviceType='standard'] - The preview mode to apply
     * @param {Number} [config.deviceWidth=null] - The width of the device to preview
     * @param {Number} [config.deviceHeight=null] - The height of the device to preview
     * @param {String} [config.deviceOrientation='landscape'] - The device orientation
     * @returns {devicesPreviewer}
     * @fires ready - When the component is ready to work
     */
    function devicesPreviewerFactory(container, config) {
        var $previewContainer = null;
        var $previousContainer = null;
        var $wrappedElement = null;

        /**
         * Removes the scale settings applied on the devices previewer
         */
        var clearScale = function clearScale() {
            // todo - update with actual preview scale data
            $previewContainer.removeAttr('data-width').removeAttr('data-height');
        };

        /**
         * Computes and applies the scale settings on the devices previewer
         * @param {Number} width
         * @param {Number} height
         */
        var applyScale = function applyScale(width, height) {
            // todo - update with actual preview scale data
            $previewContainer.attr('data-width', width).attr('data-height', height);
        };

        // component specific API
        var api = {
            /**
             * Gets the device width.
             * @returns {Number}
             */
            getDeviceWidth: function getDeviceWidth() {
                return this.getConfig().deviceWidth;
            },

            /**
             * Sets the device width.
             * @param {String|Number} width
             * @returns {devicesPreviewer}
             * @fires devicewidthchange
             */
            setDeviceWidth: function setDeviceWidth(width) {
                var componentConfig = this.getConfig();
                componentConfig.deviceWidth = parseInt(width, 10) || 0;

                /**
                 * @event devicewidthchange
                 * @param {Number} deviceWidth
                 */
                this.trigger('devicewidthchange', componentConfig.deviceWidth);

                return this;
            },

            /**
             * Gets the device height.
             * @returns {Number}
             */
            getDeviceHeight: function getDeviceHeight() {
                return this.getConfig().deviceHeight;
            },

            /**
             * Sets the device height.
             * @param {String|Number} height
             * @returns {devicesPreviewer}
             * @fires deviceheightchange
             */
            setDeviceHeight: function setDeviceHeight(height) {
                var componentConfig = this.getConfig();
                componentConfig.deviceHeight = parseInt(height, 10) || 0;

                /**
                 * @event deviceheightchange
                 * @param {Number} deviceHeight
                 */
                this.trigger('deviceheightchange', componentConfig.deviceHeight);

                return this;
            },

            /**
             * Gets the device orientation.
             * @returns {String}
             */
            getDeviceOrientation: function getDeviceOrientation() {
                return this.getConfig().deviceOrientation;
            },

            /**
             * Sets the device orientation.
             * @param {String} orientation
             * @returns {devicesPreviewer}
             * @fires deviceorientationchange
             */
            setDeviceOrientation: function setDeviceOrientation(orientation) {
                var componentConfig = this.getConfig();
                componentConfig.deviceOrientation = orientation;

                if (this.is('rendered')) {
                    // use .attr() instead of .data() to ensure the DOM will be properly updated
                    // this is required as CSS must take the relay to control the display
                    this.getElement().attr('data-orientation', componentConfig.deviceOrientation);
                }

                /**
                 * @event deviceorientationchange
                 * @param {String} deviceOrientation
                 */
                this.trigger('deviceorientationchange', componentConfig.deviceOrientation);

                return this;
            },

            /**
             * Gets the device type.
             * @returns {String}
             */
            getDeviceType: function getDeviceType() {
                return this.getConfig().deviceType;
            },

            /**
             * Sets the type of device
             * @param {String} type
             * @returns {devicesPreviewer}
             * @fires devicetypechange
             */
            setDeviceType: function setDeviceType(type) {
                var componentConfig = this.getConfig();
                componentConfig.deviceType = type;

                if (this.is('rendered')) {
                    // use .attr() instead of .data() to ensure the DOM will be properly updated
                    // this is required as CSS must take the relay to control the display
                    this.getElement().attr('data-type', componentConfig.deviceType);
                }

                /**
                 * @event devicetypechange
                 * @param {String} deviceType
                 */
                this.trigger('devicetypechange', componentConfig.deviceType);

                return this;
            },

            /**
             * Previews the content using the current device settings
             * @returns {devicesPreviewer}
             * @fires devicepreview after the device has been set on preview
             */
            previewDevice: function previewDevice() {
                var width, height;

                if (this.is('rendered')) {
                    if (this.is('disabled') || this.getDeviceType() === 'standard') {
                        // standard mode and disabled state both should be reflected by a "no scale" view
                        clearScale();
                    } else {
                        // in device preview mode, we need to apply the device's size with respect to the orientation
                        if (this.getDeviceOrientation() === 'portrait') {
                            width = this.getDeviceHeight();
                            height = this.getDeviceWidth();
                        } else {
                            width = this.getDeviceWidth();
                            height = this.getDeviceHeight();
                        }
                        applyScale(width, height);
                    }

                    /**
                     * @event devicepreview
                     */
                    this.trigger('devicepreview');
                }

                return this;
            },

            /**
             * Wraps the previewed content into the previewer frame
             * @param {HTMLElement|jQuery} element
             * @returns {devicesPreviewer}
             * @fires wrap after the element has been wrapped
             */
            wrap: function wrap(element) {
                if (this.is('rendered')) {
                    // restore current wrapped element to its previous place
                    this.unwrap();

                    // move the element to wrap in the preview container
                    $wrappedElement = $(element);
                    $previousContainer = $wrappedElement.parent();
                    $previewContainer.append($wrappedElement);

                    /**
                     * @event wrap
                     * @param {jQuery} $wrappedElement - The element that has been wrapped
                     */
                    this.trigger('wrap', $wrappedElement);
                }

                return this;
            },

            /**
             * Unwraps the previewed content from the previewer frame
             * @returns {devicesPreviewer}
             * @fires unwrap after the element has been unwrapped
             */
            unwrap: function unwrap() {
                var $wasWrappedElement = $wrappedElement;
                if (this.is('rendered') && $wrappedElement) {
                    // restore current wrapped element to its previous place
                    $previousContainer.append($wrappedElement);
                    $previousContainer = null;
                    $wrappedElement = null;

                    /**
                     * @event unwrap
                     * @param {jQuery} $wrappedElement - The element that was wrapped
                     */
                    this.trigger('unwrap', $wasWrappedElement);
                }

                return this;
            }
        };

        // build and setup the component
        var devicesPreviewer = componentFactory(api, defaults)
            // set the component's layout
            .setTemplate(devicesPreviewerTpl)

            // auto render on init
            .on('init', function () {
                var componentConfig = this.getConfig();

                // init the internal state
                this.setDeviceType(componentConfig.deviceType);
                this.setDeviceWidth(componentConfig.deviceWidth);
                this.setDeviceHeight(componentConfig.deviceHeight);
                this.setDeviceOrientation(componentConfig.deviceOrientation);

                // auto render on init
                _.defer(function () {
                    devicesPreviewer.render(container);
                });
            })

            // renders the component
            .on('render', function () {
                $previewContainer = this.getElement().find('.preview-container');

                /**
                 * @event ready
                 */
                this.trigger('ready');
            })

            // take care of the disable state
            .on('disable enable', function () {
                var self = this;
                if (this.is('rendered')) {
                    // need to defer the call as the enable/disable events are emitted before the state is updated
                    _.defer(function () {
                        self.previewDevice();
                    });
                }
            })

            // cleanup the place
            .on('destroy', function () {
                this.unwrap();
                $previewContainer = null;
                $previousContainer = null;
                $wrappedElement = null;
            });

        // initialize the component with the provided config
        // defer the call to allow to listen to the init event
        _.defer(function () {
            devicesPreviewer.init(config);
        });

        return devicesPreviewer;
    }

    return devicesPreviewerFactory;
});
