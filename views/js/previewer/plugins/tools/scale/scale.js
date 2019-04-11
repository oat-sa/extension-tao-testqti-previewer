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
    'i18n',
    'ui/hider',
    'taoTests/runner/plugin',
    'taoQtiTestPreviewer/previewer/utils/devices',
    'tpl!taoQtiTestPreviewer/previewer/plugins/tools/scale/preview-types',
    'tpl!taoQtiTestPreviewer/previewer/plugins/tools/scale/mobile-devices',
    'tpl!taoQtiTestPreviewer/previewer/plugins/tools/scale/desktop-devices',
    'tpl!taoQtiTestPreviewer/previewer/plugins/tools/scale/scale-wrapper',
    'taoQtiTestPreviewer/previewer/plugins/tools/scale/responsive-design-testing',
    'ui/selecter',
    'css!taoItemsCss/preview'
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
    scaleWrapperTpl,
    responsiveDesignTesting,
    selecter
) {
    'use strict';


    return pluginFactory({

        name: 'scale',
        install: function install(){
            /**
             * Tells if the component is enabled
             * @returns {Boolean}
             */
            this.isPluginAllowed = function isPluginAllowed() {

                var config = this.getTestRunner().getConfig();
                return !config.readOnly;
            };

            this.api = responsiveDesignTesting(this);
            /**
             * device types list to use from "select device type" select-box.
             * @type {*[]}
             */
            this.deviceTypes = [
                {
                    value: 'desktop',
                    label: __('Desktop preview'),
                    selected: false
                },
                {
                    value: 'mobile',
                    label: __('Mobile preview'),
                    selected: false
                },
                {
                    value: 'standard',
                    label: __('Actual size'),
                    selected: true
                },
            ];
        },
        /**
         * Initialize the plugin (called during runner's init)
         */
        init: function init() {
            var self = this;

            this.controls = {
                $deviceTypes: $(previewTypesTpl({
                    items: this.deviceTypes,
                })),
                $mobileDevices: $(mobileDevicesTpl({
                    items: devices.byType('mobile'),
                })),
                $desktopDevices: $(desktopDevicesTpl({
                    items: devices.byType('desktop'),
                }))
            };


            /**
             *  when user changes device type he/she want to test item in
             *  @event scale#preview-scale-device-type
             */
            this.controls.$deviceTypes.on('change', function (event) {
               self.api.onDeviceTypeChange(event.target);
               self.trigger('preview-scale-device-type', event.target.value);

            });

            /**
             *  when user changes mobile device model he/she want to test item in
             *  @event scale#preview-scale-device-mobile-type
             */
            this.controls.$mobileDevices.children('.mobile-device-selector').on('change', function (event) {
                self.api.onDeviceChange(event.target);
                self.trigger('preview-scale-device-mobile-type', event.target.value);

            });

            /**
             *  when user changes mobile device screen orientation user want to test item in
             *  @event scale#preview-scale-device-mobile-orientation-type
             */
            this.controls.$mobileDevices.children('.mobile-orientation-selector').on('change', function (event) {
                self.api.onOrientationChange(event.target);
                self.trigger('preview-scale-device-mobile-orientation-type', event.target.value);
            });

            /**
             *  when user changes mobile device model he/she want to test item in
             *  @event scale#preview-scale-device-desktop-type
             */
            this.controls.$desktopDevices.on('change', function (event) {
                self.api.onDeviceChange(event.target);
                self.trigger('preview-scale-device-desktop-type', event.target.value);
            });

            /**
             * adjust device frame position and size when browser size change
             */
            $(window).on('resize orientationchange', function () {
                if(self.controls.$scaleWrapper){
                    self.api.setupScreenSize();
                    self.api.updateStandardPreviewSize();
                    self.api.scaleFrame();
                }
            });

            this.disable();

        this.getTestRunner()
                .on('render', function () {
                    var defaultType = self.api.defaultType();
                    if (self.isPluginAllowed()) {
                        self.api.composeControlsByDeviceType(defaultType);
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
         * Rendeds plugins controlls on proper place
         */
        render: function render() {
            var $headerControls = this.getAreaBroker().getHeaderArea();

            $headerControls.append(this.controls.$deviceTypes);
            $headerControls.append(this.controls.$mobileDevices);
            $headerControls.append(this.controls.$desktopDevices);

            selecter($headerControls);

        },

        /**
         * Called during the runner's destroy phase
         * clears all controls tied to applications DOM
         */
        destroy: function destroy() {
            _.forEach(this.controls, function ($el) {
                $el.remove();
            });
            this.controls = null;
        },

        /**
         * Enable default controls
         */
        enable: function enable() {
            this.controls.$deviceTypes.removeProp('disabled').removeClass('disabled');
        },

        /**
         * Disable default controls
         */
        disable: function disable() {
            this.controls.$deviceTypes.prop('disabled', true).addClass('disabled');
        },

        /**
         * Show default controls
         */
        show: function show() {
            hider.show(this.controls.$deviceTypes);
        },

        /**
         * Hide default controls
         */
        hide: function hide() {
            hider.hide(this.controls.$deviceTypes);

        }



    });
});
