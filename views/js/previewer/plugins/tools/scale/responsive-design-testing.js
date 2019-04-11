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

define([
    'lodash',
    'ui/hider',
    'tpl!taoQtiTestPreviewer/previewer/plugins/tools/scale/scale-wrapper',
], function (_, hider, scaleWrapperTpl) {
    'use strict';

    /**
     * fabric pattern to produce api for scale plugin.
     * describes functionality for testing layout of test-item on different emulated screen sizes (devices)
     * @param {Object} context - context of the plugin - for getting itemRunner instance and controls from it
     */
    return function responsiveDesignTesting(context) {
        var orientation = 'landscape';
        var defaultName = 'standard';
        var selectedDevice = 'standard';



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

        var testRunner = context.getTestRunner();

        var api = {
            /**
             * Show particular control and hide other except of the default visible control
             * @param {String} controlName - name of the particular control to show
             */
            toggleControl: function toggleControl(controlName) {
                var $control = context.controls[controlName];

                if($control){
                    _.forEach(context.controls, function ($control, name) {
                        if( name === controlName || name === devicesToControls[defaultName]){
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
                var controlName = devicesToControls[deviceType] ? devicesToControls[deviceType] : defaultName;

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

                if(isReplacing && context.controls.$scaleWrapper){
                    this.removeDeviceFrame();
                }

                $content = testRunner.getAreaBroker().getContentArea();
                $children = $content.children().detach();

                context.controls.$scaleWrapper = $(scaleWrapperTpl({
                    type:deviceType
                }));

                context.controls.$scaleWrapper.find('.preview-item-container').append($children);
                context.controls.$scaleWrapper.css('display', 'block');

                $content.append(context.controls.$scaleWrapper);

                this.positionPreview();

            },

            /**
             * removes previewer content ot its initial state without device frame and scaling (Actual size )
             * @private
             */
            removeDeviceFrame: function removeDeviceFrame() {
                var $children = context.controls.$scaleWrapper.find('.preview-item-container').children().detach();
                var $content = testRunner.getAreaBroker().getContentArea();

                $content.empty();
                $content.append($children);
                context.controls.$scaleWrapper = null;
            },

            /**
             * Setting up screen size according preview viewport size
             * @private
             */
            setupScreenSize: function setupScreenSize() {
                screenSize = {
                    width: context.controls.$scaleWrapper.innerWidth(),
                    height: context.controls.$scaleWrapper.innerHeight()
                };
            },

            /**
             * Set the size for the standard preview
             * @param height
             * @private
             */
            updateStandardPreviewSize: function updateStandardPreviewSize(height) {
                var $selector = context.controls.$mobileDevices.children('.mobile-device-selector');
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

                var $scaleContainer = context.controls.$scaleWrapper.find('.preview-scale-container'),
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

                context.controls.$scaleWrapper.css('top', topBarHeight+ 'px');
                context.controls.$scaleWrapper.css('max-height', 'calc(100vh - ' + topBarHeight + 'px )');
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
                previewFrame = context.controls.$scaleWrapper.find('.preview-outer-frame')[0];
                previewFrame.className = previewFrame.className.replace(re, newOrientation);
                orientation = newOrientation;
            },

            /**
             * Configures screen size configuration state according to passed value from affected control
             * and calls this.scaleFrame() after all.
             * @param {HTMLDocument} element - select-box element DOM object of affected control.
             * @private
             */
            onDeviceChange: function onDeviceChange(element){
                var type = selectedDevice;
                var val = element.value.split(',');
                var i = val.length;
                var container = context.controls.$scaleWrapper.find('.' + type + '-preview-container');

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
             * @param {HTMLDocument} element - select-box element DOM object of affected control.
             */
            onOrientationChange: function onOrientationChange(element) {
                var container = context.controls.$scaleWrapper.find('.' + selectedDevice + '-preview-container');
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
             * @param {HTMLDocument} element - select-box element DOM object of affected control.
             */
            onDeviceTypeChange: function onDeviceTypeChange(element) {

                selectedDevice = element.value;

                this.composeControlsByDeviceType(element.value);

                if(element.value === defaultName){
                    this.removeDeviceFrame();
                }else{
                    this.changeDeviceFrame(element.value, true);
                    this.scaleFrame();
                    this.setupScreenSize();
                    if (element.value === 'mobile'){
                        context.controls.$mobileDevices.children('.mobile-device-selector').trigger('change');
                    } else if( element.value === 'desktop'){
                        context.controls.$desktopDevices.trigger('change');
                    }

                }
            },
            /**
             * passes out default device type name constant value
             * @returns {String}
             */
            defaultType: function defaultType() {
                return _.clone(defaultName);
            }


        };
        
        return api;
    };
});
