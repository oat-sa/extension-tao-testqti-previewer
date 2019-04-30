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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * Test Previewer Responsive Scale plugin : Scale
 */
define([
    'jquery',
    'lodash',
    'lib/uuid',
    'util/namespace',
    'taoTests/runner/plugin',
    'taoQtiTestPreviewer/previewer/plugins/tools/scale/component/devicesPreviewer',
    'taoQtiTestPreviewer/previewer/plugins/tools/scale/component/devicesSelector'
], function (
    $,
    _,
    uuid,
    namespaceHelper,
    pluginFactory,
    devicesPreviewerFactory,
    devicesSelectorFactory
) {
    'use strict';

    return pluginFactory({

        name: 'scale',

        /**
         * Initialize the plugin (called during runner's init)
         */
        init: function init() {
            var self = this;
            var testRunner = this.getTestRunner();

            /**
             * Tells if the component is enabled
             * @returns {Boolean}
             */
            function isPluginAllowed() {
                var config = testRunner.getConfig();
                return !config.readOnly;
            }

            // generate unique id for global events
            this.nsId = this.getName() + uuid(6);

            if (!isPluginAllowed()) {
                this.hide();
            }

            this.disable();

            testRunner
                .on('render', function () {
                    if (isPluginAllowed()) {
                        self.show();
                    } else {
                        self.hide();
                    }
                })
                .on('resizeitem', function (size, orientation, type) {
                    if (self.devicesPreviewer) {
                        self.devicesPreviewer
                            .setDeviceType(type)
                            .setDeviceOrientation(orientation)
                            .setDeviceWidth(size && size.width)
                            .setDeviceHeight(size && size.height)
                            .previewDevice();
                    }
                })
                .on('enablenav', function () {
                    self.enable();
                })
                .on('disablenav', function () {
                    self.disable();
                });
        },

        /**
         * Called during the runner's render phase
         * Renders plugins controls on proper place
         */
        render: function render() {
            var self = this;
            var testRunner = this.getTestRunner();
            var areaBroker = this.getAreaBroker();

            /**
             * Triggers an item resize based on the current selected device
             */
            function resizeItem() {
                if (self.devicesSelector && self.getState('enabled')) {
                    /**
                     * @event resizeitem
                     * @param {deviceScreen} deviceData - The device data, containing width and height
                     * @param {String} orientation - The device orientation
                     * @param {String} type - The type of device
                     */
                    testRunner.trigger(
                        'resizeitem',
                        self.devicesSelector.getDeviceData(),
                        self.devicesSelector.getOrientation(),
                        self.devicesSelector.getType()
                    );
                }
            };

            /**
             * adjust device frame position and size when browser size change
             */
            $(window).on(namespaceHelper.namespaceAll('resize orientationchange', this.nsId), _.throttle(function () {
                if (self.devicesSelector && self.devicesSelector.isDeviceMode()) {
                    resizeItem();
                }
            }, 50));

            return Promise.all([
                new Promise(function (resolve) {
                    self.devicesSelector = devicesSelectorFactory(areaBroker.getHeaderArea())
                        .on('ready', function () {
                            if (!self.getState('enabled')) {
                                this.disable();
                            }

                            this.on('typechange', function () {
                                if (!this.isDeviceMode()) {
                                    resizeItem();
                                }
                            });

                            this.on('devicechange orientationchange', function () {
                                resizeItem();
                            });

                            resolve();
                        });
                }),
                new Promise(function (resolve) {
                    self.devicesPreviewer = devicesPreviewerFactory(areaBroker.getArea('contentWrapper'))
                        .on('ready', function () {
                            this.wrap(areaBroker.getContentArea());
                            resolve();
                        });
                })
            ]);
        },

        /**
         * Called during the runner's destroy phase
         * clears all controls tied to applications DOM
         * detaches the global events
         */
        destroy: function destroy() {
            if (this.nsId) {
                $(window).off('.' + this.nsId);
            }
            if (this.devicesSelector) {
                this.devicesSelector.destroy();
            }
            if (this.devicesPreviewer) {
                this.devicesPreviewer.destroy();
            }
            this.devicesSelector = null;
            this.devicesPreviewer = null;
        },

        /**
         * Enable default controls
         */
        enable: function enable() {
            if (this.devicesSelector) {
                this.devicesSelector.enable();
            }
        },

        /**
         * Disable default controls
         */
        disable: function disable() {
            if (this.devicesSelector) {
                this.devicesSelector.disable();
            }
        },

        /**
         * Show default controls
         */
        show: function show() {
            if (this.devicesSelector) {
                this.devicesSelector.show();
            }
        },

        /**
         * Hide default controls
         */
        hide: function hide() {
            if (this.devicesSelector) {
                this.devicesSelector.hide();
            }
        }
    });
});
