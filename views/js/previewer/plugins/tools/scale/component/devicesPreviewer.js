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
    'ui/transformer',
    'tpl!taoQtiTestPreviewer/previewer/plugins/tools/scale/component/tpl/devices-previewer',
    'css!taoQtiTestPreviewer/previewer/plugins/tools/scale/component/css/devicesPreviewer.css'
], function ($, _, __, componentFactory, transformer, devicesPreviewerTpl) {
    'use strict';

    /**
     * @typedef {Object} size
     * @property {Number} width
     * @property {Number} height
     */

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
     *  // react to changes
     *  devicesPreviewer
     *      .on('devicewidthchange', function(width) {
     *          // the width has changed
     *      })
     *      .on('deviceheightchange', function(height) {
     *          // the height has changed
     *      })
     *      .on('deviceorientationchange', function(orientation) {
     *          // the orientation has changed
     *      })
     *      .on('devicetypechange', function(type) {
     *          // the type has changed
     *      })
     *      .on('devicepreview', function() {
     *          // the device preview mode has been applied
     *      });
     *  ...
     *  // apply changes
     *  devicesPreviewer
     *      .setDeviceType(type)
     *      .setDeviceOrientation(orientation)
     *      .setDeviceWidth(width)
     *      .setDeviceHeight(height)
     *      .previewDevice();
     * ...
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
        var controls = null;

        /**
         * Remove the applied scale
         */
        var resetScale = function resetScale() {
            if (controls) {
                controls.$previewContent.removeAttr('style');
                controls.$previewContainer.removeAttr('style');
            }
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
             * Tells if the previewer has entered in a device mode or in the standard mode.
             * Standard mode means 'actual size'.
             * @returns {Boolean}
             */
            isDeviceMode: function isDeviceMode() {
                return this.getDeviceType() !== 'standard';
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
                        this.clearScale();
                    } else {
                        // in device preview mode, we need to apply the device's size with respect to the orientation
                        if (this.getDeviceOrientation() === 'portrait') {
                            width = this.getDeviceHeight();
                            height = this.getDeviceWidth();
                        } else {
                            width = this.getDeviceWidth();
                            height = this.getDeviceHeight();
                        }
                        this.applyScale(width, height);
                    }

                    /**
                     * @event devicepreview
                     */
                    this.trigger('devicepreview');
                }

                return this;
            },

            /**
             * Removes the scale settings applied on the devices previewer
             * @returns {devicesPreviewer}
             * @fires scaleclear after the scale settings have been cleared
             */
            clearScale: function clearScale() {
                if (this.is('rendered')) {
                    resetScale();

                    /**
                     * @event scaleclear
                     */
                    this.trigger('scaleclear');
                }

                return this;
            },

            /**
             * Computes and applies the scale settings on the devices previewer
             * @param {Number} width
             * @param {Number} height
             * @returns {devicesPreviewer}
             * * @fires scalechange after the scale settings have been applied
             */
            applyScale: function applyScale(width, height) {
                var frameSize, frameMargins, scaleFactor;

                if (this.is('rendered')) {
                    resetScale();

                    frameSize = this.getFrameSize();
                    frameMargins = this.getFrameMargins();
                    scaleFactor = this.getScaleFactor(width, height);

                    controls.$previewContent
                        .width(width)
                        .height(height);

                    controls.$previewContainer
                        .css('left', (frameSize.width - (width + frameMargins.width) * scaleFactor) / 2)
                        .width(width + frameMargins.width)
                        .height(height + frameMargins.height);

                    transformer.setTransformOrigin(controls.$previewContainer, 0, 0);
                    transformer.scale(controls.$previewContainer, scaleFactor);

                    /**
                     * @event scalechange
                     */
                    this.trigger('scalechange');
                }

                return this;
            },

            /**
             * Computes and gets the margins of the previewer frame
             * @returns {size}
             */
            getFrameMargins: function getFrameMargins() {
                var margins = {
                    width: 0,
                    height: 0
                };
                if (this.is('rendered')) {
                    margins.width = controls.$previewContainer.outerWidth() - controls.$previewContent.width();
                    margins.height = controls.$previewContainer.outerHeight() - controls.$previewContent.height();
                }
                return margins;
            },

            /**
             * Computes and gets the available size in the previewer frame
             * @returns {size}
             */
            getFrameSize: function getFrameSize() {
                var size = {
                    width: 0,
                    height: 0
                };
                if (this.is('rendered')) {
                    size.width = this.getContainer().innerWidth();
                    size.height = this.getContainer().innerHeight();
                }
                return size;
            },

            /**
             * Computes and gets the scale factor of the previewer frame
             * @param {Number} width
             * @param {Number} height
             * @returns {Number}
             */
            getScaleFactor: function getScaleFactor(width, height) {
                var margins, frameSize;
                var scaleFactor = {
                    x: 1,
                    y: 1
                };
                if (this.is('rendered') && this.isDeviceMode()) {
                    frameSize = this.getFrameSize();
                    margins = this.getFrameMargins();
                    width += margins.width;
                    height += margins.height;

                    if (width > frameSize.width) {
                        scaleFactor.x = frameSize.width / width;
                    }

                    if (height > frameSize.height) {
                        scaleFactor.y = frameSize.height / height;
                    }
                }
                return Math.min(scaleFactor.x, scaleFactor.y);
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
                    controls.$wrappedElement = $(element);
                    controls.$wrappedElementContainer = controls.$wrappedElement.parent();
                    controls.$previewContent.append(controls.$wrappedElement);

                    /**
                     * @event wrap
                     * @param {jQuery} $wrappedElement - The element that has been wrapped
                     */
                    this.trigger('wrap', controls.$wrappedElement);
                }

                return this;
            },

            /**
             * Unwraps the previewed content from the previewer frame
             * @returns {devicesPreviewer}
             * @fires unwrap after the element has been unwrapped
             */
            unwrap: function unwrap() {
                var $wasWrappedElement;
                if (this.is('rendered') && controls.$wrappedElement) {
                    $wasWrappedElement = controls.$wrappedElement;

                    // restore current wrapped element to its previous place
                    controls.$wrappedElementContainer.append(controls.$wrappedElement);
                    controls.$wrappedElement = null;
                    controls.$wrappedElementContainer = null;

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
                var $element = this.getElement();
                controls = {
                    // internal elements
                    $previewContainer: $element.find('.preview-container'),
                    $previewFrame: $element.find('.preview-frame'),
                    $previewContent: $element.find('.preview-content'),

                    // placeholder for the wrapped element
                    $wrappedElement: null,
                    $wrappedElementContainer: null
                };

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
                controls = null;
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
