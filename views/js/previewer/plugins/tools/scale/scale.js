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
    'tpl!taoQtiTestPreviewer/previewer/plugins/tools/scale/scale-wrapper',
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
    selecter
) {
    'use strict';


    return pluginFactory({

        name: 'scale',

        /**
         * Initialize the plugin (called during runner's init)
         */
        init: function init() {
            var self = this;
            var orientation = 'landscape';
            var DEFAULT_TYPE = 'standard';
            var selectedDevice = 'standard';

            var deviceTypes = [
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

            var screenSize = {
                width: $(window).innerWidth(),
                height: $(window).innerHeight()
            };

            var sizeSettings = {
                width: 0,
                height: 0
            };

            var devicesToControls = {
                'mobile': '$mobileDevices',
                'desktop': '$desktopDevices',
                'standard': '$deviceTypes'
            };

            var testRunner = this.getTestRunner();

            this.api = {
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
                 */
                toggleControl: function toggleControl(controlName) {
                    var $control = self.controls[controlName];
        
                    if($control){
                        _.forEach(self.controls, function ($control, name) {
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
                    var $content;
                    var $children;
        
                    if(isReplacing && self.controls.$scaleWrapper){
                        this.removeDeviceFrame();
                    }
        
                    $content = testRunner.getAreaBroker().getContentArea();
                    $children = $content.children().detach();
        
                    self.controls.$scaleWrapper = $(scaleWrapperTpl({
                        type:deviceType
                    }));
        
                    self.controls.$scaleWrapper.find('.preview-item-container').append($children);
                    self.controls.$scaleWrapper.css('display', 'block');
        
                    $content.append(self.controls.$scaleWrapper);
        
                    this.positionPreview();
        
                },
        
                /**
                 * removes previewer content ot its initial state without device frame and scaling (Actual size )
                 * @private
                 */
                removeDeviceFrame: function removeDeviceFrame() {
                    var $children = self.controls.$scaleWrapper.find('.preview-item-container').children().detach();
                    var $content = testRunner.getAreaBroker().getContentArea();
        
                    $content.empty();
                    $content.append($children);
                    self.controls.$scaleWrapper = null;
                },
        
                /**
                 * Setting up screen size according preview viewport size
                 * @private
                 */
                setupScreenSize: function setupScreenSize() {
                    screenSize = {
                        width: self.controls.$scaleWrapper.innerWidth(),
                        height: self.controls.$scaleWrapper.innerHeight()
                    };
                },
        
                /**
                 * Set the size for the standard preview
                 * @param height
                 * @private
                 */
                updateStandardPreviewSize: function updateStandardPreviewSize(height) {
                    var $selector = self.controls.$mobileDevices.children('.mobile-device-selector');
                    var values = ($selector.val() ? $selector.val().split(',') : '') || [$(window).width().toString()];
                    var valueStr = values.join(',');
        
                    values[1] = height || values[1] || '1200';
        
                    $selector.val(valueStr).data('value', valueStr);
                },
        
                /**
                 * Compute scale factor based on screen size and device size
                 * @private
                 */
                computeScaleFactor: function computeScaleFactor() {
                    var scaleValues = {
                        x: 1,
                        y: 1
                    };
        
                    // 150/200 = device frames plus toolbar plus console plus some margin
        
                    var requiredSize = {
                        width: sizeSettings.width + 150,
                        height: sizeSettings.height + 275
                    };
        
                    if (requiredSize.width > screenSize.width) {
                        scaleValues.x = screenSize.width / requiredSize.width;
                    }
        
                    if (requiredSize.height > screenSize.height) {
                        scaleValues.y = screenSize.height / requiredSize.height;
                    }
        
                    return Math.min(scaleValues.x, scaleValues.y);
                },
        
                /**
                 * Scale devices down to fit screen
                 * @private
                 */
                scaleFrame: function scale() {
                    var scaleFactor = this.computeScaleFactor();
        
                    var $scaleContainer = self.controls.$scaleWrapper.find('.preview-scale-container'),
                        _scaleFactor = selectedDevice === 'standard' ? 1 : scaleFactor,
                        containerScaledWidth = $scaleContainer.width() * _scaleFactor,
                        left = (screenSize.width - containerScaledWidth) / 2;
        
                    $scaleContainer.css({
                        left: left > 0 ? left : 0,
                        '-webkit-transform': 'scale(' + _scaleFactor + ',' + _scaleFactor + ')',
                        '-ms-transform': 'scale(' + _scaleFactor + ',' + _scaleFactor + ')',
                        'transform': 'scale(' + _scaleFactor + ',' + _scaleFactor + ')',
                        '-webkit-transform-origin': '0 0',
                        '-ms-transform-origin': '0 0',
                        'transform-origin': '0 0'
                    });
                },
        
                /**
                 * position the preview depending on the height of the toolbar
                 * @private
                 */
                positionPreview: function positionPreview() {
                    var topBarHeight = testRunner.getAreaBroker().getHeaderArea().outerHeight();
        
                    self.controls.$scaleWrapper.css('top', topBarHeight+ 'px');
                    self.controls.$scaleWrapper.css('max-height', 'calc(100vh - ' + topBarHeight + 'px )');
                },
        
                /**
                 * sets orientation of selected device globally and does some configuration around
                 * @param {String} newOrientation - Device's orientation  could be: 'landscape' or 'portrait'
                 * @private
                 */
                setOrientation: function setOrientation(newOrientation) {
                    var re;
                    var previewFrame;
        
                    if (newOrientation === orientation) {
                        return;
                    }
        
                    re = new RegExp(orientation, 'g');
                    previewFrame = self.controls.$scaleWrapper.find('.preview-outer-frame')[0];
                    previewFrame.className = previewFrame.className.replace(re, newOrientation);
                    orientation = newOrientation;
                },
        
                /**
                 * Configures screen size configuration state according to passed value from affected control
                 * and calls this.scaleFrame() after all.
                 * @param {Event} event - event object related to affected control.
                 * @private
                 */
                onDeviceChange: function onDeviceChange(event){
                    var element = event.target;
                    var type = selectedDevice;
                    var val = element.value.split(',');
                    var i = val.length;
                    var container = self.controls.$scaleWrapper.find('.' + type + '-preview-container');
        
                    while (i--) {
                        val[i] = parseFloat(val[i]);
                    }
                    if (type === 'mobile' && orientation === 'portrait') {
                        sizeSettings = {
                            width: val[1],
                            height: val[0]
                        };
                    }
                    else {
                        sizeSettings = {
                            width: val[0],
                            height: val[1]
                        };
                    }
        
                    if (sizeSettings.width === container.width() && sizeSettings.height === container.height()) {
                        return false;
                    }
        
                    container.css(sizeSettings);
                    this.scaleFrame();
                },
        
                /**
                 * Configures selected device's orientation configuration state according to passed value from affected control
                 * and calls this.setOrientation(newOrientation) and this.scaleFrame() after all.
                 * @param {Event} event - event object related to affected control.
                 * @private
                 */
                onOrientationChange: function onOrientationChange(event) {
                    var element = event.target;
                    var container = self.controls.$scaleWrapper.find('.' + selectedDevice + '-preview-container');
                    var newOrientation = element.value;
        
                    if (newOrientation === orientation) {
                        return false;
                    }
                    sizeSettings = {
                        height: container.width(),
                        width: container.height()
                    };
        
                    container.css(sizeSettings);
        
                    this.setOrientation(newOrientation);
                    this.scaleFrame();
                },
                
                /**
                 * Configures selected device type on which depends all other parts of the plugin
                 * decides whether it needs to draw device frame around item content and scale it accordingly
                 * @param {Event} event - event object related to affected control.
                 * @private
                 */
                onDeviceTypeChange: function onDeviceTypeChange(event) {
                    var element = event.target;
        
                    selectedDevice = element.value;
        
                    this.composeControlsByDeviceType(element.value);
        
                    if(element.value === DEFAULT_TYPE){
                        this.removeDeviceFrame();
                    }else{
                        this.changeDeviceFrame(element.value, true);
                        this.scaleFrame();
                        this.setupScreenSize();
                        if (element.value === 'mobile'){
                            self.controls.$mobileDevices.children('.mobile-device-selector').trigger('change');
                        } else if( element.value === 'desktop'){
                            self.controls.$desktopDevices.trigger('change');
                        }
        
                    }
                }
        
            };

            this.controls = {
                $deviceTypes: $(previewTypesTpl({
                    items: deviceTypes,
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
               self.api.onDeviceTypeChange(event);
               self.trigger('preview-scale-device-type', event.target.value);

            });

            /**
             *  when user changes mobile device model he/she want to test item in
             *  @event scale#preview-scale-device-mobile-type
             */
            this.controls.$mobileDevices.children('.mobile-device-selector').on('change', function (event) {
                self.api.onDeviceChange(event);
                self.trigger('preview-scale-device-mobile-type', event.target.value);

            });

            /**
             *  when user changes mobile device screen orientation user want to test item in
             *  @event scale#preview-scale-device-mobile-orientation-type
             */
            this.controls.$mobileDevices.children('.mobile-orientation-selector').on('change', function (event) {
                self.api.onOrientationChange(event);
                self.trigger('preview-scale-device-mobile-orientation-type', event.target.value);
            });

            /**
             *  when user changes mobile device model he/she want to test item in
             *  @event scale#preview-scale-device-desktop-type
             */
            this.controls.$desktopDevices.on('change', function (event) {
                self.api.onDeviceChange(event);
                self.trigger('preview-scale-device-desktop-type', event.target.value);
            });

            /**
             * adjust device frame position and size when browser size change
             */
            $(window).on('resize orientationchange', function () {
                if(self.controls.$scaleWrapper){
                    this.api.setupScreenSize();
                    this.api.updateStandardPreviewSize();
                    this.api.scaleFrame();
                }
            });

            this.disable();

            testRunner
                .on('render', function () {
                    if (self.api.isPluginAllowed()) {
                        self.api.composeControlsByDeviceType(DEFAULT_TYPE);
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
