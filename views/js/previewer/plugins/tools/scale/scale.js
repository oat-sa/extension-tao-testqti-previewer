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
    'tpl!taoQtiTestPreviewer/previewer/plugins/tools/scale/desktop-devices',
    'tpl!taoQtiTestPreviewer/previewer/plugins/tools/scale/scale-wrapper'
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
) {
    'use strict';

    var overlay,
        orientation = 'landscape',
        DEFAULT_TYPE = 'standard',
        //todo: update selected device
        selectedDevice = 'standard',
        deviceTypes = {
            desktop: __('Desktop preview'),
            mobile: __('Mobile preview'),
            standard: __('Actual size')
        };
    var devicesToControls = {
        'mobile': '$mobileDevices',
        'desktop': '$desktopDevices',
        'standard': '$deviceTypes'
    };
    var _getPreviewTypes = function () {
        var options = [];
        _(deviceTypes).forEach(function (_deviceLabel, _deviceType) {
            options.push({
                value: _deviceType,
                label: _deviceLabel,
                selected: selectedDevice === _deviceType
            });
        });
        return options;
    };
    var controls;
    var testRunner;
    var api = {
        /**
         * Tells if the component is enabled
         * @returns {Boolean}
         */
        isPluginAllowed: function isPluginAllowed() {
            var config = testRunner.getConfig();
            return !config.readOnly;
        },
        /**
         * Show particular control and hide other except of the default visible control
         * @param {String} controlName - name of the particular control to show
         * @param {String} action - name of the particular control to show - [hide,show]
         */
        toggleControl: function toggleControl(controlName) {
            var $control = controls[controlName];

            if($control){
                _.forEach(controls, function ($control, name) {
                    if( name === controlName || name === devicesToControls[DEFAULT_TYPE]){
                        hider.show($control);
                    } else{
                        hider.hide($control);
                    }
                });

            }else{
                throw new TypeError('toggleControl method MUSt have parameter "controlName"');
            }
        },
        /**
         * manipulates controls visibility on page according to given preview type
         * @param {String} deviceType - type of supposed device screen ['mobile','desktop', 'standard']
         */
        composeControlsByDeviceType: function composeControlsByDeviceType(deviceType){
            var controlName = devicesToControls[deviceType] ? devicesToControls[deviceType] : DEFAULT_TYPE;
            this.toggleControl(controlName);
        },
        /**
         * change device imitation frame
         * @param {String} deviceType
         * @param {Boolean} isReplacing param shows whether to to replace previously made wrapper
         */
        changeDeviceFrame: function changeDeviceFrame(deviceType, isReplacing) {
            if(isReplacing && controls.$scaleWrapper){
                this.removeDeviceFrame();
            }
            var $content = testRunner.getAreaBroker().getContentArea();
            var $children = $content.children().detach();
            controls.$scaleWrapper = $(scaleWrapperTpl({
                type:deviceType
            }));
            controls.$scaleWrapper.find('.preview-item-container').append($children);
            $content.append(controls.$scaleWrapper);

        },
        /**
         * removes previewer content ot its initial state without device frame and scaling (Actual size )
         */
        removeDeviceFrame: function removeDeviceFrame() {
            var $children = controls.$scaleWrapper.find('.preview-item-container').children().detach();
            var $content = testRunner.getAreaBroker().getContentArea();
            $content.empty();
            $content.append($children);
            controls.$scaleWrapper = null;
        }
    };

    return pluginFactory({

        name: 'scale',

        /**
         * Initialize the plugin (called during runner's init)
         */
        init: function init() {
            var self = this;
            testRunner = this.getTestRunner();


            controls = this.controls = {
                $deviceTypes: $(previewTypesTpl({
                    items: _getPreviewTypes(),
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
             *  @event preview-scale-device-type
             */
           this.controls.$deviceTypes.get(0).addEventListener('change', function (event) {
               var element = event.target;
               api.composeControlsByDeviceType(element.value);
               if(element.value === DEFAULT_TYPE){
                   api.removeDeviceFrame();
               }else{
                   api.changeDeviceFrame(element.value, true);
               }
               selectedDevice = element.value;
               self.trigger('preview-scale-device-type', element.value);
           });

            /**
             *  when user changes mobile device model he/she want to test item in
             *  @event preview-scale-device-mobile-type
             */
            this.controls.$mobileDevices.children('.mobile-device-selector').get(0).addEventListener('change', function (event) {
                var element = event.target;
                self.trigger('preview-scale-device-mobile-type', element.value);
            });

            /**
             *  when user changes mobile device screen orientation he/she want to test item in
             *  @event preview-scale-device-mobile-orientation-type
             */
            this.controls.$mobileDevices.children('.mobile-orientation-selector').get(0).addEventListener('change', function (event) {
                var element = event.target;
                self.trigger('preview-scale-device-mobile-orientation-type', element.value);
            });

            /**
             *  when user changes mobile device model he/she want to test item in
             *  @event preview-scale-device-desktop-type
             */
            this.controls.$desktopDevices.get(0).addEventListener('change', function (event) {
                var element = event.target;
                self.trigger('preview-scale-device-desktop-type', element.value);
            });

            this.disable();

            testRunner
                .on('render', function () {
                    if (api.isPluginAllowed()) {
                        api.composeControlsByDeviceType(DEFAULT_TYPE);
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
            var $headerControls = this.getAreaBroker().getHeaderArea();
            $headerControls.append(this.controls.$deviceTypes);
            $headerControls.append(this.controls.$mobileDevices);
            $headerControls.append(this.controls.$desktopDevices);

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
