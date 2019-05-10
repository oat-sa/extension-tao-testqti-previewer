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
 * Copyright (c) 2019 Open Assessment Technologies SA;
 */
/**
 * Helper to work with screen values and mobile devices list
 * for "select device" select-box  on any test-item preview  page
 * for example using scale plugin app/taoQtiTestPreviewer/views/js/previewer/plugins/tools/scale/scale.js
 *
 * @author Dieter Raber <dieter@taotesting.com>
 * @author Pavel Hendelman <pavel@taotesting.com>
 */
define([
    'lodash',
    'json!taoQtiTestPreviewer/previewer/resources/devices.json'
], function (
    _,
    deviceList
) {
    'use strict';

    /**
     * @typedef {Object} deviceScreen
     * @property {String} value - The selector's value to use
     * @property {String} label - The label to display in the selector
     * @property {Number} width - The width of the screen
     * @property {Number} height - The height of the screen
     */

    /**
     * Translation map to convert a device type to a collection's name in the provided list.
     * @type {Object}
     */
    var deviceTypeMap = {
        'mobile': 'tablets',
        'desktop': 'screens'
    };

    /**
     * Helpers to get the list of devices
     */
    var devicesHelper = {
        /**
         * Gets the list of devices to test item through. This list is meant to be used by a selector.
         * @param {String} type - The type of device from the list ['mobile', 'desktop']
         * @returns {deviceScreen[]} - The list of devices to test item through, filtered by the provided type
         */
        getDevicesByType : function getDevicesByType(type) {
            /*
             * @todo
             * The device list is currently based on the devices found on the Chrome emulator.
             * This is not ideal and should be changed in the future.
             * I have http://en.wikipedia.org/wiki/List_of_displays_by_pixel_density in mind but we
             * will need to figure what criteria to apply when generating the list.
             */
            var key = deviceTypeMap[type];

            return _.map(deviceList[key] || [], function mapDeviceData(device, identifier) {
                return {
                    value: identifier,
                    label: device.label,
                    width: device.width,
                    height: device.height
                };
            });
        },

        /**
         * Gets the list of mobile devices
         * @returns {deviceScreen[]} - The list of mobile devices to test item through
         */
        getMobileDevices: function getMobileDevices() {
            return devicesHelper.getDevicesByType('mobile');
        },

        /**
         * Gets the list of desktop devices
         * @returns {deviceScreen[]} - The list of desktop devices to test item through
         */
        getDesktopDevices: function getDesktopDevices() {
            return devicesHelper.getDevicesByType('desktop');
        }
    };

    return devicesHelper;
});
