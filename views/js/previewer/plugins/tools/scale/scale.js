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
 * Copyright (c) 2018 (original work) Open Assessment Technologies SA ;
 */

/**
 * Test Previewer Responsive Scale plugin : Scale
 *
 */
define([
    'jquery',
    'lodash',
    'i18n',
    'ui/hider',
    'taoTests/runner/plugin',
    'taoQtiTestPreviewer/previewer/utils/devices',
    'tpl!taoQtiTestPreviewer/previewer/plugins/tools/scale/preview-types',
    'tpl!taoQtiTestPreviewer/previewer/plugins/tools/scale/mobile-devices',
    'tpl!taoQtiTestPreviewer/previewer/plugins/tools/scale/desktop-devices'
], function (
    $,
    _,
    __,
    hider,
    pluginFactory,
    devices,
    previewTypesTpl,
    mobileDevicesTpl,
    desktopDevicesTpl,
) {
    'use strict';

    var overlay,
        orientation = 'landscape',
        previewType = 'standard',
        previewTypes = {
            desktop: __('Desktop preview'),
            mobile: __('Mobile preview'),
            standard: __('Actual size')
        };
    var _getPreviewTypes = function () {
        var options = [];
        _(previewTypes).forEach(function (_previewLabel, _previewType) {
            options.push({
                value: _previewType,
                label: _previewLabel,
                selected: previewType === _previewType
            });
        });
        return options;
    };

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





            this.controls = {
                $previewTypes: $(previewTypesTpl({
                    items: _getPreviewTypes(),
                })),
                $mobileDevices: $(mobileDevicesTpl({
                    items: devices.byType('mobile'),
                })),
                $desktopDevices: $(desktopDevicesTpl({
                    items: devices.byType('desktop'),
                })),
            };

            // this.controls.$scale.on('click', function (e) {
            //     e.preventDefault();
            //     console.log("selectbox clicked");
            //     // if (self.getState('enabled') !== false) {
            //     //     self.disable();
            //     //     testRunner.trigger('submititem');
            //     // }
            // });


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
                .on('enablenav', function () {
                    self.enable();
                })
                .on('disablenav', function () {
                    self.disable();
                });
        },

        /**
         * Called during the runner's render phase
         */
        render: function render() {

            //attach the element to the navigation area
            var $controls = this.getAreaBroker().getHeaderArea();
            $controls.append(this.controls.$previewTypes);
            $controls.append(this.controls.$mobileDevices);
            $controls.append(this.controls.$desktopDevices);
        },

        /**
         * Called during the runner's destroy phase
         */
        destroy: function destroy() {
            _.forEach(this.controls, function ($el) {
                $el.remove();
            });
            this.controls = null;
        },

        /**
         * Enable the button
         */
        enable: function enable() {
            this.controls.$previewTypes.removeProp('disabled').removeClass('disabled');
        },

        /**
         * Disable the button
         */
        disable: function disable() {
            this.controls.$previewTypes.prop('disabled', true).addClass('disabled');
        },

        /**
         * Show the button
         */
        show: function show() {
            hider.show(this.controls.$previewTypes);
        },

        /**
         * Hide the button
         */
        hide: function hide() {
            _.forEach(this.controls, hider.hide);
        }
    });
});
