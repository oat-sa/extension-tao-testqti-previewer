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
    'taoQtiTestPreviewer/previewer/plugins/tools/scale/component/devicesSelector'
], function (
    $,
    _,
    uuid,
    namespaceHelper,
    pluginFactory,
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

            // generate unite id for global events
            this.nsId = this.getName() + uuid(6);

            /**
             * Triggers an item resize based on the current selected device
             */
            this.resizeItem = function resizeItem() {
                if (self.devicesSelector) {
                    testRunner.trigger(
                        'resizeitem',
                        self.devicesSelector.getType(),
                        self.devicesSelector.getDeviceData(),
                        self.devicesSelector.getOrientation()
                    );
                }
            };

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
                .on('resizeitem', function (type, size, orientation) {
                    // todo
                    console.log('resizeitem', type, size, orientation);
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
         * Rendeds plugins controlls on proper place
         */
        render: function render() {
            var self = this;
            var $headerControls = this.getAreaBroker().getHeaderArea();

            /**
             * adjust device frame position and size when browser size change
             */
            $(window).on(namespaceHelper.namespaceAll('resize orientationchange', this.nsId), _.throttle(function () {
                if (self.devicesSelector && self.devicesSelector.isDeviceMode()) {
                    self.resizeItem();
                }
            }, 50));

            return new Promise(function (resolve) {
                self.devicesSelector = devicesSelectorFactory($headerControls)
                    .on('ready', function () {
                        if (!self.getState('enabled')) {
                            this.disable();
                        }

                        this.on('typechange', function () {
                            if (!this.isDeviceMode()) {
                                self.resizeItem();
                            }
                        });

                        this.on('devicechange orientationchange', function () {
                            self.resizeItem();
                        });

                        resolve();
                    });
            });
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
            this.devicesSelector = null;
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
